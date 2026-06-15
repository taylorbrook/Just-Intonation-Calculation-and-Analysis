import { describe, it, expect } from "vitest";
import { enumerateDiamond } from "../diamond.js";
import { Scale } from "../scale.js";
import { Interval } from "../interval.js";

describe("enumerateDiamond", () => {
  it("odd-limit-7 yields 16 cells (4 odd values × 4 odd values)", () => {
    const scale = new Scale([new Interval("9/8"), new Interval("2/1")]);
    const cells = enumerateDiamond(7, scale);
    expect(cells).toHaveLength(16);
  });

  it("flags 5/4 in-scale when seed scale contains it; flags 5/3 out-of-scale", () => {
    const scale = new Scale([
      new Interval("9/8"),
      new Interval("5/4"),
      new Interval("21/16"),
      new Interval("3/2"),
      new Interval("27/16"),
      new Interval("7/4"),
      new Interval("2/1"),
    ]);
    const cells = enumerateDiamond(7, scale);
    const fiveFour = cells.find((c) => c.numerator === 5 && c.denominator === 4);
    expect(fiveFour).toBeDefined();
    expect(fiveFour?.inScale).toBe(true);
    const fiveThree = cells.find((c) => c.numerator === 5 && c.denominator === 3);
    expect(fiveThree?.inScale).toBe(false);
  });

  it("octave-reduces all ratios to [1, 2)", () => {
    const scale = new Scale([new Interval("9/8"), new Interval("2/1")]);
    const cells = enumerateDiamond(7, scale);
    for (const c of cells) {
      const v = Number(c.ratio.fraction.valueOf());
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThan(2);
    }
  });

  it("preserves original (i, j) odd-integer pair on every cell (CR-01 regression)", () => {
    const scale = new Scale([new Interval("9/8"), new Interval("2/1")]);
    const cells = enumerateDiamond(7, scale);
    // Every cell carries i, j (original odd-integer pair), not just reduced n/d.
    for (const c of cells) {
      expect(c.i).toBeDefined();
      expect(c.j).toBeDefined();
      expect(c.i % 2).toBe(1); // i is always odd (from the [1, 3, 5, 7] iterator)
      expect(c.j % 2).toBe(1); // j is always odd
    }
    // Concrete spot-check: (i=3, j=5) → 3/5 octave-reduces to 6/5 (numerator=6,
    // denominator=5). Confirms i is ORIGINAL (3), not the reduced numerator (6).
    const c35 = cells.find((c) => c.i === 3 && c.j === 5);
    expect(c35).toBeDefined();
    expect(c35?.numerator).toBe(6);
    expect(c35?.denominator).toBe(5);
  });

  // 260615-ipz: an even oddLimit is ambiguous — reject it (clearer than silently
  // flooring 8 -> 7, which would mask user error since the odd-limit IS the
  // diamond's defining parameter).
  it("rejects an even oddLimit (8) with a clear error", () => {
    const scale = new Scale([new Interval("9/8"), new Interval("2/1")]);
    expect(() => enumerateDiamond(8, scale)).toThrowError(RangeError);
    expect(() => enumerateDiamond(8, scale)).toThrowError(/odd/i);
  });

  // REGRESSION: odd oddLimit 7 still yields its 16 cells unchanged.
  it("REGRESSION: oddLimit 7 still yields 16 cells", () => {
    const scale = new Scale([new Interval("9/8"), new Interval("2/1")]);
    expect(enumerateDiamond(7, scale)).toHaveLength(16);
  });
});
