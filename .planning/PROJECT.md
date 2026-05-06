# Tuning Systems

## What This Is

A research notebook + JI calculator built as an Observable Framework site — Markdown prose on tuning-systems theory living side-by-side with reactive JavaScript cells that compute, visualize, and audition just-intonation intervals. Built first to support a specific composition in progress, but architected as a clean, generalizable toolkit for ongoing tuning research.

## Core Value

I can design any JI scale (arbitrary ratios, no prime-limit ceiling), see it expressed as ratios and cents-from-12tet, hear it, and export it to Scala `.scl`/`.kbm` — all from a self-hosted notebook where the calculator and the research prose live together.

## Requirements

### Validated

- [x] Static-site build, self-hosted, publishable, git-versioned source — *Validated in Phase 1 (Bootstrap & Build): Observable Framework 1.13.4 builds to `dist/`; GitHub Pages workflow deploys on push to main; full source under git.*
- [x] Lattice + tonality diamond visualizations for arbitrary prime sets — *Validated in Phase 3 (Visualization + Mobile Audio Audit): D3 + ji-lattice 2D lattice with auto-derived prime basis + pan/zoom; configurable-odd-limit tonality diamond (CR-01 fix preserves original (i, j) pair so cells render at unique positions).*
- [x] Scala `.scl` and `.kbm` export — *Validated in Phase 3: parseKbm/writeKbm/kbmToFrequencies/defaultKbmFor with three named fields (referenceKey ≠ middleNote); sclIo widget round-trips both formats with auto-detection.*

### Active

<!-- All hypotheses until shipped. -->

- [ ] Arbitrary JI ratio arithmetic — any numerator/denominator (e.g., `81/79`), no prime-limit ceiling
- [ ] Monzo (prime-factor vector) representation and arithmetic
- [ ] Cents conversion + cent-deviation-from-12tet display
- [ ] Temperament conversion (EDOs, regular-temperament mappings, comma analysis)
- [ ] Scale-building primitives (generators, modes, JI subsets)
- [ ] In-browser audio playback of intervals/scales (Web Audio)
- [ ] Markdown research notes interleaved with reactive calculator cells
- [ ] End-to-end coverage of the in-progress composition's tuning needs

### Out of Scope

- **Staff-engraved JI notation (HEJI2 / Sagittal / Johnston)** — explicitly chose ratio + cent-deviation display only; staff engraving means heavy commitment to microtonal notation libraries + accidental fonts, sidestepped for v1
- **Observable.com hosted notebooks** — chose Framework for self-hosted static output, git ownership, no platform lock-in
- **Python / Jupyter / Marimo stack** — committed to JS in Observable Framework; one runtime, browser-native, no kernel layer
- **Scala-clone or generic public competitor to existing tools (x31eq, Sevish, etc.)** — not the purpose; this is a personal research notebook that happens to be shareable
- **MIDI Tuning Standard / hardware-synth integration** — possible later, not v1; `.scl`/`.kbm` export covers the bridge to external tools
- **Imports beyond Scala formats** — Scala is the lingua franca; supporting other proprietary tuning formats not worth integration cost

## Context

- The user composes and studies tuning systems; has prior experience with Scala and various web-based JI calculators.
- A specific composition in progress is the concrete anchor for v1 — design decisions should serve that piece end-to-end first, then generalize.
- Two equally weighted modes: (1) practical composer's tool for the current piece, (2) ongoing theory exploration via interleaved prose + computation.
- The "shareable" framing means architecture and clarity matter, but no need to optimize for unknown public users — the user is the primary reader.
- Self-hosted publishing > platform hosting; longevity, ownership, and version control are explicit values.

## Constraints

- **Tech stack**: Observable Framework — chosen for reactive cells + Markdown authoring + static-site output + git-versioned source.
- **Language**: JavaScript / TypeScript — required by the Framework runtime.
- **Math precision**: arbitrary-precision rational arithmetic required (no prime-limit ceiling means bigint-backed fractions, not floats).
- **Audio**: in-browser only (Web Audio API) — no native synth bridge in v1.
- **Notation surface**: ratios + cents + cent-deviation-from-12tet only — no staff engraving.
- **Distribution**: static site, self-hostable — no required server, no external platform dependency.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Observable Framework over Observable.com / Jupyter / custom Vite app / Markdown+scripts | Reactive cells + static publishable output + git-versioned source + no platform lock-in; matches "calculator + research notes side-by-side" requirement | — Pending |
| Ratio + cent-deviation display over engraved JI notation (HEJI2/Sagittal/Johnston) | Sidesteps massive font/library/rendering commitment; user explicitly prefers ratio-based view | — Pending |
| JavaScript stack over Python/Jupyter | Browser is the runtime; Framework is the format; one stack end-to-end | — Pending |
| Anchor v1 to a specific composition AND require generalizable toolkit | Both modes weighted equally — concrete piece prevents abstraction drift, generality requirement prevents one-shot hackery | — Pending |
| `.scl`/`.kbm` export as primary external format | Lingua franca of microtonal world; covers Scala-the-app, Lilypond, most synths | — Pending |
| Audio playback in v1 (not deferred) | User upgraded "playback as a bonus" to a v1 output; in-browser Web Audio is cheap to add | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-06 after Phase 3 (Visualization + Mobile Audio Audit) completion — lattice + tonality diamond + scale-on-keyboard rendering, .kbm I/O, mobile-Safari audio quirks audited and mitigated; 5/5 phase truths verified after gap-closure plan 03-07 (CR-01 diamond layout + CR-02 arpeggio panic + mobile-audit footer); 179/179 tests green.*
