---
phase: quick-260615-ipz
plan: 01
subsystem: ji-math-kernel
tags: [input-validation, hardening, fail-closed, RangeError, security]
requires: [fraction.js@5.3.4, xen-dev-utils, vitest]
provides:
  - "interval.octaveReduce: non-positive-fraction RangeError guard (kills the true infinite-loop hang)"
  - "scala.parsePitchToken: positive-ratio + |cents| <= 1_000_000 guards"
  - "cps: non-positive factor rejection"
  - "diamond.enumerateDiamond: even-oddLimit rejection (reject, not floor)"
  - "meru.meruScale: non-negative coefficient + per-term non-positive guard"
  - "mos.buildMos: generator-octave-reduces-to-1/1 single-pitch contract"
affects:
  - src/components/* consumers of cps/diamond/meru/mos/parseScala (now fail-closed on degenerate input)
tech-stack:
  added: []
  patterns:
    - "Sign/zero non-positivity test for a fraction.js Fraction: `f.s < 0n || f.n === 0n` (NOT compare-to-one)"
    - "RangeError idiom for kernel range/guard violations; plain Error for scala parser rejections"
    - "Guard runs BEFORE construction (new Interval) so opaque fraction.js throws (Division by Zero / Infinity->BigInt) never surface"
key-files:
  created: []
  modified:
    - src/lib/interval.ts
    - src/lib/scala.ts
    - src/lib/cps.ts
    - src/lib/diamond.ts
    - src/lib/meru.ts
    - src/lib/mos.ts
    - src/lib/__tests__/interval.test.ts
    - src/lib/__tests__/scala.test.ts
    - src/lib/__tests__/cps.test.ts
    - src/lib/__tests__/diamond.test.ts
    - src/lib/__tests__/meru.test.ts
    - src/lib/__tests__/mos.test.ts
decisions:
  - "interval.ts guards NON-POSITIVE (<=0), NOT compare(one)<=0 — reporter's premise was wrong; compare-to-one would over-reject valid sub-unison ratios the diamond depends on"
  - "diamond even-oddLimit: REJECT, not floor — the odd limit is the diamond's defining parameter; flooring 8->7 would silently mask user error"
  - "meru coefficient policy: non-negative a/b (fail-closed) + defense-in-depth per-term non-positive guard inside the loop"
  - "mos: replaced equals(period) with reduces-to-1/1 so gen 4/1 under period 2/1 (the equals-miss) also hits the single-pitch D-29 contract"
metrics:
  duration: 8min
  tasks: 3
  files_changed: 12
  tests_added: 18
  completed: 2026-06-15
---

# Phase quick-260615-ipz Plan 01: Input-Validation Hardening Across the JI Kernel Summary

Reject degenerate input at the kernel boundary so it can no longer hang (infinite loop in `octaveReduce`) or silently corrupt the kernel (NaN / Infinity / 0 Hz) — six fail-closed guards across `interval`, `scala`, `cps`, `diamond`, `meru`, `mos`, each pinned by a rejection test plus a paired positive regression so no valid input is over-rejected.

## What Was Built

| Module | Guard | Error type |
|--------|-------|-----------|
| `interval.octaveReduce` | non-positive `this.fraction` (`.s < 0n \|\| .n === 0n`) before the reduce loops | `RangeError` |
| `scala.parsePitchToken` (ratio) | non-positive numerator OR denominator before `new Interval` | `Error` |
| `scala.parsePitchToken` (cents) | `\|cents\| > 1_000_000` (`MAX_ABS_CENTS`, inclusive cap) | `Error` |
| `cps` | any non-positive factor before enumeration | `RangeError` |
| `diamond.enumerateDiamond` | even `oddLimit` (reject, not floor) | `RangeError` |
| `meru.meruScale` | negative `a`/`b` coefficient + non-positive recurrence term in-loop | `RangeError` |
| `mos.buildMos` | generator that octave-reduces to 1/1 → single-pitch (D-29) | (early return) |

## Key Decisions / Plan Revisions Honored

**1. interval.ts discrepancy (reporter premise was wrong).** The original reporter said `octaveReduce` "loops forever when `this.fraction <= 1/1`". That premise is incorrect: the loop `while (f.compare(one) < 0) f = f.mul(pf)` reduces valid sub-unison ratios (1/2 → 1/1, 3/5 → 6/5) correctly and terminates, and `enumerateDiamond` **depends** on this (it reduces i/j where i<j). The REAL infinite-loop surface is a **non-positive** fraction (`<= 0`): `f.compare(one) < 0` stays true forever because `f.mul(pf)` keeps a negative/zero value negative/zero. The implemented guard therefore tests sign/zero (`f.s < 0n || f.n === 0n`), NOT `compare(one) <= 0`. Using the reporter's `compare(one) <= 0` would have broken the diamond by over-rejecting every cell where i<j. The pre-existing `period <= 1/1` guard is unrelated and was left untouched. A paired sub-unison regression test (1/2 → 1/1, 3/5 → 6/5) pins the non-over-reject behavior.

**2. diamond even-oddLimit disposition: REJECT, not floor.** An even oddLimit is ambiguous. Rejecting it with a clear `RangeError` ("oddLimit must be odd … use the next lower odd value") is clearer than silently flooring 8 → 7, because the odd limit IS the diamond's defining parameter — silently flooring would mask user error. The `oddLimit 7 → 16 cells` regression stays green.

**3. meru coefficient policy: non-negative a/b + per-term non-positive guard (defense in depth).** Two-part, fail-closed: (a) reject `a < 0n || b < 0n` after the existing seed guard (non-negative is the safe musical domain — Fibonacci/metallic recurrences use positive weights; a negative weight can drive a term non-positive or sign-flipping); (b) inside the recurrence loop, reject any `next <= 0n` before pushing, alongside the existing `MAX_MERU_MAGNITUDE` cap. The Fibonacci `(1,1,1,1)` regression stays green.

**4. mos generator-reduces-to-1/1.** Replaced the `generator.equals(period)` degenerate test with `generator.octaveReduce(period).equals(ONE)` so it also catches generators like 4/1 under period 2/1 (which reduce to 1/1 but are NOT `equals(period)` — the case the old guard missed). The single-pitch D-29 contract (`Scale([period], period)`) is preserved; gen 2/1 and gen 4/1 under period 2/1 now both return the single-pitch scale. The Pythagorean Ionian (3/2 under 2/1, size 7 → 8 entries) regression stays green. Header D-29 comment updated to read "generator octave-reduces to 1/1".

**5. cps fail-closed at its own boundary.** A non-positive factor would multiply into a non-positive product and then trip `octaveReduce`'s new guard; `cps` instead fails closed at its own boundary with a domain-specific message ("all factors must be positive ratios (> 0)") before enumeration.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1–4 deviations were required; every guard was a small additive change and all pre-existing tests stayed green on the first gate pass.

## Pre-existing Issues

None observed. Baseline of the six affected spec files was green (96 tests) before any change, and the full suite (50 files / 682 tests) passed on the first Task-3 gate run with no unrelated failures.

## Verification

- **Task 1** (`interval` + `scala`): 74 tests green, `tsc --noEmit` clean.
- **Task 2** (`cps`, `diamond`, `meru`, `mos`): 45 tests green, `tsc --noEmit` clean.
- **Task 3** (full gate): `npm run lint:types && npm run test && npm run lint && npm run format:check` all passed — 682/682 tests, eslint clean, Prettier reported "All matched files use Prettier code style!" (no formatting changes needed, so no Task-3 commit).
- Each rejection has a pinning test (error type + `/regex/i` message where specified); each border-of-valid case has a paired positive regression (octaveReduce sub-unison; cents at the 1,000,000 boundary; hexany; diamond oddLimit 7; Fibonacci meru; Pythagorean mos).

18 tests added across the six specs.

## Commits

- `60b538a` feat(quick-260615-ipz): guard non-positive ratios + out-of-range cents at the JI boundary (Task 1: interval.ts, scala.ts + tests)
- `5e4f364` feat(quick-260615-ipz): positivity + degenerate guards for cps/diamond/meru/mos (Task 2: cps.ts, diamond.ts, meru.ts, mos.ts + tests)

(Task 3 was verification-only and produced no source/format changes — no commit.)

## Self-Check: PASSED

All 12 modified source/test files exist on disk; both task commits (`60b538a`, `5e4f364`) are present in git history.
