// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateHarmonic } from "../generate-harmonic.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-harmonic.test.ts — Harmonic-family method widget (GEN-02, GEN-03, Plan 06-06).
 *
 * Mirrors mos-builder.test.ts + generate-cps.test.ts: a stub synth,
 * generateHarmonic(stubSynth), query the returned element. Covers the four
 * sub-methods (harmonic / subharmonic / ADO / isoharmonic) swapped via a
 * sub-method <select> (D-08 default = harmonic), the per-sub-method inputs
 * (segments → lo/hi + reduce; ADO → divisions + equave ratio field, NO reduce;
 * isoharmonic → start/diff/count + reduce), the D-09 default renders, the D-04
 * reduce-to-octave toggle, and the ⏵⏵ Play button.
 */
describe("generateHarmonic factory", () => {
  it("returns an HTMLElement with class 'generate-harmonic' and h2 'Harmonic & interval divisions'", () => {
    const el = generateHarmonic(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-harmonic");
    expect(el.querySelector("h2")?.textContent).toBe("Harmonic & interval divisions");
  });

  it("exposes a sub-method <select> (harmonic / subharmonic / ado / isoharmonic) defaulting to harmonic (D-08)", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="harmonic-submethod"]') as HTMLSelectElement;
    expect(sub).not.toBeNull();
    const values = Array.from(sub.options).map((o) => o.value);
    expect(values).toEqual(["harmonic", "subharmonic", "ado", "isoharmonic"]);
    expect(sub.value).toBe("harmonic");
  });

  it("harmonic sub-method shows lo + hi inputs and a reduce checkbox", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const lo = el.querySelector('input[name="harmonic-lo"]') as HTMLInputElement;
    const hi = el.querySelector('input[name="harmonic-hi"]') as HTMLInputElement;
    const reduce = el.querySelector('input[name="harmonic-reduce"]') as HTMLInputElement;
    expect(lo).not.toBeNull();
    expect(hi).not.toBeNull();
    expect(reduce).not.toBeNull();
    expect(lo.type).toBe("number");
    expect(hi.type).toBe("number");
    expect(reduce.type).toBe("checkbox");
    // D-04: literal overtone form is the default — reduce OFF.
    expect(reduce.checked).toBe(false);
  });

  it("default harmonic segment (D-09 lo=8 hi=16) renders a 9-row table (harmonics 8..16 incl. period)", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const lo = el.querySelector('input[name="harmonic-lo"]') as HTMLInputElement;
    const hi = el.querySelector('input[name="harmonic-hi"]') as HTMLInputElement;
    expect(lo.value).toBe("8");
    expect(hi.value).toBe("16");
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(9);
  });

  it("changing the harmonic hi re-renders (lo=8 hi=12 → 5 rows)", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const hi = el.querySelector('input[name="harmonic-hi"]') as HTMLInputElement;
    hi.value = "12";
    hi.dispatchEvent(new Event("input", { bubbles: true }));
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(5); // harmonics 8,9,10,11,12
  });

  it("toggling reduce on a wide harmonic segment (8..24) folds octave-equivalents (17 → 13 rows)", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const hi = el.querySelector('input[name="harmonic-hi"]') as HTMLInputElement;
    hi.value = "24";
    hi.dispatchEvent(new Event("input", { bubbles: true }));
    // Literal harmonics 8..24 = 17 intervals.
    expect(el.querySelectorAll("tbody tr").length).toBe(17);

    const reduce = el.querySelector('input[name="harmonic-reduce"]') as HTMLInputElement;
    reduce.checked = true;
    reduce.dispatchEvent(new Event("change", { bubbles: true }));
    // Folded into [1,2): distinct pitch classes 8..24 over 8, deduped + 2/1.
    // h/8 for h=8..15 are the 8 distinct sub-octave classes; 16/8=2/1 the period;
    // 17..24 fold onto 17/16..24/16 — distinct from the lower set. The folded set
    // is strictly smaller than the literal 17 (octave 16/8 and its equivalents
    // collapse). Assert a strict reduction.
    const reducedRows = el.querySelectorAll("tbody tr").length;
    expect(reducedRows).toBeLessThan(17);
    expect(reducedRows).toBe(13);
  });

  it("switching to ADO shows a divisions input + an equave ratio field (n/d) and NO reduce checkbox", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="harmonic-submethod"]') as HTMLSelectElement;
    sub.value = "ado";
    sub.dispatchEvent(new Event("change", { bubbles: true }));

    const divisions = el.querySelector('input[name="ado-divisions"]') as HTMLInputElement;
    const equaveN = el.querySelector('input[name="ado-equave-n"]') as HTMLInputElement;
    const equaveD = el.querySelector('input[name="ado-equave-d"]') as HTMLInputElement;
    expect(divisions).not.toBeNull();
    expect(equaveN).not.toBeNull();
    expect(equaveD).not.toBeNull();
    // D-04: ADO is intrinsically one equave — no reduce toggle.
    expect(el.querySelector('input[name="harmonic-reduce"]')).toBeNull();
    expect(el.querySelector('input[name="iso-reduce"]')).toBeNull();
  });

  it("ADO 6 over 2/1 renders the 7-row AFDO-6 table", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="harmonic-submethod"]') as HTMLSelectElement;
    sub.value = "ado";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const divisions = el.querySelector('input[name="ado-divisions"]') as HTMLInputElement;
    expect(divisions.value).toBe("6"); // D-09 default.
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(7); // k = 0..6.
  });

  it("switching to subharmonic shows lo + hi inputs + a reduce checkbox", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="harmonic-submethod"]') as HTMLSelectElement;
    sub.value = "subharmonic";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.querySelector('input[name="harmonic-lo"]')).not.toBeNull();
    expect(el.querySelector('input[name="harmonic-hi"]')).not.toBeNull();
    expect(el.querySelector('input[name="harmonic-reduce"]')).not.toBeNull();
    // Subharmonic 8..16 = 9 rows (the utonal mirror, same span).
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(9);
  });

  it("switching to isoharmonic shows start/diff/count inputs + a reduce checkbox", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="harmonic-submethod"]') as HTMLSelectElement;
    sub.value = "isoharmonic";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const start = el.querySelector('input[name="iso-start"]') as HTMLInputElement;
    const diff = el.querySelector('input[name="iso-diff"]') as HTMLInputElement;
    const count = el.querySelector('input[name="iso-count"]') as HTMLInputElement;
    const reduce = el.querySelector('input[name="iso-reduce"]') as HTMLInputElement;
    expect(start).not.toBeNull();
    expect(diff).not.toBeNull();
    expect(count).not.toBeNull();
    expect(reduce).not.toBeNull();
    expect(reduce.checked).toBe(false); // D-04 literal default.
  });

  it("default isoharmonic (D-09: 4:5:6:7 — start=4 diff=1 count=4) renders 4 rows", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="harmonic-submethod"]') as HTMLSelectElement;
    sub.value = "isoharmonic";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const start = el.querySelector('input[name="iso-start"]') as HTMLInputElement;
    const diff = el.querySelector('input[name="iso-diff"]') as HTMLInputElement;
    const count = el.querySelector('input[name="iso-count"]') as HTMLInputElement;
    expect(start.value).toBe("4");
    expect(diff.value).toBe("1");
    expect(count.value).toBe("4");
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(4); // 4/4, 5/4, 6/4, 7/4.
  });

  it("a kernel RangeError (hi <= lo) surfaces in the status region and preserves the prior render", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBe(9); // default harmonic 8..16.
    const hi = el.querySelector('input[name="harmonic-hi"]') as HTMLInputElement;
    hi.value = "4"; // hi < lo → RangeError.
    hi.dispatchEvent(new Event("input", { bubbles: true }));
    const status = el.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent ?? "").not.toBe("");
    // Prior render preserved (the mosBuilder idiom).
    expect(el.querySelectorAll("tbody tr").length).toBe(9);
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once", () => {
    const synth = makeStubSynth();
    const el = generateHarmonic(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const freqs = synth.playArpeggio.mock.calls[0]![0] as number[];
    // Default harmonic 8..16 = 9 intervals.
    expect(freqs.length).toBe(9);
  });

  it("exposes its current Scale via getScale() so the page can serialize it (Send-to)", () => {
    const el = generateHarmonic(makeStubSynth());
    document.body.appendChild(el);
    const scale = (el as unknown as { getScale: () => unknown }).getScale();
    expect(scale).not.toBeNull();
    const intervals = (scale as { intervals: readonly unknown[] }).intervals;
    expect(intervals.length).toBe(9); // default harmonic 8..16.
  });

  it("factory takes (synth, opts?) — no scale arg (the widget owns its scale)", () => {
    const synth = makeStubSynth();
    const el = generateHarmonic(synth);
    expect(el).toBeInstanceOf(HTMLElement);
    const el2 = generateHarmonic(synth, { baseHz: 256, precision: 2 });
    expect(el2).toBeInstanceOf(HTMLElement);
  });
});
