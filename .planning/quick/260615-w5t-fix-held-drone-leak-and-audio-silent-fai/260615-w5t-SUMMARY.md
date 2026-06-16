---
phase: quick-260615-w5t
plan: 01
subsystem: in-browser audio
tags: [audio, drone, voice-leak, error-handling, three-layer]
requires: []
provides:
  - "startDrone null-on-failure contract"
  - "disposeAudioPanel cleanup registry"
  - "once-only resume / no-Web-Audio diagnostics"
affects:
  - src/audio/synth.ts
  - src/components/audio-panel.ts
  - src/index.md
tech-stack:
  added: []
  patterns:
    - "WeakMap per-instance cleanup registry (mirrors disposeScaleCompare)"
    - "closure-scoped once-only warning booleans (mirrors arpeggioTruncationWarned)"
    - "null-on-failure factory return (callable | null)"
key-files:
  created: []
  modified:
    - src/audio/synth.ts
    - src/components/audio-panel.ts
    - src/index.md
    - src/audio/__tests__/synth.test.ts
decisions:
  - "Test-file edits (synth.test.ts) landed in the Task 1 commit because the startDrone nullable contract makes the whole repo's tsc red until the tests are updated; each commit stays independently green."
metrics:
  duration: ~9min
  completed: 2026-06-15
---

# Quick 260615-w5t: Held-drone leak + audio silent-failure fixes Summary

Fixed three in-browser audio-layer defects: held-drone voice leak on baseHz/scale change (#6), silent `ctx.resume()` failures with no retry (#16), and silent no-Web-Audio failure where the drone button lied about playing (#15) — via a `startDrone` null contract, once-only diagnostics with non-running resume retry, and a `disposeAudioPanel` cleanup registry wired into the index.md cell.

## What Was Built

- **Task 1 (`synth.ts`):** `SynthHandle.startDrone` retyped to `(() => void) | null`; all three early-returns (`disposed`, unplayable Hz, `!ensure()`) now return `null`. Added `tryResume()` helper with a once-only `resumeWarned` `.catch`; both resume sites route through it. The already-initialised branch now retries resume whenever `ctx.state !== "running"` (covers iOS "interrupted", not just "suspended"). Added once-only `noWebAudioWarned` warning in the no-`Ctx` branch of `ensure()`.
- **Task 2 (`audio-panel.ts`):** Added module-level `AUDIO_PANEL_CLEANUPS` WeakMap + exported `disposeAudioPanel(el)` mirroring `disposeScaleCompare`. Registered a cleanup on `root` calling `stopDrone?.()`. The drone-on click branch now captures `synth.startDrone(baseHz)` and only flips text/aria-pressed/stores the stop callback when the return is non-null (honest button).
- **Task 3 (`index.md`):** Imported `disposeAudioPanel`; the audioPanel cell now captures the element, displays it, and calls `disposeAudioPanel(el)` in `invalidation.then(...)` so a baseHz/scale change releases the prior panel's held drone.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] startDrone happy-path tests required null-guard to type-check**
- **Found during:** Task 1 verify (`npm run lint:types`)
- **Issue:** Changing `startDrone` to `(() => void) | null` made tsc fail at the two happy-path drone tests (synth.test.ts:367/377/378) which call `stop()` directly — `Cannot invoke an object which is possibly 'null'`. The plan said happy-path tests stay "unchanged," but the contract change forces a type adjustment.
- **Fix:** Added non-null assertions `stop!()` at the happy-path call sites (semantics unchanged — the happy path is documented to return a callable) plus a clarifying comment.
- **Files modified:** src/audio/__tests__/synth.test.ts
- **Commit:** 38f2f25 (Task 1)

**2. [Process] Task 3's test-file fix committed with Task 1**
- The plan groups the bad-Hz `startDrone` test fix under Task 3. Because Task 1's verify (`npm run lint:types`) type-checks the whole repo, the bad-Hz test (`expect(typeof stop).toBe("function"); stop();`) had to be updated to `expect(stop).toBeNull();` for tsc to pass at the Task 1 commit. The single test file therefore moved atomically with the Task 1 contract change. Task 3's commit consequently contains only the `index.md` wiring. No behavior was skipped — the Task 3 test assertion is present and green.

## Verification

- `npm run lint:types` — passes (tsc --noEmit clean) after every task.
- `npm run test` — 709 passed (50 files), including updated bad-Hz null-contract test and unchanged happy-path drone + dispose tests.
- Three-layer discipline intact: `src/audio/synth.ts` added no imports from `src/lib` or `src/components`.
- No call-site signature break: `audioPanel(...)` still returns `HTMLElement`.

## Commits

- 38f2f25: fix(quick-260615-w5t): startDrone null contract, once-only resume + no-Web-Audio warnings, non-running resume retry
- c6ce601: fix(quick-260615-w5t): disposeAudioPanel registry + honest drone button
- 776af12: fix(quick-260615-w5t): dispose prior audioPanel on cell invalidation

## Self-Check: PASSED

All modified files present and all three task commits found in git history.
