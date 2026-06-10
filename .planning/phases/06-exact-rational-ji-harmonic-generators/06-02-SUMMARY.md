---
phase: 06-exact-rational-ji-harmonic-generators
plan: 02
subsystem: math-kernel
tags: [ji, harmonic, subharmonic, ado, afdo, isoharmonic, bigint, generators]
requires:
  - "src/lib/interval.ts (Interval + octaveReduce + fraction.n/d BigInt access)"
  - "src/lib/scale.ts (Scale constructor + period contract)"
provides:
  - "harmonicSegment(lo, hi, reduce) — exact otonal segment (GEN-02)"
  - "subharmonicSegment(lo, hi, reduce) — exact utonal mirror (GEN-02)"
  - "adoScale(divisions, equave) — BigInt-exact arithmetic division of any equave (GEN-03)"
  - "isoharmonic(start, diff, count, reduce) — exact integer-frequency arithmetic chord (GEN-03)"
affects:
  - "src/components/generate-harmonic.ts (Plan 06 — consumes the four builders)"
tech-stack:
  added: []
  patterns:
    - "Literal-overtone-form default (D-04) with per-method reduce-to-octave toggle"
    - "Exact n/d Set-dedupe (Pitfall #1/#6); cents used ONLY as a sort key"
    - "Defense-in-depth integer-enumeration caps BEFORE the loop (T-06-03)"
    - "General arithmetic equave division via (divisions·q + k·(p−q))/(divisions·q) BigInt"
key-files:
  created:
    - "src/lib/harmonic.ts"
    - "src/lib/__tests__/harmonic.test.ts"
  modified:
    - "src/lib/INVENTORY.md"
decisions:
  - "adoScale divides the FULL [1, equave] span arithmetically (not the fixed octave): degree k = (D·q + k·(p−q))/(D·q). For equave 2/1 this is exactly the verified AFDO-6 (D+k)/D vector; for a non-octave equave (e.g. 3/1) the top degree lands exactly on the equave — fixing a latent design smell where the first cut appended a redundant 2/1 inside a 3/1-period scale."
  - "subharmonicSegment built as hi/h (h descending hi..lo) — the canonical ascending utonal mirror spanning the same octave as the harmonic segment (RESEARCH A-3), rather than the sub-unison lo/h form."
metrics:
  duration: 4min
  completed: 2026-06-10
  tasks: 2
  files: 3
---

# Phase 6 Plan 02: Harmonic-Division Kernel Family Summary

Exact integer-derived overtone scales — `harmonicSegment`, `subharmonicSegment`, `adoScale`, `isoharmonic` — in one ~210-line `harmonic.ts`. All BigInt-exact, deduped by exact `n/d` (never cents tolerance), literal-overtone-form by default with a per-method reduce-to-octave toggle (D-04), and defense-in-depth RangeError caps before any enumeration (T-06-03). Reproduces the verified AFDO-6 vector and the harmonic 8..16 segment exactly.

## What Was Built

- **`src/lib/harmonic.ts`** — four exported builders:
  - `harmonicSegment(lo, hi, reduce = false): Scale` — otonal `h/lo` for h in lo..hi (fraction.js auto-reduces `16/8` → `2/1`). Default literal form; the top interval is the period (D-14).
  - `subharmonicSegment(lo, hi, reduce = false): Scale` — utonal mirror `hi/h` for h descending hi..lo; same octave span as the harmonic segment, inverted interval sequence (RESEARCH A-3).
  - `adoScale(divisions, equave): Scale` — arithmetic division of the full `[1, equave]` span. Degree k = `(D·q + k·(p−q))/(D·q)` (BigInt-exact); intrinsically one equave, so NO reduce flag (D-04).
  - `isoharmonic(start, diff, count, reduce = false): Scale` — integer-frequency arithmetic chord; members `start, start+diff, …` over `start` (e.g. 4:5:6:7).
  - Shared `foldToOctave(intervals)` helper for the `reduce === true` path: `octaveReduce(2/1)` → Set-dedupe on exact `n/d` → sort by cents → append 2/1 (D-14).
- **`src/lib/__tests__/harmonic.test.ts`** — 17 tests: the two load-bearing exact vectors (harmonicSegment 8..16, adoScale 6), subharmonic utonal mirror, isoharmonic 4:5:6:7 + a 3:5:7:9 variant, the literal-vs-reduced default proof, reduce-flag cents-bounds + dedupe, and the full RangeError cap matrix for all four builders.
- **`src/lib/INVENTORY.md`** — new `### Phase 6 — harmonic-division family` subsection with one row per builder (Source = Custom; D-04 reduce default + Pitfall #1/#6 dedupe + T-06-03 caps noted).

## Verification

- `npx vitest run src/lib/__tests__/harmonic.test.ts` — 17/17 pass.
- `npx tsc --noEmit` — clean (exit 0).
- `npx eslint src/lib/harmonic.ts` — clean (exit 0; no xen-dev-utils `Fraction` import, R-01 satisfied; the `.eslintignore` deprecation warning is pre-existing repo-wide noise, not a lint error on this file).
- Full suite `npx vitest run` — 422/422 pass, no regressions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] adoScale must divide the full `[1, equave]` span, not the fixed octave**
- **Found during:** Task 2 (GREEN) — the plan's literal step `Interval("${divisions + k}/${divisions}")` always tops out at `(2·divisions)/divisions = 2/1` regardless of the `equave` param. The first cut handled this by appending the passed equave when it differed from 2/1, producing a malformed scale like `[1/1, 4/3, 5/3, 2/1, 3/1]` for `adoScale(3, 3/1)` — a 2/1 sitting *inside* a 3/1-period scale.
- **Issue:** `(divisions + k)/divisions` is the arithmetic-division-of-the-**octave** formula; it ignores the equave argument the signature accepts. The verified AFDO-6 vector is the octave special case, but the builder takes an arbitrary `equave: Interval`.
- **Fix:** Generalized to the exact arithmetic division of `[1, E]` where `E = p/q`: degree k = `1 + k·(E−1)/divisions = (D·q + k·(p−q))/(D·q)`, computed BigInt-exact via `fraction.n`/`fraction.d`. For `equave = 2/1` (p=2, q=1) this collapses to `(divisions + k)/divisions` — the verified vector unchanged. For `equave = 3/1` the top degree lands exactly on `3/1`. Added an `equave > 1/1` guard.
- **Files modified:** src/lib/harmonic.ts (adoScale body + doc-comment); test expectation for the 3/1 case corrected to the true `[1/1, 5/3, 7/3, 3/1]` (my own RED-phase test comment had described the buggy behavior).
- **Commit:** 0430283

## Decisions Made

- **adoScale divides the full equave span arithmetically** (see deviation 1) — keeps the verified AFDO-6 vector exact while making the `equave` param genuinely meaningful for non-octave divisions (e.g. arithmetic division of a 3/1 tritave).
- **subharmonicSegment as `hi/h` (h descending)** — the canonical ascending utonal segment is the exact mirror of the harmonic segment over the same octave `[1, 2]`. The alternative `lo/h` (descending sub-unison) form was rejected: it produces ratios ≤ 1/1, which would need inversion + octave-placement to ascend, yielding the identical pitch classes via a less direct construction.

## Threat Surface

Both `mitigate` dispositions from the plan's threat register are implemented:
- **T-06-03 (DoS):** `MAX_HARMONIC = 1024`, `MAX_DIVISIONS = 1000`, `MAX_ISO_COUNT = 1024` enforced with RangeError BEFORE any enumeration loop in all four builders. Tested: `lo < 1`, `hi <= lo`, `hi > 1024`, `divisions < 1`, `divisions > 1000`, `count > 1024`, `start < 1`, `diff < 1` all throw.
- **T-06-04 (exact-rational integrity):** dedupe keyed strictly on `fraction.toFraction()` (`n/d`); the only float is `iv.cents` used as a sort key. Tested via the reduce-flag dedupe case (octave-equivalents collapse with no duplicate `n/d`).

No new security surface beyond the plan's threat model. No new dependencies (T-06-SC: uses only existing `Interval` / `Scale` kernel imports — no npm install).

## Known Stubs

None — all four builders are complete, fully-wired kernel primitives with no placeholder data paths.

## Self-Check: PASSED

- FOUND: src/lib/harmonic.ts
- FOUND: src/lib/__tests__/harmonic.test.ts
- FOUND: src/lib/INVENTORY.md (four harmonic rows under Phase 6 section)
- FOUND commit ad89665 (test — RED)
- FOUND commit 0430283 (feat — GREEN)

## TDD Gate Compliance

- RED gate: `ad89665` `test(06-02): add failing harmonic-family verified-vector tests` (confirmed failing — `harmonic.js` unresolvable).
- GREEN gate: `0430283` `feat(06-02): implement exact harmonic-division kernel (GEN-02, GEN-03)` (all 17 tests pass).
- REFACTOR: not needed — the adoScale generalization was folded into the GREEN commit (it was a correctness fix, not post-green cleanup).
