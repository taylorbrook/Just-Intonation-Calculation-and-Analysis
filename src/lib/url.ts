/**
 * URL hash encode/decode for scale text (ANAL-04 / Phase 4).
 *
 * Pure data: NO `window.location` access. Per D-18 the consuming page cells
 * (src/index.md and src/pages/analysis.md, Plan 04-07) own the actual hash
 * read/write via `window.location.hash` and `history.replaceState`. This
 * module is text-in / text-out.
 *
 * Encoding (D-16 + RFC 4648 §5):
 *   1. Prepend version byte URL_HASH_VERSION (= 0x01) to the UTF-8 bytes
 *      of the scale text.
 *   2. Base64-encode the resulting Uint8Array.
 *   3. Translate `+` -> `-`, `/` -> `_`, strip `=` padding.
 *
 * Decoding (D-20 — malformed → null, NEVER throw):
 *   1. Reject hash if length > MAX_HASH_BYTES (16 KB; oversized URL = DoS attempt).
 *   2. Translate `-` -> `+`, `_` -> `/`, restore `=` padding to multiple-of-4.
 *   3. Base64-decode.
 *   4. Verify first byte is URL_HASH_VERSION; if not, return null.
 *   5. Decode remaining bytes as UTF-8, return the resulting string.
 *   Any failure at any step → return null. The caller (page cell) surfaces a
 *   status-region message ("Couldn't load shared scale: <reason>") and falls
 *   back to the seed scale.
 *
 * Scope per D-15: scale TEXT only. baseHz, kbm, viz options stay at receiver
 * defaults. Future versions (incrementing URL_HASH_VERSION) may expand scope
 * — the version byte is the forward-compat hook (deferred per CONTEXT).
 *
 * Security:
 *   - This module does NOT eval, Function-construct, or innerHTML the decoded
 *     payload. It returns plain text. XSS mitigation lives downstream at every
 *     DOM render boundary (T-04-11..T-04-13) — `textContent` / `String()` only,
 *     never `innerHTML` of decoded text.
 *   - Caps: MAX_SCALE_TEXT_BYTES = 8192 (encoder); MAX_HASH_BYTES = 16384 (decoder
 *     — base64 bloats by 4/3, so 8 KB plaintext → ~10.7 KB encoded; round up
 *     to 16 KB for headroom).
 *
 * No external deps; uses TextEncoder, TextDecoder, btoa, atob (Node 20 + browser
 * globals).
 */

export const URL_HASH_VERSION = 1 as const;
export const MAX_SCALE_TEXT_BYTES = 8192;
const MAX_HASH_BYTES = 16384;

export function encodeScaleToHash(scaleText: string): string {
  const utf8 = new TextEncoder().encode(scaleText);
  if (utf8.length > MAX_SCALE_TEXT_BYTES) {
    throw new RangeError(
      `encodeScaleToHash: scale text too large (${utf8.length} bytes; max ${MAX_SCALE_TEXT_BYTES})`,
    );
  }
  const buf = new Uint8Array(utf8.length + 1);
  buf[0] = URL_HASH_VERSION;
  buf.set(utf8, 1);
  // btoa needs a Latin-1 string; build one byte-by-byte from the buffer.
  // The non-null assertion on `buf[i]!` is justified because the loop's
  // `i < buf.length` already proves the index is in-bounds — TS-strict
  // `noUncheckedIndexedAccess` (Phase 1 D-16) flags raw `buf[i]` as
  // `number | undefined`, but the bounds check makes it total.
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeHashToScale(hash: string): string | null {
  if (typeof hash !== "string" || hash.length === 0 || hash.length > MAX_HASH_BYTES) {
    return null;
  }
  // Reject anything outside the URL-safe alphabet upfront.
  if (!/^[A-Za-z0-9_-]+$/.test(hash)) return null;
  try {
    // Restore standard base64 alphabet + padding.
    const std = hash.replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (std.length % 4)) % 4;
    const padded = std + "=".repeat(pad);
    const bin = atob(padded);
    const buf = new Uint8Array(bin.length);
    // See note above re: the `!` non-null assertion + noUncheckedIndexedAccess.
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    if (buf.length === 0 || buf[0] !== URL_HASH_VERSION) return null;
    // Defense-in-depth: cap decoded plaintext too. The hash-byte cap above
    // already bounds this, but a malicious caller could still craft a
    // base64 payload that decodes to MAX_HASH_BYTES * 3/4 ≈ 12 KB of
    // plaintext. Keep the plaintext budget aligned with the encoder cap.
    if (buf.length - 1 > MAX_SCALE_TEXT_BYTES) return null;
    return new TextDecoder("utf-8", { fatal: true }).decode(buf.subarray(1));
  } catch {
    return null;
  }
}
