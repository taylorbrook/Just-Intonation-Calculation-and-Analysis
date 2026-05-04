# Phase 2: Math Kernel + Composition Anchor (MVP) - Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 30 (creates) + 4 (modifies) = 34
**Analogs found:** 14 (in-repo Phase 1) / 34 — remaining 20 have no in-repo analog and follow RESEARCH.md prescriptions or established Phase 1 conventions

## File Classification

### Files to Create

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/lib/interval.ts` | model (kernel primitive) | transform | `src/lib/example.ts` (file shape, header style); RESEARCH.md §Module Breakdown + ARCHITECTURE.md Pattern 1 (semantic body) | role-match (no domain analog yet) |
| `src/lib/monzo.ts` | utility (math helpers) | transform | `src/lib/example.ts` (file shape) | role-match |
| `src/lib/cents.ts` | utility (math helpers) | transform | `src/lib/example.ts` (file shape) | role-match |
| `src/lib/scale.ts` | model (kernel primitive) | transform | `src/lib/example.ts` (file shape); ARCHITECTURE.md Pattern 6 (Scale instantiation) | role-match |
| `src/lib/scala.ts` | service (parser/serializer) | transform (string ↔ data) | none in repo — RESEARCH.md §.scl Format Reference is canonical | no-analog |
| `src/lib/text-input.ts` (or merged into scala.ts) | service (parser) | transform | shared body parser per D-12 — likely merged | no-analog |
| `src/lib/commas.ts` | utility + data | lookup | `src/lib/example.ts` (file shape); RESEARCH.md D-21 spec | role-match |
| `src/lib/INVENTORY.md` (modify) | doc | append-only | existing INVENTORY.md (Phase 1 entry row format) | exact |
| `src/lib/__tests__/interval.test.ts` | test | unit | `src/lib/__tests__/example.test.ts` | exact |
| `src/lib/__tests__/monzo.test.ts` | test | unit | `src/lib/__tests__/example.test.ts` | exact |
| `src/lib/__tests__/cents.test.ts` | test | unit | `src/lib/__tests__/example.test.ts` | exact |
| `src/lib/__tests__/scale.test.ts` | test | unit | `src/lib/__tests__/example.test.ts` | exact |
| `src/lib/__tests__/scala.test.ts` | test | unit + golden | `src/lib/__tests__/example.test.ts` | exact (shape) |
| `src/lib/__tests__/commas.test.ts` | test | unit | `src/lib/__tests__/example.test.ts` | exact |
| `src/lib/__tests__/seed-scale.test.ts` | test (integration) | round-trip | `src/lib/__tests__/example.test.ts` | exact (shape) |
| `src/lib/__tests__/fixtures/*.scl` (16+ files) | test fixture (data) | static input | none in repo | no-analog (RESEARCH.md F1–F16 + Huygens-Fokker archive) |
| `src/audio/synth.ts` | service (lifecycle wrapper) | event-driven (Web Audio) | none in repo — RESEARCH.md §AudioContext Lifecycle has full implementation sketch | no-analog (research-prescribed) |
| `src/audio/envelopes.ts` (optional) | utility (presets) | static config | none in repo | no-analog |
| `src/audio/__tests__/synth.test.ts` | test | unit (mocked AudioContext) | `src/lib/__tests__/example.test.ts` (shape only) | role-match |
| `src/components/play-interval.ts` | component (DOM factory) | event-driven (click → audio) | ARCHITECTURE.md Pattern 2 example (`playInterval`) | research-prescribed |
| `src/components/play-scale.ts` | component (DOM factory) | event-driven (click → audio) | ARCHITECTURE.md Pattern 2 | research-prescribed |
| `src/components/scale-table.ts` | component (DOM factory) | request-response (data → table) | ARCHITECTURE.md component table | research-prescribed |
| `src/components/ratio-pill.ts` | component (DOM factory) | request-response (data → span) | ARCHITECTURE.md Pattern 2 | research-prescribed |
| `src/components/audio-panel.ts` | component (DOM factory) | event-driven (controls → audio) | ARCHITECTURE.md Pattern 2 + D-07 | research-prescribed |
| `src/components/scl-io.ts` | component (DOM factory) | file I/O (browser) | ARCHITECTURE.md component table; RESEARCH.md D-22 | research-prescribed |
| `src/pages/syntonic-comma.md` | page | reactive cells | `src/index.md` (Phase-1 hello — fenced cells + inline `${}` pattern) | role-match |
| `src/__tests__/dashboard-seed.test.ts` | test (integration) | round-trip | `src/lib/__tests__/example.test.ts` (shape) | role-match |

### Files to Modify

| File | Role | Modification | Existing Pattern Source |
|------|------|--------------|-------------------------|
| `src/index.md` | page | full replacement (Phase-1 hello → dashboard) | self (cell + inline `${}` shape); ARCHITECTURE.md Pattern 3 (composition page) |
| `observablehq.config.ts` | config | add `pages` entry + `head` KaTeX injection | self (current shape); RESEARCH.md §KaTeX Wiring |
| `src/lib/INVENTORY.md` | doc | append rows for all new kernel symbols | self (Phase-1 entry rows are the template) |
| `src/lib/example.ts` | model (stub) | DELETE (replaced by real kernel; per CONTEXT §Reusable Assets) | n/a |
| `src/lib/__tests__/example.test.ts` | test | DELETE alongside `example.ts` | n/a |

---

## Pattern Assignments

### `src/lib/interval.ts` (model, transform)

**Analogs:**
- File shape + header doc-comment style: `src/lib/example.ts` (lines 1–9)
- Semantic body: ARCHITECTURE.md Pattern 1 (the `Interval` class sketch)
- Library API contract: RESEARCH.md §Library API Map → fraction.js@5.3.4 (lines 196–245)

**Header doc-comment pattern** — copy the comment style from `src/lib/example.ts:1-5`:
```ts
/**
 * Phase 1 stub kernel module.
 * Exists ONLY as a Vitest target to verify BOOT-03 (test pipeline works).
 * Phase 2 replaces this with the real Interval / monzo / scale primitives.
 */
```
Apply to `interval.ts` as a multi-line block describing: source-of-truth invariant (BigInt `Fraction`), lazy monzo + cents caches, Pitfall #1 reminder (cents is display-projection only).

**Import pattern** — copy from `src/index.md:21` (Phase-1 hello cell). Note: in `src/lib/` we import directly from `fraction.js` (NOT `npm:fraction.js` — that prefix is a Framework runtime convention used only inside `.md` cells):
```ts
import { Fraction } from "fraction.js";          // BigInt-backed source of truth (R-01: NEVER from xen-dev-utils)
import { toMonzo, valueToCents } from "xen-dev-utils";  // monzo + cents helpers (Number-backed; safe here)
```
Imports of project-local modules use `.js` extension even though source is `.ts` (Framework runtime convention; ARCHITECTURE.md Pattern 1 example line 172):
```ts
import { toMonzo } from "./monzo.js";
```

**Class shape** — copy verbatim from ARCHITECTURE.md Pattern 1 example (lines 174–198), adapted for strict-TS + R-01 BigInt handling:
```ts
export class Interval {
  readonly fraction: Fraction;        // source of truth (BigInt-backed)
  #monzo?: number[];                  // lazy — xen-dev-utils Monzo is number[]
  #cents?: number;                    // lazy

  constructor(input: Fraction | string | { n: bigint; d: bigint }) {
    this.fraction = input instanceof Fraction ? input : new Fraction(input as never);
  }

  static fromMonzo(monzo: number[]): Interval { /* monzoToBigNumeratorDenominator → new Fraction(num, den) */ }

  get monzo(): number[] { return this.#monzo ??= toMonzo(this.fraction); }
  get cents(): number { return this.#cents ??= 1200 * Math.log2(this.fraction.valueOf()); }
  get centsFrom12tet(): number {
    const c = this.cents;
    return c - Math.round(c / 100) * 100;
  }

  mul(other: Interval): Interval { return new Interval(this.fraction.mul(other.fraction)); }
  div(other: Interval): Interval { return new Interval(this.fraction.div(other.fraction)); }
  inv(): Interval { return new Interval(this.fraction.inverse()); }
  octaveReduce(period?: Interval): Interval { /* period-aware per Pitfall #13 */ }
  equals(other: Interval): boolean { return this.fraction.equals(other.fraction); }
}
```

**Strict-TS notes (project tsconfig.json:14-19):**
- `noUncheckedIndexedAccess` → any `monzo[i]` access requires guards or default fallback
- `exactOptionalPropertyTypes` → `monzo?: number[]` and `cents?: number` cannot be assigned `undefined` after declaration without type widening

**No DOM, no audio, no Framework imports** — verified by `npm run lint:types` + grep gate (RESEARCH.md NOTES-04 row).

---

### `src/lib/monzo.ts` (utility, transform)

**Analogs:**
- File shape + header doc-comment: `src/lib/example.ts:1-9`
- Re-export discipline: RESEARCH.md §Module Breakdown row "monzo.ts" — delegate to xen-dev-utils

**Pattern** — thin re-exports + a project-specific `monzoLengthMatch(a, b)` padding helper (Pitfall #14):
```ts
import {
  toMonzo, monzoToFraction, monzoToBigNumeratorDenominator,
  primeLimit, monzosEqual, add, sub, scale,
  tenneyHeight, wilsonHeight, PRIMES,
} from "xen-dev-utils";

export { toMonzo, monzoToBigNumeratorDenominator, primeLimit, monzosEqual, PRIMES };
export const monzoAdd = add;
export const monzoSub = sub;
export const monzoScale = scale;
export const benedettiHeight = (m: number[]): number => { /* compute from BigInt path */ };
export const oddLimit = (m: number[]): number => { /* hand-written from monzo[0]=2-component */ };
```

**INVENTORY.md row** — append after the Phase-1 `Fraction` row using the same `| Symbol | Source | Notes |` shape (see `src/lib/INVENTORY.md:13-15`):
```md
| `toMonzo`, `monzoToBigNumeratorDenominator`, `primeLimit`, ... | `xen-dev-utils@0.13.1` | Re-exported via `src/lib/monzo.ts`. Per R-01: do NOT re-export `xen-dev-utils` `Fraction` — only the Number-backed helpers. |
| `oddLimit`, `benedettiHeight` | Custom (no upstream) | Hand-written from monzo. xen-dev-utils ships `wilsonHeight` + `tenneyHeight` but not these two. |
```

---

### `src/lib/cents.ts` (utility, transform)

**Analogs:**
- File shape: `src/lib/example.ts`
- Helper signatures: RESEARCH.md §Library API Map → xen-dev-utils `valueToCents`, `monzoToCents`

**Pattern**:
```ts
import { valueToCents, monzoToCents } from "xen-dev-utils";

/** Convert a ratio value or monzo to cents. LOSSY — display projection only (Pitfall #1). */
export function toCents(value: number | number[]): number {
  return Array.isArray(value) ? monzoToCents(value) : valueToCents(value);
}

/** Signed deviation from nearest 12-TET semitone, in cents. */
export function centsFrom12tet(cents: number): number {
  return cents - Math.round(cents / 100) * 100;
}
```

---

### `src/lib/scale.ts` (model, transform)

**Analogs:**
- File shape: `src/lib/example.ts`
- Class body: ARCHITECTURE.md Pattern 6 example (lines 386–401) — `Scale` constructor + intervals/period
- Method list: RESEARCH.md §Module Breakdown row "scale.ts"

**Pattern** (immutable per D-24):
```ts
import { Interval } from "./interval.js";

export class Scale {
  readonly intervals: readonly Interval[];   // includes 1/1 as intervals[0]
  readonly period: Interval;                  // last interval (D-14)

  constructor(intervals: Interval[], period?: Interval) {
    if (intervals.length === 0) throw new Error("Scale must have at least one interval");
    this.intervals = Object.freeze([...intervals]);
    this.period = period ?? intervals[intervals.length - 1]!;  // ! safe per length check
  }

  rotate(degree: number): Scale { /* mode rotation; 1/1 stays first */ }
  reduce(): Scale { /* sort + dedupe + period-aware octave-reduce per Pitfall #13 */ }
  dedupe(): Scale { /* equality via interval.fraction.equals */ }
  transpose(by: Interval): Scale { /* map mul */ }
  degreeToFreq(degree: number, baseHz: number): number { /* baseHz * intervals[degree].fraction.valueOf() */ }
}
```

**Strict-TS guard** — `intervals[i]` access under `noUncheckedIndexedAccess` requires non-null assertion or guard. Use `!` only after a length check (as shown above).

---

### `src/lib/scala.ts` (service, transform)

**Analogs:**
- File shape: `src/lib/example.ts`
- Format spec: RESEARCH.md §.scl Format Reference (lines 357–430) — fully canonical, no in-repo analog
- Edge-case fixtures: RESEARCH.md F1–F16 table (lines 408–425)

**No code analog** — this module is hand-written per the Huygens-Fokker spec. RESEARCH.md is the source of truth. Key behaviors:
- `parseScala(body: string): Interval[]` — shared body parser (D-12); auto-prepends `1/1` (D-13)
- `parseScl(file: string): { description: string; intervals: Interval[] }` — full file parser
- `writeScl(scale: Scale, description?: string): string` — does NOT emit `1/1` line (D-13)
- Last line IS the period (D-14)
- Cents detection: token contains `.` → cents; starts with `[` → monzo (D-15); else ratio (D-19)
- Comment lines: `!` anywhere; ignored (skip during count)
- Reject negative ratios + multi-slash ratios (must throw with clear message — F12, F13)

**INVENTORY entry**: `Custom (no upstream parser)` — record per Pitfall #5 wrap-don't-reimplement check.

---

### `src/lib/commas.ts` (utility + data, lookup)

**Analogs:**
- File shape: `src/lib/example.ts`
- Lookup-by-monzo discipline: PITFALLS.md #1 + #6 (NEVER cents-within-epsilon)

**Pattern**:
```ts
import { Interval } from "./interval.js";
import { monzosEqual, monzoToBigNumeratorDenominator } from "./monzo.js";

interface CommaEntry { name: string; monzo: number[]; }

const COMMAS: readonly CommaEntry[] = Object.freeze([
  { name: "syntonic comma", monzo: [-4, 4, -1] },        // 81/80
  { name: "Pythagorean comma", monzo: [-19, 12] },        // 531441/524288
  { name: "schisma", monzo: [-15, 8, 1] },                // 32805/32768
  { name: "septimal comma", monzo: [6, -2, 0, -1] },      // 64/63
  { name: "diaschisma", monzo: [11, -4, -2] },            // 2048/2025
  // ... 15-25 entries per D-21
]);

export function nameForMonzo(m: number[]): string | undefined {
  return COMMAS.find((c) => monzosEqual(c.monzo, m))?.name;
}

export function commaByName(name: string): Interval | undefined {
  const entry = COMMAS.find((c) => c.name === name);
  if (!entry) return undefined;
  const { numerator, denominator } = monzoToBigNumeratorDenominator(entry.monzo);
  return new Interval(`${numerator}/${denominator}`);
}
```

---

### Test files (`src/lib/__tests__/*.test.ts`) (test, unit)

**Analog:** `src/lib/__tests__/example.test.ts` — exact match for shape, imports, describe/it/expect calls.

**Header + import pattern** (verbatim shape from `example.test.ts:1-2`):
```ts
import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";   // .js extension, sibling-up
```

**describe/it block pattern** (verbatim shape from `example.test.ts:4-12`):
```ts
describe("Interval", () => {
  it("round-trips 81/79 through monzo", () => {
    const i = new Interval("81/79");
    const round = Interval.fromMonzo(i.monzo);
    expect(round.equals(i)).toBe(true);
  });

  it("handles large numerator (2147483648/2147483647)", () => {
    const i = new Interval("2147483648/2147483647");
    expect(i.fraction.n).toBe(2147483648n);
    expect(i.fraction.d).toBe(2147483647n);
  });
});
```

**Vitest discovery** — `vitest.config.ts:5` already includes `src/lib/**/__tests__/**/*.test.ts`; no config change needed for kernel tests. NOTE: `src/audio/__tests__/` and `src/__tests__/` are NOT in the include glob — extend `vitest.config.ts:5` before adding tests there:
```ts
include: [
  "src/lib/**/__tests__/**/*.test.ts",
  "src/lib/**/*.test.ts",
  "src/audio/**/__tests__/**/*.test.ts",   // NEW for synth.test.ts
  "src/__tests__/**/*.test.ts",              // NEW for dashboard-seed.test.ts
],
```

**ESLint relaxation already present** — `eslint.config.js:36-41` relaxes `@typescript-eslint/no-unused-expressions` for the existing test glob; mirror the glob if extended.

---

### `src/audio/synth.ts` (service, event-driven)

**Analog:**
- No in-repo file. RESEARCH.md §AudioContext Lifecycle (lines 469–576) has the **complete implementation sketch** — copy verbatim with adjustments below.
- ARCHITECTURE.md Pattern 4 (lines 284–340) for the conceptual contract.

**Imports**:
```ts
import { Synth as SwSynth, defaultParams, type OscillatorVoiceParams } from "sw-synth";
```

**Public interface** (copy from RESEARCH.md lines 478–502):
```ts
export interface SynthHandle {
  playNote(hz: number, dur?: number): () => void;
  playNotes(freqs: number[], dur?: number): void;
  playArpeggio(freqs: number[], stepSec?: number): void;
  startDrone(hz: number): () => void;
  panic(): void;
  readonly activeVoices: number;
  dispose(): void;
}

export interface CreateSynthOpts {
  master?: number;
  maxPolyphony?: number;
  voiceParams?: Partial<OscillatorVoiceParams>;
}
```

**Lazy-init + voice-tracking + dispose** — copy verbatim from RESEARCH.md lines 504–575, especially:
- `ensure()` closure that creates `AudioContext` on first method call (NEVER at module top-level — Anti-Pattern 3)
- `synth.maxPolyphony = 16` (D-17 default)
- ADSR override `{attackTime: 0.005, decayTime: 0.030, sustainLevel: 0.7, releaseTime: 0.150}` (D-16)
- `noteOn(hz, velocity)` returns `noteOff` callback — store and call to release voices
- `dispose()` calls `synth.allNotesOff()`, `master.disconnect()`, `ctx.close()`, nulls everything

**Strict-TS guards under `noUncheckedIndexedAccess`** — array iteration via `freqs.forEach((hz, i) => ...)` is safer than indexed access.

**ESLint type-checked rules** — `synth.ts` lives under `src/`, so `eslint.config.js:24` (recommendedTypeChecked applied to `src/**/*.ts`) is in force. Audio code with `setTimeout` callbacks may trip `no-misused-promises` or `no-floating-promises`; suppress narrowly with a comment if needed.

---

### `src/components/play-interval.ts` (component, event-driven)

**Analog:** ARCHITECTURE.md Pattern 2 example (lines 207–234) — **copy verbatim, adjust per D-09**.

**Pattern** (verbatim from ARCHITECTURE.md lines 209–234, with the D-08 baseHz default updated):
```ts
import type { Interval } from "../lib/interval.js";
import type { SynthHandle } from "../audio/synth.js";

export interface PlayIntervalOpts {
  baseHz?: number;        // default 440 (D-08 — A4, NOT C4 from ARCHITECTURE.md example)
  duration?: number;      // seconds, default 1.5 (D-18)
  label?: string;
}

export function playInterval(
  interval: Interval,
  synth: SynthHandle,
  opts: PlayIntervalOpts = {},
): HTMLButtonElement {
  const baseHz = opts.baseHz ?? 440;
  const dur = opts.duration ?? 1.5;
  const btn = document.createElement("button");
  btn.className = "play-interval";
  btn.textContent = opts.label ?? `▶ ${interval.fraction.toFraction()}`;
  btn.onclick = () => {
    synth.playNotes([baseHz, baseHz * interval.fraction.valueOf()], dur);
  };
  return btn;
}
```

**Key adjustments from the ARCHITECTURE.md template:**
1. `baseHz` default = **440** (D-08), not 261.63
2. `duration` default = **1.5s** (D-18), not 2s
3. `synth: SynthHandle` (the interface name in `src/audio/synth.ts`), not the placeholder `Synth` from the architecture doc
4. Imports use `.js` extension (Framework convention)
5. Imports are `import type { ... }` for the interval/synth types — `verbatimModuleSyntax`-friendly

---

### `src/components/play-scale.ts`, `scale-table.ts`, `ratio-pill.ts`, `audio-panel.ts`, `scl-io.ts` (components, factories)

**Analog:** Same factory pattern as `play-interval.ts` (above). All are `(data, ...rest, opts?) => HTMLElement`.

**Shared pattern shape:**
```ts
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface FooOpts { /* ... */ }

export function foo(data: Scale, /* extras */, opts: FooOpts = {}): HTMLElement {
  const root = document.createElement(/* tag */);
  // build DOM from `data`; bind handlers
  return root;
}
```

**Per-component notes:**
- `scale-table.ts`: 4 columns (Degree | Ratio | Cents | ¢ from 12-TET) per D-06; cents at 0.1¢ default precision (Pitfall #16); optional `opts.copyButton: true` for IO-04 clipboard (`navigator.clipboard.writeText`).
- `ratio-pill.ts`: returns `<span>` with Unicode "⁸¹⁄₈₀ (~21.5¢)" per D-10 (NOT KaTeX — see RESEARCH.md O-01).
- `play-scale.ts`: arpeggio at `stepSec = 0.45`, `noteLen = stepSec * 0.95` (D-18).
- `audio-panel.ts`: dashboard-only; D-07 layout = interval-selector dropdown + Arpeggiate button + Drone toggle. Drone toggle uses the Pitfall #9 pattern (RESEARCH.md lines 591–598):
  ```js
  let stopDrone = null;
  droneBtn.onclick = () => {
    if (stopDrone) { stopDrone(); stopDrone = null; droneBtn.textContent = "Drone on 1/1"; }
    else { stopDrone = synth.startDrone(baseHz); droneBtn.textContent = "Stop drone"; }
  };
  ```
- `scl-io.ts`: dashboard-only; uses `URL.createObjectURL(new Blob([writeScl(scale)], {type: "text/plain"}))` for download; `<input type="file">` + `FileReader` for import. Filename per D-22: `scale-${N}-tone-${YYYY-MM-DD}.scl`.

**Constraint:** components NEVER import `Synth` from `sw-synth` directly — only `SynthHandle` from `../audio/synth.js`. Keeps components testable without Web Audio mocks.

---

### `src/index.md` (page, reactive cells) — REPLACES Phase-1 hello

**Analog:**
- Cell + inline-`${}` pattern: existing `src/index.md` lines 20–50 (Phase-1 hello cells)
- Composition page structure: ARCHITECTURE.md Pattern 3 example (lines 248–282)
- Reactive cell sequence: RESEARCH.md §Module Breakdown lines 132–168

**Imports cell pattern** (copy structure from existing `src/index.md:20-21` — `npm:` prefix for runtime resolution):
```ts
import { Interval } from "./lib/interval.js";
import { Scale } from "./lib/scale.js";
import { parseScala, writeScl } from "./lib/scala.js";
import { createSynth } from "./audio/synth.js";
import { scaleTable } from "./components/scale-table.js";
import { audioPanel } from "./components/audio-panel.js";
import { sclIo } from "./components/scl-io.js";
```
Note: kernel imports at the top use **relative paths with `.js` extension**. `npm:` prefix (as in current `src/index.md:21`) is reserved for npm-registry packages used directly inside cells; for our internal modules we use relative paths.

**Synth cell** (verbatim from RESEARCH.md line 142–146 + ARCHITECTURE.md Pattern 4 line 344–346):
```js
const synth = createSynth();
invalidation.then(() => synth.dispose());
```
**Critical:** synth cell MUST be in its own code block, with NO dependency on `scale` or `baseHz`, so editing them doesn't tear down the AudioContext (RESEARCH.md line 585–587, ARCHITECTURE.md "Computation Flow" line 449–456).

**Seed scale cell** (D-02, COMP-01-reframed):
```js
const seed = `9/8\n5/4\n21/16\n3/2\n27/16\n7/4\n2/1`;  // 1/1 auto-prepended by parseScala (D-13)
```

**Reactive inputs + display sequence** (per D-05 layout, RESEARCH.md lines 152–168):
```js
const scaleText = view(Inputs.textarea({value: seed, rows: 8}));
const scale = new Scale(parseScala(scaleText));
const baseHz = view(Inputs.number({value: 440, step: 0.01, label: "A4 reference (Hz)"}));
display(scaleTable(scale, baseHz));
display(audioPanel(scale, synth, baseHz));
display(sclIo(scale));
```

**Inline interpolation pattern** (verbatim shape from existing `src/index.md:44`):
```md
The seed scale **${scale.intervals.length}** intervals, period = **${scale.period.fraction.toFraction()}**.
```

---

### `src/pages/syntonic-comma.md` (page, reactive cells)

**Analog:**
- File structure: `src/index.md` (current Phase-1 hello — same Markdown + fenced-cell shape)
- Theory page contract: ARCHITECTURE.md Pattern 3 + RESEARCH.md line 170–172

**Pattern**: prose (with `$\frac{81}{80}$` KaTeX inline) + 3–5 embedded widgets via `${ratioPill(...)}`, `${playInterval(...)}` calls. Imports the seed scale from `src/index.md`'s definition (or duplicates the same `Scale` construction inline — both acceptable; the seed is small).

**KaTeX usage** — per RESEARCH.md line 458 + D-23 — use Framework's `tex` template tag (auto-bundled when first cell uses it; CSS comes from `head` injection):
```md
The syntonic comma is ${tex`\frac{81}{80} \approx 21.5\text{¢}`}, the difference
between the 5-limit major third (${ratioPill(new Interval("5/4"), {})})
and the Pythagorean major third (${ratioPill(new Interval("81/64"), {})}).
```

---

### `observablehq.config.ts` (config, modify)

**Analog:** existing `observablehq.config.ts` (current shape, lines 1–7).

**Current state**:
```ts
// See https://observablehq.com/framework/config for documentation.
export default {
  title: "Tuning Systems",
  root: "src",
  pages: [],
};
```

**Modification per D-23 + RESEARCH.md §KaTeX Wiring lines 440–449**:
```ts
export default {
  title: "Tuning Systems",
  root: "src",
  pages: [
    { name: "Syntonic comma", path: "/pages/syntonic-comma" },
  ],
  head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM" crossorigin="anonymous">`,
};
```
Re-verify the SRI hash on day-of-implementation per RESEARCH.md A5.

---

## Shared Patterns

### Pattern S-1: TypeScript-strict file shape (all `src/lib/*.ts`)

**Source:** `src/lib/example.ts:1-9` (file template) + `tsconfig.json:14-19` (strict flags).

**Apply to:** every new `src/lib/*.ts` file.

**Excerpt** — verbatim shape:
```ts
/**
 * <one-line module purpose>
 * <optional rationale or pitfall reminder>
 */
export function foo(...): ... { ... }
```

**Strict-TS gotchas** (Phase 1 D-16, RESEARCH.md line 81):
- `noUncheckedIndexedAccess`: `arr[i]` is `T | undefined`. Required guard or non-null assertion (after a verified length check).
- `exactOptionalPropertyTypes`: `foo?: T` cannot be assigned `undefined` post-declaration without explicit `T | undefined` typing.
- `noImplicitOverride`: derived-class method overrides require explicit `override` keyword.
- `forceConsistentCasingInFileNames`: import paths must match on-disk casing exactly.

---

### Pattern S-2: Vitest test file shape (all `__tests__/*.test.ts`)

**Source:** `src/lib/__tests__/example.test.ts:1-12`.

**Apply to:** every new `*.test.ts` file in any `__tests__/` directory.

**Excerpt** — verbatim shape:
```ts
import { describe, it, expect } from "vitest";
import { ThingUnderTest } from "../thing.js";

describe("ThingUnderTest", () => {
  it("does the canonical happy-path thing", () => {
    expect(/* ... */).toBe(/* ... */);
  });

  it("handles edge case", () => {
    expect(/* ... */).toBe(/* ... */);
  });
});
```

**Conventions:**
- Imports use `.js` extension (verified `example.test.ts:2`)
- `describe` + `it` (NOT `test`) — matches Phase-1 style
- No `globals: true` in `vitest.config.ts:8` → must explicitly import from `vitest`
- Co-located under `src/lib/__tests__/` (or extended dirs `src/audio/__tests__/`, `src/__tests__/` — see test glob update note above)

---

### Pattern S-3: INVENTORY.md row format (every kernel addition)

**Source:** `src/lib/INVENTORY.md:13-15`.

**Apply to:** every new `export` from `src/lib/*.ts`.

**Excerpt** — verbatim row shape:
```md
| Symbol | Source | Notes |
|--------|--------|-------|
| `Fraction` | `fraction.js@5.3.4` (exact pin per D-17) | BigInt-backed rational. ... |
```

**Discipline (Phase 1 D-08 + Pitfall #5):** before writing any math primitive, grep `xen-dev-utils` first. If the upstream exists, delegate (`Source = xen-dev-utils@0.13.1`). If hand-written, justify in the `Notes` cell. Phase 2 adds rows for: `Interval`, `Scale`, `parseScala`, `parseScl`, `writeScl`, `nameForMonzo`, `commaByName`, `oddLimit`, `benedettiHeight`, `toCents`, `centsFrom12tet`, plus re-export rows for the xen-dev-utils helpers exposed via `monzo.ts`.

---

### Pattern S-4: Three-layer import direction (architectural invariant)

**Source:** ARCHITECTURE.md (lines 152–158) + RESEARCH.md §Architectural Responsibility Map (lines 58–67).

**Apply to:** every new file. Compile-time enforcement via `tsc --noEmit` + grep gate (RESEARCH.md NOTES-04 row).

**Rules:**
- `src/lib/*.ts` MUST NOT import from `src/components/`, `src/audio/`, or any browser-specific API (no `document`, no `AudioContext`, no `window`).
- `src/components/*.ts` MAY import types/data from `src/lib/`. MUST NOT import from `sw-synth` directly — use `SynthHandle` from `../audio/synth.js`.
- `src/audio/*.ts` MAY import from `sw-synth`. MUST NOT import from `src/components/` or `src/lib/`.
- `src/*.md` and `src/pages/*.md` MAY import from any of the three layers.
- All cross-file imports use `.js` extension (Framework runtime convention; ARCHITECTURE.md line 157, RESEARCH.md line 82).

**Verification gate (RESEARCH.md NOTES-04, line 648):**
```sh
npm run lint:types && grep -r "createElement\|querySelector\|AudioContext" src/lib/ | wc -l   # must be 0
```

---

### Pattern S-5: Cell-owned synth + invalidation (every page with audio)

**Source:** ARCHITECTURE.md Pattern 4 (lines 343–347) + RESEARCH.md §AudioContext Lifecycle (lines 580–583).

**Apply to:** `src/index.md`, `src/pages/syntonic-comma.md`, and any future page using audio.

**Excerpt** — verbatim:
```js
const synth = createSynth();
invalidation.then(() => synth.dispose());
```

**Constraint** — this cell MUST be in its own code block; MUST NOT depend on any other cell's reactive variable. Editing `scale` or `baseHz` cells must NOT re-run this cell (otherwise the AudioContext gets torn down on every keystroke).

---

### Pattern S-6: Component factory signature (every widget)

**Source:** ARCHITECTURE.md Pattern 2 (lines 201–234) + D-09.

**Apply to:** every file in `src/components/`.

**Signature shape:**
```ts
export function widgetName(
  data: PureKernelType,
  ...explicitDependencies,    // e.g., synth: SynthHandle, baseHz: number
  opts: WidgetOpts = {},
): HTMLElement
```

**Rules:**
- Pure factory — no module-level state, no global registry
- Every dependency passed explicitly (synth, baseHz) — no service-locator pattern
- Returns a freshly-created `HTMLElement`; cell owns the lifetime
- `opts` is the LAST parameter, always optional, always defaulted

---

## No Analog Found

Files with no close in-repo match — planner should rely on RESEARCH.md prescriptions and the ARCHITECTURE.md/PITFALLS.md patterns.

| File | Role | Why No Analog | Authoritative Reference |
|------|------|---------------|-------------------------|
| `src/lib/scala.ts` | parser/serializer | First parser in the project. Custom per Pitfall #5 (no maintained npm package). | RESEARCH.md §.scl Format Reference (lines 357–430); F1–F16 fixtures |
| `src/lib/__tests__/fixtures/*.scl` | static test data | First fixtures of any kind in the project. | RESEARCH.md F1–F16 (lines 408–425) + 5–10 Huygens-Fokker archive samples per D-20 |
| `src/audio/synth.ts` | Web Audio lifecycle wrapper | First file under `src/audio/`. | RESEARCH.md §AudioContext Lifecycle (lines 469–576) — copy the implementation sketch verbatim |
| `src/audio/__tests__/synth.test.ts` | unit test with mocked AudioContext | First test outside `src/lib/__tests__/`. Requires fake-timer + stub `SwSynth`. | RESEARCH.md line 644 |
| `src/components/*` (all 6 files) | DOM factories | First files under `src/components/` (only `.gitkeep` exists today). | ARCHITECTURE.md Pattern 2 (lines 207–234) for the exact factory shape |
| `src/pages/syntonic-comma.md` | second theory page | First file under `src/pages/`. | Use existing `src/index.md` as the structural template (Markdown + fenced cells + inline `${}`); RESEARCH.md line 170–172 for content scope |
| `src/__tests__/dashboard-seed.test.ts` | integration test | First test outside `src/lib/`. Requires `vitest.config.ts:5` glob extension. | RESEARCH.md COMP-03-reframed row (line 652) |

---

## Metadata

**Analog search scope:** `/Users/taylorbrook/Dev/Tuning Systems/src/**`, `/Users/taylorbrook/Dev/Tuning Systems/.planning/research/**`, `/Users/taylorbrook/Dev/Tuning Systems/{tsconfig,vitest.config,package,observablehq.config,eslint.config,.prettierrc}*`.

**Files scanned (in-repo):**
- `src/lib/example.ts`, `src/lib/__tests__/example.test.ts`, `src/lib/INVENTORY.md`
- `src/index.md` (Phase-1 hello), `src/components/.gitkeep`, `src/data/.gitkeep`
- `tsconfig.json`, `vitest.config.ts`, `package.json`, `observablehq.config.ts`, `eslint.config.js`, `.prettierrc`
- `.planning/research/ARCHITECTURE.md` (full)
- `.planning/phases/02.../02-RESEARCH.md` (full), `02-CONTEXT.md` (full), `02-VALIDATION.md` (head)

**Analogs ranked by quality:**
- **Exact**: 8 files (all kernel test files match `example.test.ts` shape exactly)
- **Role-match**: 9 files (kernel modules + INVENTORY rows match `example.ts` shape; Markdown pages match `index.md` shape)
- **Research-prescribed (no in-repo analog, but high-confidence external pattern)**: 13 files (synth, components, scala parser, fixtures, syntonic page)

**Pattern extraction date:** 2026-05-04

**Confidence note:** Phase 1 has produced very few in-repo analogs (`example.ts` + `example.test.ts` are placeholders that get deleted in Phase 2). Most "patterns" come from research artifacts (ARCHITECTURE.md Patterns 1–6, RESEARCH.md implementation sketches). The planner should treat ARCHITECTURE.md and RESEARCH.md as primary code-shape sources; the in-repo `example.ts` provides only the file-header doc-comment style and the `import .js` + Vitest test-shape conventions.
