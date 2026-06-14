# Generate

Build a scale by method, audition it, then send it live to the Dashboard or Analysis.

```ts
import { Scale } from "../lib/scale.js";
import { parseScala } from "../lib/scala.js";
import { createSynth } from "../audio/synth.js";
import { scaleTable } from "../components/scale-table.js";
import { playScale } from "../components/play-scale.js";
import { generateCps } from "../components/generate-cps.js";
import { generateHarmonic } from "../components/generate-harmonic.js";
import { generateJiSet } from "../components/generate-ji-set.js";
import { generateEd } from "../components/generate-ed.js";
import { generateRank2 } from "../components/generate-rank2.js";
import { generateWelltemp } from "../components/generate-welltemp.js";
import { generateFokker } from "../components/generate-fokker.js";
import { generateSonicweave } from "../components/generate-sonicweave.js";
import { generateMeru } from "../components/generate-meru.js";
import { generateCs } from "../components/generate-cs.js";
import { circleOfPitches } from "../components/circle-of-pitches.js";
import { scaleTransformStrip } from "../components/scale-transform-strip.js";
import { encodeScaleToHash } from "../lib/url.js";
import { writeSharedScale } from "../state/scale-store.js";
```

```ts
// Synth cell — owns the AudioContext for this page (Pattern 4 / Pitfall #2 / D-02).
// Copied verbatim from analysis.md lines 27–38: the synth cell depends on NO other
// cell so edits elsewhere never tear down the AudioContext. The lazy createSynth()
// does not create the context until the first playNote / playArpeggio call.
//
// Esc keydown + activeVoices polling are bound HERE (Pitfall #11) so they don't
// re-bind on every param edit. invalidation.then() consolidates all cleanups.
// No top-level `new AudioContext` (CLAUDE.md; D-02).
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

```ts
// Placeholder seed scale (Phase-5 demo) — the same 7-limit JI heptatonic the
// Dashboard and Analysis use (index.md lines 66–72 / analysis.md lines 46–52).
// The template literal MUST start at column 0 so leading whitespace is NOT
// preserved inside the parsed scale text (parseScala rejects whitespace inside
// ratio tokens). Plain JI — no `tempered` field on Interval/Scale (D-06).
const seedText = `9/8
5/4
21/16
3/2
27/16
7/4
2/1`;
```

```ts
// Method-picker source of truth (D-04 / UI-SPEC lines 108–111). Four families;
// only `harmonic-segment` is a functional reference method in Phase 5. The other
// three families carry a single `(coming soon)` placeholder option each.
//
// NOTE: Observable's Inputs.select does NOT emit <optgroup> elements (verified
// against @observablehq/inputs/src/select.js — it renders a flat <option> list
// even from a Map). D-04 requires FOUR real <optgroup>s, so the picker is built
// as a native <select> (PATTERNS.md "Approach B") below.
const METHOD_FAMILIES = [
  {
    label: "Regular / equal temperament",
    options: [
      { id: "ed", text: "EDO / equal division (ED-n)", placeholder: false },
      { id: "rank2", text: "Rank-2 regular temperament", placeholder: false },
      { id: "welltemp", text: "Well-temperament", placeholder: false },
    ],
  },
  {
    label: "JI combinatorial",
    options: [
      { id: "cps", text: "CPS (Hexany / Dekany / Eikosany)", placeholder: false },
      { id: "ji-set", text: "Diamond / odd-limit / prime-limit / Farey", placeholder: false },
    ],
  },
  {
    label: "Harmonic & interval divisions",
    options: [{ id: "harmonic-segment", text: "Harmonic / subharmonic / ADO / isoharmonic", placeholder: false }],
  },
  {
    label: "Advanced / algorithmic",
    options: [
      { id: "fokker", text: "Fokker periodicity block", placeholder: false },
      { id: "meru", text: "Wilson recurrence / metallic (Mt. Meru)", placeholder: false },
      { id: "cs", text: "Constant structure", placeholder: false },
    ],
  },
  {
    label: "SonicWeave",
    options: [{ id: "sonicweave", text: "Free-text SonicWeave", placeholder: false }],
  },
];
```

```ts
// Native grouped <select> picker — exactly four <optgroup> elements (one per
// family, D-04 AUTHORITATIVE). Built with document.createElement so the DOM
// truly contains <optgroup>s (Inputs.select would not). view(picker) tracks the
// selected option value: native <select> is type "select-one", so Framework's
// Generators.input listens on the "input" event and reads element.value
// (verified against stdlib/generators/input.js). The leading
// "— pick a method —" placeholder option is selected by default.
const picker = (() => {
  const select = document.createElement("select");
  select.className = "observablehq-input";
  select.setAttribute("aria-label", "Method");
  select.name = "method";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "— pick a method —";
  placeholderOption.selected = true;
  select.appendChild(placeholderOption);

  for (const family of METHOD_FAMILIES) {
    const group = document.createElement("optgroup");
    group.label = family.label; // locked family string, set via property (text-safe)
    for (const opt of family.options) {
      const optionEl = document.createElement("option");
      optionEl.value = opt.id;
      optionEl.textContent = opt.text;
      group.appendChild(optionEl);
    }
    select.appendChild(group);
  }
  return select;
})();
```

```ts
// Method label + picker, laid out as a labelled field (top focal point per D-03).
const methodField = (() => {
  const wrap = document.createElement("div");
  wrap.className = "generate-field";
  const label = document.createElement("label");
  label.className = "generate-field__label";
  label.textContent = "Method";
  label.htmlFor = picker.id || (picker.id = "generate-method-select");
  wrap.appendChild(label);
  wrap.appendChild(picker);
  return wrap;
})();
display(methodField);
```

```ts
// Reactive selected-method id. view(picker) yields the <select>'s value (the
// option id, or "" for the placeholder). Drives the params/preview swap below.
const method = view(picker);
```

```ts
// Params host — the swap target (D-05). display() returns the live element so
// the render cell below can replaceChildren into it (text via textContent only).
const paramsHost = display(document.createElement("div"));
paramsHost.className = "generate-host generate-host--params";
```

```ts
// Helper line under the params host (mirrors the Scala "last line is the period"
// convention used on the Dashboard / Analysis preview).
```

## Preview

```ts
const previewHelper = (() => {
  const p = document.createElement("p");
  p.className = "dashboard-helper";
  p.textContent = "Last line is the period. 1/1 is added automatically.";
  return p;
})();
display(previewHelper);
```

```ts
// Preview host — scaleTable + playScale render here, reactive on the picker,
// the segment-size param, and baseHz. display() returns the element for
// replaceChildren swaps (D-05 / D-07); text via textContent only.
const previewHost = display(document.createElement("div"));
previewHost.className = "generate-host generate-host--preview";
```

```ts
const baseHz = view(Inputs.number({ value: 440, step: 0.01, label: "Reference pitch (Hz)" }));
```

```ts
// CPS method widget (GEN-01) — instantiated ONCE so its closure-local factor
// chips + preset + k survive mount/unmount into paramsHost across picker swaps
// (the mosBuilder Pattern-2 precedent). The widget renders its own scaleTable +
// ⏵⏵ Play internally and exposes getScale() so the Send-to serialization cell
// can read the current CPS Scale. baseHz is read once here; the widget owns its
// own reference-pitch projection for the CPS branch (the harmonic-segment branch
// keeps its reactive baseHz preview unchanged — D-08).
const cpsWidget = generateCps(synth, { baseHz });
```

```ts
// Harmonic-family widget (GEN-02, GEN-03) — instantiated ONCE so its closure-local
// sub-method + per-sub-method params survive mount/unmount into paramsHost across
// picker swaps (the mosBuilder/generateCps Pattern-2 precedent). It renders its own
// scaleTable + ⏵⏵ Play internally and exposes getScale() for the Send-to cell.
//
// D-08 migration: this widget REPLACES the Phase-5 standalone harmonic-segment
// reference (the retired segmentSizeInput/buildHarmonicSegmentText path) under the
// SAME `harmonic-segment` picker id, so the Harmonic family keeps ONE entry (D-10)
// and harmonic segment stays the page's default landing method. The page's actual
// first-paint (placeholder selected → demo seed) is unchanged byte-for-byte; the
// widget's D-09 showcase default (harmonic segment 8..16) renders once the Harmonic
// method is selected.
const harmonicWidget = generateHarmonic(synth, { baseHz });
```

```ts
// JI-set widget (GEN-04) — diamond / odd-limit / prime-limit / Farey. Instantiated
// ONCE so its closure-local sub-method + per-sub-method limit survive mount/unmount
// into paramsHost across picker swaps (the generateCps / generateHarmonic Pattern-2
// precedent). It renders its own EXACT-JI scaleTable + ⏵⏵ Play internally and
// exposes getScale() for the Send-to cell (serialized ratio-per-line — exact JI).
const jiSetWidget = generateJiSet(synth, { baseHz });
```

```ts
// Equal-division widget (GEN-05, SURF-06) — the FIRST tempered family (EDO / ED-n /
// best-JI-in-EDO). Instantiated ONCE so its closure-local sub-method + divisions +
// equave survive mount/unmount into paramsHost across picker swaps. It renders its
// own TEMPERED scaleTable (cents-only + "tempered" badge, D-01/D-02) + ⏵⏵ Play and
// exposes getScale() AND isTempered() so the Send-to cell serializes the scale as
// cents-per-line (D-03), never ratios (no laundered JI — SURF-06).
const edWidget = generateEd(synth, { baseHz });
```

```ts
// Rank-2 regular-temperament widget (GEN-06, Plan 07-02). Instantiated ONCE so its
// closure-local preset + tuning + generator + up/down survive mount/unmount into
// paramsHost across picker swaps (the generateEd / generateCps Pattern-2 precedent).
// It renders its own scaleTable + ⏵⏵ Play internally and exposes getScale() AND
// isTempered() — CONDITIONALLY tempered (quarter-comma default → tempered cents-of-
// record; the Pythagorean pure preset → exact JI ratios). The Send-to cell branches
// on isTempered() to serialize cents-per-line (tempered) or ratio-per-line (pure).
const rank2Widget = generateRank2(synth, { baseHz });
```

```ts
// Well-temperament widget (GEN-07, Plan 07-02). Instantiated ONCE so its closure-
// local preset + per-fifth comma-fraction vector survive mount/unmount into
// paramsHost across picker swaps. It renders its own TEMPERED scaleTable (cents-only
// + "tempered" badge) + ⏵⏵ Play and exposes getScale() AND isTempered() (ALWAYS true
// — well-temperament is cents-of-record), so the Send-to cell serializes the scale as
// cents-per-line (D-03), never ratios.
const welltempWidget = generateWelltemp(synth, { baseHz });
```

```ts
// Fokker periodicity-block widget (GEN-08, Plan 07-03). Instantiated ONCE so its
// closure-local mode (basis ↔ comma) + basis/extents + comma chips survive
// mount/unmount into paramsHost across picker swaps. It renders its own EXACT-JI
// scaleTable + ⏵⏵ Play and exposes getScale() AND isTempered() (ALWAYS false — Fokker
// blocks are exact rational), so the Send-to cell serializes ratio-per-line.
const fokkerWidget = generateFokker(synth, { baseHz });
```

```ts
// Free-text SonicWeave widget (GEN-09, Plan 07-03). Instantiated ONCE so its closure-
// local textarea program survives mount/unmount into paramsHost across picker swaps.
// It renders its own scaleTable + ⏵⏵ Play and exposes getScale() AND isTempered() —
// CONDITIONALLY tempered (the cps([1,3,5,7],2) default is exact JI → false; a tempered
// program → true). The Send-to cell branches on isTempered() to serialize cents-per-
// line (tempered) or ratio-per-line (exact JI).
const sonicweaveWidget = generateSonicweave(synth, { baseHz });
```

```ts
// Wilson recurrence / metallic (Mt. Meru) widget (GEN-10, Plan 08-03). Instantiated
// ONCE so its closure-local preset + a/b/x₀/x₁/term-count fields survive mount/unmount
// into paramsHost across picker swaps (the generateFokker / generateCps Pattern-2
// precedent). It renders its own EXACT-JI convergent scaleTable + ⏵⏵ Play and a SEPARATE
// tempered-flagged metallic-limit (φ ≈ 833.1¢) readout BESIDE the table (D-09 — never a
// scale degree), and exposes getScale() AND isTempered() (ALWAYS false — Wilson
// convergents are exact rational), so the Send-to cell serializes ratio-per-line.
const meruWidget = generateMeru(synth, { baseHz });
```

```ts
// Constant-structure (csgs) widget (GEN-10, Plan 08-03). Instantiated ONCE so its
// closure-local generator-ratio chips + ordinal field survive mount/unmount into
// paramsHost across picker swaps (the generateFokker Pattern-2 precedent minus the
// mode toggle). It renders its own scaleTable + ⏵⏵ Play and a live "✓ constant
// structure" readout, lands on the corrected csgs([3/2], 3) → 7-note Pythagorean
// diatonic default, and exposes getScale() AND isTempered() (the adapter flag —
// normally false, exact JI). The Send-to cell branches on isTempered().
const csWidget = generateCs(synth, { baseHz });
```

```ts
// ─── Compute the current scale from the picker + param ───────────────────────
// Serialize the CPS widget's current Scale ratio-per-line (exact JI — D-06). Read
// LIVE from the widget so the latest chip/preset edits round-trip (the widget's
// internal state changes don't tick Observable's reactive graph, so we read it at
// call time, not via a captured cell value). Null scale → fall back to seedText.
//
// parseScala (the text-input path Send-to feeds) auto-prepends 1/1, so we DROP a
// leading unison from the CPS scale to avoid a duplicate 1/1 — matching the
// harmonic-segment convention (its text starts at (n+1)/n, omitting 1/1).
function cpsScaleText() {
  const scale = cpsWidget.getScale();
  if (!scale) return seedText;
  let ivs = scale.intervals;
  if (ivs.length > 0 && ivs[0].toString() === "1") ivs = ivs.slice(1);
  return ivs.map((iv) => iv.toString()).join("\n");
}
// Same live-read + leading-1/1 strip for the harmonic-family widget. The literal
// segments start at 8/8 = "1" (and the reduced/iso paths start at 1/1 too), so we
// drop a leading unison to avoid a duplicate after parseScala's auto-prepend.
function harmonicScaleText() {
  const scale = harmonicWidget.getScale();
  if (!scale) return seedText;
  let ivs = scale.intervals;
  if (ivs.length > 0 && ivs[0].toString() === "1") ivs = ivs.slice(1);
  return ivs.map((iv) => iv.toString()).join("\n");
}
// JI-set widget (GEN-04) — exact JI, serialized ratio-per-line (same convention as
// CPS / harmonic: drop a leading 1/1 to avoid a duplicate after parseScala's
// auto-prepend).
function jiSetScaleText() {
  const scale = jiSetWidget.getScale();
  if (!scale) return seedText;
  let ivs = scale.intervals;
  if (ivs.length > 0 && ivs[0].toString() === "1") ivs = ivs.slice(1);
  return ivs.map((iv) => iv.toString()).join("\n");
}
// ED widget (GEN-05, SURF-06) — TEMPERED. The LOAD-BEARING D-03 branch: serialize
// CENTS-per-line, NOT ratios. The tempered scale's pitches have no exact ratio of
// record (cents is the source of truth), so emitting `iv.toString()` ratios would
// launder the temperament as exact JI (SURF-06). Each cents value carries a `.`
// which triggers parseScala's cents-detection on the receiving end (the Dashboard /
// Analysis parse it as a cents-defined scale). We drop a leading 0.0000¢ unison to
// avoid a duplicate after parseScala's auto-prepend of 1/1. `isTempered()` gates
// this branch so a future non-tempered method never accidentally serializes cents.
function edScaleText() {
  const scale = edWidget.getScale();
  if (!scale) return seedText;
  let ivs = scale.intervals;
  // The first pitch is the 0¢ unison (k=0); drop it (parseScala auto-prepends 1/1).
  if (ivs.length > 0 && Math.abs(ivs[0].cents) < 1e-6) ivs = ivs.slice(1);
  return ivs.map((iv) => iv.cents.toFixed(4)).join("\n");
}
// ─── Phase-7 widgets (GEN-06..09). All read LIVE from the widget at call time
// (the widget's internal edits don't tick Observable's reactive graph — the
// live-read rationale above). Each drops a leading unison so parseScala's
// auto-prepended 1/1 isn't duplicated.
//
// Exact-JI serializers emit ratios (cpsScaleText idiom, drop leading "1"); tempered
// serializers emit cents-per-line (edScaleText idiom: iv.cents.toFixed(4), drop the
// leading 0¢ unison). The CONDITIONAL widgets (rank-2, free-text) branch on the
// widget's LIVE isTempered() so a pure tuning serializes ratios and a tempered tuning
// serializes cents — never laundering a temperament as exact JI (T-07-15 / SURF-06).

/** Exact-JI ratio-per-line serialization (drop a leading 1/1). */
function ratioPerLine(scale) {
  let ivs = scale.intervals;
  if (ivs.length > 0 && ivs[0].toString() === "1") ivs = ivs.slice(1);
  return ivs.map((iv) => iv.toString()).join("\n");
}

/** Tempered cents-per-line serialization (drop a leading 0¢ unison). */
function centsPerLine(scale) {
  let ivs = scale.intervals;
  if (ivs.length > 0 && Math.abs(ivs[0].cents) < 1e-6) ivs = ivs.slice(1);
  return ivs.map((iv) => iv.cents.toFixed(4)).join("\n");
}

// Rank-2 (GEN-06) — CONDITIONAL: tempered → cents-per-line; pure → ratio-per-line.
function rank2ScaleText() {
  const scale = rank2Widget.getScale();
  if (!scale) return seedText;
  return rank2Widget.isTempered() ? centsPerLine(scale) : ratioPerLine(scale);
}
// Well-temperament (GEN-07) — ALWAYS tempered: cents-per-line (T-07-15 / SURF-06).
function welltempScaleText() {
  const scale = welltempWidget.getScale();
  if (!scale) return seedText;
  return centsPerLine(scale);
}
// Fokker periodicity block (GEN-08) — EXACT JI: ratio-per-line, never cents.
function fokkerScaleText() {
  const scale = fokkerWidget.getScale();
  if (!scale) return seedText;
  return ratioPerLine(scale);
}
// Free-text SonicWeave (GEN-09) — CONDITIONAL: tempered → cents-per-line; JI → ratios.
function sonicweaveScaleText() {
  const scale = sonicweaveWidget.getScale();
  if (!scale) return seedText;
  return sonicweaveWidget.isTempered() ? centsPerLine(scale) : ratioPerLine(scale);
}
// Wilson recurrence / metallic Mt. Meru (GEN-10) — EXACT JI: ratio-per-line, never
// cents (isTempered() is ALWAYS false; the irrational metallic limit is a separate
// readout, NOT a scale degree). Same drop-leading-1/1 convention as the other exact-JI
// serializers.
function meruScaleText() {
  const scale = meruWidget.getScale();
  if (!scale) return seedText;
  return ratioPerLine(scale);
}
// Constant structure (GEN-10) — CONDITIONAL on the adapter's live isTempered() flag:
// tempered → cents-per-line; exact JI (the normal csgs case) → ratio-per-line. Mirrors
// the rank-2 / free-text conditional precedent so a tempered result is never laundered
// as exact JI (SURF-06).
function csScaleText() {
  const scale = csWidget.getScale();
  if (!scale) return seedText;
  return csWidget.isTempered() ? centsPerLine(scale) : ratioPerLine(scale);
}
const currentScaleText =
  method === "harmonic-segment"
    ? harmonicScaleText()
    : method === "cps"
      ? cpsScaleText()
      : method === "ji-set"
        ? jiSetScaleText()
        : method === "ed"
          ? edScaleText()
          : method === "rank2"
            ? rank2ScaleText()
            : method === "welltemp"
              ? welltempScaleText()
              : method === "fokker"
                ? fokkerScaleText()
                : method === "sonicweave"
                  ? sonicweaveScaleText()
                  : method === "meru"
                    ? meruScaleText()
                    : method === "cs"
                      ? csScaleText()
                      : seedText;
```

```ts
// Parse the current scale text into a Scale (the fungible value scaleTable /
// playScale / encodeScaleToHash all consume). Parse errors surface in the
// preview host status region rather than throwing the cell.
let currentScale = null;
let currentScaleError = null;
try {
  currentScale = new Scale(parseScala(currentScaleText));
} catch (e) {
  currentScaleError = e instanceof Error ? e.message : String(e);
}
```

```ts
// ─── Params-host swap (D-05) ─────────────────────────────────────────────────
// Re-render via replaceChildren only. All text via createElement +
// textContent. Harmonic family → the full generateHarmonic widget; CPS → the
// generateCps widget; a placeholder family → the "coming soon" caption; nothing
// picked → the empty-state prompt.
{
  if (method === "harmonic-segment") {
    // Mount the harmonic-family widget (GEN-02, GEN-03). It owns its sub-method
    // select + per-sub-method params AND renders its own scaleTable + ⏵⏵ Play, so
    // for this branch the shared previewHost shows only a pointer caption (the
    // preview-host swap below). Mounting the persistent `harmonicWidget` element
    // preserves its closure-local state across picker swaps. D-08: harmonic
    // segment is the widget's default sub-method (8..16, D-09) and the page's
    // default landing method.
    paramsHost.replaceChildren(harmonicWidget);
  } else if (method === "cps") {
    // Mount the CPS widget (GEN-01). It owns its own factor-chip + preset form
    // AND renders its own scaleTable + ⏵⏵ Play internally, so for the CPS branch
    // the shared previewHost shows only a short caption (the preview-host swap
    // below). Mounting the persistent `cpsWidget` element preserves its state.
    paramsHost.replaceChildren(cpsWidget);
  } else if (method === "ji-set") {
    // Mount the JI-set widget (GEN-04). It owns its sub-method select + limit/order
    // input AND renders its own EXACT-JI scaleTable + ⏵⏵ Play, so the shared
    // previewHost shows only a pointer caption. The persistent `jiSetWidget` element
    // preserves its closure-local state across picker swaps.
    paramsHost.replaceChildren(jiSetWidget);
  } else if (method === "ed") {
    // Mount the ED widget (GEN-05, SURF-06). It owns its sub-method select + params
    // AND renders its own TEMPERED scaleTable (cents-only + badge) + ⏵⏵ Play, so the
    // shared previewHost shows only a pointer caption. The persistent `edWidget`
    // element preserves its closure-local state across picker swaps.
    paramsHost.replaceChildren(edWidget);
  } else if (method === "rank2") {
    // Mount the rank-2 widget (GEN-06). It owns its preset + tuning + generator +
    // up/down controls AND renders its own scaleTable (conditionally tempered) +
    // ⏵⏵ Play, so the shared previewHost shows only a pointer caption. The persistent
    // `rank2Widget` element preserves its closure-local state across picker swaps.
    paramsHost.replaceChildren(rank2Widget);
  } else if (method === "welltemp") {
    // Mount the well-temperament widget (GEN-07). It owns its preset + per-fifth
    // comma-fraction controls AND renders its own TEMPERED scaleTable (cents-only +
    // badge) + ⏵⏵ Play, so the shared previewHost shows only a pointer caption. The
    // persistent `welltempWidget` element preserves its closure-local state.
    paramsHost.replaceChildren(welltempWidget);
  } else if (method === "fokker") {
    // Mount the Fokker periodicity-block widget (GEN-08). It owns its mode (basis ↔
    // comma) + basis/extents/comma controls AND renders its own EXACT-JI scaleTable +
    // ⏵⏵ Play, so the shared previewHost shows only a pointer caption. The persistent
    // `fokkerWidget` element preserves its closure-local state across picker swaps.
    paramsHost.replaceChildren(fokkerWidget);
  } else if (method === "sonicweave") {
    // Mount the free-text SonicWeave widget (GEN-09). It owns its textarea + Evaluate
    // button AND renders its own scaleTable (conditionally tempered) + ⏵⏵ Play, so the
    // shared previewHost shows only a pointer caption. The persistent `sonicweaveWidget`
    // element preserves its closure-local textarea program across picker swaps.
    paramsHost.replaceChildren(sonicweaveWidget);
  } else if (method === "meru") {
    // Mount the Wilson recurrence / metallic (Mt. Meru) widget (GEN-10). It owns its
    // preset + a/b/x₀/x₁/term-count controls AND renders its own EXACT-JI convergent
    // scaleTable + ⏵⏵ Play + the separate tempered metallic-limit readout, so the shared
    // previewHost shows only a pointer caption. The persistent `meruWidget` element
    // preserves its closure-local state across picker swaps.
    paramsHost.replaceChildren(meruWidget);
  } else if (method === "cs") {
    // Mount the constant-structure widget (GEN-10). It owns its generator-ratio chips +
    // ordinal field AND renders its own scaleTable + ⏵⏵ Play + the live CS-status readout,
    // so the shared previewHost shows only a pointer caption. The persistent `csWidget`
    // element preserves its closure-local state across picker swaps.
    paramsHost.replaceChildren(csWidget);
  } else if (method === "") {
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent = "Pick a method above to set its parameters.";
    paramsHost.replaceChildren(caption);
  } else {
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "Generator methods arrive in the next phase. A demo scale is shown below so you can try audition and Send-to.";
    paramsHost.replaceChildren(caption);
  }
}
```

```ts
// ─── Preview-host swap (D-07) ────────────────────────────────────────────────
// scaleTable (Degree/Ratio/Cents/¢-from-12tet) + playScale (⏵⏵ Play scale
// arpeggio). Reactive on method and baseHz. The CPS + harmonic branches render
// their own table inside the mounted widget, so this host shows a pointer caption
// for them; the demo-seed / placeholder branches render the shared table here. On
// parse error (should not happen for the demo seed) show the status copy. Text via
// textContent only.
{
  if (method === "cps") {
    // CPS renders its own scaleTable + ⏵⏵ Play inside the widget (mounted into
    // paramsHost above), so the shared previewHost shows only a pointer caption —
    // no duplicate table. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The CPS table and ⏵⏵ Play are shown above with the factor-set controls. Send-to serializes the current CPS scale.";
    previewHost.replaceChildren(caption);
  } else if (method === "harmonic-segment") {
    // The harmonic-family widget renders its own scaleTable + ⏵⏵ Play (mounted
    // into paramsHost above), so the shared previewHost shows only a pointer
    // caption — no duplicate table. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The table and ⏵⏵ Play are shown above with the sub-method controls. Send-to serializes the current scale.";
    previewHost.replaceChildren(caption);
  } else if (method === "ji-set") {
    // The JI-set widget renders its own exact-JI scaleTable + ⏵⏵ Play (mounted into
    // paramsHost above), so the shared previewHost shows only a pointer caption —
    // no duplicate table. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The exact-JI table and ⏵⏵ Play are shown above with the sub-method controls. Send-to serializes the current scale ratio-per-line.";
    previewHost.replaceChildren(caption);
  } else if (method === "ed") {
    // The ED widget renders its own TEMPERED scaleTable (cents-only + "tempered"
    // badge) + ⏵⏵ Play (mounted into paramsHost above), so the shared previewHost
    // shows only a pointer caption — no duplicate table. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The tempered (cents-only) table and ⏵⏵ Play are shown above with the sub-method controls. Send-to serializes the scale as cents-per-line.";
    previewHost.replaceChildren(caption);
  } else if (method === "rank2") {
    // The rank-2 widget renders its own scaleTable (exact-JI ratios when pure, tempered
    // cents-only + badge when not) + ⏵⏵ Play (mounted into paramsHost above), so the
    // shared previewHost shows only a pointer caption. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The rank-2 table and ⏵⏵ Play are shown above with the preset/tuning controls. Send-to serializes ratios for pure tunings and cents-per-line for tempered ones.";
    previewHost.replaceChildren(caption);
  } else if (method === "welltemp") {
    // The well-temperament widget renders its own TEMPERED scaleTable (cents-only +
    // badge) + ⏵⏵ Play (mounted into paramsHost above), so the shared previewHost
    // shows only a pointer caption. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The tempered (cents-only) table and ⏵⏵ Play are shown above with the preset/fifth controls. Send-to serializes the scale as cents-per-line.";
    previewHost.replaceChildren(caption);
  } else if (method === "fokker") {
    // The Fokker widget renders its own EXACT-JI scaleTable + ⏵⏵ Play and the live
    // "→ N notes" readout (mounted into paramsHost above), so the shared previewHost
    // shows only a pointer caption. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The exact-JI block table and ⏵⏵ Play are shown above with the basis/comma controls. Send-to serializes the current block ratio-per-line.";
    previewHost.replaceChildren(caption);
  } else if (method === "sonicweave") {
    // The free-text SonicWeave widget renders its own scaleTable (conditionally
    // tempered) + ⏵⏵ Play (mounted into paramsHost above), so the shared previewHost
    // shows only a pointer caption. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The table and ⏵⏵ Play are shown above with the program textarea. Send-to serializes ratios for exact-JI programs and cents-per-line for tempered ones.";
    previewHost.replaceChildren(caption);
  } else if (method === "meru") {
    // The Wilson recurrence / metallic (Mt. Meru) widget renders its own EXACT-JI
    // convergent scaleTable + ⏵⏵ Play + the separate tempered metallic-limit (φ ≈ 833.1¢)
    // readout (mounted into paramsHost above), so the shared previewHost shows only a
    // pointer caption. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The exact-JI convergent table, the metallic-limit readout, and ⏵⏵ Play are shown above with the preset/term controls. Send-to serializes the convergents ratio-per-line.";
    previewHost.replaceChildren(caption);
  } else if (method === "cs") {
    // The constant-structure widget renders its own scaleTable + ⏵⏵ Play + the live
    // CS-status readout (mounted into paramsHost above), so the shared previewHost shows
    // only a pointer caption. Text via textContent only.
    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "The constant-structure table, the ✓ CS-status readout, and ⏵⏵ Play are shown above with the generator/ordinal controls. Send-to serializes the scale ratio-per-line.";
    previewHost.replaceChildren(caption);
  } else if (currentScaleError) {
    const div = document.createElement("div");
    div.setAttribute("role", "status");
    div.setAttribute("aria-live", "polite");
    div.className = "dashboard-error";
    div.textContent = `Couldn't build scale: ${currentScaleError}`;
    previewHost.replaceChildren(div);
  } else if (currentScale) {
    previewHost.replaceChildren(
      scaleTable(currentScale, baseHz),
      playScale(currentScale, synth, { baseHz }),
    );
  } else {
    const div = document.createElement("div");
    div.setAttribute("role", "status");
    div.setAttribute("aria-live", "polite");
    div.className = "dashboard-helper";
    div.textContent = "No scale yet. Pick a method to generate one.";
    previewHost.replaceChildren(div);
  }
}
```

## Shared preview

```ts
// Shared-preview host — the FIRST cross-widget consumer (SURF-04 + SURF-05). The
// circle-of-pitches viz + the rotate/reduce/dedupe/transpose strip + the TRANSFORMED
// scale table mount ONCE here and apply uniformly to EVERY generator family's output
// (success criterion 4). The raw per-widget table stays in paramsHost (D-06 — the
// widget owns its own table); this shared area shows the TRANSFORMED scale that Send-to
// serializes (D-06 / SURF-06). display() returns the live element for replaceChildren
// swaps; text via textContent only.
const sharedHelper = (() => {
  const p = document.createElement("p");
  p.className = "dashboard-helper";
  p.textContent =
    "Shared preview — applies a non-destructive transform (mode / reduce / dedupe / transpose) to whatever the active method produces. The transformed scale is what Send-to serializes.";
  return p;
})();
display(sharedHelper);
const sharedPreviewHost = display(document.createElement("div"));
sharedPreviewHost.className = "generate-host generate-host--shared";
```

```ts
// Transform strip — instantiated ONCE (Pattern-2 closure-local mode/transpose state
// survives method/baseHz re-renders, like the persistent widget elements above). The
// strip's baseHz opt is reserved for downstream wiring only, so this cell intentionally
// does NOT depend on the reactive baseHz — re-instantiating on every reference-pitch
// edit would wipe the user's chosen mode/transpose. The live baseHz is forwarded to the
// circle + transformed table in the render callback below instead. display() mounts the
// strip's own controls; the circle + transformed table render beneath it.
const transformStrip = scaleTransformStrip({});
display(transformStrip);
```

```ts
// Holds the current paramsHost re-sync listener so the shared-preview wiring cell can
// detach the prior one before attaching a fresh (current-method) handler — preventing a
// stale-method handler from re-feeding the wrong widget after a picker swap. Plain object
// (NOT a Mutable — Mutable.value is only writable in its declaring cell): shared by
// reference across cells and mutated in place.
const sharedResyncRef = { current: null as (() => void) | null };
```

```ts
// Shared live-read of the active widget's scale + tempered flag (D-03/D-06). Defined at
// top level so BOTH the shared-preview wiring (below) AND the Send-to handlers can call
// it. Reading getScale()/isTempered() LIVE at call time is what reflects widget-INTERNAL
// param edits (e.g. changing EDO divisions), which do NOT tick Observable's reactive
// graph — the documented live-read rationale (lines ~283–296). Null scale → fall back to
// the parsed seed/currentScale so consumers always have something to serialize/show.
function activeWidgetScale() {
  let scale = null;
  let tempered = false;
  if (method === "cps") scale = cpsWidget.getScale();
  else if (method === "harmonic-segment") scale = harmonicWidget.getScale();
  else if (method === "ji-set") scale = jiSetWidget.getScale();
  else if (method === "ed") { scale = edWidget.getScale(); tempered = edWidget.isTempered(); }
  else if (method === "rank2") { scale = rank2Widget.getScale(); tempered = rank2Widget.isTempered(); }
  else if (method === "welltemp") { scale = welltempWidget.getScale(); tempered = welltempWidget.isTempered(); }
  else if (method === "fokker") { scale = fokkerWidget.getScale(); tempered = fokkerWidget.isTempered(); }
  else if (method === "sonicweave") { scale = sonicweaveWidget.getScale(); tempered = sonicweaveWidget.isTempered(); }
  else if (method === "meru") { scale = meruWidget.getScale(); tempered = meruWidget.isTempered(); }
  else if (method === "cs") { scale = csWidget.getScale(); tempered = csWidget.isTempered(); }
  if (!scale) scale = currentScale; // parsed seed/demo fallback (may still be null on parse error)
  return { scale, tempered };
}
```

```ts
// ─── Shared-preview reactive wiring (RESEARCH Open Q1 — the first cross-widget
// consumer) ───────────────────────────────────────────────────────────────────
// This cell re-runs on `method` and `baseHz` change. It (1) reads the ACTIVE widget's
// scale LIVE via the shared activeWidgetScale() helper above, (2) re-binds the strip's
// onChange to a render closure that captures the CURRENT baseHz, then (3) calls
// setSource — which itself fires onChange, painting the shared circle + transformed
// table immediately. The additive onChange/Mutable approach (Pitfall 6 / Q1
// recommendation), no kernel or widget change. A widget-INTERNAL param edit does not
// re-run this cell (the documented Open-Q1 limit — the shared circle refreshes on method
// switch and on Send); Send-to itself re-syncs the strip from activeWidgetScale() at
// click time so the serialized scale is never stale. Text via textContent only.
{
  // Render the shared circle + transformed scaleTable from the strip's transformed
  // output. Re-bound every run so it captures the current reactive baseHz. The circle's
  // own empty-state covers unison-only / octave-only scales (Plan 02 D-17). The
  // transformed table reuses scaleTable verbatim with the tempered flag carried through
  // the strip (D-06 / SURF-06 — tempered stays cents-only, never laundered as JI).
  function renderShared(tScale, tTempered) {
    if (!tScale) {
      const div = document.createElement("div");
      div.setAttribute("role", "status");
      div.setAttribute("aria-live", "polite");
      div.className = "dashboard-helper";
      div.textContent = "No scale yet. Pick a method to generate one.";
      sharedPreviewHost.replaceChildren(div);
      return;
    }
    sharedPreviewHost.replaceChildren(
      circleOfPitches(tScale, synth, { baseHz, tempered: tTempered }),
      scaleTable(tScale, baseHz, { tempered: tTempered }),
    );
  }

  // Bind onChange ONCE per run (re-binding replaces the single stored callback — fine).
  // It paints the shared host on every strip change (setSource + each transform control).
  transformStrip.onChange((tScale, tTempered) => {
    renderShared(tScale, tTempered);
  });

  // Feed the active widget's scale into the strip — setSource fires onChange, which
  // renders the shared preview immediately (and on every strip control change after).
  const active = activeWidgetScale();
  if (active.scale) {
    transformStrip.setSource(active.scale, active.tempered);
  } else {
    renderShared(null, false); // empty-state (parse error / nothing picked)
  }

  // ─── Live shared-preview reactivity (Open-Q1 resolution) ──────────────────
  // Widget-INTERNAL param edits (e.g. EDO divisions) bubble `input`/`change` events to
  // paramsHost but do NOT tick Observable's reactive graph, so this cell won't re-run and
  // the strip would otherwise hold a stale source (the bug: preview shows 12-EDO after
  // typing 24). A delegated listener on paramsHost re-feeds the strip from the LIVE active
  // widget on every such edit, so the shared circle + transformed table follow the widget
  // in real time AND Send-to (which reads the strip) serializes the current scale. The
  // listener is re-created per run, bound to THIS run's method via activeWidgetScale; the
  // prior one is detached first so a stale-method handler never re-feeds the wrong widget.
  const priorResync = sharedResyncRef.current;
  if (priorResync) {
    paramsHost.removeEventListener("input", priorResync);
    paramsHost.removeEventListener("change", priorResync);
  }
  const resync = () => {
    const live = activeWidgetScale();
    if (live.scale) transformStrip.setSource(live.scale, live.tempered);
  };
  sharedResyncRef.current = resync;
  paramsHost.addEventListener("input", resync);
  paramsHost.addEventListener("change", resync);
}
```

```ts
// Send-to status region — surfaces the 8 KB cap-error copy on encode failure
// (T-05-02). role="status" aria-live="polite"; text via textContent only.
// display() returns the live element so the handlers below can write into it.
const sendStatus = display(document.createElement("div"));
sendStatus.setAttribute("role", "status");
sendStatus.setAttribute("aria-live", "polite");
```

```ts
// ─── Send-to action row (D-10 / D-11) — the ONLY store writers ───────────────
// Two .play-btn CTAs that each: (1) write the current scale to the shared store
// — the SOLE store write (one-way data flow per D-11) — then (2) navigate to the
// target with #s= + encodeScaleToHash, mirroring index.md's "Analyze this scale →"
// precedent (lines 202–218). On encodeScaleToHash RangeError (> 8 KB) surface the
// cap-error copy into sendStatus and navigate WITHOUT the hash (the target loads
// its own seed). From /pages/generate the Dashboard is "../" and Analysis is
// "./analysis" (verified against rendered routes — links validated at build).
//
// This cell depends on currentScaleText so the handlers always close over the
// latest previewed scale. Re-creating the buttons on param change is the
// reactive idiom (the precedent button is static because the dashboard's
// scaleText is read at click time via a Mutable; here the value is a cell).
const CAP_ERROR_COPY =
  "Scale is too large to send (8 KB limit). Reduce the number of pitches and try again.";
// Derive the store-write source label from the active method so the shared store
// records WHICH generator produced the scale (informative provenance, D-11).
const SEND_SOURCE = `generate:${method || "demo"}`;

function clearSendStatus() {
  sendStatus.className = "";
  sendStatus.replaceChildren();
}

function showCapError() {
  sendStatus.className = "dashboard-error";
  sendStatus.replaceChildren(document.createTextNode(CAP_ERROR_COPY));
}

// Raw per-method serialization (the pre-transform fallback). Used ONLY when the
// shared transform strip has no transformed scale yet (e.g. the seed/demo path with no
// active widget). Each branch reads the widget LIVE at click time (widget-internal edits
// don't tick Observable's reactive graph, so currentScaleText may be stale).
function rawMethodScaleText() {
  return method === "cps"
    ? cpsScaleText()
    : method === "harmonic-segment"
      ? harmonicScaleText()
      : method === "ji-set"
        ? jiSetScaleText()
        : method === "ed"
          ? edScaleText() // D-03: tempered → cents-per-line (SURF-06).
          : method === "rank2"
            ? rank2ScaleText() // CONDITIONAL: ratios (pure) or cents (tempered).
            : method === "welltemp"
              ? welltempScaleText() // ALWAYS tempered → cents-per-line (SURF-06).
              : method === "fokker"
                ? fokkerScaleText() // EXACT JI → ratio-per-line.
                : method === "sonicweave"
                  ? sonicweaveScaleText() // CONDITIONAL: ratios (JI) or cents (tempered).
                  : method === "meru"
                    ? meruScaleText() // EXACT JI → ratio-per-line (convergents).
                    : method === "cs"
                      ? csScaleText() // CONDITIONAL: ratios (JI) or cents (tempered).
                      : currentScaleText;
}

// Shared click behavior for both CTAs: write the store ONCE (the sole writer,
// D-11) then deep-link-navigate with #s=; on > 8 KB RangeError surface the
// cap-error copy and navigate hashless. `target` is the relative route from
// /pages/generate ("../" = Dashboard, "./analysis" = Analysis).
//
// D-06 / SURF-06 — Send-to serializes the TRANSFORMED scale (the strip's
// getTransformedScale()), NOT the raw generator output: the mode/reduce/dedupe/transpose
// the user applied in the shared preview is what round-trips. The handler re-syncs the
// strip from the LIVE active widget at click time (below), so the click-time
// getTransformedScale() always reflects the current generator output. The
// strip's getTempered() (propagated from the active widget's isTempered() through every
// transform, D-18) gates the serialization: tempered → centsPerLine (never ratios —
// no laundered temperament, T-08-13), exact JI → ratioPerLine. If the strip has no
// transformed scale (seed/demo with no active widget), fall back to the raw per-method
// serialization.
function sendCurrentScaleTo(target) {
  // Re-sync the strip from the LIVE active widget before serializing. Widget-internal
  // param edits (e.g. changing EDO divisions) do NOT tick Observable's reactive graph,
  // so the strip can hold a stale source — sending the wrong/default scale (Open-Q1).
  // setSource re-derives the transformed scale from the latest generator output while
  // PRESERVING the user's transform state (mode/reduce/dedupe/transpose held in the strip
  // closure), so the transform the user applied still round-trips.
  const live = activeWidgetScale();
  if (live.scale) transformStrip.setSource(live.scale, live.tempered);
  const transformed = transformStrip.getTransformedScale();
  const scaleText = transformed
    ? (transformStrip.getTempered() ? centsPerLine(transformed) : ratioPerLine(transformed))
    : rawMethodScaleText();
  writeSharedScale(scaleText, SEND_SOURCE); // each handler invokes this exactly once
  try {
    const hash = "#s=" + encodeScaleToHash(scaleText);
    clearSendStatus();
    window.location.assign(target + hash);
  } catch (err) {
    console.warn("encodeScaleToHash failed:", err);
    showCapError();
    window.location.assign(target); // fallback: target loads its own seed
  }
}

const sendToDashboard = document.createElement("button");
sendToDashboard.className = "play-btn";
sendToDashboard.type = "button";
sendToDashboard.textContent = "Send to Dashboard →";
sendToDashboard.setAttribute("aria-label", "Send the current scale to the Dashboard and open it.");
sendToDashboard.addEventListener("click", () => sendCurrentScaleTo("../")); // Dashboard is "/"

const sendToAnalysis = document.createElement("button");
sendToAnalysis.className = "play-btn";
sendToAnalysis.type = "button";
sendToAnalysis.textContent = "Send to Analysis →";
sendToAnalysis.setAttribute("aria-label", "Send the current scale to the Analysis page and open it.");
sendToAnalysis.addEventListener("click", () => sendCurrentScaleTo("./analysis")); // /pages/analysis

const actionRow = document.createElement("div");
actionRow.className = "generate-actions";
actionRow.append(sendToDashboard, sendToAnalysis);
display(actionRow);
```

```ts
// Floating Stop button — visible only when synth.activeVoices > 0 (driven by the
// activeVoices polling in the synth cell above). Esc keyboard shortcut is bound
// globally in the synth cell (Pitfall #11). Copied verbatim from analysis.md
// lines 191–200.
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
