# EDO approximations of JI

How 12-, 19-, 31-, and 53-EDO map onto 5-limit and 7-limit just intonation.

```ts
import { Interval } from "../lib/interval.js";
import { centsToRatio } from "../lib/cents.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import * as Plot from "npm:@observablehq/plot";
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
<a href="./prime-limits">prime-limits</a>, <a href="./pythagorean-tuning">Pythagorean tuning</a>, <a href="./meantone">meantone</a>
</aside>

```ts
// Kernel-exact JI anchors (Pitfall #1: BigInt Fraction is the source of truth).
// The five intervals we ask each EDO to hit:
const fifth = new Interval("3/2"); //   701.955¢ — 3-limit
const majorThird = new Interval("5/4"); //   386.314¢ — 5-limit
const harm7 = new Interval("7/4"); //   968.826¢ — 7-limit ("harmonic 7th")
const majorWhole = new Interval("9/8"); //   203.910¢ — 5-limit major whole tone
const harm11 = new Interval("11/8"); //   551.318¢ — 11-limit (tritone neighbour)
const jiIntervals = [
  { label: "3/2", iv: fifth },
  { label: "5/4", iv: majorThird },
  { label: "7/4", iv: harm7 },
  { label: "9/8", iv: majorWhole },
  { label: "11/8", iv: harm11 },
];
const edos = [12, 19, 22, 31, 41, 53, 72];
```

```ts
// Cents-layer nearest-step calc (Pitfall #1: NEVER used as kernel input).
// Mirrors the math in src/lib/edo.ts bestEdosForScale:
//   stepCents = 1200 / N
//   nearest   = Math.round(idealCents / stepCents)
//   error     = nearest * stepCents − idealCents   (signed; positive = EDO step is sharp of JI)
//
// For each EDO N and each JI anchor we record the step number and the signed
// cents deviation; cells render as "k @ ±Δ¢".
const approxMatrix = edos.map((N) => {
  const stepCents = 1200 / N;
  const cells = jiIntervals.map(({ label, iv }) => {
    const ideal = iv.cents;
    const step = Math.round(ideal / stepCents);
    const actual = step * stepCents;
    const error = actual - ideal;
    return { label, step, error };
  });
  return { N, cells };
});
```

```ts
// Plain DOM table — no component, no innerHTML interpolation (Pitfall: T-02-22 XSS).
// All cell contents are textContent on real elements. Precision 2 decimals on the
// cents error (Pitfall #16 — 0.1¢ is the minimum; 2 decimals is enough resolution
// to separate 31-EDO's 5/4 deviation (~+0.78¢) from its 7/4 deviation (~−1.08¢)
// without visual noise).
const deviationTable = (() => {
  const fmtErr = (e) => {
    const rounded = Number(e.toFixed(2));
    const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
    return `${sign}${Math.abs(rounded).toFixed(2)}¢`;
  };
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.textContent = "EDO";
  headerRow.appendChild(corner);
  for (const { label } of jiIntervals) {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const { N, cells } of approxMatrix) {
    const tr = document.createElement("tr");
    const rowLabel = document.createElement("th");
    rowLabel.scope = "row";
    rowLabel.textContent = `${N}-EDO`;
    tr.appendChild(rowLabel);
    for (const c of cells) {
      const td = document.createElement("td");
      td.textContent = `${c.step} @ ${fmtErr(c.error)}`;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
})();
```

```ts
// Scatter chart of signed cents error vs JI cents — one colored series per EDO.
// Complements the deviation table: same data, different projection. Reads
// directly from approxMatrix (already computed above); ji cents come from
// jiIntervals[i].iv.cents at the data-row boundary (display-projection only,
// Pitfall #1). Constant point radius — the point's POSITION encodes the error,
// not its size.
const scatterChart = (() => {
  const data = approxMatrix.flatMap(({ N, cells }) =>
    cells.map((c, i) => ({
      edo: `${N}-EDO`,
      jiLabel: c.label,
      jiCents: jiIntervals[i].iv.cents,
      error: c.error,
    })),
  );
  return Plot.plot({
    width: 720,
    height: 360,
    marginLeft: 60,
    marginRight: 110,
    marginBottom: 50,
    x: {
      label: "JI target (cents)",
      grid: true,
    },
    y: {
      label: "Signed deviation (cents from JI)",
      grid: true,
      tickFormat: (v) => (v > 0 ? `+${v}` : String(v)),
    },
    color: {
      legend: true,
      domain: edos.map((N) => `${N}-EDO`),
    },
    marks: [
      Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
      Plot.dot(data, {
        x: "jiCents",
        y: "error",
        fill: "edo",
        stroke: "edo",
        r: 5,
        title: (d) =>
          `${d.edo} ${d.jiLabel}: ${d.error >= 0 ? "+" : ""}${d.error.toFixed(2)}¢`,
      }),
    ],
  });
})();
```

```ts
// Custom button for the irrational EDO-step pitch. Same pattern as meantone.md:
// .play-btn class for global theming, centsToRatio at the audio boundary,
// synth.playNotes called directly. Pitfall #1: the cents value never becomes
// kernel input.
const playStepAt = (label, cents) => {
  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = `▶ ${label}`;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", () => {
    const baseHz = 440; // D-08
    const ratio = centsToRatio(cents); // display/audio projection
    synth.playNotes([baseHz, baseHz * ratio], 1.5); // D-18 default duration
  });
  return btn;
};

// 31-EDO step 25 = (25/31) * 1200 = 967.741935...¢ — ~1.08¢ flat of pure 7/4.
// 12-EDO step 10 = (10/12) * 1200 = 1000¢ — +31.17¢ sharp of pure 7/4.
const cents31_25 = (25 / 31) * 1200;
const cents12_10 = (10 / 12) * 1200;

const playPure7 = playInterval(harm7, synth, { label: true });
const play31_7 = playStepAt("Play 31-EDO step 25 (≈ 967.74¢)", cents31_25);
const play12_7 = playStepAt("Play 12-EDO step 10 (1000¢)", cents12_10);
```

A [chain of pure 5ths](/pages/pythagorean-tuning) does not close into octaves;
[meantone](/pages/meantone) narrows each 5th to absorb the
[syntonic comma](/pages/syntonic-comma). An **equal division of the octave**
(EDO) goes one step further: divide ${tex`2/1`} into ${tex`N`} equal steps of
${tex`1200/N`} cents and quantize *every* interval to the nearest step. The
question becomes: for a given ${tex`N`}, how good is the approximation of the
JI ratios we care about?

## The construction

For an N-EDO with step size ${tex`s = 1200/N`} cents and a JI target at
${tex`c`} cents, the nearest step is ${tex`k = \mathrm{round}(c/s)`} and the
deviation is ${tex`\Delta = k \cdot s - c`} (positive = the EDO step is sharp
of JI). This is the same nearest-step math used by the
[analysis dashboard](/pages/analysis)'s EDO ↔ JI ranker.

## The seven canonical EDOs

Each row trades a different consonance:

- **12-EDO** is the modern default. ${tex`5/4`} and ${tex`9/8`} land within
  ~14¢ and ~4¢ respectively — usable for 5-limit harmony in passing, though no
  5-limit triad is just-intoned. ${tex`7/4`} and ${tex`11/8`} are out of reach.
- **19-EDO** is the 5-limit specialist. Major thirds land closer to pure
  ${tex`5/4`} than 12-EDO does, and the minor third lands very close to pure
  ${tex`6/5`}. Used historically as a meantone-extension target.
- **22-EDO** is the sharp-fifth 7-limit specialist. Its step size of
  ${tex`\approx 54.55\text{¢}`} produces a 5th of ${tex`\approx 709.09\text{¢}`} —
  ${tex`\approx +7.14\text{¢}`} sharp of pure, the largest 3-limit deviation
  among these seven. The trade is a usable 7-limit: ${tex`7/4`} lands within
  ${tex`\approx 13\text{¢}`}, and the system supports the "superpyth"
  temperament family used in some 20th-century microtonal composition. Pick
  22-EDO when you want 7-limit harmony in a smaller closed system than 31 and
  are willing to accept conspicuously sharp 5ths.
- **31-EDO** is the 7-limit revelation. Step 25 lands within ~1.1¢ of pure
  ${tex`7/4`} and step 10 within ~0.8¢ of pure ${tex`5/4`} — both essentially
  just-intoned. 31-EDO is what microtonal composers reach for when they want a
  closed system that does 7-limit harmony.
- **41-EDO** is the strong 5- and 7-limit performer. Its 5th is within
  ${tex`\approx 0.48\text{¢}`} of pure — second only to 53-EDO among these
  seven — and ${tex`7/4`} lands within ${tex`\approx 3\text{¢}`}. The direct
  nearest-step ${tex`5/4`} sits ${tex`\approx 5.8\text{¢}`} flat (the
  schismatic-temperament mapping via a chain of 5ths brings it much closer,
  but that is beyond this page's straight-quantization framing). 41-EDO is
  the microtonal choice when you want excellent 3-limit AND 7-limit at a step
  size about half of 22-EDO's.
- **53-EDO** closes the cycle of 5ths (Xen Wiki, "53edo"). Step 31 lands
  within ~0.1¢ of pure ${tex`3/2`}; stack 53 of them and you arrive within a
  few cents of 31 octaves. The leftover —
  ${tex`(3/2)^{53} / 2^{31} \approx 3.615\text{¢}`} — is **Mercator's
  comma**, the 3-limit cousin of the
  [Pythagorean comma](/pages/pythagorean-comma) (Xen Wiki, "Mercator's
  comma"). Pythagorean's 12 pure 5ths vs 7 octaves becomes Mercator's 53
  pure 5ths vs 31 octaves. 53-EDO IS the closure of that longer chain.
- **72-EDO** is the modern microtonal reference and an exact superset of
  12-EDO (${tex`72 = 6 \times 12`}, so every 12-EDO pitch is a 72-EDO step;
  Xen Wiki, "72edo").
  With a ${tex`\approx 16.67\text{¢}`} step it lands within
  ${tex`\approx 3\text{¢}`} of every JI anchor on this page. The compromise
  is size: 72 pitches per octave is at the edge of what is practical to
  notate or perform on a fixed-pitch instrument, which is why 72-EDO is more
  often used as a *theoretical* common ground (intersection of 12-, 24-, 36-,
  and many microtonal mappings) than as a target keyboard layout.

## Visualizing the deviations

The scatter chart below shows the same data as the table: x = JI target in
cents, y = signed cents deviation of each EDO's nearest step, one colored
series per EDO. The dashed zero line is pure JI; points above are sharp,
points below are flat. Reading down a vertical column compares all seven EDOs
at one JI target; reading along a series shows how consistently one EDO tracks
JI across the five anchors.

```ts
display(scatterChart);
```

## The deviation table

```ts
display(deviationTable);
```

Rows are EDOs, columns are JI targets; each cell shows the nearest step and the
signed deviation in cents.

## What the table says

- **31-EDO is the 7-limit winner.** Compare the ${tex`7/4`} column across the
  four rows: 12-EDO's step 10 is +31.2¢ off pure ${tex`7/4`} — completely
  uninflected, this is why 12-TET has no 7-limit harmony. 19-EDO's step 15 is
  ~−21¢ off, still too far. 31-EDO's step 25 lands within ~1.1¢ — essentially
  just-intoned. 53-EDO's step 43 is also close (~+4.8¢), but 31-EDO is the
  smallest closed system that gets here.
- **53-EDO is the 3-limit winner.** The ${tex`3/2`} column tells the story:
  12-EDO's 5th is ~−2.0¢ off pure; 19-EDO's is ~−7.2¢; 31-EDO's is ~−5.2¢;
  53-EDO's is ~−0.1¢. For ear training, drone music, and any context where
  pure 5ths matter, 53-EDO is essentially indistinguishable from JI.
- **12-EDO can't do 11.** ${tex`11/8`} sits at ${tex`\approx 551.3\text{¢}`};
  12-EDO's nearest step is the tritone at 600¢, off by ~+48.7¢ — that's
  nearly half a semitone. 31-EDO's step 14 lands within ~9.4¢, and 19-EDO's
  step 9 is ~+17.1¢. The 11-limit is where the gap between 12-EDO and
  microtonal EDOs becomes the most audible.

## Live EDO explorer

Sweep N from 5 to 72 to see which JI anchors snap into tune and which slip out.
The row below uses the same five JI anchors and the same
${tex`k = \mathrm{round}(c/s)`} nearest-step math as the static table above —
only the EDO row changes.

```ts
const liveN = view(
  Inputs.range([5, 72], { step: 1, value: 31, label: "EDO size N" }),
);
```

```ts
// Live deviation row — recomputes reactively when liveN changes.
// Pitfall #1 discipline: the JI anchors stay as Interval (kernel-exact);
// `iv.cents` is the display-layer projection only. No cents value ever
// becomes kernel input.
const liveDeviationTable = (() => {
  const N = liveN;
  const stepCents = 1200 / N;
  const fmtErr = (e) => {
    const rounded = Number(e.toFixed(2));
    const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
    return `${sign}${Math.abs(rounded).toFixed(2)}¢`;
  };
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.textContent = "EDO";
  headerRow.appendChild(corner);
  for (const { label } of jiIntervals) {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  const tr = document.createElement("tr");
  const rowLabel = document.createElement("th");
  rowLabel.scope = "row";
  rowLabel.textContent = `${N}-EDO`;
  tr.appendChild(rowLabel);
  for (const { iv } of jiIntervals) {
    const ideal = iv.cents; // display-layer projection (Pitfall #1)
    const step = Math.round(ideal / stepCents);
    const actual = step * stepCents;
    const error = actual - ideal;
    const td = document.createElement("td");
    td.textContent = `${step} @ ${fmtErr(error)}`;
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
  table.appendChild(tbody);
  return table;
})();
```

```ts
display(liveDeviationTable);
```

## Audition — pure vs 31-EDO vs 12-EDO 7/4

- ${playPure7} sounds the pure ${ratioPill(harm7)}
  (${tex`\approx 968.83\text{¢}`}) — kernel-exact via `Interval`.
- ${play31_7} sounds 31-EDO's nearest step (step 25 ≈ 967.74¢). It should
  sound audibly identical to the pure ${tex`7/4`} — the deviation is ~1.1¢,
  below the just-noticeable difference for most listeners.
- ${play12_7} sounds 12-EDO's nearest step (step 10 = 1000¢, the "minor
  7th"). It should sound audibly different — +31.2¢ sharp, well past the
  ~5–10¢ threshold where the ear starts hearing two distinct pitches
  (Plomp and Levelt 1965; Sethares 2005, §1.1).

The contrast is the point of the page: 31-EDO is what "7-limit harmony in a
closed system" sounds like; 12-EDO cannot do it.

## Why this matters

Equal divisions are the modern composer's bridge between JI's open chain and a
finite, modulation-friendly keyboard. The choice of ${tex`N`} is a choice about
which JI intervals you are willing to lose (Duffin 2007). 12-EDO trades away
7- and 11-limit consonance for ergonomics; 31-EDO buys back the 7-limit (and
most of the 11-limit); 53-EDO buys back essentially perfect 3- and 5-limit.
The math at the top of this page is the lens through which all such tradeoffs
are visible.

## See also

The [analysis dashboard](/pages/analysis) — the same nearest-step calculation
as this page, but interactive: pick any ${tex`N`} from 5 to 1000, any prime- or
odd-limit, and rank by max / RMS / Tenney-weighted error. This page picks four
EDOs and five intervals; the dashboard explores the full space.

The [Pythagorean comma](/pages/pythagorean-comma) — the 12-fifths-vs-7-octaves
closure gap. Mercator's comma is the same idea at a longer chain (53 fifths vs
31 octaves); 53-EDO is the smallest EDO that closes that longer cycle.

[Meantone](/pages/meantone) — the temperament-thread precursor. Meantone
narrows the 5th to absorb the syntonic comma; EDOs go further and quantize
everything to ${tex`N`} equal steps.

## Further reading

- [EDO on the Xenharmonic Wiki](https://en.xen.wiki/w/EDO) — community-curated
  reference for equal divisions of the octave, with the full mapping space
  from trivial small EDOs to extreme high-resolution divisions.
- Per-EDO pages: [12edo](https://en.xen.wiki/w/12edo) ·
  [19edo](https://en.xen.wiki/w/19edo) ·
  [22edo](https://en.xen.wiki/w/22edo) ·
  [31edo](https://en.xen.wiki/w/31edo) ·
  [41edo](https://en.xen.wiki/w/41edo) ·
  [53edo](https://en.xen.wiki/w/53edo) ·
  [72edo](https://en.xen.wiki/w/72edo).

## Sources

- Duffin, Ross W. 2007. *How Equal Temperament Ruined Harmony (And Why You Should Care)*. New York: W. W. Norton.
- Plomp, Reinier, and Willem J. M. Levelt. 1965. "Tonal Consonance and Critical Bandwidth." *Journal of the Acoustical Society of America* 38 (4): 548–560. https://doi.org/10.1121/1.1909741.
- Sethares, William A. 2005. *Tuning, Timbre, Spectrum, Scale*. 2nd ed. London: Springer-Verlag.
- Xenharmonic Wiki. n.d. "53edo." Accessed 2026-05-13. https://en.xen.wiki/w/53edo.
- Xenharmonic Wiki. n.d. "72edo." Accessed 2026-05-13. https://en.xen.wiki/w/72edo.
- Xenharmonic Wiki. n.d. "Mercator's comma." Accessed 2026-05-13. https://en.xen.wiki/w/Mercator's_comma.
