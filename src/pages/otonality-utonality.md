# Otonality and utonality

Over-N and under-N chord-formation — Partch's central duality, and the rows-and-columns of the tonality diamond.

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
// Otonal chord 4:5:6:7 reduced to a single octave [1, 2):
//   4/4 = 1/1, 5/4, 6/4 = 3/2, 7/4.
// Each member's monzo has non-negative entries on the 5- and 7-prime axes —
// i.e. the chord "lives above" the fundamental.
const otonal = [
  new Interval("1/1"),
  new Interval("5/4"),
  new Interval("3/2"),
  new Interval("7/4"),
];

// Utonal chord 1/4:1/5:1/6:1/7 — the symmetric inversion. We invert each
// otonal member and octave-reduce back up into [1, 2) so the chord can be
// played from the same root for direct A/B comparison:
//   inv(1/1) = 1/1
//   inv(5/4) = 4/5  →  octaveReduce → 8/5
//   inv(3/2) = 2/3  →  octaveReduce → 4/3
//   inv(7/4) = 4/7  →  octaveReduce → 8/7
// Listed in ASCENDING pitch order (so the chord buttons hit notes in
// chord-tone order, not inversion-of-otonal order).
const utonal = [
  new Interval("1/1"),
  new Interval("8/7"),
  new Interval("4/3"),
  new Interval("8/5"),
];

// baseHz for chord playback — D-08 default (A4 = 440 Hz).
const baseHz = 440;
```

A vibrating string driven hard enough rings not just its fundamental but a stack
of integer-multiple **harmonics** above it: ${tex`1f,\ 2f,\ 3f,\ 4f,\ 5f,\ 6f,\ 7f,\ \ldots`}.
Pick four of those — ${tex`4 : 5 : 6 : 7`} — and you have a chord that exists in
nature, the **otonal** tetrad. Octave-reducing each harmonic back into a single
octave gives ratios above the fundamental: ${tex`1, \tfrac{5}{4}, \tfrac{3}{2}, \tfrac{7}{4}`}
— a 7-limit dominant-7-flavored sonority.

Now do the symmetric thing. Pick the *subharmonics* ${tex`\tfrac{1}{4} : \tfrac{1}{5} : \tfrac{1}{6} : \tfrac{1}{7}`}
*beneath* a guide tone and you have the **utonal** tetrad — the same numbers,
inverted. As a set of ratios re-rooted upward (so we can play it from the same
fundamental as the otonal chord), this reads as ${tex`1, \tfrac{8}{7}, \tfrac{4}{3}, \tfrac{8}{5}`}.
Each utonal member is its otonal counterpart's ${tex`\mathrm{inv}(\cdot)`} brought
back into ${tex`[1, 2)`} by an octave.

The harmonic series is asymmetric — it only goes up — but ratio space itself is
**symmetric**. For every otonal chord there's an exact utonal mirror, and Harry
Partch's whole 43-tone theory treats the two as duals (Partch, *Genesis of a
Music*, 1949/1974, chs. 6 & 8). The tonality-diamond viz on the [dashboard](/) is
the joint visualization of this duality: rows are utonal chains (constant
denominator, ascending numerator), columns are otonal chains (constant
numerator, ascending denominator).

## The otonal chord (over-N)

As harmonics: ${tex`4 : 5 : 6 : 7`}. Octave-reduced to ${tex`[1, 2)`}: ${tex`1 : \tfrac{5}{4} : \tfrac{3}{2} : \tfrac{7}{4}`}.

- ${ratioPill(otonal[0])} — the fundamental (4/4 = 1/1).
- ${ratioPill(otonal[1])} — 5-limit major third (5th harmonic, octave-reduced).
- ${ratioPill(otonal[2])} — perfect fifth (6/4 = 3/2; the 6th harmonic, octave-reduced).
- ${ratioPill(otonal[3])} — harmonic seventh (7th harmonic; 7-limit, ~969¢, a touch flatter than the 12-TET minor seventh).

```ts
// Build the "Play otonal (4:5:6:7)" button inline. We don't use playInterval
// because that factory plays a dyad (root + 1 interval); we want all 4 notes
// simultaneous, which is exactly what synth.playNotes(freqs) does.
const otonalBtn = (() => {
  const b = document.createElement("button");
  b.className = "play-btn";
  b.type = "button";
  b.textContent = "▶ Play otonal (4:5:6:7)";
  b.setAttribute(
    "aria-label",
    "Play the otonal chord 4:5:6:7 as a simultaneous 4-note chord",
  );
  b.addEventListener("click", () => {
    const freqs = otonal.map((iv) => baseHz * Number(iv.fraction.valueOf()));
    synth.playNotes(freqs);
  });
  return b;
})();
```

Audition all four notes together: ${otonalBtn}

## The utonal chord (under-N)

As subharmonics: ${tex`\tfrac{1}{4} : \tfrac{1}{5} : \tfrac{1}{6} : \tfrac{1}{7}`}.
Each subharmonic is inverted and octave-reduced so the chord can be played
ascending from the same fundamental as the otonal chord above: ${tex`1 : \tfrac{8}{7} : \tfrac{4}{3} : \tfrac{8}{5}`}.

- ${ratioPill(utonal[0])} — the guide tone (root, unchanged).
- ${ratioPill(utonal[1])} — 7-limit "supermajor second" (inv of 7/4 → 4/7, octave-reduced to 8/7).
- ${ratioPill(utonal[2])} — perfect fourth (inv of 3/2 → 2/3, octave-reduced to 4/3).
- ${ratioPill(utonal[3])} — 5-limit minor sixth (inv of 5/4 → 4/5, octave-reduced to 8/5).

```ts
// Truth-check: compute the utonal chord from the otonal one via .inv().octaveReduce().
// If any of these `ok` flags is false, the page is lying — surface it immediately
// rather than letting the prose drift away from kernel reality (same discipline
// as the round-trip cell on /pages/monzos).
const utonalDerived = otonal.map((iv, i) => {
  const mirrored = iv.inv().octaveReduce();
  return {
    from: iv.toString(),
    mirrored: mirrored.toString(),
    claimed: utonal[i].toString(),
    ok: mirrored.equals(utonal[i]),
  };
});
display(utonalDerived);
```

Expand the array above: each row is `inv(otonal[i]).octaveReduce()` compared
against the claimed utonal[i]. All four `ok` flags read `true` — kernel-side
proof that the chord ratios in the prose are exactly the inversion of the
otonal chord.

```ts
const utonalBtn = (() => {
  const b = document.createElement("button");
  b.className = "play-btn";
  b.type = "button";
  b.textContent = "▶ Play utonal (1/4:1/5:1/6:1/7)";
  b.setAttribute(
    "aria-label",
    "Play the utonal chord 1/4:1/5:1/6:1/7 as a simultaneous 4-note chord, re-rooted upward for direct comparison with the otonal chord",
  );
  b.addEventListener("click", () => {
    const freqs = utonal.map((iv) => baseHz * Number(iv.fraction.valueOf()));
    synth.playNotes(freqs);
  });
  return b;
})();
```

Audition all four notes together: ${utonalBtn}

A/B the two buttons. The otonal chord reads as a bright, "dominant" sonority —
think dominant seventh with a slightly-flat top note. The utonal chord, played
from the same root, reads as a darker, "minor"-leaning sonority — a minor triad
with a 7-limit upper neighbor. Both chords have the same internal interval
content as multisets; what flips is the *direction* the intervals point relative
to the root.

## Monzo signs flip

The otonal-utonal duality is visible at the monzo level (see [Monzos](/pages/monzos)
for the prime-vector notation if this is unfamiliar) as **sign flips on the 5- and
7-prime exponents**. The 2-prime entry adjusts to keep the result in ${tex`[1, 2)`}
— that's the bookkeeping the `.inv().octaveReduce()` operation handles for us.

${tex`\begin{aligned}
\tfrac{5}{4} &= \begin{bmatrix} -2 & 0 & 1 \end{bmatrix}\rangle &\quad\leftrightarrow\quad &\tfrac{8}{5} = \begin{bmatrix} 3 & 0 & -1 \end{bmatrix}\rangle \\
\tfrac{3}{2} &= \begin{bmatrix} -1 & 1 \end{bmatrix}\rangle &\quad\leftrightarrow\quad &\tfrac{4}{3} = \begin{bmatrix} 2 & -1 \end{bmatrix}\rangle \\
\tfrac{7}{4} &= \begin{bmatrix} -2 & 0 & 0 & 1 \end{bmatrix}\rangle &\quad\leftrightarrow\quad &\tfrac{8}{7} = \begin{bmatrix} 3 & 0 & 0 & -1 \end{bmatrix}\rangle
\end{aligned}`}

Read the rows: every nonzero 5- or 7-prime entry switches sign between the
otonal and utonal members of a pair. **Positive prime exponents = otonal**
(harmonics, "above"); **negative prime exponents = utonal** (subharmonics,
"below"). The 2-prime entry absorbs whatever octave shift is needed to keep
the ratio in ${tex`[1, 2)`}, which is why it doesn't just flip sign — it
recomputes.

## See also

The [dashboard](/) renders the **tonality diamond** — the visual joint of
otonality and utonality. Each row of the diamond is a utonal chain (a constant
denominator, ascending numerator: pure "under-N" chords). Each column is an
otonal chain (a constant numerator, ascending denominator: pure "over-N"
chords). The diamond's symmetry across its anti-diagonal *is* the otonal/utonal
symmetry this page just defined — every cell ${tex`p/q`} has a mirror ${tex`q/p`}
on the opposite side, reduced into the octave.

The [odd-limit](/pages/odd-limits) classification is Partch's next layer on top
of this duality: the *n*-odd-limit is the set of all ratios whose largest odd
factor (in numerator or denominator) is ${tex`\le n`} — which is exactly the
cells of the *n*-odd-limit tonality diamond. Otonal and utonal chords are the
diamond's rows and columns; the odd-limit is its size.

The 5-limit major third in the otonal chord (${ratioPill(otonal[1])}) differs
from the Pythagorean major third (${tex`\tfrac{81}{64}`}) by exactly one
[syntonic comma](/pages/syntonic-comma). The otonal/utonal framework gives the
comma a more general home: any time you swap a pure prime-${tex`p`} interval
for a stack of pure prime-${tex`q`} intervals, the difference is a comma of
the form ${tex`p^{\pm a} \cdot q^{\mp b}`}.
