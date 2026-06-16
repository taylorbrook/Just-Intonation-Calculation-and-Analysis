/**
 * generate-rank2 — Rank-2 regular-temperament method widget (GEN-06, Plan 07-02,
 * Phase 7 D-01 / D-02 / D-03 / D-04 / D-17 / D-18). The first SonicWeave-backed
 * generator on the Generate surface.
 *
 * Pattern-2 factory: (synth, opts?) => HTMLElement. Mirrors generateEd / generateCps —
 * closure-local state (no module-level state), a status region (role="status"
 * aria-live="polite"), and rebuild() that swaps the table + Play button via
 * replaceChildren. On an adapter error or an out-of-range up/down (D-18 cap) the
 * message lands in the status region and the prior render is PRESERVED (the
 * mosBuilder error idiom).
 *
 * This widget composes a SonicWeave SOURCE STRING from typed parameters and calls
 * the ONE Plan-01 adapter `scaleFromSonicWeave(src)`. It NEVER does rank-2 math
 * itself — the prelude `rank2(...)` + `POTE`/`TE`/`CTE` do the work.
 *
 * CONDITIONALLY TEMPERED (D-01..D-03): unlike generateEd (always tempered), rank-2
 * is tempered ONLY when the tuning is non-pure. The default landing is quarter-comma
 * meantone (D-02) — a literal-cents generator → tempered, cents-of-record table with
 * the "tempered" badge. The Pythagorean (pure-ratio) preset renders EXACT JI — the
 * full Ratio column, no badge. `isTempered()` returns the adapter's result-derived
 * boolean (NOT a hard true) so generate.md serializes Send-to correctly (D-03).
 *
 * Tuning select (D-03) {pure | quarter-comma | POTE | TE | CTE}:
 *   - pure          → `rank2(${gen}, ${up}, ${down})` (exact JI)
 *   - quarter-comma → `rank2(696.578428466209, ${up}, ${down})` (literal-cents D-02 default)
 *   - POTE/TE/CTE   → `rank2(${gen}, ${up}, ${down})\n${TUNING}([${commaList}])` (RESEARCH Pattern 2;
 *                      `gen` is the preset's genN/genD — Magic 5/4, Hanson 6/5 — NOT a hardcoded 3/2, CR-01)
 *   - custom + ratio gen → `rank2(${n}/${d}, ${up}, ${down})` (exact);
 *     custom + cents gen  → `rank2(${cents}, ${up}, ${down})` (tempered).
 *
 * Up/down generator counts (D-04) are SonicWeave's native `rank2` up/down arguments
 * and double as mode/size control (raising up adds a scale degree). A defense-in-
 * depth clamp (D-18, mirroring Phase-6 D-14) validates up ∈ [1, 53] and down ∈
 * [0, 53] BEFORE composing the source string; out-of-range → status message, prior
 * preview preserved.
 *
 * Three-layer purity: imports the scaleFromSonicWeave adapter (kernel) + Interval
 * type, the scaleTable / playScale output components, and the SynthHandle type.
 * No DOM-in-kernel bleed. All inputs/labels/status via createElement + textContent
 * (never innerHTML with dynamic content — T-07-06/T-07-09).
 */
import type { Scale } from "../lib/scale.js";
import { scaleFromSonicWeave } from "../lib/sonicweave.js";
import { parseIntOrNull } from "./generate-fields.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateRank2Opts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/**
 * A root element that exposes the widget's current Scale + a CONDITIONAL tempered
 * marker (from the adapter's `result.tempered`: pure rank-2 = false; POTE / quarter-
 * comma = true). Drives Send-to serialization (ratios vs cents-per-line, D-03).
 */
export interface GenerateRank2Element extends HTMLElement {
  /** The widget's current Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
  /** Result-derived: true iff the last successful render was tempered. NOT a literal. */
  isTempered(): boolean;
}

/** The tuning-optimization mode (D-03). `quarter-comma` is the D-02 default. */
type Tuning = "pure" | "quarter-comma" | "POTE" | "TE" | "CTE";

/**
 * A rank-2 preset (D-17 roster). `genN/genD` is the pure generator ratio; `comma`
 * is the temperament's defining comma (drives POTE/TE/CTE); `defaultTuning` is the
 * tuning the preset lands on when selected. `up`/`down` are the native rank2 counts.
 */
interface Rank2Preset {
  genN: number;
  genD: number;
  comma: string; // e.g. "81/80" — the comma list for POTE/TE/CTE.
  up: number;
  down: number;
  defaultTuning: Tuning;
}

/**
 * D-17 roster — well-known rank-2 temperaments with citable generator values.
 *   - pythagorean: pure 3/2 chain (exact JI — the no-temper anchor).
 *   - meantone:    quarter-comma meantone (D-02 default landing; literal-cents fifth).
 *   - porcupine:   generator ≈ 163.0¢ (mos(6,1)); comma 250/243 (RESEARCH A2).
 *   - magic:       generator ≈ 380.4¢ (major third chain); comma 3125/3072.
 *   - hanson:      generator ≈ 317.1¢ (minor third chain); comma 15625/15552 (kleisma).
 * The literal generator ratio (3/2 etc.) seeds the `pure` path; the comma seeds the
 * POTE/TE/CTE temper pattern. `meantone` lands on `quarter-comma` per D-02.
 */
const PRESETS: Record<string, Rank2Preset> = {
  pythagorean: { genN: 3, genD: 2, comma: "81/80", up: 5, down: 1, defaultTuning: "pure" },
  meantone: { genN: 3, genD: 2, comma: "81/80", up: 5, down: 1, defaultTuning: "quarter-comma" },
  porcupine: { genN: 3, genD: 2, comma: "250/243", up: 6, down: 0, defaultTuning: "POTE" },
  magic: { genN: 5, genD: 4, comma: "3125/3072", up: 6, down: 3, defaultTuning: "POTE" },
  hanson: { genN: 6, genD: 5, comma: "15625/15552", up: 6, down: 4, defaultTuning: "POTE" },
};

/** The quarter-comma meantone fifth as a literal-cents generator (D-02 — verified 696.578¢). */
const QUARTER_COMMA_FIFTH = "696.578428466209";

/** Defense-in-depth caps on the native rank2 counts (D-18, mirror Phase-6 D-14). */
const MAX_UP = 53;
const MAX_DOWN = 53;

export function generateRank2(
  synth: SynthHandle,
  opts: GenerateRank2Opts = {},
): GenerateRank2Element {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  // Default = quarter-comma meantone (D-02) so the first rebuild() renders tempered.
  let preset = "meantone";
  let tuning: Tuning = PRESETS.meantone!.defaultTuning; // "quarter-comma".
  // Generator (ratio n/d OR cents) — seeded from the preset; editable in custom mode.
  let genN = PRESETS.meantone!.genN;
  let genD = PRESETS.meantone!.genD;
  let genIsCents = false; // when true, the generator field holds a cents value (tempered).
  const genCents = 700; // only used when genIsCents (custom typed-cents path, reserved).
  let up = PRESETS.meantone!.up;
  let down = PRESETS.meantone!.down;

  let currentScale: Scale | null = null;
  let temperedFlag = true; // result-derived; default landing is tempered.

  const root = document.createElement("section") as GenerateRank2Element;
  root.className = "generate-rank2";

  const heading = document.createElement("h2");
  heading.textContent = "Rank-2 regular temperament"; // UI copy.
  root.appendChild(heading);

  // ─── Form row ──────────────────────────────────────────────────────────────
  const form = document.createElement("div");
  form.className = "generate-rank2__form";
  root.appendChild(form);

  // ─── Preset select (D-01) ──────────────────────────────────────────────────
  const presetCell = document.createElement("div");
  presetCell.className = "generate-rank2__field";
  const presetLbl = document.createElement("span");
  presetLbl.className = "generate-rank2__field-label";
  presetLbl.textContent = "Preset";
  presetCell.appendChild(presetLbl);
  const presetSelect = document.createElement("select");
  presetSelect.name = "rank2-preset";
  presetSelect.setAttribute("aria-label", "Rank-2 preset");
  for (const [value, label] of [
    ["pythagorean", "Pythagorean (pure 3/2)"],
    ["meantone", "Quarter-comma meantone"],
    ["porcupine", "Porcupine"],
    ["magic", "Magic"],
    ["hanson", "Hanson"],
    ["custom", "Custom"],
  ]) {
    const optionEl = document.createElement("option");
    optionEl.value = value!;
    optionEl.textContent = label!;
    presetSelect.appendChild(optionEl);
  }
  presetSelect.value = preset; // default quarter-comma meantone (D-02).
  presetCell.appendChild(presetSelect);
  form.appendChild(presetCell);

  // ─── Tuning select (D-03) ──────────────────────────────────────────────────
  const tuningCell = document.createElement("div");
  tuningCell.className = "generate-rank2__field";
  const tuningLbl = document.createElement("span");
  tuningLbl.className = "generate-rank2__field-label";
  tuningLbl.textContent = "Tuning";
  tuningCell.appendChild(tuningLbl);
  const tuningSelect = document.createElement("select");
  tuningSelect.name = "rank2-tuning";
  tuningSelect.setAttribute("aria-label", "Rank-2 tuning optimization");
  for (const [value, label] of [
    ["pure", "Pure (exact JI)"],
    ["quarter-comma", "Quarter-comma"],
    ["POTE", "POTE"],
    ["TE", "TE"],
    ["CTE", "CTE"],
  ]) {
    const optionEl = document.createElement("option");
    optionEl.value = value!;
    optionEl.textContent = label!;
    tuningSelect.appendChild(optionEl);
  }
  tuningSelect.value = tuning;
  tuningCell.appendChild(tuningSelect);
  form.appendChild(tuningCell);

  // ─── Generator ratio field (n/d, the makeRatioField idiom) ─────────────────
  const genCell = document.createElement("div");
  genCell.className = "generate-rank2__field";
  const genLbl = document.createElement("span");
  genLbl.className = "generate-rank2__field-label";
  genLbl.textContent = "Generator";
  genCell.appendChild(genLbl);
  const genNInput = document.createElement("input");
  genNInput.type = "number";
  genNInput.name = "rank2-gen-n";
  genNInput.min = "1";
  genNInput.step = "1";
  genNInput.value = String(genN);
  genNInput.setAttribute("aria-label", "Generator numerator");
  const genSlash = document.createElement("span");
  genSlash.className = "generate-rank2__slash";
  genSlash.textContent = "/";
  const genDInput = document.createElement("input");
  genDInput.type = "number";
  genDInput.name = "rank2-gen-d";
  genDInput.min = "1";
  genDInput.step = "1";
  genDInput.value = String(genD);
  genDInput.setAttribute("aria-label", "Generator denominator");
  genCell.appendChild(genNInput);
  genCell.appendChild(genSlash);
  genCell.appendChild(genDInput);
  form.appendChild(genCell);

  // ─── Up / down generator counts (D-04) ─────────────────────────────────────
  function makeCountField(
    labelText: string,
    nameAttr: string,
    value: number,
    onInput: (n: number) => void,
    min: string,
  ): HTMLElement {
    const cell = document.createElement("div");
    cell.className = "generate-rank2__field";
    const lbl = document.createElement("span");
    lbl.className = "generate-rank2__field-label";
    lbl.textContent = labelText;
    cell.appendChild(lbl);
    const input = document.createElement("input");
    input.type = "number";
    input.name = nameAttr;
    input.step = "1";
    input.min = min;
    input.value = String(value);
    input.setAttribute("aria-label", labelText);
    input.addEventListener("input", () => {
      // Pass the field's own min so below-min values are rejected at the UI (#19
      // hardening) — up has min=1, down has min=0.
      const parsed = parseIntOrNull(input.value, Number(min));
      if (parsed === null) return; // transient / below-min edit — leave state, no crash.
      onInput(parsed);
      rebuild();
    });
    cell.appendChild(input);
    return cell;
  }
  form.appendChild(
    makeCountField(
      "Up",
      "rank2-up",
      up,
      (n) => {
        up = n;
      },
      "1",
    ),
  );
  form.appendChild(
    makeCountField(
      "Down",
      "rank2-down",
      down,
      (n) => {
        down = n;
      },
      "0",
    ),
  );

  // ─── Status region (adapter / cap errors) ──────────────────────────────────
  const status = document.createElement("div");
  status.className = "generate-rank2__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts ──────────────────────────────────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-rank2__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-rank2__play-host";
  root.appendChild(playHost);

  /** Compose the SonicWeave source string for the current state (D-03 tuning map). */
  function composeSource(): string {
    if (tuning === "pure") {
      const gen = genIsCents ? String(genCents) : `${String(genN)}/${String(genD)}`;
      return `rank2(${gen}, ${String(up)}, ${String(down)})`;
    }
    if (tuning === "quarter-comma") {
      // The D-02 literal-cents historical default (≠ POTE).
      return `rank2(${QUARTER_COMMA_FIFTH}, ${String(up)}, ${String(down)})`;
    }
    // POTE / TE / CTE — the two-line temper pattern (RESEARCH Pattern 2).
    // CR-01 fix: the generator is the PRESET's genN/genD (Magic 5/4, Hanson 6/5,
    // custom n/d), NOT a hardcoded 3/2 — otherwise the displayed Generator field
    // and the produced scale disagree (a tempered chain of fifths). Build the gen
    // token exactly as the `pure` branch does so the two paths stay in lockstep.
    const seed = PRESETS[preset];
    const comma = seed ? seed.comma : "81/80";
    const gen = `${String(genN)}/${String(genD)}`;
    return `rank2(${gen}, ${String(up)}, ${String(down)})\n${tuning}([${comma}])`;
  }

  function rebuild(): void {
    // D-18 defense-in-depth: clamp the native rank2 counts BEFORE composing.
    if (up < 1 || up > MAX_UP) {
      status.textContent = `Up generator count must be between 1 and ${String(MAX_UP)}.`;
      return; // preserve prior preview.
    }
    if (down < 0 || down > MAX_DOWN) {
      status.textContent = `Down generator count must be between 0 and ${String(MAX_DOWN)}.`;
      return; // preserve prior preview.
    }

    const result = scaleFromSonicWeave(composeSource());
    if (result.error || result.scale === null) {
      // Adapter rejected the source — surface via textContent, never innerHTML;
      // PRESERVE the prior render (the mosBuilder idiom).
      status.textContent = result.error ?? "Could not build the scale.";
      return;
    }

    temperedFlag = result.tempered;
    tableHost.replaceChildren(
      scaleTable(result.scale, baseHz, { precision, tempered: result.tempered }),
    );
    playHost.replaceChildren(playScale(result.scale, synth, { baseHz }));
    currentScale = result.scale;
    status.textContent = "";
  }

  // ─── Wire events ───────────────────────────────────────────────────────────
  presetSelect.addEventListener("change", () => {
    preset = presetSelect.value;
    const seed = PRESETS[preset];
    if (seed) {
      genN = seed.genN;
      genD = seed.genD;
      genIsCents = false;
      up = seed.up;
      down = seed.down;
      tuning = seed.defaultTuning;
      // Sync the bound inputs.
      genNInput.value = String(genN);
      genDInput.value = String(genD);
      tuningSelect.value = tuning;
      const upInput = root.querySelector<HTMLInputElement>('input[name="rank2-up"]');
      const downInput = root.querySelector<HTMLInputElement>('input[name="rank2-down"]');
      if (upInput) upInput.value = String(up);
      if (downInput) downInput.value = String(down);
    }
    // Custom: keep the user's current generator/up/down/tuning.
    rebuild();
  });

  tuningSelect.addEventListener("change", () => {
    tuning = tuningSelect.value as Tuning;
    rebuild();
  });

  // Editing the generator field manually forces preset = custom (D-03). A typed
  // ratio is exact; a typed cents value would be tempered — here the field is a
  // ratio (n/d), so custom + ratio → exact JI.
  const onGenEdit = (): void => {
    // Generator n/d inputs both carry min=1 — reject below-min at the UI (#19).
    const n = parseIntOrNull(genNInput.value, 1);
    const d = parseIntOrNull(genDInput.value, 1);
    preset = "custom";
    presetSelect.value = "custom";
    if (n !== null) genN = n;
    if (d !== null) genD = d;
    genIsCents = false;
    // Manual generator entry shows the tuning as "pure" (typed ratio → exact, D-03).
    tuning = "pure";
    tuningSelect.value = "pure";
    rebuild();
  };
  genNInput.addEventListener("input", onGenEdit);
  genDInput.addEventListener("input", onGenEdit);

  // Expose the current Scale + result-derived tempered marker (D-03 Send-to).
  root.getScale = () => currentScale;
  root.isTempered = () => temperedFlag;

  // ─── Initial render — D-02 default (quarter-comma meantone). ───────────────
  rebuild();

  return root;
}
