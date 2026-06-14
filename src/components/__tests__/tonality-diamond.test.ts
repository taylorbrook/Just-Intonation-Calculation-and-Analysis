// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { tonalityDiamond, renderDiamondSVG } from "../tonality-diamond.js";
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

describe("tonalityDiamond factory", () => {
  it("returns an HTMLElement with class 'tonality-diamond-widget' and h2 'Tonality diamond'", () => {
    const el = tonalityDiamond(seedScale(), makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.querySelector("h2")?.textContent).toBe("Tonality diamond");
  });

  it("renders SVG with class 'viz diamond'", () => {
    const el = tonalityDiamond(seedScale(), makeStubSynth());
    expect(el.querySelector("svg.viz.diamond")).not.toBeNull();
  });

  it("tempered (cents-based) scale shows the no-JI-diamond note instead of throwing", () => {
    // An EDO sent as cents: no JI factorization → would throw "Out of primes".
    const edo24 = new Scale(
      parseScala(
        Array.from({ length: 24 }, (_, i) => ((i + 1) * 50).toFixed(4)).join("\n"),
      ),
    );
    let el: HTMLElement | null = null;
    expect(() => {
      el = tonalityDiamond(edo24, makeStubSynth());
    }).not.toThrow();
    expect(el!.querySelector("svg.viz.diamond")).toBeNull();
    expect(el!.textContent).toContain("tempered");
  });

  it("renders a tooltip-bearing <title> on at least one cell", () => {
    const el = tonalityDiamond(seedScale(), makeStubSynth());
    const titles = el.querySelectorAll("svg.viz.diamond title");
    expect(titles.length).toBeGreaterThan(0);
    const titleText = (titles[0] as Element).textContent ?? "";
    expect(titleText).toMatch(/limit/);
  });

  it("clicking an in-scale cell calls synth.playNotes", () => {
    const synth = makeStubSynth();
    const el = tonalityDiamond(seedScale(), synth);
    document.body.appendChild(el);
    const cell = el.querySelector('.diamond-cell[role="button"]');
    expect(cell).not.toBeNull();
    (cell as HTMLElement).dispatchEvent(new Event("click", { bubbles: true }));
    expect(synth.playNotes).toHaveBeenCalled();
  });

  it("renders each non-diagonal cell at a unique SVG transform (CR-01 regression)", () => {
    const el = tonalityDiamond(seedScale(), makeStubSynth(), { oddLimit: 7 });
    // 16 cells expected at oddLimit=7 (4 odds × 4 odds): {1,3,5,7} × {1,3,5,7}.
    const cells = el.querySelectorAll("g.diamond-cell");
    expect(cells.length).toBe(16);

    const transformsByCell: { transform: string; isDiagonal: boolean }[] = [];
    cells.forEach((cell) => {
      const transform = cell.getAttribute("transform") ?? "";
      // Read the cell's ratio text (e.g. "1/1", "5/4") to detect diagonals.
      // Diagonal cells have i === j and therefore octave-reduce to 1/1.
      const ratioText = cell.querySelector("text.ratio")?.textContent ?? "";
      transformsByCell.push({ transform, isDiagonal: ratioText === "1/1" });
    });

    // Non-diagonal cells: every transform must be unique.
    // Pre-CR-01 fix this would FAIL — broken layout used reduced n/d for
    // rankOf lookup, collapsing cells like (i=3, j=5) [reduced 6/5] and
    // (i=1, j=7) [reduced 8/7] onto row=0 / col=0 because rankOf has no
    // entry for 6 or 8. At oddLimit=7 the broken layout produced ≤ 8 unique
    // non-diagonal positions for 12 non-diagonal cells.
    const nonDiagonal = transformsByCell.filter((c) => !c.isDiagonal);
    const nonDiagonalTransforms = nonDiagonal.map((c) => c.transform);
    const uniqueNonDiagonal = new Set(nonDiagonalTransforms);
    expect(uniqueNonDiagonal.size).toBe(nonDiagonal.length);
    expect(nonDiagonal.length).toBe(12); // 16 total - 4 diagonals

    // Diagonal cells (i === j): the rhombus geometry stacks them along the
    // vertical unison axis. row === col so x = (col-row)*STRIDE === 0 for
    // every diagonal cell. Each diagonal cell sits at a distinct y, so the
    // 4 diagonals share the x=0 axis but render at 4 distinct vertical
    // positions — the "diagonal stacks vertically" comment in
    // tonality-diamond.ts:156-158. Test the precise geometry: x === 0 for
    // all diagonals; transforms are distinct.
    const diagonal = transformsByCell.filter((c) => c.isDiagonal);
    expect(diagonal.length).toBe(4); // (1,1), (3,3), (5,5), (7,7)
    for (const cell of diagonal) {
      // Match `translate(<x>,<y>)` and assert x === 0.
      const match = /^translate\(([^,]+),/.exec(cell.transform);
      expect(match).not.toBeNull();
      const x = Number(match?.[1] ?? "NaN");
      expect(x).toBe(0);
    }
    // All 16 cells (diagonal + non-diagonal) must be at distinct positions —
    // the broken layout collapsed up to 7 cells onto a single (0, 0) apex.
    const allTransforms = new Set(transformsByCell.map((c) => c.transform));
    expect(allTransforms.size).toBe(16);
  });
});

describe("renderDiamondSVG", () => {
  it("without synth: every cell stays role='presentation' (legacy regression guard)", () => {
    const el = renderDiamondSVG(5);
    const cells = el.querySelectorAll(".diamond-cell");
    expect(cells.length).toBeGreaterThan(0);
    const buttons = el.querySelectorAll('.diamond-cell[role="button"]');
    expect(buttons.length).toBe(0);
    for (const cell of cells) {
      expect(cell.getAttribute("role")).toBe("presentation");
      expect(cell.getAttribute("tabindex")).toBeNull();
    }
  });

  it("with synth: every cell becomes role='button' with tabindex=0 and aria-label", () => {
    const synth = makeStubSynth();
    const el = renderDiamondSVG(5, { synth });
    const cells = el.querySelectorAll(".diamond-cell");
    const buttons = el.querySelectorAll('.diamond-cell[role="button"]');
    expect(cells.length).toBeGreaterThan(0);
    expect(buttons.length).toBe(cells.length);
    for (const cell of buttons) {
      expect(cell.getAttribute("tabindex")).toBe("0");
      // Fraction.toFraction() prints "1" for 1/1, "5/4" for 5/4, etc. — accept both shapes.
      expect(cell.getAttribute("aria-label")).toMatch(/^Play \d+(\/\d+)?$/);
    }
  });

  it("with synth: clicking a cell calls synth.playNotes with the dyad shape", () => {
    const synth = makeStubSynth();
    const el = renderDiamondSVG(5, { synth });
    document.body.appendChild(el);
    const cell = el.querySelector('.diamond-cell[role="button"]') as HTMLElement;
    expect(cell).not.toBeNull();
    cell.dispatchEvent(new Event("click", { bubbles: true }));
    expect(synth.playNotes).toHaveBeenCalledTimes(1);
    const args = synth.playNotes.mock.calls[0] as [number[], number];
    const freqs = args[0];
    expect(freqs.length).toBe(2); // [baseHz, baseHz × ratio] — D-07 dyad audition
    expect(freqs[0]).toBe(440); // default baseHz
    expect(args[1]).toBe(1.5); // default duration matches D-18
  });

  it("with synth: pressing Enter on a cell triggers audition", () => {
    const synth = makeStubSynth();
    const el = renderDiamondSVG(5, { synth });
    document.body.appendChild(el);
    const cell = el.querySelector('.diamond-cell[role="button"]') as HTMLElement;
    cell.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(synth.playNotes).toHaveBeenCalledTimes(1);
  });

  it("with synth + custom baseHz: dyad uses the supplied baseHz", () => {
    const synth = makeStubSynth();
    const el = renderDiamondSVG(5, { synth, baseHz: 261.625 });
    document.body.appendChild(el);
    const cell = el.querySelector('.diamond-cell[role="button"]') as HTMLElement;
    cell.dispatchEvent(new Event("click", { bubbles: true }));
    const args = synth.playNotes.mock.calls[0] as [number[], number];
    expect(args[0][0]).toBe(261.625);
  });
});
