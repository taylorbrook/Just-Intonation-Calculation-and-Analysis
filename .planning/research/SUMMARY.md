# Project Research Summary

**Project:** Tuning Systems
**Domain:** Personal JI calculator + tuning-systems research notebook (Observable Framework static site)
**Researched:** 2026-05-02
**Confidence:** HIGH

## Executive Summary

This is a personal research notebook, not a competitor to Scale Workshop or xen-calc. The defining differentiator is that prose theory and reactive computation share the same page — something no existing microtonal tool does. Observable Framework is the right and only viable choice for this shape: Markdown authoring, reactive JS cells, static-site output, git-versioned source, no platform lock-in. The xenharmonic-devs npm ecosystem (`xen-dev-utils`, `sonic-weave`, `ji-lattice`, `sw-synth`) provides production-tested JI primitives used by Scale Workshop in production; there is no reason to reimplement what they already cover. The key engineering investment is a clean pure-TypeScript math kernel (`src/lib/`) that the page layer and component layer consume without pollution in either direction.

The recommended build order is strictly kernel-first: get `Interval` (BigInt-backed `Fraction`, lazy monzo, lazy cents), `Scale`, and Scala `.scl`/`.kbm` I/O solid with Vitest coverage before any visualization. The composition in progress is the concrete anchor — every kernel feature must have a caller in `src/lib/pieces/<piece>.ts` before merging. This prevents both "toolkit grows speculative features" drift and "composition becomes a hardcoded one-off" drift, which are the two failure modes most likely to end the project.

The top risks are: (1) floating-point cents leaking into the kernel as anything other than a display projection, which silently poisons every downstream comma identification; (2) `AudioContext` lifecycle leaks during `observable preview` hot-reload, which silently kills audio after a few edits; and (3) visualization eating Phase 1 before the kernel is solid. All three are avoidable with architecture decisions made in Phase 1.

## Key Findings

### Recommended Stack

The core stack is Observable Framework v1.13.4 as the publishing layer, with the xenharmonic-devs npm ecosystem as the math/audio kernel. `fraction.js` v5 (BigInt-backed) handles arbitrary-precision rational arithmetic — this is non-negotiable, as Number-backed fraction libraries silently lose precision past 2^53. `sw-synth` handles Web Audio playback of arbitrary Hz values without Tone.js overhead. `ji-lattice` computes 2D lattice coordinates (D3 renders them). Scala `.scl`/`.kbm` parsing is a hand-write: ~150 lines, no maintained npm alternative exists. TypeScript yes, but Framework transpiles via esbuild and does NOT type-check — `tsc --noEmit` must run in CI separately.

**Core technologies:**
- `@observablehq/framework` v1.13.4: static site + reactive Markdown — the entire reason for the architecture
- `fraction.js` v5.3.4 (via `xen-dev-utils`): BigInt rational arithmetic — no prime-limit ceiling, exact round-trips
- `xen-dev-utils` v0.13.1: foundational JI utilities (monzo, cents, primes) — used in Scale Workshop production
- `sonic-weave` v0.14.1: scale DSL + construction utilities — same author as `xen-dev-utils`, kept in sync
- `sw-synth` v0.4.0: Web Audio synth for arbitrary Hz — purpose-built for microtonal playback, no Tone.js dependency
- `ji-lattice` v0.3.2: JI→2D coordinate layout — compatible with `xen-dev-utils@0.13.x`
- `@observablehq/plot` v0.6.17: declarative charts — Framework-native, use before reaching for D3
- `d3` v7.9.0: SVG primitives for lattice rendering — pair with `ji-lattice` coordinates
- Custom `src/lib/scala.ts`: Scala `.scl`/`.kbm` I/O — write it, ~150 lines, no npm alternative

One version compatibility warning: `temperaments` v0.5.3 was last released Mar 2024 against `xen-dev-utils@^0.2.7` — verify peer-dep alignment before depending on it; consider vendoring needed functions.

### Expected Features

The differentiator is prose + computation integration. Existing tools (Scale Workshop, xen-calc, x31eq) are calculator UIs with sidebars. None treat theory writing as a peer to computation. This notebook is the overlap of "scientific notebook" and "microtonal calculator" — a shape that doesn't yet exist in the wild.

**Must have (v1 — composition page end-to-end + reusable primitives):**
- Arbitrary-precision `Fraction` (BigInt) — root of everything; all else depends on it
- Ratio ↔ cents ↔ monzo conversions; cents-from-12tet (signed); octave reduction; interval ops
- Tenney height + Benedetti height; prime-limit + odd-limit
- Build scale from text input (ratios/cents/monzos); sort, dedupe, mode rotation
- Scala `.scl` export + import; `.kbm` export — user's stated v1 outputs
- Click-to-play interval, arpeggio scale audition, drone + interval (Web Audio)
- Markdown + reactive cells (Framework baseline); KaTeX math typesetting
- Reusable `src/lib/` module; inline play-interval widget pattern
- Composition page: full dashboard for the in-progress piece
- One additional theory page proving generality; static-site build deployable

**Should have (v1.x — after composition page ships):**
- Lattice visualization (configurable prime basis, D3 + `ji-lattice`)
- Tonality diamond (configurable odd-limit)
- Named comma identification (monzo lookup table)
- EDO ↔ JI mapping table; MOS / generator-period scale construction
- Comparison cell (two scales side-by-side); persistent URLs for scales
- Scale-on-keyboard SVG; per-page scale export component
- Citations / bibliography; Plomp-Levelt dissonance curve

**Defer (v2+):**
- Temperament browser (regular-temperament math from comma list) — highest research value but most implementation complexity; don't attempt in v1
- Ratio-to-comma decomposition; periodicity blocks (Fokker); harmonic entropy; 3D lattice
- SonicWeave embedding as an in-cell DSL

**Anti-features (never build):**
- Engraved JI staff notation (HEJI2/Sagittal/Johnston) — conflicts with the ratio-native data model
- MIDI input/output, MTS/SysEx — `.scl`/`.kbm` is the bridge to external tools
- Full DAW / sequencer; user accounts / cloud storage; real-time collaboration

### Architecture Approach

Three strict layers: (1) a pure math kernel (`src/lib/`) — TypeScript, no DOM, no audio, Vitest-testable; (2) a component layer (`src/components/`, `src/audio/`) — DOM-returning factories and the audio lifecycle wrapper; (3) a page layer (`src/*.md`, `src/pages/*.md`) — Markdown prose with reactive cells that import and wire the kernel and components. Data flows inward to the kernel (text → parser → `Interval`/`Scale`) and outward to the DOM (`Scale` → component → `HTMLElement`). `Interval` is the universal currency across module boundaries — wraps an exact `Fraction` with lazy monzo and lazy cents. Build-time data loaders (`src/data/*.json.ts`) precompute static catalogs. The composition's pitch material lives in `src/lib/pieces/<piece>.ts` — one source of truth imported by any page that needs it.

**Major components:**
1. `src/lib/interval.ts` — `Interval` class: BigInt `Fraction` + lazy monzo + lazy cents; all interval arithmetic
2. `src/lib/monzo.ts` — prime-factor vector helpers (wrap `xen-dev-utils`, don't reimplement)
3. `src/lib/scale.ts` — `Scale` model: ordered `Interval[]` + `period`; rotate, reduce, dedupe, transpose
4. `src/lib/scala.ts` — Scala `.scl`/`.kbm` parse + serialize; hand-written, ~150 lines
5. `src/lib/pieces/<piece>.ts` — composition's pitch material; single source of truth
6. `src/audio/synth.ts` — `sw-synth` wrapper; lazy `AudioContext`; `dispose()` via `invalidation`
7. `src/components/play-interval.ts` — prototype inline widget; pattern for all other widgets
8. `src/components/lattice.ts` — D3 lattice renderer consuming `ji-lattice` coordinates (Phase 2)
9. `src/data/*.json.ts` — build-time loaders for named commas, prime tables

### Critical Pitfalls

1. **Floating-point cents as interchange format** — `Interval` must hold `Fraction` (BigInt) as the single source of truth; cents is a display projection only. `fromCents()` exists but is explicitly flagged lossy. Any function inside `src/lib/` that takes `cents: number` (other than `fromCents`) is a bug surface. Match commas by canonical monzo, not by cents-within-epsilon.

2. **`AudioContext` lifecycle leaks during hot-reload** — Top-level `new AudioContext()` at module scope is fatal: browsers refuse it or cap at ~6 contexts. Use the factory pattern: `createSynth()` returns a wrapper that lazily creates the context on first user gesture. Every page that has audio gets exactly one `const synth = createSynth(); invalidation.then(() => synth.dispose())` cell.

3. **Composition page drifts from the general toolkit** — Two failure modes: toolkit grows speculative features that don't serve the piece, or the piece hardcodes ratios inline and stops using the kernel. Enforce via: composition-as-module (`src/lib/pieces/<piece>.ts`), Vitest CI test asserting the piece module's shape, and a rule that every kernel feature must have a concrete caller in the piece module before merging.

4. **Visualization eating Phase 1** — Lattice diagrams are compelling and D3 has infinite surface area. Phase 1 success criteria must explicitly defer anything beyond `scale-table.ts`. Kernel + tests + audio + Scala I/O ship before the lattice starts.

5. **Reinventing what `xen-dev-utils` already provides** — Before writing any math primitive, grep `xen-dev-utils` and `sonic-weave` exports. Wrap, don't reimplement. Maintain `src/lib/INVENTORY.md` listing which functions delegate to upstream vs. custom.

Additional Phase 1 pitfalls: `.scl` format edge cases (cents detection by `.` presence, implicit `1/1`, `100.` trailing-dot, comment line counting); audio click/pop without ADSR envelopes; polyphony explosion from untracked voice IDs; `Scale`/`Tuning`/`Mode` type conflation; octave-reduction with non-2/1 periods; monzo length-mismatch arithmetic. Framework-specific: TypeScript not type-checked by the transpiler (run `tsc --noEmit` in CI from day one); `.js` extension required on all imports even for `.ts` source.

## Implications for Roadmap

Based on research, the phase structure is driven by strict dependency order: the kernel enables everything; the composition page validates the kernel; visualization and analysis extend from there. The temperament browser is a mountain and belongs in a dedicated late phase.

### Phase 0: Project Bootstrap
**Rationale:** Must exist before any kernel work.
**Delivers:** Framework project scaffold, TypeScript config, `tsc --noEmit` in CI, Vitest config, npm lockfile, `.nvmrc` (Node 20 LTS), `observablehq.config.ts`, xenharmonic-devs stack installed, deployment target chosen.
**Avoids:** TypeScript-not-type-checked pitfall; pnpm module-resolution quirks; Observable deploy deprecation.
**Research flag:** Standard patterns — no research phase needed.

### Phase 1: Math Kernel + Composition Page (MVP)
**Rationale:** Every downstream feature depends on `Interval` + `Scale` being correct. The composition page is the concrete validator.
**Delivers:** `Interval`, `Scale`, `scala.ts`, `synth.ts`, `play-interval.ts` widget prototype, `scale-table.ts`, composition page (full dashboard), one additional theory page proving generality, static-site build verified deployable.
**Addresses:** All P1 features from FEATURES.md.
**Avoids:** Floating-point cents in kernel; AudioContext lifecycle leaks; composition drift; `.scl` edge cases; click/pop audio; polyphony explosion; Scale/Tuning/Mode conflation; octave-reduction with non-octave periods; monzo arithmetic edge cases; visualization pulling scope.
**Research flag:** Standard patterns — no research phase needed.

### Phase 2: Visualization + Mobile Audit
**Rationale:** Lattice and tonality diamond require a working kernel. Mobile Safari audio must be verified before audio is "done."
**Delivers:** `lattice.ts` (D3 + `ji-lattice`, configurable prime basis), `tonality-diamond.ts`, `keyboard.ts`, KaTeX math typesetting, named-comma lookup table, per-page scale export component, mobile Safari test pass.
**Addresses:** P2 features from FEATURES.md (lattice, diamond, comma identification, per-page export).
**Avoids:** `.kbm` reference-frequency confusion (introduce explicit `KbmMapping` type); sub-cent display precision (default 0.1¢, JND tooltip).
**Research flag:** `ji-lattice` API is public; D3 lattice patterns are standard. May need a brief spike on the `ji-lattice` → D3 rendering interface. Low research overhead.

### Phase 3: Analysis Features
**Rationale:** EDO ↔ JI mapping, MOS construction, and comparison cells are high-value for theory work but don't block Phase 1 or 2.
**Delivers:** EDO ↔ JI mapping table, MOS / generator-period scale construction, comparison cell, persistent URLs (URL hash), Plomp-Levelt dissonance curve, citations / bibliography.
**Addresses:** Remaining P2 features from FEATURES.md.
**Avoids:** `temperaments` peer-dep misalignment (verify before depending on it; vendor if needed).
**Research flag:** `moment-of-symmetry` is documented; Plomp-Levelt is published. Verify `temperaments` peer-dep before planning this phase. Medium confidence.

### Phase 4: Deep Theory (Temperament Browser)
**Rationale:** Hardest math on the list; uncertain library situation; lowest "this blocks the piece" urgency. Own phase with research backing.
**Delivers:** Temperament browser (paste comma list → mappings/error/complexity), ratio-to-comma decomposition, harmonic entropy (optional), Scala archive browser (optional).
**Addresses:** P3 features from FEATURES.md.
**Research flag:** Needs `/gsd-research-phase`. Regular-temperament math is niche; `temperaments` library may need vendoring or partial porting from Python.

### Phase Ordering Rationale

- Kernel before UI: `Interval` precision is the root of correctness; retrofitting it means rewriting every consumer.
- Composition page in Phase 1: validates the kernel is complete and the kernel→component→page wiring works end-to-end.
- Visualization in Phase 2: requires a working kernel and audio; building against stubs causes rework.
- `.scl` I/O in Phase 1 (not Phase 2): it's a stated v1 output, and the `.scl` parser test corpus is a Phase 1 kernel deliverable.
- Temperament browser in Phase 4: math complexity and uncertain library situation justify a research-backed standalone phase.

### Research Flags

Needs research before planning:
- **Phase 4 (Temperament Browser):** Regular-temperament math is niche; `temperaments` library peer-dep situation unresolved; may need to vendor or port. Flag for `/gsd-research-phase`.

Standard patterns (skip research phase):
- **Phase 0:** Observable Framework scaffold is well-documented.
- **Phase 1:** xenharmonic-devs ecosystem is well-documented; Huygens-Fokker spec is definitive.
- **Phase 2:** `ji-lattice` API is public; D3 lattice patterns are standard; mobile Safari Web Audio quirks documented on MDN.
- **Phase 3:** `moment-of-symmetry` documented; Sethares/Plomp-Levelt published. Verify `temperaments` peer-dep before starting.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against npm registry, GitHub releases, Scale Workshop production usage. One MEDIUM exception: `temperaments` peer-dep alignment with current `xen-dev-utils`. |
| Features | HIGH | Well-established domain; reference tools provide clear feature landscape; explicit scoping in PROJECT.md reduces ambiguity. |
| Architecture | HIGH | Follows Observable Framework's documented conventions and xenharmonic-devs production patterns. The three-layer model is not speculative. |
| Pitfalls | HIGH | JI math pitfalls grounded in Huygens-Fokker spec and xenharmonic-devs source. Web Audio pitfalls grounded in MDN. Framework pitfalls grounded in framework docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **`temperaments` peer-dep situation:** Validate before Phase 3 planning; vendor specific functions if the peer-dep is misaligned with `xen-dev-utils@0.13.x`.
- **Composition pitch material:** The actual ratios for the in-progress piece will drive `src/lib/pieces/<piece>.ts` design — nail down piece naming and initial scale in Phase 1 planning.
- **Deployment target:** Choose a concrete static host (GitHub Pages, Cloudflare Pages, S3) in Phase 0 to wire CI/CD from the start.
- **KaTeX wiring:** Verify the specific `observablehq.config.ts` head-injection pattern for KaTeX in Phase 0 setup.

## Sources

### Primary (HIGH confidence)
- Observable Framework GitHub releases + docs — conventions, TypeScript transpile behavior, data loaders, reactivity, invalidation
- `xen-dev-utils`, `sonic-weave`, `sw-synth`, `ji-lattice`, `moment-of-symmetry` npm pages — verified versions, TypeScript, active maintenance
- `fraction.js` GitHub README — confirmed BigInt internals since v5
- Scale Workshop `package.json` (xenharmonic-devs/scale-workshop) — production reference for which packages compose
- Huygens-Fokker `.scl` format spec — canonical Scala format reference
- Web Audio API (MDN) — AudioContext lifecycle, autoplay policy, user-gesture requirement
- Observable Framework docs (reactivity, imports, data loaders, JavaScript/TypeScript)

### Secondary (MEDIUM confidence)
- `temperaments` v0.5.3 on npm — version verified HIGH; compatibility with current `xen-dev-utils` MEDIUM (last released 2024)
- Observable Framework pnpm discussion #1606 — npm as safest package manager
- Xen Wiki (Tenney height, Benedetti height, MOS, odd-limit) — standard definitions
- Sethares — Relating Tuning and Timbre — Plomp-Levelt algorithm reference
- Scale Workshop user guide (legacy) — feature enumeration reference

### Tertiary (LOW confidence / judgment calls)
- Project-shape pitfalls (composition drift, visualization temptation) — based on project structure analysis; validate empirically as the project progresses

---
*Research completed: 2026-05-02*
*Ready for roadmap: yes*
