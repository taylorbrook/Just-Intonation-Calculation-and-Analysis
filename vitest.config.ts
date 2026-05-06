import { defineConfig } from "vitest/config";

export default defineConfig({
  // Plan 07 deviation (Rule 3 — blocking issue):
  //   The Observable Framework runtime resolves bare specifiers ("sw-synth")
  //   through Node's CJS loader, which enforces the package's "exports" field.
  //   sw-synth@0.4.0's package.json declares "type": "module" but has no
  //   "exports" field, so Node throws ERR_PACKAGE_PATH_NOT_EXPORTED at build
  //   time. Framework's documented workaround is the `npm:` prefix, which
  //   routes the import through jsDelivr's `+esm` URL — Framework supports
  //   that scheme directly without consulting Node's resolver.
  //
  //   We use `npm:sw-synth` everywhere in src/audio/synth.ts. Vitest does
  //   NOT understand the `npm:` prefix, so this alias maps the prefix back
  //   to the local node_modules dependency for unit-test resolution. Production
  //   builds use jsDelivr; tests use the local install — both load the same
  //   v0.4.0 code.
  //
  //   Removing this alias when sw-synth ships an "exports" field upstream is
  //   safe — see https://github.com/xenharmonic-devs/sw-synth/issues/?
  //
  //   Plan 03-06 added the same workaround for `npm:ji-lattice` (consumed by
  //   src/components/lattice.ts). ji-lattice@0.3.2 has the same missing-
  //   "exports" field shape; once index.md imports lattice.ts, Framework's
  //   build resolver hits the same ERR_PACKAGE_PATH_NOT_EXPORTED. Same fix.
  resolve: {
    alias: {
      "npm:sw-synth": "sw-synth",
      "npm:ji-lattice": "ji-lattice",
    },
  },
  test: {
    include: [
      "src/lib/**/__tests__/**/*.test.ts",
      "src/lib/**/*.test.ts",
      "src/audio/**/__tests__/**/*.test.ts",
      "src/audio/**/*.test.ts",
      "src/__tests__/**/*.test.ts",
      "src/components/**/__tests__/**/*.test.ts",
    ],
    exclude: ["node_modules/**", "dist/**", ".observablehq/**", "src/**/*.md"],
    environment: "node",
    globals: false,
    reporters: ["default"],
  },
});
