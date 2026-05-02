# Architecture Research

**Domain:** Observable Framework site combining a reusable JI math kernel with multiple pages of tuning-systems research prose that embed live calculator widgets inline. In-browser audio (Web Audio via `sw-synth`), client-side reactive computation, static-site build, no backend.
**Researched:** 2026-05-02
**Confidence:** HIGH for Observable Framework conventions (verified against current docs — reactivity, data loaders, imports). HIGH for the recommended kernel boundaries (driven by the xenharmonic-devs ecosystem already chosen in STACK.md). MEDIUM for some stylistic choices (custom-element vs HTMLElement-returning-function for inline widgets — both work, project should pick one and stay consistent).

## TL;DR

A three-layer architecture:

1. **Pure math kernel** (`src/lib/`) — TypeScript modules, no DOM, no audio, no reactivity. The `Interval` class is the currency: a wrapper that holds an exact `Fraction` (BigInt) AND/OR a monzo, with lazy cents. `Scale` is an ordered list of `Interval`s plus a period. Pure functions only — fully unit-testable with Vitest.
2. **Component layer** (`src/components/`) — DOM-returning factories that take pure data in and return `HTMLElement`s. Lattice renderers, keyboard widgets, inline play-buttons, scale tables. Stateless aside from internal animation/audio handles, each accepting an `invalidation` promise for cleanup.
3. **Page layer** (`src/index.md`, `src/pages/*.md`) — Markdown prose with reactive `js`/`ts` code blocks that wire kernel + components together. Cells declare top-level state (`scale`, `baseHz`, `synth`); inline `${...}` expressions and component calls render widgets in prose.

Data flows **inward to the kernel** (text input → parser → `Interval`/`Scale`) and **outward to the DOM** (`Scale` → component → SVG/HTMLElement → page). Audio is a single page-scoped shared `synth` instance owned by one cell, registered with `invalidation` so it disposes on hot-reload or navigation.

Build-time data loaders (`src/data/*.json.ts`) precompute static catalogs (named commas, Scala archive imports, prime tables); runtime cells handle user input, computation, and audition. The composition's pitch material lives in a typed module (`src/lib/pieces/<piece>.ts`) that any page can import — that module is the single source of truth.

**Phase 1 candidate:** kernel (`Interval`, `Scale`, monzo, cents, octave-reduce) + Markdown harness + one inline `<play-interval>` widget + one full composition page. Everything else (lattice, EDO mapping, MOS, comma identification) builds on this foundation.

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PAGE LAYER (Markdown)                          │
│  src/index.md   src/pages/composition.md   src/pages/syntonic.md     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Prose paragraphs (Markdown + KaTeX)                         │    │
│  │  ```js                                                       │    │
│  │  const scale = parseScale(input);   ← reactive top-level    │    │
│  │  ```                                                         │    │
│  │  Inline: ${playInterval(scale.intervals[2], synth)}         │    │
│  │  Components: ${renderLattice(scale, {basis: [3,5,7]})}      │    │
│  └────────────┬─────────────────────────┬─────────────────┬────┘    │
└───────────────┼─────────────────────────┼─────────────────┼─────────┘
                │ imports                 │ imports         │ uses
                ▼                         ▼                 ▼
┌───────────────────────────────┐  ┌────────────────────┐  ┌──────────┐
│   COMPONENT LAYER             │  │   AUDIO LAYER      │  │  DATA    │
│   src/components/             │  │   src/audio/       │  │  LAYER   │
│  ┌─────────────────────────┐  │  │  ┌──────────────┐  │  │ src/data │
│  │ play-interval.ts        │  │  │  │ synth.ts     │  │  │ ┌──────┐ │
│  │ play-scale.ts           │  │  │  │ (sw-synth    │  │  │ │ *.   │ │
│  │ scale-table.ts          │  │  │  │  wrapper)    │  │  │ │ json │ │
│  │ lattice.ts (D3)         │  │  │  │ voice mgmt   │  │  │ │ .ts  │ │
│  │ tonality-diamond.ts     │  │  │  │ envelope     │  │  │ │      │ │
│  │ keyboard.ts             │  │  │  │ disposal     │  │  │ │ load-│ │
│  │ ratio-display.ts        │  │  │  └──────┬───────┘  │  │ │ ers  │ │
│  └────────────┬────────────┘  │  │         │ uses     │  │ └──┬───┘ │
└───────────────┼───────────────┘  └─────────┼──────────┘  └────┼─────┘
                │ uses pure data             │                   │ FileAttach
                ▼                             │                   ▼
┌─────────────────────────────────────────────┴──────────────────────┐
│                    MATH KERNEL (src/lib/)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ interval.ts  │  │ monzo.ts     │  │ scale.ts     │              │
│  │ Interval     │  │ toMonzo()    │  │ Scale        │              │
│  │ (Fraction +  │  │ fromMonzo()  │  │ rotateMode() │              │
│  │  monzo +     │  │ primeLimit() │  │ reduce()     │              │
│  │  lazy cents) │  │ benedetti()  │  │ octReduce()  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                      │
│  ┌──────┴────┐  ┌─────────┴───┐  ┌──────────┴──────┐               │
│  │ scala.ts  │  │ commas.ts   │  │ pieces/*.ts     │               │
│  │ parseScl  │  │ named lookup│  │ composition's   │               │
│  │ writeScl  │  │ table-driven│  │ pitch material  │               │
│  │ writeKbm  │  │             │  │ (single source) │               │
│  └───────────┘  └─────────────┘  └─────────────────┘               │
│                                                                     │
│  Depends on: fraction.js (BigInt), xen-dev-utils, sonic-weave       │
│  No DOM. No audio. No Framework runtime. Vitest-testable.           │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `src/lib/interval.ts` | Defines `Interval` — the universal currency. Wraps an exact `Fraction` and/or monzo; exposes `cents()`, `mul()`, `div()`, `inv()`, `octaveReduce()`, `equals()`. Pure, immutable. | TypeScript class wrapping `Fraction` from `fraction.js`. Constructed from `Fraction`, monzo array, ratio string `"5/4"`, or cents number. Internally caches monzo and cents on first compute. |
| `src/lib/monzo.ts` | Prime-factor-vector helpers. `toMonzo(fraction)`, `fromMonzo(vec)`, `primeLimit(monzo)`, `oddLimit(monzo)`, `tenneyHeight(monzo)`, `benedettiHeight(monzo)`. | Pure functions over `BigInt[]` arrays. Uses `xen-dev-utils` primitives where available; pads monzos to a common length for arithmetic. |
| `src/lib/scale.ts` | `Scale` model — ordered intervals + period (default `2/1`). Methods: `rotate(mode)`, `reduce()`, `dedupe()`, `transpose(by)`, `concat(other)`, `degreeToFreq(deg, baseHz)`. | Class holding `Interval[]` plus `Interval` for period. All methods return new `Scale` instances (immutable). |
| `src/lib/scala.ts` | Scala `.scl` and `.kbm` parsers + serializers. The xen-format I/O boundary. | Pure string ↔ `Scale` (and ↔ `KbmMapping`) functions. ~150 lines, no deps. Tested against the public Scala archive samples. |
| `src/lib/commas.ts` | Named-comma lookup. `nameForMonzo(monzo)`, `commaByName(name)`. | Static table of ~50–100 commas keyed by canonical monzo signature. Generated/hand-curated, lives as a `.ts` file (or a `.json` loaded via `FileAttachment` — both work; `.ts` keeps it in-repo and type-checked). |
| `src/lib/pieces/<piece>.ts` | The composition's tuning material — single source of truth for the in-progress piece. Exports `scale`, `baseHz`, `chordSet`, optionally `sections`. | Plain TS module. No reactivity, no DOM. Imported by the piece's page AND by any cross-reference page. Treat as non-public API; renaming is a single grep. |
| `src/components/play-interval.ts` | Inline play-button widget — "click to hear this interval against 1/1". | Exports `playInterval(interval, synth, opts?)` returning an `HTMLButtonElement`. Click triggers two short notes via the shared synth. Self-contained CSS class. |
| `src/components/play-scale.ts` | Inline arpeggio button or hold-chord button for a `Scale`. | Same pattern as `play-interval`. Optional drone toggle. |
| `src/components/lattice.ts` | D3 lattice renderer. Takes a `Scale` and a basis (`number[]` of primes); returns SVG. | Uses `ji-lattice` to compute coordinates, D3 for SVG primitives + zoom/pan. Accepts `invalidation` to tear down listeners. |
| `src/components/scale-table.ts` | Rendered table: degree, ratio, monzo, cents, cents-from-12tet. | Returns a `<table>` element. Pure data → DOM. |
| `src/components/keyboard.ts` | Scale-on-keyboard SVG with cents-offset labels. | Pure data → SVG. v1.x feature. |
| `src/audio/synth.ts` | Shared synth wrapper around `sw-synth`. Owns the `AudioContext`, voice pool, master gain, ADSR defaults. | Module exports a factory `createSynth()` (NOT a top-level singleton — `AudioContext` requires a user gesture). One synth per page, owned by one cell. |
| `src/data/named-commas.json.ts` | Build-time data loader: emits a JSON catalog of named commas. | Runs at `observable build`. Reads canonical sources, normalizes, writes JSON. Page accesses via `FileAttachment("named-commas.json").json()`. |
| `src/data/scala-archive.json.ts` | (Optional, v1.x) Build-time loader: ingests the Huygens-Fokker Scala archive into a queryable JSON index. | Same pattern. Generated once at build. ~4MB cap; consider chunking if it grows. |
| `observablehq.config.ts` | Framework config. Page registry, theme, head-tag injections (KaTeX CSS), nav structure. | Top-level TS config. Pages auto-discovered from `src/`. |

## Recommended Project Structure

```
.
├── observablehq.config.ts          # Framework config (TS supported)
├── package.json
├── tsconfig.json
├── vitest.config.ts                # Test config for kernel
├── .nvmrc                          # Pin Node 20 LTS
├── src/
│   ├── index.md                    # Home: project orientation, links
│   ├── pages/                      # Research notes (Markdown + cells)
│   │   ├── composition.md          # The in-progress piece — anchor page
│   │   ├── syntonic-comma.md       # Theory page (example)
│   │   ├── tonality-diamond.md     # Theory page (example)
│   │   └── edo-vs-ji.md            # Theory page (example)
│   ├── lib/                        # Pure math kernel — NO DOM, NO audio
│   │   ├── interval.ts             # The Interval class (currency)
│   │   ├── monzo.ts                # Prime-factor vector helpers
│   │   ├── scale.ts                # Scale model + ops
│   │   ├── cents.ts                # Cents conversion + 12tet deviation
│   │   ├── scala.ts                # .scl / .kbm parse + serialize
│   │   ├── commas.ts               # Named comma lookup
│   │   ├── primes.ts               # Prime sieve, factorization
│   │   ├── pieces/
│   │   │   └── <piece-name>.ts     # Composition's pitch material
│   │   └── __tests__/              # Vitest unit tests for the kernel
│   │       ├── interval.test.ts
│   │       ├── monzo.test.ts
│   │       ├── scale.test.ts
│   │       └── scala.test.ts
│   ├── components/                 # DOM-returning factories
│   │   ├── play-interval.ts        # Inline play-button widget
│   │   ├── play-scale.ts           # Arpeggio / chord button
│   │   ├── ratio-display.ts        # Inline ratio + cents pill
│   │   ├── scale-table.ts          # Tabular scale view
│   │   ├── lattice.ts              # D3 lattice (uses ji-lattice for coords)
│   │   ├── tonality-diamond.ts     # Configurable odd-limit diamond
│   │   ├── keyboard.ts             # Scale-on-keyboard SVG
│   │   └── export-scl-button.ts    # "Download .scl" button
│   ├── audio/                      # Web Audio layer (separated from components)
│   │   ├── synth.ts                # sw-synth wrapper + lifecycle
│   │   └── envelopes.ts            # ADSR presets
│   ├── data/                       # Build-time data loaders
│   │   ├── named-commas.json.ts    # Commas catalog
│   │   ├── primes.json.ts          # Precomputed prime list (e.g., first 1000)
│   │   └── scala-archive.json.ts   # (v1.x) Scala archive index
│   ├── style.css                   # Global typography + widget CSS
│   └── katex.html                  # KaTeX <head> includes (linked from config)
├── docs/                           # (optional) developer notes outside the site
└── README.md
```

### Structure Rationale

- **`src/lib/` is sacred.** It must never import from Framework, the DOM, `sw-synth`, or anything browser-specific. This is what makes it Vitest-testable, what lets you swap presentation layers later, and what keeps the math correct independent of the publishing layer. **If you find yourself wanting to import a DOM type into `src/lib/`, you're in the wrong folder — move it to `src/components/` or `src/audio/`.**
- **`src/components/` returns DOM, takes pure data.** Every component is a function `(data, opts) => HTMLElement`. No singletons. No global stores. State lives upstream in cells; components are dumb renderers. This makes inline embedding trivial: `${renderLattice(scale)}` in any Markdown paragraph just works.
- **`src/audio/` is separate from `src/components/`** because audio has lifecycle concerns (`AudioContext`, voice pool, user-gesture gate) that pure visual components don't. Keeping them separate means the lattice and keyboard are testable without mocking Web Audio.
- **`src/lib/pieces/<piece>.ts`** is the answer to "anchored to a specific composition." Treat the piece as a typed module that any page can import. The composition page renders the full dashboard; theory pages can pull `import { scale } from "../lib/pieces/foo.js"` if they want to discuss the piece's specific scale. One source of truth, type-checked.
- **`src/data/*.json.ts` are build-time loaders** — they generate static JSON the page consumes via `FileAttachment`. This means the named-commas table, prime list, and (eventually) Scala archive are precomputed once at build, not loaded fresh from a string-parser on every page render.
- **Imports use `.js` extensions** in source files (`import { Interval } from "../lib/interval.js"`) even though the source is `.ts` — this is the Framework convention because it transpiles `.ts` → `.js` and the runtime resolves the `.js` URL. Yes it looks weird; it's correct.
- **`src/lib/__tests__/` colocates tests** with the kernel. Vitest picks them up via `vitest.config.ts`. The Framework page layer doesn't need tests (Markdown rendering is exercised in `observable preview`); the pure kernel is what you regression-protect.

## Architectural Patterns

### Pattern 1: Interval as Currency

**What:** Every piece of tuning data crossing module boundaries is an `Interval` (or `Scale`-of-`Interval`s), not a raw `Fraction`, not a `BigInt[]` monzo, not a `number` of cents. The `Interval` class internally holds a `Fraction` (the source of truth) and lazily computes monzo + cents on demand.
**When to use:** Always. Don't pass raw `Fraction` between modules; wrap it in `Interval` so callers don't have to relearn whether they're holding ratio, monzo, or cents.
**Trade-offs:** Slight overhead of construction; pays back instantly in clarity. The alternative (passing `Fraction | number[] | number` and hoping callers know which) becomes a bug surface very fast.

**Example:**
```typescript
// src/lib/interval.ts
import { Fraction } from "fraction.js";
import { toMonzo } from "./monzo.js";

export class Interval {
  readonly fraction: Fraction;        // source of truth (BigInt-backed)
  #monzo?: bigint[];                  // lazy
  #cents?: number;                    // lazy

  constructor(input: Fraction | string | { n: bigint; d: bigint }) {
    this.fraction = input instanceof Fraction ? input : new Fraction(input as any);
  }

  static fromMonzo(monzo: bigint[]): Interval { /* … */ }
  static fromCents(c: number): Interval { /* lossy — flag it */ }

  get monzo(): bigint[] { return this.#monzo ??= toMonzo(this.fraction); }
  get cents(): number { return this.#cents ??= 1200 * Math.log2(this.fraction.valueOf()); }
  get centsFrom12tet(): number {
    const c = this.cents;
    return c - Math.round(c / 100) * 100;
  }

  mul(other: Interval): Interval { return new Interval(this.fraction.mul(other.fraction)); }
  div(other: Interval): Interval { return new Interval(this.fraction.div(other.fraction)); }
  inv(): Interval { return new Interval(new Fraction(2).div(this.fraction)); }  // octave complement
  octaveReduce(): Interval { /* … */ }
  equals(other: Interval): boolean { return this.fraction.equals(other.fraction); }
}
```

### Pattern 2: Components as Pure Factories

**What:** Every visual component is a function `(data: PureData, opts?: Opts) => HTMLElement`. No singletons. No internal state stores. State lives in the calling cell; the component renders that state.
**When to use:** All visualization, all inline widgets. The only exception is the audio synth (Pattern 4).
**Trade-offs:** Cells must declare and own state. Pays back in composability — the same `playInterval(interval, synth)` works inline in any paragraph on any page.

**Example:**
```typescript
// src/components/play-interval.ts
import type { Interval } from "../lib/interval.js";
import type { Synth } from "../audio/synth.js";

export interface PlayIntervalOpts {
  baseHz?: number;        // default 261.63 (C4)
  duration?: number;      // seconds, default 2
  label?: string;         // button text override
}

export function playInterval(
  interval: Interval,
  synth: Synth,
  opts: PlayIntervalOpts = {}
): HTMLButtonElement {
  const baseHz = opts.baseHz ?? 261.63;
  const dur = opts.duration ?? 2;
  const btn = document.createElement("button");
  btn.className = "play-interval";
  btn.textContent = opts.label ?? `▶ ${interval.fraction.toFraction()}`;
  btn.onclick = () => {
    synth.playNotes([baseHz, baseHz * interval.fraction.valueOf()], dur);
  };
  return btn;
}
```

Used inline in Markdown:
```markdown
The syntonic comma ${playInterval(syntonic, synth, {label: "▶ 81/80"})}
sounds like a faint detuning when stacked over a 5/4 third.
```

### Pattern 3: Cell-Scoped State + Inline Interpolation

**What:** Reactive top-level declarations in code cells become page-scope state; inline `${expr}` in prose interpolates and re-renders when state changes. This is how prose embeds widgets without ceremony.
**When to use:** Every page. This IS the Observable Framework programming model.
**Trade-offs:** Cells implicitly form a dependency graph by referenced names — accidental shadowing across cells re-runs more than you want. Convention: declare each top-level name exactly once per page, in a clearly-named cell near the top.

**Example (`src/pages/composition.md`):**
```markdown
# The Composition

```js
import { Interval } from "../lib/interval.js";
import { Scale } from "../lib/scale.js";
import { scale, baseHz } from "../lib/pieces/my-piece.js";
import { createSynth } from "../audio/synth.js";
import { playInterval } from "../components/play-interval.js";
import { renderLattice } from "../components/lattice.js";
import { scaleTable } from "../components/scale-table.js";
```

```js
// Audio: lazy create on first user gesture, dispose on cell re-run
const synth = createSynth();
invalidation.then(() => synth.dispose());
```

The piece is built on a 7-limit JI scale anchored on ${baseHz} Hz.

```js
display(scaleTable(scale, baseHz));
```

The defining interval is the septimal third
${playInterval(scale.intervals[2], synth)} —
notice its ${scale.intervals[2].centsFrom12tet.toFixed(1)} cent deviation
from 12-TET.

```js
display(renderLattice(scale, {basis: [3, 5, 7]}));
```
```

### Pattern 4: Audio as Cell-Owned Singleton with Invalidation

**What:** The synth is created lazily in one dedicated cell per page, registered with the page's `invalidation` promise for disposal, and shared with all components that need to play sound. AudioContext is created on the first user gesture (button click), never at module top-level.
**When to use:** Every page that has audio. Don't create a synth per component — that explodes voice counts and leaves orphan AudioContexts.
**Trade-offs:** The cell owning the synth is special — be careful not to redeclare it. The `invalidation` cleanup is Framework's escape hatch and you must use it or you'll leak `AudioContext` and oscillators on hot-reload during preview.

**Example:**
```typescript
// src/audio/synth.ts
import { Synth as SwSynth } from "sw-synth";

export interface Synth {
  playNotes(freqsHz: number[], durationSec: number): void;
  playArpeggio(freqsHz: number[], stepSec: number): void;
  startDrone(freqHz: number): () => void;  // returns stop fn
  dispose(): void;
}

export function createSynth(opts?: { master?: number }): Synth {
  let ctx: AudioContext | null = null;
  let sw: SwSynth | null = null;
  let master: GainNode | null = null;

  const ensure = () => {
    if (ctx) return;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = opts?.master ?? 0.2;
    master.connect(ctx.destination);
    sw = new SwSynth(ctx, /* sw-synth voice config */);
    // route sw → master
  };

  return {
    playNotes(freqs, dur) {
      ensure();
      const t = ctx!.currentTime;
      for (const hz of freqs) sw!.noteOn(hz, t, dur);
    },
    playArpeggio(freqs, step) {
      ensure();
      const t = ctx!.currentTime;
      freqs.forEach((hz, i) => sw!.noteOn(hz, t + i * step, step * 0.95));
    },
    startDrone(hz) {
      ensure();
      const id = sw!.noteOn(hz, ctx!.currentTime, /* sustain */ Infinity);
      return () => sw!.noteOff(id, ctx!.currentTime);
    },
    dispose() {
      sw?.dispose?.();
      master?.disconnect();
      ctx?.close();
      ctx = null; sw = null; master = null;
    },
  };
}
```

In the page cell:
```js
const synth = createSynth();
invalidation.then(() => synth.dispose());  // critical — kills the AudioContext on cell re-run / nav
```

### Pattern 5: Build-Time Data Loaders for Static Catalogs

**What:** Precompute large or rarely-changing data (named commas, prime lists, Scala archive index) at build time via Framework's `*.json.ts` data loaders. Pages consume via `FileAttachment("…").json()`. Result: zero runtime cost for catalog lookups; the JSON is bundled with the static site.
**When to use:** Anything that doesn't change per session and is big enough to matter. Named commas (~100 entries) is borderline — could go either way; the Scala archive (~4000 scales) absolutely should be a loader.
**Trade-offs:** Loader runs at build time, so changes require rebuild (during preview Framework re-runs the loader on file change). If the catalog must be user-editable at runtime, don't use a loader — keep it as a reactive cell with `localStorage`.

**Example:**
```typescript
// src/data/named-commas.json.ts
// Runs at build time. Output is `named-commas.json` in the build directory.
import { canonicalCommas } from "../lib/commas-source.js";
const out = canonicalCommas.map(c => ({
  name: c.name,
  monzo: c.monzo.map(String),  // BigInt → string for JSON
  cents: c.cents,
  prime_limit: c.primeLimit,
}));
process.stdout.write(JSON.stringify(out));
```

```js
// In a page:
const commas = FileAttachment("../data/named-commas.json").json();
```

### Pattern 6: Composition-as-Module (Single Source of Truth)

**What:** The composition's tuning material lives in a typed TS module under `src/lib/pieces/`. The piece's dashboard page imports it; theory pages discussing the piece import the same module. No copy-paste of ratios across cells.
**When to use:** As soon as the same scale appears on more than one page, or as soon as the composition's pitch material gets non-trivial.
**Trade-offs:** Tighter coupling between pages and the piece module — a rename touches every importer. That's the right trade: better one grep than ratios drifting across pages.

**Example:**
```typescript
// src/lib/pieces/opus-1.ts
import { Interval } from "../interval.js";
import { Scale } from "../scale.js";

export const baseHz = 261.625565;  // C4
export const scale = new Scale([
  new Interval("1/1"),
  new Interval("9/8"),
  new Interval("5/4"),
  new Interval("21/16"),
  new Interval("3/2"),
  new Interval("27/16"),
  new Interval("7/4"),
], new Interval("2/1"));

export const chordSet = {
  tonic:    [scale.intervals[0], scale.intervals[2], scale.intervals[4]],
  septimal: [scale.intervals[0], scale.intervals[3], scale.intervals[6]],
};
```

## Data Flow

### Read Flow (User Loads a Page)

```
[User navigates to /pages/composition]
        ↓
[Framework serves static HTML + JS bundle]
        ↓
[Page bootstraps: imports execute]
   ├── src/lib/pieces/opus-1.ts      → exports `scale`, `baseHz`, `chordSet`
   ├── src/lib/interval.ts           → Interval class
   ├── src/audio/synth.ts            → createSynth factory (ctx not yet created)
   └── src/components/*.ts           → factory functions
        ↓
[Reactive cells run in topological order]
   1. import cell        → bindings
   2. synth cell         → const synth = createSynth(); invalidation→dispose
   3. display(scaleTable(scale, baseHz)) → DOM emitted
   4. inline ${playInterval(scale.intervals[2], synth)} → button DOM emitted
   5. display(renderLattice(scale))      → SVG emitted
        ↓
[Page interactive — no AudioContext yet]
        ↓
[User clicks ▶ on inline interval]
        ↓
[playInterval handler → synth.playNotes(...)]
        ↓
[synth.ensure() lazily creates AudioContext (user-gesture satisfied)]
        ↓
[sw-synth schedules oscillators → audio out]
```

### Computation Flow (User Edits a Scale)

```
[User edits text in <textarea> input cell]
        ↓
[Reactive variable `scaleText` updates]
        ↓
[Cell `const scale = parseScale(scaleText)` re-runs]
   parseScale → src/lib/scala.ts (or simple line parser) → Scale
        ↓ (downstream cells re-run)
   ├── display(scaleTable(scale, baseHz))   → table re-renders
   ├── display(renderLattice(scale))        → lattice re-renders
   └── ${playInterval(scale.intervals[2], synth)} → button re-renders (label updates)
        ↓
[Previous cells' invalidation promises resolved]
   ├── lattice's D3 listeners removed
   ├── scaleTable's old <table> orphaned (GC'd)
   └── synth NOT disposed (its cell didn't re-run; it doesn't depend on scale)
```

The key insight: **`synth` is in its own cell that doesn't depend on `scale`**, so editing the scale doesn't tear down the AudioContext. This is intentional architecture.

### Build-Time Flow

```
[npm run build / observable build]
        ↓
[Framework scans src/]
        ↓
[Data loaders execute]
   src/data/named-commas.json.ts      → emits named-commas.json
   src/data/primes.json.ts            → emits primes.json
   (src/data/scala-archive.json.ts    → emits scala-archive.json, v1.x)
        ↓
[Markdown pages compiled]
   Each *.md → static HTML + per-page JS bundle
   Code blocks transpiled (TS→JS via esbuild)
   Inline ${...} expressions wired into reactive runtime
        ↓
[Module graph bundled]
   src/lib/*.ts        → bundled & cached
   src/components/*.ts → bundled & cached
   src/audio/*.ts      → bundled & cached
   npm: imports        → fetched & self-hosted in .observablehq/cache/_npm
        ↓
[Static output written to dist/]
   index.html, pages/*.html, _file/*.json, _import/*.js, _npm/*.js
        ↓
[Deploy as static site (GitHub Pages, S3, Cloudflare Pages, etc.)]
```

### Audio Lifecycle Flow

```
[Page load]
   createSynth() called → returns Synth wrapper
   ctx, sw, master all null  ← NO AudioContext yet (browser would block it)
        ↓
[First user gesture (button click)]
   synth.playNotes(...) → ensure() creates AudioContext, sw-synth, master gain
   note(s) scheduled
        ↓
[Subsequent user actions]
   reuse the same ctx + sw — no churn
        ↓
[Page navigation OR cell re-run]
   invalidation promise resolves
   synth.dispose() → ctx.close(), oscillators GC'd, listeners detached
        ↓
[Navigate back]
   New page load → fresh createSynth() → fresh lifecycle
```

### State Persistence Flow

```
[User-authored scales (composition module)]
   src/lib/pieces/<piece>.ts → committed to git → permanent

[User-edited scale on a page (text input)]
   Default: lives only in cell state — lost on reload
   Option A: serialize to URL query param
     scale → text → encodeURIComponent → location.hash
     on load: decode hash → seed input cell
   Option B: persist to localStorage
     scale → text → localStorage.setItem("page:syntonic:scale", text)
     on load: prefer localStorage if present
   Option C: download to disk
     scale → writeScl(scale) → Blob → download attribute on <a>
        ↓
[Recommendation for v1]
   - Composition material → committed module (canonical)
   - Per-page user scratch → URL hash (shareable + lossy-tolerable)
   - .scl/.kbm download buttons everywhere (escape hatch)
   - localStorage only if URL hash gets unwieldy
```

## Scaling Considerations

This is a personal research notebook — "scaling" means scaling the **content** (more pages, more scales, richer math), not user load. The static-site model handles users for free.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1–10 pages, single composition | Current architecture is exactly right. Don't optimize. |
| 10–50 pages, multiple compositions | Split `src/lib/pieces/` into per-piece subdirectories. Add a `src/lib/index.ts` barrel for clean imports. Consider a `pieces/` index page that lists all compositions. |
| 50+ pages, multiple research threads | Sectioned navigation in `observablehq.config.ts`. Per-section landing pages. Possibly per-section subfolders under `src/pages/`. Build time will start mattering — incremental builds via Framework's caching. |
| Scala archive imports as a feature | Move from build-time JSON loader to chunked JSON (per-prime-limit shards) so pages don't download the whole archive. Lazy-load via `FileAttachment` per-page. |
| Heavy lattice computations (5+-prime, large scales) | Move computation off main thread via Web Worker. `ji-lattice` runs in worker, page receives coordinates. Probably never needed for v1; flag for later if interactions feel sluggish. |
| Audio: more than ~32 simultaneous voices | `sw-synth` handles this fine, but monitor CPU. Consider per-page voice cap in the synth wrapper. |

### Scaling Priorities (in likely order of "what becomes annoying first")

1. **First bottleneck: cross-page navigation between piece pages.** Solution: explicit nav structure in `observablehq.config.ts` and a `pieces/` index page. Cheap fix, defer until you have 3+ pieces.
2. **Second bottleneck: kernel module growing too monolithic.** Solution: split `src/lib/` into subfolders (`primitives/`, `scales/`, `analysis/`, `io/`) once `src/lib/` has >15 files.
3. **Third bottleneck: build time as data loaders grow.** Solution: Framework caches loader output; only changed loaders re-run. If a loader is genuinely slow, split it into shards or memoize against an external cache (e.g., a `data-cache/` folder gitignored but locally persistent).

## Anti-Patterns

### Anti-Pattern 1: DOM in `src/lib/`

**What people do:** "I just need to highlight this cell in the lattice when it's selected, easier to do it inside the lib." Imports `document.createElement` or returns DOM nodes from a `lib/` function.
**Why it's wrong:** Breaks Vitest tests (no DOM in Node), breaks separation of concerns, makes the function un-reusable from a Web Worker, couples math to presentation.
**Do this instead:** `src/lib/` returns pure data (coordinates, classifications). `src/components/` consumes that data and emits DOM.

### Anti-Pattern 2: Floating-Point Cents as Source of Truth

**What people do:** Stores intervals as `number` of cents because "cents are easier." Round-trips ratio → cents → ratio.
**Why it's wrong:** `1200 * Math.log2(81/80)` is irrational; you cannot recover `81/80` exactly from the float. Any subsequent monzo computation, prime-limit check, or comma identification gets garbage.
**Do this instead:** `Interval` holds `Fraction` (BigInt) as source of truth. Cents is a *display projection*, computed lazily, never re-parsed back into ratios.

### Anti-Pattern 3: Top-Level `new AudioContext()`

**What people do:** Creates the AudioContext at module load (e.g., `src/audio/synth.ts` exports a singleton `audioContext`).
**Why it's wrong:** Browsers refuse to start an AudioContext outside a user-gesture handler. The context will be in a `suspended` state and silent until `resume()` is called from a click handler — which the user has to wire up everywhere. Worse, hot-reload during `observable preview` leaks contexts.
**Do this instead:** Export a `createSynth()` factory. The factory returns a `Synth` whose first method-call lazily creates the context. Register `synth.dispose()` with `invalidation` so cell re-runs don't leak.

### Anti-Pattern 4: One Synth Per Component

**What people do:** Every `playInterval` button creates its own `AudioContext` and oscillator pool internally so callers don't have to think about it.
**Why it's wrong:** A page with 20 inline play-buttons has 20 AudioContexts (most browsers cap this at 6, then refuse). Voice management becomes incoherent — one button can't stop another's drone.
**Do this instead:** One synth per page, owned by a dedicated cell. Components receive the `synth` as a parameter. The page is the lifetime owner.

### Anti-Pattern 5: Side Effects in Reactive Cells

**What people do:** Modifies `localStorage`, mutates an external object, or calls `synth.startDrone(...)` directly inside a top-level cell expression.
**Why it's wrong:** Reactive cells re-run on every dependency change. A cell that "just plays a note" will play it every time you tweak any input. A cell that "just writes to localStorage" will write hundreds of times during text-input keystrokes.
**Do this instead:** Wrap side effects in event handlers (button onClick, input change). Use `invalidation` for cleanup. Put audio side effects in user-gesture handlers, not in cell bodies.

### Anti-Pattern 6: Ratios Duplicated Across Pages

**What people do:** Page A defines the composition's scale inline; Page B copies the same ratios to discuss them; the two drift over time.
**Why it's wrong:** The piece becomes inconsistent. Worse, you can't refactor the scale without find-and-replace.
**Do this instead:** Composition material lives in `src/lib/pieces/<piece>.ts`. Every page imports from there. Single source of truth.

### Anti-Pattern 7: Cell Names Shadowing Across Pages

**What people do:** Names a top-level cell variable `scale` on multiple pages, then imports a kernel-level `Scale` class also named `scale` somewhere.
**Why it's wrong:** Framework's reactive runtime walks all top-level `const`/`let` declarations in a page; collisions cause confusing re-runs or missing references.
**Do this instead:** Convention — kernel exports `PascalCase` types/classes (`Scale`, `Interval`); cell variables use lowercase descriptive names (`pieceScale`, `editedScale`, `currentScale`). Avoid one-letter names.

### Anti-Pattern 8: Framework Plugin Bloat for Things You Could Just Write

**What people do:** Hunts for an Observable Framework "Scala parser plugin" or "named-commas plugin" instead of writing 100 lines of TypeScript.
**Why it's wrong:** This domain has a thin community of plugins; most are unmaintained. You'll spend more time evaluating broken plugins than writing the code yourself.
**Do this instead:** STACK.md already says this — write `scala.ts` yourself, write the commas catalog yourself, don't shop for plugins.

## Integration Points

### External Services

There are none in v1 — the site is fully static. Listing for completeness:

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| (none in v1) | — | Static-site, no backend, no APIs |
| (potential) Hosted Scala archive mirror | Build-time fetch in `src/data/scala-archive.json.ts` | Only if you want fresh archive at each build; caching policy: download once, commit the JSON; only re-fetch when manually triggered |
| (potential) MIDI device | Web MIDI API — out of scope per PROJECT.md | Defer to v2+ |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Markdown page ↔ kernel (`src/lib/`) | ES module imports (synchronous, after initial bundle load) | One-way: page imports from lib; lib never imports from page |
| Markdown page ↔ component (`src/components/`) | ES module imports + function call returning `HTMLElement` | Components are stateless factories; page owns the state they render |
| Markdown page ↔ audio (`src/audio/`) | ES module imports + factory call; `invalidation` for cleanup | One synth per page; never a global singleton |
| Component ↔ kernel | ES module imports | Components consume `Interval`/`Scale`; never define new domain types |
| Component ↔ audio | Page passes `synth` as parameter | Components don't import synth directly — keeps them testable |
| Page ↔ data loader output | `FileAttachment("name.json").json()` | Build-time output, runtime read; cached automatically |
| Page A ↔ Page B (sharing piece data) | Both import from `src/lib/pieces/<piece>.ts` | Single source of truth; no cross-page state |
| User input ↔ page state | Standard HTML `<input>` / `<textarea>` + reactive cell reading `.value` | Use Framework's `Inputs.text()`, `Inputs.range()` for scaffolded UI; raw HTML for custom widgets |
| Page state ↔ URL | Manual: `location.hash` ↔ cell state, opt-in per page | v1.x; not in MVP |

## Build Order Implications (Critical Path)

**Phase 1 — Foundation (must come first; blocks everything else):**

1. **`src/lib/interval.ts` + `src/lib/monzo.ts` + `src/lib/cents.ts`** — the math kernel root. Nothing else can be built without these.
2. **`src/lib/scale.ts`** — depends on `Interval`. Required before any scale-bearing UI.
3. **`src/lib/scala.ts`** — Scala I/O. Independent of `Scale` modeling, but needed for the `.scl` export user requirement.
4. **Framework project scaffold** — `npx @observablehq/framework create`, `tsconfig.json`, `vitest.config.ts`, install xen-dev-utils stack. Can run in parallel with kernel work but must be done before any page.
5. **`src/audio/synth.ts`** — wraps `sw-synth`. Independent of kernel; can be built in parallel with `interval.ts`/`scale.ts`.
6. **First inline widget: `src/components/play-interval.ts`** — the prototype widget pattern. Once this works, all other inline widgets fall out cheaply.
7. **First page: `src/index.md` + `src/pages/composition.md`** — proves the kernel + widget + page wiring end-to-end.
8. **`src/lib/pieces/<piece>.ts`** — the piece's pitch material. Can be drafted with placeholders early, refined as the composition evolves.

**Phase 2 — Generality (proves the architecture supports more than one page):**

9. Second theory page (e.g., `syntonic-comma.md`) using the same primitives.
10. `src/components/scale-table.ts` — tabular scale view used by both pages.
11. `.kbm` export.
12. KaTeX wired up for math typesetting.

**Phase 3 — Visualization:**

13. `src/components/lattice.ts` (depends on `ji-lattice` + D3).
14. `src/components/tonality-diamond.ts`.
15. `src/components/keyboard.ts`.

**Phase 4 — Analysis features:**

16. `src/lib/commas.ts` + `src/data/named-commas.json.ts`.
17. EDO ↔ JI mapping table.
18. MOS / generator-period scale construction.
19. Comparison cell.

**Phase 5+ — Heavy theory:**

20. Temperament browser (the mountain).
21. Ratio-to-comma decomposition.
22. Plomp-Levelt dissonance curves.
23. Persistent URLs / localStorage state.

### Suggested Phase 1 (Minimum-Viable Architecture Proof)

A "Phase 1" that validates the architecture before broader feature work:

- `src/lib/interval.ts` (Interval class, Fraction-backed, lazy monzo + cents)
- `src/lib/monzo.ts` (toMonzo, fromMonzo, primeLimit, oddLimit, tenneyHeight)
- `src/lib/cents.ts` (cents, centsFrom12tet)
- `src/lib/scale.ts` (Scale class, mode rotation, octave reduction)
- `src/lib/scala.ts` (parseScl, writeScl, writeKbm)
- `src/lib/__tests__/*.test.ts` (Vitest covers everything above)
- `src/audio/synth.ts` (sw-synth wrapper, lifecycle, dispose)
- `src/components/play-interval.ts` (the prototype inline widget)
- `src/components/scale-table.ts` (tabular display)
- `src/components/export-scl-button.ts` (download .scl)
- `src/lib/pieces/<piece>.ts` (composition's pitch material — can start with a stub)
- `src/index.md` (orientation page)
- `src/pages/composition.md` (the dashboard for the in-progress piece)
- `observablehq.config.ts`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `.nvmrc`
- Static-site build verified deployable (e.g., GitHub Pages workflow).

That set ships the user's stated v1 outputs (ratios, cents-from-12tet, audio playback, .scl/.kbm export), proves the architecture (kernel → component → page composition + inline widgets in prose), and leaves clear extension points for everything in Phases 2–5.

## Sources

- [Observable Framework — Reactivity (GitHub docs)](https://github.com/observablehq/framework/blob/main/docs/reactivity.md) — verified topological cell ordering, `invalidation` promise pattern, `Mutable` for cross-cell mutable state — HIGH
- [Observable Framework — Imports (GitHub docs)](https://github.com/observablehq/framework/blob/main/docs/imports.md) — verified `npm:` protocol, local imports, self-hosted bundling, `.js` extension convention for TS imports — HIGH
- [Observable Framework — Data Loaders (GitHub docs)](https://github.com/observablehq/framework/blob/main/docs/data-loaders.md) — verified build-time execution, `FileAttachment` consumption, `.observablehq/cache` caching — HIGH
- [Observable Framework — JavaScript / TypeScript (GitHub docs)](https://github.com/observablehq/framework/blob/main/docs/javascript.md) — verified `js`/`ts` fenced blocks, inline `${...}` interpolation, transpilation but no type-checking — HIGH
- `.planning/research/STACK.md` (this project) — drives all library choices: xen-dev-utils, sonic-weave, ji-lattice, sw-synth, fraction.js v5, custom scala.ts — HIGH
- `.planning/research/FEATURES.md` (this project) — drives feature ordering: kernel → composition page → second theory page → lattice/diamond → temperament browser — HIGH
- `.planning/PROJECT.md` (this project) — establishes constraints: static-site, JS/TS only, ratio + cents only, .scl/.kbm export, in-browser audio — HIGH
- [sw-synth on npm](https://www.npmjs.com/package/sw-synth) — verified raw Web Audio synth, voice classes, frequencies in Hz — HIGH (via STACK.md)
- [Scale Workshop source structure (GitHub)](https://github.com/xenharmonic-devs/scale-workshop) — informs separation of math primitives from UI components, and the production usage pattern for the xenharmonic-devs stack — HIGH
- [Web Audio API: AudioContext gesture requirement (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext) — basis for the lazy-instantiation pattern; AudioContext must originate in a user gesture — HIGH

---
*Architecture research for: Observable Framework JI calculator + research notebook*
*Researched: 2026-05-02*
