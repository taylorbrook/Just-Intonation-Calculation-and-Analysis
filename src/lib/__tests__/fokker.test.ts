import { describe, it, expect } from "vitest";
import { fokkerCardinality } from "../fokker.js";

describe("fokkerCardinality — comma-mode |det| readout (GEN-08 / D-12)", () => {
  it("the classic 81/80 + 128/125 block has cardinality 12", () => {
    expect(fokkerCardinality(["81/80", "128/125"])).toBe(12);
  });

  it("a non-square comma set (wrong comma count for the prime subspace) throws RangeError", () => {
    // One comma in a (3,5) subspace is non-square (1 row × 2 cols) → RangeError.
    expect(() => fokkerCardinality(["81/80"])).toThrow(RangeError);
  });

  it("too many commas (exceeding the defense-in-depth comma cap) throws RangeError", () => {
    const tooMany = [
      "81/80",
      "128/125",
      "2048/2025",
      "3125/3072",
      "6561/6400",
      "16875/16384",
      "32805/32768",
      "78732/78125",
      "393216/390625",
    ];
    expect(() => fokkerCardinality(tooMany)).toThrow(RangeError);
  });
});
