---
phase: 03-visualization-mobile-audio-audit
plan: 06
subsystem: ui
tags: [observable-framework, dashboard, kbm, lattice, tonality-diamond, keyboard, ios-safari, mobile-audit]

# Dependency graph
requires:
  - phase: 03-visualization-mobile-audio-audit
    provides: kbm.ts, diamond.ts, synth.ts mobile-Safari fixes, lattice.ts, tonality-diamond.ts, keyboard.ts
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: Scale, parseScala, sclIo (.scl), createSynth, audioPanel, scaleTable
provides:
  - Combined .scl + .kbm import/export widget (sclIo with auto-detection by extension)
  - Dashboard wired with three viz widgets (lattice, tonality diamond, keyboard) below the audio strip
  - kbm-aware effectiveBaseHz threading through every audition path
  - "Use baseHz instead of imported .kbm" override toggle (surfaces only after .kbm import)
  - Floating Stop-all-audio button + Esc shortcut (visible only when synth.activeVoices > 0)
  - iOS auto-zoom suppression (16px input font-size)
  - Phase 3 INVENTORY consolidation (12 new symbols across 5 sub-sections)
  - mobile-audit.md (RDM methodology + iOS quirks + D-15 audio fix inventory)
affects: [phase-04-analysis-sharing]  # ANAL-04 URL-hash persistence will thread through importedKbm/effectiveBaseHz

# Tech tracking
tech-stack:
  added: []  # all libs were installed in earlier waves
  patterns:
    - "Mutable + setInterval(100ms) for activeVoices polling driving Stop-button visibility (RESEARCH OQ2)"
    - "Esc keydown bound in synth cell (no scale dependency) so it doesn't rebind on edits (Pitfall #11)"
    - "kbm-aware effectiveBaseHz derived via kbmToFrequencies (single source of truth — no inline Math.pow)"
    - "Per-page style: frontmatter pattern requires theme-token redefinition in styles.css (UAT discovery)"

key-files:
  created:
    - ".planning/phases/03-visualization-mobile-audio-audit/mobile-audit.md"
  modified:
    - "src/components/scl-io.ts"
    - "src/components/scl-io.css"
    - "src/index.md"
    - "src/styles.css"
    - "src/lib/INVENTORY.md"
    - "src/components/lattice.ts"          # UAT fix
    - "src/components/lattice.css"         # UAT fix
    - "src/components/tonality-diamond.ts" # UAT fix
    - "src/components/tonality-diamond.css"# UAT fix
    - "src/components/keyboard.css"        # UAT fix

key-decisions:
  - "D-01 honored: all three viz widgets ship on src/index.md, no theory pages"
  - "D-02 honored: full-bleed vertical stack — lattice → diamond → keyboard in document order"
  - "D-11 honored: combined sclIo handles both .scl and .kbm, auto-detected by extension"
  - "D-13 honored: imported .kbm applies to playback by default, override toggle surfaces only after import"
  - "D-16 honored: Stop button + Esc bound globally; visibility driven by 100ms activeVoices polling"
  - "D-17 honored: single-column responsive at all widths (no @media); 16px input font-size for iOS auto-zoom suppression"
  - "D-18 honored: Safari macOS RDM is the verification target; physical-iPhone deferred"
  - "Pitfall #11 honored: Esc handler bound in synth cell (no scale-dependency rebinding)"
  - "Pitfall #2 honored: no new AudioContext allocations in viz cells"
  - "UAT discovery (deviation 1): per-page style: frontmatter REPLACES Framework's default stylesheet — theme tokens must be redeclared in styles.css for var(--theme-*) lookups to resolve"

patterns-established:
  - "Pattern: dashboard cell-ordering — Mutable kbm state and effectiveBaseHz must be defined BEFORE audioPanel + viz cells consume them"
  - "Pattern: Stop-button visibility via Mutable<boolean> + 100ms setInterval polling on synth.activeVoices (10 Hz, accepted cost per RESEARCH OQ2)"
  - "Pattern: theme tokens MUST live in styles.css (not Framework default) when any page uses style: frontmatter"
  - "Pattern: lattice/diamond viz fits coordinates into viewBox via scale + center transform; never trust raw library coords to fit"
  - "Pattern: viz fills use color-mix(COLOR 40%, transparent) — translucent overlay reads on both light + dark themes"

requirements-completed: [VIZ-01, VIZ-02, VIZ-03, IO-03, AUDIO-06]

# Metrics
duration: ~10h (multi-session: planning + execute + UAT + close)
completed: 2026-05-06
---

# Phase 3 Plan 06: Dashboard Wiring + Mobile Audit Summary

**Dashboard fully integrated — lattice + tonality diamond + scale-on-keyboard render below the audio + .scl/.kbm I/O strip; effectiveBaseHz threads kbm-aware Hz math through every audition path; Stop button + Esc globally bound; mobile-audit.md documents Safari RDM methodology + iOS quirks; human-verified on Safari macOS RDM after one inline UAT fix cycle.**

## Performance

- **Duration:** ~10h elapsed wall-clock (multi-session — execution split across planning, the UAT cycle, and close-out)
- **Started:** 2026-05-05T22:35Z (Task 1 commit `a406c30`)
- **Completed:** 2026-05-06T16:16Z (UAT fix commit `7d943ae` + this close-out)
- **Tasks:** 6 / 6
- **Files modified:** 11 (5 in scope per plan + 5 viz files patched in UAT fix + 1 mobile-audit.md created)

## Accomplishments

- Combined `.scl` + `.kbm` I/O widget (`sclIo`) with auto-detection by extension; preserves Phase 2 `.scl` UI verbatim and adds parallel `.kbm` import/export with field-named status messages.
- Three Phase 3 viz widgets (lattice, tonality diamond, scale-on-keyboard) integrated into the dashboard below the audio + I/O strip per D-02.
- kbm-aware `effectiveBaseHz` (derived via `kbmToFrequencies` — single source of truth, no inline Math.pow) threaded through `audioPanel`, `lattice`, `tonalityDiamond`, and `keyboard`.
- "Use baseHz instead of imported .kbm" override toggle, surfacing only after a `.kbm` import (D-13).
- Floating Stop-all-audio button (destructive `--theme-red` styling) + page-wide Esc shortcut, visibility driven by 100ms `synth.activeVoices` polling (Pitfall #11 — Esc bound in synth cell, not scale-dependent).
- iOS auto-zoom suppression via global `input, select, textarea { font-size: 16px; }` (D-17).
- INVENTORY.md gained 12 Phase-3 symbol rows across 5 sub-sections (kbm I/O, diamond enumeration, lattice, tonality-diamond, keyboard) with requirement + decision back-references for traceability (Pitfall #5).
- `mobile-audit.md` created with verification methodology, RDM-only limitations (hardware silent switch, autoplay-policy nuances), code-level mitigations (Pitfalls 5/7/8/9/11), D-15 audio fix inventory, and deferred items.
- All 5 Phase-3 requirements (VIZ-01, VIZ-02, VIZ-03, IO-03, AUDIO-06) closed in REQUIREMENTS.md.

## Task Commits

Each task was committed atomically (in execution order):

1. **Task 1: Extend `src/components/scl-io.ts` (+ CSS) for `.kbm` I/O** — `a406c30` (feat)
2. **Task 2: Integrate viz widgets + Esc + Stop button + kbm-aware effectiveBaseHz into `src/index.md`** — `4e4d7f2` (feat)
3. **Task 3: `styles.css` — Phase 3 imports + iOS auto-zoom suppression + Stop-button rules** — `84e9f80` (feat)
4. **Task 4: Append Phase 3 entries to `src/lib/INVENTORY.md`** — `22c8645` (docs)
5. **Task 5: Create `mobile-audit.md`** — `73ef0d8` (docs)
6. **Task 6: Human-verify on Safari macOS RDM** — checkpoint, no code commit (resume signal: `approved` after UAT cycle)

**UAT inline fix:** `7d943ae` (fix) — viz styling + diamond layout corrections discovered during human-verify (see Deviations).

**Plan metadata:** _(this commit)_ — `docs(03-06): complete dashboard wiring + mobile audit plan`

## Files Created/Modified

- **Created:** `.planning/phases/03-visualization-mobile-audio-audit/mobile-audit.md` (191 lines) — RDM verification methodology + iOS quirks + D-15 inventory
- **Modified:** `src/components/scl-io.ts` (+~70 lines, ~242 total) — `.kbm` parse/write/default with auto-detection; new `Download .kbm` button in `.scl-io__export-row`
- **Modified:** `src/components/scl-io.css` (+9 lines, 86 total) — `.scl-io__export-row` flex layout
- **Modified:** `src/index.md` (+~75 lines, 169 total) — `importedKbm` Mutable, `useBaseHzOverride` view, `effectiveBaseHz`, three new viz cells, Stop-button cell, Esc keydown handler in synth cell
- **Modified:** `src/styles.css` (+~70 lines, 122 total) — three new `@import`s, iOS 16px input rule, `.stop-all-audio` rules, theme-token redeclarations (UAT fix)
- **Modified:** `src/lib/INVENTORY.md` (+~40 lines, 105 total) — Phase 3 sub-sections: kbm I/O (5 rows), diamond (2 rows), lattice (3 rows), tonality-diamond (3 rows), keyboard (2 rows)
- **Modified (UAT fix):** `src/components/lattice.ts`, `src/components/lattice.css`, `src/components/tonality-diamond.ts`, `src/components/tonality-diamond.css`, `src/components/keyboard.css` — viewBox fit + translucent fills + iso-coord rhombus diamond + max-width caps

## Decisions Made

Plan executed as written. The single decision-flavored discovery was the UAT-time realization that per-page `style:` frontmatter REPLACES Framework's default stylesheet (rather than augmenting it), which forced theme-token redeclaration in `styles.css`. Recorded as a pattern for Phase 4.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] UAT cycle revealed planning gap: viz styling + diamond layout fixes**

- **Found during:** Task 6 (human-verify smoke test on Safari macOS RDM, light theme)
- **Issue:** Smoke test surfaced four visual regressions not caught by automated `npm run build` / unit tests:
  1. Every `var(--theme-*)` lookup resolved to invalid because the dashboard uses per-page `style:` frontmatter, which REPLACES Framework's default stylesheet rather than augmenting it. Viz fills fell back to opaque black.
  2. Raw `kraigGrady9` lattice coordinates from `ji-lattice` could under- or overflow the SVG viewBox depending on scale shape.
  3. Tonality diamond was rendered on a square `(col, row)` grid instead of an isometric `(col-row, col+row)` grid — visually a square, not the rotated rhombus that the Partch/Erlich convention expects.
  4. Viz fills used `color-mix(COLOR 24%, var(--theme-background))` which became indistinguishable from the dark-theme background (and was opaque-black-ish during the bug above).
- **Fix:** Single atomic commit `7d943ae`:
  - `styles.css`: declare `--theme-blue`, `--theme-foreground`, `--theme-background`, etc. directly (light + `prefers-color-scheme: dark`).
  - `lattice.ts`: project coords into the viewBox via fit-to-bounds scale + center; reduced node radius (18 → 12) and tightened cents-label offset (y=30 → y=26).
  - `lattice.css` / `tonality-diamond.css` / `keyboard.css`: switch fills from `color-mix(COLOR 24%, var(--theme-background))` to `color-mix(COLOR 40%, transparent)` — translucent overlay reads on both themes. Cap viz `max-width: 720px`. Drop `--theme-orange` (not a Framework token) → `--theme-yellow`.
  - `tonality-diamond.ts`: switch from square `(col, row)` grid to isometric `(col-row, col+row)` coords for a true rotated rhombus with the unison axis vertical. Auto-scale `STRIDE` so a 31-limit diamond (16x16) still fits the viewBox.
- **Files modified:** `src/components/lattice.ts`, `src/components/lattice.css`, `src/components/tonality-diamond.ts`, `src/components/tonality-diamond.css`, `src/components/keyboard.css`, `src/styles.css`
- **Verification:** Re-ran smoke test on Safari macOS RDM (iPhone preset) — user response `approved`. `npm run ci` exits 0; 176 tests pass.
- **Committed in:** `7d943ae` (`fix(03-06): resolve UAT issues — viz styling + diamond layout`)
- **Why this was Rule 1:** Each item was a visible bug — theme tokens silently failed at runtime, lattice coords could clip, the diamond did not match its name. None required architectural change; all were local fixes inside Phase 3 component files.

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** UAT loop closed in a single fix commit before approval; no scope creep, no replan, no new requirements introduced.

## Issues Encountered

- **Per-page `style:` frontmatter behavior surprise.** Discovered at UAT time that Framework's `style:` frontmatter REPLACES the default stylesheet rather than augmenting it. Resolved by declaring theme tokens explicitly in `styles.css`. **Pattern recorded** for Phase 4 — any new page using `style:` frontmatter inherits these tokens automatically since `styles.css` is the imported root.
- **`ji-lattice` coordinate ranges depend on basis primes.** Different prime bases produce coordinate envelopes of very different magnitudes. Solved with a fit-to-viewBox scale + center transform inside `lattice.ts`; do not assume library output already fits.

## Human Verification — Outcome

- **Methodology used:** Section 1 of `mobile-audit.md` — Safari macOS Responsive Design Mode, iPhone preset, navigated to `localhost:3000` after `npm run dev`.
- **Result:** **PASSED** after the UAT fix commit was applied. User resume signal: `approved`.
- **Verification date:** 2026-05-06.
- **Smoke-test items confirmed:** dashboard renders without horizontal overflow at >= 320px; lattice + diamond + keyboard render with correct fills on light theme; `.kbm` import surfaces the override toggle; toggle ON/OFF affects audition Hz; Stop button + Esc both call `synth.panic()`; input taps don't trigger iOS auto-zoom.
- **Gaps filed:** none. (No items punted to `/gsd-verify-work`.)

## TDD Gate Compliance

This plan is `type: execute` (not `type: tdd`); RED→GREEN→REFACTOR cycle did not apply at the plan level. Per-task TDD was the responsibility of Plans 03-02, 03-04, and 03-05, all closed in earlier waves with their own gate compliance.

## User Setup Required

None — no external service configuration required. The `npm run dev` + Safari RDM verification is the only manual loop, and it is documented as the verification target per D-18.

## Next Phase Readiness

**Ready for Phase 4 (Analysis & Sharing):**

- The `importedKbm` Mutable + `useBaseHzOverride` view + `effectiveBaseHz` triad in `src/index.md` is the path **ANAL-04** (URL-hash persistence) will thread through. Persisting the imported `.kbm` and the override toggle into the URL hash is the natural next step; the dashboard cell ordering already places `importedKbm` before any consumer.
- INVENTORY.md is current through Phase 3; Phase 4 plans can grep it to know what kernel + component surface already exists.
- `mobile-audit.md` Section 5 lists the deferred items (physical-iPhone verification, iOS < 16.4 fallback) — neither blocks Phase 4.
- All 5 Phase-3 requirements (VIZ-01, VIZ-02, VIZ-03, IO-03, AUDIO-06) closed in REQUIREMENTS.md and the traceability table.
- Phase 3 test count: **176 passing, 0 failing** (`npm run ci` exits 0).

**Blockers:** none.

## Self-Check: PASSED

Files claimed in this SUMMARY all exist on disk:

- `src/components/scl-io.ts`, `src/components/scl-io.css`
- `src/index.md`, `src/styles.css`
- `src/lib/INVENTORY.md`
- `.planning/phases/03-visualization-mobile-audio-audit/mobile-audit.md`
- `src/components/lattice.ts`, `src/components/lattice.css`
- `src/components/tonality-diamond.ts`, `src/components/tonality-diamond.css`
- `src/components/keyboard.css`

Commits referenced are all present in `git log --oneline --all`:

- `a406c30` (Task 1), `4e4d7f2` (Task 2), `84e9f80` (Task 3), `22c8645` (Task 4), `73ef0d8` (Task 5), `7d943ae` (UAT fix).

CI gate: `npm run ci` exits 0 — 13 test files, 176 tests passed.

---
*Phase: 03-visualization-mobile-audio-audit*
*Plan: 06*
*Completed: 2026-05-06*
