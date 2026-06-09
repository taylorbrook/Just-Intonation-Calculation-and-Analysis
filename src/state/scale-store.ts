/**
 * Additive shared-scale store — the carve-out twin of `src/theme/theme-prefs.ts`.
 *
 * Gives the Generate surface (Plan 02) a one-way live channel to push a scale
 * into the Dashboard (`src/index.md`) and Analysis (`src/pages/analysis.md`)
 * consumers (Plan 03). The transport is a namespaced-localStorage entry plus a
 * window `CustomEvent` broadcast — exactly mirroring the theme-prefs pattern.
 *
 * ONE-WAY DATA FLOW (D-08): only the producer (the Generate page) ever calls
 * `writeSharedScale`. Consumers `readSharedScale` at boot and subscribe to the
 * `SCALE_CHANGED_EVENT` for live updates. No consumer writes back.
 *
 * Three-layer purity (D-08): this module exports ONLY constants + pure
 * functions + the two storage helpers. The read path has NO DOM access and no
 * side effects. The ONLY side effects in the whole module are the `setItem`
 * persist + the `dispatchEvent` broadcast inside `writeSharedScale`.
 *
 * Wire format (D-09): the persisted JSON is `{ text, source? }`. The 8 KB cap
 * reuses `MAX_SCALE_TEXT_BYTES` from `src/lib/url.ts` — single source of truth,
 * no second serialization and no redeclared literal.
 *
 * Threat model (Phase 5 register):
 *   - T-05-01 (Tampering, localStorage JSON): `readSharedScale` validates shape
 *     (object, not array/primitive, `typeof text === "string"`); invalid → null.
 *   - T-05-02 (DoS, oversized text): 8 KB UTF-8 cap enforced on BOTH read and
 *     write; oversized → null read / silent-no-op write.
 *   - T-05-03 (Info disclosure, private-browsing localStorage throws): every
 *     read/write wrapped in try/catch → null / silent no-op; never throws.
 */

import { MAX_SCALE_TEXT_BYTES } from "../lib/url.js";

/** localStorage key. Namespaced — mirrors `tuning-systems:theme-prefs`. */
export const SCALE_STORAGE_KEY = "tuning-systems:scale";

/** Global CustomEvent name dispatched on `window` when the shared scale changes.
 * Consumers `window.addEventListener(SCALE_CHANGED_EVENT, handler)`. */
export const SCALE_CHANGED_EVENT = "tuning-systems:scale-changed";

/**
 * The persisted / broadcast shape. `text` is the scale text (Scala-ish lines).
 * `source` is an optional provenance tag (e.g. "generate") for consumer UX.
 */
export interface SharedScale {
  text: string;
  source?: string;
}

/**
 * Pure boot-precedence helper (D-12 / SYNC-04 anchor).
 *
 * Resolves the initial scale text a consumer page should boot with:
 *   1. the URL-hash-decoded scale (deep-link), else
 *   2. the shared store's text (live hand-off from Generate), else
 *   3. the page's own seed text.
 *
 * THE EMPTY-STORE INVARIANT: when `stored === null` the result is byte-identical
 * to today's `hashDecoded ?? seedText` — i.e. an empty store boots exactly like
 * v1.0. This is the single fast unit assertion (R1) that locks the additive
 * guarantee, and it is the wave-0 gate for the whole phase.
 */
export function resolveInitialScaleText(
  hashDecoded: string | null,
  stored: SharedScale | null,
  seedText: string,
): string {
  return hashDecoded ?? stored?.text ?? seedText;
}
