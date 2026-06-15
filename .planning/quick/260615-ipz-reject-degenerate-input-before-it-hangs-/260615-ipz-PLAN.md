---
phase: quick-260615-ipz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/interval.ts
  - src/lib/scala.ts
  - src/lib/diamond.ts
  - src/lib/cps.ts
  - src/lib/meru.ts
  - src/lib/mos.ts
  - src/lib/__tests__/interval.test.ts
  - src/lib/__tests__/scala.test.ts
  - src/lib/__tests__/diamond.test.ts
  - src/lib/__tests__/cps.test.ts
  - src/lib/__tests__/meru.test.ts
  - src/lib/__tests__/mos.test.ts
autonomous: true
requirements: [HARDEN-DEGENERATE-INPUT]

must_haves:
  truths:
    - "octaveReduce on a non-positive fraction (this.fraction <= 0 — i.e. .s < 0n or .n === 0n) throws RangeError BEFORE entering the reduce loop"
    - "octaveReduce still correctly reduces valid sub-unison ratios (1/2 -> 1/1, 3/5 -> 6/5) — the non-positive guard does NOT over-reject fractions in (0, 1)"
    - "parsePitchToken('0') and parsePitchToken('0/1') throw with a 'positive' message"
    - "parsePitchToken('5/0') and parsePitchToken('0/5') throw with a 'positive' message (NOT a raw fraction.js 'Division by Zero')"
    - "parsePitchToken of a cents token with |cents| > 1_000_000 (e.g. '2000000.0') throws with a 'cents out of range' message"
    - "parsePitchToken of an in-range cents token (e.g. '1000000.0', '408.0') still parses successfully"
    - "cps() rejects a factor set containing a non-positive Interval (0/1 or -3/2) with a RangeError before enumeration"
    - "enumerateDiamond() rejects an even oddLimit (e.g. 8) with a clear error"
    - "meruScale() rejects negative coefficients a or b that would drive the recurrence non-positive, with a RangeError"
    - "buildMos() rejects a generator that octave-reduces to 1/1 under the period (e.g. gen 2/1, period 2/1; gen 4/1, period 2/1) the same way it rejects generator === period"
    - "`npm run test` is green and `npm run lint:types` (tsc --noEmit) passes with no new errors"
  artifacts:
    - path: "src/lib/interval.ts"
      provides: "octaveReduce non-positive-fraction RangeError guard"
      contains: "RangeError"
    - path: "src/lib/scala.ts"
      provides: "parsePitchToken positive-ratio + cents-magnitude guards"
      contains: "cents out of range"
    - path: "src/lib/cps.ts"
      provides: "cps factor positivity guard"
      contains: "RangeError"
    - path: "src/lib/diamond.ts"
      provides: "enumerateDiamond even-oddLimit rejection"
    - path: "src/lib/meru.ts"
      provides: "meruScale coefficient/term positivity guard"
    - path: "src/lib/mos.ts"
      provides: "buildMos generator-reduces-to-unison rejection"
    - path: "src/lib/__tests__/interval.test.ts"
      provides: "pinning tests for octaveReduce non-positive guard + sub-unison regression"
    - path: "src/lib/__tests__/scala.test.ts"
      provides: "pinning tests for zero/negative ratio + cents-out-of-range rejection"
    - path: "src/lib/__tests__/cps.test.ts"
      provides: "pinning test for non-positive factor rejection"
    - path: "src/lib/__tests__/diamond.test.ts"
      provides: "pinning test for even-oddLimit rejection"
    - path: "src/lib/__tests__/meru.test.ts"
      provides: "pinning test for negative-coefficient rejection"
    - path: "src/lib/__tests__/mos.test.ts"
      provides: "pinning test for generator-reduces-to-1/1 rejection"
  key_links:
    - from: "src/lib/scala.ts parsePitchToken ratio branch"
      to: "src/lib/interval.ts octaveReduce"
      via: "rejecting non-positive ratios at the parse boundary prevents the non-positive Interval ever reaching octaveReduce"
      pattern: "positive"
    - from: "src/lib/cps.ts cps()"
      to: "src/lib/interval.ts mul/octaveReduce"
      via: "factor positivity guard prevents non-positive products feeding octaveReduce"
      pattern: "RangeError"
---

<objective>
Input-validation hardening across the JI math/parsing kernel: reject degenerate
input at the boundary so it can no longer hang (infinite loop) or silently
corrupt the kernel (NaN / Infinity / 0 Hz). Every rejection gets a pinning test.

Purpose: A non-positive ratio, an out-of-range cents value, a non-positive
factor, an even odd-limit, or a generator that collapses to the unison must
fail-closed with a clear, typed error — not propagate into octaveReduce loops,
`Infinity -> BigInt` throws deep in the kernel, or 0 Hz notes.

Output: Six hardened kernel modules + six extended Vitest specs. No behavior
change for valid (positive, in-range) inputs.

GROUNDING NOTES (verified against the code — read before executing):
- interval.ts: The reporter's premise ("loops forever when this.fraction <= 1/1")
  is WRONG. The loop `while (f.compare(one) < 0) f = f.mul(pf)` reduces valid
  sub-unison ratios (1/2, 3/5) correctly and terminates. The diamond DEPENDS on
  this: enumerateDiamond reduces i/j where i<j (e.g. 3/5 -> 6/5). The REAL hang
  is a NON-POSITIVE fraction (<= 0): `f.compare(one) < 0` stays true forever
  because `f.mul(pf)` keeps it negative/zero. Therefore the guard must reject
  `this.fraction <= 0` (sign `.s < 0n` OR `.n === 0n`), NOT `compare(one) <= 0`.
  Using the reporter's `compare(one) <= 0` would break the diamond (over-reject
  every cell where i<j). The existing period<=1/1 guard is unrelated and stays.
- meru.ts: seeds x0,x1 <= 0n are ALREADY guarded. The remaining gap is negative
  coefficients a/b driving a later recurrence term non-positive — guard those.
- diamond i/j is always positive (odd ints only), so diamond needs only the
  even-oddLimit handling, not a factor-positivity guard.

ERROR IDIOM (matched to existing code): `RangeError` for kernel range/guard
violations (interval, cps, meru, mos, diamond all already use RangeError); plain
`Error` for scala parser rejections (parsePitchToken's existing throws are
`new Error(...)`).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

@src/lib/interval.ts
@src/lib/scala.ts
@src/lib/diamond.ts
@src/lib/cps.ts
@src/lib/meru.ts
@src/lib/mos.ts
@src/lib/__tests__/interval.test.ts
@src/lib/__tests__/scala.test.ts
@src/lib/__tests__/diamond.test.ts

<interfaces>
<!-- Verified against the codebase + a live fraction.js probe. Use directly — no exploration needed. -->

fraction.js (v5.3.4, BigInt-backed — imported via `import { Fraction } from "fraction.js"`):
  - Fraction.n: bigint   // numerator magnitude (ALWAYS >= 0n; sign lives in .s)
  - Fraction.d: bigint   // denominator magnitude (> 0n)
  - Fraction.s: bigint   // sign: -1n for negative, 1n otherwise (INCLUDING zero)
  - Fraction.compare(other): -1 | 0 | 1
  - new Fraction(5, 0) THROWS Error("Division by Zero")  // so 5/0 must be caught BEFORE construction
  - new Fraction(0, 1): { n: 0n, d: 1n, s: 1n }, compare(one) === -1
  - NON-POSITIVE TEST for a Fraction f:  f.s < 0n || f.n === 0n

Interval (src/lib/interval.ts):
  - new Interval(input: FractionInput)         // string | bigint | number | {n,d} | Fraction
  - Interval.fraction: Fraction (readonly)
  - Interval.octaveReduce(period?: Interval): Interval   // default period 2/1
  - Interval.mul/div/inv/equals
  - `one` inside octaveReduce is a local `new Fraction(1n, 1n)` — reuse it for the guard.

scala.ts parsePitchToken (internal, NOT exported — test via the exported parseScala):
  - parseScala(body) auto-prepends 1/1 then calls parsePitchToken per pitch line.
  - Test a token "X" by calling `parseScala("X")` and asserting it throws.
  - Ratio regex already in place: /^\d+(\/\d+)?$/ ; bare int -> "N/1".
  - Cents branch: `tok.includes(".")`, parsed via `centsToValue(Number(tok))`.

cps.ts:  cps(factors: Interval[], k: number, period = new Interval("2/1")): Scale
diamond.ts:  enumerateDiamond(oddLimit: number, scale: Scale): DiamondCell[]
meru.ts:  meruScale(a: bigint, b: bigint, x0: bigint, x1: bigint, terms: number): Scale
mos.ts:  buildMos(generator: Interval, period: Interval, size: number): Scale
         ONE = new Interval("1/1") already a module const; existing guard is
         `if (generator.equals(period)) return new Scale([period], period);`
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Harden interval.ts + scala.ts (the #2/#12 hang & corruption guards)</name>
  <files>src/lib/interval.ts, src/lib/scala.ts, src/lib/__tests__/interval.test.ts, src/lib/__tests__/scala.test.ts</files>
  <behavior>
    interval.ts octaveReduce:
    - octaveReduce() on `new Interval("0/1")` throws RangeError (message mentions "positive" or "non-positive")
    - octaveReduce() on `new Interval("-3/2")` throws RangeError
    - REGRESSION (must still pass): octaveReduce() on "1/2" returns 1/1; on "3/5" returns 6/5; on "9/4" returns 9/8 (existing test, unchanged)
    - Existing period<=1/1 RangeError tests still pass (untouched guard)
    scala.ts parsePitchToken (tested via parseScala):
    - parseScala("0") throws /positive/i
    - parseScala("0/1") throws /positive/i
    - parseScala("5/0") throws /positive/i  (and NOT a raw "Division by Zero")
    - parseScala("0/5") throws /positive/i
    - parseScala("2000000.0") throws /cents out of range/i
    - parseScala("-2000000.0") throws /cents out of range/i  (sign-symmetric bound)
    - parseScala("1000000.0") parses successfully (boundary is inclusive at the cap, reject only when ABS > 1_000_000)
    - REGRESSION: parseScala("408.0") still parses to ~408 cents; parseScala("9/8") still parses; bare "2" still parses
  </behavior>
  <action>
    interval.ts — In `octaveReduce`, AFTER the existing period<=1/1 guard and AFTER `let f = this.fraction`, add a guard that throws `RangeError` when `f` is non-positive, using the SAME local `one` already in scope only for context; the actual non-positive test must be sign/zero based (compare-to-one is wrong here — it would reject valid sub-unison input the diamond needs). Condition: `f.s < 0n || f.n === 0n`. Message e.g. `Interval.octaveReduce: cannot reduce a non-positive ratio (got ${f.toFraction()})`. Place it BEFORE the two while-loops. Do NOT change the loops or the period guard. This fixes the true infinite-loop (issue #2) without touching the valid (0,1) path.

    scala.ts — In `parsePitchToken`:
    (a) Cents branch: after computing `const cents = Number(tok)` and the existing `Number.isFinite` check, add a magnitude bound. Define a module-level constant near the other caps (MAX_INPUT_BYTES etc.): `const MAX_ABS_CENTS = 1_000_000;` with an inline comment explaining it's a sanity bound that fails fast with a clear message instead of letting an enormous/near-Infinity cents value blow up later as a confusing `Infinity -> BigInt` throw deep in the kernel. Then: `if (Math.abs(cents) > MAX_ABS_CENTS) throw new Error(\`parsePitchToken: cents out of range "${tok}" (max magnitude ${MAX_ABS_CENTS})\`);`. Keep the bound INCLUSIVE (reject only when strictly greater).
    (b) Ratio branch: after the negative-`-` check and the `^\d+(\/\d+)?$` regex match, BEFORE constructing `new Interval(ratioStr)`, parse the numeric parts and reject non-positive. Since the regex guarantees `\d+(/\d+)?`, split on "/": numerator = first part, denominator = second part or "1". Reject when `Number(numerator) <= 0 || Number(denominator) <= 0` (covers "0", "0/1", "5/0", "0/5"). Message e.g. `parsePitchToken: ratio "${tok}" must be positive (numerator and denominator > 0)`. This MUST run before `new Interval` so "5/0" never reaches fraction.js (which would throw the opaque "Division by Zero"). Use a plain `Error` to match the surrounding parser idiom.

    Tests — Extend the EXISTING spec files (do not create new ones), matching their `describe/it/expect` + `.toThrowError(/regex/i)` style:
    - interval.test.ts: add an `it(...)` for octaveReduce on "0/1" and "-3/2" throwing RangeError, PLUS a positive regression `it(...)` asserting "1/2" -> "1/1" and "3/5" -> "6/5" still reduce correctly (guards the over-reject failure mode).
    - scala.test.ts: add a `describe("degenerate ratio + cents rejection (260615-ipz)")` block covering "0", "0/1", "5/0", "0/5" (each /positive/i), "2000000.0" and "-2000000.0" (/cents out of range/i), and a positive case "1000000.0" that does NOT throw and a "408.0" that still parses.
    NEVER place fenced code blocks in this action — write the tests in the spec files directly.
  </action>
  <verify>
    <automated>npm run test -- src/lib/__tests__/interval.test.ts src/lib/__tests__/scala.test.ts && npm run lint:types</automated>
  </verify>
  <done>octaveReduce throws RangeError for non-positive ratios but still reduces (0,1) ratios; parsePitchToken rejects zero/non-positive ratios and out-of-range cents with clear messages; all new + existing interval/scala tests green; tsc --noEmit clean.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Positivity + degenerate guards for cps.ts, diamond.ts, meru.ts, mos.ts</name>
  <files>src/lib/cps.ts, src/lib/diamond.ts, src/lib/meru.ts, src/lib/mos.ts, src/lib/__tests__/cps.test.ts, src/lib/__tests__/diamond.test.ts, src/lib/__tests__/meru.test.ts, src/lib/__tests__/mos.test.ts</files>
  <behavior>
    cps.ts:
    - cps([new Interval("1/1"), new Interval("0/1")], 2) throws RangeError /positive/i
    - cps([new Interval("3/1"), new Interval("-5/1")], 2) throws RangeError /positive/i
    - REGRESSION: cps([1/1,3/1,5/1,7/1], 2) (the hexany) still returns a Scale with 7 entries (6 degrees + period) — existing behavior unchanged
    diamond.ts:
    - enumerateDiamond(8, scale) throws (even oddLimit) with a clear message
    - REGRESSION: enumerateDiamond(7, scale) still yields 16 cells (existing test unchanged)
    meru.ts:
    - meruScale(-1n, 1n, 1n, 1n, 5) throws RangeError /positive/i  (negative coefficient a)
    - meruScale(1n, -5n, 1n, 1n, 5) throws RangeError  (negative coefficient b that drives a term non-positive)
    - REGRESSION: meruScale(1n, 1n, 1n, 1n, 6) (Fibonacci) still returns the expected convergents — existing test unchanged
    mos.ts:
    - buildMos(new Interval("2/1"), new Interval("2/1"), 7) is rejected the SAME way generator===period is (gen octave-reduces to 1/1)
    - buildMos(new Interval("4/1"), new Interval("2/1"), 7) is also rejected (4/1 reduces to 1/1 under 2/1) — this is the case generator.equals(period) MISSES
    - REGRESSION: buildMos(3/2, 2/1, 7) still returns the Pythagorean Ionian 8-entry scale — existing test unchanged
  </behavior>
  <action>
    cps.ts — In `cps()`, AFTER the existing factors.length and k caps and BEFORE `kCombinations`, add a positivity guard over `factors`: reject if any factor is non-positive. Test each factor's Fraction: `if (factors.some((f) => f.fraction.s < 0n || f.fraction.n === 0n)) throw new RangeError("cps: all factors must be positive ratios (> 0)")`. (A non-positive factor would multiply into a non-positive product and then hit octaveReduce's new guard, but cps should fail closed at its own boundary with a domain-specific message.)

    diamond.ts — In `enumerateDiamond()`, extend the existing oddLimit validation. The existing range check is `!Number.isInteger(oddLimit) || oddLimit < 1 || oddLimit > 1023`. Add an even-oddLimit rejection as the smaller/clearer choice (vs silently flooring): after the range check, `if (oddLimit % 2 === 0) throw new RangeError(\`enumerateDiamond: oddLimit must be odd (got ${oddLimit}); even limits are ambiguous — use the next lower odd value\`)`. Update the function's doc comment to state oddLimit must be odd. Rationale to record in SUMMARY: rejecting is clearer than flooring because the diamond's odd-limit IS its defining parameter; silently flooring 8->7 would mask user error.

    meru.ts — In `meruScale()`, the seed guard (x0,x1<=0n) already exists. Add a coefficient guard so negative a/b cannot drive the recurrence non-positive. Two-part, fail-closed:
    (1) After the seed guard, reject clearly-degenerate coefficients: `if (a < 0n || b < 0n) throw new RangeError(\`meruScale: coefficients a, b must be non-negative (got ${a}, ${b})\`)`. (a and b are the recurrence weights; a negative weight can produce a non-positive or sign-flipping term. Non-negative is the safe musical domain — Fibonacci/metallic recurrences use positive coefficients.)
    (2) Defense in depth inside the loop: after computing `next`, also reject non-positive terms before pushing: `if (next <= 0n) throw new RangeError(\`meruScale: recurrence produced a non-positive term ${next} at step ${i} (degenerate seeds/coefficients)\`)`. Place this alongside the existing MAX_MERU_MAGNITUDE check.

    mos.ts — In `buildMos()`, the existing degenerate guard is `if (generator.equals(period)) return new Scale([period], period)`. Replace the `equals(period)` test with a "reduces to unison" test so it also catches generators like 2/1 or 4/1 under period 2/1 that octave-reduce to 1/1. Compute `const reducedGen = generator.octaveReduce(period)` (safe: period>1/1 already validated above; generator must be positive — see note) and branch on `reducedGen.equals(ONE)`. Keep returning `new Scale([period], period)` for that degenerate case (D-29 single-pitch contract preserved). NOTE: if `generator` could be non-positive, octaveReduce would now throw — that is acceptable fail-closed behavior, but to keep the existing single-pitch contract for the documented degenerate inputs, only call octaveReduce here; do NOT add a separate positivity throw unless a test shows a regression. Update the D-29 header comment block ("generator equals period -> ...") to read "generator octave-reduces to 1/1 -> single-pitch (just the period)".

    Tests — Extend each EXISTING spec (cps.test.ts, diamond.test.ts, meru.test.ts, mos.test.ts) with the rejection + regression cases from <behavior>, matching the file's existing style. Each rejection asserts the throw (and error type RangeError where applicable, via `.toThrowError(RangeError)` or `.toThrowError(/positive/i)`). For mos, assert BOTH gen=2/1 and gen=4/1 (period 2/1) hit the single-pitch / degenerate path the same way, and keep the existing 3/2 Pythagorean regression passing.
  </action>
  <verify>
    <automated>npm run test -- src/lib/__tests__/cps.test.ts src/lib/__tests__/diamond.test.ts src/lib/__tests__/meru.test.ts src/lib/__tests__/mos.test.ts && npm run lint:types</automated>
  </verify>
  <done>cps rejects non-positive factors; enumerateDiamond rejects even oddLimit; meruScale rejects negative coefficients and non-positive recurrence terms; buildMos rejects generators that octave-reduce to 1/1; all new + existing tests for these four modules green; tsc --noEmit clean.</done>
</task>

<task type="auto">
  <name>Task 3: Full-suite verification + format/lint gate</name>
  <files>(no source changes — verification only)</files>
  <action>
    Run the full project CI-equivalent gates to prove nothing regressed across the
    whole kernel and the new tests are wired in: type-check, full test suite,
    lint, and format check. If `npm run format:check` flags the edited files, run
    `npm run format` to apply Prettier (the project's formatter) and re-run the
    check. Do NOT change any guard behavior in this task — formatting only. If any
    pre-existing unrelated test is red BEFORE your changes, note it in the SUMMARY
    rather than "fixing" out-of-scope code.
  </action>
  <verify>
    <automated>npm run lint:types && npm run test && npm run lint && npm run format:check</automated>
  </verify>
  <done>`npm run lint:types`, `npm run test`, `npm run lint`, and `npm run format:check` all pass. The 6 new rejection groups are green within the full suite; no prior tests regressed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| dashboard textarea / .scl upload -> parsePitchToken | Untrusted pitch tokens (ratios, cents, monzos) cross into the kernel here |
| component caller -> cps/diamond/meru/mos builders | UI-supplied factor sets, odd-limits, coefficients, generators cross into BigInt math |
| kernel value -> octaveReduce loop | A non-positive Fraction reaching the reduce loop is the hang surface |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-ipz-01 | Denial of Service | interval.octaveReduce | mitigate | Throw RangeError for non-positive `this.fraction` (`.s < 0n || .n === 0n`) before the while-loops — kills the infinite-loop hang (Task 1) |
| T-ipz-02 | Denial of Service | scala.parsePitchToken (cents) | mitigate | Bound `|cents| <= 1_000_000`; reject above to avoid `Infinity -> BigInt` blowups deep in the kernel (Task 1) |
| T-ipz-03 | Tampering | scala.parsePitchToken (ratio) | mitigate | Reject 0 / non-positive numerator or denominator before `new Interval`, preventing 0 Hz notes and the opaque fraction.js "Division by Zero" for `N/0` (Task 1) |
| T-ipz-04 | Tampering | cps / meru | mitigate | Reject non-positive factors (cps) and negative coefficients / non-positive recurrence terms (meru) at the builder boundary (Task 2) |
| T-ipz-05 | Tampering | diamond / mos | mitigate | Reject even oddLimit (diamond); reject generators that octave-reduce to 1/1 (mos) — fail closed on degenerate parameters (Task 2) |
| T-ipz-SC | Tampering | npm/pip/cargo installs | accept | No new dependencies are installed by this plan (guards + tests only use existing fraction.js / vitest). No package-legitimacy gate required. |
</threat_model>

<verification>
- Each of the six rejections has at least one pinning test asserting the throw (and error type/message where specified).
- Each rejected case that borders a valid case has a paired positive regression test (octaveReduce sub-unison; cents at the 1,000,000 boundary; hexany; diamond oddLimit 7; Fibonacci meru; Pythagorean mos) so we do not over-reject.
- `npm run lint:types` (tsc --noEmit) is clean — strict flags (noUncheckedIndexedAccess etc.) satisfied.
- `npm run test` full suite green; `npm run lint` and `npm run format:check` pass (Task 3).
</verification>

<success_criteria>
- octaveReduce(non-positive) throws RangeError BEFORE the loop; (0,1) reduction unchanged.
- parsePitchToken rejects 0/non-positive ratios and |cents|>1,000,000 with clear messages; valid inputs unchanged.
- cps rejects non-positive factors; diamond rejects even oddLimit; meru rejects negative coefficients + non-positive terms; mos rejects generators that reduce to 1/1.
- No behavior change for valid (positive, in-range) inputs — all pre-existing tests still pass.
- Full CI gate (lint:types, test, lint, format:check) green.
</success_criteria>

<output>
Create `.planning/quick/260615-ipz-reject-degenerate-input-before-it-hangs-/260615-ipz-SUMMARY.md` when done.
Record in the SUMMARY: the interval.ts discrepancy (reporter said "loops on <=1/1"; actual fix guards non-positive `<=0` to avoid breaking the diamond's sub-unison reduction), the chosen diamond even-oddLimit disposition (reject, not floor), and the meru coefficient policy (non-negative a/b + per-term non-positive guard).
</output>
