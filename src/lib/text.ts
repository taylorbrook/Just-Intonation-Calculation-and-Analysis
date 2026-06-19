/**
 * text.ts — shared text-normalization helpers for the file-parsing kernel.
 * Pure data in / pure data out (no DOM, no I/O), matching scala.ts / kbm.ts
 * three-layer discipline.
 */

/**
 * Strip a leading byte-order mark from `text`.
 *
 * The BOM is U+FEFF (UTF-8 bytes EF BB BF, decoded as a single code point).
 * It is only meaningful at the very first position of a file, so stripping is
 * anchored to the start — an internal U+FEFF is preserved. The BOM is always
 * referenced via the `\uFEFF` escape, never as a literal non-printing
 * character in source (project hygiene rule).
 */
export function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

/**
 * Defense-in-depth cap for untrusted file/text-input parsing (1 MB UTF-8).
 * Shared by the Scala `.scl` (T-02-10) and `.kbm` (T-3-04) parsers.
 */
export const MAX_FILE_INPUT_BYTES = 1_000_000;

/**
 * Cheap upper bound for UTF-8 byte length, used ONLY for the
 * `MAX_FILE_INPUT_BYTES` cap check -- NOT a precise byte count.
 *
 * CR-03: the trust-boundary cap is documented in bytes, but comparing
 * `string.length` (UTF-16 code units) lets a 3 MB UTF-8 file of 3-byte CJK
 * chars slip past with `length === 1_000_000`. Every UTF-16 code unit costs at
 * most 3 UTF-8 bytes (a surrogate pair = 2 code units = 4 bytes = 2 bytes/unit),
 * so `s.length * 3` is a safe over-estimate. Fall back to `TextEncoder` only when
 * the cheap bound clears the cap, keeping the common case (small scales)
 * allocation-free.
 */
export function utf8ByteLength(s: string): number {
  if (s.length * 3 <= MAX_FILE_INPUT_BYTES) return s.length * 3;
  return new TextEncoder().encode(s).byteLength;
}

/**
 * Strip a leading BOM (U+FEFF), normalize CRLF / CR to LF, and split into lines.
 * The single line-normalization entry point for the file parsers (`.scl`, `.kbm`,
 * the archive index). The BOM is referenced via the `\uFEFF` escape only -- never
 * a literal non-printing character in source (project hygiene rule).
 */
export function normalizeLines(text: string): string[] {
  return stripBom(text).replace(/\r\n?/g, "\n").split("\n");
}
