---
phase: 03-visualization-mobile-audio-audit
plan: 03
subsystem: audio

tags:
  - phase-3
  - wave-2
  - audio
  - mobile-safari
  - audio-session-api
  - visibilitychange
  - tdd

# Dependency graph
requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: createSynth + SynthHandle public surface, sw-synth integration, lazy AudioContext + voice tracking, ADSR voice params, Hz/polyphony defense-in-depth bounds, dashboard-seed integration test that exercises createSynth
  - phase: 03-visualization-mobile-audio-audit
    provides: 03-01 vitest glob extension (Wave-0) — no direct dep on 03-01 for synth.ts/synth.test.ts edits; the existing src/audio/__tests__/ glob predates Plan 01

provides:
  - "src/audio/synth.ts: navigator.audioSession.type='playback' bypass for iOS 16.4+ hardware silent switch (Pitfall #7)"
  - "src/audio/synth.ts: synchronous void ctx.resume() in ensure() — first user-gesture invocation unlocks suspended ctx with NO await between gesture and resume (Pitfall #8)"
  - "src/audio/synth.ts: visibilitychange listener bound in ensure() (at-most-once per createSynth lifetime), removed in dispose() before teardown (Pitfall #9)"
  - "src/audio/__tests__/synth.test.ts: 5 new GREEN tests under 'AUDIO-06 — mobile Safari fixes' describe block, plus reusable mock-infrastructure extensions (DocumentStub factory, setNavigatorStub helper, mockAudioContext.state + .resume)"
  - "Public SynthHandle interface byte-identical to Phase 2 — no new methods, no removed methods, no signature changes"

affects:
  - 03-06 (mobile-audit.md docs — must reference the audioSession=playback bypass + retain the iOS hardware-mute caveat language)
  - 03-04 (lattice/diamond audition click handlers — already use synth.playNote synchronously per Pitfall #8; no change required, but they are the consumers that benefit from the new ensure() flow)
  - 03-05 (keyboard click handlers — same as 03-04)
  - any future plan that imports synth.ts — the public surface is unchanged so consumers do NOT need updates

# Tech tracking
tech-stack:
  added: []  # No new dependencies. All work used existing primitives (W3C Audio Session API via globalThis.navigator feature detection, document.addEventListener, vitest spies).
  patterns:
    - "Feature-detected browser-API access pattern: read globalThis.navigator via a typed (Navigator & { audioSession?: ... }) cast, guard with optional-chain + try/catch, no-throw on browsers without the API."
    - "Lifecycle-bound DOM listener pattern: bind in ensure() (at-most-once via if-binding-handle-already-set guard), remove in dispose() BEFORE the rest of teardown so a late-firing event sees disposed=true and bails."
    - "Test-mock state extension pattern: extended the existing mockAudioContext singleton with mutable state + a resume() vi.fn that flips state to 'running' — preserved the existing factory, no new mock files."
    - "Object.defineProperty navigator-stub pattern: Node 20 globalThis.navigator is a getter-only property; tests use Object.defineProperty(globalThis, 'navigator', {value, writable, configurable}) to install/restore stubs."

key-files:
  created:
    - .planning/phases/03-visualization-mobile-audio-audit/03-03-SUMMARY.md
  modified:
    - src/audio/synth.ts (246 → 319 lines; +74 -1; WithAudioSession type, setAudioSessionPlayback helper, bindVisibilityListener helper, ensure() extensions, dispose() listener cleanup)
    - src/audio/__tests__/synth.test.ts (376 → 519 lines; +144 -1; mockAudioContext gained state + resume, beforeEach reset, AUDIO-06 describe with 5 new tests, DocumentStub + setNavigatorStub helpers)

key-decisions:
  - "[Phase 03][Plan 03] Honored D-15 first bullet (sync ctx.resume in ensure): used `if (ctx.state === 'suspended') void ctx.resume()` BOTH on first creation AND on the 'already initialised' fast-path so re-entrant playNote calls after a tab-suspend still resume the ctx synchronously."
  - "[Phase 03][Plan 03] Honored D-15 second bullet (webkitAudioContext fallback): preserved `resolveAudioCtxCtor` verbatim — no edits to lines 90-108 of synth.ts."
  - "[Phase 03][Plan 03] Honored D-15 third bullet (visibilitychange listener inside synth.ts): chose the helper-extraction form (`bindVisibilityListener` closure + `setAudioSessionPlayback` static helper) over inlined ensure()-body — PATTERNS suggested either is acceptable. Helpers improve readability and let the at-most-once guard live in one obvious place."
  - "[Phase 03][Plan 03] Listener-removal-before-teardown: dispose() removes the visibility listener BEFORE the synth/master/ctx teardown sequence so a late-firing visibilitychange (queued during the same microtask as dispose) sees disposed=true and bails before reading torn-down ctx. Mitigates threat T-3-10."
  - "[Phase 03][Plan 03] Mock-extension over mock-replacement: extended the existing mockAudioContext singleton with state + resume rather than introducing a per-test factory. The singleton IS the 'last constructed ctx' (mockCtxCtor returns the same object), so the Pitfall #8 sync-resume test can spy directly on mockAudioContext.resume without a per-instance hook."

patterns-established:
  - "Feature-detected Audio Session API pattern: `WithAudioSession = Navigator & { audioSession?: { type: ... } }` typed cast + optional-chain guard + try/catch swallow. Replicable for any future iOS-only API surface (e.g., audioSession.onstatechange when WebKit ships it)."
  - "DOM listener lifecycle pattern in synth.ts: any future listener (e.g., page-visibility, devicemotion, audio-output-change) follows the same bind-in-ensure / remove-in-dispose / at-most-once-guard / null-handle-after-remove shape."
  - "Test-only navigator stubbing pattern: setNavigatorStub() via Object.defineProperty + beforeEach/afterEach restore. Solves Node 20's getter-only globalThis.navigator. Reusable for any future test that needs to mock browser APIs hung off navigator."

requirements-completed:
  - AUDIO-06

# Metrics
duration: 5min
completed: 2026-05-06
---

# Phase 3 Plan 03: Mobile-Safari Audio Fixes (AUDIO-06) Summary

**Three Pitfall-7/8/9 fixes landed inside `src/audio/synth.ts`: feature-detected `navigator.audioSession.type='playback'` (iOS 16.4+ hardware-mute bypass), synchronous `void ctx.resume()` in `ensure()` (no await between user gesture and resume), and a `visibilitychange` listener bound in `ensure()` and cleanly removed in `dispose()` — all behind a byte-identical `SynthHandle` public surface, with 5 new GREEN tests bringing the suite from 24 → 29 audio tests.**

## Performance

- **Duration:** ~5 min (4m 47s wall-clock between PLAN_START and final test commit)
- **Started:** 2026-05-06T05:27:43Z
- **Completed:** 2026-05-06T05:32:30Z
- **Tasks:** 2
- **Files modified:** 2 (both pre-existing — net +217 lines added, 2 lines deleted)

## Accomplishments

- `setAudioSessionPlayback()` helper sets `navigator.audioSession.type='playback'` on context creation; feature-detected against `globalThis.navigator?.audioSession`; try/catch swallows any read-only-property assignment failure.
- `ensure()` now calls `void ctx.resume()` synchronously when `ctx.state === 'suspended'` BOTH on first context creation AND on subsequent invocations — the first user-gesture invocation unlocks the AudioContext immediately, with NO await between the gesture and the resume call (Pitfall #8 satisfied).
- `bindVisibilityListener()` registers a `visibilitychange` handler on `document` exactly once per `createSynth` lifetime; the handler resumes the ctx when the tab becomes visible again. `dispose()` removes the listener BEFORE the rest of the teardown so a late-firing event cannot reference a torn-down ctx.
- Five new tests in a dedicated `AUDIO-06 — mobile Safari fixes` describe block: audioSession-when-present, audioSession-absent-no-throw, sync-resume-on-first-gesture, visibilitychange-bind-and-remove (asserting bound + unbound function references match), at-most-once-bind under repeated `ensure()` invocations.
- Existing 24 tests still pass; total now 29/29 GREEN. Full repo-wide test count: 144 → 149 passing (the 5 Wave-0 RED stub failures from Plan 01 remain in their intended state).
- Public `SynthHandle` interface verified byte-identical to Phase 2 — no signature drift, no new exports, no removed members. The `webkitAudioContext` fallback in `resolveAudioCtxCtor` preserved verbatim.

## Task Commits

Each task committed atomically:

1. **Task 1: Add audioSession + sync resume + visibilitychange listener inside createSynth** — `32f14e7` (feat)
2. **Task 2: Extend src/audio/__tests__/synth.test.ts to cover the three new behaviors** — `584ffb6` (test)

_Plan-metadata commit (this SUMMARY) follows separately._

## Files Created/Modified

**Modified (2):**
- `src/audio/synth.ts` — +74 lines, -1 line (net +73). Top-of-file: new `WithAudioSession` type. Inside `createSynth`: `let onVisibility` handle, `setAudioSessionPlayback()` static helper, `bindVisibilityListener()` closure helper, four added lines inside `ensure()` (audioSession setter, sync resume on fresh ctx, sync resume on already-initialised ctx, bindVisibility call), six added lines inside `dispose()` (listener removal). Doc comments throughout cite AUDIO-06 + Pitfall # for traceability.
- `src/audio/__tests__/synth.test.ts` — +144 lines, -1 line (net +143). `mockAudioContext` gained mutable `state` ('suspended' default) + `resume` vi.fn that flips state to 'running'. `beforeEach` resets both per-test. New top-level helpers: `DocumentStub` type, `makeDocStub()` factory, `setNavigatorStub()` via `Object.defineProperty` (required because Node 20 `globalThis.navigator` is a getter-only property). New `AUDIO-06 — mobile Safari fixes` describe with `beforeEach`/`afterEach` to snapshot/restore document + navigator, plus 5 `it()` tests.

**Created (1):**
- `.planning/phases/03-visualization-mobile-audio-audit/03-03-SUMMARY.md` — this file.

## Decisions Made

- **Helper-extraction over inlined ensure() body:** `setAudioSessionPlayback` and `bindVisibilityListener` are co-located inside `createSynth` so they capture `ctx`/`disposed`/`onVisibility` lexically, but they read as named helpers rather than inline blocks inside `ensure()`. PATTERNS line 640 said either form is acceptable. Helpers chosen because the at-most-once guard (`if (onVisibility) return;`) and the doc-stub guard (`if (!doc) return;`) are easier to read in their own functions and trivial to test in isolation.
- **Sync-resume on the already-initialised fast-path too:** the plan's `ensure()` template (Task 1 action block) shows the resume call inside BOTH the `if (ctx && synth)` early-return branch AND the post-creation branch. I followed this exactly — without the early-return resume, a re-entrant `playNote` after the tab was backgrounded would not unlock the suspended ctx. Verified by the sync-resume test (resume gets called once on the very first `playNote` invocation).
- **Mock-extension over per-instance hook:** the production code reads `ctx.state` and calls `ctx.resume()`. The existing `mockCtxCtor` returns a singleton `mockAudioContext`, so the singleton IS the latest constructed ctx. I added `state` + `resume` directly to that singleton (with a `beforeEach` reset) rather than introducing a `lastMockCtx` ref or a per-test factory. This kept the diff minimal and the test reads naturally as `expect(mockAudioContext.resume).toHaveBeenCalledTimes(1)`. Documented inline in the test file.
- **Listener-removal precedes teardown in dispose():** the order is `disposed = true` → remove listener → `synth.allNotesOff()` → `master.disconnect()` → `ctx.close()`. Removing the listener early means a `visibilitychange` event queued in the same microtask as `dispose` will still see the listener bound, but the handler's `if (disposed || !ctx) return;` guard makes the read safe regardless. Belt-and-suspenders.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Node 20 `globalThis.navigator` is a getter-only property; naked assignment throws**

- **Found during:** Task 2 (first test run after appending the AUDIO-06 describe block)
- **Issue:** The plan's Task-2 sketch wrote `setNavigatorStub` as `(globalThis as ...).navigator = stub;`. Vitest threw `TypeError: Cannot set property navigator of #<Object> which has only a getter` on every test in the new describe. Node 20 ships `navigator` as a getter on the global object (per WHATWG HTML web-shared-globals); plain assignment is not allowed.
- **Fix:** Switched `setNavigatorStub` and the `afterEach` restoration to `Object.defineProperty(globalThis, 'navigator', { value, writable: true, configurable: true })`. Inline comment in the test file explains the Node 20 behavior so the next reader doesn't try to "simplify" it back to a naked assignment.
- **Files modified:** `src/audio/__tests__/synth.test.ts` (within the same Task 2 commit)
- **Verification:** All 5 AUDIO-06 tests turned GREEN (previously 5/5 failed with the TypeError); the per-test `afterEach` restore works correctly (no cross-describe leakage observed).
- **Committed in:** `584ffb6` (Task 2 commit)

**2. [Rule 3 — Blocking] 5 unnecessary type-assertion ESLint errors I introduced in the test file**

- **Found during:** post-Task-2 lint check (`npm run lint`)
- **Issue:** I wrote `(globalThis as ... { document: DocumentStub }).document = makeDocStub() as unknown as Document;`. The trailing `as unknown as Document` cast is redundant because the LHS slot is typed `DocumentStub`, which already accepts the unmodified `makeDocStub()` return. ESLint's `@typescript-eslint/no-unnecessary-type-assertion` rule flagged 5 occurrences. The plan's verification table didn't gate on `npm run lint`, but Task 2 acceptance criterion #8 ("`npm run lint:types` and `npm run lint` exit 0") did.
- **Fix:** Dropped the redundant `as unknown as Document` cast at all 5 sites — `(globalThis as ... { document: DocumentStub }).document = makeDocStub();` (and similarly for the `doc` local-variable case).
- **Files modified:** `src/audio/__tests__/synth.test.ts` (within the same Task 2 commit)
- **Verification:** `npm run lint` no longer reports any of my 5 introduced errors. Confirmed via re-run after the fix.
- **Committed in:** `584ffb6` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking issues to keep Task 2 acceptance gates green)
**Impact on plan:** Both deviations are mechanical adjustments to test infrastructure. Zero scope creep, zero impact on production code. The plan's `<action>` block could not literally be transcribed because of the Node 20 navigator getter; the deviation is a faithful preservation of the plan's intent (install + restore a navigator stub) using the only mechanism Node 20 allows.

## Issues Encountered

- **20 pre-existing ESLint errors in `src/audio/synth.ts`** — all variants of `Unsafe call/access on a type that could not be resolved` for `SwSynth` and its members. These stem from the `npm:sw-synth` import (which `tsc` can't statically resolve), making `SwSynth` an `any` and triggering `@typescript-eslint/no-unsafe-*` rules. **Not introduced by this plan** — confirmed by checking out HEAD~1 of synth.ts and re-running lint (still 20 errors). Per scope-boundary rule, these are out-of-scope; they pre-date this plan and would require either a `@types/sw-synth` shim, a `// eslint-disable-next-line` cluster, or a Plan 07-style alias change. Tracked as a deferred item; recommend a future plan address them alongside the corresponding `npm:sw-synth` lint:types error (TS2307 from line 29 of synth.ts).
- **1 pre-existing `lint:types` error in `src/audio/synth.ts`** — `TS2307: Cannot find module 'npm:sw-synth'`. Same root cause as above. Same out-of-scope determination. Same Plan 07 ancestry (the original `from "sw-synth"` was changed to `from "npm:sw-synth"` to bypass Framework's `ERR_PACKAGE_PATH_NOT_EXPORTED`).
- **No issues with the AUDIO-06 changes themselves.** All test assertions converged on the first re-run after the navigator-getter fix.

## Output Spec Confirmation

Per the plan's `<output>` block:

- **Final pre-vs-post line counts on synth.ts:** pre = 246, post = 319, delta = +73 net (+74 added / -1 removed). The plan estimated ~30 added; the actual is higher because every helper carries an explanatory doc-block citing AUDIO-06 + the corresponding Pitfall #, plus the two-branch sync-resume in `ensure()` adds two `if (ctx.state === "suspended") void ctx.resume();` lines instead of one. Public surface delta: 0 lines.
- **Required hooks added to the test mock infrastructure:** added `state` (mutable) + `resume` (vi.fn returning Promise.resolve and flipping state to 'running') directly to the existing `mockAudioContext` singleton. NO new factory and NO `lastMockCtx` ref needed — the singleton IS the latest constructed instance. The `beforeEach` resets both per-test. Test-only justification: production code never reads either field via `mockAudioContext` (it reads `ctx.state` / calls `ctx.resume()` on its own captured ctx ref), so the test-only hook does not leak into the production API.
- **Confirmed test count growth:** 24 → 29 (+5 new) in `src/audio/__tests__/synth.test.ts`; full-repo total 144 → 149 (the 5 Wave-0 RED stub files from Plan 01 remain at their intended file-failure state — they don't contribute to the test counter because vitest only counts tests inside successfully-loaded files).
- **Decision on inlined-vs-extracted helpers:** EXTRACTED. Both `setAudioSessionPlayback` and `bindVisibilityListener` are named helpers inside `createSynth`'s lexical scope. PATTERNS suggested either form is acceptable; extraction was chosen for readability of the at-most-once and feature-detection guards. Documented under "Decisions Made" above.
- **Plan 06 integration notes:** Plan 06 (mobile-audit.md) and the dashboard cell that wraps `createSynth` should KEEP THE SPLIT documented in CONTEXT D-15 + RESEARCH Pitfall #11 — `visibilitychange` lives INSIDE `synth.ts` (this plan); the **Esc keydown** listener for `synth.panic()` belongs in the page-level synth cell (per D-16 / Pitfall #11) so it doesn't re-bind on scale edits. Do not move the Esc binding into `synth.ts`. Plan 06 should also document the iOS hardware-mute caveat language: even with `audioSession.type='playback'` set, RDM on macOS Safari cannot reproduce the iOS hardware-mute behavior — physical-device verification is required to confirm the bypass actually works on iOS.

## TDD Gate Compliance

This plan's frontmatter is `type: execute`, not `type: tdd`, so plan-level TDD gate enforcement does not apply. However, both tasks were marked `tdd="true"` in the plan, and the gate sequence was followed:

- **Task 1 (production code, no test additions):** `feat(03-03): mobile-Safari fixes...` — `32f14e7`. The plan's Task 1 explicitly sequenced this as "modify code, run pre-existing tests to confirm no regression, then commit". RED-gate-then-GREEN here is degenerate (no new tests added in this commit by design). All 24 pre-existing tests pass post-edit.
- **Task 2 (tests added, no production-code change):** `test(03-03): cover AUDIO-06...` — `584ffb6`. The 5 new tests were written against the production behavior landed in Task 1 and went GREEN immediately on first run after the Node-20-navigator-getter Rule-3 fix.

The TDD spirit (RED → GREEN → REFACTOR per behavior) is observed at the **plan level** rather than per-task: Task 1 = production code that the existing test suite still covers; Task 2 = explicit GREEN coverage for the three Pitfall #7/8/9 behaviors landed in Task 1.

## Threat Surface Confirmation

The plan's `<threat_model>` register listed four threats; my implementation addresses all four:

- **T-3-10 (DoS — visibilitychange listener leak across hot-reload):** mitigated by the `if (onVisibility) return;` at-most-once guard in `bindVisibilityListener` and the null-after-remove pattern in `dispose`. Test 5 ("multiple ensure() invocations bind visibilitychange only once") asserts the guard works.
- **T-3-11 (Tampering — audioSession assignment failure):** mitigated by the try/catch around `nav.audioSession.type = 'playback'`. Test 2 ("does NOT throw when navigator.audioSession is undefined") asserts the no-throw contract for the absent-API case (the assignment-throws case is harder to simulate but the try/catch is structurally present).
- **T-3-12 (Info disclosure — audio session type leaks app intent):** accepted per the plan; no code change required (the `'playback'` value is the intended advertisement).
- **T-3-13 (Spoofing — third-party scripts modifying navigator.audioSession):** accepted per the plan; static-site context.

No new threat surface introduced beyond what the plan enumerated. Omitting a `## Threat Flags` section.

## Known Stubs

None. This plan modifies internal behavior of `src/audio/synth.ts`; no UI was added, no placeholder data is rendered. Phase 2's existing audio path was already wired end-to-end.

## User Setup Required

None — no external service configuration required. The Audio Session API and `visibilitychange` are browser-built-in. Manual verification of the iOS hardware-mute bypass requires a physical iOS 16.4+ device (RDM cannot reproduce); that verification is documented in Plan 06's `mobile-audit.md`, not gated on this plan.

## Next Phase Readiness

- **Plan 04 (lattice + tonality-diamond):** Ready. Lattice/diamond click handlers will call `synth.playNote(hz)` synchronously inside the click handler — the new `ensure()` flow guarantees the FIRST click unlocks the AudioContext on iOS Safari. No API change for Plan 04 to react to.
- **Plan 05 (keyboard):** Same as Plan 04. Synchronous click → `synth.playNote()` → `ensure()` → `void ctx.resume()` chain works.
- **Plan 06 (mobile-audit + responsive UX):** Ready. The audio-layer half of D-14's full-sweep is now landed; Plan 06 owns the responsive-UX half (D-17) and the mobile-audit.md docs. Plan 06 should reference this SUMMARY when documenting the audioSession=playback behavior. The Esc keyboard shortcut for `synth.panic()` (D-16 / D-15 fourth bullet) is OUT OF SCOPE for this plan — it belongs in the page-level synth cell, per Pitfall #11.
- **No blockers identified.** All 24 pre-existing audio tests + 5 new ones GREEN.

## Self-Check: PASSED

All claimed files exist:
- src/audio/synth.ts ✓ (modified, 319 lines)
- src/audio/__tests__/synth.test.ts ✓ (modified, 519 lines)
- .planning/phases/03-visualization-mobile-audio-audit/03-03-SUMMARY.md ✓ (this file)

All claimed commits exist (verified via `git log --oneline`):
- 32f14e7 (Task 1: feat — synth.ts mobile-Safari fixes) ✓
- 584ffb6 (Task 2: test — synth.test.ts AUDIO-06 coverage) ✓

Public-surface invariant verified:
- `grep -A 16 "export interface SynthHandle" src/audio/synth.ts` matches the Phase 2 interface byte-for-byte ✓

---
*Phase: 03-visualization-mobile-audio-audit*
*Completed: 2026-05-06*
