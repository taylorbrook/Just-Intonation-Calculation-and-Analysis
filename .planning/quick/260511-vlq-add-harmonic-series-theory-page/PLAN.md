---
quick_id: 260511-vlq
slug: add-harmonic-series-theory-page
date: 2026-05-12
status: in-progress
---

# Quick task — add harmonic-series theory page

## Goal

Add `src/pages/harmonic-series.md` as the "ground floor" theory page: integer
multiples of a fundamental as the source of all JI ratios. Mirror the structure
and prose voice of `src/pages/syntonic-comma.md`. Render partials 1–16 in a
table (Partial | Ratio over fundamental | Cents from 12-TET | conventional
name) with an inline play button on each row. Use `baseHz = 110` so partial 16
(1760 Hz) stays musical.

## Scope

### Files to create
- `src/pages/harmonic-series.md` — the page itself.

### Files to edit
- `observablehq.config.ts` — register the page in the **Theory notes** sidebar
  group. Insert it **first** in the group (positionally reflecting its "ground
  floor" role) before *Monzos*.
- `src/pages/syntonic-comma.md` — extend the **See also** section with a link
  back to `/pages/harmonic-series`, framing the syntonic comma as a 3rd-vs-5th
  harmonic story (the natural pivot from the new page).

### Files NOT to edit (and why)
- `src/pages/prime-limits.md`, `src/pages/odd-limits.md` — these pages **do not
  exist** in the repo at quick-task start time. The user's prompt asked for a
  link from each of them; we cannot link from a non-existent page. The new
  `harmonic-series.md` will instead **forward-link** to them (the same pattern
  `otonality-utonality.md:196` already uses with `/pages/odd-limits`). Surface
  in SUMMARY.md so the gap is visible when those pages get created.

## Approach

The page follows the established **theory-page contract** (see
`syntonic-comma.md`, `monzos.md`, `otonality-utonality.md`):

1. **First TS cell** — imports `Interval`, `createSynth`, `ratioPill`, `playInterval`.
2. **Second TS cell (synth)** — owns this page's AudioContext per ARCHITECTURE
   Pattern 4 / Pitfall #2 (`const synth = createSynth(); invalidation.then(() => synth.dispose())`).
3. **Third TS cell** — builds `partials: Array<{n: number; iv: Interval; name: string}>`
   for n = 1..16, `iv = new Interval(`${n}/1`)`. Names are the conventional
   musical labels (fundamental, octave, octave + just perfect 5th, etc.).
4. **Prose** — opens with the "vibrating string rings a stack of integer
   multiples" framing (echoes the otonality page intro but reads as the
   foundation rather than a derived idea), then the table.
5. **Partials table** — built inline as a `<table>` via `document.createElement`
   following the `src/components/scale-table.ts` pattern (T-02-22/23
   defense-in-depth: every dynamic cell rendered with `textContent`, never
   `innerHTML`). Columns:
   - Partial (n)
   - Ratio over fundamental (`${n}/1`)
   - Cents from 12-TET (signed, 1-decimal — `interval.centsFrom12tet` with
     leading `+` on positives to match the scaleTable convention)
   - Conventional name (or em-dash if none applies — partials 11 and 13 sit
     comfortably outside Western names; we use the "undecimal / tridecimal"
     descriptors)
   - Inline `▶` (from `playInterval(iv, synth, { baseHz: 110 })`)
6. **baseHz = 110 rationale** — partial 16 plays at 1760 Hz; partial 1 at
   110 Hz (low A). Both sit inside `sw-synth`'s comfortable range. The default
   `baseHz = 440` would push partial 16 to 7040 Hz, near the upper edge of
   musical pitch.
7. **"See also" footer** — links to: dashboard `/`, `/pages/otonality-utonality`
   (otonal chords are subsets of the harmonic series), `/pages/syntonic-comma`
   (the 3rd/5th-harmonic story), `/pages/monzos`. Forward-link to
   `/pages/prime-limits` and `/pages/odd-limits` (both deferred; placeholder
   forward-links keep the page's "ground floor" framing legible when those
   pages land later).

## Reactive cell contract (no kernel changes)

The kernel APIs used (`Interval`, `Interval.centsFrom12tet`, `createSynth`,
`playInterval`, `ratioPill`) are already in the codebase as of the v1.0
milestone. No additions to `src/lib/`, `src/audio/`, or `src/components/`.

## Acceptance

- New page renders in dev (`npm run dev`) without error.
- `npm run lint:types` passes (Framework transpiles `.ts` blocks; the TS in the
  fenced cells must type-check via `tsc --noEmit`).
- Sidebar shows "The harmonic series" as the **first** entry under "Theory notes".
- The page contains a table with **16 rows** (partials 1–16), each with a `▶` button.
- `syntonic-comma.md` "See also" section gains a single new sentence linking
  back to `/pages/harmonic-series`.

## Out of scope

- Stub `prime-limits.md` / `odd-limits.md` pages — those belong in their own
  quick tasks (the user is incrementally building out theory pages; auto-stubs
  would compete with that intent).
- Subharmonic / utonal mirror of the table — already covered by
  `/pages/otonality-utonality`.
- HTML audio "play all 16 partials in sequence" master button — additive nice-
  to-have, but the per-row play button covers the v1 goal of "audition each
  partial." Can be added as a follow-up if the user finds the table tedious.

## Risks

- **Type-check on inline ratio strings** — `new Interval(`${n}/1`)` is a
  template literal; `FractionInput` accepts `string`, so this is straightforward.
- **CSS / table styling** — uses the existing `scale-table` class spelling so
  the page picks up the global `src/styles.css` rules with no per-page CSS.
