---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
plan: 04
subsystem: ui
tags: [observable-framework, sonic-weave, generate-page, send-to, patch-package, optgroup-picker]

# Dependency graph
requires:
  - phase: 07-02
    provides: generate-rank2 + generate-welltemp widget factories (rank-2 regular + well-temperament)
  - phase: 07-03
    provides: generate-fokker + generate-sonicweave widget factories (Fokker block + free-text SonicWeave adapter)
  - phase: 06
    provides: Phase-6 mounted-widget picker pattern (instantiate-once cells, params/preview swap, Send-to serialization)
provides:
  - All four Phase-7 widgets registered in the Generate page picker and user-reachable (GEN-06..09)
  - Five-optgroup method picker (rank-2 + well-temp under Regular; Fokker under Advanced; new SonicWeave optgroup)
  - isTempered()-gated Send-to serialization (exact-JI → ratio-per-line; tempered → cents-per-line)
  - Bare local resolution of sonic-weave@0.14.1 via patch-package (no jsDelivr +esm dependency)
affects: [generate-page, send-to-flow, future phase-7 polish, sonic-weave consumers]

# Tech tracking
tech-stack:
  added: [patch-package@^8.0.1]
  patterns:
    - "Additive picker registration (extend METHOD_FAMILIES + add swap branches; never modify existing method cells)"
    - "isTempered()-gated Send-to serialization (cents-per-line vs ratio-per-line chosen at call time from the live widget)"
    - "patch-package postinstall to add a missing `default` export condition so Framework serves the real local build"

key-files:
  created:
    - patches/sonic-weave+0.14.1.patch
  modified:
    - src/pages/generate.md
    - src/styles.css
    - src/lib/sonicweave.ts
    - package.json
    - package-lock.json
    - vitest.config.ts

key-decisions:
  - "Import sonic-weave BARE (not via npm:) so Framework serves the real /_node local build instead of jsDelivr's broken +esm stub"
  - "Persist the sonic-weave exports-map fix as a patch-package patch + postinstall hook (reproducible across installs, no vendoring)"
  - "Add a fifth dedicated SonicWeave optgroup rather than nesting free-text under an existing family (matches the method's distinct authoring model)"

patterns-established:
  - "Additive Generate-page registration: extend METHOD_FAMILIES + add params/preview swap branches + Send-to ternary branches, leaving every existing method cell and the empty-state path byte-identical (SYNC-04)"
  - "Send-to serialization gated by the widget's live isTempered(): tempered scales serialize as cents-per-line (never ratios), so no float-derived ratio is laundered as exact JI (T-07-15)"

requirements-completed: [GEN-06, GEN-07, GEN-08, GEN-09]

# Metrics
duration: ~40min (incl. checkpoint-driven Rule-3 fixes)
completed: 2026-06-11
---

# Phase 7 Plan 04: Generate-Page Integration Summary

**All four Phase-7 widgets (rank-2 regular temperament, well-temperament, Fokker periodicity block, free-text SonicWeave) registered into the Generate page's five-optgroup picker with isTempered()-gated Send-to serialization, plus a bare-local resolution of sonic-weave@0.14.1 via patch-package after the jsDelivr +esm bundle proved broken.**

## Performance

- **Duration:** ~40 min (single auto task + two Rule-3 blocking fixes surfaced at the live checkpoint)
- **Started:** 2026-06-11T20:51:08-07:00 (first task commit)
- **Completed:** 2026-06-11T21:30:01-07:00 (last fix commit) + human-verify approval
- **Tasks:** 1 auto task + 1 human-verify checkpoint (approved)
- **Files modified:** 6 (1 created)

## Accomplishments
- Registered all four Phase-7 widgets in `src/pages/generate.md`: imports, instantiate-once cells, params-host + preview-host swap branches, and per-widget `*ScaleText()` Send-to helpers — strictly additive, no existing method path touched.
- Extended the native `<optgroup>` picker to five families: rank-2 + well-temperament under "Regular / equal temperament", Fokker under "Advanced / algorithmic", and a new dedicated "SonicWeave" optgroup for free-text.
- Wired isTempered()-gated Send-to: Fokker (exact JI) and pure rank-2/free-text serialize ratio-per-line; well-temperament and tempered rank-2/free-text serialize cents-per-line (`.cents.toFixed(4)`), reading each widget live at call time.
- Added four `@import` lines to `src/styles.css` so the widgets render with house styling.
- Resolved sonic-weave@0.14.1 to load from the real local build, replacing the broken `npm:` (jsDelivr +esm) path — discovered only at the live checkpoint.

## Task Commits

Each task was committed atomically:

1. **Task 1: Register the four Phase-7 widgets in generate.md + wire CSS imports** — `9c4958c` (feat)
2. **Fix-a: Persist sonic-weave export-map patch via patch-package** — `de381b9` (chore, Rule 3)
3. **Fix-b: Resolve sonic-weave locally (revert npm: → bare import)** — `ff3b038` (fix, Rule 3)

**Plan metadata:** this commit (docs: complete plan — SUMMARY)

## Files Created/Modified
- `src/pages/generate.md` — Four widget imports + instantiate-once cells; rank2/welltemp/fokker/sonicweave params-host and preview-host swap branches; `rank2ScaleText`/`welltempScaleText`/`fokkerScaleText`/`sonicweaveScaleText` helpers; extended `currentScaleText` and `sendCurrentScaleTo` ternaries; new "SonicWeave" optgroup in `METHOD_FAMILIES`.
- `src/styles.css` — Four `@import` lines for the new widget CSS files.
- `src/lib/sonicweave.ts` — Import reverted from `npm:sonic-weave` to bare `sonic-weave` (with an inline rationale comment block) so Framework serves the real local build.
- `patches/sonic-weave+0.14.1.patch` — Adds a `default` export condition (`→ ./dist/index.js`, placed last) to sonic-weave's `exports[.]` map so bare Node/Framework resolution succeeds.
- `package.json` — Added `patch-package@^8.0.1` devDependency and `postinstall: patch-package`.
- `package-lock.json` — Lockfile updates for patch-package.
- `vitest.config.ts` — Removed the now-unneeded `npm:sonic-weave` alias (Vitest resolves the bare import natively); replaced with an explanatory note.

## Decisions Made
- **Bare import over `npm:` for sonic-weave** — Framework routes `npm:`-prefixed imports through jsDelivr's `+esm` bundle; for sonic-weave@0.14.1 that bundle is a Rollup-failure stub that only throws. A bare `sonic-weave` import makes Framework serve the complete local build from `/_node/sonic-weave@0.14.1/index.js`.
- **patch-package over vendoring** — The exports-map gap (`default` condition missing) is fixed reproducibly with a committed patch + `postinstall: patch-package`, so every fresh `npm install` re-applies it without forking or copying source.
- **Dedicated fifth SonicWeave optgroup** — Free-text authoring is a distinct model from the Regular/Advanced families, so it gets its own optgroup rather than being nested.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] sonic-weave@0.14.1 cannot be imported via `npm:` (broken jsDelivr +esm bundle)**
- **Found during:** Task 2 (live human-verify checkpoint) — the page errored with "does not provide an export named 'evaluateSource'".
- **Issue:** Framework's `npm:sonic-weave` path resolves to jsDelivr's `/_npm/sonic-weave@0.14.1/_esm.js`, which is a Rollup-failure stub that only `throw`s. The free-text widget could not evaluate any SonicWeave source in the live page.
- **Fix:** Reverted the import in `src/lib/sonicweave.ts` from `npm:sonic-weave` to bare `sonic-weave`, so Framework serves the real local build from `/_node/sonic-weave@0.14.1/index.js`. Removed the corresponding `npm:sonic-weave` alias from `vitest.config.ts` (no longer needed; Vitest resolves the bare import natively).
- **Files modified:** src/lib/sonicweave.ts, vitest.config.ts
- **Verification:** Live page evaluates `cps([1,3,5,7], 2)` and previews the Hexany; garbage input shows the raw error while preserving the prior preview; `npx vitest run` 554/554 green; build/types/lint green.
- **Committed in:** ff3b038

**2. [Rule 3 - Blocking] Bare sonic-weave resolution failed with ERR_PACKAGE_PATH_NOT_EXPORTED**
- **Found during:** Task 2 (resolving the import above).
- **Issue:** sonic-weave@0.14.1's `exports[.]` map ships only `types` and `import` conditions. Bare resolution under some conditions resolved no entry, throwing `ERR_PACKAGE_PATH_NOT_EXPORTED`, so the bare import alone did not load the package.
- **Fix:** Added a patch-package patch (`patches/sonic-weave+0.14.1.patch`) that adds a `default` condition (`→ ./dist/index.js`, placed last so it does not shadow `import`) to the exports map, plus `patch-package@^8.0.1` devDependency and a `postinstall: patch-package` hook so the patch re-applies on every install.
- **Files modified:** patches/sonic-weave+0.14.1.patch, package.json, package-lock.json
- **Verification:** Bare `import { evaluateSource } from "sonic-weave"` resolves; Framework serves `/_node/sonic-weave@0.14.1/index.js`; full suite + build + types + lint green; live free-text widget evaluates correctly.
- **Committed in:** de381b9

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking). Both were necessary to make the free-text SonicWeave widget functional in the live Framework page; the upstream packaging defect (broken jsDelivr +esm bundle) was undiscoverable by happy-dom component tests and surfaced only at the live human-verify checkpoint. No scope creep — the registration of all four widgets matches the plan exactly.

## Issues Encountered
- The sonic-weave packaging defect (broken `+esm` bundle + incomplete exports map) was the entire reason the checkpoint did not immediately pass; resolved via the two Rule-3 fixes above. All four widgets then verified correctly on the live dev server.

## User Setup Required
None — no external service configuration required. (Note: `patch-package` runs automatically via the `postinstall` hook on `npm install`; no manual step needed.)

## Next Phase Readiness
- GEN-06..09 are fully reachable from the Generate UI: five optgroups, all four widgets mount/audition/Send-to correctly, tempered vs exact-JI serialization gated by `isTempered()`.
- Empty-store boot equivalence (SYNC-04) confirmed unaffected — registration is strictly additive and the no-scale-sent boot was human-verified (step 8) and remains covered by the full vitest suite.
- No blockers. sonic-weave now loads from the real local build; if a future upstream sonic-weave release ships a complete `exports` map (`default`/proper conditions), the patch can be dropped.

## Self-Check: PASSED

- `src/pages/generate.md` contains all four widget registrations (`generateRank2`/`generateWelltemp`/`generateFokker`/`generateSonicweave` — import + instantiate cell each) and all four `*ScaleText()` Send-to helpers (definition + `currentScaleText` ternary + `sendCurrentScaleTo` ternary), plus the `"SonicWeave"` optgroup. ✓
- `src/styles.css` contains the four `@import` lines (generate-rank2/welltemp/fokker/sonicweave .css). ✓
- `npx vitest run` → 42 files, 554/554 tests passed. ✓
- Task commits `9c4958c`, `de381b9`, `ff3b038` all present in `git log`. ✓
- `patches/sonic-weave+0.14.1.patch` exists; `package.json` has `postinstall: patch-package`. ✓

---
*Phase: 07-sonicweave-adapter-tempered-lattice-free-text*
*Completed: 2026-06-11*
