import { describe, it, expect } from "vitest";

// R1 boot-equivalence gate (D-12 / SYNC-04). Pure node-env, no DOM — mirrors
// src/__tests__/dashboard-seed.test.ts (vitest globals via explicit import).
//
// This is the wave-0 phase gate: the empty-store-boots-byte-identically-to-v1.0
// invariant is a single fast unit assertion. The precedence helper this test
// pins is `resolveInitialScaleText(hashDecoded, stored, seedText)` —
// `hashDecoded ?? stored?.text ?? seedText` — so that when `stored === null`
// (the empty store) the result is byte-identical to today's `hash ?? seed`
// precedence baked into src/index.md (boot line 78) and
// src/pages/analysis.md (boot line 70).
import { resolveInitialScaleText } from "../state/scale-store.js";

const seed = `9/8\n5/4\n21/16\n3/2\n27/16\n7/4\n2/1`;
const hash = `3/2\n2/1`;

describe("resolveInitialScaleText — R1 boot-equivalence gate (SYNC-04)", () => {
  // Test 1 — the SYNC-04 invariant: with an EMPTY store (stored === null) the
  // result is byte-identical to today's `hash ?? seed`.
  it("empty store with no hash boots byte-identically to the seed", () => {
    expect(resolveInitialScaleText(null, null, seed)).toBe(seed);
  });

  it("empty store with a hash boots byte-identically to the decoded hash", () => {
    expect(resolveInitialScaleText(hash, null, seed)).toBe(hash);
  });

  // Test 2 — C-3 precedence: hash beats store beats seed.
  it("hash wins over a non-null store", () => {
    const stored = { text: `7/4\n2/1`, source: "generate" };
    expect(resolveInitialScaleText(hash, stored, seed)).toBe(hash);
  });

  it("store wins over the seed when there is no hash", () => {
    const stored = { text: `7/4\n2/1`, source: "generate" };
    expect(resolveInitialScaleText(null, stored, seed)).toBe(stored.text);
  });

  it("seed is the final fallback when hash and store are both absent", () => {
    expect(resolveInitialScaleText(null, null, seed)).toBe(seed);
  });

  // Test 3 — never throws on the all-null boot path.
  it("never throws when hash and store are null", () => {
    expect(() => resolveInitialScaleText(null, null, seed)).not.toThrow();
  });
});
