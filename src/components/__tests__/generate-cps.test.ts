// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateCps } from "../generate-cps.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-cps.test.ts — CPS method widget (GEN-01, Plan 06-05).
 *
 * Mirrors mos-builder.test.ts: a stub synth, generateCps(stubSynth), query the
 * returned element. Covers the D-13 chip input (add/remove + numeric validation
 * → XSS-safe textContent chips), the D-09 preset select (Hexany/Dekany/Eikosany
 * cardinalities 7/11/21), the default Hexany render, the Play button, and
 * invalid-chip rejection (T-06-10 / T-06-11).
 */
describe("generateCps factory", () => {
  it("returns an HTMLElement with class 'generate-cps' and h2 'Combination Product Set'", () => {
    const el = generateCps(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-cps");
    expect(el.querySelector("h2")?.textContent).toBe("Combination Product Set");
  });

  it("exposes a factor-set chip input: integer input + Add button", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const chipInput = el.querySelector('input[name="cps-factor"]') as HTMLInputElement;
    const addBtn = el.querySelector('button[name="cps-add"]') as HTMLButtonElement;
    expect(chipInput).not.toBeNull();
    expect(chipInput.type).toBe("number");
    expect(addBtn).not.toBeNull();
  });

  it("default factor set renders four chips (1, 3, 5, 7) with their integers as textContent", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const chips = el.querySelectorAll(".generate-cps__chip");
    expect(chips.length).toBe(4);
    const texts = Array.from(chips).map((c) => c.textContent ?? "");
    expect(texts.some((t) => t.includes("1"))).toBe(true);
    expect(texts.some((t) => t.includes("3"))).toBe(true);
    expect(texts.some((t) => t.includes("5"))).toBe(true);
    expect(texts.some((t) => t.includes("7"))).toBe(true);
  });

  it("adding '9' creates a new chip whose textContent contains '9' (createElement+textContent — XSS-safe)", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const chipInput = el.querySelector('input[name="cps-factor"]') as HTMLInputElement;
    const addBtn = el.querySelector('button[name="cps-add"]') as HTMLButtonElement;
    chipInput.value = "9";
    addBtn.click();
    const chips = el.querySelectorAll(".generate-cps__chip");
    expect(chips.length).toBe(5);
    const texts = Array.from(chips).map((c) => c.textContent ?? "");
    expect(texts.some((t) => t.includes("9"))).toBe(true);
    // No innerHTML smuggling: chips must hold only literal text, no markup nodes.
    const hasMarkup = Array.from(chips).some((c) => c.querySelector("img, script, svg") !== null);
    expect(hasMarkup).toBe(false);
  });

  it("a chip's remove control removes it from the factor list", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const beforeChips = el.querySelectorAll(".generate-cps__chip");
    expect(beforeChips.length).toBe(4);
    const firstRemove = el.querySelector(
      ".generate-cps__chip .generate-cps__chip-remove",
    ) as HTMLButtonElement;
    expect(firstRemove).not.toBeNull();
    firstRemove.click();
    const afterChips = el.querySelectorAll(".generate-cps__chip");
    expect(afterChips.length).toBe(3);
  });

  it("invalid chip input (non-integer / ≤ 0) is rejected — no chip added, no crash", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const chipInput = el.querySelector('input[name="cps-factor"]') as HTMLInputElement;
    const addBtn = el.querySelector('button[name="cps-add"]') as HTMLButtonElement;

    chipInput.value = "abc";
    addBtn.click();
    expect(el.querySelectorAll(".generate-cps__chip").length).toBe(4);

    chipInput.value = "0";
    addBtn.click();
    expect(el.querySelectorAll(".generate-cps__chip").length).toBe(4);

    chipInput.value = "-3";
    addBtn.click();
    expect(el.querySelectorAll(".generate-cps__chip").length).toBe(4);

    chipInput.value = "2.5";
    addBtn.click();
    expect(el.querySelectorAll(".generate-cps__chip").length).toBe(4);
  });

  it("exposes a preset <select> with Hexany / Dekany / Eikosany / Custom, default Hexany", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="cps-preset"]') as HTMLSelectElement;
    expect(preset).not.toBeNull();
    const values = Array.from(preset.options).map((o) => o.value);
    expect(values).toEqual(["hexany", "dekany", "eikosany", "custom"]);
    expect(preset.value).toBe("hexany");
  });

  it("default render is the Hexany — scaleTable has 7 rows (6 degrees + period)", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(7);
  });

  it("selecting Dekany re-renders the table with 11 rows", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="cps-preset"]') as HTMLSelectElement;
    preset.value = "dekany";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(11);
  });

  it("selecting Eikosany re-renders the table with 21 rows", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="cps-preset"]') as HTMLSelectElement;
    preset.value = "eikosany";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(21);
  });

  it("selecting Custom exposes a k input", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="cps-preset"]') as HTMLSelectElement;
    preset.value = "custom";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    const kInput = el.querySelector('input[name="cps-k"]') as HTMLInputElement;
    expect(kInput).not.toBeNull();
    expect(kInput.type).toBe("number");
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once", () => {
    const synth = makeStubSynth();
    const el = generateCps(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const freqs = synth.playArpeggio.mock.calls[0]![0] as number[];
    // Default Hexany = 7 intervals (6 degrees + period).
    expect(freqs.length).toBe(7);
  });

  it("exposes its current Scale via getScale() so the page can serialize it (Send-to)", () => {
    const el = generateCps(makeStubSynth());
    document.body.appendChild(el);
    const scale = (el as unknown as { getScale: () => unknown }).getScale();
    expect(scale).not.toBeNull();
    // The default Hexany scale has 7 intervals.
    const intervals = (scale as { intervals: readonly unknown[] }).intervals;
    expect(intervals.length).toBe(7);
  });

  it("factory takes (synth, opts?) — no scale arg (the widget owns its scale)", () => {
    const synth = makeStubSynth();
    const el = generateCps(synth);
    expect(el).toBeInstanceOf(HTMLElement);
    const el2 = generateCps(synth, { baseHz: 256, precision: 2 });
    expect(el2).toBeInstanceOf(HTMLElement);
  });
});
