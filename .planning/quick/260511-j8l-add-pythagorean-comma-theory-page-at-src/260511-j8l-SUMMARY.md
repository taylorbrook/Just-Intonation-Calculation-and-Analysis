---
type: summary
quick_id: 260511-j8l
task: Add Pythagorean-comma theory page at src/pages/pythagorean-comma.md mirroring src/pages/syntonic-comma.md
date: 2026-05-11
status: complete
mode: quick
files_modified:
  - src/pages/pythagorean-comma.md
  - observablehq.config.ts
commits:
  - 4d06e66 — docs(quick-260511-j8l): add Pythagorean-comma theory page
---

# Quick task 260511-j8l — Summary

Added a second theory note at `src/pages/pythagorean-comma.md` that mirrors
`src/pages/syntonic-comma.md` section-for-section: same imports, same
page-owned synth cell, same prose-with-tex pattern, same three-button audio
section, same "## In monzos" and "## See also" closers.

## What the page does

- Pulls the Pythagorean comma via `commaByName("Pythagorean comma")!` — the
  entry was already in `src/lib/commas.ts` with monzo `[-19, 12]`, so no
  library changes were needed.
- Builds `(3/2)^12` with `Interval.mul`, then reduces it by six octaves via
  `Interval.div` to derive the "cycle-of-fifths octave" `531441/262144` —
  a Pythagorean comma sharper than `2/1`.
- Renders three audio buttons:
  - The pure octave `2/1` (1200¢, target).
  - The cycle-of-fifths octave `531441/262144` (a comma sharp of 2/1).
  - The comma alone `531441/524288` (~23.46¢).
- Cross-links to `/pages/syntonic-comma` and `/` per task spec.

## Sidebar registration

Appended `{ name: "The Pythagorean comma", path: "/pages/pythagorean-comma" }`
to the Theory `pages` array in `observablehq.config.ts` so the page is
reachable through the sidebar. Header link and `src/index.md` cross-link
were left untouched (out of scope — task brief only required in-page
cross-links to /pages/syntonic-comma and /).

## Verification

- `npx tsc --noEmit` → clean (no errors).
- `npx prettier --check src/pages/pythagorean-comma.md observablehq.config.ts` → clean.
- Visual / audio verification is human (no UAT in quick mode); recommend a
  spot-check at http://localhost:3000/pages/pythagorean-comma after
  `npm run dev` to confirm the three buttons render and play.

## Notes for future me

- Three-layer discipline preserved: page imports only from `../lib/`,
  `../audio/`, `../components/` (same as syntonic-comma.md).
- The `(3/2)^12` construction uses a 12-iteration loop rather than calling
  `Math.pow` or threading through bigint exponentiation — Interval doesn't
  expose a `.pow(n)` method today. If a third "stacking" theory note
  appears (e.g. for the schisma — 8 fifths + a major third), consider
  adding `Interval.pow(n: number): Interval` to the kernel instead of
  hand-rolling another loop.
- Pattern is now reusable: any future named-comma page can copy
  `pythagorean-comma.md` as a template — `commaByName(...)` + an
  Interval-derived comparison + the same three-button audio block.
