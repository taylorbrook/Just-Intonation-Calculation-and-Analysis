# The septimal comma

64/63 — the gap between the harmonic 7th and the Pythagorean minor 7th; entry point to 7-limit JI

```ts
import { Interval } from "../lib/interval.js";
import { commaByName } from "../lib/commas.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import { playDyad } from "../components/play-dyad.js";
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
<a href="./prime-limits">prime-limits</a>, <a href="./syntonic-comma">the syntonic comma</a>
</aside>

```ts
// commaByName returns Interval | undefined. The "septimal comma" key is hand-verified
// in src/lib/commas.ts (Plan 02), so the lookup is total at construction time; we
// assert non-null with `!` and let strict-TS keep us honest if the table ever drifts.
const septimal = commaByName("septimal comma")!; //         64/63 (Archytas' comma)
const harmonicSeventh = new Interval("7/4"); //             the natural 7th harmonic
const pythagoreanMinorSeventh = new Interval("16/9"); //    minor 7th from two stacked pure fourths (4/3 × 4/3 reduced)
```

The **septimal comma** is ${tex`\frac{64}{63} \approx 27.26\text{¢}`}, the gap between
the harmonic 7th (${ratioPill(harmonicSeventh)}) and the Pythagorean minor 7th
(${ratioPill(pythagoreanMinorSeventh)}). They differ by exactly one septimal comma:
${tex`\frac{16/9}{7/4} = \frac{64}{63}`}. This is the **entry point to 7-limit JI** —
the gap that emerges the moment you reach for the natural seventh harmonic instead of
stacking pure fifths and fourths.

Audition the difference:

- ${playInterval(harmonicSeventh, synth, { label: true })} sounds the harmonic 7th (${ratioPill(harmonicSeventh)}) — the natural 7th partial; smooth and "blue", noticeably flatter than 12-TET's minor 7th.
- ${playInterval(pythagoreanMinorSeventh, synth, { label: true })} sounds the Pythagorean minor 7th (${ratioPill(pythagoreanMinorSeventh)}) — built from pure fifths/fourths alone; slightly sharper than 7/4 by exactly one septimal comma.
- ${playInterval(septimal, synth, { label: true })} sounds the comma itself — audible as a beat-rate when the two sevenths are sounded together; the "cost" of pricing the seventh through prime 3 instead of prime 7.

The two sevenths together — the septimal comma as a beat-rate:

${playDyad(harmonicSeventh, pythagoreanMinorSeventh, synth, { label: "7/4 + 16/9 (septimal-comma beat)" })}

```ts
const beatHz = (() => {
  const baseHz = 440; // matches playDyad's default (D-08)
  const fHarmonic7 = baseHz * Number(harmonicSeventh.fraction.valueOf()); // 770 Hz
  const fPythagSeventh = baseHz * Number(pythagoreanMinorSeventh.fraction.valueOf()); // 782.222… Hz
  return Math.abs(fPythagSeventh - fHarmonic7); // 12.222… Hz
})();
```

Beat frequency at A = 440 Hz: ${beatHz.toFixed(3)} Hz. The harmonic 7th lands
at 770 Hz and the Pythagorean minor 7th at 782.222 Hz; their near-coincident
upper partials fall in and out of phase at that rate. The septimal comma's
~27.264¢ size, scaled to this anchor, is exactly this audible Hz signature —
roughly twice as fast as the syntonic comma's beat at the same reference,
matching the comma's roughly-twice-as-large cents value.

On a shared cents axis the two pitches are unmistakably distinct — and the gap between them is exactly one septimal comma:

```ts
const partialsChart = (() => {
  const data = [
    { name: "partial 7 (7/4)", cents: harmonicSeventh.cents, group: "harmonic" },
    { name: "two 4/3s (16/9)", cents: pythagoreanMinorSeventh.cents, group: "pythagorean" },
  ];
  const midCents = (harmonicSeventh.cents + pythagoreanMinorSeventh.cents) / 2;
  return Plot.plot({
    width: 640,
    height: 170,
    marginLeft: 50,
    marginRight: 50,
    marginTop: 50,
    marginBottom: 50,
    x: {
      label: "Cents",
      domain: [955, 1010],
      grid: true,
      tickFormat: (v) => `${v}¢`,
    },
    y: { axis: null, domain: [-1, 1] },
    marks: [
      Plot.ruleX([harmonicSeventh.cents, pythagoreanMinorSeventh.cents], {
        stroke: "#888",
        strokeDasharray: "2,2",
      }),
      Plot.dot(data, {
        x: "cents",
        y: 0,
        r: 7,
        fill: (d) => (d.group === "harmonic" ? "#4269d0" : "#ef8e3a"),
        stroke: "currentColor",
        strokeWidth: 1,
      }),
      Plot.text(data, {
        x: "cents",
        y: 0,
        text: "name",
        dy: -28,
        fontSize: 12,
        fill: "currentColor",
      }),
      Plot.text(data, {
        x: "cents",
        y: 0,
        text: (d) => `${d.cents.toFixed(2)}¢`,
        dy: -14,
        fontSize: 11,
        fill: "currentColor",
      }),
      Plot.text([{ x: midCents }], {
        x: "x",
        y: 0.55,
        text: () => `↔ ${septimal.cents.toFixed(2)}¢ (64/63)`,
        fontSize: 12,
        fill: "#c45656",
      }),
    ],
  });
})();
display(partialsChart);
```

## In monzos

${tex`64/63 = \begin{bmatrix} 6 & -2 & 0 & -1 \end{bmatrix}\rangle = 2^{6} \cdot 3^{-2} \cdot 5^{0} \cdot 7^{-1}`}

The prime-7 column is the giveaway — this is the first comma in the standard set where
7 appears, which is exactly why it marks the doorway from 5-limit to 7-limit JI. The
64 = 2^6 and the 63 = 9 × 7 = 3^2 × 7 line up cleanly with the monzo.

> **Tempered out by.** 22-EDO and Superpyth temperament (a.k.a. "archy"
> in the 2.3.7 subgroup) — the four-fifths-up dominant seventh IS the
> harmonic 7th. The Dominant temperament (the 7-limit extension supported
> by 12-EDO, where 16/9 = 7/4) also vanishes 64/63. By contrast, standard
> septimal meantone (huygens / 31-EDO) is built to *preserve* the 64/63
> distinction — 7/4 and 16/9 land on adjacent steps.

## See also

The [syntonic comma](/pages/syntonic-comma) is the 5-limit analog — the gap between
Pythagorean and 5-limit major thirds. The [Pythagorean comma](/pages/pythagorean-comma)
is the 3-limit closure gap — the overshoot of twelve pure fifths past seven octaves.
The dashboard at [/](/) lets you build a JI scale containing `7/4` and audition it
against the drone — the septimal-comma beating becomes audible immediately when the
harmonic 7th is sounded against a Pythagorean minor 7th in the same scale.

## Further reading

- [64/63 on the Xenharmonic Wiki](https://en.xen.wiki/w/64/63) —
  community-curated reference for the septimal comma (Archytas's
  comma), covering its role as the defining 7-limit superparticular
  separating 9/8 and 8/7, the family of temperaments that vanish it
  (Superpyth in 22-EDO, Dominant in 12-EDO, the broader Archytas clan),
  and the chain of 7-limit relations it collapses (7/4 ↔ 16/9, 9/7 ↔
  four-fifths-up, 9/8 ↔ 8/7).

- [Archytas clan on the Xenharmonic Wiki](https://en.xen.wiki/w/Archytas_clan) —
  the temperament family built by tempering out 64/63 in 7-limit
  contexts; covers Archytas / Superpyth / Pajara / Dominant and their
  characteristic equivalence of two fifths octave-reduced with a whole
  tone that is both 8/7 and 9/8.

- Andrew Barker, *Greek Musical Writings, Vol. II: Harmonic and Acoustic
  Theory* (Cambridge University Press, 1989) — scholarly source for
  Archytas of Tarentum's three tetrachords (enharmonic 28:27:36:35:5:4,
  chromatic 28:27:243:224:32:27, diatonic 28:27:8:7:9:8): the historical
  entry point of prime 7 and the 28/27 / 64/63 family into Greek music
  theory in the 4th century BCE.
