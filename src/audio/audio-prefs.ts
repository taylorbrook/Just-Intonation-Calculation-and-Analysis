/**
 * Shared constants + pure validation helpers for the site-wide audio toolbar.
 *
 * Three modules consume this file:
 *   1. `src/audio/synth.ts`             — reads prefs at construction; subscribes
 *                                          to the CustomEvent via window.addEventListener.
 *   2. `src/components/audio-toolbar.ts`— inlines these constants into the head-payload
 *                                          script so the runtime toolbar IIFE uses the
 *                                          exact same key / event-name / allowlist.
 *   3. `src/audio/__tests__/synth.test.ts` — asserts against AUDIO_PREFS_EVENT and
 *                                          ALLOWED_WAVEFORMS canonical values.
 *
 * Three-layer discipline carve-out (impl-note A option b): this file is the ONE
 * allowed shared dependency between `src/audio/` and `src/components/`. It exports
 * ONLY constants + pure functions — no runtime side effects, no DOM, no audio API.
 *
 * Threat model:
 *   - T-tux-01 (Tampering, localStorage JSON): `readAudioPrefs` validates via
 *     allowlist + finite-clamp; invalid → defaults.
 *   - T-tux-06 (Spoofing, "custom" OscillatorType): allowlist excludes "custom"
 *     by construction.
 *   - T-tux-08 (Info disclosure, private-browsing localStorage throws):
 *     `readAudioPrefs` wraps the lookup in try/catch.
 */

/** Persisted shape. Only these two fields ever round-trip through localStorage. */
export type AudioPrefs = { waveform: OscillatorType; volume: number };

/** localStorage key. Namespaced to avoid collisions with other site state. */
export const AUDIO_PREFS_STORAGE_KEY = "tuning-systems:audio-prefs";

/** Global CustomEvent name. window.addEventListener(EVENT, handler) bridges UI → synth. */
export const AUDIO_PREFS_EVENT = "tuning-systems:audio-prefs-changed";

/**
 * D-3 locked: exactly four waveforms — sw-synth's `OscillatorType` includes
 * `"custom"` (for PeriodicWave), but the toolbar UI exposes only the four basic
 * shapes. Re-validated on every read + every event to prevent smuggling.
 */
export const ALLOWED_WAVEFORMS = ["sine", "triangle", "sawtooth", "square"] as const;

/** Default when no localStorage entry exists OR the entry fails validation. */
export const DEFAULT_AUDIO_PREFS: AudioPrefs = { waveform: "sine", volume: 0.2 };

/**
 * Return `x` if it is one of the allowed waveforms, else fall back to `"sine"`.
 * Accepts `unknown` so it can be called on freshly-parsed JSON values.
 */
export function validateWaveform(x: unknown): OscillatorType {
  if (typeof x === "string" && (ALLOWED_WAVEFORMS as readonly string[]).includes(x)) {
    return x as OscillatorType;
  }
  return DEFAULT_AUDIO_PREFS.waveform;
}

/**
 * Clamp `x` into [0, 1] when finite, else fall back to `DEFAULT_AUDIO_PREFS.volume`.
 * Rejects NaN, Infinity, -Infinity, and non-numeric values.
 */
export function clampVolume(x: unknown): number {
  if (typeof x !== "number" || !Number.isFinite(x)) {
    return DEFAULT_AUDIO_PREFS.volume;
  }
  return Math.min(1, Math.max(0, x));
}

/**
 * Read + validate the persisted prefs. Safe under:
 *   - missing localStorage (Node/SSR contexts where the global is undefined)
 *   - `getItem` throws (private browsing / disabled storage)
 *   - missing key (`null` return)
 *   - malformed JSON
 *   - any field having the wrong type or out-of-range value
 *
 * Always returns a valid `AudioPrefs` — never throws.
 */
export function readAudioPrefs(): AudioPrefs {
  try {
    const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    if (!storage) return DEFAULT_AUDIO_PREFS;
    const raw = storage.getItem(AUDIO_PREFS_STORAGE_KEY);
    if (raw == null) return DEFAULT_AUDIO_PREFS;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return DEFAULT_AUDIO_PREFS;
    const obj = parsed as Record<string, unknown>;
    return {
      waveform: validateWaveform(obj.waveform),
      volume: clampVolume(obj.volume),
    };
  } catch {
    return DEFAULT_AUDIO_PREFS;
  }
}
