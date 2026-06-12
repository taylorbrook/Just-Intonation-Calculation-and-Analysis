---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
plan: 06
subsystem: generate-fokker widget
tags: [gap-closure, GEN-08, CR-02, WR-03, WR-04, fokker, bigint]
gap_closure: true
requires:
  - generate-fokker.ts Fokker periodicity-block widget (Plan 07-03)
provides:
  - Extent fields re-rendered on every basis-list change (CR-02 closed)
  - Basis-aware chip cap (6) with a visible status message (WR-03 closed)
  - BigInt-exact comma-ratio validation past 2^53 (WR-04 closed)
affects:
  - src/components/generate-fokker.ts
tech-stack:
  added: []
  patterns:
    - "Dedicated extent host element re-rendered independently of the chip input (avoids dropping in-progress chip value)"
    - "onListChanged callback on makeChipInput to regenerate dependent UI after Add/Remove"
    - "Per-instance cap param on makeChipInput with status-message feedback at the cap"
    - "BigInt validation for arbitrary-magnitude ratio strings (no prime-limit ceiling, per CLAUDE.md)"
key-files:
  created: []
  modified:
    - src/components/generate-fokker.ts
    - src/components/__tests__/generate-fokker.test.ts
decisions:
  - "Used approach (b) from the plan — extract renderExtents() into its own extentsHost element rather than re-running full renderParams() — so the basis chip input is not recreated and an in-progress chip value is never dropped."
  - "Kept the basis setList .slice(0, MAX_BASIS) as defense-in-depth; the cap check now stops the 7th chip with a message before it is pushed, so the slice is no longer the thing that silently eats a chip."
metrics:
  duration: ~12 min
  completed: 2026-06-12
  tasks: 2
  files: 2
  tests_added: 5
---

# Phase 7 Plan 06: Fokker Basis-Chip Extent Re-render + Cap/BigInt Fixes Summary

Closes CR-02 (BLOCKER) and the two adjacent WARNINGs (WR-03, WR-04) in the Fokker periodicity-block widget: adding/removing a basis interval chip now regenerates the per-axis Up/Down extent fields, the basis chip cap is correct (6) with user feedback at the limit, and comma ratios are BigInt-exact past 2^53.

## What Was Built

### Task 1 — Regenerate extent fields on basis-list change (CR-02)
The per-axis Up/Down extent fields were created only inside `renderParams()`, which ran solely on mode-change and initial render. The basis chip Add/Remove handlers called `renderChips()` + `rebuild()` but never re-rendered the extent fields, so:
- A newly added axis had no Up/Down controls (frozen at the `?? 0` defaults — unusable).
- A removed axis left stale extent fields in the DOM writing to the wrong index by position.

Fix (plan approach (b)): extracted the extent-cell construction into a dedicated `renderExtents()` helper that mounts into its own `extentsHost` element, and added an optional `onListChanged?: () => void` callback to `makeChipInput`. The basis chip instance binds `onListChanged` to `renderExtents`; the comma instance leaves it undefined (commas have no extent fields). Both the Add handler and the Remove handler invoke `onListChanged?.()` after `setList` + `renderChips`. Re-rendering only the extent host (not the whole params region) avoids recreating the chip input and dropping any in-progress value.

Result: a new axis gets its own correctly-indexed `fokker-up-${i}` / `fokker-down-${i}` inputs wired to `ups[i]`/`downs[i]`; a removed axis leaves no stale field. The D-12 readout truth flips from partial to satisfied for the basis-chip-add flow.

### Task 2 — Basis-aware cap with status message (WR-03) + BigInt comma validation (WR-04)
- **WR-03:** `makeChipInput` now takes a `cap: number` parameter — `MAX_BASIS` (6) for the basis instance, `MAX_COMMAS` (8) for the comma instance. The Add handler's hardcoded `if (next.length >= MAX_COMMAS) return;` was replaced with `if (next.length >= cap) { status.textContent = \`At most ${cap} ${labelText.toLowerCase()}.\`; return; }`, so hitting the cap surfaces a visible message instead of the basis `.slice(0, MAX_BASIS)` silently swallowing the 7th chip.
- **WR-04:** `parseRatio` now validates and normalizes the captured numerator/denominator digit groups with `BigInt(...)` instead of `parseInt(...)`. A comma ratio whose numerator or denominator exceeds 2^53 is preserved exactly (e.g. `9007199254740993/1` no longer rounds to `...992/1`). The regex shape and trimming are unchanged; the regex already guarantees digit-only groups so `BigInt` cannot throw.

## Tests Added
Five new tests in `generate-fokker.test.ts` (all RED before / GREEN after the fix):
1. CR-02: adding basis `7` grows the extent inputs from 2 axes (4 inputs) to 3 axes (6 inputs); `fokker-up-2`/`fokker-down-2` exist.
2. CR-02: setting `fokker-up-2` to a positive value increases the rendered scale cardinality (table row count and readout) — the new axis is functionally usable.
3. CR-02: removing a basis chip regenerates the extent fields to match the surviving axis count; no stale `fokker-up-1`/`fokker-down-1`; no crash.
4. WR-03: adding a 7th basis chip is rejected at the cap of 6 with a non-empty status message mentioning the limit (not silently swallowed).
5. WR-04: a `>2^53` numerator round-trips through the comma chip label unchanged (BigInt-exact), and the rounded Number value does NOT appear.

## Deviations from Plan

None - plan executed exactly as written. Both acceptable approaches were offered for Task 1; chose (b) per the plan's stated preference (smaller surface for dropped chip-input values).

## Verification

- `npx vitest run src/components/__tests__/generate-fokker.test.ts` — 15 passed (10 pre-existing + 5 new).
- `npx vitest run` — full suite green: 42 files, 559 tests, no regression.
- `npx tsc --noEmit` — no type errors in generate-fokker.
- `grep -n "renderParams\|renderExtents" src/components/generate-fokker.ts` — `renderExtents` reachable from the basis chip add/remove path (passed as `onListChanged`).
- `grep -n "BigInt(" src/components/generate-fokker.ts` — `parseRatio` normalizes with BigInt (no `parseInt` remaining inside the function body).
- Confirmed `parseInt("9007199254740993", 10) → 9007199254740992` (rounding) vs `BigInt → 9007199254740993` (exact), proving the WR-04 test is meaningful.

## Success Criteria

- [x] CR-02 closed: basis-chip add/remove regenerates extent fields; new axes are editable and contribute; removed axes leave no stale fields — verified by 3 tests.
- [x] WR-03/WR-04 closed: basis cap is 6 with a status message; comma ratios are BigInt-exact — verified by 2 tests.
- [x] GEN-08 returns to fully satisfied; the D-12 "live readout updates with inputs (extents product in basis mode)" truth can flip to verified on re-verification.
- [x] No regression: full vitest suite green (559 tests).

## Commits

- `76638eb` — fix(07-06): regenerate Fokker extent fields on basis-list change (CR-02)
- `0e75d61` — fix(07-06): basis-aware chip cap with status message (WR-03) + BigInt comma validation (WR-04)

## Self-Check: PASSED

- FOUND: src/components/generate-fokker.ts
- FOUND: src/components/__tests__/generate-fokker.test.ts
- FOUND commit: 76638eb
- FOUND commit: 0e75d61
