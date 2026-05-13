---
name: 260513-d2e-CONTEXT
description: Fact-check & cite all 18 theory pages — decisions locked before planning
status: ready-for-planning
---

# Quick Task 260513-d2e: Fact-check theory pages and add academic citations — Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Task Boundary

Perform a thorough, full-depth audit of every theory page in `src/pages/`
(18 pages, ~5000 lines), verifying historical attributions, numerical
claims, AND mathematical derivations. Add academic citations in Chicago
author-date format to a per-page **Sources** section.

**In scope:**
- All 18 pages under `src/pages/`: analysis, comma-pump, commas,
  edo-approximation, harmonic-series, meantone, monzos, odd-limits,
  otonality-utonality, prime-limits, pythagorean-comma,
  pythagorean-tuning, scale-workshop-interop, schisma, septimal-comma,
  syntonic-comma, tenney-height, well-temperament.
- Prose claims (history, attribution, definitions, theoretical assertions).
- Numerical claims (cents values, ratios, comma sizes, beat rates).
- Mathematical derivations shown in prose (re-verify each step).
- Adding a **Sources** section per page with full Chicago entries.
- Inline `(Author Year)` markers in prose at every claim that warrants one.

**Out of scope:**
- Touching reactive `js`/`ts` code cells (math kernel is already validated by tests).
- Restructuring page content/order/headings.
- Adding new theoretical material beyond what's needed to correct errors.
- Visual/typographic polish unrelated to citation rendering.
- A unified `references.md` aggregator page (rejected in discuss phase).

</domain>

<decisions>
## Implementation Decisions

### Citation Style — LOCKED
- **Chicago author-date** inline: `(Helmholtz 1877, 32)` style. Page numbers
  included where the cited source paginates and the claim is specific.
- Full bibliographic entry in a `## Sources` H2 section at the bottom of each
  page, Chicago author-date reference-list format (entries alphabetized by
  author surname, then year).
- For Xen Wiki citations (no stable pagination, mutable): use
  `(Xen Wiki, "Page Title")` inline; reference-list entry includes the URL
  and an `Accessed 2026-05-13` date stamp.

### Fact-Check Depth — LOCKED
- **Full audit**: re-derive math, re-verify cents/ratios/dates/attributions
  against authoritative sources. Every numerical claim and every historical
  attribution gets checked.
- When a claim is found incorrect, **fix it in place** and cite the
  correcting source. Do NOT leave warning prose ("some sources say…").
- When a claim is unverifiable (no authoritative source found after
  reasonable effort), flag it inline with `(citation needed)` and list the
  attempt in SUMMARY.md as a follow-up item.

### Source Tiers — LOCKED (all four accepted)
- **Primary historical:** Helmholtz 1877 *On the Sensations of Tone* (Ellis
  trans. 1885), Werckmeister 1691 *Musicalische Temperatur*, Partch 1949
  *Genesis of a Music* (2nd ed. 1974), Rameau 1722 *Traité de l'harmonie*,
  Mersenne 1636 *Harmonie universelle*, Kirnberger, Vallotti, Young, Euler.
- **Modern academic:** Benson 2007 *Music: A Mathematical Offering*; Sethares
  2005 *Tuning Timbre Spectrum Scale*; peer-reviewed journals (JNMR, JASA,
  Music Perception, JMT).
- **Xenharmonic Wiki:** acceptable for modern microtonal terminology
  (monzos, Tenney height, prime limits, commas table). Cite with
  Accessed-date because content is mutable.
- **Huygens-Fokker Foundation:** authoritative for the technical layer
  (Scala `.scl` / `.kbm` format spec, intervals.html comma table). Cite
  the page title and access date.

### Layout & Commits — LOCKED
- Each page gets its own `## Sources` H2 section at the bottom.
- Full bibliographic entries are inlined on each page (no shared
  `references.md`). Duplication across pages is accepted in exchange for
  locality.
- **One atomic commit** covers all 18 pages plus the SUMMARY.md and STATE.md
  artifacts (docs commit handled by the orchestrator in Step 8).
- The executor commits code changes (the page .md edits) in a single commit
  before yielding control back.

### Claude's Discretion
- **Citation density**: cite at the first authoritative source for each
  distinct claim; do not re-cite the same source for every restatement on
  the same page. Use professional judgment.
- **Page-number granularity**: cite specific pages for narrow factual
  claims (a single date, a single number). For broader theoretical points,
  cite the chapter or section.
- **Translation choice**: for non-English primary sources, prefer the most
  widely-cited English translation when one exists (Ellis trans. of
  Helmholtz, Schulenberg of Werckmeister).
- **When primary sources disagree** (e.g., the exact cent value of the
  syntonic comma at various Renaissance authors): cite the modern
  consensus value, then note the variant in a footnote-style aside.
- **Math-cell verification:** treat the runtime computations in `ts` cells
  as ground truth for numerical values (they are tested). The audit checks
  that the prose surrounding the cells *describes* those values correctly,
  not that the cells themselves are right.
- **Reactive `js`/`ts` cells are untouched.** Citations live only in the
  prose Markdown.

</decisions>

<specifics>
## Specific Ideas

- Pages with the highest historical-claim density (and thus likely the most
  citation work): `well-temperament.md` (571 lines — Werckmeister III,
  Kirnberger III, Vallotti), `meantone.md`, `pythagorean-tuning.md`,
  `tenney-height.md`.
- Pages with the highest mathematical-derivation density: `monzos.md`,
  `tenney-height.md`, `prime-limits.md`, `edo-approximation.md`.
- The harmonic-series page (`harmonic-series.md`) likely needs Helmholtz +
  modern psychoacoustics citations (Plomp & Levelt 1965).
- The comma pages (`syntonic-comma.md`, `pythagorean-comma.md`, `schisma.md`,
  `septimal-comma.md`, `commas.md`) need both the Huygens-Fokker comma
  table and the original authors who named/described them.
- `scale-workshop-interop.md`: cite the Huygens-Fokker scl/kbm spec and
  the Scale Workshop project (xenharmonic-devs).

</specifics>

<canonical_refs>
## Canonical References

- Chicago Manual of Style, 17th ed., chapter 15 (author-date system).
- Huygens-Fokker Foundation, "Scala scale file format" — the project
  already references this in `CLAUDE.md` for the technical interop layer.
- Scale Workshop project (xenharmonic-devs/scale-workshop) — already in
  use as a runtime dependency.

</canonical_refs>

<scope_note>
## Scope Note (flagged for planning)

A full-depth audit of 18 pages with citations across 4 source tiers is
**larger than a typical quick task**. The execution will be substantial,
likely producing >100 inline citations and ~50-80 unique bibliographic
entries. The single-atomic-commit policy is honored, but the planner
should structure the work in phases (per-page passes) and the executor
should batch reads efficiently. If the work exceeds reasonable quick-task
bounds, the executor should produce a partial result with a clear
remaining-work section in SUMMARY.md rather than truncating quality.

</scope_note>
