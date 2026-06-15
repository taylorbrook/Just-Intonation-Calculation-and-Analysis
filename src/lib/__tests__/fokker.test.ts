import { describe, it, expect } from "vitest";
import { fokkerCardinality, reducedSubspaceMatrix } from "../fokker.js";

describe("fokkerCardinality — comma-mode |det| readout (GEN-08 / D-12)", () => {
  it("the classic 81/80 + 128/125 block has cardinality 12", () => {
    expect(fokkerCardinality(["81/80", "128/125"])).toBe(12);
  });

  it("the 2.3.7-subgroup block 64/63 + 2401/2187 has cardinality 15 (prime-5 column droppable → reduced {3,7} |det| = 15)", () => {
    // Fix #4: the old width−1 squareness gate wrongly rejected this valid subgroup
    // block (2 commas, full monzo width 4 → demanded 3 commas). The drop-zero-column
    // gate sees the prime-5 column is all-zero, drops it, and accepts the square
    // {3,7} matrix [[-2,-1],[-7,4]] with |det| = |-8 - 7| = 15.
    expect(fokkerCardinality(["64/63", "2401/2187"])).toBe(15);
  });

  it("REGRESSION GUARD (fix did NOT over-reach): 81/80 + 225/224 still throws RangeError (rank-2 over 3 live primes)", () => {
    // Dropped-prime-2 rows over (3,5,7) = [[4,-1,0],[2,2,-1]]: primes 5 AND 7 columns
    // are both non-zero → NO droppable column → 2 commas span 3 live primes →
    // genuinely under-determined, NOT a finite block. Must stay rejected.
    expect(() => fokkerCardinality(["81/80", "225/224"])).toThrow(RangeError);
  });

  it("the 5-limit block 81/80 + 128/125 surviving primes are [3, 5] (no prime-7 column)", () => {
    // Pins the shared helper's original-monzo-index contract for the component bridge.
    const { survivingMonzoIndices } = reducedSubspaceMatrix(["81/80", "128/125"]);
    const PRIMES = [2, 3, 5, 7, 11, 13];
    expect(survivingMonzoIndices.map((idx) => PRIMES[idx])).toEqual([3, 5]);
  });

  it("the 2.3.7-subgroup block 64/63 + 2401/2187 surviving primes are [3, 7] (prime-5 dropped)", () => {
    // Pins that the component recovers the [3,7] basis via PRIMES[idx] over the
    // ORIGINAL monzo indices, not post-drop column positions.
    const { reduced, survivingMonzoIndices } = reducedSubspaceMatrix(["64/63", "2401/2187"]);
    const PRIMES = [2, 3, 5, 7, 11, 13];
    expect(survivingMonzoIndices.map((idx) => PRIMES[idx])).toEqual([3, 7]);
    // Reduced square matrix over {3,7}: [[-2,-1],[-7,4]].
    expect(reduced).toEqual([
      [-2n, -1n],
      [-7n, 4n],
    ]);
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
