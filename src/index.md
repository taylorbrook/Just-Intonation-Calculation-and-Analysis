---
style: ./styles.css
---

# Tuning Systems

A scale-design workspace. Type a scale, hear it, export it.

```ts
import { Interval } from "./lib/interval.js";
import { Scale } from "./lib/scale.js";
import { parseScala } from "./lib/scala.js";
import { createSynth } from "./audio/synth.js";
import { scaleTable } from "./components/scale-table.js";
import { audioPanel } from "./components/audio-panel.js";
import { sclIo } from "./components/scl-io.js";
```

```ts
// Synth cell — owns the AudioContext for this page (Pattern 4 / Pitfall #2).
// MUST NOT depend on any other cell, otherwise edits to the scale text would
// tear down the AudioContext on every keystroke. The lazy createSynth() does
// not create the context until the first playNote / startDrone call.
const synth = createSynth();
invalidation.then(() => synth.dispose());
```

```ts
// Seed scale per D-02 — 7-limit JI heptatonic, baked in as a constant. 1/1 is
// auto-prepended by parseScala (D-13) so we list only non-unison pitches; the
// last line is the period (D-14).
const seedText = `9/8
5/4
21/16
3/2
27/16
7/4
2/1`;
```

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
if (scale) display(audioPanel(scale, synth, baseHz));
```

```ts
if (scale) {
  display(sclIo(scale, {
    onImport: () => {
      // v1: imported scales are not yet wired back into the textarea (persistence
      // is Phase 4 ANAL-04). The import success message in sclIo's status
      // region is the user-visible feedback for now.
    },
  }));
}
```

Read: [the syntonic comma →](pages/syntonic-comma)
