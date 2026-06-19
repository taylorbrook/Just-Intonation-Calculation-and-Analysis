/**
 * generators.ts — the JI-set + first tempered family (GEN-04, GEN-05, SURF-06).
 *
 *   - diamondScale(oddLimit)    — the tonality diamond's unique octave-reduced ratios
 *   - oddLimitSet(limit)        — every reduced i/j in [1, 2) with oddLimit ≤ limit
 *   - primeLimitSet(limit)      — the prime-limit analog over a bounded integer grid
 *   - fareyScale(order)         — the Farey sequence of order N within [1, 2)
 *   - edScale(divisions, equave) — TEMPERED equal division of the equave (EDO / ED-n)
 *
 * EXACTNESS vs. TEMPERED — the load-bearing distinction of this module:
 *
 *   diamondScale / oddLimitSet / primeLimitSet / fareyScale are EXACT JI. Every
 *   ratio is integer-derived and stays BigInt-exact through Interval. Dedupe is
 *   keyed STRICTLY on `iv.fraction.toFraction()` (the canonical reduced n/d) —
 *   NEVER cents-within-epsilon (Pitfall #1/#6, T-06-07). The only float is
 *   `iv.cents`, used solely as a SORT KEY. Each ends with the 2/1 octave as the
 *   period (D-07 — JI families fix the equave at the octave).
 *
 *   edScale is TEMPERED (SURF-06). Its pitches do NOT have an exact ratio of
 *   record: step cents = `(k / divisions) * equave.cents`, and each pitch is
 *   built FROM THAT CENTS VALUE via `centsToRatio` (Pitfall #1 — cents is the
 *   source of truth, the resulting Fraction is a lossy projection). Tests assert
 *   the CENTS, NEVER the ratios — there is no exact rational for a tempered pitch.
 *   The kernel returns the cents-derived Scale; the consuming component (Plan 07)
 *   flags it tempered and renders cents-only. There is NO `tempered` field on
 *   Interval or Scale (D-03) — the tempered semantics live at the component layer.
 *
 * R-01: building an Interval from a float (`new Interval(centsToRatio(...))`)
 * yields a rational APPROXIMATION whose `.cents` round-trips to the target within
 * float epsilon. This is acceptable ONLY for the tempered edScale, where cents is
 * of record; the four JI builders never touch the float path.
 *
 * Defense-in-depth (T-06-05): every builder validates its integer argument and
 * throws RangeError BEFORE any enumeration loop — oddLimit/primeLimit ≤ 31,
 * Farey order ≤ 1000, ED divisions ≤ 1000. The widgets (Plan 07) pass untrusted
 * integers; this kernel is the last line of defense against a freeze-the-tab DoS.
 * (diamondScale delegates its cap to enumerateDiamond, which bounds oddLimit ≤ 1023.)
 *
 * Pure data — no DOM, no audio. Consumed by src/components (Plan 07).
 */

import { Interval, UNISON, OCTAVE } from "./interval.js";
import { Scale, finalizeScale } from "./scale.js";
import { enumerateDiamond } from "./diamond.js";
import { oddLimit, primeLimitOfMonzo } from "./monzo.js";
import { centsToRatio } from "./cents.js";

/** Combinatorial cap shared by oddLimitSet / primeLimitSet (ODD_LIMIT_CAP precedent). */
const LIMIT_CAP = 31;
/** Defense-in-depth cap on the Farey order (T-06-05). */
const MAX_FAREY_ORDER = 1000;
/** Defense-in-depth cap on ED divisions (T-06-05; mirrors edo.ts EDO_RANGE_MAX). */
const MAX_DIVISIONS = 1000;
/**
 * Numerator/denominator bound for primeLimitSet's enumeration. The prime-limit
 * set is INFINITE in principle (e.g. 3-limit Pythagorean chains never terminate);
 * we enumerate a bounded integer grid so the result is finite + deterministic.
 * 81 covers the common 5-limit and Pythagorean staples (81/64, 81/80, 27/16, …).
 */
const PRIME_SET_HEIGHT = 81;

/**
 * Set-dedupe by EXACT n/d (Pitfall #1/#6), sort by cents, and append `period` as
 * the final interval (D-07/D-14). Shared by the three exact-JI set builders that
 * enumerate raw ratios. The unison 1/1 always survives the dedupe (the (1,1) cell
 * / b=1,a=1 pair / etc.), so the result starts at 1/1.
 *
 * Callers reduce their raw ratios into [1, period) BEFORE calling this; `period`
 * here MUST be the same equave used for that reduction so the appended period and
 * the reduction bound stay coherent (the equave sits at the right-open boundary,
 * so it is never in the enumeration and is always appended).
 */
function foldExactSet(intervals: Interval[], period: Interval): Scale {
  // Dedupe by exact n/d (Pitfall #1 / #6 — never cents), sort by cents, append the
  // period (D-07/D-14) via the shared tail. Callers reduce into [1, period) first.
  return finalizeScale(intervals, period);
}

/**
 * GEN-04: the tonality diamond as a Scale. REUSES `enumerateDiamond` (diamond.ts)
 * — does NOT re-derive the diamond. Collects the unique octave-reduced `cell.ratio`
 * values (ignoring the throwaway `inScale` flag), dedupes by exact n/d, sorts by
 * cents, and appends the 2/1 period.
 *
 * diamondScale(7) = {1/1, 8/7, 7/6, 6/5, 5/4, 4/3, 7/5, 10/7, 3/2, 8/5, 5/3,
 * 12/7, 7/4, 2/1} — the unique octave-reduced ratios of the 7-limit diamond.
 *
 * The oddLimit cap is enforced by enumerateDiamond (≤ 1023); this builder
 * propagates that RangeError.
 */
export function diamondScale(oddLimitN: number): Scale {
  // enumerateDiamond needs a Scale only to compute its inScale flag, which we
  // ignore here — pass a minimal throwaway. (It also validates oddLimit ≤ 1023.)
  const throwaway = new Scale([UNISON], OCTAVE);
  const cells = enumerateDiamond(oddLimitN, throwaway);
  // The diamond is octave-bound by definition (enumerateDiamond reduces against
  // a fixed 2/1), so the period here is always the octave.
  return foldExactSet(
    cells.map((c) => c.ratio),
    OCTAVE,
  );
}

/**
 * GEN-04: the odd-limit set — every reduced ratio in [1, 2) whose octave-reduced
 * monzo has `oddLimit ≤ limit`. Enumerates odd × odd numerator/denominator pairs
 * (matching the diamond's domain), octave-reduces, tests the odd-limit ceiling,
 * dedupes by exact n/d, sorts, appends 2/1.
 *
 * oddLimitSet(9) = {1/1, 10/9, 9/8, 8/7, 7/6, 6/5, 5/4, 9/7, 4/3, 7/5, 10/7,
 * 3/2, 14/9, 8/5, 5/3, 12/7, 7/4, 16/9, 9/5, 2/1}.
 *
 * @throws RangeError if `limit` is outside `[1, 31]` (T-06-05).
 */
export function oddLimitSet(limit: number, period = OCTAVE): Scale {
  if (!Number.isInteger(limit) || limit < 1 || limit > LIMIT_CAP) {
    throw new RangeError(
      `oddLimitSet: limit must be an integer in [1, ${String(LIMIT_CAP)}] (got ${String(limit)})`,
    );
  }
  const intervals: Interval[] = [];
  for (let i = 1; i <= limit; i++) {
    for (let j = 1; j <= limit; j++) {
      const iv = new Interval(`${String(i)}/${String(j)}`).octaveReduce(period);
      if (oddLimit(iv.monzo) <= limit) intervals.push(iv);
    }
  }
  return foldExactSet(intervals, period);
}

/**
 * GEN-04: the prime-limit set — every reduced ratio in [1, 2) over a bounded
 * integer grid whose monzo has `primeLimitOfMonzo ≤ limit`. The prime-limit set
 * is infinite in principle, so enumeration is bounded by `PRIME_SET_HEIGHT` (the
 * grid covers the common 5-limit / Pythagorean staples). Octave-reduce, test the
 * prime ceiling, dedupe by exact n/d, sort, append 2/1.
 *
 * primeLimitSet(5) includes {1/1, 9/8, 6/5, 5/4, 4/3, 3/2, 8/5, 5/3, 15/8, …};
 * primeLimitSet(3) is the Pythagorean subset {1/1, 9/8, 4/3, 3/2, 27/16, 16/9, …}.
 *
 * @throws RangeError if `limit` is outside `[1, 31]` (T-06-05). The `limit` is a
 * PRIME ceiling, but the cap mirrors the odd-limit combinatorial cap for symmetry.
 */
export function primeLimitSet(limit: number, period = OCTAVE): Scale {
  if (!Number.isInteger(limit) || limit < 1 || limit > LIMIT_CAP) {
    throw new RangeError(
      `primeLimitSet: limit must be an integer in [1, ${String(LIMIT_CAP)}] (got ${String(limit)})`,
    );
  }
  const intervals: Interval[] = [];
  for (let i = 1; i <= PRIME_SET_HEIGHT; i++) {
    for (let j = 1; j <= PRIME_SET_HEIGHT; j++) {
      const iv = new Interval(`${String(i)}/${String(j)}`).octaveReduce(period);
      if (primeLimitOfMonzo(iv.monzo) <= limit) intervals.push(iv);
    }
  }
  return foldExactSet(intervals, period);
}

/**
 * GEN-04: the Farey sequence of order N within [1, 2). All reduced a/b with
 * `1 ≤ b ≤ order` whose value lies in [1, 2). Pure integer enumeration —
 * fraction.js reduces each a/b, the Set-dedupe drops non-reduced duplicates by
 * exact n/d. Sort, append 2/1.
 *
 * fareyScale(8) = {1/1, 9/8, 8/7, 7/6, 6/5, 5/4, 9/7, 4/3, 11/8, 7/5, 10/7, 3/2,
 * 11/7, 8/5, 13/8, 5/3, 12/7, 7/4, 9/5, 11/6, 13/7, 15/8, 2/1}.
 *
 * Farey is intrinsically octave-bound (a/b ∈ [1, 2) by construction), so unlike
 * the odd/prime-limit sets there is no period parameter — `foldExactSet` pins 2/1.
 *
 * @throws RangeError if `order` is outside `[1, MAX_FAREY_ORDER]` (T-06-05).
 */
export function fareyScale(order: number): Scale {
  if (!Number.isInteger(order) || order < 1 || order > MAX_FAREY_ORDER) {
    throw new RangeError(
      `fareyScale: order must be an integer in [1, ${String(MAX_FAREY_ORDER)}] (got ${String(order)})`,
    );
  }
  const intervals: Interval[] = [];
  for (let b = 1; b <= order; b++) {
    // a/b ∈ [1, 2) ⇒ b ≤ a < 2b. fraction.js auto-reduces; Set-dedupe drops dups.
    for (let a = b; a < 2 * b; a++) {
      intervals.push(new Interval(`${String(a)}/${String(b)}`));
    }
  }
  // Always include 1/1 (the b=1, a=1 pair) so foldExactSet starts at the unison.
  return foldExactSet(intervals, OCTAVE);
}

/**
 * GEN-05 / SURF-06: TEMPERED equal division of the equave (EDO when equave = 2/1,
 * ED-n otherwise — e.g. ED3 = Bohlen-Pierce). This is the FIRST tempered family:
 * cents is the SOURCE OF TRUTH, not a laundered ratio.
 *
 * Step cents = `(k / divisions) * equave.cents` for k in 0..divisions. Each pitch
 * is constructed FROM THAT CENTS VALUE via `centsToRatio` (Pitfall #1) — the
 * resulting Fraction is a LOSSY projection with no exact JI meaning. Consumers
 * MUST treat the pitch as tempered (assert/display cents, never ratios); there is
 * no exact ratio of record. The component (Plan 07) flags it tempered (D-03 — no
 * `tempered` field lives on Interval/Scale).
 *
 * edScale(12, 2/1) → cents [0, 100, 200, …, 1100, 1200] (12-EDO).
 * edScale(13, 3/1) → the Bohlen-Pierce ED3 tritave division (13 equal steps of
 *   the tritave). The last pitch is the equave; it is the Scale period.
 *
 * @param equave - the interval being divided (2/1 octave, 3/1 tritave, …). Its
 *   `.cents` is the only thing read — the division is purely in cents.
 * @throws RangeError if `divisions` is outside `[1, MAX_DIVISIONS]` or the equave
 *   is ≤ 1/1 (T-06-05; Scale's own period > 1/1 guard would also catch the latter,
 *   but we fail fast with a clear message).
 */
export function edScale(divisions: number, equave: Interval): Scale {
  if (!Number.isInteger(divisions) || divisions < 1 || divisions > MAX_DIVISIONS) {
    throw new RangeError(
      `edScale: divisions must be an integer in [1, ${String(MAX_DIVISIONS)}] (got ${String(divisions)})`,
    );
  }
  if (equave.fraction.compare(UNISON.fraction) <= 0) {
    throw new RangeError(`edScale: equave must be > 1/1 (got ${equave.fraction.toFraction()})`);
  }

  const equaveCents = equave.cents;
  const intervals: Interval[] = [];
  for (let k = 0; k <= divisions; k++) {
    // TEMPERED: cents is of record; the ratio is the lossy projection (Pitfall #1).
    const stepCents = (k / divisions) * equaveCents;
    intervals.push(new Interval(centsToRatio(stepCents)));
  }
  // The last pitch IS the equave (k = divisions). Pass the equave as the period so
  // the Scale's exact period stays the true (exact) equave, even though the
  // pitches themselves are tempered approximations. (Scale rejects period ≤ 1/1.)
  return new Scale(intervals, equave);
}
