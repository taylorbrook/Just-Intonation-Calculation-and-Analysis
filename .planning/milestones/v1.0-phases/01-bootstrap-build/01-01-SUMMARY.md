---
phase: 01-bootstrap-build
plan: 01
subsystem: infra
tags: [observable-framework, npm, scaffold, typescript-config]

requires: []
provides:
  - Observable Framework 1.13.4 scaffold at repo root with D-06 src/ layout
  - package.json with the full D-13 npm-script set and exact-pinned framework
  - Node 20 LTS pin via .nvmrc and engines.node
  - Working npm install / npm run build / npm run dev pipeline
  - Empty src/lib, src/components, src/data placeholders ready for Plans 02 and 03
affects: [01-02-tooling, 01-03-stack-install, 01-04-deploy, 02-kernel-mvp, 03-viz, 04-analysis]

tech-stack:
  added:
    - "@observablehq/framework@1.13.4 (exact pin)"
  patterns:
    - "src/ root with lib/, components/, data/ subfolders preserved via .gitkeep"
    - "TypeScript-only Framework config (observablehq.config.ts) — .ts preferred over .js"
    - "Exact-version pinning for the Framework (D-17); transitive deps locked via package-lock.json"

key-files:
  created:
    - /Users/taylorbrook/Dev/Tuning Systems/package.json
    - /Users/taylorbrook/Dev/Tuning Systems/package-lock.json
    - /Users/taylorbrook/Dev/Tuning Systems/observablehq.config.ts
    - /Users/taylorbrook/Dev/Tuning Systems/.nvmrc
    - /Users/taylorbrook/Dev/Tuning Systems/.gitignore
    - /Users/taylorbrook/Dev/Tuning Systems/README.md
    - /Users/taylorbrook/Dev/Tuning Systems/src/index.md
    - /Users/taylorbrook/Dev/Tuning Systems/src/.gitignore
    - /Users/taylorbrook/Dev/Tuning Systems/src/lib/.gitkeep
    - /Users/taylorbrook/Dev/Tuning Systems/src/components/.gitkeep
    - /Users/taylorbrook/Dev/Tuning Systems/src/data/.gitkeep
  modified: []

key-decisions:
  - "Honored D-17 by exact-pinning @observablehq/framework to 1.13.4 (no caret) — scaffold default of ^1.13.4 was rewritten."
  - "Honored D-13 verbatim — replaced scaffold's 5 scripts (clean/build/dev/deploy/observable) with the 9 D-13 scripts (no observable deploy per D-05)."
  - "Honored D-18 by setting engines.node to >=20 (scaffold default was >=18) and pinning .nvmrc to 20."
  - "Used observable Framework's TS config (.ts) rather than the scaffolded .js per the canonical Framework conventions in CLAUDE.md."
  - "Drove the interactive scaffold via /usr/bin/expect against @clack/prompts since the CLI does not accept piped stdin; ran in /tmp/tuning-temp and rsynced into the repo root excluding .git/node_modules/dist/lockfile."

patterns-established:
  - "Scaffold-via-temp-dir: repo root that already contains files (CLAUDE.md, .planning/) is bootstrapped by running `npx observable create` in /tmp and rsyncing the output back."
  - "After scaffold, package.json is rewritten in full from the plan's verbatim spec — never trust the scaffold's defaults."

requirements-completed:
  - BOOT-01

duration: ~16min
completed: 2026-05-03
---

# Phase 01 Plan 01: Bootstrap Build Summary

**Observable Framework 1.13.4 scaffolded at the repo root with the D-06 src/ layout, the full D-13 npm-script set, exact-pinned framework, Node 20 pin, and a verified npm install / npm run build / npm run dev pipeline — ready for the Plan 02 tooling layer.**

## Performance

- **Duration:** ~16 min
- **Started:** 2026-05-03T01:17:18Z
- **Completed:** 2026-05-03T01:33:26Z
- **Tasks:** 2
- **Files created:** 11 (8 in Task 1, 3 in Task 2)

## Accomplishments

- Framework v1.13.4 scaffold living at the repo root with the D-06 layout (src/lib, src/components, src/data) preserved via `.gitkeep`.
- `package.json` exact-pinned to `@observablehq/framework@1.13.4`, with all 9 D-13 scripts (`dev`, `build`, `lint:types`, `test`, `test:watch`, `lint`, `format`, `format:check`, `ci`) and `engines.node` set to `>=20`.
- `observablehq.config.ts` (TypeScript) declares `root: "src"` and an empty `pages` array.
- Three project-metadata files written per spec: `.nvmrc` (`20`), `.gitignore` (six D-19 entries), and `README.md` (D-20 minimal quickstart with PROJECT.md link).
- `npm install` cleanly produces `package-lock.json`; `npm run build` renders `dist/index.html`; `npm run dev` serves the placeholder page on `http://127.0.0.1:3000/` and accepts websocket connections.
- BOOT-01 satisfied: deployable static-site scaffold in place.

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Framework project at repo root** — `f7b8d4f` (feat)
2. **Task 2: Write .nvmrc, .gitignore, README.md** — `63fdcc5` (chore)

## Files Created/Modified

- `/Users/taylorbrook/Dev/Tuning Systems/package.json` — D-13 scripts, D-17 exact pin, D-18 engines.
- `/Users/taylorbrook/Dev/Tuning Systems/package-lock.json` — Locked transitive deps after `npm install`.
- `/Users/taylorbrook/Dev/Tuning Systems/observablehq.config.ts` — Framework config in TypeScript, `root: "src"`, `pages: []`.
- `/Users/taylorbrook/Dev/Tuning Systems/.nvmrc` — `20` (D-18).
- `/Users/taylorbrook/Dev/Tuning Systems/.gitignore` — Six D-19 lines.
- `/Users/taylorbrook/Dev/Tuning Systems/README.md` — D-20 minimal quickstart.
- `/Users/taylorbrook/Dev/Tuning Systems/src/index.md` — Plan-specified placeholder; replaced the scaffold's hero/Plot demo (Plan 03 will replace again with the Fraction.js demo).
- `/Users/taylorbrook/Dev/Tuning Systems/src/.gitignore` — Framework-managed cache ignore (`/.observablehq/cache/`); kept verbatim from scaffold per the D-19 note that Framework already manages this directory.
- `/Users/taylorbrook/Dev/Tuning Systems/src/lib/.gitkeep` — Empty placeholder so D-06 layout survives git.
- `/Users/taylorbrook/Dev/Tuning Systems/src/components/.gitkeep` — Same.
- `/Users/taylorbrook/Dev/Tuning Systems/src/data/.gitkeep` — Same.

### Scaffold defaults that were rewritten / pruned

- `package.json` scripts: scaffold wrote `clean / build / dev / deploy / observable`; replaced with the 9 D-13 scripts. The deprecated `deploy` script is intentionally absent per D-05.
- `package.json` dependencies: scaffold wrote `^1.13.4` plus `d3-dsv` and `d3-time-format`; replaced with exact `1.13.4` only. The d3 datacore deps are not needed in Plan 01 — they'll re-arrive transitively when actually used.
- `package.json` devDependencies: scaffold wrote `rimraf`; removed (the `clean` script was D-13'd out and there's no need for rimraf yet).
- `package.json` engines.node: scaffold wrote `>=18`; bumped to `>=20` (D-18).
- `observablehq.config.js` → `observablehq.config.ts`: TypeScript per CLAUDE.md Framework Conventions; minimal config (title, root, pages).
- `src/index.md`: scaffold wrote a hero + two-Plot dashboard; replaced with two-line bootstrapping placeholder (Plan 03 will write the real Fraction-renders-cents demo).
- `src/example-dashboard.md`, `src/example-report.md`, `src/observable.png`, `src/components/timeline.js`, `src/data/events.json`, `src/data/launches.csv.js`: removed (sample content not needed).
- `src/.observablehq/`: removed (Framework rebuilds its cache directory on next run).
- Root `.gitignore`: scaffold wrote 4 lines (`.DS_Store`, `/dist/`, `node_modules/`, `yarn-error.log`); replaced with the six D-19 lines exactly.
- Root `README.md`: scaffold wrote ~60 lines describing Framework structure; replaced with the D-20 minimal quickstart.

## Decisions Made

- None additional — all decisions came from D-05 / D-06 / D-13 / D-17 / D-18 / D-19 / D-20 in 01-CONTEXT.md and were applied verbatim.

## Deviations from Plan

None — plan executed exactly as written. Both tasks' acceptance criteria pass; the plan-level fresh-clone smoke test (`rm -rf node_modules dist && npm install && npm run build`) succeeds; the dev-server smoke test (start `npm run dev`, observe response on port 3000, kill) succeeds.

## Issues Encountered

- The `@observablehq/framework@1.13.4 create` CLI uses `@clack/prompts` which writes per-character ANSI escapes and does not accept piped stdin (top-level `await` warnings observed when piping). Resolved by driving the CLI with `/usr/bin/expect` against permissive `[^a-zA-Z]*`-spaced regex patterns. The scaffold ran in `/tmp/tuning-temp` and was `rsync`'d into the repo root with `--exclude=.git --exclude=node_modules --exclude=dist --exclude=package-lock.json`, then `npm install` was rerun against the rewritten `package.json`.
- `expect` script answered "Yes" to "Initialize git repository?" because the regex matched the prompt before the cursor finished settling on the highlighted default. Harmless: the scaffold's `.git` was excluded by the `rsync --exclude=.git`.

## User Setup Required

None — no external service configuration required. Phase 01 Plan 04 will introduce the GitHub Pages workflow.

## Next Phase Readiness

- Plan 02 (TypeScript + Vitest + ESLint + Prettier configs) can now layer on top of `package.json`'s `lint:types`, `test`, `test:watch`, `lint`, `format`, `format:check`, `ci` scripts.
- Plan 03 (xen-dev stack install + the Fraction demo on `index.md`) can install runtime deps and replace `src/index.md`.
- Plan 04 (GitHub Actions + Pages deploy) has a `dist/`-producing `npm run build` to wire up.
- BOOT-01 ✓ marked complete; BOOT-02 through BOOT-05 remain.

## Self-Check: PASSED

All claimed files and commits verified to exist on disk and in git history:

- 11 files: package.json, package-lock.json, observablehq.config.ts, .nvmrc, .gitignore, README.md, src/index.md, src/lib/.gitkeep, src/components/.gitkeep, src/data/.gitkeep, plus this SUMMARY
- 2 commits: `f7b8d4f` (Task 1), `63fdcc5` (Task 2)

---
*Phase: 01-bootstrap-build*
*Plan: 01*
*Completed: 2026-05-03*
