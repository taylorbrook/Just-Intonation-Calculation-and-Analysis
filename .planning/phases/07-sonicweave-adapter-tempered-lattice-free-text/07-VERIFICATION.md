---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
verified: 2026-06-12T00:00:00Z
status: gaps_found
score: 4/5 must-haves verified
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
  gaps_remaining:
    - "Adapter STEP 3 mapping loop unguarded — iv.toFraction() throws for rationals past 2^53 (e.g. 3^45), centsToRatio returns Infinity for extreme cents; both exceptions escape scaleFromSonicWeave into the caller, violating the never-throws contract and breaking SC-4's safe-error requirement for the free-text widget"
  regressions: []
gaps:
  - truth: "User can enter a free-text SonicWeave expression and compile it to a scale, with malformed input surfacing a safe error in a status region without destroying the prior preview (SC-4)"
    status: failed
    reason: "The adapter's STEP 3 mapping loop (sonicweave.ts:117-140) sits outside any try/catch. iv.toFraction() at line 121 throws 'Numerator above safe limit' for any rational whose n or d exceeds 2^53 (empirically verified: evaluateSource('3^45') produces isFractional()=true, toFraction() throws). Line 138's new Interval(centsToRatio(iv.totalCents())) throws a BigInt conversion error when the cents value exceeds ~1,228,800 cents. Both throw paths escape scaleFromSonicWeave and propagate uncaught through generate-sonicweave.ts rebuild() (line 148 has no try/catch) — the status region is never updated, the user gets silence plus a console error, and the prior preview is NOT preserved by the handler. The documented never-throws contract (D-18/T-07-04) is false. The expression '3^45' is a single-token repro within the project's stated 'no prime-limit ceiling' scope. No regression tests exist for this failure path (no '3^45', Mercator comma, or 1228801 cents tests in sonicweave.test.ts)."
    artifacts:
      - path: "src/lib/sonicweave.ts"
        issue: "lines 117-140 (STEP 3 for loop): iv.toFraction() at line 121 and new Interval(centsToRatio(...)) at line 138 are not wrapped in try/catch; both throw on legitimate user input"
      - path: "src/components/generate-sonicweave.ts"
        issue: "rebuild() at line 148 calls scaleFromSonicWeave() with no try/catch; the thrown exception is uncaught at the click handler boundary"
    missing:
      - "Wrap the STEP 3 per-interval loop body in a try/catch that returns { scale: null, tempered, error: e.message } on any throw"
      - "Add a Number.isFinite(ratio) guard before new Interval(centsToRatio(...)) at line 138 to catch the Infinity case explicitly"
      - "Add regression tests: scaleFromSonicWeave('3^45\\n2/1'), scaleFromSonicWeave('3^53/2^84\\n2/1'), and scaleFromSonicWeave('1228801.') must each return { scale: null, error } without throwing"
---

# Phase 7: SonicWeave Adapter + Tempered Lattice + Free-Text — Re-Verification Report

**Phase Goal:** The genuinely advanced methods (rank-2 with optimal tunings, well-temperaments, Fokker periodicity blocks) ship as thin, well-tested wrappers over the already-installed `sonic-weave` prelude via a single kernel adapter, plus a free-text SonicWeave escape hatch — delivering parked TEMP-01, TEMP-07, and TEMP-08.
**Verified:** 2026-06-12T00:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap closure plans 07-05 (CR-01 / WR-01/WR-02) and 07-06 (CR-02 / WR-03 / WR-04)

## Goal Achievement

### Observable Truths (Success Criteria from ROADMAP)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can generate a rank-2 regular-temperament scale (generator + period, with optimal-tuning options); pure-ratio rank-2 reproduces Pythagorean diatonic exactly; tempered rank-2 is flagged tempered with cents | ✓ VERIFIED | CR-01 fixed: `composeSource()` POTE/TE/CTE branch now uses `${String(genN)}/${String(genD)}` (generate-rank2.ts:306); Magic (5/4) and Hanson (6/5) tests assert second degree ≈59.8¢ and ≈68.0¢ respectively; 564/564 tests green |
| 2 | User can generate a well-temperament scale (per-fifth comma tempering), presented as tempered (cents-primary, badged) | ✓ VERIFIED | generate-welltemp.ts line 107 `PYTHAGOREAN_COMMA = "531441/524288"`, line 291 `isTempered: () => true`; Vallotti and Werckmeister III test vectors confirmed |
| 3 | User can generate a Fokker periodicity-block scale whose cardinality matches the chosen basis extents, rendered as exact rational ratios | ✓ VERIFIED | CR-02 fixed: `renderExtents()` helper extracted; `onListChanged: renderExtents` wired to basis chip Add/Remove (generate-fokker.ts:433); 5 new tests confirm added axes are editable and contributing; fokkerCardinality integerDet confirmed |
| 4 | User can enter a free-text SonicWeave expression and compile it to a scale, with malformed input surfacing a safe error in a status region without destroying the prior preview | ✗ FAILED | The adapter's STEP 3 mapping loop (sonicweave.ts:117-140) is unguarded. `iv.toFraction()` (line 121) throws `"Numerator above safe limit"` for any rational past 2^53. `new Interval(centsToRatio(...))` (line 138) throws for extreme cents. Both escape `scaleFromSonicWeave` and propagate through the free-text widget's `rebuild()` uncaught — the status region is never set, prior preview is not preserved. Empirically verified: `evaluateSource("3^45")` returns `isFractional()=true`, `iv.toFraction()` throws. |
| 5 | At the adapter boundary, every rational SonicWeave result round-trips into the kernel's BigInt Interval via the n/d string (R-01 stays green); tempered results carry cents and are flagged, never laundered as exact JI | ✓ VERIFIED | Sign/zero guard at line 130: `if (f.s < 0n \|\| Number(f.n) === 0)` → structured error (WR-01/WR-02 fixed); tempered branch at line 137-138 sets `tempered = true`; no float-derived ratios presented as exact JI; regression vectors in sonicweave.test.ts green |

**Score:** 4/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/sonicweave.ts` | scaleFromSonicWeave, SonicWeaveResult, never-throws contract | ✗ PARTIAL | Exists (155 lines); STEP 3 loop unguarded — throws on 3^45, violating documented never-throws contract |
| `src/lib/fokker.ts` | fokkerCardinality, integerDet, caps-first RangeError | ✓ VERIFIED | 101 lines; all exports present and tested |
| `src/lib/__tests__/sonicweave.test.ts` | adapter cross-checks, tempered detection, R-01, cap, sign/zero guard | ✓ VERIFIED | 13 tests green including WR-01/WR-02 vectors; missing: 3^45, Mercator, 1228801 regression tests |
| `src/lib/__tests__/fokker.test.ts` | |det|=12, non-square, comma-cap | ✓ VERIFIED | 3 tests green |
| `src/components/generate-rank2.ts` | GEN-06 rank-2 widget with correct preset generator | ✓ VERIFIED | CR-01 fixed; no `rank2(3/2` in source; Magic/Hanson tests pass |
| `src/components/generate-welltemp.ts` | GEN-07 well-temperament widget | ✓ VERIFIED | Explicit Pythagorean comma; always tempered |
| `src/components/generate-fokker.ts` | GEN-08 Fokker widget, basis+comma modes, live readout, extent re-render | ✓ VERIFIED | CR-02 fixed via renderExtents()/onListChanged; WR-03 cap with message; WR-04 BigInt parseRatio |
| `src/components/generate-sonicweave.ts` | GEN-09 free-text widget, evaluate-on-click, safe error, docs link | ✗ PARTIAL | Exists; evaluate-on-click and docs link correct; but the widget crash-path is exposed because scaleFromSonicWeave can throw (STEP 3 unguarded) and rebuild() has no catch |
| `src/pages/generate.md` | All four widgets registered, five optgroups, Send-to | ✓ VERIFIED | All four imports, instantiate cells, swap branches, Send-to helpers present |
| `src/styles.css` | Four @import lines | ✓ VERIFIED | Lines 40-43 confirmed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `generate-rank2.ts` composeSource POTE/TE/CTE | preset genN/genD | `${String(genN)}/${String(genD)}` at line 306 | ✓ WIRED | CR-01 fixed; no hardcoded 3/2 |
| `sonicweave.ts` STEP 3 | never-throws contract | try/catch wrapping mapping loop | ✗ NOT_WIRED | Only evaluateSource is wrapped; STEP 3 loop (lines 117-140) is unguarded |
| `generate-fokker.ts` basis chip | renderExtents | `onListChanged: renderExtents` at line 433 | ✓ WIRED | CR-02 fixed |
| `generate-sonicweave.ts` rebuild() | error handling | try/catch or structured-return guarantee | ✗ PARTIAL | No catch in rebuild(); relies on adapter never-throws contract which is violated |
| `sonicweave.ts` R-01 round-trip | sign/zero guard | `if (f.s < 0n \|\| Number(f.n) === 0)` line 130 | ✓ WIRED | WR-01/WR-02 fixed |
| `generate-fokker.ts` makeChipInput | basis-aware cap | `cap: number` parameter, status message at line 354 | ✓ WIRED | WR-03 fixed |
| `generate-fokker.ts` parseRatio | BigInt comma validation | `BigInt(m[1])` / `BigInt(m[2])` | ✓ WIRED | WR-04 fixed |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full unit suite | `npx vitest run` | 564/564 passed, 42 files | ✓ PASS |
| No hardcoded 3/2 in rank-2 POTE branch | `grep -n "rank2(3/2" src/components/generate-rank2.ts` | zero matches | ✓ PASS |
| Sign/zero guard present | `grep -n "f.s" src/lib/sonicweave.ts` | line 130 present | ✓ PASS |
| STEP 3 loop outside try/catch | `grep -n "try\|catch\|for.*currentScale" src/lib/sonicweave.ts` | try/catch only around evaluateSource (lines 104-112); STEP 3 loop starts at 117 | ✗ FAIL (unguarded) |
| 3^45 throw confirmed empirically | `node -e "import { evaluateSource } from 'sonic-weave'; ..."` | `isFractional()=true`, `toFraction() THREW: Numerator above safe limit` | ✗ FAIL (throws escape adapter) |
| No regression tests for 3^45 | `grep -n "3\^45\|1228801\|above safe limit" src/lib/__tests__/sonicweave.test.ts` | zero matches | ✗ FAIL (no tests) |
| renderExtents wired to onListChanged | `grep -n "renderExtents\|onListChanged" src/components/generate-fokker.ts` | lines 274,277,288,337,361,382,433,436 | ✓ PASS |
| BigInt in parseRatio | `grep -n "BigInt(" src/components/generate-fokker.ts` | BigInt normalization confirmed | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| GEN-06 | 07-01, 07-02, 07-05 | Rank-2 regular-temperament scale (generator + period, optimal tunings) | ✓ SATISFIED | CR-01 fixed; Magic/Hanson POTE now use preset generators; tests assert correct chains |
| GEN-07 | 07-01, 07-02, 07-04 | Well-temperament scale (per-fifth comma tempering) | ✓ SATISFIED | Vallotti default, explicit Pythagorean comma, always tempered; tests green |
| GEN-08 | 07-01, 07-03, 07-06 | Fokker periodicity-block scale | ✓ SATISFIED | CR-02 fixed; basis chip add/remove regenerates extent fields; 5 new tests; WR-03/WR-04 also closed |
| GEN-09 | 07-01, 07-03, 07-04 | Free-text SonicWeave expression entry | ✗ PARTIAL | Widget evaluate-on-click and docs link correct; adapter's never-throws contract violated by unguarded STEP 3 — inputs like 3^45 crash rebuild() instead of surfacing a status error |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/sonicweave.ts` | 117-140 | STEP 3 mapping loop outside try/catch; `iv.toFraction()` and `new Interval(centsToRatio(...))` throw on legitimate input | BLOCKER | Free-text `3^45` crashes the widget; never-throws contract violated; status region never updated |
| `src/components/generate-sonicweave.ts` | 147-163 | `rebuild()` calls `scaleFromSonicWeave()` with no surrounding try/catch | BLOCKER | Relies on adapter never-throws guarantee that does not hold; uncaught throw silences the status region |
| `src/components/generate-fokker.ts` | 421-423 | Positional `ups[i] ?? 0` / `downs[i] ?? 0` realignment on Remove misassigns surviving extents | WARNING | Removing the first basis axis assigns the removed axis's Up/Down values to the next axis (WR-01 from re-review) |
| `src/components/generate-rank2.ts` | 135-137, 292 | Dead `genIsCents`/`genCents` path; ternary unreachable | INFO | No behavioral impact |
| `src/components/generate-fokker.ts` | 125-148 | comma-mode HNF is upward-from-1/1, not the canonical centered block | INFO | Mathematically valid but labeled "classic" in UI copy |
| `src/lib/sonicweave.ts` | 149-150 | `!first \|\|` guard is unreachable — `out.length === 0` already returned above | INFO | No behavioral impact |

### Human Verification Required

None — all remaining gaps are programmatically confirmed.

### Gaps Summary

One BLOCKER remains after gap closure:

**New Critical (from post-gap-closure code review, 07-REVIEW.md CR-01):** The adapter's STEP 3 mapping loop in `src/lib/sonicweave.ts` (lines 117-140) is not wrapped in a try/catch. Two calls within the loop provably throw on legitimate input:

1. `iv.toFraction()` at line 121 throws `"Numerator above safe limit"` for any SonicWeave rational whose numerator or denominator exceeds 2^53. Empirically verified: the program `3^45\n2/1` produces `isFractional() === true` yet `toFraction()` throws. This is squarely within the project's documented "no prime-limit ceiling" scope.

2. `new Interval(centsToRatio(iv.totalCents()))` at line 138 throws when `centsToRatio` returns `Infinity` for extreme cents values (above ~1,228,800¢, e.g. `1228801.`).

Both throw paths escape `scaleFromSonicWeave` entirely. The free-text widget's `rebuild()` function (generate-sonicweave.ts:148) calls `scaleFromSonicWeave()` with no surrounding try/catch. When the adapter throws, the click handler propagates the exception: the status region is never updated, the prior preview is not preserved, and the user experiences silence plus a console error. The module-header contract `D-18 / T-07-04: NEVER throws to the caller` is false for these inputs.

The gap-closure plans (07-05, 07-06) correctly fixed CR-01 (hardcoded 3/2) and CR-02 (extent field regeneration), but this new critical was identified in the subsequent code review (07-REVIEW.md, committed at db64f4c) and was explicitly NOT part of either gap-closure plan's scope. It remains unfixed.

**Fix:** Wrap the STEP 3 for-loop body in a per-interval try/catch that returns `{ scale: null, tempered, error: e.message }` on any throw, and add a `Number.isFinite(ratio)` guard before the `new Interval(centsToRatio(...))` call. Add regression tests for `3^45\n2/1`, `3^53/2^84\n2/1` (Mercator's comma), and `1228801.` — each must return `{ scale: null, error }` without throwing.

---

_Verified: 2026-06-12T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — after gap closure plans 07-05 and 07-06_
