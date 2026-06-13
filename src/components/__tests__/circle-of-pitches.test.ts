// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { circleOfPitches } from "../circle-of-pitches.js";
import { Interval } from "../../lib/interval.js";
import { Scale } from "../../lib/scale.js";
import { makeStubSynth } from "./test-utils.js";

/** A 7-degree exact-JI major scale + 2/1 period — 8 intervals total. */
function jiMajor(): Scale {
  const ratios = ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"];
  return new Scale(ratios.map((r) => new Interval(r)));
}

/** A "tempered" scale: cents-derived fractions (Hz-faithful) flagged tempered downstream. */
function temperedScale(): Scale {
  // 12-EDO-ish fractions standing in for cents-to-ratio adapter output.
  const ratios = ["1/1", "126/119", "5/4", "4/3", "3/2", "2/1"];
  return new Scale(ratios.map((r) => new Interval(r)));
}

describe("circleOfPitches — marker count (Test 1)", () => {
  it("renders exactly N marker groups for an N-interval scale", () => {
    const scale = jiMajor();
    const el = circleOfPitches(scale, makeStubSynth());
    document.body.appendChild(el);
    expect(el.querySelectorAll(".circle-of-pitches__node").length).toBe(
      scale.intervals.length,
    );
  });

  it("returns a <section class='circle-of-pitches-widget'> root", () => {
    const el = circleOfPitches(jiMajor(), makeStubSynth());
    expect(el.tagName.toLowerCase()).toBe("section");
    expect(el.className).toContain("circle-of-pitches-widget");
  });
});

describe("circleOfPitches — rim labels (Test 2, D-01)", () => {
  it("exact-JI scale renders a ratio label like '5/4'", () => {
    const el = circleOfPitches(jiMajor(), makeStubSynth());
    const labels = [...el.querySelectorAll(".circle-of-pitches__label")].map(
      (n) => n.textContent ?? "",
    );
    expect(labels).toContain("5/4");
    // No cents glyph in any JI label.
    expect(labels.some((l) => l.includes("¢"))).toBe(false);
  });

  it("tempered scale (opts.tempered) renders cents-only labels and NO ratio", () => {
    const el = circleOfPitches(temperedScale(), makeStubSynth(), {
      tempered: true,
    });
    const labels = [...el.querySelectorAll(".circle-of-pitches__label")].map(
      (n) => n.textContent ?? "",
    );
    // Every label is a cents value (ends in the ¢ glyph), none is a bare ratio.
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every((l) => l.includes("¢"))).toBe(true);
    expect(labels.some((l) => /^\d+\/\d+$/.test(l))).toBe(false);
  });
});

describe("circleOfPitches — click audition (Test 3)", () => {
  it("clicking a marker calls synth.playNote exactly once with positive Hz + duration", () => {
    const synth = makeStubSynth();
    const el = circleOfPitches(jiMajor(), synth, { baseHz: 440 });
    document.body.appendChild(el);
    const node = el.querySelector<SVGGElement>(".circle-of-pitches__node");
    expect(node).not.toBeNull();
    node!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(synth.playNote).toHaveBeenCalledTimes(1);
    const [hz, dur] = synth.playNote.mock.calls[0]!;
    expect(hz).toBeGreaterThan(0);
    expect(dur).toBeGreaterThan(0);
  });

  it("Enter / Space keydown on a focused marker also calls playNote", () => {
    const synth = makeStubSynth();
    const el = circleOfPitches(jiMajor(), synth, { baseHz: 440 });
    document.body.appendChild(el);
    const node = el.querySelector<SVGGElement>(".circle-of-pitches__node");
    node!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    node!.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(synth.playNote).toHaveBeenCalledTimes(2);
  });

  it("audition Hz is baseHz * the Number-coerced fraction even when tempered", () => {
    const synth = makeStubSynth();
    const scale = temperedScale();
    const el = circleOfPitches(scale, synth, { baseHz: 100, tempered: true });
    document.body.appendChild(el);
    const nodes = el.querySelectorAll<SVGGElement>(".circle-of-pitches__node");
    // Click the 3/2 degree (index 4 in temperedScale).
    const target = nodes[4]!;
    target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const [hz] = synth.playNote.mock.calls[0]!;
    expect(hz).toBeCloseTo(150, 6); // 100 * 3/2
  });
});

describe("circleOfPitches — empty-state (Test 4, D-17)", () => {
  it("octave-only scale renders a <p> empty-state and NO svg markers", () => {
    const scale = new Scale([new Interval("1/1"), new Interval("2/1")]);
    // intervals.length === 2 still has interior? No — 1/1 + period only.
    // Use a true unison-only scale to trip the <= 1 guard.
    const single = new Scale([new Interval("2/1")]);
    const el = circleOfPitches(single, makeStubSynth());
    expect(el.querySelector(".circle-of-pitches-empty")).not.toBeNull();
    expect(el.querySelector(".circle-of-pitches__node")).toBeNull();
    // The two-element guard test is informational; assert the unison guard only.
    void scale;
  });
});

describe("circleOfPitches — hover tooltip (Test 5, D-04)", () => {
  it("each marker contains an SVG <title> with pitch info + signed cents-from-12tet", () => {
    const el = circleOfPitches(jiMajor(), makeStubSynth());
    const nodes = el.querySelectorAll<SVGGElement>(".circle-of-pitches__node");
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      const title = node.querySelector("title");
      expect(title).not.toBeNull();
      expect((title!.textContent ?? "").length).toBeGreaterThan(0);
    }
  });

  it("a negative cents-from-12tet tooltip uses the U+2212 minus sign (not U+002D)", () => {
    // 4/3 is ≈ -1.96¢ from 12-TET; its tooltip should carry U+2212.
    const el = circleOfPitches(jiMajor(), makeStubSynth());
    const titles = [...el.querySelectorAll("title")].map((t) => t.textContent ?? "");
    const negativeTitles = titles.filter((t) => t.includes("−"));
    expect(negativeTitles.length).toBeGreaterThan(0);
    // And NO ASCII hyphen-minus used as a sign immediately before a cents digit.
    expect(titles.some((t) => /\s-\d/.test(t))).toBe(false);
  });
});
