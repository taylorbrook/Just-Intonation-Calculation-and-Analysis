---
phase: quick-260511-jyh
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/septimal-comma.md
  - observablehq.config.ts
autonomous: true
requirements:
  - QUICK-260511-jyh-01
must_haves:
  truths:
    - "Visiting /pages/septimal-comma renders a theory note titled 'The septimal comma' with the 64/63 framing"
    - "The page shows 64/63 ≈ 27.26¢ and its monzo [6, -2, 0, -1] using the same tex/ratioPill/playInterval idioms as syntonic-comma.md"
    - "Three play buttons audition 7/4 (harmonic 7th), 16/9 (Pythagorean minor 7th), and 64/63 (the comma) in that order, sharing a single page-owned synth"
    - "Cross-link to /pages/syntonic-comma is present in the 'See also' section"
    - "Sidebar 'Theory notes' group lists 'The septimal comma' alongside the existing three entries"
  artifacts:
    - path: "src/pages/septimal-comma.md"
      provides: "Septimal-comma theory page mirroring syntonic-comma.md"
      contains: 'commaByName("septimal comma")'
    - path: "observablehq.config.ts"
      provides: "Sidebar registration of the new page under Theory notes"
      contains: "/pages/septimal-comma"
  key_links:
    - from: "src/pages/septimal-comma.md"
      to: "src/lib/commas.ts"
      via: 'commaByName("septimal comma")'
      pattern: 'commaByName\("septimal comma"\)'
    - from: "src/pages/septimal-comma.md"
      to: "src/audio/synth.js"
      via: "createSynth() + invalidation.then(dispose)"
      pattern: "createSynth\\(\\)"
    - from: "observablehq.config.ts"
      to: "src/pages/septimal-comma.md"
      via: "pages[].pages[] sidebar entry"
      pattern: "/pages/septimal-comma"
---

<objective>
Add a `septimal comma` theory page at `src/pages/septimal-comma.md` that mirrors the structure, cell idioms, prose voice, and audio pattern of `src/pages/syntonic-comma.md`. Register the page in the sidebar under "Theory notes" in `observablehq.config.ts`.

Purpose: Extend the Theory notes set into 7-limit JI. The septimal comma (64/63 ≈ 27.26¢, Archytas' comma) is the natural entry point — it is the gap between the harmonic 7th (7/4) and the Pythagorean minor 7th (16/9).

Output: A new `.md` page wired into the sidebar, sharing the same Pattern-4 synth-cell discipline as the existing theory pages.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@src/pages/syntonic-comma.md
@src/pages/pythagorean-comma.md
@src/pages/schisma.md
@observablehq.config.ts

<interfaces>
<!-- The septimal-comma entry is already in src/lib/commas.ts; commaByName lookup is total. -->
<!-- Extracted patterns the executor needs — no codebase exploration required. -->

From src/lib/commas.ts:
```ts
// Row already present (verified):
//   { name: "septimal comma", monzo: [6, -2, 0, -1] }, // 64/63 (Archytas' comma)
export function commaByName(name: string): Interval | undefined;
```

From src/lib/interval.js (used as `new Interval("...")`):
```ts
new Interval("7/4")    // harmonic 7th
new Interval("16/9")   // Pythagorean minor 7th
```

From src/components/ratio-pill.js + src/components/play-interval.js:
```ts
ratioPill(interval: Interval): HTMLElement
playInterval(interval: Interval, synth, opts?: { label?: boolean }): HTMLElement
```

From src/audio/synth.js (Pattern 4 — cell-owned AudioContext, see Pitfall #2):
```ts
createSynth(): { dispose(): void; playNote(...): void; ... }
```

Page structure to mirror (from syntonic-comma.md):
1. `# The {name}` H1 + one-line subtitle stating ratio + framing.
2. Import block (Interval, commaByName, createSynth, ratioPill, playInterval) in a ```ts cell.
3. Synth cell — verbatim Pattern-4 boilerplate; MUST NOT depend on any other cell.
4. Definitions cell — `commaByName(...)!` non-null asserted, plus the two comparison Intervals.
5. Prose paragraph: state the comma in ${tex`…`} with cents value, explain what it is the gap between, give the identity equation in tex.
6. Bulleted audio comparison: 2–3 `playInterval(...)` lines with `{ label: true }`, plus a short prose tag per item.
7. `## In monzos` section: tex monzo + factorization, plus a sentence interpreting which primes appear and why.
8. `## See also` section: link to /pages/syntonic-comma (and any other relevant theory pages); reference the dashboard at `/`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create src/pages/septimal-comma.md mirroring syntonic-comma.md</name>
  <files>src/pages/septimal-comma.md</files>
  <action>
Create `src/pages/septimal-comma.md` as a sibling to `src/pages/syntonic-comma.md`. Follow that file's structure exactly. Concrete content:

- **H1**: `# The septimal comma`
- **Subtitle line**: `64/63 — the gap between the harmonic 7th and the Pythagorean minor 7th; entry point to 7-limit JI`
- **Import cell** (```ts): identical to syntonic-comma.md's import block — `Interval`, `commaByName`, `createSynth`, `ratioPill`, `playInterval` from the same relative paths.
- **Synth cell** (```ts): VERBATIM copy of syntonic-comma.md's synth cell, including the Pattern-4 / Pitfall #2 comment. Must NOT depend on any other cell. `const synth = createSynth(); invalidation.then(() => synth.dispose());`
- **Definitions cell** (```ts):
  ```ts
  // commaByName returns Interval | undefined. The "septimal comma" key is hand-verified
  // in src/lib/commas.ts (Plan 02), so the lookup is total at construction time; we
  // assert non-null with `!` and let strict-TS keep us honest if the table ever drifts.
  const septimal = commaByName("septimal comma")!; //         64/63 (Archytas' comma)
  const harmonicSeventh = new Interval("7/4");   //           the natural 7th harmonic
  const pythagoreanMinorSeventh = new Interval("16/9"); //    minor 7th from two stacked pure fourths (4/3 × 4/3 reduced)
  ```
- **Prose paragraph** (one paragraph): State the septimal comma as ${tex`\frac{64}{63} \approx 27.26\text{¢}`}. Explain it is the gap between the harmonic 7th (${ratioPill(harmonicSeventh)}) and the Pythagorean minor 7th (${ratioPill(pythagoreanMinorSeventh)}). Give the identity in tex: ${tex`\frac{16/9}{7/4} = \frac{64}{63}`}. Frame it as the **entry point to 7-limit JI** — the gap that emerges when you reach for the natural seventh harmonic instead of stacking fifths-and-fourths. Match the prose voice of syntonic-comma.md (terse, declarative, no hedging).
- **Audio comparison bullets** (three items, in this exact order — wide-to-narrow size gradient like schisma.md, but here the comma is the narrowest):
  - `${playInterval(harmonicSeventh, synth, { label: true })} sounds the harmonic 7th (${ratioPill(harmonicSeventh)}) — the natural 7th partial; smooth and "blue", noticeably flatter than 12-TET's minor 7th.`
  - `${playInterval(pythagoreanMinorSeventh, synth, { label: true })} sounds the Pythagorean minor 7th (${ratioPill(pythagoreanMinorSeventh)}) — built from pure fifths/fourths alone; slightly sharper than 7/4 by exactly one septimal comma.`
  - `${playInterval(septimal, synth, { label: true })} sounds the comma itself — audible as a beat-rate when the two sevenths are sounded together; the "cost" of pricing the seventh through prime 3 instead of prime 7.`
- **`## In monzos` section**:
  - `${tex`64/63 = \begin{bmatrix} 6 & -2 & 0 & -1 \end{bmatrix}\rangle = 2^{6} \cdot 3^{-2} \cdot 5^{0} \cdot 7^{-1}`}`
  - One short paragraph: the prime-7 column is the giveaway — this is the first comma in the standard set where 7 appears, which is exactly why it marks the doorway from 5-limit to 7-limit JI. The 64 = 2^6 and the 63 = 9 × 7 = 3^2 × 7 lines up cleanly with the monzo.
- **`## See also` section**:
  - Link to [syntonic comma](/pages/syntonic-comma) — the 5-limit analog (the gap between Pythagorean and 5-limit major thirds).
  - Link to [Pythagorean comma](/pages/pythagorean-comma) — the 3-limit closure gap.
  - Reference the dashboard at [/](/) — building a JI scale containing 7/4 and auditioning against the drone makes the septimal-comma beating audible.
  - Do NOT link to a prime-limits page (none exists — verified via `ls src/pages/`).

Match `syntonic-comma.md` exactly on: KaTeX `${tex`…`}` interpolation syntax, the `ratioPill(...)` + `playInterval(...)` idiom, the ` (per D-23) bracket-ket `\rangle` for monzo display, the section heading levels (one H1, two H2s: `## In monzos` and `## See also`), and the synth-cell comment block (Pattern 4 / Pitfall #2). No additional cells, no extra widgets, no scale-table — this is a prose-and-audio theory note, not a dashboard.
  </action>
  <verify>
    <automated>test -f "src/pages/septimal-comma.md" &amp;&amp; grep -q 'commaByName("septimal comma")' src/pages/septimal-comma.md &amp;&amp; grep -q "7/4" src/pages/septimal-comma.md &amp;&amp; grep -q "16/9" src/pages/septimal-comma.md &amp;&amp; grep -q "64/63" src/pages/septimal-comma.md &amp;&amp; grep -q "27.26" src/pages/septimal-comma.md &amp;&amp; grep -q "6 &amp; -2 &amp; 0 &amp; -1" src/pages/septimal-comma.md &amp;&amp; grep -q "/pages/syntonic-comma" src/pages/septimal-comma.md &amp;&amp; grep -q "createSynth()" src/pages/septimal-comma.md &amp;&amp; grep -q "invalidation.then" src/pages/septimal-comma.md</automated>
  </verify>
  <done>File exists; contains commaByName("septimal comma"), the 7/4 vs 16/9 comparison, 64/63, ≈27.26¢, the monzo [6, -2, 0, -1], cross-link to /pages/syntonic-comma, Pattern-4 synth cell with createSynth + invalidation.then(dispose).</done>
</task>

<task type="auto">
  <name>Task 2: Register the new page in the sidebar (observablehq.config.ts)</name>
  <files>observablehq.config.ts</files>
  <action>
Edit `observablehq.config.ts`. Inside the `pages` array, find the `{ name: "Theory notes", open: true, pages: [...] }` entry. Append a new entry to its inner `pages` array:

```ts
{ name: "The septimal comma", path: "/pages/septimal-comma" },
```

Order: place it AFTER `{ name: "The schisma", path: "/pages/schisma" }` (most-recent-added convention from the prior two quick tasks 260511-j8l and 260511-jbq). Do not touch any other config field — title, theme, style, toc, pager, header, footer, head, or the top-level `pages` array order all remain unchanged.

After editing, the inner pages array should read in this order:
1. The syntonic comma
2. The Pythagorean comma
3. The schisma
4. The septimal comma
  </action>
  <verify>
    <automated>grep -q '"The septimal comma"' observablehq.config.ts &amp;&amp; grep -q '"/pages/septimal-comma"' observablehq.config.ts &amp;&amp; npx tsc --noEmit --skipLibCheck observablehq.config.ts 2>&amp;1 | grep -v "^$" | grep -c "error TS" | grep -q "^0$"</automated>
  </verify>
  <done>observablehq.config.ts lists "The septimal comma" with path /pages/septimal-comma under Theory notes, placed after The schisma; TypeScript type-check passes with zero errors.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Visual + audio verification</name>
  <what-built>
    - New theory page `src/pages/septimal-comma.md` mirroring `syntonic-comma.md`.
    - Sidebar registration under "Theory notes" in `observablehq.config.ts`.
  </what-built>
  <how-to-verify>
    1. Run `npm run dev` (Observable Framework dev server).
    2. Navigate to `http://localhost:3000/pages/septimal-comma` (or whichever port the dev server reports).
    3. Confirm the page renders with: H1 "The septimal comma", the 64/63 ≈ 27.26¢ KaTeX line, the bra-ket monzo `[6, -2, 0, -1]`, three play buttons (7/4, 16/9, 64/63), and a "See also" section with a link to /pages/syntonic-comma.
    4. Click each of the three play buttons in order — confirm 7/4 sounds noticeably flatter than 16/9, and the 64/63 comma is audible as a microtonal step (~27¢, a touch wider than the Pythagorean comma you can hear on /pages/pythagorean-comma).
    5. Confirm the left sidebar's "Theory notes" group now lists four entries (syntonic, Pythagorean, schisma, septimal) and that clicking "The septimal comma" navigates to the new page.
    6. Spot-check the existing three theory pages still render (no regression from the config edit).
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- Page renders without console errors (KaTeX cells evaluate, commaByName lookup succeeds, three play buttons render).
- Audio comparison works: 7/4, 16/9, 64/63 each plays distinctly; no AudioContext leak (this page's synth disposes on navigation via `invalidation.then(synth.dispose)`).
- Sidebar lists all four theory pages; ordering matches the convention (syntonic → Pythagorean → schisma → septimal).
- No regression on existing pages (`/`, `/pages/analysis`, the three existing theory pages).
- `npx tsc --noEmit` exits 0 (the config edit is a literal object-array push; no type drift expected).
</verification>

<success_criteria>
- [ ] `src/pages/septimal-comma.md` exists and renders in the dev server.
- [ ] Page contains all the must_haves.truths bullets observable by a human at `/pages/septimal-comma`.
- [ ] `observablehq.config.ts` lists the new page under Theory notes.
- [ ] All three play buttons function; cross-link to /pages/syntonic-comma resolves.
- [ ] Human-verify checkpoint approved.
</success_criteria>

<output>
After completion, create `.planning/quick/260511-jyh-add-septimal-comma-theory-page-at-src-pa/SUMMARY.md` summarizing the new page, the sidebar edit, and any observations from the human-verify checkpoint.
</output>
