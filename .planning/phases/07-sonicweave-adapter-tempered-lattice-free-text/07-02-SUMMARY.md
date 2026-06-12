---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
plan: 02
subsystem: ui
tags: [sonic-weave, rank-2, well-temperament, tempered, regular-temperament, vallotti, werckmeister, vitest, happy-dom]

# Dependency graph
requires:
  - phase: 07-01
    provides: scaleFromSonicWeave adapter (SonicWeaveResult { scale, tempered, error }), isFractional() discriminator, D-13 unison-prepend, 8 KB cap
  - phase: 06
    provides: scaleTable tempered variant (badge + no-Ratio-column), playScale, generate-ed/generate-cps Pattern-2 factory analogs
provides:
  - generate-rank2.ts (GEN-06) — rank-2 regular-temperament widget; preset + manual, tuning select {pure|quarter-comma|POTE|TE|CTE}, conditional tempered
  - generate-welltemp.ts (GEN-07) — well-temperament widget; Vallotti default, verified preset roster + custom 11 per-fifth fractions, always tempered, explicit Pythagorean comma
  - Per-preset well-temperament test vectors appended to sonicweave.test.ts (Vallotti + Werckmeister III, cited)
affects: [07-04 page registration, generate.md, Send-to serialization, Phase 8 rotate strip]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern-2 factory composing a SonicWeave source string from typed params → one shared kernel adapter"
    - "Conditional tempered: isTempered() returns result.tempered (rank-2 pure=false, tempered tuning=true) vs always-true (well-temperament cents-of-record)"
    - "Verified-roster discipline: ship only presets whose vectors cross-check exactly against the repo's authoritative theory page; document omissions"

key-files:
  created:
    - src/components/generate-rank2.ts
    - src/components/generate-rank2.css
    - src/components/generate-welltemp.ts
    - src/components/generate-welltemp.css
    - src/components/__tests__/generate-rank2.test.ts
    - src/components/__tests__/generate-welltemp.test.ts
  modified:
    - src/lib/__tests__/sonicweave.test.ts

key-decisions:
  - "Rank-2 default lands on quarter-comma meantone via a literal-cents generator (rank2(696.578…, 5, 1)); tempered, not POTE (D-02)"
  - "Well-temperament ships a verified 2-preset roster (Vallotti + Werckmeister III) + custom mode rather than a plausible-but-wrong full D-08 roster (A1 sourcing, plan directive)"
  - "Table-row counts include the adapter's prepended unison: rank-2 diatonic = 8 rows, 12-note well-temp = 13 rows (D-13)"

patterns-established:
  - "Pattern 2 (composeSource): widget serializes typed params into a rank2(...)/wellTemperament(...) string and calls scaleFromSonicWeave once"
  - "Conditional-tempered widget contract: isTempered() reflects result.tempered, never a hard literal, for correct Send-to serialization"

requirements-completed: [GEN-06, GEN-07]

# Metrics
duration: 14min
completed: 2026-06-12
---

# Phase 7 Plan 02: Rank-2 + Well-Temperament Widgets Summary

**Two SonicWeave-backed generators over the Plan-01 adapter: a rank-2 regular-temperament widget (quarter-comma meantone default, {pure|quarter-comma|POTE|TE|CTE} tuning select, conditionally tempered) and a historical well-temperament widget (Vallotti default, explicit Pythagorean comma, always tempered, verified per-preset vectors).**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-06-12T03:31:00Z (approx)
- **Completed:** 2026-06-12T03:41:00Z (approx)
- **Tasks:** 2 (both TDD)
- **Files modified:** 7 (6 created, 1 appended)

## Accomplishments

- **generate-rank2.ts (GEN-06):** Pattern-2 factory composing `rank2(...)` SonicWeave source from typed params. Default lands on quarter-comma meantone (D-02) via the literal-cents generator → tempered, cents-of-record table + "tempered" badge. Preset roster (D-17: Pythagorean, quarter-comma meantone, porcupine, magic, hanson + custom) fills generator/period/up/down; the Pythagorean (pure-ratio) preset flips to **exact JI** (Ratio column restored, no badge). Tuning select {pure | quarter-comma | POTE | TE | CTE} (D-03) drives the temper pattern; POTE/TE/CTE use the two-line `rank2(3/2, up, down)\nTUNING([comma])` form. Up/down native rank2 counts (D-04) drive cardinality with D-18 defense-in-depth caps (up ∈ [1,53], down ∈ [0,53]). `isTempered()` returns the result-derived boolean, NOT a literal.
- **generate-welltemp.ts (GEN-07):** Pattern-2 factory composing `wellTemperament([...], 531441/524288)` — the Pythagorean comma passed EXPLICITLY (D-07, Pitfall 2). Default Vallotti (D-06). Always tempered. Custom mode (D-05) exposes 11 signed per-fifth fraction fields (supports -1/6); editing any forces preset = custom.
- **Per-preset test vectors:** Vallotti and Werckmeister III vectors appended to `sonicweave.test.ts`, asserting canonical published degree cents (cross-checked sub-0.01¢ against the repo's own `src/pages/well-temperament.md`) + a D-07 test proving the explicit Pythagorean comma is load-bearing (the syntonic default yields a different scale).
- **Full suite green:** 531 tests across 40 files, no regressions. Both new widgets + the appended vectors are tsc-clean and lint-clean.

## Task Commits

Each TDD task was committed atomically (test → feat):

1. **Task 1 RED: failing generate-rank2 test** - `b14a534` (test)
2. **Task 1 GREEN: implement generate-rank2 (GEN-06)** - `48e0c61` (feat)
3. **Task 2 RED: failing generate-welltemp test + well-temp vectors** - `fe258e8` (test)
4. **Task 2 GREEN: implement generate-welltemp (GEN-07)** - `90bbef4` (feat)

No REFACTOR commits — both implementations were clean on first GREEN.

## Files Created/Modified

- `src/components/generate-rank2.ts` - GEN-06 rank-2 widget (factory, preset+manual, tuning select, conditional tempered)
- `src/components/generate-rank2.css` - rank-2 widget styles (var(--theme-*) tokens only)
- `src/components/generate-welltemp.ts` - GEN-07 well-temperament widget (Vallotti default, verified roster + custom, explicit Pythagorean comma)
- `src/components/generate-welltemp.css` - well-temp widget styles (var(--theme-*) tokens only)
- `src/components/__tests__/generate-rank2.test.ts` - 13 component tests (RED→GREEN)
- `src/components/__tests__/generate-welltemp.test.ts` - 11 component tests (RED→GREEN)
- `src/lib/__tests__/sonicweave.test.ts` - appended 3 per-preset well-temperament vector tests (Vallotti, Werckmeister III, explicit-comma proof)

## Decisions Made

- **Rank-2 default = literal-cents quarter-comma meantone, not POTE** (D-02 / RESEARCH OQ-3): `rank2(696.578428466209, 5, 1)` renders the historical quarter-comma tuning. POTE/TE/CTE are available as alternative tunings via the two-line temper pattern.
- **Well-temperament roster = 2 verified presets + custom**, not the full 8-name D-08 roster. Only Vallotti and Werckmeister III cross-check exactly against the repo's authoritative `well-temperament.md`. Per the plan's explicit directive ("prefer a smaller verified roster over an unverified guess; do NOT ship a plausible-but-wrong vector"), the rest are deferred and covered by custom mode. See **Known Stubs / Omissions** and `deferred-items.md`.
- **Table-row counts include the prepended unison** (Plan-01 D-13): the adapter prepends 1/1, so a 7-note rank-2 diatonic = 8 rows and a 12-note well-temperament = 13 rows. Test expectations were aligned to this established adapter contract (it matches the existing quarter-comma length-8 cross-check in `sonicweave.test.ts`).

## Deviations from Plan

### Test-expectation corrections (not auto-fixes — test authoring aligned to the adapter contract)

The plan's behavior spec said "7 rows" (rank-2) and "12 rows" (well-temp). The Plan-01 adapter prepends the kernel-convention unison (D-13), so the rendered tables are **8 rows** (rank-2 diatonic) and **13 rows** (12-note well-temperament). The "7 notes" / "12 notes" in D-02/D-06 refer to pitch classes; the rendered row count adds the prepended 1/1. Test expectations were written to match the actual (correct) adapter output — this is the established contract, already asserted by the existing `sonicweave.test.ts` quarter-comma length-8 test. No code change was needed; the widgets behave correctly.

**Total deviations:** 0 code auto-fixes. Test row-count expectations aligned to the documented D-13 adapter contract during RED authoring.
**Impact on plan:** None — the widgets meet every behavioral acceptance criterion. The row-count wording is a counting convention (pitch classes vs rendered rows), not a behavioral change.

## Known Stubs / Omissions

**Well-temperament roster (A1 sourcing) — intentional, plan-sanctioned:**

The D-08 roster names eight presets. This plan ships **Vallotti** (default) and **Werckmeister III**, each verified sub-0.01¢ against `src/pages/well-temperament.md`. The remaining six are omitted (NOT shipped as guessed vectors), per the plan's "smaller verified roster over unverified guess" directive:

- **Kirnberger III** — a mixed 1/4-syntonic-comma + schisma scheme, not expressible with a single Pythagorean-comma `wellTemperament` call. Belongs in the free-text escape hatch (GEN-09, Plan 03) or a future two-comma formulation.
- **Young I/II, Neidhardt, Kellner, Lehman "Bach"** — candidate vectors did not reproduce published per-degree cents under the prelude's chain-ordering within the verification window (a Kellner candidate landed ~5¢ off). They need dedicated per-preset sourcing.

**Not a blocking stub:** custom mode (11 editable per-fifth fraction fields) lets a user dial in ANY historical scheme today. A future plan can promote individually-verified vectors into named presets. Logged in `deferred-items.md`.

## Issues Encountered

- **SonicWeave node probe required running from inside the worktree** so `node` resolves the local `node_modules` (the `sonic-weave` package). Resolved by placing the throwaway probe scripts inside the worktree root (cleaned up afterward).
- **Pre-existing project-wide lint/tsc failures** in untouched files (`synth.ts`, `lattice.ts`, `scale-compare.ts`, markdown pages) from Observable Framework's `npm:` import specifiers, which standalone ESLint/tsc cannot resolve. Out of scope (SCOPE BOUNDARY); `git diff` confirms this plan never touched those files. My new files are lint-clean and tsc-clean. Logged in `deferred-items.md`.

## User Setup Required

None - no external service configuration required. (CSS @import wiring into `src/styles.css` and Generate-picker page registration are deferred to Plan 04 to stay file-disjoint from Plan 03.)

## Next Phase Readiness

- **GEN-06 + GEN-07 widgets complete and tested.** Both export their factory + Element interface (`getScale()` / `isTempered()`) for Plan-04 page registration and Send-to.
- **Plan 04 to-do:** add `@import "components/generate-rank2.css"` + `@import "components/generate-welltemp.css"` to `src/styles.css`; register both widgets under the "Regular" optgroup in `generate.md`.
- **File-disjoint from Plan 03** (Fokker + free-text): no shared files touched. Both wave-2 plans can merge cleanly.

---
*Phase: 07-sonicweave-adapter-tempered-lattice-free-text*
*Completed: 2026-06-12*

## Self-Check: PASSED

- All 6 created source/test files + SUMMARY.md verified on disk.
- All task commits verified in git log: `b14a534` (test), `48e0c61` (feat), `fe258e8` (test), `90bbef4` (feat), `e682296` (docs).
- TDD gate sequence intact per task: test(RED) → feat(GREEN).
- Target tests: 34 passing. Full suite: 531 passing, 40 files, no regressions.
