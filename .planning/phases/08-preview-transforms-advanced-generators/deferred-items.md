# Deferred Items — Phase 08

Out-of-scope discoveries logged during execution (SCOPE BOUNDARY rule). NOT fixed
by the plan that found them.

## Pre-existing `lint:types` (`tsc --noEmit`) errors

Found during 08-02 execution. These exist at base commit `73c380a` in files NOT
touched by plan 08-02 — out of scope.

- `src/audio/synth.ts(29,77)`: TS2307 — `Cannot find module 'npm:sw-synth'`. The
  `npm:` prefix is a Framework runtime resolver scheme; `tsc` does not understand
  it (vitest aliases it for tests). Known tradeoff documented in vitest.config.ts.
- `src/components/lattice.ts(32,66)`: TS2307 — `Cannot find module 'npm:ji-lattice'`.
  Same `npm:`-prefix cause.
- `src/components/lattice.ts(197,28)` and `(198,28)`: TS7006 — `Parameter 'v'
  implicitly has an 'any' type` (the `xs.map((v) => v.x)` / `ys.map((v) => v.y)`
  closures — `Vertex` type not inferred through the d3 selection).
- `src/components/scale-compare.ts(38,23)`: TS2307 — `Cannot find module
  'npm:@observablehq/plot'`. Same `npm:`-prefix cause.

Note: plan 08-02's own files (`circle-of-pitches.ts`, `scale-transform-strip.ts`)
introduce zero new `tsc` errors.
