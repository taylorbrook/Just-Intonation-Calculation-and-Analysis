/**
 * audioPanel — dashboard-only audio controls (D-07). Composition (top-down):
 *   1. Interval-selector dropdown ("Play degree N: ratio") + ▶ Play button
 *   2. ⏵⏵ Arpeggiate scale button
 *   3. 🔇 Drone off / 🔊 Drone on toggle (`aria-pressed`)
 *
 * The drone toggle stores the stop callback returned by `synth.startDrone`
 * (Pitfall #9 voice-tracking pattern: every noteOn returns its own noteOff —
 * we hold that callback and invoke it on the second click).
 *
 * Reactivity contract: `baseHz` is captured at factory-call time. Re-running
 * the dashboard cell with a new baseHz produces a NEW audio-panel instance
 * (Framework's `invalidation.then(...)` discards the old one). The held drone
 * does NOT auto-retune mid-hold — the user must toggle off/on to retune (per
 * UI-SPEC; matches the "drone restarted on next toggle" simplification).
 *
 * ARCHITECTURE Pattern 2 factory. Three-layer discipline: types only from
 * src/lib/ and src/audio/.
 *
 * UI-SPEC accessibility:
 *   - real `<button type="button">` for every clickable
 *   - `aria-pressed` on drone toggle (color-independent state — also reflected
 *     in icon swap 🔇 ↔ 🔊 and the visible "Drone off" / "Drone on" text)
 *   - native `<select>` for interval picker (screen-reader friendly)
 *   - Framework's default focus ring is preserved via :focus-visible CSS
 */
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";
// CSS shipped via per-page `style:` frontmatter (src/styles.css). See
// play-interval.ts for the Plan-06-deferred rationale.

export interface AudioPanelOpts {
  /** Default-selected scale degree index. Defaults to length-2 (next-to-last). */
  defaultDegree?: number;
}

export function audioPanel(
  scale: Scale,
  synth: SynthHandle,
  baseHz: number,
  opts: AudioPanelOpts = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "audio-panel";

  const heading = document.createElement("h2");
  heading.textContent = "Audition"; // UI-SPEC copywriting (NOT "Listen").
  root.appendChild(heading);

  // ─── Row 1 — interval selector + Play button ─────────────────────────────
  const row1 = document.createElement("div");
  row1.className = "audio-panel__row";

  const selectLabel = document.createElement("label");
  selectLabel.className = "audio-panel__label";
  selectLabel.textContent = "Play degree";

  const select = document.createElement("select");
  select.className = "audio-panel__select";
  scale.intervals.forEach((iv, i) => {
    const optEl = document.createElement("option");
    optEl.value = String(i);
    // textContent (not innerHTML) — defense-in-depth even though ratio strings
    // come from fraction.js' BigInt path and cannot contain markup.
    optEl.textContent = `${String(i + 1)}: ${iv.fraction.toFraction()}`;
    select.appendChild(optEl);
  });
  // Default: the next-to-last degree (visually compelling: not 1/1, not the
  // bare octave). Clamped into range so opts.defaultDegree out of bounds
  // doesn't throw.
  const intendedIdx = opts.defaultDegree ?? Math.max(1, scale.intervals.length - 2);
  const lastIdx = scale.intervals.length - 1;
  select.value = String(Math.min(Math.max(0, intendedIdx), lastIdx));
  selectLabel.appendChild(select);

  const playBtn = document.createElement("button");
  playBtn.className = "play-btn audio-panel__play";
  playBtn.type = "button";
  playBtn.textContent = "▶ Play";
  playBtn.addEventListener("click", () => {
    const degree = Number(select.value);
    const iv = scale.intervals[degree];
    if (!iv) return;
    synth.playNotes(
      [baseHz, baseHz * Number(iv.fraction.valueOf())],
      1.5, // D-18.
    );
  });

  row1.appendChild(selectLabel);
  row1.appendChild(playBtn);
  root.appendChild(row1);

  // ─── Row 2 — Arpeggiate ──────────────────────────────────────────────────
  const row2 = document.createElement("div");
  row2.className = "audio-panel__row";
  const arpBtn = document.createElement("button");
  arpBtn.className = "play-btn audio-panel__arpeggiate";
  arpBtn.type = "button";
  arpBtn.textContent = "⏵⏵ Arpeggiate scale"; // UI-SPEC copywriting.
  arpBtn.addEventListener("click", () => {
    const freqs = scale.intervals.map((iv) => baseHz * Number(iv.fraction.valueOf()));
    synth.playArpeggio(freqs, 0.45); // D-18.
  });
  row2.appendChild(arpBtn);
  root.appendChild(row2);

  // ─── Row 3 — Drone toggle (Pitfall #9 stop-callback pattern) ─────────────
  const row3 = document.createElement("div");
  row3.className = "audio-panel__row";
  const droneBtn = document.createElement("button");
  droneBtn.className = "play-btn audio-panel__drone";
  droneBtn.type = "button";
  droneBtn.setAttribute("aria-pressed", "false");
  droneBtn.textContent = "🔇 Drone off";

  // Hold the stop callback returned by startDrone. Pitfall #9: this is the
  // ONLY way to release the voice; if we discarded it the synth would leak
  // a held note until panic() or dispose().
  let stopDrone: (() => void) | null = null;

  droneBtn.addEventListener("click", () => {
    if (stopDrone) {
      stopDrone();
      stopDrone = null;
      droneBtn.textContent = "🔇 Drone off";
      droneBtn.setAttribute("aria-pressed", "false");
    } else {
      stopDrone = synth.startDrone(baseHz);
      droneBtn.textContent = `🔊 Drone on (1/1 = ${baseHz.toFixed(1)} Hz)`;
      droneBtn.setAttribute("aria-pressed", "true");
    }
  });
  row3.appendChild(droneBtn);
  root.appendChild(row3);

  return root;
}
