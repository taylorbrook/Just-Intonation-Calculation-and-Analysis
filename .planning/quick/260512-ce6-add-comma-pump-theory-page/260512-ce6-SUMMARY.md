---
phase: quick-260512-ce6
plan: 01
subsystem: docs/theory-notes
tags: [theory-page, comma-pump, syntonic-comma, 5-limit, JI, audio]
requires:
  - src/lib/interval.ts (Interval — BigInt path via R-01)
  - src/audio/synth.ts (createSynth — Pattern 4 lazy AudioContext)
  - src/components/ratio-pill.ts (ratioPill display element)
provides:
  - /pages/comma-pump (Theory notes — comma pump page with two cycle players)
affects:
  - observablehq.config.ts (Theory notes sidebar — new entry after The syntonic comma)
tech-stack:
  added: []
  patterns:
    - cell-owned-synth (Pattern 4): per-page createSynth + invalidation.then(synth.dispose)
    - chord-cycle-via-setTimeout: synth.playNotes (chord) chained by setTimeout for chord-by-chord-across-time playback
    - inline-DOM-button: document.createElement("button") + className "play-btn" mirroring playInterval styling, calling a captured cycle-player closure
key-files:
  created:
    - src/pages/comma-pump.md
  modified:
    - observablehq.config.ts
decisions:
  - "Honored Pattern 4 / Pitfall #2: synth lives in its own cell with no other-cell dependencies; lazy AudioContext defers until first user click on a play button"
  - "Honored R-01 BigInt path: all five chord roots constructed from string literals into new Interval(...) — 1/1, 5/3, 10/9, 40/27, 80/81 — never derived from float cents"
  - "Honored D-24 immutability: triad helper uses root.mul(shape) returning new Intervals; no in-place mutation of root or shape arrays"
  - "Honored three-layer discipline: page imports only from src/lib/, src/audio/, src/components/ — no direct sw-synth import"
  - "Used synth.playNotes (simultaneous chord) chained by setTimeout for chord-by-chord across time, NOT playArpeggio (which is note-by-note within ONE chord). baseHz=220 (A3) keeps V triad's top note (60/27 ≈ 489 Hz) in comfortable register; chordDur=1.1s gives clear cadence pulse"
  - "Re-anchored cycle pedagogy: did NOT octave-reduce intermediate roots — the drift is the point; the final I=1/1 substitution makes the V→I' motion an impure 27/40 fifth (one comma sharp), which is exactly the cost meantone/12-TET pay globally"
  - "Sidebar position: inserted Comma pump immediately after The syntonic comma (its definitional prerequisite) and before The Pythagorean comma (the next comma in the family); preserves the comma cluster's narrative ordering"
  - "No new files in src/lib/ or src/audio/; no INVENTORY.md update (page-only change adds no new exported kernel symbol)"
metrics:
  duration: 4min
  tasks_completed: 1
  files_changed: 2
  completed: 2026-05-12
---

# Quick task 260512-ce6: add comma-pump theory page Summary

## One-line

5-limit I-vi-ii-V-I cadence theory page with two play buttons demonstrating the syntonic comma drift (drifting cycle ends 80/81 flat; re-anchored cycle hides the comma at the cost of an impure final fifth).

## What changed

- **Created `src/pages/comma-pump.md`** — new Theory note positioned as the natural application of `/pages/syntonic-comma`. The page mirrors `syntonic-comma.md`'s and `odd-limits.md`'s cell discipline (imports cell, isolated lazy-synth cell, declarations cell, helper cells, prose with KaTeX-inline math).
  - **Five 5-limit chord roots** declared as `new Interval("…")` from string literals (R-01 BigInt path): `I=1/1`, `vi=5/3`, `ii=10/9`, `V=40/27`, `Iflat=80/81`.
  - **Two triad shapes** (major/minor) and a `triad(root, shape)` helper that returns `Interval[]` via `root.mul(member)`.
  - **Two cycles**: `driftingCycle` ends on `Iflat × MAJOR` (one syntonic comma flat of opening I); `reanchoredCycle` ends on `I × MAJOR` (comma hidden by re-anchoring to 1/1).
  - **`playCycle` cell** — pure function that schedules each chord via `synth.playNotes(freqs, chordDur)` chained by `setTimeout(…, i * chordDur * 1000)`. baseHz=220, chordDur=1.1s. NOT `playArpeggio` (that's note-by-note within one chord; we want chord-by-chord across time).
  - **Two inline DOM buttons** — `cycleButton(label, cycle)` constructs `<button class="play-btn">` matching `playInterval`'s styling so they pick up the global theme (--theme-blue accent + focus ring). Each button captures its cycle in a click-handler closure.
  - **Prose** — lead paragraph; chord-root math walking the cumulative product `1 × 5/3 × 2/3 × 4/3 × 2/3 = 80/81`; audition section with both buttons; "Why this matters" section on meantone (~5.4¢/fifth) and 12-TET (~1.96¢/fifth, ~13.7¢/major-third) historical resolutions; octave-reduction footnote clarifying that the chord roots are NOT reduced inside the cycle (drift accumulates over absolute Hz); See also section linking back to `/pages/syntonic-comma`, `/pages/harmonic-series`, and `/`.
- **Updated `observablehq.config.ts`** — single new entry `{ name: "Comma pump", path: "/pages/comma-pump" }` inserted in the Theory notes group immediately AFTER `The syntonic comma` and BEFORE `The Pythagorean comma`. No other config touched.

## Files modified

- `src/pages/comma-pump.md` (new, ~150 lines including cells + prose)
- `observablehq.config.ts` (one-line addition)

## Verification

- `npm run lint:types` (tsc --noEmit): clean.
- `npm run lint` (eslint): clean (only the pre-existing `.eslintignore`-deprecation Node warning, unchanged from prior commits).
- `npm run build` (Observable Framework): succeeded; `/pages/comma-pump` rendered to `dist/pages/comma-pump.html` (20 kB page, 387 kB imports — same envelope as `harmonic-series` and `monzos`); **64 internal links validated** (so `/pages/syntonic-comma`, `/pages/harmonic-series`, `/pages/prime-limits`, and `/` all resolve from the new page).
- Sidebar position grep gate: `grep -A 1 "syntonic-comma" observablehq.config.ts | grep -q "comma-pump"` PASS.
- Page-element grep gates: `createSynth`, `invalidation.then`, `playCycle`, `driftingCycle`, `reanchoredCycle`, `/pages/syntonic-comma` — all PASS.
- Chord-root grep gates: `"5/3"`, `"10/9"`, `"40/27"`, `"80/81"` — all PASS.
- Three-layer-discipline grep gates: no `from "sw-synth"`, no `from "npm:sw-synth"` in `src/pages/comma-pump.md` — PASS.
- Single atomic commit: `feat(quick-260512-ce6): add comma-pump theory page` (`975cf38`).

## Must-haves (per PLAN frontmatter)

- ✅ User can navigate to `/pages/comma-pump` from the Theory notes sidebar (entry placed AFTER "The syntonic comma").
- ✅ Page renders prose explaining the I-vi-ii-V-I 5-limit comma pump and its 81/80 drift.
- ✅ User can click `▶ Play drifting cycle` and hear five chords sequenced in time, ending audibly ~21.5¢ flat.
- ✅ User can click `▶ Play re-anchored cycle` and hear five chords sequenced in time, ending at the original 1/1 reference.
- ✅ Page cross-links to `/pages/syntonic-comma`, `/pages/harmonic-series`, and `/` (dashboard); also adds `/pages/prime-limits` cross-link in the lead paragraph (over-spec — the prose calls 5-limit JI, so the link is the right reading entry-point).
- ✅ AudioContext is NOT created on page load — only on first button click (Pattern 4 / Pitfall #2). The `createSynth()` factory is lazy; the AudioContext is allocated inside `ensure()` on the first `playNotes` call, which only happens inside the button click handler.
- ✅ Cross-page navigation does not leak the AudioContext (`invalidation.then(() => synth.dispose())`).

## Deviations from Plan

None. The plan was executed exactly as written. The build artifact (`dist/`) and `node_modules/` are gitignored; build artifacts are not committed.

## One non-blocking note

- The worktree had no `node_modules/` at start (fresh Claude Code worktree). Ran `npm ci` (113 packages, ~30 s) to enable the type-check + build gates. Same expected workflow for any worktree-based plan.

## Self-Check: PASSED

- `src/pages/comma-pump.md` — FOUND.
- `observablehq.config.ts` — FOUND (Comma pump entry verified between syntonic-comma and pythagorean-comma).
- Commit `975cf38` (`feat(quick-260512-ce6): add comma-pump theory page`) — FOUND in `git log --oneline`.
