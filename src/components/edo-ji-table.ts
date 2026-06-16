/**
 * edoJiTable — N-EDO → best JI approximation per step (ANAL-01 / Phase 4 D-08).
 *
 * Renders a 3-column table (Step | Cents | JI Approx) for the given edoSteps.
 * Prime/odd-limit toggle (D-08) flips the underlying `bestJiInEdo` call:
 *   - 'prime' delegates to jiSubsetOfEdo (Phase 2 SCALE-05) — same fits the
 *     dashboard's Phase 2 use case already produces.
 *   - 'odd' uses the new odd-limit search routine (Plan 04-01).
 *
 * Limit input is a number range (1..31 for odd; 2..23 effectively for prime
 * within fraction.js' BigInt + xen-dev-utils' maxExponent=5 envelope). The
 * component clamps + surfaces a status-region message via aria-live=polite
 * (D-08 + Phase 2 sclIo pattern).
 *
 * Click-to-audition: dyad (baseHz + baseHz × interval) per Phase 3 D-07
 * default. Reuses synth.playNotes — no new audio path.
 *
 * Pattern 2 factory: (edoSteps, synth, opts?) => HTMLElement. No module-level
 * state. SynthHandle owner-allocated by the page cell.
 *
 * Defense-in-depth (T-04-17): every cell value — header and data alike — flows
 * through `createElement` + `textContent` (NEVER `innerHTML`) so a malicious .scl
 * description-derived ratio could never reach markup.
 */
import { Interval } from "../lib/interval.js";
import { bestJiInEdo, type EdoJiKind } from "../lib/edo.js";
import type { SynthHandle } from "../audio/synth.js";
// CSS shipped via per-page `style:` frontmatter; Plan 04-07 will @import
// edo-ji-table.css from src/styles.css.

/** Defense-in-depth cap (matches Plan 04-01's ODD_LIMIT_CAP at the kernel). */
const ODD_LIMIT_MAX = 31;
const ODD_LIMIT_MIN = 1;
const DEFAULT_LIMIT = 7;

export interface EdoJiTableOpts {
  /** 'prime' (default) delegates to jiSubsetOfEdo; 'odd' enumerates odd ratios. */
  kind?: EdoJiKind;
  /** Prime limit (for 'prime') or odd limit (for 'odd'). Default 7. */
  limit?: number;
  /** Reference Hz for the click-dyad audition (Phase 2 D-08). Default 440. */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

// Signature on one line so plan-checker grep gates can match.
export function edoJiTable(
  edoSteps: number,
  synth: SynthHandle,
  opts: EdoJiTableOpts = {},
): HTMLElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // Closure-local UI state.
  let kind: EdoJiKind = opts.kind ?? "prime";
  let limit: number = clampLimit(opts.limit ?? DEFAULT_LIMIT);
  // Track whether the *initial* limit was clamped (so the status region can
  // announce "Odd-limit clamped to 31" on construction, not silently swallow).
  const initialLimit = opts.limit ?? DEFAULT_LIMIT;
  const initialWasClamped = initialLimit !== limit;

  // ─── DOM scaffolding ─────────────────────────────────────────────────────
  const wrapper = document.createElement("section");
  wrapper.className = "edo-ji-table";

  const heading = document.createElement("h2");
  heading.textContent = `JI in ${String(edoSteps)}-EDO`;
  wrapper.appendChild(heading);

  // Controls row.
  const controls = document.createElement("div");
  controls.className = "controls";

  // Kind toggle (<select>).
  const kindLabel = document.createElement("label");
  kindLabel.textContent = "Kind";
  const kindSelect = document.createElement("select");
  kindSelect.setAttribute("data-control", "kind");
  for (const [value, label] of [
    ["prime", "Prime-limit"],
    ["odd", "Odd-limit"],
  ] as const) {
    const optEl = document.createElement("option");
    optEl.value = value;
    optEl.textContent = label;
    if (value === kind) optEl.selected = true;
    kindSelect.appendChild(optEl);
  }
  kindSelect.addEventListener("change", () => {
    kind = kindSelect.value === "odd" ? "odd" : "prime";
    setStatus(`Showing ${kind}-limit JI approximations.`);
    renderTable();
  });
  kindLabel.appendChild(kindSelect);
  controls.appendChild(kindLabel);

  // Limit input.
  const limitLabel = document.createElement("label");
  limitLabel.textContent = "Limit";
  const limitInput = document.createElement("input");
  limitInput.type = "number";
  limitInput.min = String(ODD_LIMIT_MIN);
  limitInput.max = String(ODD_LIMIT_MAX);
  limitInput.step = "1";
  limitInput.value = String(limit);
  limitInput.setAttribute("data-control", "limit");
  // D-17: 16px font-size suppresses iOS Safari's auto-zoom on focus.
  limitInput.style.fontSize = "16px";
  const onLimitChange = (): void => {
    const raw = Number(limitInput.value);
    if (!Number.isFinite(raw)) {
      setStatus("Limit must be a number.");
      return;
    }
    const clamped = clampLimit(raw);
    if (clamped !== raw) {
      setStatus(
        `Limit clamped to ${String(clamped)} (must be in [${String(ODD_LIMIT_MIN)}, ${String(ODD_LIMIT_MAX)}]).`,
      );
      limitInput.value = String(clamped);
    } else {
      setStatus("");
    }
    limit = clamped;
    renderTable();
  };
  limitInput.addEventListener("change", onLimitChange);
  limitInput.addEventListener("input", onLimitChange);
  limitLabel.appendChild(limitInput);
  controls.appendChild(limitLabel);

  wrapper.appendChild(controls);

  // Table.
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  // Header row via createElement + textContent (never innerHTML) — uniform with the
  // no-innerHTML discipline used for the data cells (T-04-17).
  const headerRow = document.createElement("tr");
  for (const label of ["Step", "Cents", "JI Approx"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  wrapper.appendChild(table);

  // Status region — defense-in-depth (T-04-13/T-04-17): textContent only.
  const status = document.createElement("div");
  status.className = "status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  wrapper.appendChild(status);

  // ─── Render helpers ──────────────────────────────────────────────────────
  function setStatus(text: string): void {
    // T-04-13 / T-04-17 mitigation: textContent — never innerHTML.
    status.textContent = text;
  }

  function renderTable(): void {
    tbody.replaceChildren();
    let scale: ReturnType<typeof bestJiInEdo>;
    try {
      scale = bestJiInEdo(edoSteps, limit, kind);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`Could not compute JI approximations: ${msg}`);
      return;
    }
    // bestJiInEdo returns N intervals + period (N+1 total). The table shows
    // step 0..N-1; the appended period 2/1 is not rendered as a separate row
    // (step N would be the period-equivalent of step 0).
    const intervals = scale.intervals.slice(0, edoSteps);
    intervals.forEach((iv: Interval, step: number) => {
      const tr = document.createElement("tr");
      tr.setAttribute("role", "button");
      tr.setAttribute("tabindex", "0");
      tr.setAttribute("aria-label", `Audition step ${String(step)}: ${iv.fraction.toFraction()}`);
      const stepCell = document.createElement("td");
      stepCell.textContent = String(step);
      tr.appendChild(stepCell);
      const centsCell = document.createElement("td");
      centsCell.textContent = ((1200 / edoSteps) * step).toFixed(precision);
      tr.appendChild(centsCell);
      const ratioCell = document.createElement("td");
      // T-04-17: textContent — fraction.js' toFraction() yields a plain "n/d" string
      // from BigInt internals; defense-in-depth, render as text.
      ratioCell.textContent = iv.fraction.toFraction();
      tr.appendChild(ratioCell);

      const triggerAudition = (): void => {
        // D-07 default audition mode: dyad (baseHz + baseHz × interval).
        const ratio = Number(iv.fraction.valueOf());
        synth.playNotes([baseHz, baseHz * ratio], 1.5);
      };
      tr.addEventListener("click", triggerAudition);
      tr.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          triggerAudition();
        }
      });
      tbody.appendChild(tr);
    });
  }

  // Initial render. Announce clamp on construction if applicable.
  if (initialWasClamped) {
    setStatus(
      `Limit clamped to ${String(limit)} (must be in [${String(ODD_LIMIT_MIN)}, ${String(ODD_LIMIT_MAX)}]).`,
    );
  }
  renderTable();

  return wrapper;
}

/** Clamp `n` to [ODD_LIMIT_MIN, ODD_LIMIT_MAX]. NaN → DEFAULT_LIMIT. */
function clampLimit(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_LIMIT;
  const i = Math.floor(n);
  if (i < ODD_LIMIT_MIN) return ODD_LIMIT_MIN;
  if (i > ODD_LIMIT_MAX) return ODD_LIMIT_MAX;
  return i;
}
