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

import { Interval } from "./interval.js";
// R-01: NEVER import Fraction from xen-dev-utils — see eslint.config.js + INVENTORY.md.
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
    this.period = period ?? copy[copy.length - 1]!;
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
    const reduced = this.intervals.map((iv) =>
      iv.div(tonic).octaveReduce(this.period),
    );
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
    const sorted = [...reduced].sort((a, b) => a.cents - b.cents);
    const deduped: Interval[] = [];
    for (const iv of sorted) {
      if (!deduped.some((d) => d.equals(iv))) deduped.push(iv);
    }
    // Ensure the result ends with the period (D-14). If the period was not in the
    // input set, append it; otherwise it's already the last entry after sorting.
    const last = deduped[deduped.length - 1];
    if (!last || !last.equals(this.period)) {
      deduped.push(this.period);
    }
    return new Scale(deduped, this.period);
  }

  /**
   * Remove exact-rational duplicates, preserving first occurrence. Equality is via
   * Interval.equals (BigInt Fraction equality), NEVER cents-within-epsilon
   * (Pitfall #1, #6).
   */
  dedupe(): Scale {
    const out: Interval[] = [];
    for (const iv of this.intervals) {
      if (!out.some((d) => d.equals(iv))) out.push(iv);
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
 * SCALE-05: JI subset of an N-EDO. For each EDO step's cents value, ask
 * xen-dev-utils' approximatePrimeLimit for the closest fraction within the
 * requested prime limit, then round-trip through `${n}/${d}` to recover the
 * BigInt-backed Fraction in our Interval (R-01).
 *
 * The result has edoSteps intervals (indexed 0..edoSteps-1) plus 2/1 appended
 * as the period — total length = edoSteps + 1.
 */
export function jiSubsetOfEdo(edoSteps: number, primeLimit: number): Scale {
  if (edoSteps < 1) {
    throw new RangeError(
      `jiSubsetOfEdo: edoSteps must be >= 1 (got ${String(edoSteps)})`,
    );
  }

  // Find the index of the largest prime <= primeLimit.
  let limitIndex = -1;
  for (let i = 0; i < PRIMES.length; i++) {
    const p = PRIMES[i];
    if (p === undefined || p > primeLimit) break;
    limitIndex = i;
  }
  if (limitIndex < 0) {
    throw new RangeError(
      `jiSubsetOfEdo: primeLimit ${String(primeLimit)} below 2`,
    );
  }

  const intervals: Interval[] = [];
  for (let step = 0; step < edoSteps; step++) {
    if (step === 0) {
      intervals.push(new Interval("1/1"));
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
      // 50¢ tolerance and maxExponent=8.
      intervals.push(new Interval("1/1"));
      continue;
    }
    // R-01 round-trip: xen-dev-utils' Fraction is Number-backed; we re-parse
    // through a string so the BigInt-backed Fraction in Interval is the source
    // of truth.
    intervals.push(new Interval(`${String(first.n)}/${String(first.d)}`));
  }
  intervals.push(new Interval("2/1"));
  return new Scale(intervals, new Interval("2/1"));
}
