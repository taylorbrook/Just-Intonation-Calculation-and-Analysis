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
  add,
  sub,
  scale,
  tenneyHeight,
  wilsonHeight,
  PRIMES,
} from "xen-dev-utils";

export {
  toMonzo,
  monzoToBigNumeratorDenominator,
  primeLimit,
  monzosEqual,
  tenneyHeight,
  wilsonHeight,
  PRIMES,
};

export type Monzo = number[];

export const monzoAdd = add;
export const monzoSub = sub;
export const monzoScale = scale;

/**
 * Benedetti height = n × d (the actual product of numerator and denominator,
 * NOT the log). xen-dev-utils ships tenneyHeight (= log(n*d)) and wilsonHeight
 * but not Benedetti directly.
 *
 * Note: returns a Number. For typical music-theory ranges this fits well under
 * Number.MAX_SAFE_INTEGER. For large/pathological monzos consumers can compute
 * via `monzoToBigNumeratorDenominator` and multiply BigInts directly.
 */
export function benedettiHeight(monzo: Monzo): number {
  const { numerator, denominator } = monzoToBigNumeratorDenominator(monzo);
  return Number(numerator * denominator);
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
