/**
 * fokker.ts — the comma-mode Fokker periodicity-block cardinality readout
 * (GEN-08 / D-12). Given a set of unison-vector (comma) ratio strings, the number
 * of notes in the periodicity block they define is the absolute value of the
 * determinant of their monzo matrix: |det M|.
 *
 * Reduced-subspace construction (drop-zero-columns / rank gate):
 *   The octave (prime 2) is the implicit EQUAVE of the block, not a unison vector,
 *   so we DROP the prime-2 exponent (monzo index 0) from every comma. We then DROP
 *   every all-zero prime column from the remaining (3,5,7,…) matrix — a prime whose
 *   exponent is zero in every comma is simply unused by the subgroup and contributes
 *   no axis. The block is well-defined iff the comma count equals the number of
 *   SURVIVING (live) prime columns, yielding a square matrix whose |det| is the
 *   cardinality. This replaces the old "need exactly width−1 commas" rule, which
 *   wrongly rejected valid subgroup blocks where a prime is unused.
 *
 *   VERIFIED this phase: toMonzo("81/80")=[-4,4,-1], toMonzo("128/125")=[7,0,-3].
 *   Dropping the prime-2 column leaves [[4,-1],[0,-3]] over (3,5); both columns are
 *   live; |det| = |4·(-3) − (-1)·0| = 12 — the classic 12-note 5-limit block.
 *
 *   2.3.7-SUBGROUP example: toMonzo("64/63")=[6,-2,0,-1], toMonzo("2401/2187")=
 *   [0,-7,0,4]. Dropping prime-2 gives rows over (3,5,7): [[-2,0,-1],[-7,0,4]]. The
 *   prime-5 column is all-zero → dropped, leaving the square {3,7} matrix
 *   [[-2,-1],[-7,4]]; |det| = |(-2)·4 − (-1)·(-7)| = |-8 − 7| = 15. This 2-comma
 *   block over 2 live primes is now correctly ACCEPTED (it was wrongly rejected by
 *   the width−1 gate, which demanded 3 commas for full monzo width 4).
 *
 *   COUNTER-example (the gate does NOT over-reach): 81/80 + 225/224 reduce to
 *   [[4,-1,0],[2,2,-1]] over (3,5,7); primes 5 AND 7 are both live → NO droppable
 *   column → 2 commas span 3 live primes → genuinely under-determined → RangeError.
 *
 * Exactness (project BigInt discipline): the monzos are mapped to `bigint[][]` and
 * the determinant is computed with `xen-dev-utils.integerDet` (exact BigInt), then
 * coerced to a Number only for the final `Math.abs(...)` cardinality readout. No
 * float path can launder the |det|.
 *
 * Defense-in-depth (T-07-05), all checked BEFORE the determinant — mirrors the
 * cps.ts "caps FIRST → RangeError" structure (Phase-6 D-14 precedent):
 *   - `commaStrings.length` must be in [1, MAX_COMMAS] (8).
 *   - the REDUCED (drop-prime-2, drop-zero-columns) matrix must be SQUARE:
 *     `commaStrings.length === reducedWidth` where `reducedWidth` is the number of
 *     surviving (live) prime columns (Pitfall 6 — a non-square matrix makes |det|
 *     meaningless / throws downstream).
 *   - the resulting cardinality must be in [1, MAX_CARDINALITY] (1000) — the
 *     edScale MAX_DIVISIONS precedent — so a pathological comma set can't drive a
 *     gigantic downstream enumeration.
 *
 * Pure integer math — no DOM, no audio. Drives the live D-12 readout in the Fokker
 * widget (Plan 02). R-01: never imports `Fraction` from xen-dev-utils.
 */

import { toMonzo, integerDet } from "xen-dev-utils";
import { PRIMES } from "./monzo.js";

/** Defense-in-depth cap on the number of commas (T-07-05). */
const MAX_COMMAS = 8;

/**
 * Defense-in-depth cap on the resulting block cardinality (T-07-05; mirrors the
 * edScale MAX_DIVISIONS = 1000 precedent). A cardinality above this would drive an
 * unreasonably large downstream periodicity-block enumeration.
 */
const MAX_CARDINALITY = 1000;

/**
 * The reduced (3,5,7,…)-subspace matrix of a comma set, with all-zero prime columns
 * dropped — the shared foundation of the drop-zero-column/rank gate. Used by BOTH
 * `fokkerCardinality` (here) and `commaToParallelotopeSource` (generate-fokker.ts)
 * so the two derive the surviving prime columns IDENTICALLY (no drift).
 *
 * Construction: build full monzos via `toMonzo`, right-pad to a common `width`, drop
 * the prime-2 column (index 0), then drop every prime column that is zero in EVERY
 * comma. The result is a `bigint[][]` matrix with one column per surviving prime.
 *
 * @param commaStrings - unison-vector ratio strings (e.g. "64/63").
 * @returns `reduced` — the bigint matrix over surviving primes (rows = commas,
 *   columns = live primes); and `survivingMonzoIndices` — the ORIGINAL monzo column
 *   positions of those live primes (positions in PRIMES where PRIMES[0]=2,
 *   PRIMES[1]=3, …), NOT the post-drop column positions. The caller recovers the
 *   basis primes via `survivingMonzoIndices.map((idx) => PRIMES[idx])`.
 */
export function reducedSubspaceMatrix(commaStrings: string[]): {
  reduced: bigint[][];
  survivingMonzoIndices: number[];
} {
  const monzos = commaStrings.map((s) => toMonzo(s));
  const width = Math.max(...monzos.map((m) => m.length));

  // Pad every monzo to `width` and coerce to bigint rows over ALL primes.
  const full: bigint[][] = monzos.map((m) => {
    const row = m.slice(0, width);
    while (row.length < width) row.push(0);
    return row.map((x) => BigInt(x));
  });

  // Surviving = every prime column (index ≥ 1, i.e. drop prime-2) that is non-zero
  // in at least one comma. The index is the ORIGINAL monzo position (so PRIMES[idx]
  // recovers the prime directly).
  const survivingMonzoIndices: number[] = [];
  for (let col = 1; col < width; col++) {
    if (full.some((row) => row[col] !== 0n)) survivingMonzoIndices.push(col);
  }

  const reduced: bigint[][] = full.map((row) => survivingMonzoIndices.map((col) => row[col]!));

  return { reduced, survivingMonzoIndices };
}

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

  // Drop-zero-column / rank gate (replaces the old width−1 squareness rule). Build
  // the reduced (3,5,7,…) matrix with all-zero prime columns dropped, then require
  // the comma count to equal the number of surviving (live) prime columns so the
  // reduced matrix is square (Pitfall 6). This ACCEPTS valid subgroup blocks where a
  // prime is unused (e.g. 64/63 + 2401/2187 over {3,7} → 15) while still REJECTING
  // genuinely under-determined sets (e.g. 81/80 + 225/224, rank-2 over 3 live primes).
  const { reduced, survivingMonzoIndices } = reducedSubspaceMatrix(commaStrings);
  const reducedWidth = survivingMonzoIndices.length;
  if (commaStrings.length !== reducedWidth) {
    const livePrimes = survivingMonzoIndices.map((idx) => PRIMES[idx]).join(", ");
    throw new RangeError(
      `fokkerCardinality: need exactly ${String(reducedWidth)} commas for the ${String(reducedWidth)}-dimensional live-prime subspace [${livePrimes}] (got ${String(commaStrings.length)}) — the reduced comma matrix must be square (Pitfall 6).`,
    );
  }

  // |det| over the reduced square matrix — exact BigInt (integerDet), coerced to
  // Number only for the final Math.abs readout (R-01: no float laundering).
  const card = Math.abs(Number(integerDet(reduced)));

  // Defense-in-depth cardinality cap (T-07-05; edScale MAX_DIVISIONS precedent).
  if (card < 1 || card > MAX_CARDINALITY) {
    throw new RangeError(
      `fokkerCardinality: cardinality ${String(card)} out of range [1, ${String(MAX_CARDINALITY)}] — degenerate or pathological comma set.`,
    );
  }

  return card;
}
