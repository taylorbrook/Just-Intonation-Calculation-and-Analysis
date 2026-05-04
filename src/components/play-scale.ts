/**
 * playScale — inline ⏵⏵ Play scale button. Arpeggiates the scale's intervals at
 * D-18 default (stepSec = 0.45s; underlying note length = stepSec × 0.95 inside
 * the synth, see Plan 05 createSynth).
 *
 * ARCHITECTURE Pattern 2 factory. Three-layer discipline: types only from
 * src/lib/ and src/audio/; SynthHandle is passed in by the caller.
 *
 * UI-SPEC: copywriting "⏵⏵ Play scale" (per UI-SPEC component inventory). No
 * "▶▶" — `⏵⏵` is U+23F5 U+23F5 typographic glyph.
 */
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";
// CSS shipped via per-page `style:` frontmatter (src/styles.css). See
// play-interval.ts for the Plan-06-deferred rationale.

export interface PlayScaleOpts {
  baseHz?: number;
  stepSec?: number;
}

export function playScale(
  scale: Scale,
  synth: SynthHandle,
  opts: PlayScaleOpts = {},
): HTMLButtonElement {
  const baseHz = opts.baseHz ?? 440; // D-08.
  const stepSec = opts.stepSec ?? 0.45; // D-18.

  const btn = document.createElement("button");
  btn.className = "play-btn play-btn--scale";
  btn.type = "button";
  btn.textContent = "⏵⏵ Play scale";
  btn.setAttribute("aria-label", `Arpeggiate ${String(scale.intervals.length)}-tone scale`);
  btn.addEventListener("click", () => {
    const freqs = scale.intervals.map((iv) => baseHz * Number(iv.fraction.valueOf()));
    synth.playArpeggio(freqs, stepSec);
  });
  return btn;
}
