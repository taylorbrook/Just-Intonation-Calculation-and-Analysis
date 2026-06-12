import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import { buildMos } from "../mos.js";
import { cps } from "../cps.js";
import { MAX_SCALE_TEXT_BYTES } from "../url.js";
import { scaleFromSonicWeave } from "../sonicweave.js";

/**
 * Stringify via n/d directly — fraction.js' Fraction.toFraction() drops "/1"
 * for whole-number ratios (so "2/1" round-trips as "2"). The n/d view is the
 * load-bearing equality surface (mirrors cps.test.ts / mos.test.ts).
 */
function ndStrings(scale: { intervals: readonly Interval[] }): string[] {
  return scale.intervals.map((iv) => `${String(iv.fraction.n)}/${String(iv.fraction.d)}`);
}

function factors(...nums: number[]): Interval[] {
  return nums.map((n) => new Interval(`${String(n)}/1`));
}

describe("scaleFromSonicWeave — the Phase-7 DSL→kernel boundary", () => {
  it("rank2(3/2, 5, 1) ≡ buildMos(3/2, 2/1, 7) by exact BigInt n/d (D-13 unison-prepended)", () => {
    const result = scaleFromSonicWeave("rank2(3/2, 5, 1)");
    expect(result.error).toBeUndefined();
    expect(result.tempered).toBe(false);
    expect(result.scale).not.toBeNull();

    const expected = buildMos(new Interval("3/2"), new Interval("2/1"), 7);
    const scale = result.scale!;

    // Same length (8 entries: 1/1 … 2/1).
    expect(scale.intervals.length).toBe(expected.intervals.length);
    // Exact n/d vector — the canonical Pythagorean Ionian.
    expect(ndStrings(scale)).toEqual([
      "1/1",
      "9/8",
      "81/64",
      "4/3",
      "3/2",
      "27/16",
      "243/128",
      "2/1",
    ]);
    // R-01: every returned interval is a kernel Interval; BigInt-level equality
    // against buildMos (Pitfall #1 — never cents tolerance).
    expected.intervals.forEach((ev, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(ev) : false).toBe(true);
    });
  });

  it("cps([1,3,5,7], 2) ≡ kernel cps Hexany by exact BigInt n/d", () => {
    const result = scaleFromSonicWeave("cps([1,3,5,7], 2)");
    expect(result.error).toBeUndefined();
    expect(result.tempered).toBe(false);
    expect(result.scale).not.toBeNull();

    const expected = cps(factors(1, 3, 5, 7), 2);
    const scale = result.scale!;

    expect(scale.intervals.length).toBe(expected.intervals.length);
    expect(ndStrings(scale)).toEqual(["1/1", "7/6", "5/4", "35/24", "5/3", "7/4", "2/1"]);
    expected.intervals.forEach((ev, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(ev) : false).toBe(true);
    });
  });

  it("quarter-comma meantone rank2(696.578…, 5, 1) is tempered — cents of record, no laundered ratios", () => {
    const result = scaleFromSonicWeave("rank2(696.578428466209, 5, 1)");
    expect(result.error).toBeUndefined();
    expect(result.tempered).toBe(true);
    expect(result.scale).not.toBeNull();

    const scale = result.scale!;
    // Unison is prepended (D-13); the seven tempered degrees follow.
    expect(scale.intervals.length).toBe(8);
    const firstCents = scale.intervals[0]?.cents ?? NaN;
    expect(firstCents).toBeCloseTo(0, 3);

    const expectedCents = [193.157, 386.314, 503.422, 696.578, 889.735, 1082.892, 1200.0];
    const degreeCents = scale.intervals.slice(1).map((iv) => iv.cents);
    expect(degreeCents.length).toBe(expectedCents.length);
    expectedCents.forEach((c, i) => {
      expect(degreeCents[i]).toBeCloseTo(c, 2);
    });
  });

  it("malformed source returns { scale: null, error } and does NOT throw", () => {
    let result!: ReturnType<typeof scaleFromSonicWeave>;
    expect(() => {
      result = scaleFromSonicWeave("this is not valid sonicweave {{{");
    }).not.toThrow();
    expect(result.scale).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("valid-but-empty source guards out.length === 0 before new Scale([])", () => {
    // A bare comment evaluates cleanly but produces an empty currentScale.
    const result = scaleFromSonicWeave("// just a comment, empty scale");
    expect(result.scale).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("source over MAX_SCALE_TEXT_BYTES returns a structured error before evaluation", () => {
    // Build a valid-looking but oversized source: a long run of comment bytes.
    const oversized = "// " + "x".repeat(MAX_SCALE_TEXT_BYTES + 10);
    expect(new TextEncoder().encode(oversized).length).toBeGreaterThan(MAX_SCALE_TEXT_BYTES);
    const result = scaleFromSonicWeave(oversized);
    expect(result.scale).toBeNull();
    expect(result.tempered).toBe(false);
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("R-01: rational intervals are kernel Intervals (BigInt round-trip), not SonicWeave objects", () => {
    const result = scaleFromSonicWeave("rank2(3/2, 5, 1)");
    const scale = result.scale!;
    for (const iv of scale.intervals) {
      expect(iv).toBeInstanceOf(Interval);
      // Each one survives a fresh BigInt round-trip against its own n/d string.
      const nd = `${String(iv.fraction.n)}/${String(iv.fraction.d)}`;
      expect(iv.equals(new Interval(nd))).toBe(true);
    }
  });
});
