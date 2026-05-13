---
quick_id: 260513-foy
mode: quick
description: Audit theory pages for playback/interactivity potential and emit a command sequence the user can paste in fresh windows.
tasks: 1
must_haves:
  - 18 theory pages surveyed
  - Existing interactive pages identified (no-op'd)
  - Gap pages identified with concrete component-level reasons
  - Six self-contained /gsd-quick commands written, dependency-ordered
  - Structural blockers called out (spiral click affordance, renderDiamondSVG synth param, Plot.dot non-clickable)
---

# Plan: Interactive Figures Audit + Command Sequence Handoff

## Goal

Map the interactivity landscape across the 18 theory note pages and hand
the user a ready-to-paste sequence of `/gsd-quick` commands they can run in
fresh context windows to land the full "make figures clickable for
playback" sweep — without ballooning this single quick task beyond the
1–3-task quick-task envelope.

## Task

### T1 — Survey + write handoff document

- **files**:
  - `.planning/quick/260513-foy-i-would-like-as-many-of-the-graphs-and-f/260513-foy-SUMMARY.md` (deliverable)
  - read-only: `src/pages/*.md` (18 files), `src/components/spiral-of-fifths.ts`, `src/components/tonality-diamond.ts`, `src/components/play-interval.ts`, `src/audio/synth.ts`
- **action**: Run an Explore-agent audit pass over every theory page to map (visual elements → existing playback wiring → interactivity gap → reuse opportunity). Identify structural blockers in shared components. Author six self-contained `/gsd-quick` commands, ordered so component-level extensions precede the pages that depend on them. Write the audit table, blockers list, and command sequence to SUMMARY.md.
- **verify**: SUMMARY.md exists; contains audit table covering all 18 pages; contains six numbered commands; commands explicitly call out file paths and reuse patterns (`prime-limits.md`, `monzos.md`).
- **done**: Document committed; user can paste commands 1–6 into fresh `/gsd-quick` windows without re-explaining context.

## Out of Scope

- Any source code edits (deferred to commands 1–6)
- Spawning the GSD planner or executor (this task is itself the planning artifact)
- 3D lattice work, hover-audition affordances, comma-pump chart per-point clickability
