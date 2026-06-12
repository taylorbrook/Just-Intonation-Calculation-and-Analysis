---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
plan: 03
subsystem: ui
tags: [sonic-weave, xen-dev-utils, fokker, periodicity-block, free-text-dsl, tempered, generate-widget]

# Dependency graph
requires:
  - phase: 07-01
    provides: "scaleFromSonicWeave adapter ({scale, tempered, error}) + fokkerCardinality |det| helper"
  - phase: 06
    provides: "scaleTable tempered/exact-JI variants + badge; generate-cps chip idiom; generate-ed mode-swap shell; playScale; SynthHandle"
provides:
  - "generate-fokker.ts (GEN-08): basis<->comma Fokker block widget, exact-rational, live |det|/extents readout"
  - "generate-sonicweave.ts (GEN-09): free-text DSL escape hatch, evaluate-on-click, raw errors, docs link"
  - "comma->basis bridge (HNF diagonal -> parallelotope) reproducing |det| exact-rational notes"
affects: [07-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "comma->basis Fokker bridge: HNF diagonal of the (3,5,...)-subspace comma matrix becomes parallelotope per-axis extents (A3 path a)"
    - "evaluate-on-click free-text: rebuild() wired to button click ONLY, no textarea input listener (D-16)"
    - "exact-rational widget: scaleTable WITHOUT tempered flag + isTempered()=>false (Fokker is JI, not tempered)"

key-files:
  created:
    - src/components/generate-fokker.ts
    - src/components/generate-fokker.css
    - src/components/__tests__/generate-fokker.test.ts
    - src/components/generate-sonicweave.ts
    - src/components/generate-sonicweave.css
    - src/components/__tests__/generate-sonicweave.test.ts
  modified: []

key-decisions:
  - "Comma-mode enumeration (A3): HNF-diagonal comma->basis bridge feeds the verified parallelotope enumerator, reproducing |det| exact notes; comma mode's primary surface is the live |det| readout (D-12)"
  - "Kernel Scale length is block-notes + 1 unison (12-tone block -> 13 rows, Hexany -> 7 rows) per the adapter's D-13 1/1 prepend; the '-> N notes' readout shows the block count (12/6), the table shows N+1"
  - "Free-text docs link points at github sonic-weave documentation/dsl.md (D-20, most user-facing stable URL)"

patterns-established:
  - "comma->basis bridge: xen-dev-utils hnf() diagonal -> parallelotope ups/downs"
  - "evaluate-on-click-only: no input listener on the textarea (D-16 anti-pattern guard)"

requirements-completed: [GEN-08, GEN-09]

# Metrics
duration: 25min
completed: 2026-06-11
---

# Phase 7 Plan 03: Fokker block + free-text SonicWeave widgets Summary

**GEN-08 exact-rational Fokker block widget (basis<->comma toggle, live |det|/extents readout, HNF comma->basis bridge) and GEN-09 free-text SonicWeave escape hatch (evaluate-on-click, raw errors verbatim, docs link) over the Plan-01 adapter.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-11T20:14:00Z (approx, file reads + runtime verification)
- **Completed:** 2026-06-11T20:38:22Z
- **Tasks:** 2 (both TDD: RED -> GREEN)
- **Files modified:** 6 created

## Accomplishments
- **generate-fokker.ts (GEN-08):** lands on the classic 5-limit 12-tone block (basis mode default, D-10/D-11) rendering 13 exact-rational rows (12 block notes + 1/1, "Ratio" header, no tempered badge); basis<->comma mode toggle (D-09) with per-mode state preservation; live "-> N notes" readout (D-12) showing the extents product (basis) or `fokkerCardinality` |det| (comma); non-square comma sets degrade gracefully (readout message, no crash, prior preview preserved).
- **Comma->basis bridge (A3 path a):** the (3,5,...)-subspace comma matrix's HNF diagonal becomes the `parallelotope` per-axis extents — `["81/80","128/125"]` -> `parallelotope([3,5],[3,2],[0,0])` -> 12 exact-rational notes. Runtime-verified before implementation.
- **generate-sonicweave.ts (GEN-09):** textarea pre-filled with `cps([1,3,5,7], 2)` evaluated once on construction (Hexany previews, D-13); evaluate-on-click ONLY (no textarea input listener, D-16); raw adapter errors verbatim in `[role=status]` via textContent with the prior preview preserved (D-15); conditional tempered (`isTempered()` reflects `result.tempered`, badge for tempered programs); docs `<a rel="noopener noreferrer">` to the SonicWeave documentation (D-14/D-20).
- **23 new tests** (10 Fokker + 13 free-text), all green; full suite 527/527 green (no regressions).

## Task Commits

Each task was committed atomically (TDD: test -> feat):

1. **Task 1: generate-fokker.ts (GEN-08)** — `8de883f` (test, RED) -> `be8722f` (feat, GREEN)
2. **Task 2: generate-sonicweave.ts (GEN-09)** — `e423efa` (test, RED) -> `579d12b` (feat, GREEN)

## Files Created/Modified
- `src/components/generate-fokker.ts` — GEN-08 Fokker block widget: basis-chip + comma-chip modes, live |det|/extents readout, HNF comma->basis bridge, exact-rational table, defense-in-depth caps (482 lines).
- `src/components/generate-fokker.css` — Fokker widget styles (var(--theme-*) tokens only; readout rule).
- `src/components/__tests__/generate-fokker.test.ts` — 10 tests: default 12-tone block, mode toggle, live readout, comma block, non-square safety, play, getScale.
- `src/components/generate-sonicweave.ts` — GEN-09 free-text widget: textarea + Evaluate button + docs link + status region, evaluate-on-click, conditional tempered (178 lines).
- `src/components/generate-sonicweave.css` — free-text widget styles incl. the required textarea rule (var(--theme-*) tokens only).
- `src/components/__tests__/generate-sonicweave.test.ts` — 13 tests: default Hexany, evaluate-on-click, malformed-error preservation, multi-line, docs link, tempered, play, getScale.

## Decisions Made
- **Comma-mode enumeration (A3 path a, resolved by this plan):** comma mode's primary job is the live `fokkerCardinality` |det| readout (D-12); enumeration reuses the verified `parallelotope` basis enumerator via an HNF-diagonal comma->basis bridge. The classic 81/80+128/125 block renders 12 exact-rational notes (verified). The comma-mode block uses a valid alternate fundamental-domain representative set (75/64, 675/512, ...) vs the basis-mode canonical set (6/5, 27/20, ...) — both have |det|=12 and are legitimate periodicity blocks of the same comma kernel.
- **Kernel Scale length convention:** the adapter prepends the 1/1 unison (D-13), so the 12-tone block renders 13 rows and the Hexany renders 7 rows (matching the established generate-cps 6->7 precedent). The "-> N notes" readout shows the block/extents count (12 / 6); the table shows N+1 rows.
- **Free-text docs URL (D-20):** `https://github.com/xenharmonic-devs/sonic-weave/blob/main/documentation/dsl.md` (the most user-facing stable SonicWeave docs page).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed an unnecessary type assertion in the free-text test**
- **Found during:** Task 2 (generate-sonicweave)
- **Issue:** `Array.from(el.querySelectorAll("a")) as HTMLAnchorElement[]` tripped `@typescript-eslint/no-unnecessary-type-assertion` (querySelectorAll("a") already returns HTMLAnchorElement) — blocked a clean lint pass.
- **Fix:** Dropped the redundant `as HTMLAnchorElement[]`.
- **Files modified:** src/components/__tests__/generate-sonicweave.test.ts
- **Verification:** `eslint` clean on all four files; test still green.
- **Committed in:** `579d12b` (Task 2 commit)

**Note on test row-count assertions:** During GREEN, the initial Fokker test assumed 12 table rows; the genuine kernel Scale is 13 (12 block notes + the adapter's D-13 1/1 unison, exactly the cps 6->7 precedent). The assertions were corrected to 13 to match correct behavior — not a code fix, a test-expectation correction within the same RED/GREEN cycle (no code deviation).

---

**Total deviations:** 1 auto-fixed (1 blocking lint).
**Impact on plan:** No scope creep. The lint fix was a test-only cleanup; all plan behavior shipped as specified.

## Issues Encountered
- **Pre-existing lint errors (out of scope, logged):** `npm run lint` reports 87 `@typescript-eslint/no-unsafe-*` errors, ALL in three pre-existing `npm:`-import files (`src/audio/synth.ts`, `src/components/lattice.ts`, `src/components/scale-compare.ts`) whose library type packages are unresolvable under standalone tsc/eslint in the worktree. They resolve at Framework build time. None are in this plan's six files (all lint-clean). Pre-existing on base commit `df6977a`. Logged to `deferred-items.md`; not fixed (scope boundary).
- **PATTERNS.md absent in worktree:** the plan's `read_first` referenced `07-PATTERNS.md`, an uncommitted local file not carried into the worktree. The plan's embedded `<interfaces>` block + 07-RESEARCH.md Pattern 4 / Pitfall 6 / OQ-2 supplied all needed contracts, so no information was lost.

## Threat Flags
None — both widgets stay within the plan's threat model. The free-text textarea (T-07-10/11) is bounded by the adapter's 8 KB cap + evaluate-on-click + textContent-only error rendering; Fokker inputs (T-07-13) are bounded by defense-in-depth caps on basis/extents/comma count + `fokkerCardinality`'s square/cardinality checks; the docs link (T-07-14) uses `rel="noopener noreferrer"`.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- GEN-08 + GEN-09 widgets ship file-disjoint from Plan 02 (no `generate.md` / `styles.css` touched). **Plan 04 owns:** CSS `@import` wiring (`generate-fokker.css`, `generate-sonicweave.css`) into `src/styles.css` and picker registration in `generate.md` (Fokker -> "Advanced" optgroup; free-text -> a new "SonicWeave" optgroup).
- Both widgets expose `getScale()` + `isTempered()` for the established Send-to serialization (ratios for JI / cents-per-line for tempered).

---
*Phase: 07-sonicweave-adapter-tempered-lattice-free-text*
*Completed: 2026-06-11*
