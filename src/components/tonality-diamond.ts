/**
 * tonality-diamond.ts — odd-limit tonality diamond viz (VIZ-02).
 *
 * Factory: tonalityDiamond(scale, synth, opts?) => HTMLElement.
 * Composes Plan 02's enumerateDiamond (cell data) with hand-laid square SVG
 * grid layout + d3.zoom() for pan/zoom + click handlers routing to
 * SynthHandle.playNotes.
 *
 * D-20 — odd-limit auto-derived: ceil(max(oddLimit(i)) for i in scale) rounded
 * UP to nearest of {7, 9, 11, 13, 15, 21, 31}. opts.oddLimit overrides.
 * D-22 — in-scale cells filled by dominant prime's color; out-of-scale outlined.
 *         Tooltip via SVG <title>: "ratio | cents | prime-limit | in-scale?".
 *
 * Three-layer discipline (Pitfall #2 / D-08): the audio context is owned by
 * the caller via the SynthHandle abstraction; this widget never instantiates
 * Web-Audio surface itself. R-01: PRIMES + oddLimit imported via
 * src/lib/monzo.ts (NEVER directly from xen-dev-utils).
 */
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";
import * as d3 from "d3";
import { enumerateDiamond, type DiamondCell } from "../lib/diamond.js";
import { oddLimit, PRIMES } from "../lib/monzo.js";

// ─── Public types ──────────────────────────────────────────────────────────

export interface DiamondOpts {
  /** Default: deriveDiamondOddLimit(scale). Acceptable values: any positive odd integer ≤ 1023. UI presets: {7, 9, 11, 13, 15, 21, 31}. */
  oddLimit?: number;
  /** Default 'neighbors'. Diamond shows full odd-limit grid; out-of-scale cells outlined-only when 'neighbors' or 'full'; only in-scale when 'none'. */
  showContext?: "none" | "neighbors" | "full";
  /** Default 'dyad' (D-07). */
  audition?: "note" | "dyad";
  /** Hz reference for 1/1. Default 440. */
  baseHz?: number;
  /** SVG viewBox width override. */
  width?: number;
  /** SVG viewBox height override. */
  height?: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 600; // square — diamond is rhombic-square
const DEFAULT_AUDITION_DUR_SEC = 1.5; // matches Phase 2 D-18
const CELL_SIZE = 40; // pixels per cell

// Auto-derivation presets (CONTEXT D-20).
const ODD_LIMIT_PRESETS = [7, 9, 11, 13, 15, 21, 31] as const;

// Prime-axis colors per UI-SPEC color table — applied via CSS class names that
// resolve to var(--theme-blue/green/orange/foreground). Map prime -> css class.
const PRIME_AXIS_CLASS = new Map<number, string>([
  [3, "axis-3"],
  [5, "axis-5"],
  [7, "axis-7"],
]);

function classForPrimeLimit(pl: number): string {
  return PRIME_AXIS_CLASS.get(pl) ?? "axis-default"; // primes ≥ 11 → foreground per D-22
}

/**
 * Compute the prime-limit (largest prime with non-zero exponent) of a monzo.
 *
 * Implementation note: xen-dev-utils' `primeLimit` accepts an integer, BigInt,
 * or Fraction-like input — NOT a monzo array — and throws on the zero/unison
 * monzo. Since the diamond's diagonal cells (i === j) octave-reduce to 1/1
 * (zero monzo), and we already have the monzo decomposition in hand, computing
 * the prime-limit directly from monzo[] is simpler and safer than threading
 * Fraction inputs back into xen-dev-utils.
 *
 * Returns 1 for the unison (1/1 — no prime, 1-limit by convention).
 */
function primeLimitOfMonzo(monzo: number[]): number {
  let limit = 1;
  for (let i = 0; i < monzo.length; i++) {
    if (monzo[i] !== 0) {
      const p = PRIMES[i];
      if (p !== undefined && p > limit) limit = p;
    }
  }
  return limit;
}

// ─── deriveDiamondOddLimit (D-20) ──────────────────────────────────────────

/**
 * Auto-derive the odd-limit for a scale: take the max odd-limit of any
 * interval, round UP to the nearest preset {7, 9, 11, 13, 15, 21, 31}.
 * Clamp at 31 if the scale exceeds the highest preset (D-20: "for visual
 * sanity"; the seed scale's max-odd 27 rounds UP to 31 for fidelity, never
 * silently clamping down).
 */
export function deriveDiamondOddLimit(scale: Scale): number {
  let maxOdd = 1;
  for (const iv of scale.intervals) {
    const ol = oddLimit(iv.monzo);
    if (ol > maxOdd) maxOdd = ol;
  }
  for (const preset of ODD_LIMIT_PRESETS) {
    if (preset >= maxOdd) return preset;
  }
  return ODD_LIMIT_PRESETS[ODD_LIMIT_PRESETS.length - 1] ?? 31;
}

// ─── tonalityDiamond() factory ─────────────────────────────────────────────

export function tonalityDiamond(
  scale: Scale,
  synth: SynthHandle,
  opts: DiamondOpts = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "tonality-diamond-widget";

  // Heading + helper (UI-SPEC copywriting — exact strings).
  const heading = document.createElement("h2");
  heading.textContent = "Tonality diamond";
  root.appendChild(heading);

  const helper = document.createElement("p");
  helper.className = "dashboard-helper";
  helper.textContent = "Click a cell to audition. Hover for ratio details.";
  root.appendChild(helper);

  const limit = opts.oddLimit ?? deriveDiamondOddLimit(scale);
  const cells: DiamondCell[] = enumerateDiamond(limit, scale);

  const showContext = opts.showContext ?? "neighbors";
  const renderCells = showContext === "none" ? cells.filter((c) => c.inScale) : cells;

  // Square layout: rank lookup over the odd integers in [1, limit].
  const odds: number[] = [];
  for (let k = 1; k <= limit; k += 2) odds.push(k);
  const rankOf = new Map<number, number>();
  odds.forEach((n, i) => rankOf.set(n, i));

  const baseHz = opts.baseHz ?? 440;
  const audition = opts.audition ?? "dyad";

  const auditionCell = (cell: DiamondCell): void => {
    if (!cell.inScale && showContext !== "full") return; // out-of-scale not auditioned by default
    // S-3: BigInt → Number coercion only at the audio boundary.
    const ratio = Number(cell.ratio.fraction.valueOf());
    if (audition === "note") {
      synth.playNotes([baseHz * ratio], DEFAULT_AUDITION_DUR_SEC);
    } else {
      synth.playNotes([baseHz, baseHz * ratio], DEFAULT_AUDITION_DUR_SEC);
    }
  };

  const width = opts.width ?? Math.min(DEFAULT_WIDTH, odds.length * CELL_SIZE + 80);
  const height = opts.height ?? Math.min(DEFAULT_HEIGHT, odds.length * CELL_SIZE + 80);

  const svg = d3
    .create("svg")
    .attr("class", "viz diamond")
    .attr("viewBox", `0 0 ${String(width)} ${String(height)}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", width)
    .attr("height", height);

  const gridOriginX = (width - odds.length * CELL_SIZE) / 2;
  const gridOriginY = (height - odds.length * CELL_SIZE) / 2;
  const g = svg
    .append("g")
    .attr("transform", `translate(${String(gridOriginX)},${String(gridOriginY)})`);

  // Cells.
  const cellGroups = g
    .selectAll("g.diamond-cell")
    .data(renderCells)
    .enter()
    .append("g")
    .attr("class", (d: DiamondCell) => {
      const pl = primeLimitOfMonzo(d.ratio.monzo);
      const axis = classForPrimeLimit(pl);
      return `diamond-cell ${d.inScale ? "diamond-cell--in-scale" : "diamond-cell--out"} diamond-cell--${axis}`;
    })
    .attr("transform", (d: DiamondCell) => {
      const row = rankOf.get(d.numerator) ?? 0;
      const col = rankOf.get(d.denominator) ?? 0;
      return `translate(${String(col * CELL_SIZE)},${String(row * CELL_SIZE)})`;
    })
    // Only in-scale cells are interactive auditions (D-22 + Plan 01 test contract:
    // first .diamond-cell[role="button"] must call synth.playNotes on click).
    // Out-of-scale "context" cells (shown when showContext='neighbors'|'full')
    // remain presentation-only — visible for theory context, not auditioned.
    // showContext='full' override: in-scale gates only the role; auditionCell
    // permits playing out-of-scale cells when showContext='full' for completeness,
    // but those cells stay role=presentation here to keep the dominant interaction
    // (in-scale audition) discoverable to assistive tech and click-only users.
    .attr("tabindex", (d: DiamondCell) => (d.inScale ? 0 : -1))
    .attr("role", (d: DiamondCell) => (d.inScale ? "button" : "presentation"))
    .attr(
      "aria-label",
      (d: DiamondCell) =>
        `Play ${d.ratio.fraction.toFraction()}, ${d.inScale ? "in scale" : "not in scale"}`,
    );

  cellGroups
    .append("rect")
    .attr("width", CELL_SIZE - 2)
    .attr("height", CELL_SIZE - 2)
    .attr("rx", 4);

  cellGroups
    .append("text")
    .attr("class", "ratio")
    .attr("x", (CELL_SIZE - 2) / 2)
    .attr("y", (CELL_SIZE - 2) / 2)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text((d: DiamondCell) => `${String(d.numerator)}/${String(d.denominator)}`);

  // Tooltip via SVG <title> — keyboard-discoverable per D-22.
  // T-3-18 mitigation: .text(...) uses textContent; never .html(...).
  cellGroups.append("title").text((d: DiamondCell) => {
    const pl = primeLimitOfMonzo(d.ratio.monzo);
    const sign = d.ratio.cents >= 0 ? "+" : "−"; // U+2212 minus sign per UI-SPEC.
    const cents = `${sign}${Math.abs(d.ratio.cents).toFixed(1)}¢`;
    return `${d.ratio.fraction.toFraction()} | ${cents} | ${String(pl)}-limit | ${d.inScale ? "in scale" : "not in scale"}`;
  });

  cellGroups.on("click", function (this: SVGGElement, _event: Event, d: DiamondCell) {
    auditionCell(d);
  });
  cellGroups.on("keydown", function (this: SVGGElement, event: KeyboardEvent, d: DiamondCell) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      auditionCell(d);
    }
  });

  // d3.zoom — apply transform to inner <g>, not to <svg>.
  // Generic parameters: <SVGSVGElement, undefined> matches the datum type
  // produced by d3.create() (root selection has datum=undefined). Without this
  // alignment tsc complains about a Selection<..., undefined> vs <..., unknown>
  // mismatch on the .call(zoom) invocation.
  const zoom = d3
    .zoom<SVGSVGElement, undefined>()
    .scaleExtent([0.5, 6])
    .on("zoom", (event: { transform: { toString(): string } }) => {
      g.attr("transform", event.transform.toString());
    });
  svg.call(zoom);

  const svgNode = svg.node();
  if (svgNode) root.appendChild(svgNode);
  return root;
}
