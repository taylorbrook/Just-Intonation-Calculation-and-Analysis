/**
 * cps.ts — Combination Product Set (GEN-01), the flagship JI combinatorial kernel.
 *
 * Given a factor set and a choose-k, enumerate every k-element subset and
 * multiply each subset's members. The raw subset products are then ROOTED at
 * their own lowest product — every product is divided by the smallest product so
 * the CPS starts on a tonic 1/1 (the standard Wilson construction: a hexany is
 * the set of dyads BETWEEN the products, which is the products normalized to
 * their lowest tone). Each rooted ratio is octave-reduced, deduped by EXACT n/d,
 * sorted by cents, and the period is appended (D-14). The classic CPS families
 * fall out of the (factors, k) pair:
 *   - Hexany   = cps([1,3,5,7], 2)        → 6 degrees + period
 *   - Dekany   = cps([1,3,5,7,9], 2)      → 10 degrees + period
 *   - Eikosany = cps([1,3,5,7,9,11], 3)   → 20 degrees + period
 *
 * Exactness (Pitfall #1 / #6): products stay BigInt-exact through Interval.mul;
 * dedupe is keyed STRICTLY on `iv.fraction.toFraction()` (the canonical reduced
 * `n/d` string) — NEVER cents-within-epsilon. No float path can launder two
 * distinct ratios into one. The only float in this module is `iv.cents`, used
 * solely as a SORT KEY.
 *
 * Period (D-07): JI families fix the equave at the octave, but the kernel still
 * takes a `period` param so the capability exists (Bohlen-Pierce tritave etc.);
 * the UI fixes it at 2/1. Octave reduction is period-aware (Pitfall #13).
 *
 * Ownership (D-12 / OQ-4): hand-rolled over xen-dev-utils' `kCombinations` for
 * transparent BigInt ownership of the product step, rather than wrapping
 * SonicWeave's `cps` (the one-line alternative). `kCombinations` only supplies
 * the index-free subset enumeration over the `Interval[]` objects themselves.
 *
 * Defense-in-depth (T-06-01): `factors.length` is capped at MAX_FACTORS (12) and
 * `k` is bounded to `[1, factors.length]` BEFORE calling `kCombinations`. The
 * worst case C(12, 6) = 924 subsets is bounded; an uncapped large factor set
 * would freeze the browser tab.
 *
 * Pure data — no DOM, no audio. Consumed by src/components/generate-cps.ts (Plan
 * 02) which renders the picker widget.
 */

import { Interval } from "./interval.js";
import { Scale } from "./scale.js";
import { kCombinations } from "xen-dev-utils";

/** Defense-in-depth cap on the factor-set size (T-06-01). C(12, 6) = 924. */
const MAX_FACTORS = 12;

/**
 * GEN-01: Combination Product Set. Choose-k over `factors`, multiply each subset,
 * root every product at the smallest product (so the set starts on 1/1),
 * octave-reduce by `period`, dedupe by exact n/d, sort by cents, append `period`.
 *
 * @param factors - the factor set; each member is an Interval built from an
 *   integer ratio (e.g. `new Interval("3/1")`). Subset products stay BigInt-exact.
 * @param k - subset size. Must satisfy `1 <= k <= factors.length`.
 * @param period - the equave (default 2/1; D-07). Octave reduction is period-aware.
 * @throws RangeError if `factors.length` is outside `[1, MAX_FACTORS]` or `k` is
 *   outside `[1, factors.length]` (T-06-01 — the cap is the last line of defense
 *   against combinatorial DoS, enforced here in the kernel).
 */
export function cps(factors: Interval[], k: number, period: Interval = new Interval("2/1")): Scale {
  // Defense-in-depth caps FIRST (T-06-01) — before any enumeration.
  if (factors.length < 1 || factors.length > MAX_FACTORS) {
    throw new RangeError(
      `cps: factors.length must be in [1, ${String(MAX_FACTORS)}] (got ${String(factors.length)})`,
    );
  }
  if (!Number.isInteger(k) || k < 1 || k > factors.length) {
    throw new RangeError(
      `cps: k must be an integer in [1, ${String(factors.length)}] (got ${String(k)})`,
    );
  }
  // 260615-ipz: reject non-positive factors at cps's OWN boundary. A non-positive
  // factor would multiply into a non-positive product and then trip octaveReduce's
  // non-positive guard; fail closed here with a domain-specific message instead.
  if (factors.some((f) => f.fraction.s < 0n || f.fraction.n === 0n)) {
    throw new RangeError("cps: all factors must be positive ratios (> 0)");
  }

  // kCombinations enumerates k-element subsets of the Interval[] objects
  // themselves (it operates on elements, not indices).
  const subsets = kCombinations(factors, k);

  // Multiply each subset exactly (BigInt) — the raw subset products.
  const one = new Interval("1/1");
  const products = subsets.map((subset) => subset.reduce((acc, iv) => acc.mul(iv), one));

  // Root the CPS at its lowest product: divide every product by the smallest
  // (by value), so the set starts on a tonic 1/1 and the canonical Wilson
  // hexany/dekany/eikosany vectors fall out. The division stays BigInt-exact.
  // The root pick uses EXACT `Fraction.compare` (Pitfall #1/#6) — no float
  // tie/ordering ambiguity in selecting the tonic. (The cents-based SORT below
  // remains a display sort; only the root selection moved to exact compare.)
  let min = products[0];
  if (!min) {
    // Unreachable: k >= 1 and factors.length >= 1 guarantee >= 1 subset.
    throw new RangeError("cps: no subsets produced (empty combination)");
  }
  for (const p of products) {
    if (p.fraction.compare(min.fraction) < 0) min = p;
  }
  const rootMin = min;

  // Root each product, then octave-reduce by the period (period-aware, Pitfall #13).
  const reduced = products.map((p) => p.div(rootMin).octaveReduce(period));

  // Dedupe by EXACT n/d string (Pitfall #1 / #6) — never cents tolerance.
  const seen = new Set<string>();
  const distinct: Interval[] = [];
  for (const iv of reduced) {
    const key = iv.fraction.toFraction();
    if (!seen.has(key)) {
      seen.add(key);
      distinct.push(iv);
    }
  }

  // Sort by cents ascending (float used ONLY as a sort key — Pitfall #1).
  distinct.sort((a, b) => a.cents - b.cents);

  // Append the period as the final interval (D-14). The unison 1/1 is naturally
  // present whenever a subset product octave-reduces to 1/1 (e.g. the {1,...}
  // subsets of a 1-led factor set); we do not force-prepend it.
  distinct.push(period);

  return new Scale(distinct, period);
}
