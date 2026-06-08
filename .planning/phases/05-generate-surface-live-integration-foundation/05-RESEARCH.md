# Phase 5: Generate Surface & Live Integration Foundation — Research

**Researched:** 2026-06-08
**Domain:** Additive shared-state integration in an Observable Framework JI notebook + new page scaffold + a boot-equivalence regression gate
**Confidence:** HIGH — every precedent file read in this repo at HEAD; the integration design is derived directly from the verified `index.md` / `analysis.md` boot code, `theme-prefs.ts`, `url.ts`, and the established Vitest/happy-dom harness.

<user_constraints>
## User Constraints (from CONTEXT.md)

> There is no phase-level CONTEXT.md for Phase 5. The authoritative locked decisions come from the reused quick-task `260608-dyv-CONTEXT.md`. Phase 5 is **Wave 0** of that plan — the SURFACE + INTEGRATION PLUMBING slice only. Copied verbatim below.

### Locked Decisions
- **Surface — new dedicated tab.** Build `src/pages/generate.md` (nav label "Generate"), added to `observablehq.config.ts` between "Analysis" and "Theory notes". A method picker (dropdown/segmented) selects the generation family; params + live preview table + audition render below; "Send to Dashboard" / "Send to Analysis" actions push the result.
- **Integration — live shared state.** A generated scale integrates with Dashboard + Analysis via live shared state, NOT just copy/paste. **HARD CONSTRAINT (user regression sensitivity): MUST be additive and MUST NOT destabilize the working Dashboard/Analysis pages.** Mirror the theme-prefs pattern — a small pure state module backed by `localStorage` under a namespaced key broadcasting a `CustomEvent`. Keep the existing `#s=` URL-hash protocol (`src/lib/url.ts`) as the transport/persistence backbone. Existing pages opt IN by listening for the event; their current seed/hash behavior must remain unchanged when the store is empty.
- **Dashboard/Analysis textareas** should be able to receive a pushed scale without breaking their current hash-read-at-boot and debounced-hash-write logic.

### Claude's Discretion
- Component decomposition: one generic `generate.md` host + per-method Pattern-2 factory components vs. a single multi-method component. (Phase 5 only needs the HOST + picker shell, not the per-method factories.)
- Preview/audition affordances (reuse `scaleTable` + `playScale` per `mosBuilder`).
- Whether the placeholder generator that proves the pipeline end-to-end is an explicit "identity" method or just a hard-coded seed scale exposed to the preview.
- Store persistence scope: `localStorage` (theme-prefs parity, "remember my last scale") vs `sessionStorage` (per-session). Recommendation below: `localStorage`.

### Deferred Ideas (OUT OF SCOPE for Phase 5 specifically)
- **The actual generator methods** (CPS, harmonic, EDO, rank-2, well-temperament, Fokker, SonicWeave free-text, Wilson/metallic, etc.) — these are Phases 6, 7, 8. Phase 5 builds the picker host, the params-panel swap mechanism, a preview+audition wired to whatever scale is current, and AT MOST one trivial placeholder/identity generator to prove the pipeline end-to-end. **Do not build real generators in this phase.**
- Circle-of-pitches viz, rotate-to-mode, transform strip — Phase 8.
- Scala archive browser — Phase 9.
- Cross-tab live sync (native `storage` event) — additive, deferred (single-tab `CustomEvent` covers the requirement).
- Staff-engraved JI notation, MIDI bridge — out of scope per PROJECT.md.
- Upgrading `xen-dev-utils` past 0.13.1 — out of scope, regression risk.
- Any new npm dependency — zero new deps for the whole milestone.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SURF-01 | User can open a dedicated Generate page (`/pages/generate`) from the site nav | `## The New Page (generate.md)`; nav wiring in `observablehq.config.ts` (two edits: `pages[]` + `header` breadcrumb). The page mirrors the verified `analysis.md` synth-owning shell. |
| SURF-02 | User can choose a generation method from a family-grouped picker; the parameter panel swaps to that method's inputs | `## The Method Picker + Param-Panel Swap`. Phase 5 ships the picker (grouped `Inputs.select` / `<optgroup>`) + the swap MECHANISM (a params host div + mount/replaceChildren contract), with placeholder options. Real method factories arrive Phases 6–8. |
| SURF-03 | User sees a live preview table and can audition (play) the current generated scale as parameters change | `## Preview + Audition`. Reuse `scaleTable(scale, baseHz)` + `playScale(scale, synth, {baseHz})` exactly as `mosBuilder` does (verified fungible — any `Scale` renders/auditions identically). A trivial placeholder scale proves the pipeline. |
| SYNC-01 | User can send a generated scale to the Dashboard ("Send to Dashboard") and it loads there live | `## The Shared Store (scale-store.ts)` + `## Send-to (the only writer)`. `writeSharedScale` + `CustomEvent` + Dashboard's additive listener cell. |
| SYNC-02 | User can send a generated scale to the Analysis page ("Send to Analysis") and it loads there live | Same as SYNC-01 for `analysis.md`. |
| SYNC-03 | A sent scale persists across reload via the shared store and the existing `#s=` deep-link hash | `## Boot Precedence` (`hash ?? store ?? seed`) + Send-to optionally writing `#s=` via the unchanged `encodeScaleToHash`. localStorage persists across reload; hash persists in the URL. |
| SYNC-04 | Existing Dashboard / Analysis behavior is byte-identical when no scale has been sent (empty-store boot regression guard) | `## The R1 Boot-Equivalence Gate (success criterion #4)` — the centerpiece of this research. A pure `resolveInitialScaleText` helper makes the precedence unit-testable; R1 asserts empty-store boot ≡ today's `hash ?? seed`. RED→GREEN before any Send-to wiring. |
</phase_requirements>

## Summary

Phase 5 is a **plumbing-and-surface phase**, not a generator phase. It lands three things and nothing more: (1) a new `src/pages/generate.md` page that owns a synth, hosts a family-grouped method picker, and has empty params + preview hosts; (2) a pure `src/lib/scale-store.ts` — the exact carve-out twin of the already-shipped `src/theme/theme-prefs.ts` — that broadcasts a `CustomEvent` over a namespaced `localStorage` key; and (3) the additive opt-in on `src/index.md` (Dashboard) and `src/pages/analysis.md` (Analysis) plus the "Send to…" buttons. The defining constraint is success criterion #4: **with an empty store, Dashboard and Analysis must boot byte-identically to v1.0**, proven by an R1 regression test that goes RED→GREEN before any "Send to…" wiring exists.

The single most important finding for planning the R1 gate: the boot logic in both pages is a **pure `??` expression** (`hashDecoded ?? seedText`), and Vitest already runs in the `node` environment with an established `vi.stubGlobal("localStorage", …)` pattern (see `theme-prefs.test.ts`). Therefore the correct, lowest-risk way to make boot precedence testable is to extract a one-line pure helper `resolveInitialScaleText(hashDecoded, stored, seedText)` returning `hashDecoded ?? stored?.text ?? seedText`, and have R1 assert that **when `stored === null`, the helper returns byte-identically what `hashDecoded ?? seedText` returns today**. This proves the new `??` clause is inert when the store is empty — which is exactly the SYNC-04 guarantee. The RED state is produced by writing the test (and the page edits) before the helper handles the empty case correctly, or more practically by writing the helper's spec first; GREEN is the helper landing with the precedence rule. No DOM is needed for R1 — it is a pure-function test in the `node` environment.

A subtle but load-bearing detail discovered by reading the actual files: **the Dashboard and Analysis boot expressions are NOT identical.** `index.md` computes `seedText = hashDecoded ?? seedTextLiteral` (line 78) and feeds `seedText` into the textarea; `analysis.md` computes `initialScaleText = hashDecoded ?? seedText` (line 70). The additive `??` clause therefore lands at a **different named symbol on each page**, and the planner must specify both edit sites precisely. Both reduce to the same precedence (`hash ?? store ?? seed`) via the shared helper, but the line being changed differs. A second load-bearing detail: the consumer listener must reach the textarea ELEMENT, but both pages currently use `view(Inputs.textarea({...}))` which returns the value generator, not a captured element — so the additive change requires splitting that into `const scaleInput = Inputs.textarea({...}); const scaleText = view(scaleInput);` so the listener cell can reference `scaleInput` and dispatch a synthetic `input` event on it.

**Primary recommendation:** Build in this order — (1) `scale-store.ts` + its unit tests; (2) the pure `resolveInitialScaleText` helper + the **R1 boot-equivalence test as the wave gate, RED→GREEN before anything else**; (3) `generate.md` scaffold + nav (no Send-to yet); (4) the additive opt-in (the `??` clause + the listener cell) on both pages; (5) the "Send to…" buttons (the only writer). Strict one-way data flow: only "Send to…" writes the store; consumers read at boot and listen — never write back.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Shared "current scale" state (read/validate/constants) | Kernel-adjacent pure module (`src/lib/scale-store.ts`) | Pages (opt-in listeners) | Mirrors `theme-prefs.ts` carve-out: constants + pure read/validate; the ONE allowed shared dep between page and store. No DOM, no top-level side effects. |
| Boot-precedence resolution (`hash ?? store ?? seed`) | Kernel pure helper (`resolveInitialScaleText` in `scale-store.ts`) | Pages (call at boot) | A pure 1-line function makes the precedence unit-testable without a page/DOM — this is what the R1 gate asserts against. |
| Store WRITE + `CustomEvent` broadcast | Page boundary (`generate.md` "Send to…" buttons) | — | One-way data flow: ONLY the producer writes. Lives at the page layer because it has side effects (localStorage write + event dispatch). |
| Live update on consumers | Page (`index.md` / `analysis.md` listener cells) | — | Additive cell per page: listen for `scale-changed`, write the textarea via a synthetic `input` event, never write the store. |
| Cross-page deep-link transport | Kernel (`src/lib/url.ts`, UNCHANGED) | Pages | `#s=` hash stays the persistence/share backbone; reused verbatim for "Send to…" navigation. Phase 5 changes nothing in `url.ts`. |
| Synth ownership / AudioContext | Page (`generate.md`) | — | Pattern 4 / Pitfall #2 — page owns synth, `invalidation.then(dispose)`. Copy `analysis.md`'s synth cell verbatim. |
| Method picker + param-panel swap | Page (`generate.md`) + a mount contract | Components (Phases 6–8) | Phase 5 owns the picker shell + the host divs + the mount/`replaceChildren` mechanism. The per-method Pattern-2 factories arrive later. |
| Preview render + audition | Components (`scaleTable`, `playScale`, both existing) | Page | Reuse verbatim — any `Scale` is fungible. Phase 5 wires a placeholder scale through them to prove the pipeline. |

## Standard Stack

> Phase 5 installs **zero** packages. Everything is already in `package.json`. The page and store are built from this repo's own primitives + browser globals.

### Core (already installed — no new install)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@observablehq/framework` | 1.13.4 (installed `[VERIFIED: package.json]`) | The page runtime: reactive cells in `generate.md`, `Inputs.select`/`Inputs.textarea`, `view`, `Mutable`, `invalidation`, `display`. | The project's locked SSG. The new page is just another `.md` under `src/pages/`. |
| `fraction.js` | 5.3.4 (installed, exact pin, BigInt `[VERIFIED: package.json]`) | BigInt source-of-truth currency for `Interval`. Phase 5 touches it only transitively (placeholder scale + serialization). | R-01: the BigInt path. ESLint bans importing `Fraction` from `xen-dev-utils` (`eslint.config.js:49`). |
| `sw-synth` | 0.4.0 (installed, via `npm:sw-synth` alias `[VERIFIED: package.json + vitest.config.ts]`) | The page synth (`createSynth()` from `src/audio/synth.js`). Phase 5 copies `analysis.md`'s synth cell; does not touch the audio kernel. | Page-owned synth, lazy AudioContext on first gesture (Pitfall #2). |

### Supporting (this repo's own primitives — reuse verbatim)

| Symbol | File | Purpose | When to Use |
|--------|------|---------|-------------|
| `scaleTable(scale, baseHz, opts)` | `src/components/scale-table.js` `[VERIFIED: read]` | 4-col preview table (Degree/Ratio/Cents/¢-from-12tet). createElement+textContent XSS discipline. | The preview table. Fungible — any `Scale` renders. |
| `playScale(scale, synth, opts)` | `src/components/play-scale.js` `[VERIFIED: read]` | "⏵⏵ Play scale" arpeggio button. | Audition. Pass the page synth. |
| `createSynth()` / `SynthHandle` | `src/audio/synth.js` `[VERIFIED: read API]` | Page-owned synth; lazy AudioContext. Methods: `playNote`, `playArpeggio`, `panic`, `dispose`, `activeVoices`. | Copy the `analysis.md` synth cell verbatim. |
| `encodeScaleToHash` / `decodeHashToScale` | `src/lib/url.js` `[VERIFIED: read]` | `#s=` codec. UNCHANGED in Phase 5. | Send-to deep-link parity; Dashboard's existing "Analyze this scale →" button is the exact precedent. |
| `MAX_SCALE_TEXT_BYTES` (= 8192) | `src/lib/url.js` `[VERIFIED: read]` | 8 KB cap constant. | Reuse in `scale-store.ts` for the length cap (do not invent a new constant). |
| `readThemePrefs` / `THEME_PREFS_STORAGE_KEY` / `THEME_PREFS_EVENT` | `src/theme/theme-prefs.js` `[VERIFIED: read]` | The EXACT precedent `scale-store.ts` mirrors (namespaced key + `CustomEvent` + try/catch validation). | Copy its structure for `scale-store.ts`. |
| `Scale` / `Interval` | `src/lib/scale.js` / `src/lib/interval.js` `[VERIFIED: read]` | Scale representation. `Scale.intervals`, `.period`, `.rotate/reduce/dedupe/transpose`. | The placeholder scale + serializing to text for Send-to. **Do NOT add a `tempered` field — that's a later-phase, component-layer concern.** |
| `parseScala` | `src/lib/scala.js` `[VERIFIED: read header]` | Parses ratio/cents/monzo text. Cents detected by `.` (line 260). | The store currency is scale TEXT; consumers already parse it via their unchanged `parseScala` path. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A pure `resolveInitialScaleText` helper + node-env unit test for R1 | A full happy-dom integration test that boots a mock page | Heavier, brittle, and unnecessary: the boot logic IS a pure `??` expression. The pure-helper approach matches the existing `dashboard-seed.test.ts` / `url-hash-integration.test.ts` precedent (pure kernel assertions, no DOM) and makes the inert-when-empty guarantee a single, fast, deterministic assertion. **Strongly recommended.** |
| `localStorage` for the store | `sessionStorage` | `localStorage` gives "remember my last scale" parity with theme-prefs (OQ-1). The hash always wins at boot, so sharing is unaffected either way. If the stale-scale behavior annoys later, switching is a 1-line change. Recommend `localStorage`. |
| Same-document `CustomEvent` only | Also a native `storage`-event listener (cross-tab) | Cross-tab is additive and out of scope for Phase 5 (OQ-2). Single-tab `CustomEvent` matches the theme-prefs precedent and satisfies "live update an already-open page." Ship single-tab. |
| Listener writes the textarea via synthetic `input` | Listener writes the store / a Mutable / re-derives scale | The synthetic-`input`-on-the-existing-textarea path means the page's existing parse + render + debounced-hash-write all fire through their UNCHANGED code path — the minimal additive change. Any other approach touches existing logic and risks regression. |

**Installation:** None. `npm install` is not run in this phase.

**Version verification:** Confirmed against `package.json` at HEAD `[VERIFIED: read]`: `@observablehq/framework@1.13.4`, `fraction.js@5.3.4` (exact pin), `sw-synth@^0.4.0`, `xen-dev-utils@^0.13.1`, `sonic-weave@^0.14.1`, plus devDeps `happy-dom@^15.11.7` and `vitest@^2.1.9`. No registry lookups needed — nothing is installed.

## Package Legitimacy Audit

> **Not applicable — Phase 5 installs zero external packages.** Every dependency it uses is already in `package.json` and already in use by the shipped v1.0 code. No slopcheck / registry verification is required because no new package is added.

| Package | Disposition |
|---------|-------------|
| (none) | Phase 5 adds no packages. |

**Packages removed due to slopcheck [SLOP] verdict:** none (no packages considered).
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────────────────────┐
                         │  generate.md  (NEW page — the PRODUCER)      │
                         │                                             │
  user picks method ───▶ │  [ Method ▾ ]  grouped <select> (optgroups) │
                         │        │                                    │
                         │        ▼  (mount factory → params host)     │
                         │  ┌─ params host ─┐  (placeholder in Ph5)    │
                         │  └───────────────┘                          │
                         │        │ produces a Scale (placeholder Ph5) │
                         │        ▼                                    │
                         │  ┌─ preview host ─┐                         │
                         │  │ scaleTable +   │◀── page synth (owns AC) │
                         │  │ ⏵⏵ playScale   │                         │
                         │  └────────────────┘                         │
                         │        │ serialize Scale → scale TEXT       │
                         │        ▼                                    │
                         │  [ Send to Dashboard → ] [ Send to Analysis ]│
                         └──────────┬──────────────────────┬───────────┘
                                    │ writeSharedScale(text)│  (ONLY writer)
                                    ▼                       ▼
              ┌──────────────────────────────────────────────────────┐
              │  scale-store.ts  (PURE module — theme-prefs twin)     │
              │   localStorage["tuning-systems:scale"] = {text,source}│
              │   window.dispatchEvent(CustomEvent("…:scale-changed"))│
              └──────────┬───────────────────────────────┬───────────┘
                         │ CustomEvent (same-document)    │ + optional #s= nav
              ┌──────────▼──────────┐         ┌───────────▼──────────┐
              │  index.md (Dashboard)│         │  analysis.md         │
              │  CONSUMER (read+listen)        │  CONSUMER             │
              │                      │         │                      │
              │  BOOT (once):        │         │  BOOT (once):        │
              │   resolveInitialScaleText(     │   resolveInitialScaleText(
              │     hashDecoded,     │         │     hashDecoded,     │
              │     readSharedScale(),         │     readSharedScale(),
              │     seedTextLiteral) │         │     seedText)        │
              │   = hash ?? store ?? seed      │   = hash ?? store ?? seed
              │                      │         │                      │
              │  LISTEN (additive cell):       │  LISTEN (additive cell):
              │   on "scale-changed" →         │   on "scale-changed" →
              │   scaleInput.value = text;     │   scaleInput.value = text;
              │   dispatch synthetic "input"   │   dispatch synthetic "input"
              │   (→ existing parse + render   │   (→ existing parse + render
              │      + debounced hash-write,   │      + debounced hash-write,
              │      ALL UNCHANGED)            │      ALL UNCHANGED)   │
              └──────────────────────┘         └──────────────────────┘

   ONE-WAY: producer writes store; consumers only read at boot + listen.
   Consumers NEVER write the store (prevents the R2 feedback loop).
   When store is empty (default): resolveInitialScaleText ≡ hash ?? seed  → SYNC-04.
```

### Recommended Project Structure (Phase 5 deltas only)

```
src/
├── lib/
│   ├── scale-store.ts          # NEW — constants + readSharedScale/writeSharedScale
│   │                           #       + resolveInitialScaleText (pure helper)
│   ├── url.ts                  # UNCHANGED (reuse MAX_SCALE_TEXT_BYTES, encode/decode)
│   ├── __tests__/
│   │   └── scale-store.test.ts # NEW — store read/write/validate/cap/throws + CustomEvent
│   └── INVENTORY.md            # +1 section "Phase 5 — scale generation foundation"
├── __tests__/
│   └── scale-store-boot.test.ts# NEW — THE R1 GATE (pure resolveInitialScaleText)
├── pages/
│   ├── generate.md             # NEW — synth-owning page, picker shell, preview, Send-to
│   └── analysis.md             # EDIT — split textarea into named element + view;
│                               #        boot line 70 → resolveInitialScaleText(...);
│                               #        +1 additive listener cell
├── index.md                    # EDIT — same shape; boot line 78 → resolveInitialScaleText(...)
└── ...
observablehq.config.ts          # EDIT — +1 nav page "Generate" between Analysis & Theory;
                                #        + "Generate" in the header breadcrumb string
```

### Pattern 1: The pure store module (mirror `theme-prefs.ts`)

**What:** A side-effect-free module exporting constants + pure read/validate, with the WRITE helper that performs the localStorage write + `CustomEvent` dispatch. It is the ONE allowed shared dependency between the page and the store.
**When to use:** This is the carve-out twin of `theme-prefs.ts`. Copy that file's structure (namespaced key, `CustomEvent` name, try/catch validation that never throws, returns `null`/default on any failure).

```ts
// Source: structure mirrored from src/theme/theme-prefs.ts (read this session) + url.ts MAX_SCALE_TEXT_BYTES.
import { MAX_SCALE_TEXT_BYTES } from "./url.js";

export const SCALE_STORAGE_KEY = "tuning-systems:scale";            // namespaced — regression-guarded by a test
export const SCALE_CHANGED_EVENT = "tuning-systems:scale-changed";  // CustomEvent name — regression-guarded by a test

export interface SharedScale { text: string; source?: string; }    // currency = scale TEXT (what textareas + #s= already speak)

export function readSharedScale(): SharedScale | null {
  try {
    const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    if (!storage) return null;
    const raw = storage.getItem(SCALE_STORAGE_KEY);
    if (raw == null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.text !== "string") return null;
    if (new TextEncoder().encode(obj.text).length > MAX_SCALE_TEXT_BYTES) return null; // cap on READ
    const source = typeof obj.source === "string" ? obj.source : undefined;
    return { text: obj.text, source };
  } catch { return null; }
}

export function writeSharedScale(text: string, source?: string): void {
  try {
    if (new TextEncoder().encode(text).length > MAX_SCALE_TEXT_BYTES) return; // refuse oversized on WRITE
    const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    if (storage) storage.setItem(SCALE_STORAGE_KEY, JSON.stringify({ text, source }));
  } catch { /* private browsing / quota — silent no-op, mirrors theme-prefs T-9mn-03 */ }
  // Broadcast even if persistence failed, so an open page still updates live this session.
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SCALE_CHANGED_EVENT, { detail: { text, source } }));
    }
  } catch { /* no window (SSR/node) — no-op */ }
}
```

> Planner note: decide whether the `CustomEvent` should still fire when persistence throws. Recommendation above: fire it (the live-update is the valuable half; persistence is best-effort). Document the decision; either is defensible.

### Pattern 2: The pure boot-precedence helper (the R1-testable seam)

**What:** A one-line pure function that encodes the C-3 precedence rule and gives both pages a single symbol to import, keeping each page's boot change to a single `??`-equivalent clause.
**When to use:** This is the load-bearing abstraction for SYNC-04. R1 asserts against it.

```ts
// Source: derived from the verified boot expressions in index.md (line 78) and analysis.md (line 70).
export function resolveInitialScaleText(
  hashDecoded: string | null,
  stored: SharedScale | null,
  seedText: string,
): string {
  return hashDecoded ?? stored?.text ?? seedText;
}
// Invariant the R1 gate locks: when stored === null,
//   resolveInitialScaleText(h, null, s) === (h ?? s)   for all h, s   → byte-identical boot.
```

### Pattern 3: The additive consumer opt-in (one boot edit + one listener cell)

**What:** On each consumer page, change exactly the boot symbol that feeds the textarea to call `resolveInitialScaleText`, and add ONE new cell that listens for `scale-changed` and writes the textarea via a synthetic `input` event.
**When to use:** `index.md` and `analysis.md`. **Nothing else in the boot/hash/write logic changes.**

```ts
// CONSUMER boot edit — index.md (line 78): was `const seedText = hashDecoded ?? seedTextLiteral;`
const seedText = resolveInitialScaleText(hashDecoded, readSharedScale(), seedTextLiteral);
// CONSUMER boot edit — analysis.md (line 70): was `const initialScaleText = hashDecoded ?? seedText;`
const initialScaleText = resolveInitialScaleText(hashDecoded, readSharedScale(), seedText);

// Required refactor so the listener can reach the element: split the existing
//   const scaleText = view(Inputs.textarea({...}));
// into a captured element + view pair:
const scaleInput = Inputs.textarea({ value: /* seedText | initialScaleText */, rows: 8, label: "…", submit: false });
const scaleText = view(scaleInput);   // value generator — flows IDENTICALLY to before

// NEW additive listener cell (writes ONLY the textarea — never the store):
{
  const onScale = (e) => {
    const t = e?.detail?.text;
    if (typeof t === "string" && t.length) {
      scaleInput.value = t;
      scaleInput.dispatchEvent(new Event("input", { bubbles: true })); // → existing parse + debounced hash-write
    }
  };
  window.addEventListener(SCALE_CHANGED_EVENT, onScale);
  invalidation.then(() => window.removeEventListener(SCALE_CHANGED_EVENT, onScale));
}
```

### Pattern 4: The producer Send-to button (the only writer)

```ts
// generate.md — mirrors index.md's "Analyze this scale →" button (lines 202–218, read this session).
{
  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = "Send to Dashboard →";
  btn.addEventListener("click", () => {
    const text = currentScaleText;                 // serialize the previewed Scale → text
    writeSharedScale(text, "<method-name>");        // THE only store write (one-way)
    try {
      const hash = "#s=" + encodeScaleToHash(text); // deep-link parity (unchanged codec)
      window.location.assign("../" + hash);          // generate.md is under /pages, Dashboard is "/"
    } catch (err) {
      console.warn("encodeScaleToHash failed:", err);
      window.location.assign("../");
    }
  });
  display(btn);
}
// "Send to Analysis →" is identical but assigns "./analysis" + hash.
```

> Path note: `generate.md` lives at `/pages/generate`. Dashboard is `/` (navigate `"../" + hash`), Analysis is `/pages/analysis` (navigate `"./analysis" + hash`). Verify against the actual rendered routes during execution.

### Anti-Patterns to Avoid

- **Consumer writing the store** → infinite `scale-changed` broadcast loop (R2). Listeners write ONLY the textarea. Only "Send to…" writes the store.
- **Touching the existing boot/hash/write logic beyond the single `??` clause.** The whole point of SYNC-04 is that everything else stays byte-identical. The only structural change is splitting `view(Inputs.textarea(...))` into a named element + `view` pair so the listener can reach it.
- **Adding a `tempered` (or any) field to `Interval`/`Scale`.** The dashboard depends on these types; do not churn them. Tempered-ness is a later-phase, component-layer concern. Phase 5's placeholder scale is plain JI.
- **Re-binding the synth or the `scale-changed` listener on every input** (Pitfall #11). Bind the page synth + the listener in dedicated cells with `invalidation.then(cleanup)` — copy `analysis.md`'s synth cell shape.
- **`new AudioContext()` at module top level** (Pitfall #2). `createSynth()` is lazy; the AudioContext is created on the first play gesture. Copy the verbatim pattern.
- **Building real generators in Phase 5.** The picker ships with placeholder options; the params-panel swap MECHANISM exists, but the per-method factories are Phases 6–8. Over-building here couples this gate phase to generator work and bloats the wave.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scale text ↔ `#s=` URL transport | A new serialization/share scheme | `encodeScaleToHash` / `decodeHashToScale` (`url.ts`, UNCHANGED) | Already shipped, tested (`url-hash-integration.test.ts`), version-byte + 8 KB cap. Send-to reuses it verbatim. |
| Namespaced-localStorage + broadcast state | A bespoke store | Mirror `theme-prefs.ts` exactly | The repo already has the proven carve-out pattern (constants + try/catch validate + `CustomEvent`). `scale-store.ts` is its twin. |
| Preview table / audition | A new table or audio path | `scaleTable` + `playScale` (existing components) | Fungible — any `Scale` renders/auditions identically (proven by `mosBuilder` reuse). |
| Page synth lifecycle | A new AudioContext owner | Copy `analysis.md`'s synth cell verbatim | Lazy AudioContext, Esc panic, activeVoices poll, consolidated `invalidation.then` cleanup — all already correct. |
| Length-cap constant | A new `8192` literal | `MAX_SCALE_TEXT_BYTES` from `url.ts` | Single source of truth; the store and the hash must agree on the cap. |
| Boot-equivalence assertion infra | A page-booting integration harness | A pure `resolveInitialScaleText` helper + node-env unit test | Boot is a pure `??` expression; a pure test is faster, deterministic, and matches `dashboard-seed.test.ts` precedent. |

**Key insight:** Phase 5 is almost entirely composition of existing, tested primitives. The only genuinely new code is `scale-store.ts` (≈ a `theme-prefs.ts` clone), `resolveInitialScaleText` (one line), the `generate.md` shell, and ~2 small edits per consumer page. The risk is not in building new things — it is in NOT destabilizing the things that already work. Treat every edit to `index.md` / `analysis.md` as additive-only, gated by R1.

## Runtime State Inventory

> Phase 5 is **additive surface + new module**, not a rename/refactor/migration of existing runtime state. There is no string-rename or data-migration component. This section is included because the phase edits two shipped pages and introduces a new persisted key — the planner should be aware of the one new piece of runtime state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | NEW: `localStorage["tuning-systems:scale"]` (JSON `{text, source?}`). No PRE-EXISTING stored data is renamed or migrated. The existing `tuning-systems:theme-prefs` and `tuning-systems:audio-prefs` keys are untouched. | New key only; no migration. Regression-guard the exact key string with a test (mirror `theme-prefs.test.ts`). |
| Live service config | None — static site, no external services. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None — no secrets in this feature. | None. |
| Build artifacts | None new. (The `.claude/worktrees/*` directories contain stale copies of source + tests from prior agent runs — they are NOT part of the build and Vitest excludes `node_modules`; confirm they are gitignored/ignored so they don't pollute the test glob.) | Verify worktrees don't get picked up by the test runner (they sit under `.claude/`, outside `src/`, so the `src/**` globs in `vitest.config.ts` already exclude them). |

**Nothing found in categories Live service config / OS-registered state / Secrets:** None — verified by reading `package.json` (static-site scripts only), `observablehq.config.ts` (no service config), and the absence of any `.env`/secrets tooling in the repo.

## Common Pitfalls

### Pitfall 1: Boot precedence regression (the SYNC-04 failure mode)
**What goes wrong:** A stale stored scale (or any non-empty store) overrides the seed/hash on an unrelated page load, so the Dashboard opens to a scale the user did not deep-link.
**Why it happens:** Getting the precedence wrong (`store ?? hash ?? seed`) or consulting the store unconditionally.
**How to avoid:** `hashDecoded ?? readSharedScale()?.text ?? seedText` via `resolveInitialScaleText`. When the store is empty, the new clause is inert — boot is byte-identical to today's `hash ?? seed`.
**Warning signs:** The Dashboard opens to a scale the user didn't deep-link; the R1 test fails or was never written.
**Detection:** The R1 boot-equivalence test (success criterion #4) — RED→GREEN before any Send-to wiring.

### Pitfall 2: Store→textarea→store feedback loop (R2)
**What goes wrong:** A consumer page writes back to the store and triggers an infinite `scale-changed` broadcast.
**Why it happens:** A listener (or a downstream cell) writing to the store in response to a `scale-changed` event.
**How to avoid:** Strict one-way data flow — ONLY the "Send to…" buttons write the store; consumer listeners write ONLY the textarea.
**Warning signs:** Repeated `scale-changed` events, UI thrash, runaway hash-writes.
**Detection:** A unit/integration test asserting the consumer listener performs no `setItem`; manual: open Generate + Dashboard, send once, confirm exactly one update.

### Pitfall 3: Synthetic-input feedback / textarea unreachable
**What goes wrong:** (a) The listener can't reach the textarea because `view(Inputs.textarea(...))` returned a value, not the element; or (b) dispatching `input` retriggers handlers unexpectedly.
**Why it happens:** The current pages inline `const scaleText = view(Inputs.textarea({...}))`, discarding the element.
**How to avoid:** Split into `const scaleInput = Inputs.textarea({...}); const scaleText = view(scaleInput);` so the listener references `scaleInput`. Set `value` BEFORE dispatching. A synthetic `input` is exactly what a keystroke does; the page already debounces (300 ms) and re-parses idempotently — no new code path.
**Warning signs:** Listener no-ops; or the `scaleText` reactive value stops flowing after the refactor.
**Detection:** Manual: send a scale, confirm the textarea updates and the table/hash follow. A focused test that the refactored `scaleText` value generator still yields the textarea's value.

### Pitfall 4: localStorage throws (private browsing / disabled storage)
**What goes wrong:** `getItem`/`setItem` throw in locked-down contexts and crash boot or Send-to.
**Why it happens:** Private browsing / storage disabled / quota exceeded.
**How to avoid:** `readSharedScale`/`writeSharedScale` wrap in try/catch → `null` / silent no-op (mirror `readThemePrefs` / T-9mn-03). The feature degrades gracefully to copy/paste + hash.
**Warning signs:** Uncaught exceptions on boot in private mode.
**Detection:** A `scale-store.test.ts` case stubbing `getItem`/`setItem` to throw (the `theme-prefs.test.ts` "private browsing" case is the exact precedent).

### Pitfall 5: Boot expressions differ between the two pages
**What goes wrong:** The planner assumes `index.md` and `analysis.md` have identical boot code and writes one edit instruction for both — but the symbol names and line numbers differ.
**Why it happens:** `index.md` uses `seedText = hashDecoded ?? seedTextLiteral` (line 78, feeding a separate `seedTextLiteral` constant); `analysis.md` uses `initialScaleText = hashDecoded ?? seedText` (line 70, where its `seedText` IS the literal).
**How to avoid:** Specify both edit sites explicitly. Both become `resolveInitialScaleText(hashDecoded, readSharedScale(), <that page's literal>)`, but the changed line and the third argument's name differ per page.
**Warning signs:** A patch that doesn't apply, or a page that ignores the store.
**Detection:** Read both files at execution time before editing; confirm the exact line.

## Code Examples

### `generate.md` page synth cell (copy verbatim from `analysis.md` lines 17–38)
```ts
// Source: src/pages/analysis.md lines 17–38 (read this session). Page owns the AudioContext.
const synth = createSynth();
const onKey = (e) => { if (e.key === "Escape") synth.panic(); };
document.addEventListener("keydown", onKey);
const audioActive = Mutable(false);
const activeVoicesInterval = setInterval(() => { audioActive.value = synth.activeVoices > 0; }, 100);
invalidation.then(() => {
  document.removeEventListener("keydown", onKey);
  clearInterval(activeVoicesInterval);
  synth.dispose();
});
```

### Method picker + param-panel swap host (Phase 5 ships the shell + mechanism only)
```ts
// Grouped <select> — families as <optgroup>s. Phase 5: placeholder options per family.
// Phases 6–8 register real methods; selecting one mounts its Pattern-2 factory into paramsHost.
const method = view(Inputs.select(
  new Map([
    ["— pick a method —", ""],
    ["Regular: (coming soon)", "regular-placeholder"],
    ["JI combinatorial: (coming soon)", "ji-placeholder"],
    ["Harmonic: (coming soon)", "harmonic-placeholder"],
    ["Advanced: (coming soon)", "advanced-placeholder"],
  ]),
  { label: "Method" },
));
```
```ts
// The swap MECHANISM: a params host + a preview host the chosen factory populates.
// In Phase 5 a placeholder/identity scale proves the pipeline through scaleTable + playScale.
const paramsHost = display(document.createElement("div"));
const previewHost = display(document.createElement("div"));
```
```ts
// Phase 5 placeholder: render a fixed Scale so preview + audition + Send-to are wired end-to-end.
// (The seed mirrors the dashboard's 7-limit JI heptatonic so the pipeline is obviously correct.)
const placeholderScale = new Scale(parseScala(`9/8\n5/4\n21/16\n3/2\n27/16\n7/4\n2/1`));
previewHost.replaceChildren(scaleTable(placeholderScale, 440), playScale(placeholderScale, synth, { baseHz: 440 }));
```

### The R1 boot-equivalence assertion (the gate)
```ts
// Source: pattern of src/__tests__/dashboard-seed.test.ts (pure, node env, no DOM).
import { describe, it, expect } from "vitest";
import { resolveInitialScaleText } from "../lib/scale-store.js";

describe("R1: empty-store boot equivalence (SYNC-04)", () => {
  const seed = "9/8\n2/1";
  const hash = "5/4\n2/1";
  it("with an EMPTY store, resolveInitialScaleText ≡ today's `hash ?? seed`", () => {
    // No hash, empty store → seed (byte-identical to the v1.0 boot)
    expect(resolveInitialScaleText(null, null, seed)).toBe(seed);
    // Hash present, empty store → hash (byte-identical to the v1.0 boot)
    expect(resolveInitialScaleText(hash, null, seed)).toBe(hash);
  });
  it("precedence: hash beats store beats seed (C-3)", () => {
    const stored = { text: "3/2\n2/1" };
    expect(resolveInitialScaleText(hash, stored, seed)).toBe(hash);        // hash wins
    expect(resolveInitialScaleText(null, stored, seed)).toBe(stored.text); // store next
    expect(resolveInitialScaleText(null, null, seed)).toBe(seed);          // seed last
  });
  it("never throws on a null stored value", () => {
    expect(() => resolveInitialScaleText(null, null, seed)).not.toThrow();
  });
});
```

### `CustomEvent` broadcast test (happy-dom, mirror the store-event pattern)
```ts
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { writeSharedScale, SCALE_CHANGED_EVENT } from "../scale-store.js";

it("writeSharedScale dispatches a CustomEvent with detail { text, source }", () => {
  const handler = vi.fn();
  window.addEventListener(SCALE_CHANGED_EVENT, handler);
  writeSharedScale("9/8\n2/1", "placeholder");
  expect(handler).toHaveBeenCalledTimes(1);
  const ev = handler.mock.calls[0][0];
  expect(ev.detail).toEqual({ text: "9/8\n2/1", source: "placeholder" });
  window.removeEventListener(SCALE_CHANGED_EVENT, handler);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual copy/paste of scale text between pages | Live shared state (`localStorage` + `CustomEvent`) beside the `#s=` hash | This milestone (v1.1) | An already-open Dashboard/Analysis tab updates live when Generate pushes a scale; the hash remains the deep-link/share/persist backbone. |
| Per-page bespoke boot logic | A single shared `resolveInitialScaleText(hash, store, seed)` precedence helper | This phase | One symbol, one precedence rule, one unit-testable gate (R1). |

**Deprecated/outdated:** None relevant to this phase. (Note: Observable Framework's `deploy` command to Observable Cloud is deprecated per CLAUDE.md, but Phase 5 does not touch deploy.)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `view(Inputs.textarea(...))` can be refactored to `const el = Inputs.textarea(...); const v = view(el);` with the `scaleText` reactive value flowing identically. | Pattern 3 / Pitfall 3 | LOW-MEDIUM — this is the standard Observable idiom (`view(element)` returns the element's value generator), but it touches a shipped cell. Verify the reactive value is unchanged before/after with a manual check + the existing dashboard tests. If it misbehaves, alternative: have the listener `document.querySelector` the page's textarea by a stable selector instead of capturing the element. |
| A2 | The `CustomEvent` should fire even when localStorage `setItem` throws (so live-update still works in private browsing). | Pattern 1 | LOW — a design choice, not a correctness issue. Either policy is defensible; document it. |
| A3 | Navigating from `/pages/generate` to Dashboard is `"../" + hash` and to Analysis is `"./analysis" + hash`. | Pattern 4 | LOW — derived from the route layout; verify against the actual rendered routes (`npm run dev`) during execution, exactly as `index.md`'s existing "Analyze this scale →" button does relative navigation. |
| A4 | A placeholder/identity scale (not a real generator) is sufficient to prove SURF-03 + SYNC-01/02 end-to-end in this phase. | Summary / SURF-03 | LOW — explicitly endorsed by the phase scope note ("at most one trivial placeholder/identity generator"). |
| A5 | Vitest's `node` environment is correct for the R1 pure-helper test; happy-dom is only needed for the `CustomEvent`/DOM-listener test. | Validation Architecture | LOW — confirmed: `vitest.config.ts` sets `environment: "node"` globally, and component tests opt into `// @vitest-environment happy-dom` per-file (verified in `mos-builder.test.ts`). |

## Open Questions

1. **Store persistence scope (`localStorage` vs `sessionStorage`).**
   - What we know: `localStorage` gives theme-prefs parity and "remember my last scale"; the hash always wins at boot so sharing is unaffected either way.
   - What's unclear: whether the user wants a pushed scale to survive a full browser restart, or only the session.
   - Recommendation: `localStorage` (OQ-1). It's a 1-line change to `sessionStorage` if the stale-scale behavior is undesired later.

2. **Should the `CustomEvent` fire when persistence throws?**
   - What we know: in private browsing, `setItem` throws; the live-update half is still valuable.
   - What's unclear: whether the team prefers "no persistence ⇒ no event" symmetry.
   - Recommendation: fire the event regardless (best-effort persistence). Document the choice.

3. **Does Send-to also navigate (deep-link), or only write the store?**
   - What we know: writing the store updates an already-open tab live; navigating with `#s=` seeds the target page on arrival (and persists in the URL for SYNC-03).
   - What's unclear: whether clicking "Send to Dashboard" from Generate should navigate the user to the Dashboard, or stay on Generate and assume a Dashboard tab is open.
   - Recommendation: do both — write the store (live update for any open tab) AND navigate with `#s=` (matches the existing "Analyze this scale →" UX and guarantees SYNC-03 persistence). This is the most predictable behavior for a single-tab user.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@observablehq/framework` | the new page + build | ✓ | 1.13.4 (installed) | none needed |
| `fraction.js` | `Interval` (placeholder scale, serialization) | ✓ | 5.3.4 (pinned) | none |
| `sw-synth` | page synth | ✓ | 0.4.0 (via `npm:` alias) | none |
| `happy-dom` | DOM/`CustomEvent` tests | ✓ | 15.11.7 (devDep) | none |
| `vitest` | test runner | ✓ | 2.1.9 (devDep) | none |
| `localStorage` / `CustomEvent` / `TextEncoder` | the store | ✓ (browser; stubbed in tests) | — | try/catch → null/no-op (graceful degrade) |
| Node 20 LTS | build/test runtime | ✓ (`@types/node@^20`) | 20.x | none |

**Missing dependencies with no fallback:** none — every dependency is already installed and in use by shipped v1.0 code.
**Missing dependencies with fallback:** `localStorage`/`CustomEvent` degrade gracefully to copy/paste + hash in locked-down contexts (try/catch).

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` `[VERIFIED: read]` → section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^2.1.9` `[VERIFIED: package.json]` |
| Config file | `vitest.config.ts` `[VERIFIED: read]` — `environment: "node"`, `globals: false`; `npm:` aliases for sw-synth/ji-lattice/plot; test globs cover `src/lib/**`, `src/__tests__/**`, `src/components/**/__tests__/**`, `src/theme/**/__tests__/**` |
| DOM environment | `happy-dom@^15.11.7` (devDep), opted-in per-file via `// @vitest-environment happy-dom` (precedent: `mos-builder.test.ts`) |
| Quick run command | `npx vitest run <file>` (per-module) |
| Full suite command | `npm run test` (= `vitest run`) |
| Lint gate | `npm run lint:types` (`tsc --noEmit`) + `npm run lint` (ESLint, R-01 fraction rule) + `npm run format:check` |
| Build gate | `npm run build` (`observable build`) — proves the new page compiles + nav renders |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYNC-04 | **R1: empty store ⇒ `resolveInitialScaleText` ≡ `hash ?? seed` (byte-identical boot)** | unit (node) | `npx vitest run src/__tests__/scale-store-boot.test.ts` | ❌ Wave 0 (the gate) |
| SYNC-04 | Precedence C-3: hash beats store beats seed | unit (node) | `npx vitest run src/__tests__/scale-store-boot.test.ts` | ❌ Wave 0 |
| SYNC-01/02/03 | `writeSharedScale` then `readSharedScale` round-trips `{text, source}` | unit (node) | `npx vitest run src/lib/__tests__/scale-store.test.ts` | ❌ Wave 0 |
| SYNC-01/02/03 | Store key + event-name constants are the exact namespaced strings (regression guard) | unit (node) | `npx vitest run src/lib/__tests__/scale-store.test.ts` | ❌ Wave 0 |
| SYNC-* | `readSharedScale` returns `null` on absent / malformed JSON / wrong shape / array / primitive / oversized | unit (node) | `npx vitest run src/lib/__tests__/scale-store.test.ts` | ❌ Wave 0 |
| SYNC-* | `localStorage` throws (stub getItem/setItem) ⇒ read `null`, write silent no-op | unit (node) | `npx vitest run src/lib/__tests__/scale-store.test.ts` | ❌ Wave 0 |
| SYNC-01/02 | `writeSharedScale` dispatches `CustomEvent(SCALE_CHANGED_EVENT)` with `detail {text, source}` | unit (happy-dom) | `npx vitest run src/lib/__tests__/scale-store.test.ts` | ❌ Wave 0 |
| SYNC-* (R2) | Consumer listener performs NO store write (one-way data flow) | unit/manual | manual two-tab; optional happy-dom test that the listener calls no `setItem` | ❌ Wave 0 |
| SYNC-04 | Existing dashboard-seed + url-hash round-trip tests still pass (no regression) | unit (existing) | `npx vitest run src/__tests__/dashboard-seed.test.ts src/__tests__/url-hash-integration.test.ts` | ✅ exists |
| SURF-01 | `/pages/generate` compiles; nav shows Generate between Analysis and Theory | build/manual | `npm run build`; `npm run dev` → visit `/pages/generate` | ❌ Wave 0 |
| SURF-02 | Picker renders grouped options; selecting swaps the params host | manual (Ph5 placeholder) / happy-dom (when a factory exists) | `npm run dev` | ❌ Wave 0 |
| SURF-03 | Preview table renders + Play auditions a (placeholder) scale | manual / reuse scaleTable+playScale (already tested) | `npm run dev` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run <touched module>.test.ts` (< 5 s). The R1 test runs on every commit that touches `scale-store.ts` or either consumer page.
- **Per wave merge:** `npm run test` (full suite) + `npm run lint:types` + `npm run lint` (R-01 green) + `npm run build`.
- **Phase gate:** full suite green (incl. R1 + the unchanged dashboard-seed / url-hash tests) + lint + build before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `src/lib/scale-store.ts` — the module under test (constants + read/write/validate + `resolveInitialScaleText`)
- [ ] `src/lib/__tests__/scale-store.test.ts` — store read/write/validate/cap/throws (node) + `CustomEvent` dispatch (happy-dom). Mirror `theme-prefs.test.ts` branch coverage.
- [ ] `src/__tests__/scale-store-boot.test.ts` — **the R1 boot-equivalence gate** (pure, node). RED→GREEN before any Send-to wiring.
- [ ] (No new test framework install needed — Vitest + happy-dom already present.)

## Security Domain

> `security_enforcement` not explicitly `false` in config → included. Phase 5 is low surface: no auth, no crypto, no network.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | `readSharedScale` validates shape (`text` is a string), caps length at `MAX_SCALE_TEXT_BYTES` (8 KB), and returns `null` on any failure. Scale text reaching a consumer is parsed by the existing `parseScala` (already a hardened trust boundary per `scala.ts`). |
| V5 Output Encoding (XSS) | yes | All dynamic render via `createElement` + `textContent` (NEVER `innerHTML`) — repo discipline (T-02-22/23, T-04-13), already enforced in `scaleTable`/`mosBuilder`. Applies to scale text from the store and to the `source` label if ever displayed. |
| V6 Cryptography | no | No secrets/crypto in this feature. |
| Tampering (localStorage) | yes | `readSharedScale` validates + caps + try/catch (mirrors `readThemePrefs` T-9mn-01/03); malformed/oversized stored value → `null` → seed fallback. Tampered text still flows through `parseScala`'s try/catch on the consumer. |
| Code injection | no (Phase 5) | No `eval`/`Function`/DSL evaluation in Phase 5 — the SonicWeave `evaluateSource` surface arrives in Phase 7, not here. |

### Known Threat Patterns for {Observable Framework + localStorage + CustomEvent}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via scale text rendered as HTML | Tampering | `textContent` only at every render boundary (existing discipline; `scaleTable` already compliant). |
| localStorage tampering (oversized/malformed shared scale) | Tampering | length cap (`MAX_SCALE_TEXT_BYTES`) + shape validation + try/catch in `scale-store.ts`; consumer `parseScala` is a second try/catch boundary. |
| Event-loop / resource exhaustion via store feedback | DoS | One-way data flow — consumers NEVER write the store (R2). Listener writes only the textarea. |
| Oversized URL hash (DoS) | DoS | Unchanged `url.ts` already rejects hashes > 16 KB and caps decoded plaintext at 8 KB. Send-to reuses it verbatim. |

## Sources

### Primary (HIGH confidence — read this session at repo HEAD)
- `src/index.md` (Dashboard) — boot at lines 53–78 (`hashDecoded`, `seedTextLiteral`, `seedText = hashDecoded ?? seedTextLiteral`), textarea at 84–89, debounced hash-write at 134–151, "Analyze this scale →" button at 202–218. `[VERIFIED]`
- `src/pages/analysis.md` — synth cell 17–38, seed 46–52, hash-read + `initialScaleText = hashDecoded ?? seedText` at 56–71, textarea 88–93, hash-write 130–148, Stop button 187–200. `[VERIFIED]`
- `src/theme/theme-prefs.ts` — the carve-out twin pattern (namespaced key, `CustomEvent` name, try/catch validation, returns default on any failure). `[VERIFIED]`
- `src/theme/__tests__/theme-prefs.test.ts` — the exact test shape to mirror (constant regression guards + every localStorage failure branch via `vi.stubGlobal`). `[VERIFIED]`
- `src/lib/url.ts` — `encodeScaleToHash`/`decodeHashToScale`, `MAX_SCALE_TEXT_BYTES = 8192`, version byte, 16 KB hash cap. UNCHANGED in Phase 5. `[VERIFIED]`
- `src/__tests__/dashboard-seed.test.ts` + `src/__tests__/url-hash-integration.test.ts` — existing pure boot/round-trip tests (node env) — the precedent for the R1 pure-helper test. `[VERIFIED]`
- `src/components/mos-builder.ts` + `src/components/__tests__/mos-builder.test.ts` + `src/components/__tests__/test-utils.ts` — Pattern-2 factory shape + happy-dom test + `makeStubSynth`. `[VERIFIED]`
- `src/components/scale-table.ts`, `src/components/play-scale.ts` — preview + audition primitives (fungible for any `Scale`). `[VERIFIED]`
- `src/audio/synth.ts` — `SynthHandle` API (`playArpeggio`, `panic`, `dispose`, `activeVoices`), lazy AudioContext. `[VERIFIED]`
- `src/lib/scale.ts`, `src/lib/interval.ts`, `src/lib/scala.ts` (header + cents-detection line 260) — scale representation + text currency. `[VERIFIED]`
- `observablehq.config.ts` — nav `pages[]` + `header` breadcrumb (two edit sites for "Generate"). `[VERIFIED]`
- `vitest.config.ts` — `environment: "node"`, test globs, `npm:` aliases. `[VERIFIED]`
- `package.json` — installed deps + scripts (no install needed). `[VERIFIED]`
- `eslint.config.js` (line 49) — R-01: bans `Fraction` from `xen-dev-utils`. `[VERIFIED]`
- `src/lib/INVENTORY.md` — kernel inventory format (add a Phase 5 section). `[VERIFIED]`
- `.planning/quick/260608-dyv-scale-generation/{CONTEXT,RESEARCH,PLAN}.md` — locked decisions + Half C integration design + Wave 0 task decomposition (Phase 5 ≡ Wave 0). `[VERIFIED: read]`
- `.planning/{REQUIREMENTS,ROADMAP}.md` — SURF-01..03 + SYNC-01..04 ownership, Phase 5 success criteria. `[VERIFIED: read]`

### Secondary (MEDIUM confidence)
- None required — every Phase 5 claim is grounded in this repo's source at HEAD.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Integration design (store + boot precedence + R1 gate): HIGH — derived directly from the verified `index.md`/`analysis.md` boot code, `theme-prefs.ts`, and `url.ts`.
- Standard stack / no-new-deps: HIGH — confirmed against `package.json`; nothing installed.
- Test harness fit (node vs happy-dom, `vi.stubGlobal`, pure-helper R1): HIGH — confirmed against `vitest.config.ts`, `theme-prefs.test.ts`, `mos-builder.test.ts`.
- Page scaffold (picker shell, synth cell, Send-to button): HIGH — copy verbatim from `analysis.md` + `index.md`'s existing patterns.
- Two open design choices (persistence scope OQ-1, event-on-throw policy): MEDIUM — both defensible; recommendations given.

**Research date:** 2026-06-08
**Valid until:** ~30 days (stable kernel + pinned deps; the integration design is anchored to this repo's source, which only changes when this feature lands).
