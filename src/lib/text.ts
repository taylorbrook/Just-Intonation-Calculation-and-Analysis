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
