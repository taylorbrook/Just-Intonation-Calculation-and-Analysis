/**
 * mosBuilder — MOS construction widget (ANAL-02 / Phase 4 D-11..D-14, D-28, D-29).
 *
 * Inputs (D-12 ratio-only — cents-defined generators deferred):
 *   - generator: numerator + denominator number inputs (defaults 3, 2 → 3/2)
 *   - period:    numerator + denominator number inputs (defaults 2, 1 → 2/1)
 *   - size:      free integer input (default 7 — Pythagorean diatonic per D-28)
 *   - snap:      checkbox "Snap to nearest MOS size", default ON per D-13
 *
 * On any input change: build Interval(n/d) for generator + period, run buildMos
 * (size = snap ? nearestMosSize(...) : raw size). Render the resulting Scale
 * via the existing scaleTable component (D-14 — fungible output) and a
 * playScale Play button. NO L/s viz, NO mode rotation, NO brightness ranking
 * (all deferred per D-14).
 *
 * Degenerate inputs (D-29):
 *   - period == 1/1            → status: "MOS period must be > 1/1"; preserve previous scale render
 *   - generator equals period  → buildMos returns single-pitch; status: "Generator equals period — scale collapses to a single pitch"
 *   - size < 1                 → status: "MOS size must be at least 1"
 *
 * Snap behavior:
 *   - snap ON + target IS a natural MOS size → no status update (silent success)
 *   - snap ON + target NOT a natural MOS size → status: "Snapped to MOS size N (target M)"
 *   - snap OFF                                → status: "Free size N (not a natural MOS)" if not a natural size
 *
 * Pattern 2 factory: (synth, opts?) => HTMLElement. No module-level state.
 * Defense-in-depth: createElement + textContent only; static thead innerHTML
 * is delegated to scaleTable (Phase 2 — already audited).
 */
import { Interval } from "../lib/interval.js";
import { buildMos, nearestMosSize } from "../lib/mos.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface MosBuilderOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
  /** Default generator ratio. Default { n: 3, d: 2 } (D-28 Pythagorean fifth). */
  defaultGenerator?: { n: number; d: number };
  /** Default period ratio. Default { n: 2, d: 1 } (D-28 octave). */
  defaultPeriod?: { n: number; d: number };
  /** Default size. Default 7 (D-28 Pythagorean diatonic). */
  defaultSize?: number;
}

// Defense-in-depth caps mirroring src/lib/mos.ts (T-04-23: DoS guard).
const MAX_SIZE = 1024;

/** Clamp a parsed integer into [1, max]; returns NaN-safe `1` floor. */
function clampPositiveInt(raw: string, max: number): number {
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return 1;
  if (parsed < 1) return 1;
  if (parsed > max) return max;
  return Math.floor(parsed);
}

export function mosBuilder(synth: SynthHandle, opts: MosBuilderOpts = {}): HTMLElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;
  const defaultGen = opts.defaultGenerator ?? { n: 3, d: 2 };
  const defaultPer = opts.defaultPeriod ?? { n: 2, d: 1 };
  const defaultSize = opts.defaultSize ?? 7;

  // Closure-local state — no module-level state (Pattern 2).
  let genN = clampPositiveInt(String(defaultGen.n), 1_000_000);
  let genD = clampPositiveInt(String(defaultGen.d), 1_000_000);
  let perN = clampPositiveInt(String(defaultPer.n), 1_000_000);
  let perD = clampPositiveInt(String(defaultPer.d), 1_000_000);
  let size = clampPositiveInt(String(defaultSize), MAX_SIZE);
  let snap = true; // D-13: snap default ON.

  const root = document.createElement("section");
  root.className = "mos-builder";

  const heading = document.createElement("h2");
  heading.textContent = "MOS construction"; // UI copy.
  root.appendChild(heading);

  // ─── Form row: generator, period, size, snap toggle ──────────────────────
  const form = document.createElement("div");
  form.className = "mos-builder__form";

  /**
   * Build a "<label>n/d</label>" pair as a flat .mos-builder__field cell.
   * Two number inputs sandwiching a literal "/" glyph. Each input has its own
   * `name` so happy-dom selectors `input[name="generator-n"]` etc. resolve
   * unambiguously. Returns a wrapper element to append to the form row.
   */
  const makeRatioField = (
    labelText: string,
    nNameAttr: string,
    dNameAttr: string,
    initialN: number,
    initialD: number,
    onChange: (n: number, d: number) => void,
  ): HTMLElement => {
    const cell = document.createElement("div");
    cell.className = "mos-builder__field";

    const lbl = document.createElement("span");
    lbl.className = "mos-builder__field-label";
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
    slash.className = "mos-builder__slash";
    slash.textContent = "/";

    const dInput = document.createElement("input");
    dInput.type = "number";
    dInput.name = dNameAttr;
    dInput.min = "1";
    dInput.step = "1";
    dInput.value = String(initialD);
    dInput.setAttribute("aria-label", `${labelText} denominator`);

    nInput.addEventListener("input", () => {
      const n = clampPositiveInt(nInput.value, 1_000_000);
      const d = clampPositiveInt(dInput.value, 1_000_000);
      onChange(n, d);
      rebuild();
    });
    dInput.addEventListener("input", () => {
      const n = clampPositiveInt(nInput.value, 1_000_000);
      const d = clampPositiveInt(dInput.value, 1_000_000);
      onChange(n, d);
      rebuild();
    });

    cell.appendChild(nInput);
    cell.appendChild(slash);
    cell.appendChild(dInput);
    return cell;
  };

  // Generator field
  form.appendChild(
    makeRatioField("Generator", "generator-n", "generator-d", genN, genD, (n, d) => {
      genN = n;
      genD = d;
    }),
  );

  // Period field
  form.appendChild(
    makeRatioField("Period", "period-n", "period-d", perN, perD, (n, d) => {
      perN = n;
      perD = d;
    }),
  );

  // Size field — single integer input.
  const sizeCell = document.createElement("div");
  sizeCell.className = "mos-builder__field";
  const sizeLbl = document.createElement("span");
  sizeLbl.className = "mos-builder__field-label";
  sizeLbl.textContent = "Size";
  sizeCell.appendChild(sizeLbl);
  const sizeInput = document.createElement("input");
  sizeInput.type = "number";
  sizeInput.name = "size";
  sizeInput.min = "1";
  sizeInput.step = "1";
  sizeInput.value = String(size);
  sizeInput.setAttribute("aria-label", "MOS size");
  sizeInput.addEventListener("input", () => {
    size = clampPositiveInt(sizeInput.value, MAX_SIZE);
    rebuild();
  });
  sizeCell.appendChild(sizeInput);
  form.appendChild(sizeCell);

  // Snap toggle — checkbox + label, default checked (D-13).
  const snapWrap = document.createElement("label");
  snapWrap.className = "mos-builder__snap";
  const snapInput = document.createElement("input");
  snapInput.type = "checkbox";
  snapInput.checked = snap;
  snapInput.addEventListener("change", () => {
    snap = snapInput.checked;
    rebuild();
  });
  const snapLabel = document.createElement("span");
  snapLabel.textContent = "Snap to nearest MOS size";
  snapWrap.appendChild(snapInput);
  snapWrap.appendChild(snapLabel);
  form.appendChild(snapWrap);

  root.appendChild(form);

  // ─── Status region (D-29 announcements) ───────────────────────────────────
  const status = document.createElement("div");
  status.className = "mos-builder__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + Play button ──────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "mos-builder__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "mos-builder__play-host";
  root.appendChild(playHost);

  // Detect whether `candidate` is a natural MOS size for (generator, period)
  // by asking nearestMosSize and checking the round-trip identity.
  function isNaturalMosSize(generator: Interval, period: Interval, candidate: number): boolean {
    try {
      return nearestMosSize(generator, period, candidate) === candidate;
    } catch {
      return false;
    }
  }

  function rebuild(): void {
    // Defense-in-depth — clampPositiveInt should already prevent size < 1, but
    // surface the expected D-29 message if it ever slips through.
    if (size < 1) {
      status.textContent = "MOS size must be at least 1";
      return;
    }
    let generator: Interval;
    let period: Interval;
    try {
      generator = new Interval(`${String(genN)}/${String(genD)}`);
      period = new Interval(`${String(perN)}/${String(perD)}`);
    } catch (err) {
      // Fraction.js throws on invalid n/d. T-04-22: textContent only.
      const msg = err instanceof Error ? err.message : String(err);
      status.textContent = msg;
      return;
    }

    try {
      let effectiveSize = size;
      if (snap) {
        const snapped = nearestMosSize(generator, period, size);
        if (snapped !== size) {
          status.textContent = `Snapped to MOS size ${String(snapped)} (target ${String(size)})`;
        } else {
          status.textContent = "";
        }
        effectiveSize = snapped;
      } else {
        // Free-size mode (D-13): announce when the user's size isn't a natural MOS.
        if (isNaturalMosSize(generator, period, size)) {
          status.textContent = "";
        } else {
          status.textContent = `Free size ${String(size)} (not a natural MOS)`;
        }
      }

      const scale = buildMos(generator, period, effectiveSize);

      // D-29: surface the single-pitch collapse case so the user knows why
      // the table just dropped to one row. Override any prior snap message —
      // this case is structurally more important to flag.
      if (generator.equals(period)) {
        status.textContent =
          "Generator equals period — scale collapses to a single pitch";
      }

      tableHost.replaceChildren(scaleTable(scale, baseHz, { precision }));
      playHost.replaceChildren(playScale(scale, synth, { baseHz }));
    } catch (err) {
      // Kernel rejected the inputs (period <= 1/1, size out of range, etc.).
      // T-04-22: textContent only — never innerHTML.
      const msg = err instanceof Error ? err.message : String(err);
      status.textContent = msg;
      // D-29: preserve the prior valid scaleTable render for visual continuity.
      // tableHost / playHost are intentionally NOT cleared.
    }
  }

  // Initial render — D-28 default seed (Pythagorean diatonic, 8 intervals).
  rebuild();

  return root;
}
