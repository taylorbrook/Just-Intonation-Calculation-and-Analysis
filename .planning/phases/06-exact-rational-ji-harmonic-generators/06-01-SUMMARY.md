---
phase: 06-exact-rational-ji-harmonic-generators
plan: 01
subsystem: math-kernel
tags: [ji, cps, hexany, dekany, eikosany, bigint, generators]
requires:
  - "src/lib/interval.ts (Interval.mul / octaveReduce / fraction.toFraction)"
  - "src/lib/scale.ts (Scale constructor + period contract)"
  - "xen-dev-utils (kCombinations)"
provides:
  - "cps(factors, k, period) — BigInt-exact Combination Product Set kernel (GEN-01)"
affects:
  - "src/components/generate-cps.ts (Plan 06-02 — consumes cps())"
tech-stack:
  added: []
  patterns:
    - "Hand-rolled CPS over xen-dev-utils kCombinations for BigInt ownership (D-12/OQ-4)"
    - "Wilson root-at-lowest-product construction (products / min → tonic 1/1)"
    - "Exact n/d Set-dedupe (Pitfall #1/#6), cents used ONLY as sort/min key"
    - "Defense-in-depth caps BEFORE enumeration (T-06-01)"
key-files:
  created:
    - "src/lib/cps.ts"
    - "src/lib/__tests__/cps.test.ts"
  modified:
    - "src/lib/INVENTORY.md"
decisions:
  - "Root each CPS product at the smallest product (divide by min) before octave-reduce — yields the canonical tonic-rooted Wilson hexany [1/1,7/6,5/4,35/24,5/3,7/4], not the raw-product set."
metrics:
  duration: 3min
  completed: 2026-06-10
  tasks: 2
  files: 3
---

# Phase 6 Plan 01: CPS Kernel Primitive Summary

BigInt-exact `cps(factors, k, period)` Combination Product Set — choose-k subset products rooted at their lowest product (Wilson construction → tonic 1/1), octave-reduced, deduped by exact `n/d`, sorted by cents, period appended. Reproduces the canonical 1-3-5-7 Hexany exactly and the Dekany/Eikosany cardinalities, capped against combinatorial DoS.

## What Was Built

- **`src/lib/cps.ts`** — `export function cps(factors: Interval[], k: number, period = new Interval("2/1")): Scale`. Pure kernel, no DOM/audio. Algorithm: defense-in-depth caps first (`factors.length ∈ [1,12]`, `k ∈ [1, factors.length]`) → `kCombinations(factors, k)` → multiply each subset exactly via `Interval.mul` → root every product at the smallest product (`p.div(min)`) → `octaveReduce(period)` → Set-dedupe on `fraction.toFraction()` → sort by `.cents` → append `period` (D-14).
- **`src/lib/__tests__/cps.test.ts`** — 7 tests: the load-bearing Hexany vector (n/d-string + BigInt `equals` + period assertions), Dekany (11 entries), Eikosany (21 entries), exact coincident-product dedupe (`{1,2,3,6}` k=2), and three RangeError caps (k<1, k>length, length=13).
- **`src/lib/INVENTORY.md`** — new `## Phase 6 entries` section with the `cps` row.

## Verification

- `npx vitest run src/lib/__tests__/cps.test.ts` — 7/7 pass.
- `npx tsc --noEmit` — clean (exit 0).
- `npx eslint src/lib/cps.ts` — clean (exit 0; no xen-dev-utils `Fraction` import, R-01 satisfied).
- Full suite `npx vitest run` — 396/396 pass, no regressions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CPS products must be rooted at the lowest product (Wilson construction)**
- **Found during:** Task 2 (GREEN) — the first implementation followed the plan's literal step list (multiply subset → octave-reduce → dedupe → sort → append period) and produced the RAW-product set `[1/1,5/4,21/16,3/2,7/4,15/8,2/1]`, which contains no tonic relationship to the canonical vector and fails the load-bearing Hexany assertion.
- **Issue:** The canonical 1-3-5-7 Hexany `[1/1,7/6,5/4,35/24,5/3,7/4]` is the set of subset products NORMALIZED so the smallest product becomes the tonic (1/1) — the standard Wilson CPS construction (dyads between the products). The plan's pseudo-step list omitted the root-at-min step.
- **Fix:** After multiplying each subset, find the minimum product (by `.cents`, used only as a comparison key — Pitfall #1 honored), divide every product by it, then octave-reduce. This is BigInt-exact (`Interval.div`). Confirmed the normalized construction reproduces all three preset cardinalities (Hexany 6, Dekany 10, Eikosany 20) and the exact Hexany vector.
- **Files modified:** src/lib/cps.ts (header doc + algorithm)
- **Commit:** 95901dd

## Decisions Made

- **Root-at-lowest-product (Wilson construction):** divide every subset product by the smallest product before octave-reduction. This is what makes the result a tonic-rooted CPS containing 1/1 and matching the research-verified canonical vectors, rather than a floating set of raw products.
- **`.cents` as the min-selection key:** the minimum product is found by cents comparison (a pure ordering key); the actual division and dedupe stay BigInt-exact. Equal-valued products resolve to the same exact ratio so the min tie-break is irrelevant.

## Threat Surface

Both `mitigate` dispositions from the plan's threat register are implemented:
- **T-06-01 (DoS):** `MAX_FACTORS = 12` and `1 ≤ k ≤ factors.length` enforced with RangeError BEFORE `kCombinations` is called. Tested (length=13, k=0, k>length all throw).
- **T-06-02 (exact-rational integrity):** dedupe keyed strictly on `fraction.toFraction()` (`n/d`); no float path. The only float is `iv.cents` used as a sort/min key. Tested via the coincident-product case (no duplicate n/d survives).

No new security surface beyond the plan's threat model. No new dependencies (T-06-SC: `xen-dev-utils` already in the stack).

## Known Stubs

None — `cps()` is a complete, fully-wired kernel primitive with no placeholder data paths.

## Self-Check: PASSED

- FOUND: src/lib/cps.ts
- FOUND: src/lib/__tests__/cps.test.ts
- FOUND: src/lib/INVENTORY.md (cps row under Phase 6 section)
- FOUND commit 9786a5e (test — RED)
- FOUND commit 95901dd (feat — GREEN)

## TDD Gate Compliance

- RED gate: `9786a5e` `test(06-01): add failing CPS verified-vector test` (confirmed failing — module absent).
- GREEN gate: `95901dd` `feat(06-01): implement BigInt-exact CPS kernel (GEN-01)` (all 7 tests pass).
- REFACTOR: not needed — implementation was clean at GREEN.
