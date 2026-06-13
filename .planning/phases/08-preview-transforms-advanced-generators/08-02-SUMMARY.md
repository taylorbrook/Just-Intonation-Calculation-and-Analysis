---
phase: 08-preview-transforms-advanced-generators
plan: 02
subsystem: ui
tags: [svg, web-audio, vitest, happy-dom, tempered-scale, pattern-2-factory, observable-framework]

# Dependency graph
requires:
  - phase: 02-ji-kernel-viz-foundation
    provides: "Scale.rotate/reduce/dedupe/transpose immutable kernel methods + Interval.cents/centsFrom12tet/fraction projections"
  - phase: 05-generate-surface-live-integration-foundation
    provides: "05-UI-SPEC --theme-* design tokens; scaleTable tempered-vs-JI display discipline (D-01); SynthHandle page-owned audio boundary (D-08)"
provides:
  - "circleOfPitches(scale, synth, opts) — plain-SVG circle-of-pitches viz factory (SURF-05)"
  - "scaleTransformStrip(opts) — non-destructive rotate/reduce/dedupe/transpose overlay with setSource/getTransformedScale/getTempered/onChange surface (SURF-04)"
  - "Two CSS modules matching 05-UI-SPEC tokens; two Vitest (happy-dom) anchor test files"
affects: [08-03-shared-preview-wiring, generate-page-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Plain-SVG ring viz (createElementNS, cents/period angle, textContent labels, U+2212 minus) — clones spiral-of-fifths.ts/keyboard.ts; no d3"
    - "Display/audio split for tempered scales: cents-only LABEL but audio ratio stays Number(iv.fraction.valueOf())"
    - "Pattern-2 transform-strip orchestrator: closure-local TransformState re-derived from raw source each render (non-destructive overlay)"

key-files:
  created:
    - src/components/circle-of-pitches.ts
    - src/components/circle-of-pitches.css
    - src/components/__tests__/circle-of-pitches.test.ts
    - src/components/scale-transform-strip.ts
    - src/components/scale-transform-strip.css
    - src/components/__tests__/scale-transform-strip.test.ts
  modified: []

key-decisions:
  - "Mode <select> option VALUE is the rotate degree (0..N-1); Mode 1 of N = rotate(0) identity"
  - "Transpose n===d collapses to null (identity) so applyTransforms skips an unnecessary multiply-through"
  - "Tempered flag held at the component layer (not on Scale) and carried through getTempered()/onChange — never dropped"
  - "Dense-scale rim labels thinned past 24 degrees (drop every other label); tonic always keeps its label"

patterns-established:
  - "Pattern 1: plain-SVG ring with cents/period angle + faint 12-EDO ticks + lattice-style empty-state"
  - "Pattern 2: non-destructive transform overlay re-deriving applyTransforms(rawSource) on every control change"

requirements-completed: [SURF-04, SURF-05]

# Metrics
duration: 18min
completed: 2026-06-13
---

# Phase 8 Plan 02: Shared-Preview Components Summary

**Two Pattern-2 component factories — a plain-SVG circle-of-pitches viz (cents/period angle, D-01 tempered labels, click-audition) and a non-destructive rotate/reduce/dedupe/transpose strip carrying the tempered flag — built against the shipped Scale kernel so they run parallel to the generator plan.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-06-13T22:00:00Z (approx)
- **Completed:** 2026-06-13T22:06:07Z
- **Tasks:** 2 (both TDD)
- **Files created:** 6

## Accomplishments

- `circleOfPitches` renders N markers on a ring at `θ = iv.cents / scale.period.cents · 2π` (D-02 non-octave-aware — not a hard-coded 1200), faint 12-EDO reference ticks every 100¢, D-01 rim labels (ratio for JI / cents-only for tempered), hover `<title>` tooltip + highlight class (D-04), click/Enter/Space audition via the page-owned synth, and a lattice-style empty-state for unison-only scales (D-17). Tonic emphasis + dense-label thinning added as D-17 discretion.
- `scaleTransformStrip` is a Pattern-2 factory exposing `setSource(scale, tempered)` / `getTransformedScale()` / `getTempered()` / `onChange(cb)`. It re-derives `applyTransforms(rawSource)` (rotate→reduce→dedupe→transpose) from the ORIGINAL source on every control change (D-05 non-destructive), rebuilds the mode `<select>` ("Mode 1 of N … Mode N of N") on `setSource` (D-07), resets to identity (D-08), and carries the `tempered` flag through every transform (D-18 / SURF-06).
- Both behaviours are locked by happy-dom Vitest anchors (20 new tests); full suite grew 567 → 587, all green.

## Task Commits

Each task was committed atomically (TDD: test → feat):

1. **Task 1: circle-of-pitches.ts** — `bbcf6e1` (test, RED), `1d873a0` (feat, GREEN)
2. **Task 2: scale-transform-strip.ts** — `83b9f40` (test, RED), `7985f8b` (feat, GREEN)

## Files Created/Modified

- `src/components/circle-of-pitches.ts` — circleOfPitches plain-SVG ring viz factory (SURF-05)
- `src/components/circle-of-pitches.css` — circle viz styling matching 05-UI-SPEC tokens (D-17)
- `src/components/__tests__/circle-of-pitches.test.ts` — 10 happy-dom tests (5 behavior groups)
- `src/components/scale-transform-strip.ts` — non-destructive transform-strip orchestrator (SURF-04)
- `src/components/scale-transform-strip.css` — transform-strip styling matching 05-UI-SPEC tokens
- `src/components/__tests__/scale-transform-strip.test.ts` — 10 happy-dom tests (6 behavior groups + transpose)
- `.planning/phases/08-preview-transforms-advanced-generators/deferred-items.md` — logged pre-existing out-of-scope lint:types errors

## Decisions Made

- **Mode select value = rotate degree.** Option value is the raw degree (0..N-1) parsed directly (not via `clampPositiveInt`, which floors at 1 and would make degree 0 unreachable). "Mode 1 of N" = `rotate(0)` identity per scale.ts contract.
- **Transpose identity collapse.** `n === d` → `state.transpose = null` so `applyTransforms` skips the multiply-through; transposing by 1/1 is a true no-op.
- **Tempered flag at component layer.** The flag is stored in the strip's closure (not on `Scale`) and propagated via `getTempered()`/`onChange` — the kernel methods preserve the Hz-faithful BigInt fraction, the display flag just stays true (D-18, no kernel change).
- **D-17 viz discretion.** Tonic (1/1) marker gets a larger green dot; rim labels thin to every-other past 24 degrees so dense scales don't overlap; hover toggles a `--hover` class (with native `:hover` fallback in CSS).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworded `innerHTML` doc-comment to satisfy the grep==0 acceptance criterion**
- **Found during:** Task 1 (circle-of-pitches)
- **Issue:** The header docstring's "never `innerHTML`" mention made `grep -c 'innerHTML' == 1`, failing the acceptance criterion (which greps the literal token, including comments).
- **Fix:** Reworded the comment to "the unsafe-HTML sink is never used" — no behavioural change; the component already uses only `textContent`.
- **Files modified:** src/components/circle-of-pitches.ts
- **Verification:** `grep -c 'innerHTML' src/components/circle-of-pitches.ts` == 0; tests still green.
- **Committed in:** 1d873a0 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking, comment-only).
**Impact on plan:** Cosmetic — satisfies the source-assertion gate without altering behaviour. No scope creep.

## Issues Encountered

- **Pre-existing `lint:types` errors (out of scope).** `npm run lint:types` reports TS2307 (`npm:sw-synth`, `npm:ji-lattice`, `npm:@observablehq/plot` — the Framework `npm:`-prefix scheme `tsc` can't resolve) and two TS7006 implicit-`any` params in `lattice.ts`. All exist at base commit `73c380a` in files NOT touched by this plan, so per the SCOPE BOUNDARY rule they were logged to `deferred-items.md` and left unfixed. Plan 08-02's own files introduce ZERO new `tsc` errors (verified by grepping the tsc output for the two new filenames).

## TDD Gate Compliance

Both tasks followed RED → GREEN. Verified in git log: each `test(08-02): add failing test...` commit precedes its `feat(08-02): implement...` commit. No REFACTOR commit was needed (both implementations were clean on first GREEN). No test passed unexpectedly during RED (both RED runs failed on the missing module).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both components mount ONCE in the page's shared preview host (Plan 03 wiring) and apply uniformly to every generator family's output. `scaleTransformStrip.onChange(cb)` is the hook Plan 03 binds to re-render the shared circle + transformed table + Send-to.
- NOTE (carried from plan verification): click-to-audition Web Audio playback, hover highlight, and shared-preview reactivity are MANUAL-VERIFY (jsdom/happy-dom cannot assert Web Audio or Observable reactivity) — those checks live in Plan 03's human-verify task per 08-VALIDATION.md.

## Self-Check: PASSED

All 6 created source/test/CSS files + SUMMARY.md present on disk; all task commits (`bbcf6e1`, `1d873a0`, `83b9f40`, `7985f8b`) and the metadata commit (`081fd5b`) reachable in git log; working tree clean.

---
*Phase: 08-preview-transforms-advanced-generators*
*Completed: 2026-06-13*
