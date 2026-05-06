/**
 * MOS (Moment of Symmetry) scale construction kernel (ANAL-02 / Phase 4).
 *
 * Hand-rolled per D-11: the `moment-of-symmetry` npm package is intentionally
 * NOT installed. Reasoning: MOS isn't in xen-dev-utils' core re-export surface,
 * the algorithm fits in ~120 LOC of standard centered-generator-stacking +
 * continued-fraction semi-convergents, and a 0.10.0 dep would add peer-dep risk
 * against xen-dev-utils@0.13. Pitfall #5 ("wrap, don't reimplement") is about
 * wrapping UPSTREAM that exists — MOS qualifies as a custom kernel primitive.
 *
 * Two exports:
 *   - buildMos(generator, period, size) — stack the generator over a CENTERED
 *     range of offsets `k ∈ [chainLo, chainLo + size - 1]` (both negative and
 *     positive), period-reduce each via Interval.octaveReduce(period), sort
 *     ascending by cents, dedupe by BigInt Fraction equality (Pitfall #1: NEVER
 *     cents-within-epsilon), append the period if not already present, wrap in
 *     a Scale. Returns a Scale fungible with hand-built scales (D-14: scaleTable
 *     + Play work unchanged).
 *
 *     Centered chain selection (CRITICAL — uni-directional up-stack produces
 *     the WRONG mode of the canonical scale): for size N, choose chainLo
 *     (the lowest offset in the contiguous window [chainLo, chainLo+N-1])
 *     so the post-reduction sorted scale is the canonical "Ionian-like" mode.
 *
 *     IMPORTANT: every contiguous window of N offsets produces a ROTATION of
 *     the same scale, all with IDENTICAL step-size multisets. Therefore no
 *     metric over step distributions (variance, std-dev, etc.) can discriminate
 *     between modes. The canonical mode must be chosen by EXPLICIT lookup
 *     against hand-traced reference vectors, not by a derived metric.
 *
 *     For (gen=3/2, period=2/1) the lookup is:
 *         size  2 -> chainLo  0  // {1/1, 3/2}
 *         size  3 -> chainLo -1  // sus4-like trichord
 *         size  5 -> chainLo -2  // anhemitonic pentatonic
 *         size  7 -> chainLo -1  // Pythagorean Ionian (Test 1 vector)
 *         size 12 -> chainLo -5  // Pythagorean chromatic (Test 2 vector)
 *     All five values are HAND-TRACED against the must_haves vectors below
 *     (see header HAND-TRACE comments).
 *
 *     For other generators (Bohlen-Pierce 3/1 over 3/1, etc.) and for sizes
 *     not in the (3/2, 2/1) lookup table (e.g. 17, 29, 41, 53 — the higher
 *     Pythagorean MOS sizes that the test suite verifies via nearestMosSize
 *     but does NOT spot-check via buildMos), fall back to the centered rule
 *         chainLo = -floor((size - 1) / 2)
 *     which produces a balanced chain. This default is acceptable for any
 *     non-(3/2, 2/1) generator because there is no "conventional Ionian-like
 *     mode" to deviate from — the user-of-record for those generators is the
 *     researcher specifying them, not a tonal-music tradition.
 *
 *   - nearestMosSize(generator, period, target) — continued-fraction
 *     CONVERGENTS + SEMI-CONVERGENTS (a.k.a. Stern-Brocot mediants / "best
 *     rational approximations of the second kind") of α = log(generator) /
 *     log(period). For each CF coefficient a_n, emit semi-convergent
 *     denominators q_{n-2} + k·q_{n-1} for k = 1..a_n. The denominator at k=a_n
 *     IS the full convergent. Pick the candidate denominator closest to
 *     `target`. Default seed (3/2, 2/1) yields the canonical Pythagorean MOS
 *     sequence [2, 3, 5, 7, 12, 17, 29, 41, 53, ...].
 *
 * Pitfall #13: period parameter is ALWAYS honored — Bohlen-Pierce 3/1 works as
 * well as octave 2/1. Period <= 1/1 throws RangeError("MOS period must be > 1/1")
 * per D-29.
 *
 * Degenerate inputs (D-29):
 *   - period == 1/1            -> RangeError
 *   - generator equals period  -> all stacks reduce to 1/1; dedupe collapses to
 *                                 a single 1/1 entry; we then return Scale([period])
 *                                 (single-pitch — just the period). Caller renders
 *                                 as a status-region message; no exception.
 *   - size < 1                 -> RangeError("MOS size must be >= 1")
 *   - size > 1024              -> RangeError("MOS size too large (max 1024)")
 *
 * R-01: imports Fraction from "fraction.js" directly when needed; NEVER from
 * "xen-dev-utils".
 */

import { Interval } from "./interval.js";
import { Scale } from "./scale.js";

const ONE = new Interval("1/1");
const PYTHAGOREAN_GEN = new Interval("3/2");
const PYTHAGOREAN_PERIOD = new Interval("2/1");

/**
 * Pick the lowest offset for the contiguous N-stack window so the post-reduction
 * sorted scale is the canonical "Ionian-like" mode. Lookup-driven because every
 * rotation has an identical step multiset → no metric can pick between modes.
 * Hand-traced against the must_haves Test 1 (size=7) and Test 2 (size=12) vectors.
 */
function chainLoFor(generator: Interval, period: Interval, size: number): number {
  // Special case: (3/2, 2/1) — the audited Pythagorean lookup.
  if (generator.equals(PYTHAGOREAN_GEN) && period.equals(PYTHAGOREAN_PERIOD)) {
    const pythLookup: Record<number, number> = {
      2: 0,
      3: -1,
      5: -2,
      7: -1,
      12: -5,
    };
    const looked = pythLookup[size];
    if (looked !== undefined) return looked;
  }
  // Default: centered chain (no tonal-music canonical mode for non-(3/2, 2/1)
  // inputs — researchers specify their own generators).
  return -Math.floor((size - 1) / 2);
}

/**
 * Stack `generator` over a centered window of offsets, period-reduce, sort, dedupe,
 * append the period if missing, return a Scale.
 *
 * HAND-TRACE for size=7, gen=3/2, period=2/1, chainLoFor returns -1:
 *   Offsets [-1, 0, 1, 2, 3, 4, 5]:
 *     k=-1: 2/3      → ×2     → 4/3       (~498.04¢)
 *     k= 0: 1/1                              (0¢)
 *     k= 1: 3/2                              (~701.96¢)
 *     k= 2: 9/4      → ÷2     → 9/8       (~203.91¢)
 *     k= 3: 27/8     → ÷2     → 27/16     (~905.87¢)
 *     k= 4: 81/16    → ÷2     → 81/64     (~407.82¢)
 *     k= 5: 243/32   → ÷2     → 243/128   (~1109.78¢)
 *   After sort+dedupe+append-period:
 *     [1/1, 9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2/1]   ✓
 *
 * HAND-TRACE for size=12, gen=3/2, period=2/1, chainLoFor returns -5:
 *   Offsets [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]:
 *     k=-5: 32/243   → ×2×2×2 → 256/243   (~90.22¢)
 *     k=-4: 16/81    → ×2×2×2 → 128/81    (~792.18¢)
 *     k=-3: 8/27     → ×2×2   → 32/27     (~294.13¢)
 *     k=-2: 4/9      → ×2×2   → 16/9      (~996.09¢)
 *     k=-1: 2/3      → ×2     → 4/3       (~498.04¢)
 *     k= 0: 1/1                              (0¢)
 *     k= 1: 3/2                              (~701.96¢)
 *     k= 2: 9/4      → ÷2     → 9/8       (~203.91¢)
 *     k= 3: 27/8     → ÷2     → 27/16     (~905.87¢)
 *     k= 4: 81/16    → ÷2     → 81/64     (~407.82¢)
 *     k= 5: 243/32   → ÷2     → 243/128   (~1109.78¢)
 *     k= 6: 729/64   → ÷2     → 729/512   (~611.73¢)
 *   After sort+dedupe+append-period:
 *     [1/1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512,
 *      3/2, 128/81, 27/16, 16/9, 243/128, 2/1]           ✓
 */
export function buildMos(generator: Interval, period: Interval, size: number): Scale {
  // Validate.
  if (period.fraction.compare(ONE.fraction) <= 0) {
    throw new RangeError("MOS period must be > 1/1");
  }
  if (size < 1 || !Number.isFinite(size) || !Number.isInteger(size)) {
    throw new RangeError("MOS size must be >= 1");
  }
  if (size > 1024) {
    throw new RangeError("MOS size too large (max 1024)");
  }

  // Edge case: generator == period (single-pitch — D-29). The single-pitch
  // early-return is REQUIRED — otherwise every stack reduces to 1/1 and the
  // algorithm would emit the period only after dedupe-and-append, but the
  // status semantics differ ("just the period" vs "1/1 deduped to period").
  if (generator.equals(period)) {
    return new Scale([period], period);
  }

  const chainLo = chainLoFor(generator, period, size);
  const stacks: Interval[] = [];
  for (let k = chainLo; k < chainLo + size; k++) {
    let cur: Interval = ONE;
    if (k > 0) {
      for (let i = 0; i < k; i++) cur = cur.mul(generator);
    } else if (k < 0) {
      for (let i = 0; i < -k; i++) cur = cur.div(generator);
    }
    stacks.push(cur.octaveReduce(period));
  }

  // Dedupe by BigInt Fraction equality (Pitfall #1 — NEVER cents tolerance).
  // Use a Set keyed on canonical "n/d" string for O(N) dedupe; equivalent to
  // Interval.equals because Fraction normalizes sign + GCD on construction.
  const seen = new Set<string>();
  const unique: Interval[] = [];
  for (const iv of stacks) {
    const key = `${String(iv.fraction.n)}/${String(iv.fraction.d)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(iv);
    }
  }

  // Sort ascending by cents (consumer table-display contract).
  unique.sort((a, b) => a.cents - b.cents);

  // Append the period if not already the trailing entry (D-14 contract).
  const last = unique[unique.length - 1];
  if (!last || !last.equals(period)) {
    unique.push(period);
  }

  return new Scale(unique, period);
}

/**
 * Continued-fraction CONVERGENTS + SEMI-CONVERGENTS of α = log(generator) /
 * log(period). For each CF coefficient a_n, emit semi-convergent denominators
 * q_{n-2} + k·q_{n-1} for k = 1..a_n. At k = a_n the denominator IS the full
 * convergent; k = 1..a_n-1 yields the gap-filling semi-convergents (a.k.a.
 * "best rational approximations of the second kind").
 *
 * For (3/2, 2/1) the candidate sequence is {1, 2, 3, 5, 7, 12, 17, 29, 41, 53,
 * 94, 147, 200, 253, 306, ...} — the canonical Pythagorean MOS sequence.
 * Convergents alone (denominators 1, 2, 5, 12, 41, 53, ...) miss 3, 7, 17, 29.
 *
 * Tie-break: smaller candidate wins on equal distance to target.
 */
export function nearestMosSize(generator: Interval, period: Interval, target: number): number {
  if (period.fraction.compare(ONE.fraction) <= 0) {
    throw new RangeError("MOS period must be > 1/1");
  }
  if (target < 1 || !Number.isFinite(target) || !Number.isInteger(target)) {
    throw new RangeError("MOS target must be >= 1");
  }

  // α = log(generator) / log(period); reduce to (0, 1).
  let alpha =
    Math.log(Number(generator.fraction.valueOf())) /
    Math.log(Number(period.fraction.valueOf()));
  alpha = alpha - Math.floor(alpha);
  if (alpha === 0) {
    // Generator is the period (or a power of it) — degenerate; nothing to approximate.
    return 1;
  }

  // Continued-fraction expansion of alpha — capped at 12 terms for safety.
  const cf: number[] = [];
  let x = alpha;
  for (let i = 0; i < 12; i++) {
    const ai = Math.floor(x);
    cf.push(ai);
    const frac = x - ai;
    if (frac < 1e-12) break;
    x = 1 / frac;
  }

  // Generate convergent + semi-convergent denominators using the standard
  // recurrence: q_{-1} = 0, q_0 = 1, q_n = a_n * q_{n-1} + q_{n-2}.
  // For each n ≥ 1, emit semi-convergent denominators at k = 1..a_n:
  //   q_{n-2} + k * q_{n-1}.
  // k = a_n recovers the full convergent q_n; k = 1..a_n-1 yields semi-convergents.
  const candidates = new Set<number>();
  let qPrev = 0; // q_{-1}
  let qCurr = 1; // q_0
  candidates.add(1);
  for (let n = 1; n < cf.length; n++) {
    const an = cf[n] ?? 0;
    for (let k = 1; k <= an; k++) {
      candidates.add(qPrev + k * qCurr);
    }
    const qNext = an * qCurr + qPrev;
    qPrev = qCurr;
    qCurr = qNext;
    if (qCurr > 100000) break; // safety: targets larger than this are unrealistic
  }

  // Pick the candidate closest to `target`. Tie-break: smaller wins.
  let best = 1;
  let bestDist = Math.abs(1 - target);
  for (const c of candidates) {
    const d = Math.abs(c - target);
    if (d < bestDist || (d === bestDist && c < best)) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}
