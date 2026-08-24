/**
 * scaleTable — 5-column table per D-06: Degree | Ratio | Cents | ¢ from 12-TET | Hz.
 *
 * The Hz column is a DISPLAY PROJECTION of `Scale.degreeToFreq` — the same
 * projection the ⏵⏵ Play path uses — so it honors whatever reference pitch the
 * calling page passes as `baseHz`, and the printed number can never drift from
 * the sounded one. A non-finite or non-positive `baseHz` renders an em-dash
 * placeholder rather than printing "NaN"/"Infinity" as if it were a real pitch.
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
 * Defense-in-depth (T-02-22, T-02-23): ALL cell values — header and data alike —
 * go through `createElement` + `textContent` (NEVER `innerHTML`) so any future code
 * path that surfaces user-controlled content as a ratio/cents value renders as
 * literal text. The static `<th>` header row is built the same way for a uniform
 * no-innerHTML discipline (even though its labels are constant strings).
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
   * Hz decimal places. Default 2 — two decimals reads cleanly for audible
   * frequencies. (The clipboard payload keeps its own 3-decimal precision;
   * this option does not affect it.)
   */
  hzPrecision?: number;
  /**
   * SURF-06 tempered variant (D-01, D-02). When true, the Ratio column is
   * DROPPED entirely (Degree | Cents | ¢ from 12-TET | Hz only) and a visible
   * "tempered" badge renders above the table — so EDO/ED-n output is never
   * presented as exact JI ("tempered, not laundered JI"). Dropping the ratio
   * COLUMN never drops the Hz VALUE. Default false: the JI path keeps its Ratio
   * column.
   */
  tempered?: boolean;
}

export function scaleTable(scale: Scale, baseHz: number, opts: ScaleTableOpts = {}): HTMLElement {
  const precision = opts.precision ?? 1;
  const hzPrecision = opts.hzPrecision ?? 2;
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
  // Header row via createElement + textContent (never innerHTML) — uniform with the
  // no-innerHTML discipline used for the data cells (T-02-23). D-01: the tempered
  // header has FOUR columns (no Ratio); the JI header keeps its labels and both
  // gain Hz as a pure append at the end.
  const headerRow = document.createElement("tr");
  const headerLabels = tempered
    ? ["Degree", "Cents", "¢ from 12-TET", "Hz"]
    : ["Degree", "Ratio", "Cents", "¢ from 12-TET", "Hz"];
  for (const label of headerLabels) {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
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
    // Hz via Scale.degreeToFreq — the SAME projection the ⏵⏵ Play path uses, so
    // the printed number and the sounded number can never drift apart. Sourcing
    // it from the method (rather than recomputing baseHz * fraction inline) is
    // the whole point. The loop index is always in range, so degreeToFreq's
    // RangeError branch is unreachable here.
    const freq = scale.degreeToFreq(i, baseHz);
    // An honest placeholder beats a fake pitch: a non-finite or non-positive
    // reference renders an em-dash, never "NaN" / "Infinity" / "0.00".
    const hz = Number.isFinite(freq) && freq > 0 ? freq.toFixed(hzPrecision) : "—";
    // D-01: tempered drops the ratio cell entirely (no float-derived fraction
    // masquerading as exact JI). Hz is appended last on BOTH branches.
    const cells: string[] = tempered
      ? [String(i + 1), cents.toFixed(precision), deviation, hz]
      : [String(i + 1), iv.fraction.toFraction(), cents.toFixed(precision), deviation, hz];
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
