# The comma pump

Why the I-vi-ii-V-I cadence in pure 5-limit JI drifts one syntonic comma flat per cycle

```ts
import { Interval } from "../lib/interval.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
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
// Five chord roots in the 5-limit I-vi-ii-V-I cadence (NOT octave-reduced — the
// drift is the point). Each root is the previous root × the just root motion:
//   I  → vi : ×5/3   (down a major third + octave = up a minor sixth, JI 5/3)
//   vi → ii : ×2/3   (down a fifth, in the inverted form 2/3 of vi's octave)
//   ii → V  : ×4/3   (up a fourth, JI 4/3)
//   V  → I' : ×2/3   (down a fifth)
// Cumulative: 1 × 5/3 × 2/3 × 4/3 × 2/3 = 80/81 — the I' arrives one
// syntonic comma (81/80) flat. This is the "comma pump."
const I = new Interval("1/1");
const vi = new Interval("5/3");
const ii = new Interval("10/9");
const V = new Interval("40/27");
const Iflat = new Interval("80/81"); // the drifted I — 21.5¢ flat of 1/1

// Major triad shape (root, third, fifth) and minor triad shape (root, third, fifth).
const MAJOR = ["1/1", "5/4", "3/2"].map((s) => new Interval(s));
const MINOR = ["1/1", "6/5", "3/2"].map((s) => new Interval(s));

const triad = (root, shape) => shape.map((iv) => root.mul(iv));

// The full drifting cycle — five chords, each as Interval[] of three triad members.
const driftingCycle = [
  triad(I, MAJOR),
  triad(vi, MINOR),
  triad(ii, MINOR),
  triad(V, MAJOR),
  triad(Iflat, MAJOR), // arrives 80/81 flat of the opening I
];

// The re-anchored cycle — identical to drifting EXCEPT the final I is forced back
// to 1/1, hiding the comma. This is what equal-tempered systems do globally.
const reanchoredCycle = [
  triad(I, MAJOR),
  triad(vi, MINOR),
  triad(ii, MINOR),
  triad(V, MAJOR),
  triad(I, MAJOR), // reset to 1/1 — comma hidden
];
```

```ts
// Schedule a sequence of chords (Interval[][]) on the synth.
// Each chord plays for `chordDur` seconds; chords are spaced `chordDur` apart
// (no overlap — clean cadence pacing). baseHz is the absolute Hz for 1/1.
//
// Uses synth.playNotes (simultaneous chord) chained by setTimeout. We do NOT
// use playArpeggio here — that's note-by-note within ONE chord; we want chord-
// by-chord across time.
//
// Returns nothing — fire-and-forget. The cell-owned synth's invalidation
// disposer handles cleanup if the cell re-evaluates mid-playback.
const playCycle = (cycle, baseHz = 220, chordDur = 1.1) => {
  cycle.forEach((chord, i) => {
    const freqs = chord.map((iv) => baseHz * Number(iv.fraction.valueOf()));
    setTimeout(() => synth.playNotes(freqs, chordDur), i * chordDur * 1000);
  });
};
```

```ts
// Inline play buttons. Mirror playInterval's `.play-btn` styling so they pick
// up the global theme (--theme-blue accent, focus ring) — but call playCycle
// instead of playNotes-of-a-dyad.
const cycleButton = (label, cycle) => {
  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = `▶ ${label}`;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", () => playCycle(cycle));
  return btn;
};

const playDrifting = cycleButton("Play drifting cycle", driftingCycle);
const playReanchored = cycleButton("Play re-anchored cycle", reanchoredCycle);
```

The most familiar cadence in Western music — **I-vi-ii-V-I** — is also the
canonical demonstration of why pure [5-limit just intonation](/pages/prime-limits)
cannot underpin a stable global tonality. Played in pure 5-limit JI, the
cadence accumulates exactly one [syntonic comma](/pages/syntonic-comma)
(${tex`81/80 \approx 21.5\text{¢}`}) of downward drift per cycle. Repeat the
progression and the tonic walks away from itself: after one cycle the "home"
chord sits 21.5¢ below where it started; after two, 43¢; after four, almost
exactly a 12-TET semitone gone.

## The chord-root math

Take the cadence one root motion at a time, in pure 5-limit just intonation:

- **I → vi.** A descending major third in JI is ${tex`4/5`}; reduced into the
  octave above it becomes ${tex`8/5`} or, expressed as the ascending minor
  sixth, ${tex`5/3`}. Either way, vi sits on ${ratioPill(vi)} relative to I's
  ${tex`1/1`}.
- **vi → ii.** A descending fifth: ${tex`5/3 \times 2/3 = 10/9`}. ii lands on
  ${ratioPill(ii)}.
- **ii → V.** An ascending just fourth ${tex`4/3`}: ${tex`10/9 \times 4/3 = 40/27`}.
  V sits at ${ratioPill(V)}.
- **V → I'.** A descending fifth ${tex`2/3`}: ${tex`40/27 \times 2/3 = 80/81`}.

The cumulative product:

${tex`1 \times \frac{5}{3} \times \frac{2}{3} \times \frac{4}{3} \times \frac{2}{3} \;=\; \frac{80}{81}`}

The final I' arrives at ${ratioPill(Iflat)} — and ${tex`80/81 = (81/80)^{-1}`},
so it sits **one syntonic comma below** the opening I. Each motion was a pure
JI interval; their composition does not close the loop. This is the *comma
pump*.

## Audition

- ${playDrifting} — pure 5-limit roots throughout. Listen to the final tonic
  chord against your memory of the opening one: it sits ~21.5¢ flat. The drift
  is small per cycle but cumulative across a piece — this is what makes pure
  JI globally unstable for any music that modulates.
- ${playReanchored} — identical chords EXCEPT the final I is forced back to
  ${tex`1/1`}. The comma is hidden by re-rooting; the price is that the
  ${tex`V \to I'`} motion is no longer a pure ${tex`2/3`} fifth (it's
  ${tex`27/40`}, sharp by one syntonic comma). This is what equal-tempered
  systems do *globally* — they smear the comma across all twelve fifths so
  that every cycle closes, at the cost of every fifth being slightly impure.

## Why this matters

The comma pump is the historical engine that drove Western tuning systems
*away* from pure JI:

- **Meantone temperament** (16th c., Pietro Aron) distributes the syntonic
  comma across four fifths, paying ~5.4¢ per fifth to keep major thirds pure
  ${tex`5/4`}. The comma vanishes by construction; the price is fifths that
  beat audibly.
- **12-TET** (universal by the 19th c.) distributes *all* commas evenly,
  paying ~1.96¢ per fifth and ~13.7¢ per major third to make every key
  playable. Every progression closes; nothing is pure.

The comma pump is *why* temperament exists. A composer working in pure JI
either accepts the drift as a feature (Ben Johnston, La Monte Young, Harry
Partch's adaptive cadences), notates explicit comma shifts (Johnston's
microtonal accidentals), or chooses one tonic and refuses to modulate.

## Octave-reduction footnote

The chord roots above are NOT octave-reduced inside the cycle — the drift
accumulates over absolute Hz, and the final I' really does play 21.5¢ below
the opening I in absolute pitch. If we octave-reduced ${tex`80/81`} back into
${tex`[1, 2)`} we'd get ${tex`80/81 \times 2 = 160/81`}, ~21.5¢ below ${tex`2/1`}
— but the *drift* is the same either way: the I' triad is a syntonic comma
flat of where the opening I lived, octave-equivalent or not.

## See also

The [syntonic comma](/pages/syntonic-comma) — the ${tex`81/80`} ratio that the
comma pump exposes; this page is its natural application. The syntonic comma
page defines the interval; this page shows *why* the interval matters
historically and *why* meantone temperament was invented.

The [harmonic series](/pages/harmonic-series) is the prerequisite framing —
5-limit JI privileges intervals built from partials 1, 3, 5 (the perfect
fifth, the major third, the major sixth). The comma pump reveals that those
intervals don't compose to a closed cycle: any progression that returns to
its tonic by pure-JI motion lands a comma off.

The [dashboard](/) — design any 5-limit JI scale to hear the comma pump in
your own composition. Try replacing one of the seed scale's pitches with
${tex`80/81`} and audition against the drone — that is the absolute pitch
your tonic walks down to after one I-vi-ii-V-I.
