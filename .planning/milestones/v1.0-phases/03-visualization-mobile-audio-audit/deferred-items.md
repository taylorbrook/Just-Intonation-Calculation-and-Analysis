# Phase 03 — Deferred Items

Out-of-scope discoveries during execution; not addressed in the current plan.

## From Plan 04 (lattice + lattice.css)

### 1. Pre-existing ESLint error in `src/audio/__tests__/synth.test.ts:444`

- **Rule:** `@typescript-eslint/no-unnecessary-type-assertion`
- **Snippet:** `(globalThis as unknown as { document?: unknown }).document = originalDoc as Document;`
- **Why pre-existing:** introduced by Plan 03's `ce74fac` (post-merge TS-strict adjustment) and `584ffb6` (Plan 03 Task 2 commit). Not modified by Plan 04. Verified via `git log --oneline src/audio/__tests__/synth.test.ts` — last touch was Plan 03.
- **Why deferred:** scope-boundary rule — Plan 04 only touches `src/components/lattice.ts` + `src/components/lattice.css`. Fixing this requires editing `src/audio/__tests__/synth.test.ts` (out-of-scope file) and would also trip the same Rule-3 deviation Plan 03 documented.
- **Recommended fix when picked up:** drop the `as Document` cast (the LHS slot accepts `unknown`, so the assertion is redundant). Same pattern as the four other sites Plan 03 fixed in deviation #2.
