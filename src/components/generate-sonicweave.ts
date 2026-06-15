/**
 * generate-sonicweave — free-text SonicWeave escape hatch (GEN-09, Phase 7
 * D-13 / D-14 / D-15 / D-16 / D-20). Delivers parked TEMP-07 (full DSL access).
 *
 * Wired into the Generate picker under a "SonicWeave" optgroup (Plan 04).
 * Pattern-2 factory: (synth, opts?) => HTMLElement. The escape hatch: a
 * <textarea> for an arbitrary SonicWeave program + an "Evaluate" button. The
 * widget owns closure-local state (no module-level state), a status region
 * (role="status" aria-live="polite"), and rebuild() that swaps the table + Play
 * button via replaceChildren.
 *
 * Evaluate-on-click ONLY (D-16): rebuild() is wired to the Evaluate button click
 * — there is NO textarea input listener that re-evaluates. Editing the textarea
 * never triggers a build; the user clicks Evaluate. Full multi-line programs are
 * accepted verbatim (evaluateSource handles them). The 8 KB byte cap is enforced
 * INSIDE the adapter (MAX_SCALE_TEXT_BYTES); the widget surfaces result.error.
 *
 * Error handling (D-15): on result.error (parse/eval error, empty scale, or
 * over-cap) the RAW adapter message is written verbatim to the status region via
 * textContent (XSS-safe — T-07-11, never innerHTML) and the prior table/play
 * hosts are PRESERVED (the generate-cps.ts:233-248 idiom — NOT cleared).
 *
 * CONDITIONAL tempered (D-13): unlike Fokker, free-text can produce tempered
 * scales (cents literals, EDO steps, optimal tunings). The widget renders via
 * `scaleTable(scale, baseHz, { tempered: result.tempered })` and exposes
 * `isTempered() => result.tempered` so generate.md serializes Send-to as ratios
 * (JI) or cents-per-line (tempered). The cps([1,3,5,7],2) default is exact JI →
 * isTempered() === false initially.
 *
 * Docs link (D-14/D-20): an <a rel="noopener noreferrer"> to the SonicWeave
 * documentation (T-07-14 — no window.opener leakage), placed near the textarea.
 *
 * Three-layer purity: imports the scaleFromSonicWeave kernel + the scaleTable /
 * playScale output components + the SynthHandle type. No DOM-in-kernel bleed.
 * All dynamic content via createElement + textContent (never innerHTML — T-07-11).
 */
import type { Scale } from "../lib/scale.js";
import { scaleFromSonicWeave } from "../lib/sonicweave.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateSonicweaveOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
}

/**
 * A root element that also exposes the widget's current Scale + tempered marker.
 * isTempered() is CONDITIONAL — from the adapter's result.tempered (the cps
 * default is false; a tempered program is true).
 */
export interface GenerateSonicweaveElement extends HTMLElement {
  /** The widget's current Scale, or null if the last build errored before any render. */
  getScale(): Scale | null;
  /** True if the last successful build was tempered (cents-of-record). */
  isTempered(): boolean;
}

/** D-13 default landing program — the Hexany (exact JI, 6 block notes + 1/1). */
const DEFAULT_PROGRAM = "cps([1,3,5,7], 2)";

/**
 * D-14/D-20 docs link target — the SonicWeave DSL documentation. The dsl.md page
 * is the most user-facing stable URL for the free-text widget (RESEARCH Sources
 * secondary).
 */
const DOCS_URL = "https://github.com/xenharmonic-devs/sonic-weave/blob/main/documentation/dsl.md";

export function generateSonicweave(
  synth: SynthHandle,
  opts: GenerateSonicweaveOpts = {},
): GenerateSonicweaveElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  let currentScale: Scale | null = null;
  let temperedFlag = false;

  const root = document.createElement("section") as GenerateSonicweaveElement;
  root.className = "generate-sonicweave";

  const heading = document.createElement("h2");
  heading.textContent = "SonicWeave (free text)"; // UI copy.
  root.appendChild(heading);

  // ─── Docs link (D-14/D-20) — near the textarea, above it. ───────────────────
  const docsP = document.createElement("p");
  docsP.className = "generate-sonicweave__docs";
  docsP.appendChild(document.createTextNode("Write any SonicWeave program. See the "));
  const docsLink = document.createElement("a");
  docsLink.href = DOCS_URL;
  docsLink.textContent = "SonicWeave documentation";
  docsLink.rel = "noopener noreferrer"; // T-07-14 — no window.opener leakage.
  docsLink.target = "_blank";
  docsP.appendChild(docsLink);
  docsP.appendChild(document.createTextNode(" for the full DSL."));
  root.appendChild(docsP);

  // ─── Textarea (the free-text input) ─────────────────────────────────────────
  const textarea = document.createElement("textarea");
  textarea.name = "sonicweave-source"; // name for happy-dom selectors.
  textarea.className = "generate-sonicweave__textarea";
  textarea.rows = 6;
  textarea.spellcheck = false;
  textarea.setAttribute("aria-label", "SonicWeave program");
  // A first clamp on input length; the authoritative 8 KB byte cap is in the adapter.
  textarea.maxLength = 8192;
  textarea.value = DEFAULT_PROGRAM; // D-13 default landing program.
  root.appendChild(textarea);

  // ─── Evaluate button (click-driven evaluation — D-16) ──────────────────────
  const evalRow = document.createElement("div");
  evalRow.className = "generate-sonicweave__actions";
  const evalBtn = document.createElement("button");
  evalBtn.type = "button";
  evalBtn.name = "sonicweave-evaluate";
  evalBtn.className = "generate-sonicweave__evaluate";
  evalBtn.textContent = "Evaluate";
  evalRow.appendChild(evalBtn);
  root.appendChild(evalRow);

  // ─── Status region (raw adapter errors — D-15) ──────────────────────────────
  const status = document.createElement("div");
  status.className = "generate-sonicweave__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + Play button ────────────────────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-sonicweave__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-sonicweave__play-host";
  root.appendChild(playHost);

  /**
   * Read the textarea verbatim, evaluate via the adapter, render or surface the
   * error. On error the prior table/play hosts are PRESERVED (D-15).
   */
  function rebuild(): void {
    const result = scaleFromSonicWeave(textarea.value);
    if (result.scale === null) {
      // D-15: raw compiler error verbatim via textContent (XSS-safe, T-07-11);
      // PRESERVE the prior render (tableHost / playHost are intentionally NOT
      // cleared) — the generate-cps error idiom.
      status.textContent = result.error ?? "Could not evaluate the program.";
      return;
    }
    // Success: conditional tempered flag (D-13). Tempered programs render
    // cents-primary + badge; exact JI renders the 4-column Ratio table.
    tableHost.replaceChildren(
      scaleTable(result.scale, baseHz, { precision, tempered: result.tempered }),
    );
    playHost.replaceChildren(playScale(result.scale, synth, { baseHz }));
    currentScale = result.scale;
    temperedFlag = result.tempered;
    status.textContent = "";
  }

  // ─── Wire the Evaluate button ONLY (D-16 — NEVER per keystroke). ────────────
  evalBtn.addEventListener("click", () => {
    rebuild();
  });

  // Expose the current Scale + tempered marker for Send-to serialization.
  root.getScale = () => currentScale;
  root.isTempered = () => temperedFlag;

  // ─── Initial render — D-13 default (cps([1,3,5,7],2) Hexany previews). ──────
  rebuild();

  return root;
}
