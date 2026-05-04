---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 02-04-PLAN.md (Scala .scl parser/serializer + clipboard payload — SCALE-01, IO-01..05); Wave 2 complete
last_updated: "2026-05-04T18:04:05.814Z"
last_activity: 2026-05-04
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 11
  completed_plans: 9
  percent: 82
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** I can design any JI scale (arbitrary ratios, no prime-limit ceiling), see it expressed as ratios and cents-from-12tet, hear it, and export it to Scala `.scl`/`.kbm` — all from a self-hosted notebook where the calculator and the research prose live together.
**Current focus:** Phase 02 — math-kernel-composition-anchor-mvp

## Current Position

Phase: 02 (math-kernel-composition-anchor-mvp) — EXECUTING
Plan: 5 of 7 (Wave 2 — Plan 04 still pending; Plan 05 completed out of order)
Status: Ready to execute
Last activity: 2026-05-04

Progress: [████████░░] 82%

## Performance Metrics

**Velocity:**

- Total plans completed: 4
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-bootstrap-build P01 | 16min | 2 tasks | 11 files |
| Phase 01-bootstrap-build P02 | 3min | 2 tasks | 11 files |
| Phase 01-bootstrap-build P03 | 3min | 2 tasks | 4 files |
| Phase 01-bootstrap-build P01-04 | 6min | 2 tasks | 1 files |
| Phase 02-math-kernel-composition-anchor-mvp P01 | 4min | 2 tasks | 27 files |
| Phase 02-math-kernel-composition-anchor-mvp PP02 | 6min | 2 tasks tasks | 9 files files |
| Phase 02-math-kernel-composition-anchor-mvp P03 | 4min | 1 tasks | 2 files |
| Phase 02-math-kernel-composition-anchor-mvp P05 | 3min | 1 tasks | 2 files |
| Phase 02-math-kernel-composition-anchor-mvp P04 | 5min | 1 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 4-phase structure follows research-recommended dependency order (bootstrap → kernel-MVP with composition anchor → viz + mobile → analysis); temperament browser deferred to v2
- [Phase ?]: Honored D-17: @observablehq/framework exact-pinned to 1.13.4 (no caret); transitive deps locked via package-lock.json
- [Phase ?]: Honored D-13: package.json contains the 9-script set verbatim (dev, build, lint:types, test, test:watch, lint, format, format:check, ci); no observable deploy script per D-05
- [Phase ?]: Honored D-18: Node 20 LTS pin via .nvmrc (=20) and engines.node (>=20)
- [Phase 01]: Honored D-16: tsconfig.json has all four strict flags (strict, noUncheckedIndexedAccess, noImplicitOverride, exactOptionalPropertyTypes)
- [Phase 01]: Honored D-12: ESLint 9 flat config uses recommendedTypeChecked baseline scoped to src/**/*.{ts,js}; root-level configs linted without type-aware rules
- [Phase 01]: Honored D-07: tests live at src/lib/__tests__/ adjacent to source; vitest.config.ts excludes Framework cache and Markdown
- [Phase 01]: Added src/.observablehq/** to ESLint ignores - Framework cache lives at src/.observablehq/, not repo root
- [Phase ?]: [Phase 01]: Honored D-14: src/index.md imports {Fraction} from npm:fraction.js, computes new Fraction("81/79"), and renders ratio + cents (~43.28¢) inline — proves Framework + npm: + BigInt + strict TS end-to-end
- [Phase ?]: Honored D-17: fraction.js exact-pinned to 5.3.4 (no caret); xen-dev-utils, sonic-weave, ji-lattice, sw-synth caret-ranged
- [Phase ?]: Honored D-21: temperaments and mathjs absent from package.json (deny-list grep); accepted ji-lattice peer-dep warning per CLAUDE.md compatibility table
- [Phase ?]: Honored D-08: src/lib/INVENTORY.md seeded with first kernel-discipline entry (Fraction → fraction.js@5.3.4); establishes wrap-don't-reimplement pattern (Pitfall #5)
- [Phase ?]: Reworded src/index.md prose from 'composition dashboard' to 'piece dashboard' to satisfy plan's deny-grep on 'composition|theory'; D-15 intent (no skeleton-page files) preserved
- [Phase ?]: [Phase 01]: Honored D-02/D-03/D-05: single GitHub Actions workflow chains npm ci → 4 gates → deny-list → build → configure-pages → upload-artifact → deploy-pages on push to main; PRs run gates + build only; no observable deploy invocation
- [Phase ?]: [Phase 01]: Honored security_constraints: only first-party actions/* (checkout@v4, setup-node@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4); minimum-needed permissions (contents:read, pages:write, id-token:write); concurrency:{group:pages, cancel-in-progress:false}
- [Phase ?]: [Phase 01]: Honored D-18 + D-21: setup-node reads node-version-file: .nvmrc (Node 20 single-source-of-truth); in-CI deny-list step rejects temperaments / mathjs in package.json (defense-in-depth alongside Plan 03 local check)
- [Phase ?]: [Phase 02 Plan 01]: Honored D-23 — KaTeX 0.16.45 CSS head-injected via SRI-pinned CDN; no auto-render JS (KaTeX JS lazy-loads on first tex cell)
- [Phase ?]: [Phase 02 Plan 01]: Honored R-01 — eslint.config.js no-restricted-imports rule blocks Fraction from xen-dev-utils repo-wide (kept active in test files; no kernel test legitimately needs that import)
- [Phase ?]: [Phase 02 Plan 01]: Honored Phase 1 D-07 extension — vitest.config.ts include glob now covers src/lib/__tests__/, src/audio/__tests__/, and src/__tests__/
- [Phase ?]: [Phase 02 Plan 01]: Sourced 3 golden archive .scl files from live Huygens-Fokker scales.zip; renamed slendro_av.scl→slendro.scl and young-lm_piano.scl→young_lm.scl; per-file source + license documented in golden/LICENSE.md
- [Phase ?]: [Phase 02 Plan 02]: Honored R-01 at source — src/lib/interval.ts imports Fraction from fraction.js directly
- [Phase ?]: [Phase 02 Plan 02]: Honored D-24 immutability — Interval.mul/div/inv/octaveReduce return new instances, verified with referential-inequality test assertions
- [Phase ?]: [Phase 02 Plan 02]: Honored Pitfall #13 — Interval.octaveReduce(period?) accepts arbitrary periods (default 2/1; tested with 9/1 reduced by 3/1 → 1/1)
- [Phase ?]: [Phase 02 Plan 02]: Honored Pitfall #6 + D-21 — 16 hand-verified commas keyed on canonical monzo; Mercator's comma 25-digit ratio round-trips exactly through BigInt path (live R-01 proof)
- [Phase ?]: [Phase 02 Plan 02]: Honored Pitfall #5 — 8 INVENTORY rows added; every new export has Source + Notes
- [Phase ?]: [Phase 02 Plan 02]: Curated commas table — dropped 4 unverified candidates from planner draft, substituted verified replacements (harmonic seventh comma 49/48, jubilisma 50/49, breedsma 2401/2400); fixed rastma sign and Mercator direction
- [Phase 02]: Plan 03: Honored D-24 + Pitfall #13 — Scale.reduce treats period-equal inputs specially (preserves period; doesn't reduce to 1/1) so [9/8, 5/4, 9/8, 2/1].reduce() yields length-3 [9/8, 5/4, 2/1] while Bohlen-Pierce [9/1, 3/1] still reduces to [1/1, 3/1]
- [Phase 02]: Plan 03: Honored R-01 — jiSubsetOfEdo round-trips xen-dev-utils' Number-backed Fraction through ${n}/${d} string into Interval's BigInt-backed Fraction; maxExponent=5 (not 8) keeps the search inside Number.MAX_SAFE_INTEGER for 31-EDO 7-limit
- [Phase 02]: Plan 03: Wave-2 file-ownership — INVENTORY.md NOT modified in this plan; Plan 06 will consolidate Scale + jiSubsetOfEdo rows alongside Plans 04/05 to avoid merge conflicts
- [Phase ?]: [Phase 02]: Plan 05: Honored D-16/D-17/D-18 + Pitfall #2/#9 + ARCHITECTURE Pattern 4 — createSynth factory with lazy AudioContext, voice tracking via noteOff callbacks, terminal idempotent dispose; defense-in-depth Hz clamp [20, 20000] (T-02-17), arpeggio cap 256 (T-02-18), polyphony clamp [1, 64] (T-02-19); three-layer discipline preserved
- [Phase ?]: [Phase 02]: Plan 05: Wave-2 file-ownership — INVENTORY.md NOT modified; Plan 06 (Wave 3) will add createSynth + SynthHandle rows alongside Plans 03/04's queued rows to avoid merge conflicts
- [Phase ?]: [Phase 02]: Plan 04: Honored D-12/D-13/D-14/D-15/D-19 + Pitfall #6 — single shared parseScala body parser feeds .scl import + dashboard textarea; auto-prepends 1/1; rejects negative-ratio + multi-slash with clear errors; cents detection by '.' membership; monzo bra-ket as project extension
- [Phase ?]: [Phase 02]: Plan 04: Added formatRatio helper because fraction.js' toFraction() drops '/1' for whole-number ratios — writeScl/scalaToCsv read iv.fraction.n/.d (BigInt) directly to emit explicit n/d form
- [Phase ?]: [Phase 02]: Plan 04: Honored R-01 + T-02-10/T-02-11 — only centsToValue imported from xen-dev-utils (NOT Fraction); 1MB input cap; monzo length cap 32; per-component magnitude cap ±1024
- [Phase ?]: [Phase 02]: Plan 04: Wave-2 file-ownership — INVENTORY.md NOT modified; Plan 06 (Wave 3) will consolidate parseScala/parseScl/writeScl/scalaToCsv rows alongside Plans 03/05 to avoid merge conflicts

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-05-04T18:04:05.808Z
Stopped at: Completed 02-04-PLAN.md (Scala .scl parser/serializer + clipboard payload — SCALE-01, IO-01..05); Wave 2 complete
Resume file: 
None
