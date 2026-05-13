---
quick_id: 260513-8jw
slug: further-reading-component
description: Reusable `furtherReading()` helper + adopt on 7 theory pages + backfill missing classic-text refs
created: 2026-05-13
status: ready
---

# Quick Task 260513-8jw — Further-reading component + adoption

## Goal

Standardize the "Further reading" block across all theory pages by introducing a small TS presentational helper (`src/components/further-reading.ts`) and adopting it on the seven target pages. Backfill missing references where applicable.

## Context (already verified before planning)

- Six of the seven pages already have `## Further reading` Markdown sections; only `pythagorean-tuning.md` is missing one.
- All seven pages link to the Xenharmonic Wiki entry already (except `pythagorean-tuning.md`).
- Three pages lack a classic-text reference: `monzos.md`, `odd-limits.md`, `meantone.md`. Plus `pythagorean-tuning.md` will get both (XW + classic).
- The four comma pages (`syntonic-comma`, `pythagorean-comma`, `schisma`, `septimal-comma`) and the dashboard-adjacent pages (`harmonic-series`, `comma-pump`, `edo-approximation`, `commas`) are out of scope for this task per user's list — but the new component should be usable on them later.

## Component design (decided with user)

- Helper signature: `furtherReading(items: FurtherReadingItem[]): HTMLElement`
- Returns a `<section class="further-reading">` wrapping a `<ul>` (no `<h2>` — the page's Markdown `## Further reading` heading is kept so the Framework TOC still picks it up).
- `FurtherReadingItem` shape: `{ title: string; url: string; note?: string | Node }`
  - `title` is a plain string rendered inside an `<a href={url}>`
  - `note` accepts either plain text OR a DOM node (so callers can pass `html\`text with ${tex\`81/80\`}\`` for inline TeX/links/bold).
- CSS: `src/components/further-reading.css` styles `.further-reading > ul` with consistent indentation, line-height, and a subtle muted note color (matching project token vocabulary `--theme-foreground-muted`, `--monospace`).
- Wired into `src/styles.css` via `@import` line.

## Tasks

### Task 1 — Build component + CSS

**Files:**
- `src/components/further-reading.ts` (new)
- `src/components/further-reading.css` (new)
- `src/styles.css` (add `@import "./components/further-reading.css";`)

**Action:**
1. Write `furtherReading()` TS helper following `ratioPill`/`monzo-builder` conventions: type-only imports, JSDoc header, `createElement` + `textContent` discipline (XSS T-02-22/T-02-23). Accept `note: string | Node` — `Node` instances are appended; strings go via `textContent`.
2. Write CSS with `.further-reading` + `.further-reading__list` + `.further-reading__item` + `.further-reading__note`. Use existing theme tokens.
3. Add the `@import` to `src/styles.css` after the last component CSS import.

**Verify:**
- `npm run lint:types` (or `npx tsc --noEmit`) — clean baseline (5 pre-existing `npm:` specifier errors only).
- File presence: `test -f src/components/further-reading.ts && test -f src/components/further-reading.css`.
- `grep -c 'further-reading.css' src/styles.css` returns `1`.

**Done:** Component compiles and CSS is registered.

**Commit:** `feat(260513-8jw): src/components/further-reading.ts — reusable Further-reading helper + CSS + styles.css wiring`

---

### Task 2 — Adopt component on 7 pages + backfill missing references

**Files** (atomic commit per page, 7 commits):
1. `src/pages/monzos.md` — replace bullet under `## Further reading` with `${furtherReading([...])}` call. Add classic-text ref: David B. Doty, *The Just Intonation Primer* (3rd ed., Just Intonation Network, 2002) — the canonical practitioner's intro to JI; covers monzos under the "prime-factor" framing.
2. `src/pages/odd-limits.md` — replace bullet. Add classic-text ref: Harry Partch, *Genesis of a Music* (2nd ed., Da Capo Press, 1974) — Partch defined the odd-limit classification and the tonality diamond around 11-odd-limit. (Re-use the same archive.org URL form already used in `prime-limits.md`.)
3. `src/pages/prime-limits.md` — replace 2 bullets (already has XW + Partch). No content changes.
4. `src/pages/otonality-utonality.md` — replace 2 bullets (already has XW + Gann). No content changes.
5. `src/pages/comma-pump.md` — replace 2 bullets (already has XW + Ben Johnston). Use `html`-tagged template for the Johnston note because it contains `${tex\`81/80\`}` inline TeX. Preserve text byte-equivalent.
6. `src/pages/pythagorean-tuning.md` — **add new `## Further reading` H2** after `## See also` (currently absent). Use the component. Entries: en.xen.wiki/w/Pythagorean_tuning + Hermann von Helmholtz, *On the Sensations of Tone* (Ellis tr., 1875) — discusses the Pythagorean comma and the wolf fifth at length; IMSLP URL form mirroring schisma.md.
7. `src/pages/meantone.md` — replace bullet. Add classic-text ref: Easley Blackwood, *The Structure of Recognizable Diatonic Tunings* (Princeton UP, 1985) — the modern canonical text on meantone temperament families; lays out the 1/n-comma continuum as recognizability bands.

**For each page:**
- Add `import { furtherReading } from "../components/further-reading.js";` to the existing import cell (Framework module-scope rule — do not create a second import cell).
- For pages where the note body contains `${tex...}` or other inline markup (comma-pump, possibly meantone), import `html` from `"npm:htl"` only if not already imported, then use ``html`...`` template for the `note` field.
- Replace the existing Markdown `-` bullets under `## Further reading` with a single JS block: ` ```js\n${furtherReading([...])}\n``` ` — keep the `## Further reading` heading intact.

**Verify (per page):**
- `npx tsc --noEmit` clean.
- `grep -c "furtherReading(" src/pages/<page>.md` returns `1`.
- `grep -c "## Further reading" src/pages/<page>.md` returns `1`.

**Done:** All 7 pages render Further-reading sections via the component, all classic-text refs present.

**Commit (one per page):** `feat(260513-8jw): src/pages/<page>.md — adopt furtherReading() helper[, add Doty ref / Partch ref / etc.]`

---

### Task 3 — Build + verify

**Action:**
1. `npm run build` and confirm exit 0, all links validated.
2. Spot-check the generated HTML for two pages (`monzos`, `pythagorean-tuning`) — `dist/pages/monzos/index.html` should contain `<section class="further-reading">` and the right number of `<li>` items.
3. `npx tsc --noEmit` clean (baseline 5 pre-existing `npm:` errors).
4. Run `npm test` to confirm no regressions in component tests (302/302 baseline).

**Verify:**
- `npm run build` exit 0.
- `grep -c "further-reading" dist/pages/monzos/index.html` ≥ 1.
- `grep -c "further-reading" dist/pages/pythagorean-tuning/index.html` ≥ 1.

**Done:** Build clean, all pages render the component.

**Commit:** none (verification only; or amend last code commit if a fix is required).

---

## must_haves

- **MH1:** `src/components/further-reading.ts` exists, exports `furtherReading(items)` returning `HTMLElement`, follows project XSS discipline (createElement + textContent for plain-string notes).
- **MH2:** `src/components/further-reading.css` exists and is registered in `src/styles.css`.
- **MH3:** All 7 target pages contain `${furtherReading([...])}` exactly once under `## Further reading`.
- **MH4:** `pythagorean-tuning.md` has a `## Further reading` section (it did not before this task).
- **MH5:** Each of the 7 pages has at least one Xenharmonic Wiki link in its Further reading list (already true for 6/7; new for pythagorean-tuning).
- **MH6:** Where applicable per user's spec, each page has at least one classic-text reference (Partch / Helmholtz / Gann / Doty / Johnston / Blackwood). monzos (Doty), odd-limits (Partch), prime-limits (Partch — already there), otonality-utonality (Gann — already there), comma-pump (Johnston — already there), pythagorean-tuning (Helmholtz), meantone (Blackwood).
- **MH7:** `npm run build` clean.
- **MH8:** No regressions: vitest 302/302, tsc baseline unchanged.

## Out of scope

- Other pages with existing Further-reading sections (`syntonic-comma`, `pythagorean-comma`, `schisma`, `septimal-comma`, `harmonic-series`, `edo-approximation`, `commas`). They can adopt the helper later — leave their Markdown bullets alone for this quick task to keep the diff bounded.
- Visual design beyond minimal consistency (spacing, muted note color). No icon, no border treatment.
- Adding more references beyond the user's "one classic text per page where applicable" — don't over-pad.
