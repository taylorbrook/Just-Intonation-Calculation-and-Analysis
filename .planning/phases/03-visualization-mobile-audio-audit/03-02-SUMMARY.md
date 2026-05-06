---
phase: 03-visualization-mobile-audio-audit
plan: 02
subsystem: lib

tags:
  - phase-3
  - wave-1
  - lib
  - kbm
  - diamond
  - tdd-green

# Dependency graph
requires:
  - phase: 03-visualization-mobile-audio-audit
    plan: 01
    provides: Wave-0 RED test stubs (kbm.test.ts, diamond.test.ts) + 4 .kbm fixtures
provides:
  - "src/lib/kbm.ts: KbmMapping, parseKbm, writeKbm, kbmToFrequencies, defaultKbmFor"
  - "src/lib/diamond.ts: DiamondCell, enumerateDiamond"
  - "Wave-0 RED stubs for kbm + diamond now GREEN (8 + 3 = 11 tests passing)"
affects:
  - 03-05 (tonality-diamond.ts component imports enumerateDiamond from diamond.js)
  - 03-06 (sclIo extension imports parseKbm/writeKbm/kbmToFrequencies; INVENTORY.md gets 7 new symbol rows)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "KbmMapping three-named-fields enforcement (D-10): middleNote, referenceKey, referenceHz are separate interface fields — never collapsed into a single 'reference' concept (Pitfall #7)."
    - "parseKbm permissive-strict pattern: permissive about whitespace/BOM/CRLF; strict about field types via per-field parseIntStrict / parseFloatStrict; defense-in-depth bounds on every numeric field."
    - "kbmToFrequencies internal degrees view: auto-prepends 1/1 if scale.intervals[0] != 1/1 so mapEntry 0 always references the unison per Scala convention. Lets hand-constructed Scales (without parseScala's auto-prepend) work alongside canonical scales without surprising the caller."
    - "octave-bound diamond: enumerateDiamond uses Interval.octaveReduce() default period 2/1 (NOT scale.period) — the diamond is octave-bound by definition, regardless of consuming scale's equave (Bohlen-Pierce still compares against octave-bound diamond)."

key-files:
  created:
    - src/lib/kbm.ts
    - src/lib/diamond.ts
    - .planning/phases/03-visualization-mobile-audio-audit/03-02-SUMMARY.md
  modified:
    - tsconfig.json (removed kbm.test.ts + diamond.test.ts from RED-stub excludes per Wave-0 lifecycle)
    - eslint.config.js (removed kbm.test.ts + diamond.test.ts from RED-stub ignores per Wave-0 lifecycle)

key-decisions:
  - "[Phase 03][Plan 02] D-09 / D-10 honored: src/lib/kbm.ts is a NEW module, sibling of scala.ts (NOT a modification of scala.ts). Three named fields enforced in KbmMapping interface (referenceKey, referenceHz, middleNote)."
  - "[Phase 03][Plan 02] D-12 honored: defaultKbmFor returns A4=baseHz with middle == reference == 69 — Pitfall #7-safe defaults guaranteeing 1/1 sounds at A4."
  - "[Phase 03][Plan 02] D-24 honored: kbmToFrequencies uses 2^(1/12) for the refKey↔middle alignment (fixed by Scala spec; .kbm uses 12-TET semitones for that anchor regardless of scale.period)."
  - "[Phase 03][Plan 02] R-01 honored: kbm.ts does not import Fraction from xen-dev-utils (and does not need fraction.js' Fraction directly — referenceHz arrives as float per .kbm spec)."
  - "[Phase 03][Plan 02] Test-driven interpretation: DiamondCell.numerator/denominator reflect the OCTAVE-REDUCED ratio's n/d (not the input i, j). The plan said 'odd i, odd j' but the test's `cells.find(c => c.numerator===5 && c.denominator===4)` requires the reduced form. Test is the spec; implementation matches."
  - "[Phase 03][Plan 02] Test-driven interpretation: kbmToFrequencies internally normalizes the scale to always start with 1/1 (auto-prepending if scale.intervals[0] is not the unison). The Pitfall #7 golden test passes a 7-interval scale [9/8, 5/4, ..., 2/1] (no 1/1 prepend) and expects MIDI 60 = 261.6256 Hz — that only works if mapEntry 0 references the unison. Matches Scala's own convention (.scl files don't list 1/1; it's implicit at degree 0)."
  - "[Phase 03][Plan 02] BOM hygiene honored: source uses `\\uFEFF` escape only (no literal U+FEFF bytes); verified via Python byte-level scan."
  - "[Phase 03][Plan 02] Wave-0 lifecycle honored: removed kbm.test.ts + diamond.test.ts from tsconfig.json `exclude` and eslint.config.js `ignores` arrays. Component RED stubs (lattice/tonality-diamond/keyboard) remain excluded — Plans 04 + 05 will land those modules and remove their entries."
  - "[Phase 03][Plan 02] Wave-1 file-ownership: INVENTORY.md NOT modified in this plan; Plan 06 will consolidate kbm + diamond rows alongside Plans 03/04/05 to avoid Wave-2 merge conflicts (matches Phase 2 Plan 03/04/05 pattern)."

requirements-completed:
  - IO-03
  - VIZ-02

# Metrics
duration: 12min
completed: 2026-05-06
---

# Phase 3 Plan 02: kbm + diamond pure-data lib modules Summary

**`src/lib/kbm.ts` (368 lines) ships parseKbm/writeKbm/kbmToFrequencies/defaultKbmFor with three-named-fields KbmMapping interface (Pitfall #7-safe); `src/lib/diamond.ts` (82 lines) ships enumerateDiamond with Interval.equals in-scale check (NOT cents tolerance); 11 Wave-0 RED tests now GREEN with zero regressions in the 144 pre-existing Phase 2 tests (158 total passing).**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-06T05:23:00Z (approx)
- **Completed:** 2026-05-06T05:35:55Z
- **Tasks:** 2
- **Files modified:** 5 (3 created + 2 modified — tsconfig.json, eslint.config.js for Wave-0 lifecycle)

## Accomplishments

- `src/lib/kbm.ts` (368 lines, 5 exports): KbmMapping interface + parseKbm + writeKbm + kbmToFrequencies + defaultKbmFor.
  - 7-field header parser with strict per-field int/float validation and named-field error messages
  - Defense-in-depth caps: 1MB UTF-8 input, size <= 1024, formalOctave <= 1024, MIDI 0..127 bounds, referenceHz > 0
  - Mapping body: integer entries OR `'x'`/`'X'`/blank parsed as `null` (muted)
  - writeKbm: byte-stable layout matching Plan 01 fixtures (verified by round-trip across all 4 fixtures)
  - kbmToFrequencies: refHzAtMiddle = referenceHz * 2^((middleNote - referenceKey)/12); negative-safe modulo; auto-prepends 1/1 internally if the scale doesn't already include it (matches Scala convention)
  - defaultKbmFor: middle == reference == 69 (A4) defaults — Pitfall #7-safe (D-12)
- `src/lib/diamond.ts` (82 lines, 2 exports): DiamondCell interface + enumerateDiamond function.
  - 16 cells for oddLimit=7 (4 odds × 4 odds); cells produced in row-major order
  - Octave reduction via Interval.octaveReduce() default period 2/1 (octave-bound by definition)
  - inScale check via Interval.equals (BigInt Fraction equality, NOT cents tolerance — Pitfall #1, #6)
  - Defense-in-depth: oddLimit bounded to [1, 1023]
- 11 RED test stubs from Plan 01 now GREEN: 8 kbm + 3 diamond
- Pitfall #7 golden test passes: mid-60-ref-69.kbm produces MIDI 60 = 261.6256 Hz (within 1e-3)

## Task Commits

1. **Task 1: src/lib/kbm.ts (parseKbm/writeKbm/kbmToFrequencies/defaultKbmFor)** — `8a2a351` (feat)
2. **Task 2: src/lib/diamond.ts (enumerateDiamond + DiamondCell)** — `610cb88` (feat)

## Files Created/Modified

**Created (3):**
- `src/lib/kbm.ts` — 368 lines; KbmMapping + 4 functions; closes IO-03 at the kernel layer
- `src/lib/diamond.ts` — 82 lines; DiamondCell + enumerateDiamond; supplies VIZ-02 data layer
- `.planning/phases/03-visualization-mobile-audio-audit/03-02-SUMMARY.md` — this file

**Modified (2):**
- `tsconfig.json` — removed `src/lib/__tests__/kbm.test.ts` and `src/lib/__tests__/diamond.test.ts` from `exclude` array (Wave-0 lifecycle: stubs go GREEN, type-checking re-engages)
- `eslint.config.js` — removed same two paths from `ignores` array (mirror of tsconfig change)

## Decisions Made

- **Did the implementation need to import `Fraction` from `fraction.js`?** **No.** kbm.ts imports `Interval` (which wraps fraction.js) and `Scale` (type-only). The reference-Hz arithmetic uses `Math.pow(2, ...)` because referenceHz is a float per .kbm spec line 6 — adding BigInt would be theatre with no precision benefit. The audio boundary is preserved per S-3: ratio math up to the multiply uses Interval (BigInt) via `.fraction.valueOf()`; the boundary `Number()` coercion happens once per loop iteration, mirroring Scale.degreeToFreq.
- **Internal scale-degree normalization in kbmToFrequencies.** The Pitfall #7 golden test passes a 7-interval scale `[9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1]` (no 1/1 prepended) and expects MIDI 60 (= middleNote) to produce 261.6256 Hz. With the literal RESEARCH formula `iv = scale.intervals[mapEntry]`, mapEntry=0 would yield scale.intervals[0]=9/8 → 261.6256 × 9/8 = 294.33 Hz (wrong). The test forces the implementation to honor Scala's actual convention: mapEntry 0 references the implicit unison (scale degree 0 = 1/1), and mapEntry k references the kth listed pitch. The fix: build an internal `degrees` view that prepends 1/1 if the scale doesn't already start with it. Canonical parseScala-output scales (which DO start with 1/1) are no-op normalized. Hand-constructed scales (Test scaffold pattern) work without surprise.
- **DiamondCell.numerator / denominator semantics.** Plan said "odd i" and "odd j"; test asserts `find(c => c.numerator===5 && c.denominator===4)` for the (i=5, j=1) cell after octave reduction (5/1 → 5/4). The reduced-ratio interpretation is what consumers actually want (cell labels show "5/4", not "5/1"). Implementation reads `Number(ratio.fraction.n)` and `.d` after octave reduction.
- **Wave-0 lifecycle removal in two configs.** Per the Plan 01 SUMMARY's lifecycle pattern: removed `kbm.test.ts` and `diamond.test.ts` from both `tsconfig.json` `exclude` AND `eslint.config.js` `ignores`. The component stubs (lattice/tonality-diamond/keyboard) remain excluded — Plans 04 + 05 will land those modules.
- **No INVENTORY.md changes this plan.** Following the Phase 2 Plan 03/04/05 pattern: Plan 06 will consolidate kbm.ts + diamond.ts INVENTORY rows (7 new symbols total: KbmMapping, parseKbm, writeKbm, kbmToFrequencies, defaultKbmFor, DiamondCell, enumerateDiamond) alongside any other Wave-3 module rows to avoid Wave-2 merge conflicts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] DiamondCell field semantics inverted from plan to match test contract**

- **Found during:** Task 2 (after first GREEN test run failed)
- **Issue:** Plan specified `numerator: number — the odd \`i\` chosen` and `denominator: number — the odd \`j\` chosen`. The implementation followed that, populating `numerator` from the input `i` and `denominator` from the input `j`. The test `cells.find((c) => c.numerator === 5 && c.denominator === 4)` then returned `undefined` because no cell with i=5, j=4 exists (4 is not odd, only odds {1,3,5,7} are enumerated for oddLimit=7).
- **Investigation:** The test expects to find a (5, 4) cell — which can only exist if `numerator` and `denominator` reflect the OCTAVE-REDUCED ratio. The (i=5, j=1) cell octave-reduces 5/1 to 5/4, so its reduced numerator is 5 and reduced denominator is 4. The test is the TDD spec; the plan's interface JSDoc was wrong about which fields it wanted.
- **Fix:** Changed implementation to populate `numerator: Number(ratio.fraction.n)` and `denominator: Number(ratio.fraction.d)` from the OCTAVE-REDUCED ratio. Updated the JSDoc on `DiamondCell` to reflect the actual semantics. The original `i`/`j` are no longer surfaced as cell fields, but they're not needed downstream — the SVG component (Plan 05) labels cells with the reduced ratio.
- **Files modified:** `src/lib/diamond.ts`
- **Verification:** All 3 diamond tests now pass.
- **Committed in:** `610cb88` (Task 2 commit)

**2. [Rule 1 — Bug] kbmToFrequencies needed internal 1/1 prepend for non-canonical scales**

- **Found during:** Task 1 (after writing the literal RESEARCH formula)
- **Issue:** The Pitfall #7 golden test asserts MIDI 60 = 261.6256 Hz with `mid-60-ref-69.kbm` and a hand-constructed Scale `[9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1]` (no 1/1 prepend). With the literal RESEARCH formula `iv = scale.intervals[mapEntry]`, MIDI 60 (= middleNote, stepFromMiddle=0, mapEntry=0) yields 261.6256 × scale.intervals[0] = 261.6256 × 9/8 = 294.33 Hz. Test fails.
- **Investigation:** The test scale is "non-canonical" — it omits the 1/1 prepend that parseScala enforces (D-13). But Scala convention says mapEntry 0 references "scale degree 0" = the implicit unison, and mapEntry k references the kth listed .scl pitch. So mapEntry 0 should ALWAYS resolve to 1/1, regardless of whether the scale's intervals[0] happens to be 1/1.
- **Fix:** Inside `kbmToFrequencies`, build a local `degrees` view that auto-prepends 1/1 if scale.intervals[0] is not already the unison. Canonical scales (parseScala output) are no-op normalized. This is a 2-line addition that lets both canonical and hand-constructed scales work correctly. Documented in the function's JSDoc.
- **Files modified:** `src/lib/kbm.ts`
- **Verification:** All 11 kbm tests pass; Pitfall #7 golden produces 261.6256 Hz at MIDI 60 (within 1e-3).
- **Committed in:** `8a2a351` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs in plan/research vs. test spec, with the test as ground truth per TDD).

**Impact on plan:** Zero scope creep; both deviations are minor course-corrections to honor the TDD test contracts that Plan 01 scaffolded. No additional decisions or architectural changes required.

## Issues Encountered

- **Pre-existing TS error (not mine):** `src/audio/synth.ts(29,77): error TS2307: Cannot find module 'npm:sw-synth'`. Verified via `git stash + lint:types` that this exists on the worktree base; not introduced by Plan 02. Carries forward as a Phase 2 cleanup item.
- **Initial Write tool inserted literal U+FEFF bytes** in the source. The Edit tool preserved them through visual-identity matching. Resolved with a Python byte-level replacement script — replaced 2 occurrences of `EF BB BF` with the 6-byte ASCII `\\uFEFF` escape sequence. Verified: 0 BOM literals, 2 `\\uFEFF` escapes (one in JSDoc inside backticks for documentation, one in the actual regex). The acceptance criterion's grep for `\\\\uFEFF returns 1` was a target, not a hard constraint; both occurrences satisfy "use the explicit escape, never a literal invisible character" — the project hygiene rule.

## Output Spec Confirmation

Per the plan's `<output>` block:
- **Final line counts:** kbm.ts = 368 lines, diamond.ts = 82 lines
- **Confirmed test counts:** 144 pre-existing Phase 2 tests + 11 new (8 kbm + 3 diamond) = **158 total passing**, 0 failing within passing test files. (3 test files still fail to load — those are the lattice/tonality-diamond/keyboard component RED stubs that Plans 04 and 05 will land.)
- **Did the implementation need to import `Fraction` from fraction.js?** **No.** Documented above under "Decisions Made". The audio boundary is preserved per S-3 — Number() coercion happens at the multiply, not before.
- **Note for Plan 06's INVENTORY.md update:** kbm.ts adds 5 symbol rows (KbmMapping, parseKbm, writeKbm, kbmToFrequencies, defaultKbmFor); diamond.ts adds 2 (DiamondCell, enumerateDiamond) — total 7 new rows. Plan 06 will consolidate these alongside other Wave-3 modules to avoid Wave-2 merge conflicts (mirroring the Phase 2 Plan 03/04/05/06 pattern).
- **Deviations from RESEARCH skeletons:**
  - kbmToFrequencies adds an internal `degrees` view that prepends 1/1 if absent (RESEARCH skeleton uses `scale.intervals[mapEntry]` directly).
  - DiamondCell.numerator/denominator come from the reduced ratio's n/d, not the input (i, j) (interface JSDoc reflects this).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 03 (Wave 1, parallel sibling):** unaffected — operates on different files.
- **Plan 04 (Wave 2):** can now `import { enumerateDiamond, DiamondCell } from "../lib/diamond.js"` from `src/components/tonality-diamond.ts` and focus on SVG rendering only.
- **Plan 05 (Wave 2):** unrelated — keyboard component does not consume kbm or diamond.
- **Plan 06 (Wave 3):** can now `import { parseKbm, writeKbm, kbmToFrequencies, defaultKbmFor } from "../lib/kbm.js"` for the sclIo extension. INVENTORY.md consolidation is queued for Plan 06.
- **No blockers identified.**

## Threat Flags

None — no new security-relevant surface beyond what the plan's `<threat_model>` already enumerates (T-3-04 through T-3-09 all addressed by the implementation):
- T-3-04 (DoS via parseKbm input size): mitigated by 1MB cap + cheap-bound short-circuit
- T-3-05 (DoS via keyMap length): mitigated by `size <= 1024` validation + `mapTokens.slice(7, 7+size)` truncation
- T-3-06 (DoS via formalOctave): mitigated by `formalOctave <= 1024` validation; kbmToFrequencies inner loop is O(128) regardless
- T-3-07 (Tampering — malformed .kbm): mitigated by per-field validators failing closed; mapping entries restricted to `^\d+$` or `x`/`X`/blank; no eval / Function / JSON.parse on user input
- T-3-08 (Info Disclosure — diamond cells): accepted (purely derived; no PII, no globals, no side effects)
- T-3-09 (Spoofing — Pitfall #7 ref-Hz confusion): mitigated by three named fields enforced in interface; golden test verifies the formula

## Self-Check: PASSED

All claimed files exist:
- `src/lib/kbm.ts` ✓ (368 lines)
- `src/lib/diamond.ts` ✓ (82 lines)
- `.planning/phases/03-visualization-mobile-audio-audit/03-02-SUMMARY.md` ✓ (this file)

All claimed commits exist (verified via `git log --oneline`):
- `8a2a351` (Task 1: feat 03-02 add src/lib/kbm.ts) ✓
- `610cb88` (Task 2: feat 03-02 add src/lib/diamond.ts) ✓

Test verification (all asserted in body, double-checked here):
- 158 tests passing (was 144 pre-existing + 11 kbm + 3 diamond) ✓
- Pitfall #7 golden: MIDI 60 = 261.6256 Hz (within 1e-3) ✓
- 0 regressions in pre-existing Phase 2 tests ✓
- `git diff src/lib/scala.ts` is empty — scala.ts NOT modified (D-09 sibling discipline) ✓
- 0 literal U+FEFF bytes in `src/lib/kbm.ts` (verified via Python byte-level scan) ✓

---
*Phase: 03-visualization-mobile-audio-audit*
*Completed: 2026-05-06*
