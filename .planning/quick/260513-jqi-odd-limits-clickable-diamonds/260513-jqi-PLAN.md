---
quick_id: 260513-jqi
slug: odd-limits-clickable-diamonds
description: Make the three inline diamonds on /pages/odd-limits.md click-to-audition by extending renderDiamondSVG with an optional synth parameter
date: 2026-05-13
mode: quick
---

# Quick Task 260513-jqi — Click-to-audition diamonds on /odd-limits

## Goal

Replace the three pure-presentational `renderDiamondSVG()` calls on
`src/pages/odd-limits.md` (5-, 7-, 11-odd-limit) with a click-to-audition
variant so every cell sounds its dyad against `1/1` when clicked. Each cell
plays `[baseHz, baseHz × ratio]` for 1.5s — the same dyad audition pattern
`playInterval` uses (D-07 / D-18).

## Approach — option (a): extend renderDiamondSVG

The user's prompt offered two paths:

- **(a)** add an optional `synth` to `renderDiamondSVG`, forward clicks to
  the same audio call `playInterval` makes.
- **(b)** construct an odd-limit `Scale` in the page and call the existing
  interactive `tonalityDiamond(scale, synth, opts)` factory.

We pick (a) because:

1. **Layout preservation.** The user explicitly says "Keep the existing
   visual layout (three diamonds, widths 280/320/440)." `tonalityDiamond`
   prepends an `<h2>Tonality diamond</h2>` heading and a "Click a cell to
   audition. Hover for ratio details." helper line — both written for the
   dashboard's standalone widget context, not for theory pages where each
   diamond already sits under its own `### N-odd-limit` H3. Option (a)
   leaves the surrounding prose flow unchanged.

2. **Existing CSS already handles the visual switch.** `tonality-diamond.css`
   already gates `cursor: pointer` on `.diamond-cell[role="button"]` and
   gives focus-visible cells a 2px outline. The renderer just needs to
   start emitting `role="button"` + `tabindex="0"` instead of
   `role="presentation"` when synth is supplied. **No CSS changes.**

3. **D-08 three-layer discipline preserved.** Synth ownership stays at the
   page (the existing cell-owned `createSynth()` call at the top of
   odd-limits.md), and the viz component receives a `SynthHandle` interface
   reference exactly the way `tonalityDiamond` and `playInterval` already do.

## Files modified

- `src/components/tonality-diamond.ts` — extend `RenderDiamondSVGOpts` with
  optional `synth?: SynthHandle`, `baseHz?: number`, `duration?: number`.
  When `synth` is supplied: each cell becomes `role="button"` + `tabindex=0`
  with click + Enter/Space handlers calling
  `synth.playNotes([baseHz, baseHz * Number(ratio.fraction.valueOf())], duration)`.
  When omitted: behavior byte-equivalent to today (presentation-only).
- `src/pages/odd-limits.md` — pass the existing page-owned `synth` to all
  three `renderDiamondSVG()` calls. Widths 280 / 320 / 440 unchanged.
- `src/components/__tests__/tonality-diamond.test.ts` — add a `describe` block
  for `renderDiamondSVG`: (a) without synth, cells stay `role="presentation"`
  (regression guard); (b) with synth, cells get `role="button"` and clicking
  the first interactive cell invokes `synth.playNotes` with `[baseHz, baseHz × ratio]`.

## Tasks

### T1 — Extend `RenderDiamondSVGOpts` with optional synth

**files:** `src/components/tonality-diamond.ts`

**action:**

1. Add to `RenderDiamondSVGOpts`:
   ```ts
   /**
    * Optional synth handle. When supplied, every cell becomes a clickable
    * button auditioning [baseHz, baseHz × ratio] for `duration` seconds —
    * the same dyad audition pattern playInterval uses. When omitted, cells
    * remain presentation-only (byte-equivalent to legacy renderDiamondSVG).
    *
    * D-08 three-layer discipline: viz components do not own the synth —
    * the page does. Imports the SynthHandle type only.
    */
   synth?: SynthHandle;
   /** Hz reference for 1/1. Default 440. */
   baseHz?: number;
   /** Audition duration in seconds. Default 1.5 (matches playInterval / D-18). */
   duration?: number;
   ```
2. Import `SynthHandle` (type-only) at the top of the file alongside the
   existing `Scale` type-only import.
3. Inside the `for (const i of odds) for (const j of odds)` loop, branch on
   whether `opts.synth` is supplied:
   - **Without synth (legacy path):** keep the current
     `cellGroup.setAttribute("role", "presentation")`. No handlers.
   - **With synth (new path):**
     - `cellGroup.setAttribute("role", "button")`
     - `cellGroup.setAttribute("tabindex", "0")`
     - `cellGroup.setAttribute("aria-label", `Play ${ratio.fraction.toFraction()}`)`
     - Capture `ratio` and `synth` in a closure and bind `click` + `keydown`
       (Enter / Space) handlers that call
       `synth.playNotes([baseHz, baseHz * Number(ratio.fraction.valueOf())], duration)`.
       The `addEventListener` form on the SVGGElement matches the spiral-of-fifths
       pattern (260513-jir) — the file currently uses `document.createElementNS`
       and vanilla DOM throughout.
4. The `<svg>` `aria-label` (`"${oddLimitN}-odd-limit tonality diamond"`)
   stays. The `role="img"` on the SVG can stay as the static container
   role; cells inside switch to interactive role independently — `<svg
   role="img">` containing `<g role="button">` is allowed by ARIA 1.2 (the
   role="img" applies to the SVG-as-graphic, not as a presentation barrier).
5. **No mutation of the audition-disabled path.** Keep cellGroup classes
   (`diamond-cell--in-scale diamond-cell--axis-N`) and the SVG `<title>`
   tooltip exactly as today.

**verify:**

- `npx tsc --noEmit` — clean.
- Component visually unchanged when called without synth (existing
  `renderDiamondSVG(N, { width, height })` call sites elsewhere — none
  besides odd-limits.md per repo grep — still render the same SVG markup).

**done:**

- `RenderDiamondSVGOpts` exports `synth?` / `baseHz?` / `duration?` with JSDoc.
- With synth supplied: every cell has `role="button"`, `tabindex="0"`, the
  expected aria-label, and click/Enter/Space all dispatch the dyad audition.
- Without synth supplied: cells stay `role="presentation"` (regression guard).

### T2 — Wire synth into the three calls on /odd-limits

**files:** `src/pages/odd-limits.md`

**action:** Replace the three call sites:

```md
${renderDiamondSVG(5, { width: 280, height: 280 })}
${renderDiamondSVG(7, { width: 320, height: 320 })}
${renderDiamondSVG(11, { width: 440, height: 440 })}
```

with:

```md
${renderDiamondSVG(5, { width: 280, height: 280, synth })}
${renderDiamondSVG(7, { width: 320, height: 320, synth })}
${renderDiamondSVG(11, { width: 440, height: 440, synth })}
```

The existing top-of-page synth cell (already mirrored from `monzos.md`) is
the source — no new imports, no new cells. `playInterval` import remains
(it's used for the three audition bullets in the prose right before the
diamond walks).

**verify:** `npm run build` (Observable build) green; the three diamonds
render exactly where they did before.

**done:** Three call sites pass `synth` through opts; no other edits to
the page.

### T3 — Tests

**files:** `src/components/__tests__/tonality-diamond.test.ts`

**action:** Append a new `describe("renderDiamondSVG", ...)` block:

1. **Without synth — regression guard:**
   ```ts
   const el = renderDiamondSVG(5);
   const buttons = el.querySelectorAll('.diamond-cell[role="button"]');
   expect(buttons.length).toBe(0);
   const cells = el.querySelectorAll('.diamond-cell');
   expect(cells.length).toBeGreaterThan(0);
   for (const cell of cells) {
     expect(cell.getAttribute("role")).toBe("presentation");
   }
   ```
2. **With synth — every cell is a button:**
   ```ts
   const synth = makeStubSynth();
   const el = renderDiamondSVG(5, { synth });
   const buttons = el.querySelectorAll('.diamond-cell[role="button"]');
   expect(buttons.length).toBeGreaterThan(0);
   // Equal cell count regardless of synth presence.
   const cells = el.querySelectorAll('.diamond-cell');
   expect(buttons.length).toBe(cells.length);
   ```
3. **With synth — clicking the first interactive cell calls playNotes
   with the dyad shape `[baseHz, baseHz × ratio]`:**
   ```ts
   const synth = makeStubSynth();
   const el = renderDiamondSVG(5, { synth });
   document.body.appendChild(el);
   const cell = el.querySelector('.diamond-cell[role="button"]') as HTMLElement;
   cell.dispatchEvent(new Event("click", { bubbles: true }));
   expect(synth.playNotes).toHaveBeenCalledTimes(1);
   const args = synth.playNotes.mock.calls[0];
   const freqs = args[0] as number[];
   expect(freqs.length).toBe(2); // dyad
   expect(freqs[0]).toBe(440); // default baseHz
   ```

**verify:** `npx vitest run src/components/__tests__/tonality-diamond.test.ts` green.

**done:** New tests assert the role switch + the click dispatch + the dyad
audio shape; existing 5 tests still pass.

## Constraints

- **Three-layer discipline preserved.** Viz never instantiates a synth;
  page owns the cell, viz receives a `SynthHandle`.
- **Backwards-compat:** omitting `synth` must leave existing behavior
  byte-equivalent. Test #1 above is the regression guard.
- **No CSS changes.** `.diamond-cell[role="button"]` already has the
  `cursor: pointer` + focus-visible outline rules.
- **No import of `playInterval` inside the viz module.** The component
  forwards to `synth.playNotes` directly — same call shape `playInterval`
  uses internally. Importing `playInterval` would couple the viz to a
  presentational button factory.

## Acceptance

- [ ] `tsc --noEmit` clean.
- [ ] Existing 5 `tonalityDiamond` tests still pass.
- [ ] New `renderDiamondSVG` tests cover role-switch + click dispatch + dyad shape.
- [ ] `npm run build` green; /pages/odd-limits.md renders three diamonds at the same widths (280/320/440).
- [ ] Clicking any cell on the rendered page sounds the dyad.
