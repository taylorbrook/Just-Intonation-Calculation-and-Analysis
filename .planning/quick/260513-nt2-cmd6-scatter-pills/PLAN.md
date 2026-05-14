---
quick_id: 260513-nt2
status: in-progress
date: 2026-05-14
slug: cmd6-scatter-pills
---

# Quick Task 260513-nt2: CMD-6 — Plot scatter ratio-pills audition rows

## Origin

CMD-6 of the 260513-foy audit handoff. The brief specified four target pages:

- `src/pages/edo-approximation.md`
- `src/pages/schisma.md`
- `src/pages/septimal-comma.md`
- `src/pages/syntonic-comma.md`

After re-surveying the four pages, one was found to be misclassified by the audit:

- **`syntonic-comma.md` has no `Plot` chart at all** — no `import * as Plot`,
  no `Plot.plot`/`Plot.dot`/`Plot.barX`. Only inline `playInterval` + a
  single `playDyad` button exist. There is no scatter to pin a pills row
  to. Documenting this as audit-classification correction; **no edit
  applied to this page.**

The remaining three pages do have Plot scatter-style charts:

- **`edo-approximation.md`** — `Plot.dot` scatter, 7 EDOs × 5 JI anchors =
  35 deviation points.
- **`schisma.md`** — `Plot.barX` (bar chart of 3 commas; treated as
  "scatter-like" per the audit's intent of "plot points that need
  audition affordances").
- **`septimal-comma.md`** — `Plot.dot` strip chart, 2 points (7/4, 16/9).

## Scope (per page)

### schisma.md

Add a ratio-pills row directly after `display(commaBarChart);`. Three
pairs (Pythagorean comma + syntonic comma + schisma), each a `ratioPill`
+ bare ▶ `playInterval` using the existing page-level `synth`. Reuses
existing `pythagorean` / `syntonic` / `schisma` Interval bindings; no
new imports needed (page already imports `ratioPill` + `playInterval`).

### septimal-comma.md

Add a ratio-pills row directly after `display(partialsChart);`. Two
pairs (harmonic 7th 7/4 + Pythagorean minor 7th 16/9), each a `ratioPill`
+ bare ▶ `playInterval`. Reuses existing `harmonicSeventh` /
`pythagoreanMinorSeventh` Interval bindings; no new imports needed.

### edo-approximation.md

Add an interactive audition grid directly after `display(scatterChart);`.
The chart plots 35 points (7 EDOs × 5 JI anchors); a flat 35-element
pills row would be visually unwieldy, so the layout uses **5 rows × 8
elements each**:

- 1 pure-JI `ratioPill` + bare ▶ `playInterval` per row (5 total)
- 7 per-EDO step buttons per row (35 total)
- Total: **40 audition elements** organized as 5 rows × 8 buttons

Per-EDO buttons reuse the existing `playStepAt(label, cents)` factory
(already defined for the three isolated audition buttons at the bottom
of the page). Each button label shows the signed cents deviation
(`+X.XX¢` / `−X.XX¢` / `±0`) for quick cross-reference with the chart.

The math is byte-equivalent to `approxMatrix` (same `Math.round(cents /
stepCents)` derivation) — but the audition grid recomputes inline to
keep dependency graph shallow.

## Out of scope

- **`syntonic-comma.md`** — no chart exists; documented above.
- The existing isolated audition buttons on each page (`playPure7` +
  `play31_7` + `play12_7` on edo-approximation; the 3 inline
  `playInterval` bullets + `playDyad` on schisma + septimal-comma) —
  audit explicitly said "do not remove them; the pills row supplements
  the chart."
- The bar / strip / scatter charts themselves — not modified.
- The deviation table on edo-approximation.md — out of scope; only the
  scatter chart gets a pills supplement per audit.
- The live N-input deviation row on edo-approximation.md — out of scope.

## Verification

- `npx tsc --noEmit` — clean
- `npx vitest run` — all tests pass
- `npm run build` — clean, all links validated
- `npm run dev` — three modified pages return HTTP 200, no server errors

## Atomic commit

Two-commit pattern (matching CMD-5 precedent):
1. `feat(audition):` — three page edits.
2. `docs(quick-260513-nt2):` — PLAN + SUMMARY + STATE row.
