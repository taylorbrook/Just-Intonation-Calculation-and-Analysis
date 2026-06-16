/**
 * Vitest golden tests for the EDO ↔ JI mapping kernel (Plan 04-01).
 *
 * Discipline:
 *   - Pitfall #1: ratio equality is via `Interval.equals` (BigInt Fraction). NEVER cents-tolerance.
 *   - Pitfall #16: float-cents results allow `toBeCloseTo(_, 1)` (~0.1¢ window) — but only on
 *     scalar cents/error fields, never as a stand-in for ratio equality.
 *   - R-01: NEVER imports `Fraction` from `xen-dev-utils`. The kernel under test enforces this;
 *     the test file mirrors the discipline.
 */

import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import { Scale, jiSubsetOfEdo } from "../scale.js";
import { parseScala } from "../scala.js";
import { oddLimit } from "../monzo.js";
import { bestEdosForScale, bestJiInEdo, oddLimitApproximation, type EdoErrorRow } from "../edo.js";

const jiDiatonic5limit = (): Scale =>
  new Scale([
    new Interval("9/8"),
    new Interval("5/4"),
    new Interval("4/3"),
    new Interval("3/2"),
    new Interval("5/3"),
    new Interval("15/8"),
    new Interval("2/1"),
  ]);

describe("bestEdosForScale", () => {
  it("returns ranked rows for 5-limit diatonic — top by max-error is one of {12, 19, 31}", () => {
    const s = jiDiatonic5limit();
    const rows = bestEdosForScale(s, { min: 5, max: 31 }, "max");
    const sortedByMax = [...rows].sort((a, b) => a.maxCentsError - b.maxCentsError);
    const winner = sortedByMax[0];
    expect(winner).toBeDefined();
    expect([12, 19, 31]).toContain(winner!.edoSteps);
    // Defensive: 13 and 18 must not be the top.
    expect(winner!.edoSteps).not.toBe(13);
    expect(winner!.edoSteps).not.toBe(18);
  });

  it("returns one row per EDO in the inclusive range (range.min..range.max)", () => {
    const s = jiDiatonic5limit();
    const rows = bestEdosForScale(s, { min: 5, max: 31 }, "max");
    expect(rows.length).toBe(31 - 5 + 1);
  });

  it("populates all three error fields on every row regardless of metric arg", () => {
    const s = jiDiatonic5limit();
    const metrics: Array<"max" | "rms" | "tenney"> = ["max", "rms", "tenney"];
    for (const m of metrics) {
      const rows = bestEdosForScale(s, { min: 5, max: 31 }, m);
      for (const row of rows) {
        expect(Number.isFinite(row.maxCentsError)).toBe(true);
        expect(Number.isFinite(row.rmsCentsError)).toBe(true);
        expect(Number.isFinite(row.tenneyWeightedError)).toBe(true);
        expect(row.maxCentsError).toBeGreaterThanOrEqual(0);
        expect(row.rmsCentsError).toBeGreaterThanOrEqual(0);
        expect(row.tenneyWeightedError).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("supports re-sorting by metric — top results for max and rms are both good fits", () => {
    const s = jiDiatonic5limit();
    const rows = bestEdosForScale(s, { min: 5, max: 31 }, "max");
    const byMax = [...rows].sort((a, b) => a.maxCentsError - b.maxCentsError);
    const byRms = [...rows].sort((a, b) => a.rmsCentsError - b.rmsCentsError);
    expect(byMax[0]).toBeDefined();
    expect(byRms[0]).toBeDefined();
    // Both metrics should pick a known good 5-limit EDO from {12, 19, 22, 31}.
    expect([12, 19, 22, 31]).toContain(byMax[0]!.edoSteps);
    expect([12, 19, 22, 31]).toContain(byRms[0]!.edoSteps);
  });

  it("throws RangeError when range.min < 5 (D-07)", () => {
    const s = jiDiatonic5limit();
    expect(() => bestEdosForScale(s, { min: 4, max: 5 }, "max")).toThrow(RangeError);
  });

  it("Tenney-weighted error is finite, non-negative, and zero for the trivial EDO/JI fit", () => {
    const s = jiDiatonic5limit();
    const rows: EdoErrorRow[] = bestEdosForScale(s, { min: 5, max: 31 }, "tenney");
    for (const row of rows) {
      expect(Number.isFinite(row.tenneyWeightedError)).toBe(true);
      expect(row.tenneyWeightedError).toBeGreaterThanOrEqual(0);
    }

    // Trivial fit: take an N-EDO's prime-limit JI subset and ask "how well does N-EDO render it?"
    // Each interval is BY CONSTRUCTION the closest prime-limit ratio to one of N-EDO's steps,
    // so |centsError| is the rounding gap. For 12-EDO with 5-limit JI, the subset and 12-EDO
    // do not coincide exactly (e.g., 5/4 ≈ 386.31¢ vs 400¢) — so we instead assert the trivial
    // case where the scale IS one of N-EDO's pitches: a 1-element scale containing only 2/1.
    const trivialScale = new Scale([new Interval("2/1")]);
    const trivialRows = bestEdosForScale(trivialScale, { min: 5, max: 12 }, "max");
    for (const row of trivialRows) {
      // 2/1 lands exactly on every EDO's last step — error must be 0.
      expect(row.maxCentsError).toBeCloseTo(0, 1);
      expect(row.rmsCentsError).toBeCloseTo(0, 1);
      expect(row.tenneyWeightedError).toBeCloseTo(0, 1);
    }
  });

  it("tempered (cents-based) scale does not throw 'Out of primes' — Max/RMS finite, Tenney NaN", () => {
    // A 24-EDO scale sent as cents (Generate page's tempered Send-to) parses into lossy
    // float-derived rationals with no JI provenance — tenneyHeight(iv.monzo) would throw
    // "Out of primes". The fit table is still meaningful (Max/RMS are cents-only), so the
    // Tenney column degrades to NaN instead of the whole computation throwing.
    const edo24 = new Scale(
      parseScala(Array.from({ length: 24 }, (_, i) => ((i + 1) * 50).toFixed(4)).join("\n")),
    );
    let rows: EdoErrorRow[] = [];
    expect(() => {
      rows = bestEdosForScale(edo24, { min: 5, max: 31 }, "max");
    }).not.toThrow();
    // 24-EDO fits a 24-EDO scale perfectly — Max/RMS error 0 there, finite everywhere.
    const at24 = rows.find((r) => r.edoSteps === 24);
    expect(at24).toBeDefined();
    expect(at24!.maxCentsError).toBeCloseTo(0, 1);
    expect(at24!.rmsCentsError).toBeCloseTo(0, 1);
    for (const row of rows) {
      expect(Number.isFinite(row.maxCentsError)).toBe(true);
      expect(Number.isFinite(row.rmsCentsError)).toBe(true);
      // Tenney weighting is N/A for a tempered scale.
      expect(Number.isNaN(row.tenneyWeightedError)).toBe(true);
    }
  });
});

describe("bestJiInEdo", () => {
  it("'prime' branch is parity-equal to jiSubsetOfEdo for (31, 7)", () => {
    const a = bestJiInEdo(31, 7, "prime");
    const b = jiSubsetOfEdo(31, 7);
    expect(a.intervals.length).toBe(b.intervals.length);
    for (let i = 0; i < a.intervals.length; i++) {
      const ai = a.intervals[i];
      const bi = b.intervals[i];
      expect(ai && bi ? ai.equals(bi) : false).toBe(true);
    }
  });

  it("'odd' branch returns one ratio per step + period; every interval respects oddLimit", () => {
    const result = bestJiInEdo(12, 9, "odd");
    expect(result.intervals.length).toBe(13); // 12 steps + period
    // Period is 2/1.
    const last = result.intervals[result.intervals.length - 1];
    expect(last && last.equals(new Interval("2/1"))).toBe(true);
    // Every non-period interval respects the odd-limit cap.
    for (let i = 0; i < result.intervals.length - 1; i++) {
      const iv = result.intervals[i];
      expect(iv).toBeDefined();
      expect(oddLimit(iv!.monzo)).toBeLessThanOrEqual(9);
    }
  });

  it("throws RangeError when oddLimit exceeds 31 cap (D-08)", () => {
    expect(() => bestJiInEdo(12, 33, "odd")).toThrow(RangeError);
  });

  // FIX #10 (260616-bkm): the odd-limit branch dedupes by EXACT canonical
  // fraction string. High-EDO / low-odd-limit maps many steps to the same
  // closest ratio; those collapse (Pitfall #1/#6 — never cents-within-epsilon).
  it("'odd' branch emits no duplicate exact-fraction intervals for 72-EDO 9-odd-limit (FIX #10)", () => {
    const s = bestJiInEdo(72, 9, "odd");
    const keys = s.intervals.map((iv) => iv.fraction.toFraction());
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("'odd' branch ends with exactly one 2/1 period for 72-EDO 9-odd-limit (FIX #10 / D-14)", () => {
    const s = bestJiInEdo(72, 9, "odd");
    const periodKey = new Interval("2/1").fraction.toFraction();
    const keys = s.intervals.map((iv) => iv.fraction.toFraction());
    expect(keys.filter((k) => k === periodKey).length).toBe(1);
    expect(keys[keys.length - 1]).toBe(periodKey);
    expect(s.intervals.length).toBeLessThanOrEqual(72 + 1);
  });
});

describe("oddLimitApproximation", () => {
  it("returns 5/4 (BigInt-equal) for the 5/4 cents target under 5-odd-limit", () => {
    // 5/4 ≈ 386.3137¢. Must round-trip to exactly the BigInt fraction 5/4.
    const iv = oddLimitApproximation(386.3137, 5);
    expect(iv.equals(new Interval("5/4"))).toBe(true);
  });

  it("returns 1/1 for cents target 0", () => {
    const iv = oddLimitApproximation(0, 9);
    expect(iv.equals(new Interval("1/1"))).toBe(true);
  });

  it("throws RangeError when oddLimitCap > 31", () => {
    expect(() => oddLimitApproximation(100, 33)).toThrow(RangeError);
  });

  it("throws RangeError when oddLimitCap < 1", () => {
    expect(() => oddLimitApproximation(100, 0)).toThrow(RangeError);
  });
});
