/**
 * Cents conversion — DISPLAY PROJECTION ONLY (Pitfall #1).
 *
 * Cents is a lossy float representation of a ratio. NEVER use it as input to
 * kernel arithmetic — always go through Interval / Fraction. These helpers
 * exist so widgets and the .scl serializer can render cents at user-friendly
 * precision (default 0.1¢ per Pitfall #16).
 */

import { valueToCents, monzoToCents, centsToValue } from "xen-dev-utils";

/** Convert a ratio value or monzo to cents. LOSSY — display projection only. */
export function toCents(value: number | number[]): number {
  return Array.isArray(value) ? monzoToCents(value) : valueToCents(value);
}

/** Signed deviation from nearest 12-TET semitone, in cents. */
export function centsFrom12tet(cents: number): number {
  return cents - Math.round(cents / 100) * 100;
}

/** Convert cents back to a frequency ratio. LOSSY — display/audio projection only. */
export function centsToRatio(cents: number): number {
  return centsToValue(cents);
}
