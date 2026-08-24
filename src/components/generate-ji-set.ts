/**
 * generate-ji-set — JI-set method widget (GEN-04, Phase 6 D-07 / D-09).
 *
 * The exact-JI combinatorial sets wired into the Generate picker under the
 * "JI combinatorial" optgroup (alongside CPS). Pattern-2 factory:
 * (synth, opts?) => HTMLElement. Mirrors mosBuilder + generateCps + generateHarmonic —
 * closure-local state (no module-level state), a status region (role="status"
 * aria-live="polite"), and rebuild() that swaps the table + Play button via
 * replaceChildren. On a kernel RangeError the message lands in the status region
 * and the prior render is PRESERVED (the mosBuilder error idiom).
 *
 * Sub-method <select> (diamond / odd-limit / prime-limit / Farey). Default =
 * diamond (D-09 odd-limit 9). A SINGLE integer limit/order input whose label
 * updates per sub-method ("diamond odd-limit" / "odd limit" / "prime limit" /
 * "Farey order"). There is NO equave field — JI families fix the equave at the
 * octave 2/1 (D-07).
 *
 * D-09 defaults: diamond odd-limit 9, odd-limit 9, prime-limit 5, Farey order 8.
 *
 * EXACT JI (NOT tempered): each sub-method dispatches to the matching
 * generators.ts builder (diamondScale / oddLimitSet / primeLimitSet / fareyScale)
 * and renders the DEFAULT scaleTable variant — the 5-column Degree | Ratio |
 * Cents | ¢-from-12tet | Hz table with a Ratio column and NO tempered badge. (The
 * tempered cents-only variant is the ED widget's, Plan 07 Task 2.)
 *
 * On any change: dispatch on the active sub-method, render via scaleTable +
 * playScale, expose the current Scale via a getScale() method on the root element
 * (so generate.md can serialize it ratio-per-line for Send-to — the generateCps /
 * generateHarmonic precedent).
 *
 * Three-layer purity: imports the generators.ts builders by value, the scaleTable /
 * playScale output components, and the SynthHandle type. No DOM-in-kernel bleed.
 * All inputs/labels/status via createElement + textContent (never innerHTML with
 * dynamic content — T-06-17); the numeric input carries min/max as a first clamp
 * before the kernel's D-14 caps (T-06-16).
 */
import type { Scale } from "../lib/scale.js";
import { diamondScale, oddLimitSet, primeLimitSet, fareyScale } from "../lib/generators.js";
import { parseIntOrNull } from "./generate-fields.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateJiSetOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/** A root element that also exposes the widget's current Scale (for Send-to). */
export interface GenerateJiSetElement extends HTMLElement {
  /** The widget's current JI-set Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
}

/** The four exact-JI sub-methods. `diamond` is the default (D-09). */
type SubMethod = "diamond" | "odd-limit" | "prime-limit" | "farey";

/** D-09 default limit/order per sub-method. */
const DEFAULT_LIMIT: Record<SubMethod, number> = {
  diamond: 9,
  "odd-limit": 9,
  "prime-limit": 5,
  farey: 8,
};

/** The limit/order input label per sub-method (relabelled on swap). */
const LIMIT_LABEL: Record<SubMethod, string> = {
  diamond: "Diamond odd-limit",
  "odd-limit": "Odd limit",
  "prime-limit": "Prime limit",
  farey: "Farey order",
};

/**
 * Per-sub-method upper bound for the limit/order input — the kernel caps, surfaced
 * as the input's `max` attribute (#19 hardening) so the browser number spinner stops
 * at the kernel ceiling. Verified caps: diamond enumerateDiamond ≤ 1023; odd-limit /
 * prime-limit ODD_LIMIT_CAP = 31; farey MAX_FAREY_ORDER = 1000. (Diamond's separate
 * ODD-only constraint is UNCHANGED — no new UI validation added.)
 */
const MAX_LIMIT: Record<SubMethod, number> = {
  diamond: 1023,
  "odd-limit": 31,
  "prime-limit": 31,
  farey: 1000,
};

export function generateJiSet(
  synth: SynthHandle,
  opts: GenerateJiSetOpts = {},
): GenerateJiSetElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  // Default = diamond (D-09). A per-sub-method limit/order is remembered so
  // switching sub-methods restores each one's own value (and its D-09 default
  // on first visit).
  let sub: SubMethod = "diamond";
  const limits: Record<SubMethod, number> = { ...DEFAULT_LIMIT };
  let currentScale: Scale | null = null;

  const root = document.createElement("section") as GenerateJiSetElement;
  root.className = "generate-ji-set";

  const heading = document.createElement("h2");
  heading.textContent = "JI combinatorial sets"; // UI copy.
  root.appendChild(heading);

  // ─── Form: sub-method select + a single limit/order input ──────────────────
  const form = document.createElement("div");
  form.className = "generate-ji-set__form";

  // Sub-method select.
  const subCell = document.createElement("div");
  subCell.className = "generate-ji-set__field";
  const subLbl = document.createElement("span");
  subLbl.className = "generate-ji-set__field-label";
  subLbl.textContent = "Sub-method";
  subCell.appendChild(subLbl);

  const subSelect = document.createElement("select");
  subSelect.name = "ji-set-submethod";
  subSelect.setAttribute("aria-label", "JI-set sub-method");
  for (const [value, label] of [
    ["diamond", "Tonality diamond"],
    ["odd-limit", "Odd-limit set"],
    ["prime-limit", "Prime-limit set"],
    ["farey", "Farey / Stern-Brocot"],
  ]) {
    const optionEl = document.createElement("option");
    optionEl.value = value!;
    optionEl.textContent = label!;
    subSelect.appendChild(optionEl);
  }
  subSelect.value = sub; // default diamond (D-09).
  subCell.appendChild(subSelect);
  form.appendChild(subCell);

  // The single limit/order integer input (relabelled per sub-method, D-07: NO
  // equave field — JI families are octave-fixed at 2/1).
  const limitCell = document.createElement("div");
  limitCell.className = "generate-ji-set__field";
  const limitLbl = document.createElement("span");
  limitLbl.className = "generate-ji-set__field-label generate-ji-set__field-label--limit";
  limitLbl.textContent = LIMIT_LABEL[sub];
  limitCell.appendChild(limitLbl);

  const limitInput = document.createElement("input");
  limitInput.type = "number";
  limitInput.name = "ji-set-limit";
  limitInput.min = "1";
  limitInput.max = String(MAX_LIMIT[sub]); // per-sub-method kernel cap (#19).
  limitInput.step = "1";
  limitInput.value = String(limits[sub]);
  limitInput.setAttribute("aria-label", LIMIT_LABEL[sub]);
  limitCell.appendChild(limitInput);
  form.appendChild(limitCell);

  root.appendChild(form);

  // ─── Status region (kernel RangeError announcements) ───────────────────────
  const status = document.createElement("div");
  status.className = "generate-ji-set__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + Play button ────────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-ji-set__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-ji-set__play-host";
  root.appendChild(playHost);

  /** Dispatch on the active sub-method to the matching exact-JI builder. */
  function buildScale(): Scale {
    const limit = limits[sub];
    switch (sub) {
      case "diamond":
        return diamondScale(limit);
      case "odd-limit":
        return oddLimitSet(limit);
      case "prime-limit":
        return primeLimitSet(limit);
      case "farey":
        return fareyScale(limit);
    }
  }

  function rebuild(): void {
    try {
      const scale = buildScale();
      // EXACT JI — the DEFAULT 4-column scaleTable (Ratio column, NO tempered
      // badge). This is the load-bearing distinction vs. the ED widget (D-01).
      tableHost.replaceChildren(scaleTable(scale, baseHz, { precision }));
      playHost.replaceChildren(playScale(scale, synth, { baseHz }));
      currentScale = scale;
      status.textContent = "";
    } catch (err) {
      // Kernel rejected the inputs (D-14 caps). T-06-16/17: surface the message
      // via textContent, never innerHTML; PRESERVE the prior render (tableHost /
      // playHost are intentionally NOT cleared) — the mosBuilder idiom.
      const msg = err instanceof Error ? err.message : String(err);
      status.textContent = msg;
    }
  }

  // ─── Wire events ───────────────────────────────────────────────────────────
  subSelect.addEventListener("change", () => {
    sub = subSelect.value as SubMethod;
    // Relabel + restore this sub-method's remembered limit/order + swap the max cap.
    limitLbl.textContent = LIMIT_LABEL[sub];
    limitInput.setAttribute("aria-label", LIMIT_LABEL[sub]);
    limitInput.max = String(MAX_LIMIT[sub]); // per-sub-method kernel cap (#19).
    limitInput.value = String(limits[sub]);
    rebuild();
  });

  limitInput.addEventListener("input", () => {
    // min=1 matches the input's min attribute — below-min (negatives, 0) are rejected
    // at the UI (#19 hardening), leaving closure state untouched.
    const parsed = parseIntOrNull(limitInput.value, 1);
    if (parsed === null) return; // transient / below-min edit — leave state, no crash.
    limits[sub] = parsed;
    rebuild();
  });

  // Expose the current Scale for Send-to serialization (generate.md).
  root.getScale = () => currentScale;

  // Initial render — D-09 default (diamond odd-limit 9).
  rebuild();

  return root;
}
