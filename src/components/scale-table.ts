/**
 * scaleTable — 4-column table per D-06: Degree | Ratio | Cents | ¢ from 12-TET.
 *
 * Cents at 0.1¢ default precision (Pitfall #16: 0.1¢ is the JND-friendly default;
 * the dashboard could opt into 0.01¢ via `opts.precision = 2` if/when sub-cent
 * comparison becomes interesting).
 *
 * Optional `opts.copyButton`: renders a "Copy table" button below the table that
 * writes scalaToCsv(scale, baseHz) to the clipboard. This is the IO-04 user-
 * facing surface (the data path lives in src/lib/scala.ts where it's testable
 * without DOM).
 *
 * Defense-in-depth (T-02-22, T-02-23): all dynamic cell values go through
 * `createElement` + `textContent` (NEVER `innerHTML`) so any future code path
 * that surfaces user-controlled content as a ratio/cents value renders as
 * literal text. The static `<th>` row uses `innerHTML` because it contains
 * no interpolated values.
 *
 * ARCHITECTURE Pattern 2 factory. Three-layer discipline: imports type from
 * src/lib/scale.js and the scalaToCsv helper from src/lib/scala.js (a kernel
 * module — fine).
 */
import type { Scale } from "../lib/scale.js";
import { scalaToCsv } from "../lib/scala.js";
import "./scale-table.css";

export interface ScaleTableOpts {
  copyButton?: boolean;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

export function scaleTable(scale: Scale, baseHz: number, opts: ScaleTableOpts = {}): HTMLElement {
  const precision = opts.precision ?? 1;

  const wrapper = document.createElement("div");
  wrapper.className = "scale-table";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  // Static header content — no interpolated values, innerHTML is safe and
  // keeps the four <th> tags readable.
  thead.innerHTML = "<tr><th>Degree</th><th>Ratio</th><th>Cents</th><th>¢ from 12-TET</th></tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  scale.intervals.forEach((iv, i) => {
    const tr = document.createElement("tr");
    const cents = iv.cents;
    const delta = iv.centsFrom12tet;
    const cells: string[] = [
      String(i + 1),
      iv.fraction.toFraction(),
      cents.toFixed(precision),
      // Render the deviation with an explicit + sign for positives so users
      // can scan a column of "+3.9 / -13.7 / +4.0" at a glance. UI-SPEC color
      // rule: NO color-coding the deviation column (no red/green) — sign is
      // typographic only.
      (delta > 0 ? "+" : "") + delta.toFixed(precision),
    ];
    for (const value of cells) {
      const td = document.createElement("td");
      td.textContent = value; // T-02-23: textContent — never innerHTML.
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);

  if (opts.copyButton) {
    const copyBtn = document.createElement("button");
    copyBtn.className = "scale-table__copy";
    copyBtn.type = "button";
    copyBtn.textContent = "Copy table";
    copyBtn.setAttribute("aria-live", "polite");
    copyBtn.addEventListener("click", () => {
      const tsv = scalaToCsv(scale, baseHz);
      void navigator.clipboard.writeText(tsv).then(
        () => {
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.textContent = "Copy table";
          }, 1500);
        },
        () => {
          copyBtn.textContent = "Couldn't copy. Select the table and use ⌘C.";
        },
      );
    });
    wrapper.appendChild(copyBtn);
  }

  return wrapper;
}
