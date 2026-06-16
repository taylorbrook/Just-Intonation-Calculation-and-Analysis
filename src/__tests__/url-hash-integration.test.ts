import { describe, it, expect } from "vitest";
import { encodeScaleToHash, decodeHashToScale } from "../lib/url.js";
import { parseScala } from "../lib/scala.js";

/**
 * Phase 4 ANAL-04 integration test: the URL hash round-trip must preserve the
 * parsed scale exactly (BigInt Fraction equality, Pitfall #1 — never cents).
 * This is the smallest reliable detector for drift between encodeScaleToHash,
 * decodeHashToScale, and parseScala — if anyone changes one without updating
 * the others, this fails.
 *
 * The seed text mirrors src/index.md and src/pages/analysis.md verbatim.
 */

describe("URL hash round-trip preserves the parsed scale", () => {
  it("seed scale (7-limit JI heptatonic) round-trips exactly", () => {
    const seedText = `9/8
5/4
21/16
3/2
27/16
7/4
2/1`;
    const encoded = encodeScaleToHash(seedText);
    expect(encoded).not.toBeNull();
    const decoded = decodeHashToScale(encoded ?? "");
    expect(decoded).toBe(seedText);
    const original = parseScala(seedText);
    const restored = parseScala(decoded ?? "");
    expect(restored.length).toBe(original.length);
    for (let i = 0; i < original.length; i++) {
      const a = restored[i];
      const b = original[i];
      // Phase 1 D-16 (noUncheckedIndexedAccess): a/b are `Interval | undefined`.
      // Existing Phase 2/3 tests use this same guard pattern.
      expect(a && b ? a.equals(b) : false).toBe(true);
    }
  });

  it("malformed hash returns null and downstream falls back", () => {
    expect(decodeHashToScale("!!!malformed!!!")).toBeNull();
  });

  it("oversized hash returns null", () => {
    expect(decodeHashToScale("A".repeat(20000))).toBeNull();
  });

  it("encoded hash uses URL-safe alphabet only", () => {
    const seedText = "9/8\n2/1";
    const hash = encodeScaleToHash(seedText);
    expect(hash).not.toBeNull();
    expect(hash ?? "").toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns null on > 8 KB plaintext instead of throwing", () => {
    // "9/8\n" is 4 bytes; ×3000 ≈ 12 KB, well over the 8192-byte cap.
    const oversized = "9/8\n".repeat(3000);
    expect(() => encodeScaleToHash(oversized)).not.toThrow();
    expect(encodeScaleToHash(oversized)).toBeNull();
  });
});
