# Tuning Systems

A scale-design workspace. Type a scale, hear it, export it.

<div class="card" style="margin-block: 24px;">
  <p>This is a research notebook for designing just-intonation scales. Build a scale here, audition it, and export it as <code>.scl</code>/<code>.kbm</code>. The <a href="./pages/analysis">Analysis</a> page maps it to EDOs, builds MOS scales, and compares scales side-by-side. The <a href="./pages/syntonic-comma">Theory notes</a> are short essays on intervals and commas.</p>
  <p style="margin-block-end: 0;"><strong>You are here:</strong> Dashboard · <a href="./pages/analysis">Analysis</a> · <a href="./pages/syntonic-comma">Theory: the syntonic comma</a></p>
</div>

```ts
import { Interval } from "./lib/interval.js";
import { Scale } from "./lib/scale.js";
import { parseScala } from "./lib/scala.js";
import { createSynth } from "./audio/synth.js";
import { scaleTable } from "./components/scale-table.js";
import { audioPanel } from "./components/audio-panel.js";
import { sclIo } from "./components/scl-io.js";
import { lattice } from "./components/lattice.js";
import { tonalityDiamond } from "./components/tonality-diamond.js";
import { keyboard } from "./components/keyboard.js";
import { kbmToFrequencies, type KbmMapping } from "./lib/kbm.js";
import { encodeScaleToHash, decodeHashToScale } from "./lib/url.js";
```

```ts
// Synth cell — owns the AudioContext for this page (Pattern 4 / Pitfall #2).
// MUST NOT depend on any other cell, otherwise edits to the scale text would
// tear down the AudioContext on every keystroke. The lazy createSynth() does
// not create the context until the first playNote / startDrone call.
//
// Phase 3: Esc keydown + activeVoices polling are bound HERE (Pitfall #11) so
// they don't re-bind on every textarea edit. invalidation.then() consolidates
// all cleanups in one place.
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
// Phase 4 ANAL-04 (D-19): hash-read at boot. When `#s=...` decodes successfully,
// it overrides the seed scale silently (no banner). Malformed hash falls back to
// the seed and surfaces a status-region message via the `dashboardHashError` cell
// below per D-20 (the malformed hash is NOT cleared — user can copy for debugging).
const hashRaw = typeof window !== "undefined" && window.location.hash.startsWith("#s=")
  ? window.location.hash.slice(3)
  : "";
const hashDecoded = hashRaw ? decodeHashToScale(hashRaw) : null;
const dashboardHashError = (hashRaw && hashDecoded === null)
  ? "Couldn't load shared scale: malformed or oversized hash. Falling back to default."
  : null;
```

```ts
// Seed scale per D-02 — 7-limit JI heptatonic, baked in as a constant. 1/1 is
// auto-prepended by parseScala (D-13) so we list only non-unison pitches; the
// last line is the period (D-14).
const seedTextLiteral = `9/8
5/4
21/16
3/2
27/16
7/4
2/1`;
```

```ts
// Phase 4 ANAL-04 (D-19): defer to hash-decoded value when present; else use the
// literal seed. Downstream textarea cell reads `seedText` unchanged from Phase 2.
const seedText = hashDecoded ?? seedTextLiteral;
```

## Scale

```ts
const scaleText = view(Inputs.textarea({
  value: seedText,
  rows: 8,
  label: "Scale (one pitch per line — ratio, cents, or monzo)",
  submit: false,
}));
```

<p class="dashboard-helper">Last line is the period. 1/1 is added automatically.</p>

```ts
let scale = null;
let parseError = null;
try {
  scale = new Scale(parseScala(scaleText));
} catch (e) {
  parseError = e instanceof Error ? e.message : String(e);
}
```

```ts
const baseHz = view(Inputs.number({
  value: 440,
  step: 0.01,
  label: "Reference pitch (Hz)",
}));
```

```ts
if (parseError) {
  display(html`<div class="dashboard-error">Couldn't parse: ${parseError}</div>`);
} else if (scale) {
  display(scaleTable(scale, baseHz, { copyButton: true }));
}
```

```ts
// Phase 4 ANAL-04 (D-20): status region for hash-decode failure. Hardcoded
// message string; createElement + textContent (NEVER innerHTML) per T-04-13.
if (dashboardHashError) {
  const div = document.createElement("div");
  div.setAttribute("role", "status");
  div.setAttribute("aria-live", "polite");
  div.className = "dashboard-error";
  div.textContent = dashboardHashError;
  display(div);
}
```

```ts
// Phase 4 ANAL-04 (D-17 / D-26): debounced 300ms hash-write. replaceState (NOT
// pushState) so back-button history stays clean. Encoder caps at 8 KB (Plan 04-03);
// RangeError → console.warn + skip (no UI surfacing for the dashboard — the URL
// just doesn't update for huge inputs). T-04-40 mitigation.
{
  let timer = null;
  const flush = () => {
    try {
      const hash = "#s=" + encodeScaleToHash(scaleText);
      history.replaceState(null, "", hash);
    } catch (err) {
      console.warn("encodeScaleToHash failed:", err);
    }
  };
  clearTimeout(timer);
  timer = setTimeout(flush, 300);
  invalidation.then(() => clearTimeout(timer));
}
```

```ts
// Phase 3 (D-11/D-13): imported .kbm state lives at the page level. sclIo's
// onImportKbm callback writes here; useBaseHzOverride toggle and effectiveBaseHz
// derivation read from here.
const importedKbm = Mutable(null);
```

```ts
// Phase 3 (D-13): "Use baseHz instead" toggle surfaces only after a .kbm has
// been imported. Default OFF = use the imported .kbm.
const useBaseHzOverride = importedKbm
  ? view(Inputs.toggle({ label: "Use baseHz instead of imported .kbm", value: false }))
  : false;
```

```ts
// Phase 3 (D-13/D-24): single source of truth for the audition reference Hz.
// When a .kbm is imported and the override is OFF, derive Hz of 1/1 from the
// kbm's middleNote via kbmToFrequencies (Plan 02 — single math path; no inline
// Math.pow re-implementation here). Otherwise fall back to the user's baseHz.
const effectiveBaseHz = (importedKbm && !useBaseHzOverride)
  ? (kbmToFrequencies(scale, importedKbm).get(importedKbm.middleNote) ?? baseHz)
  : baseHz;
```

```ts
if (scale) display(audioPanel(scale, synth, effectiveBaseHz));
```

```ts
if (scale) {
  display(sclIo(scale, {
    baseHz,
    // Phase 2 inheritance: imported scales are not yet wired back into the
    // textarea (persistence is Phase 4 ANAL-04). The status-region message in
    // sclIo is the user-visible feedback for now.
    onImport: () => {},
    // Phase 3 (D-11/D-13): kbm import path writes to the page-level Mutable,
    // which drives the override toggle visibility and effectiveBaseHz.
    onImportKbm: (kbm) => { importedKbm.value = kbm; },
  }));
}
```

```ts
// Phase 4 ANAL-04 (D-04): one-click navigation to /analysis with the current
// scale encoded into the hash. Catches encoder RangeError on > 8 KB; falls back
// to plain navigation (the analysis page will then load its own seed).
{
  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = "Analyze this scale →";
  btn.setAttribute("aria-label", "Open the analysis page seeded with the current scale.");
  btn.addEventListener("click", () => {
    try {
      const hash = "#s=" + encodeScaleToHash(scaleText);
      window.location.assign("./pages/analysis" + hash);
    } catch (err) {
      console.warn("encodeScaleToHash failed:", err);
      window.location.assign("./pages/analysis");
    }
  });
  display(btn);
}
```

## Visualize

```ts
// Phase 3 (D-01/D-02 — full-bleed vertical viz stack, document order).
if (scale) display(lattice(scale, synth, { baseHz: effectiveBaseHz }));
```

```ts
if (scale) display(tonalityDiamond(scale, synth, { baseHz: effectiveBaseHz }));
```

```ts
if (scale) display(keyboard(scale, synth, effectiveBaseHz));
```

```ts
// Phase 3 (D-16): floating Stop button, visible only when audioActive is true
// (driven by the activeVoices polling in the synth cell). Esc keyboard
// shortcut is bound globally in the synth cell (Pitfall #11).
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

Read: [the syntonic comma →](pages/syntonic-comma)
