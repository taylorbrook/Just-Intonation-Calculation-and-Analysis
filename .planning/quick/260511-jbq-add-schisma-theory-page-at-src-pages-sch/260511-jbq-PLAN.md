---
phase: quick-260511-jbq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/schisma.md
  - observablehq.config.ts
autonomous: true
requirements:
  - QUICK-260511-jbq
must_haves:
  truths:
    - "User can visit /pages/schisma and see a complete theory note on the schisma"
    - "Page states schisma = 32805/32768 ≈ 1.95¢, monzo [-15, 8, 1]"
    - "Page tells the story: schisma = Pythagorean comma − syntonic comma"
    - "User can audition all three commas in sequence (Pythagorean ~23.46¢, syntonic ~21.5¢, schisma ~1.95¢) and hear the size order"
    - "Page mentions schismatic temperament in exactly one sentence"
    - "Page links to /pages/syntonic-comma and /pages/pythagorean-comma in 'See also'"
    - "Schisma page appears in the 'Theory notes' sidebar group"
  artifacts:
    - path: "src/pages/schisma.md"
      provides: "Theory note on the schisma (32805/32768), structured identically to syntonic-comma.md"
      contains: "commaByName(\"schisma\")"
    - path: "observablehq.config.ts"
      provides: "Sidebar registration for the schisma page under Theory notes"
      contains: "/pages/schisma"
  key_links:
    - from: "src/pages/schisma.md"
      to: "src/lib/commas.ts"
      via: "commaByName(\"schisma\") import"
      pattern: "commaByName\\(\"schisma\"\\)"
    - from: "src/pages/schisma.md"
      to: "src/pages/syntonic-comma.md"
      via: "Markdown link in 'See also'"
      pattern: "/pages/syntonic-comma"
    - from: "src/pages/schisma.md"
      to: "src/pages/pythagorean-comma.md"
      via: "Markdown link in 'See also'"
      pattern: "/pages/pythagorean-comma"
    - from: "observablehq.config.ts"
      to: "src/pages/schisma.md"
      via: "Sidebar pages entry"
      pattern: "schisma"
---

<objective>
Add a third theory page — `src/pages/schisma.md` — that completes the comma triptych (syntonic, Pythagorean, schisma) by telling the size-comparison story.

Purpose: The schisma (32805/32768, ~1.95¢) is the difference between the Pythagorean and syntonic commas — a near-audibility-threshold interval that closes a meaningful theoretical loop in the existing notes. The page must mirror the established syntonic-comma.md template (synth cell pattern, ratio pills, playInterval audition, monzo display) so the three pages form a coherent set.

Output:
- `src/pages/schisma.md` — a fully working theory note rendered by Observable Framework.
- `observablehq.config.ts` — extended sidebar so the new page appears under "Theory notes".
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@src/pages/syntonic-comma.md
@src/pages/pythagorean-comma.md
@src/lib/commas.ts
@observablehq.config.ts

<interfaces>
<!-- Contracts the executor needs. Already verified against the codebase — no exploration required. -->

From src/lib/commas.ts:
```ts
// "schisma" is present at line 33: { name: "schisma", monzo: [-15, 8, 1] }
// "Pythagorean comma" is present at line 32 (note the capital P)
// "syntonic comma" is present at line 31 (lowercase)
export function commaByName(name: string): Interval | undefined;
```

From src/lib/interval.js (used in template):
```ts
new Interval(ratio: string): Interval   // e.g. new Interval("2/1")
```

From src/audio/synth.js (used in template):
```ts
createSynth(): { dispose(): void; /* ...playNote/playNotes used by playInterval */ }
```

From src/components/play-interval.js (used in template):
```ts
playInterval(interval, synth, { label: true }): HTMLElement
```

From src/components/ratio-pill.js (used in template):
```ts
ratioPill(interval): HTMLElement
```

Math identity (verified by hand from src/lib/commas.ts monzos):
- Pythagorean comma:  [-19, 12,  0]   = 531441/524288 ≈ 23.46¢
- syntonic comma:     [ -4,  4, -1]   =      81/80   ≈ 21.51¢
- schisma:            [-15,  8,  1]   =  32805/32768 ≈  1.95¢
- Pythagorean − syntonic = [-19-(-4), 12-4, 0-(-1)] = [-15, 8, 1] = schisma ✓
- Therefore the page MUST state: schisma = Pythagorean comma − syntonic comma
  (NOT the reverse — the Pythagorean is the wider of the two, so subtracting the
  syntonic from it leaves a positive schisma.)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create src/pages/schisma.md and register it in the sidebar</name>
  <files>src/pages/schisma.md, observablehq.config.ts</files>
  <action>
Create `src/pages/schisma.md` mirroring `src/pages/syntonic-comma.md` structurally. The page MUST follow the template's exact cell pattern and component vocabulary — do not invent new patterns.

**Page structure (in this order):**

1. **H1 title** — `# The schisma` followed by a one-line tagline:
   `32805/32768 — the gap between the Pythagorean and syntonic commas, at the threshold of audibility`

2. **Imports cell** (` ```ts ` block) — IDENTICAL to the syntonic-comma.md imports cell (lines 5–11): `Interval`, `commaByName`, `createSynth`, `ratioPill`, `playInterval`.

3. **Synth cell** (` ```ts ` block) — IDENTICAL to the syntonic-comma.md synth cell (lines 13–20), VERBATIM, including the ARCHITECTURE Pattern 4 / Pitfall #2 comment. Pattern:
   ```ts
   const synth = createSynth();
   invalidation.then(() => synth.dispose());
   ```

4. **Interval-construction cell** (` ```ts ` block) — declare three intervals via `commaByName` (preferred when the key exists in the table — keeps the page consistent with the template's "lookup is total at construction time" comment):
   ```ts
   const schisma = commaByName("schisma")!;                         // 32805/32768
   const syntonic = commaByName("syntonic comma")!;                 // 81/80
   const pythagorean = commaByName("Pythagorean comma")!;           // 531441/524288 (note capital P)
   ```
   Add the same `!`-assertion + drift-honesty comment from the template (lines 23–25).

5. **Prose paragraph** — state the definition with `tex` and the size relationship:
   - `The **schisma** is ${tex\`\frac{32805}{32768} \approx 1.95\text{¢}\`}, the difference between the Pythagorean comma and the syntonic comma.`
   - Follow with one sentence giving the explicit subtraction:
     `${tex\`\frac{531441/524288}{81/80} = \frac{32805}{32768}\`}`
   - Add one sentence noting the audibility-threshold framing: the schisma sits at ~2¢, near the JND for pitch in slow contexts — audible as a beat-rate against a sustained reference, often inaudible as a melodic step.

6. **Audition list** — three bullets that play the three commas in DESCENDING size order so the listener hears the gradient from "audible interval" to "barely-audible artifact":
   - `${playInterval(pythagorean, synth, { label: true })}` — Pythagorean comma (~23.46¢): the wider of the two parent commas; clearly audible as a microtonal step.
   - `${playInterval(syntonic, synth, { label: true })}` — syntonic comma (~21.5¢): about 2¢ narrower than the Pythagorean.
   - `${playInterval(schisma, synth, { label: true })}` — the schisma itself (~1.95¢): the residue. Right at the threshold of audibility; you may hear it as a faint beating rather than a definite pitch.

7. **Schismatic-temperament sentence** — exactly one sentence, e.g.:
   `Tempering out the schisma (treating ${ratioPill(schisma)} as a unison) yields *schismatic temperament*, which identifies a stack of eight pure fifths reduced by five octaves with a 5-limit major third — collapsing the Pythagorean/5-limit distinction at the cost of slightly detuned fifths.`

8. **`## In monzos` section** — mirror the syntonic-comma template (lines 42–47). The display:
   `${tex\`32805/32768 = \begin{bmatrix} -15 & 8 & 1 \end{bmatrix}\rangle = 2^{-15} \cdot 3^{8} \cdot 5^{1}\`}`
   Follow with one short paragraph: the prime-3 column (8) and prime-5 column (1) together encode the Pythagorean stack vs. 5-limit-third reconciliation; subtract the syntonic monzo `[-4, 4, -1]` from the Pythagorean monzo `[-19, 12, 0]` and the schisma's monzo `[-15, 8, 1]` falls out exactly.

9. **`## See also` section** — three sentences (or one paragraph with three links):
   - Link to [/pages/syntonic-comma](/pages/syntonic-comma) — "the 5-limit closure gap".
   - Link to [/pages/pythagorean-comma](/pages/pythagorean-comma) — "the 3-limit closure gap".
   - One sentence pointing back to the dashboard at [/](/) for hands-on JI scale construction.

**Style constraints (mirror template verbatim where indicated):**
- Use `${tex\`...\`}` for inline math, `${ratioPill(x)}` for ratio pills, `${playInterval(x, synth, { label: true })}` for clickable audition links — these are the conventions established in syntonic-comma.md and pythagorean-comma.md.
- Do NOT add any new imports beyond the five in the template's import cell.
- Do NOT introduce `new Interval(...)` calls when `commaByName` covers the lookup — keeps the page consistent with the table-as-source-of-truth pattern.
- Do NOT modify any other file (no library changes — `commaByName("schisma")` already works per src/lib/commas.ts line 33).

**Sidebar registration in observablehq.config.ts:**

Add a third entry to the "Theory notes" group, after the Pythagorean comma entry. Open the file, find the `pages` array under `name: "Theory notes"` (lines 14–21), and append:

```ts
{ name: "The schisma", path: "/pages/schisma" },
```

So the final block reads:
```ts
{
  name: "Theory notes",
  open: true,
  pages: [
    { name: "The syntonic comma", path: "/pages/syntonic-comma" },
    { name: "The Pythagorean comma", path: "/pages/pythagorean-comma" },
    { name: "The schisma", path: "/pages/schisma" },
  ],
},
```

Do not change anything else in observablehq.config.ts — header, footer, theme, style, head must remain untouched.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&amp;1 | tee /tmp/schisma-tsc.log; test -f src/pages/schisma.md &amp;&amp; grep -q 'commaByName("schisma")' src/pages/schisma.md &amp;&amp; grep -q '/pages/syntonic-comma' src/pages/schisma.md &amp;&amp; grep -q '/pages/pythagorean-comma' src/pages/schisma.md &amp;&amp; grep -q '32805/32768' src/pages/schisma.md &amp;&amp; grep -q 'schismatic' src/pages/schisma.md &amp;&amp; grep -q '"/pages/schisma"' observablehq.config.ts</automated>
  </verify>
  <done>
    - `src/pages/schisma.md` exists with all nine structural sections (H1, imports cell, synth cell, intervals cell, definition prose, audition list of three bullets, schismatic-temperament sentence, In monzos section, See also section).
    - File contains `commaByName("schisma")` (lookup against the existing table).
    - File contains links to both `/pages/syntonic-comma` and `/pages/pythagorean-comma`.
    - File mentions schismatic temperament in exactly one sentence.
    - Audition bullets are ordered Pythagorean → syntonic → schisma (descending size) so the size gradient is audible.
    - `observablehq.config.ts` has a new sidebar entry `{ name: "The schisma", path: "/pages/schisma" }` appended to the Theory notes group; no other changes.
    - `npx tsc --noEmit` passes (no new type errors introduced — Framework transpiles .ts cells inside .md but tsc only checks .ts files; the config edit must remain valid TypeScript).
  </done>
</task>

</tasks>

<verification>
**Build + visual smoke test (manual, post-execution):**
1. `npm run dev` (or `npx observable preview`) — open the local Framework server.
2. Confirm "The schisma" appears in the left sidebar under "Theory notes".
3. Visit `/pages/schisma`. Confirm:
   - Page renders without runtime errors.
   - Three audition links appear and play (Pythagorean / syntonic / schisma).
   - KaTeX renders the fractions and the monzo `[-15, 8, 1]`.
   - "See also" links navigate to the sibling pages.
4. From the sibling pages, manually verify there is at least one back-link path (via header nav or sidebar) — no edits to siblings are required, just a sanity check.

**Automated check** (covered in task verify):
- `npx tsc --noEmit` clean.
- grep confirms the required strings exist in `src/pages/schisma.md` and `observablehq.config.ts`.
</verification>

<success_criteria>
- New page `src/pages/schisma.md` exists and is structurally a peer of `syntonic-comma.md` and `pythagorean-comma.md`.
- Page tells the correct story: **schisma = Pythagorean comma − syntonic comma** (NOT the reverse).
- All three commas are auditionable from the page in descending-size order.
- Schismatic temperament is mentioned in exactly one sentence.
- Cross-links to both sibling theory pages exist in the "See also" section.
- Sidebar in `observablehq.config.ts` lists the schisma page alongside its siblings.
- `npx tsc --noEmit` passes.
</success_criteria>

<output>
After completion, create `.planning/quick/260511-jbq-add-schisma-theory-page-at-src-pages-sch/260511-jbq-SUMMARY.md` documenting:
- The new page's location and what it covers.
- The monzo arithmetic that justified the story direction (Pythagorean − syntonic = schisma).
- The sidebar registration change in `observablehq.config.ts`.
- Any small deviations from the syntonic-comma.md template (and why).
</output>
