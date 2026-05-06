---
phase: 03-visualization-mobile-audio-audit
verified: 2026-05-05T09:35:00Z
status: gaps_found
score: 3/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "User can view a tonality diamond at any odd-limit (7, 11, 13, 21, 31, 81) without hardcoded constants"
    status: partial
    reason: "Diamond renders and the odd-limit is configurable (no hardcoded constants), but the SVG layout is geometrically broken at odd-limit >= 5 — multiple cells render at the same (x, y) and visually overlap. CR-01 from 03-REVIEW.md is unfixed; programmatic reproduction confirmed only 9 unique positions out of 16 cells at oddLimit=7."
    artifacts:
      - path: "src/components/tonality-diamond.ts"
        issue: "Lines 196-200: layout uses rankOf.get(d.numerator) / rankOf.get(d.denominator) where d.numerator and d.denominator are the OCTAVE-REDUCED ratio's n/d. The rankOf map only contains odd integers in [1, oddLimit]; reduced numerators/denominators frequently are even (4, 6, 8, 12) and miss the lookup, falling back to ?? 0 which collapses all such cells onto the row=0 / col=0 axes."
      - path: "src/lib/diamond.ts"
        issue: "DiamondCell interface lines 31-40 stores only the reduced numerator/denominator and ratio; it does NOT preserve the original (i, j) odd-integer pair. The component cannot reconstruct the rank position without that pair."
    missing:
      - "Add `i: number` and `j: number` fields to DiamondCell interface in src/lib/diamond.ts; populate from the enumeration loop variables in enumerateDiamond."
      - "Update src/components/tonality-diamond.ts:196-197 to use rankOf.get(d.i) / rankOf.get(d.j) for layout."
      - "Add a regression test in src/components/__tests__/tonality-diamond.test.ts asserting that no two cells share the same `transform` attribute (modulo the (i,i)→1/1 diagonal which the rhombus geometry collapses by design)."

  - truth: "User can open the composition page on iPhone Safari, tap a play button, and hear the interval (mute switch and autoplay-policy quirks documented)"
    status: partial
    reason: "Mobile audio code-path mitigations are landed (audioSession.type='playback', synchronous ctx.resume, visibilitychange listener with cleanup, webkitAudioContext fallback preserved). Human-verify checkpoint reportedly passed on Safari macOS RDM (per Plan 06 SUMMARY, dated 2026-05-06). But two correctness gaps in the audio-stop surface remain: (a) the floating Stop button + Esc handler do NOT cancel a running arpeggio's queued setTimeout calls — panic() only triggers synth.allNotesOff() and zeroes activeVoices; pending arpeggio notes continue to fire after panic; (b) the human-verify smoke-test exercised lattice/diamond/keyboard but did not test 'arpeggio + panic' — the most user-visible audio-stop affordance is unverified. Additionally, the mobile-audit.md footer placeholders ({user}, {YYYY-MM-DD}) were never filled in even though SUMMARY claims human approval on 2026-05-06."
    artifacts:
      - path: "src/audio/synth.ts"
        issue: "Lines 237-264: playArpeggio schedules setTimeout calls for notes i >= 1 but never tracks the timer handles. panic() (lines 281-285) and dispose() (lines 291-317) do not clearTimeout these pending calls. After Esc/Stop, arpeggio notes continue firing on cadence even though the user has visibly requested 'stop all audio'."
      - path: ".planning/phases/03-visualization-mobile-audio-audit/mobile-audit.md"
        issue: "Lines 190-191: 'Verified by: {user, after running smoke-test checklist}' and 'Verification date: {YYYY-MM-DD}' placeholders never populated. SUMMARY for Plan 06 claims human-verify approved on 2026-05-06, but the canonical record in mobile-audit.md is unsigned."
    missing:
      - "Track arpeggio timers in a Set<ReturnType<typeof setTimeout>>; clear the set in both panic() and dispose() (CR-02 fix recipe in 03-REVIEW.md provides verbatim code)."
      - "Add a regression test asserting that calling panic() during a long arpeggio cancels pending notes — easiest via vi.useFakeTimers + assertion that no further synth.noteOn calls occur after panic."
      - "Fill in the Verified by / Verification date placeholders in mobile-audit.md to reflect the 2026-05-06 RDM approval (or re-run the smoke-test now and sign with today's date)."
      - "Add 'arpeggio playing + Esc/Stop button stops it' as a smoke-test item in mobile-audit.md Section 1 (currently only present in implicit form)."
---

# Phase 3: Visualization + Mobile Audio Audit Verification Report

**Phase Goal:** Add the visual layer — D3-backed lattice with configurable prime basis, configurable-odd-limit tonality diamond, scale-on-keyboard SVG — plus the `.kbm` I/O that pairs with `.scl`, and verify mobile Safari audio actually works (the long-deferred quirk audit). After this phase, the kernel has a complete visual surface and audio is portable.

**Verified:** 2026-05-05T09:35:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                       | Status      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1   | User can render any Scale as a 2D lattice with a chosen prime basis and pan/zoom the SVG                                                                                    | ✓ VERIFIED  | `src/components/lattice.ts` exports `lattice(scale, synth, opts?)`; uses `spanLattice + kraigGrady9` from `npm:ji-lattice` and `d3.zoom` (scaleExtent [0.25, 8]); `deriveLatticeBasis` derives from scale primes minus 2; opts.basis overrides; `lattice.css` has `touch-action: none` for d3-zoom; 4/4 lattice tests pass; wired into `src/index.md` line 142.                                                                |
| 2   | User can view a tonality diamond at any odd-limit (7, 11, 13, 21, 31, 81) without hardcoded constants                                                                       | ✗ FAILED    | `src/components/tonality-diamond.ts` exists and exports `tonalityDiamond + DiamondOpts + deriveDiamondOddLimit`; auto-derives odd-limit from scale (no hardcoded constants in the math); 4/4 component tests pass. **BUT** the SVG layout uses `rankOf.get(d.numerator)` against octave-reduced ratios — programmatic reproduction at oddLimit=7 produces only 9 unique cell positions for 16 enumerated cells (CR-01 unfixed). |
| 3   | User can see a scale's pitches mapped onto a piano-keyboard SVG with cents-offset labels                                                                                    | ✓ VERIFIED  | `src/components/keyboard.ts` exports `keyboard(scale, synth, baseHz, opts?)`; renders N keys for N intervals; signed cents-from-12tet at 0.1¢ via `formatSignedCents`; period-boundary marker; pointerdown→playNote sustain via release callback; pointerleave/cancel/up all release; 5/5 tests pass; wired into `src/index.md` line 150.                                                                                       |
| 4   | User can export and re-import a .kbm keyboard mapping where referenceKey ≠ middleNote (the three named fields are explicit, never conflated)                                | ✓ VERIFIED  | `src/lib/kbm.ts` exports `KbmMapping` interface with three named fields; `parseKbm`, `writeKbm`, `kbmToFrequencies`, `defaultKbmFor`; round-trip golden test passes against `mid-60-ref-69.kbm` (middleNote=60, referenceKey=69, refHz=440 → MIDI 60 ≈ 261.6256 Hz); 11/11 kbm tests pass; sclIo handles both formats with auto-detection; `Download .kbm` button present; importedKbm wired into effectiveBaseHz.            |
| 5   | User can open the composition page on iPhone Safari, tap a play button, and hear the interval (mute switch and autoplay-policy quirks documented)                           | ✗ FAILED    | Code mitigations landed (audioSession='playback', sync ctx.resume, visibilitychange bind/unbind, webkitAudioContext fallback); 29 synth tests pass including AUDIO-06 mobile-Safari describe block; mobile-audit.md exists with 5 sections + checklist. **BUT** Esc/Stop does NOT cancel a running arpeggio (CR-02 unfixed); mobile-audit.md "Verified by" / "Verification date" footer never filled in.                       |

**Score:** 3/5 truths verified

### Required Artifacts

| Artifact                                  | Expected                                          | Status      | Details                                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/lattice.ts`               | lattice + LatticeOpts + deriveLatticeBasis        | ✓ VERIFIED  | 327 lines; exports all 3; uses d3.zoom + spanLattice + kraigGrady9; theme-token classes (axis-3/5/7/default); empty-state for octave-only scales.       |
| `src/components/lattice.css`              | Theme-token-only styles + touch-action: none     | ✓ VERIFIED  | 20 theme-token references; `touch-action: none` present; axis-3/5/7 prime variants present.                                                              |
| `src/components/tonality-diamond.ts`      | tonalityDiamond + DiamondOpts + deriveDiamondOddLimit | ⚠ STUB-LIKE | 274 lines; exists, exports all 3, tests pass, but the layout `rankOf.get(d.numerator)` is geometrically broken at oddLimit >= 5 — see CR-01 above.    |
| `src/components/tonality-diamond.css`     | Theme-token-only + touch-action: none            | ✓ VERIFIED  | 15 theme-token references; touch-action: none present; axis variants present.                                                                            |
| `src/components/keyboard.ts`              | keyboard + KeyboardOpts                           | ✓ VERIFIED  | 188 lines; exports both; pointerdown/up/leave/cancel sustain; signed cents formatter; period boundary marker; uses synth.playNote (NOT playNotes).      |
| `src/components/keyboard.css`             | Theme-token-only + touch-action: manipulation    | ✓ VERIFIED  | 9 theme-token references; touch-action: manipulation present.                                                                                             |
| `src/lib/kbm.ts`                          | KbmMapping + parseKbm + writeKbm + kbmToFrequencies + defaultKbmFor | ✓ VERIFIED | 365 lines; all 5 exports present; defense-in-depth caps; three-named-fields discipline enforced; unison-prepend defensive; 11 kbm tests pass.        |
| `src/lib/diamond.ts`                      | DiamondCell + enumerateDiamond                    | ⚠ INCOMPLETE | 82 lines; exports both; 3 tests pass. **BUT** DiamondCell does NOT carry the original (i, j) odd-integer pair — only the reduced numerator/denominator. This is the upstream cause of CR-01.  |
| `src/audio/synth.ts`                      | Mobile-Safari fixes for AUDIO-06                  | ⚠ INCOMPLETE | audioSession/sync-resume/visibilitychange all landed; webkitAudioContext fallback preserved; 29 tests pass. **BUT** playArpeggio setTimeout queue not cleared by panic/dispose (CR-02). |
| `src/components/scl-io.ts`                | Combined .scl + .kbm I/O widget                   | ✓ VERIFIED  | parseKbm/writeKbm/defaultKbmFor imported and used; "⤓ Download .kbm" button present; onImportKbm callback in SclIoOpts; .scl-io__export-row layout class. |
| `src/index.md`                            | Dashboard with viz widgets + Esc + Stop + effectiveBaseHz | ✓ VERIFIED | All three viz factories invoked exactly once; effectiveBaseHz threads via kbmToFrequencies; importedKbm Mutable; useBaseHzOverride toggle; "Stop all audio (Esc)" button; Esc keydown bound in synth cell. |
| `src/styles.css`                          | Phase 3 imports + Stop-button rules + 16px input | ✓ VERIFIED  | 3 new @import lines for keyboard/lattice/tonality-diamond; .stop-all-audio rules with --theme-red; `font-size: 16px` for inputs; theme tokens redeclared for per-page style: workaround. |
| `src/lib/INVENTORY.md`                    | Phase 3 entries section                           | ✓ VERIFIED  | "## Phase 3 entries" present with 5 sub-sections; all 12+ symbols documented.                                                                              |
| `mobile-audit.md`                         | RDM methodology + iOS quirks                      | ⚠ INCOMPLETE | All 5 H2 sections present; ≥10 checklist items; Pitfall 5/7/8/9/11 mitigation table; D-15 inventory. **BUT** "Verified by" / "Verification date" footer never filled (still placeholders). |

### Key Link Verification

| From                              | To                                  | Via                                              | Status     | Details                                                                                                       |
| --------------------------------- | ----------------------------------- | ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `src/components/lattice.ts`       | `npm:ji-lattice`                    | spanLattice + kraigGrady9 imports                | ✓ WIRED    | `import { spanLattice, kraigGrady9, type Vertex, type Edge } from "npm:ji-lattice";` — used inline to compute coords. |
| `src/components/lattice.ts`       | `d3`                                | d3.create('svg') + d3.zoom()                     | ✓ WIRED    | `import * as d3 from "d3";` — d3.zoom().scaleExtent([0.25, 8]) applied to SVG.                                |
| `src/components/lattice.ts`       | `synth.playNotes`                   | click handler routes to dyad/note audition       | ✓ WIRED    | `synth.playNotes([baseHz, baseHz * ratio], DEFAULT_AUDITION_DUR_SEC)` inside auditionVertex called from click. |
| `src/components/tonality-diamond.ts` | `src/lib/diamond.ts`             | enumerateDiamond import                          | ✓ WIRED    | `import { enumerateDiamond, type DiamondCell } from "../lib/diamond.js";` — invoked once per render.        |
| `src/components/tonality-diamond.ts` | layout from (i, j)               | rankOf.get(d.i) / rankOf.get(d.j)                | ✗ NOT_WIRED | Layout uses `rankOf.get(d.numerator)` instead of original i — DiamondCell does not carry (i, j). CR-01.       |
| `src/components/keyboard.ts`      | `synth.playNote`                    | pointerdown sustain via release callback         | ✓ WIRED    | `release = synth.playNote(baseHz * ratioForKey, KEYBOARD_NOTE_DUR_SEC)`; pointerup/leave/cancel call release. |
| `src/components/scl-io.ts`        | `src/lib/kbm.ts`                    | parseKbm + writeKbm + defaultKbmFor              | ✓ WIRED    | All three imported and used; auto-detect by extension (`endsWith(".kbm")`); onImportKbm callback fired.       |
| `src/index.md`                    | `kbmToFrequencies`                  | effectiveBaseHz derivation                       | ✓ WIRED    | Line 117: `kbmToFrequencies(scale, importedKbm).get(importedKbm.middleNote)` — single source of truth, no inline Math.pow. |
| `src/index.md`                    | `synth.panic`                       | Esc keydown + Stop-button click                  | ⚠ PARTIAL  | Both call `synth.panic()`; but panic does not clear arpeggio setTimeout queue (CR-02), so a running arpeggio continues firing notes after the user pressed Esc. |
| `src/audio/synth.ts`              | `navigator.audioSession`            | feature-detected type='playback' assignment      | ✓ WIRED    | `setAudioSessionPlayback()` helper called from ensure(); try/catch swallows assignment failure; 4 audioSession tests in synth.test.ts. |
| `src/audio/synth.ts`              | `document.visibilitychange`         | addEventListener in ensure(), removeEventListener in dispose() | ✓ WIRED | `bindVisibilityListener()` called from ensure(); cleanup in dispose() removes listener BEFORE teardown. |
| `src/styles.css`                  | component CSS                       | three new @import lines                          | ✓ WIRED    | keyboard.css, lattice.css, tonality-diamond.css all @imported.                                                |

### Behavioral Spot-Checks

| Behavior                                                            | Command                                                                | Result                                            | Status  |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- | ------- |
| All tests pass                                                      | `npm run test -- --run`                                                | 13 test files, 176 passed, 0 failed                | ✓ PASS  |
| TypeScript clean                                                    | `npm run lint:types`                                                    | exits 0                                            | ✓ PASS  |
| Static build succeeds                                               | `npm run build`                                                         | exits 0; `dist/index.html` rendered (15 kB / 567 kB imports) | ✓ PASS |
| Tonality diamond layout produces unique positions per cell          | Programmatic reproduction (Node, oddLimit=7, mirror layout formula)     | 16 cells → only 9 unique (col-row, col+row) positions; 7 explicit overlaps | ✗ FAIL |
| Arpeggio panic / dispose cancels pending notes                      | grep `clearTimeout` + grep arpeggio timer set                          | `clearTimeout` only inside playNoteImpl (line 220); no Set tracking arpeggio timers; panic/dispose do not clearTimeout the queue | ✗ FAIL |
| `.kbm` round-trip fixture for middle ≠ ref produces 261.6256 Hz     | kbm.test.ts "Pitfall-7 ground truth" assertion                         | Passes (within 0.001 Hz)                          | ✓ PASS  |

### Requirements Coverage

| Requirement | Source Plan        | Description                                                                                          | Status     | Evidence                                                                                                                              |
| ----------- | ------------------ | ---------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| VIZ-01      | 03-04, 03-06       | Lattice rendering (D3 + ji-lattice) with configurable prime basis                                    | ✓ SATISFIED | `lattice.ts` complete; basis configurable via opts.basis; auto-derived via `deriveLatticeBasis`; pan/zoom + click-audition wired.    |
| VIZ-02      | 03-02, 03-05, 03-06 | Tonality diamond with configurable odd-limit                                                        | ✗ BLOCKED   | Configurable odd-limit IS satisfied (no hardcoded constants); but the SVG cell layout is geometrically broken (CR-01 — cells overlap at oddLimit ≥ 5). The user can specify any odd-limit but cannot SEE distinct cells. |
| VIZ-03      | 03-05, 03-06       | Scale-on-keyboard SVG view                                                                           | ✓ SATISFIED | `keyboard.ts` complete; signed cents-from-12tet at 0.1¢; pointerdown/up sustain; period-boundary marker; aria-pressed mirror.       |
| IO-03       | 03-01, 03-02, 03-06 | Parse and serialize .kbm with referenceKey/referenceHz/middleNote as named fields                   | ✓ SATISFIED | `kbm.ts` complete; KbmMapping has all three named fields; round-trip golden tests pass; sclIo Download .kbm + onImportKbm wired.    |
| AUDIO-06    | 03-03, 03-06       | Mobile Safari audio verified working                                                                 | ⚠ NEEDS HUMAN | Code mitigations landed; SUMMARY claims human-verify approved 2026-05-06 BUT mobile-audit.md footer placeholders unfilled; arpeggio + panic interaction unverified; CR-02 means Esc/Stop does not stop a running arpeggio. |

**No orphaned requirements** — every Phase 3 ID in REQUIREMENTS.md (VIZ-01, VIZ-02, VIZ-03, IO-03, AUDIO-06) is claimed by at least one plan in this phase.

### Anti-Patterns Found

| File                                | Line  | Pattern                                                                                              | Severity   | Impact                                                                                                                                                  |
| ----------------------------------- | ----- | ---------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/tonality-diamond.ts` | 196-200 | Layout uses reduced (numerator, denominator) where original (i, j) is needed; `?? 0` masks the lookup miss | 🛑 Blocker | CR-01: visible defect — cells stack on top of each other at oddLimit ≥ 5; user cannot distinguish e.g. (1,5)=8/5 from (3,5)=6/5 — they render at the same SVG coordinate. |
| `src/audio/synth.ts`                | 256-263 | setTimeout queue not tracked; panic / dispose cannot cancel pending arpeggio notes                   | ⚠ Warning  | CR-02: Esc / Stop button does not actually stop a running arpeggio; up to ~115s of pending closures held in the timer queue after dispose; voice-leak hazard on hot-reload. |
| `src/components/tonality-diamond.ts` | 210-216 | `aria-label` set on `role="presentation"` cells                                                      | ℹ Info     | WR-01: ARIA spec ignores aria-label on presentation roles; "not in scale" string is dead code on those cells. Cosmetic / accessibility-purity issue.    |
| `src/audio/synth.ts`                | 226-263 | playNote/playArpeggio do not validate `dur` / `stepSec` (NaN, negative, Infinity all flow through)   | ℹ Info     | WR-02: defense-in-depth gap; real-world risk low (call sites pass concrete numbers).                                                                    |
| `src/components/keyboard.ts`        | 143-148 | Visual "active" state applied even when synth.playNote returns no-op                                 | ℹ Info     | WR-03: aria-pressed/visual mismatch in edge cases (Hz outside 20-20kHz, or disposed synth). Real-world risk low for the seed scale.                      |
| `mobile-audit.md`                   | 190-191 | "Verified by: {user, after running smoke-test checklist}" / "Verification date: {YYYY-MM-DD}" placeholders never filled | ⚠ Warning | Plan 06 SUMMARY claims human approval 2026-05-06; canonical record in mobile-audit.md is unsigned. Audit-trail gap.                                     |
| `src/index.md`                      | 33    | Esc keydown listener fires `synth.panic()` regardless of focus target                                | ℹ Info     | WR-07: Esc inside the scale textarea (e.g. user dismissing autocomplete) silently kills audio. Low-risk UX trap.                                        |
| `src/lib/kbm.ts`                    | 83-86 | `utf8ByteLength` fast-path returns `s.length * 3`, rejecting ASCII files > 333KB                     | ℹ Info     | WR-05: false-positive cap. Real-world `.kbm` files are <10 KB; not a goal-blocker.                                                                       |

### Human Verification Required

The phase contains items that benefit from physical-device or interactive verification beyond what automated checks cover. The mobile-audit smoke-test was reportedly walked once on Safari macOS RDM (per Plan 06 SUMMARY), but the canonical record is unsigned and three behaviors were not exercised.

#### 1. Tonality-diamond cell overlap (visual)

**Test:** Open the dashboard at `npm run dev`. The seed scale at oddLimit=31 should render an N×N rhombic grid of distinct cells. Visually count the in-scale-filled cells; the seed scale has 7 distinct ratios but the diamond should also render hundreds of out-of-scale "context" cells around them.
**Expected:** Each cell at a unique (x, y) position; no two cells overlap.
**Why human:** A regression test is recommended (in the gap closure plan), but the visual confirmation is fastest done by eye after the CR-01 fix lands.

#### 2. Arpeggio + Esc/Stop interaction

**Test:** Click "Arpeggio" in the audio panel for the 7-note seed scale. While the arpeggio is mid-flight (e.g. on note 3 of 7), press Esc OR click the floating "Stop all audio (Esc)" button.
**Expected:** All audio stops immediately; no further notes fire.
**Why human:** Currently observable: panic() fires synth.allNotesOff() (which silences the currently-sounding voice) but the queued setTimeout calls (notes 4, 5, 6, 7) continue to fire on cadence. A user who pressed Stop will hear the arpeggio finish anyway. CR-02 fix needed for this to pass.

#### 3. Mobile-audit checkpoint signature

**Test:** Walk the smoke-test checklist in `mobile-audit.md` Section 1 on Safari macOS RDM (iPhone preset).
**Expected:** All ≥12 checklist items tick; sign the footer "Verified by" / "Verification date" fields.
**Why human:** SUMMARY claims this was done on 2026-05-06 but the file footer is not signed. Either re-run + sign now, or backfill the SUMMARY-claimed date into the file.

### Gaps Summary

Phase 3 delivered most of the code surface the goal demands — three viz components, the .kbm I/O kernel + UI extension, mobile-Safari audio mitigations in synth.ts, and dashboard wiring with effectiveBaseHz threading and Stop+Esc — and the test suite (176 passing, 0 failing) plus build (`npm run ci`) are clean. Three out of five must-haves are fully verified.

The two failing must-haves both trace to defects flagged by the standard-depth code review (03-REVIEW.md) but never fixed:

1. **CR-01 (BLOCKER) — tonality-diamond layout overlaps.** `DiamondCell` does not carry the original (i, j) odd-integer pair, so the SVG layout rank-lookup `rankOf.get(d.numerator)` collapses cells with even numerators (e.g. 8/5, 6/5, 12/7, 10/7) onto the row=0 / col=0 axes. Reproduced programmatically: at oddLimit=7, only 9 unique (x, y) positions for 16 enumerated cells — 7 explicit overlaps. This is a visible defect for VIZ-02. The fix is a two-line change in src/lib/diamond.ts (add i, j fields) plus the corresponding rank lookup in tonality-diamond.ts (lines 196-197).

2. **CR-02 (WARNING) — arpeggio panic gap.** `playArpeggio` schedules per-note `setTimeout` calls but never tracks the timer handles. `panic()` calls `synth.allNotesOff()` (silencing the currently-sounding voice) but does not clear pending timers, so the arpeggio continues to fire. This breaks the "Stop all audio (Esc)" affordance during arpeggio playback — a real regression in the user-visible audio-stop surface that was just added in Phase 3. Fix recipe is verbatim in 03-REVIEW.md CR-02. Goal-level impact: AUDIO-06's "audio works on mobile" is partly about user TRUST of the audio surface; "Esc stops audio" being half-broken is a goal-level concern even if no Phase-3 test exercises it.

The `mobile-audit.md` unsigned footer is a documentation-trail gap rather than a code defect, but it should be filled in alongside the gap closure since the closure will likely re-run the smoke-test anyway.

**Recommendation:** Status `gaps_found`. Spin a `/gsd-plan-phase --gaps` cycle that addresses CR-01 and CR-02 with regression tests (the absence of a layout-uniqueness test let CR-01 ship; the absence of a panic-during-arpeggio test let CR-02 ship). The other code-review warnings (WR-01 through WR-08) can be deferred to a polish pass — they are documented anti-patterns but not goal-blockers.

---

_Verified: 2026-05-05T09:35:00Z_
_Verifier: Claude (gsd-verifier)_
