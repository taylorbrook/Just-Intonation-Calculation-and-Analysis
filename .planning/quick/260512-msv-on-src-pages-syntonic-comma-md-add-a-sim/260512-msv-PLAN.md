---
quick_id: 260512-msv
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/syntonic-comma.md
autonomous: true
requirements:
  - QUICK-260512-msv
must_haves:
  truths:
    - "Clicking the new A/B dyad button on the syntonic-comma page sounds 5/4 and 81/64 simultaneously at baseHz=440, producing an audible ~6.875 Hz beat-rate."
    - "Below the button, the page displays the static beat frequency |f_{5/4} - f_{81/64}| in Hz to 3 decimals (~6.875 Hz), computed from the existing Interval bindings rather than as a literal numeral in markdown prose."
    - "A one-sentence prose annotation under the beat-frequency value explains what the beating is (the audible signature of 81/80 at A=440)."
    - "A 'Tempered out by' callout (blockquote) appears before `## See also` listing meantone (quarter-comma, third-comma, sixth-comma, seventh-comma), 12-EDO, 19-EDO, 31-EDO, 53-EDO."
    - "A `## Further reading` H2 section appears after `## See also` with a bulleted link to https://en.xen.wiki/w/81/80 and a short descriptive sentence."
    - "The page still owns exactly one AudioContext (one and only one `createSynth()` call) - Pitfall #2 honored; the new dyad button reuses the existing page-level `synth` binding."
    - "The page reuses the existing `fiveLimit = new Interval(\"5/4\")` and `pythagorean = new Interval(\"81/64\")` bindings - no second construction of these Intervals."
    - "`tsc --noEmit` exits 0 with no new errors vs baseline."
    - "`npm run build` (observable build) completes clean with no broken-link warnings introduced."
  artifacts:
    - path: "src/pages/syntonic-comma.md"
      provides: "Simultaneous A/B dyad button + static beat-frequency display + tempered-out callout + Further reading section"
      contains: "playDyad(fiveLimit, pythagorean, synth"
  key_links:
    - from: "src/pages/syntonic-comma.md"
      to: "src/components/play-dyad.ts"
      via: "import { playDyad } from \"../components/play-dyad.js\""
      pattern: "import \\{ playDyad \\}"
    - from: "src/pages/syntonic-comma.md"
      to: "existing page-level synth + Interval bindings"
      via: "playDyad(fiveLimit, pythagorean, synth, { label: \"...\" }) reuses fiveLimit, pythagorean, synth from existing cells"
      pattern: "playDyad\\(fiveLimit, *pythagorean, *synth"
---

<objective>
Add a simultaneous-A/B audition button to `src/pages/syntonic-comma.md` that sounds 5/4 and 81/64 together at A4=440 -- making the ~21.5 cent syntonic comma audible as a ~6.875 Hz beat-rate against an unmistakable major-third dyad. Below the button, surface the beat frequency as a static computed value (derived from the existing `Interval` bindings, NOT a float literal in markdown). Add a "Tempered out by" callout listing the systems where 81/80 vanishes, and a `## Further reading` section linking to the Xenharmonic Wiki canonical reference.

Purpose: This is the practical follow-through on the page's existing prose ("audible as a beat-rate when the two thirds are sounded together") -- the user currently has to mentally combine two separate playInterval buttons to hear the beat. The dyad button delivers the effect directly, and the displayed beat-rate teaches the reader how the comma's cents value translates to a measurable Hz signature at a chosen reference.

Output: A single-file edit to `src/pages/syntonic-comma.md` (+~30 lines, no refactor of existing cells / prose / `## In monzos` / `## See also` -- they remain byte-identical in their ranges).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@src/pages/syntonic-comma.md
@src/components/play-dyad.ts
@src/pages/schisma.md
@src/pages/pythagorean-comma.md

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from the codebase. -->

From src/components/play-dyad.ts:
```typescript
export interface PlayDyadOpts {
  baseHz?: number;   // default 440 (D-08)
  duration?: number; // default 1.5 (D-18)
  label?: string;    // when provided, button renders "▶ <label>" instead of "▶"
}
export function playDyad(
  a: Interval,
  b: Interval,
  synth: SynthHandle,
  opts?: PlayDyadOpts,
): HTMLButtonElement;
// Click handler calls synth.playNotes(
//   [baseHz * Number(a.fraction.valueOf()), baseHz * Number(b.fraction.valueOf())],
//   dur,
// );
// SINGLE chord call. Not playArpeggio. Not sequential playNote.
```

Existing page-level bindings already present in src/pages/syntonic-comma.md (lines 5-29) that the new code MUST reuse:
- `synth` -- page-owned `SynthHandle` from `createSynth()` (line 18). DO NOT create a second.
- `syntonic` -- `commaByName("syntonic comma")!` = 81/80 (line 26).
- `fiveLimit` -- `new Interval("5/4")` (line 27).
- `pythagorean` -- `new Interval("81/64")` (line 28).

Insertion convention reference (schisma.md):
- `import { playDyad } from "../components/play-dyad.js";` is added inline in the existing single import cell (lines 5-11) -- no new import cell (Framework module-scope rule).
- `## Further reading` H2 placed after `## See also`, with bulleted link + descriptive sentence (see schisma.md lines 153-170 / pythagorean-comma.md lines 135-143).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Edit src/pages/syntonic-comma.md -- add dyad button, beat-frequency display, tempered-out callout, Further reading</name>
  <files>src/pages/syntonic-comma.md</files>
  <action>
Make a single additive edit to `src/pages/syntonic-comma.md`. All changes below are insertions -- do NOT modify any existing prose, the synth cell, the three Interval-binding lines (`syntonic` / `fiveLimit` / `pythagorean`), the import cell's existing imports, `## In monzos`, or `## See also`. Those ranges must remain byte-identical to the baseline (verify with `git diff src/pages/syntonic-comma.md` -- only additive hunks expected).

**1. Augment the existing import cell (lines 5-11).** Append one line inside the existing fenced code block, directly after the existing `import { playInterval } from "../components/play-interval.js";` line:

```ts
import { playDyad } from "../components/play-dyad.js";
```

Do NOT create a second import cell -- Framework's module-scope rule would re-bind names. This mirrors how schisma.md augments its import cell (schisma.md line 11).

**2. Insert the dyad button + beat-frequency block immediately after the existing "Audition the difference:" bulleted list (line 40), BEFORE the `## In monzos` H2 (line 42).** Insert a blank line, then this new content:

```markdown
The two thirds together -- the syntonic comma as a beat-rate:

${playDyad(fiveLimit, pythagorean, synth, { label: "5/4 + 81/64 (syntonic-comma beat)" })}
```

Then on the next line, add an inline-computed beat-frequency cell. The value MUST be computed from the existing Interval bindings (NOT a hardcoded `6.875` literal -- Pitfall #1: the BigInt-Fraction is the source of truth, Hz is derived at the audio/display boundary). Use an IIFE so the computation happens once per page render:

```ts
const beatHz = (() => {
  const baseHz = 440; // matches playDyad's default (D-08)
  const fFiveLimit = baseHz * Number(fiveLimit.fraction.valueOf());   // 550 Hz
  const fPythag    = baseHz * Number(pythagorean.fraction.valueOf()); // 556.875 Hz
  return Math.abs(fPythag - fFiveLimit);                              // 6.875 Hz
})();
```

Then a prose paragraph that interpolates the computed value (using `.toFixed(3)`) and explains what the beating is:

```markdown
Beat frequency at A = 440 Hz: ${beatHz.toFixed(3)} Hz. The 5/4 third lands at
550 Hz and the 81/64 third at 556.875 Hz; their near-coincident upper partials
fall in and out of phase at that rate. The syntonic comma's ~21.5¢ size,
scaled to this anchor, is exactly this audible Hz signature.
```

**3. Insert the "Tempered out by" callout immediately before the `## See also` H2 (currently at line 49 in the baseline).** Use a plain markdown blockquote -- there is no callout CSS class in `src/styles.css`, so the project convention is the bare `>` blockquote. Place a blank line before and after the blockquote:

```markdown
> **Tempered out by.** Meantone in all common variants (quarter-comma /
> third-comma / sixth-comma / seventh-comma), 12-EDO, 19-EDO, 31-EDO, 53-EDO.
> These are precisely the temperaments that map 81/80 to a unison -- the
> prime-5 major third (5/4) and the Pythagorean major third (81/64) collapse
> onto the same scale degree, and the comma vanishes from the system.
```

**4. Append a new `## Further reading` H2 section after `## See also` (after the existing closing paragraph at line 58).** Match the schisma.md / pythagorean-comma.md placement and shape:

```markdown
## Further reading

- [81/80 on the Xenharmonic Wiki](https://en.xen.wiki/w/81/80) --
  community-curated reference for the syntonic comma, covering its role
  as the defining comma of 5-limit meantone, the family of temperaments
  that vanish it (the meantone variants plus 12-/19-/31-/53-EDO), and
  worked examples of comma pumps that drift by exactly 81/80 per cycle.
```

**Specificity / pitfall guard:**
- Reuse `fiveLimit` and `pythagorean` directly -- do NOT write `new Interval("5/4")` or `new Interval("81/64")` anywhere new (grep gate below enforces).
- Reuse the page-level `synth` binding from the existing synth cell -- do NOT call `createSynth()` a second time (grep gate `grep -c 'createSynth()' src/pages/syntonic-comma.md` must equal 1).
- Do NOT hardcode `6.875` as a literal anywhere except inside a `// 6.875 Hz` code comment -- the displayed value MUST come from `${beatHz.toFixed(3)}` (grep gate enforces no markdown-prose occurrence).
- Do NOT use `tex` for the beat-frequency value -- plain markdown with `${beatHz.toFixed(3)}` interpolation is correct; tex would force re-typeset and is unnecessary for a static scalar (this matches the monzo-builder/spiral-of-fifths lessons recorded in STATE.md re: KaTeX flicker).
- Blockquote callout: bare `>` only, no callout CSS class, no `<div>` wrapper.
- Order on disk after the edit: `## In monzos` -> tempered-out blockquote -> `## See also` -> `## Further reading`.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npx tsc --noEmit 2>&1 | tail -20 && test "$(grep -c 'createSynth()' src/pages/syntonic-comma.md)" = "1" && test "$(grep -c "import { playDyad }" src/pages/syntonic-comma.md)" = "1" && test "$(grep -c 'playDyad(fiveLimit, pythagorean, synth' src/pages/syntonic-comma.md)" = "1" && test "$(grep -c '^## Further reading' src/pages/syntonic-comma.md)" = "1" && test "$(grep -c 'en.xen.wiki/w/81/80' src/pages/syntonic-comma.md)" = "1" && test "$(grep -v '^#' src/pages/syntonic-comma.md | grep -cE '^[^/]*6\.875[^/]*$' )" = "0" && echo "GREP-GATES PASS" && npm run build 2>&1 | tail -10</automated>
  </verify>
  <done>
    - `src/pages/syntonic-comma.md` contains the new playDyad import, the dyad button cell, the beatHz IIFE, the beat-frequency prose paragraph, the tempered-out blockquote (before `## See also`), and the `## Further reading` section (after `## See also`).
    - `grep -c 'createSynth()' src/pages/syntonic-comma.md` returns `1`.
    - `grep -c 'playDyad(fiveLimit, pythagorean, synth' src/pages/syntonic-comma.md` returns `1`.
    - `grep -c '^## Further reading' src/pages/syntonic-comma.md` returns `1`.
    - No hardcoded `6.875` literal appears outside code comments (verified by the grep gate filtering `//` lines).
    - `npx tsc --noEmit` exits 0 with no new errors vs the 5 pre-existing `npm:` specifier baseline errors recorded in STATE.md.
    - `npm run build` completes clean with no new broken-link warnings (the new https://en.xen.wiki/w/81/80 link is external and not validated by observable's internal link-checker -- the existing 79-link clean baseline must remain green).
    - No file other than `src/pages/syntonic-comma.md` is modified (verified by `git status --porcelain` showing only that single path).
  </done>
</task>

</tasks>

<verification>
After the executor finishes:

1. Diff the page against the baseline -- only additive hunks expected. The synth cell, the three Interval bindings, the `## In monzos` section, and the `## See also` section must be byte-identical to baseline in their original ranges.
   ```
   git diff src/pages/syntonic-comma.md
   ```
2. Open `http://localhost:3000/syntonic-comma` in `npm run dev`. Click the new "▶ 5/4 + 81/64 (syntonic-comma beat)" button. You should hear a major-third dyad with a clearly audible slow beating at roughly 6-7 Hz (about seven pulses per second).
3. The beat-frequency line below the button reads "Beat frequency at A = 440 Hz: 6.875 Hz." -- confirming the static derivation from the Interval bindings matches the audible signature.
4. The "Tempered out by" blockquote renders with the four meantone variants and four EDOs; it sits between the audition section and `## See also`.
5. The `## Further reading` section appears as the final H2 with the Xenharmonic Wiki link.
</verification>

<success_criteria>
- All `must_haves.truths` observable on the rendered page.
- All `must_haves.key_links` grep patterns match in the edited file.
- tsc baseline unchanged; build clean.
- No other files modified.
- Page bundle size delta is negligible (no new dependencies; playDyad is already shipped via schisma.md's edit).
</success_criteria>

<output>
After completion, create `.planning/quick/260512-msv-on-src-pages-syntonic-comma-md-add-a-sim/260512-msv-SUMMARY.md` using the GSD summary template, documenting: the four insertions, the beat-frequency derivation (showing it stays at the BigInt-Fraction boundary), confirmation of grep gates and tsc/build cleanliness, and the per-page bundle-size impact if any.
</output>
