---
phase: quick-260615-jtm
verified: 2026-06-15T21:37:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
---

# Quick Task 260615-jtm Verification Report

**Task Goal:** Fix writeScl laundering tempered/cents scales into fake exact ratios — track ratio-vs-cents provenance on Interval/Scale, set it at parse time in parsePitchToken, and have writeScl emit iv.cents.toFixed(6) for cents-source degrees.
**Verified:** 2026-06-15T21:37:00Z
**Status:** passed
**Commit:** 946a624 (merged from worktree)

---

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A cents-derived/EDO scale exports via writeScl as dotted cents lines (e.g. "408.000000"), NOT as invented exact ratios | VERIFIED | `formatPitch` at scala.ts:217 branches on `iv.source === "cents"` → `iv.cents.toFixed(6)`. Test "(1) a cents scale exports as dotted 6-dp cents" asserts every pitch line matches `/^-?\d*\.\d{6}$/` and `not.toMatch(/\d{4,}\/\d{4,}/)`. All 93 tests pass. |
| 2 | A ratio/monzo-defined scale still exports as n/d ratio lines (no regression) | VERIFIED | `formatPitch` falls through to `formatRatio(iv)` for `source === "ratio"`. Test "(3) regression — a ratio scale stays ratios" asserts `out.toContain("9/8")`, `toContain("3/2")`, and `not.toMatch(/\d+\.\d{6}/)`. Golden round-trip suite (5 files) also still passes. |
| 3 | parseScl(writeScl(s)) on a cents-source scale re-detects cents (round-trips through the cents path, not a laundered ratio) | VERIFIED | Test "(2) round-trip re-detects cents" asserts all reparsed non-unison intervals have `source === "cents"` and `.cents` toBeCloseTo originals to 3 dp. The dotted decimal emitted by toFixed(6) re-triggers parsePitchToken's D-19 cents-detection (token contains "."). |
| 4 | Provenance is per-interval: a mixed scale emits cents lines for its cents degrees and ratio lines for its ratio degrees in the same file | VERIFIED | Test "(4) mixed scale emits BOTH" parses F03-mixed-ratio-cents.scl and asserts output matches both `/\d+\.\d{6}/` (cents lines) and `/\d+\/\d+/` (ratio lines). The "parsePitchToken provenance tagging" suite also directly asserts per-interval source values in F03. |
| 5 | Every existing `new Interval(...)` call site stays valid — provenance defaults to "ratio"/exact | VERIFIED | Constructor signature is `constructor(input: FractionInput, source: IntervalSource = "ratio")` — the second param defaults. `tsc --noEmit` exits 0. All 27 pre-existing Interval tests pass unchanged. `fromMonzo` passes no source arg and correctly defaults to "ratio". |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/interval.ts` | Interval carries immutable readonly `source: "ratio" \| "cents"` provenance flag, defaulting to "ratio" | VERIFIED | `export type IntervalSource = "ratio" \| "cents"` at line 47; `readonly source: IntervalSource` at line 56; constructor `source: IntervalSource = "ratio"` at line 60. Contains "source" per plan artifact spec. |
| `src/lib/scala.ts` | parsePitchToken tags the dotted-cents path as cents-source; writeScl serializes per-interval provenance (cents → iv.cents.toFixed(6), exact → formatRatio) | VERIFIED | `return new Interval(ratioFloat, "cents")` at line 330 (cents path); `formatPitch` at lines 216-218 branches on `iv.source === "cents"` → toFixed(6), else formatRatio. Contains "toFixed(6)" per plan artifact spec. |
| `src/lib/__tests__/scala.test.ts` | Round-trip test proving a cents-derived scale exports as dotted cents, not laundered ratios | VERIFIED | `describe("writeScl cents provenance (finding #1)")` block at lines 486-552 with 4 subtests covering: (1) cents export format, (2) round-trip cents re-detection, (3) ratio regression guard, (4) mixed scale. Contains "toFixed" per plan artifact spec. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| parsePitchToken (cents path) | Interval constructor source param | `new Interval(ratioFloat, "cents")` | VERIFIED | scala.ts line 330: `return new Interval(ratioFloat, "cents");` — exact match of plan's pattern `new Interval\([^)]*"cents"\)` |
| writeScl | iv.source | per-interval branch on provenance | VERIFIED | scala.ts line 217: `return iv.source === "cents" ? iv.cents.toFixed(6) : formatRatio(iv);` — exact match of plan's pattern `iv\.source` |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 93 tests pass (scala + interval suites) | `npx vitest run src/lib/__tests__/scala.test.ts src/lib/__tests__/interval.test.ts` | 2 test files passed, 93 tests, 200ms | PASS |
| TypeScript clean | `npx tsc --noEmit` | exit 0, no output | PASS |
| `iv.source` branch present in writeScl path | `grep -n 'iv\.source' src/lib/scala.ts` | Lines 142, 197, 217 — formatPitch uses it | PASS |
| `new Interval(..., "cents")` present in parsePitchToken | `grep -n '"cents"' src/lib/scala.ts` | Line 330 — in the dotted-cents branch | PASS |
| Stale "does not currently track" / "always emits ratios" comments removed | `grep -n 'does not currently track\|always emits ratio' src/lib/scala.ts` | No output — comments gone | PASS |

---

## Anti-Patterns Found

None. No TBD/FIXME/XXX markers in modified files. No stub patterns. No empty implementations.

---

## Scope Boundaries (documented out-of-scope — NOT gaps)

Per the plan's explicit scope boundary (scala.ts line 322-328 comment and plan Task 2 action):

- **Arithmetic ops** (`mul`, `div`, `inv`, `octaveReduce`) do not propagate source — by design. A transposed cents pitch is a new pitch; defaults to "ratio". Confirmed pinned in interval.test.ts line 153-158.
- **Generator paths** (`jiSubsetOfEdo`, all-cents generators) do not set "cents" — by design. `jiSubsetOfEdo` produces approximated exact ratios via `approximatePrimeLimit`, so "ratio" is correct. Documented as follow-up.
- **Derived Scale ops** (rotate/reduce/dedupe/transpose) lose provenance — by design. New pitch != same pitch.

These are not gaps. They are correctly documented in comments and in the plan's threat model (T-jtm-02).

---

## Human Verification Required

None. All must-haves are verifiable from the codebase and test results.

---

## Summary

The fix is complete and correct. All five must-have truths are verified by direct code inspection and passing tests:

1. `Interval` gained `readonly source: IntervalSource` (defaulting "ratio") — backward-compatible at all existing call sites; `IntervalSource` type is exported.
2. `parsePitchToken`'s dotted-cents branch tags `new Interval(ratioFloat, "cents")`; ratio and monzo paths stay "ratio" by default.
3. `writeScl` now calls `formatPitch(iv)` (extracted helper) which branches per-interval: `iv.source === "cents"` → `iv.cents.toFixed(6)`, else `formatRatio(iv)`.
4. A full round-trip test suite (4 subtests) pins the behavior: cents-only export format, round-trip cents re-detection, ratio-scale regression guard, mixed-scale both-formats guard.
5. The stale header comments claiming provenance is not tracked are replaced with accurate documentation of the new behavior.

The test suite is green (93/93), `tsc --noEmit` is clean, and the implementation mirrors the `serializeDegrees` precedent from `scala-archive.ts` as the plan specified.

---

_Verified: 2026-06-15T21:37:00Z_
_Verifier: Claude (gsd-verifier)_
