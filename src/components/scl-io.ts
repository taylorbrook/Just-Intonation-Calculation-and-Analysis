/**
 * sclIo — dashboard-only .scl import/export controls.
 *
 * Layout:
 *   Row 1: "Import .scl…" button (delegates to a hidden <input type="file">)
 *   Row 2: filename input (D-22 default `scale-{N}-tone-{YYYY-MM-DD}`) +
 *          "⤓ Download .scl" button
 *   Row 3: status region (role=status aria-live=polite) for parser-error +
 *          import-success announcements
 *
 * Filename default per D-22: `scale-{N}-tone-{YYYY-MM-DD}.scl`. The user can
 * edit the input before clicking Download; the `.scl` extension is shown
 * adjacent to the input as a visual reminder so the user doesn't double-type
 * it. We always append `.scl` to whatever they typed.
 *
 * Import path: file picker → FileReader → parseScl → opts.onImport callback.
 * Errors from parseScl (negative-ratio, count mismatch, oversize input) are
 * relayed through the status region as plain text via `textContent` (T-02-14
 * stored-XSS mitigation — embedded HTML in a malicious .scl description renders
 * as literal text, never as markup).
 *
 * Export path: writeScl(scale) → Blob → URL.createObjectURL → anchor.click()
 * → URL.revokeObjectURL. The anchor is appended to <body> for Firefox compat
 * (some Firefox versions ignore .click() on detached elements) and removed
 * synchronously after.
 *
 * ARCHITECTURE Pattern 2 factory. Three-layer discipline: imports types from
 * src/lib/scale.js and the kernel-level parseScl/writeScl from src/lib/scala.js;
 * no audio dependency.
 */
import { Scale } from "../lib/scale.js";
import { parseScl, writeScl } from "../lib/scala.js";
// CSS shipped via per-page `style:` frontmatter (src/styles.css). See
// play-interval.ts for the Plan-06-deferred rationale.

export interface SclIoOpts {
  /**
   * Called when a .scl file is successfully parsed. The dashboard reacts by
   * replacing the active scale with `newScale`.
   */
  onImport?: (scale: Scale, description: string) => void;
  /**
   * Override the auto-generated filename. Without extension — `.scl` is
   * appended at download time.
   */
  defaultFilename?: string;
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

  // Hidden native file input — we drive it from the styled button.
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".scl,text/plain";

  const importBtn = document.createElement("button");
  importBtn.className = "scl-io__import";
  importBtn.type = "button";
  importBtn.textContent = "Import .scl…"; // UI-SPEC copywriting.
  importBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // readAsText always produces a string result (never ArrayBuffer); narrow
      // before use so TS' no-base-to-string lint stays happy.
      const result = reader.result;
      const text = typeof result === "string" ? result : "";
      try {
        const parsed = parseScl(text);
        // Reconstruct a Scale from the parsed intervals; the parser returns
        // [1/1, ...pitches] so the LAST interval is the period (D-14, default).
        const newScale = new Scale(parsed.intervals);
        // T-02-14: textContent (NOT innerHTML) — embedded HTML in the .scl
        // description renders as literal text.
        const pitchCount = parsed.intervals.length - 1; // exclude unison
        status.textContent = `Loaded "${parsed.description}" — ${String(pitchCount)} pitches.`;
        opts.onImport?.(newScale, parsed.description);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        status.textContent = `Couldn't parse ${file.name}: ${msg}. The dashboard scale is unchanged.`;
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

  // ─── Export row — filename input + Download button ───────────────────────
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

  const ext = document.createElement("span");
  ext.className = "scl-io__filename-ext";
  ext.textContent = ".scl";
  filenameLabel.appendChild(ext);

  const exportBtn = document.createElement("button");
  exportBtn.className = "play-btn scl-io__export";
  exportBtn.type = "button";
  exportBtn.textContent = "⤓ Download .scl"; // UI-SPEC: NOT "Export".
  exportBtn.addEventListener("click", () => {
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
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  exportRow.appendChild(filenameLabel);
  exportRow.appendChild(exportBtn);
  root.appendChild(exportRow);

  root.appendChild(status);

  return root;
}
