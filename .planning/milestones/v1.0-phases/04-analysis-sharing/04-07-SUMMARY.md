---
phase: 04-analysis-sharing
plan: 07
subsystem: ui
tags: [analysis-page, url-hash, share-path, integration, anal-01, anal-02, anal-03, anal-04, inventory, checkpoint-uat]

# Dependency graph
requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: "Interval (BigInt), Scale, parseScala, createSynth + dashboard cell pattern (Pattern 4 / Pitfall #2 / Pitfall #11)"
  - phase: 03-visualization-mobile-audio-audit
    provides: "Per-page `style:` frontmatter pattern (D-25 inheritance), CR-02 panic-clear discipline (D-15/D-16/D-34), mobile-safe sizing"
  - plan: 04-01
    provides: "edo.ts kernel — bestEdosForScale, bestJiInEdo, oddLimitApproximation"
  - plan: 04-02
    provides: "mos.ts kernel — buildMos, nearestMosSize"
  - plan: 04-03
    provides: "url.ts kernel — encodeScaleToHash, decodeHashToScale, URL_HASH_VERSION, MAX_SCALE_TEXT_BYTES"
  - plan: 04-04
    provides: "edoJitTable, edoJiTable components"
  - plan: 04-05
    provides: "mosBuilder component"
  - plan: 04-06
    provides: "scaleCompare component + disposeScaleCompare cleanup hook (CR-02 hand-off)"
provides:
  - "src/pages/analysis.md — public analysis page hosting all four Phase 4 widgets + own synth cell + URL hash read/write"
  - "src/index.md augmentations — debounced 300ms hash-write (replaceState), 'Analyze this scale →' button, hash-read with silent override (D-19), malformed-hash status surface (D-20)"
  - "Phase 4 INVENTORY consolidation — all 15 new symbols documented with Source + Notes back-references"
  - "URL share path verified end-to-end (BigInt round-trip via parseScala equality)"
affects: [phase-04-close, future-pages-with-share-paths, observable-framework-pages-pattern]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-page sibling synth cell (D-34) — analysis page's synth is independent of dashboard's synth (separate page = separate AudioContext)"
    - "Hash-read at boot pattern: `window.location.hash.startsWith('#s=')` → `decodeHashToScale(hash.slice(3))` → silent override OR fallback + status message (D-19/D-20)"
    - "Hash-write debounced 300ms with `history.replaceState(null, '', hash)` — NEVER pushState (D-17 invariant)"
    - "Encoder RangeError (>8 KB plaintext) caught at the cell level: `console.warn` + URL stops auto-updating (graceful degradation; T-04-36)"
    - "Analyze-button navigation: `window.location.assign('./pages/analysis' + hash)` — relative-from-dashboard path resolves to /pages/analysis at the Framework site root"
    - "CR-02 cleanup hand-off: page captures the scaleCompare element and calls `disposeScaleCompare(el)` in `invalidation.then(...)` to drop pending B-note setTimeouts on cell teardown"

key-files:
  created:
    - "src/pages/analysis.md (205 lines, 19 cells incl. frontmatter, imports, synth, seed, hash-read, hash-error display, textarea, helper, parse, parse-error, baseHz, hash-write, edoJitTable section, edoJiTable section + edoSteps input, mosBuilder section, scaleCompare section + dispose hook, Stop button, footer)"
    - "src/__tests__/url-hash-integration.test.ts (51 lines, 4 tests — round-trip equality via parseScala BigInt comparison + malformed-hash null + oversized-hash null + URL-safe alphabet check)"
  modified:
    - "src/index.md (+80 lines, additive — preserves all Phase 2/3 cells; adds: url import, hash-read cell with `dashboardHashError`, seedTextLiteral rename + new `seedText = hashDecoded ?? seedTextLiteral`, hash-error status div, debounced hash-write cell, 'Analyze this scale →' button cell)"
    - "src/styles.css (+4 lines — `@import` for edo-jit-table.css, edo-ji-table.css, mos-builder.css, scale-compare.css; placed before :root per CSS spec)"
    - "src/lib/INVENTORY.md (+37 lines, appended — `## Phase 4 entries` section with 4 sub-tables: edo kernel, mos kernel, url kernel, components — 15 rows total incl. disposeScaleCompare)"

key-decisions:
  - "Analysis page seed scale = same 7-limit JI heptatonic as dashboard (per CONTEXT line 204) — gives both pages a known-good default and lets users compare-by-default"
  - "Synth cell on analysis page is verbatim mirror of dashboard's synth cell (D-34) — Esc + activeVoices polling + dispose all bound there (Pitfall #11). The two synth cells own SEPARATE AudioContexts; cross-page navigation does not leak (Pattern 4 inheritance from Phase 2 verified again at Checkpoint 1)."
  - "Hash-error string is the SINGLE hardcoded constant: `\"Couldn't load shared scale: malformed or oversized hash. Falling back to default.\"` — no dynamic interpolation (T-04-33). Used identically on both pages. Regression tests can assert against this exact string."
  - "Encoder failures (>8 KB) are silent on the dashboard (URL just stops auto-updating). Per D-15 / Plan spec — surfacing 'your scale is too big to share' would clutter normal use; the hash will resume updating when the textarea shrinks below 8 KB."
  - "parseError display on the analysis page uses createElement+textContent (not htl `html\\\`...\\${parseError}\\\``) for defense-in-depth XSS (T-04-34). The dashboard's existing htl path is intentionally NOT modified — htl auto-escapes per spec, and any retroactive Phase 2 fix is out-of-scope here (T-04-39 accepted)."
  - "Page navigation path: `./pages/analysis` from `src/index.md` resolves to `/pages/analysis` at the Framework site root (per Framework's auto-discovery — `src/pages/*.md` produces `/pages/*` URLs). Verified at Checkpoint 2."

patterns-established:
  - "Two-page synth cell mirror discipline (D-34) — when a feature page needs its own audio, copy the dashboard's synth cell verbatim into the new page; do NOT factor into a shared module (page-cell semantics differ from module-export semantics)"
  - "Hash-read + hash-write cell pair (D-17/D-19/D-20/D-26) — boilerplate that any future shareable page should adopt verbatim; status region uses textContent and a hardcoded string"
  - "INVENTORY append-only consolidation — final wave-3 plan of each phase consolidates ALL new symbols into a single `## Phase N entries` section; intermediate plans defer their rows to avoid wave-2 merge conflicts (carried over from Phase 2 / Phase 3)"

requirements-completed: [ANAL-01, ANAL-02, ANAL-03, ANAL-04]

# Metrics
duration: ~57min (incl. 2 human-verify UAT checkpoints)
completed: 2026-05-06
---

# Phase 04 Plan 07: Analysis Page + Dashboard Wiring Summary

**Wired the four Phase 4 widgets into a new public `/analysis` page, augmented the dashboard with debounced URL-hash auto-update + 'Analyze this scale →' navigation, consolidated INVENTORY with all 15 new Phase 4 symbols, and verified the share path end-to-end via 2 human UAT checkpoints (analysis page + URL share-path) — both approved.**

## What was built

### `src/pages/analysis.md` (new — 205 lines, 19 cells)

| # | Cell | Purpose |
|---|------|---------|
| 1 | Frontmatter `style: ../styles.css` | Per-page stylesheet override (D-25 inheritance from Phase 3) |
| 2 | H1 + lead paragraph | "Analysis" header + one-line description |
| 3 | Imports | Interval, Scale, parseScala, createSynth, encodeScaleToHash + decodeHashToScale, edoJitTable, edoJiTable, mosBuilder, scaleCompare + disposeScaleCompare |
| 4 | Synth cell | Verbatim mirror of dashboard's synth cell (D-34) — owns AudioContext, binds Esc + activeVoices polling here (Pitfall #11), invalidation.then dispose |
| 5 | seedText constant | 7-limit JI heptatonic (same as dashboard) — flush-left template literal so leading whitespace isn't preserved in parsed text |
| 6 | Hash-read cell | Reads `window.location.hash`, strips `#s=`, calls `decodeHashToScale`. On null → fallback to seedText + status message; on success → silent override (D-19) |
| 7 | Hash-error status div | Renders ONLY when `hashError` truthy. Uses `role="status"` + `aria-live="polite"` + `textContent` (NEVER innerHTML — T-04-33) |
| 8 | Textarea | `Inputs.textarea` seeded with `initialScaleText`; submit:false so each keystroke flows to the hash-write debounce |
| 9 | Helper paragraph | "Last line is the period. 1/1 is added automatically." |
| 10 | Parse cell | `try/catch` → `scale = new Scale(parseScala(scaleText))` |
| 11 | Parse-error display | createElement + textContent (T-04-34 defense-in-depth) |
| 12 | baseHz input | `Inputs.number({ value: 440 })` |
| 13 | Hash-write cell | Debounced 300ms (D-17/D-26). `history.replaceState(null, "", "#s=" + encodeScaleToHash(scaleText))`. RangeError → console.warn + skip (T-04-36) |
| 14 | edoJitTable section | `## Best-fit EDOs (scale → EDO)` + `display(edoJitTable(scale, synth, { baseHz }))` |
| 15 | edoJiTable section | `## JI in N-EDO` + `Inputs.number` for edoSteps + `display(edoJiTable(edoSteps, synth, { baseHz }))` |
| 16 | mosBuilder section | `## MOS construction` + `display(mosBuilder(synth, { baseHz }))` |
| 17 | scaleCompare section | `## Compare scales` + element captured into `cmpEl` + `invalidation.then(() => disposeScaleCompare(cmpEl))` (CR-02 hand-off) |
| 18 | Stop button | `<button class="stop-all-audio">` wired to `synth.panic()`; visibility toggles on `audioActive` Mutable |
| 19 | Footer | "Read: [the dashboard ←](../) | [the syntonic comma →](syntonic-comma)" |

### `src/index.md` augmentations (+80 lines, additive — Phase 2/3 cells preserved)

- Added `import { encodeScaleToHash, decodeHashToScale } from "./lib/url.js";`
- New hash-read cell (sets `dashboardHashError` for the status surface)
- Renamed `seedText` constant to `seedTextLiteral`; introduced new `const seedText = hashDecoded ?? seedTextLiteral;` cell (downstream textarea unchanged)
- Hash-error status div (textContent only, hardcoded message)
- Debounced 300ms hash-write cell (replaceState; RangeError silent)
- "Analyze this scale →" button cell next to sclIo: `window.location.assign("./pages/analysis" + hash)` with hash-encode RangeError fallback

### `src/styles.css` (+4 lines)

```css
@import "./components/edo-jit-table.css";
@import "./components/edo-ji-table.css";
@import "./components/mos-builder.css";
@import "./components/scale-compare.css";
```

Placed before the `:root` token block (CSS spec requires `@import` to precede non-import statements). Verified: last `@import` at line 38, first `:root` at line ≥ 40.

### `src/lib/INVENTORY.md` (+37 lines, appended)

`## Phase 4 entries` section with four sub-tables and 15 rows total:

| Sub-section | Rows |
|---|---|
| EDO ↔ JI mapping kernel (Plan 04-01) | bestEdosForScale, bestJiInEdo, oddLimitApproximation |
| MOS construction kernel (Plan 04-02) | buildMos, nearestMosSize |
| URL hash encode/decode (Plan 04-03) | encodeScaleToHash, decodeHashToScale, URL_HASH_VERSION, MAX_SCALE_TEXT_BYTES |
| Analysis components (Plans 04-04/05/06) | edoJitTable, edoJiTable, mosBuilder, scaleCompare, BUILTIN_B_SCALES, disposeScaleCompare |

Total Phase 4 INVENTORY consolidation: **15 rows** (acceptance criterion required ≥14 — met with 1 row of headroom).

### `src/__tests__/url-hash-integration.test.ts` (new — 51 lines, 4 tests)

1. Seed scale (7-limit JI heptatonic) round-trips exactly — `parseScala(decodeHashToScale(encodeScaleToHash(seedText)))` BigInt-equals `parseScala(seedText)` interval-by-interval (Phase 1 D-16 `noUncheckedIndexedAccess` guard pattern carried)
2. Malformed hash returns null
3. Oversized hash (>16 KB) returns null
4. Encoded hash uses URL-safe alphabet only (`/^[A-Za-z0-9_-]+$/`)

All 4 pass; integrated into the full vitest run.

## Hash-error string (regression-test reference)

The exact string used in the status region on BOTH pages, hardcoded with no interpolation:

```
Couldn't load shared scale: malformed or oversized hash. Falling back to default.
```

Future regression tests can assert against this exact string. Defined inline in both `src/index.md` (variable: `dashboardHashError`) and `src/pages/analysis.md` (variable: `hashError`).

## Framework URL path resolution (deviation from expected)

The plan's `<interfaces>` section noted "Verify the path during implementation by serving the dev server" for the Analyze-button URL. Verification result:

- From `src/index.md`, Framework's auto-discovery resolves `./pages/analysis` to `/pages/analysis` at the site root.
- `window.location.assign("./pages/analysis" + hash)` works correctly — Framework normalizes the relative path and the hash flows through.
- No path adjustment needed at Checkpoint 2.

## Checkpoint outcomes

### Checkpoint 1 — `/analysis` page UAT (10/10 steps)

User ran all 10 verification steps against `npm run dev` and approved. Verified:

- All four widgets render (edoJitTable, edoJiTable, mosBuilder, scaleCompare)
- Synth lifecycle clean (1 AudioContext throughout repeated edits)
- Esc + Stop button + activeVoices polling all functional
- Hash silent-override on success, status message on malformed (with hash retained per D-20)
- Mobile responsive at iPhone preset (single-column, 16px input font, no horizontal scroll)

**Status:** APPROVED — no gaps filed.

### Checkpoint 2 — URL share-path UAT (10/10 steps)

User ran all 10 share-path verification steps and approved. Verified:

- Dashboard textarea edits debounce-update `#s=...` after 300ms via `replaceState`
- "Analyze this scale →" button navigates to `/pages/analysis` with current scale encoded
- Round-trip across fresh tab is lossless (BigInt equality)
- Back-button history is clean (replaceState, NOT pushState — confirmed by stepping back past the analysis page rather than through edit-history)
- Malformed hash truncation triggers status message AND retains hash for debug-copy (D-20)
- Oversized scale (>8 KB) gracefully stops auto-updating without crashing the cell

**Status:** APPROVED — no gaps filed.

## ROADMAP success criteria — all four delivered

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | User can pick a JI scale and see ranked best-fit EDOs (and pick an EDO and see best JI approximations) | `edoJitTable` + `edoJiTable` widgets render on `/analysis`; Checkpoint 1 step 3 confirmed both directions functional with click-to-arpeggiate (ANAL-01) |
| 2 | User can construct an MOS scale via generator + period; result uses the same `Scale` API | `mosBuilder` widget on `/analysis` reuses `scaleTable` + `playScale` for output (D-14 fungibility); Checkpoint 1 step 3 confirmed Pythagorean diatonic at size 7 + chromatic at size 12 (ANAL-02) |
| 3 | User can place two scales side-by-side; degree-by-degree cents, common subset, max deviation visible | `scaleCompare` widget on `/analysis` with three B-source modes (preset / paste / .scl); Checkpoint 1 step 3 confirmed alignment table + Δ¢ column + per-row A→B audition (ANAL-03) |
| 4 | User can share a URL whose hash encodes a scale; recipient lands on a page seeded with that exact scale | Round-trip integration test (`url-hash-integration.test.ts`) + Checkpoint 2 step 5 (fresh-tab paste) confirmed BigInt-equality across the share path; D-19 silent override + D-20 malformed-hash status surface both verified (ANAL-04) |

## Threat model invariants verified

| Threat ID | Invariant | Verification |
|-----------|-----------|--------------|
| T-04-33 | Hash-error string uses textContent + hardcoded constant (no `${err}` interpolation) | grep gate: zero `${...}` interpolation in error-string assignment; visual confirmation in source |
| T-04-34 | parseError on analysis page uses createElement + textContent | Source inspection — Task 1 step 11 implementation verbatim |
| T-04-35 | decodeHashToScale rejects > 16 KB pre-atob | Plan 04-03 unit test + url-hash-integration.test.ts test 3 ("oversized hash returns null") |
| T-04-36 | encodeScaleToHash RangeError caught at cell level → URL desync graceful | Source: try/catch around `encodeScaleToHash(scaleText)` in both pages' hash-write cells; console.warn fallback |
| T-04-40 | 300ms debounce limits encoder calls to ~3/sec | Source: `setTimeout(flush, 300)` in both pages' hash-write cells |
| T-04-41 | NO `pushState` calls in Phase 4 page cells | grep gate: `grep -nE "history\.pushState\|window\.history\.pushState" src/index.md src/pages/analysis.md` returns no matches (only doc comments mentioning "NOT pushState") |

## Final automated gates (post-task verification)

| Gate | Result |
|---|---|
| `npx vitest run` | 21 test files / **266 tests** passed (incl. 4 new url-hash-integration tests) |
| `npx tsc --noEmit` | Clean — zero errors |
| `npx eslint src/` | Clean (only `.eslintignore` migration warning, pre-existing) |
| `grep -c pushState (real calls)` | 0 |
| `grep -c replaceState` | 2 (one per page) |
| `grep -c disposeScaleCompare src/pages/analysis.md` | 2 (import + invalidation cleanup) |
| Phase 4 INVENTORY rows | 15 (criterion ≥14) |

## Deviations from plan

**None.** All 19 cells of `src/pages/analysis.md`, all 6 dashboard augmentations, and all 4 styles.css imports landed verbatim per the plan spec. The Framework URL-path verification at Checkpoint 2 confirmed `./pages/analysis` resolves correctly without adjustment.

The plan executed as written. No Rule 1/2/3 deviations triggered during Tasks 1 or 2.

## Self-Check: PASSED

Files verified to exist:
- src/pages/analysis.md (FOUND)
- src/__tests__/url-hash-integration.test.ts (FOUND)
- src/index.md (FOUND, modified)
- src/styles.css (FOUND, modified)
- src/lib/INVENTORY.md (FOUND, modified)

Commits verified on main:
- 060c301 (FOUND — Task 1: feat(04-07): add /analysis page with hash IO + four widgets)
- 0a8008b (FOUND — Task 2: feat(04-07): augment dashboard with hash IO + Analyze button + Phase 4 INVENTORY)

Both UAT checkpoints (1 and 2) approved by user with all 10/10 steps each.
