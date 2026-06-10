---
phase: 06-exact-rational-ji-harmonic-generators
plan: 03
subsystem: math-kernel
tags: [ji, diamond, odd-limit, prime-limit, farey, edo, ed-n, tempered, bigint, generators]
requires:
  - "src/lib/diamond.ts (enumerateDiamond — REUSED, not re-derived)"
  - "src/lib/monzo.ts (oddLimit, primeLimitOfMonzo ceiling tests)"
  - "src/lib/cents.ts (centsToRatio — tempered EDO projection)"
  - "src/lib/interval.ts (Interval + octaveReduce + fraction.toFraction)"
  - "src/lib/scale.ts (Scale constructor + period contract)"
provides:
  - "diamondScale(oddLimit) — tonality diamond as an exact JI Scale (GEN-04)"
  - "oddLimitSet(limit) — exact reduced i/j in [1,2) with oddLimit ≤ limit (GEN-04)"
  - "primeLimitSet(limit) — bounded prime-limit analog (GEN-04)"
  - "fareyScale(order) — Farey sequence of order N in [1,2) (GEN-04)"
  - "edScale(divisions, equave) — TEMPERED equal division of any equave (GEN-05, SURF-06)"
affects:
  - "src/components (Plan 06-07 — consumes the five builders; flags edScale tempered, cents-only)"
tech-stack:
  added: []
  patterns:
    - "REUSE-over-rebuild: diamondScale calls enumerateDiamond (no duplicate diamond math)"
    - "Exact n/d Set-dedupe (Pitfall #1/#6); cents used ONLY as a sort key"
    - "Period-coherent foldExactSet (reduction bound === appended period)"
    - "TEMPERED construction: cents is source of truth via centsToRatio, never an exact ratio of record (SURF-06)"
    - "Defense-in-depth integer caps BEFORE enumeration (T-06-05)"
key-files:
  created:
    - "src/lib/generators.ts"
    - "src/lib/__tests__/generators.test.ts"
  modified:
    - "src/lib/INVENTORY.md"
decisions:
  - "primeLimitSet enumerates a BOUNDED integer grid (PRIME_SET_HEIGHT = 81) because the prime-limit set is infinite in principle; the test asserts the prime-limit predicate + canonical membership, NOT a full-set vector."
  - "foldExactSet takes the period as a parameter so the [1, period) reduction bound and the appended period interval always stay coherent (closes a latent inconsistency where a non-2/1 period would reduce to [1, period) but pin a 2/1 Scale)."
  - "edScale passes the EXACT equave as the Scale.period even though the pitches are tempered cents-derived approximations — the period of record stays exact; only the interior pitches are tempered (SURF-06)."
metrics:
  duration: 4min
  completed: 2026-06-10
  tasks: 2
  files: 3
---

# Phase 6 Plan 03: JI-Set + Tempered Generator Family Summary

Five builders in one `generators.ts`: four EXACT JI-set constructors (`diamondScale`,
`oddLimitSet`, `primeLimitSet`, `fareyScale` — GEN-04) plus `edScale` (GEN-05) — the
FIRST tempered family that establishes the "tempered, not laundered JI" representation
(SURF-06). The JI sets are BigInt-exact, deduped by exact `n/d`, octave-pinned;
`edScale` is fundamentally different — cents is the source of truth, projected to a ratio
only via `centsToRatio` at the float boundary, and the tests assert CENTS, never ratios.
`diamondScale` REUSES `enumerateDiamond` rather than re-deriving the diamond.

## What Was Built

- **`src/lib/generators.ts`** — five exported builders:
  - `diamondScale(oddLimitN)` — calls `enumerateDiamond(oddLimitN, throwawayScale)`, collects the unique octave-reduced `cell.ratio` values (ignoring the throwaway `inScale` flag), exact-`n/d` Set-dedupes, sorts by cents, appends 2/1. `diamondScale(7)` reproduces the 13-member 7-limit diamond + period. The oddLimit cap (≤ 1023) is propagated from `enumerateDiamond` (REUSE — does NOT re-derive the diamond).
  - `oddLimitSet(limit, period = 2/1)` — enumerates i,j ≤ limit, octave-reduces, keeps members whose `oddLimit(monzo) ≤ limit`, exact-`n/d` dedupes, sorts, appends the period. `oddLimitSet(9)` = 19 ratios + 2/1.
  - `primeLimitSet(limit, period = 2/1)` — analog over a BOUNDED integer grid (`PRIME_SET_HEIGHT = 81`) using `primeLimitOfMonzo(monzo) ≤ limit`. Bounded because the prime-limit set is infinite in principle.
  - `fareyScale(order)` — pure integer enumeration of reduced a/b with `b ≤ order` and `b ≤ a < 2b` (i.e. value in [1, 2)); fraction.js auto-reduces, Set-dedupe drops non-reduced dups. Intrinsically octave-bound, so NO period param. `fareyScale(8)` = 22 ratios + 2/1.
  - `edScale(divisions, equave)` — TEMPERED. step cents = `(k/divisions)*equave.cents` for k in 0..divisions; each pitch is `new Interval(centsToRatio(stepCents))` (cents is the source of truth, the ratio is the lossy projection — Pitfall #1). The EXACT equave is passed as the Scale period. `edScale(12, 2/1)` → cents `[0,100,…,1200]`; `edScale(13, 3/1)` → Bohlen-Pierce ED3.
  - Shared `foldExactSet(intervals, period)` helper: Set-dedupe by exact `fraction.toFraction()` → sort by cents → append the (coherent) period (D-07/D-14).
- **`src/lib/__tests__/generators.test.ts`** — 15 tests: exact-vector assertions for `diamondScale(7)`, `oddLimitSet(9)/(5)`, `fareyScale(8)/(5)`; predicate + membership assertions for `primeLimitSet(5)/(3)` (with an explicit `7/4 must NOT appear` negative); the load-bearing `edScale(12, 2/1)` and `edScale(13, 3/1)` CENTS assertions (`toBeCloseTo(k*step, …)`, with a comment that asserting ratios for a tempered scale is FORBIDDEN — Pitfall #1); the full RangeError cap matrix.
- **`src/lib/INVENTORY.md`** — new `### Phase 6 — JI-set + tempered family` subsection with one row per builder (the `edScale` row carries the verbatim tempered caveat: cents is the source of truth, no exact ratio of record, flagged tempered by the component per D-03).

## Verification

- `npx vitest run src/lib/__tests__/generators.test.ts` — 15/15 pass.
- `npx tsc --noEmit` — clean (exit 0).
- `npx eslint src/lib/generators.ts` — clean (no errors; the `.eslintignore` deprecation warning is pre-existing repo-wide noise).
- Full suite `npx vitest run` — 451/451 pass, no regressions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `fareyScale` had a dead `period` parameter; reduction bound / appended period could diverge in the limit-set builders**
- **Found during:** Task 2 (GREEN) — `npx eslint` flagged `'period' is assigned a value but never used` on `fareyScale`. Investigating the shared `foldExactSet` revealed it always pinned a hard-coded 2/1, so the `period` parameter on `oddLimitSet`/`primeLimitSet` reduced members into [1, period) but the Scale was always pinned to 2/1 — a latent inconsistency for any non-octave period.
- **Issue:** (a) `fareyScale`'s `period` param was genuinely unused (Farey is octave-bound by construction). (b) `foldExactSet` hard-coded 2/1 instead of honoring the caller's equave, so the reduction bound and the appended period could diverge.
- **Fix:** Removed the unused `period` param from `fareyScale` (documented as intrinsically octave-bound). Parameterized `foldExactSet(intervals, period)` so the reduction bound and the appended period are always the same equave; `oddLimitSet`/`primeLimitSet` pass their `period`, `diamondScale`/`fareyScale` pass 2/1 (octave-bound by definition).
- **Files modified:** src/lib/generators.ts
- **Commit:** 52928e4 (folded into GREEN — a correctness fix, not post-green cleanup)

## Decisions Made

- **`primeLimitSet` enumerates a bounded integer grid (`PRIME_SET_HEIGHT = 81`)** — the prime-limit set is infinite in principle (e.g. Pythagorean 3-limit chains never terminate), so a finite, deterministic grid is the only well-defined kernel result. The test asserts the prime-limit predicate (`primeLimitOfMonzo ≤ limit` for every member) + canonical membership + a negative (`7/4` absent at limit 5), NOT a full-set vector. The grid covers the common 5-limit / Pythagorean staples.
- **`foldExactSet` takes the period as a parameter** (see deviation 1) — keeps the [1, period) reduction bound coherent with the appended period interval.
- **`edScale` passes the EXACT equave as `Scale.period`** — the pitches are tempered cents-derived approximations, but the period of record stays the true exact equave; only the interior pitches are tempered (SURF-06). Scale's own `period > 1/1` guard is a second line of defense behind edScale's explicit equave check.

## Threat Surface

All three `mitigate` dispositions from the plan's threat register are implemented:
- **T-06-05 (DoS):** `LIMIT_CAP = 31` (oddLimitSet / primeLimitSet), `MAX_FAREY_ORDER = 1000`, `MAX_DIVISIONS = 1000` (edScale) — RangeError BEFORE any enumeration loop. `diamondScale` propagates `enumerateDiamond`'s oddLimit ≤ 1023 cap. Tested: limit 33/0, order 2000/0, divisions 2000/0, equave 1/1, diamond 2000 all throw.
- **T-06-06 (laundered JI):** `edScale` builds from cents via `centsToRatio` and is flagged tempered downstream (D-03 — no `tempered` field on Interval/Scale); the tests assert CENTS, never ratios — no float ratio is ever presented as exact JI (SURF-06).
- **T-06-07 (exact-rational integrity):** diamond/odd/prime/Farey dedupe by exact `fraction.toFraction()` Set key — never cents tolerance (Pitfall #1/#6). The only float in the JI builders is `iv.cents`, used solely as a sort key.

No new security surface beyond the plan's threat model. No new dependencies (T-06-SC: reuses existing kernel modules — `diamond.ts`, `monzo.ts`, `cents.ts`, `interval.ts`, `scale.ts`; no npm install).

## Known Stubs

None — all five builders are complete, fully-wired kernel primitives with no placeholder data paths.

## Self-Check: PASSED

- FOUND: src/lib/generators.ts
- FOUND: src/lib/__tests__/generators.test.ts
- FOUND: src/lib/INVENTORY.md (five generator rows under Phase 6 section)
- FOUND commit 666b5fa (test — RED)
- FOUND commit 52928e4 (feat — GREEN)

## TDD Gate Compliance

- RED gate: `666b5fa` `test(06-03): add failing generators verified-vector tests` (confirmed failing — `generators.js` unresolvable).
- GREEN gate: `52928e4` `feat(06-03): implement JI-set + tempered generators (GEN-04, GEN-05, SURF-06)` (all 15 tests pass; full suite 451/451).
- REFACTOR: not needed — the `foldExactSet` period-coherence fix was folded into GREEN (a correctness fix, not post-green cleanup).
