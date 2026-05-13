---
quick_id: 260513-jir
slug: add-onstepclick-prop-to-spiral-of-fifths
description: Add onStepClick prop to spiral-of-fifths component with is-clickable cursor toggle and tests
date: 2026-05-13
mode: quick
---

# Quick Task 260513-jir — Add `onStepClick` prop to spiral-of-fifths

## Goal

Extend `src/components/spiral-of-fifths.ts` with an optional `onStepClick?: (step: SpiralStep) => void` prop on `SpiralOfFifthsOpts`. When provided, bind a click handler to each rendered node so the callback fires with the corresponding `SpiralStep`. Toggle a `.is-clickable` class on the widget root only when the handler is supplied, and use that class to gate a `cursor: pointer` rule for the node group. Component stays viz-only — no synth import; audition belongs at the call site.

## Files modified

- `src/components/spiral-of-fifths.ts` — add `onStepClick?` to `SpiralOfFifthsOpts`; toggle `.is-clickable` on root; bind click handler per node when prop is supplied.
- `src/components/spiral-of-fifths.css` — add `cursor: pointer` rule scoped via `.is-clickable` on the root, applied to the node group selector (`.spiral-of-fifths__node`).
- `src/components/__tests__/spiral-of-fifths.test.ts` — add cases covering: (a) class toggle when prop omitted vs supplied; (b) click fires callback with the matching `SpiralStep`; (c) backwards-compat: existing assertions still pass when no handler is supplied.

## Tasks

### T1 — Extend `SpiralOfFifthsOpts` and bind click handlers

**files:** `src/components/spiral-of-fifths.ts`

**action:**
1. Add `onStepClick?: (step: SpiralStep) => void` to `SpiralOfFifthsOpts`.
2. In `spiralOfFifths(...)`:
   - When `opts.onStepClick` is defined, add `is-clickable` to the root `className` (so the class list becomes `spiral-of-fifths-widget is-clickable`).
   - Inside the per-step `for` loop, when the handler is supplied, attach a click listener to the `<g class="spiral-of-fifths__node">` element that invokes `opts.onStepClick(s)`. Use native `g.addEventListener("click", () => opts.onStepClick!(s))` — the existing code is vanilla DOM (no D3 dependency on this file); D3's `.on('click', ...)` in the task brief is shorthand for "wire up a click handler". We preserve the file's existing style.
3. Keep the per-step `s` capture by-reference safe (loop body already declares `const s = steps[i]`, which is block-scoped → safe).

**verify:**
- `npx tsc --noEmit` clean.
- `npx vitest run src/components/__tests__/spiral-of-fifths.test.ts` green.

**done:**
- `SpiralOfFifthsOpts` exports `onStepClick?` JSDoc-annotated.
- Root carries `is-clickable` ↔ `onStepClick` defined.
- Each node group fires the callback with the correct `SpiralStep` on click; nodes still have no click behavior when the prop is omitted.

### T2 — CSS scoped to `.is-clickable`

**files:** `src/components/spiral-of-fifths.css`

**action:** Add a rule scoped through `.is-clickable` on the root so it applies only when the click handler is wired:

```css
.spiral-of-fifths-widget.is-clickable svg.viz.spiral-of-fifths .spiral-of-fifths__node {
  cursor: pointer;
}
```

(Note: the task brief says "cursor: pointer to .spiral-node" — the actual node class in this file is `.spiral-of-fifths__node` per the BEM convention used throughout this component. Match the existing class.)

**verify:** Existing CSS rules unchanged — diff shows only the new rule appended.

**done:** `cursor: pointer` applies to node groups iff `.is-clickable` is on the root.

### T3 — Tests

**files:** `src/components/__tests__/spiral-of-fifths.test.ts`

**action:** Add a new `describe` block (or extend the existing "DOM smoke" one) with cases:

1. **No `onStepClick`:** root `className` does NOT contain `is-clickable`.
2. **With `onStepClick`:** root `className` contains `is-clickable`.
3. **Click dispatch:** calling `node.dispatchEvent(new MouseEvent('click', { bubbles: true }))` on the k=1 node invokes the callback with a `SpiralStep` whose `k === 1`, `ratio` equals `3/2`, `cumulativeCents > 0`, and `centsFrom12tet` between 1.9 and 2.0 (pure 3/2 fifth signature). Use `vi.fn()` to capture.
4. **Tempered branch click:** with `temperedFifthCents: 700`, callback for k=1 receives `ratio: null` and `centsFrom12tet === 0` (exact at 700¢).
5. **Existing assertions (n+1 nodes, wolf chord, tempered, width forwarding) still pass** — no changes required, just rely on existing suite.

**verify:** `npx vitest run src/components/__tests__/spiral-of-fifths.test.ts` green; no regressions.

**done:** New tests assert both the class toggle and callback dispatch.

## Constraints

- **No synth import.** Component stays viz-only (Pitfall #2 / D-08 — three-layer discipline already documented in the file header).
- **No D3 dependency added.** The existing file uses native DOM (`document.createElementNS`); use `addEventListener` for parity. The task brief's D3 phrasing is shorthand for click binding.
- **Backwards-compat:** omitting `onStepClick` must leave existing behavior and tests unchanged. Test #5 above is the regression guard.
- **No keyboard a11y in scope.** `cursor: pointer` alone does not make this keyboard-accessible. Flag as deferred in SUMMARY — out of scope for this quick task.

## Acceptance

- [ ] `tsc --noEmit` passes.
- [ ] All existing tests still pass.
- [ ] New tests cover class toggle + callback dispatch.
- [ ] `cursor: pointer` applies only when `.is-clickable` is on the root.
- [ ] No synth import added.
