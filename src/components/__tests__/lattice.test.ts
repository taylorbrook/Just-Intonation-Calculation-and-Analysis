// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { lattice } from "../lattice.js";
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

describe("lattice factory", () => {
  it("returns an HTMLElement with class 'lattice-widget' and h2 'Lattice'", () => {
    const el = lattice(seedScale(), makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("lattice-widget");
    expect(el.querySelector("h2")?.textContent).toBe("Lattice");
  });

  it("renders an SVG with class 'viz lattice'", () => {
    const el = lattice(seedScale(), makeStubSynth());
    const svg = el.querySelector("svg.viz.lattice");
    expect(svg).not.toBeNull();
  });

  it("clicking an in-scale node calls synth.playNotes (default audition='dyad')", () => {
    const synth = makeStubSynth();
    const el = lattice(seedScale(), synth);
    document.body.appendChild(el);
    const node = el.querySelector('.lattice-node[role="button"]');
    expect(node).not.toBeNull();
    (node as HTMLElement).dispatchEvent(new Event("click", { bubbles: true }));
    expect(synth.playNotes).toHaveBeenCalled();
  });

  it("octave-only scale shows empty-state copy", () => {
    const octaveOnly = new Scale([new Interval("2/1")]);
    const el = lattice(octaveOnly, makeStubSynth());
    expect(el.textContent).toContain("This scale only spans the octave");
  });
});
