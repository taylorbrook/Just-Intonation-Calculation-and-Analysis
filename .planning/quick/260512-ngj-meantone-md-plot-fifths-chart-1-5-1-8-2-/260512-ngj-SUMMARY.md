---
phase: quick-260512-ngj
status: complete
files_modified:
  - src/pages/meantone.md
commits:
  - hash: f78369d
    message: "feat(quick-260512-ngj): extend meantone variants table to 6 rows (1/5-comma Verheijen, 2/7-comma Zarlino, 1/8-comma)"
    lines: "+10 / -4"
  - hash: 4478eff
    message: "feat(quick-260512-ngj): meantone.md — Plot horizontal cents-axis chart showing six tempered fifths + syntonic-comma bracket"
    lines: "+81 / -0"
  - hash: 4c5b540
    message: "feat(quick-260512-ngj): meantone.md — spiral-of-fifths wolf viz at quarter.fifth + Further reading H2"
    lines: "+30 / -0"
metrics:
  vitest_baseline: 302 passed (24 files)
  vitest_final: 302 passed (24 files)
  lint_types_baseline_errors: 5 (pre-existing — `npm:` specifier resolution in non-markdown files)
  lint_types_final_errors: 5 (unchanged — markdown is not type-checked by Framework / tsc)
  build_status: clean
  meantone_html_size_baseline: 25 kB Page / 391 kB Imports / 68 kB Files (24K on disk after Task 1 only)
  meantone_html_size_final: 34 kB Page / 920 kB Imports / 68 kB Files (33K on disk after all three tasks)
  meantone_html_size_delta: "+9 kB Page / +529 kB Imports (Plot is heavy) / 0 kB Files"
tdd: skipped — markdown-page edit; no testable units. No RED/GREEN cycle required (plan declared this).
---

# Quick 260512-ngj — meantone.md chart + variants + spiral-wolf + Further reading

## What was built

Single additive edit to `src/pages/meantone.md`:

1. Extended the existing `tempered(n)` callsites with three new bindings (`verheijen = tempered(5)`, `eighth = tempered(8)`, `zarlino = tempered(7 / 2)`) and the variants-table IIFE from 3 rows to 6 rows, ordered: 1/4 Aron → 1/3 Salinas → 1/6 Silbermann → 1/5 Verheijen → 2/7 Zarlino → 1/8.
2. Added a Plot horizontal cents-axis strip chart that visualizes all six tempered fifths against a 0..`pureFifth.cents` axis. The chart is placed between the `## Three historical choices for n` H2 and the variants table, with a brief introductory prose paragraph. The pure 3/2 sits at the right edge; a red horizontal segment (drawn with `Plot.link`) brackets exactly one syntonic comma from `pureFifth.cents − syntonic.cents` to `pureFifth.cents`. Each tempered fifth is marked with a dashed blue vertical, a filled dot, and a per-row alternating-`dy` label (1/n).
3. Inserted a new `## The wolf at k=12 (1/4-comma meantone)` H2 section between the third 1/6-comma Silbermann bullet and the existing `## Audition — the 1/4-comma equivalence` H2, embedding `spiralOfFifths(12, { temperedFifthCents: quarter.fifth, highlightWolf: true })` — the spiral component's tempered branch (ratio labels dropped; signed cents-from-12-TET per node; dashed red chord between k=12 and k=0 marking the meantone wolf at ≈ −40.7¢).
4. Appended `## Further reading` after `## See also` with a link + 1-paragraph description of the Xenharmonic Wiki Meantone_family article.

## Discipline / Pitfall compliance

- **Pitfall #1 (kernel-exact vs cents projection).** All Plot data rows pull cents from existing bindings: `pureFifth.cents`, `syntonic.cents`, `quarter.fifth`, `third.fifth`, `sixth.fifth`, `verheijen.fifth`, `eighth.fifth`, `zarlino.fifth`. No float-cents literals were introduced in any of the three new code surfaces (chart cell, spiral interpolation, or `tempered(n)` callsites). `pureFifth` and `syntonic` remain `Interval` bindings; `.cents` is read only at chart-data construction time (display boundary).
- **Pitfall #2 (one synth owner).** The synth cell was not touched. Exactly one `createSynth()` call site remains on the page (line 19); the existing import-cell comment that mentions the substring "createSynth()" pre-dates this plan.
- **T-02-22 (XSS).** The variants-table IIFE was edited (3 new entries appended to the `rows` array) without introducing `innerHTML`. All cell contents still flow through `createElement` + `textContent`. The pre-existing pedagogical comment that mentions the word "innerHTML" while documenting what's *not* done was preserved as-is.
- **Pitfall #16 (cents precision ≥ 3 decimals).** New variants-table rows use the same `fmt = (c) => c.toFixed(3)` format as the original 3 rows.

## The three commits

| Hash      | Lines      | Description                                                                                              |
| --------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `f78369d` | +10 / −4   | Task 1 — variants table extended from 3 to 6 rows; new `tempered(n)` callsites for 1/5, 1/8, 2/7.        |
| `4478eff` | +81 / 0    | Task 2 — Plot strip chart cell + `import * as Plot` + `import { spiralOfFifths }` + prose intro paragraph. |
| `4c5b540` | +30 / 0    | Task 3 — `## The wolf at k=12` H2 with `spiralOfFifths(12, ...)` embed + `## Further reading` H2.        |

Each commit modifies only `src/pages/meantone.md`. No other files were touched.

## Verify-gate results

| Gate                                                                       | Result | Notes                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1: `verheijen|eighth|zarlino = tempered(` bindings present            | PASS   | 3 matches at lines 59-61.                                                                                                                                                                                                                                                                                                                                                                      |
| Task 1: `grep -c 'tempered('` ≥ 7 (or 6 callsites alone)                   | PASS   | 6 matches (definition uses `=` not `(`, so the count is 6 callsites alone — plan accepted this form).                                                                                                                                                                                                                                                                                          |
| Task 1: `grep -c 'createSynth()'` == 1 (Pitfall #2)                        | INTERPRETED PASS — gate text fails on baseline | The literal-substring grep counts 2 (one call site + one pedagogical comment); both pre-date this plan. The Pitfall #2 *intent* (exactly one call site) holds: line 19 is the only `createSynth()` call site. Gate-as-written would have failed on the original file too — this is a known gate-text imprecision, flagged below as a deviation.                                          |
| Task 2: `new Interval(` count unchanged from baseline                      | PASS   | 4 matches both before and after.                                                                                                                                                                                                                                                                                                                                                              |
| Task 2: 0 float-cents-literal matches in the new chart cell                | PASS   | My new code introduces zero float-cents literals matching the gate regex. Two baseline matches remain (line 27 in a Kernel-exact comment; line 317 in pre-existing prose `centsToRatio(696.578)`) — both pre-date this plan and are out of scope per the SCOPE BOUNDARY rule.                                                                                                                |
| Task 2: `npm run build` clean                                              | PASS   | All 17 pages render; 79 links validated; no errors.                                                                                                                                                                                                                                                                                                                                          |
| Task 3: `spiralOfFifths(12,` present                                       | PASS   | 1 match at line 266.                                                                                                                                                                                                                                                                                                                                                                          |
| Task 3: `temperedFifthCents:\s*quarter\.fifth` present                     | PASS   | 1 match at line 266.                                                                                                                                                                                                                                                                                                                                                                          |
| Task 3: `^## Further reading` present                                      | PASS   | 1 match at line 322.                                                                                                                                                                                                                                                                                                                                                                          |
| Task 3: `en\.xen\.wiki/w/Meantone_family` present                          | PASS   | 1 match at line 324.                                                                                                                                                                                                                                                                                                                                                                          |
| Task 3: H2 ordering correct                                                | PASS   | The construction → Three historical choices → The wolf at k=12 → Audition — 1/4-comma equivalence → Audition — "before" → Why this layering matters → See also → Further reading. Verified at lines 140 / 149 / 255 / 273 / 289 / 295 / 305 / 322.                                                                                                                                              |
| Cross-task: imports `Plot` and `spiralOfFifths` present                    | PASS   | Lines 12 and 13 of the existing single import cell.                                                                                                                                                                                                                                                                                                                                          |
| Cross-task: `! grep 'innerHTML'`                                           | BASELINE — gate text fails on original file | 1 match — a pre-existing comment in the variants-table IIFE that documents what's *not* done (no `innerHTML` is used as an actual sink). Gate-as-written would have failed on the original file too.                                                                                                                              |
| `npm test -- --run` (vitest)                                               | PASS   | 302 / 302 tests pass (unchanged from baseline).                                                                                                                                                                                                                                                                                                                                              |
| `npm run lint:types`                                                       | UNCHANGED | 5 baseline errors (all `npm:` specifier resolution + 2 implicit-any in `src/components/lattice.ts`); none introduced by this plan. Markdown files are not type-checked.                                                                                                                                                                                                                |
| `npm run build`                                                            | PASS   | Clean. meantone bundle: 34 kB Page / 920 kB Imports / 68 kB Files. 33 KiB final on disk.                                                                                                                                                                                                                                                                                                      |

## Deviations from plan

1. **Syntonic-comma bracket renderer — `Plot.link` instead of `Plot.ruleY` with `x1`/`x2`.** Plan executor discretion explicitly permitted this swap. `Plot.ruleY` is documented for horizontal rules spanning the full x-axis at a given y, not for arbitrary horizontal segments; `Plot.link` is the documented Plot mark for line segments between two `(x1, y1)` and `(x2, y2)` endpoints. The visual result is identical: one horizontal red segment at the strip lane's lower half marking the syntonic-comma span. Recorded here per the constraint's documentation requirement.

2. **Label collision avoidance — per-row alternating `dy`.** Plan executor discretion explicitly permitted this. With six markers clustered between ≈ 694.8¢ (1/3-comma, leftmost) and ≈ 699.9¢ (1/8-comma, rightmost), a uniform `dy: -14` would overlap the labels. The implementation uses a callback `dy: (_d, i) => (i % 2 === 0 ? -14 : 18)` — even-index rows (1/8, 1/5, 2/7) sit 14 px above the dot; odd-index rows (1/6, 1/4, 1/3) sit 18 px below. Recorded here per the constraint's documentation requirement.

3. **Historical attributions kept long-form.** Plan permitted either `1/5-comma (Verheijen, 1599)` / `2/7-comma (Zarlino, 1558)` or shorter year-less forms. Used the long form to match the existing baseline rows' historical-attribution style (`1/4-comma (Aron)`, `1/3-comma (Salinas)`, `1/6-comma (Silbermann)`).

4. **Pre-existing gate-text imprecision (not a code deviation).** Three of the plan's anti-pattern grep gates (`createSynth()`, `innerHTML`, and the float-cents-literal regex) would have failed on the **baseline** file at HEAD before my edits — they count pedagogical comments, kernel-exact `Interval` constructor comments, and pre-existing prose mentions of `centsToRatio(696.578)`. The Pitfall **intent** is honored (one synth call site, no `innerHTML` assignment as a DOM sink, no float-cents literals flowing into kernel/Plot data). Out-of-scope baseline conditions per the SCOPE BOUNDARY rule — none introduced by this plan.

## Out of scope / not touched

- `src/styles.css` — `spiral-of-fifths.css` is already globally imported at line 32 (confirmed); no edit needed or made.
- `src/components/spiral-of-fifths.ts` — used as-is via the existing public API.
- All other markdown pages, all `src/lib/` and `src/audio/` modules.
- No new tests added (markdown-page edit; no testable units).

## Self-Check: PASSED

Verified via shell:

```
FOUND: src/pages/meantone.md
FOUND: f78369d  (Task 1 commit)
FOUND: 4478eff  (Task 2 commit)
FOUND: 4c5b540  (Task 3 commit)
```

All three commits visible in `git log --oneline -4`; the file at `src/pages/meantone.md` is on disk at 322 lines and renders cleanly via `npm run build`.
