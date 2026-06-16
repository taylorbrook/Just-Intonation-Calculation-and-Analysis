import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import { Scale } from "../scale.js";
import { isConstantStructure } from "../constant-structure.js";

/**
 * GEN-10 constant-structure anchors (Plan 08-01, Wave 0 from 08-VALIDATION.md).
 *
 * `isConstantStructure(scale)` returns `{ cs, ambiguousAt? }` by EXACT BigInt
 * interval-class subtension-uniqueness counting (a port of sonic-weave's
 * `tools.js` `hasConstantStructure` onto the kernel `Scale`). A scale is CS iff
 * every distinct interval value subtends a UNIQUE number of scale steps — i.e.
 * you can tell the interval class from the interval's size (D-14 readout source).
 *
 * The decision uses `Interval.equals` (BigInt Fraction equality) — NEVER cents
 * within epsilon (Pitfall #1 / #6). Test 3 proves this: a near-miss scale whose
 * two intervals are ~0.38¢ apart (exactly distinct) reports cs === true, where a
 * cents-epsilon implementation would WRONGLY conflate them and flag non-CS.
 *
 * Anchors verified against the installed sonic-weave@0.14.1 builtin + an exact-
 * rational reference implementation (this session):
 *   - csgs([3/2], 3) Pythagorean diatonic → CS-✓
 *   - {1/1, 9/8, 6/5, 4/3, 3/2, 9/5, 2/1} → CS-✗ (3/2 subtends both 3 and 4 steps)
 *   - {1/1, 568/505, 9/8, 3/2, 2/1} → CS-✓ exact, CS-✗ under a ≥0.5¢ epsilon
 */

/** Build a kernel Scale from exact n/d strings (leading 1/1, period last — D-14). */
function scaleOf(ratios: string[]): Scale {
  const intervals = ratios.map((s) => new Interval(s));
  return new Scale(intervals);
}

describe("isConstantStructure — CS-✓ (GEN-10, D-14)", () => {
  it("returns cs === true for the csgs([3/2],3) Pythagorean diatonic", () => {
    // The csgs([3/2], 3) result + the kernel's auto/explicit leading 1/1 (D-13).
    const scale = scaleOf(["1/1", "9/8", "81/64", "729/512", "3/2", "27/16", "243/128", "2/1"]);
    const result = isConstantStructure(scale);
    expect(result.cs).toBe(true);
    expect(result.ambiguousAt).toBeUndefined();
  });
});

describe("isConstantStructure — CS-✗ with ambiguousAt detail (GEN-10, D-20)", () => {
  it("returns cs === false and identifies the colliding step-counts for a non-CS scale", () => {
    // {1/1, 9/8, 6/5, 4/3, 3/2, 9/5, 2/1}: the interval 3/2 subtends BOTH a 3-step
    // and a 4-step span → not constant structure.
    const scale = scaleOf(["1/1", "9/8", "6/5", "4/3", "3/2", "9/5", "2/1"]);
    const result = isConstantStructure(scale);
    expect(result.cs).toBe(false);
    expect(result.ambiguousAt).toBeDefined();
    // The two colliding interval classes are the 3-step and the 4-step (order-agnostic).
    const { intervalClassA, intervalClassB } = result.ambiguousAt!;
    const pair = [intervalClassA, intervalClassB].sort((a, b) => a - b);
    expect(pair).toEqual([3, 4]);
  });
});

describe("isConstantStructure — EXACT, never cents-epsilon (Pitfall #1 / #6)", () => {
  it("returns cs === true for a near-miss scale (~0.38¢ apart, exactly distinct)", () => {
    // 568/505 ≈ 203.53¢ and 9/8 ≈ 203.91¢ differ by ~0.38¢ but are exactly distinct
    // rationals. An exact-BigInt CS check sees two different intervals (CS-✓); a
    // cents-within-0.5¢ implementation would conflate them and WRONGLY report CS-✗.
    const scale = scaleOf(["1/1", "568/505", "9/8", "3/2", "2/1"]);
    const result = isConstantStructure(scale);
    expect(result.cs).toBe(true);
    expect(result.ambiguousAt).toBeUndefined();
  });
});

describe("isConstantStructure — wrap-around uses scale.period (FIX #11, 260616-bkm)", () => {
  it("uses the authoritative scale.period, NOT the last degree, for wrap-around extension", () => {
    // Scale {1/1, 9/8, 6/5, 15/8} with an EXPLICIT period of 2/1. The last degree
    // (15/8) is NOT the period — so the wrap-around extension differs depending on
    // which is used. Measured against the TRUE period 2/1:
    //   ext = [9/8, 6/5, 15/8, 9/4, 12/5, 15/4]
    //   15/8 subtends 3 steps from the unison AND appears as the 2-step span
    //   (9/4 ÷ 6/5 = 15/8) → the same interval value subtends BOTH 2 and 3 steps,
    //   so the scale is genuinely NOT constant structure.
    // The OLD (last-degree = 15/8) behavior built a different extension and missed
    // this collision, wrongly reporting CS-✓. This test discriminates the fix.
    const scale = new Scale(
      ["1/1", "9/8", "6/5", "15/8"].map((s) => new Interval(s)),
      new Interval("2/1"),
    );
    // Sanity: the last degree is NOT the period (the whole point of the test).
    expect(scale.intervals[scale.intervals.length - 1]!.equals(scale.period)).toBe(false);
    const result = isConstantStructure(scale);
    expect(result.cs).toBe(false);
    expect(result.ambiguousAt).toBeDefined();
    const { intervalClassA, intervalClassB } = result.ambiguousAt!;
    const pair = [intervalClassA, intervalClassB].sort((a, b) => a - b);
    expect(pair).toEqual([2, 3]);
  });

  it("regression: a scale whose last degree DOES equal the explicit period still works", () => {
    // When the last degree already equals scale.period (the conventional case),
    // the fix is a no-op — the Pythagorean diatonic stays CS-✓.
    const scale = scaleOf(["1/1", "9/8", "81/64", "729/512", "3/2", "27/16", "243/128", "2/1"]);
    expect(scale.intervals[scale.intervals.length - 1]!.equals(scale.period)).toBe(true);
    expect(isConstantStructure(scale).cs).toBe(true);
  });
});
