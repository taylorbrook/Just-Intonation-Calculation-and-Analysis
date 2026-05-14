---
phase: quick-260514-9mn
plan: 01
status: complete
completed_at: 2026-05-14T14:18:34Z
requirements:
  - QUICK-9MN-01
commits:
  - cd69560  # test(quick-260514-9mn): add failing theme-prefs spec (RED gate)
  - f3199c1  # feat(quick-260514-9mn): add src/theme/theme-prefs.ts (Task 1 GREEN)
  - 21701b0  # feat(quick-260514-9mn): add theme-head.ts FOUC-prevention head payload (Task 2)
  - 58c41a1  # feat(quick-260514-9mn): theme-cycle button inside audio toolbar (Task 3)
  - 1336f77  # chore(quick-260514-9mn): wire themeHeadPayload into observable config (Task 4)
files_changed:
  - src/theme/theme-prefs.ts                # new
  - src/theme/__tests__/theme-prefs.test.ts # new
  - src/components/theme-head.ts            # new
  - src/components/audio-toolbar.ts         # modified (theme button + listeners)
  - observablehq.config.ts                  # modified (head: theme payload first)
  - vitest.config.ts                        # modified (deviation — see below)
tech-stack:
  added: []
  patterns:
    - "Head-injected sync IIFE for FOUC prevention"
    - "Three-layer discipline: pure constants ↔ head payload ↔ component"
    - "CSS-variable override via [data-tuning-systems-theme] attribute on html"
key-decisions:
  - "Toggle button hosted INSIDE [data-tuning-systems-audio-toolbar] (single floating control)"
  - "Cycle order: auto → light → dark → auto, encoded by THEME_MODES array order"
  - "FOUC prevention via SYNCHRONOUS IIFE in <head> (not DOMContentLoaded-wrapped)"
  - "Override only the FOUR primary CSS vars + color-scheme; derived vars cascade via color-mix"
metrics:
  tasks_completed: 5
  tests_added: 28
  total_tests_passing: 356
---

# Phase quick-260514-9mn Plan 01: Add a Dark Mode Toggle Summary

**One-liner:** Tri-state (auto / light / dark) theme override layered on top of Framework's media-query `prefers-color-scheme`, with FOUC-prevention via a synchronous head-injected IIFE and a button hosted inside the existing site-wide audio toolbar.

## What Shipped

The Framework site already swaps between `theme-air` (light) and `theme-near-midnight` (dark) automatically by OS preference, but there was no manual override. This plan adds one — a single `◐ / ☀ / ☾` glyph button sitting inside the top-right `[data-tuning-systems-audio-toolbar]` container.

Mechanism in three layers:

1. **`src/theme/theme-prefs.ts`** — pure constants + validation kernel. Owns `THEME_PREFS_STORAGE_KEY`, `THEME_PREFS_EVENT`, the `["auto","light","dark"]` mode tuple, `DEFAULT_THEME_PREFS`, `validateMode`, and `readThemePrefs`. No DOM, no writes — strict three-layer discipline mirror of `src/audio/audio-prefs.ts` (decision: this module is the ONE allowed shared dependency between `src/theme/` and `src/components/`).

2. **`src/components/theme-head.ts`** — exports `themeHeadPayload()`, an `<style>+<script>` HTML string registered in `observablehq.config.ts` `head:` field. The `<style>` block redeclares the FOUR primary CSS variables per mode (`--theme-foreground`, `--theme-foreground-focus`, `--theme-background-a`, `--theme-background-b`) plus `color-scheme`, copied **verbatim** from `node_modules/@observablehq/framework/dist/style/{theme-air, theme-near-midnight, abstract-light, abstract-dark}.css`. Derived vars (`--theme-foreground-muted` etc.) cascade automatically via `color-mix()` — no need to redeclare. The `<script>` is a **synchronous IIFE** (not wrapped in `DOMContentLoaded`) that runs during head parse, before `<body>` exists; it reads localStorage, validates, and sets `document.documentElement.setAttribute("data-tuning-systems-theme", mode)` before the first paint. It also installs `window.__tuningSystemsTheme = { get, set, cycle }` so other code can drive it.

3. **`src/components/audio-toolbar.ts`** (extended) — appends a `<button data-theme-cycle>` after the volume readout inside the existing toolbar. On click, calls `window.__tuningSystemsTheme.cycle()`. Subscribes to `THEME_PREFS_EVENT` so external mutations (devtools, future second control) keep the glyph in sync. Build discipline preserved: `createElement` + `textContent` only — no unsafe-HTML-assignment property.

## How It Integrates with the Existing Audio Toolbar

The audio toolbar's mount logic was unchanged in shape: same sentinel guard, same `DOMContentLoaded` deferral for the body-append, same `createElement`/`textContent` discipline. The theme button is just one more element appended inside `root` between `volReadout` and `document.body.appendChild(root)`. New IIFE-local helpers (`glyphFor`, `readThemeMode`, `syncThemeButton`) are scoped to mount() — no leakage into the audio path. The audio toolbar's three new compile-time literals (`THEME_EVT_LIT`, `THEME_MODES_LIT`, `THEME_DEFAULTS_LIT`) sit alongside the four existing `AUDIO_*_LIT` constants and follow the exact same `JSON.stringify(...)` pattern.

All 46 pre-existing audio tests still pass (verified pre- and post-edit).

## FOUC-Prevention Mechanism

Three things made FOUC avoidable here:

1. **Order in `head:`** — `themeHeadPayload()` is interpolated FIRST, before the KaTeX `<link>` and before `audioToolbarHeadPayload()`. This puts the theme `<style>` rules BEFORE Framework's theme `@imports` in document order, and the theme `<script>` BEFORE any other `<script>`.
2. **No `DOMContentLoaded` wrapper** — the theme IIFE runs top-level during head parse. `document.documentElement` is available because the `<html>` element is the very thing being parsed; you can call `setAttribute` on it from inside `<head>` without waiting.
3. **Override specificity** — `html[data-tuning-systems-theme="light"]` has higher specificity than `:root` (attribute selectors beat element selectors), so Framework's `:root { ... }` rules from `theme-air.css`/`theme-near-midnight.css` lose to the override when the attribute is set.

When mode is `"auto"`, the attribute is **removed** instead of set, so Framework's built-in media-query @imports take over and follow OS preference — exactly the v1 behavior.

Verified in the built `dist/index.html`: theme IIFE at byte index 8248 in `<head>`, audio IIFE at 9938 — order is theme-first as required.

## Deviations from PLAN.md

**1. [Rule 3 – Blocking] Added `src/theme/**/__tests__/**/*.test.ts` to vitest.config.ts include glob.**
- **Found during:** Task 5 (RED gate) — test file existed but vitest didn't discover it.
- **Issue:** `vitest.config.ts` uses an explicit per-subsystem include glob (`src/lib/**`, `src/audio/**`, `src/components/**`) and has no entry for `src/theme/**`. Without this addition, `npx vitest run` would skip the new spec entirely and the plan's "all tests pass" verification would be meaningless.
- **Fix:** One-line addition to the `test.include` array matching the existing per-subsystem pattern, with a comment cross-referencing QUICK-9MN-01.
- **Files modified:** `vitest.config.ts`
- **Commit:** `cd69560` (rolled into the RED-gate commit since it's a pure test-infrastructure change required for the test to even run)

**2. Reworded three comments in audio-toolbar.ts and one in theme-head.ts to avoid the literal token "innerHTML".**
- **Found during:** Task 2 verify gate (`! grep -q "innerHTML" src/components/theme-head.ts`) and Task 3 verify gate (same shape).
- **Issue:** Both gates were defined as `! grep -q "innerHTML"`, which is a stricter regression test than "no innerHTML assignment in code" — the literal token in a comment is also matched. The pre-existing audio-toolbar.ts had a header comment with the word "innerHTML" (carried over from QUICK-TUX-01), so the grep gate already mismatched the file as written by the previous plan.
- **Fix:** Reworded my new comments and the one pre-existing comment to describe "the unsafe HTML-assignment property (deliberately banned by this codebase)" instead. The actual XSS discipline (createElement + textContent only) is unchanged; only the wording shifted.
- **Files modified:** `src/components/audio-toolbar.ts`, `src/components/theme-head.ts`
- **Commits:** `21701b0`, `58c41a1`

No other deviations. The plan was followed exactly otherwise — same exports, same constants, same mode order, same data attribute, same button shape, same head-payload ordering.

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | clean (exit 0) |
| `npx vitest run` (full suite) | 356/356 pass (was 328 baseline; +28 new theme-prefs tests) |
| `npx prettier --check` (all 6 modified files) | clean |
| `npx observable build` | 21 pages rendered, 0 errors |
| Theme payload in `dist/index.html` head | `__tuningSystemsTheme` at byte 8248 |
| Audio payload in same head | `tuning-systems:audio-prefs-changed` at byte 9938 — theme runs first ✓ |
| `data-theme-cycle` button reaches the rendered HTML | present ✓ |
| Pre-existing audio tests (46) | all pass |

## Success Criteria

- [x] Toggle button rendered INSIDE `[data-tuning-systems-audio-toolbar]` (locked decision 2)
- [x] Cycling order: `auto → light → dark → auto` (encoded by `THEME_MODES` array order)
- [x] First-load default `"auto"` does NOT set the data attribute (Framework's media-query @imports remain active)
- [x] Manual choices persist via localStorage key `tuning-systems:theme-prefs`
- [x] No FOUC: synchronous head IIFE applies attribute before first paint (locked decision 3)
- [x] Pre-existing audio tests still pass; `tsc --noEmit` clean
- [x] No file outside `files_modified` changed (vitest.config.ts addition documented as deviation)

## Self-Check: PASSED

Verified files exist:
- FOUND: src/theme/theme-prefs.ts
- FOUND: src/theme/__tests__/theme-prefs.test.ts
- FOUND: src/components/theme-head.ts
- FOUND (modified): src/components/audio-toolbar.ts
- FOUND (modified): observablehq.config.ts
- FOUND (modified): vitest.config.ts

Verified commits in git log:
- FOUND: cd69560 (test gate RED)
- FOUND: f3199c1 (Task 1 GREEN)
- FOUND: 21701b0 (Task 2)
- FOUND: 58c41a1 (Task 3)
- FOUND: 1336f77 (Task 4)
