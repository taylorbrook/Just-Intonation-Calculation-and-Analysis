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
import { Interval } from "../lib/interval.js";
import { enumerateDiamond, type DiamondCell } from "../lib/diamond.js";
import { oddLimit, primeLimitOfMonzo } from "../lib/monzo.js";

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

const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 720; // square — diamond is rhombic-square
const DEFAULT_AUDITION_DUR_SEC = 1.5; // matches Phase 2 D-18
const CELL_SIZE = 36; // visual size of each cell rect

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

  // Diamond layout: cell at logical (row=numerator-rank, col=denominator-rank)
  // is placed at isometric (col-row, col+row) so otonal cells (i/1) span up-right,
  // utonal cells (1/j) span up-left, and the unison diagonal stacks vertically —
  // forming a literal rhombus (Partch/Erlich tonality-diamond convention).
  const N = odds.length;
  const width = opts.width ?? DEFAULT_WIDTH;
  const height = opts.height ?? DEFAULT_HEIGHT;
  const padding = 40;
  // STRIDE auto-scales to fit the diamond (which spans 2*(N-1) strides in both
  // axes) inside the viewBox with margin. Capped so small odd-limits don't
  // produce comically large cells.
  const fitStride = Math.max(1, (Math.min(width, height) - 2 * padding) / Math.max(1, 2 * (N - 1)));
  const STRIDE = Math.min(CELL_SIZE * 0.78, fitStride);
  const cellRectSize = Math.min(CELL_SIZE, STRIDE * 1.28);
  const halfSpan = (N - 1) * STRIDE;

  const svg = d3
    .create("svg")
    .attr("class", "viz diamond")
    .attr("viewBox", `0 0 ${String(width)} ${String(height)}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", width)
    .attr("height", height);

  // Center the diamond in the viewBox. Iso (col-row) ranges from -(N-1) to +(N-1),
  // (col+row) ranges from 0 to 2*(N-1). Translate origin so iso(0,0) lands top-center.
  const cx = width / 2;
  const cy = (height - 2 * halfSpan) / 2;
  const g = svg.append("g").attr("transform", `translate(${String(cx)},${String(cy)})`);

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
      // CR-01 fix: use the ORIGINAL odd-integer (i, j) for rank lookup.
      // Reduced numerator/denominator are not always odd (e.g. (3,5)→6/5,
      // (1,7)→8/7) and would miss the rankOf table — collapsing distinct
      // cells onto the row=0 / col=0 axes. The fallback `?? 0` is no longer
      // load-bearing (every cell now has integer i and j by construction)
      // but stays for defense-in-depth.
      const row = rankOf.get(d.i) ?? 0;
      const col = rankOf.get(d.j) ?? 0;
      const x = (col - row) * STRIDE;
      const y = (col + row) * STRIDE;
      return `translate(${String(x)},${String(y)})`;
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

  // Cell rect is centered on its iso-translated origin so the diamond aligns
  // symmetrically (otherwise cells anchor at top-left and break the rhombus).
  const half = (cellRectSize - 2) / 2;
  cellGroups
    .append("rect")
    .attr("x", -half)
    .attr("y", -half)
    .attr("width", cellRectSize - 2)
    .attr("height", cellRectSize - 2)
    .attr("rx", 4);

  cellGroups
    .append("text")
    .attr("class", "ratio")
    .attr("x", 0)
    .attr("y", 0)
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
  // Seed the zoom's internal state with the centering translate so the first
  // zoom/pan event composes onto the centering rather than overwriting it
  // (the on-zoom handler replaces g's transform — without seeding, identity
  // would snap the diamond from center to (0,0)).
  // eslint-disable-next-line @typescript-eslint/unbound-method -- d3 idiom: selection.call(method, …args) invokes method(selection, …args); zoom.transform does not read `this`.
  svg.call(zoom.transform, d3.zoomIdentity.translate(cx, cy));

  const svgNode = svg.node();
  if (svgNode) root.appendChild(svgNode);
  return root;
}

// ─── renderDiamondSVG (pure-presentational, optionally interactive) ──────

export interface RenderDiamondSVGOpts {
  /** SVG viewBox width. Default 320. */
  width?: number;
  /** SVG viewBox height. Default 320. */
  height?: number;
  /**
   * Optional synth handle. When supplied, every cell becomes a clickable
   * button auditioning [baseHz, baseHz × ratio] for `duration` seconds —
   * the same dyad audition pattern playInterval uses (D-07 / D-18). When
   * omitted, cells stay role="presentation" (legacy byte-equivalent path).
   *
   * D-08 three-layer discipline: viz components do not own the synth — the
   * page does. Type-only import; no Web-Audio surface is constructed here.
   */
  synth?: SynthHandle;
  /** Hz reference for 1/1 when `synth` is supplied. Default 440. */
  baseHz?: number;
  /** Audition duration in seconds. Default 1.5 (matches playInterval / D-18). */
  duration?: number;
}

/**
 * renderDiamondSVG — static SVG preview of an N-odd-limit tonality diamond.
 * Pure-presentational by default (no scale dependency, no zoom). Each cell is
 * rendered in its dominant-prime axis color (reusing the same CSS classes as
 * `tonalityDiamond` so theme tokens cascade), with an SVG `<title>` for
 * hover/accessibility.
 *
 * When `opts.synth` is supplied, cells flip to role="button" + tabindex=0 and
 * click / Enter / Space dispatch a dyad audition against `1/1` — the same
 * shape `playInterval` writes to the synth. The synth is owned by the page
 * (D-08); this widget receives a `SynthHandle` reference only.
 *
 * Intended for theory pages (e.g. /pages/odd-limits.md) that want an inline
 * picture of the diamond — optionally click-to-audition — without the
 * dashboard's full `tonalityDiamond` widget chrome.
 */
export function renderDiamondSVG(oddLimitN: number, opts: RenderDiamondSVGOpts = {}): HTMLElement {
  if (!Number.isInteger(oddLimitN) || oddLimitN < 1 || oddLimitN > 1023) {
    throw new RangeError(
      `renderDiamondSVG: oddLimit must be integer in [1, 1023] (got ${String(oddLimitN)})`,
    );
  }

  const root = document.createElement("div");
  root.className = "tonality-diamond-static";

  const odds: number[] = [];
  for (let k = 1; k <= oddLimitN; k += 2) odds.push(k);
  const rankOf = new Map<number, number>();
  odds.forEach((n, i) => rankOf.set(n, i));
  const N = odds.length;

  const width = opts.width ?? 320;
  const height = opts.height ?? 320;
  const padding = 24;
  const fitStride = Math.max(1, (Math.min(width, height) - 2 * padding) / Math.max(1, 2 * (N - 1)));
  const STRIDE = Math.min(CELL_SIZE * 0.78, fitStride);
  const cellRectSize = Math.min(CELL_SIZE, STRIDE * 1.28);
  const halfSpan = (N - 1) * STRIDE;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "viz diamond diamond-static");
  svg.setAttribute("viewBox", `0 0 ${String(width)} ${String(height)}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${String(oddLimitN)}-odd-limit tonality diamond`);

  const cx = width / 2;
  const cy = (height - 2 * halfSpan) / 2;
  const gNode = document.createElementNS(SVG_NS, "g");
  gNode.setAttribute("transform", `translate(${String(cx)},${String(cy)})`);
  svg.appendChild(gNode);

  const half = (cellRectSize - 2) / 2;

  // Audition wiring (D-07 dyad / D-18 1.5s) — captured once per render so
  // the per-cell handler closures don't re-read opts on every event.
  const synth = opts.synth;
  const baseHz = opts.baseHz ?? 440;
  const duration = opts.duration ?? 1.5;

  for (const i of odds) {
    for (const j of odds) {
      const ratio = new Interval(`${String(i)}/${String(j)}`).octaveReduce();
      const pl = primeLimitOfMonzo(ratio.monzo);
      const axisClass = classForPrimeLimit(pl);

      const row = rankOf.get(i) ?? 0;
      const col = rankOf.get(j) ?? 0;
      const x = (col - row) * STRIDE;
      const y = (col + row) * STRIDE;

      const cellGroup = document.createElementNS(SVG_NS, "g");
      // Reuses `diamond-cell--in-scale diamond-cell--axis-N` so the existing
      // tonality-diamond.css axis-color rules cascade. There is no concept of
      // out-of-scale cells in the static preview — there is no scale.
      cellGroup.setAttribute(
        "class",
        `diamond-cell diamond-cell--in-scale diamond-cell--${axisClass}`,
      );
      cellGroup.setAttribute("transform", `translate(${String(x)},${String(y)})`);

      if (synth) {
        // Interactive cell: same role/tabindex/aria-label contract as
        // tonalityDiamond's in-scale cells. Click + Enter/Space dispatch a
        // dyad audition (Pitfall #1: BigInt-Fraction → Number coercion at
        // the audio boundary only).
        cellGroup.setAttribute("role", "button");
        cellGroup.setAttribute("tabindex", "0");
        cellGroup.setAttribute("aria-label", `Play ${ratio.fraction.toFraction()}`);
        const audition = (): void => {
          synth.playNotes([baseHz, baseHz * Number(ratio.fraction.valueOf())], duration);
        };
        cellGroup.addEventListener("click", audition);
        cellGroup.addEventListener("keydown", (event: Event) => {
          const key = (event as KeyboardEvent).key;
          if (key === "Enter" || key === " ") {
            event.preventDefault();
            audition();
          }
        });
      } else {
        cellGroup.setAttribute("role", "presentation");
      }

      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", String(-half));
      rect.setAttribute("y", String(-half));
      rect.setAttribute("width", String(cellRectSize - 2));
      rect.setAttribute("height", String(cellRectSize - 2));
      rect.setAttribute("rx", "4");
      cellGroup.appendChild(rect);

      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("class", "ratio");
      text.setAttribute("x", "0");
      text.setAttribute("y", "0");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dy", "0.35em");
      text.textContent = `${String(Number(ratio.fraction.n))}/${String(Number(ratio.fraction.d))}`;
      cellGroup.appendChild(text);

      const title = document.createElementNS(SVG_NS, "title");
      title.textContent = `${ratio.fraction.toFraction()} | ${String(pl)}-limit`;
      cellGroup.appendChild(title);

      gNode.appendChild(cellGroup);
    }
  }

  root.appendChild(svg);
  return root;
}
