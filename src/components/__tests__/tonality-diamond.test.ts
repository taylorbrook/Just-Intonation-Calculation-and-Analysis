// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { tonalityDiamond } from "../tonality-diamond.js";
import { Scale } from "../../lib/scale.js";
import { Interval } from "../../lib/interval.js";
import { makeStubSynth } from "./test-utils.js";

const seedScale = (): Scale =>
  new Scale([
    new Interval("9/8"),
    new Interval("5/4"),
    new Interval("21/16"),
    new Interval("3/2"),
    new Interval("27/16"),
    new Interval("7/4"),
    new Interval("2/1"),
  ]);

describe("tonalityDiamond factory", () => {
  it("returns an HTMLElement with class 'tonality-diamond-widget' and h2 'Tonality diamond'", () => {
    const el = tonalityDiamond(seedScale(), makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.querySelector("h2")?.textContent).toBe("Tonality diamond");
  });

  it("renders SVG with class 'viz diamond'", () => {
    const el = tonalityDiamond(seedScale(), makeStubSynth());
    expect(el.querySelector("svg.viz.diamond")).not.toBeNull();
  });

  it("renders a tooltip-bearing <title> on at least one cell", () => {
    const el = tonalityDiamond(seedScale(), makeStubSynth());
    const titles = el.querySelectorAll("svg.viz.diamond title");
    expect(titles.length).toBeGreaterThan(0);
    const titleText = (titles[0] as Element).textContent ?? "";
    expect(titleText).toMatch(/limit/);
  });

  it("clicking an in-scale cell calls synth.playNotes", () => {
    const synth = makeStubSynth();
    const el = tonalityDiamond(seedScale(), synth);
    document.body.appendChild(el);
    const cell = el.querySelector('.diamond-cell[role="button"]');
    expect(cell).not.toBeNull();
    (cell as HTMLElement).dispatchEvent(new Event("click", { bubbles: true }));
    expect(synth.playNotes).toHaveBeenCalled();
  });
});
