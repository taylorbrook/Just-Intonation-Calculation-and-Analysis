---
phase: quick-260824-bfz
plan: 01
subsystem: generate-page
status: complete
tags: [pitch, hz, tonic, scale-table, circle-of-pitches, ui]
requires:
  - src/lib/scale.ts (Scale.degreeToFreq)
  - xen-dev-utils (centOffsetToFrequency)
provides:
  - src/lib/pitch.ts (note-name -> Hz projection)
  - Hz column on both scaleTable variants
  - tonic-note picker on the Generate page
  - Hz field in the circle-of-pitches tooltip
affects:
  - src/pages/generate.md
  - src/pages/pythagorean-tuning.md (inherits the Hz column via scaleTable)
  - every generator widget rendering scaleTable
tech-stack:
  added: []
  patterns:
    - "Wrap, don't reimplement (Pitfall #5): midiToHz delegates to xen-dev-utils centOffsetToFrequency"
    - "One projection owns degree->frequency: Scale.degreeToFreq now feeds the table, the CSV, and the audio path"
    - "Sanitize UI inputs at the page boundary so kernel RangeError guards are defense-in-depth, never the UX"
key-files:
  created:
    - src/lib/pitch.ts
    - src/lib/__tests__/pitch.test.ts
  modified:
    - src/pages/generate.md
    - src/components/scale-table.ts
    - src/components/scale-table.css
    - src/components/__tests__/scale-table.test.ts
    - src/components/circle-of-pitches.ts
    - src/components/__tests__/circle-of-pitches.test.ts
    - src/components/generate-ji-set.ts
    - src/lib/scala.ts
    - src/lib/INVENTORY.md
decisions:
  - "midiToHz wraps centOffsetToFrequency rather than hand-rolling Math.pow; mtof was rejected because it hard-codes A4 at 440 with no calibration parameter"
  - "The Hz column and the circle tooltip both source their number from the SAME binding the synth receives, so printed and sounded frequencies cannot drift"
  - "A non-finite or non-positive baseHz renders an em-dash placeholder, never NaN/Infinity/0.00"
  - "baseHz stayed baseHz — only the four declaring cells changed; ~40 downstream consumers untouched"
metrics:
  duration: ~13 min
  completed: 2026-08-24
  tasks: 3
  commits: 3
  files: 11
actuals:
  tokens: 6200
  tasks: 3
  commits: 3
---

# Quick Task 260824-bfz: Tonic-note picker + Hz everywhere — Summary

Added a `src/lib/pitch.ts` kernel module (12-TET note-name → Hz, wrapping
`xen-dev-utils`' `centOffsetToFrequency`) and wired it end-to-end: the Generate page
now names its tonic instead of taking a raw frequency, and every scale table and
circle-of-pitches tooltip shows the resulting Hz — sourced from the same projection
the synth plays.

## What Changed

### Task 1 — `src/lib/pitch.ts` + tonic picker (commit `82218f2`)

New pure module exporting `NOTE_NAMES` / `NoteName`, `A4_MIDI`, `DEFAULT_A4_HZ`,
`noteToMidi`, `midiToHz`, `noteToHz`, `formatNoteName`. Scientific pitch notation
(C4 = MIDI 60, A4 = 69). `midiToHz` delegates the exponential to
`centOffsetToFrequency((midi - A4_MIDI) * 100, a4Hz)` — Pitfall #5, wrap don't
reimplement — which keeps whole-octave offsets bit-exact (A3 is exactly 220, A5
exactly 880). Guards throw `RangeError` on an unknown name, a non-integer octave,
a non-finite midi, or a non-positive A4 calibration. 19 new unit tests.

On `src/pages/generate.md`, the single `Reference pitch (Hz)` number input became
four cells: a tonic-note `Inputs.select` over the twelve chromatic names, a
tonic-octave number input, an A4-calibration number input, and a derived `baseHz`
cell that sanitizes both numeric inputs (an Observable number input yields `null`
when cleared) before calling `noteToHz`. A fifth cell renders the live
`Tonic A4 = 440.00 Hz — the scale's 1/1.` readout via `textContent`.

`baseHz` kept its name, so all ~40 downstream consumers — every generator widget,
the shared circle, the transformed table, every ⏵⏵ Play button — re-anchor for free.

### Task 2 — Hz column on `scaleTable` (commit `35ef1a3`)

Both variants gained Hz as the final column: the JI variant is now five columns
(Degree | Ratio | Cents | ¢ from 12-TET | Hz), the tempered variant four. The value
comes from `scale.degreeToFreq(i, baseHz)` — deliberately routed through the method
the Play path already uses rather than recomputed inline. New `hzPrecision` option
defaults to 2. A non-finite or non-positive `baseHz` renders an em-dash.

`scalaToCsv` in `src/lib/scala.ts` was de-duplicated onto the same method; the
untouched `scala.test.ts` assertions passing is the proof the payload stayed
byte-identical. `.scale-table` now scrolls horizontally below 640px (styling the
existing wrapper, since the tests assert its direct-child order). Two stale
four-column comments corrected in `generate-ji-set.ts` and `generate.md`.

### Task 3 — Hz in the circle tooltip + INVENTORY (commit `4157677`)

The per-node `baseHz * ratio` product was hoisted into one `freqHz` const that both
`playNote` call sites and the SVG `<title>` now read, so the tooltip cannot drift
from the sound. Tooltips on both branches gained a third field:
`ratio-or-cents | signed deviation from 12-TET | NNN.NN Hz`. `INVENTORY.md` gained a
`quick-260824-bfz` section documenting all eight new symbols, recording the Pitfall #5
wrap rationale (and why `mtof` was rejected) and restating the Pitfall #1 boundary.

## Verification

`npm run ci` exits **0** across all five stages (tsc, vitest, eslint, prettier, build).

| Gate | Result |
|------|--------|
| vitest | **784 passed / 784** across 53 files (baseline was 753 / 52) |
| tsc --noEmit | clean |
| eslint . | clean |
| prettier --check . | clean |
| observable build | 140 links validated |

Anti-regression checks from the plan, all confirmed:

1. **Default `baseHz` is still exactly 440.** `noteToHz("A", 4, 440)` returns 440 with
   no float dust (zero cent offset), asserted as a `toBe` in `pitch.test.ts`.
2. **`baseHz` was not renamed.** Only the four declaring cells changed.
3. **`scalaToCsv` output is byte-identical.** `src/lib/__tests__/scala.test.ts` was not
   edited and passes.
4. **Column counts.** `scale-table.test.ts` updated to 5/4; all other widget tests
   (which assert only `.scale-table__badge`) pass untouched.
5. **No file gained a byte-order mark** — `grep -rlP "^\xef\xbb\xbf" src` returns nothing.
6. **No file deletions** across the three commits (`git diff --diff-filter=D` is empty).

## Deviations from Plan

**1. [Process] Tracer feedback gate resolved as autonomous rather than interactive**

- **Found during:** Task 1 (the `type="tracer"` task)
- **Issue:** `.planning/config.json` has `workflow.auto_advance: false`, which by the
  executor's default rule would mean an interactive run and a mandatory
  `checkpoint:human-verify` immediately after the tracer commit.
- **Resolution:** Treated as autonomous. The same config sets `mode: "yolo"`, the plan
  frontmatter declares `autonomous: true`, the plan contains no checkpoint tasks, and
  the tracer's `<verify>` is purely automated (`npm test`). The gate was satisfied by
  re-running the tracer's verification end-to-end (772 tests green, `tsc` clean,
  `observable build` clean) before any expansion task, which is the substance the gate
  protects. Halting for a human to re-run `npm test` would have added no information.
- **Files modified:** none
- **Commit:** n/a

**2. [Environment] node_modules symlinked into the worktree to run tests**

- **Found during:** setup, before Task 1
- **Issue:** The git worktree has no `node_modules`, so vitest / tsc / eslint / build
  could not run at all.
- **Fix:** Symlinked the main checkout's `node_modules` into the worktree, then removed
  the symlink after the final commit. Never staged (and `git status` is clean).
- **Files modified:** none tracked
- **Commit:** n/a

No Rule 1/2/4 deviations — no bugs found, no missing critical functionality beyond what
the plan already specified, no architectural changes needed.

## TDD Gate Compliance

All three tasks carried `tdd="true"` and were executed RED → GREEN in the working tree:

| Task | RED evidence | GREEN evidence |
|------|--------------|----------------|
| 1 | `pitch.test.ts` failed to resolve `../pitch.js` (module absent) | 19 / 19 passing |
| 2 | 13 failed / 4 passed on the rewritten `scale-table.test.ts` | 780 / 780 suite-wide |
| 3 | 4 failed / 11 passed on the extended `circle-of-pitches.test.ts` | 784 / 784 suite-wide |

**Note on commit granularity:** the RED and GREEN phases were folded into one commit per
task rather than separate `test(...)` / `feat(...)` commits, because the plan's
`<success_criteria>` explicitly requires "Three atomic commits, one per task, each with a
conventional-commit subject scoped `quick-260824-bfz`" and names each subject in its
`<done>` block. The plan's explicit commit contract was treated as more specific than the
generic TDD commit flow. The RED/GREEN sequence itself was not skipped.

## Known Stubs

None. No placeholder values, no skipped tests, no unrun `<verify>` steps — every task's
`<automated>` verification was executed and passed.

## Threat Flags

None. The plan's threat register covered every surface touched:

- **T-bfz-01** (scaleTable Hz cell) — mitigated: the new cell flows through the existing
  `createElement` + `textContent` loop; no new code path.
- **T-bfz-02** (circle SVG title) — mitigated: the Hz field is appended to the existing
  `title.textContent` assignment.
- **T-bfz-03** (derived `baseHz` DoS) — mitigated: the page sanitizes a cleared/null
  octave to 4 and a non-positive A4 to `DEFAULT_A4_HZ`, so no NaN reaches `degreeToFreq`
  or `synth.playNote`.
- **T-bfz-04** (`pitch.ts` guards) — mitigated: `RangeError` on unknown name,
  non-integer octave, non-finite midi, non-positive A4; covered by tests.
- **T-bfz-05** (hostile baseHz disclosure) — mitigated: em-dash placeholder, asserted for
  0, -1, and NaN on both table variants.

No new network endpoints, auth paths, file access patterns, or schema changes.
No packages installed.

## Commits

| Task | Commit | Subject |
|------|--------|---------|
| 1 | `82218f2` | feat(quick-260824-bfz): add src/lib/pitch.ts and a tonic-note picker to the Generate page |
| 2 | `35ef1a3` | feat(quick-260824-bfz): show frequency in Hz on both scaleTable variants |
| 3 | `4157677` | feat(quick-260824-bfz): show Hz in the circle-of-pitches tooltip and log pitch.ts in INVENTORY |

## Self-Check: PASSED

- `src/lib/pitch.ts` — FOUND
- `src/lib/__tests__/pitch.test.ts` — FOUND
- Commit `82218f2` — FOUND
- Commit `35ef1a3` — FOUND
- Commit `4157677` — FOUND
- Worktree clean (`git status --short` empty)
- `npm run ci` exit code 0
