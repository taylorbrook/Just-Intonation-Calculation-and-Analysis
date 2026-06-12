// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateRank2 } from "../generate-rank2.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-rank2.test.ts — Rank-2 regular-temperament widget (GEN-06, Plan 07-02
 * D-01..D-04, D-17, D-18).
 *
 * Mirrors generate-ed.test.ts: a stub synth, generateRank2(stubSynth), query the
 * returned element. The load-bearing assertions are the CONDITIONAL tempered render —
 * the default lands on quarter-comma meantone (D-02), which is tempered (cents-only
 * table, NO "Ratio" header, ".scale-table__badge" reading "tempered", isTempered()
 * true). Selecting the Pythagorean (pure-ratio) preset flips to EXACT JI (Ratio
 * header restored, no badge, isTempered() false). The tuning select {pure | quarter-
 * comma | POTE | TE | CTE} re-renders tempered for POTE. Up/down counts drive the
 * scale cardinality (D-04). Out-of-range up/down → status message + prior preview
 * preserved (D-18 defense-in-depth).
 */
describe("generateRank2 factory", () => {
  it("returns an HTMLElement with class 'generate-rank2' and an h2", () => {
    const el = generateRank2(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-rank2");
    expect(el.querySelector("h2")).not.toBeNull();
  });

  it("default landing is quarter-comma meantone (D-02): 7 rows, tempered badge, NO 'Ratio' header, isTempered() true", () => {
    const el = generateRank2(makeStubSynth());
    document.body.appendChild(el);
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(7); // unison + 6 → up=5/down=1 quarter-comma diatonic = 7 degrees incl octave.
    const badge = el.querySelector(".scale-table__badge") as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe("tempered");
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).not.toContain("Ratio");
    expect(headers).toContain("Cents");
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(true);
  });

  it("exposes a preset <select> carrying the D-17 roster + Custom, defaulting to quarter-comma meantone", () => {
    const el = generateRank2(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="rank2-preset"]') as HTMLSelectElement;
    expect(preset).not.toBeNull();
    const values = Array.from(preset.options).map((o) => o.value);
    // At minimum: pythagorean, quarter-comma meantone, porcupine, + custom.
    expect(values).toContain("pythagorean");
    expect(values).toContain("meantone");
    expect(values).toContain("porcupine");
    expect(values).toContain("custom");
    expect(preset.value).toBe("meantone"); // D-02 default landing.
  });

  it("exposes a tuning <select> {pure | quarter-comma | POTE | TE | CTE}", () => {
    const el = generateRank2(makeStubSynth());
    document.body.appendChild(el);
    const tuning = el.querySelector('select[name="rank2-tuning"]') as HTMLSelectElement;
    expect(tuning).not.toBeNull();
    const values = Array.from(tuning.options).map((o) => o.value);
    expect(values).toEqual(["pure", "quarter-comma", "POTE", "TE", "CTE"]);
  });

  it("selecting the Pythagorean (pure-ratio) preset renders EXACT JI — Ratio header present, no badge, isTempered() false", () => {
    const el = generateRank2(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="rank2-preset"]') as HTMLSelectElement;
    preset.value = "pythagorean";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).toContain("Ratio"); // exact JI keeps the ratio column.
    expect(el.querySelector(".scale-table__badge")).toBeNull(); // no tempered badge.
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(false);
  });

  it("selecting POTE re-renders tempered (badge present, no Ratio header)", () => {
    const el = generateRank2(makeStubSynth());
    document.body.appendChild(el);
    // First go to a pure preset so we observe a real transition back to tempered.
    const preset = el.querySelector('select[name="rank2-preset"]') as HTMLSelectElement;
    preset.value = "pythagorean";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.querySelector(".scale-table__badge")).toBeNull();
    // Now select POTE tuning → tempered.
    const tuning = el.querySelector('select[name="rank2-tuning"]') as HTMLSelectElement;
    tuning.value = "POTE";
    tuning.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.querySelector(".scale-table__badge")?.textContent).toBe("tempered");
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).not.toContain("Ratio");
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(true);
  });

  it("up/down generator count inputs drive scale size (D-04): raising up from 5 to 6 adds a row", () => {
    const el = generateRank2(makeStubSynth());
    document.body.appendChild(el);
    const before = el.querySelectorAll("tbody tr").length;
    const up = el.querySelector('input[name="rank2-up"]') as HTMLInputElement;
    expect(up).not.toBeNull();
    expect(up.value).toBe("5"); // D-02 default.
    up.value = "6";
    up.dispatchEvent(new Event("input", { bubbles: true }));
    const after = el.querySelectorAll("tbody tr").length;
    expect(after).toBe(before + 1);
  });

  it("a down generator count input is present (default 1)", () => {
    const el = generateRank2(makeStubSynth());
    document.body.appendChild(el);
    const down = el.querySelector('input[name="rank2-down"]') as HTMLInputElement;
    expect(down).not.toBeNull();
    expect(down.value).toBe("1");
  });

  it("editing the generator field manually forces preset='custom' (D-03)", () => {
    const el = generateRank2(makeStubSynth());
    document.body.appendChild(el);
    const genN = el.querySelector('input[name="rank2-gen-n"]') as HTMLInputElement;
    expect(genN).not.toBeNull();
    genN.value = "5";
    genN.dispatchEvent(new Event("input", { bubbles: true }));
    const preset = el.querySelector('select[name="rank2-preset"]') as HTMLSelectElement;
    expect(preset.value).toBe("custom");
  });

  it("out-of-range up count (D-18 cap) → status region non-empty AND the prior table rows survive", () => {
    const el = generateRank2(makeStubSynth());
    document.body.appendChild(el);
    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBeGreaterThan(0);
    const up = el.querySelector('input[name="rank2-up"]') as HTMLInputElement;
    up.value = "9999"; // > the up cap → status message, no re-render.
    up.dispatchEvent(new Event("input", { bubbles: true }));
    const status = el.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent ?? "").not.toBe("");
    // Prior preview preserved (rows still present).
    expect(el.querySelectorAll("tbody tr").length).toBe(rowsBefore);
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once with freqs.length === intervals.length", () => {
    const synth = makeStubSynth();
    const el = generateRank2(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const freqs = synth.playArpeggio.mock.calls[0]![0] as number[];
    const rows = el.querySelectorAll("tbody tr").length;
    expect(freqs.length).toBe(rows);
  });

  it("exposes getScale() (non-null) and isTempered() (result-derived boolean, not a literal)", () => {
    const el = generateRank2(makeStubSynth()) as unknown as {
      getScale: () => unknown;
      isTempered: () => boolean;
    };
    document.body.appendChild(el as unknown as HTMLElement);
    expect(el.getScale()).not.toBeNull();
    // Default quarter-comma is tempered.
    expect(el.isTempered()).toBe(true);
    // A pure preset flips it to false — proving it is NOT hard-wired true.
    const root = el as unknown as HTMLElement;
    const preset = root.querySelector('select[name="rank2-preset"]') as HTMLSelectElement;
    preset.value = "pythagorean";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.isTempered()).toBe(false);
  });

  it("factory takes (synth, opts?) — no scale arg (the widget owns its scale)", () => {
    const synth = makeStubSynth();
    expect(generateRank2(synth)).toBeInstanceOf(HTMLElement);
    expect(generateRank2(synth, { baseHz: 256, precision: 2 })).toBeInstanceOf(HTMLElement);
  });
});
