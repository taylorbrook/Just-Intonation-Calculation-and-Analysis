# Odd-limits

Partch's parallel classification — how the largest odd factor of a ratio measures harmonic complexity in chord context

```ts
import { Interval } from "../lib/interval.js";
import { oddLimit, primeLimitOfMonzo } from "../lib/monzo.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import { renderDiamondSVG } from "../components/tonality-diamond.js";
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
// Worked examples declared up front so prose, ratio-pills, and play buttons all
// reference the same Interval instances. Strings into new Interval(...) exercise
// the BigInt Fraction path (R-01 — no float-as-source-of-truth).
const harmonicSeventh = new Interval("7/4"); //             7-prime-limit AND 7-odd-limit
const pythagoreanSecond = new Interval("9/8"); //           3-prime-limit BUT 9-odd-limit
const justDiatonicSemitone = new Interval("16/15"); //      5-prime-limit AND 15-odd-limit
```

```ts
// Truth-check the prose against the kernel — if any of these `oddLimit` values
// drifts from the prose, the page is lying. Same discipline as the round-trip
// cell on /pages/otonality-utonality and /pages/monzos.
const oddLimitChecks = [
  { ratio: harmonicSeventh.toString(), monzo: harmonicSeventh.monzo, oddLimit: oddLimit(harmonicSeventh.monzo) },
  { ratio: pythagoreanSecond.toString(), monzo: pythagoreanSecond.monzo, oddLimit: oddLimit(pythagoreanSecond.monzo) },
  { ratio: justDiatonicSemitone.toString(), monzo: justDiatonicSemitone.monzo, oddLimit: oddLimit(justDiatonicSemitone.monzo) },
];
display(oddLimitChecks);
```

The **odd-limit** of a JI ratio is the **largest odd factor of its numerator or
denominator after stripping all factors of 2**. A scale is *n-odd-limit* when
every interval in it has odd-limit ${tex`\le n`}. Where the
[prime-limit](/pages/prime-limits) asks *which primes does the system use*,
the odd-limit asks a more chord-local question: *how harmonically far apart
are these two notes when they sound together?*

For an octave-reduced ratio ${tex`p/q`} in lowest terms:

${tex`\text{odd-limit}(p/q) \;=\; \max\!\Big(\,\operatorname{odd}(p),\;\operatorname{odd}(q)\,\Big)`}

where ${tex`\operatorname{odd}(n)`} is ${tex`n`} divided by ${tex`2`} until it
is odd. The classification is **Harry Partch's** (Partch, *Genesis of a Music*,
1949/1974, chs. 6 & 11). It is what organises his 43-tone scale and what names
the **tonality diamond** on the [dashboard](/) — the *n*-odd-limit diamond is
exactly the set of ratios in ${tex`[1, 2)`} with odd-limit ${tex`\le n`}.

## Where prime-limit and odd-limit agree — and where they don't

The harmonic seventh ${ratioPill(harmonicSeventh)} is the easy case. Its monzo
is ${tex`\begin{bmatrix} -2 & 0 & 0 & 1 \end{bmatrix}\rangle = 2^{-2} \cdot 7^{1}`}
— rightmost non-zero entry on prime ${tex`7`}, so **prime-limit 7**. The odd
factors of numerator and denominator are ${tex`7`} and ${tex`1`}, so
**odd-limit 7**. The two classifications agree because prime 7 enters with
exponent 1, and ${tex`7^{1} = 7`} is already odd.

The Pythagorean major second ${ratioPill(pythagoreanSecond)} is the canonical
disagreement. Its monzo is
${tex`\begin{bmatrix} -3 & 2 \end{bmatrix}\rangle = 2^{-3} \cdot 3^{2}`} — only
primes 2 and 3, so **prime-limit 3**. But the odd factors of numerator and
denominator are ${tex`9`} and ${tex`1`}, so **odd-limit 9**. The same prime
axis, used with exponent 2, lifts the odd-limit by a full identity.

Why the split? Prime-limit asks *which prime axes exist in the monzo lattice*
— and ${tex`9 = 3^{2}`} adds no new axis. Odd-limit asks *how far up the
harmonic series we have to climb to reach this interval as a chord member* —
and reaching partial 9 means hearing the gap between partial 9 and partial 8,
which the ear treats as a richer, more "distant" sonority than the plain
${tex`3/2`} fifth even though both live on the same prime-3 axis.

Audition the three worked examples back-to-back:

- ${playInterval(harmonicSeventh, synth, { label: true })} sounds ${ratioPill(harmonicSeventh)} — odd-limit 7, prime-limit 7. **Both limits agree.**
- ${playInterval(pythagoreanSecond, synth, { label: true })} sounds ${ratioPill(pythagoreanSecond)} — odd-limit 9, prime-limit 3. **The limits diverge.** Acoustically a 9-against-8 beat-pair; harmonically just two stacked fifths reduced down an octave.
- ${playInterval(justDiatonicSemitone, synth, { label: true })} sounds ${ratioPill(justDiatonicSemitone)} — odd-limit 15, prime-limit 5. 15-against-16 partials beat much harder than 9-against-8, audibly more dissonant — and that extra bite is exactly the gap between odd-limit 9 and odd-limit 15.

Two ratios with the same prime-limit can have very different odd-limits, and
that gap is the part of harmonic experience that prime-limit doesn't capture.

## Prime-limit vs odd-limit, side by side

Twelve canonical ratios from across the JI literature, sorted by ascending
odd-limit. The **Agree?** column ticks when both classifications return the
same number — read down the column to see the page's central thesis in one
glance: the two limits agree as long as every prime axis enters at exponent
${tex`1`}; the moment any prime enters with exponent ${tex`\ge 2`} (or a comma
piles ${tex`3`}-axis steps on top of ${tex`5`}-axis ones), they diverge —
sometimes by a lot.

```ts
// Table cell — sorts the canonical 12 by ascending odd-limit, tiebreaking on
// prime-limit so the rows are reproducible across renders. Pitfall #1: each
// Interval is constructed once from a ratio string; `.monzo` is read at the
// data-row step, and oddLimit/primeLimitOfMonzo are pure monzo→Number
// projections. No `.cents` access here — this table is about the two limits.
// T-02-22/T-02-23: every dynamic surface uses createElement + textContent.
const comparisonTable = (() => {
  const ratioStrings = [
    "9/8",
    "5/4",
    "7/6",
    "81/80",
    "25/24",
    "15/8",
    "9/7",
    "11/8",
    "13/8",
    "81/64",
    "7/4",
    "16/15",
  ];

  const rows = ratioStrings
    .map((s) => {
      const iv = new Interval(s);
      return { iv, ol: oddLimit(iv.monzo), pl: primeLimitOfMonzo(iv.monzo) };
    })
    .sort((a, b) => a.ol - b.ol || a.pl - b.pl);

  const table = document.createElement("table");
  table.className = "limit-comparison-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const h of ["Ratio", "Odd-limit", "Prime-limit", "Agree?"]) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = h;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const { iv, ol, pl } of rows) {
    const tr = document.createElement("tr");

    const ratioCell = document.createElement("td");
    ratioCell.appendChild(ratioPill(iv, { showCents: false }));
    tr.appendChild(ratioCell);

    const olCell = document.createElement("td");
    olCell.className = "num";
    olCell.textContent = String(ol);
    tr.appendChild(olCell);

    const plCell = document.createElement("td");
    plCell.className = "num";
    plCell.textContent = String(pl);
    tr.appendChild(plCell);

    const agreeCell = document.createElement("td");
    agreeCell.className = "agree";
    agreeCell.textContent = ol === pl ? "✓" : "";
    tr.appendChild(agreeCell);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
})();
```

${comparisonTable}

The five agreeing rows are exactly the ratios whose monzo has a single non-zero
entry at exponent ${tex`\pm 1`} — the "axis-1" ratios. Everything else — the
${tex`9/8`}, ${tex`9/7`}, ${tex`15/8`}, ${tex`81/64`}, ${tex`81/80`} of the
literature — diverges because the prime is reused (${tex`9 = 3^{2}`},
${tex`81 = 3^{4}`}) or two primes are mixed (${tex`15 = 3 \cdot 5`}).

## n-odd-limit tonality diamonds

The set of all ratios ${tex`i/j`} for odd ${tex`i, j \le n`}, octave-reduced
into ${tex`[1, 2)`}, is the **${tex`n`}-odd-limit tonality diamond**. Each row
is a utonal chain (fixed ${tex`j`}, ascending ${tex`i`}); each column is an
otonal chain (fixed ${tex`i`}, ascending ${tex`j`}). See
[Otonality & utonality](/pages/otonality-utonality) for the duality the diamond
visualises; odd-limit is its *size*.

```ts
// Build pill rows for the 5- and 7-odd-limit diamond walks. The 11-odd-limit
// diamond is too large (29 pitches) to display inline as pills, so we slice
// out the *new* identities the 9- and 11-axes contribute and leave the full
// 29-pitch diamond to the interactive viz on /.
const pillRow = (intervals) => {
  const span = document.createElement("span");
  span.className = "ratio-pill-row";
  intervals.forEach((iv, i) => {
    span.appendChild(ratioPill(iv));
    if (i < intervals.length - 1) span.appendChild(document.createTextNode(" "));
  });
  return span;
};

// 5-odd-limit — odd identities {1, 3, 5}. Seven distinct octave-reduced pitches.
const odd5 = [
  "1/1",
  "6/5",
  "5/4",
  "4/3",
  "3/2",
  "8/5",
  "5/3",
].map((s) => new Interval(s));

// 7-odd-limit — odd identities {1, 3, 5, 7}. The six NEW pitches the 7-identity
// contributes on top of the 5-odd-limit set.
const odd7New = [
  "8/7",
  "7/6",
  "7/5",
  "10/7",
  "12/7",
  "7/4",
].map((s) => new Interval(s));

// 11-odd-limit — odd identities {1, 3, 5, 7, 9, 11}. The 9-axis contributes
// six new pitches and the 11-axis contributes ten more on top of the 7-odd-limit
// set, sliced out for prose pills below. Ordered by ascending cents within
// each group so the visual reading matches pitch-height.
const odd11From9 = ["10/9", "9/8", "9/7", "14/9", "16/9", "9/5"].map((s) => new Interval(s));
const odd11From11 = ["12/11", "11/10", "11/9", "14/11", "11/8", "16/11", "11/7", "18/11", "20/11", "11/6"].map((s) => new Interval(s));

const row5 = pillRow(odd5);
const row7 = pillRow(odd7New);
const row9add = pillRow(odd11From9);
const row11add = pillRow(odd11From11);
```

### 5-odd-limit — the just diatonic backbone

Odd identities ${tex`\{1, 3, 5\}`}. Seven distinct octave-reduced pitches:

${row5}

${renderDiamondSVG(5, { width: 280, height: 280 })}

This is the world of the just major triad ${tex`4 : 5 : 6 \to 1 : 5/4 : 3/2`}
and its utonal mirror ${tex`1/4 : 1/5 : 1/6 \to 1 : 8/5 : 4/3`}. Almost all of
common-practice Western harmony — expressed in pure-just intonation — lives
inside the 5-odd-limit. Pythagorean intervals like ${ratioPill(new Interval("9/8"))}
are *not* here: their odd-limit is 9, beyond the cap.

### 7-odd-limit — adding the harmonic seventh

Odd identities ${tex`\{1, 3, 5, 7\}`}. The 7-identity contributes six new
pitches on top of the 5-odd-limit set:

${row7}

${renderDiamondSVG(7, { width: 320, height: 320 })}

Adding the ${tex`7`}-identity opens up the ${tex`4 : 5 : 6 : 7`} otonal tetrad
(see [Otonality & utonality](/pages/otonality-utonality)) and its utonal mirror
${tex`1/4 : 1/5 : 1/6 : 1/7`}. The barbershop seventh, the harmonic seventh
chord, and the "blue" notes of early-jazz tradition all live here. Total
distinct pitches in the 7-odd-limit diamond: ${tex`7 + 6 = 13`}.

### 11-odd-limit — Partch's diamond

Odd identities ${tex`\{1, 3, 5, 7, 9, 11\}`}. **Twenty-nine pitches** — this is
**Partch's** diamond, the geometric heart of his 43-tone scale. Inline pills
would overwhelm the page; the interactive grid on the [dashboard](/) is the
right place to explore the whole diamond. What's worth calling out here is
which ratios the *new* identities contribute.

${renderDiamondSVG(11, { width: 440, height: 440 })}

**The 9-identity** adds six new pitches:

${row9add}

These are exactly the ratios whose prime-limit is ${tex`\le 7`} but whose
odd-limit only enters at 9. The flagship example is ${ratioPill(new Interval("9/8"))}:
prime-limit 3, odd-limit 9 — sitting in the 9-cell of Partch's diamond
precisely because partial 9 of the harmonic series is what the ear hears, not
"two stacked thirds of a fifth." Partch treats the composite 9 as a first-class
chord-tone identity for that reason.

**The 11-identity** adds another ten — the bulk of the diamond's growth past 7-odd-limit:

${row11add}

The flagship is ${ratioPill(new Interval("11/8"))} — the undecimal
semi-augmented fourth, ~49¢ flat of the 12-TET tritone. It is not an
"out-of-tune" version of a familiar interval; it is a new pitch class with no
5- or 7-limit equivalent. (See the 11-limit section of [Prime-limits](/pages/prime-limits)
for the audio audition.)

The interactive **tonality diamond** on the [dashboard](/) renders this full
29-cell grid as a clickable SVG. Presets at ${tex`7, 9, 11, 13, 15, 21,`} and
${tex`31`} odd-limit. Click any cell to audition its ratio against the seed
scale's root.

## In the kernel

Both classifications are first-class in the math kernel:

```ts run=false
// src/lib/monzo.ts
import { oddLimit } from "./monzo.js";
oddLimit([-2, 0, 0, 1]);       // → 7   (7/4: numerator's odd factor is 7)
oddLimit([-3, 2]);             // → 9   (9/8: numerator's odd factor is 9)
oddLimit([4, -1, -1]);         // → 15  (16/15: denominator's odd factor is 15)
```

```ts run=false
// src/lib/diamond.ts
import { enumerateDiamond } from "./diamond.js";
enumerateDiamond(11, scale);   // → DiamondCell[] for Partch's 11-odd-limit diamond
```

`enumerateDiamond` uses `Interval.octaveReduce()`'s default period ${tex`2/1`}
— the tonality diamond is octave-bound by definition, regardless of the
consuming scale's own period (Bohlen-Pierce scales still compare against an
octave-bound diamond). Cell membership uses BigInt `Interval.equals` — never
cents-tolerance — so distinct commas (e.g. the syntonic comma vs the schisma)
don't collide under float epsilon (Pitfall #1 / Pitfall #6).

## See also

The [prime-limit](/pages/prime-limits) is the parallel classification by largest
*prime* in the monzo. Prime-limit asks "which dimensions of the JI lattice are
alive?", odd-limit asks "how complex are these harmonic relationships in chord
context?". Both questions matter; neither answer reduces to the other.

[Otonality and utonality](/pages/otonality-utonality) is the *structure* of the
tonality diamond — rows are utonal chains (fixed denominator), columns are
otonal chains (fixed numerator). Odd-limit is the diamond's *size*; otonal /
utonal is its *symmetry*.

The [harmonic series](/pages/harmonic-series) is the prerequisite: every odd
identity ${tex`n`} in an *n*-odd-limit system is partial ${tex`n`} of a
vibrating string. The 11-odd-limit diamond is exactly the set of intervals you
can build *within a single chord* drawn from the first eleven partials.

The interactive **tonality diamond** on the [dashboard](/) is the live version
of the three diamonds walked above — pick an odd-limit preset, click cells to
audition them against your seed scale.

## Further reading

- [Odd limit](https://en.xen.wiki/w/Odd_limit) — Xenharmonic Wiki — community
  reference for the odd-limit classification, including Partch's original
  diamond construction, the *n*-odd-limit set sizes (7-odd-limit: 13 pitches;
  9-odd-limit: 19; 11-odd-limit: 29; 15-odd-limit: 49), and the relationship
  to prime-limit and to consonance metrics like Tenney height.
