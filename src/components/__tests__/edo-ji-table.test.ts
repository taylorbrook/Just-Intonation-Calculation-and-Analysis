// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { edoJiTable } from "../edo-ji-table.js";
import { makeStubSynth } from "./test-utils.js";
import { Fraction } from "fraction.js";

describe("edoJiTable factory", () => {
  it("returns an HTMLElement with class 'edo-ji-table' and h2 'JI in {N}-EDO'", () => {
    const el = edoJiTable(31, makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("edo-ji-table");
    expect(el.querySelector("h2")?.textContent).toBe("JI in 31-EDO");
  });

  it("default opts (12-EDO, prime, limit=7) renders 12 rows", () => {
    const el = edoJiTable(12, makeStubSynth());
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(12);
  });

  it("each row has 3 cells: Step | Cents | JI Approx", () => {
    const el = edoJiTable(12, makeStubSynth());
    const headers = el.querySelectorAll("thead th");
    expect(headers.length).toBe(3);
    const labels = Array.from(headers).map((th) => (th.textContent ?? "").trim());
    expect(labels[0]).toMatch(/Step/);
    expect(labels[1]).toMatch(/Cents/);
    expect(labels[2]).toMatch(/JI/);
    const firstRow = el.querySelector("tbody tr");
    expect(firstRow?.querySelectorAll("td").length).toBe(3);
  });

  it("opts { kind: 'prime', limit: 7 } at 31-EDO renders 31 rows", () => {
    const el = edoJiTable(31, makeStubSynth(), { kind: "prime", limit: 7 });
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(31);
  });

  it("opts { kind: 'odd', limit: 9 } at 12-EDO has every JI ratio's odd-limit ≤ 9", () => {
    const el = edoJiTable(12, makeStubSynth(), { kind: "odd", limit: 9 });
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(12);
    rows.forEach((row) => {
      const ratioText = row.querySelectorAll("td")[2]!.textContent ?? "";
      const f = new Fraction(ratioText);
      // strip factors of 2 from numerator and denominator → odd parts
      let n = f.n;
      while (n % 2n === 0n) n /= 2n;
      let d = f.d;
      while (d % 2n === 0n) d /= 2n;
      const oddPart = n > d ? n : d;
      expect(Number(oddPart)).toBeLessThanOrEqual(9);
    });
  });

  it("toggle (kind <select>) re-renders tbody when changed from 'prime' to 'odd'", () => {
    const el = edoJiTable(12, makeStubSynth(), { kind: "prime", limit: 7 });
    document.body.appendChild(el);
    const before = Array.from(el.querySelectorAll("tbody tr")).map(
      (r) => r.querySelectorAll("td")[2]!.textContent,
    );
    const kindSelect = el.querySelector('select[data-control="kind"]') as HTMLSelectElement;
    expect(kindSelect).not.toBeNull();
    kindSelect.value = "odd";
    kindSelect.dispatchEvent(new Event("change", { bubbles: true }));
    const after = Array.from(el.querySelectorAll("tbody tr")).map(
      (r) => r.querySelectorAll("td")[2]!.textContent,
    );
    // The tbody re-rendered with a non-empty result. (Row count may differ
    // between prime and odd branches: exact-fraction dedupe — 260616-bkm FIX #10
    // — collapses duplicate closest ratios, and the odd-7 branch at 12-EDO
    // produces one fewer distinct ratio than the prime-7 branch.)
    expect(after.length).toBeGreaterThan(0);
    // The content changed between prime-7 and odd-7 at 12-EDO.
    const anyDiff = before.length !== after.length || before.some((v, i) => v !== after[i]);
    expect(anyDiff).toBe(true);
  });

  it("clicking a row plays a dyad via synth.playNotes (D-07)", () => {
    const synth = makeStubSynth();
    const el = edoJiTable(12, synth, { kind: "prime", limit: 7, baseHz: 440 });
    document.body.appendChild(el);
    // Click the second row (skip step-0 unison which is 1/1).
    const rows = el.querySelectorAll("tbody tr");
    (rows[1] as HTMLElement).click();
    expect(synth.playNotes).toHaveBeenCalledTimes(1);
    const call = synth.playNotes.mock.calls[0]!;
    const freqs = call[0] as number[];
    expect(freqs.length).toBe(2);
    expect(freqs[0]).toBeCloseTo(440, 5);
  });

  it("limit input re-renders on change (within safe prime-limit envelope)", () => {
    // 5 → 11 stays inside xen-dev-utils' approximatePrimeLimit safe-integer
    // envelope at 12-EDO with maxExponent=5 (limit=13 throws "Numerator above
    // safe limit"; this is the documented kernel behavior, not a UI bug).
    const el = edoJiTable(12, makeStubSynth(), { kind: "prime", limit: 5 });
    document.body.appendChild(el);
    const before = Array.from(el.querySelectorAll("tbody tr")).map(
      (r) => r.querySelectorAll("td")[2]!.textContent,
    );
    const limitInput = el.querySelector('input[data-control="limit"]') as HTMLInputElement;
    expect(limitInput).not.toBeNull();
    limitInput.value = "11";
    limitInput.dispatchEvent(new Event("change", { bubbles: true }));
    const after = Array.from(el.querySelectorAll("tbody tr")).map(
      (r) => r.querySelectorAll("td")[2]!.textContent,
    );
    expect(after.length).toBe(before.length);
    const anyDiff = before.some((v, i) => v !== after[i]);
    expect(anyDiff).toBe(true);
  });

  it("kernel RangeError on out-of-envelope prime-limit surfaces via status region (no crash)", () => {
    // limit=13 at 12-EDO trips xen-dev-utils' safe-integer guard. The component
    // catches it, surfaces the message, and clears the table — does not throw.
    const el = edoJiTable(12, makeStubSynth(), { kind: "prime", limit: 5 });
    document.body.appendChild(el);
    const limitInput = el.querySelector('input[data-control="limit"]') as HTMLInputElement;
    limitInput.value = "13";
    limitInput.dispatchEvent(new Event("change", { bubbles: true }));
    const status = el.querySelector('[role="status"]');
    expect(status?.textContent ?? "").toMatch(/Could not compute|safe limit|13/);
  });

  it("opts { kind: 'odd', limit: 33 } does not throw — clamps to 31 and announces via status region", () => {
    expect(() => edoJiTable(12, makeStubSynth(), { kind: "odd", limit: 33 })).not.toThrow();
    const el = edoJiTable(12, makeStubSynth(), { kind: "odd", limit: 33 });
    const status = el.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.getAttribute("aria-live")).toBe("polite");
    // Clamp message visible in status region.
    expect(status?.textContent ?? "").toMatch(/31/);
    // And the table still rendered 12 rows (clamp succeeded, not crashed).
    expect(el.querySelectorAll("tbody tr").length).toBe(12);
  });

  it("factory takes (edoSteps, synth, opts?) — consistent with edoJitTable's (scale, synth, opts?)", () => {
    // Smoke check the parameter ordering by passing positional args.
    const synth = makeStubSynth();
    const el = edoJiTable(12, synth, { kind: "prime", limit: 7 });
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("edo-ji-table");
  });
});
