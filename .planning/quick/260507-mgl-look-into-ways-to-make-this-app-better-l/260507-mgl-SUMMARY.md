---
type: summary
quick_id: 260507-mgl
task: Implement shortlist items #1–#6 from RESEARCH (theme + global stylesheet, sidebar/TOC, orientation card, H2 anchors, header/footer + wide dashboard)
date: 2026-05-07
status: complete
mode: quick
files_modified:
  - observablehq.config.ts
  - src/styles.css
  - src/index.md
  - src/pages/syntonic-comma.md
  - src/pages/analysis.md
commits:
  - 2993fde — feat: adopt Framework theme + global stylesheet pipeline
  - 5bf5a7f — feat: register Dashboard + Analysis + Theory notes in sidebar; enable TOC and pager
  - 4cf0c3d — feat: add dashboard orientation card, Scale + Visualize H2 anchors, site header + footer
---

# Quick task 260507-mgl — Summary

Adopted Framework's native theme + global-stylesheet pipeline, restructured the sidebar with TOC + pager, and added the missing chrome (orientation card, H2 anchors, header, footer, wide-dashboard modifier). Replaces the v1 UAT workaround (per-page `style:` frontmatter + hand-rolled `:root` theme tokens) with the official Framework pattern, then layers on real navigation.

## Final state of `observablehq.config.ts`

```ts
// See https://observablehq.com/framework/config for documentation.
export default {
  title: "Tuning Systems",
  root: "src",
  theme: ["air", "near-midnight"],
  style: "styles.css",
  toc: true,
  pager: "main",
  header: `<div style="display:flex; align-items:baseline; gap:1rem;"><a href="/" style="font-weight:600; text-decoration:none; color:inherit;">Tuning Systems</a><span style="font-size:0.85em; color:var(--theme-foreground-muted);"><a href="/" style="color:inherit; text-decoration:none;">Dashboard</a> · <a href="/pages/analysis" style="color:inherit; text-decoration:none;">Analysis</a> · <a href="/pages/syntonic-comma" style="color:inherit; text-decoration:none;">Theory</a></span></div>`,
  footer: `<div>Source on <a href="https://github.com/" style="color:inherit;">GitHub</a> · Last built ${new Date().toISOString().slice(0, 10)}</div>`,
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

Verified at config-load time: the footer template literal interpolates the build date once (NOT a quoted string with `${...}` text), and dist/index.html / dist/pages/*.html all show `Last built 2026-05-07`.

## Stylesheet refactor (`src/styles.css`)

The `:root` block (former lines 43-66) and the `prefers-color-scheme: dark` variant are GONE — Framework's bundled palettes are now the source of truth. The first three lines are now:

```css
@import url("observablehq:default.css");
@import url("observablehq:theme-air.css") (prefers-color-scheme: light);
@import url("observablehq:theme-near-midnight.css") (prefers-color-scheme: dark);
```

The 12 component `@import` lines, the iOS Safari font-size floor, the `.stop-all-audio` rules, and the `.dashboard-helper` / `.dashboard-error` rules are preserved unchanged.

**Why three theme imports rather than one default.css:** Per Framework's `mergeStyle` (`config.js:290`) and `getStyle` (`markdown.js:195`), when a config has BOTH `style:` and `theme:` set, the `style:` wins as the page-level default — config-level `theme:` is only used by pages with their own per-page `theme:` frontmatter. So the dashboard (which has `theme: [air, near-midnight, wide]` in its own frontmatter) loads Framework's bundled `theme-air,near-midnight,wide.css`; the prose pages load `styles.css` and need to pull in their own theme palettes. The three @import lines do exactly that: default chrome + light palette + dark palette guarded by media query.

This is the canonical Framework pattern — confirmed by inspecting `node_modules/@observablehq/framework/dist/theme.js:74-81`, where `renderTheme(["air","near-midnight"])` produces the same three lines.

## Per-page frontmatter

| Page | Before | After |
|------|--------|-------|
| `src/index.md` | `style: ./styles.css` | `theme: [air, near-midnight, wide]` |
| `src/pages/analysis.md` | `style: ../styles.css` | (no frontmatter) |
| `src/pages/syntonic-comma.md` | `style: ../styles.css` | (no frontmatter) |

The dashboard's `theme: wide` modifier means its main column is ~1100px (lattice/diamond/keyboard SVGs no longer overflow). The prose pages have no frontmatter and inherit the global `style: "styles.css"` for a narrow ~640px column.

## Dashboard content additions (`src/index.md`)

Orientation card inserted after the H1 subtitle:

```markdown
<div class="card" style="margin-block: 24px;">
  <p>This is a research notebook for designing just-intonation scales. Build a scale here, audition it, and export it as <code>.scl</code>/<code>.kbm</code>. The <a href="./pages/analysis">Analysis</a> page maps it to EDOs, builds MOS scales, and compares scales side-by-side. The <a href="./pages/syntonic-comma">Theory notes</a> are short essays on intervals and commas.</p>
  <p style="margin-block-end: 0;"><strong>You are here:</strong> Dashboard · <a href="./pages/analysis">Analysis</a> · <a href="./pages/syntonic-comma">Theory: the syntonic comma</a></p>
</div>
```

Two H2 anchors added so the new right-rail TOC has labels for the page's two unlabeled sections:

- `## Scale` immediately before the textarea cell (`const scaleText = view(Inputs.textarea(...))`).
- `## Visualize` immediately before the lattice cell.

Component-emitted H2's (`Audition`, `Scala file (.scl)`, `Lattice`, `Tonality diamond`, `Keyboard`) are unchanged. The tail link `Read: [the syntonic comma →]` is preserved (additive, not a replacement for the orientation card).

## Site-wide header + footer

Built HTML emits `<header id="observablehq-header">` and `<footer id="observablehq-footer">` on all three pages:

```html
<header id="observablehq-header"><div>
  <div style="display:flex; align-items:baseline; gap:1rem;">
    <a href="./" style="font-weight:600; text-decoration:none; color:inherit;">Tuning Systems</a>
    <span style="font-size:0.85em; color:var(--theme-foreground-muted);">
      <a href="./" style="color:inherit; text-decoration:none;">Dashboard</a> ·
      <a href="./pages/analysis" style="color:inherit; text-decoration:none;">Analysis</a> ·
      <a href="./pages/syntonic-comma" style="color:inherit; text-decoration:none;">Theory</a>
    </span>
  </div>
</div></header>

<footer id="observablehq-footer"><div>
  <div>Source on <a href="https://github.com/" style="color:inherit;" target="_blank" rel="noopener noreferrer">GitHub</a> · Last built 2026-05-07</div>
</div></footer>
```

(Framework rewrites bare `href="/..."` to relative paths and auto-adds `target="_blank" rel="noopener noreferrer"` to external links.)

## Verification (per task)

| Task | Build pass | Constraint check |
|------|-----------|------------------|
| 1: theme + global stylesheet | `npm run build` exits 0; 4 links validated; dev server still 200 OK | dist/index.html links `theme-air,near-midnight,wide.a043bff5.css`; dist/pages/*.html link `_import/styles.*.css` containing all `--theme-foreground-*` tokens via `@import` chain |
| 2: sidebar + TOC + pager | `npm run build` exits 0 | dist/index.html `<nav id="observablehq-sidebar">` shows `Dashboard`, `Analysis`, `<details open><summary>Theory notes</summary>` containing `The syntonic comma`; pager `<a rel="next"/rel="prev">` chains across pages |
| 3: orientation card + H2s + header/footer | `npm run build` exits 0; 15 links validated (was 4) | dist/index.html shows `<div class="card">` orientation block, `<h2 id="scale">Scale</h2>`, `<h2 id="visualize">Visualize</h2>`, `<header id="observablehq-header">`, `<footer id="observablehq-footer">Last built 2026-05-07</footer>`; same header/footer on both prose pages |

The dev server on http://127.0.0.1:3000/ remained responsive throughout (HTTP 200 OK before and after each task's commit). The dev server is bound to the parent worktree (not this agent worktree), so it does not reflect the new branch — but the build artifacts in `dist/` are authoritative.

## Manual UAT walkthrough notes (deferred to user)

The following browser-based checks from the plan's `<verify>` block require an actual browser session. The build proves they SHOULD pass; explicit human walk:

- [ ] Visit `/` — orientation card renders directly under H1 subtitle; three card links navigate correctly.
- [ ] Sidebar shows Dashboard / Analysis / Theory notes (open) / The syntonic comma in that order on every page.
- [ ] Right-rail TOC on `/pages/analysis` lists the four H2 sections (Best-fit EDOs, JI in N-EDO, MOS construction, Compare scales).
- [ ] Right-rail TOC on `/` lists Scale, Audition, Scala file (.scl), Visualize, Lattice, Tonality diamond, Keyboard.
- [ ] Header visible on every page with title + three nav links; footer shows `Source on GitHub · Last built 2026-05-07`.
- [ ] DevTools: `getComputedStyle(document.body).getPropertyValue('--theme-foreground')` returns a non-empty value on every page, light + dark.
- [ ] System Settings → Appearance: flipping light/dark switches both pages live (air ↔ near-midnight) including all components.
- [ ] Dashboard: lattice / tonality-diamond / keyboard SVGs fit the wide main column (~1100px) without overflow. Prose pages stay narrow (~640px).
- [ ] No regressions: textarea parses, scale-table renders, audio panel + .scl/.kbm I/O + lattice + diamond + keyboard all still work; "Stop all audio" floating button + Esc still cancel audio; hash share-URL still updates and round-trips.

## Deviations from plan

### Auto-fixed during execution

**1. [Rule 1 — Bug] Prose pages would lose theme color tokens with default.css alone**

- **Found during:** Task 1 verification (post-build inspection of dist/_import/styles.*.css).
- **Issue:** The plan instructed `@import url("observablehq:default.css");` as the first line of `src/styles.css`. After building, `dist/_import/styles.*.css` contained the default chrome but had ZERO concrete `--theme-foreground:` / `--theme-background:` declarations. Inspection of `node_modules/@observablehq/framework/dist/style/default.css` confirmed it imports only chrome modules (global / layout / grid / note / card / inspector / plot) — the theme color tokens live in `theme-{air,near-midnight,…}.css` + their `abstract-{light,dark}.css` chain. Without those imports the prose pages would have rendered with missing/black-on-black tokens — the same v1 UAT problem in reverse.
- **Fix:** Added two more `@import` lines after `default.css`:

  ```css
  @import url("observablehq:theme-air.css") (prefers-color-scheme: light);
  @import url("observablehq:theme-near-midnight.css") (prefers-color-scheme: dark);
  ```

  This mirrors what Framework's `renderTheme(["air","near-midnight"])` emits (verified at `node_modules/@observablehq/framework/dist/theme.js:74-81`). Post-fix build: `dist/_import/styles.*.css` contains `--theme-foreground-alt`, `--theme-foreground-faint`, `--theme-foreground-faintest`, `--theme-foreground-focus`, `--theme-foreground-fainter`, `--theme-foreground-muted`, `color-scheme: light/dark`, etc., guarded by the `prefers-color-scheme` media query.
- **Files modified:** `src/styles.css`
- **Commit:** Bundled into 2993fde (Task 1) — kept atomic with the original style swap so the working tree never had a half-state.
- **Why this counts as Rule 1, not architectural:** It's a missing CSS @import that the plan would have caught at human UAT step 1 ("DevTools: --theme-foreground returns a non-empty value"). Fixing it inline avoids a guaranteed regression. No architectural change — same single-stylesheet pipeline, three @imports instead of one.

### Pre-existing, out-of-scope (not fixed)

- **`npm run lint:types` reports 5 errors** about `npm:sw-synth`, `npm:ji-lattice`, `npm:@observablehq/plot` not found, plus two implicit-any params in `lattice.ts:197-198`. Confirmed pre-existing on the base commit `5a27feb` (verified by stash + lint:types + stash pop). These are Framework `npm:` virtual specifiers that `tsc --noEmit` doesn't understand — runtime works. Out of scope per the executor's scope-boundary rule (only auto-fix issues directly caused by the current task's changes).
- **GitHub repo URL is a placeholder.** The footer's `Source on <a href="https://github.com/">GitHub</a>` keeps the bare `https://github.com/` placeholder per plan instruction ("leave as placeholder unless the user has confirmed a public repo URL — the project is local-first"). Future quick task: replace once the project has a public repo, or remove the GitHub link if the project stays local-first.

## Self-Check: PASSED

**Files modified (per plan):**

- `observablehq.config.ts` — exists and reflects all three tasks' edits (theme, style, toc, pager, pages, header, footer, head).
- `src/styles.css` — exists; first three @import lines pull default + theme-air + theme-near-midnight; component @imports preserved; `:root` and dark `:root` blocks deleted.
- `src/index.md` — exists; frontmatter is `theme: [air, near-midnight, wide]`; orientation card present after H1 subtitle; `## Scale` and `## Visualize` H2s in the right positions; tail syntonic-comma link preserved.
- `src/pages/analysis.md` — exists; no frontmatter (file starts with `# Analysis`).
- `src/pages/syntonic-comma.md` — exists; no frontmatter (file starts with `# The syntonic comma`).

**Commits exist on this branch (`worktree-agent-a02683be7ba7a5790`):**

- 2993fde — found.
- 5bf5a7f — found.
- 4cf0c3d — found.

**Build artifacts:**

- `dist/index.html` — orientation card, Scale + Visualize H2 anchors, header, footer, theme-air,near-midnight,wide stylesheet link all present.
- `dist/pages/analysis.html` — header, footer, sidebar, TOC, pager (`prev → ../`, `next → ./syntonic-comma`), styles.css link with theme tokens all present.
- `dist/pages/syntonic-comma.html` — header, footer, sidebar, TOC, pager (`prev → ./analysis`), styles.css link with theme tokens all present.
- 15 link validations pass (was 4 pre-task).
