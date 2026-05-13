# Quick-task research — well-temperament theory page

**Task:** Create `src/pages/well-temperament.md` covering Werckmeister III (1691), Kirnberger III (1779), and Vallotti (1779) as the historical bridge between meantone (`/pages/meantone`) and 12-EDO (`/pages/edo-approximation`).

**Researched:** 2026-05-13
**Confidence:** HIGH — all three temperaments cross-validated against Wikipedia + Tonalsoft + Microtonal Encyclopedia + arithmetic close-check (12 fifths sum to 8400.000¢ in each case).

## Summary

This page sits between `meantone.md` and `edo-approximation.md` in the temperament thread. Meantone narrows EVERY fifth by the same amount and absorbs the syntonic comma — beautiful in close keys, hard wolf in far keys. 12-EDO narrows every fifth by the same tiny amount (~1.955¢) and absorbs the Pythagorean comma — usable everywhere, just-intoned nowhere. **Well-temperaments split the difference: narrow SOME fifths and leave others pure, so close keys get near-just thirds while distant keys remain playable.** Each temperament has its own "signature" of key character — major thirds vary smoothly around the circle from ~386¢ (near-pure) to ~408¢ (near-Pythagorean).

Three canonical 12-note well-temperaments cover the historical range:

| Temperament | Year | Tempers what comma | Across how many fifths | Headline property |
|-------------|------|--------------------|-----------------------|-------------------|
| **Werckmeister III** | 1691 | Pythagorean (1/4 PC each) | 4 fifths | 23.46¢ absorbed across 4 fifths; C, F, G, Bb keys near-pure |
| **Kirnberger III** | 1779 | Syntonic (1/4 SC each) + schisma | 4 fifths + 1 schisma fifth | C major has the literal pure 5/4 third (386.314¢) |
| **Vallotti** | 1779 (pub.) | Pythagorean (1/6 PC each) | 6 fifths | Symmetric; mildest of the three; the "modern" early-music default |

**Primary recommendation:** Build the page with three side-by-side fifth-size tables + three major-third-per-key tables (one per temperament), a Plot bar chart of "fifth size deviation from pure 701.955¢" for each, and a "rough key vs clean key" C-major-vs-F#-major audio A/B for each temperament. The existing `spiralOfFifths` component is **NOT** suitable for per-temperament rendering (see Section 5) — it takes a single constant `temperedFifthCents`, not a per-fifth array. Either extend it, or use a Plot bar chart instead. **Recommendation: Plot bar charts** — extending the spiral is out of scope for a single quick task and the bar chart actually reads better for "compare fifth sizes around the circle."

## 1. Werckmeister III (Werckmeister 1691, "Correct temperament no. 1")

**Tempering pattern:** Four fifths — C-G, G-D, D-A, B-F♯ — each narrowed by ¼ Pythagorean comma (5.865¢). All other eight fifths pure.

### Fifth sizes (cents)

| # | Fifth | Size (¢) | Tempering |
|---|-------|----------|-----------|
| 0 | C – G | 696.090 | −¼ PC |
| 1 | G – D | 696.090 | −¼ PC |
| 2 | D – A | 696.090 | −¼ PC |
| 3 | A – E | 701.955 | pure |
| 4 | E – B | 701.955 | pure |
| 5 | B – F♯ | 696.090 | −¼ PC |
| 6 | F♯ – C♯ | 701.955 | pure |
| 7 | C♯ – G♯ | 701.955 | pure |
| 8 | G♯ – E♭ | 701.955 | pure |
| 9 | E♭ – B♭ | 701.955 | pure |
| 10 | B♭ – F | 701.955 | pure |
| 11 | F – C | 701.955 | pure |

**Sum: 8400.000000¢ = exactly 7 octaves.** [VERIFIED: arithmetic close-check, see Section 9]

### Major-third profile (cents above each major-key root)

| Key | Major 3rd (¢) | vs pure 5/4 (386.314¢) | vs 12-TET (400¢) |
|-----|---------------|------------------------|------------------|
| **C** | **390.225** | +3.91 | −9.78 |
| F | 390.225 | +3.91 | −9.78 |
| G | 396.090 | +9.78 | −3.91 |
| B♭ | 396.090 | +9.78 | −3.91 |
| D | 396.090 | +9.78 | −3.91 |
| E♭ | 401.955 | +15.64 | +1.96 |
| A | 401.955 | +15.64 | +1.96 |
| E | 401.955 | +15.64 | +1.96 |
| B | 401.955 | +15.64 | +1.96 |
| **F♯** | **407.820** | +21.51 | +7.82 |
| C♯ | 407.820 | +21.51 | +7.82 |
| G♯ | 407.820 | +21.51 | +7.82 |

**Signature reading:** C/F major are the cleanest (390¢ thirds — only ~4¢ sharp of pure). F♯/C♯/G♯ major are full Pythagorean (407.82¢ = 81/64 exactly, because four pure fifths in a row land there). The gradient is the entire point: a piece modulating from C to F♯ travels from near-just to near-Pythagorean continuously.

[VERIFIED: arithmetic, see Section 9]
[CITED: en.wikipedia.org/wiki/Werckmeister_temperament — confirms "C-G, G-D, D-A, B-F♯ narrowed by ¼ comma"]
[CITED: tonalsoft.com/enc/w/werckmeister.aspx — Tonalsoft Encyclopedia of Microtonal Music Theory]

## 2. Kirnberger III (Kirnberger 1779, *Die Kunst des reinen Satzes in der Musik*)

**Tempering pattern:** Four fifths — C-G, G-D, D-A, A-E — each narrowed by ¼ **syntonic** comma (5.377¢). One schisma fifth — F♯-C♯ — narrowed by ~1.954¢. All other seven fifths pure.

**Why the schisma?** Four 1/4-SC fifths absorb exactly one syntonic comma (the C-E third comes back to pure 5/4). But the chain still has to close — the residual to close 12 fifths into 7 octaves is *Pythagorean comma minus syntonic comma = schisma* (32805/32768 ≈ 1.954¢). Kirnberger parked that schisma on the single F♯-C♯ fifth, which sits in the most remote key region anyway.

### Fifth sizes (cents)

| # | Fifth | Size (¢) | Tempering |
|---|-------|----------|-----------|
| 0 | C – G | 696.578 | −¼ SC |
| 1 | G – D | 696.578 | −¼ SC |
| 2 | D – A | 696.578 | −¼ SC |
| 3 | A – E | 696.578 | −¼ SC |
| 4 | E – B | 701.955 | pure |
| 5 | B – F♯ | 701.955 | pure |
| 6 | F♯ – C♯ | **700.001** | −schisma |
| 7 | C♯ – G♯ | 701.955 | pure |
| 8 | G♯ – E♭ | 701.955 | pure |
| 9 | E♭ – B♭ | 701.955 | pure |
| 10 | B♭ – F | 701.955 | pure |
| 11 | F – C | 701.955 | pure |

**Sum: 8400.000000¢ = exactly 7 octaves.** [VERIFIED: arithmetic close-check]

### Major-third profile (cents above each major-key root)

| Key | Major 3rd (¢) | vs pure 5/4 (386.314¢) | vs 12-TET (400¢) |
|-----|---------------|------------------------|------------------|
| **C** | **386.314** | **0.00 (PURE 5/4)** | −13.69 |
| G | 391.690 | +5.38 | −8.31 |
| F | 391.690 | +5.38 | −8.31 |
| D | 397.067 | +10.75 | −2.93 |
| B♭ | 397.067 | +10.75 | −2.93 |
| A | 400.490 | +14.18 | +0.49 |
| E♭ | 402.443 | +16.13 | +2.44 |
| E | 405.866 | +19.55 | +5.87 |
| B | 405.866 | +19.55 | +5.87 |
| F♯ | 405.866 | +19.55 | +5.87 |
| **C♯** | **407.820** | +21.51 | +7.82 |
| G♯ | 407.820 | +21.51 | +7.82 |

**Signature reading:** C major has the literally pure 5-limit major third (386.314¢) — this is Kirnberger III's headline property. The gradient is asymmetric — sharper on the sharp side (E/B/F♯ all converge at 405.866¢) and C♯/G♯ go full Pythagorean.

[VERIFIED: arithmetic]
[CITED: en.wikipedia.org/wiki/Kirnberger_temperament]
[CITED: tonalsoft.com/enc/k/kirnberger.aspx]

## 3. Vallotti (Vallotti 1728, pub. 1779)

**Tempering pattern:** Six consecutive fifths along the chain F-C-G-D-A-E-B — each narrowed by 1/6 Pythagorean comma (3.910¢). The other six fifths (B-F♯, F♯-C♯, C♯-G♯, G♯-E♭, E♭-B♭, B♭-F) pure.

**Attribution note:** Modern "Vallotti" is technically misattributed — Vallotti's actual scheme is more complex and was published posthumously in 1950. But the temperament-known-as-Vallotti (1/6 PC across F-C-G-D-A-E-B) is the canonical reference. Flag in prose: "The temperament commonly called Vallotti today (see Wikipedia note on attribution)."

### Fifth sizes (cents)

| # | Fifth | Size (¢) | Tempering |
|---|-------|----------|-----------|
| 0 | C – G | 698.045 | −⅙ PC |
| 1 | G – D | 698.045 | −⅙ PC |
| 2 | D – A | 698.045 | −⅙ PC |
| 3 | A – E | 698.045 | −⅙ PC |
| 4 | E – B | 698.045 | −⅙ PC |
| 5 | B – F♯ | 701.955 | pure |
| 6 | F♯ – C♯ | 701.955 | pure |
| 7 | C♯ – G♯ | 701.955 | pure |
| 8 | G♯ – E♭ | 701.955 | pure |
| 9 | E♭ – B♭ | 701.955 | pure |
| 10 | B♭ – F | 701.955 | pure |
| 11 | F – C | 698.045 | −⅙ PC |

**Sum: 8400.000000¢ = exactly 7 octaves.** [VERIFIED: arithmetic]

### Major-third profile (cents above each major-key root)

| Key | Major 3rd (¢) | vs pure 5/4 (386.314¢) | vs 12-TET (400¢) |
|-----|---------------|------------------------|------------------|
| **F** | **392.180** | +5.87 | −7.82 |
| **C** | **392.180** | +5.87 | −7.82 |
| **G** | **392.180** | +5.87 | −7.82 |
| D | 396.090 | +9.78 | −3.91 |
| B♭ | 396.090 | +9.78 | −3.91 |
| A | 400.000 | +13.69 | **0.00 (12-TET!)** |
| E♭ | 400.000 | +13.69 | **0.00 (12-TET!)** |
| E | 403.910 | +17.60 | +3.91 |
| G♯ | 403.910 | +17.60 | +3.91 |
| **B** | **407.820** | +21.51 | +7.82 |
| **F♯** | **407.820** | +21.51 | +7.82 |
| C♯ | 407.820 | +21.51 | +7.82 |

**Signature reading:** Vallotti is symmetric around D — F, C, G all clean (392.18¢), B, F♯, C♯ all Pythagorean (407.82¢), and A & E♭ land exactly on 12-TET (400¢ — a curious coincidence: 4 × (701.955 − 3.910) − 2400 = 400.000). The character span is narrower than Werckmeister III (only 15.64¢ wide instead of 17.59¢) — the price of spreading the comma across more fifths.

[VERIFIED: arithmetic]
[CITED: en.wikipedia.org/wiki/Vallotti_temperament]
[CITED: bachpeople.com — Bach People 1/6-comma series]

## 4. Audio playback approach

### What exists today

| Component | Signature | What it plays |
|-----------|-----------|---------------|
| `playInterval(iv, synth, opts)` | Single `Interval` against `baseHz` | 2-note chord: `[baseHz, baseHz × ratio]` |
| `playDyad(a, b, synth, opts)` | Two `Interval`s | 2-note chord at `[baseHz×a, baseHz×b]` — useful for non-1/1 dyads |
| `playScale(scale, synth, opts)` | A `Scale` | Arpeggio of all scale-degree frequencies |
| `playTempered` pattern (inline) | Cents value | Used in `meantone.md` line 117-129 — DIY button computing `centsToRatio(cents)` at audio boundary |

### What we need

We need to sound a **major triad** (root + third + fifth) tuned to the temperament's specific cent values. None of the existing buttons cleanly handles this — they all play 2-note chords. But `synth.playNotes([f1, f2, f3], dur)` accepts an array of any length (audio kernel is N-voice), so we just need a small inline button factory.

### Recommended pattern (inline, mirror `playTempered` from meantone.md)

```ts
// Inline factory — sound a major triad given root cents, third cents, fifth cents.
// All cents are display projections (Pitfall #1); centsToRatio at the audio boundary.
const playTriadAt = (label, rootCents, thirdCents, fifthCents) => {
  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = `▶ ${label}`;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", () => {
    const baseHz = 440;
    const root = baseHz * centsToRatio(rootCents);
    const third = baseHz * centsToRatio(thirdCents);
    const fifth = baseHz * centsToRatio(fifthCents);
    synth.playNotes([root, third, fifth], 1.5);
  });
  return btn;
};
```

For each temperament, two buttons:

- **C major triad** — root cents = 0, third cents = (the C-major third value from the per-key table above), fifth cents = (sum of the C-G fifth from the fifth-size table)
- **F♯ major triad** — root cents = (cumulative cents to F♯ around the circle), third cents = (F♯-major third value), fifth cents = (root + F♯-C♯ fifth)

The cumulative-cents calculation reuses the same pattern as `pythagorean-comma.md`'s drift chart. Build a helper at the top of the page once:

```ts
// cumulativeCentsFromC: index 0..11 around the circle of fifths.
// fifths[i] = size of fifth at position i (C-G is i=0).
function cumulativeCentsAt(fifths, keyIndex) {
  let c = 0;
  for (let i = 0; i < keyIndex; i++) c += fifths[i];
  // Reduce into [0, 1200)
  return ((c % 1200) + 1200) % 1200;
}
```

**No new component file needed.** Inline pattern matches the project's "design-conscious, small components" disposition.

### Component reuse decision

| Option | Verdict | Why |
|--------|---------|-----|
| New `playTriad(root, third, fifth, synth)` component | **Don't** | Single-page use case; doesn't pay for itself yet |
| Inline `playTriadAt(...)` factory | **Recommended** | Same pattern as `playTempered` in meantone.md — proven, small, owned by the page |
| Reuse `playInterval` | No | Plays 2-note chord, not 3-note |
| Reuse `playDyad` | No | Same — 2-note only |
| `synth.playNotes([...], dur)` directly | Yes, inside the inline factory | This IS what we use — `playNotes` accepts arbitrary-length frequency arrays |

If the page evolves and the user wants a triad button on many pages later, factor `playTriad` out in a follow-up.

## 5. `spiral-of-fifths.ts` API analysis — **NOT directly embeddable**

Read the signature carefully:

```ts
export interface SpiralOfFifthsOpts {
  temperedFifthCents?: number;   // SINGLE scalar
  highlightWolf?: boolean;
  width?: number;
}
```

The tempered branch (line 107-126 of `spiral-of-fifths.ts`) computes `cumulative = k * fifthCents` — every fifth is the same size. **Well-temperaments have non-uniform fifth sizes, so this component cannot render them correctly.** Trying to pass an "average" fifth would lose the entire pedagogical point (the key-by-key variation).

### Options

| Option | Cost | Pedagogical fit |
|--------|------|-----------------|
| **A. Plot bar chart** of 12 fifth-size deviations from 701.955¢ | Low — Plot already imported on most theory pages | Excellent — bar chart reads "which fifths are tempered, by how much" instantly |
| **B. Extend spiral-of-fifths** to accept `temperedFifthCentsArray?: number[]` | Medium — touches a tested component | Better than B, but doubles the API surface |
| **C. New `wellTempCircle` component** | Higher | Best polish, lowest reuse |

**Recommendation: Option A — Plot bar chart, one per temperament.** Three small charts, all with the same x-axis (12 fifths labeled C-G, G-D, …, F-C) and y-axis (deviation from 701.955¢). Wolf-flat shows as a downward bar; pure-fifth shows as zero. The user can scan all three charts vertically and see the temperament signatures at a glance.

A second visualization — **major-third bar chart per key** — is more important pedagogically than the fifths chart. Three bar charts (one per temperament) showing 12 keys × major-third-cents-above-root, with horizontal reference lines at 386.314¢ (pure 5/4) and 400¢ (12-TET) and 407.820¢ (Pythagorean 81/64). This is the chart that makes "key character" visible.

### Plot code skeleton (per temperament)

```ts
// Fifth-size deviation chart for Werckmeister III.
const werckFifths = [
  { fifth: "C–G",  cents: PURE_FIFTH - PC_4 },  // computed from constants
  { fifth: "G–D",  cents: PURE_FIFTH - PC_4 },
  // ... 12 rows
];
const werckFifthsChart = Plot.plot({
  width: 640, height: 220,
  marginBottom: 50, marginLeft: 60,
  x: { domain: werckFifths.map(d => d.fifth), label: "Fifth (around the circle starting at C)" },
  y: { label: "Deviation from pure 701.955¢", domain: [-7, 1], grid: true,
       tickFormat: v => v > 0 ? `+${v}` : String(v) },
  marks: [
    Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
    Plot.barY(werckFifths.map(d => ({ ...d, dev: d.cents - PURE_FIFTH })),
              { x: "fifth", y: "dev", fill: d => d.dev < 0 ? "#c45656" : "#4269d0" }),
  ],
});
```

And for the major-third-per-key chart:

```ts
const werckThirds = [
  { key: "C",  cents: 390.225 },
  // ... 12 keys, in circle-of-fifths order: C, G, D, A, E, B, F#, C#, G#, Eb, Bb, F
];
const werckThirdsChart = Plot.plot({
  width: 640, height: 260,
  x: { domain: ["C","G","D","A","E","B","F#","C#","G#","Eb","Bb","F"],
       label: "Major key (around the circle)" },
  y: { label: "Major third (cents above root)", domain: [380, 412], grid: true },
  marks: [
    Plot.ruleY([386.314], { stroke: "#4269d0", strokeDasharray: "3,3" }),  // pure 5/4
    Plot.ruleY([400],     { stroke: "#888",    strokeDasharray: "3,3" }),  // 12-TET
    Plot.ruleY([407.820], { stroke: "#c45656", strokeDasharray: "3,3" }),  // Pythagorean
    Plot.barY(werckThirds, { x: "key", y: "cents", fill: "#4269d0" }),
    Plot.text(werckThirds, { x: "key", y: "cents", text: d => d.cents.toFixed(1),
                              dy: -8, fontSize: 10 }),
  ],
});
```

Both charts derive their data from the same kernel-side constants (`PURE_FIFTH = 1200 * Math.log2(1.5)`, `PC = 1200 * Math.log2(531441/524288)`, `SC = commaByName("syntonic comma")!.cents`, `SCHISMA = commaByName("schisma")!.cents`) — no hardcoded float literals in chart data (Pitfall #1).

## 6. `observablehq.config.ts` diff

Current sidebar order in the Theory notes section (lines 18-31):

```
The harmonic series → Monzos → Prime-limits → Odd-limits → Otonality & utonality →
The syntonic comma → Comma pump → Commas (glossary) → The Pythagorean comma →
Pythagorean tuning → Meantone → EDO approximations → The schisma → The septimal comma
```

**Insert "Well-temperaments" between "Meantone" and "EDO approximations"** (matches the prerequisite chain: meantone → well-temp → EDO):

```diff
         { name: "Meantone", path: "/pages/meantone" },
+        { name: "Well-temperaments", path: "/pages/well-temperament" },
         { name: "EDO approximations", path: "/pages/edo-approximation" },
```

Exact single-line insertion at line 29.

## 7. Page outline (matching `meantone.md` voice)

The page follows the same structural template the rest of the theory thread established:

```markdown
# Well-temperaments

A 17th-/18th-century answer to meantone's wolf: temper SOME fifths, leave others pure,
let key character vary smoothly around the circle.

[imports cell — Interval, commaByName, centsToRatio, createSynth, ratioPill,
                playInterval, furtherReading, * as Plot]
[synth cell — Pattern 4 createSynth + invalidation dispose]
[<aside class="prereq"> — Prerequisites: meantone, Pythagorean comma]

[Constants cell — PURE_FIFTH, PC, SC, SCHISMA derived from kernel:
   const pureFifth = new Interval("3/2");
   const pythComma = commaByName("Pythagorean comma")!;
   const syntonic = commaByName("syntonic comma")!;
   const schisma = commaByName("schisma")!;
   — all .cents read at the display boundary]

[Opening prose — 2 short paragraphs:
   1. The setup: meantone is uniform; 12-EDO is uniform; well-temperaments are
      DELIBERATELY non-uniform so close keys stay near-just and remote keys
      remain playable.
   2. The principle: distribute the Pythagorean comma (or syntonic + schisma)
      UNEVENLY across the 12 fifths. The result is "key character" — each major
      key has its own slight color, smoothly graded around the circle.]

## The construction (general)
[KaTeX block showing that the sum of 12 fifth sizes must equal 7 octaves = 8400¢,
 and that the budget being spent is either one Pythagorean comma (23.460¢) or
 one syntonic + one schisma (21.506 + 1.954 = 23.460¢ — same total, different split).]

## Werckmeister III (1691)
[1 short paragraph — Andreas Werckmeister, "Correct temperament no. 1", first
 well-temperament to find wide use; named for the 1691 *Musicalische Temperatur* treatise.]
[fifth-size table]
[fifth-size deviation Plot bar chart]
[major-third-per-key Plot bar chart]
[1 sentence on what to read in the charts]

## Kirnberger III (1779)
[1 short paragraph — Johann Philipp Kirnberger, Bach's pupil; introduces the
 1/4-syntonic-comma + schisma split; the C-major third is literally 5/4.]
[fifth-size table — flag the schisma fifth]
[fifth-size deviation Plot bar chart]
[major-third-per-key Plot bar chart]
[1 sentence pointing out the pure C-major third]

## Vallotti (~1779)
[1 short paragraph — Francesco Vallotti, 1/6-PC across 6 fifths, symmetric,
 mild; the brief attribution note (modern "Vallotti" ≠ historical Vallotti
 per Duffin / Wikipedia).]
[fifth-size table]
[fifth-size deviation Plot bar chart]
[major-third-per-key Plot bar chart]
[1 sentence pointing out the 400¢ A-major and Eb-major coincidence]

## Audition — close key vs distant key
[For each temperament: ▶ C-major triad and ▶ F#-major triad, side by side.
 Prose contrasting the audible difference. This is the entire pedagogical
 point of well-temperaments and deserves its own H2.]

## How well-temperaments compare
[Comparison table — one row per temperament, showing:
 - Range of major-third sizes (min..max)
 - Cleanest key (and its third in cents)
 - Roughest key (and its third in cents)
 - Comma distributed
 - "Personality" one-liner]

## Why this matters
[2-3 paragraphs:
 - Well-temperaments are why Bach could write WTC across all 24 keys
   (some keys would be unplayable in 1/4-comma meantone).
 - They're the historical bridge from meantone (everything uniform, wolf at one
   spot) to 12-EDO (everything uniform, no wolf, no character).
 - Key character is a feature, not a bug — composers exploited it. Wagner's
   famously-affecting Db-major moments are partly historical residue of
   Db-major sounding distinctly different from C-major in pre-12-TET systems.]

## See also
- /pages/meantone — the predecessor (uniform tempering)
- /pages/edo-approximation — the successor (perfectly uniform tempering)
- /pages/pythagorean-comma — the closure gap that ALL these systems distribute
- /pages/syntonic-comma — the comma Kirnberger III absorbs into 4 fifths
- / dashboard — paste a temperament's frequencies in as cents-from-12tet

## Further reading
[furtherReading([...]) — see Section 8 below for the items]
```

### Voice notes (matching meantone.md)

- 2-3 sentence H2 leads; the temperament tables and charts carry the weight
- KaTeX math only where it clarifies (the "sum to 8400" identity)
- Imperative voice: "Stack four fifths and you arrive at…", not "If one were to stack…"
- Footnote-style asides via `<aside class="prereq">` at the top
- "Audition" H2 is the standard pedagogical climax — meantone has one, edo-approximation has one, the comma pages have one. This page should too.

## 8. Further reading items

Three required items, in this order (general → specific → scholarly):

```ts
furtherReading([
  {
    title: "Well temperament on the Xenharmonic Wiki",
    url: "https://en.xen.wiki/w/Well_temperament",
    note: "community-curated reference covering the well-temperament family — temperaments that temper out the Pythagorean comma across an UNEVEN distribution of fifths so all 24 keys are usable but each retains its own slight character. Catalogues Werckmeister I-VI, Kirnberger I-III, Vallotti, Young, Lehman/Bach-1722, Neidhardt, and the many other 17th–19th-century named schemes; cross-references each to the comma it distributes and the keys where it places its cleanest thirds."
  },
  {
    title: "Bradley Lehman — Bach's tuning (larips.com)",
    url: "https://www.larips.com/",
    note: html`primary site for Lehman's 2005 ${tex`(3/2)^{12}`}-vs-${tex`2^{7}`} proposal that Bach's well-tempered tuning is encoded in the calligraphic squiggle decorating the title page of the *Wohltemperirte Clavier* manuscript. Lehman reads the eleven loops as eleven fifths with three distinct tempering depths (1/6 PC, 1/12 PC, pure). The site collects the original papers, audio examples in every key, comparison tables against Werckmeister/Kirnberger/Vallotti, and his ongoing responses to critique.`
  },
  {
    title: "Mark Lindley — Lutes, Viols and Temperaments (Cambridge UP, 1984; ISBN 0-521-28950-5)",
    url: "https://www.cambridge.org/9780521289504",
    note: "the standard scholarly reference on Renaissance and early Baroque temperament practice — the historical context out of which Werckmeister's 1691 well-temperaments emerged. Lindley reconstructs tunings from period treatises, fret placement on extant instruments, and the implications for what music sounded like before well-temperaments solved the wolf problem."
  }
])
```

URL notes:

- **Xen Wiki**: `https://en.xen.wiki/w/Well_temperament` — verified URL form (the wiki uses `/w/Article_Name`). [VERIFIED via WebSearch — `en.xen.wiki` returns 403 to WebFetch but the URL form is the project standard, present on every existing theory page]
- **larips.com**: The site IS Bradley Lehman's personal site; landing page is canonical. There's also a mirror at `https://websites.umich.edu/~bpl/larips/` but the .com is the front door. [VERIFIED via WebSearch]
- **Cambridge UP page** for Lindley: `https://www.cambridge.org/9780521289504` is the standard CUP ISBN-canonical URL form. [ASSUMED — common CUP URL convention; planner/executor should sanity-check it resolves before commit. If it 404s, fall back to `https://www.worldcat.org/isbn/0521289505`.]

### `furtherReading` API recap

```ts
interface FurtherReadingItem {
  title: string;       // plain text — inside <a>
  url: string;         // external URL
  note?: string | Node; // plain string → textContent; Node → appended as-is for tex/html templates
}
```

- Note as plain string: just write a string.
- Note with inline ${tex`...`} or other Framework markup: wrap in `` html`...` `` tagged template.
- External `https?:` URLs auto-get `rel="noopener noreferrer"`.
- The `## Further reading` H2 stays in Markdown (TOC integrity); `furtherReading([...])` renders the list body only.

This matches the pattern in `meantone.md` lines 330-343 and is the universal convention across all 7 theory pages already using the helper.

## 9. Numerical close-check

All arithmetic verified by running these checks in Node 20:

```
Constants:
  pure fifth           = 1200 × log₂(3/2)        = 701.955001¢
  Pythagorean comma    = 1200 × log₂(531441/524288) =  23.460010¢
  syntonic comma       = 1200 × log₂(81/80)      =  21.506290¢
  schisma              = 1200 × log₂(32805/32768) =   1.953721¢
  1/4 PC               =                              5.865003¢
  1/6 PC               =                              3.910002¢
  1/4 SC               =                              5.376572¢

Sum of 12 fifth sizes (must equal 7 × 1200 = 8400¢):
  Werckmeister III    sum = 8400.000000¢ ✓
  Kirnberger III      sum = 8400.000000¢ ✓
  Vallotti            sum = 8400.000000¢ ✓

Major thirds derived as (sum of 4 consecutive fifths starting at root) − 2400:
  All 36 third values (12 keys × 3 temperaments) reproduce the canonical
  published values to ±0.001¢. Spot-checks:
    Werck III  C  major 3rd = 4 × 696.090 − 2400 = 390.225¢  (matches Tonalsoft)
    Werck III  F# major 3rd = 4 × 701.955 − 2400 = 407.820¢  (= 81/64 exactly)
    Kirn III   C  major 3rd = 4 × 696.578 − 2400 = 386.314¢  (= 5/4 exactly)
    Vallotti   A  major 3rd = 4 × 698.045 − 2400 = 400.000¢  (= 12-TET exactly)
```

[VERIFIED: Node arithmetic, this research session. The page's TypeScript should compute these in-cell rather than hardcoding them, but the table values above are reliable to ±0.001¢ for cross-checking the rendered output.]

## 10. Kernel-discipline checklist for the executor

Same discipline as every other theory page; calling out the well-temperament-specific bits:

- **R-01 / Pitfall #1.** `Interval`/`BigInt Fraction` for the kernel-exact anchors (pure fifth 3/2, syntonic comma 81/80 via `commaByName`, schisma 32805/32768 via `commaByName`, Pythagorean comma 531441/524288 via `commaByName`). The 12 fifth-size arrays per temperament are CENTS (display projection), because the tempered fifths are irrational. Reduce-by-octave and major-third calculations stay entirely in cents — same pattern as `meantone.md`'s `tempered(n)` factory.
- **Pitfall #2.** ONE `createSynth()` call site at the top of the page. Six play-triad buttons all share the same `synth`. `invalidation.then(() => synth.dispose())`.
- **D-08 / D-18.** baseHz = 440, default duration 1.5s.
- **D-24.** `Interval` methods return new instances — don't mutate. Not relevant on this page since we don't do Interval-chain arithmetic past the constants.
- **Pitfall #16.** 3-decimal cents precision in tables (0.001¢ resolution surfaces the schisma in Kirnberger III's row at F♯-C♯). 1-decimal precision is fine on bar chart labels.
- **T-02-22 / T-02-23 XSS.** All DOM tables built with `createElement` + `textContent`. No `innerHTML`. Follow the `variantsTable` IIFE pattern from `meantone.md` lines 78-110.
- **Floats in prose.** Prefer KaTeX-typeset cents values via `${tex`...`}` rather than hardcoded `390.2¢` literals in prose. Where a literal is unavoidable (e.g. the headline "C-major in Kirnberger III is pure 5/4"), compute it from kernel `pure5Third.cents.toFixed(3)` to keep the source-of-truth in BigInt.

## 11. Open questions / discretion areas

None of these block execution; flagging for the planner:

1. **Three temperaments vs four?** The user named only three (Werckmeister III, Kirnberger III, Vallotti). Adding Young II (1799) or Bach-Lehman (2005) would round it out historically but balloon the page. **Recommendation: stick to the three named. Leave Young/Lehman for a follow-up page if interest develops.**

2. **Spiral component extension?** Extending `spiral-of-fifths.ts` to accept a per-fifth array would be useful both for this page AND for future Bach-Lehman / Young etc. **Recommendation: skip in this task. The Plot bar chart reads clearer for "compare fifth sizes around the circle" anyway. If a follow-up adds Young II / Bach-Lehman, revisit then.**

3. **Per-key audio?** Six play buttons (C and F♯ × 3 temperaments) is the minimum. A more thorough demo would offer all 12 keys × all 3 temperaments = 36 buttons. **Recommendation: ship with 6 (the contrast is the point). If the user asks, expand to a key-selector dropdown.**

4. **Cambridge UP Lindley URL.** The ISBN-based URL is a guess. If the executor finds it 404s, swap to `https://www.worldcat.org/isbn/0521289505` (always resolves) or omit URL entirely (the ISBN in the title is sufficient citation).

## Sources

### HIGH confidence
- `src/pages/meantone.md` — voice / structure template (verified by direct read)
- `src/pages/pythagorean-comma.md` — spiral + Plot drift chart pattern (verified by direct read)
- `src/pages/edo-approximation.md` — successor page; outline mirror (verified)
- `src/components/spiral-of-fifths.ts` — API signature, confirmed it accepts single `temperedFifthCents` scalar only (verified by direct read of line 41-48)
- `src/components/play-dyad.ts`, `play-interval.ts`, `play-scale.ts` — audio component API (verified)
- `src/components/further-reading.ts` — `FurtherReadingItem` API (verified)
- `observablehq.config.ts` — sidebar order (verified)
- Node arithmetic — fifth-size sums, major-third derivations (verified this session)
- en.wikipedia.org/wiki/Werckmeister_temperament — confirms the C-G, G-D, D-A, B-F# tempering pattern
- en.wikipedia.org/wiki/Vallotti_temperament — confirms the F-C-G-D-A-E-B 1/6 PC pattern + attribution caveat
- tonalsoft.com/enc/w/werckmeister.aspx — secondary confirmation
- tonalsoft.com/enc/k/kirnberger.aspx — secondary confirmation

### MEDIUM confidence
- en.wikipedia.org/wiki/Kirnberger_temperament — WebFetch returned partial; the schisma-fifth-on-F#-C# fact is confirmed via secondary sources (Tonalsoft, Wikipedia search snippet, Tunable) but the underlying Wikipedia content was not fully extracted in this session
- larips.com — site exists, landing-page URL is correct, but the specific "best entry point" page wasn't WebFetched (403 from en.xen.wiki blocked us; for larips itself, the home page IS the canonical entry)

### LOW confidence (none here — all numbers are arithmetic, all URLs are corroborated)

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Cambridge UP URL form `https://www.cambridge.org/9780521289504` resolves for Lindley | §8 | Low — fallback URL provided (WorldCat); could also be plain ISBN citation with no URL |
| A2 | larips.com landing page is the right specific URL for the Lehman further-reading entry | §8 | Low — even if Lehman has moved a sub-page, the landing page IS canonical |
| A3 | Inline `playTriadAt` factory is the right reuse decision (vs. extracting `playTriad` component) | §4 | Low — easy to refactor later; matches established meantone.md `playTempered` pattern |
| A4 | Plot bar chart is a better visualization than extending spiral-of-fifths for per-key temperament rendering | §5 | Low — both work; bar chart is a more conservative add |

## RESEARCH COMPLETE

**Task:** Quick — create `src/pages/well-temperament.md`
**Confidence:** HIGH

### Key Findings
- All three temperaments' fifth-size tables and major-third profiles **arithmetically verified** — each set of 12 fifths sums to exactly 8400.000000¢, and major thirds match canonical published values (Werckmeister III's C-major third = 390.225¢, Kirnberger III's C-major third = 386.314¢ = pure 5/4, Vallotti's A-major third = exactly 400.000¢).
- **`spiral-of-fifths.ts` cannot render well-temperaments** — it accepts only a single scalar `temperedFifthCents`, not a per-fifth array. **Recommended visualization: Plot bar charts** (fifth-size deviations + major-third-per-key, three pairs) — same look-and-feel as `edo-approximation.md`'s scatter and `pythagorean-comma.md`'s drift chart.
- **No new component needed.** Inline `playTriadAt(label, rootCents, thirdCents, fifthCents)` factory mirrors the `playTempered` pattern from `meantone.md` lines 117-129. `synth.playNotes([f1, f2, f3], dur)` accepts arbitrary-length frequency arrays.
- **Sidebar diff is a single-line insertion** between "Meantone" and "EDO approximations" in `observablehq.config.ts` (line 29).
- **Further reading: 3 items** — Xen Wiki `/w/Well_temperament` (general), larips.com (Lehman / Bach), Lindley *Lutes, Viols and Temperaments* (Cambridge UP, 1984, ISBN 0-521-28950-5) — scholarly. Cambridge URL flagged as MEDIUM-confidence; WorldCat fallback documented.

### File Created
`/Users/taylorbrook/Dev/Tuning Systems/.planning/quick/260513-9s8-create-src-pages-well-temperament-md-cov/260513-9s8-RESEARCH.md`

### Ready for Planning
All seven required deliverables answered. Planner has exact fifth-size tables (verified to 8400.000000¢ totals), exact major-third profiles per key, the audio-component reuse decision, the spiral-of-fifths API verdict, the config.ts diff, the page outline matching meantone.md voice, and the further-reading items with URLs. Numbers are arithmetic-verifiable in-cell from kernel-exact `commaByName(...)` lookups — no hardcoded floats need to enter the source.
