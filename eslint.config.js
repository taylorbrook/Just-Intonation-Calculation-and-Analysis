// ESLint 9 flat config.
// Per D-12: @typescript-eslint/recommended-type-checked baseline.
// Don't lint markdown JS code blocks (Framework owns transpilation; linting them fights the runtime).
//
// Note: type-checked rules require parserOptions.project, which only applies to files inside
// the tsconfig include glob (src/**/*.ts plus the two TS config files). Applying type-checked
// rules to JS config files at repo root would fail with "no parser services" errors. We scope
// the type-checked baseline to src/ only, and lint config files with the non-type-checked baseline.
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".observablehq/**",
      "src/.observablehq/**",
      "src/**/*.md",
    ],
  },
  // Type-checked baseline applied ONLY to src/ TypeScript and JavaScript files.
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts", "src/**/*.js"],
  })),
  {
    files: ["src/**/*.ts", "src/**/*.js"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Vitest test files: relax a couple of strict rules that don't apply.
    files: ["src/lib/**/__tests__/**/*.ts", "src/lib/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  {
    // R-01 (Phase 2 RESEARCH): ban importing `Fraction` from xen-dev-utils.
    // The xen-dev-utils Fraction is Number-backed and silently loses precision
    // for large numerators; Phase 2 requires the BigInt-backed Fraction from
    // fraction.js@5.3.4. See src/lib/INVENTORY.md and 02-RESEARCH.md §Risks → R-01.
    files: ["src/**/*.ts", "src/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "xen-dev-utils",
              importNames: ["Fraction"],
              message:
                "Use the BigInt-backed `Fraction` from `fraction.js` instead. See INVENTORY.md and 02-RESEARCH.md R-01.",
            },
          ],
        },
      ],
    },
  },
);
