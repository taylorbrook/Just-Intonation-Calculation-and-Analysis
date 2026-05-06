# Phase 4: Analysis & Sharing - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Layer four analytic capabilities onto the existing kernel + dashboard:

1. **EDO ↔ JI mapping (ANAL-01)** — given a JI scale, rank best-fit EDOs; given an EDO + prime/odd-limit, list best JI approximations per step.
2. **MOS / generator-period scale construction (ANAL-02)** — build a `Scale` from a generator + period + size, optionally snapping to the nearest natural MOS size.
3. **Side-by-side scale comparison (ANAL-03)** — A vs B comparison with cents-position alignment, table + plot + audio.
4. **Persistent URLs (ANAL-04)** — auto-update a `#s=...` hash so any scale state on the dashboard or `/analysis` is shareable + reproducible.

**In scope (Phase 4 deliverables):**
- New page `src/pages/analysis.md` hosting all three analytic features (EDO↔JI, MOS, compare) with its own synth cell.
- New module `src/lib/edo.ts` — pure-data: `bestEdosForScale(scale, range, metrics)`, `bestJiInEdo(edoSteps, limit, kind)`. Builds on `xen-dev-utils.approximatePrimeLimit` (already used by `jiSubsetOfEdo`); adds odd-limit search routine (~30 LOC).
- New module `src/lib/mos.ts` — pure-data: `buildMos(generator, period, size)`, `nearestMosSize(generator, period, target)` (Stern-Brocot mediants). Hand-rolled (NOT moment-of-symmetry package).
- New module `src/lib/url.ts` — pure-data encode/decode: `encodeScaleToHash(scale): string` (base64-URL-safe), `decodeHashToScale(hash): Scale | null`.
- New components: `src/components/edo-jit-table.ts` (sortable scale→EDO table), `src/components/edo-ji-table.ts` (EDO→JI subset table with prime/odd toggle), `src/components/mos-builder.ts` (n/d inputs + size + snap toggle + scaleTable + Play), `src/components/scale-compare.ts` (A vs B with three B-sources + alignment + table + plot + audio).
- Dashboard (`src/index.md`) gains: "Analyze this scale →" button (writes hash + opens `/analysis`); auto-update hash on scale edit (debounced ~300ms, `replaceState`); read hash on load.
- `/analysis` page: own synth cell + Esc + Stop button (Phase 3 D-15/D-16 pattern); reads `#s=` hash, falls back to local textarea + seed; same auto-hash-update behavior.
- Sortable cents-error scatter plot (Observable Plot) on the EDO↔JI surface alongside the tables.
- Vitest tests: `src/lib/__tests__/edo.test.ts`, `mos.test.ts`, `url.test.ts`. Component smoke tests for the four new components.

**Out of scope (later phases or descoped):**
- Cents-defined generator input for MOS (D-10: ratio-only `n/d` inputs in v1; cents workaround = user computes ratio first). Deferred.
- Full MOS preview (L/s pattern viz, brightness ranking, mode rotation/naming) — D-12 chose Scale + scaleTable + audio only.
- Scale Workshop's `sonic-weave` URL hash format (D-14: chose plain base64 + URL-safe; cross-tool URL compat is deferred).
- N-way scale comparison (D-17: two-scale fixed; N-way is a future phase).
- Per-row cents-deviation strip on EDO tables (output chose tables + scatter plot, not per-row inline strip).
- Tonality-diamond / lattice on `/analysis` — those stay on the dashboard (Phase 3 D-01).
- "Send MOS / EDO-mapped scale → dashboard" reverse link — open follow-up; planner may add as a thin link button.
- Temperament browser, comma decomposition, harmonic entropy, dissonance curves — v2 (TEMP-01..05).

</domain>

<decisions>
## Implementation Decisions

### Surface Placement

- **D-01:** **New `src/pages/analysis.md` page** hosts all three analytic features (EDO↔JI map, MOS construction, scale comparison). Dashboard stays focused on the scale-design loop; analysis surface is a peer page.
- **D-02:** **`/analysis` reads scale from URL hash with textarea fallback (Claude recommendation, locked).** When `#s=...` is present, it overrides the page's local textarea + seed scale. When absent, the page falls back to its own seed + textarea. Reasoning: tests the share path naturally, lets the page stand alone, matches the notebook framing.
- **D-03:** **`/analysis` has its own synth cell** — full audition support across all three features (EDO row → arpeggiate scale-mapped-to-EDO; MOS Play; per-row A/B compare audition). Replicates the Phase 3 D-15/D-16 pattern (Esc panic, floating Stop button, `activeVoices` reactive flag).
- **D-04:** **`"Analyze this scale →"` button on dashboard** writes the current scale to `#s=...` and navigates to `/analysis` (single click). Lives next to the `sclIo` export buttons. Framework auto-nav sidebar handles general discoverability.

### EDO ↔ JI design (ANAL-01)

- **D-05:** **Both directions ship in Phase 4.** (a) Scale → ranked EDO table. (b) EDO + limit → best JI approximations per step. Two widgets on `/analysis`. Roadmap success criterion #1 explicitly requires both.
- **D-06:** **Three sortable error columns** on the scale→EDO table: max cents error, RMS cents error, Tenney-weighted error. User clicks column header to re-sort. No single "right" metric — composer picks.
- **D-07:** **EDO search range is a user-input number** (no slider). Default upper bound TBD by planner — recommend 72 (covers all musically common EDOs). Lower bound 5. No "top-N by error budget" mode in v1.
- **D-08:** **EDO→JI direction supports BOTH prime-limit AND odd-limit** with a toggle. Prime-limit reuses `xen-dev-utils.approximatePrimeLimit` (already wrapped by `jiSubsetOfEdo`). Odd-limit needs a new search routine in `src/lib/edo.ts` (~30 LOC: enumerate odd ratios up to limit, octave-reduce, find nearest to each EDO step). Prime-limit on its own is in Phase 2; the new work is the odd-limit search + the toggle UI.
- **D-09:** **Output = sortable tables + Observable Plot scatter.** Each direction gets a table; the scale→EDO direction also renders a scatter plot (x = EDO, y = max-err) with the user's scale's best-fit EDOs labeled.
- **D-10:** **Audition by row** — clicking an EDO row in the scale→EDO table arpeggiates the user's scale rendered at the EDO's nearest steps. Hear what "the scale in 31edo" actually sounds like (the high-value composer decision: "is this EDO good enough"). No per-cell single-note audition in v1.

### MOS approach (ANAL-02)

- **D-11:** **Hand-roll `src/lib/mos.ts`** rather than installing `moment-of-symmetry@0.10.0`. Reasoning: Pitfall #5 is about wrapping UPSTREAM, not adopting every package — when the math fits in ~80–120 LOC, hand-rolling avoids another peer-dep risk against `xen-dev-utils@0.13`. Generator-stacking + period-reduce + sort + Stern-Brocot mediants for MOS-size detection are all standard, well-known algorithms.
- **D-12:** **Generator and period as two ratio-only number inputs (numerator + denominator each).** Pythagorean (`3/2` + `2/1`) and Bohlen-Pierce (`3/1` for both period and generator-context) work; meantone tempered cents-defined generators (~701.955¢) do NOT — user must hand-compute the ratio. Cents-generator input is **deferred to a later phase**.
- **D-13:** **Size input + "snap to nearest MOS size" toggle (default ON, Claude recommendation, locked).** Free integer input for size; checkbox snaps to the nearest natural MOS size (Stern-Brocot mediants of period/generator). Default snap=ON because MOS-snap IS the feature; uncheck for deliberately-non-MOS exploration.
- **D-14:** **Output = `Scale` + `scaleTable` + audio (Play button).** Build a `Scale` (immutable, period-aware), render through the existing `scaleTable` component, add a Play scale button. Output is fungible with everything else in the project. NO L/s step-pattern viz, brightness ranking, or mode-rotation picker in v1 — all deferred.

### Persistent URLs (ANAL-04)

- **D-15:** **Scale text only.** The hash encodes ONLY the scale lines (textarea contents). `baseHz`, imported `kbm`, viz options stay at receiver defaults. Compact URLs (~30–80 chars compressed); easy to share inline in prose.
- **D-16:** **Base64 + URL-safe encoding.** `#s=ICVuZTUuLi4=`-style. Standard pattern; handles special characters cleanly. Use the URL-safe base64 alphabet (`+/` → `-_`, no padding). Not human-readable but trivial to debug with a one-liner.
- **D-17:** **Auto-update on every scale edit, debounced ~300ms.** Use `history.replaceState` (not `pushState`) so the back-button history stays clean. URL bar always reflects current state — sharing is just "copy URL bar."
- **D-18:** **Pure `src/lib/url.ts`** owns encode/decode. Page cells (in `index.md` and `analysis.md`) own the `window.location.hash` read/write. No separate `url-share.ts` component (no Copy button needed since auto-update keeps the URL bar current). Matches the existing `scala.ts` / `kbm.ts` pure-lib convention.
- **D-19:** **Hash overrides seed silently on load.** When the page boots with `#s=...`, decode + use as the initial scale; no banner. User edits propagate back to the hash. Invisible — "just works."
- **D-20:** **Malformed hash → status-region error in `sclIo` style.** Decode error: load default scale, post the error to the existing `aria-live=polite` status region: "Couldn't load shared scale: <reason>". Hash is NOT cleared — user can copy it for debugging. Visible failure, debuggable.

### Scale comparison (ANAL-03)

- **D-21:** **Two scales (A vs B) — fixed.** Roadmap success criterion #3 explicitly says "two scales side-by-side." N-way comparison deferred.
- **D-22:** **Scale B sources: dropdown + textarea + `.scl` import (all three).** Dropdown of built-in seeds (12tet, 19edo, 31edo, Pythagorean diatonic, 5-limit JI, Bohlen-Pierce — exact list TBD by planner) + paste textarea + `.scl` file picker (reuses `parseScl`). Covers preset, ad-hoc, and "compare against this archive scale" workflows.
- **D-23:** **Cents-position (nearest-match) alignment.** When sizes differ (e.g., A has 7 degrees, B has 12), match each A degree to its nearest-cents B degree. Show `|Δ¢|` per row + summary (max-deviation, common-subset count, RMS diff). Some B degrees may match multiple A degrees; some unmatched. Index-pairing is musically meaningless across different sizes; not offered.
- **D-24:** **Output = table + Observable Plot lollipop chart + per-row audition.** Table with A.degree/A.ratio/A.cents, B.match/B.ratio/B.cents, |Δ¢|. Horizontal lollipop on a shared 0–1200¢ axis showing both A and B pitches (visually striking overlap view). Per-row audition button plays A then B (exact UX — sequential vs simultaneous — TBD by planner).

### Claude's Discretion (planner can refine without re-asking)

- **D-25:** **Default EDO upper-bound input value:** recommend 72 (covers 12, 19, 22, 24, 31, 41, 53, 72). Planner may pick 100 if they want more headroom.
- **D-26:** **Default debounce window for hash auto-update:** 300ms. Tune if perceptible lag in the URL bar bothers in practice.
- **D-27:** **Built-in scale-B seed list contents:** recommend 12tet, 19edo, 31edo, Pythagorean diatonic (3-limit), 5-limit JI diatonic, Bohlen-Pierce. Planner may add/remove based on common research targets.
- **D-28:** **MOS default seed values:** generator 3/2, period 2/1, size 7 (Pythagorean diatonic). Renders something interesting on first load.
- **D-29:** **MOS degenerate-input error UX:** period = 1/1 → throw `RangeError("MOS period must be > 1/1")`; generator equal to period → arithmetic returns single-pitch scale; clear status-region message.
- **D-30:** **Per-row A/B audition default:** sequential (A then B with brief gap) — easier to A/B compare than simultaneous. Add simultaneous as a toggle if useful.
- **D-31:** **Scatter plot orientation (EDO↔JI):** horizontal (x = EDO step count, y = max cents error). Sweet-spot EDOs sit at troughs.
- **D-32:** **Common-subset threshold (compare):** exact equality via `Interval.equals` (BigInt fraction match) per Pitfall #1 / #6. NEVER cents-tolerance (would conflate distinct intervals).
- **D-33:** **Plot color encoding (compare):** A in one color, B in another, plus the dashboard accent — palette TBD; ensure WCAG AA contrast and color-blind-safe (cf. Phase 3 D-21 viz palette discipline).
- **D-34:** **`/analysis` synth cell mirrors the dashboard's**: same Esc + Stop-button + `activeVoices` reactive pattern (Phase 3 D-15/D-16). Esc listener bound in the synth cell itself, NOT in any feature cell (Pitfall #11).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level guidance
- `CLAUDE.md` — Tech stack source of truth. Especially:
  - "Recommended Stack" — `xen-dev-utils@0.13.1`, `fraction.js@5.3.4`, `@observablehq/plot@0.6.17` (ships with Framework), `d3@7.9.0`.
  - "Supporting Libraries" — `moment-of-symmetry@0.10.0` LISTED but Phase 4 D-11 chooses NOT to install it (hand-roll instead).
  - "What NOT to Use" — floating-point cents as source of truth (Pitfall #1); decimal `BigNumber` for ratios; `mathjs` `Fraction`.
  - "Observable Framework Conventions" — `.ts` imports as `.js`; reactive cell ordering (Pitfall #11); no top-level `AudioContext`; data loaders pattern.
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope list. ANAL-01..04 are Active requirements; analysis features are part of v1.
- `.planning/REQUIREMENTS.md` — Phase 4 requirement set: ANAL-01 (EDO↔JI), ANAL-02 (MOS), ANAL-03 (compare), ANAL-04 (URL).
- `.planning/ROADMAP.md` — Phase 4 success criteria (4 items) — all four must be TRUE at phase end:
  1. Pick a JI scale → ranked best-fit EDOs; pick an EDO → best JI approximations.
  2. Construct a MOS scale by generator + period; appears with the same `Scale` API as any hand-built scale.
  3. Place two scales side-by-side; see degree-by-degree cents, common subset, max deviation.
  4. Share a URL whose hash encodes a scale; recipient lands on a page seeded with that exact scale.

### Phase 1 + 2 + 3 carry-forward
- `.planning/phases/01-bootstrap-build/01-CONTEXT.md` — Phase 1 D-01..D-21 still in force. Especially D-12 (ESLint `recommendedTypeChecked`), D-16 (TS strict + `noUncheckedIndexedAccess`), D-17 (pin `fraction.js@5.3.4` exact).
- `.planning/phases/02-math-kernel-composition-anchor-mvp/02-CONTEXT.md` — Phase 2 decisions still in force. Especially:
  - D-06 (cents at 0.1¢ display precision) — EDO-error displays inherit this default.
  - D-08 (baseHz default 440) — `/analysis` synth uses same default.
  - D-09 (component factory contract `(data, ..., opts?) => HTMLElement`).
  - D-12, D-13, D-14 (Scala-body parser conventions; auto-prepend `1/1`; last interval is the period). MOS output and compare-B-paste reuse `parseScala`.
  - D-21 (named commas: lookup by canonical monzo, NEVER cents-tolerance) — same discipline applies to scale-comparison common-subset detection.
  - D-24 (immutability: `Scale`, `Interval` return new instances) — MOS builder + scale-compare derived scales must respect this.
- `.planning/phases/03-visualization-mobile-audio-audit/03-CONTEXT.md` — Phase 3 decisions still in force. Especially:
  - D-08 (component contract — synth as REQUIRED arg for audio-aware widgets) — `/analysis` widgets follow.
  - D-15 (audio-layer mobile fixes), D-16 (Stop button + Esc), D-17 (responsive UX) — `/analysis` synth cell replicates this.
  - D-25 (component CSS colocated) — `edo-jit-table.css`, `mos-builder.css`, `scale-compare.css`, `edo-ji-table.css`.
- `src/lib/INVENTORY.md` — wrap-don't-reimplement discipline (Pitfall #5). Append rows for: `bestEdosForScale` / `bestJiInEdo` / `oddLimitApproximation` (custom, in `edo.ts`); `buildMos` / `nearestMosSize` (custom, in `mos.ts`, hand-rolled per D-11); `encodeScaleToHash` / `decodeHashToScale` (custom, in `url.ts`); the four new components.
- `eslint.config.js` — R-01 `no-restricted-imports` already forbids importing `Fraction` from `xen-dev-utils`. Phase 4 must not regress this; `edo.ts` and `mos.ts` import `Fraction` from `fraction.js` directly when needed.
- `src/audio/synth.ts` — already exposes `playNote`, `playNotes`, `playArpeggio`, `panic`, `activeVoices`, `dispose`. `/analysis` cells reuse this surface unchanged.

### Architecture & research (Phase 1 outputs — load when planning)
- `.planning/research/ARCHITECTURE.md` — Three-layer architecture; Pattern 2 (components as factories); Pattern 4 (synth lifecycle, `invalidation.then(dispose)`); Pattern 1 (Interval as currency).
- `.planning/research/PITFALLS.md` — load before any implementation:
  - Pitfall #1 (cents are display-only — never kernel input). Critical for ANAL-01 ranking metrics: error in cents is a derived float; the underlying ratios must round-trip exactly.
  - Pitfall #4 (visualization eats the project — time-box; the EDO scatter + compare lollipop should be one Plot mark each, not bespoke D3).
  - Pitfall #5 (reinventing xen-dev-utils — `oddLimit`, `primeLimit`, `approximatePrimeLimit` already in src/lib/monzo.ts and src/lib/scale.ts).
  - Pitfall #6 (`.scl` parser — period-by-`.` cents detection, BOM strip, 1MB cap). Compare's `.scl` import via `parseScl` already inherits this.
  - Pitfall #11 (reactive cell ordering — Esc listener cell must NOT depend on `scale`; bind in synth cell). `/analysis` synth cell follows.
  - Pitfall #16 (sub-cent precision — display at 0.1¢).
- `.planning/research/STACK.md` — Observable Plot ships with Framework; D3 v7 already installed. URL state pattern not covered explicitly — implement per D-15..D-20 above.
- `.planning/research/FEATURES.md` — feature → priority matrix:
  - "EDO ↔ JI mapping table" P2.
  - "MOS / generator-period scales" P2.
  - "Comparison cell" P2.
  - "Persistent URLs for scales" P2.

### External (read on demand during planning)
- `xen-dev-utils` `approximatePrimeLimit` source: https://github.com/xenharmonic-devs/xen-dev-utils — review the BigInt-vs-Number boundary (Phase 2 jiSubsetOfEdo wrapper round-trips via string).
- MOS theory primer: https://en.xen.wiki/w/MOS_scale — generator/period definition, 2-step-size property, Stern-Brocot mediants.
- Wilson's MOS introduction: https://www.anaphoria.com/wilsonintroMOS.html — original treatment of generator + period stacking.
- Observable Plot (already installed via Framework): https://observablehq.com/plot — scatter (`Plot.dot`) for EDO error landscape, lollipop (`Plot.ruleY` + `Plot.dot`) for compare.
- URL hash state pattern: https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState — replaceState (NOT pushState) for auto-update so back-button history stays clean.
- Base64 URL-safe encoding (RFC 4648 §5): https://datatracker.ietf.org/doc/html/rfc4648#section-5 — `+/` → `-_`, no padding.
- Sevish microtonal scale archive: https://sevish.com/scales/ — possible source for built-in compare-B seeds.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1 + 2 + 3)
- `src/lib/scale.ts` exposes `Scale` (intervals, period, immutable per D-24) AND `jiSubsetOfEdo(edoSteps, primeLimit)` from Phase 2 SCALE-05. **Phase 4 reuses `jiSubsetOfEdo` as the prime-limit branch of EDO→JI direction; the new `bestJiInEdo` (in `src/lib/edo.ts`) wraps it for the prime-limit toggle and adds an odd-limit branch.**
- `src/lib/interval.ts` exposes `Interval` (BigInt-Fraction, lazy monzo, lazy cents). EDO error metrics use `Interval.cents` (display projection). MOS construction uses `Interval.mul`, `Interval.octaveReduce(period)`. Compare common-subset uses `Interval.equals` (BigInt — Pitfall #1).
- `src/lib/scala.ts` exposes `parseScala` (body parser). MOS textarea reuses for the generator/period inputs IF we relax D-12 in the future; for now D-12 says ratio-only `n/d` — direct `Fraction` construction. Compare's "paste B" textarea + .scl import path uses `parseScala` and `parseScl`.
- `src/lib/monzo.ts` exposes `oddLimit`, `primeLimit`, `PRIMES`, `toMonzo`. EDO→JI odd-limit search iterates pairs of odd integers up to limit, computes `Interval`, `octaveReduce`, then nearest-EDO-step.
- `src/lib/kbm.ts` is already standalone; no Phase 4 changes there.
- `src/components/scale-table.ts` factory `(scale, baseHz, opts) => HTMLElement`. **MOS output reuses unchanged.** Compare may render two scaleTable instances side-by-side OR build a custom merged table.
- `src/components/play-scale.ts` ⏵⏵ Play-scale button. **MOS Play button reuses unchanged.**
- `src/components/audio-panel.ts` (dashboard-only per Phase 2 D-07/D-10). NOT reused on `/analysis`; the analysis page mounts its own audition controls per-feature (row-click on EDO table; Play on MOS; per-row A/B button on compare).
- `src/components/scl-io.ts` already supports `.scl` and `.kbm`. Compare's "import .scl for B" can either reuse a stripped-down `sclIo` instance (one-button form) OR use a private file-picker copy in `scale-compare.ts`. Planner decides.
- `src/audio/synth.ts` exposes `createSynth`, `SynthHandle`. `/analysis` page calls `createSynth()` once at the top, threads through to all feature components. Esc + Stop button replicate Phase 3 D-15/D-16 / Pitfall #11 pattern.
- `src/index.md` Phase 3 textarea cell (`scaleText` + `parseScala` + `parseError`) is the model for `/analysis` page's local input.
- `src/styles.css` already has Stop button, dashboard-error, dashboard-helper. `/analysis` reuses these classes.
- `vitest.config.ts` test glob covers `src/lib/__tests__/`, `src/audio/__tests__/`, `src/components/__tests__/`, `src/__tests__/`. Phase 4 tests fit existing globs — no extension needed.
- `eslint.config.js` R-01 (no `Fraction` from xen-dev-utils) still in force; respect in `edo.ts`/`mos.ts`/`url.ts`.

### Established Patterns (locked from Phase 1 + 2 + 3)
- **Three-layer separation** (ARCHITECTURE Pattern + ESLint R-01): `src/lib/` no DOM/audio; `src/components/` DOM factories; `src/audio/` AudioContext lifecycle. New `edo.ts`, `mos.ts`, `url.ts` are pure-data — no DOM, no audio. New components are factories taking pure data + a `SynthHandle`.
- **Component factories return `HTMLElement`** (Phase 2 D-09); no module-level state; synth handle owner-allocated by the page cell.
- **Cell-owned synth + `invalidation`** (Pattern 4): one `synth` per page; Esc + Stop bind in the synth cell so they don't re-bind on every scale edit (Pitfall #11).
- **Cents at 0.1¢ display precision** (Phase 2 D-06 / Pitfall #16). EDO-error display, compare Δ¢, MOS scaleTable inherit this default.
- **TS strict + `noUncheckedIndexedAccess`** (Phase 1 D-16): every `intervals[i]`, `monzo[i]` requires guard.
- **Wrap, don't reimplement** (Pitfall #5): `oddLimit`, `primeLimit`, `approximatePrimeLimit`, `Fraction` math, `Interval.octaveReduce` — all already in src/lib/. New code reuses; D-11 (hand-roll MOS) is consistent with this — MOS isn't in xen-dev-utils' core surface, so there's no upstream to wrap (the optional `moment-of-symmetry` package adds a dep without a clear upstream-vs-custom benefit).
- **Imports use `.js` extension** even for `.ts` source — Framework runtime convention.
- **`.scl` parser conventions** apply when compare imports a `.scl` file for scale B.
- **Status region** with `role=status aria-live=polite` (Phase 2 — `sclIo`) is the canonical surface for parser/decode errors. `/analysis` URL-decode error and compare's B-input error use the same pattern.

### Integration Points
- **Dashboard ↔ URL hash**: `src/index.md` adds (a) a hash-write reactive cell (debounced 300ms; `replaceState`) that runs on every `scaleText` change; (b) a hash-read at boot (before the seed-text cell) that, if `#s=...` decodes successfully, sets `scaleText`'s initial value to the decoded scale's text serialization. Falls back to `seedText` on no-hash or decode error (with status-region message).
- **`/analysis` ↔ URL hash**: same pattern as dashboard. Hash override is silent (D-19); decode error surfaces in status region (D-20).
- **`/analysis` ↔ synth lifecycle**: replicate Phase 3 / `src/index.md` synth cell — `createSynth()` + Esc handler + `activeVoices` Mutable + `setInterval` + `invalidation.then(dispose + clearInterval + removeEventListener)`. Pitfall #11: bind keydown in the synth cell, NOT in any feature cell.
- **Vitest ↔ url.ts**: round-trip test (encode → decode → equality), invalid-input fallback, malformed-hash recovery, edge cases (empty scale, very large scales).
- **Vitest ↔ edo.ts**: golden tests for `bestEdosForScale` (e.g., 5-limit JI diatonic should rank 12, 19, 31 high; not 13, 18); `bestJiInEdo` parity with `jiSubsetOfEdo` for prime-limit branch; new odd-limit branch coverage.
- **Vitest ↔ mos.ts**: `buildMos(3/2, 2/1, 7)` → Pythagorean diatonic (verify the 7 pitches exactly); `buildMos(3/2, 2/1, 12)` → Pythagorean chromatic; `nearestMosSize` returns 5, 7, 12, 17, 29, 41, 53 for `(3/2, 2/1)`.
- **Compare ↔ scale-table-style render**: compare may layout as either two scaleTable instances side-by-side (no merge logic; visually busy) OR a single merged table with cents-position alignment columns. Planner decides; spec includes both as acceptable shapes.
- **Lollipop plot ↔ Observable Plot**: `Plot.dot` for the bullet, `Plot.ruleY` for the stem. One mark each for A and B; legend by color.

</code_context>

<specifics>
## Specific Ideas

- **Default seed scale on `/analysis` page** (when no hash + textarea empty): same as dashboard — 7-limit JI heptatonic `9/8 5/4 21/16 3/2 27/16 7/4 2/1`. Consistent first-load experience across pages.
- **EDO scale-mapping audition** (D-10): for an N-EDO row, render the scale at `[round(cents(degree)/1200*N)]` steps of N-EDO; arpeggiate via `synth.playArpeggio` with the resulting Hz array. Re-uses `synth.playArpeggio` unchanged (just different Hz values).
- **MOS default seed**: generator `3/2`, period `2/1`, size `7` (Pythagorean diatonic). `nearestMosSize(3/2, 2/1, 7)` = 7, so snap toggle has no effect on the seed.
- **Scale-B preset list (D-22)** — recommend (planner may refine):
  - `12tet` → `Scale` of 12 equal divisions of `2/1`.
  - `19edo`, `31edo` → 19/31 EDO via cents.
  - `pythagorean-7` → `[9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2/1]`.
  - `5-limit-7` → `[9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1]`.
  - `bohlen-pierce-9` → 9 steps of `3/1` period (Lambda mode).
- **URL hash example** (D-15..D-20): seed scale `9/8 5/4 21/16 3/2 27/16 7/4 2/1` round-trips to a base64-URL-safe string ~30 chars. Sample shape: `https://tunings.example/#s=Mi8xCjkvOA09NS80Cjk...`.
- **Compare summary stats** (D-23): below the table, show:
  - **Max deviation**: `max(|Δ¢|)` across all matched rows.
  - **RMS deviation**: `sqrt(mean(Δ¢²))`.
  - **Common subset count**: rows where `A.fraction.equals(B.fraction)` (BigInt equality — never cents tolerance, Pitfall #1).
- **Compare lollipop colors** (D-24 / D-33): A in a tuning-research-friendly blue, B in orange (color-blind-safe per Phase 3 viz palette discipline). Verify against WCAG AA.
- **EDO scatter labels** (D-09 / D-31): label only the top 5–10 best-fit EDOs to avoid overplotting; full data still in the underlying table.
- **`oddLimitApproximation` algorithm sketch** (D-08): for each odd `i ∈ [1, oddLimit]` and each odd `j ∈ [1, oddLimit]`, build `i/j`, octave-reduce, compute distance to each EDO step. Cap at `oddLimit ≤ 31` for v1 to avoid combinatorial blowup.
- **MOS Stern-Brocot mediants** (D-13): given generator-cents `g` and period-cents `p`, the natural MOS sizes are convergents of `g/p` in continued-fraction form — for `(3/2, 2/1)`: `g/p ≈ 0.5849625`, convergents 1/2, 2/3, 3/5, 4/7, 7/12, 17/29, 24/41, 41/70 → MOS sizes 2, 3, 5, 7, 12, 29, 41, 70. Standard algorithm; ~30 LOC.

</specifics>

<deferred>
## Deferred Ideas

- **Cents-defined generator input for MOS** (D-12) — ratio-only in v1; meantone tempered generators (~701.955¢) require user to hand-compute the ratio. Future phase: allow `parseScala`-style input for generator + period.
- **Full MOS preview** (D-14) — L/s step-pattern strip ("LLsLLLs"), brightness ranking, mode-rotation picker with auto-named modes (Ionian, Dorian, …). All deferred. The notebook framing means future MOS-theory pages will want this; treat the Phase 4 `mos.ts` API as the foundation, the viz can come later.
- **N-way scale comparison** (D-21) — two-scale fixed in v1. Future surface: tabbed columns; choose which column to align against; etc.
- **Per-cell single-note audition on EDO tables** (D-10) — row-arpeggio only in v1. Per-cell could land later if useful.
- **Per-row cents-deviation strip on EDO tables** — chose tables + scatter plot (D-09); per-row inline strip deferred.
- **"Send MOS / EDO-mapped scale → dashboard" reverse link** — open follow-up. The hash mechanism (D-15..D-20) makes this a one-line button: encode the derived scale, navigate to `/`. Planner may add or defer.
- **Sonic-weave URL hash format** (D-16) — chose plain base64 + URL-safe; cross-tool URL compatibility with Scale Workshop is deferred (their hash format itself is moving).
- **Tiered URL scope** (D-15) — chose scale-only; "Share full state" with baseHz + kbm + viz opts is deferred. The decoder is forward-compatible: hash format starts with a version byte (planner spec).
- **"Reset to seed" banner on hash-loaded `/analysis`** (D-19) — chose silent override. Banner deferred unless users get confused.
- **Browser back-button "scale history" semantics** (D-17) — chose `replaceState` so back-button stays clean. Per-edit `pushState` would let users undo scale edits via back; intentionally not chosen — too noisy.
- **MOS L/s step-pattern visualization** — deferred per D-14.
- **Mode rotation picker / auto-named modes** — deferred per D-14.
- **Ratio-to-comma decomposition** (TEMP-02) — v2.
- **Plomp-Levelt dissonance curve** (TEMP-03) — v2.
- **Harmonic entropy** (TEMP-05) — v2.
- **3D lattice** (TEMP-06) — v2; CLAUDE.md "What NOT to Use" Three.js for v1.
- **Embedded SonicWeave DSL** (TEMP-07) — v2.
- **Cross-tool URL roundtrip with Scale Workshop** — possible v1.x; not Phase 4.

</deferred>

---

*Phase: 4-Analysis & Sharing*
*Context gathered: 2026-05-06*
