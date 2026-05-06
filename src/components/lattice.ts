/**
 * lattice.ts — D3 + ji-lattice 2D lattice viz widget (VIZ-01).
 *
 * Factory contract (Phase 2 D-09 / S-1): lattice(scale, synth, opts?) => HTMLElement.
 * Composes ji-lattice's spanLattice() (coordinate output) with D3 SVG rendering
 * + d3.zoom() for pan/zoom + click handlers that route to SynthHandle.playNotes.
 *
 * D-19 — basis auto-derived from scale's primes minus 2. opts.basis overrides.
 * D-05 — showContext default 'neighbors' (in-scale + 1-step neighbors).
 * D-07 — audition default 'dyad' (plays 1/1 + clicked ratio stacked).
 * D-21 — in-scale nodes fill-encode the dominant prime axis (3=blue, 5=green,
 *        7=orange, ≥11=foreground) via lattice-node--axis-{N} CSS class.
 * Pitfall #11 — octave-only scales render empty-state instead of empty SVG.
 *
 * Three-layer discipline: imports types only from src/lib/ + src/audio/, never
 * allocates AudioContext (Pitfall #2; D-08 — synth handle is owner-allocated).
 *
 * R-01: PRIMES is re-exported from src/lib/monzo.ts, NOT pulled directly from
 * xen-dev-utils — see eslint.config.js no-restricted-imports rule.
 */

import type { Scale } from "../lib/scale.js";
import type { Interval } from "../lib/interval.js";
import type { SynthHandle } from "../audio/synth.js";
import * as d3 from "d3";
// `npm:` prefix routes through Framework's jsDelivr resolver, bypassing Node's
// CJS loader. ji-lattice@0.3.2 ships `"type": "module"` without an `"exports"`
// field — Framework's build resolver throws ERR_PACKAGE_PATH_NOT_EXPORTED when
// a markdown page imports a TS module that itself imports `ji-lattice` bare.
// The vitest config aliases `npm:ji-lattice` back to the local install so unit
// tests still resolve. Same pattern as `npm:sw-synth` in src/audio/synth.ts.
import { spanLattice, kraigGrady9, type Vertex, type Edge } from "npm:ji-lattice";
import { PRIMES } from "../lib/monzo.js";

// ─── Public surface ─────────────────────────────────────────────────────────

export interface LatticeOpts {
  /** Prime basis to project monzos onto. Default: deriveLatticeBasis(scale). */
  basis?: number[];
  /** Default 'neighbors' per D-05. */
  showContext?: "none" | "neighbors" | "full";
  /** Default 'dyad' per D-07. Click plays [1/1, ratio] stacked when 'dyad', single ratio when 'note'. */
  audition?: "note" | "dyad";
  /** Hz reference for 1/1. Default 440. The dashboard passes its computed effectiveBaseHz. */
  baseHz?: number;
  /** SVG viewBox width. Default 600. */
  width?: number;
  /** SVG viewBox height. Default 400. */
  height?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_AUDITION_DUR_SEC = 1.5; // matches Phase 2 D-18

// Prime-axis colors per UI-SPEC color table — applied via CSS class names that
// resolve to var(--theme-blue/green/orange/foreground). Map prime -> css class.
const PRIME_AXIS_CLASS = new Map<number, string>([
  [3, "axis-3"],
  [5, "axis-5"],
  [7, "axis-7"],
]);

function classForPrime(prime: number | undefined): string {
  if (prime === undefined) return "axis-default";
  return PRIME_AXIS_CLASS.get(prime) ?? "axis-default"; // primes >= 11 get foreground per D-21
}

/** Dominant-prime axis selector for an interval's monzo: highest prime index with non-zero exponent (skipping 2 at index 0). */
function dominantPrimeFor(iv: Interval): number | undefined {
  let dominantIdx = -1;
  iv.monzo.forEach((exp, i) => {
    if (exp !== 0 && i > 0 && i > dominantIdx) dominantIdx = i;
  });
  if (dominantIdx < 0) return undefined;
  return PRIMES[dominantIdx];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derive a lattice basis from the scale's monzos: the union of primes that
 * appear with non-zero exponent across any interval, minus prime 2 (D-19).
 *
 * Returns a sorted ascending array. If more than 3 primes are present, falls
 * back to the top-2-by-frequency primes and console.warns the dropped ones.
 *
 * Exported so Plan 05's tonality-diamond can reuse the same prime-axis
 * inference if it wants matching color coding.
 */
export function deriveLatticeBasis(scale: Scale): number[] {
  const used = new Set<number>();
  for (const iv of scale.intervals) {
    iv.monzo.forEach((exp, i) => {
      if (exp !== 0 && i > 0) {
        const p = PRIMES[i];
        if (p !== undefined) used.add(p); // noUncheckedIndexedAccess guard
      }
    });
  }
  const basis = [...used].sort((a, b) => a - b);
  if (basis.length > 3) {
    // Top-2-by-frequency truncation. Recount to rank.
    const counts = new Map<number, number>();
    for (const iv of scale.intervals) {
      iv.monzo.forEach((exp, i) => {
        if (exp !== 0 && i > 0) {
          const p = PRIMES[i];
          if (p !== undefined) counts.set(p, (counts.get(p) ?? 0) + 1);
        }
      });
    }
    const sorted = [...basis].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
    const dropped = sorted.slice(2);
    // Console-warn the dropped primes (per D-19 — "flag remaining via console").
    console.warn(
      `[lattice] basis truncated from ${String(sorted.length)} to 2 primes; dropped: ${dropped.join(", ")}`,
    );
    return sorted.slice(0, 2);
  }
  return basis;
}

/**
 * Project monzos onto a chosen prime basis: zero-out exponents of primes NOT
 * in the basis. spanLattice has no native "basis" option, so the standard
 * pattern (RESEARCH lines 339-348) is to pre-truncate the input monzos.
 */
function projectMonzos(monzos: number[][], basis: number[]): number[][] {
  const basisIndices = new Set<number>();
  for (const p of basis) {
    const idx = PRIMES.indexOf(p);
    if (idx >= 0) basisIndices.add(idx);
  }
  return monzos.map((m) => m.map((v, i) => (basisIndices.has(i) ? v : 0)));
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function lattice(scale: Scale, synth: SynthHandle, opts: LatticeOpts = {}): HTMLElement {
  const root = document.createElement("section");
  root.className = "lattice-widget";

  // Heading + helper (UI-SPEC copywriting line 116 + 119 — exact strings).
  const heading = document.createElement("h2");
  heading.textContent = "Lattice";
  root.appendChild(heading);

  const helper = document.createElement("p");
  helper.className = "dashboard-helper";
  helper.textContent = "Click a node to audition. Scroll or pinch to zoom; drag to pan.";
  root.appendChild(helper);

  // Pitfall #11 — octave-only scale empty-state (UI-SPEC line 122 — exact copy).
  const basis = opts.basis ?? deriveLatticeBasis(scale);
  if (basis.length === 0) {
    const empty = document.createElement("p");
    empty.className = "lattice-empty";
    empty.textContent =
      "This scale only spans the octave (prime 2). Add a non-octave interval to see a lattice.";
    root.appendChild(empty);
    return root;
  }

  // Compute coordinates ONCE per render (RESEARCH Pitfall #6 — never inside zoom handler).
  const monzos = scale.intervals.map((iv) => iv.monzo);
  const projected = projectMonzos(monzos, basis);
  const layoutOptions = kraigGrady9();
  // showContext: 'none' -> maxDistance: 0; 'neighbors' -> 1 (default); 'full' -> 2.
  const showContext = opts.showContext ?? "neighbors";
  layoutOptions.maxDistance = showContext === "none" ? 0 : showContext === "full" ? 2 : 1;

  const { vertices, edges } = spanLattice(projected, layoutOptions);

  // Build SVG. viewBox is centered on origin so spanLattice's signed coords
  // render symmetrically; preserveAspectRatio per D-17 responsive contract.
  const width = opts.width ?? DEFAULT_WIDTH;
  const height = opts.height ?? DEFAULT_HEIGHT;
  const svg = d3
    .create("svg")
    .attr("class", "viz lattice")
    .attr(
      "viewBox",
      `${String(-width / 2)} ${String(-height / 2)} ${String(width)} ${String(height)}`,
    )
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g");

  // Edges first (so nodes render on top).
  g.selectAll("line.edge")
    .data(edges)
    .enter()
    .append("line")
    .attr("class", (d: Edge) => `edge edge-${d.type}`)
    .attr("x1", (d: Edge) => d.x1)
    .attr("y1", (d: Edge) => d.y1)
    .attr("x2", (d: Edge) => d.x2)
    .attr("y2", (d: Edge) => d.y2);

  const baseHz = opts.baseHz ?? 440; // Phase 2 D-08 default.
  const audition = opts.audition ?? "dyad";

  const auditionVertex = (vertex: Vertex): void => {
    if (vertex.index === undefined) return; // neighbor / out-of-scale: no audition
    const iv = scale.intervals[vertex.index];
    if (!iv) return;
    // S-3: BigInt -> Number boundary. Cents/Hz are projection-only (Pitfall #1).
    const ratio = Number(iv.fraction.valueOf());
    if (audition === "note") {
      synth.playNotes([baseHz * ratio], DEFAULT_AUDITION_DUR_SEC);
    } else {
      synth.playNotes([baseHz, baseHz * ratio], DEFAULT_AUDITION_DUR_SEC);
    }
  };

  // Node groups (per D-21: filled when in-scale, outlined when neighbor;
  // in-scale fill-color encodes dominant prime axis via lattice-node--axis-N).
  const nodeGroups = g
    .selectAll("g.lattice-node")
    .data(vertices)
    .enter()
    .append("g")
    .attr("class", (d: Vertex) => {
      if (d.index === undefined) {
        return "lattice-node lattice-node--neighbor";
      }
      const iv = scale.intervals[d.index];
      const axisClass = iv ? classForPrime(dominantPrimeFor(iv)) : "axis-default";
      return `lattice-node lattice-node--in-scale lattice-node--${axisClass}`;
    })
    .attr("transform", (d: Vertex) => `translate(${String(d.x)},${String(d.y)})`)
    .attr("tabindex", (d: Vertex) => (d.index !== undefined ? 0 : -1))
    .attr("role", (d: Vertex) => (d.index !== undefined ? "button" : "presentation"))
    .attr("aria-label", (d: Vertex) => {
      if (d.index === undefined) return "";
      const iv = scale.intervals[d.index];
      if (!iv) return "";
      // UI-SPEC line 125: aria-label format `Play {ratio}` (e.g. `Play 5/4`).
      return `Play ${iv.fraction.toFraction()}`;
    });

  // Render circles + labels per node.
  nodeGroups.append("circle").attr("r", 18);

  nodeGroups
    .filter((d: Vertex) => d.index !== undefined)
    .each(function (this: SVGGElement, d: Vertex) {
      if (d.index === undefined) return;
      const iv = scale.intervals[d.index];
      if (!iv) return;
      const sel = d3.select(this);
      // S-2 (PATTERNS lines 286-298): always .text(...) (delegates to textContent), NEVER .html(...).
      sel
        .append("text")
        .attr("class", "ratio")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .text(iv.fraction.toFraction());
      const cents = iv.centsFrom12tet;
      const sign = cents >= 0 ? "+" : "−";
      const formatted = `${sign}${Math.abs(cents).toFixed(1)}¢`;
      sel
        .append("text")
        .attr("class", "cents")
        .attr("text-anchor", "middle")
        .attr("y", 30)
        .text(formatted);
      sel.append("title").text(`${iv.fraction.toFraction()} | ${formatted} from 12-TET`);
    });

  // Click handler — defers to auditionVertex so 'note' vs 'dyad' is honored.
  nodeGroups.on("click", function (this: SVGGElement, _event: Event, d: Vertex) {
    auditionVertex(d);
  });

  // Keyboard: Enter / Space audition for accessibility (UI-SPEC line 183).
  // preventDefault only on keydown — never on click, which would kill zoom drag.
  nodeGroups.on("keydown", function (this: SVGGElement, event: KeyboardEvent, d: Vertex) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      auditionVertex(d);
    }
  });

  // d3.zoom — apply transform to inner <g>, not to <svg>. scaleExtent clamps
  // pinch-zoom-bombing (T-3-16 acknowledged). Re-running spanLattice inside
  // the handler is forbidden (Pitfall #6) — we only mutate the transform.
  // Use SVGElement (not SVGSVGElement) for the ZoomBehavior generic so it
  // matches the d3.create('svg') Selection's element type without the
  // datum-type conflict (d3.create returns Selection<E, undefined, null, undefined>).
  const zoom = d3
    .zoom<SVGElement, unknown>()
    .scaleExtent([0.25, 8])
    .on("zoom", (event: { transform: { toString(): string } }) => {
      g.attr("transform", event.transform.toString());
    });
  const svgNode = svg.node();
  if (svgNode) {
    d3.select<SVGElement, unknown>(svgNode).call(zoom);
    root.appendChild(svgNode);
  }
  return root;
}
