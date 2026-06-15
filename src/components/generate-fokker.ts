/**
 * generate-fokker — Fokker periodicity-block method widget (GEN-08, Phase 7
 * D-09 / D-10 / D-11 / D-12). Delivers parked TEMP-08 (periodicity blocks).
 *
 * Wired into the Generate picker under the "Advanced" optgroup (Plan 04).
 * Pattern-2 factory: (synth, opts?) => HTMLElement. Mirrors generateEd's
 * mode-swap shell + generateCps's chip-input idiom — closure-local state (no
 * module-level state), a status region (role="status" aria-live="polite"), and
 * rebuild() that swaps the table + Play button via replaceChildren. On error the
 * message lands in the status region and the prior render is PRESERVED (the
 * mosBuilder / generate-cps error idiom).
 *
 * EXACT RATIONAL, NOT TEMPERED (D-11): Fokker blocks are exact-rational JI. ALL
 * renders go through `scaleTable(scale, baseHz, { precision })` WITHOUT the
 * tempered flag — the 4-column "Ratio" path (generate-cps.ts:237 idiom). The
 * widget marks itself `isTempered() => false` so generate.md serializes Send-to
 * as ratios-per-line, never cents.
 *
 * Mode toggle (D-09 ships BOTH modes, D-10 basis is the default landing mode):
 *   - BASIS mode (default): basis-interval chips (integer/ratio generators) +
 *     per-axis up/down integer extents. Source = `parallelotope(basis, ups, downs)`
 *     (RESEARCH Pattern 4, verified `[3,5],[3,1],[0,1]` → 12). The live "→ N notes"
 *     readout (D-12) shows the extents product ∏(upᵢ + downᵢ + 1).
 *   - COMMA mode: comma-ratio chips (each chip an `n/d` string). The live readout
 *     (D-12) shows `fokkerCardinality(commas)` = |det| of the unison-vector matrix
 *     (12 for the classic 81/80 + 128/125 block). Enumeration uses a verified
 *     comma→basis bridge (A3 path (a)): the non-2 prime axes become the basis and
 *     the HNF diagonal of the (3,5,…)-subspace comma matrix becomes the per-axis
 *     extents, so `parallelotope` renders exactly |det| exact-rational notes
 *     (verified: 81/80 + 128/125 → `parallelotope([3,5],[3,2],[0,0])` → 12).
 *
 * Mode toggling preserves each mode's state (the generate-ed per-slot precedent):
 * basis state = { basis, ups, downs }; comma state = { commas }.
 *
 * Defense-in-depth (D-18, T-07-13): cap basis size / extents / comma count BEFORE
 * composing or enumerating (mirrors the cps.ts D-14 caps); `fokkerCardinality`
 * already caps cardinality and rejects non-square sets (RangeError → readout
 * message, no crash).
 *
 * Three-layer purity: imports the scaleFromSonicWeave / fokkerCardinality kernels
 * + the scaleTable / playScale output components + the SynthHandle type. No DOM-in-
 * kernel bleed. All inputs/labels/status/chips via createElement + textContent
 * (never innerHTML with dynamic content — T-07-12).
 */
import type { Scale } from "../lib/scale.js";
import { scaleFromSonicWeave } from "../lib/sonicweave.js";
import { fokkerCardinality, reducedSubspaceMatrix } from "../lib/fokker.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";
import { hnf } from "xen-dev-utils";

export interface GenerateFokkerOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/**
 * A root element that also exposes the widget's current Scale + tempered marker.
 * isTempered() is ALWAYS false — Fokker blocks are exact rational (drives
 * ratios-per-line Send-to).
 */
export interface GenerateFokkerElement extends HTMLElement {
  /** The widget's current exact-rational Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
  /** False — Fokker blocks are exact rational (no cents-of-record). */
  isTempered(): boolean;
}

/** The two specification modes. `basis` is the default landing mode (D-10). */
type Mode = "basis" | "comma";

/** Defense-in-depth caps (T-07-13) — checked BEFORE composing / enumerating. */
const MAX_BASIS = 6;
const MAX_EXTENT = 24;
const MAX_COMMAS = 8;

/** Prime axes, indexed by monzo position (index 0 = prime 2, the implicit equave). */
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];

/**
 * Parse a chip-input string into a strictly-positive integer, or null if invalid
 * (the generate-cps parsePositiveInt idiom; basis chips are integer generators).
 */
function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = parseInt(trimmed, 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

/**
 * Validate a comma ratio string `n/d` (both positive integers). Returns the
 * normalized `n/d` string or null. The value is validated BEFORE it can become a
 * chip (T-07-12: literal text only, never innerHTML).
 */
function parseRatio(raw: string): string | null {
  const trimmed = raw.trim();
  const m = /^(\d+)\/(\d+)$/.exec(trimmed);
  if (!m) return null;
  // WR-04: validate/normalize with BigInt, NOT parseInt — the project has no
  // prime-limit ceiling (CLAUDE.md disqualifies Number-backed ratio paths), so a
  // comma whose numerator/denominator exceeds 2^53 must be preserved exactly, not
  // rounded. The regex already guarantees digit-only groups, so BigInt cannot throw.
  const n = BigInt(m[1]!);
  const d = BigInt(m[2]!);
  if (n < 1n || d < 1n) return null;
  return `${String(n)}/${String(d)}`;
}

/**
 * The comma→basis bridge (A3 path (a)): map a comma set to a `parallelotope(...)`
 * source that enumerates exactly |det| exact-rational notes. The SURVIVING (live)
 * non-2 prime axes become the basis; the HNF diagonal of the reduced subspace comma
 * matrix gives the per-axis extents. Consumes the SAME `reducedSubspaceMatrix`
 * helper as `fokkerCardinality`, so the two derive the surviving prime columns
 * identically (no drift). Throws RangeError (via fokkerCardinality) on a degenerate
 * comma set — the caller catches it and shows the readout message.
 *
 * VERIFIED: ["81/80","128/125"] → `parallelotope([3,5], [3,2], [0,0])` → 12 exact
 * notes (the classic 5-limit 12-tone block); ["64/63","2401/2187"] (a 2.3.7
 * subgroup; prime-5 column droppable) → `parallelotope([3,7], …)` → 15 exact notes.
 */
function commaToParallelotopeSource(commaStrings: string[]): string {
  // fokkerCardinality enforces the drop-zero-column/rank gate + caps; calling it
  // first guarantees the reduced matrix below is square (reducedWidth === length).
  fokkerCardinality(commaStrings);

  // Reduced square matrix + surviving prime columns from the SHARED helper. The
  // surviving indices are ORIGINAL monzo positions, so PRIMES[idx] recovers the
  // basis prime directly (e.g. [1,3] → [3,7] for the 64/63+2401/2187 subgroup).
  const { reduced, survivingMonzoIndices } = reducedSubspaceMatrix(commaStrings);
  const basis = survivingMonzoIndices.map((idx) => PRIMES[idx]!);

  // HNF (upper-triangular) of the reduced square matrix; its diagonal |hᵢᵢ|
  // multiplies to |det| = the cardinality. One up-extent per surviving prime.
  const H = hnf(reduced);
  const ups = H.map((row, i) => Math.abs(Number(row[i])) - 1);
  const downs = basis.map(() => 0);

  return `parallelotope([${basis.join(", ")}], [${ups.join(", ")}], [${downs.join(", ")}])`;
}

export function generateFokker(
  synth: SynthHandle,
  opts: GenerateFokkerOpts = {},
): GenerateFokkerElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  // Defaults per D-11: the classic 5-limit 12-tone block. basis mode is the
  // default landing mode (D-10). State preserved PER mode across the toggle (the
  // generate-ed per-slot precedent).
  let mode: Mode = "basis";
  // Basis-mode state: parallelotope([3,5],[3,1],[0,1]) → the classic 12 notes.
  let basisGenerators: number[] = [3, 5];
  let ups: number[] = [3, 1];
  let downs: number[] = [0, 1];
  // Comma-mode state: the classic 81/80 + 128/125 unison vectors (→ |det| 12).
  let commas: string[] = ["81/80", "128/125"];

  let currentScale: Scale | null = null;

  const root = document.createElement("section") as GenerateFokkerElement;
  root.className = "generate-fokker";

  const heading = document.createElement("h2");
  heading.textContent = "Fokker periodicity block"; // UI copy.
  root.appendChild(heading);

  // ─── Mode select (basis ↔ comma) ───────────────────────────────────────────
  const modeForm = document.createElement("div");
  modeForm.className = "generate-fokker__form";

  const modeCell = document.createElement("div");
  modeCell.className = "generate-fokker__field";
  const modeLbl = document.createElement("span");
  modeLbl.className = "generate-fokker__field-label";
  modeLbl.textContent = "Specify by";
  modeCell.appendChild(modeLbl);

  const modeSelect = document.createElement("select");
  modeSelect.name = "fokker-mode";
  modeSelect.setAttribute("aria-label", "Fokker specification mode");
  for (const [value, label] of [
    ["basis", "Basis intervals + extents"],
    ["comma", "Unison vectors (commas)"],
  ]) {
    const optionEl = document.createElement("option");
    optionEl.value = value!;
    optionEl.textContent = label!;
    modeSelect.appendChild(optionEl);
  }
  modeSelect.value = mode; // default basis (D-10).
  modeCell.appendChild(modeSelect);
  modeForm.appendChild(modeCell);
  root.appendChild(modeForm);

  // ─── Params sub-region (replaceChildren on mode change) ────────────────────
  const paramsRegion = document.createElement("div");
  paramsRegion.className = "generate-fokker__params";
  root.appendChild(paramsRegion);

  // ─── Live "→ N notes" readout (D-12) — updated BEFORE the preview. ──────────
  const readout = document.createElement("span");
  readout.className = "generate-fokker__readout";
  readout.setAttribute("aria-live", "polite");
  root.appendChild(readout);

  // ─── Status region (error announcements) ───────────────────────────────────
  const status = document.createElement("div");
  status.className = "generate-fokker__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + Play button ────────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-fokker__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-fokker__play-host";
  root.appendChild(playHost);

  // ── A labelled integer <input type="number"> cell (the generate-ed idiom). ──
  function makeIntField(
    labelText: string,
    nameAttr: string,
    value: number,
    onInput: (n: number) => void,
    attrs: { min?: string; max?: string } = {},
  ): HTMLElement {
    const cell = document.createElement("div");
    cell.className = "generate-fokker__field";
    const lbl = document.createElement("span");
    lbl.className = "generate-fokker__field-label";
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
      const trimmed = input.value.trim();
      if (trimmed === "") return; // transient edit — leave state, no crash.
      const parsed = parseInt(trimmed, 10);
      if (!Number.isInteger(parsed)) return;
      onInput(parsed);
      rebuild();
    });
    cell.appendChild(input);
    return cell;
  }

  /**
   * A generic chip input (the generate-cps chip idiom): a labelled list of chips
   * each with a "×" remove control, plus an input + "Add" button. `validate`
   * turns the raw input string into the stored value (or null to reject).
   *
   * `cap` is the maximum chip count for THIS instance (MAX_BASIS for basis,
   * MAX_COMMAS for commas — WR-03); hitting it writes a status message instead of
   * silently dropping the chip. `onListChanged` (optional) runs after every
   * mutation of the list (Add and Remove), so the caller can re-render dependent
   * UI such as the per-axis extent fields (CR-02) — the basis instance binds it to
   * renderExtents() so a new axis gets its own editable Up/Down controls and a
   * removed axis leaves no stale field.
   */
  function makeChipInput(
    labelText: string,
    nameStem: string,
    getList: () => string[],
    setList: (next: string[]) => void,
    validate: (raw: string) => string | null,
    placeholder: string,
    cap: number,
    onListChanged?: () => void,
  ): HTMLElement {
    const chipForm = document.createElement("div");
    chipForm.className = "generate-fokker__chip-form";

    const chipLbl = document.createElement("span");
    chipLbl.className = "generate-fokker__field-label";
    chipLbl.textContent = labelText;
    chipForm.appendChild(chipLbl);

    const chipList = document.createElement("div");
    chipList.className = "generate-fokker__chips";
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
    addBtn.className = "generate-fokker__add";
    addBtn.textContent = "Add";
    chipForm.appendChild(addBtn);

    function renderChips(): void {
      chipList.replaceChildren();
      getList().forEach((value, i) => {
        const chip = document.createElement("span");
        chip.className = "generate-fokker__chip";

        const label = document.createElement("span");
        label.className = "generate-fokker__chip-label";
        label.textContent = value; // literal text — XSS-safe (T-07-12).
        chip.appendChild(label);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "generate-fokker__chip-remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Remove ${value}`);
        remove.addEventListener("click", () => {
          const next = getList().slice();
          next.splice(i, 1);
          setList(next);
          renderChips();
          onListChanged?.(); // CR-02: regenerate dependent UI (extent fields).
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
      // WR-03: cap is per-instance (MAX_BASIS for basis, MAX_COMMAS for commas).
      // At the cap, surface a visible status message instead of silently dropping
      // the chip (the basis slice no longer swallows the 7th chip without feedback).
      if (next.length >= cap) {
        status.textContent = `At most ${String(cap)} ${labelText.toLowerCase()}.`;
        return;
      }
      next.push(validated);
      setList(next);
      chipInput.value = "";
      renderChips();
      onListChanged?.(); // CR-02: regenerate dependent UI (extent fields).
      rebuild();
    });

    renderChips();
    return chipForm;
  }

  // ── A dedicated host for the per-axis extent fields. Re-rendering only this
  //    host (CR-02) regenerates the Up/Down inputs on a basis-list change WITHOUT
  //    recreating the chip input (which would drop an in-progress chip value).
  const extentsHost = document.createElement("div");
  extentsHost.className = "generate-fokker__extents";

  /**
   * Rebuild ONLY the per-axis Up/Down extent cells from the current
   * basisGenerators/ups/downs (CR-02). Called on initial basis render and after
   * every basis-list mutation (Add/Remove) so each surviving axis owns correctly-
   * indexed `fokker-up-${i}` / `fokker-down-${i}` inputs and no stale field
   * remains for a removed axis.
   */
  function renderExtents(): void {
    const extentCells: HTMLElement[] = [];
    basisGenerators.forEach((gen, i) => {
      extentCells.push(
        makeIntField(
          `Up (prime ${String(gen)})`,
          `fokker-up-${String(i)}`,
          ups[i] ?? 0,
          (n) => {
            ups[i] = Math.max(0, Math.min(MAX_EXTENT, n));
          },
          { min: "0", max: String(MAX_EXTENT) },
        ),
      );
      extentCells.push(
        makeIntField(
          `Down (prime ${String(gen)})`,
          `fokker-down-${String(i)}`,
          downs[i] ?? 0,
          (n) => {
            downs[i] = Math.max(0, Math.min(MAX_EXTENT, n));
          },
          { min: "0", max: String(MAX_EXTENT) },
        ),
      );
    });
    extentsHost.replaceChildren(...extentCells);
  }

  /** Rebuild the params sub-region for the active mode (basis vs comma). */
  function renderParams(): void {
    if (mode === "basis") {
      // Basis-interval chips (integer generators) + per-axis up/down extents.
      const basisChips = makeChipInput(
        "Basis intervals",
        "fokker-basis",
        () => basisGenerators.map((n) => String(n)),
        (next) => {
          // Keep ups/downs aligned with the basis length (default new axes to 0).
          basisGenerators = next.map((s) => parseInt(s, 10)).slice(0, MAX_BASIS);
          ups = basisGenerators.map((_, i) => ups[i] ?? 0);
          downs = basisGenerators.map((_, i) => downs[i] ?? 0);
        },
        (raw) => {
          const n = parsePositiveInt(raw);
          return n === null ? null : String(n);
        },
        "e.g. 7",
        MAX_BASIS,
        // CR-02: regenerate the extent fields after every basis-list change so a
        // newly added axis is editable and a removed axis leaves no stale field.
        renderExtents,
      );

      renderExtents();
      paramsRegion.replaceChildren(basisChips, extentsHost);
    } else {
      // Comma-ratio chips (each chip an n/d unison vector).
      const commaChips = makeChipInput(
        "Unison vectors",
        "fokker-comma",
        () => commas,
        (next) => {
          commas = next;
        },
        parseRatio,
        "e.g. 81/80",
        MAX_COMMAS,
      );
      paramsRegion.replaceChildren(commaChips);
    }
  }

  /**
   * Compose the SonicWeave source for the active mode, updating the live "→ N
   * notes" readout (D-12) BEFORE returning. Returns null when the readout could
   * not be computed (e.g. a non-square comma set) — the caller preserves the
   * prior preview.
   */
  function composeSource(): string | null {
    if (mode === "basis") {
      // Defense-in-depth caps BEFORE enumeration (T-07-13).
      const basis = basisGenerators.slice(0, MAX_BASIS);
      const u = basis.map((_, i) => Math.max(0, Math.min(MAX_EXTENT, ups[i] ?? 0)));
      const d = basis.map((_, i) => Math.max(0, Math.min(MAX_EXTENT, downs[i] ?? 0)));
      // Extents product readout: ∏(upᵢ + downᵢ + 1).
      const product = basis.reduce((acc, _, i) => acc * (u[i]! + d[i]! + 1), 1);
      readout.textContent = `→ ${String(product)} notes`;
      if (basis.length === 0) {
        status.textContent = "Add at least one basis interval.";
        return null;
      }
      return `parallelotope([${basis.join(", ")}], [${u.join(", ")}], [${d.join(", ")}])`;
    }
    // Comma mode: |det| readout via fokkerCardinality (the primary D-12 surface).
    try {
      const card = fokkerCardinality(commas);
      readout.textContent = `→ ${String(card)} notes`;
      return commaToParallelotopeSource(commas);
    } catch (err) {
      // Non-square / degenerate / over-cap comma set (RangeError). Show a clear
      // readout message and DO NOT enumerate — the prior preview is preserved.
      readout.textContent = "→ — notes (needs a square comma set)";
      status.textContent = err instanceof Error ? err.message : String(err);
      return null;
    }
  }

  function rebuild(): void {
    status.textContent = "";
    const src = composeSource();
    if (src === null) return; // readout already updated; preserve prior preview.

    const result = scaleFromSonicWeave(src);
    if (result.scale === null) {
      // Adapter error (parse/eval/empty/over-cap). Surface verbatim via
      // textContent; PRESERVE the prior render (tableHost / playHost NOT cleared).
      status.textContent = result.error ?? "Could not build the block.";
      return;
    }

    // Fokker blocks are EXACT rational (D-11): the 4-column "Ratio" table, NO
    // tempered flag (generate-cps.ts:237 path).
    tableHost.replaceChildren(scaleTable(result.scale, baseHz, { precision }));
    playHost.replaceChildren(playScale(result.scale, synth, { baseHz }));
    currentScale = result.scale;
  }

  // ─── Wire the mode swap ────────────────────────────────────────────────────
  modeSelect.addEventListener("change", () => {
    mode = modeSelect.value as Mode;
    renderParams();
    rebuild();
  });

  // Expose the current Scale + tempered marker (always false — exact rational).
  root.getScale = () => currentScale;
  root.isTempered = () => false;

  // ─── Initial render — D-11 default (classic 5-limit 12-tone block, basis). ──
  renderParams();
  rebuild();

  return root;
}
