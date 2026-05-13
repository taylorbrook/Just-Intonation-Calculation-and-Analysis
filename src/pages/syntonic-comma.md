# The syntonic comma

81/80 — the gap between Pythagorean and 5-limit major thirds

```ts
import { Interval } from "../lib/interval.js";
import { commaByName } from "../lib/commas.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import { playDyad } from "../components/play-dyad.js";
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
<a href="./harmonic-series">the harmonic series</a>, <a href="./prime-limits">prime-limits</a>
</aside>

```ts
// commaByName returns Interval | undefined. The "syntonic comma" key is hand-verified
// in src/lib/commas.ts (Plan 02), so the lookup is total at construction time; we
// assert non-null with `!` and let strict-TS keep us honest if the table ever drifts.
const syntonic = commaByName("syntonic comma")!; //         81/80
const fiveLimit = new Interval("5/4"); //                   5-limit major third
const pythagorean = new Interval("81/64"); //               Pythagorean major third (4 fifths up, 2 octaves down)
```

The **syntonic comma** is ${tex`\frac{81}{80} \approx 21.5\text{¢}`}, the gap between
the 5-limit major third (${ratioPill(fiveLimit)}) and the Pythagorean major third
(${ratioPill(pythagorean)}). They differ by exactly one syntonic comma:
${tex`\frac{81/64}{5/4} = \frac{81}{80}`}.

Audition the difference:

- ${playInterval(fiveLimit, synth, { label: true })} sounds the 5-limit major third — a "soft" or "smooth" interval; the prime 5 enters the chord.
- ${playInterval(pythagorean, synth, { label: true })} sounds the Pythagorean major third — slightly wider, brighter; it's stacked from pure 3/2 fifths.
- ${playInterval(syntonic, synth, { label: true })} sounds the comma itself — audible as a beat-rate when the two thirds are sounded together.

The two thirds together — the syntonic comma as a beat-rate:

${playDyad(fiveLimit, pythagorean, synth, { label: "5/4 + 81/64 (syntonic-comma beat)" })}

```ts
const beatHz = (() => {
  const baseHz = 440; // matches playDyad's default (D-08)
  const fFiveLimit = baseHz * Number(fiveLimit.fraction.valueOf()); // 550 Hz
  const fPythag = baseHz * Number(pythagorean.fraction.valueOf()); // 556.875 Hz
  return Math.abs(fPythag - fFiveLimit); // 6.875 Hz
})();
```

Beat frequency at A = 440 Hz: ${beatHz.toFixed(3)} Hz. The 5/4 third lands at
550 Hz and the 81/64 third at 556.875 Hz; their near-coincident upper partials
fall in and out of phase at that rate. The syntonic comma's ~21.506¢ size,
scaled to this anchor, is exactly this audible Hz signature.

## In monzos

${tex`81/80 = \begin{bmatrix} -4 & 4 & -1 \end{bmatrix}\rangle = 2^{-4} \cdot 3^{4} \cdot 5^{-1}`}

The four 3's of the Pythagorean stacking + the −1 5-power = exactly the comma's
"cost" of choosing pure 3-limit thirds over pure 5-limit thirds.

> **Tempered out by.** Meantone in all common variants (quarter-comma /
> third-comma / sixth-comma / seventh-comma), 12-EDO, 19-EDO, 31-EDO, 53-EDO.
> These are precisely the temperaments that map 81/80 to a unison — the
> prime-5 major third (5/4) and the Pythagorean major third (81/64) collapse
> onto the same scale degree, and the comma vanishes from the system.

## See also

The [harmonic series](/pages/harmonic-series) is the prerequisite: the 5-limit
major third is partial 5 over partial 4, the Pythagorean major third is four
stacked partial-3's, and the syntonic comma is precisely the gap between those
two paths to the same scale degree.

The dashboard at [/](/) lets you build any JI scale containing the comma. Try
replacing one of the seed scale's pitches with `81/64` and audition both against
the drone — the syntonic-comma beat-rate becomes audible immediately.

## Further reading

- [81/80 on the Xenharmonic Wiki](https://en.xen.wiki/w/81/80) —
  community-curated reference for the syntonic comma, covering its role
  as the defining comma of 5-limit meantone, the family of temperaments
  that vanish it (the meantone variants plus 12-/19-/31-/53-EDO), and
  worked examples of comma pumps that drift by exactly 81/80 per cycle.
