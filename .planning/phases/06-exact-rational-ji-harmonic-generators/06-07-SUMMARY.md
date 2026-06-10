---
phase: 06-exact-rational-ji-harmonic-generators
plan: 07
subsystem: ui
tags: [ji-set, diamond, odd-limit, prime-limit, farey, edo, ed-n, tempered, best-ji-in-edo, generate-surface, web-component, surf-06]

# Dependency graph
requires:
  - phase: 06-exact-rational-ji-harmonic-generators (Plan 03)
    provides: "diamondScale / oddLimitSet / primeLimitSet / fareyScale (exact JI) + edScale (tempered)"
  - phase: 06-exact-rational-ji-harmonic-generators (Plan 04)
    provides: "scaleTable tempered variant — { tempered: true } cents-only + 'tempered' badge"
  - phase: 06-exact-rational-ji-harmonic-generators (Plan 06)
    provides: "Pattern-2 factory + picker-registration + makeRatioField precedent (generateHarmonic)"
  - phase: 06-exact-rational-ji-harmonic-generators (existing kernel)
    provides: "bestJiInEdo(steps, limit, kind) — best-JI-in-EDO search (edo.ts)"
  - phase: 05-generate-surface-live-integration-foundation
    provides: "Generate picker (METHOD_FAMILIES native <select>), paramsHost/previewHost swap, Send-to + scale-store, parseScala cents detection"
provides:
  - "generateJiSet(synth, opts) — Pattern-2 exact-JI widget (diamond / odd-limit / prime-limit / Farey), 4-column scaleTable, ratio-per-line Send-to"
  - "generateEd(synth, opts) — Pattern-2 TEMPERED widget (EDO / ED-n editable equave / best-JI-in-EDO), cents-only scaleTable + badge, cents-per-line Send-to"
  - "Both reachable via the picker's native optgroups: ji-set → JI combinatorial, ed → Regular / equal temperament"
  - "The phase's generator roster is COMPLETE — every Phase-6 GEN requirement is live on the Generate surface"
affects:
  - "Generate surface (generate.md) — final generator wiring of the phase"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern-2 factory widget with closure-local state + status region + replaceChildren (mosBuilder / generateCps / generateHarmonic precedent)"
    - "Per-sub-method parameter slots: generateJiSet tracks limit-by-submethod; generateEd tracks divisions-by-submethod (EDO 12 / ED-n 13 / best-JI 12) so each restores its own D-09 default + remembered edit"
    - "isTempered() marker on the ED root element → generate.md picks the cents-per-line Send-to branch (D-03); the tempered scale NEVER serializes as ratios (SURF-06)"
    - "Tempered Send-to: iv.cents.toFixed(4) per line — the '.' triggers parseScala's cents detection on the receiving Dashboard / Analysis page"
    - "Widget instantiated ONCE in a page cell so its closure state survives picker mount/unmount swaps"

key-files:
  created:
    - "src/components/generate-ji-set.ts"
    - "src/components/generate-ji-set.css"
    - "src/components/__tests__/generate-ji-set.test.ts"
    - "src/components/generate-ed.ts"
    - "src/components/generate-ed.css"
    - "src/components/__tests__/generate-ed.test.ts"
  modified:
    - "src/pages/generate.md"
    - "src/styles.css"

key-decisions:
  - "generateEd tracks divisions PER sub-method (EDO 12 / ED-n 13 / best-JI 12) instead of one shared variable — required to satisfy the D-09 defaults (EDO 12 but ED-n 13 = Bohlen-Pierce); mirrors generateJiSet's per-sub-method limit slot"
  - "The ED widget exposes a SECOND accessor isTempered() alongside getScale() (chosen over a _tempered property) — typed via GenerateEdElement, drives the cents-per-line Send-to branch in generate.md (D-03)"
  - "edScaleText() drops a leading 0¢ unison (|cents| < 1e-6) — the tempered analog of the CPS/harmonic leading-1/1 strip; parseScala auto-prepends 1/1, so we omit the k=0 unison to avoid a duplicate"

requirements-completed: [GEN-04, GEN-05, SURF-06]

# Metrics
duration: 7min
completed: 2026-06-10
---

# Phase 6 Plan 07: JI-Set + Tempered Equal-Division Widgets Summary

**Two Pattern-2 Generate widgets close the phase's generator roster: `generateJiSet` (diamond / odd-limit / prime-limit / Farey — exact JI, 4-column table, GEN-04) and `generateEd` (EDO / ED-n with an editable equave / best-JI-in-EDO — the FIRST tempered family, cents-only table + "tempered" badge, GEN-05 / SURF-06). Both are wired into the picker's native optgroups; the ED widget serializes Send-to as cents-per-line so a temperament is never laundered as exact JI (D-03 / SURF-06), and harmonic-segment stays the default landing (D-08).**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-10T16:38:45Z
- **Completed:** 2026-06-10T16:46:01Z
- **Tasks:** 3 (2 TDD widgets + 1 page-wiring)
- **Files modified:** 8 (6 created, 2 modified)

## Accomplishments

- **`generateJiSet(synth, opts)`** — sub-method `<select>` (diamond / odd-limit / prime-limit / Farey; default diamond) + a SINGLE relabelled limit/order integer input (no equave field, D-07: JI families fixed at 2/1). Dispatches to `diamondScale` / `oddLimitSet` / `primeLimitSet` / `fareyScale` and renders the EXACT-JI 4-column `scaleTable` (Ratio column present, NO tempered badge) + ⏵⏵ Play. D-09 defaults: diamond 9, odd-limit 9, prime-limit 5, Farey order 8. Per-sub-method limit slot restores each method's own value on swap.
- **`generateEd(synth, opts)`** — sub-method `<select>` (EDO / ED-n / best-JI-in-EDO; default EDO). EDO → divisions only (equave fixed 2/1). ED-n → divisions + an editable equave n/d ratio field (the mosBuilder `makeRatioField` idiom, D-06; default 13 over 3/1 = Bohlen-Pierce). best-JI-in-EDO → divisions + limit + a prime/odd kind select reusing the existing `bestJiInEdo` kernel (D-05). ALL three render via `scaleTable(scale, baseHz, { tempered: true })` — cents-only (no Ratio column, D-01) + a "tempered" badge (D-02). D-09 defaults: EDO 12, ED-n 13, best-JI 12 / prime 5.
- **Tempered, not laundered JI (SURF-06):** the ED widget marks itself `isTempered()`; `generate.md`'s Send-to serializes its scale CENTS-per-line (`iv.cents.toFixed(4)` — the `.` triggers parseScala's cents path on the receiver), never ratios. The JI-set widget serializes ratio-per-line (exact JI).
- **Picker wiring (Approach B native optgroups, D-10):** `ji-set` added to "JI combinatorial" alongside CPS; the "Regular / equal temperament" `(coming soon)` placeholder replaced with `ed`. Each widget instantiated ONCE; mounted in the params-host swap; the shared preview-host shows a pointer caption (each widget renders its own table).
- **D-08 anti-regression verified:** the placeholder default option (`value=""`, selected) and the harmonic-segment landing branch are untouched — the page's first paint is unchanged.

## Task Commits

Each task committed atomically:

1. **Task 1 (RED): failing generateJiSet tests** — `19f9c0d` (test)
2. **Task 1 (GREEN): generateJiSet widget + CSS + @import** — `ca99b83` (feat)
3. **Task 2 (RED): failing generateEd tests** — `ac802e4` (test)
4. **Task 2 (GREEN): generateEd tempered widget + CSS + @import** — `79495ed` (feat)
5. **Task 3: wire ji-set + ed into generate.md; tempered cents-per-line Send-to** — `4f2ddb1` (feat)

**Plan metadata:** (final docs commit — this SUMMARY + STATE + ROADMAP + REQUIREMENTS).

_Each TDD task produced a test→feat pair; no refactor commit was needed (implementations were clean at GREEN)._

## Files Created/Modified

- `src/components/generate-ji-set.ts` — Pattern-2 exact-JI widget: closure-local sub-method + per-sub-method limit, sub-method select + single relabelled limit/order input, status region, scaleTable (4-column) + playScale hosts, `getScale()` accessor.
- `src/components/generate-ji-set.css` — `.generate-ji-set__*` classes (form, field, status, hosts) using only locked theme tokens (D-15).
- `src/components/__tests__/generate-ji-set.test.ts` — 14 happy-dom tests: sub-method swap, default diamond render, Farey/odd/prime re-render, exact-JI 4-column assertion (Ratio present, no badge), limit/order relabel, RangeError preservation, Play, getScale().
- `src/components/generate-ed.ts` — Pattern-2 TEMPERED widget: closure-local sub-method + divisions-by-submethod + equave + best-JI limit/kind, sub-method select, params sub-region (replaceChildren), status region, tempered scaleTable + playScale hosts, `getScale()` + `isTempered()` accessors. `makeIntField` / `makeRatioField` / `makeKindField` input builders.
- `src/components/generate-ed.css` — `.generate-ed__*` classes (form, params, field, slash, status, hosts) using only locked theme tokens (D-15); the "tempered" badge styling lives in scale-table.css (Plan 04).
- `src/components/__tests__/generate-ed.test.ts` — 14 happy-dom tests: sub-method swap, the load-bearing tempered-badge + no-Ratio-column assertion on the EDO default, cents ≈ k*100, ED-n editable equave (3/1 → last cents ≈ 1901.955¢), EDO-after-ED-n hides the equave field, best-JI reuses bestJiInEdo, RangeError preservation, Play, getScale()/isTempered().
- `src/pages/generate.md` — imported + instantiated both widgets once; registered `ji-set` (JI combinatorial) + `ed` (Regular); params/preview swap branches; `jiSetScaleText()` (ratio-per-line) + `edScaleText()` (cents-per-line, D-03) Send-to serialization; SEND_SOURCE reflects the active method.
- `src/styles.css` — `@import "./components/generate-ji-set.css";` + `@import "./components/generate-ed.css";`.

## Verification

- `npx vitest run src/components/__tests__/generate-ji-set.test.ts` — 14/14 pass.
- `npx vitest run src/components/__tests__/generate-ed.test.ts` — 14/14 pass.
- `npx tsc --noEmit` — clean (exit 0).
- `npx eslint src/components/generate-ji-set.ts src/components/generate-ed.ts` — clean (exit 0; the `.eslintignore` deprecation is pre-existing repo-wide noise). The page (`generate.md`) is intentionally not linted — Framework transpiles markdown JS cells (CLAUDE.md: don't lint markdown JS code blocks).
- `npm run build` — succeeds; all pages built including `/generate`; 136 links validated.
- Full suite `npx vitest run` — 494/494 pass, no regressions (466 prior + 14 ji-set + 14 ed).

## Decisions Made

- **`generateEd` tracks divisions PER sub-method (EDO 12 / ED-n 13 / best-JI 12).** Discovered during Task 2 GREEN: a single shared `divisions` variable left ED-n at 12 after switching from EDO, violating the D-09 ED-n-13 (Bohlen-Pierce) default. Switched to a `divisionsBy` record (mirroring `generateJiSet`'s per-sub-method limit slot) so each sub-method restores its own D-09 default and any remembered edit. See Deviations.
- **`isTempered()` accessor (not a `_tempered` property).** The ED root element exposes a typed `isTempered(): boolean` alongside `getScale()` (via `GenerateEdElement`), consistent with the `getScale()`-method-over-`any`-cast precedent from generateCps. `generate.md` reads it to choose the cents-per-line Send-to branch (D-03).
- **`edScaleText()` drops a leading 0¢ unison** (`Math.abs(ivs[0].cents) < 1e-6`) — the tempered analog of the CPS/harmonic leading-1/1 strip; `parseScala` auto-prepends 1/1, so omitting the k=0 unison avoids a duplicate after the round-trip.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] generateEd ED-n divisions defaulted to EDO's 12, not the D-09 Bohlen-Pierce 13**
- **Found during:** Task 2 (GREEN) — two `generate-ed.test.ts` cases failed: "switching to ED-n shows a divisions input (default 13)" expected `13` but got `12`, and "ED-n 13 over 3/1 renders 14 rows" got 13 rows.
- **Issue:** The first GREEN implementation used a single closure-local `divisions = 12` shared across all three sub-methods. The plan's D-09 defaults are EDO 12 / ED-n 13 / best-JI 12 — EDO and best-JI share 12 but ED-n is 13 (Bohlen-Pierce ED3). Switching to ED-n kept the shared 12.
- **Fix:** Replaced the shared `divisions` with a `divisionsBy: Record<SubMethod, number> = { edo: 12, "ed-n": 13, "best-ji": 12 }` slot; `renderParams()` and `buildScale()` read/write `divisionsBy[sub]`. This restores each sub-method's own D-09 default and any subsequent user edit on swap-away-and-back — the same per-sub-method-parameter pattern already used in `generateJiSet` for the limit/order.
- **Files modified:** src/components/generate-ed.ts
- **Verification:** all 14 generate-ed tests pass; tsc + full suite green.
- **Committed in:** `79495ed` (Task 2 GREEN — a correctness fix folded into GREEN, not post-green cleanup).

**Note (test-author detail, not a code deviation):** the generate-ed RED test indexed `rows[13]` directly, which trips `noUncheckedIndexedAccess` under strict tsc. Adjusted the test to `rows[rows.length - 1]!` (the codebase test idiom). This is a test-file edit, not a Rules 1–4 code deviation.

**Total deviations:** 1 auto-fixed (1 correctness fix to honor the D-09 ED-n default).
**Impact on plan:** None on scope — the fix aligns the ED widget with the plan's own D-09 defaults table.

## Threat Surface

All `mitigate` dispositions from the plan's threat register are implemented:
- **T-06-16 (DoS, generators + bestJiInEdo via widget inputs):** relies on the kernel's D-14 caps (oddLimit/primeLimit ≤ 31, Farey ≤ 1000, divisions ≤ 1000; bestJiInEdo limit ≤ 31). A kernel RangeError surfaces in the `role="status"` region without freezing, and the prior render is preserved (mosBuilder idiom). Numeric inputs carry `min`/`max` as a first clamp; a transient/empty edit leaves state untouched rather than crashing. Tested via the out-of-range limit (ji-set) and divisions=5000 (ed) RangeError cases.
- **T-06-17 (XSS, both widgets' DOM incl. the equave field):** all inputs / labels / status via `createElement` + `textContent`; the equave field is two `type="number"` inputs; the kind select is a `<select>` of static options; no `innerHTML` with dynamic content. (The scaleTable thead's static `innerHTML` is value-free, already Phase-2/Plan-04 audited.)
- **T-06-18 (Tampering, laundered JI):** the ED widget renders via the tempered scaleTable (no ratio column, D-01) + badge (D-02); Send-to serializes cents-per-line (D-03) — `edScaleText()` emits `iv.cents.toFixed(4)`, never `iv.toString()` ratios — so no float-derived fraction is ever presented or persisted as exact JI (SURF-06). The `isTempered()` gate ensures only the tempered branch takes the cents path.
- **T-06-19 (Tampering, tempered cents-per-line round-trip):** the cents text carries a `.` so parseScala detects cents on the receiver; it passes through the existing Phase-5-audited `encodeScaleToHash` 8 KB cap; the receiver renders via textContent — no injection.
- **T-06-SC (npm installs):** no new dependency, no install task.

No new security surface beyond the plan's threat model.

## Known Stubs

None — both widgets are fully wired to real kernel builders (`diamondScale` / `oddLimitSet` / `primeLimitSet` / `fareyScale` / `edScale` / `bestJiInEdo`); every sub-method drives a live re-render with real exact-JI or tempered-cents data, and Send-to serializes the actual current scale. No placeholder data paths.

## Self-Check: PASSED

- FOUND: src/components/generate-ji-set.ts
- FOUND: src/components/generate-ji-set.css
- FOUND: src/components/__tests__/generate-ji-set.test.ts
- FOUND: src/components/generate-ed.ts
- FOUND: src/components/generate-ed.css
- FOUND: src/components/__tests__/generate-ed.test.ts
- FOUND: src/pages/generate.md (ji-set + ed options + mounts + Send-to wiring)
- FOUND: src/styles.css (@import generate-ji-set.css + generate-ed.css)
- FOUND commit 19f9c0d (test — ji-set RED)
- FOUND commit ca99b83 (feat — ji-set GREEN)
- FOUND commit ac802e4 (test — ed RED)
- FOUND commit 79495ed (feat — ed GREEN)
- FOUND commit 4f2ddb1 (feat — picker wiring)

## TDD Gate Compliance

- **generateJiSet** — RED: `19f9c0d` `test(06-07): add failing tests for generateJiSet widget` (confirmed failing — module `../generate-ji-set.js` unresolvable). GREEN: `ca99b83` `feat(06-07): implement generateJiSet widget (GEN-04)` (all 14 tests pass). REFACTOR: not needed.
- **generateEd** — RED: `ac802e4` `test(06-07): add failing tests for generateEd widget` (confirmed failing — module `../generate-ed.js` unresolvable). GREEN: `79495ed` `feat(06-07): implement generateEd tempered widget (GEN-05, SURF-06)` (all 14 tests pass; the divisions-per-submethod fix folded into GREEN). REFACTOR: not needed.

## Next Phase Readiness

- GEN-04 (diamond / odd-limit / prime-limit / Farey) + GEN-05 (EDO / ED-n / best-JI-in-EDO) + SURF-06 (tempered, not laundered JI) are shipped and live on the Generate surface. The phase's generator roster is COMPLETE — every Phase-6 GEN requirement is reachable via the picker.
- The Pattern-2 + picker-registration precedent is now exercised five times (mosBuilder, generateCps, generateHarmonic, generateJiSet, generateEd). The tempered-presentation contract (cents-only table + badge + cents-per-line Send-to) is established end-to-end for any future tempered method (rank-2 / well-temperament / Fokker in the next phase).
- No blockers. harmonic-segment remains the page's default landing method (D-08 preserved).

---
*Phase: 06-exact-rational-ji-harmonic-generators*
*Completed: 2026-06-10*
