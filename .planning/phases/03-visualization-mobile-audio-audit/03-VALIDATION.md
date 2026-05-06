---
phase: 3
slug: visualization-mobile-audio-audit
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-05
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run && npm run typecheck && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run` (scoped to changed files preferred — `npm run test -- --run path/to/test`)
- **After every plan wave:** Run `npm run test -- --run && npm run typecheck && npm run lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

> One row per task across all 6 plans. Test paths reflect actual locations: `src/lib/__tests__/` and `src/components/__tests__/`.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-T1 | 01 | 1 | VIZ-01 | T-3-01 | d3@7.9.0 + @types/d3 installed; resolvable via `import * as d3` | unit | `node -e "import('d3').then(d=>console.log(typeof d.zoom))"` | ✅ | ⬜ pending |
| 01-T2 | 01 | 1 | VIZ-01/02/03 | — | vitest test glob covers `src/components/__tests__/`; happy-dom resolvable; `makeStubSynth` exported | unit | `grep -c "src/components/\*\*/__tests__" vitest.config.ts \|\| node -e "require.resolve('happy-dom')"` | ✅ | ⬜ pending |
| 01-T3 | 01 | 1 | IO-03/VIZ-01/02/03 | T-3-02 | 4 .kbm fixtures + 5 RED test stubs on disk; per-file `// @vitest-environment happy-dom` pragma | unit | `ls src/lib/__tests__/fixtures/kbm/*.kbm src/lib/__tests__/kbm.test.ts src/lib/__tests__/diamond.test.ts src/components/__tests__/{lattice,tonality-diamond,keyboard}.test.ts` | ✅ | ⬜ pending |
| 02-T1 | 02 | 2 | IO-03 | T-3-04/05/06/07/09 | parseKbm/writeKbm round-trip byte-stable; kbmToFrequencies golden (mid-60-ref-69 → MIDI 60 = 261.6256 Hz) | unit | `npm run test -- --run src/lib/__tests__/kbm.test.ts` | ✅ W0 (Plan 01) | ⬜ pending |
| 02-T2 | 02 | 2 | VIZ-02 | T-3-08 | enumerateDiamond(7, scale) → 16 cells; in-scale via Interval.equals (NEVER cents); octave-reduced ∈ [1, 2) | unit | `npm run test -- --run src/lib/__tests__/diamond.test.ts` | ✅ W0 (Plan 01) | ⬜ pending |
| 03-T1 | 03 | 2 | AUDIO-06 | T-3-10/11 | synth.ts sets navigator.audioSession.type='playback' (when present); calls `void ctx.resume()` synchronously; binds visibilitychange listener | unit | `grep -c "audioSession" src/audio/synth.ts && grep -c "visibilitychange" src/audio/synth.ts && ! grep -E "await\s+ctx\.resume" src/audio/synth.ts` | ✅ (existing synth.test.ts) | ⬜ pending |
| 03-T2 | 03 | 2 | AUDIO-06 | T-3-10/11 | 5 new test cases cover audioSession set, no-throw on missing API, sync resume call count, listener bind/unbind, bind-at-most-once | unit | `npm run test -- --run src/audio/__tests__/synth.test.ts` | ✅ (extended) | ⬜ pending |
| 04-T1 | 04 | 3 | VIZ-01 | T-3-14/15/17 | lattice() returns HTMLElement with class lattice-widget + h2 'Lattice'; svg.viz.lattice; click on .lattice-node[role=button] calls synth.playNotes; octave-only scale → empty-state copy | unit | `npm run test -- --run src/components/__tests__/lattice.test.ts` | ✅ W0 (Plan 01) | ⬜ pending |
| 04-T2 | 04 | 3 | VIZ-01 | — | lattice.css uses theme tokens only; touch-action: none; no hex; no @media | unit | `grep -c "var(--theme-" src/components/lattice.css && grep -c "touch-action: none" src/components/lattice.css && ! grep -E "#[0-9a-fA-F]{3,6}" src/components/lattice.css` | ✅ | ⬜ pending |
| 05-T1 | 05 | 3 | VIZ-02 | T-3-18/22 | tonalityDiamond() returns HTMLElement; svg.viz.diamond; SVG <title> with /limit/ in text; click on .diamond-cell[role=button] calls synth.playNotes | unit | `npm run test -- --run src/components/__tests__/tonality-diamond.test.ts` | ✅ W0 (Plan 01) | ⬜ pending |
| 05-T2 | 05 | 3 | VIZ-03 | T-3-19/20 | keyboard() returns HTMLElement; N keys for N-degree scale; aria-label format with signed cents; pointerdown calls synth.playNote (NOT playNotes); period boundary marker rendered | unit | `npm run test -- --run src/components/__tests__/keyboard.test.ts` | ✅ W0 (Plan 01) | ⬜ pending |
| 06-T1 | 06 | 4 | IO-03 | T-3-23 | sclIo handles .scl + .kbm with format auto-detection; "Download .kbm" button present; onImportKbm callback invoked | unit/integration | `grep -c "parseKbm\|writeKbm\|defaultKbmFor" src/components/scl-io.ts && grep -c "Download .kbm" src/components/scl-io.ts && npm run test -- --run` | ✅ (existing scl-io tests + manual) | ⬜ pending |
| 06-T2 | 06 | 4 | VIZ-01/02/03 IO-03 | T-3-24/25/27 | 3 viz cells + Stop button + Esc + effectiveBaseHz + importedKbm Mutable wired in src/index.md; `npm run build` succeeds | integration | `grep -c "lattice(scale, synth\|tonalityDiamond(scale, synth\|keyboard(scale, synth" src/index.md && npm run build` | ✅ | ⬜ pending |
| 06-T3 | 06 | 4 | VIZ-01/02/03 | — | styles.css imports new component CSS + Stop-button rules + iOS auto-zoom suppression (16px input font) | unit | `grep -c "@import.*lattice.css\|@import.*keyboard.css\|@import.*tonality-diamond.css" src/styles.css && grep -c "stop-all-audio" src/styles.css && grep -c "font-size: 16px" src/styles.css` | ✅ | ⬜ pending |
| 06-T4 | 06 | 4 | all | — | INVENTORY.md appends "## Phase 3" section with all 12 new symbol rows; Phase 1 + Phase 2 sections unchanged | unit | `grep -c "## Phase 3" src/lib/INVENTORY.md && grep -c "KbmMapping\|parseKbm\|enumerateDiamond\|tonalityDiamond" src/lib/INVENTORY.md` | ✅ | ⬜ pending |
| 06-T5 | 06 | 4 | AUDIO-06 | — | mobile-audit.md exists with ≥5 H2 sections, RDM methodology, audioSession + silent switch + touch-action mentioned, ≥10-item checklist | unit | `grep -cE "^## " .planning/phases/03-visualization-mobile-audio-audit/mobile-audit.md && grep -c "Responsive Design Mode\|audioSession\|silent switch\|touch-action" .planning/phases/03-visualization-mobile-audio-audit/mobile-audit.md` | ✅ | ⬜ pending |
| 06-T6 | 06 | 4 | AUDIO-06 | — | Human smoke-test passes on Safari RDM (iPhone preset) — checklist from mobile-audit.md Section 1 | manual | `# checkpoint:human-verify` | n/a (manual) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `npm install --save d3@7.9.0 @types/d3` — d3 not currently installed (Plan 01 Task 1)
- [x] `npm install --save-dev happy-dom@^15` — not currently installed; required for `// @vitest-environment happy-dom` per-file pragma (Plan 01 Task 2)
- [x] `src/lib/__tests__/kbm.test.ts` — round-trip property tests for `.kbm` parser/serializer (IO-03; Plan 01 Task 3)
- [x] `src/lib/__tests__/diamond.test.ts` — odd-limit enumeration property tests (VIZ-02; Plan 01 Task 3)
- [x] `src/components/__tests__/lattice.test.ts` — DOM smoke tests for lattice factory (VIZ-01; Plan 01 Task 3)
- [x] `src/components/__tests__/tonality-diamond.test.ts` — DOM smoke tests for tonalityDiamond factory (VIZ-02; Plan 01 Task 3)
- [x] `src/components/__tests__/keyboard.test.ts` — DOM smoke tests for keyboard factory; pointerdown/up sustain (VIZ-03; Plan 01 Task 3)
- [x] `src/components/__tests__/test-utils.ts` — shared `makeStubSynth` helper for component DOM tests (Plan 01 Task 2)
- [x] `src/lib/__tests__/fixtures/kbm/{12-tet,mid-60-ref-69,seven-degree,with-muted-keys}.kbm` — 4 canonical fixtures (Plan 01 Task 3)
- [x] `mobile-audit.md` — iOS Safari manual-test checklist (AUDIO-06; Plan 06 Task 5)

*Existing infrastructure (vitest, eslint, tsc) carries forward from Phase 1/2.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile Safari audio actually produces sound with hardware mute switch ON | AUDIO-06 | Cannot script the iOS hardware mute switch | 1. Open site on iPhone Safari (iOS 16.4+). 2. Flip hardware mute ON. 3. Tap play button. 4. Verify audio is audible. 5. Repeat with mute OFF. |
| Pan/zoom feels right on touch devices | VIZ-01 | UX feel cannot be unit-tested | Open lattice on iPad/iPhone; pinch-zoom and two-finger-pan; verify no jank, no scroll-hijack outside the SVG region. |
| Keyboard tap-to-audition latency under 100ms | VIZ-03 | Subjective | Tap multiple keys in succession; ensure no perceptible lag. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (d3 install, happy-dom install, new test files, kbm fixtures, makeStubSynth helper)
- [x] No watch-mode flags (use `--run` always)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
