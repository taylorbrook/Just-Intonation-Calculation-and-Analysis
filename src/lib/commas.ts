/**
 * Named commas — canonical monzo lookup (MATH-06).
 *
 * Hand-curated table of well-known commas, keyed by canonical monzo (NEVER by
 * cents-within-epsilon — Pitfall #1, #6: distinct commas like the syntonic comma
 * (~21.51¢) and the schisma (~1.95¢) must not be conflated by float tolerance).
 *
 * Per D-21: 15+ entries; promote to a build-time data loader (src/data/commas.json.ts)
 * only if the table grows past ~100 entries.
 *
 * Each `monzo` below has been verified by hand-computing
 * `monzoToBigNumeratorDenominator(monzo)` against the published ratio for that comma.
 */

import { Interval } from "./interval.js";
import { monzosEqual, monzoToBigNumeratorDenominator } from "./monzo.js";

export interface CommaEntry {
  readonly name: string;
  readonly monzo: readonly number[];
}

/**
 * 16 well-known commas spanning 5-, 7-, and 11-limit JI plus the classic
 * 53-tone Mercator comma. Each `monzo` is the canonical (non-padded) form —
 * `monzosEqual` from xen-dev-utils handles length-tolerant comparison
 * (Pitfall #14).
 */
export const COMMAS: readonly CommaEntry[] = Object.freeze([
  // 5-limit
  { name: "syntonic comma", monzo: [-4, 4, -1] }, //          81/80
  { name: "Pythagorean comma", monzo: [-19, 12] }, //         531441/524288
  { name: "schisma", monzo: [-15, 8, 1] }, //                 32805/32768
  { name: "diaschisma", monzo: [11, -4, -2] }, //             2048/2025
  { name: "diesis", monzo: [7, 0, -3] }, //                   128/125 (lesser diesis)
  { name: "greater diesis", monzo: [3, 4, -4] }, //           648/625
  { name: "kleisma", monzo: [-6, -5, 6] }, //                 15625/15552
  { name: "Mercator's comma", monzo: [-84, 53] }, //          3^53 / 2^84
  // 7-limit
  { name: "septimal comma", monzo: [6, -2, 0, -1] }, //       64/63 (Archytas' comma)
  { name: "septimal kleisma", monzo: [-5, 2, 2, -1] }, //     225/224 (Marvel comma)
  { name: "harmonic seventh comma", monzo: [-4, -1, 0, 2] }, // 49/48
  { name: "jubilisma", monzo: [1, 0, 2, -2] }, //             50/49 (tritonic diesis)
  { name: "ragisma", monzo: [-1, -7, 4, 1] }, //              4375/4374
  { name: "breedsma", monzo: [-5, -1, -2, 4] }, //            2401/2400
  // 11-limit
  { name: "rastma", monzo: [-1, 5, 0, 0, -2] }, //            243/242
  { name: "undecimal comma", monzo: [-5, 1, 0, 0, 1] }, //    33/32
]);

/**
 * Returns the name of the comma whose canonical monzo matches `m` (length-tolerant
 * via xen-dev-utils' `monzosEqual`), or undefined if not in the table.
 */
export function nameForMonzo(m: readonly number[]): string | undefined {
  const arr = [...m];
  const found = COMMAS.find((c) => monzosEqual([...c.monzo], arr));
  return found?.name;
}

/**
 * Returns the Interval for the named comma, or undefined if the name is not
 * in the table. Comparison is exact-string (case-sensitive) — the table uses
 * lowercase names with spaces (e.g. "syntonic comma").
 */
export function commaByName(name: string): Interval | undefined {
  const entry = COMMAS.find((c) => c.name === name);
  if (!entry) return undefined;
  const { numerator, denominator } = monzoToBigNumeratorDenominator([...entry.monzo]);
  return new Interval(`${numerator}/${denominator}`);
}
