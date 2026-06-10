---
phase: 06-exact-rational-ji-harmonic-generators
plan: 05
subsystem: ui
tags: [cps, hexany, dekany, eikosany, ji, generate-surface, chip-input, web-component]

# Dependency graph
requires:
  - phase: 06-exact-rational-ji-harmonic-generators (Plan 01)
    provides: "cps(factors, k, period) — BigInt-exact Combination Product Set kernel"
  - phase: 05-generate-surface-live-integration-foundation
    provides: "Generate picker (METHOD_FAMILIES native <select>), paramsHost/previewHost swap, Send-to + scale-store"
provides:
  - "generateCps(synth, opts) — Pattern-2 CPS method widget (factor-set chip input + Hexany/Dekany/Eikosany/Custom presets)"
  - "CPS reachable via the Generate picker's 'JI combinatorial' optgroup; Send-to serializes the exact CPS scale"
affects:
  - "06-06 / 06-07 (further generator widgets follow this Pattern-2 + picker-wiring precedent)"
  - "Generate surface (generate.md)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern-2 factory widget with closure-local state + status region + replaceChildren (mosBuilder precedent)"
    - "D-13 factor-set chip input: createElement+textContent chips, parseInt-validated positive integers (XSS-safe)"
    - "getScale() accessor on the root element exposes the widget's current Scale to the host page for Send-to"
    - "Widget instantiated ONCE in a page cell so its closure state survives picker mount/unmount swaps"

key-files:
  created:
    - "src/components/generate-cps.ts"
    - "src/components/generate-cps.css"
    - "src/components/__tests__/generate-cps.test.ts"
  modified:
    - "src/pages/generate.md"
    - "src/styles.css"

key-decisions:
  - "getScale() method on the root element (chosen over a (root as any)._scale property) — typed via a GenerateCpsElement interface, cleaner than an any-cast"
  - "Adding/removing a chip flips the preset to 'Custom' (a named preset no longer describes the edited factor set)"
  - "cpsScaleText() drops a leading 1/1 before serialization — parseScala auto-prepends 1/1, matching the harmonic-segment text convention (avoids a duplicate unison)"
  - "Send-to re-reads the widget's scale LIVE at click time (widget edits don't tick Observable's reactive graph)"
  - "SEND_SOURCE derived from method (generate:cps / generate:harmonic-segment) — backward-compatible provenance label"

patterns-established:
  - "Pattern-2 generator widget + 'Approach B' picker registration: replace a family's (coming soon) placeholder with a real option, mount a once-instantiated widget into paramsHost on method match"
  - "Widget-owns-its-preview: for self-rendering widgets the shared previewHost shows a pointer caption instead of a duplicate table"

requirements-completed: [GEN-01]

# Metrics
duration: 7min
completed: 2026-06-10
---

# Phase 6 Plan 05: CPS Method Widget Summary

**`generateCps` — a Pattern-2 Generate widget with a factor-set chip input + Hexany/Dekany/Eikosany/Custom presets that calls the Plan-01 `cps()` kernel and renders the exact JI table, wired into the picker's "JI combinatorial" optgroup with Send-to serialization — harmonic-segment stays the default opener (D-08).**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-10T15:21:00Z
- **Completed:** 2026-06-10T15:28:22Z
- **Tasks:** 2
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- `generateCps(synth, opts)` Pattern-2 factory: factor-set chip input (D-13), Hexany/Dekany/Eikosany/Custom preset select (D-09), kernel-backed scaleTable + ⏵⏵ Play, status region for kernel RangeErrors.
- Default render is the canonical 1-3-5-7 Hexany (7 rows); selecting Dekany → 11 rows, Eikosany → 21 rows (kernel-verified cardinalities).
- Chip input is XSS-safe (createElement + textContent only) and numeric-validated (positive integers only) before a chip is created (T-06-10).
- Combinatorial DoS caps surface gracefully via the kernel's RangeError in the status region with the prior render preserved (T-06-11).
- CPS wired into the Generate picker's "JI combinatorial" optgroup; Send-to serializes the live CPS scale ratio-per-line (exact JI).
- D-08 anti-regression verified: the placeholder default option and the harmonic-segment branch are untouched — the page opens exactly as Phase 5 shipped.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): failing generateCps tests** - `aec3328` (test)
2. **Task 1 (GREEN): generateCps widget + CSS** - `048365f` (feat)
3. **Task 2: wire CPS into the picker + Send-to** - `2874494` (feat)

**Plan metadata:** (this commit — docs: complete plan)

_TDD task 1 produced a test→feat pair; no refactor commit was needed (implementation was clean at GREEN)._

## Files Created/Modified

- `src/components/generate-cps.ts` - Pattern-2 CPS widget: closure-local factors[]/k/preset, chip input, preset select, k input (Custom), status region, scaleTable + playScale hosts, getScale() accessor.
- `src/components/generate-cps.css` - `.generate-cps__*` classes (chip, chip-remove, chip-form, add, status) using only theme tokens (D-15).
- `src/components/__tests__/generate-cps.test.ts` - 14 happy-dom tests: chip add/remove, numeric validation, preset cardinalities (7/11/21), default Hexany, Play, getScale().
- `src/pages/generate.md` - imported generateCps; replaced the "JI combinatorial" placeholder with the CPS option; instantiated the widget once; mounted it into paramsHost on `method==='cps'`; CPS preview-host caption; live CPS Send-to serialization.
- `src/styles.css` - `@import "./components/generate-cps.css";`.

## Decisions Made

- **getScale() method over an `any`-cast property:** typed the root element as `GenerateCpsElement extends HTMLElement` with a `getScale(): Scale | null` method — cleaner and type-safe versus `(root as any)._scale`.
- **Chip edit → Custom preset:** adding or removing a chip flips the preset select to "Custom" since a named preset no longer describes the user-edited factor set; the Custom k input becomes visible.
- **Drop leading 1/1 in Send-to text:** `parseScala` (the text-input path Send-to feeds) auto-prepends 1/1, so `cpsScaleText()` strips a leading unison to avoid a duplicate — matching the harmonic-segment convention (its text starts at (n+1)/n).
- **Live read at click time:** the widget's internal chip/preset edits don't tick Observable's reactive graph, so Send-to re-reads `cpsWidget.getScale()` at click time to round-trip the exact scale on screen.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Strip leading 1/1 from the CPS Send-to serialization**
- **Found during:** Task 2 (Send-to wiring)
- **Issue:** The plan's literal serialization `scale.intervals.map(iv => iv.toString()).join("\n")` includes the CPS scale's tonic 1/1 (serialized as `"1"`). The Send-to text path runs through `parseScala`, which **always** auto-prepends 1/1 (unlike `parseScl`, it does NOT strip a leading unison). Sending the raw text would produce a duplicate 1/1 in the destination scale.
- **Fix:** `cpsScaleText()` drops a leading `"1"` interval before joining — matching the harmonic-segment text convention (its generated text omits the leading 1/1). Verified the harmonic-segment path already relies on this same auto-prepend behavior.
- **Files modified:** src/pages/generate.md
- **Verification:** `npm run build` succeeds; full suite 436/436 green; the CPS text now contains the 6 Hexany degrees + period without a duplicate unison.
- **Committed in:** 2874494 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing-critical correctness fix).
**Impact on plan:** The fix prevents a malformed (duplicate-unison) scale from crossing into the Dashboard/Analysis via Send-to. No scope creep — the plan's serialization formula was kept, only guarded against the parseScala auto-prepend.

## Issues Encountered

None — the kernel cardinalities (Hexany 7 / Dekany 11 / Eikosany 21) were verified against `cps()` before writing the test assertions, so RED→GREEN was clean on the first implementation. tsc, eslint, build, and the full 436-test suite all pass with no regressions.

## Threat Surface

All `mitigate` dispositions from the plan's threat register are implemented:
- **T-06-10 (XSS, chip input):** chips built via `createElement` + `textContent` ONLY; the integer is `parsePositiveInt`-validated (regex `^\d+$` + `>= 1`) before becoming a chip. Non-numeric / non-integer / `<= 0` input is rejected and never rendered. Tested.
- **T-06-11 (DoS, cps() via chips):** the widget relies on the kernel's D-14 caps (factors.length ≤ 12, 1 ≤ k ≤ length); a kernel RangeError surfaces in the `role="status"` region without crashing, and the prior render is preserved (the mosBuilder idiom).
- **T-06-12 (Tampering, Send-to URL):** unchanged — Send-to reuses the existing Phase-5-audited `encodeScaleToHash` / 8 KB cap path.
- **T-06-SC (npm installs):** no new dependency, no install task.

No new security surface beyond the plan's threat model.

## Known Stubs

None — `generateCps` is fully wired to the `cps()` kernel; the default Hexany renders real exact-JI data, presets and chips drive live re-renders, and Send-to serializes the actual current scale. No placeholder data paths.

## User Setup Required

None - no external service configuration required.

## Self-Check: PASSED

- FOUND: src/components/generate-cps.ts
- FOUND: src/components/generate-cps.css
- FOUND: src/components/__tests__/generate-cps.test.ts
- FOUND: src/pages/generate.md (CPS option + mount + Send-to wiring)
- FOUND: src/styles.css (@import generate-cps.css)
- FOUND commit aec3328 (test — RED)
- FOUND commit 048365f (feat — GREEN, widget)
- FOUND commit 2874494 (feat — picker wiring)

## TDD Gate Compliance

- RED gate: `aec3328` `test(06-05): add failing tests for generateCps widget` (confirmed failing — module absent).
- GREEN gate: `048365f` `feat(06-05): implement generateCps CPS widget` (all 14 tests pass).
- REFACTOR: not needed — implementation was clean at GREEN.

## Next Phase Readiness

- GEN-01 (CPS) is shipped and live on the Generate surface; the Pattern-2 + picker-registration precedent is now exercised twice (mosBuilder, generateCps) for the remaining Phase-6 generator widgets (06-06, 06-07).
- No blockers. harmonic-segment remains the default opener (D-08 preserved).

---
*Phase: 06-exact-rational-ji-harmonic-generators*
*Completed: 2026-06-10*
