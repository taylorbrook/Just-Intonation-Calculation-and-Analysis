---
phase: 08-preview-transforms-advanced-generators
plan: 01
subsystem: api
tags: [wilson-recurrence, metallic-mean, mt-meru, constant-structure, bigint, fraction.js, kernel, tdd]

# Dependency graph
requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: Interval (BigInt Fraction) + Scale (period rule, rotate/reduce/dedupe/transpose)
  - phase: 06-exact-rational-ji-harmonic-generators
    provides: generators.ts defense-in-depth cap idiom (MAX_DIVISIONS/MAX_HARMONIC RangeError-before-enumeration)
  - phase: 07-sonicweave-adapter-tempered-lattice-free-text
    provides: scaleFromSonicWeave adapter ({scale, tempered, error?}) — the CS widget's scale source in Plan 03
provides:
  - "meruScale(a,b,x0,x1,terms): exact BigInt successive-ratio convergents of the Wilson recurrence as a Scale"
  - "metallicLimitCents(a,b): irrational metallic-mean limit in cents (cents-of-record, never a scale degree)"
  - "MAX_MERU_TERMS: exported term-count cap constant for widget input validation"
  - "isConstantStructure(scale): { cs, ambiguousAt? } via exact BigInt subtension uniqueness"
affects: [08-03 generate-meru widget, 08-03 generate-cs widget, advanced generators]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hand-rolled BigInt recurrence kernel with literal (non-octave-reduced) convergents (D-19)"
    - "Cents-of-record float readout kept strictly OUT of the exact-rational Scale (D-09 / SURF-06)"
    - "Port of a sonic-weave tools.js algorithm onto the kernel Scale via Interval.equals (no cents-epsilon)"

key-files:
  created:
    - src/lib/meru.ts
    - src/lib/__tests__/meru.test.ts
    - src/lib/constant-structure.ts
    - src/lib/__tests__/constant-structure.test.ts
  modified:
    - src/lib/INVENTORY.md

key-decisions:
  - "meruScale period = widest convergent (max by cents) — guaranteed > 1/1 for positive seeds/coeffs, satisfies scale.ts CR-01; the literal Mt. Meru reading has no canonical equave"
  - "Convergents left LITERAL (not octave-reduced) per D-19 — the recurrence ratios ARE the Mt. Meru reading; the Plan-03 transform strip gives the reduced view"
  - "MAX_MERU_TERMS=48 (Fibonacci ratios past ~12 terms are musically indistinguishable) + MAX_MERU_MAGNITUDE=10^30 (DoS/render guard; BigInt never loses precision)"
  - "isConstantStructure ports sonic-weave tools.js hasConstantStructure onto the kernel Scale (D-20) rather than calling the awkward SW builtin — gives the 'ambiguous at X' detail the builtin lacks"
  - "Seeds must be positive (fail-closed RangeError) so every successive ratio is a positive rational (Pitfall #6)"

patterns-established:
  - "Pattern: irrational limit as a standalone float readout, never admitted as a Scale interval (SURF-06 / Pitfall #4)"
  - "Pattern: subtension-uniqueness CS check via exact Interval.equals on a period-extended scale (cents forbidden as input)"

requirements-completed: [GEN-10]

# Metrics
duration: 7min
completed: 2026-06-13
---

# Phase 8 Plan 01: Wilson Recurrence + Constant-Structure Kernel Summary

**Two new pure-kernel primitives — `meruScale`/`metallicLimitCents` (exact BigInt Mt. Meru convergents + irrational metallic-mean cents readout) and `isConstantStructure` (exact subtension-uniqueness CS check with ambiguous-at detail) — shipped test-first.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-13T22:01:40Z
- **Completed:** 2026-06-13T22:08:30Z
- **Tasks:** 3
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- `meruScale(a,b,x0,x1,terms)` builds the Wilson recurrence `x_n = a·x_{n-1} + b·x_{n-2}` and returns its successive-ratio convergents as a `Scale` of exact BigInt `Interval`s — `meruScale(1,1,1,1,7)` → `1/1, 2/1, 3/2, 5/3, 8/5, 13/8, 21/13` (D-12 Fibonacci/golden default).
- `metallicLimitCents(a,b)` returns the irrational metallic-mean limit in cents (golden 833.09¢, silver 1525.86¢, bronze 2068.41¢) as a standalone readout that is never folded into the scale (D-09 / SURF-06).
- `isConstantStructure(scale)` returns `{ cs, ambiguousAt? }` by exact BigInt interval-class subtension counting — CS-✓ for the Pythagorean diatonic, CS-✗ + `ambiguousAt {3,4}` for a known non-CS scale.
- Two INVENTORY.md rows documenting both modules with Source + Reason.
- Full Vitest suite green at 582 tests (567 prior + 15 new); `tsc --noEmit` and ESLint clean.

## Task Commits

Each task was committed atomically (TDD: RED → GREEN per behavior-adding task):

1. **Task 1: meru.ts Wilson recurrence + metallic-limit cents**
   - `1cc9124` (test — RED: failing meru anchors)
   - `57651f7` (feat — GREEN: meruScale + metallicLimitCents)
2. **Task 2: constant-structure.ts isConstantStructure helper**
   - `73cdf24` (test — RED: failing CS anchors)
   - `0ace1c3` (feat — GREEN: isConstantStructure)
3. **Task 3: INVENTORY.md Phase 8 rows** - `2c03218` (docs)

_No REFACTOR commits — both implementations were cleaned to final form before their GREEN commit._

## Files Created/Modified
- `src/lib/meru.ts` - `meruScale` (exact BigInt convergents, term/magnitude caps) + `metallicLimitCents` (irrational cents readout) + exported `MAX_MERU_TERMS`.
- `src/lib/__tests__/meru.test.ts` - 12 tests: Fibonacci convergent anchors (via `iv.equals`), golden/silver/bronze cents, caps (RangeError before/during enumeration), metallic limit never a degree.
- `src/lib/constant-structure.ts` - `isConstantStructure` (~30 LOC port of sonic-weave `tools.js` onto the kernel `Scale`; exact `Interval.equals`, no cents).
- `src/lib/__tests__/constant-structure.test.ts` - 3 tests: CS-✓ Pythagorean, CS-✗ + ambiguousAt, exact-not-epsilon near-miss.
- `src/lib/INVENTORY.md` - new `## Phase 8 entries` section with the two GEN-10 kernel rows.

## Decisions Made
- **Period = widest convergent.** The literal Mt. Meru reading has no canonical equave; the widest convergent (max by cents) is always > 1/1 for positive seeds/coefficients, satisfying the scale.ts CR-01 period rule without arbitrary choice.
- **Convergents left literal (not octave-reduced)** per D-19 — the recurrence ratios are the reading; the Plan-03 strip's "reduce" provides the reduced view for free.
- **CS check is a new kernel helper (D-20)**, not the SonicWeave builtin — the builtin pushes its boolean onto the SW scale (awkward read-back through `{scale,tempered}`) and gives no "ambiguous at X" detail. The ~30-LOC port stays on the BigInt path and surfaces the colliding step-counts.
- **Cents is forbidden as a CS input.** The near-miss test (`1/1, 568/505, 9/8, 3/2, 2/1`, two degrees ~0.38¢ apart but exactly distinct) reports CS-✓ — a cents-epsilon implementation would falsely conflate them and report CS-✗.

## Deviations from Plan

None - plan executed exactly as written.

The plan's INVENTORY acceptance criterion used a line-counting `grep -c` (expecting `>= 3`) that returns 2 because each new INVENTORY row is a single long Markdown table line (the correct table format the plan requested). All three symbols (`meruScale`, `metallicLimitCents`, `isConstantStructure`) are present — verified via `grep -o` occurrence count (6). This is a measurement-tool artifact, not a deviation: the criterion's intent ("all three new symbols listed") is satisfied.

## Issues Encountered
- **No `node_modules` in the worktree.** Claude Code worktrees are created without a dependency install, so Vitest/sonic-weave/fraction.js were absent. Resolved by symlinking the main checkout's already-installed, already-locked, already-patched `node_modules` into the worktree (environment restoration — no new package installs, no `package.json`/lockfile changes). The symlink is untracked (gitignored as `node_modules/`) and is removed when the orchestrator drops the worktree.
- **`tools.js` not package-exported.** The CS ground-truth probe needed `sonic-weave/dist/tools.js`, which the package's `exports` map does not expose. Resolved by importing it via an absolute `file://` path for the one-off ground-truth probe only — the shipped `isConstantStructure` does NOT import `tools.js`; it ports the algorithm onto the kernel `Scale`.

## User Setup Required

None - no external service configuration required. Pure kernel math (no DOM, no audio, no new dependencies).

## Next Phase Readiness
- Both primitives ship as tested, exact-BigInt contracts. Plan 03's `generate-meru.ts` and `generate-cs.ts` widgets can build against them directly (interface-first / kernel-before-UI).
- `metallicLimitCents` returns a `number` with no `tempered` field (D-03) — the Plan-03 widget owns the tempered flag and renders the limit as a separate readout beside the exact convergent table.
- `MAX_MERU_TERMS` is exported so the widget can clamp its term-count input to the same ceiling the kernel enforces.
- No blockers.

## Self-Check: PASSED

- FOUND: src/lib/meru.ts
- FOUND: src/lib/__tests__/meru.test.ts
- FOUND: src/lib/constant-structure.ts
- FOUND: src/lib/__tests__/constant-structure.test.ts
- FOUND: src/lib/INVENTORY.md (Phase 8 section)
- FOUND commit 1cc9124 (test RED meru)
- FOUND commit 57651f7 (feat GREEN meru)
- FOUND commit 73cdf24 (test RED CS)
- FOUND commit 0ace1c3 (feat GREEN CS)
- FOUND commit 2c03218 (docs INVENTORY)

## TDD Gate Compliance

Both behavior-adding tasks followed the mandatory RED → GREEN sequence:
- Task 1: `test(08-01)` RED `1cc9124` → `feat(08-01)` GREEN `57651f7`
- Task 2: `test(08-01)` RED `73cdf24` → `feat(08-01)` GREEN `0ace1c3`

No test passed unexpectedly during RED (both modules were absent; suites failed to load as expected). No REFACTOR gate needed.

---
*Phase: 08-preview-transforms-advanced-generators*
*Completed: 2026-06-13*
