/**
 * fokker.ts — the comma-mode Fokker periodicity-block cardinality readout
 * (GEN-08 / D-12). Given a set of unison-vector (comma) ratio strings, the number
 * of notes in the periodicity block they define is the absolute value of the
 * determinant of their monzo matrix: |det M|.
 *
 * Square-matrix construction (the (3,5,7,…) subspace):
 *   The octave (prime 2) is the implicit EQUAVE of the block, not a unison vector,
 *   so we DROP the prime-2 exponent (monzo index 0) from every comma and take the
 *   determinant over the remaining (3,5,7,…) exponents. For an n-prime limit this
 *   needs exactly n−1 commas, yielding a square (n−1)×(n−1) matrix.
 *
 *   VERIFIED this phase: toMonzo("81/80")=[-4,4,-1], toMonzo("128/125")=[7,0,-3].
 *   Dropping the prime-2 column leaves [[4,-1],[0,-3]]; |det| = |4·(-3) − (-1)·0|
 *   = 12 — the classic 12-note 5-limit block.
 *
 * Exactness (project BigInt discipline): the monzos are mapped to `bigint[][]` and
 * the determinant is computed with `xen-dev-utils.integerDet` (exact BigInt), then
 * coerced to a Number only for the final `Math.abs(...)` cardinality readout. No
 * float path can launder the |det|.
 *
 * Defense-in-depth (T-07-05), all checked BEFORE the determinant — mirrors the
 * cps.ts "caps FIRST → RangeError" structure (Phase-6 D-14 precedent):
 *   - `commaStrings.length` must be in [1, MAX_COMMAS] (8).
 *   - the (3,5,7,…) matrix must be SQUARE: `commaStrings.length === width − 1`
 *     where `width` is the longest monzo (Pitfall 6 — a non-square matrix makes
 *     |det| meaningless / throws downstream).
 *   - the resulting cardinality must be in [1, MAX_CARDINALITY] (1000) — the
 *     edScale MAX_DIVISIONS precedent — so a pathological comma set can't drive a
 *     gigantic downstream enumeration.
 *
 * Pure integer math — no DOM, no audio. Drives the live D-12 readout in the Fokker
 * widget (Plan 02). R-01: never imports `Fraction` from xen-dev-utils.
 */

import { toMonzo, integerDet } from "xen-dev-utils";

/** Defense-in-depth cap on the number of commas (T-07-05). */
const MAX_COMMAS = 8;

/**
 * Defense-in-depth cap on the resulting block cardinality (T-07-05; mirrors the
 * edScale MAX_DIVISIONS = 1000 precedent). A cardinality above this would drive an
 * unreasonably large downstream periodicity-block enumeration.
 */
const MAX_CARDINALITY = 1000;

/**
 * GEN-08 / D-12: the cardinality |det M| of the periodicity block defined by the
 * given unison-vector (comma) ratio strings.
 *
 * @param commaStrings - the unison vectors as ratio strings (e.g. "81/80"). The
 *   number of commas must equal the (3,5,7,…)-subspace width (one fewer than the
 *   full monzo width, because prime 2 is the implicit equave) so the matrix is
 *   square.
 * @returns the integer |det| of the monzo matrix over the (3,5,7,…) subspace.
 * @throws RangeError if the comma count is outside [1, MAX_COMMAS], if the matrix
 *   is not square in the subspace (Pitfall 6), or if the resulting cardinality is
 *   outside [1, MAX_CARDINALITY] (T-07-05).
 */
export function fokkerCardinality(commaStrings: string[]): number {
  // Defense-in-depth caps FIRST (T-07-05) — before any matrix math.
  if (commaStrings.length < 1 || commaStrings.length > MAX_COMMAS) {
    throw new RangeError(
      `fokkerCardinality: comma count must be in [1, ${String(MAX_COMMAS)}] (got ${String(commaStrings.length)})`,
    );
  }

  // Build the full monzos (Number exponents) and right-pad to a common width.
  const monzos = commaStrings.map((s) => toMonzo(s));
  const width = Math.max(...monzos.map((m) => m.length));

  // Square-matrix requirement: drop the prime-2 exponent (the implicit equave),
  // leaving a (width − 1)-wide subspace. The matrix is square iff the comma count
  // equals (width − 1) (Pitfall 6).
  const subWidth = width - 1;
  if (commaStrings.length !== subWidth) {
    throw new RangeError(
      `fokkerCardinality: need exactly ${String(subWidth)} commas for the ${String(subWidth)}-dimensional (3,5,…) subspace (got ${String(commaStrings.length)}) — the comma matrix must be square (Pitfall 6).`,
    );
  }

  // Drop the prime-2 column (index 0), right-pad to subWidth, map to bigint[][].
  const square: bigint[][] = monzos.map((m) => {
    const row = m.slice(1, width);
    while (row.length < subWidth) row.push(0);
    return row.map((x) => BigInt(x));
  });

  const card = Math.abs(Number(integerDet(square)));

  // Defense-in-depth cardinality cap (T-07-05; edScale MAX_DIVISIONS precedent).
  if (card < 1 || card > MAX_CARDINALITY) {
    throw new RangeError(
      `fokkerCardinality: cardinality ${String(card)} out of range [1, ${String(MAX_CARDINALITY)}] — degenerate or pathological comma set.`,
    );
  }

  return card;
}
