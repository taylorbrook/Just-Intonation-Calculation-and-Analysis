---
quick_id: 260512-cv2
slug: add-odd-limits-theory-page
date: 2026-05-12
status: complete
commit: _pending_
---

# Summary — add odd-limits theory page

## What changed

- **New page** `src/pages/odd-limits.md` introducing Partch's **odd-limit**
  classification side-by-side with **prime-limit**. The page mirrors the
  cell discipline of `syntonic-comma.md` / `prime-limits.md`:
  synth cell owning its AudioContext, worked-example `Interval` instances
  declared up front, and a kernel round-trip cell calling
  `oddLimit(iv.monzo)` on each example so prose can never drift from BigInt
  truth.
- **Worked examples** with audio audition:
  - `7/4` — odd-limit 7, prime-limit 7 (the easy case, both classifications agree).
  - `9/8` — odd-limit 9 but prime-limit 3 (the canonical disagreement; same
    prime axis used with exponent 2 lifts odd-limit by a whole identity).
  - `16/15` — odd-limit 15, prime-limit 5 (illustrates that the audible
    "bite" of two ratios with the same prime-limit can differ sharply
    along the odd-limit axis).
- **Diamond walks** with `ratioPill` rows built via a small `pillRow`
  factory cell:
  - **5-odd-limit**: all 7 pitches inline (the just diatonic backbone).
  - **7-odd-limit**: the 6 new pitches the 7-identity adds (8/7, 7/6, 7/5,
    10/7, 12/7, 7/4) — total 13.
  - **11-odd-limit (Partch's diamond)**: counts called out (29 pitches),
    with `ratioPill` rows for the 6 ratios the 9-identity adds and the 10
    the 11-identity adds — directing readers to the live configurable
    tonality diamond on `/` for the full grid.
- **In the kernel** section using `ts run=false` fences (Framework
  attribute that suppresses live transpilation while keeping TypeScript
  syntax highlighting) to display the pedagogical
  `oddLimit(...)` / `enumerateDiamond(...)` API surface from
  `src/lib/monzo.ts` and `src/lib/diamond.ts` without trying to resolve
  page-relative imports.
- **Sidebar registration** in `observablehq.config.ts` — *Odd-limits*
  inserted immediately after *Prime-limits* in **Theory notes**. Keeps
  the group pedagogically ordered (foundations → notation →
  prime-limits → odd-limits → otonality/utonality → commas).
- **`src/pages/harmonic-series.md`** — removed the `*(forward link: page
  lands in a later quick task.)*` parenthetical from the *Odd-limits*
  bullet in the "Why this is the ground floor" section. The forward link
  now points at a real page.

## How I verified

- `npm run lint:types` (tsc --noEmit): clean.
- `npm run lint` (eslint): clean (only the pre-existing `.eslintignore`
  deprecation warning).
- `npm run build`: succeeded; new page rendered at
  `dist/pages/odd-limits.html`; 59 links validated (including the new
  cross-links and sidebar link).
- `npm test` (vitest): 269/269 tests pass — no kernel regressions (this
  is a docs-only change; `oddLimit` and `enumerateDiamond` were already
  exercised by `monzo.test.ts` and `diamond.test.ts`).

## Decisions worth flagging

- **Where to place the page in the sidebar**: after *Prime-limits* and
  before *Otonality & utonality*. Pedagogically the two limit pages are
  parallel classifications (prime-limit answers *which dimensions of the
  monzo lattice are alive?*; odd-limit answers *how complex are these
  harmonic relationships in chord context?*), so they belong adjacent.
  Otonality/utonality then introduces the *structure* (rows/columns) of
  the diamond that odd-limit *sizes*.
- **How to show the 11-odd-limit diamond**: not inline. The full 29-pitch
  diamond would overwhelm prose pills; the interactive SVG on `/` is the
  right place for exploration. The page instead highlights the *new
  identities* the 9- and 11-axes contribute and points at the live viz.
- **Kernel snippets use `ts run=false`**: the Framework markdown handler
  honors `attributes.run === "false"` to skip live transpilation
  (`node_modules/@observablehq/framework/dist/markdown.js`). This keeps
  syntax highlighting on pedagogical code samples whose imports
  (`import { oddLimit } from "./monzo.js"`) would otherwise resolve
  relative to `src/pages/` and fail. No need to fall back to plain
  fences.
- **Round-trip cell over `enumerateDiamond` for the pitch rows**: the
  hand-listed pitch arrays (`["1/1", "6/5", ...]`) are easier to read in
  the page source than a kernel call that would require a synthetic
  `Scale` instance (the kernel's `enumerateDiamond(oddLimit, scale)`
  signature requires a non-empty Scale to compare in-scale membership,
  which is not what the prose-pill rows are for). The kernel section
  near the bottom still demonstrates `enumerateDiamond` as the API for
  callers who want the live cell enumeration.

## Files touched

- `src/pages/odd-limits.md` (new)
- `observablehq.config.ts` (1 line added — *Odd-limits* sidebar entry)
- `src/pages/harmonic-series.md` (1 forward-link parenthetical removed)

## Done

`feat(quick-260512-cv2): add odd-limits theory page`
