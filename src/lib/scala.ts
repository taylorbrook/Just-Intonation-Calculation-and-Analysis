/**
 * Scala .scl parser + serializer + the shared body parser fed by the dashboard
 * text input (D-12). Handles ratios (5/4), cents (408.0 — `.` triggers cents
 * per D-19), and the project-specific monzo bra-ket notation [-2 0 1> (D-15).
 *
 * Parser semantics per Huygens-Fokker spec + project decisions:
 * - `!` lines are comments (anywhere); ignored
 * - First non-comment line is the description (may be empty)
 * - Second non-comment line is the pitch count (excluding the implicit 1/1)
 * - Subsequent non-comment lines are pitches; auto-prepends 1/1 per D-13
 * - Last pitch line IS the period (D-14)
 * - Negative ratios (-5/4) and multi-slash ratios (2/3/4) MUST error (Pitfall #6)
 * - BOM is stripped; CRLF is normalized to LF
 * - Trailing text after a token (e.g. "5/4   E\\") is ignored (F09)
 *
 * R-01: All Interval constructions go through Interval (which uses fraction.js BigInt).
 * Cents-source pitches are LOSSY — the parser converts cents to a ratio via centsToValue,
 * acknowledging that the resulting Fraction is a float-derived approximation
 * (Pitfall #1). The display layer should treat cents-source intervals as
 * cents-of-record; the kernel does not currently track source provenance, so
 * writeScl re-emits every interval as a ratio. Round-trip equivalence holds by
 * Fraction-equality (the cents-derived Fraction round-trips through itself), not
 * by file-byte identity.
 *
 * Trust boundary: parseScl/parseScala are the first line of defense against
 * untrusted .scl input (file uploads in Plan 06; live textarea in Plan 07).
 * Defense-in-depth caps:
 *   - input length ≤ 1 MB (T-02-10)
 *   - monzo length ≤ 32 components, magnitude ≤ ±1024 (T-02-11)
 *
 * NOTE TO DASHBOARD CONSUMERS: the description string is plain text. The
 * display layer MUST set it via `textContent`, NEVER `innerHTML`, to avoid
 * stored-XSS via crafted .scl descriptions (T-02-14).
 */

import { Interval } from "./interval.js";
import { Scale } from "./scale.js";
// R-01 NOTE: only the helper, NEVER xen-dev-utils' Fraction.
import { centsToValue } from "xen-dev-utils";

const MAX_INPUT_BYTES = 1_000_000;
const MAX_MONZO_LENGTH = 32;
const MAX_MONZO_MAGNITUDE = 1024;

/**
 * Parse the body (pitch lines only — no description / count header) of a Scala
 * file or text-input. Auto-prepends 1/1 (D-13). Comment lines (`!`-prefixed)
 * and empty lines are skipped. Used by both parseScl (internal) and the
 * dashboard text-input (Plan 07) per D-12.
 */
export function parseScala(body: string): Interval[] {
  if (body.length > MAX_INPUT_BYTES) {
    throw new Error(`parseScala: input too large (${String(body.length)} bytes; max 1MB)`);
  }
  const intervals: Interval[] = [new Interval("1/1")];
  const lines = normalizeLines(body);
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "" || line.startsWith("!")) continue;
    intervals.push(parsePitchToken(line));
  }
  return intervals;
}

export interface ParsedScl {
  description: string;
  intervals: Interval[];
}

/**
 * Parse a full .scl file. Auto-prepends 1/1 (D-13). Last interval is the
 * period (D-14). Strips UTF-8 BOM; normalizes CRLF to LF; rejects pitch-count
 * mismatch and negative-ratio / multi-slash inputs with clear errors.
 */
export function parseScl(file: string): ParsedScl {
  if (file.length > MAX_INPUT_BYTES) {
    throw new Error(`parseScl: input too large (${String(file.length)} bytes; max 1MB)`);
  }
  const lines = normalizeLines(file);
  const nonComment: string[] = [];
  for (const raw of lines) {
    if (raw.startsWith("!")) continue;
    nonComment.push(raw);
  }
  if (nonComment.length < 2) {
    throw new Error("parseScl: file is missing the description and/or pitch-count header lines");
  }
  const description = nonComment[0]!.trim();
  const countLine = nonComment[1]!.trim();
  const expectedCount = parseInt(countLine, 10);
  if (!Number.isFinite(expectedCount) || expectedCount < 0 || !/^\d+$/.test(countLine)) {
    throw new Error(`parseScl: invalid pitch count "${countLine}"`);
  }
  // Pitch lines: everything after the count, with empty lines (and any embedded
  // comment lines that happened to slip through above — defensive) filtered.
  const pitchLines = nonComment
    .slice(2)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("!"));
  if (pitchLines.length !== expectedCount) {
    throw new Error(
      `parseScl: pitch count mismatch — header says expected ${String(expectedCount)}, found ${String(pitchLines.length)} pitch lines`,
    );
  }
  const intervals: Interval[] = [new Interval("1/1")];
  for (const line of pitchLines) intervals.push(parsePitchToken(line));
  return { description, intervals };
}

/**
 * Serialize a Scale to .scl format. Does NOT emit the unison line (D-13).
 * Last interval is treated as the period (D-14).
 *
 * Cents-source caveat: the kernel does not track ratio-vs-cents provenance,
 * so this serializer always emits ratios via Fraction.toFraction(). Round-trip
 * equivalence holds by Fraction-equality, not file-byte identity. The cents-
 * derived Fraction (e.g. from F02-cents-only) round-trips through itself
 * because parsePitchToken's cents path stores a deterministic float-derived
 * Fraction.
 */
export function writeScl(scale: Scale, description?: string): string {
  // Strip leading 1/1 if present per D-13 — the parser auto-prepends, the
  // serializer drops to keep the file format invariant.
  const intervals = scale.intervals.slice();
  if (intervals.length > 0 && intervals[0]!.equals(new Interval("1/1"))) {
    intervals.shift();
  }
  const lines: string[] = [];
  lines.push(`! Generated by Tuning Systems`);
  lines.push(`!`);
  lines.push(sanitizeDescription(description));
  lines.push(` ${String(intervals.length)}`);
  lines.push(`!`);
  for (const iv of intervals) {
    lines.push(` ${formatRatio(iv)}`);
  }
  return lines.join("\n") + "\n";
}

/**
 * CR-02: the .scl format gives the description ONE line and treats `!`-prefixed
 * lines as comments. A user-typed description containing a newline shifts every
 * subsequent line by one; a description starting with `!` is silently swallowed
 * by the parser's comment filter. Both break the round-trip invariant
 * `parseScl(writeScl(s, d)) ≡ {intervals, d}`.
 *
 * Collapse newlines to spaces; defang a leading `!` with a leading space (the
 * parser `.trim()`s the description line, so the leading space round-trips away).
 */
function sanitizeDescription(d: string | undefined): string {
  if (!d) return "";
  let out = d.replace(/[\r\n]+/g, " ").trim();
  if (out.startsWith("!")) out = " " + out;
  return out;
}

/**
 * Format an Interval as `n/d` — always with the explicit denominator, even
 * when d=1. fraction.js' `toFraction()` returns `"2"` for 2/1, but the .scl
 * format (and our scaleTable display) expects `"2/1"`. This helper enforces
 * that. R-01: reads `.fraction.n` / `.fraction.d` (BigInt-backed).
 */
function formatRatio(iv: Interval): string {
  return `${String(iv.fraction.n)}/${String(iv.fraction.d)}`;
}

/**
 * IO-04: clipboard payload — the same data the scaleTable widget renders
 * (Plan 06). Tab-separated so pasting into a spreadsheet gives clean columns
 * without locale quoting. Lives here (not in the component) so it's testable
 * in Vitest without a DOM.
 */
export function scalaToCsv(scale: Scale, baseHz: number): string {
  const rows: string[][] = [["Degree", "Ratio", "Cents", "¢ from 12-TET", "Hz"]];
  scale.intervals.forEach((iv, i) => {
    rows.push([
      String(i + 1),
      formatRatio(iv),
      iv.cents.toFixed(2),
      iv.centsFrom12tet.toFixed(2),
      (baseHz * Number(iv.fraction.valueOf())).toFixed(3),
    ]);
  });
  return rows.map((r) => r.join("\t")).join("\n");
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function normalizeLines(text: string): string[] {
  // Strip BOM (effective on first line only); normalize CRLF / CR to LF.
  // The BOM character is U+FEFF (UTF-8 bytes EF BB BF, decoded by readFileSync
  // as the single code point ﻿).
  const noBom = text.replace(/^﻿/, "");
  return noBom.replace(/\r\n?/g, "\n").split("\n");
}

function parsePitchToken(line: string): Interval {
  const trimmed = line.trim();
  if (trimmed === "") {
    throw new Error(`parsePitchToken: empty pitch line`);
  }

  // Monzo bra-ket: [a b c> per D-15. Components inside [...> are space-separated,
  // so the bracket form is NOT whitespace-bounded — extract the full bracket form.
  if (trimmed.startsWith("[")) {
    const close = trimmed.indexOf(">");
    if (close === -1) {
      throw new Error(`parsePitchToken: unterminated monzo bra-ket "${line}"`);
    }
    const inner = trimmed.slice(1, close).trim();
    if (inner === "") return new Interval("1/1"); // empty monzo == 1/1
    const parts = inner.split(/\s+/);
    if (parts.length > MAX_MONZO_LENGTH) {
      throw new Error(
        `parsePitchToken: monzo too long (${String(parts.length)} components; max ${String(MAX_MONZO_LENGTH)})`,
      );
    }
    const exponents = parts.map((s) => {
      if (!/^-?\d+$/.test(s)) {
        throw new Error(`parsePitchToken: monzo component "${s}" is not an integer`);
      }
      const n = Number(s);
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        throw new Error(`parsePitchToken: monzo component "${s}" is not a finite integer`);
      }
      if (Math.abs(n) > MAX_MONZO_MAGNITUDE) {
        throw new Error(
          `parsePitchToken: monzo component ${String(n)} out of range (max magnitude ${String(MAX_MONZO_MAGNITUDE)})`,
        );
      }
      return n;
    });
    return Interval.fromMonzo(exponents);
  }

  // Take the first whitespace-bounded token; ignore everything after (F09).
  const firstWs = trimmed.search(/\s/);
  const tok = firstWs === -1 ? trimmed : trimmed.slice(0, firstWs);

  // Cents detection (D-19): contains `.` → cents.
  if (tok.includes(".")) {
    if (!/^-?\d*\.\d*$/.test(tok) || tok === "." || tok === "-.") {
      throw new Error(`parsePitchToken: invalid cents value "${tok}"`);
    }
    const cents = Number(tok);
    if (!Number.isFinite(cents)) {
      throw new Error(`parsePitchToken: invalid cents value "${tok}"`);
    }
    // R-01 boundary: centsToValue returns Number; the resulting Fraction is
    // a float-derived approximation (LOSSY by definition — see Pitfall #1).
    // Round-trip equivalence holds because the same float→Fraction conversion
    // is deterministic for the same cents input.
    const ratioFloat = centsToValue(cents);
    return new Interval(ratioFloat);
  }

  // Ratio (or bare integer per F06).
  if (tok.startsWith("-")) {
    throw new Error(
      `parsePitchToken: negative ratio "${tok}" rejected (Huygens-Fokker spec; Pitfall #6)`,
    );
  }
  if (!/^\d+(\/\d+)?$/.test(tok)) {
    throw new Error(
      `parsePitchToken: invalid ratio "${tok}" (multi-slash, non-numeric, or unrecognized)`,
    );
  }
  // Bare integer → "N/1" (F06).
  const ratioStr = tok.includes("/") ? tok : `${tok}/1`;
  return new Interval(ratioStr);
}
