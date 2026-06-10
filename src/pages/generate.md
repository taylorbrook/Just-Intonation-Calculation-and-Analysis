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
    options: [{ id: "ed", text: "EDO / equal division (ED-n)", placeholder: false }],
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
    options: [{ id: "advanced-placeholder", text: "(coming soon)", placeholder: true }],
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
const currentScaleText =
  method === "harmonic-segment"
    ? harmonicScaleText()
    : method === "cps"
      ? cpsScaleText()
      : method === "ji-set"
        ? jiSetScaleText()
        : method === "ed"
          ? edScaleText()
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

// Shared click behavior for both CTAs: write the store ONCE (the sole writer,
// D-11) then deep-link-navigate with #s=; on > 8 KB RangeError surface the
// cap-error copy and navigate hashless. `target` is the relative route from
// /pages/generate ("../" = Dashboard, "./analysis" = Analysis).
//
// For the widget branches (CPS, harmonic) we re-read the widget's scale LIVE at
// click time (the widget's internal edits don't tick Observable's reactive graph,
// so currentScaleText may be stale) — this guarantees Send-to round-trips the
// exact scale currently shown in the widget's table.
function sendCurrentScaleTo(target) {
  const scaleText =
    method === "cps"
      ? cpsScaleText()
      : method === "harmonic-segment"
        ? harmonicScaleText()
        : method === "ji-set"
          ? jiSetScaleText()
          : method === "ed"
            ? edScaleText() // D-03: tempered → cents-per-line (SURF-06).
            : currentScaleText;
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
