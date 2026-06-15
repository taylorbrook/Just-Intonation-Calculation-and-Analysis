# Roadmap: Tuning Systems

## Overview

A research notebook + JI calculator built on Observable Framework. v1.0 shipped a four-phase critical path: bootstrap the Framework project; build a pure math kernel anchored end-to-end by a composition page; add visualization plus the mobile Safari audio audit; then layer analysis features (EDO mappings, MOS, comparison, persistent URLs).

v1.1 shipped a dedicated **Generate** surface where the user produces JI / tempered / harmonic scales by ~20 methods and loads named scales from the Scala archive — auditioning any result and pushing it live into the Dashboard and Analysis. An additive integration foundation landed first (with an empty-store boot-equivalence regression gate so the working pages stay byte-identical), then three generator tranches (exact-rational → SonicWeave-wrapped tempered/lattice → preview/transforms/advanced), then a self-contained Scala archive browser. Zero new npm dependencies — `sonic-weave@0.14.1` was already installed and covered the hard tempered/lattice methods as thin wrappers.

## Milestones

- ✅ **v1.0 MVP** — Phases 1–4 (shipped 2026-05-07) — full archive at [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Scale Generation & Library** — Phases 5–9 (shipped 2026-06-14) — full archive at [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

_Next milestone: run `/gsd-new-milestone`._

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

<details>
<summary>✅ v1.1 Scale Generation & Library (Phases 5–9) — SHIPPED 2026-06-14</summary>

**Milestone Goal:** A dedicated Generate surface where the user produces JI / tempered / harmonic scales by many methods and loads named scales from the Scala archive — auditioning any result and pushing it live into the Dashboard and Analysis.

- [x] **Phase 5: Generate Surface & Live Integration Foundation** (3/3 plans) — completed 2026-06-09 — the `/pages/generate` tab, the additive `scale-store`, and the empty-store boot-equivalence gate
- [x] **Phase 6: Exact-Rational JI & Harmonic Generators** (7/7 plans) — completed 2026-06-10 — CPS, harmonic/subharmonic/ADO/isoharmonic, diamond/odd/prime/Farey sets, EDO/ED-n
- [x] **Phase 7: SonicWeave Adapter — Tempered, Lattice & Free-Text** (6/6 plans) — completed 2026-06-12 — rank-2, well-temperament, Fokker blocks, and a free-text SonicWeave escape hatch
- [x] **Phase 8: Preview, Transforms & Advanced Generators** (4/4 plans) — completed 2026-06-14 — circle-of-pitches viz, rotate/reduce/dedupe/transpose strip, tempered distinction, Wilson/metallic + constant-structure
- [x] **Phase 9: Scala Archive Browser** (3/3 plans) — completed 2026-06-14 — browse / search / load named scales from the bundled Scala archive into the Generate surface

Full v1.1 phase details, success criteria, and per-plan breakdown: [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md).
Full v1.1 requirements (23, all complete): [milestones/v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md).

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Bootstrap & Build                       | v1.0 | 4/4 | Complete | 2026-05-03 |
| 2. Math Kernel + Composition Anchor (MVP)  | v1.0 | 7/7 | Complete | 2026-05-04 |
| 3. Visualization + Mobile Audio Audit      | v1.0 | 7/7 | Complete | 2026-05-06 |
| 4. Analysis & Sharing                      | v1.0 | 7/7 | Complete | 2026-05-06 |
| 5. Generate Surface & Live Integration Foundation | v1.1 | 3/3 | Complete | 2026-06-09 |
| 6. Exact-Rational JI & Harmonic Generators | v1.1 | 7/7 | Complete | 2026-06-10 |
| 7. SonicWeave Adapter — Tempered, Lattice & Free-Text | v1.1 | 6/6 | Complete | 2026-06-12 |
| 8. Preview, Transforms & Advanced Generators | v1.1 | 4/4 | Complete | 2026-06-14 |
| 9. Scala Archive Browser                   | v1.1 | 3/3 | Complete | 2026-06-14 |
