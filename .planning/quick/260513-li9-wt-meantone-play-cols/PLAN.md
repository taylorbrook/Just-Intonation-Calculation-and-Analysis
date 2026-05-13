---
quick_id: 260513-li9
status: in-progress
date: 2026-05-13
slug: wt-meantone-play-cols
---

# Quick Task 260513-li9: Play columns on meantone + well-temperament variants tables

## Origin

CMD-5 of the 260513-foy audit handoff. The handoff brief said:

> Add a "Play" column with per-row play buttons to the variants table in
> src/pages/well-temperament.md (6 well-temperament schemes × 3 interval
> columns = 18 buttons total). Use the playTempered() cents→ratio factory
> pattern from src/pages/meantone.md.

The math "6 schemes × 3 intervals = 18 buttons" structurally matches
**meantone.md's `variantsTable`** (6 variants × 5th/M3/m3 columns), not
well-temperament.md (which has 3 schemes + cleanest/roughest-key columns).
The audit appears to have conflated the two pages.

User chose **"Add to both pages."**

## Scope

### Part A — src/pages/meantone.md

The `variantsTable` (lines 78-110) has 6 rows × columns
[Variant, Tempered 5th (¢), Major 3rd (¢), Minor 3rd (¢), Signature].
Add a final **"Play"** column. Each row's Play cell contains **3 inline
buttons** rendered side-by-side: ▶ 5th, ▶ M3, ▶ m3 — each auditioning
that variant's specific tempered interval as a 440 Hz dyad via the
existing `playTempered(label, cents)` factory (lines 117–129).

Total: **6 rows × 3 buttons = 18 buttons.**

### Part B — src/pages/well-temperament.md

The `comparisonTable` (lines 463–519) has 3 rows × columns
[Temperament, Year, Comma distributed, Cleanest key (¢), Roughest key (¢)].
Add a final **"Play"** column. Each row's Play cell contains **3 inline
buttons** rendered side-by-side: ▶ 5th, ▶ M3, ▶ m3 — each auditioning
the **cleanest key's** tempered fifth / major third / minor third in
that scheme.

This requires:
1. Adding a `playTempered(label, cents)` factory copied from meantone.md's
   shape (synth, baseHz=440, centsToRatio, playNotes [baseHz, baseHz*ratio], 1.5s).
2. Adding a `minorThirdAt(fifths, keyIndex)` helper analogous to the
   existing `majorThirdAt` — m3 = 9 fifths up reduced by 5 octaves
   (canonical chain-derived m3, matching meantone.md's
   `minor3 = 1200 - (3*fifth - 1200)` formula but generalized for the
   nonuniform-fifth case).
3. Identifying the cleanest-key index per scheme (lowest M3) and using
   that scheme's fifth at that index + M3 at that index + m3 at that index.

Total: **3 rows × 3 buttons = 9 buttons.**

## Out of scope

- The existing 6 inline triad-audition buttons on well-temperament.md
  (werckC/werckFs/kirnC/kirnFs/vallottiC/vallottiFs at lines 282-307 and
  the audition section at lines 433-452). NOT modified — they audition
  full triads in C and F♯, distinct from the per-interval audition this
  task adds.
- The 12-row per-temperament `fifthsTable` (lines 146-170). Each fifth
  there is a single tempered/pure value — adding 12 × 3 buttons per
  table = 108 buttons across 3 tables would be visual overkill.
- The strip charts (`fifthsDeviationChart`, `majorThirdsChart`,
  `fifthsChart` on meantone.md). User explicitly said "do not modify
  the existing strip chart."
- Adding 3 more well-temperament schemes (Bach/Lehman, Young, Neidhardt)
  to get to 6 — out of scope for a quick task.

## Verification

- `npx tsc --noEmit` — clean
- `npm run build` — clean, all links validated
- `npx vitest run` — all tests pass
- Visual check: each row's Play column shows 3 inline buttons; clicking
  audits the correct interval at the correct cents value.

## Atomic commit

Single `feat(audition):` commit covering both source files + this
planning directory.
