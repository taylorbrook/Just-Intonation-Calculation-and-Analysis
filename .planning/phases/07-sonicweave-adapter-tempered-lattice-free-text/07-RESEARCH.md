# Phase 7: SonicWeave Adapter — Tempered, Lattice & Free-Text - Research

**Researched:** 2026-06-11
**Domain:** Embedding the `sonic-weave@0.14.1` DSL as a kernel adapter; rank-2 regular temperament, well-temperament, Fokker periodicity blocks, free-text DSL; exact BigInt round-trip + tempered cents-of-record
**Confidence:** HIGH (all critical API behavior runtime-verified this session against the installed package)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Rank-2 widget (GEN-06)**
- **D-01:** Presets + manual. A preset select of named rank-2 temperaments (Pythagorean, quarter-comma meantone, porcupine, hanson, magic, …) fills generator/period/up-down; all fields stay editable afterward.
- **D-02:** Default landing = quarter-comma meantone (tempered fifth ≈ 696.578¢, 7 notes) — first render showcases a tempered rank-2 with badge + cents-primary table.
- **D-03:** Tuning select tied to presets. POTE/TE/CTE/pure select is active when a named preset is chosen; manual generator entry shows "custom" (typed ratio is exact; typed cents are tempered). Manual entry keeps the ratio-or-cents generator toggle.
- **D-04:** Scale size as up/down generator counts (SonicWeave's native `rank2(generator, up, down, period)` — e.g. 5 up + 1 down = 7-note diatonic). Doubles as mode control until Phase 8's rotate strip.

**Well-temperament widget (GEN-07)**
- **D-05:** Presets + custom mode. A preset select fills the per-fifth comma fractions; "custom" mode exposes raw per-fifth fraction fields.
- **D-06:** Default landing = Vallotti (six pure fifths + six tempered by 1/6 Pythagorean comma).
- **D-07:** Comma fixed per context — no comma input field. Presets carry their historically correct comma; custom mode fixes the Pythagorean comma (531441/524288). Custom syntonic-comma temperaments go through the free-text escape hatch.
- **D-08:** Extended preset roster: Werckmeister III, Kirnberger III, Vallotti, Young II, plus Neidhardt, Kellner, Lehman "Bach", Young I. Each preset's comma-fraction vector must be sourced from a citable reference and verified (test vectors per preset).

**Fokker block widget (GEN-08)**
- **D-09:** Both specification modes ship this phase — comma mode is a hard requirement. Basis-interval chips + per-axis up/down extents (→ SonicWeave `parallelotope`) AND a unison-vector (comma) entry mode (the classic Fokker formulation, needing `xen-dev-utils` HNF/determinant).
- **D-10:** Basis+extents is the default landing mode; comma mode is a toggle.
- **D-11:** Default block = the classic 5-limit 12-tone Fokker block (commas 81/80 + 128/125; equivalent basis 3×5 region → 12 notes).
- **D-12:** Live note-count readout next to the inputs ("→ 12 notes") — in comma mode |det| of the unison-vector matrix, in basis mode the extents product — visible before/alongside the preview.

**Free-text escape hatch (GEN-09)**
- **D-13:** First render = pre-filled working example (`cps([1,3,5,7], 2)`) already evaluated and previewed.
- **D-14:** External docs link to the SonicWeave documentation near the textarea. No inline cheat-sheet.
- **D-15:** Raw compiler errors verbatim in the status region (`textContent`-safe). Prior preview preserved on error.
- **D-16:** Full multi-line SonicWeave programs accepted. `evaluateSource` handles them natively; the existing 8 KB cap (`MAX_SCALE_TEXT_BYTES`) bounds input. Evaluate on button click, never per keystroke.

### Claude's Discretion
- **D-17:** Exact rank-2 preset roster beyond the named examples (pick well-known temperaments with citable generator values), and each preset's default up/down counts.
- **D-18:** Adapter error shape (structured return vs typed throw), the rational-vs-tempered discriminator (`iv.value instanceof TimeReal` per blueprint Assumption A4 — **verify empirically; see finding below — A4 is WRONG**), and defense-in-depth caps (Fokker extents, rank-2 up/down bounds) mirroring Phase-6 D-14.
- **D-19:** Comma-mode input idiom for Fokker (chip input vs ratio fields) and how mode toggling preserves state between the two formulations.
- **D-20:** Where the free-text widget's docs link points (most stable SonicWeave docs URL).

### Deferred Ideas (OUT OF SCOPE)
- Inline SonicWeave cheat-sheet / examples menu for free-text (D-14 chose a docs link).
- Comma select for custom well-temperaments (syntonic vs Pythagorean vs arbitrary) — D-07 fixed it; custom syntonic temperaments go through free-text.
- "Show the SonicWeave code behind this widget" (template-inserter pattern) — v2 bridge.
- Temperament finder (x31eq search-then-pick) — out of v1.1.
- Wilson recurrence / metallic, constant-structure (GEN-10) — Phase 8.
- Rotate/reduce/dedupe/transpose strip + circle-of-pitches viz (SURF-04/05) — Phase 8.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GEN-06 | Generate a rank-2 regular-temperament scale (generator + period, with optimal tunings) — advances parked TEMP-01 | Verified `rank2(generator, up, down=0, period, numPeriods=1, …)` prelude signature; pure `rank2(3/2,5,1)` ≡ `buildMos` exact (9/8…2/1); optimal tunings via `POTE`/`TE`/`CTE` temperament + DSL temper pattern (POTE meantone fifth = 696.239¢, CTE = 697.214¢, TE = 697.049¢ with impure octave); quarter-comma meantone fifth = 696.578¢ as a literal cents generator. |
| GEN-07 | Generate a well-temperament scale (per-fifth comma tempering) | Verified `wellTemperament(commaFractions, comma=81/80, down=0, generator=3/2, period=niente)` — **must pass `comma=531441/524288` explicitly for Pythagorean-comma temperaments (D-07); the default 81/80 is syntonic.** Produces a 12-note tempered scale; `commaFractions` is the per-step list along the chain of fifths. Vallotti scheme: 1/6 Pythagorean ×6 + pure ×6 (citable). |
| GEN-08 | Generate a Fokker periodicity-block scale — delivers parked TEMP-08 | Basis mode: `parallelotope(basis, ups, downs, equave, …)` — `parallelotope([3,5],[3,1],[0,1])` → exactly 12 exact-rational notes. Comma mode: `xen-dev-utils` `integerDet` over BigInt monzo matrix → \|det\| cardinality; classic block 81/80 + 128/125 → \|det\| = 12 (verified both 2×2 in (3,5)-subspace and 3×3 with octave). |
| GEN-09 | Enter a free-text SonicWeave expression and compile it to a scale — delivers parked TEMP-07 | `evaluateSource(src)` returns a `StatementVisitor` with `.currentScale: Interval[]`; verified multi-line programs supported; malformed input throws a typed parse/eval error to catch → status region. `cps([1,3,5,7],2)` default renders the Hexany. |
</phase_requirements>

## Summary

`sonic-weave@0.14.1` and `xen-dev-utils@0.13.1` are already installed and every prelude function this phase needs (`rank2`, `cps`, `wellTemperament`, `parallelotope`, `POTE`/`TE`/`CTE`) exists and was runtime-verified this session. The four advanced methods are genuinely thin wrappers: each widget builds a SonicWeave source string from typed parameters and calls one shared adapter, `scaleFromSonicWeave(src)`. The adapter calls `evaluateSource(src)`, reads `.currentScale` (an `Interval[]`), and maps each interval to the kernel's BigInt `Interval` — rational intervals via the `${n}/${d}` string (R-01 boundary), tempered/irrational intervals via cents (`.totalCents()` → `centsToRatio`, flagged tempered).

**The single most important finding: blueprint Assumption A4 (`iv.value instanceof TimeReal`) is WRONG as a rational-vs-tempered discriminator.** A cents-based tempered interval (e.g. quarter-comma meantone via `rank2(696.578…, 5, 1)`) carries a `TimeMonzo` value, not `TimeReal` — yet it is irrational and `.toFraction()` throws on it. The correct, robust discriminator is the documented public method **`iv.value.isFractional()`** (a getter-style boolean on both `TimeMonzo` and `TimeReal`, declared at `monzo.d.ts:306` and `:528`). It returns `true` for exact rationals and `false` for tempered/irrational values. Use it as the primary discriminator; keep `try { iv.toFraction() } catch` only as defense-in-depth.

The Fokker comma-mode cardinality (D-12) is `Math.abs(Number(integerDet(M)))` where `M` is the BigInt monzo matrix of the unison vectors (the classic 81/80 + 128/125 block gives 12, verified). The well-temperament `comma` default is syntonic 81/80 — D-07's Pythagorean-comma temperaments **must pass `comma=531441/524288` explicitly** or they silently produce the wrong scale.

**Primary recommendation:** Build `src/lib/sonicweave.ts` with `scaleFromSonicWeave(src): { scale: Scale | null; tempered: boolean; error?: string }` using `evaluateSource` + `.currentScale` + the `isFractional()` discriminator. Build a tiny exact-lattice helper (`fokkerCardinality(commas)` over `xen-dev-utils` `integerDet` with BigInt monzos) for the comma-mode readout. The four widgets are Pattern-2 factories that compose SonicWeave source strings and reuse the Phase-6 tempered table/badge verbatim.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SonicWeave source → `Scale` (the adapter) | Kernel (`src/lib/sonicweave.ts`) | — | Pure, BigInt-exact, no DOM. Wraps the installed `sonic-weave` dep. R-01 round-trip lives here. |
| Fokker \|det\| cardinality (comma mode) | Kernel (lattice helper over `xen-dev-utils`) | — | Pure integer math (BigInt monzos → `integerDet`). Drives the live D-12 readout but is itself UI-free. |
| Composing the SonicWeave source string from typed params | Component (`generate-rank2/welltemp/fokker.ts`) | Kernel (adapter consumes it) | The form knows its method; it serializes user inputs into `rank2(…)` / `wellTemperament(…)` / `parallelotope(…)` text. |
| Tempered flag + cents-primary table + badge | Component (`scale-table.ts` from Phase 6) | Adapter (returns `tempered: boolean`) | Phase-6 D-03: tempered lives at the component layer; kernel types carry no `tempered` field. |
| Free-text DSL input + evaluate-on-click + error surface | Component (`generate-sonicweave.ts`) | Adapter (catches eval errors) | The escape hatch is a UI concern; the adapter just returns `{ scale, tempered, error }`. |
| Send-to serialization (ratios for JI, cents-per-line for tempered) | Page (`generate.md` Send-to buttons) | Component (`isTempered()`, `getScale()`) | Established Phase-5/6 plumbing; tempered → cents-per-line text (D-03). |
| Audio (Hz projection of tempered cents) | Page-owned synth + audio boundary | Kernel (`centsToRatio` only at Hz boundary) | `centsToRatio` is the ONLY place cents become a number used downstream; never the table's source of truth. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `sonic-weave` | **0.14.1** (installed) | The scale DSL: `rank2`, `cps`, `wellTemperament`, `parallelotope`, `POTE`/`TE`/`CTE`, free-text `evaluateSource` | `[VERIFIED: node_modules + runtime]` Already installed; every needed prelude function exists and was runtime-verified this session. The whole generator vocabulary is one already-installed dep. |
| `xen-dev-utils` | **0.13.1** (installed) | Fokker comma mode: `integerDet`, `hnf`, `kernel`, `cokernel`, `toMonzo`, `monzoToFraction` (BigInt-capable) | `[VERIFIED: node_modules + runtime]` `integerDet`/`hnf` accept `bigint[][]` → exact \|det\| cardinality. Already installed, do NOT upgrade (ji-lattice peers ^0.12.2; REQUIREMENTS.md out-of-scope row). |
| `fraction.js` | **5.3.4** (installed, pinned) | BigInt `Interval` currency at the R-01 boundary | `[VERIFIED: node_modules]` The kernel's `Interval` wraps this. SonicWeave's Fraction never crosses into the kernel — only its `${n}/${d}` string does. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | — | **Zero new npm dependencies this phase (locked, REQUIREMENTS.md).** Everything is in the installed stack. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `isFractional()` discriminator | `try { iv.toFraction() } catch` | The try/catch works but is slower and less explicit. Keep it only as a belt-and-suspenders fallback; `isFractional()` is a documented public method and the correct primary check. |
| `isFractional()` discriminator | `iv.value instanceof TimeReal` (blueprint A4) | **Disqualified — verified wrong.** Tempered cents-based intervals are `TimeMonzo`, not `TimeReal`. The `instanceof` check would mis-classify quarter-comma meantone as exact JI. |
| `integerDet` (BigInt) | `det` (Number) over Number monzos | `det` returns a JS Number; fine for small 5-/7-limit matrices but `integerDet` over `bigint[][]` is exact and matches the project's BigInt-purity discipline. Use `integerDet`. |
| Hand-extracting `Temperament.generators` in JS | All-DSL temper pattern (`rank2(3/2,5,1)` newline `POTE([commas])`) | The all-DSL pattern is cleaner and keeps the adapter generic (it only ever sees a finished `currentScale`). Use the DSL temper pattern; the widget composes the two-line source. |

**Installation:** None. All dependencies present:
```bash
# verified installed:
#   sonic-weave   0.14.1
#   xen-dev-utils 0.13.1
#   fraction.js   5.3.4
```

**Version verification (run this session):**
```
node -e require('./node_modules/sonic-weave/package.json').version   → 0.14.1
node -e require('./node_modules/xen-dev-utils/package.json').version → 0.13.1
node -e require('./node_modules/fraction.js/package.json').version   → 5.3.4
```

## Package Legitimacy Audit

> No new packages installed this phase. The three dependencies below are pre-installed, pinned, and load-bearing for the existing kernel — no install step occurs.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `sonic-weave` | npm | mature (xenharmonic-devs) | n/a (niche) | github.com/xenharmonic-devs/sonic-weave | not run (no install) | Pre-installed — Approved |
| `xen-dev-utils` | npm | mature | n/a | github.com/xenharmonic-devs/xen-dev-utils | not run (no install) | Pre-installed — Approved |
| `fraction.js` | npm | 8+ yrs | very high | github.com/rawify/Fraction.js | not run (no install) | Pre-installed — Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
*No install occurs this phase; the legitimacy gate is N/A. These packages were vetted at the milestone-research stage and are already in `package-lock.json`.*

## Architecture Patterns

### System Architecture Diagram

```
                       ┌─────────────────────────────────────────────────┐
   user typed params   │  Component layer (Pattern-2 factories)           │
   ─────────────────►  │  generate-rank2 / generate-welltemp /            │
                       │  generate-fokker / generate-sonicweave           │
                       │                                                  │
                       │  • compose a SonicWeave SOURCE STRING from params│
                       │    rank2(696.578, 5, 1)                          │
                       │    wellTemperament([-1/6×6, 0×6], 531441/524288) │
                       │    parallelotope([3,5],[3,1],[0,1])              │
                       │    <free text verbatim>                          │
                       │  • Fokker comma mode also computes |det| via the │
                       │    lattice helper for the live "→ N notes" readout│
                       └───────────────┬──────────────────────────────────┘
                                       │  source string
                                       ▼
                       ┌─────────────────────────────────────────────────┐
   KERNEL boundary     │  scaleFromSonicWeave(src)  (src/lib/sonicweave.ts)│
   (R-01 enforced)     │                                                  │
                       │  visitor = evaluateSource(src)                   │
                       │  for iv of visitor.currentScale:                 │
                       │    if iv.value.isFractional():                   │  ◄── DISCRIMINATOR
                       │       f = iv.toFraction()                        │      (NOT instanceof
                       │       push new Interval(`${f.n}/${f.d}`)  ───────┼──┐    TimeReal)
                       │       (exact BigInt round-trip, R-01)            │  │
                       │    else:                                         │  │ rational →
                       │       cents = iv.totalCents()                   │  │ exact JI
                       │       push Interval from centsToRatio(cents)     │  │
                       │       tempered = true                            │  │ tempered →
                       │  return { scale, tempered, error? }              │  │ cents-of-record
                       └───────────────┬──────────────────────────────────┘  │
                                       │  { scale, tempered }                 │
                                       ▼                                      │
                       ┌─────────────────────────────────────────────────┐  │
   PRESENTATION        │  scaleTable(scale, baseHz, { tempered })  + badge │◄─┘
   (Phase-6 reuse)     │  playScale(...)   •   getScale() / isTempered()  │
                       │  Send-to: ratios (JI) | cents-per-line (tempered)│
                       └─────────────────────────────────────────────────┘
```

A reader can trace the primary use case (default quarter-comma meantone): the rank-2 widget composes `rank2(696.578…, 5, 1)` → `scaleFromSonicWeave` evaluates it → every interval is non-fractional → cents-of-record path → `tempered: true` → cents-primary table with the "tempered" badge.

### Recommended Project Structure
```
src/
├── lib/
│   ├── sonicweave.ts            # the single adapter all four widgets call (NEW)
│   ├── fokker.ts (or in sonicweave.ts)  # exact |det| cardinality helper over xen-dev-utils (NEW)
│   └── __tests__/
│       ├── sonicweave.test.ts   # cross-checks vs cps/buildMos + tempered detection + R-01
│       └── fokker.test.ts       # 81/80 + 128/125 → 12 (BigInt det)
├── components/
│   ├── generate-rank2.ts        # GEN-06 (NEW)
│   ├── generate-welltemp.ts     # GEN-07 (NEW)
│   ├── generate-fokker.ts       # GEN-08 (NEW)
│   ├── generate-sonicweave.ts   # GEN-09 free-text (NEW)
│   └── __tests__/…              # happy-dom, mirror mos-builder.test.ts
└── pages/
    └── generate.md              # register: rank-2 + well-temp → "Regular";
                                 #           Fokker → "Advanced";
                                 #           free-text → NEW fifth "SonicWeave" optgroup
```

### Pattern 1: The SonicWeave → Scale adapter (verified working this session)
**What:** Evaluate a SonicWeave source string and map `.currentScale` to the kernel's BigInt `Interval`, discriminating exact-rational from tempered with `isFractional()`.
**When to use:** Every one of the four widgets. The single boundary between the DSL and the kernel.
**Example:**
```ts
// Source: runtime-tested against sonic-weave@0.14.1 this session.
import { evaluateSource, type Interval as SwInterval } from "sonic-weave";
import { Interval } from "./interval.js";
import { Scale } from "./scale.js";
import { centsToRatio } from "./cents.js";   // NOTE: centsToRatio lives in cents.ts, NOT monzo.ts

const MAX_SONICWEAVE_BYTES = 8192;           // reuse MAX_SCALE_TEXT_BYTES from url.ts

export interface SonicWeaveResult {
  scale: Scale | null;
  tempered: boolean;
  error?: string;
}

export function scaleFromSonicWeave(src: string): SonicWeaveResult {
  if (new TextEncoder().encode(src).length > MAX_SONICWEAVE_BYTES) {
    return { scale: null, tempered: false, error: "Expression exceeds the 8 KB input cap." };
  }
  let visitor;
  try {
    visitor = evaluateSource(src);            // includes the prelude by default
  } catch (e) {
    return { scale: null, tempered: false, error: e instanceof Error ? e.message : String(e) };
  }
  const out: Interval[] = [];
  let tempered = false;
  for (const iv of visitor.currentScale as SwInterval[]) {
    if (iv.value.isFractional()) {            // ◄── DISCRIMINATOR (verified correct; A4 was wrong)
      const f = iv.toFraction();
      out.push(new Interval(`${String(f.n)}/${String(f.d)}`)); // R-01 BigInt round-trip
    } else {
      tempered = true;
      out.push(new Interval(centsToRatio(iv.totalCents())));    // cents is the source of truth
    }
  }
  if (out.length === 0) return { scale: null, tempered, error: "Expression produced an empty scale." };
  return { scale: new Scale(out), tempered };
}
// VERIFIED this session:
//   scaleFromSonicWeave("cps([1,3,5,7], 2)") → 7/6, 5/4, 35/24, 5/3, 7/4, 2/1   (≡ kernel Hexany)
//   scaleFromSonicWeave("rank2(3/2, 5, 1)")  → 9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2/1 (≡ buildMos)
```

### Pattern 2: Optimal-tuning rank-2 via the all-DSL temper pattern
**What:** To get a POTE/TE/CTE optimal tuning, compose a pure-ratio rank-2 scale then put a `Temperament` value on the next line; SonicWeave tempers the scale through it.
**When to use:** When the rank-2 widget's tuning select is POTE/TE/CTE (D-03). For "pure" use plain `rank2(ratio, …)`; for the historical quarter-comma default, pass the literal cents generator.
**Example:**
```ts
// Source: runtime-verified this session.
// POTE meantone diatonic (fifth = 696.239¢):
const src = `rank2(3/2, 5, 1)\nPOTE([81/80])`;
//   → 192.477  384.955  503.761  696.239  888.716  1081.193  1200.000  (all tempered)
// CTE → fifth 697.214¢ ; TE → fifth 697.049¢ but octave is impure 1201.397¢ (POTE normalizes that away).
//
// Quarter-comma meantone (the D-02 DEFAULT, a specific historical tuning ≠ POTE):
const qcm = `rank2(696.578428466209, 5, 1)`;
//   → 193.157  386.314  503.422  696.578  889.735  1082.892  1200.000
//
// Other named temperaments by their comma + mos shape:
//   porcupine[7]: `mos(6,1)\nPOTE([250/243])`  (verified renders a 7-note tempered scale)
```

### Pattern 3: Well-temperament — pass the Pythagorean comma explicitly
**What:** `wellTemperament(commaFractions, comma, down, generator, period)` cumulatively modifies the pure fifth `3/2` by `commaFractions[i]` of `comma` around the chain of fifths.
**When to use:** GEN-07. **The `comma` default is syntonic 81/80; D-07 requires Pythagorean 531441/524288 — pass it explicitly or the scale is wrong.**
**Example:**
```ts
// Source: prelude signature + runtime-verified this session.
// fn wellTemperament(commaFractions, comma = 81/80, down = 0, generator = 3/2, period = niente)
// Vallotti: 1/6 Pythagorean comma on six consecutive fifths, six pure.
const vallotti =
  `wellTemperament([-1/6, -1/6, -1/6, -1/6, -1/6, -1/6, 0, 0, 0, 0, 0], 531441/524288)`;
//   → 12-note tempered scale (verified length 12; degrees mix exact-fractional and irrational —
//      the SCALE is tempered if ANY interval is non-fractional, which it is).
// NOTE: the exact per-degree cents depend on the ordering of commaFractions around the circle
//       and the `down` reference fifth — D-08 requires a citable source per preset (see Pitfalls).
```

### Pattern 4: Fokker — both modes
**What:** Basis mode uses `parallelotope`; comma mode uses `xen-dev-utils` `integerDet` over BigInt monzos for the cardinality and (for enumeration) the basis-from-kernel approach.
**When to use:** GEN-08. Basis mode is the default (D-10); comma mode is a hard requirement (D-09).
**Example:**
```ts
// BASIS MODE (D-10 default) — pure rational, verified:
//   parallelotope([3, 5], [3, 1], [0, 1])  → 12 exact-rational notes
//   parallelotope([3, 5], [2, 2], [1, 1])  → 16 exact-rational notes
//   (basis = generator intervals; ups/downs = per-axis extents)

// COMMA MODE (D-09) — cardinality via BigInt determinant, verified:
import { toMonzo, integerDet } from "xen-dev-utils";
function fokkerCardinality(commaStrings: string[]): number {
  // Build the unison-vector matrix in (3,5,7,…) coords. For an n-prime limit you need
  // n-1 commas (octave/equave is the implicit period) OR include 2/1 as a row for a square matrix.
  const monzos = commaStrings.map((s) => toMonzo(s));            // Number monzos
  const width = Math.max(...monzos.map((m) => m.length));
  const square = monzos.map((m) => {
    const row = m.slice(); while (row.length < width) row.push(0); return row.map(BigInt);
  });
  return Math.abs(Number(integerDet(square)));
}
// VERIFIED: fokkerCardinality(["81/80","128/125"]) using the (3,5) subspace → 12.
//   (toMonzo("81/80")=[-4,4,-1]; toMonzo("128/125")=[7,0,-3];
//    2×2 det over the 3- and 5-exponents = -12 → |det| 12; the 3×3 with 2/1 row also = 12.)
// For enumeration of the actual block, drive SonicWeave's parallelotope with the basis derived
// from the comma kernel, OR (simpler) accept basis-mode as the canonical enumerator and use
// comma mode primarily for the |det| readout (D-12) plus a comma→basis conversion.
```

### Anti-Patterns to Avoid
- **Using `instanceof TimeReal` as the rational/tempered discriminator (blueprint A4).** Verified wrong: tempered cents-based intervals are `TimeMonzo`. Use `iv.value.isFractional()`.
- **Calling `wellTemperament(fractions)` without the explicit `comma` argument for Pythagorean-comma temperaments.** The default 81/80 (syntonic) silently produces a different scale.
- **Letting SonicWeave's `Fraction` (or its `Interval`) cross into the kernel.** Always round-trip via `${n}/${d}`. R-01 ESLint guards `Fraction` imports from `xen-dev-utils` but not SonicWeave's — the discipline is the `${n}/${d}` string.
- **Evaluating free-text on every keystroke.** Evaluate on button click only (D-16). Prelude evaluation is fast but per-keystroke compilation is wasteful and can surface transient parse errors mid-typing.
- **Reading `Temperament.generators` from inside the DSL source** (`POTE([81/80]).generators` is a parse error). `.generators` is a JS-side getter; the clean path is the all-DSL temper pattern (Pattern 2) so the adapter only ever sees a finished `currentScale`.
- **Presenting tempered ratios as exact JI.** Tempered scales are cents-of-record (Phase-6 D-01/D-02): cents-primary table, no ratio column, "tempered" badge.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rank-2 / MOS stacking with optimal tunings | A custom POTE/TE/CTE optimizer | SonicWeave `rank2` + `POTE`/`TE`/`CTE` | The optimizer is hard regular-temperament-theory math; the prelude ships it, runtime-verified. |
| Well-temperament fifth-chain tempering | A custom circle-of-fifths comma walker | SonicWeave `wellTemperament` | Handles the cumulative tempering + reduction + sort; just supply the comma-fraction vector and the explicit Pythagorean comma. |
| Fokker block enumeration | A custom lattice walker | SonicWeave `parallelotope` (basis mode) | Spans the parallelotope combinatorially and keeps results exact-rational; verified. |
| Fokker \|det\| cardinality | A hand-written matrix determinant | `xen-dev-utils` `integerDet` (BigInt) | Exact, BigInt, already installed; matches the project's purity discipline. |
| Free-text DSL parsing / evaluation | A mini expression parser | `evaluateSource` | The entire point of the escape hatch is the real DSL. |
| Rational → kernel `Interval` | Float cents round-trips | `${n}/${d}` string into `new Interval(...)` | Preserves BigInt exactness across the R-01 boundary (the established `jiSubsetOfEdo`/`diamond` pattern). |

**Key insight:** This whole phase is "let the prelude do the math, own the boundary." The only genuinely owned new logic is (1) the adapter's discriminator + R-01 round-trip and (2) the small `integerDet` cardinality helper. Everything else is composing source strings.

## Runtime State Inventory

> Not a rename/refactor/migration phase. Greenfield additive feature work (new kernel module + four new components + additive picker registrations). Section omitted as non-applicable — no stored data, live-service config, OS-registered state, secrets, or build artifacts carry a name that changes.

## Common Pitfalls

### Pitfall 1: The rational/tempered discriminator (blueprint A4 is wrong)
**What goes wrong:** Using `iv.value instanceof TimeReal` mis-classifies tempered cents-based intervals (which are `TimeMonzo`) as exact JI, laundering tempered pitches into fake ratios.
**Why it happens:** `TimeMonzo` can hold irrational exponents (from cents literals, EDO steps, sqrt, optimal tunings). Only some irrationals become `TimeReal`.
**How to avoid:** Use `iv.value.isFractional()` (documented public method, both classes). Keep `try { iv.toFraction() } catch` only as a fallback.
**Warning signs:** A "tempered" scale that shows a ratio column; or `toFraction()` throwing inside the rational branch.

### Pitfall 2: Well-temperament default comma is syntonic, not Pythagorean
**What goes wrong:** `wellTemperament([...])` without the `comma` arg uses 81/80 (syntonic), but D-07/Vallotti/Werckmeister are defined in Pythagorean-comma fractions → wrong scale.
**Why it happens:** The prelude default is `comma = 81/80`.
**How to avoid:** Always pass `531441/524288` explicitly for the Pythagorean-comma presets (and in custom mode, D-07).
**Warning signs:** A "Vallotti" whose fifth deviations are ~21.5/6 ≈ 3.6¢ off the expected ~3.9¢ pattern (syntonic comma ≈ 21.5¢ vs Pythagorean ≈ 23.5¢ — close enough to look plausible but subtly wrong).

### Pitfall 3: Well-temperament preset comma vectors need per-preset sourcing
**What goes wrong:** `commaFractions` ordering (which fifth is index 0 / the `down` reference) and sign convention determine the key colour; an incorrectly ordered vector produces a *different* historical temperament.
**Why it happens:** Werckmeister III, Kirnberger III, Vallotti, Young I/II, Neidhardt, Kellner, Lehman "Bach" each distribute their tempering at *specific positions* around the circle of fifths. Werckmeister III, for example, is NOT a contiguous run — it tempers C–G, G–D, D–A, and B–F♯ by 1/4 comma with the rest pure.
**How to avoid:** Source each preset's comma-fraction vector from a citable reference and verify it produces the canonical per-degree cents. Strong citable source: arXiv 1912.10918 "Well Temperaments based on the Werckmeister Definition" (gives Werckmeister → Vallotti → Bach → Kirnberger → ET schemes). Cross-check against Wikipedia "Vallotti temperament" / "Werckmeister temperament" and tonalsoft.com encyclopedia entries.
**Warning signs:** A preset's published "tempered fifths" count doesn't match (Werckmeister III has 8 pure fifths, Kellner 7, Vallotti 6) — assert these as test vectors.

### Pitfall 4: SonicWeave's Fraction crossing the R-01 boundary
**What goes wrong:** Passing SonicWeave's `Interval`/`Fraction` straight into the kernel loses BigInt exactness and may trip R-01 ESLint.
**Why it happens:** SonicWeave's internal Fraction is its own type; the kernel's `Interval` wraps `fraction.js`.
**How to avoid:** Always `${String(f.n)}/${String(f.d)}` round-trip into `new Interval(...)` — never hand the object across.
**Warning signs:** ESLint `no-restricted-imports` fires; or large-ratio precision loss.

### Pitfall 5: Empty-scale / degenerate free-text expressions
**What goes wrong:** A valid-but-empty expression (e.g. a bare comment or a program that pops the whole scale) yields `currentScale.length === 0`, and `new Scale([])` throws.
**Why it happens:** `evaluateSource` succeeds (no parse error) but produces nothing.
**How to avoid:** Guard `out.length === 0` → structured error before constructing `Scale`. Preserve the prior preview (D-15).
**Warning signs:** A `Scale: empty` RangeError surfacing as an uncaught throw instead of a status-region message.

### Pitfall 6: Fokker comma-matrix rank / non-square inputs
**What goes wrong:** Feeding `integerDet` a non-square matrix (too few/many commas for the prime limit) throws or returns a meaningless value.
**Why it happens:** A p-limit periodicity block needs exactly the right number of unison vectors (one per non-equave prime axis) to be square.
**How to avoid:** Validate the comma set forms a square matrix in the chosen subgroup before computing \|det\|; if not, show a clear status message and don't render. Cap the number of commas and the resulting cardinality (defense-in-depth, mirror Phase-6 D-14).
**Warning signs:** A "→ NaN notes" or a thrown determinant error in the live readout.

## Code Examples

### Verified prelude signatures (extracted from the baked prelude this session)
```
fn rank2(generator, up, down = 0, period = niente, numPeriods = 1, generatorSizeHint = niente, periodSizeHint = niente)
fn cps(factors, count, equave = niente, withUnity = false)
fn wellTemperament(commaFractions, comma = 81/80, down = 0, generator = 3/2, period = niente)
fn parallelotope(basis, ups = niente, downs = niente, equave = niente, basisSizeHints = niente, equaveSizeHint = niente)
fn mos(numberOfLargeSteps, numberOfSmallSteps, sizeOfLargeStep = 2, sizeOfSmallStep = 1, up = niente, down = niente, equave = 2)
fn TE(valsOrCommas, basis = niente)        # Tenney-Euclid optimal Temperament
fn POTE(valsOrCommas, primeLimit = niente) # Pure-octave normalized TE
fn CTE(valsOrCommas, primeLimit = niente)  # Constrained (pure-equave) TE
```

### Verified cross-check vectors (assert these in tests)
```ts
// Source: evaluateSource(...).currentScale, runtime this session.
// rank2(3/2, 5, 1) ≡ buildMos(3/2, 2/1, 7):
//   9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2/1   (cents 203.910 … 1200)
// cps([1,3,5,7], 2) ≡ kernel Hexany:
//   7/6, 5/4, 35/24, 5/3, 7/4, 2/1
// quarter-comma meantone rank2(696.578…, 5, 1) — tempered, fifth at 696.578¢:
//   193.157, 386.314, 503.422, 696.578, 889.735, 1082.892, 1200.000
// POTE meantone (rank2(3/2,5,1) then POTE([81/80])): fifth 696.239¢ (all tempered)
// CTE meantone fifth 697.214¢ ; TE meantone fifth 697.049¢ (octave impure 1201.397¢)
// parallelotope([3,5],[3,1],[0,1]) — exact 12-note Fokker block (all rational)
// fokkerCardinality(["81/80","128/125"]) → 12   (integerDet over BigInt monzos)
```

### Discriminator method declaration (verified in type defs)
```
// node_modules/sonic-weave/dist/monzo.d.ts
//   line 306: TimeReal.isFractional(): boolean
//   line 528: TimeMonzo.isFractional(): boolean
// Both return true for exact rationals, false for tempered/irrational. THIS is the discriminator.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-method bespoke C / Scala CLI commands | SonicWeave prelude as one embeddable scale-DSL | Scale Workshop 3 era (2023→) | The whole generator vocabulary is one already-installed dep; forms are thin. |
| `instanceof TimeReal` as rational test (blueprint A4) | `iv.value.isFractional()` | This session's runtime verification | Correctly classifies tempered `TimeMonzo` cents intervals that A4 would mis-launder as JI. |
| Hand-rolled Fokker lattice walks | `xen-dev-utils` `integerDet`/`hnf` (BigInt) + SonicWeave `parallelotope` | ongoing | Cardinality and enumeration are off-the-shelf and exact. |

**Deprecated/outdated:**
- Blueprint Assumption A4 (`iv.value instanceof TimeReal` discriminator) — superseded by `isFractional()` (verified this session).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The well-temperament preset comma-fraction *vectors* (exact per-fifth ordering, sign, and `down` reference) for the full D-08 roster (Werckmeister III, Kirnberger III, Vallotti, Young I/II, Neidhardt, Kellner, Lehman "Bach") match the canonical historical schemes | Pitfall 3 / GEN-07 | MEDIUM — a mis-ordered vector yields a *different but plausible-looking* temperament. **Each preset's vector must be sourced + verified against published per-degree cents at implementation time (TDD test vector per preset).** This research confirms the mechanism and Vallotti's 1/6×6 scheme; the full roster's exact vectors are an implementation-time sourcing task. |
| A2 | For the rank-2 preset roster (D-17), porcupine/hanson/magic/etc. can be expressed as `mos(L,s)` + a temperament comma list driving POTE/TE/CTE | Pattern 2 | LOW — porcupine verified (`mos(6,1)` + `POTE([250/243])`). Other named temperaments follow the same comma-list pattern; confirm each preset's comma list + mos shape during implementation. |
| A3 | Comma-mode Fokker *enumeration* (not just cardinality) is cleanest by converting the comma kernel to a basis and feeding `parallelotope`, or by treating basis mode as the canonical enumerator with comma mode driving the \|det\| readout + a comma→basis conversion | Pattern 4 / D-09 | LOW-MEDIUM — cardinality (\|det\|) is verified exact. The full comma→block enumeration path (D-09 hard requirement) has two viable implementations; the planner should pick one and verify the 81/80+128/125 block renders 12 exact notes either way. `xen-dev-utils` `kernel`/`hnf` supply the basis-from-commas math if needed. |
| A4 | `evaluateSource` prelude startup stays fast enough in-browser (it is fast in Node) | GEN-09 | LOW — evaluate-on-click (D-16) already mitigates; if first eval is slow, the click model absorbs it. |

**If this table is non-empty:** A1 is the one the planner/discuss-phase should treat as needing per-preset verification (it directly affects historical correctness of GEN-07 presets). A2/A3 are implementation choices with verified anchors.

## Open Questions (RESOLVED)

> All three are bounded implementation choices resolved by concrete plan tasks (not open research). RESOLVED markers cite the resolving plan/task.

1. **Exact well-temperament comma vectors for the full D-08 roster.**
   - What we know: the mechanism (`wellTemperament(fractions, 531441/524288, down, 3/2)`), Vallotti = 1/6 Pythagorean ×6 + pure ×6, Werckmeister III = four 1/4-comma fifths at specific positions + rest pure (8 pure fifths), and the pure-fifth counts (Werckmeister 8, Kellner 7, Vallotti 6) as assertable invariants.
   - What's unclear: the precise `commaFractions` array ordering and `down` reference for each of the 8 presets such that the per-degree cents match the canonical published values.
   - Recommendation: TDD per preset — source the scheme (arXiv 1912.10918 + Wikipedia + tonalsoft), encode the vector, assert (a) the pure-fifth count and (b) 2–3 published degree cents. This is bounded implementation work, not open research.
   - **RESOLVED:** TDD per preset, owned by **Plan 02 Task 2** (`generate-welltemp.ts` + per-preset vectors appended to `sonicweave.test.ts`). Each preset's `commaFractions` vector is sourced from a citable reference (arXiv 1912.10918 + Wikipedia + tonalsoft, cross-checked against `src/pages/well-temperament.md`) and verified by an asserted test vector (pure-fifth count + 2–3 published degree cents). If a preset's vector cannot be confidently sourced, the plan ships a smaller verified roster and records the omission in the SUMMARY rather than a plausible-but-wrong vector.

2. **Comma-mode Fokker enumeration implementation.**
   - What we know: \|det\| cardinality is exact via `integerDet`; `parallelotope` enumerates basis-mode blocks exactly.
   - What's unclear: whether to (a) convert comma kernel → basis via `xen-dev-utils` `kernel`/`hnf` then `parallelotope`, or (b) enumerate the block directly from the unison-vector lattice.
   - Recommendation: prefer (a) — reuse the verified `parallelotope` enumerator; verify the classic 81/80+128/125 block renders exactly 12 rational notes. Keep comma mode's primary job the \|det\| readout (D-12) + the comma→basis bridge.
   - **RESOLVED:** Path (a), owned by **Plan 03 Task 1** (`generate-fokker.ts`). Comma mode's primary job is the live \|det\| readout via `fokkerCardinality` (Plan 01); enumeration reuses the verified `parallelotope` basis enumerator via a comma→basis bridge, and the plan's test asserts the classic 81/80 + 128/125 block renders exactly 12 exact-rational notes.

3. **Rank-2 default: quarter-comma (historical) vs POTE (optimal).**
   - What we know: D-02 fixes quarter-comma meantone (696.578¢) as the landing default; POTE meantone is 696.239¢.
   - What's unclear: nothing blocking — just ensure the "pure"/"custom" generator path passes the literal 696.578¢ cents while the POTE/TE/CTE options use the temper pattern.
   - Recommendation: model the tuning select as {pure | quarter-comma | POTE | TE | CTE} where quarter-comma is a literal-cents preset and POTE/TE/CTE drive the temper pattern.
   - **RESOLVED:** Owned by **Plan 02 Task 1** (`generate-rank2.ts`). The tuning select is modeled as {pure | quarter-comma | POTE | TE | CTE}: quarter-comma is the literal-cents landing default (`rank2(696.578428466209, up, down)`, D-02), pure passes the exact ratio, and POTE/TE/CTE drive the two-line temper pattern (RESEARCH Pattern 2).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `sonic-weave` | all four widgets + adapter | ✓ | 0.14.1 | none needed |
| `xen-dev-utils` | Fokker comma mode (`integerDet`/`hnf`/`kernel`) | ✓ | 0.13.1 | none needed |
| `fraction.js` | BigInt `Interval` currency | ✓ | 5.3.4 (pinned) | none |
| Node | dev/test/build runtime | ✓ | 24.12.0 (installed; engines floor 20) | — |

**Missing dependencies with no fallback:** none — every dependency is installed and runtime-verified this session.
**Missing dependencies with fallback:** none.

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` → section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (project standard; `vitest.config.ts` present) |
| Config file | `vitest.config.ts` (excludes Framework cache + Markdown) |
| Quick run command | `npx vitest run src/lib/__tests__/sonicweave.test.ts` |
| Full suite command | `npx vitest run` |
| Component env | `// @vitest-environment happy-dom` per component test (mirror `mos-builder.test.ts`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEN-06 | `scaleFromSonicWeave("rank2(3/2,5,1)")` ≡ `buildMos(3/2,2/1,7)` exact `n/d` | unit | `npx vitest run src/lib/__tests__/sonicweave.test.ts` | ❌ Wave 0 |
| GEN-06 | tempered rank-2 (quarter-comma 696.578¢) flagged tempered, cents-of-record | unit | same | ❌ Wave 0 |
| GEN-06 | rank-2 widget: preset default = quarter-comma, tuning select POTE/TE/CTE/pure | component | `npx vitest run src/components/__tests__/generate-rank2.test.ts` | ❌ Wave 0 |
| GEN-07 | well-temp widget renders 12-note tempered scale with badge; Vallotti default | component | `npx vitest run src/components/__tests__/generate-welltemp.test.ts` | ❌ Wave 0 |
| GEN-07 | per-preset comma-vector test vectors (pure-fifth count + 2–3 degree cents) | unit | `npx vitest run src/lib/__tests__/sonicweave.test.ts` | ❌ Wave 0 |
| GEN-08 | `fokkerCardinality(["81/80","128/125"])` === 12 (BigInt det) | unit | `npx vitest run src/lib/__tests__/fokker.test.ts` | ❌ Wave 0 |
| GEN-08 | basis-mode block `parallelotope([3,5],[3,1],[0,1])` → 12 exact-rational notes | unit | `npx vitest run src/lib/__tests__/sonicweave.test.ts` | ❌ Wave 0 |
| GEN-08 | Fokker widget live "→ N notes" readout updates with inputs (D-12) | component | `npx vitest run src/components/__tests__/generate-fokker.test.ts` | ❌ Wave 0 |
| GEN-09 | `scaleFromSonicWeave("cps([1,3,5,7],2)")` ≡ Hexany (cross-check) | unit | `npx vitest run src/lib/__tests__/sonicweave.test.ts` | ❌ Wave 0 |
| GEN-09 | malformed free-text → structured error in status region, prior preview preserved | component | `npx vitest run src/components/__tests__/generate-sonicweave.test.ts` | ❌ Wave 0 |
| ALL | R-01: rational results are kernel BigInt `Interval`s (round-tripped `n/d`), not SW Fraction | unit + `npm run lint` | `npx vitest run … && npm run lint` | ❌ Wave 0 |
| ALL | input > 8 KB cap → structured error (reuse `MAX_SCALE_TEXT_BYTES`) | unit | `npx vitest run src/lib/__tests__/sonicweave.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run <the touched test file>`
- **Per wave merge:** `npx vitest run` (full suite) + `npm run lint:types` + `npm run lint` (R-01 ESLint green) + `npm run build`
- **Phase gate:** Full suite + lint + build green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/sonicweave.test.ts` — covers GEN-06/07/08/09 adapter behavior + R-01 + cap
- [ ] `src/lib/__tests__/fokker.test.ts` — covers GEN-08 \|det\| cardinality
- [ ] `src/components/__tests__/generate-rank2.test.ts` — GEN-06 widget
- [ ] `src/components/__tests__/generate-welltemp.test.ts` — GEN-07 widget
- [ ] `src/components/__tests__/generate-fokker.test.ts` — GEN-08 widget
- [ ] `src/components/__tests__/generate-sonicweave.test.ts` — GEN-09 widget
- [ ] Framework: already present (Vitest + happy-dom) — no install needed

## Security Domain

> `security_enforcement` absent in config (treat as enabled). This is a self-hosted, client-side static site with one new untrusted input vector: the free-text SonicWeave textarea (GEN-09).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface (static notebook). |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | No server. |
| V5 Input Validation | **yes** | Free-text DSL input: 8 KB byte cap (`MAX_SCALE_TEXT_BYTES`), evaluate-on-click, try/catch all eval, status-region errors via `textContent` only (never `innerHTML`). Defense-in-depth caps on Fokker extents / rank-2 up-down / comma count (RangeError before enumeration, Phase-6 D-14). |
| V6 Cryptography | no | None. |

### Known Threat Patterns for {static client-side notebook + embedded DSL}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via DSL error text or interval labels rendered as HTML | Tampering / Info disclosure | `createElement` + `textContent` ONLY for all dynamic content (error messages, ratios, cents). Never `innerHTML` for user-derived strings. Status region `role="status" aria-live="polite"`. |
| DoS via pathological DSL input (huge scales, deep recursion) | Denial of Service | 8 KB input cap; defense-in-depth caps on extents/up-down/comma count validated BEFORE enumeration; evaluate-on-click (not per keystroke). SonicWeave's own evaluator bounds most runaway cases; the input cap bounds source size. |
| Stored-XSS via Send-to → store → Dashboard textarea | Tampering | Send-to writes the store; consumers set `textarea.value` (not innerHTML) and re-dispatch `input` — value is data, not markup. Existing Phase-5 one-way flow already enforces this. |

**Note:** SonicWeave's `evaluateSource` is a *scale* DSL, not a general-purpose interpreter with filesystem/network access — it has no I/O sinks. The residual risk is DoS (bounded by the 8 KB cap) and XSS in *rendering* the results (bounded by the `textContent`-only discipline). No new attack surface beyond what the cap + render discipline already cover.

## Project Constraints (from CLAUDE.md)

- **R-01:** ratios stay BigInt-exact; import `Fraction` ONLY from `fraction.js`, never from `xen-dev-utils` (ESLint `no-restricted-imports` enforces). SonicWeave results round-trip via `${n}/${d}`.
- **Cents at the boundary only:** keep ratios (`Fraction` / monzo) as the source of truth; derive cents only at the display/audio layer. Tempered scales are the explicit exception (cents-of-record), flagged at the component layer.
- **No new npm dependency; do NOT upgrade `xen-dev-utils` past 0.13.1.** (REQUIREMENTS.md out-of-scope; ji-lattice peers ^0.12.2.)
- **Observable Framework conventions:** import TS modules with the `.js` extension; components are plain TS modules exporting `(synth, opts) => HTMLElement` factories; no `new AudioContext()` at module top-level (page owns the synth); reactive cells in Markdown.
- **Three-layer purity:** kernel (`src/lib/`) imports nothing from `components/` or `audio/`. `scale-store.ts` is the one allowed shared page↔store dep.
- **XSS discipline:** `createElement` + `textContent` only; never `innerHTML` for dynamic content.
- **GSD workflow:** file-changing work goes through a GSD command; new kernel symbols → `src/lib/INVENTORY.md` rows with Source + Reason.

## Sources

### Primary (HIGH confidence — runtime-verified this session)
- `node_modules/sonic-weave@0.14.1` — `evaluateSource` return shape (`StatementVisitor.currentScale: Interval[]`), prelude signatures (`rank2`/`cps`/`wellTemperament`/`parallelotope`/`mos`/`TE`/`POTE`/`CTE`), the `isFractional()` discriminator (`dist/monzo.d.ts:306,:528`), verified cross-check vectors (Hexany, Pythagorean diatonic, quarter-comma + POTE/TE/CTE meantone, parallelotope 12-note block).
- `node_modules/xen-dev-utils@0.13.1` — `integerDet`/`hnf`/`kernel`/`cokernel`/`toMonzo` signatures (`dist/hnf.d.ts`, `dist/basis.d.ts`, `dist/monzo.d.ts`); verified `fokkerCardinality(["81/80","128/125"]) → 12`.
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-{PLAN,RESEARCH}.md` — Tranche 2 blueprint, R-01/tempered rules, adapter pattern.
- This repo's source — `src/lib/interval.ts`, `scale.ts`, `mos.ts`, `cents.ts` (`centsToRatio`), `generators.ts`, `components/scale-table.ts` (tempered API), `components/generate-ed.ts` (`isTempered()`/`getScale()`), `eslint.config.js` (R-01), `src/pages/generate.md` (picker optgroups).

### Secondary (MEDIUM confidence)
- [SonicWeave documentation](https://github.com/xenharmonic-devs/sonic-weave/blob/main/documentation/dsl.md) (and `advanced-dsl.md`, `tempering.md`, `BUILTIN.md`; hosted API at `https://xenharmonic-devs.github.io/sonic-weave/`) — D-20 docs-link candidates. The `dsl.md`/`advanced-dsl.md` pair is the most user-facing stable URL for the free-text widget link.
- [Vallotti temperament — Wikipedia](https://en.wikipedia.org/wiki/Vallotti_temperament), [Werckmeister temperament — Wikipedia](https://en.wikipedia.org/wiki/Werckmeister_temperament), [Well temperament — Wikipedia](https://en.wikipedia.org/wiki/Well_temperament) — well-temperament comma schemes / pure-fifth counts.

### Tertiary (LOW confidence — verify per preset at implementation time)
- [arXiv 1912.10918 "Well Temperaments based on the Werckmeister Definition"](https://arxiv.org/pdf/1912.10918) — citable source for the full Werckmeister→Vallotti→Bach→Kirnberger→ET roster comma schemes (D-08 sourcing).
- [tonalsoft encyclopedia: Werckmeister](http://tonalsoft.com/enc/w/werckmeister.aspx) — cross-reference for comma vectors.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all three deps installed, versions confirmed, no new deps.
- Adapter / discriminator: HIGH — `evaluateSource` shape, `currentScale`, and `isFractional()` discriminator runtime-verified; corrected blueprint A4.
- Rank-2 + optimal tunings: HIGH — `rank2` signature + POTE/TE/CTE temper pattern + cross-check vectors verified.
- Fokker: HIGH for cardinality (\|det\|=12 verified) and basis-mode enumeration (12-note block verified); MEDIUM for the comma-mode *enumeration* implementation choice (two viable paths, A3).
- Well-temperament: HIGH for mechanism (`wellTemperament` + explicit Pythagorean comma); MEDIUM for the exact per-preset comma vectors (A1 — needs per-preset sourcing + test vectors at implementation time).
- Pitfalls: HIGH — discriminator, comma default, and R-01 boundary all verified.

**Research date:** 2026-06-11
**Valid until:** 2026-07-11 (stable — deps are pinned/installed; no version drift risk within the milestone)
