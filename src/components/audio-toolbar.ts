/**
 * Site-wide floating audio toolbar (QUICK-TUX-01).
 *
 * Exports `audioToolbarHeadPayload()` — a function that returns an inline
 * `<style>…</style><script>…</script>` HTML string for injection into every
 * page's `<head>` via `observablehq.config.ts` (`head:` field).
 *
 * Why head injection and not a per-page component?
 *   Every page already owns its own `createSynth()` cell. The toolbar needs to
 *   exist OUTSIDE the cell graph so a single floating control survives across
 *   page navigation AND broadcasts to whatever page-level synth currently lives
 *   on the page. Head injection puts the toolbar above Framework's reactive
 *   layer; the synth listens for `AUDIO_PREFS_EVENT` and reacts.
 *
 * Why a function (not a top-level constant)?
 *   `audioToolbarHeadPayload()` is called at config-evaluation time. The function
 *   form inlines the audio-prefs constants as compile-time literals via
 *   `${JSON.stringify(CONST)}`, ensuring the runtime IIFE uses the EXACT key /
 *   event-name / allowlist that synth.ts uses — without the IIFE ever importing
 *   them (the runtime script runs in the browser's plain <script> context, with
 *   no module resolution; the values must be literal-baked).
 *
 * Three-layer discipline (impl-note A option b):
 *   This module imports from `src/audio/audio-prefs.js` ONLY — the explicit
 *   shared-constants carve-out. It does NOT import from `src/audio/synth.js`
 *   (a UI component can't depend on the audio runtime) or `src/lib/`.
 *
 * Security (T-tux-05 / T-02-22 / T-02-23):
 *   The runtime IIFE builds the toolbar with `document.createElement` +
 *   `textContent` ONLY — no `innerHTML`. The script body itself interpolates
 *   ONLY author-controlled string literals from audio-prefs.ts (which are
 *   const-defined in source). No untrusted input ever reaches the script.
 */
import {
  AUDIO_PREFS_STORAGE_KEY,
  AUDIO_PREFS_EVENT,
  ALLOWED_WAVEFORMS,
  DEFAULT_AUDIO_PREFS,
} from "../audio/audio-prefs.js";

/**
 * Returns the `<style>…</style><script>…</script>` string for `head:` injection.
 * Cheap to call (pure string concatenation); intended to be called once at
 * config evaluation.
 */
export function audioToolbarHeadPayload(): string {
  // Compile-time inlined constants. JSON.stringify gives valid JS literals.
  const KEY_LIT = JSON.stringify(AUDIO_PREFS_STORAGE_KEY);
  const EVT_LIT = JSON.stringify(AUDIO_PREFS_EVENT);
  const WAVEFORMS_LIT = JSON.stringify(ALLOWED_WAVEFORMS);
  const DEFAULTS_LIT = JSON.stringify(DEFAULT_AUDIO_PREFS);

  // ────── Inline <style> ───────────────────────────────────────────────
  // Theme tokens only — `var(--theme-background)` etc. — so the toolbar fits
  // both light and dark Framework themes. Container is fixed top-right with a
  // translucent backdrop-blur background so the page content remains legible.
  const style = `<style>
[data-tuning-systems-audio-toolbar] {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  font-family: var(--sans-serif);
  font-size: 13px;
  color: var(--theme-foreground);
  background: color-mix(in oklab, var(--theme-background) 88%, transparent);
  border: 1px solid var(--theme-foreground-faint, var(--theme-foreground-muted));
  border-radius: 6px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
[data-tuning-systems-audio-toolbar] label {
  color: var(--theme-foreground-muted);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
[data-tuning-systems-audio-toolbar] select,
[data-tuning-systems-audio-toolbar] input[type="range"] {
  font: inherit;
  color: var(--theme-foreground);
  background: var(--theme-background);
}
[data-tuning-systems-audio-toolbar] input[type="range"] {
  width: 120px;
}
[data-tuning-systems-audio-toolbar] .ts-vol-readout {
  font-variant-numeric: tabular-nums;
  color: var(--theme-foreground-muted);
  min-width: 4.5em;
}
</style>`;

  // ────── Inline <script> IIFE ─────────────────────────────────────────
  // Constants are inlined as JS literals (KEY_LIT etc. via JSON.stringify). The
  // IIFE then runs in the browser's <script> context — no imports, no Framework
  // runtime. It mounts a sentinel-guarded toolbar to document.body and emits
  // CustomEvents on user input.
  const script = `<script>
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  // Sentinel — prevents duplicate mounts under hot-reload (T-tux-04).
  if (document.querySelector("[data-tuning-systems-audio-toolbar]")) return;

  var KEY = ${KEY_LIT};
  var EVT = ${EVT_LIT};
  var WAVEFORMS = ${WAVEFORMS_LIT};
  var DEFAULTS = ${DEFAULTS_LIT};

  function isFiniteNumber(x) { return typeof x === "number" && isFinite(x); }

  function validateWaveform(x) {
    return WAVEFORMS.indexOf(x) !== -1 ? x : DEFAULTS.waveform;
  }

  function clampVolume(x) {
    if (!isFiniteNumber(x)) return DEFAULTS.volume;
    return Math.min(1, Math.max(0, x));
  }

  function readPrefs() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(KEY);
      if (raw == null) return { waveform: DEFAULTS.waveform, volume: DEFAULTS.volume };
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return { waveform: DEFAULTS.waveform, volume: DEFAULTS.volume };
      return { waveform: validateWaveform(parsed.waveform), volume: clampVolume(parsed.volume) };
    } catch (e) {
      return { waveform: DEFAULTS.waveform, volume: DEFAULTS.volume };
    }
  }

  function writePrefs(p) {
    try {
      if (window.localStorage) window.localStorage.setItem(KEY, JSON.stringify(p));
    } catch (e) {
      // private browsing / quota — silent fallback to in-memory only.
    }
  }

  function broadcast(p) {
    window.dispatchEvent(new CustomEvent(EVT, { detail: p }));
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function fmtVol(v) { return "vol " + v.toFixed(2); }

  function mount() {
    // Sentinel re-check at mount time — another tab race or async retry could
    // have mounted us already.
    if (document.querySelector("[data-tuning-systems-audio-toolbar]")) return;

    var prefs = readPrefs();

    var root = document.createElement("div");
    root.setAttribute("data-tuning-systems-audio-toolbar", "");

    // Waveform label + select
    var wfLabel = document.createElement("label");
    wfLabel.setAttribute("for", "ts-wf");
    wfLabel.textContent = "Waveform";
    var wfSelect = document.createElement("select");
    wfSelect.id = "ts-wf";
    for (var i = 0; i < WAVEFORMS.length; i++) {
      var opt = document.createElement("option");
      opt.value = WAVEFORMS[i];
      opt.textContent = capitalize(WAVEFORMS[i]);
      wfSelect.appendChild(opt);
    }
    wfSelect.value = prefs.waveform;
    wfLabel.appendChild(wfSelect);

    // Volume label + range + readout
    var volLabel = document.createElement("label");
    volLabel.setAttribute("for", "ts-vol");
    volLabel.textContent = "Volume";
    var volRange = document.createElement("input");
    volRange.type = "range";
    volRange.id = "ts-vol";
    volRange.min = "0";
    volRange.max = "1";
    volRange.step = "0.01";
    volRange.value = String(prefs.volume);
    volLabel.appendChild(volRange);

    var volReadout = document.createElement("span");
    volReadout.className = "ts-vol-readout";
    volReadout.textContent = fmtVol(prefs.volume);

    // Wire change/input handlers.
    wfSelect.addEventListener("change", function () {
      var next = { waveform: validateWaveform(wfSelect.value), volume: clampVolume(parseFloat(volRange.value)) };
      writePrefs(next);
      broadcast(next);
    });

    volRange.addEventListener("input", function () {
      var v = clampVolume(parseFloat(volRange.value));
      volReadout.textContent = fmtVol(v);
      var next = { waveform: validateWaveform(wfSelect.value), volume: v };
      writePrefs(next);
      broadcast(next);
    });

    root.appendChild(wfLabel);
    root.appendChild(volLabel);
    root.appendChild(volReadout);

    document.body.appendChild(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
</script>`;

  return style + script;
}
