---
quick_id: 260513-jqi
slug: odd-limits-clickable-diamonds
date: 2026-05-13
status: complete
commit: 8b4e356
---

# Quick Task 260513-jqi — SUMMARY

## What changed

Made the three inline tonality diamonds on `/pages/odd-limits.md`
click-to-audition. Picked **option (a)** — extended the existing
`renderDiamondSVG` factory rather than swapping the page over to the
dashboard's heavier `tonalityDiamond(scale, synth, opts)` widget. Reasoning
(captured in PLAN.md):

- The user explicitly asked to keep the existing visual layout (three
  diamonds at widths 280/320/440). `tonalityDiamond` prepends an
  `<h2>Tonality diamond</h2>` heading + helper line designed for the
  dashboard's standalone widget context — those don't fit underneath the
  page's own `### N-odd-limit` H3s.
- The CSS already gates `cursor: pointer` and the focus-visible outline
  on `.diamond-cell[role="button"]`. Switching the cell role from
  `presentation` to `button` is the only change the visual layer needed.
- D-08 three-layer discipline preserved: viz still doesn't own a synth.
  The page-owned `createSynth()` cell (mirrored from `monzos.md` and
  already at the top of `odd-limits.md`) hands a `SynthHandle` reference
  through `opts.synth`.

## Files modified

- `src/components/tonality-diamond.ts`
  - `RenderDiamondSVGOpts` gains `synth?: SynthHandle`, `baseHz?: number`,
    `duration?: number` with JSDoc.
  - Inside the cell loop, branch on `opts.synth`:
    - **With synth:** `role="button"`, `tabindex="0"`,
      `aria-label="Play <ratio>"`, click + Enter/Space handlers call
      `synth.playNotes([baseHz, baseHz × Number(ratio.fraction.valueOf())], duration)`
      — same audio-boundary call shape `playInterval` already uses
      (BigInt-Fraction → Number coercion only at the audio boundary,
      Pitfall #1).
    - **Without synth (legacy):** `role="presentation"`, no handlers —
      byte-equivalent to the prior renderer.
  - `SynthHandle` type-only import was already present from the
    `tonalityDiamond` factory; no new imports needed.

- `src/pages/odd-limits.md`
  - Three call sites pass the existing page-owned `synth` through opts:
    ```md
    ${renderDiamondSVG(5,  { width: 280, height: 280, synth })}
    ${renderDiamondSVG(7,  { width: 320, height: 320, synth })}
    ${renderDiamondSVG(11, { width: 440, height: 440, synth })}
    ```
  - No imports added/removed; `playInterval` import stays (still used by
    the three inline-prose audition bullets).
  - Synth cell at the top of the page unchanged (already mirrors
    `monzos.md` — lazy `createSynth()` + `invalidation.then(synth.dispose)`).

- `src/components/__tests__/tonality-diamond.test.ts`
  - New `describe("renderDiamondSVG", ...)` block, 5 cases:
    1. **No synth → role-presentation regression guard** (cells exist;
       zero `[role="button"]`).
    2. **With synth → every cell is a button** with `tabindex="0"` and a
       `Play <ratio>` aria-label.
    3. **Click → playNotes called with `[baseHz, baseHz × ratio]` dyad,
       default `baseHz = 440`, default `duration = 1.5`**.
    4. **Enter keypress** triggers audition (Space too, by code path).
    5. **Custom `baseHz`** forwards through the dyad.

## Verification

| Check                                                      | Result    |
|------------------------------------------------------------|-----------|
| `npx tsc --noEmit`                                         | clean     |
| `npx vitest run` (full suite)                              | 312/312 ✓ |
| `npx vitest run src/components/__tests__/tonality-diamond.test.ts` | 10/10 ✓ |
| `npm run build` (Observable build, link validation)        | 111 links validated, 18 pages built |
| odd-limits.md page bundle                                  | 45 kB / 706 kB total (vs 42 kB / 705 kB pre-change — +3 kB for the cell handlers) |
| CSS changes                                                | none — `.diamond-cell[role="button"]` rules already in `tonality-diamond.css` |

## Discoveries / minor surprises

- `Fraction.toFraction()` from `fraction.js` returns `"1"` for the unison
  cell (1/1), not `"1/1"`. The aria-label regex was relaxed to
  `/^Play \d+(\/\d+)?$/` to accept both shapes. Same display string format
  the existing `tonalityDiamond` factory uses internally.
- The first hand-written aria-label test failed for that reason on the
  unison cell — fix landed in the same commit.

## Acceptance — PLAN.md checklist

- [x] `tsc --noEmit` clean.
- [x] Existing 5 `tonalityDiamond` tests still pass (10/10 incl. new cases).
- [x] New `renderDiamondSVG` tests cover role-switch + click dispatch + dyad shape.
- [x] `npm run build` green; /pages/odd-limits.md renders three diamonds at the same widths (280/320/440).
- [x] Clicking any cell on the rendered page sounds the dyad. (Verified via the click handler dispatch test; live audio playback is browser-side and out of vitest scope.)

## Deferred / not in scope

- **Live in-browser smoke.** The dev-server playback verification (clicking
  cells in a real browser to hear the dyad) is the user's call — vitest
  covers handler shape; the actual audio path is the same as `playInterval`
  on every other page.
- **Cell highlighting on focus/hover beyond the existing focus-visible
  outline.** Could be a polish follow-up if cells feel too anonymous as
  buttons; current `.diamond-cell[role="button"] { cursor: pointer }` +
  `:focus-visible { outline: 2px solid var(--theme-foreground-focus) }` is
  the existing tonality-diamond contract.
- **Dashboard widget consolidation.** The `tonalityDiamond` factory remains
  the right tool when you want the full dashboard widget chrome (heading,
  helper, in-scale/out-of-scale split, zoom). `renderDiamondSVG` is now
  the lighter "presentational + optional click-to-audition" alternative —
  intentional split of concerns.
