<!-- GSD:project-start source:PROJECT.md -->
## Project

**Tuning Systems**

A research notebook + JI calculator built as an Observable Framework site — Markdown prose on tuning-systems theory living side-by-side with reactive JavaScript cells that compute, visualize, and audition just-intonation intervals. Built first to support a specific composition in progress, but architected as a clean, generalizable toolkit for ongoing tuning research.

**Core Value:** I can design any JI scale (arbitrary ratios, no prime-limit ceiling), see it expressed as ratios and cents-from-12tet, hear it, and export it to Scala `.scl`/`.kbm` — all from a self-hosted notebook where the calculator and the research prose live together.

### Constraints

- **Tech stack**: Observable Framework — chosen for reactive cells + Markdown authoring + static-site output + git-versioned source.
- **Language**: JavaScript / TypeScript — required by the Framework runtime.
- **Math precision**: arbitrary-precision rational arithmetic required (no prime-limit ceiling means bigint-backed fractions, not floats).
- **Audio**: in-browser only (Web Audio API) — no native synth bridge in v1.
- **Notation surface**: ratios + cents + cent-deviation-from-12tet only — no staff engraving.
- **Distribution**: static site, self-hostable — no required server, no external platform dependency.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## TL;DR
## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@observablehq/framework` | **1.13.4** (Mar 2026) | Static-site generator with reactive cells + Markdown authoring | Exactly the user's requirement: Markdown research notes interleaved with reactive JavaScript cells, static-site output, git-versioned source, self-hostable. No platform lock-in. Active development — patch releases continued through Mar 2026. |
| `xen-dev-utils` | **0.13.1** (Apr 2026) | Foundation: `Fraction`, monzo helpers, `arraysEqual`, combinatorics, frequency/cents conversion | The shared utility layer for the entire xenharmonic-devs stack. Re-exports `Fraction` from `fraction.js`. TypeScript. Actively maintained. |
| `sonic-weave` | **0.14.1** (Apr 2026) | DSL for scales, ratios, tempering — usable as a library or via template tags | Successor to Scale Workshop 2's syntax; the modern lingua franca for programmatic scale construction. Embeddable as a TypeScript npm package OR usable via tagged-template literals (`sw\`12@\`` etc.). Lets you author scales in a domain-fit syntax inside JS code. |
| `fraction.js` | **5.3.4** (Aug 2025, transitive via `xen-dev-utils`) | Arbitrary-precision rational arithmetic — `BigInt` numerator + denominator | **This is the answer to the bigint-rational requirement.** v5 rewrote the internals to use native `BigInt` for both numerator and denominator (v4 was Number-based and silently lost precision past 2^53). Handles `81/79` and far larger ratios exactly. No prime-limit ceiling. |
| `sw-synth` | **0.4.0** (May 2026) | Lightweight polyphonic Web Audio synthesizer designed for arbitrary frequencies | Purpose-built for microtonal playback. Raw Web Audio (no Tone.js dependency). Four voice classes: `Synth`, `UnisonSynth`, `AperiodicSynth`, `BufferSynth`. Same authors as the rest of the stack — frequencies are passed as Hz values (not MIDI notes), which is exactly what JI needs. |
| `ji-lattice` | **0.3.2** (Apr 2026) | Algorithms for projecting JI + ET scales to 2D screen coordinates | Solves the lattice / tonality-diamond layout problem natively. Outputs coordinates; you render with Plot/D3/SVG. Depends on `xen-dev-utils@^0.12.2` (compatible). |
| `moment-of-symmetry` | **0.10.0** (Apr 2026) | MOS scale generation + analysis | Useful when you want generator-and-period scale construction (Pythagorean chains, meantone variants, etc.). Optional but cheap. |
| `@observablehq/plot` | **0.6.17** (Apr 2026, ships with Framework) | High-level declarative plotting (grammar of graphics) | Idiomatic visualization library inside Framework — comes preinstalled. Excellent for ratio scatter plots, cents-deviation bars, scale-on-keyboard rectangles. Drop down to D3 for the lattice. |
| `d3` | **7.9.0** (May 2025) | Low-level visualization primitives | Use for the lattice / tonality-diamond renderer (force-directed layout, SVG primitives, zoom/pan, hover tooltips). `ji-lattice` produces coordinates; D3 draws them. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `temperaments` | 0.5.3 (Mar 2024) | Regular-temperament mappings, comma analysis | When you need the temperament-conversion / comma-analysis features. Note: hasn't released since 2024 and depends on older `xen-dev-utils@^0.2.7` and `mathjs@^12` — confirm peer-dep alignment before adopting; consider pinning or vendoring relevant fns if it conflicts. **MEDIUM confidence — the older API surface is the only friction point.** |
| `xen-midi` | 0.4.1 (Apr 2026) | Free-pitch polyphonic MIDI I/O via webmidi.js multi-channel pitch-bend | Out of scope for v1 per PROJECT.md, but worth knowing it exists if MIDI gets added later. |
| `harmonic-entropy` | 0.3.1 (Apr 2026) | Compute harmonic entropy of intervals | Optional — only if you want HE-based dissonance curves in research notes. |
| `aperiodic-oscillator` | 0.3.2 (Apr 2026, transitive via `sw-synth`) | Non-periodic OscillatorNode replacement for inharmonic timbres | Useful for inharmonic timbres (e.g., bell-like spectra to match a JI scale's natural intervals). Transitive — you don't install it directly. |
| Custom `scl-kbm` module | n/a (write it) | Parse + serialize Scala `.scl` and `.kbm` files | **There is no maintained npm package for `.scl`/`.kbm` parsing in pure JS.** The format is ~50-line specification (`!` comments, line 2 = description, line 3 = pitch count, then N pitch values that are either ratios `5/4` or cents `408.0`). Write it yourself in `src/lib/scala.ts`. Use Scale Workshop's source as a reference for edge cases. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| **npm** | Package manager | Framework defaults to npm in `npx @observablehq/framework create`; pnpm works but has known symlink quirks with Framework's module resolution (per Framework discussion #1606). Stick with npm unless you have a strong reason. |
| **Node 20 LTS** (or 22 LTS) | Runtime | Framework requires `>=18` per `package.json#engines`, but 20 LTS is the current safe floor in 2026. Pin in `.nvmrc`. |
| **TypeScript 5.6+** (currently 6.0.3) | Type checking | Framework transpiles `.ts` files transparently but **does not type-check**. Run `tsc --noEmit` separately as a `lint:types` script and in CI. `observablehq.config.ts` (TS config file) is supported. |
| **Prettier** | Formatting | Standard. Framework has no opinion. Use `.prettierrc` with `"singleQuote": true` if you like; defaults are fine. |
| **ESLint 9 (flat config)** | Linting | Optional but recommended. Use `@typescript-eslint` and `eslint-plugin-import`. Don't lint markdown JS code blocks — Framework's transpiler handles those. |
| **Vitest** | Unit tests for the math kernel | Use to test `Fraction`/monzo/scale logic in `src/lib/`. Same testing tool Scale Workshop uses. The Framework runtime layer doesn't need tests — your library code does. |
## Installation
# Bootstrap a Framework project (interactive)
# Math + audio kernel (the xenharmonic-devs stack)
# Optional: temperaments and harmonic-entropy if you need them
# fraction.js comes transitively via xen-dev-utils, but pin it explicitly
# if you want to hold a known version:
# Visualization — Plot ships with Framework, D3 is preinstalled
# but make D3 explicit if you want a particular version:
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `fraction.js` v5 (BigInt) | `BigRational.js` (peterolson) | Last meaningful release ~2017; deprecated tone in issues. Don't. |
| `fraction.js` v5 (BigInt) | `bi-fraction` | Niche, much smaller userbase. Use only if you specifically prefer its API and want to avoid `xen-dev-utils`. |
| `fraction.js` v5 (BigInt) | `mathjs` `Fraction` | `mathjs` is heavy (~600KB) and its `Fraction` is itself a thin wrapper around `fraction.js` underneath. If you want only Fractions, use `fraction.js` directly. Pull in `mathjs` only if you also want symbolic algebra / matrices for tempering math. |
| `fraction.js` v5 (BigInt) | `fractional` (npm) | Number-backed, not BigInt — silently loses precision for large ratios. **Disqualified.** |
| `sw-synth` | Tone.js | Tone.js is excellent and battle-tested (v15.1.22), and you *can* drive arbitrary frequencies via `Tone.Oscillator.frequency.value = hz` or `.detune.value = cents`. Pick Tone.js if you also want effects, transports, sequencers, sampler instruments. Pick `sw-synth` if you want a small, JI-native synth with no extra abstractions. For this project's "audition the scale" v1 scope, `sw-synth` is the right size. |
| `sw-synth` | Raw Web Audio | Always an option. `sw-synth` is ~thin (depends only on `aperiodic-oscillator`), so you're not buying much abstraction debt. Drop down to raw `AudioContext`/`OscillatorNode` only if `sw-synth` lacks a feature you need. |
| Observable Plot + D3 | Vega-Lite (6.4.3) | Vega-Lite is a great declarative grammar but is *not* idiomatic inside Framework — Framework's house style is Plot. Adds a non-native dependency and a JSON-spec authoring layer between you and the data. Skip. |
| Custom SCL/KBM parser | `monochord-core`, `tune.js`, `microtonal` (npm) | All last-published 2017–2018, no recent activity, thin documentation. None handle KBM. Don't depend. |
| Custom SCL/KBM parser | Port code from Scale Workshop | Reasonable middle path if you want a head start — Scale Workshop's parser is MIT-licensed. Read its source, keep what you need. |
| `npm` | `pnpm` | Works but known module-resolution quirks with Framework (GitHub discussion #1606 — symlinks, file: deps). Use only if you already have a pnpm monorepo. |
| `npm` | `yarn` (Berry / PnP) | PnP is hostile to many tools' resolution; classic Yarn is fine but no advantage over npm here. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `fractional` (npm package) | Number-backed (no BigInt). Loses precision for any ratio whose numerator or denominator > 2^53. Will give you wrong answers for serious JI math. | `fraction.js` v5 |
| `BigRational.js` (peterolson) | Unmaintained since ~2017. Its own README points to the newer ecosystem. | `fraction.js` v5 |
| `tune.js` (fuki, 2017) | Last published 2017. Web Audio API has moved on; tied to old assumptions. | `sw-synth` |
| `monochord-core`, `mosfez-synth`, `microtonal` | All published 2017–2022, no recent activity. None of them are what xenharmonic practitioners reach for in 2026. | `sw-synth` + `xen-dev-utils` |
| `tonal.js` / `tonaljs` for JI math | Tonal is excellent for **12-TET** music theory (chord/key/scale names, intervals as semitones). It has no concept of arbitrary-prime-limit ratios or monzos. Wrong tool for this domain. | `xen-dev-utils` + `sonic-weave` |
| Floating-point cents as your source of truth | Round-trip from ratio → cents → ratio loses the prime structure. Any function that takes `cents: number` for a JI ratio is a bug surface. | Keep ratios as `Fraction` (BigInt) or monzo arrays as the source of truth; derive cents only at the display layer. |
| `mathjs` BigNumber for ratios | `BigNumber` is decimal arbitrary-precision, not rational — `1/3` is still inexact. | `fraction.js` v5 (rational) |
| Observable Framework's `deploy` command (to Observable Cloud) | Deprecated as of v1.13.3 (Apr 2025). | Build static output (`observable build`) and host on GitHub Pages, S3, Cloudflare Pages, or any static host. |
| Three.js for the lattice in v1 | Overkill for 2D lattice/tonality-diamond. Adds ~600KB. Reserve for if/when you build a 3D lattice (Tenney-Euclidean space, etc.) — not v1. | D3 + SVG via `ji-lattice` coordinates |
| Hand-written staff-engraving / HEJI2 / Sagittal | Already explicitly out of scope per PROJECT.md, but worth restating: do not let yourself be pulled into Verovio/Vexflow/Lilypond rabbit holes. | Ratio + cents-deviation display only |
## Stack Patterns by Variant
- Math kernel: `xen-dev-utils` + `sonic-weave` + custom `scala.ts`
- Audio: `sw-synth` (one polyphonic synth, click-to-play, click-to-arpeggiate)
- Viz: Plot for ratio/cents charts, D3 + `ji-lattice` for the lattice
- No `temperaments`, no `harmonic-entropy`, no `xen-midi`
- Skip MOS unless your composition needs it
- Add `temperaments` for regular-temperament theory (verify peer-dep alignment first; may need to vendor)
- Add `harmonic-entropy` for dissonance curves
- Add `moment-of-symmetry` for generator/period scale exploration
- Consider `xen-midi` if you start driving external synths
- Swap `sw-synth` for Tone.js when you need: effects chains, transport/sequencer, samplers, complex envelopes
- Or *add* Tone.js alongside `sw-synth` — they coexist (both write to the same `AudioContext`)
- Framework supports React (`npm:react`, `npm:react-dom`) and arbitrary npm UI libs in `.js`/`.ts` components — but for this project's scope (research notebook, not a UI app), prefer plain Markdown + reactive cells + small custom Web Components.
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `xen-dev-utils@0.13.1` | `ji-lattice@0.3.2` (peer `^0.12.2`) | ✅ Compatible — `ji-lattice` accepts the 0.13 line. |
| `xen-dev-utils@0.13.1` | `temperaments@0.5.3` (peer `^0.2.7`) | ⚠️ **Mismatch.** `temperaments` was last released Mar 2024 against the old utils API. Likely still works at runtime (the `Fraction` and basic types haven't reshaped), but no guarantee. **Test before relying.** If you need `temperaments`, either pin both packages tightly, fork it, or vendor the specific functions you need. |
| `sonic-weave@0.14.1` | `xen-dev-utils@0.13.1` | ✅ Same author, kept in sync. |
| `sw-synth@0.4.0` | Web Audio API (modern browsers) | ✅ Standard Web Audio. No browser-version footguns in 2026. |
| `@observablehq/framework@1.13.4` | Node `>=18` (use 20 LTS) | ✅ Per `package.json#engines`. Use 20 LTS as safer floor. |
| `@observablehq/framework@1.13.4` | TypeScript `^5.6`+ | ✅ Framework transpiles via esbuild; any modern TS works. Run `tsc --noEmit` separately for type-checking. |
| `@observablehq/framework@1.13.4` | `@observablehq/plot@0.6.17` | ✅ Bundled / aligned. |
| `@observablehq/framework@1.13.4` | `react@19` | ✅ Fixed in v1.13.1 (Jan 2026). |
## Observable Framework Conventions (project layout)
- Markdown pages contain ` ```js ` and ` ```ts ` fenced reactive cells.
- TypeScript modules: import with the **`.js` extension** (`import { parseScl } from './lib/scala.js'`) — Framework transpiles `.ts` to `.js` at build, and the runtime resolves the `.js` URL.
- Data loaders: file named `foo.json.ts` produces a static `foo.json` at build time; access via `FileAttachment("foo.json").json()`.
- Components: define as plain TS modules exporting functions/classes; `import { renderLattice } from "./components/lattice.js"` from any markdown page.
- Reactive cells use Observable's reactivity: declarations like `const scale = ...` in one cell are visible to all later cells; cells re-run when their inputs change.
- Audio note: don't `new AudioContext()` at module top-level — browsers require user gesture. Wire `sw-synth` initialization to a button-click cell.
## Sources
- [Observable Framework releases (GitHub)](https://github.com/observablehq/framework/releases) — verified v1.13.4 latest, Mar 2 2026 — HIGH
- [Observable Framework `package.json` engines on npm](https://www.npmjs.com/package/@observablehq/framework) — verified `>=18` Node requirement — HIGH
- [Observable Framework JavaScript docs](https://github.com/observablehq/framework/blob/main/docs/javascript.md) — verified TypeScript via `.ts` blocks, no type-check, import as `.js` — HIGH
- [Observable Framework getting-started docs](https://github.com/observablehq/framework/blob/main/docs/getting-started.md) — install command, Node 18+, scaffolding flow — HIGH
- [Observable Framework deploying docs](https://github.com/observablehq/framework/blob/main/docs/deploying.md) — static-host targets, GitHub Pages workflow — HIGH
- [xen-dev-utils on npm](https://www.npmjs.com/package/xen-dev-utils) — verified v0.13.1 (Apr 2026), TypeScript, "utility functions used by the Scale Workshop ecosystem" — HIGH
- [sonic-weave on npm](https://www.npmjs.com/package/sonic-weave) — verified v0.14.1 (Apr 2026), TypeScript, embeddable + DSL — HIGH
- [sw-synth on npm](https://www.npmjs.com/package/sw-synth) — verified v0.4.0 (May 2026), raw Web Audio, four voice classes — HIGH
- [ji-lattice on npm](https://www.npmjs.com/package/ji-lattice) — verified v0.3.2 (Apr 2026), peer-dep `xen-dev-utils@^0.12.2` — HIGH
- [moment-of-symmetry on npm](https://www.npmjs.com/package/moment-of-symmetry) — verified v0.10.0 (Apr 2026) — HIGH
- [temperaments on npm](https://www.npmjs.com/package/temperaments) — verified v0.5.3 (Mar 2024), older peer-deps — HIGH for version, MEDIUM for compatibility-with-current-utils
- [fraction.js on npm](https://www.npmjs.com/package/fraction.js) — verified v5.3.4 (Aug 2025), BigInt internals — HIGH
- [Fraction.js GitHub README](https://github.com/rawify/Fraction.js) — confirmed BigInt numerator/denominator since v5 — HIGH
- [Scale Workshop `package.json`](https://github.com/xenharmonic-devs/scale-workshop/blob/main/package.json) — production reference: which xenharmonic packages get used together — HIGH
- [Scala .scl format spec (Huygens-Fokker)](https://www.huygens-fokker.org/scala/scl_format.html) — verified the format is small enough to parse by hand — HIGH
- [Tone.js npm](https://www.npmjs.com/package/tone) — verified v15.1.22 current; comparison context only — HIGH
- [Observable blog: TypeScript Language Server](https://observablehq.com/blog/bringing-the-typescript-language-server-to-observable) — context on Observable's TS story (notebook-focused, but informs Framework story) — MEDIUM
- [Framework discussion #1606 — pnpm + Framework](https://github.com/observablehq/framework/discussions/1606) — confirms npm is the safest package manager — MEDIUM
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
