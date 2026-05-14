---
phase: quick-260514-b2r
plan: 01
subsystem: viz/spiral-of-fifths
tags:
  - viz
  - spiral-of-fifths
  - meantone
  - tempered
requirements_completed:
  - QT-260514-b2r-01  # tempered-branch heard-interval label
dependency_graph:
  requires: []
  provides:
    - "Per-node heard-interval label (octave-reduced cents from 1/1) for every tempered-branch spiralOfFifths caller"
  affects:
    - "src/pages/meantone.md (Wolf at k=12 section) — reads new label visually, no markdown change"
    - "src/pages/pythagorean-comma.md and any future tempered-branch consumer"
tech_stack:
  added: []
  patterns:
    - "Branch-XOR DOM rendering: pure branch emits `.spiral-of-fifths__ratio`, tempered branch emits `.spiral-of-fifths__heard`, same y-slot, never both."
key_files:
  created: []
  modified:
    - src/components/spiral-of-fifths.ts
    - src/components/spiral-of-fifths.css
    - src/components/__tests__/spiral-of-fifths.test.ts
decisions:
  - "New `.spiral-of-fifths__heard` CSS class chosen over reusing `.spiral-of-fifths__ratio` — semantic separation between ratio and cents labels lets the two diverge later without touching the ratio rule (discretion_resolved from PLAN.md)."
  - "Heard-cents reduction `((cumulativeCents % 1200) + 1200) % 1200` lives as a local scalar inside the DOM factory, NOT on SpiralStep — keeps the audition reduction contract at the call-site (per CONTEXT.md scope)."
metrics:
  completed_date: 2026-05-14
  duration_minutes: ~10
  task_count: 1
  files_changed: 3
  insertions: 45
  deletions: 1
---

# Quick Task 260514-b2r: Spiral-of-fifths heard-interval label Summary

Tempered-branch spiral-of-fifths nodes now carry an octave-reduced cents-from-1/1 label above the dot (e.g. `0.0¢`, `696.6¢`, `193.2¢`), filling the y=−10 slot that the pure branch uses for its ratio label.

## What Changed

| File | Lines | Change |
|------|-------|--------|
| `src/components/spiral-of-fifths.ts` | +16 / −1 | Added `else` branch in node loop rendering `<text class="spiral-of-fifths__heard">` at y=−10 with `((cumulativeCents % 1200) + 1200) % 1200`.toFixed(1) + `¢`. JSDoc header updated. |
| `src/components/spiral-of-fifths.css` | +6 / −0 | New `.spiral-of-fifths__heard` rule with the four typographic declarations from `.spiral-of-fifths__ratio` verbatim. |
| `src/components/__tests__/spiral-of-fifths.test.ts` | +23 / −0 | 5 new heard-label assertions + augmented the existing tempered ratio-suppression test (added heard-count check). |

## Commits

| SHA | Type | Subject |
|-----|------|---------|
| `c53c478` | test | `test(quick-260514-b2r): add failing tempered-branch heard-label tests` (RED) |
| `253ba4e` | feat | `feat(quick-260514-b2r): add tempered-branch heard-interval label to spiral-of-fifths` (GREEN) |

Two-commit TDD shape: RED isolated the failing tests, GREEN added the component render + CSS atomically.

## Tests

- Before: 355 vitest tests in the codebase, 23 in `spiral-of-fifths.test.ts`.
- After: **360 vitest tests** (full suite green), **27 in `spiral-of-fifths.test.ts`** (+4 net — 5 new assertions, 1 augmentation, 0 removed; the augmented test sits at its original location and was kept under its original name).
- New / updated assertions:
  - Tempered branch (1/4-comma meantone ≈ 696.578¢) emits heard labels at k=0/1/2 with text `"0.0¢"`, `"696.6¢"`, `"193.2¢"`.
  - Tempered branch emits exactly n+1 = 13 heard labels for n=12.
  - Tempered branch heard label sits at y=−10.
  - Pure branch emits ZERO heard labels and still 13 ratio labels (branch-separation guard).
  - Existing `"temperedFifthCents suppresses ratio labels but keeps cents labels"` — augmented with heard-count = 13 assertion.

Targeted run: `npm test -- src/components/__tests__/spiral-of-fifths.test.ts` → `27 passed`.
Full run: `npm test` → `360 passed`.

## Type / Build

- `npx tsc --noEmit`: only the 5 baseline `npm:` specifier errors carried by `STATE.md` (sw-synth / ji-lattice / @observablehq/plot module resolution + 2 implicit-any in `lattice.ts`). No new errors from this change.
- `npm run build`: clean, 111 links validated, 18 page bundles built.

## Hygiene Gates (from PLAN done block)

- `grep -c "spiral-of-fifths__heard" src/components/spiral-of-fifths.ts` → `1` ✅
- `grep -c "spiral-of-fifths__heard" src/components/spiral-of-fifths.css` → `1` ✅
- `grep -v '^[[:space:]]*//' src/components/spiral-of-fifths.ts | grep -c 'innerHTML'` → `1` — the sole hit is line 26 of the JSDoc header (`textContent only — never innerHTML (T-3-18 mitigation)`), a block-comment doc reference, NOT an actual `innerHTML` assignment. T-3-18 discipline preserved. ✅

## Discretion Resolution (recap)

PLAN locked the choice early: a new `.spiral-of-fifths__heard` class rather than reusing `.spiral-of-fifths__ratio`. The four declarations are byte-identical to the ratio rule, but the separate class keeps the cascade semantically clean and lets the two label sets diverge later (e.g. tighter glyph spacing for the decimal+`¢` shape) without touching the ratio rule. This matched the locked CONTEXT default.

## Out-of-Scope Confirmations

- `src/pages/meantone.md`: **untouched** (verified by `git diff 698ff7e..HEAD --stat -- src/pages/`).
- `SpiralStep` interface: unchanged — the reduction is a local scalar in the DOM factory only.
- `spiralGeometry` math: unchanged.
- Wolf chord render: unchanged.
- Signed cents-from-12-TET label at y=14: unchanged in both branches.
- Click handler `onStepClick` wiring: unchanged.
- Pure branch: byte-equivalent behavior (no `.spiral-of-fifths__heard` rendered, ratio label still at y=−10).

## Deviations from Plan

None — plan executed exactly as written. Two-commit TDD shape (RED then GREEN) was offered as optional in `<success_criteria>`; I took it because it makes the failing-test step explicit in the commit log.

## Self-Check: PASSED

- `src/components/spiral-of-fifths.ts` modified ✅ (`git show 253ba4e --stat`).
- `src/components/spiral-of-fifths.css` modified ✅.
- `src/components/__tests__/spiral-of-fifths.test.ts` modified ✅.
- Commit `c53c478` exists ✅ (`git log --oneline | grep c53c478`).
- Commit `253ba4e` exists ✅.
- `src/pages/meantone.md` NOT modified ✅.
