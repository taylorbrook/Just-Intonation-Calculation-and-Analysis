---
phase: quick-260513-tux
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/audio/audio-prefs.ts
  - src/audio/synth.ts
  - src/audio/__tests__/synth.test.ts
  - src/components/audio-toolbar.ts
  - observablehq.config.ts
autonomous: false
requirements:
  - QUICK-TUX-01
must_haves:
  truths:
    - "A floating audio toolbar is visible top-right on every page of the running site."
    - "The toolbar shows a waveform selector with exactly four options: sine, triangle, sawtooth, square."
    - "The toolbar shows a volume slider (0 to 1) with a numeric readout."
    - "Selecting a waveform changes the timbre of subsequently-triggered notes on every page."
    - "Moving the volume slider changes the loudness of subsequently-triggered notes on every page."
    - "Selections persist across page reload (localStorage)."
    - "The page synth's AudioContext is NOT created until the user triggers a Play button (lazy ctx preserved)."
    - "Existing pages default to the current loudness (master gain 0.2) and waveform (sine) on first load."
  artifacts:
    - path: "src/audio/audio-prefs.ts"
      provides: "Shared localStorage key + CustomEvent name constants + validation helpers"
      exports: ["AUDIO_PREFS_STORAGE_KEY", "AUDIO_PREFS_EVENT", "DEFAULT_AUDIO_PREFS", "ALLOWED_WAVEFORMS", "readAudioPrefs", "validateWaveform", "clampVolume", "type AudioPrefs"]
    - path: "src/audio/synth.ts"
      provides: "Extended SynthHandle with setVoiceType + setMaster + audio-prefs subscription"
      contains: "setVoiceType"
    - path: "src/components/audio-toolbar.ts"
      provides: "Helper that returns inline HTML+CSS+JS payload string for head injection"
      exports: ["audioToolbarHeadPayload"]
    - path: "observablehq.config.ts"
      provides: "head field extended with toolbar payload alongside existing KaTeX link"
      contains: "audioToolbarHeadPayload"
    - path: "src/audio/__tests__/synth.test.ts"
      provides: "Test coverage for setVoiceType, setMaster, prefs subscription, dispose unsubscription"
  key_links:
    - from: "src/components/audio-toolbar.ts"
      to: "window event 'tuning-systems:audio-prefs-changed'"
      via: "dispatchEvent on <select> change + <input> input"
      pattern: "dispatchEvent.*CustomEvent"
    - from: "src/audio/synth.ts"
      to: "window event 'tuning-systems:audio-prefs-changed'"
      via: "window.addEventListener in createSynth, removeEventListener in dispose"
      pattern: "addEventListener.*tuning-systems:audio-prefs-changed"
    - from: "observablehq.config.ts"
      to: "src/components/audio-toolbar.ts"
      via: "import { audioToolbarHeadPayload } from './src/components/audio-toolbar.js'"
      pattern: "audioToolbarHeadPayload"
    - from: "src/audio/audio-prefs.ts"
      to: "synth.ts AND audio-toolbar.ts"
      via: "shared module — both import the same constants"
      pattern: "AUDIO_PREFS_STORAGE_KEY|AUDIO_PREFS_EVENT"
---

<objective>
Add a site-wide top-right floating audio toolbar with two controls — a waveform selector (sine / triangle / sawtooth / square) and a master-volume slider — that drives every page's synth via a `CustomEvent` bridge, with selections persisted to `localStorage`.

Purpose: One global place to change timbre + loudness for any audition button on any page. Reduces the friction of switching settings while reading the research notebook.

Output: New shared module `src/audio/audio-prefs.ts`, new component `src/components/audio-toolbar.ts`, two new methods on `SynthHandle`, extended `observablehq.config.ts` head injection, and new test coverage.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/PROJECT.md
@.planning/STATE.md
@src/audio/synth.ts
@src/audio/__tests__/synth.test.ts
@src/components/audio-panel.ts
@observablehq.config.ts
@src/styles.css
@src/index.md

<interfaces>
<!-- Existing SynthHandle surface (src/audio/synth.ts:33-48). New methods get
     appended after `dispose()` per "Public surface" comment. -->

From src/audio/synth.ts:
```typescript
export interface SynthHandle {
  playNote(hz: number, dur?: number): () => void;
  playNotes(freqs: number[], dur?: number): void;
  playArpeggio(freqs: number[], stepSec?: number): void;
  startDrone(hz: number): () => void;
  panic(): void;
  readonly activeVoices: number;
  dispose(): void;
  // ADD:
  setVoiceType(type: OscillatorType): void;
  setMaster(gain: number): void;
}
```

From src/audio/audio-prefs.ts (NEW — to be created):
```typescript
export type AudioPrefs = { waveform: OscillatorType; volume: number };
export const AUDIO_PREFS_STORAGE_KEY = "tuning-systems:audio-prefs";
export const AUDIO_PREFS_EVENT = "tuning-systems:audio-prefs-changed";
export const ALLOWED_WAVEFORMS = ["sine", "triangle", "sawtooth", "square"] as const;
export const DEFAULT_AUDIO_PREFS: AudioPrefs = { waveform: "sine", volume: 0.2 };
export function validateWaveform(x: unknown): OscillatorType;
export function clampVolume(x: unknown): number;
export function readAudioPrefs(): AudioPrefs;
```

From sw-synth (`OscillatorVoiceParams.type`): `OscillatorType` = `"sine" | "triangle" | "sawtooth" | "square" | "custom"`. We restrict to the first four (D-3 locked).

CustomEvent contract:
```typescript
window.dispatchEvent(new CustomEvent("tuning-systems:audio-prefs-changed", {
  detail: { waveform: "sawtooth", volume: 0.35 } satisfies AudioPrefs
}));
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Shared audio-prefs module + extend SynthHandle with setVoiceType / setMaster + live subscription</name>
  <files>src/audio/audio-prefs.ts, src/audio/synth.ts, src/audio/__tests__/synth.test.ts</files>
  <behavior>
    Tests to add to src/audio/__tests__/synth.test.ts (write FIRST, watch them fail, then implement):

    - **setVoiceType — happy path:** after `synth.playNote(440, 0.05)` (forces ensure), calling `synth.setVoiceType("sawtooth")` then another `playNote` results in `mockSynthInstance.voiceParams.type === "sawtooth"`.
    - **setVoiceType — invalid input:** `synth.setVoiceType("custom" as OscillatorType)` is a no-op (no throw, voiceParams.type unchanged), and a `console.warn` is emitted (spy on `console.warn`). Reject anything not in `ALLOWED_WAVEFORMS`.
    - **setVoiceType — pre-ensure call:** calling `setVoiceType("triangle")` BEFORE any playNote is allowed; the chosen type is captured and applied when `ensure()` runs (verify by then calling `playNote` and asserting `mockSynthInstance.voiceParams.type === "triangle"`).
    - **setMaster — happy path:** after first `playNote` (forces ensure), `synth.setMaster(0.5)` calls `mockGainNode.gain.setTargetAtTime` with `(0.5, ctx.currentTime, 0.02)`. Add `setTargetAtTime: vi.fn()` to `mockGainNode.gain` in the test fixture.
    - **setMaster — clamp out-of-range:** `synth.setMaster(2.5)` clamps to 1; `synth.setMaster(-0.3)` clamps to 0; `synth.setMaster(NaN)` is a no-op (no setTargetAtTime call, console.warn emitted).
    - **setMaster — pre-ensure call:** calling `setMaster(0.6)` BEFORE any playNote stores the value and applies it as the initial `master.gain.value` (NOT via ramp) inside `ensure()`. Verify by asserting `mockGainNode.gain.value === 0.6` after the first `playNote`.
    - **localStorage read on construction:** install a `globalThis.localStorage` stub returning `JSON.stringify({waveform: "square", volume: 0.7})` from `getItem`. After `createSynth()` + first `playNote`, expect `mockSynthInstance.voiceParams.type === "square"` and `mockGainNode.gain.value === 0.7`.
    - **localStorage invalid JSON falls back to defaults:** stub `getItem` returning `"{not json"`. Expect type `"sine"` and `gain.value === 0.2`.
    - **localStorage invalid waveform falls back:** stub returning `{"waveform":"<script>","volume":0.4}`. Expect type `"sine"`, gain `0.4`.
    - **window event applies live update:** install a `globalThis.window` with `addEventListener` + `removeEventListener` spies (extend the existing window stub at test line 97). After `createSynth()`, capture the registered handler for `"tuning-systems:audio-prefs-changed"`, call it with `{detail: {waveform: "triangle", volume: 0.35}}` after a `playNote`, then trigger another `playNote` and assert voiceParams.type === "triangle" and gain.setTargetAtTime called with 0.35.
    - **dispose removes the event listener:** after `dispose()`, the window's `removeEventListener` was called for `"tuning-systems:audio-prefs-changed"` with the SAME handler reference passed to `addEventListener`.
    - **dispose is still terminal:** calling `setVoiceType` / `setMaster` AFTER `dispose()` is a no-op (no throw, no setTargetAtTime call).
  </behavior>
  <action>
    Create `src/audio/audio-prefs.ts` exporting: `AudioPrefs` type, `AUDIO_PREFS_STORAGE_KEY` (= `"tuning-systems:audio-prefs"`), `AUDIO_PREFS_EVENT` (= `"tuning-systems:audio-prefs-changed"`), `ALLOWED_WAVEFORMS` (readonly tuple `["sine","triangle","sawtooth","square"]`), `DEFAULT_AUDIO_PREFS` (= `{waveform:"sine", volume:0.2}`), `validateWaveform(x): OscillatorType` (returns x if in allowlist else `"sine"`), `clampVolume(x): number` (returns clamped finite value in [0,1] else 0.2), and `readAudioPrefs(): AudioPrefs` which try/catches `globalThis.localStorage?.getItem(KEY)`, JSON.parses, validates fields, and returns `{...DEFAULT_AUDIO_PREFS, ...sanitized}`. This file is the ONE allowed shared dependency between `src/audio/` and `src/components/` for this feature (per implementation note A — it contains only constants + pure helpers, no runtime deps).

    Extend `src/audio/synth.ts`:
    1. Add `import { AUDIO_PREFS_EVENT, readAudioPrefs, validateWaveform, clampVolume, ALLOWED_WAVEFORMS, type AudioPrefs } from "./audio-prefs.js";` (note `.js` extension per Framework convention).
    2. Extend the `SynthHandle` interface (after `dispose()`) with `setVoiceType(type: OscillatorType): void;` and `setMaster(gain: number): void;`.
    3. At the top of `createSynth()`, read `const initialPrefs = readAudioPrefs();` and use `initialPrefs.volume` as the effective master gain default (replace `opts.master ?? 0.2` with `opts.master ?? initialPrefs.volume`). Use `initialPrefs.waveform` as the effective initial voice type (merge into the `voiceParams` spread as `type: opts.voiceParams?.type ?? initialPrefs.waveform`). Locked decision D-2 fidelity: prefs read happens at construction.
    4. Add closure state `let pendingVoiceType: OscillatorType | null = null;` and `let pendingMaster: number | null = null;`. These hold values set via `setVoiceType`/`setMaster` BEFORE `ensure()` runs, so they can be applied on first ensure.
    5. Inside `ensure()`, AFTER setting `master.gain.value` and `synth.voiceParams`, if `pendingMaster !== null` then assign `master.gain.value = pendingMaster`; if `pendingVoiceType !== null` then assign `synth.voiceParams = {...synth.voiceParams, type: pendingVoiceType}`. Clear both pendings to `null` afterward.
    6. Implement `setVoiceType(type)` on the returned handle: bail if `disposed`. Validate via `ALLOWED_WAVEFORMS.includes(type)` — if invalid, `console.warn("[audio/synth] rejected non-allowlisted waveform:", type)` and return. If `synth` exists, assign `synth.voiceParams = {...synth.voiceParams, type}`. Otherwise set `pendingVoiceType = type`. Existing held voices keep their old timbre (per impl-note E — acceptable; matches drone-retune behavior).
    7. Implement `setMaster(gain)` on the returned handle: bail if `disposed`. Validate `Number.isFinite(gain)` — if not, `console.warn("[audio/synth] rejected non-finite master gain:", gain)` and return. Clamp via `const g = Math.min(1, Math.max(0, gain))`. If `master && ctx` exist, call `master.gain.setTargetAtTime(g, ctx.currentTime, 0.02)` (no clicks per impl-note E). Otherwise set `pendingMaster = g`.
    8. Add a `let onPrefsChange: ((e: Event) => void) | null = null;` closure variable next to `onVisibility`.
    9. In `createSynth` initialisation (AFTER the `return { ... }` handle is built — we need its `setVoiceType`/`setMaster` — actually: declare the handler that closes over the not-yet-constructed handle is awkward. Implementation pattern: build the handle into a `const handle: SynthHandle = { ... };`, then immediately after `bindVisibilityListener()` was called in `ensure()` is too late because hot-swappable prefs should work even before any audio plays. **Resolution:** register the window listener at the very END of `createSynth`, AFTER `const handle = { ... }` is built but BEFORE `return handle`. The handler calls `handle.setVoiceType(detail.waveform)` and `handle.setMaster(detail.volume)`. Use `globalThis.window` defensively (jsdom / node test envs may have `globalThis.window` set; bare `window` would also work in browser but `globalThis` is safer for testability).
    10. Define handler body: cast `e` to `CustomEvent<Partial<AudioPrefs>>`; safely read `e.detail`; if `detail.waveform` is in `ALLOWED_WAVEFORMS` call `handle.setVoiceType(detail.waveform)`; if `Number.isFinite(detail.volume)` call `handle.setMaster(detail.volume)`. (setVoiceType/setMaster do their own validation — defense in depth.)
    11. In `dispose()`, AFTER the `onVisibility` cleanup block and BEFORE the `synth?.allNotesOff()` try-block, add a symmetric cleanup: `if (onPrefsChange) { const win = (globalThis as unknown as { window?: Window }).window; win?.removeEventListener(AUDIO_PREFS_EVENT, onPrefsChange); onPrefsChange = null; }`. Mirrors Pitfall #11 listener-leak guard.
    12. setVoiceType/setMaster must be no-ops after dispose (early `if (disposed) return;` at top of each method, before any side effect).

    Extend `src/audio/__tests__/synth.test.ts`:
    - Add `setTargetAtTime: vi.fn()` to `mockGainNode.gain` (currently `{ value: 0 }`); reset it in `beforeEach`.
    - Extend the existing `globalThis.window` stub at line 97 to include `addEventListener: vi.fn()` and `removeEventListener: vi.fn()` (be careful — the `window` stub is shared and other tests rely on `window.AudioContext`; keep `AudioContext` AND add the listener spies). Reset both in `beforeEach`.
    - Add a `globalThis.localStorage` stub at module top-level: `(globalThis as unknown as { localStorage: Storage }).localStorage = { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), key: vi.fn(), length: 0 };`. Reset `getItem.mockReturnValue(null)` in `beforeEach`.
    - Add a new describe block "createSynth — setVoiceType / setMaster (QUICK-TUX-01)" with the test cases listed in `<behavior>` above.
    - Add a describe block "createSynth — audio-prefs subscription (QUICK-TUX-01)" with the window-event and dispose-unsubscribe tests.

    TDD cycle: write all new tests with `vi.fn()` spies, run `npx vitest run src/audio/__tests__/synth.test.ts` — expect new tests to FAIL while existing pass. Then implement audio-prefs.ts + synth.ts changes. Re-run — ALL tests green. Commit as one unit.
  </action>
  <verify>
    <automated>npx vitest run src/audio/__tests__/synth.test.ts && npx tsc --noEmit</automated>
  </verify>
  <done>
    - `src/audio/audio-prefs.ts` exists with all listed exports
    - `SynthHandle` interface gained `setVoiceType` and `setMaster`
    - `createSynth()` reads localStorage prefs at construction (with defaults)
    - `createSynth()` registers a `tuning-systems:audio-prefs-changed` listener on `window` that calls `setVoiceType`/`setMaster`
    - `dispose()` removes the same listener (reference equality)
    - All existing tests still pass; all new tests pass
    - `tsc --noEmit` clean
  </done>
</task>

<task type="auto">
  <name>Task 2: Audio-toolbar component (head-payload helper) + observablehq.config.ts injection</name>
  <files>src/components/audio-toolbar.ts, observablehq.config.ts</files>
  <action>
    Create `src/components/audio-toolbar.ts`:
    1. Import shared constants: `import { AUDIO_PREFS_STORAGE_KEY, AUDIO_PREFS_EVENT, ALLOWED_WAVEFORMS, DEFAULT_AUDIO_PREFS } from "../audio/audio-prefs.js";`. This module is allowed to import from `src/audio/` per the three-layer carve-out for the shared constants module (impl-note A option b).
    2. Export a single function `audioToolbarHeadPayload(): string` that returns a multi-line string containing `<style>...</style>` + `<script>...</script>` (no outer wrapper). The function-call form ensures the constants are inlined into the script text — the runtime script CANNOT import them at execution time (impl-note B).
    3. The `<style>` block scopes everything under `[data-tuning-systems-audio-toolbar]` and uses Framework theme tokens (`var(--theme-background)`, `var(--theme-foreground)`, `var(--theme-foreground-muted)`, `var(--theme-foreground-faint)`). Container styles: `position: fixed; top: 12px; right: 12px; z-index: 1000; display: flex; gap: 10px; align-items: center; padding: 6px 10px; font-family: var(--sans-serif); font-size: 13px; color: var(--theme-foreground); background: color-mix(in oklab, var(--theme-background) 88%, transparent); border: 1px solid var(--theme-foreground-faint, var(--theme-foreground-muted)); border-radius: 6px; backdrop-filter: blur(4px);`. Label-style `color: var(--theme-foreground-muted);`. The `<select>` and `<input type=range>` inherit Framework's input styling — keep CSS minimal here.
    4. The `<script>` is an IIFE. Inline the literal values of `AUDIO_PREFS_STORAGE_KEY`, `AUDIO_PREFS_EVENT`, `ALLOWED_WAVEFORMS`, and `DEFAULT_AUDIO_PREFS` as JS literals via template substitution — e.g., `const KEY = ${JSON.stringify(AUDIO_PREFS_STORAGE_KEY)};` so a future rename of the constant in audio-prefs.ts triggers a re-build of the head payload and stays in sync.
    5. IIFE body:
       a. Guard against double-mount: `if (document.querySelector("[data-tuning-systems-audio-toolbar]")) return;`.
       b. Define `readPrefs()`: try/catch `JSON.parse(localStorage.getItem(KEY))`; validate `waveform` against allowlist (fallback `"sine"`); clamp `volume` to [0,1] with `Number.isFinite` check (fallback `0.2`); return sanitized object.
       c. Define `writePrefs(p)`: try/catch `localStorage.setItem(KEY, JSON.stringify(p))`. Failure (private browsing / quota) is silent.
       d. Define `broadcast(p)`: `window.dispatchEvent(new CustomEvent(EVT, { detail: p }));`.
       e. Define `mount()`: build the toolbar DOM **only with `createElement` + `textContent`** — NO `innerHTML` (T-02-22 / T-02-23 XSS discipline, impl-note G). Structure: outer `<div data-tuning-systems-audio-toolbar>` → waveform label + `<select id="ts-wf">` with one `<option>` per allowed waveform (textContent = capitalized name, value = lowercase) + volume label + `<input type="range" id="ts-vol" min="0" max="1" step="0.01">` + `<span class="ts-vol-readout">` showing `vol N.NN`. Read prefs, set `select.value` and `range.value` and readout text. Attach `change` listener on `<select>` and `input` listener on `<input type=range>` that compute the new prefs object, call `writePrefs` + `broadcast`, and update the readout span. Append the container to `document.body`.
       f. Mount strategy: if `document.readyState === "loading"`, `document.addEventListener("DOMContentLoaded", mount, { once: true });` else call `mount()` synchronously.
    6. The function returns the assembled string. No exports of the live HTML — every call rebuilds it (cheap; called once at config evaluation).

    Extend `observablehq.config.ts`:
    1. Add at top: `import { audioToolbarHeadPayload } from "./src/components/audio-toolbar.js";` (Framework convention: `.js` extension even though the source is `.ts`). This is the colocated approach (impl-note C option i).
    2. Replace the existing `head` template literal with a concatenation: keep the KaTeX `<link>` first, then append `audioToolbarHeadPayload()`:
       ```
       head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM" crossorigin="anonymous">${audioToolbarHeadPayload()}`,
       ```
    3. **Fallback path (impl-note C):** If `npm run build` or `npm run dev` fails because Framework's config loader cannot resolve `./src/components/audio-toolbar.js`, fall back to inlining the payload directly in `observablehq.config.ts` (copy the function body into the config file as a const). Document the chosen path in the commit message.
    4. Verify TypeScript: `npx tsc --noEmit` must remain clean.
    5. Verify Prettier: `npx prettier --check observablehq.config.ts src/components/audio-toolbar.ts src/audio/audio-prefs.ts src/audio/synth.ts` and `--write` if needed (project uses Prettier per CLAUDE.md tech stack).
  </action>
  <verify>
    <automated>npx tsc --noEmit && npx prettier --check src/components/audio-toolbar.ts src/audio/audio-prefs.ts src/audio/synth.ts observablehq.config.ts && npm run build</automated>
  </verify>
  <done>
    - `src/components/audio-toolbar.ts` exists and exports `audioToolbarHeadPayload`
    - `observablehq.config.ts` head field includes the toolbar payload (or fallback inline equivalent)
    - `npm run build` succeeds (Framework's static build emits all pages with the head injection)
    - Manual smoke (Task 3 checkpoint) confirms toolbar renders and works
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Hand-verify the toolbar end-to-end across pages</name>
  <what-built>
    A floating top-right toolbar with waveform `<select>` (sine / triangle / sawtooth / square) and a volume range input (0–1, default 0.20). Selections persist via `localStorage` under key `tuning-systems:audio-prefs` and broadcast via `CustomEvent("tuning-systems:audio-prefs-changed")` that the page synth listens for. Master-gain changes ramp via `setTargetAtTime` (no clicks); waveform changes affect subsequently-triggered notes only.
  </what-built>
  <how-to-verify>
    1. **Boot:** `npm run dev`, open the served URL (typically http://127.0.0.1:3000). Confirm: floating toolbar visible top-right with "Waveform" + select + "Volume" + slider + "vol 0.20" readout. No console warnings/errors on the dashboard.
    2. **Cross-page persistence:** Navigate to `/pages/syntonic-comma`. Toolbar still visible. Navigate to `/pages/meantone`. Still visible. Navigate to `/pages/edo-approximation`. Still visible.
    3. **Waveform live:** On any page with a Play button (e.g., dashboard's `▶ Play` in the audition panel), click Play — confirm it sounds like a sine. Change toolbar waveform to "Sawtooth". Click Play — confirm timbre is now sawtooth. Switch to "Square", Play — square. "Triangle", Play — triangle.
    4. **Volume live:** Drag slider to 0. Click Play — silence (or near-silent). Drag to 1.0 — click Play — loud (use caution; output level scales linearly to master.gain). Drag to 0.20 (default-ish) — Play — moderate. Readout updates as you drag.
    5. **Persistence across reload:** Set waveform = "Triangle", volume = 0.40. Reload the page. Confirm toolbar shows "Triangle" + 0.40 readout, and clicking Play produces a triangle at the saved level.
    6. **Persistence across pages:** Set waveform = "Sawtooth" on `/`. Navigate to `/pages/meantone`. Confirm toolbar shows "Sawtooth" and a Play button on that page produces a sawtooth.
    7. **Visual fit (both themes):** Inspect toolbar in light mode AND dark mode (use OS appearance toggle or `prefers-color-scheme` devtools override). Background, border, and text should remain legible in both. No collision with the existing destructive `.stop-all-audio` button on the dashboard (it appears top-right too — confirm they don't overlap, OR if they do, document the acceptable layering in SUMMARY).
    8. **Console hygiene:** Open DevTools console on each page visited. No errors. No warnings except expected Framework dev logs.
    9. **No duplicate mounts:** Force a hot-reload (edit a markdown file). Confirm only one toolbar is in `document.body` (`document.querySelectorAll("[data-tuning-systems-audio-toolbar]").length === 1`).
    10. **Lazy AudioContext preserved:** Before clicking any Play button on a fresh page-load, confirm in DevTools → Application → no AudioContext exists yet for the page. After first Play, exactly one AudioContext is created. (Regression check for the synth's lazy-ctx contract.)
  </how-to-verify>
  <resume-signal>Type "approved" once all 10 checks pass, OR describe any failures (which check, what you saw, screenshots if helpful). For the `.stop-all-audio` overlap in check #7, "approved with overlap noted" is acceptable if both elements remain individually usable.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| localStorage → synth | Persisted JSON may be modified by an attacker with same-origin access (e.g., another script, XSS elsewhere) or by the user; synth must validate before applying. |
| toolbar UI → CustomEvent → synth | The event bridge is global on `window`; any same-origin script can dispatch the event. Synth must validate `detail.waveform` and clamp `detail.volume`. |
| config-time string concatenation → every page's `<head>` | Inline JS shipped on every page. Must not interpolate any untrusted input into the script body. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-tux-01 | Tampering | `localStorage` audio-prefs JSON | mitigate | `readAudioPrefs()` validates `waveform` against `ALLOWED_WAVEFORMS` allowlist and clamps `volume` to [0,1] with `Number.isFinite` check; invalid → defaults. Both reader paths (synth.ts construction + toolbar IIFE) apply the same validation. |
| T-tux-02 | Tampering | `CustomEvent("tuning-systems:audio-prefs-changed")` payload | mitigate | The listener in `createSynth` re-runs the same allowlist + clamp validation via `setVoiceType` / `setMaster` (defense in depth — toolbar emits clean values, but a hostile script could dispatch a bad event). |
| T-tux-03 | Information disclosure | `localStorage` key collision | accept | Key namespaced as `tuning-systems:audio-prefs`; no PII stored, only `{waveform, volume}`. |
| T-tux-04 | Denial of service | Toolbar mount under hot-reload (T-3-10 listener leak shape) | mitigate | Sentinel `data-tuning-systems-audio-toolbar` attribute prevents duplicate DOM mounts. Synth's window-event listener is removed in `dispose()` (mirrors Pitfall #11). |
| T-tux-05 | Elevation / XSS | DOM construction in toolbar IIFE | mitigate | All DOM nodes built via `document.createElement` + `textContent` only. No `innerHTML`. No user input is interpolated into the script body — `audioToolbarHeadPayload()` interpolates only compile-time constants from `src/audio/audio-prefs.ts` (which are author-controlled string literals). |
| T-tux-06 | Spoofing | `OscillatorType = "custom"` smuggled past the `<select>` | mitigate | `<select>` only emits the four allowed values; `validateWaveform()` allowlist re-validates on both read and event-handler paths. D-3 locked: no `"custom"` ever. |
| T-tux-07 | Denial of service | `master.gain` set to NaN / Infinity / extreme | mitigate | `setMaster` rejects non-finite via `Number.isFinite`; clamps to [0,1]. Uses `setTargetAtTime` ramp (0.02s) to prevent clicks/pops (impl-note E). |
| T-tux-08 | Information disclosure | `localStorage` access in private-browsing / quota-exceeded | accept | All `localStorage` reads/writes wrapped in try/catch with graceful fallback to in-memory defaults; user sees toolbar render normally, just no persistence. |
</threat_model>

<verification>
- Vitest suite green: `npx vitest run` (full suite, not just the audio test file — must not regress other tests).
- TypeScript clean: `npx tsc --noEmit`.
- Prettier clean: `npx prettier --check src/audio/audio-prefs.ts src/audio/synth.ts src/audio/__tests__/synth.test.ts src/components/audio-toolbar.ts observablehq.config.ts`.
- Static build succeeds: `npm run build`.
- Manual hand-verification (Task 3) passes all 10 checks.
- Lockfile fidelity: no new entries in `package.json` (we did not add a dependency — sw-synth's `OscillatorType` is structural, comes from the DOM lib types).
</verification>

<success_criteria>
- Every locked decision honored: head injection via `observablehq.config.ts`; `SynthHandle.setVoiceType` + `SynthHandle.setMaster` added (no voice-class swap, no Observable-reactive approach); four waveforms only (no `"custom"`).
- All `must_haves.truths` observable by hand-verification.
- All `must_haves.artifacts` exist on disk with the specified exports/contents.
- All `must_haves.key_links` traceable by grep (e.g., `grep -rn "tuning-systems:audio-prefs-changed" src/`).
- No regression: existing dashboard, audition panel, play-interval, play-dyad, drone, arpeggiate, Esc-panic — all still work.
</success_criteria>

<output>
After completion, create `.planning/quick/260513-tux-add-site-wide-top-right-floating-audio-t/SUMMARY.md` documenting:
- Files added / modified with line counts
- The shared-constants approach taken (impl-note A option b)
- Whether the colocated-import or inline-fallback head path was used (impl-note C)
- Any surprises (e.g., `.stop-all-audio` overlap, theme-token resolution in head-injected styles)
- The three suggested commits (or merged variant) with their hashes
- Any deferred follow-ups (none expected; the user explicitly scoped out nice-to-haves)
</output>
