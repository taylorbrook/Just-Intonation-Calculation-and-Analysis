/**
 * Interval — the JI math kernel's universal currency (ARCHITECTURE.md Pattern 1).
 *
 * Source of truth: BigInt-backed Fraction from fraction.js@5.3.4 (R-01: NEVER
 * import Fraction from xen-dev-utils — its Fraction is Number-backed and silently
 * loses precision for large numerators).
 *
 * Lazy monzo + cents caches. Cents is a DISPLAY PROJECTION ONLY — never use it
 * as input to a kernel function (Pitfall #1). Equality and arithmetic always go
 * through the BigInt Fraction.
 *
 * Immutable per D-24: mul, div, inv, octaveReduce all return new Interval instances.
 */

import { Fraction } from "fraction.js";
import { toMonzo, monzoToBigNumeratorDenominator } from "xen-dev-utils";

export type FractionInput =
  | Fraction
  | string
  | bigint
  | number
  | { n: bigint; d: bigint }
  | { n: number; d: number };

export class Interval {
  readonly fraction: Fraction;
  #monzo: number[] | undefined;
  #cents: number | undefined;

  constructor(input: FractionInput) {
    // fraction.js accepts string | number | bigint | {n,d} | Fraction in its constructor.
    // Our FractionInput is structurally compatible with fraction.js' own FractionInput.
    this.fraction = input instanceof Fraction ? input : new Fraction(input);
  }

  static fromMonzo(monzo: number[]): Interval {
    const { numerator, denominator } = monzoToBigNumeratorDenominator(monzo);
    return new Interval(new Fraction(numerator, denominator));
  }

  get monzo(): number[] {
    if (this.#monzo === undefined) {
      this.#monzo = monzoOfFraction(this.fraction);
    }
    return this.#monzo;
  }

  get cents(): number {
    if (this.#cents === undefined) {
      // Display projection only — float math is acceptable here (Pitfall #1).
      this.#cents = 1200 * Math.log2(Number(this.fraction.valueOf()));
    }
    return this.#cents;
  }

  get centsFrom12tet(): number {
    const c = this.cents;
    return c - Math.round(c / 100) * 100;
  }

  mul(other: Interval): Interval {
    return new Interval(this.fraction.mul(other.fraction));
  }

  div(other: Interval): Interval {
    return new Interval(this.fraction.div(other.fraction));
  }

  inv(): Interval {
    return new Interval(this.fraction.inverse());
  }

  /**
   * Period-aware octave reduction (Pitfall #13).
   * Default period = 2/1. Pass `new Interval("3/1")` for tritave (Bohlen-Pierce).
   */
  octaveReduce(period?: Interval): Interval {
    const p = period ?? new Interval("2/1");
    let f = this.fraction;
    const pf = p.fraction;
    const one = new Fraction(1n, 1n);
    // Reduce f into [1, p) by dividing/multiplying by p as needed.
    while (f.compare(one) < 0) f = f.mul(pf);
    while (f.compare(pf) >= 0) f = f.div(pf);
    return new Interval(f);
  }

  equals(other: Interval): boolean {
    return this.fraction.equals(other.fraction);
  }

  toString(): string {
    return this.fraction.toFraction();
  }
}

/**
 * Compute a monzo for an arbitrary fraction (with possibly negative exponents).
 * xen-dev-utils' `toMonzo` accepts bigint but throws on non-positive — handle n/d
 * by length-tolerant subtraction of the two monzos.
 */
function monzoOfFraction(f: Fraction): number[] {
  const nMonzo = toMonzo(f.n);
  const dMonzo = toMonzo(f.d);
  const len = Math.max(nMonzo.length, dMonzo.length);
  const out = new Array<number>(len);
  for (let i = 0; i < len; i++) {
    out[i] = (nMonzo[i] ?? 0) - (dMonzo[i] ?? 0);
  }
  return out;
}
