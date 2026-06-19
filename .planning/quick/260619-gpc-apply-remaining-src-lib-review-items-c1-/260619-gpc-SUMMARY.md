---
phase: quick-260619-gpc
plan: 01
type: execute
completed: 2026-06-19
tasks: 8
final_ci_exit: 0
---

# Quick 260619-gpc: Apply remaining src/lib review items (C1–C4, D3, B1, B2, Cleanup) Summary

Applied the eight remaining `src/lib` review items from 260618-wgg-REVIEW.md as eight
behavior-preserving atomic commits. All changes are consistency / DRY / doc-only — no
metric, algorithm, or output changes. `npm test` stayed 753/753 green after every commit
and `npm run ci` exits 0.

## Per-task outcomes

| # | Item | Outcome | Commit |
|---|------|---------|--------|
| 1 | C1 | Added `Interval.isAboveUnison()` (interval.ts, after `key` getter); routed the 4 "period > 1/1" guards through it in scale.ts (constructor), interval.ts (octaveReduce), harmonic.ts (adoScale), generators.ts (edScale). Removed now-unused `UNISON` import from harmonic.ts. Error messages + RangeError types byte-identical. | `68b41c0` |
| 2 | C2 | Added `Interval.isPositive()` (sign/zero based, `.s > 0n && .n !== 0n`); routed the two in-hand non-positive guards through `!isPositive()` — interval.ts octaveReduce and cps.ts factor check. Trimmed octaveReduce's redundant `.s/.n` spelling line to cite `isPositive()`. sonicweave + scala guards left untouched (no kernel Interval in hand). | `16de548` |
| 3 | C3 | `Interval.centsFrom12tet` getter now delegates to cents.ts `centsFrom12tet` (imported as `centsFrom12tetFn` from `./cents.js`). The `c - Math.round(c/100)*100` formula lives only in cents.ts; added a single-source-of-truth note there. tsc clean (no circular import). | `46d3438` |
| 4 | C4 | sonicweave.ts:132 sign test changed `f.s < 0n` → `f.s < 0` (Number comparison, matching the documented runtime-Number reality); `Number(f.n) === 0` unchanged; comment updated to drop the stale BigInt-literal reference. Behavior identical. | `235ee1b` |
| 5 | D3 | Deleted fokker.ts local `const PRIMES = [...]` + its doc line; added `import { PRIMES } from "./monzo.js"`. Same prime values, same indices; no public-surface change, no circular import. | `c28a15f` |
| 6 | B1 | edo.ts `bestEdosForScale`: extended the unison-inclusion comment block above `idealCentsList` to document the PERIOD endpoint inclusion too (accepted modeling choice — identical dilution across all EDOs, ranking unaffected, RMS/max slightly optimistic vs. body-only). Comment-only; no metric change. | `97e0990` |
| 7 | B2 | Added monotonic-insertion-order reliance notes at both `{ sort: false }` finalizeScale calls — scale.ts `jiSubsetOfEdo` and edo.ts `bestJiInEdo`. Comment-only; no logic change. | `971ce99` |
| 8 | Cleanup | Trimmed residual full re-descriptions of the dedupe→sort→append-period idiom toward "via the shared finalizeScale": cps.ts (header line 9 + inline comment at finalizeScale call), harmonic.ts (`foldToOctave` doc + body, kept the [1,2) pre-condition + Pitfall), generators.ts (`foldExactSet` doc + dropped redundant body comment, kept pre-condition + D-07/D-14), mos.ts (header `buildMos` tail description + buildMos inline comment, kept HAND-TRACE blocks). scale.ts left as-is (finalizeScale's canonical home — not redundant). Comment-only; no logic change. | `cf13894` |

## Verification

- `npm test`: 753/753 green after every one of the 8 commits.
- `npm run ci`: **exit 0** — tsc --noEmit clean, vitest 753/753, eslint clean, `prettier --check .` "All matched files use Prettier code style!", `observable build` succeeded (23 pages, 140 links validated). No separate formatting commit needed.

## BOM hygiene

Re-scanned the first 3 bytes of all 10 touched files after editing — none begins with the
UTF-8 BOM byte sequence (0xEF 0xBB 0xBF). All files remain BOM-free (each still starts with
`/**` = `2f 2a 2a`). No file gained a BOM.

## Deviations from plan

None of substance. Two plan-anticipated micro-decisions taken:
- Removed the now-unused `UNISON` import from harmonic.ts in Task 1 (required to keep eslint
  clean after the guard routed away from `UNISON.fraction`). scale.ts and generators.ts retain
  `UNISON` (still used elsewhere).
- C3 import aliased as `centsFrom12tetFn` (the plan's offered alias) to avoid any shadow against
  the `get centsFrom12tet()` accessor.

## Commits (in order)

1. `68b41c0` — C1
2. `16de548` — C2
3. `46d3438` — C3
4. `235ee1b` — C4
5. `c28a15f` — D3
6. `97e0990` — B1
7. `971ce99` — B2
8. `cf13894` — Cleanup

## Self-Check: PASSED

All 8 commits present in `git log`; working tree clean (only the untracked PLAN/SUMMARY docs
dir, handled by the orchestrator). `npm run ci` exit 0.
