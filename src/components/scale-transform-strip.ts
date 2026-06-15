/**
 * scale-transform-strip.ts — non-destructive transform overlay (SURF-04).
 *
 * Factory: `scaleTransformStrip(opts?) => HTMLElement` (Pattern-2 — closure-local
 * state, no module-level state). The returned element exposes:
 *   - setSource(scale, tempered): store the raw source + tempered flag, rebuild
 *     the mode <select> to list "Mode 1 of N … Mode N of N" (N = intervals.length),
 *     re-derive, and fire onChange.
 *   - getTransformedScale(): Scale | null — the current re-derived result.
 *   - getTempered(): boolean — the source's tempered flag (carried through every
 *     transform; D-18 / SURF-06 — a tempered scale stays cents-flagged downstream).
 *   - onChange(cb): register a (scale, tempered) callback fired on every change.
 *
 * Non-destructive overlay (D-05): on EVERY control change the strip re-derives
 * `applyTransforms(rawSource, state)` from the ORIGINAL source — never an
 * accumulating pipeline. Composition order is fixed: rotate → reduce → dedupe →
 * transpose, over the immutable Scale kernel methods (no new kernel surface).
 *
 * `Scale.rotate(0)` is identity (returns a copy), so the mode <select>'s option
 * VALUE is the rotate degree (0..N-1); "Mode 1 of N" = degree 0.
 *
 * Tempered survival (D-18): Scale methods operate on the BigInt Interval.fraction.
 * For a tempered scale the adapter stored each pitch as a cents-to-ratio-derived
 * Hz-faithful fraction, so rotate/reduce/dedupe/transpose preserve that fraction;
 * the display-layer `tempered` flag (held here, not on Scale) just stays true.
 *
 * Defense-in-depth (T-08-04 / T-08-07): all dynamic text via createElement +
 * textContent (never the unsafe-HTML sink); the transpose n/d field clamps to a
 * positive-int magnitude cap before reaching Scale.transpose. The strip only
 * reads its source + renders its own controls — it never mutates another widget's
 * internals (D-06 Pattern-2 encapsulation).
 */
import { Interval } from "../lib/interval.js";
import type { Scale } from "../lib/scale.js";

// ─── Public surface ─────────────────────────────────────────────────────────

export interface ScaleTransformStripOpts {
  /** Reference frequency forwarded to downstream consumers. Default 440 (D-08). */
  baseHz?: number;
}

export interface ScaleTransformStripElement extends HTMLElement {
  setSource(scale: Scale, tempered: boolean): void;
  getTransformedScale(): Scale | null;
  getTempered(): boolean;
  onChange(cb: (scale: Scale, tempered: boolean) => void): void;
}

interface TransformState {
  /** Rotate degree (0 = identity). */
  mode: number;
  reduce: boolean;
  dedupe: boolean;
  /** null = identity (no transpose, i.e. 1/1). */
  transpose: Interval | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

// DoS guard on the transpose n/d magnitude (mos-builder makeRatioField precedent).
const RATIO_MAX = 1_000_000;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Clamp a parsed integer into [1, max]; NaN-safe floor at 1. */
function clampPositiveInt(raw: string, max: number): number {
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return 1;
  if (parsed < 1) return 1;
  if (parsed > max) return max;
  return Math.floor(parsed);
}

/**
 * Compose the transforms over the RAW source, in fixed order (D-05). Always
 * re-derived from `source` — never accumulating. rotate(0) is identity, so we
 * still call it only when mode !== 0 for clarity.
 */
function applyTransforms(source: Scale, t: TransformState): Scale {
  let s = source;
  if (t.mode !== 0) s = s.rotate(t.mode);
  if (t.reduce) s = s.reduce();
  if (t.dedupe) s = s.dedupe();
  if (t.transpose) s = s.transpose(t.transpose);
  return s;
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function scaleTransformStrip(
  opts: ScaleTransformStripOpts = {},
): ScaleTransformStripElement {
  void opts.baseHz; // reserved for downstream wiring (Plan 03); read to satisfy strict-TS.

  // Closure-local state (Pattern-2 — no module-level state).
  let rawSource: Scale | null = null;
  let tempered = false;
  const state: TransformState = { mode: 0, reduce: false, dedupe: false, transpose: null };
  let transformed: Scale | null = null;
  let onChangeCb: ((scale: Scale, tempered: boolean) => void) | null = null;

  const root = document.createElement("section") as ScaleTransformStripElement;
  root.className = "scale-transform-strip";

  const heading = document.createElement("h2");
  heading.textContent = "Transform";
  root.appendChild(heading);

  const helper = document.createElement("p");
  helper.className = "dashboard-helper";
  helper.textContent =
    "Rotate to a mode, reduce/dedupe, or transpose — applied non-destructively to the generated scale.";
  root.appendChild(helper);

  const form = document.createElement("div");
  form.className = "scale-transform-strip__form";
  root.appendChild(form);

  // ─── Mode <select> (D-07) ─────────────────────────────────────────────────
  const modeCell = document.createElement("div");
  modeCell.className = "scale-transform-strip__field";
  const modeLbl = document.createElement("span");
  modeLbl.className = "scale-transform-strip__field-label";
  modeLbl.textContent = "Mode";
  modeCell.appendChild(modeLbl);
  const modeSelect = document.createElement("select");
  modeSelect.name = "mode";
  modeSelect.setAttribute("aria-label", "Mode (rotation)");
  modeSelect.addEventListener("change", () => {
    // The option value IS the rotate degree (0 = identity), so parse it directly
    // — clampPositiveInt floors at 1 and would make degree 0 unreachable.
    const raw = parseInt(modeSelect.value, 10);
    state.mode = Number.isFinite(raw) && raw >= 0 ? raw : 0;
    rerender();
  });
  modeCell.appendChild(modeSelect);
  form.appendChild(modeCell);

  // ─── reduce / dedupe checkboxes ──────────────────────────────────────────
  const makeToggle = (name: "reduce" | "dedupe", labelText: string): HTMLInputElement => {
    const wrap = document.createElement("label");
    wrap.className = "scale-transform-strip__toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = name;
    const span = document.createElement("span");
    span.textContent = labelText;
    input.addEventListener("change", () => {
      state[name] = input.checked;
      rerender();
    });
    wrap.appendChild(input);
    wrap.appendChild(span);
    form.appendChild(wrap);
    return input;
  };
  const reduceInput = makeToggle("reduce", "Reduce");
  const dedupeInput = makeToggle("dedupe", "Dedupe");

  // ─── Transpose ratio field (D-18 makeRatioField idiom) ────────────────────
  const transposeCell = document.createElement("div");
  transposeCell.className = "scale-transform-strip__field";
  const transposeLbl = document.createElement("span");
  transposeLbl.className = "scale-transform-strip__field-label";
  transposeLbl.textContent = "Transpose";
  transposeCell.appendChild(transposeLbl);

  const tnInput = document.createElement("input");
  tnInput.type = "number";
  tnInput.name = "transpose-n";
  tnInput.min = "1";
  tnInput.step = "1";
  tnInput.value = "1";
  tnInput.setAttribute("aria-label", "Transpose numerator");

  const slash = document.createElement("span");
  slash.className = "scale-transform-strip__slash";
  slash.textContent = "/";

  const tdInput = document.createElement("input");
  tdInput.type = "number";
  tdInput.name = "transpose-d";
  tdInput.min = "1";
  tdInput.step = "1";
  tdInput.value = "1";
  tdInput.setAttribute("aria-label", "Transpose denominator");

  const readTranspose = (): void => {
    const n = clampPositiveInt(tnInput.value, RATIO_MAX);
    const d = clampPositiveInt(tdInput.value, RATIO_MAX);
    // 1/1 (or any unit ratio) is identity — null so applyTransforms skips it.
    state.transpose = n === d ? null : new Interval(`${String(n)}/${String(d)}`);
    rerender();
  };
  tnInput.addEventListener("input", readTranspose);
  tdInput.addEventListener("input", readTranspose);

  transposeCell.appendChild(tnInput);
  transposeCell.appendChild(slash);
  transposeCell.appendChild(tdInput);
  form.appendChild(transposeCell);

  // ─── Reset button (D-08) ──────────────────────────────────────────────────
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.name = "reset";
  resetBtn.className = "scale-transform-strip__reset";
  resetBtn.textContent = "Reset";
  resetBtn.addEventListener("click", () => {
    state.mode = 0;
    state.reduce = false;
    state.dedupe = false;
    state.transpose = null;
    // Reflect identity in the controls.
    modeSelect.value = "0";
    reduceInput.checked = false;
    dedupeInput.checked = false;
    tnInput.value = "1";
    tdInput.value = "1";
    rerender();
  });
  form.appendChild(resetBtn);

  // ─── Core: rebuild the mode select for the current source ─────────────────
  function rebuildModeSelect(n: number): void {
    modeSelect.replaceChildren();
    for (let degree = 0; degree < n; degree++) {
      const option = document.createElement("option");
      option.value = String(degree);
      option.textContent = `Mode ${String(degree + 1)} of ${String(n)}`;
      modeSelect.appendChild(option);
    }
    modeSelect.value = String(state.mode < n ? state.mode : 0);
  }

  // ─── Core: re-derive transformed scale + fire onChange ────────────────────
  function rerender(): void {
    if (!rawSource) {
      transformed = null;
      return;
    }
    transformed = applyTransforms(rawSource, state);
    if (onChangeCb) onChangeCb(transformed, tempered);
  }

  // ─── Public methods ───────────────────────────────────────────────────────
  root.setSource = (scale: Scale, isTempered: boolean): void => {
    rawSource = scale;
    tempered = isTempered;
    // A new source of a different length resets the mode if out of range.
    if (state.mode >= scale.intervals.length) state.mode = 0;
    rebuildModeSelect(scale.intervals.length);
    rerender();
  };

  root.getTransformedScale = (): Scale | null => transformed;
  root.getTempered = (): boolean => tempered;
  root.onChange = (cb: (scale: Scale, tempered: boolean) => void): void => {
    onChangeCb = cb;
  };

  return root;
}
