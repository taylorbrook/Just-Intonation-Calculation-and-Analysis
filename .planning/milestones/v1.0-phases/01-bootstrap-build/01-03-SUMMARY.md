---
phase: 01-bootstrap-build
plan: 03
subsystem: infra
tags: [xen-dev-utils, fraction.js, sw-synth, ji-lattice, sonic-weave, observable-framework, bigint-rationals]

requires:
  - phase: 01-bootstrap-build/01
    provides: Framework 1.13.4 scaffold + D-13 npm scripts + D-06 src/ layout
  - phase: 01-bootstrap-build/02
    provides: Strict TypeScript (D-16) + Vitest (D-07) + ESLint type-checked (D-12) + Prettier — four CI gates wired and exiting 0
provides:
  - xen-dev-utils@0.13.1, sonic-weave@0.14.1, ji-lattice@0.3.2, sw-synth@0.4.0 installed (caret-pinned per D-17)
  - fraction.js@5.3.4 EXACT-pinned (no caret) — protects against silent v4 (Number) ↔ v5 (BigInt) regressions
  - D-14 hello page at src/index.md proves end-to-end stack: Framework reactive cells + npm: imports + BigInt-backed Fraction + strict TS toolchain
  - INVENTORY.md seeded with first kernel-discipline entry (Fraction → fraction.js@5.3.4)
  - All four CI gates (lint:types, test, lint, format:check) exit 0 with the new dependency graph in place
  - dist/index.html contains the 81/79 marker after `npm run build`
affects: [01-04-deploy, 02-kernel-mvp, 03-viz, 04-analysis]

tech-stack:
  added:
    - "fraction.js@5.3.4 (exact pin per D-17 — BigInt rational kernel)"
    - "xen-dev-utils@^0.13.1 (caret pin)"
    - "sonic-weave@^0.14.1 (caret pin)"
    - "ji-lattice@^0.3.2 (caret pin)"
    - "sw-synth@^0.4.0 (caret pin)"
    - "aperiodic-oscillator@0.3.2 (transitive via sw-synth)"
  patterns:
    - "npm: protocol imports in Markdown reactive cells (`import {Fraction} from \"npm:fraction.js\"`); Framework self-hosts npm packages into src/.observablehq/cache/_npm/"
    - "Top-level reactive `const` in `ts` cells, surfaced via inline `${expr}` interpolation in prose (Framework house style)"
    - "Direct fraction.js import (NOT via xen-dev-utils re-export) so the version pin is unambiguous in the runtime"
    - "Cents as display projection only — `Number(fraction.valueOf())` fed to `Math.log2` for display, never re-parsed back to ratios (Pitfall #1)"

key-files:
  created:
    - /Users/taylorbrook/Dev/Tuning Systems/.planning/phases/01-bootstrap-build/01-03-SUMMARY.md
  modified:
    - /Users/taylorbrook/Dev/Tuning Systems/package.json
    - /Users/taylorbrook/Dev/Tuning Systems/package-lock.json
    - /Users/taylorbrook/Dev/Tuning Systems/src/index.md
    - /Users/taylorbrook/Dev/Tuning Systems/src/lib/INVENTORY.md

key-decisions:
  - "Honored D-14: src/index.md imports {Fraction} from npm:fraction.js, computes new Fraction(\"81/79\"), and renders ratio + cents inline in prose — proves Framework + npm: + BigInt + strict TS end-to-end"
  - "Honored D-17: fraction.js exact-pinned to 5.3.4 (no caret); xen-dev-utils, sonic-weave, ji-lattice, sw-synth caret-ranged"
  - "Honored D-15: NO composition.md / theory.md skeleton pages; src/index.md is the only page; index.md prose deliberately avoids the substrings 'composition' and 'theory' to satisfy the deny-grep"
  - "Honored D-21: NO temperaments, NO mathjs in package.json — verified via deny-list grep"
  - "Honored D-08: INVENTORY.md seeded with the Fraction → fraction.js@5.3.4 entry, establishing the wrap-don't-reimplement discipline pattern (Pitfall #5)"
  - "Accepted ji-lattice peer-dep warning (peer-deps xen-dev-utils@^0.12.2 vs installed ^0.13.1) per CLAUDE.md Version Compatibility table — the 0.12 → 0.13 transition kept the surface stable"
  - "Page surfaces `typeof ratio.n` and `typeof ratio.d` as visual confirmation that fraction.js v5 (BigInt) loaded — defense in depth alongside the package.json pin"

patterns-established:
  - "npm:-import pattern for Markdown TS cells: `import {Fraction} from \"npm:fraction.js\"` — Framework self-hosts the npm package on first build"
  - "Bootstrap-proof page pattern: a single trivial page that exercises every layer of the stack so a regression in any layer is immediately visible at the URL"
  - "Display-projection convention: cents derived as float for rendering only; ratio stays as exact BigInt-backed Fraction (the kernel rule for Phase 2)"

requirements-completed:
  - BOOT-04

duration: ~3min
completed: 2026-05-03
---

# Phase 01 Plan 03: xen-dev Stack Install + D-14 Hello Page Summary

**xen-dev-utils 0.13.1 + sonic-weave 0.14.1 + ji-lattice 0.3.2 + sw-synth 0.4.0 installed (caret) and fraction.js 5.3.4 exact-pinned; src/index.md replaced with a D-14 bootstrap-proof page that imports `{Fraction}` from `npm:fraction.js`, renders `81/79 ≈ 43.28¢`, and surfaces `typeof ratio.n / ratio.d → bigint` so the BigInt-backed v5 is visually confirmed at runtime.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-03T01:43:55Z
- **Completed:** 2026-05-03T01:46:55Z
- **Tasks:** 2
- **Files modified:** 4 (3 from Task 1, 1 from Task 2)

## Accomplishments

- **xen-dev stack live:** All four caret-ranged packages installed in a single command (single dependency-graph mutation, no partial states). Resolved to: `xen-dev-utils@0.13.1`, `sonic-weave@0.14.1`, `ji-lattice@0.3.2`, `sw-synth@0.4.0`. Transitive: `aperiodic-oscillator@0.3.2` arrived via sw-synth.
- **fraction.js pinned exact:** `5.3.4` written without a caret per D-17. The pin is the contract that protects the project from a silent v4 (Number-backed → precision loss past 2^53) reintroduction. The hello page surfaces `typeof ratio.n` so a downgrade would also be visually obvious in the browser.
- **D-14 hello page live:** `src/index.md` rewritten as the bootstrap-proof page. After `npm run build`, `dist/index.html` contains the `81/79` static marker AND the embedded TS cell that computes ratio + cents at render time. Three layers exercised in one page: (a) Framework reactive cells, (b) `npm:` import resolution, (c) BigInt-backed `Fraction`, (d) strict TypeScript (D-16) accepting the code without complaint.
- **INVENTORY.md seeded:** First entry (`Fraction → fraction.js@5.3.4`) establishes the discipline pattern from Pitfall #5 — wrap, don't reimplement. Phase 2's kernel will append entries here as it adds primitives.
- **Deny-list enforced:** `package.json` does NOT contain `temperaments` or `mathjs` (D-21). Verified via the inline node check in Task 1's verification pipeline.
- **All four CI gates exit 0** after the new dependency graph and the new page are in place. Full `npm run ci` chain (gates + `observable build`) also exits 0.
- BOOT-04 ✓ satisfied — xenharmonic-devs stack installed AND visibly resolved through the Framework runtime.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install xen-dev stack and pin fraction.js exactly** — `a8cdf54` (feat)
2. **Task 2: Write D-14 hello page at src/index.md** — `b8c05ae` (feat)

_Plan metadata commit: appended via final_commit step containing this SUMMARY + STATE / ROADMAP / REQUIREMENTS updates._

## Files Created/Modified

### Created

- `/Users/taylorbrook/Dev/Tuning Systems/.planning/phases/01-bootstrap-build/01-03-SUMMARY.md` — this file.

### Modified

- `/Users/taylorbrook/Dev/Tuning Systems/package.json` — Added 5 runtime dependencies (`fraction.js` exact 5.3.4 + four caret-ranged xen-dev packages). Framework pin preserved exactly (`1.13.4`).
- `/Users/taylorbrook/Dev/Tuning Systems/package-lock.json` — Locked transitive deps (~9 new packages including aperiodic-oscillator and sub-packages of sonic-weave / sw-synth).
- `/Users/taylorbrook/Dev/Tuning Systems/src/index.md` — Replaced the Plan 01 placeholder with the D-14 bootstrap-proof page (48 net insertions).
- `/Users/taylorbrook/Dev/Tuning Systems/src/lib/INVENTORY.md` — Replaced the Plan 02 empty stub with the discipline-seeded version listing Fraction.

## Resolved versions

| Package | Range requested | Resolved | Pinned how |
| ------- | --------------- | -------- | ---------- |
| fraction.js | exact 5.3.4 | 5.3.4 | exact (D-17) |
| xen-dev-utils | ^0.13.1 | 0.13.1 | caret |
| sonic-weave | ^0.14.1 | 0.14.1 | caret |
| ji-lattice | ^0.3.2 | 0.3.2 | caret |
| sw-synth | ^0.4.0 | 0.4.0 | caret |
| aperiodic-oscillator | (transitive) | 0.3.2 | n/a (via sw-synth) |
| @observablehq/framework | exact 1.13.4 | 1.13.4 (preserved) | exact (D-17, from Plan 01) |

## src/index.md (full contents for Phase 2 reference)

````markdown
# Tuning Systems

A research notebook + JI calculator built on Observable Framework.

## Bootstrap proof

The page below is intentionally trivial — it exists only to confirm that the
full Phase 1 stack is wired up end-to-end:

- Observable Framework reactive cells work
- `npm:` imports resolve through the build
- `fraction.js` v5 (BigInt-backed) is what actually loads, not v4
- TypeScript strict mode (`strict`, `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `exactOptionalPropertyTypes`) accepts the code
- `npm run dev`, `npm run build`, and the four CI gates all pass

Phase 2 will replace this page with the real piece dashboard and
layer in the math kernel proper.

```ts
import {Fraction} from "npm:fraction.js";
const ratio = new Fraction("81/79");
const numType = typeof ratio.n;
const denType = typeof ratio.d;
const cents = 1200 * Math.log2(Number(ratio.valueOf()));
const centsStr = cents.toFixed(2);
```

The ratio is **${ratio.toFraction()}** ≈ **${centsStr}¢**.
…
````

## Decisions Made

1. **Replaced "composition dashboard" with "piece dashboard" in the prose** — Plan's verbatim `<action>` body told me to write the line `Phase 2 will replace this page with the real composition dashboard and …`, but the same plan's acceptance criterion is `grep -ciE '(composition|theory)' src/index.md → 0`. The two parts of the plan contradict each other: the action's prose contains the literal substring "composition" that the acceptance grep forbids. Reworded to "piece dashboard" — preserves the forward-pointer intent (Phase 2 will own the COMP-* requirements per ROADMAP.md) while satisfying the deny-grep. This is a Rule 1 deviation — see Deviations from Plan.
2. **Surfaced `typeof ratio.n / ratio.d` in the page body** (not just in a comment) — Plan's hello-page design called for "BigInt confirmation" both in the cell logic and visibly in the rendered prose; the rendered output line `Internal types: numerator is a 'bigint', denominator is a 'bigint'` makes the v5-vs-v4 distinction observable to the user without opening DevTools.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reworded the "composition dashboard" sentence to satisfy the plan's own deny-grep**

- **Found during:** Task 2, immediately before commit (running the plan's acceptance grep).
- **Issue:** Plan's `<action>` body specified the verbatim line `Phase 2 will replace this page with the real composition dashboard and layer in the math kernel proper.` But the same task's acceptance criterion checks: `grep -ciE '(composition|theory)' src/index.md` MUST output `0`. The literal substring "composition" in the action prose contradicts the grep, which counts a single matching line as `1`.
- **Fix:** Replaced "composition dashboard" with "piece dashboard" in src/index.md (single 2-character word swap). Preserves Phase 2 forward-pointer semantics; the COMP-01/02/03 requirements in REQUIREMENTS.md still describe "the composition" elsewhere — D-15's intent is to forbid skeleton page files, not the substring in prose. The deny-grep is over-broad relative to D-15's actual rule, but easier to satisfy by rewording than by debating the plan with itself.
- **Files modified:** /Users/taylorbrook/Dev/Tuning Systems/src/index.md
- **Verification:** `grep -ciE '(composition|theory)' src/index.md` outputs `0`; the page semantics unchanged.
- **Committed in:** `b8c05ae` (Task 2 commit; the reword landed before the first commit so it never appeared on disk in its original form).

---

**Total deviations:** 1 auto-fixed (Rule 1 — plan internal contradiction).
**Impact on plan:** Zero scope change. The fix is a 2-word prose edit; both the action's intent and the acceptance criterion's intent are honored. Worth flagging for future plan-writers: when Phase 1 plans use a deny-grep on substrings that may legitimately appear in forward-pointing prose, scope the grep narrower (e.g., to filename or to literal `[file].md` references).

## Issues Encountered

- **Plan's expected cents value was off by 0.07¢** — Plan body said the page would render `81/79 ≈ 43.21¢`, but the actual computation `(1200 * Math.log2(81/79)).toFixed(2)` yields `43.28`. Confirmed independently with `node -e`. The page renders the truthful value (`43.28¢`) because the cell does the actual computation; the plan's `43.21¢` was a small arithmetic error in the planner's prose. Not a deviation — the deliverable is mathematically correct; only the plan's documentation of the expected output was off. The acceptance criteria check for the substring `81/79` (which is correct) and the substring `cents`/`¢` (also correct). No fix required.
- **`.eslintignore` deprecation warning persists** — Pre-existing from Plan 02; ESLint 9 prints a deprecation warning on every `npm run lint` invocation. Out of scope for Plan 03; tracked for Plan 04 to consider deleting `.eslintignore` and consolidating ignores into `eslint.config.js`.
- **Framework renders INVENTORY.md as a published page** — Pre-existing from Plan 02; `npm run build` emits `dist/lib/INVENTORY.html`. Per-design and harmless — when Phase 2 expands INVENTORY, it'll just be an additional published page.
- **ji-lattice peer-dep warning** — `ji-lattice@0.3.2` declares peer-dep `xen-dev-utils@^0.12.2` but we installed `^0.13.1`. Per CLAUDE.md Version Compatibility table this is COMPATIBLE — `ji-lattice` accepts the 0.13 line because the surface stayed stable across the 0.12 → 0.13 transition. The warning is at install time only; runtime resolution is fine. **Accepted, not fixed.** Documented in T-01-09 of the plan's threat register.
- **5 moderate-severity npm audit findings** — `npm install` reports 5 vulnerabilities in transitive deps. NOT investigated in this plan (out of scope; the plan does not ask for `npm audit fix` and `--force` would risk a breaking change to the pinned graph). Defer to Plan 04 or to a dedicated security-audit pass.

## User Setup Required

None — fully autonomous. No external service access, no API keys, no secrets, no manual verification step (the plan does not require a human to open `npm run dev` and visually inspect the page; build-time grep over `dist/index.html` is sufficient evidence the page renders).

If you do want to visually verify, the manual steps are:
1. `cd "/Users/taylorbrook/Dev/Tuning Systems"`
2. `npm run dev`
3. Open `http://127.0.0.1:3000/`
4. Confirm the page shows: `81/79 ≈ 43.28¢` AND `numerator is a 'bigint', denominator is a 'bigint'`.
5. `Ctrl+C` to stop.

## Next Plan Readiness

- **Plan 04 (GitHub Actions + Pages deploy):** Fully ready. `npm run ci` exits 0 with the full xen-dev stack present, the BigInt Fraction page in place, and dist/index.html rendering correctly. The CI workflow can wire up `npm ci && npm run ci` and a static-site deploy step; nothing on the Plan 03 side blocks it.
- **Phase 2 (Math Kernel + Composition Anchor MVP):** All foundational pieces in place:
  - `Fraction` is a known-imported, type-checked, BigInt-backed primitive — the foundation of `Interval`.
  - `xen-dev-utils`, `sonic-weave`, `ji-lattice`, `sw-synth` are all installed and resolvable; Phase 2 plans can import any of them without re-litigating the install.
  - INVENTORY.md is open for entries; the first entry (Fraction) sets the precedent.
  - The four CI gates are battle-tested with real npm dependencies in the graph (not just the stub kernel from Plan 02).
- BOOT-04 ✓ marked complete; BOOT-05 (deploy to Pages) remains for Plan 04. BOOT-01, BOOT-02, BOOT-03 already complete from Plans 01 and 02.

## Threat Flags

None — no new security-relevant surface introduced. The dependencies all sit inside the xenharmonic-devs npm org plus the well-known `fraction.js` package; no auth paths, no network endpoints, no schema changes. Threats T-01-08 through T-01-12 from the plan's threat register were all either mitigated (T-01-08 via exact pin, T-01-10 via package-lock commit, T-01-12 via deny-list check) or accepted (T-01-09 ji-lattice peer-dep, T-01-11 BigInt-internals exposure on the public page).

## TDD Gate Compliance

This plan is `type: execute` (not `type: tdd`), so RED/GREEN/REFACTOR gate enforcement does not apply. No test files were created in this plan — the existing Plan 02 stub tests (`src/lib/__tests__/example.test.ts`, 2 passing) continue to pass without modification.

## Self-Check: PASSED

All claimed files and commits verified to exist on disk and in git history:

- `/Users/taylorbrook/Dev/Tuning Systems/.planning/phases/01-bootstrap-build/01-03-SUMMARY.md` — this file.
- `/Users/taylorbrook/Dev/Tuning Systems/package.json` — fraction.js@5.3.4 (exact), four xen-dev caret pins.
- `/Users/taylorbrook/Dev/Tuning Systems/package-lock.json` — committed.
- `/Users/taylorbrook/Dev/Tuning Systems/src/index.md` — D-14 hello page contents.
- `/Users/taylorbrook/Dev/Tuning Systems/src/lib/INVENTORY.md` — Fraction entry seeded.
- Commits `a8cdf54` (Task 1, feat) and `b8c05ae` (Task 2, feat) both present in `git log`.
- Both `node_modules/{fraction.js, xen-dev-utils, sonic-weave, ji-lattice, sw-synth}/` directories exist.
- All four CI gates verified to exit 0: `npm run lint:types`, `npm run test` (2 passed), `npm run lint`, `npm run format:check`. Full `npm run ci` chain (gates + `observable build`) also exits 0.
- `dist/index.html` contains `81/79` after a clean build.
- `package.json` deny-list (temperaments, mathjs) verified clean.

---
*Phase: 01-bootstrap-build*
*Plan: 03*
*Completed: 2026-05-03*
