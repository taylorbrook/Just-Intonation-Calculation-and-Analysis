/**
 * generate-ed — Equal-division method widget (GEN-05, SURF-06, Phase 6
 * D-01 / D-02 / D-05 / D-06 / D-09). The FIRST tempered family on the Generate
 * surface.
 *
 * Wired into the Generate picker under the "Regular / equal temperament" optgroup.
 * Pattern-2 factory: (synth, opts?) => HTMLElement. Mirrors mosBuilder + generateCps
 * + generateHarmonic + generateJiSet — closure-local state (no module-level state),
 * a status region (role="status" aria-live="polite"), and rebuild() that swaps the
 * table + Play button via replaceChildren. On a kernel RangeError the message lands
 * in the status region and the prior render is PRESERVED (the mosBuilder error idiom).
 *
 * Sub-method <select> (EDO / ED-n / best-JI-in-EDO). Default = EDO (D-09 divisions
 * 12). Swapping the sub-method swaps the relevant inputs into a params sub-region
 * (replaceChildren):
 *   - EDO     → divisions integer input; equave fixed at 2/1 (NO equave field).
 *   - ED-n    → divisions integer input + an editable equave n/d ratio field
 *               (the mosBuilder makeRatioField idiom, D-06). Default 13 over 3/1
 *               (Bohlen-Pierce ED3 tritave).
 *   - best-JI → divisions integer input + a limit input + a prime/odd kind select
 *               (reuses the existing bestJiInEdo kernel, D-05).
 *
 * TEMPERED, NOT LAUNDERED JI (SURF-06): ALL three sub-methods render via
 * `scaleTable(scale, baseHz, { tempered: true })` — the cents-only variant (no
 * Ratio column, D-01) with a visible "tempered" badge (D-02). EDO/ED-n come from
 * `edScale` (cents is the source of truth); best-JI-in-EDO is the closest-JI search
 * inside an EDO and is ALSO presented tempered per D-05 (its pitches snap to the
 * EDO grid). The widget marks itself tempered via `isTempered()` so generate.md
 * serializes Send-to as cents-per-line, never ratios (D-03).
 *
 * D-09 defaults: EDO 12; ED-n 13 over 3/1 (Bohlen-Pierce); best-JI-in-EDO 12 /
 * prime 5.
 *
 * Three-layer purity: imports the edScale / bestJiInEdo kernels + Interval by value,
 * the scaleTable / playScale output components, and the SynthHandle type. No DOM-in-
 * kernel bleed. All inputs/labels/status/badge via createElement + textContent
 * (never innerHTML with dynamic content — T-06-17); numeric inputs carry min/max as
 * a first clamp before the kernel's D-14 caps (T-06-16).
 */
import { Interval } from "../lib/interval.js";
import type { Scale } from "../lib/scale.js";
import { edScale } from "../lib/generators.js";
import { bestJiInEdo, type EdoJiKind } from "../lib/edo.js";
import { makeIntField, makeRatioField } from "./generate-fields.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateEdOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/**
 * A root element that also exposes the widget's current Scale + tempered marker
 * (for Send-to: tempered scales serialize cents-per-line, D-03).
 */
export interface GenerateEdElement extends HTMLElement {
  /** The widget's current Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
  /** True — every ED sub-method is tempered (cents-of-record). Drives cents-per-line Send-to (D-03). */
  isTempered(): boolean;
}

/** The three sub-methods. `edo` is the default (D-09). */
type SubMethod = "edo" | "ed-n" | "best-ji";

export function generateEd(synth: SynthHandle, opts: GenerateEdOpts = {}): GenerateEdElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  // Defaults per D-09; EDO is the default sub-method. Divisions is tracked
  // PER sub-method so each restores its own D-09 default (EDO 12, ED-n 13 =
  // Bohlen-Pierce, best-JI 12) and any subsequent user edit when switched away
  // and back (the generateJiSet per-sub-method-limit precedent).
  let sub: SubMethod = "edo";
  const divisionsBy: Record<SubMethod, number> = { edo: 12, "ed-n": 13, "best-ji": 12 };
  // ED-n equave (D-06) — default 3/1 (Bohlen-Pierce tritave).
  let equaveN = 3;
  let equaveD = 1;
  // best-JI-in-EDO params (D-05).
  let bestJiLimit = 5;
  let bestJiKind: EdoJiKind = "prime";

  let currentScale: Scale | null = null;

  const root = document.createElement("section") as GenerateEdElement;
  root.className = "generate-ed";

  const heading = document.createElement("h2");
  heading.textContent = "Equal divisions (EDO / ED-n)"; // UI copy.
  root.appendChild(heading);

  // ─── Sub-method select ─────────────────────────────────────────────────────
  const subForm = document.createElement("div");
  subForm.className = "generate-ed__form";

  const subCell = document.createElement("div");
  subCell.className = "generate-ed__field";
  const subLbl = document.createElement("span");
  subLbl.className = "generate-ed__field-label";
  subLbl.textContent = "Sub-method";
  subCell.appendChild(subLbl);

  const subSelect = document.createElement("select");
  subSelect.name = "ed-submethod";
  subSelect.setAttribute("aria-label", "Equal-division sub-method");
  for (const [value, label] of [
    ["edo", "EDO (equal division of 2/1)"],
    ["ed-n", "ED-n (equal division of any equave)"],
    ["best-ji", "Best JI in EDO"],
  ]) {
    const optionEl = document.createElement("option");
    optionEl.value = value!;
    optionEl.textContent = label!;
    subSelect.appendChild(optionEl);
  }
  subSelect.value = sub; // default EDO (D-09).
  subCell.appendChild(subSelect);
  subForm.appendChild(subCell);
  root.appendChild(subForm);

  // ─── Params sub-region (replaceChildren on sub-method change) ──────────────
  const paramsRegion = document.createElement("div");
  paramsRegion.className = "generate-ed__params";
  root.appendChild(paramsRegion);

  // ─── Status region (kernel RangeError announcements) ───────────────────────
  const status = document.createElement("div");
  status.className = "generate-ed__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + Play button ────────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-ed__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-ed__play-host";
  root.appendChild(playHost);

  // ── Small builders for the param inputs. The integer + ratio fields come from
  //    the shared generate-fields factory (#19), bound to this widget's BEM prefix
  //    + rebuild(); makeKindField is component-specific and stays local. ──

  /** A labelled <select> cell (the best-JI kind: prime / odd). */
  function makeKindField(): HTMLElement {
    const cell = document.createElement("div");
    cell.className = "generate-ed__field";
    const lbl = document.createElement("span");
    lbl.className = "generate-ed__field-label";
    lbl.textContent = "Limit kind";
    cell.appendChild(lbl);
    const select = document.createElement("select");
    select.name = "ed-bestji-kind";
    select.setAttribute("aria-label", "Best-JI limit kind");
    for (const [value, label] of [
      ["prime", "Prime limit"],
      ["odd", "Odd limit"],
    ]) {
      const optionEl = document.createElement("option");
      optionEl.value = value!;
      optionEl.textContent = label!;
      select.appendChild(optionEl);
    }
    select.value = bestJiKind;
    select.addEventListener("change", () => {
      bestJiKind = select.value as EdoJiKind;
      rebuild();
    });
    cell.appendChild(select);
    return cell;
  }

  /**
   * Rebuild the params sub-region for the active sub-method. EDO → divisions only;
   * ED-n → divisions + an editable equave ratio field (D-06); best-JI → divisions +
   * a limit input + a prime/odd kind select (D-05).
   */
  function renderParams(): void {
    // The divisions field always reads/writes this sub-method's own slot (D-09).
    const divisionsField = makeIntField(
      "generate-ed",
      "Divisions",
      "ed-divisions",
      divisionsBy[sub],
      (n) => {
        divisionsBy[sub] = n;
      },
      { min: "1", max: "1000" },
      { onCommit: rebuild },
    );
    if (sub === "edo") {
      paramsRegion.replaceChildren(divisionsField);
    } else if (sub === "ed-n") {
      paramsRegion.replaceChildren(
        divisionsField,
        makeRatioField(
          "generate-ed",
          "Equave",
          "ed-equave-n",
          "ed-equave-d",
          equaveN,
          equaveD,
          (n, d) => {
            equaveN = n;
            equaveD = d;
          },
          { onCommit: rebuild },
        ),
      );
    } else {
      // best-ji
      paramsRegion.replaceChildren(
        divisionsField,
        makeIntField(
          "generate-ed",
          "Limit",
          "ed-bestji-limit",
          bestJiLimit,
          (n) => {
            bestJiLimit = n;
          },
          { min: "1", max: "31" },
          { onCommit: rebuild },
        ),
        makeKindField(),
      );
    }
  }

  /** Dispatch on the active sub-method to the matching kernel builder. */
  function buildScale(): Scale {
    const divisions = divisionsBy[sub];
    switch (sub) {
      case "edo":
        return edScale(divisions, new Interval("2/1"));
      case "ed-n":
        return edScale(divisions, new Interval(`${String(equaveN)}/${String(equaveD)}`));
      case "best-ji":
        return bestJiInEdo(divisions, bestJiLimit, bestJiKind);
    }
  }

  function rebuild(): void {
    try {
      const scale = buildScale();
      // TEMPERED for ALL three sub-methods (D-01/D-02/D-05): cents-only table
      // (no Ratio column) + "tempered" badge — no float-derived ratio is ever
      // presented as exact JI (SURF-06).
      tableHost.replaceChildren(scaleTable(scale, baseHz, { precision, tempered: true }));
      playHost.replaceChildren(playScale(scale, synth, { baseHz }));
      currentScale = scale;
      status.textContent = "";
    } catch (err) {
      // Kernel rejected the inputs (D-14 caps: divisions/limit out of range, or a
      // degenerate equave). T-06-16/17: surface the message via textContent, never
      // innerHTML; PRESERVE the prior render (tableHost / playHost are intentionally
      // NOT cleared) — the mosBuilder idiom.
      const msg = err instanceof Error ? err.message : String(err);
      status.textContent = msg;
    }
  }

  // ─── Wire the sub-method swap ──────────────────────────────────────────────
  subSelect.addEventListener("change", () => {
    sub = subSelect.value as SubMethod;
    renderParams();
    rebuild();
  });

  // Expose the current Scale + tempered marker for Send-to serialization
  // (generate.md picks the cents-per-line branch when isTempered() is true, D-03).
  root.getScale = () => currentScale;
  root.isTempered = () => true;

  // ─── Initial render — D-09 default (EDO 12). ───────────────────────────────
  renderParams();
  rebuild();

  return root;
}
