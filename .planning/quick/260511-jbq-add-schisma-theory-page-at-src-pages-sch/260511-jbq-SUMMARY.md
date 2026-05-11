---
phase: quick-260511-jbq
plan: 01
subsystem: docs
tags: [theory, comma, schisma, observable-framework]
requires:
  - src/lib/commas.ts (commaByName + "schisma" / "syntonic comma" / "Pythagorean comma" entries)
  - src/lib/interval.js
  - src/audio/synth.js (createSynth)
  - src/components/ratio-pill.js
  - src/components/play-interval.js
provides:
  - "/pages/schisma — theory note on the schisma (32805/32768, monzo [-15, 8, 1])"
  - "Sidebar entry under Theory notes for the schisma page"
affects:
  - observablehq.config.ts (sidebar registration only)
tech_stack_added: []
patterns_followed:
  - "Theory-note template (mirror of src/pages/syntonic-comma.md)"
  - "Pattern 4 / Pitfall #2: cell-owned AudioContext, no cross-cell synth dependencies"
  - "commaByName lookup against canonical monzo table (no new Interval ratio strings when key exists)"
key_files_created:
  - src/pages/schisma.md
key_files_modified:
  - observablehq.config.ts
decisions:
  - "Mirrored syntonic-comma.md verbatim for imports + synth cells (template fidelity, not pythagorean-comma's variant with manual fifth-stacking)"
  - "Audition bullets ordered Pythagorean -> syntonic -> schisma (descending size) so the listener hears the size gradient narrow to the residue"
  - "Used commaByName(\"schisma\") rather than new Interval(\"32805/32768\") — keeps the page consistent with the table-as-source-of-truth pattern"
metrics:
  duration_min: 1
  tasks_completed: 1
  files_touched: 2
  completed_at: "2026-05-11T20:58:31Z"
---

# Phase quick-260511-jbq Plan 01: Schisma theory page Summary

Added a third theory page — `src/pages/schisma.md` — completing the comma triptych (syntonic, Pythagorean, schisma) by telling the size-comparison story: schisma = Pythagorean comma − syntonic comma. Page renders three clickable audition links in descending size so the gradient from "audible interval" to "barely-audible artifact" is hearable in one click-through.

## What shipped

- `src/pages/schisma.md` — 60-line theory note structured identically to `src/pages/syntonic-comma.md`:
  1. H1 + tagline
  2. Imports cell (5 imports, identical to template)
  3. Synth cell (verbatim Pattern 4 / Pitfall #2)
  4. Intervals cell — three `commaByName` lookups with `!`-assertion + drift-honesty comment
  5. Definition prose with the subtraction identity ${tex`\frac{531441/524288}{81/80} = \frac{32805}{32768}`}
  6. Audition list, descending size: Pythagorean ~23.46¢ → syntonic ~21.5¢ → schisma ~1.95¢
  7. One sentence on schismatic temperament (tempering out the schisma identifies a stack of 8 pure fifths reduced by 5 octaves with a 5-limit major third)
  8. `## In monzos` showing `[-15, 8, 1]⟩ = 2⁻¹⁵·3⁸·5¹` plus the monzo-subtraction derivation
  9. `## See also` linking `/pages/syntonic-comma`, `/pages/pythagorean-comma`, and `/`
- `observablehq.config.ts` — appended `{ name: "The schisma", path: "/pages/schisma" }` to the Theory notes sidebar group. No other config changes.

## Monzo arithmetic (justifies the story direction)

Verified by hand against `src/lib/commas.ts`:

- Pythagorean comma: `[-19, 12, 0]` = 531441/524288 ≈ 23.46¢
- Syntonic comma:    `[ -4,  4, -1]` = 81/80 ≈ 21.51¢
- Schisma:           `[-15,  8,  1]` = 32805/32768 ≈ 1.95¢
- Pythagorean − syntonic = `[-19−(−4), 12−4, 0−(−1)]` = `[-15, 8, 1]` = schisma ✓

The Pythagorean is the wider parent comma; subtracting the narrower syntonic from it leaves a positive ~1.95¢ residue. The page states the direction explicitly (not the reverse) and shows the same arithmetic at the ratio level in the prose and at the monzo level in the `## In monzos` section.

## Sidebar registration

```ts
pages: [
  { name: "The syntonic comma", path: "/pages/syntonic-comma" },
  { name: "The Pythagorean comma", path: "/pages/pythagorean-comma" },
  { name: "The schisma", path: "/pages/schisma" },
],
```

All other `observablehq.config.ts` fields (title, root, theme, style, toc, pager, header, footer, head) were left untouched.

## Deviations from Plan

**None of substance.** The plan was followed precisely. One small wording observation worth recording for future template clones:

- The plan suggested two patterns for the monzo-subtraction prose ("prime-3 column (8) and prime-5 column (1) together encode the Pythagorean stack vs. 5-limit-third reconciliation"). The page uses that wording verbatim and follows it with the monzo subtraction derivation using inline `tex` for each of the three monzos — slightly more visual than a plain-text "[-19, 12, 0] − [-4, 4, -1] = [-15, 8, 1]" but consistent with the template's KaTeX-heavy idiom.

## Verification

**Automated checks (all passed):**

- `test -f src/pages/schisma.md` — present
- `grep 'commaByName("schisma")' src/pages/schisma.md` — found (1 occurrence)
- `grep '/pages/syntonic-comma' src/pages/schisma.md` — found
- `grep '/pages/pythagorean-comma' src/pages/schisma.md` — found
- `grep '32805/32768' src/pages/schisma.md` — found (3 occurrences across prose, monzo, and audition contexts)
- `grep 'schismatic' src/pages/schisma.md` — found (1 occurrence — exactly one sentence on schismatic temperament)
- `grep '"/pages/schisma"' observablehq.config.ts` — found
- `npm run lint:types` — 5 pre-existing errors (npm: import resolution + lattice.ts implicit-any), identical count before and after this change. Verified by `git stash` + re-run. Zero new errors introduced.
- `npm run format:check` — All matched files use Prettier code style.

**Manual verification (deferred to user, per the plan):**

- `npm run dev` + visit `/pages/schisma` — render, three audition links play, KaTeX renders fractions and monzo, See also links navigate.
- Sidebar shows "The schisma" under Theory notes.

## Commits

| Hash    | Message                                       | Files                                       |
| ------- | --------------------------------------------- | ------------------------------------------- |
| ddb15a4 | docs(quick-260511-jbq): add schisma theory page | src/pages/schisma.md, observablehq.config.ts |

## Self-Check: PASSED

- File `src/pages/schisma.md` — FOUND
- File `observablehq.config.ts` — present and modified
- Commit `ddb15a4` — FOUND in `git log --oneline`
