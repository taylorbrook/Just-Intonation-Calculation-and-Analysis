import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import { Scale, jiSubsetOfEdo } from "../scale.js";
import { primeLimit } from "../monzo.js";

describe("Scale", () => {
  describe("construction", () => {
    it("constructs from an Interval[] and exposes intervals + period", () => {
      const s = new Scale([
        new Interval("1/1"),
        new Interval("3/2"),
        new Interval("2/1"),
      ]);
      expect(s.intervals.length).toBe(3);
      expect(s.period.equals(new Interval("2/1"))).toBe(true);
    });

    it("throws when constructed with an empty array", () => {
      expect(() => new Scale([])).toThrowError(/at least one/);
    });

    it("accepts an explicit period override (D-14 default = last)", () => {
      const s = new Scale(
        [new Interval("1/1"), new Interval("2/1")],
        new Interval("3/1"),
      );
      expect(s.period.equals(new Interval("3/1"))).toBe(true);
    });

    it("freezes the intervals array (D-24 immutability)", () => {
      const s = new Scale([new Interval("1/1"), new Interval("2/1")]);
      expect(Object.isFrozen(s.intervals)).toBe(true);
    });
  });

  describe("rotate (SCALE-03)", () => {
    const seed = new Scale([
      new Interval("1/1"),
      new Interval("9/8"),
      new Interval("5/4"),
      new Interval("21/16"),
      new Interval("3/2"),
      new Interval("27/16"),
      new Interval("7/4"),
      new Interval("2/1"),
    ]);

    it("rotate(0) returns an identity Scale (mode 0)", () => {
      const rotated = seed.rotate(0);
      expect(rotated.intervals.length).toBe(seed.intervals.length);
      for (let i = 0; i < seed.intervals.length; i++) {
        const a = rotated.intervals[i];
        const b = seed.intervals[i];
        expect(a && b ? a.equals(b) : false).toBe(true);
      }
    });

    it("rotate(1) produces a mode whose first non-unison interval is 10/9", () => {
      const rotated = seed.rotate(1);
      // intervals[0] is 1/1; intervals[1] is the first non-unison
      const first = rotated.intervals[0];
      const second = rotated.intervals[1];
      expect(first?.equals(new Interval("1/1"))).toBe(true);
      expect(second?.equals(new Interval("10/9"))).toBe(true);
    });

    it("rotate(2) produces a mode whose first non-unison interval is 21/20", () => {
      const rotated = seed.rotate(2);
      const second = rotated.intervals[1];
      expect(second?.equals(new Interval("21/20"))).toBe(true);
    });

    it("rotated Scale always starts with 1/1", () => {
      for (const n of [0, 1, 2, 3, 4, 5, 6, 7]) {
        const r = seed.rotate(n);
        expect(r.intervals[0]?.equals(new Interval("1/1"))).toBe(true);
      }
    });

    it("preserves the period across rotations", () => {
      for (const n of [0, 1, 2, 3, 4, 5, 6, 7]) {
        expect(seed.rotate(n).period.equals(seed.period)).toBe(true);
      }
    });

    it("returns a NEW Scale instance (D-24)", () => {
      expect(seed.rotate(1)).not.toBe(seed);
      expect(seed.rotate(0)).not.toBe(seed);
    });

    it("throws RangeError when degree is out of range", () => {
      expect(() => seed.rotate(99)).toThrowError(RangeError);
    });
  });

  describe("reduce (SCALE-02 — period-aware per Pitfall #13)", () => {
    it("reduces, sorts ascending, and dedupes for a 2/1 scale", () => {
      const s = new Scale([
        new Interval("9/8"),
        new Interval("5/4"),
        new Interval("9/8"),
        new Interval("2/1"),
      ]);
      const r = s.reduce();
      // Expect [9/8, 5/4, 2/1] in ascending order
      expect(r.intervals.length).toBe(3);
      expect(r.intervals[0]?.equals(new Interval("9/8"))).toBe(true);
      expect(r.intervals[1]?.equals(new Interval("5/4"))).toBe(true);
      expect(r.intervals[2]?.equals(new Interval("2/1"))).toBe(true);
    });

    it("is period-aware — reduces 9/1 by tritave 3/1 to 1/1 (Pitfall #13)", () => {
      const s = new Scale(
        [new Interval("9/1"), new Interval("3/1")],
        new Interval("3/1"),
      );
      const r = s.reduce();
      // 9/1 reduced into [1, 3) is 1/1 (since 9 = 3^2). With dedupe + period-pinning: [1/1, 3/1]
      expect(r.intervals.length).toBe(2);
      expect(r.intervals[0]?.equals(new Interval("1/1"))).toBe(true);
      expect(r.intervals[1]?.equals(new Interval("3/1"))).toBe(true);
    });

    it("returns a NEW Scale instance (D-24)", () => {
      const s = new Scale([new Interval("1/1"), new Interval("2/1")]);
      expect(s.reduce()).not.toBe(s);
    });
  });

  describe("dedupe", () => {
    it("removes exact rational duplicates, preserving first occurrence", () => {
      const s = new Scale([
        new Interval("3/2"),
        new Interval("3/2"),
        new Interval("2/1"),
      ]);
      const d = s.dedupe();
      expect(d.intervals.length).toBe(2);
      expect(d.intervals[0]?.equals(new Interval("3/2"))).toBe(true);
      expect(d.intervals[1]?.equals(new Interval("2/1"))).toBe(true);
    });

    it("uses Interval.equals (BigInt Fraction equality) — NOT cents-within-epsilon", () => {
      // 81/80 (syntonic comma, ~21.5¢) and 32805/32768 (schisma, ~1.95¢) are
      // very different rationals — dedupe must keep both even though they are commas.
      const s = new Scale([
        new Interval("81/80"),
        new Interval("32805/32768"),
        new Interval("2/1"),
      ]);
      const d = s.dedupe();
      expect(d.intervals.length).toBe(3);
    });
  });

  describe("transpose (SCALE-04)", () => {
    it("multiplies every interval AND the period by the given Interval", () => {
      const s = new Scale([
        new Interval("1/1"),
        new Interval("3/2"),
        new Interval("2/1"),
      ]);
      const t = s.transpose(new Interval("3/2"));
      expect(t.intervals[0]?.equals(new Interval("3/2"))).toBe(true);
      expect(t.intervals[1]?.equals(new Interval("9/4"))).toBe(true);
      expect(t.intervals[2]?.equals(new Interval("3/1"))).toBe(true);
      expect(t.period.equals(new Interval("3/1"))).toBe(true);
    });
  });

  describe("degreeToFreq", () => {
    const seed = new Scale([
      new Interval("1/1"),
      new Interval("9/8"),
      new Interval("5/4"),
      new Interval("21/16"),
      new Interval("3/2"),
      new Interval("27/16"),
      new Interval("7/4"),
      new Interval("2/1"),
    ]);

    it("returns baseHz at degree 0 (unison)", () => {
      expect(seed.degreeToFreq(0, 440)).toBe(440);
    });

    it("returns baseHz × 3/2 at degree 4 (~660Hz)", () => {
      expect(seed.degreeToFreq(4, 440)).toBeCloseTo(660, 2);
    });

    it("throws RangeError on out-of-range degree", () => {
      expect(() => seed.degreeToFreq(99, 440)).toThrowError(RangeError);
    });
  });
});

describe("jiSubsetOfEdo (SCALE-05)", () => {
  it("returns a Scale with edoSteps + 1 intervals (period appended) for 12 EDO 5-limit", () => {
    const s = jiSubsetOfEdo(12, 5);
    expect(s.intervals.length).toBe(13); // 12 EDO steps + 2/1 period
  });

  it("returns 31 + 1 intervals for 31 EDO 7-limit", () => {
    const s = jiSubsetOfEdo(31, 7);
    expect(s.intervals.length).toBe(32);
  });

  it("first interval is 1/1, last is 2/1", () => {
    const s = jiSubsetOfEdo(12, 5);
    expect(s.intervals[0]?.equals(new Interval("1/1"))).toBe(true);
    expect(s.intervals[s.intervals.length - 1]?.equals(new Interval("2/1"))).toBe(true);
  });

  it("each interval's prime-limit is ≤ the requested limit", () => {
    const s = jiSubsetOfEdo(12, 5);
    for (const iv of s.intervals) {
      // Skip unison — primeLimit(1) returns 1 trivially; we mainly care about the
      // non-unison intervals having no factor above 5 in either numerator or denominator.
      if (iv.equals(new Interval("1/1"))) continue;
      // xen-dev-utils' primeLimit accepts bigint; we feed it the BigInt n and d
      // separately and take the max. (The polymorphic Fraction-input path uses
      // xen-dev-utils' Number-backed Fraction, which we do NOT depend on per R-01.)
      const numLim = primeLimit(iv.fraction.n);
      const denLim = primeLimit(iv.fraction.d);
      const limit = Math.max(numLim, denLim);
      expect(limit).toBeLessThanOrEqual(5);
    }
  });

  it("throws RangeError when edoSteps is 0", () => {
    expect(() => jiSubsetOfEdo(0, 5)).toThrowError(RangeError);
  });
});
