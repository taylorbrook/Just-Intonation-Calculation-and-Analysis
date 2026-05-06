// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { mosBuilder } from "../mos-builder.js";
import { makeStubSynth } from "./test-utils.js";

describe("mosBuilder factory", () => {
  it("returns an HTMLElement with class 'mos-builder' and h2 'MOS construction'", () => {
    const el = mosBuilder(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("mos-builder");
    expect(el.querySelector("h2")?.textContent).toBe("MOS construction");
  });

  it("default render shows 5 number inputs with default seed values 3, 2, 2, 1, 7 (D-28)", () => {
    const el = mosBuilder(makeStubSynth());
    document.body.appendChild(el);
    const genN = el.querySelector('input[name="generator-n"]') as HTMLInputElement;
    const genD = el.querySelector('input[name="generator-d"]') as HTMLInputElement;
    const perN = el.querySelector('input[name="period-n"]') as HTMLInputElement;
    const perD = el.querySelector('input[name="period-d"]') as HTMLInputElement;
    const size = el.querySelector('input[name="size"]') as HTMLInputElement;
    expect(genN).not.toBeNull();
    expect(genD).not.toBeNull();
    expect(perN).not.toBeNull();
    expect(perD).not.toBeNull();
    expect(size).not.toBeNull();
    expect(genN.type).toBe("number");
    expect(genD.type).toBe("number");
    expect(perN.type).toBe("number");
    expect(perD.type).toBe("number");
    expect(size.type).toBe("number");
    expect(genN.value).toBe("3");
    expect(genD.value).toBe("2");
    expect(perN.value).toBe("2");
    expect(perD.value).toBe("1");
    expect(size.value).toBe("7");
  });

  it("snap toggle is a checkbox checked === true by default (D-13)", () => {
    const el = mosBuilder(makeStubSynth());
    const snap = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(snap).not.toBeNull();
    expect(snap.checked).toBe(true);
  });

  it("default render shows Pythagorean diatonic — 8 intervals (7 + period)", () => {
    const el = mosBuilder(makeStubSynth());
    document.body.appendChild(el);
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(8);
  });

  it("changing size from 7 to 12 (snap ON) re-renders Pythagorean chromatic (13 intervals)", () => {
    const el = mosBuilder(makeStubSynth());
    document.body.appendChild(el);
    const sizeInput = el.querySelector('input[name="size"]') as HTMLInputElement;
    sizeInput.value = "12";
    sizeInput.dispatchEvent(new Event("input", { bubbles: true }));
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(13);
  });

  it("snap ON + size 6 snaps to nearest MOS (5 or 7) and announces in status region", () => {
    const el = mosBuilder(makeStubSynth());
    document.body.appendChild(el);
    const sizeInput = el.querySelector('input[name="size"]') as HTMLInputElement;
    sizeInput.value = "6";
    sizeInput.dispatchEvent(new Event("input", { bubbles: true }));
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent ?? "").toMatch(/Snapped to MOS size (5|7)/);
    const rows = el.querySelectorAll("tbody tr");
    // 5 + 1/1 = 6 rows; 7 + 1/1 = 8 rows
    expect([6, 8]).toContain(rows.length);
  });

  it("snap OFF + size 6 builds a non-MOS-size scale and announces 'Free size'", () => {
    const el = mosBuilder(makeStubSynth());
    document.body.appendChild(el);
    const snap = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
    snap.checked = false;
    snap.dispatchEvent(new Event("change", { bubbles: true }));
    const sizeInput = el.querySelector('input[name="size"]') as HTMLInputElement;
    sizeInput.value = "6";
    sizeInput.dispatchEvent(new Event("input", { bubbles: true }));
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent ?? "").toMatch(/Free size 6/);
    // Some output is rendered (not crashed)
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("period n=1 d=1 surfaces 'period must be > 1/1' in the status region (D-29)", () => {
    const el = mosBuilder(makeStubSynth());
    document.body.appendChild(el);
    const perN = el.querySelector('input[name="period-n"]') as HTMLInputElement;
    perN.value = "1";
    perN.dispatchEvent(new Event("input", { bubbles: true }));
    // After this change, period === 1/1 (n was set to 1, d was already 1)
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent ?? "").toMatch(/period must be > 1\/1/);
    // Prior valid scaleTable render is preserved (D-29: visual continuity)
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(8);
  });

  it("clicking Play arpeggiates exactly once with freqs.length === intervals.length", () => {
    const synth = makeStubSynth();
    const el = mosBuilder(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const callArgs = synth.playArpeggio.mock.calls[0]!;
    const freqs = callArgs[0] as number[];
    // Default seed = Pythagorean diatonic: 8 intervals
    expect(freqs.length).toBe(8);
  });

  it("factory takes (synth, opts?) — no scale arg (component owns its scale)", () => {
    // Compile-time check: the call below must type-check without a scale parameter.
    const synth = makeStubSynth();
    const el = mosBuilder(synth);
    expect(el).toBeInstanceOf(HTMLElement);
    // Also accepts opts overrides
    const el2 = mosBuilder(synth, {
      defaultGenerator: { n: 5, d: 4 },
      defaultPeriod: { n: 2, d: 1 },
      defaultSize: 5,
    });
    expect(el2).toBeInstanceOf(HTMLElement);
    const genN = el2.querySelector('input[name="generator-n"]') as HTMLInputElement;
    expect(genN.value).toBe("5");
  });
});
