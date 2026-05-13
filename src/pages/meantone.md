# Meantone temperament

Distributing the syntonic comma across the chain of 5ths — the 16th-century answer to the comma pump.

```ts
import { Interval } from "../lib/interval.js";
import { commaByName } from "../lib/commas.js";
import { centsToRatio } from "../lib/cents.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import { spiralOfFifths } from "../components/spiral-of-fifths.js";
import * as Plot from "npm:@observablehq/plot";
import { furtherReading } from "../components/further-reading.js";
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
<a href="./syntonic-comma">the syntonic comma</a>, <a href="./pythagorean-tuning">Pythagorean tuning</a>
</aside>

```ts
// Kernel-exact anchors (Pitfall #1: BigInt Fraction is the source of truth).
const pureFifth = new Interval("3/2");                  //  701.955¢
const pure5Third = new Interval("5/4");                 //  386.314¢ — 5-limit pure major third
const pure6Third = new Interval("6/5");                 //  315.641¢ — 5-limit pure minor third
const pythThird = new Interval("81/64");                //  407.820¢ — Pythagorean major third (4 pure 5ths up, 2 octaves down)
const syntonic = commaByName("syntonic comma")!;        //  81/80 — the comma being distributed
```

```ts
// Cents-layer computation (Pitfall #1: NEVER used as kernel input — cents
// here exists solely to drive the display table and the audio-boundary
// ratio via centsToRatio). The pure-5th and syntonic-comma cents are
// projections of kernel-exact Intervals, so the formula's left half comes
// from `pureFifth.cents` and the right half from `syntonic.cents` — no
// ad-hoc Math.log2 constants in this cell.
//
// 1/n-comma meantone fifth = pure 5th cents − (1/n) × syntonic-comma cents
//                          = 1200*log2(3/2) − (1/n)*1200*log2(81/80)
//
// The derived major third (4 fifths reduced by 2 octaves) and minor third
// (3 fifths reduced by 1 octave, then inverted into the octave) are the
// canonical pedagogical handles for each variant:
//   - 1/4-comma: major third → pure 5/4 (Aron, 1523)
//   - 1/3-comma: minor third → pure 6/5 (Salinas, 1577)
//   - 1/6-comma: a softer compromise between 1/4-comma and 12-TET (Silbermann)
const tempered = (n) => {
  const fifth = pureFifth.cents - syntonic.cents / n;
  const major3 = 4 * fifth - 2400;        // 4 fifths − 2 octaves
  const minor3 = 1200 - (3 * fifth - 1200); // 1 octave − (3 fifths − 1 octave)
  return { n, fifth, major3, minor3 };
};

const quarter = tempered(4);
const third = tempered(3);
const sixth = tempered(6);
const verheijen = tempered(5);     // 1/5-comma (Verheijen, 1599)
const eighth = tempered(8);        // 1/8-comma
const zarlino = tempered(7 / 2);   // 2/7-comma (Zarlino, 1558) — n = 7/2 ⇒ comma fraction 1/n = 2/7
const variants = [quarter, third, sixth, verheijen, eighth, zarlino];
```

```ts
// Plain DOM table — no component, no innerHTML interpolation (Pitfall: T-02-22 XSS).
// All cell contents are textContent on real elements. Precision 3 decimals
// (Pitfall #16 — 0.1¢ minimum; 3 decimals surfaces the sub-cent structure that
// distinguishes the variants).
const variantsTable = (() => {
  const fmt = (c) => c.toFixed(3);
  const rows = [
    { label: "1/4-comma (Aron)",                v: quarter,   sig: "pure 5/4 major third" },
    { label: "1/3-comma (Salinas)",             v: third,     sig: "pure 6/5 minor third" },
    { label: "1/6-comma (Silbermann)",          v: sixth,     sig: "softer — between 1/4-comma and 12-TET" },
    { label: "1/5-comma (Verheijen, 1599)",     v: verheijen, sig: "fifths only ~4.3¢ flat; major 3rd ~6.9¢ sharp of pure 5/4 — milder than 1/4-comma" },
    { label: "2/7-comma (Zarlino, 1558)",       v: zarlino,   sig: "equalizes the major-3rd and minor-3rd deviations from pure (both ~5.4¢ off)" },
    { label: "1/8-comma",                       v: eighth,    sig: "softest meantone — closest variant to 12-TET (fifths only ~2.7¢ flat)" },
  ];
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Variant", "Tempered 5th (¢)", "Major 3rd (¢)", "Minor 3rd (¢)", "Signature property"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const r of rows) {
    const tr = document.createElement("tr");
    [r.label, fmt(r.v.fifth), fmt(r.v.major3), fmt(r.v.minor3), r.sig].forEach((c) => {
      const td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
})();
```

```ts
// Custom button for the irrational tempered third. Mirrors playInterval's
// .play-btn class so it inherits the global theme (--theme-blue, focus ring,
// typographic ▶).
const playTempered = (label, cents) => {
  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = `▶ ${label}`;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", () => {
    const baseHz = 440;                                  // D-08
    const ratio = centsToRatio(cents);                   // display/audio projection
    synth.playNotes([baseHz, baseHz * ratio], 1.5);      // D-18 default duration
  });
  return btn;
};

const playPureMajor3 = playInterval(pure5Third, synth, { label: true });
const playQuarterMajor3 = playTempered("Play 1/4-comma meantone major 3rd", quarter.major3);
const playPythMajor3 = playInterval(pythThird, synth, { label: true });
```

A [chain of pure 3/2 fifths](/pages/pythagorean-tuning) does not produce
consonant major thirds — stack four of them and you land on
${ratioPill(pythThird)}, the *Pythagorean* major third, ${tex`\approx 407.8\text{¢}`} —
bright but rough, a [syntonic comma](/pages/syntonic-comma)
(${tex`81/80 \approx 21.5\text{¢}`}) wider than the pure 5-limit ${tex`5/4`}.
**Meantone temperament** is the 16th-century answer: narrow *every* fifth by a
fraction of the syntonic comma so that after four fifths the comma has been
entirely absorbed. The chain of fifths still walks the same scale degrees, but
each fifth pays a small consonant cost so that the thirds arrive consonant.

## The construction

${tex`f_n \;=\; 1200 \log_2 \tfrac{3}{2} \;-\; \tfrac{1}{n} \cdot 1200 \log_2 \tfrac{81}{80}`}

where ${tex`f_n`} is the tempered fifth in cents and ${tex`n`} is the variant's
denominator. Each fifth loses ${tex`(1/n)`} of the syntonic comma; after four
fifths reduced by two octaves, the major third has lost ${tex`(4/n)`} of a
comma relative to the Pythagorean ${tex`81/64`}.

## Three historical choices for ${tex`n`}

Before the table, a strip chart of all six variants on a shared cents axis. Each
dashed blue vertical marks one variant's tempered fifth, labeled by its comma
fraction (1/n). The pure 3/2 sits at the right edge; the red bracket spans
exactly one syntonic comma — the budget being distributed across the chain.

```ts
// Plot strip chart — six tempered meantone fifths on a 0..pureFifth.cents axis.
// Pitfall #1: cents derived ONCE from kernel-exact Intervals (pureFifth.cents,
// syntonic.cents) and the existing tempered-fifth bindings (quarter.fifth,
// third.fifth, sixth.fifth, verheijen.fifth, eighth.fifth, zarlino.fifth).
// No float literals in the data rows.
const fifthsData = [
  { label: "1/8", cents: eighth.fifth },
  { label: "1/6", cents: sixth.fifth },
  { label: "1/5", cents: verheijen.fifth },
  { label: "1/4", cents: quarter.fifth },
  { label: "2/7", cents: zarlino.fifth },
  { label: "1/3", cents: third.fifth },
];
// Syntonic-comma bracket: the span from (pureFifth.cents − syntonic.cents) to
// pureFifth.cents IS one syntonic comma, by construction.
const commaSpanLeft = pureFifth.cents - syntonic.cents;
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
    // Pure-3/2 reference line (pureFifth.cents projects to the kernel-exact value).
    Plot.ruleX([pureFifth.cents], { stroke: "#888", strokeWidth: 1.5 }),
    Plot.text(
      [{ x: pureFifth.cents, y: 0.85, text: `pure 3/2 (${pureFifth.cents.toFixed(3)}¢)` }],
      { x: "x", y: "y", text: "text", textAnchor: "end", dx: -6, fontSize: 11, fill: "#888" },
    ),
    // Syntonic-comma bracket: horizontal segment from commaSpanLeft to commaSpanRight at y=-0.65.
    Plot.link(
      [{ x1: commaSpanLeft, x2: commaSpanRight, y1: -0.65, y2: -0.65 }],
      { x1: "x1", x2: "x2", y1: "y1", y2: "y2", stroke: "#c45656", strokeWidth: 1.5 },
    ),
    Plot.text(
      [{
        x: (commaSpanLeft + commaSpanRight) / 2,
        y: -0.85,
        text: `↔ ${syntonic.cents.toFixed(3)}¢ (syntonic comma)`,
      }],
      { x: "x", y: "y", text: "text", textAnchor: "middle", fontSize: 11, fill: "#c45656" },
    ),
    // Tempered-fifth markers — dashed verticals + dots + labels (alternating dy
    // so the 1/8/1/5/2/7 labels sit above and 1/6/1/4/1/3 below, avoiding
    // collisions where the markers cluster near 1/4-comma).
    Plot.ruleX(fifthsData, { x: "cents", stroke: "#4269d0", strokeDasharray: "3,3", strokeWidth: 1.5 }),
    Plot.dot(fifthsData, { x: "cents", y: 0, fill: "#4269d0", r: 4 }),
    Plot.text(fifthsData, {
      x: "cents",
      y: 0,
      text: "label",
      dy: (_d, i) => (i % 2 === 0 ? -14 : 18),
      fontSize: 11,
      fontWeight: 600,
      fill: "#4269d0",
    }),
  ],
});
display(fifthsChart);
```

```ts
display(variantsTable);
```

- **1/4-comma meantone (Pietro Aron, 1523).** Each fifth narrowed by
  ${tex`\tfrac{1}{4}`} of a syntonic comma. After four fifths reduced by two
  octaves the major third has *exactly* absorbed the comma — it lands on
  ${ratioPill(pure5Third)} (${tex`5/4`}), the 5-limit pure major third. This is
  meantone's headline property: the major triad is just-intoned (Aron 1523;
  Xen Wiki, "1/4-comma meantone"). The price is fifths that beat audibly
  (~5.4¢ flat of pure) and a wolf 5th somewhere on the chain that's much wider
  than in Pythagorean tuning.
- **1/3-comma meantone (Francisco Salinas, 1577).** Each fifth narrowed by
  ${tex`\tfrac{1}{3}`} of a syntonic comma. The minor third lands on
  ${ratioPill(pure6Third)} (${tex`6/5`}), the 5-limit pure *minor* third. The
  major thirds are now slightly flat of pure 5/4 (by ${tex`\tfrac{1}{3}`} of a
  comma), and the fifths are flatter still (~7.2¢ flat of pure). Used when
  minor triads are the priority (Salinas 1577, chs. 23–28; Xen Wiki,
  "1/3-comma meantone").
- **1/6-comma meantone (Gottfried Silbermann).** Each fifth narrowed by
  ${tex`\tfrac{1}{6}`} of a syntonic comma. Major thirds are sharp of pure 5/4
  by ${tex`\tfrac{2}{3}`} of a comma; fifths only ~3.6¢ flat of pure. A softer
  compromise — neither thirds nor fifths are pure, but the wolf is milder than
  in 1/4-comma and the system handles modulation more gracefully. The
  historical bridge from 1/4-comma meantone to well-tempered systems and
  ultimately 12-TET. The Silbermann attribution is conventional (Xen Wiki,
  "1/6-comma meantone"): no extant Silbermann treatise documents the recipe,
  and the label is reconstructed from his organ-tuning practice
  (citation needed for a documentary primary).

> **Variants table footnote.** The 2/7-comma row cites Zarlino 1558 (*Le
> istitutioni harmoniche*, pt. II chs. 42–43), the canonical primary for
> arithmetic-exact 2/7-comma meantone. The 1/5-comma row labels its
> attribution "Verheijen, 1599" for historical continuity with older tuning
> surveys; the better modern reading is *Verheyen, ca. 1600* — first described
> in correspondence between Abraham Verheyen and Simon Stevin (Xen Wiki,
> "1/5-comma meantone"). 1599 is a defensible point estimate within that
> "around 1600" window.

## The wolf at ${tex`k=12`} (1/4-comma meantone)

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
Pythagorean comma (+23.460¢)](/pages/pythagorean-comma); 1/4-comma
meantone's wolf goes the other way — twelve fifths come up short of seven
octaves by ≈ 41.1¢ (re-derived: ${tex`12 \times 696.578 - 8400 = -41.07\text{¢}`}).

## Audition — the 1/4-comma equivalence

Two buttons that sound audibly identical:

- ${playPureMajor3} sounds the 5-limit pure major third (${ratioPill(pure5Third)},
  ${tex`\approx 386.3\text{¢}`}) — kernel-exact via `Interval`.
- ${playQuarterMajor3} sounds the 1/4-comma meantone major third — built by
  stacking four tempered fifths and reducing by two octaves, computed entirely
  in cents (${tex`4 \times f_4 - 2400`}), then converted back to a frequency
  ratio via `centsToRatio`. The kernel never sees this number.

They sound the same. That is the entire pedagogical point of 1/4-comma
meantone: by tempering each fifth by exactly ${tex`\tfrac{1}{4}`} of a syntonic
comma, the major third arrives at the pure ${tex`5/4`} ratio — to within the
precision of the cents projection itself.

## Audition — the "before"

${playPythMajor3} sounds the Pythagorean major third ${ratioPill(pythThird)}
for contrast. Sound it against the pure 5/4 above and the syntonic comma is
audible as a beat-rate: ~21.506¢ wide.

## Why this layering matters

The kernel-exact / display-cents split — `Interval` for rationals,
`centsToRatio` only when the temperament makes the interval irrational — is
the discipline that lets us reason about *any* tuning system without losing
precision on its rational anchors. Pythagorean and pure JI are kernel-exact
through and through; meantone, well-temperaments, and EDOs need cents at the
boundary, but the consonant anchors (pure thirds, pure fifths) stay in
BigInt.

## See also

The [syntonic comma](/pages/syntonic-comma) — the ${tex`81/80`} ratio that
meantone distributes. The syntonic-comma page defines the interval; this page
shows three different ways to absorb it into a 12-tone scale.

[Pythagorean tuning](/pages/pythagorean-tuning) — the "before": twelve pure
3/2 fifths and the resulting wide ${tex`81/64`} major third. Meantone is the
answer to the question "what if we narrow each fifth a little so the third
comes back to pure?"

The [dashboard](/) — paste in any of the tempered ratios from above (e.g.
`centsToRatio(696.578)` is about ${tex`1.4953`}, ~0.3% below pure ${tex`3/2 = 1.5`})
and hear the temperament against a drone. Or stay on the kernel side: the 1/4-comma meantone scale
is the 5-limit pure scale `1/1 9/8 5/4 4/3 3/2 5/3 15/8 2/1` — already pure
${tex`5/4`}s and ${tex`6/5`}s where the chain of meantone fifths brings them.

## Further reading

```js
furtherReading([
  {
    title: "Meantone family on the Xenharmonic Wiki",
    url: "https://en.xen.wiki/w/Meantone_family",
    note: html`community-curated reference for the regular-temperament family generated by tempering out the syntonic comma. Covers the full continuum of comma fractions (1/n-comma meantone for arbitrary ${tex`n \in \mathbb{R}`}), the historical named variants as points on that line (Aron 1/4, Salinas 1/3, Silbermann 1/6, Verheijen 1/5, Zarlino 2/7, 12-TET ≈ 1/11.65-comma), the MOS pattern induced by each variant, and how the meantone family fits inside the broader regular-temperament zoo (sister families: schismatic, dominant, mavila).`
  },
  {
    title: "Easley Blackwood — The Structure of Recognizable Diatonic Tunings (Princeton UP, 1985)",
    url: "https://press.princeton.edu/books/hardcover/9780691091297/the-structure-of-recognizable-diatonic-tunings",
    note: "the modern canonical text on meantone temperament families. Blackwood lays out the 1/n-comma continuum as recognizability bands — the range over which a tempered fifth still anchors a diatonic-sounding scale — and is the rare 20th-century work that takes the whole continuum seriously rather than canonizing 1/4-comma. The companion Cedille recording (CDR 90000 018 / 019) auditions all 24 of his etudes in 13-EDO through 24-EDO."
  }
])
```

## Sources

- Aron, Pietro. 1523. *Toscanello in musica*. Venice: Bernardino e Matteo de' Vitali. (Multiple reprints 1525–1562.)
- Blackwood, Easley. 1985. *The Structure of Recognizable Diatonic Tunings*. Princeton, NJ: Princeton University Press.
- Salinas, Francisco de. 1577. *De musica libri septem*. Salamanca: Matthias Gastius.
- Xenharmonic Wiki. n.d. "1/3-comma meantone." Accessed 2026-05-13. https://en.xen.wiki/w/1/3-comma_meantone.
- Xenharmonic Wiki. n.d. "1/4-comma meantone." Accessed 2026-05-13. https://en.xen.wiki/w/1/4-comma_meantone.
- Xenharmonic Wiki. n.d. "1/5-comma meantone." Accessed 2026-05-13. https://en.xen.wiki/w/1/5-comma_meantone.
- Xenharmonic Wiki. n.d. "1/6-comma meantone." Accessed 2026-05-13. https://en.xen.wiki/w/1/6-comma_meantone.
- Xenharmonic Wiki. n.d. "Meantone family." Accessed 2026-05-13. https://en.xen.wiki/w/Meantone_family.
- Zarlino, Gioseffo. 1558. *Le istitutioni harmoniche*. Venice: [author]. (Reprinted 1561 and 1562 from the same blocks; pt. II, chs. 42–43 describe 2/7-comma meantone.)
