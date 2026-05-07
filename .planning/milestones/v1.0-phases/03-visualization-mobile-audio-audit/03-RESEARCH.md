# Phase 3: Visualization + Mobile Audio Audit — Research

**Researched:** 2026-05-05
**Domain:** SVG visualization (D3 + ji-lattice), Scala `.kbm` I/O, mobile Safari Web Audio
**Confidence:** HIGH (stack + ji-lattice API verified by reading installed source; .kbm format triangulated across 3 independent sources; iOS audio quirks resolved by 2026-current Audio Session API)

## Summary

Phase 3 layers a visualization surface onto an existing JI math kernel and audio path that already work end-to-end. The technical decisions are mostly already locked by `CLAUDE.md` and the approved `03-UI-SPEC.md`; the open work is in three concrete domains: (1) wiring `ji-lattice@0.3.2` (which produces SVG-ready coordinates and edges, not a renderer) into a D3-rendered SVG with `d3.zoom()` for pan/zoom; (2) writing a custom `.kbm` parser/serializer because no maintained npm package exists, with three named fields (`referenceKey`, `referenceHz`, `middleNote`) per Pitfall #7; (3) closing the long-deferred mobile Safari audio audit, which now has a current-as-of-iOS-17 fix (`navigator.audioSession.type = 'playback'`) for the hardware-mute-switch quirk on top of the long-known synchronous-`ctx.resume()` pattern.

The riskiest finding is that **d3 is not yet installed** in the project — `package.json` lists `ji-lattice`, `sw-synth`, `xen-dev-utils`, etc., but not `d3`. Phase 3's first plan should add it. Beyond that, the plan-phase has unusually low ambiguity here because Phase 1 + 2 established strong conventions (factory components, three-layer separation, `R-01` ESLint rule, `npm:` prefix for sw-synth, per-page `style:` frontmatter for CSS) that this phase inherits verbatim.

**Primary recommendation:** Build the three viz widgets as DOM-factory modules wrapping `ji-lattice`'s coordinate output with D3 v7 SVG rendering + `d3.zoom()` for pan/zoom; write `kbm.ts` as a sibling of `scala.ts` with a hand-laid line-by-line parser keyed on the canonical 7-field Scala spec; refactor `synth.ts` in place to add `audioSession.type = 'playback'`, synchronous `ctx.resume()` in user-gesture handlers, and `visibilitychange` listener.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Visualization Layout**
- **D-01:** All three viz widgets ship on the dashboard (`src/index.md`) below the existing audio + scl-io strip. No new theory pages in Phase 3. Widgets are factories; future pages may embed them.
- **D-02:** Full-bleed vertical stack. Each viz renders at full readable size. No collapsible / two-column layouts.

**Scale-on-Keyboard (VIZ-03)**
- **D-03:** Linear-by-degree mapping — N scale degrees → N adjacent white keys. Period boundary visually marked. NOT MIDI-anchored — `.kbm` semantics live in the kbm module + audio path, not in this widget.
- **D-04:** Keys are play buttons. Click key N → audition `scale.intervals[N]`. Same audition path as lattice/diamond.

**Lattice + Tonality Diamond (VIZ-01, VIZ-02)**
- **D-05:** Configurable scope via `opts.showContext: 'none' | 'neighbors' | 'full'`. Both lattice and diamond accept this opt. Default on dashboard = `'neighbors'`.
- **D-06:** Pan/zoom + click-to-audition. D3 zoom (mouse wheel + drag); click any node / cell triggers playback. Pure-static SVG and pan/zoom-only modes are NOT exposed in Phase 3.
- **D-07:** Click audition mode = configurable via `opts.audition: 'note' | 'dyad'`. Default on dashboard = `'dyad'`.

**Component Contract**
- **D-08:** All three viz widgets take `synth` as a REQUIRED arg. Signatures:
  - `lattice(scale: Scale, synth: SynthHandle, opts?: LatticeOpts): HTMLElement`
  - `tonalityDiamond(scale: Scale, synth: SynthHandle, opts?: DiamondOpts): HTMLElement`
  - `keyboard(scale: Scale, synth: SynthHandle, baseHz: number, opts?: KeyboardOpts): HTMLElement`

**.kbm I/O (IO-03)**
- **D-09:** New module `src/lib/kbm.ts` owns `parseKbm`, `writeKbm`, `kbmToFrequencies`, and `KbmMapping` type. `scala.ts` stays scl-only.
- **D-10:** `KbmMapping` keeps three named fields per Pitfall #7: `referenceKey`, `referenceHz`, `middleNote`. NEVER a single `baseHz`. Plus: `formalOctave`, `firstKey`, `lastKey`, `size`, optional per-degree key map.
- **D-11:** Combined `sclIo` widget handles both formats. One import button auto-detects format by extension; export shows two buttons (`Download .scl`, `Download .kbm`). One shared status region.
- **D-12:** Default `.kbm` fields when only Scale + baseHz are present: `middleNote = 69`, `referenceKey = 69`, `referenceHz = baseHz`, `formalOctave = scale.intervals.length`, `firstKey = 0`, `lastKey = 127`.
- **D-13:** Imported `.kbm` applies to playback by default, with a "Use baseHz instead" override toggle (defaults OFF). Effective-ref-Hz threads through every audition path.

**Mobile Audit (AUDIO-06)**
- **D-14:** Full sweep — verify + audio-layer fixes + responsive UX pass.
- **D-15:** Audio-layer fixes: synchronous `ctx.resume()` in user-gesture click handlers (no `await` between gesture and resume); `webkitAudioContext` fallback at AudioContext construction; `visibilitychange` listener (resume on `'visible'`); page-level Stop-all + Esc keyboard shortcut → `synth.panic()`.
- **D-16:** "Stop all audio" UX: floating top-right button + Esc keydown listener. Visible only when `synth.activeVoices > 0`. Esc binding lives in synth cell with `invalidation.then(remove)` cleanup. Touch-target ≥ 44×44 px.
- **D-17:** Responsive layout: single-column, full-width on narrow screens; 12–16 px viewport padding; `preserveAspectRatio="xMidYMid meet"` on viz SVGs; `font-size: 16px` minimum on inputs (suppresses iOS auto-zoom); no horizontal overflow at any width ≥ 320 px.
- **D-18:** Verification target = Safari macOS Responsive Design Mode. RDM does NOT reproduce iOS autoplay-policy nuances or hardware-mute-switch — both documented in `mobile-audit.md`.

### Claude's Discretion

- **D-19:** Default lattice basis auto-derived: union of primes appearing with nonzero exponent in any monzo, minus prime 2. 1 prime → 1D; 2 → 2D; 3 → 2D projected via `ji-lattice` default; >3 → top-2-by-frequency primes; flag remaining via console. Override via `opts.basis: number[]`.
- **D-20:** Default tonality-diamond odd-limit auto-derived: `ceil(max(oddLimit(i) for i in scale.intervals))` rounded UP to nearest of {7, 9, 11, 13, 15, 21, 31}. Override via `opts.oddLimit: number`.
- **D-21:** Lattice node visual: filled when in-scale; outlined-only when neighbor. Ratio label inside; cents-from-12tet label below with sign. Color encodes prime axis (3=blue, 5=green, 7=orange — refine to WCAG AA in implementation).
- **D-22:** Diamond cell visual: in-scale cells filled by prime-axis color; out-of-scale outlined-only. Hover tooltip shows `ratio | cents | prime-limit | in-scale?` via D3 `<title>`.
- **D-23:** Keyboard widget visual: white-key strip, period boundary marker between degree-N and degree-N+1. Cents-from-12tet labels above each key with sign. Active-press visual feedback tied to synth note-on/note-off.
- **D-24:** kbm-aware playback path: when override OFF, `effectiveBaseHz = kbm.referenceHz × 2^((kbm.middleNote − kbm.referenceKey) / 12)`. The mapping function `kbmToFrequencies(scale, kbm): Map<midiNote, Hz>` lives in `src/lib/kbm.ts` (pure; testable). Audio panel + lattice/diamond/keyboard click handlers all read the single derived value.
- **D-25:** Component CSS colocated per existing convention (`src/components/lattice.css`, etc.). No new global styles in `styles.css` beyond the floating Stop button + responsive viewport rules.

### Deferred Ideas (OUT OF SCOPE)

- Theory pages dedicated to lattice / tonality-diamond — D-01 keeps everything on dashboard; future phase.
- Anchored-to-MIDI keyboard view — D-03 chose linear-by-degree only; future phase.
- 3D lattice / Three.js — v2+ per CLAUDE.md "What NOT to Use" + TEMP-06.
- Physical iPhone device testing — D-18 picked Safari RDM only with documented limitation.
- Persistent scale state (URL hash / localStorage) — Phase 4 (ANAL-04).
- EDO ↔ JI mapping, MOS construction, scale comparison — Phase 4 (ANAL-01..03).
- `temperaments` — still deferred (peer-dep mismatch).
- `harmonic-entropy` — still deferred (out of scope for Phase 3).
- Static-SVG / pan-zoom-only viz modes — D-06 locked full interactivity.
- Twin sclIo + separate kbmIo widgets — D-11 chose combined.
- Always-visible Stop button — D-16 visible only when `activeVoices > 0`.
- Forced kbm-applies-to-playback (no override) — D-13 added the toggle.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIZ-01 | Lattice rendering (D3 + `ji-lattice`) with configurable prime basis | "ji-lattice API surface" + "Pattern: D3 zoom on SVG" sections; lattice basis derivation in Pitfall #5 (oddLimit/primeLimit reuse) |
| VIZ-02 | Tonality diamond with configurable odd-limit | "Tonality Diamond construction" section — hand-laid (no ji-lattice helper for it) |
| VIZ-03 | Scale-on-keyboard SVG view | "Piano-keyboard SVG layout" section; period boundary marker per D-23 |
| IO-03 | Parse and serialize `.kbm` keyboard mappings | ".kbm format spec" section — 7-field line-order canonical + `referenceKey ≠ middleNote` round-trip golden test |
| AUDIO-06 | Mobile Safari audio verified working | "Mobile Safari Web Audio quirks (2025–2026)" section + Audio Session API |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Lattice coordinate computation | `src/lib/` (or inside component if too tightly D3-coupled) | — | Pure data: `ji-lattice` produces `{vertices, edges}` from monzos; no DOM. Recommendation: keep coordinate computation inline in `lattice.ts` since it's a thin wrapper, but the basis-derivation helper (`deriveBasis(scale)`) could go in `src/lib/lattice-helpers.ts` if reused by tests |
| Tonality-diamond cell enumeration | `src/lib/` | — | Pure: enumerate odd `i, j ∈ [1, oddLimit]`, octave-reduce. Belongs near `monzo.ts`/`scale.ts` so it's testable without DOM. Recommendation: `src/lib/diamond.ts` with `enumerateDiamond(oddLimit): {ratio: Interval, in: boolean[]}[]` taking the scale separately |
| `.kbm` parse/serialize | `src/lib/kbm.ts` (NEW) | — | Pure data per D-09. No DOM. Sibling of `scala.ts`. |
| `kbmToFrequencies(scale, kbm)` | `src/lib/kbm.ts` | — | Pure math. Returns `Map<midiNote, Hz>`. Pitfall #7 — three named fields, never `baseHz` alone. |
| SVG rendering + D3 zoom | `src/components/` | — | DOM factories. Imports `d3` directly; imports types from `src/lib/`. No audio-context allocation. |
| Click-to-audition handlers | `src/components/` | `src/audio/` (via SynthHandle) | Components own click handlers; synth handle provided by caller (D-08). |
| Mobile audio resume + visibilitychange | `src/audio/synth.ts` | — | AudioContext lifecycle is the audio module's responsibility (Pattern 4). Page cell binds Esc; synth cell binds visibilitychange. |
| Floating Stop button + Esc shortcut | `src/index.md` (page-level cell) | `src/audio/synth.ts` (panic, activeVoices) | Per Pitfall #11: Esc listener bound in synth cell so it doesn't re-bind on every scale edit. |
| "Use baseHz instead" toggle + effective-ref-Hz derivation | `src/index.md` (reactive cell) | `src/lib/kbm.ts` (`kbmToFrequencies`) | Reactive coupling lives in markdown; pure derivation lives in `lib`. |
| Responsive CSS + viewport rules | `src/styles.css` + per-component CSS | — | Global rules in `styles.css` (input font-size 16px; floating Stop button); per-widget CSS colocated per D-25. |

**Sanity check:** No browser-tier work (no service worker, no IndexedDB), no API tier (static site). Three-layer discipline is preserved end-to-end: kernel (`src/lib/`) has zero DOM/audio imports; components have zero `AudioContext` allocations; audio has zero kernel imports.

## Standard Stack

### Core (already installed; verified via `npm view` + `node_modules/`)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ji-lattice` | `^0.3.2` (installed; published Apr 2026) | 2D lattice coordinate computation — `spanLattice(monzos, options)` returns `{vertices, edges}` for SVG rendering | The xenharmonic-devs ecosystem's official coordinate library. Author also maintains `xen-dev-utils` and `sw-synth`. Pure coordinate output (not a renderer) — pairs cleanly with D3. `[VERIFIED: node_modules/ji-lattice/dist/index.d.ts]` |
| `xen-dev-utils` | `^0.13.1` (already installed) | `toMonzo`, `LOG_PRIMES`, `dot`, `mmod`, `monzosEqual`, `sub` — used by ji-lattice internally; we reuse for our own monzo work | Already in stack. ji-lattice 0.3.2 has peer-dep `^0.12.2`; CLAUDE.md confirms 0.13 line satisfies it. `[VERIFIED: package.json + ji-lattice/package.json]` |
| `fraction.js` | `5.3.4` (exact pin) | BigInt rationals for kbm reference-Hz arithmetic + diamond cell ratios | Already locked by Phase 1 D-17. R-01 enforced via ESLint. `[VERIFIED: package.json]` |
| `sw-synth` | `^0.4.0` | Audio engine | Already locked. Phase 3 only modifies the wrapper (`src/audio/synth.ts`), not sw-synth itself. `[VERIFIED: package.json]` |
| `@observablehq/framework` | `1.13.4` (exact pin) | Reactive runtime, `Inputs`, `view()`, `invalidation`, `Mutable` | Already locked. `[VERIFIED: package.json]` |

### Supporting (Phase 3 ADDS)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `d3` | `7.9.0` (latest stable; verified via `npm view d3 version`) | SVG rendering, `d3-zoom` for pan/zoom, `d3-selection` | **NOT YET INSTALLED.** Phase 3 plan must add `npm install --save d3@7.9.0` and `npm install --save-dev @types/d3`. Used by all three viz components. `[VERIFIED: npm view 2026-05-05 returned 7.9.0]` |
| `@types/d3` | `^7.4.x` | TypeScript types | Required because Phase 1 D-16 enables `strict` + `noUncheckedIndexedAccess`. Without types, every `d3.select()` becomes `any` and trips ESLint. `[ASSUMED: standard companion to d3 in TS projects]` |

**Installation command (verified versions):**
```bash
npm install --save d3@7.9.0
npm install --save-dev @types/d3
```

**Version verification done 2026-05-05:**
- `ji-lattice@0.3.2` — published 4 weeks ago, 88.2 kB unpacked, MIT, 1 dep (`xen-dev-utils@^0.12.2`). `[VERIFIED: npm view ji-lattice]`
- `d3@7.9.0` — current major. `[VERIFIED: npm view d3 version]`

### NOT to be Added in Phase 3

| Library | Why Excluded |
|---------|-------------|
| `@observablehq/plot` | Already ships with Framework (preinstalled). Available if the planner decides to use Plot instead of hand-laid SVG for the keyboard widget — but UI-SPEC commits to D3+SVG for all three. Plot fallback is documented in CONTEXT.md as "if SVG-by-hand becomes burdensome" but should not be invoked in v1. |
| `Three.js` | Banned by CLAUDE.md "What NOT to Use" — overkill for 2D; reserved for v2+ TEMP-06. |
| `temperaments` | Peer-dep mismatch (depends on old xen-dev-utils API). Not needed for Phase 3 features. |
| Vega-Lite | Banned by CLAUDE.md — non-idiomatic in Framework. |
| Any kbm parser package | None maintained. CLAUDE.md "Custom `scl-kbm` module — write it" — confirmed by 2026-05-05 search. `[VERIFIED: WebSearch + Sevish + libscala-file source]` |

## Architecture Patterns

### System Architecture Diagram

```
                                    ┌─────────────────────────────┐
                                    │  src/index.md (Markdown +   │
                                    │  reactive cells)            │
                                    │                              │
                                    │  ┌─────────────────────┐    │
                                    │  │ scaleText (textarea)│────┼──► parseScala() ──► Scale
                                    │  └─────────────────────┘    │
                                    │  ┌─────────────────────┐    │
                                    │  │ baseHz (number)     │    │
                                    │  └────────┬────────────┘    │
                                    │           │                  │
                                    │  ┌────────▼────────────┐    │
                                    │  │ importedKbm (from   │    │
                                    │  │   sclIo callback)   │    │
                                    │  └────────┬────────────┘    │
                                    │  ┌────────▼────────────┐    │
                                    │  │ useBaseHzOverride   │    │
                                    │  │   (Inputs.toggle —  │    │
                                    │  │   surfaces only when│    │
                                    │  │   importedKbm != null)│  │
                                    │  └────────┬────────────┘    │
                                    │  ┌────────▼────────────┐    │
                                    │  │ effectiveBaseHz cell│◄───┼── kbmToFrequencies()
                                    │  └────────┬────────────┘    │
                                    │           │                  │
                                    │           ├──► audioPanel    │
                                    │           ├──► lattice ──────┼──► spanLattice() ──► D3 SVG ──► d3.zoom()
                                    │           ├──► tonalityDiamond┼──► enumerateDiamond() ──► hand-laid SVG
                                    │           ├──► keyboard ─────┼──► hand-laid SVG strip
                                    │           └──► sclIo (extended)
                                    │                                │
                                    │  ┌────────────────────────┐   │
                                    │  │ synth cell (Pattern 4) │   │
                                    │  │  - createSynth()       │   │
                                    │  │  - invalidation.then   │   │
                                    │  │  - Esc keydown listener│   │
                                    │  │  - visibilitychange   │   │
                                    │  └────────────────────────┘   │
                                    │  ┌────────────────────────┐   │
                                    │  │ Stop-all-audio cell    │   │
                                    │  │  (Mutable<boolean>     │   │
                                    │  │   tracks activeVoices) │   │
                                    │  └────────────────────────┘   │
                                    └─────────────────────────────┘
                                                  │
                                                  ▼ click handlers
                                    ┌─────────────────────────────┐
                                    │  SynthHandle (interface)    │
                                    │  - playNote / playNotes     │
                                    │  - playArpeggio / startDrone│
                                    │  - panic / dispose          │
                                    └────────┬────────────────────┘
                                             │ implementation
                                             ▼
                                    ┌─────────────────────────────┐
                                    │  src/audio/synth.ts         │
                                    │  - lazy AudioContext        │
                                    │  - sync ctx.resume() (NEW)  │
                                    │  - audioSession.type='play..'│
                                    │  - webkitAudioContext fallbk│
                                    │  - visibilitychange (NEW)   │
                                    └────────┬────────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────────────────┐
                                    │  npm:sw-synth (jsDelivr)    │
                                    │  - Synth, defaultParams     │
                                    └────────┬────────────────────┘
                                             │
                                             ▼  Web Audio API
```

Data flow:
1. User edits `scaleText` → `parseScala()` produces `Scale` → all data widgets re-render.
2. User imports `.kbm` via `sclIo` → `parseKbm()` produces `KbmMapping` → `effectiveBaseHz` cell recomputes via `kbmToFrequencies()`.
3. Click on lattice node / diamond cell / keyboard key → component handler calls `synth.playNote/playNotes(hz)` where hz = `effectiveBaseHz × ratio`.
4. AudioContext is created lazily on first call (Pitfall #2); `audioSession.type = 'playback'` set when context is created.
5. Esc keydown anywhere → `synth.panic()` (listener bound in synth cell, not scale cell — Pitfall #11).
6. `visibilitychange` to `'visible'` → `ctx.resume()` (suspended-on-background recovery).

### Recommended Project Structure (delta from Phase 2)

```
src/
├── audio/
│   └── synth.ts                  # MODIFIED in place
├── components/
│   ├── lattice.ts                # NEW — viz factory
│   ├── lattice.css               # NEW — colocated
│   ├── tonality-diamond.ts       # NEW — viz factory
│   ├── tonality-diamond.css      # NEW
│   ├── keyboard.ts               # NEW — viz factory
│   ├── keyboard.css              # NEW
│   ├── scl-io.ts                 # MODIFIED — also handles .kbm
│   └── __tests__/
│       ├── lattice.test.ts       # NEW — DOM smoke tests
│       ├── tonality-diamond.test.ts
│       └── keyboard.test.ts
├── lib/
│   ├── kbm.ts                    # NEW
│   ├── INVENTORY.md              # MODIFIED — Phase 3 entries
│   └── __tests__/
│       └── kbm.test.ts           # NEW — round-trip golden + kbmToFrequencies
├── styles.css                    # MODIFIED — add stop-button + viewport rules
└── index.md                      # MODIFIED — append viz cells + stop button + toggle
.planning/phases/03-.../mobile-audit.md    # NEW — RDM methodology + iOS quirks
```

### Pattern 1: ji-lattice + D3 SVG composition

**What:** `ji-lattice` is a coordinate library, not a renderer. Pass it monzos and a coordinate-system option (e.g., `kraigGrady9()`); receive `{vertices, edges}` with absolute SVG coordinates. Render with D3.

**When to use:** All `lattice.ts` rendering. NOT used for the tonality diamond (no clean ji-lattice helper for diamond layout — hand-lay it).

**Concrete example (verified by reading installed `node_modules/ji-lattice/dist/index.d.ts` and README):**

```typescript
// Source: node_modules/ji-lattice/README.md (verbatim shape)
// Source: node_modules/ji-lattice/dist/index.d.ts (type signatures)
import { toMonzo } from 'xen-dev-utils';
import { spanLattice, kraigGrady9, type Vertex, type Edge } from 'ji-lattice';

// Step 1 — derive monzos from your scale (we already have this in src/lib/interval.ts via iv.monzo).
const monzos: number[][] = scale.intervals.map(iv => iv.monzo);

// Step 2 — pick a coordinate system. kraigGrady9 returns LatticeOptions for primes 2..23.
//   Option: equaveIndex selects which prime is "the octave" — default 0 (prime 2).
const options = kraigGrady9();
//   options = { horizontalCoordinates: number[], verticalCoordinates: number[], maxDistance?: 1 }

// Step 3 — compute layout.
const { vertices, edges } = spanLattice(monzos, options);
//   vertices: Vertex[] — { x: number; y: number; index?: number } (index undefined = neighbor/auxiliary)
//   edges:    Edge[]   — { x1, y1, x2, y2, type: 'primary' | 'custom' | 'auxiliary' | 'gridline' }

// Step 4 — render with D3.
import * as d3 from 'd3';
const svg = d3.create('svg').attr('class', 'viz lattice');
const g = svg.append('g');
g.selectAll('line.edge').data(edges).enter().append('line')
  .attr('x1', d => d.x1).attr('y1', d => d.y1)
  .attr('x2', d => d.x2).attr('y2', d => d.y2)
  .attr('class', d => `edge edge-${d.type}`);
g.selectAll('g.node').data(vertices).enter().append('g')
  .attr('class', 'lattice-node')
  .attr('transform', d => `translate(${d.x},${d.y})`)
  .each(function(d) {
    const sel = d3.select(this);
    sel.append('circle').attr('r', 18);
    if (d.index !== undefined) {
      // In-scale: ratio + cents label
      sel.append('text').attr('class', 'ratio').text(formatRatio(scale.intervals[d.index]));
      sel.append('text').attr('class', 'cents').attr('y', 24).text(formatCents(scale.intervals[d.index]));
    }
  });
```

**Coordinate-system choices in ji-lattice 0.3.2** (verified by reading `dist/index.d.ts`):
- `kraigGrady9(equaveIndex?)` — Kraig Grady's coordinates for first 9 primes. Hard-coded x/y arrays for primes 2..23. Best for traditional Western JI lattice look. `[VERIFIED: dist/index.js lines 7-11 — KRAIG_GRADY_X, KRAIG_GRADY_Y arrays]`
- `scottDakota24(equaveIndex?, logs?)` — Scott Dakota's prime-ring 24 system; sine-quantized. Better for higher-prime scales.
- `primeRing72(equaveIndex?, logs?, round?)` — prime-ring 72 system; finer angular resolution.
- `align(options, horizontalIndex, tonnetzIndex?)` — mutates a LatticeOptions to make a chosen prime horizontal (Tonnetz-style alignment).

**Key API surface (CITED: `node_modules/ji-lattice/dist/index.d.ts`):**

```typescript
export type Vertex = { x: number; y: number; index?: number; };
export type Edge = { x1: number; y1: number; x2: number; y2: number; type: EdgeType; };
export type EdgeType = 'primary' | 'custom' | 'auxiliary' | 'gridline';

export type LatticeOptions = {
  horizontalCoordinates: number[];   // [0]=prime 2 coord, [1]=prime 3 coord, ...
  verticalCoordinates: number[];
  maxDistance?: number;              // default 1 — controls neighbor expansion
  edgeMonzos?: number[][];           // additional connection vectors beyond primes
  mergeEdges?: boolean;              // collapse colinear adjacent edges
};

export function spanLattice(
  monzos: number[][],
  options: LatticeOptions
): { vertices: Vertex[]; edges: Edge[]; };

export function kraigGrady9(equaveIndex?: number): LatticeOptions;
export function scottDakota24(equaveIndex?: number, logs?: number[]): LatticeOptions;
export function primeRing72(equaveIndex?: number, logs?: number[], round?: boolean): LatticeOptions;
export function align(options: LatticeOptions, horizontalIndex: number, tonnetzIndex?: number): void;
```

**For `opts.showContext: 'neighbors'`** (D-05): `spanLattice` ALREADY emits "auxiliary" vertices (those with `index === undefined`) when `maxDistance >= 1`. Filter on `vertex.index !== undefined` to get in-scale only; otherwise render auxiliaries as outlined-only (D-21). For `'full'`, increase `maxDistance` to 2 or expand `edgeMonzos` to include extra basis vectors. For `'none'`, set `maxDistance: 0`.

**For `opts.basis` (D-19) — restricting which primes appear:**
There's no direct "basis" option on `LatticeOptions`. The pattern is to pre-truncate or zero-out the monzos before passing them in. Example for `[3, 5]` basis (drop prime 7):
```typescript
const PRIMES = [2, 3, 5, 7, 11, 13, ...]; // from xen-dev-utils
const basisIndices = new Set(opts.basis.map(p => PRIMES.indexOf(p)));
const projectedMonzos = monzos.map(m =>
  m.map((v, i) => basisIndices.has(i) ? v : 0)
);
const { vertices, edges } = spanLattice(projectedMonzos, options);
```
This collapses each scale interval onto the chosen prime axes and the lattice will lay out cleanly in 2D.

### Pattern 2: D3 zoom + SVG transform (verified d3-zoom v3 docs, d3@7.9.0)

**What:** `d3.zoom()` is a behavior that attaches mouse-wheel + drag + touch (pinch + pan) listeners to a target. The `'zoom'` event fires with `event.transform` (a `ZoomTransform` carrying `x`, `y`, `k` for translation + scale). Apply that transform to a child `<g>` to pan/zoom the rendered content.

**When to use:** Both `lattice.ts` and `tonality-diamond.ts`. NOT for `keyboard.ts` (a strip with bounded width — pan/zoom would only confuse).

**Example pattern (CITED: https://d3js.org/d3-zoom + https://github.com/d3/d3-zoom):**

```typescript
import * as d3 from 'd3';

const svg = d3.create('svg').attr('class', 'viz lattice');
// inner <g> that we transform during pan/zoom — keep the SVG element unchanged
// so click handlers on the SVG itself (e.g., background-click to dismiss tooltip)
// continue to receive coordinates in the SVG's own frame.
const g = svg.append('g');

// ... append lattice content into g ...

const zoom = d3.zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.25, 8])                       // bounded zoom-out / zoom-in
  .on('zoom', (event) => {
    g.attr('transform', event.transform.toString());
  });

// Touch detection is automatic per d3-zoom: navigator.maxTouchPoints || ('ontouchstart' in this).
// d3-zoom handles pinch-to-zoom + drag-to-pan natively on touch devices. No extra wiring.
svg.call(zoom);
```

**Mobile note (CITED: https://github.com/d3/d3-zoom):** d3-zoom's default touch detector is:
```javascript
function touchable() { return navigator.maxTouchPoints || ('ontouchstart' in this); }
```
This works on iOS Safari out of the box. d3-zoom uses Pointer Events under the hood; it respects `touch-action` CSS. **Recommend setting `touch-action: none` in the lattice CSS** so the browser doesn't fight d3-zoom for pinch gestures (otherwise pinch may scroll the page instead of zooming the SVG).

**Caveat:** When the SVG is inside a scrollable page (which the dashboard is), `wheel` events default to scroll. d3-zoom calls `preventDefault()` on the wheel inside its handler, but only when the cursor is over the SVG. This is correct behavior — pan inside, scroll outside.

**Click-to-audition + zoom drag conflict:** d3-zoom distinguishes a tap (no movement) from a drag using a small tolerance. Click handlers on individual nodes still fire correctly. Use `d3.pointer(event, svg.node())` to convert event coords to SVG-local coords if needed.

### Pattern 3: Component-factory contract (Phase 2 D-09 inheritance)

**What:** Every visual component is a function `(data, ...rest, opts?) => HTMLElement`. No module-level state. Caller owns lifecycle.

**When to use:** All three Phase 3 viz widgets follow this exactly. UI-SPEC §"Component Inventory" + Phase 2 audio-panel pattern are the precedents.

**Example (skeleton for `lattice.ts`):**

```typescript
// Source: pattern adapted from src/components/audio-panel.ts
import type { Scale } from '../lib/scale.js';
import type { SynthHandle } from '../audio/synth.js';
import * as d3 from 'd3';
import { spanLattice, kraigGrady9 } from 'ji-lattice';

export interface LatticeOpts {
  basis?: number[];
  showContext?: 'none' | 'neighbors' | 'full';   // default 'neighbors' (D-05)
  audition?: 'note' | 'dyad';                     // default 'dyad' (D-07)
  width?: number;                                 // default 600
  height?: number;                                // default 400
}

export function lattice(scale: Scale, synth: SynthHandle, opts: LatticeOpts = {}): HTMLElement {
  const root = document.createElement('section');
  root.className = 'lattice-widget';

  const heading = document.createElement('h2');
  heading.textContent = 'Lattice';
  root.appendChild(heading);

  const helper = document.createElement('p');
  helper.className = 'dashboard-helper';
  helper.textContent = 'Click a node to audition. Scroll or pinch to zoom; drag to pan.';
  root.appendChild(helper);

  // ... derive basis, compute monzos, call spanLattice, render with D3 ...
  // ... attach d3.zoom() ...
  // ... node click handler: synth.playNotes([baseHz, baseHz × ratio], 1.5) ...

  return root;
}
```

### Anti-Patterns to Avoid

- **`AudioContext` allocation inside a viz component.** Components receive `SynthHandle`, never construct synths. (D-08; Phase 2 D-07 / Pitfall #2.)
- **Mutating `LatticeOptions` from `kraigGrady9()` and reusing it.** `align()` mutates in place — if you want both an aligned and unaligned view, clone first.
- **Re-running `spanLattice` on every D3 zoom event.** Compute once per `(scale, opts)` change; zoom only transforms the SVG, never re-layouts.
- **Setting `<text>.innerHTML = ratio.toString()`.** Use `.textContent` (Phase 2 D-22 / T-02-22 / T-02-23). Same for SVG `<title>`.
- **`<button>` inside `<svg>`.** SVG doesn't have native buttons. Use `<g role="button" tabindex="0">` and `keydown` for Enter/Space (UI-SPEC §Lattice/Diamond/Keyboard accessibility). Do NOT wrap SVG in `<button>`; iOS Safari has reported text-selection bugs.
- **Floating-point cents-tolerance comma comparison in the diamond.** Compare ratios via `Interval.equals` (BigInt Fraction equality), never cents (Pitfall #1, Pitfall #6). Diamond's "in-scale?" check should iterate `scale.intervals` and use `.equals()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pan/zoom math (translate × scale, wheel, pinch, drag tolerance) | Custom transform math + event listeners | `d3-zoom` (in `d3@7.9.0`) | d3-zoom handles 6 input modalities (wheel, mouse drag, pinch, double-tap, programmatic, touch-pan). Tap-vs-drag tolerance, pointer events, event capturing — all solved. `[CITED: github.com/d3/d3-zoom]` |
| 2D lattice layout (which monzo goes where on the grid) | Custom prime→coord mapping + edge enumeration | `ji-lattice` `spanLattice` + `kraigGrady9()` | Three coordinate systems with hand-tuned prime constants. Auxiliary-vertex generation. `mergeEdges` collinear collapse. `[CITED: ji-lattice README + dist/]` |
| Monzo arithmetic for the tonality diamond | Custom monzo math | `xen-dev-utils.toMonzo`, `oddLimit` (already in `src/lib/monzo.ts`), `Interval.equals` | All exist. Pitfall #5 reuse discipline. |
| Ratio↔Hz arithmetic for `kbmToFrequencies` | Float math + manual error handling | `Interval` (BigInt Fraction-backed) for ratios, `Number(fraction.valueOf())` only at the audio-layer boundary | R-01 + Pitfall #1. Existing `Scale.degreeToFreq` is the precedent. |
| `.kbm` parsing | Custom byte-by-byte | **You MUST hand-roll this — no maintained npm package exists.** The format is small (7 numeric fields + N mapping lines). | `[VERIFIED: WebSearch 2026-05-05 — no maintained kbm parser package; Scale Workshop only writes a "linear assumption" .kbm and does not parse them; libscala-file is C++]` |
| Cents conversion / cents-from-12tet | Custom log math | `Interval.cents` + `Interval.centsFrom12tet` (already in `src/lib/interval.ts`) | Pitfall #5 — already there. |
| WCAG color tints / accent overlays | Custom color math | CSS `color-mix(in oklab, ...)` (already used in Phase 2 audio-panel + dashboard-error) | Native, theme-aware, AA-compliant. UI-SPEC inheritance. |
| File picker + Blob download for `.kbm` | Custom UI | Reuse the `sclIo.ts` patterns verbatim (FileReader, `URL.createObjectURL`, anchor.click(), revokeObjectURL) | D-11 — combined widget. |

**Key insight:** Phase 3's "don't hand-roll" list is dominated by *existing project code* you already have. The only real custom work is `kbm.ts` (new lib module) and the SVG glue in three component files. Everything math-shaped (monzo arithmetic, oddLimit, ratio equality, lattice coordinates) is already in `xen-dev-utils`, `ji-lattice`, or `src/lib/` — Pitfall #5 reuse discipline is the planner's most valuable check.

## Runtime State Inventory

> Phase 3 is additive — new files + extensions to two existing files (`src/audio/synth.ts`, `src/components/scl-io.ts`). No rename, no migration. The "Runtime State Inventory" section is included for completeness with explicit "None" for each category.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — project is a static site with no databases. Scale state is currently in-memory only (textarea); Phase 4 ANAL-04 will add URL hash persistence. | None |
| Live service config | None — no external services. Cloudflare Pages (deployment target) is configured via GitHub Actions, not affected by Phase 3. | None |
| OS-registered state | None — static site, no OS daemons or scheduled tasks. | None |
| Secrets/env vars | None — no secrets in this project. Cloudflare Pages deploy uses repo-secrets but their names don't change. | None |
| Build artifacts / installed packages | `node_modules/d3` will be created when Phase 3 installs `d3@7.9.0` — initial state. `package-lock.json` will diff. No stale artifacts. | Install d3 (one-time) |

**Nothing found in the rename/migration sense — verified by reading CONTEXT.md (D-09: NEW module `kbm.ts`; D-11: extend `scl-io.ts` IN PLACE; no file rename) and checking `package.json` (no removed dependencies).**

## Common Pitfalls

### Pitfall 1: ji-lattice peer-dep mismatch warning is benign — but verify

**What goes wrong:** `ji-lattice@0.3.2` declares peer-dep `xen-dev-utils@^0.12.2`; the project pins `xen-dev-utils@^0.13.1`. `npm install` emits a peer-dep warning.

**Why it happens:** ji-lattice was published before xen-dev-utils 0.13 shipped. CLAUDE.md and Phase 1 D-21 already documented "accepted ji-lattice peer-dep warning per CLAUDE.md compatibility table."

**How to avoid:** This is a known accepted state. Do NOT change either pin. Phase 3 should add a Wave 0 smoke check that imports `spanLattice` + uses it on a 3-monzo input — if 0.13 has shifted any signature, this would surface immediately. (Reading `node_modules/ji-lattice/dist/index.js` confirms it imports `LOG_PRIMES, dot, mmod, monzosEqual, sub` from `xen-dev-utils` — all stable in the 0.13 line.)

**Warning signs:** Runtime `TypeError: monzosEqual is not a function` or coordinate output that's `NaN`.

`[VERIFIED: node_modules/ji-lattice/dist/index.js line 1 — exact xen-dev-utils symbols imported]`

### Pitfall 2: d3 not yet installed — easy plan-phase miss

**What goes wrong:** Plan-phase forgets to add `d3` + `@types/d3` to `package.json` because the rest of the stack is already there.

**Why it happens:** CLAUDE.md "Recommended Stack" lists d3 as recommended, but Phase 1 didn't install it (only the kernel/audio/lattice deps). Phase 3 is the first phase to need it.

**How to avoid:** First plan in Phase 3 must `npm install --save d3@7.9.0 @types/d3`. Verify with `grep '"d3"' package.json`.

**Warning signs:** TS error `Cannot find module 'd3'` on the first viz component.

### Pitfall 3: `.kbm` referenceKey ≠ middleNote (Pitfall #7 carry-forward)

**What goes wrong:** Treating "the MIDI note A=440 sounds at" (`referenceKey + referenceHz`) as the same thing as "the MIDI note where 1/1 of the scale is mapped" (`middleNote`). They are different by spec.

**Why it happens:** Default scenario `referenceKey == middleNote` (e.g., both 69) makes the distinction invisible. Production `.kbm` files commonly have `referenceKey=69, middleNote=60` — meaning A4 = 440 Hz (the reference) but the scale's 1/1 sounds at C4 ≈ 261.626 Hz (the middle note).

**How to avoid:**
1. `KbmMapping` type keeps THREE fields with these names verbatim: `referenceKey: number`, `referenceHz: number`, `middleNote: number`. Never collapse to `baseHz`.
2. Round-trip golden test must include a fixture where `referenceKey ≠ middleNote`. The canonical example: `referenceKey=69, referenceHz=440, middleNote=60` → 1/1 of scale sounds at C4 ≈ `440 × 2^((60-69)/12) = 261.6256` Hz.
3. `kbmToFrequencies` formula:
   ```typescript
   // For each MIDI note `n` that maps to scale degree `d`:
   //   hz = referenceHz × 2^((n - referenceKey) / 12) × scale.intervals[d].fraction.valueOf()
   //   …no, that's wrong if formalOctave ≠ 12. Use the formal-octave-aware form:
   //
   //   stepFromMiddle = (n - middleNote)
   //   octaveCount    = floor(stepFromMiddle / size)         // scale repeats every `size` keys
   //   degreeIndex    = ((stepFromMiddle % size) + size) % size
   //   ratio          = scale.intervals[degreeIndex] × period^octaveCount
   //   refHzAtMiddle  = referenceHz × 2^((middleNote - referenceKey) / 12)
   //   hz             = refHzAtMiddle × ratio
   //
   // (Replace 2^(1/12) only if you assume 12-TET refKey; the spec is silent on this
   // but Scala always uses 12-TET semitones for the refKey↔middle alignment.)
   ```

**Warning signs:** Round-trip test fails with the mid≠ref fixture. Audition pitches sound a tritone or a semitone wrong.

`[VERIFIED: source convergence — Modartt forum + RNBO docs + libscala-file struct definition all describe the same 7-field semantics]`

### Pitfall 4: SVG <text> with raw `innerHTML` (Phase 2 D-22 carry-forward)

**What goes wrong:** A `.scl` description containing `<script>` or a malicious ratio label being rendered via `innerHTML` runs as markup.

**Why it happens:** SVG `<text>` accepts both `.textContent` and `.innerHTML`; D3's `.text(d => ...)` uses `.textContent` (safe), but `.html(d => ...)` does not.

**How to avoid:** Always use D3's `.text(...)` for ratio/cents labels. Never `.html(...)` for any user-derived data. Same rule for `<title>` (tooltip) elements.

**Warning signs:** Code review flags `.html(` calls in viz code. ESLint should add `no-restricted-syntax` for `.html(` if not already present (Phase 1 ESLint already enforces no `innerHTML` for dynamic content via Phase 2 review patterns).

### Pitfall 5: Forgetting `touch-action: none` on viz SVGs

**What goes wrong:** On iOS Safari, pinch-to-zoom on the lattice/diamond zooms the *page*, not the SVG, because the browser claims pinch gestures by default.

**Why it happens:** `touch-action` defaults to `auto`. d3-zoom listens for pointer events but cannot prevent the browser's own pinch-zoom handling.

**How to avoid:** In `lattice.css` and `tonality-diamond.css`:
```css
svg.viz.lattice, svg.viz.diamond {
  touch-action: none;   /* let d3-zoom own the gesture */
}
```
Keyboard widget should keep `touch-action: manipulation` (allows fast tap, blocks double-tap-zoom which would interfere with rapid key tapping).

**Warning signs:** Pinching on iPhone Safari RDM zooms the dashboard page rather than the lattice.

### Pitfall 6: `d3.zoom()` re-layouts on every event (performance)

**What goes wrong:** Component author re-runs `spanLattice(monzos, options)` inside the `'zoom'` event handler.

**Why it happens:** Misunderstanding D3 zoom — the transform-application in the handler is supposed to be SVG-level only.

**How to avoid:** Compute `{vertices, edges}` ONCE per `(scale, opts)` change. The zoom handler does only `g.attr('transform', event.transform.toString())`. The SVG element receives the zoom behavior; the inner `<g>` receives the transform.

**Warning signs:** Janky pan/zoom. Console shows repeated `spanLattice` invocations during interaction.

### Pitfall 7: iOS Safari requires `audioSession.type='playback'` to bypass mute switch

**What goes wrong:** User opens dashboard on iPhone with the silent switch ON (a common state for many users). Taps a play button. Hears nothing. Page appears broken.

**Why it happens:** **Pre-iOS-17:** Web Audio is silenced by the hardware mute switch (only HTML `<audio>` is exempt). **Post-iOS-17:** `navigator.audioSession.type = 'playback'` overrides this — explicitly requested by Apple as the resolution to WebKit bug #237322.

**How to avoid:**
```typescript
// Inside src/audio/synth.ts ensure() — after AudioContext creation:
type WithAudioSession = Navigator & {
  audioSession?: { type: 'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record' };
};
const nav = navigator as WithAudioSession;
if (nav.audioSession) {
  try {
    nav.audioSession.type = 'playback';
  } catch {
    /* swallow — read-only or unsupported */
  }
}
```
Browser support: Safari 16.4+ on iOS / macOS (`[VERIFIED: caniuse 2026-05-05 — Safari 16.4+; Chrome/Firefox no]`). On unsupported browsers the assignment is a no-op.

**Warning signs:** RDM cannot reproduce this — RDM emulates layout, not audio session policy. The Phase 3 `mobile-audit.md` must document: "If you hear nothing on iPhone, check the silent switch on the side of your device. Setting `audioSession.type='playback'` bypasses this on iOS 16.4+."

`[VERIFIED: bugs.webkit.org/237322 status RESOLVED CONFIGURATION-CHANGED 2024-09-25 + W3C Audio Session API + caniuse Safari iOS 16.4+]`

### Pitfall 8: `ctx.resume()` inside an `await` chain loses user-gesture context

**What goes wrong:** Click handler does `await someAsyncCheck(); ctx.resume();` → `resume()` is no longer "inside" the user gesture; iOS rejects it; ctx stays suspended; nothing plays.

**Why it happens:** Browsers track user-gesture activation in a synchronous frame. `await` yields to the event loop, ending the activation window.

**How to avoid:** In every Phase 3 click handler in components, the FIRST thing the handler does is invoke `synth.playNote(...)`. Inside `synth.ts`, `ensure()` calls `ctx.resume()` synchronously if `ctx.state === 'suspended'` — no `await` between gesture and resume.
```typescript
// In synth.ts ensure() — after ctx is created or on subsequent calls:
if (ctx.state === 'suspended') {
  void ctx.resume();   // fire-and-forget; don't await
}
```

**Warning signs:** First click does nothing on iOS; second click works (because the user gesture activated the context the first time, even though our code didn't await it).

### Pitfall 9: `visibilitychange` listener leaks across hot-reload

**What goes wrong:** Framework re-evaluates the synth cell; the old `visibilitychange` listener stays bound on `document`; multiple resume calls fire on focus.

**Why it happens:** `document.addEventListener` doesn't auto-cleanup. Framework's `invalidation` promise is the cleanup hook.

**How to avoid:** In the synth cell (NOT inside `synth.ts` — the listener is page-level):
```typescript
const synth = createSynth();
const onVis = () => {
  if (document.visibilityState === 'visible') synth.resumeIfSuspended?.();
};
document.addEventListener('visibilitychange', onVis);
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') synth.panic(); };
document.addEventListener('keydown', onKey);
invalidation.then(() => {
  document.removeEventListener('visibilitychange', onVis);
  document.removeEventListener('keydown', onKey);
  synth.dispose();
});
```
Or move both listeners into `synth.ts` and have `dispose()` clean them up. Per CONTEXT.md D-15 + D-16, the visibilitychange listener is INSIDE `synth.ts` (in `ensure()`); the Esc keydown listener is in the dashboard's synth cell. **Keep this split.** Pitfall #11 from Phase 2 RESEARCH says: bind in synth cell so it doesn't re-bind on scale edits. Re-confirm.

**Warning signs:** After several scale edits, the AudioContext refuses to play because too many `resume()` calls are pending; or memory grows during live-edit sessions.

### Pitfall 10: Polyphony explosion from rapid lattice clicks

**What goes wrong:** User clicks 30 lattice nodes in 2 seconds — each click triggers a 1.5s dyad → 60 voices stacked → CPU spike, audible distortion, voice cap exhausted.

**Why it happens:** No rate-limit on click handlers. The synth's polyphony cap (16) FIFO-evicts oldest voices, but the perceptual experience is still chaotic.

**How to avoid:** Rely on existing infrastructure:
1. The Stop-all-audio button (D-16) is the explicit recovery affordance.
2. Esc keyboard shortcut → `synth.panic()`.
3. Existing `synth.ts` polyphony cap of 16 (clamped to 64 max per T-02-19).
4. Optional: debounce click handlers per-component if user testing surfaces this. Plan-phase decides.

**Warning signs:** During mobile audit, multi-tap on lattice produces overlapping audio fans of 60+ voices.

### Pitfall 11: Lattice basis derivation fails for octave-only scales

**What goes wrong:** Seed scale stripped of prime 2 → 0 primes → `spanLattice([], options)` or empty render.

**Why it happens:** A pure-octave scale (`1/1, 2/1`) has only prime 2; CONTEXT.md D-19 strips prime 2 → empty basis.

**How to avoid:** UI-SPEC handles this: empty-state message `This scale only spans the octave (prime 2). Add a non-octave interval to see a lattice.` Component should detect `derivedBasis.length === 0` BEFORE calling `spanLattice` and render the empty state instead.

**Warning signs:** Empty SVG; runtime error from ji-lattice on zero-length monzo arrays.

## Code Examples

### `parseKbm` skeleton (line-order canonical per Modartt forum + libscala-file)

```typescript
// Source: triangulated from
//   https://forum.modartt.com/viewtopic.php?id=5724 (line-by-line .kbm example)
//   https://github.com/MarkCWirt/libscala-file (struct kbm field order)
//   https://rnbo.cycling74.com/learn/scala-and-custom-tuning-reference (semantics)

export interface KbmMapping {
  size: number;             // pattern repeats every `size` keys
  firstKey: number;         // first MIDI note to retune (often 0)
  lastKey: number;          // last MIDI note to retune (often 127)
  middleNote: number;       // MIDI note where degree-0 (1/1) sounds — D-10 / Pitfall #7
  referenceKey: number;     // MIDI note for which referenceHz is given
  referenceHz: number;      // Hz of the referenceKey (float, e.g. 440.0)
  formalOctave: number;     // scale degree to consider as the equave (often = scale.length)
  keyMap: (number | null)[]; // per-degree mapping; null === unmapped (the "x" entries)
}

export function parseKbm(text: string): KbmMapping {
  // Exactly 7 numeric fields followed by `size` mapping lines.
  // Comment lines (`!` first column) and blank lines skipped.
  // BOM strip + CRLF→LF normalize (same as scala.ts pattern).

  // Defense-in-depth (mirror scala.ts):
  if (utf8ByteLength(text) > 1_000_000) throw new Error("parseKbm: input too large (max 1MB UTF-8)");

  const lines = normalizeAndStrip(text); // strip ! comments + blanks
  if (lines.length < 7) throw new Error("parseKbm: too few fields (expected ≥7)");

  const [s, fk, lk, mn, rk, rhz, fo, ...mapLines] = lines;
  const size = parseIntStrict(s, "size");
  const firstKey = parseIntStrict(fk, "firstKey");
  const lastKey = parseIntStrict(lk, "lastKey");
  const middleNote = parseIntStrict(mn, "middleNote");
  const referenceKey = parseIntStrict(rk, "referenceKey");
  const referenceHz = parseFloatStrict(rhz, "referenceHz");
  const formalOctave = parseIntStrict(fo, "formalOctave");

  // Mapping body: exactly `size` entries, each integer or "x" (lowercase).
  const keyMap: (number | null)[] = mapLines.slice(0, size).map((tok, i) => {
    const t = tok.trim();
    if (t === "" || t === "x" || t === "X") return null;
    if (!/^\d+$/.test(t)) throw new Error(`parseKbm: invalid mapping entry #${i}: "${t}"`);
    return Number(t);
  });
  if (keyMap.length !== size) {
    throw new Error(`parseKbm: mapping body has ${keyMap.length} entries, expected ${size}`);
  }

  // Sanity bounds (defense-in-depth — prevent runaway in kbmToFrequencies):
  if (size < 0 || size > 1024) throw new Error(`parseKbm: size out of range`);
  if (firstKey < 0 || firstKey > 127) throw new Error(`parseKbm: firstKey out of MIDI range`);
  if (lastKey < firstKey || lastKey > 127) throw new Error(`parseKbm: lastKey invalid`);
  if (middleNote < 0 || middleNote > 127) throw new Error(`parseKbm: middleNote out of range`);
  if (referenceKey < 0 || referenceKey > 127) throw new Error(`parseKbm: referenceKey out of range`);
  if (!Number.isFinite(referenceHz) || referenceHz <= 0) throw new Error(`parseKbm: referenceHz must be > 0`);
  if (formalOctave < 0 || formalOctave > 1024) throw new Error(`parseKbm: formalOctave out of range`);

  return { size, firstKey, lastKey, middleNote, referenceKey, referenceHz, formalOctave, keyMap };
}
```

`[CITED: forum.modartt.com/viewtopic.php?id=5724 — example .kbm with 7 numeric fields in this exact order; github.com/MarkCWirt/libscala-file — `struct kbm` field declaration order matches]`

### `writeKbm` skeleton (round-trip-stable)

```typescript
export function writeKbm(kbm: KbmMapping): string {
  // Use the same comment-prefixed layout as the canonical Scala output, so
  // a round-trip through parseKbm → writeKbm produces a byte-identical-ish
  // file (modulo whitespace; we standardize trailing newlines).
  const lines: string[] = [];
  lines.push("! Generated by Tuning Systems");
  lines.push("!");
  lines.push("! Size of map:");
  lines.push(String(kbm.size));
  lines.push("! First MIDI note number to retune:");
  lines.push(String(kbm.firstKey));
  lines.push("! Last MIDI note number to retune:");
  lines.push(String(kbm.lastKey));
  lines.push("! Middle note where the first entry of the mapping is mapped to:");
  lines.push(String(kbm.middleNote));
  lines.push("! Reference note for which frequency is given:");
  lines.push(String(kbm.referenceKey));
  lines.push("! Frequency to tune the above note to:");
  lines.push(kbm.referenceHz.toFixed(6));   // 6 decimal places — Scala convention
  lines.push("! Scale degree to consider as formal octave:");
  lines.push(String(kbm.formalOctave));
  lines.push("! Mapping:");
  for (const entry of kbm.keyMap) {
    lines.push(entry === null ? "x" : String(entry));
  }
  return lines.join("\n") + "\n";
}
```

### `kbmToFrequencies(scale, kbm)` — pure mapping function

```typescript
import { Scale } from "./scale.js";

export function kbmToFrequencies(scale: Scale, kbm: KbmMapping): Map<number, number> {
  const out = new Map<number, number>();
  // Hz of MIDI note `referenceKey` — the anchor.
  // Hz of `middleNote` (where degree-0 sounds): refHz × 2^((middleNote - refKey)/12).
  const refHzAtMiddle = kbm.referenceHz * Math.pow(2, (kbm.middleNote - kbm.referenceKey) / 12);

  for (let n = kbm.firstKey; n <= kbm.lastKey; n++) {
    const stepFromMiddle = n - kbm.middleNote;
    // Use formalOctave to wrap; if formalOctave is 0 (Scala "linear octave" mode),
    // fall back to scale length (size).
    const wrap = kbm.formalOctave > 0 ? kbm.formalOctave : kbm.size;
    if (wrap <= 0) continue;
    const octaveCount = Math.floor(stepFromMiddle / wrap);
    const positionInPattern = ((stepFromMiddle % wrap) + wrap) % wrap;
    // Look up the mapping entry — it's an index into scale.intervals (or null = unmapped).
    const mapEntry = kbm.keyMap[positionInPattern];
    if (mapEntry === undefined || mapEntry === null) continue;
    const iv = scale.intervals[mapEntry];
    if (!iv) continue;
    const periodRatio = Number(scale.period.fraction.valueOf());
    const ratio = Number(iv.fraction.valueOf()) * Math.pow(periodRatio, octaveCount);
    out.set(n, refHzAtMiddle * ratio);
  }
  return out;
}
```

### Tonality diamond enumeration (hand-laid — no ji-lattice helper exists)

```typescript
// Source: standard Partch tonality-diamond construction.
// Cells: i/j for odd i, j ∈ [1, oddLimit], octave-reduced to [1, 2).
import { Interval } from "./interval.js";

export interface DiamondCell {
  numerator: number;     // i (odd, ≤ oddLimit)
  denominator: number;   // j (odd, ≤ oddLimit)
  ratio: Interval;       // i/j, octave-reduced
  inScale: boolean;      // computed against caller's scale
}

export function enumerateDiamond(oddLimit: number, scale: Scale): DiamondCell[] {
  const cells: DiamondCell[] = [];
  // Enumerate ODD integers in [1, oddLimit].
  const odds: number[] = [];
  for (let k = 1; k <= oddLimit; k += 2) odds.push(k);

  for (const i of odds) {
    for (const j of odds) {
      const ratio = new Interval(`${i}/${j}`).octaveReduce(); // default 2/1
      const inScale = scale.intervals.some(iv => iv.equals(ratio));
      cells.push({ numerator: i, denominator: j, ratio, inScale });
    }
  }
  return cells;
}

// Layout — simplest readable form (rhombic):
//   x = (log2(i) - log2(j)) × scale     (Otonal axis)
//   y = (log2(i) + log2(j)) × scale     (Utonal axis)
// or (square layout): x = i, y = j (less elegant but easier to grok).
// Recommendation: square layout with row=numerator-rank, col=denominator-rank
// for default; rhombic only if visually compelling testing shows it's clearer.
```

### Lattice basis auto-derivation (D-19)

```typescript
import { PRIMES } from "xen-dev-utils";
import type { Scale } from "./scale.js";

export function deriveLatticeBasis(scale: Scale): number[] {
  const used = new Set<number>();
  for (const iv of scale.intervals) {
    iv.monzo.forEach((exp, i) => {
      if (exp !== 0 && i > 0) used.add(PRIMES[i]!);   // i=0 is prime 2, skip per D-19
    });
  }
  const basis = [...used].sort((a, b) => a - b);
  if (basis.length > 3) {
    // Top-2-by-frequency: count how often each prime appears across intervals.
    const counts = new Map<number, number>();
    for (const iv of scale.intervals) {
      iv.monzo.forEach((exp, i) => {
        if (exp !== 0 && i > 0) counts.set(PRIMES[i]!, (counts.get(PRIMES[i]!) ?? 0) + 1);
      });
    }
    const sorted = basis.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
    const dropped = sorted.slice(2);
    console.warn(`[lattice] basis truncated from ${sorted.length} to 2 primes; dropped: ${dropped.join(', ')}`);
    return sorted.slice(0, 2);
  }
  return basis;
}
```

## State of the Art

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|-------------------------|--------------|--------|
| `<audio>`-tag-based unmute hack (`feross/unmute-ios-audio`, `swevans/unmute`) | `navigator.audioSession.type = 'playback'` | iOS 16.4 (Mar 2023); fully resolved by 2024-09-25 (WebKit #237322 → CONFIGURATION-CHANGED) | One line of code replaces a workaround library. Phase 3 should use the API directly; the `<audio>`-tag hack remains a fallback for browsers without `audioSession` (none of which are iOS Safari ≥16.4). |
| Manual SVG pan/zoom math | `d3-zoom` (in d3 v7) | d3 v4 (Jun 2017); v7 since Aug 2020; current 7.9.0 (May 2025) | Touch + pinch + double-tap + wheel + drag all handled natively. Same code works on desktop and mobile. |
| Scala Workshop's "linear-only .kbm export" | Hand-roll a real parser + writer | n/a — the lazy approach is still the predominant one in published xen tooling | This project is going slightly farther than Scale Workshop. The kbm fixture corpus + golden tests will be the only meaningful kbm round-trip parser in xen-JS as of 2026. |
| `xen-dev-utils@0.2.x` (used by `temperaments@0.5.3`) | `xen-dev-utils@0.13.1` | Major-version progression 2024→2026 | Why `temperaments` is still deferred. Phase 3 doesn't touch this. |

**Deprecated/outdated (do not use):**
- `Observable Framework's `deploy` command` — deprecated v1.13.3 (Apr 2025). Phase 3 doesn't touch deployment.
- `feross/unmute-ios-audio` / `swevans/unmute` — keep as a documented fallback in `mobile-audit.md` only; do not pull as a dependency. The Audio Session API is the answer.
- The `<audio>`-tag-with-silent-WAV trick — pre-2023 workaround. Not needed.
- `tonal.js` for any JI math — banned by CLAUDE.md.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@types/d3@^7.4.x` is the standard companion for `d3@7.9.0` in TS strict mode | Standard Stack | Low — wrong version can be patched in plan-phase or Wave 0; types are advisory in non-bundled builds |
| A2 | The exact 7-field `.kbm` line order (`size, firstKey, lastKey, middleNote, referenceKey, referenceHz, formalOctave, [keyMap]`) is canonical and unchanged across decades | parseKbm code example, Pitfall #3 | LOW — triangulated by Modartt forum (2017) + libscala-file (2018) + RNBO (2024) all agreeing. Risk if Scala 2.2x reordered fields silently — judged near-zero given the format's stability |
| A3 | `formalOctave === 0` in a `.kbm` means "linear octave mode" (treat scale length as the wrap) vs. an explicit positive integer for an N-degree formal octave | kbmToFrequencies code example | MEDIUM — this is the most common interpretation but the spec is terse; a `.kbm` with `formalOctave=0` may be intended as "no octave wrap, single-segment mapping" by some authors. Recommendation: golden-test against multiple Scala-distribution `.kbm` examples and treat 0 as "use size" only if behavior matches |
| A4 | The Modartt-forum example `formalOctave=0` line is meant to be parsed as "use linear/size", not as a sentinel meaning the file is malformed | parseKbm bounds check | LOW — confirmed by RNBO's "scale degree considered as octave" wording (which permits 0); fixture corpus must include both formalOctave=0 and formalOctave=size cases |
| A5 | iOS Safari < 16.4 (the legacy fallback path) is rare enough in 2026 that the Audio Session API alone is sufficient — no `<audio>`-tag fallback needed | Pitfall #7 | LOW — iOS 16 was released Sep 2022. Current iPhone install base is mostly iOS 17 / 18. We document the limitation and don't ship the workaround. |
| A6 | `touch-action: none` on the lattice/diamond SVGs allows d3-zoom's pinch handler to receive gestures without browser-pinch-zoom interfering | Pitfall #5 | LOW — this is standard advice for any touch-interactive SVG and is documented in d3-zoom's behavior notes. RDM verification is sufficient since `touch-action` is a standard CSS property unrelated to the iOS-specific quirks |
| A7 | `scale.intervals.some(iv => iv.equals(ratio))` is an acceptable O(n²) for the diamond's "in-scale?" check at the dashboard's bounded scale sizes (≤ ~100 pitches × ≤ ~961 cells for odd-limit 31) | Tonality diamond code example | LOW — the existing `Scale.dedupe` and `Scale.reduce` already use the same O(n²) discipline (see `src/lib/scale.ts` perf note). For odd-limit-31 diamond × 8-tone scale: 16 × 16 × 8 = 2048 comparisons — well within budget |

**Note on assumptions:** All A1–A7 are LOW-MEDIUM impact. None override a CONTEXT.md decision. None contradict CLAUDE.md. The plan-phase and discuss-phase do NOT need to re-confirm these — they are standard implementation choices flagged for transparency.

## Open Questions

1. **Should `parseKbm` accept BOTH the verbose Scala-tutorial form (one comment line per field) AND a stripped-numeric-only form?**
   - What we know: Scala writes the verbose form; some hand-edited `.kbm` files in the wild may strip comments.
   - What's unclear: Whether to be strict (require comments? — fragile) or permissive (skip blanks + comments, take first 7 numeric tokens, then `size` mapping tokens — robust).
   - Recommendation: **Permissive parser.** Strip all `!`-comment + blank lines first; consume the next 7 non-comment lines as numeric fields; consume the next `size` lines as map entries. Mirrors `scala.ts` behavior. Reject only on out-of-range values.

2. **Should the floating Stop-button track `synth.activeVoices` via polling or a callback?**
   - What we know: `SynthHandle.activeVoices` is a getter (read-only, synchronous).
   - What's unclear: How to make it reactive — polling at 100ms is wasteful; a callback (`onActiveVoicesChange`) would require extending `SynthHandle`.
   - Recommendation: **Add `onActiveVoicesChange?: (n: number) => void` to `SynthHandle`** — fire on every increment / decrement inside `playNoteImpl` + `startDrone` + `panic`. Plan-phase decides whether to extend the interface or use a `Mutable<boolean>` driven by polling. Polling is simpler but jankier.

3. **Default audition behavior on the keyboard widget — `'note'` (D-04) or `'dyad'`?**
   - What we know: D-07 says lattice/diamond default to `'dyad'`. D-04 says keyboard plays single notes.
   - What's unclear: Whether the keyboard widget should expose `opts.audition: 'note' | 'dyad'` for symmetry with the other two, or stay note-only.
   - Recommendation: **Note-only — no opts.audition on `keyboard()`**. A keyboard plays one note per key; layering an automatic 1/1 dyad on every key tap would feel wrong. Symmetry with lattice/diamond is not worth the UX confusion. Document in `KeyboardOpts` JSDoc.

4. **Should `lattice.ts` choose a coordinate system based on derived basis size?**
   - What we know: ji-lattice offers `kraigGrady9`, `scottDakota24`, `primeRing72`. CONTEXT.md doesn't specify.
   - What's unclear: Whether to default to `kraigGrady9` always, or switch to `primeRing72` for higher prime limits.
   - Recommendation: **`kraigGrady9` as the universal default.** It's the most familiar visual style for JI practitioners. Expose `opts.coordinates: 'kraig-grady' | 'scott-dakota' | 'prime-ring-72'` for power users. Phase 3 plan-phase can deprioritize the alternates if scope is tight.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 20 LTS | Build/test | ✓ | per .nvmrc | — |
| `npm` | Package manager | ✓ | bundled with Node | — |
| `@observablehq/framework` | Dev/build | ✓ | 1.13.4 (exact pin) | — |
| `ji-lattice` | VIZ-01 | ✓ | 0.3.2 installed | — |
| `xen-dev-utils` | All viz | ✓ | 0.13.1 installed | — |
| `fraction.js` | All math | ✓ | 5.3.4 installed | — |
| `sw-synth` | Audio | ✓ | 0.4.0 installed | — |
| `d3` | All viz | ✗ | — | **None — must install in Phase 3 first plan** |
| `@types/d3` | TS strict types | ✗ | — | None — must install (devDependency) |
| Vitest | Tests | ✓ | 2.1.9 | — |
| Safari macOS Responsive Design Mode | AUDIO-06 verification | ✓ (assumed dev environment is macOS) | — | Brave/Firefox cannot reproduce iOS audio session policy; physical iPhone deferred per D-18 |

**Missing dependencies, blocking:** None — `d3` and `@types/d3` are trivially installable; Phase 3 first plan must add them.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 (already configured) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- src/lib/__tests__/kbm.test.ts` (per-file) or `npm run test -- --testNamePattern "kbm"` |
| Full suite command | `npm run test` |
| Pre-existing test count | 136 passing (per Phase 2 Plan 07 SUMMARY) |
| Test environment | `node` (DOM tests use happy-dom or manual createElement on globalThis) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IO-03 | `parseKbm` accepts a canonical 12-tone .kbm with comments | unit | `npm run test -- kbm` | ❌ Wave 0 — `src/lib/__tests__/kbm.test.ts` |
| IO-03 | `writeKbm(parseKbm(file)) ≡ writeKbm(parseKbm(writeKbm(parseKbm(file))))` (round-trip stability) | unit (golden) | same | ❌ Wave 0 — needs fixture corpus in `src/lib/__tests__/fixtures/kbm/` |
| IO-03 | `referenceKey ≠ middleNote` round-trip (Pitfall #7 contract) | unit (golden) | same | ❌ Wave 0 — fixture: `mid-60-ref-69.kbm` |
| IO-03 | `parseKbm` rejects: too few fields, non-integer where integer expected, negative size, file > 1MB | unit | same | ❌ Wave 0 |
| IO-03 | `parseKbm` accepts unmapped keys (`x` and `X` and blank) | unit | same | ❌ Wave 0 |
| IO-03 | `kbmToFrequencies(scale, defaultKbm)` reproduces the existing dashboard `baseHz × ratio` mapping when middle == reference | unit | same | ❌ Wave 0 |
| IO-03 | `kbmToFrequencies` for fixture middle=60, reference=69, refHz=440 → MIDI 60 → 261.6256 Hz (±0.001) | unit | same | ❌ Wave 0 |
| IO-03 | `kbmToFrequencies` for `formalOctave === 0` falls back to `size` for wrap | unit | same | ❌ Wave 0 |
| VIZ-01 | `lattice(scale, mockSynth)` returns an `HTMLElement` (factory smoke) | unit (DOM) | `npm run test -- lattice` | ❌ Wave 0 — `src/components/__tests__/lattice.test.ts` |
| VIZ-01 | `lattice` calls `mockSynth.playNotes` when a node `<g>` is clicked (default audition='dyad') | unit (DOM) | same | ❌ Wave 0 |
| VIZ-01 | `lattice` renders one `.lattice-node[data-index]` per scale interval with non-octave primes | unit (DOM) | same | ❌ Wave 0 |
| VIZ-01 | `deriveLatticeBasis` for the seed scale `1/1 9/8 5/4 21/16 3/2 27/16 7/4 2/1` returns `[3, 5, 7]` | unit | same | ❌ Wave 0 |
| VIZ-01 | `deriveLatticeBasis` for octave-only `1/1 2/1` returns `[]` (empty-state trigger) | unit | same | ❌ Wave 0 |
| VIZ-02 | `enumerateDiamond(7, scale)` returns the right number of cells (4×4 = 16 for odd-limit-7) | unit | `npm run test -- diamond` | ❌ Wave 0 — `src/lib/__tests__/diamond.test.ts` (or inline in `tonality-diamond.test.ts`) |
| VIZ-02 | Diamond marks `5/4` as in-scale when seed scale contains it; marks `5/3` as out-of-scale | unit | same | ❌ Wave 0 |
| VIZ-02 | `tonalityDiamond(scale, mockSynth)` returns an `HTMLElement` and renders cells | unit (DOM) | same | ❌ Wave 0 |
| VIZ-03 | `keyboard(scale, mockSynth, baseHz)` returns N keys for an N-degree scale | unit (DOM) | `npm run test -- keyboard` | ❌ Wave 0 — `src/components/__tests__/keyboard.test.ts` |
| VIZ-03 | Period boundary marker rendered after the last degree | unit (DOM) | same | ❌ Wave 0 |
| VIZ-03 | Each key's `aria-label` includes the ratio AND signed cents (sample: `Play degree 3: 5/4, +13.7¢ from 12-TET`) — wait, 5/4 is −13.686¢; verify exact text in tests | unit (DOM) | same | ❌ Wave 0 |
| AUDIO-06 | `synth.ts` calls `ctx.resume()` synchronously in `ensure()` after a click handler invocation — no `await` between gesture and resume (verified by code-review + a vitest test that mocks AudioContext and asserts resume was called before the next event-loop tick) | unit | `npm run test -- synth` | Partially — `src/audio/__tests__/synth.test.ts` exists; extend with the new assertions |
| AUDIO-06 | `synth.ts` sets `navigator.audioSession.type = 'playback'` when the API is available; no-throw when API absent | unit | same | ❌ Wave 0 (mock navigator.audioSession) |
| AUDIO-06 | `visibilitychange` listener registered in `ensure()`; removed in `dispose()` | unit | same | ❌ Wave 0 |
| AUDIO-06 | RDM smoke check: open `npm run dev`, switch Safari to RDM iPhone preset, click a play button, verify audio plays in macOS speakers | manual | (manual checklist in `mobile-audit.md`) | n/a |
| AUDIO-06 | Hardware mute switch quirk documented (RDM cannot reproduce) | manual / docs | (`mobile-audit.md` content) | ❌ Wave 0 — new file |

### Sampling Rate

- **Per task commit:** `npm run test -- <changed-file>` (file-targeted; ≤ 5s per run)
- **Per wave merge:** `npm run test` (full Vitest suite; currently 136 tests + Phase 3 additions ≈ ~170)
- **Phase gate:** `npm run ci` (lint:types + test + lint + format:check + build) — must exit 0 before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/__tests__/kbm.test.ts` — covers IO-03 (parser, serializer, kbmToFrequencies, golden round-trip)
- [ ] `src/lib/__tests__/fixtures/kbm/12-tet.kbm` — canonical 12-tone reference with `referenceKey === middleNote`
- [ ] `src/lib/__tests__/fixtures/kbm/mid-60-ref-69.kbm` — Pitfall #7 fixture; `referenceKey=69, middleNote=60, refHz=440`
- [ ] `src/lib/__tests__/fixtures/kbm/seven-degree.kbm` — `formalOctave=7`, `size=7`
- [ ] `src/lib/__tests__/fixtures/kbm/with-muted-keys.kbm` — at least one `x` entry
- [ ] `src/lib/__tests__/diamond.test.ts` (or `src/components/__tests__/tonality-diamond.test.ts`) — `enumerateDiamond` cell counts + in-scale flagging
- [ ] `src/components/__tests__/lattice.test.ts` — DOM smoke + click-to-audition with mockSynth
- [ ] `src/components/__tests__/tonality-diamond.test.ts` — DOM smoke + click handler
- [ ] `src/components/__tests__/keyboard.test.ts` — DOM smoke + key count + aria-label format
- [ ] `src/audio/__tests__/synth.test.ts` — extend with audioSession assertion + visibilitychange listener registration
- [ ] `vitest.config.ts` — extend `test.include` to add `src/components/**/__tests__/**/*.test.ts` (currently only includes `src/lib`, `src/audio`, `src/__tests__/`)
- [ ] DOM environment: components produce `HTMLElement`. Currently `vitest.config.ts` sets `environment: 'node'`. **Per-file override** (`// @vitest-environment happy-dom` at top of each component test file) OR install `happy-dom` and switch globally. Recommendation: per-file override to keep node tests fast.
- [ ] `.planning/phases/03-.../mobile-audit.md` — RDM methodology + iOS quirks documentation

## Project Constraints (from CLAUDE.md)

These are inviolable. The planner must verify each task respects them. Treat with same authority as locked CONTEXT.md decisions.

| Constraint | Source | Phase 3 Application |
|-----------|--------|---------------------|
| Tech stack: Observable Framework only | CLAUDE.md "Constraints" | All viz lives in `.md` cells + `.ts` modules; no React/Vue/Svelte intrusion |
| Language: TypeScript with `strict` + `noUncheckedIndexedAccess` | CLAUDE.md + Phase 1 D-16 | Every `monzo[i]`, `intervals[i]`, `kbm.keyMap[n]` MUST be guarded |
| Math precision: BigInt-backed Fraction (no prime-limit ceiling) | CLAUDE.md "Constraints" | `kbm.ts` uses `Number()` only at the audio-Hz boundary; all ratio math goes through `Interval` |
| Audio: in-browser only, Web Audio API | CLAUDE.md | No native synth bridge. `audioSession.type='playback'` is a Web API extension, still in-browser |
| Notation surface: ratios + cents + cent-deviation only | CLAUDE.md | Lattice node label = ratio; diamond cell tooltip = ratio + cents + prime-limit; keyboard label = signed cents-from-12tet. No staff engraving — explicit OOS |
| Distribution: static site, self-hostable | CLAUDE.md | All viz is client-side D3 + SVG. No server. Build artifact remains static. |
| Use `fraction.js@5.3.4` (exact pin); NEVER xen-dev-utils' Fraction | CLAUDE.md "Version Compatibility" + R-01 ESLint | `kbm.ts` imports `Fraction` from `fraction.js` directly when needed |
| Use `d3` 7.x for low-level viz; `ji-lattice` for lattice coords | CLAUDE.md "Recommended Stack" | Phase 3 lattice = D3 + ji-lattice. No bare numerical projection. |
| NEVER use Three.js for v1 lattice | CLAUDE.md "What NOT to Use" | 2D D3 + SVG only |
| NEVER use `tonal.js` for JI math | CLAUDE.md "What NOT to Use" | Use `xen-dev-utils` + project's own `monzo.ts` |
| `temperaments` and `mathjs` deny-listed | CLAUDE.md + Phase 1 D-21 | Phase 3 does not pull either |
| TS imports use `.js` extension even for `.ts` source | CLAUDE.md "Conventions" | `import { kbmToFrequencies } from './lib/kbm.js';` |
| No top-level `AudioContext` | CLAUDE.md "Conventions" | Existing `synth.ts` lazy-init preserved; Phase 3 does NOT regress this |

## Sources

### Primary (HIGH confidence)

- **`node_modules/ji-lattice/dist/index.d.ts`** (installed package, v0.3.2) — full type signatures for `spanLattice`, `Vertex`, `Edge`, `LatticeOptions`, `kraigGrady9`, `scottDakota24`, `primeRing72`, `align`. Verified by reading the file directly.
- **`node_modules/ji-lattice/dist/index.js`** (installed) — verified hard-coded `KRAIG_GRADY_X` / `KRAIG_GRADY_Y` arrays for primes 2..23 (lines 7-11) and the exact `xen-dev-utils` symbol imports (line 1).
- **`node_modules/ji-lattice/README.md`** — concrete `spanLattice` usage example with full output shape; copied verbatim into "Code Examples" Pattern 1.
- **`https://d3js.org/d3-zoom`** (D3 official docs) — `selection.call(d3.zoom().on("zoom", ...))` pattern, `event.transform`, `scaleExtent`, `translateExtent`, touch detection.
- **`https://github.com/d3/d3-zoom`** (D3 v7 source repo) — touch detection algorithm (`navigator.maxTouchPoints || 'ontouchstart' in this`).
- **`https://www.w3.org/TR/audio-session/`** — W3C Audio Session API explainer; full `AudioSessionType` enum, `'playback'` semantics.
- **`https://caniuse.com/mdn-api_navigator_audiosession`** — verified Safari iOS 16.4+ support; Chrome/Firefox no support.
- **`https://bugs.webkit.org/show_bug.cgi?id=237322`** — WebKit ringer-mute Web Audio bug, RESOLVED CONFIGURATION-CHANGED 2024-09-25; the `audioSession.type='playback'` solution is the recommended path.
- **`CLAUDE.md`** (project) — locked tech stack: ji-lattice 0.3.2, d3 7.9.0, fraction.js 5.3.4, sw-synth 0.4.0, xen-dev-utils 0.13.1; "What NOT to Use" deny-list.
- **`.planning/phases/03-.../03-CONTEXT.md`** — D-01 through D-25 verbatim; phase boundaries; reference-list.
- **`.planning/phases/03-.../03-UI-SPEC.md`** — copywriting + interaction contracts + accessibility requirements.
- **`.planning/REQUIREMENTS.md`** — VIZ-01..03, IO-03, AUDIO-06 definitions + Phase 3 traceability.
- **`.planning/research/PITFALLS.md`** (referenced) — Pitfall #1 (cents not source), #2 (AudioContext leak), #5 (don't reimplement xen-dev-utils), #7 (.kbm three-named-fields), #9 (polyphony explosion), #10 (mobile Safari quirks), #11 (reactive cell ordering), #13 (period-aware reduction), #16 (sub-cent precision).
- **Source code at `src/audio/synth.ts`, `src/components/scl-io.ts`, `src/components/audio-panel.ts`, `src/lib/scala.ts`, `src/lib/scale.ts`, `src/lib/interval.ts`, `src/lib/monzo.ts`, `src/lib/INVENTORY.md`** — confirmed actual existing patterns directly.

### Secondary (MEDIUM confidence)

- **`https://forum.modartt.com/viewtopic.php?id=5724`** (Modartt user forum, 2017) — complete `.kbm` example with line-by-line comments and field semantics; matches libscala-file's struct exactly.
- **`https://github.com/MarkCWirt/libscala-file`** (C++ Scala parser) — `struct kbm` definition: `map_size`, `first_note`, `last_note`, `middle_note`, `reference_note`, `reference_frequency`, `octave_degree`, `mapping`. Field order matches Modartt forum exactly.
- **`https://rnbo.cycling74.com/learn/scala-and-custom-tuning-reference`** (Cycling '74 docs) — `.kbm` semantics; "middle note" vs "reference note" distinction; mapping entry semantics; "-1 vs x" for unmapped (RNBO uses -1; Scala uses x).
- **`https://www.huygens-fokker.org/scala/scl_format.html`** — official `.scl` reference; `.kbm` documented separately.
- **`https://sevish.com/2017/mapping-microtonal-scales-keyboard-scala/`** — practical `.kbm` walkthrough with the size/formal-octave/per-key mapping fields; UI-style overview rather than file format spec, but confirms field meanings.
- **`https://developer.mozilla.org/en-US/docs/Web/API/Navigator/audioSession`** — MDN reference for `navigator.audioSession`; experimental status.
- **`https://github.com/feross/unmute-ios-audio` and `https://github.com/swevans/unmute`** — pre-2023 workaround libraries; documented as fallback context only.

### Tertiary (LOW confidence — not used for decisive claims)

- **`https://medium.com/@adactio/web-audio-api-update-on-ios-...`** — Jeremy Keith's chronological notes on iOS Web Audio; cross-reference for the historical `<audio>`-tag workaround; not authoritative for current behavior.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — every package version verified via `npm view` and/or `node_modules/` inspection 2026-05-05.
- Architecture: **HIGH** — three-layer pattern, factory contract, synth lifecycle all carry forward verbatim from Phase 2; CONTEXT.md decisions enumerate every ambiguity.
- ji-lattice API: **HIGH** — read directly from installed `dist/index.d.ts` and README.
- `.kbm` format: **MEDIUM-HIGH** — three independent sources (Modartt forum, libscala-file, RNBO) agree on the 7-field line order and field semantics. The one ambiguity (`formalOctave === 0` interpretation) is flagged in Assumptions A3/A4.
- Mobile Safari audio: **HIGH** — WebKit bug officially resolved 2024-09-25; Audio Session API verified via W3C TR + caniuse.
- d3-zoom usage: **HIGH** — official docs, current API.

**Research date:** 2026-05-05
**Valid until:** 2026-06-05 (30 days; stable ecosystem) — re-verify d3 / ji-lattice versions before Phase 3 execution if more than a month elapses.
