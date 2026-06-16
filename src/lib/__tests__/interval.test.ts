import { describe, it, expect } from "vitest";
import { Interval, type IntervalSource } from "../interval.js";

describe("Interval", () => {
  it("constructs from a string ratio without throwing and stores BigInt n/d", () => {
    const i = new Interval("81/79");
    expect(i.fraction.n).toBe(81n);
    expect(i.fraction.d).toBe(79n);
  });

  it("round-trips 81/79 through monzo", () => {
    const i = new Interval("81/79");
    const round = Interval.fromMonzo(i.monzo);
    expect(round.equals(i)).toBe(true);
  });

  it("preserves large numerator/denominator past 2^31 via the BigInt path", () => {
    const i = new Interval("2147483648/2147483647");
    expect(i.fraction.n).toBe(2147483648n);
    expect(i.fraction.d).toBe(2147483647n);
  });

  it("computes cents for 3/2 in the expected window (~701.955)", () => {
    const i = new Interval("3/2");
    expect(i.cents).toBeGreaterThan(701.9);
    expect(i.cents).toBeLessThan(702.0);
  });

  it("computes centsFrom12tet for 3/2 as +~1.955", () => {
    const i = new Interval("3/2");
    expect(i.centsFrom12tet).toBeGreaterThan(1.9);
    expect(i.centsFrom12tet).toBeLessThan(2.0);
  });

  it("computes centsFrom12tet for 5/4 as -~13.686", () => {
    const i = new Interval("5/4");
    expect(i.centsFrom12tet).toBeGreaterThan(-14.0);
    expect(i.centsFrom12tet).toBeLessThan(-13.6);
  });

  // FIX (260616-bkm): cents must stay FINITE for arbitrarily large fractions.
  // The old `1200*log2(Number(fraction.valueOf()))` overflowed to Infinity once
  // n (or d) exceeded ~2^1024; the monzo fallback recovers a finite value.
  it("cents is FINITE for a huge fraction whose Number() value overflows to Infinity", () => {
    // 3^2000 is ~954 decimal digits — Number(3n**2000n) === Infinity (well past
    // the ~308-digit / 2^1024 float ceiling). The monzo sum stays finite.
    const huge = Interval.fromMonzo([0, 2000]); // 3^2000 / 1
    // Document the overflow threshold: the direct float path is Infinity here.
    expect(Number(huge.fraction.valueOf())).toBe(Number.POSITIVE_INFINITY);
    expect(Number.isFinite(huge.cents)).toBe(true);
    expect(huge.cents).toBeGreaterThan(0);
    // Exact expectation: 1200 * 2000 * log2(3).
    expect(huge.cents).toBeCloseTo(1200 * 2000 * Math.log2(3), 3);
  });

  // FIX (260616-bkm) regression: for NORMAL ratios the cents value must still
  // match the old `1200*log2(n/d)` formula within float epsilon.
  it("cents matches the old 1200*log2(n/d) formula for normal ratios (3/2, 5/4, 81/80)", () => {
    for (const r of ["3/2", "5/4", "81/80"]) {
      const iv = new Interval(r);
      expect(iv.cents).toBeCloseTo(1200 * Math.log2(Number(iv.fraction.valueOf())), 9);
    }
  });

  it("cents is 0 for the unison 1/1 (empty/zero monzo)", () => {
    expect(new Interval("1/1").cents).toBe(0);
  });

  it("multiplies (3/2 * 4/3 == 2/1)", () => {
    const result = new Interval("3/2").mul(new Interval("4/3"));
    expect(result.equals(new Interval("2/1"))).toBe(true);
  });

  it("divides (5/4 / 9/8 == 10/9)", () => {
    const result = new Interval("5/4").div(new Interval("9/8"));
    expect(result.equals(new Interval("10/9"))).toBe(true);
  });

  it("inverts (5/4)^-1 == 4/5", () => {
    const result = new Interval("5/4").inv();
    expect(result.equals(new Interval("4/5"))).toBe(true);
  });

  it("octave-reduces 9/4 to 9/8 with default period 2/1", () => {
    const result = new Interval("9/4").octaveReduce();
    expect(result.equals(new Interval("9/8"))).toBe(true);
  });

  it("octave-reduces 9/1 to 1/1 with period 3/1 (Pitfall #13 — period-aware)", () => {
    const result = new Interval("9/1").octaveReduce(new Interval("3/1"));
    expect(result.equals(new Interval("1/1"))).toBe(true);
  });

  it("equals normalizes 1/1 == 2/2", () => {
    expect(new Interval("1/1").equals(new Interval("2/2"))).toBe(true);
  });

  it("returns NEW instances from mul/div/inv (immutable per D-24)", () => {
    const a = new Interval("3/2");
    const b = new Interval("4/3");
    const product = a.mul(b);
    expect(product).not.toBe(a);
    expect(product).not.toBe(b);
    const inverted = a.inv();
    expect(inverted).not.toBe(a);
  });

  it("returns NEW instance from octaveReduce", () => {
    const a = new Interval("9/4");
    const reduced = a.octaveReduce();
    expect(reduced).not.toBe(a);
  });

  // CR-01: octaveReduce must reject period <= 1/1 (would otherwise infinite-loop).
  it("octaveReduce throws RangeError when period === 1/1", () => {
    expect(() => new Interval("9/4").octaveReduce(new Interval("1/1"))).toThrowError(RangeError);
  });

  it("octaveReduce throws RangeError when period < 1/1", () => {
    expect(() => new Interval("9/4").octaveReduce(new Interval("1/2"))).toThrowError(RangeError);
  });

  // 260615-ipz: the REAL infinite-loop surface is a NON-POSITIVE fraction (<= 0).
  // `f.compare(one) < 0` would stay true forever because `f.mul(pf)` keeps a
  // negative/zero value negative/zero. Guard sign/zero, NOT compare-to-one (the
  // latter would over-reject valid sub-unison ratios the diamond depends on).
  it("octaveReduce throws RangeError for the zero ratio 0/1 (non-positive guard)", () => {
    expect(() => new Interval("0/1").octaveReduce()).toThrowError(RangeError);
    expect(() => new Interval("0/1").octaveReduce()).toThrowError(/positive/i);
  });

  it("octaveReduce throws RangeError for a negative ratio -3/2 (non-positive guard)", () => {
    expect(() => new Interval("-3/2").octaveReduce()).toThrowError(RangeError);
    expect(() => new Interval("-3/2").octaveReduce()).toThrowError(/positive/i);
  });

  // REGRESSION: the non-positive guard must NOT over-reject valid (0, 1) ratios —
  // the tonality diamond reduces i/j where i<j (e.g. 3/5 -> 6/5) and depends on
  // sub-unison reduction terminating correctly.
  it("octave-reduces sub-unison ratios into [1, 2): 1/2 -> 1/1, 3/5 -> 6/5", () => {
    expect(new Interval("1/2").octaveReduce().equals(new Interval("1/1"))).toBe(true);
    expect(new Interval("3/5").octaveReduce().equals(new Interval("6/5"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Provenance flag (260615-jtm finding #1) — ratio-vs-cents source tracking.
// Immutable per D-24; set once at construction; metadata only (no math impact).
// ---------------------------------------------------------------------------

describe("Interval.source provenance (260615-jtm)", () => {
  it('defaults to "ratio" for bare construction (backward-compatible)', () => {
    expect(new Interval("5/4").source).toBe("ratio");
  });

  it('defaults to "ratio" for numeric construction', () => {
    expect(new Interval(1.25).source).toBe("ratio");
  });

  it('accepts an explicit "cents" source tag', () => {
    expect(new Interval(1.25, "cents").source).toBe("cents");
  });

  it('accepts an explicit "ratio" source tag', () => {
    expect(new Interval("5/4", "ratio").source).toBe("ratio");
  });

  it('fromMonzo is exact by construction → source is "ratio"', () => {
    expect(Interval.fromMonzo([-2, 0, 1]).source).toBe("ratio");
  });

  it("source is readonly metadata — does not affect cents/fraction/equality", () => {
    const ratio = new Interval(1.25);
    const cents = new Interval(1.25, "cents");
    // Same Fraction → same cents → equal, regardless of provenance.
    expect(cents.cents).toBeCloseTo(ratio.cents, 10);
    expect(cents.fraction.equals(ratio.fraction)).toBe(true);
    expect(cents.equals(ratio)).toBe(true);
  });

  it('does NOT propagate source through arithmetic (transposed pitch defaults to "ratio")', () => {
    const cents = new Interval(1.25, "cents");
    expect(cents.mul(new Interval("2/1")).source).toBe("ratio");
    expect(cents.div(new Interval("2/1")).source).toBe("ratio");
    expect(cents.inv().source).toBe("ratio");
    expect(cents.octaveReduce().source).toBe("ratio");
  });

  it("IntervalSource type alias is exported and assignable", () => {
    const s: IntervalSource = "cents";
    expect(new Interval("3/2", s).source).toBe("cents");
  });
});
