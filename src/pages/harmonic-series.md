# The harmonic series

Integer multiples of a fundamental — the natural source of every JI ratio

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
// baseHz = 110 (low A2) keeps partial 16 at 1760 Hz — still musical, well under the
// upper edge of pitched hearing. The default 440 Hz would push partial 16 to 7040 Hz,
// where sw-synth's plain oscillators read as a thin whistle rather than a tone.
const baseHz = 110;

// Partials 1..16 over the fundamental. Each ratio n/1 is constructed as a string
// so the BigInt Fraction path is exercised end-to-end (R-01 — no float-as-source-
// of-truth). Names follow the conventional musical labelling: partials 11 and 13
// fall outside Western diatonic names, so we use the standard xenharmonic
// descriptors ("undecimal", "tridecimal").
const partials: { n: number; iv: Interval; name: string }[] = [
  { n: 1,  iv: new Interval("1/1"),  name: "fundamental" },
  { n: 2,  iv: new Interval("2/1"),  name: "octave" },
  { n: 3,  iv: new Interval("3/1"),  name: "octave + just perfect 5th" },
  { n: 4,  iv: new Interval("4/1"),  name: "double octave" },
  { n: 5,  iv: new Interval("5/1"),  name: "2 octaves + just major 3rd" },
  { n: 6,  iv: new Interval("6/1"),  name: "2 octaves + just perfect 5th" },
  { n: 7,  iv: new Interval("7/1"),  name: "2 octaves + harmonic 7th" },
  { n: 8,  iv: new Interval("8/1"),  name: "triple octave" },
  { n: 9,  iv: new Interval("9/1"),  name: "3 octaves + just major 2nd" },
  { n: 10, iv: new Interval("10/1"), name: "3 octaves + just major 3rd" },
  { n: 11, iv: new Interval("11/1"), name: "3 octaves + undecimal semi-augmented 4th" },
  { n: 12, iv: new Interval("12/1"), name: "3 octaves + just perfect 5th" },
  { n: 13, iv: new Interval("13/1"), name: "3 octaves + tridecimal neutral 6th" },
  { n: 14, iv: new Interval("14/1"), name: "3 octaves + harmonic 7th" },
  { n: 15, iv: new Interval("15/1"), name: "3 octaves + just major 7th" },
  { n: 16, iv: new Interval("16/1"), name: "quadruple octave" },
];
```

A vibrating string — or air column, or struck bar, or any resonator with a
linear restoring force — rings not at one frequency but at a stack of them:
${tex`1f,\ 2f,\ 3f,\ 4f,\ 5f,\ \ldots`}. These are the **partials** (or
**harmonics**) of the fundamental ${tex`f`}. The ratio of the *n*-th partial
to the fundamental is exactly ${tex`n/1`} — an integer. Every just-intonation
interval this notebook explores is, somewhere upstream, a ratio between two
of these integers.

The harmonic series is the ground floor of JI. The 5-limit major third
${tex`5/4`} is partial 5 over partial 4. The pure perfect fifth ${tex`3/2`}
is partial 3 over partial 2. The harmonic seventh ${tex`7/4`} is partial 7
over partial 4. Pick any two partials and the interval between them is a
small-integer ratio — that's the structural fact every later page on this
site rests on.

## Partials 1–16

Each row plays its partial as a dyad against the fundamental at ${tex`f = 110\ \mathrm{Hz}`}.
Partial 1 plays a unison (fundamental against itself — useful as a tone-quality
reference). The **cents-from-12-TET** column is the deviation from the nearest
equal-tempered pitch: a 12-TET ear hears partial 7 as a noticeably flat minor 7th
(−31.2¢), partial 11 as halfway between a perfect 4th and a tritone (−48.7¢),
and partial 13 as a flat neutral 6th (−59.5¢). These are the prime-7, prime-11,
and prime-13 entry points respectively.

```ts
// Partials table — manual DOM construction following src/components/scale-table.ts.
// Every dynamic cell uses textContent (T-02-22/23 defense-in-depth, even though
// these values are computed from kernel arithmetic and not user-controlled — the
// pattern is the contract). The ▶ button comes from playInterval(iv, synth, opts),
// already an HTMLButtonElement, appended directly to the <td>.
const partialsTable = (() => {
  const wrapper = document.createElement("div");
  wrapper.className = "scale-table";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML =
    "<tr><th>Partial</th><th>Ratio</th><th>¢ from 12-TET</th><th>Name</th><th>Play</th></tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const { n, iv, name } of partials) {
    const tr = document.createElement("tr");

    const delta = iv.centsFrom12tet;
    const textCells: string[] = [
      String(n),
      iv.fraction.toFraction(),
      (delta > 0 ? "+" : "") + delta.toFixed(1),
      name,
    ];
    for (const value of textCells) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }

    const playTd = document.createElement("td");
    playTd.appendChild(playInterval(iv, synth, { baseHz }));
    tr.appendChild(playTd);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
})();
display(partialsTable);
```

A few things to notice as you scan the table:

- **Octaves stay exact.** Partials 2, 4, 8, 16 are pure powers of 2, so their
  cents-from-12-TET column reads `+0.0`. Octave equivalence is the one thing
  12-TET and JI agree on without compromise.
- **Pure fifths land at +2¢.** Partial 3 — and every multiple-of-3 partial
  whose only other factor is 2 — sits ~2¢ sharp of its 12-TET counterpart.
  That tiny gap, accumulated twelve times, is the **Pythagorean comma**.
- **Major thirds land at −14¢.** Partial 5 (and 10) is the just major third
  family; it's ~14¢ flatter than the 12-TET major third, which is why JI
  major triads sound notably "calmer" than tempered ones.
- **Prime-7 introduces a 31¢ gap.** Partial 7 (and 14) is the harmonic 7th;
  it's ~31¢ flatter than the 12-TET minor 7th. This is the gap the
  [septimal comma](/pages/septimal-comma) measures.
- **Primes 11 and 13 are exotic.** Partials 11 and 13 land near the
  *midpoint* between two 12-TET pitches — they're not "out of tune" versions
  of familiar intervals; they're new intervals. Most Western music never
  reaches for them.

## Why this is the ground floor

Every more elaborate construction this notebook explores reduces back to
ratios in the harmonic series:

- **Otonal chords** (over-N chords like ${tex`4 : 5 : 6 : 7`}) are
  contiguous slices of the partials table.
  See [otonality and utonality](/pages/otonality-utonality) for the dual —
  picking subharmonics ${tex`\tfrac{1}{4} : \tfrac{1}{5} : \tfrac{1}{6} : \tfrac{1}{7}`}
  instead, the symmetric mirror.
- **Monzos** factor a ratio into the prime-axis exponents of the partials it's
  built from. See [Monzos](/pages/monzos) — partial 5's monzo is
  ${tex`\begin{bmatrix} 0 & 0 & 1 \end{bmatrix}\rangle = 5^1`}; partial 15's
  is ${tex`\begin{bmatrix} 0 & 1 & 1 \end{bmatrix}\rangle = 3 \cdot 5`}.
- **Commas** are tiny ratios between two ways of reaching the same scale
  position by stacking partials. The [syntonic comma](/pages/syntonic-comma)
  ${tex`81/80`} is the gap between four stacked partial-3's (Pythagorean
  thirds) and one partial-5 (just third); the [septimal comma](/pages/septimal-comma)
  ${tex`64/63`} is the gap between partial-7 and a stack of partial-2's and
  partial-3's reaching the same pitch class.
- **Prime-limits** classify scales by the *largest prime partial* they need.
  3-limit JI (Pythagorean) only uses partials 1, 2, 3 and their multiples;
  5-limit reaches partial 5; 7-limit reaches partial 7; and so on. See
  [Prime-limits](/pages/prime-limits).
- **Odd-limits** (Partch's classification) ask: of the *odd-numbered* partials
  in numerator or denominator, what's the largest? The 7-odd-limit diamond
  is built from odd partials ${tex`\{1, 3, 5, 7\}`}; the 11-odd-limit adds
  partial 11. See [Odd-limits](/pages/odd-limits).

## See also

The dashboard at [/](/) lets you build a JI scale by hand-picking ratios from
the partials above (and their inversions/multiplications). Try seeding a scale
with ${tex`\{1/1,\ 5/4,\ 3/2,\ 7/4\}`} — the otonal tetrad on partial 4 — and
audition it against the drone. What you're hearing is partials 4, 5, 6, 7 of
the harmonic series, sounded together.
