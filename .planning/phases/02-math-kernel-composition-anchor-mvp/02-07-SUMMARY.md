---
phase: 02-math-kernel-composition-anchor-mvp
plan: 07
subsystem: integration

tags:
  - dashboard
  - theory-page
  - katex
  - integration
  - smoke
  - phase-close

# Dependency graph
requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: Interval (Plan 02) + Scale (Plan 03) + parseScala/parseScl/writeScl (Plan 04) + createSynth/SynthHandle (Plan 05) + 6 widgets (Plan 06) + KaTeX head injection (Plan 01)

provides:
  - src/index.md dashboard — replaces Phase 1 hello with the D-05 vertical layout (textarea → scale table → baseHz → audio panel → .scl I/O → cross-link); D-02 7-limit JI seed scale baked as a string constant
  - src/pages/syntonic-comma.md — second theory page; KaTeX-rendered fractions/monzos + inline ratioPill + 3 inline playInterval widgets (NOTES-05); proves the architecture supports >1 page
  - observablehq.config.ts pages registration (Syntonic comma)
  - src/__tests__/dashboard-seed.test.ts — 5-test COMP-03 (reframed) integration gate; asserts seed parses to 8 intervals, period is 2/1, and round-trips writeScl → parseScl with all intervals equal

affects:
  - Phase 03 (visualization) — lattice/diamond widgets will mount on the dashboard or new pages, reusing the cell-owned-synth pattern from src/index.md and src/pages/syntonic-comma.md
  - Phase 04 (analysis & sharing) — ANAL-04 (URL-encoded scales) wires into the dashboard's textarea via the same parseScala entrypoint; the COMP-03 round-trip gate becomes the regression baseline for any future serializer changes

# Tech tracking
tech-stack:
  added:
    - "(none — composes existing primitives only; no new runtime dependencies)"
  patterns:
    - "ARCHITECTURE Pattern 4 (S-5) — every page owns its own synth via `const synth = createSynth(); invalidation.then(synth.dispose)` in an isolated cell with no dependencies on scale / baseHz; edits to other cells do NOT tear down the AudioContext (Pitfall #2)"
    - "D-13 contract reaffirmed end-to-end — parseScala auto-prepends 1/1; writeScl strips it; the round-trip integration test verifies both sides plus the unison-as-pitch absence and pitch-count == 7"
    - "D-14 period-as-last-interval — the round-trip test asserts back.period.equals(scale.period); the dashboard seed text ends with `2/1` so the kernel reads the period from the trailing line without any explicit period field in the file format"
    - "Three-layer discipline preserved across the integration boundary — src/index.md and src/pages/syntonic-comma.md import only from src/lib/, src/audio/, and src/components/; no direct sw-synth or fraction.js imports in pages"
    - "src/__tests__/ as the integration-test home — separate from src/lib/__tests__/ (kernel-only) to make the file-tree carry the unit-vs-integration distinction; vitest.config.ts already covered this path from Plan 01"
    - "Helper text rendered as plain HTML (`<p class=\"dashboard-helper\">`) NOT as a Markdown paragraph between code cells — Framework's reactive ordering separates Markdown lines into their own blocks, but a static `<p>` with a dedicated CSS class is the cleanest way to anchor the helper text below the textarea without forcing reactive reordering"

key-files:
  created:
    - src/__tests__/dashboard-seed.test.ts
  modified:
    - src/index.md (replaced Phase 1 hello with dashboard — Task 1, commit 717e632)
    - src/pages/syntonic-comma.md (created — Task 2, commit 1b76ad0)
    - observablehq.config.ts (pages array registers syntonic-comma — Task 2, commit 1b76ad0)
    - src/lib/scale.ts (Rule 3 prettier formatting — pre-existing line-length drift from Plan 03)
    - src/lib/__tests__/scale.test.ts (Rule 3 prettier formatting — pre-existing)

key-decisions:
  - "Honored D-01 — NO src/lib/pieces/ module exists; the seed scale (D-02: 9/8, 5/4, 21/16, 3/2, 27/16, 7/4, 2/1) lives as a string constant in src/index.md. COMP-01/02/03 reframed accordingly: COMP-03 became a CI gate on the seed text + .scl round-trip, not a piece-module test."
  - "Honored D-03 — src/index.md replaces the Phase 1 hello at the project root; the dashboard is reachable at `/` not `/composition` or `/dashboard`."
  - "Honored D-04 — the second theory page is the syntonic comma at src/pages/syntonic-comma.md; uses commaByName from Plan 02 to read 81/80 from the curated COMMAS table rather than re-deriving."
  - "Honored D-05 vertical layout — textarea, scale table, baseHz, audio panel, .scl I/O, cross-link in that order top-down. Each cell uses `display(...)` so the order in the rendered page matches source order even though Framework's reactivity doesn't guarantee that for non-display cells."
  - "Honored D-08 baseHz default 440 + step=0.01 — `Inputs.number({ value: 440, step: 0.01, label: \"Reference pitch (Hz)\" })`."
  - "Honored D-13 — seed text contains pitches WITHOUT the leading 1/1 (parseScala auto-prepends); the round-trip test asserts intervals[0] === 1/1 and that writeScl does NOT emit a 1/1 unison line."
  - "Honored Pattern 4 (cell-owned synth) on BOTH pages — src/index.md and src/pages/syntonic-comma.md each create their own synth cell with no dependencies on scale/baseHz; cross-page navigation does not leak AudioContexts because invalidation.then(synth.dispose) fires when the page tears down."
  - "Test logic adjustment in Task 3 (Rule 1 - Bug) — the planner's draft pitch-count assertion expected nonComment[1] = '7' but writeScl emits an empty description line that gets filtered out by `l.trim() !== ''`, so without an explicit description nonComment[0] became '7' not '9/8'. Fixed by passing description='seed' to writeScl in the test; assertion now anchors on both description (nonComment[0]) and count (nonComment[1])."
  - "Rule 3 deviation — applied prettier --write to src/lib/scale.ts and src/lib/__tests__/scale.test.ts (pre-existing line-length drift from Plan 03 noted in 02-04 SUMMARY's deferred items). The plan's verification criterion `npm run ci exits 0` requires format:check to pass; prettier-only changes are pure whitespace with zero logic impact. Without this fix the CI gate would have stayed red."
  - "Both human-verify checkpoints passed on first attempt (user response: 'approved') — confirms the five ROADMAP Phase 2 success criteria and KaTeX rendering all worked as planned."

requirements-completed:
  - NOTES-01
  - NOTES-02
  - NOTES-03
  - NOTES-04
  - NOTES-05
  - COMP-01
  - COMP-02
  - COMP-03

# Metrics
duration: ~50min
completed: 2026-05-04
---

# Phase 02 Plan 07: Dashboard + Theory Page + Integration Test Summary

**Composition wave — src/index.md becomes the scale-design dashboard wired end-to-end through Interval/Scale/parseScala/createSynth/audioPanel/sclIo, src/pages/syntonic-comma.md proves the >1-page KaTeX/inline-widget architecture, and a 5-case integration test guards the seed scale's parseScala → Scale → writeScl → parseScl round-trip in CI. Closes Phase 2.**

## Performance

- **Duration:** ~50 min (initial dashboard work + checkpoint pause + theory page + checkpoint pause + Task 3 integration test + closing docs)
- **Continuation handoff:** ~2026-05-04T19:00Z (Task 3 onwards)
- **Completed:** 2026-05-04T19:15:48Z
- **Tasks:** 3 auto + 2 human-verify checkpoints (both approved on first attempt)
- **Files created:** 2 (src/pages/syntonic-comma.md, src/__tests__/dashboard-seed.test.ts)
- **Files modified:** 4 (src/index.md, observablehq.config.ts, src/lib/scale.ts [Rule 3 format], src/lib/__tests__/scale.test.ts [Rule 3 format])

## Accomplishments

- **Dashboard at `/`** — D-05 top-down layout: H1 + subtitle, textarea (D-02 seed), helper text, scale table (4-column per D-06), baseHz input, audio panel (▶ Play / ⏵⏵ Arpeggiate / 🔇 Drone toggle), .scl import/export, cross-link to theory page
- **Syntonic-comma theory page** — KaTeX-rendered ${tex`\frac{81}{80}`}, monzo matrix, two ratioPills (5/4, 81/64), three inline `${playInterval(...)}` buttons (5/4, 81/64, 81/80) sharing the page's own synth cell
- **COMP-03 (reframed) CI gate** — `src/__tests__/dashboard-seed.test.ts`, 5 tests passing: parses 8 intervals, period is 2/1, round-trips writeScl → parseScl, no 1/1 in output, pitch count is 7
- **Both human-verify checkpoints approved on first attempt** — five ROADMAP Phase 2 success criteria visually verified by user (dashboard end-to-end + JI ratio precision + theory page + .scl re-import + AudioContext leak count = 1)
- **Test suite — 136 passing (was 131)**; full `npm run ci` gate green (lint:types + test + lint + format:check + build)
- **Phase 2 closes** — all 28 Phase-2 requirements complete (MATH × 6, SCALE × 5, IO × 4, AUDIO × 5, NOTES × 5, COMP × 3)

## Task Commits

1. **Task 1: dashboard at src/index.md** — `717e632` (feat) — replaces Phase 1 hello; D-02 seed; D-05 vertical layout; D-08 baseHz=440; cell-owned synth (Pattern 4)
2. **Checkpoint 1 (human-verify):** approved — five ROADMAP success criteria visually confirmed
3. **Task 2: src/pages/syntonic-comma.md + observablehq.config.ts pages registration** — `1b76ad0` (feat) — KaTeX math; commaByName lookup; 3 playInterval widgets; Pattern 4 own synth cell
4. **Checkpoint 2 (human-verify):** approved — KaTeX rendering + inline widgets + cross-page AudioContext leak test all passed
5. **Task 3: COMP-03 integration test** — `1f71386` (test) — 5 vitest cases; seed-scale round-trip in CI
6. **Rule 3 deviation: prettier formatting** — `81475e4` (style) — pre-existing scale.ts / scale.test.ts line-length drift fixed to unblock `npm run ci`

**Plan metadata commit:** TBD (final docs commit captures SUMMARY + STATE + ROADMAP + REQUIREMENTS).

## Files Created/Modified

- `src/index.md` (modified) — Phase 1 hello replaced with the dashboard (Task 1)
- `src/pages/syntonic-comma.md` (created) — second theory page; KaTeX + ratioPill + playInterval (Task 2)
- `observablehq.config.ts` (modified) — pages array registers `{ name: "Syntonic comma", path: "/pages/syntonic-comma" }` (Task 2)
- `src/__tests__/dashboard-seed.test.ts` (created) — 5-case COMP-03 integration test (Task 3)
- `src/lib/scale.ts` (modified) — prettier line-length collapse only, zero logic change (Rule 3)
- `src/lib/__tests__/scale.test.ts` (modified) — prettier line-length collapse only, zero logic change (Rule 3)

## Decisions Made

(See `key-decisions` in frontmatter for the full list.) Highlights:

- **D-01 enforced end-to-end** — `src/lib/pieces/` does not exist on disk; the dashboard's seed lives only in src/index.md and the integration test mirrors it verbatim. The COMP- requirement family is satisfied by general scale-design + a CI gate, not by a per-piece module.
- **Pattern 4 honored on both pages** — each page allocates its own synth cell with `invalidation.then(synth.dispose)`. The integration test does NOT exercise this (the test runs in node:vitest, not the browser); the human-verify checkpoint 2 test ("AudioContext leak count = 1 across navigation") is the in-browser verification.
- **Test logic fixed during execution (Rule 1)** — the planner's draft pitch-count assertion would have been off-by-one whenever `writeScl(scale)` was called without an explicit description (the empty description line gets filtered out by the test's `l.trim() !== ""` filter). Adjusted the test to pass `description="seed"` so nonComment[0]/[1] indexing is unambiguous, and added an extra assertion on `nonComment.length === 9` (description + count + 7 pitches) for belt-and-suspenders.
- **Rule 3 prettier fix** — pre-existing format drift on scale.ts / scale.test.ts blocked `npm run ci`. Pure whitespace collapse via `prettier --write`; isolated in its own commit (`81475e4`) so it doesn't pollute the integration-test commit's diff.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test pitch-count assertion was off-by-one without an explicit description**

- **Found during:** Task 3 (first vitest run — 1 of 5 failed)
- **Issue:** The plan's draft test called `writeScl(scale)` (no description) and asserted `nonComment[1]?.trim() === "7"`. But writeScl emits `lines.push(description ?? "")` — when description is undefined, the description line is `""`, which gets filtered out by `l.trim() !== ""`. So `nonComment[0]` became `"7"` (the count) and `nonComment[1]` became `"9/8"` (the first pitch). Test asserted `'7' === '7'` was wrong.
- **Fix:** Pass `description="seed"` to writeScl in the test so the description line is non-empty and `nonComment[0]/[1]` unambiguously index description and count. Added `expect(nonComment[0]).toBe("seed")` plus `expect(nonComment).toHaveLength(9)` (description + count + 7 pitches) for additional anchor.
- **Files modified:** src/__tests__/dashboard-seed.test.ts (test only — no kernel changes)
- **Verification:** All 5 tests in dashboard-seed.test.ts pass; full Phase 2 suite at 136/136
- **Committed in:** 1f71386 (Task 3 commit; the planner-draft bug never landed — the Edit happened before the commit)

**2. [Rule 3 - Blocking] Pre-existing prettier line-length drift on scale.ts / scale.test.ts**

- **Found during:** Task 3 verification (`npm run ci` — format:check exited 1)
- **Issue:** scale.ts and scale.test.ts (created in Plan 03) carried pre-existing prettier line-length drift — the project uses prettier's 100-char default but the files wrapped at ~80. The 02-04 SUMMARY noted these as deferred items, but 02-07's plan-acceptance criterion is explicit: `npm run ci exits 0`. Without fixing, the CI gate would stay red and Phase 2 cannot close.
- **Fix:** Ran `prettier --write src/lib/scale.ts src/lib/__tests__/scale.test.ts`. Pure whitespace / line-wrap; zero logic change. Committed separately so the diff is reviewable in isolation.
- **Files modified:** src/lib/scale.ts, src/lib/__tests__/scale.test.ts
- **Verification:** `npm run format:check` exits 0; `npm test -- --run` 136/136 (no regressions); `npm run ci` exits 0
- **Committed in:** 81475e4

---

**Total deviations:** 2 auto-fixed (1 bug in plan's draft test, 1 blocking pre-existing format drift)
**Impact on plan:** Both fixes were necessary for the plan's verification step to succeed. No scope creep — the test logic remains the round-trip + count assertions in the plan; the format fix is whitespace-only.

## Issues Encountered

- **None blocking.** The two deviations above were caught by the integration test + the CI gate respectively, and resolved within their own task.
- **Pre-existing scale.ts format drift was logged in 02-04 SUMMARY's "Deferred Issues" section** — Plan 02-07 closed the loop because the CI-gate requirement made it un-deferrable.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 2 is complete.** The dashboard at `/` exercises every kernel feature end-to-end (text input → Scale → table → audio → .scl I/O); the integration test guards the seed-scale round-trip in CI; the syntonic-comma theory page demonstrates the >1-page architecture with KaTeX + inline widgets.

**Ready for Phase 3 (Visualization + Mobile Audio Audit):**
- Lattice / tonality-diamond / scale-on-keyboard widgets will mount on src/index.md (or new `src/pages/lattice.md`) and consume `Scale` directly — no kernel changes needed for VIZ-01..03.
- AUDIO-06 (mobile Safari audio audit) requires running the existing dashboard on iPhone Safari — no implementation work, just an audit + documentation pass on autoplay/AudioContext quirks. The cell-owned synth pattern is mobile-safe by construction (lazy AudioContext + invalidation.then(dispose)).
- IO-03 (.kbm parser/serializer) follows the same shape as the existing Plan 04 .scl parser — IO-03 will live in src/lib/kbm.ts with the same trust-boundary discipline (input cap, named referenceKey/referenceHz/middleNote fields per project convention).

**No blockers.**

---

_Phase: 02-math-kernel-composition-anchor-mvp_
_Completed: 2026-05-04_

## Self-Check: PASSED

Verified on disk:

- `src/index.md`: FOUND (modified — dashboard)
- `src/pages/syntonic-comma.md`: FOUND
- `src/__tests__/dashboard-seed.test.ts`: FOUND
- `observablehq.config.ts`: FOUND (pages registered)
- `.planning/phases/02-math-kernel-composition-anchor-mvp/02-07-SUMMARY.md`: FOUND (this file)
- `src/lib/pieces/`: NOT FOUND (D-01 enforcement)

Verified in git log:

- Commit `717e632` (Task 1 — dashboard): FOUND
- Commit `1b76ad0` (Task 2 — theory page + config): FOUND
- Commit `1f71386` (Task 3 — integration test): FOUND
- Commit `81475e4` (Rule 3 — prettier fix): FOUND

Verified by automated tests:

- `npm test -- --run`: 136/136 passing (was 131 — +5 dashboard-seed cases)
- `npm test -- --run src/__tests__/dashboard-seed.test.ts`: 5/5 passing
- `npm run ci`: exit 0 (lint:types + test + lint + format:check + build all green)
- `npm run build`: produces dist/index.html + dist/pages/syntonic-comma.html
- KaTeX CSS link present in dist/index.html: `grep -c "katex@0.16.45" dist/index.html` = 1
- KaTeX class names present in dist/pages/syntonic-comma.html: `grep -c "katex" dist/pages/syntonic-comma.html` = 4

Manual (handled by Checkpoints 1 and 2):

- Five ROADMAP Phase 2 success criteria — user-approved at Checkpoint 1
- KaTeX rendering + inline widgets + cross-page navigation — user-approved at Checkpoint 2
