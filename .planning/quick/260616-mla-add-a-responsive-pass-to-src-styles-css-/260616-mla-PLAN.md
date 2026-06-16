---
quick_id: 260616-mla
title: Responsive ≤640px pass in styles.css + resolve orphaned-component note
date: 2026-06-16
mode: quick
status: ready
---

# Quick Task 260616-mla — Responsive pass + orphaned-component resolution

## Task

1. Add a responsive pass to `src/styles.css` — a ~640px breakpoint that stacks
   the dense Generate/Analysis grids, the scale-transform strip, and the
   side-by-side scale-compare for narrow viewports (#21, currently zero media
   queries).
2. Resolve the two "orphaned" components `play-dyad.ts` and `spiral-of-fifths.ts`.

## Discovery (pre-plan findings)

- **`src/styles.css` has zero `@media` queries** (158 lines) — confirmed. This
  will be the project's first breakpoint.
- The page bodies are already single-column (Framework default + prior decision
  **D-17**: "single-column responsive at all widths, no min-width breakpoints").
  The responsive pain is *internal to the dense forms*, which lay their controls
  out as `display:flex; flex-wrap:wrap` rows that crowd on a phone.
- **Generate widgets use per-component BEM prefixes** — `.generate-cps__form`,
  `.generate-ed__field`, etc. The generic `.generate-field` in `generate.css` is
  effectively dead for the widgets. All 9 widgets share the identical pattern:
  `__form` (flex-wrap row) + `__field` (inline-flex). Prefixes with this pattern:
  cps, cs, ed, fokker, harmonic, ji-set, meru, rank2, welltemp.
- **Transform strip**: `.scale-transform-strip__form` (flex-wrap) +
  `.scale-transform-strip__field` (inline-flex).
- **Scale-compare** (the Analysis A/B grid): `.scale-compare__b-source`
  (flex-wrap row) + table in a `.scale-compare__table-wrap { overflow-x:auto }`.
- **Orphan premise is STALE.** Both components already have live page call sites
  and tests:
  - `play-dyad.ts` → 4 sites: `syntonic-comma.md`, `schisma.md`,
    `pythagorean-comma.md`, `septimal-comma.md`. Test:
    `src/components/__tests__/play-dyad.test.ts`.
  - `spiral-of-fifths.ts` → 2 sites: `meantone.md`, `pythagorean-comma.md`
    (+ `onStepClick`). Test: `src/components/__tests__/spiral-of-fifths.test.ts`.
  - Wired in by quick tasks `260512-fxk`, `260512-ngj`, `260512-udc`, and commit
    `946248a` — *after* the #21 note was written. Neither "wire in" (done) nor
    "backlog" (would be a regression) applies. **User decision: record as
    already-resolved in STATE.md.**

## Tasks

### Task 1 — Responsive ≤640px breakpoint in `src/styles.css`

- **files:** `src/styles.css`
- **action:** Append a single `@media (max-width: 640px)` block (layout-only, no
  colour/token/tap-target changes) that:
  - Collapses each generator widget's `__form`/`__params` to
    `flex-direction: column; align-items: stretch`, and makes each `__field`
    `width: 100%; justify-content: space-between` (label left / control right).
    Generate prefixes enumerated explicitly (no shared layout class).
  - Tightens `.generate-host--params` padding (16px → 12px); stacks
    `.generate-actions` and full-widths its `.play-btn` CTAs.
  - Stacks `.scale-transform-strip__form` + full-widths `__field`.
  - Stacks `.scale-compare__b-source` (+ label/select) and tightens
    `.scale-compare` table cell padding.
- **verify:** `npx prettier --check src/styles.css`; `npm run build` (Observable
  bundles the CSS — a malformed `@media` fails the build); `npm run lint:types`.
- **done:** `styles.css` contains one well-formed `@media (max-width: 640px)`
  block; build + prettier + tsc clean.

### Task 2 — Record orphaned-component resolution in STATE.md

- **files:** `.planning/STATE.md`
- **action:** Add a short note that `play-dyad.ts` and `spiral-of-fifths.ts` are
  already wired in (with call-site evidence), resolving the #21 orphan item with
  no code change. Add the Quick Tasks Completed row + update Last activity.
- **verify:** STATE.md shows the resolution note and the 260616-mla row.
- **done:** Note + row present; no source components moved or deleted.

## Out of scope / guardrails

- No changes to component CSS files, no new breakpoints beyond ≤640px, no colour
  or theme-token edits, no touching the ≥44px tap targets or 16px input floor.
- Do NOT move/delete `play-dyad.ts` or `spiral-of-fifths.ts` (live + tested).
- Raw analysis tables (`edo-ji-table`, `edo-jit-table`) left as-is — not named in
  scope and have no reliable wrapper class; stability over speculative coverage.
