---
phase: 09-scala-archive-browser
plan: 02
subsystem: components
tags: [scala, archive, browser, search, debounce, tempered-flag, audition, vitest, happy-dom, pattern-2]

# Dependency graph
requires:
  - phase: 09-scala-archive-browser
    provides: "09-01 LIB-01 — searchArchive / DEFAULT_SEARCH_CAP / ArchiveEntry index + scala-archive.json data loader"
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: "parseScala (degrees → Interval[]) + Scale constructor"
  - phase: 06-exact-rational-ji-harmonic-generators
    provides: "SURF-06 tempered-vs-exact discipline — the per-entry tempered flag drives cents-only display + isTempered()"
provides:
  - "src/components/generate-archive.ts — generateArchive(synth, opts?) Pattern-2 browser/search/audition widget with getScale()/isTempered()"
  - "Debounced (~150ms) capped search over the bundled archive with a truncation-aware 'showing X of Y' caption (D-B2)"
  - "Tempered-aware preview: per-entry build-time flag drives scaleTable cents-only display AND isTempered() (SURF-06)"
  - "Lazy-load contract via opts.loadEntries thunk — testable without FileAttachment (D-B1)"
affects: [09-03 Send-to wiring, LIB-02, LIB-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern-2 widget contract reused verbatim from generateCs: closure-local state, getScale()/isTempered(), createElement+textContent discipline"
    - "Lazy-load via an injectable async thunk (opts.loadEntries) so a FileAttachment-backed page wiring stays unit-testable with an in-memory array"
    - "Truncation-aware 'X of Y' caption: full match count computed locally (uncapped) alongside the capped searchArchive result"

key-files:
  created:
    - src/components/generate-archive.ts
    - src/components/__tests__/generate-archive.test.ts
  modified:
    - src/lib/INVENTORY.md

key-decisions:
  - "Followed the plan's pre-made D-B1..D-B4 exactly; no new decisions required"

patterns-established:
  - "Archive widget is a drop-in generator widget: same (synth, opts?) => HTMLElement signature + getScale()/isTempered() as every Phase 6/7/8 generator, so the 09-03 Send-to hand-off is pure plumbing"

requirements-completed: [LIB-01, LIB-02]

# Metrics
duration: ~4min
completed: 2026-06-14
---

# Phase 9 Plan 02: Scala Archive Browser Widget Summary

**Built `generateArchive(synth, opts?)` — the Pattern-2 browse/search/audition widget that debounced-searches the bundled 195-entry archive (capped at 50 with a truncation-aware "showing X of Y" caption) and, on selection, loads the chosen scale into a tempered-aware `scaleTable` + ⏵⏵ Play, exposing `getScale()` / `isTempered()` so the 09-03 Send-to wiring is pure plumbing.**

## Performance

- **Duration:** ~4 min
- **Completed:** 2026-06-14
- **Tasks:** 2 (both `auto` + `tdd`)
- **Files modified:** 3 (1 widget, 1 test, 1 INVENTORY)

## Accomplishments

- `src/components/generate-archive.ts` — the LIB-01 browse surface + LIB-02 audition path as a single Pattern-2 factory, structurally mirroring `generateCs` (closure-local state, no module-level state, `getScale()` / `isTempered()`).
- **D-B1 lazy load:** entries arrive via an `opts.loadEntries` async thunk kicked off in the constructor; a "Loading archive…" status shows until it resolves. The page passes `() => FileAttachment("scala-archive.json").json()`; the default thunk resolves to `[]` so the component is unit-testable WITHOUT FileAttachment.
- **D-B2 capped debounced search:** ~150 ms debounce on the `<input type="search">` before re-filtering via `searchArchive`; never more than `DEFAULT_SEARCH_CAP` (50) rows; a "showing X of Y" caption where Y is the full match count computed locally (uncapped) so the user can see when results are truncated.
- **D-B3 tempered-aware preview:** on row-select, `new Scale(parseScala(entry.degrees.join("\n")))` → `scaleTable(scale, baseHz, { tempered: entry.tempered })` + `playScale(scale, synth, { baseHz })`; the per-entry build-time `tempered` flag (09-01 D-A4) drives BOTH the cents-only table AND `isTempered()` (SURF-06). A defensive `parseScala` error on select is caught → status region + prior preview preserved (T-09-05 / D-16).
- **D-B4 / T-09-03 (XSS):** every dynamic value (archive `name`/`filename`, "N notes" meta, tempered/JI marker, error text) renders via `createElement` + `textContent`; the `grep -c innerHTML` gate is 0.
- 8 happy-dom tests covering: list renders one selectable row per entry + the caption, debounced search narrows (1-of-1) and a non-match yields 0-of-0, JI-select renders a Ratio table (no badge) + `isTempered()` false + 8 rows, tempered-select renders the cents/badge table + `isTempered()` true + 13 rows, ⏵⏵ Play arpeggiates the selected scale (LIB-02), and the default empty-load path doesn't crash.
- INVENTORY updated with the `generateArchive` component under a new Phase 9 components heading.

## Task Commits

1. **Task 1: Archive-browser widget — search + capped list + select→preview→audition** — `7a98b06` (feat) — the `generateArchive` Pattern-2 factory; verified `tsc --noEmit` clean + `innerHTML` gate 0 + prettier/eslint clean before commit.
2. **Task 2: Widget tests (happy-dom) + INVENTORY append** — `e17342d` (test) — 8 happy-dom tests + the INVENTORY entry; verified `npm run test -- generate-archive` (8/8) + `tsc --noEmit` + prettier/eslint clean.

## TDD Gate Compliance

Both `tdd` tasks produced the expected commits — `feat(09-02)` (`7a98b06`) and `test(09-02)` (`e17342d`) — but in **feat-then-test** order rather than the canonical RED-before-GREEN order. This is the documented 09-01 precedent: the plan deliberately structures Task 1 as the widget and Task 2 as the test file, and the test file's imports (`generateArchive`, `GenerateArchiveElement`, `ArchiveEntry`) cannot resolve until the widget module exists, so a separate pre-implementation RED commit was not preserved. The tests were authored against the plan's `<behavior>` / `<acceptance_criteria>` and verified green (8/8) before the Task 2 commit. No behavior was added without a corresponding test.

## Files Created/Modified

- `src/components/generate-archive.ts` — `generateArchive`, `GenerateArchiveOpts`, `GenerateArchiveElement`. Pattern-2 factory; lazy `loadEntries` thunk (D-B1); debounced capped `searchArchive` + "X of Y" caption (D-B2); tempered-aware `scaleTable` + `playScale` preview from the per-entry flag (D-B3 / SURF-06); all dynamic text via `createElement` + `textContent` (D-B4 / T-09-03); parse-error-on-select caught + prior preview preserved (T-09-05).
- `src/components/__tests__/generate-archive.test.ts` — 8 happy-dom tests with in-memory `ArchiveEntry[]` fixtures (2 JI + 1 tempered) and `makeStubSynth()` (no real AudioContext).
- `src/lib/INVENTORY.md` — Phase 9 components heading + the `generateArchive` entry.

## Decisions Made

None beyond the plan's pre-made D-B1..D-B4 — followed the plan as specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworded a doc-comment so the `innerHTML` grep gate passes literally**
- **Found during:** Task 1 (verification)
- **Issue:** The plan's acceptance gate `grep -c innerHTML src/components/generate-archive.ts` must be 0. The header doc-comment described the D-B4 discipline using the literal word `innerHTML` ("never `innerHTML`"), tripping the literal grep even though there is no unsafe-HTML sink anywhere in the code. This is the same verification-harness mismatch 09-01 hit with its `fetch`/`http` no-network grep.
- **Fix:** Reworded the comment to "the unsafe-HTML sink is never used with dynamic content — the grep gate keeps the count at 0" — no `innerHTML` substring remains. No logic change.
- **Files modified:** src/components/generate-archive.ts (comment only)
- **Verification:** `grep -c innerHTML src/components/generate-archive.ts` → 0 (PASS).

**2. [Rule 1 - Lint] Removed an unnecessary type assertion in the test file**
- **Found during:** Task 2 (verification)
- **Issue:** `Array.from(el.querySelectorAll(".generate-archive__row-btn")) as HTMLButtonElement[]` tripped `@typescript-eslint/no-unnecessary-type-assertion` (the project's eslint config errors on redundant assertions).
- **Fix:** Switched to the generic `querySelectorAll<HTMLButtonElement>(...)` form, which types the result without an assertion.
- **Files modified:** src/components/__tests__/generate-archive.test.ts
- **Verification:** `eslint` on both new files → exit 0; tests still 8/8 green.

---

**Total deviations:** 2 auto-fixed (1 Rule 3 verification-harness reconciliation, 1 Rule 1 lint cleanup on the new test file). No scope creep; the widget behaves exactly as the plan specifies.

## Issues Encountered

- None blocking. The two deviations above are routine verification/lint reconciliations on the new files.

## Verification Results

- `npm run test -- generate-archive` → 8/8 pass.
- `npm run test` (full suite) → 659/659 pass across 50 files (no regressions).
- `npx tsc --noEmit` → clean (exit 0).
- `grep -c innerHTML src/components/generate-archive.ts` → 0 (D-B4 / T-09-03).
- `src/lib/INVENTORY.md` contains a `generateArchive` entry under the Phase 9 heading.
- `prettier --check` + `eslint` on both new files → clean.

## User Setup Required

None — no external service configuration. The archive JSON is built offline (09-01); the widget is wired into a page in 09-03.

## Next Phase Readiness

- LIB-01 + LIB-02 are complete: the archive-browser widget browses/searches/auditions and exposes `getScale()` / `isTempered()` exactly like every other generator widget.
- 09-03 (LIB-03 Send-to wiring) is pure plumbing: instantiate `generateArchive(synth, { loadEntries: () => FileAttachment("scala-archive.json").json() })` in `generate.md` and route its `getScale()` / `isTempered()` through the shared transform strip + Send-to, identical to the existing generator widgets. The tempered flag flows through unchanged so a cents-defined archive scale serializes cents-per-line (SURF-06), never laundered as ratios.

## Self-Check: PASSED

- src/components/generate-archive.ts — FOUND
- src/components/__tests__/generate-archive.test.ts — FOUND
- Commit 7a98b06 — FOUND
- Commit e17342d — FOUND

---
*Phase: 09-scala-archive-browser*
*Completed: 2026-06-14*
