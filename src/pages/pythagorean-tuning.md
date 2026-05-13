# Pythagorean tuning

Twelve pure fifths, one wolf — why a 3-limit cycle of fifths doesn't close into an octave.

```ts
import { Interval } from "../lib/interval.js";
import { Scale } from "../lib/scale.js";
import { createSynth } from "../audio/synth.js";
import { scaleTable } from "../components/scale-table.js";
import { playInterval } from "../components/play-interval.js";
import { ratioPill } from "../components/ratio-pill.js";
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
<a href="./pythagorean-comma">the Pythagorean comma</a>, <a href="./harmonic-series">the harmonic series</a>
</aside>

```ts
// Stack n pure fifths (3/2) from 1/1, octave-reducing each step into [1, 2),
// sort ascending by cents (display ordering is fine here per Pitfall #1: the
// BigInt Fraction inside Interval remains the source of truth for arithmetic),
// and append 2/1 as the period (D-14: last interval = period).
//
// For n = 12 this yields the classic Pythagorean 12-tone scale:
//   1/1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2/1
//
// The chain does NOT close — see the wolf-5th cell below. Closing the 12th
// fifth requires shrinking it by exactly one Pythagorean comma (~23.46¢).
const chainOfFifths = (n) => {
  const fifth = new Interval("3/2");
  const intervals = [new Interval("1/1")];
  let acc = new Interval("1/1");
  for (let k = 1; k < n; k++) {
    acc = acc.mul(fifth).octaveReduce();
    intervals.push(acc);
  }
  intervals.sort((a, b) => a.cents - b.cents);
  intervals.push(new Interval("2/1")); // period (D-14)
  return new Scale(intervals, new Interval("2/1"));
};

const pythagorean12 = chainOfFifths(12);
```

```ts
// The "wolf 5th" is the interval needed to close the 12-tone cycle after eleven
// pure 3/2 fifths have been laid down. After octave-reducing 12 pure fifths,
// the top of the chain (A♯ at (3/2)^11, octave-reduced) sits just BELOW C′ +
// one Pythagorean comma. The 12th interval that completes the 7-octave cycle
// is therefore ~678.49¢, not the pure 701.96¢ — narrower by one Pythagorean
// comma (531441/524288 ≈ 23.46¢).
//
// Constructive derivation:
//   wolf = (2/1)^7 / (3/2)^11
//        = 2^7 / (3^11 / 2^11)
//        = 2^18 / 3^11
//        = 262144 / 177147
//        ≈ 678.49¢
//
// This is the diminished sixth that conventionally lives between G♯ and E♭
// in the historical 12-note Pythagorean tuning. It is a 3-limit ratio (monzo
// [18, -11]) — equal in magnitude to a pure fifth minus the Pythagorean comma.
const pureFifth = new Interval("3/2");
const wolfFifth = new Interval("262144/177147");
```

```ts
const playPure = playInterval(pureFifth, synth, { label: true });
const playWolf = playInterval(wolfFifth, synth, { label: true });
```

Stack twelve pure fifths from ${tex`1/1`} and you have a recipe for a 12-note
scale: each fifth lands on a fresh pitch class, and octave-reducing each step
into ${tex`[1, 2)`} builds the classic Pythagorean diatonic. But the chain
does not close. After eleven pure 3/2 fifths the chain reaches a pitch that
sits one [Pythagorean comma](/pages/pythagorean-comma)
(${tex`531441/524288 \approx 23.46\text{¢}`}) BELOW where a closing fifth needs
to land — so the 12th "fifth" is forced to shrink by exactly that comma. That
narrowed interval is the **wolf**.

## The chain

Twelve pure fifths reach ${tex`(3/2)^{12} = 531441/4096 \approx 7\text{ octaves} + 23.46\text{¢}`}
— sharp by one Pythagorean comma. Closing the cycle forces the 12th interval
down by that comma:

${tex`\frac{(2/1)^7}{(3/2)^{11}} = \frac{2^{18}}{3^{11}} = \frac{262144}{177147} \approx 678.49\text{¢}`}

Equivalently: ${tex`701.96 - 23.46 = 678.50`} cents.

## The 12-note scale

Octave-reducing each step of the chain and sorting ascending yields thirteen
rows — twelve unique pitches plus the ${tex`2/1`} period
(${tex`1/1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2/1`}).
The cents-from-12-TET column shows where each Pythagorean pitch sits relative
to its 12-TET neighbour:

```ts
display(scaleTable(pythagorean12, 261.625));
```

## Audition the wolf

- ${playPure} sounds the pure fifth (${ratioPill(pureFifth)}) — 701.955¢, the
  chain's building block. Beat-free against any ${tex`1/1`} drone.
- ${playWolf} sounds the wolf fifth (${ratioPill(wolfFifth)}) — 678.495¢, the
  diminished sixth that closes the chain. Audibly narrow and slightly sour
  against the pure version; sound them back-to-back and the ~23.460¢ gap is
  unmistakable.

## Where the wolf lives

In the historical 12-note Pythagorean tuning the wolf is conventionally placed
between G♯ and E♭ (or their enharmonic equivalents — different historical
sources pick different spots, but the wolf has to live *somewhere*). Six pure
fifths up from C + five pure fifths down from C + one wolf = closed 12-tone
cycle. Modulating into a key whose dominant crosses the wolf produces an
audibly broken fifth — which is why Western tuning evolved away from pure
Pythagorean toward meantone (16th c.) and well-tempered systems (Werckmeister,
17th c.) and ultimately 12-TET.

## See also

The [Pythagorean comma](/pages/pythagorean-comma) — the ${tex`531441/524288`}
ratio that the wolf manifests. The pythagorean-comma page defines the
interval; this page shows *where* it lives in a real 12-tone tuning system.

The [harmonic series](/pages/harmonic-series) is the prerequisite framing:
3-limit JI privileges intervals built from partials 1 and 3 (the perfect
fifth being 3:2). Pythagorean tuning is what you get when you build a 12-note
scale from that single interval alone.

The [dashboard](/) — paste any of the 13 Pythagorean pitches into the scale
text and audition them against a drone. Try the wolf ratio `262144/177147`
directly: it's audibly narrower than `3/2`.

## Further reading

```js
furtherReading([
  {
    title: "Pythagorean tuning on the Xenharmonic Wiki",
    url: "https://en.xen.wiki/w/Pythagorean_tuning",
    note: "community-curated reference for the 3-limit chain-of-fifths construction. Covers the 12- vs 17- vs 53-note variants, the placement of the wolf, the historical migration to meantone, and the relationship to the Pythagorean comma as the closure gap."
  },
  {
    title: "Hermann von Helmholtz — On the Sensations of Tone (Ellis tr., 1875)",
    url: "https://imslp.org/wiki/Die_Lehre_von_den_Tonempfindungen_(Helmholtz%2C_Hermann_von)",
    note: "the canonical 19th-century acoustic treatise. Part III treats the Pythagorean tuning as the historical starting point of Western intonation, and Helmholtz's beat-rate analysis of the wolf fifth is still the cleanest psychoacoustic argument for why a chain of pure fifths fails to close. IMSLP hosts both the 1863 German original and the Ellis 1875 English translation in the public domain."
  }
])
```
