# Tuning Systems

## What This Is

A research notebook + JI calculator built as an Observable Framework site — Markdown prose on tuning-systems theory living side-by-side with reactive JavaScript cells that compute, visualize, and audition just-intonation intervals. v1.0 shipped a complete kernel + visualization + analysis stack anchored end-to-end by a composition dashboard, and a public `/analysis` page where users can build EDO/MOS scales, compare them, and share via URL hash.

## Core Value

I can design any JI scale (arbitrary ratios, no prime-limit ceiling), see it expressed as ratios and cents-from-12tet, hear it, and export it to Scala `.scl`/`.kbm` — all from a self-hosted notebook where the calculator and the research prose live together.

(Validated by v1.0 — every part of the sentence is now demonstrable on the live site.)

## Current State

**Shipped:** v1.0 MVP — 2026-05-07
**Phases:** 4 (Bootstrap & Build → Math Kernel + Composition Anchor → Visualization + Mobile Audio Audit → Analysis & Sharing)
**Code:** 47 TypeScript files, 5 Markdown pages, 14 CSS files (~7,900 LOC TS, ~9,600 LOC total), 192 tests passing
**Stack:** Observable Framework 1.13.4 · TypeScript strict · Vitest · ESLint 9 flat · Prettier · `xen-dev-utils@0.13.1` · `sonic-weave@0.14.1` · `ji-lattice@0.3.2` · `sw-synth@0.4.0` · `fraction.js@5.3.4` (BigInt) · D3 7.9 · KaTeX 0.16 · GitHub Pages
**Pages:** `/` (composition dashboard) · `/pages/syntonic-comma` (theory page) · `/pages/analysis` (EDO + MOS + scale-compare + URL share)
**Open after v1.0:** one deferred Safari RDM smoke-test re-walk to sign the `mobile-audit.md` Post-CR-02 footer (unit-level regression test already passes; documentation-trail item only). See STATE.md → Deferred Items.

## Next Milestone Goals

Pending `/gsd-new-milestone` scoping. The v2 candidates parked in `milestones/v1.0-REQUIREMENTS.md` (TEMP-01..10) are the natural starting set: temperament browser, ratio-to-comma decomposition, Plomp-Levelt dissonance curves, citations/bibliography across pages, harmonic entropy, 3D lattice rendering, SonicWeave embedded as in-cell scale DSL, periodicity blocks (Fokker), Scala archive browser, MIDI Tuning Standard / hardware-synth bridge.

## Requirements

### Validated

- [x] Static-site build, self-hosted, publishable, git-versioned source — *Phase 1: Observable Framework 1.13.4 builds to `dist/`; GitHub Pages workflow deploys on push to main; full source under git.*
- [x] Arbitrary JI ratio arithmetic — any numerator/denominator (e.g., `81/79`), no prime-limit ceiling — *Phase 2: BigInt-backed `Interval` over `fraction.js@5.3.4`; verified live on `/` (`81/79 ≈ 43.28¢`) and through 192 tests including 25-digit Mercator's-comma round-trips.*
- [x] Monzo (prime-factor vector) representation and arithmetic — *Phase 2: lazy monzo from any `Interval`; named-comma table keyed on canonical monzo (Pitfall #6, never cents-within-epsilon).*
- [x] Cents conversion + cent-deviation-from-12tet display — *Phase 2: display projection only; kernel keeps ratios as `Fraction` (BigInt) as source of truth.*
- [x] Scale-building primitives (generators, modes, JI subsets) — *Phase 2 (Scale.rotate/reduce/transpose/dedupe + jiSubsetOfEdo) + Phase 4 (`buildMos`/`nearestMosSize` for generator-period MOS).*
- [x] In-browser audio playback of intervals/scales (Web Audio) — *Phase 2 (createSynth lifecycle wrapper, ADSR, polyphony cap, voice tracking, dispose) + Phase 3 (mobile Safari quirks mitigated: audioSession.type='playback', sync ctx.resume, visibilitychange).*
- [x] Markdown research notes interleaved with reactive calculator cells — *Phase 2: NOTES-01..05; KaTeX-typeset math + inline `${playInterval(...)}` widgets share the kernel and synth across pages.*
- [x] End-to-end coverage of the in-progress composition's tuning needs — *Phase 2: COMP-01..03; seed scale baked as a string constant in `src/index.md`; CI test guards parseScala → Scale → writeScl → parseScl round-trip.*
- [x] Lattice + tonality diamond visualizations for arbitrary prime sets — *Phase 3: D3 + ji-lattice 2D lattice with auto-derived prime basis + pan/zoom; configurable-odd-limit tonality diamond (CR-01 fix preserved each cell's original `(i, j)`).*
- [x] Scala `.scl` and `.kbm` export — *Phase 2 (parseScala/parseScl/writeScl/scalaToCsv) + Phase 3 (parseKbm/writeKbm/kbmToFrequencies/defaultKbmFor with three named fields). sclIo widget round-trips both formats with auto-detection.*

### Active

<!-- Re-populated when /gsd-new-milestone scopes v1.1+. -->

(None — all v1.0 active items shipped. Run `/gsd-new-milestone` to scope the next set.)

### Deferred to v2

These were originally in v1's "Active" list under "Temperament conversion (EDOs, regular-temperament mappings, comma analysis)". The EDO half shipped in Phase 4 (ANAL-01); regular-temperament mappings and comma decomposition were intentionally pushed to v2 per the roadmap.

- [ ] Regular-temperament mappings (TEMP-01)
- [ ] Ratio-to-comma decomposition (TEMP-02)
- [ ] Plomp-Levelt dissonance curve (TEMP-03)
- [ ] Citations / bibliography across pages (TEMP-04)
- [ ] Harmonic entropy (TEMP-05)
- [ ] 3D lattice rendering (TEMP-06)
- [ ] SonicWeave embedded as in-cell scale DSL (TEMP-07)
- [ ] Periodicity blocks (Fokker) (TEMP-08)
- [ ] Scala archive browser (TEMP-09)
- [ ] MIDI Tuning Standard / hardware-synth bridge (TEMP-10)

### Out of Scope

- **Staff-engraved JI notation (HEJI2 / Sagittal / Johnston)** — explicitly chose ratio + cent-deviation display only; staff engraving means heavy commitment to microtonal notation libraries + accidental fonts, sidestepped for v1; reasoning still valid post-ship.
- **Observable.com hosted notebooks** — chose Framework for self-hosted static output, git ownership, no platform lock-in; validated by GitHub Pages deploy in Phase 1.
- **Python / Jupyter / Marimo stack** — committed to JS in Observable Framework; one runtime, browser-native, no kernel layer; held throughout v1.0.
- **Scala-clone or generic public competitor to existing tools (x31eq, Sevish, etc.)** — not the purpose; this is a personal research notebook that happens to be shareable.
- **MIDI Tuning Standard / hardware-synth integration in v1** — possible later (now parked in v2 as TEMP-10); `.scl`/`.kbm` export covers the bridge to external tools.
- **Imports beyond Scala formats** — Scala is the lingua franca; supporting other proprietary tuning formats not worth integration cost.

## Context

- The user composes and studies tuning systems; has prior experience with Scala and various web-based JI calculators.
- A specific composition in progress was the concrete v1 anchor — the seed 7-limit JI heptatonic lives as a string constant in `src/index.md` and is guarded by a CI integration test (COMP-03 reframed gate). The shipped dashboard exercises every kernel feature for that piece end-to-end.
- Two equally weighted modes throughout v1: (1) practical composer's tool for the current piece, (2) ongoing theory exploration via interleaved prose + computation. Both validated.
- The "shareable" framing now has teeth: URL-hash-encoded scales mean any page can be deep-linked into a specific scale state. Architecture and clarity matter, but no need to optimize for unknown public users — the user is the primary reader.
- Self-hosted publishing > platform hosting; longevity, ownership, and version control are explicit values; honored throughout v1.

## Constraints

- **Tech stack**: Observable Framework — chosen for reactive cells + Markdown authoring + static-site output + git-versioned source. Held.
- **Language**: JavaScript / TypeScript — required by the Framework runtime. Held.
- **Math precision**: arbitrary-precision rational arithmetic required (no prime-limit ceiling means bigint-backed fractions, not floats). Held — `fraction.js@5.3.4` BigInt is the kernel currency; R-01 ESLint rule blocks the wrong (Number-backed) `Fraction` import.
- **Audio**: in-browser only (Web Audio API) — no native synth bridge in v1. Held.
- **Notation surface**: ratios + cents + cent-deviation-from-12tet only — no staff engraving. Held.
- **Distribution**: static site, self-hostable — no required server, no external platform dependency. Held — GitHub Pages is the deploy target; build is fully self-hostable.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Observable Framework over Observable.com / Jupyter / custom Vite app / Markdown+scripts | Reactive cells + static publishable output + git-versioned source + no platform lock-in | ✓ Good — Framework's reactive cells + Markdown authoring carried v1 cleanly; npm:-import + `.ts`-as-`.js` pattern works; per-page `style:` frontmatter quirk found and documented (UAT discovery in 03-06) |
| Ratio + cent-deviation display over engraved JI notation (HEJI2/Sagittal/Johnston) | Sidesteps massive font/library/rendering commitment; user explicitly prefers ratio-based view | ✓ Good — held throughout; ratio + cents-deviation tables on every page do their job; KaTeX covers prose math |
| JavaScript stack over Python/Jupyter | Browser is the runtime; Framework is the format; one stack end-to-end | ✓ Good — never reached for a non-JS escape hatch in v1 |
| Anchor v1 to a specific composition AND require generalizable toolkit | Both modes weighted equally — concrete piece prevents abstraction drift, generality requirement prevents one-shot hackery | ✓ Good — COMP-01..03 + the public `/analysis` page coexist cleanly; the composition stayed concrete (seed scale = string constant on the dashboard) while the kernel stayed general (192 tests, 21-fixture round-trip corpus) |
| `.scl`/`.kbm` export as primary external format | Lingua franca of microtonal world; covers Scala-the-app, Lilypond, most synths | ✓ Good — round-trip golden tests against Huygens-Fokker archive samples passed; `.kbm` three-named-fields discipline (Pitfall #7) avoided the `referenceKey == middleNote` conflation trap |
| Audio playback in v1 (not deferred) | User upgraded "playback as a bonus" to a v1 output; in-browser Web Audio is cheap to add | ✓ Good — `createSynth` lifecycle wrapper kept the kernel-DOM boundary clean; Pattern 4 (cell-owned synth) survived multiple pages; mobile Safari quirks audited in Phase 3 |
| BigInt `fraction.js@5.3.4` exact-pin + R-01 ESLint rule blocking Number-backed `Fraction` from `xen-dev-utils` | Number-backed Fraction silently loses precision past 2^53; R-01 surfaces accidental imports at lint time | ✓ Good — Mercator's 25-digit comma round-trips exactly; no precision regressions in v1 |
| Three-layer purity discipline (kernel ↔ components ↔ pages) | Components import kernel by value; pages own audio lifecycle; no kernel-DOM bleed | ✓ Good — INVENTORY.md tracked every kernel symbol with source + decision back-references; never violated in v1 |
| Pattern 4: cell-owned synth (D-34) | Each page declares its own synth cell with `invalidation.then(synth.dispose)` — synths are NOT shared via module export | ✓ Good — survived two-page (`/` + `/pages/analysis`) cross-navigation without leaking AudioContexts (verified at Checkpoint 1) |
| Decimal phase numbering for urgent insertions | Clear semantics for inserting hotfixes between planned phases | — Not exercised in v1 (no decimal phases inserted). Pattern stands for future use. |

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
*Last updated: 2026-05-07 after v1.0 MVP milestone close — all 42 v1 requirements complete; one deferred RDM smoke-test re-walk for documentation-trail completeness recorded in STATE.md; full milestone archive at `milestones/v1.0-ROADMAP.md` and `milestones/v1.0-REQUIREMENTS.md`.*
