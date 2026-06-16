# Analysis

EDO ↔ JI mapping, MOS construction, and side-by-side scale comparison.

```ts
import { Interval } from "../lib/interval.js";
import { Scale } from "../lib/scale.js";
import { parseScala } from "../lib/scala.js";
import { createSynth } from "../audio/synth.js";
import { encodeScaleToHash, decodeHashToScale } from "../lib/url.js";
import { edoJitTable } from "../components/edo-jit-table.js";
import { edoJiTable } from "../components/edo-ji-table.js";
import { mosBuilder } from "../components/mos-builder.js";
import { scaleCompare, disposeScaleCompare } from "../components/scale-compare.js";
import { readSharedScale, resolveInitialScaleText, SCALE_CHANGED_EVENT } from "../state/scale-store.js";
```

```ts
// Synth cell — owns the AudioContext for this page (Pattern 4 / Pitfall #2).
// MUST NOT depend on any other cell, otherwise edits to the scale text would
// tear down the AudioContext on every keystroke. The lazy createSynth() does
// not create the context until the first playNote / startDrone call.
//
// Phase 3 D-15/D-16 + Phase 4 D-34: Esc keydown + activeVoices polling are
// bound HERE (Pitfall #11) so they don't re-bind on every textarea edit.
// invalidation.then() consolidates all cleanups in one place. This synth is
// independent of the dashboard's synth — separate page = separate AudioContext.
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
// Default seed scale per CONTEXT line 204 — same 7-limit JI heptatonic as the
// dashboard. The template literal MUST start at column 0 so leading whitespace
// is NOT preserved inside the parsed scale text (parseScala rejects whitespace
// inside ratio tokens).
const seedText = `9/8
5/4
21/16
3/2
27/16
7/4
2/1`;
```

```ts
// Hash-read at boot — runs ONCE before the textarea cell. Reads
// window.location.hash (which starts with "#"); strips the "#s=" prefix;
// decodes via decodeHashToScale. On success, the decoded text becomes the
// textarea's initial value (D-19 silent override — no banner). On null
// (malformed/oversized/empty), fall back to the seed text and post a
// status-region message per D-20. The malformed hash is NOT cleared — user
// can copy for debugging.
const hashRaw = typeof window !== "undefined" && window.location.hash.startsWith("#s=")
  ? window.location.hash.slice(3)
  : "";
const hashDecoded = hashRaw ? decodeHashToScale(hashRaw) : null;
const hashError = (hashRaw && hashDecoded === null)
  ? "Couldn't load shared scale: malformed or oversized hash. Falling back to default."
  : null;
// Phase 5 SYNC-04 (D-12): boot precedence now hash > shared store > seed via
// resolveInitialScaleText. Here `seedText` (above) IS the literal. When the store
// is empty readSharedScale() returns null and this is byte-identical to
// `hashDecoded ?? seedText` (R1 empty-store invariant).
const initialScaleText = resolveInitialScaleText(hashDecoded, readSharedScale(), seedText);
```

```ts
// Status region for hash-decode failure (D-20). Renders ONLY when hashError is
// truthy. Uses createElement + textContent (NEVER innerHTML) — defense-in-depth
// even though the message is hardcoded, per T-04-33.
if (hashError) {
  const div = document.createElement("div");
  div.setAttribute("role", "status");
  div.setAttribute("aria-live", "polite");
  div.className = "dashboard-error";
  div.textContent = hashError; // T-04-13: textContent NEVER innerHTML
  display(div);
}
```

```ts
// Phase 5 SYNC-01/02: split the inline textarea into a captured element + view
// pair so the live-receive listener cell below can reach the element. The
// reactive `scaleText` value flows IDENTICALLY to before — same Inputs.textarea
// options (value/rows/label/submit), the only change is capturing `scaleInput`.
const scaleInput = Inputs.textarea({
  value: initialScaleText,
  rows: 8,
  label: "Scale (one pitch per line — ratio, cents, or monzo)",
  submit: false,
});
const scaleText = view(scaleInput);
```

```ts
// Phase 5 SYNC-01/02: additive live-receive listener (consumer). On a
// scale-changed broadcast from the Generate page, write the pushed text into the
// textarea and dispatch a synthetic `input` event so the page's UNCHANGED parse +
// debounced hash-write fire exactly as if the user typed it. ONE-WAY DATA FLOW
// (R2 guard): this cell writes ONLY the textarea — it NEVER writes the store, so
// there is no scale-changed feedback loop.
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

<p class="dashboard-helper">Last line is the period. 1/1 is added automatically.</p>

<p class="dashboard-helper" style="font-size:0.9em;color:var(--theme-foreground-muted);">The "last line is the period, 1/1 implicit" convention follows the Scala <code>.scl</code> spec (Huygens-Fokker, "Scala scale file format").</p>

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
// Parse-error display: createElement + textContent (T-04-34 defense-in-depth).
// Although the dashboard uses htl html`...${parseError}...` (htl auto-escapes
// interpolations), plain textContent is even safer.
if (parseError) {
  const div = document.createElement("div");
  div.className = "dashboard-error";
  const strong = document.createElement("strong");
  strong.textContent = "Couldn't parse: ";
  div.appendChild(strong);
  div.appendChild(document.createTextNode(parseError)); // textContent for the dynamic part
  display(div);
}
```

```ts
const baseHz = view(Inputs.number({ value: 440, step: 0.01, label: "Reference pitch (Hz)" }));
```

```ts
// Hash-write — debounced 300ms (D-17 / D-26). Runs whenever scaleText changes.
// Uses history.replaceState (NOT pushState) so back-button history stays clean
// per D-17 invariant. On over-cap (> 8 KB) encodeScaleToHash returns null and we
// skip the update (no UI surfacing for the analysis page; the URL just stops
// auto-updating until the scale shrinks). T-04-40 mitigation.
{
  let timer = null;
  const flush = () => {
    const encoded = encodeScaleToHash(scaleText);
    if (encoded !== null) history.replaceState(null, "", "#s=" + encoded);
  };
  clearTimeout(timer);
  timer = setTimeout(flush, 300);
  invalidation.then(() => clearTimeout(timer));
}
```

## Best-fit EDOs (scale → EDO)

```ts
if (scale) display(edoJitTable(scale, synth, { baseHz }));
```

## JI in N-EDO

```ts
const edoSteps = view(Inputs.number({ value: 12, min: 1, max: 1000, step: 1, label: "EDO" }));
```

```ts
if (synth) display(edoJiTable(edoSteps, synth, { baseHz }));
```

## MOS construction

```ts
display(mosBuilder(synth, { baseHz }));
```

## Compare scales

```ts
if (scale) {
  const cmpEl = scaleCompare(scale, synth, { baseHz });
  display(cmpEl);
  // Plan 04-06 CR-02 hand-off: drop pending B-note setTimeouts on cell teardown
  // and remove the component-local Esc keydown listener. Without this, a stale
  // setTimeout could fire a B-note after the user has already navigated away
  // and disposed the synth.
  invalidation.then(() => disposeScaleCompare(cmpEl));
}
```

```ts
// Floating Stop button — visible only when synth.activeVoices > 0 (driven by
// the activeVoices polling in the synth cell above). Esc keyboard shortcut is
// bound globally in the synth cell (Pitfall #11). D-16.
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

Read: [the dashboard ←](../) | [the syntonic comma →](syntonic-comma)

## Sources

- Huygens-Fokker Foundation. n.d. "Scala scale file format." Accessed 2026-05-13. https://www.huygens-fokker.org/scala/scl_format.html.
