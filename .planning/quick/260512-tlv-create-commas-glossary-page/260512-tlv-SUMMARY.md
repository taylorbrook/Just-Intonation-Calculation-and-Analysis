---
quick_id: 260512-tlv
slug: create-commas-glossary-page
status: complete
date: 2026-05-12
commit: 69b7a88
---

# Summary — 260512-tlv Commas (glossary)

## What changed

- **New page**: `src/pages/commas.md` (+198 lines). A kernel-bound glossary
  indexing every entry in `src/lib/commas.ts` (16 commas total), grouped into
  four prime-limit sections (3-, 5-, 7-, 11-limit) with per-row Name / Ratio /
  Monzo / Cents / Limit / ▶ columns.
- **Sidebar registration**: `observablehq.config.ts` +1 line — new
  `{ name: "Commas (glossary)", path: "/pages/commas" }` inserted under
  `Theory notes` immediately after `Comma pump` (alphabetical slot between
  "Comma pump" and "EDO approximations").

Single atomic feat commit: `69b7a88`.

## Design decisions

1. **Group by canonical prime-limit, not source-file comment grouping.** The
   `COMMAS` table in `src/lib/commas.ts` organizes entries under
   `// 5-limit` / `// 7-limit` / `// 11-limit` comment headers, but the
   Pythagorean comma (monzo `[-19, 12]`) and Mercator's comma (`[-84, 53]`)
   live under the `// 5-limit` heading despite having only prime-2 and
   prime-3 exponents. Per the user's spec ("Group by prime-limit (3-, 5-, 7-,
   11-limit sections)") and the math, both go in the **3-limit** group. The
   prime-limit is derived at runtime via "last nonzero index of `iv.monzo`",
   so the page stays in sync if the source table grows or reshapes.

2. **Tables built in JS, not markdown.** Rendering 16 rows × 6 columns inline
   in markdown would mean either pasting cents/monzo literals (Pitfall #1
   violation) or wrapping every cell in `${tex…}` / `${ratioPill…}` /
   `${playInterval…}` — 96 inline interpolations to maintain. A single
   `buildCommaTable(entries)` helper built once and called four times keeps
   the page DRY and means every row gets the same XSS-safe `createElement +
   textContent` treatment (T-02-22/T-02-23). Monzo cells append the
   `HTMLElement` returned by `tex\`\begin{bmatrix} ${monzo.join(' & ')} \end{bmatrix}\rangle\``;
   ratio cells append `ratioPill(iv, {showCents:false})`; play cells append
   `playInterval(iv, synth)` (▶, no label — labeling them would crowd the
   table). The dedicated synth is page-scoped (Pitfall #2 — one
   `createSynth()` call site).

3. **Cents shown to 3 decimals.** Per the spec. The existing pages use 1-2
   decimals for prose / 2 decimals for chart annotations; 3 decimals is the
   right precision for a reference table (the ragisma at 0.396¢ and the
   breedsma at 0.721¢ both round to 0¢ at 1-decimal precision).

4. **Linked names for the four dedicated pages.** A `DEDICATED_PAGES` Map
   keyed by the exact `COMMAS` name maps `"syntonic comma"`,
   `"Pythagorean comma"`, `"schisma"`, and `"septimal comma"` to their
   dedicated page paths. The name cell renders as an `<a href>` for those
   four, plain text for the other 12. No fragile string matching — exact
   `Map.get(name)` lookup.

5. **No `@observablehq/plot` import.** This page is a tabular index, not a
   visualization — adding Plot would balloon the import footprint from
   ~391 kB to ~916 kB without delivering anything the table doesn't already
   show. The other tabular pages without charts (syntonic-comma 392kB,
   pythagorean-tuning 400kB) confirm this is the right call.

6. **`showCents: false` on every `ratioPill`.** The cents column carries the
   3-decimal value; doubling it inside the pill (with its 1-decimal default)
   would clutter the row.

## Per-entry verification table (kernel-derived)

| Comma | Ratio | Monzo | Cents | Limit | Linked |
|-------|-------|-------|-------|-------|--------|
| syntonic comma | 81/80 | ⟨-4, 4, -1⟩ | 21.506 | 5 | ✓ |
| Pythagorean comma | 531441/524288 | ⟨-19, 12⟩ | 23.460 | 3 | ✓ |
| schisma | 32805/32768 | ⟨-15, 8, 1⟩ | 1.954 | 5 | ✓ |
| diaschisma | 2048/2025 | ⟨11, -4, -2⟩ | 19.553 | 5 | |
| diesis | 128/125 | ⟨7, 0, -3⟩ | 41.059 | 5 | |
| greater diesis | 648/625 | ⟨3, 4, -4⟩ | 62.565 | 5 | |
| kleisma | 15625/15552 | ⟨-6, -5, 6⟩ | 8.107 | 5 | |
| Mercator's comma | 19383245667680019896796723/19342813113834066795298816 | ⟨-84, 53⟩ | 3.615 | 3 | |
| septimal comma | 64/63 | ⟨6, -2, 0, -1⟩ | 27.264 | 7 | ✓ |
| septimal kleisma | 225/224 | ⟨-5, 2, 2, -1⟩ | 7.712 | 7 | |
| harmonic seventh comma | 49/48 | ⟨-4, -1, 0, 2⟩ | 35.697 | 7 | |
| jubilisma | 50/49 | ⟨1, 0, 2, -2⟩ | 34.976 | 7 | |
| ragisma | 4375/4374 | ⟨-1, -7, 4, 1⟩ | 0.396 | 7 | |
| breedsma | 2401/2400 | ⟨-5, -1, -2, 4⟩ | 0.721 | 7 | |
| rastma | 243/242 | ⟨-1, 5, 0, 0, -2⟩ | 7.139 | 11 | |
| undecimal comma | 33/32 | ⟨-5, 1, 0, 0, 1⟩ | 53.273 | 11 | |

16 entries total (4 linked, 12 plain). The Mercator's comma 25-digit ratio is
live proof of the BigInt-Fraction kernel path — `Number`-backed arithmetic
would silently lose precision past 2^53 (R-01 / Pitfall #5). All values above
were re-derived from the monzos in `src/lib/commas.ts` via a standalone
Node + fraction.js@5.3.4 cross-check before commit.

## Verification

- **tsc --noEmit**: clean (no new errors beyond baseline).
- **npm run build**: clean — 18 pages (was 17), **88 links validated** (was
  79; the new page contributes 9 new internal links to `/pages/syntonic-comma`,
  `/pages/pythagorean-comma`, `/pages/schisma`, `/pages/septimal-comma`,
  `/pages/monzos`, `/pages/comma-pump`, `/`, plus the 4 linked-name links
  inside the tables — Framework dedupes within a page so the validator sees
  the unique destinations).
- **`grep -nE '[0-9]+\.[0-9]+¢' src/pages/commas.md`** clean — no
  hardcoded float-cents literals in the page body (Pitfall #1 honored).
- **Bundle size**: commas page 16 kB Page / 391 kB Imports / 68 kB Files —
  same footprint as the no-Plot family (syntonic-comma 14kB/392kB,
  pythagorean-tuning 16kB/400kB). Deliberately avoided importing Plot.
- **Sidebar order spot-check** in any rendered HTML: `… Comma pump · Commas
  (glossary) · The Pythagorean comma · Pythagorean tuning · …` — the new
  entry sits in the alphabetical slot the user specified.

## Files touched

- `src/pages/commas.md` (new, 198 lines)
- `observablehq.config.ts` (+1 line)
- `.planning/quick/260512-tlv-create-commas-glossary-page/260512-tlv-PLAN.md` (new, planning artifact)
- `.planning/quick/260512-tlv-create-commas-glossary-page/260512-tlv-SUMMARY.md` (this file)
- `.planning/STATE.md` (Quick Tasks Completed row + Last activity)

## Not changed (intentional)

- `src/lib/commas.ts` — unchanged. The `// 5-limit` source-file header is
  preserved (it's a curated-ordering convention, not a strict prime-limit
  claim); the glossary's runtime classification is the canonical view.
- No new CSS file. The page uses Framework's default `<table>` styling, which
  matches the deviation-table rendering on edo-approximation.md and
  meantone.md.
- No `Plot` import. Deliberate — see decision #5 above.
- No new component module. `buildCommaTable` is a one-page helper; promoting
  it to `src/components/commas-table.ts` would be premature (single
  caller, no reuse hook on the horizon).
