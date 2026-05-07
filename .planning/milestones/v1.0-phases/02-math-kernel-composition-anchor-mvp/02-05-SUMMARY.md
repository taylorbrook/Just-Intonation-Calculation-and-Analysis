---
phase: 02-math-kernel-composition-anchor-mvp
plan: 05
subsystem: audio

tags:
  - audio
  - sw-synth
  - lifecycle
  - voice-tracking
  - lazy-audiocontext
  - dispose
  - tdd

requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: (none from prior plans — Plan 05 is independent of the math kernel; consumes only sw-synth + Web Audio API)

provides:
  - createSynth(opts?) — factory returning a SynthHandle with lazy AudioContext + voice tracking
  - SynthHandle interface — playNote, playNotes, playArpeggio, startDrone, panic, activeVoices, dispose
  - CreateSynthOpts interface — master, maxPolyphony, voiceParams (Partial<OscillatorVoiceParams>)
  - AUDIO-01 lazy AudioContext: never created at module load; first call to playNote/playArpeggio/startDrone constructs ctx + master gain + sw-synth.Synth; subsequent calls reuse
  - AUDIO-02 D-16 ADSR defaults — attackTime 0.005s, decayTime 0.030s, sustainLevel 0.7, releaseTime 0.150s; voiceParams shallow-merges user overrides on top
  - AUDIO-03 playArpeggio — schedules notes at stepSec intervals via setTimeout; default stepSec 0.45s, note length stepSec * 0.95 (D-18); truncates to 256 notes max (T-02-18)
  - AUDIO-04 startDrone — returns idempotent stop callback that calls sw-synth's noteOff and decrements activeVoices
  - AUDIO-05 polyphony + voice tracking — default maxPolyphony 16 (D-17), clamped to [1, 64] (T-02-19); activeVoices increments on every noteOn, decrements on every release/timer-fire/panic
  - Defense-in-depth Hz clamp [20, 20000] in playNote/startDrone (T-02-17 — NaN/Infinity/sub/super-audible reject without spending a voice)
  - Terminal dispose — disposed flag short-circuits ensure(); post-dispose calls become no-ops; idempotent

affects:
  - 02-06 (components: play-interval, play-scale, audio-panel — consume SynthHandle from a page-cell-owned createSynth())
  - 02-07 (dashboard — owns the synth in its own cell with `invalidation.then(synth.dispose)` per ARCHITECTURE Pattern 4)
  - syntonic-comma.md and any future theory page that wants inline audition

tech-stack:
  added:
    - "(none new — wraps sw-synth@0.4.0 already in dependencies)"
  patterns:
    - "Lazy AudioContext (Pitfall #2) — ensure() closure constructs ctx + gain + Synth on first method call; never at module load; never at createSynth() call"
    - "Voice tracking via callback-returned noteOff — sw-synth's `noteOn` returns a release fn; we wrap it with idempotent guards and a setTimeout for one-shot notes; expose activeVoices counter"
    - "Terminal dispose with disposed flag — ensure() returns false when disposed; every entry point short-circuits to a no-op return; idempotent so double-dispose is safe"
    - "Defense-in-depth at trust boundary — every Hz parameter is checked via Number.isFinite + range [20, 20000] before reaching sw-synth; bad inputs return a no-op release"
    - "Three-layer discipline preserved — synth.ts imports only sw-synth; zero src/lib/ or src/components/ imports (verified by grep -E `from ['\"]\\.\\./lib/|from ['\"]\\.\\./components/`)"
    - "Owner-allocates pattern (D-09 + ARCHITECTURE Pattern 4) — caller owns the SynthHandle and is responsible for dispose() via Framework `invalidation.then(...)`; the module exports no singleton"

key-files:
  created:
    - src/audio/synth.ts
    - src/audio/__tests__/synth.test.ts
  modified:
    - "(none — Wave 2 file-ownership: Plan 06 (Wave 3) consolidates INVENTORY.md rows for Plans 03/04/05 to avoid merge conflicts)"

key-decisions:
  - "Honored D-16 (ADSR defaults): attack 0.005s / decay 0.030s / sustain 0.7 / release 0.150s baked in as hardcoded constants; partial voiceParams override merges via spread on top (Pitfall — naive `...defaultParams(), ...opts.voiceParams` would lose D-16 values when user passes an empty object; using D-16 constants between defaultParams() and user override preserves the layer order)."
  - "Honored D-17 (polyphony cap = 16) AND threat T-02-19 (clamp to [1, 64]): clampPolyphony() rejects non-finite numbers with a fallback to 16 and floors negative or zero values to 1; no path can write a maxPolyphony outside the safe band."
  - "Honored D-18 (default note duration 1.5s; arp step 0.45s; note length 0.95 × step): all three live as named constants at the top of synth.ts."
  - "Honored ARCHITECTURE Pattern 4 (cell-owned synth + invalidation lifecycle): createSynth() is a factory not a singleton; the SynthHandle is the single ownership unit; dispose() is terminal so the cell pattern (`invalidation.then(synth.dispose)`) gives a guaranteed cleanup path on cell re-evaluation."
  - "Honored Pitfall #2 (NEVER create AudioContext at module top-level): ensure() guard fires only on first method call; the test 'does not create AudioContext until first method call' enforces this. The AudioContext lookup intentionally goes through `globalThis.window.AudioContext` (with `webkitAudioContext` fallback) so the test mock can install on `globalThis.window` without polluting `globalThis` itself."
  - "Honored Pitfall #9 (voice tracking): every noteOn returns a noteOff callback; for one-shot playNote we keep the callback inside an idempotent release closure with a setTimeout; for startDrone we return the callback to the caller as the stop function. The drone toggle pattern (RESEARCH lines 590-598) consumes this directly."
  - "Honored Three-layer discipline: src/audio/synth.ts has zero imports from src/lib/ or src/components/. Audio operates on `number` (Hz) values; the ratio→Hz projection (Scale.degreeToFreq) lives in the kernel layer per ARCHITECTURE Pattern 1."
  - "Defense-in-depth: T-02-17 Hz clamp [20, 20000] applied at the playNote and startDrone entry points (NOT inside ensure() — bad Hz must not even create the AudioContext); T-02-18 arpeggio cap = 256 with a one-shot console.warn; T-02-19 polyphony clamp [1, 64]."
  - "Dispose contract chosen: TERMINAL — post-dispose method calls are no-ops, NOT 'recreate-on-next-call'. Rationale (per RESEARCH lines 471 + the cell-pattern contract): the cell that owned this synth has been re-evaluated, so a fresh createSynth() handle is the correct continuation. Re-creating the AudioContext from a stale handle would defeat the leak-counter and confuse the invalidation contract."
  - "Test isolation strategy: `vi.mock('sw-synth', ...)` hoists Synth + defaultParams stubs; AudioContext stubbed via `globalThis.window = { AudioContext: mockCtxCtor }`; `await import('../synth.js')` after mocks are installed. beforeEach resets all mocks AND re-installs the default `noteOn` implementation (each call returns a fresh `vi.fn()`) so per-test mockImplementationOnce overrides work cleanly."
  - "INVENTORY.md NOT modified per Wave 2 file-ownership discipline — Plan 06 (Wave 3) consolidates rows for Plans 03/04/05 to avoid merge conflicts. Rows queued by this plan: `createSynth` factory + `SynthHandle` interface (see Next Phase Readiness)."

requirements-completed:
  - AUDIO-01
  - AUDIO-02
  - AUDIO-03
  - AUDIO-04
  - AUDIO-05

# Metrics
duration: 3min
completed: 2026-05-04
---

# Phase 02 Plan 05: Audio Lifecycle Wrapper Summary

**Lazy-AudioContext + voice-tracked + terminally-disposable wrapper around sw-synth — the single contract every audio-bearing page in the project will inherit, satisfying AUDIO-01..05 in one TDD task with 24 mocked unit tests.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-04T17:47:51Z
- **Completed:** 2026-05-04T17:50:51Z
- **Tasks:** 1 (TDD: RED commit + GREEN commit)
- **Files created:** 2 (synth.ts ~240 LoC + synth.test.ts ~358 LoC)
- **Files modified:** 0 (INVENTORY.md deferred to Plan 06 per Wave 2 discipline)

## Accomplishments

- `createSynth(opts?)` factory + `SynthHandle` + `CreateSynthOpts` exports — full public surface per PATTERNS lines 313-329
- Lazy AudioContext (AUDIO-01 / Pitfall #2) — no constructor side-effects until first method call
- D-16 ADSR defaults (AUDIO-02) — no clicks/pops; partial overrides supported
- playArpeggio (AUDIO-03) — D-18 defaults; 256-note safety cap with one-shot warn (T-02-18)
- startDrone with idempotent stop callback (AUDIO-04 / Pitfall #9)
- D-17 polyphony cap = 16; clamped to [1, 64] (AUDIO-05 / T-02-19)
- activeVoices counter — increments on every noteOn; decrements on release/timer-fire/panic
- Defense-in-depth Hz clamp [20, 20000] in playNote and startDrone (T-02-17)
- Terminal idempotent dispose() — closes ctx, disconnects master, releases voices, sets disposed flag
- 24 vitest cases — all passing; full Phase 2 suite at 89 passing across 6 files (89 = 65 prior + 24 new)
- Three-layer discipline preserved (no kernel/component imports)

## Task Commits

1. **Test (RED): add failing tests for createSynth audio lifecycle wrapper** — `58d856e` (test)
2. **Implementation (GREEN): createSynth wrapper covering AUDIO-01..05** — `b517300` (feat)

_Strict TDD: tests written first, run against missing module to verify RED ("Failed to load url ../synth.js"), then implementation iterated until all 24 tests green. Two-commit RED/GREEN gate captured in git log per the plan's TDD discipline._

## Files Created/Modified

- `src/audio/synth.ts` (created) — ~240 LoC, single export `createSynth` factory + 2 exported interfaces
- `src/audio/__tests__/synth.test.ts` (created) — 24 test cases covering AUDIO-01..05 + Hz clamp threats + dispose semantics + idempotency

## Decisions Made

(See `key-decisions` in frontmatter for the full list.) Highlights:

- **Spread order matters for ADSR:** `{...defaultParams(), [D-16 fields], ...opts.voiceParams}` — putting D-16 between sw-synth's defaults and the user override means a partial override (e.g. `{attackTime: 0.02}`) keeps decay/sustain/release at D-16 values. Naive `...defaultParams(), ...opts.voiceParams` would have leaked sw-synth's louder release back in.
- **Hz clamp at the entry points, NOT inside ensure():** an invalid Hz from `playNote(NaN, 1.0)` must reject BEFORE any AudioContext is created. Otherwise a buggy caller could spin up a real ctx + gain node + synth instance just to immediately not-use it. Tested explicitly: `synth.playNote(NaN, 1.0); expect(mockCtxCtor).not.toHaveBeenCalled()` — wait, actually we DO call ensure() once for the test setup; what the threat-model test actually verifies is `expect(mockSynthInstance.noteOn).not.toHaveBeenCalled()` after the bad call, so the check is "no voice spent."
- **Dispose chosen as TERMINAL** (not "recreate-on-next-call") — see frontmatter D-decision. This makes `activeVoices` post-dispose deterministically zero forever, which the leak-counter pattern (RESEARCH lines 600-602) depends on.
- **Test installs AudioContext on `globalThis.window`, not `globalThis`** — matches the production lookup path (`window.AudioContext`) so the resolveAudioCtxCtor() helper exercises the same branch in tests as in browsers. Strict TS required casting through `unknown` to assign the synthetic shape; documented inline.
- **INVENTORY deferred** — per Wave 2 file-ownership, Plan 06 (Wave 3) will add the rows below to avoid merge conflicts with Plans 03/04.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Defense-in-depth] Added Hz clamp + arpeggio cap + polyphony clamp at code level (mitigations from threat_model)**

- **Found during:** Plan reading (the plan's `<threat_model>` lists T-02-17, T-02-18, T-02-19 as `mitigate` dispositions but the `<action>` Step 2 reference implementation from RESEARCH.md does NOT include the clamps).
- **Issue:** RESEARCH.md's implementation sketch (lines 469-576) has no Hz validation in `playNote`, no length cap in `playArpeggio`, no clamp on `synth.maxPolyphony = opts.maxPolyphony ?? 16`. Shipping that verbatim would leave the threat-model mitigations un-implemented.
- **Fix:** Added `isPlayableHz` helper (Number.isFinite + [20, 20000]) at the top of `playNoteImpl` and `startDrone`; added `MAX_ARPEGGIO_LEN = 256` truncation with a one-shot `console.warn` in `playArpeggio`; added `clampPolyphony` helper enforcing [1, 64] inside `ensure()`. Each is also tested.
- **Files modified:** src/audio/synth.ts (added isPlayableHz, clampPolyphony, MAX_ARPEGGIO_LEN constants and call sites); src/audio/__tests__/synth.test.ts (added 4 Hz-clamp tests, 1 arpeggio-truncation test, 2 polyphony-clamp tests).
- **Verification:** Tests `rejects NaN frequencies`, `rejects Infinity frequencies`, `rejects sub-audible (< 20 Hz) and super-audible (> 20000 Hz) frequencies`, `rejects bad Hz in startDrone too`, `truncates arpeggios longer than the safety cap`, `clamps absurd maxPolyphony values to a sane upper bound`, `clamps absurdly low maxPolyphony to at least 1` all pass.
- **Committed in:** b517300

**2. [Rule 1 - Bug] Plan's reference implementation did not guard the disposed state in `panic()` and `dispose()` re-entrancy**

- **Found during:** Writing the dispose-idempotence test (`calling dispose() twice is idempotent`).
- **Issue:** The RESEARCH.md sketch's `dispose()` body unconditionally calls `synth?.allNotesOff()`, `master?.disconnect()`, `ctx?.close()`. After the first dispose the references are nulled, so the second dispose is technically a no-op via optional chaining — but the close() promise's `.catch()` handler is still scheduled, and on environments where `master.disconnect()` throws (some Safari versions throw on already-disconnected nodes per spec), the second dispose would throw because `master` is already null… wait, that's fine because `master?.disconnect()` short-circuits. The actual gap: a buggy underlying `allNotesOff()` throwing on the FIRST dispose would propagate and leave `disposed = false`, leading to indeterminate state.
- **Fix:** Added a `disposed` flag set to `true` IMMEDIATELY at the top of dispose(), wrapped `synth?.allNotesOff()` and `master?.disconnect()` in try/catch (swallowed because dispose is terminal), kept `ctx?.close().catch(() => {})` for the same reason. Also added a `disposed`-flag guard at the top of `panic()` so a post-dispose panic call does not invoke the (now nulled) synth.
- **Files modified:** src/audio/synth.ts (dispose body + panic guard).
- **Verification:** Test `calling dispose() twice is idempotent` passes; `panic` test still passes; `post-dispose method calls are no-ops` covers the panic-after-dispose path.
- **Committed in:** b517300

**3. [Rule 2 - Critical functionality] Test mock's `noteOn` reset between tests to keep mockImplementationOnce overrides working**

- **Found during:** Writing the "calling the returned noteOff invokes underlying noteOff and decrements activeVoices" test, which uses `mockSynthInstance.noteOn.mockImplementationOnce(() => releaseSpy)` to inject a tracked release callback.
- **Issue:** Without resetting `noteOn.mockImplementation` to its default (`() => vi.fn()`) in beforeEach, prior tests' `mockImplementationOnce` calls would leak across tests (vitest mock implementations stack), and a default `vi.fn()` returning `undefined` would crash the wrapper because `off()` would be called on undefined.
- **Fix:** beforeEach now does both `mockSynthInstance.noteOn.mockClear()` AND `mockSynthInstance.noteOn.mockImplementation(() => vi.fn())` to guarantee each test starts from the same baseline.
- **Files modified:** src/audio/__tests__/synth.test.ts (beforeEach block).
- **Verification:** All 24 tests pass in any order; reordering the test file's describe blocks does not destabilize the suite.
- **Committed in:** 58d856e (initial test file already included this fix)

---

**Total deviations:** 3 — two are Rule 2 defense-in-depth additions (the threat_model's mitigate dispositions made these correctness requirements the plan's reference impl did not explicitly include), one is a Rule 1 hardening of dispose's re-entrancy under exceptions. All preserve plan intent (AUDIO-01..05 contracts unchanged; D-16/D-17/D-18 honored as written; three-layer discipline preserved).

## Issues Encountered

- **None blocking.** The three deviations above were either anticipated from the threat_model section of the plan or surfaced during TDD test-writing.
- **Pre-existing prettier nit:** `npm run format:check` warns on `src/lib/scale.ts` and `src/lib/__tests__/scale.test.ts` (Plan 03 outputs). Out of scope for this plan; logged here for visibility, not for action. The new files (`src/audio/synth.ts`, `src/audio/__tests__/synth.test.ts`) are prettier-clean.
- **Pre-existing eslint warning:** `(node:NNNNN) ESLintIgnoreWarning: The ".eslintignore" file is no longer supported.` — pre-existing infrastructure warning, not introduced by this plan.

## Threat Flags

(None new — every threat in the plan's `<threat_model>` was either mitigated in code or accepted with rationale documented above.)

## Next Phase Readiness

**Ready for Plan 02-06 (components — play-interval, play-scale, audio-panel, scale-table):** the `SynthHandle` is the single dependency these widgets need. ARCHITECTURE Pattern 2 says factories receive the synth as a parameter, never reach for a global. The four widgets the plan calls out (D-10) — `playInterval(int, synth)`, `playScale(scale, synth)`, `audioPanel(synth, ...)`, plus `ratioPill` (no synth) — match this contract directly.

**Ready for Plan 02-07 (dashboard at src/index.md):** the cell-owning pattern (RESEARCH lines 580-588) is:

```js
const synth = createSynth();
invalidation.then(() => synth.dispose());
```

That pattern works as-is against the API shipped here. The dashboard's "Drone on 1/1" toggle (D-07) consumes `startDrone(baseHz)` + the returned stop callback, exactly per the drone-toggle pattern in RESEARCH lines 590-598.

**Plan 06 must add INVENTORY rows** (Wave 2 deferred from this plan):

```md
## Phase 2 — Audio entries

| Symbol | Source | Notes |
|--------|--------|-------|
| `createSynth` (factory in `src/audio/synth.ts`) | Custom (this repo) — wraps `sw-synth@0.4.0` | Lifecycle wrapper: lazy AudioContext (Pitfall #2), voice tracking via noteOff callbacks (Pitfall #9), polyphony cap (D-17 = 16, FIFO via sw-synth.maxPolyphony, clamped to [1, 64] for T-02-19), ADSR overrides (D-16). Hz clamped to [20, 20000] (T-02-17); arpeggio length capped at 256 (T-02-18). Dispose is terminal — post-dispose calls are no-ops. Three-layer discipline. |
| `SynthHandle` (interface) | Custom (this repo) | Public audio surface for `src/components/` and pages. Methods: playNote, playNotes, playArpeggio, startDrone, panic, activeVoices (getter), dispose. |
```

**No blockers.**

---
*Phase: 02-math-kernel-composition-anchor-mvp*
*Completed: 2026-05-04*

## Self-Check: PASSED

- File `src/audio/synth.ts` exists on disk
- File `src/audio/__tests__/synth.test.ts` exists on disk
- SUMMARY.md present at `.planning/phases/02-math-kernel-composition-anchor-mvp/02-05-SUMMARY.md`
- Commit `58d856e` (RED — failing tests) present in git log
- Commit `b517300` (GREEN — implementation) present in git log
- All 24 tests pass; full Phase 2 suite at 89 passing across 6 files
- Type check (tsc --noEmit) exits 0
- ESLint exits 0 (no errors, no warnings on new files)
- Three-layer discipline grep on src/audio/synth.ts: no kernel/component imports
- Required exports present: `export function createSynth`, `export interface SynthHandle`, `from "sw-synth"`
- Lazy-init guard present: `if (ctx && synth) return true`
- Voice tracking present: `activeVoices` referenced 12+ times in synth.ts
