// See https://observablehq.com/framework/config for documentation.
export default {
  title: "Tuning Systems",
  root: "src",
  theme: ["air", "near-midnight"],
  style: "styles.css",
  toc: true,
  pager: "main",
  pages: [
    { name: "Dashboard", path: "/" },
    { name: "Analysis", path: "/pages/analysis" },
    {
      name: "Theory notes",
      open: true,
      pages: [{ name: "The syntonic comma", path: "/pages/syntonic-comma" }],
    },
  ],
  head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" integrity="sha384-UA8juhPf75SzzAMA/4fo3yOU7sBJ0om7SCD2GHq0fZqZco6tr1UCV7nUbk9J90JM" crossorigin="anonymous">`,
};
