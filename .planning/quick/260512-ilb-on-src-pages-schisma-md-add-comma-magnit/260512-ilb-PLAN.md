---
quick_id: 260512-ilb
description: Add comma-magnitude bar chart + Schismatic temperament play-dyad section + Further reading on schisma page
date: 2026-05-12
status: complete
---

# Quick Task 260512-ilb

## Goal

Extend `src/pages/schisma.md` with three additive sections:

1. **`## The three commas at scale`** — horizontal Plot bar chart visualizing
   the Pythagorean comma (~23.46¢), syntonic comma (~21.51¢), and schisma
   (~1.95¢) on a shared cents axis. Drives home the "right at the threshold
   of audibility" claim visually: the schisma bar should appear roughly an
   order of magnitude shorter than its two parents.

2. **`## Schismatic temperament`** — replace the existing single-paragraph
   mention with a richer section that includes a `playDyad` button (from
   `src/components/play-dyad.ts`) sounding the Pythagorean diminished fourth
   (`8192/6561` ≈ 384.36¢) against the 5-limit major third (`5/4` ≈ 386.31¢).
   The two pitches are exactly one schisma apart, so the dyad beats at the
   schisma rate (~2 Hz against the 440 Hz default).

3. **`## Further reading`** — bullet list with Xenharmonic Wiki Schisma page
   and the IMSLP entry for Helmholtz's *Die Lehre von den Tonempfindungen* /
   *On the Sensations of Tone*.

## Research note — the schismatic-third math

The user's original prompt said the dyad should be `(3/2)^8 / 2^4` against
`5/4`. That formula is incorrect:

- `(3/2)^8 / 2^4 = 6561/4096 ≈ 815.64¢` — this is *one schisma sharp of 8/5*
  (the minor sixth), not one schisma from 5/4.
- The canonical schismatic major third is **`8192/6561 ≈ 384.36¢`** =
  `(3/2)^-8 × 2^5` (eight fifths *down*, up five octaves), equivalently
  `(4/3)^8 / 2^3` (eight fourths up reduced).

Confirmed against three independent sources:
- Tonalsoft Encyclopedia: explicit `8192/6561 = 384.36¢` vs `5/4 = 386.31¢`,
  difference = 1 schisma.
- Wikipedia, *Schismatic temperament*: "the note eight fifths below C, F♭♭
  (384.36¢)… is only 1.95¢ flat of E♮ (5/4)."
- Xenharmonic Wiki, *Schismatic family*: `(4/3)^8 ≈ 10/1` identity tempers
  the schisma to unison.

User confirmed: proceed with `8192/6561` + `5/4`.

## Constraints

- **BigInt is the source of truth.** Intervals constructed via
  `new Interval("8192/6561")` / `new Interval("5/4")`; `.cents` is the
  display projection only (Pitfall #1). The bar chart reads `.cents` from
  the existing `pythagorean` / `syntonic` / `schisma` Interval bindings —
  no hardcoded magic numbers, no separate numeric "23.46" literal.
- **playDyad must be inline.** Use the `${playDyad(...)}` markdown
  expression pattern that `playInterval` already uses on this page
  (lines 42-44 of `src/pages/schisma.md`).
- **Style match.** Bar chart uses Observable Plot, following the chart
  style of `src/pages/pythagorean-comma.md`'s drift chart: blue
  `#4269d0` primary, red `#c45656` accent (highlight the schisma bar),
  monospace cents tick formatter, dashed/grid ruleX. Width 640, modest
  height (~200) since it's three rows.
- **Section placement.**
  - Bar chart after the existing "Audition the size gradient" bullet
    list, BEFORE the existing tempering paragraph (so the visual
    framing precedes the temperament-application discussion).
  - `## Schismatic temperament` replaces the existing single tempering
    paragraph (lines 46-49) and sits between the bar chart and `## In
    monzos`.
  - `## Further reading` appended as the final section after `## See also`,
    matching the `## Further reading` placement in
    `src/pages/pythagorean-comma.md` and `src/pages/edo-approximation.md`.
- **Don't touch unrelated content.** The `## In monzos` section, the
  intro paragraphs, the synth cell, the existing audition bullets, and
  the `## See also` section remain byte-equivalent.

## Files

- `src/pages/schisma.md` — single file edit.

## Plan

### Task 1 — apply the additive edit

1. Add two imports to the first `ts` cell (alphabetized within the
   `../components/` group; Plot added at end):
   - `import { playDyad } from "../components/play-dyad.js";`
   - `import * as Plot from "npm:@observablehq/plot";`

2. Extend the third `ts` cell (the commas-by-name block) with two new
   Interval bindings:
   - `const schismaticThird = new Interval("8192/6561");` — Pythagorean
     diminished fourth; `(3/2)^-8` octave-reduced up by 5; ≈ 384.36¢.
   - `const fiveLimitThird = new Interval("5/4");` — pure 5-limit major
     third; ≈ 386.31¢. Schismatic temperament identifies these two by
     tempering out the schisma.

3. After the audition bullet list, insert `## The three commas at scale`
   section: short framing paragraph + Plot bar chart cell.

   Chart structure:
   - Horizontal `Plot.barX` with y-domain explicitly ordered
     `["Pythagorean", "syntonic", "schisma"]` (wide → narrow).
   - Data: `[{name: "Pythagorean", cents: pythagorean.cents}, ...]`
     reads from existing Interval bindings — single point of truth.
   - Schisma bar fills `#c45656` (red); other two bars `#4269d0` (blue).
   - `Plot.text` mark labels each bar with its cents value to 2 d.p.
   - x-domain `[0, 26]`; tick formatter `${v}¢`.

4. Replace the existing tempering paragraph (current lines 46-49) with
   a new `## Schismatic temperament` section:
   - Opening paragraph: tempering out the schisma → schismatic
     temperament; introduces `schismaticThird` and `fiveLimitThird` via
     `ratioPill`; uses `${tex}` for the cents values and for the
     `(4/3)^8 / 2^3` alternative phrasing; mentions Helmholtz's
     narrow-fifth-by-0.24¢ application.
   - Inline `${playDyad(schismaticThird, fiveLimitThird, synth, {label: "8192/6561 + 5/4 (schisma beat)"})}`.
   - Trailing paragraph: "you should hear a slow ~2 Hz beating" framing.

5. Append `## Further reading` as the final section, after `## See also`:
   - Bullet 1 → `https://en.xen.wiki/w/Schisma` with one-sentence blurb.
   - Bullet 2 → `https://imslp.org/wiki/Die_Lehre_von_den_Tonempfindungen_(Helmholtz,_Hermann_von)`
     (verified canonical URL; the German URL pattern requires
     `Helmholtz,_Hermann_von` not `Helmholtz,_Hermann`). Mention that
     the Ellis 1875 English translation is hosted on the same page.

### Task 2 — verify

- `npx tsc --noEmit` clean (no new TS errors from the new bindings or imports).
- `npx vitest run src/components/__tests__/play-dyad.test.ts` still passes
  (6/6 — component is untouched; this confirms the playDyad import wiring
  didn't accidentally cascade).
- `npx observable build --output /tmp/schisma-build-ilb` succeeds; manual
  spot-check that the schisma page bundle now includes a Plot.barX chart
  and a button labelled "▶ 8192/6561 + 5/4 (schisma beat)".

## must_haves

**truths**
- The bar chart data MUST be read from `pythagorean.cents`,
  `syntonic.cents`, `schisma.cents` (the existing Interval bindings) —
  no hardcoded numeric literals for cents values.
- The schismatic-third dyad MUST use ratio `8192/6561` (NOT `6561/4096`)
  paired with `5/4`. Their cents difference is the schisma:
  `Math.abs(8192/6561 vs 5/4 in cents) ≈ 1.95¢`.

**artifacts**
- `src/pages/schisma.md` contains:
  - imports for `playDyad` and `* as Plot`,
  - new Interval bindings `schismaticThird = "8192/6561"` and `fiveLimitThird = "5/4"`,
  - `## The three commas at scale` section with a `Plot.barX` chart,
  - `## Schismatic temperament` section with a `playDyad(schismaticThird, fiveLimitThird, ...)` call,
  - `## Further reading` section linking `en.xen.wiki/w/Schisma` and the
    Helmholtz IMSLP page.

**key_links**
- `src/components/play-dyad.ts` — playDyad factory (built in 260512-eru).
- `src/pages/pythagorean-comma.md` — chart-style + Further-reading reference.
- `src/lib/interval.ts` — `Interval` constructor, `.cents` projection.
- `src/lib/commas.ts` — `commaByName` table (the existing schisma/syntonic/Pythagorean lookups already pass through this).
