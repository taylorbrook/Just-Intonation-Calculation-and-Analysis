# Monzos

Prime-factor vectors — JI's canonical coordinate system

```ts
import { Interval } from "../lib/interval.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import * as Plot from "npm:@observablehq/plot";
import { monzoBuilder } from "../components/monzo-builder.js";
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

```ts
// The four worked examples used throughout the page. Built from string ratios so the
// BigInt Fraction path is exercised end-to-end (R-01 — no float-as-source-of-truth).
const fifth = new Interval("3/2"); //                  perfect fifth (5-limit-friendly, but lives in the 3-limit)
const majorThird = new Interval("5/4"); //             5-limit major third
const syntonic = new Interval("81/80"); //             syntonic comma (5-limit)
const septimalSubminorThird = new Interval("7/6"); //  7-limit subminor third
```

A **monzo** is a vector of integer exponents over the primes
${tex`2,\ 3,\ 5,\ 7,\ 11,\ \ldots`}. Reading a monzo
${tex`\begin{bmatrix} a & b & c & d \end{bmatrix}\rangle`} as a ratio is just
the prime-power product:

${tex`\begin{bmatrix} a & b & c & d \end{bmatrix}\rangle = 2^{a} \cdot 3^{b} \cdot 5^{c} \cdot 7^{d}`}

Three things make monzos the right coordinate system for this notebook. First,
**equality is exact** — two monzos describe the same ratio iff their entries agree,
no float drift, no rounding (R-01 / Pitfall #1). Second, **prime-limit is just the
last nonzero index** — a length-3 monzo lives in 5-limit, length-4 puts you in
7-limit, and so on. Third — and this is the killer feature, deferred to §
[Monzo addition](#monzo-addition-ratio-multiplication) below — **multiplying ratios
is the same as adding monzos component-wise**.

Throughout this notebook, the rendered bra-ket form
${tex`\begin{bmatrix} \cdots \end{bmatrix}\rangle`} is the canonical display for a
monzo. Internally, the kernel stores ratios as BigInt-backed `Fraction`s and computes
the monzo on demand via the `Interval.monzo` getter; the inverse direction is
`Interval.fromMonzo([...])`. The two are exact inverses.

## Worked examples

The **perfect fifth** ${ratioPill(fifth)} ${playInterval(fifth, synth, { label: true })}:

${tex`3/2 = \begin{bmatrix} -1 & 1 \end{bmatrix}\rangle = 2^{-1} \cdot 3^{1}`}

One step up the 3-prime axis, one step down the 2-prime axis — a single pure
fifth. The monzo lives in 3-limit because the 5-prime column (and beyond) is zero.

The **5-limit major third** ${ratioPill(majorThird)} ${playInterval(majorThird, synth, { label: true })}:

${tex`5/4 = \begin{bmatrix} -2 & 0 & 1 \end{bmatrix}\rangle = 2^{-2} \cdot 3^{0} \cdot 5^{1}`}

The 5-prime column is now nonzero, so this is a genuinely 5-limit interval. Notice
that the 3-prime entry is zero — the 5-limit major third has no Pythagorean
component, which is the whole reason it differs from `81/64` by a syntonic comma.

The **syntonic comma** ${ratioPill(syntonic)} ${playInterval(syntonic, synth, { label: true })}:

${tex`81/80 = \begin{bmatrix} -4 & 4 & -1 \end{bmatrix}\rangle = 2^{-4} \cdot 3^{4} \cdot 5^{-1}`}

The four 3's of the Pythagorean stacking + the −1 5-power = exactly the comma's
"cost" of choosing pure 3-limit thirds over pure 5-limit thirds. (See
[the syntonic comma](/pages/syntonic-comma) for the full worked story.)

The **7-limit subminor third** ${ratioPill(septimalSubminorThird)} ${playInterval(septimalSubminorThird, synth, { label: true })}:

${tex`7/6 = \begin{bmatrix} -1 & -1 & 0 & 1 \end{bmatrix}\rangle = 2^{-1} \cdot 3^{-1} \cdot 5^{0} \cdot 7^{1}`}

The first nonzero 7-prime entry pushes this interval into 7-limit. The negative
3-prime exponent is doing real work — there's a factor of 3 in the *denominator*
(6 = 2 · 3).

## Monzo builder

Build any prime-2/3/5/7/11 monzo by hand. The inputs and the ratio field stay
synced; the bra-ket form, the ratio, the cents value, and the ▶ button update
on every keystroke.

```ts
display(monzoBuilder(synth));
```

Ratios that include primes above 11 (for example `13/12`) surface an inline
error rather than silently truncating — the builder enforces a 5-coordinate
ceiling that matches the input grid.

## Worked examples — projected to the 3-5 plane

Each worked example carries five-or-fewer nonzero prime coordinates, but two of
them — the 3- and 5-prime exponents — already tell most of the story. Plotting
just those two coordinates gives a flat picture of where each interval sits in
the 5-limit slice of monzo space. Notice that ${tex`3/2`} and ${tex`7/6`} both
land at ${tex`(-1, 0)`} on this plane — they differ only in their 7-prime
coordinate, which this projection collapses to zero. The overlap is real, not a
rendering bug.

```ts
// 2D projection of the four worked examples onto the (prime-3, prime-5) plane.
// p3, p5 are pulled directly from the existing Interval bindings via iv.monzo[1]
// and iv.monzo[2] — no hardcoded coordinate literals (kernel stays the source of
// truth; Pitfall #1).
const scatterData = [
  { ratio: "3/2", p3: fifth.monzo[1] ?? 0, p5: fifth.monzo[2] ?? 0 },
  { ratio: "5/4", p3: majorThird.monzo[1] ?? 0, p5: majorThird.monzo[2] ?? 0 },
  { ratio: "81/80", p3: syntonic.monzo[1] ?? 0, p5: syntonic.monzo[2] ?? 0 },
  { ratio: "7/6", p3: septimalSubminorThird.monzo[1] ?? 0, p5: septimalSubminorThird.monzo[2] ?? 0 },
];
const monzoScatter = Plot.plot({
  width: 480,
  height: 360,
  marginLeft: 60,
  marginRight: 40,
  marginBottom: 50,
  x: { label: "Prime-3 exponent", grid: true, domain: [-5, 5] },
  y: { label: "Prime-5 exponent", grid: true, domain: [-2, 2] },
  marks: [
    Plot.ruleX([0], { stroke: "#888", strokeDasharray: "2,3" }),
    Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
    Plot.dot(scatterData, { x: "p3", y: "p5", fill: "#4269d0", r: 5 }),
    Plot.text(scatterData, {
      x: "p3",
      y: "p5",
      text: "ratio",
      dx: 8,
      dy: -4,
      textAnchor: "start",
      fontSize: 12,
      fill: "currentColor",
    }),
  ],
});
display(monzoScatter);
```

```ts
// Round-trip check: every worked example survives Interval → monzo → Interval.
// If any of these `ok` flags is false, the page is lying — surface it immediately
// rather than letting the prose drift away from kernel reality.
const roundTrip = [fifth, majorThird, syntonic, septimalSubminorThird].map((iv) => ({
  ratio: iv.toString(),
  monzo: iv.monzo,
  recovered: Interval.fromMonzo(iv.monzo).toString(),
  ok: Interval.fromMonzo(iv.monzo).equals(iv),
}));
display(roundTrip);
```

Expand the array above to inspect each row: the original ratio, the kernel-computed
monzo, the ratio recovered via `Interval.fromMonzo(monzo)`, and the equality flag.
All four should read `ok: true`.

## Monzo addition = ratio multiplication

The reason monzos are worth carrying around: **multiplying two ratios is the same
as adding their monzos component-wise**. Stacking intervals becomes vector addition.

Take the fifth and the major third — together they stack to ${tex`15/8`}, the
classical major seventh:

${tex`\frac{3}{2} \cdot \frac{5}{4} = \frac{15}{8}, \qquad \begin{bmatrix} -1 & 1 & 0 \end{bmatrix}\rangle + \begin{bmatrix} -2 & 0 & 1 \end{bmatrix}\rangle = \begin{bmatrix} -3 & 1 & 1 \end{bmatrix}\rangle`}

(The fifth's monzo `[-1, 1]` is padded with a trailing zero so the two vectors
have matching length before adding.) Recovering ${tex`2^{-3} \cdot 3^{1} \cdot 5^{1} = 15/8`}
confirms it.

```ts
// Cross-check: kernel multiplication and component-wise monzo addition must agree.
// fifth.monzo has length 2 ([-1, 1]); majorThird.monzo has length 3 ([-2, 0, 1]).
// Pad the shorter monzo with zeros before adding so the two vectors line up.
const product = fifth.mul(majorThird); //                                  15/8 via fraction.js BigInt math
const maxLen = Math.max(fifth.monzo.length, majorThird.monzo.length);
const summedMonzo = Array.from(
  { length: maxLen },
  (_, i) => (fifth.monzo[i] ?? 0) + (majorThird.monzo[i] ?? 0),
);
const recovered = Interval.fromMonzo(summedMonzo);
display({
  product: product.toString(), //                                          "15/8"
  summedMonzo, //                                                          [-3, 1, 1]
  recovered: recovered.toString(), //                                      "15/8"
  agree: product.equals(recovered), //                                     true
});
```

`agree: true` is the proof: the kernel's BigInt-Fraction multiplication and the
hand-built monzo addition land on the same interval. This is the property that
makes monzo arithmetic safe — once a ratio is a monzo, everything downstream
(scale construction, comma analysis, lattice projection) becomes integer vector
algebra.

## See also

The dashboard at [/](/) shows a **2D projection of monzo-space** — its lattice
visualization plots the 3-prime axis horizontally and the 5-prime axis diagonally,
so points whose monzos differ only in those two columns sit on a regular grid.
Once you have a monzo, finding its place on the lattice is just reading off the
3- and 5-coordinates.

The [syntonic comma](/pages/syntonic-comma) page is the concrete worked-out 5-limit
example — its "In monzos" section reads naturally from here, since you can now see
that ${tex`\begin{bmatrix} -4 & 4 & -1 \end{bmatrix}\rangle`} is just a vector
that happens to spell out the gap between two ways of building a major third.

## Further reading

```js
furtherReading([
  {
    title: "Monzo on the Xenharmonic Wiki",
    url: "https://en.xen.wiki/w/Monzo",
    note: "community-curated reference for the prime-factor vector notation. Covers the bra-ket form, monzo arithmetic, prime limits, and the relationship to vals (the dual lattice used in regular-temperament theory)."
  },
  {
    title: "David B. Doty — The Just Intonation Primer (3rd ed., Just Intonation Network, 2002)",
    url: "https://www.justintonation.net/primer.html",
    note: "the canonical practitioner's introduction to JI. Doty's chapter on the harmonic lattice walks the prime-factor framing — what monzos describe in compact form — and the book is the standard English-language entry point into the xenharmonic-devs community's working vocabulary."
  }
])
```
