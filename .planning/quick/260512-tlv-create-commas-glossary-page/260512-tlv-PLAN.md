---
quick_id: 260512-tlv
slug: create-commas-glossary-page
description: Create src/pages/commas.md glossary indexing every named comma in src/lib/commas.ts, grouped by prime-limit, with ratioPill / tex bra-ket monzo / 3-decimal cents / playInterval ▶, linking the four commas that have dedicated pages; wire into observablehq.config.ts under "Theory notes" between "Comma pump" and "EDO approximations".
status: ready
created: 2026-05-12
---

# Plan — Commas (glossary) page

## Scope

A single new markdown page `src/pages/commas.md` plus a one-line entry in `observablehq.config.ts`. No new components, no new CSS files, no library changes — `commaByName` is already authoritative.

## Task 01 — Write `src/pages/commas.md`

- **files**: `src/pages/commas.md` (new)
- **action**: Mirror page-level conventions from `src/pages/syntonic-comma.md`:
  - H1 + 1-line subtitle.
  - Single import cell: `Interval`, `commaByName`, `COMMAS`, `createSynth`, `ratioPill`, `playInterval`.
  - Synth cell — `const synth = createSynth(); invalidation.then(() => synth.dispose());` (Pitfall #2: page-scoped AudioContext owner).
  - Kernel-exact intervals: for every `c` in `COMMAS`, look up `commaByName(c.name)!` so the table rows are total at construction. Use the existing `COMMAS` array as the iteration source (preserves the curated ordering inside each prime-limit group). Strict-TS keeps us honest if the table drifts.
  - **No hardcoded cents literals in the page body** (Pitfall #1). Cents come from `iv.cents.toFixed(3)`. Ratios come from `iv.fraction.toFraction()` via `ratioPill(iv)`. Monzos come from `iv.monzo`.
  - **Prime-limit derivation**: `primeLimit = [2,3,5,7,11,13,...][lastNonzeroIndex(iv.monzo)]` — last nonzero index of the monzo. Group sections accordingly: 3-, 5-, 7-, 11-limit.
  - **Linked commas** — the four commas with their own dedicated page get a `<a href>` on the name cell:
    - `"syntonic comma"` → `/pages/syntonic-comma`
    - `"Pythagorean comma"` → `/pages/pythagorean-comma`
    - `"schisma"` → `/pages/schisma`
    - `"septimal comma"` → `/pages/septimal-comma`
    - All other names render as plain text.
  - **Table rendering**: build one `<table>` per prime-limit section in a JS cell via `document.createElement` + `textContent` (T-02-22/T-02-23 XSS discipline; no innerHTML for dynamic values). Columns: Name | Ratio | Monzo | Cents | Limit | ▶. The Monzo cell embeds a KaTeX-rendered bra-ket via the inline `tex` template tag (returns an HTMLElement that can be appended directly to a `<td>`). The ▶ cell embeds `playInterval(iv, synth)` (no label — ▶ only).
  - Section headers: `## 3-limit`, `## 5-limit`, `## 7-limit`, `## 11-limit` — each followed by a 1-2 line prose intro and then the rendered table.
  - **See also** footer linking the four dedicated pages + `/pages/monzos` (the canonical bra-ket primer).
  - **Further reading** H2 with at least one Xenharmonic Wiki link (e.g. `https://en.xen.wiki/w/Comma`).
- **verify**:
  - `tsc --noEmit` baseline unchanged (5 pre-existing `npm:` specifier errors only).
  - `npm run build` clean (link validation passes; the four internal links resolve).
  - `grep -nE '[0-9]+\.[0-9]+¢' src/pages/commas.md` matches **only** values inside `${tex…}` blocks (prose stays kernel-derived).
  - Visual check: 16 rows total across the four tables, in the same order as `COMMAS`.

## Task 02 — Register the page in `observablehq.config.ts`

- **files**: `observablehq.config.ts`
- **action**: Insert a new entry `{ name: "Commas (glossary)", path: "/pages/commas" }` into the `"Theory notes"` `pages:` array, **immediately after** `{ name: "Comma pump", … }` (current line 24). This is the alphabetical slot between `"Comma pump"` and `"EDO approximations"`.
- **verify**:
  - `npm run build` clean — the new sidebar entry resolves to `src/pages/commas.md`.
  - Sidebar order spot-check: `…Comma pump · Commas (glossary) · The Pythagorean comma · …`.

## must_haves

- **truths**:
  - The page imports nothing that doesn't exist in this repo (verified via the existing `src/pages/syntonic-comma.md` import list).
  - `commaByName(name)` returns a non-null `Interval` for every name in `COMMAS` (assertion `!` is safe because the table is the source).
  - Prime-limit groups: 3-limit = `Pythagorean comma`, `Mercator's comma`; 5-limit = `syntonic comma`, `schisma`, `diaschisma`, `diesis`, `greater diesis`, `kleisma`; 7-limit = `septimal comma`, `septimal kleisma`, `harmonic seventh comma`, `jubilisma`, `ragisma`, `breedsma`; 11-limit = `rastma`, `undecimal comma`. (Derived from the monzos in `src/lib/commas.ts`; the existing `// 5-limit` / `// 7-limit` / `// 11-limit` source comments are *display groupings*, not strict prime-limit assignments — the Pythagorean comma and Mercator's comma sit in the 3-limit group when classified by their canonical monzos.)
- **artifacts**:
  - `src/pages/commas.md` exists and renders.
  - `observablehq.config.ts` sidebar lists the new page.
- **key_links**:
  - `src/lib/commas.ts` (source of `COMMAS` + `commaByName`)
  - `src/pages/syntonic-comma.md` (page convention reference)
  - `src/pages/monzos.md` (bra-ket / tex pattern reference)
  - `src/components/ratio-pill.ts`, `src/components/play-interval.ts`
