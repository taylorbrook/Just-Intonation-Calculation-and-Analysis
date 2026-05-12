---
phase: 260512-mvw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/monzo.ts
  - src/components/tonality-diamond.ts
  - src/pages/odd-limits.md
autonomous: true
requirements:
  - QUICK-ODD-LIMITS-STATIC-DIAMONDS-01
must_haves:
  truths:
    - "src/components/tonality-diamond.ts gains a new pure-presentational export `renderDiamondSVG(oddLimit, opts?)` that returns an HTMLElement containing only `<svg.viz.diamond>` — no synth dependency, no scale dependency, no zoom, no click handlers, no `role=\"button\"` cells."
    - "Every cell in renderDiamondSVG output is colored by its dominant prime axis (axis-3/5/7/default) using the existing CSS classes (`diamond-cell--in-scale diamond-cell--axis-N`), so the static preview is visually informative without a scale to compare against."
    - "src/pages/odd-limits.md embeds three `${renderDiamondSVG(N, ...)}` previews inline — one under `### 5-odd-limit`, one under `### 7-odd-limit`, one under `### 11-odd-limit`."
    - "src/lib/monzo.ts gains an exported `primeLimitOfMonzo(monzo): number` helper (promoted from tonality-diamond.ts) so both the component and the page compute prime-limit from monzo identically (Pitfall #5 wrap-don't-reimplement; #1 monzo as source of truth)."
    - "src/components/tonality-diamond.ts imports primeLimitOfMonzo from ../lib/monzo.js and removes the local copy — single source of truth."
    - "A new `## Prime-limit vs odd-limit, side by side` H2 section appears on src/pages/odd-limits.md with a 12-row plain DOM table comparing the canonical ratios 9/8, 5/4, 7/6, 81/80, 25/24, 15/8, 9/7, 11/8, 13/8, 81/64, 7/4, 16/15 — sorted by ascending odd-limit. Columns: Ratio | Odd-limit | Prime-limit | Cents | Agree? (✓ when odd-limit == prime-limit, otherwise empty)."
    - "A new `## Further reading` H2 is appended at the very bottom of the page (after `## See also`) with one bulleted link to https://en.xen.wiki/w/Odd_limit."
    - "Pitfall #1 honored: every Interval is constructed once from a ratio string; `.monzo` and `.cents` are read only at the display step in the comparison-table cell. No `new Interval(<centsNumber>)` anywhere."
    - "T-02-22 / T-02-23 XSS discipline: the comparison-table cell builds DOM via `document.createElement` + `textContent`; no `innerHTML` for dynamic values."
    - "Existing tonality-diamond test suite (src/components/__tests__/tonality-diamond.test.ts) still passes — refactor of primeLimitOfMonzo is import-site-only and semantics-preserving."
    - "tsc clean (baseline)."
  artifacts:
    - path: "src/components/tonality-diamond.ts"
      provides: "New `renderDiamondSVG` export; uses primeLimitOfMonzo from kernel."
      contains: "export function renderDiamondSVG"
    - path: "src/lib/monzo.ts"
      provides: "primeLimitOfMonzo export."
      contains: "export function primeLimitOfMonzo"
    - path: "src/pages/odd-limits.md"
      provides: "Three inline static diamond previews + comparison table + Further reading."
      contains: "## Prime-limit vs odd-limit, side by side"
  key_links:
    - from: "renderDiamondSVG"
      to: "primeLimitOfMonzo (kernel)"
      via: "import from ../lib/monzo.js"
      pattern: "primeLimitOfMonzo"
    - from: "odd-limits.md comparison table cell"
      to: "Interval (BigInt-Fraction kernel) + primeLimitOfMonzo + oddLimit"
      via: "`new Interval(ratioStr).monzo` → primeLimitOfMonzo / oddLimit; `.cents` read only at display"
      pattern: "primeLimitOfMonzo\\(iv\\.monzo\\)"
---

<objective>
Make the odd-limits page concretely visual and concretely comparative:

1. Add a pure-presentational `renderDiamondSVG(oddLimit, opts?)` export to
   `src/components/tonality-diamond.ts` that renders the diamond as a static
   SVG (no synth, no zoom, no click handlers). All cells are treated as
   "in-scale" and colored by the dominant prime's axis so the picture is
   informative on its own. Wire one preview into each of the existing 5-/7-
   /11-odd-limit sections on `src/pages/odd-limits.md`.

2. Add a `## Prime-limit vs odd-limit, side by side` comparison table of 12
   canonical ratios (sorted by ascending odd-limit) to drive home the page's
   central thesis — the two classifications often diverge.

3. Add a `## Further reading` section linking the Xenharmonic Wiki entry on
   odd-limit.

Promote `primeLimitOfMonzo` from tonality-diamond.ts into `src/lib/monzo.ts`
so both the component and the page share one source of truth.
</objective>
