/**
 * kbm.ts — Scala .kbm parser, serializer, frequency mapper, and default-mapping
 * factory. Sibling of scala.ts (D-09); pure data — no DOM, no audio, no I/O.
 *
 * .kbm spec (Huygens-Fokker; verified against Modartt forum example + libscala-file
 * struct order): seven numeric fields followed by `size` mapping entries.
 *
 * 1. size            (int)   — pattern length; the keyMap repeats every `size` keys
 * 2. firstKey        (int)   — first MIDI note to retune
 * 3. lastKey         (int)   — last MIDI note to retune
 * 4. middleNote      (int)   — MIDI note where degree-0 (1/1) sounds (D-10; Pitfall #7)
 * 5. referenceKey    (int)   — MIDI note for which referenceHz is given
 * 6. referenceHz     (float) — Hz of the referenceKey (e.g. 440.0)
 * 7. formalOctave    (int)   — scale degree to consider as the equave (0 = use size)
 *
 * Three-named-fields discipline (Pitfall #7): `middleNote` is "where 1/1 sounds";
 * `referenceKey` is "where referenceHz is given". They are NOT the same field.
 * Conflating them (a common .kbm bug) silently miscalculates every output Hz value.
 *
 * Mapping entries: a non-negative integer (scale degree) OR `'x'`/`'X'`/blank
 * (parsed as `null`, meaning "muted / unmapped").
 *
 * R-01: this module does NOT import `Fraction` from xen-dev-utils — and it does
 * not need fraction.js' Fraction directly either, because referenceHz arrives as
 * a float per .kbm spec line 6. All ratio math goes through Interval (which wraps
 * fraction.js). The audio-tier boundary in `kbmToFrequencies` matches Scale's
 * `degreeToFreq` (per S-3 / Pitfall #1).
 *
 * Three-layer discipline: no DOM API, no audio API, no I/O. Pure data in / pure
 * data out. Consumed by Plan 06's sclIo extension (file upload → parseKbm) and
 * the dashboard frequency-mapping panel.
 *
 * Trust boundary: parseKbm is the first line of defense against untrusted .kbm
 * input (file uploads in Plan 06). Defense-in-depth caps:
 *   - input length ≤ 1 MB (T-3-04)
 *   - size ≤ 1024 entries (T-3-05)
 *   - formalOctave ≤ 1024 (T-3-06)
 */

import { Interval } from "./interval.js";
import type { Scale } from "./scale.js";
import { utf8ByteLength, normalizeLines, MAX_FILE_INPUT_BYTES } from "./text.js";

const MAX_KEYMAP_LENGTH = 1024;
const MAX_FORMAL_OCTAVE = 1024;
const MAX_MIDI = 127;

/**
 * KbmMapping — typed mirror of the .kbm file's seven-field header plus mapping
 * body. Three named fields (`middleNote`, `referenceKey`, `referenceHz`) are
 * enforced separately by the interface to prevent Pitfall #7 reference-frequency
 * confusion (D-10).
 */
export interface KbmMapping {
  /** Pattern length; keyMap repeats every `size` keys. */
  size: number;
  /** First MIDI note to retune (0..127). */
  firstKey: number;
  /** Last MIDI note to retune (firstKey..127). */
  lastKey: number;
  /**
   * MIDI note where degree-0 (1/1, the unison) sounds. Pitfall #7: this is NOT
   * the same as `referenceKey` — `middleNote` anchors the scale, `referenceKey`
   * anchors the absolute frequency.
   */
  middleNote: number;
  /** MIDI note for which `referenceHz` is given. */
  referenceKey: number;
  /** Hz of the referenceKey; > 0. Float per .kbm spec. */
  referenceHz: number;
  /** Scale degree as equave (0 = use `size` as wrap; the Scala "linear" mode). */
  formalOctave: number;
  /** Per-pattern scale-degree mapping; null = muted / unmapped. Length === size. */
  keyMap: ReadonlyArray<number | null>;
}

/** Drop blank lines and `!`-prefixed comment lines (after trim). */
function stripCommentsAndBlanks(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (t === "" || t.startsWith("!")) continue;
    out.push(t);
  }
  return out;
}

function parseIntStrict(token: string, field: string): number {
  if (!/^-?\d+$/.test(token)) {
    throw new Error(`parseKbm: ${field} must be an integer (got "${token}")`);
  }
  return Number(token);
}

function parseFloatStrict(token: string, field: string): number {
  // Accept `-?\d+(\.\d*)?([eE][-+]?\d+)?` OR `-?\.\d+([eE][-+]?\d+)?`.
  if (!/^-?\d+(\.\d*)?([eE][-+]?\d+)?$|^-?\.\d+([eE][-+]?\d+)?$/.test(token)) {
    throw new Error(`parseKbm: ${field} must be a float (got "${token}")`);
  }
  const v = Number(token);
  if (!Number.isFinite(v)) {
    throw new Error(`parseKbm: ${field} must be finite (got "${token}")`);
  }
  return v;
}

/**
 * Parse a .kbm file text into a typed KbmMapping.
 *
 * Permissive about whitespace, BOM, and CRLF; strict about field types and
 * bounds. Fails closed: every malformed input throws a named-field error.
 */
export function parseKbm(text: string): KbmMapping {
  if (utf8ByteLength(text) > MAX_FILE_INPUT_BYTES) {
    throw new Error(`parseKbm: input too large (max 1MB UTF-8)`);
  }

  const tokens = stripCommentsAndBlanks(normalizeLines(text));
  if (tokens.length < 7) {
    throw new Error(`parseKbm: too few fields (expected at least 7, got ${String(tokens.length)})`);
  }

  // noUncheckedIndexedAccess: bind through locals + undefined-guard before use.
  // Never use `!` non-null assertions (D-16).
  const t0 = tokens[0];
  const t1 = tokens[1];
  const t2 = tokens[2];
  const t3 = tokens[3];
  const t4 = tokens[4];
  const t5 = tokens[5];
  const t6 = tokens[6];
  if (
    t0 === undefined ||
    t1 === undefined ||
    t2 === undefined ||
    t3 === undefined ||
    t4 === undefined ||
    t5 === undefined ||
    t6 === undefined
  ) {
    throw new Error(`parseKbm: header field missing (expected 7, got fewer)`);
  }

  const size = parseIntStrict(t0, "size");
  const firstKey = parseIntStrict(t1, "firstKey");
  const lastKey = parseIntStrict(t2, "lastKey");
  const middleNote = parseIntStrict(t3, "middleNote");
  const referenceKey = parseIntStrict(t4, "referenceKey");
  const referenceHz = parseFloatStrict(t5, "referenceHz");
  const formalOctave = parseIntStrict(t6, "formalOctave");

  // Bounds (defense-in-depth — prevent runaway loops in kbmToFrequencies).
  if (size < 0 || size > MAX_KEYMAP_LENGTH) {
    throw new Error(
      `parseKbm: size out of range (got ${String(size)}, expected 0..${String(MAX_KEYMAP_LENGTH)})`,
    );
  }
  if (firstKey < 0 || firstKey > MAX_MIDI) {
    throw new Error(
      `parseKbm: firstKey out of MIDI range (got ${String(firstKey)}, expected 0..${String(MAX_MIDI)})`,
    );
  }
  if (lastKey < firstKey || lastKey > MAX_MIDI) {
    throw new Error(
      `parseKbm: lastKey invalid (got ${String(lastKey)}, expected ${String(firstKey)}..${String(MAX_MIDI)})`,
    );
  }
  if (middleNote < 0 || middleNote > MAX_MIDI) {
    throw new Error(
      `parseKbm: middleNote out of range (got ${String(middleNote)}, expected 0..${String(MAX_MIDI)})`,
    );
  }
  if (referenceKey < 0 || referenceKey > MAX_MIDI) {
    throw new Error(
      `parseKbm: referenceKey out of range (got ${String(referenceKey)}, expected 0..${String(MAX_MIDI)})`,
    );
  }
  if (!Number.isFinite(referenceHz) || referenceHz <= 0) {
    throw new Error(`parseKbm: referenceHz must be > 0 (got ${String(referenceHz)})`);
  }
  if (formalOctave < 0 || formalOctave > MAX_FORMAL_OCTAVE) {
    throw new Error(
      `parseKbm: formalOctave out of range (got ${String(formalOctave)}, expected 0..${String(MAX_FORMAL_OCTAVE)})`,
    );
  }

  // Mapping body: exactly `size` entries.
  const mapTokens = tokens.slice(7, 7 + size);
  if (mapTokens.length !== size) {
    throw new Error(
      `parseKbm: mapping body has ${String(mapTokens.length)} entries, expected ${String(size)}`,
    );
  }
  const keyMap: (number | null)[] = mapTokens.map((tok, i) => {
    const t = tok.trim();
    if (t === "" || t === "x" || t === "X") return null;
    if (!/^\d+$/.test(t)) {
      throw new Error(
        `parseKbm: invalid mapping entry #${String(i)}: "${t}" (expected non-negative integer or 'x')`,
      );
    }
    return Number(t);
  });

  return {
    size,
    firstKey,
    lastKey,
    middleNote,
    referenceKey,
    referenceHz,
    formalOctave,
    keyMap,
  };
}

/**
 * Serialize a KbmMapping to .kbm text. Round-trip-stable: the comment-prefixed
 * layout matches the Tuning Systems canonical fixtures byte-for-byte (modulo
 * trailing-newline normalization). referenceHz is serialized at full JS
 * precision via String() (the shortest round-trippable representation) so it
 * round-trips exactly through parseKbm — parseFloatStrict accepts [eE]
 * exponents, so any String() output is re-parseable.
 */
export function writeKbm(kbm: KbmMapping): string {
  const lines: string[] = [];
  lines.push(`! Generated by Tuning Systems`);
  lines.push(`!`);
  lines.push(`! Size of map:`);
  lines.push(String(kbm.size));
  lines.push(`! First MIDI note number to retune:`);
  lines.push(String(kbm.firstKey));
  lines.push(`! Last MIDI note number to retune:`);
  lines.push(String(kbm.lastKey));
  lines.push(`! Middle note where the first entry of the mapping is mapped to:`);
  lines.push(String(kbm.middleNote));
  lines.push(`! Reference note for which frequency is given:`);
  lines.push(String(kbm.referenceKey));
  lines.push(`! Frequency to tune the above note to:`);
  lines.push(String(kbm.referenceHz));
  lines.push(`! Scale degree to consider as formal octave:`);
  lines.push(String(kbm.formalOctave));
  lines.push(`! Mapping:`);
  for (const entry of kbm.keyMap) {
    lines.push(entry === null ? `x` : String(entry));
  }
  return lines.join("\n") + "\n";
}

/**
 * Map a .kbm + Scale into a per-MIDI-note frequency table.
 *
 * Formula:
 *   refHzAtMiddle = referenceHz × 2^((middleNote - referenceKey) / 12)
 *   For each MIDI note n in [firstKey, lastKey]:
 *     stepFromMiddle = n - middleNote
 *     wrap           = formalOctave > 0 ? formalOctave : size
 *     octaveCount    = floor(stepFromMiddle / wrap)
 *     positionInPattern = ((stepFromMiddle mod wrap) + wrap) mod wrap   // negative-safe
 *     mapEntry       = keyMap[positionInPattern]                        // null = muted
 *     ratio          = scaleDegreeRatio(mapEntry) × periodRatio^octaveCount
 *     freq[n]        = refHzAtMiddle × ratio
 *
 * Why 2^(1/12) for the refKey↔middle alignment? It's fixed by Scala spec —
 * .kbm uses 12-TET semitones for that anchor regardless of the consuming
 * scale's own period (D-24).
 *
 * Why Number coercion (not BigInt)? .kbm stores referenceHz as a float (Scala
 * spec line 6); the source of truth is already lossy. Ratio math up to the
 * multiply uses Interval (BigInt) via `.fraction.valueOf()`; the boundary
 * coercion is per S-3 / Pitfall #1 (audio-tier float boundary, mirrors
 * Scale.degreeToFreq).
 *
 * Scale-degree resolution: by Scala convention, mapEntry 0 references the
 * unison (1/1, implicit) and mapEntry k > 0 references the kth listed pitch.
 * Inside this codebase, parseScala auto-prepends 1/1 (D-13), so a canonical
 * Scale already has 1/1 at intervals[0] and direct indexing works. Scales
 * constructed by hand (without the 1/1 prepend) are normalized internally so
 * mapEntry 0 still yields the unison.
 */
export function kbmToFrequencies(scale: Scale, kbm: KbmMapping): Map<number, number> {
  return kbmToFrequenciesWithDiagnostics(scale, kbm).frequencies;
}

/**
 * Diagnostics returned alongside the frequency table by
 * {@link kbmToFrequenciesWithDiagnostics}: one entry per MIDI note whose
 * mapped scale degree fell outside the scale's degree list and was therefore
 * not emitted into `frequencies`.
 */
export interface KbmFrequencyDiagnostics {
  frequencies: Map<number, number>;
  /** Mapped notes dropped because their degree was out of range (never silent). */
  skipped: Array<{ midiNote: number; mapEntry: number }>;
}

/**
 * Like {@link kbmToFrequencies}, but ALSO surfaces which MIDI notes were
 * dropped because their mapped scale degree was out of range. Callers needing
 * to detect/report silent data loss opt in here; the legacy
 * `kbmToFrequencies(scale, kbm): Map<number, number>` signature is untouched
 * and delegates to this function's `.frequencies`. Nothing is dropped silently:
 * an out-of-range degree lands in `skipped` rather than vanishing.
 */
export function kbmToFrequenciesWithDiagnostics(
  scale: Scale,
  kbm: KbmMapping,
): KbmFrequencyDiagnostics {
  const out = new Map<number, number>();
  const skipped: Array<{ midiNote: number; mapEntry: number }> = [];

  // Anchor: Hz of the middleNote (where degree-0 / 1/1 sounds).
  const refHzAtMiddle = kbm.referenceHz * Math.pow(2, (kbm.middleNote - kbm.referenceKey) / 12);

  const wrap = kbm.formalOctave > 0 ? kbm.formalOctave : kbm.size;
  if (wrap <= 0) return { frequencies: out, skipped };

  const periodRatio = Number(scale.period.fraction.valueOf());

  // Build a degrees view that always starts with 1/1 (Scala convention). If
  // the caller already passed a parseScala-style scale, this is a no-op.
  const unison = new Interval("1/1");
  const firstScaleInterval = scale.intervals[0];
  const degrees: readonly Interval[] =
    firstScaleInterval !== undefined && firstScaleInterval.equals(unison)
      ? scale.intervals
      : [unison, ...scale.intervals];

  for (let n = kbm.firstKey; n <= kbm.lastKey; n++) {
    const stepFromMiddle = n - kbm.middleNote;
    const octaveCount = Math.floor(stepFromMiddle / wrap);
    const positionInPattern = ((stepFromMiddle % wrap) + wrap) % wrap;

    const mapEntry = kbm.keyMap[positionInPattern];
    if (mapEntry === undefined || mapEntry === null) continue;

    const iv = degrees[mapEntry];
    if (iv === undefined) {
      // Out-of-range mapped degree: surface it instead of dropping silently.
      skipped.push({ midiNote: n, mapEntry });
      continue;
    }

    // S-3 boundary coercion: Number() crosses into the audio tier here.
    const ratio = Number(iv.fraction.valueOf()) * Math.pow(periodRatio, octaveCount);
    out.set(n, refHzAtMiddle * ratio);
  }

  return { frequencies: out, skipped };
}

/**
 * Build a default KbmMapping for a Scale + base Hz (D-12). The defaults
 * guarantee that 1/1 sounds at A4 = baseHz: middle == reference == 69 (Pitfall
 * #7-safe — no kbm-aware-vs-baseHz dual source of truth ambiguity).
 *
 * - keyMap: identity over the scale length [0, 1, 2, ..., size-1]
 * - firstKey/lastKey: 0..127 (full MIDI range)
 * - middleNote === referenceKey === 69 (A4)
 * - referenceHz = baseHz
 * - formalOctave = size (one full pattern per equave)
 */
export function defaultKbmFor(scale: Scale, baseHz: number): KbmMapping {
  const size = scale.intervals.length;
  const keyMap: number[] = [];
  for (let i = 0; i < size; i++) keyMap.push(i);
  return {
    size,
    firstKey: 0,
    lastKey: 127,
    middleNote: 69,
    referenceKey: 69,
    referenceHz: baseHz,
    formalOctave: size,
    keyMap,
  };
}
