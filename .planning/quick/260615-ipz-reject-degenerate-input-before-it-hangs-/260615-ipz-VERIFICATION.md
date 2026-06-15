---
phase: quick-260615-ipz
verified: 2026-06-15T13:47:30Z
status: passed
score: 11/11 must-haves verified
overrides_applied: 0
---

# Quick Task 260615-ipz: Input-Validation Hardening Verification Report

**Task Goal:** Reject degenerate input before it hangs or corrupts the JI kernel — six guards with pinning rejection tests and paired positive regression tests. No behavior change for valid input.
**Verified:** 2026-06-15T13:47:30Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | octaveReduce on a non-positive fraction throws RangeError BEFORE entering the reduce loop | VERIFIED | `interval.ts` lines 93-97: guard `if (f.s < 0n \|\| f.n === 0n)` placed after `let f = this.fraction` and before the two while-loops |
| 2 | octaveReduce still correctly reduces valid sub-unison ratios (1/2 -> 1/1, 3/5 -> 6/5) — guard does NOT over-reject (0,1) fractions | VERIFIED | Loop `while (f.compare(one) < 0) f = f.mul(pf)` unchanged; regression test in `interval.test.ts` lines 112-115 passes |
| 3 | parsePitchToken('0') and parsePitchToken('0/1') throw with a 'positive' message | VERIFIED | `scala.ts` lines 307-312: ratio branch rejects when `Number(numStr) <= 0 \|\| Number(denStr) <= 0`; tests at `scala.test.ts` lines 114-119 |
| 4 | parsePitchToken('5/0') and parsePitchToken('0/5') throw with a 'positive' message (NOT a raw fraction.js 'Division by Zero') | VERIFIED | Same guard runs BEFORE `new Interval`; test at `scala.test.ts` lines 121-128 asserts `/positive/i` and `not.toThrowError(/division by zero/i)` |
| 5 | parsePitchToken of a cents token with \|cents\| > 1_000_000 (e.g. '2000000.0') throws with a 'cents out of range' message | VERIFIED | `scala.ts` lines 277-280: `if (Math.abs(cents) > MAX_ABS_CENTS) throw new Error(...)` with "cents out of range" in message; tests at `scala.test.ts` lines 133-138 |
| 6 | parsePitchToken of an in-range cents token (e.g. '1000000.0', '408.0') still parses successfully | VERIFIED | Bound is strict `>` so exactly 1_000_000 passes; tests at `scala.test.ts` lines 141-154 confirm both |
| 7 | cps() rejects a factor set containing a non-positive Interval (0/1 or -3/2) with a RangeError before enumeration | VERIFIED | `cps.ts` lines 75-77: `if (factors.some((f) => f.fraction.s < 0n \|\| f.fraction.n === 0n)) throw new RangeError(...)` placed before `kCombinations`; tests at `cps.test.ts` lines 86-99 |
| 8 | enumerateDiamond() rejects an even oddLimit (e.g. 8) with a clear error | VERIFIED | `diamond.ts` lines 76-80: `if (oddLimit % 2 === 0) throw new RangeError(...)` with "must be odd" message; tests at `diamond.test.ts` lines 62-66 assert both `RangeError` and `/odd/i` |
| 9 | meruScale() rejects negative coefficients a or b that would drive the recurrence non-positive, with a RangeError | VERIFIED | `meru.ts` lines 94-98: `if (a < 0n \|\| b < 0n) throw new RangeError(...)`; defense-in-depth per-term guard at lines 115-119; tests at `meru.test.ts` lines 104-111 |
| 10 | buildMos() rejects a generator that octave-reduces to 1/1 under the period (e.g. gen 2/1, period 2/1; gen 4/1, period 2/1) the same way it rejects generator === period | VERIFIED | `mos.ts` lines 165-168: `const reducedGen = generator.octaveReduce(period); if (reducedGen.equals(ONE)) return new Scale([period], period)`; tests at `mos.test.ts` lines 87-99 cover both gen=2/1 and gen=4/1 |
| 11 | `npm run test` is green and `npm run lint:types` (tsc --noEmit) passes with no new errors | VERIFIED | 682/682 tests pass across 50 files; `tsc --noEmit` exits clean with no output |

**Score:** 11/11 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/interval.ts` | octaveReduce non-positive-fraction RangeError guard containing "RangeError" | VERIFIED | Guard at lines 93-97 with correct sign/zero condition |
| `src/lib/scala.ts` | parsePitchToken positive-ratio + cents-magnitude guards containing "cents out of range" | VERIFIED | MAX_ABS_CENTS constant at line 50; cents guard at lines 277-280; ratio guard at lines 307-312 |
| `src/lib/cps.ts` | cps factor positivity guard containing "RangeError" | VERIFIED | Guard at lines 75-77, before kCombinations call |
| `src/lib/diamond.ts` | enumerateDiamond even-oddLimit rejection | VERIFIED | Guard at lines 76-80 with "must be odd" message |
| `src/lib/meru.ts` | meruScale coefficient/term positivity guard | VERIFIED | Coefficient guard at lines 94-98; per-term guard at lines 115-119 |
| `src/lib/mos.ts` | buildMos generator-reduces-to-unison rejection | VERIFIED | reducedGen.equals(ONE) check at lines 165-168 |
| `src/lib/__tests__/interval.test.ts` | pinning tests for octaveReduce non-positive guard + sub-unison regression | VERIFIED | Tests at lines 99-115 (zero ratio, negative ratio, sub-unison regression) |
| `src/lib/__tests__/scala.test.ts` | pinning tests for zero/negative ratio + cents-out-of-range rejection | VERIFIED | `describe("degenerate ratio + cents rejection (260615-ipz)")` block at lines 110-156 |
| `src/lib/__tests__/cps.test.ts` | pinning test for non-positive factor rejection | VERIFIED | Tests at lines 86-99 (zero factor, negative factor, hexany regression) |
| `src/lib/__tests__/diamond.test.ts` | pinning test for even-oddLimit rejection | VERIFIED | Tests at lines 62-72 (even oddLimit throws + odd oddLimit regression) |
| `src/lib/__tests__/meru.test.ts` | pinning test for negative-coefficient rejection | VERIFIED | Tests at lines 104-122 (negative a, negative b, Fibonacci regression) |
| `src/lib/__tests__/mos.test.ts` | pinning test for generator-reduces-to-1/1 rejection | VERIFIED | Tests at lines 87-107 (gen=2/1, gen=4/1, Pythagorean regression) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scala.ts parsePitchToken` ratio branch | `interval.ts octaveReduce` | Non-positive ratios rejected BEFORE `new Interval` so they never reach octaveReduce | WIRED | Guard on lines 307-312 checks `Number(numStr) <= 0 \|\| Number(denStr) <= 0` before construction; test at `scala.test.ts` line 122-123 confirms "Division by Zero" is never surfaced |
| `cps.ts cps()` | `interval.ts mul/octaveReduce` | Factor positivity guard prevents non-positive products feeding octaveReduce | WIRED | Guard at `cps.ts` lines 75-77 fires before enumeration; `cps.test.ts` line 87-88 confirms RangeError with `/positive/i` |

---

### Guard Placement Verification (Critical Detail)

The plan explicitly required the `octaveReduce` guard to be placed BEFORE the reduce while-loops. Confirmed: `interval.ts` structure is:
1. Line 81: period <= 1/1 guard (pre-existing)
2. Line 87: `let f = this.fraction`
3. Lines 93-97: **non-positive guard** (260615-ipz, new)
4. Line 99: `const pf = p.fraction`
5. Line 100: `while (f.compare(one) < 0) f = f.mul(pf)` (first loop)
6. Line 101: `while (f.compare(pf) >= 0) f = f.div(pf)` (second loop)

Guard is BEFORE both loops. The condition is `f.s < 0n || f.n === 0n` (sign/zero test), NOT `compare(one) <= 0` — verified. This preserves the valid (0, 1) reduction path that `enumerateDiamond` depends on.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| octaveReduce(-3/2) throws RangeError | `npm run test -- src/lib/__tests__/interval.test.ts` | 19/19 pass | PASS |
| parsePitchToken('5/0') throws /positive/i not /division by zero/i | `npm run test -- src/lib/__tests__/scala.test.ts` | 55/55 pass | PASS |
| cps with non-positive factor throws RangeError | `npm run test -- src/lib/__tests__/cps.test.ts` | 10/10 pass | PASS |
| enumerateDiamond(8) throws RangeError | `npm run test -- src/lib/__tests__/diamond.test.ts` | 6/6 pass | PASS |
| meruScale(-1n, 1n, ...) throws RangeError | `npm run test -- src/lib/__tests__/meru.test.ts` | 15/15 pass | PASS |
| buildMos(4/1, 2/1, 7) -> single-pitch | `npm run test -- src/lib/__tests__/mos.test.ts` | 14/14 pass | PASS |
| Full suite regression | `npm run test` | 682/682 pass | PASS |
| TypeScript strict check | `npm run lint:types` | Exit 0, no output | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HARDEN-DEGENERATE-INPUT | 260615-ipz-PLAN.md | Six guards + pinning tests + paired regressions | SATISFIED | All six guards in source; 18 new tests across six spec files; 682/682 suite green |

---

### Anti-Patterns Found

No debt markers (TBD/FIXME/XXX) found in any of the 12 modified files. The 260615-ipz comments in source files are rationale documentation, not debt markers. No stubs, no hardcoded empty returns, no placeholder implementations.

---

### Human Verification Required

None. All truths are verifiable from code and test output.

---

### Gaps Summary

No gaps. All 11 must-have truths are verified in the actual codebase with matching source guards, test coverage, and a clean CI gate.

---

_Verified: 2026-06-15T13:47:30Z_
_Verifier: Claude (gsd-verifier)_
