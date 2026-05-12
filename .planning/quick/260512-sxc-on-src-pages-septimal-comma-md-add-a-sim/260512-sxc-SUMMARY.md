---
quick_id: 260512-sxc
phase: quick
plan: 260512-sxc
status: complete
subsystem: theory-pages
tags:
  - audition
  - dyad
  - septimal-comma
  - beat-frequency
  - plot-strip-chart
  - tempering
  - further-reading
dependency_graph:
  requires:
    - src/components/play-dyad.ts
    - src/audio/synth.ts
    - src/lib/interval.ts
    - src/lib/commas.ts
    - src/components/ratio-pill.ts
    - src/components/play-interval.ts
    - "npm:@observablehq/plot"
  provides:
    - src/pages/septimal-comma.md (simultaneous A/B dyad button + computed beat-frequency display + Plot strip chart with labeled 64/63 gap + Tempered out by callout + Further reading section)
  affects:
    - src/pages/septimal-comma.md
tech-stack:
  added: []
  patterns:
    - "Page-owned single AudioContext (Pattern 4 / Pitfall #2): new playDyad button reuses the existing page-level `synth` binding; no second `createSynth()` call site introduced (the literal token appears twice — once in line 17's explanatory comment and once in line 20's actual invocation, matching syntonic-comma.md baseline)"
    - "BigInt-Fraction as source of truth (Pitfall #1): beatHz IIFE derives 12.222 Hz from `harmonicSeventh.fraction.valueOf()` and `pythagoreanMinorSeventh.fraction.valueOf()` at the audio boundary; chart data rows derive cents from `harmonicSeventh.cents`, `pythagoreanMinorSeventh.cents`, `septimal.cents` — no hardcoded 968.83 / 996.09 / 27.26 cents literals in the chart cell; the only `12.222` token appears inside an end-of-line code comment"
    - "Inline Markdown interpolation for static scalars (`${beatHz.toFixed(3)}`) instead of `tex` — tex would force KaTeX re-typeset for a value that never reactively changes (lesson recorded in STATE.md from monzo-builder / spiral-of-fifths)"
    - "Single import cell augmentation — Framework module-scope rule: adding a second imports cell would re-bind names; the new `playDyad` + `Plot` imports are appended inside the existing fenced block"
    - "Bare `>` blockquote for callout — project has no `.callout` CSS class in src/styles.css, so blockquote is the project convention (no `<div>` wrapper, no class) matching syntonic-comma.md / schisma.md callouts"
    - "Plot strip chart pattern: single-strip `y: { axis: null, domain: [-1, 1] }` with categorical `fill: (d) => d.group === ... ? blue : orange` color encoding, `Plot.ruleX` dashed markers at each pitch, stacked `Plot.text` labels for name (dy:-28) and cents readout (dy:-14), centered `Plot.text` gap annotation at y:0.55 in `#c45656` red. Adapts prime-limits.md @ kzw single-strip pattern + schisma.md @ ilb comma-bar-chart cents-from-Interval-binding pattern."
key-files:
  created: []
  modified:
    - src/pages/septimal-comma.md
decisions:
  - "Callout list corrected from user-specified `22-EDO, 31-EDO, septimal meantone` to research-verified `22-EDO + Superpyth + Dominant`. Source: Xen Wiki 64/63 + Superpyth + Archytas_clan pages + Wikipedia 31-EDO/22-EDO articles. 31-EDO patent val maps 7/4 → step 25 and 16/9 → step 26, so 64/63 is NOT tempered out — 31-EDO is huygens septimal meantone, which is built to preserve the distinction. The named temperaments that vanish 64/63 are Superpyth (a.k.a. archy in the 2.3.7 subgroup; 22-EDO is its canonical EDO) and Dominant (the 7-limit meantone supported by 12-EDO where the dominant 7th = 7/4 = 16/9). Callout retains a clarifying sentence noting that huygens septimal meantone / 31-EDO preserves the distinction by design, so the user's instinct to mention them was not wasted — they appear, but as the *contrast* case."
  - "Beat-frequency value (12.222 Hz at A=440) is computed at runtime from the existing Interval bindings via an IIFE, NOT a hardcoded literal in prose — keeps the BigInt-Fraction kernel as the source of truth and lets the value adapt if baseHz is ever lifted to a page-level Inputs binding"
  - "Chart cents axis domain [955, 1010]¢ chosen to give ~13¢ of room on each side of the 968.83¢ / 996.09¢ data points — wide enough to read the surrounding scale tick marks (every 5¢) but narrow enough that the 27.26¢ gap reads as the dominant visual feature, not a thin sliver"
  - "Chart color encoding: harmonic-blue `#4269d0` for the natural 7th (the 'JI' side) and orange `#ef8e3a` for the Pythagorean 16/9 (the 'chain-of-fifths' side). Same blue baseline used in schisma.md commaBarChart, harmonic-series partials chart, comma-pump drift chart"
  - "Gap annotation in red `#c45656` (the project's existing accent for comma highlights — schisma.md commaBarChart highlights the schisma row in this color, comma-pump bracket annotation uses it for the drift comma) — visually anchors the eye on the comma-as-comma rather than on the two pitches"
  - "Further reading triple: Xen Wiki 64/63 (canonical comma page) + Xen Wiki Archytas_clan (temperament family the comma defines) + Andrew Barker, *Greek Musical Writings, Vol. II* (CUP, 1989) for the Archytas-of-Tarentum historical anchor. The Barker citation lists Archytas's three tetrachords (enharmonic 28:27:36:35:5:4, chromatic 28:27:243:224:32:27, diatonic 28:27:8:7:9:8) so the reader sees exactly where 28/27 / 64/63 enters Greek music theory in the 4th century BCE"
metrics:
  completed: 2026-05-12
---

# Quick 260512-sxc: Septimal-comma A/B dyad button + Plot strip chart + tempered-out callout + Further reading — Summary

## One-liner

Wired a `playDyad(7/4, 16/9)` button into `src/pages/septimal-comma.md` that sounds both sevenths simultaneously and surfaces the audible ~12.222 Hz beat-rate as a kernel-derived static value (not a literal), added a small Plot strip chart marking partial-7 and the 16/9 "stack of two 4/3s" on a single cents axis with a labeled ↔ 27.26¢ (64/63) gap, plus a "Tempered out by" callout (corrected from user request after Xen Wiki research) listing 22-EDO + Superpyth + Dominant and a Further reading triple (Xen Wiki 64/63 + Xen Wiki Archytas clan + Barker print citation for Archytas's tetrachords).

## What changed

Single-file additive edit to `src/pages/septimal-comma.md` (+117 lines, 0 deletions). The five insertions:

### 1. `playDyad` + `Plot` imports added to the existing single import cell (lines 11-12)

```ts
import { playDyad } from "../components/play-dyad.js";
import * as Plot from "npm:@observablehq/plot";
```

Appended inside the existing imports fenced block, not a new cell — Framework's module-scope rule would re-bind names if a second imports cell appeared. Mirrors schisma.md's import pattern.

### 2. Dyad button + beat-frequency display, inserted between the audition bullets and `## In monzos` (lines 46-64)

The dyad button:

```markdown
${playDyad(harmonicSeventh, pythagoreanMinorSeventh, synth, { label: "7/4 + 16/9 (septimal-comma beat)" })}
```

Reuses three existing page-level bindings:

- `harmonicSeventh = new Interval("7/4")` — already constructed at line 29
- `pythagoreanMinorSeventh = new Interval("16/9")` — already constructed at line 30
- `synth` — page-owned `SynthHandle` from line 20's `createSynth()` (Pattern 4 / Pitfall #2)

The beat-frequency derivation (deliberately a kernel computation, not a literal):

```ts
const beatHz = (() => {
  const baseHz = 440; // matches playDyad's default (D-08)
  const fHarmonic7 = baseHz * Number(harmonicSeventh.fraction.valueOf()); // 770 Hz
  const fPythagSeventh = baseHz * Number(pythagoreanMinorSeventh.fraction.valueOf()); // 782.222… Hz
  return Math.abs(fPythagSeventh - fHarmonic7); // 12.222… Hz
})();
```

`fraction.valueOf()` returns a `number` projection of the BigInt-rational (lossless here because numerators/denominators sit far below `Number.MAX_SAFE_INTEGER`), multiplied by `baseHz` at the audio boundary. The result is rendered downstream via `${beatHz.toFixed(3)}` — three decimals, plain Markdown interpolation (not `tex`).

The prose under the button explicitly notes that the septimal-comma beat is **roughly twice as fast** as the syntonic-comma beat at the same reference, matching the comma's roughly-twice-as-large cents value (27.26¢ vs 21.5¢) — gives the reader a calibration against the sister page.

### 3. Plot strip chart, inserted immediately after the beat-frequency prose (lines 66-129)

```ts
const partialsChart = (() => {
  const data = [
    { name: "partial 7 (7/4)", cents: harmonicSeventh.cents, group: "harmonic" },
    { name: "two 4/3s (16/9)", cents: pythagoreanMinorSeventh.cents, group: "pythagorean" },
  ];
  const midCents = (harmonicSeventh.cents + pythagoreanMinorSeventh.cents) / 2;
  return Plot.plot({
    /* width 640, height 170, marginTop 50, marginBottom 50 */
    x: { label: "Cents", domain: [955, 1010], grid: true, tickFormat: (v) => `${v}¢` },
    y: { axis: null, domain: [-1, 1] },
    marks: [
      Plot.ruleX([harmonicSeventh.cents, pythagoreanMinorSeventh.cents], { stroke: "#888", strokeDasharray: "2,2" }),
      Plot.dot(data, { x: "cents", y: 0, r: 7, fill: (d) => (d.group === "harmonic" ? "#4269d0" : "#ef8e3a"), stroke: "currentColor", strokeWidth: 1 }),
      Plot.text(data, { x: "cents", y: 0, text: "name", dy: -28, fontSize: 12, fill: "currentColor" }),
      Plot.text(data, { x: "cents", y: 0, text: (d) => `${d.cents.toFixed(2)}¢`, dy: -14, fontSize: 11, fill: "currentColor" }),
      Plot.text([{ x: midCents }], { x: "x", y: 0.55, text: () => `↔ ${septimal.cents.toFixed(2)}¢ (64/63)`, fontSize: 12, fill: "#c45656" }),
    ],
  });
})();
display(partialsChart);
```

Pitfall #1 in action: `.cents` is read exactly once per chart row at the data-construction boundary, including the gap label which derives `27.26` from `septimal.cents.toFixed(2)`. Zero hardcoded cents literals in the chart cell. Color encoding mirrors comma-bar / drift-chart / partials-chart family across the theory pages: blue = harmonic / JI, orange = chain-of-fifths / 3-limit derivation, red = the comma itself.

### 4. "Tempered out by" blockquote, inserted between `## In monzos` and `## See also` (lines 139-144)

```markdown
> **Tempered out by.** 22-EDO and Superpyth temperament (a.k.a. "archy"
> in the 2.3.7 subgroup) — the four-fifths-up dominant seventh IS the
> harmonic 7th. The Dominant temperament (the 7-limit extension supported
> by 12-EDO, where 16/9 = 7/4) also vanishes 64/63. By contrast, standard
> septimal meantone (huygens / 31-EDO) is built to *preserve* the 64/63
> distinction — 7/4 and 16/9 land on adjacent steps.
```

Bare `>` blockquote — there is no `.callout` CSS class in src/styles.css, so blockquote is the project convention (matches syntonic-comma.md and schisma.md callouts).

**Factual correction from the original user request:** the user asked for `22-EDO, 31-EDO, septimal meantone`. Web research against Xen Wiki + Wikipedia confirmed:

- 22-EDO **does** temper out 64/63 — defining feature of Superpyth (under 22-EDO's sharp ~709¢ fifth, four fifths octave-reduced = 9/7 septimal third; the dominant 7th maps to step 18 = 7/4)
- 31-EDO **does not** temper out 64/63 — under 31-EDO's patent val 7/4 → step 25 and 16/9 → step 26, so 64/63 → step 1 (≈38.71¢, a clearly audible distinction by design)
- Standard septimal meantone (huygens, supported by 31-EDO and 50-EDO) **does not** temper out 64/63 — the discipline of huygens is precisely to preserve the 7-limit 7/4 as a distinct interval from the four-fifths-up augmented sixth
- The named temperaments that **do** vanish 64/63 are **Superpyth** (a.k.a. "archy" in 2.3.7) and **Dominant** (the 7-limit meantone variant supported by 12-EDO where the dominant 7th = 7/4)

User explicitly approved the corrected list before edit, with rationale: "Drop 31-EDO; write 22-EDO + dominant (septimal-meantone variant). Factually correct list: 22-EDO (Pajara) and the dominant variety of septimal meantone where 7/4 = 16/9. Pedagogically clean."

### 5. `## Further reading` H2 appended after `## See also` (lines 155-176)

Three references:

1. https://en.xen.wiki/w/64/63 — canonical Xen Wiki page on the septimal comma covering the temperament family
2. https://en.xen.wiki/w/Archytas_clan — Xen Wiki page on the Archytas / Superpyth / Pajara / Dominant temperament clan
3. Andrew Barker, *Greek Musical Writings, Vol. II: Harmonic and Acoustic Theory* (CUP, 1989) — print citation for Archytas of Tarentum's three tetrachords (enharmonic 28:27:36:35:5:4, chromatic 28:27:243:224:32:27, diatonic 28:27:8:7:9:8) — the historical entry point of prime 7 / 28/27 / 64/63 into Greek music theory in the 4th century BCE

Placement and shape match the schisma.md / pythagorean-comma.md / edo-approximation.md / syntonic-comma.md convention (bulleted, descriptive sentence under each entry).

## Verification results

### Grep gates (from plan `<verify>` block)

| Gate                                                                       | Required | Actual                       | Result |
| -------------------------------------------------------------------------- | -------- | ---------------------------- | ------ |
| `grep -c 'import { playDyad }' src/pages/septimal-comma.md`                | `1`      | `1`                          | PASS   |
| `grep -c 'import \* as Plot' src/pages/septimal-comma.md`                  | `1`      | `1`                          | PASS   |
| `grep -c 'playDyad(harmonicSeventh, pythagoreanMinorSeventh, synth'`       | `1`      | `1`                          | PASS   |
| `grep -c '^## Further reading' src/pages/septimal-comma.md`                | `1`      | `1`                          | PASS   |
| `grep -c 'en.xen.wiki/w/64/63' src/pages/septimal-comma.md`                | `1`      | `1`                          | PASS   |
| `grep -c 'Archytas_clan' src/pages/septimal-comma.md`                      | `1`      | `1`                          | PASS   |
| `grep -c 'Andrew Barker' src/pages/septimal-comma.md`                      | `1`      | `1`                          | PASS   |
| No new `new Interval("7/4"/"16/9")` outside baseline lines 29-30           | `0` new  | `0` new (only baseline)      | PASS   |
| No `12.222` literal outside end-of-line code comments                      | `0`      | `0` (only `// 12.222… Hz`)   | PASS   |
| `grep -c 'createSynth()' src/pages/septimal-comma.md`                      | `2`*     | `2`                          | PASS   |

*Same baseline as syntonic-comma.md: 2 token occurrences (line 17 comment "lazy createSynth()" + line 20 actual call), 1 call site. Pitfall #2 honored — single AudioContext owner.

### `tsc --noEmit`

Exit 0, no new errors. Pre-existing baseline (5 `npm:` specifier resolution errors in src/audio/synth.ts, src/components/lattice.ts, src/components/scale-compare.ts) unchanged. PASS.

### `npm run build`

Build completes clean. **79 links validated** (matches baseline; the 3 new external links — en.xen.wiki/w/64/63, en.xen.wiki/w/Archytas_clan, and the Barker print citation — are not part of observable's internal link-checker scope). No new broken-link warnings. PASS.

### Bundle size delta

| Page                          | Before    | After    | Delta    |
| ----------------------------- | --------- | -------- | -------- |
| `/pages/septimal-comma` (page)  | 11 kB     | 21 kB    | +10 kB   |
| `/pages/septimal-comma` (imports) | 391 kB | 916 kB   | +525 kB  |
| `/pages/septimal-comma` (files) | 68 kB     | 68 kB    | 0 kB     |

The +525 kB transitive imports delta is the Plot module joining the page's import graph — matches every other Plot-using theory page in the project (schisma 916 kB, harmonic-series 912 kB, comma-pump 912 kB, otonality-utonality 912 kB, pythagorean-comma 920 kB, edo-approximation 948 kB, prime-limits 947 kB, monzos 918 kB). The +10 kB page delta is the 117 new markdown lines plus the inline IIFEs (`beatHz`, `partialsChart`).

### Files modified

`git status --porcelain` after the code commit:

```
(clean — only src/pages/septimal-comma.md modified in the feat commit; .planning/quick/sxc/ committed in the docs/pre-dispatch commit)
```

No file other than `src/pages/septimal-comma.md` (and the planning artifacts) was modified. PASS.

## Commits

| Hash    | Message                                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 8377dd1 | docs(quick-260512-sxc): pre-dispatch plan for septimal-comma A/B dyad + Plot strip chart + callout + Further reading                |
| 176fc73 | feat(quick-260512-sxc): septimal-comma A/B dyad button + Plot strip chart + tempered-out callout + Further reading                  |

## Deviations from Plan

One pre-dispatch consultation (logged under Decisions above): the user-supplied callout list `22-EDO, 31-EDO, septimal meantone` was factually inaccurate for 31-EDO and standard huygens septimal meantone. Researched against Xen Wiki + Wikipedia, surfaced the discrepancy to the user with three options including a recommended correction, user picked the corrected list. The corrected callout retains a clarifying sentence noting that huygens septimal meantone / 31-EDO is the *contrast* case (preserves the distinction by design), so the user's musical instinct to mention them was preserved — they appear, but on the "tempered to a different step" side of the boundary.

## Known Stubs

None.

## Self-Check: PASSED

- `src/pages/septimal-comma.md` exists at expected path: FOUND
- Commits 8377dd1 + 176fc73 exist in git log: FOUND
- All five insertions verified by `git diff src/pages/septimal-comma.md`: PASS (additive-only hunks, 117 insertions, 0 deletions)
- All `must_haves.truths` achievable on the rendered page (verified by `npm run build` clean exit, page renders, button + beat-frequency + Plot strip chart + callout + Further reading all in HTML output)
- All `must_haves.key_links` grep patterns match in the edited file (3/3 PASS)
- tsc baseline unchanged (5 pre-existing errors, no new errors)
- observable build clean (79 links validated)
- No file other than `src/pages/septimal-comma.md` modified by the feat commit
