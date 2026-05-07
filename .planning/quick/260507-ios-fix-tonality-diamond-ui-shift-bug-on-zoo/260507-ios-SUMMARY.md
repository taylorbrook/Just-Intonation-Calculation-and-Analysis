---
id: 260507-ios
description: "fix tonality-diamond zoom snap: first zoom event snaps diamond to top-left"
date: 2026-05-07
status: complete
commits:
  - 98602f5  # fix(quick-260507-ios): seed d3.zoom with centering translate
files_changed:
  - src/components/tonality-diamond.ts
tests:
  total: 269
  passed: 269
  new: 0
---

# Quick Task 260507-ios — Summary

## What changed

Fixed a UI regression in `src/components/tonality-diamond.ts` where the
first zoom or pan interaction snapped the diamond to the top-left of the
SVG, hiding the utonal half (left side of the rhombus) off the canvas.

### Root cause

`tonality-diamond.ts:182` centers the inner `<g>` with
`translate(${cx},${cy})` so iso(0,0) lands at the top of the viewBox center.
The d3.zoom handler at `:271-273` overwrites `g`'s transform on every zoom
event:

```ts
.on("zoom", (event) => { g.attr("transform", event.transform.toString()); });
```

d3.zoom's internal state starts at the identity (`translate(0,0) scale(1)`),
so the *first* user wheel/pinch/drag event replaced the centering with
identity — moving the diamond's apex to the SVG origin (top-left corner).
All subsequent pan deltas were measured from (0,0), not from the original
center, so the diamond couldn't recover until the user manually panned it
back.

### Fix (commit 98602f5)

After `svg.call(zoom)`, seed d3's internal transform state to match the
visible centering:

```ts
svg.call(zoom.transform, d3.zoomIdentity.translate(cx, cy));
```

Now d3 considers the current transform to *be* `translate(cx, cy) scale(1)`,
so user-initiated zoom events compose onto that translate (and zoom-around-
cursor math stays correct) instead of clobbering it.

The lattice component (`lattice.ts:309-323`) uses the same overwrite pattern
but does not have this bug because its `g` starts at the identity — its
cells are positioned at absolute SVG coordinates inside `g` rather than
relative to a centered origin. No change needed there.

## Verification

- `npx vitest run` — **269/269 passing** (no new tests added; the existing
  cell-transform regression assertion at
  `src/components/__tests__/tonality-diamond.test.ts:49-96` continues to
  validate that cell positions inside `g` are unchanged).
- `npx tsc --noEmit` — clean.
- The fix is one extra line (`svg.call(zoom.transform, d3.zoomIdentity.translate(cx, cy))`)
  plus a 5-line explanatory comment.

## must_haves traceability

| must_have                                                                              | evidence                                                                |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| First wheel/pinch zoom event keeps the diamond visually centered                       | seeded zoom transform at `tonality-diamond.ts:275-279` (commit 98602f5) |
| Panning composes onto the centering translate, never overwrites it                     | d3.zoom internal state now starts at `translate(cx, cy)` instead of `(0,0)` |
| Existing 5 tonality-diamond.test.ts assertions still pass                              | `npx vitest run src/components/__tests__/tonality-diamond.test.ts` — 5/5 pass |
| `src/components/tonality-diamond.ts` seeds d3.zoom's internal state                    | commit 98602f5                                                          |

## Notes

- No new tests added: the regression is on the *parent group's* transform,
  which is hard to assert in happy-dom (no real layout, no zoom event
  dispatch). The existing test verifies cell-level transforms (which are
  unchanged by this fix). Manual smoke-testing in a real browser is the
  right verification surface for the parent-group transform — this is the
  "I can't test the UI in the type-check / vitest layer" case CLAUDE.md
  flags explicitly.
- Three-layer discipline preserved (D-08 / Pitfall #2): the fix is purely
  in the rendering layer; no audio context or scale-math code touched.
- Identical pattern was *not* applied to `lattice.ts` because the lattice's
  `g` starts at the identity (its vertices use absolute coordinates), so
  the bug doesn't manifest there.
