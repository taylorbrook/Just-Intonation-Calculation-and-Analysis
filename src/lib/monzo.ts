/**
 * Monzo helpers — thin re-exports over xen-dev-utils' Number-backed monzo utilities,
 * plus two project-specific computations (oddLimit, benedettiHeight).
 *
 * R-01 GUARD: this file MUST NOT re-export `Fraction` from xen-dev-utils. Phase 2's
 * Fraction is the BigInt-backed class from fraction.js (see src/lib/interval.ts).
 */

import {
  toMonzo,
  monzoToBigNumeratorDenominator,
  primeLimit,
  monzosEqual,
  tenneyHeight,
  PRIMES,
} from "xen-dev-utils";

export { toMonzo, monzoToBigNumeratorDenominator, primeLimit, monzosEqual, tenneyHeight, PRIMES };

export type Monzo = number[];

/**
 * Benedetti height = n × d (the actual product of numerator and denominator,
 * NOT the log). xen-dev-utils ships tenneyHeight (= log(n*d)) and wilsonHeight
 * but not Benedetti directly.
 *
 * Returns the EXACT BigInt product `n * d` — no precision ceiling. Mercator's
 * comma (3^53 / 2^84) and larger commas stay exact past Number.MAX_SAFE_INTEGER.
 */
export function benedettiHeight(monzo: Monzo): bigint {
  const { numerator, denominator } = monzoToBigNumeratorDenominator(monzo);
  return numerator * denominator;
}

/**
 * Odd-limit = the largest odd factor of n × d after stripping all factors of 2.
 * Hand-written from the monzo (the prime-2 component is monzo[0], rest are odd primes).
 */
export function oddLimit(monzo: Monzo): number {
  const { numerator, denominator } = monzoToBigNumeratorDenominator(monzo);
  const stripTwos = (x: bigint): bigint => {
    let v = x;
    while (v > 0n && v % 2n === 0n) v /= 2n;
    return v;
  };
  const nOdd = stripTwos(numerator);
  const dOdd = stripTwos(denominator);
  return Number(nOdd > dOdd ? nOdd : dOdd);
}

/**
 * Prime-limit of a monzo = the largest prime that appears with a non-zero
 * exponent. Returns 1 for the unison (1/1 — no prime).
 *
 * Computed directly from the monzo array (NOT via xen-dev-utils' `primeLimit`,
 * which takes a Fraction/integer and throws on the zero monzo). Diamond-cell
 * diagonals octave-reduce to 1/1, so handling the zero monzo gracefully is a
 * load-bearing invariant for callers like src/components/tonality-diamond.ts.
 */
export function primeLimitOfMonzo(monzo: Monzo): number {
  let limit = 1;
  for (let i = 0; i < monzo.length; i++) {
    if (monzo[i] !== 0) {
      const p = PRIMES[i];
      if (p !== undefined && p > limit) limit = p;
    }
  }
  return limit;
}
