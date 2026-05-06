/**
 * edoJitTable — scale→EDO ranking table (ANAL-01 / Phase 4 D-05/D-06/D-09/D-10).
 *
 * Renders one row per N-EDO in [opts.range.min, opts.range.max] (default 5..72
 * per D-25). Each row exposes three sortable cents-error columns (D-06): max,
 * RMS, Tenney-weighted. Clicking a column header re-sorts rows in place;
 * second click toggles ascending/descending.
 *
 * Row-click audition (D-10): arpeggiates the user's scale rendered at the
 * EDO's nearest steps via synth.playArpeggio. Hear "this scale in 31edo"
 * directly — the high-value composer decision.
 *
 * Pattern 2 factory: (scale, synth, opts?) => HTMLElement. No module-level
 * state. SynthHandle owner-allocated by the page cell.
 *
 * Defense-in-depth (T-02-22/T-02-23): every dynamic cell value flows through
 * `createElement` + `textContent`. Only the static `<thead>` row uses innerHTML
 * (no interpolated values).
 */
import type { Scale } from "../lib/scale.js";
import type { SynthHandle } from "../audio/synth.js";
import { bestEdosForScale, type EdoErrorRow } from "../lib/edo.js";
// CSS shipped via per-page `style:` frontmatter; Plan 04-07 will @import
// edo-jit-table.css from src/styles.css.

export interface EdoJitTableOpts {
  /** EDO range (inclusive). Default { min: 5, max: 72 } per D-25. */
  range?: { min: number; max: number };
  /** Reference Hz for the row-click arpeggio (Phase 2 D-08). Default 440. */
  baseHz?: number;
  /** Seconds between arpeggio notes. Default 0.45 (matches playScale). */
  stepSec?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

type SortKey = "edoSteps" | "maxCentsError" | "rmsCentsError" | "tenneyWeightedError";

interface ColumnDef {
  key: SortKey;
  label: string;
  /** Format the cell value for this column from a row. */
  format: (row: EdoErrorRow, precision: number) => string;
}

// Signature on one line so plan-checker grep gates can match.
export function edoJitTable(scale: Scale, synth: SynthHandle, opts: EdoJitTableOpts = {}): HTMLElement {
  const range = opts.range ?? { min: 5, max: 72 };
  const baseHz = opts.baseHz ?? 440;
  const stepSec = opts.stepSec ?? 0.45;
  const precision = opts.precision ?? 1;

  // Compute rows once. Every row carries all three metrics — sort happens in
  // memory on header click (no re-fetch).
  const rows: EdoErrorRow[] = bestEdosForScale(scale, range, "max");

  // Column definitions — order matters; the four <th>s render in this order.
  const columns: ColumnDef[] = [
    {
      key: "edoSteps",
      label: "EDO",
      format: (row) => String(row.edoSteps),
    },
    {
      key: "maxCentsError",
      label: "Max ¢ err",
      format: (row, p) => row.maxCentsError.toFixed(p),
    },
    {
      key: "rmsCentsError",
      label: "RMS ¢ err",
      format: (row, p) => row.rmsCentsError.toFixed(p),
    },
    {
      key: "tenneyWeightedError",
      label: "Tenney err",
      format: (row, p) => row.tenneyWeightedError.toFixed(p),
    },
  ];

  // Closure-local UI state.
  let sortKey: SortKey = "edoSteps";
  let sortDir: 1 | -1 = 1;

  // ─── DOM scaffolding ─────────────────────────────────────────────────────
  const wrapper = document.createElement("div");
  wrapper.className = "edo-jit-table";

  const heading = document.createElement("h2");
  heading.textContent = "Best-fit EDOs";
  wrapper.appendChild(heading);

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  // Build each <th> with createElement (no innerHTML interpolation) so the
  // sort-arrow span and aria-sort attribute can update on click.
  const headerEls: { th: HTMLTableCellElement; arrow: HTMLSpanElement; col: ColumnDef }[] = [];
  for (const col of columns) {
    const th = document.createElement("th");
    th.setAttribute("role", "button");
    th.setAttribute("tabindex", "0");
    th.setAttribute("aria-sort", "none");
    // Static label text.
    th.textContent = col.label;
    const arrow = document.createElement("span");
    arrow.className = "sort-arrow";
    arrow.textContent = "—";
    th.appendChild(arrow);
    th.addEventListener("click", () => {
      handleHeaderClick(col.key);
    });
    th.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        handleHeaderClick(col.key);
      }
    });
    headerRow.appendChild(th);
    headerEls.push({ th, arrow, col });
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  wrapper.appendChild(table);

  // ─── Render helpers ──────────────────────────────────────────────────────
  function renderTbody(): void {
    // Sort a copy so the source array stays stable.
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return (av - bv) * sortDir;
    });
    tbody.replaceChildren();
    for (const row of sorted) {
      const tr = document.createElement("tr");
      tr.setAttribute("role", "button");
      tr.setAttribute("tabindex", "0");
      tr.setAttribute(
        "aria-label",
        `Audition scale in ${String(row.edoSteps)}-EDO (max error ${row.maxCentsError.toFixed(precision)}¢)`,
      );
      for (const col of columns) {
        const td = document.createElement("td");
        // T-02-23: textContent — never innerHTML.
        td.textContent = col.format(row, precision);
        tr.appendChild(td);
      }
      const triggerAudition = (): void => {
        // D-10: render the user's scale at the EDO's nearest steps and arpeggiate.
        const N = row.edoSteps;
        const freqs = scale.intervals.map((iv) => {
          const nearestStep = Math.round((iv.cents / 1200) * N);
          return baseHz * Math.pow(2, nearestStep / N);
        });
        synth.playArpeggio(freqs, stepSec);
      };
      tr.addEventListener("click", triggerAudition);
      tr.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          triggerAudition();
        }
      });
      tbody.appendChild(tr);
    }
    updateHeaderIndicators();
  }

  function updateHeaderIndicators(): void {
    for (const entry of headerEls) {
      if (entry.col.key === sortKey) {
        entry.arrow.textContent = sortDir === 1 ? "▲" : "▼";
        entry.arrow.setAttribute("data-active", "true");
        entry.th.setAttribute("aria-sort", sortDir === 1 ? "ascending" : "descending");
      } else {
        entry.arrow.textContent = "—";
        entry.arrow.setAttribute("data-active", "false");
        entry.th.setAttribute("aria-sort", "none");
      }
    }
  }

  function handleHeaderClick(key: SortKey): void {
    if (sortKey === key) {
      // Toggle direction on repeat click.
      sortDir = sortDir === 1 ? -1 : 1;
    } else {
      sortKey = key;
      sortDir = 1;
    }
    renderTbody();
  }

  // Initial render.
  renderTbody();

  return wrapper;
}
