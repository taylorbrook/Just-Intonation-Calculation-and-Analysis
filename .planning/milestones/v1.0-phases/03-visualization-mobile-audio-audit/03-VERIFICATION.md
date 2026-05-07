---
phase: 03-visualization-mobile-audio-audit
verified: 2026-05-06T10:37:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "User can view a tonality diamond at any odd-limit (7, 11, 13, 21, 31, 81) without hardcoded constants — CR-01 fixed; layout uses rankOf.get(d.i)/rankOf.get(d.j); load-bearing regression test asserts 16 unique transforms at oddLimit=7."
    - "User can open the composition page on iPhone Safari, tap a play button, and hear the interval (mute switch and autoplay-policy quirks documented) — CR-02 fixed; arpTimers Set tracked; cleared by panic() and dispose(); load-bearing regression test asserts panic-during-arpeggio cancels pending notes."
    - "mobile-audit.md footer signed for the 2026-05-06 RDM walk."
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Walk the new 'Esc/Stop cancels a running arpeggio mid-flight' bullet on Safari macOS RDM (iPhone preset)"
    expected: "Starting the 7-note seed-scale arpeggio, then pressing Esc OR clicking the floating Stop button mid-flight cancels all remaining notes immediately. Sign the 'Post-CR-02 regression follow-up' footer block in mobile-audit.md once verified."
    why_human: "The CR-02 fix is verified by the synth.test.ts unit-level regression test (panic clears arpTimers, no further noteOn calls fire). But the canonical mobile-audit record still has a {pending} sign-off block intentionally left for a physical-device walk on the fixed build. The fix was deliberately NOT covered by the original 2026-05-06 sign-off because the behavior was broken on that date. Tick the new bullet and fill in the {pending} footer values."
---

# Phase 3: Visualization + Mobile Audio Audit Verification Report (Re-verification)

**Phase Goal:** Add the visual layer — D3-backed lattice with configurable prime basis, configurable-odd-limit tonality diamond, scale-on-keyboard SVG — plus the `.kbm` I/O that pairs with `.scl`, and verify mobile Safari audio actually works (the long-deferred quirk audit). After this phase, the kernel has a complete visual surface and audio is portable.

**Verified:** 2026-05-06T10:37:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap-closure plan 03-07

## Re-Verification Summary

The previous verification on 2026-05-05 reported `gaps_found` (3/5 truths verified) with three concrete gaps:
1. **CR-01 (BLOCKER)** — DiamondCell did not preserve original (i, j); SVG layout collapsed cells onto axes.
2. **CR-02 (WARNING)** — Esc/Stop did not cancel pending arpeggio notes; queued setTimeout closures fired after panic.
3. **mobile-audit.md footer placeholders** — `{user}` / `{YYYY-MM-DD}` never filled despite Plan 06 SUMMARY claiming approval.

Plan 03-07 closed all three gaps with surgical edits and **two new load-bearing regression tests**. All quality gates remain green (179 tests pass, lint:types clean, static build produces dist/index.html). The post-fix code review (03-REVIEW.md) reports 0 blockers, 2 warnings (deferred to polish phase), 2 info-level notes.

**One remaining human-verification item:** the mobile-audit.md footer carries a deliberate `{pending}` "Post-CR-02 regression follow-up" sign-off block. The original 2026-05-06 RDM walk verified the originally-walked behaviors but could not have verified the new "Esc/Stop cancels arpeggio mid-flight" smoke-test bullet (which targets behavior that was BROKEN on 2026-05-06). The unit-level regression test for CR-02 is sufficient evidence that the code-path works; but the user-visible affordance still warrants a re-walk on RDM/iPhone preset before the canonical record is closed.

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                       | Status      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1   | User can render any Scale as a 2D lattice with a chosen prime basis and pan/zoom the SVG                                                                                    | ✓ VERIFIED  | Carried forward from prior verification. `src/components/lattice.ts` exports `lattice(scale, synth, opts?)`; uses `spanLattice + kraigGrady9` from `npm:ji-lattice` and `d3.zoom` (scaleExtent [0.25, 8]); `deriveLatticeBasis` derives from scale primes minus 2; opts.basis overrides; `lattice.css` has `touch-action: none`; 4 lattice tests pass; wired into `src/index.md:142`.                                              |
| 2   | User can view a tonality diamond at any odd-limit (7, 11, 13, 21, 31, 81) without hardcoded constants                                                                       | ✓ VERIFIED  | **CR-01 fixed.** `DiamondCell.i` / `DiamondCell.j` non-optional fields now preserve the original odd-integer pair (`src/lib/diamond.ts:40-42, 88-95`). Layout uses `rankOf.get(d.i)` / `rankOf.get(d.j)` (`tonality-diamond.ts:202-203`); broken `rankOf.get(d.numerator)` / `d.denominator` lookup is removed entirely. Regression test at `tonality-diamond.test.ts:49-96` asserts 16 unique transforms at oddLimit=7; passes. |
| 3   | User can see a scale's pitches mapped onto a piano-keyboard SVG with cents-offset labels                                                                                    | ✓ VERIFIED  | Carried forward. `src/components/keyboard.ts` exports `keyboard(scale, synth, baseHz, opts?)`; signed cents-from-12tet at 0.1¢; period-boundary marker; pointerdown→playNote sustain; pointerleave/cancel/up release; 5 keyboard tests pass; wired into `src/index.md:150`.                                                                                                                                                  |
| 4   | User can export and re-import a .kbm keyboard mapping where referenceKey ≠ middleNote (the three named fields are explicit, never conflated)                                | ✓ VERIFIED  | Carried forward. `src/lib/kbm.ts` exports `KbmMapping` with three named fields; `parseKbm`, `writeKbm`, `kbmToFrequencies`, `defaultKbmFor`; round-trip golden test (`mid-60-ref-69.kbm`) passes (260.6256 Hz at MIDI 60); 11 kbm tests pass; sclIo handles both formats with auto-detection; `Download .kbm` button present.                                                                                                  |
| 5   | User can open the composition page on iPhone Safari, tap a play button, and hear the interval (mute switch and autoplay-policy quirks documented)                           | ✓ VERIFIED  | **CR-02 fixed.** `arpTimers = new Set<ReturnType<typeof setTimeout>>()` declared in createSynth closure (`synth.ts:125`); `playArpeggio` adds + self-removes (`synth.ts:265-272`); `panic()` clears all pending timers BEFORE `synth.allNotesOff()` (`synth.ts:297-298`); `dispose()` clears them as the first teardown step (`synth.ts:314-315`). Regression test asserts noteOn call count is pinned at 2 after panic-during-5-note-arpeggio; passes. mobile-audit.md footer signed `Verified by: Taylor Brook` / `Verification date: 2026-05-06` for the original RDM walk. (Note: a separate `{pending}` follow-up sign-off block awaits a physical re-walk for the new arpeggio+Esc smoke-test bullet — see human_verification below; this is a documentation-trail nicety, not a code defect.) |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                                  | Expected                                          | Status      | Details                                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/diamond.ts`                      | DiamondCell with `i: number; j: number;` non-optional fields; populated from enumeration | ✓ VERIFIED | Lines 38-51: interface declares `i: number;` and `j: number;` first; lines 88-95: cells.push literal includes `i,` and `j,`; doc comment lines 22-37 explains why both reduced and original are needed. |
| `src/components/tonality-diamond.ts`      | Layout uses `rankOf.get(d.i)` / `rankOf.get(d.j)` | ✓ VERIFIED | Lines 202-203: `const row = rankOf.get(d.i) ?? 0;` / `const col = rankOf.get(d.j) ?? 0;`. The broken `rankOf.get(d.numerator)` / `d.denominator` calls return 0 matches in grep. |
| `src/audio/synth.ts`                      | arpTimers Set + panic/dispose clear               | ✓ VERIFIED | Line 125: `const arpTimers = new Set<ReturnType<typeof setTimeout>>();`. Lines 262-272: playArpeggio captures + adds; line 267: self-remove on fire. Lines 297-298 (panic): `for (const t of arpTimers) clearTimeout(t); arpTimers.clear();`. Lines 314-315 (dispose): same pattern. |
| `src/lib/__tests__/diamond.test.ts`       | CR-01 regression test (i,j preserved)             | ✓ VERIFIED | Line 41: `it("preserves original (i, j) odd-integer pair on every cell (CR-01 regression)", ...)`. Asserts every cell carries odd `i`, `j`; spot-checks (i=3, j=5) → reduced 6/5 with i=3 (proves i is original, not reduced numerator 6). 4 tests total (was 3). |
| `src/components/__tests__/tonality-diamond.test.ts` | CR-01 regression test (transform uniqueness)  | ✓ VERIFIED | Line 49: `it("renders each non-diagonal cell at a unique SVG transform (CR-01 regression)", ...)`. Asserts (a) 16 cells render at oddLimit=7, (b) all 12 non-diagonal cells have unique transforms, (c) all 4 diagonal cells render at x=0 (rhombus geometry — central vertical unison axis), (d) all 16 transforms are distinct. 5 tests total (was 4). |
| `src/audio/__tests__/synth.test.ts`       | CR-02 regression test (panic during arpeggio)     | ✓ VERIFIED | Line 290: `it("panic during arpeggio cancels all pending notes (CR-02 regression)", ...)`. Starts 5-note arpeggio at 500ms cadence, advances fake timers to fire note 2, calls panic(), advances 2000ms, asserts noteOn call count pinned at 2. 30 tests total (was 29). |
| `mobile-audit.md`                         | Footer signed; arpeggio+Esc smoke-test bullet     | ✓ VERIFIED | Line 195: `**Verified by:** Taylor Brook (Safari macOS Responsive Design Mode, iPhone preset)`. Line 196: `**Verification date:** 2026-05-06`. Lines 198-200: separate `Post-CR-02 regression follow-up` block with `{pending}` placeholders. Line 57: new UNTICKED bullet `- [ ] **Esc/Stop cancels a running arpeggio mid-flight** (CR-02 regression surface)` — placed deliberately unticked because it targets behavior that was broken on 2026-05-06. |

All artifacts from prior verification (lattice.ts, lattice.css, keyboard.ts, keyboard.css, kbm.ts, scl-io.ts, index.md, styles.css, INVENTORY.md) remain VERIFIED — re-verification regression check confirmed via passing test suite + clean build.

### Key Link Verification

| From                              | To                                  | Via                                              | Status     | Details                                                                                                       |
| --------------------------------- | ----------------------------------- | ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `src/components/tonality-diamond.ts` | `DiamondCell.i` / `DiamondCell.j`   | `rankOf.get(d.i)` and `rankOf.get(d.j)` in layout transform | ✓ WIRED | Lines 202-203 confirmed by grep; pattern `rankOf\.get\(d\.[ij]\)` matches twice; pattern `rankOf\.get\(d\.numerator\)` matches zero times (broken lookup removed). |
| `src/audio/synth.ts`              | `arpTimers` Set                     | playArpeggio adds; panic clears; dispose clears  | ✓ WIRED    | Pattern `arpTimers\.(add\|clear)` matches in playArpeggio (line 272), panic (line 298), dispose (line 315). All 3 of declaration + 2 clear-loops + add + delete-on-fire confirmed. |
| `src/index.md`                    | `synth.panic`                       | Esc keydown + Stop-button click                  | ✓ WIRED    | Line 33: `if (e.key === "Escape") synth.panic();`. Line 164: `btn.addEventListener("click", () => synth.panic());`. With CR-02 fix, panic now cancels pending arpeggio timers in addition to silencing voices. |
| `mobile-audit.md` footer          | Plan 06 SUMMARY 2026-05-06 claim    | Backfilled signature                             | ✓ WIRED    | Pattern `Verified by: Taylor Brook` matches once at line 195; `Verification date: 2026-05-06` matches once at line 196; `{YYYY-MM-DD}` matches zero times. |

All other prior-verification key links (lattice → ji-lattice/d3/synth.playNotes; keyboard → synth.playNote; sclIo → kbm.ts; index.md → kbmToFrequencies; synth → audioSession/visibilitychange) remain WIRED — re-verification regression check confirmed they were not perturbed.

### Behavioral Spot-Checks

| Behavior                                                            | Command                                                                | Result                                            | Status  |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- | ------- |
| All tests pass                                                      | `npm run test -- --run`                                                | 13 test files, 179 tests passed, 0 failed (was 176 + 3 new = 179) | ✓ PASS  |
| TypeScript clean                                                    | `npm run lint:types`                                                    | exits 0 with no error output                       | ✓ PASS  |
| Static build succeeds                                               | `npm run build`                                                         | exits 0; `dist/index.html` rendered (15 kB / 567 kB imports / 14 kB files) | ✓ PASS |
| CR-01 regression: tonality-diamond cells unique at oddLimit=7       | `npm run test -- --run src/components/__tests__/tonality-diamond.test.ts` | new test passes; 16 unique transforms; 12 unique non-diagonal; 4 diagonals at x=0 | ✓ PASS |
| CR-02 regression: panic mid-arpeggio cancels pending notes          | `npm run test -- --run src/audio/__tests__/synth.test.ts`                  | new test passes; noteOn call count pinned at 2 after panic; +2000ms advance fires no further notes | ✓ PASS |
| DiamondCell carries (i, j) original odd-integer pair                | `npm run test -- --run src/lib/__tests__/diamond.test.ts`                  | new test passes; (i=3, j=5) → numerator=6, denominator=5; i, j both odd integers | ✓ PASS |
| `.kbm` round-trip fixture for middle ≠ ref produces 261.6256 Hz     | kbm.test.ts "Pitfall-7 ground truth" assertion                         | Passes (within 0.001 Hz)                          | ✓ PASS  |

### Requirements Coverage

| Requirement | Source Plan        | Description                                                                                          | Status     | Evidence                                                                                                                              |
| ----------- | ------------------ | ---------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| VIZ-01      | 03-04, 03-06       | Lattice rendering (D3 + ji-lattice) with configurable prime basis                                    | ✓ SATISFIED | `lattice.ts` complete; basis configurable via opts.basis; auto-derived via `deriveLatticeBasis`; pan/zoom + click-audition wired.    |
| VIZ-02      | 03-02, 03-05, 03-06, 03-07 | Tonality diamond with configurable odd-limit                                                | ✓ SATISFIED | **Now unblocked.** CR-01 fix preserves original (i, j) on DiamondCell; layout uses rankOf.get(d.i)/rankOf.get(d.j); regression test asserts 16 unique transforms at oddLimit=7. |
| VIZ-03      | 03-05, 03-06       | Scale-on-keyboard SVG view                                                                           | ✓ SATISFIED | `keyboard.ts` complete; signed cents-from-12tet at 0.1¢; pointerdown/up sustain; period-boundary marker; aria-pressed mirror.       |
| IO-03       | 03-01, 03-02, 03-06 | Parse and serialize .kbm with referenceKey/referenceHz/middleNote as named fields                   | ✓ SATISFIED | `kbm.ts` complete; KbmMapping has all three named fields; round-trip golden tests pass; sclIo Download .kbm + onImportKbm wired.    |
| AUDIO-06    | 03-03, 03-06, 03-07 | Mobile Safari audio verified working                                                                 | ✓ SATISFIED (with human follow-up) | Code mitigations landed (audioSession='playback', sync ctx.resume, visibilitychange bind/unbind, webkitAudioContext fallback). CR-02 fix verified at unit level (regression test). mobile-audit.md signed for the originally-walked behaviors on 2026-05-06. **Pending physical re-walk** for the new arpeggio+Esc smoke-test bullet on RDM/iPhone preset (item in human_verification). |

**No orphaned requirements** — every Phase 3 ID in REQUIREMENTS.md (VIZ-01, VIZ-02, VIZ-03, IO-03, AUDIO-06) is claimed by at least one plan in this phase.

### Anti-Patterns Found

| File                                | Line  | Pattern                                                                                              | Severity   | Impact                                                                                                                                                  |
| ----------------------------------- | ----- | ---------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/audio/synth.ts`                | 212-229 | `playNoteImpl`'s release-callback `setTimeout` is NOT tracked in `arpTimers`; closures persist after panic for `noteLen` seconds | ⚠ Warning  | WR-01 (post-fix code-review finding). Functional impact benign (`Math.max(0, 0-1) === 0`; `off()` after `allNotesOff()` is idempotent), but bounded ~110s closure-leak after dispose. Not a goal-blocker; explicitly deferred to polish phase. |
| `src/components/tonality-diamond.ts` | 202-206, 235-242 | Diagonal cells (i === j) all render literal text "1/1" at distinct vertical positions — visual ambiguity | ⚠ Warning  | WR-02 (post-fix code-review finding). Cosmetic — the four diagonals are mathematically equivalent (all 1/1) but the rhombus geometry stacks them along x=0. Not a goal-blocker. |
| `src/components/__tests__/tonality-diamond.test.ts` | 49-96 | CR-01 regression test reads `text.ratio` element to detect diagonals (couples the test to rendering DOM choice) | ℹ Info     | Info-only; test is correct and load-bearing. Brittle to renaming the .ratio class but not fragile. |
| `src/audio/__tests__/synth.test.ts` | 290-309 | CR-02 regression test asserts `mockSynthInstance.noteOn.mock.calls.length` rather than spying on the timer queue directly | ℹ Info     | Info-only; via mock noteOn is the right surface — that's where the user-visible audio fires. |

The pre-existing WR-01 through WR-08 findings from the original 03-REVIEW.md (Esc-while-typing, kbm utf8 fast-path, aria-pressed mismatch, etc.) remain as documented anti-patterns deferred to a polish phase — not goal-blockers.

### Human Verification Required

The phase contains one item that benefits from physical-device verification beyond what automated checks cover.

#### 1. Walk the new "Esc/Stop cancels arpeggio mid-flight" smoke-test bullet on RDM

**Test:** Open the dashboard at `npm run dev`. Start the 7-note seed-scale arpeggio. While it is mid-flight (e.g. on note 3 of 7), press Esc OR click the floating "Stop all audio (Esc)" button. Then confirm the same behavior in Safari macOS Responsive Design Mode (iPhone preset) — the existing pattern in `mobile-audit.md` Section 1.

**Expected:** All audio stops immediately; no further arpeggio notes (4, 5, 6, 7) fire on cadence. After confirming, tick the new bullet at line 57 (currently `[ ]`) and fill in the `Post-CR-02 regression follow-up` footer block at lines 198-200 (currently `{pending}`).

**Why human:** The CR-02 fix is fully verified at the unit level — the new regression test in `synth.test.ts` exercises panic-during-arpeggio against the same mock surface that produces user-visible audio. But the user-visible affordance ("Esc actually stops the arpeggio") was deliberately excluded from the original 2026-05-06 RDM sign-off because the behavior was broken on that date. The mobile-audit.md author left a separate `{pending}` block explicitly for this re-walk. Goal-level impact is low (the unit test gives high confidence); documentation-trail completeness is the reason to walk it.

### Gaps Summary

**No code or behavior gaps remain.** All three concrete gaps from the prior verification (CR-01, CR-02, mobile-audit footer) are closed with surgical fixes plus load-bearing regression tests:

- **CR-01 closed:** `DiamondCell` carries the original `(i, j)` odd-integer pair as non-optional fields; tonality-diamond.ts layout uses `rankOf.get(d.i)` / `rankOf.get(d.j)`; regression test asserts 16 unique SVG transforms at oddLimit=7 (was 9 unique for 16 cells pre-fix).
- **CR-02 closed:** `arpTimers` Set tracks per-note setTimeout handles; `panic()` and `dispose()` both clear the Set; regression test asserts noteOn call count is pinned after panic-during-5-note-arpeggio.
- **mobile-audit.md footer closed (with intentional follow-up):** Original 2026-05-06 RDM walk signed `Taylor Brook`; separate `{pending}` "Post-CR-02 regression follow-up" block awaits a physical re-walk on the fixed build.

All quality gates pass: 179 tests (was 176 + 3 new regression tests), `lint:types` exits 0, `npm run build` produces `dist/index.html`. Post-fix code review (03-REVIEW.md) reports 0 blockers.

**Status: human_needed.** All five must-haves are code-verified, but item #5 carries a one-shot human-verification step (the `{pending}` mobile-audit follow-up sign-off). No further plan is required — the user simply needs to walk the new smoke-test bullet on RDM and fill in the footer values. The unit test is sufficient evidence that the underlying behavior is correct; this is a documentation-completeness step, not a goal-blocker.

**Recommendation:** Status `human_needed`. After the user walks the RDM smoke test and fills in the `{pending}` placeholders, the phase is complete and ready to be marked done. The deferred WR-01 through WR-08 findings can be addressed in a future polish phase.

---

_Verified: 2026-05-06T10:37:00Z_
_Verifier: Claude (gsd-verifier)_
