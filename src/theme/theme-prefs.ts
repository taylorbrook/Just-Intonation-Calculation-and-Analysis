/**
 * Shared constants + pure validation helpers for the site-wide dark-mode toggle.
 *
 * Two modules consume this file:
 *   1. `src/components/theme-head.ts`  — inlines these constants into the head-
 *                                         payload script via JSON.stringify so
 *                                         the synchronous IIFE that runs before
 *                                         first paint uses the EXACT key /
 *                                         event-name / allowlist as TypeScript-
 *                                         space consumers.
 *   2. `src/components/audio-toolbar.ts` — imports THEME_PREFS_EVENT +
 *                                         THEME_MODES + DEFAULT_THEME_PREFS so
 *                                         the theme-cycle button it renders
 *                                         inside the audio toolbar stays in
 *                                         sync with `window.__tuningSystemsTheme`.
 *
 * Three-layer discipline carve-out (mirrors src/audio/audio-prefs.ts): this
 * file is the ONE allowed shared dependency between `src/theme/` and
 * `src/components/`. It exports ONLY constants + pure functions — no runtime
 * side effects, no DOM, no localStorage writes. Persistence WRITES live inside
 * the head-script IIFE (theme-head.ts) so they execute synchronously during
 * head parse; this module is the validation kernel only.
 *
 * Threat model:
 *   - T-9mn-01 (Tampering, localStorage JSON for theme-prefs): `readThemePrefs`
 *     validates via allowlist; invalid → `DEFAULT_THEME_PREFS`.
 *   - T-9mn-03 (Info disclosure, private-browsing localStorage throws):
 *     `readThemePrefs` wraps the lookup in try/catch.
 *   - T-9mn-06 (Spoofing, smuggled "system"/"Auto"): `validateMode` does an
 *     exact (case-sensitive) allowlist check.
 */

/**
 * The three allowed modes. Cycle order is encoded by array index — see
 * `cycleMode` inside theme-head.ts; ordering changes here ripple to the UI.
 */
export const THEME_MODES = ["auto", "light", "dark"] as const;

/** Persisted shape. Only the `mode` field ever round-trips through localStorage. */
export type ThemeMode = (typeof THEME_MODES)[number];
export type ThemePrefs = { mode: ThemeMode };

/** localStorage key. Namespaced — mirrors `tuning-systems:audio-prefs`. */
export const THEME_PREFS_STORAGE_KEY = "tuning-systems:theme-prefs";

/** Global CustomEvent name. window.addEventListener(EVENT, handler) bridges
 * theme-head ↔ audio-toolbar's theme-cycle button (and any future consumers). */
export const THEME_PREFS_EVENT = "tuning-systems:theme-prefs-changed";

/**
 * Default when no localStorage entry exists OR the entry fails validation.
 * "auto" intentionally does NOT set the `data-tuning-systems-theme` attribute,
 * so Framework's media-query @imports (theme-air vs theme-near-midnight)
 * remain active.
 */
export const DEFAULT_THEME_PREFS: ThemePrefs = { mode: "auto" };

/**
 * Return `x` if it is one of the three allowed modes (exact, case-sensitive),
 * else fall back to `"auto"`. Accepts `unknown` so it can be called on
 * freshly-parsed JSON values.
 */
export function validateMode(x: unknown): ThemeMode {
  if (typeof x === "string" && (THEME_MODES as readonly string[]).includes(x)) {
    return x as ThemeMode;
  }
  return DEFAULT_THEME_PREFS.mode;
}

/**
 * Read + validate the persisted prefs. Safe under:
 *   - missing localStorage (Node/SSR contexts where the global is undefined)
 *   - `getItem` throws (private browsing / disabled storage)
 *   - missing key (`null` return)
 *   - malformed JSON
 *   - parsed value being a non-object primitive / array
 *   - `mode` field being missing or having the wrong type
 *
 * Always returns a valid `ThemePrefs` — never throws.
 */
export function readThemePrefs(): ThemePrefs {
  try {
    const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    if (!storage) return DEFAULT_THEME_PREFS;
    const raw = storage.getItem(THEME_PREFS_STORAGE_KEY);
    if (raw == null) return DEFAULT_THEME_PREFS;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return DEFAULT_THEME_PREFS;
    }
    const obj = parsed as Record<string, unknown>;
    return { mode: validateMode(obj.mode) };
  } catch {
    return DEFAULT_THEME_PREFS;
  }
}
