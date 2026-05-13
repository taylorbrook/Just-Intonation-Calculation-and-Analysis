/**
 * spiral-of-fifths.ts — circle/spiral-of-fifths SVG visualization.
 *
 * Factory: `spiralOfFifths(n, opts?) => HTMLDivElement`.
 * Renders N fifths from 1/1 as a near-circular spiral, with octave-reduced
 * ratio labels and signed cents-from-12-TET. For n=12 with pure 3/2, the
 * visible gap between k=12 and k=0 IS the Pythagorean comma (≈23.46¢).
 * When `temperedFifthCents` is passed, ratio labels are dropped and the
 * given fifth (e.g. 700¢ for 12-TET, 696.578¢ for 1/4-comma meantone) is used.
 *
 * Three-layer discipline (Pitfall #2 / D-08): this is a VIZ-only component;
 * no AudioContext, no synth surface. Audition belongs in a sibling widget.
 *
 * Math pitfalls honoured:
 *  - R-01: Fraction is imported transitively via Interval; we never import
 *    Fraction from xen-dev-utils (that path is Number-backed and lossy).
 *  - D-24: Interval methods return new instances; we keep the canonical
 *    chain-of-fifths loop (`acc = acc.mul(fifth).octaveReduce()`).
 *  - U+2212 minus sign for signed cents (not U+002D hyphen-minus).
 *  - `String(...)` coercion on every numeric setAttribute (strict TS).
 *  - `noUncheckedIndexedAccess` honoured via `if (!s) continue` guards.
 *  - `textContent` only — never `innerHTML` (T-3-18 mitigation).
 */
import { Interval } from "../lib/interval.js";
import { centsFrom12tet } from "../lib/cents.js";

// ─── Public types ──────────────────────────────────────────────────────────

export interface SpiralStep {
  k: number;
  cumulativeCents: number;
  /** NOT mod 2π — renderer takes mod. Carries closure-gap information at k=n. */
  angleRad: number;
  x: number;
  y: number;
  centsFrom12tet: number;
  /** null in tempered branch (no exact ratio when fifth is a float). */
  ratio: Interval | null;
}

export interface SpiralOfFifthsOpts {
  /** When defined, drops ratio labels and uses this fifth size in cents. */
  temperedFifthCents?: number;
  /** Draw a dashed chord between k=n and k=0 highlighting the closure gap. */
  highlightWolf?: boolean;
  /** Root SVG width in CSS pixels (square). Default 480. */
  width?: number;
  /**
   * Optional click handler invoked with the corresponding `SpiralStep` when a
   * node group is clicked. When supplied, the root carries `is-clickable` so
   * the CSS can switch the cursor to `pointer`. Component stays viz-only —
   * audition/synth wiring belongs at the call site, not here.
   */
  onStepClick?: (step: SpiralStep) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const SVG_NS = "http://www.w3.org/2000/svg";
const DEFAULT_WIDTH = 480;
const R_BASE = 140;
const R_GROWTH_PER_WRAP = 6;
const R_MAX = 220; // keep nodes inside half-viewBox at W=480
const PURE_FIFTH_RATIO = "3/2";

// ─── Pure geometry kernel ──────────────────────────────────────────────────

/**
 * Compute the spiral-of-fifths geometry for n steps.
 *
 * Returns an array of length n+1 (covers k=0 through k=n inclusive).
 * k=0 sits at 12 o'clock (angle=0); we sweep clockwise via
 *   x = r_k * sin(θ_k);  y = -r_k * cos(θ_k)
 * with `r_k = R_BASE + dr * (θ_k / 2π)` — a gentle outward spiral so the
 * Pythagorean wrap is visible. `dr` auto-shrinks to keep `r_n` inside
 * `R_MAX` for large n.
 *
 * Pure branch (tempered=false): exact ratios via Interval, using the
 * canonical Pythagorean chain `acc = acc.mul(3/2).octaveReduce()`.
 *
 * Tempered branch (tempered=true): no Interval — ratio is null, and
 * `centsFrom12tet` is derived from the OCTAVE-REDUCED cumulative cents
 * (NOT the cumulative directly), matching the pure branch at the cents
 * level so the two branches agree visually at small k.
 */
export function spiralGeometry(
  n: number,
  fifthCents: number,
  tempered: boolean = false,
): SpiralStep[] {
  if (n < 0) throw new RangeError(`spiralGeometry: n must be >= 0 (got ${String(n)})`);

  // Auto-shrink dr if r_n would exceed R_MAX.
  const totalTurns = (n * fifthCents) / 1200;
  const effectiveDr =
    totalTurns > 0 ? Math.min(R_GROWTH_PER_WRAP, (R_MAX - R_BASE) / totalTurns) : R_GROWTH_PER_WRAP;

  const steps: SpiralStep[] = [];

  if (!tempered) {
    // Pure 3/2 branch — exact ratios via Interval.
    const fifth = new Interval(PURE_FIFTH_RATIO);
    let acc = new Interval("1/1");
    // k=0 explicitly (acc = 1/1, no multiply yet).
    steps.push(buildPureStep(0, 0, effectiveDr, acc));
    for (let k = 1; k <= n; k++) {
      acc = acc.mul(fifth).octaveReduce();
      const cumulative = k * fifthCents;
      steps.push(buildPureStep(k, cumulative, effectiveDr, acc));
    }
    return steps;
  }

  // Tempered branch — no exact ratio; signed-from-12-TET from octave-reduced cents.
  for (let k = 0; k <= n; k++) {
    const cumulative = k * fifthCents;
    const reduced = ((cumulative % 1200) + 1200) % 1200;
    const dev = centsFrom12tet(reduced);
    const angleRad = (cumulative / 1200) * 2 * Math.PI;
    const turns = angleRad / (2 * Math.PI);
    const r = R_BASE + effectiveDr * turns;
    steps.push({
      k,
      cumulativeCents: cumulative,
      angleRad,
      x: r * Math.sin(angleRad),
      y: -r * Math.cos(angleRad),
      centsFrom12tet: dev,
      ratio: null,
    });
  }
  return steps;
}

function buildPureStep(k: number, cumulative: number, dr: number, acc: Interval): SpiralStep {
  const angleRad = (cumulative / 1200) * 2 * Math.PI;
  const turns = angleRad / (2 * Math.PI);
  const r = R_BASE + dr * turns;
  return {
    k,
    cumulativeCents: cumulative,
    angleRad,
    x: r * Math.sin(angleRad),
    y: -r * Math.cos(angleRad),
    centsFrom12tet: acc.centsFrom12tet,
    ratio: acc,
  };
}

/**
 * Closing error of an n-step fifth chain.
 *
 * Positive = fifths overshoot the octave (pure 3/2 → +23.46¢ Pythagorean comma).
 * Zero     = perfect closure (12-TET 700¢ → 0).
 * Negative = fifths undershoot (1/4-comma meantone 696.578¢ → ≈ -40.7¢).
 */
export function closingErrorCents(n: number, fifthCents: number): number {
  const total = n * fifthCents;
  return total - Math.round(total / 1200) * 1200;
}

// ─── DOM factory ───────────────────────────────────────────────────────────

export function spiralOfFifths(n: number, opts: SpiralOfFifthsOpts = {}): HTMLDivElement {
  const width = opts.width ?? DEFAULT_WIDTH;
  const height = width; // square
  const tempered = opts.temperedFifthCents !== undefined;
  const fifthCents = tempered ? (opts.temperedFifthCents as number) : 1200 * Math.log2(1.5);

  const steps = spiralGeometry(n, fifthCents, tempered);

  const root = document.createElement("div");
  root.className = opts.onStepClick
    ? "spiral-of-fifths-widget is-clickable"
    : "spiral-of-fifths-widget";
  // NO <h2> here — task constraint: "Don't wire into any page yet".

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "viz spiral-of-fifths");
  svg.setAttribute(
    "viewBox",
    `${String(-width / 2)} ${String(-height / 2)} ${String(width)} ${String(height)}`,
  );
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));

  // Optional wolf chord (k=n → k=0) drawn FIRST so nodes sit on top.
  if (opts.highlightWolf && steps.length >= 2) {
    const first = steps[0];
    const last = steps[steps.length - 1];
    if (first && last) {
      const chord = document.createElementNS(SVG_NS, "line");
      chord.setAttribute("class", "spiral-of-fifths__wolf");
      chord.setAttribute("x1", String(last.x));
      chord.setAttribute("y1", String(last.y));
      chord.setAttribute("x2", String(first.x));
      chord.setAttribute("y2", String(first.y));
      svg.appendChild(chord);
    }
  }

  // One node group per step.
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (!s) continue;

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "spiral-of-fifths__node");
    g.setAttribute("transform", `translate(${String(s.x)},${String(s.y)})`);
    if (opts.onStepClick) {
      // `s` is `const`-declared above (block-scoped), so this closure captures
      // this iteration's step correctly. Non-null assertion is safe under the
      // surrounding `if (opts.onStepClick)` guard.
      g.addEventListener("click", () => opts.onStepClick!(s));
    }

    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("class", "spiral-of-fifths__dot");
    dot.setAttribute("r", "4");
    g.appendChild(dot);

    // Ratio label only in pure branch.
    if (s.ratio) {
      const ratioText = document.createElementNS(SVG_NS, "text");
      ratioText.setAttribute("class", "spiral-of-fifths__ratio");
      ratioText.setAttribute("x", "0");
      ratioText.setAttribute("y", "-10");
      ratioText.setAttribute("text-anchor", "middle");
      ratioText.textContent = s.ratio.fraction.toFraction();
      g.appendChild(ratioText);
    }

    // Cents-from-12-TET label always present. U+2212 minus sign (NOT U+002D).
    const sign = s.centsFrom12tet >= 0 ? "+" : "−";
    const centsText = document.createElementNS(SVG_NS, "text");
    centsText.setAttribute("class", "spiral-of-fifths__cents");
    centsText.setAttribute("x", "0");
    centsText.setAttribute("y", "14");
    centsText.setAttribute("text-anchor", "middle");
    centsText.textContent = `${sign}${Math.abs(s.centsFrom12tet).toFixed(1)}¢`;
    g.appendChild(centsText);

    svg.appendChild(g);
  }

  root.appendChild(svg);
  return root;
}
