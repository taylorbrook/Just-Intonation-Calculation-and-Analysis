/**
 * sclIo — dashboard-only .scl + .kbm import/export controls (Phase 3 D-11).
 *
 * Layout:
 *   Row 1: "Import .scl or .kbm…" button (delegates to a hidden <input type="file">,
 *          accept=".scl,.kbm,text/plain"; auto-detects format by extension).
 *   Row 2: filename input (D-22 default `scale-{N}-tone-{YYYY-MM-DD}`) +
 *          two side-by-side export buttons:
 *            - "⤓ Download .scl"
 *            - "⤓ Download .kbm"
 *          Each button appends its own extension to the user-typed filename
 *          (UI-SPEC line 207: the per-button extension suffix span is dropped —
 *          each export button owns its extension).
 *   Row 3: status region (role=status aria-live=polite) for parser-error +
 *          import/export-success announcements (single shared region per D-11).
 *
 * Filename default per D-22: `scale-{N}-tone-{YYYY-MM-DD}`. Each export button
 * appends its own `.scl` / `.kbm` extension at download time.
 *
 * Import path: file picker → FileReader → ext-detect → parseScl|parseKbm →
 *   opts.onImport (.scl) | opts.onImportKbm (.kbm) callback. Errors from either
 *   parser are relayed through the status region as plain text via `textContent`
 *   (T-3-23 / T-02-14 stored-XSS mitigation — embedded HTML in a malicious .scl
 *   description or .kbm field renders as literal text, never as markup).
 *
 * Export path: writeScl(scale) | writeKbm(kbm) → Blob → URL.createObjectURL →
 *   anchor.click() → URL.revokeObjectURL. The anchor is appended to <body> for
 *   Firefox compat (some Firefox versions ignore .click() on detached elements)
 *   and removed synchronously after.
 *
 * ARCHITECTURE Pattern 2 factory. Three-layer discipline: imports types from
 * src/lib/scale.js and the kernel-level parseScl/writeScl + parseKbm/writeKbm/
 * defaultKbmFor from src/lib/scala.js + src/lib/kbm.js; no audio dependency.
 */
import { Scale } from "../lib/scale.js";
import { parseScl, writeScl } from "../lib/scala.js";
import { parseKbm, writeKbm, defaultKbmFor, type KbmMapping } from "../lib/kbm.js";
// CSS shipped via per-page `style:` frontmatter (src/styles.css). See
// play-interval.ts for the Plan-06-deferred rationale.

export interface SclIoOpts {
  /**
   * Called when a .scl file is successfully parsed. The dashboard reacts by
   * replacing the active scale with `newScale`.
   */
  onImport?: (scale: Scale, description: string) => void;
  /**
   * Override the auto-generated filename. Without extension — each export
   * button appends its own `.scl` / `.kbm` at download time.
   */
  defaultFilename?: string;
  /**
   * Phase 3 (D-11/D-13): called when a .kbm file is successfully parsed.
   * The dashboard wires this to a Mutable<KbmMapping|null> that drives the
   * "Use baseHz instead" toggle visibility and effectiveBaseHz derivation.
   */
  onImportKbm?: (kbm: KbmMapping) => void;
  /**
   * Phase 3 (D-12): the dashboard-computed KbmMapping to serialize when the
   * user clicks "Download .kbm". When undefined, defaultKbmFor(scale, baseHz)
   * is synthesized at click time (Pitfall #7-safe defaults: middle == ref == 69).
   */
  kbmForExport?: KbmMapping;
  /**
   * Phase 3: base reference Hz for default .kbm derivation when kbmForExport
   * is not provided. Defaults to 440 inside defaultKbmFor.
   */
  baseHz?: number;
}

/** D-22 default: `scale-{N}-tone-{YYYY-MM-DD}` (no extension). */
function defaultFilenameFor(scale: Scale): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  // Exclude the implicit 1/1 from the count so a 7-tone scale reads as
  // "scale-7-tone-..." not "scale-8-tone-...".
  const n = Math.max(0, scale.intervals.length - 1);
  return `scale-${String(n)}-tone-${today}`;
}

export function sclIo(scale: Scale, opts: SclIoOpts = {}): HTMLElement {
  const root = document.createElement("section");
  root.className = "scl-io";

  const heading = document.createElement("h2");
  heading.textContent = "Scala file (.scl)";
  root.appendChild(heading);

  // Status region declared early — referenced by both import and export rows.
  const status = document.createElement("div");
  status.className = "scl-io__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  // ─── Import row ──────────────────────────────────────────────────────────
  const importRow = document.createElement("div");
  importRow.className = "scl-io__row";

  // Hidden native file input — we drive it from the styled button. Phase 3
  // extends accept to include `.kbm` per D-11.
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".scl,.kbm,text/plain";

  const importBtn = document.createElement("button");
  importBtn.className = "scl-io__import";
  importBtn.type = "button";
  importBtn.textContent = "Import .scl or .kbm…"; // UI-SPEC line 128.
  importBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().endsWith(".kbm") ? "kbm" : "scl";
    const reader = new FileReader();
    reader.onload = () => {
      // readAsText always produces a string result (never ArrayBuffer); narrow
      // before use so TS' no-base-to-string lint stays happy.
      const result = reader.result;
      const text = typeof result === "string" ? result : "";
      try {
        if (ext === "kbm") {
          // Phase 3 (D-11/D-13): .kbm import path.
          const kbm = parseKbm(text);
          // T-3-23: textContent (NOT innerHTML) — embedded HTML in the .kbm
          // header renders as literal text.
          status.textContent = `Imported ${file.name} (size ${String(kbm.size)}, ref ${String(kbm.referenceKey)}, middle ${String(kbm.middleNote)}).`;
          opts.onImportKbm?.(kbm);
        } else {
          const parsed = parseScl(text);
          // Reconstruct a Scale from the parsed intervals; the parser returns
          // [1/1, ...pitches] so the LAST interval is the period (D-14, default).
          const newScale = new Scale(parsed.intervals);
          // T-02-14: textContent (NOT innerHTML) — embedded HTML in the .scl
          // description renders as literal text.
          status.textContent = `Imported ${file.name} (${String(parsed.intervals.length)} intervals).`;
          opts.onImport?.(newScale, parsed.description);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (ext === "kbm") {
          status.textContent = `Could not parse ${file.name}: ${msg}. Verify the size, first key, last key, middle note, reference key, reference frequency, and formal octave fields.`;
        } else {
          status.textContent = `Could not parse ${file.name}: ${msg}. Check that line 3 is the pitch count and pitch lines use ratios (5/4) or cents (408.0).`;
        }
      } finally {
        // Reset so picking the same file again still fires `change` (browser
        // de-dupes identical filename selections otherwise).
        fileInput.value = "";
      }
    };
    reader.onerror = () => {
      status.textContent = `Couldn't read ${file.name}. The dashboard scale is unchanged.`;
      fileInput.value = "";
    };
    reader.readAsText(file);
  });

  importRow.appendChild(importBtn);
  importRow.appendChild(fileInput);
  root.appendChild(importRow);

  // ─── Export row — filename input + two Download buttons ──────────────────
  const exportRow = document.createElement("div");
  exportRow.className = "scl-io__row";

  const filenameLabel = document.createElement("label");
  filenameLabel.className = "scl-io__filename-label";
  filenameLabel.textContent = "Filename";

  const filenameInput = document.createElement("input");
  filenameInput.type = "text";
  filenameInput.className = "scl-io__filename";
  filenameInput.value = opts.defaultFilename ?? defaultFilenameFor(scale);
  filenameLabel.appendChild(filenameInput);

  // Phase 3 (UI-SPEC line 207): the per-button extension suffix span is dropped
  // — each export button appends its own extension to the user-typed filename.

  // Wrap the two export buttons together so the layout stays tight; styled
  // by .scl-io__export-row in scl-io.css.
  const exportButtons = document.createElement("div");
  exportButtons.className = "scl-io__export-row";

  const exportSclBtn = document.createElement("button");
  exportSclBtn.className = "play-btn scl-io__export";
  exportSclBtn.type = "button";
  exportSclBtn.textContent = "⤓ Download .scl"; // UI-SPEC line 129.
  exportSclBtn.addEventListener("click", () => {
    const text = writeScl(scale);
    const blob = new Blob([text], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameInput.value}.scl`;
      // Firefox compat: append before click, remove after.
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Status announcement post-download (UI-SPEC line 136).
      status.textContent = `Downloaded ${filenameInput.value}.scl.`;
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  const exportKbmBtn = document.createElement("button");
  exportKbmBtn.className = "play-btn scl-io__export";
  exportKbmBtn.type = "button";
  exportKbmBtn.textContent = "⤓ Download .kbm"; // UI-SPEC line 130.
  exportKbmBtn.addEventListener("click", () => {
    // D-12: defaultKbmFor produces Pitfall #7-safe defaults (middle==ref==69)
    // when the dashboard hasn't supplied an explicit kbmForExport.
    const kbm = opts.kbmForExport ?? defaultKbmFor(scale, opts.baseHz ?? 440);
    const text = writeKbm(kbm);
    const blob = new Blob([text], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameInput.value}.kbm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Status announcement post-download (UI-SPEC line 137).
      status.textContent = `Downloaded ${filenameInput.value}.kbm.`;
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  exportButtons.appendChild(exportSclBtn);
  exportButtons.appendChild(exportKbmBtn);

  exportRow.appendChild(filenameLabel);
  exportRow.appendChild(exportButtons);
  root.appendChild(exportRow);

  root.appendChild(status);

  return root;
}
