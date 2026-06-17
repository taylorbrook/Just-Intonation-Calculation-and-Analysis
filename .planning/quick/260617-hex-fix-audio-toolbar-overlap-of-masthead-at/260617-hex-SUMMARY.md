---
quick_id: 260617-hex
title: Fix audio-toolbar masthead overlap at narrow widths (bottom app-bar ≤640px)
date: 2026-06-17
status: complete
commit: c2029f4
---

# Quick Task 260617-hex — Summary

## What shipped — `src/components/audio-toolbar.ts`

At `≤640px`, the global audio toolbar reflows from a floating top-right cluster
into a **full-width bottom app-bar**, clear of the masthead.

- Wrapped the "Waveform" / "Volume" label texts in `<span class="ts-tb-label-text">`
  (mount JS, `textContent` — XSS discipline preserved) so CSS can hide them.
- New `@media (max-width: 640px)` block: toolbar → `top:auto; bottom:0; left:0;
  right:0; justify-content:flex-end; border-radius:0; border-width:1px 0 0 0`
  (square, top-bordered bottom bar, controls right-aligned); `.ts-tb-label-text`
  + `.ts-vol-readout` hidden; slider narrowed to 96px; `body { padding-bottom:
  46px }` keeps the footer / page-nav scrollable above the bar.

Desktop (>640px) is untouched — every new rule lives inside the media query.

## Why bottom, not a top bar

Initial attempt was a full-width **top** app-bar + `body { padding-top }`. CDP
diagnosis showed the Framework masthead (`#observablehq-header`) is itself
**`position: fixed; top: 0`** (not sticky) — so body padding can't move it, and
any top bar stacks directly on the fixed header (both pinned at top:0). Docking
to the bottom sidesteps the collision entirely and is a natural mobile pattern
for a global audio control. `src/styles.css` needed no change (an interim
`.stop-all-audio` nudge was reverted — bottom bar introduces no top conflict).

## Verification (headless Chrome via CDP)

Measured `#observablehq-header` vs the toolbar at three narrow widths, before vs
after:

| width | before (overlap) | after |
|-------|------------------|-------|
| 600px | toolbar l=127→r=588, buries title+nav | `headerCollides: false`, bar at bottom, fits width |
| 414px | toolbar l=−59→r=402, overflows + buries | `headerCollides: false`, fits width |
| 375px | toolbar l=−98→r=363, overflows + buries | `headerCollides: false`, fits width |

- Desktop 1024px: toolbar still `position:fixed; top:12; right:12; width:461`,
  labels visible — **no regression**.
- iPhone (390×844) screenshot: masthead fully visible/unobstructed at top;
  compact bottom bar ([Sine ▾] · slider · ◐) at the bottom.
- `tsc --noEmit` clean · `npm run build` clean (140 links) · `prettier --check`
  clean · `vitest` **752/752**.

## Commits

- `c2029f4` — fix(quick-260617-hex): dock audio toolbar to bottom app-bar at ≤640px
- docs commit (this summary + PLAN + STATE) follows.
