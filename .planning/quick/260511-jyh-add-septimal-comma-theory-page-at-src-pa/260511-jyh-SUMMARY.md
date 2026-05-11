---
phase: quick-260511-jyh
plan: 01
subsystem: theory-notes
tags: [docs, theory, 7-limit, audio, sidebar]
requires: [src/lib/commas.ts, src/lib/interval.js, src/audio/synth.js, src/components/ratio-pill.js, src/components/play-interval.js]
provides:
  - src/pages/septimal-comma.md (new theory page)
  - sidebar entry under "Theory notes" → "The septimal comma"
affects: [observablehq.config.ts]
tech_stack:
  added: []
  patterns:
    - Pattern 4 cell-owned AudioContext (createSynth + invalidation.then(dispose))
    - KaTeX ${tex`…`} interpolation with bra-ket monzo display
    - ratioPill + playInterval widget idioms
key_files:
  created:
    - src/pages/septimal-comma.md
  modified:
    - observablehq.config.ts
decisions:
  - "Cross-link target set: linked to syntonic comma + Pythagorean comma + dashboard (omitted schisma per prose voice — schisma is the 5-limit-residue closer, septimal is the prime-7 doorway, not parallel commas)"
  - "Sidebar order: appended after 'The schisma' (most-recent-added convention from prior two quick tasks 260511-j8l and 260511-jbq)"
  - "Audio order: harmonic 7th → Pythagorean minor 7th → septimal comma (matches the prose framing 'gap between A and B', then comma itself)"
metrics:
  duration: ~4min
  completed_date: 2026-05-11
---

# Quick Task 260511-jyh: Add septimal comma theory page Summary

One-liner: Added a 7-limit JI theory note at /pages/septimal-comma that mirrors syntonic-comma.md's structure (Pattern 4 synth, KaTeX, ratioPill, playInterval) and registered it in the sidebar under Theory notes.

## What Changed

- **New page** `src/pages/septimal-comma.md` — H1 "The septimal comma"; subtitle frames 64/63 as the doorway from 5-limit to 7-limit JI. Imports Interval, commaByName, createSynth, ratioPill, playInterval. Synth cell is verbatim Pattern 4 (cell-owned, no cross-cell deps, lazy AudioContext via createSynth + invalidation.then(dispose)). Definitions cell pulls septimal = commaByName("septimal comma")! plus the two comparison Intervals (7/4 harmonic 7th and 16/9 Pythagorean minor 7th). Prose paragraph states the comma in tex as 64/63 ≈ 27.26¢ and gives the identity (16/9)/(7/4) = 64/63. Three play buttons in wide-to-narrow framing (7/4, 16/9, 64/63 itself). `## In monzos` section renders the bra-ket monzo `[6, -2, 0, -1]` with the 2^6 · 3^-2 · 5^0 · 7^-1 factorization and explains the prime-7 entry. `## See also` cross-links to syntonic comma, Pythagorean comma, and the dashboard at `/`.

- **Sidebar registration** in `observablehq.config.ts` — appended `{ name: "The septimal comma", path: "/pages/septimal-comma" }` to the inner pages array of the Theory notes group, placed after "The schisma" per the most-recent-added convention. Theory notes group now lists four entries: syntonic → Pythagorean → schisma → septimal.

## Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | feat(quick-260511-jyh): add septimal comma theory page | c3687fc |
| 2 | feat(quick-260511-jyh): register septimal-comma page in sidebar | 924edb5 |

## Verification Status

- **Task 1 automated verification**: PASS — grep chain confirmed `commaByName("septimal comma")`, `7/4`, `16/9`, `64/63`, `27.26`, monzo `6 & -2 & 0 & -1`, `/pages/syntonic-comma` cross-link, `createSynth()`, and `invalidation.then` are all present in the new file.
- **Task 2 automated verification**: PASS — sidebar grep matched `"The septimal comma"` and `"/pages/septimal-comma"`; `npx tsc --noEmit --skipLibCheck observablehq.config.ts` exited with zero errors.
- **Task 3 human-verify checkpoint**: NOT EXECUTED in this agent — orchestrator-surfaced per quick-task contract. User to run `npm run dev`, visit `/pages/septimal-comma`, click each of the three play buttons, and confirm the sidebar lists four Theory notes entries. The page mirrors `syntonic-comma.md` exactly on cell structure, so any rendering regression would surface against that baseline too.

## Deviations from Plan

None — plan executed exactly as written. The plan was tightly specified (concrete prose, exact monzo, exact play-button order, exact tex strings) and required no Rule 1/2/3 fixes or architectural decisions.

## Known Stubs

None. All data sources are live: `commaByName("septimal comma")` resolves against the hand-verified row already present in `src/lib/commas.ts`; the two comparison Intervals are constructed from string literals via `new Interval(...)`.

## Threat Flags

None. This change is markdown content + a config-array append; no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries are introduced.

## Self-Check: PASSED

- File exists: `src/pages/septimal-comma.md` — FOUND
- File modified: `observablehq.config.ts` — FOUND (1 insertion in commit 924edb5)
- Commit c3687fc — FOUND in git log
- Commit 924edb5 — FOUND in git log
- TypeScript type-check on `observablehq.config.ts` — 0 errors
- Grep chain on `src/pages/septimal-comma.md` for all 9 plan-specified tokens — all matched
