# Requirements: Tuning Systems — v1.1 Scale Generation & Library

**Defined:** 2026-06-08
**Core Value:** I can design any JI scale (arbitrary ratios, no prime-limit ceiling), see it expressed as ratios and cents-from-12tet, hear it, and export it to Scala `.scl`/`.kbm` — all from a self-hosted notebook where the calculator and the research prose live together.

**Milestone goal:** A dedicated Generate surface where the user produces JI / tempered / harmonic scales by many methods and loads named scales from the Scala archive — auditioning any result and pushing it live into the Dashboard and Analysis.

**Design inputs:** `.planning/quick/260608-dyv-scale-generation/260608-dyv-{RESEARCH,PLAN}.md` (method/UI/integration research + wave plan). Key finding: `sonic-weave@0.14.1` already installed → the hard tempered/lattice methods are thin wrappers; zero new npm deps.

## v1.1 Requirements

Requirements for this milestone. Each maps to exactly one roadmap phase.

### SURF — Generate Surface

- [ ] **SURF-01**: User can open a dedicated Generate page (`/pages/generate`) from the site nav
- [ ] **SURF-02**: User can choose a generation method from a family-grouped picker; the parameter panel swaps to that method's inputs
- [ ] **SURF-03**: User sees a live preview table and can audition (play) the current generated scale as parameters change
- [x] **SURF-04**: User can rotate the generated scale to any mode and apply reduce / dedupe / transpose before exporting
- [x] **SURF-05**: User can view a circle-of-pitches visualization of the generated scale
- [x] **SURF-06**: Tempered scales (EDO, rank-2, well-temperament) are visibly distinguished from exact-JI scales — cents-primary with a "tempered" label; no float-derived ratios presented as exact JI

### GEN — Scale Generators

- [x] **GEN-01**: User can generate a Combination Product Set (CPS) from a factor set and choose-k, with Hexany / Dekany / Eikosany presets
- [x] **GEN-02**: User can generate harmonic and subharmonic segment scales over a chosen harmonic range
- [x] **GEN-03**: User can generate an arithmetic-division-of-the-octave (ADO) scale and isoharmonic chords
- [x] **GEN-04**: User can generate a tonality-diamond scale, an odd/prime-limit JI set, and a Farey / Stern-Brocot subset
- [x] **GEN-05**: User can generate an EDO and an equal-division-of-any-interval (ED-n) scale
- [x] **GEN-06**: User can generate a rank-2 regular-temperament scale (generator + period, with optimal tunings) — advances parked TEMP-01
- [x] **GEN-07**: User can generate a well-temperament scale (per-fifth comma tempering)
- [x] **GEN-08**: User can generate a Fokker periodicity-block scale — delivers parked TEMP-08
- [x] **GEN-09**: User can enter a free-text SonicWeave expression and compile it to a scale — delivers parked TEMP-07
- [x] **GEN-10**: User can generate Wilson recurrence / metallic-ratio (Mt. Meru) and constant-structure scales

### SYNC — Live Shared-State Integration

- [ ] **SYNC-01**: User can send a generated scale to the Dashboard ("Send to Dashboard") and it loads there live
- [ ] **SYNC-02**: User can send a generated scale to the Analysis page ("Send to Analysis") and it loads there live
- [ ] **SYNC-03**: A sent scale persists across reload via the shared store and the existing `#s=` deep-link hash
- [ ] **SYNC-04**: Existing Dashboard / Analysis behavior is byte-identical when no scale has been sent (empty-store boot regression guard)

### LIB — Scala Archive Browser

- [x] **LIB-01**: User can browse and search named scales from the bundled Scala archive within the Generate surface — delivers parked TEMP-09
- [ ] **LIB-02**: User can load a selected archive scale into the preview and audition it
- [ ] **LIB-03**: User can send a loaded archive scale to the Dashboard / Analysis like any generated scale

## v2 Requirements

Deferred to a future milestone. Tracked but not in this roadmap.

### TEMP — Remaining Temperament / Deep-Theory items

- **TEMP-02**: Ratio-to-comma decomposition
- **TEMP-03**: Plomp-Levelt dissonance curve
- **TEMP-04**: Citations / bibliography across pages (largely delivered ad-hoc via quick task 260513-d2e; not milestone-tracked)
- **TEMP-05**: Harmonic entropy (and harmonic-entropy-guided scale selection — needs the `harmonic-entropy` dependency)
- **TEMP-06**: 3D lattice rendering
- **TEMP-10**: MIDI Tuning Standard / hardware-synth bridge

### GEN-NEXT — Generation methods deferred from v1.1

- **GENX-01**: Tetrachordal (Chalmers) scale builder — lower demand; defer
- **GENX-02**: Temperament *finder* (search-by-constraints, x31eq-style ranked results → instantiate) — v1.1 ships generator forms, not a search engine

## Out of Scope

Explicitly excluded for v1.1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Any new npm dependency | Research confirmed the recommended path needs none (`sonic-weave`/`xen-dev-utils`/`fraction.js` already installed); adding deps is regression/peer-dep risk |
| Upgrading `xen-dev-utils` past 0.13.1 | `ji-lattice@0.3.2` peers `^0.12.2`; all needed APIs exist in 0.13.1; upgrade is out-of-scope regression risk |
| Harmonic-entropy-guided generation | Needs the `harmonic-entropy` dependency (parked TEMP-05); research-grade — deferred |
| Cross-tab live sync (native `storage` event) | Single-tab same-document `CustomEvent` covers the requirement (theme-prefs precedent); cross-tab is additive and deferred |
| Rewriting / refactoring the existing Dashboard or Analysis page logic | Integration must be strictly additive — existing boot/hash/textarea code paths stay unchanged (SYNC-04 guards this) |
| Engraved JI staff notation (HEJI2 / Sagittal / Johnston) | Carried v1.0 exclusion — ratio + cent-deviation display only |
| Generic public competitor to Scale Workshop / x31eq | Carried v1.0 exclusion — personal research notebook that happens to be shareable, not a tool to replace community tools |

## Traceability

Which phases cover which requirements. Populated during roadmap creation (v1.1 phases continue numbering from v1.0's Phase 4).

| Requirement | Phase | Status |
|-------------|-------|--------|
| SURF-01 | Phase 5 | Pending |
| SURF-02 | Phase 5 | Pending |
| SURF-03 | Phase 5 | Pending |
| SURF-04 | Phase 8 | Complete |
| SURF-05 | Phase 8 | Complete |
| SURF-06 | Phase 6 | Complete |
| GEN-01 | Phase 6 | Complete |
| GEN-02 | Phase 6 | Complete |
| GEN-03 | Phase 6 | Complete |
| GEN-04 | Phase 6 | Complete |
| GEN-05 | Phase 6 | Complete |
| GEN-06 | Phase 7 | Complete |
| GEN-07 | Phase 7 | Complete |
| GEN-08 | Phase 7 | Complete |
| GEN-09 | Phase 7 | Complete |
| GEN-10 | Phase 8 | Complete |
| SYNC-01 | Phase 5 | Pending |
| SYNC-02 | Phase 5 | Pending |
| SYNC-03 | Phase 5 | Pending |
| SYNC-04 | Phase 5 | Pending |
| LIB-01 | Phase 9 | Complete |
| LIB-02 | Phase 9 | Pending |
| LIB-03 | Phase 9 | Pending |

**Coverage:**
- v1.1 requirements: 23 total
- Mapped to phases: 23 ✓ (Phase 5: 7 · Phase 6: 6 · Phase 7: 4 · Phase 8: 3 · Phase 9: 3)
- Unmapped: 0 ✓ (every v1.1 requirement maps to exactly one phase)

---
*Requirements defined: 2026-06-08*
*Last updated: 2026-06-08 after roadmap creation (Phases 5–9 mapped; 100% coverage)*
</content>
