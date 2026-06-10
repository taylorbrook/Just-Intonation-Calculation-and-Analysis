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
// CSS shipped via per-page `style:` frontmatter (src/styles.css). See
// play-interval.ts for the Plan-06-deferred rationale.

export interface ScaleTableOpts {
  copyButton?: boolean;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
  /**
   * SURF-06 tempered variant (D-01, D-02). When true, the Ratio column is
   * DROPPED entirely (Degree | Cents | ¢ from 12-TET only) and a visible
   * "tempered" badge renders above the table — so EDO/ED-n output is never
   * presented as exact JI ("tempered, not laundered JI"). Default false: the
   * JI 4-column path is byte-for-byte unchanged (anti-regression).
   */
  tempered?: boolean;
}

export function scaleTable(scale: Scale, baseHz: number, opts: ScaleTableOpts = {}): HTMLElement {
  const precision = opts.precision ?? 1;
  const tempered = opts.tempered === true;

  const wrapper = document.createElement("div");
  wrapper.className = "scale-table";

  // D-02: tempered badge renders BEFORE the table. createElement + textContent
  // (never innerHTML) — literal text, but follow the discipline (T-06-08).
  if (tempered) {
    const badge = document.createElement("span");
    badge.className = "scale-table__badge";
    badge.textContent = "tempered";
    wrapper.appendChild(badge);
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  // Static header content — no interpolated values, innerHTML is safe and
  // keeps the <th> tags readable. D-01: the tempered header has THREE columns
  // (no Ratio); the JI header keeps the original four-column string verbatim.
  thead.innerHTML = tempered
    ? "<tr><th>Degree</th><th>Cents</th><th>¢ from 12-TET</th></tr>"
    : "<tr><th>Degree</th><th>Ratio</th><th>Cents</th><th>¢ from 12-TET</th></tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  scale.intervals.forEach((iv, i) => {
    const tr = document.createElement("tr");
    const cents = iv.cents;
    const delta = iv.centsFrom12tet;
    // Render the deviation with an explicit + sign for positives so users
    // can scan a column of "+3.9 / -13.7 / +4.0" at a glance. UI-SPEC color
    // rule: NO color-coding the deviation column (no red/green) — sign is
    // typographic only.
    const deviation = (delta > 0 ? "+" : "") + delta.toFixed(precision);
    // D-01: tempered drops the ratio cell entirely (no float-derived fraction
    // masquerading as exact JI). The JI path keeps the original 4 cells verbatim.
    const cells: string[] = tempered
      ? [String(i + 1), cents.toFixed(precision), deviation]
      : [String(i + 1), iv.fraction.toFraction(), cents.toFixed(precision), deviation];
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
