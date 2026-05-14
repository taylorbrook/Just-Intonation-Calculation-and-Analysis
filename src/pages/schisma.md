# The schisma

32805/32768 — the gap between the Pythagorean and syntonic commas, at the threshold of audibility

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
<a href="./pythagorean-comma">the Pythagorean comma</a>, <a href="./syntonic-comma">the syntonic comma</a>
</aside>

```ts
// commaByName returns Interval | undefined. The "schisma", "syntonic comma", and
// "Pythagorean comma" keys are hand-verified in src/lib/commas.ts (Plan 02), so the
// lookups are total at construction time; we assert non-null with `!` and let
// strict-TS keep us honest if the table ever drifts.
const schisma = commaByName("schisma")!; //                 32805/32768
const syntonic = commaByName("syntonic comma")!; //         81/80
const pythagorean = commaByName("Pythagorean comma")!; //   531441/524288
// Schismatic temperament identifies these two thirds (1 schisma apart):
// - schismaticThird = (3/2)^-8 reduced up by 5 octaves = (4/3)^8 / 2^3 ≈ 384.36¢
// - fiveLimitThird = pure 5-limit major third = 5/4 ≈ 386.31¢
// Difference: 386.31 − 384.36 = 1.95¢ = one schisma. BigInt-Fraction is the
// source of truth; .cents is the display projection only (Pitfall #1).
const schismaticThird = new Interval("8192/6561");
const fiveLimitThird = new Interval("5/4");
```

The **schisma** is ${tex`\frac{32805}{32768} \approx 1.95\text{¢}`}, the difference
between the Pythagorean comma (${ratioPill(pythagorean)}) and the syntonic comma
(${ratioPill(syntonic)}). Subtracting the narrower from the wider leaves the schisma
exactly: ${tex`\frac{531441/524288}{81/80} = \frac{32805}{32768}`}. At roughly two
cents it sits right at the just-noticeable-difference for pitch in slow contexts
(Plomp and Levelt 1965; Sethares 2005, §1.1) — audible as a beat-rate against a
sustained reference, often inaudible as a melodic step.

Audition the size gradient, wide to narrow:

- ${playInterval(pythagorean, synth, { label: true })} sounds the Pythagorean comma (~23.460¢) — the wider of the two parent commas; clearly audible as a microtonal step.
- ${playInterval(syntonic, synth, { label: true })} sounds the syntonic comma (~21.506¢) — about 2¢ narrower than the Pythagorean.
- ${playInterval(schisma, synth, { label: true })} sounds the schisma itself (~1.954¢) — the residue. Right at the threshold of audibility; you may hear it as a faint beating rather than a definite pitch.

## The three commas at scale

The bar chart below plots all three commas on a shared cents axis. The
Pythagorean and syntonic commas are within ~2¢ of each other — the chart
makes their near-equality visible. The schisma — the gap *between* them —
sits roughly an order of magnitude shorter, right at the just-noticeable
difference for pitch. Cents values are read from the existing `Interval`
bindings (the BigInt fraction is the source of truth; `.cents` is taken
once per row at the data-construction boundary).

```ts
const commaBarChart = (() => {
  const data = [
    { name: "Pythagorean", cents: pythagorean.cents }, // ≈ 23.4600
    { name: "syntonic",    cents: syntonic.cents },    // ≈ 21.5063
    { name: "schisma",     cents: schisma.cents },     // ≈  1.9537
  ];
  return Plot.plot({
    width: 640,
    height: 200,
    marginLeft: 110,
    marginRight: 70,
    marginBottom: 50,
    x: {
      label: "Cents",
      domain: [0, 26],
      grid: true,
      tickFormat: (v) => `${v}¢`,
    },
    y: {
      label: null,
      domain: ["Pythagorean", "syntonic", "schisma"], // wide → narrow
    },
    marks: [
      Plot.barX(data, {
        x: "cents",
        y: "name",
        fill: (d) => (d.name === "schisma" ? "#c45656" : "#4269d0"),
      }),
      Plot.text(data, {
        x: "cents",
        y: "name",
        text: (d) => `${d.cents.toFixed(2)}¢`,
        dx: 6,
        textAnchor: "start",
        fontSize: 12,
        fill: "currentColor",
      }),
      Plot.ruleX([0]),
    ],
  });
})();
display(commaBarChart);
```

Click any comma to hear it.

```ts
// Ratio-pills row keyed to the bar chart above. One pair per plotted comma:
// ratioPill (with cents shown by default) + bare ▶ playInterval. Plot.barX is
// not clickable in Observable Plot, so the audition surface lives here.
// XSS discipline T-02-22/T-02-23: createElement + appendChild only for
// wrappers; ratioPill / playInterval factories handle dynamic strings via
// textContent. Per D-08 / D-18, playInterval defaults intact: 440 Hz, 1.5s.
// Reuses the existing pythagorean / syntonic / schisma Interval bindings —
// no new allocations, BigInt-Fraction stays source of truth (Pitfall #1).
const commaPillsRow = (() => {
  const container = document.createElement("div");
  container.className = "ratio-pills-row";
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.gap = "0.5rem";
  container.style.alignItems = "center";
  container.style.margin = "0.5rem 0 1rem 0";
  const entries = [
    { label: "Pythagorean comma", iv: pythagorean },
    { label: "syntonic comma",    iv: syntonic },
    { label: "schisma",           iv: schisma },
  ];
  for (const { iv } of entries) {
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
display(commaPillsRow);
```

## Schismatic temperament

Tempering out the schisma — treating ${ratioPill(schisma)} as a unison —
yields *schismatic temperament*, which identifies a stack of eight pure
fifths (octave-reduced) with a 5-limit major third. The
**Pythagorean diminished fourth** ${ratioPill(schismaticThird)} — eight pure
fifths *below* the tonic, raised by five octaves; equivalently
${tex`(4/3)^{8}/2^{3}`} — sits at ${tex`\approx 384.36\text{¢}`}, exactly
one schisma flat of the just major third ${ratioPill(fiveLimitThird)}
(${tex`\approx 386.31\text{¢}`}) (Helmholtz 1885, 433). Helmholtz exploited
this (Helmholtz 1885, pt. III §XVI / App. XX): narrow each of the eight
fifths by ${tex`1.95/8 \approx 0.24\text{¢}`} and the chain lands on a pure
${tex`5/4`} — a near-Pythagorean tuning with usable 5-limit thirds, at the
cost of slightly detuned fifths (701.711¢ instead of 701.955¢).

Sound the two thirds together to hear the schisma directly:

${playDyad(schismaticThird, fiveLimitThird, synth, { label: "8192/6561 + 5/4 (schisma beat)" })}

Against the dyad you should hear a slow ~2 Hz beating riding on top of the
major-third chord — that's the schisma. The two pitches are within the
just-noticeable difference for melodic pitch (~5¢ in slow contexts; Plomp and
Levelt 1965), yet the difference IS audible when both are sustained
simultaneously, because the ear locks onto the beat-rate of their shared
partials.

## In monzos

${tex`32805/32768 = \begin{bmatrix} -15 & 8 & 1 \end{bmatrix}\rangle = 2^{-15} \cdot 3^{8} \cdot 5^{1}`}

The prime-3 column (8) and prime-5 column (1) together encode the reconciliation
of the Pythagorean stack with a 5-limit third. Subtract the syntonic monzo
${tex`\begin{bmatrix} -4 & 4 & -1 \end{bmatrix}\rangle`} from the Pythagorean monzo
${tex`\begin{bmatrix} -19 & 12 & 0 \end{bmatrix}\rangle`} and the schisma's monzo
${tex`\begin{bmatrix} -15 & 8 & 1 \end{bmatrix}\rangle`} falls out exactly.

> **Tempered out by.** Schismatic temperament (Helmholtz / Groven /
> **Sábat-Garibaldi** — narrow each fifth by ~0.244¢ so a chain of eight
> fifths lands on a pure 5/4), 53-EDO, and 41-EDO. The "Garibaldi" here
> is Eduardo Sábat-Garibaldi (late 20th c., developer of the 53-tone
> dinarra), not Giuseppe Garibaldi (Xen Wiki, "Garibaldi"). These
> mappings identify 8192/6561 with 5/4 — the Pythagorean diminished
> fourth and the 5-limit major third collapse onto the same scale
> degree, and the ~1.954¢ schisma vanishes from the system.

## See also

The [syntonic comma](/pages/syntonic-comma) note covers the 5-limit closure gap —
the difference between Pythagorean and 5-limit major thirds. The
[Pythagorean comma](/pages/pythagorean-comma) note covers the 3-limit closure gap —
the overshoot of twelve pure fifths past seven octaves. The dashboard at [/](/)
lets you build any JI scale containing these commas and audition it against a drone.

## Further reading

- [Schisma on the Xenharmonic Wiki](https://en.xen.wiki/w/Schisma) —
  community-curated reference for ${tex`32805/32768`} and its role as the
  difference between the Pythagorean and syntonic commas. Covers the
  family of *schismatic temperaments* built by tempering it to a unison
  (Helmholtz, Groven, Sábat-Garibaldi), related commas (kleisma,
  diaschisma, Mercator's comma), and the precise mappings that put the
  schisma at the edge of the audible while making it musically
  consequential.

- [Helmholtz, *Die Lehre von den Tonempfindungen* / *On the Sensations of
  Tone* (IMSLP)](https://imslp.org/wiki/Die_Lehre_von_den_Tonempfindungen_(Helmholtz,_Hermann_von)) —
  the 1863 founding text of psychoacoustics, including Helmholtz's own
  treatment of the schisma and the schismic temperament that bears his
  name (the narrow-by-0.244¢ fifth recipe described above). The Alexander
  Ellis 1875 English translation, *On the Sensations of Tone as a
  Physiological Basis for the Theory of Music*, is hosted on the same
  IMSLP page and is in the public domain.

## Sources

- Helmholtz, Hermann von. 1885. *On the Sensations of Tone as a Physiological Basis for the Theory of Music*. Translated and edited by Alexander J. Ellis. 2nd English ed. London: Longmans, Green, and Co.
- Huygens-Fokker Foundation. n.d. "List of intervals." Accessed 2026-05-13. https://www.huygens-fokker.org/docs/intervals.html.
- Plomp, Reinier, and Willem J. M. Levelt. 1965. "Tonal Consonance and Critical Bandwidth." *Journal of the Acoustical Society of America* 38 (4): 548–560. https://doi.org/10.1121/1.1909741.
- Sethares, William A. 2005. *Tuning, Timbre, Spectrum, Scale*. 2nd ed. London: Springer-Verlag.
- Xenharmonic Wiki. n.d. "53edo." Accessed 2026-05-13. https://en.xen.wiki/w/53edo.
- Xenharmonic Wiki. n.d. "Garibaldi." Accessed 2026-05-13. https://en.xen.wiki/w/Garibaldi.
- Xenharmonic Wiki. n.d. "Schisma." Accessed 2026-05-13. https://en.xen.wiki/w/Schisma.
- Xenharmonic Wiki. n.d. "Schismatic family." Accessed 2026-05-13. https://en.xen.wiki/w/Schismatic_family.
