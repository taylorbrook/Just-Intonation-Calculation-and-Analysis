# Phase 8: Preview, Transforms & Advanced Generators - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the **"shape at a glance" preview**, the **cheap polish that applies to every generator**, and the **remaining advanced generators** — closing out the v1.1 Generate surface:

- **Circle-of-pitches visualization** (SURF-05) — a plain SVG ring (the `spiral-of-fifths.ts` / `keyboard.ts` precedent, no d3) placing each scale degree at its `cents / period.cents · 2π` angle, with rim labels, faint 12-EDO reference ticks, hover tooltip + highlight, and click-to-audition. Lives once in the shared preview area, fed by the active widget's `getScale()`. Safe empty-state for octave-only/empty scales.
- **Rotate-to-mode + transform strip** (SURF-04) — a Pattern-2 strip that non-destructively re-derives a transformed `Scale` from the active generator's current output via the existing `Scale.rotate/reduce/dedupe/transpose` methods, re-renders the shared preview (transformed table + circle), and feeds "Send to…". Mode select lists all N modes; reset button; strip clears on generator method switch.
- **Wilson recurrence / metallic (Mt. Meru)** (GEN-10, `meru.ts`) — exact-rational successive-ratio convergents as the scale, plus a tempered metallic-limit readout (e.g. φ ≈ 833.09¢) beside it. Presets for the metallic family + Wilson Meru seeds; seeds/coefficients/term-count editable.
- **Constant-structure** (GEN-10, via Phase-7's SonicWeave `csgs`/`gs` adapter) — generator chips + ordinal field, with a live CS-status readout. Errors surface in the status region while preserving the prior preview.

The tempered-vs-JI distinction (SURF-06, locked in Phase 6) is enforced uniformly across every family's output: the circle and table use ratios for exact JI and cents-only for tempered; the metallic limit is flagged tempered and is never a scale degree.

**In scope:** SURF-04, SURF-05, GEN-10.

**Explicitly NOT this phase:**
- Scala archive browser (LIB-01..03 → **Phase 9**).
- Any change to `Interval` / `Scale` kernel types (the strip uses existing `Scale` methods only), or any new npm dependency.
- New tempered-representation conventions — reuse the Phase-6 cents-only + badge path verbatim.

</domain>

<decisions>
## Implementation Decisions

### Circle-of-pitches viz (SURF-05)
- **D-01: Rim labels match the table convention.** Exact-JI scales show ratios (`5/4`); tempered scales show cents only — same exact-vs-tempered discipline as the Phase-6 table (06-CONTEXT D-01). The circle reinforces the "tempered" badge rather than inventing a new convention; never show float-derived ratios for tempered output.
- **D-02: Faint 12-EDO reference ticks** at every 100¢ around the rim — consistent with the project's cents-from-12tet display convention. Cheap to render. (For non-octave equaves the ticks still map by cents; planner may note their reduced meaning but the default shows them.)
- **D-03: One shared circle instance** in the page's shared preview host, fed by the active widget's `getScale()` — single mount point, applies uniformly to all families, pairs naturally with the transform strip which also operates on the active scale.
- **D-04: Hover tooltip + marker highlight** in addition to the required click-to-audition. Hovering enlarges/highlights the marker and shows full pitch info (ratio or cents + cents-from-12tet) — matches the `lattice.ts` hover idiom and keeps dense rims readable with short labels. Click → audition via the page-owned synth.

### Transform strip (SURF-04)
- **D-05: Non-destructive overlay.** Strip settings (mode N, reduce on/off, dedupe on/off, transpose ratio) re-derive the transformed scale from the generator's current output every render. Tweaking generator params keeps the transform settings applied to the new result; always re-derivable; easy reset. No baked-in mutation pipeline.
- **D-06: Transformed result shown in the shared preview.** The active widget's own table keeps showing the raw generator output; the shared preview area (strip + circle + a transformed table when transforms are active) shows the transformed scale that "Send to…" serializes. Clear raw-vs-transformed separation; the circle always reflects what would be exported. Do NOT mutate widgets' internal rendering from outside their factory (preserves Pattern-2 encapsulation).
- **D-07: Rotate-to-mode = native `<select>` listing all modes** (Mode 1 of N … Mode N of N), rebuilt when the scale changes — matches the project's native-select idiom, makes the mode count visible, no invalid states. Wired to `Scale.rotate`.
- **D-08: Reset button + clear on method switch.** A "Reset" control returns the strip to identity (mode 1, no reduce/dedupe/transpose); switching to a different generator method also resets the strip. Transforms are scoped to the scale being shaped — a mode/transpose rarely makes sense carried onto an unrelated scale.

### Wilson recurrence / metallic (GEN-10)
- **D-09: Exact convergents are the scale; the metallic limit is a readout.** The scale IS the exact-rational successive-ratio convergents (JI table with ratios). The metallic limit appears as an informational readout (e.g. φ ≈ 833.09¢, marked tempered) beside the table — never appended as a scale degree (keeps exact and tempered unmixed, honoring SURF-06).
- **D-10: Presets = metallic family + Wilson Meru seeds.** Golden (a=1,b=1), silver (a=2,b=1), bronze (a=3,b=1), plus Wilson's Mt. Meru seed variants — each sourced from a citable reference (Vallotti-precedent discipline from Phase 7). Preset fills fields; all fields stay editable.
- **D-11: Editable params = seeds (x₀, x₁) + coefficients (a, b) + term count,** with defense-in-depth caps (term count, magnitude) per the Phase-6 D-14 convention. Full recurrence surface so custom Wilson exploration is possible, not just preset selection.
- **D-12: Default landing = Fibonacci / golden** (a=1, b=1, seeds 1,1), ~7 convergents (2/1, 3/2, 5/3, 8/5, 13/8…) with the φ ≈ 833.09¢ limit readout — the canonical Mt. Meru case, matching the "land on a canonical working scale" precedent (Phase-7 D-13).

### Constant-structure (GEN-10, via Phase-7 adapter)
- **D-13: Generator chips + ordinal field** → SonicWeave `csgs(generators, ordinal)` through `scaleFromSonicWeave`. Reuse the Phase-6/7 chip-input idiom (ratios as chips); no SonicWeave syntax exposed in this form widget.
- **D-14: Live CS-status readout** — `✓ constant structure` / `✗ not CS (ambiguous at …)` on the result, mirroring the Fokker "→ N notes" pedagogical readout (Phase-7 D-12). Exposing the defining property is the point of the method, even though `csgs` targets CS by construction.
- **D-15: Default landing = Pythagorean-style CS diatonic** — `csgs([3/2], 7)`, a 7-note exact-rational scale the user already knows from Phase 7's rank-2 cross-check; demonstrates the CS ✓ badge on a recognizable scale.
- **D-16: SonicWeave errors → status region + preserve prior preview** (the Phase-7 D-15 free-text rule). Malformed/failing generator sets surface the adapter's error verbatim in the widget's status region; the last good preview stays intact. Consistent error idiom across every SonicWeave-backed widget.

### Claude's Discretion
- **D-17:** Circle-viz internals — exact marker/tick styling and tokens (match `05-UI-SPEC.md`, do not invent), tonic-marker emphasis, dense-scale label thinning (e.g. ≥ N degrees → drop or rotate labels), and tooltip layout. Empty-state copy mirrors `lattice.ts`.
- **D-18:** Whether the strip's transpose input is a `makeRatioField` n/d pair (blueprint suggests this) and how transposed/reduced tempered scales render (cents-source must be preserved through the transform — `Scale` methods already do this).
- **D-19:** `meru.ts` kernel signature and the exact preset roster beyond golden/silver/bronze (pick well-known Meru seed pairs with citable references); exact term-count and magnitude caps; whether convergents are octave-reduced or left as the literal recurrence ratios (default to a sensible musical reading, expose if cheap).
- **D-20:** The CS-status check implementation — whether it reuses an existing kernel utility or a small new helper (if new and kernel-layer, add an INVENTORY row); how "ambiguous at X" is phrased.
- **D-21:** Component decomposition (`circle-of-pitches.ts`, `scale-transform-strip.ts`, `generate-meru.ts`, `generate-cs.ts` per the blueprint Tranche-3 file layout) and where each registers in the picker `<optgroup>`s (Wilson/metallic + constant-structure → "Advanced").

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's scope & requirements
- `.planning/ROADMAP.md` §"Phase 8: Preview, Transforms & Advanced Generators" — goal, 4 success criteria, depends-on Phase 5 + ≥1 scale-producing tranche (CS sub-method depends on Phase 7's adapter).
- `.planning/REQUIREMENTS.md` — SURF-04, SURF-05, GEN-10 definitions and traceability.

### Milestone design inputs (LOCKED — the authoritative blueprint)
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-PLAN.md` — **TRANCHE 3 (≈lines 570–660) is this phase's blueprint**: Task 3.1 circle-of-pitches viz + test inventory (SVG ring, marker count == scale length, rim labels via `textContent`, click → `synth.playNote`, empty-state); Task 3.2 transform strip (`Scale.rotate/reduce/dedupe/transpose`, transforms compose + re-render, transformed scale is what Send-to serializes); Task 3.3 `meru.ts` (recurrence `x_n = a·x_{n-1} + b·x_{n-2}`, exact convergents + tempered metallic limit) + constant-structure via `csgs(...)`. Tempered-laundering & R-01 boundary rules in the Risk section.
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-RESEARCH.md` — A-4 #15 (Wilson recurrence/metallic: convergents exact, metallic limit cents-source), A-5 (transforms as cheap universal polish), circle-viz "shape at a glance" Leimma lesson, constant-structure via SonicWeave `csgs`/`gs`.
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-CONTEXT.md` — locked milestone decisions (four families + fifth SonicWeave optgroup, additive integration, single-tab live store).

### Prior phase contracts (carried forward — do not re-decide)
- `.planning/phases/07-sonicweave-adapter-tempered-lattice-free-text/07-CONTEXT.md` — D-15 free-text error rule (status region + preserve prior preview, reused by CS widget D-16); D-12 Fokker live-readout pedagogy (the CS-status-readout precedent D-14); `scaleFromSonicWeave` adapter contract + `iv.value.isFractional()` discriminator (07-RESEARCH Pitfall 1).
- `.planning/phases/06-exact-rational-ji-harmonic-generators/06-CONTEXT.md` — D-01/D-02 tempered = cents-only + badge (no ratio column); D-03 tempered flag at component layer, Send-to serializes cents-per-line; D-14 defense-in-depth caps validated before enumeration; D-09 first-render canonical-default precedent.
- `.planning/phases/05-generate-surface-live-integration-foundation/05-CONTEXT.md` + `05-UI-SPEC.md` + `05-PATTERNS.md` — preview host, params/preview hosts, visual tokens (do not invent), "Approach B" native `<select>`, Pattern-2 component factory `(synth, opts) => HTMLElement`.

### Project standards
- `CLAUDE.md` — Observable Framework conventions, R-01 rule (foreign Fraction → `${n}/${d}` → kernel BigInt; never let a Number-backed Fraction leak), page-owned synth (no AudioContext at module load).
- `src/lib/INVENTORY.md` — kernel symbol inventory; `meruScale` (and any new CS-check helper) get rows under the `## Quick 260608-dyv — scale generation` section. Component symbols (`circleOfPitches`, `scaleTransformStrip`, `generateMeru`, `generateCs`) listed for discoverability.
- `.planning/PROJECT.md` — three-layer purity, BigInt-exactness, anti-regression sensitivity (existing 192-test suite stays green; no kernel-type churn).

### Source-of-truth files to read before editing
- `src/pages/generate.md` — the shared preview host (`previewHost`), the picker `<optgroup>`s to extend ("Advanced"), and the existing per-widget `getScale()` / `isTempered()` contract the circle + strip consume.
- `src/lib/scale.ts` — `rotate`, `reduce`, `dedupe`, `transpose` (immutable, return new `Scale`; period-aware reduce per Pitfall #13) — the transform strip's entire kernel surface; no new methods needed.
- `src/lib/interval.ts` — BigInt `Interval`, `cents`, `octaveReduce(period)` for circle-angle math.
- `src/components/spiral-of-fifths.ts` — the SVG circle precedent (`createElementNS`, cents→angle, `textContent`-only labels, U+2212 minus, `String()` coercion on `setAttribute`) — the circle-of-pitches viz follows this idiom.
- `src/components/keyboard.ts` — second SVG-component precedent cited by the blueprint (~60 LOC plain SVG, no d3).
- `src/components/lattice.ts` — hover tooltip + highlight + empty-state idiom (D-04) to mirror.
- `src/components/scale-table.ts` — the tempered (cents-only + badge) vs exact-JI render path; the transformed preview table reuses it.
- `src/components/mos-builder.ts` (`makeRatioField`) — transpose ratio input (D-18) and the Pattern-2 factory + status-region precedent.
- `src/components/generate-cps.ts` / `generate-fokker.ts` — factor-set / basis chip-input idiom to reuse for the CS generator chips (D-13); preset-select shape for the Wilson/metallic presets (D-10).
- `src/lib/sonicweave.ts` (`scaleFromSonicWeave`, Phase 7) — the adapter the CS widget calls for `csgs`/`gs`; `{ scale, tempered, error? }` return shape.
- `src/state/scale-store.ts`, `src/lib/url.ts` — Send-to plumbing; the transform strip must feed the transformed `Scale` into this path (D-06).
- `node_modules/sonic-weave` (0.14.1) — verify `csgs` / `gs` prelude signatures empirically before wiring the CS widget.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`spiral-of-fifths.ts` / `keyboard.ts`** — plain `createElementNS` SVG components (~60 LOC), no d3. The circle-of-pitches viz is a sibling: cents→angle placement, `textContent` rim labels, strict-TS `String()` coercion, `noUncheckedIndexedAccess` guards.
- **`Scale.rotate/reduce/dedupe/transpose` (`scale.ts`)** — all immutable, already implemented and tested. The transform strip is pure orchestration over these; **no kernel change needed** (SURF-04 is "cheap polish" precisely because the methods exist).
- **`scale-table.ts`** — exact-JI (ratios) and tempered (cents-only + badge) render paths both exist; the transformed preview table and any new readouts reuse them verbatim.
- **`lattice.ts`** — hover tooltip + highlight + empty-state handling to mirror for the circle (D-04, empty-state).
- **`scaleFromSonicWeave` (`sonicweave.ts`, Phase 7)** — the CS widget's only kernel call (`csgs`/`gs`); tempered/rational discrimination + R-01 round-trip already solved at the adapter boundary.
- **Chip input (`generate-cps.ts` / `generate-fokker.ts`)** + **preset-select** — reuse for CS generator chips and Wilson/metallic presets.
- **`makeRatioField` (`mos-builder.ts`)** — transpose ratio input; Wilson seed/coefficient inputs.
- **`playScale`, `scale-store`, `url.ts`** — audition + Send-to plumbing complete; the strip just feeds the transformed `Scale` in.

### Established Patterns
- Pattern-2 component factory `(synth, opts) => HTMLElement`; `createElement`/`createElementNS` + `textContent` (never `innerHTML`); status region for errors; `replaceChildren` re-render.
- Tempered = cents source of truth, ratio column dropped + "tempered" badge (Phase-6 D-01/D-02); flag at the component layer, never on `Interval`/`Scale` (Phase-6 D-03). The metallic limit (D-09) follows this — cents-flagged, not a kernel ratio.
- Defense-in-depth caps validated BEFORE enumeration → RangeError (Phase-6 D-14); applies to Wilson term count (D-11).
- Adapter boundary R-01: foreign Fraction → `${n}/${d}` → kernel BigInt `Interval`; ESLint-enforced (CS widget inherits this via `scaleFromSonicWeave`).
- New kernel symbols → `INVENTORY.md` rows with Source + Reason.
- First render lands on a canonical working example (Phase-7 D-13) — D-12 (golden) and D-15 (Pythagorean CS) follow this.

### Integration Points
- New components: `src/components/circle-of-pitches.ts`, `scale-transform-strip.ts`, `generate-meru.ts`, `generate-cs.ts` (+ CSS + `__tests__`), all mounted into `src/pages/generate.md`.
- New kernel module `src/lib/meru.ts` (+ `__tests__/meru.test.ts`) — `meruScale` recurrence; INVENTORY row.
- Circle + strip mount **once** in the shared preview host (D-03/D-06), reading the active widget's `getScale()`/`isTempered()`; this is the first cross-widget shared-preview consumer (prior widgets each rendered self-contained tables) — confirm the `generate.md` cell wiring exposes the active scale reactively.
- Picker: Wilson/metallic + constant-structure register under the existing **"Advanced"** `<optgroup>`; append-only edit to `generate.md` (sequence against any other `generate.md` edits per the blueprint's append-only rule).
- CS widget's `csgs` path depends on Phase 7's `scaleFromSonicWeave` (now complete — no gating needed).

</code_context>

<specifics>
## Specific Ideas

- **The circle is "shape at a glance"** (the Leimma lesson, RESEARCH) — degree markers at their true cents angle with faint 12-EDO ticks let the user *see* a scale's symmetry/evenness before reading a single number. It's a pedagogical surface, not chrome.
- **Transforms are universal cheap polish** — the same strip works on every generator's output (JI and tempered alike), reinforcing rather than masking the tempered label (Success Criterion 4). Non-destructive so experimentation is free.
- **Exact stays exact, tempered stays flagged** — the metallic limit is shown beside the convergent scale as a tempered readout, never folded into the exact-rational scale. CS scales built from rational generators stay exact; only genuinely tempered SonicWeave output carries cents + badge.
- **Verified anchors for TDD** (from RESEARCH/blueprint): Fibonacci convergents 2/1, 3/2, 5/3, 8/5, 13/8 (exact) with φ ≈ 833.09¢ limit (tempered cents); `csgs([3/2], 7)` → 7-note Pythagorean diatonic (exact, CS ✓); circle marker count == scale length; rotating a previewed scale changes the transformed table and the Send-to payload.

</specifics>

<deferred>
## Deferred Ideas

- **Scala archive browser** (LIB-01..03) — Phase 9.
- **Toggleable 12-EDO grid on the circle** — D-02 ships the ticks on by default; a show/hide toggle is a v2 refinement if they prove distracting for non-octave scales.
- **Metallic-limit-stack scale mode** (a tempered scale built by stacking the limit interval) — D-09 ships the exact convergents + limit readout; the stacked-limit variant is a possible future sub-mode.
- **CS-presets roster** (named canonical constant-structure scales) — D-13 ships chips + ordinal only; curating citable CS presets is deferred (niche, modest payoff).
- **"Show the SonicWeave code behind this widget"** (Scale Workshop template-inserter) — carried over from Phase 7's deferred list; still a nice v2 bridge for the CS widget, not this phase.

### Reviewed Todos (not folded)
None — no pending todos matched this phase (`todo.match-phase 8` returned 0).

</deferred>

---

*Phase: 08-preview-transforms-advanced-generators*
*Context gathered: 2026-06-12*
