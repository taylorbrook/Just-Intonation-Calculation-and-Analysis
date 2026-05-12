---
quick_id: 260512-fxk
description: Embed spiral-of-fifths component + Plot drift chart + Further reading on pythagorean-comma page
date: 2026-05-12
status: complete
---

# Quick Task 260512-fxk — Summary

## What changed

Wired the `spiralOfFifths` component (built in quick-260512-f0z, until now
unconsumed by any page) into `src/pages/pythagorean-comma.md` and added a
Plot drift chart that quantifies the same closure gap that the spiral
visualizes. Also added a "Further reading" section linking the Xenharmonic
Wiki entry on the comma.

## Files

| File | Change |
|------|--------|
| `src/styles.css` | +1 line: `@import "./components/spiral-of-fifths.css";` (after `scale-compare.css`). The component CSS was an opt-in stylesheet; without this line the SVG renders unstyled (no theme colors, no dashed wolf chord). |
| `src/pages/pythagorean-comma.md` | +2 imports (`spiralOfFifths`, `Plot`); +1 new section `## The closure gap, visualized` containing the spiral widget + the drift-chart ```ts cell; +1 new section `## Further reading` linking en.xen.wiki/w/Pythagorean_comma. |

## Design notes

- **BigInt source of truth.** The drift-chart data is built by
  `acc = acc.mul(new Interval("3/2"))` in a 12-iteration loop. `.cents` is
  read ONCE per step, immediately differenced against `k * 700` to produce
  the y-value — the display projection happens exactly at the data-row
  construction boundary (Pitfall #1). The y-value at k=12 is
  `(3/2)^12.cents - 8400 ≈ 8423.46 - 8400 = +23.46¢`, matching the
  Pythagorean-comma value asserted in the page's prose.
- **Spiral configuration.** `spiralOfFifths(12, { highlightWolf: true })`
  produces 13 nodes (k=0..12, inclusive) and the dashed red chord from k=12
  back to k=0. The component's `R_MAX` guard keeps the spiral inside the
  half-viewBox at n=12 by auto-shrinking `dr` — no overflow.
- **Chart style.** Matches the existing `comma-pump.md` Plot conventions:
  blue line (`#4269d0`) + dot marks, ruleY zero baseline (dashed `#888`),
  monospace cents tick formatter with `+` sign, red annotation text
  (`#c45656`) for the final-step callout. Y-domain `[0, 26]` brackets the
  monotonic ramp 0¢ → 23.46¢ with a touch of headroom for the annotation.
- **Existing math cell untouched.** The page already builds
  `twelveFifths = (3/2)^12` for the audition section; that chain is left
  alone, and the chart builds its own independent accumulator so the prose
  paragraph and the chart code stay decoupled.
- **No component changes.** `src/components/spiral-of-fifths.ts` is
  unchanged; the 18/18 happy-dom vitest spec still passes.

## Verification

- `npx tsc --noEmit` → clean (no new errors).
- `npx vitest run src/components/__tests__/spiral-of-fifths.test.ts` → 18/18 pass.
- `npx observable build` → all 17 pages render; `/pages/pythagorean-comma`
  bundle grew from ~400kB to 920kB, matching `comma-pump`'s footprint after
  Plot is pulled in.
- 79 internal links validated.
