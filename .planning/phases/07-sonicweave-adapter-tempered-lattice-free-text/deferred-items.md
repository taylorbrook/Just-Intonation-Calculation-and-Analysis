# Phase 07 — Deferred Items

Out-of-scope discoveries logged during plan execution (not fixed; scope boundary).

## Pre-existing lint errors in npm:-import files (logged by Plan 07-03)

`npm run lint` reports 87 `@typescript-eslint/no-unsafe-*` errors, ALL confined to
three pre-existing files that import Framework `npm:`-resolved libraries whose type
packages are not resolvable under bare `tsc`/`eslint` in the worktree:

- `src/audio/synth.ts` (`npm:sw-synth`)
- `src/components/lattice.ts` (`npm:ji-lattice`)
- `src/components/scale-compare.ts` (`npm:@observablehq/plot`)

These resolve correctly at Framework build time (esbuild handles `npm:` specifiers)
but appear as `error typed` under the standalone lint/type-check. They are NOT
introduced by Plan 07-03 (which touched only `generate-fokker.*`,
`generate-sonicweave.*`, and their tests — all lint-clean). Pre-existing on base
commit `df6977a`. No file Plan 07-03 modified appears in the error list.

**Disposition:** out of scope for Plan 07-03 (scope boundary — only auto-fix issues
directly caused by the current task). Surface to the phase verifier / a future
tooling-hygiene task.
