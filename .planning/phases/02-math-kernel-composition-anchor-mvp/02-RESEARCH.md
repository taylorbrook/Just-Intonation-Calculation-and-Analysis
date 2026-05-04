# Phase 2: Math Kernel + Composition Anchor (MVP) - Research

**Researched:** 2026-05-03
**Domain:** JI math kernel + Scala I/O + Web Audio playback + Markdown widget surface (Observable Framework)
**Confidence:** HIGH for module breakdown, library APIs, .scl spec, and KaTeX wiring (verified via direct .d.ts inspection + Huygens-Fokker spec + npm registry). MEDIUM for the Fraction-class strategy (a subtle compatibility issue between `fraction.js@5` (BigInt) and `xen-dev-utils`'s internal `Fraction` (Number-backed) — see Risk R-01 below; the user must confirm the chosen path before implementation).

## Summary

Phase 1 already produced the four Phase-1 research artifacts (ARCHITECTURE.md, PITFALLS.md, STACK.md, FEATURES.md) and the orchestrator's CONTEXT.md (D-01..D-24) locked the Phase-2 user decisions. **This research does not redo any of that work.** Its purpose is to fill the gaps the planner needs to write executable plans:

1. **A concrete module-level breakdown** — what file gets created, what it owns, which imports it makes, which APIs it calls (Section: Module Breakdown).
2. **Pinned library API references** — exact function names, signatures, and gotchas for `xen-dev-utils`, `sw-synth`, `fraction.js`, taken straight from `node_modules/*/dist/*.d.ts` (Section: Library API Map).
3. **A line-by-line `.scl` spec walkthrough** with the spec's edge cases enumerated as parser test fixtures (Section: .scl Format Reference).
4. **The KaTeX wiring pattern** through Framework's `head` config option (Section: KaTeX Wiring).
5. **The AudioContext lifecycle pattern** as concrete code, including voice tracking and the polyphony cap from D-17 (Section: AudioContext Lifecycle).
6. **A Validation Architecture** that maps every Phase-2 requirement (MATH-* / SCALE-* / IO-* / AUDIO-* / NOTES-* / COMP-*) to a specific test command (Section: Validation Architecture — REQUIRED by config).
7. **One critical risk** the planner MUST resolve before writing tasks: the `fraction.js@5` BigInt class and the `xen-dev-utils` Number-backed `Fraction` class are **two different incompatible types** (Section: Risks — R-01 with HIGH severity).

**Primary recommendation:** Resolve R-01 first (Section: Risks). Then plan the kernel as ~12 small files (Section: Module Breakdown) wrapping `xen-dev-utils` helpers wherever possible, with a hand-written `scala.ts` parser for the I/O boundary, an audio module that wraps `sw-synth` with a lazy `AudioContext` + voice-ID tracking, and a four-widget component set (per D-10) consumed by `src/index.md` and `src/pages/syntonic-comma.md`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MATH-01 | BigInt-backed `Interval`; arbitrary ratio round-trips exactly | Library API Map → fraction.js@5 (n: bigint, d: bigint); Module Breakdown → `src/lib/interval.ts` |
| MATH-02 | Lazy monzo computation from any `Interval` | xen-dev-utils `toMonzo(n: FractionValue \| bigint): Monzo`; cached in `Interval.#monzo` |
| MATH-03 | Cents conversion + signed cents-from-12tet (display projection only) | xen-dev-utils `valueToCents`, `monzoToCents`; `Interval.cents` getter; `Interval.centsFrom12tet` getter |
| MATH-04 | Multiply / divide / invert / octave-reduce / complement (preserve exact rationals) | fraction.js `mul/div/inverse`; `Interval.octaveReduce(period?)` per Pitfall #13 |
| MATH-05 | Tenney height, Benedetti height, prime-limit, odd-limit | xen-dev-utils `tenneyHeight`, `wilsonHeight` (≈ Benedetti for our purposes), `primeLimit`; oddLimit hand-written from monzo |
| MATH-06 | Named-comma identification by canonical monzo | `src/lib/commas.ts` lookup table keyed by `monzosEqual` (xen-dev-utils); D-21 = ~15-25 commas; per Pitfall #1 NEVER cents-within-epsilon |
| SCALE-01 | Build `Scale` from text input (mixed ratios / cents / monzos) | Shared parser per D-12 in `src/lib/scala.ts`; D-15 monzo notation `[-2 0 1>` |
| SCALE-02 | Sort, dedupe, octave-reduce period-aware (not just 2/1) | `Scale.reduce(period)` per Pitfall #13; `period` field on `Scale` |
| SCALE-03 | Mode rotation | `Scale.rotate(degree)` returning new Scale; immutable per D-24 |
| SCALE-04 | Transpose by interval | `Scale.transpose(by: Interval)` returning new Scale |
| SCALE-05 | Construct JI subset of an EDO | xen-dev-utils `approximatePrimeLimit(cents, ...)` per EDO step |
| IO-01 | Parse Scala `.scl` (ratios, cents, comments, implicit 1/1, `.`-detection) | .scl Format Reference section + 12-edge-case fixture list |
| IO-02 | Serialize `Scale` to `.scl` | `writeScl(scale, description?)` returns string; do NOT emit unison line per D-13 |
| IO-04 | Copy ratios + cent-deviation table to clipboard | Component method on `scaleTable`; `navigator.clipboard.writeText` |
| IO-05 | Round-trip golden tests against Huygens-Fokker `.scl` archive | Validation Architecture → golden corpus 10-15 files (D-20) |
| AUDIO-01 | Lazy `AudioContext` in `createSynth()`; disposed via `invalidation` | AudioContext Lifecycle section — exact pattern + dev-leak counter |
| AUDIO-02 | Click-to-play interval with ADSR (no clicks/pops) | `sw-synth` `defaultParams()` provides ADSR; D-16 overrides (5/30/0.7/150ms) |
| AUDIO-03 | Arpeggio audition for full scale | `synth.playArpeggio(freqs, stepSec)` wrapping per-note `noteOn` with scheduled `t + i*step` |
| AUDIO-04 | Drone + interval-over-drone | `synth.startDrone(hz)` returns stop fn; D-07 toggle pattern |
| AUDIO-05 | Polyphony cap with voice tracking — no orphaned voices | `sw-synth` `maxPolyphony` (D-17 = 16) + voice-ID map for explicit `noteOff` |
| NOTES-01 | Markdown prose + reactive JS cells | Framework baseline — Phase 1 already proved (D-14) |
| NOTES-02 | KaTeX math typesetting in prose | KaTeX Wiring section — `head: <link rel="stylesheet" href=".../katex.min.css" ...>` |
| NOTES-03 | Inline widget pattern via Markdown `${...}` | D-09 plain factory functions returning `HTMLElement` |
| NOTES-04 | Reusable `src/lib/` (pure) and `src/components/` (DOM); INVENTORY.md | Module Breakdown enforces three-layer separation; INVENTORY entries listed per file |
| NOTES-05 | At least one additional general theory page | D-04 → `src/pages/syntonic-comma.md` (81/80, exercises every kernel feature) |
| COMP-01 (reframed) | Seed scale + reusable scale primitives (NOT per-piece module) | D-01/D-02 → seed scale `1/1, 9/8, 5/4, 21/16, 3/2, 27/16, 7/4, 2/1` is a constant in `src/index.md`, NOT a `pieces/` module |
| COMP-02 (reframed) | General dashboard at `src/index.md` exercises every kernel feature | D-03/D-05 — 7-row vertical layout |
| COMP-03 (reframed) | CI test asserts seed scale parses + round-trips through `.scl` | Validation Architecture → integration test layer |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Ratio / monzo arithmetic, scale ops | `src/lib/` (pure) | — | Zero DOM, zero audio. Vitest-testable in Node. |
| `.scl` parse/serialize | `src/lib/` (pure) | — | String ↔ data. No I/O side effects (caller does the file/blob/clipboard). |
| Named-comma lookup | `src/lib/` (pure) | — | Static table; pure function. |
| DOM widgets (table, ratio pill, play buttons) | `src/components/` (DOM) | `src/lib/` (data input) | Components are factories `(data, opts) => HTMLElement`. Receive `Interval` / `Scale` from page cells; return DOM. |
| AudioContext lifecycle, polyphony, dispose | `src/audio/` (lifecycle) | `sw-synth` (oscillator engine) | Lifecycle concerns belong here, NOT in components. One synth per page. |
| Reactive cell wiring, dashboard layout | `src/index.md` (page) | imports from lib/components/audio | Page owns state (`scale`, `baseHz`, `synth`). Cells run reactively. |
| KaTeX math rendering | Framework `head` config | — | Build-time injection of CSS link tag in `observablehq.config.ts`. No runtime cost beyond CSS load. |
| Clipboard / blob download (`.scl`) | `src/components/` (DOM) | `src/lib/scala.ts` (string output) | DOM tier owns side-effecting browser APIs (`navigator.clipboard`, `URL.createObjectURL`). |

## Project Constraints (from CLAUDE.md)

The planner MUST honor these; tasks that contradict them are bugs.

- **Tech stack is Observable Framework** — no swap to Astro / Quarto / Next / etc.
- **Language is JS/TS** — no Python, no Rust, no WASM.
- **Math precision: BigInt-backed fractions** — floats only at the display layer.
- **Audio: in-browser only** (Web Audio API) — no native bridge.
- **Notation surface: ratios + cents + cents-from-12tet only** — NO staff engraving (Verovio/Vexflow/Lilypond explicitly forbidden).
- **Distribution: static site, self-hostable** — no backend.
- **Use `npm`, NOT pnpm** (Framework module-resolution quirks per discussion #1606).
- **Node 20 LTS** (`.nvmrc` already set).
- **TS strict from day 1** (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes` all on per Phase-1 D-16). The planner MUST account for `noUncheckedIndexedAccess` — array-index access requires guards (especially for monzo arrays and parsed line tokens).
- **`.ts` imports use `.js` extension** even for `.ts` source — Framework convention.
- **Co-located tests** under `src/lib/__tests__/` — already wired in `vitest.config.ts`.
- **`Fraction` exact-pinned to 5.3.4** — do NOT loosen the version constraint.
- **`temperaments` and `mathjs` are forbidden** (CI deny-list grep is in place per Phase 1 D-21). Anything Phase 2 needs from those packages must be hand-written or sourced from `xen-dev-utils`.
- **No top-level `new AudioContext()`** — must be lazy inside a user-gesture handler.
- **Wrap-don't-reimplement discipline** (Pitfall #5) — every new kernel primitive must check `xen-dev-utils` first; record the source in `src/lib/INVENTORY.md`.

## Module Breakdown

The planner should produce roughly the file set below. Each row lists the file, its responsibility, and the **specific external APIs it will invoke** (so the planner can write task-level "implement function X by calling Y from package Z" instructions).

### `src/lib/` (pure kernel — NO DOM, NO audio)

| File | Responsibility | Key APIs Invoked | INVENTORY entry |
|------|---------------|------------------|-----------------|
| `interval.ts` | `Interval` class — wraps a `Fraction` (BigInt source of truth); lazy monzo + cents getters; `mul`, `div`, `inv`, `octaveReduce(period?)`, `equals` | `import {Fraction} from "fraction.js"` → `new Fraction(string)`, `.mul(other)`, `.div(other)`, `.inverse()`, `.equals(other)`, `.toFraction()`, `.valueOf()` | Custom (wraps fraction.js@5) |
| `monzo.ts` | Re-exports + thin wrappers over xen-dev-utils monzo helpers; provides `monzoLengthMatch(a, b)` padding helper per Pitfall #14 | `import {toMonzo, monzoToFraction, monzoToBigNumeratorDenominator, primeLimit, monzosEqual, add, sub, scale, tenneyHeight, wilsonHeight, PRIMES} from "xen-dev-utils"` | Delegates to xen-dev-utils@0.13.1 |
| `cents.ts` | `cents(interval)` and `centsFrom12tet(cents)` (pure functions, lossy projections — flag as such per Pitfall #1) | `import {valueToCents, monzoToCents} from "xen-dev-utils"` | Delegates to xen-dev-utils@0.13.1 |
| `scale.ts` | `Scale` class — `intervals: Interval[]`, `period: Interval`; methods: `rotate(degree)`, `reduce()`, `dedupe()`, `transpose(by)`, `degreeToFreq(deg, baseHz)`. All immutable (D-24). | `interval.ts`; `xen-dev-utils.arraysEqual` for dedupe by canonical fraction. | Custom (over `Interval`) |
| `scala.ts` | `parseScala(body: string): Interval[]` + `parseScl(file: string): {description: string, intervals: Interval[]}` (sharing the body parser per D-12) + `writeScl(scale: Scale, description?: string): string`. Auto-prepend `1/1` per D-13; treat last line as period per D-14; bra-ket monzo per D-15 | `interval.ts`; `monzo.ts` for `[-2 0 1>` parse; `cents.ts` for `408.0` cents lines (lossy, flagged) | Custom (no upstream parser) |
| `commas.ts` | Hand-curated table of named commas (D-21: 15-25 entries, e.g., syntonic 81/80 = `[-4, 4, -1]`, Pythagorean comma, schisma, septimal comma, diaschisma) keyed by canonical monzo. `nameForMonzo(m: Monzo): string \| undefined`; `commaByName(n: string): Interval \| undefined`. | `monzo.ts` `monzosEqual`; `interval.ts`; `xen-dev-utils.PRIMES` for monzo construction | Custom data + lookup |
| `__tests__/interval.test.ts` | round-trip `81/79`, `2147483648/2147483647`, monzo round-trip, equality | vitest | — |
| `__tests__/monzo.test.ts` | `toMonzo(81n)` → `[0, 4]`; mixed-length addition; prime 2 handling | vitest | — |
| `__tests__/scale.test.ts` | rotate, reduce with `2/1` AND `3/1` (Bohlen-Pierce per Pitfall #13), dedupe | vitest | — |
| `__tests__/scala.test.ts` | parse + serialize round-trip; the 12 edge-case fixtures listed below; auto-1/1 prepending; period detection | vitest | — |
| `__tests__/commas.test.ts` | syntonic vs schisma distinguished by monzo (Pitfall #1, #6) | vitest | — |
| `__tests__/seed-scale.test.ts` | COMP-03 reframed: D-02 seed scale parses, displays cents, round-trips through `writeScl` → `parseScl` | vitest | — |

### `src/audio/` (lifecycle + voice management)

| File | Responsibility | Key APIs Invoked |
|------|---------------|------------------|
| `synth.ts` | `createSynth(opts?)` factory returning a `Synth` interface: `playNote(hz, dur)`, `playNotes(freqs[], dur)`, `playArpeggio(freqs[], stepSec)`, `startDrone(hz): () => void`, `dispose()`. Lazy `AudioContext`; voice-ID `Map<string, () => void>` for tracking; `maxPolyphony = 16` (D-17); ADSR override per D-16. | `import {Synth, defaultParams} from "sw-synth"` → `new Synth(audioContext, audioContext.destination)`; `synth.maxPolyphony = 16`; `synth.voiceParams = {...defaultParams(), attackTime: 0.005, decayTime: 0.030, sustainLevel: 0.7, releaseTime: 0.150}`; `synth.noteOn(hz, velocity)` returns the `noteOff` callback; `synth.allNotesOff()` for panic |
| `envelopes.ts` (optional) | Named ADSR presets (default, plucked, drone) | re-exports `defaultParams` from sw-synth with overrides | — |

### `src/components/` (DOM factories — consume kernel data, emit `HTMLElement`)

Per D-09: every widget is `(data, ...rest, opts?) => HTMLElement`. No singletons, no global synth registry — synth is passed as a parameter (D-09).

| File | Responsibility | Key APIs Invoked | Used by |
|------|---------------|------------------|---------|
| `play-interval.ts` | `playInterval(interval, synth, opts?)` → `<button>` that on click plays `[baseHz, baseHz * interval.valueOf()]` for `opts.duration` seconds (D-18 default 1.5s) | `interval.ts`, `synth.ts` | Theory pages, dashboard NOT (D-07 separates audio panel) |
| `play-scale.ts` | `playScale(scale, synth, opts?)` → `<button>` that arpeggiates the scale at `stepSec = 0.45`, `noteLen = stepSec * 0.95` (D-18) | `scale.ts`, `synth.ts` | Dashboard audio panel, theory pages |
| `scale-table.ts` | `scaleTable(scale, baseHz, opts?)` → `<table>` with 4 columns Degree / Ratio / Cents / ¢ from 12-TET (D-06); cents at 0.1¢ default (Pitfall #16); IO-04 clipboard button optional via `opts.copyButton: true` | `scale.ts`, `cents.ts` | Dashboard AND syntonic-comma page (D-11 — same widget) |
| `ratio-pill.ts` | `ratioPill(interval, opts?)` → `<span>` with "⁸¹⁄₈₀ (~21.5¢)" inline display, no audio | `interval.ts`, `cents.ts` | Theory pages prose |
| `audio-panel.ts` (dashboard-only) | Renders the D-07 panel: interval-selector dropdown + Arpeggiate button + Drone toggle. Internally uses `playScale` + `startDrone` from synth | `synth.ts`, `scale.ts` | `src/index.md` |
| `scl-io.ts` (dashboard-only) | "Import .scl" file picker + "Export .scl" download button. Filename per D-22: `scale-{N}-tone-{date}.scl` | `scala.ts`; `URL.createObjectURL`, `<input type="file">` | `src/index.md` |

### `src/index.md` (the dashboard — replaces Phase-1 hello)

Reading order per D-05:
1. One-line description (Markdown)
2. Scale text input (`<textarea>` + reactive cell parsing into `scale`)
3. `${scaleTable(scale, baseHz)}`
4. Reference-pitch input (`<input type="number">` for `baseHz`, default 440 per D-08)
5. `${audioPanel(scale, synth, baseHz)}`
6. `${sclIo(scale, synth)}` import/export controls
7. (Optional) prose section linking to `pages/syntonic-comma.md`

Reactive cell structure:
```js
// Cell A — synth, owned by its own cell so it doesn't re-run on scale edits
const synth = createSynth();
invalidation.then(() => synth.dispose());
```
```js
// Cell B — seed scale text (D-02)
const seed = `9/8\n5/4\n21/16\n3/2\n27/16\n7/4\n2/1`;
```
```js
// Cell C — user-editable text via Inputs.textarea or raw <textarea>
const scaleText = view(Inputs.textarea({value: seed, rows: 8}));
```
```js
// Cell D — parse text into a Scale
const scale = new Scale(parseScala(scaleText));   // parseScala auto-prepends 1/1 (D-13)
```
```js
// Cell E — base Hz
const baseHz = view(Inputs.number({value: 440, step: 0.01, label: "A4 reference (Hz)"}));
```
```js
// Cell F-H — display widgets
display(scaleTable(scale, baseHz));
display(audioPanel(scale, synth, baseHz));
display(sclIo(scale));
```

### `src/pages/syntonic-comma.md` (D-04, NOTES-05)

~1 page of prose about 81/80 with 3-5 embedded widgets. Imports the seed scale to demonstrate that `5/4` and `81/64` differ by exactly one syntonic comma (the 5-limit major third vs. the Pythagorean major third). Uses KaTeX for `\frac{81}{80}` and the monzo `[-4, 4, -1\rangle`. Shares the page-cell synth pattern.

### `observablehq.config.ts` (KaTeX wiring)

```ts
export default {
  title: "Tuning Systems",
  root: "src",
  pages: [
    {name: "Syntonic comma", path: "/pages/syntonic-comma"},
  ],
  head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM" crossorigin="anonymous">`,
};
```

See KaTeX Wiring section below for the complete pattern (and why we ship CSS only, not auto-render JS).

## Library API Map

Verified against `node_modules/*/dist/*.d.ts` on 2026-05-03. Versions confirmed via `npm view <pkg> version`.

### `fraction.js@5.3.4` — the BigInt-backed source-of-truth class

Imported as `import {Fraction} from "fraction.js"` (do NOT use the xen-dev-utils re-export; see R-01).

```ts
class Fraction {
  s: bigint;            // sign: -1n | 0n | 1n
  n: bigint;            // numerator (always non-negative)
  d: bigint;            // denominator (always positive)

  constructor();
  constructor(num: FractionInput);                                       // "5/4", 1.25, 5n, etc.
  constructor(numerator: number | bigint, denominator: number | bigint); // (5n, 4n)

  add(other): Fraction;                  // chainable
  sub(other): Fraction;
  mul(other): Fraction;
  div(other): Fraction;
  pow(other): Fraction;
  log(other): Fraction;                  // log of `this` in base `other`
  gcd(other): Fraction;
  lcm(other): Fraction;
  mod(): Fraction;
  mod(other): Fraction;
  inverse(): Fraction;                   // 1/this
  abs(): Fraction;
  neg(): Fraction;
  simplify(eps?: number): Fraction;

  equals(other): boolean;                // exact rational equality
  lt / lte / gt / gte / compare / divisible

  valueOf(): number;                     // float decimal — LOSSY for huge ratios; use only at display
  toString(decimalPlaces?: number): string;
  toFraction(showMixed?: boolean): string; // "81/80"
  toLatex(showMixed?: boolean): string;    // "\\frac{81}{80}" — handy for KaTeX
  toContinued(): bigint[];
  clone(): Fraction;
}

type FractionInput =
  | Fraction | number | bigint | string
  | [number | bigint | string, number | bigint | string]
  | { n: number | bigint; d: number | bigint };
```

**Key for Phase 2:**
- Construct from string for safety: `new Fraction("81/79")`. Constructing from `number` (e.g. `new Fraction(0.1)`) defloat-approximates and can lose intent for values that don't have an exact float representation.
- `equals()` is exact rational equality. Use it, never `Math.abs(a.cents() - b.cents()) < EPS` (Pitfall #1).
- `toLatex()` produces KaTeX-compatible source — useful for the syntonic-comma page.
- `valueOf()` returns a `number`. For `81/79` this is `1.0253...`. For `Number.MAX_SAFE_INTEGER`-class numerators it loses precision; in Phase 2 we only use `valueOf()` at the audio boundary (multiplying `baseHz`) and at the cents projection — both lossy contexts where this is acceptable.

### `xen-dev-utils@0.13.1` — math helpers (delegates to xen-dev-utils per INVENTORY discipline)

Import surface for Phase 2:

```ts
// from xen-dev-utils

// Conversion (display-layer helpers)
function valueToCents(value: number): number;             // 1200 * log2(value)
function centsToValue(cents: number): number;             // 2^(cents/1200)
function frequencyToCentOffset(freq: number, baseFreq?: number): number;
function centOffsetToFrequency(offset: number, baseFreq?: number): number;

// Monzo helpers
type Monzo = number[];                                    // exponents per prime in PRIMES order
function toMonzo(n: FractionValue | bigint): Monzo;       // factorizes; throws for non-positive
function monzoToFraction(monzo: Iterable<number>): Fraction;          // returns xen-dev-utils Fraction (Number-backed) — see R-01
function monzoToBigInt(monzo: Iterable<number>): bigint;              // when all components ≥ 0
function monzoToBigNumeratorDenominator(monzo: Iterable<number>): {numerator: bigint; denominator: bigint};  // ★ this is the BigInt-safe path back to fraction.js
function primeLimit(n: FractionValue | bigint, asOrdinal?: boolean): number;
function toMonzoAndResidual(n, numberOfComponents): [Monzo, bigint | Fraction];
function primeFactorize(value: FractionValue): Map<number, number>;  // sparse monzo
function monzosEqual(a: Monzo, b: Monzo): boolean;        // length-mismatch tolerant
function add(a: Monzo, b: Monzo): Monzo;                  // pads to longer length
function sub(a: Monzo, b: Monzo): Monzo;                  // pads
function scale(monzo: Monzo, amount: number): number[];

// Heights (complexity metrics)
function tenneyHeight(value: Monzo | FractionValue): number;   // log(|n*d|)
function wilsonHeight(value: Monzo | FractionValue | Map<number, number>): number; // sum of prime factors with repetition
// NB: Benedetti height = n*d itself (not log); compute as Number(num * den) where (num, den) come from monzoToBigNumeratorDenominator. xen-dev-utils does NOT export `benedettiHeight` directly.

// Primes
const PRIMES: number[];           // [2, 3, 5, 7, 11, 13, ...] up to 7919
const BIG_INT_PRIMES: bigint[];   // BigInt versions
const LOG_PRIMES: number[];
const PRIME_CENTS: number[];
function isPrime(n: number): boolean;
function nthPrime(n: number): number;

// Approximations (useful for SCALE-05: JI subset of an EDO)
function approximatePrimeLimit(cents: number, limitIndex: number, maxExponent: number, maxError?: number, maxLength?: number): Fraction[];
function approximateOddLimit(cents: number, limit: number): Fraction[];

// Misc
function arraysEqual<T>(a: AnyArray<T>, b: AnyArray<T>): boolean;
function gcd(a: number | bigint, b: number | bigint): number | bigint;  // overloaded
function mmod(a, b);                                      // mathematically correct mod
```

**The hidden compatibility issue (R-01):** `xen-dev-utils` ships its **own** `Fraction` class (in `xen-dev-utils/dist/fraction.js`), and the in-source comment on line 1 reads literally `"I'm rolling my own because fraction.js has trouble with TypeScript"`. That class has `n: number, d: number` — **NOT** BigInt. All xen-dev-utils functions that take or return `Fraction` (e.g. `monzoToFraction`, `approximateOddLimit`) operate on the Number-backed class.

Implication: when we want to round-trip a monzo back to a BigInt-backed `fraction.js` `Fraction`, we MUST use `monzoToBigNumeratorDenominator(monzo)` (which returns `{numerator: bigint, denominator: bigint}`) and then construct `new Fraction(num, den)`. We must NOT call `monzoToFraction(monzo)` and assume the result is BigInt-backed; it isn't.

`toMonzo` is fine because it takes `bigint` and returns `number[]` — no `Fraction` class on either side.

### `sw-synth@0.4.0` — Web Audio synth

```ts
import {Synth, defaultParams, defaultUnisonParams, UnisonSynth, AperiodicSynth, BufferSynth} from "sw-synth";

class Synth<VoiceType = OscillatorVoice> {
  audioContext: BaseAudioContext;
  destination: AudioNode;
  voiceParams?: OscillatorVoiceParams;
  voices: VoiceType[];
  pitchBend: AudioParam;
  log: (msg: string) => void;
  maxPolyphony: number;     // getter/setter

  constructor(audioContext: BaseAudioContext, destination: AudioNode, log?: (msg: string) => void);
  noteOn(frequency: number, velocity: number, pitchBendRange?: PitchBendRange): () => void;  // returns noteOff callback
  allNotesOff(): void;      // panic
  setPolyphony(maxPolyphony: number): void;
}

interface OscillatorVoiceParams {
  type: OscillatorType;             // "sine" | "sawtooth" | "triangle" | "square" | "custom"
  periodicWave?: PeriodicWave;
  // ADSR (from VoiceBaseParams)
  audioDelay: number;               // sec; bump on Firefox to reduce pops
  attackTime: number;               // sec
  decayTime: number;                // exponential time constant from 1 to sustainLevel
  sustainLevel: number;             // 0..1
  releaseTime: number;              // exponential time constant from sustainLevel to 0
}

function defaultParams(): OscillatorVoiceParams;
```

**Key for Phase 2:**
- The constructor takes `audioContext` and `destination` — we'll insert a master `GainNode` between `audioContext.destination` and the synth so we can set master volume independently.
- `noteOn(hz, velocity)` returns a `noteOff` callback. **This is critical** for AUDIO-04 (drone) and AUDIO-05 (voice tracking) — store the callback in a `Map<voiceId, () => void>` to allow explicit release.
- `allNotesOff()` is the panic button — wire it to an Esc-key handler on the dashboard (Pitfall UX: "audio button without obvious stop all").
- ADSR fields are time **constants**, not durations — `releaseTime: 0.150` means the envelope decays exponentially with τ = 150ms (not "stops at 150ms").
- `pitchBend` is an `AudioParam` — we don't need it in v1; ignore.
- `maxPolyphony` defaults vary by class; setting it explicitly to 16 (D-17) gives FIFO eviction when exceeded.

**Voice classes:** for Phase 2, use the base `Synth` (plain `OscillatorVoice`). `UnisonSynth`, `AperiodicSynth`, `BufferSynth` are out of scope.

### Observable Framework — `head` config + reactivity

From the Framework docs:
- `head` in `observablehq.config.ts` accepts a **string** (HTML fragment) OR a **function** `({path}) => string`. Per the Framework v1.5+ release notes, `head` is the recommended replacement for the older `scripts` option for injecting `<link>` / `<script>` tags.
- Local assets can be referenced from `head` (e.g., `head: '<link rel="icon" href="/favicon.png">'`).
- `invalidation` is a per-cell promise that resolves when the cell is re-evaluated (code change, Shift-Enter, dependency change). The classic pattern is `invalidation.then(() => cleanup())`.
- `display(elem)` mounts `elem` into the cell's output. Cells re-run reactively on dependency change; the previous `display`'d element is removed automatically.
- `Inputs.textarea`, `Inputs.number`, `Inputs.text` are the standard scaffolded inputs from `@observablehq/inputs` (bundled with Framework).
- `view(input)` is a Framework helper that both displays the input AND returns its reactive value — use it for the dashboard inputs.

## .scl Format Reference

Source: https://www.huygens-fokker.org/scala/scl_format.html (verified via WebFetch 2026-05-03).

### Line Structure

```
! comment line (any number of these, anywhere)
<description, exactly one line — first non-comment line; can be empty>
<pitch count, second non-comment line — integer; spaces allowed before/after; EXCLUDES the implicit 1/1>
<pitch line 1>
<pitch line 2>
...
<pitch line N>
```

### Pitch Line Format

Per the spec: **"If the value contains a period, it is a cents value, otherwise a ratio."**

| Token | Type | Meaning |
|-------|------|---------|
| `5/4` | ratio | 5/4 |
| `81/64` | ratio | 81/64 |
| `5` | ratio | "5" → `5/1` (per spec: "Integer values with no period or slash should be regarded as such") |
| `408.0` | cents | 408.0¢ |
| `408.` | cents | 408.0¢ — trailing-period IS cents (test fixture) |
| `.5` | cents | 0.5¢ — leading-period IS cents (test fixture) |
| `-5.0` | cents | -5.0¢ (cents may be negative; the spec example list includes this) |
| `100.0 cents` | cents | 100.0¢ — anything after the value is ignored |
| ` 5/4   E\\ ` | ratio | 5/4 — surrounding whitespace and trailing comment text are ignored |
| `2/3/4` | INVALID | "Ratios are written with a slash, and only one." → must error |
| `-5/4` | INVALID | "Negative ratios are meaningless and should give a read error." |

### Implicit 1/1 (D-13)

> "The first note of 1/1 or 0.0 cents is implicit and not in the files."

The pitch count is the count **after** the implicit unison. A 7-tone scale has pitch count `7` and 7 lines after the count line. The `Scale` we construct has 8 intervals (the implicit `1/1` plus the 7 listed).

The serializer (`writeScl`) likewise must NOT emit the unison line, even if the in-memory `Scale` carries it.

### Period (D-14)

> The last pitch in the file IS the period. There is no separate period line.

Octave scales end with `2/1` (or `1200.0`). Tritave scales (Bohlen-Pierce) end with `3/1` (or `1901.955`). Other periods are valid.

### Edge-Case Test Fixtures (the parser must handle all of these)

These ARE the test corpus the planner should generate as `src/lib/__tests__/fixtures/*.scl`:

| # | Fixture name | Content | What it tests |
|---|--------------|---------|---------------|
| F1 | `simple-7limit.scl` | Description, count 7, then `9/8` … `2/1` | Happy path |
| F2 | `cents-only.scl` | All pitches as `100.0`, `200.0`, ..., `1200.0` | Cents detection via `.` |
| F3 | `mixed-ratio-cents.scl` | `9/8`, `408.0`, `4/3`, `700.0`, `5/3`, `1100.0`, `2/1` | Mixed types in one file |
| F4 | `trailing-dot.scl` | A line with `408.` | Cents detection on trailing-period |
| F5 | `leading-dot.scl` | A line with `.5` | Cents detection on leading-period |
| F6 | `bare-integer.scl` | A line with `2` (must parse as `2/1`) | Bare-integer ratio |
| F7 | `comments-everywhere.scl` | `!` lines before description, between pitches, after pitches | Comment skipping; pitch count = non-comment lines minus 2 |
| F8 | `bohlen-pierce.scl` | 9 lines ending in `3/1` | Non-octave period (Pitfall #13) |
| F9 | `whitespace-and-trailing-text.scl` | `  5/4  E\` (note name suffix), tabs, trailing spaces | Whitespace handling |
| F10 | `empty-description.scl` | Description line is empty | Per spec: "If there is no description, there should be an empty line." |
| F11 | `mismatched-pitch-count.scl` | Count says 5, but only 4 pitch lines follow | MUST error with a clear message |
| F12 | `negative-ratio.scl` | `-5/4` | MUST error |
| F13 | `multi-slash.scl` | `2/3/4` | MUST error |
| F14 | `large-numerator.scl` | `2147483648/2147483647` (the exact 2^31 boundary the spec calls out) | BigInt path; verifies fraction.js@5 not v4 |
| F15 | `crlf-line-endings.scl` | Same as F1 but with `\r\n` line terminators | Cross-platform line endings |
| F16 | `bom.scl` | UTF-8 BOM (0xEF 0xBB 0xBF) prefix | BOM stripping |

D-20 says "10-15 representative samples from the Huygens-Fokker archive." The above 16 fixtures are **synthetic** edge cases; the planner should ALSO add ~5-10 real archive files (e.g., `partch_43.scl`, `slendro.scl`, `young_lm.scl`, a chromatic 12-tone JI, a 31edo cents-only file) for IO-05 round-trip testing.

### Round-Trip Invariant

For every valid file F: `parse(F) → Scale s; serialize(s) → string F'; parse(F') → Scale s'`. Required: `s.intervals.map(i => i.fraction.toFraction()) === s'.intervals.map(i => i.fraction.toFraction())` AND `s.period.fraction.equals(s'.period.fraction)`. Description and comment lines are NOT required to round-trip identically.

## KaTeX Wiring

D-23: KaTeX wired in `observablehq.config.ts` via the `head:` injection pattern. CSS only — no auto-render JS (per the user's specifics, "auto-render is optional and adds runtime cost"). Markdown prose uses `$...$` (inline) / `$$...$$` (display).

### The Injection

In `observablehq.config.ts`:

```ts
export default {
  title: "Tuning Systems",
  root: "src",
  pages: [
    {name: "Syntonic comma", path: "/pages/syntonic-comma"},
  ],
  head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM" crossorigin="anonymous">`,
};
```

Verified URL + SRI hash from https://katex.org/docs/browser.html on 2026-05-03 (KaTeX v0.16.45, latest per `npm view katex version`).

### Rendering Math in Markdown

Observable Framework's stdlib exposes a `tex` template tag (it imports KaTeX as `npm:katex`). With the CSS injected, Markdown cells can use:

```markdown
The syntonic comma is ${tex`\frac{81}{80} \approx 21.5\text{¢}`}.
```

OR (after Framework v1.7+) the `$...$` / `$$...$$` Markdown syntax IF the Framework Markdown extension for math is enabled. The simpler, more reliable path is `${tex`...`}` — that uses the same `npm:katex` Framework already auto-bundles when a cell references it, so we get tree-shaking and no extra `<script>` tag.

**The CSS injection alone is sufficient** because the JS comes through `npm:katex` lazy-import the moment the first cell uses `tex`. Framework auto-bundles the JS; we just need the CSS link in the head so the rendered formulas are styled correctly.

### KaTeX in `ratioPill` (optional)

`Fraction.toLatex()` produces `"\\frac{81}{80}"` directly — the planner should consider rendering ratio pills via KaTeX for the typographically-correct stacked fraction look. Trade-off: each `ratioPill` becomes async/heavier. For v1, prefer the simpler Unicode "⁸¹⁄₈₀" form (D-10 example shows this).

## AudioContext Lifecycle (Pattern 4 — locked from ARCHITECTURE.md, made concrete here)

The single most leak-prone subsystem in the project. The pattern below MUST be followed verbatim by every page that has audio.

### `src/audio/synth.ts` Implementation Sketch

```ts
import {Synth as SwSynth, defaultParams, type OscillatorVoiceParams} from "sw-synth";

export interface SynthHandle {
  /** Play a single note for `dur` seconds. Returns a noteOff callback. */
  playNote(hz: number, dur?: number): () => void;
  /** Play a chord (simultaneous). */
  playNotes(freqs: number[], dur?: number): void;
  /** Play arpeggio with `stepSec` between note onsets. */
  playArpeggio(freqs: number[], stepSec?: number): void;
  /** Start a sustained drone. Returns a stop callback. */
  startDrone(hz: number): () => void;
  /** Stop everything immediately. */
  panic(): void;
  /** Number of currently-playing voices (for dev assertions). */
  readonly activeVoices: number;
  /** Tear down the AudioContext and all voices. */
  dispose(): void;
}

export interface CreateSynthOpts {
  master?: number;            // default 0.2
  maxPolyphony?: number;      // default 16 (D-17)
  voiceParams?: Partial<OscillatorVoiceParams>;
}

const DEFAULT_NOTE_DUR = 1.5;   // D-18
const DEFAULT_ARP_STEP = 0.45;  // D-18

export function createSynth(opts: CreateSynthOpts = {}): SynthHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let synth: SwSynth | null = null;
  let activeVoices = 0;

  const ensure = (): void => {
    if (ctx) return;
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    ctx = new Ctx({latencyHint: "interactive"});
    master = ctx.createGain();
    master.gain.value = opts.master ?? 0.2;
    master.connect(ctx.destination);
    synth = new SwSynth(ctx, master);
    synth.maxPolyphony = opts.maxPolyphony ?? 16;
    synth.voiceParams = {
      ...defaultParams(),
      attackTime: 0.005,
      decayTime: 0.030,
      sustainLevel: 0.7,
      releaseTime: 0.150,
      ...opts.voiceParams,
    };
  };

  const playNote: SynthHandle["playNote"] = (hz, dur = DEFAULT_NOTE_DUR) => {
    ensure();
    const off = synth!.noteOn(hz, 0.7);
    activeVoices++;
    const timer = setTimeout(() => {
      off();
      activeVoices--;
    }, dur * 1000);
    return () => {
      clearTimeout(timer);
      off();
      activeVoices--;
    };
  };

  return {
    playNote,
    playNotes(freqs, dur = DEFAULT_NOTE_DUR) {
      ensure();
      for (const hz of freqs) playNote(hz, dur);
    },
    playArpeggio(freqs, stepSec = DEFAULT_ARP_STEP) {
      ensure();
      const noteLen = stepSec * 0.95;
      freqs.forEach((hz, i) => {
        setTimeout(() => playNote(hz, noteLen), i * stepSec * 1000);
      });
    },
    startDrone(hz) {
      ensure();
      const off = synth!.noteOn(hz, 0.5);
      activeVoices++;
      return () => { off(); activeVoices--; };
    },
    panic() {
      synth?.allNotesOff();
      activeVoices = 0;
    },
    get activeVoices() { return activeVoices; },
    dispose() {
      synth?.allNotesOff();
      master?.disconnect();
      ctx?.close().catch(() => {});
      ctx = null; master = null; synth = null; activeVoices = 0;
    },
  };
}
```

### The Owning Cell (every page)

```js
const synth = createSynth();
invalidation.then(() => synth.dispose());
```

That cell MUST:
- Be in **its own** code block (no other top-level state declared in it)
- NOT depend on any other cell (so editing the scale text doesn't tear down the AudioContext)

### Drone Toggle Pattern (Pitfall #9)

```js
let stopDrone = null;
const droneBtn = html`<button>Drone on 1/1</button>`;
droneBtn.onclick = () => {
  if (stopDrone) { stopDrone(); stopDrone = null; droneBtn.textContent = "Drone on 1/1"; }
  else { stopDrone = synth.startDrone(baseHz); droneBtn.textContent = "Stop drone"; }
};
```

### Dev-Only Leak Counter (Pitfall #2)

`SynthHandle.activeVoices` getter is exposed precisely so the planner can write a Vitest test (or a dev-mode console assertion) that voices return to 0 after a tracked sequence. For AudioContext leak detection, register an event listener on the page-level `visibilitychange` and log `synth.activeVoices` — anomalous growth indicates a missing `dispose()`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 (already installed; pinned in `package.json` devDeps) |
| Config file | `vitest.config.ts` (root) — already present, includes `src/lib/**/__tests__/**/*.test.ts` |
| Quick run command | `npm run test` (alias for `vitest run`) |
| Full suite command | `npm run test` (same — there is only one suite at this scale) |
| Watch | `npm run test:watch` |

The Phase-1 stub `src/lib/example.ts` + `__tests__/example.test.ts` proved the wiring. Phase 2 replaces the stub and adds the real suite.

**No browser-based test harness is added in Phase 2.** Audio + DOM components are tested by manual smoke check in `npm run dev` (the dashboard at `src/index.md` IS the integration smoke test). Adding Playwright/jsdom is out of scope for v1.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| MATH-01 | `new Interval("81/79")` round-trips through monzo back to `81/79` | unit | `npx vitest run src/lib/__tests__/interval.test.ts -t "round-trip"` | ❌ Wave 0 |
| MATH-01 | Large-numerator round-trip: `new Interval("2147483648/2147483647")` survives | unit | `npx vitest run src/lib/__tests__/interval.test.ts -t "large numerator"` | ❌ Wave 0 |
| MATH-02 | `Interval.monzo` for `81/80` returns `[-4, 4, -1]` | unit | `npx vitest run src/lib/__tests__/monzo.test.ts -t "syntonic monzo"` | ❌ Wave 0 |
| MATH-03 | `Interval("3/2").cents` ≈ 701.955; `centsFrom12tet` ≈ +1.955 | unit | `npx vitest run src/lib/__tests__/interval.test.ts -t "cents"` | ❌ Wave 0 |
| MATH-04 | `mul`, `div`, `inv`, `octaveReduce(2/1)`, `octaveReduce(3/1)` (Bohlen-Pierce, Pitfall #13) | unit | `npx vitest run src/lib/__tests__/interval.test.ts -t "ops"` | ❌ Wave 0 |
| MATH-05 | `tenneyHeight(81/80)` = log(6480); `primeLimit(81/80)` = 5; `oddLimit(7/4)` = 7 | unit | `npx vitest run src/lib/__tests__/monzo.test.ts -t "heights"` | ❌ Wave 0 |
| MATH-06 | `nameForMonzo([-4,4,-1])` = "syntonic comma"; schisma DOES NOT match syntonic (Pitfall #1, #6) | unit | `npx vitest run src/lib/__tests__/commas.test.ts` | ❌ Wave 0 |
| SCALE-01 | Parse `"9/8\n5/4\n[-2 0 1>\n2/1"` → 5-interval Scale (auto-1/1 prepended per D-13) | unit | `npx vitest run src/lib/__tests__/scala.test.ts -t "parseScala mixed"` | ❌ Wave 0 |
| SCALE-02 | `Scale([5/4, 9/8, 2/1, 9/8]).reduce()` returns sorted, deduped, reduced; same with period=3/1 | unit | `npx vitest run src/lib/__tests__/scale.test.ts -t "reduce"` | ❌ Wave 0 |
| SCALE-03 | `seedScale.rotate(2)` shifts modes correctly; `1/1` is preserved as first | unit | `npx vitest run src/lib/__tests__/scale.test.ts -t "rotate"` | ❌ Wave 0 |
| SCALE-04 | `seedScale.transpose(new Interval("3/2"))` multiplies all degrees by 3/2 | unit | `npx vitest run src/lib/__tests__/scale.test.ts -t "transpose"` | ❌ Wave 0 |
| SCALE-05 | `jiSubsetOfEdo(31, primeLimit=7)` returns a Scale with exactly 31 intervals | unit | `npx vitest run src/lib/__tests__/scale.test.ts -t "edo subset"` | ❌ Wave 0 |
| IO-01 | All 16 synthetic edge-case fixtures parse correctly (or error correctly) | unit | `npx vitest run src/lib/__tests__/scala.test.ts -t "fixtures"` | ❌ Wave 0 |
| IO-02 | `writeScl(seedScale)` does NOT emit `1/1` line; ends with `2/1` | unit | `npx vitest run src/lib/__tests__/scala.test.ts -t "writeScl no-unison"` | ❌ Wave 0 |
| IO-04 | (manual smoke; clipboard API not available in Node) | smoke | run `npm run dev`; click clipboard button; paste into editor; verify | manual |
| IO-05 | Round-trip: parse → serialize → parse equals original (over 5+ Huygens-Fokker archive samples) | golden | `npx vitest run src/lib/__tests__/scala.test.ts -t "round-trip golden"` | ❌ Wave 0 |
| AUDIO-01 | (lifecycle is a runtime concern; smoke-test via dashboard) | manual | `npm run dev`; edit a cell 20 times; verify only one `AudioContext` in DevTools | manual |
| AUDIO-02 | (clicks/pops are perceptual) | manual | `npm run dev`; play single 50ms note in dashboard; listen | manual |
| AUDIO-03 | (perceptual) | manual | `npm run dev`; click "Arpeggiate scale" | manual |
| AUDIO-04 | (perceptual) | manual | `npm run dev`; toggle drone; play interval over drone | manual |
| AUDIO-05 | `synth.activeVoices` returns to 0 after every test sequence (mockable with fake timers + a stub `Synth` class) | unit | `npx vitest run src/lib/__tests__/synth.test.ts -t "voice tracking"` | ❌ Wave 0 |
| NOTES-01 | (baseline, proven in Phase 1) | smoke | `npm run dev` shows reactive cells working | inherited |
| NOTES-02 | KaTeX renders `$\frac{81}{80}$` on the syntonic-comma page | manual | `npm run dev`; navigate to `/pages/syntonic-comma`; inspect rendered fraction | manual |
| NOTES-03 | `${playInterval(...)}` widget renders inline on syntonic-comma page | manual | (same) | manual |
| NOTES-04 | `INVENTORY.md` has a row for every public export of `src/lib/` (12+ entries by end of Phase 2); `tsc --noEmit` enforces no DOM imports in `src/lib/` (DOM types absent without explicit `lib` flag — already on per tsconfig) | static + manual | `npm run lint:types && grep -r "createElement\|querySelector" src/lib/ \| wc -l` should be 0 | inherited gate |
| NOTES-05 | `src/pages/syntonic-comma.md` exists, builds, renders | smoke | `npm run build`; verify `dist/pages/syntonic-comma/index.html` exists and references 81/80 | inherited gate |
| COMP-01 | (reframed) seed scale exists as a constant in `src/index.md` (NOT in `src/lib/pieces/*`) | static | `test ! -d src/lib/pieces && grep "1/1.*9/8.*5/4.*21/16.*3/2.*27/16.*7/4.*2/1" src/index.md` | ❌ Wave 0 |
| COMP-02 | (reframed) dashboard at `src/index.md` exercises every kernel feature end-to-end | smoke | `npm run dev`; perform the 5-criterion ROADMAP checklist | manual |
| COMP-03 | (reframed) seed scale CI test: `parseScala(seedText)` → `Scale` → `writeScl` → `parseScl` round-trips equally | integration | `npx vitest run src/lib/__tests__/seed-scale.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test` (full Vitest suite — under 5s at this scale)
- **Per wave merge:** `npm run ci` (lint:types + test + lint + format:check + build — already wired in package.json)
- **Phase gate:** `npm run ci` green AND manual smoke checklist (5 ROADMAP success criteria) green before `/gsd-verify-work`

### Wave 0 Gaps

These files do NOT exist yet and must be created before MATH-* / SCALE-* / IO-* tests can run:

- [ ] `src/lib/__tests__/fixtures/` directory + 16 synthetic `.scl` fixtures (F1-F16 above) + 5 real Huygens-Fokker archive samples
- [ ] `src/lib/__tests__/interval.test.ts` — covers MATH-01, MATH-03, MATH-04
- [ ] `src/lib/__tests__/monzo.test.ts` — covers MATH-02, MATH-05
- [ ] `src/lib/__tests__/scale.test.ts` — covers SCALE-01..05
- [ ] `src/lib/__tests__/scala.test.ts` — covers IO-01, IO-02, IO-05 + all 16 fixtures
- [ ] `src/lib/__tests__/commas.test.ts` — covers MATH-06
- [ ] `src/lib/__tests__/synth.test.ts` — covers AUDIO-05 (with fake timers + stub `SwSynth`)
- [ ] `src/lib/__tests__/seed-scale.test.ts` — covers COMP-03 (reframed)

(Framework install: not needed; Vitest already pinned in package.json.)

## Risks / Open Questions

### R-01 (HIGH SEVERITY) — Two `Fraction` classes, both named `Fraction`

**Issue:** `fraction.js@5.3.4` exports a `Fraction` class with `n: bigint, d: bigint, s: bigint` (BigInt-backed). `xen-dev-utils@0.13.1` ships its **own** `Fraction` class (in `xen-dev-utils/dist/fraction.js`, line 1 comment: *"I'm rolling my own because fraction.js has trouble with TypeScript"*) with `n: number, d: number, s: number` (Number-backed). Both are exported as `Fraction`. They are **not interchangeable** — passing one where the other is expected is a TypeScript error AND a runtime bug.

xen-dev-utils functions that take/return `Fraction` (e.g. `monzoToFraction`, `approximateOddLimit`, `approximatePrimeLimit`, `getConvergents`) operate on the Number-backed class. They will lose precision for any ratio whose numerator or denominator exceeds 2^53.

**What's affected in Phase 2:**
- `Interval` MUST internally hold the BigInt-backed `Fraction` (per MATH-01 and Pitfall #1).
- Any time we want a monzo back from `Interval`, use xen-dev-utils `toMonzo(bigInt)` — accepts `bigint`, returns `number[]`. Safe.
- Any time we want a `Fraction` back from a monzo, use `monzoToBigNumeratorDenominator(monzo)` → `{numerator: bigint, denominator: bigint}` → `new Fraction(num, den)`. Safe.
- We MUST NOT call `monzoToFraction(monzo)` and assign the result to a variable typed as `import("fraction.js").Fraction` — types will conflict.
- For SCALE-05 (JI subset of an EDO), `approximatePrimeLimit` returns the Number-backed `Fraction[]`. We must convert results back via `new Fraction(`${f.n}/${f.d}`)` (string round-trip — safe up to ~10^15 numerator).

**Recommendation for the planner:**
1. In `src/lib/`, NEVER import `Fraction` from `xen-dev-utils`. Always import from `fraction.js`.
2. Type-shadow if needed: `import type {Fraction as FractionJs} from "fraction.js"; import {Fraction as XenFraction} from "xen-dev-utils";` — but the cleanest path is to NOT import xen-dev-utils' `Fraction` at all. We use only its monzo / cents / primes helpers, never its `Fraction` class.
3. Add a line to `src/lib/INVENTORY.md` documenting this discipline.
4. Add an ESLint rule (`no-restricted-imports`) that forbids `import {Fraction} from "xen-dev-utils"` to prevent regressions.

**User confirmation needed before planning:** confirm the strategy above (always import `Fraction` from `fraction.js`, never from `xen-dev-utils`) is the right call. If it isn't (e.g., user wants to use xen-dev-utils' `Fraction` for some reason), the entire `Interval` design changes. — `[ASSUMED]`

### R-02 (MEDIUM) — `setTimeout` for scheduling vs. `AudioContext.currentTime`

The audio sketch uses `setTimeout` for arpeggio step scheduling. This is **not sample-accurate**; a more idiomatic approach would schedule all `noteOn`s with their absolute `AudioContext.currentTime` offsets, but `sw-synth`'s `noteOn(frequency, velocity)` signature does not appear to accept a `startTime` parameter (verified in `node_modules/sw-synth/dist/index.d.ts`). For the v1 "audition the scale" use case, `setTimeout` is adequate (jitter is tens of ms, perceptually fine for arpeggio at 0.45s steps). Flag for revisit if the user reports timing artifacts.

### R-03 (LOW) — `Inputs.textarea` reactivity granularity

Framework's `Inputs.textarea` re-fires on every keystroke. Parsing the scale on every keystroke is fine at this scale (parser is fast, <1ms for 50-line scales) but means audio retunes mid-typing. Consider `Inputs.textarea({submit: true})` if the planner wants explicit submission. D-12 doesn't specify; Claude's discretion.

### R-04 (LOW) — Polyphony cap = 16 vs. dashboard arpeggio

A 12-note arpeggio with 1.5s notes overlapping at 0.45s steps will queue ~3 voices simultaneously — well under the cap. But a 31-note JI-of-EDO scale (SCALE-05) at the same settings would peak at ~7 voices, still safe. If the user constructs a much larger scale (e.g., 72-tone), arpeggio would clip on the cap; voice stealing kicks in (FIFO). Document the behavior in the dashboard so it's not surprising.

### R-05 (LOW) — Drone + arpeggio interaction

Per D-07 the audio panel has BOTH a drone toggle AND an arpeggiate button. With drone on, arpeggio adds 1 voice to the existing drone — fine. But the panic / Esc-key handler must clear BOTH (drone state AND any in-flight `setTimeout` arpeggios). Cover this with the AUDIO-05 voice-tracking test.

### R-06 (LOW) — `Inputs.number` for `baseHz` precision

`Inputs.number({step: 0.01})` allows 0.01 Hz precision on `baseHz`. A4 = 440 Hz is a fine default (D-08), but 415 (Baroque), 432 (alternative), and exotic temperaments may want non-integer values like 261.625565 (C4 from 12-TET). Step of 0.01 is enough. Flag if the user wants fractional-Hz precision beyond two decimals.

### O-01 (Open) — Should `ratioPill` use KaTeX?

`Fraction.toLatex()` produces `\\frac{81}{80}` directly. Rendering ratio pills via `tex` template gets typographically-correct stacked fractions but adds async/heavier rendering per pill. D-10 example shows Unicode "⁸¹⁄₈₀" — simpler. Recommend Unicode for v1 (D-10 implicit); the planner may wish to confirm with the user.

### O-02 (Open) — Inline ▶ buttons on theory pages

D-07 explicitly removes inline ▶ from the dashboard table. The syntonic-comma theory page IS allowed to use `${playInterval(syntonic, synth)}` inline in prose — D-09/D-10 confirm. Make sure the planner doesn't over-apply D-07 to theory pages.

### O-03 (Open) — `temperaments` package

CONTEXT.md confirms it stays deferred for Phase 2 (peer-dep mismatch unresolved). No tasks should attempt to install or import it. The CI deny-list grep from Phase 1 D-21 is still in force.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The user wants `Interval` to hold `fraction.js@5` BigInt-backed `Fraction` (NOT xen-dev-utils' Number-backed class). The whole MATH-01 design depends on this. | Risks → R-01 | If wrong, every `Interval` method signature changes; INVENTORY entries flip; Pitfall #1 enforcement strategy changes. |
| A2 | `tex` template tag from Framework's stdlib will work with KaTeX CSS injected via `head` (no separate JS `<script>` needed). | KaTeX Wiring | If wrong, math doesn't render; planner must add an auto-render `<script>` tag to `head` and document the runtime cost. |
| A3 | `setTimeout`-based arpeggio scheduling is acceptable for v1 perceptual quality (no need for sample-accurate AudioContext.currentTime scheduling). | Risks → R-02 | If wrong, arpeggios sound rhythmically loose; refactor to `setTargetAtTime` / explicit time scheduling required. |
| A4 | The planner can use real Huygens-Fokker archive `.scl` files as test fixtures by checking them into `src/lib/__tests__/fixtures/`. (License: the archive is published as a free, downloadable resource; specific files are usually in the public domain or under free-use licenses, but the planner should verify per-file before committing.) | Validation Architecture → IO-05 | If wrong, IO-05 falls back to synthetic-only fixtures (still a meaningful test, but loses the cross-tool compatibility guarantee). |
| A5 | The KaTeX SRI hash `sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM` is correct for v0.16.45. | KaTeX Wiring | If wrong, browsers refuse to load the stylesheet → no math rendering. Verify by visiting katex.org/docs/browser.html and copy-pasting the current hash on the day of implementation. |
| A6 | `Inputs.textarea` and `Inputs.number` from `@observablehq/inputs` are bundled with `@observablehq/framework@1.13.4` (no separate npm install needed). Phase 1 D-14 used `Fraction` from `npm:fraction.js`; Inputs are first-party. | Module Breakdown → src/index.md | If wrong, planner needs an `npm install @observablehq/inputs` task. (Highly likely true — Inputs ships with Framework — but flag for verification.) |

**If this table is empty:** the row count above is non-zero, so user confirmation IS needed for R-01 (see Risks) and the assumptions A1-A6 should be reviewed by the discuss-phase or planner before locking implementation.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node ≥20 | Framework + Vitest | ✓ (`.nvmrc`=20) | per project | — |
| npm | Package mgr | ✓ | — | — |
| `@observablehq/framework` | Build/dev | ✓ | 1.13.4 | — |
| `fraction.js` | Interval | ✓ | 5.3.4 | — |
| `xen-dev-utils` | Monzo / cents / primes | ✓ | 0.13.1 | — |
| `sw-synth` | Audio | ✓ | 0.4.0 | — |
| `sonic-weave` | Installed but not used in Phase 2 | ✓ | 0.14.1 | — |
| `ji-lattice` | Installed but not used in Phase 2 (Phase 3) | ✓ | 0.3.2 | — |
| `vitest` | Tests | ✓ | 2.1.9 | — |
| `typescript` | Type-check | ✓ | 5.9.3 | — |
| KaTeX CDN (jsdelivr) | NOTES-02 | ✓ network | 0.16.45 | Self-host KaTeX CSS via `npm install katex` if CDN is undesired (CONTEXT.md doesn't decide; D-23 implies CDN is fine) |
| Web Audio API (browser) | AUDIO-01..05 | ✓ in target browsers (Chrome/Firefox/Safari desktop) | — | iOS Safari deferred to Phase 3 (AUDIO-06) per CONTEXT.md out-of-scope |
| `navigator.clipboard` | IO-04 | ✓ in HTTPS contexts (and `localhost`) | — | Plain text `<pre>` block + manual copy if missing |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** KaTeX CDN (fallback: self-host). Clipboard API on insecure HTTP origins (fallback: manual copy). Both are non-blocking for v1 since dev is `localhost` (clipboard works) and the deployed site is GitHub Pages over HTTPS.

## Sources

### Primary (HIGH confidence)
- `node_modules/xen-dev-utils/dist/index.d.ts` + `monzo.d.ts` + `monzo.js` + `conversion.d.ts` + `primes.d.ts` + `fraction.d.ts` + `core.d.ts` + `approximation.d.ts` (verified 2026-05-03 against installed v0.13.1) — full Phase 2 API surface
- `node_modules/fraction.js/fraction.d.ts` (v5.3.4) — confirmed `n: bigint, d: bigint`
- `node_modules/sw-synth/dist/index.d.ts` + `voice/oscillator.d.ts` + `voice/base.d.ts` + `README.md` (v0.4.0) — confirmed `Synth(audioContext, destination)` signature, `noteOn` returns `noteOff`, ADSR field types
- `node_modules/sw-synth/package.json`, `xen-dev-utils/package.json` — version verification
- https://www.huygens-fokker.org/scala/scl_format.html (WebFetch 2026-05-03) — `.scl` spec verbatim including period-detection rule, implicit 1/1, negative-ratio prohibition, 2^31 numerator floor
- https://katex.org/docs/browser.html (WebFetch 2026-05-03) — KaTeX CSS link tag + SRI hash for v0.16.45
- `npm view <pkg> version` (2026-05-03) — versions: katex 0.16.45, fraction.js 5.3.4, xen-dev-utils 0.13.1, sw-synth 0.4.0, sonic-weave 0.14.1, @observablehq/framework 1.13.4
- `.planning/research/{ARCHITECTURE,PITFALLS,STACK,FEATURES}.md` (Phase 1 outputs) — three-layer architecture, 16 pitfalls, full stack rationale, feature ordering

### Secondary (MEDIUM confidence — WebSearch verified against official docs)
- Observable Framework `head` config option behavior — confirmed via Framework v1.4/v1.5/v1.7 release notes + observablehq.com/framework/config search excerpts
- Observable Framework `invalidation` promise semantics — confirmed via Framework reactivity docs search excerpts + observablehq.com/@observablehq/invalidation

### Tertiary (LOW confidence — flag for manual verification at implementation time)
- KaTeX SRI hash for v0.16.45 — recommend re-checking on the day of implementation; CDN providers occasionally rotate hashes

## Metadata

**Confidence breakdown:**
- Module breakdown: HIGH — derived from locked CONTEXT.md decisions + verified library APIs
- Library API map: HIGH — quoted directly from `.d.ts` files in this project's `node_modules`
- `.scl` format: HIGH — Huygens-Fokker spec is canonical and was retrieved verbatim
- KaTeX wiring: MEDIUM-HIGH — pattern is standard but the SRI hash specifically should be re-verified
- AudioContext lifecycle: HIGH — pattern is locked in ARCHITECTURE.md; this research adds concrete code
- Validation architecture: HIGH — Vitest is already wired; the Wave-0 gap list is exhaustive
- Risk R-01 (Fraction class confusion): HIGH-confidence finding, MEDIUM-confidence recommended resolution (user must confirm)

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (30 days; the xenharmonic-devs ecosystem releases ~monthly, so verify versions if implementation drifts past June 2026)

## RESEARCH COMPLETE
