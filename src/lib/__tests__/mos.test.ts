import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import { buildMos, nearestMosSize } from "../mos.js";

describe("buildMos", () => {
  it("size=7, gen=3/2, period=2/1 -> Pythagorean diatonic (centered chain, BigInt-equal)", () => {
    const scale = buildMos(new Interval("3/2"), new Interval("2/1"), 7);
    const expectedDiatonic = ["1/1", "9/8", "81/64", "4/3", "3/2", "27/16", "243/128", "2/1"];
    expect(scale.intervals.length).toBe(expectedDiatonic.length);
    // Stringify via n/d directly — fraction.js' Fraction.toFraction() drops "/1"
    // for whole-number ratios (so "2/1" round-trips as "2"), which breaks naive
    // string-equality assertions. The BigInt-level Interval.equals check below
    // is the load-bearing assertion (Pitfall #1: NEVER cents-tolerance).
    expect(
      scale.intervals.map((iv) => `${String(iv.fraction.n)}/${String(iv.fraction.d)}`),
    ).toEqual(expectedDiatonic);
    // BigInt-level equality (Pitfall #1: NEVER cents-tolerance)
    expectedDiatonic.forEach((s, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(new Interval(s)) : false).toBe(true);
    });
  });

  it("size=12, gen=3/2, period=2/1 -> Pythagorean chromatic (13 ratios incl. period)", () => {
    const scale = buildMos(new Interval("3/2"), new Interval("2/1"), 12);
    const expectedChromatic = [
      "1/1",
      "256/243",
      "9/8",
      "32/27",
      "81/64",
      "4/3",
      "729/512",
      "3/2",
      "128/81",
      "27/16",
      "16/9",
      "243/128",
      "2/1",
    ];
    expect(scale.intervals.length).toBe(13);
    expectedChromatic.forEach((s, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(new Interval(s)) : false).toBe(true);
    });
  });

  it("generator equals period (3/1, 3/1) -> single-pitch scale (just the period)", () => {
    const s = buildMos(new Interval("3/1"), new Interval("3/1"), 9);
    expect(s.intervals.length).toBe(1);
    expect(s.intervals[0]?.equals(new Interval("3/1"))).toBe(true);
    expect(s.period.equals(new Interval("3/1"))).toBe(true);
  });

  it("period === 1/1 throws RangeError with the expected message", () => {
    expect(() => buildMos(new Interval("3/2"), new Interval("1/1"), 7)).toThrow(
      /MOS period must be > 1\/1/,
    );
    expect(() => buildMos(new Interval("3/2"), new Interval("1/1"), 7)).toThrow(RangeError);
  });

  it("size < 1 throws RangeError", () => {
    expect(() => buildMos(new Interval("3/2"), new Interval("2/1"), 0)).toThrow(
      /MOS size must be >= 1/,
    );
    expect(() => buildMos(new Interval("3/2"), new Interval("2/1"), 0)).toThrow(RangeError);
  });

  it("size=7 result is sorted ascending by cents (consumer table-display contract)", () => {
    const s = buildMos(new Interval("3/2"), new Interval("2/1"), 7);
    for (let i = 1; i < s.intervals.length; i++) {
      const a = s.intervals[i - 1];
      const b = s.intervals[i];
      expect(a && b ? b.cents > a.cents : false).toBe(true);
    }
  });

  it("result always ends with the period (D-14 contract)", () => {
    const s = buildMos(new Interval("3/2"), new Interval("2/1"), 7);
    const last = s.intervals[s.intervals.length - 1];
    expect(last ? last.equals(new Interval("2/1")) : false).toBe(true);
  });

  // 260615-ipz: a generator that OCTAVE-REDUCES to 1/1 under the period is just as
  // degenerate as generator === period. The old equals(period) test MISSES gen=4/1
  // under period 2/1 (4/1 reduces to 1/1). Both must hit the single-pitch path.
  it("generator that equals the period (2/1, 2/1) -> single-pitch scale (just the period)", () => {
    const s = buildMos(new Interval("2/1"), new Interval("2/1"), 7);
    expect(s.intervals.length).toBe(1);
    expect(s.intervals[0]?.equals(new Interval("2/1"))).toBe(true);
    expect(s.period.equals(new Interval("2/1"))).toBe(true);
  });

  it("generator that octave-reduces to 1/1 (4/1 under 2/1) -> single-pitch scale (the equals-miss case)", () => {
    const s = buildMos(new Interval("4/1"), new Interval("2/1"), 7);
    expect(s.intervals.length).toBe(1);
    expect(s.intervals[0]?.equals(new Interval("2/1"))).toBe(true);
    expect(s.period.equals(new Interval("2/1"))).toBe(true);
  });

  // REGRESSION: the ordinary Pythagorean Ionian (3/2 under 2/1) is unchanged.
  it("REGRESSION: gen=3/2, period=2/1, size=7 still builds the 8-entry Pythagorean Ionian", () => {
    const s = buildMos(new Interval("3/2"), new Interval("2/1"), 7);
    expect(s.intervals.length).toBe(8);
    expect(s.intervals[0]?.equals(new Interval("1/1"))).toBe(true);
    expect(s.intervals[7]?.equals(new Interval("2/1"))).toBe(true);
  });
});

describe("nearestMosSize", () => {
  it("target=7 -> 7 (exact semi-convergent)", () => {
    expect(nearestMosSize(new Interval("3/2"), new Interval("2/1"), 7)).toBe(7);
  });

  it("target=6 -> 5 or 7 (equidistant — accept either; deterministic tie-break)", () => {
    const s = nearestMosSize(new Interval("3/2"), new Interval("2/1"), 6);
    expect([5, 7]).toContain(s);
  });

  it("target=25 -> 29 (semi-convergent search; convergents-only would wrongly emit 12)", () => {
    expect(nearestMosSize(new Interval("3/2"), new Interval("2/1"), 25)).toBe(29);
  });

  it("canonical Pythagorean MOS sequence [2, 3, 5, 7, 12, 17, 29, 41, 53] is fully emitted", () => {
    const canonicalSizes = [2, 3, 5, 7, 12, 17, 29, 41, 53];
    for (const target of canonicalSizes) {
      expect(nearestMosSize(new Interval("3/2"), new Interval("2/1"), target)).toBe(target);
    }
  });
});
