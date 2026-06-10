---
phase: 06-exact-rational-ji-harmonic-generators
verified: 2026-06-10T10:20:00Z
status: human_needed
score: 5/5
overrides_applied: 0
human_verification:
  - test: "Pick each method (CPS → Hexany, Harmonic segment, ADO, JI-set → Diamond, EDO 12, ED-n 13-ED3) from the Generate page in a browser. For each, confirm the table renders and the Play button auditions the scale without error."
    expected: "Table rows appear, ⏵⏵ Play triggers audio. No JS console errors."
    why_human: "Audio (Web Audio API) and browser rendering cannot be verified with grep or unit tests alone."
  - test: "On the EDO method (12-EDO), visually confirm: (a) the table shows only Degree / Cents / ¢-from-12tet columns (no Ratio column), and (b) the 'tempered' badge appears above the table."
    expected: "Three-column table with badge — NO ratio column visible."
    why_human: "SURF-06's visible distinction requirement is a browser rendering concern. Unit tests assert DOM structure; human confirms actual appearance."
  - test: "Click 'Send to Dashboard' and 'Send to Analysis' from the CPS (Hexany), Harmonic, JI-set (Diamond), and EDO methods. Confirm each target page loads the sent scale correctly — ratios for JI methods, cents-defined scale for EDO."
    expected: "Dashboard / Analysis each display the scale produced by the generator. EDO round-trip: Analysis interprets the received scale as cents (no spurious ratios)."
    why_human: "End-to-end navigation + store round-trip requires a running browser session."
  - test: "Open the Generate page and verify it defaults to the harmonic segment (D-08 anti-regression). The picker should show '— pick a method —' selected; selecting 'Harmonic / subharmonic / ADO / isoharmonic' should show the harmonic 8..16 table immediately."
    expected: "First load matches Phase-5 boot behavior (harmonic-segment as default landing)."
    why_human: "Default-on-load behavior and picker state require a live browser to confirm byte-for-byte."
---

# Phase 6: Exact-Rational JI & Harmonic Generators — Verification Report

**Phase Goal:** The JI core the user cares about most ships as transparent, BigInt-exact kernel primitives, each surfaced as a method widget in the picker — plus the first tempered family (EDO/ED-n), which establishes the "tempered, not laundered JI" representation.
**Verified:** 2026-06-10T10:20:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can generate a CPS from a factor set and choose-k, with Hexany/Dekany/Eikosany presets — the 1-3-5-7 Hexany matches its canonical exact set, deduped by BigInt ratio (never cents tolerance) | VERIFIED | `cps.ts` hand-rolls over `kCombinations`, dedupes strictly on `iv.fraction.toFraction()`, test `cps([1,3,5,7],2)` asserts exact `["1/1","7/6","5/4","35/24","5/3","7/4","2/1"]`. `generate-cps.ts` wired in `generate.md` under JI combinatorial optgroup. 14/14 component tests pass. |
| 2 | User can generate harmonic and subharmonic segment scales, an ADO scale, and isoharmonic chords — each with exact integer-derived ratios | VERIFIED | `harmonic.ts` ships all four builders (`harmonicSegment`, `subharmonicSegment`, `adoScale`, `isoharmonic`). `adoScale(6,2/1)` asserts exact AFDO-6 vector. `harmonicSegment(8,16)` asserts `h/8` strings. D-04 reduce default is `false` (literal overtone form). 17/17 kernel tests pass. `generate-harmonic.ts` wired in `generate.md`. |
| 3 | User can generate a tonality-diamond scale, an odd/prime-limit JI set, and a Farey/Stern-Brocot subset — exact and deduped | VERIFIED | `generators.ts` ships `diamondScale` (reuses `enumerateDiamond`), `oddLimitSet`, `primeLimitSet`, `fareyScale`. All dedupe by exact `n/d` string key. 15/15 kernel tests pass. `generate-ji-set.ts` wired in `generate.md` under JI combinatorial optgroup alongside CPS. |
| 4 | User can generate an EDO and an ED-n scale, and these tempered scales are visibly distinguished from exact JI (a "tempered" label, cents-primary presentation) with no float-derived ratios presented as exact JI | VERIFIED (with noted risk — see CR-01) | `edScale` builds pitches from `centsToRatio(stepCents)` — cents is source of truth. `generate-ed.ts` calls `scaleTable(scale, baseHz, { precision, tempered: true })` — no `copyButton` passed. `scale-table.ts` drops Ratio column and adds `.scale-table__badge` when `tempered:true`. Badge uses only `var(--theme-*)` tokens. `edScaleText()` in `generate.md` serializes cents-per-line with `.toFixed(4)`. No shipped caller combines `tempered:true` and `copyButton:true`. CR-01 is a latent contract gap (see anti-patterns). |
| 5 | Every generated scale auditions and can be sent to Dashboard/Analysis (tempered scales serialize as cents-per-line text) | VERIFIED (automated portion) | All four widgets wire `playScale` in their `rebuild()`. `generate.md` has `sendCurrentScaleTo()` with method-branched serialization: CPS/harmonic/ji-set → ratio-per-line; ed → `iv.cents.toFixed(4)` per-line (D-03). `writeSharedScale` + `encodeScaleToHash` path unchanged from Phase 5. Audio and browser round-trip need human verification (see below). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/cps.ts` | BigInt-exact CPS kernel, exports `cps` | VERIFIED | 125 LOC, hand-rolled, dedupes by `iv.fraction.toFraction()`, D-14 caps, D-12 ownership |
| `src/lib/__tests__/cps.test.ts` | Verified-vector tests for Hexany + presets + caps | VERIFIED | 7 tests, all green, canonical Hexany vector asserted |
| `src/lib/harmonic.ts` | 4 exact-integer builders | VERIFIED | 228 LOC, all four exports, D-04 reduce default false, D-14 caps |
| `src/lib/__tests__/harmonic.test.ts` | Verified-vector tests for all four builders | VERIFIED | 17 tests, all green, AFDO-6 vector asserted |
| `src/lib/generators.ts` | 5 builders (4 exact JI + edScale tempered) | VERIFIED | 254 LOC, all five exports, edScale cents-sourced, JI dedupe by exact n/d |
| `src/lib/__tests__/generators.test.ts` | Verified-vector tests; edScale asserts CENTS not ratios | VERIFIED | 15 tests, all green, edScale assertions use `toBeCloseTo` on cents |
| `src/components/scale-table.ts` | scaleTable with tempered variant + badge | VERIFIED | `tempered?: boolean` in opts, 3-col when true, badge via createElement+textContent, no-ratio |
| `src/components/scale-table.css` | Badge styling with existing theme tokens only | VERIFIED | `.scale-table__badge` uses `var(--sans-serif)`, `var(--theme-foreground-alt)`, `color-mix` — no hardcoded hex |
| `src/components/__tests__/scale-table.test.ts` | Tests for both 4-col JI and 3-col tempered + badge | VERIFIED | 9 tests, both paths covered, anti-regression for 4-col present |
| `src/components/generate-cps.ts` | Pattern-2 CPS widget with chip input + preset select | VERIFIED | D-13 chip input via createElement+textContent, positive-int validation, PRESETS seed, getScale() exposed |
| `src/components/__tests__/generate-cps.test.ts` | Tests for chips, preset, Hexany render, Play | VERIFIED | 14 tests, row counts 7/11/21 asserted, invalid chip rejection |
| `src/components/generate-harmonic.ts` | Pattern-2 harmonic widget with 4 sub-methods + reduce toggle | VERIFIED | harmonic default, D-04 reduce=false, ADO equave ratio field, isoharmonic |
| `src/components/__tests__/generate-harmonic.test.ts` | Tests for sub-method swap, default render, reduce toggle | VERIFIED | 15 tests, harmonic 8..16 → 9 rows, ADO 6 → 7 rows asserted |
| `src/components/generate-ji-set.ts` | Pattern-2 JI-set widget (diamond/odd/prime/Farey) | VERIFIED | D-07 no equave field, DEFAULT 4-col scaleTable (no tempered), getScale() |
| `src/components/__tests__/generate-ji-set.test.ts` | Tests for sub-method swap, exact JI table, Play | VERIFIED | 14 tests, no tempered badge on JI sets asserted |
| `src/components/generate-ed.ts` | Pattern-2 tempered EDO/ED-n widget + best-JI-in-EDO | VERIFIED | `scaleTable(..., { tempered: true })` always, isTempered() returns true, ED-n equave field (D-06), bestJiInEdo (D-05) |
| `src/components/__tests__/generate-ed.test.ts` | Tests for EDO tempered badge + no Ratio header, ED-n equave | VERIFIED | 14 tests, badge present, Ratio header absent asserted |
| `src/pages/generate.md` | Picker registration of all 4 widgets + tempered Send-to | VERIFIED | All four optgroup options registered, cents-per-line edScaleText(), D-08 harmonic-segment default preserved |
| `src/lib/INVENTORY.md` | Kernel inventory rows for all 9 new symbols | VERIFIED | Rows present for `cps`, `harmonicSegment`, `subharmonicSegment`, `adoScale`, `isoharmonic`, `diamondScale`, `oddLimitSet`, `primeLimitSet`, `fareyScale`, `edScale` (10 rows, edScale row includes tempered caveat) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/cps.ts` | `src/lib/interval.ts` | `octaveReduce` | WIRED | `cps.ts:103` calls `.div(rootMin).octaveReduce(period)` |
| `src/lib/cps.ts` | `xen-dev-utils` | `kCombinations` | WIRED | `cps.ts:79` calls `kCombinations(factors, k)` |
| `src/lib/harmonic.ts` | `src/lib/interval.ts` | `new Interval` construction | WIRED | All four builders construct intervals with `new Interval("${n}/${m}")` |
| `src/lib/harmonic.ts` | `src/lib/scale.ts` | `new Scale` | WIRED | All four return `new Scale(intervals, period)` |
| `src/lib/generators.ts` | `src/lib/diamond.ts` | `enumerateDiamond` reuse | WIRED | `generators.ts:114` calls `enumerateDiamond(oddLimitN, throwaway)` |
| `src/lib/generators.ts` | `src/lib/monzo.ts` | `oddLimit` ceiling test | WIRED | `generators.ts:144` tests `oddLimit(iv.monzo) <= limit` |
| `src/lib/generators.ts` | `src/lib/cents.ts` | `centsToRatio` for tempered pitches | WIRED | `generators.ts:247` calls `new Interval(centsToRatio(stepCents))` |
| `src/components/generate-cps.ts` | `src/lib/cps.ts` | `cps()` kernel call | WIRED | `generate-cps.ts:236` calls `cps(ivs, k)` |
| `src/pages/generate.md` | `src/components/generate-cps.ts` | JI combinatorial optgroup mount | WIRED | `generate.md:327` does `paramsHost.replaceChildren(cpsWidget)` |
| `src/components/generate-harmonic.ts` | `src/lib/harmonic.ts` | all four builder calls | WIRED | `generate-harmonic.ts:328,330,332,334` dispatch to all four builders |
| `src/pages/generate.md` | `src/components/generate-harmonic.ts` | harmonic optgroup mount | WIRED | `generate.md:321` mounts `harmonicWidget` |
| `src/components/generate-ji-set.ts` | `src/lib/generators.ts` | `diamondScale/oddLimitSet/fareyScale` calls | WIRED | `generate-ji-set.ts:186-194` dispatch block |
| `src/components/generate-ed.ts` | `src/lib/generators.ts` | `edScale()` call | WIRED | `generate-ed.ts:324,326` calls `edScale(...)` |
| `src/components/generate-ed.ts` | `src/lib/edo.ts` | `bestJiInEdo` for best-JI sub-mode | WIRED | `generate-ed.ts:328` calls `bestJiInEdo(divisions, bestJiLimit, bestJiKind)` |
| `src/components/generate-ed.ts` | `src/components/scale-table.ts` | `scaleTable({ tempered: true })` | WIRED | `generate-ed.ts:338` passes `{ precision, tempered: true }` — NO `copyButton` |
| `src/pages/generate.md` | `src/components/generate-ed.ts` | Regular optgroup mount + cents-per-line Send-to | WIRED | `generate.md:339` mounts `edWidget`; `edScaleText()` at line 279 uses `iv.cents.toFixed(4)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `generate-cps.ts` | `currentScale` | `cps(ivs, k)` → BigInt-exact Scale | Yes — kernel returns scale from factor products | FLOWING |
| `generate-harmonic.ts` | `currentScale` | `harmonicSegment/adoScale/isoharmonic` dispatch | Yes — integer-derived exact Scale | FLOWING |
| `generate-ji-set.ts` | `currentScale` | `diamondScale/oddLimitSet/primeLimitSet/fareyScale` dispatch | Yes — exact JI Scale from generators.ts | FLOWING |
| `generate-ed.ts` | `currentScale` | `edScale(divisions, equave)` or `bestJiInEdo(...)` | Yes — cents-sourced tempered Scale | FLOWING |
| `scale-table.ts` | `scale.intervals` | passed-in Scale (never null at render time — null guarded by widget) | Yes — renders all intervals from the Scale | FLOWING |
| `generate.md` `edScaleText()` | `scale.intervals` | `edWidget.getScale()` → live widget state | Yes — reads current scale at click time | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 39 kernel tests pass (cps + harmonic + generators) | `npx vitest run src/lib/__tests__/cps.test.ts src/lib/__tests__/harmonic.test.ts src/lib/__tests__/generators.test.ts` | 3 files, 39 tests, all green | PASS |
| 66 component tests pass (scale-table + all 4 widgets) | `npx vitest run src/components/__tests__/scale-table.test.ts ... generate-ed.test.ts` | 5 files, 66 tests, all green | PASS |
| Full suite (494 tests, all phases) | `npx vitest run` | 36 files, 494 tests, all green | PASS |
| TypeScript type-check | `npx tsc --noEmit` | Clean (no output) | PASS |
| Build | `npm run build` | 136 links validated, generate page 35 kB | PASS |

### Probe Execution

No probe scripts declared for this phase. Step 7c: SKIPPED (no `scripts/*/tests/probe-*.sh` for this phase).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| GEN-01 | 06-01, 06-05 | User can generate a CPS from a factor set and choose-k, with Hexany/Dekany/Eikosany presets | SATISFIED | `cps.ts` + `generate-cps.ts` wired and tested; canonical Hexany vector verified |
| GEN-02 | 06-02, 06-06 | User can generate harmonic and subharmonic segment scales | SATISFIED | `harmonicSegment` + `subharmonicSegment` in `harmonic.ts`; widget in `generate-harmonic.ts` |
| GEN-03 | 06-02, 06-06 | User can generate an ADO scale and isoharmonic chords | SATISFIED | `adoScale` + `isoharmonic` in `harmonic.ts`; AFDO-6 vector verified; widget sub-methods |
| GEN-04 | 06-03, 06-07 | User can generate a tonality-diamond scale, odd/prime-limit JI set, and Farey/Stern-Brocot subset | SATISFIED | All four builders in `generators.ts`; widget in `generate-ji-set.ts` |
| GEN-05 | 06-03, 06-07 | User can generate an EDO and an ED-n scale | SATISFIED | `edScale` in `generators.ts`; `generate-ed.ts` with EDO + ED-n + best-JI sub-modes; D-06 equave field |
| SURF-06 | 06-03, 06-04, 06-07 | Tempered scales are visibly distinguished from exact JI — cents-primary, "tempered" label, no float-derived ratios as exact JI | SATISFIED (with latent contract risk CR-01) | `scaleTable` drops Ratio column + shows badge when `tempered:true`; no shipped widget passes `copyButton:true` alongside `tempered:true`; Send-to is cents-per-line for tempered |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/scale-table.ts` | 100 | `scalaToCsv(scale, baseHz)` called unconditionally in copy handler without tempered flag (CR-01 from 06-REVIEW.md) | WARNING | **Latent contract gap only** — no shipped widget passes both `{ tempered: true, copyButton: true }`. The visible table is correct (no Ratio column). If a future caller combines both flags, the copy payload would emit float-derived ratios in a Ratio column. The contract is broken at the API surface but the user-reachable code path today does not expose it. |
| `src/components/generate-harmonic.ts` | 75-78 | `parseIntOrNull` uses bare `parseInt` + vacuous `Number.isInteger` guard — accepts `"2.5"` as `2`, `"1e3"` as `1` (WR-01) | WARNING | Silent truncation of non-canonical integer input. First clamp is HTML `type="number"` with `min`/`max`; kernel D-14 caps are last-resort defense. No data corruption — just misleading UX on edge inputs. |
| `src/components/generate-ji-set.ts` | 86-91 | Same loose `parseIntOrNull` (WR-01 duplicate) | WARNING | Same as above |
| `src/components/generate-ed.ts` | 75-80 | Same loose `parseIntOrNull` (WR-01 duplicate) | WARNING | Same as above |
| `src/components/generate-cps.ts` | 283 | `Number.isInteger(parseInt(x,10))` vacuous guard (IN-02) — `parseInt` always returns integer or NaN | INFO | Misleading to readers; no functional impact since `parsePositiveInt` already uses the strict regex before this |
| `src/lib/generators.ts` | 134, 163 | `period` param on `oddLimitSet`/`primeLimitSet` is unsafe for non-octave values (WR-03) | INFO | Latent only — `generate-ji-set.ts` always uses the default `OCTAVE` (D-07). No live violation. |
| `src/lib/generators.ts` | 242-252 | Last `edScale` interval (lossy `centsToRatio`) differs from exact `equave` period (WR-04) | INFO | Latent correctness gap — `Scale.reduce()` would mis-handle a tempered scale; no current code path calls `reduce()` on tempered scales. |

No `TBD`, `FIXME`, or `XXX` debt markers found in any phase-6 file.

### Human Verification Required

#### 1. Full method audition in-browser

**Test:** Open `/generate` in a running `observable preview`. Select each of: CPS (Hexany preset), Harmonic segment (default), ADO sub-method, JI-set → Diamond, EDO 12, ED-n 13 over 3/1. For each, confirm the table populates and the Play button auditions the scale without console error.
**Expected:** Table rows appear per the generator; ⏵⏵ Play triggers audio with no JS console errors.
**Why human:** Web Audio API output and visual rendering require a live browser; unit tests cover DOM structure but not audio output.

#### 2. SURF-06 visual distinction — tempered badge + no Ratio column

**Test:** With the Generate page open, select "EDO / equal division (ED-n)". Visually confirm: (a) the rendered table has no "Ratio" column header, (b) the "tempered" badge appears above the table in a distinctly styled chip, (c) the cents column shows multiples of ≈ 100¢ for 12-EDO.
**Expected:** Three-column table (Degree, Cents, ¢-from-12tet), "TEMPERED" badge visible, no ratio values anywhere.
**Why human:** Visual appearance and accessibility of the badge chip are design-conscious requirements that CSS token usage alone cannot confirm.

#### 3. Send-to round-trip — JI methods (ratio-per-line) and tempered (cents-per-line)

**Test:** (a) From CPS Hexany, click "Send to Analysis" — confirm Analysis loads the 6-degree Hexany as exact ratios. (b) From EDO 12, click "Send to Dashboard" — confirm Dashboard displays a 12-step scale interpreted as cents (each step ≈ k×100¢ from reference).
**Expected:** JI round-trip: ratios visible in Analysis scale text. Tempered round-trip: Dashboard/Analysis interpret as cents-defined scale (not as integer ratios).
**Why human:** End-to-end navigation, shared store write/read, URL hash encoding — requires a running browser session.

#### 4. D-08 anti-regression — harmonic segment default landing

**Test:** Load `/generate` cold. Confirm the picker shows "— pick a method —" selected and the preview area shows a harmonic-segment preview (or the "pick a method" prompt). Select "Harmonic / subharmonic / ADO / isoharmonic" and confirm it opens to the harmonic sub-method with lo=8, hi=16 (the Phase-5 default first-render).
**Expected:** Page opens byte-for-byte as Phase 5 shipped; harmonic sub-method is the first-render after selecting the Harmonic family.
**Why human:** Default-selected picker state and first-render bytes require a live browser to confirm; unit tests mock the synth and don't exercise the full Observable reactive graph.

### Gaps Summary

No blocking gaps. The phase goal is achieved: all five success criteria pass automated verification, all 105 phase-6 unit tests are green, the full 494-test suite passes, TypeScript is clean, and the build succeeds.

The CR-01 latent contract gap in `scale-table.ts` (copy handler without tempered awareness) is not user-reachable today — no shipped widget passes both `{ tempered: true, copyButton: true }`. It is a defense-in-depth gap that should be addressed before any future caller introduces that combination. The code review's suggested fix (a `scalaToCentsCsv` serializer guarded by the `tempered` flag) remains the recommended remediation but does not block this phase.

The WR-01 loose `parseIntOrNull` in three widgets is a UX quality gap (silent truncation of non-canonical integer strings) but does not affect correctness — the kernel's D-14 RangeError caps are the last line of defense.

---

_Verified: 2026-06-10T10:20:00Z_
_Verifier: Claude (gsd-verifier)_
