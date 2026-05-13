# The comma pump

Why the I-vi-ii-V-I cadence in pure 5-limit JI drifts one syntonic comma flat per cycle

```ts
import { Interval } from "../lib/interval.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import * as Plot from "npm:@observablehq/plot";
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
<a href="./syntonic-comma">the syntonic comma</a>
</aside>

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

// Three drifting cycles chained back-to-back. Each successive cycle's chord roots
// are multiplied by 80/81 relative to the previous — so cycle 1 starts where
// cycle 0's I' landed (one syntonic comma flat of 1/1), cycle 2 starts at
// (80/81)^2 (~−43¢), and cycle 2's final I' lands at (80/81)^3 (~−64.5¢, the
// ~65¢ cumulative drift). This is what makes the comma pump unmistakable:
// repeating the cadence is what exposes it. The multiplication uses Interval.mul,
// which goes through the BigInt Fraction — no precision loss, no float-cents
// round-tripping (Pitfall #1).
const COMMA_FLAT = new Interval("80/81");
const drift3Cycle = (() => {
  const chords = [];
  let shift = new Interval("1/1");
  for (let k = 0; k < 3; k++) {
    chords.push(triad(I.mul(shift), MAJOR));
    chords.push(triad(vi.mul(shift), MINOR));
    chords.push(triad(ii.mul(shift), MINOR));
    chords.push(triad(V.mul(shift), MAJOR));
    chords.push(triad(Iflat.mul(shift), MAJOR));
    shift = shift.mul(COMMA_FLAT); // (80/81)^k for the next iteration
  }
  return chords; // 15 chords total
})();
const playDrift3 = cycleButton("Play 3 drift cycles", drift3Cycle);
```

The most familiar cadence in Western music — **I-vi-ii-V-I** — is also the
canonical demonstration of why pure [5-limit just intonation](/pages/prime-limits)
cannot underpin a stable global tonality (Helmholtz 1885, 432; Benson 2007,
§5.2). Played in pure 5-limit JI, the cadence accumulates exactly one
[syntonic comma](/pages/syntonic-comma)
(${tex`81/80 \approx 21.5\text{¢}`}) of downward drift per cycle. Repeat the
progression and the tonic walks away from itself: after one cycle the "home"
chord sits 21.506¢ below where it started; after two, 43¢; after four, almost
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

## Visualizing the drift

The chart below tracks the cumulative cents offset of the tonic across the five
chords. For the first four chords nothing has accumulated — the tonic reference
hasn't been revisited yet — so the line sits at zero. At chord 5 the cycle
returns to the I chord built on the new root ${tex`80/81`}, and the line steps
down to ${tex`-21.5\text{¢}`}: one syntonic comma flat of where we started.

```ts
// Drift chart — cumulative cents offset of the tonic across the 5 chords of one
// pure-5-limit I-vi-ii-V-I cycle. The intermediate chords don't "drift" until
// the cycle closes; only at chord 5 does the cumulative product 80/81 manifest.
// Cents are derived ONCE here from Iflat.cents at chart-build time (display
// boundary; Pitfall #1). The y-domain is shared with the re-anchored chart so
// both drops are visually commensurable.
const DRIFT_Y_DOMAIN = [-28, 6];
const CHORD_LABELS_DRIFT = ["I", "vi", "ii", "V", "I'"];
const CHORD_LABELS_REANCHORED = ["I", "vi", "ii", "V", "I"];

const driftChart = (() => {
  const data = [
    { chord: 1, label: "I",  cents: 0 },
    { chord: 2, label: "vi", cents: 0 },
    { chord: 3, label: "ii", cents: 0 },
    { chord: 4, label: "V",  cents: 0 },
    { chord: 5, label: "I'", cents: Iflat.cents }, // ≈ −21.5064 (BigInt-Fraction → cents projection, once)
  ];
  return Plot.plot({
    width: 640,
    height: 280,
    marginLeft: 70,
    marginRight: 40,
    marginBottom: 50,
    x: {
      label: "Chord",
      domain: [1, 2, 3, 4, 5],
      tickFormat: (n) => CHORD_LABELS_DRIFT[n - 1] ?? String(n),
    },
    y: {
      label: "Cents from opening tonic",
      domain: DRIFT_Y_DOMAIN,
      grid: true,
      tickFormat: (v) => (v > 0 ? `+${v}` : String(v)),
    },
    marks: [
      Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
      Plot.line(data, {
        x: "chord",
        y: "cents",
        curve: "step-after", // flat through chords 1–4, drops at chord 5
        stroke: "#4269d0",
        strokeWidth: 2.5,
      }),
      Plot.dot(data, { x: "chord", y: "cents", fill: "#4269d0", r: 4 }),
      // Comma annotation near the final point.
      Plot.text(
        [{ x: 5, y: Iflat.cents, text: "−21.5¢ (one syntonic comma)" }],
        { x: "x", y: "y", text: "text", dx: -8, dy: 14, textAnchor: "end", fontSize: 12, fill: "#c45656" },
      ),
    ],
  });
})();
display(driftChart);
```

Re-rooting the final tonic hides the drift. The chart below holds the line at
zero across all five chords — the price is that the ${tex`V \to I`} motion is
no longer a pure ${tex`2/3`} fifth. The red bracket marks the
${tex`21.5\text{¢}`} that the re-rooting has absorbed into that single motion.

```ts
// Re-anchored chart — same axes and y-domain as the drift chart so the two are
// visually comparable. The line is flat at 0 across all 5 chords; a red bracket
// drops BELOW the zero line on the V→I motion to show the 21.5¢ that the
// re-rooting has silently absorbed (the same comma shown as a drop in the
// previous chart, here marked as "what didn't happen"). The bracket terminus
// y-coords use `Iflat.cents` (negative ≈ −21.5) so the bracket points DOWN
// toward where the drift would have landed.
const reanchoredChart = (() => {
  const data = [
    { chord: 1, cents: 0 },
    { chord: 2, cents: 0 },
    { chord: 3, cents: 0 },
    { chord: 4, cents: 0 },
    { chord: 5, cents: 0 },
  ];
  const BRACKET_RED = "#c45656";
  return Plot.plot({
    width: 640,
    height: 280,
    marginLeft: 70,
    marginRight: 40,
    marginBottom: 50,
    x: {
      label: "Chord",
      domain: [1, 2, 3, 4, 5],
      tickFormat: (n) => CHORD_LABELS_REANCHORED[n - 1] ?? String(n),
    },
    y: {
      label: "Cents from opening tonic",
      domain: DRIFT_Y_DOMAIN,
      grid: true,
      tickFormat: (v) => (v > 0 ? `+${v}` : String(v)),
    },
    marks: [
      Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
      Plot.line(data, {
        x: "chord",
        y: "cents",
        curve: "step-after",
        stroke: "#4269d0",
        strokeWidth: 2.5,
      }),
      Plot.dot(data, { x: "chord", y: "cents", fill: "#4269d0", r: 4 }),
      // Red bracket spanning V→I (chord 4 → chord 5), pointing DOWN from the
      // zero line to y=Iflat.cents (≈ −21.5): two short vertical ticks + one
      // horizontal bar connecting them at the bottom of the bracket.
      Plot.link(
        [{ x1: 4, y1: 0, x2: 4, y2: Iflat.cents }],
        { x1: "x1", y1: "y1", x2: "x2", y2: "y2", stroke: BRACKET_RED, strokeWidth: 2 },
      ),
      Plot.link(
        [{ x1: 5, y1: 0, x2: 5, y2: Iflat.cents }],
        { x1: "x1", y1: "y1", x2: "x2", y2: "y2", stroke: BRACKET_RED, strokeWidth: 2 },
      ),
      Plot.link(
        [{ x1: 4, y1: Iflat.cents, x2: 5, y2: Iflat.cents }],
        { x1: "x1", y1: "y1", x2: "x2", y2: "y2", stroke: BRACKET_RED, strokeWidth: 2 },
      ),
      Plot.text(
        [{ x: 4.5, y: Iflat.cents, text: "comma absorbed (21.5¢)" }],
        { x: "x", y: "y", text: "text", dy: 14, textAnchor: "middle", fontSize: 12, fill: BRACKET_RED },
      ),
    ],
  });
})();
display(reanchoredChart);
```

## Audition

- ${playDrifting} — pure 5-limit roots throughout. Listen to the final tonic
  chord against your memory of the opening one: it sits ~21.506¢ flat. The drift
  is small per cycle but cumulative across a piece — this is what makes pure
  JI globally unstable for any music that modulates.
- ${playReanchored} — identical chords EXCEPT the final I is forced back to
  ${tex`1/1`}. The comma is hidden by re-rooting; the price is that the
  ${tex`V \to I'`} motion is no longer a pure ${tex`2/3`} fifth (it's
  ${tex`27/40`}, sharp by one syntonic comma). This is what equal-tempered
  systems do *globally* — they smear the comma across all twelve fifths so
  that every cycle closes, at the cost of every fifth being slightly impure.
- ${playDrift3} — three full cadences chained back-to-back. Each cycle's chord
  roots are multiplied by ${tex`80/81`} relative to the previous, so the drift
  is cumulative: ~21.506¢ after cycle 1, ~43¢ after cycle 2, ~64.5¢ after cycle 3.
  By the third cycle the "home" chord sits more than half a 12-TET semitone
  flat — the cadence has walked off the page. The full 15-chord run takes ~16
  seconds; listen for the final I against your memory of the opening one.

## Why this matters

The comma pump is the historical engine that drove Western tuning systems
*away* from pure JI:

- **Meantone temperament** (16th c., Pietro Aron) distributes the syntonic
  comma across four fifths, paying ~5.4¢ per fifth to keep major thirds pure
  ${tex`5/4`} (Aron 1523). The comma vanishes by construction; the price is
  fifths that beat audibly.
- **12-TET** (universal by the 19th c.) distributes *all* commas evenly,
  paying ~1.96¢ per fifth and ~13.7¢ per major third to make every key
  playable. Every progression closes; nothing is pure.

The comma pump is *why* temperament exists. A composer working in pure JI
either accepts the drift as a feature (Ben Johnston, La Monte Young, Harry
Partch's adaptive cadences; Partch 1974; Gann, "La Monte Young's *The
Well-Tuned Piano*"), notates explicit comma shifts (Johnston's microtonal
accidentals; Doty 2002, ch. 9; Johnston 1977), or chooses one tonic and
refuses to modulate.

## Octave-reduction footnote

The chord roots above are NOT octave-reduced inside the cycle — the drift
accumulates over absolute Hz, and the final I' really does play 21.506¢ below
the opening I in absolute pitch. If we octave-reduced ${tex`80/81`} back into
${tex`[1, 2)`} we'd get ${tex`80/81 \times 2 = 160/81`}, ~21.506¢ below ${tex`2/1`}
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

## Further reading

```js
furtherReading([
  {
    title: "Comma pump on the Xenharmonic Wiki",
    url: "https://en.xen.wiki/w/Comma_pump",
    note: "community-curated reference for the syntonic comma pump and its cousins (the septimal comma pump on dominant 7th progressions, the Pythagorean comma pump on stacks of fifths, etc.). Covers the algebraic conditions under which a progression \"pumps\" a given comma."
  },
  {
    title: "Ben Johnston — Suite for Microtonal Piano (1977)",
    url: "https://en.wikipedia.org/wiki/Ben_Johnston_(composer)",
    note: html`a four-movement piano cycle written in pure 5-limit just intonation. Johnston's notation explicitly marks each comma shift with arrows above the notes: an up-arrow before a notehead raises that pitch by one syntonic comma (${tex`81/80`}), a down-arrow lowers it by the same. The Suite is a sustained meditation on exactly the drift this page demonstrates — Johnston treats the comma as a compositional resource rather than a problem to be tempered away, and the movements modulate by <em>accepting</em> the pump rather than absorbing it. The Lubman recording (New World Records 80637) is the standard.`
  }
])
```

## Sources

- Aron, Pietro. 1523. *Toscanello in musica*. Venice: Bernardino e Matteo de' Vitali. (Multiple reprints 1525–1562.)
- Benson, Dave. 2007. *Music: A Mathematical Offering*. Cambridge: Cambridge University Press.
- Doty, David B. 2002. *The Just Intonation Primer: An Introduction to the Theory and Practice of Just Intonation*. 3rd ed. San Francisco: Just Intonation Network.
- Gann, Kyle. n.d. "La Monte Young's *The Well-Tuned Piano*." Accessed 2026-05-13. https://www.kylegann.com/wtp.html.
- Helmholtz, Hermann von. 1885. *On the Sensations of Tone as a Physiological Basis for the Theory of Music*. Translated and edited by Alexander J. Ellis. 2nd English ed. London: Longmans, Green, and Co.
- Johnston, Ben. 1977. *Suite for Microtonal Piano*. Score and recording: New World Records 80637 (Phillip Bush, piano; reissue New World 1995).
- Partch, Harry. 1974. *Genesis of a Music: An Account of a Creative Work, Its Roots, and Its Fulfillments*. 2nd ed., enlarged. New York: Da Capo Press. (1st ed. University of Wisconsin Press, 1949.)
- Xenharmonic Wiki. n.d. "Comma pump." Accessed 2026-05-13. https://en.xen.wiki/w/Comma_pump.
