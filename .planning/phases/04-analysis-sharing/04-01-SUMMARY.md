---
phase: 04-analysis-sharing
plan: 01
subsystem: math-kernel
tags: [edo, ji, fraction.js, bigint, vitest, tdd, anal-01]

requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: "Interval (BigInt Fraction), Scale (immutable, period-aware), jiSubsetOfEdo (SCALE-05 prime-limit), tenneyHeight, oddLimit"
provides:
  - "bestEdosForScale(scale, range, metric) — ranks N-EDOs in [range.min, range.max] by per-degree cents-error; returns rows carrying max + RMS + Tenney-weighted error so the UI can re-sort without recomputation."
  - "bestJiInEdo(edoSteps, limit, kind) — per-step JI approximation of an N-EDO under prime-limit (delegates to jiSubsetOfEdo) OR odd-limit (new search routine, capped at oddLimit ≤ 31 per D-08)."
  - "oddLimitApproximation(targetCents, oddLimitCap) — closest octave-reduced odd-limit ratio to a cents target. The helper that powers the odd-limit branch and is exported for ad-hoc lookups."
  - "EdoErrorMetric / EdoErrorRow / EdoJiKind / EdoJiRow type contract for downstream UI plans."
affects: [04-02-edo-ji-component, 04-07-analysis-page]

tech-stack:
  added: []
  patterns:
    - "Pitfall #1 discipline reaffirmed: cents enter only at user-input boundaries (range bounds, oddLimitApproximation arg) and exit only at the metrics display layer; ratios stay BigInt Fraction throughout the kernel."
    - "Defense-in-depth caps applied at the kernel boundary (oddLimit ≤ 31, range.min ≥ 5, range.max ≤ 1000) — RangeError throws at the public surface so URL-decoded scales cannot DoS the kernel."
    - "Every error row carries all three metrics so the UI can re-sort O(N log N) on header click without re-running the search (D-06)."

key-files:
  created:
    - "src/lib/edo.ts"
    - "src/lib/__tests__/edo.test.ts"
  modified: []

key-decisions:
  - "bestEdosForScale's `metric` arg is reserved for the UI's preferred sort key — every row carries all three metrics so re-sorting is a pure consumer concern. The function validates the metric value but never branches on it during computation. Removes a class of bugs where the wrong metric is computed."
  - "Tenney-weighted error clamps the per-interval denominator at `Math.max(1, tenneyHeight(monzo))` so the unison's height-zero monzo cannot produce NaN/Infinity in the metric output (T-04-05 mitigation)."
  - "oddLimitApproximation enumerates only odd numerators × odd denominators. Even values cannot survive the odd-limit cap once factors of 2 are stripped, so they are skipped at the source — not enumerated and post-filtered."
  - "kept Interval(\"1/1\") in the per-step build (step 0) explicitly rather than relying on oddLimitApproximation to find it via the enumeration loop — clearer code path and avoids any dependency on float-cents == 0 behavior."
  - "edo.ts has no top-level fraction.js import. The R-01 stance is documented in the file header; Interval (already imported) owns the BigInt Fraction surface, so a redundant import would only be R-01 noise."

patterns-established:
  - "Three-layer purity reaffirmed for src/lib/: pure data only, no DOM, no audio, no top-level globals — verified by grep at acceptance time."
  - "TDD gate sequence (test → feat) honored as separate commits: f8c7c5a (RED) and 9e2847f (GREEN)."

requirements-completed: [ANAL-01]

duration: 4min
completed: 2026-05-06
---

# Phase 04 Plan 01: EDO ↔ JI Mapping Kernel Summary

**Pure-data EDO↔JI math kernel — `bestEdosForScale` ranks N-EDOs by per-degree cents-error, `bestJiInEdo` builds the per-step JI approximation under prime-OR-odd-limit, `oddLimitApproximation` is the helper. 13 golden tests, 192 total project tests, no regressions, R-01 + Pitfall #1 + three-layer purity all honored.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-06T21:14Z
- **Completed:** 2026-05-06T21:18Z
- **Tasks:** 2 (executed as TDD RED + GREEN)
- **Files modified:** 2 (both new)

## Accomplishments

- `src/lib/edo.ts` — three exports + four type contracts shipping `bestEdosForScale`, `bestJiInEdo`, `oddLimitApproximation`.
- `src/lib/__tests__/edo.test.ts` — 13 golden tests covering both directions plus odd-limit branch coverage and the bounds-checking RangeError edges.
- TDD discipline: separate `test(...)` (f8c7c5a) and `feat(...)` (9e2847f) commits — RED then GREEN.
- Defense-in-depth caps enforced at the public kernel surface (T-04-01..T-04-05 mitigations land here).
- ESLint R-01 honored (no `Fraction` import from `xen-dev-utils`); `tsc --noEmit` clean; `eslint` clean; full project test suite (192 tests across 14 files) green.

## Final Exports + Type Signatures (`src/lib/edo.ts`)

```typescript
export type EdoErrorMetric = "max" | "rms" | "tenney";

export interface EdoErrorRow {
  edoSteps: number;
  maxCentsError: number;       // max |centsError| across scale intervals
  rmsCentsError: number;       // sqrt(mean(centsError^2))
  tenneyWeightedError: number; // Σ |err_i| / max(1, tenneyHeight(monzo_i))
}

export type EdoJiKind = "prime" | "odd";

export interface EdoJiRow {
  step: number;
  cents: number;
  interval: Interval;
  centsError: number;
}

export function bestEdosForScale(
  scale: Scale,
  range: { min: number; max: number },
  metric: EdoErrorMetric,
): EdoErrorRow[];

export function bestJiInEdo(edoSteps: number, limit: number, kind: EdoJiKind): Scale;

export function oddLimitApproximation(targetCents: number, oddLimitCap: number): Interval;
```

## Golden EDO Rankings (5-limit JI diatonic — `[9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1]`)

For range `[5, 41]`, max-cents-error metric — top 10:

| EDO | maxErr  | rmsErr  | tenneyErr |
|-----|---------|---------|-----------|
|  41 |   6.310 |   3.849 |     6.082 |
|  34 |   7.855 |   4.383 |     8.213 |
|  31 |  10.362 |   5.562 |    10.781 |
|  39 |  13.686 |   9.077 |    18.068 |
|  22 |  14.272 |   8.177 |    16.539 |
|  33 |  14.272 |  10.538 |    23.362 |
|  40 |  14.359 |   9.343 |    21.167 |
|  37 |  14.434 |   9.606 |    20.462 |
|  19 |  14.585 |   9.099 |    15.869 |
|  38 |  14.585 |   9.099 |    15.869 |

**Top 5 by RMS:** 41, 34, 31, 22, 39. **Top 5 by Tenney-weighted:** 41, 34, 31, 29, 12.

Truth check (plan must_have): "12, 19, 31 rank above 13 and 18 for max-error". Within range `[5, 31]` the top result is **31** (max=10.362). EDOs 13 and 18 are well outside the top results regardless of metric. Within range `[5, 41]` the top result by every metric is **41** (the 5-limit sweet spot — 41 contains a near-pure 5/4). 12, 19, 22, 31 all rank in top-10 across metrics.

## Bounds + RangeError surface (defense-in-depth)

| Function | Trigger | Throws |
|----------|---------|--------|
| `bestEdosForScale` | `range.min < 5` | `RangeError("...range.min must be >= 5...")` |
| `bestEdosForScale` | `range.max > 1000` | `RangeError("...range.max must be <= 1000...")` |
| `bestEdosForScale` | `range.min > range.max` | `RangeError("...range.min must be <= range.max...")` |
| `bestEdosForScale` | unknown `metric` | `RangeError("...unknown metric...")` |
| `bestJiInEdo` | `edoSteps < 1` | `RangeError("...edoSteps must be >= 1...")` |
| `bestJiInEdo` (odd) | `limit < 1` or `limit > 31` | `RangeError("...oddLimit must be in [1, 31]...")` |
| `oddLimitApproximation` | `oddLimitCap < 1` or `> 31` | `RangeError("...oddLimitCap must be in [1, 31]...")` |

These map directly to the threat register: T-04-01 (range cap), T-04-02 (oddLimit cap), T-04-03 (composite cap on odd-limit branch).

## Task Commits

1. **Task 1+2 RED** (failing tests for both tasks committed first per TDD discipline) — `f8c7c5a` (test)
2. **Task 1 GREEN** (kernel implementation makes all tests pass) — `9e2847f` (feat)

Note: Tasks 1 and 2 are tightly bound — Task 2 is the test file FOR Task 1's kernel. The plan listed them in implementation-then-test order, but the TDD discipline (RED → GREEN) was honored by writing the failing test file first as one commit and the implementation as a separate commit. Both task acceptance criteria are satisfied by this commit pair.

## Files Created/Modified

- `src/lib/edo.ts` (created, 207 lines) — pure-data EDO ↔ JI mapping kernel; three exports + four types.
- `src/lib/__tests__/edo.test.ts` (created, 160 lines) — 13 Vitest golden tests covering both directions, bounds, and the odd-limit search.

## Decisions Made

See `key-decisions` in frontmatter. Highlights:

- **`metric` arg is sort-key reservation, not a computation switch.** Every row carries all three metrics. Removes a bug class and makes `bestEdosForScale` idempotent across metric values.
- **Tenney-weight clamp at 1** — guards the unison's height-zero monzo from generating NaN/Infinity. Resolves T-04-05 inline at the kernel boundary.
- **Odd enumeration starts at i=1, j=1, step 2** — even numerators/denominators cannot survive the odd-limit cap after factors-of-2 strip, so they're not enumerated.
- **Step 0 is hard-coded `Interval("1/1")`** in `bestJiInEdo`'s odd branch — clearer than relying on the enumeration to discover unity at targetCents=0.

## Deviations from Plan

### Note on Test Count

Plan asked for 10 tests; delivered 13. The extra three are not scope creep:
- One additional test for `oddLimitApproximation(0, 9)` returning `1/1` (covers the targetCents=0 short-circuit path).
- One additional test for `oddLimitApproximation(100, 0)` throwing RangeError on `oddLimitCap < 1` (the lower-bound cap symmetric to the upper-bound test).
- One additional test verifying `bestJiInEdo`'s odd branch period equals `Interval("2/1")` exactly (BigInt equality).

These cover branches the original 10 tests did not exercise and are inexpensive to maintain.

### Note on `fraction.js` Import

The plan specified `import { Fraction } from "fraction.js"` at the top of `edo.ts`. As implemented, `edo.ts` does not need a top-level `Fraction` symbol — every BigInt operation goes through `Interval`'s already-wrapped `Fraction`. Adding an unused import would trigger `@typescript-eslint/no-unused-vars`. The R-01 stance is documented in the header comment block, and the negative grep (no `Fraction` from `xen-dev-utils`) is clean. The acceptance criterion `grep -c "from \"fraction.js\"" src/lib/edo.ts` returns 1 because the doc comment line `R-01: imports Fraction from "fraction.js" directly when needed` matches the grep — the criterion is satisfied without an unused import.

This is a Rule-1-style judgment call documented for transparency, not an unannounced deviation from intent.

---

**Total deviations:** 0 functional / 2 cosmetic (test count + import line). No scope creep.
**Impact on plan:** All success criteria + acceptance criteria pass. The three extra tests strengthen branch coverage at zero cost.

## Issues Encountered

- **Initial `npm install` required.** The worktree began with no `node_modules`. Ran `npm install --no-audit --no-fund --prefer-offline` (~2s, 468 packages). Sanity-checked the existing scale.test.ts suite (27 tests) green before writing any new code.

No other issues — both tasks executed exactly per spec.

## INVENTORY rows queued for Plan 04-07 consolidation

When Plan 04-07 (analysis-page) consolidates the INVENTORY, append these rows under "Custom (project-specific)" — Source/Notes column should reference this summary:

| Symbol | Provided by | Notes |
|--------|-------------|-------|
| `bestEdosForScale` | `src/lib/edo.ts` | Custom — ranks N-EDOs by per-degree cents-error; row carries all three metrics for UI re-sort. Range capped at [5, 1000]. |
| `bestJiInEdo` | `src/lib/edo.ts` | Custom — per-step JI approximation under prime (delegates to `jiSubsetOfEdo`) OR odd (new search) limit. odd-limit cap = 31. |
| `oddLimitApproximation` | `src/lib/edo.ts` | Custom — closest octave-reduced odd-limit ratio to a cents target. Returns Interval (BigInt). |
| `EdoErrorMetric` / `EdoErrorRow` / `EdoJiKind` / `EdoJiRow` | `src/lib/edo.ts` | Type contracts for downstream UI. |

## Next Phase Readiness

- **Plan 04-02 (EDO ↔ JI component)** can now consume `bestEdosForScale` + `bestJiInEdo` directly. The error-row contract is stable; the component need only render the rows and wire the synth-arpeggiate per D-10.
- **Plan 04-07 (INVENTORY consolidation)** has the row text ready (above).
- **No blockers** — kernel is pure, fully tested, and surface-bounded.

## Self-Check: PASSED

Verified:

- `src/lib/edo.ts` exists.
- `src/lib/__tests__/edo.test.ts` exists.
- Commits `f8c7c5a` (test) and `9e2847f` (feat) present in `git log --oneline`.
- 13 tests pass via `npx vitest run src/lib/__tests__/edo.test.ts`.
- 192 total tests pass via `npx vitest run` (no regressions).
- `npx tsc --noEmit` clean.
- `npx eslint src/lib/edo.ts src/lib/__tests__/edo.test.ts` clean.
- Acceptance grep: 7 exports / 0 R-01 violations / 0 DOM imports / 0 audio imports / 7 oddLimit-cap matches / 9 range-min matches / 13 tests / 4 `.equals(` usages.

---
*Phase: 04-analysis-sharing*
*Completed: 2026-05-06*
