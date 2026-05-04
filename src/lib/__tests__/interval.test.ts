import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";

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
});
