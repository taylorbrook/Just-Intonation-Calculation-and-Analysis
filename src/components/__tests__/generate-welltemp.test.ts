// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateWelltemp } from "../generate-welltemp.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-welltemp.test.ts — Well-temperament widget (GEN-07, Plan 07-02,
 * Phase 7 D-05 / D-06 / D-07 / D-08).
 *
 * Mirrors generate-ed.test.ts. This widget is ALWAYS tempered (well-temperament is
 * cents-of-record): the default lands on Vallotti (D-06) — 12 rows, a ".scale-table__
 * badge" reading "tempered", NO "Ratio" header, isTempered() === true. The preset
 * roster (D-05/D-08) fills the per-fifth comma fractions; custom mode exposes the 11
 * raw per-fifth fraction fields. The composed source ALWAYS passes the explicit
 * Pythagorean comma 531441/524288 (D-07). Out-of-range input → status message + prior
 * preview preserved.
 *
 * NOTE on roster scope: the plan permits shipping a smaller VERIFIED roster over an
 * unverified guess (A1 sourcing). This build ships the two presets whose comma vectors
 * cross-check EXACTLY against the repo's own authoritative src/pages/well-temperament.md
 * (Vallotti + Werckmeister III) plus Custom; the remaining D-08 names are documented as
 * omitted in the SUMMARY (custom mode covers them).
 */
describe("generateWelltemp factory", () => {
  it("returns an HTMLElement with class 'generate-welltemp' and an h2", () => {
    const el = generateWelltemp(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-welltemp");
    expect(el.querySelector("h2")).not.toBeNull();
  });

  it("default landing is Vallotti (D-06): 13 rows, tempered badge, NO 'Ratio' header, isTempered() true", () => {
    const el = generateWelltemp(makeStubSynth());
    document.body.appendChild(el);
    const rows = el.querySelectorAll("tbody tr");
    // D-06 "12 notes" = 12 pitch classes; the adapter prepends the kernel-convention
    // unison (D-13) → 13 table rows (1/1 + 11 chromatic degrees + the 2/1 octave).
    expect(rows.length).toBe(13);
    const badge = el.querySelector(".scale-table__badge") as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe("tempered");
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).not.toContain("Ratio");
    expect(headers).toContain("Cents");
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(true);
  });

  it("exposes a preset <select> with the verified roster + Custom, default Vallotti", () => {
    const el = generateWelltemp(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="welltemp-preset"]') as HTMLSelectElement;
    expect(preset).not.toBeNull();
    const values = Array.from(preset.options).map((o) => o.value);
    expect(values).toContain("vallotti");
    expect(values).toContain("werckmeister3");
    expect(values).toContain("custom");
    expect(preset.value).toBe("vallotti"); // D-06 default landing.
  });

  it("Vallotti default degree cents match the canonical published scheme", () => {
    const el = generateWelltemp(makeStubSynth());
    document.body.appendChild(el);
    const rows = el.querySelectorAll("tbody tr");
    // Tempered table is Degree | Cents | ¢-from-12tet — cents is column index 1.
    const centsCells = Array.from(rows).map((r) =>
      parseFloat((r.querySelectorAll("td")[1] as HTMLElement).textContent ?? "NaN"),
    );
    // Row 0 is the prepended unison (0¢); rows 1-12 are the published Vallotti
    // degrees (C-based, matches src/pages/well-temperament.md).
    expect(centsCells[0]).toBeCloseTo(0, 0);
    const degreeCents = centsCells.slice(1);
    const expected = [
      90.2, 196.1, 294.1, 392.2, 498.0, 588.3, 698.0, 792.2, 894.1, 996.1, 1090.2, 1200.0,
    ];
    expect(degreeCents.length).toBe(expected.length);
    expected.forEach((c, i) => {
      expect(degreeCents[i]).toBeCloseTo(c, 0);
    });
  });

  it("selecting Werckmeister III re-renders 12 rows, still tempered", () => {
    const el = generateWelltemp(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="welltemp-preset"]') as HTMLSelectElement;
    preset.value = "werckmeister3";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.querySelectorAll("tbody tr").length).toBe(13);
    expect(el.querySelector(".scale-table__badge")?.textContent).toBe("tempered");
    expect((el as unknown as { isTempered: () => boolean }).isTempered()).toBe(true);
  });

  it("custom mode exposes the 11 per-fifth fraction fields; preset mode hides them", () => {
    const el = generateWelltemp(makeStubSynth());
    document.body.appendChild(el);
    // Preset (Vallotti) mode → no raw fraction fields.
    expect(el.querySelector('input[name="welltemp-fifth-0-n"]')).toBeNull();
    const preset = el.querySelector('select[name="welltemp-preset"]') as HTMLSelectElement;
    preset.value = "custom";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    // Custom mode → 11 per-fifth fraction fields (n/d each).
    for (let i = 0; i < 11; i++) {
      expect(el.querySelector(`input[name="welltemp-fifth-${String(i)}-n"]`)).not.toBeNull();
      expect(el.querySelector(`input[name="welltemp-fifth-${String(i)}-d"]`)).not.toBeNull();
    }
  });

  it("editing a custom per-fifth fraction forces preset='custom' and re-renders 12 tempered rows", () => {
    const el = generateWelltemp(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="welltemp-preset"]') as HTMLSelectElement;
    preset.value = "custom";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    const f0n = el.querySelector('input[name="welltemp-fifth-0-n"]') as HTMLInputElement;
    f0n.value = "-1";
    f0n.dispatchEvent(new Event("input", { bubbles: true }));
    expect(preset.value).toBe("custom");
    expect(el.querySelectorAll("tbody tr").length).toBe(13);
    expect(el.querySelector(".scale-table__badge")?.textContent).toBe("tempered");
  });

  it("a malformed custom fraction (zero denominator) → status non-empty, prior table preserved", () => {
    const el = generateWelltemp(makeStubSynth());
    document.body.appendChild(el);
    const preset = el.querySelector('select[name="welltemp-preset"]') as HTMLSelectElement;
    preset.value = "custom";
    preset.dispatchEvent(new Event("change", { bubbles: true }));
    const rowsBefore = el.querySelectorAll("tbody tr").length;
    expect(rowsBefore).toBe(13);
    const f0d = el.querySelector('input[name="welltemp-fifth-0-d"]') as HTMLInputElement;
    f0d.value = "0"; // zero denominator → adapter error.
    f0d.dispatchEvent(new Event("input", { bubbles: true }));
    const status = el.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent ?? "").not.toBe("");
    expect(el.querySelectorAll("tbody tr").length).toBe(rowsBefore);
  });

  it("a ⏵⏵ Play button is present and arpeggiates the current scale once (freqs.length === rows)", () => {
    const synth = makeStubSynth();
    const el = generateWelltemp(synth);
    document.body.appendChild(el);
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const freqs = synth.playArpeggio.mock.calls[0]![0] as number[];
    expect(freqs.length).toBe(el.querySelectorAll("tbody tr").length);
  });

  it("exposes getScale() (non-null) and isTempered() === true (well-temperament is cents-of-record)", () => {
    const el = generateWelltemp(makeStubSynth()) as unknown as {
      getScale: () => unknown;
      isTempered: () => boolean;
    };
    document.body.appendChild(el as unknown as HTMLElement);
    expect(el.getScale()).not.toBeNull();
    expect(el.isTempered()).toBe(true);
  });

  it("factory takes (synth, opts?) — no scale arg (the widget owns its scale)", () => {
    const synth = makeStubSynth();
    expect(generateWelltemp(synth)).toBeInstanceOf(HTMLElement);
    expect(generateWelltemp(synth, { baseHz: 256, precision: 2 })).toBeInstanceOf(HTMLElement);
  });
});
