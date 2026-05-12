---
phase: quick-260512-cst
plan: 01
subsystem: theory-pages
tags: [theory, pythagorean, wolf-fifth, 3-limit-ji, sidebar]
dependency_graph:
  requires:
    - src/lib/interval.ts
    - src/lib/scale.ts
    - src/audio/synth.ts
    - src/components/scale-table.ts
    - src/components/play-interval.ts
    - src/components/ratio-pill.ts
  provides:
    - /pages/pythagorean-tuning (12-tone Pythagorean scale + wolf-fifth audition)
  affects:
    - observablehq.config.ts (Theory notes sidebar — one new entry)
tech_stack:
  added: []
  patterns:
    - "Inline page-level helper (chainOfFifths) — kept off src/lib/ because it's page-specific composition of existing kernel primitives"
    - "Pattern 4 / Pitfall #2: isolated synth cell with invalidation.then(synth.dispose)"
    - "D-14: last interval IS the period; Scale constructor pinned explicitly to new Interval('2/1')"
    - "R-01 BigInt path: every Interval constructed from a string ratio"
key_files:
  created:
    - src/pages/pythagorean-tuning.md
  modified:
    - observablehq.config.ts
decisions:
  - "chainOfFifths(n) lives inline in the page (~12 lines including comments). It's a composition of existing Interval/Scale primitives, not a reusable kernel — per the plan's explicit scope no new src/lib/ file was added."
  - "Sorted by Interval.cents (display projection) — acceptable here because that's display ordering, not equality (Pitfall #1). The BigInt Fraction inside Interval remains the source of truth for arithmetic."
  - "Wolf-fifth ratio derived constructively in a comment block: (2/1)^7 / (3/2)^11 = 2^18 / 3^11 = 262144/177147 ≈ 678.49¢ — kept as an exact-string Interval ('262144/177147') so R-01 BigInt path is preserved."
  - "baseHz = 261.625 (middle C) for the scaleTable, matching where the historical 12-note Pythagorean tuning is normally voiced."
  - "Did NOT use commaByName — the Pythagorean comma is referenced via cross-link only, not as an Interval on this page. Avoids redundant audition with the pythagorean-comma page."
metrics:
  duration_min: 8
  completed_date: "2026-05-12"
  tasks_completed: 1
  files_created: 1
  files_modified: 1
---

# Phase quick-260512-cst Plan 01: add pythagorean-tuning theory page Summary

Added a theory page demonstrating the classic 12-note Pythagorean scale (twelve pure 3/2 fifths octave-reduced and sorted) and the **wolf 5th** (262144/177147 ≈ 678.49¢) — the diminished sixth that closes the cycle, narrower than a pure fifth by exactly one Pythagorean comma. Provides scaleTable + two ▶ buttons to audibly compare pure vs. wolf fifths.

## What was built

- **`src/pages/pythagorean-tuning.md`** — new page with:
  - Imports cell pulling `Interval` (`src/lib/`), `Scale` (`src/lib/`), `createSynth` (`src/audio/`), and `scaleTable` / `playInterval` / `ratioPill` (`src/components/`). Three-layer discipline preserved.
  - Isolated synth cell (Pattern 4 / Pitfall #2): `const synth = createSynth(); invalidation.then(() => synth.dispose());` — no cell dependencies, lazy AudioContext.
  - Inline `chainOfFifths(n)` helper (~12 lines) building a `Scale` of n octave-reduced pure fifths plus the 2/1 period (D-14). For n=12 → the canonical Pythagorean 12-tone scale.
  - `scaleTable(pythagorean12, 261.625)` render — 13 rows, 4 columns (Degree | Ratio | Cents | ¢ from 12-TET).
  - Constructive derivation of the wolf in a comment block; two play buttons (`▶ Play 3/2`, `▶ Play 262144/177147`) inline in prose.
  - Cross-links to `/pages/pythagorean-comma` (the comma the wolf manifests), `/pages/harmonic-series` (prerequisite framing), and `/` (dashboard).

- **`observablehq.config.ts`** — one new sidebar entry `{ name: "Pythagorean tuning", path: "/pages/pythagorean-tuning" }` inserted between "The Pythagorean comma" and "The schisma" inside the Theory notes group.

## Verification

| Gate | Result |
| --- | --- |
| `npm run lint:types` | 5 pre-existing errors baseline (npm: imports in synth.ts / lattice.ts / scale-compare.ts) — verified unchanged by stash/diff before/after. Out of scope per SCOPE BOUNDARY. |
| `npm run lint` | 79 pre-existing errors baseline (scale-compare.ts d3/Plot resolution) — verified unchanged. Zero errors against `src/pages/pythagorean-tuning.md` or `observablehq.config.ts`. |
| `npm run build` | PASS. `render /pages/pythagorean-tuning → dist/pages/pythagorean-tuning.html` (16 kB page, 400 kB imports, 65 kB files). 69 links validated. |
| Sidebar positioning grep | PASS — `pythagorean-tuning` appears on the line immediately after `pythagorean-comma`. |
| Structural-element greps | PASS — `createSynth`, `invalidation.then`, `chainOfFifths`, `scaleTable`, `/pages/pythagorean-comma`. |
| Exact-string Interval greps | PASS — `"3/2"` and `"262144/177147"` (R-01 BigInt path). |
| Three-layer-discipline greps | PASS — no `sw-synth`, no `npm:sw-synth`, no `xen-dev-utils`, no `fraction.js` imports from the markdown page. |

## Deviations from Plan

None — plan executed exactly as written. Page structure, cell ordering, prose, and sidebar registration all match the spec.

## Self-Check: PASSED

- `src/pages/pythagorean-tuning.md` exists (created in commit `ee2cbdf`).
- `observablehq.config.ts` updated with sidebar entry (same commit).
- Commit `ee2cbdf` present on `worktree-agent-a26affe5069186be3` — single atomic `feat(quick-260512-cst): add pythagorean-tuning theory page` covering both files.
- All verify gates exit 0 (lint:types and lint baselines are pre-existing and out of scope).
- Build artifact `dist/pages/pythagorean-tuning.html` produced; 69 link validations passed.
