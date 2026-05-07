---
id: 260507-ios
description: "fix tonality-diamond zoom snap: first zoom event snaps diamond to top-left"
mode: quick
date: 2026-05-07
status: ready
must_haves:
  truths:
    - "first wheel/pinch zoom event keeps the diamond visually centered (no jump to (0,0))"
    - "panning composes onto the centering translate, never overwrites it"
    - "the existing 5 tonality-diamond.test.ts assertions still pass (cell transforms unchanged)"
  artifacts:
    - "src/components/tonality-diamond.ts seeds d3.zoom's internal state with the centering translate"
  key_links:
    - "src/components/tonality-diamond.ts:180-182 (centering translate)"
    - "src/components/tonality-diamond.ts:268-274 (zoom handler that overwrites it)"
---

# Quick Task 260507-ios: Fix tonality-diamond zoom snap

## Goal

Stop the tonality diamond from snapping hard-left on the first zoom/pan
interaction. The center axis ends up off the left edge of the SVG and the
otonal half disappears.

## Root cause

`tonality-diamond.ts:182` initializes the inner `<g>` with
`translate(${cx},${cy})` to center the rhombus inside the viewBox. The zoom
handler at `:271-273` replaces that transform with `event.transform.toString()`
on every zoom event. d3.zoom's internal state starts at the identity
(`translate(0,0) scale(1)`), so the first event clobbers the centering and
moves iso(0,0) to the SVG origin (top-left corner). Subsequent pan deltas are
applied relative to (0,0), not the original center, so the diamond never
recovers.

## Tasks

### T1 — Seed d3.zoom with the centering translate

**files:** `src/components/tonality-diamond.ts`

**action:**
After `svg.call(zoom)`, prime the zoom's internal transform to match the
visible centering:

```ts
svg.call(zoom.transform, d3.zoomIdentity.translate(cx, cy));
```

This makes d3 think the current transform is `translate(cx, cy) scale(1)`, so
the next user-initiated zoom event composes onto that translate instead of
overwriting it.

**verify:**
- `npx vitest run src/components/__tests__/tonality-diamond.test.ts` — 5/5
  pass. Cell-position assertions are unaffected because cells live inside `g`
  at fixed coordinates; only `g`'s parent transform changes.
- Manual smoke: `npm run dev` → tonality-diamond renders centered → first
  scroll-zoom keeps it centered, only scales around the cursor.

**done:** No visual snap on first zoom; pan/zoom composes onto centering.

### T2 — Full suite + typecheck

**files:** *(none — verification only)*

**action:**
- `npx vitest run` — all 269 tests green.
- `npx tsc --noEmit` — clean.

**done:** No regressions in adjacent components.

## Constraints

- No change to `cellGroups`/cell layout — the test at `tonality-diamond.test.ts:49-96`
  asserts exact `translate(...)` values per cell; those must stay byte-identical.
- No changes to lattice or other components — this is a single-file fix.
- Don't import additional d3 modules — `d3.zoomIdentity` is already exported
  from the existing `import * as d3 from "d3"`.
