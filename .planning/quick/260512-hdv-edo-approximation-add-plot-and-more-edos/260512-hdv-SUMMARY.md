---
phase: quick-260512-hdv
plan: 01
status: complete
completed_at: "2026-05-12"
files_modified:
  - src/pages/edo-approximation.md
---

# Quick Task 260512-hdv — Summary

## Description (one-line, STATE.md row style)

Add Plot scatter chart (signed cents error vs JI cents, one colored series per EDO, constant point radius) above the existing deviation table on src/pages/edo-approximation.md; expand `edos = [12, 19, 31, 53]` → `[12, 19, 22, 31, 41, 53, 72]`; rename `## The four canonical EDOs` → `## The seven canonical EDOs` with three new bullets (22 = sharp-fifth 7-limit specialist; 41 = strong 5- and 7-limit; 72 = modern microtonal reference, exact 12-EDO subset); append `## Further reading` linking en.xen.wiki/w/EDO + per-EDO pages for all seven EDOs; nearest-step math (`round(c/s)` and signed `step*s - c`) byte-equivalent; `npm run lint:types` + `npx observable build` clean; page bundle ~14 kB → 34 kB and total ~391 kB → 913 kB matching comma-pump's Plot footprint.

## Files touched

- `src/pages/edo-approximation.md` — one heading rename + four insertions, additive otherwise.

## Implementation notes

- **Scatter chart cell** reads directly from `approxMatrix` (already computed earlier in the page) via `approxMatrix.flatMap(({ N, cells }) => cells.map((c, i) => ({ edo, jiLabel, jiCents: jiIntervals[i].iv.cents, error })))`. JI cents come from `Interval.cents` at the data-row boundary — no float-cents ever fed back into kernel calls (Pitfall #1 preserved).
- **Chart marks:** `Plot.ruleY([0])` reference line + `Plot.dot(data, { x: "jiCents", y: "error", fill: "edo", stroke: "edo", r: 5, title: hover tooltip })`. Colored series per EDO; constant `r: 5` so position (not size) carries the deviation.
- **Section ordering:** the chart sits under a new `## Visualizing the deviations` heading immediately ABOVE the unchanged `## The deviation table` section — chart complements the table, doesn't replace it.
- **EDO array expansion:** `[12, 19, 22, 31, 41, 53, 72]` in sorted order; the existing `approxMatrix` builder and `deviationTable` DOM builder pick up the new rows automatically (the nearest-step math is unchanged, just iterated over more N values).
- **Prose rename:** `## The four canonical EDOs` → `## The seven canonical EDOs`; the four existing bullets (12-, 19-, 31-, 53-EDO) are byte-equivalent; three new bullets inserted in sorted order between them.
  - 22-EDO bullet states ~709.09¢ 5th, +7.14¢ sharp, ~13¢ 7/4 deviation, "superpyth" temperament family context.
  - 41-EDO bullet states ~0.48¢ 5th (second only to 53-EDO), ~3¢ 7/4, but notes the direct nearest-step 5/4 is ~5.8¢ flat (with a one-line aside that schismatic-temperament mapping via a chain of 5ths is beyond the page's straight-quantization framing).
  - 72-EDO bullet states 72 = 6×12 (exact 12-EDO superset), step size ~16.67¢, every anchor within ~3¢, and notes it's primarily a theoretical common ground rather than a target keyboard.
- **Further reading** appended as the last section: one link to en.xen.wiki/w/EDO plus inline-bulleted per-EDO links for all seven EDOs (12, 19, 22, 31, 41, 53, 72).

## Verification

- `npm run lint:types` exits 0 — tsc --noEmit clean.
- `npx observable build` exits 0; 17 pages rendered, 79 links validated. `edo-approximation` page bundle now 34 kB / 913 kB total imports (matches comma-pump's footprint after Plot was added).
- All 22 grep gates in the task `<verify>` block pass — confirms Plot import, `edos` array shape, scatter chart cell, `Plot.dot(...x: "jiCents", y: "error")`, "## Visualizing the deviations" heading, `display(scatterChart)`, renamed "## The seven canonical EDOs" heading (and absence of "## The four canonical EDOs"), three new bold-EDO bullets, "## Further reading" + xen wiki links for EDO and the three new per-EDO pages, nearest-step math byte-equivalent, `display(deviationTable)` preserved.
- Manual visual spot-check deferred — the build and link validation are the strongest checks available without browser interaction; the page is ready for the user to load in `npm run dev`.

## Discipline notes

- Nearest-step math byte-equivalent: `const step = Math.round(ideal / stepCents)` and `const actual = step * stepCents` retained as-is.
- The JI anchor `Interval` constructions (`new Interval("3/2")` etc.) unchanged; `Interval.cents` projection used only at the scatter data-row boundary.
- Only one non-additive edit: the section heading rename "four" → "seven". All other prose, the `approxMatrix` and `deviationTable` builders, the audition play-button cell, and the "What the table says" / "Audition" / "Why this matters" / "See also" sections are byte-equivalent.
