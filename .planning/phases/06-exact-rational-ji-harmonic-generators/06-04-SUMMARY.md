---
phase: 06-exact-rational-ji-harmonic-generators
plan: 04
subsystem: components
tags: [scale-table, tempered, surf-06, ui, edo]
requires:
  - "src/lib/scale.ts (Scale type)"
  - "src/lib/interval.ts (Interval type)"
  - "05-UI-SPEC locked theme tokens"
provides:
  - "scaleTable tempered variant (cents-only, no-ratio, badged) — SURF-06 presentation contract"
  - "ScaleTableOpts.tempered flag for the ED widget (Plan 07) to consume"
affects:
  - "src/components/scale-table.ts"
  - "src/components/scale-table.css"
  - "src/components/__tests__/scale-table.test.ts"
tech-stack:
  added: []
  patterns:
    - "Opt-flag-driven variant: the tempered branch is selected by ScaleTableOpts.tempered, not by the Scale data — any Scale renders cents-only when flagged"
    - "Static thead innerHTML per-branch (no interpolation) keeps XSS-safe pattern in both 3-col and 4-col headers (T-06-08)"
    - "Badge via createElement + textContent (never innerHTML), appended before the table"
key-files:
  created:
    - "src/components/__tests__/scale-table.test.ts — 9 tests covering both variants"
  modified:
    - "src/components/scale-table.ts — added tempered branch + ScaleTableOpts.tempered"
    - "src/components/scale-table.css — added .scale-table__badge rule (tokens only)"
decisions:
  - "Tempered drops the Ratio column structurally (D-01) — no float-derived fraction can masquerade as exact JI"
  - "Badge styled as an understated neutral chip (--theme-foreground-alt + faint current-color border), NOT --theme-orange — consistent with the table's no-color-coding restraint (D-15)"
  - "JI 4-column path kept byte-for-byte: same thead string, same 4 cells, same copy-button behavior (anti-regression)"
metrics:
  duration: 2min
  tasks: 2
  files: 3
  completed: 2026-06-10
---

# Phase 6 Plan 04: scaleTable Tempered Variant Summary

Extended `scaleTable` with an opt-in `tempered` flag (SURF-06) that drops the Ratio column entirely (Degree | Cents | ¢-from-12tet) and renders a visible "tempered" badge, so EDO/ED-n output is unmistakably tempered and never laundered as exact JI — while the JI 4-column path stays byte-for-byte unchanged.

## What Was Built

- **`ScaleTableOpts.tempered?: boolean`** — opt-in flag. The variant is driven by the flag, not the Scale data, so the ED widget (Plan 07) can pass any tempered Scale and get the cents-only presentation.
- **Tempered render (D-01):** three-column static thead `Degree | Cents | ¢ from 12-TET` and a three-cell tbody row — the ratio cell is structurally absent. No float-derived fraction can be presented as exact JI.
- **Tempered badge (D-02):** a `<span class="scale-table__badge">tempered</span>` created via `createElement` + `textContent` (never innerHTML), appended to the wrapper before the table.
- **Badge CSS (D-15):** an understated chip — muted `--theme-foreground-alt` text, faint `color-mix(... currentColor 12% ...)` border, small radius, uppercase `--sans-serif`. Existing 05-UI-SPEC tokens only; no hard-coded hex, no `--theme-orange` accent (consistent with the table's no-color-coding restraint).
- **Anti-regression:** when `tempered` is falsy (default or `false`), the function takes the original code path — the same 4-column thead string, the same four cells, the same copy-button behavior. Existing callers (dashboard, analysis, mos-builder) pass no flag and are unaffected.

## TDD Flow

- **RED (`5e7d07d`):** Wrote `scale-table.test.ts` (new file — no prior test existed). 4 anti-regression tests on the default path (4 `<th>`, no badge, 4 `<td>`, ratio in column 2) + 4 tempered tests (3 `<th>` with no "Ratio", 3 `<td>`, badge present reading "tempered", badge before table). Confirmed RED: 4 failed / 5 passed (the copyButton-with-tempered test passed independently).
- **GREEN (`24715db`):** Added the `tempered` branch to `scaleTable` (per-branch thead string + per-branch cells array) and the `.scale-table__badge` CSS rule. Confirmed GREEN: 9/9 pass.
- **REFACTOR:** None needed — the branch structure is clean and the JI path is preserved verbatim.

## Verification

- `npx vitest run src/components/__tests__/scale-table.test.ts` — 9/9 pass (both variants).
- `npx tsc --noEmit` — clean (exit 0).
- `npm run build` — succeeds (exit 0; 136 links validated; all pages built including `/generate`).
- `npx eslint src/components/scale-table.ts` — clean (the `.eslintignore` deprecation warning is a pre-existing project-config item, not introduced here).
- Full suite — 405/405 pass across 30 files. No regression in existing JI callers.

## Threat Surface (from threat_model)

- **T-06-08 (XSS) — mitigated:** all dynamic cells and the badge use `createElement` + `textContent`; both thead strings stay static (no interpolation) in the 3-col and 4-col branches.
- **T-06-09 (laundered JI) — mitigated:** the ratio column is structurally absent for tempered scales (D-01); the badge (D-02) makes the distinction explicit.
- **T-06-SC (npm installs) — accept:** no new dependency, no install task.

## Deviations from Plan

The plan's `<read_first>` and `<files_modified>` described `src/components/__tests__/scale-table.test.ts` as an "existing test" to extend, but no scale-table test existed in the repo. Treated as a new-file creation (not a deviation requiring a rule) — wrote a fresh test following the established component-test idioms (happy-dom, vitest, Interval/Scale fixtures from existing tests like `edo-ji-table.test.ts`). Both variants are covered as specified. No code deviations (Rules 1–4 not triggered).

## Known Stubs

None. The tempered variant is fully wired and tested; no placeholder data paths.

## Self-Check: PASSED

- FOUND: src/components/scale-table.ts
- FOUND: src/components/scale-table.css
- FOUND: src/components/__tests__/scale-table.test.ts
- FOUND commit: 5e7d07d (RED)
- FOUND commit: 24715db (GREEN)
