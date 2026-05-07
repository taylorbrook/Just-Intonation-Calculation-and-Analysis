---
phase: 02-math-kernel-composition-anchor-mvp
reviewed: 2026-05-04T00:00:00Z
depth: standard
files_reviewed: 32
files_reviewed_list:
  - eslint.config.js
  - observablehq.config.ts
  - vitest.config.ts
  - src/__tests__/dashboard-seed.test.ts
  - src/audio/__tests__/synth.test.ts
  - src/audio/synth.ts
  - src/components/audio-panel.css
  - src/components/audio-panel.ts
  - src/components/play-buttons.css
  - src/components/play-interval.ts
  - src/components/play-scale.ts
  - src/components/ratio-pill.css
  - src/components/ratio-pill.ts
  - src/components/scale-table.css
  - src/components/scale-table.ts
  - src/components/scl-io.css
  - src/components/scl-io.ts
  - src/lib/__tests__/cents.test.ts
  - src/lib/__tests__/commas.test.ts
  - src/lib/__tests__/interval.test.ts
  - src/lib/__tests__/monzo.test.ts
  - src/lib/__tests__/scala.test.ts
  - src/lib/__tests__/scale.test.ts
  - src/lib/cents.ts
  - src/lib/commas.ts
  - src/lib/interval.ts
  - src/lib/monzo.ts
  - src/lib/scala.ts
  - src/lib/scale.ts
  - src/index.md
  - src/pages/syntonic-comma.md
  - src/styles.css
findings:
  critical: 3
  warning: 9
  info: 5
  total: 17
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-04
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

The Phase 2 implementation is broadly disciplined: three-layer architecture is honored, R-01 (BigInt-backed `Fraction`) is enforced by lint, defense-in-depth caps live in the right places (parseScl/scala, Hz clamps, monzo bounds, polyphony), and `textContent` is used everywhere user-controlled strings flow into the DOM. Coverage is solid for the math kernel.

That said, the kernel and IO surface have three correctness defects that ship a bad-input → broken-output (or hang) path:

1. **`Interval.octaveReduce` infinite-loops when the period is ≤ 1.** `Scale` does not validate its period, so any consumer (test, REPL, user-supplied .scl with malformed period override) that constructs `new Scale(intervals, periodLE1)` and calls `.reduce()`, `.rotate()`, or `.octaveReduce()` hangs the tab.
2. **`writeScl` does not sanitize the `description` argument.** Newlines or a leading `!` in the description produce a `.scl` file that fails to parse — silently breaking round-trips for any user-typed description containing a line break or starting with `!`.
3. **`parseScl` / `parseScala` size cap mis-counts UTF-16 code units as bytes.** The error message claims a 1 MB byte cap; the implementation actually checks `string.length` (UTF-16 code units). Real bytes can be 4× larger, weakening the documented DoS guard. This is also user-visible: a non-ASCII description can pass the check while exceeding the documented byte budget.

The remaining warnings cluster around input validation gaps (`Interval(number)` silently truncates large integers, `scaleTable` `precision` not bounded, `playArpeggio` stepSec unbounded, `setTimeout`s not cleared on `dispose`), and a few correctness annoyances (the audio-panel drone closure goes stale across dispose without UI feedback, `dashboard-seed.test.ts` duplicates the seed string instead of importing it).

---

## Critical Issues

### CR-01: `Interval.octaveReduce` infinite-loops when period ≤ 1/1

**File:** `src/lib/interval.ts:78-87` (and propagates through `src/lib/scale.ts:55, 70-71`)
**Issue:**
```ts
octaveReduce(period?: Interval): Interval {
  const p = period ?? new Interval("2/1");
  let f = this.fraction;
  const pf = p.fraction;
  const one = new Fraction(1n, 1n);
  while (f.compare(one) < 0) f = f.mul(pf);   // (A)
  while (f.compare(pf) >= 0) f = f.div(pf);   // (B)
  return new Interval(f);
}
```

If `period = 1/1`: loop (A) is skipped; loop (B) tests `f >= 1`, divides `f / 1 = f` — never terminates.

If `period = 1/2` (or any `pf < 1`): for any `f > pf`, loop (B) divides by a fraction <1, growing `f` unboundedly — never terminates.

`Scale`'s constructor (`src/lib/scale.ts:29-38`) accepts an arbitrary `period` argument with no validation. Any caller — including a future `.scl` parser path that synthesizes a Scale from imported pitches with a buggy last-pitch — can pass a period ≤ 1 and freeze the tab on the next `Scale.reduce()` or `Scale.rotate()`.

This is reachable from user input: `Scale.reduce` calls `iv.octaveReduce(this.period)` for every interval, so a Scale whose last interval is `1/1` (e.g. an empty body that round-trips to a one-element scale, or a malformed `.scl` whose period somehow comes through as 1/1) hangs the dashboard.

**Fix:** Validate the period at the kernel boundary and reject ≤ 1.

```ts
// src/lib/interval.ts
octaveReduce(period?: Interval): Interval {
  const p = period ?? new Interval("2/1");
  if (p.fraction.compare(new Fraction(1n, 1n)) <= 0) {
    throw new RangeError(
      `Interval.octaveReduce: period must be > 1/1 (got ${p.fraction.toFraction()})`,
    );
  }
  // ... rest unchanged
}
```

And mirror the guard in `Scale`'s constructor so the failure is reported at construction time, not at first `.reduce()` call:

```ts
// src/lib/scale.ts
constructor(intervals: readonly Interval[], period?: Interval) {
  if (intervals.length === 0) throw new Error("Scale must have at least one interval");
  const copy = [...intervals];
  Object.freeze(copy);
  this.intervals = copy;
  const p = period ?? copy[copy.length - 1]!;
  if (p.fraction.compare(new Fraction(1n, 1n)) <= 0) {
    throw new RangeError(`Scale: period must be > 1/1 (got ${p.fraction.toFraction()})`);
  }
  this.period = p;
}
```

Add unit tests covering both Interval and Scale.

---

### CR-02: `writeScl` corrupts the file when `description` contains `\n` or starts with `!`

**File:** `src/lib/scala.ts:121-138`
**Issue:**
```ts
export function writeScl(scale: Scale, description?: string): string {
  // ...
  lines.push(`! Generated by Tuning Systems`);
  lines.push(`!`);
  lines.push(description ?? "");        // <-- raw, unsanitized
  lines.push(` ${String(intervals.length)}`);
  // ...
}
```

Two failure modes, both reachable from user input (a textarea, a re-imported `.scl` description, etc.):

1. **Newline in description.** `writeScl(s, "line1\nline2")` emits a description that spans two lines; `parseScl` sees `nonComment[0] = "line1"`, `nonComment[1] = "line2"`, reads `"line2"` as the count, fails the `/^\d+$/` test, and throws `parseScl: invalid pitch count "line2"`.

2. **Description starting with `!`.** `writeScl(s, "!important note")` emits a line that `parseScl`'s comment filter (`raw.startsWith("!")`) silently swallows, shifting the count line into the description slot. The pitch-count line then becomes the description and the first pitch becomes the count, throwing `invalid pitch count "9/8"` (or similar).

Either way, the round-trip invariant (`parseScl(writeScl(s, d)) ≡ {intervals, description}`) breaks for inputs the user can plausibly type. The `dashboard-seed.test.ts` and `round-trip golden` suites do not exercise these inputs, so the test suite passes despite the defect.

This is on the import/export boundary, where it directly affects the user-visible "save my work" workflow.

**Fix:** Sanitize the description on write — newlines must be stripped or the description must be split into multiple `!`-prefixed comment lines. Also defang a leading `!`. Suggested:

```ts
function sanitizeDescription(d: string | undefined): string {
  if (!d) return "";
  // Collapse newlines/CR to spaces; the .scl format gives the description ONE line.
  let out = d.replace(/[\r\n]+/g, " ").trim();
  // A leading `!` would be parsed as a comment by readers — prefix with a space.
  if (out.startsWith("!")) out = " " + out;
  return out;
}

export function writeScl(scale: Scale, description?: string): string {
  // ...
  lines.push(`! Generated by Tuning Systems`);
  lines.push(`!`);
  lines.push(sanitizeDescription(description));
  lines.push(` ${String(intervals.length)}`);
  // ...
}
```

Add unit tests:
```ts
it("writeScl sanitizes newlines in description", () => {
  const s = new Scale([new Interval("1/1"), new Interval("2/1")]);
  const txt = writeScl(s, "line1\nline2");
  expect(() => parseScl(txt)).not.toThrow();
  expect(parseScl(txt).description).toBe("line1 line2");
});
it("writeScl defangs description starting with !", () => {
  const s = new Scale([new Interval("1/1"), new Interval("2/1")]);
  const txt = writeScl(s, "!leading-bang");
  expect(parseScl(txt).description).toBe("!leading-bang");
});
```

---

### CR-03: `parseScl` / `parseScala` 1 MB cap counts UTF-16 code units, not bytes

**File:** `src/lib/scala.ts:41, 52-53, 76-78`
**Issue:**
```ts
const MAX_INPUT_BYTES = 1_000_000;
// ...
if (body.length > MAX_INPUT_BYTES) {
  throw new Error(`parseScala: input too large (${String(body.length)} bytes; max 1MB)`);
}
```

`String.prototype.length` returns UTF-16 code-unit count, not byte count. For ASCII input the two coincide; for non-ASCII (commonly: BOM-stripped UTF-8 descriptions, comments in any non-Latin script, or a deliberately constructed adversarial `.scl` full of high-codepoint characters) the actual byte cost can be 2–4× larger than the reported `.length`.

Concretely: a 3 MB UTF-8 file made of 3-byte CJK characters has `string.length === 1_000_000` and would slip past this guard, while the error message tells the user the limit is 1 MB. The DoS guard is real but weaker than advertised, and the user-facing error message is wrong.

The same code path is used in `parseScala` (line 52) and `parseScl` (line 76).

The trust-boundary docstring (`Trust boundary: parseScl/parseScala are the first line of defense against untrusted .scl input`) frames this as a security-relevant cap, so the mismatch matters.

**Fix:** Either (a) measure actual UTF-8 byte length and update the constant name accordingly, or (b) keep `.length` but rename the constant and the error message to reflect "characters."

Option (a) — preferred since the comment in `T-02-10` thinks in bytes:
```ts
const MAX_INPUT_BYTES = 1_000_000;

function utf8ByteLength(s: string): number {
  // Cheap upper bound without TextEncoder allocation: each UTF-16 code unit
  // is at most 3 bytes in UTF-8 (surrogate pairs come out to 4 bytes for the
  // pair, i.e. 2 bytes per code unit), so 3 × length is a safe over-estimate.
  // For exactness, fall back to TextEncoder when the cheap bound is over-cap.
  if (s.length * 3 <= MAX_INPUT_BYTES) return s.length * 3;
  return new TextEncoder().encode(s).byteLength;
}

if (utf8ByteLength(body) > MAX_INPUT_BYTES) {
  throw new Error(`parseScala: input too large (max 1MB UTF-8)`);
}
```

Apply identically in `parseScl`.

---

## Warnings

### WR-01: `Interval` constructor silently truncates `number` inputs > 2^53

**File:** `src/lib/interval.ts:18-35`
**Issue:** `FractionInput` includes `number`, and the constructor passes through to `new Fraction(input)`. fraction.js v5 accepts `number`, but anything beyond `Number.MAX_SAFE_INTEGER` (2^53) is converted lossily before BigInt promotion. The whole point of R-01 is to avoid this — but the public API still accepts it. Callers that grab a value from `xen-dev-utils` (which is Number-backed) and round-trip via `new Interval(n.fraction.valueOf())` will silently lose precision for the exact ratios this project targets.

**Fix:** Drop `number` from the public `FractionInput` (the existing `string`, `bigint`, and `{n,d}` variants cover every legitimate use). If `number` is genuinely needed for the `centsToValue` path in `parseScala`, route it through a named helper so the lossy boundary is explicit:

```ts
export type FractionInput =
  | Fraction
  | string
  | bigint
  | { n: bigint; d: bigint }
  | { n: number; d: number };

// New explicit-lossy boundary for the cents path only.
export function intervalFromCentsValue(centsRatio: number): Interval {
  return new Interval(new Fraction(centsRatio));
}
```

The `parsePitchToken` cents branch then calls `intervalFromCentsValue(ratioFloat)` — same behavior, but now greppable.

---

### WR-02: `audio/synth.ts` does not clear pending arpeggio `setTimeout`s on dispose

**File:** `src/audio/synth.ts:172-199, 226-245`
**Issue:** `playArpeggio` schedules N − 1 `setTimeout` calls, each of which calls `playNoteImpl(hz, noteLen)`. After `dispose()`, the inner `playNoteImpl` short-circuits via `ensure()` (returns false) and is a no-op — so audio does not leak. However:

1. The pending timers themselves are not cleared, which keeps the closure (and the captured `freqs` array) alive until each timer fires. For a 256-note arpeggio at 0.5s step, that's ~128 seconds of held memory per disposed cell.
2. There is no `panic()`-level cancellation either: calling `panic()` mid-arpeggio stops the currently-sounding voices but lets queued timers wake and start fresh voices on a `disposed=false`-but-`panic`-ed synth.

**Fix:** Track the timer IDs in a Set, clear all of them in both `panic()` and `dispose()`:

```ts
const arpTimers = new Set<ReturnType<typeof setTimeout>>();

playArpeggio(freqs, stepSec = DEFAULT_ARP_STEP) {
  // ...
  scheduled.forEach((hz, i) => {
    if (i === 0) {
      playNoteImpl(hz, noteLen);
    } else {
      const t = setTimeout(() => {
        arpTimers.delete(t);
        playNoteImpl(hz, noteLen);
      }, i * stepSec * 1000);
      arpTimers.add(t);
    }
  });
},

panic() {
  if (disposed) return;
  for (const t of arpTimers) clearTimeout(t);
  arpTimers.clear();
  if (synth) synth.allNotesOff();
  activeVoices = 0;
},

dispose() {
  if (disposed) return;
  disposed = true;
  for (const t of arpTimers) clearTimeout(t);
  arpTimers.clear();
  // ... rest unchanged
}
```

---

### WR-03: `playArpeggio` stepSec is unbounded — non-positive or NaN values cause undefined behavior

**File:** `src/audio/synth.ts:172-199`
**Issue:** `stepSec` is taken at face value. Calling `playArpeggio(freqs, 0)` schedules every note at offset 0 (collapsing the arpeggio into a chord, exceeding `maxPolyphony` and potentially clipping). `stepSec = -1` produces `setTimeout(..., -1000)` which the browser clamps to 0 — same outcome. `stepSec = NaN` makes `noteLen` and every `setTimeout` delay NaN, which clamps to 0 in browsers.

There is also no minimum: `stepSec = 0.0001` schedules 256 notes inside 25ms. The Hz clamp blocks bad frequencies, but there's no rate limiter on note onsets.

**Fix:** Clamp at the top of `playArpeggio`:

```ts
const MIN_STEP_SEC = 0.01;   // 100 notes/sec ceiling
const MAX_STEP_SEC = 30;     // sanity upper bound

playArpeggio(freqs, stepSec = DEFAULT_ARP_STEP) {
  if (disposed) return;
  if (!Number.isFinite(stepSec) || stepSec < MIN_STEP_SEC) stepSec = MIN_STEP_SEC;
  if (stepSec > MAX_STEP_SEC) stepSec = MAX_STEP_SEC;
  // ... rest unchanged
}
```

---

### WR-04: `scaleTable` `opts.precision` is not validated; negative or NaN inputs throw `RangeError` at render time

**File:** `src/components/scale-table.ts:33-36, 55, 60`
**Issue:** `cents.toFixed(precision)` and `delta.toFixed(precision)` throw `RangeError` when `precision` is negative, > 100, or non-integer (e.g., NaN). The opts object is untyped at the docstring layer ("Cents decimal places. Default 1") but unbounded at the runtime layer. A caller that derives `precision` from a numeric input (e.g., a future `<input type=number>` driving display precision) crashes the entire `scaleTable` render — and Observable Framework's reactive cell catches the throw and replaces the table with an error block.

**Fix:** Clamp at the top:

```ts
const rawPrecision = opts.precision ?? 1;
const precision = Number.isInteger(rawPrecision)
  ? Math.min(Math.max(0, rawPrecision), 6)
  : 1;
```

---

### WR-05: `scl-io.ts` reads the entire file into memory before checking the 1 MB cap

**File:** `src/components/scl-io.ts:87-120`
**Issue:** The flow is `change` → `new FileReader()` → `reader.readAsText(file)` → `reader.onload` → `parseScl(text)` → 1 MB check. A 500 MB `.scl` upload fully loads into memory before parseScl rejects it — the kernel-level guard is in place, but the component can OOM the tab before reaching it.

**Fix:** Check `file.size` before invoking the reader:

```ts
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (file.size > 1_000_000) {
    status.textContent = `${file.name} is too large (max 1 MB).`;
    fileInput.value = "";
    return;
  }
  const reader = new FileReader();
  // ... rest unchanged
});
```

---

### WR-06: `audioPanel` drone state goes stale across `synth.dispose()` without UI reset

**File:** `src/components/audio-panel.ts:108-135`
**Issue:** The drone closure holds `stopDrone` returned by `synth.startDrone(baseHz)`. If `synth.dispose()` is called externally (cell invalidation by Framework — i.e. the user changes baseHz or scaleText), the drone audio stops, but the `stopDrone` closure variable remains non-null and the button still reads "🔊 Drone on". The next click invokes the stale callback (which is now a no-op via `disposed=true` short-circuit) and the UI flickers back to "Drone off" — but mid-cycle the user sees an enabled drone toggle for a synth that doesn't exist.

The factory's docstring acknowledges that the drone "does NOT auto-retune mid-hold," but the implementation issue is broader: the UI affordance lies about the audio state across cell invalidation.

**Fix:** Either (a) wire the synth's dispose path to a callback the panel can listen to and reset its UI, or (b) the simpler v1 approach — when `synth.activeVoices === 0` and `stopDrone !== null`, the next click should reset to "off" before doing anything else. Concretely, expose a `disposed` getter on `SynthHandle` and check it on click:

```ts
// In synth.ts SynthHandle interface:
readonly disposed: boolean;

// In synth.ts createSynth() return:
get disposed() { return disposed; },

// In audioPanel:
droneBtn.addEventListener("click", () => {
  if (synth.disposed) {
    stopDrone = null;
    droneBtn.textContent = "🔇 Drone off";
    droneBtn.setAttribute("aria-pressed", "false");
    return;
  }
  // ... existing logic
});
```

---

### WR-07: `parseScl` redundant `expectedCount < 0` guard never fires (regex precedes it)

**File:** `src/lib/scala.ts:90-93`
**Issue:**
```ts
const expectedCount = parseInt(countLine, 10);
if (!Number.isFinite(expectedCount) || expectedCount < 0 || !/^\d+$/.test(countLine)) {
  throw new Error(`parseScl: invalid pitch count "${countLine}"`);
}
```

The `/^\d+$/` regex rejects negative signs and any non-digit, so by the time the regex runs, `expectedCount < 0` is impossible. The `Number.isFinite(expectedCount)` check is also always true once the regex passes (a non-empty digit-only string parses to a finite number). The compound `||` is dead code.

This isn't a correctness bug — it's just code that gives a false impression of input validation depth, and a future reader might assume `parseInt` is doing its own work here.

**Fix:** Reorder so the regex is the gate:

```ts
if (!/^\d+$/.test(countLine)) {
  throw new Error(`parseScl: invalid pitch count "${countLine}"`);
}
const expectedCount = parseInt(countLine, 10);
```

---

### WR-08: `audioPanel` interval-selector default-degree clamp passes NaN through

**File:** `src/components/audio-panel.ts:71-73`
**Issue:**
```ts
const intendedIdx = opts.defaultDegree ?? Math.max(1, scale.intervals.length - 2);
const lastIdx = scale.intervals.length - 1;
select.value = String(Math.min(Math.max(0, intendedIdx), lastIdx));
```

If `opts.defaultDegree` is `NaN`, the nullish coalesce keeps `NaN` (since `NaN` is not nullish). `Math.max(0, NaN) === NaN`; `Math.min(NaN, lastIdx) === NaN`; `String(NaN) === "NaN"`. The `<select>` then has `value = "NaN"` which doesn't match any option, so HTML's behavior is to default to the first option (degree 0 / unison). The dashboard's currently-typed signature (`number | undefined`) makes this hard to hit, but `Number(stringInput)` is a normal way for this to leak NaN.

**Fix:**
```ts
const raw = opts.defaultDegree;
const intendedIdx =
  Number.isInteger(raw) ? raw! : Math.max(1, scale.intervals.length - 2);
```

---

### WR-09: `dashboard-seed.test.ts` duplicates the seed text instead of importing it

**File:** `src/__tests__/dashboard-seed.test.ts:17` and `src/index.md:32-39`
**Issue:** The test file claims:
> The seed text mirrors the constant baked into src/index.md verbatim — this is the dashboard's primary user-facing artifact, so a CI gate on its kernel round-trip is the smallest reliable detector for drift.

But the test does not import `seedText` from anywhere — it's a literal string in the test. If someone changes `src/index.md`'s `seedText` constant without changing the test, the test still passes, and the "drift detector" claim is false. The test is verifying that *its own* string round-trips, not that the dashboard's seed round-trips.

**Fix:** Extract the seed scale into a TypeScript module and import it from both `src/index.md` and the test:

```ts
// src/lib/seed.ts
export const SEED_SCALE_TEXT = `9/8
5/4
21/16
3/2
27/16
7/4
2/1`;
```

Then in `src/index.md`:
```ts
import { SEED_SCALE_TEXT } from "./lib/seed.js";
const seedText = SEED_SCALE_TEXT;
```

And in the test:
```ts
import { SEED_SCALE_TEXT } from "../lib/seed.js";
const SEED_TEXT = SEED_SCALE_TEXT;
```

Now any change to the seed has to flow through one place.

---

## Info

### IN-01: `parsePitchToken` accepts `[>` (empty monzo) and silently maps it to 1/1

**File:** `src/lib/scala.ts:190-218`
**Issue:** `if (inner === "") return new Interval("1/1");` — an empty bra-ket is mapped to unison instead of erroring. This may be intended (matches the mathematical convention that the empty product is 1), but it's not in the docstring, and a malformed `[>` could result from a user mistake (typing the brackets without filling them in). Either document the behavior or reject:

```ts
if (inner === "") {
  throw new Error(`parsePitchToken: empty monzo bra-ket "${line}"`);
}
```

### IN-02: `commaByName` and `nameForMonzo` allocate unnecessary copies on every lookup

**File:** `src/lib/commas.ts:55-71`
**Issue:** `monzosEqual([...c.monzo], arr)` and `monzoToBigNumeratorDenominator([...entry.monzo])` both spread `entry.monzo` defensively, despite `monzo` being declared `readonly number[]`. xen-dev-utils' `monzosEqual` reads via index access and doesn't mutate; `monzoToBigNumeratorDenominator` likewise should not mutate. The copies are likely cargo-cult.

If they truly are needed (because the xen-dev-utils typing is `number[]`, not `readonly number[]`), then a `c.monzo as number[]` cast is cheaper than a spread. But the more honest fix is to verify with the upstream lib and drop the spread.

```ts
export function nameForMonzo(m: readonly number[]): string | undefined {
  const arr = m as number[];
  return COMMAS.find((c) => monzosEqual(c.monzo as number[], arr))?.name;
}
```

### IN-03: `scaleTable` static `<th>` row uses `innerHTML` for hardcoded markup

**File:** `src/components/scale-table.ts:43-45`
**Issue:** The header row uses `innerHTML` even though it contains only static markup. The defense-in-depth principle in CLAUDE.md ("All dynamic content uses textContent (defense-in-depth XSS)") would be better-served by a uniform pattern — even for static markup — so future edits cannot accidentally interpolate user content.

```ts
const headerLabels = ["Degree", "Ratio", "Cents", "¢ from 12-TET"];
const headerRow = document.createElement("tr");
for (const label of headerLabels) {
  const th = document.createElement("th");
  th.textContent = label;
  headerRow.appendChild(th);
}
thead.appendChild(headerRow);
```

The performance cost is negligible (4 cells). The signal-to-future-maintainers is "we never use innerHTML, period."

### IN-04: `scl-io.ts` Blob MIME type `application/octet-stream` is generic

**File:** `src/components/scl-io.ts:151`
**Issue:** Scala `.scl` files are plaintext. `application/octet-stream` is the "binary blob, please download" hint, which works but loses semantic info. `text/plain;charset=utf-8` is more honest and lets browsers preview the file in-tab if the user middle-clicks the link.

```ts
const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
```

### IN-05: `parsePitchToken` cents path silently accepts `+` / leading-plus tokens

**File:** `src/lib/scala.ts:225-240`
**Issue:** The cents regex is `/^-?\d*\.\d*$/` — accepts `-12.0` but rejects `+12.0`. That asymmetry is fine for negative cents (Scala spec discusses descending intervals), but a user who types `+12.0` gets `parsePitchToken: invalid cents value "+12.0"` instead of the expected interval. Most parsers tolerate the redundant `+`. Low priority — ergonomic only.

```ts
if (!/^[+-]?\d*\.\d*$/.test(tok) || tok === "." || tok === "+." || tok === "-.") {
  throw new Error(`parsePitchToken: invalid cents value "${tok}"`);
}
```

---

_Reviewed: 2026-05-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
