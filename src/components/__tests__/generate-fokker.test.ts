// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateFokker } from "../generate-fokker.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-fokker.test.ts — Fokker periodicity-block widget (GEN-08, Plan 07-03).
 *
 * Mirrors generate-cps.test.ts / generate-ed.test.ts: a stub synth,
 * generateFokker(stubSynth), query the returned element. Covers:
 *   - D-11 default landing: classic 5-limit 12-tone block in basis mode, EXACT JI
 *     (Ratio header present, NO tempered badge), isTempered() === false.
 *   - D-09/D-10 basis↔comma mode toggle (basis is the default landing mode).
 *   - D-12 live "→ N notes" readout (extents product in basis mode, |det| via
 *     fokkerCardinality in comma mode) — shows 12 for the default block.
 *   - A3 comma mode: 81/80 + 128/125 → 12 exact-rational notes.
 *   - Non-square comma set → readout message, no crash, prior preview preserved.
 *   - Play button (.play-btn--scale).
 */
describe("generateFokker factory", () => {
  it("returns an HTMLElement with class 'generate-fokker'", () => {
    const el = generateFokker(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-fokker");
  });

  it("default landing (D-11) renders the classic 12-tone block as EXACT JI: 12 rows, Ratio header, NO tempered badge", () => {
    const el = generateFokker(makeStubSynth());
    document.body.appendChild(el);
    // 12 exact-rational notes.
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(12);
    // Exact-JI table: the "Ratio" header column is present.
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent ?? "");
    expect(headers).toContain("Ratio");
    // No tempered badge (Fokker blocks are exact rational, NOT tempered).
    expect(el.querySelector(".scale-table__badge")).toBeNull();
  });

  it("isTempered() is ALWAYS false (Fokker blocks are exact rational)", () => {
    const el = generateFokker(makeStubSynth());
    document.body.appendChild(el);
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(false);
  });

  it("exposes a basis↔comma mode select, default = basis (D-10)", () => {
    const el = generateFokker(makeStubSynth());
    document.body.appendChild(el);
    const modeSelect = el.querySelector('select[name="fokker-mode"]') as HTMLSelectElement;
    expect(modeSelect).not.toBeNull();
    const values = Array.from(modeSelect.options).map((o) => o.value);
    expect(values).toContain("basis");
    expect(values).toContain("comma");
    expect(modeSelect.value).toBe("basis");
  });

  it("live '→ N notes' readout (D-12) shows 12 for the default basis-mode block", () => {
    const el = generateFokker(makeStubSynth());
    document.body.appendChild(el);
    const readout = el.querySelector(".generate-fokker__readout");
    expect(readout).not.toBeNull();
    expect(readout?.textContent ?? "").toContain("12");
  });

  it("switching to comma mode (D-09) shows the comma chips and a |det| readout of 12, rendering 12 exact-rational rows", () => {
    const el = generateFokker(makeStubSynth());
    document.body.appendChild(el);
    const modeSelect = el.querySelector('select[name="fokker-mode"]') as HTMLSelectElement;
    modeSelect.value = "comma";
    modeSelect.dispatchEvent(new Event("change", { bubbles: true }));

    // Comma chips default to 81/80 + 128/125.
    const chips = el.querySelectorAll(".generate-fokker__chip");
    expect(chips.length).toBe(2);
    const chipTexts = Array.from(chips).map((c) => c.textContent ?? "");
    expect(chipTexts.some((t) => t.includes("81/80"))).toBe(true);
    expect(chipTexts.some((t) => t.includes("128/125"))).toBe(true);

    // Live readout shows |det| = 12.
    const readout = el.querySelector(".generate-fokker__readout");
    expect(readout?.textContent ?? "").toContain("12");

    // The block renders 12 exact-rational rows (Ratio column present, no badge).
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(12);
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent ?? "");
    expect(headers).toContain("Ratio");
    expect(el.querySelector(".scale-table__badge")).toBeNull();
  });

  it("a non-square comma set leaves the widget non-crashing: readout/status message present, prior rows survive", () => {
    const el = generateFokker(makeStubSynth());
    document.body.appendChild(el);
    const modeSelect = el.querySelector('select[name="fokker-mode"]') as HTMLSelectElement;
    modeSelect.value = "comma";
    modeSelect.dispatchEvent(new Event("change", { bubbles: true }));

    // Prior render (the default comma block) is present.
    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBe(12);

    // Remove one comma → a single comma over the (3,5) subspace is non-square.
    const firstRemove = el.querySelector(
      ".generate-fokker__chip .generate-fokker__chip-remove",
    ) as HTMLButtonElement;
    expect(firstRemove).not.toBeNull();
    firstRemove.click();

    // No crash; the readout shows a clear non-square message (no "12" cardinality)
    // OR the status region carries the message. The prior preview is preserved.
    const readout = el.querySelector(".generate-fokker__readout");
    const status = el.querySelector(".generate-fokker__status");
    const readoutText = readout?.textContent ?? "";
    const statusText = status?.textContent ?? "";
    // Some message surfaced about the degenerate set.
    expect((readoutText + statusText).length).toBeGreaterThan(0);
    // Prior preview survives (table not cleared).
    expect(el.querySelectorAll("tbody tr").length).toBe(rowsBefore);
  });

  it("exposes getScale() returning the current exact-rational Scale (12 intervals by default)", () => {
    const el = generateFokker(makeStubSynth());
    document.body.appendChild(el);
    const scale = (el as unknown as { getScale: () => unknown }).getScale();
    expect(scale).not.toBeNull();
    const intervals = (scale as { intervals: readonly unknown[] }).intervals;
    expect(intervals.length).toBe(12);
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once", () => {
    const synth = makeStubSynth();
    const el = generateFokker(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const freqs = synth.playArpeggio.mock.calls[0]![0] as number[];
    // Default block = 12 intervals.
    expect(freqs.length).toBe(12);
  });

  it("factory takes (synth, opts?) — no scale arg (the widget owns its scale)", () => {
    const synth = makeStubSynth();
    expect(generateFokker(synth)).toBeInstanceOf(HTMLElement);
    expect(generateFokker(synth, { baseHz: 256, precision: 2 })).toBeInstanceOf(HTMLElement);
  });
});
