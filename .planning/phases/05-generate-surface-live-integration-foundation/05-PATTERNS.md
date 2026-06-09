# Phase 5: Generate Surface & Live Integration Foundation - Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 8 (3 new, 2 edited pages, 1 edited config, 2 new test files)
**Analogs found:** 8 / 8 (every new/edited file has a verified in-repo analog at HEAD)

All file references below were read at repo HEAD this session. Line numbers are accurate as of read. Per CLAUDE.md: TypeScript modules are imported with the `.js` extension (Framework transpiles `.ts` → `.js`); BigInt `Fraction` is the source of truth; no top-level `AudioContext`; R-01 ESLint bans `Fraction` from `xen-dev-utils`.

> **D-08 (LOCKED) path note:** the shared store lives at **`src/state/scale-store.ts`** (new `src/state/` dir), NOT `src/lib/`. All references below use `src/state/scale-store.ts`. Import paths: `./state/scale-store.js` from `src/index.md` (repo root); `../state/scale-store.js` from `src/pages/*.md` (under `/pages`); `../lib/url.js` for the `MAX_SCALE_TEXT_BYTES` import inside the store module.

---

## File Classification

| New/Modified File | Status | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/pages/generate.md` | NEW | page (reactive cells) | request-response + event-driven (producer) | `src/pages/analysis.md` | exact (sibling builder page) |
| `src/state/scale-store.ts` | NEW | store / pure state module | pub-sub (localStorage + CustomEvent) | `src/theme/theme-prefs.ts` | exact (carve-out twin) |
| `src/index.md` | EDIT (additive) | page / consumer | event-driven (subscribe) + boot-precedence | self (boot line 78) + Pattern 3 below | exact |
| `src/pages/analysis.md` | EDIT (additive) | page / consumer | event-driven (subscribe) + boot-precedence | self (boot line 70) + Pattern 3 below | exact |
| `observablehq.config.ts` | EDIT (additive) | config / nav | n/a (static registration) | self (`pages[]` + `header`) | exact |
| `src/state/__tests__/scale-store.test.ts` | NEW | test (unit) | n/a | `src/theme/__tests__/theme-prefs.test.ts` | exact |
| `src/__tests__/scale-store-boot.test.ts` | NEW | test (unit, R1 gate) | n/a | `src/__tests__/dashboard-seed.test.ts` | exact (pure node-env) |

Reused-verbatim (NOT edited, no analog needed — compose into `generate.md`): `scaleTable` (`src/components/scale-table.ts`), `playScale` (`src/components/play-scale.ts`), `createSynth` (`src/audio/synth.ts`), `encodeScaleToHash`/`decodeHashToScale`/`MAX_SCALE_TEXT_BYTES` (`src/lib/url.ts`, UNCHANGED).

---

## Pattern Assignments

### `src/pages/generate.md` (page, producer)

**Analog:** `src/pages/analysis.md` — the sibling interactive-builder page. `generate.md` should read as its twin (same tokens, same idioms, same synth-cell shape).

**Imports pattern** — model on `analysis.md` lines 5–15. New page needs:
```ts
import { Scale } from "../lib/scale.js";
import { parseScala } from "../lib/scala.js";
import { createSynth } from "../audio/synth.js";
import { scaleTable } from "../components/scale-table.js";
import { playScale } from "../components/play-scale.js";
import { encodeScaleToHash } from "../lib/url.js";
import { writeSharedScale } from "../state/scale-store.js";   // D-08: store is under src/state/
```
Note the `.js` extension on every `.ts` module (Framework convention, CLAUDE.md). `generate.md` lives at `/pages/` so paths are `../lib/...` / `../state/...` exactly like `analysis.md`.

**Synth-cell pattern (copy VERBATIM)** — `analysis.md` lines 27–38. This is the page-owned AudioContext (Pattern 4 / Pitfall #2). Esc-panic + activeVoices poll are bound HERE, not in any scale cell (Pitfall #11), and `invalidation.then()` consolidates cleanup:
```ts
const synth = createSynth();
const onKey = (e) => { if (e.key === "Escape") synth.panic(); };
document.addEventListener("keydown", onKey);
const audioActive = Mutable(false);
const activeVoicesInterval = setInterval(() => {
  audioActive.value = synth.activeVoices > 0;
}, 100);
invalidation.then(() => {
  document.removeEventListener("keydown", onKey);
  clearInterval(activeVoicesInterval);
  synth.dispose();
});
```

**Placeholder seed scale (copy VERBATIM)** — `analysis.md` lines 46–52 / `index.md` lines 66–72. The same 7-limit JI heptatonic. Template literal MUST start at column 0 (no leading whitespace — `parseScala` rejects whitespace in ratio tokens):
```ts
const seedText = `9/8
5/4
21/16
3/2
27/16
7/4
2/1`;
```
Per UI-SPEC line 175 this is the Phase-5 demo/placeholder scale. Plain JI — do NOT add a `tempered` field to `Interval`/`Scale` (RESEARCH anti-pattern; line 326).

> D-06 reconciliation: Phase 5 wires ONE real exact-rational method (recommended: harmonic-segment `n:n+1:…:2n`, a single integer param). The placeholder seed above is the simplest pipeline-proving render; the live reference method is the discretionary D-13 upgrade that makes "preview updates as params change" genuinely demonstrable.

**Method picker pattern (NEW — one `<optgroup>` per family, AUTHORITATIVE per D-04 / UI-SPEC)** — RESEARCH lines 414–425; UI-SPEC lines 108–111, 203. The picker MUST render **four `<optgroup>` elements** (one per family) with the locked labels, plus the leading `— pick a method —` placeholder option.

> ⚠️ **Illustrative-only caution:** A flat `Inputs.select(new Map([...]))` that puts the family label inside the option TEXT (e.g. `["Harmonic: (coming soon)", "harmonic-placeholder"]`) is the WRONG shape — it produces a single ungrouped list with NO `<optgroup>` elements, violating D-04. Do not copy that form. Use a grouped form that emits real `<optgroup>`s. Two acceptable approaches:

Approach A — `Inputs.select` with a `Map` + a grouping/format that produces optgroups (Observable Inputs supports grouping a `Map<groupLabel, options>` / nested structure). Keys are the four family labels; each value is that family's option(s):
```ts
// Map keyed by family label → that family's option ids/labels (produces <optgroup> per key)
const method = view(Inputs.select(
  new Map([
    ["Regular / equal temperament", ["regular-placeholder"]],
    ["JI combinatorial", ["ji-placeholder"]],
    ["Harmonic & interval divisions", ["harmonic-segment"]],   // the one functional reference method
    ["Advanced / algorithmic", ["advanced-placeholder"]],
  ]),
  { label: "Method", format: /* map id → display label, incl. "(coming soon)" for placeholders */ },
));
```

Approach B — build the native `<select>` directly with four `document.createElement("optgroup")` (one per family, `optgroup.label` = the locked family string), append each family's `<option>`s, prepend the `— pick a method —` option, then wrap so `view()` yields the selected method id. This is the most explicit way to guarantee exactly four `<optgroup>`s.

Whichever approach: the only functional option is `harmonic-segment` under `Harmonic & interval divisions`; the other three families carry `(coming soon)` placeholder options. **Verify at runtime: `document.querySelectorAll("optgroup").length === 4`.**

**Params-host / preview-host swap MECHANISM (NEW — the deliverable)** — RESEARCH lines 427–438; UI-SPEC lines 173, 204. `display()` returns the element so later cells can `replaceChildren` into it:
```ts
const paramsHost = display(document.createElement("div"));
const previewHost = display(document.createElement("div"));
// on method change: paramsHost.replaceChildren(factoryEl ?? emptyStateEl)
// preview: previewHost.replaceChildren(scaleTable(scale, baseHz), playScale(scale, synth, { baseHz }))
```
Re-render is `replaceChildren`, never `innerHTML`; text via `createElement`+`textContent` (XSS discipline — see Shared Patterns). The `scaleTable + playScale` preview pair is exactly how `mos-builder.ts` renders (lines 276–277).

**baseHz input (copy idiom)** — `analysis.md` line 126 / `index.md` lines 105–109:
```ts
const baseHz = view(Inputs.number({ value: 440, step: 0.01, label: "Reference pitch (Hz)" }));
```

**"Send to …" button pattern (the ONLY store writer)** — model on `index.md`'s "Analyze this scale →" button, lines 202–218 (the exact cross-page-pass precedent). The Phase-5 version adds the single `writeSharedScale(...)` call before navigating:
```ts
{
  const btn = document.createElement("button");
  btn.className = "play-btn";              // accent CTA per UI-SPEC line 86
  btn.type = "button";
  btn.textContent = "Send to Dashboard →";
  btn.setAttribute("aria-label", "Send the current scale to the Dashboard and open it.");
  btn.addEventListener("click", () => {
    const text = currentScaleText;          // serialize the previewed Scale → text
    writeSharedScale(text, "<method-name>"); // THE only store write (one-way data flow)
    try {
      const hash = "#s=" + encodeScaleToHash(text);
      window.location.assign("../" + hash);  // Dashboard is "/" from /pages/generate
    } catch (err) {
      console.warn("encodeScaleToHash failed:", err);
      window.location.assign("../");          // fallback: target loads its own seed
    }
  });
  display(btn);
}
```
"Send to Analysis →" is identical but navigates `"./analysis" + hash`. On the > 8 KB RangeError, surface the UI-SPEC cap-error copy (line 123) and navigate without the hash. **Verify the `"../"` / `"./analysis"` relative routes at execution time** (RESEARCH A3 / UI-SPEC line 143) the way the existing button does.

**Floating Stop-all-audio button (copy VERBATIM)** — `analysis.md` lines 191–200 (identical to `index.md` lines 240–249). Visible only when `audioActive` is true; Esc keybinding already bound in the synth cell:
```ts
{
  const btn = document.createElement("button");
  btn.className = "stop-all-audio";
  btn.type = "button";
  btn.textContent = "Stop all audio (Esc)";
  btn.setAttribute("aria-label", "Stop all audio. Keyboard shortcut: Escape.");
  btn.style.display = audioActive ? "inline-flex" : "none";
  btn.addEventListener("click", () => synth.panic());
  display(btn);
}
```

---

### `src/state/scale-store.ts` (store, pub-sub)

**Analog:** `src/theme/theme-prefs.ts` — the exact carve-out twin. Mirror its structure: namespaced key constant + event-name constant + try/catch read that never throws and returns `null`/default on any failure. The file is "the ONE allowed shared dependency between page and store" (`theme-prefs.ts` doc lines 17–23). Per D-08 it lives at `src/state/scale-store.ts` (new `src/state/` dir).

**Constants pattern** — `theme-prefs.ts` lines 44, 48 (`THEME_PREFS_STORAGE_KEY`, `THEME_PREFS_EVENT`). Reuse the 8 KB cap from `url.ts` (do NOT invent a second literal; import path is `../lib/url.js` from `src/state/`):
```ts
import { MAX_SCALE_TEXT_BYTES } from "../lib/url.js";   // = 8192, single source of truth (store is in src/state/)
export const SCALE_STORAGE_KEY = "tuning-systems:scale";
export const SCALE_CHANGED_EVENT = "tuning-systems:scale-changed";
export interface SharedScale { text: string; source?: string; }
```

**Read-with-validate pattern (mirror `readThemePrefs`)** — `theme-prefs.ts` lines 81–96. Same try/catch shape, same `globalThis.localStorage` guard, same `parsed object / array / primitive` rejections, plus the 8 KB cap on read:
```ts
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
    if (new TextEncoder().encode(obj.text).length > MAX_SCALE_TEXT_BYTES) return null;
    const source = typeof obj.source === "string" ? obj.source : undefined;
    return { text: obj.text, source };
  } catch { return null; }
}
```

**Write + broadcast pattern (the side-effecting half)** — RESEARCH lines 229–241. The cap-check refuses oversized on write; the `CustomEvent` fires even if persistence throws (the live-update is the valuable half — RESEARCH OQ-2 / A2, document the choice):
```ts
export function writeSharedScale(text: string, source?: string): void {
  try {
    if (new TextEncoder().encode(text).length > MAX_SCALE_TEXT_BYTES) return;
    const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    if (storage) storage.setItem(SCALE_STORAGE_KEY, JSON.stringify({ text, source }));
  } catch { /* private browsing / quota — silent no-op (mirrors theme-prefs T-9mn-03) */ }
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SCALE_CHANGED_EVENT, { detail: { text, source } }));
    }
  } catch { /* no window (node) — no-op */ }
}
```

**Boot-precedence helper (NEW — the R1-testable seam)** — RESEARCH lines 251–262. A one-line pure function; the load-bearing abstraction for SYNC-04. Lives in this module so both consumer pages import one symbol:
```ts
export function resolveInitialScaleText(
  hashDecoded: string | null,
  stored: SharedScale | null,
  seedText: string,
): string {
  return hashDecoded ?? stored?.text ?? seedText;
}
// Invariant R1 locks: when stored === null, this === (hashDecoded ?? seedText), byte-for-byte.
```

---

### `src/index.md` (Dashboard, consumer — ADDITIVE EDIT ONLY)

**Analog:** itself. The boot expression at **line 78** is `const seedText = hashDecoded ?? seedTextLiteral;`. The additive change is exactly the `??` chain → the helper. Nothing else in boot/hash-read/debounced-write/textarea logic changes (SYNC-04 / D-12).

**Boot edit (line 78)** — RESEARCH line 271:
```ts
// was: const seedText = hashDecoded ?? seedTextLiteral;
const seedText = resolveInitialScaleText(hashDecoded, readSharedScale(), seedTextLiteral);
```
Add the import `import { readSharedScale, resolveInitialScaleText, SCALE_CHANGED_EVENT } from "./state/scale-store.js";` to the import cell (lines 10–23). The store is at `src/state/scale-store.ts` (D-08) and the Dashboard is at the repo root, so the path is `./state/...` (NOT `./lib/...`).

**Textarea split (line 84–89)** — required so the listener can reach the element. The current cell discards the element by inlining `view(Inputs.textarea(...))`. Split into a captured element + `view` pair (RESEARCH Pitfall 3, lines 374–379):
```ts
const scaleInput = Inputs.textarea({ value: seedText, rows: 8, label: "Scale (one pitch per line — ratio, cents, or monzo)", submit: false });
const scaleText = view(scaleInput);   // value generator flows IDENTICALLY to before
```

**NEW additive listener cell** — RESEARCH lines 282–292. Writes ONLY the textarea via a synthetic `input` (drives the page's existing parse + debounced hash-write through their UNCHANGED path). NEVER writes the store (R2 guard):
```ts
{
  const onScale = (e) => {
    const t = e?.detail?.text;
    if (typeof t === "string" && t.length) {
      scaleInput.value = t;
      scaleInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  window.addEventListener(SCALE_CHANGED_EVENT, onScale);
  invalidation.then(() => window.removeEventListener(SCALE_CHANGED_EVENT, onScale));
}
```

---

### `src/pages/analysis.md` (Analysis, consumer — ADDITIVE EDIT ONLY)

**Analog:** itself. **Pitfall 5 (RESEARCH lines 388–393): the boot symbol and line DIFFER from `index.md`.** The boot expression at **line 70** is `const initialScaleText = hashDecoded ?? seedText;` (here `seedText`, lines 46–52, IS the literal).

**Boot edit (line 70)** — RESEARCH line 273:
```ts
// was: const initialScaleText = hashDecoded ?? seedText;
const initialScaleText = resolveInitialScaleText(hashDecoded, readSharedScale(), seedText);
```
Add the import `import { readSharedScale, resolveInitialScaleText, SCALE_CHANGED_EVENT } from "../state/scale-store.js";` to the import cell (lines 5–15). The page is under `/pages` and the store is at `src/state/scale-store.ts` (D-08), so the path is `../state/...`.

**Textarea split (lines 88–93)** — same refactor as Dashboard, feeding `initialScaleText`:
```ts
const scaleInput = Inputs.textarea({ value: initialScaleText, rows: 8, label: "Scale (one pitch per line — ratio, cents, or monzo)", submit: false });
const scaleText = view(scaleInput);
```

**NEW additive listener cell** — identical to the Dashboard listener cell above (references this page's `scaleInput`).

---

### `observablehq.config.ts` (config — ADDITIVE EDIT, two sites)

**Analog:** itself. Two edit sites (RESEARCH line 196, SURF-01 note):

1. **`pages[]` array (lines 20–22)** — insert "Generate" BETWEEN "Analysis" and "Theory notes" (D-01 / ROADMAP SC1):
```ts
{ name: "Dashboard", path: "/" },
{ name: "Analysis", path: "/pages/analysis" },
{ name: "Generate", path: "/pages/generate" },   // NEW — between Analysis and Theory notes
{ name: "Theory notes", open: true, pages: [ /* … */ ] },
```
2. **`header` breadcrumb string (line 18)** — add a "Generate" link in the same `·`-separated span, in the same position (after Analysis, before Theory).

---

### `src/state/__tests__/scale-store.test.ts` (test — NEW)

**Analog:** `src/theme/__tests__/theme-prefs.test.ts` (read this session). Mirror its structure exactly:
- **Constant regression guards** (theme-prefs.test.ts lines 19–37): assert `SCALE_STORAGE_KEY === "tuning-systems:scale"` and `SCALE_CHANGED_EVENT === "tuning-systems:scale-changed"` (renaming silently breaks persistence).
- **Read validation branches** via `vi.stubGlobal("localStorage", …)` with `afterEach(() => vi.unstubAllGlobals())` (theme-prefs.test.ts imports `vi, afterEach` line 1): absent / malformed JSON / array / primitive / wrong-shape / oversized → `null`; `getItem`/`setItem` throw → `null` / silent no-op.
- **Round-trip** `writeSharedScale` then `readSharedScale` yields `{text, source}`.
- **CustomEvent dispatch** in a `// @vitest-environment happy-dom` block (RESEARCH lines 468–481): `writeSharedScale` fires one `CustomEvent(SCALE_CHANGED_EVENT)` with `detail {text, source}`.

Node env is the default (`vitest.config.ts` `environment: "node"`); happy-dom is opted-in per-file for the DOM/event test. The test lives at `src/state/__tests__/` and `vitest.config.ts` `test.include` must be extended to cover `src/state/**` (Plan 01 Task 2).

---

### `src/__tests__/scale-store-boot.test.ts` (test — NEW — THE R1 GATE)

**Analog:** `src/__tests__/dashboard-seed.test.ts` (pure, node env, no DOM). RESEARCH lines 440–465. This is the wave gate: RED → GREEN **before any "Send to …" wiring exists**. Asserts the SYNC-04 invariant — empty-store boot ≡ today's `hash ?? seed` — plus the C-3 precedence (hash beats store beats seed) and never-throws-on-null:
```ts
import { describe, it, expect } from "vitest";
import { resolveInitialScaleText } from "../state/scale-store.js";   // D-08: store under src/state/
// empty store: resolveInitialScaleText(null, null, seed) === seed; (hash, null, seed) === hash
// precedence: (hash, stored, seed) === hash; (null, stored, seed) === stored.text; (null, null, seed) === seed
```

---

## Shared Patterns

### XSS discipline (createElement + textContent, NEVER innerHTML)
**Source:** `src/components/mos-builder.ts` lines 101–145, 242–243, 281; `src/pages/analysis.md` lines 77–84, 114–122.
**Apply to:** every dynamic render in `generate.md` — params-host "coming soon" / empty-state text, status/error regions, the Send-to buttons. All re-render via `replaceChildren`. Text via `node.textContent = …`; dynamic substrings via `document.createTextNode(...)`. The decoded scale text from the store is rendered only through `scaleTable` (already audited) and the textarea `.value` — never `innerHTML`.

### Status / error region (role="status", aria-live="polite")
**Source:** `src/pages/analysis.md` lines 77–84 (hash-error), 191–200 (controls); `src/components/mos-builder.ts` lines 204–208.
**Apply to:** `generate.md` status region (UI-SPEC line 194) and the Send-to > 8 KB cap-error. Reuse `.dashboard-error` (error) / `.dashboard-helper` (status) classes; `createElement` + `textContent`.

### Page-owned synth lifecycle (Pattern 4 / Pitfall #2 / Pitfall #11)
**Source:** `src/pages/analysis.md` lines 27–38 (identical to `index.md` lines 34–45).
**Apply to:** `generate.md` synth cell — copy verbatim. The synth cell depends on NO other cell; Esc-panic + activeVoices poll bound here; all cleanup in one `invalidation.then()`. No top-level `AudioContext` (CLAUDE.md; lazy `createSynth()`).

### `#s=` hash transport (UNCHANGED `url.ts`)
**Source:** `src/lib/url.ts` — `encodeScaleToHash`/`decodeHashToScale` (lines 46–92), `MAX_SCALE_TEXT_BYTES = 8192` (line 43), version byte, 8 KB / 16 KB caps. The existing producer precedent is `index.md` lines 208–216 ("Analyze this scale →").
**Apply to:** `scale-store.ts` length cap (import the constant from `../lib/url.js` — do not re-declare `8192`) and the Send-to navigation (reuse the codec verbatim). Phase 5 changes nothing in `url.ts`.

### Namespaced-localStorage + CustomEvent state (the carve-out twin)
**Source:** `src/theme/theme-prefs.ts` (whole file — namespaced key + event-name constants + try/catch read that returns default and never throws).
**Apply to:** `src/state/scale-store.ts` structure 1:1. Three-layer purity held: no DOM, no top-level side effects in the read path; the write path's `localStorage.setItem` + `dispatchEvent` are the only side effects.

### One-way data flow (R2 guard — HARD constraint)
**Source:** design constraint, RESEARCH lines 322–324, 367–372; UI-SPEC line 217.
**Apply to:** consumer listener cells on `index.md` / `analysis.md` — they write ONLY the textarea, NEVER the store. Only the `generate.md` "Send to …" buttons call `writeSharedScale`. Prevents the infinite `scale-changed` broadcast loop.

---

## No Analog Found

None. Every new and edited file has a verified in-repo analog at HEAD. The only genuinely novel code is small and pattern-derived: `src/state/scale-store.ts` (a `theme-prefs.ts` clone + the `MAX_SCALE_TEXT_BYTES` import + the one-line `resolveInitialScaleText`), the `generate.md` shell (composed from `analysis.md` cells + the new grouped `Inputs.select`/native-optgroup picker and host-div swap), and the two additive consumer edits. The reference exact-rational generator method (D-06/D-13, e.g. harmonic-segment) is the one piece with no direct analog — but it composes the same `Interval`/`Scale` → `scaleTable`+`playScale` path that `mos-builder.ts` already demonstrates, so the planner should follow the `mos-builder.ts` Pattern-2 factory shape (closure-local state, `replaceChildren` re-render) if it is built as a factory rather than inline cells.

---

## Metadata

**Analog search scope:** `src/pages/`, `src/lib/`, `src/state/`, `src/theme/`, `src/components/`, `src/audio/`, `src/__tests__/`, `observablehq.config.ts`.
**Files scanned / read at HEAD:** `src/pages/analysis.md`, `src/index.md`, `src/theme/theme-prefs.ts`, `src/theme/__tests__/theme-prefs.test.ts`, `src/components/mos-builder.ts`, `src/lib/url.ts`, `observablehq.config.ts` (+ directory listings confirming `scale-table.ts`, `play-scale.ts`, `synth.ts`, `scale.ts`, `scala.ts`, `dashboard-seed.test.ts`, `url-hash-integration.test.ts`).
**Pattern extraction date:** 2026-06-08
</content>
