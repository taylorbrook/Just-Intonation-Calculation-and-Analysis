---
phase: 260512-ksu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/edo-approximation.md
autonomous: true
requirements:
  - QUICK-EDO-LIVE-01
must_haves:
  truths:
    - "A range input for N (5..72, step 1, default 31) renders on the edo-approximation page."
    - "Below the slider, a table shows one row of cent-deviations against the same 5 JI anchors (3/2, 5/4, 7/4, 9/8, 11/8) used in the static deviation table above."
    - "Moving the slider re-renders the row reactively without a page reload."
    - "Cell format and visual styling match the existing static deviation table EXACTLY (same columns, same header labels, same `${step} @ ${fmtErr(error)}` format, same `¢` glyph, same 2-decimal precision, same `+`/`−`/empty sign rules)."
    - "JI anchors remain `Interval` (BigInt Fraction) values; cents are derived only at the display layer (Pitfall #1 honored)."
  artifacts:
    - path: "src/pages/edo-approximation.md"
      provides: "New '## Live EDO explorer' section with reactive slider + live deviation row"
      contains: "Inputs.range"
  key_links:
    - from: "Inputs.range slider cell"
      to: "live row recompute cell"
      via: "Observable reactive binding (read the slider's value as a top-level reactive name)"
      pattern: "Inputs.range\\(\\[5, 72\\]"
    - from: "live row recompute cell"
      to: "jiIntervals (existing kernel-exact anchors)"
      via: "iv.cents (display projection only — never iv = new Interval(cents))"
      pattern: "jiIntervals"
---

<objective>
Add a "Live EDO explorer" section to `src/pages/edo-approximation.md`. It contributes:

1. An `Inputs.range([5, 72], { step: 1, value: 31, label: "EDO size N" })` slider.
2. A live deviation row table — visually identical to the existing static deviation table (same columns, same header labels, same cell format) — recomputed reactively whenever the slider changes.

Purpose: Let the reader sweep N from 5 to 72 and watch which JI anchors snap into tune and which slip out, instead of being limited to the 7 canonical EDOs in the static table.

Output: One edited markdown page. No new files. No new modules. Reuses the same 5 `jiIntervals` already declared on the page (Pitfall #1: those remain `Interval`-typed; cents are derived only at the display step).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@src/pages/edo-approximation.md
@src/lib/edo.ts

<interfaces>
<!-- Key facts the executor needs without re-reading the whole codebase. -->

From `src/pages/edo-approximation.md` (already on the page — REUSE, do not re-declare):

```ts
// Five kernel-exact JI anchors. Reuse this exact array.
const jiIntervals = [
  { label: "3/2", iv: fifth },       // new Interval("3/2")
  { label: "5/4", iv: majorThird },  // new Interval("5/4")
  { label: "7/4", iv: harm7 },       // new Interval("7/4")
  { label: "9/8", iv: majorWhole },  // new Interval("9/8")
  { label: "11/8", iv: harm11 },     // new Interval("11/8")
];
```

Existing static-table per-cell math (mirror this exactly):

```ts
const stepCents = 1200 / N;
const step      = Math.round(iv.cents / stepCents);
const actual    = step * stepCents;
const error     = actual - iv.cents;     // signed; + = sharp of JI
```

Existing static-table cell format (mirror exactly):

```ts
const fmtErr = (e) => {
  const rounded = Number(e.toFixed(2));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${Math.abs(rounded).toFixed(2)}¢`;
};
// cell textContent: `${step} @ ${fmtErr(error)}`
// row label scope="row", textContent: `${N}-EDO`
// header "EDO" + one <th> per anchor with the anchor label.
```

From `src/lib/edo.ts`:

```ts
// Returns aggregate metrics (max / rms / tenney) per EDO — NOT per-anchor cells.
export function bestEdosForScale(
  scale: Scale,
  range: { min: number; max: number },
  _metric: EdoErrorMetric,
): EdoErrorRow[];
// EdoErrorRow = { edoSteps, maxCentsError, rmsCentsError, tenneyWeightedError }
```

**Reuse decision (already made — do NOT relitigate):** `bestEdosForScale` does not expose per-anchor `{step, error}` cells, so it cannot drive a row whose visual format is `${step} @ ${fmtErr(error)}` per anchor. INLINE the same `round(c/s)` calc the static table already uses, against the existing `jiIntervals` array. This is the explicit fallback path called out in the task brief ("Otherwise inline the same round(c/s) calc").
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Read static table block, then append "## Live EDO explorer" section with reactive slider + live deviation row</name>
  <files>src/pages/edo-approximation.md</files>
  <action>
First, re-read lines 41–105 of `src/pages/edo-approximation.md` to confirm the EXACT structure of `approxMatrix` and `deviationTable` (header row labels, cell `textContent` template, `fmtErr` sign rules, `scope="row"` on the row-label `<th>`). The new live row MUST match all of these exactly.

Insertion location: insert the new section between the existing `## What the table says` section (ends at the bullet beginning "**12-EDO can't do 11.**" — terminating paragraph ends before line ~287) and the existing `## Audition — pure vs 31-EDO vs 12-EDO 7/4` section. Place the new H2 immediately after the last bullet of "## What the table says" and immediately before "## Audition — pure vs 31-EDO vs 12-EDO 7/4".

Add this exact section (use Markdown + Framework reactive cells):

```md
## Live EDO explorer

Sweep N from 5 to 72 to see which JI anchors snap into tune and which slip out.
The row below uses the same five JI anchors and the same `${tex`k = \mathrm{round}(c/s)`}`
nearest-step math as the static table above — only the EDO row changes.

```ts
const liveN = view(
  Inputs.range([5, 72], { step: 1, value: 31, label: "EDO size N" }),
);
```

```ts
// Live deviation row — recomputes reactively when liveN changes.
// Pitfall #1 discipline: the JI anchors stay as Interval (kernel-exact);
// `iv.cents` is the display-layer projection only. No cents value ever
// becomes kernel input.
const liveDeviationTable = (() => {
  const N = liveN;
  const stepCents = 1200 / N;
  const fmtErr = (e) => {
    const rounded = Number(e.toFixed(2));
    const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
    return `${sign}${Math.abs(rounded).toFixed(2)}¢`;
  };
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.textContent = "EDO";
  headerRow.appendChild(corner);
  for (const { label } of jiIntervals) {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  const tr = document.createElement("tr");
  const rowLabel = document.createElement("th");
  rowLabel.scope = "row";
  rowLabel.textContent = `${N}-EDO`;
  tr.appendChild(rowLabel);
  for (const { iv } of jiIntervals) {
    const ideal = iv.cents; // display-layer projection (Pitfall #1)
    const step = Math.round(ideal / stepCents);
    const actual = step * stepCents;
    const error = actual - ideal;
    const td = document.createElement("td");
    td.textContent = `${step} @ ${fmtErr(error)}`;
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
  table.appendChild(tbody);
  return table;
})();
```

```ts
display(liveDeviationTable);
```
```

Hard rules (DO follow, do NOT deviate):

1. The live cell MUST reuse the existing `jiIntervals` array declared near the top of the page (line ~31). Do NOT redeclare the five anchors. Do NOT construct new `Interval(...)` values from cents — anchors stay as `Interval` (Pitfall #1).
2. The cell `textContent` template MUST be exactly `${step} @ ${fmtErr(error)}` — same as the static table.
3. The `fmtErr` helper MUST be inlined inside the `liveDeviationTable` IIFE (do NOT hoist it to a shared scope — keeps blast radius zero; if it's later shared, that is a separate refactor).
4. The header row MUST be `EDO` followed by `3/2`, `5/4`, `7/4`, `9/8`, `11/8` in that order — i.e., iterate over `jiIntervals` exactly as the static table does.
5. The row label MUST use `<th scope="row">` with text `${N}-EDO` — matches the static table accessibility shape.
6. The slider MUST use `view(Inputs.range([5, 72], { step: 1, value: 31, label: "EDO size N" }))`. The `view(...)` wrapper exposes `liveN` as a reactive scalar (Observable Framework idiom — without it the cell value is the Element, not the number).
7. Do NOT import anything new. `Inputs` and `display` are Framework globals; `jiIntervals` is already in scope on the page.
8. Do NOT call `bestEdosForScale` — it returns aggregate metrics, not per-anchor cells. The reuse decision is explicit: inline the same `round(c/s)` math the static table uses.
9. Do NOT modify the existing `jiIntervals`, `approxMatrix`, `deviationTable`, `scatterChart`, audition cells, or any other prose section. Only ADD the new "## Live EDO explorer" section.

Insertion verification: after the edit, the page sections must appear in this order:
`# EDO approximations of JI` → setup cells → `## The construction` → `## The seven canonical EDOs` → `## Visualizing the deviations` → `## The deviation table` → `## What the table says` → **`## Live EDO explorer`** (new) → `## Audition — pure vs 31-EDO vs 12-EDO 7/4` → `## Why this matters` → `## See also` → `## Further reading`.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" &amp;&amp; grep -c "## Live EDO explorer" src/pages/edo-approximation.md | grep -q "^1$" &amp;&amp; grep -q "Inputs.range(\[5, 72\]" src/pages/edo-approximation.md &amp;&amp; grep -q "liveDeviationTable" src/pages/edo-approximation.md &amp;&amp; grep -q "display(liveDeviationTable)" src/pages/edo-approximation.md &amp;&amp; ! grep -q "new Interval(.*cents" src/pages/edo-approximation.md &amp;&amp; npx tsc --noEmit</automated>
  </verify>
  <done>
- New `## Live EDO explorer` section exists exactly once on the page, positioned between `## What the table says` and `## Audition — pure vs 31-EDO vs 12-EDO 7/4`.
- The section contains: prose intro, a `view(Inputs.range([5, 72], { step: 1, value: 31, label: "EDO size N" }))` cell, a `liveDeviationTable` IIFE cell, and a `display(liveDeviationTable)` cell.
- The live table re-renders when the slider moves (Observable reactive cell — verified visually by user during human-verify task below).
- No new `new Interval(cents)` construction; `jiIntervals` is unchanged; the static table block is byte-identical to before.
- `npx tsc --noEmit` passes.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Visual + reactivity check in dev server</name>
  <what-built>
A new "Live EDO explorer" section on the EDO approximations page: a slider for N=5..72 (default 31) and a one-row deviation table for the same 5 JI anchors as the static table above, recomputing live as N changes.
  </what-built>
  <how-to-verify>
1. Run the dev server: `npm run dev` (or `npx observable preview` — match whatever this project uses).
2. Open `/pages/edo-approximation` in the browser.
3. Scroll to the new `## Live EDO explorer` section. Confirm it is positioned AFTER the static deviation table + the "What the table says" bullets and BEFORE the "Audition — pure vs 31-EDO vs 12-EDO 7/4" section.
4. Default state: slider reads `31`. The row label reads `31-EDO`. The five cells must match the `31-EDO` row of the static table above EXACTLY (same step numbers, same signed cents-deviation values, same `+`/`−`/`¢` formatting). Cross-check by eye against the static table.
5. Move the slider. Confirm:
   - The row label updates (`5-EDO`, `12-EDO`, `47-EDO`, `72-EDO`, etc.) as you drag.
   - The five deviation cells recompute live (no page reload).
   - At `N=12`, `N=19`, `N=22`, `N=31`, `N=41`, `N=53`, `N=72` the row must match the corresponding row of the static table cell-for-cell.
6. Visual fidelity: the new table's column widths, header treatment, cell padding, font, and border style must look like the static table above. They should appear to be the same component visually (no theme drift).
7. No console errors (open devtools). No type-script complaints in the dev server output.
  </how-to-verify>
  <resume-signal>Type "approved" if it looks correct and reactive; otherwise describe what's off (which N, which anchor, what visually drifted).</resume-signal>
</task>

</tasks>

<verification>
- One new H2 section added; no other content edited.
- Slider reactivity verified by human.
- At canonical N values (12/19/22/31/41/53/72) the live row matches the static table row-for-row, cell-for-cell.
- No `new Interval(<cents>)` patterns introduced; `iv.cents` only appears at the display layer.
- `npx tsc --noEmit` passes.
</verification>

<success_criteria>
- `src/pages/edo-approximation.md` contains a `## Live EDO explorer` section with a working `Inputs.range([5, 72], { step: 1, value: 31, ... })` slider and a reactive one-row deviation table.
- Visual + behavioral match to the static deviation table confirmed by user.
- Pitfall #1 honored: kernel anchors stay as `Interval`; cents are display-derived only.
</success_criteria>

<output>
After completion, create `.planning/quick/260512-ksu-add-live-edo-explorer-to-src-pages-edo-a/260512-ksu-SUMMARY.md` summarizing the change (file touched, location of new section, lines added, reuse decision recorded).
</output>
