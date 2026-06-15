/**
 * generate-welltemp — Historical well-temperament method widget (GEN-07, Plan 07-02,
 * Phase 7 D-05 / D-06 / D-07 / D-08). The second SonicWeave-backed generator on the
 * Generate surface, alongside generate-rank2.
 *
 * Pattern-2 factory: (synth, opts?) => HTMLElement. Mirrors generateEd / generateRank2 —
 * closure-local state (no module-level state), a status region (role="status"
 * aria-live="polite"), and rebuild() that swaps the table + Play button via
 * replaceChildren. On an adapter error the message lands in the status region and the
 * prior render is PRESERVED (the mosBuilder error idiom).
 *
 * This widget composes a SonicWeave SOURCE STRING from a per-fifth comma-fraction
 * vector and calls the ONE Plan-01 adapter `scaleFromSonicWeave(src)`. It NEVER does
 * the fifth-chain tempering itself — the prelude `wellTemperament(...)` does the work.
 *
 * ALWAYS TEMPERED (well-temperament is cents-of-record, like generateEd):
 * `isTempered() => true` and `scaleTable(scale, baseHz, { tempered: true })` verbatim.
 * The default landing is Vallotti (D-06) — six 1/6-Pythagorean-comma fifths + six pure.
 *
 * EXPLICIT PYTHAGOREAN COMMA (D-07, Pitfall 2): the composed source ALWAYS passes
 * `531441/524288` as the comma argument. The prelude default is the SYNTONIC comma
 * 81/80, which would silently produce a different (wrong) scale — there is NO comma
 * input field; custom syntonic temperaments go through the free-text escape hatch.
 *
 * Preset roster (D-05/D-08, A1 sourcing): each preset's commaFractions vector is the
 * 11-element per-fifth list along the chain of fifths. This build ships the two
 * presets whose vectors cross-check EXACTLY against the repo's own authoritative
 * src/pages/well-temperament.md (Vallotti + Werckmeister III) + Custom mode. The
 * remaining D-08 names (Kirnberger III — a mixed syntonic+schisma scheme not
 * expressible with a single Pythagorean comma; Young I/II, Neidhardt, Kellner,
 * Lehman "Bach" — whose exact chain offsets could not be verified against published
 * degree cents this phase) are deliberately omitted per the plan's "smaller verified
 * roster over a plausible-but-wrong vector" directive; custom mode covers them.
 *
 * Custom mode (D-05): the preset→custom swap (renderParams / replaceChildren) exposes
 * 11 per-fifth fraction fields (each supports negative numerators like -1/6); editing
 * any forces preset = "custom".
 *
 * Three-layer purity: imports the scaleFromSonicWeave adapter (kernel) + Interval
 * type, the scaleTable / playScale output components, and the SynthHandle type. All
 * inputs/labels/status via createElement + textContent (never innerHTML — T-07-06/09).
 */
import type { Scale } from "../lib/scale.js";
import { scaleFromSonicWeave } from "../lib/sonicweave.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateWelltempOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/**
 * A root element exposing the widget's current Scale + a (constant true) tempered
 * marker. Well-temperament is cents-of-record, so Send-to always serializes
 * cents-per-line (D-03), never ratios.
 */
export interface GenerateWelltempElement extends HTMLElement {
  /** The widget's current Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
  /** Always true — well-temperament is cents-of-record. Drives cents-per-line Send-to. */
  isTempered(): boolean;
}

/** A per-fifth comma fraction as a numerator/denominator pair (e.g. -1 / 6). */
interface Fraction {
  n: number;
  d: number;
}

/**
 * The 11-element per-fifth comma-fraction vector for a preset. Each entry is the
 * fraction of the Pythagorean comma by which that fifth (along the chain from the
 * 3/2 generator) is narrowed (negative) or widened (positive); 0 = pure.
 *
 * Chain index (matches src/pages/well-temperament.md): 0 = C–G, 1 = G–D, 2 = D–A,
 * 3 = A–E, 4 = E–B, 5 = B–F♯, … 10 = B♭–F (the 12th fifth F–C closes the circle).
 */
type CommaVector = [
  Fraction,
  Fraction,
  Fraction,
  Fraction,
  Fraction,
  Fraction,
  Fraction,
  Fraction,
  Fraction,
  Fraction,
  Fraction,
];

const PURE: Fraction = { n: 0, d: 1 };
const sixth: Fraction = { n: -1, d: 6 };
const quarter: Fraction = { n: -1, d: 4 };

/**
 * Verified preset roster (D-08 subset, A1 sourcing). Both vectors cross-check
 * EXACTLY against src/pages/well-temperament.md.
 *
 *   - vallotti (D-06 default): six 1/6-Pythagorean-comma fifths (chain 0–5) + six
 *     pure. 6 pure / 6 tempered. Cites Wikipedia "Vallotti temperament" + tonalsoft.
 *   - werckmeister3: four 1/4-Pythagorean-comma fifths at chain positions 0,1,2,5
 *     (C–G, G–D, D–A, B–F♯) + eight pure. 8 pure / 4 tempered. Cites Werckmeister
 *     1691 + Wikipedia "Werckmeister temperament".
 */
const PRESETS: Record<string, CommaVector> = {
  vallotti: [sixth, sixth, sixth, sixth, sixth, sixth, PURE, PURE, PURE, PURE, PURE],
  werckmeister3: [quarter, quarter, quarter, PURE, PURE, quarter, PURE, PURE, PURE, PURE, PURE],
};

/** The Pythagorean comma — passed EXPLICITLY to wellTemperament (D-07, Pitfall 2). */
const PYTHAGOREAN_COMMA = "531441/524288";

/**
 * Parse an input's value into a finite integer (may be negative for numerators), or
 * null when transiently empty / non-integer. The caller leaves closure state
 * untouched on null so an in-progress edit never crashes.
 */
function parseIntOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = parseInt(trimmed, 10);
  return Number.isInteger(n) ? n : null;
}

export function generateWelltemp(
  synth: SynthHandle,
  opts: GenerateWelltempOpts = {},
): GenerateWelltempElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  // Default = Vallotti (D-06). `fractions` is a deep copy so custom edits never
  // mutate the shared PRESETS vector.
  let preset = "vallotti";
  let fractions: Fraction[] = PRESETS.vallotti!.map((f) => ({ ...f }));

  let currentScale: Scale | null = null;

  const root = document.createElement("section") as GenerateWelltempElement;
  root.className = "generate-welltemp";

  const heading = document.createElement("h2");
  heading.textContent = "Well-temperament"; // UI copy.
  root.appendChild(heading);

  // ─── Preset select (D-05) ──────────────────────────────────────────────────
  const form = document.createElement("div");
  form.className = "generate-welltemp__form";
  root.appendChild(form);

  const presetCell = document.createElement("div");
  presetCell.className = "generate-welltemp__field";
  const presetLbl = document.createElement("span");
  presetLbl.className = "generate-welltemp__field-label";
  presetLbl.textContent = "Preset";
  presetCell.appendChild(presetLbl);
  const presetSelect = document.createElement("select");
  presetSelect.name = "welltemp-preset";
  presetSelect.setAttribute("aria-label", "Well-temperament preset");
  for (const [value, label] of [
    ["vallotti", "Vallotti"],
    ["werckmeister3", "Werckmeister III"],
    ["custom", "Custom"],
  ]) {
    const optionEl = document.createElement("option");
    optionEl.value = value!;
    optionEl.textContent = label!;
    presetSelect.appendChild(optionEl);
  }
  presetSelect.value = preset; // default Vallotti (D-06).
  presetCell.appendChild(presetSelect);
  form.appendChild(presetCell);

  // ─── Custom per-fifth fraction params (shown only in custom mode, D-05) ─────
  const paramsRegion = document.createElement("div");
  paramsRegion.className = "generate-welltemp__params";
  root.appendChild(paramsRegion);

  // ─── Status region (adapter errors) ────────────────────────────────────────
  const status = document.createElement("div");
  status.className = "generate-welltemp__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts ──────────────────────────────────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-welltemp__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-welltemp__play-host";
  root.appendChild(playHost);

  /**
   * A labelled signed-fraction field (numerator may be negative, e.g. -1/6) for one
   * fifth in the chain. Editing either input forces preset = "custom".
   */
  function makeFractionField(index: number, frac: Fraction): HTMLElement {
    const cell = document.createElement("div");
    cell.className = "generate-welltemp__field generate-welltemp__fifth";
    const lbl = document.createElement("span");
    lbl.className = "generate-welltemp__field-label";
    lbl.textContent = `Fifth ${String(index + 1)}`;
    cell.appendChild(lbl);

    const nInput = document.createElement("input");
    nInput.type = "number";
    nInput.name = `welltemp-fifth-${String(index)}-n`;
    nInput.step = "1";
    nInput.value = String(frac.n);
    nInput.setAttribute("aria-label", `Fifth ${String(index + 1)} comma-fraction numerator`);

    const slash = document.createElement("span");
    slash.className = "generate-welltemp__slash";
    slash.textContent = "/";

    const dInput = document.createElement("input");
    dInput.type = "number";
    dInput.name = `welltemp-fifth-${String(index)}-d`;
    dInput.min = "1";
    dInput.step = "1";
    dInput.value = String(frac.d);
    dInput.setAttribute("aria-label", `Fifth ${String(index + 1)} comma-fraction denominator`);

    const handler = (): void => {
      const n = parseIntOrNull(nInput.value);
      const d = parseIntOrNull(dInput.value);
      // Editing a fraction is a user edit → custom mode.
      preset = "custom";
      presetSelect.value = "custom";
      if (n !== null) fractions[index]!.n = n;
      if (d !== null) fractions[index]!.d = d;
      rebuild();
    };
    nInput.addEventListener("input", handler);
    dInput.addEventListener("input", handler);

    cell.appendChild(nInput);
    cell.appendChild(slash);
    cell.appendChild(dInput);
    return cell;
  }

  /** Show the 11 per-fifth fraction fields in custom mode; hide them otherwise. */
  function renderParams(): void {
    if (preset === "custom") {
      paramsRegion.replaceChildren(...fractions.map((f, i) => makeFractionField(i, f)));
    } else {
      paramsRegion.replaceChildren();
    }
  }

  /** Format a fraction for the SonicWeave source. d===1 → bare integer; else n/d. */
  function fmtFraction(f: Fraction): string {
    return f.d === 1 ? String(f.n) : `${String(f.n)}/${String(f.d)}`;
  }

  /** Compose the SonicWeave wellTemperament source with the EXPLICIT comma (D-07). */
  function composeSource(): string {
    const list = fractions.map(fmtFraction).join(", ");
    return `wellTemperament([${list}], ${PYTHAGOREAN_COMMA})`;
  }

  function rebuild(): void {
    const result = scaleFromSonicWeave(composeSource());
    if (result.error || result.scale === null) {
      // Adapter rejected the source (e.g. a zero denominator) — surface via
      // textContent, never innerHTML; PRESERVE the prior render (mosBuilder idiom).
      status.textContent = result.error ?? "Could not build the scale.";
      return;
    }
    tableHost.replaceChildren(scaleTable(result.scale, baseHz, { precision, tempered: true }));
    playHost.replaceChildren(playScale(result.scale, synth, { baseHz }));
    currentScale = result.scale;
    status.textContent = "";
  }

  // ─── Wire events ───────────────────────────────────────────────────────────
  presetSelect.addEventListener("change", () => {
    preset = presetSelect.value;
    const seed = PRESETS[preset];
    if (seed) {
      // Deep-copy so custom edits never mutate the shared vector.
      fractions = seed.map((f) => ({ ...f }));
    }
    // Custom: keep the current fractions (they become editable).
    renderParams();
    rebuild();
  });

  // Expose the current Scale + the constant tempered marker (D-03 Send-to).
  root.getScale = () => currentScale;
  root.isTempered = () => true;

  // ─── Initial render — D-06 default (Vallotti). ─────────────────────────────
  renderParams();
  rebuild();

  return root;
}
