---
phase: 03-visualization-mobile-audio-audit
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - src/audio/__tests__/synth.test.ts
  - src/audio/synth.ts
  - src/components/__tests__/keyboard.test.ts
  - src/components/__tests__/lattice.test.ts
  - src/components/__tests__/test-utils.ts
  - src/components/__tests__/tonality-diamond.test.ts
  - src/components/keyboard.css
  - src/components/keyboard.ts
  - src/components/lattice.css
  - src/components/lattice.ts
  - src/components/scl-io.css
  - src/components/scl-io.ts
  - src/components/tonality-diamond.css
  - src/components/tonality-diamond.ts
  - src/index.md
  - src/lib/__tests__/diamond.test.ts
  - src/lib/__tests__/kbm.test.ts
  - src/lib/diamond.ts
  - src/lib/kbm.ts
  - src/styles.css
  - src/lib/INVENTORY.md
  - vitest.config.ts
  - package.json
findings:
  blocker: 2
  warning: 8
  total: 10
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-05
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Phase 3 closed VIZ-01 (lattice), VIZ-02 (tonality diamond), VIZ-03 (keyboard), IO-03 (.kbm parser/serializer), and AUDIO-06 (mobile-Safari fixes). The audio lifecycle work, .kbm parser/serializer, and lattice viz are well-built — careful BigInt→Number boundary discipline (S-3), idempotent dispose paths, defense-in-depth Hz/size clamping, named-field error messages, and matching addEventListener / removeEventListener references for the visibilitychange handler. Tests cover the principal regression surfaces.

Two real correctness defects landed, however:

1. **Tonality-diamond layout is geometrically broken.** Cell positions are computed from the OCTAVE-REDUCED `numerator/denominator` instead of the original odd-integer `(i, j)` pair, so multiple cells stack on top of each other (e.g. all four `(i, i)` diagonal cells render at the unison apex; otonal `(7,1)` and `(7,3)` overlap; etc.). The Partch tonality-diamond geometry is destroyed. No test asserts cell positions, so this slipped through.
2. **Tonality-diamond `aria-label` is set on out-of-scale `role="presentation"` cells.** Assistive tech ignores `aria-label` on presentation roles, so the label string is dead code on those cells, and the in-scale label "Play X, in scale" / out-of-scale "Play X, not in scale" mismatch leaks into the SVG attributes anyway.

A handful of WARNING-level issues round out the report — visibilitychange timer leaks on dispose (unflushed setTimeout calls in playArpeggio survive), missing duration validation in `playNote/playArpeggio` (NaN/negative dur silently passes through to setTimeout), unison-cell semantics inconsistent between hand-built scales and parseScala-built scales, etc.

## Blocker Issues

### CR-01: Tonality-diamond cells overlap because layout uses reduced n/d instead of original (i, j)

**File:** `src/components/tonality-diamond.ts:196-200`
**Issue:** The diamond layout maps each cell to a grid position via:

```ts
const row = rankOf.get(d.numerator) ?? 0;
const col = rankOf.get(d.denominator) ?? 0;
const x = (col - row) * STRIDE;
const y = (col + row) * STRIDE;
```

But `d.numerator` and `d.denominator` are the OCTAVE-REDUCED ratio's `n/d` (per `DiamondCell` contract in `src/lib/diamond.ts:32-36`), NOT the original odd-integer pair `(i, j)` enumerated in the diamond. The `rankOf` map only knows the odds in `[1, oddLimit]`; reduced ratios like `5/4`, `8/5`, `12/7`, `6/5` carry numerator/denominator values that are NOT odd (4, 6, 8, 12), so `rankOf.get(n)` returns `undefined` and the `?? 0` fallback collapses them onto the row=0 or col=0 axes. Concrete trace for oddLimit=7 (odds = [1, 3, 5, 7], rankOf: 1→0, 3→1, 5→2, 7→3):

- All four diagonal cells `(1,1), (3,3), (5,5), (7,7)` reduce to 1/1 → all render at iso (0, 0). Four cells stacked at the unison apex.
- `(1,3)` → 4/3 (n=4, d=3): pos `(1, 1)`. `(3,3)` → 1/1: pos `(0, 0)`. So far OK.
- `(1,5)` → 8/5 (n=8, d=5): pos `(2, 2)`. `(3,5)` → 6/5 (n=6, d=5): pos `(2, 2)`. **Overlap.**
- `(1,7)` → 8/7, `(3,7)` → 12/7, `(5,7)` → 10/7: all (n_even, d=7). All render at pos `(3, 3)`. **Three cells overlap.**
- `(7,1)` → 7/4 (n=7, d=4): pos `(-3, 3)`. `(7,3)` → 7/6 (n=7, d=6): pos `(-3, 3)`. **Overlap.**

The Partch / Erlich tonality-diamond is supposed to place each `(i, j)` at `(j-i, j+i)` (or `(i-j, i+j)`) IN THE ORIGINAL `(i, j)` SPACE. The current code destroys that geometry the moment any cell needs octave reduction. No existing test asserts cell positions — the test at `tonality-diamond.test.ts:39-46` only checks "click any role=button cell calls playNotes," which still passes despite the broken layout.

**Fix:** Preserve `i, j` on `DiamondCell` and use them for layout. Two-line change in `src/lib/diamond.ts` plus the rank lookup in `tonality-diamond.ts`:

```ts
// src/lib/diamond.ts
export interface DiamondCell {
  /** Original odd-integer numerator from the (i, j) enumeration. */
  i: number;
  /** Original odd-integer denominator from the (i, j) enumeration. */
  j: number;
  numerator: number;
  denominator: number;
  ratio: Interval;
  inScale: boolean;
}

export function enumerateDiamond(oddLimit: number, scale: Scale): DiamondCell[] {
  // ...
  for (const i of odds) {
    for (const j of odds) {
      const ratio = new Interval(`${String(i)}/${String(j)}`).octaveReduce();
      const inScale = scale.intervals.some((iv) => iv.equals(ratio));
      cells.push({
        i, j,
        numerator: Number(ratio.fraction.n),
        denominator: Number(ratio.fraction.d),
        ratio,
        inScale,
      });
    }
  }
  return cells;
}
```

```ts
// src/components/tonality-diamond.ts
.attr("transform", (d: DiamondCell) => {
  const row = rankOf.get(d.i) ?? 0;
  const col = rankOf.get(d.j) ?? 0;
  const x = (col - row) * STRIDE;
  const y = (col + row) * STRIDE;
  return `translate(${String(x)},${String(y)})`;
})
```

Add a regression test that walks every cell and asserts no two cells share the same `transform` value (modulo the intended `(i, i) → 1/1` apex stack — render those at distinct rows along the unison diagonal as the comment at line 156-158 already promises).

### CR-02: `playArpeggio` setTimeout queue leaks across `dispose()`; long arpeggios with bad Hz still consume timer slots

**File:** `src/audio/synth.ts:240-264`
**Issue:** `playArpeggio` schedules `setTimeout` calls for every note `i ≥ 1`:

```ts
scheduled.forEach((hz, i) => {
  if (i === 0) {
    playNoteImpl(hz, noteLen);
  } else {
    setTimeout(() => { playNoteImpl(hz, noteLen); }, i * stepSec * 1000);
  }
});
```

The returned timer handles are never tracked. `dispose()` (line 291-317) does NOT clear them. After dispose:
- The timers still fire, calling `playNoteImpl` → `ensure()` → returns false (because `disposed=true`) → no-op. So no audio leak — but the closures (each capturing `hz`, `noteLen`, and the entire enclosing scope including `synth`, `ctx`, etc.) stay alive in the timer queue until each scheduled time elapses. For a 256-note arpeggio at 0.45s/step that is ~115 seconds of held closures after dispose.
- Equivalent T-3-10 leak shape on the audio side: hot-reload during a long arpeggio leaks all pending timer closures into the new cell's lifetime. Each closure holds a reference to the disposed `ctx`, blocking GC of the disposed AudioContext.
- Additionally, `panic()` (line 281-285) does NOT cancel pending arpeggio timers. After panic, future notes in the arpeggio still fire (subject to the disposed-flag check in playNoteImpl). For a "stop all audio" surface this is a correctness gap — Esc presses Stop button but the arpeggio keeps grinding on.

**Fix:** Track timer handles, clear on dispose AND panic:

```ts
const arpTimers = new Set<ReturnType<typeof setTimeout>>();

playArpeggio(freqs, stepSec = DEFAULT_ARP_STEP) {
  if (disposed) return;
  if (!ensure()) return;
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
  // ... existing dispose body
}
```

## Warnings

### WR-01: `aria-label` set on `role="presentation"` cells in tonality-diamond

**File:** `src/components/tonality-diamond.ts:210-216`
**Issue:** `aria-label` is set unconditionally on every diamond cell:

```ts
.attr("tabindex", (d: DiamondCell) => (d.inScale ? 0 : -1))
.attr("role", (d: DiamondCell) => (d.inScale ? "button" : "presentation"))
.attr(
  "aria-label",
  (d: DiamondCell) =>
    `Play ${d.ratio.fraction.toFraction()}, ${d.inScale ? "in scale" : "not in scale"}`,
);
```

ARIA spec: `aria-label` on `role="presentation"` is ignored by assistive tech. So the "not in scale" label is dead-coded — it never announces. It also says "Play X" on a non-interactive cell, which is misleading if any tooling DOES surface the attribute.

**Fix:** Only set `aria-label` on in-scale (button-role) cells; rely on the SVG `<title>` (already added at line 240-245) for tooltip context on out-of-scale cells.

```ts
.attr("aria-label", (d: DiamondCell) =>
  d.inScale ? `Play ${d.ratio.fraction.toFraction()}` : null,
);
```

### WR-02: `playNote` / `playArpeggio` accept any `dur` — no NaN / negative / Infinity validation

**File:** `src/audio/synth.ts:206-223, 226-264`
**Issue:** `playNote(hz, dur)` validates `hz` via `isPlayableHz` but accepts any `dur: number`. `dur = NaN`, `dur = -1`, `dur = Infinity` all flow into `setTimeout(release, dur * 1000)`:
- `NaN * 1000 = NaN` → browsers coerce to 0 (immediate fire).
- Negative → coerced to 0.
- `Infinity * 1000 = Infinity` → browser caps at ~24.85 days (signed-int32 ms cap), then fires.

Same applies to `playArpeggio(freqs, stepSec)` — a NaN `stepSec` schedules every note immediately at i*0=0ms, defeating the arpeggio cadence. None of the threat-model bounds (T-02-17/18/19) cover the duration parameter.

**Fix:** Add a duration clamp mirroring the Hz clamp idiom:

```ts
const isPlayableDur = (d: number): boolean =>
  Number.isFinite(d) && d > 0 && d <= 600; // 10-minute defense-in-depth ceiling

playNote(hz, dur = DEFAULT_NOTE_DUR) {
  if (disposed) return () => {};
  if (!isPlayableDur(dur)) return () => {};
  return playNoteImpl(hz, dur);
},
```

Apply the same guard to `stepSec` in `playArpeggio`.

### WR-03: `keyboard.ts` shows "active" visual state for rejected notes

**File:** `src/components/keyboard.ts:143-148`
**Issue:** `onDown` calls `synth.playNote(...)` and unconditionally sets `aria-pressed="true"` and adds the `keyboard__key--active` class:

```ts
const onDown = (): void => {
  if (release) return;
  release = synth.playNote(baseHz * ratioForKey, KEYBOARD_NOTE_DUR_SEC);
  keyG.setAttribute("aria-pressed", "true");
  keyG.classList.add("keyboard__key--active");
};
```

If `synth.playNote` returns the no-op `() => {}` because the synth was disposed OR the Hz fell outside the 20–20kHz clamp, `release` is still a function (truthy), so the early-return guard works on subsequent presses. But the key visually appears pressed and reads as `aria-pressed="true"` to assistive tech despite no audio playing. The mismatch persists until the user releases.

**Fix:** Have `playNote` return a sentinel for rejected calls (e.g. `null`), or have the keyboard check `synth.activeVoices` delta before applying the visual state:

```ts
const onDown = (): void => {
  if (release) return;
  const before = synth.activeVoices;
  const r = synth.playNote(baseHz * ratioForKey, KEYBOARD_NOTE_DUR_SEC);
  if (synth.activeVoices === before) return; // rejected — don't paint pressed state
  release = r;
  keyG.setAttribute("aria-pressed", "true");
  keyG.classList.add("keyboard__key--active");
};
```

Lower priority than CR-01/CR-02 because the seed scale's Hz values are well inside [20, 20000] for any reasonable baseHz, but it's a real disconnect between audio reality and accessibility surface.

### WR-04: `tonality-diamond.ts` and `lattice.ts` zoom handler types are loose

**File:** `src/components/tonality-diamond.ts:265, src/components/lattice.ts:318`
**Issue:** Both files declare the d3.zoom event with a structural type instead of `d3.D3ZoomEvent`:

```ts
.on("zoom", (event: { transform: { toString(): string } }) => {
  g.attr("transform", event.transform.toString());
});
```

This works because d3's `ZoomTransform` does have a working `toString()`. But it loses the strongly-typed `event.transform.k`, `.x`, `.y` accessors and forces every other reader to grep d3 docs to know the underlying type. Project convention (per `lib/INVENTORY.md` and `CLAUDE.md` Strict Mode discipline) is "type-safe at the API boundary."

**Fix:**

```ts
import type { D3ZoomEvent, ZoomTransform } from "d3";

.on("zoom", (event: D3ZoomEvent<SVGElement, unknown>) => {
  g.attr("transform", event.transform.toString());
});
```

### WR-05: `parseKbm` UTF-8 cap rejects sub-1MB files in worst-case 3x branch

**File:** `src/lib/kbm.ts:83-86`
**Issue:** `utf8ByteLength` returns `s.length * 3` as a fast path. The cap is `MAX_INPUT_BYTES = 1_000_000`. So any file with `s.length > 333_333` flips to the TextEncoder branch — including ASCII-only files that would actually serialize to ~333KB. The fast-path guard is `if (s.length * 3 <= MAX_INPUT_BYTES) return s.length * 3;` — so a 400_000-char ASCII file (= ~400KB UTF-8) takes the fast path, returns 1_200_000, exceeds the cap, and is rejected.

This is a false positive: a 400KB ASCII .kbm file should be accepted (it's well under 1MB). The current cap effectively rejects ASCII files larger than 333KB.

**Fix:** Always run the precise check above the threshold:

```ts
function utf8ByteLength(s: string): number {
  // Fast path for the common, well-under-cap case.
  if (s.length <= MAX_INPUT_BYTES / 3) return s.length; // ASCII lower bound
  return new TextEncoder().encode(s).byteLength;
}
```

The same idiom appears in `scala.ts` (per the doc comment). If the same bug shipped there, fix in lockstep.

### WR-06: Scale unison semantics inconsistent between parseScala and hand-built Scale

**File:** `src/lib/diamond.ts:70, src/lib/kbm.ts:313-318`
**Issue:** Three call sites care about whether the scale starts with 1/1:

1. `enumerateDiamond` checks `scale.intervals.some((iv) => iv.equals(ratio))` for `ratio = 1/1`. If the scale was built via `parseScala` (which auto-prepends 1/1), the cell `1/1` is "in-scale". If the scale was hand-built `new Scale([new Interval("9/8"), ...])`, the cell `1/1` is "out-of-scale". The lattice unison node is similarly missing in tests.
2. `kbmToFrequencies` defends against this by manually prepending the unison if absent (kbm.ts:312-318), so MIDI 60 mapEntry-0 always resolves to 1/1.
3. `defaultKbmFor` uses `scale.intervals.length` as `size` and `formalOctave`. For a hand-built scale (no unison), size = N. For a parseScala scale (with prepended unison), size = N+1. Two scales that the user perceives as "the same 7-tone scale" produce DIFFERENT default `.kbm` files.

The codebase has not chosen a single canonical form. Tests pass because they use one path or the other consistently within each test, but a real user editing a hand-typed scale and then importing/exporting .kbm will hit the size mismatch.

**Fix:** Pick one. Recommended: have `Scale` constructor normalize — if `intervals[0]` is not 1/1, prepend it. This kills three classes of inconsistency in one place. Update `Scale` doc-comment + `INVENTORY.md` to reflect the invariant. Then `kbmToFrequencies` can drop its defensive prepend, and `enumerateDiamond` cell `1/1` is consistently in-scale.

### WR-07: `index.md` Escape handler panics audio from textarea input — UX hazard

**File:** `src/index.md:33-34`
**Issue:** Global `keydown` listener triggers `synth.panic()` on every Escape press anywhere in the document, including while the user is typing in the scale textarea. If the user presses Escape (e.g., to dismiss browser autocomplete suggestions, or out of habit to cancel inline edits), an active drone or sustained note is killed. No visible cause — the user pressed Escape in a textarea, audio dies.

D-16 mandates the floating Stop button binds Esc as the keyboard shortcut. Reasonable for the dashboard at large, but the textarea is a focus zone where Esc should not have a global side effect.

**Fix:** Filter on `event.target` so the textarea (and any other input) doesn't trigger panic:

```ts
const onKey = (e) => {
  if (e.key !== "Escape") return;
  const target = e.target;
  if (target instanceof HTMLElement &&
      (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) return;
  synth.panic();
};
```

Or scope the listener to a single visible "focusable shell" element rather than `document`.

### WR-08: `vitest.config.ts` test layout pattern omits `src/components/**/*.test.ts` non-`__tests__` location

**File:** `vitest.config.ts:33-40`
**Issue:** Test include patterns are inconsistent across the source tree:

```ts
include: [
  "src/lib/**/__tests__/**/*.test.ts",
  "src/lib/**/*.test.ts",
  "src/audio/**/__tests__/**/*.test.ts",
  "src/audio/**/*.test.ts",
  "src/__tests__/**/*.test.ts",
  "src/components/**/__tests__/**/*.test.ts",
],
```

`src/lib` and `src/audio` accept tests both inside `__tests__` AND alongside source (`*.test.ts`). `src/components` only accepts tests inside `__tests__/`. If anyone adds a sibling `foo.test.ts` next to `src/components/foo.ts` (matching the `lib`/`audio` convention) it will be silently skipped by vitest.

**Fix:** Mirror the lib/audio pattern:

```ts
include: [
  "src/**/__tests__/**/*.test.ts",
  "src/**/*.test.ts",
],
```

This is one line and removes a future "why isn't my test running" debugging session.

---

_Reviewed: 2026-05-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
