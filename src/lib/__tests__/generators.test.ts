import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import { oddLimit, primeLimitOfMonzo } from "../monzo.js";
import {
  diamondScale,
  oddLimitSet,
  primeLimitSet,
  fareyScale,
  edScale,
} from "../generators.js";
import type { Scale } from "../scale.js";

/**
 * Stringify via n/d directly — fraction.js' Fraction.toFraction() drops "/1"
 * for whole-number ratios (so "2/1" round-trips as "2"), which breaks naive
 * string-equality assertions against the canonical vector (mirrors cps.test.ts,
 * harmonic.test.ts, mos.test.ts).
 */
function ndStrings(scale: Scale): string[] {
  return scale.intervals.map((iv) => `${String(iv.fraction.n)}/${String(iv.fraction.d)}`);
}

/**
 * No exact n/d appears twice — the load-bearing exact-rational integrity
 * invariant (Pitfall #1/#6, T-06-07): dedupe is by exact fraction, never cents.
 */
function expectNoDuplicates(scale: Scale): void {
  const strings = ndStrings(scale);
  expect(new Set(strings).size).toBe(strings.length);
}

/**
 * BigInt-exact set assertion — the n/d strings match exactly, in order, and each
 * Interval is BigInt-equal to its parsed counterpart (Pitfall #1). Used for the
 * FINITE exact-JI families (diamond / odd-limit / Farey).
 */
function expectExact(scale: Scale, expected: string[]): void {
  expect(scale.intervals.length).toBe(expected.length);
  expect(ndStrings(scale)).toEqual(expected);
  expected.forEach((s, i) => {
    const iv = scale.intervals[i];
    expect(iv ? iv.equals(new Interval(s)) : false).toBe(true);
  });
}

describe("diamondScale — 7-limit tonality diamond (GEN-04)", () => {
  it("diamondScale(7) yields the unique octave-reduced 7-limit diamond ratios + 2/1", () => {
    const scale = diamondScale(7);
    // The unique octave-reduced cell ratios of the 7-limit diamond (reuses
    // enumerateDiamond from diamond.ts — NOT re-derived), sorted by cents, with
    // the 2/1 period appended (D-07: JI families fix the equave at the octave).
    expectExact(scale, [
      "1/1",
      "8/7",
      "7/6",
      "6/5",
      "5/4",
      "4/3",
      "7/5",
      "10/7",
      "3/2",
      "8/5",
      "5/3",
      "12/7",
      "7/4",
      "2/1",
    ]);
    // No duplicate n/d survives the Set-dedupe (Pitfall #1/#6).
    expectNoDuplicates(scale);
    // Ends with the 2/1 period (D-07/D-14).
    const last = scale.intervals[scale.intervals.length - 1];
    expect(last?.equals(new Interval("2/1"))).toBe(true);
    expect(scale.period.equals(new Interval("2/1"))).toBe(true);
  });
});

describe("oddLimitSet — odd-limit set in [1, 2) (GEN-04)", () => {
  it("oddLimitSet(9) is every reduced i/j in [1,2) with oddLimit ≤ 9, exact + deduped", () => {
    const scale = oddLimitSet(9);
    // Verified vector: all reduced ratios in [1,2) whose octave-reduced monzo has
    // oddLimit ≤ 9, sorted by cents, + 2/1 period.
    expectExact(scale, [
      "1/1",
      "10/9",
      "9/8",
      "8/7",
      "7/6",
      "6/5",
      "5/4",
      "9/7",
      "4/3",
      "7/5",
      "10/7",
      "3/2",
      "14/9",
      "8/5",
      "5/3",
      "12/7",
      "7/4",
      "16/9",
      "9/5",
      "2/1",
    ]);
    expectNoDuplicates(scale);
    // Every non-period member respects the odd-limit ceiling (the defining predicate).
    scale.intervals
      .filter((iv) => !iv.equals(new Interval("2/1")))
      .forEach((iv) => {
        expect(oddLimit(iv.monzo)).toBeLessThanOrEqual(9);
      });
  });

  it("oddLimitSet(5) is the small odd-limit-5 set", () => {
    const scale = oddLimitSet(5);
    expectExact(scale, ["1/1", "6/5", "5/4", "4/3", "3/2", "8/5", "5/3", "2/1"]);
    expectNoDuplicates(scale);
  });
});

describe("primeLimitSet — prime-limit set in [1, 2) (GEN-04)", () => {
  it("primeLimitSet(5) respects primeLimitOfMonzo ≤ 5 for every member, deduped", () => {
    const scale = primeLimitSet(5);
    // The prime-limit-5 set is INFINITE in principle; the builder enumerates a
    // bounded integer grid. Assert the defining predicate holds for every member
    // and that a few canonical 5-limit ratios are present — NOT a full-set vector.
    expectNoDuplicates(scale);
    scale.intervals
      .filter((iv) => !iv.equals(new Interval("2/1")))
      .forEach((iv) => {
        expect(primeLimitOfMonzo(iv.monzo)).toBeLessThanOrEqual(5);
      });
    const members = new Set(ndStrings(scale));
    // Canonical 5-limit members must be present.
    ["1/1", "9/8", "6/5", "5/4", "4/3", "3/2", "8/5", "5/3", "15/8"].forEach((s) => {
      expect(members.has(s)).toBe(true);
    });
    // A 7-limit ratio (7/4) must NOT appear — its prime limit is 7 > 5.
    expect(members.has("7/4")).toBe(false);
    // Sorted ascending by cents, starts at 1/1, ends at the 2/1 period.
    expect(scale.intervals[0]?.equals(new Interval("1/1"))).toBe(true);
    const last = scale.intervals[scale.intervals.length - 1];
    expect(last?.equals(new Interval("2/1"))).toBe(true);
  });

  it("primeLimitSet(3) is the Pythagorean (prime-limit-3) subset", () => {
    const scale = primeLimitSet(3);
    expectNoDuplicates(scale);
    scale.intervals
      .filter((iv) => !iv.equals(new Interval("2/1")))
      .forEach((iv) => {
        expect(primeLimitOfMonzo(iv.monzo)).toBeLessThanOrEqual(3);
      });
    const members = new Set(ndStrings(scale));
    // Pythagorean staples (only primes 2 and 3).
    ["1/1", "9/8", "4/3", "3/2", "27/16", "16/9"].forEach((s) => {
      expect(members.has(s)).toBe(true);
    });
    // 5/4 is a 5-limit ratio — must NOT appear at prime-limit 3.
    expect(members.has("5/4")).toBe(false);
  });
});

describe("fareyScale — Farey sequence in [1, 2) (GEN-04)", () => {
  it("fareyScale(8) is the Farey order-8 fractions in [1,2), exact", () => {
    const scale = fareyScale(8);
    // All reduced a/b with 1 ≤ b ≤ 8 and value in [1, 2), sorted, + 2/1 period.
    expectExact(scale, [
      "1/1",
      "9/8",
      "8/7",
      "7/6",
      "6/5",
      "5/4",
      "9/7",
      "4/3",
      "11/8",
      "7/5",
      "10/7",
      "3/2",
      "11/7",
      "8/5",
      "13/8",
      "5/3",
      "12/7",
      "7/4",
      "9/5",
      "11/6",
      "13/7",
      "15/8",
      "2/1",
    ]);
    expectNoDuplicates(scale);
    // Every member is reduced with denominator ≤ 8.
    scale.intervals
      .filter((iv) => !iv.equals(new Interval("2/1")))
      .forEach((iv) => {
        expect(Number(iv.fraction.d)).toBeLessThanOrEqual(8);
      });
  });

  it("fareyScale(5) is the smaller Farey order-5 set", () => {
    const scale = fareyScale(5);
    expectExact(scale, [
      "1/1",
      "6/5",
      "5/4",
      "4/3",
      "7/5",
      "3/2",
      "8/5",
      "5/3",
      "7/4",
      "9/5",
      "2/1",
    ]);
    expectNoDuplicates(scale);
  });
});

describe("edScale — TEMPERED equal division (GEN-05 / SURF-06)", () => {
  it("edScale(12, 2/1) is a TEMPERED 12-EDO — assert CENTS, never ratios (Pitfall #1)", () => {
    const scale = edScale(12, new Interval("2/1"));
    // 12 steps + the equave period = 13 pitches.
    expect(scale.intervals.length).toBe(13);
    // TEMPERED: cents is the source of truth. Each pitch is built FROM CENTS via
    // centsToRatio — the fraction is a LOSSY projection with no exact JI meaning.
    // We assert the CENTS array (k*100 ± float epsilon). Asserting the ratios of
    // a tempered scale as if they were exact JI is FORBIDDEN (Pitfall #1 / SURF-06):
    // there is no exact ratio of record for a tempered pitch.
    const cents = scale.intervals.map((iv) => iv.cents);
    cents.forEach((c, k) => {
      expect(c).toBeCloseTo(k * 100, 5);
    });
    // The period is the equave (2/1) — the last entry sits at exactly 1200¢.
    expect(scale.period.cents).toBeCloseTo(1200, 5);
  });

  it("edScale(13, 3/1) is the Bohlen-Pierce ED3 tritave division — cents only", () => {
    const scale = edScale(13, new Interval("3/1"));
    // 13 steps + the tritave period = 14 pitches.
    expect(scale.intervals.length).toBe(14);
    // Step cents = k * (1200*log2(3)/13). Assert CENTS, never ratios (Pitfall #1).
    const equaveCents = 1200 * Math.log2(3);
    const step = equaveCents / 13;
    scale.intervals.forEach((iv, k) => {
      expect(iv.cents).toBeCloseTo(k * step, 4);
    });
    // The period sits at exactly the tritave's cents.
    expect(scale.period.cents).toBeCloseTo(equaveCents, 4);
  });
});

describe("defense-in-depth caps (D-14) — RangeError outside bounds (T-06-05)", () => {
  it("oddLimitSet throws on limit > 31 and on limit < 1", () => {
    expect(() => oddLimitSet(33)).toThrow(RangeError);
    expect(() => oddLimitSet(0)).toThrow(RangeError);
  });
  it("primeLimitSet throws on limit > 31 and on limit < 1", () => {
    expect(() => primeLimitSet(33)).toThrow(RangeError);
    expect(() => primeLimitSet(0)).toThrow(RangeError);
  });
  it("fareyScale throws on order > 1000 and on order < 1", () => {
    expect(() => fareyScale(2000)).toThrow(RangeError);
    expect(() => fareyScale(0)).toThrow(RangeError);
  });
  it("edScale throws on divisions > 1000 and on divisions < 1", () => {
    expect(() => edScale(2000, new Interval("2/1"))).toThrow(RangeError);
    expect(() => edScale(0, new Interval("2/1"))).toThrow(RangeError);
  });
  it("edScale throws when the equave is <= 1/1", () => {
    expect(() => edScale(12, new Interval("1/1"))).toThrow(RangeError);
  });
  it("diamondScale propagates enumerateDiamond's oddLimit cap (> 1023)", () => {
    expect(() => diamondScale(2000)).toThrow(RangeError);
  });
});
