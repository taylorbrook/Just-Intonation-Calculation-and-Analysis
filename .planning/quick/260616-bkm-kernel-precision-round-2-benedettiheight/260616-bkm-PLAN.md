---
phase: quick-260616-bkm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/monzo.ts
  - src/lib/scale.ts
  - src/lib/edo.ts
  - src/lib/constant-structure.ts
  - src/lib/interval.ts
  - src/lib/cps.ts
  - src/lib/INVENTORY.md
  - src/lib/__tests__/monzo.test.ts
  - src/lib/__tests__/scale.test.ts
  - src/lib/__tests__/edo.test.ts
  - src/lib/__tests__/constant-structure.test.ts
  - src/lib/__tests__/interval.test.ts
  - src/lib/__tests__/cps.test.ts
autonomous: true
requirements: [KERNEL-PRECISION-R2]

must_haves:
  truths:
    - "benedettiHeight returns an exact bigint for arbitrarily large commas (no Number() precision loss past 2^53)"
    - "jiSubsetOfEdo and bestJiInEdo emit no duplicate exact-fraction intervals; the period appears exactly once at the end"
    - "isConstantStructure uses scale.period (not the last degree) for wrap-around extension"
    - "Interval.cents is finite for arbitrarily large fractions (no Infinity overflow) and matches the old formula within float epsilon for normal ratios"
    - "cps root selection picks the minimum product by exact Fraction.compare, not float cents"
    - "npm run test and npm run lint:types both pass; prettier format is clean"
  artifacts:
    - path: "src/lib/monzo.ts"
      provides: "benedettiHeight returning bigint"
      contains: "benedettiHeight"
    - path: "src/lib/scale.ts"
      provides: "deduped jiSubsetOfEdo by exact fraction string"
      contains: "toFraction()"
    - path: "src/lib/edo.ts"
      provides: "deduped bestJiInEdo odd-limit branch by exact fraction string"
      contains: "toFraction()"
    - path: "src/lib/constant-structure.ts"
      provides: "wrap-around using scale.period"
      contains: "scale.period"
    - path: "src/lib/interval.ts"
      provides: "monzo-based cents getter (finite for large fractions)"
      contains: "this.monzo"
    - path: "src/lib/cps.ts"
      provides: "exact Fraction.compare root selection"
      contains: "fraction.compare"
  key_links:
    - from: "src/lib/scale.ts jiSubsetOfEdo"
      to: "Scale (ends with period)"
      via: "Set<string> of iv.fraction.toFraction()"
      pattern: "new Set<string>"
    - from: "src/lib/interval.ts cents getter"
      to: "this.monzo + PRIMES"
      via: "sum_i monzo[i] * log2(PRIMES[i])"
      pattern: "this\\.monzo"
---

<objective>
Kernel precision round 2: five exact-arithmetic fixes to the JI math kernel plus tests.

1. `benedettiHeight` returns `bigint` (drop the lossy `Number()`) so large commas (Mercator's comma region) stay exact.
2. Dedupe `jiSubsetOfEdo` and `bestJiInEdo` outputs by the EXACT canonical fraction string (the same `Set<string>` of `iv.fraction.toFraction()` already used in cps.ts), preserving order and the single trailing period.
3. `isConstantStructure` wrap-around uses `scale.period` (the authoritative period), not the last degree.
4. `Interval.cents` computes from the monzo (`1200 * Σ monzo[i]·log2(PRIMES[i])`) so it stays finite for arbitrarily large fractions instead of overflowing to `Infinity`.
5. `cps` root selection picks the minimum product by exact `Fraction.compare`, not float `cents`.

Purpose: Honor R-01 (Fraction-only-from-fraction.js) and Pitfall #1/#6 (cents only at boundaries, never as a kernel comparison/dedupe key). These are the remaining float/lossy seams in the exact kernel.
Output: 6 edited kernel source files + INVENTORY.md note + 6 updated test files; `npm run test` and `npm run lint:types` green; prettier clean.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@./CLAUDE.md
@src/lib/monzo.ts
@src/lib/scale.ts
@src/lib/edo.ts
@src/lib/constant-structure.ts
@src/lib/interval.ts
@src/lib/cps.ts
@src/lib/__tests__/monzo.test.ts
@src/lib/__tests__/constant-structure.test.ts

# Reference for the exact-fraction-string dedupe pattern (already correct):
# cps.ts lines 106-115 — `const seen = new Set<string>(); ... iv.fraction.toFraction()`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Five kernel precision edits (monzo, scale, edo, constant-structure, interval, cps)</name>
  <files>src/lib/monzo.ts, src/lib/scale.ts, src/lib/edo.ts, src/lib/constant-structure.ts, src/lib/interval.ts, src/lib/cps.ts, src/lib/INVENTORY.md</files>
  <action>
Apply five exact-arithmetic fixes. NO new dependencies. Honor R-01 (Fraction only from fraction.js, never xen-dev-utils) and Pitfall #1/#6 (cents is display-only, never a kernel comparison/dedupe key) throughout.

FIX #9 — benedettiHeight returns bigint (src/lib/monzo.ts:47-50).
Change the signature from `: number` to `: bigint` and return `numerator * denominator` directly (drop the `Number(...)` wrapper). Update the JSDoc block above it (lines 38-46): remove the "Note: returns a Number ... Number.MAX_SAFE_INTEGER ... consumers can compute via monzoToBigNumeratorDenominator" paragraph, which becomes wrong; replace with a one-line note that it returns the exact BigInt product `n*d` (no precision ceiling — Mercator's comma and larger commas stay exact). Then grep the whole codebase for `benedettiHeight` to confirm callers: the ONLY non-test reference is src/lib/INVENTORY.md (a docs table) — there are NO production callers doing float math on the result, so the signature change is safe. Update the INVENTORY.md row for `benedettiHeight` (line 24) to drop the "before the Number coercion at the end" clause and state it returns the exact bigint product. (The monzo.test.ts caller is updated in Task 2.)

FIX #10 — dedupe EDO subset outputs by exact fraction string. Apply to BOTH functions, mirroring cps.ts:106-115 exactly (a `Set<string>` keyed on `iv.fraction.toFraction()`, preserving first occurrence and insertion order — NEVER cents-within-epsilon, Pitfall #1/#6).
  (a) src/lib/scale.ts `jiSubsetOfEdo` (lines 140-188): the per-step loop builds `intervals` (step 0 = 1/1, then approximated ratios), then line 186 appends the 2/1 period. Restructure so dedupe happens BEFORE the period append: dedupe the per-step `intervals` array by exact fraction string into a `distinct` array (preserving order — 1/1 stays first), then append the period exactly once. Guard the double-count case: if a step already produced 2/1, it must NOT appear twice once the explicit 2/1 period is appended — i.e. when appending the period, only push it if `distinct`'s last entry is not already the period (or remove any 2/1 already in `distinct` before appending). The Scale contract (ends with the period) must still hold: result ends with exactly one 2/1. Update the function-level JSDoc (lines 131-139) — the "result has edoSteps intervals ... total length = edoSteps + 1" claim is no longer exact after dedupe; state instead that duplicate closest-JI ratios (common for high-EDO / low-prime-limit, where multiple steps map to the same ratio) are collapsed by exact fraction string, and the result ends with exactly one 2/1 period.
  (b) src/lib/edo.ts `bestJiInEdo` odd-limit branch (lines 156-181): the loop (step 0 = 1/1, then `oddLimitApproximation`) builds `intervals`, then line 179 appends 2/1. Apply the SAME dedupe-before-append-period logic. The prime branch (line 161) delegates to `jiSubsetOfEdo` and inherits the fix from (a) — do NOT re-dedupe there. Update the `bestJiInEdo` JSDoc (lines 146-155) — the "Scale of N+1 intervals: indices 0..N-1 ... index N is the period 2/1" claim is now post-dedupe; note duplicates are collapsed by exact fraction string and the result ends with exactly one 2/1.

FIX #11 — constant-structure wrap-around uses scale.period (src/lib/constant-structure.ts:79).
Replace `const period = degrees[n - 1]!;` with `const period = scale.period;` (the Scale already carries the authoritative explicit period; the last degree is not guaranteed to equal it). The `ext.push(period.mul(d))` loop and everything downstream stay unchanged. Update the algorithm JSDoc that says the degrees array "WITH the period at the end" / "the period last" (lines 28-32 and the inline comment near 64-66) to clarify that the wrap-around period is `scale.period` (authoritative), not assumed to be the last degree. Do NOT otherwise alter the subtension algorithm.

FIX (low) — Interval.cents from monzo to avoid Infinity overflow (src/lib/interval.ts:80-86).
Rewrite the `cents` getter body to compute from the monzo so it stays finite for arbitrarily large ratios: `cents = 1200 * Σ_i (this.monzo[i] * Math.log2(PRIMES[i]))`. Use the already-cached `this.monzo` getter and `PRIMES` from xen-dev-utils. Add `PRIMES` to the existing `import { toMonzo, monzoToBigNumeratorDenominator } from "xen-dev-utils";` at line 24 (it is NOT Fraction — R-01 forbids importing Fraction from xen-dev-utils, but PRIMES is fine; scale.ts already imports PRIMES from xen-dev-utils). Keep the lazy `#cents` cache and the "display projection only — float math acceptable (Pitfall #1)" comment. Each PRIMES[i] is defined for every i within monzo.length (the monzo was built by factorizing this.fraction), but guard defensively: skip terms where `PRIMES[i]` is undefined or `this.monzo[i]` is 0. The unison (empty/all-zero monzo) yields 0 cents — verify the sum over an empty/zero monzo is 0.

FIX (low) — cps root by exact Fraction.compare (src/lib/cps.ts:87-100).
Replace the float root-selection comparison `if (p.cents < min.cents) min = p;` (line 99) with the exact rational comparison `if (p.fraction.compare(min.fraction) < 0) min = p;`. Update the comment block at lines 88-92: it currently says "`.cents` is used ONLY to find the minimum (Pitfall #1 — a comparison key ...)"; change it to state the root pick now uses exact `Fraction.compare` (no float tie/ordering ambiguity in selecting the tonic). Leave the cents-based SORT at line 118 unchanged (it is a display sort; the module header comment at lines 16-21 already notes cents is "used solely as a SORT KEY" — that remains true for the sort, so do not contradict it; the root-pick is now the exact-compare path).

After all edits, run `npx prettier --write` on every modified .ts file so format:check stays clean.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npm run lint:types && grep -rn "benedettiHeight" src/lib/*.ts | grep -q ": bigint" && grep -q "scale.period" src/lib/constant-structure.ts && grep -q "fraction.compare(min.fraction)" src/lib/cps.ts && grep -q "this.monzo" src/lib/interval.ts && echo "KERNEL EDITS OK"</automated>
  </verify>
  <done>benedettiHeight returns bigint; jiSubsetOfEdo + bestJiInEdo dedupe by exact fraction string with exactly one trailing 2/1; constant-structure uses scale.period; Interval.cents computes from monzo; cps root uses Fraction.compare. `npm run lint:types` passes; INVENTORY.md updated; all modified files prettier-clean.</done>
</task>

<task type="auto">
  <name>Task 2: Update and extend tests for all six fixes</name>
  <files>src/lib/__tests__/monzo.test.ts, src/lib/__tests__/scale.test.ts, src/lib/__tests__/edo.test.ts, src/lib/__tests__/constant-structure.test.ts, src/lib/__tests__/interval.test.ts, src/lib/__tests__/cps.test.ts</files>
  <action>
Update and extend the test suite to lock in all five fixes. Use exact BigInt / exact-fraction-string assertions throughout (NEVER cents-within-epsilon for kernel correctness — float epsilon only for the cents DISPLAY projection).

monzo.test.ts (benedettiHeight bigint):
  - Fix the existing test at line 56-58: `benedettiHeight([-4, 4, -1])` now returns `6480n` (bigint) — change `.toBe(6480)` to `.toBe(6480n)`.
  - Add a test asserting EXACTNESS for a large comma where `Number(n*d)` would lose precision past 2^53. Use Mercator's comma `3^53 / 2^84` (monzo `[-84, 53]`). Compute the expected exact product as a literal bigint: `numerator = 3n**53n`, `denominator = 2n**84n`, expected = `3n**53n * 2n**84n`. Assert `benedettiHeight([-84, 53]) === 3n**53n * 2n**84n` exactly, and additionally assert that `Number(expected)` (the OLD lossy path) is NOT bit-exact (e.g. `expected !== BigInt(Number(expected))`) to document why bigint is required.

scale.test.ts (jiSubsetOfEdo dedupe + single trailing period):
  - Add a test for a high-EDO / low-prime-limit case that previously duplicated. Use something like `jiSubsetOfEdo(53, 3)` or `jiSubsetOfEdo(72, 5)` (high EDO, low prime limit — many steps collapse to the same closest 3-limit/5-limit ratio). Assert NO duplicate fraction strings: collect `s.intervals.map(iv => iv.fraction.toFraction())` into a Set and assert `set.size === array.length`.
  - Assert the period appears EXACTLY once at the end: the last interval equals 2/1, and the count of intervals whose `toFraction()` === `new Interval("2/1").fraction.toFraction()` is exactly 1.
  - Confirm 1/1 is still present at index 0.
  - NOTE: the existing length assertions at lines 192-194 (`expect(...length).toBe(13)` for `jiSubsetOfEdo(12, 5)`) may now FAIL if 12-EDO 5-limit happens to produce a duplicate. RUN the existing test first; if 12/5 still yields 13 distinct + period, leave it; if dedupe changes the count, update those length assertions to assert "≤ edoSteps + 1" and "ends with exactly one 2/1" instead of an exact hardcoded count. Pick the exact updated count from the actual deduped output (do not guess — read the test run).

edo.test.ts (bestJiInEdo odd-limit dedupe + parity):
  - The existing parity test at line 132-141 (prime branch matches jiSubsetOfEdo) must still pass — run it; if jiSubsetOfEdo's dedupe changed its output, that's fine because bestJiInEdo prime branch delegates, so parity holds by construction. Adjust only if a hardcoded length there breaks.
  - The existing odd-branch test at line 143 (`bestJiInEdo(12, 9, "odd")`, `length === 13`) may break under dedupe — run it; update the length assertion to match the deduped count, or assert "no duplicate fraction strings + ends with exactly one 2/1" instead of the hardcoded 13.
  - Add a dedup test for a high-EDO odd-limit case (e.g. `bestJiInEdo(72, 9, "odd")`): collect `toFraction()` strings into a Set, assert `set.size === array.length`, and assert exactly one trailing 2/1.

constant-structure.test.ts (uses scale.period for wrap-around):
  - Add a test constructing a Scale where the LAST degree differs from the explicit period, to prove the wrap-around now uses `scale.period`. Build `new Scale([1/1, ...some degrees..., lastDegree], explicitPeriod)` where `lastDegree !== explicitPeriod` (e.g. degrees that end below the period, with an explicit 2/1 period passed as the second Scale arg). Assert `isConstantStructure(scale)` returns the correct `cs` value computed against `scale.period` (not against the last degree). Construct one case where using the last-degree (old behavior) would give a DIFFERENT cs result than using scale.period, so the test actually discriminates the fix. If a clean discriminating case is hard to construct, at minimum assert the existing CS-✓ and CS-✗ anchors still pass (regression) AND add a case with an explicit period != last degree that returns the mathematically correct result.

interval.test.ts (cents finite for huge fractions + matches old formula):
  - Add a test that `new Interval("...huge.../...huge...").cents` is FINITE (`Number.isFinite(iv.cents) === true`) for a fraction where the old `Number(this.fraction.valueOf())` overflowed to Infinity. Use a fraction with a numerator > ~2^1024 (e.g. a high prime power monzo via `Interval.fromMonzo([..., big exponent])`, or a literal n/d string with ~310+ digit numerator). Verify `Number(BigInt(numerator).valueOf())` would be Infinity for the chosen value (document the threshold in a comment), then assert `iv.cents` is finite and positive.
  - Add a regression test: for normal ratios (3/2, 5/4, 81/80) the new monzo-based cents matches the old `1200*log2(n/d)` formula within float epsilon (e.g. `expect(iv.cents).toBeCloseTo(1200 * Math.log2(Number(iv.fraction.valueOf())), 9)`). The existing cents tests at lines 23-38 (3/2 ≈ 701.955, centsFrom12tet) must still pass unchanged.

cps.test.ts (exact root selection — existing behavior preserved):
  - Run the existing cps suite — all existing tests (hexany/dekany vectors etc.) MUST still pass; the exact root pick yields the same canonical Wilson vectors as before for these inputs.
  - Optionally add an assertion that the root pick is exact: e.g. confirm a known cps (hexany `cps([1,3,5,7], 2)`) starts on 1/1 and produces the expected exact fraction set, demonstrating root selection landed on the exact minimum product.

After writing tests, run the FULL suite to confirm no regressions, then prettier-format the test files.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npm run test && npx prettier --check "src/lib/__tests__/*.test.ts" "src/lib/*.ts"</automated>
  </verify>
  <done>monzo.test.ts asserts benedettiHeight bigint + Mercator's-comma exactness; scale.test.ts + edo.test.ts assert no duplicate fraction strings and exactly one trailing 2/1 for high-EDO/low-limit cases; constant-structure.test.ts asserts wrap-around via scale.period (with a discriminating period != last-degree case); interval.test.ts asserts cents finite for a huge fraction + matches old formula for normal ratios; cps.test.ts still green. Full `npm run test` passes; prettier --check clean.</done>
</task>

</tasks>

<verification>
- `npm run lint:types` passes (the benedettiHeight `number`→`bigint` signature change ripples cleanly; no caller does float math on it).
- `npm run test` passes (full suite — no regressions across the 20+ test files).
- `npx prettier --check src/lib/**/*.ts` clean (format:check gate).
- grep confirms: `benedettiHeight(...): bigint` in monzo.ts; `scale.period` in constant-structure.ts; `fraction.compare(min.fraction)` in cps.ts; `this.monzo` in interval.ts cents getter; `new Set<string>` + `toFraction()` dedupe in jiSubsetOfEdo and bestJiInEdo.
- R-01 preserved: no `Fraction` imported from xen-dev-utils anywhere (PRIMES from xen-dev-utils is allowed and was already used in scale.ts).
- Pitfall #1/#6 preserved: dedupe + cps root use exact fraction comparison, never cents-within-epsilon; cents remains a display-only projection.
</verification>

<success_criteria>
- benedettiHeight returns exact bigint; Mercator's-comma test proves exactness past 2^53.
- jiSubsetOfEdo and bestJiInEdo produce zero duplicate fraction strings and exactly one trailing 2/1 period.
- isConstantStructure wrap-around uses scale.period; existing CS anchors still pass.
- Interval.cents is finite for arbitrarily large fractions and matches the old formula within epsilon for normal ratios.
- cps root selection uses exact Fraction.compare; existing CPS vectors unchanged.
- `npm run test` and `npm run lint:types` green; prettier format clean.
</success_criteria>

<output>
Create `.planning/quick/260616-bkm-kernel-precision-round-2-benedettiheight/260616-bkm-SUMMARY.md` when done.
</output>
