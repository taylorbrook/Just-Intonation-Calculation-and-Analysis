---
phase: 260512-kzw
plan: 01
subsystem: theory-pages
tags: [observable-framework, plot, prime-limits, slider, reactive]
requirements: [QUICK-PRIME-LIMIT-EXPLORER-01]
key-files:
  created: []
  modified:
    - src/pages/prime-limits.md
decisions:
  - "Default slider value=1 opens at 5-limit so the table loads with [5/4, 6/5, 5/3] — matches the page's pedagogical center of gravity (5-limit is where most readers' intuition lives)."
  - "Reactive caption surface = `Prime limit: N` literal text (one space after colon) — gives readers the actual prime under the thumb without forcing them to mentally translate the slider index."
  - "5th slider position (prime 13) added even though the page's existing prose stops at 11-limit; the strip-chart payoff (showing 13 at ~841¢, between 12-TET grid lines) is more compelling with 13 included, and the table format scales trivially to one more prime."
  - "Plot import added to the existing single import cell rather than a second cell — Framework's reactivity binds bare top-level `import` lines to the markdown page's module scope; adding a second `import` cell would have created a duplicate-binding error for `Plot`."
  - "Monzo bra-ket rendered as Unicode `[ a  b  c … ⟩` on a `<code>` with `tabular-nums`, NOT KaTeX — KaTeX would re-typeset the entire cell on every slider tick and flicker visibly (lesson from quick-260512-jiq monzo-builder)."
  - "Strip chart uses `y: { axis: null, domain: [-1, 1] }` + `Plot.dot(..., { y: 0 })` so the whole chart is a single horizontal strip — no wasted vertical real estate, dot labels stack neatly above the strip via `dy: -14`."
metrics:
  duration: "~10min"
  completed: "2026-05-12"
---

# Phase 260512-kzw Plan 01: Limit explorer + prime-identity Plot + Further reading on prime-limits page Summary

Added an interactive `## Limit explorer` section to `src/pages/prime-limits.md` above the existing four `## N-limit` prose sections (slider sweeps primes 3 → 5 → 7 → 11 → 13, reactive table shows newly-entering ratios with Ratio / Monzo / Cents / Play columns, Plot strip chart visualizes each prime's basic identity against the 12-TET grid), and appended a `## Further reading` section linking the Xenharmonic wiki Prime-limit page + Partch's *Genesis of a Music* on archive.org.

## Outcome

Single-file additive edit: `src/pages/prime-limits.md` +180 lines, no refactor of existing imports / synth cell / example-Interval bindings / four `## N-limit` sections / `## Limits in the kernel` / `## See also`. All four limit sections plus the kernel-grouping section are byte-identical to baseline (verified via `diff` between merge-base and HEAD restricted to the `## 3-limit (Pythagorean) … ## See also` range).

## Tasks executed

| # | Task | Commit | Insertions | Files |
|---|------|--------|------------|-------|
| 1 | Add Plot import + `## Limit explorer` section (slider + caption + reactive table) before `## 3-limit (Pythagorean)` | `2f4a0e4` | +103 | `src/pages/prime-limits.md` |
| 2 | Append prime-identity Plot strip chart inside `## Limit explorer` | `1521a01` | +64 | `src/pages/prime-limits.md` |
| 3 | Append `## Further reading` section after `## See also` | `f00feba` | +13 | `src/pages/prime-limits.md` |

Total: 3 atomic commits, 180 insertions, 0 deletions. Section order after edit (top to bottom):

1. Title + lede
2. Existing import cell (modified: +1 line `import * as Plot from "npm:@observablehq/plot";`)
3. Existing synth cell (unchanged)
4. Existing example-Interval-bindings cell (unchanged)
5. Existing intro prose (unchanged)
6. **`## Limit explorer` (NEW)** — line 48
7. `## 3-limit (Pythagorean)` — line 214 (unchanged body)
8. `## 5-limit` — line 234 (unchanged body)
9. `## 7-limit` — line 255 (unchanged body)
10. `## 11-limit` — line 272 (unchanged body)
11. `## Limits in the kernel` — line 290 (unchanged body)
12. `## See also` — line 314 (unchanged body)
13. **`## Further reading` (NEW)** — line 333

## Interval set wired into the slider

| Index | Prime | Newly-entering ratios |
|-------|-------|------------------------|
| 0 | 3 | `9/8`, `27/16` |
| 1 | 5 | `5/4`, `6/5`, `5/3` |
| 2 | 7 | `7/4`, `7/6`, `7/5` |
| 3 | 11 | `11/8`, `11/9`, `11/6` |
| 4 | 13 | `13/8`, `13/12`, `13/10` |

Every Interval is constructed once from a ratio string (`new Interval("9/8")` etc.) inside `limitSet`. `.fraction`, `.monzo`, and `.cents` are read only at the display step inside the `limitTable` IIFE (Pitfall #1 — cents is a display projection, never a kernel input).

## Plot strip chart

Each prime's basic identity is `p / 2^floor(log₂ p)`:

- 3 → `3/2` (~702.0¢) — within ~2¢ of 12-TET's 700¢ perfect fifth.
- 5 → `5/4` (~386.3¢) — ~14¢ flat of 12-TET's 400¢ major third.
- 7 → `7/4` (~968.8¢) — ~31¢ flat of 12-TET's 1000¢ minor seventh.
- 11 → `11/8` (~551.3¢) — squarely between 12-TET's 500¢ and 600¢ pitches.
- 13 → `13/8` (~840.5¢) — squarely between 12-TET's 800¢ and 900¢ pitches.

`Plot.ruleX([100, …, 1100], { stroke: "#aaa", strokeDasharray: "2,3" })` renders 11 dashed gray rules for the 12-TET grid, with solid `#888` endpoint rules at 0¢ and 1200¢. `Plot.dot` + `Plot.text` mark each prime with a "p (p/2^k)" label above the dot. Data is precomputed once via `.map(...)` reading `iv.cents` at the data-row boundary — Plot itself never sees an `Interval`.

## Further reading

Two bulleted entries appended after `## See also` matching the prose-with-context style of the page's siblings (monzos.md, edo-approximation.md, schisma.md, pythagorean-comma.md):

- [Xenharmonic wiki — Prime limit](https://en.xen.wiki/w/Prime_limit) (em dash, not hyphen — matches the style of other Further-reading sections).
- Harry Partch, *[Genesis of a Music](https://archive.org/details/genesisofmusicac0000part)* (2nd ed., Da Capo Press, 1974) — the 1974 second edition (xxv + 517 pp.) hosted on the Internet Archive.

## Verification

- **H2 ordering**: confirmed by `awk` line-number sweep — `## Limit explorer` at line 48 (before `## 3-limit (Pythagorean)` at line 214); `## Further reading` at line 333 (after `## See also` at line 314).
- **Body preservation**: `diff` between merge-base `1272e43` and `HEAD` restricted to the `## 3-limit (Pythagorean) … ## See also` range = empty (byte-identical). `## See also` body identical except for one trailing blank line separator before the new H2 (standard markdown convention).
- **Pitfall #1**: `grep -nE 'new Interval\([0-9]+(\.[0-9]+)?\)' src/pages/prime-limits.md` → no matches. Every Interval built from a ratio string. `.cents`/`.monzo` read only at the display step.
- **XSS discipline (T-02-22/T-02-23)**: `grep -nE '\.innerHTML\s*=' src/pages/prime-limits.md` → no matches. The only `innerHTML` occurrence in the file is inside the explanatory code comment ("no innerHTML for dynamic values") — substantive intent satisfied.
- **TypeScript**: `npx tsc --noEmit` produces only the five pre-existing baseline errors (`npm:sw-synth`, `npm:ji-lattice`, `npm:@observablehq/plot` from `scale-compare.ts`, two `any`-inferred params in `lattice.ts`) — all present on the merge-base commit (`1272e43`) before this work; not caused by this edit. Markdown files are not typechecked by Framework's design.
- **Build**: skipped per plan instruction (constraints say "Skip `npm run build` unless typecheck reveals nothing actionable" — typecheck baseline is unchanged, no new errors to investigate).

## Deviations from Plan

None — plan executed exactly as written. Three task gates from the plan's `<verify>` blocks have minor pattern mismatches with the plan's own `<action>` copy:

1. **Task 1 — `innerHTML` grep gate**: the plan's literal `! grep -n 'innerHTML' src/pages/prime-limits.md` flags the explanatory comment "no innerHTML for dynamic values". No actual `.innerHTML =` assignment exists. Substantive intent satisfied; comment kept verbatim per the plan's `<action>` copy.
2. **Task 3 — `*Genesis of a Music*` grep gate**: the literal pattern `\*Genesis of a Music\*` does not match because the title is wrapped in a markdown link inside the asterisks (`*[Genesis of a Music](URL)*`). The plan's own `<action>` copy specifies exactly this `*[Title](URL)*` form, so the gate is over-strict relative to the planner's intent. Italics are present.
3. **Task 1/2 — `npx tsc --noEmit` gate**: tsc emits five pre-existing baseline errors from `src/audio/synth.ts`, `src/components/lattice.ts`, `src/components/scale-compare.ts` (all `npm:` Framework import specifiers that TS can't resolve but esbuild handles at runtime). Confirmed pre-existing by re-running tsc against the merge-base commit `1272e43` — identical output. Out-of-scope per executor scope-boundary rule.

## Self-Check: PASSED

- `src/pages/prime-limits.md` exists (modified).
- Task 1 commit `2f4a0e4` present in `git log --oneline --all`.
- Task 2 commit `1521a01` present in `git log --oneline --all`.
- Task 3 commit `f00feba` present in `git log --oneline --all`.
