---
phase: quick-260511-rb4
plan: 01
subsystem: theory-notes
tags:
  - observable-framework
  - katex
  - monzo
  - ji-theory
requires:
  - src/lib/interval.ts (Interval class — uses `Interval.monzo` getter, `Interval.fromMonzo`, `mul`, `equals`, `toString`)
  - src/audio/synth.ts (createSynth factory — page-owned AudioContext, lazy allocation)
  - src/components/ratio-pill.ts (ratioPill inline display)
  - src/components/play-interval.ts (playInterval ▶ button factory)
provides:
  - "/pages/monzos route: theory page introducing monzos as JI's canonical coordinate system"
  - "Sidebar entry under 'Theory notes' (first position, before the four comma pages)"
affects:
  - observablehq.config.ts (sidebar registration)
tech-stack:
  added: []
  patterns:
    - "ARCHITECTURE Pattern 1: Interval kernel as universal currency (no direct toMonzo import)"
    - "ARCHITECTURE Pattern 4 / Pitfall #2: page-owned synth cell with no other dependencies; invalidation.then(dispose)"
    - "KaTeX bra-ket monzo style: \\begin{bmatrix}...\\end{bmatrix}\\rangle (mirrors syntonic-comma.md / septimal-comma.md)"
key-files:
  created:
    - src/pages/monzos.md
  modified:
    - observablehq.config.ts
decisions:
  - "Page uses Interval.monzo getter + Interval.fromMonzo static exclusively (no direct toMonzo import) — consistent with ARCHITECTURE Pattern 1 and the comma pages' kernel-access discipline."
  - "Sidebar order: Monzos first under Theory notes, before the four comma pages — monzo notation is a prerequisite concept the comma pages reference but never introduce."
  - "Round-trip and addition cells use display() (Framework's inspectable-value renderer) instead of HTML tables — readers can expand and verify each row, and the surface is honest about kernel reality."
  - "Padding-with-zeros for monzo addition done inline in the cell rather than via monzoAdd from src/lib/monzo.ts — keeps the page self-explanatory and avoids importing helpers the prose doesn't need."
metrics:
  duration_min: 3
  tasks_complete: 2
  files_modified: 2
  completed: 2026-05-12
---

# Quick Task 260511-rb4: Add monzos theory page Summary

Added a foundational theory page at `/pages/monzos` introducing prime-factor vectors (monzos) as JI's canonical coordinate system. The page mirrors the syntonic-comma.md / septimal-comma.md template exactly — same imports, same synth cell, same KaTeX bra-ket style — but with four worked examples spanning 3-, 5-, and 7-limit and a proof-by-display round-trip + addition-equivalence cell pair using the existing `Interval` kernel.

## Files Created / Modified

- **Created:** `src/pages/monzos.md` (151 lines)
- **Modified:** `observablehq.config.ts` (sidebar: +1 line — Monzos entry inserted as first under "Theory notes")

## Worked-Example Intervals

| Ratio | Monzo (bra-ket) | Prime-limit | Purpose |
|-------|-----------------|-------------|---------|
| `3/2`  | `[-1, 1]\rangle`           | 3-limit | Single pure fifth — minimal monzo, introduces the 2- and 3-axis vocabulary. |
| `5/4`  | `[-2, 0, 1]\rangle`        | 5-limit | First nonzero 5-column; major third with no Pythagorean component. |
| `81/80` | `[-4, 4, -1]\rangle`      | 5-limit | The syntonic comma — large-exponent example, mixed sign. |
| `7/6`  | `[-1, -1, 0, 1]\rangle`   | 7-limit | First nonzero 7-column; demonstrates a factor of 3 living in the denominator. |

Each example has: ratio pill + ▶ audition button + KaTeX bra-ket monzo + 1-sentence interpretation.

## Sections

1. H1 + subtitle
2. Import cell + synth cell (verbatim from the comma-page template)
3. Interval-construction cell (four named consts)
4. Intro prose — 2 short paragraphs (what a monzo is, why monzos matter here)
5. § Worked examples — 4 examples + a `display(roundTrip)` cell proving `Interval.fromMonzo(iv.monzo).equals(iv)` for all four
6. § Monzo addition = ratio multiplication — KaTeX equation + `display({ ... agree: true })` cell cross-checking `fifth.mul(majorThird)` against the component-wise monzo sum (with explicit pad-with-zeros for the length mismatch between `[-1, 1]` and `[-2, 0, 1]`)
7. § See also — links to `/` (lattice = 2D monzo projection) and `/pages/syntonic-comma` (5-limit comma worked story)

## Deviations from syntonic-comma.md / septimal-comma.md Template

Minor and all defensible:

1. **No `commaByName` import.** The page is not about a single comma, so it never calls into `src/lib/commas.ts`. All four intervals are built from string ratios via `new Interval("...")`. The plan called this out explicitly.
2. **Two `display(...)` cells (round-trip + addition agreement)** that don't appear in the comma pages. The comma pages are short narrative essays; this page is a worked-examples reference that needs to prove honesty about the kernel↔monzo equivalence, hence the inline `display`s. Each one is small (4-5 lines), follows the cell-discipline of the project (no float math, BigInt Fraction is the source of truth), and is annotated with why the check exists.
3. **`Math.max + Array.from` padding** for the addition cell instead of importing `monzoAdd` from `src/lib/monzo.ts`. Rationale: the prose explicitly explains that monzos of differing length get padded with zeros, so the cell that demonstrates the rule should make the padding visible rather than hiding it behind a helper. Keeps the page self-explanatory and avoids touching `src/lib/monzo.ts` (anti-scope per plan).
4. **In-page anchor link `#monzo-addition-ratio-multiplication`** in the intro prose pointing forward to § Monzo addition. Single `=` in the heading collapses to a single hyphen (not double) in Framework's slug generation; this was caught during the first `npm run build` (broken-link warning) and fixed before the Task 1 commit.

No deviations from the **must-haves** in the plan frontmatter: every truth still holds and every required artifact / link / pattern is in place.

## Auto-fix Deviations

- **[Rule 3 — Blocking-issue fix] `npm install` ran once.** `node_modules/` did not contain `sw-synth`, `ji-lattice`, or `@observablehq/plot` after the worktree rebased to the expected base (`3220e68...`), causing `tsc --noEmit` to emit pre-existing "Cannot find module 'npm:...'" errors for files unrelated to this task. Running `npm install` populated the missing packages and `tsc --noEmit` ran clean. No package-lock.json changes were committed (`git status` showed only the page + config files as planned).
- **[Rule 1 — Bug] Broken intra-page anchor.** First `npm run build` reported `/pages/monzos → /pages/monzos#monzo-addition--ratio-multiplication` as a broken link — Framework slugs the heading `Monzo addition = ratio multiplication` as `monzo-addition-ratio-multiplication` (single hyphen for the `=`, not double). Edited the link to match the actual slug; rebuild reports `30 links validated`. Fix landed in the Task 1 commit (before staging).

## Verification

- `npx tsc --noEmit` — clean (after `npm install`)
- `npm run build` — clean; 9 pages rendered including new `dist/pages/monzos.html` (18KB); 30 links validated, 0 warnings
- `dist/pages/monzos.html` contains the page content and pulls in `ratio-pill.*.js` + `play-interval.*.js` for runtime DOM emission
- `dist/index.html` sidebar contains `href="/pages/monzos"`
- Source markdown contains: 9 `\begin{bmatrix}` KaTeX blocks, 5 `Interval.fromMonzo` references, 4 `playInterval(` calls, 2 `/pages/syntonic-comma` links, and a `](/)` dashboard link.

## Self-Check: PASSED

- File created: `src/pages/monzos.md` — FOUND
- File modified: `observablehq.config.ts` — FOUND (Monzos entry as first under Theory notes)
- Task 1 commit: `3b8b4e9` — FOUND on `worktree-agent-a013362ecabab615b`
- Task 2 commit: `80a0a15` — FOUND on `worktree-agent-a013362ecabab615b`
- Built artifact: `dist/pages/monzos.html` (18KB) — FOUND
- Plan must-haves: all 7 truths satisfied; both artifacts present with `contains` / `min_lines` checks passing; all 5 key_links present.

## STATE.md Row Append

| 260511-rb4 | add monzos theory page mirroring syntonic-comma.md; sidebar entry registered as first under Theory notes | 2026-05-12 | 80a0a15 | [260511-rb4-add-monzos-theory-page-at-src-pages-monz](./quick/260511-rb4-add-monzos-theory-page-at-src-pages-monz/) |
