# The septimal comma

64/63 — the gap between the harmonic 7th and the Pythagorean minor 7th; entry point to 7-limit JI

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

## In monzos

${tex`64/63 = \begin{bmatrix} 6 & -2 & 0 & -1 \end{bmatrix}\rangle = 2^{6} \cdot 3^{-2} \cdot 5^{0} \cdot 7^{-1}`}

The prime-7 column is the giveaway — this is the first comma in the standard set where
7 appears, which is exactly why it marks the doorway from 5-limit to 7-limit JI. The
64 = 2^6 and the 63 = 9 × 7 = 3^2 × 7 line up cleanly with the monzo.

## See also

The [syntonic comma](/pages/syntonic-comma) is the 5-limit analog — the gap between
Pythagorean and 5-limit major thirds. The [Pythagorean comma](/pages/pythagorean-comma)
is the 3-limit closure gap — the overshoot of twelve pure fifths past seven octaves.
The dashboard at [/](/) lets you build a JI scale containing `7/4` and audition it
against the drone — the septimal-comma beating becomes audible immediately when the
harmonic 7th is sounded against a Pythagorean minor 7th in the same scale.
