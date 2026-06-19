---
quick_id: 260619-f7n
title: Apply src/lib review findings S1–S3 + D1
status: complete
date: 2026-06-19
source_review: .planning/quick/260618-wgg-.../260618-wgg-REVIEW.md
---

# Summary — Quick Task 260619-f7n

Behavior-preserving refactor of the `src/lib` math kernel applying findings
**S1, S2, S3, and D1** from the 260618-wgg review. The existing 753-test suite was
the regression gate — green at every step. Net `src/lib`: **−58 LOC** (165 ins /
223 del across 15 files).

## What changed (atomic commits, each test-gated)

| Commit | Finding | Change |
|--------|---------|--------|
| `6abe6e2` | **S3** | Export immutable `UNISON`/`OCTAVE` singletons from `interval.ts`; adopt in mos/generators/harmonic/constant-structure/sonicweave/cps (+ scale/edo/scala in later commits), removing 6 local re-declarations + per-call `new Interval("2/1")` in `octaveReduce`. |
| `fc3c802` | **S1** | Add `Interval.key` (canonical `n/d`) + exported `finalizeScale(intervals, period, {sort})` in `scale.ts`. Route `Scale.reduce`, `jiSubsetOfEdo`, `cps`, `harmonic.foldToOctave`, `generators.foldExactSet`, `edo.bestJiInEdo` through it; modernize `Scale.dedupe` O(n²) `.some(equals)` → Set<key>. Also fixed the stale `maxExponent=8`→`5` doc nit. |
| `e54dbe5` | **S1** | Follow-up: route the last builder, `mos.buildMos` (the lone `${n}/${d}` idiom), through `finalizeScale` too. |
| `4d68a05` | **S2** | Hoist verbatim-duplicated `utf8ByteLength` + `normalizeLines` + a shared `MAX_FILE_INPUT_BYTES` into `text.ts`; `scala.ts`/`kbm.ts` import them, `scala-archive.ts` uses `normalizeLines()`. |
| `90362ae` | **D1** | Delete dead re-exports `monzoAdd`/`monzoSub`/`monzoScale`/`wilsonHeight` from `monzo.ts` (0 repo-wide consumers); update `INVENTORY.md`. |
| `dfe6e1e` | — | Comment-only: refresh cps/generators headers to cite `finalizeScale`/`Interval.key`. |

## Outcome

- **Dedupe→sort→append-period unified:** all 7 scale builders now call one
  `finalizeScale`; `scale.ts` is the only module with dedupe logic. The 3 former
  key idioms (`toFraction()` ×6, `${n}/${d}` ×1, `.some(equals)` ×2) collapsed to
  one canonical `Interval.key`. The two O(n²) `.some(equals)` passes are gone.
- **Text helpers de-duplicated** into the existing `text.ts`; 0 literal BOM bytes
  (BOM referenced only via the `\uFEFF` escape, per project hygiene).
- **Dead surface trimmed:** 4 unused re-exports removed.

## Verification

- `npm test` green after every commit.
- Final **`npm run ci` exit 0**: tsc `--noEmit`, **753/753** vitest, eslint,
  prettier `--check`, observable build (140 links validated).
- No behavior change — purely structural; the test suite count is unchanged (753).
