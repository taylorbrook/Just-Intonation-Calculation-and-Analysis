import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import {
  harmonicSegment,
  subharmonicSegment,
  adoScale,
  isoharmonic,
} from "../harmonic.js";
import type { Scale } from "../scale.js";

/**
 * Stringify via n/d directly — fraction.js' Fraction.toFraction() drops "/1"
 * for whole-number ratios (so "2/1" round-trips as "2"), which breaks naive
 * string-equality assertions against the canonical vector (mirrors cps.test.ts
 * and mos.test.ts).
 */
function ndStrings(scale: Scale): string[] {
  return scale.intervals.map((iv) => `${String(iv.fraction.n)}/${String(iv.fraction.d)}`);
}

/** BigInt-level equality is the load-bearing assertion (Pitfall #1). */
function expectExact(scale: Scale, expected: string[]): void {
  expect(scale.intervals.length).toBe(expected.length);
  expect(ndStrings(scale)).toEqual(expected);
  expected.forEach((s, i) => {
    const iv = scale.intervals[i];
    expect(iv ? iv.equals(new Interval(s)) : false).toBe(true);
  });
}

describe("harmonicSegment — literal overtone form (D-04)", () => {
  it("harmonicSegment(8, 16) yields exact h/8 ratios for h in 8..16", () => {
    const scale = harmonicSegment(8, 16);
    // 16/8 → 2/1, 10/8 → 5/4, 12/8 → 3/2, 14/8 → 7/4. Unreduced by default.
    expectExact(scale, [
      "1/1",
      "9/8",
      "5/4",
      "11/8",
      "3/2",
      "13/8",
      "7/4",
      "15/8",
      "2/1",
    ]);
    // The literal segment's top (16/8 = 2/1) is the period (D-14).
    const last = scale.intervals[scale.intervals.length - 1];
    expect(last?.equals(new Interval("2/1"))).toBe(true);
    expect(scale.period.equals(new Interval("2/1"))).toBe(true);
  });

  it("default is the literal overtone form (reduce defaults to false)", () => {
    // 8..24 literally spans more than an octave; unreduced degrees exceed 1200¢.
    const scale = harmonicSegment(8, 24);
    const top = scale.intervals[scale.intervals.length - 1];
    // 24/8 = 3/1 ≈ 1902¢ — proves it was NOT folded into [1, 2).
    expect(top?.equals(new Interval("3/1"))).toBe(true);
  });
});

describe("subharmonicSegment — utonal mirror (reciprocal mode)", () => {
  it("subharmonicSegment(8, 16) yields the exact reciprocal-mode ratios", () => {
    const scale = subharmonicSegment(8, 16);
    // Ascending subharmonic segment: hi/h for h = hi..lo (16/16 … 16/8).
    expectExact(scale, [
      "1/1",
      "16/15",
      "8/7",
      "16/13",
      "4/3",
      "16/11",
      "8/5",
      "16/9",
      "2/1",
    ]);
    const last = scale.intervals[scale.intervals.length - 1];
    expect(last?.equals(new Interval("2/1"))).toBe(true);
  });
});

describe("adoScale — arithmetic division of the octave (AFDO)", () => {
  it("adoScale(6, 2/1) matches the verified AFDO-6 vector", () => {
    const scale = adoScale(6, new Interval("2/1"));
    // 6 equal arithmetic steps between fundamental and 2×, expressed as (6+k)/6.
    expectExact(scale, ["1/1", "7/6", "4/3", "3/2", "5/3", "11/6", "2/1"]);
    expect(scale.intervals[0]?.equals(new Interval("1/1"))).toBe(true);
    const last = scale.intervals[scale.intervals.length - 1];
    expect(last?.equals(new Interval("2/1"))).toBe(true);
    expect(scale.period.equals(new Interval("2/1"))).toBe(true);
  });

  it("adoScale is intrinsically within one equave (3/1 equave example)", () => {
    // ADO over a tritave: (3+k)/3 for k in 0..3 → 1/1, 4/3, 5/3, 2/1 (equave = 2/1? no — equave 3/1).
    const scale = adoScale(3, new Interval("3/1"));
    // divisions=3 over equave 3/1: degrees (3+k)/3 → 3/3, 4/3, 5/3, 6/3=2/1 … last = equave.
    const last = scale.intervals[scale.intervals.length - 1];
    expect(last?.equals(new Interval("3/1"))).toBe(true);
  });
});

describe("isoharmonic — integer-frequency arithmetic chord", () => {
  it("isoharmonic(4, 1, 4) is the exact 4:5:6:7 chord over the lowest member", () => {
    const scale = isoharmonic(4, 1, 4);
    // members 4,5,6,7 — each over start (4): 4/4, 5/4, 6/4→3/2, 7/4.
    expectExact(scale, ["1/1", "5/4", "3/2", "7/4"]);
  });

  it("isoharmonic respects start/diff/count (3:5:7:9 over 3)", () => {
    const scale = isoharmonic(3, 2, 4);
    // members 3,5,7,9 — over start (3): 3/3, 5/3, 7/3, 9/3→3/1.
    expectExact(scale, ["1/1", "5/3", "7/3", "3/1"]);
  });
});

describe("reduce-to-octave toggle (D-04)", () => {
  it("harmonicSegment(8, 24, true) folds every degree into [1, 2)", () => {
    const scale = harmonicSegment(8, 24, true);
    // Every degree's cents in [0, 1200) EXCEPT the period (the last interval = 2/1).
    scale.intervals.slice(0, -1).forEach((iv) => {
      expect(iv.cents).toBeGreaterThanOrEqual(0);
      expect(iv.cents).toBeLessThan(1200);
    });
    // Octave-equivalents (e.g. 16/8 = 2/1 folds to 1/1, 24/8 = 3/1 folds to 3/2)
    // collapse via exact n/d dedupe — no duplicate degrees survive.
    const strings = ndStrings(scale);
    expect(new Set(strings).size).toBe(strings.length);
    // The result still ends with the period (2/1) per D-14.
    const last = scale.intervals[scale.intervals.length - 1];
    expect(last?.equals(new Interval("2/1"))).toBe(true);
  });

  it("isoharmonic(4, 1, 4, true) folds the 4:5:6:7 chord into [1, 2)", () => {
    const scale = isoharmonic(4, 1, 4, true);
    scale.intervals.slice(0, -1).forEach((iv) => {
      expect(iv.cents).toBeGreaterThanOrEqual(0);
      expect(iv.cents).toBeLessThan(1200);
    });
  });
});

describe("defense-in-depth caps (D-14) — RangeError outside bounds", () => {
  it("harmonicSegment throws on lo < 1", () => {
    expect(() => harmonicSegment(0, 16)).toThrow(RangeError);
  });
  it("harmonicSegment throws on hi <= lo", () => {
    expect(() => harmonicSegment(8, 8)).toThrow(RangeError);
  });
  it("harmonicSegment throws on hi > MAX_HARMONIC (1024)", () => {
    expect(() => harmonicSegment(8, 2000)).toThrow(RangeError);
  });
  it("subharmonicSegment throws on out-of-range bounds", () => {
    expect(() => subharmonicSegment(0, 16)).toThrow(RangeError);
    expect(() => subharmonicSegment(8, 2000)).toThrow(RangeError);
  });
  it("adoScale throws on divisions < 1", () => {
    expect(() => adoScale(0, new Interval("2/1"))).toThrow(RangeError);
  });
  it("adoScale throws on oversized divisions (> MAX_DIVISIONS)", () => {
    expect(() => adoScale(2000, new Interval("2/1"))).toThrow(RangeError);
  });
  it("isoharmonic throws on count above the cap", () => {
    expect(() => isoharmonic(4, 1, 2000)).toThrow(RangeError);
  });
  it("isoharmonic throws on start < 1 or diff < 1", () => {
    expect(() => isoharmonic(0, 1, 4)).toThrow(RangeError);
    expect(() => isoharmonic(4, 0, 4)).toThrow(RangeError);
  });
});
