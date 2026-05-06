# Roadmap: Tuning Systems

## Overview

A research notebook + JI calculator built on Observable Framework. Five phases follow a strict dependency-ordered critical path: bootstrap the Framework project; build a pure math kernel anchored end-to-end by the in-progress composition page (the kernel-MVP that proves the architecture); add visualization plus the mobile Safari audio audit; then layer analysis features (EDO mappings, MOS, comparison, persistent URLs) once the foundations are solid. The temperament browser and other deep-theory work are explicitly v2 and not in this roadmap.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Bootstrap & Build** - Observable Framework scaffold, TS+Vitest, xen-dev stack installed, deployment target wired
- [x] **Phase 2: Math Kernel + Composition Anchor (MVP)** - Pure JI kernel, Scala I/O, audio playback, notes surface, composition page end-to-end (completed 2026-05-04)
- [ ] **Phase 3: Visualization + Mobile Audio Audit** - Lattice, tonality diamond, scale-on-keyboard, .kbm I/O, mobile Safari verified — gaps_found awaiting closure
- [ ] **Phase 4: Analysis & Sharing** - EDO ↔ JI mapping, MOS construction, scale comparison, persistent URLs

## Phase Details

### Phase 1: Bootstrap & Build
**Goal**: A deployable Observable Framework project with TypeScript type-checking, unit testing, the xenharmonic-devs stack installed, and a concrete static-site deployment target wired up — all the scaffolding required before any kernel code is written.
**Depends on**: Nothing (first phase)
**Requirements**: BOOT-01, BOOT-02, BOOT-03, BOOT-04, BOOT-05
**Success Criteria** (what must be TRUE):
  1. User can run `npm run dev` and see an Observable Framework site at localhost
  2. User can run `npm run build` and produce static output deployable to the chosen host
  3. User can run `npm run lint:types` and `npm run test` with both passing on a stub kernel module
  4. User can `import { Fraction } from "fraction.js"` and the BigInt-backed v5 resolves correctly via `xen-dev-utils`
  5. User can push to the configured deployment target (e.g., Cloudflare Pages) and see the static site live
**Plans**: 4 plans
  - [x] 01-01-PLAN.md — Bootstrap Framework scaffold, package.json with D-13 scripts, .nvmrc, .gitignore, README (BOOT-01)
  - [x] 01-02-PLAN.md — Configure TypeScript (D-16 strict), Vitest (D-07 colocated), ESLint 9 flat (D-12), Prettier; stub kernel module + test (BOOT-02, BOOT-03)
  - [x] 01-03-PLAN.md — Install xen-dev stack (xen-dev-utils, sw-synth, ji-lattice, sonic-weave) + exact-pin fraction.js@5.3.4; write D-14 hello page (BOOT-04)
  - [x] 01-04-PLAN.md — GitHub Actions workflow per D-02/D-03/D-05 wiring CI gates + Pages deploy on push to main (BOOT-01, BOOT-02, BOOT-03, BOOT-05)

### Phase 2: Math Kernel + Composition Anchor (MVP)
**Goal**: The full kernel-MVP — pure `Interval`/`Scale` math, Scala `.scl` round-trip I/O, Web Audio playback with proper lifecycle, the Markdown+widgets notes surface, and a composition dashboard page that exercises every kernel feature end-to-end. This phase is the architectural proof; if the composition page works, the kernel works.
**Depends on**: Phase 1
**Requirements**: MATH-01, MATH-02, MATH-03, MATH-04, MATH-05, MATH-06, SCALE-01, SCALE-02, SCALE-03, SCALE-04, SCALE-05, IO-01, IO-02, IO-04, IO-05, AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05, NOTES-01, NOTES-02, NOTES-03, NOTES-04, NOTES-05, COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. User can open the composition page, see the piece's scale as a ratios + cents-from-12tet table, click play to audition any interval, arpeggiate the full scale, hold a drone, and download the scale as a valid `.scl` file
  2. User can construct any JI ratio (including `81/79` and far larger) from text input and have it round-trip exactly through ratio → monzo → ratio with no precision loss
  3. User can read a second theory page (e.g., syntonic comma) with KaTeX-typeset math and inline `${playInterval(...)}` widgets that share the same kernel and audio synth
  4. User can re-import any `.scl` file the project produces and get a Scale equal to the original (verified by golden tests against the Huygens-Fokker archive samples)
  5. User can edit a cell repeatedly during `observable preview` without leaking AudioContexts (count stays at 1) and without orphaning voices when navigating away
**Plans**: 7 plans across 5 waves
  - Wave 1 (parallel): 02-01, 02-02
  - Wave 2 (parallel): 02-03, 02-05
  - Wave 3: 02-04 (needs Scale from 02-03)
  - Wave 4: 02-06 (consumes everything from waves 1–3)
  - Wave 5: 02-07 (dashboard + theory page integration)
  - [x] 02-01-PLAN.md — Wave 1 — KaTeX wiring + Vitest test glob extension + R-01 ESLint rule + Phase-1 stub deletion + .scl fixture corpus (NOTES-02, IO-05)
  - [x] 02-02-PLAN.md — Wave 1 — Math kernel: Interval (BigInt-backed Fraction), monzo helpers, cents projections, named-commas table (MATH-01..06)
  - [x] 02-03-PLAN.md — Wave 2 — Scale model: rotate, reduce (period-aware), dedupe, transpose, degreeToFreq, jiSubsetOfEdo (SCALE-02..05)
  - [x] 02-04-PLAN.md — Wave 3 — Scala I/O: parseScala (D-12 shared body parser), parseScl, writeScl, scalaToCsv + 21-fixture test corpus (SCALE-01, IO-01/02/04/05) — depends on 02-03 (imports `Scale`)
  - [x] 02-05-PLAN.md — Wave 2 — Audio: createSynth lifecycle wrapper over sw-synth (lazy AudioContext, voice tracking, polyphony cap, ADSR, dispose) (AUDIO-01..05)
  - [x] 02-06-PLAN.md — Wave 4 — Components: 6 DOM-factory widgets (playInterval/playScale/scaleTable/ratioPill/audioPanel/sclIo) + colocated CSS + INVENTORY consolidation (NOTES-01..04)
  - [x] 02-07-PLAN.md — Wave 5 — Dashboard at src/index.md + syntonic-comma theory page + COMP-03 integration test (NOTES-01..05, COMP-01..03)
**UI hint**: yes

### Phase 3: Visualization + Mobile Audio Audit
**Goal**: Add the visual layer — D3-backed lattice with configurable prime basis, configurable-odd-limit tonality diamond, scale-on-keyboard SVG — plus the `.kbm` I/O that pairs with `.scl`, and verify mobile Safari audio actually works (the long-deferred quirk audit). After this phase, the kernel has a complete visual surface and audio is portable.
**Depends on**: Phase 2
**Requirements**: VIZ-01, VIZ-02, VIZ-03, IO-03, AUDIO-06
**Success Criteria** (what must be TRUE):
  1. User can render any `Scale` as a 2D lattice with a chosen prime basis (e.g., `[3, 5, 7]`) and pan/zoom the SVG
  2. User can view a tonality diamond at any odd-limit (7, 11, 13, 21, 31, 81) without hardcoded constants
  3. User can see a scale's pitches mapped onto a piano-keyboard SVG with cents-offset labels
  4. User can export and re-import a `.kbm` keyboard mapping where `referenceKey ≠ middleNote` (the three named fields are explicit, never conflated)
  5. User can open the composition page on iPhone Safari, tap a play button, and hear the interval (mute switch and autoplay-policy quirks documented)
**Plans**: 7 plans across 5 waves (incl. gap closure)
  - Wave 1: 03-01 (setup: install d3, scaffold tests, seed kbm fixtures)
  - Wave 2 (parallel): 03-02 (kbm.ts + diamond.ts kernels), 03-03 (synth.ts mobile-Safari fixes)
  - Wave 3 (parallel): 03-04 (lattice component), 03-05 (tonality-diamond + keyboard components)
  - Wave 4: 03-06 (extend sclIo + integrate dashboard + INVENTORY + mobile-audit.md + human verify)
  - Wave 5 (gap closure): 03-07 (CR-01 diamond layout fix + CR-02 arpeggio panic fix + mobile-audit footer signature)
  - [x] 03-01-PLAN.md — Wave 0 setup: install d3@7.9.0 + @types/d3, extend vitest test glob, scaffold 5 RED test files, seed 4 .kbm fixtures (VIZ-01, VIZ-02, VIZ-03, IO-03, AUDIO-06)
  - [x] 03-02-PLAN.md — kbm.ts (parseKbm/writeKbm/kbmToFrequencies/defaultKbmFor/KbmMapping) + diamond.ts (enumerateDiamond) — pure-data kernel modules (IO-03, VIZ-02)
  - [x] 03-03-PLAN.md — synth.ts mobile-Safari fixes: navigator.audioSession.type='playback', sync ctx.resume(), visibilitychange listener with cleanup (AUDIO-06)
  - [x] 03-04-PLAN.md — lattice.ts component: D3 + ji-lattice 2D viz + d3.zoom + click-to-audition + deriveLatticeBasis (VIZ-01)
  - [x] 03-05-PLAN.md — tonality-diamond.ts + keyboard.ts components: hand-laid SVG + d3.zoom (diamond) + pointerdown/up sustain (keyboard) (VIZ-02, VIZ-03)
  - [x] 03-06-PLAN.md — Integration: extend sclIo (.scl + .kbm), wire dashboard cells (Esc + Stop + effectiveBaseHz + viz widgets), styles.css updates, INVENTORY.md, mobile-audit.md, human-verify on Safari RDM (VIZ-01, VIZ-02, VIZ-03, IO-03, AUDIO-06)
  - [x] 03-07-PLAN.md — Gap closure: preserve (i, j) on DiamondCell + use it in tonality-diamond layout (CR-01); track arpeggio setTimeout queue + clear on panic/dispose (CR-02); backfill mobile-audit.md verifier/date footer; +3 regression tests (VIZ-02, AUDIO-06)
**UI hint**: yes

### Phase 4: Analysis & Sharing
**Goal**: The analysis features that extend the kernel into theory-research territory — EDO ↔ JI mapping (best EDO for a JI scale; best JI in an EDO), MOS / generator-period scale construction, side-by-side scale comparison, and shareable scale URLs via hash encoding. None of these block the composition; all of them deepen the notebook.
**Depends on**: Phase 3
**Requirements**: ANAL-01, ANAL-02, ANAL-03, ANAL-04
**Success Criteria** (what must be TRUE):
  1. User can pick a JI scale and see a ranked table of best-fit EDOs (and inversely, pick an EDO and see its best JI approximations)
  2. User can construct a MOS scale by specifying generator + period and have it appear with the same `Scale` API as any hand-built scale
  3. User can place two scales side-by-side and see degree-by-degree cents, common subset, and max deviation
  4. User can share a URL whose hash encodes a scale, and the recipient lands on a page seeded with that exact scale
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bootstrap & Build | 4/4 | Complete | 2026-05-03 |
| 2. Math Kernel + Composition Anchor (MVP) | 7/7 | Complete   | 2026-05-04 |
| 3. Visualization + Mobile Audio Audit | 6/6 | Gaps found (3/5 must-haves) | - |
| 4. Analysis & Sharing | 0/TBD | Not started | - |
