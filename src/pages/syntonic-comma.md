---
style: ../styles.css
---

# The syntonic comma

81/80 — the gap between Pythagorean and 5-limit major thirds

```ts
import { Interval } from "../lib/interval.js";
import { commaByName } from "../lib/commas.js";
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

## In monzos

${tex`81/80 = \begin{bmatrix} -4 & 4 & -1 \end{bmatrix}\rangle = 2^{-4} \cdot 3^{4} \cdot 5^{-1}`}

The four 3's of the Pythagorean stacking + the −1 5-power = exactly the comma's
"cost" of choosing pure 3-limit thirds over pure 5-limit thirds.

## See also

The dashboard at [/](/) lets you build any JI scale containing the comma. Try
replacing one of the seed scale's pitches with `81/64` and audition both against
the drone — the syntonic-comma beat-rate becomes audible immediately.
