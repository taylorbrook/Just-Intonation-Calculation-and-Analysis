---
phase: quick-260512-hdv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/edo-approximation.md
autonomous: true
requirements:
  - quick-260512-hdv
must_haves:
  truths:
    - "Plot import (`import * as Plot from \"npm:@observablehq/plot\";`) is added to the existing top imports cell."
    - "The `edos` array is `[12, 19, 22, 31, 41, 53, 72]` — three new EDOs added in sorted order; existing 12, 19, 31, 53 retained."
    - "The nearest-step math is byte-equivalent: `step = Math.round(ideal / stepCents)` and `error = step * stepCents - ideal`, unchanged."
    - "A new scatter chart cell exists with `Plot.plot({ … })` and `Plot.dot(data, { x: \"jiCents\", y: \"error\", … })`; rendered via `display(scatterChart)` ABOVE `display(deviationTable)`."
    - "Scatter chart x-axis is JI cents (continuous numeric); y-axis is signed cents error; points are colored by EDO (one series per EDO); constant point radius."
    - "Section heading `## The four canonical EDOs` is renamed to `## The seven canonical EDOs`; existing four bullets (12-EDO, 19-EDO, 31-EDO, 53-EDO) are unchanged."
    - "Three new bullets are added (in the renamed section) for 22-EDO, 41-EDO, and 72-EDO with the agreed framing: 22 = sharp-fifth 7-limit specialist; 41 = strong 5- and 7-limit; 72 = modern microtonal reference, exact 12-EDO subset."
    - "A new `## Further reading` section is appended as the LAST section of the file, linking en.xen.wiki/w/EDO plus per-EDO pages (12edo, 19edo, 22edo, 31edo, 41edo, 53edo, 72edo)."
    - "No existing prose paragraph or non-renamed section heading is altered (additive-only outside of the one heading rename)."
  artifacts:
    - path: "src/pages/edo-approximation.md"
      provides: "scatter chart of signed cents error vs JI cents across 7 EDOs; expanded edos array; updated 'seven canonical EDOs' section with 3 new bullets; Further reading section"
      contains: "@observablehq/plot"
  key_links:
    - from: "src/pages/edo-approximation.md (scatter chart cell)"
      to: "@observablehq/plot"
      via: "npm: specifier import"
      pattern: "import \\* as Plot from \"npm:@observablehq/plot\""
    - from: "src/pages/edo-approximation.md (scatter chart cell)"
      to: "approxMatrix"
      via: "Scatter data is `approxMatrix.flatMap(...)` projecting each row into one point per JI target."
      pattern: "approxMatrix.flatMap"
---

<objective>
Augment `src/pages/edo-approximation.md` with three additive changes:

1. Add Plot import to the existing imports cell.
2. Expand the `edos` array from `[12, 19, 31, 53]` to `[12, 19, 22, 31, 41, 53, 72]` — three new EDOs (22, 41, 72) added in sorted order. The deviation table picks them up automatically (it iterates `approxMatrix`).
3. Insert a Plot scatter chart cell ABOVE the deviation table: x = JI cents, y = signed cents error, one colored series per EDO, constant point radius. Complements the table — does not replace it.
4. Rename `## The four canonical EDOs` to `## The seven canonical EDOs` and add three new bullets briefly characterising 22-EDO, 41-EDO, 72-EDO using the agreed framing.
5. Append a `## Further reading` section linking en.xen.wiki/w/EDO and the per-EDO pages.

Math discipline: the `round(c/s)` nearest-step calculation and signed `step*s - c` deviation are unchanged. No new kernel paths; cents are still derived from `Interval.cents` at the display boundary only (Pitfall #1).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@src/pages/edo-approximation.md
@src/pages/comma-pump.md
@src/pages/harmonic-series.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Plot import, scatter chart, three new EDO rows + prose, Further reading section</name>
  <files>src/pages/edo-approximation.md</files>
  <action>
Edit `src/pages/edo-approximation.md` additively. Do not refactor or remove any existing prose, the JI interval anchors, the nearest-step math, the deviation table builder, or the audition section.

(1) **Append Plot import to the existing imports cell** (the first `ts` cell at lines 5–11). After `import { playInterval } from "../components/play-interval.js";`, add ONE line:

```ts
import * as Plot from "npm:@observablehq/plot";
```

(2) **Expand the `edos` array** at line 37. Change:

```ts
const edos = [12, 19, 31, 53];
```

to:

```ts
const edos = [12, 19, 22, 31, 41, 53, 72];
```

No other change to that cell. The downstream `approxMatrix` builder automatically produces rows for the new EDOs, and the existing `deviationTable` automatically renders the new rows.

(3) **Insert a new scatter chart cell** between the `deviationTable` builder cell (ends at line 104) and the play-button cell (starts at line 106). Insert AFTER the `})()` closing line of the `deviationTable` cell and AFTER its closing ` ``` ` fence, BEFORE the next ` ```ts ` opening that starts the play-button cell. The cell is:

```ts
// Scatter chart of signed cents error vs JI cents — one colored series per EDO.
// Complements the deviation table: same data, different projection. Reads
// directly from approxMatrix (already computed above); ji cents come from
// jiIntervals[i].iv.cents at the data-row boundary (display-projection only,
// Pitfall #1). Constant point radius — the point's POSITION encodes the error,
// not its size.
const scatterChart = (() => {
  const data = approxMatrix.flatMap(({ N, cells }) =>
    cells.map((c, i) => ({
      edo: `${N}-EDO`,
      jiLabel: c.label,
      jiCents: jiIntervals[i].iv.cents,
      error: c.error,
    })),
  );
  return Plot.plot({
    width: 720,
    height: 360,
    marginLeft: 60,
    marginRight: 110,
    marginBottom: 50,
    x: {
      label: "JI target (cents)",
      grid: true,
    },
    y: {
      label: "Signed deviation (cents from JI)",
      grid: true,
      tickFormat: (v) => (v > 0 ? `+${v}` : String(v)),
    },
    color: {
      legend: true,
      domain: edos.map((N) => `${N}-EDO`),
    },
    marks: [
      Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
      Plot.dot(data, {
        x: "jiCents",
        y: "error",
        fill: "edo",
        stroke: "edo",
        r: 5,
        title: (d) =>
          `${d.edo} ${d.jiLabel}: ${d.error >= 0 ? "+" : ""}${d.error.toFixed(2)}¢`,
      }),
    ],
  });
})();
```

Then, in the markdown body, insert a new subsection ABOVE the existing `## The deviation table` section (which starts at line 173 with the heading and at line 175 with the `display(deviationTable)` cell). The new subsection sits between `## The construction` (ends at line 149) and `## The four canonical EDOs` (at line 151) is NOT the right place — the scatter chart belongs adjacent to the table it complements. Insert it immediately ABOVE `## The deviation table`:

Replace the current line `## The deviation table` and the following `display(deviationTable)` cell with this block (preserving the existing `display(deviationTable)` cell unchanged after the new chart):

```markdown
## Visualizing the deviations

The scatter chart below shows the same data as the table: x = JI target in cents,
y = signed cents deviation of each EDO's nearest step, one colored series per
EDO. The dashed zero line is pure JI; points above are sharp, points below are
flat. Reading down a vertical column compares all seven EDOs at one JI target;
reading along a series shows how consistently one EDO tracks JI across the
five anchors.

```ts
display(scatterChart);
```

## The deviation table

```ts
display(deviationTable);
```
```

(Exact mechanic: insert the new `## Visualizing the deviations` heading, intro paragraph, and `display(scatterChart)` cell on the line BEFORE the existing `## The deviation table` heading. Do not touch the existing `## The deviation table` heading or its `display(deviationTable)` cell — leave them byte-equivalent.)

(4) **Rename the "## The four canonical EDOs" heading and add three new bullets.** At line 151, change:

```
## The four canonical EDOs
```

to:

```
## The seven canonical EDOs
```

Then, in the bullet list immediately following, insert three new bullets — one each for 22-EDO, 41-EDO, 72-EDO — placed in sorted order among the existing four (between 19-EDO and 31-EDO for 22-EDO; between 31-EDO and 53-EDO for 41-EDO; after 53-EDO for 72-EDO). Bullets:

```
- **22-EDO** is the sharp-fifth 7-limit specialist. Its step size of
  ${tex`\approx 54.55\text{¢}`} produces a 5th of ${tex`\approx 709.09\text{¢}`} —
  ${tex`\approx +7.14\text{¢}`} sharp of pure, the largest deviation of any of
  these seven on the ${tex`3/2`} column. The trade is a usable 7-limit:
  ${tex`7/4`} lands within ${tex`\approx 13\text{¢}`}, and the system supports
  the "superpyth" temperament family used in some 20th-century microtonal
  composition. Pick 22-EDO when you want 7-limit harmony in a smaller closed
  system than 31 and are willing to accept conspicuously sharp 5ths.
- **41-EDO** is the strong 5- and 7-limit performer. Its 5th is within
  ${tex`\approx 0.48\text{¢}`} of pure — second only to 53-EDO among these
  seven — and ${tex`7/4`} lands within ${tex`\approx 3\text{¢}`}. The direct
  nearest-step ${tex`5/4`} sits ${tex`\approx 5.8\text{¢}`} flat (the
  schismatic-temperament mapping via a chain of 5ths brings it much closer,
  but that is beyond this page's straight-quantization framing). 41-EDO is the
  microtonal choice when you want excellent 3-limit AND 7-limit at a step size
  about half of 22-EDO's.
- **72-EDO** is the modern microtonal reference and an exact superset of 12-EDO
  (${tex`72 = 6 \times 12`}, so every 12-EDO pitch is a 72-EDO step). With a
  ${tex`\approx 16.67\text{¢}`} step it lands within
  ${tex`\approx 3\text{¢}`} of every JI anchor on this page. The compromise is
  size: 72 pitches per octave is at the edge of what is practical to notate or
  perform on a fixed-pitch instrument, which is why 72-EDO is more often used
  as a *theoretical* common ground (intersection of 12-, 24-, 36-, and many
  microtonal mappings) than as a target keyboard layout.
```

(5) **Append a `## Further reading` section as the LAST section of the file.** The file currently ends at line 236 with the meantone paragraph in the "## See also" section. After that line, add one blank line, then:

```
## Further reading

- [EDO on the Xenharmonic Wiki](https://en.xen.wiki/w/EDO) — community-curated
  reference for equal divisions of the octave, with the full mapping space from
  trivial small EDOs to extreme high-resolution divisions.
- Per-EDO pages: [12edo](https://en.xen.wiki/w/12edo) ·
  [19edo](https://en.xen.wiki/w/19edo) ·
  [22edo](https://en.xen.wiki/w/22edo) ·
  [31edo](https://en.xen.wiki/w/31edo) ·
  [41edo](https://en.xen.wiki/w/41edo) ·
  [53edo](https://en.xen.wiki/w/53edo) ·
  [72edo](https://en.xen.wiki/w/72edo).
```

**Discipline:**
- Do NOT alter the existing JI anchor definitions (lines 25–36), the `approxMatrix` builder (lines 49–59), the `deviationTable` builder (lines 68–103), the play-button cell (lines 106–133), or the prose in "## What the table says", "## Audition", "## Why this matters", "## See also" — all byte-equivalent to pre-edit.
- The `## The four canonical EDOs` → `## The seven canonical EDOs` rename is the ONLY non-additive edit.
- Cents values in the scatter chart come from `jiIntervals[i].iv.cents` (`Interval.cents`, BigInt-Fraction → number projection at the data-row boundary) and `approxMatrix` (already computed). No new kernel paths.
  </action>
  <verify>
    <automated>
npm run lint:types 2>&1 | tail -20 && \
grep -q 'import \* as Plot from "npm:@observablehq/plot"' src/pages/edo-approximation.md && \
grep -q 'const edos = \[12, 19, 22, 31, 41, 53, 72\]' src/pages/edo-approximation.md && \
grep -q 'const scatterChart = (() => {' src/pages/edo-approximation.md && \
grep -q 'approxMatrix.flatMap' src/pages/edo-approximation.md && \
grep -q 'Plot.dot(data' src/pages/edo-approximation.md && \
grep -q 'x: "jiCents"' src/pages/edo-approximation.md && \
grep -q 'y: "error"' src/pages/edo-approximation.md && \
grep -q '## Visualizing the deviations' src/pages/edo-approximation.md && \
grep -q 'display(scatterChart)' src/pages/edo-approximation.md && \
grep -q '## The seven canonical EDOs' src/pages/edo-approximation.md && \
! grep -q '## The four canonical EDOs' src/pages/edo-approximation.md && \
grep -q '\*\*22-EDO\*\*' src/pages/edo-approximation.md && \
grep -q '\*\*41-EDO\*\*' src/pages/edo-approximation.md && \
grep -q '\*\*72-EDO\*\*' src/pages/edo-approximation.md && \
grep -q '## Further reading' src/pages/edo-approximation.md && \
grep -q 'en.xen.wiki/w/EDO' src/pages/edo-approximation.md && \
grep -q 'en.xen.wiki/w/22edo' src/pages/edo-approximation.md && \
grep -q 'en.xen.wiki/w/41edo' src/pages/edo-approximation.md && \
grep -q 'en.xen.wiki/w/72edo' src/pages/edo-approximation.md && \
grep -q 'const step = Math.round(ideal / stepCents)' src/pages/edo-approximation.md && \
grep -q 'const actual = step \* stepCents' src/pages/edo-approximation.md && \
grep -q 'display(deviationTable)' src/pages/edo-approximation.md && \
echo "OK: imports, edos array, scatter chart, seven-canonical-EDOs heading + 3 new bullets, Further reading, deviation table preserved, nearest-step math byte-equivalent"
    </automated>
  </verify>
  <done>
- `npm run lint:types` exits 0.
- Plot import appended to the imports cell.
- `edos` array is `[12, 19, 22, 31, 41, 53, 72]`.
- Scatter chart cell exists and is rendered via `display(scatterChart)` ABOVE the existing `display(deviationTable)` under a new `## Visualizing the deviations` subsection.
- The `## The four canonical EDOs` heading has been renamed `## The seven canonical EDOs`; three new bullets (22-EDO, 41-EDO, 72-EDO) inserted in sorted order.
- `## Further reading` section is the last section and contains the en.xen.wiki/w/EDO link plus per-EDO links for all seven EDOs.
- All other prose, the JI anchors, `approxMatrix`, `deviationTable`, the play-button cell, and the rest of the page are byte-equivalent to the pre-edit file.
  </done>
</task>

</tasks>

<success_criteria>
- File `src/pages/edo-approximation.md` modified additively (one heading rename + four insertions). No other file in the repo is touched.
- `npm run lint:types` exits 0; all grep gates in the task `<verify>` block pass.
- Scatter chart renders 7×5 = 35 points (one per (EDO, JI target)), colored by EDO, with shared x = JI cents axis and y = signed cents error axis. Y=0 reference line visible.
- Deviation table now renders 7 rows (12, 19, 22, 31, 41, 53, 72) — same nearest-step math.
- "The seven canonical EDOs" section reads coherently: four existing bullets unchanged, three new bullets inserted in sorted order.
- Further reading section links to the xen wiki EDO page plus per-EDO pages for all seven EDOs.
</success_criteria>
