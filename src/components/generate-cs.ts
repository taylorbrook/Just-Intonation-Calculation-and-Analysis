/**
 * generate-cs — constant-structure (csgs) generator widget (GEN-10, Phase 8
 * D-13 / D-14 / D-16 + the 08-RESEARCH Critical Correction).
 *
 * The STRUCTURAL TWIN of generate-fokker minus the basis↔comma mode toggle:
 * generator ratio chips (the makeChipInput idiom) + an ORDINAL field (makeIntField),
 * a composeSource()→scaleFromSonicWeave(src)→rebuild() flow with a status region and
 * the "preserve prior preview on error" discipline (D-16), and a live readout — here
 * a CS-STATUS readout from isConstantStructure (D-14) instead of Fokker's "→ N notes".
 *
 * THE CRITICAL CORRECTION (08-RESEARCH, runtime-probed against sonic-weave@0.14.1):
 *   - DEFAULT = `csgs([3/2], 3)` → the 7-note Pythagorean diatonic (9/8, 81/64,
 *     729/512, 3/2, 27/16, 243/128, 2/1) + the auto-prepended 1/1 = 8 rows.
 *   - csgs's second argument is an ORDINAL, not a cardinality: it selects the
 *     ordinal-th constant-structure scale by INCREASING SIZE (ordinal 0=trivial,
 *     1→3, 2→5, 3→7, 4→12). The field is therefore labelled "ordinal", never
 *     a "size"/cardinality field, with a helper note.
 *   - the same fifth generator at ordinal 7 yields 41 notes, several of which throw
 *     "Denominator above safe limit" → the adapter fail-closes. The ordinal input is CAPPED LOW (max 8) so
 *     this is not reachable from the default; if a user forces a high ordinal the
 *     adapter error surfaces in the status region (D-16) and the prior preview survives.
 *
 * EXACT RATIONAL (normally): csgs from rational generators is exact JI, so the table
 * uses the 4-column "Ratio" path and isTempered() is false. The tempered branch is
 * kept (mirroring rank-2) in case a float generator is ever typed — the adapter's
 * `tempered` flag is carried through so a tempered CS scale serializes cents downstream
 * (SURF-06). The CS source is composed ONLY from parseRatio-validated `n/d` chips + an
 * integer ordinal — NO free-text reaches the adapter (D-13; no `sonic-weave` import).
 *
 * Three-layer purity: imports the scaleFromSonicWeave adapter (the ONLY SonicWeave
 * boundary — D-13) + isConstantStructure kernel + the scaleTable / playScale output
 * components + the SynthHandle type. All inputs / labels / chips / readout / status via
 * createElement + textContent (never the unsafe-HTML sink with dynamic content — T-08-11).
 */
import type { Scale } from "../lib/scale.js";
import { scaleFromSonicWeave } from "../lib/sonicweave.js";
import { isConstantStructure } from "../lib/constant-structure.js";
import { makeIntField, parseRatio } from "./generate-fields.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateCsOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/**
 * A root element that also exposes the widget's current Scale + tempered marker.
 * isTempered() reflects the adapter's tempered flag — normally false (csgs from
 * rational generators is exact JI), true only if a float generator were typed.
 */
export interface GenerateCsElement extends HTMLElement {
  /** The widget's current CS Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
  /** The adapter's tempered flag for the last successful build (normally false). */
  isTempered(): boolean;
}

/** Defense-in-depth caps (T-08-08) — checked at compose time. */
const MAX_GENERATORS = 6;
/**
 * The ordinal cap (the 08-RESEARCH Correction): high ordinals overflow the adapter's
 * safe-integer guard (the fifth at ordinal 7 → 41 notes, some throwing "Denominator above
 * safe limit"). 8 is a generous musical ceiling that keeps the default (3) well clear.
 */
const MAX_ORDINAL = 8;

export function generateCs(synth: SynthHandle, opts: GenerateCsOpts = {}): GenerateCsElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  // CORRECTED default (08-RESEARCH): generator chip ["3/2"], ordinal 3 → the
  // 7-note Pythagorean diatonic. NOT ordinal 7 (which yields 41 notes + errors).
  let generatorChips: string[] = ["3/2"];
  let ordinal = 3;

  let currentScale: Scale | null = null;
  let lastTempered = false;

  const root = document.createElement("section") as GenerateCsElement;
  root.className = "generate-cs";

  const heading = document.createElement("h2");
  heading.textContent = "Constant structure (generator stack)"; // UI copy.
  root.appendChild(heading);

  // ─── Params region: generator chips + ordinal field + helper ───────────────
  const params = document.createElement("div");
  params.className = "generate-cs__params";
  root.appendChild(params);

  // ─── CS-status readout (D-14) — updated AFTER each successful build. ────────
  const csStatus = document.createElement("span");
  csStatus.className = "generate-cs__cs-status";
  csStatus.setAttribute("aria-live", "polite");
  root.appendChild(csStatus);

  // ─── Status region (adapter-error announcements) ───────────────────────────
  const status = document.createElement("div");
  status.className = "generate-cs__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + Play button ────────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-cs__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-cs__play-host";
  root.appendChild(playHost);

  /**
   * A generic chip input (the generate-fokker / generate-cps chip idiom): a labelled
   * list of chips each with a "×" remove control, plus an input + "Add" button.
   * `validate` turns the raw input string into the stored value (or null to reject).
   * `cap` is the max chip count; hitting it writes a status message instead of
   * silently dropping the chip. All chip labels via textContent (T-08-11, XSS-safe).
   */
  function makeChipInput(
    labelText: string,
    nameStem: string,
    getList: () => string[],
    setList: (next: string[]) => void,
    validate: (raw: string) => string | null,
    placeholder: string,
    cap: number,
  ): HTMLElement {
    const chipForm = document.createElement("div");
    chipForm.className = "generate-cs__chip-form";

    const chipLbl = document.createElement("span");
    chipLbl.className = "generate-cs__field-label";
    chipLbl.textContent = labelText;
    chipForm.appendChild(chipLbl);

    const chipList = document.createElement("div");
    chipList.className = "generate-cs__chips";
    chipForm.appendChild(chipList);

    const chipInput = document.createElement("input");
    chipInput.type = "text";
    chipInput.name = `${nameStem}-input`;
    chipInput.placeholder = placeholder;
    chipInput.setAttribute("aria-label", `Add ${labelText.toLowerCase()}`);
    chipForm.appendChild(chipInput);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.name = `${nameStem}-add`;
    addBtn.className = "generate-cs__add";
    addBtn.textContent = "Add";
    chipForm.appendChild(addBtn);

    function renderChips(): void {
      chipList.replaceChildren();
      getList().forEach((value, i) => {
        const chip = document.createElement("span");
        chip.className = "generate-cs__chip";

        const label = document.createElement("span");
        label.className = "generate-cs__chip-label";
        label.textContent = value; // literal text — XSS-safe (T-08-11).
        chip.appendChild(label);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "generate-cs__chip-remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Remove ${value}`);
        remove.addEventListener("click", () => {
          const next = getList().slice();
          next.splice(i, 1);
          setList(next);
          renderChips();
          rebuild();
        });
        chip.appendChild(remove);

        chipList.appendChild(chip);
      });
    }

    addBtn.addEventListener("click", () => {
      const validated = validate(chipInput.value);
      if (validated === null) return; // invalid → no chip, no crash.
      const next = getList().slice();
      if (next.length >= cap) {
        status.textContent = `At most ${String(cap)} ${labelText.toLowerCase()}.`;
        return;
      }
      next.push(validated);
      setList(next);
      chipInput.value = "";
      renderChips();
      rebuild();
    });

    renderChips();
    return chipForm;
  }

  // Generator ratio chips (D-13).
  const genChips = makeChipInput(
    "Generators",
    "cs-gen",
    () => generatorChips,
    (next) => {
      generatorChips = next;
    },
    parseRatio,
    "e.g. 3/2",
    MAX_GENERATORS,
  );

  // The ORDINAL field (the Correction): labelled "ordinal", capped low.
  const ordinalField = makeIntField(
    "generate-cs",
    "Ordinal",
    "cs-ordinal",
    ordinal,
    (n) => {
      // Do NOT clamp here — let a high ordinal reach the adapter so its fail-close
      // error surfaces (D-16). The field's `max` attribute is the soft UI cap.
      ordinal = n;
    },
    { min: "0", max: String(MAX_ORDINAL) },
    { onCommit: rebuild },
  );

  // Helper note (the Correction) — explains the ordinal semantics so users do not
  // read it as a cardinality. Literal text via textContent (T-08-11).
  const helper = document.createElement("p");
  helper.className = "generate-cs__helper";
  helper.textContent =
    "Ordinal selects the Nth constant-structure scale by increasing size (e.g. 1→3 notes, 2→5, 3→7).";

  params.replaceChildren(genChips, ordinalField, helper);

  /**
   * Compose the csgs SonicWeave source from the validated chips + ordinal. Returns
   * null + a status message when there are no generators (the caller preserves the
   * prior preview). NO free-text reaches the adapter (D-13).
   */
  function composeSource(): string | null {
    const gens = generatorChips.slice(0, MAX_GENERATORS);
    if (gens.length === 0) {
      status.textContent = "Add at least one generator ratio.";
      return null;
    }
    // ordinal, not a cardinality — the Correction.
    return `csgs([${gens.join(", ")}], ${String(ordinal)})`;
  }

  /** Phrase the isConstantStructure result for the D-14 readout. */
  function csStatusText(scale: Scale): string {
    const result = isConstantStructure(scale);
    if (result.cs) return "✓ constant structure";
    const at = result.ambiguousAt;
    if (at) {
      return `✗ not CS (ambiguous at ${String(at.intervalClassA)}/${String(at.intervalClassB)})`;
    }
    return "✗ not CS";
  }

  function rebuild(): void {
    status.textContent = "";
    const src = composeSource();
    if (src === null) return; // preserve prior preview (D-16).

    const result = scaleFromSonicWeave(src);
    if (result.scale === null) {
      // Adapter error (parse/eval/empty/safe-integer overflow). Surface verbatim;
      // PRESERVE the prior render (tableHost / playHost NOT cleared) — D-16.
      status.textContent = result.error ?? "Could not build the scale.";
      return;
    }

    // Live CS-status readout (D-14): isConstantStructure on the RETURNED scale.
    csStatus.textContent = csStatusText(result.scale);

    // csgs from rational generators is exact JI (tempered false) → the 4-column
    // "Ratio" table; the tempered branch carries the flag through for a float
    // generator (SURF-06).
    tableHost.replaceChildren(
      scaleTable(result.scale, baseHz, { precision, tempered: result.tempered }),
    );
    playHost.replaceChildren(playScale(result.scale, synth, { baseHz }));
    currentScale = result.scale;
    lastTempered = result.tempered;
  }

  // Expose the current Scale + tempered marker (the adapter's flag).
  root.getScale = () => currentScale;
  root.isTempered = () => lastTempered;

  // ─── Initial render — the CORRECTED default (csgs([3/2], 3) diatonic). ─────
  rebuild();

  return root;
}
