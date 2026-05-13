---
quick_id: 260513-foy
status: complete
date: 2026-05-13
deliverable: audit + command-sequence handoff
---

# Quick Task 260513-foy: Interactive Figures Audit + Command Sequence

## What This Task Produced

A scoped audit of all 18 theory pages plus a six-command sequence the user
can paste into fresh `/gsd-quick` context windows to land the full sweep of
"make graphs/figures clickable for playback." No code changes were applied
in this task — it is a planning + handoff artifact.

## Audit Snapshot

**Already interactive — no work needed (9 pages):**
analysis, commas, comma-pump, harmonic-series, monzos, otonality-utonality,
prime-limits, pythagorean-tuning, scale-workshop-interop.

**Gaps requiring work (9 pages):** odd-limits, tenney-height,
well-temperament, pythagorean-comma, meantone, edo-approximation, schisma,
septimal-comma, syntonic-comma.

**Structural blockers (component-level work needed first):**

1. `spiral-of-fifths.ts` — no click affordance. Needs an optional
   `onStepClick` callback prop. Blocks `pythagorean-comma.md` + `meantone.md`.
2. `tonality-diamond.ts` — exports both an interactive `tonalityDiamond()`
   (takes a synth, wires clicks) and a display-only `renderDiamondSVG(n)`.
   `odd-limits.md` calls the display-only form three times. Either extend
   `renderDiamondSVG` to accept an optional `synth` or have the page build
   odd-limit Scales and call `tonalityDiamond` directly.
3. Observable Plot's `Dot` mark does not expose click events natively.
   Pages with static scatter charts (edo-approximation, tenney-height,
   schisma, septimal-comma, syntonic-comma) should adopt the proven
   "ratio-pills-beside-chart" pattern from `prime-limits.md` rather than
   trying to hack click handlers onto Plot dots.

## Command Sequence (Paste in Fresh Windows)

Commands are ordered so structural extensions come before the pages that
depend on them. Each command is self-contained — no prior context needed.

### 1. Extend `spiral-of-fifths` with click-to-play

```
/gsd-quick Extend src/components/spiral-of-fifths.ts with an optional `onStepClick?: (step: SpiralStep) => void` prop on SpiralOfFifthsOpts. Bind a D3 .on('click', ...) handler to each rendered node so the callback fires with the corresponding SpiralStep (k, ratio, cumulativeCents, centsFrom12tet). Add `cursor: pointer` to .spiral-node in src/components/spiral-of-fifths.css ONLY when the click handler is provided (use a `.is-clickable` class toggle on the root). Backwards-compatible: omitting onStepClick must leave existing behavior and tests unchanged. Update src/components/__tests__/spiral-of-fifths.test.ts to cover the new prop. The component remains viz-only — do not import the synth (audition belongs at the call site).
```

### 2. Make odd-limits diamonds clickable (the original example)

```
/gsd-quick In src/pages/odd-limits.md, replace the three renderDiamondSVG() calls (5-, 7-, 11-odd-limit) with the interactive tonalityDiamond() component so every cell is click-to-audition. Either (a) extend renderDiamondSVG in src/components/tonality-diamond.ts to accept an optional `synth` parameter and forward clicks to playInterval, OR (b) construct an odd-limit Scale in the page and call tonalityDiamond(scale, synth, opts) directly. Initialize the synth once at the top of the page using the same pattern as src/pages/monzos.md (import playInterval from ../components/play-interval.js, instantiate shared synth). Keep the existing visual layout (three diamonds, widths 280/320/440). The Pythagorean-comma D-08 three-layer discipline still applies: viz components do not own the synth — the page does.
```

### 3. Wire spiral click-to-audition on the two pages that use it

> Requires command 1 to land first.

```
/gsd-quick Wire the new onStepClick callback on every spiralOfFifths() call in src/pages/pythagorean-comma.md and src/pages/meantone.md. The callback should call playInterval() with the step's ratio (use playTempered for the meantone tempered spirals where step.ratio is null — derive the ratio approximation from cumulativeCents). Initialize a shared synth at the top of each page using the pattern in src/pages/monzos.md. Clicking any node on the spiral should audition that step. Note: src/pages/pythagorean-tuning.md does NOT use spiralOfFifths (it uses scaleTable, which already has per-row play buttons) — do not modify it.
```

### 4. Add play buttons to the Tenney-height scatter

```
/gsd-quick In src/pages/tenney-height.md, add an inline ratio-pills row beside (or directly below) the existing Tenney-height scatter chart. One pill per plotted ratio (15 total), each with a play button that calls playInterval() on click. Initialize a shared synth at the top of the page. Mirror the ratio-pill + playInterval pattern from src/pages/prime-limits.md exactly — same component imports (ratioPill, playInterval), same visual treatment, same DOM structure. Do not attempt to make the Plot scatter dots themselves clickable — Plot.dot() does not expose click events.
```

### 5. Add per-row play buttons to the well-temperament variants table

```
/gsd-quick Add a "Play" column with per-row play buttons to the variants table in src/pages/well-temperament.md (6 well-temperament schemes × 3 interval columns = 18 buttons total). Use the playTempered() cents→ratio factory pattern from src/pages/meantone.md (the page exports the helper inline; copy or hoist it as needed). Each click should audition that specific tempered interval (fifth / major third / minor third) for that scheme. Initialize a shared synth at the top of the page. Do not modify the existing strip chart in this task — pills-on-chart is command 6.
```

### 6. Add ratio-pills audition rows to remaining scatter charts

```
/gsd-quick Add a clickable ratio-pills row beside each Plot scatter chart on src/pages/edo-approximation.md, src/pages/schisma.md, src/pages/septimal-comma.md, and src/pages/syntonic-comma.md. Each pill maps to one plotted point and auditions it via playInterval() (or playTempered for irrational cents values like the EDO steps on edo-approximation.md — that page already exposes playStepAt()). Follow the exact pattern from src/pages/prime-limits.md: import ratioPill + playInterval, instantiate shared synth at top of page, render pills row immediately after the chart. These four pages already have isolated inline play buttons — do not remove them; the pills row supplements the chart.
```

## Suggested Cadence

- Commands 1, 4, 5 are independent. Run in any order.
- Command 2 is independent.
- Command 3 depends on command 1. Wait for 1's commit before pasting 3.
- Command 6 is independent. Largest of the six (touches four pages); could be split per-page if it exceeds quick-task scope.

## Out of Scope (Intentionally Deferred)

- `comma-pump.md` charts: chord-root data points could be made clickable to
  audition specific re-anchoring points. Skipped — pump cycles are already
  driven by the dedicated cycle buttons; per-point click is low marginal
  value and would muddy the drift narrative.
- 3D lattice extensions (Tenney-Euclidean space): explicitly out of scope
  per `CLAUDE.md` ("Three.js for the lattice in v1: overkill").
- Hover-to-play affordances: every command above uses click, not hover.
  Hover-audition is a UX decision worth a separate spike if desired.

## Files Referenced (No Edits in This Task)

- `src/pages/*.md` — 18 theory pages surveyed read-only
- `src/components/spiral-of-fifths.ts` + `.css`
- `src/components/tonality-diamond.ts`
- `src/components/play-interval.ts`, `play-dyad.ts`, `play-scale.ts`
- `src/audio/synth.ts`

## Status

Audit + command sequence delivered. No source code modified in this quick
task. User will run commands 1–6 in fresh `/gsd-quick` windows.
