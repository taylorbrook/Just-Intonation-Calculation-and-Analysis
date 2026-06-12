---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
plan: 01
subsystem: api
tags: [sonic-weave, xen-dev-utils, fraction.js, bigint, tempered, fokker, adapter, tdd]

# Dependency graph
requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: "Interval (BigInt Fraction), Scale (throws on empty), centsToRatio, MAX_SCALE_TEXT_BYTES, jiSubsetOfEdo R-01 round-trip idiom"
  - phase: 04-analysis-sharing
    provides: "buildMos (rank-2 cross-check target), MAX_SCALE_TEXT_BYTES (url.ts)"
  - phase: 06-exact-rational-ji-harmonic-generators
    provides: "cps (Hexany cross-check target), edScale tempered cents-of-record idiom"
provides:
  - "scaleFromSonicWeave(src): SonicWeaveResult — the single Phase-7 DSL→kernel boundary"
  - "SonicWeaveResult { scale: Scale | null; tempered: boolean; error? } contract"
  - "fokkerCardinality(commaStrings): number — comma-mode |det| readout (GEN-08 / D-12)"
affects: [07-02 (rank-2/well-temperament/Fokker widgets), 07-03 (free-text widget), 07-04 (page registration)]

# Tech tracking
tech-stack:
  added: []  # no new npm deps — sonic-weave@0.14.1 + xen-dev-utils@0.13.1 pre-installed
  patterns:
    - "DSL→kernel adapter: own the boundary, let the prelude do the math"
    - "isFractional() discriminator (NOT instanceof real-class) for rational-vs-tempered"
    - "R-01 ${n}/${d} string round-trip — foreign Fraction never crosses into the kernel"
    - "Structured { scale, tempered, error } return — never throws (D-18)"
    - "Caps FIRST → RangeError (cps.ts precedent) for the Fokker defense-in-depth"

key-files:
  created:
    - src/lib/sonicweave.ts
    - src/lib/fokker.ts
    - src/lib/__tests__/sonicweave.test.ts
    - src/lib/__tests__/fokker.test.ts
  modified:
    - src/lib/INVENTORY.md

key-decisions:
  - "isFractional() is the rational/tempered discriminator — blueprint A4's instanceof real-class check is verified WRONG (tempered cents intervals are TimeMonzo, not the real class)"
  - "D-13 unison prepend: the adapter prepends 1/1 when SonicWeave's currentScale omits it, making output fungible with buildMos/cps (exact n/d, length, iv.equals())"
  - "Fokker square matrix drops the prime-2 exponent (implicit equave) and takes the (3,5,…)-subspace determinant — needs exactly width−1 commas; ['81/80','128/125'] → |det| 12"

patterns-established:
  - "Pattern 1: scaleFromSonicWeave — evaluateSource + currentScale + isFractional() discriminator + R-01 round-trip / cents-of-record"
  - "Pattern 4: fokkerCardinality — BigInt monzo matrix |det| over xen-dev-utils integerDet with caps-first RangeError guards"

requirements-completed: [GEN-06, GEN-07, GEN-08, GEN-09]

# Metrics
duration: ~7min
completed: 2026-06-11
---

# Phase 7 Plan 01: SonicWeave Adapter + Fokker Cardinality Summary

**`scaleFromSonicWeave(src)` — the load-bearing DSL→kernel boundary that maps SonicWeave's `currentScale` to BigInt `Interval`s via the runtime-verified `isFractional()` discriminator (rational → R-01 `${n}/${d}` round-trip, tempered → cents-of-record), plus `fokkerCardinality` for the comma-mode `|det|` readout.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-11T20:22Z
- **Completed:** 2026-06-11T20:27Z
- **Tasks:** 1 (TDD: RED → GREEN)
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- `scaleFromSonicWeave` adapter: evaluates a SonicWeave source string and maps `.currentScale` to kernel `Interval`s, discriminating exact-rational from tempered with `iv.value.isFractional()` (NOT the blueprint's wrong `instanceof` real-class check).
- Rank-2 pure ratio `rank2(3/2,5,1)` ≡ `buildMos(3/2,2/1,7)` and `cps([1,3,5,7],2)` ≡ kernel Hexany — both proven by exact per-interval BigInt `iv.equals()`.
- Tempered quarter-comma meantone flagged `tempered:true` with cents-of-record (`[193.157, 386.314, 503.422, 696.578, 889.735, 1082.892, 1200.0]`) — no float-derived ratio presented as exact JI.
- Full error surface: 8 KB cap checked BEFORE `evaluateSource` (T-07-01), `try/catch` → structured `{ scale: null, error }` (never throws, D-18 / T-07-04), and an `out.length===0` empty-scale guard before `new Scale([])` (Pitfall 5).
- `fokkerCardinality(["81/80","128/125"]) === 12` via BigInt `integerDet` over the (3,5)-subspace monzo matrix, with caps-first `RangeError` guards (comma count, square-matrix, cardinality).

## Task Commits

TDD task — three commits (RED test → GREEN feat):

1. **RED: failing adapter + fokker tests** - `3b41bfe` (test)
2. **GREEN: scaleFromSonicWeave adapter + fokkerCardinality + INVENTORY** - `1639008` (feat)

No separate REFACTOR commit — the GREEN implementation was already at final form (a small ESLint/Prettier cleanup of an unnecessary type assertion was folded into the GREEN commit before it landed).

_Plan metadata commit (this SUMMARY) follows._

## Files Created/Modified
- `src/lib/sonicweave.ts` - `scaleFromSonicWeave(src)` adapter + `SonicWeaveResult` interface. The single Phase-7 boundary: cap → `evaluateSource` (try/catch) → `isFractional()` discriminator → R-01 round-trip / cents-of-record → empty-guard → D-13 unison prepend → `new Scale`.
- `src/lib/fokker.ts` - `fokkerCardinality(commaStrings)` — `|det|` over the BigInt (3,5,…)-subspace monzo matrix via `integerDet`, caps-first `RangeError` guards.
- `src/lib/__tests__/sonicweave.test.ts` - 7 tests: buildMos/cps cross-checks, tempered cents detection, malformed/empty/oversized error shape, R-01 round-trip.
- `src/lib/__tests__/fokker.test.ts` - 3 tests: `|det|` = 12, non-square `RangeError`, comma-cap `RangeError`.
- `src/lib/INVENTORY.md` - Two Phase 7 rows (`scaleFromSonicWeave`, `fokkerCardinality`).

## Decisions Made
- **`isFractional()` discriminator (not `instanceof` real-class).** Runtime-verified this phase per 07-RESEARCH: a tempered cents-based interval carries a `TimeMonzo`, not the real-valued class — the blueprint A4 `instanceof` check would mis-launder quarter-comma meantone as exact JI. `isFractional()` is the documented public boolean on both value classes and is correct.
- **D-13 unison prepend.** SonicWeave's `currentScale` omits the implicit `1/1` unison (`rank2`/`cps` start on the first non-unison degree). The kernel convention (parseScala D-13, `buildMos`, `cps`) keeps the leading `1/1`. The adapter prepends `1/1` when the first interval is not already the unison, so output is fungible with `buildMos`/`cps` by exact `n/d`, length, and `iv.equals()`. The tempered cents test asserts the seven degrees *after* the prepended `0¢` unison.
- **Fokker square construction.** Drop the prime-2 exponent (the implicit equave) and take the `(3,5,…)`-subspace determinant; this needs exactly `width−1` commas. `["81/80","128/125"]` → `[[4,-1],[0,-3]]` → `|det|` 12. Documented in a header comment per the plan.

## Deviations from Plan

None - plan executed exactly as written. The reference implementation in 07-RESEARCH Pattern 1 / Pattern 4 was runtime-verified before coding and adopted essentially verbatim (with the documented D-13 unison-prepend addition, which the plan's behavior section explicitly called for to make the scale equal `buildMos`/`cps`).

## Issues Encountered
- **ESLint `no-unnecessary-type-assertion` on `as SwInterval[]`.** The RESEARCH Pattern 1 used `visitor.currentScale as SwInterval[]`, but the actual `.currentScale` element type already exposes `.value.isFractional()` / `.toFraction()` / `.totalCents()`, so the assertion (and the `SwInterval` type import) were unnecessary. Removed both — lint green, types still resolve, tests still pass.

## Deferred Issues
Pre-existing, project-wide, OUT OF SCOPE for this plan (not introduced by Plan 07-01; present on the base commit `ac96e95`):
- `npx tsc --noEmit` reports ~5 errors for `npm:`-prefixed Observable Framework imports (`npm:sw-synth`, `npm:ji-lattice`, `npm:@observablehq/plot`) plus two implicit-`any` params in `src/components/lattice.ts`. These resolve at Framework build time, not under bare `tsc`. My files (`sonicweave.ts`, `fokker.ts`) are tsc-clean.
- `npx eslint .` reports ~87 errors and `prettier --check` ~11 warnings, all in Phase 2/3/6 files (`scale-compare.ts` `npm:` plot import, `cps.ts`, `harmonic.ts`, etc.). My four files have zero ESLint errors and zero Prettier warnings.
These were left untouched per the executor SCOPE BOUNDARY (only auto-fix issues directly caused by the current task's changes; other parallel-wave agents may touch some of these files).

## User Setup Required
None - no external service configuration required. No new npm dependencies (`sonic-weave@0.14.1` + `xen-dev-utils@0.13.1` were already installed and pinned).

## Next Phase Readiness
- The `{ scale, tempered, error? }` contract is the thin boundary the four Plan 02/03 widgets and the Plan 04 page registration consume directly — they compose SonicWeave source strings and reuse the Phase-6 tempered table/badge.
- `fokkerCardinality` drives the live D-12 comma-mode readout for the Fokker widget (Plan 02).
- All 10 new tests green; full suite 504/504 green (no regressions).

---
*Phase: 07-sonicweave-adapter-tempered-lattice-free-text*
*Completed: 2026-06-11*
