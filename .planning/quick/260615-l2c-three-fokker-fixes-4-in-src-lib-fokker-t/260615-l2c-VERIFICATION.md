---
phase: quick-260615-l2c
verified: 2026-06-15T15:30:30Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
---

# Quick Task 260615-l2c: Three Fokker Fixes Verification Report

**Task Goal:** Replace fokker.ts squareness gate with drop-zero-column/rank check (Fix #4); cap basis-mode cardinality at MAX_CARDINALITY (Fix #3); clamp extent fields' visible value (Fix low).
**Verified:** 2026-06-15T15:30:30Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `fokkerCardinality(["64/63","2401/2187"]) === 15` | VERIFIED | `fokker.test.ts` line 14: `expect(fokkerCardinality(["64/63","2401/2187"])).toBe(15)` — passes. `fokker.ts` lines 140–151: `reducedSubspaceMatrix` drops prime-5 all-zero column, leaving `[[-2,-1],[-7,4]]`, `integerDet` yields 15. |
| 2 | `fokkerCardinality(["81/80","225/224"])` throws RangeError | VERIFIED | `fokker.test.ts` line 21: `expect(() => fokkerCardinality(["81/80","225/224"])).toThrow(RangeError)` — passes. Rows over (3,5,7) = `[[4,-1,0],[2,2,-1]]`; prime-5 and prime-7 columns both non-zero → no droppable column → 2 commas ≠ 3 surviving primes → RangeError at `fokker.ts` line 142–147. Fix did not over-reach. |
| 3 | `fokkerCardinality(["81/80","128/125"]) === 12` | VERIFIED | `fokker.test.ts` line 6: `expect(fokkerCardinality(["81/80","128/125"])).toBe(12)` — passes. Classic 5-limit block unchanged; prime-7 column all-zero, dropped; `[[4,-1],[0,-3]]` → `\|det\|` = 12. |
| 4 | `commaToParallelotopeSource(["64/63","2401/2187"])` emits [3,7]-basis parallelotope → 15 notes | VERIFIED | `generate-fokker.ts` lines 143–152: calls `reducedSubspaceMatrix`, maps `survivingMonzoIndices.map((idx) => PRIMES[idx]!)` — for indices [1,3] recovers `[3,7]`. Component test line 93–131 (generate-fokker.test.ts): 16 rows (15 block notes + 1/1 unison) — passes. |
| 5 | Basis mode product > MAX_CARDINALITY (1000) → status message + null | VERIFIED | `generate-fokker.ts` lines 485–488: `if (product > MAX_CARDINALITY)` sets `status.textContent` naming cap and product, returns null. `MAX_CARDINALITY = 1000` declared at line 85. Component test lines 344–378 drives product to 16250, asserts status contains "1000" and table not re-rendered to 16250 rows — passes. |
| 6 | Up/Down extent fields display clamped value (typing 99 → shows 24) | VERIFIED | `generate-fokker.ts` line 269 (makeIntField listener): `input.value = String(Math.max(0, Math.min(MAX_EXTENT, parsed)))`. `renderExtents` seeds with `Math.max(0, Math.min(MAX_EXTENT, ups[i] ?? 0))` at lines 397/408. Component test lines 381–392: `up.value = "99"`, dispatch input, assert `up.value === "24"` — passes. |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/fokker.ts` | rank/drop-zero-column gate + exported `reducedSubspaceMatrix` | VERIFIED | `reducedSubspaceMatrix` exported at line 84; gate in `fokkerCardinality` at lines 140–147; imports only `toMonzo, integerDet` (R-01 honored — no `Fraction`). |
| `src/components/generate-fokker.ts` | subgroup-aware `commaToParallelotopeSource`, `MAX_CARDINALITY` basis cap, clamped extent fields | VERIFIED | `MAX_CARDINALITY = 1000` at line 85; basis-cap guard at lines 485–488; clamp write-back at line 269; renderExtents seeds with clamped values at lines 397–410. |
| `src/lib/__tests__/fokker.test.ts` | 64/63+2401/2187 → 15 acceptance + 81/80+225/224 rejection regression guard | VERIFIED | `"2401/2187"` appears in tests at lines 14 and 34; `"225/224"` rejection guard at line 21; helper `survivingMonzoIndices` pins at lines 26–41. |
| `src/components/__tests__/generate-fokker.test.ts` | comma-mode 64/63+2401/2187 → 15 enumeration + basis over-cap returns-null test | VERIFIED | `"MAX_CARDINALITY"` referenced in test comment at line 344; over-cap test asserts status contains "1000" at line 374; 64/63+2401/2187 enumeration test at lines 93–131 asserts 16 rows. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `generate-fokker.ts:commaToParallelotopeSource` | `fokker.ts:reducedSubspaceMatrix` | import + call at lines 47, 143 | WIRED | `import { fokkerCardinality, reducedSubspaceMatrix } from "../lib/fokker.js"` at line 47; called at line 143 inside `commaToParallelotopeSource`. |
| `generate-fokker.ts:composeSource basis branch` | `MAX_CARDINALITY` | `product > MAX_CARDINALITY` guard at line 485 | WIRED | Constant declared at line 85, consumed in basis branch at line 485 before returning the parallelotope source. |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase delivers pure logic (gate, cap, clamp) with no data-source rendering. All behaviors are fully observable through unit tests and code inspection.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 25 fokker + generate-fokker tests | `npx vitest run src/lib/__tests__/fokker.test.ts src/components/__tests__/generate-fokker.test.ts` | 25 passed, 0 failed | PASS |
| TypeScript strict check | `npx tsc --noEmit` | No output (clean) | PASS |

---

### Deviation Assessment: Retargeted Component Test

The SUMMARY documents that the pre-existing "non-square comma set" test was retargeted from removing one comma from `81/80 + 128/125` to using `81/80 + 225/224` instead.

**Verdict: Correct consequence of the approved design, not a masked regression.**

Under the new drop-zero-column gate, a lone `128/125` is a valid `{5}`-subgroup block (`|det|` = 3, prime-3 column all-zero, prime-5 column survives) — the old test's premise became false because the fix correctly accepted a previously-rejected valid block. The replacement test uses `81/80 + 225/224` (rank-2 over 3 live primes: (3,5,7) all non-zero, no droppable column), which remains genuinely under-determined. The test's actual intent — no crash, message surfaced, table not cleared — is fully preserved in the retargeted form (`generate-fokker.test.ts` lines 133–177). The assertion was relaxed from `rowsAfter === 13` (fragile: intermediate valid sub-sets can legitimately re-render) to `rowsAfter > 0` (intent: prior preview not wiped), which is correct behavior.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| GEN-08 | 260615-l2c-PLAN.md | Fokker periodicity-block widget | SATISFIED | All three fixes (kernel gate, basis cap, extent clamp) verified in code and tests. |

---

### Anti-Patterns Found

No `TBD`, `FIXME`, `XXX`, `HACK`, `PLACEHOLDER`, or stub patterns found in any modified file. No `return null` / `return []` / `return {}` stubs without legitimate logic. The `return null` in `composeSource` is a documented, tested early-exit path (not a stub). All `Math.max(0, Math.min(MAX_EXTENT, ...))` patterns are functional clamps, not empty initializers.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

---

### R-01 Verification

`src/lib/fokker.ts` imports only `toMonzo, integerDet` from `xen-dev-utils` (line 52). No `Fraction` import. Determinant is exact via `integerDet` on `bigint[][]`; `Number()` coercion only at the final `Math.abs(...)` readout (line 151). Confirmed.

`src/components/generate-fokker.ts` imports `hnf` from `xen-dev-utils` (line 51). No `Fraction` import. The `toMonzo` import was removed when the component was updated to consume the shared helper directly. Confirmed.

---

### Human Verification Required

None. All six must-have truths are verifiable by code inspection and automated tests.

---

### Gaps Summary

No gaps. All six must-have truths verified. All artifacts substantive and wired. R-01 honored. 25 targeted tests pass. `tsc --noEmit` clean. The one documented deviation (retargeted component test) is a correct consequence of the approved fix, not a regression.

---

_Verified: 2026-06-15T15:30:30Z_
_Verifier: Claude (gsd-verifier)_
