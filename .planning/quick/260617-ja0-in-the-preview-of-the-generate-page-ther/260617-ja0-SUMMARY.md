---
quick_id: 260617-ja0
slug: in-the-preview-of-the-generate-page-ther
description: Fix unison/octave label overlap in the generate-page preview circle
date: 2026-06-17
status: complete
commit: 92d1260
---

# Quick Task 260617-ja0 — Summary

## Problem

In the generate page's **Shared preview**, the circle-of-pitches viz always drew the unison
(1/1) and octave (2/1) labels on top of each other at 12 o'clock.

## Root cause

`Scale`'s D-14 contract guarantees the **last** interval is the period (2/1). The circle
positions every degree at `θ = iv.cents / periodCents · 2π`, so the closing period landed at
`θ = 2π ≡ 0` — the exact point of the unison. Both the dot and the rim label were drawn twice
at 12 o'clock (and the blue octave dot masked the green tonic accent). Because every
well-formed scale closes on its period, the overlap was *always* present.

## Fix

`src/components/circle-of-pitches.ts` — compute the degrees to render as `scale.intervals`
minus a trailing interval that `.equals(scale.period)`, and drive the empty-state guard, marker
loop, `N`, and label-thinning off that trimmed list. A pitch-class circle expresses
octave-equivalence by the ring closing on itself, so the closing period is redundant; the tonic
node at 12 o'clock already marks that point. The octave stays auditionable in the scale table
rendered directly beneath the circle.

Side effect (toward intended behavior, per the D-17 empty-state note): an octave-only
`[1/1, 2/1]` scale now falls through to the friendly empty-state `<p>` instead of rendering two
coincident dots.

## Tests

`src/components/__tests__/circle-of-pitches.test.ts`:
- Marker-count test now asserts one node per *interior* degree (`intervals.length − 1` for a
  period-closing scale), exactly one tonic, and no "2/1" label.
- Split the empty-state test: unison-only `[2/1]` and octave-only `[1/1, 2/1]` both assert the
  empty-state `<p>` and no markers (the octave-only case was previously informational/`void`).

## Verification

- `npm run ci` — clean end-to-end: `tsc --noEmit`, **753/753** vitest, eslint, prettier
  `--check`, `observable build` (140 links validated).
- Only `src/pages/generate.md` imports `circleOfPitches`, so no other consumer is affected.

## Scope

Geometric fix in the component only. No change to `Scale`, `Interval`, the scale-table, or any
CSS.

**Commit:** `92d1260`
