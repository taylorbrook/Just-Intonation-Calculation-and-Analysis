/**
 * playInterval — inline ▶ button for theory pages. Plays [baseHz, baseHz × interval]
 * as a chord for `opts.duration` seconds (D-18 default 1.5s).
 *
 * D-07: NOT used in the dashboard (the dashboard uses audioPanel instead);
 * reserved for inline prose use on theory pages such as syntonic-comma.md.
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

export interface PlayIntervalOpts {
  baseHz?: number;
  duration?: number;
  /** When true, render `"▶ Play 5/4"` instead of just `"▶"`. Default false. */
  label?: boolean;
}

export function playInterval(
  interval: Interval,
  synth: SynthHandle,
  opts: PlayIntervalOpts = {},
): HTMLButtonElement {
  const baseHz = opts.baseHz ?? 440; // D-08: A4 = 440 Hz default.
  const dur = opts.duration ?? 1.5; // D-18.
  const showLabel = opts.label ?? false;
  const ratioStr = interval.fraction.toFraction();

  const btn = document.createElement("button");
  btn.className = "play-btn";
  btn.type = "button";
  btn.textContent = showLabel ? `▶ Play ${ratioStr}` : "▶";
  btn.setAttribute("aria-label", `Play ${ratioStr} against 1/1`);
  btn.addEventListener("click", () => {
    // baseHz × fraction is the audio-layer boundary — Number coercion is fine
    // here (Pitfall #1: cents/Hz are display/audio projections, not kernel input).
    synth.playNotes([baseHz, baseHz * Number(interval.fraction.valueOf())], dur);
  });
  return btn;
}
