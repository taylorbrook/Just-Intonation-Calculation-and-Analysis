---
phase: 260512-mvw
plan: 01
status: complete
files_modified:
  - src/lib/monzo.ts
  - src/components/tonality-diamond.ts
  - src/pages/odd-limits.md
  - src/styles.css
verification:
  tsc: clean
  vitest: 302/302 across 24 files
  prettier: clean
  eslint: clean
  observable_build: clean (79 links validated)
---

# 260512-mvw — Odd-limits static diamonds + prime-vs-odd comparison table

## What shipped

1. **`renderDiamondSVG(oddLimit, opts?)`** — new pure-presentational export on
   `src/components/tonality-diamond.ts`. Takes only an odd-limit number and an
   optional `{ width, height }`. No synth dependency, no scale dependency, no
   `d3.zoom`, no click handlers, no `role="button"` cells. Each diamond cell
   is rendered in its dominant-prime axis color via the existing
   `diamond-cell--in-scale diamond-cell--axis-N` CSS classes (which cascade
   from `tonality-diamond.css`), so the static preview is visually informative
   on its own. SVG carries `role="img"` + `aria-label="N-odd-limit tonality
   diamond"` and per-cell `<title>` tooltips (`ratio | N-limit`).

2. **`primeLimitOfMonzo` promoted to kernel** — the helper that computes
   prime-limit directly from a monzo (handling the zero/unison monzo
   gracefully, unlike `xen-dev-utils`' `primeLimit`) moved from
   `src/components/tonality-diamond.ts` into `src/lib/monzo.ts`. The component
   now imports it from the kernel — single source of truth, Pitfall #5
   wrap-don't-reimplement. `src/pages/odd-limits.md` also consumes it for the
   new comparison table.

3. **Three inline diamond previews on `/pages/odd-limits.md`**:
   - 5-odd-limit (`{ width: 280, height: 280 }`) under `### 5-odd-limit — the
     just diatonic backbone`, immediately after the ratio-pill row.
   - 7-odd-limit (`{ width: 320, height: 320 }`) under `### 7-odd-limit —
     adding the harmonic seventh`, after the 6-new-pitches pill row.
   - 11-odd-limit (`{ width: 440, height: 440 }`) under `### 11-odd-limit —
     Partch's diamond`, after the "twenty-nine pitches" prose paragraph.

4. **New `## Prime-limit vs odd-limit, side by side` section** — inserted
   between the existing prose comparison section and `## n-odd-limit tonality
   diamonds`. Plain DOM table of 12 canonical ratios (`9/8`, `5/4`, `7/6`,
   `81/80`, `25/24`, `15/8`, `9/7`, `11/8`, `13/8`, `81/64`, `7/4`, `16/15`)
   sorted by ascending odd-limit (tiebreak on prime-limit). Columns:
   `Ratio | Odd-limit | Prime-limit | Agree?`. The Agree column ticks (✓) on
   the five "axis-1" rows (5/4, 7/6, 7/4, 11/8, 13/8) and is empty on the
   seven divergent rows — making the page's thesis visible in one glance.
   Followed by a one-paragraph reading guide tying agreement to single
   non-zero monzo entries.

5. **`## Further reading`** — appended after `## See also`, one bullet
   linking https://en.xen.wiki/w/Odd_limit with a one-sentence pointer to
   what the wiki page covers (Partch's diamond construction, *n*-odd-limit
   set sizes, relationship to prime-limit and Tenney height).

6. **`src/styles.css`** — two small additive blocks:
   - `.limit-comparison-table td.num` (tabular-nums + right-align) and
     `.limit-comparison-table td.agree` (centered tick in `--theme-green`).
   - `.tonality-diamond-static` wrapper (flex-centered, `max-width: 100%`
     on the SVG) so the embedded previews don't bleed past the column.

## Discipline honored

- **Pitfall #1 (BigInt-Fraction as source of truth)** — `iv.monzo` is read
  at the data-row construction step; `oddLimit(iv.monzo)` and
  `primeLimitOfMonzo(iv.monzo)` are pure monzo→Number projections. No
  `.cents` access in the comparison table (the table is about the two limits,
  not pitch height). No `new Interval(<centsNumber>)` anywhere.
- **T-02-22 / T-02-23 (XSS)** — the comparison-table cell builds DOM via
  `document.createElement` + `textContent` only; no `innerHTML` for dynamic
  values. `renderDiamondSVG` likewise uses `createElementNS` +
  `setAttribute` + `textContent`.
- **Pitfall #2 / D-08 (three-layer discipline)** — `renderDiamondSVG` does
  not instantiate any Web-Audio surface (it has no synth parameter); it is
  pure DOM/SVG.
- **Pitfall #5 (wrap-don't-reimplement)** — `primeLimitOfMonzo` is now in
  one place (`src/lib/monzo.ts`) and consumed by both the component and the
  page rather than redefined.

## Verification

- `npx tsc --noEmit` → clean (no errors).
- `npx vitest run` → **302/302 across 24 files** (tonality-diamond test
  suite 5/5 unchanged — the import-site refactor is semantics-preserving).
- `npx prettier --check` → all matched files use Prettier code style
  (one auto-format applied to `tonality-diamond.ts` during dev; re-verified
  clean after).
- `npx eslint` → clean.
- `npx observable build` → clean with 79 links validated. `/pages/odd-limits`
  bundle grew from ~12 kB / 391 kB imports → **42 kB / 705 kB** (the `d3`
  dependency now travels with the page via `tonality-diamond.ts`); still
  smaller than Plot-using pages like `/pages/comma-pump` (912 kB).

## Notes / non-goals

- The `## n-odd-limit tonality diamonds` walks above the diamond visuals are
  preserved byte-identical to baseline (pill rows + prose). The new SVG
  previews are *additive* — they sit between the pill rows and the prose
  that explains each odd-limit.
- The static previews intentionally do NOT include the interactive
  `tonalityDiamond` factory's heading ("Tonality diamond") or helper text
  ("Click a cell to audition. Hover for ratio details.") — those are
  inappropriate for an inline preview that already lives under its own H3
  heading.
- No new test file was added for `renderDiamondSVG`. The function shares its
  layout math (rank table + isometric `(col-row, col+row)` translate) with
  the existing `tonalityDiamond` factory, whose tests cover the CR-01
  unique-transform invariant. Adding a separate suite would duplicate
  coverage for the value-add (no synth, no zoom) which is verified by visual
  inspection on the live page.
