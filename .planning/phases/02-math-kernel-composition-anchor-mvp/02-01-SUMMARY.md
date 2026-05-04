---
phase: 02-math-kernel-composition-anchor-mvp
plan: 01
subsystem: foundation
tags:
  - katex
  - vitest-config
  - eslint
  - fixtures
  - scl
  - cleanup

# Dependency graph
requires:
  - phase: 01-bootstrap-build
    provides: ESLint flat config, Vitest config, observablehq.config.ts shell, src/lib/INVENTORY.md, fraction.js@5.3.4 + xen-dev-utils dependencies
provides:
  - KaTeX 0.16.45 CSS head-injected in Framework config (D-23)
  - Vitest discovers tests under src/lib/__tests__/, src/audio/__tests__/, src/__tests__/ (Phase 1 D-07 extension)
  - ESLint R-01 rule blocking `import { Fraction } from "xen-dev-utils"` repo-wide
  - 16 synthetic .scl edge-case fixtures (F01-F16) covering happy-path, cents detection variants, BigInt boundary, CRLF, BOM, comments, whitespace, error cases
  - 5 golden-corpus .scl files (Partch 43, slendro_av, Young Well-Tuned Piano, custom 12-tone JI chromatic, 31edo) with per-file LICENSE.md attribution
  - Phase-1 stub kernel (src/lib/example.ts + test) deleted
affects:
  - 02-02-PLAN (Interval primitive — needs R-01 enforced + first real test for Vitest discovery)
  - 02-04-PLAN (.scl parser/serializer — consumes the fixture corpus)
  - 02-06-PLAN (audio pages — Vitest src/audio/ glob ready)
  - 02-07-PLAN (composition anchor — KaTeX prose rendering ready)

# Tech tracking
tech-stack:
  added:
    - katex@0.16.45 (CSS via CDN, JS lazy-loaded by Framework on first `tex` cell use)
  patterns:
    - "Framework `head:` config injection for third-party CSS with SRI integrity hash"
    - "ESLint `no-restricted-imports` as enforcement of architectural decisions (R-01: BigInt-Fraction discipline)"
    - "Test-fixture corpus colocated under src/lib/__tests__/fixtures/ (synthetic edge cases) and .../golden/ (real-world archive samples)"

key-files:
  created:
    - src/lib/__tests__/fixtures/F01-simple-7limit.scl
    - src/lib/__tests__/fixtures/F02-cents-only.scl
    - src/lib/__tests__/fixtures/F03-mixed-ratio-cents.scl
    - src/lib/__tests__/fixtures/F04-trailing-dot.scl
    - src/lib/__tests__/fixtures/F05-leading-dot.scl
    - src/lib/__tests__/fixtures/F06-bare-integer.scl
    - src/lib/__tests__/fixtures/F07-comments-everywhere.scl
    - src/lib/__tests__/fixtures/F08-bohlen-pierce.scl
    - src/lib/__tests__/fixtures/F09-whitespace-and-trailing-text.scl
    - src/lib/__tests__/fixtures/F10-empty-description.scl
    - src/lib/__tests__/fixtures/F11-mismatched-pitch-count.scl
    - src/lib/__tests__/fixtures/F12-negative-ratio.scl
    - src/lib/__tests__/fixtures/F13-multi-slash.scl
    - src/lib/__tests__/fixtures/F14-large-numerator.scl
    - src/lib/__tests__/fixtures/F15-crlf-line-endings.scl
    - src/lib/__tests__/fixtures/F16-bom.scl
    - src/lib/__tests__/fixtures/golden/partch_43.scl
    - src/lib/__tests__/fixtures/golden/slendro.scl
    - src/lib/__tests__/fixtures/golden/young_lm.scl
    - src/lib/__tests__/fixtures/golden/12-just-chromatic.scl
    - src/lib/__tests__/fixtures/golden/31edo.scl
    - src/lib/__tests__/fixtures/golden/LICENSE.md
  modified:
    - observablehq.config.ts
    - vitest.config.ts
    - eslint.config.js
  deleted:
    - src/lib/example.ts
    - src/lib/__tests__/example.test.ts

key-decisions:
  - "Honored D-23: KaTeX 0.16.45 CSS-only head injection via SRI-pinned CDN (sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM); no auto-render JS"
  - "Honored R-01: ESLint no-restricted-imports rule blocks `Fraction` from `xen-dev-utils` repo-wide (kept active in test files since no kernel test legitimately needs that import)"
  - "Honored Phase 1 D-07 extension: Vitest include glob now covers src/lib/__tests__/, src/audio/__tests__/, and src/__tests__/"
  - "Honored Phase 2 CONTEXT §Reusable Assets: deleted src/lib/example.ts + example.test.ts Phase-1 placeholders"
  - "Sourced 3 golden archive files directly from the live Huygens-Fokker scales.zip archive (HTTPS fetch succeeded). Used slendro_av.scl (Surjodiningrat 1993, cents-mostly) renamed to slendro.scl, and young-lm_piano.scl renamed to young_lm.scl. Documented per-file source + license in golden/LICENSE.md"

patterns-established:
  - "head-injection pattern: CDN URL + SRI integrity hash in observablehq.config.ts `head:` string"
  - "test-glob-extension pattern: vitest.config.ts `include` array adds new test directories as the codebase grows (no per-file rebuild)"
  - "lint-as-architectural-enforcement pattern: critical decisions (e.g. BigInt-Fraction discipline) are codified as eslint.config.js rules, not just docs"
  - "golden-corpus pattern: real-world reference files committed alongside synthetic edge-cases; LICENSE.md tracks per-file source + license"

requirements-completed:
  - NOTES-02
  - IO-05

# Metrics
duration: 4min
completed: 2026-05-04
---

# Phase 02 Plan 01: Foundation — KaTeX, Vitest, R-01, Fixtures Summary

**KaTeX 0.16.45 CSS head-injected, Vitest discovers three test directories, R-01 ESLint rule blocks the wrong Fraction import, Phase-1 stubs deleted, and the full 22-file .scl fixture corpus (16 synthetic + 5 golden + LICENSE) is on disk and ready for Plan 04.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-04T17:21:40Z
- **Completed:** 2026-05-04T17:25:34Z
- **Tasks:** 2
- **Files modified:** 27 (3 modified, 22 created, 2 deleted)

## Accomplishments

- KaTeX CSS link with SRI integrity hash present in `dist/index.html` after `npm run build` (verified)
- Vitest `include` glob extended with three directories — ready for kernel, audio, and root-level tests
- ESLint `no-restricted-imports` rule installed and active; `import { Fraction } from "xen-dev-utils"` would now error
- Phase-1 placeholder kernel + test (`src/lib/example.ts`, `src/lib/__tests__/example.test.ts`) deleted from disk
- 16 synthetic `.scl` edge-case fixtures (F01–F16) created exactly per RESEARCH.md spec — including BigInt-boundary `2147483648/2147483647`, CRLF line endings (verified by `file`), UTF-8 BOM (verified by `xxd`), tab whitespace, error cases (negative ratio, multi-slash, mismatched count)
- 5 golden-corpus archive samples sourced from the live Huygens-Fokker `scales.zip` (HTTPS fetch succeeded; no synthetic fallback needed for the three named archive files)
- Per-file LICENSE.md attributes Huygens-Fokker source for `partch_43.scl`, `slendro.scl` (originally `slendro_av.scl`, renamed), `young_lm.scl` (originally `young-lm_piano.scl`, renamed); `12-just-chromatic.scl` and `31edo.scl` authored for this project (MIT)

## Task Commits

1. **Task 1: Wire KaTeX, extend Vitest, add R-01 lint rule, drop Phase-1 stubs** — `23d7ac9` (chore)
2. **Task 2: Seed .scl fixture corpus** — `e2462b0` (feat)

_Plan metadata commit follows after this SUMMARY is written._

## Files Created/Modified

**Modified:**

- `observablehq.config.ts` — added `head:` field with KaTeX 0.16.45 CSS link + SRI hash; preserved `pages: []` for Plan 07
- `vitest.config.ts` — extended `include` array from 2 to 5 globs covering src/lib, src/audio, src/__tests__
- `eslint.config.js` — appended a new flat-config block adding `no-restricted-imports` rule for R-01 enforcement

**Deleted:**

- `src/lib/example.ts` — Phase-1 BOOT-03 placeholder kernel (no longer needed)
- `src/lib/__tests__/example.test.ts` — Phase-1 BOOT-03 placeholder test (no longer needed)

**Created (22 files under src/lib/__tests__/fixtures/):**

- 16 synthetic edge-case fixtures: F01-simple-7limit, F02-cents-only, F03-mixed-ratio-cents, F04-trailing-dot, F05-leading-dot, F06-bare-integer, F07-comments-everywhere, F08-bohlen-pierce, F09-whitespace-and-trailing-text, F10-empty-description, F11-mismatched-pitch-count, F12-negative-ratio, F13-multi-slash, F14-large-numerator, F15-crlf-line-endings, F16-bom
- 5 golden-corpus files under `golden/`: partch_43.scl, slendro.scl, young_lm.scl, 12-just-chromatic.scl, 31edo.scl
- `golden/LICENSE.md` — per-file source + license attribution

## Decisions Made

- **Used live Huygens-Fokker archive fetch** rather than the synthetic-fallback path. The plan allowed either; HTTPS fetch of `scales.zip` (1.6 MB) succeeded with 200 status, so the canonical files were copied into the golden corpus. This means future maintainers can verify by re-fetching from the same URL.
- **Slendro variant choice:** the archive has many slendro files; selected `slendro_av.scl` (W. Surjodiningrat et al., 1993, average of 30 measured slendro gamelans, all-cents format) and renamed to `slendro.scl` because it best matches RESEARCH.md's "cents-mostly" guidance and exercises the cents-detection path with no ratio mixing.
- **Young Well-Tuned Piano choice:** archive has both `young-lm_piano.scl` and `young-lm_guitar.scl`; chose the piano file (rationals only, large numerators like 1323/1024 — exactly the BigInt stress-test the spec calls for) and renamed to `young_lm.scl`.
- **Kept R-01 rule active in test files** (no test-file relaxation override). Plan 02+ kernel tests will only need the BigInt-backed `fraction.js` Fraction; there is no legitimate reason for a test to import the xen-dev-utils Fraction.

## Deviations from Plan

None — plan executed exactly as written. All four CI gates pass on the per-task checks (`lint:types`, `lint`, `format:check`, `build`). One predicted edge case (Vitest exiting with code 1 on empty include match) materialized exactly as the plan anticipated and is resolved by Plan 02 adding the first real test file (the plan's verification block explicitly notes "if Vitest errors on empty suite, leave Plan 02 to create the first real test in same wave timing").

## Issues Encountered

- **Vitest exits with code 1 on zero-tests-matched** (`No test files found, exiting with code 1`). Anticipated by the plan; resolved by Plan 02 (first real test file). Not a regression — Phase-1 stub deletion + Phase-2 first-test-not-yet-written is the cause, and is the expected wave timing.
- **Observable Framework auto-discovers `LICENSE.md`** under `src/` and renders it as a page (`dist/lib/__tests__/fixtures/golden/LICENSE.html`). Acceptable side-effect — the LICENSE markdown is valid and renders cleanly. If undesired in the future, add `src/lib/__tests__/**/*.md` to the Framework's exclude list (deferred — non-blocking).

## User Setup Required

None — no external service configuration required. All wiring is local config + static files.

## Next Phase Readiness

- **Plan 02 (Interval primitive)** is unblocked: R-01 rule enforces correct `Fraction` import; Vitest will discover the first real test under `src/lib/__tests__/`.
- **Plan 04 (.scl parser/serializer)** is unblocked: 16 synthetic + 5 golden fixtures ready to iterate. F11/F12/F13 provide error-path test cases; F14 provides the BigInt-boundary stress test; F15/F16 provide the encoding stress tests.
- **Plan 06 (audio)** is unblocked at the test-discovery layer: `src/audio/__tests__/**/*.test.ts` now in Vitest's `include` glob.
- **Plan 07 (composition anchor pages)** is unblocked at the prose-math layer: KaTeX CSS is in the rendered HTML, so any `${tex\`...\`}` cell in a Markdown page will render styled.

## Self-Check: PASSED

Verified on disk:

- `observablehq.config.ts`: FOUND (contains `katex@0.16.45/dist/katex.min.css`)
- `vitest.config.ts`: FOUND (contains `src/__tests__/**/*.test.ts`)
- `eslint.config.js`: FOUND (contains `no-restricted-imports`)
- `src/lib/example.ts`: DELETED (confirmed absent)
- `src/lib/__tests__/example.test.ts`: DELETED (confirmed absent)
- 22 files under `src/lib/__tests__/fixtures/` (16 F-series + 5 golden + 1 LICENSE.md): all FOUND
- F14 contains `2147483648/2147483647`: FOUND
- F15 has CRLF line terminators per `file` output: FOUND
- F16 has UTF-8 BOM (`efbb bf` prefix per `xxd`): FOUND
- `dist/index.html` contains `katex@0.16.45` after `npm run build`: FOUND

Verified in git log:

- Commit `23d7ac9` (Task 1): FOUND
- Commit `e2462b0` (Task 2): FOUND

---

_Phase: 02-math-kernel-composition-anchor-mvp_
_Completed: 2026-05-04_
