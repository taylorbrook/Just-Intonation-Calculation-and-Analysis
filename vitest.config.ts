import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/lib/**/__tests__/**/*.test.ts", "src/lib/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**", ".observablehq/**", "src/**/*.md"],
    environment: "node",
    globals: false,
    reporters: ["default"],
  },
});
