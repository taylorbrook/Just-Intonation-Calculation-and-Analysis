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
      // Plan 04-06 deviation (Rule 3): scale-compare imports Plot via the
      // `npm:` prefix Framework resolves at runtime; Vitest needs a local
      // alias. @observablehq/plot is a devDependency (matches sw-synth pattern).
      "npm:@observablehq/plot": "@observablehq/plot",
      // Plan 07-04 deviation (Rule 3): src/lib/sonicweave.ts imports
      // `npm:sonic-weave` so Framework resolves it at build (Node's CJS loader
      // can't resolve the bare specifier — sonic-weave@0.14.1's "exports" map
      // has no `require`/`default` condition, only `import`/`types`). Vitest
      // needs the local alias. Matches the sw-synth / ji-lattice pattern.
      "npm:sonic-weave": "sonic-weave",
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
      // QUICK-9MN-01 — surface src/theme/ tests for the dark-mode toggle's
      // constants/helpers spec. Matches the per-subsystem glob pattern above.
      "src/theme/**/__tests__/**/*.test.ts",
      // Phase 5 (05-01) — surface src/state/ tests for the additive shared-scale
      // store (scale-store.ts). Without this the store spec is silently never
      // collected and the R1 / Nyquist gate is void. Matches the per-subsystem
      // glob pattern above.
      "src/state/**/__tests__/**/*.test.ts",
      "src/state/**/*.test.ts",
    ],
    exclude: ["node_modules/**", "dist/**", ".observablehq/**", "src/**/*.md"],
    environment: "node",
    globals: false,
    reporters: ["default"],
  },
});
