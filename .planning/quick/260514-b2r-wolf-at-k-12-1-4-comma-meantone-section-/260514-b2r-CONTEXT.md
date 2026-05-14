---
name: 260514-b2r-CONTEXT
description: Decisions for adding a heard-interval label to the spiral-of-fifths nodes in the meantone "wolf at k=12" section
status: locked
---

# Quick Task 260514-b2r: Spiral-of-fifths heard-interval label — Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Task Boundary

The "Wolf at k=12 (1/4-comma meantone)" section of `src/pages/meantone.md` renders the `spiralOfFifths` widget in its tempered branch (`temperedFifthCents: quarter.fifth`). In that branch each node currently shows ONLY a signed cents-from-12-TET label (e.g. `−5.4¢`). Nothing labels the audible pitch — i.e. the octave-reduced interval that the click handler actually sounds (`((cumulativeCents % 1200) + 1200) % 1200` projected through `centsToRatio`).

Add a second per-node text label expressing the **actual heard interval** as octave-reduced cents from 1/1.

</domain>

<decisions>
## Implementation Decisions

### Label content
- **Octave-reduced cents from 1/1**, e.g. `696.6¢`, `193.2¢`, `889.7¢`.
- Computed identically to the audition's reduction:
  `((cumulativeCents % 1200) + 1200) % 1200`
- Render with 1 decimal place to match the existing cents-from-12-TET label's precision (`toFixed(1)`).
- Use the `¢` glyph (already used elsewhere in this component).
- No sign needed — octave-reduced cents are always `[0, 1200)` and unsigned.
- k=0 reduces to 0 — render as `0.0¢` (do not special-case to "1/1" — keep format uniform).

### Placement
- **Above the node**, at the `y = -10` slot currently used for the ratio label in the pure branch.
  - Pure branch keeps showing `3/2`, `9/8`, `81/64`... at y=−10 unchanged.
  - Tempered branch newly shows `696.6¢`, `193.2¢`, `889.7¢`... at y=−10 — replacing the empty space.
- The existing signed cents-from-12-TET label at y=14 stays where it is.
- The two labels never co-occur per branch: ratio (pure) XOR octave-reduced-cents (tempered).

### Scope
- Change is **inside the spiral-of-fifths component** so every tempered-branch caller benefits (currently meantone.md is the only one but pythagorean-comma.md and others use the same factory).
- No change to `meantone.md` prose, math, or audition. No change to the wolf chord. No change to spiral geometry.
- No new CSS classes required — reuse the existing `.spiral-of-fifths__ratio` style for visual parity (or add a thin `.spiral-of-fifths__heard` class if styling needs differ; default is to reuse).
- Update the component's JSDoc header to document the tempered-branch label.

### Claude's Discretion
- CSS class naming: reuse `spiral-of-fifths__ratio` or add `spiral-of-fifths__heard`. Default: add `spiral-of-fifths__heard` to keep semantic separation (ratio ≠ cents) and identical visual style cascade. Plan should decide based on whether the existing class's CSS rules read cleanly when applied to a non-ratio string.
- Whether to add a unit test asserting the tempered-branch label set for n=12 (e.g. expect `["0.0¢", "696.6¢", "193.2¢", ...]`). Default: yes, mirroring the existing `__tests__/spiral-of-fifths.test.ts` pure-branch assertions.

</decisions>

<specifics>
## Specific Ideas

Affected files:
- `src/components/spiral-of-fifths.ts` — render the new tempered-branch label
- `src/components/styles/*` or component-scoped CSS (verify location during planning) — add/adjust `.spiral-of-fifths__heard` if a new class is introduced
- `src/components/__tests__/spiral-of-fifths.test.ts` — add tempered-branch label coverage

Expected output at first three tempered nodes (k = 0, 1, 2 with `quarter.fifth ≈ 696.578`):
- k=0 → `0.0¢`
- k=1 → `696.6¢`
- k=2 → `(2 × 696.578) mod 1200 = 193.156` → `193.2¢`

</specifics>

<canonical_refs>
## Canonical References

- `src/components/spiral-of-fifths.ts` — current tempered-branch rendering at lines 114–132 (geometry) and 222–242 (DOM labels)
- `src/pages/meantone.md:284-309` — the section in question and the widget invocation
- Existing pure-branch ratio label pattern at `src/components/spiral-of-fifths.ts:223-232` is the template for the new tempered-branch label

</canonical_refs>
