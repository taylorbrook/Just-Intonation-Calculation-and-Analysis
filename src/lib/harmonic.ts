/**
 * harmonic.ts — the harmonic-division family (GEN-02, GEN-03): the composer's
 * everyday overtone scales, all exact integer-derived ratios.
 *
 *   - harmonicSegment(lo, hi)     — the otonal segment h/lo for h in lo..hi
 *   - subharmonicSegment(lo, hi)  — the utonal mirror hi/h for h in hi..lo
 *   - adoScale(divisions, equave) — arithmetic division of the equave (AFDO/ADO)
 *   - isoharmonic(start, diff, count) — integer-frequency arithmetic chord
 *
 * D-04 — LITERAL OVERTONE FORM is the default. harmonicSegment / subharmonicSegment
 * / isoharmonic build the ratios as they literally sound, which may span MORE than
 * an octave (e.g. 4:5:6:7, or harmonics 8..24 spanning ~1.58 octaves). Each exposes
 * a per-method `reduce` flag (default `false`); when `true`, every degree is folded
 * into [1/1, 2/1) via Interval.octaveReduce() and deduped by exact n/d. ADO is
 * intrinsically within one equave by construction, so it has NO reduce flag.
 *
 * Exactness (Pitfall #1 / #6): every ratio is integer-derived and stays BigInt-exact
 * through Interval (fraction.js auto-reduces, e.g. "16/8" → "2/1"). Dedupe is keyed
 * STRICTLY on `iv.fraction.toFraction()` (the canonical reduced n/d) — NEVER
 * cents-within-epsilon. The only float in this module is `iv.cents`, used solely as
 * a SORT KEY (and as the cents-bounds the reduce path naturally produces).
 *
 * Period (D-14): each builder ends with the period as the final interval. For the
 * literal (unreduced) segment the period is the top interval (e.g. 2/1 when hi =
 * 2*lo); an unreduced segment whose top is not the equave still ends with its
 * highest interval as the Scale's period (Scale defaults period to the last
 * interval). ADO's period is the equave; isoharmonic's literal period is the top
 * member-ratio. When `reduce === true`, the period is the equave 2/1.
 *
 * Defense-in-depth (T-06-03): integer-enumeration bounds are enforced via RangeError
 * BEFORE any loop — MAX_HARMONIC (1024), MAX_DIVISIONS (1000), MAX_ISO_COUNT (1024).
 * The widget (Plan 06) passes untrusted integers; this kernel is the last line of
 * defense against a freeze-the-tab denial of service.
 *
 * Pure data — no DOM, no audio. Consumed by src/components/generate-harmonic.ts
 * (Plan 06) which renders the picker widget.
 */

import { Interval, OCTAVE } from "./interval.js";
import { Scale, finalizeScale } from "./scale.js";

/** Defense-in-depth cap on the highest harmonic enumerated (T-06-03). */
const MAX_HARMONIC = 1024;
/** Defense-in-depth cap on ADO arithmetic divisions (T-06-03). */
const MAX_DIVISIONS = 1000;
/** Defense-in-depth cap on the isoharmonic chord length (T-06-03). */
const MAX_ISO_COUNT = 1024;

/**
 * Octave-reduce every interval into [1, 2), dedupe by EXACT n/d (Pitfall #1 / #6),
 * sort by cents, and append the octave 2/1 as the period (D-14). Shared by the
 * `reduce === true` branch of the segment/isoharmonic builders.
 */
function foldToOctave(intervals: Interval[]): Scale {
  // Octave-reduce every interval into [1, 2), then dedupe by exact n/d + sort by
  // cents + append the 2/1 period (D-14) via the shared tail. Pitfall #1 / #6 —
  // the dedupe key is the exact ratio, never cents-within-epsilon.
  const folded = intervals.map((iv) => iv.octaveReduce(OCTAVE));
  return finalizeScale(folded, OCTAVE);
}

/**
 * GEN-02: harmonic (otonal) segment. The literal overtone form `h/lo` for h in
 * lo..hi — e.g. harmonicSegment(8, 16) = {8/8, 9/8, …, 16/8} = {1/1, 9/8, 5/4, …,
 * 2/1}. fraction.js auto-reduces (16/8 → 2/1). Default UNREDUCED (D-04); when
 * `reduce`, fold into [1, 2) + dedupe.
 *
 * @throws RangeError if `lo < 1`, `hi <= lo`, or `hi > MAX_HARMONIC` (T-06-03).
 */
export function harmonicSegment(lo: number, hi: number, reduce = false): Scale {
  if (!Number.isInteger(lo) || lo < 1) {
    throw new RangeError(`harmonicSegment: lo must be an integer >= 1 (got ${String(lo)})`);
  }
  if (!Number.isInteger(hi) || hi <= lo) {
    throw new RangeError(`harmonicSegment: hi must be an integer > lo (got ${String(hi)})`);
  }
  if (hi > MAX_HARMONIC) {
    throw new RangeError(
      `harmonicSegment: hi must be <= ${String(MAX_HARMONIC)} (got ${String(hi)})`,
    );
  }

  const intervals: Interval[] = [];
  for (let h = lo; h <= hi; h++) {
    intervals.push(new Interval(`${String(h)}/${String(lo)}`));
  }
  if (reduce) return foldToOctave(intervals);
  // Literal form: already ascending; the top interval is the period (D-14).
  return new Scale(intervals, intervals[intervals.length - 1]);
}

/**
 * GEN-02: subharmonic (utonal) segment — the reciprocal mirror of the harmonic
 * segment. The ascending undertone set is `hi/h` for h in hi..lo (RESEARCH A-3):
 * subharmonicSegment(8, 16) = {16/16, 16/15, …, 16/8} = {1/1, 16/15, 8/7, …, 2/1}.
 * This is the exact utonal mirror — same octave span [1, 2], inverted interval
 * sequence. Default UNREDUCED (D-04); when `reduce`, fold into [1, 2) + dedupe.
 *
 * @throws RangeError if `lo < 1`, `hi <= lo`, or `hi > MAX_HARMONIC` (T-06-03).
 */
export function subharmonicSegment(lo: number, hi: number, reduce = false): Scale {
  if (!Number.isInteger(lo) || lo < 1) {
    throw new RangeError(`subharmonicSegment: lo must be an integer >= 1 (got ${String(lo)})`);
  }
  if (!Number.isInteger(hi) || hi <= lo) {
    throw new RangeError(`subharmonicSegment: hi must be an integer > lo (got ${String(hi)})`);
  }
  if (hi > MAX_HARMONIC) {
    throw new RangeError(
      `subharmonicSegment: hi must be <= ${String(MAX_HARMONIC)} (got ${String(hi)})`,
    );
  }

  const intervals: Interval[] = [];
  // Ascending utonal segment: hi/h for h descending from hi to lo.
  for (let h = hi; h >= lo; h--) {
    intervals.push(new Interval(`${String(hi)}/${String(h)}`));
  }
  if (reduce) return foldToOctave(intervals);
  return new Scale(intervals, intervals[intervals.length - 1]);
}

/**
 * GEN-03: arithmetic division of the equave (ADO / AFDO). The frequency span from
 * the fundamental (1/1) up to `equave` is split into `divisions` EQUAL ARITHMETIC
 * steps, each expressed as an exact rational. For the octave (equave 2/1) this is
 * the canonical AFDO: degree k = `(divisions + k) / divisions`. In general, for an
 * equave `E = p/q`, the arithmetic step is `(E − 1)/divisions` and
 * degree k = `1 + k·(E − 1)/divisions`, computed as the exact fraction
 * `(divisions·q + k·(p − q)) / (divisions·q)`.
 *
 * adoScale(6, 2/1) = {6/6, 7/6, 8/6, 9/6, 10/6, 11/6, 12/6} = {1/1, 7/6, 4/3, 3/2,
 * 5/3, 11/6, 2/1} — the verified AFDO-6 vector. ADO is intrinsically within one
 * equave by construction — NO reduce flag (D-04). The last degree (k = divisions)
 * lands exactly on `equave`, which is the period (D-14).
 *
 * @param equave - the arithmetic top (e.g. 2/1 octave, 3/1 tritave). Exact:
 *   `p − q` and `divisions·q` stay BigInt through fraction.js, so the top degree is
 *   `(divisions·q + divisions·(p − q))/(divisions·q) = p/q = equave` exactly.
 * @throws RangeError if `divisions` is outside `[1, MAX_DIVISIONS]` (T-06-03).
 */
export function adoScale(divisions: number, equave: Interval): Scale {
  if (!Number.isInteger(divisions) || divisions < 1 || divisions > MAX_DIVISIONS) {
    throw new RangeError(
      `adoScale: divisions must be an integer in [1, ${String(MAX_DIVISIONS)}] (got ${String(divisions)})`,
    );
  }
  if (!equave.isAboveUnison()) {
    throw new RangeError(`adoScale: equave must be > 1/1 (got ${equave.fraction.toFraction()})`);
  }

  // Exact arithmetic division of [1, E]. With E = p/q, degree k =
  //   1 + k·(p/q − 1)/divisions
  // = (divisions·q + k·(p − q)) / (divisions·q).
  // BigInt throughout — p − q and divisions·q never lose precision.
  const p = equave.fraction.n; // bigint numerator (sign-carrying)
  const q = equave.fraction.d; // bigint denominator
  const D = BigInt(divisions);
  const base = D * q; // shared denominator
  const span = p - q; // (p − q): the per-equave frequency rise above 1/1

  const intervals: Interval[] = [];
  for (let k = 0; k <= divisions; k++) {
    const numerator = base + BigInt(k) * span;
    intervals.push(new Interval(`${String(numerator)}/${String(base)}`));
  }
  // The last degree is exactly `equave` (the period, D-14).
  return new Scale(intervals, intervals[intervals.length - 1]);
}

/**
 * GEN-03: isoharmonic chord — an integer-frequency ARITHMETIC chord (equal
 * frequency spacing). Members are `start, start+diff, …, start+(count-1)*diff`;
 * the ratios are each member over the lowest member (`start`). isoharmonic(4, 1, 4)
 * = members {4, 5, 6, 7} → {4/4, 5/4, 6/4, 7/4} = {1/1, 5/4, 3/2, 7/4} (the classic
 * 4:5:6:7). Default UNREDUCED (D-04); when `reduce`, fold into [1, 2) + dedupe.
 *
 * @param start - the lowest member (integer frequency unit). Must be >= 1.
 * @param diff  - the constant arithmetic difference. Must be >= 1.
 * @param count - the number of chord members. Capped at MAX_ISO_COUNT.
 * @throws RangeError if `start < 1`, `diff < 1`, or `count` outside `[1, MAX_ISO_COUNT]`.
 */
export function isoharmonic(start: number, diff: number, count: number, reduce = false): Scale {
  if (!Number.isInteger(start) || start < 1) {
    throw new RangeError(`isoharmonic: start must be an integer >= 1 (got ${String(start)})`);
  }
  if (!Number.isInteger(diff) || diff < 1) {
    throw new RangeError(`isoharmonic: diff must be an integer >= 1 (got ${String(diff)})`);
  }
  if (!Number.isInteger(count) || count < 1 || count > MAX_ISO_COUNT) {
    throw new RangeError(
      `isoharmonic: count must be an integer in [1, ${String(MAX_ISO_COUNT)}] (got ${String(count)})`,
    );
  }

  const intervals: Interval[] = [];
  for (let i = 0; i < count; i++) {
    const member = start + i * diff;
    intervals.push(new Interval(`${String(member)}/${String(start)}`));
  }
  if (reduce) return foldToOctave(intervals);
  return new Scale(intervals, intervals[intervals.length - 1]);
}
