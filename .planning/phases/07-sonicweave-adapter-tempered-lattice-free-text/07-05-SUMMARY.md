---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
plan: 05
subsystem: sonicweave-adapter
tags: [gap-closure, rank2, adapter, sign-guard, GEN-06]
requires:
  - "scaleFromSonicWeave adapter (07-01)"
  - "generateRank2 widget (07-02)"
provides:
  - "Rank-2 POTE/TE/CTE source composed from the preset generator (genN/genD)"
  - "Adapter sign/zero guard — fails closed on non-positive intervals"
affects:
  - "GEN-06 (rank-2 regular temperament — restored to fully satisfied)"
  - "GEN-09 (free-text adapter — hardened against sign laundering)"
tech-stack:
  added: []
  patterns:
    - "Sign/zero discrimination via SonicWeave fraction f.s (sign field), with type-agnostic zero detection"
key-files:
  created: []
  modified:
    - src/components/generate-rank2.ts
    - src/components/__tests__/generate-rank2.test.ts
    - src/lib/sonicweave.ts
    - src/lib/__tests__/sonicweave.test.ts
decisions:
  - "Zero detection uses Number(f.n) === 0, not the blueprint's strict f.n === 0n — SonicWeave's toFraction() returns runtime Numbers, not BigInts, so === 0n silently missed the zero interval"
metrics:
  duration: ~12m
  completed: 2026-06-11
  tasks: 2
  files: 4
---

# Phase 07 Plan 05: Rank-2 Preset Generator + Adapter Sign Guard Summary

Fix CR-01 (rank-2 POTE/TE/CTE hardcoded generator 3/2) so Magic/Hanson build their documented third-chains, and harden the adapter's R-01 round-trip (WR-01/WR-02) to fail closed on negative and zero intervals instead of laundering the sign or emitting -Infinity cents.

## What Was Built

### Task 1 — composeSource() POTE/TE/CTE uses the preset generator (CR-01)
The rank-2 widget's `composeSource()` POTE/TE/CTE branch previously emitted `rank2(3/2, up, down)` regardless of the selected preset, so the Magic (5/4) and Hanson (6/5) presets — and any custom generator — silently produced a tempered chain of fifths. The Generator field displayed `5/4` while the scale was built from `3/2`. Replaced the hardcoded `3/2` with a `gen` token derived from the closure-local `genN`/`genD` (built exactly as the `pure` branch does), so the displayed Generator and produced scale now agree. Also corrected the stale `3/2` literal in the module-header tuning map.

- Magic (POTE) now renders the 5/4 third-chain: second degree ≈59.8¢ (was the 3/2 chain's ≈200.6¢).
- Hanson (POTE) now renders the 6/5 minor-third-chain: second degree ≈68.0¢ (was ≈204.1¢).

### Task 2 — adapter guard against non-positive intervals (WR-01/WR-02)
`scaleFromSonicWeave`'s exact-rational round-trip used `${f.n}/${f.d}`, which drops the sign (fraction.js v5 / SonicWeave keep n/d non-negative with the sign in `f.s`) and admits the zero interval. A free-text `-3/2` was laundered to `3/2`; `0/1` produced `-Infinity` cents that flowed into the scale table and a 0 Hz playback frequency. Added a guard before constructing the kernel `Interval`: `if (f.s < 0n || Number(f.n) === 0)` → structured error `"Scale contains a non-positive interval."`. This also neutralizes WR-06 (a custom negative rank-2 generator now surfaces a real adapter error).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zero-interval guard used the wrong runtime type comparison**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** The plan's prescribed guard `if (f.s < 0n || f.n === 0n)` did NOT catch the zero interval. The plan's interface note asserted `f.n`/`f.s` are non-negative BigInts, but at runtime SonicWeave's `iv.toFraction()` returns these fields as JavaScript **Numbers** (verified empirically: `typeof f.n === "number"`, value `0`). The strict comparison `f.n === 0n` is `0 === 0n` → `false`, so `0/1` slipped through and the WR-02 test stayed red after the planned fix.
- **Fix:** Changed the zero test to `Number(f.n) === 0` (type-agnostic). Kept `f.s < 0n` for the negative case — `number < bigint` coerces correctly, and it preserves the plan's required `f.s` discriminator pattern. Added a code comment documenting the runtime-type reality so the next reader doesn't reintroduce the strict `=== 0n`.
- **Files modified:** src/lib/sonicweave.ts
- **Commit:** e66e385

## Tasks

| Task | Name | Commits | Files |
| ---- | ---- | ------- | ----- |
| 1 (RED) | Failing CR-01 tests for Magic/Hanson preset generator | c2b9218 | src/components/__tests__/generate-rank2.test.ts |
| 1 (GREEN) | composeSource() POTE/TE/CTE uses preset generator | 92ecb0a | src/components/generate-rank2.ts |
| 2 (RED) | Failing WR-01/WR-02 tests for non-positive intervals | a7ca885 | src/lib/__tests__/sonicweave.test.ts |
| 2 (GREEN) | Adapter sign/zero guard | e66e385 | src/lib/sonicweave.ts |

## Verification

- `npx vitest run` — full suite green: **559/559** (was 554 baseline + 5 new tests, no regressions).
- `grep -n "rank2(3/2" src/components/generate-rank2.ts` — **zero matches** (hardcoded generator gone).
- `grep -n "f.s" src/lib/sonicweave.ts` — non-positive guard present (line 130).
- `npx tsc --noEmit` on the two modified files — **clean** (no new errors). Pre-existing out-of-scope `tsc` errors remain in `synth.ts`/`lattice.ts`/`scale-compare.ts` from the `npm:` import convention and a prior implicit-any; untouched by this plan.

## Acceptance Criteria

- [x] CR-01 closed: Magic/Hanson POTE/TE/CTE renders use the preset generator (genN/genD), verified by tests asserting the 5/4 (≈59.8¢) and 6/5 (≈68.0¢) chains rather than the 3/2 chain.
- [x] WR-01/WR-02 closed: the adapter returns a structured error for negative and zero intervals.
- [x] GEN-06 returns to fully satisfiable; the verification truth "POTE/TE/CTE render tempered" flips from FAILED to satisfied for Magic/Hanson.
- [x] No regression: full vitest suite green; the pre-existing "selecting POTE re-renders tempered" test remains green.

## TDD Gate Compliance

Both tasks followed RED → GREEN. Git log shows, per task: a `test(07-05): …` RED commit (c2b9218, a7ca885) followed by a `fix(07-05): …` GREEN commit (92ecb0a, e66e385). RED was empirically confirmed failing against the unpatched code before each fix. No REFACTOR commits were needed (both fixes were minimal and clean).

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or trust-boundary schema changes. Both changes harden existing surface (the sign guard strictly narrows what the adapter accepts).
