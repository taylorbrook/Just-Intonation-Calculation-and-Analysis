---
quick_id: 260512-aph
slug: add-prime-limits-theory-page
date: 2026-05-12
status: in-progress
---

# Quick task — add prime-limits theory page

## Goal

Add `src/pages/prime-limits.md` introducing the prime-limit classification:
*the largest prime that appears in the ratio's monzo*. Walk the reader
through 3-limit → 5-limit → 7-limit → 11-limit, audition one or two ratios
at each step via `playInterval`, and tie the structure back to `commas.ts`
(which is already 5/7/11-limit grouped) and to the existing harmonic-series
and septimal-comma pages. Mirror prose voice and cell structure of
`syntonic-comma.md` / `septimal-comma.md`.

## Scope

### Files to create

- `src/pages/prime-limits.md` — the page itself.

### Files to edit

- `observablehq.config.ts` — register the page in the **Theory notes**
  sidebar group. Place it directly after **Monzos** (prime-limits is the
  natural follow-on from understanding monzos: same prime axes, now
  classified by largest used).
- `src/pages/harmonic-series.md` — remove the
  `*(forward link: page lands in a later quick task; the harmonic series
  is the prerequisite.)*` parenthetical from the **Prime-limits** bullet
  in the "Why this is the ground floor" section. The forward link now
  points at a real page.

### Files NOT to edit (and why)

- `src/pages/odd-limits.md` — does not exist yet. The new page will
  forward-link to it (same pattern as `otonality-utonality.md` and
  `harmonic-series.md` already use). Surface in SUMMARY.md so the gap
  stays visible.
- `src/lib/commas.ts` — already 5/7/11-limit grouped via section
  comments; no kernel change needed. The page references the existing
  grouping, doesn't restructure it.

## Approach

Theory-page contract (see `syntonic-comma.md`, `septimal-comma.md`):

1. **Imports cell** — `Interval`, `createSynth`, `ratioPill`, `playInterval`.
2. **Synth cell** — owns this page's AudioContext per ARCHITECTURE
   Pattern 4 / Pitfall #2: `const synth = createSynth(); invalidation.then(() => synth.dispose())`.
3. **Intervals cell** — declares the example intervals up front so they're
   reusable in prose and play buttons:
   - 3-limit: `3/2` (just perfect fifth), `9/8` (Pythagorean major second).
   - 5-limit: `1/1`, `5/4`, `3/2` (the triad members for 4:5:6).
   - 7-limit: `7/4` (harmonic seventh).
   - 11-limit: `11/8` (undecimal semi-augmented 4th).
4. **Definition section** — opens with the rule (*the **p-limit** of a
   ratio is the largest prime that appears, with non-zero exponent, in
   its monzo*). Single ${tex`…`} block making the definition
   monzo-precise. Cross-references the existing [Monzos](/pages/monzos)
   page for the prime-vector notation.
5. **Walk-through sections** — one `## n-limit` heading per limit
   (3, 5, 7, 11). Each section has:
   - The defining prose (what enters at this limit and why).
   - A worked example with the ratio's monzo written out explicitly so
     the reader sees *which prime exponent forced the bump up*.
   - `playInterval(...)` buttons for the example ratios.
6. **"Where this shows up in the kernel" section** — references
   `src/lib/commas.ts` and its 5-/7-/11-limit grouping. Frames commas
   as artifacts of prime-limit closure: each comma's monzo only spans
   primes ≤ its declared limit. Quotes the (visible) section-comment
   headers as the anchor.
7. **"See also" footer** — links to:
   - [Harmonic series](/pages/harmonic-series) — the prerequisite
     (primes-as-partials).
   - [Odd-limits](/pages/odd-limits) — Partch's parallel classification
     (forward-link; not yet authored).
   - [Septimal comma](/pages/septimal-comma) — concrete example of a
     7-limit closure-gap (entry point to 7-limit).
   - [Monzos](/pages/monzos) — the notation the definition rests on.

## Reactive cell contract (no kernel changes)

The kernel APIs used (`Interval`, `createSynth`, `playInterval`,
`ratioPill`) are already in the codebase from the v1.0 milestone. No
additions to `src/lib/`, `src/audio/`, or `src/components/`.

## Acceptance

- New page renders in dev (`npm run dev`) without error.
- `npm run lint:types` passes (TS in fenced cells type-checks via
  `tsc --noEmit`).
- Sidebar shows **Prime-limits** as the entry immediately after **Monzos**
  under "Theory notes".
- The page contains a play button at every prime-limit step (3-, 5-, 7-,
  11-limit) — at minimum: `3/2`, `5/4` (within the 4:5:6 triad), `7/4`,
  `11/8`.
- `harmonic-series.md`'s forward-link parenthetical to `/pages/prime-limits`
  is removed (or downgraded to a plain link) since the page now exists.

## Out of scope

- Stub `odd-limits.md` page — its own quick task. We forward-link with
  the same pattern already used elsewhere.
- Tempering / regular-mapping discussion — prime-limit is the
  *no-tempering* layer; mappings come in a later page.
- 13-limit, 17-limit etc. — the user asked for 3/5/7/11; higher primes
  are mentioned in passing ("and so on") but not walked through.
- 4:5:6 simultaneous-chord button — the page audtions each ratio in the
  triad as a dyad against `1/1` via `playInterval`, which is what the
  user asked for ("playInterval at each step"). A simultaneous-chord
  button is already demonstrated on `/pages/otonality-utonality`.

## Risks

- **Forward link to non-existent `/pages/odd-limits`** — Framework's
  build does not fail on dead internal links; the pattern is already
  in `otonality-utonality.md:196` and `harmonic-series.md`. Acceptable.
- **Sidebar ordering** — placing the new entry after **Monzos** rather
  than at end-of-list keeps the Theory notes pedagogically ordered
  (foundations → notation → otonality/utonality → prime-limits →
  commas). The "commas-section" ordering of syntonic / Pythagorean /
  schisma / septimal stays intact below.
