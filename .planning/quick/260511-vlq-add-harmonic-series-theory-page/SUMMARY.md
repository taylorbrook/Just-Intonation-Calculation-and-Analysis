---
quick_id: 260511-vlq
slug: add-harmonic-series-theory-page
date: 2026-05-12
status: complete
commits:
  - d600af5 docs(260511-vlq): pre-dispatch plan
  - 18107a0 feat(quick-260511-vlq): add harmonic-series theory page
  - 816af02 feat(quick-260511-vlq): register harmonic-series in sidebar + link from syntonic-comma
---

# Quick task — add harmonic-series theory page

## Result

New "ground floor" theory page `src/pages/harmonic-series.md` is live, mirroring
the structure and prose voice of `syntonic-comma.md`. Partials 1–16 over a
fundamental at ${tex`f = 110\ \mathrm{Hz}`} are rendered as a 5-column table
(Partial | Ratio | ¢ from 12-TET | Name | ▶) with a per-row `playInterval`
button. The page is registered first in the **Theory notes** sidebar group,
positionally reflecting its ground-floor role.

## Files changed

| File | Change |
|------|--------|
| `src/pages/harmonic-series.md` | **created** (179 lines) — full theory page |
| `observablehq.config.ts` | inserted `{ name: "The harmonic series", path: "/pages/harmonic-series" }` first under Theory notes |
| `src/pages/syntonic-comma.md` | added 4-line See-also paragraph back-linking to `/pages/harmonic-series` |

## Verification

- `npm run lint:types` — clean (tsc --noEmit, no errors).
- `npm run build` — succeeds; `render /pages/harmonic-series → dist/pages/harmonic-series.html`
  appears in the manifest at 18 kB / 388 kB imports (line-up with the other
  theory pages, e.g. monzos at 18 kB / 388 kB).
- 3 broken-link warnings surfaced by the build are **intentional**:
  - `/pages/harmonic-series → /pages/prime-limits` — forward-link (page doesn't exist yet).
  - `/pages/harmonic-series → /pages/odd-limits` — forward-link (page doesn't exist yet).
  - `/pages/otonality-utonality → /pages/odd-limits` — **pre-existing**, not introduced by this task.

## Scope variance from prompt

The user's prompt asked to **link from** `/pages/syntonic-comma`, `/pages/prime-limits`,
and `/pages/odd-limits`. Only the first existed at quick-task start:

- ✅ `syntonic-comma.md` — back-link added.
- ⚠️ `prime-limits.md` — page doesn't exist; cannot add a link from a non-existent
  page. The new `harmonic-series.md` instead **forward-links to** `/pages/prime-limits`
  so the cross-reference shows up the moment that page lands.
- ⚠️ `odd-limits.md` — same situation; same handling. (Note `otonality-utonality.md`
  already forward-links here, so this isn't unprecedented.)

When `prime-limits.md` and `odd-limits.md` land in their own quick tasks, the
"See also" sections of those pages should pick up a back-link to
`/pages/harmonic-series`. Flagging here so the cross-link work isn't dropped.

## Notes on the partials table

- `baseHz = 110` (low A2) was the user's call. Partial 16 plays at 1760 Hz —
  comfortable for `sw-synth`'s plain oscillators. The default `baseHz = 440`
  would push partial 16 to 7040 Hz where the tone reads as a thin whistle.
- Cents-from-12-TET column uses `interval.centsFrom12tet` with a 1-decimal
  signed format (`+` on positives) matching `scaleTable.ts`'s convention.
- Conventional-name column uses standard xenharmonic descriptors for prime-7,
  11, and 13 partials ("harmonic 7th", "undecimal semi-augmented 4th",
  "tridecimal neutral 6th") — these are the labels used in Partch and in the
  active xenharmonic community.
- Table rendered via the same manual `document.createElement` /
  `textContent` pattern as `src/components/scale-table.ts` (T-02-22/23
  defense-in-depth) rather than via `Inputs.table`. Keeps the dependency
  surface minimal and matches the established theory-page idiom.

## Out of scope (intentionally deferred)

- Stub `prime-limits.md` / `odd-limits.md` pages — the user is incrementally
  building the theory section; auto-stubbing would compete with intent.
  Surface for their own quick tasks.
- A "Play all 16 partials in sequence" master button — nice-to-have, but
  per-row buttons satisfy the v1 audition goal.
- Subharmonic / utonal mirror of the table — already covered by
  `/pages/otonality-utonality`; the new page just forward-links there.
