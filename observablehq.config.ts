// See https://observablehq.com/framework/config for documentation.
// QUICK-TUX-01 — colocated import for the site-wide audio toolbar head payload.
// Framework convention: import .ts as .js (Framework transpiles via esbuild).
import { audioToolbarHeadPayload } from "./src/components/audio-toolbar.js";
// QUICK-9MN-01 — dark-mode toggle head payload. MUST be interpolated BEFORE
// the audio toolbar payload (and before any other head content) so the
// synchronous IIFE applies the html[data-tuning-systems-theme] attribute
// before first paint (FOUC fix — locked decision 3).
import { themeHeadPayload } from "./src/components/theme-head.js";

export default {
  title: "Tuning Systems",
  root: "src",
  theme: ["air", "near-midnight"],
  style: "styles.css",
  toc: true,
  pager: "main",
  header: `<div style="display:flex; align-items:baseline; gap:1rem;"><a href="/" style="font-weight:600; text-decoration:none; color:inherit;">Tuning Systems</a><span style="font-size:0.85em; color:var(--theme-foreground-muted);"><a href="/" style="color:inherit; text-decoration:none;">Dashboard</a> · <a href="/pages/analysis" style="color:inherit; text-decoration:none;">Analysis</a> · <a href="/pages/generate" style="color:inherit; text-decoration:none;">Generate</a> · <a href="/pages/syntonic-comma" style="color:inherit; text-decoration:none;">Theory</a></span></div>`,
  footer: `<div>Source on <a href="https://github.com/" style="color:inherit;">GitHub</a> · Last built ${new Date().toISOString().slice(0, 10)}</div>`,
  pages: [
    { name: "Dashboard", path: "/" },
    { name: "Analysis", path: "/pages/analysis" },
    { name: "Generate", path: "/pages/generate" },
    {
      name: "Theory notes",
      open: true,
      pages: [
        { name: "The harmonic series", path: "/pages/harmonic-series" },
        { name: "Monzos", path: "/pages/monzos" },
        { name: "Prime-limits", path: "/pages/prime-limits" },
        { name: "Odd-limits", path: "/pages/odd-limits" },
        { name: "Otonality & utonality", path: "/pages/otonality-utonality" },
        { name: "The syntonic comma", path: "/pages/syntonic-comma" },
        { name: "Comma pump", path: "/pages/comma-pump" },
        { name: "Commas (glossary)", path: "/pages/commas" },
        { name: "The Pythagorean comma", path: "/pages/pythagorean-comma" },
        { name: "Pythagorean tuning", path: "/pages/pythagorean-tuning" },
        { name: "Meantone", path: "/pages/meantone" },
        { name: "Well-temperaments", path: "/pages/well-temperament" },
        { name: "EDO approximations", path: "/pages/edo-approximation" },
        { name: "The schisma", path: "/pages/schisma" },
        { name: "The septimal comma", path: "/pages/septimal-comma" },
        { name: "Tenney height", path: "/pages/tenney-height" },
      ],
    },
    {
      name: "Tools",
      open: true,
      pages: [{ name: "Scale Workshop interop", path: "/pages/scale-workshop-interop" }],
    },
  ],
  head: `${themeHeadPayload()}<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM" crossorigin="anonymous">${audioToolbarHeadPayload()}`,
};
