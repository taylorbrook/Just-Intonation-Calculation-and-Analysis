// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateEd } from "../generate-ed.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-ed.test.ts — Equal-division (EDO / ED-n / best-JI-in-EDO) widget
 * (GEN-05, SURF-06, Plan 06-07).
 *
 * Mirrors generate-harmonic.test.ts: a stub synth, generateEd(stubSynth), query
 * the returned element. The load-bearing assertion is the TEMPERED render — the
 * EDO default renders a cents-only table (NO "Ratio" column header, D-01) with a
 * ".scale-table__badge" reading "tempered" (D-02). ED-n exposes an editable equave
 * n/d field (D-06); best-JI-in-EDO reuses bestJiInEdo (D-05). All three render
 * tempered.
 */
describe("generateEd factory", () => {
  it("returns an HTMLElement with class 'generate-ed' and an h2", () => {
    const el = generateEd(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-ed");
    expect(el.querySelector("h2")).not.toBeNull();
  });

  it("exposes a sub-method <select> (edo / ed-n / best-ji) defaulting to edo", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ed-submethod"]') as HTMLSelectElement;
    expect(sub).not.toBeNull();
    const values = Array.from(sub.options).map((o) => o.value);
    expect(values).toEqual(["edo", "ed-n", "best-ji"]);
    expect(sub.value).toBe("edo");
  });

  it("EDO default shows a divisions input (default 12) and NO equave field", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const divisions = el.querySelector('input[name="ed-divisions"]') as HTMLInputElement;
    expect(divisions).not.toBeNull();
    expect(divisions.value).toBe("12"); // D-09 EDO default.
    // EDO fixes the equave at 2/1 — no equave field.
    expect(el.querySelector('input[name="ed-equave-n"]')).toBeNull();
    expect(el.querySelector('input[name="ed-equave-d"]')).toBeNull();
  });

  it("EDO default renders a TEMPERED table — badge 'tempered' present, NO 'Ratio' column header (D-01/D-02)", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const badge = el.querySelector(".scale-table__badge") as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe("tempered");
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).not.toContain("Ratio");
    expect(headers).toContain("Cents");
  });

  it("EDO 12 renders 13 rows and the cents column reads ≈ k*100", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(13); // k = 0..12.
    // Tempered table is Degree | Cents | ¢-from-12tet — cents is column index 1.
    const centsCells = Array.from(rows).map((r) =>
      parseFloat((r.querySelectorAll("td")[1] as HTMLElement).textContent ?? "NaN"),
    );
    expect(centsCells[0]).toBeCloseTo(0, 1);
    expect(centsCells[7]).toBeCloseTo(700, 1);
    expect(centsCells[12]).toBeCloseTo(1200, 1);
  });

  it("switching to ED-n shows a divisions input (default 13) + an editable equave n/d field (default 3/1, Bohlen-Pierce)", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ed-submethod"]') as HTMLSelectElement;
    sub.value = "ed-n";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const divisions = el.querySelector('input[name="ed-divisions"]') as HTMLInputElement;
    const equaveN = el.querySelector('input[name="ed-equave-n"]') as HTMLInputElement;
    const equaveD = el.querySelector('input[name="ed-equave-d"]') as HTMLInputElement;
    expect(divisions.value).toBe("13"); // D-09 ED-n default.
    expect(equaveN).not.toBeNull();
    expect(equaveD).not.toBeNull();
    expect(equaveN.value).toBe("3"); // Bohlen-Pierce tritave.
    expect(equaveD.value).toBe("1");
    // Still tempered (badge present).
    expect(el.querySelector(".scale-table__badge")?.textContent).toBe("tempered");
  });

  it("ED-n 13 over 3/1 renders 14 rows with the last cents ≈ tritave (1901.955¢)", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ed-submethod"]') as HTMLSelectElement;
    sub.value = "ed-n";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(14); // k = 0..13.
    const lastRow = rows[rows.length - 1]!;
    const lastCents = parseFloat(
      (lastRow.querySelectorAll("td")[1] as HTMLElement).textContent ?? "NaN",
    );
    // 3/1 = 1200 * log2(3) ≈ 1901.955¢.
    expect(lastCents).toBeCloseTo(1901.955, 0);
  });

  it("EDO does not show the equave field after switching back from ED-n", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ed-submethod"]') as HTMLSelectElement;
    sub.value = "ed-n";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.querySelector('input[name="ed-equave-n"]')).not.toBeNull();
    sub.value = "edo";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.querySelector('input[name="ed-equave-n"]')).toBeNull();
  });

  it("switching to best-JI-in-EDO shows divisions + limit + kind (prime/odd) inputs and renders tempered (D-05)", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ed-submethod"]') as HTMLSelectElement;
    sub.value = "best-ji";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const divisions = el.querySelector('input[name="ed-divisions"]') as HTMLInputElement;
    const limit = el.querySelector('input[name="ed-bestji-limit"]') as HTMLInputElement;
    const kind = el.querySelector('select[name="ed-bestji-kind"]') as HTMLSelectElement;
    expect(divisions.value).toBe("12"); // D-09 best-JI default.
    expect(limit.value).toBe("5"); // D-09 prime 5.
    expect(kind).not.toBeNull();
    expect(Array.from(kind.options).map((o) => o.value)).toEqual(["prime", "odd"]);
    expect(kind.value).toBe("prime");
    // D-05: best-JI-in-EDO is ALSO tempered output (cents-only + badge).
    expect(el.querySelector(".scale-table__badge")?.textContent).toBe("tempered");
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).not.toContain("Ratio");
  });

  it("best-JI-in-EDO 12 / prime 5 renders a 13-row tempered table", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ed-submethod"]') as HTMLSelectElement;
    sub.value = "best-ji";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(13); // bestJiInEdo(12, ...) → 13 intervals.
  });

  it("a kernel RangeError (divisions out of range) surfaces in the status region and preserves the prior render", () => {
    const el = generateEd(makeStubSynth());
    document.body.appendChild(el);
    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBe(13); // EDO 12 default.
    const divisions = el.querySelector('input[name="ed-divisions"]') as HTMLInputElement;
    divisions.value = "5000"; // > MAX_DIVISIONS (1000) → RangeError.
    divisions.dispatchEvent(new Event("input", { bubbles: true }));
    const status = el.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent ?? "").not.toBe("");
    expect(el.querySelectorAll("tbody tr").length).toBe(13);
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once", () => {
    const synth = makeStubSynth();
    const el = generateEd(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const freqs = synth.playArpeggio.mock.calls[0]![0] as number[];
    expect(freqs.length).toBe(13); // EDO 12 = 13 pitches.
  });

  it("exposes its current Scale via getScale() and marks itself tempered via isTempered() (Send-to → cents-per-line, D-03)", () => {
    const el = generateEd(makeStubSynth()) as unknown as {
      getScale: () => unknown;
      isTempered: () => boolean;
    };
    document.body.appendChild(el as unknown as HTMLElement);
    const scale = el.getScale();
    expect(scale).not.toBeNull();
    const intervals = (scale as { intervals: readonly unknown[] }).intervals;
    expect(intervals.length).toBe(13);
    expect(el.isTempered()).toBe(true);
  });

  it("factory takes (synth, opts?) — no scale arg (the widget owns its scale)", () => {
    const synth = makeStubSynth();
    expect(generateEd(synth)).toBeInstanceOf(HTMLElement);
    expect(generateEd(synth, { baseHz: 256, precision: 2 })).toBeInstanceOf(HTMLElement);
  });
});
