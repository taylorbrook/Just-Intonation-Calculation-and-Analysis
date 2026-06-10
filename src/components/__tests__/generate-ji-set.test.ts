// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateJiSet } from "../generate-ji-set.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-ji-set.test.ts — JI-set method widget (GEN-04, Plan 06-07).
 *
 * Mirrors generate-harmonic.test.ts: a stub synth, generateJiSet(stubSynth),
 * query the returned element. Covers the four EXACT-JI sub-methods (diamond /
 * odd-limit / prime-limit / Farey) swapped via a sub-method <select> (default
 * diamond), the single relabelled limit/order integer input, the D-09 default
 * renders, and the ⏵⏵ Play button. The table is the EXACT JI 4-column variant —
 * a Ratio column is present and NO tempered badge (these are exact JI sets, NOT
 * tempered; D-07 fixes the equave at 2/1, no equave input is surfaced).
 */
describe("generateJiSet factory", () => {
  it("returns an HTMLElement with class 'generate-ji-set' and an h2", () => {
    const el = generateJiSet(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-ji-set");
    expect(el.querySelector("h2")).not.toBeNull();
  });

  it("exposes a sub-method <select> (diamond / odd-limit / prime-limit / farey) defaulting to diamond", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ji-set-submethod"]') as HTMLSelectElement;
    expect(sub).not.toBeNull();
    const values = Array.from(sub.options).map((o) => o.value);
    expect(values).toEqual(["diamond", "odd-limit", "prime-limit", "farey"]);
    expect(sub.value).toBe("diamond");
  });

  it("shows a single limit/order integer input (default diamond odd-limit 9)", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    const limit = el.querySelector('input[name="ji-set-limit"]') as HTMLInputElement;
    expect(limit).not.toBeNull();
    expect(limit.type).toBe("number");
    expect(limit.value).toBe("9"); // D-09 diamond default.
  });

  it("surfaces NO equave field (D-07: JI families fixed at 2/1)", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    // No n/d equave ratio field on any JI sub-method.
    expect(el.querySelector('input[name="ji-set-equave-n"]')).toBeNull();
    expect(el.querySelector('input[name="ji-set-equave-d"]')).toBeNull();
  });

  it("default diamond (odd-limit 9) renders an EXACT JI 4-column table (Ratio column present, NO tempered badge)", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    // It is EXACT JI — there is a Ratio header column and NO tempered badge.
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).toContain("Ratio");
    expect(el.querySelector(".scale-table__badge")).toBeNull();
    // More than one row (a real scale renders).
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBeGreaterThan(1);
  });

  it("switching to Farey (order 8) re-renders with an exact-JI table", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ji-set-submethod"]') as HTMLSelectElement;
    sub.value = "farey";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const limit = el.querySelector('input[name="ji-set-limit"]') as HTMLInputElement;
    expect(limit.value).toBe("8"); // D-09 Farey order default.
    // fareyScale(8) = 22 ratios + 2/1 = 23 rows (still exact JI, Ratio column present).
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(23);
    expect(el.querySelector(".scale-table__badge")).toBeNull();
  });

  it("switching to odd-limit (default 9) re-renders (oddLimitSet(9) = 19 + 2/1 = 20 rows)", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ji-set-submethod"]') as HTMLSelectElement;
    sub.value = "odd-limit";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const limit = el.querySelector('input[name="ji-set-limit"]') as HTMLInputElement;
    expect(limit.value).toBe("9");
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(20);
  });

  it("switching to prime-limit (default 5) re-renders an exact-JI table", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ji-set-submethod"]') as HTMLSelectElement;
    sub.value = "prime-limit";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const limit = el.querySelector('input[name="ji-set-limit"]') as HTMLInputElement;
    expect(limit.value).toBe("5"); // D-09 prime-limit default.
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBeGreaterThan(1);
    expect(el.querySelector(".scale-table__badge")).toBeNull();
  });

  it("changing the limit/order input re-renders (diamond 7 → 13-member 7-limit diamond + 2/1 = 14 rows)", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    const limit = el.querySelector('input[name="ji-set-limit"]') as HTMLInputElement;
    limit.value = "7";
    limit.dispatchEvent(new Event("input", { bubbles: true }));
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(14); // diamondScale(7) = 13 ratios + 2/1.
  });

  it("the limit/order label updates per sub-method", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    const label = () =>
      el.querySelector(".generate-ji-set__field-label--limit")?.textContent ?? "";
    expect(label().toLowerCase()).toContain("diamond");
    const sub = el.querySelector('select[name="ji-set-submethod"]') as HTMLSelectElement;
    sub.value = "farey";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    expect(label().toLowerCase()).toContain("order");
    sub.value = "prime-limit";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    expect(label().toLowerCase()).toContain("prime");
  });

  it("a kernel RangeError (out-of-range limit) surfaces in the status region and preserves the prior render", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    const sub = el.querySelector('select[name="ji-set-submethod"]') as HTMLSelectElement;
    sub.value = "odd-limit";
    sub.dispatchEvent(new Event("change", { bubbles: true }));
    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBe(20);
    const limit = el.querySelector('input[name="ji-set-limit"]') as HTMLInputElement;
    limit.value = "99"; // > LIMIT_CAP (31) → RangeError.
    limit.dispatchEvent(new Event("input", { bubbles: true }));
    const status = el.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent ?? "").not.toBe("");
    // Prior render preserved (the mosBuilder idiom).
    expect(el.querySelectorAll("tbody tr").length).toBe(20);
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once", () => {
    const synth = makeStubSynth();
    const el = generateJiSet(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
  });

  it("exposes its current Scale via getScale() so the page can serialize it (Send-to)", () => {
    const el = generateJiSet(makeStubSynth());
    document.body.appendChild(el);
    const scale = (el as unknown as { getScale: () => unknown }).getScale();
    expect(scale).not.toBeNull();
    const intervals = (scale as { intervals: readonly unknown[] }).intervals;
    expect(intervals.length).toBeGreaterThan(1);
  });

  it("factory takes (synth, opts?) — no scale arg (the widget owns its scale)", () => {
    const synth = makeStubSynth();
    expect(generateJiSet(synth)).toBeInstanceOf(HTMLElement);
    expect(generateJiSet(synth, { baseHz: 256, precision: 2 })).toBeInstanceOf(HTMLElement);
  });
});
