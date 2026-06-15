/**
 * generate-harmonic — Harmonic-family method widget (GEN-02, GEN-03, Phase 6
 * D-04 / D-08 / D-09).
 *
 * The composer's everyday overtone generators wired into the Generate picker
 * under the "Harmonic & interval divisions" optgroup. Pattern-2 factory:
 * (synth, opts?) => HTMLElement. Mirrors mosBuilder + generateCps — closure-local
 * state (no module-level state), a status region (role="status" aria-live="polite"),
 * and rebuild() that swaps the table + Play button via replaceChildren. On a kernel
 * RangeError the message lands in the status region and the prior render is
 * PRESERVED (the mosBuilder error idiom).
 *
 * Sub-method <select> (harmonic / subharmonic / ADO / isoharmonic). Default =
 * harmonic (D-08): this widget is the page's default landing method, and harmonic
 * segment is its default sub-method. Swapping the sub-method swaps the relevant
 * inputs into a params sub-region (replaceChildren):
 *   - harmonic / subharmonic → lo + hi integer inputs + a "reduce to octave"
 *     checkbox (D-04, default OFF = literal overtone form).
 *   - ADO                    → divisions integer input + an equave ratio field
 *     (n/d, the mosBuilder makeRatioField idiom) and NO reduce toggle (ADO is
 *     intrinsically one equave by construction).
 *   - isoharmonic            → start + diff + count integer inputs + a "reduce to
 *     octave" checkbox (D-04, default OFF).
 *
 * D-09 defaults: harmonic 8..16, subharmonic 8..16, ADO 6 over 2/1, isoharmonic
 * 4:5:6:7 (start 4, diff 1, count 4).
 *
 * On any change: dispatch on the active sub-method to the matching harmonic.ts
 * builder, render via scaleTable + playScale, expose the current Scale via a
 * getScale() method on the root element (so generate.md can serialize it
 * ratio-per-line for Send-to — the generateCps precedent).
 *
 * Three-layer purity: imports the harmonic.ts builders + Interval by value, the
 * scaleTable / playScale output components, and the SynthHandle type. No DOM-in-
 * kernel bleed. All inputs/labels/status via createElement + textContent (never
 * innerHTML with dynamic content — T-06-14); numeric inputs carry min/max/step as
 * a first clamp before the kernel's D-14 caps (T-06-13).
 */
import { Interval } from "../lib/interval.js";
import type { Scale } from "../lib/scale.js";
import { harmonicSegment, subharmonicSegment, adoScale, isoharmonic } from "../lib/harmonic.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateHarmonicOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/** A root element that also exposes the widget's current Scale (for Send-to). */
export interface GenerateHarmonicElement extends HTMLElement {
  /** The widget's current harmonic-family Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
}

/** The four sub-methods. `harmonic` is the default (D-08). */
type SubMethod = "harmonic" | "subharmonic" | "ado" | "isoharmonic";

/**
 * Parse an input's value into a finite integer, or null when transiently empty /
 * non-integer. The caller leaves the closure-local state untouched on null so an
 * in-progress edit never crashes; the kernel's D-14 RangeError surfaces in the
 * status region if a committed out-of-range value reaches a builder (T-06-13).
 */
function parseIntOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = parseInt(trimmed, 10);
  return Number.isInteger(n) ? n : null;
}

export function generateHarmonic(
  synth: SynthHandle,
  opts: GenerateHarmonicOpts = {},
): GenerateHarmonicElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  // Defaults per D-09; harmonic is the default sub-method (D-08); reduce OFF (D-04).
  let sub: SubMethod = "harmonic";
  // Segment params (shared by harmonic + subharmonic — both lo/hi + reduce).
  let segLo = 8;
  let segHi = 16;
  let segReduce = false;
  // ADO params.
  let adoDivisions = 6;
  let adoEquaveN = 2;
  let adoEquaveD = 1;
  // Isoharmonic params.
  let isoStart = 4;
  let isoDiff = 1;
  let isoCount = 4;
  let isoReduce = false;

  let currentScale: Scale | null = null;

  const root = document.createElement("section") as GenerateHarmonicElement;
  root.className = "generate-harmonic";

  const heading = document.createElement("h2");
  heading.textContent = "Harmonic & interval divisions"; // UI copy.
  root.appendChild(heading);

  // ─── Sub-method select ─────────────────────────────────────────────────────
  const subForm = document.createElement("div");
  subForm.className = "generate-harmonic__form";

  const subCell = document.createElement("div");
  subCell.className = "generate-harmonic__field";
  const subLbl = document.createElement("span");
  subLbl.className = "generate-harmonic__field-label";
  subLbl.textContent = "Sub-method";
  subCell.appendChild(subLbl);

  const subSelect = document.createElement("select");
  subSelect.name = "harmonic-submethod";
  subSelect.setAttribute("aria-label", "Harmonic sub-method");
  for (const [value, label] of [
    ["harmonic", "Harmonic segment"],
    ["subharmonic", "Subharmonic segment"],
    ["ado", "Arithmetic division (ADO)"],
    ["isoharmonic", "Isoharmonic chord"],
  ]) {
    const optionEl = document.createElement("option");
    optionEl.value = value!;
    optionEl.textContent = label!;
    subSelect.appendChild(optionEl);
  }
  subSelect.value = sub; // default harmonic (D-08).
  subCell.appendChild(subSelect);
  subForm.appendChild(subCell);
  root.appendChild(subForm);

  // ─── Params sub-region (replaceChildren on sub-method change) ──────────────
  const paramsRegion = document.createElement("div");
  paramsRegion.className = "generate-harmonic__params";
  root.appendChild(paramsRegion);

  // ─── Status region (kernel RangeError announcements) ───────────────────────
  const status = document.createElement("div");
  status.className = "generate-harmonic__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + Play button ────────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-harmonic__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-harmonic__play-host";
  root.appendChild(playHost);

  // ── Small builders for the param inputs (createElement + textContent only). ──

  /** A labelled integer <input type="number"> cell. */
  function makeIntField(
    labelText: string,
    nameAttr: string,
    value: number,
    onInput: (n: number) => void,
    attrs: { min?: string; max?: string } = {},
  ): HTMLElement {
    const cell = document.createElement("div");
    cell.className = "generate-harmonic__field";
    const lbl = document.createElement("span");
    lbl.className = "generate-harmonic__field-label";
    lbl.textContent = labelText;
    cell.appendChild(lbl);
    const input = document.createElement("input");
    input.type = "number";
    input.name = nameAttr;
    input.step = "1";
    if (attrs.min !== undefined) input.min = attrs.min;
    if (attrs.max !== undefined) input.max = attrs.max;
    input.value = String(value);
    input.setAttribute("aria-label", labelText);
    input.addEventListener("input", () => {
      const parsed = parseIntOrNull(input.value);
      if (parsed === null) return; // transient edit — leave state, no crash.
      onInput(parsed);
      rebuild();
    });
    cell.appendChild(input);
    return cell;
  }

  /** A "reduce to octave" checkbox cell (D-04). */
  function makeReduceField(
    nameAttr: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
  ): HTMLElement {
    const wrap = document.createElement("label");
    wrap.className = "generate-harmonic__reduce";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.name = nameAttr;
    box.checked = checked;
    box.addEventListener("change", () => {
      onChange(box.checked);
      rebuild();
    });
    const label = document.createElement("span");
    label.textContent = "Reduce to octave";
    wrap.appendChild(box);
    wrap.appendChild(label);
    return wrap;
  }

  /**
   * The mosBuilder makeRatioField idiom — two number inputs sandwiching a "/"
   * glyph, for the ADO equave (n/d). Each input has its own `name` so happy-dom
   * selectors resolve unambiguously.
   */
  function makeRatioField(
    labelText: string,
    nNameAttr: string,
    dNameAttr: string,
    initialN: number,
    initialD: number,
    onChange: (n: number, d: number) => void,
  ): HTMLElement {
    const cell = document.createElement("div");
    cell.className = "generate-harmonic__field";
    const lbl = document.createElement("span");
    lbl.className = "generate-harmonic__field-label";
    lbl.textContent = labelText;
    cell.appendChild(lbl);

    const nInput = document.createElement("input");
    nInput.type = "number";
    nInput.name = nNameAttr;
    nInput.min = "1";
    nInput.step = "1";
    nInput.value = String(initialN);
    nInput.setAttribute("aria-label", `${labelText} numerator`);

    const slash = document.createElement("span");
    slash.className = "generate-harmonic__slash";
    slash.textContent = "/";

    const dInput = document.createElement("input");
    dInput.type = "number";
    dInput.name = dNameAttr;
    dInput.min = "1";
    dInput.step = "1";
    dInput.value = String(initialD);
    dInput.setAttribute("aria-label", `${labelText} denominator`);

    const handler = (): void => {
      const n = parseIntOrNull(nInput.value);
      const d = parseIntOrNull(dInput.value);
      if (n === null || d === null) return;
      onChange(n, d);
      rebuild();
    };
    nInput.addEventListener("input", handler);
    dInput.addEventListener("input", handler);

    cell.appendChild(nInput);
    cell.appendChild(slash);
    cell.appendChild(dInput);
    return cell;
  }

  /**
   * Rebuild the params sub-region for the active sub-method. Segment + isoharmonic
   * carry a reduce checkbox (D-04); ADO carries an equave ratio field and NO reduce
   * checkbox (intrinsically one equave).
   */
  function renderParams(): void {
    if (sub === "harmonic" || sub === "subharmonic") {
      paramsRegion.replaceChildren(
        makeIntField(
          "Lowest harmonic",
          "harmonic-lo",
          segLo,
          (n) => {
            segLo = n;
          },
          { min: "1" },
        ),
        makeIntField(
          "Highest harmonic",
          "harmonic-hi",
          segHi,
          (n) => {
            segHi = n;
          },
          { min: "2" },
        ),
        makeReduceField("harmonic-reduce", segReduce, (c) => {
          segReduce = c;
        }),
      );
    } else if (sub === "ado") {
      paramsRegion.replaceChildren(
        makeIntField(
          "Divisions",
          "ado-divisions",
          adoDivisions,
          (n) => {
            adoDivisions = n;
          },
          { min: "1" },
        ),
        makeRatioField("Equave", "ado-equave-n", "ado-equave-d", adoEquaveN, adoEquaveD, (n, d) => {
          adoEquaveN = n;
          adoEquaveD = d;
        }),
      );
    } else {
      // isoharmonic
      paramsRegion.replaceChildren(
        makeIntField(
          "Start",
          "iso-start",
          isoStart,
          (n) => {
            isoStart = n;
          },
          { min: "1" },
        ),
        makeIntField(
          "Difference",
          "iso-diff",
          isoDiff,
          (n) => {
            isoDiff = n;
          },
          { min: "1" },
        ),
        makeIntField(
          "Count",
          "iso-count",
          isoCount,
          (n) => {
            isoCount = n;
          },
          { min: "1" },
        ),
        makeReduceField("iso-reduce", isoReduce, (c) => {
          isoReduce = c;
        }),
      );
    }
  }

  /** Dispatch on the active sub-method to the matching harmonic.ts builder. */
  function buildScale(): Scale {
    switch (sub) {
      case "harmonic":
        return harmonicSegment(segLo, segHi, segReduce);
      case "subharmonic":
        return subharmonicSegment(segLo, segHi, segReduce);
      case "ado":
        return adoScale(adoDivisions, new Interval(`${String(adoEquaveN)}/${String(adoEquaveD)}`));
      case "isoharmonic":
        return isoharmonic(isoStart, isoDiff, isoCount, isoReduce);
    }
  }

  function rebuild(): void {
    try {
      const scale = buildScale();
      tableHost.replaceChildren(scaleTable(scale, baseHz, { precision }));
      playHost.replaceChildren(playScale(scale, synth, { baseHz }));
      currentScale = scale;
      status.textContent = "";
    } catch (err) {
      // Kernel rejected the inputs (D-14 caps / degenerate bounds). T-06-13/14:
      // surface the message via textContent, never innerHTML; PRESERVE the prior
      // render (tableHost / playHost are intentionally NOT cleared) — mosBuilder idiom.
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

  // Expose the current Scale for Send-to serialization (generate.md).
  root.getScale = () => currentScale;

  // ─── Initial render — D-08/D-09 default (harmonic segment 8..16). ──────────
  renderParams();
  rebuild();

  return root;
}
