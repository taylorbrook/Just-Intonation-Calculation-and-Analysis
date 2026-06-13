// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateMeru } from "../generate-meru.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-meru.test.ts — Wilson recurrence / metallic (Mt. Meru) widget
 * (GEN-10, Plan 08-03). Mirrors generate-cps.test.ts / generate-fokker.test.ts:
 * a stub synth, generateMeru(stubSynth), query the returned element.
 *
 * Covers:
 *   - D-12 default landing: Fibonacci/golden convergents as EXACT JI (Ratio
 *     header present, NO tempered badge), isTempered() === false, rows include
 *     3/2, 5/3, 8/5, 13/8.
 *   - D-09 metallic-limit readout: a tempered-flagged readout BESIDE the table
 *     shows the golden limit ≈ 833.1¢; the limit value is NOT a table row.
 *   - D-10 presets: a preset <select> offers ≥ golden/silver/bronze; selecting
 *     "silver" sets a=2,b=1 and updates the readout to ≈ 1525.9¢. Named presets
 *     carry a citation (A3 — the Vallotti discipline).
 *   - D-11 editable params: seed / coefficient / term-count integer fields exist
 *     and editing term-count re-renders the convergents.
 *   - D-11 caps surface gracefully: an over-cap term-count surfaces the meruScale
 *     RangeError in the status region WITHOUT crashing and preserves the prior
 *     preview.
 *   - getScale() returns the convergent Scale; a .play-btn--scale Play button.
 */
describe("generateMeru factory", () => {
  it("returns an HTMLElement with class 'generate-meru'", () => {
    const el = generateMeru(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-meru");
  });

  // ─── Test 1: default landing (D-12) — Fibonacci/golden, EXACT JI ────────────
  it("default landing (D-12) renders the Fibonacci/golden convergents as EXACT JI: Ratio header, NO tempered badge, isTempered() === false", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    // Exact-JI table: the "Ratio" header column is present.
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent ?? "");
    expect(headers).toContain("Ratio");
    // No tempered badge — convergents are exact rational JI.
    expect(el.querySelector(".scale-table__badge")).toBeNull();
    // isTempered() is false (convergents are exact JI; the limit is a separate readout).
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(false);
  });

  it("default landing includes the Fibonacci convergent rows 3/2, 5/3, 8/5, 13/8 (textContent)", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    const cellTexts = Array.from(el.querySelectorAll("tbody td")).map((td) => td.textContent ?? "");
    for (const ratio of ["3/2", "5/3", "8/5", "13/8"]) {
      expect(cellTexts).toContain(ratio);
    }
  });

  // ─── Test 2: metallic-limit readout (D-09) — tempered, never a degree ───────
  it("shows the golden metallic limit ≈ 833.1¢ in a readout BESIDE the table, flagged tempered", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    const readout = el.querySelector(".generate-meru__limit");
    expect(readout).not.toBeNull();
    const text = readout?.textContent ?? "";
    expect(text).toContain("833.1");
    // The readout is flagged/labelled tempered (D-09 — the limit is irrational).
    expect(text.toLowerCase()).toContain("tempered");
  });

  it("the metallic limit (833.1¢) is NEVER a table row — it is a readout only (D-09 / SURF-06)", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    // No table cell carries the limit cents value (the convergents converge TO it
    // but it is never admitted as a scale degree).
    const cellTexts = Array.from(el.querySelectorAll("tbody td")).map((td) => td.textContent ?? "");
    expect(cellTexts.some((t) => t.includes("833.1"))).toBe(false);
  });

  // ─── Test 3: presets (D-10) + citation (A3) ─────────────────────────────────
  it("exposes a preset <select> offering at least golden / silver / bronze (D-10)", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="meru-preset"]') as HTMLSelectElement;
    expect(preset).not.toBeNull();
    const values = Array.from(preset.options).map((o) => o.value);
    expect(values).toContain("golden");
    expect(values).toContain("silver");
    expect(values).toContain("bronze");
  });

  it("selecting 'silver' fills a=2, b=1 and updates the metallic-limit readout to ≈ 1525.9¢", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="meru-preset"]') as HTMLSelectElement;
    preset.value = "silver";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    // Coefficient fields reflect the silver mean a=2, b=1.
    const aInput = el.querySelector('input[name="meru-a"]') as HTMLInputElement;
    const bInput = el.querySelector('input[name="meru-b"]') as HTMLInputElement;
    expect(aInput.value).toBe("2");
    expect(bInput.value).toBe("1");
    // The metallic-limit readout updates to the silver limit ≈ 1525.9¢.
    const readout = el.querySelector(".generate-meru__limit");
    expect(readout?.textContent ?? "").toContain("1525.9");
  });

  it("each named metallic preset carries a citation (A3 — the Vallotti-precedent discipline)", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    // A citation surface is present for the named-seed presets (a cite element, a
    // title attribute, or a citation line referencing the source).
    const citation = el.querySelector(".generate-meru__citation");
    expect(citation).not.toBeNull();
    expect((citation?.textContent ?? "").length).toBeGreaterThan(0);
  });

  // ─── Test 4: editable params (D-11) ─────────────────────────────────────────
  it("exposes editable seed (x0,x1), coefficient (a,b) and term-count integer fields (D-11)", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    expect(el.querySelector('input[name="meru-a"]')).not.toBeNull();
    expect(el.querySelector('input[name="meru-b"]')).not.toBeNull();
    expect(el.querySelector('input[name="meru-x0"]')).not.toBeNull();
    expect(el.querySelector('input[name="meru-x1"]')).not.toBeNull();
    expect(el.querySelector('input[name="meru-terms"]')).not.toBeNull();
  });

  it("editing the term-count re-renders the convergents (more terms → more rows)", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    const rowsBefore = el.querySelectorAll("tbody tr").length;
    const termsInput = el.querySelector('input[name="meru-terms"]') as HTMLInputElement;
    termsInput.value = String(rowsBefore + 3);
    termsInput.dispatchEvent(new Event("input", { bubbles: true }));
    const rowsAfter = el.querySelectorAll("tbody tr").length;
    expect(rowsAfter).toBeGreaterThan(rowsBefore);
  });

  // ─── Test 5: caps surface gracefully (D-11 / D-16) ──────────────────────────
  it("an over-cap term-count surfaces the meruScale RangeError in the status region WITHOUT crashing and preserves the prior preview", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBeGreaterThan(0);

    // MAX_MERU_TERMS is 48; ask for far more. The input may clamp, so we force the
    // over-cap value past the field's max attribute and dispatch input directly.
    const termsInput = el.querySelector('input[name="meru-terms"]') as HTMLInputElement;
    termsInput.max = "100000";
    termsInput.value = "99999";
    termsInput.dispatchEvent(new Event("input", { bubbles: true }));

    // No crash; a status message surfaced and the prior preview survives.
    const status = el.querySelector(".generate-meru__status");
    expect((status?.textContent ?? "").length).toBeGreaterThan(0);
    expect(el.querySelectorAll("tbody tr").length).toBe(rowsBefore);
  });

  // ─── Test 6: getScale + Play ────────────────────────────────────────────────
  it("exposes getScale() returning the convergent Scale", () => {
    const el = generateMeru(makeStubSynth());
    document.body.appendChild(el);
    const scale = (el as unknown as { getScale: () => unknown }).getScale();
    expect(scale).not.toBeNull();
    const intervals = (scale as { intervals: readonly unknown[] }).intervals;
    // Default golden = 7 convergents (terms 7): 1/1, 2/1, 3/2, 5/3, 8/5, 13/8, 21/13.
    expect(intervals.length).toBe(7);
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once", () => {
    const synth = makeStubSynth();
    const el = generateMeru(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
  });

  it("factory takes (synth, opts?) — no scale arg (the widget owns its scale)", () => {
    const synth = makeStubSynth();
    expect(generateMeru(synth)).toBeInstanceOf(HTMLElement);
    expect(generateMeru(synth, { baseHz: 256, precision: 2 })).toBeInstanceOf(HTMLElement);
  });
});
