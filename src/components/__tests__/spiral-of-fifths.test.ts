// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { spiralOfFifths, spiralGeometry, closingErrorCents } from "../spiral-of-fifths.js";
import { Interval } from "../../lib/interval.js";

const PURE_FIFTH = 1200 * Math.log2(1.5);

describe("closingErrorCents", () => {
  it("12 pure 3/2 fifths leave a +23.46¢ Pythagorean-comma gap", () => {
    const err = closingErrorCents(12, PURE_FIFTH);
    expect(err).toBeGreaterThan(23.4);
    expect(err).toBeLessThan(23.5);
  });
  it("12-TET (700¢) closes exactly", () => {
    expect(closingErrorCents(12, 700)).toBeCloseTo(0, 9);
  });
  it("1/4-comma meantone (≈696.578¢) leaves a negative gap < -40¢", () => {
    expect(closingErrorCents(12, 696.578)).toBeLessThan(-40);
  });
});

describe("spiralGeometry — pure 3/2", () => {
  it("returns n+1 steps (k=0..n inclusive)", () => {
    expect(spiralGeometry(12, PURE_FIFTH)).toHaveLength(13);
  });
  it("step 0 has ratio 1/1, angle 0, cumulative 0", () => {
    const s = spiralGeometry(12, PURE_FIFTH)[0];
    expect(s).toBeDefined();
    expect(s!.ratio?.equals(new Interval("1/1"))).toBe(true);
    expect(s!.angleRad).toBe(0);
    expect(s!.cumulativeCents).toBe(0);
  });
  it("step 1 is 3/2 (octave-reduced), centsFrom12tet ≈ +1.955", () => {
    const s = spiralGeometry(12, PURE_FIFTH)[1];
    expect(s!.ratio?.equals(new Interval("3/2"))).toBe(true);
    expect(s!.centsFrom12tet).toBeGreaterThan(1.9);
    expect(s!.centsFrom12tet).toBeLessThan(2.0);
  });
  it("first 7 steps follow the Pythagorean chain: 1/1, 3/2, 9/8, 27/16, 81/64, 243/128, 729/512", () => {
    const expected = ["1/1", "3/2", "9/8", "27/16", "81/64", "243/128", "729/512"];
    const steps = spiralGeometry(6, PURE_FIFTH);
    expected.forEach((r, k) => {
      expect(steps[k]!.ratio?.equals(new Interval(r))).toBe(true);
    });
  });
  it("step 12 octave-reduces to 531441/524288 (Pythagorean comma) and lands at angle ≠ 0 (gap)", () => {
    // octaveReduce brings the ratio into [1, 2). After 12 chained fifths the
    // exact octave-reduced ratio is 3^12 / 2^19 = 531441/524288 — the Pythagorean
    // comma above 1/1, NOT 1/1. The gap shows up both in the ratio and in the
    // wrapped angle (≈0.1228 rad ≈ +23.46¢).
    const s = spiralGeometry(12, PURE_FIFTH)[12];
    expect(s!.ratio?.equals(new Interval("531441/524288"))).toBe(true);
    const wrapped = s!.angleRad % (2 * Math.PI);
    expect(wrapped).toBeGreaterThan(0.12);
    expect(wrapped).toBeLessThan(0.13);
  });
});

describe("spiralGeometry — tempered branch", () => {
  it("temperedFifthCents=700 closes exactly at k=12", () => {
    const steps = spiralGeometry(12, 700, true);
    expect(steps[12]!.ratio).toBeNull();
    expect(steps[12]!.angleRad % (2 * Math.PI)).toBeCloseTo(0, 9);
  });
  it("temperedFifthCents=701.955 matches pure-3/2 cents-from-12-TET at k=1", () => {
    const s = spiralGeometry(12, 701.955, true)[1];
    expect(s!.ratio).toBeNull();
    expect(s!.centsFrom12tet).toBeGreaterThan(1.9);
    expect(s!.centsFrom12tet).toBeLessThan(2.0);
  });
  it("temperedFifthCents=696.578 (1/4-comma meantone) sits below 12-TET at k=1", () => {
    const s = spiralGeometry(12, 696.578, true)[1];
    expect(s!.centsFrom12tet).toBeLessThan(0);
  });
});

describe("spiralOfFifths factory (DOM smoke)", () => {
  it("returns an HTMLDivElement with class 'spiral-of-fifths-widget'", () => {
    const el = spiralOfFifths(12);
    expect(el).toBeInstanceOf(HTMLDivElement);
    expect(el.className).toContain("spiral-of-fifths-widget");
  });
  it("does NOT contain an <h2> child (not wired to a page yet)", () => {
    const el = spiralOfFifths(12);
    expect(el.querySelector("h2")).toBeNull();
  });
  it("renders n+1 = 13 nodes for n=12", () => {
    const el = spiralOfFifths(12);
    expect(el.querySelectorAll(".spiral-of-fifths__node").length).toBe(13);
  });
  it("highlightWolf: true draws a wolf chord", () => {
    const el = spiralOfFifths(12, { highlightWolf: true });
    expect(el.querySelector(".spiral-of-fifths__wolf")).not.toBeNull();
  });
  it("highlightWolf default: no wolf chord", () => {
    const el = spiralOfFifths(12);
    expect(el.querySelector(".spiral-of-fifths__wolf")).toBeNull();
  });
  it("temperedFifthCents suppresses ratio labels but keeps cents labels", () => {
    const el = spiralOfFifths(12, { temperedFifthCents: 700 });
    expect(el.querySelectorAll(".spiral-of-fifths__ratio").length).toBe(0);
    expect(el.querySelectorAll(".spiral-of-fifths__cents").length).toBe(13);
  });
  it("opts.width forwards to root SVG width attribute", () => {
    const el = spiralOfFifths(12, { width: 600 });
    const svg = el.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("600");
  });
});
