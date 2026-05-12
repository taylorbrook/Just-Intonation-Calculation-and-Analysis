# Prime-limits

Classifying JI ratios by the largest prime they require

```ts
import { Interval } from "../lib/interval.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
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
// Example intervals declared up front so prose, ratio-pills, and play buttons
// all reference the same Interval instances. Strings into new Interval(...)
// exercise the BigInt Fraction path (R-01 — no float-as-source-of-truth).
const fifth = new Interval("3/2"); //                       3-limit: just perfect fifth
const ninthEight = new Interval("9/8"); //                  3-limit: Pythagorean major second (3 × 3 / 2 × 2 × 2)
const majorThird = new Interval("5/4"); //                  5-limit: just major third
const harmonicSeventh = new Interval("7/4"); //             7-limit: harmonic seventh
const undecimal = new Interval("11/8"); //                  11-limit: undecimal semi-augmented fourth
```

The **prime-limit** of a JI ratio is the **largest prime that appears with a
non-zero exponent in its monzo**. A scale is *p-limit* when every interval in
it is p-limit or lower. This is the cleanest way to classify a JI system — it
asks a single question: *which primes does the scale actually use?*

In monzo form (see [Monzos](/pages/monzos) for the notation), the limit is just
the index of the rightmost non-zero entry — counting the primes
${tex`2, 3, 5, 7, 11, 13, \ldots`} from left to right:

${tex`\text{p-limit}\!\left(\,2^{a_2}\cdot 3^{a_3}\cdot 5^{a_5}\cdot 7^{a_7}\cdot 11^{a_{11}}\cdots\right) \;=\; \max\,\{\,p\;:\;a_p \neq 0\,\}`}

Every step up — 3 → 5 → 7 → 11 — opens a new dimension in the monzo lattice
and a new family of intervals that don't exist below it. The four sections
below walk that ladder, with a play button at every rung.

## 3-limit (Pythagorean)

3-limit ratios use only the primes 2 and 3. That gives you octaves
(${ratioPill(new Interval("2/1"))}), the just perfect fifth, and everything
you can build by stacking fifths and reducing back into an octave. This is
**Pythagorean tuning** — the oldest JI system in the Western canon.

- ${playInterval(fifth, synth, { label: true })} sounds the just perfect fifth — pure
  beat-free harmony. Its monzo is ${tex`\begin{bmatrix} -1 & 1 \end{bmatrix}\rangle = 2^{-1} \cdot 3^{1}`}.
- ${playInterval(ninthEight, synth, { label: true })} sounds the Pythagorean major second — two
  stacked fifths reduced down an octave. Its monzo is
  ${tex`\begin{bmatrix} -3 & 2 \end{bmatrix}\rangle = 2^{-3} \cdot 3^{2}`}. The
  rightmost non-zero entry is on prime 3, so the limit is 3.

Climb high enough on the fifths-stack and you arrive at the
[Pythagorean comma](/pages/pythagorean-comma) — the gap by which twelve pure
fifths overshoot seven octaves. That comma is itself 3-limit; its monzo
${tex`\begin{bmatrix} -19 & 12 \end{bmatrix}\rangle`} contains only the primes
2 and 3.

## 5-limit

Adding prime 5 unlocks the just major third ${tex`5/4`} and, with it, the
**just major triad** ${tex`4 : 5 : 6`} — the harmonic-series partials 4, 5, 6
played together. Reducing each into a single octave gives
${tex`1 : \tfrac{5}{4} : \tfrac{3}{2}`}.

- ${playInterval(new Interval("1/1"), synth, { label: true })} sounds the root (${ratioPill(new Interval("1/1"))}).
- ${playInterval(majorThird, synth, { label: true })} sounds the just major third — the new 5-limit interval.
  Its monzo is ${tex`\begin{bmatrix} -2 & 0 & 1 \end{bmatrix}\rangle = 2^{-2} \cdot 5^{1}`};
  the rightmost non-zero entry is on prime 5, so the limit is 5.
- ${playInterval(fifth, synth, { label: true })} sounds the perfect fifth again (still 3-limit — limits stack downward).

A/B the 5-limit major third ${ratioPill(majorThird)} against the Pythagorean
major third ${ratioPill(new Interval("81/64"))} (four stacked fifths, reduced
two octaves) and you'll hear the [syntonic comma](/pages/syntonic-comma) —
${tex`\tfrac{81}{80}`} — emerge as a beat-rate. That comma is the canonical
5-limit closure gap, and its monzo
${tex`\begin{bmatrix} -4 & 4 & -1 \end{bmatrix}\rangle`} confirms it: primes 2,
3, 5, with prime-5 forcing the classification.

## 7-limit

Prime 7 brings in the **harmonic seventh** ${tex`7/4`} — partial 7 of the
harmonic series, the "natural" minor seventh that sounds noticeably flatter
(and smoother) than the 12-TET minor seventh.

- ${playInterval(harmonicSeventh, synth, { label: true })} sounds the harmonic seventh. Its monzo is
  ${tex`\begin{bmatrix} -2 & 0 & 0 & 1 \end{bmatrix}\rangle = 2^{-2} \cdot 7^{1}`};
  the rightmost non-zero entry is on prime 7, so the limit is 7.

The 7-limit dominant tetrad ${tex`4 : 5 : 6 : 7`} (audible on
[Otonality & utonality](/pages/otonality-utonality)) is the canonical
7-limit chord — a dominant-seventh-flavoured sonority that doesn't exist
in 5-limit JI at all. The closure gap between the harmonic seventh and the
Pythagorean minor seventh is the [septimal comma](/pages/septimal-comma)
${tex`\tfrac{64}{63}`}, which is precisely *7-limit's entry-point comma*.

## 11-limit

Prime 11 brings in intervals with no 5- or 7-limit equivalent — they sit
between the familiar diatonic positions. The undecimal semi-augmented fourth
${tex`11/8`} lands almost exactly halfway between the just perfect fourth
${tex`4/3`} and the tritone ${tex`45/32`} — about 49¢ flat of the 12-TET
tritone. It's not an "out-of-tune" version of a familiar interval; it's a
new pitch class.

- ${playInterval(undecimal, synth, { label: true })} sounds the undecimal semi-augmented fourth.
  Its monzo is ${tex`\begin{bmatrix} -3 & 0 & 0 & 0 & 1 \end{bmatrix}\rangle = 2^{-3} \cdot 11^{1}`};
  the rightmost non-zero entry is on prime 11, so the limit is 11.

11-limit is the threshold beyond which most Western listeners need
acclimatization — Harry Partch's 43-tone system uses 11-limit; La Monte Young's
*The Well-Tuned Piano* uses 7-limit (no 11s). The harmonic-series page's
table at partial 11 shows the 12-TET deviation: −48.7¢, dead in the middle.

## Limits in the kernel

Open `src/lib/commas.ts` and you'll see the named-comma table already
grouped by prime-limit — section comments mark the boundaries:

```ts
// 5-limit
{ name: "syntonic comma", monzo: [-4, 4, -1] }, //          81/80
// ...
// 7-limit
{ name: "septimal comma", monzo: [6, -2, 0, -1] }, //       64/63
// ...
// 11-limit
{ name: "rastma", monzo: [-1, 5, 0, 0, -2] }, //            243/242
{ name: "undecimal comma", monzo: [-5, 1, 0, 0, 1] }, //    33/32
```

The grouping is exact: every monzo under `// 5-limit` has its rightmost
non-zero entry at index ≤ 2 (prime 5); every `// 7-limit` monzo at index
≤ 3 (prime 7); every `// 11-limit` monzo at index ≤ 4 (prime 11).
Commas are closure gaps — places where two ways of reaching the same
scale degree diverge — so a comma's prime-limit is *the smallest p-limit
JI system that can express that gap at all*.

## See also

The [harmonic series](/pages/harmonic-series) is the prerequisite — every
prime ${tex`p`} enters JI as partial ${tex`p`} of a vibrating string. The
prime-limit ladder is just the choice of how high up that partial stack
you let your scale go.

The [odd-limit](/pages/odd-limits) classification is Partch's parallel —
instead of asking "what's the largest *prime* used", it asks "what's the
largest *odd factor* used in numerator or denominator". Odd-limit treats
9 and 15 as their own classes (composite odds), where prime-limit folds
them into the 3- and 5-limit. The two limits answer different questions
and both are useful.

The [septimal comma](/pages/septimal-comma) is the textbook example of a
prime-limit closure gap: 7-limit's smallest "where pure-stacking diverges
from the new harmonic". Every step up the prime ladder has its own
characteristic closure-gap comma; `commas.ts` is the catalog.
