// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { playDyad } from "../play-dyad.js";
import { Interval } from "../../lib/interval.js";
import { makeStubSynth } from "./test-utils.js";

describe("playDyad factory", () => {
  it("returns an HTMLButtonElement with class 'play-btn' and type 'button'", () => {
    const btn = playDyad(new Interval("5/4"), new Interval("7/4"), makeStubSynth());
    expect(btn).toBeInstanceOf(HTMLButtonElement);
    expect(btn.className).toBe("play-btn");
    expect(btn.type).toBe("button");
  });

  it("default render shows just the ▶ glyph (no label)", () => {
    const btn = playDyad(new Interval("5/4"), new Interval("7/4"), makeStubSynth());
    expect(btn.textContent).toBe("▶");
  });

  it("opts.label overrides textContent to '▶ <label>'", () => {
    const btn = playDyad(new Interval("5/4"), new Interval("7/4"), makeStubSynth(), {
      label: "5:4:7",
    });
    expect(btn.textContent).toBe("▶ 5:4:7");
  });

  it("aria-label contains both ratios", () => {
    const btn = playDyad(new Interval("5/4"), new Interval("7/4"), makeStubSynth());
    const aria = btn.getAttribute("aria-label") ?? "";
    expect(aria).toMatch(/5\/4/);
    expect(aria).toMatch(/7\/4/);
  });

  it("click dispatches a single synth.playNotes call with [baseHz*a, baseHz*b]", () => {
    const synth = makeStubSynth();
    const btn = playDyad(new Interval("5/4"), new Interval("7/4"), synth);
    document.body.appendChild(btn);
    btn.click();
    expect(synth.playNotes).toHaveBeenCalledTimes(1);
    expect(synth.playNotes).toHaveBeenCalledWith([550, 770], 1.5);
    expect(synth.playNote).not.toHaveBeenCalled();
    expect(synth.playArpeggio).not.toHaveBeenCalled();
  });

  it("custom baseHz + duration are forwarded to playNotes", () => {
    const synth = makeStubSynth();
    const btn = playDyad(new Interval("5/4"), new Interval("7/4"), synth, {
      baseHz: 220,
      duration: 2.0,
    });
    document.body.appendChild(btn);
    btn.click();
    expect(synth.playNotes).toHaveBeenCalledTimes(1);
    expect(synth.playNotes).toHaveBeenCalledWith([275, 385], 2.0);
  });
});
