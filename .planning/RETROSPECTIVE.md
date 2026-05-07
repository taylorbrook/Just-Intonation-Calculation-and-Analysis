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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 MVP  | 4      | 25    | First milestone — established wave-based parallelization, three-layer purity discipline, INVENTORY.md kernel-symbol tracking, R-01 lint-time precision guard, Pattern 4 cell-owned synth, decimal phase numbering convention. |

### Cumulative Quality

| Milestone | Tests | Strict-TS Flags | Lint Surface |
|-----------|-------|-----------------|--------------|
| v1.0 MVP  | 192   | 4 (strict, noUncheckedIndexedAccess, noImplicitOverride, exactOptionalPropertyTypes) | ESLint 9 flat config, recommendedTypeChecked baseline scoped to `src/` |

### Top Lessons (Verified Across Milestones)

1. *(populates after v1.1)*
2. *(populates after v1.1)*
