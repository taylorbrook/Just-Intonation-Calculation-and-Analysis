# The Pythagorean comma

531441/524288 — the gap that prevents twelve pure fifths from closing into seven octaves

```ts
import { Interval } from "../lib/interval.js";
import { commaByName } from "../lib/commas.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import { playDyad } from "../components/play-dyad.js";
import { spiralOfFifths } from "../components/spiral-of-fifths.js";
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
<a href="./prime-limits">prime-limits</a>
</aside>

```ts
// commaByName returns Interval | undefined. The "Pythagorean comma" key is hand-verified
// in src/lib/commas.ts (Plan 02), so the lookup is total at construction time; we
// assert non-null with `!` and let strict-TS keep us honest if the table ever drifts.
const pythagoreanComma = commaByName("Pythagorean comma")!; // 531441/524288
const pureOctave = new Interval("2/1");
// Stack twelve pure fifths: (3/2)^12 = 531441/4096 ≈ 7 octaves + a Pythagorean comma
// above 1/1. Then divide by six octaves (2/1)^6 to land just above 2/1 — the
// "cycle-of-fifths octave" that overshoots the pure octave by exactly one comma.
let twelveFifths = new Interval("1/1");
for (let i = 0; i < 12; i++) twelveFifths = twelveFifths.mul(new Interval("3/2"));
let cycleOctave = twelveFifths;
for (let i = 0; i < 6; i++) cycleOctave = cycleOctave.div(pureOctave);
// cycleOctave = 531441/262144 ≈ 2.0273
```

The **Pythagorean comma** is ${tex`\frac{531441}{524288} \approx 23.46\text{¢}`}, the gap
between twelve pure fifths and seven pure octaves. Stack twelve 3/2's and you reach
${tex`(3/2)^{12} = 531441/4096`} — a hair sharper than ${tex`2^{7} = 128`}, the
seven-octave-equivalent of where you started. They differ by exactly one Pythagorean
comma: ${tex`\frac{(3/2)^{12}}{2^{7}} = \frac{531441}{524288}`}. This is the reason a
12-tone system built from pure fifths doesn't close.

Audition the overshoot:

- ${playInterval(pureOctave, synth, { label: true })} sounds the pure octave (${ratioPill(pureOctave)}) — 1200¢ exactly, the target.
- ${playInterval(cycleOctave, synth, { label: true })} sounds the cycle-of-fifths "octave" (${ratioPill(cycleOctave)}) — a Pythagorean comma sharper than 2/1; where twelve stacked 3/2's actually land once you reduce the result by six octaves.
- ${playInterval(pythagoreanComma, synth, { label: true })} sounds the comma itself — audible as a beat-rate when the pure and cycle octaves are sounded together.

The pure octave and the cycle-of-fifths octave together — the Pythagorean comma as a beat-rate:

${playDyad(pureOctave, cycleOctave, synth, { label: "2/1 + 531441/262144 (Pythagorean-comma beat)" })}

## The closure gap, visualized

The spiral below traces all twelve pure fifths around the cycle, each labeled
with its octave-reduced ratio and its signed cents-from-12-TET. Step 0 sits
at 12 o'clock; the chain sweeps clockwise. Step 12 lands a hair past step 0
rather than on top of it — the dashed red chord between them IS the
Pythagorean comma.

${spiralOfFifths(12, { highlightWolf: true })}

The drift chart below makes the same gap quantitative. The y-axis tracks the
cumulative cents by which the pure-fifth chain has run *ahead* of an
imaginary chain of 12-TET fifths (which would land exactly on each octave).
Every step adds the same ~1.955¢ — the difference between a pure fifth
(701.955¢) and a 12-TET fifth (700¢) — so the line rises in a straight ramp
and lands at +23.460¢ at fifth 12: a single Pythagorean comma above the
closed-cycle zero line.

```ts
// Drift chart — cumulative cents-from-12-TET as 1..12 pure fifths are stacked.
// BigInt-Fraction is the source of truth: `acc` is an Interval that we
// multiply by 3/2 each step via Interval.mul (Pattern 1, R-01). The .cents
// projection is taken ONCE per step at the data-row construction site (display
// boundary; Pitfall #1) and immediately differenced against k*700 — the cents
// that k 12-TET fifths would have spanned.
const driftData = (() => {
  const fifth = new Interval("3/2");
  let acc = new Interval("1/1");
  const rows = [{ k: 0, cents: 0 }];
  for (let k = 1; k <= 12; k++) {
    acc = acc.mul(fifth);
    rows.push({ k, cents: acc.cents - k * 700 });
  }
  return rows;
})();

const driftChart = Plot.plot({
  width: 640,
  height: 280,
  marginLeft: 70,
  marginRight: 40,
  marginBottom: 50,
  x: {
    label: "Fifth #",
    domain: [0, 12],
    ticks: 13,
    tickFormat: (v) => String(v),
  },
  y: {
    label: "Cumulative cents ahead of k×700¢ (12-TET fifths)",
    domain: [0, 26],
    grid: true,
    tickFormat: (v) => (v > 0 ? `+${v}` : String(v)),
  },
  marks: [
    Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
    Plot.line(driftData, { x: "k", y: "cents", stroke: "#4269d0", strokeWidth: 2.5 }),
    Plot.dot(driftData, { x: "k", y: "cents", fill: "#4269d0", r: 4 }),
    Plot.text(
      [{ x: 12, y: driftData[12].cents, text: "+23.46¢ (Pythagorean comma)" }],
      { x: "x", y: "y", text: "text", dx: -8, dy: -10, textAnchor: "end", fontSize: 12, fill: "#c45656" },
    ),
  ],
});
display(driftChart);
```

## In monzos

${tex`531441/524288 = \begin{bmatrix} -19 & 12 \end{bmatrix}\rangle = 2^{-19} \cdot 3^{12}`}

Only the primes 2 and 3 appear — this is a 3-limit comma. Twelve 3's stacked up minus
nineteen 2's brought back down is the exact cost of trying to close a 12-note cycle
out of pure fifths alone.

> **Tempered out by.** 12-EDO, 24-EDO, 36-EDO — and more broadly, any
> 12-stable EDO whose patent val maps twelve fifths to seven octaves.
> Tempering 531441/524288 to a unison is precisely what lets a 12-note
> cycle of fifths close: the comma's ~23.460¢ overshoot is absorbed back
> into the octave. By contrast, 53-EDO (and finer Pythagorean-friendly
> divisions like 665-EDO) preserve the Pythagorean comma as a distinct,
> audible step — twelve fifths and seven octaves remain non-equivalent.

## See also

The dashboard at [/](/) lets you build any JI scale and audition it against a drone.
Try stacking twelve 3/2's by hand — the cents-from-12tet column drifts upward and
ends at the comma. The companion [syntonic comma](/pages/syntonic-comma) note
covers 5-limit JI's analogous closure gap.

## Further reading

- [Pythagorean comma on the Xenharmonic Wiki](https://en.xen.wiki/w/Pythagorean_comma) —
  community-curated reference for ${tex`531441/524288`} and its surrounding
  3-limit geometry. Covers the comma's role as the generator of the
  Pythagorean temperament family, its relationship to the schisma
  (${tex`32805/32768`}) and the diaschisma, and how various historical
  temperaments (well-temperaments, meantone variants, 12-TET) distribute or
  absorb it across the twelve fifths of the cycle.
