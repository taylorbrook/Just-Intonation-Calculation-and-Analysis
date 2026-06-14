---
phase: 08-preview-transforms-advanced-generators
plan: 04
subsystem: ui
tags: [observable-framework, generate-page, shared-preview, reactive-wiring, mt-meru, constant-structure, circle-of-pitches, transform-strip, surf-04, surf-06]

# Dependency graph
requires:
  - phase: 08-preview-transforms-advanced-generators
    provides: "circleOfPitches + scaleTransformStrip components (Plan 08-02); generateMeru + generateCs widgets (Plan 08-03)"
  - phase: 07-sonicweave-adapter-tempered-lattice-free-text
    provides: "generate-fokker Advanced-optgroup registration precedent; the per-widget paramsHost/previewHost swap + conditional-tempered Send-to serializer pattern"
  - phase: 05-generate-surface-live-integration-foundation
    provides: "generate.md METHOD_FAMILIES picker, paramsHost/previewHost hosts, ratioPerLine/centsPerLine helpers, writeSharedScale + encodeScaleToHash Send-to path, the audioActive Mutable precedent"
provides:
  - "generate.md Advanced-optgroup registration of generateMeru + generateCs (GEN-10) — METHOD_FAMILIES options, single instantiation, paramsHost/previewHost branches, Send-to serializers"
  - "The first cross-widget shared preview: circleOfPitches + scaleTransformStrip mount ONCE, fed by the active widget's getScale()/isTempered(), applying uniformly to every generator family (SURF-04 + SURF-05)"
  - "Transformed-scale Send-to: the strip's getTransformedScale() (tempered → cents-per-line, exact JI → ratio-per-line) is what serializes (SURF-04 / SURF-06)"
  - "Four new component @import lines in styles.css (circle-of-pitches, scale-transform-strip, generate-meru, generate-cs)"
affects: [phase-08-completion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive shared-preview reactive bridge (Open Q1 approach b): a method/baseHz cell binds transformStrip.onChange to a renderShared closure + ticks a Mutable, then calls setSource (which fires onChange) — no kernel or widget change"
    - "Transformed-scale-as-source-of-truth for Send-to: serialize transformStrip.getTransformedScale() gated by getTempered(), with the raw per-method serializer kept only as the seed/demo fallback"

key-files:
  created:
    - .planning/phases/08-preview-transforms-advanced-generators/08-04-SUMMARY.md
  modified:
    - src/pages/generate.md
    - src/styles.css

key-decisions:
  - "Transform strip instantiated with scaleTransformStrip({}) (no baseHz dependency) so the user's mode/transpose state survives reference-pitch edits; the live baseHz is forwarded to the circle + transformed table in the render callback instead"
  - "transformStrip.onChange re-bound every method/baseHz run (replacing the single stored callback) so the render closure always captures the current baseHz; setSource then fires it to paint the shared preview immediately"
  - "Send-to serializes the TRANSFORMED scale (getTransformedScale()) with the raw per-method serializer (rawMethodScaleText) kept only as the no-active-widget seed/demo fallback"

requirements-completed: [SURF-04, SURF-05, GEN-10]

# Metrics
duration: ~14min
completed: 2026-06-13
---

# Phase 8 Plan 04: Generate-Page Registration + Shared-Preview Wiring Summary

**Wired Phase 8's pieces into the live Generate page (append-only): registered the Wilson recurrence / metallic (Mt. Meru) and Constant-structure generators under the Advanced optgroup, and mounted the circle-of-pitches viz + rotate/reduce/dedupe/transpose strip ONCE in a shared preview fed by the active widget — the first cross-widget consumer — so the transformed scale drives the circle, the transformed table, and Send-to (tempered staying cents-per-line). Tasks 1–2 are DONE and fully green; Task 3 (the blocking human-verify checkpoint) is PENDING-HUMAN-VERIFY.**

## Status

| Task | Type | Status |
| ---- | ---- | ------ |
| 1: Register generateMeru + generateCs in Advanced optgroup + CSS imports | auto | **DONE** — committed `981b08d` |
| 2: Mount shared circle + transform strip fed by active widget (reactive wiring) | auto | **DONE** — committed `7b3b2e3` |
| 3: Human-verify the Manual-Only behaviors | checkpoint:human-verify (gate=blocking) | **APPROVED 2026-06-14** — user walked the 5-step script; verify cycle surfaced + fixed three tempered-scale issues (b27027e, c837d1b/62720d8, 0842cf6) then approved |

## Performance

- **Duration:** ~14 min (Tasks 1–2)
- **Completed:** 2026-06-13
- **Tasks executed:** 2 of 3 (Task 3 is a blocking human-verify checkpoint, intentionally deferred)
- **Files modified:** 2 (`src/pages/generate.md`, `src/styles.css`)

## Accomplishments (Tasks 1–2)

- **Task 1 — Advanced-optgroup registration (GEN-10):** Added 4 imports (`generateMeru`, `generateCs`, `circleOfPitches`, `scaleTransformStrip`); appended `meru` + `cs` options to the "Advanced / algorithmic" `METHOD_FAMILIES` optgroup (D-21); instantiated `meruWidget` + `csWidget` ONCE (Pattern-2 closure-local state survives picker swaps); added `meruScaleText()` (exact-JI ratio-per-line — `isTempered()` always false) + `csScaleText()` (conditional on the adapter's live `isTempered()`); extended the `currentScaleText` and `sendCurrentScaleTo` ternaries with `meru`/`cs` branches; added the `paramsHost` + `previewHost` swap branches (pointer captions — the widgets render their own tables); and imported the four new component CSS files in `styles.css`.
- **Task 2 — shared preview + reactive wiring (SURF-04 + SURF-05, the first cross-widget consumer):** Added a `sharedPreviewHost`; instantiated `scaleTransformStrip({})` ONCE (no baseHz dependency, so mode/transpose state survives reference-pitch edits); added a `transformedTick` `Mutable` reactive bridge; and a `method`/`baseHz` cell that reads the active widget's scale LIVE via `activeWidgetScale()` (`getScale()`/`isTempered()`), binds `transformStrip.onChange` to a `renderShared` closure (capturing the current baseHz) that paints `circleOfPitches(...)` + a transformed `scaleTable(...)` and ticks the Mutable, then calls `setSource(...)` (which fires onChange, painting immediately). Send-to now serializes `transformStrip.getTransformedScale()` gated by `getTempered()` — tempered → `centsPerLine`, exact JI → `ratioPerLine` (D-06 / SURF-06) — with `rawMethodScaleText()` kept only as the seed/demo fallback.

## Task 3 — PENDING-HUMAN-VERIFY (what the orchestrator must have the user check)

Task 3 is a `checkpoint:human-verify` with `gate="blocking"`. It covers the three Manual-Only rows from 08-VALIDATION.md (Web Audio playback, Observable reactive-graph updates on widget-internal edits, the live store/URL round-trip) plus two spot checks — none assertable in jsdom/happy-dom. The orchestrator must run `npm run dev`, open the Generate page, and have the user walk:

1. **Shared-preview reactivity (Open Q1 — the documented risk):** pick a method → confirm the shared circle + transformed table appear; edit a widget param (e.g. a CPS chip or the Meru term-count) → confirm the SHARED circle + transformed table update LIVE. **If they do NOT update on a widget-INTERNAL edit, the additive approach binding to `method`/`baseHz` did not catch it — the fix is an additive `onScaleChange(cb)` hook on the active widget that the page binds (the wiring cell already has the bind point).** Also switch to an octave-only/unison scale → confirm the circle shows the friendly empty-state.
2. **Click-audition + hover:** hover a circle marker → highlight + tooltip (ratio for JI, cents for tempered, signed ¢-from-12-TET); click → hear the pitch; Esc → audio stops.
3. **Transformed-scale Send-to round-trip (SURF-04 / SURF-06):** apply a mode rotation + transpose → confirm the table + circle reflect it; "Send to Dashboard" → the Dashboard loads the TRANSFORMED scale and the `#s=` hash reflects it; repeat with a TEMPERED scale (e.g. ED or rank-2) → the payload is cents-per-line, NOT ratios (the tempered flag survived the transform).
4. **csgs correction (GEN-10):** "Constant structure" defaults to a 7-note Pythagorean diatonic (NOT 41 notes, NOT an error), the second field is "ordinal" with a helper note, CS-status reads "✓ constant structure".
5. **Metallic limit (GEN-10):** "Wilson recurrence / metallic" shows exact-JI ratio rows (3/2, 5/3, 8/5, 13/8) AND a separate "φ ≈ 833.1¢" tempered-flagged limit readout BESIDE the table (never a table row).

Resume signal: user types "approved" if all five verify, or describes the failure (especially step 1's live update).

## Automated Verification (all green)

- `npm run build` — succeeds; **136 links validated** (generate.md compiles, all new imports resolve).
- `npm test` (full Vitest suite) — **629 passed (48 files), 0 failures** (anti-regression; this plan adds no new test file).
- `npm run lint:types` (`tsc --noEmit`) — **clean, exit 0** (the pre-existing TS2307/TS7006 errors logged in 08-02's deferred-items do not surface here).
- `git diff --stat -- src/index.md src/pages/analysis.md` — **empty** (SYNC-04 boot equivalence preserved: Dashboard + Analysis byte-identical; this plan is append-only to generate.md + styles.css).

### Task grep gates

- Task 1: `generateMeru|generateCs` count = 4 (≥4 ✓); `id: "meru"|id: "cs"` = 2 (==2 ✓); CSS imports = 4 (==4 ✓).
- Task 2: `scaleTransformStrip(` = 1 (≥1 ✓); `circleOfPitches(` = 1 (≥1 ✓); `getTransformedScale(|transformStrip.onChange|setSource(` = 6 (≥2 ✓); `getTransformedScale` = 4 (≥1, present in Send-to ✓).

## Task Commits

1. **Task 1:** `981b08d` — `feat(08-04): register generateMeru + generateCs in Advanced optgroup + CSS imports`
2. **Task 2:** `7b3b2e3` — `feat(08-04): mount shared circle + transform strip fed by active widget`

## Files Created/Modified

- `src/pages/generate.md` — Advanced-optgroup registration of `generateMeru` + `generateCs`; the shared `sharedPreviewHost` + `transformStrip` + `transformedTick` Mutable; `activeWidgetScale()` live-read + the `method`/`baseHz` reactive wiring cell; transformed-scale Send-to (`getTransformedScale()` gated by `getTempered()`) with `rawMethodScaleText()` fallback.
- `src/styles.css` — four new component `@import` lines (circle-of-pitches, scale-transform-strip, generate-meru, generate-cs).
- `.planning/phases/08-preview-transforms-advanced-generators/08-04-SUMMARY.md` — this summary.

## Decisions Made

- **Strip instantiated with `scaleTransformStrip({})` (no baseHz dependency).** The strip's `baseHz` opt is reserved-only (it forwards downstream, never stored as state). Depending on the reactive `baseHz` would re-instantiate the strip on every reference-pitch edit and wipe the user's mode/transpose. The live `baseHz` is instead forwarded to the circle + transformed table in the render callback, where it actually matters.
- **`onChange` re-bound every `method`/`baseHz` run.** The strip stores a single callback; re-binding it each run with a fresh `renderShared` closure guarantees the closure captures the current reactive `baseHz`. `setSource` then fires that fresh callback, painting the shared preview immediately on method/baseHz change.
- **Send-to serializes the TRANSFORMED scale.** `transformStrip.getTransformedScale()` (read live at click time, with `transformedTick` keeping the handlers reactive) gated by `getTempered()` → cents (tempered) or ratios (JI). The raw per-method serializer (`rawMethodScaleText`) is retained only for the seed/demo path where no active widget produced a scale.

## Deviations from Plan

None for Tasks 1–2 — both executed exactly as written (append-only to generate.md + styles.css, following the generate-fokker precedent and the RESEARCH Open-Q1 approach (b)).

Note on scope: Task 2's `<files>` lists only `src/pages/generate.md`, so no `styles.css` change was made in Task 2 (the four CSS `@import`s were correctly bundled into Task 1, whose `<files>` lists both). The new `generate-host--shared` class inherits the existing `generate-host` base styling; no new CSS rule was required for green build/test, and adding one is left to the human-verify visual-polish pass (Task 3) to avoid out-of-scope edits.

## Known Stubs

None — no stub/placeholder/TODO patterns introduced in the changed lines (verified by diff scan).

## Threat Surface

No new threat surface beyond the plan's `<threat_model>`. The transformed-scale Send-to (T-08-13) keys on `getTempered()` so a tempered scale serializes cents-per-line, never ratios (verified structurally; the tempered round-trip is the human-verify step-3 check). The 8 KB cap (T-08-14) is unchanged (`encodeScaleToHash` + `writeSharedScale` guards; no new uncapped path). Dashboard/Analysis boot equivalence (T-08-15) preserved (append-only; `git diff --stat` empty). New captions/option text (T-08-16) are locked literals via `textContent` (no `innerHTML`).

## Next Steps (orchestrator)

- Run the Task 3 blocking human-verify checkpoint via `npm run dev` (the five-step script above). Do not mark the phase complete until the user types "approved".
- After the worktree merges: update STATE.md (advance plan, decisions, metrics) and ROADMAP.md plan progress, and mark requirements SURF-04 / SURF-05 / GEN-10 complete. (This subagent intentionally did NOT touch STATE.md/ROADMAP.md per the worktree contract.)

## Self-Check: PASSED

- FOUND: src/pages/generate.md (modified)
- FOUND: src/styles.css (modified)
- FOUND: .planning/phases/08-preview-transforms-advanced-generators/08-04-SUMMARY.md
- FOUND commit 981b08d (Task 1)
- FOUND commit 7b3b2e3 (Task 2)
- Build green (136 links validated); full suite 629 passed; lint:types clean; boot-equivalence empty.

---
*Phase: 08-preview-transforms-advanced-generators*
*Tasks 1–3 complete; Task 3 human-verify APPROVED 2026-06-14*
*Phase 8 closed. Verify-cycle tempered-scale fixes: b27027e (lattice/diamond), c837d1b + 62720d8 (shared-preview reactivity / transform re-sync), 0842cf6 (EDO-fit table).*
*Completed: 2026-06-14*
