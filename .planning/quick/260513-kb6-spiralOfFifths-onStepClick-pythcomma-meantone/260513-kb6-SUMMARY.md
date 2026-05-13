---
quick_id: 260513-kb6
slug: spiralOfFifths-onStepClick-pythcomma-meantone
date: 2026-05-13
status: complete
commit: 946248a
---

# Quick Task 260513-kb6 — SUMMARY

CMD-3 of the 260513-foy six-command handoff. Wired the `onStepClick` prop
(added in 260513-jir / `b469080`) on both `spiralOfFifths` consumers in the
codebase: `src/pages/pythagorean-comma.md` and `src/pages/meantone.md`.
Each spiral node is now click-to-audition.

## What changed

Two single-call-site additions on Markdown pages — no component, CSS, test,
or import changes. The `.is-clickable` cursor toggle from CMD-1 lights up
automatically because both call sites now pass `onStepClick`.

### `src/pages/pythagorean-comma.md` (pure 3/2 branch)

```md
${spiralOfFifths(12, {
  highlightWolf: true,
  onStepClick: (step) => {
    if (!step.ratio) return; // pure branch always provides a ratio; defensive
    const baseHz = 440;
    synth.playNotes(
      [baseHz, baseHz * Number(step.ratio.fraction.valueOf())],
      1.5,
    );
  },
})}
```

`step.ratio` is a non-null octave-reduced `Interval` in this branch (the
component's chain runs `acc = acc.mul(3/2).octaveReduce()`), so the handler
is the same one-liner `playInterval` writes to the synth. The
`if (!step.ratio) return` guard keeps the closure type-safe under
`SpiralStep.ratio: Interval | null`.

### `src/pages/meantone.md` (1/4-comma tempered branch)

```md
${spiralOfFifths(12, {
  temperedFifthCents: quarter.fifth,
  highlightWolf: true,
  onStepClick: (step) => {
    const baseHz = 440;
    const reducedCents = ((step.cumulativeCents % 1200) + 1200) % 1200;
    const ratio = centsToRatio(reducedCents);
    synth.playNotes([baseHz, baseHz * ratio], 1.5);
  },
})}
```

`step.ratio` is `null` here (the meantone fifth is irrational).
`step.cumulativeCents` accumulates without octave-reduction — at k=12 it
hits ~8359¢ (12 × 696.578¢) — so the handler octave-reduces mod 1200 before
sending to the synth. Two reasons:

1. **Audible range.** A naïve dyad at 440 × 2^(8359/1200) ≈ 122 kHz is
   inaudible and trips synth's defense-in-depth Hz clamping (T-02-17).
2. **Match the visual reading.** The spiral itself renders
   `cents-from-12-TET` of the **octave-reduced** cumulative cents (per
   `spiral-of-fifths.ts` line 117). Audition matching the visible label
   keeps the click affordance consistent with what the eye sees.

`centsToRatio` was already imported at line 8 of `meantone.md` — the
existing `playTempered` factory at lines 117–129 uses the same helper for
the irrational 1/4-comma major-third audition. Same audio-boundary
discipline.

## Why both pages, why this shape

- **D-07 dyad / D-08 baseHz=440 / D-18 1.5s** — the audition matches every
  other interval-against-1/1 audition on the site (`playInterval`,
  `playTempered`, `renderDiamondSVG` synth path from 260513-jqi).
- **D-08 three-layer discipline preserved.** The viz component stays
  viz-only — no synth import in `spiral-of-fifths.ts`. Both pages own
  their own `createSynth()` cell (Pitfall #2 — exactly one AudioContext
  per page) and the click closures capture `synth` from page scope.
- **`pythagorean-tuning.md` deliberately excluded.** The 260513-foy audit
  confirmed it uses `scaleTable` (per-row play buttons baked in), not
  `spiralOfFifths` — wiring would have no effect.

## Verification

| Check                                                | Result    |
|------------------------------------------------------|-----------|
| `npx tsc --noEmit`                                   | clean     |
| `npx vitest run` (24 files, full suite)              | 312/312 ✓ |
| `npx vitest run …/spiral-of-fifths.test.ts`          | 23/23 ✓ (component untouched) |
| `npm run build` (Observable build, link validation)  | 111 links validated, 18 pages built |
| Page bundle delta                                    | both pages identical to baseline (the inline arrow is ~150 bytes inside an existing JS expression — not a new import) |

## Acceptance — PLAN.md checklist

- [x] `tsc --noEmit` clean (baseline preserved).
- [x] `vitest run` 312/312 (no test changes).
- [x] `npm run build` clean; both pages render.
- [x] `pythagorean-comma.md` spiral nodes audition `[440, 440 × octave-reduced 3/2 chain]` on click.
- [x] `meantone.md` spiral nodes audition `[440, 440 × centsToRatio(reducedCumulativeCents)]` on click.
- [x] No new imports; no component changes; no CSS changes.

## Discoveries / minor surprises

- None. The `centsToRatio` helper was already imported on `meantone.md`
  (used by the existing `playTempered` factory), so the tempered-branch
  audition could borrow it without an additional import.
- `step.cumulativeCents` is intentionally **not** octave-reduced in
  `SpiralStep` — that's how the closure-error visualization works (the
  k=12 step needs the un-reduced cumulative to draw the wolf chord). Page
  handlers reduce at the audio boundary instead.

## Handoff status

CMD-3 of the 260513-foy six-command handoff is now done. Remaining:

- **CMD-4** — tenney-height ratio-pills audition row (15 ratios beside the
  scatter chart).
- **CMD-5** — well-temperament per-row play buttons via the `playTempered()`
  factory pattern from `meantone.md` (6 schemes × 3 interval columns = 18
  buttons).
- **CMD-6** — Plot scatter ratio-pills audition rows on
  `edo-approximation` / `schisma` / `septimal-comma` / `syntonic-comma`
  (could split per-page if it overruns the quick-task envelope).

CMD-4, CMD-5, CMD-6 are independent — runnable in any order in fresh
`/gsd-quick` context windows.
