---
quick_id: 260512-msv
phase: quick
plan: 260512-msv
subsystem: theory-pages
tags:
  - audition
  - dyad
  - syntonic-comma
  - beat-frequency
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
  provides:
    - src/pages/syntonic-comma.md (simultaneous A/B dyad button + computed beat-frequency display + Tempered out by callout + Further reading section)
  affects:
    - src/pages/syntonic-comma.md
tech-stack:
  added: []
  patterns:
    - "Page-owned single AudioContext (Pattern 4 / Pitfall #2): new playDyad button reuses the existing page-level `synth` binding; no second `createSynth()` call introduced"
    - "BigInt-Fraction as source of truth (Pitfall #1): beatHz IIFE derives 6.875 Hz from `fiveLimit.fraction.valueOf()` and `pythagorean.fraction.valueOf()` at the audio/display boundary; no float-literal cents or Hz in markdown prose"
    - "Inline Markdown interpolation for static scalars (`${beatHz.toFixed(3)}`) instead of `tex` — tex would force KaTeX re-typeset for a value that never reactively changes"
    - "Single import cell augmentation — Framework module-scope rule: adding a second `import { playDyad }` cell would re-bind names, so the new import is appended inside the existing imports block"
    - "Bare `>` blockquote for callout — project has no `.callout` CSS class in src/styles.css, so blockquote is the project convention (no `<div>` wrapper, no class)"
key-files:
  created: []
  modified:
    - src/pages/syntonic-comma.md
decisions:
  - "Beat-frequency value (6.875 Hz at A=440) is computed at runtime from the existing Interval bindings via an IIFE, NOT a hardcoded literal in prose — keeps the BigInt-Fraction kernel as the source of truth and lets the value adapt if baseHz is ever lifted to a page-level Inputs binding in a future plan"
  - "Used inline `${beatHz.toFixed(3)}` Markdown interpolation (plain DOM) rather than `tex` for the beat-frequency value — tex re-typesets on cell re-runs, which is unnecessary for a static scalar and matches the monzo-builder / spiral-of-fifths lessons recorded in STATE.md re: KaTeX flicker"
  - "Tempered-out callout is a bare `>` blockquote: there is no `.callout` CSS class in src/styles.css, so blockquote is the established project convention for emphasis blocks (matches the bare-quote style used elsewhere in theory pages where applicable)"
  - "`label` opt on playDyad uses string interpolation rather than tex/em — playDyad's button glyph + label is plain `textContent`, so '5/4 + 81/64 (syntonic-comma beat)' renders as readable inline label"
metrics:
  duration: ~7min
  completed: 2026-05-12
---

# Quick 260512-msv: Syntonic-comma A/B dyad button + beat-frequency display + tempered-out callout + Further reading — Summary

## One-liner

Wired a `playDyad(5/4, 81/64)` button into `src/pages/syntonic-comma.md` that sounds both major thirds simultaneously and surfaces the audible ~6.875 Hz beat-rate as a kernel-derived static value (not a literal), with a "Tempered out by" callout listing the syntonic-comma-vanishing temperaments and a Further reading link to the Xenharmonic Wiki canonical reference.

## What changed

Single-file additive edit to `src/pages/syntonic-comma.md` (+33 lines, 0 deletions). The four insertions:

### 1. `playDyad` import added to the existing single import cell (line 11)

```ts
import { playDyad } from "../components/play-dyad.js";
```

Appended inside the existing imports fenced block, not a new cell — Framework's module-scope rule would re-bind names if a second imports cell appeared. Mirrors schisma.md's import pattern.

### 2. Dyad button + beat-frequency display, inserted between the audition bullets and `## In monzos` (lines 43–59)

The dyad button itself:

```markdown
${playDyad(fiveLimit, pythagorean, synth, { label: "5/4 + 81/64 (syntonic-comma beat)" })}
```

Reuses three existing page-level bindings:

- `fiveLimit = new Interval("5/4")` — already constructed at line 28
- `pythagorean = new Interval("81/64")` — already constructed at line 29
- `synth` — page-owned `SynthHandle` from line 19's `createSynth()` (Pattern 4 / Pitfall #2)

The beat-frequency derivation (deliberately a kernel computation, not a literal):

```ts
const beatHz = (() => {
  const baseHz = 440; // matches playDyad's default (D-08)
  const fFiveLimit = baseHz * Number(fiveLimit.fraction.valueOf()); // 550 Hz
  const fPythag = baseHz * Number(pythagorean.fraction.valueOf()); // 556.875 Hz
  return Math.abs(fPythag - fFiveLimit); // 6.875 Hz
})();
```

`fraction.valueOf()` returns a `number` projection of the BigInt-rational (lossless here because the numerators/denominators sit far below `Number.MAX_SAFE_INTEGER`), multiplied by `baseHz` at the audio boundary. The result is rendered downstream via `${beatHz.toFixed(3)}` — three decimals, plain Markdown interpolation (not `tex`).

Prose under the button explains what the beating *is* and how the comma's cents value maps to a Hz signature at the chosen anchor.

### 3. "Tempered out by" blockquote, inserted between `## In monzos` and `## See also` (lines 68–72)

Bare `>` blockquote — there is no `.callout` CSS class in src/styles.css, so blockquote is the project convention for this kind of emphasized aside. Lists the meantone family (quarter-/third-/sixth-/seventh-comma) plus the four EDOs (12-/19-/31-/53-) where 81/80 maps to a unison.

### 4. `## Further reading` H2 appended after `## See also` (lines 85–91)

Single bulleted link to https://en.xen.wiki/w/81/80 with a descriptive sentence covering the syntonic comma's role as the defining comma of 5-limit meantone, the family of temperaments that vanish it, and worked examples of comma pumps that drift by exactly 81/80 per cycle. Placement and shape match the schisma.md / pythagorean-comma.md / edo-approximation.md convention.

## Why the beat-frequency is computed rather than hardcoded

The plan's must-haves explicitly require the displayed value to be derived from the existing Interval bindings, not written as a `6.875` literal in markdown prose. This is the Pitfall #1 discipline applied to a static scalar:

- The kernel of truth is `fiveLimit.fraction` and `pythagorean.fraction` — BigInt-rational, no precision loss.
- Hz and cents are *projections* — derived once at the audio/display boundary, never re-fed into the kernel.
- The value `6.875` is real (550 Hz subtracted from 556.875 Hz exactly, because both terms are integer multiples of 0.125), but writing it as a literal would create a parallel source of truth that could silently drift if baseHz or the Intervals ever changed.

Using `${beatHz.toFixed(3)}` for the display, and `// 6.875 Hz` only inside an end-of-line code comment, satisfies both the kernel-purity requirement and the grep gate that forbids prose-level `6.875` literals.

## Verification results

### Grep gates (from plan `<verify>` block)

| Gate                                                                                                    | Required | Actual                  | Result      |
| ------------------------------------------------------------------------------------------------------- | -------- | ----------------------- | ----------- |
| `grep -c 'import { playDyad }' src/pages/syntonic-comma.md`                                             | `1`      | `1`                     | PASS        |
| `grep -c 'playDyad(fiveLimit, pythagorean, synth' src/pages/syntonic-comma.md`                          | `1`      | `1`                     | PASS        |
| `grep -c '^## Further reading' src/pages/syntonic-comma.md`                                             | `1`      | `1`                     | PASS        |
| `grep -c 'en.xen.wiki/w/81/80' src/pages/syntonic-comma.md`                                             | `1`      | `1`                     | PASS        |
| `grep -v '^#' src/pages/syntonic-comma.md \| grep -cE '^[^/]*6\.875[^/]*$'` (no `6.875` literal in prose) | `0`      | `0`                     | PASS        |
| `grep -c 'createSynth()' src/pages/syntonic-comma.md`                                                    | `1`      | `2` (baseline, pre-existing) | See note below |

**Note on `createSynth()` count:** The plan's gate expected `1`, but the baseline file (HEAD on which the plan was generated) already contained 2 occurrences — line 16 is a *comment* that literally contains the text "lazy createSynth()" inside an explanatory note, and line 19 is the actual call. My edit did not introduce a second `createSynth()` and did not change this count (`git show HEAD~1:src/pages/syntonic-comma.md | grep -c 'createSynth()'` returns `2` on the baseline as well). **The Pitfall #2 intent is fully honored**: the actual call site is exactly one, and the new dyad button reuses the existing `synth` binding. The grep gate as written failed to filter the comment line — a planner-baseline mismatch, not an executor defect.

### `tsc --noEmit`

```
src/audio/synth.ts(29,77): error TS2307: Cannot find module 'npm:sw-synth' or its corresponding type declarations.
src/components/lattice.ts(32,66): error TS2307: Cannot find module 'npm:ji-lattice' or its corresponding type declarations.
src/components/lattice.ts(197,28): error TS7006: Parameter 'v' implicitly has an 'any' type.
src/components/lattice.ts(198,28): error TS7006: Parameter 'v' implicitly has an 'any' type.
src/components/scale-compare.ts(38,23): error TS2307: Cannot find module 'npm:@observablehq/plot' or its corresponding type declarations.
```

**5/5 errors are pre-existing `npm:` specifier baseline errors recorded in STATE.md.** No new errors introduced. PASS.

### `npm run build`

Build completes clean. **79 links validated** (matches baseline; the new external https://en.xen.wiki/w/81/80 link is not part of observable's internal link-checker scope). No new broken-link warnings. PASS.

### Bundle size delta

| Page                           | Before     | After      | Delta     |
| ------------------------------ | ---------- | ---------- | --------- |
| `/pages/syntonic-comma` (page)  | 11 kB      | 14 kB      | +3 kB     |
| `/pages/syntonic-comma` (imports) | 391 kB    | 392 kB     | +1 kB     |
| `/pages/syntonic-comma` (files)  | 68 kB     | 68 kB      | 0 kB      |

The +1 kB transitive imports delta reflects only the new `playDyad` module reference — playDyad's runtime was already in the import graph from schisma.md, so most of its bytes are deduplicated. The +3 kB page delta is the 33 new markdown lines plus the inline `beatHz` IIFE. No new dependencies added.

### Files modified

`git status --porcelain` after the code commit:

```
(clean)
```

Only `src/pages/syntonic-comma.md` was modified. No other file touched. PASS.

## Commits

| Hash    | Message                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 8b94311 | feat(quick-260512-msv): syntonic-comma A/B dyad button + beat-frequency display + tempered-out callout + Further reading                                                  |

## Deviations from Plan

None — plan executed exactly as written. The one nuance worth flagging is the `createSynth()` grep-gate count mismatch (expected 1, actual 2), which is a baseline condition unchanged by this edit: line 16's comment contains the literal text "lazy createSynth()" inside an explanatory note left over from when the page was first authored. The Pitfall #2 invariant (single page-owned AudioContext) holds — line 19 is still the only call site, and the new dyad button reuses the existing `synth` binding via Framework's reactive-cell binding scope. Documenting here so that if a future quick task wants the gate to read `1` cleanly, the comment text could be rephrased to drop the literal token "createSynth()".

## Known Stubs

None.

## Self-Check: PASSED

- src/pages/syntonic-comma.md exists at expected path: FOUND
- Commit 8b94311 exists in git log: FOUND
- All four insertions verified by `git diff src/pages/syntonic-comma.md`: PASS (additive-only hunks, 33 insertions, 0 deletions)
- All must_haves.truths achievable on the rendered page (verified by `npm run build` clean exit, page renders, button + beat-frequency + callout + Further reading all in HTML output)
- All must_haves.key_links grep patterns match in the edited file (5/5 pass; the 6th gate on `createSynth()` is a planner-baseline mismatch, see note above)
- tsc baseline unchanged (5 pre-existing errors, no new errors)
- observable build clean (79 links validated)
- No file other than src/pages/syntonic-comma.md modified
