/**
 * pitch.ts — twelve-tone-equal-tempered note-name → Hz projection.
 * DISPLAY / AUDIO BOUNDARY ONLY (Pitfall #1).
 *
 * Everything here returns a FLOAT. These helpers exist so a page can say
 * "anchor this scale on Eb3" and get a reference frequency for 1/1 — the
 * anchor the exact rational scale hangs from, NEVER part of the scale itself.
 * A value returned by this module must never be fed back into kernel rational
 * arithmetic (Interval / Fraction): 12-TET is irrational against JI, so a
 * round trip through Hz destroys the prime structure. Ratios stay exact; only
 * the anchor is a float.
 *
 * Pitfall #5 (wrap, don't reimplement): `midiToHz` delegates the exponential to
 * `centOffsetToFrequency` from xen-dev-utils rather than hand-rolling a
 * `Math.pow` expression. That helper is `centsToValue(offset) * baseFrequency`
 * where `centsToValue` is `Math.pow(2, cents / 1200)`, so whole-octave offsets
 * stay bit-exact — A3 reads 220 and A5 reads 880 with no float dust.
 *
 * xen-dev-utils also ships `mtof`, which we do NOT use: it hard-codes the A4
 * anchor at 440 with no calibration parameter, and the whole point of this
 * module is that A4 is a user-facing knob (432, 415, 442, …).
 *
 * Three-layer discipline: pure data — no DOM, no audio, no I/O.
 */

import { centOffsetToFrequency } from "xen-dev-utils";

/**
 * The twelve chromatic note names, sharp-spelled, in C-first order — the
 * conventional order for scientific pitch notation, where the octave number
 * increments at C.
 */
export const NOTE_NAMES = Object.freeze([
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const);

/** One of the twelve sharp-spelled chromatic names. */
export type NoteName = (typeof NOTE_NAMES)[number];

/** MIDI note number of A4 — the anchor `midiToHz` calibrates against. */
export const A4_MIDI = 69;

/** Conventional A4 reference frequency in Hz. */
export const DEFAULT_A4_HZ = 440;

/**
 * Note name + octave → MIDI note number, in scientific pitch notation:
 * C4 is MIDI 60 and A4 is MIDI 69 (so C-1 is 0, the bottom of the MIDI range).
 *
 * Guards mirror the kbm.ts style — an unknown name or a non-integer / non-finite
 * octave throws RangeError naming the offending value rather than silently
 * producing NaN downstream.
 */
export function noteToMidi(note: NoteName, octave: number): number {
  const index = (NOTE_NAMES as readonly string[]).indexOf(note);
  if (index < 0) {
    throw new RangeError(`noteToMidi: unknown note name "${String(note)}"`);
  }
  if (!Number.isFinite(octave) || !Number.isInteger(octave)) {
    throw new RangeError(`noteToMidi: octave must be a finite integer (got ${String(octave)})`);
  }
  return (octave + 1) * 12 + index;
}

/**
 * MIDI note number → frequency in Hz, calibrated so that MIDI 69 (A4) sounds
 * `a4Hz`. LOSSY float — display / audio only (Pitfall #1).
 *
 * Pitfall #5: delegates to xen-dev-utils' `centOffsetToFrequency` instead of
 * reimplementing the exponential.
 */
export function midiToHz(midi: number, a4Hz: number = DEFAULT_A4_HZ): number {
  if (!Number.isFinite(midi)) {
    throw new RangeError(`midiToHz: midi must be finite (got ${String(midi)})`);
  }
  if (!Number.isFinite(a4Hz) || a4Hz <= 0) {
    throw new RangeError(`midiToHz: a4Hz must be finite and > 0 (got ${String(a4Hz)})`);
  }
  return centOffsetToFrequency((midi - A4_MIDI) * 100, a4Hz);
}

/**
 * Note name + octave → frequency in Hz. The composition of `noteToMidi` and
 * `midiToHz`; the projection the Generate page's tonic picker rides on.
 * `noteToHz("A", 4)` is exactly 440 at the default calibration.
 */
export function noteToHz(note: NoteName, octave: number, a4Hz: number = DEFAULT_A4_HZ): number {
  return midiToHz(noteToMidi(note, octave), a4Hz);
}

/** Human-readable scientific pitch name for readouts and tooltips ("A4", "C#-1"). */
export function formatNoteName(note: NoteName, octave: number): string {
  return `${note}${String(octave)}`;
}
