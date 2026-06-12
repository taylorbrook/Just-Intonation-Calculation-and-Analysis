---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
verified: 2026-06-12T07:05:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 7/9
  gaps_closed:
    - "CR-01: POTE/TE/CTE source now uses preset genN/genD (Magic 5/4, Hanson 6/5) — hardcoded 3/2 gone"
    - "CR-02: Fokker basis chip Add/Remove now calls renderExtents() via onListChanged — new axes have editable Up/Down fields"
    - "WR-01/WR-02: adapter sign/zero guard on R-01 round-trip — negative and zero intervals fail closed"
    - "WR-03: basis chip cap is now MAX_BASIS (6) with visible status message"
    - "WR-04: parseRatio uses BigInt — comma ratios past 2^53 preserved exactly"
    - "CR-01 (re-review): adapter STEP 3 mapping loop now wrapped in per-interval try/catch with Number.isFinite guard on the cents projection (commit 295afaa); regression tests for 3^45, 3^53/2^84 (Mercator), 1228801. all return structured errors — never-throws contract restored"
  gaps_remaining: []
  regressions: []
gaps: []
---

# Phase 7: SonicWeave Adapter + Tempered Lattice + Free-Text — Re-Verification Report

**Phase Goal:** The genuinely advanced methods (rank-2 with optimal tunings, well-temperaments, Fokker periodicity blocks) ship as thin, well-tested wrappers over the already-installed `sonic-weave` prelude via a single kernel adapter, plus a free-text SonicWeave escape hatch — delivering parked TEMP-01, TEMP-07, and TEMP-08.
**Verified:** 2026-06-12T07:05:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure plans 07-05 (CR-01 / WR-01/WR-02), 07-06 (CR-02 / WR-03 / WR-04), and inline fix 295afaa (re-review CR-01: adapter mapping-loop guard)

## Goal Achievement

### Observable Truths (Success Criteria from ROADMAP)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can generate a rank-2 regular-temperament scale (generator + period, with optimal-tuning options); pure-ratio rank-2 reproduces Pythagorean diatonic exactly; tempered rank-2 is flagged tempered with cents | ✓ VERIFIED | CR-01 fixed: `composeSource()` POTE/TE/CTE branch now uses `${String(genN)}/${String(genD)}` (generate-rank2.ts:306); Magic (5/4) and Hanson (6/5) tests assert second degree ≈59.8¢ and ≈68.0¢ respectively; 564/564 tests green |
| 2 | User can generate a well-temperament scale (per-fifth comma tempering), presented as tempered (cents-primary, badged) | ✓ VERIFIED | generate-welltemp.ts line 107 `PYTHAGOREAN_COMMA = "531441/524288"`, line 291 `isTempered: () => true`; Vallotti and Werckmeister III test vectors confirmed |
| 3 | User can generate a Fokker periodicity-block scale whose cardinality matches the chosen basis extents, rendered as exact rational ratios | ✓ VERIFIED | CR-02 fixed: `renderExtents()` helper extracted; `onListChanged: renderExtents` wired to basis chip Add/Remove (generate-fokker.ts:433); 5 new tests confirm added axes are editable and contributing; fokkerCardinality integerDet confirmed |
| 4 | User can enter a free-text SonicWeave expression and compile it to a scale, with malformed input surfacing a safe error in a status region without destroying the prior preview | ✓ VERIFIED | Fixed in 295afaa: STEP 3 mapping loop wrapped in per-interval try/catch returning `{ scale: null, tempered, error }`; `Number.isFinite(ratio)` guard before the cents projection. Regression tests for `3^45`, `3^53/2^84` (Mercator's comma), and `1228801.` each return a structured error without throwing — never-throws contract (D-18/T-07-04) holds, so the widget's status-region error path is reached for all failure modes. 567/567 tests green. |
| 5 | At the adapter boundary, every rational SonicWeave result round-trips into the kernel's BigInt Interval via the n/d string (R-01 stays green); tempered results carry cents and are flagged, never laundered as exact JI | ✓ VERIFIED | Sign/zero guard at line 130: `if (f.s < 0n \|\| Number(f.n) === 0)` → structured error (WR-01/WR-02 fixed); tempered branch at line 137-138 sets `tempered = true`; no float-derived ratios presented as exact JI; regression vectors in sonicweave.test.ts green |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/sonicweave.ts` | scaleFromSonicWeave, SonicWeaveResult, never-throws contract | ✓ VERIFIED | STEP 3 loop wrapped in per-interval try/catch + isFinite guard (295afaa); never-throws contract holds |
| `src/lib/fokker.ts` | fokkerCardinality, integerDet, caps-first RangeError | ✓ VERIFIED | 101 lines; all exports present and tested |
| `src/lib/__tests__/sonicweave.test.ts` | adapter cross-checks, tempered detection, R-01, cap, sign/zero guard | ✓ VERIFIED | 16 tests green including WR-01/WR-02 vectors and the three CR-01 regression tests (3^45, Mercator, 1228801.) |
| `src/lib/__tests__/fokker.test.ts` | |det|=12, non-square, comma-cap | ✓ VERIFIED | 3 tests green |
| `src/components/generate-rank2.ts` | GEN-06 rank-2 widget with correct preset generator | ✓ VERIFIED | CR-01 fixed; no `rank2(3/2` in source; Magic/Hanson tests pass |
| `src/components/generate-welltemp.ts` | GEN-07 well-temperament widget | ✓ VERIFIED | Explicit Pythagorean comma; always tempered |
| `src/components/generate-fokker.ts` | GEN-08 Fokker widget, basis+comma modes, live readout, extent re-render | ✓ VERIFIED | CR-02 fixed via renderExtents()/onListChanged; WR-03 cap with message; WR-04 BigInt parseRatio |
| `src/components/generate-sonicweave.ts` | GEN-09 free-text widget, evaluate-on-click, safe error, docs link | ✓ VERIFIED | Evaluate-on-click and docs link correct; rebuild() safely relies on the adapter's never-throws contract, which now holds (295afaa) |
| `src/pages/generate.md` | All four widgets registered, five optgroups, Send-to | ✓ VERIFIED | All four imports, instantiate cells, swap branches, Send-to helpers present |
| `src/styles.css` | Four @import lines | ✓ VERIFIED | Lines 40-43 confirmed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `generate-rank2.ts` composeSource POTE/TE/CTE | preset genN/genD | `${String(genN)}/${String(genD)}` at line 306 | ✓ WIRED | CR-01 fixed; no hardcoded 3/2 |
| `sonicweave.ts` STEP 3 | never-throws contract | try/catch wrapping mapping loop | ✓ WIRED | Per-interval try/catch + isFinite guard (295afaa) |
| `generate-fokker.ts` basis chip | renderExtents | `onListChanged: renderExtents` at line 433 | ✓ WIRED | CR-02 fixed |
| `generate-sonicweave.ts` rebuild() | error handling | try/catch or structured-return guarantee | ✓ WIRED | Relies on adapter never-throws contract, which now holds (295afaa) |
| `sonicweave.ts` R-01 round-trip | sign/zero guard | `if (f.s < 0n \|\| Number(f.n) === 0)` line 130 | ✓ WIRED | WR-01/WR-02 fixed |
| `generate-fokker.ts` makeChipInput | basis-aware cap | `cap: number` parameter, status message at line 354 | ✓ WIRED | WR-03 fixed |
| `generate-fokker.ts` parseRatio | BigInt comma validation | `BigInt(m[1])` / `BigInt(m[2])` | ✓ WIRED | WR-04 fixed |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full unit suite | `npx vitest run` | 567/567 passed, 42 files | ✓ PASS |
| No hardcoded 3/2 in rank-2 POTE branch | `grep -n "rank2(3/2" src/components/generate-rank2.ts` | zero matches | ✓ PASS |
| Sign/zero guard present | `grep -n "f.s" src/lib/sonicweave.ts` | present | ✓ PASS |
| STEP 3 loop wrapped in try/catch | `grep -n "try\|catch" src/lib/sonicweave.ts` | per-interval try/catch inside the mapping loop (295afaa) | ✓ PASS |
| 3^45 / Mercator / 1228801. return structured errors | `npx vitest run src/lib/__tests__/sonicweave.test.ts` | three CR-01 regression tests pass — `{ scale: null, error }`, no throw | ✓ PASS |
| renderExtents wired to onListChanged | `grep -n "renderExtents\|onListChanged" src/components/generate-fokker.ts` | lines 274,277,288,337,361,382,433,436 | ✓ PASS |
| BigInt in parseRatio | `grep -n "BigInt(" src/components/generate-fokker.ts` | BigInt normalization confirmed | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| GEN-06 | 07-01, 07-02, 07-05 | Rank-2 regular-temperament scale (generator + period, optimal tunings) | ✓ SATISFIED | CR-01 fixed; Magic/Hanson POTE now use preset generators; tests assert correct chains |
| GEN-07 | 07-01, 07-02, 07-04 | Well-temperament scale (per-fifth comma tempering) | ✓ SATISFIED | Vallotti default, explicit Pythagorean comma, always tempered; tests green |
| GEN-08 | 07-01, 07-03, 07-06 | Fokker periodicity-block scale | ✓ SATISFIED | CR-02 fixed; basis chip add/remove regenerates extent fields; 5 new tests; WR-03/WR-04 also closed |
| GEN-09 | 07-01, 07-03, 07-04 | Free-text SonicWeave expression entry | ✓ SATISFIED | Widget evaluate-on-click and docs link correct; never-throws contract restored (295afaa) — inputs like 3^45 surface a status-region error with the prior preview preserved |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/generate-fokker.ts` | 421-423 | Positional `ups[i] ?? 0` / `downs[i] ?? 0` realignment on Remove misassigns surviving extents | WARNING | Removing the first basis axis assigns the removed axis's Up/Down values to the next axis (WR-01 from re-review) — non-blocking, tracked in 07-REVIEW.md |
| `src/components/generate-rank2.ts` | 135-137, 292 | Dead `genIsCents`/`genCents` path; ternary unreachable | INFO | No behavioral impact |
| `src/components/generate-fokker.ts` | 125-148 | comma-mode HNF is upward-from-1/1, not the canonical centered block | INFO | Mathematically valid but labeled "classic" in UI copy |
| `src/lib/sonicweave.ts` | 149-150 | `!first \|\|` guard is unreachable — `out.length === 0` already returned above | INFO | No behavioral impact |

### Human Verification Required

None — all success criteria are programmatically confirmed.

### Gaps Summary

No gaps remain. The blocker found by the post-gap-closure code review (07-REVIEW.md CR-01 — adapter STEP 3 mapping loop throwing past 2^53 and on non-finite cents projections) was fixed inline at commit `295afaa`: the per-interval mapping is wrapped fail-closed in a try/catch, a `Number.isFinite(ratio)` guard precedes the cents projection, and three regression tests (`3^45`, `3^53/2^84` Mercator's comma, `1228801.`) confirm structured `{ scale: null, error }` returns without throwing. Full suite green at 567/567.

Non-blocking items carried in 07-REVIEW.md: WR-01 (Fokker basis-chip Remove realigns extent values positionally) and WR-02/IN-01..IN-05 (info-level).

---

_Verified: 2026-06-12T07:05:00Z_
_Verifier: Claude (gsd-verifier), gap closed inline by orchestrator at 295afaa_
_Re-verification: Yes — after gap closure plans 07-05, 07-06 and inline fix 295afaa_
