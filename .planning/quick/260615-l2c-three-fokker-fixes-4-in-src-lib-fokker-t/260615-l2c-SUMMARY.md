---
phase: quick-260615-l2c
plan: 01
subsystem: fokker-periodicity-block
tags: [fokker, tuning, periodicity-block, subgroup, rank, clamp, defense-in-depth]
requires: [src/lib/fokker.ts, src/components/generate-fokker.ts]
provides:
  - "fokker.ts drop-zero-column/rank gate + exported reducedSubspaceMatrix helper"
  - "generate-fokker.ts subgroup-aware commaToParallelotopeSource, MAX_CARDINALITY basis cap, clamped extent fields"
affects: [GEN-08, Fokker widget comma mode, Fokker widget basis mode]
tech-stack:
  added: []
  patterns: ["shared reduced-subspace helper consumed by kernel + component (no drift)", "defense-in-depth cardinality cap mirrors comma mode", "clamp write-back on number-input edit"]
key-files:
  created: []
  modified:
    - src/lib/fokker.ts
    - src/components/generate-fokker.ts
    - src/lib/__tests__/fokker.test.ts
    - src/components/__tests__/generate-fokker.test.ts
decisions:
  - "Surviving prime columns are keyed by ORIGINAL monzo index (PRIMES[idx]) so the component recovers the basis primes unambiguously ([3,7] for the 2.3.7 subgroup)."
  - "A lone 128/125 is now a VALID {5}-subgroup block (|det|=3) under the new gate; updated the degenerate-set component test to use the genuinely under-determined 81/80+225/224 instead."
metrics:
  duration: ~7min
  completed: 2026-06-15
---

# Quick Task 260615-l2c: Three Fokker Fixes Summary

Drop-zero-column/rank gate that accepts legitimate JI subgroup periodicity blocks (64/63+2401/2187 → 15), a MAX_CARDINALITY cap closing the basis-mode DoS gap, and a MAX_EXTENT clamp that the extent fields now visibly reflect — all regression-averse, with the whole suite green.

## What Changed

### Task 1 — Fix #4: drop-zero-column/rank gate + subgroup-aware bridge (commit 6627451)
- **fokker.ts:** Replaced the `subWidth = width − 1` squareness gate with a drop-zero-columns/rank gate. Added and exported `reducedSubspaceMatrix(commaStrings)` — builds full monzos, drops the prime-2 column, then drops every all-zero prime column, returning the reduced `bigint[][]` square matrix plus `survivingMonzoIndices` (ORIGINAL monzo positions, so `PRIMES[idx]` recovers the prime). `fokkerCardinality` now validates `commaStrings.length === reducedWidth` and computes `|det|` via `integerDet` on the reduced matrix (exact BigInt, Number coercion only for the final `Math.abs`). Doc-comment rewritten to describe the new gate with the 2.3.7 example and the 81/80+225/224 counter-example.
- **generate-fokker.ts:** `commaToParallelotopeSource` now consumes the SAME shared helper — basis = `survivingMonzoIndices.map(idx => PRIMES[idx])` (e.g. `[3,7]`), HNF over the reduced square matrix, one up-extent per surviving prime. Removed the now-unused `toMonzo` import (kept `hnf`). R-01 honored.
- **Behavior:** `64/63+2401/2187` → 15 (was wrongly rejected); `81/80+225/224` → RangeError (still rejected — fix did not over-reach); `81/80+128/125` → 12 (unchanged).

### Task 2 — Fix #3: MAX_CARDINALITY cap on basis mode (commit e44a332)
- **generate-fokker.ts:** Added `MAX_CARDINALITY = 1000` to the caps block. In `composeSource`'s basis branch, after the readout update and the `basis.length === 0` guard, `if (product > MAX_CARDINALITY)` sets a status message naming the cap and the product, then returns null (no enumeration, prior preview preserved). Mirrors comma mode's existing `fokkerCardinality` cap (T-l2c-01). Comma branch untouched.

### Task 3 — Fix (low): extent fields reflect the MAX_EXTENT clamp (commit 16abb14)
- **generate-fokker.ts:** `renderExtents` now seeds each Up/Down field with `Math.max(0, Math.min(MAX_EXTENT, ups[i] ?? 0))` (and the `downs` equivalent). `makeIntField`'s input listener writes back `input.value = String(Math.max(0, Math.min(MAX_EXTENT, parsed)))` after `onInput`/`rebuild`, so a typed 99 visibly snaps to 24. Transient-empty-edit early return, field order, and the `rebuild()` trigger are unchanged.

## Verification Results

| Gate | Result |
|------|--------|
| Task 1: `vitest run` fokker.test.ts + generate-fokker.test.ts | 23 passed |
| Task 1: `tsc --noEmit` | clean |
| Task 2: `vitest run` generate-fokker.test.ts | 17 passed |
| Task 2: `tsc --noEmit` | clean |
| Task 3: `vitest run` generate-fokker.test.ts | 18 passed |
| Task 3: `tsc --noEmit` | clean |
| **Full suite `npx vitest run`** | **708 passed (50 files), 0 failed** |
| **Final `npx tsc --noEmit`** | **clean** |
| R-01 (no `Fraction` import) | honored — fokker.ts imports `toMonzo`/`integerDet`, generate-fokker.ts imports `hnf` only |

## Behavioral spot-checks (pinned by tests)
- `64/63 + 2401/2187` → 15 (kernel `fokkerCardinality` + component comma-mode 16-row enumeration).
- `81/80 + 225/224` → RangeError (over-reach regression guard, kernel + component degenerate-set test).
- `81/80 + 128/125` → 12 (kernel + default landing, unchanged).
- helper surviving-primes: `[3,5]` for the 5-limit block, `[3,7]` for the 2.3.7 subgroup (reduced matrix `[[-2,-1],[-7,4]]`).
- basis product `16250 > 1000` → status names the 1000 cap, no oversized enumeration.
- typed `99` in an extent field → field value `24`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test assumption invalidated by the fix] Updated the degenerate-set component test**
- **Found during:** Task 1
- **Issue:** The existing test "a non-square comma set leaves the widget non-crashing" removed ONE comma from the default `81/80 + 128/125`, asserting the remainder was non-square and that the prior 13-row preview survived. Under the new drop-zero-column gate the remaining lone comma (`128/125`) is now a VALID `{5}`-subgroup block (`|det| = 3`), so the widget correctly re-renders a 4-row preview instead of rejecting — the old assumption no longer holds.
- **Fix:** Renamed the test to "a degenerate (under-determined) comma set …" and drove it with `81/80 + 225/224` (rank-2 over 3 live primes — still genuinely under-determined → RangeError). Relaxed the final assertion from `toBe(rowsBefore = 13)` to "table not cleared / non-empty" (intermediate valid sub-sets legitimately re-render the preview, so an exact-13 assertion is no longer correct), while still pinning `rowsBefore === 13` and that a status/readout message surfaces.
- **Files modified:** src/components/__tests__/generate-fokker.test.ts
- **Commit:** 6627451
- **Why it's safe:** This is the intended consequence of Fix #4 (accepting valid subgroup blocks), not a regression. The test's real intent — no crash, message surfaced, preview preserved — is retained.

## Self-Check: PASSED
- src/lib/fokker.ts — FOUND (reducedSubspaceMatrix exported, new gate in place)
- src/components/generate-fokker.ts — FOUND (MAX_CARDINALITY, subgroup bridge, clamped fields)
- src/lib/__tests__/fokker.test.ts — FOUND (subgroup-accept + over-reach-reject + helper pins)
- src/components/__tests__/generate-fokker.test.ts — FOUND (16-row enumeration, over-cap, clamp tests)
- Commit 6627451 (Task 1) — FOUND in git log
- Commit e44a332 (Task 2) — FOUND in git log
- Commit 16abb14 (Task 3) — FOUND in git log
