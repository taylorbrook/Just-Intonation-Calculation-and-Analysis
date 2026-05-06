/**
 * diamond.ts — Tonality-diamond cell enumeration (VIZ-02 data layer).
 *
 * Standard Partch tonality-diamond construction: for odd i, j ∈ [1, oddLimit],
 * the cell ratio is i/j octave-reduced to [1, 2). Octave reduction uses the
 * fixed period 2/1 — the diamond is octave-bound by definition, regardless of
 * the consuming scale's own period (Bohlen-Pierce or non-octave scales still
 * compare against an octave-bound diamond).
 *
 * inScale check uses Interval.equals (BigInt Fraction equality) — NEVER cents
 * tolerance (Pitfall #1, #6). Distinct commas like the syntonic comma vs the
 * schisma must not be conflated by float epsilon.
 *
 * Pure data — no DOM, no audio. Consumed by src/components/tonality-diamond.ts
 * (Plan 05) which renders the SVG.
 */

import { Interval } from "./interval.js";
import type { Scale } from "./scale.js";

/**
 * One cell of the tonality diamond — the octave-reduced ratio (as `numerator`
 * + `denominator` plus the full `Interval`) and an in-scale flag computed
 * against the caller's scale.
 *
 * `numerator` and `denominator` reflect the OCTAVE-REDUCED ratio's n/d (e.g.
 * the (i=5, j=1) cell octave-reduces 5/1 to 5/4, so cell.numerator === 5 and
 * cell.denominator === 4). Cells where the reduced ratio simplifies (e.g.
 * (i=3, j=3) → 1/1) collapse their numerator/denominator accordingly.
 */
export interface DiamondCell {
  /** Reduced-ratio numerator (`Number(ratio.fraction.n)`). */
  numerator: number;
  /** Reduced-ratio denominator (`Number(ratio.fraction.d)`). */
  denominator: number;
  /** i/j, octave-reduced to [1, 2) using the fixed period 2/1. */
  ratio: Interval;
  /** True iff scale.intervals.some(iv => iv.equals(ratio)). */
  inScale: boolean;
}

/**
 * Enumerate the N×N cells of an odd-limit-N tonality diamond, where N is the
 * count of odd integers in [1, oddLimit]. Cells are produced in row-major
 * order over (i, j) for i ∈ odds × j ∈ odds.
 *
 * Octave reduction uses Interval.octaveReduce()'s default period (2/1). Do
 * NOT pass scale.period — the diamond is octave-bound by definition; a
 * Bohlen-Pierce scale still compares against an octave-bound diamond.
 *
 * Defense-in-depth: oddLimit is bounded to [1, 1023] to prevent runaway
 * enumeration. The dashboard UI offers presets {7, 9, 11, 13, 15, 21, 31}.
 */
export function enumerateDiamond(oddLimit: number, scale: Scale): DiamondCell[] {
  if (!Number.isInteger(oddLimit) || oddLimit < 1 || oddLimit > 1023) {
    throw new RangeError(
      `enumerateDiamond: oddLimit must be integer in [1, 1023] (got ${String(oddLimit)})`,
    );
  }

  const odds: number[] = [];
  for (let k = 1; k <= oddLimit; k += 2) odds.push(k);

  const cells: DiamondCell[] = [];
  for (const i of odds) {
    for (const j of odds) {
      // octaveReduce() default period = 2/1. Diamond is octave-bound by
      // definition (do NOT thread scale.period through here).
      const ratio = new Interval(`${String(i)}/${String(j)}`).octaveReduce();
      const inScale = scale.intervals.some((iv) => iv.equals(ratio));
      // numerator/denominator reflect the REDUCED ratio's n/d so consumers
      // can label cells with their canonical reduced form (e.g. 5/4 not 5/1).
      cells.push({
        numerator: Number(ratio.fraction.n),
        denominator: Number(ratio.fraction.d),
        ratio,
        inScale,
      });
    }
  }
  return cells;
}
