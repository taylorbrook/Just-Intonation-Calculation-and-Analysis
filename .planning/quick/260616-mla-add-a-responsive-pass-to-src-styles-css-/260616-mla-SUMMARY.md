---
quick_id: 260616-mla
title: Responsive ≤640px pass in styles.css + resolve orphaned-component note
date: 2026-06-16
status: complete
commit: efa7223
---

# Quick Task 260616-mla — Summary

## What shipped

### 1. Responsive ≤640px pass (#21) — `src/styles.css`

Added the project's **first `@media` query** (the file had zero). A single
`@media (max-width: 640px)` block collapses the dense forms from wrapping flex
rows to clean single-column, full-width controls at phone widths:

- **Generator widgets** — all nine (`cps`, `cs`, `ed`, `fokker`, `harmonic`,
  `ji-set`, `meru`, `rank2`, `welltemp`): `__form`/`__params` →
  `flex-direction: column; align-items: stretch`; `__field` →
  `width: 100%; justify-content: space-between` (label left / control right).
  Prefixes enumerated explicitly because each widget uses its own BEM prefix
  with no shared layout class (a comment notes new widgets should add their
  selectors here).
- **Generate shell** — `.generate-host--params` padding 16→12px;
  `.generate-actions` stacked with full-width `.play-btn` CTAs.
- **Scale-transform strip** — `__form`/`__field` stacked full-width.
- **Scale-compare (Analysis A/B)** — `__b-source` (label + select) stacked;
  comparison-table cell padding tightened to 8px (the table already lives in
  `.scale-compare__table-wrap { overflow-x: auto }`).

Layout-only: colours, theme tokens, the 16px iOS no-zoom input floor, and the
≥44px tap targets are all untouched, and D-17's single-column-at-all-widths
page bodies are preserved.

### 2. Orphaned-component resolution — **no code change**

The #21 "two orphaned components with passing tests but no page call site"
premise was **stale**. Both components are already wired in with green tests:

| Component | Live call sites | Test |
|-----------|-----------------|------|
| `play-dyad.ts` (`playDyad`) | `syntonic-comma.md`, `schisma.md`, `pythagorean-comma.md`, `septimal-comma.md` (4) | `src/components/__tests__/play-dyad.test.ts` |
| `spiral-of-fifths.ts` (`spiralOfFifths`) | `meantone.md`, `pythagorean-comma.md` (2, + `onStepClick`) | `src/components/__tests__/spiral-of-fifths.test.ts` |

They were orphaned when #21 was filed but wired in afterward by quick tasks
`260512-fxk`, `260512-ngj`, `260512-udc`, and commit `946248a`. "Wire in" was
already done; "move to backlog" would have been a **regression** (deleting live
call sites). Per user decision (AskUserQuestion), the item is recorded as
already-resolved in STATE.md with no components moved or deleted.

## Verification

- `npx prettier --check src/styles.css` → clean
- `npm run lint:types` (`tsc --noEmit`) → clean
- `npm run build` (Observable bundles the CSS) → clean, 140 links validated;
  `@media (max-width: 640px)` confirmed present in `dist/_import/styles.*.css`
- `npx vitest run` → **752/752 passing** (CSS-only change, suite unaffected)

## Deviations from plan

None. Both tasks executed as planned.

## Commits

- `efa7223` — feat(quick-260616-mla): responsive ≤640px pass in styles.css (#21)
- docs commit (this summary + PLAN + STATE) follows.
