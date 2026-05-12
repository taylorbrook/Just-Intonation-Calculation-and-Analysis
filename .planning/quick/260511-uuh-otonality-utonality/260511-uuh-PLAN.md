---
phase: quick-260511-uuh
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/otonality-utonality.md
  - observablehq.config.ts
autonomous: true
requirements:
  - QT-260511-uuh
tags:
  - observable-framework
  - katex
  - partch
  - otonality
  - utonality
  - ji-theory

must_haves:
  truths:
    - "Visiting /pages/otonality-utonality renders a complete theory page on Partch's otonality/utonality duality with no console errors and no broken KaTeX."
    - "The page introduces otonality (over-N: 4:5:6:7) as a chord of harmonics above a fundamental and utonality (under-N: 1/4:1/5:1/6:1/7) as the symmetric inversion."
    - "The page renders the otonal 4:5:6:7 chord as Interval ratios (1/1, 5/4, 3/2, 7/4) with KaTeX and ratioPill, and the utonal mirror as Interval ratios (1/1, 8/7, 4/3, 8/5 — the octave-reduced inversion) with KaTeX and ratioPill."
    - "The page exposes TWO buttons: 'Play otonal (4:5:6:7)' and 'Play utonal (1/4:1/5:1/6:1/7)' — both wired to a page-owned synth via the standard lazy-createSynth cell pattern, each invoking synth.playNotes on a chord of frequencies."
    - "The page cross-links to / (tonality diamond, which is the visual rendering of this duality) and to /pages/odd-limits (a sibling theory page the user is staging next)."
    - "The page cross-links to /pages/monzos so the otonal/utonal monzo signs (positive prime exponents = otonal; negative = utonal) are connected to the prior monzo concept."
    - "The new page appears in the left sidebar under the 'Theory notes' group in observablehq.config.ts, placed after Monzos and before the comma pages."
  artifacts:
    - path: "src/pages/otonality-utonality.md"
      provides: "Theory page on Partch's otonal/utonal duality; 4:5:6:7 over-N chord, 1/4:1/5:1/6:1/7 under-N chord, monzo-sign interpretation, two playNotes chord buttons, cross-links to / and /pages/odd-limits and /pages/monzos."
      contains: "playNotes"
      min_lines: 60
    - path: "observablehq.config.ts"
      provides: "Sidebar registration for the new otonality-utonality page under 'Theory notes'."
      contains: "/pages/otonality-utonality"
  key_links:
    - from: "src/pages/otonality-utonality.md"
      to: "src/lib/interval.js"
      via: "import { Interval } from '../lib/interval.js'; constructs otonal + utonal chord intervals as new Interval('n/d')."
      pattern: "new Interval\\("
    - from: "src/pages/otonality-utonality.md"
      to: "src/audio/synth.js"
      via: "createSynth() in dedicated synth cell with invalidation.then(synth.dispose); same lazy pattern as syntonic-comma.md / monzos.md."
      pattern: "createSynth\\(\\)"
    - from: "src/pages/otonality-utonality.md"
      to: "src/audio/synth.js"
      via: "synth.playNotes(freqs, dur) invoked from two button click handlers — one for the otonal chord, one for the utonal chord."
      pattern: "playNotes\\("
    - from: "src/pages/otonality-utonality.md"
      to: "src/components/ratio-pill.js"
      via: "ratioPill(interval) used inline in prose for each chord member's ratio + cents display."
      pattern: "ratioPill\\("
    - from: "observablehq.config.ts"
      to: "src/pages/otonality-utonality.md"
      via: "{ name: 'Otonality & utonality', path: '/pages/otonality-utonality' } added under 'Theory notes' pages array, after Monzos."
      pattern: "/pages/otonality-utonality"
---

<objective>
Add a new theory page at `src/pages/otonality-utonality.md` that introduces Harry Partch's otonality / utonality duality: otonal chord = harmonics over a fundamental (4:5:6:7 → 1, 5/4, 3/2, 7/4), utonal chord = symmetric inversion under a guide tone (1/4:1/5:1/6:1/7, octave-reduced upward as 1, 8/7, 4/3, 8/5). The page provides TWO audition buttons — one for each chord — wired to the existing `createSynth().playNotes(...)` API. Register the new page in the sidebar under "Theory notes" in `observablehq.config.ts`.

Purpose: The dashboard's tonality-diamond viz is **precisely** the visualization of this otonal/utonal duality — but nowhere in the notebook is the underlying concept introduced in prose. This page is the conceptual companion to the diamond viz: read the page, then look at the diamond and the rows/columns become legible (rows = utonal chains, columns = otonal chains).

Output: One Markdown theory page + one sidebar registration line. No new components, no kernel changes.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@src/pages/syntonic-comma.md
@src/pages/monzos.md
@observablehq.config.ts

<interfaces>
<!-- Key exports the executor needs. Do NOT explore the codebase — use these directly. -->

From src/lib/interval.ts:
```typescript
export class Interval {
  readonly fraction: Fraction;            // BigInt-backed fraction.js@5.3.4
  constructor(input: FractionInput);      // accepts "5/4", bigint, number, {n,d}, Fraction
  get monzo(): number[];                  // Interval → monzo (lazy cached)
  get cents(): number;                    // display projection (float)
  mul(other: Interval): Interval;
  inv(): Interval;                        // inverse — used for utonal mirror
  octaveReduce(period?: Interval): Interval; // default period 2/1; needed to bring 1/(5/4) back up into [1, 2)
  toString(): string;                     // "n/d" form
}
```

From src/components/ratio-pill.ts:
```typescript
export function ratioPill(interval: Interval, opts?: { showCents?: boolean }): HTMLSpanElement;
```

From src/audio/synth.ts:
```typescript
export function createSynth(opts?: CreateSynthOpts): SynthHandle;

export interface SynthHandle {
  playNote(hz: number, dur?: number): () => void;
  playNotes(freqs: number[], dur?: number): void;   // <-- USE THIS for both chord buttons
  playArpeggio(freqs: number[], stepSec?: number): void;
  startDrone(hz: number): () => void;
  panic(): void;
  readonly activeVoices: number;
  dispose(): void;
}
// Default note duration if dur omitted: 1.5s (D-18).
```

Note: do NOT use the `playInterval(...)` factory for the chord buttons — it plays a *dyad* (root + interval). For these chords we want all 4 notes simultaneous. Build raw HTMLButtonElements inline and call `synth.playNotes(freqs, dur)` directly. baseHz = 440 to match D-08.

Ratio math the page asserts (hand-verified — write inline as KaTeX, do not compute as a cell):

**Otonal (over-N, 4:5:6:7), reduced to octave [1, 2):**
- 4/4 = 1/1                     (the fundamental — included in playback as the root)
- 5/4                           (5-limit major third)
- 6/4 = 3/2                     (perfect fifth)
- 7/4                           (harmonic seventh — 7-limit)

Monzo signs: all positive 5- and 7-prime exponents (5/4 = [-2, 0, 1]; 3/2 = [-1, 1]; 7/4 = [-2, 0, 0, 1]). Otonal "lives above" the fundamental.

**Utonal (under-N, 1/4:1/5:1/6:1/7), the inversion of the otonal chord.**
Take each otonal member, invert (1/x), then octave-reduce back up into [1, 2):
- 1/(1/1) = 1/1                 (the guide tone — root unchanged)
- 1/(5/4) = 4/5,  octaveReduce → 8/5    (since 4/5 < 1, multiply by 2 → 8/5 ∈ [1,2))
- 1/(3/2) = 2/3,  octaveReduce → 4/3    (2/3 × 2 = 4/3)
- 1/(7/4) = 4/7,  octaveReduce → 8/7    (4/7 × 2 = 8/7)

So the utonal chord, ascending from root, is **1/1, 8/7, 4/3, 8/5**. Monzo signs are flipped on the 5- and 7-prime exponents (8/5 = [3, 0, -1]; 4/3 = [2, -1]; 8/7 = [3, 0, 0, -1]). Utonal "lives below" the guide tone but we render it ascending from a common root for direct comparison.

This kernel-level inversion via `.inv().octaveReduce()` is the page's pedagogical hook — show it in a tiny verification cell that proves the chord ratios are exactly what the prose claims.

Partch reference (sourcing only — do NOT cite as if writing an academic paper): the over-N / under-N notation, and the tonality-diamond as their joint visualization, are from Harry Partch, *Genesis of a Music* (1949/1974), specifically Chapter 6 "The Language of Ratios" and Chapter 8 "Application of the Tonality Diamond". One footnote or parenthetical mention is enough.
</interfaces>

<sidebar_position>
The existing "Theory notes" group in observablehq.config.ts after the rb4 quick task is:
1. Monzos
2. The syntonic comma
3. The Pythagorean comma
4. The schisma
5. The septimal comma

"Otonality & utonality" is a structural / chord-formation concept, peer to "Monzos" (both are foundational notations, not single intervals). Insert it as the **second** entry, right after Monzos and before the comma pages. New ordering:
1. Monzos
2. Otonality & utonality       ← new
3. The syntonic comma
4. The Pythagorean comma
5. The schisma
6. The septimal comma
</sidebar_position>

<cross_link_caveat>
The user's brief asks for a cross-link to `/pages/odd-limits`. **This page does not currently exist** in `src/pages/` (verified at planning time). The user is staging it as the next quick task. Include the link anyway — Markdown links don't break the build, the link will 404 until that page is created (which the user will do next), and inserting it now means we don't have to revisit this file. Write the prose so the link reads naturally regardless of whether the target exists yet (e.g., "see also the [odd-limit](/pages/odd-limits) classification"). Do NOT block on this — just include the link.
</cross_link_caveat>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write src/pages/otonality-utonality.md (theory page mirroring monzos.md / syntonic-comma.md template)</name>
  <files>src/pages/otonality-utonality.md</files>
  <action>
Create `src/pages/otonality-utonality.md` mirroring the **exact** structure, import block, and synth-cell pattern from `src/pages/monzos.md` and `src/pages/syntonic-comma.md`. Do not invent a new template — reuse theirs.

**Page structure (in order):**

1. **H1 title:** `# Otonality and utonality`

2. **Subtitle line (one sentence, no heading):** e.g. "Over-N and under-N chord-formation — Partch's central duality, and the rows-and-columns of the tonality diamond."

3. **Import cell** (` ```ts ` block) — MUST match the monzos.md / syntonic-comma.md pattern. Required imports:
   ```ts
   import { Interval } from "../lib/interval.js";
   import { createSynth } from "../audio/synth.js";
   import { ratioPill } from "../components/ratio-pill.js";
   ```
   Do NOT import `playInterval` — this page builds its own chord-play buttons inline (the two "Play otonal" / "Play utonal" buttons play 4-note simultaneous chords via `synth.playNotes`, not the dyad that `playInterval` produces). Do NOT import `commaByName`. Do NOT import from `../lib/monzo.js` directly — the `Interval.monzo` getter is sufficient if the page demonstrates monzo signs.

4. **Synth cell** (` ```ts ` block) — COPY VERBATIM from monzos.md lines 12-19 (the synth cell with the Pattern 4 / Pitfall #2 comment):
   ```ts
   // Synth cell — owns this page's AudioContext (ARCHITECTURE Pattern 4 / Pitfall #2).
   // Must NOT depend on any other cell. The lazy createSynth() does not allocate the
   // AudioContext until the first playNote / playNotes call (i.e. the first user click),
   // so simply rendering this page does not create an AudioContext.
   const synth = createSynth();
   invalidation.then(() => synth.dispose());
   ```

5. **Chord-construction cell** (` ```ts ` block) — build the otonal and utonal Interval arrays once at the top of the page. Suggested:
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

   Use clear variable names. The brief annotations above are part of the page's pedagogy — keep them.

6. **Intro prose section** — 2-4 short paragraphs introducing the duality. Cover:
   - **Otonality (over-N):** a chord built from successive harmonics 4:5:6:7 over a fundamental. After octave-reducing 6 to 3/2 and treating 4 as the root 1/1, this is 1, 5/4, 3/2, 7/4 — a 7-limit dominant-7-like sonority that exists in nature whenever a vibrating string is driven hard enough to ring its first three odd harmonics.
   - **Utonality (under-N):** the symmetric inversion — a chord built from the *subharmonic* series 1/4:1/5:1/6:1/7 *under* a guide tone. The interval set is the same numbers, inverted. Where otonality stacks `1, 5/4, 3/2, 7/4` upward from the fundamental, utonality stacks the same ratios *downward* from the guide tone, which (when re-rooted upward for comparison) reads as `1, 8/7, 4/3, 8/5` ascending.
   - **Why both exist as first-class citizens in JI:** the harmonic series is asymmetric (only goes up) but ratio space is *symmetric* — for every otonal chord there's an exact utonal mirror, and Partch's whole 43-tone theory treats the two as duals. The tonality diamond on the [dashboard](/) renders this duality directly: rows are utonal chains (constant denominator, ascending numerator), columns are otonal chains (constant numerator, ascending denominator).
   - One parenthetical Partch citation is enough. Do not turn this into a Partch biography.

7. **§ The otonal chord (over-N)** — render each chord member with a ratioPill + KaTeX showing the harmonic-series interpretation:
   - Show the chord as harmonics: ${tex`4 : 5 : 6 : 7`} and then as octave-reduced ratios: ${tex`1 : 5/4 : 3/2 : 7/4`}.
   - For each member, render a sentence with a `${ratioPill(...)}` for the ratio + cents display.
   - End the section with the "Play otonal" button — a real `<button type="button">` built inline (not via `playInterval`). The handler computes `[1/1, 5/4, 3/2, 7/4].map(iv => baseHz * Number(iv.fraction.valueOf()))` and calls `synth.playNotes(freqs)` for a 4-note simultaneous chord at the synth's default duration. Use the inline DOM-factory pattern (mirrors `playInterval`'s structure but builds a chord-play button):

     ```ts
     // Build the "Play otonal (4:5:6:7)" button inline. We don't use playInterval
     // because that factory plays a dyad (root + 1 interval); we want all 4 notes
     // simultaneous, which is exactly what synth.playNotes(freqs) does.
     const otonalBtn = (() => {
       const b = document.createElement("button");
       b.className = "play-btn";
       b.type = "button";
       b.textContent = "▶ Play otonal (4:5:6:7)";
       b.setAttribute("aria-label", "Play the otonal chord 4:5:6:7 as a simultaneous 4-note chord");
       b.addEventListener("click", () => {
         const freqs = otonal.map((iv) => baseHz * Number(iv.fraction.valueOf()));
         synth.playNotes(freqs);
       });
       return b;
     })();
     ```

     Then render it inline in the section's closing paragraph with `${otonalBtn}`. Use `.play-btn` so it inherits the same styling as the other audition buttons across the notebook (per `src/components/play-buttons.css`).

8. **§ The utonal chord (under-N)** — symmetric to §7. Cover:
   - Show the chord as subharmonics: ${tex`1/4 : 1/5 : 1/6 : 1/7`}, and explain that *as a set of ratios above a common root*, this reads as ${tex`1 : 8/7 : 4/3 : 8/5`} (each subharmonic inverted and octave-reduced).
   - For each member, render a `${ratioPill(...)}`.
   - **Verification cell** — assert the utonal ratios are exactly what the prose claims, by computing them from the otonal chord via `.inv().octaveReduce()`. This is the page's truth-check that the kernel agrees with the prose:

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
   - End with the "Play utonal" button, mirroring §7's pattern:

     ```ts
     const utonalBtn = (() => {
       const b = document.createElement("button");
       b.className = "play-btn";
       b.type = "button";
       b.textContent = "▶ Play utonal (1/4:1/5:1/6:1/7)";
       b.setAttribute("aria-label", "Play the utonal chord 1/4:1/5:1/6:1/7 as a simultaneous 4-note chord, re-rooted upward for direct comparison with the otonal chord");
       b.addEventListener("click", () => {
         const freqs = utonal.map((iv) => baseHz * Number(iv.fraction.valueOf()));
         synth.playNotes(freqs);
       });
       return b;
     })();
     ```

     Inline as `${utonalBtn}`.

9. **§ Monzo signs flip** — short section (4-6 sentences + one KaTeX block) showing that otonality and utonality are visible at the monzo level as **sign flips on the 5- and 7-prime exponents**. Display the four monzo pairs in a KaTeX `aligned` block or a small `display(...)` table — pick whichever is more readable. Example KaTeX:
   ${tex`5/4 = \begin{bmatrix} -2 & 0 & 1 \end{bmatrix}\rangle \quad\leftrightarrow\quad 8/5 = \begin{bmatrix} 3 & 0 & -1 \end{bmatrix}\rangle`}
   - The 5- and 7-prime entries flip sign between otonal and utonal members; the 2-prime entry adjusts to keep the result in [1, 2). This is the same `.inv().octaveReduce()` operation, viewed in monzo coordinates.
   - Reference the [monzos page](/pages/monzos) here ("see [Monzos](/pages/monzos) for the prime-vector notation if this is unfamiliar").

10. **§ See also** — final section. Three short paragraphs:
    - Link to the [dashboard](/) and call out that the **tonality-diamond viz on that page is the joint visualization of these two chord-formation rules** — rows are utonal chains, columns are otonal chains, and the diamond's symmetry across its anti-diagonal is exactly the otonal/utonal symmetry the page just defined.
    - Link to [odd-limits](/pages/odd-limits) — note that "odd-limit" is the classification system Partch built on top of the otonal/utonal duality (the *n*-odd-limit is the set of all ratios whose largest odd factor in numerator or denominator is ≤ *n*, which is exactly the cells of the *n*-odd-limit tonality diamond). The page may not exist yet; the link is forward-looking. **Do not block on whether `/pages/odd-limits` exists** — Markdown link, that's it.
    - Link to [the syntonic comma](/pages/syntonic-comma) as a reminder that the 5-limit major third in the otonal chord differs from the Pythagorean major third by the syntonic comma — connecting this page to the comma series.

**Style rules (non-negotiable, mirror existing pages):**
- KaTeX uses the `tex` template tag (`${tex\`...\`}`), NOT `$...$` or `$$...$$`. Match monzos.md / syntonic-comma.md.
- Bra-ket monzos use `\begin{bmatrix} ... \end{bmatrix}\rangle` — same as all existing theory pages.
- `ratioPill(iv)` for inline ratio+cents in prose. No new components.
- The two chord buttons are built inline using `document.createElement("button")` with `className = "play-btn"` so they inherit the existing styling. Do NOT add new CSS.
- Do NOT use a `style:` front-matter. The page should inherit the default Framework styling like all the other theory pages.
- Comments inside ` ```ts ` cells should be useful (point at ARCHITECTURE / Pitfall references when copying patterns) — match the tone of monzos.md.

**Anti-scope (do NOT do):**
- Do NOT add a new component file (no `chord-button.ts`). The two buttons are built inline.
- Do NOT add the tonality-diamond viz to this page — link to it on `/`. The page is text + chord-play buttons, not a viz page.
- Do NOT add new CSS or modify `src/styles.css`. The `.play-btn` class already exists.
- Do NOT touch the kernel (`src/lib/`) or the synth (`src/audio/`).
- Do NOT write a Partch biography. The page is a worked-concept page, not a textbook chapter — 2-4 intro paragraphs, then the chords.
- Do NOT use floats anywhere except as KaTeX display strings — keep `Interval` (BigInt Fraction) as the source of truth (R-01 / Pitfall #1).
- Do NOT use `playInterval` for the chord buttons — that factory plays a *dyad*, not a 4-note chord. Build raw buttons + `synth.playNotes` per the action above.
  </action>
  <verify>
    <automated>cd "$PWD" && npx tsc --noEmit && npm run build 2>&1 | tail -40 && grep -q 'class="ratio-pill"' dist/pages/otonality-utonality/index.html && grep -q 'play-btn' dist/pages/otonality-utonality/index.html && grep -q 'playNotes' src/pages/otonality-utonality.md && grep -q '4:5:6:7' src/pages/otonality-utonality.md && grep -q '1/4:1/5:1/6:1/7' src/pages/otonality-utonality.md && grep -q '/pages/monzos' src/pages/otonality-utonality.md && grep -q '/pages/odd-limits' src/pages/otonality-utonality.md && grep -E '\]\(/\)|\(/\)' src/pages/otonality-utonality.md | head -1 && echo "OK: otonality-utonality.md built, ratioPill + play-btn present, otonal/utonal chord strings present, playNotes invoked, cross-links present"</automated>
  </verify>
  <done>
- `src/pages/otonality-utonality.md` exists.
- `npx tsc --noEmit` passes (no TS errors introduced by the new cells).
- `npm run build` produces `dist/pages/otonality-utonality/index.html` without errors.
- The rendered page contains at least one `ratio-pill` element, two `play-btn` elements (one for otonal, one for utonal), and KaTeX-rendered output (look for `katex` spans).
- The file contains the literal strings `4:5:6:7` and `1/4:1/5:1/6:1/7` (as KaTeX-source or prose).
- `synth.playNotes(` is invoked in at least two places (one per chord button).
- Cross-links to `/`, `/pages/monzos`, `/pages/odd-limits`, and `/pages/syntonic-comma` are all present in the .md file.
- Browser smoke (manual, post-task): visiting `http://localhost:3000/pages/otonality-utonality` shows no console errors, KaTeX renders, both chord buttons play their 4-note chords, the `display(utonalDerived)` cell shows `ok: true` for all four rows.
  </done>
</task>

<task type="auto">
  <name>Task 2: Register the new page in observablehq.config.ts under "Theory notes"</name>
  <files>observablehq.config.ts</files>
  <action>
Edit `observablehq.config.ts`. Inside the `pages` array, locate the existing "Theory notes" group (the one currently containing Monzos + the four comma pages). Insert a new entry as the **second** child, right after Monzos:

```ts
{ name: "Otonality & utonality", path: "/pages/otonality-utonality" },
```

So the final group reads:

```ts
{
  name: "Theory notes",
  open: true,
  pages: [
    { name: "Monzos", path: "/pages/monzos" },
    { name: "Otonality & utonality", path: "/pages/otonality-utonality" },
    { name: "The syntonic comma", path: "/pages/syntonic-comma" },
    { name: "The Pythagorean comma", path: "/pages/pythagorean-comma" },
    { name: "The schisma", path: "/pages/schisma" },
    { name: "The septimal comma", path: "/pages/septimal-comma" },
  ],
},
```

Rationale: "Monzos" and "Otonality & utonality" are both foundational notational concepts that the comma pages assume — group them at the top of the section. Otonality/utonality reads naturally *after* Monzos because the "monzo signs flip" section in the new page references the monzos page.

Do NOT touch the `header` HTML, the `head` KaTeX link, or any other top-level config field. Single, minimal diff inside the existing "Theory notes" group.
  </action>
  <verify>
    <automated>grep -A 12 '"Theory notes"' observablehq.config.ts | grep -q '"Otonality & utonality"' && grep -A 12 '"Theory notes"' observablehq.config.ts | grep -q '/pages/otonality-utonality' && npx tsc --noEmit && npm run build 2>&1 | tail -10 && grep -q 'href="/pages/otonality-utonality"' dist/index.html && echo "OK: sidebar entry present, config compiles, dist sidebar contains link"</automated>
  </verify>
  <done>
- `observablehq.config.ts` has `{ name: "Otonality & utonality", path: "/pages/otonality-utonality" }` as the second entry in the "Theory notes" group (immediately after Monzos).
- `tsc --noEmit` passes.
- `npm run build` succeeds.
- Built `dist/index.html` (or any page's HTML) contains a sidebar link to `/pages/otonality-utonality`.
- The existing five sidebar entries (Monzos + four commas) are unchanged in name and order relative to one another.
  </done>
</task>

</tasks>

<verification>
After both tasks:

1. `npx tsc --noEmit` — no type errors anywhere.
2. `npm run build` — clean build, no warnings about missing pages or broken links (a 404 against `/pages/odd-limits` does NOT count — that's a forward link to a not-yet-built page; Framework's build doesn't fail on cross-page links).
3. `npm run dev` and visit `http://localhost:3000/pages/otonality-utonality`:
   - Page loads without console errors.
   - KaTeX renders the chord ratios, the bra-ket monzo flip, and the `4:5:6:7` / `1/4:1/5:1/6:1/7` proportion strings.
   - "Play otonal (4:5:6:7)" button plays a 4-note simultaneous chord — sounds like a dominant-7 / tetrad above 440 Hz.
   - "Play utonal (1/4:1/5:1/6:1/7)" button plays a 4-note simultaneous chord — same root, different (darker, minor-leaning) sonority.
   - The `display(utonalDerived)` cell shows `ok: true` for all four entries (kernel agrees with prose).
4. Sidebar shows "Otonality & utonality" as the second entry under "Theory notes" (after Monzos) on every page.
5. Clicking the cross-link to `/`, `/pages/monzos`, and `/pages/syntonic-comma` all navigate correctly. The link to `/pages/odd-limits` 404s (expected — that page is staged for the next quick task) but does not break the build.
</verification>

<success_criteria>
- `src/pages/otonality-utonality.md` exists and renders as a self-contained theory page introducing Partch's otonal/utonal duality with two simultaneous-chord audition buttons.
- The page renders both chords as `Interval` arrays and proves their ratios kernel-side via `.inv().octaveReduce()` round-trip.
- The page uses the `Interval` kernel exclusively for ratio math (BigInt Fraction; floats only at the audio Hz boundary, per the existing playInterval pattern).
- The page mirrors the import block, synth cell pattern, KaTeX bra-ket style, and "See also" structure of `monzos.md` / `syntonic-comma.md`.
- Two chord-play buttons exist, each wired via raw `document.createElement("button")` + `synth.playNotes(...)`, both using the `.play-btn` class for consistent styling.
- The page cross-links to `/` (tonality diamond), `/pages/monzos`, `/pages/syntonic-comma`, and `/pages/odd-limits`.
- The page is registered in the sidebar under "Theory notes" as the second entry (after Monzos).
- `tsc --noEmit` passes; `npm run build` succeeds.
</success_criteria>

<output>
After completion, create `.planning/quick/260511-uuh-otonality-utonality/260511-uuh-SUMMARY.md` summarizing:
- Files created / modified.
- Otonal + utonal chord ratios used and the kernel-side derivation method.
- Any deviations from the monzos.md / syntonic-comma.md template, with reason.
- One STATE.md row append (per quick-task convention).
</output>
