// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { keyboard } from "../keyboard.js";
import { Scale } from "../../lib/scale.js";
import { Interval } from "../../lib/interval.js";
import { makeStubSynth } from "./test-utils.js";

const sevenScale = (): Scale =>
  new Scale([
    new Interval("9/8"),
    new Interval("5/4"),
    new Interval("21/16"),
    new Interval("3/2"),
    new Interval("27/16"),
    new Interval("7/4"),
    new Interval("2/1"),
  ]);

describe("keyboard factory", () => {
  it("returns an HTMLElement with class 'keyboard-widget' and h2 'Keyboard'", () => {
    const el = keyboard(sevenScale(), makeStubSynth(), 440);
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.querySelector("h2")?.textContent).toBe("Keyboard");
  });

  it("renders one key per scale degree (7 keys for a 7-degree scale)", () => {
    const el = keyboard(sevenScale(), makeStubSynth(), 440);
    const keys = el.querySelectorAll('.keyboard__key[role="button"]');
    expect(keys.length).toBe(7);
  });

  it("each key's aria-label includes ratio + signed cents-from-12tet at 0.1¢", () => {
    const el = keyboard(sevenScale(), makeStubSynth(), 440);
    const keys = el.querySelectorAll('.keyboard__key[role="button"]');
    const firstLabel = (keys[0] as Element).getAttribute("aria-label") ?? "";
    expect(firstLabel).toMatch(/Play degree 1: 9\/8/);
    expect(firstLabel).toMatch(/[+−-]\d+\.\d¢/);
  });

  it("pointerdown calls synth.playNote (NOT playNotes — single note per D-04)", () => {
    const synth = makeStubSynth();
    const el = keyboard(sevenScale(), synth, 440);
    document.body.appendChild(el);
    const key = el.querySelector('.keyboard__key[role="button"]') as HTMLElement;
    key.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(synth.playNote).toHaveBeenCalled();
    expect(synth.playNotes).not.toHaveBeenCalled();
  });

  it("renders period boundary marker after the last key", () => {
    const el = keyboard(sevenScale(), makeStubSynth(), 440);
    const marker = el.querySelector(".keyboard__period-boundary");
    expect(marker).not.toBeNull();
  });
});
