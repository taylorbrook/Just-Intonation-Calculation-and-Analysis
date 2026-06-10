# Phase 6: Exact-Rational JI & Harmonic Generators - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the **exact-rational JI core** plus the **first tempered family**, each surfaced as a method widget in the picker host that Phase 5 built:

- **JI combinatorial** — CPS (Hexany / Dekany / Eikosany presets, choose-k over a factor set), tonality-diamond scale, odd-limit set, prime-limit set, Farey / Stern-Brocot subset. All BigInt-exact, deduped by `n/d` (never cents tolerance).
- **Harmonic & interval divisions** — harmonic segment, subharmonic segment, ADO (arithmetic/AFDO), isoharmonic chord. All exact integer-derived ratios.
- **Regular / equal temperament (first tempered family)** — EDO and equal-division-of-any-interval (ED-n), establishing the "tempered, not laundered JI" representation (SURF-06).
- Every generated scale auditions through the page-owned synth and serializes for "Send to Dashboard / Analysis" (tempered scales serialize as cents-per-line text).

**In scope:** GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, SURF-06.

**Explicitly NOT this phase:**
- SonicWeave adapter — rank-2, well-temperament, Fokker, free-text (GEN-06..09 → **Phase 7**).
- Wilson/metallic, constant-structure (GEN-10 → **Phase 8**).
- Circle-of-pitches viz (SURF-05) and the rotate-to-mode + reduce/dedupe/transpose strip (SURF-04) → **Phase 8**. (One local exception: the harmonic-family "reduce to octave" toggle, D-04, ships here as a per-method param — not the general transform strip.)
- Scala archive browser (LIB-01..03 → **Phase 9**).
- Any change to `Interval` / `Scale` kernel types, or any new npm dependency.

</domain>

<decisions>
## Implementation Decisions

### Tempered-scale presentation (SURF-06)
- **D-01:** Tempered scales (EDO, ED-n, and the JI-in-EDO sub-mode) render **cents + cents-deviation-from-12tet only — the ratio column is dropped entirely** for these scales. No float-derived fraction is ever shown. This is stricter than the milestone PLAN's "suppressed-or-`≈`" wording (PLAN line 466) and OQ-3's "badge" recommendation — the user chose **no ratio column at all** for tempered output.
- **D-02:** Tempered tables carry a visible **"tempered" badge** so the distinction from exact JI is unmistakable at a glance.
- **D-03:** The tempered flag stays at the **component layer** — do NOT add a `tempered` field to `Interval`/`Scale` (locked at milestone level, PLAN lines 113–126, to avoid destabilizing the kernel the Dashboard depends on). "Send to…" serializes tempered scales as **cents-per-line text** (e.g. `100.0`), which `parseScala` already detects via the `.`; the kernel builder constructs tempered pitches from cents via `centsToRatio` (cents is the source of truth — Pitfall #1).

### Octave-reduction behavior (harmonic family)
- **D-04:** Harmonic segment, subharmonic segment, and isoharmonic chord default to the **literal overtone form (unreduced)** — the ratios as they literally sound, which may span more than an octave (e.g. `4:5:6:7`). Each exposes a **"reduce to octave" toggle** to fold into `[1/1, 2/1)` on demand. This is a per-method param shipped in this phase — distinct from the general Phase-8 transform strip. (Resolves the PLAN's open "expose a `reduce` flag, default the literal overtone form" note, line 398.)
- ADO is intrinsically within one equave by construction; the toggle applies to the segment/isoharmonic sub-methods where the span can exceed an octave.

### EDO / ED-n scope (GEN-05)
- **D-05:** The Regular-family widget ships **pure equal-step divisions** (EDO of the octave, ED-n of an arbitrary equave) **plus a "best-JI-in-EDO" sub-mode** that reuses the existing kernel `bestJiInEdo` (`src/lib/edo.ts:138`) to show the EDO's best JI approximations. Both modes are tempered output and follow D-01/D-02 (cents-primary, no ratio column, "tempered" badge). Accepted overlap with the `/analysis` page's EDO mapping — the user wants it reachable from the Generate surface too.
- **D-06:** **ED-n exposes an editable equave** (a ratio `n/d` field — reuse `mosBuilder.makeRatioField`), because equal-division-of-a-non-octave is its entire purpose (e.g. ED3 tritave). EDO is the 2/1 special case.

### Equave / period exposure (JI families)
- **D-07:** The JI-family widgets (CPS, diamond, odd-limit, prime-limit, Farey) **fix the equave/period at 2/1 (octave)** — no equave input on these widgets this phase. The kernel builders still take a `period` param (so the capability exists), but the UI does not surface it. Non-octave equaves for JI families are deferred to the Phase-8 transform strip, where they can be applied uniformly across all families. **Only ED-n** (D-06) exposes an editable equave.

### Picker integration & first-render defaults
- **D-08:** **Keep the Phase-5 `harmonic-segment` reference method as the page's default landing method.** It becomes the **default sub-method of the full Harmonic widget** (which adds subharmonic / ADO / isoharmonic around it). This preserves Phase-5 boot behavior byte-for-byte on first load — consistent with the project's anti-regression sensitivity — while the real generator roster fills in. CPS is reachable via the picker but is NOT the opener.
- **D-09:** First-render showcase defaults (the **common / pedagogical** set):
  - EDO → **12** · ED-n → **13-ED3** (Bohlen-Pierce tritave)
  - CPS → **1-3-5-7 Hexany** (2-of-4) · Dekany → **2-of-5 {1,3,5,7,9}** · Eikosany → **3-of-6 {1,3,5,7,9,11}**
  - Harmonic segment → **8..16** · ADO → **6** · isoharmonic → a sensible small chord (discretion within D-09 spirit)
  - Odd-limit → **9** · Prime-limit → **5** · Farey → **order 8**
- **D-10:** The picker keeps the existing **four `<optgroup>` families** (Regular · JI combinatorial · Harmonic & interval divisions · Advanced) built as a native `<select>` per the Phase-5 `PATTERNS.md` "Approach B" (Observable `Inputs.select` does not emit real `<optgroup>`s). The "SonicWeave" fifth family and the "Advanced" family fill in Phases 7–8 — this phase populates Regular (EDO/ED-n), JI combinatorial (CPS + diamond/odd/prime/Farey), and Harmonic.

### Claude's Discretion
- **D-11:** Component decomposition — one factory per family vs per sub-method (follow `mos-builder.ts` Pattern-2 precedent and the milestone PLAN's Tranche-1 file layout: `cps.ts`, `harmonic.ts`, `generators.ts` kernel modules; `generate-cps.ts`, `generate-harmonic.ts`, `generate-ji-set.ts`, `generate-ed.ts` components).
- **D-12:** Whether CPS is hand-rolled over `xen-dev-utils.kCombinations` (milestone recommendation OQ-4, for transparent BigInt ownership) or wraps `SW cps` — either is acceptable; hand-roll is preferred.
- **D-13:** The new **factor-set chip input** UX for CPS (add/remove integer chips) — the one genuinely new input idiom; `createElement` + `textContent` XSS discipline.
- **D-14:** Isoharmonic param shape (start / diff / count), defense-in-depth caps (factor count, k bounds, odd/prime-limit ≤ 31, Farey order cap, EDO/ED-n divisions cap ~1000 mirroring `analysis.md` and `enumerateDiamond`), and exact default values within each method's natural range.
- **D-15:** Exact "tempered" badge styling and the cents-only table variant — match the locked `05-UI-SPEC.md` tokens; do not invent new tokens.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's scope & requirements
- `.planning/ROADMAP.md` §"Phase 6: Exact-Rational JI & Harmonic Generators" — goal, 5 success criteria, depends-on Phase 5.
- `.planning/REQUIREMENTS.md` — GEN-01..05 + SURF-06 definitions and traceability.

### Milestone design inputs (LOCKED — the authoritative method/UI/integration design)
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-RESEARCH.md` — 596-line method/UI/integration research. Half A (master method table A-0; A-2 JI combinatorial; A-3 harmonic divisions; A-1 EDO/ED-n), Half B (UI idioms, param-input table B-2), exactness rules, OQ-3/OQ-4. Verified vectors: CPS 1-3-5-7 Hexany, AFDO-6, harmonic 8..16.
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-PLAN.md` — wave plan. **TRANCHE 1 (lines 314–475) is this phase's blueprint** (Task 1.1 CPS · 1.2 CPS widget · 1.3 harmonic.ts · 1.4 harmonic widget · 1.5 generators.ts diamond/odd/prime/Farey/edScale · 1.6 JI-set + EDO widgets). Tempered-scale representation decision: lines 113–126.
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-CONTEXT.md` — locked milestone decisions (four families, additive integration).

### Phase 5 contracts (the surface this phase fills)
- `.planning/phases/05-generate-surface-live-integration-foundation/05-CONTEXT.md` — picker/preview/store decisions D-01..D-13; reuse anchors.
- `.planning/phases/05-generate-surface-live-integration-foundation/05-UI-SPEC.md` — approved visual/interaction contract (tokens, picker, param swap, preview). Match it; do not invent tokens.
- `.planning/phases/05-generate-surface-live-integration-foundation/05-PATTERNS.md` — "Approach B" native `<select>` with real `<optgroup>`s (why `Inputs.select` was not used).

### Project standards
- `CLAUDE.md` — stack + Observable Framework conventions (import `.ts` as `.js`, reactive cells, page-owned synth / no top-level AudioContext, R-01 rule blocking Number-backed `Fraction`).
- `.planning/PROJECT.md` — three-layer purity, BigInt-exactness, carried constraints.
- `src/lib/INVENTORY.md` — kernel symbol inventory + three-layer purity discipline. Every new kernel symbol gets a row here.

### Source-of-truth files to read before editing
- `src/pages/generate.md` — the page to extend; current `harmonic-segment` reference method (`buildHarmonicSegmentText`), native `<select>` picker, params/preview hosts, page synth + Stop button.
- `src/components/mos-builder.ts` (+ `mos-builder.css`, `__tests__/mos-builder.test.ts`) — Pattern-2 factory template; `makeRatioField` idiom for ED-n equave; status region; `replaceChildren` re-render.
- `src/components/scale-table.ts` (+ `.css`) — preview table to extend with the tempered (cents-only, no-ratio) variant + badge.
- `src/lib/diamond.ts` (`enumerateDiamond`, `DiamondCell`, `:65`) — reuse for `diamondScale`.
- `src/lib/edo.ts` (`bestJiInEdo` `:138`, `oddLimitApproximation` `:177`) — reuse for EDO best-JI sub-mode and tempered metrics.
- `src/lib/monzo.ts` (`oddLimit` `:56`, `centsToRatio`) — odd-limit set enumeration; tempered cents→Hz projection.
- `src/lib/interval.ts`, `src/lib/scale.ts` — `octaveReduce(period)`, `dedupe`, exact `n/d` keys; the kernel currency (do NOT add a `tempered` field).
- `src/components/play-scale.ts` — `playScale` audition (reuse verbatim).
- `src/lib/url.ts` — `encodeScaleToHash` / `MAX_SCALE_TEXT_BYTES` (Send-to wire format, caps).
- `src/state/scale-store.ts` — `writeSharedScale`, `resolveInitialScaleText` (Send-to mechanism from Phase 5).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`enumerateDiamond` (`diamond.ts`)** — `diamondScale(oddLimit)` takes its unique octave-reduced `cell.ratio` values; do not re-derive the diamond.
- **`bestJiInEdo` (`edo.ts:138`)** — backs the EDO "best-JI-in-EDO" sub-mode (D-05).
- **`oddLimit` (`monzo.ts:56`)** — the ceiling test for the odd-limit set enumeration.
- **`mos-builder.ts`** — Pattern-2 factory shape, `makeRatioField` (reused for ED-n equave), status region, `replaceChildren`.
- **`scale-table.ts` + `play-scale.ts`** — preview + audition; only the tempered cents-only/badge variant is new.
- **`generate.md` + `scale-store.ts`** — picker host, params/preview hosts, Send-to plumbing already in place from Phase 5.

### Established Patterns
- Kernel primitive pattern (`buildMos`/`enumerateDiamond`): pure `(...params) => Scale`; dedupe via `Set` keyed on `${n}/${d}` (NEVER cents tolerance — Pitfall #1/#6); `octaveReduce(period)`; append period (D-14 from v1); defense-in-depth combinatorial caps.
- Pattern-2 component factory `(synth, opts) => HTMLElement`; `createElement` + `textContent` (never `innerHTML`).
- Tempered pitches computed in cents, projected to Hz at the audio boundary (the `meantone.md` precedent); ratio column omitted for tempered (D-01).
- New kernel symbols listed in `INVENTORY.md` with Source + Reason.

### Integration Points
- New kernel modules `src/lib/cps.ts`, `src/lib/harmonic.ts`, `src/lib/generators.ts` (diamond/odd/prime/Farey + `edScale`) + their `__tests__`.
- New components `src/components/generate-cps.ts`, `generate-harmonic.ts`, `generate-ji-set.ts`, `generate-ed.ts` + `__tests__`, mounted via the `generate.md` picker `<optgroup>`s.
- `scale-table.ts` (or the generate widgets) gains a tempered/cents-only rendering path + "tempered" badge.
- All "Send to…" wiring already exists; tempered serialization uses cents-per-line text.

</code_context>

<specifics>
## Specific Ideas

- **"Tempered, not laundered JI" is the phase's identity** — the user wants tempered output to be *visibly* tempered: cents-only, no ratio column, badged. EDO/ED-n is deliberately the first tempered family so this representation is established before Phase 7's rank-2/well-temperament land on top of it.
- **Literal overtone form is the composer's default** (D-04) — a harmonic segment should read as it sounds, not pre-folded into an octave.
- **First load stays familiar** (D-08) — the page opens on the same harmonic-segment it did in Phase 5; the flagship CPS is one pick away. Anti-regression instinct over flashy first impression.
- Verified test vectors to anchor TDD (from RESEARCH): CPS `cps([1,3,5,7],2)` → `{1/1, 7/6, 5/4, 35/24, 5/3, 7/4, 2/1}`; `adoScale(6, 2/1)` → `7/6, 4/3, 3/2, 5/3, 11/6, 2/1`; `harmonicSegment(8,16)` → `h/8` for h∈8..16; `edScale(12, 2/1)` cents `k*100` (assert cents, never ratios).

</specifics>

<deferred>
## Deferred Ideas

- **Non-octave equave for JI families** (CPS/diamond/etc. in a 3/1 tritave) — kernel supports it via the `period` param; surface it via the Phase-8 transform strip uniformly, not per-widget (D-07).
- **Rotate-to-mode + reduce/dedupe/transpose strip** (SURF-04) — Phase 8. (The harmonic-family "reduce to octave" toggle D-04 ships now as a local param, not this general strip.)
- **Circle-of-pitches preview viz** (SURF-05) — Phase 8.
- **SonicWeave-backed methods** — rank-2 (+ optimal tunings), well-temperament, Fokker block, free-text expression (GEN-06..09) — Phase 7.
- **Wilson recurrence / metallic, constant-structure** (GEN-10) — Phase 8.
- **Offering the existing `tonality-diamond` / `lattice` viz components for JI-family results** (research B-2 suggestion) — nice-to-have; revisit with the Phase-8 circle viz rather than bolting on here.
- **Tetrachordal (Chalmers) builder, harmonic-entropy-guided selection** — out of v1.1 entirely (GENX/TEMP-05).

</deferred>

---

*Phase: 06-exact-rational-ji-harmonic-generators*
*Context gathered: 2026-06-09*
</content>
</invoke>
