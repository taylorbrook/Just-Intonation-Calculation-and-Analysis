import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import { cps } from "../cps.js";

/**
 * The factor set members are integers expressed as ratios over 1 (`3` = 3/1).
 * cps() multiplies subsets exactly (BigInt), octave-reduces, dedupes by exact
 * n/d (NEVER cents tolerance — Pitfall #1/#6), sorts by cents, and appends the
 * period (D-14).
 */
function factors(...nums: number[]): Interval[] {
  return nums.map((n) => new Interval(`${String(n)}/1`));
}

/**
 * Stringify via n/d directly — fraction.js' Fraction.toFraction() drops "/1"
 * for whole-number ratios (so "2/1" round-trips as "2"), which breaks naive
 * string-equality assertions against the canonical vector (mirrors mos.test.ts).
 */
function ndStrings(scale: ReturnType<typeof cps>): string[] {
  return scale.intervals.map((iv) => `${String(iv.fraction.n)}/${String(iv.fraction.d)}`);
}

describe("cps — Combination Product Set", () => {
  it("cps([1,3,5,7], 2) is the canonical 1-3-5-7 Hexany (research-verified vector)", () => {
    const scale = cps(factors(1, 3, 5, 7), 2);
    // 6 distinct octave-reduced degrees + period 2/1 = 7 entries, sorted by cents.
    const expected = ["1/1", "7/6", "5/4", "35/24", "5/3", "7/4", "2/1"];
    expect(scale.intervals.length).toBe(expected.length);
    expect(ndStrings(scale)).toEqual(expected);
    // BigInt-level equality is the load-bearing assertion (Pitfall #1).
    expected.forEach((s, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(new Interval(s)) : false).toBe(true);
    });
    // Period is the last interval and equals 2/1 (D-14).
    expect(scale.period.equals(new Interval("2/1"))).toBe(true);
    const last = scale.intervals[scale.intervals.length - 1];
    expect(last?.equals(new Interval("2/1"))).toBe(true);
  });

  it("Dekany: cps([1,3,5,7,9], 2) yields 10 distinct degrees + period (11 entries)", () => {
    const scale = cps(factors(1, 3, 5, 7, 9), 2);
    expect(scale.intervals.length).toBe(11);
    const strings = ndStrings(scale);
    expect(new Set(strings).size).toBe(strings.length); // all distinct
  });

  it("Eikosany: cps([1,3,5,7,9,11], 3) yields 20 distinct degrees + period (21 entries)", () => {
    const scale = cps(factors(1, 3, 5, 7, 9, 11), 3);
    expect(scale.intervals.length).toBe(21);
    const strings = ndStrings(scale);
    expect(new Set(strings).size).toBe(strings.length); // all distinct
  });

  it("dedupes coincident products by exact n/d (never cents tolerance)", () => {
    // {1, 2, 3, 6}: the 2-subsets {1,6} and {2,3} both multiply to 6 — a
    // coincident product. Exact dedupe must collapse them to ONE entry.
    const scale = cps(factors(1, 2, 3, 6), 2);
    const strings = ndStrings(scale);
    // No duplicate n/d strings survive.
    expect(new Set(strings).size).toBe(strings.length);
    // C(4,2) = 6 subset products, but {1,6} and {2,3} coincide → at most 5
    // distinct degrees; further octave-reduction may coincide more. The
    // load-bearing assertion is "no duplicates", proven above.
    expect(strings.length).toBeLessThan(6 + 1);
  });

  it("throws RangeError when k < 1", () => {
    expect(() => cps(factors(1, 3, 5, 7), 0)).toThrow(RangeError);
  });

  it("throws RangeError when k > factors.length", () => {
    expect(() => cps(factors(1, 3, 5, 7), 5)).toThrow(RangeError);
  });

  it("throws RangeError when factors.length exceeds the cap (13 > 12)", () => {
    const tooMany = factors(1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25);
    expect(tooMany.length).toBe(13);
    expect(() => cps(tooMany, 2)).toThrow(RangeError);
  });
});
