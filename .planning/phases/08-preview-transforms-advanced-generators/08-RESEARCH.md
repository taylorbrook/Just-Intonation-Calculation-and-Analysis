# Phase 8: Preview, Transforms & Advanced Generators - Research

**Researched:** 2026-06-12
**Domain:** Observable Framework SVG viz + scale-transform orchestration + SonicWeave-wrapped generators (constant-structure) + hand-rolled Wilson/metallic recurrence kernel
**Confidence:** HIGH (most claims verified against installed source + runtime probes; the few `[ASSUMED]`/discretion items are flagged)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Circle-of-pitches viz (SURF-05)**
- **D-01:** Rim labels match the table convention — exact-JI scales show ratios (`5/4`); tempered scales show cents only (same exact-vs-tempered discipline as Phase-6 table 06-CONTEXT D-01). The circle reinforces the "tempered" badge; never show float-derived ratios for tempered output.
- **D-02:** Faint 12-EDO reference ticks at every 100¢ around the rim (cents-from-12tet display convention). For non-octave equaves the ticks still map by cents; default shows them.
- **D-03:** One shared circle instance in the page's shared preview host, fed by the active widget's `getScale()` — single mount point, applies to all families, pairs with the transform strip.
- **D-04:** Hover tooltip + marker highlight in addition to click-to-audition. Hover enlarges/highlights the marker and shows full pitch info (ratio or cents + cents-from-12tet); matches the `lattice.ts` hover idiom. Click → audition via the page-owned synth.

**Transform strip (SURF-04)**
- **D-05:** Non-destructive overlay. Strip settings (mode N, reduce on/off, dedupe on/off, transpose ratio) re-derive the transformed scale from the generator's current output every render. Always re-derivable; easy reset. No baked-in mutation pipeline.
- **D-06:** Transformed result shown in the shared preview. The active widget's own table keeps showing raw generator output; the shared preview area (strip + circle + a transformed table when transforms are active) shows the transformed scale that "Send to…" serializes. Do NOT mutate widgets' internal rendering from outside their factory (preserves Pattern-2 encapsulation).
- **D-07:** Rotate-to-mode = native `<select>` listing all modes (Mode 1 of N … Mode N of N), rebuilt when the scale changes. Wired to `Scale.rotate`.
- **D-08:** Reset button + clear on method switch. "Reset" returns the strip to identity (mode 1, no reduce/dedupe/transpose); switching generator method also resets the strip.

**Wilson recurrence / metallic (GEN-10)**
- **D-09:** Exact convergents are the scale; the metallic limit is a readout. Scale IS the exact-rational successive-ratio convergents (JI table with ratios). The metallic limit appears as an informational readout (e.g. φ ≈ 833.09¢, marked tempered) beside the table — never appended as a scale degree.
- **D-10:** Presets = metallic family + Wilson Meru seeds. Golden (a=1,b=1), silver (a=2,b=1), bronze (a=3,b=1), plus Wilson's Mt. Meru seed variants — each citable (Vallotti-precedent discipline from Phase 7). Preset fills fields; all stay editable.
- **D-11:** Editable params = seeds (x₀, x₁) + coefficients (a, b) + term count, with defense-in-depth caps (term count, magnitude) per Phase-6 D-14.
- **D-12:** Default landing = Fibonacci / golden (a=1, b=1, seeds 1,1), ~7 convergents (2/1, 3/2, 5/3, 8/5, 13/8…) with φ ≈ 833.09¢ limit readout.

**Constant-structure (GEN-10, via Phase-7 adapter)**
- **D-13:** Generator chips + ordinal field → SonicWeave `csgs(generators, ordinal)` through `scaleFromSonicWeave`. Reuse the Phase-6/7 chip-input idiom (ratios as chips); no SonicWeave syntax exposed.
- **D-14:** Live CS-status readout — `✓ constant structure` / `✗ not CS (ambiguous at …)` on the result, mirroring the Fokker "→ N notes" readout (Phase-7 D-12).
- **D-15:** Default landing = Pythagorean-style CS diatonic — `csgs([3/2], 7)`, a 7-note exact-rational scale. **⚠️ This decision contains an empirical error — see "Critical Correction" below: `csgs([3/2], 7)` produces 41 notes, NOT 7. The 7-note Pythagorean diatonic is `csgs([3/2], 3)` (ordinal, not size) or `gs([3/2], 7)` (literal size).**
- **D-16:** SonicWeave errors → status region + preserve prior preview (the Phase-7 D-15 free-text rule).

### Claude's Discretion
- **D-17:** Circle-viz internals — marker/tick styling and tokens (match `05-UI-SPEC.md`, don't invent), tonic-marker emphasis, dense-scale label thinning, tooltip layout. Empty-state copy mirrors `lattice.ts`.
- **D-18:** Whether the strip's transpose input is a `makeRatioField` n/d pair (blueprint suggests this) and how transposed/reduced tempered scales render (cents-source must be preserved — `Scale` methods already do this).
- **D-19:** `meru.ts` kernel signature and exact preset roster beyond golden/silver/bronze (pick well-known Meru seed pairs with citable references); exact term-count and magnitude caps; whether convergents are octave-reduced or left literal (default to a sensible musical reading, expose if cheap).
- **D-20:** CS-status check implementation — reuse existing kernel utility or small new helper (if new + kernel-layer, add INVENTORY row); how "ambiguous at X" is phrased.
- **D-21:** Component decomposition (`circle-of-pitches.ts`, `scale-transform-strip.ts`, `generate-meru.ts`, `generate-cs.ts`) and where each registers in the picker `<optgroup>`s (Wilson/metallic + constant-structure → "Advanced").

### Deferred Ideas (OUT OF SCOPE)
- Scala archive browser (LIB-01..03) — Phase 9.
- Toggleable 12-EDO grid on the circle — ships on by default (D-02); toggle is v2.
- Metallic-limit-stack scale mode (tempered scale built by stacking the limit interval) — v2 sub-mode.
- CS-presets roster (named canonical constant-structure scales) — D-13 ships chips + ordinal only.
- "Show the SonicWeave code behind this widget" — v2.
- Any change to `Interval` / `Scale` kernel types; any new npm dependency; new tempered-representation conventions (reuse Phase-6 cents-only + badge verbatim).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SURF-04 | User can rotate the generated scale to any mode and apply reduce / dedupe / transpose before exporting | `Scale.rotate/reduce/dedupe/transpose` verified immutable + sufficient (scale.ts:52–113); strip is pure orchestration, NO kernel change. Transform feeds `currentScaleText` → `writeSharedScale`/`encodeScaleToHash` so Send-to serializes the transformed scale. Period-aware reduce + cents-source survival confirmed. |
| SURF-05 | User can view a circle-of-pitches visualization of the generated scale | `spiral-of-fifths.ts` / `keyboard.ts` plain-SVG `createElementNS` idiom is the precedent (~60–190 LOC, no d3). Angle = `iv.cents / period.cents · 2π`. Click → `synth.playNote(baseHz·ratio, dur)`. Hover/empty-state mirror `lattice.ts`. |
| GEN-10 | User can generate Wilson recurrence / metallic-ratio (Mt. Meru) and constant-structure scales | Wilson: hand-rolled `meru.ts` — successive Fibonacci-style convergents are exact BigInt ratios; metallic limit `(a+√(a²+4b))/2` is irrational → tempered cents readout (φ≈833.09¢ verified). CS: `scaleFromSonicWeave("csgs(...)")` — `csgs`/`gs`/`hasConstantStructure` signatures verified empirically against installed `sonic-weave@0.14.1`. |
</phase_requirements>

## Summary

Phase 8 is overwhelmingly a **composition + wiring** phase, not a research-heavy one — the CONTEXT.md is exhaustive, and three of the four deliverables reuse mature, already-shipped primitives. The two genuinely new things are (1) a plain-SVG circle viz (a direct sibling of the existing `spiral-of-fifths.ts`/`keyboard.ts`), and (2) one new hand-rolled kernel module `meru.ts` for the Wilson recurrence. Everything else is orchestration over existing `Scale` methods and the existing `scaleFromSonicWeave` adapter.

The single most important finding is an **empirical correction to D-15**: the SonicWeave `csgs(generators, ordinal)` second argument is an **ordinal index of CS scales ordered by increasing size, NOT a note count**. Runtime-verified against `sonic-weave@0.14.1`: `csgs([3/2], 7)` returns **41 notes** (and several of its intervals throw "Denominator above safe limit", which the existing adapter fail-closes on — so the literal D-15 default would error). The 7-note Pythagorean diatonic the decision intends is `csgs([3/2], 3)` (ordinal 3 → 2,3,5,7,12 are the CS cardinalities of the fifth-chain) or `gs([3/2], 7)` (literal stack size). The planner MUST use `csgs([3/2], 3)` for the default landing, and the CS-widget UI must label its second field "ordinal," not "note count."

The second finding is that `sonic-weave` ships a usable **`hasConstantStructure(scale)` builtin** AND a JS-level `hasConstantStructure(monzos: TimeMonzo[])` in `tools.js` — but neither is cleanly reachable from our kernel boundary (the adapter only returns a `Scale`, and the builtin pushes its boolean onto the SonicWeave scale, which is awkward to read back through `scaleFromSonicWeave`). The pragmatic D-20 answer is a **small new kernel helper** `isConstantStructure(scale): { cs: boolean; ambiguousAt?: ... }` operating on the already-built kernel `Scale` via exact BigInt interval-class subtension counting (the same algorithm `tools.js` uses) — this gives us the "ambiguous at X" detail the builtin doesn't expose, and keeps everything on our BigInt path.

**Primary recommendation:** Build `circle-of-pitches.ts` as a `(scale, synth, opts) => HTMLElement` plain-SVG factory cloning the `keyboard.ts`/`spiral-of-fifths.ts` idiom; build `scale-transform-strip.ts` as a Pattern-2 orchestrator over `Scale.rotate/reduce/dedupe/transpose` that exposes a `getTransformedScale()`; hand-roll `meru.ts` with `meruScale(a,b,x0,x1,terms)` returning exact convergents plus a separate `metallicLimitCents(a,b)`; wrap CS via `scaleFromSonicWeave(\`csgs([${gens}], ${ordinal})\`)` with the corrected ordinal semantics and a new `isConstantStructure` kernel helper for the D-14 readout.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Circle-of-pitches rendering | Component (viz) | Kernel (`Interval.cents`, `Scale.period`) | Pure SVG presentation reading kernel projections; no audio surface (Pitfall #2) |
| Click-to-audition on circle | Component (viz) → page-owned synth | Audio (`SynthHandle`) | Viz holds the `synth` handle passed in; never allocates AudioContext (D-08) |
| Mode rotation / reduce / dedupe / transpose | Component (strip orchestration) | Kernel (`Scale` methods) | All math already lives in `scale.ts`; strip is pure orchestration (no new kernel) |
| Transformed-scale → Send-to | Page (`generate.md`) | State (`scale-store`, `url.ts`) | The page owns the serialization branch; strip feeds it the transformed `Scale` |
| Wilson recurrence → convergents | Kernel (`meru.ts`, NEW) | — | Exact BigInt rational math belongs in the pure kernel layer |
| Metallic-limit cents readout | Kernel (`meru.ts`) → Component (display) | — | Limit is irrational (float/cents) — computed in kernel, flagged tempered at component |
| Constant-structure generation | Kernel adapter (`sonicweave.ts`) | Component (`generate-cs.ts`) | Reuse the Phase-7 `scaleFromSonicWeave` boundary; no new adapter |
| CS-status check (✓/✗ ambiguous) | Kernel helper (NEW, small) | Component (readout) | Exact BigInt interval-class subtension on the built `Scale`; INVENTORY row |

## Standard Stack

**No new dependencies.** Every primitive needed is already installed and shipped (per ROADMAP "Zero new npm dependencies"). This phase adds project source files only.

### Core (existing, verified present)
| Module | Path | Purpose | Verification |
|--------|------|---------|--------------|
| `Scale` | `src/lib/scale.ts` | `rotate/reduce/dedupe/transpose` (immutable) | Read scale.ts:52–113 — all four methods return new `Scale`; reduce is period-aware (line 76) `[VERIFIED: source]` |
| `Interval` | `src/lib/interval.ts` | `.cents`, `.fraction`, `.octaveReduce(period)` | Read interval.ts:49–92 `[VERIFIED: source]` |
| `scaleFromSonicWeave` | `src/lib/sonicweave.ts` | CS adapter — `{ scale, tempered, error? }` | Read sonicweave.ts in full `[VERIFIED: source]` |
| `scaleTable` | `src/components/scale-table.ts` | Exact-JI (ratio) + tempered (cents-only + badge) paths | Read scale-table.ts:42–117 `[VERIFIED: source]` |
| `playScale` / `SynthHandle` | `src/components/play-scale.ts`, `src/audio/synth.ts` | Audition; `playNote(hz, dur?) => release` | synth.ts:42–56 `[VERIFIED: source]` |
| `sonic-weave` prelude | `node_modules/sonic-weave@0.14.1` | `csgs`, `gs`, `hasConstantStructure` | Runtime-probed (see Code Examples) `[VERIFIED: runtime + installed dist]` |

### Supporting (existing precedents to clone)
| Module | Path | Reuse For | When |
|--------|------|-----------|------|
| `spiral-of-fifths.ts` | `src/components/` | SVG ring idiom: `createElementNS`, cents→angle, `textContent` labels, U+2212 minus, `String()` coercion, `if (!s) continue` guards | Circle-of-pitches base |
| `keyboard.ts` | `src/components/` | `(scale, synth, baseHz, opts)` factory + pointerdown→`playNote`→release click-audition + aria-label format | Circle-of-pitches click-audition |
| `lattice.ts` | `src/components/` | Hover `<title>` tooltip, empty-state (`if (basis.length === 0) → <p>`), per-node `tabindex/role/aria-label` | Circle hover (D-04) + empty-state |
| `makeRatioField` | `src/components/mos-builder.ts:93–146` | n/d ratio input pair (transpose field D-18; Wilson seed/coefficient inputs) | Strip transpose + Meru params |
| `makeChipInput` | `src/components/generate-fokker.ts:280–367` | Generic chip list + Add/× + per-instance cap + `onListChanged` | CS generator chips (D-13) |
| `generate-fokker.ts` | `src/components/` | Closure-local state, `composeSource()→scaleFromSonicWeave→render`, live readout, status region, "preserve prior preview on error" | `generate-cs.ts` structural twin |
| `generate-cps.ts` | `src/components/` | Preset `<select>` that fills fields | Meru preset roster (D-10) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain-SVG circle (`createElementNS`) | d3 (already a dep, used by `lattice.ts`) | D3 is overkill for a static ring with N markers; the blueprint + 05-PATTERNS explicitly prefer plain SVG for non-interactive-layout viz (`keyboard.ts`/`spiral-of-fifths.ts` precedent). Use d3 only if pan/zoom is wanted — it is NOT for this circle. **Recommendation: plain SVG.** |
| New kernel `isConstantStructure` helper | SonicWeave builtin `hasConstantStructure()` via adapter | The builtin returns a boolean by pushing it onto the SonicWeave scale (read-back is awkward through our `{scale,tempered}` contract) and gives no "ambiguous at X" detail. A ~25-line kernel helper on the built `Scale` is cleaner, gives the D-14 detail, and stays on BigInt. **Recommendation: new helper (D-20).** |
| `meru.ts` hand-rolled | SonicWeave has no Mt. Meru builtin | No wrap option exists — `meruScale` MUST be hand-rolled (RESEARCH A-4 #15). The recurrence is trivial; the only design choices are caps + octave-reduce. |

**Installation:** none — `npm install` adds nothing this phase.

**Version verification:** `node -e "require('./node_modules/sonic-weave/package.json').version"` → `0.14.1` `[VERIFIED: installed dist]`. fraction.js 5.3.4 (BigInt) is the source of truth for all convergents via `Interval`.

## Package Legitimacy Audit

> No external packages are installed this phase. The only third-party code touched (`sonic-weave@0.14.1`) was vetted and patched in Phase 7 (patch-package `default` export condition) and is already a project dependency. slopcheck is N/A — zero new installs.

| Package | Registry | Disposition |
|---------|----------|-------------|
| (none) | — | No new dependencies — phase adds project source files only |

## Critical Correction — `csgs` ordinal semantics (resolves CONTEXT line 99 + D-15)

**This is the highest-value finding of the research.** The CONTEXT canonical-ref line 99 explicitly flags "verify `csgs`/`gs` prelude signatures empirically before wiring." Done — and the result contradicts D-15's literal text.

**Verified signatures (from `node_modules/sonic-weave/dist/stdlib/prelude.js`):**

```
fn gs(generators, size, period = niente, numPeriods = 1)
  "Stack a periodic array of generators up to the given size which must be a
   multiple of the number of periods."

fn csgs(generators, ordinal = 1, period = niente, numPeriods = 1, maxSize = 100)
  "Generate a constant structure generator sequence. Zero ordinal corresponds to
   the (trivial) stack of all generators while positive ordinals denote scales
   with constant structure ordered by increasing size."
```

**Runtime-verified behavior** (`evaluateSource(src).currentScale.length`):

| Call | Result | Notes |
|------|--------|-------|
| `gs([3/2], 7)` | **7 notes** → `9/8, 81/64, 729/512, 3/2, 27/16, 243/128, 2/1` | Literal Pythagorean diatonic — `size` IS the note count. Byte-identical to `rank2(3/2, 6, 0)`. |
| `csgs([3/2], 0)` | 2 notes (`3/2, 2/1`) | ordinal 0 = trivial stack |
| `csgs([3/2], 1)` | 3 notes | |
| `csgs([3/2], 2)` | 5 notes (Pythagorean pentatonic) | |
| `csgs([3/2], 3)` | **7 notes** (`9/8, 81/64, 729/512, 3/2, 27/16, 243/128, 2/1`) | **The true 7-note CS Pythagorean diatonic** |
| `csgs([3/2], 4)` | 12 notes | The next CS cardinality (chromatic) |
| `csgs([3/2], 7)` | **41 notes** — several intervals throw `"Denominator above safe limit"` | The literal D-15 default would **fail-close** in `scaleFromSonicWeave` (sonicweave.ts:155) and surface an error, NOT render a 7-note scale |

The CS cardinalities of the fifth-chain are exactly the classic MOS sizes `2, 3, 5, 7, 12, …` (the convergents of log₂(3/2)) — `ordinal` selects which one.

**Planner action items:**
1. The CS-widget default landing (D-15) MUST be **`csgs([3/2], 3)`** to produce the intended 7-note Pythagorean diatonic. (`gs([3/2], 7)` is an equivalent alternative but `csgs` is the CS-method anchor.)
2. The "ordinal field" (D-13) must be **labelled and documented as "ordinal" (CS-scale index), not "size/note count."** A short helper line is warranted because the semantics are non-obvious. Consider a tiny inline note: "Ordinal selects the Nth constant-structure scale by increasing size."
3. Cap the ordinal input low (e.g. ≤ ~6–8) — `csgs`'s own `maxSize = 100` will `throw "No constant structure found before reaching maximum size."` for pathological generator sets, and high ordinals produce huge scales whose intervals overflow the adapter's safe-integer guard. The adapter already fail-closes (D-16) but a UI cap prevents user confusion.

**`iv.toFraction()` round-trip confirmed:** for `csgs([3/2], 3)` every interval's `iv.toFraction()` returns `{ n, d, s }` with exact integer fields (`9/8`, `81/64`, `729/512`, `3/2`, `27/16`, `243/128`, `2/1`) — exactly the shape the adapter's R-01 round-trip (`new Interval(\`${f.n}/${f.d}\`)`) consumes. The adapter auto-prepends 1/1 (sonicweave.ts:169–174). `[VERIFIED: runtime probe]`

## Architecture Patterns

### System Architecture Diagram

```
                        ┌──────────────────────────────────────────────┐
   user picks method    │  generate.md (page — synth owner, Pattern 4)  │
   ────────────────────▶│   `method` reactive cell  ·  paramsHost swap  │
                        └───────────────┬──────────────────────────────┘
                                        │ mounts active widget into paramsHost
                                        ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  Active generator widget (Pattern-2 factory)                    │
        │   exposes getScale(): Scale | null  +  isTempered(): boolean    │
        │   NEW: generate-meru.ts, generate-cs.ts (Advanced optgroup)     │
        └───────────────┬───────────────────────────────────────────────┘
                        │ active widget's getScale() / isTempered()
                        ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  SHARED PREVIEW HOST (first cross-widget consumer — D-03/D-06)  │
        │                                                                 │
        │   scale-transform-strip.ts ──rotate/reduce/dedupe/transpose──▶  │
        │        (Scale methods, immutable)        transformedScale       │
        │              │                                  │               │
        │              ▼                                  ▼               │
        │   circle-of-pitches.ts (SVG ring)      transformed scaleTable   │
        │   markers at cents/period·2π            (ratio | cents+badge)   │
        │   click ──▶ synth.playNote(baseHz·ratio)                        │
        └───────────────┬───────────────────────────────────────────────┘
                        │ transformedScale (or raw if identity transform)
                        ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  Send-to serialization (generate.md)                            │
        │   ratioPerLine (exact JI)  XOR  centsPerLine (tempered)         │
        │        │                                                        │
        │        ▼                                                        │
        │   writeSharedScale(text, source)  +  encodeScaleToHash → #s=    │
        └───────────────────────────────────────────────────────────────┘

   NEW kernel: meru.ts  ── meruScale(a,b,x0,x1,terms) ▶ exact Scale (convergents)
                          metallicLimitCents(a,b)      ▶ irrational cents (tempered readout)
   NEW kernel helper: isConstantStructure(scale)       ▶ { cs, ambiguousAt? } (D-14/D-20)
```

### Recommended Project Structure (files this phase adds)
```
src/
├── lib/
│   ├── meru.ts                         # NEW — meruScale + metallicLimitCents (INVENTORY row)
│   ├── constant-structure.ts           # NEW — isConstantStructure helper (D-20; INVENTORY row)
│   │   (OR fold the CS helper into an existing module — planner's D-20 call)
│   └── __tests__/
│       ├── meru.test.ts                # NEW
│       └── constant-structure.test.ts  # NEW (if separate module)
├── components/
│   ├── circle-of-pitches.ts            # NEW (SURF-05)
│   ├── circle-of-pitches.css           # NEW (import into src/styles.css)
│   ├── scale-transform-strip.ts        # NEW (SURF-04)
│   ├── scale-transform-strip.css       # NEW
│   ├── generate-meru.ts                # NEW (GEN-10 Wilson)
│   ├── generate-meru.css               # NEW
│   ├── generate-cs.ts                  # NEW (GEN-10 constant-structure)
│   ├── generate-cs.css                 # NEW
│   └── __tests__/
│       ├── circle-of-pitches.test.ts
│       ├── scale-transform-strip.test.ts
│       ├── generate-meru.test.ts
│       └── generate-cs.test.ts
├── pages/generate.md                   # EDIT (append-only) — register 2 new methods + shared-preview wiring
├── styles.css                          # EDIT (append-only) — 4 new @import lines
└── lib/INVENTORY.md                    # EDIT — new "Quick 260608-dyv" rows
```

### Pattern 1: Plain-SVG ring (circle-of-pitches)
**What:** `createElementNS` SVG, one `<g>` marker per scale degree at angle `θ = iv.cents / period.cents · 2π`, faint 12-EDO ticks every 100¢, rim labels via `textContent`.
**When to use:** SURF-05. Directly clones `keyboard.ts`/`spiral-of-fifths.ts`.
**Example:** (synthesized from the two existing precedents — same idioms)
```typescript
// Source: pattern derived from src/components/spiral-of-fifths.ts + keyboard.ts (VERIFIED idioms)
const SVG_NS = "http://www.w3.org/2000/svg";
const TWO_PI = 2 * Math.PI;

export function circleOfPitches(
  scale: Scale,
  synth: SynthHandle,
  opts: { baseHz?: number; tempered?: boolean; radius?: number } = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "circle-of-pitches-widget";
  const baseHz = opts.baseHz ?? 440;
  const tempered = opts.tempered === true;

  // Empty-state (mirror lattice.ts:156–165): octave-only/empty → friendly <p>, not empty SVG.
  if (scale.intervals.length <= 1) {
    const empty = document.createElement("p");
    empty.className = "circle-of-pitches-empty";
    empty.textContent = "This scale has no interior degrees yet. Generate a scale to see its shape.";
    root.appendChild(empty);
    return root;
  }

  const R = opts.radius ?? 140;
  const periodCents = scale.period.cents; // angle denominator (D-02: non-octave equave aware)
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "viz circle-of-pitches");
  svg.setAttribute("viewBox", `${String(-R - 40)} ${String(-R - 40)} ${String(2 * (R + 40))} ${String(2 * (R + 40))}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // Faint 12-EDO reference ticks every 100¢ around the rim (D-02).
  for (let c = 0; c < periodCents; c += 100) {
    const a = (c / periodCents) * TWO_PI;
    const tick = document.createElementNS(SVG_NS, "line");
    tick.setAttribute("class", "circle-of-pitches__tick");
    tick.setAttribute("x1", String(R * Math.sin(a)));
    tick.setAttribute("y1", String(-R * Math.cos(a)));
    tick.setAttribute("x2", String((R + 8) * Math.sin(a)));
    tick.setAttribute("y2", String(-(R + 8) * Math.cos(a)));
    svg.appendChild(tick);
  }

  // One marker group per degree.
  scale.intervals.forEach((iv, i) => {
    const a = (iv.cents / periodCents) * TWO_PI;
    const x = R * Math.sin(a);
    const y = -R * Math.cos(a);
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "circle-of-pitches__node");
    g.setAttribute("transform", `translate(${String(x)},${String(y)})`);
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");

    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("class", "circle-of-pitches__dot");
    dot.setAttribute("r", "5");
    g.appendChild(dot);

    // D-01: rim label — ratio for exact JI, cents-only for tempered.
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "circle-of-pitches__label");
    label.setAttribute("x", String((R + 22) * Math.sin(a) - x));
    label.setAttribute("y", String(-(R + 22) * Math.cos(a) - y));
    label.setAttribute("text-anchor", "middle");
    label.textContent = tempered ? `${iv.cents.toFixed(1)}¢` : iv.fraction.toFraction();
    g.appendChild(label);

    // Hover tooltip (D-04) — mirror lattice.ts <title>.
    const dev = iv.centsFrom12tet;
    const sign = dev >= 0 ? "+" : "−";
    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = tempered
      ? `${iv.cents.toFixed(1)}¢ | ${sign}${Math.abs(dev).toFixed(1)}¢ from 12-TET`
      : `${iv.fraction.toFraction()} | ${sign}${Math.abs(dev).toFixed(1)}¢ from 12-TET`;
    g.appendChild(title);

    // Click → audition (keyboard.ts idiom). S-3 BigInt→Number audio boundary.
    const ratio = Number(iv.fraction.valueOf());
    g.addEventListener("click", () => synth.playNote(baseHz * ratio, 0.6));
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); synth.playNote(baseHz * ratio, 0.6); }
    });

    svg.appendChild(g);
  });

  root.appendChild(svg);
  return root;
}
```
Key gotcha: for tempered scales the click-audition still uses `Number(iv.fraction.valueOf())` because the adapter already stored a `centsToRatio`-derived Hz-faithful fraction (sonicweave.ts:143–153). The label is cents-only (D-01) but the *audio* ratio is correct — same split the `scale-table` tempered path uses (cents column for display, but `playScale` still sounds the right Hz).

### Pattern 2: Transform-strip orchestration (non-destructive overlay)
**What:** A Pattern-2 factory holding closure-local `{ mode, reduce, dedupe, transpose }` and a `setSource(scale: Scale)` + `getTransformedScale(): Scale` surface. On every control change it re-derives `transform(source)` and calls an `onChange(transformedScale)` callback the page wires to re-render the shared circle + transformed table + Send-to.
**When to use:** SURF-04.
**Composition order (matters):** rotate → reduce → dedupe → transpose, applied to the *raw source each time* (D-05 non-destructive). Re-derive from `source` on every render; never accumulate.
```typescript
// Source: composition over VERIFIED Scale methods (scale.ts:52–113)
function applyTransforms(source: Scale, t: TransformState): Scale {
  let s = source;
  if (t.mode !== 0) s = s.rotate(t.mode);   // rotate to Nth mode (degree index)
  if (t.reduce) s = s.reduce();             // period-aware (Pitfall #13)
  if (t.dedupe) s = s.dedupe();             // exact-rational equality, never cents-epsilon
  if (t.transpose) s = s.transpose(t.transpose); // Interval multiply-through
  return s;
}
```
Mode `<select>` (D-07): list `Mode 1 of N … Mode N of N` where N = `source.intervals.length`; rebuild the option list whenever `setSource` is called with a different-length scale. `Scale.rotate(0)` is identity (returns a copy — scale.ts:52–54), so "Mode 1 of N" = degree 0.

**Tempered survival (D-18):** `Scale` methods operate on `Interval.fraction` (BigInt). For a tempered scale the adapter stored each pitch as a `centsToRatio`-derived fraction — so `rotate`/`reduce`/`transpose` preserve the *Hz-faithful* fraction and the display layer's `tempered` flag (held at the component layer, not on `Scale`) just stays true through the transform. **The strip must carry the active widget's `isTempered()` alongside the scale** so the transformed table renders with the right badge + the Send-to branch picks `centsPerLine`. Confirmed: no kernel change needed (D-05 / code-context "no kernel change").

### Pattern 3: SonicWeave-wrapped CS widget (clone generate-fokker)
**What:** `generate-cs.ts` is structurally `generate-fokker.ts` minus the mode toggle: generator chips (ratios) + an ordinal `<input type="number">`, a `composeSource()` returning `` `csgs([${gens.join(", ")}], ${ordinal})` ``, `rebuild()` → `scaleFromSonicWeave(src)` → preserve-prior-preview-on-error (D-16), plus the D-14 CS-status readout computed from the *returned* `Scale` via the new `isConstantStructure` helper.
**When to use:** GEN-10 CS sub-method.
```typescript
// Source: pattern from generate-fokker.ts:490–508 (VERIFIED) + corrected csgs semantics
function composeSource(): string {
  const gens = generatorChips; // e.g. ["3/2"]
  if (gens.length === 0) { status.textContent = "Add at least one generator."; return null; }
  return `csgs([${gens.join(", ")}], ${String(ordinal)})`; // ordinal, NOT note count
}
function rebuild(): void {
  status.textContent = "";
  const src = composeSource();
  if (src === null) return;
  const result = scaleFromSonicWeave(src);   // { scale, tempered, error? }
  if (result.scale === null) { status.textContent = result.error ?? "Could not build."; return; } // D-16
  const { cs, ambiguousAt } = isConstantStructure(result.scale); // NEW helper (D-20)
  csReadout.textContent = cs ? "✓ constant structure" : `✗ not CS (ambiguous at ${fmt(ambiguousAt)})`;
  tableHost.replaceChildren(scaleTable(result.scale, baseHz, { precision, tempered: result.tempered }));
  playHost.replaceChildren(playScale(result.scale, synth, { baseHz }));
  currentScale = result.scale;
}
root.isTempered = () => /* result.tempered from last build */;
```
Note: `csgs` from rational generators is exact JI (every interval `isFractional()`), so `isTempered()` is normally false and Send-to serializes ratios. But a *float* generator (e.g. a cents value typed as `700.`) would make it tempered — keep the conditional branch like rank-2/sonicweave widgets (generate.md:359–363).

### Pattern 4: Wilson recurrence kernel (`meru.ts`)
**What:** Pure `(a, b, x0, x1, terms) => Scale` building exact successive-ratio convergents, plus a separate float `metallicLimitCents(a, b)`.
```typescript
// Source: hand-rolled per RESEARCH A-4 #15; numerically VERIFIED (see Code Examples)
export function meruScale(a: bigint, b: bigint, x0: bigint, x1: bigint, terms: number): Scale {
  if (terms < 1 || terms > MAX_MERU_TERMS) throw new RangeError(/* D-11 cap */);
  // defense-in-depth magnitude cap checked DURING the recurrence (terms grow ~φ^n)
  const seq: bigint[] = [x0, x1];
  for (let i = 2; i < terms + 1; i++) {
    const next = a * seq[i - 1]! + b * seq[i - 2]!;
    if (next > MAX_MERU_MAGNITUDE) throw new RangeError(/* D-11 magnitude cap */);
    seq.push(next);
  }
  // Successive ratios x_{n}/x_{n-1} as exact Intervals (BigInt n/d).
  const intervals: Interval[] = [];
  for (let i = 1; i < seq.length; i++) {
    intervals.push(new Interval(`${String(seq[i])}/${String(seq[i - 1])}`));
  }
  // D-19 discretion: octave-reduce convergents? Default to literal ratios (the recurrence
  // ratios ARE the Mt. Meru reading); the strip's "reduce" gives the user the reduced view.
  return new Scale(intervals /*, period? */);
}

export function metallicLimitCents(a: number, b: number): number {
  // Metallic mean limit = (a + sqrt(a^2 + 4b)) / 2  — irrational; cents-source (D-09).
  const lim = (a + Math.sqrt(a * a + 4 * b)) / 2;
  return 1200 * Math.log2(lim);
}
```

### Anti-Patterns to Avoid
- **Mutating widget internals from the strip/page (violates D-06 / Pattern-2 encapsulation).** The strip reads `getScale()` and renders into the *shared preview host*; it never reaches into the active widget's own table.
- **Treating `csgs`'s 2nd arg as note count (the D-15 trap).** It is an ordinal. Use `csgs([3/2], 3)` for 7 notes.
- **Appending the metallic limit as a scale degree (violates D-09 / SURF-06).** The limit is irrational → tempered cents readout *beside* the table, never in the convergent ratios.
- **Using cents-tolerance dedupe in the strip.** `Scale.dedupe`/`reduce` use exact BigInt equality (scale.ts:99–105, Pitfall #1/#6). Never reintroduce epsilon comparison.
- **`innerHTML` with any interpolated value.** All dynamic text via `createElement` + `textContent` (only static no-value `<th>` rows may use `innerHTML`, per scale-table.ts:63).
- **`new AudioContext()` at module load.** The circle receives the page-owned `synth` handle (Pitfall #2 / D-08).
- **High `csgs` ordinals.** ordinal ≥ ~5 produces large scales whose intervals overflow `Number.MAX_SAFE_INTEGER` in sonicweave's Number-backed Fraction → the adapter throws "Denominator above safe limit" and fail-closes. Cap the input.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mode rotation / period reduction / dedupe / transpose | Custom scale-transform pipeline | `Scale.rotate/reduce/dedupe/transpose` | All exist, immutable, tested (scale.ts); period-aware reduce; exact BigInt dedupe. Strip is orchestration only. |
| Constant-structure generation | Custom generator-sequence enumerator | `scaleFromSonicWeave("csgs([...], ordinal)")` | The prelude `csgs` is the documented, tested CS generator; the Phase-7 adapter already round-trips it to exact BigInt `Scale`. |
| SonicWeave→kernel boundary, error handling, R-01 | New adapter | `scaleFromSonicWeave` (Phase 7) | `{ scale, tempered, error? }` never throws; fail-closes on negative/zero/overflow; auto-prepends 1/1. |
| Tempered vs exact-JI table rendering | New table variant | `scaleTable(scale, baseHz, { tempered })` | Both paths shipped (Phase 6 D-01/D-02). |
| Click-audition release semantics | Custom Web Audio | `synth.playNote(hz, dur) => release` | The `SynthHandle` is the owned audio boundary; circle just calls it. |
| n/d ratio input | New input control | `makeRatioField` (mos-builder) | Proven; clampPositiveInt validated. |
| Chip input | New chip widget | `makeChipInput` (generate-fokker) | Cap + remove + `onListChanged` + XSS-safe textContent. |
| Hash/store serialization | New codec | `encodeScaleToHash` + `writeSharedScale` | Phase 5 plumbing; 8 KB cap; one-way data flow. |

**Key insight:** SURF-04 is "cheap polish precisely because the methods exist" (CONTEXT D-05/code-context). The only genuinely new *math* this phase is `meru.ts` (a trivial recurrence) and a ~25-line CS-check helper. Everything else is wiring.

## Runtime State Inventory

> Not a rename/refactor/migration phase. Section omitted — this is additive feature work with no stored data, live-service config, OS-registered state, secrets, or build-artifact migration concerns. **None — verified: the phase adds new files + append-only edits to `generate.md`/`styles.css`/`INVENTORY.md`; no existing string keys, schema, or registered state are touched.**

## Common Pitfalls

### Pitfall 1: `csgs` ordinal misread as note count
**What goes wrong:** Wiring `csgs([3/2], 7)` expecting 7 notes; getting 41 (and an adapter error from safe-integer overflow).
**Why it happens:** D-15 phrases the anchor as `csgs([3/2], 7)`; the prelude doc says "ordinal," not "size."
**How to avoid:** Default to `csgs([3/2], 3)`; label the UI field "ordinal"; cap it low.
**Warning signs:** CS widget shows far more notes than expected, or the status region shows "Denominator above safe limit."

### Pitfall 2: Transformed-scale tempered flag lost on Send-to
**What goes wrong:** A tempered scale transformed via the strip serializes as ratios (laundered JI) — violates SURF-06.
**Why it happens:** `tempered` lives at the component layer, never on `Scale` (Phase-6 D-03). If the strip drops it, the page's `ratioPerLine` vs `centsPerLine` branch picks wrong.
**How to avoid:** The strip must propagate `isTempered()` alongside the transformed `Scale`; the page's Send-to branch keys on that flag (existing `centsPerLine`/`ratioPerLine` helpers, generate.md:344–356).
**Warning signs:** A tempered scale's Send-to text contains `/` ratios instead of `.`-bearing cents lines.

### Pitfall 3: Circle angle wrong for non-octave equaves
**What goes wrong:** Markers compress/overflow when the period is 3/1 (Bohlen-Pierce) because angle was divided by a hard-coded 1200¢.
**Why it happens:** Assuming a 2/1 octave.
**How to avoid:** `θ = iv.cents / scale.period.cents · 2π` (D-02). The 100¢ ticks still place by absolute cents but their "12-EDO" meaning is reduced for non-octave equaves (CONTEXT D-02 acknowledges this; default shows them anyway).
**Warning signs:** A tritave scale's last marker sits before 12 o'clock or wraps past it.

### Pitfall 4: Metallic limit folded into the scale
**What goes wrong:** Appending φ as a degree → mixes irrational into exact-rational scale, breaks BigInt exactness + SURF-06.
**How to avoid:** `metallicLimitCents` returns a float displayed as a *separate tempered-flagged readout* (D-09).
**Warning signs:** A Wilson scale's `getScale()` contains an interval whose `.fraction` is a float-derived approximation.

### Pitfall 5: Meru recurrence overflow / runaway
**What goes wrong:** Large `terms` (φ-rate growth) or huge seeds blow up BigInt magnitude / DOM.
**How to avoid:** Cap `terms` and `magnitude` BEFORE/DURING enumeration → RangeError surfaced in status (Phase-6 D-14 / D-11). BigInt won't lose precision but a 200-term Fibonacci ratio is musically meaningless and slow to render.
**Warning signs:** Sluggish render, enormous ratio labels.

### Pitfall 6: Shared-preview reactivity (first cross-widget consumer)
**What goes wrong:** The shared circle/strip don't update when the active widget's internal params change, because widget-internal edits don't tick Observable's reactive graph (documented in generate.md:283–296 "live-read" rationale).
**Why it happens:** Prior widgets rendered self-contained tables; this is the FIRST consumer reading another widget's `getScale()` reactively.
**How to avoid:** Confirm the `generate.md` wiring re-reads `activeWidget.getScale()` at the right reactive boundary. Two viable approaches: (a) the active widget exposes an `onScaleChange(cb)` subscription the page binds to re-render the shared preview; or (b) the page reads `getScale()` inside a cell that already depends on `method`/`baseHz` and the strip re-renders on its own control events. **This is the one genuinely novel wiring problem — flag for careful planning + a manual-verify step.** (See Open Questions Q1.)
**Warning signs:** Editing a CPS chip updates the widget's own table but not the shared circle.

## Code Examples

### Verify `csgs`/`gs`/CS via the installed evaluator
```javascript
// Source: runtime probe against node_modules/sonic-weave@0.14.1 [VERIFIED: this session]
import { evaluateSource } from "sonic-weave";
evaluateSource("csgs([3/2], 3)").currentScale
  .map(iv => iv.toFraction());          // {n,d,s}: 9/8, 81/64, 729/512, 3/2, 27/16, 243/128, 2/1
evaluateSource("gs([3/2], 7)").currentScale.length;   // 7 (literal size)
evaluateSource("csgs([3/2], 7)").currentScale.length; // 41 (ordinal 7!) — DO NOT use as default
```

### Wilson / metallic numerical verification
```javascript
// Source: node -e probe [VERIFIED: this session]
// Fibonacci (a=1,b=1, seeds 1,1) successive ratios:
//   2/1, 3/2, 5/3, 8/5, 13/8, 21/13, 34/21, 55/34   (EXACT BigInt)
// cents:  1200, 702.0, 884.4, 813.7, 840.5, 830.3, 834.2, 832.7  → converge to φ
// Metallic limits (a + sqrt(a^2+4b))/2 → cents:
//   golden  (1,1): 1.618034 → 833.09¢   ✓ matches D-09/D-12
//   silver  (2,1): 2.414214 → 1525.86¢  (>1 octave — see D-19 octave-reduce note)
//   bronze  (3,1): 3.302776 → 2068.41¢  (>1 octave)
```
**D-19 note:** silver/bronze limits exceed an octave. If the readout shows the *reduced* limit (e.g. silver 1525.86 − 1200 = 325.86¢) it's more musically legible, but the literal metallic mean is the citable value. Recommend showing the literal cents with the raw mean (e.g. "silver ≈ 2.4142 → 1525.9¢") and letting the strip's reduce handle the scale itself. `[ASSUMED — D-19 discretion; planner/user confirms]`

### Scale transform composition (exact-equality dedupe)
```typescript
// Source: src/lib/scale.ts:52–113 [VERIFIED]
const m3 = scale.rotate(3);          // 4th mode (degree index 3), starts on 1/1, sorted
const r = scale.reduce();            // period-aware, ends on period (Pitfall #13)
const d = scale.dedupe();            // exact BigInt equality (NOT cents-epsilon)
const t = scale.transpose(new Interval("3/2")); // multiplies every interval + period
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Each generator widget renders its own self-contained table | Shared preview host reads active widget's `getScale()` | This phase (first consumer) | Circle + strip mount once and apply to all families |
| (D-15 belief) `csgs(gens, n)` makes an n-note scale | `csgs(gens, ordinal)` selects the ordinal-th CS scale by size; `gs(gens, size)` is literal size | Empirically corrected this phase | Default must be `csgs([3/2], 3)` |

**Deprecated/outdated:** nothing new; the Phase-7 `npm:`-vs-bare `sonic-weave` import resolution (patch-package `default` export) is already solved (sonicweave.ts:45–66) — `generate-cs.ts` inherits it transitively via `scaleFromSonicWeave` and never imports `sonic-weave` directly.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Default Meru octave-reduce behavior + silver/bronze limit display format | Code Examples / D-19 | Cosmetic; user-confirmable. Convergents are exact either way. |
| A2 | CS-status "ambiguous at X" phrasing + exact `isConstantStructure` return shape | Pattern 3 / D-20 | Low — the algorithm (subtension uniqueness) is verified; only the surfaced wording/detail is open. |
| A3 | Wilson Mt. Meru *seed-pair* preset roster beyond golden/silver/bronze | D-10/D-19 | Medium — each preset must cite an Erv Wilson / anaphoria.com source (Vallotti-precedent discipline). Planner/researcher must source exact seed pairs before locking presets. The metallic family (golden/silver/bronze via (a,b)=(1,1)/(2,1)/(3,1)) is well-attested; named *Meru* seed variants need citation. |
| A4 | Shared-preview reactive wiring approach (subscription vs page-cell read) | Pitfall 6 / Q1 | Medium — affects strip/circle update correctness; needs a manual-verify step. |

## Open Questions

1. **How does `generate.md` expose the active widget's scale reactively to the shared circle + strip? (the first cross-widget consumer)**
   - What we know: widgets expose `getScale()`/`isTempered()`; widget-internal edits do NOT tick Observable's reactive graph (generate.md:283 live-read rationale); the page currently re-reads at click time for Send-to.
   - What's unclear: the cleanest reactive trigger so the *shared* circle/strip re-render on widget-internal param edits (not just on `method`/`baseHz` change).
   - Recommendation: have each active widget accept an optional `onScaleChange?: (scale, tempered) => void` callback (additive to the Pattern-2 factory) that the page binds to a `Mutable` driving the shared preview; OR the strip owns its own re-render and the page re-reads `getScale()` whenever the strip fires. Plan a manual-verify task: "edit a CPS chip → shared circle updates."

2. **D-20: separate `constant-structure.ts` module vs folding `isConstantStructure` into an existing kernel file?**
   - Recommendation: a small dedicated `src/lib/constant-structure.ts` with one INVENTORY row keeps it discoverable and testable; the algorithm is the exact-BigInt subtension-uniqueness check (port of `tools.js:188–232` onto our `Interval` monzo/fraction). Return `{ cs: boolean; ambiguousAt?: { intervalClassA: number; intervalClassB: number } }` so the readout can say which classes collide.

3. **D-19: octave-reduce Meru convergents by default, or leave literal?**
   - Recommendation: leave literal (the recurrence ratios ARE the Mt. Meru reading, e.g. 3/2, 5/3, 8/5 span multiple registers); the user gets the reduced view for free via the transform strip's "reduce." Set `Scale` period thoughtfully (the last convergent, or 2/1 if reducing) — confirm against the `Scale` constructor's period rule (last interval; must be > 1/1, scale.ts:41).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `sonic-weave` | CS widget (`csgs`/`gs`) | ✓ | 0.14.1 | — (no fallback needed; already patched + used by Phase 7) |
| `fraction.js` (BigInt) | `meru.ts` exact convergents via `Interval` | ✓ | 5.3.4 | — |
| Node 20+ / Vitest / happy-dom | unit tests | ✓ | (project standard) | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

> `workflow.nyquist_validation` not explicitly false in config → section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (+ happy-dom for component DOM tests) |
| Config file | project Vitest config (aliases `npm:` specifiers back to local installs — see lattice.ts:30) |
| Quick run command | `npx vitest run <path/to/test>` |
| Full suite command | `npx vitest run` (existing ~192-test suite must stay green) + `npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SURF-05 | Circle factory returns `<svg>`; N markers == scale length | unit | `npx vitest run src/components/__tests__/circle-of-pitches.test.ts` | ❌ Wave 0 |
| SURF-05 | Rim labels via `textContent` (never innerHTML); ratio for JI, cents for tempered | unit | same | ❌ Wave 0 |
| SURF-05 | Clicking a marker calls `synth.playNote` (stub synth) | unit | same | ❌ Wave 0 |
| SURF-05 | Octave-only/empty scale → empty-state `<p>`, not empty SVG | unit | same | ❌ Wave 0 |
| SURF-04 | "Rotate to mode N" → transformed scale equals `source.rotate(N)` | unit | `npx vitest run src/components/__tests__/scale-transform-strip.test.ts` | ❌ Wave 0 |
| SURF-04 | reduce/dedupe/transpose compose; re-derived from raw source each render | unit | same | ❌ Wave 0 |
| SURF-04 | Transformed scale is what Send-to serializes (assert the payload changes when mode changes) | integration | same / generate.md test | ❌ Wave 0 |
| SURF-04 | Tempered scale stays cents-only + badged through transforms | unit | same | ❌ Wave 0 |
| GEN-10 | `meruScale(1,1,1,1,7)` → exact convergents incl. 3/2, 5/3, 8/5, 13/8 (BigInt `iv.equals`) | unit | `npx vitest run src/lib/__tests__/meru.test.ts` | ❌ Wave 0 |
| GEN-10 | `metallicLimitCents(1,1)` ≈ 833.09¢ (tempered cents-source) | unit | same | ❌ Wave 0 |
| GEN-10 | `meruScale` term-count + magnitude caps → RangeError | unit | same | ❌ Wave 0 |
| GEN-10 | `csgs([3/2], 3)` via adapter → 8-interval (1/1 + 7) exact-JI CS scale; marker count matches | unit | `npx vitest run src/components/__tests__/generate-cs.test.ts` | ❌ Wave 0 |
| GEN-10 | `isConstantStructure` true for Pythagorean diatonic; false (+ ambiguousAt) for a known non-CS scale | unit | `npx vitest run src/lib/__tests__/constant-structure.test.ts` | ❌ Wave 0 |
| GEN-10 | CS widget surfaces adapter error in status + preserves prior preview (D-16) | unit | `generate-cs.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run <the-task's-test-file>`
- **Per wave merge:** `npx vitest run` (full suite) + `npm run build`
- **Phase gate:** Full suite green (anti-regression: ~192 existing tests stay green) + build green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/components/__tests__/circle-of-pitches.test.ts` — covers SURF-05
- [ ] `src/components/__tests__/scale-transform-strip.test.ts` — covers SURF-04
- [ ] `src/lib/__tests__/meru.test.ts` — covers GEN-10 Wilson
- [ ] `src/lib/__tests__/constant-structure.test.ts` — covers GEN-10 CS-check helper
- [ ] `src/components/__tests__/generate-cs.test.ts` — covers GEN-10 CS widget
- [ ] `src/components/__tests__/generate-meru.test.ts` — covers GEN-10 Wilson widget
- [ ] Framework install: none — Vitest + happy-dom already configured

## Security Domain

> `security_enforcement` not explicitly false → section included. This is a low-surface front-end feature phase (no network, no auth, no persistence beyond the existing 8 KB-capped localStorage store).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | static site, no auth |
| V3 Session Management | no | none |
| V4 Access Control | no | none |
| V5 Input Validation | yes | Generator chips / ordinal / seeds / coefficients validated as positive ints / `n/d` BEFORE use (the `parseRatio`/`parsePositiveInt` idiom, generate-fokker.ts:87–113); defense-in-depth caps (D-11) → RangeError, never crash |
| V6 Cryptography | no | none |

### Known Threat Patterns for {Observable Framework SVG + SonicWeave eval}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via injected label/chip text | Tampering | `createElement` + `textContent` only; never `innerHTML` with interpolated values (scale-table.ts:85, generate-fokker.ts:324). Circle labels + CS chips follow this. |
| Code injection via SonicWeave source | Tampering / Elevation | The CS widget composes `csgs([...], n)` from *validated* `n/d` chips + an integer ordinal — no free-text reaches `evaluateSource`. The free-text path (GEN-09) is a different widget; CS never exposes raw SonicWeave (D-13). 8 KB input cap enforced in `scaleFromSonicWeave` (sonicweave.ts:94). |
| DoS via huge scale (recurrence / high ordinal) | DoS | Meru term-count + magnitude caps (D-11); `csgs` ordinal UI cap + its own `maxSize=100` throw; adapter fail-closes on safe-integer overflow. |
| Stuck audio voice on circle click | Availability | `synth.playNote` returns a release; circle uses fixed-duration notes (keyboard.ts:40 precedent); page-owned `panic()`/Esc already bound. |

## Sources

### Primary (HIGH confidence)
- `node_modules/sonic-weave@0.14.1/dist/stdlib/prelude.js` — exact `csgs`/`gs` signatures + docstrings `[VERIFIED: installed dist]`
- `node_modules/sonic-weave@0.14.1/dist/tools.js:188–232` — `hasConstantStructure(monzos)` algorithm (subtension uniqueness) `[VERIFIED: installed dist]`
- `node_modules/sonic-weave@0.14.1/dist/stdlib/builtin/index.js:1238–1257` — `hasConstantStructure(scale)` builtin `[VERIFIED: installed dist]`
- Runtime probe via `evaluateSource` — `csgs`/`gs` note counts + `toFraction()` shapes `[VERIFIED: this session]`
- Numerical probe — Fibonacci convergents + metallic-mean cents (φ=833.09¢) `[VERIFIED: this session]`
- `src/lib/scale.ts`, `src/lib/interval.ts`, `src/lib/sonicweave.ts` — kernel contracts `[VERIFIED: source]`
- `src/components/spiral-of-fifths.ts`, `keyboard.ts`, `lattice.ts`, `scale-table.ts`, `generate-fokker.ts`, `generate-cps.ts`, `mos-builder.ts` — component idioms `[VERIFIED: source]`
- `src/pages/generate.md`, `src/state/scale-store.ts`, `src/lib/url.ts` — page wiring + Send-to plumbing `[VERIFIED: source]`

### Secondary (MEDIUM confidence)
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-RESEARCH.md` A-4 #15, A-5 — Wilson/metallic + CS design intent `[CITED: milestone research]`
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-PLAN.md` TRANCHE 3 (lines 570–660) — task blueprint `[CITED: milestone plan]`
- Erv Wilson Mt. Meru / metallic-ratio archives — `anaphoria.com` (preset citations; researcher must pull exact seed pairs) `[CITED: en.xen.wiki, anaphoria.com — per milestone RESEARCH]`

### Tertiary (LOW confidence)
- Silver/bronze octave-reduce display preference — `[ASSUMED]`, A1.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing, source-verified; zero new deps
- `csgs`/`gs`/CS semantics: HIGH — runtime-verified against installed dist; corrected D-15
- Wilson/metallic math: HIGH — convergents + φ cents numerically verified
- Circle/strip patterns: HIGH — direct clones of source-verified precedents
- Shared-preview reactive wiring (Q1): MEDIUM — novel, needs a planned manual-verify step
- Meru preset roster citations (A3): MEDIUM — golden/silver/bronze attested; named Meru seeds need sourcing

**Research date:** 2026-06-12
**Valid until:** ~2026-07-12 (stable — pinned local deps; the only volatility is the discretion items D-19/D-20)
