/**
 * generate-meru — Wilson recurrence / metallic (Mt. Meru) generator widget
 * (GEN-10, Phase 8 D-09 / D-10 / D-11 / D-12 / D-19).
 *
 * Pattern-2 factory: (synth, opts?) => HTMLElement. Mirrors generateCps's preset
 * <select> idiom + generateFokker's makeIntField + status-region/preserve-prior-
 * preview discipline — closure-local state (no module-level state), a status region
 * (role="status" aria-live="polite"), and rebuild() that swaps the table + Play
 * button via replaceChildren. On a kernel RangeError the message lands in the status
 * region and the prior render is PRESERVED (the generateFokker D-16 idiom).
 *
 * EXACT RATIONAL, NOT TEMPERED (D-19 / SURF-06): the Wilson recurrence convergents
 * `x_i / x_{i-1}` are EXACT BigInt ratios. ALL renders go through
 * `scaleTable(scale, baseHz, { precision })` WITHOUT the tempered flag — the
 * 4-column "Ratio" path (generate-cps.ts / generate-fokker.ts idiom). The widget
 * marks itself `isTempered() => false` so generate.md serializes Send-to as
 * ratios-per-line, never cents.
 *
 * METALLIC LIMIT IS A STANDALONE READOUT (D-09 / SURF-06 / Pitfall #4): the
 * irrational metallic-mean limit `metallicLimitCents(a,b)` is rendered as a SEPARATE
 * tempered-flagged readout BESIDE the table — the convergents CONVERGE to it but it
 * is NEVER admitted as a scale degree. The readout is the ONLY tempered surface in
 * the widget; the scale itself stays exact rational.
 *
 * PRESETS (D-10) — the metallic means, EACH cited (A3, the Phase-7 Vallotti-precedent
 * discipline). The metallic-mean family `(a + √(a²+4b))/2` is documented by Erv Wilson's
 * Mt. Meru / "Scale Tree" work (anaphoria.com) and the Xenharmonic Wiki "Metallic MOS" /
 * "Recurrent sequence" pages (en.xen.wiki). golden (1,1) = φ, silver (2,1), bronze (3,1),
 * copper (4,1) are the canonical named metallic means. We ship ONLY these sourced metallic
 * presets rather than fabricate un-citable Wilson seed pairs (A3 — fail closed on sources).
 *   Sources:
 *     - Erv Wilson, "Mt. Meru" / scale-tree diagrams — https://www.anaphoria.com/meruone.pdf
 *     - Xenharmonic Wiki, "Metallic MOS" — https://en.xen.wiki/w/Metallic_MOS
 *     - Xenharmonic Wiki, "Recurrent sequence" — https://en.xen.wiki/w/Recurrent_sequence
 *
 * Defense-in-depth (T-08-09 / D-11): seed / coefficient / term-count via makeIntField.
 * The term-count field's `max` mirrors MAX_MERU_TERMS, but the REAL enforcement is the
 * meruScale RangeError (term-count > cap, seed/coefficient magnitude overflow) caught in
 * rebuild() → status region, prior preview preserved. No crash.
 *
 * Three-layer purity: imports the meruScale / metallicLimitCents kernel + the
 * scaleTable / playScale output components + the SynthHandle type. No DOM-in-kernel
 * bleed. All inputs / labels / status / readout via createElement + textContent (never
 * the unsafe-HTML sink with dynamic content — T-08-11).
 */
import type { Scale } from "../lib/scale.js";
import { meruScale, metallicLimitCents, MAX_MERU_TERMS } from "../lib/meru.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateMeruOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/**
 * A root element that also exposes the widget's current Scale + tempered marker.
 * isTempered() is ALWAYS false — Wilson convergents are exact rational (drives
 * ratios-per-line Send-to). The metallic limit is a SEPARATE tempered readout.
 */
export interface GenerateMeruElement extends HTMLElement {
  /** The widget's current exact-rational convergent Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
  /** False — Wilson convergents are exact rational (no cents-of-record in the scale). */
  isTempered(): boolean;
}

/**
 * D-10 metallic-mean presets — the canonical named metallic means, each sourced
 * (A3). Coefficients/seeds are the standard recurrence form `x_n = a·x_{n-1} + b·x_{n-2}`
 * with seeds 1,1; the limit is `(a + √(a²+4b))/2`.
 */
const PRESETS: Record<string, { a: bigint; b: bigint; x0: bigint; x1: bigint }> = {
  golden: { a: 1n, b: 1n, x0: 1n, x1: 1n }, // φ ≈ 1.618 → 833.09¢ (Fibonacci)
  silver: { a: 2n, b: 1n, x0: 1n, x1: 1n }, // δ_S ≈ 2.414 → 1525.86¢ (Pell)
  bronze: { a: 3n, b: 1n, x0: 1n, x1: 1n }, // ≈ 3.303 → 2068.41¢
  copper: { a: 4n, b: 1n, x0: 1n, x1: 1n }, // ≈ 4.236
};

/** Default term-count for the golden landing (D-12): 7 convergents (well-converged). */
const DEFAULT_TERMS = 7;

/**
 * Parse a chip/field string into a strictly-positive BigInt, or null if invalid.
 * Seeds and coefficients are positive integers with NO prime-limit ceiling, so they
 * are validated as BigInt (CLAUDE.md disqualifies Number-backed ratio paths — a huge
 * coefficient must be preserved exactly, not rounded).
 */
function parsePositiveBigInt(raw: string): bigint | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = BigInt(trimmed);
  if (n < 1n) return null;
  return n;
}

export function generateMeru(synth: SynthHandle, opts: GenerateMeruOpts = {}): GenerateMeruElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  // Default = golden / Fibonacci (D-12): a=1, b=1, seeds 1,1, 7 convergents.
  let a: bigint = PRESETS.golden!.a;
  let b: bigint = PRESETS.golden!.b;
  let x0: bigint = PRESETS.golden!.x0;
  let x1: bigint = PRESETS.golden!.x1;
  let terms: number = DEFAULT_TERMS;

  let currentScale: Scale | null = null;

  const root = document.createElement("section") as GenerateMeruElement;
  root.className = "generate-meru";

  const heading = document.createElement("h2");
  heading.textContent = "Wilson recurrence (Mt. Meru)"; // UI copy.
  root.appendChild(heading);

  // ─── Preset select (D-10) + citation line (A3) ─────────────────────────────
  const form = document.createElement("div");
  form.className = "generate-meru__form";

  const presetCell = document.createElement("div");
  presetCell.className = "generate-meru__field";
  const presetLbl = document.createElement("span");
  presetLbl.className = "generate-meru__field-label";
  presetLbl.textContent = "Metallic mean";
  presetCell.appendChild(presetLbl);

  const presetSelect = document.createElement("select");
  presetSelect.name = "meru-preset";
  presetSelect.setAttribute("aria-label", "Metallic-mean preset");
  for (const [value, label] of [
    ["golden", "Golden (Fibonacci, φ)"],
    ["silver", "Silver (Pell)"],
    ["bronze", "Bronze"],
    ["copper", "Copper"],
    ["custom", "Custom"],
  ]) {
    const optionEl = document.createElement("option");
    optionEl.value = value!;
    optionEl.textContent = label!;
    presetSelect.appendChild(optionEl);
  }
  presetSelect.value = "golden"; // default golden (D-12).
  presetCell.appendChild(presetSelect);
  form.appendChild(presetCell);
  root.appendChild(form);

  // A3 citation line — the metallic-mean family is sourced (Erv Wilson Mt. Meru /
  // anaphoria.com + Xenharmonic Wiki). Literal text via textContent (T-08-11).
  const citation = document.createElement("p");
  citation.className = "generate-meru__citation";
  citation.textContent =
    "Metallic means after Erv Wilson’s Mt. Meru (anaphoria.com) and the Xenharmonic Wiki ‘Metallic MOS’ / ‘Recurrent sequence’ pages.";
  root.appendChild(citation);

  // ─── Editable params (D-11): coefficients a,b + seeds x0,x1 + term-count ───
  const paramsRow = document.createElement("div");
  paramsRow.className = "generate-meru__params";
  root.appendChild(paramsRow);

  // ── A labelled positive-integer <input type="number"> cell (the generate-fokker
  //    makeIntField idiom). The onCommit callback receives the raw parsed integer;
  //    the caller decides how to fold it into BigInt state. Empty/invalid edits are
  //    transient no-ops (no crash). `allowOverMax` lets the term-count field send an
  //    over-cap value to meruScale so the kernel RangeError surfaces (D-11 caps test).
  function makeIntField(
    labelText: string,
    nameAttr: string,
    value: string,
    onCommit: (raw: string) => void,
    attrs: { min?: string; max?: string } = {},
  ): HTMLElement {
    const cell = document.createElement("div");
    cell.className = "generate-meru__field";
    const lbl = document.createElement("span");
    lbl.className = "generate-meru__field-label";
    lbl.textContent = labelText;
    cell.appendChild(lbl);
    const input = document.createElement("input");
    input.type = "number";
    input.name = nameAttr;
    input.step = "1";
    if (attrs.min !== undefined) input.min = attrs.min;
    if (attrs.max !== undefined) input.max = attrs.max;
    input.value = value;
    input.setAttribute("aria-label", labelText);
    input.addEventListener("input", () => {
      const trimmed = input.value.trim();
      if (trimmed === "") return; // transient edit — leave state, no crash.
      onCommit(trimmed);
      rebuild();
    });
    cell.appendChild(input);
    return cell;
  }

  // The five editable params. Editing any of them switches the preset to "custom"
  // (the user has stepped off a named metallic mean) and re-renders via rebuild().
  function toCustom(): void {
    if (presetSelect.value !== "custom") presetSelect.value = "custom";
  }

  const aField = makeIntField(
    "Coefficient a",
    "meru-a",
    String(a),
    (raw) => {
      const v = parsePositiveBigInt(raw);
      if (v === null) return;
      a = v;
      toCustom();
    },
    { min: "1" },
  );
  const bField = makeIntField(
    "Coefficient b",
    "meru-b",
    String(b),
    (raw) => {
      const v = parsePositiveBigInt(raw);
      if (v === null) return;
      b = v;
      toCustom();
    },
    { min: "1" },
  );
  const x0Field = makeIntField(
    "Seed x₀",
    "meru-x0",
    String(x0),
    (raw) => {
      const v = parsePositiveBigInt(raw);
      if (v === null) return;
      x0 = v;
      toCustom();
    },
    { min: "1" },
  );
  const x1Field = makeIntField(
    "Seed x₁",
    "meru-x1",
    String(x1),
    (raw) => {
      const v = parsePositiveBigInt(raw);
      if (v === null) return;
      x1 = v;
      toCustom();
    },
    { min: "1" },
  );
  const termsField = makeIntField(
    "Terms",
    "meru-terms",
    String(terms),
    (raw) => {
      // Do NOT clamp here — let an over-cap term-count reach meruScale so its
      // RangeError surfaces in the status region (D-11 / D-16). parseInt is fine:
      // term-count is a small DOM-render bound, not a ratio (no BigInt needed).
      const parsed = parseInt(raw, 10);
      if (!Number.isInteger(parsed)) return;
      terms = parsed;
      // Editing terms does NOT leave the metallic mean (a,b unchanged) — keep the
      // preset label as-is so the limit readout stays meaningful.
    },
    { min: "1", max: String(MAX_MERU_TERMS) },
  );
  paramsRow.replaceChildren(aField, bField, x0Field, x1Field, termsField);

  // ─── Metallic-limit readout (D-09) — tempered, BESIDE the table, NEVER a degree.
  const limit = document.createElement("span");
  limit.className = "generate-meru__limit";
  limit.setAttribute("aria-live", "polite");
  root.appendChild(limit);

  // ─── Status region (kernel RangeError announcements) ───────────────────────
  const status = document.createElement("div");
  status.className = "generate-meru__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + Play button ────────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-meru__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-meru__play-host";
  root.appendChild(playHost);

  /**
   * Update the metallic-limit readout (D-09). The limit is the IRRATIONAL metallic
   * mean in cents — flagged tempered, rendered BESIDE the table, NEVER a scale degree.
   * Number(a)/Number(b) is safe: the limit is a display-only float (Pitfall #1) and
   * coefficients large enough to lose Number precision are far past any musical use.
   */
  function updateLimit(): void {
    const cents = metallicLimitCents(Number(a), Number(b));
    limit.textContent = `Metallic-mean limit (tempered): ${cents.toFixed(1)}¢`;
  }

  function rebuild(): void {
    status.textContent = "";
    // The limit readout reflects the CURRENT coefficients even if the convergents
    // fail to build (it depends only on a,b, not on terms/seeds).
    updateLimit();

    let scale: Scale;
    try {
      scale = meruScale(a, b, x0, x1, terms);
    } catch (err) {
      // Kernel rejected the inputs (D-11 caps: term-count > MAX_MERU_TERMS,
      // seed/coefficient magnitude overflow, non-positive seed). Surface the
      // message; PRESERVE the prior render (tableHost / playHost NOT cleared) —
      // the generateFokker D-16 discipline. No crash (T-08-09).
      status.textContent = err instanceof Error ? err.message : String(err);
      return;
    }

    // Wilson convergents are EXACT rational (D-19): the 4-column "Ratio" table, NO
    // tempered flag (generate-cps / generate-fokker exact-JI path).
    tableHost.replaceChildren(scaleTable(scale, baseHz, { precision }));
    playHost.replaceChildren(playScale(scale, synth, { baseHz }));
    currentScale = scale;
  }

  // ─── Wire the preset swap ──────────────────────────────────────────────────
  presetSelect.addEventListener("change", () => {
    const seed = PRESETS[presetSelect.value];
    if (seed) {
      a = seed.a;
      b = seed.b;
      x0 = seed.x0;
      x1 = seed.x1;
      // Reflect the new coefficients/seeds in the editable fields.
      (aField.querySelector("input") as HTMLInputElement).value = String(a);
      (bField.querySelector("input") as HTMLInputElement).value = String(b);
      (x0Field.querySelector("input") as HTMLInputElement).value = String(x0);
      (x1Field.querySelector("input") as HTMLInputElement).value = String(x1);
    }
    // "custom" keeps the user's current a,b,x0,x1 as-is.
    rebuild();
  });

  // Expose the current Scale + tempered marker (always false — exact rational;
  // the metallic limit is a SEPARATE tempered readout, never a scale degree).
  root.getScale = () => currentScale;
  root.isTempered = () => false;

  // ─── Initial render — D-12 default (golden / Fibonacci convergents). ───────
  rebuild();

  return root;
}
