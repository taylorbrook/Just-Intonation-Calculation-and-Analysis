---
phase: 09-scala-archive-browser
plan: 01
subsystem: data
tags: [scala, scl, framework-data-loader, archive, search, tempered-flag, vitest]

# Dependency graph
requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: parseScl / parseScala / Interval BigInt kernel (the .scl parser this index WRAPS)
  - phase: 06-exact-rational-ji-harmonic-generators
    provides: SURF-06 tempered-vs-exact serialization discipline (cents-of-record vs n/d), the ratioPerLine/centsPerLine convention
provides:
  - "Vendored curated Huygens-Fokker Scala archive snapshot (195 .scl) committed for offline/self-host builds"
  - "Build-time searchable JSON archive index (scala-archive.json) via the repo's first *.json.ts Framework data loader"
  - "src/lib/scala-archive.ts: ArchiveEntry, buildArchiveIndex, isTemperedScl, searchArchive, DEFAULT_SEARCH_CAP"
  - "Per-entry build-time tempered flag (D-A4 / SURF-06) — tempered degrees emit cents, exact degrees emit n/d"
affects: [09-02 archive browser widget, 09-03, LIB-02, LIB-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Framework *.json.ts data loader: thin node:fs shell, all logic in a unit-tested src/lib module (D-A5)"
    - "Build-time tempered-flag provenance computed from the .-cents-marker, identical to the runtime parser's D-19 rule"

key-files:
  created:
    - src/lib/scala-archive.ts
    - src/lib/__tests__/scala-archive.test.ts
    - src/data/scala-archive.json.ts
    - src/data/scala-archive/ (195 .scl + README.md)
  modified:
    - src/lib/INVENTORY.md

key-decisions:
  - "D-A1: vendored a CURATED 195-file subset, not the full ~5400-file archive — keeps the index sub-MB and the browse list responsive"
  - "D-A4: tempered is computed AT BUILD TIME (true iff any pitch line has a `.`), identical to parsePitchToken's D-19 cents rule so the build flag can never disagree with the runtime parser"
  - "D-A5: all logic in the unit-tested scala-archive.ts; the .json.ts loader is a thin node:fs shell (no vitest.config change needed)"

patterns-established:
  - "Framework data loader: src/data/X.json.ts resolves its sibling dir via import.meta.url, reads with node:fs, delegates to a tested src/lib module, writes JSON to stdout"
  - "Archive degree serialization: leading 1/1 dropped; tempered -> cents.toFixed(4), exact -> ${n}/${d} (writeScl formatRatio precedent), so degrees round-trip through parseScala on the client"

requirements-completed: [LIB-01]

# Metrics
duration: ~12min (continuation session; excludes the pre-checkpoint Task 1 download/curation)
completed: 2026-06-14
---

# Phase 9 Plan 01: Scala Archive + Build-Time Index Summary

**Vendored a curated 195-file Huygens-Fokker Scala snapshot and built the repo's first Framework `*.json.ts` data loader that parses every `.scl` into one searchable JSON index, with a build-time `tempered` flag (76 tempered / 119 exact) that keeps SURF-06 cents-vs-ratio provenance correct.**

## Performance

- **Duration:** ~12 min (continuation session — Task 1 download/curation happened in the prior pre-checkpoint session)
- **Completed:** 2026-06-14
- **Tasks:** 2 (Task 1 committed post-approval, Task 2 TDD)
- **Files modified:** 5 (3 created code/test, 1 INVENTORY, 1 vendored dir of 196 files)

## Accomplishments

- Committed the human-approved vendored archive: 195 curated `.scl` files + provenance README (Manuel Op de Coul / Huygens-Fokker, freely distributable, upstream SHA-256 recorded).
- Built `src/lib/scala-archive.ts` — the build-time-pure index module that WRAPS the existing hardened `parseScl` (never reimplements it): `buildArchiveIndex`, `isTemperedScl`, `searchArchive`, `ArchiveEntry`, `DEFAULT_SEARCH_CAP`.
- Build-time tempered flag (D-A4 / SURF-06): true iff any pitch line carries a `.`; tempered entries serialize `degrees` as cents (`cents.toFixed(4)`), exact entries as `${n}/${d}` — so a cents-defined scale is never laundered as ratios downstream. Verified across the index: 76 tempered / 119 exact of 195.
- `src/data/scala-archive.json.ts` — the repo's first Framework data loader (thin `node:fs` shell, no network), emitting one JSON index with all 5 D-A3 keys.
- 18 Vitest cases covering tempered detection (F01 false, F02/F03 true), index shape + degrees round-trip through `parseScala`, malformed-file skip (T-09-01), and search filter + cap + stable order.

## Task Commits

1. **Task 1: Vendor curated Scala archive snapshot + provenance** — `cc4c132` (feat) — committed after the blocking-human provenance/licensing checkpoint was approved.
2. **Task 2: Build-time index module + data loader (tempered flag, search/filter)** — `e243e31` (feat) — index module + loader + 18 tests + INVENTORY, committed atomically.

_Note: Task 2 is a `tdd` task; the module + tests were written together and verified green before the single atomic commit (no separate red commit was preserved since the module file is required for the test imports to resolve)._

## Files Created/Modified

- `src/data/scala-archive/` — 195 vendored `.scl` files + `README.md` provenance (Huygens-Fokker, freely distributable).
- `src/lib/scala-archive.ts` — `ArchiveEntry`, `buildArchiveIndex` (wraps `parseScl`, skips malformed + `console.warn`), `isTemperedScl` (D-A4), `searchArchive` (filter + cap + stable order), `DEFAULT_SEARCH_CAP = 50`.
- `src/data/scala-archive.json.ts` — first `*.json.ts` Framework data loader; `readdirSync` + `readFileSync` the vendored dir, `buildArchiveIndex`, `process.stdout.write(JSON.stringify(...))`. No network.
- `src/lib/__tests__/scala-archive.test.ts` — 18 unit tests.
- `src/lib/INVENTORY.md` — Phase 9 entries for the four symbols + the loader.

## Decisions Made

None beyond the plan's pre-made D-A1..D-A5 — followed the plan as specified. The vendored snapshot was curated/approved in the prior session; this session committed it verbatim and implemented Task 2 to the plan's behavior/acceptance criteria exactly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Loader verify command runs under Framework's `tsx` interpreter, not bare `node`**
- **Found during:** Task 2 (verification)
- **Issue:** The plan's automated verify ran `node src/data/scala-archive.json.ts`, which throws `ERR_MODULE_NOT_FOUND` because bare Node cannot resolve the `.js`-extension import (`../lib/scala-archive.js`) to the `.ts` source. This is a verification-command mismatch, not a loader bug.
- **Fix:** Confirmed Observable Framework runs `.ts` data loaders via `tsx/esm` (`@observablehq/framework/dist/config.js:37` does `await import("tsx/esm")`). Ran the loader via `node_modules/.bin/tsx`, which is byte-identical to how `observable build` executes it — emits valid JSON containing `"tempered"` and all 5 D-A3 keys. No source change to the loader was needed for correctness; the loader's `.js`-import convention is mandatory per CLAUDE.md.
- **Files modified:** none (loader logic unchanged)
- **Verification:** `tsx src/data/scala-archive.json.ts | grep '"tempered"'` → PASS; 195 entries, keys `degrees,filename,name,pitchCount,tempered`.

**2. [Rule 3 - Blocking] Reworded a loader doc-comment so the no-network grep acceptance check passes literally**
- **Found during:** Task 2 (verification)
- **Issue:** The plan's acceptance criterion `grep -E "fetch|http" src/data/scala-archive.json.ts` must return nothing. My initial header comment contained the words "fetch" and "http" (in the phrase "no `fetch`, no `http`"), tripping the literal grep even though there is no network code.
- **Fix:** Reworded the comment to "NO network access at build time … the only I/O here is local `node:fs`" — no `fetch`/`http` substrings remain.
- **Files modified:** src/data/scala-archive.json.ts (comment only)
- **Verification:** `grep -E "fetch|http" src/data/scala-archive.json.ts` → returns nothing (PASS).

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking/verification). Both are verification-harness reconciliations, not logic changes.
**Impact on plan:** No scope creep. The loader behaves exactly as the plan specifies; the deviations only reconcile how the plan's verify commands are executed against how Framework actually runs the loader.

## Issues Encountered

- The plan's `node src/data/scala-archive.json.ts` smoke test cannot run under plain `node` due to `.js`→`.ts` ESM resolution — resolved by running through `tsx` (Framework's documented interpreter). See Deviation 1.

## Verification Results

- `npm run test -- scala-archive` → 18/18 pass.
- `npx tsc --noEmit` → clean (exit 0).
- `tsx src/data/scala-archive.json.ts` → valid JSON, 195 entries, contains `"tempered"` + all D-A3 keys (76 tempered / 119 exact).
- `grep -E "fetch|http" src/data/scala-archive.json.ts` → nothing (no network).
- `eslint` + `prettier --check` on the new files → clean.

## User Setup Required

None — no external service configuration required. The archive is committed; the build is offline.

## Next Phase Readiness

- LIB-01 foundation is complete: `scala-archive.json` is buildable offline and `searchArchive` / `DEFAULT_SEARCH_CAP` are ready for the 09-02 browser widget to consume via `FileAttachment("scala-archive.json").json()` (lazy-loaded on first archive-method selection).
- The per-entry `tempered` flag + cents/ratio `degrees` are wired so the widget's Send-to path can hand `entry.degrees.join("\n")` straight to `parseScala` without re-parsing raw `.scl`.

## Self-Check: PASSED

- src/lib/scala-archive.ts — FOUND
- src/lib/__tests__/scala-archive.test.ts — FOUND
- src/data/scala-archive.json.ts — FOUND
- src/data/scala-archive/README.md — FOUND
- Commit cc4c132 — FOUND
- Commit e243e31 — FOUND

---
*Phase: 09-scala-archive-browser*
*Completed: 2026-06-14*
