---
phase: quick-260616-bkm
plan: 01
subsystem: math-kernel
tags: [exact-arithmetic, bigint, precision, R-01, pitfall-1, pitfall-6]
requires: [Interval, Scale, fraction.js, xen-dev-utils]
provides:
  - benedettiHeight-bigint
  - jiSubsetOfEdo-deduped
  - bestJiInEdo-deduped
  - isConstantStructure-scale-period
  - Interval-cents-finite
  - cps-exact-root
affects:
  - src/components/edo-ji-table.ts (odd-branch row counts may shrink under dedupe)
tech-stack:
  added: []
  patterns:
    - "Exact-fraction-string Set<string> dedupe (Set of iv.fraction.toFraction()) — mirrors cps.ts"
    - "Float-first cents with monzo fallback only on Infinity overflow"
key-files:
  created: []
  modified:
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
    - src/components/__tests__/edo-ji-table.test.ts
decisions:
  - "Interval.cents keeps the float ratio as the PRIMARY path (works for tempered/non-factorizable ratios) and falls back to the monzo sum ONLY when Number(n/d) overflows to Infinity — a monzo-only path threw 'Out of primes' for tempered cents-derived fractions."
metrics:
  duration: 9min
  completed: 2026-06-16
  tasks: 2
  files: 14
---

# Quick 260616-bkm: Kernel Precision Round 2 (benedettiHeight) Summary

Five exact-arithmetic seams closed in the JI math kernel: benedettiHeight now returns an exact bigint; EDO-subset generators dedupe by exact fraction string; constant-structure uses the authoritative scale.period for wrap-around; Interval.cents stays finite for arbitrarily large fractions; cps root selection uses exact Fraction.compare.

## What Changed

**FIX #9 — `benedettiHeight` returns `bigint` (monzo.ts).** Dropped the lossy `Number()` coercion; returns `numerator * denominator` directly. Mercator's comma region (3^53/2^84) and larger now stay bit-exact past Number.MAX_SAFE_INTEGER. Only non-test caller was INVENTORY.md (docs) — no production code does float math on the result, so the signature change ripples cleanly through `tsc`.

**FIX #10 — exact-fraction dedupe in `jiSubsetOfEdo` (scale.ts) and `bestJiInEdo` odd-branch (edo.ts).** Both now collapse duplicate closest-JI ratios using a `Set<string>` of `iv.fraction.toFraction()` (Pitfall #1/#6 — never cents-within-epsilon), preserving order, with the explicit 2/1 period appended exactly once (any step-produced 2/1 is dropped before the append). The prime branch of `bestJiInEdo` delegates to `jiSubsetOfEdo` and inherits the fix (no double-dedupe).

**FIX #11 — `isConstantStructure` wrap-around uses `scale.period` (constant-structure.ts).** Replaced `const period = degrees[n-1]` with `const period = scale.period`. The Scale carries the authoritative explicit period; the last degree is not guaranteed to equal it. A discriminating test ({1/1, 9/8, 6/5, 15/8} with explicit 2/1 period, last degree 15/8 ≠ 2/1) proves the fix: against the true period 2/1 the scale is correctly CS-✗ (15/8 subtends both 2 and 3 steps), whereas the old last-degree behavior missed the collision and wrongly reported CS-✓.

**FIX (low) — `Interval.cents` finite for huge fractions (interval.ts).** Cents now computes via the direct float ratio when finite, falling back to the monzo sum (1200·Σ monzo[i]·log2(PRIMES[i])) only when `Number(n/d)` overflows to Infinity (n or d past ~2^1024). See Deviations — the initial monzo-only rewrite broke tempered ratios.

**FIX (low) — cps root by exact `Fraction.compare` (cps.ts).** Replaced `if (p.cents < min.cents)` with `if (p.fraction.compare(min.fraction) < 0)`. The canonical Wilson hexany/dekany/eikosany vectors are unchanged; the tonic pick is now exact, with no float tie/ordering ambiguity. The cents-based display SORT is unchanged.

## Tests

- **Before:** 709 tests passing.
- **After:** 723 tests passing (50 files), +14 new tests. `npm run lint:types` clean, prettier `--check` clean across all touched `.ts` files.
- New/updated assertions: benedettiHeight `6480n` + Mercator's-comma exactness (with `BigInt(Number(expected)) !== expected` to document why bigint is required); no-duplicate + single-trailing-2/1 for `jiSubsetOfEdo(53,3)`, `jiSubsetOfEdo(72,5)`, `bestJiInEdo(72,9,"odd")`; CS wrap-around discriminating period≠last-degree case + regression; cents finite for `3^2000` (Number value verified === Infinity) + matches old formula for 3/2, 5/4, 81/80 + unison 0; cps exact-root hexany starts on exact 1/1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Interval.cents monzo-only rewrite threw "Out of primes" for tempered ratios**
- **Found during:** Task 2 (first full test run after Task 1).
- **Issue:** The plan specified rewriting `cents` to compute purely from the monzo. But `this.monzo` factorizes the fraction via `toMonzo`, which throws "Out of primes" for tempered/cents-derived ratios whose huge float-approximation numerators are not prime-factorizable. This broke 63 tests across scale-compare and edo-ji components (all consumers of `.cents` on tempered intervals).
- **Fix:** Made the cents getter float-first — `1200*log2(Number(n/d))` is the primary path (works for every fraction, including tempered) and the monzo sum is the fallback ONLY when the float overflows to Infinity. This satisfies the must-have (finite for arbitrarily large fractions; matches old formula within epsilon for normal ratios) without regressing tempered scales.
- **Files modified:** src/lib/interval.ts
- **Commit:** eccc4e2

**2. [Rule 1 - Bug] edo-ji-table component test assumed prime/odd branches have equal row counts**
- **Found during:** Task 2.
- **Issue:** `edo-ji-table.test.ts` asserted `after.length === before.length` when toggling prime→odd at 12-EDO. After FIX #10 the odd-7 branch collapses one duplicate ratio (12 → 11 rows), so the lengths legitimately differ.
- **Fix:** Relaxed the assertion to require a non-empty re-render and a content change (length difference counts as a change). The test's intent — "toggling re-renders the tbody with different content" — is preserved.
- **Files modified:** src/components/__tests__/edo-ji-table.test.ts
- **Commit:** eccc4e2

Both fixes are directly caused by the planned behavior changes (in-scope per the deviation scope boundary). No architectural changes; no new dependencies.

## R-01 / Pitfall Compliance

- R-01 preserved: `Fraction` is never imported from xen-dev-utils. `PRIMES` (added to interval.ts) is from xen-dev-utils and is NOT Fraction — already the established pattern (scale.ts imports PRIMES from xen-dev-utils).
- Pitfall #1/#6 preserved: all dedupe + the cps root pick use exact fraction comparison (`toFraction()` string equality / `Fraction.compare`), never cents-within-epsilon. Cents remains a display-only projection.

## Self-Check: PASSED
