# The schisma

32805/32768 — the gap between the Pythagorean and syntonic commas, at the threshold of audibility

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
// commaByName returns Interval | undefined. The "schisma", "syntonic comma", and
// "Pythagorean comma" keys are hand-verified in src/lib/commas.ts (Plan 02), so the
// lookups are total at construction time; we assert non-null with `!` and let
// strict-TS keep us honest if the table ever drifts.
const schisma = commaByName("schisma")!; //                 32805/32768
const syntonic = commaByName("syntonic comma")!; //         81/80
const pythagorean = commaByName("Pythagorean comma")!; //   531441/524288
```

The **schisma** is ${tex`\frac{32805}{32768} \approx 1.95\text{¢}`}, the difference
between the Pythagorean comma (${ratioPill(pythagorean)}) and the syntonic comma
(${ratioPill(syntonic)}). Subtracting the narrower from the wider leaves the schisma
exactly: ${tex`\frac{531441/524288}{81/80} = \frac{32805}{32768}`}. At roughly two
cents it sits right at the just-noticeable-difference for pitch in slow contexts —
audible as a beat-rate against a sustained reference, often inaudible as a melodic
step.

Audition the size gradient, wide to narrow:

- ${playInterval(pythagorean, synth, { label: true })} sounds the Pythagorean comma (~23.46¢) — the wider of the two parent commas; clearly audible as a microtonal step.
- ${playInterval(syntonic, synth, { label: true })} sounds the syntonic comma (~21.5¢) — about 2¢ narrower than the Pythagorean.
- ${playInterval(schisma, synth, { label: true })} sounds the schisma itself (~1.95¢) — the residue. Right at the threshold of audibility; you may hear it as a faint beating rather than a definite pitch.

Tempering out the schisma (treating ${ratioPill(schisma)} as a unison) yields
*schismatic temperament*, which identifies a stack of eight pure fifths reduced by
five octaves with a 5-limit major third — collapsing the Pythagorean/5-limit
distinction at the cost of slightly detuned fifths.

## In monzos

${tex`32805/32768 = \begin{bmatrix} -15 & 8 & 1 \end{bmatrix}\rangle = 2^{-15} \cdot 3^{8} \cdot 5^{1}`}

The prime-3 column (8) and prime-5 column (1) together encode the reconciliation
of the Pythagorean stack with a 5-limit third. Subtract the syntonic monzo
${tex`\begin{bmatrix} -4 & 4 & -1 \end{bmatrix}\rangle`} from the Pythagorean monzo
${tex`\begin{bmatrix} -19 & 12 & 0 \end{bmatrix}\rangle`} and the schisma's monzo
${tex`\begin{bmatrix} -15 & 8 & 1 \end{bmatrix}\rangle`} falls out exactly.

## See also

The [syntonic comma](/pages/syntonic-comma) note covers the 5-limit closure gap —
the difference between Pythagorean and 5-limit major thirds. The
[Pythagorean comma](/pages/pythagorean-comma) note covers the 3-limit closure gap —
the overshoot of twelve pure fifths past seven octaves. The dashboard at [/](/)
lets you build any JI scale containing these commas and audition it against a drone.
