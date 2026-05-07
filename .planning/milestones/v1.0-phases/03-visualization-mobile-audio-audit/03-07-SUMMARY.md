---
phase: 03-visualization-mobile-audio-audit
plan: 07
subsystem: visualization + audio (gap-closure)
tags: [phase-3, gap-closure, regression, viz-02, audio-06]
requires:
  - "Phase 3 Plans 01-06 (DiamondCell shape, tonality-diamond rendering, synth.playArpeggio + panic, mobile-audit.md scaffold)"
provides:
  - "DiamondCell.i / DiamondCell.j (original odd-integer pair preserved through enumeration)"
  - "Correct tonality-diamond grid layout for all odd-limits (CR-01 closed)"
  - "arpTimers Set + panic/dispose cancellation (CR-02 closed)"
  - "Two new regression tests (CR-01 layout-uniqueness, CR-02 panic-during-arpeggio)"
  - "Signed mobile-audit.md footer + arpeggio+Esc smoke-test bullet"
affects:
  - "src/components/tonality-diamond.ts (consumes new DiamondCell.i/j fields)"
  - "All consumers of synth.panic() and synth.dispose() (now also clear pending arpeggio timers)"
tech-stack:
  added: []
  patterns:
    - "Closure-scoped Set<TimerHandle> for tracking deferred work; cleared in panic + dispose"
    - "Layout regression test: assert non-collapsed cell positions via SVG transform attribute uniqueness"
key-files:
  created: []
  modified:
    - "src/lib/diamond.ts"
    - "src/lib/__tests__/diamond.test.ts"
    - "src/components/tonality-diamond.ts"
    - "src/components/__tests__/tonality-diamond.test.ts"
    - "src/audio/synth.ts"
    - "src/audio/__tests__/synth.test.ts"
    - ".planning/phases/03-visualization-mobile-audio-audit/mobile-audit.md"
decisions:
  - "Diagonal-cell geometry: assert x=0 (shared unison axis) + 16 distinct transforms, not the plan's 'all collapse to (0,0)' expectation. Rhombus layout y=(col+row)*STRIDE stacks diagonals vertically — matches existing 'diagonal stacks vertically' comment in tonality-diamond.ts:156-158."
  - "Mobile-audit footer: split sign-off into original 2026-05-06 RDM walk (signed Taylor Brook) and a separate {pending} 'Post-CR-02 regression follow-up' block. Original sign-off does NOT extend to cover the new arpeggio+Esc bullet because that behavior was broken on 2026-05-06."
  - "TypeScript pre-existing errors (4 from npm:sw-synth, npm:ji-lattice, lattice.ts implicit any) left in place — out of scope per WR-01..WR-08 deferral; npm run lint:types still exits 0."
metrics:
  duration: "~10 minutes"
  completed: "2026-05-06"
  commits: 4
  tests_added: 3
  tests_total: 179
---

# Phase 3 Plan 07: Phase 3 Gap Closure (CR-01, CR-02, mobile-audit footer) Summary

**One-liner:** Closed the three concrete VERIFICATION gaps — DiamondCell now carries the original odd-integer (i, j) pair so the SVG layout no longer collapses cells onto axes; arpeggio setTimeout queue is tracked in a closure-scoped Set and cleared by panic/dispose so Esc actually stops queued notes; mobile-audit.md is signed for the original 2026-05-06 RDM walk with a separate pending sign-off block for the post-fix regression walk.

## Gaps Closed

### CR-01 (BLOCKER) — Tonality-diamond layout collapse

**Symptom (from `03-VERIFICATION.md`):** At oddLimit=7 the SVG produced only 9 unique cell positions for 16 cells because the layout looked up `rankOf.get(d.numerator)` against the OCTAVE-REDUCED numerator/denominator, which are not always odd (e.g. (i=3, j=5)→6/5, (i=1, j=7)→8/7). Reduced-even cells fell through the `?? 0` fallback and stacked onto the row=0 / col=0 axes.

**Fix:**

- **`src/lib/diamond.ts`** — Added `i: number; j: number;` non-optional fields to the `DiamondCell` interface, populated from the enumeration loop iterators. `numerator` / `denominator` continue to reflect the reduced ratio (so consumers can still label cells with their canonical reduced form).
- **`src/components/tonality-diamond.ts`** — Layout transform callback now uses `rankOf.get(d.i)` / `rankOf.get(d.j)` instead of `rankOf.get(d.numerator)` / `rankOf.get(d.denominator)`. The broken lookup is removed, not just supplemented.

**Regression tests:**

- `src/lib/__tests__/diamond.test.ts` — "preserves original (i, j) odd-integer pair on every cell (CR-01 regression)" — asserts every cell carries odd `i`, `j` and spot-checks `(i=3, j=5) → reduced 6/5` (proves `i` is original 3, not reduced numerator 6).
- `src/components/__tests__/tonality-diamond.test.ts` — "renders each non-diagonal cell at a unique SVG transform (CR-01 regression)" — at oddLimit=7 asserts (a) 16 cells render, (b) all 12 non-diagonal cells sit at unique SVG `translate(...)` transforms, (c) the 4 diagonal cells (i === j) all share the x=0 vertical unison axis at distinct y positions, (d) all 16 transforms are distinct. The broken layout would fail (a)+(d) — it produced only 9 unique transforms.

### CR-02 (WARNING / AUDIO-06 goal-blocker) — Arpeggio setTimeout queue not cancelled

**Symptom (from `03-VERIFICATION.md`):** `playArpeggio` schedules `setTimeout` for notes 2..N but never tracks the timer handles. `panic()` and `dispose()` call `synth.allNotesOff()` but the queued setTimeout closures fire on cadence after Esc / Stop, calling `playNoteImpl` → `synth.noteOn` against the still-live audio context.

**Fix:**

- **`src/audio/synth.ts`** — Added closure-scoped `const arpTimers = new Set<ReturnType<typeof setTimeout>>()`. `playArpeggio` captures each per-note `setTimeout` handle, registers it in `arpTimers`, and self-removes when the timer fires. `panic()` clears all pending timers BEFORE calling `synth.allNotesOff()`. `dispose()` clears all pending timers early in teardown (before the visibilitychange listener removal) so closures (which capture `hz`, `noteLen`, `ctx`, `synth`, etc.) do not stay alive in the timer queue.

**Regression test:**

- `src/audio/__tests__/synth.test.ts` — "panic during arpeggio cancels all pending notes (CR-02 regression)" — starts a 5-note arpeggio at 500ms cadence, advances `vi.useFakeTimers()` to t=500ms (2 notes fired), calls `synth.panic()`, advances another 2s past where notes 3/4/5 would have fired, asserts `mockSynthInstance.noteOn.mock.calls.length` is unchanged from the panic-time count. Reverting any of Edits 1-4 would cause the queued setTimeout closures to fire and bump the call count to 5.

### mobile-audit.md footer — Placeholder signature

**Symptom (from `03-VERIFICATION.md`):** Lines 190-191 of `mobile-audit.md` still read `**Verified by:** {user, after running smoke-test checklist}` / `**Verification date:** {YYYY-MM-DD}` even though Plan 06 SUMMARY claimed human approval was given on 2026-05-06.

**Fix:**

- **`mobile-audit.md`** — Replaced the placeholder block with two paired sign-off blocks:
  - **Original 2026-05-06 RDM walk:** "Verified by: Taylor Brook (Safari macOS Responsive Design Mode, iPhone preset)" / "Verification date: 2026-05-06" — backfilled from the SUMMARY claim.
  - **Post-CR-02 regression follow-up:** Both lines `{pending}` — the original 2026-05-06 sign-off does NOT cover the new arpeggio+Esc bullet (which is the CR-02 regression surface and was broken on 2026-05-06).
- Added a new UNTICKED smoke-test bullet "Esc/Stop cancels a running arpeggio mid-flight (CR-02 regression surface)" directly after the "Stop button hides when idle" bullet. Walks the user through starting the 7-note seed-scale arpeggio, panicking mid-flight, and verifying no remaining notes fire on cadence. Smoke-test checklist is now 13 items (was 12).

## Concrete Code Changes per File

| File | Change |
|------|--------|
| `src/lib/diamond.ts` | +2 interface fields (`i`, `j`) and +2 populated fields in the cells.push literal; doc comment updated to explain why both reduced and original pairs are needed. |
| `src/lib/__tests__/diamond.test.ts` | +1 test (CR-01 regression). 4 tests total (was 3). |
| `src/components/tonality-diamond.ts` | Layout transform callback: `rankOf.get(d.numerator)` → `rankOf.get(d.i)` and `rankOf.get(d.denominator)` → `rankOf.get(d.j)`. |
| `src/components/__tests__/tonality-diamond.test.ts` | +1 test (CR-01 regression). 5 tests total (was 4). |
| `src/audio/synth.ts` | +1 Set declaration in closure scope; playArpeggio captures + registers + self-removes timer handles; panic() and dispose() both clear the Set before their other teardown work. |
| `src/audio/__tests__/synth.test.ts` | +1 test (CR-02 regression). 30 tests total (was 29). |
| `.planning/phases/03-visualization-mobile-audio-audit/mobile-audit.md` | Replaced unsigned footer with original 2026-05-06 sign-off + separate {pending} post-CR-02 sign-off block; added unticked CR-02 smoke-test bullet. Checklist now 13 items (was 12). |

## Final Test / Lint / Build Status

| Gate | Command | Status |
|------|---------|--------|
| Tests | `npm run test -- --run` | exit 0 — 13 test files, 179 tests passed (was 176 + 3 new regression tests = 179). |
| Type-check | `npm run lint:types` | exit 0. 4 pre-existing TS errors remain (`npm:sw-synth`, `npm:ji-lattice`, lattice.ts implicit `any`) — out of scope per WR-01..WR-08 deferral and unchanged from base commit. |
| Static build | `npm run build` | exit 0. `dist/index.html` exists (15kB, 567kB imports, 14kB files). |

## Plan Verification Gauntlet (from `<verification>` block)

All 13 conditions PASS:

1. `i: number;` in diamond.ts — 1 match. ✅
2. `j: number;` in diamond.ts — 1 match. ✅
3. `rankOf.get(d.i)` in tonality-diamond.ts — 1 match. ✅
4. `rankOf.get(d.j)` in tonality-diamond.ts — 1 match. ✅
5. `rankOf.get(d.numerator)` in tonality-diamond.ts — 0 matches (broken lookup removed). ✅
6. `const arpTimers = new Set` in synth.ts — 1 match. ✅
7. `for (const t of arpTimers) clearTimeout(t)` in synth.ts — 2 matches (panic + dispose). ✅
8. `Verified by: Taylor Brook` in mobile-audit.md — 1 match. ✅
9. `{YYYY-MM-DD}` in mobile-audit.md — 0 matches. ✅
10. `CR-01 regression` in diamond.test.ts — 1 match. ✅
11. `CR-01 regression` in tonality-diamond.test.ts — 1 match. ✅
12. `CR-02 regression` in synth.test.ts — 1 match. ✅
13. Tests + lint:types + build all exit 0; test count 179 ≥ 178. ✅

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Diagonal-cell geometry expectation in plan was wrong**

- **Found during:** Task 2 (CR-01 regression test for tonality-diamond.ts)
- **Issue:** The plan's regression-test spec said diagonal cells (i === j) "all collapse to the same apex (translate(0, 0))" because `i === j ⇒ row === col ⇒ x = y = 0`. This is incorrect — only `x = (col-row)*STRIDE = 0`, but `y = (col+row)*STRIDE = 2*row*STRIDE` is non-zero for non-(1,1) diagonals. The existing comment at `tonality-diamond.ts:156-158` says explicitly "the unison diagonal stacks vertically" — the rhombus geometry stacks diagonals on the x=0 axis at distinct y positions.
- **Fix:** The regression test now asserts the CORRECT geometry: every diagonal cell has `x === 0` (shared unison vertical axis), all 4 diagonals are at distinct transforms, AND all 16 cells are at unique transforms (the original CR-01 surface — the broken layout collapsed up to 7 cells onto one apex). The test is still load-bearing: reverting Tasks 1 + 2 would cause the broken `rankOf.get(d.numerator)` lookup to collapse cells like (1,7) and (3,5) onto the row=0 / col=0 axes, failing the "16 unique transforms" + "12 unique non-diagonal transforms" assertions.
- **Files modified:** `src/components/__tests__/tonality-diamond.test.ts`
- **Commit:** `727a439`

### No Auth Gates

No authentication / login gates encountered. All work was local code edits + test runs.

## Self-Check: PASSED

- All 7 modified files exist on disk and contain the expected changes.
- All 4 commits exist in `git log`:
  - `18b6b50` feat(03-07): preserve original (i, j) on DiamondCell for layout (CR-01)
  - `727a439` fix(03-07): use original (i, j) for diamond layout rankOf lookup (CR-01)
  - `b4b2a75` fix(03-07): track arpeggio timers; clear on panic and dispose (CR-02)
  - `b05d0e0` docs(03-07): sign mobile-audit footer; add arpeggio+Esc smoke-test bullet
- All 13 plan-verification grep conditions return the expected counts.
- Final test count: 179/179 passed across 13 test files.

## Threat Flags

None — no new security-relevant surface introduced. The arpTimers Set is bounded by the existing MAX_ARPEGGIO_LEN=256 cap; both panic() and dispose() clear it. The mobile-audit.md backfill discloses no new information (Taylor Brook is already the project's git author; 2026-05-06 is in the public Plan 06 SUMMARY git history).
