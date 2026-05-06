// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";

// Plot is bundled by Framework at runtime via npm:@observablehq/plot. Vitest
// does not resolve `npm:` URLs, so stub Plot.plot to return an empty SVG.
vi.mock("npm:@observablehq/plot", () => ({
  plot: () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "plot-stub");
    return svg as unknown as HTMLElement;
  },
  ruleX: () => ({}),
  dot: () => ({}),
}));

import { scaleCompare, BUILTIN_B_SCALES, disposeScaleCompare } from "../scale-compare.js";
import { Scale } from "../../lib/scale.js";
import { Interval } from "../../lib/interval.js";
import { makeStubSynth } from "./test-utils.js";

const seedA = (): Scale =>
  new Scale([
    new Interval("9/8"),
    new Interval("5/4"),
    new Interval("21/16"),
    new Interval("3/2"),
    new Interval("27/16"),
    new Interval("7/4"),
    new Interval("2/1"),
  ]);

describe("scaleCompare factory (Task 1 baseline)", () => {
  it("returns an HTMLElement with class 'scale-compare' and an h2 'Compare scales'", () => {
    const el = scaleCompare(seedA(), makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("scale-compare");
    expect(el.querySelector("h2")?.textContent).toBe("Compare scales");
  });

  it("BUILTIN_B_SCALES exposes exactly the six D-27 keys", () => {
    expect(Object.keys(BUILTIN_B_SCALES).sort()).toEqual([
      "12tet",
      "19edo",
      "31edo",
      "5-limit-7",
      "bohlen-pierce-9",
      "pythagorean-7",
    ]);
  });

  it("disposeScaleCompare(el) is a no-throw cleanup hook (CR-02 discipline)", () => {
    const el = scaleCompare(seedA(), makeStubSynth());
    document.body.appendChild(el);
    expect(() => {
      disposeScaleCompare(el);
    }).not.toThrow();
    document.body.removeChild(el);
  });
});
