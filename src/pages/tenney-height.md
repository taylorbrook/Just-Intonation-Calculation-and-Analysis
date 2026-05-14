# Tenney height

A scalar measure of harmonic complexity — how "far" a JI ratio sits from the unison on a log lattice, independent of its pitch distance in cents.

```ts
import { Interval } from "../lib/interval.js";
import { tenneyHeight, primeLimitOfMonzo } from "../lib/monzo.js";
import { createSynth } from "../audio/synth.js";
import { furtherReading } from "../components/further-reading.js";
import { playInterval } from "../components/play-interval.js";
import { ratioPill } from "../components/ratio-pill.js";
import * as Plot from "npm:@observablehq/plot";
```

```ts
// Synth cell — owns this page's AudioContext (ARCHITECTURE Pattern 4 / Pitfall #2).
// Must NOT depend on any other cell. The lazy createSynth() does not allocate the
// AudioContext until the first playNote / playNotes call (i.e. the first user click),
// so simply rendering this page does not create an AudioContext.
const synth = createSynth();
invalidation.then(() => synth.dispose());
```

<aside class="prereq">
<strong>Prerequisites:</strong>
<a href="./monzos">Monzos</a>, <a href="./prime-limits">prime-limits</a>
</aside>

## Definition

For a positive rational ${tex`n/d`} in lowest terms (a *reduced* ratio), the
**Tenney height** is (Tenney 1983, §3 and §6; Xen Wiki, "Tenney height"):

```tex
\mathrm{TH}(n/d) \;=\; \log_2(n \cdot d)
```

— a single non-negative number that grows as the prime factorization of the
ratio's numerator and denominator gets larger. Equivalently, given a monzo
${tex`(e_2, e_3, e_5, \ldots)`} of prime exponents,

```tex
\mathrm{TH}(\text{monzo}) \;=\; \sum_i |e_i|\,\log_2(p_i)
```

— the ${tex`L^1`}-norm of the monzo weighted by ${tex`\log_2(p_i)`}. The
absolute values matter: a prime that appears in the *denominator* (negative
exponent) contributes the same magnitude as one in the numerator, because
${tex`\log_2(n \cdot d) = \log_2(n) + \log_2(d)`}.

The logarithm base is a convention. Base 2 (used here, units = octaves) and
natural log (units = nepers) are both standard; the project's kernel function
[`tenneyHeight`](https://github.com/xenharmonic-devs/xen-dev-utils) — re-exported
from `src/lib/monzo.ts` — uses natural log. The two differ only by the constant
factor ${tex`\ln 2 \approx 0.693`}, so any *ranking* of ratios (or of EDOs by
Tenney-weighted error) is identical under either base. The page below converts
the kernel's ln values to log₂ at the display boundary via
${tex`\log_2 x = \ln x / \ln 2`} so the worked numbers match the textbook formula.

## Worked examples

```ts
// Tenney height in log₂ — derived in-cell from the kernel's natural-log
// implementation. NO hardcoded float literals in the data column (Pitfall #1:
// kernel-exact anchors via Interval + tenneyHeight; floats only at display).
const th2 = (iv) => tenneyHeight(iv.monzo) / Math.LN2;

const workedExamples = [
  { ratio: "1/1",           comment: "unison — the lattice origin" },
  { ratio: "2/1",           comment: "octave — small but nonzero" },
  { ratio: "3/2",           comment: "pure fifth — first 3-limit step" },
  { ratio: "5/4",           comment: "pure major third — first 5-limit step" },
  { ratio: "7/4",           comment: "harmonic seventh — first 7-limit step" },
  { ratio: "9/8",           comment: "major whole tone — two 3's stacked" },
  { ratio: "81/80",         comment: "syntonic comma — tiny cents, large height" },
  { ratio: "32805/32768",   comment: "schisma — tinier cents, larger height" },
  { ratio: "531441/524288", comment: "Pythagorean comma — the high anchor" },
].map((row) => {
  const iv = new Interval(row.ratio);
  return {
    ratio: row.ratio,
    cents: iv.cents,
    th: th2(iv),
    comment: row.comment,
  };
});
```

```ts
// Plain-DOM table — createElement + textContent only, no innerHTML for
// derived values (T-02-22 / T-02-23 XSS discipline). Five columns:
// Ratio | n·d | log₂(n·d) | cents | comment. The n·d column is rendered as
// a human-readable string via toLocaleString() so big numbers like
// 1,074,954,240 stay legible.
const workedExamplesTable = (() => {
  const fmtCents = (c) => `${c.toFixed(3)}¢`;
  const fmtTh = (t) => t.toFixed(3);
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const label of ["Ratio", "n·d", "log₂(n·d)", "Cents", "Note"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const row of workedExamples) {
    const tr = document.createElement("tr");
    const [n, d] = row.ratio.split("/").map((s) => BigInt(s));
    const cells = [
      row.ratio,
      (n * d).toLocaleString(),
      fmtTh(row.th),
      fmtCents(row.cents),
      row.comment,
    ];
    for (const text of cells) {
      const td = document.createElement("td");
      td.textContent = String(text);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
})();
display(workedExamplesTable);
```

The three commas at the bottom of the table are the pedagogical hinge: each is
*audibly tiny* — under 25 cents — yet their Tenney heights dwarf those of the
simple consonances at the top. The schisma at 1.954 ¢ is almost imperceptible
in pitch yet sits at ${tex`\log_2(32805 \cdot 32768) \approx 30`}, well above
the pure major third's ~4.3 and even above the Pythagorean comma's cents distance
(23.460 ¢) — *complexity is not pitch distance*.

## Cents vs Tenney height

```ts
// Canonical 7- and 11-limit ratios spanning [0, 1200) cents, plus two commas
// to anchor the high end of the y-axis. Derived in-cell — no hardcoded
// scatter coordinates.
const scatterRatios = [
  "1/1",   "2/1",   "3/2",   "4/3",   "5/4",   "6/5",
  "7/4",   "7/5",   "7/6",   "8/5",   "9/5",   "9/7",
  "9/8",   "10/7",  "10/9",  "11/6",  "11/7",  "11/8",
  "11/9",  "11/10", "12/7",  "12/11", "13/8",  "13/9",
  "14/9",  "15/8",  "15/14", "16/9",  "16/15", "17/16",
  "81/80", "32805/32768",
];
const scatterData = scatterRatios.map((r) => {
  const iv = new Interval(r);
  return {
    ratio: r,
    cents: iv.cents,
    th: tenneyHeight(iv.monzo) / Math.LN2,
    limit: primeLimitOfMonzo(iv.monzo),
  };
});
```

```ts
// Single-panel scatter. y-axis is Tenney height (log₂(n·d)) — already a log
// quantity, so a LINEAR axis is correct (log-log would visually flatten the
// schisma against the syntonic comma). x-axis is cents in [0, 1200). Domain
// extends to 32 to keep the schisma visible — the lone high dot at ~2¢ / ~30
// is the chart's punchline. Color encodes prime-limit for free orientation.
const scatterChart = Plot.plot({
  width: 720,
  height: 440,
  marginLeft: 55,
  marginRight: 110,
  marginBottom: 50,
  x: {
    label: "Pitch distance from 1/1 (cents)",
    domain: [0, 1220],
    grid: true,
  },
  y: {
    label: "Tenney height — log₂(n·d)",
    domain: [0, 32],
    grid: true,
  },
  color: {
    legend: true,
    label: "Prime limit",
    type: "ordinal",
    domain: [2, 3, 5, 7, 11, 13, 17],
    range: ["#888888", "#4269d0", "#efb118", "#ff725c", "#6cc5b0", "#a463f2", "#9c6b4f"],
  },
  marks: [
    Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
    Plot.dot(scatterData, {
      x: "cents",
      y: "th",
      fill: "limit",
      stroke: "limit",
      r: 4.5,
      title: (d) =>
        `${d.ratio} — ${d.cents.toFixed(1)}¢, TH=${d.th.toFixed(2)}, ${d.limit}-limit`,
    }),
    Plot.text(scatterData, {
      x: "cents",
      y: "th",
      text: "ratio",
      dx: 6,
      dy: -4,
      fontSize: 10,
      textAnchor: "start",
    }),
  ],
});
display(scatterChart);
```

Click any ratio to hear it.

```ts
// Audible pills row — one ratioPill + bare ▶ button per ratio in scatterRatios.
// Plot.dot() is not clickable in Observable Plot, so the audition surface lives
// here, directly beneath the chart. The container is a flex-wrap row so the 32
// pairs reflow on narrow viewports.
//
// XSS discipline (T-02-22 / T-02-23, T-kl9-01): createElement + appendChild
// only for wrappers; ratioPill / playInterval factories already use textContent
// for all dynamic strings. No innerHTML for derived content.
//
// scatterRatios is in cell scope from the cell above — do NOT redeclare.
// Per D-08 / D-18, leave playInterval defaults intact: 440 Hz root, 1.5s, bare ▶.
const scatterPillsRow = (() => {
  const container = document.createElement("div");
  container.className = "ratio-pills-row";
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.gap = "0.5rem";
  container.style.alignItems = "center";
  container.style.margin = "0.5rem 0 1rem 0";

  for (const r of scatterRatios) {
    const iv = new Interval(r);
    const pair = document.createElement("span");
    pair.style.display = "inline-flex";
    pair.style.alignItems = "center";
    pair.style.gap = "0.2rem";
    pair.appendChild(ratioPill(iv));
    pair.appendChild(playInterval(iv, synth));
    container.appendChild(pair);
  }
  return container;
})();
display(scatterPillsRow);
```

Two things to read off this plot. First, the **simple-ratio cluster** in the
bottom band (TH ≲ 8) spans the entire octave — pure fifths, thirds, sevenths,
and their inversions sit at every cents position from near-unison to near-octave
while staying low on the height axis. Pitch position and harmonic complexity
are independent. Second, the **schisma in the upper left** (1.954 ¢, TH ≈ 30):
almost zero cents from the unison, but very far from the unison in Tenney
height. A scale designer using `32805/32768` to spell a "near-pure" interval
is paying a large complexity tax to gain almost nothing in cents — which is the
quantitative reason the schisma typically gets *tempered out*, not played
deliberately.

## Tenney-weighted error in the EDO ranker

The [Analysis dashboard](/pages/analysis) ranks N-EDOs against a JI scale using
three error metrics — max, RMS, and **Tenney-weighted**. The kernel implementation
lives at `src/lib/edo.ts` in `bestEdosForScale`:

```ts run=false
const weight = Math.max(1, tenneyHeight(iv.monzo));    // ln(n·d), clamped at 1
tenneyWeighted += absCentsError / weight;              // accumulate per interval
```

Read it as a **weighted sum of cents errors**, where each interval's weight is
the inverse of its Tenney height. Simple ratios — `3/2` (TH ≈ 1.79 in ln, 2.59
in log₂), `5/4` (~3.00 / 4.32), `7/4` (~3.33 / 4.81) — sit at the low end of
the height range, so dividing by a small number leaves their cents error
contributing **almost intact**. Complex ratios — `81/80` (~8.78 / 12.66),
`32805/32768` (~20.80 / 30.00) — divide their cents error by a much larger
number, so even a 20-cent miss on the schisma contributes less to the sum than
a 1-cent miss on a pure fifth.

This bias is musically deliberate. Simple ratios are the load-bearing
consonances of tonal music — the perfect fifth, the major third, the harmonic
seventh. An EDO that hits *these* accurately sounds tonally coherent even when
its approximations of high-complexity commas are bad. An EDO that nails a comma
exactly but misses the fifth by 7 ¢ sounds out of tune. The metric encodes
that priority into a single scalar. Compare:

- **Max error** is dominated by whichever interval the EDO fits worst — usually
  a comma or a high-prime ratio. Answers "what's the worst this EDO does?"
- **RMS error** weights all intervals uniformly (with quadratic emphasis on
  large misses). No musical bias.
- **Tenney-weighted error** weights *toward simple ratios*. The musically
  biased option; the one that aligns "best EDO for this scale" with "EDO that
  sounds most in tune for this scale".

The base of the logarithm doesn't affect *rankings*: rescaling every weight by
the constant ${tex`\ln 2`} rescales the metric uniformly, leaving the EDO order
unchanged. The kernel uses ln; the page above shows log₂; both produce the
same ranked list.

The `Math.max(1, …)` clamp deserves one note. For `1/1`, `tenneyHeight` returns
`0` — dividing by zero would `NaN` the sum. The clamp also keeps `2/1`
(TH ≈ 0.693 in ln, well under 1) from being *over*-weighted relative to the
other simple ratios. In practice every EDO hits the unison and the octave
exactly (step 0 and step N), so the 1/1 and 2/1 errors are always zero and the
clamp doesn't change rankings — but it is a load-bearing numerical safety guard
for any consumer that reuses `tenneyHeight` in a divide context.

## See also

The companion pages: [Monzos](./monzos) for the prime-exponent representation
this depends on, [prime-limits](./prime-limits) for the related complexity
measure, [EDO approximations](./edo-approximation) for the cents-error
machinery the Tenney-weighted metric sits on top of, and [Analysis](./analysis)
for the live EDO ranker that uses it. The [dashboard](/) accepts any JI scale
and reports Tenney-weighted error alongside max and RMS in the EDO comparison
table.

## Further reading

```js
furtherReading([
  {
    title: "James Tenney — John Cage and the Theory of Harmony (1983)",
    url: "https://www.plainsound.org/pdfs/JC&ToH.pdf",
    note: html`Tenney's own monograph — the primary source for harmonic distance / Tenney height in its modern formulation. §3 and §6 develop the lattice metric (defining harmonic distance as ${tex`\log(n \cdot d)`} of a reduced ratio, exactly the formula this page uses) and connect it to consonance perception via Helmholtz–Stumpf roughness. Hosted by Plainsound Music Edition, the Sabat/von Schweinitz imprint that publishes most of Tenney's theoretical writing.`
  },
  {
    title: "Tenney height — Xenharmonic Wiki",
    url: "https://en.xen.wiki/w/Tenney_height",
    note: html`Community-curated reference. Catalogues the formula in both prime-axis (${tex`\sum |e_i| \log p_i`}) and log-product (${tex`\log(n \cdot d)`}) forms, cross-references the related Wilson height and Weil norm, and lists the regular-temperament uses — TE/TOP optimization, badness measures, and complexity ordering of commas in temperament-finding searches.`
  }
])
```

## Sources

- Tenney, James. 1983. "John Cage and the Theory of Harmony." *Soundings* 13: 55–83. (Composed 1983; published 1984 in *Soundings* 13. Reprinted in Tenney, *From Scratch: Writings in Music Theory*, ed. Larry Polansky et al., Urbana: University of Illinois Press, 2015, ch. 12.)
- Xenharmonic Wiki. n.d. "Tenney height." Accessed 2026-05-13. https://en.xen.wiki/w/Tenney_height.
