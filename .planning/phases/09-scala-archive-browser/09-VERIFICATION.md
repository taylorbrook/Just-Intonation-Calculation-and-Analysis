---
phase: 09-scala-archive-browser
verified: 2026-06-14T13:10:00Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 9: Scala Archive Browser — Verification Report

**Phase Goal:** A self-contained capability to browse, search, and load named scales from the bundled Scala archive directly into the Generate surface — auditioning a loaded scale and sending it onward like any generated scale — delivering parked TEMP-09.
**Verified:** 2026-06-14T13:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can browse and search named scales from the bundled Scala archive within the Generate surface (LIB-01) | VERIFIED | `METHOD_FAMILIES` in `generate.md:108-115` includes `{ label: "Scala archive", options: [{ id: "archive", ... }] }`. `archiveWidget` is instantiated at line 334 and mounted in paramsHost at line 586. `generateArchive` widget renders a search `<input type="search">` + `<ul role="listbox">` + "Showing X of Y" caption via `renderList`. `searchArchive` (capped at `DEFAULT_SEARCH_CAP=50`, debounced 150 ms) confirmed in `generate-archive.ts:210,266`. 8/8 widget tests green including search-narrows and non-match-yields-0. |
| 2 | User can load a selected archive scale into the preview and audition it (LIB-02) | VERIFIED | Row-click handler in `generate-archive.ts:197-199` calls `selectEntry`, which builds `new Scale(parseScala(entry.degrees.join("\n")))`, then renders `scaleTable(scale, baseHz, { tempered: entry.tempered })` and `playScale(scale, synth, { baseHz })` (lines 258-259). Tests assert JI-select renders a Ratio-column table and tempered-select renders the cents/badge table + `isTempered()===true`. Human-verify checkpoint APPROVED confirming audition works in-browser. |
| 3 | User can send a loaded archive scale to Dashboard / Analysis exactly like any generated scale via the same store + #s= path (LIB-03) | VERIFIED | `activeWidgetScale()` at `generate.md:797` includes `else if (method === "archive") { scale = archiveWidget.getScale(); tempered = archiveWidget.isTempered(); }`. `archiveScaleText()` at lines 465-469 branches `archiveWidget.isTempered() ? centsPerLine(scale) : ratioPerLine(scale)`. The method appears in `rawMethodScaleText()` ternary (line 940-941) and `currentScaleText` ternary (line 491-492). `writeSharedScale` has exactly ONE call site (line 973 inside `sendCurrentScaleTo`) — no new Send-to code. Human-verify confirmed tempered→Dashboard as CENTS and JI→Analysis as ratios. |
| 4 | The build produces a single searchable JSON archive index from the vendored .scl snapshot with no network access at build time | VERIFIED | `src/data/scala-archive.json.ts` uses only `node:fs` (`readdirSync`/`readFileSync`). `grep -E "fetch\|http" src/data/scala-archive.json.ts` returns nothing. 195 vendored `.scl` files committed in `src/data/scala-archive/`. `observable build` succeeds with 140 links validated. |
| 5 | Each archive entry carries a build-time `tempered` flag that is true iff any pitch line in the source .scl contains a `.` | VERIFIED | `isTemperedScl` in `scala-archive.ts:54-69` scans non-comment pitch lines for `.`. 18/18 tests pass including `false` for F01-simple-7limit.scl and `true` for F02-cents-only.scl + F03-mixed-ratio-cents.scl. Build produces 76 tempered / 119 exact of 195 entries (confirmed by review). |
| 6 | The index module can filter archive entries by a search term over name + filename, with a stable, capped result set | VERIFIED | `searchArchive` in `scala-archive.ts:132-142`: case-insensitive substring, result never exceeds `cap`, empty term returns first `cap` entries in input order. Tests assert filter narrows, cap is respected, and order is stable. |
| 7 | The archive browser widget exposes `getScale()` and `isTempered()` so a loaded scale flows through the shared transform strip and Send-to unchanged | VERIFIED | `generate-archive.ts:273-274`: `root.getScale = () => currentScale; root.isTempered = () => currentTempered;`. Interface `GenerateArchiveElement` exported matching the `GenerateCsElement` contract. The 09-03 wiring confirms no new Send-to code path. |
| 8 | Tempered archive scales serialize cents-per-line on Send-to; exact-JI archive scales serialize ratio-per-line (SURF-06) | VERIFIED | `archiveScaleText()` at `generate.md:465-469` branches on `archiveWidget.isTempered()` using existing `centsPerLine`/`ratioPerLine` helpers. `activeWidgetScale()` carries `tempered = archiveWidget.isTempered()` into the transform strip. Human-verify confirmed SURF-06 correctness for tempered→cents and JI→ratios on Send-to. |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/data/scala-archive/` | 195 vendored `.scl` files + README.md | VERIFIED | `ls` shows 196 entries (195 `.scl` + `README.md`). README names Huygens-Fokker source, freely-distributable status, curation date and count. Committed at `cc4c132`. |
| `src/lib/scala-archive.ts` | `ArchiveEntry`, `buildArchiveIndex`, `isTemperedScl`, `searchArchive`, `DEFAULT_SEARCH_CAP` | VERIFIED | All 5 symbols exported. 143 substantive lines. Wraps `parseScl`, never re-implements. Committed at `e243e31`. |
| `src/data/scala-archive.json.ts` | Framework data loader: reads vendored dir at build time, emits JSON to stdout, no network | VERIFIED | 31 lines; `readdirSync`/`readFileSync` only; delegates to `buildArchiveIndex`; `process.stdout.write(JSON.stringify(entries))`. No fetch/http. |
| `src/lib/__tests__/scala-archive.test.ts` | Unit tests: tempered-flag detection, index shape, search filter + cap | VERIFIED | 18 tests, all passing. Covers F01/F02/F03 tempered detection, malformed-file skip, degrees round-trip, search filter + cap + stable order. |
| `src/components/generate-archive.ts` | Pattern-2 factory: search box + capped list + select→scaleTable+playScale; `getScale()`/`isTempered()` | VERIFIED | 295 substantive lines. Exports `generateArchive`, `GenerateArchiveOpts`, `GenerateArchiveElement`. All Pattern-2 constraints satisfied: closure-local state, no module-level state, no AudioContext at construction. |
| `src/components/__tests__/generate-archive.test.ts` | happy-dom tests: list renders, search filters + caps, select loads scale, tempered entry flags `isTempered()` + cents table | VERIFIED | 8 tests, all passing. Covers list render, search narrow + non-match, JI-select (Ratio header, no badge, `isTempered()` false), tempered-select (cents/badge, `isTempered()` true), ⏵⏵ Play arpeggio. |
| `src/pages/generate.md` | Archive method wired into METHOD_FAMILIES, import, single archiveWidget instantiation, `archiveScaleText()`, `currentScaleText` ternary, paramsHost swap, previewHost caption, `activeWidgetScale()` + `rawMethodScaleText()` | VERIFIED | All 8 insertion points confirmed by grep. `generateArchive` imported (line 21). `archiveWidget` instantiated once at line 334 with `FileAttachment("../data/scala-archive.json").json()` thunk. All method branches present. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/data/scala-archive.json.ts` | `src/lib/scala-archive.ts` | `import { buildArchiveIndex }` | WIRED | Line 17: `import { buildArchiveIndex } from "../lib/scala-archive.js"`. Called at line 29. |
| `src/lib/scala-archive.ts` | `src/lib/scala.ts` | `import { parseScl }` | WIRED | Line 21: `import { parseScl } from "./scala.js"`. Called inside `buildArchiveIndex` at line 104. |
| `src/components/generate-archive.ts` | `src/lib/scala-archive.ts` | `import searchArchive + ArchiveEntry + DEFAULT_SEARCH_CAP` | WIRED | Lines 40-41: `import type { ArchiveEntry }` and `import { searchArchive, DEFAULT_SEARCH_CAP }`. All three used in widget body. |
| `src/components/generate-archive.ts` | `FileAttachment("../data/scala-archive.json")` | lazy `loadEntries` thunk injected from page | WIRED | `opts.loadEntries` thunk called in constructor at line 278. Page injects `() => FileAttachment("../data/scala-archive.json").json()` at `generate.md:336`. |
| `src/components/generate-archive.ts` | `scale-table.ts` + `play-scale.ts` | `scaleTable` + `playScale` in `selectEntry` | WIRED | Lines 44-45: imports. Lines 258-259: both called in `selectEntry` with `tempered: entry.tempered` and `{ baseHz }`. |
| `src/pages/generate.md (archive branch)` | `scale-store.ts` `writeSharedScale` + `#s=` | via existing `sendCurrentScaleTo` (single call site) | WIRED | `activeWidgetScale()` line 797 carries archive scale + tempered flag. `writeSharedScale` called once at line 973 inside `sendCurrentScaleTo`. No new call site added. |
| `src/pages/generate.md archiveWidget` | `FileAttachment("../data/scala-archive.json")` | lazy load in `loadEntries` thunk | WIRED | `generate.md:336`: `loadEntries: () => FileAttachment("../data/scala-archive.json").json()`. Path-fix deviation documented in 09-03-SUMMARY (page-relative vs root-relative). |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `generate-archive.ts` | `entries: ArchiveEntry[]` | `opts.loadEntries()` → `FileAttachment("../data/scala-archive.json").json()` → build-time loader that reads 195 `.scl` files | Yes — 195 real `.scl` entries at build time, fetched lazily by the page thunk at runtime | FLOWING |
| `generate-archive.ts` | `currentScale: Scale` | `selectEntry` → `new Scale(parseScala(entry.degrees.join("\n")))` from `entry.degrees` derived from real `parseScl` at build time | Yes — parsed from pre-validated build-time degrees | FLOWING |
| `generate.md` archive branch | `archiveWidget.getScale()` / `.isTempered()` | `archiveWidget` closure state set by `selectEntry` | Yes — live widget state returned at call time by `sendCurrentScaleTo` re-sync | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `searchArchive` returns filtered results | `npm run test -- scala-archive` | 18/18 pass | PASS |
| Widget renders list, search, select | `npm run test -- generate-archive` | 8/8 pass | PASS |
| Full suite (no regressions) | `npm test` | 659/659 pass, 50 files | PASS |
| TypeScript clean | `npx tsc --noEmit` | exit 0, no output | PASS |
| No innerHTML in widget | `grep -c innerHTML src/components/generate-archive.ts` | 0 | PASS |
| No network access in loader | `grep -E "fetch\|http" src/data/scala-archive.json.ts` | (no output) | PASS |
| writeSharedScale has exactly one call site | `grep -n "writeSharedScale" src/pages/generate.md` | 2 lines: import (line 25) + single call (line 973) | PASS |
| observable build | Documented in 09-03-SUMMARY: "npm run build — succeeds; 140 links validated" | 140 links validated | PASS (documented) |

---

### Probe Execution

No `scripts/*/tests/probe-*.sh` files declared or found for this phase. Step 7c skipped.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LIB-01 | 09-01, 09-02, 09-03 | User can browse and search named scales from the bundled Scala archive within the Generate surface | SATISFIED | `generateArchive` widget: debounced search + capped list + "showing X of Y". Wired into `METHOD_FAMILIES` as "Scala archive" optgroup. 8/8 widget tests + 18/18 index tests green. |
| LIB-02 | 09-02, 09-03 | User can load a selected archive scale into the preview and audition it | SATISFIED | `selectEntry` renders `scaleTable` + `playScale` on row-click. `isTempered()` drives cents-only display. Human-verify confirmed audition in-browser. |
| LIB-03 | 09-03 | User can send a loaded archive scale to the Dashboard / Analysis like any generated scale | SATISFIED | `archiveWidget.getScale()`/`isTempered()` routed through `activeWidgetScale()` into `sendCurrentScaleTo`. Single `writeSharedScale` call site unchanged. `archiveScaleText()` SURF-06 conditional. Human-verify confirmed Send-to for both tempered (cents) and JI (ratios). |

All three phase-9 requirements verified SATISFIED. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/scala-archive.ts` | 66 | `if (line.includes(".")) return true` scans the full line, not first token only | Warning | Identified by code review WR-01: a Scala-legal trailing dotted comment (e.g. `9/8  cf. v1.5`) would false-flag a JI scale as tempered. Not triggered by the current 195-file snapshot (0 such lines). Advisory robustness gap, not a current correctness failure. |
| `src/lib/scala-archive.ts` | 63 | `nonComment.slice(2)` assumes exactly two header lines | Warning | Code review WR-02: a blank-line-interleaved header could misalign the pitch scan. Not present in the current snapshot. Advisory. |
| `src/data/scala-archive.json.ts` | 21-26 | `readdirSync` and `readFileSync` are uncaught at module top level | Warning | Code review WR-03/WR-04: an unreadable file or missing directory would throw and fail the entire `observable build`. Mitigation exists for `parseScl` errors (inside `buildArchiveIndex`), but not for the read layer. Not a current correctness failure (all 195 files committed and readable). Advisory. |
| `src/components/generate-archive.ts` | 209-220 | Stale selection after search: selected row highlight is destroyed when list re-renders but `currentScale`/`currentTempered` persist | Warning | Code review WR-05: after a search narrows the list, the highlighted row disappears while the loaded scale/table persist — soft state inconsistency. Non-crashing; Send-to serializes the correct (still-loaded) scale. Advisory. |

No `TBD`, `FIXME`, or `XXX` debt markers found in any phase-9 files. No `return null` / `return {}` / `return []` hollow stubs. No placeholder text in rendered output paths. All dynamic text in `generate-archive.ts` uses `createElement` + `textContent`.

---

### Human Verification Required

The two blocking-human checkpoints were approved by the user in this session:

1. **Provenance/licensing checkpoint (09-01 Task 1)** — the vendored 195-file Huygens-Fokker snapshot was reviewed and approved before commit. Provenance recorded in `src/data/scala-archive/README.md`.

2. **Live UI checkpoint (09-03 Task 2)** — the user approved all 6 browser-verification steps:
   - Archive browser mounts with search box + capped list + "showing X of Y" caption
   - Search narrows the list
   - A JI scale loads into a Ratio-column table + ⏵⏵ Play and auditions
   - A tempered scale loads into a cents-only table with "tempered" badge and auditions
   - Tempered scale → Send to Dashboard opens live via `#s=` shown as CENTS (SURF-06)
   - JI scale → Send to Analysis opens live via `#s=` shown as ratios

No further human verification required.

---

### Gaps Summary

No gaps. All 8 must-haves verified, all 3 requirements satisfied, both human-verify checkpoints approved, 659/659 tests green, tsc clean, build succeeds.

The four code-review warnings (WR-01 through WR-05) are advisory robustness gaps about behavior beyond the current 195-file snapshot. None affect the correctness of the phase goal on the committed snapshot. They are tracked in `09-REVIEW.md` for follow-up if/when the archive is re-vendored or expanded.

---

_Verified: 2026-06-14T13:10:00Z_
_Verifier: Claude (gsd-verifier)_
