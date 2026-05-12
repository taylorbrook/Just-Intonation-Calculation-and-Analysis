---
phase: quick-260512-dcp
plan: 01
subsystem: theory-pages
tags: [theory-page, edo, jit-approximation, sidebar]
requires:
  - src/lib/interval.ts (Interval, BigInt path)
  - src/lib/cents.ts (centsToRatio for irrational EDO-step audio)
  - src/audio/synth.ts (createSynth, cell-owned AudioContext)
  - src/components/play-interval.ts (kernel-exact ▶ button)
  - src/components/ratio-pill.ts (inline ratio pill)
  - observablehq.config.ts (Theory notes sidebar group)
provides:
  - src/pages/edo-approximation.md (new theory page; deviation matrix + 3 audition buttons)
affects:
  - observablehq.config.ts (one new sidebar entry: EDO approximations between Meantone and The schisma)
tech-stack:
  added: []
  patterns:
    - Display-layer EDO nearest-step math (Math.round of cents/stepCents) lives on the page, not in src/lib/edo.ts
    - centsToRatio at the audio boundary for irrational EDO-step pitches; kernel never sees the cents-derived float (Pitfall #1)
    - Plain DOM deviation table (createElement + textContent only; no innerHTML interpolation per T-02-22)
    - Mirror of meantone.md cell discipline — synth in its own cell, custom .play-btn for irrational pitches
key-files:
  created:
    - src/pages/edo-approximation.md
  modified:
    - observablehq.config.ts
decisions:
  - Inverse mapping (per-JI nearest step) is two-line display-layer work; do NOT add a new export to src/lib/edo.ts (orchestrator's important_clarification #2)
  - Use 31-EDO step 25 (≈967.74¢) and 12-EDO step 10 (1000¢) as the two contrastive 7/4 audition buttons — the 31-EDO/12-EDO gulf is the page's pedagogical headline
  - 53-EDO Mercator's comma framed as the 3-limit analogue of the Pythagorean comma (53 fifths vs 31 octaves vs Pythagorean's 12 vs 7); cross-link to /pages/pythagorean-comma
  - Deviation precision: 2 decimals on cents error (sufficient to separate 31-EDO's 5/4 +0.78¢ from 7/4 −1.08¢ without visual noise; Pitfall #16 minimum is 0.1¢)
metrics:
  duration: ~10min
  completed: 2026-05-12
---

# Phase quick-260512-dcp Plan 01: Add EDO approximation theory page Summary

EDO-approximation theory page added at /pages/edo-approximation; mirrors meantone.md's three-layer cell discipline, renders a 4×5 deviation matrix (12-/19-/31-/53-EDO × {3/2, 5/4, 7/4, 9/8, 11/8}) computed inline, and offers three contrastive 7/4 audition buttons (pure / 31-EDO / 12-EDO).

## Objective Met

Added `src/pages/edo-approximation.md` as the temperament thread's next step after Meantone: where meantone narrows the 5th to absorb the syntonic comma, EDOs go all the way and quantize every interval to N equal steps. The page makes the resulting JI-approximation quality scannable via a deviation matrix and audible via three 7/4 audition buttons (kernel-exact pure 7/4 vs 31-EDO step 25 vs 12-EDO step 10). Sidebar entry added between Meantone and The schisma. Single atomic feat commit covers both files; src/lib/edo.ts unchanged.

## Tasks Completed

| Task | Description | Commit | Files |
| ---- | ----------- | ------ | ----- |
| 1 | Create src/pages/edo-approximation.md + register sidebar entry between Meantone and The schisma | 9f8e999 | src/pages/edo-approximation.md, observablehq.config.ts |

## Implementation Highlights

- **Three-layer discipline preserved.** Page imports from `src/lib/` (Interval, centsToRatio), `src/audio/` (createSynth), and `src/components/` (playInterval, ratioPill) only. No direct imports of `sw-synth`, `xen-dev-utils`, or `fraction.js`.
- **Kernel-exact anchors, cents-only EDO math.** The five JI anchors are constructed as `new Interval("3/2")` etc. (R-01 BigInt path). EDO step centsvalues are irrational by construction (multiples of `1200/N`) — they live entirely in the cents/Hz domain and never become kernel input (Pitfall #1).
- **Inverse math is inline.** Per the plan's important_clarification #2, the per-(EDO, JI) nearest-step calculation is two lines (`step = Math.round(ideal / stepCents)`; `error = step * stepCents − ideal`) and belongs at the display layer. `src/lib/edo.ts` was NOT modified; no new export added.
- **DOM deviation table.** Built with `createElement` + `textContent` only (T-02-22). Cell format: `k @ ±Δ¢` with 2-decimal precision and a typographic `−` for negative deviations (so "sharp vs flat" is scannable at a glance).
- **Audition buttons.** Pure 7/4 button via `playInterval(harm7, synth, { label: true })`. The 31-EDO step-25 and 12-EDO step-10 buttons go through the same `.play-btn` custom-button pattern as meantone.md's `playTempered`: `centsToRatio` at the audio boundary, `synth.playNotes([baseHz, baseHz * ratio], 1.5)`.
- **Pattern 4 cell discipline.** Synth lives in its own cell with no dependencies on other cells. `invalidation.then(synth.dispose)` cleans up on cell re-eval and page navigation — no leaked AudioContext.

## Verification Values (computed on-page; confirms plan's reference values exactly)

| EDO    | 3/2          | 5/4          | 7/4          | 9/8          | 11/8         |
| ------ | ------------ | ------------ | ------------ | ------------ | ------------ |
| 12-EDO | 7 @ −1.96¢   | 4 @ +13.69¢  | 10 @ +31.17¢ | 2 @ −3.91¢   | 6 @ +48.68¢  |
| 19-EDO | 11 @ −7.22¢  | 6 @ −7.37¢   | 15 @ −21.46¢ | 3 @ −14.44¢  | 9 @ +17.10¢  |
| 31-EDO | 18 @ −5.18¢  | 10 @ +0.78¢  | 25 @ −1.08¢  | 5 @ −10.36¢  | 14 @ −9.38¢  |
| 53-EDO | 31 @ −0.07¢  | 17 @ −1.41¢  | 43 @ +4.76¢  | 9 @ −0.14¢   | 24 @ −7.92¢  |

Sanity-spot-check against the plan's expected values: 12-EDO/3-2 (step 7, −1.955¢) ✓, 31-EDO/7-4 (step 25, −1.084¢) ✓, 53-EDO/3-2 (step 31, −0.068¢) ✓, 12-EDO/11-8 (step 6, +48.682¢) ✓.

Plan's one stated 53-EDO/7-4 value of "~+4.8¢" in the must-haves and "~+4.8¢" in the prose is fine at 0.1¢ resolution; the page renders the cell as `43 @ +4.76¢` (2-decimal precision matches the table's display rule and the constraint's listed value of +4.759¢).

## Deviations from Plan

None. The plan was executed exactly as written.

## Verification Results

All gates passed.

- `npm run lint:types` → exit 0 (clean after `npm ci`; pre-installation showed pre-existing `npm:` import-resolution errors on the base branch unrelated to this task)
- `npm run lint` → exit 0 (one deprecation warning about legacy `.eslintignore` — pre-existing, unrelated)
- `npm run build` → exit 0 (17 pages rendered, including `edo-approximation`; 79 links validated)
- `npm test -- --run` → exit 0 (21 test files, 269 tests passing)
- `npm run format:check` → exit 0
- Grep gates: sidebar positioning (EDO approximations immediately after Meantone in observablehq.config.ts) ✓; all structural elements (createSynth, invalidation.then, centsToRatio, 31-EDO, 53-EDO, Mercator, /pages/analysis, /pages/pythagorean-comma, /pages/meantone) ✓; kernel-exact ratio strings (3/2, 5/4, 7/4, 9/8, 11/8) ✓; nearest-step math (Math.round + 1200) ✓; no direct kernel imports (sw-synth, npm:sw-synth, xen-dev-utils, fraction.js) ✓; no jiSubsetOfEdo / bestEdosForScale imports ✓; `src/lib/edo.ts` unchanged ✓.

## Files Created

- `src/pages/edo-approximation.md` — theory page; imports cell, isolated synth cell, kernel-exact JI anchors cell, per-EDO nearest-step matrix cell, DOM deviation-table cell, audition cell with 3 buttons; prose covering the four canonical EDOs with the 31-EDO 7-limit and 53-EDO Mercator's-comma headlines and the 12-EDO 7/4 + 11/8 failure-mode foils; See also section linking to /pages/analysis + /pages/pythagorean-comma + /pages/meantone.

## Files Modified

- `observablehq.config.ts` — added one entry `{ name: "EDO approximations", path: "/pages/edo-approximation" }` between Meantone and The schisma in the Theory notes group.

## Commit

- `9f8e999`: feat(quick-260512-dcp): add edo-approximation theory page

## Self-Check: PASSED

- `src/pages/edo-approximation.md` exists at the recorded path.
- `observablehq.config.ts` includes the new sidebar entry between Meantone and The schisma.
- Commit `9f8e999` exists in `git log --oneline --all` on `worktree-agent-a3256cae6a6dce487`.
- `src/lib/edo.ts` is unchanged on this branch (`git diff --name-only HEAD~1 HEAD` shows only the two touched files).
- All grep gates listed in the plan's `<verify><automated>` block pass.
- `lint:types`, `lint`, `build`, `test`, `format:check` all exit 0.
