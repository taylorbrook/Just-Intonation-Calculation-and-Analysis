---
quick_id: 260512-cv2
slug: add-odd-limits-theory-page
date: 2026-05-12
status: complete
---

# Quick task — add odd-limits theory page

## Goal

Add `src/pages/odd-limits.md` introducing Partch's **odd-limit** classification
side-by-side with **prime-limit**: odd-limit is the largest odd factor of
numerator or denominator (after octave reduction); it measures harmonic
complexity within a single chord context, where prime-limit bounds the whole
tonal world. Worked examples make the divergence concrete (`7/4` is 7 in
both classifications; `9/8` is 3-prime-limit but 9-odd-limit). Walk the
5-, 7-, and 11-odd-limit tonality diamonds in prose with `ratioPill` rows
for each, then point at the live configurable diamond on `/`. Mirror prose
voice and cell structure of `syntonic-comma.md` / `prime-limits.md` (synth
cell owns its AudioContext, interval declarations up front, kernel
round-trip cell so prose can't drift from BigInt truth).

## Scope

### Files to create

- `src/pages/odd-limits.md` — the page itself.

### Files to edit

- `observablehq.config.ts` — register the page in the **Theory notes**
  sidebar group. Place it directly after **Prime-limits** (odd-limit is the
  natural follow-on; the two classifications answer parallel questions).
- `src/pages/harmonic-series.md` — drop the
  `*(forward link: page lands in a later quick task.)*` parenthetical from
  the **Odd-limits** bullet in the "Why this is the ground floor" section.
  The forward link now points at a real page.

### Files NOT to edit (and why)

- `src/pages/prime-limits.md` — its `See also` section already links to
  `/pages/odd-limits` as a peer classification; the link target now
  resolves but no text changes are needed.
- `src/pages/otonality-utonality.md` — its `See also` section already
  links to `/pages/odd-limits` with the right framing ("odd-limit is its
  *size*"); no edits needed.
- `src/lib/monzo.ts`, `src/lib/diamond.ts` — the kernel already exposes
  `oddLimit` and `enumerateDiamond`; this is a docs-only page on top of
  existing kernel functions.

## Approach

Mirror the cell discipline of `syntonic-comma.md` and `prime-limits.md`:

1. **Synth cell** — own this page's AudioContext (ARCHITECTURE Pattern 4 /
   Pitfall #2); must NOT depend on any other cell so the AudioContext is
   not torn down on edits.
2. **Declarations cell** — three worked-example `Interval` instances
   (`7/4`, `9/8`, `16/15`) declared up front; prose / `ratioPill` /
   `playInterval` all reference these same instances.
3. **Kernel round-trip cell** — call `oddLimit(iv.monzo)` on each worked
   example and `display()` an array so the page can't lie about what the
   kernel actually computes (same discipline as the `.inv().octaveReduce()`
   round-trip on `otonality-utonality.md`).
4. **Pill-row cell** — build `HTMLSpanElement` rows of `ratioPill`s for the
   5-, 7-, and 11-odd-limit diamond walks; reference each row inline in
   the matching H2 section so the prose stays readable.

The 5-, 7-, and 11-odd-limit pitch sets are small (7, 13, 29) and
deterministic. The page hand-enumerates the 5- and 7-odd-limit pitches as
pill rows; the 11-odd-limit diamond is Partch's full 29-pitch diamond, too
large for inline pills, so instead the page calls out the *new identities*
that the 9- and 11-axes contribute (with pills) and links to the live
configurable diamond on `/`.

The page closes with a short **In the kernel** section showing how
`oddLimit` (`src/lib/monzo.ts`) and `enumerateDiamond` (`src/lib/diamond.ts`)
expose the same classification programmatically.

## Done when

- `src/pages/odd-limits.md` exists with synth cell, declarations cell,
  kernel round-trip cell, pill-row cell, and prose walking 5-/7-/11-odd-limit
  diamonds plus a `## See also` cross-linking `/pages/prime-limits`,
  `/pages/otonality-utonality`, `/pages/harmonic-series`, and `/`.
- `observablehq.config.ts` lists *Odd-limits* immediately after
  *Prime-limits* in **Theory notes**.
- `src/pages/harmonic-series.md`'s `*(forward link: page lands in a later
  quick task.)*` parenthetical on the **Odd-limits** bullet is gone.
- Single atomic commit `feat(quick-260512-cv2): add odd-limits theory page`.
- STATE.md "Quick Tasks Completed" table updated with the new row.
