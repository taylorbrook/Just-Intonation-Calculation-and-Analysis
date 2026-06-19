/**
 * Scale — ordered list of Intervals representing a tuning system.
 *
 * Composition pattern: intervals[0] is conventionally 1/1 (the unison; auto-prepended
 * by parseScala per D-13), and the LAST interval is the period (D-14: octave scales
 * end in 2/1, tritave/Bohlen-Pierce in 3/1, etc.).
 *
 * Immutable per D-24: rotate, reduce, dedupe, transpose return new Scale instances.
 * Period-aware reduction (Pitfall #13) — reduce() uses this.period as the equivalence
 * interval, NOT a hard-coded 2/1.
 *
 * Distinct from Mode (Pitfall #15) — a "mode" is a rotated Scale, not a separate type.
 * scale.rotate(n) returns the n-th mode AS A new Scale.
 *
 * Performance note (T-02-07): Scale.reduce/dedupe are O(n^2) in the dedupe pass
 * (`some` over the running output for each input interval). Acceptable for the
 * dashboard's bounded input sizes (≤ ~100 pitches); revisit if/when much larger
 * scales become a use case.
 */

import { Interval, UNISON, OCTAVE } from "./interval.js";
import { approximatePrimeLimit, PRIMES } from "xen-dev-utils";

export class Scale {
  readonly intervals: readonly Interval[];
  readonly period: Interval;

  constructor(intervals: readonly Interval[], period?: Interval) {
    if (intervals.length === 0) {
      throw new Error("Scale must have at least one interval");
    }
    const copy = [...intervals];
    Object.freeze(copy);
    this.intervals = copy;
    // Default period: last interval (D-14). Length checked above, so `!` is safe.
    const p = period ?? copy[copy.length - 1]!;
    // CR-01: reject period <= 1/1 at construction so Scale.reduce/rotate can't
    // hand a malformed period to Interval.octaveReduce and hang the tab.
    if (p.fraction.compare(UNISON.fraction) <= 0) {
      throw new RangeError(`Scale: period must be > 1/1 (got ${p.fraction.toFraction()})`);
    }
    this.period = p;
  }

  /**
   * SCALE-03: rotate to the n-th mode. Divides every interval by intervals[degree],
   * octave-reduces by the period, and sorts ascending. The resulting Scale always
   * starts with 1/1 and preserves the original period.
   */
  rotate(degree: number): Scale {
    if (degree === 0) {
      return new Scale(this.intervals, this.period);
    }
    const tonic = this.intervals[degree];
    if (!tonic) {
      throw new RangeError(
        `Scale.rotate: degree ${String(degree)} out of range (length ${String(this.intervals.length)})`,
      );
    }
    const reduced = this.intervals.map((iv) => iv.div(tonic).octaveReduce(this.period));
    const sorted = [...reduced].sort((a, b) => a.cents - b.cents);
    return new Scale(sorted, this.period);
  }

  /**
   * SCALE-02: octave-reduce every interval into [1, period), sort ascending, and
   * dedupe by exact rational equality. Period-aware per Pitfall #13: works for
   * 2/1 (octave) AND 3/1 (Bohlen-Pierce tritave) AND any other period.
   *
   * The result always ends with the period interval (D-14 contract). Inputs that
   * exactly equal the period are preserved as the period (not reduced down to 1/1)
   * so that the period-pinned scale shape is information-preserving.
   */
  reduce(): Scale {
    const reduced = this.intervals.map((iv) =>
      iv.equals(this.period) ? this.period : iv.octaveReduce(this.period),
    );
    // finalizeScale drops the period-equal entries and re-appends exactly one
    // period (D-14) — equivalent to preserving a single trailing period.
    return finalizeScale(reduced, this.period);
  }

  /**
   * Remove exact-rational duplicates, preserving first occurrence. Equality is via
   * Interval.equals (BigInt Fraction equality), NEVER cents-within-epsilon
   * (Pitfall #1, #6).
   */
  dedupe(): Scale {
    // O(n) dedupe by exact canonical key (Interval.key), preserving first
    // occurrence + original order. Equivalent to the prior O(n^2) `.some(equals)`
    // pass — fraction.js normalizes sign+GCD, so key-equality === Interval.equals.
    const seen = new Set<string>();
    const out: Interval[] = [];
    for (const iv of this.intervals) {
      if (seen.has(iv.key)) continue;
      seen.add(iv.key);
      out.push(iv);
    }
    return new Scale(out, this.period);
  }

  /**
   * SCALE-04: transpose every interval (and the period) by `by`. Multiplies through.
   */
  transpose(by: Interval): Scale {
    const shifted = this.intervals.map((iv) => iv.mul(by));
    return new Scale(shifted, this.period.mul(by));
  }

  /**
   * Convert a scale degree to a frequency in Hz. The float result is the audio-layer
   * boundary (Plan 05 sw-synth). T-02-08: defense-in-depth Hz clamping is the audio
   * module's responsibility.
   */
  degreeToFreq(degree: number, baseHz: number): number {
    const iv = this.intervals[degree];
    if (!iv) {
      throw new RangeError(
        `Scale.degreeToFreq: degree ${String(degree)} out of range (length ${String(this.intervals.length)})`,
      );
    }
    return baseHz * Number(iv.fraction.valueOf());
  }
}

/**
 * Shared scale-construction tail (S1) — the single source of truth for the
 * "turn raw intervals into a finished Scale" pattern repeated across every JI
 * generator (cps, harmonic, generators, mos) and the EDO-approximation builders
 * (jiSubsetOfEdo, bestJiInEdo).
 *
 * Steps: drop every interval that exactly equals `period` (the period is always
 * appended exactly once at the end, D-14), dedupe the rest by exact canonical
 * `n/d` key (Interval.key — NEVER cents-within-epsilon, Pitfall #1 / #6),
 * optionally sort ascending by cents (a display sort; the only float touched
 * here), then append `period` as the final interval.
 *
 * `sort` defaults to true. The two EDO-step builders pass `{ sort: false }`:
 * their inputs are already produced in ascending-cents (step) order and
 * nearest-ratio selection is monotonic, so preserving insertion order keeps
 * their output identical to the hand-rolled version.
 *
 * Callers that need octave reduction must reduce into [1, period) BEFORE calling
 * (this function never reduces), so the appended period sits at the right-open
 * boundary and no interior interval collides with it.
 */
export function finalizeScale(
  intervals: readonly Interval[],
  period: Interval,
  options: { sort?: boolean } = {},
): Scale {
  const { sort = true } = options;
  const seen = new Set<string>();
  const distinct: Interval[] = [];
  for (const iv of intervals) {
    if (iv.equals(period)) continue; // period is appended exactly once below (D-14)
    if (seen.has(iv.key)) continue;
    seen.add(iv.key);
    distinct.push(iv);
  }
  // Sort by cents ascending (float used ONLY as a sort key — Pitfall #1).
  if (sort) distinct.sort((a, b) => a.cents - b.cents);
  distinct.push(period);
  return new Scale(distinct, period);
}

/**
 * SCALE-05: JI subset of an N-EDO. For each EDO step's cents value, ask
 * xen-dev-utils' approximatePrimeLimit for the closest fraction within the
 * requested prime limit, then round-trip through `${n}/${d}` to recover the
 * BigInt-backed Fraction in our Interval (R-01).
 *
 * Duplicate closest-JI ratios (common for high-EDO / low-prime-limit, where
 * multiple distinct steps map to the SAME closest ratio) are collapsed by EXACT
 * canonical fraction string (Pitfall #1 / #6 — never cents-within-epsilon). The
 * result starts with 1/1 and ends with exactly one 2/1 period (D-14). After
 * dedupe the length is ≤ edoSteps + 1.
 */
export function jiSubsetOfEdo(edoSteps: number, primeLimit: number): Scale {
  if (edoSteps < 1) {
    throw new RangeError(`jiSubsetOfEdo: edoSteps must be >= 1 (got ${String(edoSteps)})`);
  }

  // Find the index of the largest prime <= primeLimit.
  let limitIndex = -1;
  for (let i = 0; i < PRIMES.length; i++) {
    const p = PRIMES[i];
    if (p === undefined || p > primeLimit) break;
    limitIndex = i;
  }
  if (limitIndex < 0) {
    throw new RangeError(`jiSubsetOfEdo: primeLimit ${String(primeLimit)} below 2`);
  }

  const intervals: Interval[] = [];
  for (let step = 0; step < edoSteps; step++) {
    if (step === 0) {
      intervals.push(UNISON);
      continue;
    }
    const cents = (1200 / edoSteps) * step;
    // maxExponent=5 keeps xen-dev-utils' Number-backed Fraction search inside
    // the safe-integer band even for 31-EDO 7-limit. Higher exponents (e.g. 8)
    // overflow on the first step of 31-EDO 7-limit ("Numerator above safe limit").
    const candidates = approximatePrimeLimit(
      cents,
      limitIndex,
      /*maxExponent=*/ 5,
      /*maxError=*/ 50,
      /*maxLength=*/ 1,
    );
    const first = candidates[0];
    if (!first) {
      // No fraction within tolerance — fall back to 1/1 placeholder. In practice
      // this should not happen for reasonable (edoSteps, primeLimit) pairs at
      // 50¢ tolerance and maxExponent=5.
      intervals.push(UNISON);
      continue;
    }
    // R-01 round-trip: xen-dev-utils' Fraction is Number-backed; we re-parse
    // through a string so the BigInt-backed Fraction in Interval is the source
    // of truth.
    intervals.push(new Interval(`${String(first.n)}/${String(first.d)}`));
  }

  // Dedupe by EXACT canonical key + append the single trailing 2/1 period (D-14)
  // via the shared tail. sort:false preserves the monotonic step insertion order
  // (Pitfall #1 / #6 — never cents tolerance); any 2/1 produced by a step is
  // dropped and re-appended exactly once.
  return finalizeScale(intervals, OCTAVE, { sort: false });
}
