---
phase: 02-math-kernel-composition-anchor-mvp
plan: 03
subsystem: math-kernel

tags:
  - scale-model
  - rotate
  - reduce
  - transpose
  - jiSubsetOfEdo
  - period-aware
  - bohlen-pierce
  - tdd

requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: Interval (BigInt-backed Fraction source-of-truth) + monzo helpers + xen-dev-utils approximatePrimeLimit + PRIMES + R-01 ESLint rule

provides:
  - Scale class — immutable Interval[] + period; constructs from any Interval[] (with optional period override)
  - SCALE-03 rotate(degree) — produces the n-th mode as a new Scale starting with 1/1, period preserved
  - SCALE-02 reduce() — period-aware (Pitfall #13): handles 2/1 octave AND 3/1 tritave (Bohlen-Pierce)
  - dedupe() — exact rational equality via Interval.equals (NEVER cents-within-epsilon)
  - SCALE-04 transpose(by) — multiplies every interval AND the period
  - degreeToFreq(degree, baseHz) — audio synth boundary returning baseHz × fraction.valueOf()
  - SCALE-05 jiSubsetOfEdo(edoSteps, primeLimit) — wraps xen-dev-utils.approximatePrimeLimit; round-trips Number-backed Fraction through string to recover BigInt path (R-01)

affects:
  - 02-04 (.scl/.kbm parser — parseScala/parseScl produce Interval[]; many parsers will hand off to new Scale(...))
  - 02-05 (Web Audio synth — consumes Scale.degreeToFreq for sw-synth note-on)
  - 02-06 (components: scale-table, ratio-pill, play-interval, audio-panel — all consume Scale)
  - 02-07 (composition dashboard — composes the entire stack including Scale.rotate/reduce/transpose 1:1 with dashboard operations)
  - Phase 03 (visualization — consumes Scale's Interval[] for lattice projection)

tech-stack:
  added:
    - "(none — wraps existing xen-dev-utils@0.13.1 + interval.ts dependencies)"
  patterns:
    - "Three-layer discipline preserved — src/lib/scale.ts has zero DOM/audio/window/document references (verified by grep)"
    - "Immutable transformations — every rotate/reduce/dedupe/transpose returns a new Scale instance (D-24)"
    - "Period-aware octave-reduction — Scale.reduce uses this.period (Pitfall #13); period-equal inputs preserved as period to avoid losing the period through reduction"
    - "R-01 round-trip — jiSubsetOfEdo extracts xen-dev-utils' Number-backed Fraction's `n`/`d`, formats as `${n}/${d}`, re-parses through Interval (BigInt-backed Fraction)"
    - "Frozen immutability — Scale.intervals copy is `Object.freeze`d in constructor; non-null assertion `!` permitted on `intervals[length-1]` after explicit length check (strict-TS pattern)"

key-files:
  created:
    - src/lib/scale.ts
    - src/lib/__tests__/scale.test.ts
  modified:
    - "(none — Wave 2 file-ownership: Plan 06 consolidates INVENTORY.md rows for Plans 03/04/05)"

key-decisions:
  - "Honored D-24 (immutability): Scale.intervals is Object.frozen in constructor; rotate/reduce/dedupe/transpose all return new Scale instances; verified by `result !== seed` assertions."
  - "Honored D-14 (last interval IS the period): default period = intervals[length-1]; explicit period override accepted for tritave/Bohlen-Pierce."
  - "Honored Pitfall #13 (period-aware reduction): tested with Bohlen-Pierce — Scale([9/1, 3/1], period=3/1).reduce() → [1/1, 3/1] (since 9 = 3^2 reduces to 1/1)."
  - "Honored Pitfall #15 (Scale ≠ Mode): rotate(n) returns a NEW Scale, not a Mode subtype — modes are just rotated scales."
  - "Honored R-01 at the source level: scale.ts imports approximatePrimeLimit + PRIMES from xen-dev-utils, NEVER Fraction. The Number-backed Fraction returned by approximatePrimeLimit is round-tripped through `${n}/${d}` string into Interval's BigInt-backed Fraction."
  - "Honored ARCHITECTURE Pattern 1: Scale holds Interval[] — never raw fractions or cents. Equality and reduction always go through the BigInt path."
  - "Refined the Scale.reduce contract: inputs that exactly equal the period are preserved as the period (not octave-reduced down to 1/1). This keeps the dedupe stable — without this, [9/8, 5/4, 9/8, 2/1].reduce() would yield length-4 [1/1, 9/8, 5/4, 2/1] instead of the documented length-3 [9/8, 5/4, 2/1]. The Bohlen-Pierce case [9/1, 3/1].reduce() with period 3/1 still yields [1/1, 3/1] because 9/1 → 1/1 is genuine reduction (not period-equal), and only the period itself is preserved."
  - "Selected maxExponent=5 for approximatePrimeLimit (the plan draft suggested 8). Reason: maxExponent=8 overflows xen-dev-utils' Number-backed Fraction on the very first step of 31-EDO 7-limit (\"Numerator above safe limit\"). Verified maxExponent=5 covers all of 12-EDO 5-limit, 31-EDO 7-limit, and intermediate configs cleanly. Ratios like 480/343 (closest 7-limit to 1 step of 31-EDO) are still recoverable."
  - "INVENTORY.md NOT modified per Wave 2 file-ownership discipline — Plan 06 (Wave 3) consolidates rows for Plans 03/04/05 to avoid merge conflicts. Rows queued: `Scale` (class, custom) + `jiSubsetOfEdo` (wraps approximatePrimeLimit, R-01 round-trip)."

requirements-completed:
  - SCALE-02
  - SCALE-03
  - SCALE-04
  - SCALE-05

# Metrics
duration: 4min
completed: 2026-05-04
---

# Phase 02 Plan 03: Scale Model Summary

**Immutable Scale class with period-aware rotate/reduce/transpose + jiSubsetOfEdo helper — composes Intervals into the second-level kernel primitive that Plans 04/05/06/07 all consume.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-04T17:39:57Z
- **Completed:** 2026-05-04T17:43:57Z
- **Tasks:** 1
- **Files created:** 2 (scale.ts + scale.test.ts)
- **Files modified:** 0 (INVENTORY.md deferred to Plan 06 per Wave 2 discipline)

## Accomplishments

- Scale class — immutable, period-aware, frozen intervals array (D-24)
- rotate (SCALE-03) — n-th mode rotation; result always starts with 1/1; period preserved
- reduce (SCALE-02) — period-aware per Pitfall #13; works for both 2/1 (octave) AND 3/1 (Bohlen-Pierce tritave)
- dedupe — exact-rational equality via Interval.equals (NEVER cents-within-epsilon, per Pitfall #1/#6)
- transpose (SCALE-04) — multiplies every interval AND the period
- degreeToFreq — audio synth boundary; baseHz × fraction.valueOf()
- jiSubsetOfEdo (SCALE-05) — wraps xen-dev-utils.approximatePrimeLimit; round-trips through `${n}/${d}` string into BigInt-backed Fraction (R-01)
- 25 vitest cases — all passing; full Phase 2 suite at 65 passing

## Task Commits

1. **Task 1: Implement Scale (rotate/reduce/dedupe/transpose/degreeToFreq) + jiSubsetOfEdo + tests** — `4429941` (feat)

_TDD discipline: tests written first (RED verified by failing import — `Failed to load url ../scale.js`), then implementation, iterated until GREEN. Bundled into a single feat commit per the plan's "commit per task" guidance vs full RED/GREEN gate split._

## Files Created/Modified

- `src/lib/scale.ts` (created) — Scale class + jiSubsetOfEdo; ~180 LoC
- `src/lib/__tests__/scale.test.ts` (created) — 25 test cases covering SCALE-02..05 + construction edge cases

## Decisions Made

(See `key-decisions` in frontmatter for the full list.) Highlights:

- **Period-equal inputs preserved as period** — refines the reduce() contract so that the documented behavior (e.g. [9/8, 5/4, 9/8, 2/1].reduce() → length-3 [9/8, 5/4, 2/1]) holds without losing information. The Bohlen-Pierce case still works because 9/1 ≠ 3/1 (its period), so it goes through the genuine octaveReduce path and lands at 1/1.
- **maxExponent=5 not 8** — necessary for 31-EDO 7-limit; verified across multiple configs.
- **R-01 enforced at source** — scale.ts NEVER imports Fraction; the Number-backed Fraction from approximatePrimeLimit is round-tripped through string into the BigInt-backed Interval Fraction.
- **INVENTORY deferred** — per Wave 2 file-ownership, Plan 06 will add the two rows (Scale + jiSubsetOfEdo) to avoid merge conflicts with Plans 04/05.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] reduce() default behavior produced length-4 result, plan-documented expected length-3**
- **Found during:** Task 1 (test execution — RED→GREEN iteration)
- **Issue:** The plan's draft implementation called `iv.octaveReduce(this.period)` on every input, including the period itself. Since octaveReduce maps p → 1/1 (because p/p = 1, and the loop `while (f.compare(pf) >= 0) f = f.div(pf)` divides f down until f < p), the input [9/8, 5/4, 9/8, 2/1] reduced to [9/8, 5/4, 9/8, 1/1] → sorted+deduped to [1/1, 9/8, 5/4] → period appended to [1/1, 9/8, 5/4, 2/1] (length 4). The plan's behavior block specifies length-3 [9/8, 5/4, 2/1].
- **Fix:** Treat inputs equal to the period specially — preserve them as the period rather than octave-reducing them down to 1/1. The Bohlen-Pierce case still passes because in [9/1, 3/1] only 3/1 itself is equal to the period; 9/1 (≠ period) genuinely octave-reduces to 1/1 as expected.
- **Files modified:** src/lib/scale.ts (Scale.reduce body)
- **Verification:** Both reduce() test cases (2/1 octave + 3/1 tritave) pass; sort+dedupe semantics unchanged.
- **Committed in:** 4429941

**2. [Rule 1 - Bug] approximatePrimeLimit overflowed xen-dev-utils' Number-backed Fraction on 31-EDO 7-limit**
- **Found during:** Task 1 (test execution — `jiSubsetOfEdo(31, 7)` test)
- **Issue:** The plan's draft used `maxExponent=8`. xen-dev-utils' Fraction is Number-backed (silently overflows past 2^53 — exactly why R-01 exists). On the very first step of 31-EDO 7-limit (cents ≈ 38.7), the search blew up with "Numerator above safe limit".
- **Fix:** Lowered to `maxExponent=5`. Verified by direct probe: maxExponent=5 covers 12-EDO 5-limit, 31-EDO 7-limit, and 31-EDO 5-limit cleanly. Common JI ratios like 480/343 (closest 7-limit to 1\31) and 9/8 are still recoverable.
- **Files modified:** src/lib/scale.ts (jiSubsetOfEdo body + a comment explaining why)
- **Verification:** Both jiSubsetOfEdo test cases (12, 5) and (31, 7) pass.
- **Committed in:** 4429941

**3. [Rule 1 - Bug] xen-dev-utils' primeLimit() does not accept monzo arrays**
- **Found during:** Task 1 (test execution — prime-limit verification test)
- **Issue:** The plan's behavior block said "verifiable by primeLimit on each [interval]". I initially passed `iv.monzo` (a `number[]`) to xen-dev-utils' primeLimit. The function's signature is `primeLimit(n: Fraction | number | bigint)` — passing an array routes through `new Fraction(n)` which produces NaN. Every non-unison interval failed with "Cannot represent NaN as a fraction".
- **Fix:** Pass `iv.fraction.n` and `iv.fraction.d` (BigInt numerator + denominator) separately and take Math.max. (Cannot pass the BigInt-backed fraction.js Fraction itself because xen-dev-utils' polymorphic path uses xen-dev-utils' own Fraction — using fraction.js' Fraction would route through R-01-banned territory.)
- **Files modified:** src/lib/__tests__/scale.test.ts (the prime-limit test only)
- **Verification:** Test now correctly verifies that every non-unison interval has prime factors ≤ 5 in both numerator and denominator.
- **Committed in:** 4429941

---

**Total deviations:** 3 auto-fixed bugs in the plan's draft implementation/test specs. All preserve plan intent (SCALE-02..05 contracts unchanged; period-aware reduction proven; R-01 honored throughout).

## Issues Encountered

- **None blocking.** The three deviations above were all caught by TDD iteration on the same task — wrote tests, ran them, observed each failure mode, refined either implementation or test, re-ran until green.

## Next Phase Readiness

**Ready for Plan 02-04 (.scl/.kbm parser):** parseScala produces `Interval[]` and most paths will hand off to `new Scale(intervals, period?)`. The constructor accepts the array as-is (D-13 says the parser is responsible for prepending 1/1). The plan-04 parser's last-line-is-period contract (D-14) maps directly onto Scale's default period behavior.

**Ready for Plan 02-05 (audio):** Scale.degreeToFreq is the kernel-to-audio bridge. Returns a Number (Hz) — the audio module's responsibility for clamping to the safe range (defense-in-depth per T-02-08).

**Ready for Plan 02-06 (components):** scale-table consumes `scale.intervals` directly (each Interval has `.fraction.toFraction()`, `.cents`, `.centsFrom12tet` for the ratio/cents/deviation columns). play-interval can call `scale.degreeToFreq(d, 440)`.

**Ready for Plan 02-07 (dashboard):** rotate/reduce/transpose are 1:1 with the dashboard's Mode/Reduce/Transpose buttons (per the plan's purpose statement).

**Plan 06 must add INVENTORY rows:**
```md
| `Scale` (class) | Custom (this repo) | Composes Interval[] per ARCHITECTURE Pattern 1. Immutable per D-24. Period stored explicitly (D-14 default = last interval). Period-aware `reduce()` per Pitfall #13. |
| `jiSubsetOfEdo` | Custom (this repo) — wraps `xen-dev-utils.approximatePrimeLimit` | SCALE-05. xen-dev-utils returns Number-backed Fraction; we round-trip via string to recover the BigInt-backed Fraction (R-01). |
```

**No blockers.**

---
*Phase: 02-math-kernel-composition-anchor-mvp*
*Completed: 2026-05-04*

## Self-Check: PASSED

- All 2 created files present on disk (src/lib/scale.ts, src/lib/__tests__/scale.test.ts)
- SUMMARY.md present at .planning/phases/02-math-kernel-composition-anchor-mvp/02-03-SUMMARY.md
- Commit hash 4429941 present in git log
