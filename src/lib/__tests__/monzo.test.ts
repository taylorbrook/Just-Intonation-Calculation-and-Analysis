import { describe, it, expect } from "vitest";
import {
  toMonzo,
  monzosEqual,
  primeLimit,
  tenneyHeight,
  benedettiHeight,
  oddLimit,
} from "../monzo.js";
import { Interval } from "../interval.js";

describe("monzo helpers", () => {
  it("toMonzo(81n) === [0, 4]  (81 = 3^4)", () => {
    expect(toMonzo(81n)).toEqual([0, 4]);
  });

  it("toMonzo(80n) === [4, 0, 1]  (80 = 2^4 × 5)", () => {
    expect(toMonzo(80n)).toEqual([4, 0, 1]);
  });

  it("monzosEqual matches identical monzos", () => {
    expect(monzosEqual([-4, 4, -1], [-4, 4, -1])).toBe(true);
  });

  it("monzosEqual is length-tolerant (Pitfall #14)", () => {
    expect(monzosEqual([-4, 4, -1], [-4, 4, -1, 0])).toBe(true);
  });

  it("monzosEqual distinguishes syntonic comma from schisma (Pitfall #6)", () => {
    expect(monzosEqual([-4, 4, -1], [-15, 8, 1])).toBe(false);
  });

  it("primeLimit('81/80') === 5", () => {
    expect(primeLimit("81/80")).toBe(5);
  });

  it("primeLimit('7/4') === 7", () => {
    expect(primeLimit("7/4")).toBe(7);
  });

  it("oddLimit(7/4) === 7", () => {
    const m = new Interval("7/4").monzo;
    expect(oddLimit(m)).toBe(7);
  });

  it("oddLimit(9/8) === 9", () => {
    const m = new Interval("9/8").monzo;
    expect(oddLimit(m)).toBe(9);
  });

  it("tenneyHeight([-4, 4, -1]) ≈ ln(81*80) ≈ 8.78", () => {
    const expected = Math.log(81 * 80);
    expect(Math.abs(tenneyHeight([-4, 4, -1]) - expected)).toBeLessThan(0.01);
  });

  it("benedettiHeight([-4, 4, -1]) === 6480 (= 81 × 80)", () => {
    expect(benedettiHeight([-4, 4, -1])).toBe(6480);
  });
});
