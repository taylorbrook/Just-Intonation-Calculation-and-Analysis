/**
 * meru.ts — Wilson recurrence convergents (exact) + metallic-mean cents readout (GEN-10).
 *
 *   - meruScale(a, b, x0, x1, terms) — the Wilson recurrence `x_n = a·x_{n-1} + b·x_{n-2}`
 *     as a Scale of EXACT successive-ratio convergents `x_i / x_{i-1}` (Mt. Meru reading).
 *   - metallicLimitCents(a, b) — the IRRATIONAL metallic-mean limit `(a + √(a²+4b))/2`
 *     in cents (cents-of-record / display-only — NEVER a scale degree).
 *
 * Why hand-rolled (INVENTORY discipline / Pitfall #5): SonicWeave has no Mt. Meru
 * builtin (08-RESEARCH A-4 #15). The recurrence is trivial; the only design choices
 * are the defense-in-depth caps and the (deliberately omitted) octave-reduce.
 *
 * EXACTNESS — the load-bearing distinction:
 *   The recurrence sequence terms are INTEGERS (BigInt). Each convergent is the exact
 *   reduced ratio `x_i / x_{i-1}` built via the R-01 `${n}/${d}` round-trip into a
 *   kernel BigInt `Interval` — fraction.js auto-reduces. No float ever touches the
 *   convergents (Pitfall #1/#6). `metallicLimitCents` is the ONLY float path, and its
 *   result is a standalone readout (D-09) — the irrational mean is NEVER admitted as a
 *   Scale interval (SURF-06 / Pitfall #4). The convergents only CONVERGE to it.
 *
 * D-19 discretion: convergents are left LITERAL (NOT octave-reduced) — the recurrence
 * ratios ARE the Mt. Meru reading (Fibonacci spans multiple registers: 2/1, 3/2, 5/3, …).
 * The user gets the reduced view for free via the Plan-03 transform strip's "reduce."
 *
 * D-03 (Phase 6): there is NO `tempered` field on Interval/Scale. The metallic limit's
 * tempered flag lives at the Plan-03 component layer, not here — `metallicLimitCents`
 * is just a `number`.
 *
 * Defense-in-depth (T-08-01 / Pitfall 5 / D-11): `MAX_MERU_TERMS` is validated BEFORE
 * the loop and `MAX_MERU_MAGNITUDE` is checked DURING the loop → RangeError. Fibonacci-
 * rate (~φ^n) growth cannot run away or produce a multi-thousand-digit ratio that stalls
 * the tab (mirrors the Phase-6 generators.ts cap idiom: MAX_DIVISIONS/MAX_HARMONIC).
 *
 * Pure data — no DOM, no audio. Consumed by src/components/generate-meru.ts (Plan 03).
 */

import { Interval } from "./interval.js";
import { Scale } from "./scale.js";

/**
 * Defense-in-depth cap on the term count (T-08-01 / D-11). Fibonacci-rate ratios
 * past ~12 terms are musically indistinguishable (they have already converged to the
 * metallic mean to well under a cent), so 48 is a generous musical ceiling that still
 * bounds the BigInt growth and DOM render cost. Mirrors the Phase-6 MAX_HARMONIC idiom.
 */
export const MAX_MERU_TERMS = 48;

/**
 * Defense-in-depth magnitude ceiling (T-08-01 / D-11). Checked against each new term
 * DURING the recurrence so a huge seed/coefficient combination raises a RangeError
 * mid-loop instead of producing a thousand-digit ratio label. 10^30 comfortably clears
 * any musically-relevant Fibonacci/metallic term (the 48th Fibonacci number is ~10^10)
 * while still capping pathological seeds. BigInt itself never loses precision; this cap
 * is purely a DoS / render-cost guard.
 */
const MAX_MERU_MAGNITUDE = 10n ** 30n;

/**
 * GEN-10: the Wilson recurrence `x_n = a·x_{n-1} + b·x_{n-2}` as a Scale of exact
 * successive-ratio convergents `x_i / x_{i-1}` (D-12 default = Fibonacci/golden:
 * a=1, b=1, seeds 1,1 → convergents 1/1, 2/1, 3/2, 5/3, 8/5, 13/8, …).
 *
 * The sequence has `terms + 1` integer members (the two seeds + `terms - 1` recurrence
 * steps), yielding `terms` successive-ratio convergents. The recurrence members are
 * BigInt integers; each convergent is the exact reduced ratio (R-01 `${n}/${d}` round-
 * trip). Convergents are LITERAL (NOT octave-reduced) per D-19.
 *
 * Period: the WIDEST convergent (max by cents). It is guaranteed > 1/1 for positive
 * seeds/coefficients (the recurrence is strictly increasing, so x1/x0 ≥ 1 and at least
 * one ratio exceeds 1/1), satisfying the scale.ts CR-01 rule (period > 1/1). The literal
 * Mt. Meru reading has no canonical equave; the widest interval is the natural choice for
 * the Scale's period field and never collides with the CR-01 guard.
 *
 * @throws RangeError if `terms` ∉ [1, MAX_MERU_TERMS] (BEFORE enumeration), or if any
 *   recurrence term exceeds MAX_MERU_MAGNITUDE (DURING enumeration), or if a seed is
 *   non-positive (the ratio would be non-positive / undefined — fail closed).
 */
export function meruScale(a: bigint, b: bigint, x0: bigint, x1: bigint, terms: number): Scale {
  // Cap FIRST (T-08-01 / D-11): an out-of-range term count never reaches the loop.
  if (!Number.isInteger(terms) || terms < 1 || terms > MAX_MERU_TERMS) {
    throw new RangeError(
      `meruScale: terms must be an integer in [1, ${String(MAX_MERU_TERMS)}] (got ${String(terms)})`,
    );
  }
  // Seeds must be positive so every successive ratio is a positive rational (Pitfall #6).
  if (x0 <= 0n || x1 <= 0n) {
    throw new RangeError(
      `meruScale: seeds x0, x1 must be positive (got ${String(x0)}, ${String(x1)})`,
    );
  }

  // Build the integer recurrence. `terms` convergents need `terms + 1` members.
  const seq: bigint[] = [x0, x1];
  // Seeds themselves are bounded by the same magnitude cap (a huge seed is just as
  // runaway as a huge recurrence term).
  if (x0 > MAX_MERU_MAGNITUDE || x1 > MAX_MERU_MAGNITUDE) {
    throw new RangeError(
      `meruScale: seed magnitude exceeds ${String(MAX_MERU_MAGNITUDE)} (runaway guard)`,
    );
  }
  for (let i = 2; i < terms + 1; i++) {
    const prev1 = seq[i - 1]!;
    const prev2 = seq[i - 2]!;
    const next = a * prev1 + b * prev2;
    // Magnitude cap DURING the loop (T-08-01 / D-11) — fail closed, never truncate.
    if (next > MAX_MERU_MAGNITUDE) {
      throw new RangeError(
        `meruScale: recurrence term exceeds ${String(MAX_MERU_MAGNITUDE)} at step ${String(i)} (runaway guard)`,
      );
    }
    seq.push(next);
  }

  // Successive-ratio convergents x_i / x_{i-1} as exact BigInt Intervals (R-01).
  const intervals: Interval[] = [];
  for (let i = 1; i < seq.length; i++) {
    intervals.push(new Interval(`${String(seq[i])}/${String(seq[i - 1])}`));
  }

  // Period = widest convergent (max by cents — float used ONLY as a max key, Pitfall #1).
  // Guaranteed > 1/1 for positive seeds/coeffs; satisfies the scale.ts CR-01 period rule.
  let period = intervals[0]!;
  for (const iv of intervals) {
    if (iv.cents > period.cents) period = iv;
  }
  return new Scale(intervals, period);
}

/**
 * GEN-10 / D-09: the IRRATIONAL metallic-mean limit `(a + √(a²+4b))/2` in cents.
 * golden (1,1) → φ ≈ 1.618034 → 833.09¢; silver (2,1) → 1525.86¢; bronze (3,1) → 2068.41¢.
 *
 * This is a cents-of-record readout ONLY (Pitfall #1) — the irrational mean is NEVER
 * admitted as a Scale interval (SURF-06 / Pitfall #4). The Plan-03 widget renders it as a
 * separate tempered-flagged readout beside the exact-rational convergent table.
 */
export function metallicLimitCents(a: number, b: number): number {
  const mean = (a + Math.sqrt(a * a + 4 * b)) / 2;
  return 1200 * Math.log2(mean);
}
