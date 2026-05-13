---
phase: quick-260512-ngj
mode: quick
created: 2026-05-12
description: "meantone.md: Plot fifths-chart + 1/5+1/8+2/7-comma rows + spiral-of-fifths wolf + Further reading"
files_modified:
  - src/pages/meantone.md
must_haves:
  truths:
    - "Kernel-exact: pureFifth/syntonic remain Interval bindings; .cents read only at chart-data construction (Pitfall #1)"
    - "Pitfall #2: synth cell unchanged — exactly ONE createSynth() in the page"
    - "T-02-22 XSS: variantsTable IIFE still uses createElement + textContent for all 6 rows"
    - "2/7-comma fifth = tempered(7/2) — substituting n=7/2 into `pureFifth.cents - syntonic.cents/n` yields the canonical pureFifth.cents - (2/7)*syntonic.cents"
  artifacts:
    - "Plot horizontal cents-axis chart placed BEFORE `display(variantsTable)` showing 6 tempered fifths + syntonic-comma annotation against a 0..pureFifth.cents axis"
    - "Variants table extended from 3 rows → 6 rows (1/5-comma Verheijen, 2/7-comma Zarlino, 1/8-comma)"
    - "spiralOfFifths(12, { temperedFifthCents: quarter.fifth, highlightWolf: true }) embedded as a new H2 section between the third bullet and the existing `## Audition — the 1/4-comma equivalence`"
    - "`## Further reading` H2 appended after `## See also` with en.xen.wiki/w/Meantone_family bullet"
  key_links:
    - "src/pages/meantone.md:5 (existing import cell — Plot + spiralOfFifths added inline)"
    - "src/pages/meantone.md:32 (tempered(n) factory — reused for n=5, n=8, n=7/2)"
    - "src/pages/meantone.md:62 (variantsTable IIFE — 3 more rows appended to the `rows` array)"
    - "src/components/spiral-of-fifths.ts (HTMLDivElement factory, accepts opts.temperedFifthCents and opts.highlightWolf)"
    - "src/styles.css:32 (spiral-of-fifths.css already globally imported — NO styles.css edit needed)"
---

# Plan: meantone.md — chart + variants + spiral-wolf + Further reading

## Goal

Single additive edit to `src/pages/meantone.md` that (a) visualizes the six meantone variants on a shared cents axis, (b) adds three new variants to the existing DOM table, (c) embeds the existing spiral-of-fifths component at n=12 with the 1/4-comma fifth (so the closure undershoot — the meantone wolf — is visible), and (d) appends a Further reading section. Discipline headline: kernel-exact `Interval` stays the source of truth; cents derivation happens via `.cents` projection at the display boundary only.

## Constraints (locked)

- Single-file edit: `src/pages/meantone.md` only.
- No new components, no new tests, no styles.css change (`spiral-of-fifths.css` already globally imported at styles.css:32).
- Existing cells preserved byte-identical: import cell (only ADDS two new import lines), synth cell, kernel-anchors cell, `tempered(n)` factory cell, `playTempered` button-factory cell, the existing `playPureMajor3` / `playQuarterMajor3` / `playPythMajor3` bindings, the H1 + intro prose, `## The construction`, the three existing bullet paragraphs under `## Three historical choices for n`, the two `## Audition` sections, `## Why this layering matters`, `## See also`.
- The variants-table IIFE itself is edited (3 new entries appended to the local `rows` array); the IIFE's surrounding code and the table-construction loop are unchanged.
- Imports: add `import * as Plot from "npm:@observablehq/plot";` and `import { spiralOfFifths } from "../components/spiral-of-fifths.js";` to the EXISTING single import cell at the top of the page (Framework module-scope rule — a second import cell would re-bind `Interval`, etc.).
- Pitfall #1: NO hardcoded cents literals in Plot data rows. All numeric values come from `pureFifth.cents`, `syntonic.cents`, `quarter.fifth`, `third.fifth`, `sixth.fifth`, and the new `verheijen.fifth` / `eighth.fifth` / `zarlino.fifth` bindings.
- Pitfall #2: exactly one `createSynth()` call site (the existing one).
- Pitfall #16: cents display precision ≥ 3 decimals (existing table uses `c.toFixed(3)` — same for new rows).
- T-02-22: createElement + textContent only in the variants table IIFE.

---

## Task 1 — extend `tempered(n)` callsites + variants table to 6 rows

**Files:** `src/pages/meantone.md`

**Action:**

1. In cell 4 (the `tempered`-factory cell), after the existing `const sixth = tempered(6);` line, add:
   ```ts
   const verheijen  = tempered(5);    // 1/5-comma (Verheijen, 1599)
   const eighth     = tempered(8);    // 1/8-comma
   const zarlino    = tempered(7 / 2); // 2/7-comma (Zarlino, 1558) — n = 7/2 ⇒ comma fraction 1/n = 2/7
   ```
   And update the `variants` array literal:
   ```ts
   const variants = [quarter, third, sixth, verheijen, eighth, zarlino];
   ```

2. In cell 5 (the `variantsTable` IIFE, around lines 67-96), extend the local `rows` array from 3 entries to 6 entries — append (in this order, after the existing 1/6-comma row):
   ```ts
   { label: "1/5-comma (Verheijen, 1599)", v: verheijen, sig: "fifths only ~4.3¢ flat; major 3rd ~6.9¢ sharp of pure 5/4 — milder than 1/4-comma" },
   { label: "2/7-comma (Zarlino, 1558)",   v: zarlino,   sig: "equalizes the major-3rd and minor-3rd deviations from pure (both ~5.4¢ off)" },
   { label: "1/8-comma",                    v: eighth,    sig: "softest meantone — closest variant to 12-TET (fifths only ~2.7¢ flat)" },
   ```
   Construction loop and DOM element creation are unchanged — same `createElement` + `textContent` pattern for the three new rows.

**Verify:**
- `grep -nE 'const (verheijen|eighth|zarlino) = tempered\(' src/pages/meantone.md` → 3 matches.
- `grep -c 'tempered(' src/pages/meantone.md` ≥ 7 (factory definition + 6 callsites; or 6 callsites alone if the planner counts only invocations).
- `grep -c 'createSynth()' src/pages/meantone.md` == 1 (Pitfall #2).
- View the rendered page → variants table shows 6 rows in the specified order.

**Done:** Variants table is 6 rows; signature-property column is the 5th column for every row.

**Commit:** `feat(quick-260512-ngj): extend meantone variants table to 6 rows (1/5-comma Verheijen, 2/7-comma Zarlino, 1/8-comma)`

---

## Task 2 — Plot horizontal cents-axis chart BEFORE the variants table

**Files:** `src/pages/meantone.md`

**Action:**

1. In the top-of-page import cell (cell 1, lines 5-12), append two new imports inline:
   ```ts
   import { spiralOfFifths } from "../components/spiral-of-fifths.js";
   import * as Plot from "npm:@observablehq/plot";
   ```
   (Framework module-scope rule: stay in the existing single import cell — do NOT add a second ` ```ts ` block of imports.)

2. Insert a new `ts` cell **immediately before** the `display(variantsTable);` cell (the one at the current line 143-145). This new cell builds `fifthsChart` from kernel-exact projections and calls `display(fifthsChart)`:

   ```ts
   // Plot strip chart — six tempered meantone fifths on a 0..pureFifth.cents axis.
   // Pitfall #1: cents derived ONCE from kernel-exact Intervals (pureFifth.cents,
   // syntonic.cents) and the existing tempered-fifth bindings (quarter.fifth,
   // third.fifth, sixth.fifth, verheijen.fifth, eighth.fifth, zarlino.fifth).
   // No float literals in the data rows.
   const fifthsData = [
     { label: "1/8",   cents: eighth.fifth    },
     { label: "1/6",   cents: sixth.fifth     },
     { label: "1/5",   cents: verheijen.fifth },
     { label: "1/4",   cents: quarter.fifth   },
     { label: "2/7",   cents: zarlino.fifth   },
     { label: "1/3",   cents: third.fifth     },
   ];
   // Span of the syntonic comma between the widest-flat tempered fifth (1/3-comma,
   // narrowest = smallest cents value) and the pure 3/2. Actually we want the span
   // from pureFifth.cents − syntonic.cents (which equals exactly fifth at n=1 — the
   // "1-comma" hypothetical) shown as the syntonic-comma bracket. Project the span
   // as: from (pureFifth.cents − syntonic.cents) to pureFifth.cents — that IS one
   // syntonic comma, by construction.
   const commaSpanLeft  = pureFifth.cents - syntonic.cents;
   const commaSpanRight = pureFifth.cents;

   const fifthsChart = Plot.plot({
     width: 640,
     height: 180,
     marginLeft: 40,
     marginRight: 40,
     marginBottom: 50,
     marginTop: 30,
     x: {
       label: "Cents (flat of pure)",
       domain: [0, Math.ceil(pureFifth.cents)],
       grid: true,
       tickFormat: (v) => String(v),
     },
     y: { axis: null, domain: [-1, 1] },
     marks: [
       // 0¢ baseline (visual anchor for "flat of pure" reading).
       Plot.ruleX([0], { stroke: "#888", strokeDasharray: "2,3" }),
       // Pure-3/2 reference at ~701.955¢.
       Plot.ruleX([pureFifth.cents], { stroke: "#888", strokeWidth: 1.5 }),
       Plot.text(
         [{ x: pureFifth.cents, y: 0.85, text: `pure 3/2 (${pureFifth.cents.toFixed(3)}¢)` }],
         { x: "x", y: "y", text: "text", textAnchor: "end", dx: -6, fontSize: 11, fill: "#888" },
       ),
       // Syntonic-comma bracket: a horizontal segment from (pureFifth.cents − syntonic.cents)
       // to pureFifth.cents at y = -0.65, plus a centered label.
       Plot.ruleY([-0.65], {
         x1: commaSpanLeft,
         x2: commaSpanRight,
         stroke: "#c45656",
         strokeWidth: 1.5,
       }),
       Plot.text(
         [{
           x: (commaSpanLeft + commaSpanRight) / 2,
           y: -0.85,
           text: `↔ ${syntonic.cents.toFixed(3)}¢ (syntonic comma)`,
         }],
         { x: "x", y: "y", text: "text", textAnchor: "middle", fontSize: 11, fill: "#c45656" },
       ),
       // Tempered-fifth markers — dashed verticals + dots + labels.
       Plot.ruleX(fifthsData, { x: "cents", stroke: "#4269d0", strokeDasharray: "3,3", strokeWidth: 1.5 }),
       Plot.dot(fifthsData,   { x: "cents", y: 0, fill: "#4269d0", r: 4 }),
       Plot.text(fifthsData,  {
         x: "cents",
         y: 0,
         text: "label",
         dy: -14,
         fontSize: 11,
         fontWeight: 600,
         fill: "#4269d0",
       }),
     ],
   });
   display(fifthsChart);
   ```

3. The chart's H2 context: place the chart-construction cell **and** its `display(fifthsChart)` call between the existing `## Three historical choices for n` H2 (currently line 141) and the `display(variantsTable)` line (currently line 144). A brief prose paragraph BEFORE the chart cell introduces it; the existing prose ("Three historical choices for n" and the three bullets after the table) stays in place. The chart appears between the section's heading and the table.

**Verify:**
- `grep -nE '\bnew Interval\(' src/pages/meantone.md` count unchanged from baseline (no extra kernel allocations).
- `grep -nE '(701\.955|701\.9[0-9]+|697\.176|698\.371|695\.810|696\.578|699\.890|694\.786|21\.50[5-7]|21\.[0-9]+)' src/pages/meantone.md` → 0 matches in the new chart cell (Pitfall #1 — all cents come from bindings).
- `npm run build` clean (Observable Plot is already a Framework transitive dep; the new import via `npm:` will resolve).
- View the rendered chart: 6 dashed verticals + dots, a pure-3/2 reference line at the right edge, a red horizontal bracket spanning the syntonic comma between the rightmost-of-tempered (at `pureFifth.cents − syntonic.cents`) and the pure line, all on a 0..702¢ axis. The 1/8 marker is rightmost-of-tempered (least flat), the 1/3 marker is leftmost-of-tempered (most flat).

**Done:** Plot strip chart renders before the variants table; all six tempered fifths visible as flat-of-pure markers; the syntonic comma is labeled as a bracket.

**Commit:** `feat(quick-260512-ngj): meantone.md — Plot horizontal cents-axis chart showing six tempered fifths + syntonic-comma bracket`

---

## Task 3 — spiralOfFifths(12) at quarter.fifth + Further reading H2

**Files:** `src/pages/meantone.md`

**Action:**

1. Append a new H2 section AFTER the existing third bullet paragraph (the 1/6-comma Silbermann bullet, currently ending around line 167 with "ultimately 12-TET.") and BEFORE the existing `## Audition — the 1/4-comma equivalence` H2 (currently line 168). Section structure:

   ```markdown
   ## The wolf at k=12 (1/4-comma meantone)

   Twelve stacked 1/4-comma fifths undershoot the octave — the meantone wolf.
   The spiral below traces all twelve 1/4-comma fifths around the cycle, each
   labeled with its signed cents-from-12-TET (ratio labels are dropped because
   the tempered fifth is irrational). Step 0 sits at 12 o'clock; the chain
   sweeps clockwise. Step 12 lands a hair *before* step 0 rather than on top of
   it — the dashed red chord between them IS the meantone wolf: the closure
   gap that any 12-tone scale built from 1/4-comma fifths must absorb somewhere
   on the chain.

   ${spiralOfFifths(12, { temperedFifthCents: quarter.fifth, highlightWolf: true })}

   For reference: a chain of [pure 3/2 fifths overshoots the octave by a
   Pythagorean comma (+23.46¢)](/pages/pythagorean-comma); 1/4-comma
   meantone's wolf goes the other way — twelve fifths come up short of seven
   octaves by ≈ 40.7¢.
   ```

   The `quarter.fifth` binding from cell 4 is in module scope and visible to this markdown interpolation. `temperedFifthCents` triggers the spiral component's tempered branch (ratio labels dropped; cents-from-12-TET derived from octave-reduced cumulative cents per the component's API at src/components/spiral-of-fifths.ts:110-128).

2. Append `## Further reading` after `## See also` (currently line 200), at the very bottom of the file:

   ```markdown
   ## Further reading

   - [Meantone family on the Xenharmonic Wiki](https://en.xen.wiki/w/Meantone_family) —
     community-curated reference for the regular-temperament family generated
     by tempering out the syntonic comma. Covers the full continuum of comma
     fractions (1/n-comma meantone for arbitrary n ∈ ℝ), the historical named
     variants as points on that line (Aron 1/4, Salinas 1/3, Silbermann 1/6,
     Verheijen 1/5, Zarlino 2/7, 12-TET ≈ 1/11.65-comma), the MOS pattern
     induced by each variant, and how the meantone family fits inside the
     broader regular-temperament zoo (sister families: schismatic, dominant,
     mavila).
   ```

**Verify:**
- `grep -nE 'spiralOfFifths\(12,' src/pages/meantone.md` → 1 match.
- `grep -nE 'temperedFifthCents:\s*quarter\.fifth' src/pages/meantone.md` → 1 match.
- `grep -nE '^## Further reading' src/pages/meantone.md` → 1 match (line > 200).
- `grep -nE 'en\.xen\.wiki/w/Meantone_family' src/pages/meantone.md` → 1 match.
- `grep -nE '^## ' src/pages/meantone.md` shows ordering: `## The construction` < `## Three historical choices for n` < `## The wolf at k=12 (1/4-comma meantone)` < `## Audition — the 1/4-comma equivalence` < `## Audition — the "before"` < `## Why this layering matters` < `## See also` < `## Further reading`.
- Run the Observable build and visually confirm the spiral SVG renders with: no ratio labels (tempered branch), signed cents-from-12-TET on each node, a dashed red chord between k=12 and k=0 marking the wolf.

**Done:** Spiral component visible at n=12 with the 1/4-comma fifth; wolf chord rendered; Further reading H2 with Xen wiki link present at file bottom.

**Commit:** `feat(quick-260512-ngj): meantone.md — spiral-of-fifths wolf viz at quarter.fifth + Further reading H2`

---

## Cross-task gates

After ALL three tasks, before final SUMMARY:

```bash
# Type-check (baseline unchanged: 5 pre-existing npm:-specifier errors in non-markdown files; markdown is not type-checked by Framework)
npm run lint:types

# Test suite unchanged (no test files added)
npm test -- --run

# Observable build clean
npm run build
```

Anti-pattern grep gates (ALL must hold):
```bash
# Pitfall #1: no float cents literals in the page that would re-introduce magic numbers
! grep -nE '701\.95[0-9]+|697\.176|694\.78[0-9]+|698\.37[0-9]+|695\.81[0-9]+|696\.5[7-8][0-9]+|699\.89[0-9]+|21\.50[5-7]' src/pages/meantone.md

# Pitfall #2: one synth owner
[ "$(grep -c 'createSynth()' src/pages/meantone.md)" = "1" ]

# T-02-22 XSS: no innerHTML on the page
! grep -n 'innerHTML' src/pages/meantone.md

# Imports as specified
grep -q 'import \* as Plot from "npm:@observablehq/plot"' src/pages/meantone.md
grep -q 'import { spiralOfFifths } from "../components/spiral-of-fifths.js"' src/pages/meantone.md
```

## SUMMARY

Write `.planning/quick/260512-ngj-meantone-md-plot-fifths-chart-1-5-1-8-2-/260512-ngj-SUMMARY.md` with: status, files modified, baseline metrics (vitest pass count, lint:types error count, build output size delta for `dist/pages/meantone.html` page bundle), and the three commit hashes.
