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
 * (Pitfall #1). Provenance IS tracked per-interval (260615-jtm): parsePitchToken
 * tags the dotted-cents path as `source: "cents"` and the ratio/monzo paths as
 * `"ratio"`. writeScl serializes per provenance — cents-of-record (toFixed(6))
 * for cents-source degrees, exact n/d for ratio-source degrees — so a tempered/
 * EDO scale exports as cents instead of being laundered into invented high-limit
 * ratios. A cents-source scale therefore round-trips through the CENTS path on
 * re-parse (close-by-tolerance, not byte-exact); a ratio-source scale round-trips
 * by exact Fraction-equality.
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
// 260615-ipz sanity bound on cents magnitude. A cents value beyond this fails
// fast here with a clear message, instead of being handed to centsToValue where
// an enormous/near-Infinity ratio later blows up deep in the kernel as a
// confusing "Infinity cannot be converted to BigInt" throw. Inclusive cap —
// reject only when ABS is strictly greater (1,000,000 ¢ ≈ 833 octaves is already
// far past any musically meaningful interval).
const MAX_ABS_CENTS = 1_000_000;

/**
 * CR-03: the trust-boundary cap is documented in bytes, but the previous guard
 * compared `string.length` (UTF-16 code units), letting a 3 MB UTF-8 file made
 * of 3-byte CJK chars slip past with `length === 1_000_000`. Measure real
 * UTF-8 bytes here.
 *
 * Cheap upper bound: every UTF-16 code unit costs at most 3 UTF-8 bytes
 * (BMP code points are 1-3 bytes; a surrogate pair = 2 code units = 4 UTF-8
 * bytes = 2 bytes/code-unit). So `s.length * 3` is a safe over-estimate. Fall
 * back to TextEncoder only when the cheap bound clears the cap, keeping the
 * common-case (small scales) allocation-free.
 */
function utf8ByteLength(s: string): number {
  if (s.length * 3 <= MAX_INPUT_BYTES) return s.length * 3;
  return new TextEncoder().encode(s).byteLength;
}

/**
 * Parse the body (pitch lines only — no description / count header) of a Scala
 * file or text-input. Auto-prepends 1/1 (D-13). Comment lines (`!`-prefixed)
 * and empty lines are skipped. Used by both parseScl (internal) and the
 * dashboard text-input (Plan 07) per D-12.
 */
export function parseScala(body: string): Interval[] {
  if (utf8ByteLength(body) > MAX_INPUT_BYTES) {
    throw new Error(`parseScala: input too large (max 1MB UTF-8)`);
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
  if (utf8ByteLength(file) > MAX_INPUT_BYTES) {
    throw new Error(`parseScl: input too large (max 1MB UTF-8)`);
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
 * Provenance-aware (260615-jtm): each degree is serialized by `formatPitch`,
 * which branches on `iv.source` — cents-source degrees emit cents-of-record
 * (toFixed(6), a dotted decimal that re-parses via the cents path), ratio-source
 * degrees emit exact n/d. The leading-1/1 strip (D-13) and the period line
 * (D-14, last interval) each honor THEIR OWN provenance. An all-ratio scale is
 * byte-compatible with the prior unconditional-ratio behavior (golden round-trips
 * unchanged); a cents/EDO scale is no longer laundered into invented ratios.
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
    lines.push(` ${formatPitch(iv)}`);
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
 * Provenance-aware pitch serializer (260615-jtm finding #1). Branches PER-INTERVAL
 * on `iv.source` — mirroring serializeDegrees in scala-archive.ts, but with a
 * per-interval flag instead of a scale-wide `tempered` boolean (strictly better:
 * a mixed scale emits cents for its cents degrees and ratios for its ratio degrees
 * in the same file):
 *   - "cents" → `iv.cents.toFixed(6)` — a dotted decimal, so the receiver's D-19
 *     cents-detection (token contains `.`) fires on re-parse. This is the fix:
 *     a tempered/EDO pitch exports as cents-of-record, NOT as a laundered
 *     high-limit JI ratio invented from a float-derived Fraction.
 *   - "ratio" (default) → `formatRatio(iv)` — exact n/d, byte-compatible with the
 *     prior unconditional behavior (golden round-trips unchanged).
 *
 * Precision caveat: the cents path is float→Fraction→float — parse stores
 * centsToValue(cents); writeScl re-derives iv.cents = 1200*log2(Number(fraction)).
 * This is deterministic for a given input but not bit-exact to the typed string;
 * toFixed(6) of the recomputed cents is well within audible tolerance and the
 * dotted form round-trips back through the cents path. This mirrors scala-
 * archive's cents-of-record discipline (it uses toFixed(4); we use the
 * user-specified toFixed(6)).
 */
function formatPitch(iv: Interval): string {
  return iv.source === "cents" ? iv.cents.toFixed(6) : formatRatio(iv);
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
    // 260615-ipz: reject out-of-range cents BEFORE centsToValue, so a near-Infinity
    // ratio never reaches the kernel (sign-symmetric bound, inclusive at the cap).
    if (Math.abs(cents) > MAX_ABS_CENTS) {
      throw new Error(
        `parsePitchToken: cents out of range "${tok}" (max magnitude ${String(MAX_ABS_CENTS)})`,
      );
    }
    // R-01 boundary: centsToValue returns Number; the resulting Fraction is
    // a float-derived approximation (LOSSY by definition — see Pitfall #1).
    // Round-trip equivalence holds because the same float→Fraction conversion
    // is deterministic for the same cents input.
    //
    // 260615-jtm: tag the interval as cents-source so writeScl re-emits it as
    // cents-of-record (toFixed(6)) instead of laundering it into a fake exact
    // ratio. The interval STILL stores the float-derived Fraction, so `.cents`
    // recomputes correctly and `.equals`/dedupe keep working unchanged — only
    // SERIALIZATION branches on provenance.
    //
    // SCOPE BOUNDARY (260615-jtm): ONLY this parse-time path sets "cents"
    // provenance. Generator paths are intentionally out of scope and stay
    // "ratio": jiSubsetOfEdo (scale.ts) produces approximated EXACT ratios via
    // approximatePrimeLimit, so "ratio" is correct for it. Derived Scale ops
    // (rotate/reduce/dedupe/transpose) lose provenance by design — a transposed
    // cents pitch is no longer the same pitch. Threading provenance through
    // arithmetic or generators is a documented follow-up, NOT this fix.
    const ratioFloat = centsToValue(cents);
    return new Interval(ratioFloat, "cents");
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
  // 260615-ipz: reject non-positive ratios (0, 0/1, 5/0, 0/5) BEFORE constructing
  // the Interval. This stops a 0 Hz note reaching the kernel and prevents N/0 from
  // hitting fraction.js, which would otherwise throw the opaque "Division by Zero".
  // The `^\d+(\/\d+)?$` regex above guarantees numeric parts, so Number() is safe.
  const [numStr, denStr = "1"] = ratioStr.split("/");
  if (Number(numStr) <= 0 || Number(denStr) <= 0) {
    throw new Error(
      `parsePitchToken: ratio "${tok}" must be positive (numerator and denominator > 0)`,
    );
  }
  return new Interval(ratioStr);
}
