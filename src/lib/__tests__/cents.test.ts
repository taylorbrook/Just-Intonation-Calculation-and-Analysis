import { describe, it, expect } from "vitest";
import { toCents, centsFrom12tet } from "../cents.js";

describe("cents helpers", () => {
  it("toCents(1.5) is between 701.9 and 702.0 (≈ 701.955)", () => {
    const c = toCents(1.5);
    expect(c).toBeGreaterThan(701.9);
    expect(c).toBeLessThan(702.0);
  });

  it("toCents([-4, 4, -1]) ≈ 21.51 (syntonic comma)", () => {
    const c = toCents([-4, 4, -1]);
    expect(c).toBeGreaterThan(21.4);
    expect(c).toBeLessThan(21.6);
  });

  it("centsFrom12tet(701.955) ≈ +1.955", () => {
    const dev = centsFrom12tet(701.955);
    expect(dev).toBeGreaterThan(1.9);
    expect(dev).toBeLessThan(2.0);
  });

  it("centsFrom12tet(-1100) ≈ 0", () => {
    expect(centsFrom12tet(-1100)).toBe(0);
  });
});
