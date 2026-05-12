---
phase: 260512-ksu
plan: 01
subsystem: edo-approximation-page
type: execute
status: complete
tags: [edo, ji, reactive-ui, observable-framework, deviation-table]
requires: []
provides:
  - QUICK-EDO-LIVE-01
affects:
  - src/pages/edo-approximation.md
tech-stack:
  added: []
  patterns:
    - "view(Inputs.range(...)) wrapper to expose slider value as a reactive scalar"
    - "Reuse existing JI anchors (Interval / Fraction-BigInt) — derive cents only at display layer (Pitfall #1)"
key-files:
  created: []
  modified:
    - src/pages/edo-approximation.md
decisions:
  - "Inline the same round(c/s) math the static table uses rather than call bestEdosForScale, because bestEdosForScale returns aggregate metrics (max/rms/Tenney) not per-anchor {step, error} cells needed for the cell-for-cell visual match."
  - "Inline fmtErr inside the IIFE rather than hoist to a shared helper — keeps blast radius zero; static table's fmtErr is unchanged. A future refactor can dedupe if a third caller appears."
  - "Slider range 5..72 step 1 default 31 — covers every canonical EDO in the static table (12, 19, 22, 31, 41, 53, 72) plus the small-EDO end where 11/8 cannot land cleanly."
metrics:
  duration: ~14m
  completed: 2026-05-12
---

# Phase 260512-ksu Plan 01: Live EDO Explorer Summary

Added a reactive slider + live deviation row to `src/pages/edo-approximation.md` so the reader can sweep N=5..72 and watch which JI anchors snap into tune, instead of being limited to the seven canonical EDOs in the static table.

## What Shipped

A new `## Live EDO explorer` section on the EDO approximations page, positioned between `## What the table says` and `## Audition — pure vs 31-EDO vs 12-EDO 7/4`. The section contains:

1. **Prose intro** explaining the relationship to the static table above.
2. **Slider cell** — `view(Inputs.range([5, 72], { step: 1, value: 31, label: "EDO size N" }))` exposing `liveN` as a reactive scalar.
3. **`liveDeviationTable` IIFE cell** — builds a one-row `<table>` mirroring the static deviation table's structure exactly: `EDO` header + one `<th>` per anchor (3/2, 5/4, 7/4, 9/8, 11/8), `<th scope="row">` row label `${N}-EDO`, per-cell `${step} @ ${fmtErr(error)}` template with the same `+`/`−`/empty sign rules and `¢` glyph.
4. **`display(liveDeviationTable)` cell** rendering the DOM node into the page.

## Files Touched

| File                            | Change                                     |
| ------------------------------- | ------------------------------------------ |
| `src/pages/edo-approximation.md` | +64 lines: new H2 section + 3 reactive cells |

No other files modified. No new modules, no new imports, no new npm dependencies.

## Commits

| # | Hash      | Type | Message                                                                                                  |
| - | --------- | ---- | -------------------------------------------------------------------------------------------------------- |
| 1 | `c1117f8` | feat | feat(quick-260512-ksu): Live EDO explorer slider + reactive deviation row on edo-approximation page      |

## Reuse Decision (Recorded)

The plan asked whether `bestEdosForScale` from `src/lib/edo.ts` could drive the live row. Decision: **no, inline the static table's math instead.** `bestEdosForScale` returns `EdoErrorRow = { edoSteps, maxCentsError, rmsCentsError, tenneyWeightedError }` — aggregate metrics per EDO, not per-anchor `{ step, error }` cells. The visual contract here is a per-anchor row identical to the static table, so the right reuse is the existing `jiIntervals` array (already declared near the top of the page) + an inline `Math.round(iv.cents / stepCents)` calculation. This is the explicit fallback path the task brief named.

## Pitfall #1 Compliance

JI anchors stay as `Interval` (BigInt-backed `Fraction`) the whole time. The new code reads `iv.cents` exactly once per anchor, at the display projection boundary. No `new Interval(<cents>)` construction was introduced — verified by `grep -v "new Interval(.*cents"` in the verify gate.

## Verification

**Automated (Task 1 gate):**

- `grep -c "## Live EDO explorer" src/pages/edo-approximation.md` → `1` ✓
- `grep -q "Inputs.range(\[5, 72\]"` ✓
- `grep -q "liveDeviationTable"` ✓
- `grep -q "display(liveDeviationTable)"` ✓
- No `new Interval(.*cents` patterns introduced ✓
- `npx tsc --noEmit` clean ✓

**Human-verify (Task 2 gate):**

User ran the dev server, opened the page, confirmed:

- Section positioned correctly between "What the table says" and "Audition — pure vs 31-EDO vs 12-EDO 7/4".
- Default slider value 31 → row label `31-EDO`, cells match the static table's 31-EDO row exactly.
- Slider drags update the row label and all five cells reactively, no page reload.
- Canonical N values (12, 19, 22, 31, 41, 53, 72) match the static table row-for-row.
- Visual fidelity (column widths, header treatment, cell padding, borders, font) consistent with the static table — appears as the same component family, no theme drift.
- No console errors, no TypeScript complaints in dev-server output.

**User response:** `approved`.

## Deviations from Plan

None — plan executed exactly as written. Slider range, default value, cell template, header order, accessibility shape (`<th scope="row">`), and `fmtErr` sign rules all match the spec verbatim. No auto-fix rules triggered.

## Known Stubs

None. The slider is wired end-to-end through `view()` → `liveN` → `liveDeviationTable` recompute → `display()`.

## Threat Flags

None. The change is a pure-UI addition on a static-site research page; no network, no storage, no auth, no schema, no trust boundary moved.

## Self-Check: PASSED

- File `src/pages/edo-approximation.md` exists and contains the new section (verified via `grep` gates above).
- Commit `c1117f8` exists in `git log` (verified).
- SUMMARY.md written to the expected path.
