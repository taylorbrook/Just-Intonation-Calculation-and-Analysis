/**
 * EDO ↔ JI mapping kernel (ANAL-01 / Phase 4).
 *
 * Pure data: no DOM, no audio. Three exports:
 *   - bestEdosForScale(scale, range, metric) — given a JI scale, rank N-EDOs in [range.min, range.max]
 *     by per-degree cents-error (max / RMS / Tenney-weighted). Returns one row per EDO; UI re-sorts
 *     by clicking column headers (D-06 / D-09).
 *   - bestJiInEdo(N, limit, kind) — given an N-EDO, return per-step best JI approximations under EITHER
 *     prime-limit (delegates to jiSubsetOfEdo / SCALE-05) OR odd-limit (new search routine, D-08).
 *     Result is always a Scale ending in 2/1 (the period).
 *   - oddLimitApproximation(cents, oddLimit) — closest odd-limit ratio to a cents target. Helper for
 *     the odd-limit branch of bestJiInEdo and for ad-hoc lookups.
 *
 * Pitfall #1 discipline: cents enter ONLY at the user-input boundary (range bounds, the `cents` arg
 * of oddLimitApproximation) and exit ONLY at the display boundary (error metrics in cents). Inside,
 * intervals are Interval (BigInt Fraction) — never floats.
 *
 * R-01: imports Fraction from "fraction.js" directly when needed; NEVER from "xen-dev-utils".
 *
 * Defense-in-depth caps (URL-decoded scales reach this kernel):
 *   - oddLimit ≤ 31  (combinatorial cap; throws RangeError otherwise)
 *   - range.min ≥ 5  (per D-07)
 *   - range.max ≤ 1000 (sanity cap; throws RangeError otherwise)
 */

import { Interval } from "./interval.js";
import { Scale, jiSubsetOfEdo } from "./scale.js";
import { tenneyHeight } from "./monzo.js";
// R-01: NEVER import Fraction from xen-dev-utils. Reserved for future use.
// (No Fraction needed at module top level today — Interval owns the BigInt path.)

const ODD_LIMIT_CAP = 31;
const EDO_RANGE_MIN = 5;
const EDO_RANGE_MAX = 1000;

export type EdoErrorMetric = "max" | "rms" | "tenney";

export interface EdoErrorRow {
  edoSteps: number;
  /** max |centsError| across the scale's intervals */
  maxCentsError: number;
  /** sqrt(mean(centsError^2)) across the scale's intervals */
  rmsCentsError: number;
  /**
   * Σ |centsError_i| / max(1, tenneyHeight(monzo_i)) — high-complexity intervals contribute less.
   * NaN when the scale is tempered (cents-based, no JI factorization); the UI renders NaN as "—".
   */
  tenneyWeightedError: number;
}

export type EdoJiKind = "prime" | "odd";

export interface EdoJiRow {
  step: number;
  cents: number;
  interval: Interval;
  centsError: number;
}

/**
 * Rank N-EDOs in [range.min, range.max] by how well they approximate `scale`.
 *
 * Returns one row per EDO in ascending edoSteps order. Each row carries all three error metrics
 * so the UI can re-sort on header click without recomputation. The `metric` argument is reserved
 * for the consumer's preferred sort key (the function does NOT pre-sort).
 *
 * Throws RangeError if range bounds are out-of-policy (D-07 lower bound 5; defense-in-depth upper
 * bound 1000).
 */
export function bestEdosForScale(
  scale: Scale,
  range: { min: number; max: number },
  _metric: EdoErrorMetric,
): EdoErrorRow[] {
  if (range.min < EDO_RANGE_MIN) {
    throw new RangeError(
      `bestEdosForScale: range.min must be >= ${String(EDO_RANGE_MIN)} (got ${String(range.min)})`,
    );
  }
  if (range.max > EDO_RANGE_MAX) {
    throw new RangeError(
      `bestEdosForScale: range.max must be <= ${String(EDO_RANGE_MAX)} (got ${String(range.max)})`,
    );
  }
  if (range.min > range.max) {
    throw new RangeError(
      `bestEdosForScale: range.min (${String(range.min)}) must be <= range.max (${String(range.max)})`,
    );
  }
  // _metric is intentionally not consumed in computation — every row carries all three metrics
  // so the UI can sort O(N log N) without re-running the search. Validate it's a known value
  // for type narrowing / forward-compat.
  if (_metric !== "max" && _metric !== "rms" && _metric !== "tenney") {
    throw new RangeError(`bestEdosForScale: unknown metric "${String(_metric)}"`);
  }

  // Precompute idealCents and tenneyHeight (clamped) for each interval. The 1/1 unison is a
  // free fit at every EDO; we still include it because its contribution to all three metrics
  // is zero (rounding gap zero, weight finite — clamp at 1) and excluding it would muddy the
  // RMS denominator.
  const idealCentsList: number[] = scale.intervals.map((iv) => iv.cents);
  // Tenney weighting needs each interval's monzo (prime factorization). A tempered scale
  // (e.g. an EDO sent as cents via the Generate page) is stored as lossy float-derived
  // rational approximations with no JI provenance (scala.ts), so factorizing throws
  // "Out of primes". Max/RMS cents-error are cents-only and stay exact, so degrade
  // gracefully: flag the scale tempered and emit NaN for the Tenney column (rendered as
  // "—") instead of throwing the whole table. Mirrors the lattice/diamond guard (b27027e).
  let tempered = false;
  const weightList: number[] = scale.intervals.map((iv) => {
    try {
      return Math.max(1, tenneyHeight(iv.monzo));
    } catch {
      tempered = true;
      return 1;
    }
  });

  const rows: EdoErrorRow[] = [];
  for (let N = range.min; N <= range.max; N++) {
    const stepCents = 1200 / N;
    let maxAbs = 0;
    let sumSq = 0;
    let tenneyWeighted = 0;
    for (let i = 0; i < idealCentsList.length; i++) {
      const ideal = idealCentsList[i]!;
      const nearest = Math.round(ideal / stepCents);
      const actual = nearest * stepCents;
      const err = actual - ideal;
      const absErr = Math.abs(err);
      if (absErr > maxAbs) maxAbs = absErr;
      sumSq += err * err;
      tenneyWeighted += absErr / weightList[i]!;
    }
    const rms = Math.sqrt(sumSq / idealCentsList.length);
    rows.push({
      edoSteps: N,
      maxCentsError: maxAbs,
      rmsCentsError: rms,
      // NaN signals "not applicable" for a tempered scale (no JI complexity to weight by).
      tenneyWeightedError: tempered ? NaN : tenneyWeighted,
    });
  }
  return rows;
}

/**
 * Per-step best JI approximation of an N-EDO under EITHER prime-limit OR odd-limit.
 *
 * Prime-limit branch delegates directly to `jiSubsetOfEdo` (Phase 2 SCALE-05) — parity with that
 * function is enforced by tests, not by re-implementing the algorithm here.
 *
 * Odd-limit branch enumerates odd ratios up to `limit` (capped at 31 per D-08), octave-reduces
 * each, and picks the closest by cents distance for each step. Duplicate closest ratios (common
 * for high-EDO / low-odd-limit, where multiple steps map to the same ratio) are collapsed by
 * EXACT canonical fraction string (Pitfall #1 / #6 — never cents-within-epsilon); the result
 * ends with exactly one 2/1 period (D-14). After dedupe the length is ≤ N + 1.
 */
export function bestJiInEdo(edoSteps: number, limit: number, kind: EdoJiKind): Scale {
  if (edoSteps < 1) {
    throw new RangeError(`bestJiInEdo: edoSteps must be >= 1 (got ${String(edoSteps)})`);
  }
  if (kind === "prime") {
    return jiSubsetOfEdo(edoSteps, limit);
  }
  // kind === "odd"
  if (limit < 1 || limit > ODD_LIMIT_CAP) {
    throw new RangeError(
      `bestJiInEdo: oddLimit must be in [1, ${String(ODD_LIMIT_CAP)}] (got ${String(limit)})`,
    );
  }
  const stepCents = 1200 / edoSteps;
  const intervals: Interval[] = [];
  for (let step = 0; step < edoSteps; step++) {
    if (step === 0) {
      intervals.push(new Interval("1/1"));
      continue;
    }
    const targetCents = stepCents * step;
    intervals.push(oddLimitApproximation(targetCents, limit));
  }

  // Dedupe by EXACT canonical fraction string (Pitfall #1 / #6 — never cents
  // tolerance), mirroring jiSubsetOfEdo / cps. Preserve first occurrence + order
  // (1/1 stays first). Drop any 2/1 already produced by a step so the explicit
  // period below is the single trailing 2/1 (D-14).
  const period = new Interval("2/1");
  const periodKey = period.fraction.toFraction();
  const seen = new Set<string>();
  const distinct: Interval[] = [];
  for (const iv of intervals) {
    const key = iv.fraction.toFraction();
    if (key === periodKey) continue; // appended explicitly below, exactly once
    if (!seen.has(key)) {
      seen.add(key);
      distinct.push(iv);
    }
  }
  distinct.push(period);
  return new Scale(distinct, period);
}

/**
 * Closest octave-reduced odd-limit ratio to `targetCents`.
 *
 * Enumerates all odd numerator/denominator pairs `i, j ∈ [1, oddLimitCap]` where both `i` and `j`
 * are odd; constructs `i/j`, octave-reduces into `[1, 2)`, verifies the post-reduction ratio
 * still respects the odd-limit cap (the reduction can introduce factors of 2 only — odd factors
 * pre-existed), and tracks the minimum |cents - targetCents|.
 *
 * `targetCents === 0` short-circuits to `1/1` (the unison is the trivial answer).
 *
 * Throws RangeError when `oddLimitCap` is outside [1, 31] (D-08 combinatorial safety cap).
 */
export function oddLimitApproximation(targetCents: number, oddLimitCap: number): Interval {
  if (oddLimitCap < 1 || oddLimitCap > ODD_LIMIT_CAP) {
    throw new RangeError(
      `oddLimitApproximation: oddLimitCap must be in [1, ${String(ODD_LIMIT_CAP)}] (got ${String(oddLimitCap)})`,
    );
  }
  if (targetCents === 0) {
    return new Interval("1/1");
  }
  let bestIv: Interval | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 1; i <= oddLimitCap; i += 2) {
    for (let j = 1; j <= oddLimitCap; j += 2) {
      const raw = new Interval(`${String(i)}/${String(j)}`);
      const reduced = raw.octaveReduce();
      const dist = Math.abs(reduced.cents - targetCents);
      if (dist < bestDist) {
        bestDist = dist;
        bestIv = reduced;
      }
    }
  }
  // Enumeration over odd i,j ∈ [1, cap] always includes (1, 1) → 1/1, so bestIv is always set
  // when oddLimitCap >= 1. Defensive return guards the type system without a runtime path.
  if (!bestIv) {
    return new Interval("1/1");
  }
  return bestIv;
}
