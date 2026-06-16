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
 * Provenance (260615-jtm): a readonly `source: "ratio" | "cents"` flag records
 * whether an interval came from an exact ratio/monzo or from a tempered cents
 * value. It is metadata only — never affects cents/fraction/equality/arithmetic
 * — consumed solely by writeScl to serialize cents-of-record instead of
 * laundering tempered pitches into fake ratios.
 *
 * Immutable per D-24: source is set once at construction; mul, div, inv,
 * octaveReduce all return new Interval instances (defaulting source to "ratio",
 * since a transposed/reduced pitch is no longer the same pitch).
 */

import { Fraction } from "fraction.js";
import { toMonzo, monzoToBigNumeratorDenominator, PRIMES } from "xen-dev-utils";

export type FractionInput =
  | Fraction
  | string
  | bigint
  | number
  | { n: bigint; d: bigint }
  | { n: number; d: number };

/**
 * Ratio-vs-cents provenance (260615-jtm finding #1). Tracks whether an Interval
 * was constructed from an EXACT source (a ratio/monzo — `"ratio"`) or derived
 * from a tempered CENTS value (`"cents"`, a float→Fraction approximation).
 *
 * This is metadata ONLY: it never affects `.cents`, `.fraction`, `.equals`, or
 * arithmetic. Its single consumer is serialization — `writeScl` emits cents-of-
 * record for `"cents"`-source degrees instead of laundering them into bogus
 * high-limit JI ratios.
 *
 * Set ONCE at construction (D-24 immutability). Default is `"ratio"` so every
 * exact-construction call site stays correct without change.
 */
export type IntervalSource = "ratio" | "cents";

export class Interval {
  readonly fraction: Fraction;
  /**
   * Provenance of this interval (260615-jtm). `"ratio"` = exact (ratio/monzo),
   * `"cents"` = derived from a tempered cents value (float-approximate Fraction).
   * Immutable per D-24; metadata only — does not affect math or equality.
   */
  readonly source: IntervalSource;
  #monzo: number[] | undefined;
  #cents: number | undefined;

  constructor(input: FractionInput, source: IntervalSource = "ratio") {
    // fraction.js accepts string | number | bigint | {n,d} | Fraction in its constructor.
    // Our FractionInput is structurally compatible with fraction.js' own FractionInput.
    this.fraction = input instanceof Fraction ? input : new Fraction(input);
    this.source = source;
  }

  static fromMonzo(monzo: number[]): Interval {
    // A monzo is exact by construction → always "ratio" (the constructor default).
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
      // Primary path: the direct float ratio. This works for EVERY fraction —
      // including tempered/cents-derived ratios whose huge float-approximation
      // numerators are NOT prime-factorizable (toMonzo throws "Out of primes").
      const direct = 1200 * Math.log2(Number(this.fraction.valueOf()));
      if (Number.isFinite(direct)) {
        this.#cents = direct;
      } else {
        // Overflow fallback: Number(n/d) becomes Infinity once n or d exceeds
        // ~2^1024. Recover from the monzo (Σ monzo[i] · log2(PRIMES[i])), which
        // stays finite for arbitrarily large JI ratios. Only reachable for
        // factorizable (exact JI) fractions — those are the ones that overflow.
        let sum = 0;
        const m = this.monzo;
        for (let i = 0; i < m.length; i++) {
          const exp = m[i];
          if (exp === undefined || exp === 0) continue;
          const p = PRIMES[i];
          if (p === undefined) continue;
          sum += exp * Math.log2(p);
        }
        this.#cents = 1200 * sum;
      }
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
    const one = new Fraction(1n, 1n);
    if (p.fraction.compare(one) <= 0) {
      throw new RangeError(
        `Interval.octaveReduce: period must be > 1/1 (got ${p.fraction.toFraction()})`,
      );
    }
    let f = this.fraction;
    // Guard the TRUE infinite-loop surface (260615-ipz): a non-positive fraction
    // (<= 0). `f.compare(one) < 0` stays true forever for a negative/zero `f`
    // because `f.mul(pf)` cannot push it up to 1/1. The test is sign/zero based
    // (`.s < 0n || .n === 0n`) — NOT `compare(one) <= 0`, which would over-reject
    // valid sub-unison ratios (1/2, 3/5) that the tonality diamond depends on
    // reducing (e.g. 3/5 -> 6/5). `one` is reused above only for the period guard.
    if (f.s < 0n || f.n === 0n) {
      throw new RangeError(
        `Interval.octaveReduce: cannot reduce a non-positive ratio (got ${f.toFraction()})`,
      );
    }
    const pf = p.fraction;
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
