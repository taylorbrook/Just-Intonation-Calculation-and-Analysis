---
quick_id: 260617-hex
title: Fix audio-toolbar masthead overlap at narrow widths (top app-bar ≤640px)
date: 2026-06-17
mode: quick
status: ready
---

# Quick Task 260617-hex — Audio-toolbar masthead overlap fix

## Problem (measured via CDP at multiple widths)

The global audio toolbar (`audioToolbarHeadPayload()` in
`src/components/audio-toolbar.ts`) is `position: fixed; top: 12px; right: 12px`
and a **constant 461px wide** (Waveform label+select · Volume label+slider ·
`vol 0.20` readout · theme button). The Framework masthead
(`#observablehq-header`, 60px tall) carries the title + nav and spans the full
content width, so the right-anchored toolbar collides with it at narrow widths:

| viewport | toolbar rect | result |
|----------|--------------|--------|
| 600px | l=127 → r=588 | overlaps title (26px) + all nav |
| 414px | l=−59 → r=402 | overflows left edge, buries masthead |
| 375px | l=−98 → r=363 | overflows left edge, buries masthead |

Shrinking alone can't clear a full-width header, so the toolbar is reflowed.

## Fix

At `≤640px`, turn the floating cluster into a **full-width top app-bar** and push
the page below it:

- **`src/components/audio-toolbar.ts`** (inline `<style>` + mount JS):
  - Wrap the "Waveform" / "Volume" label texts in
    `<span class="ts-tb-label-text">` (mount JS) so CSS can hide them.
  - Add `@media (max-width: 640px)`: toolbar → `top:0; left:0; right:0;
    justify-content:flex-end; border-radius:0; border-width:0 0 1px 0` (square
    bottom-bordered strip); hide `.ts-tb-label-text` + `.ts-vol-readout`; narrow
    the slider to ~96px → compact controls fit one row even at 375px.
  - `body { padding-top: 46px }` at the same breakpoint so the masthead + content
    start below the bar (fixed bar ignores body padding; content shifts down).
- **`src/styles.css`** (extend the existing `≤640px` block from 260616-mla):
  - Nudge `.stop-all-audio` to `top: 58px` so the playback-stop button (also
    fixed top-right) sits below the new bar instead of on it.

## Tasks

1. **audio-toolbar.ts** — label spans + `@media` app-bar block + body padding.
   - verify: `tsc`, `prettier --check`, `npm run build`; CDP re-measure shows
     `headerOverlap.collides === false` at 600/414/375; screenshot reads clean.
2. **styles.css** — `.stop-all-audio { top: 58px }` inside the existing ≤640px block.
   - verify: prettier clean; stop button clears the bar.

## Guardrails

- Desktop (>640px) layout byte-unchanged — all new rules live inside the media query.
- No functionality removed: every control (waveform, volume, theme) stays; only
  redundant text chrome is hidden on small screens.
- Theme tokens / colours unchanged; XSS-safe `createElement`+`textContent` mount
  discipline preserved (label spans use `textContent`).
