# Phase 2: Math Kernel + Composition Anchor (MVP) - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the kernel-MVP: a pure JI math kernel (`Interval`, `Scale`, monzo, cents), Scala `.scl` round-trip I/O, Web Audio playback with proper lifecycle, the Markdown + reactive-cells notes surface with KaTeX math typesetting, and a **general scale-design dashboard** at `src/index.md` that exercises every kernel feature end-to-end. This phase is the architectural proof: if the dashboard works using only kernel primitives, the kernel is sound.

**Reframe from PROJECT.md / REQUIREMENTS.md:** The original "anchor to a specific in-progress composition" framing is dropped in favor of a **general scale-design surface**. There is no `src/lib/pieces/<piece>.ts` module. COMP-01/02/03 get reinterpreted as "the dashboard is the kernel-completeness proof; a representative seed scale exercises every kernel feature." See Decisions D-01 below.

**In scope (Phase 2 deliverables):**
- `src/lib/interval.ts` — `Interval` class wrapping `Fraction` (BigInt), lazy monzo + lazy cents
- `src/lib/monzo.ts` — `toMonzo`, `fromMonzo`, `primeLimit`, `oddLimit`, `tenneyHeight`, `benedettiHeight` (delegate to `xen-dev-utils` where possible; record in `INVENTORY.md`)
- `src/lib/cents.ts` — cents conversion + signed cents-from-12tet (display projection only)
- `src/lib/scale.ts` — `Scale` model: `Interval[]` + period; rotate, reduce, dedupe, transpose, period-aware octave-reduction
- `src/lib/scala.ts` — `.scl` parse + serialize (hand-written, ~150 LoC)
- `src/lib/text-input.ts` (or merged into `scala.ts`) — Scala-body parser shared between dashboard text input and `.scl` import
- `src/lib/commas.ts` — named-comma identification by canonical monzo (lookup table; never cents-within-epsilon)
- `src/lib/__tests__/*` — Vitest coverage of every kernel primitive; golden tests against Huygens-Fokker `.scl` archive samples
- `src/audio/synth.ts` — `sw-synth` wrapper, lazy `AudioContext`, `dispose()` via `invalidation`, ADSR defaults, polyphony cap, voice tracking
- `src/components/play-interval.ts`, `play-scale.ts`, `scale-table.ts`, `ratio-pill.ts` — the v1 inline widget set
- `src/index.md` — the general scale-design dashboard (replaces the Phase-1 hello page)
- `src/pages/syntonic-comma.md` — second theory page proving the architecture supports >1 page (NOTES-05)
- KaTeX wired in `observablehq.config.ts` (head injection)

**Out of scope (later phases or descoped):**
- Lattice / tonality diamond / scale-on-keyboard SVG — Phase 3 (VIZ-01/02/03)
- `.kbm` keyboard-mapping I/O — Phase 3 (IO-03)
- Mobile Safari audio audit — Phase 3 (AUDIO-06)
- EDO ↔ JI mapping, MOS construction, scale comparison, persistent URLs — Phase 4 (ANAL-*)
- `src/lib/pieces/<piece>.ts` — descoped (see D-01); no piece-specific module ships in v1
- Persistent scale state (URL hash / localStorage) — descoped to Phase 4 with ANAL-04
- `temperaments` package — still deferred (peer-dep mismatch with `xen-dev-utils@0.13`)
- Custom Web Components for inline widgets — descoped (factories chosen instead, D-08)
- `sonic-weave` DSL embedded as an in-cell scale syntax — v2 (TEMP-07)

</domain>

<decisions>
## Implementation Decisions

### Composition Anchor → General Scale-Design Surface

- **D-01:** **Drop the per-piece anchor concept.** The phase ships a *general* scale-design workspace, not a piece-specific dashboard. There is no `src/lib/pieces/<piece>.ts` module. COMP-01/02/03 are reinterpreted:
  - **COMP-01 (was: "in-progress piece's pitch material lives in `src/lib/pieces/<piece>.ts`")** → satisfied by the dashboard's seed scale + reusable scale primitives. No per-piece module exists.
  - **COMP-02 (was: "composition dashboard page — full end-to-end usage of kernel for the piece")** → the general dashboard at `src/index.md` exercises every kernel feature end-to-end (text-input → `Scale` → table → audition → `.scl` export → re-import).
  - **COMP-03 (was: "CI test asserts the piece module's scale parses and exports correctly")** → CI test asserts the **seed scale** (the dashboard's default 7-limit JI scale) parses, displays, and round-trips through `.scl` correctly. Catches kernel-vs-dashboard drift.
  - **PROJECT.md update needed at phase-transition time:** Add a Key Decisions row noting the shift; update "Context" wording away from "specific composition in progress."
  - **REQUIREMENTS.md update needed at phase-transition time:** Reword COMP-01/02/03 to match the general framing (or move them under a new SURF-* group); keep them in Phase 2.

- **D-02:** **Seed scale = 7-limit JI baked into the dashboard:** `1/1, 9/8, 5/4, 21/16, 3/2, 27/16, 7/4, 2/1`. First-load behavior. Replaceable via the text-input. Doubles as the COMP-03 (renamed) CI fixture and as the example used by the syntonic-comma theory page. The seed lives as a small constant in the dashboard module — *not* as a `pieces/` module.

- **D-03:** **Dashboard page path: `src/index.md` IS the dashboard.** No separate orientation page. Phase-1 hello content gets replaced. Theory pages live under `src/pages/<topic>.md`.

- **D-04:** **Second theory page topic = syntonic comma (81/80).** Lives at `src/pages/syntonic-comma.md`. Self-contained, exercises inline widgets and KaTeX math, ~1 page of prose with 3-5 embedded widgets. Satisfies NOTES-05.

### Dashboard Layout

- **D-05:** **Top-down vertical flow** at `src/index.md`. Reading order:
  1. Brief one-line description
  2. Scale text input (textarea — Scala body format)
  3. Scale table (the same `scaleTable` widget used in prose — see D-09)
  4. Reference-pitch input (baseHz)
  5. **Separate audio panel** with audition controls (per D-07)
  6. `.scl` import / export controls
  7. (Optional) prose section linking out to theory pages
  Matches the "research notebook" ethos and Framework's idiomatic Markdown.

- **D-06:** **Scale table columns = 4: Degree | Ratio | Cents | ¢ from 12-TET.** Cents at 0.1¢ default precision (per research PITFALLS guidance). Monzo / Hz columns NOT default; available later via opts (or a separate widget) if needed. Compact, scannable; covers IO-04 clipboard payload directly.

- **D-07:** **Audio controls live in a separate audio panel below the table, NOT inline per-row.** The panel exposes: an interval-selector (dropdown or stepper picking which scale degree to audition), an "Arpeggiate scale" button, and a "Drone on 1/1" toggle. Drone-on holds a tone while the user triggers intervals to hear them stacked. Cleaner separation of data (table) and controls (audio); fewer affordances cluttering the table rows. (User-chosen over the "inline ▶ per-row" recommendation — this is an explicit preference and should be honored downstream.)

- **D-08:** **Reference pitch (baseHz) = editable input, default A4 = 440 Hz.** Reactive value: changing it re-tunes audio (and a Hz column if/when added later). Composer-friendly default; familiar to non-JI musicians too. (User-chosen over the C4=261.625... recommendation — explicit preference.)

### Inline Widget API

- **D-09:** **Plain factory functions** for inline widgets: `${playInterval(int, synth)}`, `${playScale(scale, synth)}`, `${scaleTable(scale, baseHz)}`, `${ratioPill(int)}`. Each returns an `HTMLElement`. No tagged-template helpers, no Web Components, no global synth registry. Synth is passed explicitly (page-cell owned, per ARCHITECTURE.md Pattern 4). Matches ARCHITECTURE.md Pattern 2 verbatim.

- **D-10:** **v1 widget set (4 widgets):**
  - `playInterval(interval, synth, opts?)` — ▶ button playing one interval against 1/1
  - `playScale(scale, synth, opts?)` — ▶ button arpeggiating a full scale
  - `scaleTable(scale, baseHz, opts?)` — renders the 4-column scale table; SAME component the dashboard uses (see D-11)
  - `ratioPill(interval, opts?)` — tiny inline display of ratio + cents, no audio (e.g., "⁸¹⁄₈₀ (~21.5¢)")

- **D-11:** **Dashboard reuses the `scaleTable` widget** — no separate dashboard-specific table component. Proves the widget pattern is generally usable. Audio panel is separate (per D-07), so no per-row audio buttons are needed inside the table.

### Scale Text-Input Syntax

- **D-12:** **Scala-body format: one pitch per line.** Each line is a ratio (`5/4`), cents (`408.0` — `.` triggers cents detection), or monzo (`[-2 0 1>` per D-15). `!` lines are comments and are ignored by the parser. **The dashboard text input and `.scl` import share the SAME parser** — paste a `.scl` body directly. DRY, domain-familiar.

- **D-13:** **Auto-prepend `1/1`:** the kernel prepends the unison; the user types only the non-unison pitches. Matches Scala convention. Reduces "why is my scale wrong" surprises. The serializer (`writeScl`) does not emit the unison line either.

- **D-14:** **Last line IS the period.** No separate period field. Octave scales end with `2/1`; tritave (Bohlen-Pierce) scales end with `3/1`; etc. Matches Scala convention directly. `Scale` constructor reads the last `Interval` as the period.

- **D-15:** **Monzo input notation: bra-ket `[-2 0 1>`** (xen-wiki canonical). Components space-separated inside `[ ... >`. Familiar to xen-literate readers; matches what we'd display in any future monzo column.

### Claude's Discretion

These were not explicitly discussed; sensible defaults. Plan-phase should flag if any need to change.

- **D-16:** **ADSR envelope defaults:** short attack (~5 ms), short decay (~30 ms), 0.7 sustain, ~150 ms release. Tunable via synth opts. Goal: no clicks/pops, no ringing tail (AUDIO-02).
- **D-17:** **Polyphony cap = 16 voices**, FIFO eviction. Tracked via voice IDs in the synth wrapper (AUDIO-05).
- **D-18:** **Default note duration for one-shot intervals = 1.5 sec.** Arpeggio step = 0.45 sec per note with 0.95× note length. Tunable.
- **D-19:** **Cents detection rule** in the text-input parser: a token containing `.` is cents; otherwise ratio (or monzo if it starts with `[`). Matches Scala spec. Edge case: bare integers like `2` are treated as ratios (`2/1`), matching Scala.
- **D-20:** **`.scl` golden-test corpus:** start with ~10–15 representative samples from the Huygens-Fokker archive covering: simple JI scales, large-numerator JI, cents-only scales, mixed ratio+cents, comment edge cases, non-octave periods. Exact sample list curated during planning.
- **D-21:** **Named-commas table (MATH-06):** seed with ~15–25 well-known commas (syntonic 81/80, Pythagorean 531441/524288, septimal 64/63, schisma 32805/32768, diaschisma 2048/2025, etc.). Hand-curated TS constant in `src/lib/commas.ts` (NOT a build-time data loader yet — that's overkill for this size; promote to a loader if/when the table grows past ~100 entries).
- **D-22:** **`.scl` filename for download:** `scale-{N}-tone-{date}.scl` if untitled, or user-editable filename input with the `.scl` extension auto-applied.
- **D-23:** **KaTeX wiring:** add KaTeX CSS via `observablehq.config.ts` `head:` injection per Framework convention. Math in prose uses `$...$` / `$$...$$` syntax.
- **D-24:** **`Interval` immutability:** `mul`, `div`, `inv`, `octaveReduce` all return new `Interval` instances (immutable). `Scale` likewise immutable (rotation/reduction return new `Scale`s).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level guidance
- `CLAUDE.md` — Tech stack section is the source of truth for package picks, version compatibility, "What NOT to use" list, and Observable Framework conventions. Especially:
  - "Recommended Stack" table — pin versions and roles
  - "Version Compatibility" table — `temperaments` peer-dep mismatch (still deferred for Phase 2)
  - "Observable Framework Conventions" — `.ts` imports as `.js`, data loader pattern, no top-level `AudioContext`
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope list. **Will need an update at phase-transition** to reflect D-01's shift away from piece-specific anchoring.
- `.planning/REQUIREMENTS.md` — MATH-01..06, SCALE-01..05, IO-01/02/04/05, AUDIO-01..05, NOTES-01..05, COMP-01..03 are this phase's requirement set. **COMP-01/02/03 wording will need an update at phase-transition** per D-01.
- `.planning/ROADMAP.md` — Phase 2 success criteria (5 items) are the verification target. Note: criterion 1 references "the piece's scale" — also gets reinterpreted via D-01 (the **seed scale** plays this role).

### Phase 1 carry-forward
- `.planning/phases/01-bootstrap-build/01-CONTEXT.md` — Phase 1 implementation decisions D-01..D-21 are still in force (deployment, repo layout, CI gates, package pinning, INVENTORY.md discipline).
- `src/lib/INVENTORY.md` — wrap-don't-reimplement discipline; every new kernel primitive in Phase 2 must list its source (custom vs. delegate to `xen-dev-utils`/`sonic-weave`/`fraction.js`).

### Architecture & research (Phase 1 outputs — load when planning)
- `.planning/research/ARCHITECTURE.md` — three-layer architecture, Patterns 1–6 (Interval as currency, Components as factories, Cell-scoped state, Audio as cell-owned singleton, Build-time loaders, Composition-as-Module). **Pattern 6 ("Composition-as-Module") is descoped per D-01** but Patterns 1–5 are all in force.
- `.planning/research/PITFALLS.md` — floating-point cents leakage, AudioContext lifecycle, polyphony explosion, `.scl` parser edge cases, monzo length-mismatch, cents-vs-ratio detection. Read every pitfall before writing the relevant module.
- `.planning/research/STACK.md` — verified package roles and versions (`xen-dev-utils@0.13.1`, `sw-synth@0.4.0`, `sonic-weave@0.14.1`, `fraction.js@5.3.4`).
- `.planning/research/FEATURES.md` — feature → package mapping; v1 vs v1.x vs v2 ordering.
- `.planning/research/SUMMARY.md` — overview; "Gaps to Address" section called out the composition-pitch-material question (now resolved by D-01).

### External (read on demand during planning)
- Huygens-Fokker `.scl` format spec: https://www.huygens-fokker.org/scala/scl_format.html — canonical reference for `.scl` parser edge cases (comment lines, pitch count, `.` detection, implicit `1/1`)
- Observable Framework JavaScript docs: https://observablehq.com/framework/javascript — `.js` import extension, TS transpilation, no type-check
- Observable Framework Reactivity docs: https://observablehq.com/framework/reactivity — `invalidation` promise, top-level cell ordering, `Mutable`
- Observable Framework Imports docs: https://observablehq.com/framework/imports — `npm:` protocol, self-hosted bundling
- `xen-dev-utils` npm: https://www.npmjs.com/package/xen-dev-utils — `Fraction` re-export, monzo helpers, prime utilities
- `sw-synth` npm: https://www.npmjs.com/package/sw-synth — voice classes (`Synth`, `UnisonSynth`, `AperiodicSynth`, `BufferSynth`), Hz-based note API
- `fraction.js` v5 README: https://github.com/rawify/Fraction.js — confirm BigInt numerator/denominator API
- KaTeX docs: https://katex.org/docs/browser.html — head-injection install pattern (CSS only; auto-render optional)
- Web Audio AudioContext (MDN): https://developer.mozilla.org/en-US/docs/Web/API/AudioContext — user-gesture requirement, suspended state, lifecycle

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1)
- `src/lib/example.ts` — placeholder kernel module from Phase 1 (BOOT-03 stub). Phase 2 deletes or replaces it; only existed to give Vitest a target.
- `src/lib/INVENTORY.md` — already seeded with the `Fraction → fraction.js@5.3.4` entry. Every Phase 2 kernel addition appends a row.
- `src/index.md` — currently the "Phase 1 hello" page demoing `81/79` cents. Phase 2 **replaces** this entirely with the dashboard (per D-03). Keep the `81/79` example as a snippet for the syntonic-comma page if useful.
- `package.json` 9-script set (D-13 from Phase 1) — `dev`, `build`, `test`, `lint:types`, `lint`, `format`, `format:check`, `ci` are the entry points; no new scripts needed for Phase 2 unless data loaders demand one.
- `tsconfig.json` strict settings (D-16 from Phase 1) — all Phase 2 kernel code lands under these strict flags from day one. Plan for `noUncheckedIndexedAccess` (monzo array access requires guards).
- `.github/workflows/deploy.yml` (Phase 1 D-02/D-03) — gates already wired: `lint:types`, `test`, `lint`, `format:check`, build → deploy. New Vitest tests + COMP-03 CI test plug into the existing `test` step.

### Established Patterns (locked from Phase 1 + ARCHITECTURE.md)
- **Three-layer architecture**: `src/lib/` (pure, no DOM/audio) → `src/components/` (DOM factories) → `src/audio/` (lifecycle) → `src/*.md` / `src/pages/*.md` (Markdown + reactive cells). One-way imports: pages import from lib/components/audio; lib never imports from anywhere browser-specific.
- **`Interval` as universal currency** (ARCHITECTURE.md Pattern 1): every cross-module data exchange uses `Interval` (or `Scale`-of-`Interval`s), never raw `Fraction` / monzo array / cents number.
- **Components as pure factories** (Pattern 2): `(data, opts?) => HTMLElement`. No singletons, no internal state stores. Locked by D-09.
- **Cell-owned synth + `invalidation`** (Pattern 4): one `synth` per page, owned by a dedicated cell, `invalidation.then(() => synth.dispose())`. Never top-level `new AudioContext()`.
- **Wrap-don't-reimplement**: before writing any math primitive, grep `xen-dev-utils` first; record the source in `INVENTORY.md` (Phase 1 D-08).
- **Imports use `.js` extension** even for `.ts` source — Framework runtime convention.
- **TS strict from day 1**: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes` all on (Phase 1 D-16).
- **Co-located tests**: `src/lib/__tests__/` (Phase 1 D-07).

### Integration Points
- **Vitest ↔ kernel**: every primitive added to `src/lib/` gets a colocated test. `vitest.config.ts` already excludes Markdown and the Framework dist/.
- **Framework reactive runtime ↔ widget factories**: factories return `HTMLElement`; cells use `display(elem)` or inline `${factory(...)}` to mount. `invalidation` is the cleanup hook.
- **`sw-synth` ↔ `src/audio/synth.ts`**: `sw-synth`'s `Synth` class wraps oscillators; our `createSynth()` factory wraps that with lazy `AudioContext`, voice tracking, master gain, and `dispose()`.
- **Dashboard ↔ kernel**: dashboard is a thin Markdown + cells wrapper around `parseScala` → `Scale` → `scaleTable` widget + `synth` audio + `writeScl` download. No dashboard-specific kernel logic.
- **CI test for dashboard seed scale (COMP-03 reinterpreted)**: a Vitest test asserts the seed scale (D-02) parses correctly through the shared parser and round-trips through `writeScl` → `parseScl` to an equal `Scale`. Catches kernel-vs-dashboard drift.

</code_context>

<specifics>
## Specific Ideas

- The Phase-1 hello page already proves `81/79` round-trips through `Fraction`; the syntonic-comma page (D-04) gets to use a similar example: `81/80` is a 21.5¢ comma, displayable inline as `${ratioPill(syntonic)}` and audible via `${playInterval(syntonic, synth)}`. Reuse the existing `81/79` example as a teaser link or footnote if you want continuity.
- The seed scale `1/1, 9/8, 5/4, 21/16, 3/2, 27/16, 7/4, 2/1` (D-02) is intentionally 7-limit so the syntonic-comma page can reference its `21/16` (which contains the prime 7) AND its `5/4` (where 81/80 lives between 81/64 and 5/4). The two pages talk to each other through the same seed scale.
- Audio panel selector (D-07) — when the dashboard scale changes, the selector's range updates reactively; default selection = the largest non-trivial interval (e.g., the 7/4 in the seed scale) so the first audition has clear character.
- For `.scl` filename (D-22), if the user has not entered a name, derive `scale-7-tone-2026-05-03.scl` style — readable, sortable, no hash gibberish.
- KaTeX (D-23): only ship the CSS in the head; auto-render is optional and adds a runtime cost. Prose uses standard `$inline$` / `$$display$$` markers that Framework's Markdown already supports if KaTeX is loaded.

</specifics>

<deferred>
## Deferred Ideas

- **Per-piece composition module(s)** — explicitly descoped from v1 (D-01). If/when a specific piece needs its own canonical pitch material, it becomes its own `src/lib/pieces/<piece>.ts` later; the kernel + dashboard already support arbitrary scales so the piece module would be a thin import.
- **Persistent scale state (URL hash / localStorage)** — deferred to Phase 4 (ANAL-04). The dashboard always boots from the seed scale; user-edited scales live in cell state only.
- **Custom Web Components** for inline widgets — descoped (D-09 picked plain factories). Revisit only if widgets proliferate to the point where the registration ceremony of Web Components beats explicit factory calls in prose.
- **`sonic-weave` DSL embedded** as in-cell scale syntax — v2 (TEMP-07). The Scala-body parser (D-12) is enough for v1.
- **Monzo / Hz columns in the default scale table** — deferred (D-06). Available via opts to the `scaleTable` widget if a specific page wants them; not in the dashboard default.
- **Inline ▶ buttons per scale-table row** — explicitly rejected in favor of the separate audio panel (D-07). Could reappear in a "compact" widget variant later if a theory page benefits.
- **Reference-pitch presets** (named C4 / A4 / piece-specific menu) — D-08 chose a single editable input default A4=440. A preset menu can land later if retuning becomes a frequent operation.
- **Build-time named-commas data loader** — deferred (D-21 chose a hand-curated TS constant). Promote to `src/data/named-commas.json.ts` only if the table grows past ~100 entries.
- **`.kbm`-related concerns** — explicitly Phase 3 (IO-03). The `.scl` work in Phase 2 should be designed cleanly so `.kbm` slots in alongside, but no `.kbm` types/parsers ship in Phase 2.
- **Mobile Safari audio audit** — explicitly Phase 3 (AUDIO-06). Phase 2 audio targets desktop browsers; mobile quirks deferred.

</deferred>

---

*Phase: 2-Math Kernel + Composition Anchor (MVP)*
*Context gathered: 2026-05-03*
