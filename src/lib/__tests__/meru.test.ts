import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import { meruScale, metallicLimitCents, MAX_MERU_TERMS } from "../meru.js";

/**
 * GEN-10 Wilson recurrence anchors (Plan 08-01, Wave 0 from 08-VALIDATION.md).
 *
 * The convergents of the Wilson/metallic recurrence `x_n = a·x_{n-1} + b·x_{n-2}`
 * are EXACT BigInt successive-ratio Intervals — asserted via `iv.equals(...)`
 * (BigInt Fraction equality), NEVER via a cents-within-epsilon comparison
 * (Pitfall #1). The metallic mean limit is an irrational cents readout
 * (`metallicLimitCents`) that NEVER appears as a scale degree (D-09 / SURF-06 /
 * Pitfall #4).
 *
 * Verified numerical anchors (08-RESEARCH "Wilson / metallic numerical verification"):
 *   Fibonacci (a=1,b=1, seeds 1,1) successive ratios: 2/1, 3/2, 5/3, 8/5, 13/8, …
 *   golden  (1,1): 1.618034 → 833.09¢
 *   silver  (2,1): 2.414214 → 1525.86¢  (> 1 octave)
 *   bronze  (3,1): 3.302776 → 2068.41¢  (> 1 octave)
 */

describe("meruScale — Wilson recurrence exact convergents (GEN-10)", () => {
  it("meruScale(1,1,1,1,7) yields the exact Fibonacci convergents incl. 3/2, 5/3, 8/5, 13/8", () => {
    const scale = meruScale(1n, 1n, 1n, 1n, 7);
    // seq = [1, 1, 2, 3, 5, 8, 13, 21]; successive ratios x_i/x_{i-1}:
    //   1/1, 2/1, 3/2, 5/3, 8/5, 13/8, 21/13.
    // The verified anchors (D-12) — assert via BigInt iv.equals, NEVER cents tolerance.
    const expected = ["1/1", "2/1", "3/2", "5/3", "8/5", "13/8", "21/13"];
    expect(scale.intervals.length).toBe(expected.length);
    expected.forEach((s, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(new Interval(s)) : false).toBe(true);
    });
    // Specifically the named convergents are present, in order (the GEN-10 anchor).
    expect(scale.intervals.some((iv) => iv.equals(new Interval("3/2")))).toBe(true);
    expect(scale.intervals.some((iv) => iv.equals(new Interval("5/3")))).toBe(true);
    expect(scale.intervals.some((iv) => iv.equals(new Interval("8/5")))).toBe(true);
    expect(scale.intervals.some((iv) => iv.equals(new Interval("13/8")))).toBe(true);
  });

  it("every convergent is exact rational — round-trips through n/d", () => {
    const scale = meruScale(1n, 1n, 1n, 1n, 7);
    for (const iv of scale.intervals) {
      const nd = `${String(iv.fraction.n)}/${String(iv.fraction.d)}`;
      // The literal n/d string reconstructs the SAME exact Interval (no float laundering).
      expect(iv.equals(new Interval(nd))).toBe(true);
    }
  });

  it("the Scale has a valid period > 1/1 (CR-01 / scale.ts constructor rule)", () => {
    const scale = meruScale(1n, 1n, 1n, 1n, 7);
    expect(scale.period.fraction.compare(new Interval("1/1").fraction) > 0).toBe(true);
  });

  it("accepts non-golden seeds (silver coefficients) and stays BigInt-exact", () => {
    // a=2, b=1, seeds 1,1: seq = [1, 1, 3, 7, 17, 41]; ratios 1/1, 3/1, 7/3, 17/7, 41/17.
    const scale = meruScale(2n, 1n, 1n, 1n, 5);
    const expected = ["1/1", "3/1", "7/3", "17/7", "41/17"];
    expect(scale.intervals.length).toBe(expected.length);
    expected.forEach((s, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(new Interval(s)) : false).toBe(true);
    });
  });
});

describe("metallicLimitCents — irrational metallic-mean readout (GEN-10, D-09)", () => {
  it("metallicLimitCents(1,1) ≈ 833.09¢ (golden φ)", () => {
    expect(metallicLimitCents(1, 1)).toBeCloseTo(833.09, 1);
  });

  it("metallicLimitCents(2,1) ≈ 1525.86¢ (silver — > 1 octave, D-19)", () => {
    expect(metallicLimitCents(2, 1)).toBeCloseTo(1525.86, 1);
  });

  it("metallicLimitCents(3,1) ≈ 2068.41¢ (bronze — > 1 octave, D-19)", () => {
    expect(metallicLimitCents(3, 1)).toBeCloseTo(2068.41, 1);
  });
});

describe("meruScale — defense-in-depth caps (Pitfall 5 / D-11)", () => {
  it("rejects terms > MAX_MERU_TERMS with RangeError BEFORE enumeration", () => {
    expect(() => meruScale(1n, 1n, 1n, 1n, MAX_MERU_TERMS + 1)).toThrow(RangeError);
  });

  it("rejects terms < 1 with RangeError", () => {
    expect(() => meruScale(1n, 1n, 1n, 1n, 0)).toThrow(RangeError);
  });

  it("rejects non-integer terms with RangeError", () => {
    expect(() => meruScale(1n, 1n, 1n, 1n, 3.5)).toThrow(RangeError);
  });

  it("rejects runaway magnitude DURING the recurrence with RangeError (not silent truncation)", () => {
    // Huge seeds whose recurrence immediately exceeds MAX_MERU_MAGNITUDE — the cap
    // must fire DURING the loop, not silently truncate or return a partial scale.
    const huge = 10n ** 60n;
    expect(() => meruScale(1n, 1n, huge, huge, 6)).toThrow(RangeError);
  });

  // 260615-ipz: negative coefficients a/b can drive a recurrence term non-positive
  // (NaN/Infinity/0 Hz risk). Non-negative is the safe musical domain —
  // Fibonacci/metallic recurrences use positive weights.
  it("rejects a negative coefficient a with RangeError", () => {
    expect(() => meruScale(-1n, 1n, 1n, 1n, 5)).toThrow(RangeError);
    expect(() => meruScale(-1n, 1n, 1n, 1n, 5)).toThrowError(/positive|non-negative/i);
  });

  it("rejects a negative coefficient b with RangeError", () => {
    expect(() => meruScale(1n, -5n, 1n, 1n, 5)).toThrow(RangeError);
  });

  // REGRESSION: Fibonacci (1,1,1,1) still produces the expected convergents.
  it("REGRESSION: Fibonacci meruScale(1,1,1,1,6) still returns 6 exact convergents", () => {
    const scale = meruScale(1n, 1n, 1n, 1n, 6);
    const expected = ["1/1", "2/1", "3/2", "5/3", "8/5", "13/8"];
    expect(scale.intervals.length).toBe(expected.length);
    expected.forEach((s, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(new Interval(s)) : false).toBe(true);
    });
  });
});

describe("meruScale — metallic limit is NEVER a scale degree (SURF-06 / D-09 Pitfall 4)", () => {
  it("the golden limit cents does not appear as any interval's cents in the meruScale Scale", () => {
    const scale = meruScale(1n, 1n, 1n, 1n, 12);
    const limitCents = metallicLimitCents(1, 1);
    // The irrational limit was NOT folded in as a degree — no exact-rational
    // convergent equals the irrational mean (convergents only CONVERGE to it).
    for (const iv of scale.intervals) {
      expect(Math.abs(iv.cents - limitCents)).toBeGreaterThan(1e-6);
    }
  });
});
