# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-07
**Phases:** 4 | **Plans:** 25 | **Tasks:** 47
**Timeline:** 2026-05-02 → 2026-05-07 (~5 calendar days, 157 commits)
**Tests at close:** 192 passing
**Code surface:** ~7,900 LOC TypeScript across 47 files; 5 Markdown pages; 14 CSS files

### What Was Built

- A deployable Observable Framework site with strict TypeScript, Vitest, ESLint 9, Prettier, and a GitHub Actions → Pages deploy pipeline.
- A pure JI math kernel (BigInt-backed `Interval`, period-aware `Scale`, monzo + cents projections, named-comma table, EDO/MOS construction) with a 21-fixture Scala `.scl` round-trip corpus and a `.kbm` parser/writer that keeps the three named fields distinct.
- A Web Audio synth wrapper (`createSynth`) over `sw-synth` with lazy AudioContext, voice tracking, ADSR, panic/dispose, and mobile Safari quirks (audioSession, sync resume, visibilitychange) mitigated.
- D3 + ji-lattice 2D lattice, configurable-odd-limit tonality diamond, scale-on-keyboard SVG with cents-offset labels.
- A composition dashboard (`/`), a syntonic-comma theory page proving the >1-page architecture, and a public `/analysis` page wiring EDO/MOS/scale-compare/URL-share widgets.
- 192-test suite green at close; INVENTORY.md tracking every kernel symbol back to its source + decision references.

### What Worked

- **Wave-based parallelization within phases.** Phase 2's 5-wave plan and Phase 3's 5-wave plan let independent kernels (kbm, diamond, synth fixes) and components ship in parallel without merge conflicts. The deferred-INVENTORY-consolidation pattern (final wave-3 plan owns the consolidation) prevented the wave-2 conflicts that would otherwise have shown up.
- **Composition anchor + generalizable toolkit, both required.** The seed scale baked as a string constant on the dashboard kept abstraction honest (no piece-module ceremony) while the kernel stayed general enough to power the public `/analysis` page. The dual-mode requirement worked: each side caught the other's drift.
- **Three-layer purity discipline (kernel → components → pages).** Pages own audio lifecycle, components import kernel by value, kernel has zero DOM. The Pattern 4 (cell-owned synth) decision survived two-page cross-navigation without leaking AudioContexts — verified at multiple checkpoints.
- **R-01 ESLint rule blocking Number-backed `Fraction`.** Catching the wrong import at lint time meant Mercator's 25-digit comma round-trip test was load-bearing — any precision regression would have surfaced in CI before merging.
- **Goal-backward verification + gap-closure.** Phase 3 verification surfaced two real defects (CR-01 diamond layout, CR-02 arpeggio panic). Plan 03-07 closed them with surgical edits + load-bearing regression tests in one shot. The verification report's distinction between "documentation-trail nicety" and "code defect" let the milestone close cleanly with one acknowledged deferred item instead of blocking on a low-value re-walk.

### What Was Inefficient

- **Phase 3 `roadmap_complete` flag stayed false.** The phase actually shipped (7/7 plans, 5/5 must-haves, gap-closure done) but the roadmap-line status string still read "gaps_found awaiting closure" at v1.0 close. That's a state-staleness bug somewhere between gap-closure and roadmap-row updates — caught it in milestone close, fixed inline, but worth noting the integrity gap.
- **`{pending}` placeholders in `mobile-audit.md` outlived their plan.** Plan 06 SUMMARY claimed approval; the footer signature block stayed `{pending}`. Caught only at re-verification. A "no `{pending}` placeholders in completed-plan artifacts" gate would have surfaced this earlier.
- **Per-page `style:` frontmatter REPLACES Framework's default stylesheet rather than augmenting it.** Discovered during 03-06 UAT (Rule 1 deviation in commit 7d943ae). Theme tokens migrated from default location into `styles.css` to recover. Convention now recorded; cost was real but would not have been catchable upstream without trying.
- **Two phantom audit flags survived close.** The two completed quick-tasks (CR-01 octaveReduce, CR-02/CR-03 writeScl) showed as `missing` in the audit despite having SUMMARY.md files and being merged. The audit tool seems to look for a marker the SUMMARY format doesn't carry; tracked as "missing-marker" in deferred items. Worth a follow-up to align audit signals with reality.

### Patterns Established

- **Wave-3 INVENTORY consolidation per phase.** The final plan in each phase consolidates all new kernel symbols into a `## Phase N entries` section. Intermediate plans defer their rows to avoid wave-2 merge conflicts. Held in Phase 2, Phase 3, Phase 4.
- **Pattern 4 (cell-owned synth, D-34).** Each page declares its own synth cell with `invalidation.then(synth.dispose)`; synths are NOT factored into a shared module — page-cell semantics differ from module-export semantics. Survived two-page cross-navigation cleanly.
- **`<details>` for verbose accomplishments in MILESTONES.md.** The SDK dumps raw plan-level one-liners; the milestone close summarizes 4–6 condensed milestone-level accomplishments and tucks the raw list inside `<details>`. Keeps the file scannable while preserving full record.
- **Deferred-items policy: documentation-trail vs code defect.** Verification reports distinguish "the unit-level regression covers this" from "the user-visible behavior is broken." Documentation-trail items can be acknowledged at milestone close with a STATE.md → Deferred Items entry instead of blocking the close.
- **Decimal phase numbering reserved for hot-fix insertions.** Not exercised in v1.0 (no decimal phases inserted). Pattern stands for future use; ROADMAP.md format documented it.

### Key Lessons

1. **A composition anchor disciplines the kernel.** Without the seed scale + dashboard requiring every kernel feature end-to-end, the kernel would have grown abstraction without grounding. The reverse — building the kernel first then trying to find a piece for it — would have produced a different, worse shape.
2. **Goal-backward verification catches things task-by-task verification misses.** The CR-01 diamond layout bug is the canonical example: each component test passed, the visual regression was only visible when the verification report asked "does the user see a diamond?" and the answer was "no, they see cells stacked on the axes."
3. **Lint-time precision guards beat test-time precision guards.** R-01 (block Number-backed `Fraction`) caught accidental imports before they could write a wrong-result test fixture. Pitfall #6 (commas keyed on canonical monzo, never cents-within-epsilon) similarly enforced correctness at the type/data level rather than via runtime comparisons.
4. **Mobile audio cannot be assumed to work without a Safari RDM walk.** Three Pitfall fixes in Phase 3 synth.ts (audioSession, sync ctx.resume, visibilitychange) only surfaced because Phase 3 included the mobile-audio audit explicitly. v1's "in-browser audio works" requirement would otherwise have shipped broken on iPhone.
5. **`{pending}` placeholders in committed artifacts deserve a CI gate.** Plan 06 SUMMARY claimed mobile-audit.md was approved while the footer block was still `{pending}`. A simple grep for `{pending}` in finished-plan artifacts would have caught this. Worth adding next milestone.

### Cost Observations

- Model mix: not tracked (no telemetry — first milestone). Worth instrumenting before v1.1.
- Sessions: not tracked. Phase-by-phase plan duration captured in STATE.md velocity table (range: 3 min → 10 hours per plan; outliers were Phase 3 Plan 06 dashboard integration ~10h and Phase 2 Plan 07 dashboard wiring 50min).
- Notable: 25 plans across 5 calendar days suggests dense compute days, not steady cadence.

---

## Milestone: v1.1 — Scale Generation & Library

**Shipped:** 2026-06-14
**Phases:** 5 (5–9) | **Plans:** 23 | **Tasks:** 38
**Timeline:** 2026-06-08 → 2026-06-14 (~7 calendar days, 167 commits)
**Tests at close:** 659 passing (was 192 at v1.0)
**Code surface:** ~21,100 LOC TS/JS under `src/` (+~13,200 over v1.0); new `/pages/generate`, ~20 generator widgets, a 195-file Scala archive + the repo's first `*.json.ts` data loader. **Zero new npm deps.**

### What Was Built

- The **Generate surface** (`/pages/generate`) — a family-grouped method picker with params/preview host-swap, live preview + audition, a non-destructive rotate/reduce/dedupe/transpose transform strip, a circle-of-pitches viz, and "Send to Dashboard / Analysis".
- An **additive `scale-store`** (localStorage + one-way `CustomEvent`, a twin of `theme-prefs.ts`) wired so the Dashboard and Analysis pages opt in via `resolveInitialScaleText(hash, readSharedScale(), seed)` and live-update on a change event — gated by the **R1 empty-store boot-equivalence test** that proves those pages boot byte-identically to v1.0.
- **~20 generators** across four families: CPS / harmonic / ADO / diamond / odd-prime-Farey / EDO-EDn (exact JI + the first tempered family), rank-2 / well-temperament / Fokker / free-text SonicWeave, Wilson-metallic / constant-structure.
- A **searchable bundled Scala archive** (195 curated Huygens-Fokker `.scl`) via a build-time JSON index with per-entry tempered-provenance flags (76 tempered / 119 exact).
- 659-test suite green at close; all 23 v1.1 requirements delivered and human-verified.

### What Worked

- **The Pattern-2 widget contract as the integration spine.** Every generator and the archive is `(synth, opts?) => HTMLElement` exposing `getScale()` / `isTempered()`. That uniformity made the Phase-9 Send-to wiring "pure plumbing" (~8 additive insertion points modeled on an existing branch, none modified) and kept `writeSharedScale` to exactly one call site across all five phases.
- **Additive-only integration with an executable gate.** The R1 boot-equivalence test went RED→GREEN before any Send-to wiring existed and stayed green through Phases 5–9 — the working Dashboard/Analysis pages never regressed, because a leak into the boot path would have tripped the gate immediately.
- **Research-first "is it already installed?"** found `sonic-weave@0.14.1`'s prelude already covered rank-2 / well-temperament / Fokker, so all of Phase 7 shipped over one thin adapter with zero new deps — delivering three parked items (TEMP-01/07/08) early.
- **SURF-06 enforced at the data boundary.** A tempered flag computed once (at build for the archive, at generation for widgets) drives cents-only display AND cents-per-line Send-to. The "never launder cents as exact JI" rule was the most cross-cutting correctness property of the milestone and it held end-to-end (human-verified for EDO, rank-2, well-temperament, and tempered archive scales).

### What Was Inefficient

- **Status files drifted from reality between phase-close and milestone-close.** At close, ROADMAP showed Phases 8 + 9 unchecked while STATE already read `milestone_complete`; the Phase-5 SURF/SYNC requirements sat "Pending" despite Phase 5 shipping with a 5/5 UAT. All bookkeeping lag, all fixed at close — the same status-propagation class as v1.0's stale `roadmap_complete`.
- **Two phases' human UAT never ran until milestone close.** Phase 6 (4 scenarios) and Phase 9 (the headline feature) had UAT files set up but unrun, and Phase 6's verification sat `human_needed` for days. Closing both took minutes once the dev server was up — they belonged at phase close, not bundled into the milestone close.
- **The milestone-complete CLI auto-extracted 22 noisy "accomplishments"** including raw deviation bullets (`1. [Rule 1 - Bug] …`); had to hand-curate down to 5 phase-level wins. Same raw-dump class as v1.0.
- **42 capture stubs flagged `missing` again.** The same false-positive class as v1.0's two — completed quick-tasks with SUMMARY + commits the audit tool can't recognize as done. The backlog grew 2 → 42, so the audit-marker mismatch is now a real signal-to-noise problem (it nearly buried the 2 genuine Phase-6 gaps).

### Patterns Established

- **Pattern-2 generator widget contract.** `(synth, opts?) => HTMLElement` exposing `getScale()` / `isTempered()` — the uniform surface that let one picker, one transform strip, and one Send-to path serve all ~20 methods.
- **Additive consumer opt-in + one-way data flow.** Producer writes the store; consumers read-at-boot and listen, never write back. The empty-store boot-equivalence test is the gate that makes "strictly additive" enforceable rather than aspirational.
- **Tempered-provenance carried with the scale.** Compute tempered-vs-exact once and have every downstream consumer (table, viz, serializer) branch on it — a single source of truth for the "cents, not laundered ratios" rule.
- **Lazy data-loader thunk for testability.** The archive widget takes `opts.loadEntries` (`() => FileAttachment(...).json()`) with a default resolving to `[]`, so it unit-tests without `FileAttachment` and the heavy index is decoupled from widget logic.

### Key Lessons

1. **A uniform widget contract turns integration into plumbing.** The single biggest force-multiplier of v1.1 — adding the 20th method (the archive) was additive insertion points, not new machinery, because every generator already looked identical to the picker and Send-to.
2. **An "additive" claim needs an executable gate or it rots.** R1 made strictly-additive integration real; code-review-only additivity would not have survived five phases of new writers.
3. **Run human UAT at phase close, not milestone close.** Deferring Phase 6/9 UAT left a verification gap open for days and turned the milestone close into a testing session.
4. **Status propagation is the recurring integrity bug.** Both milestones closed with stale ROADMAP/STATE rows. A close-time assertion — "every shipped requirement is checked AND every phase row agrees across ROADMAP/STATE" — would catch it.
5. **The audit-marker mismatch is now load-bearing noise.** 42 false-positive `missing` stubs nearly drowned the 2 real gaps. The audit must recognize a completed quick-task (SUMMARY + commit) as done, or the signal that matters at close gets buried.

### Cost Observations

- Model mix: still not instrumented (carried gap from v1.0's "worth instrumenting before v1.1").
- Velocity: 23 plans over ~7 calendar days; per-plan durations cluster at 2–12 min for the widget plans — the Pattern-2 reuse paid off directly in plan time.
- Notable: **zero new npm deps across a five-phase feature milestone** — the research-first installed-already check (sonic-weave) avoided an entire dependency-management tax.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 MVP  | 4      | 25    | First milestone — established wave-based parallelization, three-layer purity discipline, INVENTORY.md kernel-symbol tracking, R-01 lint-time precision guard, Pattern 4 cell-owned synth, decimal phase numbering convention. |
| v1.1 Scale Generation & Library | 5 | 23 | Established the Pattern-2 widget contract `(synth, opts?) => HTMLElement` + `getScale()`/`isTempered()` as the integration spine; additive consumer opt-in gated by an empty-store boot-equivalence test; tempered-provenance carried with the scale (SURF-06); research-first "already installed?" check → zero new npm deps for a 5-phase feature milestone. |

### Cumulative Quality

| Milestone | Tests | Strict-TS Flags | Lint Surface |
|-----------|-------|-----------------|--------------|
| v1.0 MVP  | 192   | 4 (strict, noUncheckedIndexedAccess, noImplicitOverride, exactOptionalPropertyTypes) | ESLint 9 flat config, recommendedTypeChecked baseline scoped to `src/` |
| v1.1 Scale Generation & Library | 659 | 4 (unchanged) | ESLint 9 flat config + Prettier; `tsc --noEmit` strict + `npm run build` clean at close; 0 new npm deps |

### Top Lessons (Verified Across Milestones)

1. **Discipline enforced by an executable gate survives; discipline enforced by review rots.** v1.0's R-01 lint rule (block Number-backed `Fraction`) and v1.1's R1 boot-equivalence test both held across every later phase precisely because a violation went RED in CI — not because reviewers remembered the rule.
2. **Status propagation is the recurring integrity bug at close.** Both milestones reached close with stale ROADMAP/STATE rows (v1.0: `roadmap_complete` false on a shipped phase; v1.1: unchecked Phase-8/9 boxes + "Pending" Phase-5 requirements while STATE read complete). A close-time cross-file status assertion would catch it every time.
3. **The audit-marker mismatch keeps manufacturing false `missing` flags.** 2 at v1.0, 42 at v1.1 — completed quick-tasks the audit tool can't see as done. Growing fast enough to bury real gaps; needs a fix to recognize SUMMARY + commit as completion.
4. **Run human UAT at phase close.** Deferring it to milestone close (v1.1's Phase 6 + 9) turned a bookkeeping step into a testing session and left a verification gap open for days.
