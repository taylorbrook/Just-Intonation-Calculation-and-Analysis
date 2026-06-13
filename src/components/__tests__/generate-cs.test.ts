// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateCs } from "../generate-cs.js";
import { isConstantStructure } from "../../lib/constant-structure.js";
import { scaleFromSonicWeave } from "../../lib/sonicweave.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-cs.test.ts — constant-structure (csgs) widget (GEN-10, Plan 08-03).
 *
 * The structural twin of generate-fokker (chips + an ordinal field, CS-status
 * readout instead of "→ N notes"). Mirrors generate-fokker.test.ts: a stub synth,
 * generateCs(stubSynth), query the returned element.
 *
 * THE CRITICAL CORRECTION (08-RESEARCH): the default is csgs([3/2], 3) — the
 * 7-note Pythagorean diatonic — NOT csgs([3/2], 7), which yields 41 notes and
 * fail-closes. The second field is labelled "ordinal", NOT "note count" / "size".
 */
describe("generateCs factory", () => {
  it("returns an HTMLElement with class 'generate-cs'", () => {
    const el = generateCs(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-cs");
  });

  // ─── Test 1: CORRECTED default landing — csgs([3/2], 3) → 7-note diatonic ───
  it("default landing is csgs([3/2], 3): 8 rows (7 Pythagorean diatonic + 1/1 unison), EXACT JI (Ratio header, no badge), isTempered() === false", () => {
    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    // 7 diatonic degrees + the auto-prepended 1/1 unison = 8 rows.
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(8);
    // Exact-JI table: the "Ratio" header column is present, no tempered badge.
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent ?? "");
    expect(headers).toContain("Ratio");
    expect(el.querySelector(".scale-table__badge")).toBeNull();
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(false);
  });

  it("the default generator chip is 3/2 and the default ordinal is 3 (NOT 7)", () => {
    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    const chips = el.querySelectorAll(".generate-cs__chip");
    expect(chips.length).toBe(1);
    expect((chips[0]?.textContent ?? "").includes("3/2")).toBe(true);
    const ordinal = el.querySelector('input[name="cs-ordinal"]') as HTMLInputElement;
    expect(ordinal).not.toBeNull();
    expect(ordinal.value).toBe("3");
  });

  // ─── Test 2: ordinal field labelling + helper note (D-13 + Correction) ──────
  it("the second field is labelled 'ordinal' (label + aria-label), never 'note count' / 'size', and has a low max (≤ 8)", () => {
    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    const ordinal = el.querySelector('input[name="cs-ordinal"]') as HTMLInputElement;
    expect(ordinal).not.toBeNull();
    expect((ordinal.getAttribute("aria-label") ?? "").toLowerCase()).toContain("ordinal");
    // The ordinal field's visible label contains "ordinal".
    const labelText = (el.querySelector(".generate-cs__params") ?? el).textContent ?? "";
    expect(labelText.toLowerCase()).toContain("ordinal");
    // The field never calls itself "note count" or "size".
    const allText = el.textContent ?? "";
    expect(allText.toLowerCase()).not.toContain("note count");
    // Low cap per the Correction (high ordinals overflow the adapter's safe-integer guard).
    expect(Number(ordinal.max)).toBeLessThanOrEqual(8);
  });

  it("a helper note explains the ordinal selects the Nth constant-structure scale by increasing size", () => {
    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    const helper = el.querySelector(".generate-cs__helper");
    expect(helper).not.toBeNull();
    const text = (helper?.textContent ?? "").toLowerCase();
    expect(text).toContain("ordinal");
    expect(text).toContain("increasing size");
  });

  // ─── Test 3: CS-status readout (D-14) ───────────────────────────────────────
  it("the CS-status readout shows '✓ constant structure' for the default csgs result (isConstantStructure on the returned scale)", () => {
    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    const readout = el.querySelector(".generate-cs__cs-status");
    expect(readout).not.toBeNull();
    const text = readout?.textContent ?? "";
    expect(text).toContain("✓");
    expect(text.toLowerCase()).toContain("constant structure");
  });

  it("the CS-status readout reflects the live isConstantStructure result of the rendered scale (parity with the kernel)", () => {
    // Ground-truth: the default csgs([3/2],3) scale IS constant structure.
    const truth = scaleFromSonicWeave("csgs([3/2], 3)");
    expect(truth.scale).not.toBeNull();
    expect(isConstantStructure(truth.scale!).cs).toBe(true);

    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    const text = el.querySelector(".generate-cs__cs-status")?.textContent ?? "";
    // The widget's readout agrees with the kernel: ✓ for a CS scale (no ✗).
    expect(text).toContain("✓");
    expect(text).not.toContain("✗");
  });

  // ─── Test 4: chips (D-13) — no raw SonicWeave exposed ───────────────────────
  it("generator chips use the chip idiom (Add/× + ratio validation, textContent labels); no free-text SonicWeave textarea", () => {
    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    const chipInput = el.querySelector('input[name="cs-gen-input"]') as HTMLInputElement;
    const addBtn = el.querySelector('button[name="cs-gen-add"]') as HTMLButtonElement;
    expect(chipInput).not.toBeNull();
    expect(addBtn).not.toBeNull();
    // No free-text textarea exposing raw SonicWeave (D-13).
    expect(el.querySelector("textarea")).toBeNull();
    // Invalid ratio is rejected — no chip added.
    const before = el.querySelectorAll(".generate-cs__chip").length;
    chipInput.value = "not-a-ratio";
    addBtn.click();
    expect(el.querySelectorAll(".generate-cs__chip").length).toBe(before);
  });

  it("removing the only generator chip surfaces a status message and does not crash", () => {
    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    const firstRemove = el.querySelector(
      ".generate-cs__chip .generate-cs__chip-remove",
    ) as HTMLButtonElement;
    firstRemove.click();
    // No generators → composeSource returns null with a status message; prior
    // preview is preserved (the default 8 rows survive).
    const status = el.querySelector(".generate-cs__status");
    expect((status?.textContent ?? "").length).toBeGreaterThan(0);
    expect(el.querySelectorAll("tbody tr").length).toBe(8);
  });

  // ─── Test 5: error handling (D-16) — adapter fail-close preserves preview ───
  it("an ordinal that overflows the adapter's safe-integer guard surfaces the error in the status region and PRESERVES the prior preview", () => {
    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBe(8);

    // Force a high ordinal past the field cap (csgs([3/2], 7) → 41 notes, several
    // throw "Denominator above safe limit" → the adapter fail-closes).
    const ordinal = el.querySelector('input[name="cs-ordinal"]') as HTMLInputElement;
    ordinal.max = "100";
    ordinal.value = "7";
    ordinal.dispatchEvent(new Event("input", { bubbles: true }));

    // The adapter error surfaces in the status region; the prior preview survives.
    const status = el.querySelector(".generate-cs__status");
    expect((status?.textContent ?? "").length).toBeGreaterThan(0);
    expect(el.querySelectorAll("tbody tr").length).toBe(rowsBefore);
  });

  // ─── Test 6: getScale + Play ────────────────────────────────────────────────
  it("exposes getScale() returning the CS Scale (8 intervals by default)", () => {
    const el = generateCs(makeStubSynth());
    document.body.appendChild(el);
    const scale = (el as unknown as { getScale: () => unknown }).getScale();
    expect(scale).not.toBeNull();
    const intervals = (scale as { intervals: readonly unknown[] }).intervals;
    expect(intervals.length).toBe(8);
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once", () => {
    const synth = makeStubSynth();
    const el = generateCs(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const freqs = synth.playArpeggio.mock.calls[0]![0] as number[];
    expect(freqs.length).toBe(8);
  });

  it("factory takes (synth, opts?) — no scale arg (the widget owns its scale)", () => {
    const synth = makeStubSynth();
    expect(generateCs(synth)).toBeInstanceOf(HTMLElement);
    expect(generateCs(synth, { baseHz: 256, precision: 2 })).toBeInstanceOf(HTMLElement);
  });
});
