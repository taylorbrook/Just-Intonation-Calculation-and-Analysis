---
phase: 09-scala-archive-browser
fixed_at: 2026-06-14T13:33:00Z
review_path: .planning/phases/09-scala-archive-browser/09-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 9: Code Review Fix Report

**Fixed at:** 2026-06-14T13:33:00Z
**Source review:** .planning/phases/09-scala-archive-browser/09-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (all Warnings; the 2 Info findings IN-01/IN-02 are out of the `critical_warning` scope)
- Fixed: 5
- Skipped: 0

All 5 in-scope warnings fixed. All 26 phase tests pass with the changes in place
(`src/lib/__tests__/scala-archive.test.ts` + `src/components/__tests__/generate-archive.test.ts`);
`tsc --noEmit` is clean for every modified file.

## Fixed Issues

### WR-01: `isTemperedScl` cents-detection diverges from the kernel parser (false-positive on trailing dotted note text)

**Files modified:** `src/lib/scala-archive.ts`
**Commit:** bb0b444
**Status:** fixed
**Applied fix:** Replaced the whole-line `line.includes(".")` scan with the kernel's
exact first-token rule from `parsePitchToken` (scala.ts:255-260): take only the first
whitespace-bounded token of each pitch line and test *that* for `.`. A Scala-legal
trailing dotted note (e.g. `9/8  M2 (cf. v1.5)`, an F09 form `parseScl` supports) now
parses as exact JI and is no longer false-flagged as tempered, so exact ratios are never
laundered as cents on Send-to. Also added a guard to skip monzo bra-ket (`[...>`) lines,
which are exact by construction. WR-01 and WR-02 were fixed together in one commit because
both are the same divergence in the same function — the fix makes `isTemperedScl` mirror
`parseScl`'s line discipline byte-for-byte, which is the reviewer's preferred single-source-of-truth
remedy.

### WR-02: `isTemperedScl` assumes exactly two header lines, ignoring blank lines that `parseScl` tolerates

**Files modified:** `src/lib/scala-archive.ts`
**Commit:** bb0b444
**Status:** fixed
**Applied fix:** Changed the pitch-line extraction to exactly mirror `parseScl` (scala.ts:113-116):
`nonComment.slice(2).map(trim).filter(l => l !== "" && !l.startsWith("!"))`. Previously
`isTemperedScl` collected blank lines into `nonComment` and used a fixed `slice(2)` offset,
which could misalign the header offset if a blank line appeared among the leading non-comment
lines. Now the two functions use identical line discipline, removing the whole divergence class.
(Same commit as WR-01.)

### WR-03: Data loader's `readFileSync` is uncaught — defeats the "one bad file never crashes the build" goal

**Files modified:** `src/data/scala-archive.json.ts`
**Commit:** f89af5f
**Status:** fixed
**Applied fix:** Wrapped the per-file read in a `flatMap` with try/catch (matching the
reviewer's suggested shape). An unreadable file (EACCES, non-UTF-8 decode error, or a file
deleted between `readdirSync` and `readFileSync`) is now skipped + `console.warn`ed instead
of throwing out of the loader and failing the whole static build — symmetric with the
parse-skip semantics inside `buildArchiveIndex` (T-09-01). WR-03 and WR-04 were committed
together because the `readdirSync` guard (WR-04) restructures the same read block the
`readFileSync` guard lives in; splitting them would have produced a non-compiling
intermediate state.

### WR-04: Data loader's `readdirSync` is uncaught — a missing/renamed archive directory crashes the whole site build

**Files modified:** `src/data/scala-archive.json.ts`
**Commit:** f89af5f
**Status:** fixed
**Applied fix:** Guarded `readdirSync(archiveDir)` in try/catch; on failure (missing,
renamed, or not-yet-vendored snapshot dir) it warns and falls back to an empty file list,
emitting `[]` as the index. The build stays green for every other page and the widget
degrades gracefully (it already shows "No archive scales available." for an empty list,
generate-archive.ts:214-216). (Same commit as WR-03.)

### WR-05: Stale selection after search — table/play/getScale persist while the highlighted row is destroyed

**Files modified:** `src/components/generate-archive.ts`
**Commit:** e0487e8
**Status:** fixed: requires human verification
**Applied fix:** Added a `selectedFilename` closure variable (the unique per-entry key) set
in `selectEntry`. `makeRow` now re-applies the `aria-selected="true"` + `--selected` marker
when a re-rendered row is the live selection, so the highlight tracks `currentScale` across
search re-renders. `renderList` reconciles before building rows: if the current search term
excludes the selected entry from the filter (via a shared `entryMatchesTerm` predicate that
matches `searchArchive`/`fullMatchCount`), it calls `clearSelection` to drop
`currentScale`/`currentTempered`/`selectedFilename` and reset the preview to the empty state
(removing the stale table + ⏵⏵ Play). A selection that still matches the term but is merely
pushed past the `DEFAULT_SEARCH_CAP` keeps its preview — it remains a valid result, just not
visibly listed.

**Human-verification note:** this is a state-handling change, so the syntax/test tiers
confirm structure but not the product decision. The deliberate semantics worth confirming:
(a) clear the preview when the selected scale is filtered OUT by the search predicate, vs
(b) keep the preview when the selection still matches but is truncated by the cap. All 26
existing tests pass (including the "non-matching term → 0-of-Y" test, which now exercises the
clearSelection path), but no new test asserts the cap-vs-filter distinction — confirm the
chosen behavior matches intent before the phase proceeds.

---

_Fixed: 2026-06-14T13:33:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
