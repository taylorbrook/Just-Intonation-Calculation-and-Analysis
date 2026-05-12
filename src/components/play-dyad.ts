/**
 * playDyad — inline ▶ button for theory pages. Plays two intervals as a
 * SIMULTANEOUS dyad against `baseHz` for `opts.duration` seconds (D-18 default
 * 1.5s). Dyad analogue of playInterval — single chord call, two frequencies.
 *
 * D-07: NOT used in the dashboard (the dashboard uses audioPanel instead);
 * reserved for inline prose use on theory pages where two ratios need to be
 * auditioned together (e.g. comparing 5/4 and 7/4 against an absent 1/1).
 *
 * ARCHITECTURE Pattern 2: plain DOM factory `(data, ...rest, opts?) => HTMLElement`.
 * Three-layer discipline: imports types only from src/lib/ and src/audio/; never
 * imports from `sw-synth` directly (owner-allocates pattern — caller passes the
 * SynthHandle).
 *
 * UI-SPEC: real `<button type="button">`, accent color via `--theme-blue`, focus
 * ring preserved via Framework's `:focus-visible`. Glyph `▶` is typographic
 * (not emoji) — `font-variant-emoji: text` is set on `.play-btn` in CSS.
 */
import type { Interval } from "../lib/interval.js";
import type { SynthHandle } from "../audio/synth.js";
// CSS is shipped via the per-page `style:` frontmatter (src/styles.css), NOT
// via per-module `import "./*.css"` — Framework's esbuild.transform passes
// CSS imports through unchanged, so the browser would fetch them as JS modules
// and reject on Content-Type mismatch. See SUMMARY of Plan 06 (Deferred Issues).

export interface PlayDyadOpts {
  baseHz?: number;
  duration?: number;
  /** When provided, render `"▶ <label>"` instead of just `"▶"`. */
  label?: string;
}

export function playDyad(
  a: Interval,
  b: Interval,
  synth: SynthHandle,
  opts: PlayDyadOpts = {},
): HTMLButtonElement {
  const baseHz = opts.baseHz ?? 440; // D-08: A4 = 440 Hz default.
  const dur = opts.duration ?? 1.5; // D-18.
  const label = opts.label;
  const aStr = a.fraction.toFraction();
  const bStr = b.fraction.toFraction();

  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = label === undefined ? "▶" : `▶ ${label}`;
  btn.setAttribute("aria-label", `Play ${aStr} and ${bStr} together`);
  btn.addEventListener("click", () => {
    // baseHz × fraction is the audio-layer boundary — Number coercion is fine
    // here (Pitfall #1: cents/Hz are display/audio projections, not kernel input).
    // Single chord call, two frequencies — NOT playArpeggio, NOT sequential playNote.
    synth.playNotes(
      [baseHz * Number(a.fraction.valueOf()), baseHz * Number(b.fraction.valueOf())],
      dur,
    );
  });
  return btn;
}
