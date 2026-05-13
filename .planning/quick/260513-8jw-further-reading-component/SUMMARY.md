---
quick_id: 260513-8jw
slug: further-reading-component
description: Reusable furtherReading() helper + adopt on 7 theory pages + backfill missing classic-text refs
created: 2026-05-13
completed: 2026-05-13
status: complete
commits:
  - d9fc91f  # component + CSS + styles.css
  - f7bb735  # monzos.md + Doty
  - 0b536e1  # odd-limits.md + Partch
  - 8d0e785  # prime-limits.md (adoption only)
  - 630301f  # otonality-utonality.md (adoption only)
  - fe379f3  # comma-pump.md (adoption only, html template for TeX note)
  - 1d0f626  # pythagorean-tuning.md NEW section + XW + Helmholtz
  - 8bbb00e  # meantone.md + Blackwood
---

# Quick Task 260513-8jw — Further-reading component + adoption

## Outcome

Standardized the "Further reading" block across seven theory pages by introducing a small TS presentational helper `furtherReading()` and adopting it on every target page. Backfilled missing classic-text references where the user's spec called for one.

## What changed

### New component (commit d9fc91f)

- `src/components/further-reading.ts` (56 lines) — exports `furtherReading(items: FurtherReadingItem[]): HTMLElement` where each item is `{ title: string; url: string; note?: string | Node }`. Returns a `<section class="further-reading">` wrapping a `<ul>` with one `<li>` per item; the page's Markdown `## Further reading` heading stays in Markdown so Framework's TOC keeps picking it up. External URLs get `rel="noopener noreferrer"`. Plain-string notes go via `textContent` (XSS T-02-22/T-02-23 discipline). Node notes are appended as-is so callers can pass `` html`text with ${tex`81/80`} inline` `` to preserve inline KaTeX, links, and bold inside notes.
- `src/components/further-reading.css` (29 lines) — styles `.further-reading > .further-reading__list` with disc bullets at 1.5rem indent, 0.5rem inter-item spacing, line-height 1.5, link weight 500, note color `var(--theme-foreground-alt)` for the muted explanatory text.
- `src/styles.css` — one-line `@import "./components/further-reading.css";` after monzo-builder.css.

### Page adoption (commits f7bb735, 0b536e1, 8d0e785, 630301f, fe379f3, 1d0f626, 8bbb00e)

| Page | Adoption | Classic-text ref status |
|---|---|---|
| `src/pages/monzos.md` | ✓ replaced bullet | **added Doty,** *The Just Intonation Primer* (3rd ed., 2002) |
| `src/pages/odd-limits.md` | ✓ replaced bullet | **added Partch,** *Genesis of a Music* (2nd ed., Da Capo 1974) |
| `src/pages/prime-limits.md` | ✓ replaced 2 bullets | already had Partch — preserved |
| `src/pages/otonality-utonality.md` | ✓ replaced 2 bullets | already had Kyle Gann's WTP essay — preserved |
| `src/pages/comma-pump.md` | ✓ replaced 2 bullets (`html`-template note for inline TeX) | already had Ben Johnston *Suite for Microtonal Piano* — preserved |
| `src/pages/pythagorean-tuning.md` | ✓ **added new `## Further reading` H2** (was missing entirely) | **added Helmholtz,** *On the Sensations of Tone* (Ellis tr., 1875, IMSLP) |
| `src/pages/meantone.md` | ✓ replaced bullet (`html`-template note for inline TeX) | **added Blackwood,** *The Structure of Recognizable Diatonic Tunings* (Princeton UP, 1985) |

All seven pages still link the Xenharmonic Wiki entry; pythagorean-tuning.md gains its first XW link.

## How

- Each page got `import { furtherReading } from "../components/further-reading.js";` joined inline to its existing single import cell (Framework module-scope rule — a second import cell would re-bind `Interval` and friends).
- Markdown `-` bullets under `## Further reading` were replaced with a single JS code fence calling `furtherReading([...])`. The `## Further reading` H2 itself stayed in Markdown so the Framework TOC continues to surface it.
- For notes containing `${tex...}` (comma-pump's Johnston note, meantone's XW note), the `note` field uses `` html`...${tex`...`}...` `` so the inline KaTeX still renders. `html` and `tex` are Framework stdlib globals — no extra imports.
- Atomic commit per file: one commit for the component infra, then one per page (7 commits) so each page edit is independently revertable. Total 8 commits on `main` for this task.

## must_haves verification

| # | Must-have | Status |
|---|-----------|--------|
| MH1 | `src/components/further-reading.ts` exists, exports `furtherReading(items)` returning HTMLElement, XSS-safe | ✓ (`grep -c 'export function furtherReading' src/components/further-reading.ts` = 1; no `innerHTML` for user content) |
| MH2 | `src/components/further-reading.css` exists and is registered in `src/styles.css` | ✓ (`grep -c 'further-reading.css' src/styles.css` = 1) |
| MH3 | All 7 target pages contain `furtherReading([...])` exactly once under `## Further reading` | ✓ (`grep -lc "furtherReading(" src/pages/{monzos,odd-limits,prime-limits,otonality-utonality,comma-pump,pythagorean-tuning,meantone}.md` = 7 × 1) |
| MH4 | `pythagorean-tuning.md` has a `## Further reading` section (it did not before) | ✓ (line 129) |
| MH5 | Each of the 7 pages has at least one Xenharmonic Wiki link | ✓ (all 7 reference `en.xen.wiki/w/...`) |
| MH6 | Each page has at least one classic-text reference where applicable | ✓ (monzos: Doty; odd-limits: Partch; prime-limits: Partch; otonality-utonality: Gann; comma-pump: Johnston; pythagorean-tuning: Helmholtz; meantone: Blackwood) |
| MH7 | `npm run build` clean | ✓ (18 pages, 88 links validated) |
| MH8 | No regressions: vitest 302/302, tsc baseline unchanged | ✓ (302/302 across 24 test files; tsc exit 0) |

## Out of scope (intentionally not done)

Pages with existing Further reading sections that were NOT in the user's list — `syntonic-comma.md`, `pythagorean-comma.md`, `schisma.md`, `septimal-comma.md`, `harmonic-series.md`, `edo-approximation.md`, `commas.md` — kept their Markdown bullets unchanged. They can adopt the helper in a follow-up task without disrupting their existing references.

## Verification log

- `npx tsc --noEmit` → exit 0 after every commit
- `npm test` → 302/302 across 24 test files
- `npm run build` → 18 pages rendered, 88 links validated, no errors
- `npx prettier --check` on all 9 touched files → all clean
- `npm run lint` → eslint clean (one unrelated `.eslintignore` deprecation warning, pre-existing)
- Spot-check: `grep -c 'furtherReading\|further-reading' dist/pages/<page>.html` returns 8 on each of the 7 target pages (import + call site + module reference)
- Spot-check: `dist/_import/components/further-reading.<hash>.js` emitted correctly with the expected `export function furtherReading(items)` signature

## Page-bundle deltas

All 7 pages picked up roughly the same Imports footprint because each page now bundles the `further-reading.js` module:

| Page | Before | After |
|---|---|---|
| comma-pump | 912 kB | 920 kB |
| meantone | 920 kB | 928 kB |
| monzos | 918 kB | 919 kB |
| odd-limits | 705 kB | 706 kB |
| otonality-utonality | (pre-task) | 913 kB |
| prime-limits | (pre-task) | 948 kB |
| pythagorean-tuning | 400 kB | 401 kB |

Delta is 1–8 kB per page — the helper itself is tiny; most of each page's bundle is dominated by the inherited Plot / d3 / xen-dev-utils stacks already on the page.

## Open items

None. This task is complete and ready to ship.
