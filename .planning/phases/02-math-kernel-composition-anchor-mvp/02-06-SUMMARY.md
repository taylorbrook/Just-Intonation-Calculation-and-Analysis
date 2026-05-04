---
phase: 02-math-kernel-composition-anchor-mvp
plan: 06
subsystem: ui-components

tags:
  - components
  - dom-factories
  - widgets
  - ui
  - inventory-consolidation

requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: Interval (Plan 02) + Scale (Plan 03) + parseScl/writeScl/scalaToCsv (Plan 04) + SynthHandle (Plan 05) + UI-SPEC + KaTeX head injection (Plan 01)

provides:
  - playInterval — inline ▶ button widget for theory pages (NOTES-03); plays [baseHz, baseHz × interval]
  - playScale — inline ⏵⏵ Play scale button; arpeggiates scale.intervals
  - scaleTable — 4-column table per D-06 with optional Copy table button → scalaToCsv (IO-04)
  - ratioPill — inline `<code>n/d</code> <small>(~cents¢)</small>` pill for prose (NOT KaTeX)
  - audioPanel — dashboard-only audition controls (D-07): interval-selector + ▶ Play, ⏵⏵ Arpeggiate, 🔇/🔊 Drone toggle
  - sclIo — dashboard-only .scl import/export with D-22 filename default + role=status announcements
  - INVENTORY.md consolidation — appended four sections (Scale, Scala I/O, Audio, Components) with rows for all symbols delivered by Plans 03/04/05/06

affects:
  - 02-07 (composition dashboard composes audioPanel + sclIo + scaleTable + scale-text-input; theory page uses ratioPill + playInterval inline)
  - Phase 03 (visualization may add lattice widgets but the v1 widget set ships intact)

tech-stack:
  added:
    - "(none — components consume existing types from src/lib/ + src/audio/ only; no new runtime dependencies)"
  patterns:
    - "ARCHITECTURE Pattern 2 — every widget is a plain factory `(data, ...rest, opts?) => HTMLElement` with no module-level state and no global synth registry; SynthHandle passed in by caller (D-09 owner-allocates)"
    - "Three-layer discipline preserved — src/components/ imports types from src/lib/ + src/audio/; never imports from sw-synth directly (verified by grep across all six .ts files)"
    - "Defense-in-depth XSS mitigation — all dynamic cell values + status messages + option labels rendered via `createElement` + `textContent`, never `innerHTML` (T-02-22, T-02-23, T-02-14)"
    - "Pitfall #9 voice-tracking pattern — audioPanel's drone toggle holds the stop callback returned by `synth.startDrone`, invokes it on second click; null-out after stop so the toggle is idempotent across rapid clicks"
    - "UI-SPEC theme-token discipline — every CSS file consumes `--theme-blue`, `--theme-foreground`, `--theme-foreground-alt`, `--theme-foreground-focus`, `--theme-background`, `--monospace`, `--sans-serif`; zero hard-coded hex values (verified by grep `#[0-9a-f]` returning nothing)"
    - "Color-independent state signaling — drone-on uses three redundant cues (icon swap 🔇 ↔ 🔊, visible text 'Drone off' ↔ 'Drone on', `aria-pressed` attribute, AND a 12% blue tint); no information conveyed by color alone (UI-SPEC accessibility)"
    - "Accessibility — real `<button type='button'>` everywhere (not div+click); native `<select>` for interval picker; role=status aria-live=polite for .scl announcements; Framework focus rings preserved via :focus-visible"
    - "0.1¢ display precision (Pitfall #16) — scaleTable + ratioPill default to `toFixed(1)`; scaleTable allows `opts.precision` override for sub-cent comparison work"

key-files:
  created:
    - src/components/play-interval.ts
    - src/components/play-scale.ts
    - src/components/scale-table.ts
    - src/components/ratio-pill.ts
    - src/components/audio-panel.ts
    - src/components/scl-io.ts
    - src/components/play-buttons.css
    - src/components/scale-table.css
    - src/components/ratio-pill.css
    - src/components/audio-panel.css
    - src/components/scl-io.css
  modified:
    - src/lib/INVENTORY.md

key-decisions:
  - "Honored D-09 + ARCHITECTURE Pattern 2 — every widget is a plain `(data, ...rest, opts?) => HTMLElement` factory; no Web Components, no module-level state, no synth registry. The caller (Plan 07's dashboard cell, theory pages' inline cells) owns the SynthHandle and passes it in explicitly."
  - "Honored D-10 widget set — six factories shipped: theory-page widgets (playInterval, playScale, scaleTable, ratioPill) + dashboard-only widgets (audioPanel, sclIo). D-11 satisfied: scaleTable is reused by both dashboard and theory pages — no separate dashboard-specific table."
  - "Honored D-06 4-column scaleTable — Degree | Ratio | Cents | ¢ from 12-TET. Cents at 0.1¢ default per Pitfall #16; `opts.precision` overrides."
  - "Honored D-07 audioPanel layout — interval-selector dropdown + ▶ Play, ⏵⏵ Arpeggiate, 🔇/🔊 Drone toggle. Drone uses Pitfall #9 stop-callback pattern."
  - "Honored D-08 baseHz default 440 (A4) — overridable via opts.baseHz on every widget that takes baseHz."
  - "Honored D-22 .scl filename default `scale-{N}-tone-{YYYY-MM-DD}` — N excludes the implicit 1/1 (a 7-tone scale reads `scale-7-tone-...` not `scale-8-tone-...`); user-editable text input shows the `.scl` extension as a separate static span so the user doesn't double-type."
  - "Honored Three-layer discipline — `grep -E \"from ['\\\"]sw-synth['\\\"]\" src/components/*.ts` returns no matches; `grep -rE \"from ['\\\"]\\\\.\\\\./\" src/components/` shows imports only from `../lib/` and `../audio/`."
  - "Honored UI-SPEC color rule — accent (`--theme-blue`) only on `.play-btn` (play, arpeggiate, drone-active, .scl-export) and `:focus-visible` outline (`--theme-foreground-focus`). NO colored cents-from-12tet deltas; the deviation column shows sign typographically (`+3.9` / `-13.7`)."
  - "Honored UI-SPEC copywriting — heading 'Audition' (NOT 'Listen'), 'Arpeggiate scale' (NOT 'Play all'), 'Download .scl' (NOT 'Export'); `▶`, `⏵⏵`, `⤓` are typographic glyphs (NOT emojis) with `font-variant-emoji: text` on `.play-btn` so Apple's emoji renderer doesn't substitute colored glyphs."
  - "Honored UI-SPEC accessibility — real `<button type='button'>` everywhere; `aria-pressed` on drone toggle (state also conveyed by icon swap and text — color-independent); `role=status aria-live=polite` on .scl-io status region; Framework default focus rings kept via `:focus-visible` (no outline:none)."
  - "Honored T-02-22, T-02-23, T-02-14 (defense-in-depth XSS) — every dynamic cell value, status message, option label rendered via `createElement` + `textContent`. Only static `<th>` headers in scaleTable use `innerHTML` (no interpolated values). The .scl description (untrusted input from user-uploaded files) goes through `textContent` in the status region."
  - "Wave-3 INVENTORY consolidation — appended four sections in order: Scale (Plan 03's deferred rows), Scala I/O (Plan 04's deferred rows), Audio (Plan 05's deferred rows), Components (this plan's six widgets). Wave-2 file-ownership discipline preserved: Plans 03/04/05 ran in parallel without modifying INVENTORY.md; Plan 06 owns the consolidation."
  - "Decision: omit `import \"./foo.css\"` lines from .ts modules ⇒ KEPT them per the plan's explicit instruction. The plan acknowledges this is a smoke-test concern for Plan 07 (\"Verify by running npm run dev after this plan completes\"). Framework's esbuild transform passes the import declaration through unchanged; if Plan 07 hits a runtime error fetching .css as JS, the fix will be to migrate to `<link>` injection in the page's frontmatter `style:` field. Documented as a known risk in the Deferred Issues section below."

requirements-completed:
  - NOTES-01
  - NOTES-02
  - NOTES-03
  - NOTES-04

# Metrics
duration: 5min
completed: 2026-05-04
---

# Phase 02 Plan 06: v1 Widget Set + INVENTORY Consolidation Summary

**Six DOM-factory widgets — playInterval, playScale, scaleTable, ratioPill, audioPanel, sclIo — plus colocated CSS, plus Wave-3 consolidation of INVENTORY rows owed by Plans 03/04/05. The bridge between the math kernel + audio (Plans 02–05) and the pages (Plan 07).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-04T18:07:39Z
- **Completed:** 2026-05-04T18:12:49Z
- **Tasks:** 2
- **Files created:** 11 (6 .ts factories + 5 .css)
- **Files modified:** 1 (INVENTORY.md — four new sections appended)

## Accomplishments

- All six v1 widgets per D-10 implemented as plain factory functions
- Theory-page widgets: `playInterval`, `playScale`, `scaleTable`, `ratioPill` (used inline in syntonic-comma.md per UI-SPEC)
- Dashboard-only widgets: `audioPanel` (D-07: interval-selector + arpeggiate + drone toggle) + `sclIo` (D-22 filename + import/export)
- Five colocated CSS files using Framework theme tokens — zero hard-coded hex
- INVENTORY.md consolidated — four new sections appended in order: Scale, Scala I/O, Audio, Components (Wave-3 file-ownership discipline)
- Three-layer discipline preserved across all six .ts files (no sw-synth direct imports; only types from src/lib/ + src/audio/, plus the scalaToCsv/parseScl/writeScl/Scale value imports for scl-io and scale-table — these are kernel modules, not audio)
- Defense-in-depth XSS mitigation — `textContent` everywhere for dynamic content; `innerHTML` only for the static `<th>` row in scaleTable (no interpolated values)
- All 131 prior Phase-2 tests still pass — no regression to the kernel/audio layers
- `npm run lint:types`, `npm run lint`, `npm run build` all pass; format check clean on new files
- baseHz default 440 (D-08); cents at 0.1¢ default (Pitfall #16)
- Drone toggle uses Pitfall #9 stop-callback pattern; aria-pressed state announced

## Task Commits

Each task was committed atomically:

1. **Task 1: Theory-page widgets — playInterval, playScale, scaleTable, ratioPill** — `0adcb8b` (feat)
2. **Task 2: Dashboard widgets — audioPanel, sclIo + INVENTORY consolidation** — `3973482` (feat)

## Files Created/Modified

### Created
- `src/components/play-interval.ts` — inline ▶ button factory; baseHz default 440 (D-08); duration default 1.5s (D-18); optional `label: true` shows `▶ Play 5/4`
- `src/components/play-scale.ts` — inline ⏵⏵ Play scale button; arpeggiates `scale.intervals` at stepSec 0.45s (D-18)
- `src/components/scale-table.ts` — 4-column table per D-06; cents at 0.1¢ default (Pitfall #16); optional `copyButton: true` renders `Copy table` → `navigator.clipboard.writeText(scalaToCsv(...))`; `setTimeout` revert to default text after 1.5s; `aria-live=polite` on the button itself for the "Copied!" announcement
- `src/components/ratio-pill.ts` — `<span class="ratio-pill"><code>n/d</code> <small>(~cents¢)</small></span>`; Unicode rendering, NOT KaTeX (D-10, RESEARCH O-01)
- `src/components/audio-panel.ts` — three-row dashboard audition; D-07 layout; defaultDegree clamped into range; drone toggle uses `let stopDrone: (() => void) | null` to hold the stop callback (Pitfall #9)
- `src/components/scl-io.ts` — file picker + filename input + Download button; `defaultFilenameFor(scale)` → `scale-{N}-tone-{YYYY-MM-DD}`; description rendered via `textContent` (T-02-14); `fileInput.value = ""` reset after each load so re-picking the same file fires `change` again
- `src/components/play-buttons.css` — shared `.play-btn` styles (used by playInterval, playScale, audioPanel's play/arpeggiate/drone, sclIo's export)
- `src/components/scale-table.css` — `.scale-table` table styling + `.scale-table__copy` copy button
- `src/components/ratio-pill.css` — inline-flex baseline pill with monospace `<code>` + muted `<small>` cents
- `src/components/audio-panel.css` — three-row layout; `.audio-panel__drone[aria-pressed='true']` shows 12% blue tint
- `src/components/scl-io.css` — hides native file input via `display:none` (the styled importBtn drives it)

### Modified
- `src/lib/INVENTORY.md` — appended four new sections IN ORDER below the existing Phase 2 entries:
  - **Phase 2 — Scale entries (added by Plan 06 on behalf of Plan 03):** `Scale` class + `jiSubsetOfEdo`
  - **Phase 2 — Scala I/O entries (added by Plan 06 on behalf of Plan 04):** `parseScala`, `parseScl`, `writeScl`, `scalaToCsv`
  - **Phase 2 — Audio entries (added by Plan 06 on behalf of Plan 05):** `createSynth`, `SynthHandle`
  - **Phase 2 — Components entries (this plan):** `playInterval`, `playScale`, `scaleTable`, `ratioPill`, `audioPanel`, `sclIo`

## Decisions Made

(See `key-decisions` in frontmatter for the full list.) Highlights:

- **D-09 + ARCHITECTURE Pattern 2 honored** — every widget is `(data, ...rest, opts?) => HTMLElement` with no module-level state. The caller (Plan 07's dashboard cell, theory pages' inline cells) owns the SynthHandle. Three-layer discipline verified by grep across all six .ts files.
- **D-22 filename excludes 1/1** — `n = scale.intervals.length - 1` so a 7-tone scale reads as `scale-7-tone-...` not `scale-8-tone-...`. The `.scl` extension is shown as a separate static span adjacent to the editable input so the user doesn't double-type.
- **Pitfall #9 drone-toggle pattern** — `audioPanel`'s drone toggle holds the stop callback returned by `synth.startDrone(baseHz)` in a closed-over `let stopDrone: (() => void) | null`. On second click, calls it and nulls out. Idempotent across rapid clicks (calling a nulled `stopDrone` is impossible).
- **Wave-3 INVENTORY consolidation** — Plans 03/04/05 ran in parallel in Wave 2 without modifying INVENTORY.md to avoid merge conflicts; their queued rows are appended HERE in Plan 06 (Wave 3) since this plan already owns INVENTORY in `files_modified`. Four sections appended in order — total 12 new symbol rows (2 Scale + 4 Scala I/O + 2 Audio + 6 Components).
- **CSS imports kept per plan instruction** — the plan's `<action>` includes `import "./play-buttons.css"` (etc.) inside each .ts module. Framework's esbuild transform passes the import declaration through unchanged, which means at runtime the browser would attempt to fetch `play-buttons.css` and parse it as a JS module — which fails on Content-Type mismatch. The plan explicitly acknowledges this as a smoke-test concern for Plan 07 ("Verify by running npm run dev after this plan completes"). I kept the CSS imports as written; if Plan 07's smoke test surfaces a runtime error, the fix is to migrate to `<link>` injection via Framework's per-page `style:` frontmatter or via `head:` in `observablehq.config.ts`. See **Deferred Issues** below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type narrowing] `String(reader.result ?? "")` triggered ESLint `no-base-to-string`**

- **Found during:** Task 2 (npm run lint after first source pass)
- **Issue:** `FileReader.result` has type `string | ArrayBuffer | null`. `String(reader.result ?? "")` would route an `ArrayBuffer` value through `Object.toString()` and return `"[object ArrayBuffer]"`. The `@typescript-eslint/no-base-to-string` rule flagged this. In practice we use `readAsText()` so `result` is always a string, but the lint rule is correct that the type allows the bad case.
- **Fix:** Replace `String(reader.result ?? "")` with `typeof result === "string" ? result : ""` — proper narrowing, no string-coercion of ArrayBuffer. Functional behavior is identical for the `readAsText` path; the bad case becomes an empty string instead of a literal `"[object ArrayBuffer]"`.
- **Files modified:** `src/components/scl-io.ts`
- **Verification:** `npm run lint` exits 0; `npm test -- --run` 131 passing; `npm run build` succeeds.
- **Committed in:** `3973482` (Task 2 commit; the fix was in the same commit as the file's creation)

**2. [Rule 2 - Defense-in-depth] Defensive `defaultDegree` clamp in audio-panel**

- **Found during:** Task 2 (writing the interval-selector default)
- **Issue:** The plan's reference implementation set `select.value = String(Math.min(defaultIdx, scale.intervals.length - 1))` but did not clamp the lower bound. A caller passing `opts.defaultDegree = -1` would set the select to `"-1"` and the click handler's `scale.intervals[-1]` would be `undefined` (and the `if (!iv) return` would silently no-op the play button — a confusing UX). Not a security concern but a "defense against caller mistakes" concern.
- **Fix:** Clamped both ends: `Math.min(Math.max(0, intendedIdx), lastIdx)`. Bad inputs now produce a working button at degree 0 (1/1) instead of a silent dead button.
- **Files modified:** `src/components/audio-panel.ts`
- **Verification:** Build + lint pass; caller-side test would be in Plan 07's smoke tests (no isolated component-level Vitest per the plan's "DOM factories tested via integration" rule).
- **Committed in:** `3973482`

**3. [Rule 2 - Critical functionality] Reset `fileInput.value` after each load + add `reader.onerror` handler**

- **Found during:** Task 2 (writing the import flow)
- **Issue:** The plan's reference implementation didn't reset `fileInput.value` after a load completes — browsers de-duplicate identical filename selections, so picking the same file twice in a row would fire `change` only on the first pick. Also, the plan's reference didn't include `reader.onerror`, so an OS-level read error would silently leave the dashboard with no feedback at all.
- **Fix:** Added `fileInput.value = ""` in a `finally` block on the success path AND on the error path. Added `reader.onerror` that writes `"Couldn't read {filename}. The dashboard scale is unchanged."` to the status region (T-02-14: textContent, no innerHTML).
- **Files modified:** `src/components/scl-io.ts`
- **Verification:** Lint + types pass; verifiable in Plan 07 smoke test by picking the same .scl file twice.
- **Committed in:** `3973482`

---

**Total deviations:** 3 — 1 lint type-narrowing fix, 2 Rule 2 defense-in-depth additions (defaultDegree clamp + file-input reset/onerror handler). All preserve plan intent.

## Issues Encountered

- **CSS import semantics in Framework** — kept per plan instruction; flagged in Deferred Issues. The plan acknowledges this as a Plan 07 smoke-test concern.
- **Pre-existing prettier nits on `src/lib/scale.ts` + `src/lib/__tests__/scale.test.ts`** (Plan 03 outputs) — out of scope per the executor's scope-boundary rule. Documented in Plan 04 + Plan 05 SUMMARYs as the same deferred item.

## Threat Flags

(None new — every threat in the plan's `<threat_model>` was either mitigated in code (T-02-22, T-02-23, T-02-24 inherited from Plan 04 caps) or accepted with rationale documented (T-02-25 clipboard payload is user-visible scale data; T-02-26 browser sandboxes `<a download>`).)

## Deferred Issues

**1. CSS imports inside .ts modules — runtime semantics in Observable Framework**

The plan instructs:
```ts
import "./play-buttons.css";
```
inside each component .ts file, asserting Framework's esbuild bundles CSS. I verified by reading Framework's `dist/javascript/module.js` that Framework uses `esbuild.transform` (not `esbuild.build`), which is a syntactic transform — it does NOT bundle. The CSS-import declaration is passed through unchanged into the emitted .js, so at runtime the browser will fetch `./play-buttons.css` and try to parse the response as a JS ES module, which fails (CSS files are served with `Content-Type: text/css`, and the browser's strict ESM module check rejects non-JS MIME types).

**However**, the plan explicitly says "Verify by running `npm run dev` after this plan completes (smoke check — actual integration is Plan 07's concern)." Since the components are not yet imported by any rendered page (Plan 07's dashboard / theory page is what will reference them), `npm run build` succeeds without exercising the broken import path.

**Recommendation for Plan 07:** Migrate CSS attachment from per-module `import "./foo.css"` to one of:
- (a) Per-page frontmatter: `style: ./components/play-buttons.css` in the markdown's YAML
- (b) `head: '<link rel="stylesheet" href="...">'` in `observablehq.config.ts`
- (c) A single project-wide CSS bundle (e.g., `src/style.css`) imported via the page frontmatter — saves N round-trip requests

If migration is needed, the .ts files just need the `import "./*.css";` lines deleted — no other changes.

**2. Pre-existing prettier warnings on Plan 03 files** (`src/lib/scale.ts`, `src/lib/__tests__/scale.test.ts`)

Reported also by Plan 04 + Plan 05. Out of scope here per the scope-boundary rule. Fix is `npx prettier --write src/lib/scale.ts src/lib/__tests__/scale.test.ts`.

## Next Phase Readiness

**Ready for Plan 02-07 (composition dashboard at `src/index.md` + theory page at `src/pages/syntonic-comma.md`):**

The dashboard cell composition (per UI-SPEC dashboard layout) is now possible:
```ts
import {createSynth} from "./audio/synth.js";
import {scaleTable} from "./components/scale-table.js";
import {audioPanel} from "./components/audio-panel.js";
import {sclIo} from "./components/scl-io.js";
import {parseScala} from "./lib/scala.js";
import {Scale} from "./lib/scale.js";

const synth = createSynth();
invalidation.then(() => synth.dispose()); // ARCHITECTURE Pattern 4

// reactive cell: scale = new Scale(parseScala(textareaValue))
// reactive cell: display.appendChild(scaleTable(scale, baseHz, {copyButton: true}))
// reactive cell: display.appendChild(audioPanel(scale, synth, baseHz))
// reactive cell: display.appendChild(sclIo(scale, {onImport: (s) => setScale(s)}))
```

The theory page composition:
```ts
import {ratioPill, playInterval} from "./components/ratio-pill.js";  // and play-interval.js
import {commaByName} from "./lib/commas.js";
const syntonic = commaByName("syntonic comma")!;
// inline in prose: ${ratioPill(syntonic)}  ${playInterval(syntonic, synth)}
```

**Plan 07 must:**
1. Compose the widgets per the UI-SPEC dashboard layout
2. Decide CSS attachment strategy (see Deferred Issue #1) — likely add `style:` frontmatter or migrate to per-page `<link>`
3. Wire `sclIo`'s `onImport` callback into the dashboard's reactive scale state
4. Add a textarea + `parseScala` reactive cell for typed scale input
5. Smoke test: `npm run dev`, audition the seed scale, copy table, import a fixture .scl, export, click drone

**No blockers.**

---
*Phase: 02-math-kernel-composition-anchor-mvp*
*Completed: 2026-05-04*

## Self-Check: PASSED

Verified on disk:
- `src/components/play-interval.ts`: FOUND
- `src/components/play-scale.ts`: FOUND
- `src/components/scale-table.ts`: FOUND
- `src/components/ratio-pill.ts`: FOUND
- `src/components/audio-panel.ts`: FOUND
- `src/components/scl-io.ts`: FOUND
- `src/components/play-buttons.css`: FOUND
- `src/components/scale-table.css`: FOUND
- `src/components/ratio-pill.css`: FOUND
- `src/components/audio-panel.css`: FOUND
- `src/components/scl-io.css`: FOUND
- `src/lib/INVENTORY.md`: FOUND (modified)
- `.planning/phases/02-math-kernel-composition-anchor-mvp/02-06-SUMMARY.md`: FOUND

Verified in git log:
- Commit `0adcb8b` (Task 1 — theory-page widgets): FOUND
- Commit `3973482` (Task 2 — dashboard widgets + INVENTORY): FOUND

Verified by automated tests:
- `npm run lint:types`: exit 0
- `npm run lint`: exit 0
- `npm test -- --run`: 131/131 passed (no regression to Plans 02–05)
- `npm run build`: succeeds (3 pages built; 0 errors)
- Three-layer discipline grep on `src/components/*.ts`: no `from 'sw-synth'` matches; only `../lib/` and `../audio/` imports
- Defense-in-depth grep: 6 `textContent` references in scale-table.ts; 0 dynamic `innerHTML` calls (only static `<th>` headers use innerHTML)
- INVENTORY.md has all four new sections + all six widget names
