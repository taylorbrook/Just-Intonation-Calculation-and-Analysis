---
phase: 04-analysis-sharing
plan: 02
subsystem: lib
tags: [mos, moment-of-symmetry, pythagorean, semi-convergents, fraction.js, scale, interval]

requires:
  - phase: 02-math-kernel
    provides: Interval (BigInt Fraction), Scale (period-aware reduce/dedupe/rotate)

provides:
  - "buildMos(generator, period, size): Scale — centered generator-stack + period-reduce + sort + dedupe + period-pin"
  - "nearestMosSize(generator, period, target): number — continued-fraction CONVERGENTS + SEMI-CONVERGENTS of log(generator)/log(period); canonical Pythagorean MOS sequence [2,3,5,7,12,17,29,41,53] for (3/2, 2/1)"
  - "chainLoFor lookup table for (3/2, 2/1) ↔ size {2,3,5,7,12} — hand-traced canonical mode selector"

affects: [04-03 (interval-explorer renderer can call buildMos directly), 04-07 (INVENTORY consolidation), 04-04 (research notebook chapters can audition Pythagorean MOS via buildMos)]

tech-stack:
  added: []
  patterns:
    - "ARCHITECTURE Pattern 1 (Interval composition): mos.ts only consumes Interval/Scale + fraction.js — no DOM, audio, or framework code (three-layer discipline)."
    - "D-11 hand-roll: MOS algorithm hand-rolled (~120 LOC) instead of pulling moment-of-symmetry@0.10.0 — peer-dep risk against xen-dev-utils@0.13 + Pitfall #5 wraps UPSTREAM-that-exists."
    - "Lookup-driven mode selection: every contiguous N-stack window produces a rotation of the same scale with identical step multiset → no metric over step distributions can discriminate, so chainLoFor uses an explicit hand-traced table for (3/2, 2/1) and centered-balance default elsewhere."

key-files:
  created:
    - "src/lib/mos.ts (~250 LOC incl. extensive header + hand-trace comments)"
    - "src/lib/__tests__/mos.test.ts (11 tests, all passing)"
  modified: []

key-decisions:
  - "chainLoFor explicit lookup {2:0, 3:-1, 5:-2, 7:-1, 12:-5} for (3/2, 2/1) — hand-traced against the must_haves Test 1 + 2 vectors. Rotations are mode-equivalent so any metric (variance, std-dev, etc.) over step-size multisets is provably non-discriminating; the canonical Ionian-like mode must be picked by lookup."
  - "Default centered chain chainLo = -floor((size-1)/2) for non-(3/2, 2/1) generators — researchers specify their own period/generator; there's no tonal-music canonical mode to deviate from."
  - "nearestMosSize uses CONVERGENTS + SEMI-CONVERGENTS (a.k.a. best rational approximations of the second kind), not just convergents — convergents alone for (3/2, 2/1) emit only {2, 5, 12, 41, 53}, missing the musically essential 3, 7, 17, 29 sizes."
  - "Tie-break: smaller candidate wins on equal distance. nearestMosSize(target=6) returns 5 not 7."
  - "Single-pitch early return when generator.equals(period) — preserves D-29 status semantics ('just the period') instead of letting the dedupe-and-append path collapse to {1/1, period}."
  - "Per Pitfall #1 / Pitfall #6: dedupe by Set-of-`n/d` strings (canonicalized BigInt fractions), NEVER cents-within-epsilon."

patterns-established:
  - "Stringification for equality assertions: use `${fraction.n}/${fraction.d}` directly (not Fraction.toFraction()) — fraction.js drops the '/1' for whole-number ratios, so 'naive' string equality fails on '1/1' vs '1' and '2/1' vs '2'. The BigInt-level Interval.equals is the load-bearing assertion; the string form is a debug-friendly companion."

requirements-completed:
  - ANAL-02

duration: 5min
completed: 2026-05-06
---

# Phase 04 Plan 02: MOS scale construction kernel Summary

**Hand-rolled buildMos (centered generator-stack with explicit Pythagorean mode lookup) and nearestMosSize (continued-fraction convergents + semi-convergents) — emits the canonical Pythagorean MOS sequence [2, 3, 5, 7, 12, 17, 29, 41, 53] and the BigInt-exact diatonic [1/1, 9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2/1].**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-06T21:14:14Z
- **Completed:** 2026-05-06T21:19:30Z (approx)
- **Tasks:** 2 (Task 1 + Task 2 satisfied by single TDD cycle)
- **Files modified:** 2 (1 created: mos.ts; 1 created: mos.test.ts)
- **Test results:** 11/11 mos tests pass; full repo suite 190/190 green

## Accomplishments

- `src/lib/mos.ts` exports `buildMos` (centered generator-chain + period-reduce + sort + dedupe + period-pin) and `nearestMosSize` (continued-fraction semi-convergent search).
- `buildMos(3/2, 2/1, 7)` returns the Pythagorean diatonic `[1/1, 9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2/1]` with BigInt-exact Fraction equality (NOT cents-tolerance).
- `buildMos(3/2, 2/1, 12)` returns the Pythagorean chromatic `[1/1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2/1]`.
- `nearestMosSize` for (3/2, 2/1) emits the canonical Pythagorean MOS sequence — verified by sweeping all targets 1..60 and dumping the candidate Set: `[1, 2, 3, 5, 7, 12, 17, 29, 41, 53]` (the leading `1` is from the seed q_0=1; all canonical sizes [2,3,5,7,12,17,29,41,53] present).
- `nearestMosSize(target=25)` correctly returns `29` (semi-convergent search; convergents-only would wrongly return 12).
- D-29 degenerate inputs handled: period=1/1 → `RangeError("MOS period must be > 1/1")`; generator==period → single-pitch `Scale([period])`; size<1 → `RangeError("MOS size must be >= 1")`; size>1024 → `RangeError`.
- D-11 hand-roll honored: `moment-of-symmetry` package NOT installed; `grep "moment-of-symmetry" package.json` returns no matches.
- R-01 honored: no `Fraction` from xen-dev-utils — mos.ts imports only `Interval` and `Scale` (which themselves use BigInt fraction.js).

## Task Commits

Each task was committed atomically:

1. **Task 1 — RED phase (failing tests)** — `812f02c` (`test(04-02): add failing MOS kernel tests`)
2. **Task 1 — GREEN phase + Task 2 (impl + test stringification fix)** — `5232dfe` (`feat(04-02): implement MOS kernel`)

Tasks 1 (mos.ts) and 2 (mos.test.ts) were unified into a single TDD cycle (RED → GREEN); the plan's two-task split describes the same artifact pair from two angles, and Task 1's verify step (`npx vitest run src/lib/__tests__/mos.test.ts`) requires the test file to exist before it can pass — so writing the tests first as the RED commit is the natural ordering.

## Files Created/Modified

- `src/lib/mos.ts` (created) — MOS kernel: `buildMos`, `nearestMosSize`, internal `chainLoFor`. Header includes hand-traced offset-by-offset derivation of the size=7 and size=12 reference vectors for future maintainers.
- `src/lib/__tests__/mos.test.ts` (created) — 11 vitest cases covering Pythagorean diatonic + chromatic golden vectors, BP-style generator==period single-pitch, period=1/1 RangeError, size=0 RangeError, ascending-cents order, trailing-period (D-14), nearestMosSize exact-match / equidistant tie / semi-convergent gap-fill / canonical-sequence sweep.

## Decisions Made

- **chainLoFor explicit lookup, not metric sweep.** Every contiguous N-stack window produces a rotation of the same scale; rotations have identical step multisets; no derived metric (variance, std-dev) can discriminate. The canonical Ionian-like mode for (3/2, 2/1) ↔ {2, 3, 5, 7, 12} must be picked from a hand-traced table. The plan-checker iterations 2–3 explicitly forbade any `stepVariance|bestVar|variance.*sweep|stackWindow` regression.
- **Convergents + semi-convergents, not convergents alone.** Pythagorean tradition expects {2, 3, 5, 7, 12, 17, 29, 41, 53}; convergents-only emits only {2, 5, 12, 41, 53}. Standard recurrence `q_n = a_n·q_{n-1} + q_{n-2}` with semi-convergent emission `q_{n-2} + k·q_{n-1}` for `k = 1..a_n`.
- **Tie-break smaller-first.** `nearestMosSize(target=6)` returns 5 not 7 (both at distance 1). Test 7 accepts either via `expect([5, 7]).toContain(s)`, but the implementation is deterministic.
- **Single-pitch early return** for `generator.equals(period)` — preserves D-29 status-message semantics ("just the period" rather than collapsing to {1/1, period}).

## chainLoFor Verification

Confirmed by hand-trace against must_haves Test 1 (size=7) and Test 2 (size=12):

| size | chainLo | offsets covered          | spot-check                                  |
|------|---------|--------------------------|---------------------------------------------|
| 2    |  0      | {0, 1}                   | {1/1, 3/2} — perfect-fifth dyad             |
| 3    | -1      | {-1, 0, 1}               | {1/1, 4/3, 3/2} — sus4-like trichord        |
| 5    | -2      | {-2, ..., 2}             | anhemitonic pentatonic                      |
| 7    | -1      | {-1, 0, 1, 2, 3, 4, 5}   | Pythagorean diatonic (Test 1 ✓)             |
| 12   | -5      | {-5, ..., 6}             | Pythagorean chromatic (Test 2 ✓)            |

For size=7, chainLo=-1 (NOT chainLo=0). chainLo=0 would yield offsets {0..6} → after reduction {1/1, 3/2, 9/8, 27/16, 81/64, 243/128, 729/512, 2/1} — Lydian-mode (with the 729/512 tritone instead of the 4/3 perfect-fourth). The plan's Test 1 vector specifies the Ionian mode with 4/3, requiring k=-1 in the chain.

For size=12, chainLo=-5 puts the chain {-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6} — six steps down + six steps up — yielding the canonical chromatic with 256/243 (limma) at the bottom of the post-reduction sort and 729/512 (Pythagorean tritone) in the middle.

## Semi-Convergent Sequence — Empirical Verification

Probed by sweeping `nearestMosSize(3/2, 2/1, t)` for t = 1..60 and dedup-collecting the returned values:

```
[1, 2, 3, 5, 7, 12, 17, 29, 41, 53]
```

Compare to plan target `[2, 3, 5, 7, 12, 17, 29, 41, 53]`: present, plus the trivial `1` from q_0. The convergent denominators alone would have been `[1, 2, 5, 12, 41, 53]`. Semi-convergents fill the {3, 7, 17, 29} gap.

CF expansion verification of α = log2(3/2) ≈ 0.5849625:

```
CF: [0; 1, 1, 2, 2, 3, 1, 5, 2, ...]
q-series (recurrence q_n = a_n·q_{n-1} + q_{n-2} with q_{-1}=0, q_0=1):
  q_0=1, q_1=1, q_2=2, q_3=5, q_4=12, q_5=41, q_6=53, ...
Semi-convergents emitted at n=3 (a=2): q_1 + 1·q_2 = 1+2 = 3 ; q_1 + 2·q_2 = 5 (=q_3)
Semi-convergents emitted at n=4 (a=2): q_2 + 1·q_3 = 7 ; q_2 + 2·q_3 = 12 (=q_4)
Semi-convergents emitted at n=5 (a=3): q_3 + 1·q_4 = 17 ; q_3 + 2·q_4 = 29 ; q_3 + 3·q_4 = 41 (=q_5)
Semi-convergents emitted at n=6 (a=1): q_4 + 1·q_5 = 53 (=q_6)
```

All matches the canonical sequence.

## INVENTORY rows queued for Plan 04-07 consolidation

| Symbol | Source | Notes |
|--------|--------|-------|
| `buildMos` (`src/lib/mos.ts`) | Custom (this repo) — D-11 hand-roll | Centered generator-stack + period-reduce + sort + dedupe by BigInt Fraction equality + period-pin (D-14). chainLoFor lookup `{2:0, 3:-1, 5:-2, 7:-1, 12:-5}` for (3/2, 2/1) hand-traced against Pythagorean diatonic + chromatic golden vectors; default `chainLo = -floor((size-1)/2)` elsewhere. Pitfall #13 period-aware (works for 3/1 Bohlen-Pierce). D-29 degenerate inputs: period=1/1 → RangeError; gen==period → single-pitch Scale([period]); size out of [1, 1024] → RangeError. **NO `moment-of-symmetry` dep** (D-11). R-01 honored. |
| `nearestMosSize` (`src/lib/mos.ts`) | Custom (this repo) — D-11 hand-roll | Continued-fraction CONVERGENTS + SEMI-CONVERGENTS of α = log(generator)/log(period). For each CF coefficient a_n emits q_{n-2} + k·q_{n-1} for k=1..a_n. Yields canonical Pythagorean MOS sequence [2, 3, 5, 7, 12, 17, 29, 41, 53] for (3/2, 2/1). Tie-break: smaller candidate wins on equal distance. Capped at 12 CF terms; safety break at q_curr > 100,000. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test stringification asserted against Fraction.toFraction() output, which drops "/1"**
- **Found during:** Task 1 GREEN verification (initial vitest run after writing mos.ts)
- **Issue:** The plan specifies `expect(scale.intervals.map(iv => iv.fraction.toFraction())).toEqual(expectedDiatonic)` for Test 1, but fraction.js v5's `toFraction()` strips the `/1` denominator for whole-number ratios — so `2/1` stringifies as `"2"`, breaking the naive `expectedDiatonic` array comparison. (INVENTORY.md mentions this exact behavior in the writeScl notes — fraction.js' `toFraction()` is lossy for display purposes.)
- **Fix:** Switched the comparison to use `${String(iv.fraction.n)}/${String(iv.fraction.d)}` directly, which always emits the full `n/d` form. The BigInt-level `Interval.equals` assertion in the same test is the load-bearing check; the string comparison is a debug-friendly companion that now agrees with the golden array verbatim.
- **Files modified:** `src/lib/__tests__/mos.test.ts`
- **Verification:** All 11 tests pass; full repo suite 190/190 green.
- **Committed in:** `5232dfe` (Task 1 GREEN commit, alongside mos.ts itself).

---

**Total deviations:** 1 auto-fixed (Rule 1 bug — test assertion brittleness against fraction.js display behavior).
**Impact on plan:** Cosmetic test fix; preserves the plan's intent (BigInt-exact golden vector match). No scope creep, no semantic change to the kernel. The kernel itself was implemented exactly as specified — chainLoFor lookup, semi-convergent algorithm, single-pitch early return, all bounds checks.

## Issues Encountered

- **Pre-existing tsc errors in unrelated files** (`src/audio/synth.ts:29` and `src/components/lattice.ts:32, 197, 198`) — verified by running `tsc --noEmit` on the parent commit BEFORE creating mos.ts; they predate Plan 04-02 and are out of scope per the executor SCOPE BOUNDARY rule. mos.ts itself compiles clean (zero tsc errors filtered to `mos.ts|mos.test.ts`).
- ESLint also clean for mos.ts + mos.test.ts; the only stderr is a deprecation warning about `.eslintignore` which predates this plan.

## User Setup Required

None — pure-library plan. No external services or env vars.

## Next Phase Readiness

- `buildMos` and `nearestMosSize` are ready for Plan 04-03 (interval-explorer renderer) and Plan 04-04 (Pythagorean MOS audition in research notebook chapters).
- Plan 04-07 (INVENTORY consolidation) should pull in the two `INVENTORY rows queued` entries above verbatim.

---

## Self-Check: PASSED

Verified before final commit:

- `[FOUND]` `src/lib/mos.ts` — `test -f` returns success
- `[FOUND]` `src/lib/__tests__/mos.test.ts` — `test -f` returns success
- `[FOUND]` commit `812f02c` (RED) — `git log --oneline | grep 812f02c` matches
- `[FOUND]` commit `5232dfe` (GREEN) — `git log --oneline | grep 5232dfe` matches
- `[PASS]` `npx vitest run src/lib/__tests__/mos.test.ts` exits 0; 11/11 tests
- `[PASS]` `npx vitest run` (full suite) exits 0; 190/190 tests
- `[PASS]` ESLint clean for mos.ts + mos.test.ts
- `[PASS]` `grep "moment-of-symmetry" package.json` returns no matches (D-11)
- `[PASS]` no `Fraction` imported from `xen-dev-utils` in mos.ts (R-01)
- `[PASS]` `chainLoFor` referenced ≥2 times outside comments in mos.ts (helper def + one call site)
- `[PASS]` zero matches for `stepVariance|bestVar|variance.*sweep|stackWindow` in mos.ts
- `[PASS]` `RangeError("MOS period must be > 1/1")` thrown for period=1/1
- `[PASS]` no DOM/audio refs (`document.|HTMLElement|createElement|synth|AudioContext`) in mos.ts
- `[PASS]` Pythagorean MOS candidate sequence empirically verified `[1, 2, 3, 5, 7, 12, 17, 29, 41, 53]` (plan target ⊆ actual)

---

*Phase: 04-analysis-sharing*
*Completed: 2026-05-06*
