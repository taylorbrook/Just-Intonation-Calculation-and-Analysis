---
phase: 05-generate-surface-live-integration-foundation
plan: 01
subsystem: state
tags: [localStorage, CustomEvent, scale-store, boot-precedence, tdd, vitest, happy-dom]

# Dependency graph
requires:
  - phase: 04-analysis-sharing
    provides: "src/lib/url.ts MAX_SCALE_TEXT_BYTES (8 KB cap) + encodeScaleToHash/decodeHashToScale codec — reused, not redeclared (D-09)"
  - phase: 9mn-dark-mode (theme toggle)
    provides: "src/theme/theme-prefs.ts — the namespaced-key + event-name + try/catch-never-throws pattern this store is the carve-out twin of (D-08)"
provides:
  - "src/state/scale-store.ts — pure additive shared-scale store (constants, readSharedScale, writeSharedScale, resolveInitialScaleText)"
  - "writeSharedScale + CustomEvent('tuning-systems:scale-changed') — the SOLE SYNC-01/02 live-update write transport"
  - "readSharedScale — SYNC-03 validated persistence read (shape + 8 KB cap + never-throws)"
  - "resolveInitialScaleText — SYNC-04 boot-precedence helper; empty-store boots byte-identical to v1.0"
  - "R1 boot-equivalence gate (src/__tests__/scale-store-boot.test.ts) — the wave-0 phase gate, GREEN"
  - "vitest glob extended to collect src/state/ tests"
affects: [05-02 generate-producer-send, 05-03 consumer-opt-in-dashboard-analysis]

# Tech tracking
tech-stack:
  added: []  # Phase 5 installs ZERO packages (T-05-SC accepted)
  patterns:
    - "Pure shared-state store under src/state/ mirroring src/theme/theme-prefs.ts (namespaced localStorage key + window CustomEvent + try/catch-never-throws read)"
    - "Boot-precedence as a single pure unit-testable helper: hashDecoded ?? stored?.text ?? seedText"
    - "Per-file @vitest-environment split: node-env validation spec + happy-dom CustomEvent spec (directive is file-scoped)"

key-files:
  created:
    - src/state/scale-store.ts
    - src/state/__tests__/scale-store.test.ts
    - src/state/__tests__/scale-store-event.test.ts
    - src/__tests__/scale-store-boot.test.ts
  modified:
    - vitest.config.ts
    - src/lib/INVENTORY.md

key-decisions:
  - "D-08: store lives at src/state/scale-store.ts (new src/state/ dir), carve-out twin of theme-prefs.ts"
  - "D-09: reuse MAX_SCALE_TEXT_BYTES from src/lib/url.ts — no second serialization, no bare 8192 literal"
  - "D-12 / SYNC-04: empty-store boot byte-equivalence locked behind the R1 gate, RED→GREEN before any consumer edit"
  - "RESEARCH A2: writeSharedScale dispatches the CustomEvent even when persistence throws (best-effort live-update in private browsing)"
  - "Split the spec into node-env + happy-dom files because Vitest's @vitest-environment directive is file-scoped"

patterns-established:
  - "src/state/ subsystem for additive cross-page shared state (one-way: only the producer writes)"
  - "8 KB UTF-8 cap enforced on BOTH read and write (defense-in-depth, single source of truth shared with url.ts)"

requirements-completed: [SYNC-01, SYNC-02, SYNC-03, SYNC-04]

# Metrics
duration: ~9min
completed: 2026-06-08
---

# Phase 5 Plan 01: Generate Surface & Live Integration Foundation — Shared-Scale Store Summary

**Pure additive `src/state/scale-store.ts` (localStorage + CustomEvent twin of theme-prefs) plus the RED→GREEN R1 boot-equivalence gate that locks the empty-store-boots-byte-identically-to-v1.0 guarantee — the wave-0 gate for the whole phase.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-06-08T23:10Z (approx)
- **Completed:** 2026-06-08T23:14Z (approx)
- **Tasks:** 2 (both TDD: RED→GREEN)
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments
- `resolveInitialScaleText(hashDecoded, stored, seedText)` precedence helper — `hashDecoded ?? stored?.text ?? seedText`; empty store (`stored === null`) boots byte-identical to v1.0's `hash ?? seed` (SYNC-04). R1 gate GREEN.
- `readSharedScale()` — validated persistence read mirroring `readThemePrefs`: globalThis.localStorage guard, JSON.parse, rejects array/primitive/non-object, rejects non-string `text`, 8 KB UTF-8 cap on read, try/catch → null; never throws; no DOM (SYNC-03 / T-05-01/02/03).
- `writeSharedScale(text, source?)` — 8 KB cap → silent no-op; best-effort persist `{text,source?}` JSON (silent on throw) + best-effort `CustomEvent('tuning-systems:scale-changed')` on `window`; event fires even when persistence throws (RESEARCH A2). The SOLE SYNC-01/02 write transport.
- Vitest glob extended to collect `src/state/**` tests (without it the store spec silently never runs and the gate is void).
- INVENTORY.md Phase 5 section documenting the four symbols + the one-way-data-flow rule.
- Full suite green: 389/389 (was 192 in v1.0; +29 new store/gate tests). `lint:types`, `lint`, `prettier --check` all green.

## Task Commits

Each task was committed atomically (TDD: test → feat):

1. **Task 1 RED: R1 boot-equivalence gate** - `0dadd9a` (test)
2. **Task 1 GREEN: scale-store precedence helper** - `14d91ca` (feat)
3. **Task 2 RED: scale-store read/write/validate spec + glob** - `f5baf69` (test)
4. **Task 2 GREEN: scale-store read/write + CustomEvent broadcast** - `8cf9b34` (feat)

_Note: STATE.md / ROADMAP.md are intentionally NOT touched — the orchestrator owns those writes post-wave (worktree mode)._

## Files Created/Modified
- `src/state/scale-store.ts` - Pure additive shared-scale store: constants (`SCALE_STORAGE_KEY`, `SCALE_CHANGED_EVENT`), `SharedScale` interface, `resolveInitialScaleText`, `readSharedScale`, `writeSharedScale`.
- `src/state/__tests__/scale-store.test.ts` - Node-env spec: constant guards, all six read null-return branches (absent / malformed / array / primitive / non-string text / oversized), throwing-localStorage, write cap + setItem-throws + write→read round-trip.
- `src/state/__tests__/scale-store-event.test.ts` - happy-dom spec: exactly-one CustomEvent with `detail` deep-equal `{text,source}`; fires-when-persistence-throws (A2); no-event-on-oversize.
- `src/__tests__/scale-store-boot.test.ts` - R1 gate: empty-store byte-identical boot + C-3 hash>store>seed precedence + never-throws.
- `vitest.config.ts` - `test.include` extended with `src/state/**/__tests__/**/*.test.ts` and `src/state/**/*.test.ts`.
- `src/lib/INVENTORY.md` - Phase 5 section naming the four exported symbols + one-way-flow rule.

## Decisions Made
- Followed plan as specified. Store at `src/state/scale-store.ts` (D-08), cap reused from `url.ts` (D-09), A2 event-fires-on-persist-failure documented in a code comment.
- **Split the store spec into two files** (`scale-store.test.ts` node env + `scale-store-event.test.ts` happy-dom) rather than one file with two blocks. Vitest's `@vitest-environment` directive is file-scoped (confirmed against the codebase convention — every happy-dom test file declares it on line 1), so a single file cannot host both a node-env and a happy-dom block. The plan's acceptance criteria (CustomEvent asserted via happy-dom; new glob collects `src/state/`) are satisfied either way; the split is the idiomatic-to-this-repo realization.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Symlinked worktree node_modules to the main checkout**
- **Found during:** Setup (before Task 1)
- **Issue:** The git worktree had no `node_modules`, so `npx vitest` / `npm run lint:types` could not resolve vitest, happy-dom, fraction.js, etc. This is NOT a package install (no new dependency fetched) — it reuses the already-installed, already-audited deps from the main checkout.
- **Fix:** `ln -s "<main-repo>/node_modules" node_modules` in the worktree. `node_modules` is git-ignored, so the symlink is never committed.
- **Files modified:** none tracked (symlink only).
- **Verification:** `node_modules/.bin/vitest` + `node_modules/happy-dom` resolve; full suite runs.
- **Committed in:** n/a (untracked symlink).

**2. [Rule 3 - Blocking] Removed a literal `@vitest-environment` token from a prose comment**
- **Found during:** Task 2 (RED run)
- **Issue:** A descriptive comment in `scale-store.test.ts` (node env) contained the literal substring `@vitest-environment` mid-sentence. Vitest's environment-directive scanner regex matches that token anywhere in a comment and tried to load the next word (`directive`) as an environment module → `Failed to load url .../directive` and the node-env file collected zero tests.
- **Fix:** Reworded the comment to "the environment directive is file-scoped in Vitest" (removed the literal token) in both spec files.
- **Files modified:** src/state/__tests__/scale-store.test.ts, src/state/__tests__/scale-store-event.test.ts
- **Verification:** Both files collect (23 tests); RED then GREEN.
- **Committed in:** f5baf69 (Task 2 RED commit).

**3. [Rule 3 - Blocking] Prettier reflow on one test assertion**
- **Found during:** Task 2 (GREEN, pre-commit `format:check`)
- **Issue:** One `expect(setItem).toHaveBeenCalledWith(...)` call wrapped differently than Prettier's style; `ci` runs `format:check`.
- **Fix:** `prettier --write src/state/__tests__/scale-store.test.ts` (single line reflow, line 143).
- **Files modified:** src/state/__tests__/scale-store.test.ts
- **Verification:** `prettier --check` on all changed files clean.
- **Committed in:** 8cf9b34 (Task 2 GREEN commit).

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking, environment/tooling). None changed product behavior or scope.
**Impact on plan:** All three were environment/tooling unblocks required to run the planned tests. No scope creep, no behavior change.

## Issues Encountered
None beyond the auto-fixed blocking items above. The Vitest directive-scanner gotcha (deviation 2) is worth remembering: never write the literal `@vitest-environment` in a non-directive comment.

## User Setup Required
None - no external service configuration required. Phase 5 installs zero packages (T-05-SC accepted).

## Known Stubs
None. The store is complete and fully exercised; the placeholder/identity-scale wiring referenced in RESEARCH belongs to Plan 02 (the producer), not this plan.

## Threat Flags
None. All new surface (the localStorage read boundary, the 8 KB cap, the private-browsing throw path) is covered by the plan's `<threat_model>` (T-05-01/02/03) and mitigated. No new endpoints, auth paths, or render paths introduced (T-05-04: this plan adds no render path).

## Next Phase Readiness
- **Plan 02 (producer):** `writeSharedScale(text, source?)` is the ready-made "Send to Dashboard/Analysis" transport. The Generate page is the only intended writer.
- **Plan 03 (consumers):** `readSharedScale()` (boot read) + `SCALE_CHANGED_EVENT` (live subscribe) + `resolveInitialScaleText(hash, store, seed)` (boot precedence) are ready. Plan 03 is gated behind the now-GREEN R1 gate — consumer edits to `src/index.md` / `src/pages/analysis.md` may proceed.
- No blockers.

## Self-Check: PASSED
- `src/state/scale-store.ts` — FOUND
- `src/state/__tests__/scale-store.test.ts` — FOUND
- `src/state/__tests__/scale-store-event.test.ts` — FOUND
- `src/__tests__/scale-store-boot.test.ts` — FOUND
- `vitest.config.ts` (src/state glob) — FOUND
- `src/lib/INVENTORY.md` (Phase 5 section) — FOUND
- Commits `0dadd9a`, `14d91ca`, `f5baf69`, `8cf9b34` — all present in git log
- RED-before-GREEN ordering verified for both tasks

## TDD Gate Compliance
Both TDD tasks show the mandatory `test(...)` → `feat(...)` ordering in git history (Task 1: `0dadd9a`→`14d91ca`; Task 2: `f5baf69`→`8cf9b34`). RED was confirmed failing before each GREEN (Task 1: import-missing failure; Task 2: 21 fail / 2 constant-guard pass). No REFACTOR commits were needed.

---
*Phase: 05-generate-surface-live-integration-foundation*
*Completed: 2026-06-08*
