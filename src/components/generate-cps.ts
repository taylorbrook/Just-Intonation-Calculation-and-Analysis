/**
 * generate-cps — Combination Product Set method widget (GEN-01, Phase 6 D-08/D-09/D-13).
 *
 * The flagship JI combinatorial generator wired into the Generate picker under the
 * "JI combinatorial" optgroup. Pattern-2 factory: (synth, opts?) => HTMLElement.
 * Mirrors mosBuilder — closure-local state (no module-level state), a status region
 * (role="status" aria-live="polite"), and rebuild() that swaps the table + Play
 * button via replaceChildren. On a kernel RangeError the message lands in the status
 * region and the prior render is PRESERVED (the mosBuilder error idiom).
 *
 * Inputs:
 *   - Factor-set CHIP input (D-13): an integer input + "Add" button that pushes a
 *     positive-integer chip; each chip has a "×" remove control. Chips are built
 *     with createElement + textContent ONLY (T-06-10: never innerHTML) and the
 *     integer is parseInt-validated (positive integer) BEFORE becoming a chip.
 *     The factor list is closure-local `number[]`.
 *   - Preset <select> (D-09): Hexany / Dekany / Eikosany / Custom. Selecting a
 *     preset SETS the chips + k:
 *         Hexany   → [1,3,5,7]      k=2
 *         Dekany   → [1,3,5,7,9]    k=2
 *         Eikosany → [1,3,5,7,9,11] k=3
 *     "Custom" keeps the user's chips and exposes a k input.
 *
 * On any change: factors = chips.map(n => new Interval(`${n}/1`)); cps(factors, k);
 * render via scaleTable + playScale. The kernel's D-14 caps (factors.length ≤ 12,
 * 1 ≤ k ≤ length) throw a RangeError that surfaces in the status region without
 * crashing (T-06-11). The current Scale is exposed via a `getScale()` method on the
 * root element so generate.md can serialize it ratio-per-line for Send-to.
 *
 * Three-layer purity: imports the cps() kernel + Interval by value, the scaleTable /
 * playScale output components, and the SynthHandle type. No DOM-in-kernel bleed.
 */
import { Interval } from "../lib/interval.js";
import type { Scale } from "../lib/scale.js";
import { cps } from "../lib/cps.js";
import { parsePositiveInt } from "./generate-fields.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateCpsOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/** A root element that also exposes the widget's current Scale (for Send-to). */
export interface GenerateCpsElement extends HTMLElement {
  /** The widget's current CPS Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
}

/** D-09 preset seeds — the pedagogical showcase set. */
const PRESETS: Record<string, { factors: number[]; k: number }> = {
  hexany: { factors: [1, 3, 5, 7], k: 2 },
  dekany: { factors: [1, 3, 5, 7, 9], k: 2 },
  eikosany: { factors: [1, 3, 5, 7, 9, 11], k: 3 },
};

export function generateCps(synth: SynthHandle, opts: GenerateCpsOpts = {}): GenerateCpsElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // Closure-local state — no module-level state (Pattern 2). Default = Hexany.
  let factors: number[] = [...PRESETS.hexany!.factors];
  let k = PRESETS.hexany!.k;
  let preset = "hexany";
  let currentScale: Scale | null = null;

  const root = document.createElement("section") as GenerateCpsElement;
  root.className = "generate-cps";

  const heading = document.createElement("h2");
  heading.textContent = "Combination Product Set"; // UI copy.
  root.appendChild(heading);

  // ─── Preset select (D-09) ─────────────────────────────────────────────────
  const form = document.createElement("div");
  form.className = "generate-cps__form";

  const presetCell = document.createElement("div");
  presetCell.className = "generate-cps__field";
  const presetLbl = document.createElement("span");
  presetLbl.className = "generate-cps__field-label";
  presetLbl.textContent = "Preset";
  presetCell.appendChild(presetLbl);

  const presetSelect = document.createElement("select");
  presetSelect.name = "cps-preset";
  presetSelect.setAttribute("aria-label", "CPS preset");
  for (const [value, label] of [
    ["hexany", "Hexany"],
    ["dekany", "Dekany"],
    ["eikosany", "Eikosany"],
    ["custom", "Custom"],
  ]) {
    const optionEl = document.createElement("option");
    optionEl.value = value!;
    optionEl.textContent = label!;
    presetSelect.appendChild(optionEl);
  }
  presetSelect.value = preset; // default Hexany.
  presetCell.appendChild(presetSelect);
  form.appendChild(presetCell);

  // ─── k input (D-09 Custom) ────────────────────────────────────────────────
  // Created once; shown only in Custom mode (the preset families fix their own k).
  const kCell = document.createElement("div");
  kCell.className = "generate-cps__field generate-cps__k";
  const kLbl = document.createElement("span");
  kLbl.className = "generate-cps__field-label";
  kLbl.textContent = "Choose k";
  kCell.appendChild(kLbl);
  const kInput = document.createElement("input");
  kInput.type = "number";
  kInput.name = "cps-k";
  kInput.min = "1";
  kInput.step = "1";
  kInput.value = String(k);
  kInput.setAttribute("aria-label", "Choose k");
  kCell.appendChild(kInput);
  form.appendChild(kCell);

  root.appendChild(form);

  // ─── Factor-set chip input (D-13) ─────────────────────────────────────────
  const chipForm = document.createElement("div");
  chipForm.className = "generate-cps__chip-form";

  const chipLbl = document.createElement("span");
  chipLbl.className = "generate-cps__field-label";
  chipLbl.textContent = "Factors";
  chipForm.appendChild(chipLbl);

  // The chip container — chips render here via createElement + textContent ONLY.
  const chipList = document.createElement("div");
  chipList.className = "generate-cps__chips";
  chipForm.appendChild(chipList);

  const chipInput = document.createElement("input");
  chipInput.type = "number";
  chipInput.name = "cps-factor";
  chipInput.min = "1";
  chipInput.step = "1";
  chipInput.placeholder = "e.g. 9";
  chipInput.setAttribute("aria-label", "Add a factor (positive integer)");
  chipForm.appendChild(chipInput);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.name = "cps-add";
  addBtn.className = "generate-cps__add";
  addBtn.textContent = "Add";
  chipForm.appendChild(addBtn);

  root.appendChild(chipForm);

  // ─── Status region (kernel RangeError announcements) ──────────────────────
  const status = document.createElement("div");
  status.className = "generate-cps__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + Play button ───────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-cps__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-cps__play-host";
  root.appendChild(playHost);

  // Show/hide the k input depending on preset (Custom exposes it; the named
  // families fix their own k so it's hidden to avoid implying it's editable).
  function syncKVisibility(): void {
    kCell.style.display = preset === "custom" ? "" : "none";
  }

  // Re-render the chip list from the closure-local `factors`. Each chip is a
  // createElement span with the integer as textContent (T-06-10: never innerHTML)
  // plus a "×" remove button that splices that index and rebuilds.
  function renderChips(): void {
    chipList.replaceChildren();
    factors.forEach((n, i) => {
      const chip = document.createElement("span");
      chip.className = "generate-cps__chip";

      const label = document.createElement("span");
      label.className = "generate-cps__chip-label";
      label.textContent = String(n); // literal text — XSS-safe.
      chip.appendChild(label);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "generate-cps__chip-remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove factor ${String(n)}`);
      remove.addEventListener("click", () => {
        factors.splice(i, 1);
        // Removing a chip is a user edit → Custom mode (no longer a named preset).
        preset = "custom";
        presetSelect.value = "custom";
        syncKVisibility();
        renderChips();
        rebuild();
      });
      chip.appendChild(remove);

      chipList.appendChild(chip);
    });
  }

  function rebuild(): void {
    const ivs = factors.map((n) => new Interval(`${String(n)}/1`));
    try {
      const scale = cps(ivs, k);
      tableHost.replaceChildren(scaleTable(scale, baseHz, { precision }));
      playHost.replaceChildren(playScale(scale, synth, { baseHz }));
      currentScale = scale;
      status.textContent = "";
    } catch (err) {
      // Kernel rejected the inputs (D-14 caps: too many factors, k out of range).
      // T-06-11: surface the message, never innerHTML; PRESERVE the prior render
      // (tableHost / playHost are intentionally NOT cleared) — the mosBuilder idiom.
      const msg = err instanceof Error ? err.message : String(err);
      status.textContent = msg;
    }
  }

  // ─── Wire events ───────────────────────────────────────────────────────────
  addBtn.addEventListener("click", () => {
    const n = parsePositiveInt(chipInput.value);
    if (n === null) return; // invalid → no chip, no crash (T-06-10).
    factors.push(n);
    chipInput.value = "";
    // Adding a chip is a user edit → Custom mode.
    preset = "custom";
    presetSelect.value = "custom";
    syncKVisibility();
    renderChips();
    rebuild();
  });

  presetSelect.addEventListener("change", () => {
    preset = presetSelect.value;
    const seed = PRESETS[preset];
    if (seed) {
      factors = [...seed.factors];
      k = seed.k;
      kInput.value = String(k);
    }
    // Custom: keep the user's chips + k (the k input becomes visible).
    syncKVisibility();
    renderChips();
    rebuild();
  });

  kInput.addEventListener("input", () => {
    // STRICT integer parse (#19 hardening): the shared parsePositiveInt rejects
    // "3.5"/"3abc"/"1e3" instead of the old lenient parseInt that coerced "3.5"→3.
    // Leave `k` untouched on a transiently-empty/invalid field; the kernel's
    // RangeError still surfaces in the status region if the committed value exceeds
    // the upper bound (1 ≤ k ≤ factors.length — T-06-11).
    const parsed = parsePositiveInt(kInput.value);
    if (parsed !== null) {
      k = parsed;
      rebuild();
    }
  });

  // Expose the current Scale for Send-to serialization (generate.md).
  root.getScale = () => currentScale;

  // Initial render — D-09 default seed (Hexany).
  syncKVisibility();
  renderChips();
  rebuild();

  return root;
}
