# Phase 5: Generate Surface & Live Integration Foundation - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning
**Source:** Synthesized from the locked milestone design docs (`260608-dyv-*`), the approved `05-UI-SPEC.md`, ROADMAP success criteria, and `05-RESEARCH.md` (discuss-phase intentionally skipped — the user chose to plan directly against the existing research + locked v1.0 design system).

<domain>
## Phase Boundary

Deliver the **foundation** of the Generate surface, not the generator library:

1. A new synth-owning page `/pages/generate` in the site nav (between Analysis and Theory notes), with a **family-grouped method picker**, a **per-method parameter-panel host** that swaps on method change, a **live preview table**, and **audition** (play) controls.
2. A pure, **additive `scale-store`** (localStorage + `CustomEvent`, mirroring `theme-prefs`) plus **"Send to Dashboard" / "Send to Analysis"** actions that push a generated scale live into the existing Dashboard (`/`) and Analysis (`/pages/analysis`) pages, persisting across reload via the store and the existing `#s=` hash.
3. A **one-way data-flow guarantee** and an **empty-store boot-equivalence regression test** (R1) proving the v1.0 pages boot byte-identically when nothing has been sent.

**In scope:** SURF-01, SURF-02, SURF-03 (as *mechanisms*), SYNC-01, SYNC-02, SYNC-03, SYNC-04.

**Explicitly NOT this phase** (later phases fill the hosts this phase builds): the real generator methods/params (GEN-01..10 → Phases 6–9), tempered-vs-JI badge (SURF-06 → Phase 6), rotate-to-mode + reduce/dedupe/transpose strip (SURF-04 → Phase 8), circle-of-pitches viz (SURF-05 → Phase 8), Scala archive browser (LIB-01..03 → Phase 9).
</domain>

<decisions>
## Implementation Decisions

### Surface & page shell (SURF-01)
- **D-01:** New page at `src/pages/generate.md`, nav label **"Generate"**, registered in `observablehq.config.ts` `pages` **between "Analysis" and "Theory notes"** (ROADMAP SC1). Must read as a sibling of `analysis.md`.
- **D-02:** Page owns its synth (Pattern 4 / Pitfall #2): exactly one `createSynth()` cell with `invalidation.then(synth.dispose)`. No top-level `AudioContext`; audio wired to a user gesture.
- **D-03:** Top-to-bottom layout per the approved UI-SPEC: `h1` + intro → family-grouped method picker → param-panel host → preview `h2` → preview-table host → action row (Send to Dashboard / Send to Analysis). The **method picker is the page's primary focal point** on load.

### Method picker & param swap (SURF-02)
- **D-04:** Picker is a `<select>` with one `<optgroup>` per family — the four families locked in the milestone context: **Regular / Equal Temperament**, **JI Combinatorial**, **Harmonic & Interval Divisions**, **Advanced / Algorithmic**. The full method roster appears as options now; only the Phase-5 reference method is functional, the rest render a **"coming soon"** param placeholder (UI-SPEC copy).
- **D-05:** Selecting a method swaps the param-panel host via `replaceChildren` (mos-builder Pattern-2 factory precedent). State is closure-local; re-render is `replaceChildren`, never innerHTML; text via `createElement`+`textContent` (XSS discipline).
- **D-06 (scope reconciliation — important for the planner):** Phase 5 wires **exactly one real, exact-rational method end-to-end** as the reference implementation, so ROADMAP SC2 ("parameter panel swaps … live preview … audition as parameters change") is genuinely demonstrable — not faked with a static constant. The UI-SPEC "demo scale shown below" copy is that one method's default render; the "generator methods arrive next phase" copy applies to the **other** families. Recommended reference method: a **harmonic-segment generator** (`n : n+1 : … : 2n`) — exact `Fraction`s, a single integer param (segment size) that makes "preview updates as params change" trivially true, and reuses existing `scaleTable` + `playScale`. Exact method choice is discretion (D-13) provided it is exact-rational and has ≥1 live param.

### Live preview & audition (SURF-03)
- **D-07:** Preview renders through the existing `scaleTable` component (ratios + cents + cents-deviation-from-12tet — the locked notation surface; no staff engraving). Audition reuses `playScale` against the page-owned synth, including the inherited **Stop all audio (Esc)** control. Preview recomputes reactively as params change.

### Additive shared store (SYNC-01..04)
- **D-08:** New pure module **`src/state/scale-store.ts`** (new `src/state/` dir), mirroring `src/theme/theme-prefs.ts`: a namespaced `localStorage` key **`tuning-systems:scale`** that broadcasts a `CustomEvent` **`tuning-systems:scale-changed`**. No DOM, no kernel-DOM bleed; three-layer purity held.
- **D-09:** The store payload reuses the **existing `#s=` hash codec** in `src/lib/url.ts` (`encodeScaleToHash` / `decodeHashToScale`, version byte, **8 KB cap**) as the wire format — do not invent a second serialization. The 8 KB cap surfaces the UI-SPEC "Scale is too large to send (8 KB limit)…" error copy.
- **D-10:** **"Send to …" behavior:** writes the store **and navigates** to the target page carrying the `#s=` hash — locked to the existing "Analyze this scale →" precedent (`src/index.md:202-218`). *FLAG (carried from UI-SPEC, flip-able without touching other contracts): a "stay on Generate" variant is a documented, localized refinement; default is navigate.*
- **D-11 (one-way data flow — SC5):** Only "Send to …" writes the store. Dashboard and Analysis are **consumers only**: they read the store **once at boot** and subscribe to `tuning-systems:scale-changed`. **No write-back, no feedback loop** — consumer pages never write the store.
- **D-12 (additive guarantee — SYNC-04, the validation anchor):** Integration is **strictly additive**. Existing Dashboard/Analysis boot, hash-read-at-boot, debounced-hash-write, and textarea code paths stay **byte-identical when the store is empty**. This is proven by the **R1 empty-store boot-equivalence regression test**, which must go **RED → GREEN before any "Send to …" wiring exists** (strict TDD; the test is written first and gates all consumer-page edits). Existing pages opt **in** by listening for the event; absent a stored scale, their current seed/hash behavior is unchanged.

### Claude's Discretion
- **D-13:** Exact reference-method choice (subject to D-06 constraints), the demo scale's default params, and component decomposition (one `generate.md` host + a method-host factory vs. inline reactive cells) — follow the `mos-builder.ts` Pattern-2 precedent.
- The precise consumer-page subscription wiring, as long as D-11/D-12 hold and the R1 test stays green.
</decisions>

<specifics>
## Specific Ideas / Reuse Anchors

- **Transport backbone (reuse verbatim):** `src/lib/url.ts` — `encodeScaleToHash`/`decodeHashToScale`, version byte, 8 KB cap. The Dashboard already cross-passes scales via `#s=` ("Analyze this scale →", `src/index.md:202-218`); "Send to …" is the same move generalized.
- **Shared-state precedent to mirror:** `src/theme/theme-prefs.ts` + `src/components/theme-head.ts` — namespaced `localStorage` + `CustomEvent` broadcast. `scale-store.ts` copies this shape exactly.
- **Component template:** `src/components/mos-builder.ts` — Pattern-2 factory `(synth, opts) => HTMLElement`, closure-local state, `createElement`+`textContent` XSS discipline, status region, `replaceChildren` re-render, renders via `scaleTable` + `playScale`. New method widgets mirror this.
- **Closest page analog:** `src/pages/analysis.md` — the existing interactive-builder page; `generate.md` should feel like its sibling (same tokens, same idioms).
- **Kernel currency:** BigInt `Fraction` (`fraction.js@5.3.4`) is the source of truth (R-01 ESLint rule blocks Number-backed `Fraction`); derive cents only at the display boundary (Pitfall #1); no prime-limit ceiling.
- **Design contract:** all spacing/type/color/copy decisions are locked in `05-UI-SPEC.md` (approved, 6/6 dimensions) — match it; do not invent tokens.
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 5 contracts (this directory)
- `.planning/phases/05-generate-surface-live-integration-foundation/05-UI-SPEC.md` — approved visual/interaction contract (layout, picker, param swap, preview, Send-to copy, tokens). LOCKED.
- `.planning/phases/05-generate-surface-live-integration-foundation/05-RESEARCH.md` — Phase 5 technical research incl. the Validation Architecture section feeding R1.
- `.planning/phases/05-generate-surface-live-integration-foundation/05-VALIDATION.md` — per-phase validation/sampling contract (filled during planning).

### Milestone design inputs
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-CONTEXT.md` — locked milestone decisions (surface, four families, additive integration).
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-RESEARCH.md` — 63 KB method/UI/integration research (Send-to precedent, one-way flow, OQ-3 fork).
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-PLAN.md` — milestone wave plan (sequencing of Phases 5–9).

### Project standards
- `CLAUDE.md` — stack + Observable Framework conventions (import `.ts` as `.js`, reactive cells, page-owned synth, no top-level AudioContext, R-01 rule).
- `.planning/PROJECT.md` — v1.0 shipped scope, three-layer purity, BigInt-exactness, parked TEMP items this milestone unlocks.
- `.planning/REQUIREMENTS.md` — SURF-01/02/03, SYNC-01/02/03/04 definitions and traceability.
- `src/lib/INVENTORY.md` — kernel symbol inventory + three-layer purity discipline.

### Source-of-truth files to read before editing
- `src/lib/url.ts` — `#s=` hash codec (reuse as store wire format).
- `src/theme/theme-prefs.ts` — store pattern to mirror.
- `src/components/mos-builder.ts` — Pattern-2 factory template for method widgets.
- `src/index.md` (`:202-218`) — existing "Analyze this scale →" Send precedent; a consumer page.
- `src/pages/analysis.md` — sibling builder page; a consumer page.
- `observablehq.config.ts` — nav/pages registration.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scaleTable` + `playScale` — preview + audition; no new preview UI needed.
- `src/lib/url.ts` codec — store serialization + deep-link transport.
- `theme-prefs.ts` / `theme-head.ts` — exact template for `scale-store.ts`.
- `createSynth()` lifecycle wrapper — page-owned synth.

### Established Patterns
- Pattern-2 component factory `(synth, opts) => HTMLElement` (mos-builder).
- Pattern-4 cell-owned synth with `invalidation.then(dispose)`.
- `replaceChildren` + `createElement`/`textContent` re-render & XSS discipline.
- localStorage-namespaced-key + `CustomEvent` broadcast for shared state.

### Integration Points
- New `src/pages/generate.md` (page) + new `src/state/scale-store.ts` (module).
- Additive listeners on `src/index.md` and `src/pages/analysis.md` (consumers) — gated by the R1 byte-identical-when-empty test.
- `observablehq.config.ts` nav insertion.
</code_context>

<deferred>
## Deferred Ideas

Belong to later v1.1 phases — out of scope for Phase 5 (this phase only builds the hosts they fill):

- Real generator methods + their params (CPS, harmonic/subharmonic/ADO/isoharmonic, diamond/odd-limit/Farey, EDO/ED-n, rank-2, well-temperament, Fokker, SonicWeave, Wilson/metallic, constant-structure) — GEN-01..10, **Phases 6–9**.
- Tempered-vs-JI visual distinction + "tempered" label — SURF-06, **Phase 6**.
- Rotate-to-mode + reduce / dedupe / transpose strip — SURF-04, **Phase 8**.
- Circle-of-pitches visualization — SURF-05, **Phase 8**.
- Scala archive browse / search / load — LIB-01..03, **Phase 9**.
- "Stay on Generate" Send-to variant (D-10 FLAG) — optional later refinement.
- Cross-tab live sync via native `storage` event — explicitly out of scope for v1.1 (single-tab `CustomEvent` suffices).
</deferred>

---

*Phase: 05-generate-surface-live-integration-foundation*
*Context gathered: 2026-06-08 (synthesized from locked milestone docs + approved UI-SPEC; discuss-phase skipped by user choice)*
