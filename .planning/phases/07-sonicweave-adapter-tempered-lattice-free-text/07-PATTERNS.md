# Phase 7: SonicWeave Adapter — Tempered, Lattice & Free-Text - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 13 (2 kernel modules + 4 components + 4 CSS + 6 test files + 2 edits — counting helpers)
**Analogs found:** 13 / 13 (every new file has a strong in-repo analog; zero "no analog")

This phase is "let the prelude do the math, own the boundary." Every new component is a copy of an existing Phase-6 Pattern-2 factory with the body swapped to compose a SonicWeave source string; the one new kernel module copies the `jiSubsetOfEdo` round-trip discipline verbatim. There is no greenfield UI invention.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/sonicweave.ts` | kernel / adapter | transform (DSL → Scale) | `src/lib/scale.ts` (`jiSubsetOfEdo`) + `src/lib/generators.ts` (`edScale`) | exact (round-trip + tempered-via-cents) |
| `src/lib/fokker.ts` (or fold into sonicweave.ts) | kernel / lattice helper | transform (commas → \|det\|) | `src/lib/cps.ts` (BigInt-exact pure math + caps) | role-match |
| `src/lib/__tests__/sonicweave.test.ts` | test | request-response | `src/lib/__tests__/cps.test.ts` | exact |
| `src/lib/__tests__/fokker.test.ts` | test | request-response | `src/lib/__tests__/cps.test.ts` | exact |
| `src/components/generate-rank2.ts` | component | request-response (form→table) | `src/components/generate-cps.ts` (preset select) + `mos-builder.ts` (makeRatioField) + `generate-ed.ts` (tempered + sub-region swap) | exact (composite) |
| `src/components/generate-welltemp.ts` | component | request-response | `src/components/generate-cps.ts` (preset select) + `generate-ed.ts` (tempered table + custom-mode params swap) | exact (composite) |
| `src/components/generate-fokker.ts` | component | request-response | `src/components/generate-cps.ts` (chip input) + `generate-ed.ts` (mode toggle + live readout) | exact (composite) |
| `src/components/generate-sonicweave.ts` | component | request-response (free-text) | `src/components/generate-cps.ts` (status/preserve idiom) + `further-reading.ts` (docs link) | role-match |
| `src/components/{rank2,welltemp,fokker,sonicweave}.css` | config / style | — | `src/components/generate-cps.css` | exact |
| `src/components/__tests__/generate-rank2.test.ts` (+ welltemp/fokker/sonicweave) | test | request-response | `src/components/__tests__/mos-builder.test.ts` + `generate-ed.test.ts` (tempered/badge) | exact |
| `src/pages/generate.md` (EDIT) | page / route registration | event-driven (picker swap) | itself — the existing `ed`/`cps` registration blocks | exact (additive) |
| `src/lib/INVENTORY.md` (EDIT) | docs | — | itself — existing kernel-symbol rows | exact (additive) |

## Pattern Assignments

### `src/lib/sonicweave.ts` (kernel, transform — the single adapter)

The canonical implementation is already written in RESEARCH.md Pattern 1 (runtime-verified). Two in-repo analogs supply the boundary discipline it must copy.

**Analog A — the R-01 foreign-Fraction round-trip:** `src/lib/scale.ts` `jiSubsetOfEdo` (lines 140-188).

**Round-trip pattern** (`scale.ts:181-184`) — copy this exactly for the rational branch:
```typescript
// R-01 round-trip: xen-dev-utils' Fraction is Number-backed; we re-parse
// through a string so the BigInt-backed Fraction in Interval is the source
// of truth.
intervals.push(new Interval(`${String(first.n)}/${String(first.d)}`));
```
For SonicWeave the equivalent is `new Interval(`${String(f.n)}/${String(f.d)}`)` where `f = iv.toFraction()`. **Never** hand SonicWeave's `Interval`/`Fraction` across — only the `${n}/${d}` string (Pitfall 4).

**Analog B — the tempered cents-of-record path:** `src/lib/generators.ts` `edScale` (the established tempered kernel).

**Imports pattern** (`generators.ts:40-46`) — note `centsToRatio` is imported from `./cents.js`, NOT `./monzo.ts` (the blueprint mislabeled this; verified at `src/lib/cents.ts:23`):
```typescript
import { Interval } from "./interval.js";
import { Scale } from "./scale.js";
import { centsToRatio } from "./cents.js";   // ← cents.ts, not monzo.ts
```

**Tempered-pitch construction** (`generators.ts:247`) — the cents-of-record idiom the tempered branch copies:
```typescript
intervals.push(new Interval(centsToRatio(stepCents)));
```

**Discriminator (the load-bearing correction to blueprint A4):** use `iv.value.isFractional()`, verified present at `node_modules/sonic-weave/dist/monzo.d.ts:306` (`TimeReal`) and `:528` (`TimeMonzo`). Do NOT use `iv.value instanceof TimeReal` (mis-classifies tempered `TimeMonzo` cents intervals as exact JI). Keep `try { iv.toFraction() } catch` only as defense-in-depth.

**Input cap** (reuse, don't redefine): import `MAX_SCALE_TEXT_BYTES` from `src/lib/url.ts:43` (= 8192) and gate with `new TextEncoder().encode(src).length`. The encoder cap idiom is `url.ts:47-52`.

**Error shape (D-18):** structured return `{ scale: Scale | null; tempered: boolean; error?: string }` — mirrors the component-friendly contract; wrap `evaluateSource` in try/catch and return `error` rather than throwing (so the free-text widget surfaces it without crashing). Guard `out.length === 0` before `new Scale([])` (Pitfall 5 — `Scale` throws on empty, `scale.ts:31-33`).

---

### `src/lib/fokker.ts` (kernel, transform — \|det\| cardinality helper)

**Analog:** `src/lib/cps.ts` — same "pure BigInt-exact math + defense-in-depth caps, no DOM" shape. The implementation body is in RESEARCH.md Pattern 4 (`fokkerCardinality`, verified `["81/80","128/125"] → 12`).

**Imports** — `toMonzo` + `integerDet` from `xen-dev-utils` (confirmed at `node_modules/xen-dev-utils/dist/monzo.d.ts:130` and `dist/hnf.d.ts:29`; `integerDet<T extends number | bigint>` accepts `bigint[][]`). `kernel`/`hnf` (`hnf.d.ts:18,47`) are available if comma→basis enumeration (A3) is chosen.

**Defense-in-depth caps FIRST pattern** (`cps.ts:65-75`) — copy the validate-before-compute structure verbatim, adapted to comma count / cardinality:
```typescript
// Defense-in-depth caps FIRST (T-06-01) — before any enumeration.
if (factors.length < 1 || factors.length > MAX_FACTORS) {
  throw new RangeError(
    `cps: factors.length must be in [1, ${String(MAX_FACTORS)}] (got ${String(factors.length)})`,
  );
}
```
Apply the same shape to: comma-count must form a square matrix (Pitfall 6 — guard non-square before `integerDet`), and cap the resulting cardinality (mirror Phase-6 D-14).

**BigInt conversion note:** `toMonzo` returns Number monzos; map `.map(BigInt)` after right-padding to a square matrix (RESEARCH.md Pattern 4 shows the exact slice/pad/BigInt sequence). `Math.abs(Number(integerDet(square)))` is the cardinality.

---

### `src/lib/__tests__/sonicweave.test.ts` and `fokker.test.ts` (tests)

**Analog:** `src/lib/__tests__/cps.test.ts`.

**`n/d` stringify helper** (`cps.test.ts:20-22`) — copy this; `Fraction.toFraction()` drops `/1` for whole numbers so the canonical-vector string compare needs the raw `n/d`:
```typescript
function ndStrings(scale): string[] {
  return scale.intervals.map((iv) => `${String(iv.fraction.n)}/${String(iv.fraction.d)}`);
}
```

**Exact-vector + BigInt-equality assertion pattern** (`cps.test.ts:28-39`) — copy for the `rank2(3/2,5,1) ≡ buildMos` and `cps([1,3,5,7],2) ≡ Hexany` cross-checks. The load-bearing assertion is `iv.equals(new Interval(s))` (BigInt-level), NOT string compare alone:
```typescript
const expected = ["1/1", "7/6", "5/4", "35/24", "5/3", "7/4", "2/1"];
expect(scale.intervals.length).toBe(expected.length);
expect(ndStrings(scale)).toEqual(expected);
expected.forEach((s, i) => {
  const iv = scale.intervals[i];
  expect(iv ? iv.equals(new Interval(s)) : false).toBe(true);
});
```

**RangeError / cap assertions** (`cps.test.ts:69-81`) — copy for the 8 KB cap test and Fokker non-square/cardinality-cap tests:
```typescript
it("throws RangeError when factors.length exceeds the cap (13 > 12)", () => {
  expect(() => cps(tooMany, 2)).toThrow(RangeError);
});
```
For the adapter's structured-error shape, assert `result.error` is a non-empty string and `result.scale === null` instead of `toThrow` (the adapter returns, not throws). For tempered detection: assert `result.tempered === true` and that the cents (not ratios) match the verified quarter-comma vector (RESEARCH.md "Verified cross-check vectors").

Test vectors to encode (RESEARCH.md): `rank2(3/2,5,1)` → `9/8,81/64,4/3,3/2,27/16,243/128,2/1`; `cps([1,3,5,7],2)` ≡ Hexany; quarter-comma fifth 696.578¢ (tempered flag); `fokkerCardinality(["81/80","128/125"]) === 12`; `parallelotope([3,5],[3,1],[0,1])` → 12 exact-rational notes.

---

### `src/components/generate-rank2.ts` (component, request-response) — GEN-06

**Primary analog:** `src/components/generate-ed.ts` (tempered family + params-swap), with the preset select from `generate-cps.ts` and `makeRatioField` from `mos-builder.ts`.

**Factory signature + element interface** (`generate-ed.ts:59-64, 82-85`) — copy verbatim, this is the default landing = quarter-comma (tempered), so it needs both `getScale()` and `isTempered()`:
```typescript
export interface GenerateRank2Element extends HTMLElement {
  getScale(): Scale | null;
  isTempered(): boolean;
}
export function generateRank2(synth: SynthHandle, opts: GenerateRank2Opts = {}): GenerateRank2Element {
```
Note: rank-2 is *conditionally* tempered (pure-ratio rank-2 is exact JI; POTE/TE/CTE/quarter-comma are tempered). So `isTempered()` returns a closure-local boolean set from the adapter's `result.tempered`, NOT a hard `true` like `generate-ed.ts:362`. Pass `{ tempered: result.tempered }` into `scaleTable` (the table already supports the flag, `scale-table.ts:39`).

**Preset `<select>` pattern** (`generate-cps.ts:53-58, 107-122, 264-276`) — copy the `PRESETS` record + select-builder + change-handler. The rank-2 preset record carries `{ generator, up, down, period, comma? }` per preset; selecting one fills the generator/period/up/down fields and (when a named preset) enables the tuning select (D-03). "Custom" / manual generator entry shows "custom" and disables the tuning select.

**Tuning select** — a second `<select>` {pure | quarter-comma | POTE | TE | CTE} (D-03, RESEARCH OQ-3). Reuse the `generate-ed.ts` `makeKindField` select-builder shape (`generate-ed.ts:253-279`).

**`makeRatioField` (ratio-or-cents generator/period)** — copy from `mos-builder.ts:93-146` (the canonical version; `generate-ed.ts:201-250` is the same idiom). Each input gets a unique `name` so happy-dom selectors resolve.

**Source-string composition (the new logic)** — build the SonicWeave text from params, then call `scaleFromSonicWeave`:
- pure: `rank2(${gen}, ${up}, ${down})`
- quarter-comma default: `rank2(696.578428466209, 5, 1)` (literal cents generator, RESEARCH Pattern 2)
- POTE/TE/CTE: two-line temper pattern `rank2(3/2, 5, 1)\n${TUNING}([${commas}])` (RESEARCH Pattern 2)

**rebuild() error idiom + caps** (`generate-ed.ts:332-350`) — copy the try/catch that writes `result.error` to the status region and PRESERVES the prior table render (do NOT clear `tableHost`). Validate up/down bounds (defense-in-depth, D-18) before composing.

**Default landing = quarter-comma meantone** (D-02): set initial preset/state so first `rebuild()` renders the tempered quarter-comma scale with badge.

---

### `src/components/generate-welltemp.ts` (component, request-response) — GEN-07

**Primary analog:** `src/components/generate-ed.ts` + the preset select from `generate-cps.ts`. This widget is ALWAYS tempered → copy `generate-ed.ts` `isTempered() => true` (`generate-ed.ts:362`) and `scaleTable(scale, baseHz, { tempered: true })` (`generate-ed.ts:338`) verbatim.

**Preset select** (`generate-cps.ts:107-122, 264-276`) — D-08 roster (Werckmeister III, Kirnberger III, Vallotti, Young II, Neidhardt, Kellner, Lehman "Bach", Young I) + "Custom". Each preset's `commaFractions` vector is a closure-local constant; selecting fills the custom fraction fields.

**Custom-mode params swap** (`generate-ed.ts:286-317`) — the `renderParams()` + `paramsRegion.replaceChildren(...)` idiom. Custom mode exposes the raw per-fifth fraction fields (`makeRatioField` from `mos-builder.ts:93-146`, used for negative fractions like `-1/6`); preset mode hides them.

**Source-string composition (the new logic):** `wellTemperament([${commaFractions}], 531441/524288)` — **pass the Pythagorean comma 531441/524288 explicitly** (D-07, Pitfall 2 — the prelude default 81/80 is syntonic and silently wrong). Then `scaleFromSonicWeave(src)`.

**Default landing = Vallotti** (D-06): `[-1/6,-1/6,-1/6,-1/6,-1/6,-1/6,0,0,0,0,0]` per RESEARCH Pattern 3. Each preset needs a citable test vector (pure-fifth count + 2-3 degree cents — RESEARCH A1/Pitfall 3), asserted in `sonicweave.test.ts`.

---

### `src/components/generate-fokker.ts` (component, request-response) — GEN-08

**Primary analog:** `src/components/generate-ed.ts` (the mode/sub-method swap) + the chip input from `generate-cps.ts`. This widget is exact-rational (NOT tempered) → use `scaleTable(scale, baseHz, { precision })` WITHOUT the tempered flag (the `generate-cps.ts:237` exact-JI path), and `getScale()` only (no `isTempered`, or `isTempered() => false`).

**Mode toggle (basis ↔ comma, D-09/D-10)** — copy the `subSelect` + `renderParams()` + `paramsRegion.replaceChildren()` idiom from `generate-ed.ts:113-139, 286-317, 353-357`. Basis mode is the default (D-10). Mode toggle preserves per-mode state (the `divisionsBy` per-sub-method-slot precedent, `generate-ed.ts:95`).

**Basis chip input (basis mode)** (`generate-cps.ts:145-175, 199-231, 251-262`) — copy the chip-form + `renderChips()` + `parsePositiveInt` (`generate-cps.ts:65-74`) + Add-button idiom for the basis-interval chips. Per-axis up/down extents are integer fields (`generate-ed.ts:165-194` `makeIntField`).

**Comma chip input (comma mode, D-19)** — same chip idiom but chips are ratio strings (e.g. `81/80`); validate as `n/d` before becoming a chip. D-19 (chip vs ratio fields, state preservation) is Claude's discretion — the chip idiom is the recommended reuse.

**Live "→ N notes" readout (D-12)** — a status-region-style element that updates on every input change: comma mode calls `fokkerCardinality(commaStrings)` (the new kernel helper) for `|det|`; basis mode multiplies the extents. This is a deliberate pedagogical surface (CONTEXT specifics) — render it next to the inputs, `createElement` + `textContent`, updated inside `rebuild()` BEFORE the preview.

**Source-string composition:** basis mode → `parallelotope([${basis}], [${ups}], [${downs}])` (RESEARCH Pattern 4, verified `parallelotope([3,5],[3,1],[0,1])` → 12). Comma mode (A3): prefer comma→basis via `xen-dev-utils` `kernel`/`hnf` then `parallelotope`, or drive the basis-mode enumerator; verify the 81/80+128/125 block renders 12 exact notes.

**Default landing = classic 5-limit 12-tone block** (D-11): `parallelotope([3,5],[3,1],[0,1])`.

---

### `src/components/generate-sonicweave.ts` (component, request-response — free-text) — GEN-09

**Primary analog:** `src/components/generate-cps.ts` (the status + preserve-prior-render idiom) + `src/components/further-reading.ts` (the external docs link).

**Factory + element interface** — `getScale()` + `isTempered()` (conditionally tempered, like rank-2 — `cps([1,3,5,7],2)` is exact JI but a user's tempered program is not; set from `result.tempered`).

**Textarea (not per-keystroke)** — a `<textarea>` + an "Evaluate" button. Evaluate on button click ONLY (D-16, Anti-Pattern). The 8 KB cap is enforced in the adapter (`MAX_SCALE_TEXT_BYTES`); the textarea may also set `maxLength` as a first clamp.

**Error surface (D-15) + preserve prior preview** (`generate-cps.ts:233-248`) — copy the rebuild try/catch idiom, but here read `result.error` from the structured return and write it to the status region via `textContent` (raw compiler error verbatim, D-15, XSS-safe). PRESERVE the prior table (do NOT clear `tableHost`):
```typescript
// surface the message, never innerHTML; PRESERVE the prior render
const msg = err instanceof Error ? err.message : String(err);
status.textContent = msg;
```

**Docs link (D-14)** — use the `furtherReading` helper (`further-reading.ts:25-61`) or its idiom: an `<a>` with `rel="noopener noreferrer"` for external URLs (`further-reading.ts:39-41`). Point at the SonicWeave `dsl.md` / `advanced-dsl.md` docs (D-20, RESEARCH Sources secondary).

**Default landing = pre-filled `cps([1,3,5,7], 2)`** (D-13): set the textarea value and run one `rebuild()` so the Hexany previews on first paint.

---

### `src/components/{rank2,welltemp,fokker,sonicweave}.css` (style)

**Analog:** `src/components/generate-cps.css` — copy verbatim, rename the BEM root class. Same house style: flex form row, `var(--theme-*)` / `var(--sans-serif)` / `var(--monospace)` tokens ONLY (D-15, do not invent tokens), chip styles (`generate-cps.css:63-145`), status region (`:147-152`), table/play host slots (`:154-161`). The free-text widget additionally needs a `textarea` rule (mirror the `input[type="number"]` rule at `generate-cps.css:53-55`/`118-126` with `width: 100%` and a monospace font).

**Wire-up (REQUIRED):** add four `@import "./components/generate-{rank2,welltemp,fokker,sonicweave}.css";` lines to `src/styles.css` next to the existing block (`src/styles.css:36-39`).

---

### `src/components/__tests__/generate-{rank2,welltemp,fokker,sonicweave}.test.ts` (tests)

**Analog:** `src/components/__tests__/mos-builder.test.ts` (factory smoke + input wiring) + `generate-ed.test.ts` (tempered/badge assertions).

**happy-dom env + stub synth** (`mos-builder.test.ts:1-4`) — copy the header + `makeStubSynth` import (`__tests__/test-utils.ts`):
```typescript
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { makeStubSynth } from "./test-utils.js";
```

**Factory smoke + default-value assertions** (`mos-builder.test.ts:7-37`) — copy: returns `HTMLElement`, root class present, default inputs carry the D-02/D-06/D-11/D-13 seed values, default render shows the expected row count.

**Tempered badge / no-Ratio-column assertion** (`generate-ed.test.ts:46-52`) — copy for rank-2 (quarter-comma default) and well-temp (Vallotti):
```typescript
const badge = el.querySelector(".scale-table__badge") as HTMLElement;
expect(badge.textContent).toBe("tempered");
const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent);
expect(headers).not.toContain("Ratio");
```

**Event dispatch + status-region preservation** (`mos-builder.test.ts:53-104`) — copy the `input`/`change` dispatch + `[role="status"]` text assertion + "prior render preserved" pattern. For the free-text widget: dispatch a malformed program, assert the status text is non-empty AND the prior `tbody tr` rows survive (D-15). For Fokker: assert the live "→ N notes" readout updates on input.

**Play-button assertion** (`mos-builder.test.ts:106-118`) — copy the `.play-btn--scale` click → `playArpeggio` called once with `freqs.length === intervals.length`.

## Shared Patterns

### Adapter R-01 boundary (foreign Fraction → kernel Interval)
**Source:** `src/lib/scale.ts:181-184` (`jiSubsetOfEdo`)
**Apply to:** `sonicweave.ts` rational branch; `fokker.ts` (when reading comma fractions).
```typescript
intervals.push(new Interval(`${String(first.n)}/${String(first.d)}`));
```
Never pass a foreign `Fraction`/`Interval` object across — only the `${n}/${d}` string. R-01 ESLint guards `xen-dev-utils` `Fraction` imports; the SonicWeave discipline is the string round-trip (Pitfall 4).

### Tempered cents-of-record
**Source:** `src/lib/generators.ts:247` (`edScale`) + `src/components/scale-table.ts:39-65` (tempered table variant) + `src/components/generate-ed.ts:362` (`isTempered`)
**Apply to:** `sonicweave.ts` tempered branch; rank-2 / well-temp / free-text components (conditionally for rank-2 & free-text; always for well-temp).
- Kernel: `new Interval(centsToRatio(iv.totalCents()))`; cents is the source of truth, `centsToRatio` from `./cents.js` is the ONLY projection.
- Component: `scaleTable(scale, baseHz, { tempered: result.tempered })`; expose `isTempered()` so `generate.md` serializes Send-to as cents-per-line (D-03, `generate.md:273-280`).

### Pattern-2 component factory shell
**Source:** `src/components/mos-builder.ts` / `generate-cps.ts` / `generate-ed.ts`
**Apply to:** all four new components.
- `(synth: SynthHandle, opts = {}) => HTMLElement`; closure-local state, no module-level state.
- `createElement` + `textContent` ONLY for all dynamic content (XSS discipline; never `innerHTML` with interpolated values — `scale-table.ts:80-86`).
- Status region: `role="status" aria-live="polite"` (`mos-builder.ts:204-208`).
- `rebuild()` swaps the table + Play via `replaceChildren`; on error write the message to the status region and PRESERVE the prior render (`generate-cps.ts:233-248`).
- Expose `getScale()` (and `isTempered()` where tempered) for Send-to (`generate-ed.ts:359-362`).

### Preset `<select>`
**Source:** `src/components/generate-cps.ts:53-58, 107-122, 264-276`
**Apply to:** rank-2 (D-01), well-temp (D-05).
A `PRESETS` record + a `<select>` built via `createElement("option")` + a `change` handler that fills the fields from the seed and falls back to "custom" on any manual field edit (`generate-cps.ts:218-226` — a user edit forces `preset = "custom"`).

### Ratio field (n/d two-input)
**Source:** `src/components/mos-builder.ts:93-146` (`makeRatioField`)
**Apply to:** rank-2 generator/period, well-temp custom fractions, Fokker comma ratio fields.
Two `<input type="number">` sandwiching a `/` glyph, each with a unique `name`. (Re-stated identically in `generate-ed.ts:201-250`.)

### Chip input
**Source:** `src/components/generate-cps.ts:145-175, 199-231` + `parsePositiveInt` (`:65-74`)
**Apply to:** Fokker basis chips + comma chips.
Integer/ratio input + "Add" button pushing a validated chip; each chip has a `×` remove control; values validated BEFORE becoming a chip; chip text via `textContent`.

### Defense-in-depth caps (validate before enumerate)
**Source:** `src/lib/cps.ts:65-75` + `MAX_SCALE_TEXT_BYTES` from `src/lib/url.ts:43`
**Apply to:** `fokker.ts` (comma count / cardinality), adapter (8 KB byte cap), Fokker/rank-2 components (extents, up/down bounds). RangeError or structured error BEFORE any enumeration (Phase-6 D-14).

### Page registration (additive picker optgroups)
**Source:** `src/pages/generate.md` — the existing `METHOD_FAMILIES` (lines 66-86), per-widget instantiation cells (`:190, 206, 215, 225`), params-host swap (`:312-352`), preview-host swap (`:363-420`), and Send-to dispatch (`:281-291, 471-492`).
**Apply to:** register rank-2 + well-temp under the existing "Regular / equal temperament" optgroup; Fokker under a new/existing "Advanced / algorithmic" optgroup; free-text under a NEW fifth "SonicWeave" optgroup. Each widget: instantiate ONCE (closure-state survives swaps), add a `method === "<id>"` branch to both swap blocks, and add a `<id>ScaleText()` branch to `currentScaleText` + `sendCurrentScaleTo` (tempered → cents-per-line via `isTempered()`).

### INVENTORY rows
**Source:** `src/lib/INVENTORY.md` (existing format — Symbol | Source | Notes; `jiSubsetOfEdo` row at line 35, `centsToRatio` row at line 27)
**Apply to:** add rows for `scaleFromSonicWeave` (Source: Custom — wraps `sonic-weave@0.14.1`) and `fokkerCardinality` (Source: Custom — wraps `xen-dev-utils.integerDet`), with Source + Reason per the existing row style.

## No Analog Found

None. Every new file has a strong in-repo analog. The only genuinely new logic is (1) the adapter's `isFractional()` discriminator + R-01 round-trip and (2) the `integerDet` cardinality helper — both have verified reference implementations in RESEARCH.md Patterns 1 and 4, and both copy their structural discipline from `jiSubsetOfEdo` / `cps` respectively.

## Metadata

**Analog search scope:** `src/lib/`, `src/lib/__tests__/`, `src/components/`, `src/components/__tests__/`, `src/pages/`, `src/styles.css`, `node_modules/sonic-weave/dist/`, `node_modules/xen-dev-utils/dist/`
**Files scanned:** ~24 (12 source analogs read in full + API surface verification)
**API verification this session:** `evaluateSource` + `Interval` export present in `sonic-weave`; `isFractional()` at `monzo.d.ts:306,:528`; `integerDet`/`hnf`/`kernel` at `hnf.d.ts:29,18,47`; `toMonzo` at `monzo.d.ts:130`; `centsToRatio` confirmed in `src/lib/cents.ts:23` (NOT monzo.ts).
**Pattern extraction date:** 2026-06-11
