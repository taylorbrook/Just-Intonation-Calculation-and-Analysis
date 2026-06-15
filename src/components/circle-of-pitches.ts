/**
 * circle-of-pitches.ts — plain-SVG circle-of-pitches viz (SURF-05).
 *
 * Factory: `circleOfPitches(scale, synth, opts?) => HTMLElement`.
 * One `<g>` marker per scale degree placed on a ring at
 *   θ = iv.cents / scale.period.cents · 2π
 * (D-02 non-octave-aware — the angle denominator is the period's cents, NOT a
 * hard-coded 1200, so Bohlen-Pierce / ED-3 scales wrap correctly). Faint 12-EDO
 * reference ticks every 100¢ around the rim. Rim labels follow the tempered-vs-JI
 * display discipline (D-01): exact ratio (e.g. "5/4") for JI, cents-only
 * (e.g. "408.0¢") for tempered output — a float-derived ratio is NEVER shown for
 * a tempered scale. Hover shows an SVG `<title>` tooltip + a highlight class
 * (D-04); click / Enter / Space auditions via the passed-in page-owned synth.
 * Octave-only / empty scales render a friendly empty-state `<p>` (mirrors
 * lattice.ts) instead of an empty SVG (D-17).
 *
 * Three-layer discipline (Pitfall #2 / D-08): this widget NEVER allocates an
 * AudioContext or constructs a synth — audio is owned by the caller via the
 * SynthHandle abstraction. Even for a tempered scale the audition Hz is
 * `baseHz * Number(iv.fraction.valueOf())`: the adapter already stored a
 * cents-to-ratio-derived Hz-faithful fraction, so only the LABEL is cents-only
 * (the same display/audio split scale-table's tempered path uses).
 *
 * All dynamic text is set via `textContent` only — the unsafe-HTML sink is never
 * used (T-08-04 / XSS mitigation). Signed cents use U+2212 (true minus), not
 * U+002D hyphen.
 */
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";

// ─── Public types ──────────────────────────────────────────────────────────

export interface CircleOfPitchesOpts {
  /** Reference frequency for 1/1. Default 440 (Phase 2 D-08). */
  baseHz?: number;
  /**
   * SURF-06 tempered variant (D-01). When true, rim labels + tooltips are
   * cents-only (no float-derived ratio masquerading as exact JI). The audition
   * Hz is unchanged — still `baseHz * Number(iv.fraction.valueOf())`.
   */
  tempered?: boolean;
  /** Ring radius in viewBox units. Default 140. */
  radius?: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const SVG_NS = "http://www.w3.org/2000/svg";
const TWO_PI = 2 * Math.PI;
const DEFAULT_BASE_HZ = 440;
const DEFAULT_RADIUS = 140;
// Fire-and-forget audition note duration — matches keyboard.ts activation cadence
// (D-18). Fixed duration so a click can never strand a held voice (T-08-05).
const NOTE_DUR_SEC = 0.6;
// Above this degree count, rim labels are thinned to every other marker so a
// dense scale's labels don't overlap (D-17 discretion). Dots + tooltips stay.
const LABEL_THINNING_THRESHOLD = 24;

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Signed cents-from-12tet with U+2212 minus (never U+002D hyphen). */
function formatSignedCents(cents: number): string {
  const sign = cents >= 0 ? "+" : "−";
  return `${sign}${Math.abs(cents).toFixed(1)}¢`;
}

// ─── Factory ───────────────────────────────────────────────────────────────

export function circleOfPitches(
  scale: Scale,
  synth: SynthHandle,
  opts: CircleOfPitchesOpts = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "circle-of-pitches-widget";

  const baseHz = opts.baseHz ?? DEFAULT_BASE_HZ;
  const tempered = opts.tempered === true;

  // Empty-state FIRST (mirror lattice.ts:156–165): a scale with no interior
  // degrees (unison-only / empty) renders a friendly <p>, not an empty SVG.
  if (scale.intervals.length <= 1) {
    const empty = document.createElement("p");
    empty.className = "circle-of-pitches-empty";
    empty.textContent =
      "This scale has no interior degrees yet. Generate a scale to see its shape.";
    root.appendChild(empty);
    return root;
  }

  const R = opts.radius ?? DEFAULT_RADIUS;
  // D-02: the angle denominator is the period's cents, NOT a literal 1200, so
  // non-octave equaves (3/1 tritave, etc.) wrap the ring exactly once.
  const periodCents = scale.period.cents;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "viz circle-of-pitches");
  const pad = 48; // label headroom around the ring
  const extent = 2 * (R + pad);
  svg.setAttribute(
    "viewBox",
    `${String(-R - pad)} ${String(-R - pad)} ${String(extent)} ${String(extent)}`,
  );
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // Rim circle outline (visual anchor for the ticks + markers).
  const rim = document.createElementNS(SVG_NS, "circle");
  rim.setAttribute("class", "circle-of-pitches__rim");
  rim.setAttribute("cx", "0");
  rim.setAttribute("cy", "0");
  rim.setAttribute("r", String(R));
  svg.appendChild(rim);

  // Faint 12-EDO reference ticks every 100¢ around the rim (D-02).
  if (periodCents > 0) {
    for (let c = 0; c < periodCents; c += 100) {
      const a = (c / periodCents) * TWO_PI;
      const tick = document.createElementNS(SVG_NS, "line");
      tick.setAttribute("class", "circle-of-pitches__tick");
      tick.setAttribute("x1", String(R * Math.sin(a)));
      tick.setAttribute("y1", String(-R * Math.cos(a)));
      tick.setAttribute("x2", String((R + 8) * Math.sin(a)));
      tick.setAttribute("y2", String(-(R + 8) * Math.cos(a)));
      svg.appendChild(tick);
    }
  }

  const N = scale.intervals.length;
  const thinLabels = N > LABEL_THINNING_THRESHOLD;

  // One marker group per degree.
  for (let i = 0; i < N; i++) {
    const iv = scale.intervals[i];
    if (!iv) continue; // noUncheckedIndexedAccess guard

    const a = periodCents > 0 ? (iv.cents / periodCents) * TWO_PI : 0;
    const x = R * Math.sin(a);
    const y = -R * Math.cos(a);

    const g = document.createElementNS(SVG_NS, "g");
    // i === 0 is the tonic (1/1) — emphasized via a modifier class (D-17).
    const tonicClass = i === 0 ? " circle-of-pitches__node--tonic" : "";
    g.setAttribute("class", `circle-of-pitches__node${tonicClass}`);
    g.setAttribute("transform", `translate(${String(x)},${String(y)})`);
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");

    const ratioText = iv.fraction.toFraction();
    const centsText = `${iv.cents.toFixed(1)}¢`;
    const labelText = tempered ? centsText : ratioText;
    g.setAttribute("aria-label", `Play degree ${String(i + 1)}: ${labelText}`);

    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("class", "circle-of-pitches__dot");
    dot.setAttribute("r", i === 0 ? "7" : "5");
    g.appendChild(dot);

    // D-01: rim label — ratio for exact JI, cents-only for tempered. Thinned on
    // dense scales (drop every other marker's label past the threshold; the
    // tonic always keeps its label).
    if (!thinLabels || i % 2 === 0) {
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("class", "circle-of-pitches__label");
      // Position the label just outside the marker, radially.
      label.setAttribute("x", String((R + 22) * Math.sin(a) - x));
      label.setAttribute("y", String(-(R + 22) * Math.cos(a) - y));
      label.setAttribute("text-anchor", "middle");
      label.textContent = labelText; // textContent only (T-08-04).
      g.appendChild(label);
    }

    // Hover tooltip (D-04) — mirror lattice.ts <title>. Pitch info + signed
    // cents-from-12tet (U+2212 minus for negatives).
    const dev = formatSignedCents(iv.centsFrom12tet);
    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = tempered
      ? `${centsText} | ${dev} from 12-TET`
      : `${ratioText} | ${dev} from 12-TET`;
    g.appendChild(title);

    // Hover highlight (D-04): toggle a CSS class so the marker pops on pointer.
    g.addEventListener("mouseenter", () => g.classList.add("circle-of-pitches__node--hover"));
    g.addEventListener("mouseleave", () => g.classList.remove("circle-of-pitches__node--hover"));

    // Click → audition (keyboard.ts idiom). S-3 BigInt→Number audio boundary —
    // the tempered audio ratio is STILL the Number-coerced fraction; only the
    // label above is cents-only.
    const ratio = Number(iv.fraction.valueOf());
    g.addEventListener("click", () => {
      synth.playNote(baseHz * ratio, NOTE_DUR_SEC);
    });
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        synth.playNote(baseHz * ratio, NOTE_DUR_SEC);
      }
    });

    svg.appendChild(g);
  }

  root.appendChild(svg);
  return root;
}
