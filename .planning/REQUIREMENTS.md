# Requirements: Tuning Systems

**Defined:** 2026-05-02
**Core Value:** I can design any JI scale (arbitrary ratios, no prime-limit ceiling), see it expressed as ratios and cents-from-12tet, hear it, and export it to Scala `.scl`/`.kbm` — all from a self-hosted notebook where the calculator and the research prose live together.

## v1 Requirements

### BOOT — Bootstrap & Build

- [x] **BOOT-01**: Observable Framework project scaffolded; static-site build is deployable
- [x] **BOOT-02**: TypeScript with `tsc --noEmit` running in CI (Framework transpiles but doesn't type-check)
- [x] **BOOT-03**: Vitest configured and running for kernel unit tests
- [x] **BOOT-04**: xenharmonic-devs stack installed and resolved (`xen-dev-utils`, `sw-synth`, `ji-lattice`, `sonic-weave`, `fraction.js` v5)
- [x] **BOOT-05**: Concrete static-site deployment target chosen and wired (e.g. Cloudflare Pages)

### MATH — JI Math Kernel

- [x] **MATH-01**: Arbitrary-precision `Interval` (BigInt-backed Fraction) — any ratio (e.g. `81/79`) round-trips exactly with no prime-limit ceiling
- [x] **MATH-02**: Lazy monzo (prime-factor vector) computation from any `Interval`
- [x] **MATH-03**: Cents conversion + signed cent-deviation-from-12tet display (display projection only — not source of truth in kernel)
- [x] **MATH-04**: Interval arithmetic — multiply, divide, invert, octave-reduce, complement-to-octave (preserves exact rationals)
- [x] **MATH-05**: Complexity metrics — Tenney height, Benedetti height, prime-limit, odd-limit
- [x] **MATH-06**: Named-comma identification by canonical monzo (lookup table; never cents-within-epsilon)

### SCALE — Scale Construction

- [ ] **SCALE-01**: Build `Scale` from text input accepting mixed ratios / cents / monzos
- [ ] **SCALE-02**: Sort, deduplicate, octave-reduce a scale (period-aware, not just `2/1`)
- [ ] **SCALE-03**: Mode rotation (rotate scale degrees)
- [ ] **SCALE-04**: Transpose scale by interval
- [ ] **SCALE-05**: Construct JI subset of an EDO

### IO — Import / Export

- [ ] **IO-01**: Parse Scala `.scl` files — handles ratios, cents, comments, implicit `1/1`, period-by-`.`-detection
- [ ] **IO-02**: Serialize `Scale` to `.scl`
- [ ] **IO-03**: Parse and serialize `.kbm` keyboard mappings (`KbmMapping` keeps `referenceKey`/`referenceHz`/`middleNote` as named fields)
- [ ] **IO-04**: Copy ratios + cent-deviation-from-12tet table to clipboard
- [x] **IO-05**: Round-trip golden tests against Huygens-Fokker `.scl` archive samples

### AUDIO — Web Audio Playback

- [ ] **AUDIO-01**: Lazy `AudioContext` wrapped in `createSynth()` factory; disposed via Framework `invalidation` (no leaks under hot-reload)
- [ ] **AUDIO-02**: Click-to-play interval with ADSR envelope (no clicks / pops)
- [ ] **AUDIO-03**: Arpeggio audition for full scale
- [ ] **AUDIO-04**: Drone + interval-over-drone playback
- [ ] **AUDIO-05**: Polyphony cap with voice tracking — no orphaned voices
- [ ] **AUDIO-06**: Mobile Safari audio verified working (autoplay-policy + AudioContext quirks)

### NOTES — Research-Notes Surface

- [ ] **NOTES-01**: Markdown prose pages with reactive JS cells (Framework baseline)
- [x] **NOTES-02**: KaTeX math typesetting in prose
- [ ] **NOTES-03**: Inline widget pattern — `<PlayInterval>`, `<ScaleTable>`, etc. embeddable mid-paragraph via Markdown `${...}` interpolation
- [ ] **NOTES-04**: Reusable `src/lib/` (pure kernel) and `src/components/` (DOM factories) — no kernel-DOM bleed; documented in `src/lib/INVENTORY.md`
- [ ] **NOTES-05**: At least one additional general theory page proves the architecture supports >1 page

### COMP — Composition Anchor

- [ ] **COMP-01**: In-progress piece's pitch material lives in `src/lib/pieces/<piece>.ts` as single source of truth
- [ ] **COMP-02**: Composition dashboard page — full end-to-end usage of kernel for the piece (design scale, see ratios/cents, audition, export `.scl`)
- [ ] **COMP-03**: CI test asserts the piece module's scale parses and exports correctly (catches kernel-vs-composition drift)

### VIZ — Visualization

- [ ] **VIZ-01**: Lattice rendering (D3 + `ji-lattice`) with configurable prime basis
- [ ] **VIZ-02**: Tonality diamond with configurable odd-limit
- [ ] **VIZ-03**: Scale-on-keyboard SVG view

### ANAL — Analysis

- [ ] **ANAL-01**: EDO ↔ JI mapping table — find best EDO for a JI scale; find JI approximations in an EDO
- [ ] **ANAL-02**: MOS / generator-period scale construction
- [ ] **ANAL-03**: Side-by-side scale comparison cell
- [ ] **ANAL-04**: Persistent URLs for scales (URL hash encoding) — share + reproduce

## v2 Requirements

### TEMP — Temperament Browser & Deep Theory

- **TEMP-01**: Temperament browser — paste comma list → mappings, error, complexity
- **TEMP-02**: Ratio-to-comma decomposition
- **TEMP-03**: Plomp-Levelt dissonance curve
- **TEMP-04**: Citations / bibliography across pages
- **TEMP-05**: Harmonic entropy
- **TEMP-06**: 3D lattice rendering
- **TEMP-07**: SonicWeave embedded as in-cell scale DSL
- **TEMP-08**: Periodicity blocks (Fokker)
- **TEMP-09**: Scala archive browser
- **TEMP-10**: MIDI Tuning Standard / hardware-synth bridge

## Out of Scope

| Feature | Reason |
|---------|--------|
| Engraved JI staff notation (HEJI2 / Sagittal / Johnston) | Explicit user decision — ratio + cent-deviation display only; conflicts with ratio-native data model and pulls in heavy font / library commitment |
| MIDI input or MTS / SysEx as primary v1 surface | `.scl`/`.kbm` covers the bridge to external tools; live MIDI / hardware integration is a separate problem class |
| Full DAW / sequencer / arrangement | Not the purpose; this is a calculator + research notebook, not a composition environment |
| User accounts / cloud storage / real-time collab | Personal-tool framing — static site, single author |
| Hosted Observable.com platform | Chose Observable Framework for self-hosting, ownership, git versioning, no platform lock-in |
| Python / Jupyter / Marimo stack | Committed to JS in Framework — one stack end-to-end, browser-native |
| Generic public competitor to Scale Workshop / x31eq | Not the purpose; this is a personal research notebook that happens to be shareable, not a tool to replace existing community tools |
| 1:1 Scale Workshop feature parity | Wastes effort, misses the prose-differentiator gap; depend on / interop with the xen-dev ecosystem instead |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOOT-01 | Phase 1 | Complete |
| BOOT-02 | Phase 1 | Complete |
| BOOT-03 | Phase 1 | Complete |
| BOOT-04 | Phase 1 | Complete |
| BOOT-05 | Phase 1 | Complete |
| MATH-01 | Phase 2 | Complete |
| MATH-02 | Phase 2 | Complete |
| MATH-03 | Phase 2 | Complete |
| MATH-04 | Phase 2 | Complete |
| MATH-05 | Phase 2 | Complete |
| MATH-06 | Phase 2 | Complete |
| SCALE-01 | Phase 2 | Pending |
| SCALE-02 | Phase 2 | Pending |
| SCALE-03 | Phase 2 | Pending |
| SCALE-04 | Phase 2 | Pending |
| SCALE-05 | Phase 2 | Pending |
| IO-01 | Phase 2 | Pending |
| IO-02 | Phase 2 | Pending |
| IO-03 | Phase 3 | Pending |
| IO-04 | Phase 2 | Pending |
| IO-05 | Phase 2 | Complete |
| AUDIO-01 | Phase 2 | Pending |
| AUDIO-02 | Phase 2 | Pending |
| AUDIO-03 | Phase 2 | Pending |
| AUDIO-04 | Phase 2 | Pending |
| AUDIO-05 | Phase 2 | Pending |
| AUDIO-06 | Phase 3 | Pending |
| NOTES-01 | Phase 2 | Pending |
| NOTES-02 | Phase 2 | Complete |
| NOTES-03 | Phase 2 | Pending |
| NOTES-04 | Phase 2 | Pending |
| NOTES-05 | Phase 2 | Pending |
| COMP-01 | Phase 2 | Pending |
| COMP-02 | Phase 2 | Pending |
| COMP-03 | Phase 2 | Pending |
| VIZ-01 | Phase 3 | Pending |
| VIZ-02 | Phase 3 | Pending |
| VIZ-03 | Phase 3 | Pending |
| ANAL-01 | Phase 4 | Pending |
| ANAL-02 | Phase 4 | Pending |
| ANAL-03 | Phase 4 | Pending |
| ANAL-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42 ✓
- Unmapped: 0
- Phase 1 (Bootstrap): 5 reqs (all BOOT)
- Phase 2 (Kernel + Composition MVP): 28 reqs (MATH, SCALE, IO except IO-03, AUDIO except AUDIO-06, NOTES, COMP)
- Phase 3 (Visualization + Mobile): 5 reqs (VIZ, IO-03, AUDIO-06)
- Phase 4 (Analysis & Sharing): 4 reqs (ANAL)

---
*Requirements defined: 2026-05-02*
*Last updated: 2026-05-02 after roadmap creation (traceability populated)*
