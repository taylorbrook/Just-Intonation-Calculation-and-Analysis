---
quick_id: 260618-wgg
title: Code review + simplification pass on the repo
status: complete
date: 2026-06-19
---

# Summary — Quick Task 260618-wgg

**Deliverable:** review report only (no code changes). **Scope:** `src/lib` math
kernel (20 modules, ~3,482 LOC).

## What was done

- Clarified the ambiguous ask with the user → review-only, kernel-first.
- Read all 20 kernel modules + `INVENTORY.md`.
- Verified every quantitative claim via grep (duplication counts, unused-export usages).
- Wrote a ranked review: `260618-wgg-REVIEW.md`.

## Findings (headline)

No high-severity correctness bugs — the kernel is well-documented, defensive, and
heavily tested. The leverage is in simplification:

- **S1** — dedupe→sort→append-period tail duplicated **8×** in **3** dedupe idioms
  (incl. an O(n²) `.some(equals)` path in `Scale.reduce`/`dedupe`). Extract one helper +
  a canonical `Interval.key`.
- **S2** — `utf8ByteLength` + `normalizeLines` duplicated **verbatim** in `scala.ts`/`kbm.ts`
  (and inlined a 3rd time in `scala-archive.ts`); move to the existing `text.ts`.
- **S3** — export shared immutable `UNISON`/`OCTAVE` singletons (6 local re-decls +
  per-call inline allocations in hot loops).
- **D1** — `monzoAdd`/`monzoSub`/`monzoScale`/`wilsonHeight` are dead (zero usages
  repo-wide, including tests).
- Plus consistency unifications (C1–C4), `fokker` `PRIMES` reuse (D3), and a stale
  `maxExponent=8` doc comment (`scale.ts:179`).

## Changes committed

Docs only — `260618-wgg-{PLAN,REVIEW,SUMMARY}.md`. **No source files modified, no tests
run.** Suggested follow-up: scoped `/gsd-quick` to apply S1–S3 + D1, each verified
against `src/lib/__tests__`.
