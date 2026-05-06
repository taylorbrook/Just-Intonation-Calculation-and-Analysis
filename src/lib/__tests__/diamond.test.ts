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
});
