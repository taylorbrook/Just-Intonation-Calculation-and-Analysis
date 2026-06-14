---
phase: 09-scala-archive-browser
plan: 03
subsystem: ui
tags: [observable-framework, scala-archive, generate-surface, scale-store, file-attachment, send-to]

# Dependency graph
requires:
  - phase: 09-scala-archive-browser
    provides: "09-01 build-time scala-archive.json index (tempered-flag detection); 09-02 generateArchive widget exposing getScale()/isTempered()"
  - phase: 05-generate-surface
    provides: "Generate-surface picker + shared transform strip + Send-to (writeSharedScale + #s=) machinery"
provides:
  - "Scala-archive method wired into the live Generate surface (METHOD_FAMILIES optgroup + import + single archiveWidget instantiation)"
  - "End-to-end LIB-01 (browse/search) + LIB-02 (load/audition) + LIB-03 (Send-to via the shared store + #s= path) on /pages/generate"
  - "SURF-06 correctness for archive scales: tempered → cents-per-line, exact-JI → ratio-per-line (T-09-07 mitigated)"
affects: [phase-10, archive, generate-surface, send-to]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Persistent-widget mount (Pattern-2): single archiveWidget instance preserves closure-local search/selection across picker swaps"
    - "Lazy FileAttachment thunk: loadEntries: () => FileAttachment(...).json() defers index load until the widget first needs it"
    - "CONDITIONAL-tempered serializer: archiveScaleText() branches on isTempered() (rank-2/sonicweave/cs precedent)"

key-files:
  created:
    - ".planning/phases/09-scala-archive-browser/09-03-SUMMARY.md"
  modified:
    - "src/pages/generate.md"

key-decisions:
  - "D-C1: instantiate generateArchive ONCE with a lazy FileAttachment loadEntries thunk (persistent-widget + light page boot)"
  - "D-C2: archive is a top-level 'Scala archive' optgroup with id 'archive' — it is a load source, not a generation method"
  - "D-C3: archiveScaleText() branches on isTempered() — centsPerLine (tempered) vs ratioPerLine (exact JI) — SURF-06 correctness"
  - "D-C4: no archive-specific Send-to code — activeWidgetScale() archive branch feeds the existing strip + sendCurrentScaleTo unchanged (the LIB-03 'free' win)"

patterns-established:
  - "Additive method wiring: a new generator method plugs into the Generate surface via ~8 purely-additive insertion points modeled on the cs branch, with no existing branch modified"

requirements-completed: [LIB-01, LIB-02, LIB-03]

# Metrics
duration: 7min
completed: 2026-06-14
---

# Phase 9 Plan 03: Wire Scala Archive into the Generate Surface Summary

**The Scala-archive method is live on /pages/generate — browse/search/load/audition a bundled archive scale and Send it to Dashboard/Analysis via the existing store + #s= path, with tempered scales serialized cents-per-line and exact-JI scales ratio-per-line (delivers LIB-01/02/03 + closes parked TEMP-09).**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-14T19:44:40Z (Task 1 commit)
- **Completed:** 2026-06-14T19:51:29Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 1 (src/pages/generate.md)

## Accomplishments
- Wired the archive method into the Generate surface across all ~8 insertion points (METHOD_FAMILIES optgroup, import, single `archiveWidget` instantiation, `archiveScaleText()` serializer, `currentScaleText` ternary, paramsHost swap, previewHost caption, `activeWidgetScale()` + `rawMethodScaleText()`), each modeled on the `cs` branch — purely additive, no existing method branch touched.
- Delivered the three Phase-9 success criteria end-to-end on the live page: browse + search (LIB-01), load + audition (LIB-02), and Send-to via the shared store + `#s=` (LIB-03), reusing — not duplicating — the Phase-5/6/7/8 surface (`writeSharedScale` still has exactly ONE call site).
- Confirmed SURF-06 correctness for archive scales: `archiveScaleText()` + `activeWidgetScale()` branch on `archiveWidget.isTempered()`, so a tempered (cents-defined) archive scale is sent cents-per-line and never laundered as ratios (T-09-07 mitigated).
- Human-verify APPROVED — all 6 browser steps pass (browse, search, JI ratio table + audition, tempered cents table + badge + audition, Send-to-Dashboard as CENTS for tempered, Send-to-Analysis as ratios for JI).

## Task Commits

1. **Task 1: Wire the archive method into generate.md (the ~8 spots) + verify build** - `34b8322` (feat)
2. **Task 2: Human-verify live Generate-surface archive flow** - checkpoint (no commit; user APPROVED)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `src/pages/generate.md` - Archive method wired across the ~8 additive insertion points (import, METHOD_FAMILIES optgroup, single lazy-loaded `archiveWidget`, conditional `archiveScaleText()` serializer, picker/preview/Send-to branches) — 63 insertions, 2 deletions.
- `.planning/phases/09-scala-archive-browser/09-03-SUMMARY.md` - This summary.

## Decisions Made
- Followed plan decisions D-C1 through D-C4 as specified (single lazy-loaded instantiation, top-level "Scala archive" optgroup, isTempered()-conditional serializer, no archive-specific Send-to code).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected the FileAttachment path to the page-relative loader output**
- **Found during:** Task 1 (instantiation cell — D-C1)
- **Issue:** The plan's literal `FileAttachment("scala-archive.json")` resolves relative to the page (`src/pages/generate.md`), but the 09-01 data loader emits to `/data/scala-archive.json` under `root: "src"` — so the bare filename would not resolve and the build would fail to find the attachment.
- **Fix:** Used the page-relative path `FileAttachment("../data/scala-archive.json").json()` in the `loadEntries` thunk, with an explanatory comment documenting the root/page-relative resolution rationale.
- **Files modified:** src/pages/generate.md
- **Verification:** `npm run build` succeeds and validates 140 links; the widget loads the index at runtime.
- **Committed in:** `34b8322` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The path fix was required for the build to resolve the bundled archive index. No scope creep — purely the correct Framework FileAttachment resolution. All other edits matched the plan exactly.

## Issues Encountered
None — Task 1 build/tsc/tests were green at execution; the human-verify checkpoint returned "approved" on the first pass with no reported issues.

## Automated Verification (re-run at finalization)
- `npm run build` — succeeds; 140 links validated; the archive method compiles into the page.
- `npx tsc --noEmit` — clean (exit 0); the imported `generate-archive` component type-checks with no errors.
- `npm test` — 50 test files, 659 tests passing, including `generate-archive.test.ts` (8 tests).
- Wiring greps confirm: `generateArchive` import present, one `archiveWidget` instantiation with the `FileAttachment("../data/scala-archive.json").json()` thunk, the `"archive"` option in METHOD_FAMILIES, `archiveScaleText()` branching on `isTempered()`, and `method === "archive"` branches in the currentScaleText ternary / paramsHost / previewHost / activeWidgetScale() / rawMethodScaleText().
- `writeSharedScale(` has exactly ONE call site (inside `sendCurrentScaleTo`) — no new Send-to code path (LIB-03 reuse confirmed).

## Human Verification
- **Type:** checkpoint:human-verify (gate="blocking")
- **Outcome:** APPROVED by user.
- **Steps confirmed:** (1) archive browser mounts with search box + capped list + "showing X of Y" caption; (2) search narrows the list; (3) a JI scale shows a Ratio-column table + ⏵⏵ Play and auditions; (4) a tempered scale shows a cents-only table + "tempered" badge and auditions; (5) tempered scale → Send to Dashboard opens live via `#s=` shown as CENTS (not laundered ratios — SURF-06); (6) JI scale → Send to Analysis opens live via `#s=` shown as ratios.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 9's three success criteria (LIB-01/02/03) are TRUE on the live page; parked TEMP-09 is closed.
- This is the final plan (3 of 3) of Phase 9. The orchestrator owns phase-level completion and verification — NOT touched here.

## Self-Check: PASSED

- FOUND: `.planning/phases/09-scala-archive-browser/09-03-SUMMARY.md`
- FOUND: commit `34b8322` (Task 1 wiring) in git history

---
*Phase: 09-scala-archive-browser*
*Completed: 2026-06-14*
