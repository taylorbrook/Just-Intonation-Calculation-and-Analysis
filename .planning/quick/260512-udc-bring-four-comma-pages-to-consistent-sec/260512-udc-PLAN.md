---
phase: quick-260512-udc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/pythagorean-comma.md
  - src/pages/schisma.md
autonomous: true
requirements:
  - UDC-01  # pythagorean-comma.md: add simultaneous playDyad audition
  - UDC-02  # pythagorean-comma.md: add "Tempered out by" blockquote
  - UDC-03  # schisma.md: add "Tempered out by" blockquote
  - UDC-04  # all four comma pages share the canonical "Tempered out by" blockquote shape

must_haves:
  truths:
    - "pythagorean-comma.md imports playDyad from ../components/play-dyad.js (same path syntonic/septimal/schisma use)."
    - "pythagorean-comma.md renders a simultaneous-dyad ▶ button via playDyad(pureOctave, cycleOctave, synth, { label: ... }) placed AFTER the existing three playInterval bullets and BEFORE the '## The closure gap, visualized' heading."
    - "pythagorean-comma.md contains exactly one '> **Tempered out by.**' blockquote, sitting between '## In monzos' and '## See also', listing 12-EDO, 19-EDO, and 24-EDO verbatim per user spec and contrasting with 53-EDO (which preserves the comma)."
    - "schisma.md contains exactly one '> **Tempered out by.**' blockquote, sitting between '## In monzos' and '## See also', listing schismatic temperament (Helmholtz / Groven / Garibaldi), 53-EDO, and 41-EDO."
    - "All four comma pages (pythagorean-comma.md, syntonic-comma.md, schisma.md, septimal-comma.md) contain '> **Tempered out by.**' EXACTLY ONCE each — consistent canonical-position blockquote shape across the set."
    - "No src/lib/ files are modified — BigInt-exact arithmetic kernel is untouched."
    - "The existing 'Schismatic temperament' prose section in schisma.md (the schismaticThird + fiveLimitThird playDyad and surrounding explainer) is preserved verbatim."
  artifacts:
    - path: "src/pages/pythagorean-comma.md"
      provides: "Pythagorean-comma research page with full canonical section structure (def+cents, audition w/ simultaneous dyad, viz, monzos, tempered-out-by, see also, further reading)"
      contains: "import { playDyad } from \"../components/play-dyad.js\""
    - path: "src/pages/pythagorean-comma.md"
      provides: "Simultaneous dyad audition of pureOctave + cycleOctave"
      contains: "playDyad(pureOctave, cycleOctave"
    - path: "src/pages/pythagorean-comma.md"
      provides: "Canonical Tempered-out-by blockquote"
      contains: "> **Tempered out by.**"
    - path: "src/pages/schisma.md"
      provides: "Canonical Tempered-out-by blockquote (in addition to preserved Schismatic-temperament prose section)"
      contains: "> **Tempered out by.**"
  key_links:
    - from: "src/pages/pythagorean-comma.md"
      to: "src/components/play-dyad.ts"
      via: "ESM import + invocation in markdown reactive cell"
      pattern: "import \\{ playDyad \\} from \"\\.\\./components/play-dyad\\.js\""
    - from: "src/pages/pythagorean-comma.md"
      to: "playDyad rendered inline in markdown body"
      via: "interpolated component call (returns HTMLButtonElement)"
      pattern: "playDyad\\(pureOctave, cycleOctave"
    - from: "All four comma pages"
      to: "Canonical blockquote shape (bare `>` markdown, **Tempered out by.** bold prefix; NO `.callout` div, NO CSS class)"
      via: "Markdown blockquote sibling of `## In monzos` / `## See also`"
      pattern: "^> \\*\\*Tempered out by\\.\\*\\*"
---

<objective>
Bring `pythagorean-comma.md` and `schisma.md` up to the canonical comma-page
section structure already in place on `syntonic-comma.md` and `septimal-comma.md`,
so that all four pages share an identical shape: (1) definition + cents, (2)
audition (dyads + simultaneous via playDyad), (3) "In monzos", (4) "Tempered
out by" blockquote — listing the temperaments / EDOs that vanish this comma,
(5) "See also" + "Further reading".

Purpose: Reader experience is uniform across the four comma pages. Each page
ends with the same canonical "Tempered out by" callout in the same position,
so the reader can scan-find this information without hunting.

Output:
- `pythagorean-comma.md`: gains `playDyad` import + one simultaneous dyad
  button + one `> **Tempered out by.**` blockquote.
- `schisma.md`: gains one `> **Tempered out by.**` blockquote between
  "## In monzos" and "## See also". Existing `## Schismatic temperament`
  section (with its schismaticThird + fiveLimitThird playDyad) is preserved
  untouched.
- No changes to syntonic-comma.md, septimal-comma.md, or src/lib/* (kernel
  arithmetic is untouched per user spec).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@src/pages/pythagorean-comma.md
@src/pages/syntonic-comma.md
@src/pages/schisma.md
@src/pages/septimal-comma.md
@src/components/play-dyad.ts

<interfaces>
<!-- Key types and contracts the executor needs. -->
<!-- Use these directly — no codebase exploration needed. -->

From src/components/play-dyad.ts:
```typescript
export interface PlayDyadOpts {
  baseHz?: number;     // default 440 (D-08)
  duration?: number;   // default 1.5s (D-18)
  label?: string;      // when provided, button text becomes `▶ <label>` else just `▶`
}

export function playDyad(
  a: Interval,
  b: Interval,
  synth: SynthHandle,
  opts?: PlayDyadOpts,
): HTMLButtonElement;
```

Canonical blockquote shape (from syntonic-comma.md lines 68–72, septimal-comma.md
lines 139–144) — REUSE EXACTLY:

```markdown
> **Tempered out by.** <list of temperaments / EDOs>. <one-sentence
> mechanistic explainer of what vanishing this comma does, and optionally a
> contrast against a temperament that PRESERVES it>.
```

NO `.callout` div, NO CSS class, NO custom HTML — plain markdown blockquote
with a bold `**Tempered out by.**` prefix and a period after `by`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: pythagorean-comma.md — add playDyad import, simultaneous dyad button, and "Tempered out by" blockquote</name>
  <files>src/pages/pythagorean-comma.md</files>
  <action>
Make THREE atomic edits to `src/pages/pythagorean-comma.md`. Do NOT touch any
other file. Do NOT touch src/lib/*.

**Edit 1 — Add playDyad import.**

In the imports cell at lines 5–13, add an import line for `playDyad` right
after the existing `playInterval` import. The resulting imports cell must be:

```ts
import { Interval } from "../lib/interval.js";
import { commaByName } from "../lib/commas.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
import { playDyad } from "../components/play-dyad.js";
import { spiralOfFifths } from "../components/spiral-of-fifths.js";
import * as Plot from "npm:@observablehq/plot";
```

The `playDyad` import path MUST match exactly what syntonic-comma.md /
septimal-comma.md / schisma.md use: `"../components/play-dyad.js"` (with the
`.js` extension — Framework convention even for TS source).

**Edit 2 — Add simultaneous dyad button + brief explainer.**

Currently the three `playInterval` bullets end at line 51, then line 53 starts
`## The closure gap, visualized`. Insert a new block BETWEEN the third bullet
and the `## The closure gap, visualized` heading. The new block matches the
style used in syntonic-comma.md lines 43–45 and septimal-comma.md lines 46–48:

```markdown
The pure octave and the cycle-of-fifths octave together — the Pythagorean comma as a beat-rate:

${playDyad(pureOctave, cycleOctave, synth, { label: "2/1 + 531441/262144 (Pythagorean-comma beat)" })}
```

Place a single blank line before "The pure octave and the cycle-of-fifths …"
and a single blank line after the `${playDyad(...)}` line, so it sits as its
own paragraph. The next non-blank line after the dyad button is the existing
`## The closure gap, visualized` heading. Do NOT add a Hz-beat IIFE here —
the existing drift chart already quantifies the gap; one inline simultaneous-
dyad button is the consistency target.

The two Interval bindings `pureOctave` and `cycleOctave` already exist in the
upper reactive cell (lines 29 and 35–37). Do NOT redeclare them. Do NOT modify
the BigInt-exact arithmetic in that cell.

**Edit 3 — Add "Tempered out by" blockquote.**

Currently `## In monzos` runs lines 120–126, then `## See also` starts at
line 128. Insert the canonical blockquote between the last line of the
"In monzos" prose paragraph and the `## See also` heading. The blockquote
content lists 12-EDO, 19-EDO, and 24-EDO VERBATIM per the user's spec, frames
them as "any 12-stable EDO", and contrasts with 53-EDO which preserves the
comma:

```markdown
> **Tempered out by.** 12-EDO, 19-EDO, 24-EDO — and more broadly, any
> 12-stable EDO whose patent val maps twelve fifths to seven octaves.
> Tempering 531441/524288 to a unison is precisely what lets a 12-note
> cycle of fifths close: the comma's ~23.46¢ overshoot is absorbed back
> into the octave. By contrast, 53-EDO (and finer Pythagorean-friendly
> divisions like 665-EDO) preserve the Pythagorean comma as a distinct,
> audible step — twelve fifths and seven octaves remain non-equivalent.
```

Place a single blank line before the `>` and a single blank line after the
last `>` line. The next non-blank line must be `## See also`.

(Note for SUMMARY only — do NOT change the blockquote text: 19-EDO is listed
per user directive; under the patent val 19-EDO does not technically vanish
the Pythagorean comma. Flag in SUMMARY for SME to confirm.)

Do NOT alter any other content in the file (the drift-chart IIFE, the
spiralOfFifths call, the `## In monzos` LaTeX, the `## See also` paragraph,
the `## Further reading` bullet — all stay verbatim).
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" &amp;&amp; grep -c '^import { playDyad } from "../components/play-dyad.js";$' src/pages/pythagorean-comma.md | grep -qx 1 &amp;&amp; grep -c 'playDyad(pureOctave, cycleOctave, synth,' src/pages/pythagorean-comma.md | grep -qx 1 &amp;&amp; grep -c '^&gt; \*\*Tempered out by\.\*\*' src/pages/pythagorean-comma.md | grep -qx 1 &amp;&amp; grep -q '12-EDO, 19-EDO, 24-EDO' src/pages/pythagorean-comma.md &amp;&amp; ! git diff --name-only src/lib/ | grep -q . &amp;&amp; echo OK</automated>
  </verify>
  <done>
- `import { playDyad } from "../components/play-dyad.js";` appears exactly once in pythagorean-comma.md, on its own line, in the existing imports cell.
- `playDyad(pureOctave, cycleOctave, synth, { label: "2/1 + 531441/262144 (Pythagorean-comma beat)" })` is rendered as a markdown interpolation (`${...}`) AFTER the third `playInterval` bullet and BEFORE the `## The closure gap, visualized` heading, preceded by a one-line prose intro matching syntonic/septimal style.
- A blockquote beginning `> **Tempered out by.**` appears exactly once in pythagorean-comma.md, between `## In monzos` and `## See also`, mentioning 12-EDO, 19-EDO, 24-EDO and contrasting with 53-EDO.
- No edits to src/lib/*.
- Page still builds (Framework dev server / `tsc --noEmit` on TS code blocks passes — no new type errors).
  </done>
</task>

<task type="auto">
  <name>Task 2: schisma.md — add "Tempered out by" blockquote</name>
  <files>src/pages/schisma.md</files>
  <action>
Make ONE atomic edit to `src/pages/schisma.md`. Do NOT touch any other file.
Do NOT modify the existing `## Schismatic temperament` section (lines
110–133, including the `schismaticThird` + `fiveLimitThird` playDyad and
surrounding prose) — it's preserved verbatim. We are ONLY adding a canonical
blockquote in the standard position.

**Edit — Add "Tempered out by" blockquote between `## In monzos` and `## See also`.**

Currently `## In monzos` runs lines 135–143, then `## See also` starts at
line 145. Insert the canonical blockquote between the last line of the
"In monzos" prose paragraph and the `## See also` heading. Reuse the shape
already used by syntonic-comma.md (lines 68–72) and septimal-comma.md
(lines 139–144) — bare markdown `>` blockquote, bold `**Tempered out by.**`
prefix, period after `by`, NO `.callout` div, NO CSS class.

Content (verbatim — list and prose):

```markdown
> **Tempered out by.** Schismatic temperament (Helmholtz / Groven /
> Garibaldi — narrow each fifth by ~0.24¢ so a chain of eight fifths
> lands on a pure 5/4), 53-EDO, and 41-EDO. These mappings identify
> 8192/6561 with 5/4 — the Pythagorean diminished fourth and the
> 5-limit major third collapse onto the same scale degree, and the
> ~1.95¢ schisma vanishes from the system.
```

Place a single blank line before the `>` and a single blank line after the
last `>` line. The next non-blank line must be `## See also`.

The existing `## Schismatic temperament` section already names Helmholtz and
discusses the 0.24¢-narrow-fifths recipe — the new blockquote is the canonical
scan-find summary in the standard position; the longer prose section remains
the deep-dive. Do NOT delete or reword that section.

Do NOT alter any other content in the file (the bar-chart IIFE, the
schismaticThird + fiveLimitThird playDyad, the `## In monzos` LaTeX, the
`## See also` paragraph, the `## Further reading` bullets — all stay verbatim).
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" &amp;&amp; grep -c '^&gt; \*\*Tempered out by\.\*\*' src/pages/schisma.md | grep -qx 1 &amp;&amp; grep -q 'Schismatic temperament (Helmholtz / Groven / Garibaldi' src/pages/schisma.md &amp;&amp; grep -q '53-EDO, and 41-EDO' src/pages/schisma.md &amp;&amp; grep -c '^## Schismatic temperament$' src/pages/schisma.md | grep -qx 1 &amp;&amp; grep -c 'playDyad(schismaticThird, fiveLimitThird' src/pages/schisma.md | grep -qx 1 &amp;&amp; ! git diff --name-only src/lib/ | grep -q . &amp;&amp; echo OK</automated>
  </verify>
  <done>
- A blockquote beginning `> **Tempered out by.**` appears exactly once in schisma.md, between `## In monzos` and `## See also`.
- Blockquote mentions schismatic temperament (Helmholtz / Groven / Garibaldi), 53-EDO, and 41-EDO.
- The pre-existing `## Schismatic temperament` H2 heading still appears exactly once.
- The pre-existing `playDyad(schismaticThird, fiveLimitThird, ...)` call still appears exactly once (deep-dive section untouched).
- No edits to src/lib/*.
- Page still builds.
  </done>
</task>

</tasks>

<verification>
Cross-page consistency check — run after both tasks complete. All four comma
pages must contain the canonical blockquote EXACTLY ONCE each:

```bash
cd "/Users/taylorbrook/Dev/Tuning Systems"
for f in src/pages/pythagorean-comma.md src/pages/syntonic-comma.md src/pages/schisma.md src/pages/septimal-comma.md; do
  n=$(grep -c '^> \*\*Tempered out by\.\*\*' "$f")
  echo "$f: $n"
  [ "$n" = "1" ] || { echo "FAIL: $f"; exit 1; }
done
echo "OK — all four comma pages contain '> **Tempered out by.**' exactly once."
```

Kernel-untouched check:

```bash
cd "/Users/taylorbrook/Dev/Tuning Systems"
git diff --name-only src/lib/ | grep . && { echo "FAIL: src/lib/ modified"; exit 1; } || echo "OK — src/lib/ untouched."
```

playDyad import path consistency check — all four pages use the same import
path:

```bash
cd "/Users/taylorbrook/Dev/Tuning Systems"
for f in src/pages/pythagorean-comma.md src/pages/syntonic-comma.md src/pages/schisma.md src/pages/septimal-comma.md; do
  grep -q '^import { playDyad } from "../components/play-dyad.js";$' "$f" || { echo "FAIL: $f"; exit 1; }
done
echo "OK — all four pages import playDyad from the canonical path."
```

Framework build check (smoke test — no new errors introduced):

```bash
cd "/Users/taylorbrook/Dev/Tuning Systems" && npx tsc --noEmit 2>&1 | tail -5
# Expected: no new errors referencing pythagorean-comma.md or schisma.md.
```
</verification>

<success_criteria>
- All four comma pages share the canonical section structure: definition + cents → audition (dyads + simultaneous playDyad) → "In monzos" → "Tempered out by" blockquote → "See also" → "Further reading".
- All four pages contain `> **Tempered out by.**` exactly once each, in the same canonical position (between `## In monzos` and `## See also`).
- `pythagorean-comma.md` gains its first simultaneous-dyad audition via `playDyad(pureOctave, cycleOctave, …)`.
- `schisma.md` gains the canonical blockquote summary while keeping the deeper `## Schismatic temperament` prose section intact.
- No file under `src/lib/` is modified — BigInt-exact arithmetic kernel untouched.
- Each task commits separately (Task 1: pythagorean-comma; Task 2: schisma) so a future bisect lands on the minimal change.
</success_criteria>

<output>
After completion, create `.planning/quick/260512-udc-bring-four-comma-pages-to-consistent-sec/260512-udc-SUMMARY.md` with:
- Diff summary per file (with line ranges where the blockquotes / playDyad call landed).
- Note flagging the 19-EDO question for SME confirmation: the user listed 19-EDO among Pythagorean-comma-tempering EDOs; under the patent val 19-EDO does NOT temper the Pythagorean comma (12 fifths = 132 steps; 7 octaves = 133 steps). Recorded verbatim per user directive; flag for SME to confirm whether a non-patent mapping is intended OR whether the list should be tightened to 12-EDO + 24-EDO (+ other 12-stable EDOs).
- Verification command outputs (the cross-page consistency check + the kernel-untouched check + the import-path consistency check).
- STATE.md row update.
</output>
