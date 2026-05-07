---
type: plan
quick_id: 260507-mgl
task: Implement shortlist items #1–#5 from RESEARCH (theme + global stylesheet, sidebar/TOC, orientation card, H2 anchors, header/footer + wide dashboard)
date: 2026-05-07
mode: quick
files_modified:
  - observablehq.config.ts
  - src/styles.css
  - src/index.md
  - src/pages/syntonic-comma.md
  - src/pages/analysis.md
autonomous: true
---

<objective>
Adopt Framework's native theme + global-stylesheet pipeline, restructure the sidebar/TOC, and add the missing chrome (orientation card, H2 anchors, header, footer, wide dashboard) to make the site better-looking and more navigable. Implements all six items in the research shortlist as one coordinated change.

Purpose: Replace the v1 UAT workaround (per-page `style:` frontmatter + hand-rolled `:root` theme tokens) with the official Framework pattern, then layer on real navigation.
Output: Working theme-driven site with proper sidebar, TOC, orientation card, header/footer, and a wide dashboard that no longer overflows its column.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@/Users/taylorbrook/Dev/Tuning Systems/.planning/quick/260507-mgl-look-into-ways-to-make-this-app-better-l/260507-mgl-RESEARCH.md
@/Users/taylorbrook/Dev/Tuning Systems/CLAUDE.md
@/Users/taylorbrook/Dev/Tuning Systems/observablehq.config.ts
@/Users/taylorbrook/Dev/Tuning Systems/src/styles.css
@/Users/taylorbrook/Dev/Tuning Systems/src/index.md
@/Users/taylorbrook/Dev/Tuning Systems/src/pages/syntonic-comma.md
@/Users/taylorbrook/Dev/Tuning Systems/src/pages/analysis.md

<key_facts>
Framework config keys verified in node_modules/@observablehq/framework/dist/config.js:
- `theme` accepts an array of theme names; `wide` is a modifier theme.
- `style` (top-level): path to a global stylesheet that REPLACES default.css. Re-import default with `@import url("observablehq:default.css")` to keep theme tokens.
- `header` / `footer` accept HTML strings.
- `toc: true` enables right-rail TOC site-wide.
- `pager: "main"` enables prev/next navigation tied to the `pages` order.
- `pages` entries support `{ name, path }` for leaf pages and `{ name, open, pager, pages: [...] }` for sections.

UAT discovery (src/styles.css:1-26): per-page `style:` REPLACES default.css. The fix is global `style:` + `@import url("observablehq:default.css")`. The `:root` block at lines 43-66 hand-mirrors air/coffee tokens and MUST be deleted once the default stylesheet is re-imported, otherwise it will override the theme.

Current dashboard already has component-emitted H2's (Audition, Scala file (.scl), Lattice, Tonality diamond, Keyboard). Missing H2's: above the textarea (Scale) and above the lattice block (Visualize).

Existing tail-of-page link at src/index.md:247 (`Read: [the syntonic comma →](pages/syntonic-comma)`) should remain — the new orientation card is additive, not a replacement.

The Stop-all-audio button is `position: fixed` (src/styles.css:85-101) and is unaffected by `theme: wide`.
</key_facts>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Theme + global stylesheet swap (research shortlist #1, #6)</name>
  <files>observablehq.config.ts, src/styles.css, src/index.md, src/pages/syntonic-comma.md, src/pages/analysis.md</files>
  <action>
Adopt Framework's native theme system and replace per-page `style:` frontmatter with a global stylesheet. This is items #1 (theme + global style swap) and #6 (wide theme on dashboard only) from the research shortlist; they MUST ship together — see RESEARCH.md "Pitfalls" line 84: "If you adopt opportunity 1, you MUST also adopt opportunity 2 in the same change — otherwise theme variables vanish on every page."

Edits:

1. **observablehq.config.ts** — add `theme` and `style` fields. Final shape:
   ```ts
   export default {
     title: "Tuning Systems",
     root: "src",
     theme: ["air", "near-midnight"],
     style: "styles.css",
     pages: [{ name: "Syntonic comma", path: "/pages/syntonic-comma" }], // Task 2 will rewrite this
     head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM" crossorigin="anonymous">`,
   };
   ```
   Note: `style: "styles.css"` is resolved relative to `root: "src"` per Framework config docs (no leading `./` or `/`).

2. **src/styles.css** — at the top of the file (before any existing `@import` lines, but AFTER the leading comment block), insert as the first import:
   ```css
   @import url("observablehq:default.css");
   ```
   Then DELETE lines 40-66 entirely — the `/* Theme tokens — kept after @import ... */` comment, the `:root { ... }` block, and the `@media (prefers-color-scheme: dark) { :root { ... } }` block. Framework's default.css (now re-imported) provides the `--theme-*` tokens for the `air` (light) and `near-midnight` (dark) themes selected in step 1.
   Also UPDATE the leading comment block (lines 1-26) so it reflects the new reality. Replace the comment with something concise like:
   ```css
   /*
    * styles.css — global stylesheet for Tuning Systems.
    *
    * Loaded via observablehq.config.ts `style:` (which REPLACES default.css —
    * this file re-imports default.css on the first @import line so theme tokens
    * remain available). Component CSS files are aggregated below via @import.
    *
    * Per-page `style:` frontmatter is NOT used; this is the single global sheet.
    */
   ```
   Keep all 12 component `@import` lines (lines 27-38) as-is. Keep the iOS Safari font-size floor (lines 73-77), the .stop-all-audio rules (lines 85-109), and the .dashboard-helper / .dashboard-error rules (lines 112-126) — these are NOT theme tokens, they're project-specific rules that reference `var(--theme-*)` which the re-imported default.css now provides.

3. **src/index.md** frontmatter — REPLACE the current frontmatter:
   ```yaml
   ---
   style: ./styles.css
   ---
   ```
   with the wide-theme override (research shortlist #6):
   ```yaml
   ---
   theme: [air, near-midnight, wide]
   ---
   ```
   This makes the dashboard wide while leaving the prose pages narrow, fixing the lattice/diamond/keyboard SVG overflow. Remove the `style:` line entirely — global style takes over. Note Task 3 will REPLACE this frontmatter again to add the orientation card content; keep the wide theme line through both edits.

4. **src/pages/syntonic-comma.md** frontmatter — DELETE the entire frontmatter block (lines 1-3: `---\nstyle: ../styles.css\n---`). The page no longer needs frontmatter; it inherits the global style and default theme. (Or keep an empty `---\n---` block if Framework requires it — Framework does NOT require frontmatter, so deletion is fine.) The opening `# The syntonic comma` heading on the next line becomes line 1.

5. **src/pages/analysis.md** frontmatter — same as syntonic-comma: DELETE the entire `---\nstyle: ../styles.css\n---` block (lines 1-3). The `# Analysis` heading becomes line 1.

DO NOT touch component CSS files (src/components/*.css). The research is explicit (Pitfalls line 87): "Don't migrate component CSS to global without a plan. The 12 component CSS files are well-bounded — keep them."

DO NOT introduce a UI library (Tailwind etc.) — see CLAUDE.md and RESEARCH.md Pitfalls line 88.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npm run lint:types && npm run build 2>&1 | tail -30</automated>
Manual (post-build): start dev server with `npm run dev`, then in a browser:
1. Visit `http://localhost:3000/` — confirm prose renders with theme tokens populated (text is dark on light background, no fallback-black-on-black). Open DevTools and confirm `getComputedStyle(document.body).getPropertyValue('--theme-foreground')` returns a non-empty value.
2. Visit `http://localhost:3000/pages/syntonic-comma` and `/pages/analysis` — confirm same theme tokens populate, all components render styled (scale-table monospace + small-caps header, ratio pills, play buttons, etc.).
3. Toggle macOS system appearance (System Settings → Appearance → Light/Dark) — confirm both themes flip live (`air` ↔ `near-midnight`) on every page including all components.
4. On the dashboard `/`, confirm the lattice / tonality-diamond / keyboard SVGs no longer overflow their column (the wide-theme main column should be ~1100px). On the prose pages, confirm column stays narrow (~640px).
  </verify>
  <done>
- `observablehq.config.ts` has `theme: ["air", "near-midnight"]` and `style: "styles.css"`.
- `src/styles.css` first import is `@import url("observablehq:default.css")`; the `:root` and `prefers-color-scheme` blocks (former lines 40-66) are removed; component imports preserved.
- `src/index.md` frontmatter reads `theme: [air, near-midnight, wide]` (no `style:` key).
- `src/pages/syntonic-comma.md` and `src/pages/analysis.md` have NO frontmatter (or empty `---\n---`).
- `npm run lint:types` and `npm run build` both pass.
- Manual: dark-mode flip works, dashboard SVGs fit column, prose pages stay narrow.
  </done>
</task>

<task type="auto">
  <name>Task 2: Sidebar restructure + TOC + pager (research shortlist #2)</name>
  <files>observablehq.config.ts</files>
  <action>
Replace the single-entry `pages` array with the full three-page structure including a "Theory notes" section. Add `toc: true` and `pager: "main"` so every page gets a right-rail TOC and prev/next links along the sidebar order.

Final config shape (full file):
```ts
// See https://observablehq.com/framework/config for documentation.
export default {
  title: "Tuning Systems",
  root: "src",
  theme: ["air", "near-midnight"],
  style: "styles.css",
  toc: true,
  pager: "main",
  pages: [
    { name: "Dashboard", path: "/" },
    { name: "Analysis", path: "/pages/analysis" },
    {
      name: "Theory notes",
      open: true,
      pages: [{ name: "The syntonic comma", path: "/pages/syntonic-comma" }],
    },
  ],
  head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM" crossorigin="anonymous">`,
};
```

Notes:
- `pager: "main"` is a string per Framework's config normalizer (`config.js:246`) — it identifies a pager group; `"main"` is the default group name. All three pages share the group so prev/next chains across them in sidebar order: Dashboard → Analysis → Theory notes / The syntonic comma.
- `toc: true` is the boolean shorthand; Framework expands it to `{ show: true, label: "Contents" }` (see config.js:281). Per-page can override with `toc: false` later if a page needs to opt out.
- The "Theory notes" section uses the `{ name, open, pages }` shape (no `path`). `open: true` makes the section pre-expanded in the sidebar.
- Header (`/`) is the dashboard via `path: "/"` — Framework recognizes this as `src/index.md`.
- Task 1 will already have added `theme:` and `style:` to this file; this task is purely the sidebar/TOC/pager additions plus the `pages` rewrite. If Task 1 placed `theme`/`style` in different positions, preserve their values and just modify `pages` and add `toc` + `pager`.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npm run lint:types && npm run build 2>&1 | tail -20</automated>
Manual (dev server):
1. Confirm the sidebar shows three top-level entries in this order: **Dashboard**, **Analysis**, **Theory notes** (expandable section), with **The syntonic comma** nested under "Theory notes".
2. Confirm the right-rail TOC appears on `/pages/analysis` listing the four H2 sections (Best-fit EDOs, JI in N-EDO, MOS construction, Compare scales).
3. Confirm prev/next links appear at the bottom of every page tied to the sidebar order (Dashboard → Analysis → The syntonic comma).
4. Confirm clicking each sidebar entry navigates correctly and the active page is highlighted.
  </verify>
  <done>
- `observablehq.config.ts` `pages` array has Dashboard + Analysis + Theory notes section.
- `toc: true` and `pager: "main"` present at top level.
- Build passes.
- Manual: sidebar shows correct three-entry hierarchy; TOC renders on long pages; prev/next links work.
  </done>
</task>

<task type="auto">
  <name>Task 3: Dashboard content additions — orientation card, H2 anchors, header + footer (research shortlist #3, #4, #5)</name>
  <files>src/index.md, observablehq.config.ts</files>
  <action>
Add the dashboard's orientation card and section H2 anchors, and add a site-wide header + footer via config HTML strings.

**A. src/index.md — orientation card + H2 anchors.**

The current top of the file (after the frontmatter from Task 1) is:
```markdown
# Tuning Systems

A scale-design workspace. Type a scale, hear it, export it.

```ts
import { Interval } from "./lib/interval.js";
...
```
```

After Task 1 the frontmatter is `theme: [air, near-midnight, wide]`. Keep that. Insert the orientation card AFTER the `A scale-design workspace.` subtitle line and BEFORE the first ```ts``` import block. Use Framework's built-in `card` class — markdown only, no new component (per scope: "Markdown-only — no new component"):

```markdown
<div class="card" style="margin-block: 24px;">
  <p>This is a research notebook for designing just-intonation scales. Build a scale here, audition it, and export it as <code>.scl</code>/<code>.kbm</code>. The <a href="./pages/analysis">Analysis</a> page maps it to EDOs, builds MOS scales, and compares scales side-by-side. The <a href="./pages/syntonic-comma">Theory notes</a> are short essays on intervals and commas.</p>
  <p style="margin-block-end: 0;"><strong>You are here:</strong> Dashboard · <a href="./pages/analysis">Analysis</a> · <a href="./pages/syntonic-comma">Theory: the syntonic comma</a></p>
</div>
```

Then add an H2 `## Scale` ABOVE the textarea cell. The textarea is rendered by the cell at lines 81-87 (`const scaleText = view(Inputs.textarea({...}))`). Insert `## Scale` on its own line (with blank lines around) immediately BEFORE that ```ts``` block. Note: the seedTextLiteral cell (lines 64-72) and the parse error cells (52-78) are setup-only and don't render anything visible, so positioning the H2 right before the textarea cell is correct visually.

Insert `## Visualize` ABOVE the lattice block. The lattice cell is at lines 218-221:
```ts
// Phase 3 (D-01/D-02 — full-bleed vertical viz stack, document order).
if (scale) display(lattice(scale, synth, { baseHz: effectiveBaseHz }));
```
Place `## Visualize` on its own line BEFORE this ```ts``` block (the comment ABOVE the lattice render is the natural anchor).

DO NOT add H2's elsewhere — the component-emitted H2's already cover Audition (audio-panel), Scala file (.scl) (scl-io), Lattice, Tonality diamond, Keyboard. Adding more would duplicate.

DO NOT remove the existing tail link `Read: [the syntonic comma →](pages/syntonic-comma)` at line 247 — the orientation card is additive.

**B. observablehq.config.ts — header + footer.**

Add `header` and `footer` HTML strings. Final config shape (additions to the Task 2 result):
```ts
export default {
  title: "Tuning Systems",
  root: "src",
  theme: ["air", "near-midnight"],
  style: "styles.css",
  toc: true,
  pager: "main",
  header: `<div style="display:flex; align-items:baseline; gap:1rem;"><a href="/" style="font-weight:600; text-decoration:none; color:inherit;">Tuning Systems</a><span style="font-size:0.85em; color:var(--theme-foreground-muted);"><a href="/" style="color:inherit; text-decoration:none;">Dashboard</a> · <a href="/pages/analysis" style="color:inherit; text-decoration:none;">Analysis</a> · <a href="/pages/syntonic-comma" style="color:inherit; text-decoration:none;">Theory</a></span></div>`,
  footer: `<div>Source on <a href="https://github.com/" style="color:inherit;">GitHub</a> · Last built ${"${new Date().toISOString().slice(0, 10)}"}</div>`,
  pages: [
    { name: "Dashboard", path: "/" },
    { name: "Analysis", path: "/pages/analysis" },
    {
      name: "Theory notes",
      open: true,
      pages: [{ name: "The syntonic comma", path: "/pages/syntonic-comma" }],
    },
  ],
  head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM" crossorigin="anonymous">`,
};
```

IMPORTANT — the footer date interpolation: `header` and `footer` accept HTML strings, not template-literal expressions evaluated at build. Use a plain JS template literal (with backticks) so the build interpolates ONCE at config-load time:
```ts
footer: `<div>Source on <a href="https://github.com/" style="color:inherit;">GitHub</a> · Last built ${new Date().toISOString().slice(0, 10)}</div>`,
```
(The earlier example used a quoted-string-with-`${...}`-as-text by accident; use a real template literal so the date interpolates.)

GitHub URL: leave as `https://github.com/` placeholder unless the user has confirmed a public repo URL — the project is local-first and the SUMMARY for this quick task can flag this as a follow-up if needed.

DO NOT use the function form of header/footer (`({path, title}) => string`) — research recommends HTML string for simplicity (RESEARCH.md shortlist line 99: "via HTML-string in config (the function form requires more wiring)"). The site-header.ts component is also out of scope.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npm run lint:types && npm run build 2>&1 | tail -20</automated>
Manual (dev server):
1. Visit `/` — confirm the orientation card is visible directly under the H1+subtitle, BEFORE the textarea. Confirm the three card links (Dashboard / Analysis / Theory: the syntonic comma) navigate correctly.
2. Confirm `## Scale` H2 is visible above the textarea, and `## Visualize` H2 is visible above the lattice widget.
3. Confirm the right-rail TOC on the dashboard now lists: Scale, Audition, Scala file (.scl), Visualize, Lattice, Tonality diamond, Keyboard (in document order).
4. Confirm the site header strip appears on every page with title + nav links.
5. Confirm the footer appears at the bottom of every page with "Source on GitHub · Last built YYYY-MM-DD" and the date matches today's build date.
6. Confirm no existing functionality regressed: textarea still parses, scale-table still renders, audio panel + .scl I/O + lattice + diamond + keyboard all still work, "Stop all audio" floating button still works, hash share-URL still updates.
  </verify>
  <done>
- `src/index.md` has an orientation card after the subtitle with three cross-page links.
- `## Scale` precedes the textarea cell; `## Visualize` precedes the lattice cell.
- The tail link to the syntonic comma is preserved at the bottom of `src/index.md`.
- `observablehq.config.ts` has `header` and `footer` set to HTML-string template literals.
- The footer date interpolates the build date via `${new Date().toISOString().slice(0, 10)}`.
- Build passes; all dashboard widgets still functional in dev server.
  </done>
</task>

</tasks>

<verification>
After all three tasks complete, run the full CI gate:
```bash
cd "/Users/taylorbrook/Dev/Tuning Systems" && npm run ci
```
Confirm: lint:types passes, vitest passes (no test changes in this task), eslint passes, prettier --check passes, build succeeds.

Manual end-to-end smoke test:
1. `npm run dev` and walk all three pages: `/`, `/pages/analysis`, `/pages/syntonic-comma`.
2. Sidebar shows correct hierarchy on every page.
3. TOC renders on every page; dashboard TOC includes "Scale" and "Visualize".
4. Header + footer render on every page.
5. Dark/light mode flip works on every page.
6. Dashboard SVGs fit the wide column; prose pages remain narrow.
7. All audio paths work: drone, arpeggio, syntonic-comma play buttons. Esc + Stop button still cancel audio.
8. Hash share-URL still works (paste a `#s=...` URL into a fresh tab → scale loads).
</verification>

<success_criteria>
- The visitor lands on a styled site with sidebar, TOC, header, and footer.
- The sidebar shows Dashboard / Analysis / Theory notes (with syntonic-comma nested), in that order.
- The dashboard reads as a coherent outline: Hero + orientation card → Scale → Audition → Scala file (.scl) → Visualize (Lattice / Tonality diamond / Keyboard) → tail link.
- The dashboard's lattice/diamond/keyboard SVGs no longer overflow their column.
- Dark mode flips on all pages and components without manual override.
- No theme-token re-declaration remains in `src/styles.css` (Framework's default.css is the source of truth).
- No regressions: parse, audio, .scl/.kbm I/O, hash share-URL, Esc/Stop button, all four analysis widgets continue to work on both pages.
- `npm run ci` exits 0.
</success_criteria>

<output>
After completion, create `.planning/quick/260507-mgl-look-into-ways-to-make-this-app-better-l/260507-mgl-SUMMARY.md` covering:
- Final state of `observablehq.config.ts` (theme, style, toc, pager, pages, header, footer).
- Confirmation that the `:root` token block was removed from `src/styles.css` and `@import url("observablehq:default.css")` is now line 1.
- Confirmation that all three Markdown pages no longer carry per-page `style:` frontmatter.
- The orientation card markup as inserted, and the two H2 headings added.
- Header/footer HTML strings as set.
- Any deviations from this plan (e.g., GitHub URL placeholder kept) flagged for a future quick task.
- Manual UAT walkthrough notes (sidebar / TOC / theme flip / wide dashboard / no regressions).
</output>
