---
quick_id: 260513-li9
status: complete
date: 2026-05-13
slug: wt-meantone-play-cols
deliverable: Play columns on meantone variantsTable + well-temperament comparisonTable
---

# Quick Task 260513-li9: Play columns on meantone + well-temperament variants tables

## What This Task Delivered

CMD-5 of the 260513-foy audit handoff. The audit brief said "well-temperament,
6 schemes × 3 intervals = 18 buttons" — but well-temperament.md actually has
only **3** schemes and no fifth/M3/m3 columns; the 6×3 math matches
**meantone.md's** variantsTable. After surfacing the mismatch, the user chose
"add to both pages."

### meantone.md — 18 buttons (6 variants × 3 intervals)

- Extended `playTempered(label, cents)` factory with optional `ariaLabel`
  (backwards-compatible — `ariaLabel ?? label` keeps the 3 existing call
  sites byte-equivalent).
- Added "Play" column to `variantsTable`. Each of the 6 rows (1/4-comma Aron,
  1/3-comma Salinas, 1/6-comma Silbermann, 1/5-comma Verheijen, 2/7-comma
  Zarlino, 1/8-comma) gets a `<td class="play-cell">` with 3 inline
  buttons: ▶ 5th, ▶ M3, ▶ m3. Each auditions the variant's specific
  tempered interval as a 440 Hz dyad via the existing factory (centsToRatio
  at the audio boundary, kernel stays exact).

### well-temperament.md — 9 buttons (3 schemes × 3 intervals)

- Added `minorThirdAt(fifths, keyIndex)` helper analogous to existing
  `majorThirdAt` — m3 = 9 fifths up reduced by 5 octaves into [0, 1200).
  Generalizes meantone.md's `1200 − (3*fifth − 1200)` chain-derived m3
  formula to the nonuniform-fifth case.
- Added `playTempered(label, cents, ariaLabel)` factory next to existing
  `playTriadAt` — mirrors meantone.md's shape (single-cent dyad: baseHz +
  baseHz × centsToRatio(cents)).
- Added "Play (cleanest key)" column to `comparisonTable`. Each of the 3
  rows (Werckmeister III, Kirnberger III, Vallotti) gets a
  `<td class="play-cell">` with 3 inline buttons: ▶ 5th, ▶ M3, ▶ m3.
  Each auditions the **cleanest key's** tempered fifth / major 3rd /
  minor 3rd in that scheme. Cleanest-key index resolved via new
  `cleanestIndex(thirds)` reducer (ties resolve to first occurrence;
  Vallotti's F/C/G tie resolves to C since C is at KEYS index 0).

### Cents values auditioned (cleanest key per scheme)

| Scheme | Cleanest key | 5th (¢) | M3 (¢) | m3 (¢) |
|--------|--------------|---------|--------|--------|
| Werckmeister III | C | 696.090 (PF − ¼ PC) | 390.225 | 294.135 (32/27 Pythagorean) |
| Kirnberger III | C | 696.578 (PF − ¼ SC) | 386.314 (pure 5/4) | 294.135 (32/27 Pythagorean) |
| Vallotti | C | 698.045 (PF − ⅙ PC) | 392.180 | 298.045 |

Pedagogical note: in Werckmeister and Kirnberger the m3 above the cleanest
key is exactly the Pythagorean `32/27` because the 9 ascending fifths
spanning C → E♭ pass through enough pure fifths to net out as
`9×PF − PC` (Werckmeister) or `9×PF − SC − schisma = 9×PF − PC` (Kirnberger,
via the identity `PC = SC + schisma`). Vallotti's spread-tempering produces
a slightly wider m3 (≈ 298¢).

### Component CSS — new `.play-cell` class

- Added to `src/components/play-buttons.css`: compact button cluster
  styling (smaller padding + font-size, inline margin between buttons,
  `white-space: nowrap`). Keeps 3 buttons per row visually compact and
  consistent with the existing `.play-btn` theme tokens.

## Files Modified

- `src/pages/meantone.md` (+12/−2): `playTempered` ariaLabel param; "Play"
  column on `variantsTable` with 18 buttons.
- `src/pages/well-temperament.md` (+44/−1): `minorThirdAt` helper;
  `playTempered` factory; "Play (cleanest key)" column on `comparisonTable`
  with 9 buttons + `cleanestIndex` reducer.
- `src/components/play-buttons.css` (+18/−0): `.play-cell` compact-cluster
  class.

## Verification

- `npx tsc --noEmit` → clean
- `npx vitest run` → 312/312 tests pass across 24 files
- `npm run build` → 21 pages render, 111 links validated
- `npm run dev` → both pages return HTTP 200, no errors in server log
- Source commit `c7e112e`

Page bundle sizes:
- meantone: 32 → 40 kB (+8 kB for 18 buttons + ariaLabel param)
- well-temperament: 39 → 47 kB (+8 kB for 9 buttons + helpers)
- Total imports unchanged (centsToRatio already imported in both pages)

## Discipline Honored

- **Pitfall #1 (BigInt source of truth):** kernel-exact `Interval` values
  for `pureFifth`/`syntonic`/`pythComma`/etc. unchanged; cents derived
  once at display/audio boundary via `centsToRatio`.
- **Pitfall #2 (one createSynth per page):** both pages already had a
  single `createSynth()` cell; no new synth instantiation.
- **D-07/D-08/D-18 audio defaults:** dyad audition (root + interval),
  baseHz=440, duration=1.5s — same shape as existing `playTriadAt` and
  `playInterval`.
- **D-08 three-layer discipline:** viz/data/audition kept separate;
  buttons are page-level, factories don't import synth, synth flows in
  via closure capture from the page-level cell.
- **T-02-22/T-02-23 XSS:** plain DOM `createElement`/`textContent`/
  `appendChild` throughout; no `innerHTML` for derived values.

## Out of Scope (Intentional)

- Existing 6 inline triad-audition buttons on well-temperament.md
  (`werckC`/`werckFs`/`kirnC`/`kirnFs`/`vallottiC`/`vallottiFs`) and the
  Audition section that hosts them — unchanged; they audition full
  C-major / F♯-major triads, complementing the per-interval cleanest-key
  audition this task adds.
- The 12-row per-temperament `fifthsTable` (3 tables on well-temperament.md)
  — 12 × 3 buttons per table × 3 tables would be visual overkill.
- Strip charts / deviation charts / Plot charts — user explicitly said
  "do not modify the existing strip chart."
- Adding 3 more well-temperament schemes (Bach/Lehman, Young, Neidhardt)
  to reach 6 — out of scope for a quick task.

## Status

CMD-5 from the 260513-foy six-command handoff is **done**. Remaining
handoff item: **CMD-6** (Plot scatter ratio-pills audition rows on
`edo-approximation.md`, `schisma.md`, `septimal-comma.md`,
`syntonic-comma.md` — could split per-page if it exceeds quick-task
envelope).
