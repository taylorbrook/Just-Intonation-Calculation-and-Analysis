---
phase: 02-math-kernel-composition-anchor-mvp
plan: 02
subsystem: math-kernel

tags:
  - interval
  - monzo
  - cents
  - commas
  - fraction.js
  - xen-dev-utils
  - bigint
  - tdd

requires:
  - phase: 01-bootstrap-build
    provides: Observable Framework + TypeScript-strict + Vitest + ESLint R-01 rule + fraction.js@5.3.4 + xen-dev-utils@0.13.1
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: KaTeX head injection + extended Vitest glob + R-01 lint rule + .scl fixture corpus (from Plan 01)

provides:
  - Interval class — BigInt-backed Fraction source-of-truth with lazy monzo + cents getters and immutable arithmetic (mul/div/inv/octaveReduce)
  - Period-aware octaveReduce(period?) supporting 2/1, 3/1, and arbitrary periods (Pitfall #13)
  - Monzo helper module — re-exports of xen-dev-utils helpers + custom benedettiHeight + oddLimit
  - Cents projection helpers — toCents(value|monzo), centsFrom12tet (display-only per Pitfall #1)
  - Named-commas table — 16 hand-verified entries (5-/7-/11-limit + Mercator's) with canonical-monzo lookup
  - INVENTORY.md rows for every new export (Pitfall #5 wrap-don't-reimplement discipline)

affects:
  - 02-03 (Scale class — consumes Interval)
  - 02-04 (.scl/.kbm parser — consumes Interval, parseScala/parseScl produce Interval[])
  - 02-05 (Web Audio synth integration — consumes Interval.fraction.valueOf())
  - 02-06 (components: scale-table, ratio-pill, play-interval, audio-panel — consume Interval)
  - 02-07 (composition dashboard page — composes the entire stack)
  - Phase 03 (visualization — consumes Interval.monzo for lattice projection)

tech-stack:
  added:
    - "(none — kernel only consumes existing fraction.js@5.3.4 and xen-dev-utils@0.13.1 dependencies)"
  patterns:
    - "Three-layer discipline: src/lib/*.ts has zero DOM/audio/window/document references (verified by grep)"
    - "BigInt source-of-truth + lazy lossy projections (monzo cache, cents cache)"
    - "Immutable interval arithmetic — every mul/div/inv/octaveReduce returns a new Interval instance (D-24)"
    - "Canonical-monzo lookup for commas (NEVER cents-within-epsilon — Pitfall #1, #6)"
    - "INVENTORY-row-per-symbol with explicit Source column (Custom OR upstream-package@version)"
    - "Wrap-don't-reimplement: monzo.ts is a thin re-export layer; only oddLimit + benedettiHeight are hand-written (with rationale in INVENTORY)"

key-files:
  created:
    - src/lib/interval.ts
    - src/lib/monzo.ts
    - src/lib/cents.ts
    - src/lib/commas.ts
    - src/lib/__tests__/interval.test.ts
    - src/lib/__tests__/monzo.test.ts
    - src/lib/__tests__/cents.test.ts
    - src/lib/__tests__/commas.test.ts
  modified:
    - src/lib/INVENTORY.md

key-decisions:
  - "Honored R-01 at the source level: src/lib/interval.ts uses `import { Fraction } from \"fraction.js\"` (NEVER from xen-dev-utils). Defense-in-depth alongside Plan 01's ESLint rule."
  - "Honored D-24 (immutability): mul/div/inv/octaveReduce all construct new Interval instances; tested with referential-inequality assertions."
  - "Honored Pitfall #13 (period-aware reduction): Interval.octaveReduce(period?) defaults to 2/1 but accepts arbitrary periods. Test covers 9/1 reduced by 3/1 → 1/1."
  - "Honored Pitfall #1 (cents is display-only): cents getter wraps `Number(fraction.valueOf())` and is documented as lossy; centsFrom12tet is a one-line projection on cents; both are downstream-of-Fraction, never inputs to kernel arithmetic."
  - "Honored Pitfall #6 (canonical-monzo distinguishes commas): nameForMonzo([-4, 4, -1]) returns syntonic comma; the very-close-in-cents schisma [-15, 8, 1] returns schisma — they CANNOT be conflated by float tolerance."
  - "Honored Pitfall #14 (length-tolerant monzo equality): all monzosEqual calls — including in nameForMonzo — work across padded/unpadded monzos. Tested with [-4, 4, -1] vs [-4, 4, -1, 0]."
  - "Honored D-21 (15+ commas, hand-curated TS constant): 16 entries in src/lib/commas.ts as a frozen TS array — no JSON loader yet (will promote at ~100-entry threshold)."
  - "Curated 16 commas: dropped 4 unverified candidates from the planner's draft (septimal semicomma, septimal sixth-tone, undecimal kleisma, tridecimal third-tone) and substituted verified entries (harmonic seventh comma 49/48, jubilisma 50/49, breedsma 2401/2400). Each entry was hand-verified by reconstructing its ratio via monzoToBigNumeratorDenominator."
  - "Honored Pitfall #5 (wrap-don't-reimplement) + Phase-1 D-08: 8 INVENTORY rows added — every new symbol has Source + Notes."
  - "Mercator's comma uses canonical direction [-84, 53] (= 3^53/2^84, ~3.615¢) — not the planner's draft [84, -53] which was the inverse. Verified output: 19383245667680019896796723/19342813113834066795298816, a 25-digit numerator that round-trips exactly through the BigInt path. Live proof of why R-01 matters."
  - "Used `import { Fraction } from \"fraction.js\"` (named) rather than the default-import form, so the acceptance-criteria grep matches and the version pin is unambiguous."

patterns-established:
  - "Pattern: lazy-cache property — `get monzo()` and `get cents()` use private `#monzo?` / `#cents?` fields populated on first access. Strict-TS-compatible (no exactOptionalPropertyTypes violation; only assigned once)."
  - "Pattern: monzo-of-fraction — for fractions with negative exponents, compute `toMonzo(n) - toMonzo(d)` length-tolerantly. Captured in private monzoOfFraction helper."
  - "Pattern: comma table = TS-constant + canonical monzo — frozen `readonly CommaEntry[]` indexed by exact monzo (not cents). Promoted to data loader only at ~100-entry threshold."
  - "Pattern: TDD RED-then-GREEN within a single feat commit — tests written first, RED verified by failing-import, then source written, GREEN verified by passing tests, all bundled in one task commit (per the plan's 'commit per task' guidance vs full RED/GREEN gate split)."

requirements-completed:
  - MATH-01
  - MATH-02
  - MATH-03
  - MATH-04
  - MATH-05
  - MATH-06

# Metrics
duration: 6min
completed: 2026-05-04
---

# Phase 02 Plan 02: JI Math Kernel Summary

**BigInt-backed Interval class + monzo/cents helpers + 16 hand-verified named commas — the universal currency every later Phase-2 plan composes against.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-04T17:28:49Z
- **Completed:** 2026-05-04T17:34:31Z
- **Tasks:** 2
- **Files modified:** 9 (8 created + 1 modified)

## Accomplishments

- Interval class with BigInt source-of-truth (R-01 enforced at source level)
- Period-aware octaveReduce — handles 2/1, 3/1, and arbitrary periods
- Immutable arithmetic (mul/div/inv/octaveReduce) per D-24, with referential-inequality test coverage
- Lazy monzo + cents caches; cents documented and tested as display-projection only
- xen-dev-utils helpers re-exported via monzo.ts; custom oddLimit + benedettiHeight added with INVENTORY rationale
- 16 hand-verified commas in commas.ts spanning 5-/7-/11-limit JI plus Mercator's 53-tone comma — Mercator's 25-digit ratio round-trips exactly through the BigInt path
- 40 unit tests across 4 test files; all passing
- INVENTORY.md updated with 8 new Phase-2 rows (one per new symbol/group)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Interval (BigInt source-of-truth) + monzo + cents kernel modules with tests** — `468930c` (feat)
2. **Task 2: Named-commas table (commas.ts) + tests; finalize Phase 2 INVENTORY rows** — `73b8175` (feat)

_Note: Both tasks used TDD discipline (RED-then-GREEN within the task), bundled into single feat commits per the plan's "commit per task" guidance. Each task wrote its test files first, ran them to verify failing imports, then wrote source until green._

## Files Created/Modified

- `src/lib/interval.ts` (created) — Interval class; BigInt-backed Fraction source-of-truth with lazy monzo + cents caches, immutable arithmetic, period-aware octaveReduce
- `src/lib/monzo.ts` (created) — Re-exports of xen-dev-utils monzo helpers + custom benedettiHeight + oddLimit
- `src/lib/cents.ts` (created) — toCents (value|monzo router via xen-dev-utils valueToCents/monzoToCents) + centsFrom12tet
- `src/lib/commas.ts` (created) — 16 hand-curated commas + nameForMonzo + commaByName, keyed on canonical monzo via xen-dev-utils' length-tolerant monzosEqual
- `src/lib/__tests__/interval.test.ts` (created) — 14 test cases (MATH-01, MATH-03, MATH-04, D-24)
- `src/lib/__tests__/monzo.test.ts` (created) — 11 test cases (MATH-02, MATH-05)
- `src/lib/__tests__/cents.test.ts` (created) — 4 test cases (MATH-03)
- `src/lib/__tests__/commas.test.ts` (created) — 11 test cases (MATH-06)
- `src/lib/INVENTORY.md` (modified) — 8 new Phase-2 rows replacing the placeholder

## Decisions Made

(See `key-decisions` in frontmatter for the full list.) Highlights:

- **R-01 enforced at the source level** — interval.ts imports Fraction from fraction.js directly; defense-in-depth atop Plan 01's ESLint rule.
- **Immutability per D-24 — covered by tests** — every Interval-returning method has a `result !== a && result !== b` assertion.
- **Canonical-monzo lookup is the only correct way to identify a comma** — explicit Pitfall #6 test that distinguishes syntonic comma (~21.5¢) from schisma (~1.95¢) by monzo equality, NEVER by cents-within-epsilon.
- **Curated 16 verified commas** — 4 unverified candidates from the planner's draft were dropped and replaced. Each entry was double-checked by computing `monzoToBigNumeratorDenominator` against the published ratio.
- **Mercator's comma direction corrected** — used `[-84, 53]` (= 3^53/2^84) instead of the planner's `[84, -53]` which was the inverse. The 25-digit ratio reconstruction is live proof that R-01 matters: a Number-backed Fraction would silently truncate this.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unnecessary `as never` cast in Interval constructor**
- **Found during:** Task 1 (npm run lint after first source pass)
- **Issue:** ESLint flagged `new Fraction(input as never)` with `@typescript-eslint/no-unnecessary-type-assertion` because our `FractionInput` type is structurally compatible with fraction.js' own `FractionInput` type (verified against `node_modules/fraction.js/fraction.d.mts`). The planner's draft included this cast as a defensive widening but it isn't needed.
- **Fix:** Removed the cast: `new Fraction(input)`. Updated the comment to note the structural compatibility.
- **Files modified:** src/lib/interval.ts (constructor body + comment)
- **Verification:** `npm run lint` clean; `npm run lint:types` clean; all 14 interval tests still passing.
- **Committed in:** 468930c (Task 1 commit)

**2. [Rule 1 - Curation] Dropped 4 unverified commas from the planner's draft and substituted verified replacements**
- **Found during:** Task 2 (verifying each entry against published ratios)
- **Issue:** The planner's draft included `septimal semicomma [1, -5, 0, 3]`, `septimal sixth-tone [-3, 2, 0, 1]`, `undecimal kleisma [3, -1, -1, -1, 1]`, and `tridecimal third-tone [-9, 5, -1, 0, 0, 1]` with explicit "verify before commit" notes. Reconstructing their ratios via monzoToBigNumeratorDenominator showed they did NOT match the comma names attached to them (e.g. [1, -5, 0, 3] = 686/243, not 686/675). Also, the planner's `rastma [1, 5, 0, 0, -2]` had the wrong sign for prime-2 (should be -1 since 11^2 is in the denominator).
- **Fix:** Dropped the 4 unverified entries; kept rastma but corrected its monzo to `[-1, 5, 0, 0, -2]`; substituted three verified replacements: harmonic seventh comma (49/48, monzo `[-4, -1, 0, 2]`), jubilisma (50/49, monzo `[1, 0, 2, -2]`), breedsma (2401/2400, monzo `[-5, -1, -2, 4]`). Mercator's comma direction corrected to `[-84, 53]` (3^53/2^84).
- **Files modified:** src/lib/commas.ts
- **Verification:** Iterated each of the 16 entries through `commaByName(name)?.fraction.toFraction()` via tsx — every output matched its published canonical ratio. Tests assert specific ratios for syntonic comma (81/80) and schisma (32805/32768), so any future regression in the table breaks the suite.
- **Committed in:** 73b8175 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 lint bug, 1 data correctness curation)
**Impact on plan:** Both deviations preserve plan intent. The lint cleanup is a 1-line tidy. The comma table curation is a data-correctness fix that the plan itself anticipated by flagging "verify before commit" on those entries; the planner explicitly told the executor to substitute verified entries when verification failed. Floor of 15 entries was honored (16 delivered).

## Issues Encountered

- **fraction.js named-vs-default import:** The acceptance-criteria grep `grep -q "import { Fraction } from \"fraction.js\""` requires the named-import form. fraction.js' types export Fraction as both default and named, so `import Fraction from "fraction.js"` and `import { Fraction } from "fraction.js"` both work at runtime. Switched to the named form to satisfy the grep. Resolved.
- **Initial `as never` lint failure:** See Deviation #1 above. Resolved by removing the unnecessary cast.

## Next Phase Readiness

**Ready for Plan 02-03 (Scale class):** Interval is the universal currency Scale will consume. The contract is locked: `Interval.fraction` is BigInt-backed, `Interval.monzo` returns `number[]`, equality goes through `Fraction.equals`. Scale can rely on Interval immutability when implementing rotate/reduce/dedupe/transpose without copying.

**Ready for Plan 02-04 (.scl parser):** parseScala will produce `Interval[]`; the Interval string-constructor (`new Interval("5/4")`) handles the ratio-token case directly. Cents tokens require `Interval.fromMonzo` or a `Interval.fromCents` helper (NOT yet implemented — Plan 04 will add if the parser needs it; Pitfall #1 says the cents path should be a clearly-marked "imprecise input" boundary).

**Ready for Plan 02-06 (components):** ratio-pill, scale-table, play-interval all consume `Interval` directly. They can read `.fraction.toFraction()` for the ratio display, `.cents` for the cents column, and `.centsFrom12tet` for the deviation column.

**No blockers.**

---
*Phase: 02-math-kernel-composition-anchor-mvp*
*Completed: 2026-05-04*

## Self-Check: PASSED

- All 9 created/modified files present on disk
- Both commit hashes (468930c, 73b8175) present in git log
