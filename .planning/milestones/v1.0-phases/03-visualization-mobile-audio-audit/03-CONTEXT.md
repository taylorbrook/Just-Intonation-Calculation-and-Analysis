# Phase 3: Visualization + Mobile Audio Audit - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Add the visual surface that pairs with the existing tabular/audio output: a D3-backed lattice with configurable prime basis (VIZ-01), a configurable-odd-limit tonality diamond (VIZ-02), and a scale-on-keyboard SVG (VIZ-03). Pair `.scl` with `.kbm` keyboard-mapping I/O (IO-03). Verify mobile Safari audio in Safari's Responsive Design Mode and apply the long-deferred mobile-audio + responsive-UX fixes (AUDIO-06).

**In scope (Phase 3 deliverables):**
- `src/components/lattice.ts` — D3 lattice using `ji-lattice` for coordinates. Accepts `scale`, `synth`, `opts` (basis, showContext, audition).
- `src/components/tonality-diamond.ts` — odd-limit diamond. Accepts `scale`, `synth`, `opts` (oddLimit, showContext, audition).
- `src/components/keyboard.ts` — linear-by-degree scale-on-keyboard SVG strip. Accepts `scale`, `synth`, `baseHz`, `opts`.
- `src/lib/kbm.ts` — `KbmMapping` type + `parseKbm` / `writeKbm` + `kbmToFrequencies(scale, kbm)`. NEW module; sibling of `scala.ts`.
- `src/components/scl-io.ts` — extended in place to handle `.kbm` import/export inline (combined widget; one status region; export emits two buttons).
- `src/index.md` — appends three viz widget cells below the existing scl-io strip; adds a floating "Stop all audio" cell + Esc handler; adds a reactive "Use baseHz instead" toggle that surfaces only when a `.kbm` has been imported.
- `src/audio/synth.ts` — refactor to fix mobile-Safari audio quirks: synchronous `ctx.resume()` in user-gesture handlers, `webkitAudioContext` fallback, `visibilitychange` listener (resume on tab focus), kbm-aware effective-ref-Hz path.
- `src/styles.css` (or component-colocated CSS) — responsive UX pass: single-column, full-width on narrow screens; `font-size: 16px+` on inputs to suppress Safari iOS auto-zoom; `preserveAspectRatio` on viz SVGs; floating Stop-button styling.
- `src/lib/__tests__/kbm.test.ts` — `.kbm` round-trip golden tests including the `referenceKey ≠ middleNote` case (Pitfall #7); `kbmToFrequencies` with middle ≠ reference.
- `src/components/__tests__/` — smoke tests for lattice/diamond/keyboard factories (DOM-only; no audio assertions, since synth is stubbed).
- `.planning/phases/03-.../mobile-audit.md` notes file — documents Safari RDM verification methodology + the iOS hardware-mute-switch + autoplay-policy quirks that RDM does NOT reproduce.

**Out of scope (later phases or descoped):**
- Theory pages dedicated to lattice / tonality-diamond / keyboard — descoped per D-01 (all on dashboard). If/when a phase wants prose around these viz, the widgets are already factories.
- Anchored-to-MIDI keyboard view — descoped per D-03 (linear-by-degree only).
- 3D lattice / Three.js — v2+ (TEMP-06 in REQUIREMENTS.md).
- Physical iPhone device testing — descoped per D-18 (RDM-only verification by user choice; documented limitation).
- Persistent scale state (URL hash / localStorage) — Phase 4 (ANAL-04).
- EDO ↔ JI mapping, MOS construction, scale comparison — Phase 4 (ANAL-01..03).
- `temperaments` package — still deferred (peer-dep mismatch).
- `harmonic-entropy` — still deferred (out of scope for Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Visualization Layout

- **D-01:** **All three viz widgets ship on the dashboard** (`src/index.md`), below the existing `audioPanel` + `sclIo` strip. No new theory pages in Phase 3. The widgets are factories; future pages can embed them when a use case appears.
- **D-02:** **Full-bleed vertical stack.** Each viz renders at full readable size; user scrolls top-to-bottom. No collapsible / two-column layouts. Matches existing dashboard rhythm.

### Scale-on-Keyboard (VIZ-03)

- **D-03:** **Linear-by-degree mapping.** N scale degrees → N adjacent white keys. Period boundary visually marked. NOT MIDI-anchored — `.kbm` semantics live in the kbm module + audio path, not in this widget.
- **D-04:** **Keys are play buttons.** Click key N → audition `scale.intervals[N]`. Same audition path as lattice/diamond.

### Lattice + Tonality Diamond (VIZ-01, VIZ-02)

- **D-05:** **Configurable scope** via `opts.showContext: 'none' | 'neighbors' | 'full'`. Both lattice and diamond accept this opt. **Default on dashboard = `'neighbors'`** (lattice draws scale + 1-step neighbors along each prime axis; diamond highlights in-scale cells against the full odd-limit grid). Theory pages may override.
- **D-06:** **Pan/zoom + click-to-audition.** D3 zoom (mouse wheel + drag); click any node / cell triggers playback. Pure-static SVG and pan/zoom-only modes are NOT exposed in Phase 3.
- **D-07:** **Click audition mode** = configurable via `opts.audition: 'note' | 'dyad'`. **Default on dashboard = `'dyad'`** (plays 1/1 + the interval stacked — hear the relationship the lattice/diamond shows). `'note'` available for theory pages.

### Component Contract

- **D-08:** **All three viz widgets take `synth` as a REQUIRED arg.** Same shape as `audioPanel`. Signatures:
  - `lattice(scale: Scale, synth: SynthHandle, opts?: LatticeOpts): HTMLElement`
  - `tonalityDiamond(scale: Scale, synth: SynthHandle, opts?: DiamondOpts): HTMLElement`
  - `keyboard(scale: Scale, synth: SynthHandle, baseHz: number, opts?: KeyboardOpts): HTMLElement`
  Pages without audio cannot embed these widgets without first standing up a synth cell. Consistent with Phase 2 `audioPanel`.

### .kbm I/O (IO-03)

- **D-09:** **New module `src/lib/kbm.ts`** owns `parseKbm`, `writeKbm`, `kbmToFrequencies`, and the `KbmMapping` type. `scala.ts` stays scl-only. Single-responsibility per file; testable in isolation.
- **D-10:** **`KbmMapping` keeps three named fields** per Pitfall #7: `referenceKey`, `referenceHz`, `middleNote`. Never a single `baseHz`. Plus: `formalOctave`, `firstKey`, `lastKey`, `size`, optional per-degree key map (for non-trivial mappings).
- **D-11:** **Combined `sclIo` widget** handles both formats. One import button auto-detects format by extension (`.scl` vs `.kbm`); export shows two buttons (`Download .scl`, `Download .kbm`). One shared status region (existing `role=status aria-live=polite`).
- **D-12:** **Default `.kbm` fields** when the user has only edited a Scale + baseHz (no imported `.kbm`):
  - `middleNote = 69` (A4)
  - `referenceKey = 69` (A4)
  - `referenceHz = baseHz` (440 by default)
  - `formalOctave = scale.intervals.length` (= scale length, including the implicit 1/1 + period)
  - `firstKey = 0`, `lastKey = 127`
  - 1/1 sounds at A4 = baseHz. middle == reference — eliminates Pitfall #7 confusion for the default flow; matches dashboard playback semantics exactly.
- **D-13:** **Imported `.kbm` applies to playback by default**, with a "Use baseHz instead" override toggle. The toggle surfaces in the dashboard only after a `.kbm` import; defaults to OFF (= use the imported `.kbm`). When ON, falls back to `baseHz → 1/1` direct mapping. Effective-ref-Hz threads through every audition path (audioPanel, lattice/diamond/keyboard click).

### Mobile Audit (AUDIO-06)

- **D-14:** **Full sweep** — verify + audio-layer fixes + responsive UX pass. Phase 3 is the dedicated mobile chapter; cheaper to do the full sweep here than retrofit later.
- **D-15:** **Audio-layer fixes** (per Pitfall #10):
  - Synchronous `ctx.resume()` in user-gesture click handlers — no `await` between gesture and resume.
  - `const Ctx = window.AudioContext || window.webkitAudioContext` detection.
  - `document.addEventListener('visibilitychange', ...)` listener: resume on `'visible'`. (Dispose / removeEventListener via the existing synth `dispose()` path.)
  - Page-level "Stop all audio" + Esc keyboard shortcut → `synth.panic()` (panic already exists in `SynthHandle` per Phase 2 INVENTORY.md).
- **D-16:** **"Stop all audio" UX:** floating top-right button + Esc keydown listener. **Visible only when `synth.activeVoices > 0`** (avoids always-on chrome; uses a small reactive cell or `Mutable` to track). Esc binding lives in the synth cell (stable; doesn't re-bind on scale edits) with `invalidation.then(remove)` cleanup. Touch-target ≥ 44×44 px for mobile.
- **D-17:** **Responsive layout strategy:** single-column, full-width everywhere on narrow screens. No fixed media-query breakpoint beyond inputs/buttons.
  - Comfortable 12–16 px viewport padding.
  - Lattice / diamond / keyboard SVGs use `preserveAspectRatio="xMidYMid meet"` so they scale with the viewport.
  - Inputs (textarea, baseHz number) use `font-size: 16px` minimum to suppress Safari iOS auto-zoom-on-focus.
  - No horizontal overflow at any width ≥ 320 px.
  - Viewport meta tag confirmed: `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- **D-18:** **Verification target = Safari macOS Responsive Design Mode** (Develop → Enter Responsive Design Mode → iPhone). Documented known limitation: RDM does NOT fully reproduce iOS autoplay-policy nuances or the hardware-mute-switch — both are documented in `mobile-audit.md` rather than verified by RDM. User-conscious trade-off; physical-device testing is deferred.

### Claude's Discretion

These were not explicitly discussed; sensible defaults — flag in plan-phase if any need to change.

- **D-19:** **Default lattice basis** auto-derived from the scale: union of primes appearing with nonzero exponent in any monzo, minus prime 2. If 1 prime → 1D linear lattice (degenerate but valid). If 2 → 2D. If 3 → 2D projected via `ji-lattice`'s default. If >3 → top-2-by-frequency primes; flag remaining via console. Override via `opts.basis: number[]`.
- **D-20:** **Default tonality-diamond odd-limit** auto-derived: `ceil(max(oddLimit(i) for i in scale.intervals))` rounded UP to nearest of {7, 9, 11, 13, 15, 21, 31}. e.g. 7-limit seed scale → diamond at odd-limit 7. Override via `opts.oddLimit: number`.
- **D-21:** **Lattice node visual:** filled when in-scale; outlined-only when neighbor (per `showContext`). Ratio label inside node (compact: e.g. `5/4`); cents-from-12tet label below with sign (per Pitfalls UX). Color encodes the prime axis the node sits on (placeholder palette: 3=blue, 5=green, 7=orange — refine in implementation; ensure WCAG AA contrast).
- **D-22:** **Diamond cell visual:** in-scale cells filled by prime-axis color; out-of-scale cells outlined-only. Hover tooltip shows `ratio | cents | prime-limit | in-scale?`. Tooltip via D3 `<title>` for accessibility (keyboard-discoverable).
- **D-23:** **Keyboard widget visual:** white-key strip, N keys for N degrees + a marker between degree-N and degree-N+1 if the scale wraps to its period. Cents-from-12tet labels above each key with sign (`+3.9¢`, `−13.7¢`). Active-press visual feedback (depressed key) tied to the synth note-on/note-off callbacks already exposed via `SynthHandle`.
- **D-24:** **kbm-aware playback path:** when override toggle is OFF, effective ref Hz of 1/1 = `kbm.referenceHz × 2^((midiNoteOf1Slash1 − kbm.referenceKey) / 12)` where `midiNoteOf1Slash1 = kbm.middleNote`. The mapping function `kbmToFrequencies(scale, kbm): Map<midiNote, Hz>` lives in `src/lib/kbm.ts` (pure; testable) and is called from the dashboard's reactive cell that computes the effective baseHz for the synth path. Audio panel, lattice/diamond/keyboard click handlers all read from this single derived value.
- **D-25:** **Component CSS** colocated per existing convention (`src/components/lattice.css` etc.). No new global styles in `styles.css` beyond the floating Stop button + responsive viewport rules.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level guidance
- `CLAUDE.md` — Tech stack source of truth. Especially:
  - "Recommended Stack" table — `ji-lattice@0.3.2`, `d3@7.9.0`, `sw-synth@0.4.0`, `fraction.js@5.3.4`, `xen-dev-utils@0.13.1`.
  - "Version Compatibility" table — confirms `ji-lattice@0.3.2` accepts `xen-dev-utils@0.13` (peer `^0.12.2` is satisfied by 0.13).
  - "What NOT to Use" — Three.js banned for v1 lattice; mathjs banned; tonal.js banned for JI math.
  - "Observable Framework Conventions" — `.ts` imports as `.js`, no top-level `AudioContext`.
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope list. Lattice + diamond are listed under Active requirements; visualizations are part of v1 outputs.
- `.planning/REQUIREMENTS.md` — Phase 3 requirement set: VIZ-01 (lattice), VIZ-02 (diamond), VIZ-03 (keyboard), IO-03 (.kbm), AUDIO-06 (mobile Safari). All five mapped to Phase 3.
- `.planning/ROADMAP.md` — Phase 3 success criteria (5 items) — all five must be TRUE at phase end:
  1. Render `Scale` as 2D lattice with chosen prime basis + pan/zoom.
  2. Tonality diamond at any odd-limit (7, 11, 13, 21, 31, 81) without hardcoded constants.
  3. Scale's pitches mapped to a piano-keyboard SVG with cents-offset labels.
  4. Export and re-import a `.kbm` mapping where `referenceKey ≠ middleNote` (three named fields explicit, never conflated).
  5. Open the dashboard on iPhone Safari (RDM proxy per D-18), tap a play button, hear the interval — mute switch + autoplay quirks documented.

### Phase 1 + 2 carry-forward
- `.planning/phases/01-bootstrap-build/01-CONTEXT.md` — Phase 1 D-01..D-21 still in force. Especially D-12 (ESLint type-checked), D-16 (TS strict + `noUncheckedIndexedAccess`), D-17 (pin `fraction.js@5.3.4` exact).
- `.planning/phases/02-math-kernel-composition-anchor-mvp/02-CONTEXT.md` — Phase 2 decisions still in force. Especially:
  - D-06 (cents at 0.1¢ display precision) — viz widgets inherit this default.
  - D-07 (audio panel separate from data widgets) — viz widgets follow the audio-aware-via-explicit-arg pattern.
  - D-08 (baseHz default 440) — Phase 3 keeps; kbm derives effective ref Hz from this.
  - D-09 (component factory contract `(data, ..., opts?) => HTMLElement`).
  - D-12, D-13, D-14 (Scala-body parser conventions; auto-prepend `1/1`; last interval is the period). Period-aware reduction stays.
  - D-24 (immutability: `Scale`, `Interval` return new instances).
- `src/lib/INVENTORY.md` — wrap-don't-reimplement discipline (Pitfall #5). Append rows for: `parseKbm` / `writeKbm` / `kbmToFrequencies` (custom; thin Scala-format-spec implementation), `KbmMapping` type, lattice / tonality-diamond / keyboard components.
- `eslint.config.js` — R-01 `no-restricted-imports` already forbids importing `Fraction` from `xen-dev-utils`. Phase 3 must not regress this; `kbm.ts` imports `Fraction` from `fraction.js` directly when modeling per-MIDI-note Hz arithmetic.

### Architecture & research (Phase 1 outputs — load when planning)
- `.planning/research/ARCHITECTURE.md` — Three-layer architecture; Pattern 2 (Components as factories); Pattern 4 (synth lifecycle, `invalidation.then(dispose)`); Pattern 1 (Interval as currency). Phase 3 build-order section §"Phase 3 — Visualization" lists the three components by name.
- `.planning/research/PITFALLS.md` — load before any implementation:
  - Pitfall #4 (visualization eats the project — time-box; avoid endless D3 polish).
  - Pitfall #5 (reinventing xen-dev-utils — `oddLimit`, `primeLimit`, monzo arithmetic already in `src/lib/monzo.ts`).
  - Pitfall #7 (`.kbm` reference-frequency confusion — three named fields, NEVER `baseHz` alone, test middle ≠ reference).
  - Pitfall #9 (polyphony explosion — Stop-all + Esc match the documented UX recovery).
  - Pitfall #10 (mobile Safari quirks — synchronous `ctx.resume()`, `webkitAudioContext` fallback, `visibilitychange`, hardware mute switch).
  - Pitfall #11 (reactive cell ordering — Esc listener cell must NOT depend on `scale`; bind in synth cell).
  - Pitfall #16 (sub-cent precision — keyboard cents-from-12tet labels stay at 0.1¢).
  - UX Pitfalls table — signed cents-deviation labels; lattice legend; Stop-all + Esc as UX requirements.
- `.planning/research/STACK.md` — `ji-lattice` produces coordinates only (it's a layout library, not a renderer); D3 wraps for SVG + zoom. Diamond is small enough to hand-lay (no clean library equivalent).
- `.planning/research/FEATURES.md` — feature → package mapping for viz layer.
- `.planning/research/SUMMARY.md` — overview.

### External (read on demand during planning)
- `ji-lattice` on npm: https://www.npmjs.com/package/ji-lattice — coordinate output API + 2D projection options; peer-dep `xen-dev-utils@^0.12.2` (compatible with project's 0.13 line).
- D3 v7 docs: https://d3js.org — `d3-zoom` for pan/zoom, SVG primitives, `d3-selection`. ESM entry: `import * as d3 from "d3"`.
- Scala `.kbm` reference (Huygens-Fokker `.scl` format page): https://www.huygens-fokker.org/scala/scl_format.html — KBM section at the bottom; describes the field layout and named-field semantics.
- Cycling '74 RNBO Scala/KBM reference: https://rnbo.cycling74.com/learn/scala-and-custom-tuning-reference — clear KBM semantics including middle-note ≠ reference-key examples.
- Sevish KBM walkthrough: https://sevish.com/2017/mapping-microtonal-scales-keyboard-scala/ — practical examples of `.kbm` middle / reference subtleties; useful for golden-test corpus.
- Web Audio AudioContext (MDN): https://developer.mozilla.org/en-US/docs/Web/API/AudioContext — autoplay policy, `suspended` state, `resume()` user-gesture requirement, `webkitAudioContext`.
- Safari `visibilitychange` + AudioContext: https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event — resume-on-foreground pattern.
- Observable Framework docs:
  - JavaScript: https://observablehq.com/framework/javascript — `.js` import extension for `.ts` source, transpilation but no type-check.
  - Reactivity: https://observablehq.com/framework/reactivity — `invalidation` promise (used to dispose Esc listener), `Mutable` (used for `activeVoices > 0` reactive flag).
- Observable Plot (already shipped with Framework): https://observablehq.com/plot — fallback for keyboard render if SVG-by-hand becomes burdensome (planner decides).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1 + 2)
- `src/index.md` — current dashboard composition. Phase 3 ADDS:
  - 3 new cells for lattice / diamond / keyboard widgets (each `display(widget(scale, synth, ...))`).
  - 1 cell for the floating "Stop all audio" button + Esc keydown listener (in the synth cell, NOT the scale cell — Pitfall #11).
  - 1 cell for the kbm import → "Use baseHz instead" toggle + effective-ref-Hz derivation. Surfaces only when a `.kbm` has been imported.
- `src/components/audio-panel.ts` — pattern for synth-driven interactive widgets. Lattice/diamond/keyboard reuse the same shape: `(scale, synth, ...rest, opts?) => HTMLElement`. Click handlers call `SynthHandle.playNote` / `playNotes` / `playArpeggio` exactly as `audioPanel` does.
- `src/components/scale-table.ts` — pattern for scale-driven pure-data widgets (cents-precision opts, copy-button, accessible cell rendering via `createElement` + `textContent`). The `keyboard` widget mirrors this for cents-from-12tet display per key.
- `src/components/scl-io.ts` — extended (NOT replaced) to handle `.kbm` import/export inline. Existing patterns reused: hidden file picker → `FileReader` → parser → `opts.onImport(...)`; `Blob` + `URL.createObjectURL` + anchor download for export; `role=status aria-live=polite` for parser-error announcements; `textContent` (NOT `innerHTML`) for description rendering.
- `src/audio/synth.ts` — `createSynth()` factory + `SynthHandle` interface. Already exposes: `playNote`, `playNotes`, `playArpeggio`, `startDrone`, `panic`, `activeVoices` (read-only getter), `dispose`. Phase 3 modifies this file in place (NOT a new file): synchronous `ctx.resume()` refactor inside the user-gesture path; `webkitAudioContext` fallback at AudioContext construction; `visibilitychange` listener bound in `ensure()` and removed in `dispose()`. The kbm-aware effective-ref-Hz machinery lives in the page cell, NOT in synth.ts (synth stays unaware of kbm; it just receives Hz numbers).
- `src/lib/scale.ts` — `Scale` exposes `intervals: readonly Interval[]` + `period: Interval`. Lattice/diamond/keyboard consume both. Period-aware reduction (Phase 2 D-14 / Pitfall #13) preserved.
- `src/lib/interval.ts` — `Interval` Fraction-backed; lazy monzo + cents. Lattice nodes consume `.fraction` (ratio display) + `.monzo` (layout via ji-lattice). Diamond cells the same.
- `src/lib/monzo.ts` — `oddLimit`, `primeLimit`, `PRIMES`, `toMonzo` already re-exported. Diamond derives default odd-limit; lattice derives default basis.
- `src/lib/scala.ts` — `parseScala`, `parseScl`, `writeScl`, `scalaToCsv`. NOT extended in Phase 3 — kbm gets its own module per D-09. Shared helpers (BOM strip, CRLF→LF normalize, 1MB cap) may be re-used in `kbm.ts` via small private utilities or inline copy (single-source if the helper is non-trivial; otherwise duplicate).
- `src/lib/INVENTORY.md` — append a "Phase 3 entries" section: parseKbm/writeKbm/KbmMapping/kbmToFrequencies (custom — Scala KBM spec); lattice (custom — wraps ji-lattice for coordinates, D3 for SVG); tonality-diamond (custom — hand-laid odd-limit math, no clean library equivalent); keyboard (custom — hand-laid SVG strip).
- `src/styles.css` — Phase 3 adds: floating Stop-button positioning, responsive viewport rules (no media-query breakpoints; just `font-size: 16px+` on inputs, `preserveAspectRatio` on viz SVGs).
- `eslint.config.js` — R-01 already in force (no `Fraction` from `xen-dev-utils`). No new rules needed.
- `vitest.config.ts` — already covers `src/lib/__tests__/`. Component tests under `src/components/__tests__/` need the test glob to include them (extension done in Phase 2 Plan 01 — verify in plan).

### Established Patterns (locked from Phase 1 + 2)
- **Three-layer separation** (ARCHITECTURE Pattern + ESLint R-01): `src/lib/` no DOM/audio; `src/components/` DOM factories; `src/audio/` AudioContext lifecycle. New `kbm.ts` is pure-data — no DOM, no audio. Viz components are factories taking pure data + a `SynthHandle` (a typed interface, not the audio context).
- **Component factories return `HTMLElement`** (Phase 2 D-09); no module-level state; synth handle owner-allocated by the page cell.
- **Cell-owned synth + `invalidation`** (Pattern 4): one `synth` per page; Esc listener and `visibilitychange` listener bind in the synth cell so they don't re-bind on every scale edit (Pitfall #11).
- **Cents at 0.1¢ display precision** (Phase 2 D-06 / Pitfall #16). Lattice/diamond/keyboard inherit this default; opts.precision overrides per-widget.
- **TS strict + `noUncheckedIndexedAccess`** (Phase 1 D-16): every `monzo[i]`, `intervals[i]`, `kbm.keyMap[note]` requires guard.
- **Wrap, don't reimplement** (Pitfall #5): `oddLimit`, `primeLimit`, monzo arithmetic, `Fraction` math — all already in src/lib/. Lattice + diamond reuse these instead of recomputing.
- **Imports use `.js` extension** even for `.ts` source — Framework runtime convention.
- **`.scl` parser conventions** (Phase 2 D-12 / Pitfall #6): comment `!`, period-by-`.` cents detection, implicit `1/1`, 1MB cap. Apply analogous discipline to `.kbm` parser.

### Integration Points
- **Vitest ↔ kbm**: `src/lib/__tests__/kbm.test.ts` covers parse → write → parse round-trip on a hand-curated 3–5 fixture corpus including:
  - middle == reference (default case)
  - middle ≠ reference (the success-criterion case)
  - non-trivial size, formal-octave ≠ size, key-range subset, muted keys (`x` entries).
- **Vitest ↔ kbmToFrequencies**: covers middle ≠ reference; non-octave formal-octave; muted keys returning `null` / absent from the map.
- **Reactive runtime ↔ viz widgets**: each widget cell re-runs when `scale` (or `effectiveBaseHz`) changes; `display()` replaces the previous DOM. D3 zoom listeners detach automatically when the SVG is GC'd.
- **synth.ts ↔ visibilitychange**: bind in `ensure()` (after `ctx` is created); remove in `dispose()`.
- **Dashboard ↔ kbm playback**: a reactive `effectiveBaseHz` cell:
  ```ts
  const effectiveBaseHz = (importedKbm && !useBaseHzOverride)
    ? kbmToFrequencies(scale, importedKbm).get(importedKbm.middleNote)
    : baseHz;
  ```
  passed to `audioPanel`, lattice, diamond, keyboard. The override toggle and the imported `KbmMapping` are reactive cells from `sclIo` callbacks.
- **CI test ↔ kbm**: golden-test the `referenceKey ≠ middleNote` round-trip + a `kbmToFrequencies` golden with manual ground-truth Hz calc for one well-known case (e.g., `middle=60, ref=69, refHz=440 → 1/1 ≈ 261.626 Hz`).
- **Stop-all-audio cell** lives in the synth cell:
  ```ts
  // synth.ts is unchanged; the Esc listener belongs to the page, not the audio module
  const onKey = (e) => { if (e.key === 'Escape') synth.panic(); };
  document.addEventListener('keydown', onKey);
  invalidation.then(() => document.removeEventListener('keydown', onKey));
  ```
  Floating Stop button is its own cell; visibility driven by a `Mutable<boolean>` updated by `synth.activeVoices > 0` polling (or — preferred — by `synth` exposing an `onActiveVoicesChange` callback if/when added; Phase 3 may extend `SynthHandle` minimally).
- **ji-lattice ↔ lattice.ts**: `ji-lattice` returns coordinates; `lattice.ts` wraps with D3 for `<g>`/`<circle>`/`<text>` rendering, zoom, click handlers. Don't reach for the lattice's built-in renderer (if any) — keep our visual style consistent.

</code_context>

<specifics>
## Specific Ideas

- **Lattice basis derivation example:** seed scale `1/1, 9/8, 5/4, 21/16, 3/2, 27/16, 7/4, 2/1` has primes {2, 3, 5, 7}. Stripping prime 2 → {3, 5, 7}. Default basis = `[3, 5, 7]` → `ji-lattice` 2D projection. User can override to `[3, 5]` (collapse 7-axis to 0).
- **Diamond default odd-limit example:** seed scale's intervals have odd-limits 1, 9, 5, 21, 3, 27, 7, 1 → max = 27 → rounded UP to nearest of {7,9,11,13,15,21,31} → 31. (Or: clamp to 21 for visual sanity. Plan-phase decides.) Override available.
- **Keyboard cents labels:** for the seed scale, cents-from-12tet are `+0, +3.9, −13.7, −29.0, +2.0, +5.9, −31.2, +0`. Always show sign; 0.1¢ precision; tooltip on hover explains JND (~6¢) per Pitfall #16 / UX Pitfalls.
- **Floating Stop button copy:** "Stop all audio (Esc)" — plain text on the button, hidden visually-only when `activeVoices === 0` (e.g., `display: none` or `opacity: 0; pointer-events: none`). Touch target ≥ 44×44 px.
- **mobile-audit.md notes file** documents:
  1. Verification methodology (Safari macOS RDM iPhone preset).
  2. Known limitations of RDM (autoplay-policy + hardware mute switch NOT reproduced).
  3. iOS hardware mute switch: silences `AudioContext` output even when page-level controls show "playing." Per-page tooltip on audio buttons: "If you hear nothing, check your iPhone's silent switch."
  4. Autoplay-policy: ctx must `resume()` synchronously inside a click handler. No `await` between gesture and resume.
  5. `webkitAudioContext` fallback: kept for older iOS; expected to be a no-op on current iOS but harmless.
- **kbm round-trip test data:** start from a hand-curated KBM that exercises:
  - 12-key linear mapping with `referenceKey=69, referenceHz=440, middleNote=60` (1/1 = C4 ≈ 261.626 Hz).
  - 7-key scale-degree mapping with formal-octave = 7 ≠ 12.
  - At least one muted key entry (`x`).
- **Diamond hand-layout sketch:** odd-limit-N diamond plots `i/j` for odd `i, j ∈ [1, N]` at lattice coordinates `(log₂(i) − log₂(j))` along one axis and `(log₂(i) + log₂(j))` along the other (or simpler: row=i, col=j). Octave-reduce all ratios to `[1, 2)`. Render as a triangular / rhombic grid. Cell color = prime axis of the dominant prime in `i*j`.

</specifics>

<deferred>
## Deferred Ideas

- **Theory pages dedicated to lattice / tonality-diamond** — descoped per D-01 (all on dashboard). Future phase: add `src/pages/lattice.md` exploring the seed scale's prime-3-axis chain, etc.
- **Compact / collapsible viz on dashboard** — descoped per D-02 (full-bleed). Revisit if mobile usability suffers in practice during the audit.
- **Anchored-to-MIDI keyboard view** — descoped per D-03. Future phase: `keyboard(scale, synth, baseHz, kbm, opts)` variant when `.kbm`-driven layout becomes a use case.
- **Static-SVG and pan/zoom-only viz modes** — descoped per D-06 (full interactivity in v1). Could surface as `opts.interactivity: 'static' | 'zoom' | 'audition'` in a later phase.
- **Modal toggle between `'note'` and `'dyad'` audition** — D-07 chose configurable opt; default sticks. UI toggle could land later if frequent switching becomes an annoyance.
- **Twin sclIo + separate kbmIo widgets** — D-11 chose combined widget. Split if a kbm-only consumer page emerges.
- **Forced kbm-applies-to-playback (no override)** — softened by D-13 toggle. Removes the "weird, my dashboard plays at the wrong pitch" surprise.
- **Verify-only mobile audit** — D-14 chose full sweep. Verify-only would have left the visibilitychange / Stop-all / responsive UX as later work.
- **Always-visible Stop button** — D-16: visible only when `activeVoices > 0`.
- **Defined breakpoint media queries** — D-17: single-column, full-width everywhere; no `@media` rules in Phase 3 beyond the defaults already in `styles.css`.
- **Physical iPhone testing** — D-18 picked Safari RDM only with documented limitation. Physical-device verification can be a one-off note in a future phase or roadmap backlog item; the autoplay + hardware-mute quirks documented in `mobile-audit.md` give the plan-phase the pre-knowledge to handle them in code without device verification.
- **3D lattice (Three.js / WebGL)** — v2+ per CLAUDE.md "What NOT to use" + TEMP-06.
- **harmonic-entropy / temperaments** — still deferred (peer-dep mismatch / scope).
- **Persistent scale state (URL hash / localStorage)** — Phase 4 (ANAL-04).
- **EDO ↔ JI / MOS / scale comparison** — Phase 4 (ANAL-01..03).
- **Per-key MIDI input driving the dashboard** — out of scope per PROJECT.md (no MIDI input in v1; `.scl`/`.kbm` is the bridge).

</deferred>

---

*Phase: 3-Visualization + Mobile Audio Audit*
*Context gathered: 2026-05-05*
