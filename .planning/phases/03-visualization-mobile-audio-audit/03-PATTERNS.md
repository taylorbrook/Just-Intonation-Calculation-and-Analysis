# Phase 3: Visualization + Mobile Audio Audit — Pattern Map

**Mapped:** 2026-05-05
**Files analyzed:** 14 (4 NEW lib/component, 1 MODIFIED audio, 1 MODIFIED component, 1 MODIFIED page, 1 MODIFIED stylesheet, 4 NEW tests, 1 NEW notes file, 1 MODIFIED inventory)
**Analogs found:** 13 / 14 (mobile-audit.md is documentation; no analog needed)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/kbm.ts` | NEW lib module (pure data: parser + serializer + pure derivation) | file-I/O + transform | `src/lib/scala.ts` | exact (parser+serializer+pure helper trio) |
| `src/lib/__tests__/kbm.test.ts` | NEW vitest fixture-driven test | golden-fixture round-trip | `src/lib/__tests__/scala.test.ts` | exact |
| `src/components/lattice.ts` | NEW component factory (D3 SVG + ji-lattice + synth) | request-response (click → audition); pan/zoom | `src/components/audio-panel.ts` (synth-driven factory) + `src/components/scale-table.ts` (data-driven factory shape) | role-match (no D3-SVG analog yet; component-factory contract is exact) |
| `src/components/lattice.css` | NEW colocated stylesheet | static | `src/components/audio-panel.css` | exact |
| `src/components/tonality-diamond.ts` | NEW component factory (D3 SVG, hand-laid grid + synth) | request-response (click → audition); pan/zoom | `src/components/audio-panel.ts` + `src/components/scale-table.ts` (per-cell rendering pattern) | role-match (component contract exact; SVG layout is hand-laid) |
| `src/components/tonality-diamond.css` | NEW colocated stylesheet | static | `src/components/audio-panel.css` | exact |
| `src/components/keyboard.ts` | NEW component factory (SVG strip + synth + baseHz; pointerdown/up sustain) | request-response (click → audition) | `src/components/audio-panel.ts` (synth + baseHz signature) + `src/components/play-interval.ts` (single-click audition) | exact (signature mirrors audio-panel; click semantics mirror play-interval) |
| `src/components/keyboard.css` | NEW colocated stylesheet | static | `src/components/audio-panel.css` | exact |
| `src/components/scl-io.ts` | MODIFIED in place (extend to handle .kbm) | file-I/O (FileReader + Blob download) | self (Phase 2 implementation; extend) | exact (self) |
| `src/audio/synth.ts` | MODIFIED in place (mobile-Safari fixes) | event-driven (resume on visibility/gesture) | self (Phase 2 implementation; extend `ensure()` and add visibility handling) | exact (self) |
| `src/index.md` | MODIFIED (append viz cells, Stop button cell, kbm toggle cell, effectiveBaseHz cell) | reactive (Observable cells) | self (Phase 2 dashboard) | exact (self) |
| `src/styles.css` | MODIFIED (add @imports for new component CSS; floating Stop button rules; viewport rules) | static | self | exact (self) |
| `src/components/__tests__/lattice.test.ts` (+ diamond, keyboard) | NEW vitest DOM-only smoke tests | factory-shape verification | `src/audio/__tests__/synth.test.ts` (mocking pattern) + `src/lib/__tests__/scala.test.ts` (vitest+describe+it pattern) | role-match (no existing component test in repo; mocking pattern exact) |
| `.planning/phases/03-.../mobile-audit.md` | NEW documentation file | static | (no analog — pure prose; no code pattern needed) | n/a |

---

## Pattern Assignments

### `src/lib/kbm.ts` (lib module — parser + serializer + pure derivation)

**Analog:** `src/lib/scala.ts` (the canonical "parse / write / pure helper for clipboard/derivation" trio).

**File-header docblock pattern** (from `scala.ts` lines 1-34) — the new file should open with the same structure: spec citation, parser semantics list, R-01 reminder, trust-boundary caps, defense-in-depth note for downstream consumers.

**Imports pattern** (`scala.ts` lines 36-39):
```typescript
import { Interval } from "./interval.js";
import { Scale } from "./scale.js";
// R-01 NOTE: only the helper, NEVER xen-dev-utils' Fraction.
import { centsToValue } from "xen-dev-utils";
```

For `kbm.ts`, the corresponding imports are:
```typescript
import { Interval } from "./interval.js";
import type { Scale } from "./scale.js";
// R-01: BigInt-backed Fraction for ref-Hz arithmetic. NEVER from xen-dev-utils.
import { Fraction } from "fraction.js";
```

**Trust-boundary caps pattern** (`scala.ts` lines 41-60) — copy verbatim, including the cheap-bound + TextEncoder fallback in `utf8ByteLength`. The 1MB cap is a project invariant (T-02-10):
```typescript
const MAX_INPUT_BYTES = 1_000_000;

function utf8ByteLength(s: string): number {
  if (s.length * 3 <= MAX_INPUT_BYTES) return s.length * 3;
  return new TextEncoder().encode(s).byteLength;
}
```

**Public-export shape** (`scala.ts` lines 68-125 — `parseScala`, `parseScl`, `ParsedScl` interface):
- `parseKbm(text: string): KbmMapping` — full-file parser
- `writeKbm(kbm: KbmMapping): string` — serializer
- `kbmToFrequencies(scale: Scale, kbm: KbmMapping): Map<number, number>` — pure derivation, sibling of `scalaToCsv`

**KbmMapping interface** (per CONTEXT D-10, RESEARCH lines 665-720):
```typescript
export interface KbmMapping {
  size: number;            // mapping pattern length (line 1)
  firstKey: number;        // line 2
  lastKey: number;         // line 3
  middleNote: number;      // line 4 — MIDI note where 1/1 of scale sounds
  referenceKey: number;    // line 5 — MIDI note for the reference frequency
  referenceHz: number;     // line 6 — reference frequency in Hz
  formalOctave: number;    // line 7 — scale degree marking the period
  keyMap?: ReadonlyArray<number | null>;  // optional per-degree map; null = muted ('x')
}
```

**Parser-error pattern** (`scala.ts` lines 102-121) — preserve "header line N is missing/invalid" diagnostics and pitch-count-style sanity checks. The 7 numeric fields appear in canonical order; each error message names which field failed and what was found:
```typescript
if (!Number.isFinite(expectedCount) || expectedCount < 0 || !/^\d+$/.test(countLine)) {
  throw new Error(`parseScl: invalid pitch count "${countLine}"`);
}
```
becomes for kbm:
```typescript
if (!Number.isFinite(size) || size < 0) {
  throw new Error(`parseKbm: invalid size "${sizeLine}" (line 1)`);
}
```

**Comment-line + whitespace handling** (`scala.ts` lines 96-100, 208-214) — kbm uses the same `!`-comment convention; reuse `normalizeLines` (BOM strip + CRLF→LF) verbatim. The CONTEXT note (lines 184-185) encourages either inlining a small private copy or re-exporting from a tiny shared utility — the shorter helpers (`normalizeLines`, `utf8ByteLength`) are small enough to duplicate inline; flag in the plan if duplication grows beyond ~30 lines.

**Serializer pattern** (`scala.ts` lines 138-155) — `writeKbm` writes 7 lines plus optional mapping lines, each prefixed by `! comment` markers per spec:
```typescript
export function writeScl(scale: Scale, description?: string): string {
  // ...
  const lines: string[] = [];
  lines.push(`! Generated by Tuning Systems`);
  lines.push(`!`);
  lines.push(sanitizeDescription(description));
  // ...
  return lines.join("\n") + "\n";
}
```

**Pure derivation helper** (`scala.ts` lines 190-202 — `scalaToCsv`):
```typescript
export function scalaToCsv(scale: Scale, baseHz: number): string {
  const rows: string[][] = [["Degree", "Ratio", "Cents", "¢ from 12-TET", "Hz"]];
  scale.intervals.forEach((iv, i) => {
    rows.push([
      String(i + 1),
      formatRatio(iv),
      iv.cents.toFixed(2),
      iv.centsFrom12tet.toFixed(2),
      (baseHz * Number(iv.fraction.valueOf())).toFixed(3),
    ]);
  });
  return rows.map((r) => r.join("\t")).join("\n");
}
```

`kbmToFrequencies` mirrors this shape — pure, testable without DOM, returns plain JS data structure (`Map<number, number>`). Per D-24 the formula is `effectiveBaseHz = kbm.referenceHz × 2^((kbm.middleNote − kbm.referenceKey) / 12)`, then map each scale interval to a MIDI note offset from `middleNote`.

**Audio-boundary pattern for ratio×Hz** (`scale.ts` lines 119-128):
```typescript
degreeToFreq(degree: number, baseHz: number): number {
  const iv = this.intervals[degree];
  if (!iv) {
    throw new RangeError(/* ... */);
  }
  return baseHz * Number(iv.fraction.valueOf());
}
```
Use the same `Number(iv.fraction.valueOf())` boundary in `kbmToFrequencies`. R-01: Fraction stays BigInt up to the multiplication; only the audio-tier produces Number.

---

### `src/lib/__tests__/kbm.test.ts` (vitest fixture-driven round-trip)

**Analog:** `src/lib/__tests__/scala.test.ts` (lines 1-23 imports + fixture loader pattern; lines 29-104 `parseScala` describe block; rest is `parseScl` round-trip on 16 F-fixtures + 5 goldens).

**Imports + fixture loader** (`scala.test.ts` lines 7-23):
```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseScala, parseScl, writeScl, scalaToCsv } from "../scala.js";
import { Scale } from "../scale.js";
import { Interval } from "../interval.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const goldenDir = join(fixturesDir, "golden");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}
function readGolden(name: string): string {
  return readFileSync(join(goldenDir, name), "utf8");
}
```

For kbm tests, swap to `parseKbm, writeKbm, kbmToFrequencies` and use a new `fixtures/kbm/` (or sibling) directory. Per CONTEXT lines 202-216, golden corpus must include:
- `middle == reference` (default case, e.g. ref=69, middle=69, refHz=440)
- `middle ≠ reference` (e.g. ref=69, middle=60, refHz=440 → 1/1 ≈ 261.626 Hz)
- `formalOctave ≠ size` (7-key scale-degree mapping, formal-octave=7 ≠ 12)
- ≥ 1 muted-key entry (`x`) for the keyMap

**Per-test assertion shape** (`scala.test.ts` lines 30-37):
```typescript
it("auto-prepends 1/1 (D-13) and parses ratios", () => {
  const out = parseScala("9/8\n5/4\n2/1");
  expect(out).toHaveLength(4);
  expect(out[0]!.equals(new Interval("1/1"))).toBe(true);
  expect(out[1]!.equals(new Interval("9/8"))).toBe(true);
});
```

For `kbmToFrequencies` golden, follow the explicit-numerical-ground-truth convention (CONTEXT line 216): assert `freqs.get(60)` is within `1e-3` of `261.6256`.

---

### `src/components/lattice.ts` (component factory, D3 SVG + ji-lattice + synth)

**Analog:** `src/components/audio-panel.ts` (synth-driven factory shape) + `src/components/scale-table.ts` (data-rendering pattern with per-element textContent).

**Imports pattern** (`audio-panel.ts` lines 27-30):
```typescript
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";
// CSS shipped via per-page `style:` frontmatter (src/styles.css). See
// play-interval.ts for the Plan-06-deferred rationale.
```

For `lattice.ts`, add `d3` and `ji-lattice`:
```typescript
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";
import * as d3 from "d3";
import { spanLattice, kraigGrady9, type Vertex, type Edge } from "ji-lattice";
import { PRIMES } from "../lib/monzo.js";  // R-01 — re-exported, NOT raw xen-dev-utils
```

**Factory signature** (`audio-panel.ts` lines 32-42):
```typescript
export interface AudioPanelOpts {
  defaultDegree?: number;
}
export function audioPanel(
  scale: Scale,
  synth: SynthHandle,
  baseHz: number,
  opts: AudioPanelOpts = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "audio-panel";
  // ...
  return root;
}
```

For `lattice.ts` (per CONTEXT D-08):
```typescript
export interface LatticeOpts {
  basis?: number[];
  showContext?: 'none' | 'neighbors' | 'full';  // default 'neighbors' (D-05)
  audition?: 'note' | 'dyad';                    // default 'dyad' (D-07)
  width?: number;                                // default 600
  height?: number;                               // default 400
}
export function lattice(scale: Scale, synth: SynthHandle, opts: LatticeOpts = {}): HTMLElement {
  const root = document.createElement("section");
  root.className = "lattice-widget";
  // ... heading + helper + svg (see below)
  return root;
}
```

**Heading + helper-text rendering** (lifted shape — combine `audio-panel.ts` heading lines 46-48 with the dashboard-helper class from `styles.css` lines 31-35):
```typescript
const heading = document.createElement("h2");
heading.textContent = "Lattice"; // UI-SPEC copywriting (exact).
root.appendChild(heading);

const helper = document.createElement("p");
helper.className = "dashboard-helper"; // existing class — reuse from styles.css.
helper.textContent = "Click a node to audition. Scroll or pinch to zoom; drag to pan.";
root.appendChild(helper);
```

**Click-audition pattern** (`audio-panel.ts` lines 80-88):
```typescript
playBtn.addEventListener("click", () => {
  const degree = Number(select.value);
  const iv = scale.intervals[degree];
  if (!iv) return;
  synth.playNotes(
    [baseHz, baseHz * Number(iv.fraction.valueOf())],
    1.5, // D-18.
  );
});
```

For lattice node click (default `audition: 'dyad'` — D-07; effective ref Hz threaded in from page cell, NOT a literal 440):
```typescript
nodeGroup.on("click", (event, vertex) => {
  if (vertex.index === undefined) return; // neighbor — not in scale
  const iv = scale.intervals[vertex.index];
  if (!iv) return;
  const ratio = Number(iv.fraction.valueOf());
  if (opts.audition === 'note') {
    synth.playNotes([effectiveBaseHz * ratio], 1.5);
  } else {
    synth.playNotes([effectiveBaseHz, effectiveBaseHz * ratio], 1.5);
  }
});
```

**`textContent` (NEVER innerHTML) pattern** (`scale-table.ts` lines 62-66):
```typescript
for (const value of cells) {
  const td = document.createElement("td");
  td.textContent = value; // T-02-23: textContent — never innerHTML.
  tr.appendChild(td);
}
```

For SVG `<text>` and `<title>` content in lattice, use d3's `.text(...)` (which delegates to textContent), never `.html(...)`:
```typescript
sel.append('text').attr('class', 'ratio').text(iv.fraction.toFraction());
sel.append('title').text(`${iv.fraction.toFraction()} | ${iv.cents.toFixed(1)}¢`);
```

**ji-lattice + D3 zoom integration** (RESEARCH lines 263-302, 359-378):
```typescript
const monzos: number[][] = scale.intervals.map(iv => iv.monzo);
// Optional basis projection (D-19 — derive from scale primes minus 2)
const projectedMonzos = applyBasis(monzos, opts.basis ?? deriveBasis(scale));
const options = kraigGrady9();
const { vertices, edges } = spanLattice(projectedMonzos, options);

const svg = d3.create('svg').attr('class', 'viz lattice')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .attr('preserveAspectRatio', 'xMidYMid meet'); // D-17 responsive
const g = svg.append('g');
// ... append edges + node groups into g ...
const zoom = d3.zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.25, 8])
  .on('zoom', (event) => g.attr('transform', event.transform.toString()));
svg.call(zoom);
root.appendChild(svg.node()!);
```

**Anti-patterns** (RESEARCH lines 435-442):
- Do NOT allocate `AudioContext` inside this component (D-08, Pitfall #2). Synth handle is owner-allocated.
- Do NOT re-run `spanLattice` on every zoom event — compute once per `(scale, opts)`.
- Do NOT `.html(...)` on SVG text — use `.text(...)`.
- Do NOT wrap SVG in `<button>`. Use `<g role="button" tabindex="0">` + keydown for Enter/Space.

---

### `src/components/tonality-diamond.ts` (D3 SVG hand-laid grid)

**Analog:** Same as lattice.ts (`audio-panel.ts` factory shape + `scale-table.ts` per-cell rendering). Diamond differs from lattice only in the layout step — instead of `spanLattice`, it enumerates `i, j ∈ odd ints ≤ oddLimit` octave-reduced into `[1, 2)` and lays them on a hand-rolled `(i, j)` grid (CONTEXT line 246).

**Imports** (drop `ji-lattice`, add `oddLimit` + `Interval`):
```typescript
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";
import * as d3 from "d3";
import { Interval } from "../lib/interval.js";
import { oddLimit, primeLimit } from "../lib/monzo.js"; // already re-exported
```

**Cell-enumeration pattern** (CONTEXT lines 232-233 example; RESEARCH "Architectural Responsibility Map" line 92 suggests `src/lib/diamond.ts` with `enumerateDiamond(oddLimit)`):
```typescript
function enumerateDiamond(oddLimit: number): { ratio: Interval; i: number; j: number }[] {
  const odds: number[] = [];
  for (let n = 1; n <= oddLimit; n += 2) odds.push(n);
  const cells: { ratio: Interval; i: number; j: number }[] = [];
  for (const i of odds) {
    for (const j of odds) {
      const r = new Interval(`${i}/${j}`).octaveReduce();
      cells.push({ ratio: r, i, j });
    }
  }
  return cells;
}
```

**In-scale check via `Interval.equals`** (RESEARCH line 442 — anti-pattern: cents tolerance):
```typescript
const inScale = scale.intervals.some(iv => iv.equals(cell.ratio));
```
NEVER `Math.abs(cell.cents - iv.cents) < 1` — Pitfall #1, #6.

**Tooltip via SVG `<title>`** (D-22; RESEARCH line 440):
```typescript
cellSel.append('title').text(
  `${cell.ratio.fraction.toFraction()} | ${cell.ratio.cents.toFixed(1)}¢ | ${primeLimit(cell.ratio.monzo)}-limit | ${inScale ? "in scale" : "not in scale"}`
);
```

All other patterns (heading, helper, click-audition, D3 zoom, factory shape) — same as lattice.ts above.

---

### `src/components/keyboard.ts` (SVG strip; click-to-audition; sustain via pointerdown/up)

**Analog:** `src/components/audio-panel.ts` (signature mirrors `audioPanel(scale, synth, baseHz, opts)`) + `src/components/play-interval.ts` (single-click audition pattern).

**Factory signature** (matches CONTEXT D-08 contract):
```typescript
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface KeyboardOpts {
  precision?: number; // 0.1¢ default per Pitfall #16; matches scaleTable.
}
export function keyboard(
  scale: Scale,
  synth: SynthHandle,
  baseHz: number,
  opts: KeyboardOpts = {},
): HTMLElement { /* ... */ }
```

**Single-note audition** (`play-interval.ts` lines 46-50):
```typescript
btn.addEventListener("click", () => {
  synth.playNotes([baseHz, baseHz * Number(interval.fraction.valueOf())], dur);
});
```

For a keyboard key (D-04 — single note, NOT dyad — the keyboard is monophonic-feel by convention):
```typescript
keyEl.addEventListener("pointerdown", () => {
  const ratio = Number(iv.fraction.valueOf());
  release = synth.playNote(baseHz * ratio, 5.0); // long enough to outlast typical hold
  keyEl.setAttribute("aria-pressed", "true");
  keyEl.classList.add("keyboard__key--active");
});
const stop = () => {
  release?.();
  release = null;
  keyEl.setAttribute("aria-pressed", "false");
  keyEl.classList.remove("keyboard__key--active");
};
keyEl.addEventListener("pointerup", stop);
keyEl.addEventListener("pointerleave", stop);
keyEl.addEventListener("pointercancel", stop);
```
(Per UI-SPEC §Keyboard interaction; touch-and-hold sustain is mobile-essential.)

**Cents-from-12tet display** (`scale-table.ts` lines 50-60 — signed format, 0.1¢ default):
```typescript
const delta = iv.centsFrom12tet;
const formatted = (delta > 0 ? "+" : "") + delta.toFixed(precision);
```

**aria-label per key** (UI-SPEC keyboard accessibility line 202):
```typescript
keyEl.setAttribute("aria-label",
  `Play degree ${i + 1}: ${iv.fraction.toFraction()}, ${formatted}¢ from 12-TET`
);
```

---

### `src/components/lattice.css`, `tonality-diamond.css`, `keyboard.css` (colocated stylesheets)

**Analog:** `src/components/audio-panel.css` + `src/components/scl-io.css` — both ~80 lines, theme-token-only, no hard-coded hex.

**Header docblock pattern** (`audio-panel.css` lines 1-6):
```css
/* audio-panel.css — dashboard audition controls.
 *
 * Theme tokens only. The drone-active state uses a 12% blue tint on the
 * background — accent color is reserved for active-affordance signaling per
 * UI-SPEC.
 */
```

**Section-block + row pattern** (`audio-panel.css` lines 8-24):
```css
.audio-panel {
  margin-block: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.audio-panel h2 {
  margin: 0 0 8px 0;
}
.audio-panel__row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
```

**Theme-token tinting** (`audio-panel.css` lines 50-52 — accent-state):
```css
.audio-panel__drone[aria-pressed="true"] {
  background: color-mix(in oklab, var(--theme-blue) 12%, var(--theme-background));
}
```

For lattice/diamond/keyboard, apply the same pattern to in-scale fills (per UI-SPEC color table — prime-axis colors `--theme-blue/green/orange`).

**Focus-visible pattern** (`scl-io.css` lines 46-49 + `audio-panel.css` lines 45-48):
```css
.scl-io__filename:focus-visible {
  outline: 2px solid var(--theme-foreground-focus);
  outline-offset: 2px;
}
```
Apply to clickable SVG `<g>` elements (note: focus-visible on SVG groups requires `tabindex="0"` and works in modern browsers; verify in plan).

**Phase 3-specific additions** (per UI-SPEC line 171):
```css
svg.viz {
  width: 100%;
  height: auto;
  max-width: 100%;
  touch-action: none; /* d3-zoom owns pinch — RESEARCH line 386 */
}
```

---

### `src/components/scl-io.ts` (MODIFIED in place — extend to handle .kbm)

**Analog:** self (Phase 2 implementation; extend, don't replace).

**Existing import-button + FileReader pattern** (lines 77-120) — adapt to handle both extensions. Auto-detect by extension on `File.name` (D-11):
```typescript
fileInput.accept = ".scl,.kbm,text/plain"; // EXTEND from current ".scl,text/plain"
// ...
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const ext = file.name.toLowerCase().endsWith(".kbm") ? "kbm" : "scl";
  const reader = new FileReader();
  reader.onload = () => {
    const text = typeof reader.result === "string" ? reader.result : "";
    try {
      if (ext === "kbm") {
        const kbm = parseKbm(text);
        status.textContent =
          `Imported ${file.name} (size ${String(kbm.size)}, ref ${String(kbm.referenceKey)}, middle ${String(kbm.middleNote)}).`;
        opts.onImportKbm?.(kbm);
      } else {
        const parsed = parseScl(text);
        const newScale = new Scale(parsed.intervals);
        status.textContent = `Loaded "${parsed.description}" — ${String(parsed.intervals.length - 1)} pitches.`;
        opts.onImport?.(newScale, parsed.description);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      status.textContent = `Couldn't parse ${file.name}: ${msg}. The dashboard scale is unchanged.`;
    } finally {
      fileInput.value = "";
    }
  };
  // ...
});
```

**Existing export pattern** (lines 145-164) — clone for `.kbm`. UI-SPEC line 130 mandates two side-by-side export buttons (`Download .scl`, `Download .kbm`):
```typescript
const exportSclBtn = document.createElement("button");
exportSclBtn.className = "play-btn scl-io__export";
exportSclBtn.type = "button";
exportSclBtn.textContent = "⤓ Download .scl"; // existing copy
// ... existing handler ...

const exportKbmBtn = document.createElement("button");
exportKbmBtn.className = "play-btn scl-io__export";
exportKbmBtn.type = "button";
exportKbmBtn.textContent = "⤓ Download .kbm"; // UI-SPEC copywriting line 130
exportKbmBtn.addEventListener("click", () => {
  const kbm = opts.kbmForExport ?? defaultKbmFor(scale, baseHz); // D-12 defaults
  const text = writeKbm(kbm);
  const blob = new Blob([text], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameInput.value}.kbm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
});
```

**Status-region pattern** (lines 67-71) — preserved verbatim; both kbm and scl messages share the single `role=status aria-live=polite` region per D-11.

**SclIoOpts extension** — the existing interface gains:
```typescript
export interface SclIoOpts {
  onImport?: (scale: Scale, description: string) => void;
  defaultFilename?: string;
  // Phase 3 additions:
  onImportKbm?: (kbm: KbmMapping) => void;
  kbmForExport?: KbmMapping; // computed by dashboard cell from current Scale + baseHz
  baseHz?: number; // for default-kbm derivation when kbmForExport not provided
}
```

UI-SPEC line 207 recommends dropping the `__filename-ext` span and letting each export button append its own extension to the user-typed filename — current code (line 142) shows `.scl` next to the input; the recommendation simplifies to no span, both buttons append their own extension.

---

### `src/audio/synth.ts` (MODIFIED in place — mobile Safari fixes)

**Analog:** self (Phase 2 implementation). The structural pattern stays; three additions inside `ensure()` and one new internal cleanup for `visibilitychange`.

**Existing AudioContext-resolution pattern** (lines 86-100) — already handles `webkitAudioContext` fallback; D-15 confirms this is correct, but verify in plan that `resolveAudioCtxCtor` actually exercises the `webkitAudioContext` branch in tests. Current implementation:
```typescript
const resolveAudioCtxCtor = (): AnyCtxCtor | null => {
  const win = (
    globalThis as unknown as {
      window?: {
        AudioContext?: AnyCtxCtor;
        webkitAudioContext?: AnyCtxCtor;
      };
    }
  ).window;
  if (win?.AudioContext) return win.AudioContext;
  if (win?.webkitAudioContext) return win.webkitAudioContext;
  const direct = (globalThis as unknown as { AudioContext?: AnyCtxCtor }).AudioContext;
  return direct ?? null;
};
```
**No change needed** — already satisfies D-15 third bullet.

**Existing `ensure()` lazy-init** (lines 115-135) — extend to:
1. Set `audioSession.type = 'playback'` (RESEARCH line 13 — iOS hardware-mute fix; current as of iOS 17):
2. Synchronously call `ctx.resume()` so the FIRST user-gesture invocation unlocks the context immediately (D-15 first bullet — no `await` between gesture and resume).
3. Bind `visibilitychange` listener.

```typescript
const ensure = (): boolean => {
  if (disposed) return false;
  if (ctx && synth) {
    // Already initialised — but if context got suspended in the meantime,
    // resume it synchronously here (we're inside a click handler).
    if (ctx.state === "suspended") void ctx.resume();
    return true;
  }
  const Ctx = resolveAudioCtxCtor();
  if (!Ctx) return false;
  ctx = new Ctx({ latencyHint: "interactive" });
  // iOS 17+: tell the OS we are media playback, not a phone call. Bypasses
  // the hardware silent switch where supported. Feature-detected (no throw
  // on browsers without Audio Session API).
  setAudioSessionPlayback();
  // Synchronous resume — D-15 / Pitfall #10. NO await between gesture and resume.
  void ctx.resume();
  master = ctx.createGain();
  // ... (existing master gain setup) ...
  synth = new SwSynth(ctx, master);
  // ... (existing voiceParams) ...
  bindVisibilityListener();
  return true;
};
```

**New helpers** — co-located inside `createSynth` so they capture `ctx` lexically:
```typescript
function setAudioSessionPlayback(): void {
  // navigator.audioSession is iOS 17+ Safari only.
  const nav = globalThis.navigator as Navigator & { audioSession?: { type: string } };
  if (nav?.audioSession) {
    try { nav.audioSession.type = "playback"; } catch { /* swallow */ }
  }
}

let onVisibility: (() => void) | null = null;
function bindVisibilityListener(): void {
  if (onVisibility) return; // bind once
  onVisibility = (): void => {
    if (disposed || !ctx) return;
    if (document.visibilityState === "visible" && ctx.state === "suspended") {
      void ctx.resume();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
}
```

**Existing `dispose()`** (lines 226-244) — extend to remove the visibility listener:
```typescript
dispose() {
  if (disposed) return;
  disposed = true;
  if (onVisibility) {
    document.removeEventListener("visibilitychange", onVisibility);
    onVisibility = null;
  }
  // ... (existing teardown) ...
}
```

**Test pattern** (`synth.test.ts` lines 40-93) — when extending tests, follow the existing `vi.mock("npm:sw-synth", ...)` + `vi.mock("sw-synth", ...)` double-mock pattern. Add a `mockDocument` with `addEventListener / removeEventListener` and `visibilityState` to verify the bind + remove + resume-on-visible flow. The existing `mockAudioContext` already has `state: 'suspended' | 'running' | 'closed'` — extend to track `resume.mockClear()`.

---

### `src/index.md` (MODIFIED — append cells)

**Analog:** self (Phase 2 dashboard).

**Existing imports cell** (lines 9-17) — append:
```typescript
import { lattice } from "./components/lattice.js";
import { tonalityDiamond } from "./components/tonality-diamond.js";
import { keyboard } from "./components/keyboard.js";
import { parseKbm, kbmToFrequencies, type KbmMapping } from "./lib/kbm.js";
```

**Existing synth cell** (lines 20-26) — extend to bind Esc keydown listener and Mutable for active-voices reactivity (Pitfall #11; CONTEXT lines 217-224):
```typescript
const synth = createSynth();
invalidation.then(() => synth.dispose());

// Esc → panic. Bound HERE in the synth cell (not in a scale-dependent cell)
// so it doesn't re-bind on every textarea edit (Pitfall #11).
const onKey = (e: KeyboardEvent): void => {
  if (e.key === "Escape") synth.panic();
};
document.addEventListener("keydown", onKey);
invalidation.then(() => document.removeEventListener("keydown", onKey));

// Reactive flag for the floating Stop button.
const audioActive = Mutable(false);
const tickActive = (): void => { audioActive.value = synth.activeVoices > 0; };
const interval = setInterval(tickActive, 100); // 10 Hz polling — cheap, no API change to SynthHandle
invalidation.then(() => clearInterval(interval));
```

**New cells (append after existing sclIo cell)** — viz widgets, kbm import callback, effective-baseHz derivation, override toggle, floating Stop button:
```typescript
// kbm state — lives here (page level), driven by sclIo callbacks.
const importedKbm = Mutable<KbmMapping | null>(null);
```
```typescript
// Override toggle — surfaces only when kbm has been imported.
const useBaseHzOverride = importedKbm
  ? view(Inputs.toggle({ label: "Use baseHz instead of imported .kbm", value: false }))
  : false;
```
```typescript
// Effective ref-Hz derivation — single source of truth for all audition paths.
const effectiveBaseHz = (importedKbm && !useBaseHzOverride)
  ? importedKbm.referenceHz * Math.pow(2, (importedKbm.middleNote - importedKbm.referenceKey) / 12)
  : baseHz;
```
```typescript
if (scale) display(lattice(scale, synth, { showContext: 'neighbors', audition: 'dyad' }));
```
```typescript
if (scale) display(tonalityDiamond(scale, synth, { showContext: 'neighbors', audition: 'dyad' }));
```
```typescript
if (scale) display(keyboard(scale, synth, effectiveBaseHz));
```

**Floating Stop button cell** (UI-SPEC lines 210-216):
```typescript
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

**audioPanel cell update** — pass `effectiveBaseHz` instead of `baseHz` (existing line 79):
```typescript
if (scale) display(audioPanel(scale, synth, effectiveBaseHz));
```

---

### `src/styles.css` (MODIFIED — Phase 3 imports + globals)

**Existing pattern** (lines 24-28):
```css
@import "./components/play-buttons.css";
@import "./components/scale-table.css";
@import "./components/ratio-pill.css";
@import "./components/audio-panel.css";
@import "./components/scl-io.css";
```

**Append** the three new component CSS files + the floating Stop button + responsive viewport rules (per UI-SPEC §"src/styles.css additions"):
```css
@import "./components/lattice.css";
@import "./components/tonality-diamond.css";
@import "./components/keyboard.css";

/* Phase 3 — D-17 responsive viewport rules.
   Suppress iOS Safari auto-zoom-on-focus by ensuring inputs are >= 16px. */
input, select, textarea {
  font-size: 16px;
}

/* Phase 3 — D-16 floating Stop button. Visible only when activeVoices > 0
   (driven by inline `display: inline-flex | none` from the page cell). */
.stop-all-audio {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
  font-family: var(--sans-serif);
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-red);
  background: var(--theme-background);
  border: 2px solid var(--theme-red);
  border-radius: 6px;
  cursor: pointer;
}
.stop-all-audio:hover,
.stop-all-audio:focus-visible {
  background: var(--theme-red);
  color: var(--theme-background);
  outline: 2px solid var(--theme-foreground-focus);
  outline-offset: 2px;
}
```

---

### `src/components/__tests__/{lattice,tonality-diamond,keyboard}.test.ts` (DOM-only smoke tests)

**Analog:** `src/audio/__tests__/synth.test.ts` (mocking pattern lines 1-107) + `src/lib/__tests__/scala.test.ts` (vitest+describe+it block structure).

**Mocking sw-synth-via-SynthHandle pattern** — components only depend on the `SynthHandle` interface, so tests pass a hand-rolled stub:
```typescript
import { describe, it, expect, vi } from "vitest";
import type { SynthHandle } from "../../audio/synth.js";

function makeStubSynth(): SynthHandle & {
  playNote: ReturnType<typeof vi.fn>;
  playNotes: ReturnType<typeof vi.fn>;
} {
  const playNote = vi.fn(() => () => {});
  const playNotes = vi.fn();
  return {
    playNote,
    playNotes,
    playArpeggio: vi.fn(),
    startDrone: vi.fn(() => () => {}),
    panic: vi.fn(),
    get activeVoices() { return 0; },
    dispose: vi.fn(),
  };
}
```

**DOM availability** — vitest needs `environment: "jsdom"` in `vitest.config.ts` for component tests. Per CONTEXT line 189, the component-tests glob extension was done in Phase 2 Plan 01 — verify in plan.

**Smoke-test shape** (factory returns `HTMLElement` with the expected role/structure; click triggers playNote/playNotes — no audio assertions):
```typescript
describe("lattice factory", () => {
  it("returns a section with heading 'Lattice'", () => {
    const scale = /* a small Scale fixture */;
    const synth = makeStubSynth();
    const el = lattice(scale, synth);
    expect(el.tagName).toBe("SECTION");
    expect(el.querySelector("h2")?.textContent).toBe("Lattice");
  });

  it("clicking an in-scale node calls synth.playNotes with [baseHz, baseHz*ratio]", () => {
    // ... dispatch click event on a node group ...
    expect(synth.playNotes).toHaveBeenCalled();
  });
});
```

---

## Shared Patterns

These cross-cutting patterns apply to multiple Phase 3 files. The planner should reference them once and have each plan's actions point back here.

### S-1: Component Factory Contract (Phase 2 D-09 / ARCHITECTURE Pattern 2)

**Source:** `src/components/audio-panel.ts` lines 37-138 (the canonical synth-driven factory).

**Apply to:** `lattice.ts`, `tonality-diamond.ts`, `keyboard.ts`, modified `scl-io.ts`.

```typescript
export function audioPanel(
  scale: Scale,
  synth: SynthHandle,
  baseHz: number,
  opts: AudioPanelOpts = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "audio-panel";
  // ... build subtree, attach event listeners ...
  return root;
}
```

Every Phase 3 viz component returns an `HTMLElement`. No module-level state. Opts parameter is the LAST argument with a default `= {}`. The synth handle is owner-allocated by the page cell (never instantiated inside a component).

### S-2: textContent NEVER innerHTML for dynamic content (Phase 2 D-22 / T-02-22, T-02-23)

**Source:** `src/components/scale-table.ts` lines 62-66; `src/components/scl-io.ts` lines 100-108.

**Apply to:** ALL dynamic text in lattice/diamond/keyboard SVGs, all status-region updates in scl-io.ts, all label rendering. Static `<th>`-only content (no interpolation) may use innerHTML; everything else must use `textContent` or d3's `.text(...)`.

```typescript
// For SVG text via d3:
sel.append('text').text(iv.fraction.toFraction()); // safe — d3.text → textContent
// For SVG title (tooltip):
sel.append('title').text(`${ratio} | ${cents}¢ | ${limit}-limit`); // safe
// For status region:
status.textContent = `Imported ${file.name} (...)`; // safe
```

**FORBIDDEN:**
```typescript
sel.append('text').html(...);     // ✗ XSS surface
status.innerHTML = `...${userInput}...`; // ✗
```

### S-3: BigInt Fraction → Number boundary at audio tier only (Pitfall #1, R-01)

**Source:** `src/lib/scale.ts` line 127 (`degreeToFreq`); `src/components/audio-panel.ts` line 86; `src/components/play-interval.ts` line 49.

**Apply to:** Every component click-handler that calls `synth.playNote/playNotes`; `kbmToFrequencies` in the new lib module.

```typescript
synth.playNotes(
  [baseHz, baseHz * Number(iv.fraction.valueOf())],
  1.5,
);
```

Ratio kernel work stays on `Interval`/`Fraction` (BigInt). Number coercion happens **only** at the multiply-by-Hz step. Equality comparisons in the kernel (lattice node "in scale?", diamond "in scale?") use `Interval.equals` — never cents tolerance.

### S-4: Cell-owned synth + invalidation cleanup (ARCHITECTURE Pattern 4 / Pitfall #2 / Pitfall #11)

**Source:** `src/index.md` lines 19-26.

**Apply to:** Phase 3 additions to `index.md` — Esc keydown listener, visibilitychange listener (in synth.ts but ownership-conceptually here), Mutable<boolean> active-voices polling, floating Stop button.

```typescript
const synth = createSynth();
invalidation.then(() => synth.dispose());
// Listeners that should NOT re-bind on scale-text edits go in THIS cell:
const onKey = (e) => { if (e.key === "Escape") synth.panic(); };
document.addEventListener("keydown", onKey);
invalidation.then(() => document.removeEventListener("keydown", onKey));
```

A listener that depends only on `synth` (not `scale`, not `baseHz`) belongs in the synth cell so it survives every textarea keystroke.

### S-5: Trust-boundary input cap (T-02-10 / T-02-11)

**Source:** `src/lib/scala.ts` lines 41-60 (`MAX_INPUT_BYTES = 1_000_000` + `utf8ByteLength`).

**Apply to:** `parseKbm` — copy the cap and the helper inline (both small; ~10 lines together). The kbm spec doesn't have a monzo-length analog, but the keyMap can be unbounded; cap at, e.g., `MAX_KEY_MAP_LENGTH = 1024` (the firstKey/lastKey range can't legitimately exceed MIDI's 128 in practice; 1024 is generous).

```typescript
const MAX_INPUT_BYTES = 1_000_000;
function utf8ByteLength(s: string): number {
  if (s.length * 3 <= MAX_INPUT_BYTES) return s.length * 3;
  return new TextEncoder().encode(s).byteLength;
}
// At parser entry:
if (utf8ByteLength(file) > MAX_INPUT_BYTES) {
  throw new Error(`parseKbm: input too large (max 1MB UTF-8)`);
}
```

### S-6: BOM strip + CRLF normalize (Phase 2 file-IO contract)

**Source:** `src/lib/scala.ts` lines 208-214 (`normalizeLines`).

**Apply to:** `parseKbm`. The function is small; copy verbatim (or extract to a shared `src/lib/text-io.ts` if a third caller materializes — for Phase 3 with one new caller, inline duplication is the right call).

```typescript
function normalizeLines(text: string): string[] {
  // Strip BOM (effective on first line only); normalize CRLF / CR to LF.
  const noBom = text.replace(/^\uFEFF/, "");
  return noBom.replace(/\r\n?/g, "\n").split("\n");
}
```

### S-7: Theme-token-only CSS (UI-SPEC Color contract)

**Source:** `src/components/audio-panel.css` (every value is `var(--theme-*)`, `color-mix(...)`, or a unitless number); `src/styles.css` lines 31-45.

**Apply to:** `lattice.css`, `tonality-diamond.css`, `keyboard.css`, plus the new floating-button rules in `styles.css`. NO hard-coded hex colors. The 3-prime palette uses `--theme-blue / --theme-green / --theme-orange`; ≥11-limit gracefully falls back to `--theme-foreground` (UI-SPEC line 102).

### S-8: File-IO download flow (Blob + URL.createObjectURL + anchor.click)

**Source:** `src/components/scl-io.ts` lines 149-164.

**Apply to:** New `Download .kbm` button in modified `scl-io.ts`. Reuse the exact try/finally + Firefox-compat appendChild/removeChild pattern.

```typescript
const text = writeScl(scale);
const blob = new Blob([text], { type: "application/octet-stream" });
const url = URL.createObjectURL(blob);
try {
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameInput.value}.scl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
} finally {
  URL.revokeObjectURL(url);
}
```

### S-9: Vitest fixture-driven test layout

**Source:** `src/lib/__tests__/scala.test.ts` lines 7-23 (imports + fixture loader); `src/audio/__tests__/synth.test.ts` lines 1-107 (mocking).

**Apply to:** `kbm.test.ts` (use `fixtures/kbm/` directory), the three component smoke tests (use `makeStubSynth()` helper).

---

## No Analog Found

| File | Role | Data Flow | Reason | Planner Action |
|------|------|-----------|--------|----------------|
| `.planning/phases/03-.../mobile-audit.md` | documentation | static prose | Pure prose deliverable; no code pattern to mirror. CONTEXT lines 235-241 specify the exact contents. | Use CONTEXT specifics as the spec; no code analog needed. |

**Partial-analog flags** (planner should note):
- **`lattice.ts` / `tonality-diamond.ts` SVG layout work** — no existing SVG component in the repo. The component-factory contract is exact (S-1); D3 + ji-lattice integration is documented in RESEARCH lines 256-389 with verbatim code excerpts. Lean on the RESEARCH excerpts for the SVG-specific steps; lean on `audio-panel.ts` for the factory shell.
- **Component DOM tests** — no existing tests under `src/components/__tests__/`. Per CONTEXT line 189, the test-glob extension was done in Phase 2 Plan 01; the planner should confirm `vitest.config.ts` includes `src/components/**/*.test.ts` and uses `environment: "jsdom"`. The synth.test.ts mocking style is the closest precedent.

---

## Metadata

**Analog search scope:**
- `src/lib/` (all 7 .ts modules + 7 test files)
- `src/components/` (all 7 .ts modules + 5 .css files)
- `src/audio/` (synth.ts + synth.test.ts)
- `src/index.md`, `src/styles.css`
- `.planning/phases/02-math-kernel-composition-anchor-mvp/` carry-forward decisions
- `node_modules/ji-lattice/dist/` (verified API in RESEARCH)

**Files scanned:** 18 source files + 4 test files + 5 CSS files + index.md + styles.css = 29 files.

**Pattern extraction date:** 2026-05-05

---

## PATTERN MAPPING COMPLETE
