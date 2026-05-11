# The Pythagorean comma

531441/524288 — the gap that prevents twelve pure fifths from closing into seven octaves

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

## In monzos

${tex`531441/524288 = \begin{bmatrix} -19 & 12 \end{bmatrix}\rangle = 2^{-19} \cdot 3^{12}`}

Only the primes 2 and 3 appear — this is a 3-limit comma. Twelve 3's stacked up minus
nineteen 2's brought back down is the exact cost of trying to close a 12-note cycle
out of pure fifths alone.

## See also

The dashboard at [/](/) lets you build any JI scale and audition it against a drone.
Try stacking twelve 3/2's by hand — the cents-from-12tet column drifts upward and
ends at the comma. The companion [syntonic comma](/pages/syntonic-comma) note
covers 5-limit JI's analogous closure gap.
