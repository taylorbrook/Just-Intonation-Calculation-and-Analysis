# Meantone temperament

Distributing the syntonic comma across the chain of 5ths — the 16th-century answer to the comma pump.

```ts
import { Interval } from "../lib/interval.js";
import { commaByName } from "../lib/commas.js";
import { centsToRatio } from "../lib/cents.js";
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
// Kernel-exact anchors (Pitfall #1: BigInt Fraction is the source of truth).
const pureFifth = new Interval("3/2");                  //  701.955¢
const pure5Third = new Interval("5/4");                 //  386.314¢ — 5-limit pure major third
const pure6Third = new Interval("6/5");                 //  315.641¢ — 5-limit pure minor third
const pythThird = new Interval("81/64");                //  407.820¢ — Pythagorean major third (4 pure 5ths up, 2 octaves down)
const syntonic = commaByName("syntonic comma")!;        //  81/80 — the comma being distributed
```

```ts
// Cents-layer computation (Pitfall #1: NEVER used as kernel input — cents
// here exists solely to drive the display table and the audio-boundary
// ratio via centsToRatio). The pure-5th and syntonic-comma cents are
// projections of kernel-exact Intervals, so the formula's left half comes
// from `pureFifth.cents` and the right half from `syntonic.cents` — no
// ad-hoc Math.log2 constants in this cell.
//
// 1/n-comma meantone fifth = pure 5th cents − (1/n) × syntonic-comma cents
//                          = 1200*log2(3/2) − (1/n)*1200*log2(81/80)
//
// The derived major third (4 fifths reduced by 2 octaves) and minor third
// (3 fifths reduced by 1 octave, then inverted into the octave) are the
// canonical pedagogical handles for each variant:
//   - 1/4-comma: major third → pure 5/4 (Aron, 1523)
//   - 1/3-comma: minor third → pure 6/5 (Salinas, 1577)
//   - 1/6-comma: a softer compromise between 1/4-comma and 12-TET (Silbermann)
const tempered = (n) => {
  const fifth = pureFifth.cents - syntonic.cents / n;
  const major3 = 4 * fifth - 2400;        // 4 fifths − 2 octaves
  const minor3 = 1200 - (3 * fifth - 1200); // 1 octave − (3 fifths − 1 octave)
  return { n, fifth, major3, minor3 };
};

const quarter = tempered(4);
const third = tempered(3);
const sixth = tempered(6);
const variants = [quarter, third, sixth];
```

```ts
// Plain DOM table — no component, no innerHTML interpolation (Pitfall: T-02-22 XSS).
// All cell contents are textContent on real elements. Precision 3 decimals
// (Pitfall #16 — 0.1¢ minimum; 3 decimals surfaces the sub-cent structure that
// distinguishes the variants).
const variantsTable = (() => {
  const fmt = (c) => c.toFixed(3);
  const rows = [
    { label: "1/4-comma (Aron)",       v: quarter, sig: "pure 5/4 major third" },
    { label: "1/3-comma (Salinas)",    v: third,   sig: "pure 6/5 minor third" },
    { label: "1/6-comma (Silbermann)", v: sixth,   sig: "softer — between 1/4-comma and 12-TET" },
  ];
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Variant", "Tempered 5th (¢)", "Major 3rd (¢)", "Minor 3rd (¢)", "Signature property"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const r of rows) {
    const tr = document.createElement("tr");
    [r.label, fmt(r.v.fifth), fmt(r.v.major3), fmt(r.v.minor3), r.sig].forEach((c) => {
      const td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
})();
```

```ts
// Custom button for the irrational tempered third. Mirrors playInterval's
// .play-btn class so it inherits the global theme (--theme-blue, focus ring,
// typographic ▶).
const playTempered = (label, cents) => {
  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = `▶ ${label}`;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", () => {
    const baseHz = 440;                                  // D-08
    const ratio = centsToRatio(cents);                   // display/audio projection
    synth.playNotes([baseHz, baseHz * ratio], 1.5);      // D-18 default duration
  });
  return btn;
};

const playPureMajor3 = playInterval(pure5Third, synth, { label: true });
const playQuarterMajor3 = playTempered("Play 1/4-comma meantone major 3rd", quarter.major3);
const playPythMajor3 = playInterval(pythThird, synth, { label: true });
```

A [chain of pure 3/2 fifths](/pages/pythagorean-tuning) does not produce
consonant major thirds — stack four of them and you land on
${ratioPill(pythThird)}, the *Pythagorean* major third, ${tex`\approx 407.8\text{¢}`} —
bright but rough, a [syntonic comma](/pages/syntonic-comma)
(${tex`81/80 \approx 21.5\text{¢}`}) wider than the pure 5-limit ${tex`5/4`}.
**Meantone temperament** is the 16th-century answer: narrow *every* fifth by a
fraction of the syntonic comma so that after four fifths the comma has been
entirely absorbed. The chain of fifths still walks the same scale degrees, but
each fifth pays a small consonant cost so that the thirds arrive consonant.

## The construction

${tex`f_n \;=\; 1200 \log_2 \tfrac{3}{2} \;-\; \tfrac{1}{n} \cdot 1200 \log_2 \tfrac{81}{80}`}

where ${tex`f_n`} is the tempered fifth in cents and ${tex`n`} is the variant's
denominator. Each fifth loses ${tex`(1/n)`} of the syntonic comma; after four
fifths reduced by two octaves, the major third has lost ${tex`(4/n)`} of a
comma relative to the Pythagorean ${tex`81/64`}.

## Three historical choices for ${tex`n`}

```ts
display(variantsTable);
```

- **1/4-comma meantone (Pietro Aron, 1523).** Each fifth narrowed by
  ${tex`\tfrac{1}{4}`} of a syntonic comma. After four fifths reduced by two
  octaves the major third has *exactly* absorbed the comma — it lands on
  ${ratioPill(pure5Third)} (${tex`5/4`}), the 5-limit pure major third. This is
  meantone's headline property: the major triad is just-intoned. The price is
  fifths that beat audibly (~5.4¢ flat of pure) and a wolf 5th somewhere on the
  chain that's much wider than in Pythagorean tuning.
- **1/3-comma meantone (Francisco Salinas, 1577).** Each fifth narrowed by
  ${tex`\tfrac{1}{3}`} of a syntonic comma. The minor third lands on
  ${ratioPill(pure6Third)} (${tex`6/5`}), the 5-limit pure *minor* third. The
  major thirds are now slightly flat of pure 5/4 (by ${tex`\tfrac{1}{3}`} of a
  comma), and the fifths are flatter still (~7.2¢ flat of pure). Used when
  minor triads are the priority.
- **1/6-comma meantone (Gottfried Silbermann).** Each fifth narrowed by
  ${tex`\tfrac{1}{6}`} of a syntonic comma. Major thirds are sharp of pure 5/4
  by ${tex`\tfrac{2}{3}`} of a comma; fifths only ~3.6¢ flat of pure. A softer
  compromise — neither thirds nor fifths are pure, but the wolf is milder than
  in 1/4-comma and the system handles modulation more gracefully. The
  historical bridge from 1/4-comma meantone to well-tempered systems and
  ultimately 12-TET.

## Audition — the 1/4-comma equivalence

Two buttons that sound audibly identical:

- ${playPureMajor3} sounds the 5-limit pure major third (${ratioPill(pure5Third)},
  ${tex`\approx 386.3\text{¢}`}) — kernel-exact via `Interval`.
- ${playQuarterMajor3} sounds the 1/4-comma meantone major third — built by
  stacking four tempered fifths and reducing by two octaves, computed entirely
  in cents (${tex`4 \times f_4 - 2400`}), then converted back to a frequency
  ratio via `centsToRatio`. The kernel never sees this number.

They sound the same. That is the entire pedagogical point of 1/4-comma
meantone: by tempering each fifth by exactly ${tex`\tfrac{1}{4}`} of a syntonic
comma, the major third arrives at the pure ${tex`5/4`} ratio — to within the
precision of the cents projection itself.

## Audition — the "before"

${playPythMajor3} sounds the Pythagorean major third ${ratioPill(pythThird)}
for contrast. Sound it against the pure 5/4 above and the syntonic comma is
audible as a beat-rate: ~21.5¢ wide.

## Why this layering matters

The kernel-exact / display-cents split — `Interval` for rationals,
`centsToRatio` only when the temperament makes the interval irrational — is
the discipline that lets us reason about *any* tuning system without losing
precision on its rational anchors. Pythagorean and pure JI are kernel-exact
through and through; meantone, well-temperaments, and EDOs need cents at the
boundary, but the consonant anchors (pure thirds, pure fifths) stay in
BigInt.

## See also

The [syntonic comma](/pages/syntonic-comma) — the ${tex`81/80`} ratio that
meantone distributes. The syntonic-comma page defines the interval; this page
shows three different ways to absorb it into a 12-tone scale.

[Pythagorean tuning](/pages/pythagorean-tuning) — the "before": twelve pure
3/2 fifths and the resulting wide ${tex`81/64`} major third. Meantone is the
answer to the question "what if we narrow each fifth a little so the third
comes back to pure?"

The [dashboard](/) — paste in any of the tempered ratios from above (e.g.
`centsToRatio(696.578)` is about ${tex`1.4953`}, ~0.3% below pure ${tex`3/2 = 1.5`})
and hear the temperament against a drone. Or stay on the kernel side: the 1/4-comma meantone scale
is the 5-limit pure scale `1/1 9/8 5/4 4/3 3/2 5/3 15/8 2/1` — already pure
${tex`5/4`}s and ${tex`6/5`}s where the chain of meantone fifths brings them.
