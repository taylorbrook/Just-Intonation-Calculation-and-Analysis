---
phase: 06-exact-rational-ji-harmonic-generators
plan: 06
subsystem: ui
tags: [harmonic, subharmonic, ado, afdo, isoharmonic, ji, generate-surface, reduce-to-octave, web-component]

# Dependency graph
requires:
  - phase: 06-exact-rational-ji-harmonic-generators (Plan 02)
    provides: "harmonicSegment / subharmonicSegment / adoScale / isoharmonic — the four exact BigInt builders"
  - phase: 06-exact-rational-ji-harmonic-generators (Plan 05)
    provides: "Pattern-2 factory + picker-registration precedent (generateCps), getScale() Send-to idiom"
  - phase: 05-generate-surface-live-integration-foundation
    provides: "Generate picker (METHOD_FAMILIES native <select>), paramsHost/previewHost swap, Send-to + scale-store"
provides:
  - "generateHarmonic(synth, opts) — Pattern-2 harmonic-family widget (sub-method select: harmonic/subharmonic/ADO/isoharmonic) with the D-04 reduce-to-octave toggle"
  - "Harmonic family reachable via the Generate picker's 'Harmonic & interval divisions' optgroup; Send-to serializes the exact harmonic scale"
  - "harmonic segment is the widget's default sub-method AND the page's default landing method (D-08)"
affects:
  - "06-07 (further generator widgets follow this Pattern-2 + picker-wiring precedent)"
  - "Generate surface (generate.md)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern-2 factory widget with closure-local state + status region + replaceChildren (mosBuilder/generateCps precedent)"
    - "Sub-method <select> swaps a params sub-region (replaceChildren) with the right inputs per sub-method"
    - "Per-method reduce-to-octave checkbox (D-04) on segment/isoharmonic; ADO has no reduce (intrinsically one equave)"
    - "ADO equave via the mosBuilder makeRatioField n/d idiom"
    - "getScale() accessor on the root element exposes the widget's current Scale to the host page for Send-to (live-read at click time)"
    - "Widget instantiated ONCE in a page cell so its closure state survives picker mount/unmount swaps"

key-files:
  created:
    - "src/components/generate-harmonic.ts"
    - "src/components/generate-harmonic.css"
    - "src/components/__tests__/generate-harmonic.test.ts"
  modified:
    - "src/pages/generate.md"
    - "src/styles.css"

key-decisions:
  - "D-08 migration: REPLACED the Phase-5 standalone harmonic-segment reference (segmentSizeInput / buildHarmonicSegmentText) with the full widget mounted under the SAME `harmonic-segment` picker id — the Harmonic family keeps ONE entry (D-10) and the page's first paint (placeholder → demo seed) is unchanged byte-for-byte. The widget's D-09 showcase default (harmonic 8..16) renders once the Harmonic method is selected."
  - "Default-on-load byte-for-byte: the page opens on the placeholder option (value=\"\", selected) → demo seed in the preview — exactly as Phase 5 / Plan 05 shipped. Mounting the widget under `harmonic-segment` does NOT change the literal first paint; it only changes what the Harmonic method shows when selected."
  - "harmonicScaleText() drops a leading 1/1 before serialization (the literal segments start at 8/8 = '1', reduced/iso start at 1/1) — parseScala auto-prepends 1/1, matching the CPS/harmonic-segment convention to avoid a duplicate unison."
  - "Send-to re-reads the widget's scale LIVE at click time (widget edits don't tick Observable's reactive graph) — same idiom as generateCps."
  - "Segment params (lo/hi/reduce) are shared closure-local state across harmonic + subharmonic sub-methods (both take lo/hi + reduce), so switching between them preserves the user's bounds."

requirements-completed: [GEN-02, GEN-03]

# Metrics
duration: 5min
completed: 2026-06-10
---

# Phase 6 Plan 06: Harmonic-Family Method Widget Summary

**`generateHarmonic` — a Pattern-2 Generate widget with a sub-method select (harmonic / subharmonic / ADO / isoharmonic) calling the Plan-02 `harmonic.ts` builders, with the D-04 reduce-to-octave toggle on the segment/isoharmonic sub-methods, wired into the picker's "Harmonic & interval divisions" optgroup under the existing `harmonic-segment` id — preserving the Phase-5 byte-for-byte first paint (D-08) while replacing the reference segment-size implementation with the full harmonic roster.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-10T16:29:47Z
- **Completed:** 2026-06-10T16:35:17Z
- **Tasks:** 2
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- `generateHarmonic(synth, opts)` Pattern-2 factory: a sub-method `<select>` (harmonic / subharmonic / ADO / isoharmonic; default harmonic per D-08) that swaps a params sub-region via `replaceChildren` — segments get lo/hi + a reduce checkbox; ADO gets divisions + an equave n/d ratio field and NO reduce checkbox; isoharmonic gets start/diff/count + a reduce checkbox.
- D-09 defaults wired: harmonic 8..16 (9-row table), subharmonic 8..16 (9 rows), ADO 6 over 2/1 (7-row AFDO-6 table), isoharmonic 4:5:6:7 (start 4 / diff 1 / count 4 → 4 rows).
- D-04 reduce-to-octave toggle: literal overtone form is the default (OFF); toggling ON folds a wide segment into [1/1, 2/1) with exact-n/d dedupe (8..24: 17 → 13 rows, kernel-verified).
- Kernel RangeError (degenerate bounds / D-14 caps) surfaces in the `role="status"` region with the prior render preserved (the mosBuilder idiom); numeric inputs carry min/step as a first clamp (T-06-13).
- All DOM via `createElement` + `textContent` — no `innerHTML` with dynamic content (T-06-14).
- Wired into the Generate picker's "Harmonic & interval divisions" optgroup under the existing `harmonic-segment` id; Send-to serializes the widget's live scale ratio-per-line (exact JI), dropping a leading 1/1 to match the parseScala auto-prepend convention.
- D-08 anti-regression verified: the placeholder default option is untouched and still default-selected — the page's first paint (placeholder → demo seed) is byte-for-byte identical to Phase 5 / Plan 05.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): failing generateHarmonic tests** — `d3253d9` (test)
2. **Task 1 (GREEN): generateHarmonic widget + CSS + @import** — `b55a54c` (feat)
3. **Task 2: wire the harmonic widget into generate.md (D-08)** — `4623098` (feat)

**Plan metadata:** (final docs commit — this SUMMARY + STATE + ROADMAP)

_TDD task 1 produced a test→feat pair; no refactor commit was needed (implementation was clean at GREEN)._

## Files Created/Modified

- `src/components/generate-harmonic.ts` — Pattern-2 harmonic-family widget: closure-local sub-method + per-sub-method params (segLo/segHi/segReduce shared by harmonic+subharmonic; adoDivisions/adoEquaveN/D; isoStart/isoDiff/isoCount/isoReduce), sub-method select, params sub-region (replaceChildren), status region, scaleTable + playScale hosts, `getScale()` accessor. `makeIntField` / `makeReduceField` / `makeRatioField` (the mosBuilder n/d idiom) input builders.
- `src/components/generate-harmonic.css` — `.generate-harmonic__*` classes (form, field, slash, reduce toggle, status, hosts) using only locked theme tokens (D-15).
- `src/components/__tests__/generate-harmonic.test.ts` — 15 happy-dom tests: sub-method swap + default harmonic (D-08), per-sub-method inputs, D-09 default renders (harmonic 9 / ADO 7 / iso 4 / subharmonic 9 rows), reduce-toggle fold (17 → 13), ADO has no reduce checkbox, kernel-RangeError preserves prior render, ⏵⏵ Play present, `getScale()` accessor.
- `src/pages/generate.md` — imported + instantiated `generateHarmonic` once; replaced the Harmonic option text; migrated the `harmonic-segment` id to mount the widget (retired `segmentSizeInput` / `buildHarmonicSegmentText`); params/preview swap + pointer caption mirror the CPS precedent; `harmonicScaleText()` live-read Send-to serialization.
- `src/styles.css` — `@import "./components/generate-harmonic.css";`.

## Verification

- `npx vitest run src/components/__tests__/generate-harmonic.test.ts` — 15/15 pass.
- `npx tsc --noEmit` — clean (exit 0).
- `npx eslint src/components/generate-harmonic.ts` — clean (exit 0; the `.eslintignore` deprecation is pre-existing repo-wide noise). The page (`generate.md`) is intentionally not linted — Framework transpiles markdown JS cells (CLAUDE.md: don't lint markdown JS code blocks).
- `npm run build` — succeeds; 22 pages rendered, `generate` page built, 136 links validated.
- Full suite `npx vitest run` — 466/466 pass, no regressions (451 prior + 15 new).

## Decisions Made

- **D-08 migration (the central design decision):** the design rule preferred a byte-identical-first-render migration under one id. The two relevant defaults are NOT byte-identical (the Phase-5 reference defaulted to segment-size 4 → harmonics 4..8; D-09 sets the widget's showcase default to harmonic 8..16). This is reconciled by recognizing two distinct "defaults": (a) the page's literal first paint = the placeholder option → demo seed (unchanged byte-for-byte), and (b) the Harmonic method's showcase render = 8..16 (an intentional D-09 upgrade, only seen once the method is selected). D-08 ("byte-for-byte on first load") refers to (a); D-09 governs (b). The clean migration — replace the reference implementation under the same `harmonic-segment` id — satisfies both, keeps ONE Harmonic entry (D-10), and was chosen over adding a second option.
- **Shared segment params across harmonic + subharmonic:** both sub-methods take lo/hi + reduce, so a single `segLo/segHi/segReduce` triple backs both; switching between them preserves the user's bounds (cleaner than two parallel param sets).
- **harmonicScaleText() drops a leading 1/1:** mirrors the generateCps Send-to fix — `parseScala` always auto-prepends 1/1, so the widget's leading unison (8/8 = "1" literal, or 1/1 reduced/iso) is stripped to avoid a duplicate.

## Deviations from Plan

None — plan executed exactly as written. The D-08 migration ambiguity flagged in the design rule was resolved in favor of the preferred clean migration (one id, byte-for-byte first paint preserved) as documented above; this was an anticipated decision within the plan's design rule, not a deviation.

## Threat Surface

All `mitigate` dispositions from the plan's threat register are implemented:
- **T-06-13 (DoS, harmonic builders via widget inputs):** relies on the harmonic.ts D-14 caps (MAX_HARMONIC 1024, MAX_DIVISIONS 1000, MAX_ISO_COUNT 1024); a kernel RangeError surfaces in the `role="status"` region without freezing, and the prior render is preserved (mosBuilder idiom). Numeric inputs carry `min`/`step` as a first clamp; an in-progress/empty edit leaves state untouched rather than crashing. Tested via the `hi <= lo` RangeError case.
- **T-06-14 (XSS, widget DOM rendering):** all inputs / labels / status via `createElement` + `textContent`; numeric inputs are `type="number"`, the equave is two number inputs, reduce is a checkbox; no `innerHTML` with dynamic content. (The scaleTable thead's static `innerHTML` is value-free, already Phase-2 audited.)
- **T-06-15 (Tampering, Send-to URL):** unchanged — Send-to reuses the existing Phase-5-audited `encodeScaleToHash` / 8 KB cap path.
- **T-06-SC (npm installs):** no new dependency, no install task.

No new security surface beyond the plan's threat model.

## Known Stubs

None — `generateHarmonic` is fully wired to the four `harmonic.ts` builders; the default harmonic 8..16 renders real exact-JI data, every sub-method drives a live re-render, the reduce toggle folds octave-equivalents, and Send-to serializes the actual current scale. No placeholder data paths.

## Self-Check: PASSED

- FOUND: src/components/generate-harmonic.ts
- FOUND: src/components/generate-harmonic.css
- FOUND: src/components/__tests__/generate-harmonic.test.ts
- FOUND: src/pages/generate.md (harmonic option + mount + Send-to wiring)
- FOUND: src/styles.css (@import generate-harmonic.css)
- FOUND commit d3253d9 (test — RED)
- FOUND commit b55a54c (feat — GREEN, widget)
- FOUND commit 4623098 (feat — picker wiring)

## TDD Gate Compliance

- RED gate: `d3253d9` `test(06-06): add failing tests for generateHarmonic widget` (confirmed failing — module `../generate-harmonic.js` unresolvable).
- GREEN gate: `b55a54c` `feat(06-06): implement generateHarmonic widget (GEN-02, GEN-03)` (all 15 tests pass).
- REFACTOR: not needed — implementation was clean at GREEN.

## Next Phase Readiness

- GEN-02 + GEN-03 (harmonic / subharmonic / ADO / isoharmonic) are shipped and live on the Generate surface; the Pattern-2 + picker-registration precedent is now exercised three times (mosBuilder, generateCps, generateHarmonic) for the remaining Phase-6 generator widget (06-07).
- No blockers. harmonic-segment remains the page's default landing method (D-08 preserved).

---
*Phase: 06-exact-rational-ji-harmonic-generators*
*Completed: 2026-06-10*
