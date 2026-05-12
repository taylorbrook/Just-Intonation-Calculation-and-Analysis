---
phase: 260512-kzw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/prime-limits.md
autonomous: true
requirements:
  - QUICK-PRIME-LIMIT-EXPLORER-01
must_haves:
  truths:
    - "A new `## Limit explorer` H2 section appears on the prime-limits page BEFORE the existing `## 3-limit (Pythagorean)` H2."
    - "Inside `## Limit explorer`, a slider (`view(Inputs.range([0, 4], { step: 1, value: 1, label: \"Prime limit\" }))`) drives the view; a small reactive caption below the slider surfaces which prime is currently selected (e.g. `Prime limit: 7`)."
    - "Below the slider, a reactive table shows the intervals that newly enter at the selected prime — columns: Ratio (ratioPill), Monzo (Unicode `[ … ⟩` bra-ket with tabular-nums), Cents (one decimal with `¢`), Play (▶ button via playInterval). Moving the slider re-renders the table reactively without a page reload."
    - "The hardcoded interval set is exactly as specified: 3-limit→[9/8, 27/16]; 5-limit→[5/4, 6/5, 5/3]; 7-limit→[7/4, 7/6, 7/5]; 11-limit→[11/8, 11/9, 11/6]; 13-limit→[13/8, 13/12, 13/10]. (Note: 9/8 already appears in the existing prose; it's still listed here as the canonical newly-entering 3-limit example — that's intentional.)"
    - "Below the table, a `Plot.plot` strip chart along a 0..1200¢ x-axis shows each prime's basic identity (p / 2^floor(log₂ p)) as a single dot with a text label above it; dashed `Plot.ruleX` marks at every 100¢ visualize the 12-TET grid."
    - "A new `## Further reading` H2 is appended at the very bottom of the page (after `## See also`) with two bulleted links: en.xen.wiki/w/Prime_limit and the archive.org copy of Partch's *Genesis of a Music*."
    - "Pitfall #1 honored throughout: every Interval is constructed once from a ratio string (e.g. `new Interval(\"9/8\")`); `.cents` and `.monzo` are read only at the display step. No `new Interval(<centsNumber>)` anywhere."
    - "T-02-22 / T-02-23 XSS discipline: every dynamic cell builds DOM via `document.createElement` + `textContent`; no `innerHTML` for dynamic values."
  artifacts:
    - path: "src/pages/prime-limits.md"
      provides: "New '## Limit explorer' section (slider + reactive table + Plot strip chart) BEFORE '## 3-limit (Pythagorean)'; new '## Further reading' section appended after '## See also'."
      contains: "## Limit explorer"
  key_links:
    - from: "Inputs.range slider cell"
      to: "limit-explorer table cell"
      via: "Observable reactive scalar `limitIdx` from `view(Inputs.range(...))` indexed into `limitSet`"
      pattern: "Inputs.range\\(\\[0, 4\\]"
    - from: "limit-explorer table cell"
      to: "Interval (BigInt-Fraction kernel)"
      via: "`iv.fraction.toFraction()` for ratio, `iv.monzo` for bra-ket, `iv.cents` for cents column (display-only projection — Pitfall #1)"
      pattern: "new Interval\\("
    - from: "primeIdentities chart cell"
      to: "Interval bindings for 3/2, 5/4, 7/4, 11/8, 13/8"
      via: "data rows pre-built once; `iv.cents` read at data-row construction (display boundary)"
      pattern: "Plot.ruleX\\(\\[100"
---

<objective>
Add two new interactive elements to `src/pages/prime-limits.md` plus a Further reading section:

1. A `## Limit explorer` section, inserted **above the four existing limit sections** (i.e. immediately before `## 3-limit (Pythagorean)`), containing:
   - A range slider (`view(Inputs.range([0, 4], { step: 1, value: 1, label: "Prime limit" }))`) wired to a 5-position prime lookup (3 → 5 → 7 → 11 → 13).
   - A small reactive caption "Prime limit: N" below the slider so the actual prime number is always visible.
   - A reactive table of intervals newly entering at that limit, with columns: Ratio (ratioPill), Monzo (Unicode bra-ket), Cents (1 d.p. + `¢`), Play (▶ button).
   - A single `Plot.plot` strip chart below the table showing each prime's basic identity `p / 2^floor(log₂ p)` along a 0..1200¢ x-axis, with dashed 12-TET grid rules at every 100¢. Makes it visually obvious that 11 (~551¢) and 13 (~841¢) fall between 12-TET pitches while 3, 5, 7 are close to them.

2. A `## Further reading` H2 appended at the bottom of the page (after `## See also`) with two bulleted links.

Purpose: Surface the page's "every step up the prime ladder opens a new family of intervals" idea as a directly tactile sweep before the reader walks the four prose sections, and visualize where each prime's basic identity sits relative to 12-TET.

Output: One edited markdown page. No new TS modules, no new CSS files. Reuses the existing `Interval`, `synth`, `ratioPill`, `playInterval` imports already at the top of the page.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@src/pages/prime-limits.md
@src/pages/edo-approximation.md
@src/pages/monzos.md
@src/lib/interval.ts
@src/components/play-interval.ts
@src/components/ratio-pill.ts

<interfaces>
<!-- Key facts the executor needs without re-reading the whole codebase. -->

From `src/pages/prime-limits.md` top (already on the page — REUSE, do not re-declare):

```ts
import { Interval } from "../lib/interval.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";

const synth = createSynth();
invalidation.then(() => synth.dispose());
```

The page does NOT currently import Plot. Plot is added to the SAME top import cell (do NOT create a second import block).

From `src/lib/interval.ts`:

```ts
export class Interval {
  constructor(input: FractionInput);            // string is accepted ("9/8")
  readonly fraction: Fraction;                  // BigInt-backed
  get monzo(): number[];                        // lazy, exact
  get cents(): number;                          // display-only projection (Pitfall #1)
  toString(): string;                           // returns "9/8"
}
```

From `src/components/play-interval.ts`:

```ts
export function playInterval(
  interval: Interval,
  synth: SynthHandle,
  opts?: { baseHz?: number; duration?: number; label?: boolean },
): HTMLButtonElement;
// Without `label: true`, the button text is just "▶".
```

From `src/components/ratio-pill.ts`:

```ts
export function ratioPill(
  interval: Interval,
  opts?: { showCents?: boolean },
): HTMLSpanElement;
// In a table column we want JUST the ratio — pass { showCents: false } so cents
// don't double up with the Cents column.
```

Proven slider + reactive DOM-table pattern (from quick-260512-ksu / edo-approximation.md):

```ts
const liveN = view(
  Inputs.range([5, 72], { step: 1, value: 31, label: "EDO size N" }),
);
```

```ts
const myTable = (() => {
  const N = liveN;            // reactive scalar — cell re-runs on slider change
  const table = document.createElement("table");
  // …createElement + textContent for every cell…
  return table;
})();
display(myTable);
```

Monzo bra-ket Unicode display pattern (from monzo-builder.ts / monzos.md):

```ts
const code = document.createElement("code");
code.style.fontVariantNumeric = "tabular-nums";
code.textContent = `[ ${monzo.map((x) => String(x)).join("  ")} ⟩`;
// Whitespace-separated, opening "[" closing "⟩" (U+27E9). NOT KaTeX.
```

Plot strip-chart pattern (single-row dot+text on a cents axis):

```ts
const data = [
  { prime: 3,  ratio: "3/2",  cents: new Interval("3/2").cents,  label: "3 (3/2)"  },
  { prime: 5,  ratio: "5/4",  cents: new Interval("5/4").cents,  label: "5 (5/4)"  },
  { prime: 7,  ratio: "7/4",  cents: new Interval("7/4").cents,  label: "7 (7/4)"  },
  { prime: 11, ratio: "11/8", cents: new Interval("11/8").cents, label: "11 (11/8)" },
  { prime: 13, ratio: "13/8", cents: new Interval("13/8").cents, label: "13 (13/8)" },
];
const chart = Plot.plot({
  width: 720,
  height: 120,
  marginTop: 28,
  marginBottom: 36,
  marginLeft: 24,
  marginRight: 24,
  x: { label: "Cents from 1/1", domain: [0, 1200], grid: false },
  y: { axis: null, domain: [-1, 1] },
  marks: [
    Plot.ruleX(
      [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
      { stroke: "#aaa", strokeDasharray: "2,3" },
    ),
    Plot.ruleX([0, 1200], { stroke: "#888" }),
    Plot.dot(data, { x: "cents", y: 0, fill: "#4269d0", r: 6, stroke: "white" }),
    Plot.text(data, {
      x: "cents",
      y: 0,
      text: "label",
      dy: -14,
      textAnchor: "middle",
      fontSize: 12,
      fill: "currentColor",
    }),
  ],
});
display(chart);
```
</interfaces>

<insertion_map>
After the edit, the page sections must appear in this exact order, top-to-bottom:

1. `# Prime-limits` (title + lede paragraph) — UNCHANGED
2. Existing import cell — MODIFIED (one line added: `import * as Plot from "npm:@observablehq/plot";`)
3. Existing synth cell — UNCHANGED
4. Existing example-Interval-bindings cell — UNCHANGED
5. Existing prose paragraphs (`The **prime-limit** of a JI ratio…` through `…with a play button at every rung.`) — UNCHANGED
6. **`## Limit explorer` (NEW)** — slider + caption + reactive table + Plot strip chart
7. `## 3-limit (Pythagorean)` — UNCHANGED
8. `## 5-limit` — UNCHANGED
9. `## 7-limit` — UNCHANGED
10. `## 11-limit` — UNCHANGED
11. `## Limits in the kernel` — UNCHANGED
12. `## See also` — UNCHANGED
13. **`## Further reading` (NEW)** — two bulleted links
</insertion_map>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Plot import + `## Limit explorer` slider + reactive table (insert BEFORE `## 3-limit (Pythagorean)`)</name>
  <files>src/pages/prime-limits.md</files>
  <action>
Edit `src/pages/prime-limits.md` in two precise places.

**Edit A — extend the existing top import cell** (around lines 5–10). Add exactly one line so the cell reads:

```ts
import { Interval } from "../lib/interval.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import * as Plot from "npm:@observablehq/plot";
```

Do NOT create a second import cell. Do NOT touch the synth cell, the example-Interval-bindings cell, or any prose paragraph.

**Edit B — insert the new `## Limit explorer` section BEFORE the existing `## 3-limit (Pythagorean)` H2.** The new section sits between the existing intro paragraph that ends with "…with a play button at every rung." and the existing `## 3-limit (Pythagorean)` heading. Insert this exact content:

````md
## Limit explorer

Sweep the slider through the primes 3 → 5 → 7 → 11 → 13. At each step the table
shows the intervals that newly enter the JI system at that prime — i.e. the rungs
of the prime-limit ladder. Below the table, the strip chart shows where each
prime's basic identity ${tex`p / 2^{\lfloor \log_2 p \rfloor}`} lands on a
0–1200¢ axis against the 12-TET grid: 3, 5, 7 sit close to 12-TET pitches; 11
and 13 fall between them.

```ts
const limitIdx = view(
  Inputs.range([0, 4], { step: 1, value: 1, label: "Prime limit" }),
);
```

```ts
// 5-position lookup. Indices 0..4 map to primes 3,5,7,11,13. The intervals at
// each step are the canonical "newly-entering" ratios for that prime — built
// from strings so the BigInt-Fraction path is exercised end-to-end (R-01).
const limitSet = [
  { prime: 3,  intervals: [new Interval("9/8"),  new Interval("27/16")] },
  { prime: 5,  intervals: [new Interval("5/4"),  new Interval("6/5"),   new Interval("5/3")] },
  { prime: 7,  intervals: [new Interval("7/4"),  new Interval("7/6"),   new Interval("7/5")] },
  { prime: 11, intervals: [new Interval("11/8"), new Interval("11/9"),  new Interval("11/6")] },
  { prime: 13, intervals: [new Interval("13/8"), new Interval("13/12"), new Interval("13/10")] },
];
```

```ts
// Reactive caption — surfaces the actual prime under the slider thumb.
const limitCaption = (() => {
  const span = document.createElement("p");
  span.style.margin = "0.25rem 0 0.75rem 0";
  span.textContent = `Prime limit: ${limitSet[limitIdx].prime}`;
  return span;
})();
display(limitCaption);
```

```ts
// Reactive table: intervals newly entering at the selected prime.
// Pitfall #1: each Interval is constructed once (in limitSet) from a ratio
// string. We read .fraction, .monzo, and .cents ONLY at the display step here.
// XSS discipline (T-02-22/T-02-23): every dynamic cell uses createElement +
// textContent; no innerHTML for dynamic values.
const limitTable = (() => {
  const { prime, intervals } = limitSet[limitIdx];

  const table = document.createElement("table");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const label of ["Ratio", "Monzo", "Cents", "Play"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const iv of intervals) {
    const tr = document.createElement("tr");

    // Ratio — reuse ratioPill, but suppress its cents (cents have their own column).
    const ratioCell = document.createElement("td");
    ratioCell.appendChild(ratioPill(iv, { showCents: false }));
    tr.appendChild(ratioCell);

    // Monzo — Unicode bra-ket `[ a  b  c … ⟩` on a <code> with tabular-nums.
    // NOT KaTeX (would re-typeset on every slider tick and flicker).
    const monzoCell = document.createElement("td");
    const monzoCode = document.createElement("code");
    monzoCode.style.fontVariantNumeric = "tabular-nums";
    monzoCode.textContent = `[ ${iv.monzo.map((x) => String(x)).join("  ")} ⟩`;
    monzoCell.appendChild(monzoCode);
    tr.appendChild(monzoCell);

    // Cents — 1 d.p., trailing `¢`.
    const centsCell = document.createElement("td");
    centsCell.textContent = `${iv.cents.toFixed(1)}¢`;
    tr.appendChild(centsCell);

    // Play — bare ▶ button via playInterval (no label, since the Ratio column
    // already shows the ratio).
    const playCell = document.createElement("td");
    playCell.appendChild(playInterval(iv, synth));
    tr.appendChild(playCell);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  // Suppress unused-variable warnings — `prime` is read above implicitly when
  // we build the row labels; keep the destructure shape for clarity.
  void prime;

  return table;
})();
display(limitTable);
```
````

Hard rules (DO follow, do NOT deviate):

1. The new H2 MUST be inserted BEFORE `## 3-limit (Pythagorean)`. Verify by reading the resulting file and confirming the section order matches the `<insertion_map>` above.
2. The slider MUST use `view(Inputs.range([0, 4], { step: 1, value: 1, label: "Prime limit" }))`. The `view(...)` wrapper exposes `limitIdx` as a reactive scalar (Observable Framework idiom — without it the cell value is the Element, not the number).
3. The default `value: 1` selects 5-limit (index 1 → prime 5), so the table opens with the 5-limit batch [5/4, 6/5, 5/3]. This matches the page's pedagogical center of gravity (5-limit is where most readers' intuition lives).
4. The reactive caption MUST be `Prime limit: ${limitSet[limitIdx].prime}` — exact text, including the colon and single space. This is the surface that tells the reader which prime is selected.
5. The interval set MUST match exactly:
   - index 0 (prime 3): `9/8, 27/16`
   - index 1 (prime 5): `5/4, 6/5, 5/3`
   - index 2 (prime 7): `7/4, 7/6, 7/5`
   - index 3 (prime 11): `11/8, 11/9, 11/6`
   - index 4 (prime 13): `13/8, 13/12, 13/10`
6. Every `Interval` MUST be constructed from a ratio string (e.g. `new Interval("9/8")`). NO `new Interval(<centsNumber>)` anywhere. Grep gate: `! grep -n 'new Interval([0-9.]\+)' src/pages/prime-limits.md`.
7. The table cell building MUST use `document.createElement` + `textContent`. No `innerHTML` for dynamic values. The only place that writes a non-text DOM into a cell is `appendChild(ratioPill(...))` and `appendChild(playInterval(...))`, which are existing component factories.
8. `ratioPill(iv, { showCents: false })` MUST pass `showCents: false` so the Cents column isn't duplicated inside the Ratio pill.
9. `playInterval(iv, synth)` MUST be called WITHOUT `{ label: true }` so the cell shows just `▶`.
10. Do NOT modify the existing four `## N-limit` sections, the existing example Interval bindings, the existing prose, the `## Limits in the kernel` section, or `## See also`.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" &amp;&amp; grep -c '^## Limit explorer$' src/pages/prime-limits.md | grep -q '^1$' &amp;&amp; grep -c '^## 3-limit (Pythagorean)$' src/pages/prime-limits.md | grep -q '^1$' &amp;&amp; awk '/^## Limit explorer$/{a=NR} /^## 3-limit \(Pythagorean\)$/{b=NR} END{exit !(a&amp;&amp;b&amp;&amp;a&lt;b)}' src/pages/prime-limits.md &amp;&amp; grep -q 'Inputs.range(\[0, 4\]' src/pages/prime-limits.md &amp;&amp; grep -q 'limitSet\[limitIdx\]' src/pages/prime-limits.md &amp;&amp; grep -q 'new Interval("9/8")' src/pages/prime-limits.md &amp;&amp; grep -q 'new Interval("27/16")' src/pages/prime-limits.md &amp;&amp; grep -q 'new Interval("13/10")' src/pages/prime-limits.md &amp;&amp; grep -q 'showCents: false' src/pages/prime-limits.md &amp;&amp; grep -q 'import \* as Plot from "npm:@observablehq/plot"' src/pages/prime-limits.md &amp;&amp; ! grep -nE 'new Interval\([0-9]+(\.[0-9]+)?\)' src/pages/prime-limits.md &amp;&amp; ! grep -n 'innerHTML' src/pages/prime-limits.md &amp;&amp; npx tsc --noEmit</automated>
  </verify>
  <done>
- New `## Limit explorer` H2 exists exactly once and is positioned BEFORE `## 3-limit (Pythagorean)` (line-number order verified by the awk gate).
- The section contains: prose intro, `view(Inputs.range([0, 4], { step: 1, value: 1, label: "Prime limit" }))` slider cell, `limitSet` lookup cell, reactive `limitCaption` cell, reactive `limitTable` cell, and `display(limitTable)`.
- Plot import added to the existing top import cell exactly once.
- 13 new `new Interval("…")` constructions present (2 + 3 + 3 + 3 + 3 = 14 — but the existing top cell already has 5; net new is 14, plus the existing 5 still in place; either way every Interval is built from a ratio string).
- No `new Interval(<number>)` patterns anywhere; no `innerHTML` anywhere.
- `npx tsc --noEmit` passes.
- Existing four `## N-limit` sections, `## Limits in the kernel`, and `## See also` are byte-identical to before.
  </done>
</task>

<task type="auto">
  <name>Task 2: Append the prime-identity Plot strip chart inside `## Limit explorer`</name>
  <files>src/pages/prime-limits.md</files>
  <action>
Append a Plot strip chart cell at the end of the `## Limit explorer` section (i.e. immediately AFTER the `display(limitTable);` cell from Task 1, and BEFORE the `## 3-limit (Pythagorean)` H2). Insert this exact content:

````md
Each prime's **basic identity** is the ratio ${tex`p / 2^{\lfloor \log_2 p \rfloor}`} —
the prime itself, octave-reduced into 1..2. Plotted on the cents axis with
the 12-TET grid (dashed gray rules at every 100¢), it becomes obvious that
3 (~702¢), 5 (~386¢), 7 (~969¢) all sit close to a 12-TET pitch, while
11 (~551¢) and 13 (~841¢) fall squarely between 12-TET grid lines — which
is why music using those primes can sound foreign to a 12-TET ear.

```ts
// Each prime's basic identity, computed in the kernel (BigInt-Fraction).
// The Interval is built from a string ratio ONCE; .cents is read at the
// data-row construction boundary (display-layer projection, Pitfall #1).
const primeIdentities = [
  { prime: 3,  iv: new Interval("3/2")  },
  { prime: 5,  iv: new Interval("5/4")  },
  { prime: 7,  iv: new Interval("7/4")  },
  { prime: 11, iv: new Interval("11/8") },
  { prime: 13, iv: new Interval("13/8") },
].map(({ prime, iv }) => ({
  prime,
  ratio: iv.toString(),
  cents: iv.cents,
  label: `${prime} (${iv.toString()})`,
}));

const primeIdentityChart = Plot.plot({
  width: 720,
  height: 120,
  marginTop: 28,
  marginBottom: 36,
  marginLeft: 24,
  marginRight: 24,
  x: { label: "Cents from 1/1", domain: [0, 1200], grid: false },
  y: { axis: null, domain: [-1, 1] },
  marks: [
    // 12-TET grid: dashed rules at every 100¢ from 100 to 1100.
    Plot.ruleX(
      [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
      { stroke: "#aaa", strokeDasharray: "2,3" },
    ),
    // Axis endpoints.
    Plot.ruleX([0, 1200], { stroke: "#888" }),
    // Each prime identity as a single dot on the strip.
    Plot.dot(primeIdentities, {
      x: "cents",
      y: 0,
      fill: "#4269d0",
      r: 6,
      stroke: "white",
    }),
    // Label above each dot.
    Plot.text(primeIdentities, {
      x: "cents",
      y: 0,
      text: "label",
      dy: -14,
      textAnchor: "middle",
      fontSize: 12,
      fill: "currentColor",
    }),
  ],
});
display(primeIdentityChart);
```
````

Hard rules:

1. The new cells MUST sit at the bottom of `## Limit explorer` and BEFORE `## 3-limit (Pythagorean)`. The chart is part of the explorer section, not a sibling H2.
2. The data MUST be precomputed once via `.map(...)` reading `iv.cents` at the data-row construction boundary. Do NOT pass an `Interval` into Plot — Plot needs numeric `cents` (Pitfall #1: cents is a display projection).
3. Dashed gray rules MUST appear at every 100¢ from 100 to 1100 (eleven total), plus two solid `#888` rules at the 0 and 1200 endpoints. This is the 12-TET reference grid.
4. The chart MUST be a single strip (~120px tall, no y-axis ticks). `y: { axis: null, domain: [-1, 1] }` and `Plot.dot(..., { y: 0, ... })` keep everything on a single line.
5. Labels MUST be `${prime} (${ratio})` — e.g. `5 (5/4)`, `11 (11/8)`. Use `Plot.text(..., { dy: -14, textAnchor: "middle" })` so the label sits above the dot.
6. The chart MUST NOT use any kernel function on `cents`. Every Interval is built ONCE from a string ratio.
7. Do not collapse this task into Task 1's commit — keep it an atomic commit so the diff cleanly separates "section + table" from "strip chart".
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" &amp;&amp; grep -q 'primeIdentityChart' src/pages/prime-limits.md &amp;&amp; grep -q 'Plot.ruleX(' src/pages/prime-limits.md &amp;&amp; grep -q 'strokeDasharray: "2,3"' src/pages/prime-limits.md &amp;&amp; grep -q 'Plot.dot(primeIdentities' src/pages/prime-limits.md &amp;&amp; grep -q 'Plot.text(primeIdentities' src/pages/prime-limits.md &amp;&amp; grep -q 'display(primeIdentityChart)' src/pages/prime-limits.md &amp;&amp; awk '/^## Limit explorer$/{a=NR} /primeIdentityChart/{b=NR} /^## 3-limit \(Pythagorean\)$/{c=NR} END{exit !(a&amp;&amp;b&amp;&amp;c&amp;&amp;a&lt;b&amp;&amp;b&lt;c)}' src/pages/prime-limits.md &amp;&amp; ! grep -nE 'new Interval\([0-9]+(\.[0-9]+)?\)' src/pages/prime-limits.md &amp;&amp; npx tsc --noEmit</automated>
  </verify>
  <done>
- `primeIdentityChart` cell exists and is between `## Limit explorer` and `## 3-limit (Pythagorean)`.
- Plot chart renders 5 dots labeled `3 (3/2)`, `5 (5/4)`, `7 (7/4)`, `11 (11/8)`, `13 (13/8)` along a 0..1200¢ x-axis with dashed gray rules at every 100¢ and solid rules at the endpoints.
- No kernel call accepts cents as input; every Interval is built from a string ratio.
- `npx tsc --noEmit` passes.
  </done>
</task>

<task type="auto">
  <name>Task 3: Append `## Further reading` section at the bottom of the page</name>
  <files>src/pages/prime-limits.md</files>
  <action>
Append a new `## Further reading` H2 at the **very bottom** of `src/pages/prime-limits.md`, immediately after the existing `## See also` section. Insert this exact content:

```md
## Further reading

- [Xenharmonic wiki — Prime limit](https://en.xen.wiki/w/Prime_limit) —
  community-curated reference for prime-limit classification, covering the
  monzo-axis interpretation, the relationship to odd-limit, and the chain of
  named commas that each prime introduces as its smallest closure gap.
- Harry Partch, *[Genesis of a Music](https://archive.org/details/genesisofmusicac0000part)*
  (2nd ed., Da Capo Press, 1974) — the canonical English-language treatise on
  just intonation. Partch's 43-tone scale walks the prime-limit ladder all the
  way to 11-limit, and the book lays out the philosophical and acoustic
  reasoning for stopping there. The Internet Archive copy is the 1974 second
  edition (xxv + 517 pp.).
```

Hard rules:

1. The new H2 MUST appear as the LAST section on the page — after `## See also`.
2. Use the EXACT archive.org URL `https://archive.org/details/genesisofmusicac0000part` (confirmed during planning as the 1974 second edition, xxv + 517 pp.). Do NOT use a search-results URL.
3. Anchor text MUST be:
   - `Xenharmonic wiki — Prime limit` for the wiki link (em dash, not hyphen).
   - `Genesis of a Music` (italicized in markdown) for the archive.org link.
4. Match the placement and prose-with-context style of existing `## Further reading` sections on `src/pages/monzos.md`, `src/pages/edo-approximation.md`, `src/pages/schisma.md`, and `src/pages/pythagorean-comma.md` (a one-or-two-sentence gloss after each bullet, not just a bare URL).
5. Do NOT remove or modify `## See also` or any earlier section.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" &amp;&amp; grep -c '^## Further reading$' src/pages/prime-limits.md | grep -q '^1$' &amp;&amp; awk '/^## See also$/{a=NR} /^## Further reading$/{b=NR} END{exit !(a&amp;&amp;b&amp;&amp;a&lt;b)}' src/pages/prime-limits.md &amp;&amp; grep -q 'https://en.xen.wiki/w/Prime_limit' src/pages/prime-limits.md &amp;&amp; grep -q 'https://archive.org/details/genesisofmusicac0000part' src/pages/prime-limits.md &amp;&amp; grep -q '\*Genesis of a Music\*' src/pages/prime-limits.md &amp;&amp; tail -1 src/pages/prime-limits.md | grep -qE '.+'</automated>
  </verify>
  <done>
- `## Further reading` exists exactly once and is the final H2 on the page (line-number order verified by the awk gate).
- Both URLs present: en.xen.wiki/w/Prime_limit and archive.org/details/genesisofmusicac0000part.
- *Genesis of a Music* rendered with markdown italic asterisks.
- Each bullet has a contextual gloss matching the style of `monzos.md`/`schisma.md`/`pythagorean-comma.md`.
  </done>
</task>

</tasks>

<verification>
- The page contains exactly one new H2 above the four limit sections (`## Limit explorer`) and exactly one new H2 at the end (`## Further reading`).
- Section order (top to bottom): title + lede → import cell → synth cell → example-Interval-bindings cell → intro prose → **## Limit explorer** → ## 3-limit (Pythagorean) → ## 5-limit → ## 7-limit → ## 11-limit → ## Limits in the kernel → ## See also → **## Further reading**.
- Slider drives a reactive table and the table re-renders without page reload as the slider moves through the five prime-limit positions.
- Plot strip chart renders 5 prime-identity dots on a 0..1200¢ axis with dashed 12-TET grid rules; the visual point ("11 and 13 fall between 12-TET pitches") is obvious at a glance.
- Pitfall #1 honored everywhere: every `Interval` built from a string ratio; `.cents` and `.monzo` read only at the display step; no `new Interval(<centsNumber>)` patterns.
- T-02-22 / T-02-23 XSS discipline honored: no `innerHTML` for dynamic values; every dynamic cell built via `createElement` + `textContent`.
- `npx tsc --noEmit` passes.
- The four existing `## N-limit` sections, the example-Interval-bindings cell, the synth cell, and `## Limits in the kernel` are byte-identical to before.
</verification>

<success_criteria>
- `src/pages/prime-limits.md` contains a working `## Limit explorer` section with slider + reactive caption + reactive table + Plot strip chart, inserted BEFORE `## 3-limit (Pythagorean)`.
- `src/pages/prime-limits.md` contains a `## Further reading` section at the bottom with the en.xen.wiki/w/Prime_limit and archive.org/details/genesisofmusicac0000part links.
- Plot was added to the existing top import cell (no duplicate import cells).
- Three atomic commits, one per task.
- `npx tsc --noEmit` passes.
- Page builds clean under `npm run build` (verify locally if available; otherwise the tsc gate is sufficient for the planner's purposes — execute-plan / human-verify will catch any Plot-runtime regressions).
</success_criteria>

<output>
After completion, create `.planning/quick/260512-kzw-prime-limit-explorer-slider-identity-plo/260512-kzw-SUMMARY.md` summarizing the change: file touched, location of new sections, lines added per task, Plot-import detail, and the explicit decisions (default `value: 1` opens at 5-limit, prime caption surface = `Prime limit: N`, 13-limit added as the fifth slider position even though the existing prose stops at 11-limit).
</output>
