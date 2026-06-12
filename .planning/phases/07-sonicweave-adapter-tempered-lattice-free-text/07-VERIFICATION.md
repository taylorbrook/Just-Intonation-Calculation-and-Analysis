---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
verified: 2026-06-11T21:50:00Z
status: gaps_found
score: 7/9 must-haves verified
overrides_applied: 0
re_verification: null
gaps:
  - truth: "A pure-ratio rank-2 (e.g. Pythagorean preset) renders exact JI; POTE/TE/CTE/quarter-comma render tempered"
    status: partial
    reason: "CR-01 (execution-verified by code reviewer): composeSource() for POTE/TE/CTE always emits rank2(3/2, up, down) regardless of the selected preset's generator. Magic preset (generator 5/4) and Hanson preset (generator 6/5) silently produce a chain-of-fifths scale instead of the documented generator chain. The Generator field shows 5/4 while the scale is built from 3/2 — displayed parameters and produced scale disagree. Tests pass because no test checks that Magic/Hanson POTE output uses the preset's documented generator."
    artifacts:
      - path: "src/components/generate-rank2.ts"
        issue: "line 301: `rank2(3/2, ${String(up)}, ${String(down)})` hardcodes 3/2 instead of using genN/genD"
    missing:
      - "Fix composeSource() POTE/TE/CTE branch: use `${String(genN)}/${String(genD)}` as the generator, not the literal 3/2"
  - truth: "D-12: the live '→ N notes' readout updates with inputs (extents product in basis mode, |det| via fokkerCardinality in comma mode)"
    status: partial
    reason: "CR-02 (execution-verified by code reviewer): adding or removing a basis chip never re-renders the per-axis extent fields. renderParams() is only called on mode change and initial render. The chip Add and Remove handlers call renderChips() + rebuild() but NOT renderParams(). A newly added basis axis has no Up/Down controls (extents frozen at 0/0). A removed chip leaves stale extent fields with old labels writing to wrong axes. The readout itself is correct for the existing axes but the user cannot edit the extents of newly added axes — making the basis-chip-add flow functionally broken."
    artifacts:
      - path: "src/components/generate-fokker.ts"
        issue: "lines 318-341 (basis chip setList callback) and the remove handler at line 318-328: both call renderChips() + rebuild() but never renderParams() to regenerate extent fields"
    missing:
      - "Call renderParams() (or a dedicated renderExtents() sub-call) from within the basis chip's setList callback so extent fields are regenerated when the basis list changes"
---

# Phase 7: SonicWeave Adapter + Tempered Lattice + Free-Text Verification Report

**Phase Goal:** The genuinely advanced methods (rank-2 with optimal tunings, well-temperaments, Fokker periodicity blocks) ship as thin, well-tested wrappers over the already-installed `sonic-weave` prelude via a single kernel adapter, plus a free-text SonicWeave escape hatch — delivering parked TEMP-01, TEMP-07, and TEMP-08.
**Verified:** 2026-06-11T21:50:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | scaleFromSonicWeave adapter exists with isFractional() discriminator, R-01 round-trip, 8 KB cap, structured error | ✓ VERIFIED | `src/lib/sonicweave.ts` lines 92-144; `iv.value.isFractional()` at line 118; R-01 `${String(f.n)}/${String(f.d)}` at line 122; cap at line 94; try/catch at line 104 |
| 2 | fokkerCardinality returns 12 for ["81/80","128/125"] via BigInt integerDet | ✓ VERIFIED | `src/lib/fokker.ts` lines 61-100; test at `fokker.test.ts` green |
| 3 | Rank-2 widget lands on quarter-comma meantone by default (D-02), tempered badge, conditional isTempered() | ✓ VERIFIED | `generate-rank2.ts` line 130 default `"meantone"`, line 301 literal-cents generator, line 382 `isTempered: () => temperedFlag`; test confirms 8 rows + badge |
| 4 | A pure-ratio rank-2 renders exact JI; POTE/TE/CTE render tempered | ✗ FAILED | CR-01: POTE/TE/CTE path at line 301 hardcodes `3/2` regardless of preset generator. Magic (5/4) and Hanson (6/5) produce a fifth-chain scale. Pythagorean pure path works correctly. |
| 5 | Well-temperament widget lands on Vallotti with explicit Pythagorean comma, always tempered | ✓ VERIFIED | `generate-welltemp.ts` line 107 `PYTHAGOREAN_COMMA = "531441/524288"`, line 259 explicit comma arg, line 291 `isTempered: () => true`; tests green |
| 6 | Fokker widget lands on classic 5-limit 12-tone block (basis mode default, exact JI, live readout) | ✗ FAILED | CR-02: basis chip Add/Remove handlers do not call renderParams(), so adding a basis axis leaves the new axis with no Up/Down extent fields. The readout and default render are correct but the widget is functionally broken for users who add basis intervals. |
| 7 | Free-text SonicWeave widget evaluates on button click only, raw errors preserved, docs link, Hexany default | ✓ VERIFIED | `generate-sonicweave.ts` lines confirm evaluate-on-click only, textContent-only error rendering, docs link with rel="noopener noreferrer", default `cps([1,3,5,7], 2)`; 13 tests green |
| 8 | All four widgets registered in generate.md (five optgroups, Send-to serialization, CSS imports) | ✓ VERIFIED | `generate.md` lines 15-18 (imports), 75-96 (METHOD_FAMILIES), 248-277 (instantiate-once cells), 359-380 (ScaleText helpers), 449-472 (params-host swap), 533-560 (preview-host swap), 650-657 (Send-to ternaries); `styles.css` lines 40-43 (four @imports) |
| 9 | Empty-store boot equivalence unaffected (SYNC-04) | ✓ VERIFIED | Registration is strictly additive per generate.md; human-verify checkpoint step 8 approved by user on live dev server; full suite 554/554 green |

**Score:** 7/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/sonicweave.ts` | scaleFromSonicWeave adapter, SonicWeaveResult, isFractional() discriminator, R-01 round-trip | ✓ VERIFIED | 145 lines; all required exports present |
| `src/lib/fokker.ts` | fokkerCardinality, integerDet, caps-first RangeError | ✓ VERIFIED | 101 lines; all required exports present |
| `src/lib/__tests__/sonicweave.test.ts` | adapter cross-checks + tempered detection + R-01 + cap | ✓ VERIFIED | 10 original tests + 3 appended well-temp vectors; all green |
| `src/lib/__tests__/fokker.test.ts` | |det| = 12, non-square RangeError, comma-cap RangeError | ✓ VERIFIED | 3 tests; all green |
| `src/components/generate-rank2.ts` | GEN-06 rank-2 widget | ✓ WIRED | 389 lines; connected to adapter; CR-01 bug in POTE/TE/CTE branch |
| `src/components/generate-welltemp.ts` | GEN-07 well-temperament widget | ✓ VERIFIED | Explicit Pythagorean comma; always tempered |
| `src/components/generate-fokker.ts` | GEN-08 Fokker widget, basis+comma modes, live readout | ✓ WIRED | 483 lines; connected to adapter; CR-02 bug in basis chip add/remove |
| `src/components/generate-sonicweave.ts` | GEN-09 free-text widget | ✓ VERIFIED | 178 lines; evaluate-on-click only; docs link |
| `src/pages/generate.md` | All four widgets registered, five optgroups, Send-to | ✓ VERIFIED | All four imports, instantiate cells, swap branches, Send-to helpers present |
| `src/styles.css` | Four @import lines | ✓ VERIFIED | Lines 40-43 confirmed |
| `src/lib/INVENTORY.md` | scaleFromSonicWeave and fokkerCardinality rows | ✓ VERIFIED | Lines 197-198 confirmed |
| `patches/sonic-weave+0.14.1.patch` | patch-package exports-map fix | ✓ VERIFIED | File present; package.json has postinstall hook |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/sonicweave.ts` | `sonic-weave evaluateSource` | `import { evaluateSource } from "sonic-weave"` | ✓ WIRED | line 66 confirmed |
| `src/lib/sonicweave.ts` | `src/lib/cents.ts centsToRatio` | tempered branch | ✓ WIRED | line 69, line 127 confirmed |
| `src/lib/sonicweave.ts` | `src/lib/interval.ts Interval` | R-01 `new Interval(\`${n}/${d}\`)` | ✓ WIRED | line 67, lines 122, 127 confirmed |
| `src/lib/fokker.ts` | `xen-dev-utils integerDet` | BigInt determinant | ✓ WIRED | line 36, line 90 confirmed |
| `src/components/generate-rank2.ts` | `src/lib/sonicweave.ts scaleFromSonicWeave` | compose rank2(...) source then call adapter | ✓ WIRED | line 43, line 315 confirmed |
| `src/components/generate-welltemp.ts` | `src/lib/sonicweave.ts scaleFromSonicWeave` | compose wellTemperament(...) source | ✓ WIRED | confirmed via 531441/524288 + scaleFromSonicWeave call |
| `src/components/generate-fokker.ts` | `src/lib/sonicweave.ts scaleFromSonicWeave` | compose parallelotope(...) source | ✓ WIRED | line 46, line 451 confirmed |
| `src/components/generate-fokker.ts` | `src/lib/fokker.ts fokkerCardinality` | comma-mode live |det| readout | ✓ WIRED | line 47, lines 124, 434 confirmed |
| `src/components/generate-sonicweave.ts` | `src/lib/sonicweave.ts scaleFromSonicWeave` | evaluate-on-click textarea program | ✓ WIRED | confirmed in test assertions |
| `src/pages/generate.md` | all four widget factories | import + instantiate-once cell + params swap + Send-to | ✓ WIRED | all four imports, cells, branches confirmed in generate.md |
| `src/styles.css` | four widget CSS files | @import lines | ✓ WIRED | lines 40-43 confirmed |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `generate-rank2.ts` | `currentScale` / `temperedFlag` | `scaleFromSonicWeave(composeSource())` | Yes — adapter evaluates SonicWeave prelude, returns kernel Scale | ✓ FLOWING |
| `generate-welltemp.ts` | `currentScale` | `scaleFromSonicWeave(wellTemperament([...], 531441/524288))` | Yes — explicit Pythagorean comma | ✓ FLOWING |
| `generate-fokker.ts` | `currentScale` | `scaleFromSonicWeave(parallelotope(...))` | Yes — basis or comma mode composes real source | ✓ FLOWING |
| `generate-sonicweave.ts` | `currentScale` / `temperedFlag` | `scaleFromSonicWeave(textarea.value)` | Yes — user-provided or default program evaluated on click | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 60 phase-7 unit tests green | `npx vitest run` (6 test files) | 60/60 passed | ✓ PASS |
| Full suite no regression | `npx vitest run` | 554/554 passed, 42 files | ✓ PASS |
| Adapter exports present | grep for `export function scaleFromSonicWeave` + `export interface SonicWeaveResult` | found in sonicweave.ts | ✓ PASS |
| fokkerCardinality exported and uses integerDet | grep | found at lines 61, 90 | ✓ PASS |
| R-01 round-trip pattern present | grep `new Interval(\`${String(` | found at sonicweave.ts line 122 | ✓ PASS |
| CR-01 confirmed: POTE/TE/CTE hardcodes 3/2 | grep `rank2(3/2` in generate-rank2.ts | found at line 301 | ✗ FAIL (confirmed bug) |
| CR-02 confirmed: basis chip setList never calls renderParams | grep add/remove handlers | renderChips() + rebuild() only, no renderParams() call | ✗ FAIL (confirmed bug) |

### Probe Execution

Step 7c: SKIPPED — no conventional `scripts/*/tests/probe-*.sh` files found and no probes declared in PLAN frontmatter.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| GEN-06 | 07-01, 07-02, 07-04 | User can generate a rank-2 regular-temperament scale | ✗ PARTIAL | Widget ships and is reachable; CR-01 means Magic/Hanson POTE presets produce wrong scales |
| GEN-07 | 07-01, 07-02, 07-04 | User can generate a well-temperament scale | ✓ SATISFIED | Vallotti default, explicit Pythagorean comma, 2 verified presets + custom; tests green |
| GEN-08 | 07-01, 07-03, 07-04 | User can generate a Fokker periodicity-block scale | ✗ PARTIAL | Widget ships and default block correct; CR-02 means newly added basis axes are inoperable |
| GEN-09 | 07-01, 07-03, 07-04 | User can enter a free-text SonicWeave expression | ✓ SATISFIED | Hexany default, evaluate-on-click, raw errors, docs link; human-verify approved |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/generate-rank2.ts` | 301 | `rank2(3/2, …)` hardcoded in POTE/TE/CTE branch | BLOCKER | Magic/Hanson presets produce wrong scales; user sees 5/4 generator but gets 3/2 chain |
| `src/components/generate-rank2.ts` | 135-137, 291 | Dead `genIsCents`/`genCents` path, unreachable ternary | INFO | No behavioral impact |
| `src/components/generate-fokker.ts` | 318-341 | basis chip setList callbacks never call renderParams() | BLOCKER | Adding a basis axis leaves it with no Up/Down controls; removing shifts labels/indices |
| `src/components/generate-fokker.ts` | 101-108 | `parseInt` in parseRatio — precision loss past 2^53 | WARNING | Silently corrupts large-prime-limit comma ratios (project supports no prime-limit ceiling) |
| `src/lib/sonicweave.ts` | 121-122 | R-01 omits sign (`f.s`) — negative rationals laundered to positive | WARNING | Free-text `-3/2` silently becomes `3/2`; no error surfaced |
| `src/components/generate-fokker.ts` | 335 | Basis cap check uses MAX_COMMAS (8) but setList slices to MAX_BASIS (6) | WARNING | 7th/8th chip silently vanishes with no status message |

### Human Verification Required

(Human-verify checkpoint for Plan 07-04 was completed and approved by the user on the live dev server. The four items below represent the residual functional correctness gaps from CR-01/CR-02 that require human confirmation after the fixes are applied.)

### Gaps Summary

Two execution-verified critical bugs from the code review block full goal achievement:

**CR-01 (BLOCKER):** `generate-rank2.ts` POTE/TE/CTE source composition hardcodes `3/2` as the generator regardless of the selected preset. Magic (documented as 5/4 major-third chain) and Hanson (documented as 6/5 minor-third chain) silently produce a tempered chain-of-fifths scale when POTE/TE/CTE is selected. The generator field displays `5/4` while the scale is built from `3/2` — direct parameter/output contradiction. Fix: use `${String(genN)}/${String(genD)}` in the POTE/TE/CTE branch.

**CR-02 (BLOCKER):** `generate-fokker.ts` basis chip Add and Remove handlers call `renderChips()` + `rebuild()` but never `renderParams()`. The per-axis Up/Down extent fields are generated inside `renderParams()` and are not refreshed when the chip list changes. Adding a basis interval creates an axis the user cannot control (extents frozen at 0). Removing a chip leaves stale extent fields with labels pointing to removed axes. The widget's basis-chip-add workflow is functionally broken for any user who wants to add or remove basis intervals. Fix: call `renderParams()` (or extract and call a `renderExtents()` helper) from within the basis chip `setList` callback.

The well-temperament widget (GEN-07), the free-text widget (GEN-09), the adapter kernel (Plan 01), and the page registration (Plan 04) are all fully verified. The gaps are confined to two specific code paths in two component files.

---

_Verified: 2026-06-11T21:50:00Z_
_Verifier: Claude (gsd-verifier)_
