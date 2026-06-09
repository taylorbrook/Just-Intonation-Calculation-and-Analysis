# Generate

Build a scale by method, audition it, then send it live to the Dashboard or Analysis.

```ts
import { Scale } from "../lib/scale.js";
import { parseScala } from "../lib/scala.js";
import { createSynth } from "../audio/synth.js";
import { scaleTable } from "../components/scale-table.js";
import { playScale } from "../components/play-scale.js";
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
    options: [{ id: "regular-placeholder", text: "(coming soon)", placeholder: true }],
  },
  {
    label: "JI combinatorial",
    options: [{ id: "ji-placeholder", text: "(coming soon)", placeholder: true }],
  },
  {
    label: "Harmonic & interval divisions",
    options: [{ id: "harmonic-segment", text: "Harmonic segment (n : n+1 : … : 2n)", placeholder: false }],
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
// Segment-size param input for the reference (harmonic-segment) method. Created
// ONCE here so its reactive value survives mount/unmount into paramsHost. A
// single integer param n produces the segment n : n+1 : … : 2n, making "preview
// updates as params change" trivially true (D-06 / D-13). Native number input so
// view() reads valueAsNumber on the "input" event.
const segmentSizeInput = (() => {
  const input = document.createElement("input");
  input.type = "number";
  input.min = "2";
  input.max = "64";
  input.step = "1";
  input.value = "4";
  input.name = "segment-size";
  input.id = "generate-segment-size";
  input.setAttribute("aria-label", "Harmonic segment size");
  return input;
})();
```

```ts
// Reactive segment-size value (clamped at use-site). Tracked even while the
// input is detached from paramsHost — Framework's Generators.input keeps the
// listener bound to the element, not to the DOM tree.
const segmentSize = view(segmentSizeInput);
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
// ─── Compute the current scale from the picker + param ───────────────────────
// Reference method (harmonic-segment): build n : n+1 : … : 2n as exact ratios
// over n (parseScala auto-prepends 1/1; the last line 2n/n = 2/1 is the period).
// Any other selection (placeholder / nothing picked) falls back to the Phase-5
// demo seed so the preview + audition + Send-to pipeline is always exercisable.
function buildHarmonicSegmentText(n) {
  const size = Number.isFinite(n) ? Math.trunc(n) : 0;
  const clamped = Math.min(64, Math.max(2, size)); // bounded numeric input (T-05-06)
  const lines = [];
  for (let k = 1; k <= clamped; k++) {
    lines.push(`${clamped + k}/${clamped}`); // (n+1)/n … 2n/n
  }
  return lines.join("\n");
}
const currentScaleText = method === "harmonic-segment" ? buildHarmonicSegmentText(segmentSize) : seedText;
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
// textContent. Reference method → segment-size param input + caption; a
// placeholder family → the "coming soon" caption; nothing picked → the
// empty-state prompt.
{
  if (method === "harmonic-segment") {
    const field = document.createElement("div");
    field.className = "generate-field";
    const label = document.createElement("label");
    label.className = "generate-field__label";
    label.textContent = "Segment size";
    label.htmlFor = "generate-segment-size";
    field.appendChild(label);
    field.appendChild(segmentSizeInput);

    const caption = document.createElement("p");
    caption.className = "dashboard-helper";
    caption.textContent =
      "Harmonic segment n : n+1 : … : 2n over the fundamental. Change the size to re-render the preview.";

    paramsHost.replaceChildren(field, caption);
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
// arpeggio). Reactive on method, segmentSize, and baseHz. On parse error (should
// not happen for the bounded reference method or the demo seed) show the
// status copy. Text via textContent only.
{
  if (currentScaleError) {
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
