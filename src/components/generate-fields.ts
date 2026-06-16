/**
 * generate-fields — the ONE source of truth for the generator-widget field
 * helpers (#19). The eight `generate-*.ts` method widgets previously each carried
 * their own copy-pasted `parseIntOrNull` / `parsePositiveInt` / `parseRatio` parse
 * functions and (for the four with editable numeric/ratio cells) their own nested
 * `makeIntField` / `makeRatioField` factories. The bodies were identical save for
 * three divergences, all parameterized here:
 *
 *   1. BEM class names are per-component (`generate-ed__field`, `generate-cs__slash`,
 *      …). Each `generate-*.css` scopes its own `.generate-XXX__field` / `__field-label`
 *      / `__slash` rules, so the factories take a `classPrefix` and reproduce the
 *      EXACT existing class names verbatim — renaming any class is a visual regression.
 *   2. The closure-captured `rebuild()` becomes an explicit `opts.onCommit` callback.
 *   3. fokker's unique extent snap-back (`input.value = String(clamp(parsed))`) becomes
 *      opt-in via `opts.clampReflect`, so only fokker keeps it.
 *
 * Intended hardening folded in while consolidating:
 *   - `parseIntOrNull` honors an optional `min` (default -Infinity = no floor, the
 *     prior behavior). Below-min values return null so closure state is left untouched
 *     at the UI layer instead of reaching the kernel's RangeError. Call sites opt in by
 *     passing the field's `min` (e.g. ji-set limit min=1 rejects negatives at the UI).
 *
 * Three-layer purity: a leaf DOM helper module — no kernel or output-component imports.
 * All elements built via createElement + textContent (never innerHTML with dynamic
 * content). BigInt-backed ratio validation (no prime-limit ceiling — CLAUDE.md
 * disqualifies Number-backed ratio paths).
 */

/**
 * Parse an input's value into a finite integer, or null when transiently empty /
 * non-integer / below `min`. The caller leaves the closure-local state untouched on
 * null so an in-progress edit never crashes; a committed out-of-range value that does
 * pass (e.g. above a kernel cap with no UI max) still surfaces via the kernel's
 * RangeError in the widget's status region.
 *
 * @param raw The raw input string.
 * @param min Reject integers below this floor (default -Infinity = no floor — the
 *   historical behavior preserved for callers that do not opt in; welltemp's
 *   negative-numerator field relies on this default).
 */
export function parseIntOrNull(raw: string, min = -Infinity): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = parseInt(trimmed, 10);
  if (!Number.isInteger(n)) return null;
  return n >= min ? n : null;
}

/**
 * Parse a chip-input string into a strictly-positive integer, or null if invalid.
 * STRICT base-10: rejects non-numeric text, non-integers ("2.5"), scientific /
 * hex notation ("1e3", "0x4"), and values ≤ 0 — the value is validated BEFORE it
 * can become a chip or reach the kernel. (Lenient `parseInt` would coerce "3.5"→3,
 * "3abc"→3; the `/^\d+$/` guard closes that.)
 */
export function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = parseInt(trimmed, 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

/**
 * Validate a ratio string `n/d` (both positive integers). Returns the normalized
 * `n/d` string or null. Validated/normalized with BigInt, NOT parseInt — the project
 * has no prime-limit ceiling (CLAUDE.md disqualifies Number-backed ratio paths), so a
 * numerator/denominator past 2^53 is preserved EXACTLY, not rounded. The regex already
 * guarantees digit-only groups, so BigInt cannot throw.
 */
export function parseRatio(raw: string): string | null {
  const trimmed = raw.trim();
  const m = /^(\d+)\/(\d+)$/.exec(trimmed);
  if (!m) return null;
  const n = BigInt(m[1]!);
  const d = BigInt(m[2]!);
  if (n < 1n || d < 1n) return null;
  return `${String(n)}/${String(d)}`;
}

/** Numeric `min` / `max` attributes for an integer field. */
export interface IntFieldAttrs {
  min?: string;
  max?: string;
}

/** Behavioral options shared by the field factories. */
export interface FieldOpts {
  /** Called after a valid parse (the closure-captured `rebuild()` at the call site). */
  onCommit?: () => void;
  /**
   * When true, after `onCommit` the visible input value is reflected as
   * `String(clamp(parsed))` using the [min..max] from `attrs` — fokker's extent
   * snap-back (a typed 99 visibly snaps to the max). Default false (no reflection).
   */
  clampReflect?: boolean;
}

/**
 * A labelled integer `<input type="number">` cell. Reproduces the ed / harmonic /
 * cs / fokker `makeIntField` idiom: a `div.{classPrefix}__field` containing a
 * `span.{classPrefix}__field-label` and a `number` input (step=1) whose min/max come
 * from `attrs`. The input handler parses via `parseIntOrNull` honoring `attrs.min`
 * (so below-min values are rejected at the UI — the intended hardening), calls
 * `onInput(parsed)` + `opts.onCommit()` on a valid parse, and does nothing on null
 * (leave state, no crash).
 *
 * @param classPrefix The call site's BEM prefix (e.g. "generate-ed") — preserved
 *   verbatim so the per-component CSS keeps matching.
 */
export function makeIntField(
  classPrefix: string,
  labelText: string,
  nameAttr: string,
  value: number,
  onInput: (n: number) => void,
  attrs: IntFieldAttrs = {},
  opts: FieldOpts = {},
): HTMLElement {
  const cell = document.createElement("div");
  cell.className = `${classPrefix}__field`;
  const lbl = document.createElement("span");
  lbl.className = `${classPrefix}__field-label`;
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

  const min = attrs.min !== undefined ? Number(attrs.min) : -Infinity;
  input.addEventListener("input", () => {
    const parsed = parseIntOrNull(input.value, min);
    if (parsed === null) return; // transient / below-min edit — leave state, no crash.
    onInput(parsed);
    opts.onCommit?.();
    if (opts.clampReflect) {
      // Reflect the clamp in the visible field (fokker's extent snap-back): a typed
      // 99 snaps to the field's max. Uses the [min..max] from attrs.
      const lo = attrs.min !== undefined ? Number(attrs.min) : -Infinity;
      const hi = attrs.max !== undefined ? Number(attrs.max) : Infinity;
      input.value = String(Math.max(lo, Math.min(hi, parsed)));
    }
  });
  cell.appendChild(input);
  return cell;
}

/**
 * The mosBuilder makeRatioField idiom — two number inputs (each min=1 step=1, own
 * `name`) sandwiching a `span.{classPrefix}__slash` "/" glyph, inside a
 * `div.{classPrefix}__field`. Each input's aria-label is `"{labelText} numerator"` /
 * `"{labelText} denominator"`. Both handlers parse n and d via `parseIntOrNull(min 1)`
 * (matching the inputs' own min=1), bail if either is null, else call `onChange(n, d)`
 * + `opts.onCommit()`.
 *
 * @param classPrefix The call site's BEM prefix (e.g. "generate-harmonic") — preserved
 *   verbatim so the per-component CSS keeps matching.
 */
export function makeRatioField(
  classPrefix: string,
  labelText: string,
  nNameAttr: string,
  dNameAttr: string,
  initialN: number,
  initialD: number,
  onChange: (n: number, d: number) => void,
  opts: FieldOpts = {},
): HTMLElement {
  const cell = document.createElement("div");
  cell.className = `${classPrefix}__field`;
  const lbl = document.createElement("span");
  lbl.className = `${classPrefix}__field-label`;
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
  slash.className = `${classPrefix}__slash`;
  slash.textContent = "/";

  const dInput = document.createElement("input");
  dInput.type = "number";
  dInput.name = dNameAttr;
  dInput.min = "1";
  dInput.step = "1";
  dInput.value = String(initialD);
  dInput.setAttribute("aria-label", `${labelText} denominator`);

  const handler = (): void => {
    const n = parseIntOrNull(nInput.value, 1);
    const d = parseIntOrNull(dInput.value, 1);
    if (n === null || d === null) return;
    onChange(n, d);
    opts.onCommit?.();
  };
  nInput.addEventListener("input", handler);
  dInput.addEventListener("input", handler);

  cell.appendChild(nInput);
  cell.appendChild(slash);
  cell.appendChild(dInput);
  return cell;
}
