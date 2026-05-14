---
phase: quick-260513-tux
status: complete
date: 2026-05-13
---

# Quick Task 260513-tux — Site-wide audio toolbar

## What shipped

Floating top-right toolbar injected via `observablehq.config.ts` `head` — visible on every page (dashboard + all 16 theory/tool pages). Two controls:

- Waveform `<select>`: sine (default) / triangle / sawtooth / square
- Volume `<input type="range">` 0–1 (default 0.20), with a live numeric readout

Selections persist to `localStorage` under key `tuning-systems:audio-prefs` and broadcast via `CustomEvent("tuning-systems:audio-prefs-changed")`. Every page's synth handle subscribes to the event at construction and applies the change live via new `setVoiceType` / `setMaster` methods on `SynthHandle`. Volume changes ramp via `setTargetAtTime(g, t, 0.02)` to avoid clicks; waveform changes affect subsequently-triggered notes only (existing held voices keep their old timbre — matches the existing drone-retune behavior).

## Files

### Added
- `src/audio/audio-prefs.ts` (93 lines) — shared constants + pure helpers (`AUDIO_PREFS_STORAGE_KEY`, `AUDIO_PREFS_EVENT`, `ALLOWED_WAVEFORMS`, `DEFAULT_AUDIO_PREFS`, `validateWaveform`, `clampVolume`, `readAudioPrefs`, `type AudioPrefs`). Three-layer carve-out: this is the one module both `src/audio/` and `src/components/` import from (constants + pure functions only, no runtime deps).
- `src/components/audio-toolbar.ts` (226 lines) — exports `audioToolbarHeadPayload(): string` returning inline `<style>` + `<script>` for head injection. Compile-time inlines `audio-prefs` constants via `JSON.stringify`; runtime IIFE uses `createElement` + `textContent` only (T-02-22 / T-02-23 XSS discipline).

### Modified
- `src/audio/synth.ts` 341 → 483 (+142) — `SynthHandle` gains `setVoiceType` + `setMaster`; closure state for pre-`ensure` pending values; `ensure()` reads `initialPrefs` + flushes pendings; window listener registered at end of `createSynth`, removed in `dispose()` with reference equality (Pitfall #11 listener-leak symmetry).
- `src/audio/__tests__/synth.test.ts` 540 → 812 (+272) — 16 new tests across 3 new describe blocks. `gain.setTargetAtTime` added to `mockGainNode.gain`. Window event spies and `localStorage` stub added to existing fixtures.
- `src/components/__tests__/test-utils.ts` 39 → 48 (+9) — `StubSynthHandle` extended with `setVoiceType` / `setMaster` (`vi.fn()`) since extending the public interface required updating the test stub.
- `observablehq.config.ts` 43 → 47 (+4) — colocated `import { audioToolbarHeadPayload } from "./src/components/audio-toolbar.js"` + head concatenation.

## Locked decisions honored (all three from gray-area Q&A)

1. **Injection method:** `observablehq.config.ts` head — zero per-page edits.
2. **Synth coupling:** Existing `Synth<OscillatorVoice>` retained; `setVoiceType` + `setMaster` added; localStorage read at construction; `CustomEvent` bridge for live updates. No voice-class swap, no Observable Mutable detour.
3. **Waveform set:** Exactly four basic options (sine / triangle / sawtooth / square). `"custom"` excluded at all three validation layers (`<select>` options, `validateWaveform()`, `setVoiceType` allowlist re-check).

## Head-injection path

**Colocated import (impl-note C option i)** — no fallback needed. `npm run build` succeeded first try with the colocated `import` in `observablehq.config.ts`. Framework's esbuild-backed config loader resolved `.ts → .js` cleanly.

## Validation gates

- `npx vitest run src/audio/__tests__/synth.test.ts` → 46/46 (30 pre-existing + 16 new)
- `npx vitest run` (full suite) → **328/328 across 24 files**
- `npx tsc --noEmit` → clean
- `npx prettier --check` on all touched files → clean
- `npm run build` → clean, **21 pages, 111 links validated**
- Built-HTML grep `grep -c "data-tuning-systems-audio-toolbar" dist/**/*.html` → 9 per page (sentinel string in script body + rendered element)

## Auto-fixed deviations (Rule 3 — blocking issues)

1. `tsc` rejected `synth.voiceParams = { ...synth.voiceParams, type }` because `exactOptionalPropertyTypes: true` infers all fields as optional from the spread, but `OscillatorVoiceParams.audioDelay` is required. **Fix:** explicit `as OscillatorVoiceParams` cast at both sites (`setVoiceType` and `ensure()`'s pendingVoiceType flush). Runtime guarantee: source always carries `audioDelay` via `defaultParams()`.
2. Extending `SynthHandle` broke `test-utils.ts`'s `StubSynthHandle`. **Fix:** added `setVoiceType` + `setMaster` as `vi.fn()` to `makeStubSynth()` + updated the interface.

Both fixes folded into the Task 1 commit.

## Commits

- **7fb26d4** — `feat(audio): site-wide audio-prefs module + SynthHandle setVoiceType/setMaster (QUICK-TUX-01 Task 1)` — 4 files, +522 / -5
- **9b9b344** — `feat(ui): site-wide floating audio toolbar via head injection (QUICK-TUX-01 Task 2)` — 2 files, +231 / -1

## Surprises

None. Clean end-to-end. The colocated import path the plan flagged as a possible fallback trigger did not need the fallback.

## Task 3 status

**Awaiting user hand-verification.** Run `npm run dev` and walk through the 10-step checklist in `PLAN.md` Task 3 `<how-to-verify>` block. Watch-outs:
- Step #7: potential overlap with the dashboard's `.stop-all-audio` button (both want top-right). If they collide, "approved with overlap noted" is acceptable per the plan.
- Step #10: confirm lazy `AudioContext` is preserved — toolbar IIFE itself does NOT create an AudioContext; only `synth.playNote/etc.` does.

After approval, this file's `status:` frontmatter flips to `complete` and a row is appended to `STATE.md`'s `last_activity`.
