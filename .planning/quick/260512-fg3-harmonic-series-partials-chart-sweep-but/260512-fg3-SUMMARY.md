---
phase: quick-260512-fg3
plan: 01
subsystem: theory-pages
tags: [observable-framework, plot, audio, harmonic-series, theory-page, additive]
requires:
  - src/lib/interval.ts (Interval.cents, Interval.monzo, Interval.fraction)
  - src/audio/synth.ts (SynthHandle.playArpeggio)
  - "@observablehq/plot (Plot.plot, Plot.ruleY, Plot.dot)"
provides:
  - harmonic-series page: vertical Plot chart of partials 1..16 + Sweep arpeggiator + Further reading section
affects:
  - src/pages/harmonic-series.md
tech-stack:
  added: []
  patterns:
    - "Plot chart at display boundary (iv.cents projected ONCE per partial; Pitfall #1)"
    - "BigInt-Fraction → Number coercion at audio boundary (baseHz * Number(iv.fraction.valueOf()))"
    - "Cell-owned synth pattern (Pattern 4 / Pitfall #2 — reuses page's existing synth; no new AudioContext)"
    - "Largest-prime-in-monzo classification (empty monzo → 'other'; xen-dev-utils monzo prime-axis order [2,3,5,7,11,13])"
key-files:
  created: []
  modified:
    - src/pages/harmonic-series.md
decisions:
  - "7-hue color-blind-aware palette anchored on existing D-33 blue/orange (used in scale-compare.ts), extended with green/purple/magenta/teal + neutral gray for 'other'"
  - "Chart uses Plot.ruleY (stem from x1=0 to x2=cents) + Plot.dot (head) with y.reverse=true so partial 1 sits at top"
  - "Sweep button uses synth.playArpeggio(freqs, 0.35) explicitly — overrides default 0.45s/step (D-18) per plan description"
  - "primeCategory(monzo) walks the monzo and picks the highest non-zero index → PRIME_AXIS[i]; partial 1's empty monzo falls through to 'other'"
metrics:
  duration_min: 5
  completed_date: "2026-05-12"
---

# Quick task 260512-fg3: Harmonic-series chart + Sweep arpeggiator + Further reading

add vertical Plot chart of partials 1..16 (y reversed, x = cents-from-fundamental, color = largest prime in monzo; 7-hue color-blind-aware palette anchored on D-33 blue/orange, extended with green/purple/magenta/teal + neutral gray for "other") + single "▶ Sweep partials 1→16" button calling synth.playArpeggio(freqs, 0.35) with freqs computed via baseHz \* Number(iv.fraction.valueOf()) at the audio boundary + "Further reading" section linking to en.xen.wiki/w/Harmonic_series and kylegann.com/tuning.html; all coordinates derived ONCE at chart-build time from iv.cents + iv.monzo (Pitfall #1 display-boundary projection); reuses page's existing cell-owned synth (Pattern 4 / Pitfall #2 — no new AudioContext); additive only — partials array, partialsTable cell, intro prose, "See also" section, synth cell, baseHz cell all byte-equivalent to pre-edit file

## Files Touched

- `src/pages/harmonic-series.md` — three additive changes:
  1. Appended `import * as Plot from "npm:@observablehq/plot";` to the existing import cell.
  2. Inserted `partialsChart` cell (Plot.plot with ruleY+dot, prime-category color encoding) + `sweepBtn` cell (single ▶ button calling `synth.playArpeggio`) BETWEEN the intro prose and the existing `partialsTable` cell, with one connective sentence so the prose reads cleanly.
  3. Appended `## Further reading` section (two bullets) as the LAST section of the page.

## Key Implementation Notes

- **Prime-category derivation from `iv.monzo`:** A small inline `primeCategory(monzo: number[])` walks the monzo, finds the highest non-zero index, and maps it through `PRIME_AXIS = [2, 3, 5, 7, 11, 13]` to a string label. Empty monzo (partial 1 = `1/1`) → `"other"`; indices ≥ 6 also fall through to `"other"`. xen-dev-utils' `toMonzo` returns the prime-axis order `[2, 3, 5, 7, 11, 13, ...]`, and for pure-integer partials `n/1` there are no negative entries, so `hi = monzo.length - 1` whenever the monzo is non-empty.
- **7-hue palette:** Anchored on the existing D-33 palette (`#4269d0` blue, `#ef8e3a` orange — used in `src/components/scale-compare.ts:409`) and extended with green `#3ca951`, purple `#9c6ade`, magenta `#d4378a`, teal `#1ca8a8`, and neutral gray `#888888` for "other". Perceptually distinct, color-blind-aware ordering.
- **Chart shape:** `Plot.ruleY({y:"n", x1:0, x2:"cents", stroke:"category"})` draws the horizontal stem from 0¢ to each partial's cents; `Plot.dot({x:"cents", y:"n", fill:"category", r:5})` places the head. `y.reverse=true` puts partial 1 at the top. `marginRight: 120` reserves room for the 7-entry legend.
- **Pitfall #1 discipline:** `iv.cents` and `iv.monzo` are accessed ONCE per partial at chart-build time inside the IIFE. The kernel never receives a cents value back as input.
- **Audio-boundary Number coercion (Pitfall #1 acknowledged):** `baseHz * Number(iv.fraction.valueOf())` is the same pattern used by `src/components/play-interval.ts:49` and `src/components/scale-compare.ts:369-370`. The Number cast happens HERE only because we feed Hz directly into Web Audio, which is `number`-only by API contract.
- **No new AudioContext (Pattern 4 / Pitfall #2):** The Sweep button references the page's existing `synth` from the top-of-page cell. `playArpeggio` is bounded internally by `MAX_ARPEGGIO_LEN = 256`; 16 partials is well within limits.
- **Additive only:** The `partials` array (lines 32-49 pre-edit), the `partialsTable` cell (the entire `const partialsTable = (() => { ... })(); display(partialsTable);` block), the synth cell, the `baseHz` cell, the intro prose, and the "## See also" section are byte-equivalent to the pre-edit file.

## Verification

- **`npm run lint:types`** — exits 0 (confirmed against parent repo with deps installed via `git checkout 17c0939 -- src/pages/harmonic-series.md && npm run lint:types`; clean exit). The worktree itself has no `node_modules` so direct tsc inside the worktree reports pre-existing module-resolution errors against `npm:sw-synth`, `npm:ji-lattice`, `npm:@observablehq/plot` — those are pre-existing and unrelated to this change.
- **`npm run lint`** — exits 0 (ESLint clean; only the pre-existing `.eslintignore` deprecation warning, unrelated).
- **`npx prettier --check src/pages/harmonic-series.md`** — passes (file uses Prettier code style).
  - Note: repo-wide `format:check` flags 4 pre-existing files in `src/components/spiral-of-fifths.ts` + its test + duplicates of those under `.claude/worktrees/agent-ac2b8bd0768dfc285/src/components/`. Those are from the prior quick task 260512-f0z and are out of scope per the executor's SCOPE BOUNDARY rule.
- **All grep gates** from the plan `<verify>` block pass:
  - `import * as Plot from "npm:@observablehq/plot"` present
  - `Plot.plot({` present
  - `reverse: true` present
  - `primeCategory` present
  - `synth.playArpeggio(freqs, 0.35)` present
  - `▶ Sweep partials 1→16` present
  - `## Further reading` present
  - `en.xen.wiki/w/Harmonic_series` present
  - `kylegann.com/tuning.html` present
  - `iv: new Interval("16/1")` preserved (partials array intact)
  - `const partialsTable = (() => {` preserved (existing table cell intact)
  - `## See also` preserved
- **Vitest** — no spec exists for `src/pages/*.md` cells (Framework runtime layer is intentionally not tested per Phase 1 D-07 — library code lives in `src/lib/`). The components this page consumes (`createSynth`, `playInterval`, `ratioPill`, `Interval`) have existing specs that are unaffected by this additive page edit.

## Manual Spot-Check (deferred to user — page is built statically)

After `npm run dev` and navigating to `/pages/harmonic-series`:
- Chart appears above the partials table with 16 rows, partial 1 at top, partial 16 at bottom; cents axis labeled, domain 0..4900.
- 7-color legend visible to the right of the chart; partials 2/4/8/16 share the blue (prime 2), partials 3/9 share orange (prime 3), partial 1 shows as gray ("other").
- Cents values match the table: partial 2 at 1200¢, partial 5 ≈ 2786¢, partial 7 ≈ 3369¢, partial 11 ≈ 4151¢, partial 13 ≈ 4441¢, partial 16 at 4800¢.
- "▶ Sweep partials 1→16" button appears below the chart; click plays 16-note arpeggio from low A2 up through 4 octaves, ~350 ms per step (~5.6 s total).
- "Further reading" section appears at the very bottom of the page with two working external links.

## Deviations

None. Plan executed exactly as written.

## Notes

- The executor's per-task commit landed on the per-agent worktree branch `worktree-agent-ac2b8bd0768dfc285` at hash `17c0939` as required by the worktree contract. An earlier accidental commit on the parent repo's `main` branch (caused by the Bash tool's CWD reverting to the parent root between invocations) was reset away (`git reset --hard 01de75c`) before the patch was replayed in the worktree directory and committed there. The current parent `main` is back at `01de75c` (the pre-dispatch plan commit) and is clean.

## Self-Check: PASSED

- Created file: `.planning/quick/260512-fg3-harmonic-series-partials-chart-sweep-but/260512-fg3-SUMMARY.md` — present
- Modified file: `src/pages/harmonic-series.md` — committed at `17c0939`
- Commit hash `17c0939` present in `worktree-agent-ac2b8bd0768dfc285` log
- Parent `main` reset to `01de75c` (clean; no stray commit)
