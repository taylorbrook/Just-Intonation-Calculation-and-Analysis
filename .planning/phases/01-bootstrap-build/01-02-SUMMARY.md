---
phase: 01-bootstrap-build
plan: 02
subsystem: infra
tags: [typescript, vitest, eslint, prettier, tooling, ci-gates]

requires:
  - phase: 01-bootstrap-build/01
    provides: D-13 npm scripts (lint:types, test, lint, format:check, ci) and D-06 src/ layout
provides:
  - Strict TypeScript config (D-16) — strict, noUncheckedIndexedAccess, noImplicitOverride, exactOptionalPropertyTypes all true
  - Vitest configured for D-07 colocated tests under src/lib/__tests__/
  - ESLint 9 flat config with @typescript-eslint/recommended-type-checked baseline (D-12)
  - Prettier config with sensible defaults
  - Stub kernel module src/lib/example.ts (D-09) and 2 passing Vitest tests
  - Empty src/lib/INVENTORY.md stub (D-08, populated in Phase 2)
  - All four CI gates exit 0 locally on the stub kernel
affects: [01-03-stack-install, 01-04-deploy, 02-kernel-mvp, 03-viz, 04-analysis]

tech-stack:
  added:
    - "typescript@^5.9.3 (caret-pinned per D-17)"
    - "vitest@^2.1.9 (caret-pinned per D-17)"
    - "@types/node@^20.19.39"
    - "eslint@^9.39.4 (flat config, ESLint 9)"
    - "typescript-eslint@^8.59.1 (unified meta-package for parser + plugin)"
    - "prettier@^3.8.3"
  patterns:
    - "Test colocation: src/lib/<area>/__tests__/<source>.test.ts (D-07)"
    - "Type-checked ESLint baseline scoped to src/ — type-aware rules require parserOptions.project, which only resolves files inside the tsconfig include glob"
    - "TypeScript .ts source imports use .js extensions (Framework esbuild + moduleResolution: Bundler resolves)"
    - "tsconfig noEmit: true — Framework owns transpilation, tsc is enforcement-only (Pitfall #12)"

key-files:
  created:
    - /Users/taylorbrook/Dev/Tuning Systems/tsconfig.json
    - /Users/taylorbrook/Dev/Tuning Systems/vitest.config.ts
    - /Users/taylorbrook/Dev/Tuning Systems/eslint.config.js
    - /Users/taylorbrook/Dev/Tuning Systems/.prettierrc
    - /Users/taylorbrook/Dev/Tuning Systems/.prettierignore
    - /Users/taylorbrook/Dev/Tuning Systems/.eslintignore
    - /Users/taylorbrook/Dev/Tuning Systems/src/lib/example.ts
    - /Users/taylorbrook/Dev/Tuning Systems/src/lib/__tests__/example.test.ts
    - /Users/taylorbrook/Dev/Tuning Systems/src/lib/INVENTORY.md
  modified:
    - /Users/taylorbrook/Dev/Tuning Systems/package.json
    - /Users/taylorbrook/Dev/Tuning Systems/package-lock.json

key-decisions:
  - "Honored D-16 verbatim: strict, noUncheckedIndexedAccess, noImplicitOverride, exactOptionalPropertyTypes all set to true in tsconfig.json"
  - "Honored D-07: Vitest include glob targets src/lib/**/__tests__/**/*.test.ts and src/lib/**/*.test.ts; excludes node_modules, dist, .observablehq, src/**/*.md"
  - "Honored D-09: src/lib/example.ts exports a single trivial add() function as the Vitest target"
  - "Honored D-08: src/lib/INVENTORY.md is an empty-stub placeholder (4-bullet structure, no entries)"
  - "Honored D-12: ESLint flat config uses tseslint.configs.recommendedTypeChecked, ignores src/**/*.md, and references tsconfig.json via parserOptions.project"
  - "Scoped type-checked ESLint rules to src/**/*.ts and src/**/*.js only — applying them globally caused parser-services errors on root-level eslint.config.js, which is outside tsconfig include"
  - "Honored D-17: typescript/vitest/eslint/prettier all caret-ranged (^), only Framework + (future) fraction.js are exact-pinned"
  - "Added src/.observablehq/** to ESLint ignores — Framework writes its build cache there during npm run build, and the cached client.js / runtime.js / stdlib.js files would otherwise trip the type-checked parser"

patterns-established:
  - "Type-checked-only-in-src pattern: tseslint.configs.recommendedTypeChecked is mapped over with files: ['src/**/*.ts', 'src/**/*.js'] so the type-aware baseline never sees root-level config files"
  - "Stub-as-Vitest-target pattern (D-09): the Phase 1 kernel is a single 5-line example.ts whose only purpose is to give Vitest a passing test; Phase 2 replaces it with the real Interval / Fraction / monzo primitives"
  - "Four-gate CI chain (D-10): npm run ci = lint:types && test && lint && format:check && build — wired up in Plan 01 scripts, validated locally in this plan, pushed to GitHub Actions in Plan 04"

requirements-completed:
  - BOOT-02
  - BOOT-03

duration: ~3min
completed: 2026-05-03
---

# Phase 01 Plan 02: TypeScript + Vitest + ESLint + Prettier Toolchain Summary

**All four CI gates (`tsc --noEmit`, `vitest run`, `eslint .`, `prettier --check .`) wired up and exiting 0 on a stub kernel module — the strict TypeScript flags from D-16 are locked in from day one, test colocation pattern (D-07) is established under `src/lib/__tests__/`, and the type-checked ESLint baseline (D-12) is scoped to `src/` so root-level config files don't trip parser-services.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-03T01:37:19Z
- **Completed:** 2026-05-03T01:39:39Z
- **Tasks:** 2
- **Files created:** 9
- **Files modified:** 2

## Accomplishments

- **TypeScript strict mode locked in:** `tsconfig.json` has all four D-16 flags (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`) set to `true`, plus `noFallthroughCasesInSwitch` and `noImplicitReturns` for additional safety. `moduleResolution: Bundler` matches Framework's esbuild and lets `.js`-extension imports of `.ts` files resolve at type-check time.
- **Vitest configured per D-07:** `vitest.config.ts` includes `src/lib/**/__tests__/**/*.test.ts` and `src/lib/**/*.test.ts`, excludes Framework build artifacts (`.observablehq/**`, `dist/**`) and Markdown (`src/**/*.md`), runs in `node` environment.
- **ESLint 9 flat config (D-12):** `eslint.config.js` uses `tseslint.configs.recommendedTypeChecked` baseline, scoped to `src/**/*.{ts,js}` only. Type-aware rules require `parserOptions.project`, which is set to `./tsconfig.json` with `tsconfigRootDir: import.meta.dirname`. Vitest test files have `@typescript-eslint/no-unused-expressions` relaxed.
- **Prettier defaults locked:** `.prettierrc` declares semi/no-single-quote/trailing-all/100-col/2-space/lf to prevent format drift.
- **Stub kernel module (D-09):** `src/lib/example.ts` exports `add(a, b)` solely as a Vitest target. `src/lib/__tests__/example.test.ts` has 2 passing tests (sum, negative numbers).
- **INVENTORY stub (D-08):** `src/lib/INVENTORY.md` exists as an empty placeholder with the 4-bullet structure (function/type name, source, reason if custom), to be populated in Phase 2 per NOTES-04.
- **All four CI gates exit 0:** `npm run lint:types`, `npm run test` (2 passed), `npm run lint`, `npm run format:check`, AND the full `npm run ci` chain (which also runs `observable build`) all succeed.
- BOOT-02 ✓ (TypeScript with `tsc --noEmit`) and BOOT-03 ✓ (Vitest configured) both satisfied.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install devDependencies and write tsconfig.json + vitest.config.ts** — `159867b` (feat)
2. **Task 2: Configure ESLint 9 flat config and Prettier** — `633b34e` (feat)

_Note: A final docs commit will land in `final_commit` step containing this SUMMARY + STATE updates._

## Files Created/Modified

### Created

- `/Users/taylorbrook/Dev/Tuning Systems/tsconfig.json` — Strict TypeScript config per D-16; ES2022 target; `moduleResolution: Bundler`; `noEmit: true`.
- `/Users/taylorbrook/Dev/Tuning Systems/vitest.config.ts` — Vitest config; `node` environment; D-07 colocated test glob; excludes Framework artifacts.
- `/Users/taylorbrook/Dev/Tuning Systems/eslint.config.js` — ESLint 9 flat config; type-checked baseline scoped to `src/`; ignores Framework cache and Markdown.
- `/Users/taylorbrook/Dev/Tuning Systems/.prettierrc` — Prettier defaults (semi, double quotes, 100-col, 2-space, lf).
- `/Users/taylorbrook/Dev/Tuning Systems/.prettierignore` — Excludes node_modules, dist, .observablehq, package-lock, *.md.
- `/Users/taylorbrook/Dev/Tuning Systems/.eslintignore` — Editor-compat file (ESLint 9 reads from flat config; this is ignored at lint time but emits a deprecation warning — see Issues Encountered).
- `/Users/taylorbrook/Dev/Tuning Systems/src/lib/example.ts` — Stub kernel module (D-09); exports `add(a, b)`.
- `/Users/taylorbrook/Dev/Tuning Systems/src/lib/__tests__/example.test.ts` — 2 passing Vitest tests for `add()`.
- `/Users/taylorbrook/Dev/Tuning Systems/src/lib/INVENTORY.md` — Empty INVENTORY stub (D-08); will be populated in Phase 2.

### Modified

- `/Users/taylorbrook/Dev/Tuning Systems/package.json` — Added 6 devDependencies (typescript, vitest, @types/node, eslint, typescript-eslint, prettier).
- `/Users/taylorbrook/Dev/Tuning Systems/package-lock.json` — Locked transitive deps (~144 new packages including @typescript-eslint/*, eslint internals, prettier).

## Decisions Made

1. **Scoped `recommendedTypeChecked` to `src/**/*.{ts,js}` only** — Initially the plan's eslint.config.js spread `...tseslint.configs.recommendedTypeChecked` globally and then declared `parserOptions.project` only on `src/**/*.ts` files. ESLint 9 + typescript-eslint 8 rejects this pattern with `"parserOptions.project" has been provided but the file was not found`. Fix: `.map(config => ({ ...config, files: ["src/**/*.ts", "src/**/*.js"] }))` over the type-checked baseline so type-aware rules never see root-level config files. This is a Rule 1 deviation — see Deviations from Plan.
2. **Added `src/.observablehq/**` to ESLint ignores** — Framework writes its build cache to `src/.observablehq/cache/_observablehq/{client,runtime,stdlib}.js` during `npm run build`. These files are matched by the `src/**/*.js` glob but live outside the tsconfig include, so the type-checked parser fails on them. The plan's ignores list (`node_modules/**, dist/**, .observablehq/**, src/**/*.md`) didn't cover this — the `.observablehq/**` pattern matches a hypothetical root-level `.observablehq/`, but Framework's cache is at `src/.observablehq/`. Fix: add `src/.observablehq/**` to the ignores. This is a Rule 1 deviation — see Deviations from Plan.

## Resolved versions

| Package | Range requested | Resolved |
| ------- | --------------- | -------- |
| typescript | ^5.6 | ^5.9.3 |
| vitest | ^2.1 | ^2.1.9 |
| @types/node | ^20 | ^20.19.39 |
| eslint | ^9.13 | ^9.39.4 |
| typescript-eslint | ^8.13 | ^8.59.1 |
| prettier | ^3.3 | ^3.8.3 |

All within the requested caret ranges. No exact pins used (per D-17 only Framework + fraction.js are exact-pinned).

## tsconfig.json (full contents for Phase 2 reference)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node"],
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,

    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*.ts", "observablehq.config.ts", "vitest.config.ts"],
  "exclude": ["node_modules", "dist", ".observablehq"]
}
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scoped `recommendedTypeChecked` to `src/` files only**

- **Found during:** Task 2, first `npm run lint` run.
- **Issue:** Plan's eslint.config.js applied `...tseslint.configs.recommendedTypeChecked` globally (no `files` field), then declared `parserOptions.project: './tsconfig.json'` only on `src/**/*.{ts,js}` files. ESLint 9 + typescript-eslint 8 evaluates the type-checked rules against ALL files (including root-level `eslint.config.js` itself), which then errors with `Error while loading rule '@typescript-eslint/await-thenable': You have used a rule which requires type information, but don't have parserOptions set to generate type information for this file.`
- **Fix:** Used `tseslint.configs.recommendedTypeChecked.map((config) => ({ ...config, files: ["src/**/*.ts", "src/**/*.js"] }))` to narrow the baseline to source files only. Root-level config files (eslint.config.js, vitest.config.ts, observablehq.config.ts) are now linted with no type-aware rules — fine because they're tiny and TypeScript already type-checks them via tsconfig include.
- **Files modified:** eslint.config.js
- **Commit:** 633b34e (committed alongside the rest of Task 2)

**2. [Rule 1 - Bug] Added `src/.observablehq/**` to ESLint ignores**

- **Found during:** Task 2, second `npm run lint` run.
- **Issue:** Plan's ignores list contained `.observablehq/**` (rooted at repo root). Observable Framework's build cache actually lives at `src/.observablehq/cache/_observablehq/{client,runtime,stdlib}.js`, which is matched by ESLint's default file collection but not by the plan's ignore pattern. The `src/**/*.js` files glob then picks them up, and the type-checked parser fails because they're outside the tsconfig include glob.
- **Fix:** Added `"src/.observablehq/**"` to the `ignores` array in eslint.config.js. The plan's `.observablehq/**` entry is kept for forward compat in case Framework changes its cache location.
- **Files modified:** eslint.config.js
- **Commit:** 633b34e

### Notes

- Both fixes are Rule 1 (bug) — the plan as written would not have produced a passing `npm run lint`. Both are local config patches with zero impact on architecture or downstream plans.
- No tests, no application code, no API surface changed. The fixes are entirely inside `eslint.config.js`.

## Issues Encountered

- **`.eslintignore` deprecation warning:** ESLint 9 prints `The ".eslintignore" file is no longer supported. Switch to using the "ignores" property in "eslint.config.js"` on every `npm run lint` run. The plan asks for `.eslintignore` "for editor compat", but it's now functionally redundant since ESLint 9 reads ignores from flat config. The warning does NOT cause a non-zero exit, so all CI gates pass. Recommendation for Plan 04 (CI deploy): consider deleting `.eslintignore` to silence the warning, OR suppress with `--no-warn-ignored` (NB: that flag silences a different warning). For now, the file is kept per the plan spec.
- **Framework build emits Markdown pages for INVENTORY.md:** `npm run build` renders `src/lib/INVENTORY.md` to `dist/lib/INVENTORY.html` because Framework treats every `.md` under `src/` as a page. This is per-design and harmless in Phase 1 — when Phase 2 expands INVENTORY, it'll just be an additional published page with the kernel inventory. If hiding from production output becomes desired, set `pages: []` plus an explicit pages list in `observablehq.config.ts` later.
- **No unexpected lint findings:** The stub `example.ts` and `example.test.ts` cleared all type-checked rules out of the gate. No violations to suppress.

## User Setup Required

None — fully autonomous. No external service access, no API keys, no secrets.

## Next Plan Readiness

- **Plan 03 (xen-dev stack install + Fraction demo on `index.md`):** Ready. Can `npm install xen-dev-utils sonic-weave fraction.js@5 sw-synth ji-lattice @observablehq/plot d3` and write real kernel code; the type-check / test / lint / format gates are all wired and will catch regressions immediately. The `add()` stub in `src/lib/example.ts` will be replaced with the real Interval / Fraction / monzo primitives — the test colocation pattern at `src/lib/__tests__/` is now established.
- **Plan 04 (GitHub Actions + Pages deploy):** Ready. `npm run ci` is the single CI command — exits 0 on the stub, will exit 0 on real Phase 1 deliverables once Plan 03 lands. The four gates (`tsc --noEmit`, `vitest run`, `eslint .`, `prettier --check .`) plus `observable build` are all GitHub-Actions-ready.
- BOOT-02 ✓ marked complete; BOOT-03 ✓ marked complete; BOOT-01 already complete from Plan 01. BOOT-04 (CI workflow), BOOT-05 (deploy to Pages) remain.

## TDD Gate Compliance

This plan is `type: execute` (not `type: tdd`), so RED/GREEN/REFACTOR gate enforcement does not apply. The plan does include test files (`example.test.ts`), but they were committed alongside the implementation in a single `feat` commit per the plan's Task 1 spec — this is correct for non-TDD plans.

## Self-Check: PASSED

All claimed files and commits verified to exist on disk and in git history:

- 9 new files at the paths listed under `key-files.created`.
- 2 modified files (`package.json`, `package-lock.json`) staged and committed in both task commits.
- 2 task commits in `git log`: `159867b` (Task 1, feat), `633b34e` (Task 2, feat).
- All four CI gates verified to exit 0: `npm run lint:types`, `npm run test` (2 passed), `npm run lint`, `npm run format:check`. Full `npm run ci` chain (gates + `observable build`) also exits 0.
- All 4 D-16 strict flags present in tsconfig.json (verified via grep).
- ESLint config references `recommendedTypeChecked` (verified via grep).
- Vitest config references `src/lib/__tests__` glob (verified via grep).

---
*Phase: 01-bootstrap-build*
*Plan: 02*
*Completed: 2026-05-03*
