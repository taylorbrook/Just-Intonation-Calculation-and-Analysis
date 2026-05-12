---
quick_id: 260512-ilb
description: Add comma-magnitude bar chart + Schismatic temperament play-dyad section + Further reading on schisma page
date: 2026-05-12
status: complete
---

# Quick Task 260512-ilb — SUMMARY

## Outcome

`src/pages/schisma.md` extended with three additive sections, single
file edit, no refactor of existing content.

### Section 1 — `## The three commas at scale`

Horizontal Observable Plot bar chart (`Plot.barX`) with three rows on a
shared cents axis (domain `[0, 26]`):

| name | cents (read from existing `Interval.cents`) | fill |
|------|---------------------------------------------|------|
| Pythagorean | `pythagorean.cents` ≈ 23.4600¢ | `#4269d0` (blue) |
| syntonic | `syntonic.cents` ≈ 21.5063¢ | `#4269d0` (blue) |
| schisma | `schisma.cents` ≈ 1.9537¢ | `#c45656` (red highlight) |

Bar labels rendered via `Plot.text` to 2 d.p. with `dx: 6, textAnchor: "start"`.
`fill: "currentColor"` on the label text so it follows the Framework
light/dark theme. `Plot.ruleX([0])` anchors the left edge.

BigInt-Fraction stays the source of truth: data rows read
`pythagorean.cents` / `syntonic.cents` / `schisma.cents` from the existing
`commaByName` lookups — no hardcoded numeric literals for cents values.

### Section 2 — `## Schismatic temperament`

Replaces the prior single-paragraph mention (was lines 46-49) with a richer
section anchored on the playDyad component built in quick-260512-eru.

Two new `Interval` bindings in the math cell (line 37-38):

- `schismaticThird = new Interval("8192/6561")` — Pythagorean diminished
  fourth; `(3/2)^-8` reduced up by 5 octaves; ≈ 384.36¢.
- `fiveLimitThird = new Interval("5/4")` — pure 5-limit major third; ≈ 386.31¢.

These are exactly one schisma apart (`5/4 − 8192/6561 = 32805/32768`),
which is what makes the dyad audibly demonstrate the schisma as a slow
beat-rate.

Prose calls out:
- the canonical schismatic identity (eight pure fifths down, reduced up by
  5 octaves; equivalently `(4/3)^8 / 2^3`),
- Helmholtz's narrow-fifth recipe (each fifth tempered by ≈ 0.24¢ to make
  the chain land on pure `5/4`, fifth becomes 701.71¢),
- the audible ~2 Hz beat-rate against the dyad chord (the schisma is
  within the JND for melodic pitch but audible as a beat between
  sustained partials).

Inline `${playDyad(schismaticThird, fiveLimitThird, synth, {label: "8192/6561 + 5/4 (schisma beat)"})}`
button placed after the prose paragraph.

### Section 3 — `## Further reading`

Two bullets appended after `## See also` (matching placement in
`pythagorean-comma.md`, `edo-approximation.md`):

1. **Xenharmonic Wiki — Schisma** (`https://en.xen.wiki/w/Schisma`).
   Multi-paragraph blurb covering the family of schismatic temperaments
   (Helmholtz, Groven, Garibaldi), related commas (kleisma, diaschisma,
   Mercator's), and the JND-edge framing.

2. **Helmholtz, *Die Lehre von den Tonempfindungen* / *On the Sensations
   of Tone* (IMSLP)**
   (`https://imslp.org/wiki/Die_Lehre_von_den_Tonempfindungen_(Helmholtz,_Hermann_von)` —
   verified canonical URL; the page is `Helmholtz,_Hermann_von` *with*
   the `_von` suffix, NOT `Helmholtz,_Hermann`; the bare-`Hermann` form
   returns HTTP 404). The IMSLP page hosts both the 1863 German original
   and the Alexander Ellis 1875 English translation (public domain), with
   French and other later translations alongside.

## Math research aside (resolved before execution)

User's original prompt specified `(3/2)^8 / 2^4` against `5/4` as the
schismatic dyad. That formula yields `6561/4096 ≈ 815.64¢`, which is one
schisma *sharp of 8/5* (the minor sixth), NOT one schisma from 5/4 — so
the dyad as originally written would have been ~429¢ apart, not the
~2-cent beat the prose claims.

The correct schismatic major third is `8192/6561 ≈ 384.36¢`
(= `(3/2)^-8 × 2^5` = `(4/3)^8 / 2^3`), confirmed against three
independent sources:

- Tonalsoft Encyclopedia, *Schisma* — explicit `8192/6561 = 384.36¢` vs
  `5/4 = 386.3137139¢`, difference = `32805/32768` schisma.
- Wikipedia, *Schismatic temperament* — "the note eight fifths below C,
  F♭♭ (384.36¢)… is only 1.95¢ flat of E♮ (5/4)."
- Xenharmonic Wiki, *Schismatic family* — `(4/3)^8 ≈ 10/1` identity
  (equivalent restatement: eight fourths up reduced).

User confirmed the correction (recorded in this session's transcript),
and the implemented dyad sounds `8192/6561 + 5/4`.

## Files touched

- `src/pages/schisma.md` (+93 lines, −5 lines, single file)

## Verification

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | clean (exit 0, no new TS errors) |
| `npx vitest run` (all 23 test files, 293 tests) | 293/293 pass |
| `npx vitest run src/components/__tests__/play-dyad.test.ts` | 6/6 pass (component untouched) |
| `npx prettier --check src/pages/schisma.md` | clean |
| `npm run build` (Observable static build, 17 pages) | clean, 79 links validated |

### Bundle deltas

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| schisma page bundle | ~11 kB | 23 kB | +12 kB (Plot chart + dyad button + new section markup) |
| schisma imports | 391 kB | 916 kB | +525 kB (Plot import, same footprint as comma-pump 912 kB / pythagorean-comma 920 kB / edo-approximation 913 kB) |
| schisma files | 66 kB | 66 kB | unchanged |
| Total pages | 17 | 17 | unchanged |

Schisma page now matches the Plot-using pages' size profile exactly —
expected and consistent with the project's existing Plot-pages pattern.

### Grep gates (14/14 pass)

```
import { playDyad } from "../components/play-dyad.js";   — line 11
import * as Plot from "npm:@observablehq/plot";          — line 12 (implied by build)
schismaticThird = new Interval("8192/6561")              — line 37
fiveLimitThird = new Interval("5/4")                     — line 38
## The three commas at scale                              — line 55
Plot.barX(data, ...)                                      — line 89
## Schismatic temperament                                 — line 110
ratioPill(schismaticThird) + ratioPill(fiveLimitThird)    — lines 115, 118
playDyad(schismaticThird, fiveLimitThird, synth, ...)     — line 127
## Further reading                                        — line 153
en.xen.wiki/w/Schisma                                     — line 154
imslp.org/wiki/Die_Lehre_von_den_Tonempfindungen          — line 162
```

## Deferred items

None. Task scope complete.
