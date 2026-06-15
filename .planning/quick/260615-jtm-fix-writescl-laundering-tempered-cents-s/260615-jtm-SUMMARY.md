---
quick_id: 260615-jtm
title: Fix writeScl laundering tempered/cents scales into fake exact ratios
status: complete
date: 2026-06-15
tasks_completed: 3
tasks_total: 3
---

# Quick Task 260615-jtm — Summary

**Finding #1:** `writeScl` (src/lib/scala.ts) serialized *every* `Interval` as a ratio
via `formatRatio` (`${n}/${d}`), even when the interval was derived from a cents
value. A tempered/EDO pitch (e.g. `408.0` → a float-derived `Fraction`) was thus
laundered into a bogus high-limit "exact" JI ratio on export. Fixed by tracking
ratio-vs-cents provenance per `Interval` and emitting cents-of-record for
cents-source degrees.

## What changed

### Task 1 — `src/lib/interval.ts`: per-interval provenance
- Added exported `type IntervalSource = "ratio" | "cents"`.
- Added `readonly source: IntervalSource` to `Interval`, set via an **optional
  second constructor param defaulting to `"ratio"`**: `constructor(input, source = "ratio")`.
- Backward-compatible: all ~99 existing `new Interval(...)` call sites compile
  unchanged (confirmed by the full suite staying green). `static fromMonzo` and
  all arithmetic ops (`mul`/`div`/`inv`/`octaveReduce`) produce `"ratio"` results
  — D-24 immutability preserved (source set once at construction).

### Task 2 — `src/lib/scala.ts`: tag at parse time + provenance-aware serializer
- `parsePitchToken` now tags the **dotted-cents path** as `new Interval(ratioFloat, "cents")`.
  Ratio and monzo bra-ket paths stay `"ratio"`.
- New `formatPitch(iv)` helper branches per-interval: `iv.source === "cents"` →
  `iv.cents.toFixed(6)` (a dotted decimal, so the receiver's D-19 cents-detection
  fires on re-parse); else `formatRatio(iv)` (exact `n/d`). `writeScl` calls
  `formatPitch` instead of `formatRatio`. Mirrors `serializeDegrees` in
  scala-archive.ts but with **per-interval** provenance (strictly better than the
  scale-wide `tempered` flag — a mixed scale emits cents AND ratios in one file).
- Updated the now-stale header comments (lines ~17-23 and ~138-144) that claimed
  provenance was NOT tracked.

### Task 3 — `src/lib/__tests__/scala.test.ts`: round-trip pinning test
New `describe("writeScl cents provenance (finding #1)")` block, 4 assertions:
1. A cents scale (`F02-cents-only.scl`, 12-TET) exports as dotted 6-dp cents on
   every pitch line and does **not** match a laundered high-limit ratio
   (`/\d{4,}\/\d{4,}/`).
2. `parseScl(writeScl(centsScale))` re-detects cents — reparsed degrees have
   `source === "cents"` and cents close to the originals (~3 dp; float→Fraction→float).
3. Regression: an all-ratio scale stays `n/d`, no dotted-cents leak.
4. Mixed scale (`F03-mixed-ratio-cents.scl`) emits BOTH dotted cents and `n/d`
   ratios in the same file; `9/8` survives as a ratio, `408¢` as cents.
Also added provenance-tagging unit tests for `parsePitchToken` and a `writeScl`
per-interval branch test.

## Scope boundaries (intentional, not gaps)
- Provenance is set **only** at the parse-time path the task named (`parsePitchToken`).
- Arithmetic ops (`mul`/`div`/`rotate`/`reduce`/`transpose`) intentionally drop
  provenance to `"ratio"` — a transposed/reduced cents pitch is no longer the same
  pitch.
- Generators (`jiSubsetOfEdo` and `scale-compare.ts`'s float-derived `Interval`)
  stay `"ratio"` — they produce genuine approximated ratios. Threading provenance
  through arithmetic/generators is a documented follow-up, not this fix.

## Verification
- `npx tsc --noEmit`: zero errors in `src/lib/scala.ts` / `src/lib/interval.ts`
  (remaining tsc output is pre-existing Framework `npm:`-specifier noise in
  synth.ts/lattice.ts/scale-compare.ts, untouched here).
- `npx vitest run`: full project suite **701 tests / 50 files green**.

## Commits (code only — squashed into the worktree merge `946a624`)
- `e08a49a` test: failing tests for Interval.source provenance
- `ef25c22` feat: immutable per-interval source provenance
- `228625a` test: failing tests for parse-tag + writeScl cents branch
- `0a5b47f` feat: make writeScl provenance-aware (stop laundering cents)
- `a7935b6` test: pin cents-provenance round-trip (finding #1)

Merged to `main` via `946a624` (`chore: merge quick task worktree (260615-jtm)`).

## Deviations
None affecting code. Orchestrator note: the executor's SUMMARY.md was untracked in
the worktree and removed with `git worktree remove --force` (rescue step skipped);
this SUMMARY.md was reconstructed by the orchestrator from the verified merged tree.
