// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { edoJitTable } from "../edo-jit-table.js";
import { Scale } from "../../lib/scale.js";
import { Interval } from "../../lib/interval.js";
import { parseScala } from "../../lib/scala.js";
import { makeStubSynth } from "./test-utils.js";

const seedScale = (): Scale =>
  new Scale([
    new Interval("9/8"),
    new Interval("5/4"),
    new Interval("21/16"),
    new Interval("3/2"),
    new Interval("27/16"),
    new Interval("7/4"),
    new Interval("2/1"),
  ]);

describe("edoJitTable factory", () => {
  it("returns an HTMLElement with class 'edo-jit-table' and an h2 'Best-fit EDOs'", () => {
    const el = edoJitTable(seedScale(), makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("edo-jit-table");
    expect(el.querySelector("h2")?.textContent).toBe("Best-fit EDOs");
  });

  it("default opts renders the EDO range 5..72 (68 rows)", () => {
    const el = edoJitTable(seedScale(), makeStubSynth());
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(68);
  });

  it("opts { range: { min: 5, max: 31 } } renders 27 rows", () => {
    const el = edoJitTable(seedScale(), makeStubSynth(), { range: { min: 5, max: 31 } });
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(27);
  });

  it("thead has exactly 4 <th> elements: EDO | Max ¢ err | RMS ¢ err | Tenney err", () => {
    const el = edoJitTable(seedScale(), makeStubSynth());
    const headers = el.querySelectorAll("thead th");
    expect(headers.length).toBe(4);
    const labels = Array.from(headers).map((th) => (th.textContent ?? "").trim());
    // Labels include sort-arrow text — match the leading metric label.
    expect(labels[0]).toMatch(/^EDO/);
    expect(labels[1]).toMatch(/^Max ¢ err/);
    expect(labels[2]).toMatch(/^RMS ¢ err/);
    expect(labels[3]).toMatch(/^Tenney err/);
  });

  it("clicking the 'Max ¢ err' header sorts rows ascending by that metric", () => {
    const el = edoJitTable(seedScale(), makeStubSynth(), { range: { min: 5, max: 31 } });
    document.body.appendChild(el);
    const headers = el.querySelectorAll("thead th");
    const maxHeader = headers[1] as HTMLElement;
    maxHeader.click();
    const cells = el.querySelectorAll("tbody tr");
    const v0 = parseFloat(cells[0]!.querySelectorAll("td")[1]!.textContent ?? "0");
    const v1 = parseFloat(cells[1]!.querySelectorAll("td")[1]!.textContent ?? "0");
    const v2 = parseFloat(cells[2]!.querySelectorAll("td")[1]!.textContent ?? "0");
    expect(v0).toBeLessThanOrEqual(v1);
    expect(v1).toBeLessThanOrEqual(v2);
  });

  it("clicking the same header twice toggles to descending", () => {
    const el = edoJitTable(seedScale(), makeStubSynth(), { range: { min: 5, max: 31 } });
    document.body.appendChild(el);
    const headers = el.querySelectorAll("thead th");
    const maxHeader = headers[1] as HTMLElement;
    maxHeader.click();
    maxHeader.click();
    const cells = el.querySelectorAll("tbody tr");
    const v0 = parseFloat(cells[0]!.querySelectorAll("td")[1]!.textContent ?? "0");
    const v2 = parseFloat(cells[2]!.querySelectorAll("td")[1]!.textContent ?? "0");
    expect(v0).toBeGreaterThanOrEqual(v2);
  });

  it("clicking a row triggers synth.playArpeggio with one freq per scale interval", () => {
    const synth = makeStubSynth();
    const el = edoJitTable(seedScale(), synth, { range: { min: 5, max: 12 }, baseHz: 440 });
    document.body.appendChild(el);
    const firstRow = el.querySelector("tbody tr");
    expect(firstRow).not.toBeNull();
    (firstRow as HTMLElement).click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const call = synth.playArpeggio.mock.calls[0]!;
    const freqs = call[0] as number[];
    expect(freqs).toHaveLength(seedScale().intervals.length);
  });

  it("row-click uses opts.baseHz ?? 440 to render the scale at the EDO's nearest steps", () => {
    const synth = makeStubSynth();
    const el = edoJitTable(seedScale(), synth, { range: { min: 5, max: 12 }, baseHz: 440 });
    document.body.appendChild(el);
    // Default sort is by edoSteps ascending → first tbody row is N=5.
    const firstRow = el.querySelector("tbody tr") as HTMLElement;
    firstRow.click();
    const call = synth.playArpeggio.mock.calls[0]!;
    const freqs = call[0] as number[];
    // First scale interval is 9/8 (~203.91¢). In 5edo (240¢/step), nearest = round(203.91/240) = 1.
    // freq[0] = 440 * 2^(1/5)
    expect(freqs[0]).toBeCloseTo(440 * Math.pow(2, 1 / 5), 2);
  });

  it("row-click uses opts.stepSec ?? 0.45 (matches playScale default)", () => {
    const synth = makeStubSynth();
    const el = edoJitTable(seedScale(), synth, { range: { min: 5, max: 12 } });
    document.body.appendChild(el);
    const firstRow = el.querySelector("tbody tr") as HTMLElement;
    firstRow.click();
    const call = synth.playArpeggio.mock.calls[0]!;
    expect(call[1]).toBe(0.45);
  });

  it("opts.stepSec override propagates to playArpeggio", () => {
    const synth = makeStubSynth();
    const el = edoJitTable(seedScale(), synth, { range: { min: 5, max: 12 }, stepSec: 0.2 });
    document.body.appendChild(el);
    const firstRow = el.querySelector("tbody tr") as HTMLElement;
    firstRow.click();
    const call = synth.playArpeggio.mock.calls[0]!;
    expect(call[1]).toBe(0.2);
  });

  it("tempered (cents-based) scale renders without throwing — Tenney cells show '—'", () => {
    // A 24-EDO scale sent as cents (Generate tempered Send-to): lossy float-derived
    // fractions → tenneyHeight(iv.monzo) would throw "Out of primes". The table must still
    // render (Max/RMS are meaningful); only the Tenney column degrades to "—".
    const edo24 = new Scale(
      parseScala(Array.from({ length: 24 }, (_, i) => ((i + 1) * 50).toFixed(4)).join("\n")),
    );
    let el: HTMLElement | null = null;
    expect(() => {
      el = edoJitTable(edo24, makeStubSynth(), { range: { min: 5, max: 12 } });
    }).not.toThrow();
    const bodyRows = el!.querySelectorAll("tbody tr");
    expect(bodyRows.length).toBe(8);
    // Every Tenney cell (4th column) reads "—"; Max/RMS cells stay numeric.
    for (const tr of bodyRows) {
      const cells = tr.querySelectorAll("td");
      expect(cells[3]?.textContent).toBe("—");
      expect(cells[1]?.textContent).not.toBe("—");
    }
  });
});
