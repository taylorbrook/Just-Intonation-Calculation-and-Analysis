---
phase: quick-260512-f0z
plan: 01
subsystem: components
tags: [viz, svg, circle-of-fifths, pythagorean, geometry-kernel]
provides:
  - "src/components/spiral-of-fifths.ts: spiralOfFifths, spiralGeometry, closingErrorCents, SpiralStep, SpiralOfFifthsOpts"
  - "src/components/spiral-of-fifths.css: theme-token styles (.spiral-of-fifths-widget, .spiral-of-fifths__{node,dot,ratio,cents,wolf})"
requires:
  - "src/lib/interval.ts (Interval class for pure-3/2 chain)"
  - "src/lib/cents.ts (centsFrom12tet helper for tempered branch)"
affects: []
tech-stack:
  added: []
  patterns: [raw-svg-createElementNS, pure-geometry-kernel, TDD-RED-GREEN]
key-files:
  created:
    - src/components/spiral-of-fifths.ts
    - src/components/spiral-of-fifths.css
    - src/components/__tests__/spiral-of-fifths.test.ts
  modified: []
decisions:
  - "Geometry kernel exported as pure function (spiralGeometry) — testable without DOM, reusable by other viz contexts"
  - "Closure error sign convention: positive = fifths overshoot octave (Pythagorean comma → +23.46¢); documented in JSDoc"
  - "Tempered branch derives centsFrom12tet from OCTAVE-REDUCED cumulative cents (((c % 1200) + 1200) % 1200), not cumulative directly — matches pure branch at the cents level at small k"
  - "Auto-shrink dr = min(R_GROWTH_PER_WRAP, (R_MAX - R_BASE) / totalTurns) keeps r_n inside the half-viewBox for arbitrary n"
  - "Component returns HTMLDivElement (no <h2> chrome) — intentional, since component is not yet wired into a page"
metrics:
  duration: "~30 minutes"
  completed: "2026-05-12T17:59:30Z"
  tasks: 1
  files_changed: 3
  tests_added: 18
---

# Quick Task 260512-f0z: spiral-of-fifths component Summary

Built a reusable, self-contained circle/spiral-of-fifths SVG visualization component that exposes pitch-system closure errors (Pythagorean comma, syntonic comma, meantone wolf) as a first-class visual feature, with the geometry math testable in isolation via a pure kernel.

## What Was Built

**`src/components/spiral-of-fifths.ts`** — Three exports plus two interfaces:

- `spiralGeometry(n, fifthCents, tempered?: boolean): SpiralStep[]` — pure kernel returning `n+1` steps (k=0..n inclusive). Pure branch (default) uses the canonical Pythagorean chain `acc = acc.mul(new Interval("3/2")).octaveReduce()` so every step carries an exact `Interval`. Tempered branch (`tempered=true`) returns `ratio: null` for every step and derives `centsFrom12tet` from the octave-reduced cumulative cents.
- `closingErrorCents(n, fifthCents): number` — signed closure error. Positive = overshoot (pure 3/2 → +23.46¢ Pythagorean comma); zero = perfect closure (12-TET 700¢); negative = undershoot (1/4-comma meantone 696.578¢ → ≈-40.7¢).
- `spiralOfFifths(n, opts?): HTMLDivElement` — DOM factory that wraps the geometry kernel in raw-SVG nodes (`document.createElementNS` only — no D3). Optional `highlightWolf` draws a dashed chord between k=n and k=0 so the closure gap reads as a wolf line.

**`src/components/spiral-of-fifths.css`** — Theme-token styles using `var(--theme-blue)`, `var(--theme-foreground)`, `var(--theme-foreground-alt)`, `var(--theme-red, crimson)`, `var(--monospace)`, `color-mix(in oklab, ...)`. Mirrors the `keyboard.css` pattern; not auto-loaded — consumer page must opt in via `style:` frontmatter (deferred to a future wiring task).

**`src/components/__tests__/spiral-of-fifths.test.ts`** — 18 vitest cases under `@vitest-environment happy-dom`:

| Group | Cases |
|---|---|
| `closingErrorCents` | 3 (pure-3/2 Pythagorean comma, 12-TET zero closure, 1/4-comma meantone negative gap) |
| `spiralGeometry — pure 3/2` | 5 (length, step 0 identity, step 1 = 3/2 with ≈+1.955¢, full 7-step Pythagorean chain, step 12 ratio + angle gap) |
| `spiralGeometry — tempered branch` | 3 (12-TET 700¢ closes exactly, 701.955¢ matches pure-3/2 at k=1, meantone sits below 12-TET at k=1) |
| `spiralOfFifths` DOM smoke | 7 (HTMLDivElement, no `<h2>`, node count, wolf-chord toggle, tempered branch suppresses ratio labels, width forwarding) |

## Verification

- `npm test -- --run src/components/__tests__/spiral-of-fifths.test.ts` → **18/18 pass**
- `npm test` (full suite) → **293/293 pass across 23 files** (no regressions)
- `npm run lint:types` → 0 errors in `spiral-of-fifths.ts` / `spiral-of-fifths.test.ts` (5 pre-existing errors in `synth.ts` / `lattice.ts` / `scale-compare.ts` are out of scope per the executor scope-boundary rule)
- `npm run lint` → 0 errors attributable to spiral-of-fifths files (79 pre-existing errors in `synth.ts` / `lattice.ts` / `scale-compare.ts`)
- Anti-pattern grep gates (excluding comments) → no `from "d3"`, no `from "xen-dev-utils"`, no `innerHTML` in the component source
- `grep -rln "spiral-of-fifths" src/pages/` → 0 — component is not wired into any markdown page (per task constraint)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan test assertion was mathematically wrong for the Pythagorean-comma case**

- **Found during:** Task 1, GREEN phase (test execution against correct implementation).
- **Issue:** The plan asserted that after 12 chained pure 3/2 fifths the octave-reduced step-12 ratio is "1/1 exactly" (`s!.ratio?.equals(new Interval("1/1"))`). This is the opposite of what the Pythagorean comma demonstrates. `Interval.octaveReduce()` brings a ratio into `[1, 2)`. After 12 fifths the exact value is `3^12 / 2^19 = 531441/524288 ≈ 1.0136`, which is already in `[1, 2)` — so `octaveReduce` leaves it there. The expected exact ratio at k=12 is `531441/524288`, NOT `1/1`. (Verified empirically: ratio `531441/524288`, cents-from-12-TET `23.46¢` — the textbook Pythagorean comma value.)
- **Fix:** Changed the test assertion to `s!.ratio?.equals(new Interval("531441/524288"))` and added a comment explaining the math. The test's intent (exact ratio reveals the comma; angle gap also reveals the comma) is preserved and strengthened: now BOTH the ratio AND the wrapped angle witness the Pythagorean comma.
- **Implementation unchanged** — the implementation was correct; only the test contract was wrong.
- **Files modified:** `src/components/__tests__/spiral-of-fifths.test.ts` (one assertion + comment).
- **Commit:** `26517a6` (included in the feat commit since the test file change was part of restoring GREEN against correct math).

## Authentication Gates

None.

## Commits

| Commit | Type | Description |
|---|---|---|
| `7971323` | test | failing vitest spec for spiral-of-fifths (RED) |
| `26517a6` | feat | spiral-of-fifths.ts + .css implementation; test assertion correction (GREEN) |

## TDD Gate Compliance

- RED gate (`test:` commit) → `7971323` ✓
- GREEN gate (`feat:` commit) → `26517a6` ✓
- REFACTOR gate → not needed (implementation passed GREEN cleanly without restructuring).

## Known Stubs

None. The component is fully functional standalone. Page wiring is intentionally deferred — that is a separate task — but the component itself is complete; calling `spiralOfFifths(12)` produces a usable `HTMLDivElement`.

## Self-Check: PASSED

Files created (verified `[ -f ... ] && echo FOUND`):
- `src/components/spiral-of-fifths.ts` → FOUND
- `src/components/spiral-of-fifths.css` → FOUND
- `src/components/__tests__/spiral-of-fifths.test.ts` → FOUND

Commits (verified `git log --oneline | grep`):
- `7971323` → FOUND
- `26517a6` → FOUND
