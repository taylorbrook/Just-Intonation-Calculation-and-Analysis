---
phase: quick-260512-fo8
plan: 01
subsystem: theory-pages
tags: [observable-framework, plot, audio, comma-pump, theory-page, additive]
requires:
  - src/lib/interval.ts (Interval.cents, Interval.mul, Interval.fraction)
  - src/audio/synth.ts (cell-owned synth via createSynth — reused, not re-instantiated)
  - "@observablehq/plot (Plot.plot, Plot.line, Plot.dot, Plot.link, Plot.text, Plot.ruleY)"
provides:
  - comma-pump page: two Plot line charts (drift + re-anchored with red V→I bracket), third "▶ Play 3 drift cycles" button, "## Further reading" section
affects:
  - src/pages/comma-pump.md
tech-stack:
  added: []
  patterns:
    - "Plot chart at display boundary (Iflat.cents projected ONCE per chart at build time; Pitfall #1)"
    - "BigInt-Fraction accumulator for 3-cycle drift (shift = shift.mul(COMMA_FLAT); Interval.mul preserves precision)"
    - "Cell-owned synth pattern (Pattern 4 / Pitfall #2 — reuses page's existing synth + playCycle; no new AudioContext)"
    - "Shared y-domain across paired charts (DRIFT_Y_DOMAIN = [-28, 6]) so the absorbed-comma bracket and the drift drop are visually commensurable"
    - "Red bracket via three Plot.link marks + one Plot.text (verb-down terminus at y=Iflat.cents, negative)"
key-files:
  created: []
  modified:
    - src/pages/comma-pump.md
decisions:
  - "Step-after curve for both charts (matches the 'nothing accumulates until the cycle closes' narrative — flat through chords 1-4, drop at chord 5)"
  - "Re-use D-33 blue (#4269d0) for the line + a desaturated red (#c45656) for the absorbed-comma bracket; consistent with project palette character"
  - "Bracket lower y-coord = Iflat.cents (negative, ≈ -21.5) NOT -Iflat.cents — the bracket points DOWN to where the drift would have landed; explicit grep gate '! grep -q y2: -Iflat.cents' enforces this"
  - "3-cycle accumulator built inside an IIFE so the chord array is computed once at cell-evaluation time and re-used by the playDrift3 button on every click"
metrics:
  duration_min: 5
  completed_date: "2026-05-12"
---

# Quick task 260512-fo8: Comma-pump drift charts + 3-cycle button + Further reading

add Plot import to existing import cell + new "## Visualizing the drift" section between "## The chord-root math" and "## Audition" with two Plot line charts (drifting: step-after line dropping to Iflat.cents at chord 5 with "−21.5¢ (one syntonic comma)" annotation; re-anchored: flat line at 0 with red bracket spanning V→I via three Plot.link marks pointing DOWN to y=Iflat.cents + "comma absorbed (21.5¢)" Plot.text label) sharing y-domain [-28, 6] so the absorbed-comma bracket and the drift drop are visually commensurable + COMMA_FLAT + drift3Cycle (15-chord array built by IIFE iterating k=0..2 and multiplying a shift accumulator by Interval("80/81") each iteration; Interval.mul preserves BigInt-Fraction precision; Pitfall #1 preserved — cents never feed back into kernel) + playDrift3 = cycleButton("Play 3 drift cycles", drift3Cycle) inside existing button-creation cell + third "▶ Play 3 drift cycles" bullet in Audition section + "## Further reading" section with xen wiki Comma_pump link and Ben Johnston Suite for Microtonal Piano (1977) paragraph; additive only — chord-root constants (I, vi, ii, V, Iflat), MAJOR/MINOR, triad, driftingCycle, reanchoredCycle, playCycle, cycleButton, playDrifting, playReanchored, synth cell, and all existing prose sections byte-equivalent to pre-edit

## Files Touched

- `src/pages/comma-pump.md` — five additive changes:
  1. Appended `import * as Plot from "npm:@observablehq/plot";` to the existing import cell.
  2. Appended `COMMA_FLAT`, `drift3Cycle` (IIFE building a 15-chord `Interval[][]` via `Interval.mul(COMMA_FLAT)` accumulator), and `playDrift3 = cycleButton("Play 3 drift cycles", drift3Cycle)` to the existing button-creation cell (after `playReanchored`).
  3. Inserted the "## Visualizing the drift" section between "## The chord-root math" (ending at "This is the *comma pump*.") and "## Audition", containing intro prose + a `driftChart` cell + connective prose + a `reanchoredChart` cell, each rendering via `display(...)`.
  4. Inserted a third bullet referencing `${playDrift3}` between the `${playReanchored}` bullet and the "## Why this matters" heading.
  5. Appended a "## Further reading" section as the last section of the page (xen wiki Comma_pump + Ben Johnston *Suite for Microtonal Piano* paragraph).

## Key Implementation Notes

- **Drift chart shape:** `Plot.plot` with `curve: "step-after"` on a 5-row data array where the first four rows have `cents: 0` and the fifth has `cents: Iflat.cents` (≈ −21.5064). Step-after gives the visual narrative of "nothing accumulates until the cycle closes" — flat through chords 1–4, drop at chord 5. `Plot.ruleY([0])` draws the dashed zero baseline; `Plot.dot` adds the data points; `Plot.text` writes the "−21.5¢ (one syntonic comma)" annotation anchored to the final point.
- **Re-anchored chart shape:** same axes + y-domain + step-after curve, but all five data rows have `cents: 0` so the line is flat. The bracket is drawn with three `Plot.link` marks (two short vertical ticks at `x=4` and `x=5` dropping from `y=0` to `y=Iflat.cents`, plus a horizontal bar at `y=Iflat.cents` between them) and a single `Plot.text` label `"comma absorbed (21.5¢)"` centered at `x=4.5, y=Iflat.cents`. **Bracket terminus is `Iflat.cents` (negative ≈ −21.5), NOT `-Iflat.cents`** — the bracket points DOWN toward where the drift would have landed. The plan's `! grep -q 'y2: -Iflat.cents'` gate enforces this and passes.
- **Shared y-domain:** `DRIFT_Y_DOMAIN = [-28, 6]` is declared once and reused by both charts so the absorbed-comma bracket in chart 2 is visually commensurable with the drop in chart 1. `CHORD_LABELS_DRIFT = ["I", "vi", "ii", "V", "I'"]` and `CHORD_LABELS_REANCHORED = ["I", "vi", "ii", "V", "I"]` differ only on the final chord label (drifted I' vs re-rooted I).
- **3-cycle accumulator (Pitfall #1 discipline preserved):** `drift3Cycle` is built inside an IIFE that maintains a `shift: Interval` accumulator starting at `1/1`. Each iteration pushes the five triads (`I`, `vi`, `ii`, `V`, `Iflat`) each multiplied by `shift` via `Interval.mul`, then advances `shift = shift.mul(COMMA_FLAT)`. After three iterations the chord array has 15 entries and `shift` has reached `(80/81)^3 ≈ −64.5¢`. All multiplication stays inside BigInt-rational `Fraction` arithmetic; no float cents value is ever fed back into a kernel call.
- **Audio reuse (Pattern 4 / Pitfall #2):** `playDrift3` is just `cycleButton("Play 3 drift cycles", drift3Cycle)` — it threads through the existing `cycleButton` helper and the existing `playCycle` scheduler, which use the page's existing cell-owned `synth`. No new `AudioContext` is allocated. Total run is 15 × 1.1s = 16.5s per the existing `playCycle` defaults.
- **Color palette:** Line strokes use `#4269d0` (D-33 blue, established in `src/components/scale-compare.ts` and the prior 260512-fg3 partials chart). The bracket + annotation in the re-anchored chart use `#c45656` (a desaturated red consistent with the project's existing accent character — reads as a "warning" hue against the white background without clashing with the blue line). The same `#c45656` is used for the drift chart's annotation text so the "comma" theme is visually unified across both charts.
- **Additive only:** The pre-edit file's chord-root constants (`I`, `vi`, `ii`, `V`, `Iflat`), `MAJOR`/`MINOR` shapes, `triad`, `driftingCycle`, `reanchoredCycle`, `playCycle`, `cycleButton`, `playDrifting`, `playReanchored`, the synth cell, and every existing prose section ("The chord-root math", "Audition" preamble, "Why this matters", "Octave-reduction footnote", "See also") are byte-equivalent to the pre-edit file. 189 insertions, 0 deletions.

## Verification

- **`npm run lint:types`** — exits 0 (confirmed against parent repo with deps installed by copying the worktree's edited file to the parent's `src/pages/comma-pump.md`, running `npm run lint:types` — clean exit 0 — then restoring the parent file via `git checkout --`; same pattern used by quick task 260512-fg3). The worktree itself has no `node_modules`, so direct `tsc` inside the worktree would report pre-existing module-resolution errors against `npm:` specifiers — those are pre-existing and unrelated to this change.
- **`npx prettier --check src/pages/comma-pump.md`** — passes (confirmed via parent repo with the worktree file copied in).
- **All grep gates** from the plan `<verify>` block pass:
  - `import * as Plot from "npm:@observablehq/plot"` present
  - `## Visualizing the drift` present
  - `const driftChart = (() => {` present
  - `const reanchoredChart = (() => {` present
  - `curve: "step-after"` present
  - `cents: Iflat.cents` present
  - `const COMMA_FLAT = new Interval("80/81")` present
  - `const drift3Cycle = (() => {` present
  - `shift = shift.mul(COMMA_FLAT)` present
  - `const playDrift3 = cycleButton("Play 3 drift cycles", drift3Cycle)` present
  - `${playDrift3}` present
  - `## Further reading` present
  - `en.xen.wiki/w/Comma_pump` present
  - `Suite for Microtonal Piano` present
  - `const Iflat = new Interval("80/81")` preserved (existing constants intact)
  - `const driftingCycle = [` preserved
  - `const reanchoredCycle = [` preserved
  - `const playCycle = (cycle, baseHz = 220, chordDur = 1.1)` preserved
  - **`! grep -q 'y2: -Iflat.cents'`** — bracket terminus uses `Iflat.cents` (negative), NOT `-Iflat.cents` (positive); bracket points DOWN as required
- **Vitest** — no spec exists for `src/pages/*.md` cells (Framework runtime layer is intentionally not tested per Phase 1 D-07 — library code lives in `src/lib/`). The kernel `Interval.mul` used by `drift3Cycle` already has unit-test coverage; this page consumes it via the established public API.

## Manual Spot-Check (deferred to user — page is built statically)

After `npm run dev` and navigating to `/pages/comma-pump`:

- "## Visualizing the drift" section appears between "## The chord-root math" and "## Audition".
- Drift chart (~640×280): x-axis labels I, vi, ii, V, I'; y-axis "Cents from opening tonic" with domain [-28, 6]; blue step-after line flat at 0 through chords 1–4, dropping to ≈−21.5 at chord 5; annotation "−21.5¢ (one syntonic comma)" anchored near the final point in red.
- Re-anchored chart (~640×280): identical axes; blue step-after line flat at 0 across all 5 chords; red bracket spans x=4 to x=5 pointing DOWN from y=0 to y≈−21.5 with "comma absorbed (21.5¢)" label below.
- Both charts share the y-axis domain so the absorbed-comma bracket and the drift drop are visually commensurable.
- Audition section now has three buttons: ▶ Play drifting cycle, ▶ Play re-anchored cycle, ▶ Play 3 drift cycles.
- Clicking "▶ Play 3 drift cycles" schedules 15 chords over ~16.5s; by the final chord the tonic sits noticeably below the opening (~65¢ flat); the cumulative drift is audible.
- "Further reading" section appears at the very bottom with the working xen wiki link and the Ben Johnston paragraph.

## Deviations

None. Plan executed exactly as written.

## Self-Check: PASSED

- Modified file: `src/pages/comma-pump.md` — committed at `0959878` on `worktree-agent-aa458f91c21913892`
- Worktree HEAD on per-agent branch (`worktree-agent-aa458f91c21913892`); base reset to expected `82891cf` before edit
- All 19 grep gates pass (18 positive + 1 negative `y2: -Iflat.cents` absence)
- `npm run lint:types` exits 0 (against parent repo with deps installed; pattern matches prior 260512-fg3 task)
- `npx prettier --check` passes
- 189 insertions, 0 deletions — purely additive; no existing constants/cycles/helpers/prose touched
- SUMMARY.md left unstaged in worktree per dispatch contract (orchestrator picks it up via worktree-summary-rescue path during merge)
