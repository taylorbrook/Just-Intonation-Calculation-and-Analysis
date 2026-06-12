# Roadmap: Tuning Systems

## Overview

A research notebook + JI calculator built on Observable Framework. v1.0 shipped a four-phase critical path: bootstrap the Framework project; build a pure math kernel anchored end-to-end by a composition page; add visualization plus the mobile Safari audio audit; then layer analysis features (EDO mappings, MOS, comparison, persistent URLs).

v1.1 adds a dedicated **Generate** surface where the user produces JI / tempered / harmonic scales by many methods and loads named scales from the Scala archive — auditioning any result and pushing it live into the Dashboard and Analysis. The work follows the 260608-dyv wave plan: an additive integration foundation lands first (with an empty-store boot-equivalence regression gate so the working pages stay byte-identical), then three generator tranches (exact-rational → SonicWeave-wrapped tempered/lattice → preview/transforms/advanced), then a self-contained Scala archive browser. Zero new npm dependencies — `sonic-weave@0.14.1` is already installed and covers the hard tempered/lattice methods as thin wrappers.

## Milestones

- ✅ **v1.0 MVP** — Phases 1–4 (shipped 2026-05-07) — full archive at [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Scale Generation & Library** — Phases 5–9 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (5.1, 5.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 MVP (Phases 1–4) — SHIPPED 2026-05-07</summary>

- [x] **Phase 1: Bootstrap & Build** (4/4 plans) — completed 2026-05-03
- [x] **Phase 2: Math Kernel + Composition Anchor (MVP)** (7/7 plans) — completed 2026-05-04
- [x] **Phase 3: Visualization + Mobile Audio Audit** (7/7 plans) — completed 2026-05-06 (gap-closure plan 03-07 fixed CR-01 + CR-02 + signed mobile-audit footer; one deferred RDM smoke-test re-walk recorded in STATE.md)
- [x] **Phase 4: Analysis & Sharing** (7/7 plans) — completed 2026-05-06

Full v1.0 phase details, success criteria, and per-plan breakdown: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md).
Full v1.0 requirements (42, all complete): [milestones/v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md).

</details>

### 🚧 v1.1 Scale Generation & Library (In Progress)

**Milestone Goal:** A dedicated Generate surface where the user produces JI / tempered / harmonic scales by many methods and loads named scales from the Scala archive — auditioning any result and pushing it live into the Dashboard and Analysis.

- [x] **Phase 5: Generate Surface & Live Integration Foundation** - The `/pages/generate` tab, the additive `scale-store`, and the empty-store boot-equivalence gate (completed 2026-06-09)
- [x] **Phase 6: Exact-Rational JI & Harmonic Generators** - CPS, harmonic/subharmonic/ADO/isoharmonic, diamond/odd/prime/Farey sets, EDO/ED-n (completed 2026-06-10)
- [ ] **Phase 7: SonicWeave Adapter — Tempered, Lattice & Free-Text** - Rank-2, well-temperament, Fokker blocks, and a free-text SonicWeave escape hatch
- [ ] **Phase 8: Preview, Transforms & Advanced Generators** - Circle-of-pitches viz, rotate/reduce/dedupe/transpose strip, tempered distinction, Wilson/metallic + constant-structure
- [ ] **Phase 9: Scala Archive Browser** - Browse / search / load named scales from the bundled Scala archive into the Generate surface

## Phase Details

### Phase 5: Generate Surface & Live Integration Foundation
**Goal**: A new `/pages/generate` tab exists with a family-grouped method picker, live preview, and audition; a pure additive `scale-store` lets the user push a generated scale live into the Dashboard and Analysis — without changing how those pages boot when nothing has been sent.
**Depends on**: Phase 4 (the Dashboard + Analysis pages, the `#s=` hash codec, and the `theme-prefs` precedent this store mirrors)
**Requirements**: SURF-01, SURF-02, SURF-03, SYNC-01, SYNC-02, SYNC-03, SYNC-04
**Success Criteria** (what must be TRUE):
  1. User can open a "Generate" page from the site nav (between Analysis and Theory notes) that renders a synth-owning page, a family-grouped method picker, and empty params + preview hosts.
  2. User can choose a method from the picker and see the parameter panel swap, see a live preview table, and audition (play) the current scale as parameters change.
  3. User can click "Send to Dashboard" or "Send to Analysis" and the generated scale loads live on that page, persisting across reload via the shared store and the existing `#s=` deep-link hash.
  4. With no scale ever sent (empty store), Dashboard and Analysis boot byte-identically to v1.0 — proven by the R1 empty-store boot-equivalence regression test, which is RED→GREEN before any "Send to…" wiring exists.
  5. Data flow is strictly one-way: only "Send to…" writes the store; consumer pages only read at boot and listen for the change event (no write-back, no feedback loop).
**Plans**: 3 plans (2 waves)
  - [x] 05-01-PLAN.md — Pure additive `scale-store` (constants, read/write/validate/cap, CustomEvent, `resolveInitialScaleText`) + the R1 empty-store boot-equivalence gate (RED→GREEN first) [Wave 1, TDD]
  - [x] 05-02-PLAN.md — `generate.md` synth-owning page: family-grouped picker, params/preview host swap, one live reference method, audition, Send-to buttons + nav registration [Wave 2]
  - [x] 05-03-PLAN.md — Additive consumer opt-in on Dashboard + Analysis (boot via `resolveInitialScaleText`, textarea split, scale-changed listener; one-way data flow) [Wave 2, gated by R1]

### Phase 6: Exact-Rational JI & Harmonic Generators
**Goal**: The JI core the user cares about most ships as transparent, BigInt-exact kernel primitives, each surfaced as a method widget in the picker — plus the first tempered family (EDO/ED-n), which establishes the "tempered, not laundered JI" representation.
**Depends on**: Phase 5 (the picker host, preview area, synth, and "Send to…" plumbing)
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, SURF-06
**Success Criteria** (what must be TRUE):
  1. User can generate a CPS from a factor set and choose-k, with Hexany / Dekany / Eikosany presets — the 1-3-5-7 Hexany matches its canonical exact set, deduped by BigInt ratio (never cents tolerance).
  2. User can generate harmonic and subharmonic segment scales, an ADO scale, and isoharmonic chords — each with exact integer-derived ratios.
  3. User can generate a tonality-diamond scale, an odd/prime-limit JI set, and a Farey / Stern-Brocot subset — exact and deduped.
  4. User can generate an EDO and an equal-division-of-any-interval (ED-n) scale, and these tempered scales are visibly distinguished from exact JI (a "tempered" label, cents-primary presentation) with no float-derived ratios presented as exact JI.
  5. Every generated scale auditions and can be sent to Dashboard / Analysis (tempered scales serialize as cents-per-line text).
**Plans**: 7 plans
- [x] 06-01-PLAN.md — CPS kernel primitive (cps.ts): hand-rolled BigInt-exact Combination Product Set + Hexany/Dekany/Eikosany presets
- [x] 06-02-PLAN.md — Harmonic-family kernel (harmonic.ts): harmonic/subharmonic segment, ADO, isoharmonic + reduce-to-octave flag
- [x] 06-03-PLAN.md — Generators kernel (generators.ts): diamond/odd-limit/prime-limit/Farey exact JI sets + edScale (tempered EDO/ED-n)
- [x] 06-04-PLAN.md — Tempered scale-table variant: cents-only (no ratio column) + "tempered" badge (SURF-06 presentation)
- [x] 06-05-PLAN.md — CPS method widget (generate-cps.ts): factor-set chip input + presets + picker wiring
- [x] 06-06-PLAN.md — Harmonic-family method widget (generate-harmonic.ts): 4 sub-methods + reduce toggle + picker wiring (preserves default landing)
- [x] 06-07-PLAN.md — JI-set + EDO/ED-n widgets (generate-ji-set.ts, generate-ed.ts): exact JI sets + tempered EDO/ED-n with badge + cents-per-line Send-to

### Phase 7: SonicWeave Adapter — Tempered, Lattice & Free-Text
**Goal**: The genuinely advanced methods (rank-2 with optimal tunings, well-temperaments, Fokker periodicity blocks) ship as thin, well-tested wrappers over the already-installed `sonic-weave` prelude via a single kernel adapter, plus a free-text SonicWeave escape hatch — delivering parked TEMP-01, TEMP-07, and TEMP-08.
**Depends on**: Phase 5 (the picker host and "Send to…"). Independent of Phase 6.
**Requirements**: GEN-06, GEN-07, GEN-08, GEN-09
**Success Criteria** (what must be TRUE):
  1. User can generate a rank-2 regular-temperament scale (generator + period, with optimal-tuning options); a pure-ratio rank-2 reproduces the Pythagorean diatonic exactly (cross-checked against the kernel's `buildMos`), and a tempered rank-2 is flagged tempered with cents as source.
  2. User can generate a well-temperament scale (per-fifth comma tempering), presented as tempered (cents-primary, badged).
  3. User can generate a Fokker periodicity-block scale whose cardinality matches the chosen basis extents, rendered as exact rational ratios.
  4. User can enter a free-text SonicWeave expression and compile it to a scale, with malformed input surfacing a safe error in a status region without destroying the prior preview.
  5. At the adapter boundary, every rational SonicWeave result round-trips into the kernel's BigInt `Interval` via the `n/d` string (R-01 ESLint stays green); tempered results carry cents and are flagged, never laundered as exact JI.
**Plans**: 4 plans (3 waves)
- [x] 07-01-PLAN.md — `sonicweave.ts` adapter (`scaleFromSonicWeave`, `isFractional()` discriminator + R-01 round-trip + cents-of-record) + `fokker.ts` `fokkerCardinality` |det| helper (TDD) [Wave 1]
- [x] 07-02-PLAN.md — rank-2 (GEN-06, quarter-comma default) + well-temperament (GEN-07, Vallotti default + D-08 roster) widgets under "Regular" [Wave 2]
- [x] 07-03-PLAN.md — Fokker periodicity-block (GEN-08, basis+comma modes, live |det| readout) + free-text SonicWeave (GEN-09, evaluate-on-click, raw errors) widgets [Wave 2]
- [ ] 07-04-PLAN.md — register all four widgets in `generate.md` (optgroups, swaps, Send-to serialization) + CSS imports + human-verify [Wave 3]

### Phase 8: Preview, Transforms & Advanced Generators
**Goal**: The "shape at a glance" preview and the cheap polish that applies to every generator — a circle-of-pitches visualization and a rotate-to-mode + reduce/dedupe/transpose strip — plus the remaining advanced generators (Wilson recurrence / metallic, constant-structure), with the tempered-vs-JI distinction enforced consistently across all families.
**Depends on**: Phase 5 plus at least one scale-producing tranche (Phase 6 and/or Phase 7); the constant-structure sub-method depends on Phase 7's SonicWeave adapter.
**Requirements**: SURF-04, SURF-05, GEN-10
**Success Criteria** (what must be TRUE):
  1. User can view a circle-of-pitches visualization of the current generated scale — degree markers placed at their cents angle, rim labels, click-to-audition — for any method's result, with a safe empty-state.
  2. User can rotate the generated scale to any mode and apply reduce / dedupe / transpose before exporting, and the transformed scale is what "Send to…" serializes.
  3. User can generate a Wilson recurrence / metallic-ratio (Mt. Meru) scale and a constant-structure scale — recurrence convergents are exact rational, the metallic limit carries cents and is flagged tempered.
  4. The circle viz and transform strip apply uniformly to every generator family's output (JI and tempered alike), reinforcing the tempered label rather than masking it.
**Plans**: TBD
**UI hint**: yes

### Phase 9: Scala Archive Browser
**Goal**: A self-contained capability to browse, search, and load named scales from the bundled Scala archive directly into the Generate surface — auditioning a loaded scale and sending it onward like any generated scale — delivering parked TEMP-09.
**Depends on**: Phase 5 (the Generate surface, preview/audition, and "Send to…"). Independent of the generator tranches (Phases 6–8).
**Requirements**: LIB-01, LIB-02, LIB-03
**Success Criteria** (what must be TRUE):
  1. User can browse and search named scales from the bundled Scala archive within the Generate surface.
  2. User can load a selected archive scale into the preview and audition it.
  3. User can send a loaded archive scale to the Dashboard / Analysis exactly like any generated scale (same store + `#s=` path).
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6 → 7 → 8 → 9. Phases 6 and 7 are mutually independent (either can run first); Phase 8 needs at least one of them; Phase 9 needs only Phase 5.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Bootstrap & Build                       | v1.0 | 4/4 | Complete    | 2026-05-03 |
| 2. Math Kernel + Composition Anchor (MVP)  | v1.0 | 7/7 | Complete    | 2026-05-04 |
| 3. Visualization + Mobile Audio Audit      | v1.0 | 7/7 | Complete    | 2026-05-06 |
| 4. Analysis & Sharing                      | v1.0 | 7/7 | Complete    | 2026-05-06 |
| 5. Generate Surface & Live Integration Foundation | v1.1 | 3/3 | Complete   | 2026-06-09 |
| 6. Exact-Rational JI & Harmonic Generators | v1.1 | 7/7 | Complete   | 2026-06-10 |
| 7. SonicWeave Adapter — Tempered, Lattice & Free-Text | v1.1 | 3/4 | In Progress|  |
| 8. Preview, Transforms & Advanced Generators | v1.1 | 0/TBD | Not started | - |
| 9. Scala Archive Browser                   | v1.1 | 0/TBD | Not started | - |
</content>
</invoke>
