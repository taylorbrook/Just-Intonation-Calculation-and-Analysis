---
phase: 09-scala-archive-browser
fixed_at: 2026-06-14T18:35:00Z
review_path: .planning/phases/09-scala-archive-browser/09-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 9: Code Review Fix Report

**Fixed at:** 2026-06-14T18:35:00Z
**Source review:** .planning/phases/09-scala-archive-browser/09-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (5 Warning + 2 Info; `--fix --all`)
- Fixed this run: 2 (IN-01, IN-02)
- Already fixed in prior run: 5 (WR-01..WR-05 — verified still resolved, no new commits)
- Skipped: 0

This is a follow-up `--fix --all` pass. The 5 Warning findings were already fixed and
committed in a prior `--fix` run (bb0b444, f89af5f, e0487e8). All five were re-verified
against the current code and remain resolved — no duplicate commits were made. The new
work was the 2 Info findings.

Verification (run in the isolated worktree against the post-fix tree):
- `tsc --noEmit`: clean (exit 0, no diagnostics).
- `vitest run` for both phase suites (`src/lib/__tests__/scala-archive.test.ts`,
  `src/components/__tests__/generate-archive.test.ts`): 26/26 pass.

## Fixed Issues

### IN-01: `fullMatchCount` duplicates `searchArchive`'s predicate (caption can drift)

**Files modified:** `src/lib/scala-archive.ts`, `src/components/generate-archive.ts`
**Commit:** e36223b
**Applied fix:** Introduced a single private predicate `entryMatchesNeedle(entry, needle)`
in `scala-archive.ts` and routed both `searchArchive` (the capped filter) and a new
exported `countArchiveMatches(entries, term)` (uncapped total) through it. In
`generate-archive.ts`, `fullMatchCount` now delegates to `countArchiveMatches` and the
duplicated `term.trim().toLowerCase()` / `${name}\n${filename}` / `.includes(needle)` loop
was removed. The cap and the "Showing X of Y" total now derive from one source of truth,
so the caption can no longer silently drift from the rendered list if the haystack ever
changes. Verified by tsc clean + 26/26 tests (the existing "typing a matching term narrows
the list ... yields 0-of-Y" test exercises the caption path).

### IN-02: Search debounce timer has no teardown

**Files modified:** `src/components/generate-archive.ts`
**Commit:** 47f3d07
**Applied fix:** The review's preferred resolution was conditional: add a
`clearTimeout(debounceTimer)` teardown **if a dispose path exists**, otherwise document the
dangling timer as intentional/benign. The widget exposes no dispose path (it follows the
Pattern-2 DOM-factory contract of `generateCs`, which also has none) and Observable
Framework persists the element across picker swaps (detached, not destroyed), so the
documentation branch applies. Added a comment at the debounce wiring explaining that a
single trailing `setTimeout` can at worst fire one `renderList` against the detached
element, which only mutates that element's own closure-local DOM (list / caption / status)
— no global state, no AudioContext, no cross-element reference — and is therefore benign.
The comment records where to add `clearTimeout(debounceTimer)` if a `dispose()` path is
ever introduced. Documentation-only change; no logic altered.

## Verified-Already-Fixed (no action taken)

These 5 Warnings were fixed in the prior `--fix` run and confirmed still resolved in the
current code. No new commits were created for them.

### WR-01: `isTemperedScl` cents-detection diverges from the kernel parser

**File:** `src/lib/scala-archive.ts:74-83`
**Reason:** Already fixed (prior run, commit bb0b444). `isTemperedScl` now takes only the
first whitespace-bounded token per pitch line (`firstWs = line.search(/\s/)` → `tok`)
before testing for `.`, mirroring `parsePitchToken`. A trailing F09 dotted note no longer
false-flags exact JI as tempered.

### WR-02: `isTemperedScl` assumes exactly two header lines, ignoring blank lines

**File:** `src/lib/scala-archive.ts:70-73`
**Reason:** Already fixed (prior run, commit bb0b444). Pitch-line extraction now applies the
same `slice(2).map(trim).filter(l !== "" && !l.startsWith("!"))` discipline as `parseScl`,
so the header offset stays aligned even with interleaved blank lines.

### WR-03: Data loader's `readFileSync` is uncaught

**File:** `src/data/scala-archive.json.ts:45-56`
**Reason:** Already fixed (prior run, commit f89af5f). Per-file reads are wrapped in
try/catch inside a `flatMap`; an unreadable file is skipped + warned instead of failing the
build.

### WR-04: Data loader's `readdirSync` is uncaught

**File:** `src/data/scala-archive.json.ts:26-37`
**Reason:** Already fixed (prior run, commit f89af5f). `readdirSync` is guarded; a
missing/renamed archive dir emits an empty index (`names = []`) and a warning, keeping the
rest of the site building.

### WR-05: Stale selection after search

**File:** `src/components/generate-archive.ts` (selectEntry / renderList / clearSelection / entryMatchesTerm)
**Reason:** Already fixed (prior run, commit e0487e8). A `selectedFilename` key persists the
live selection; `renderList` reconciles it before building rows (`clearSelection()` when the
term excludes the selected entry), and `makeRow` re-applies `aria-selected`/`--selected` to
the surviving row so the highlight tracks `currentScale` across re-renders.

---

_Fixed: 2026-06-14T18:35:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
