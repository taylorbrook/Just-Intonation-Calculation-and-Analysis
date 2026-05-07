---
type: research
quick_id: 260507-mgl
task: Look into ways to make this app better looking and more navigable
date: 2026-05-07
---

# Research: Visual & Navigation Improvements

Confidence: HIGH (verified against installed Framework 1.13.4 and project files; theme list confirmed from `node_modules/@observablehq/framework/dist/style/theme-*.css`).

## Current State

The site is a 3-page Observable Framework notebook served from `src/`:

- `/` — composition dashboard (`src/index.md`): seed-scale textarea, scale table, audio panel, .scl/.kbm I/O, lattice + tonality-diamond + keyboard viz, "Stop all audio" floating button, single-line link to syntonic-comma page (`src/index.md:247`).
- `/pages/syntonic-comma` — short theory page with KaTeX, ratio pills, three play-interval buttons (`src/pages/syntonic-comma.md`).
- `/pages/analysis` — EDO mapping, JI-in-N-EDO, MOS builder, scale-compare; cross-link footer to dashboard + syntonic-comma (`src/pages/analysis.md:205`).

Framework config is minimal — three lines of behavior:

- `title: "Tuning Systems"` (`observablehq.config.ts:3`)
- `pages: [{ name: "Syntonic comma", path: "/pages/syntonic-comma" }]` — only ONE page registered. The dashboard and `/pages/analysis` are auto-discovered but not in `pages` so they don't get explicit sidebar entries (`observablehq.config.ts:5`).
- KaTeX CSS injected via `head` (`observablehq.config.ts:6`).

There is **no `theme:` set**, **no `header`/`footer`**, **no `toc`**, **no `style:` (global)**. Every page declares its own `style: ./styles.css` frontmatter, which **replaces** Framework's default stylesheet — that's why `src/styles.css` re-declares all the `--theme-*` tokens locally (`src/styles.css:40-66`, with the comment block at `:1-26` explaining the discovery). All component CSS is `@import`ed from `styles.css` (12 imports at `src/styles.css:27-38`).

Component visual surface: 12 components, ~1,400 LOC of CSS, all styled with theme tokens, all using `color-mix(in oklab, …)` for tints. Tables use a clean monospace + small-caps header pattern (`src/components/scale-table.css:10-33`).

A visitor's path today: land on the dashboard which shows H1 "Tuning Systems" + one-line subtitle + immediate textarea, scroll past the scale table → audio → SCL I/O → "Analyze this scale →" button → three viz widgets stacked vertically → footer one-line link. Sidebar shows `Tuning Systems / Syntonic comma` only — `/pages/analysis` is reachable only through the inline button or by direct URL.

## Weaknesses

- **No theme set**, no global `style:`. Falls back to Framework's untoothed default + the per-page `style:` workaround. Means: lost out on the curated palettes (air, near-midnight, etc.) and added a footgun where any new page that forgets `style: ./styles.css` will have unstyled components (`observablehq.config.ts:1-7`, `src/styles.css:1-26`).
- **Sidebar is wrong.** Only the syntonic-comma page is in `pages`. The Analysis page is auto-discovered (Framework lists Markdown files alphabetically when `pages` is partial) but the order is `analysis, syntonic-comma`, with no grouping. The dashboard ("home") doesn't get a sidebar entry at all. (`observablehq.config.ts:5`).
- **Landing page has no orientation.** `src/index.md:5-8` is `# Tuning Systems / A scale-design workspace. Type a scale, hear it, export it.` and immediately drops into the scale textarea. New visitor doesn't know there's an Analysis page or a Syntonic-comma essay until they hit the bottom of the page (`src/index.md:247`). No hero, no card grid, no "what's here" map.
- **No footer / "view source" link / no header.** Framework's default footer ("Built with Observable.") is suppressed because per-page `style:` frontmatter replaces the default stylesheet entirely; even if it weren't, the default is generic. No GitHub link, no last-updated, no author.
- **No table of contents on long pages.** `/pages/analysis.md` has four H2 sections (Best-fit EDOs, JI in N-EDO, MOS construction, Compare scales) and zero in-page nav. Same for `/pages/syntonic-comma.md` (one H2: "In monzos"). With `toc: true` in config or `toc: true` per-page frontmatter you'd get the right-rail TOC for free.
- **Dashboard's H2 hierarchy is invisible.** Sub-sections are rendered by component factories (`<h2>Audition</h2>` in `src/components/audio-panel.ts:46-48`, `<h2>Scala file (.scl)</h2>` in `src/components/scl-io.ts:84-86`) — but the lattice/diamond/keyboard widgets emit `<h2>` headings inside `.lattice-widget h2` etc., yet there is **no H2 above the scale table or above the textarea**. Result: the page reads as one long unsegmented stream with surprise H2's two-thirds in.
- **Cross-page links are weak.** Dashboard → analysis is a button (`src/index.md:200-216`), good. But analysis → syntonic-comma is a tail-of-page text link (`src/pages/analysis.md:205`), syntonic-comma → dashboard is a tail-of-page text link (`src/pages/syntonic-comma.md:55-57`). No "related pages" affordance, no breadcrumbs.
- **Keyboard widget cents text is tiny (11px) and uncentered.** `src/components/keyboard.css:54-58` (`.keyboard__cents` font-size 11px). On the scale-keyboard rectangles the ratios + cents stack vertically, which can collide in narrow widths.
- **Vertical rhythm is inconsistent.** `audio-panel`, `scl-io` use `margin-block: 24px`; `lattice-widget`, `tonality-diamond-widget`, `keyboard-widget` use `margin-block: 32px`; `scale-table` uses `16px`. Nothing wrong with each individually, but the dashboard's 8 sequential blocks alternate spacing rhythms (`src/components/{audio-panel,scl-io,lattice,tonality-diamond,keyboard,scale-table}.css`).
- **No explicit max content width.** Framework defaults to ~640px main column; the viz SVGs cap at `max-width: 720px` and overflow that column on wide screens (`src/components/lattice.css:36`, `tonality-diamond.css:26`, `keyboard.css:26`). On a desktop the SVGs sit awkwardly indented under prose that's narrower. The `wide` Framework theme variant fixes this.
- **No `lang="en"` … actually that's auto. But:** no Open Graph / favicon / preview thumb. Pasting the URL in chat/discord shows a bare title.
- **Heavy theme-token re-declaration in `src/styles.css:43-66` is a maintenance trap.** The hand-mirror of Framework's `air` + `coffee` palettes drifts the moment Framework updates its CSS variables. Native `theme:` config + global `style:` (with `@import url("observablehq:default.css")` per Framework docs) eliminates the re-declaration.

## Visual Polish — Opportunities

Ranked by impact-to-effort:

1. **Set `theme: ["air", "near-midnight"]`** in `observablehq.config.ts`. Light + dark with matching system-preference auto-switch. Ships with Framework 1.13.4 — files verified at `node_modules/@observablehq/framework/dist/style/theme-air.css` and `theme-near-midnight.css`. Effort: 1 line. Files: `observablehq.config.ts`. **Replaces** the hand-rolled `--theme-*` declarations in `src/styles.css:43-66` once you also adopt #2.
2. **Replace per-page `style:` frontmatter with global `style:`.** In `observablehq.config.ts` add `style: "./styles.css"` (root-relative to `src/`). In `src/styles.css` first line: `@import url("observablehq:default.css");` then keep your component `@import`s. Drop `style:` from all three Markdown frontmatters. Removes the re-declaration block (`src/styles.css:43-66`) — Framework's theme provides the tokens. Effort: 1-2 hr. Files: `observablehq.config.ts`, `src/styles.css`, `src/index.md`, `src/pages/*.md`.
3. **Use the `wide` theme modifier for the dashboard only.** `theme: ["air", "near-midnight", "wide"]` site-wide is too wide for the prose pages; better: keep narrow site-wide and add `theme: wide` to the dashboard's frontmatter. The lattice/diamond/keyboard widgets stop overflowing the column. Effort: 5 min. Files: `src/index.md` frontmatter.
4. **Add an H2 above the textarea on the dashboard** — e.g. `## Scale` — and one above the viz block — `## Visualize`. Aligns with the existing component-emitted H2's (`Audition`, `Scala file (.scl)`, `Lattice`, `Tonality diamond`, `Keyboard`) so the page reads as a coherent outline and `toc: true` actually has something useful to render. Effort: 5 min. Files: `src/index.md`.
5. **Standardize vertical rhythm.** Pick one token: `margin-block: 32px` between major widgets, `16px` within. Edit the four offenders (`audio-panel.css:8-13`, `scl-io.css:8-13`, `scale-table.css:7-9`, `scale-compare.css:7-9`). Effort: 15 min, no behavior change.
6. **Card-grid the analysis page** using Framework's built-in `<div class="grid grid-cols-2">` + `<div class="card">` (verified pattern in Framework docs). Wrap each H2 section as a card. Optional. Effort: 30 min. Files: `src/pages/analysis.md`.
7. **Keyboard widget label legibility.** Bump `.keyboard__cents` from 11px → 12px and `.keyboard__ratio` 13px → 14px (`src/components/keyboard.css:48-58`); add `text-anchor: middle` if not already there in the SVG. Low-priority polish. Files: `src/components/keyboard.css`, `src/components/keyboard.ts` (text-anchor).

## Navigation — Opportunities

Ranked by impact-to-effort:

1. **Restructure `pages` in config to register all three** with explicit ordering and a section grouping for the theory pages. Effort: 5 min.
   ```ts
   pages: [
     { name: "Dashboard", path: "/" },
     { name: "Analysis", path: "/pages/analysis" },
     {
       name: "Theory notes",
       open: true,
       pages: [{ name: "The syntonic comma", path: "/pages/syntonic-comma" }],
     },
   ]
   ```
   Files: `observablehq.config.ts`. Confirmed `name+pages` section format from Framework config docs.
2. **Turn on right-rail TOC** with `toc: true` in `observablehq.config.ts`. Auto-renders H2 list on every page. With opportunity #4 above (added H2's on dashboard) the dashboard gets a useful TOC for free. Effort: 1 line.
3. **Add a `header:` and `footer:` to config.** Header carries title + small nav, footer carries "View source on GitHub" + last-updated. Framework supports an HTML string OR a function `({path, title}) => string`. Effort: 30 min. Files: `observablehq.config.ts`.
4. **Replace the dashboard's tail-of-page link with a top-of-page orientation block.** A small `<div class="card">` above the textarea that names what's on the site: 3 short sentences, 3 links (Dashboard / Analysis / Theory notes). Solves the "where am I and what else exists" problem in 4 lines of Markdown. Effort: 15 min. Files: `src/index.md` (insert near top, after H1).
5. **Add a between-pages "Up next" footer block** as a Markdown helper at the bottom of each page. e.g. on syntonic-comma: prev=Dashboard, next=Analysis. Framework's built-in `pager: "main"` field on pages config does some of this automatically once pages are registered (item 1). Effort: covered by #1.
6. **Add favicon + Open Graph tags** via the `head:` config. Existing head already injects KaTeX CSS — append `<meta property="og:title">`, `<meta property="og:description">`, `<link rel="icon">`. Effort: 20 min. Files: `observablehq.config.ts`, `src/favicon.svg` (new).

## Pitfalls / What to avoid

- **Don't keep both** the per-page `style:` frontmatter AND a config-level `theme:`. Per-page `style:` REPLACES the default stylesheet (this is the v1 UAT discovery, documented at `src/styles.css:1-26`). If you adopt opportunity 1, you MUST also adopt opportunity 2 in the same change — otherwise theme variables vanish on every page.
- **Don't hand-roll a custom layout** on top of Framework's grid. Framework ships `<div class="grid grid-cols-N">` + `<div class="card">` classes that are theme-aware. Bespoke flex/grid CSS will fight the theme tokens on dark/light flip.
- **Don't over-decorate the prose pages.** The `wide` modifier site-wide pushes all prose to ~1100px which hurts reading line-length. Keep `wide` to the dashboard only.
- **Don't migrate component CSS to global** without a plan. The 12 component CSS files are well-bounded — keep them; only collapse the theme-token re-declaration once Framework's defaults provide them again.
- **Don't introduce a UI library** (Tailwind, shadcn, etc.). Framework owns the design language; competing systems thrash. Per project CLAUDE.md: "prefer plain Markdown + reactive cells + small custom Web Components."
- **Avoid breaking the synth lifecycle** when adding nav. Pattern 4 (cell-owned synth) requires that the synth cell has no dependencies on other cells — a header/footer or new components must NOT import synth state.

## Recommended Shortlist (impact × effort)

Pick any of these in any order; #1 + #2 should ship together as one change.

1. **Switch to Framework theme + global stylesheet.** Set `theme: ["air", "near-midnight"]` and `style: "./styles.css"` in `observablehq.config.ts`. Drop `style:` from all three page frontmatters. Add `@import url("observablehq:default.css");` as the first line of `src/styles.css`, then delete the `:root` and `prefers-color-scheme: dark` blocks (`src/styles.css:40-66`). Net: real theme system, smaller CSS, no drift. **Effort: 1-2 hr.** Files touched: `observablehq.config.ts`, `src/styles.css`, `src/index.md`, `src/pages/syntonic-comma.md`, `src/pages/analysis.md`.
2. **Fix the sidebar.** Update `pages` in `observablehq.config.ts` to include Dashboard + Analysis + a "Theory notes" section containing the syntonic-comma page (snippet in Navigation #1 above). Add `toc: true` and `pager: "main"` (or per-section). **Effort: 15 min.** Files: `observablehq.config.ts`.
3. **Add an orientation card above the textarea on the dashboard.** A small `<div class="card">` (Framework class) with three sentences naming what's on the site and links to the other two pages. **Effort: 15 min.** Files: `src/index.md`.
4. **Add explicit H2 anchors on the dashboard** ("Scale", "Audition", "Export", "Visualize") to give the page outline + make the new TOC useful. The component-emitted H2's already cover Audition / Lattice / etc. — add the missing two. **Effort: 10 min.** Files: `src/index.md`.
5. **Add a header + footer.** `header:` = title bar with nav. `footer:` = "Source on GitHub · Last built {date}". Both via HTML-string in config (the function form requires more wiring). **Effort: 30 min.** Files: `observablehq.config.ts`, optionally `src/components/site-header.ts` if you want a real component.
6. **Apply `theme: wide` to the dashboard only** so the lattice/diamond SVGs stop overflowing the prose column. **Effort: 5 min.** Files: `src/index.md` frontmatter.

## Sources

- [Observable Framework config docs](https://github.com/observablehq/framework/blob/main/docs/config.md) — verified `theme`, `header`, `footer`, `toc`, `sidebar`, `pages` (with `{name, pages, open, pager}` section format), and `style` options. HIGH.
- Installed Framework themes — verified by listing `node_modules/@observablehq/framework/dist/style/theme-*.css`: `air, alt, coffee, cotton, deep-space, glacier, ink, midnight, near-midnight, ocean-floor, parchment, slate, stark, sun-faded, wide`. HIGH.
- Project files cited inline by `path:line`. HIGH.
- Framework `style:` per-page vs default-stylesheet replacement behavior — verified by the project's own UAT discovery comment at `src/styles.css:1-26`. HIGH.

## RESEARCH COMPLETE

**File:** `/Users/taylorbrook/Dev/Tuning Systems/.planning/quick/260507-mgl-look-into-ways-to-make-this-app-better-l/260507-mgl-RESEARCH.md`

**Shortlist digest:**
1. Set `theme: ["air","near-midnight"]` + global `style:`, import `observablehq:default.css`, delete the hand-rolled `:root` block in `src/styles.css` (1-2 hr)
2. Fix sidebar: register Dashboard + Analysis + "Theory notes" section in `pages`; add `toc: true`, `pager: "main"` (15 min)
3. Add orientation card above the textarea on the dashboard with 3 cross-page links (15 min)
4. Add H2 anchors ("Scale", "Visualize") so the page outline reads cleanly (10 min)
5. Add `header:` + `footer:` config strings; apply `theme: wide` to dashboard only (35 min combined)
