---
quick_id: 260513-nt2
status: complete
date: 2026-05-14
slug: cmd6-scatter-pills
deliverable: ratio-pills audition rows beside 3 Plot charts (4th page skipped — no chart present)
---

# Quick Task 260513-nt2: CMD-6 — Plot scatter ratio-pills audition rows

## What This Task Delivered

CMD-6 of the 260513-foy audit handoff: clickable ratio-pills rows beside
each `Plot` scatter chart on the four pages flagged by the audit.

**Audit correction:** one of the four pages was misclassified — surveyed
all four and confirmed only three have Plot charts. The fourth
(`syntonic-comma.md`) has no `Plot` import at all, only inline play
buttons. Skipped with rationale documented below.

### schisma.md — 3 pills

Added a pills row directly after `display(commaBarChart);`. Three pairs
(Pythagorean comma / syntonic comma / schisma), each a `ratioPill(iv)` +
bare ▶ `playInterval(iv, synth)`. Reuses existing `pythagorean` /
`syntonic` / `schisma` Interval bindings — no new allocations.

### septimal-comma.md — 2 pills

Added a pills row directly after `display(partialsChart);`. Two pairs
(harmonic 7th `7/4` / Pythagorean minor 7th `16/9`), each a `ratioPill`
+ bare ▶ `playInterval`. Reuses existing `harmonicSeventh` /
`pythagoreanMinorSeventh` Interval bindings.

### edo-approximation.md — 40 audition elements (5 rows × 8)

Added an interactive audition grid directly after `display(scatterChart);`.
The chart plots 35 points (7 EDOs × 5 JI anchors); a flat 35-element row
would be visually unwieldy, so the layout is **5 rows × 8 elements** —
one pure-JI `ratioPill` + bare ▶ `playInterval` at the head, followed by
seven per-EDO step buttons.

Per-EDO buttons reuse the existing `playStepAt(label, cents)` factory
(defined for the three isolated audition buttons at the bottom of the
page); each button label carries the signed cents deviation
(e.g. `12-EDO (+13.69¢)`, `31-EDO (+0.78¢)`, `53-EDO (−0.07¢)`) so the
button doubles as a chart cross-reference.

Math discipline: the nearest-step computation
(`Math.round(iv.cents / stepCents)`) is byte-equivalent to `approxMatrix`
above — the grid recomputes inline (no new top-level binding) to keep
the dependency graph shallow. EDO-step cents pass through `centsToRatio`
inside `playStepAt` only at the synth boundary, so Pitfall #1 stays
honored.

### syntonic-comma.md — SKIPPED

Audit correction. The page has **no `Plot` chart**: no `import * as Plot`,
no `Plot.plot`/`Plot.dot`/`Plot.barX`/`Plot.line` anywhere in the source.
Only an inline list of 3 `playInterval` bullets + 1 `playDyad` button
exists. There is no scatter (or any other Plot widget) to pin a pills
row to. Adding a pills row would either:

1. Duplicate the existing 3 inline audition buttons (regression risk —
   the page already auditions exactly these three intervals via labelled
   `playInterval` calls in prose), or
2. Add a standalone "pills with no chart" widget, which contradicts the
   audit's stated pattern of "pills *beside* the chart" and would be
   pedagogically isolated.

Recommended follow-up: either close this audit item with no action
(page already has the audition affordance it needs), OR open a separate
quick task to *add* a comma-magnitude bar chart to syntonic-comma.md
matching the schisma.md template, then attach a pills row to the new
chart. Both are out of scope for CMD-6 as written.

## Files Modified

- `src/pages/schisma.md` (+30/−0): 3-pair pills row + caption.
- `src/pages/septimal-comma.md` (+28/−0): 2-pair pills row + caption.
- `src/pages/edo-approximation.md` (+47/−0): 5-row audition grid +
  caption (40 audition elements total).

No changes to:

- `src/pages/syntonic-comma.md` — no chart, no edit.
- `src/components/*` — pure markdown-page edits; existing factories
  (`ratioPill`, `playInterval`, `playStepAt`) suffice.
- Existing inline play buttons on any modified page — audit explicitly
  preserved them.
- Existing charts on any page — bar / strip / scatter renders unchanged.

## Verification

- `npx tsc --noEmit` → clean
- `npx vitest run` → 312/312 tests pass across 24 files
- `npm run build` → 21 pages render, 111 links validated
- `npm run dev` → all three modified pages return HTTP 200, server log
  clean

Page bundle deltas:
- schisma: 26 → 27 kB (+1 kB)
- septimal-comma: 23 → 24 kB (+1 kB)
- edo-approximation: 39 → 41 kB (+2 kB for the 5×8 audition grid)
- Total imports unchanged (all factories already imported on every page)

## Discipline Honored

- **Pitfall #1 (BigInt source of truth):** kernel JI Intervals
  (`pythagorean`/`syntonic`/`schisma`/`harmonicSeventh`/
  `pythagoreanMinorSeventh`/`fifth`/`majorThird`/`harm7`/`majorWhole`/
  `harm11`) unchanged; EDO-step cents only pass to `centsToRatio` inside
  `playStepAt` at the audio boundary.
- **Pitfall #2 (one createSynth per page):** all three modified pages
  already had a single `createSynth()` cell; no new instantiation.
- **D-08 audio defaults:** ▶ buttons, 440 Hz root, 1.5s duration —
  inherits `playInterval` / `playStepAt` defaults.
- **D-08 three-layer discipline:** viz stays viz-only; audition wiring
  lives at the page level capturing `synth` from cell scope.
- **T-02-22/T-02-23 XSS:** `createElement` + `appendChild` only for
  wrappers; `ratioPill` / `playInterval` / `playStepAt` factories handle
  all dynamic strings via `textContent`. No `innerHTML` for derived
  content.

## Status

CMD-6 from the 260513-foy six-command handoff is **done**, with the
audit-classification correction noted for `syntonic-comma.md`. All six
audit commands now resolved:

- CMD-1 ✓ (260513-jir) — spiralOfFifths.onStepClick
- CMD-2 ✓ (260513-jqi) — odd-limits clickable diamonds
- CMD-3 ✓ (260513-kb6) — spiralOfFifths wired on pyth-comma + meantone
- CMD-4 ✓ (260513-kl9) — tenney-height ratio-pills row
- CMD-5 ✓ (260513-li9) — meantone + well-temperament Play columns
- CMD-6 ✓ (260513-nt2) — scatter ratio-pills (this task)

Source commit `be75ecf`.
