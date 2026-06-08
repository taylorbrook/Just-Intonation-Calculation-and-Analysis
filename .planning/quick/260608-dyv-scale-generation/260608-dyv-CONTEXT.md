# Quick Task 260608-dyv: Scale generation feature — Context

**Gathered:** 2026-06-08
**Status:** Ready for research + planning
**Mode:** plan + research only (no code execution this run)

<domain>
## Task Boundary

Design (plan) a new **scale generation** feature for the Tuning Systems notebook:
a surface where the user can generate JI / tempered / harmonic scales in a wide
variety of ways, audition/preview them, and get them into the existing Dashboard
(`/`) and Analysis (`/pages/analysis`) surfaces. Deep research into (a) the full
menu of scale-generation methods and (b) the most interesting/useful interfaces
is part of the deliverable.

This run produces RESEARCH.md + PLAN.md only. No source edits.
</domain>

<decisions>
## Implementation Decisions (LOCKED — do not revisit)

### Surface — new dedicated tab
- Build a new page at `src/pages/generate.md` (nav label "Generate"), added to
  `observablehq.config.ts` pages between "Analysis" and "Theory notes".
- Rationale: the Dashboard is already a dense vertical stack (scaleTable +
  audioPanel + sclIo + lattice + tonalityDiamond + keyboard); a multi-method
  generator needs room. The new tab keeps the dashboard uncluttered and matches
  the existing 3-surface mental model (Design / Analyze / Generate).
- A method picker (dropdown/segmented) selects the generation family; params +
  live preview table + audition render below; "Send to Dashboard" / "Send to
  Analysis" actions push the result.

### Methods — ALL FOUR families in scope (user wants the full breadth)
The user explicitly wants "a wide variety." Research must survey the full menu;
the plan should sequence them but cover all four families:
1. **Regular / equal temperament** — EDO and equal divisions of any interval
   (ED2/ED3/EDn), rank-2 regular temperaments (generator+period beyond MOS),
   well-temperaments. Builds on existing `edo.ts` + `mos.ts`.
2. **JI combinatorial** — Combination Product Sets (Hexany, Dekany, Eikosany),
   Euler-Fokker genera, tonality diamonds, odd/prime-limit lattices. Leverages
   existing `diamond.ts`.
3. **Harmonic & interval divisions** — harmonic & subharmonic segments
   (e.g. 8:9:…:16), arithmetic/equal divisions of an arbitrary interval,
   isoharmonic chords.
4. **Advanced / algorithmic** — Fokker periodicity blocks, Wilson recurrence /
   metallic-ratio scales, Stern-Brocot / Farey subsets, harmonic-entropy-guided.

### Integration — live shared state
- A generated scale integrates with Dashboard + Analysis via **live shared
  state**, not just manual copy/paste.
- HARD CONSTRAINT (user's regression sensitivity): this MUST be **additive** and
  MUST NOT destabilize the existing, working Dashboard/Analysis pages. The proven
  in-repo precedent is the theme-prefs system: a small pure state module
  (`src/theme/theme-prefs.ts`) backed by `localStorage` under a namespaced key
  that broadcasts a `CustomEvent("tuning-systems:theme-prefs-changed")`. Mirror
  that pattern for a "current scale" shared store
  (e.g. `tuning-systems:scale` + `tuning-systems:scale-changed`), and keep the
  existing `#s=` URL-hash protocol (`src/lib/url.ts`) as the transport/persistence
  backbone. Existing pages opt IN by listening for the event; their current
  seed/hash behavior must remain unchanged when the store is empty.
- Dashboard/Analysis textareas should be able to receive a pushed scale without
  breaking their current hash-read-at-boot and debounced-hash-write logic.

### Claude's Discretion
- Exact v1 method tranche / sequencing within the four families (plan decides,
  informed by research effort estimates).
- Component decomposition (one generic `generate.md` host + per-method Pattern-2
  factory components vs. a single multi-method component).
- Whether each method gets its own kernel module under `src/lib/` (CPS, periodicity
  blocks, harmonic segments, etc.) — follow the existing `mos.ts` / `diamond.ts`
  kernel-primitive precedent and three-layer purity discipline.
- Preview/audition affordances (reuse `scaleTable` + `playScale` per `mosBuilder`).
</decisions>

<specifics>
## Specific Ideas / Reuse Anchors

- **Import/transport backbone already exists:** `src/lib/url.ts`
  (`encodeScaleToHash` / `decodeHashToScale`, version byte, 8 KB cap). The
  Dashboard's "Analyze this scale →" button already does cross-page scale passing
  via `#s=`. Reuse this verbatim for "Send to …" actions.
- **UI template:** `src/components/mos-builder.ts` — Pattern-2 factory
  `(synth, opts) => HTMLElement`, closure-local state, createElement+textContent
  XSS discipline, status region, `replaceChildren` re-render, renders via
  `scaleTable` + `playScale`. The new method widgets should mirror this shape.
- **Existing generation kernel:** `buildMos`/`nearestMosSize` (`src/lib/mos.ts`),
  `jiSubsetOfEdo` (`src/lib/scale.ts`), `edo.ts`, `diamond.ts`, plus
  `Scale.rotate/reduce/transpose/dedupe`.
- **Shared-state precedent:** `src/theme/theme-prefs.ts` + `src/components/theme-head.ts`
  (localStorage namespace `tuning-systems:theme-prefs` + CustomEvent broadcast).
- **Kernel currency:** BigInt `Fraction` (`fraction.js@5.3.4`) is the source of
  truth (R-01 ESLint rule blocks Number-backed Fraction). Derive cents only at
  the display boundary (Pitfall #1). No prime-limit ceiling.
- **Page owns synth** (Pattern 4 / Pitfall #2): `generate.md` declares one
  `createSynth()` cell with `invalidation.then(synth.dispose)`.
</specifics>

<canonical_refs>
## Canonical References

- `CLAUDE.md` — stack + Observable Framework conventions (import `.ts` as `.js`,
  reactive cells, page-owned synth, no top-level AudioContext).
- `.planning/PROJECT.md` — v1.0 shipped scope; v2 candidates (TEMP-01..10) include
  several relevant parked items: regular-temperament mappings (TEMP-01),
  SonicWeave embedded DSL (TEMP-07), periodicity blocks / Fokker (TEMP-08).
- `src/lib/INVENTORY.md` — kernel symbol inventory + three-layer purity discipline.
</canonical_refs>
