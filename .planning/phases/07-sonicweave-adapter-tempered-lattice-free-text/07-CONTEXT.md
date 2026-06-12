# Phase 7: SonicWeave Adapter — Tempered, Lattice & Free-Text - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the **genuinely advanced methods as thin, well-tested wrappers over the already-installed `sonic-weave@0.14.1` prelude**, through a single kernel adapter, plus a free-text SonicWeave escape hatch:

- **Kernel adapter** — `src/lib/sonicweave.ts`: `scaleFromSonicWeave(src)` → `{ scale, tempered, error? }` via `evaluateSource(src).currentScale`. Rational results round-trip into the kernel's BigInt `Interval` via the `n/d` string (R-01 stays green); tempered results carry cents (`.totalCents()` → `centsToRatio`) and are flagged — never laundered as exact JI.
- **Rank-2 regular temperament widget** (GEN-06) — generator + period with named presets and POTE/TE/CTE/pure tuning options; pure-ratio rank-2 cross-checked against the kernel's `buildMos` (Pythagorean diatonic equivalence).
- **Well-temperament widget** (GEN-07) — per-fifth comma tempering with historical presets; tempered presentation.
- **Fokker periodicity-block widget** (GEN-08) — exact rational block; both basis+extents and unison-vector (comma) specification modes.
- **Free-text SonicWeave widget** (GEN-09) — full multi-line programs compiled to a scale; malformed input surfaces a safe error without destroying the prior preview.

**In scope:** GEN-06, GEN-07, GEN-08, GEN-09 (delivers parked TEMP-01, TEMP-07, TEMP-08). Depends on Phase 5 only (picker host, Send-to); independent of Phase 6's hand-rolled kernels but cross-checked against them.

**Explicitly NOT this phase:**
- Wilson recurrence / metallic, constant-structure (GEN-10 → **Phase 8**; constant-structure consumes this phase's adapter).
- Circle-of-pitches viz (SURF-05) and the rotate/reduce/dedupe/transpose strip (SURF-04) → **Phase 8**.
- Scala archive browser (LIB-01..03 → **Phase 9**).
- Any change to `Interval` / `Scale` kernel types, or any new npm dependency (`sonic-weave` is already installed).

</domain>

<decisions>
## Implementation Decisions

### Rank-2 widget (GEN-06)
- **D-01:** **Presets + manual.** A preset select of named rank-2 temperaments (Pythagorean, quarter-comma meantone, porcupine, hanson, magic, …) fills generator/period/up-down; all fields stay editable afterward. Mirrors the Phase-6 CPS Hexany/Dekany/Eikosany preset precedent.
- **D-02:** **Default landing = quarter-comma meantone** (tempered fifth ≈ 696.578¢, 7 notes) — first render immediately showcases the phase's new capability: a tempered rank-2 with badge and cents-primary table. (Pure-ratio rank-2 was already reachable via the v1.0 MOS builder, so an exact default would demo nothing new.)
- **D-03:** **Tuning select tied to presets.** The POTE/TE/CTE/pure select is active when a named preset is chosen (the preset defines the commas the optimal tunings need); manual generator entry shows "custom" (the typed ratio is exact; typed cents are tempered). Manual entry keeps the blueprint's ratio-or-cents generator toggle.
- **D-04:** **Scale size as up/down generator counts** (SonicWeave's native `rank2(generator, up, down, period)` signature — e.g. 5 up + 1 down = 7-note diatonic). Doubles as mode control until Phase 8's rotate strip.

### Well-temperament widget (GEN-07)
- **D-05:** **Presets + custom mode.** A preset select fills the per-fifth comma fractions; a "custom" mode exposes the raw per-fifth fraction fields for designing one's own.
- **D-06:** **Default landing = Vallotti** (six pure fifths + six tempered by 1/6 Pythagorean comma) — the performer's default, not Werckmeister.
- **D-07:** **Comma fixed per context — no comma input field.** Presets carry their historically correct comma; custom mode fixes the Pythagorean comma (531441/524288). Custom syntonic-comma temperaments go through the free-text escape hatch.
- **D-08:** **Extended preset roster:** Werckmeister III, Kirnberger III, Vallotti, Young II, plus Neidhardt, Kellner, Lehman "Bach", Young I. Each preset's comma-fraction vector must be sourced from a citable reference and verified (test vectors per preset).

### Fokker block widget (GEN-08)
- **D-09:** **Both specification modes ship this phase — comma mode is a hard requirement, not stretch.** Basis-interval chips + per-axis up/down extents (maps directly to SonicWeave's `parallelotope`) AND a unison-vector (comma) entry mode (the classic Fokker formulation, needing the `xen-dev-utils` HNF/determinant toolkit).
- **D-10:** **Basis+extents is the default landing mode**; comma mode is a toggle.
- **D-11:** **Default block = the classic 5-limit 12-tone Fokker block** (commas 81/80 + 128/125; equivalent basis 3×5 region → 12 notes). Canonical pedagogical example and a strong test vector.
- **D-12:** **Live note-count readout** next to the inputs ("→ 12 notes") — in comma mode |det| of the unison-vector matrix, in basis mode the extents product — visible before/alongside the preview. Making the comma→cardinality relationship visible is the point of Fokker blocks.

### Free-text escape hatch (GEN-09)
- **D-13:** **First render = pre-filled working example** (e.g. `cps([1,3,5,7], 2)`) already evaluated and previewed — consistent with every other widget landing on a working scale; editing it is the tutorial.
- **D-14:** **External docs link** to the SonicWeave documentation near the textarea (further-reading idiom). No inline cheat-sheet to author/maintain.
- **D-15:** **Raw compiler errors verbatim** in the status region (`textContent`-safe) — no translation layer. Prior preview preserved on error (blueprint rule).
- **D-16:** **Full multi-line SonicWeave programs accepted** (pitch lists, variable defs, riffs — the Scale Workshop model). `evaluateSource` handles them natively; the existing 8 KB input cap (`MAX_SCALE_TEXT_BYTES`) bounds input. Evaluate on button click, never per keystroke.

### Claude's Discretion
- **D-17:** Exact rank-2 preset roster beyond the named examples (D-01 lists the spirit; pick well-known temperaments with citable generator values), and each preset's default up/down counts.
- **D-18:** Adapter error shape (structured return vs typed throw), the rational-vs-tempered discriminator (~~`iv.value instanceof TimeReal` per blueprint Assumption A4~~ — **RESEARCH verified this is WRONG**; tempered cents-based intervals are `TimeMonzo`, not `TimeReal`. Use `iv.value.isFractional()` as the discriminator, see 07-RESEARCH.md Pitfall 1 + Pattern 1), and defense-in-depth caps (Fokker extents, rank-2 up/down bounds) mirroring Phase-6 D-14 conventions.
- **D-19:** Comma-mode input idiom for Fokker (chip input vs ratio fields) and how mode toggling preserves state between the two formulations.
- **D-20:** Where the free-text widget's docs link points (the most stable SonicWeave docs URL at implementation time).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's scope & requirements
- `.planning/ROADMAP.md` §"Phase 7: SonicWeave Adapter — Tempered, Lattice & Free-Text" — goal, 5 success criteria, depends-on Phase 5.
- `.planning/REQUIREMENTS.md` — GEN-06..09 definitions and traceability (delivers parked TEMP-01/07/08).

### Milestone design inputs (LOCKED — the authoritative blueprint)
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-PLAN.md` — **TRANCHE 2 (lines 478–570) is this phase's blueprint**: Task 2.1 `sonicweave.ts` adapter + test inventory (Hexany cross-check, `rank2(3/2,5,1)` ≡ `buildMos`, tempered detection, R-01 boundary, input cap); Task 2.2 free-text widget; Task 2.3 rank-2/well-temp/Fokker widgets. Tempered-representation decision: lines 113–126. R-01/exactness rules: lines 80–95.
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-RESEARCH.md` — runtime-verified adapter pattern (`evaluateSource(src).currentScale`, `.toFraction()` / `.totalCents()`, lines ~420–443); A-1 #3/#4 rank-2 + well-temperament analysis; A-4 #14 Fokker (parallelotope wrap vs HNF hand path — **D-09 requires BOTH**, so the `xen-dev-utils` `basis.ts`/`hnf.ts` toolkit notes at line 56 matter); Pitfall list (tempered `.toFraction()` throws/meaningless, evaluate-on-click).
- `.planning/quick/260608-dyv-scale-generation/260608-dyv-CONTEXT.md` — locked milestone decisions (four families + fifth SonicWeave optgroup, additive integration).

### Prior phase contracts (carried forward — do not re-decide)
- `.planning/phases/06-exact-rational-ji-harmonic-generators/06-CONTEXT.md` — D-01/D-02 tempered = cents-only + badge (no ratio column); D-03 tempered flag at component layer, Send-to serializes cents-per-line; D-10 native `<select>` optgroups.
- `.planning/phases/05-generate-surface-live-integration-foundation/05-CONTEXT.md` + `05-UI-SPEC.md` + `05-PATTERNS.md` — picker host, params/preview hosts, visual tokens (do not invent new), "Approach B" native `<select>`.

### Project standards
- `CLAUDE.md` — Observable Framework conventions, R-01 rule, page-owned synth.
- `src/lib/INVENTORY.md` — kernel symbol inventory; `scaleFromSonicWeave` (and any Fokker comma-mode helpers) get rows.
- `.planning/PROJECT.md` — three-layer purity, BigInt-exactness.

### Source-of-truth files to read before editing
- `src/pages/generate.md` — picker `<optgroup>`s to extend (rank-2 + well-temp → "Regular"; Fokker → "Advanced"; free-text → new fifth "SonicWeave" optgroup per Tranche 2).
- `src/lib/mos.ts` (`buildMos`) — the rank-2 pure-ratio cross-check target.
- `src/lib/monzo.ts` (`centsToRatio`) — tempered cents→kernel projection at the adapter boundary.
- `src/lib/interval.ts`, `src/lib/scale.ts` — BigInt `Interval`/`Scale` currency (no `tempered` field).
- `src/components/mos-builder.ts` — Pattern-2 factory, `makeRatioField` (rank-2 generator/period, well-temp custom fractions), status region.
- `src/components/generate-cps.ts` — factor-set chip input (reuse for Fokker basis chips) and the preset-select precedent (reuse shape for rank-2/well-temp presets).
- `src/components/generate-ed.ts` + `src/components/scale-table.ts` — the tempered (cents-only + badge) rendering path established in Phase 6; reuse, don't reinvent.
- `src/state/scale-store.ts`, `src/lib/url.ts` — Send-to plumbing, `MAX_SCALE_TEXT_BYTES` (8 KB cap reused for free-text input).
- `node_modules/sonic-weave` (installed 0.14.1) — verify `evaluateSource` signature, `Interval.value` discriminator (`TimeReal` vs rational), `rank2`/`wellTemperament`/`parallelotope` prelude signatures empirically.
- `node_modules/xen-dev-utils` — `basis.ts`/`hnf.ts` (`hnf`, `kernel`, `cokernel`, `solveDiophantine`, determinant) for the Fokker comma mode (D-09) and live cardinality readout (D-12).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`buildMos` (`mos.ts`)** — the cross-kernel regression target: `scaleFromSonicWeave("rank2(3/2, 5, 1)")` must equal `buildMos(3/2, 2/1, 7)` exactly.
- **`cps` (`cps.ts`)** — second cross-check: SW `cps([1,3,5,7], 2)` ≡ kernel Hexany, BigInt `n/d`.
- **Tempered table variant + badge (`scale-table.ts`, established Phase 6)** — rank-2 tempered, well-temperament, and tempered free-text results reuse it verbatim.
- **`makeRatioField` (`mos-builder.ts`)** — rank-2 generator/period ratio inputs, well-temp custom comma fractions.
- **Factor-set chip input (`generate-cps.ts`)** — reuse idiom for Fokker basis chips and comma chips.
- **`playScale`, `scale-store`, `url.ts`** — audition + Send-to plumbing complete from Phase 5; tempered serialization (cents-per-line) complete from Phase 6.

### Established Patterns
- Adapter boundary = the existing `jiSubsetOfEdo` round-trip pattern: foreign Fraction → `${n}/${d}` string → kernel BigInt `Interval` (R-01 ESLint enforces; never let SonicWeave's Fraction leak).
- Tempered pitches: cents is source of truth, `centsToRatio` only for Hz projection at the audio boundary; tempered flag lives at the component layer (Phase 6 D-03).
- Pattern-2 component factories `(synth, opts) => HTMLElement`; `createElement` + `textContent`; status region for errors; `replaceChildren` re-render.
- Defense-in-depth caps validated BEFORE enumeration (RangeError), per Phase-6 D-14.
- New kernel symbols → `INVENTORY.md` rows with Source + Reason.

### Integration Points
- New kernel module `src/lib/sonicweave.ts` (+ `__tests__/sonicweave.test.ts`) — the single adapter all four widgets call.
- New components `src/components/generate-rank2.ts`, `generate-welltemp.ts`, `generate-fokker.ts`, `generate-sonicweave.ts` (+ CSS + `__tests__`), registered in `src/pages/generate.md`: rank-2 + well-temp under "Regular", Fokker under "Advanced", free-text under a new fifth "SonicWeave" optgroup.
- Fokker comma mode additionally needs a small exact lattice helper (unison-vector matrix → |det| cardinality + block enumeration) over `xen-dev-utils` `hnf`/`kernel` — kernel-layer, BigInt-exact, INVENTORY row.

</code_context>

<specifics>
## Specific Ideas

- **First render demos the new capability** — every widget lands on a working, canonical example: quarter-comma meantone (rank-2), Vallotti (well-temp), the classic 5-limit 12-tone block (Fokker), an evaluated `cps([1,3,5,7], 2)` (free-text). Editing the working example IS the tutorial.
- **The Fokker comma→cardinality relationship should be felt** — the live "→ N notes" readout (D-12) is a deliberate pedagogical surface, not chrome.
- **Escape-hatch power over hand-holding** — full multi-line programs, raw compiler errors, a docs link instead of a maintained cheat-sheet. The free-text widget is for users who want the DSL, not a guided form.
- Verified test vectors to anchor TDD (from RESEARCH/blueprint): `rank2(3/2, 5, 1)` → `9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2/1` (≡ `buildMos`); SW `cps([1,3,5,7], 2)` ≡ kernel Hexany; quarter-comma meantone fifth = 5^(1/4) ≈ 696.578¢ (assert cents, tempered flag); Vallotti comma vector (1/6 Pythagorean × 6 + pure × 6); 81/80 + 128/125 block → exactly 12 rational notes.

</specifics>

<deferred>
## Deferred Ideas

- **Inline SonicWeave cheat-sheet / examples menu** for the free-text widget — D-14 chose a docs link; revisit if the escape hatch sees heavy use.
- **Comma select for custom well-temperaments** (syntonic vs Pythagorean vs arbitrary) — D-07 fixed it; custom syntonic temperaments go through free-text for now.
- **"Show the SonicWeave code behind this widget"** (Scale Workshop's template-inserter pattern, research B-2) — would let any form widget hand its expression to the free-text editor; nice v2 bridge, not this phase.
- **Temperament finder** (x31eq search-then-pick pattern) — L-effort, out of v1.1.
- **Wilson recurrence / metallic, constant-structure** (GEN-10) — Phase 8 (constant-structure consumes this phase's adapter).
- **Rotate/reduce/dedupe/transpose strip + circle-of-pitches viz** (SURF-04/05) — Phase 8.

</deferred>

---

*Phase: 07-sonicweave-adapter-tempered-lattice-free-text*
*Context gathered: 2026-06-11*
