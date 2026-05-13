---
phase: 260513-a7c
plan: 01
subsystem: theory-pages
status: complete
tags: [theory, tenney-height, harmonic-complexity, edo-ranker, plot, sidebar]
requires:
  - Interval kernel for ratio parsing + monzo/cents projection
  - tenneyHeight + primeLimitOfMonzo re-exports from src/lib/monzo.ts
  - furtherReading component
  - Observable Plot for the cents-vs-height scatter
provides:
  - new theory page /pages/tenney-height as the last entry under "Theory notes"
  - canonical pedagogical reference for the Tenney-weighted error metric used by bestEdosForScale (src/lib/edo.ts)
affects:
  - observablehq.config.ts pages array (Theory notes section, 1 new entry appended)
tech-stack:
  added: []
  patterns:
    - "kernel-exact anchors via Interval + tenneyHeight, /Math.LN2 ln→log2 conversion only at the display boundary (Pitfall #1)"
    - "plain-DOM tables (createElement + textContent) — no innerHTML (T-02-22/T-02-23)"
    - "Plot.dot + Plot.text + Plot.ruleY scatter with prime-limit color encoding via primeLimitOfMonzo"
    - "no synth cell — glossary-style reference page (no audio dependency)"
key-files:
  created:
    - src/pages/tenney-height.md
  modified:
    - observablehq.config.ts
artifacts:
  research: .planning/quick/260513-a7c-create-src-pages-tenney-height-md/260513-a7c-RESEARCH.md
---

# Summary — quick-260513-a7c: Tenney height theory page

## What shipped

A new theory-notes page at `src/pages/tenney-height.md` covering Tenney height
(the `log₂(n·d)` scalar measure of harmonic complexity) and Tenney-weighted
error as used by the `bestEdosForScale` EDO ranker in `src/lib/edo.ts`.

**Page sections:**

1. **Definition** — KaTeX block presenting both forms: `TH(n/d) = log₂(n·d)`
   and the equivalent monzo form `Σ |e_i| · log₂(p_i)`. Explains the
   base-2-vs-natural-log convention.
2. **Worked examples** — 9-row plain-DOM table derived in-cell from
   `new Interval(...)` + `tenneyHeight(iv.monzo) / Math.LN2`. Spans 1/1 → 2/1
   → 3/2 → 5/4 → 7/4 → 9/8 → syntonic comma → schisma → Pythagorean comma.
3. **Cents vs Tenney height** — Plot scatter of 32 canonical JI ratios:
   x = cents [0, 1220], y = log₂(n·d) [0, 32]. Color-encoded by prime-limit.
   The schisma sits visibly isolated in the upper-left, demonstrating that
   "complexity does not track pitch distance from unison."
4. **Tenney-weighted error in the EDO ranker** — pedagogical explanation of
   `Σ |err| / max(1, tenneyHeight)` as a musically-biased weighting that
   favors EDOs fitting simple ratios well. Cites `src/lib/edo.ts:98-126` and
   explains the `Math.max(1, …)` clamp as a numerical safety guard.
5. **See also** — prose with links to Monzos, prime-limits, EDO
   approximations, Analysis, and the dashboard.
6. **Further reading** — Markdown H2 + `furtherReading([...])` JS fence with
   two entries: Tenney's *John Cage and the Theory of Harmony* (Plainsound
   PDF) and the Xenharmonic Wiki *Tenney height* page.

## Sidebar wiring

Single-line append to `observablehq.config.ts` (line 33) under "Theory notes",
inserting `{ name: "Tenney height", path: "/pages/tenney-height" }` as the LAST
entry — placed after "The septimal comma" per the user's explicit instruction
("the last 'Theory notes' page").

## Decisions worth recording

**Logarithm base** — the user's brief specified `log₂(n·d)`. The kernel
implementation (`xen-dev-utils` `tenneyHeight`) returns **natural log**, not
log₂ (verified at `node_modules/xen-dev-utils/dist/core.js:418`:
`return Math.log(n) + Math.log(d)`). The page presents `log₂` as the textbook
formula AND notes that the kernel uses ln (constant-factor equivalent;
ranking-invariant for the EDO sorter). All numerical examples on the page are
log₂ values — kernel-derived via `tenneyHeight(monzo) / Math.LN2`. This honors
the user's spec exactly without misrepresenting the kernel.

**Numerical correction** — the brief gave `log₂(6480) ≈ 12.66` for 81/80 (✅
correct, page shows 12.662). The page also includes the Pythagorean comma at
`log₂(531441·524288) = log₂(278,628,139,008) ≈ 38.020`, which is the textbook
high anchor (the brief's `47.987` value was based on a different n·d product
and was corrected after running the computation in node).

**Further reading URL** — the brief asked for "Tenney's *John Cage and the
Theory of Harmony* (PDF on archive.org)." archive.org does NOT host the PDF
under any common slug (verified via 404s on `/details/john-cage-and-the-theory-of-harmony`
and several variants). The canonical hosted PDF is at
`https://www.plainsound.org/pdfs/JC&ToH.pdf` (Plainsound Music Edition is
Sabat/von Schweinitz's imprint and Tenney's primary publisher). Verified
`HTTP/2 200`, `application/pdf`, ~660 KB. Used Plainsound; documented in the
research notes.

**Scatter y-axis range** — `[0, 32]` keeps the schisma (~30) visible as the
chart's punchline. A narrower range like `[0, 16]` would hide it; that defeats
the page's pedagogical hinge. Linear y-axis (Tenney height is already log;
log-log would flatten the schisma against the syntonic comma).

**No audio** — glossary-style reference page. No `createSynth()` cell, no play
buttons. Audio belongs on `meantone.md` / `edo-approximation.md` /
`well-temperament.md` where audible temperament difference is the point.

## Verification

- `npx tsc --noEmit` → exit 0
- `npm run build` → 20 pages rendered (was 19), 107 links validated, no errors
- `dist/pages/tenney-height.html` exists with all 7 expected anchors (`tenney-height`,
  `definition`, `worked-examples`, `cents-vs-tenney-height`,
  `tenney-weighted-error-in-the-edo-ranker`, `see-also`, `further-reading`)
- Kernel math sanity-checked via node probe: 3/2 → log₂ = 2.5850 ✓,
  5/4 → 4.3219 ✓, 81/80 → 12.6618 ✓ — all match the page's worked-examples
  table to 4 decimals.

## Kernel discipline upheld

- Zero hardcoded canonical-cent or canonical-Tenney-height float literals as
  source-of-truth in data rows. Every numerical value on the page is derived
  in-cell from `new Interval(...)` and `tenneyHeight(...)`.
- Zero `.innerHTML =` assignments for derived values; all DOM construction
  via `createElement` + `textContent` (T-02-22 / T-02-23 XSS discipline).
- `tenneyHeight` imported from `../lib/monzo.js`, not from `xen-dev-utils`
  directly (R-01 guard pattern).
- `Interval` import path uses `.js` extension (Framework transpile-time rule).
