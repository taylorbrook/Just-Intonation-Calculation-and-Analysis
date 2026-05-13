---
phase: quick-260513-kl9
plan: 01
subsystem: pages/tenney-height
tags: [tenney-height, audio, ratio-pill, play-interval, ux]
dependency_graph:
  requires:
    - src/lib/interval.ts
    - src/audio/synth.ts
    - src/components/ratio-pill.ts
    - src/components/play-interval.ts
  provides:
    - "Audible inline ratio-pills row below the cents-vs-Tenney-height scatter chart on /pages/tenney-height"
  affects:
    - src/pages/tenney-height.md
tech_stack:
  added: []
  patterns:
    - "ARCHITECTURE Pattern 2: plain DOM factory inside an IIFE returning the container, then display()."
    - "ARCHITECTURE Pattern 4: cell-owned synth (createSynth + invalidation.then(dispose))."
    - "XSS discipline (T-02-22/T-02-23, T-kl9-01): createElement + appendChild only; dynamic text via factory components that use textContent."
key_files:
  created: []
  modified:
    - src/pages/tenney-height.md
decisions:
  - "Reuse the existing scatterRatios array directly (cell scope) — no redeclare, no shared `Interval` helper. Chart cell construction stays byte-identical."
  - "Leave playInterval defaults intact per D-08 / D-18: 440 Hz root, 1.5s duration, bare ▶ glyph (no label)."
  - "Wrap each pill/button pair in an inline-flex span with gap so the two glyphs stay glued together across wrap boundaries."
metrics:
  duration_seconds: 46
  completed_date: 2026-05-13
---

# Phase quick-260513-kl9 Plan 01: Inline ratio-pills row on tenney-height Summary

Wired an audible inline ratio-pills row directly below the cents-vs-Tenney-height scatter chart on `/pages/tenney-height` — one `ratioPill` + bare ▶ `playInterval` button per ratio in the existing `scatterRatios` array, mirroring the prime-limits.md pattern exactly.

## What was done

1. **Imports** — Added three new imports to the existing top-of-page `ts` block (alphabetized within the audio/components groups; existing imports preserved in order):
   - `createSynth` from `../audio/synth.js`
   - `playInterval` from `../components/play-interval.js`
   - `ratioPill` from `../components/ratio-pill.js`

2. **Synth cell** — Inserted a standalone `ts` cell immediately after the imports and before the `<aside class="prereq">` block. Canonical Pattern 4 shape:
   ```ts
   const synth = createSynth();
   invalidation.then(() => synth.dispose());
   ```
   Lazy AudioContext — no allocation until first click.

3. **Pills row** — Inserted directly after the existing `display(scatterChart);` line, with a one-line plain-Markdown caption ("Click any ratio to hear it.") above. The cell builds a `div.ratio-pills-row` flex-wrap container, iterates the existing `scatterRatios` array (32 entries), and appends one wrapper `span` per ratio containing `ratioPill(iv)` + `playInterval(iv, synth)`. IIFE pattern returning the container, then `display(...)`.

## Verification

- `npm run build` → succeeds, all 21 pages render, 111 links validated.
- `npx tsc --noEmit` → clean (no output).
- `grep -c playInterval src/pages/tenney-height.md` → **4** (≥ 1 ✓)
- `grep -c createSynth src/pages/tenney-height.md` → **3** (≥ 2 ✓)
- `grep -c ratioPill src/pages/tenney-height.md` → **4** (≥ 2 ✓)
- `grep -n scatterRatios src/pages/tenney-height.md` → declared once at line 145, referenced from chart cell (153) and new pills cell (241) ✓.
- `git diff src/pages/tenney-height.md` shows **exactly 50 line insertions, 0 deletions** — scatterRatios / scatterData / scatterChart / worked-examples table / EDO-error prose / see-also / further-reading all untouched.

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Type | Message | SHA |
|------|---------|-----|
| feat | feat(tenney-height): inline ratio-pills row with play buttons below scatter | 27cb390 |

## Self-Check: PASSED

- File modified exists: `src/pages/tenney-height.md` ✓
- Commit exists in git log: `27cb390` ✓
- Done-criteria greps satisfied ✓
- Build + type-check pass ✓
- Scatter chart byte-identical to pre-edit form (diff shows 0 line modifications in the chart cell) ✓
