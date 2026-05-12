---
quick_id: 260512-sxc
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/septimal-comma.md
autonomous: true
requirements:
  - QUICK-260512-sxc
must_haves:
  truths:
    - "Clicking the new A/B dyad button on the septimal-comma page sounds 7/4 and 16/9 simultaneously at baseHz=440, producing an audible ~12.222 Hz beat-rate (the septimal-comma beat)."
    - "Below the button, the page displays the static beat frequency |f_{16/9} - f_{7/4}| in Hz to 3 decimals (~12.222 Hz), computed from the existing Interval bindings rather than as a literal numeral in markdown prose."
    - "A small Plot strip chart renders partial 7 (7/4 ~ 968.83¢) and the 'stack of two 4/3s' point (16/9 ~ 996.09¢) on a shared cents x-axis with a labeled gap annotation of `27.26¢ (64/63)` between them. Cents values are read from `harmonicSeventh.cents`, `pythagoreanMinorSeventh.cents`, and `septimal.cents` — NOT hardcoded as literals in the chart data."
    - "A 'Tempered out by' callout (blockquote) appears before `## See also` listing 22-EDO + Superpyth temperament + Dominant temperament (the 12-EDO 7-limit meantone variety), with explanatory clause distinguishing these from huygens septimal meantone / 31-EDO which preserves the distinction."
    - "A `## Further reading` H2 section appears after `## See also` with: (a) https://en.xen.wiki/w/64/63 with descriptive sentence, (b) https://en.xen.wiki/w/Archytas_clan with descriptive sentence, (c) Andrew Barker, *Greek Musical Writings, Vol. II: Harmonic and Acoustic Theory* (CUP, 1989) print citation."
    - "The page still owns exactly one AudioContext (one and only one `createSynth()` call site — comment lines may mention the token but the actual invocation is single) — Pitfall #2 honored; the new dyad button reuses the existing page-level `synth` binding."
    - "The page reuses the existing `septimal`, `harmonicSeventh = new Interval(\"7/4\")`, and `pythagoreanMinorSeventh = new Interval(\"16/9\")` bindings — no second construction of these Intervals anywhere."
    - "`tsc --noEmit` exits with no new errors vs the 5 pre-existing `npm:` specifier baseline errors recorded in STATE.md."
    - "`npm run build` completes clean with no broken-link warnings introduced."
  artifacts:
    - path: "src/pages/septimal-comma.md"
      provides: "Simultaneous A/B dyad button + static beat-frequency display + Plot strip chart + tempered-out callout + Further reading section"
      contains: "playDyad(harmonicSeventh, pythagoreanMinorSeventh, synth"
  key_links:
    - from: "src/pages/septimal-comma.md"
      to: "src/components/play-dyad.ts"
      via: "import { playDyad } from \"../components/play-dyad.js\""
      pattern: "import \\{ playDyad \\}"
    - from: "src/pages/septimal-comma.md"
      to: "@observablehq/plot"
      via: "import * as Plot from \"npm:@observablehq/plot\""
      pattern: "import \\* as Plot"
    - from: "src/pages/septimal-comma.md"
      to: "existing page-level synth + Interval bindings"
      via: "playDyad(harmonicSeventh, pythagoreanMinorSeventh, synth, { label: \"...\" }) reuses harmonicSeventh, pythagoreanMinorSeventh, synth from existing cells"
      pattern: "playDyad\\(harmonicSeventh, *pythagoreanMinorSeventh, *synth"
---

<objective>
Add a simultaneous-A/B audition button to `src/pages/septimal-comma.md` that sounds 7/4 and 16/9 together at A4=440 — making the ~27.26¢ septimal comma audible as a ~12.22 Hz beat. Below the button, surface the beat frequency as a static computed value derived from the existing `Interval` bindings (not a float literal in prose). Add a small `Plot` strip chart showing partial 7 (natural 7/4) and the "stack of two 4/3s" point (16/9) on a shared cents axis with a labeled `27.26¢ (64/63)` gap annotation between them. Add a "Tempered out by" callout listing the systems where 64/63 vanishes (22-EDO, Superpyth, Dominant), and a `## Further reading` section with Xen Wiki + Archytas-clan + Barker references.

Purpose: practical follow-through on the page's existing prose. The user currently has to mentally combine two playInterval buttons to hear the septimal-comma beat. The dyad button delivers it directly; the strip chart makes the 27.26¢ gap *visible* alongside the prose math; the callout and further reading map the comma into the wider temperament-theory and historical-Greek-music-theory landscapes.

Output: A single-file edit to `src/pages/septimal-comma.md` (~+90 lines, no refactor of existing cells / prose / `## In monzos` / `## See also` — they remain byte-identical in their ranges).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@src/pages/septimal-comma.md
@src/pages/syntonic-comma.md
@src/pages/schisma.md
@src/components/play-dyad.ts

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
  a: Interval, b: Interval, synth: SynthHandle, opts?: PlayDyadOpts,
): HTMLButtonElement;
// Click handler: synth.playNotes(
//   [baseHz * Number(a.fraction.valueOf()), baseHz * Number(b.fraction.valueOf())],
//   dur,
// );
// SINGLE chord call. Not playArpeggio. Not sequential playNote.
```

Existing page-level bindings already present in src/pages/septimal-comma.md (lines 5-29) that the new code MUST reuse:
- `synth` — page-owned `SynthHandle` from `createSynth()` (line 18). DO NOT create a second.
- `septimal` — `commaByName("septimal comma")!` = 64/63 (line 26).
- `harmonicSeventh` — `new Interval("7/4")` (line 27).
- `pythagoreanMinorSeventh` — `new Interval("16/9")` (line 28).

Insertion convention reference (syntonic-comma.md @ msv, schisma.md):
- New imports joined inline to the existing single import cell — Framework module-scope rule.
- `## Further reading` H2 placed after `## See also`.
- "Tempered out by" callout is a bare `>` blockquote (no `.callout` CSS class in src/styles.css).
- IIFE-built beat-frequency derives from `Number(iv.fraction.valueOf())` at the audio/display boundary; rendered via `${beatHz.toFixed(3)}`. No literal `12.222` in prose.
- Plot strip chart pattern mirrors prime-limits.md @ kzw (single-strip `y:{axis:null}` with categorical fill) and schisma.md @ ilb (Plot.text labels reading `.cents` from existing Interval bindings).

Research findings (verified via Xen Wiki + Wikipedia):
- 22-EDO **tempers out** 64/63 (defining feature of Superpyth — four fifths octave-reduced = 9/7 septimal third; 7/4 = 16/9).
- 31-EDO does **NOT** temper out 64/63 — it's huygens septimal meantone, which is *built to preserve* the distinction; in 31-EDO patent val 7/4 → step 25 and 16/9 → step 26.
- Named temperaments that vanish 64/63: **Superpyth** (a.k.a. "archy" in the 2.3.7 subgroup) and **Dominant** (the 12-EDO-supporting 7-limit meantone where the dominant 7th = 7/4 = 16/9).
- Therefore the callout list is: 22-EDO + Superpyth + Dominant, with an explanatory sentence noting that huygens septimal meantone / 31-EDO preserve the distinction by design.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Edit src/pages/septimal-comma.md — add dyad button + beat-frequency + Plot strip chart + tempered-out callout + Further reading</name>
  <files>src/pages/septimal-comma.md</files>
  <action>
Make a single additive edit to `src/pages/septimal-comma.md`. All changes below are insertions — do NOT modify any existing prose, the synth cell, the three Interval-binding lines (`septimal` / `harmonicSeventh` / `pythagoreanMinorSeventh`), the intro paragraph, the audition bullets, `## In monzos`, or `## See also`. Those ranges must remain byte-identical in their original byte ranges (verify with `git diff src/pages/septimal-comma.md` — only additive hunks expected).

**1. Augment the existing import cell (lines 5-11).** Append two lines inside the existing fenced block, directly after the existing `import { playInterval } from "../components/play-interval.js";` line:

```ts
import { playDyad } from "../components/play-dyad.js";
import * as Plot from "npm:@observablehq/plot";
```

Do NOT create a second import cell — Framework's module-scope rule would re-bind names. This mirrors how schisma.md (lines 11-12) augments its import cell.

**2. Insert the dyad button + beat-frequency block immediately after the existing "Audition the difference:" bulleted list (line 42), BEFORE the `## In monzos` H2 (line 44).** Insert a blank line, then this new content:

```markdown
The two sevenths together — the septimal comma as a beat-rate:

${playDyad(harmonicSeventh, pythagoreanMinorSeventh, synth, { label: "7/4 + 16/9 (septimal-comma beat)" })}
```

Then on the next line, add an inline-computed beat-frequency cell. The value MUST be computed from the existing Interval bindings (NOT a hardcoded `12.222` literal — Pitfall #1). Use an IIFE so the computation happens once per page render:

```ts
const beatHz = (() => {
  const baseHz = 440; // matches playDyad's default (D-08)
  const fHarmonic7  = baseHz * Number(harmonicSeventh.fraction.valueOf());         // 770 Hz
  const fPythagSeventh = baseHz * Number(pythagoreanMinorSeventh.fraction.valueOf()); // 782.222… Hz
  return Math.abs(fPythagSeventh - fHarmonic7);                                    // 12.222… Hz
})();
```

Then a prose paragraph that interpolates the computed value (using `.toFixed(3)`) and explains what the beating is:

```markdown
Beat frequency at A = 440 Hz: ${beatHz.toFixed(3)} Hz. The harmonic 7th lands
at 770 Hz and the Pythagorean minor 7th at 782.222 Hz; their near-coincident
upper partials fall in and out of phase at that rate. The septimal comma's
~27.26¢ size, scaled to this anchor, is exactly this audible Hz signature —
roughly twice as fast as the syntonic comma's beat at the same reference,
matching the comma's roughly-twice-as-large cents value.
```

**3. Immediately after the beat-frequency prose, insert a small `Plot` strip chart cell.** The chart shows the two cents values on a shared horizontal axis with the 27.26¢ gap labeled between them. Build data rows from the existing Interval bindings — no hardcoded cents literals.

Insert a brief markdown intro sentence first:

```markdown
On a shared cents axis the two pitches are unmistakably distinct — and the gap between them is exactly one septimal comma:
```

Then the chart cell:

```ts
const partialsChart = (() => {
  const data = [
    { name: "partial 7 (7/4)",   cents: harmonicSeventh.cents,         group: "harmonic" },
    { name: "two 4/3s (16/9)",   cents: pythagoreanMinorSeventh.cents, group: "pythagorean" },
  ];
  const midCents = (harmonicSeventh.cents + pythagoreanMinorSeventh.cents) / 2;
  return Plot.plot({
    width: 640,
    height: 170,
    marginLeft: 50,
    marginRight: 50,
    marginTop: 50,
    marginBottom: 50,
    x: {
      label: "Cents",
      domain: [955, 1010],
      grid: true,
      tickFormat: (v) => `${v}¢`,
    },
    y: { axis: null, domain: [-1, 1] },
    marks: [
      Plot.ruleX([harmonicSeventh.cents, pythagoreanMinorSeventh.cents], {
        stroke: "#888",
        strokeDasharray: "2,2",
      }),
      Plot.dot(data, {
        x: "cents",
        y: 0,
        r: 7,
        fill: (d) => (d.group === "harmonic" ? "#4269d0" : "#ef8e3a"),
        stroke: "currentColor",
        strokeWidth: 1,
      }),
      Plot.text(data, {
        x: "cents",
        y: 0,
        text: "name",
        dy: -28,
        fontSize: 12,
        fill: "currentColor",
      }),
      Plot.text(data, {
        x: "cents",
        y: 0,
        text: (d) => `${d.cents.toFixed(2)}¢`,
        dy: -14,
        fontSize: 11,
        fill: "currentColor",
      }),
      Plot.text(
        [{ x: midCents }],
        {
          x: "x",
          y: 0.55,
          text: () => `↔ ${septimal.cents.toFixed(2)}¢ (64/63)`,
          fontSize: 12,
          fill: "#c45656",
        },
      ),
    ],
  });
})();
display(partialsChart);
```

**4. Insert the "Tempered out by" callout immediately before the `## See also` H2.** Plain markdown blockquote — no callout CSS class, no `<div>` wrapper. Place a blank line before and after the blockquote:

```markdown
> **Tempered out by.** 22-EDO and Superpyth temperament (a.k.a. "archy"
> in the 2.3.7 subgroup) — the four-fifths-up dominant seventh IS the
> harmonic 7th. The Dominant temperament (the 7-limit extension supported
> by 12-EDO, where 16/9 = 7/4) also vanishes 64/63. By contrast, standard
> septimal meantone (huygens / 31-EDO) is built to *preserve* the 64/63
> distinction — 7/4 and 16/9 land on adjacent steps.
```

**5. Append a new `## Further reading` H2 section after `## See also`.** Match the schisma.md / pythagorean-comma.md / edo-approximation.md placement and shape:

```markdown
## Further reading

- [64/63 on the Xenharmonic Wiki](https://en.xen.wiki/w/64/63) —
  community-curated reference for the septimal comma (Archytas's
  comma), covering its role as the defining 7-limit superparticular
  separating 9/8 and 8/7, the family of temperaments that vanish it
  (Superpyth in 22-EDO, Dominant in 12-EDO, the broader Archytas clan),
  and the chain of 7-limit relations it collapses (7/4 ↔ 16/9, 9/7 ↔
  four-fifths-up, 9/8 ↔ 8/7).

- [Archytas clan on the Xenharmonic Wiki](https://en.xen.wiki/w/Archytas_clan) —
  the temperament family built by tempering out 64/63 in 7-limit
  contexts; covers Archytas / Superpyth / Pajara / Dominant and their
  characteristic equivalence of two fifths octave-reduced with a
  whole tone that is both 8/7 and 9/8.

- Andrew Barker, *Greek Musical Writings, Vol. II: Harmonic and
  Acoustic Theory* (Cambridge University Press, 1989) —
  scholarly source for Archytas of Tarentum's three tetrachords
  (enharmonic 28:27:36:35:5:4, chromatic 28:27:243:224:32:27, and
  diatonic 28:27:8:7:9:8), the historical entry point of prime 7
  and the 28/27 / 64/63 family into Greek music theory in the
  4th century BCE.
```

**Specificity / pitfall guard:**
- Reuse `harmonicSeventh`, `pythagoreanMinorSeventh`, and `septimal` directly — do NOT write `new Interval("7/4")`, `new Interval("16/9")`, or `commaByName("septimal comma")` anywhere new.
- Reuse the page-level `synth` binding — do NOT call `createSynth()` a second time (grep gate: actual call site count = 1 even though the literal token may appear once more in line 16's explanatory comment, mirroring syntonic-comma.md's baseline).
- Do NOT hardcode `12.222` as a literal anywhere except inside an end-of-line code comment — the displayed value MUST come from `${beatHz.toFixed(3)}`.
- Do NOT hardcode cents literals (`968.83`, `996.09`, `27.26`) in the chart data — Plot data rows derive from `harmonicSeventh.cents`, `pythagoreanMinorSeventh.cents`, `septimal.cents`. The `27.26` value in the user request appears only as part of the gap label produced by `${septimal.cents.toFixed(2)}`.
- Do NOT use `tex` for the beat-frequency value — plain markdown with `${beatHz.toFixed(3)}` interpolation is correct.
- Blockquote callout: bare `>` only, no callout CSS class, no `<div>` wrapper.
- Order on disk after the edit: existing audition bullets → dyad button → beatHz IIFE → beat-frequency prose → strip-chart intro → strip-chart cell → `## In monzos` → tempered-out blockquote → `## See also` → `## Further reading`.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npx tsc --noEmit 2>&1 | tail -20 && test "$(grep -c 'import { playDyad }' src/pages/septimal-comma.md)" = "1" && test "$(grep -c 'import \* as Plot' src/pages/septimal-comma.md)" = "1" && test "$(grep -c 'playDyad(harmonicSeventh, pythagoreanMinorSeventh, synth' src/pages/septimal-comma.md)" = "1" && test "$(grep -c '^## Further reading' src/pages/septimal-comma.md)" = "1" && test "$(grep -c 'en.xen.wiki/w/64/63' src/pages/septimal-comma.md)" = "1" && test "$(grep -c 'Archytas_clan' src/pages/septimal-comma.md)" = "1" && test "$(grep -c 'Andrew Barker' src/pages/septimal-comma.md)" = "1" && ! grep -E 'new Interval\("(7/4|16/9)"\)' src/pages/septimal-comma.md | grep -v '^[[:space:]]*//' | tail -n +2 > /dev/null && test "$(grep -v '^[[:space:]]*//' src/pages/septimal-comma.md | grep -cE '12\.222')" = "0" && echo "GREP-GATES PASS" && npm run build 2>&1 | tail -10</automated>
  </verify>
  <done>
    - `src/pages/septimal-comma.md` contains the new playDyad + Plot imports, the dyad button, the beatHz IIFE, the beat-frequency prose, the strip-chart intro + Plot cell, the tempered-out blockquote (before `## See also`), and the `## Further reading` section (after `## See also`).
    - All grep gates above pass.
    - `npx tsc --noEmit` exits with no new errors vs the 5 pre-existing `npm:` specifier baseline errors recorded in STATE.md.
    - `npm run build` completes clean with no new broken-link warnings.
    - No file other than `src/pages/septimal-comma.md` is modified (verified by `git status --porcelain` showing only that single path).
  </done>
</task>

</tasks>

<verification>
After the executor finishes:

1. Diff the page against the baseline — only additive hunks expected.
   ```
   git diff src/pages/septimal-comma.md
   ```
2. Click the new "▶ 7/4 + 16/9 (septimal-comma beat)" button: a minor-seventh dyad with audible ~12 Hz beating.
3. The beat-frequency line reads "Beat frequency at A = 440 Hz: 12.222 Hz."
4. The strip chart renders with two dots on a single cents axis (~968.83¢ and ~996.09¢) and the red `↔ 27.26¢ (64/63)` annotation between them.
5. The "Tempered out by" blockquote sits between the strip chart / `## In monzos` and `## See also`.
6. The `## Further reading` section appears as the final H2 with the three references.
</verification>

<success_criteria>
- All `must_haves.truths` observable on the rendered page.
- All `must_haves.key_links` grep patterns match in the edited file.
- tsc baseline unchanged; build clean.
- No other files modified.
- Page bundle size delta in line with other Plot-using theory pages (911-920 kB total imports range).
</success_criteria>

<output>
After completion, create `.planning/quick/260512-sxc-on-src-pages-septimal-comma-md-add-a-sim/260512-sxc-SUMMARY.md` using the GSD summary template, documenting: the five insertions (imports, dyad+beat, strip chart, callout, Further reading), the BigInt-Fraction kernel discipline for the beat-frequency and the chart cents values, the factual correction from the original user request (31-EDO/septimal meantone → 22-EDO/Superpyth/Dominant), confirmation of grep gates and tsc/build cleanliness, and the per-page bundle-size impact.
</output>
