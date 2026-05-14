/**
 * Site-wide dark-mode toggle head payload (QUICK-9MN-01).
 *
 * Exports `themeHeadPayload()` — a function that returns an inline
 * `<style>…</style><script>…</script>` HTML string for injection into every
 * page's `<head>` via `observablehq.config.ts` (`head:` field).
 *
 * Why head injection and not a per-page component?
 *   The theme must apply BEFORE first paint. Anything mounted by the cell
 *   graph runs after the page is parsed and styled, which would flash the
 *   OS-preferred palette before swapping to the user's persisted choice
 *   (FOUC — flash of unstyled content). A synchronous IIFE in `<head>` runs
 *   during head parse, before the body element exists, so the
 *   `html[data-tuning-systems-theme]` attribute is set before any element
 *   renders.
 *
 * Why a function (not a top-level constant)?
 *   `themeHeadPayload()` is called at config-evaluation time. The function
 *   form inlines theme-prefs constants as compile-time literals via
 *   `${JSON.stringify(CONST)}`, ensuring the runtime IIFE uses the EXACT key /
 *   event-name / mode-allowlist that TypeScript-space consumers use — without
 *   the IIFE ever importing them (the runtime script runs in the browser's
 *   plain <script> context, with no module resolution; the values must be
 *   literal-baked).
 *
 * Three-layer discipline (mirrors audio-toolbar.ts):
 *   This module imports from `src/theme/theme-prefs.js` ONLY — the explicit
 *   shared-constants carve-out. It does NOT depend on `src/audio/` or
 *   `src/lib/`.
 *
 * Security (T-9mn-04 / T-9mn-05):
 *   The runtime IIFE never constructs HTML via the unsafe-assignment property
 *   (the one this codebase deliberately bans — see audio-toolbar.ts header).
 *   It only sets an attribute on document.documentElement and assigns a
 *   function to `window`. The script body interpolates ONLY author-controlled
 *   string literals from theme-prefs.ts (const-defined in source). No untrusted
 *   input
 *   ever reaches the script. The IIFE has no loops; all calls are O(1)
 *   attribute assignments; every storage call is try/catch'd — so it cannot
 *   block head parse via DoS shape (T-9mn-04).
 *
 * CSS-override discipline (locked decision 3 + interfaces block of PLAN.md):
 *   The <style> block only redeclares the FOUR primary CSS variables
 *   (--theme-foreground, --theme-foreground-focus, --theme-background-a,
 *   --theme-background-b) plus color-scheme. Derived vars
 *   (--theme-background, --theme-background-alt, --theme-foreground-alt,
 *   --theme-foreground-muted, --theme-foreground-faint, --theme-foreground-
 *   fainter, --theme-foreground-faintest) cascade automatically via
 *   color-mix() against the primaries, so redeclaring them would be
 *   duplication that drifts from Framework's source-of-truth.
 *
 *   Values are copied verbatim from
 *   node_modules/@observablehq/framework/dist/style/{theme-air,
 *   theme-near-midnight,abstract-light,abstract-dark}.css. DO NOT invent or
 *   approximate.
 */
import {
  THEME_PREFS_STORAGE_KEY,
  THEME_PREFS_EVENT,
  THEME_MODES,
  DEFAULT_THEME_PREFS,
} from "../theme/theme-prefs.js";

/**
 * Returns the `<style>…</style><script>…</script>` string for `head:` injection.
 * Cheap to call (pure string concatenation); intended to be called once at
 * config evaluation.
 */
export function themeHeadPayload(): string {
  // Compile-time inlined constants. JSON.stringify gives valid JS literals.
  const KEY_LIT = JSON.stringify(THEME_PREFS_STORAGE_KEY);
  const EVT_LIT = JSON.stringify(THEME_PREFS_EVENT);
  const MODES_LIT = JSON.stringify(THEME_MODES);
  const DEFAULTS_LIT = JSON.stringify(DEFAULT_THEME_PREFS);

  // ────── Inline <style> ───────────────────────────────────────────────
  // Override rule sets at exactly the specificity
  //   html[data-tuning-systems-theme="light"] { ... }
  //   html[data-tuning-systems-theme="dark"]  { ... }
  // The four primary CSS variables + color-scheme are copied verbatim from
  // Framework's theme files. Derived vars cascade automatically — do NOT
  // redeclare them here.
  //
  // The button block scopes [data-tuning-systems-audio-toolbar] button
  // [data-theme-cycle] so all theme CSS for the dark-mode toggle lives in
  // one file (colocation with the override rule sets).
  const style = `<style>
html[data-tuning-systems-theme="light"] {
  --theme-foreground: #1b1e23;
  --theme-foreground-focus: #3b5fc0;
  --theme-background-a: #ffffff;
  --theme-background-b: color-mix(in srgb, var(--theme-foreground) 4%, var(--theme-background-a));
  color-scheme: light;
}
html[data-tuning-systems-theme="dark"] {
  --theme-foreground: #dfdfd6;
  --theme-foreground-focus: oklch(0.712564 0.257662 265.758);
  --theme-background-b: #161616;
  --theme-background-a: color-mix(in srgb, var(--theme-foreground) 4%, var(--theme-background-b));
  color-scheme: dark;
}
[data-tuning-systems-audio-toolbar] button[data-theme-cycle] {
  font: inherit;
  color: var(--theme-foreground);
  background: var(--theme-background);
  border: 1px solid var(--theme-foreground-faint, var(--theme-foreground-muted));
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  line-height: 1;
}
[data-tuning-systems-audio-toolbar] button[data-theme-cycle]:focus-visible {
  outline: 2px solid var(--theme-foreground-focus);
  outline-offset: 2px;
}
</style>`;

  // ────── Inline <script> IIFE ─────────────────────────────────────────
  // SYNCHRONOUS — NOT wrapped in DOMContentLoaded. The IIFE runs during head
  // parse, before <body> exists. document.documentElement IS available (it is
  // the <html> element being parsed); calling setAttribute on it from head is
  // the exact mechanism Framework + most theme-switcher libraries use to
  // avoid FOUC.
  //
  // Constants are inlined as JS literals (KEY_LIT etc. via JSON.stringify) so
  // the IIFE has no module deps.
  const script = `<script>
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  var KEY = ${KEY_LIT};
  var EVT = ${EVT_LIT};
  var MODES = ${MODES_LIT};
  var DEFAULTS = ${DEFAULTS_LIT};

  function validateMode(x) {
    return MODES.indexOf(x) !== -1 ? x : DEFAULTS.mode;
  }

  function readMode() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(KEY);
      if (raw == null) return DEFAULTS.mode;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return DEFAULTS.mode;
      return validateMode(parsed.mode);
    } catch (e) {
      return DEFAULTS.mode;
    }
  }

  function writeMode(mode) {
    try {
      if (window.localStorage) window.localStorage.setItem(KEY, JSON.stringify({ mode: mode }));
    } catch (e) {
      // private browsing / quota — silent fallback to in-memory only.
    }
  }

  function applyMode(mode) {
    if (mode === "auto") {
      document.documentElement.removeAttribute("data-tuning-systems-theme");
    } else {
      document.documentElement.setAttribute("data-tuning-systems-theme", mode);
    }
  }

  // Synchronous initial apply — this is the FOUC fix.
  applyMode(readMode());

  function cycleMode(current) {
    var idx = MODES.indexOf(current);
    if (idx === -1) idx = 0;
    return MODES[(idx + 1) % MODES.length];
  }

  function get() {
    return readMode();
  }

  function set(mode) {
    var next = validateMode(mode);
    writeMode(next);
    applyMode(next);
    window.dispatchEvent(new CustomEvent(EVT, { detail: { mode: next } }));
    return next;
  }

  function cycle() {
    return set(cycleMode(get()));
  }

  window.__tuningSystemsTheme = { get: get, set: set, cycle: cycle };
})();
</script>`;

  return style + script;
}
