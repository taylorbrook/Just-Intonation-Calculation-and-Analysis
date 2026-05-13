# Well-temperaments

A 17th-/18th-century answer to meantone's wolf: temper SOME fifths, leave others pure, let key character vary smoothly around the circle.

```ts
import { Interval } from "../lib/interval.js";
import { commaByName } from "../lib/commas.js";
import { centsToRatio } from "../lib/cents.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import { furtherReading } from "../components/further-reading.js";
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
<a href="./meantone">meantone</a>, <a href="./pythagorean-comma">the Pythagorean comma</a>
</aside>

```ts
// Kernel-exact anchors (Pitfall #1: BigInt Fraction is the source of truth).
// Each cents-derived constant below is a display projection of an Interval or commaByName lookup
// — no hardcoded float-cent literals enter the data rows.
const pureFifth  = new Interval("3/2");                  //  701.955¢
const pythComma  = commaByName("Pythagorean comma")!;    //  23.460¢ — the closure gap
const syntonic   = commaByName("syntonic comma")!;       //  21.506¢ — Kirnberger's 4-fifth budget
const schisma    = commaByName("schisma")!;              //   1.954¢ — Kirnberger's residue
const pure5Third = new Interval("5/4");                  //  386.314¢ — 5-limit pure major third
const pythThird  = new Interval("81/64");                //  407.820¢ — Pythagorean major third (4 pure 5ths up, 2 octaves down)

const PF    = pureFifth.cents;                  // pure 3/2 in cents
const PC_4  = pythComma.cents / 4;              // 1/4 Pythagorean comma  ≈ 5.865¢ (Werckmeister III)
const PC_6  = pythComma.cents / 6;              // 1/6 Pythagorean comma  ≈ 3.910¢ (Vallotti)
const SC_4  = syntonic.cents  / 4;              // 1/4 syntonic comma     ≈ 5.377¢ (Kirnberger III)
const SCHIS = schisma.cents;                    // schisma                ≈ 1.954¢ (Kirnberger III residue)
```

```ts
// Per-temperament fifth-size arrays. Indexing walks the circle starting at C:
// position 0 = C–G, 1 = G–D, 2 = D–A, 3 = A–E, 4 = E–B, 5 = B–F♯, 6 = F♯–C♯,
// 7 = C♯–G♯, 8 = G♯–E♭, 9 = E♭–B♭, 10 = B♭–F, 11 = F–C.
//
// Each array's 12 fifth-sizes MUST sum to exactly 7 octaves = 8400¢ (build-time
// invariant — see § "The construction"). The arithmetic identities driving this:
//   - Werckmeister III: 4 fifths × (PF − PC_4) + 8 × PF = 12×PF − PC = 8400  ✓
//   - Vallotti:         6 fifths × (PF − PC_6) + 6 × PF = 12×PF − PC = 8400  ✓
//   - Kirnberger III:   4 fifths × (PF − SC_4) + 1 × (PF − SCHIS) + 7 × PF
//                     = 12×PF − SC − SCHIS = 12×PF − PC = 8400              ✓
// (PC = SC + SCHIS — that algebraic identity is why Kirnberger's mixed split lands
// on the same total closure budget as Werckmeister/Vallotti.)

// --- Werckmeister III (1691) ---
// Narrow C-G, G-D, D-A, B-F♯ by ¼ Pythagorean comma. All other eight fifths pure.
const werckFifths = [
  { name: "C–G",   cents: PF - PC_4 },
  { name: "G–D",   cents: PF - PC_4 },
  { name: "D–A",   cents: PF - PC_4 },
  { name: "A–E",   cents: PF },
  { name: "E–B",   cents: PF },
  { name: "B–F♯",  cents: PF - PC_4 },
  { name: "F♯–C♯", cents: PF },
  { name: "C♯–G♯", cents: PF },
  { name: "G♯–E♭", cents: PF },
  { name: "E♭–B♭", cents: PF },
  { name: "B♭–F",  cents: PF },
  { name: "F–C",   cents: PF },
];

// --- Kirnberger III (1779) ---
// Narrow C-G, G-D, D-A, A-E by ¼ syntonic comma — the C-major third arrives at
// pure 5/4. Park the schisma residue on F♯-C♯ so the cycle closes exactly.
const kirnFifths = [
  { name: "C–G",   cents: PF - SC_4 },
  { name: "G–D",   cents: PF - SC_4 },
  { name: "D–A",   cents: PF - SC_4 },
  { name: "A–E",   cents: PF - SC_4 },
  { name: "E–B",   cents: PF },
  { name: "B–F♯",  cents: PF },
  { name: "F♯–C♯", cents: PF - SCHIS },
  { name: "C♯–G♯", cents: PF },
  { name: "G♯–E♭", cents: PF },
  { name: "E♭–B♭", cents: PF },
  { name: "B♭–F",  cents: PF },
  { name: "F–C",   cents: PF },
];

// --- Vallotti (1779) ---
// Narrow six consecutive fifths F-C-G-D-A-E-B by 1/6 Pythagorean comma. Symmetric
// around D; the mildest of the three. Indexed from C: positions 0..4 (C-G..E-B)
// and 11 (F-C) carry the tempering — that is exactly six consecutive fifths along
// the chain F → C → G → D → A → E → B.
const vallottiFifths = [
  { name: "C–G",   cents: PF - PC_6 },
  { name: "G–D",   cents: PF - PC_6 },
  { name: "D–A",   cents: PF - PC_6 },
  { name: "A–E",   cents: PF - PC_6 },
  { name: "E–B",   cents: PF - PC_6 },
  { name: "B–F♯",  cents: PF },
  { name: "F♯–C♯", cents: PF },
  { name: "C♯–G♯", cents: PF },
  { name: "G♯–E♭", cents: PF },
  { name: "E♭–B♭", cents: PF },
  { name: "B♭–F",  cents: PF },
  { name: "F–C",   cents: PF - PC_6 },
];

// Keys around the circle of fifths starting at C — used for major-third lookup.
const KEYS = ["C", "G", "D", "A", "E", "B", "F♯", "C♯", "G♯", "E♭", "B♭", "F"];

// Cumulative cents from C to the key at keyIndex (reduced into [0, 1200)).
// Used for triad-audition (root frequency = baseHz * centsToRatio(cumulativeAt(...))).
function cumulativeAt(fifths, keyIndex) {
  let c = 0;
  for (let i = 0; i < keyIndex; i++) c += fifths[i].cents;
  return ((c % 1200) + 1200) % 1200;
}

// Major third of key at keyIndex: 4 consecutive fifths starting at keyIndex,
// reduced by 2 octaves and reduced into [0, 1200). Pure-cents math — no
// new Interval(...) for the irrational tempered third.
function majorThirdAt(fifths, keyIndex) {
  let sum = 0;
  for (let k = 0; k < 4; k++) sum += fifths[(keyIndex + k) % 12].cents;
  return (((sum - 2400) % 1200) + 1200) % 1200;
}

const werckThirds    = KEYS.map((k, i) => ({ key: k, cents: majorThirdAt(werckFifths,    i) }));
const kirnThirds     = KEYS.map((k, i) => ({ key: k, cents: majorThirdAt(kirnFifths,     i) }));
const vallottiThirds = KEYS.map((k, i) => ({ key: k, cents: majorThirdAt(vallottiFifths, i) }));
```

```ts
// Plain-DOM fifth-size table builder. Three columns: #, Fifth, Size (¢).
// 3-decimal precision (Pitfall #16 — 0.001¢ surfaces Kirnberger's schisma fifth).
// createElement + textContent only — NO innerHTML (T-02-22/T-02-23 XSS discipline).
function fifthsTable(fifths) {
  const fmt = (c) => c.toFixed(3);
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["#", "Fifth", "Size (¢)"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  fifths.forEach((f, i) => {
    const tr = document.createElement("tr");
    [String(i), f.name, fmt(f.cents)].forEach((c) => {
      const td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

const werckFifthsTable    = fifthsTable(werckFifths);
const kirnFifthsTable     = fifthsTable(kirnFifths);
const vallottiFifthsTable = fifthsTable(vallottiFifths);
```

```ts
// Plot bar chart factories.
//
// 1) Fifth-size deviation chart: y = cents − PF, so pure fifths sit at 0 and
//    tempered fifths sit below 0. Tempered-flat bars in red (#c45656) so the
//    Kirnberger F♯-C♯ schisma-flat fifth shows visibly. Plot.ruleY([0]) is the
//    zero baseline — the Plot API for a single horizontal reference line.
function fifthsDeviationChart(fifths) {
  const data = fifths.map((d) => ({ name: d.name, dev: d.cents - PF }));
  return Plot.plot({
    width: 640,
    height: 220,
    marginBottom: 50,
    marginLeft: 60,
    x: { domain: fifths.map((d) => d.name), label: "Fifth (around the circle starting at C)" },
    y: {
      label: "Deviation from pure 701.955¢",
      domain: [-7, 1],
      grid: true,
      tickFormat: (v) => (v > 0 ? `+${v}` : String(v)),
    },
    marks: [
      Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
      Plot.barY(data, {
        x: "name",
        y: "dev",
        fill: (d) => (d.dev < -0.01 ? "#c45656" : "#4269d0"),
      }),
      Plot.text(data, {
        x: "name",
        y: "dev",
        text: (d) => d.dev.toFixed(1),
        dy: (d) => (d.dev < -0.01 ? 12 : -8),
        fontSize: 10,
        fill: (d) => (d.dev < -0.01 ? "#c45656" : "#888"),
      }),
    ],
  });
}

// 2) Major-third-per-key chart: y-cents of the major third of each key,
//    with three dashed reference rules — pure 5/4 (blue), 12-TET 400¢ (gray),
//    Pythagorean 81/64 (red). The 386.314 / 407.820 reference values are
//    kernel-projected from pure5Third.cents / pythThird.cents — no float
//    literals. (400¢ IS the definition of EDO step 4, so it stays as the
//    integer literal.)
function majorThirdsChart(thirds) {
  return Plot.plot({
    width: 640,
    height: 260,
    marginBottom: 50,
    marginLeft: 60,
    x: { domain: KEYS, label: "Major key (around the circle of fifths from C)" },
    y: {
      label: "Major third (cents above root)",
      domain: [380, 412],
      grid: true,
    },
    marks: [
      Plot.ruleY([pure5Third.cents], { stroke: "#4269d0", strokeDasharray: "3,3" }),
      Plot.ruleY([400],              { stroke: "#888",    strokeDasharray: "3,3" }),
      Plot.ruleY([pythThird.cents],  { stroke: "#c45656", strokeDasharray: "3,3" }),
      Plot.barY(thirds, { x: "key", y: "cents", fill: "#4269d0" }),
      Plot.text(thirds, {
        x: "key",
        y: "cents",
        text: (d) => d.cents.toFixed(1),
        dy: -8,
        fontSize: 10,
      }),
    ],
  });
}

const werckFifthsChart    = fifthsDeviationChart(werckFifths);
const kirnFifthsChart     = fifthsDeviationChart(kirnFifths);
const vallottiFifthsChart = fifthsDeviationChart(vallottiFifths);

const werckThirdsChart    = majorThirdsChart(werckThirds);
const kirnThirdsChart     = majorThirdsChart(kirnThirds);
const vallottiThirdsChart = majorThirdsChart(vallottiThirds);
```

```ts
// Inline triad-audition button factory. Mirrors meantone.md's playTempered
// (lines 117-129). ONE inline factory definition; six button instances below.
// All audio routed through the page-level `synth` (Pitfall #2 — one createSynth
// callsite). baseHz = 440 (D-08), duration = 1.5s (D-18).
const playTriadAt = (label, rootCents, thirdCents, fifthCents) => {
  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = `▶ ${label}`;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", () => {
    const baseHz = 440;
    const root  = baseHz * centsToRatio(rootCents);
    const third = baseHz * centsToRatio(thirdCents);
    const fifth = baseHz * centsToRatio(fifthCents);
    synth.playNotes([root, third, fifth], 1.5);
  });
  return btn;
};

// Six buttons: C-major and F♯-major triads × three temperaments.
const werckC     = playTriadAt("Werckmeister III — C major triad",
                                cumulativeAt(werckFifths, 0),
                                majorThirdAt(werckFifths, 0),
                                werckFifths[0].cents);
const werckFs    = playTriadAt("Werckmeister III — F♯ major triad",
                                cumulativeAt(werckFifths, 6),
                                majorThirdAt(werckFifths, 6),
                                werckFifths[6].cents);

const kirnC      = playTriadAt("Kirnberger III — C major triad",
                                cumulativeAt(kirnFifths, 0),
                                majorThirdAt(kirnFifths, 0),
                                kirnFifths[0].cents);
const kirnFs     = playTriadAt("Kirnberger III — F♯ major triad",
                                cumulativeAt(kirnFifths, 6),
                                majorThirdAt(kirnFifths, 6),
                                kirnFifths[6].cents);

const vallottiC  = playTriadAt("Vallotti — C major triad",
                                cumulativeAt(vallottiFifths, 0),
                                majorThirdAt(vallottiFifths, 0),
                                vallottiFifths[0].cents);
const vallottiFs = playTriadAt("Vallotti — F♯ major triad",
                                cumulativeAt(vallottiFifths, 6),
                                majorThirdAt(vallottiFifths, 6),
                                vallottiFifths[6].cents);
```

[Meantone temperament](/pages/meantone) narrows *every* fifth by the same fraction
of the [syntonic comma](/pages/syntonic-comma) — beautiful in close keys, hard
wolf in far keys. [12-EDO](/pages/edo-approximation) narrows every fifth by the same
tiny amount (≈ 1.955¢) and absorbs the [Pythagorean comma](/pages/pythagorean-comma)
evenly — usable everywhere, just-intoned nowhere. **Well-temperaments split the
difference: narrow SOME fifths and leave others pure, so close keys get near-just
thirds while distant keys remain playable.** Each temperament has its own signature
of key character — major thirds vary smoothly around the circle from
${tex`\approx 386\text{¢}`} (near-pure) to ${tex`\approx 408\text{¢}`} (near-Pythagorean).

Three canonical 12-note schemes cover the historical range: **Werckmeister III**
(1691, ¼ Pythagorean comma across four fifths), **Kirnberger III** (1779, ¼
syntonic comma across four fifths plus a single schisma fifth), and **Vallotti**
(1779, ⅙ Pythagorean comma across six consecutive fifths). All three share the
same closure budget — one Pythagorean comma — but distribute it across the
fifth chain in three different shapes.

## The construction (general)

The 12 fifths of any 12-note temperament must sum to exactly 7 octaves:

${tex`\sum_{i=0}^{11} f_i \;=\; 7 \times 1200 \;=\; 8400\text{¢}`}

A chain of twelve pure 3/2 fifths overshoots that target by one Pythagorean
comma (${tex`12 \times 701.955\text{¢} = 8423.460\text{¢}`} = 8400 + PC). Every
12-note temperament must therefore absorb exactly one Pythagorean comma's worth
of narrowing, distributed somehow across the 12 fifths. Werckmeister III parks
that budget as ${tex`4 \times \tfrac{1}{4}\text{PC}`} on four specific fifths;
Vallotti spreads it as ${tex`6 \times \tfrac{1}{6}\text{PC}`} on six. Kirnberger
III uses the algebraic identity ${tex`\text{PC} = \text{SC} + \text{schisma}`}
— absorb the syntonic comma into four ¼-SC fifths (so the C-major third lands on
pure 5/4) and park the leftover schisma on a single distant fifth.

## Werckmeister III (1691)

Andreas Werckmeister's *Musicalische Temperatur* (1691) is the first widely-adopted
well-temperament — what Werckmeister himself called "Correct temperament no. 1." Narrow
the four fifths C-G, G-D, D-A, and B-F♯ each by ${tex`\tfrac{1}{4}`} of a Pythagorean
comma. Leave all other eight fifths pure.

```ts
display(werckFifthsTable);
```

```ts
display(werckFifthsChart);
```

```ts
display(werckThirdsChart);
```

C and F major are the cleanest at ${tex`\approx 390\text{¢}`} major thirds; F♯,
C♯, and G♯ major land on the full Pythagorean ${tex`81/64`} third (four pure
fifths in a row arrive there exactly) — a continuous gradient of key character
around the circle.

## Kirnberger III (1779)

Johann Philipp Kirnberger — Bach's pupil — published his third temperament scheme in
*Die Kunst des reinen Satzes in der Musik* (1779). Narrow the four fifths C-G, G-D,
D-A, A-E each by ${tex`\tfrac{1}{4}`} of a *syntonic* comma; park the residual
schisma on the single F♯-C♯ fifth so the chain still closes into 7 octaves.

```ts
display(kirnFifthsTable);
```

```ts
display(kirnFifthsChart);
```

```ts
display(kirnThirdsChart);
```

C major has the literally pure 5-limit major third (${ratioPill(pure5Third)},
${tex`\approx 386.3\text{¢}`}) — that is Kirnberger III's headline property: four
¼-syntonic-comma fifths absorb exactly one syntonic comma, so the chain C → G → D
→ A → E lands on pure ${tex`5/4`} above C.

## Vallotti (1779)

Francesco Vallotti's scheme (composed 1728, published posthumously 1779) narrows
six consecutive fifths along the chain F → C → G → D → A → E → B each by
${tex`\tfrac{1}{6}`} of a Pythagorean comma; the other six fifths stay pure.
Symmetric around D, mildest of the three. The temperament commonly called
"Vallotti" today is technically a slight misattribution — Vallotti's own scheme
is more elaborate — but the ⅙-PC-on-six-fifths recipe is the canonical reference
that goes by his name, and it remains the modern early-music default for keyboard
repertoire from the late Baroque.

```ts
display(vallottiFifthsTable);
```

```ts
display(vallottiFifthsChart);
```

```ts
display(vallottiThirdsChart);
```

Symmetric around D: F, C, G major are equally clean at ${tex`\approx 392\text{¢}`};
B, F♯, C♯ major are equally rough at ${tex`\approx 408\text{¢}`}. A and E♭ major
land *exactly* on 12-TET (400¢) — a curious arithmetic coincidence:
${tex`4 \times (701.955 - 3.910) - 2400 = 400.000`}.

## Audition — close key vs distant key

Click each pair and listen: the close-key triad sounds smooth and consonant; the
distant-key triad is audibly harsher in proportion to how aggressively the
temperament distributes the comma onto its near-pure fifths.

**Werckmeister III** — sharpest contrast (¼ PC concentrated on four fifths):

${werckC} ${werckFs}

**Kirnberger III** — C-major triad is literally pure ${tex`4:5:6`} (the major
third sits on ${ratioPill(pure5Third)}); F♯ major converges on Pythagorean:

${kirnC} ${kirnFs}

**Vallotti** — mildest contrast (⅙ PC spread across six fifths); F♯ major still
lands on Pythagorean but the close keys are less near-just than Kirnberger or
Werckmeister:

${vallottiC} ${vallottiFs}

The pedagogical point: in each temperament the C-major triad is the closest the
system gets to pure 5-limit just intonation, and the F♯-major triad is the
closest the system gets to Pythagorean ${tex`81/64`}. The same major-triad chord
shape sounds qualitatively different in different keys — that gradient *is*
"key character."

## How well-temperaments compare

```ts
const comparisonTable = (() => {
  const fmt = (c) => c.toFixed(3);
  const minThird = (thirds) => thirds.reduce((a, b) => (a.cents < b.cents ? a : b));
  const maxThird = (thirds) => thirds.reduce((a, b) => (a.cents > b.cents ? a : b));
  const rows = [
    {
      name: "Werckmeister III",
      year: "1691",
      comma: "1 Pythagorean comma split as 4 × ¼ PC",
      clean: minThird(werckThirds),
      rough: maxThird(werckThirds),
    },
    {
      name: "Kirnberger III",
      year: "1779",
      comma: "1 syntonic comma split as 4 × ¼ SC, plus 1 schisma",
      clean: minThird(kirnThirds),
      rough: maxThird(kirnThirds),
    },
    {
      name: "Vallotti",
      year: "1779",
      comma: "1 Pythagorean comma split as 6 × ⅙ PC",
      clean: minThird(vallottiThirds),
      rough: maxThird(vallottiThirds),
    },
  ];
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Temperament", "Year", "Comma distributed", "Cleanest key (¢)", "Roughest key (¢)"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const r of rows) {
    const tr = document.createElement("tr");
    [
      r.name,
      r.year,
      r.comma,
      `${r.clean.key} (${fmt(r.clean.cents)})`,
      `${r.rough.key} (${fmt(r.rough.cents)})`,
    ].forEach((c) => {
      const td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
})();
display(comparisonTable);
```

## Why this matters

Well-temperaments are why Bach could write the *Wohltemperirte Clavier* across
all 24 keys: in 1/4-comma meantone, half of those keys would be flat-out
unplayable (the wolf fifth lands somewhere and ruins everything that touches
it). A well-temperament's deal is that NO key is broken — but no two keys sound
the same either. Every key has a slight color, and the colors arrange themselves
smoothly around the circle of fifths.

The historical arc is straightforward: meantone (uniform tempering, beautiful
close-key thirds, unusable far keys) → well-temperaments (uneven tempering, all
keys playable, each with character) → 12-EDO (perfectly uniform tempering, no
wolf, no character). Each step trades one property for another. 12-EDO won
because composers wanted to modulate freely and instrument makers wanted scale
parity; well-temperaments lost that argument by the mid-19th century.

Key character did not vanish without a fight, though. The 19th-century practice
of treating remote keys as expressively distinct — Wagner's famously-affecting
D♭-major moments, Schubert's E-major / E♭-major contrasts — partly lives on as
historical residue of those keys *having* sounded distinctly different on the
pre-12-TET keyboards composers grew up at. Once you have heard a Vallotti F♯-major
triad against a Vallotti C-major triad, that residue makes sense as something
real rather than as a Romantic affectation.

## See also

The [meantone](/pages/meantone) page — the predecessor: uniform tempering,
beautiful close-key thirds, hard wolf. This page picks up where meantone leaves
off and shows how to keep most of its consonance while making all 24 keys
playable.

[EDO approximations](/pages/edo-approximation) — the successor: 12-EDO finishes
the arc by making the tempering perfectly uniform. No wolf, no character.

The [Pythagorean comma](/pages/pythagorean-comma) — the closure gap that
Werckmeister III and Vallotti distribute, and that Kirnberger III distributes
as syntonic-comma-plus-schisma. The [syntonic comma](/pages/syntonic-comma) is
the comma Kirnberger III specifically absorbs into its four ¼-SC fifths so the
C-major third lands on pure 5/4.

The [dashboard](/) — paste any of the fifth-size cents values into the
cents-from-12tet field and audition the temperament against a drone.

## Further reading

```js
furtherReading([
  {
    title: "Well temperament on the Xenharmonic Wiki",
    url: "https://en.xen.wiki/w/Well_temperament",
    note: "community-curated reference for the well-temperament family — temperaments that temper out the Pythagorean comma across an UNEVEN distribution of fifths so all 24 keys are usable but each retains its own slight character. Catalogues Werckmeister I-VI, Kirnberger I-III, Vallotti, Young, Lehman/Bach-1722, Neidhardt, and the many other 17th–19th-century named schemes; cross-references each to the comma it distributes and the keys where it places its cleanest thirds."
  },
  {
    title: "Bradley Lehman — Bach's tuning (larips.com)",
    url: "https://www.larips.com/",
    note: html`primary site for Lehman's 2005 ${tex`(3/2)^{12}`}-vs-${tex`2^{7}`} proposal that Bach's well-tempered tuning is encoded in the calligraphic squiggle decorating the title page of the *Wohltemperirte Clavier* manuscript. Lehman reads the eleven loops as eleven fifths with three distinct tempering depths (1/6 PC, 1/12 PC, pure). The site collects the original papers, audio examples in every key, comparison tables against Werckmeister/Kirnberger/Vallotti, and his ongoing responses to critique.`
  },
  {
    title: "Mark Lindley — Lutes, Viols and Temperaments (Cambridge UP, 1984; ISBN 0-521-28950-5)",
    url: "https://www.cambridge.org/9780521289504",
    note: "the standard scholarly reference on Renaissance and early Baroque temperament practice — the historical context out of which Werckmeister's 1691 well-temperaments emerged. Lindley reconstructs tunings from period treatises, fret placement on extant instruments, and the implications for what music sounded like before well-temperaments solved the wolf problem."
  }
])
```
