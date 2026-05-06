/**
 * keyboard.ts — scale-on-keyboard SVG strip viz (VIZ-03).
 *
 * Factory: keyboard(scale, synth, baseHz, opts?) => HTMLElement.
 * Linear-by-degree mapping (D-03): N scale degrees → N adjacent white keys.
 * Period boundary marker between key N-1 (period) and where the next octave
 * would start. Keys are play buttons (D-04). Single-note audition (NOT dyad —
 * RESEARCH Open Question 3); keyboard does NOT expose opts.audition.
 *
 * pointerdown → synth.playNote returns a release callback we hold; pointerup,
 * pointerleave, pointercancel ALL release. aria-pressed mirrors the held state.
 * Keyboard accessibility: each key tabindex=0 + role=button + Enter/Space audition
 * (fixed-duration note via synth.playNote, no held-release semantics for keyboard
 * activation since there's no Enter-up event analog).
 *
 * Three-layer discipline (Pitfall #2 / D-08): the audio context is owned by
 * the caller via the SynthHandle abstraction; this widget never instantiates
 * Web-Audio surface itself.
 */
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";

// ─── Public types ──────────────────────────────────────────────────────────

export interface KeyboardOpts {
  /** Cents-from-12tet display precision. Default 0.1¢ per Phase 2 D-06 / Pitfall #16. */
  precision?: number;
  /** Override default key width in pixels. Default 60. */
  keyWidth?: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_PRECISION = 1; // 0.1¢ → 1 decimal place in toFixed
const DEFAULT_KEY_WIDTH = 60;
const DEFAULT_KEY_HEIGHT = 180;
// Long enough to outlast any typical hold; pointer-release stops early via
// the release callback. Kept short of "infinite" so a stuck pointer never
// holds a voice indefinitely (defense-in-depth against T-3-19).
const KEYBOARD_NOTE_DUR_SEC = 5.0;
// Keyboard activation (Enter/Space) plays a fire-and-forget short note —
// matches the existing playInterval widget cadence (D-18-aligned).
const KEYBOARD_ACTIVATION_DUR_SEC = 0.6;

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Format a signed cents-from-12tet value with a leading "+" or U+2212 minus
 * sign per UI-SPEC examples ("+3.9¢", "−13.7¢"). Mirrors the scale-table
 * sign-formatting idiom but uses U+2212 (true minus) instead of U+002D
 * (hyphen-minus) so the column reads cleanly.
 */
function formatSignedCents(cents: number, precision: number): string {
  const sign = cents >= 0 ? "+" : "−";
  return `${sign}${Math.abs(cents).toFixed(precision)}¢`;
}

// ─── keyboard() factory ────────────────────────────────────────────────────

export function keyboard(
  scale: Scale,
  synth: SynthHandle,
  baseHz: number,
  opts: KeyboardOpts = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "keyboard-widget";

  // Heading + helper (UI-SPEC copywriting — exact strings).
  const heading = document.createElement("h2");
  heading.textContent = "Keyboard";
  root.appendChild(heading);

  const helper = document.createElement("p");
  helper.className = "dashboard-helper";
  helper.textContent = "Click a key to audition. Cents shown are deviation from 12-TET.";
  root.appendChild(helper);

  const precision = opts.precision ?? DEFAULT_PRECISION;
  const keyWidth = opts.keyWidth ?? DEFAULT_KEY_WIDTH;
  const N = scale.intervals.length;
  const totalWidth = keyWidth * N + 8; // + small margin for the period marker
  const totalHeight = DEFAULT_KEY_HEIGHT + 40; // + cents-label band above

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "viz keyboard");
  svg.setAttribute("viewBox", `0 0 ${String(totalWidth)} ${String(totalHeight)}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("width", String(totalWidth));
  svg.setAttribute("height", String(totalHeight));

  // For each interval, render: cents label above + rectangle key + ratio label inside.
  for (let i = 0; i < N; i++) {
    const iv = scale.intervals[i];
    if (!iv) continue;
    const x = i * keyWidth;
    const centsText = formatSignedCents(iv.centsFrom12tet, precision);
    const ratioText = iv.fraction.toFraction();

    // Key group.
    const keyG = document.createElementNS(svgNS, "g");
    keyG.setAttribute("class", "keyboard__key");
    keyG.setAttribute("transform", `translate(${String(x)},40)`);
    keyG.setAttribute("tabindex", "0");
    keyG.setAttribute("role", "button");
    keyG.setAttribute("aria-pressed", "false");
    keyG.setAttribute(
      "aria-label",
      `Play degree ${String(i + 1)}: ${ratioText}, ${centsText} from 12-TET`,
    );

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("class", "keyboard__key-rect");
    rect.setAttribute("width", String(keyWidth - 2));
    rect.setAttribute("height", String(DEFAULT_KEY_HEIGHT));
    keyG.appendChild(rect);

    const ratioLabel = document.createElementNS(svgNS, "text");
    ratioLabel.setAttribute("class", "keyboard__ratio");
    ratioLabel.setAttribute("x", String((keyWidth - 2) / 2));
    ratioLabel.setAttribute("y", String(DEFAULT_KEY_HEIGHT - 16));
    ratioLabel.setAttribute("text-anchor", "middle");
    ratioLabel.textContent = ratioText;
    keyG.appendChild(ratioLabel);

    // Cents label ABOVE the key (per UI-SPEC line 198): position at the top
    // band, x-aligned with key center. Lives on the parent SVG (not inside the
    // key group) so the key's own pressed-state CSS doesn't shift the label.
    const centsLabel = document.createElementNS(svgNS, "text");
    centsLabel.setAttribute("class", "keyboard__cents");
    centsLabel.setAttribute("x", String(x + (keyWidth - 2) / 2));
    centsLabel.setAttribute("y", "30");
    centsLabel.setAttribute("text-anchor", "middle");
    centsLabel.textContent = centsText;
    svg.appendChild(centsLabel);

    // Pointerdown sustain — release callback held in a closure-local variable.
    // T-3-20: re-entrant pointerdowns are guarded by the `if (release) return`
    // check so a single key never stacks voices.
    let release: (() => void) | null = null;
    const ratioForKey = Number(iv.fraction.valueOf()); // S-3 audio-boundary coercion (compute once per key).
    const onDown = (): void => {
      if (release) return; // already held — ignore re-entrant downs
      release = synth.playNote(baseHz * ratioForKey, KEYBOARD_NOTE_DUR_SEC);
      keyG.setAttribute("aria-pressed", "true");
      keyG.classList.add("keyboard__key--active");
    };
    const onUp = (): void => {
      if (release) {
        release();
        release = null;
      }
      keyG.setAttribute("aria-pressed", "false");
      keyG.classList.remove("keyboard__key--active");
    };
    keyG.addEventListener("pointerdown", onDown);
    keyG.addEventListener("pointerup", onUp);
    // T-3-19: pointerleave + pointercancel both bound so a stuck voice
    // is impossible if the user drags off the key or the OS cancels.
    keyG.addEventListener("pointerleave", onUp);
    keyG.addEventListener("pointercancel", onUp);

    // Keyboard activation — Enter/Space → fire-and-forget short note.
    keyG.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        synth.playNote(baseHz * ratioForKey, KEYBOARD_ACTIVATION_DUR_SEC);
      }
    });

    svg.appendChild(keyG);
  }

  // Period boundary marker — vertical dashed line after the last key (D-23).
  const marker = document.createElementNS(svgNS, "line");
  marker.setAttribute("class", "keyboard__period-boundary");
  marker.setAttribute("x1", String(N * keyWidth - 1));
  marker.setAttribute("y1", "40");
  marker.setAttribute("x2", String(N * keyWidth - 1));
  marker.setAttribute("y2", String(40 + DEFAULT_KEY_HEIGHT));
  marker.setAttribute("stroke-dasharray", "4 4");
  svg.appendChild(marker);

  root.appendChild(svg);
  return root;
}
