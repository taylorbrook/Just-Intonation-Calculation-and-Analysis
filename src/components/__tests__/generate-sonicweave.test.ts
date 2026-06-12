// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateSonicweave } from "../generate-sonicweave.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-sonicweave.test.ts — free-text SonicWeave escape hatch (GEN-09, Plan 07-03).
 *
 * Mirrors generate-cps.test.ts: a stub synth, generateSonicweave(stubSynth), query
 * the returned element. Covers:
 *   - D-13 default landing: textarea pre-filled with cps([1,3,5,7], 2), evaluated
 *     once on construction → the Hexany (6 block notes + 1/1 = 7 rows) previews.
 *     isTempered() === false initially.
 *   - D-16 evaluate-on-click ONLY: editing the textarea does NOT re-evaluate;
 *     clicking Evaluate does.
 *   - D-15 malformed program: raw adapter error verbatim in [role="status"] AND
 *     prior tbody rows preserved.
 *   - D-16 multi-line programs accepted.
 *   - D-14/D-20 docs <a> with rel="noopener noreferrer".
 *   - Tempered program → isTempered() reflects result.tempered.
 *   - Play button (.play-btn--scale).
 */
describe("generateSonicweave factory", () => {
  it("returns an HTMLElement with class 'generate-sonicweave'", () => {
    const el = generateSonicweave(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-sonicweave");
  });

  it("exposes a <textarea> pre-filled with cps([1,3,5,7], 2) (D-13)", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    const textarea = el.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(textarea.value).toContain("cps([1,3,5,7]");
  });

  it("exposes an Evaluate button (type=button)", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    const evalBtn = el.querySelector('button[name="sonicweave-evaluate"]') as HTMLButtonElement;
    expect(evalBtn).not.toBeNull();
    expect(evalBtn.type).toBe("button");
  });

  it("default landing (D-13) previews the Hexany on first paint: 7 rows (6 block notes + 1/1)", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(7);
  });

  it("isTempered() is false initially (cps default is exact JI)", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(false);
  });

  it("evaluate-on-click ONLY (D-16): editing the textarea does NOT re-evaluate; clicking Evaluate does", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    const textarea = el.querySelector("textarea") as HTMLTextAreaElement;
    const evalBtn = el.querySelector('button[name="sonicweave-evaluate"]') as HTMLButtonElement;

    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBe(7);

    // Edit to a 5-note multi-line program; dispatching 'input' must NOT re-evaluate.
    textarea.value = "9/8\n5/4\n4/3\n3/2\n2/1";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.querySelectorAll("tbody tr").length).toBe(rowsBefore);

    // Clicking Evaluate updates the preview (5 ratios + 1/1 unison = 6 rows).
    evalBtn.click();
    expect(el.querySelectorAll("tbody tr").length).toBe(6);
  });

  it("a multi-line program (D-16) evaluates", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    const textarea = el.querySelector("textarea") as HTMLTextAreaElement;
    const evalBtn = el.querySelector('button[name="sonicweave-evaluate"]') as HTMLButtonElement;
    textarea.value = "9/8\n5/4\n4/3\n3/2\n5/3\n15/8\n2/1";
    evalBtn.click();
    // 7 ratios; the first is not 1/1 so the adapter prepends it → 8 rows.
    expect(el.querySelectorAll("tbody tr").length).toBe(8);
  });

  it("malformed program (D-15): raw error verbatim in [role=status], prior rows preserved", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    const textarea = el.querySelector("textarea") as HTMLTextAreaElement;
    const evalBtn = el.querySelector('button[name="sonicweave-evaluate"]') as HTMLButtonElement;

    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBe(7);

    textarea.value = "this is not valid @@@";
    evalBtn.click();

    const statusEl = el.querySelector('[role="status"]');
    expect(statusEl).not.toBeNull();
    expect((statusEl?.textContent ?? "").length).toBeGreaterThan(0);
    // Prior preview preserved (table NOT cleared).
    expect(el.querySelectorAll("tbody tr").length).toBe(rowsBefore);
  });

  it("a docs <a> with rel='noopener noreferrer' is present (D-14/D-20)", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    const links = Array.from(el.querySelectorAll("a")) as HTMLAnchorElement[];
    const docsLink = links.find((a) => a.rel.includes("noopener") && a.rel.includes("noreferrer"));
    expect(docsLink).not.toBeUndefined();
    expect(docsLink?.href ?? "").toMatch(/sonic-weave|sonicweave|xenharmonic/i);
  });

  it("a tempered program reflects isTempered() === true (cents-of-record)", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    const textarea = el.querySelector("textarea") as HTMLTextAreaElement;
    const evalBtn = el.querySelector('button[name="sonicweave-evaluate"]') as HTMLButtonElement;
    // A cents-literal program is tempered (non-fractional cents-of-record).
    textarea.value = "100.\n1200.";
    evalBtn.click();
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(true);
    // Tempered table shows the badge.
    expect(el.querySelector(".scale-table__badge")).not.toBeNull();
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once", () => {
    const synth = makeStubSynth();
    const el = generateSonicweave(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const freqs = synth.playArpeggio.mock.calls[0]![0] as number[];
    // Default Hexany = 7 intervals.
    expect(freqs.length).toBe(7);
  });

  it("exposes getScale() for Send-to serialization", () => {
    const el = generateSonicweave(makeStubSynth());
    document.body.appendChild(el);
    const scale = (el as unknown as { getScale: () => unknown }).getScale();
    expect(scale).not.toBeNull();
    const intervals = (scale as { intervals: readonly unknown[] }).intervals;
    expect(intervals.length).toBe(7);
  });

  it("factory takes (synth, opts?) — no scale arg", () => {
    const synth = makeStubSynth();
    expect(generateSonicweave(synth)).toBeInstanceOf(HTMLElement);
    expect(generateSonicweave(synth, { baseHz: 256, precision: 2 })).toBeInstanceOf(HTMLElement);
  });
});
