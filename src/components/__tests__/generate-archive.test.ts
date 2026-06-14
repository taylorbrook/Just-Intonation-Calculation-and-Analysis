// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { generateArchive } from "../generate-archive.js";
import type { GenerateArchiveElement } from "../generate-archive.js";
import type { ArchiveEntry } from "../../lib/scala-archive.js";
import { makeStubSynth } from "./test-utils.js";

/**
 * generate-archive.test.ts — the Scala-archive browser/search/audition widget
 * (LIB-01 + LIB-02, Plan 09-02). Mirrors generate-cs.test.ts: a stub synth,
 * generateArchive(stubSynth, { loadEntries }), query the returned element.
 *
 * The widget loads its entries via the D-B1 `loadEntries` async thunk (so it is
 * testable WITHOUT FileAttachment) and debounces the search ~150 ms (D-B2). The
 * tests await the load microtask, then flush the debounce with a short real delay.
 */

/** Two exact-JI fixtures + one tempered fixture (matching the build-time shape). */
const JI_PYTH: ArchiveEntry = {
  filename: "pyth7.scl",
  name: "Pythagorean diatonic",
  pitchCount: 7,
  tempered: false,
  degrees: ["9/8", "81/64", "4/3", "3/2", "27/16", "243/128", "2/1"],
};
const JI_FIVE_LIMIT: ArchiveEntry = {
  filename: "ptolemy.scl",
  name: "Ptolemy intense diatonic",
  pitchCount: 7,
  tempered: false,
  degrees: ["9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"],
};
const TEMPERED_12: ArchiveEntry = {
  filename: "edo12.scl",
  name: "12-tone equal temperament",
  pitchCount: 12,
  tempered: true,
  degrees: [
    "100.0000",
    "200.0000",
    "300.0000",
    "400.0000",
    "500.0000",
    "600.0000",
    "700.0000",
    "800.0000",
    "900.0000",
    "1000.0000",
    "1100.0000",
    "1200.0000",
  ],
};

const FIXTURES: ArchiveEntry[] = [JI_PYTH, JI_FIVE_LIMIT, TEMPERED_12];

/** Resolve the load microtask + flush the ~150 ms search debounce (real delay). */
async function settle(): Promise<void> {
  // Let the load Promise resolve (microtask) and any debounce timer fire.
  await new Promise((resolve) => setTimeout(resolve, 200));
}

function mount(entries: ArchiveEntry[] = FIXTURES): GenerateArchiveElement {
  const el = generateArchive(makeStubSynth(), {
    loadEntries: () => Promise.resolve(entries),
  });
  document.body.appendChild(el);
  return el;
}

describe("generateArchive factory", () => {
  it("returns an HTMLElement with class 'generate-archive' and a search input + status region", () => {
    const el = generateArchive(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("generate-archive");
    expect(el.querySelector('input[type="search"]')).not.toBeNull();
    expect(el.querySelector('[role="status"]')).not.toBeNull();
    expect(el.querySelector(".generate-archive__list")).not.toBeNull();
  });

  it("before any selection getScale() is null and isTempered() is false", () => {
    const el = generateArchive(makeStubSynth());
    expect(el.getScale()).toBeNull();
    expect(el.isTempered()).toBe(false);
  });

  // ─── Behavior 1: list renders one selectable row per entry after the load ───
  it("after the load settles renders one selectable row per entry with a 'showing X of Y' caption", async () => {
    const el = mount();
    await settle();
    const rows = el.querySelectorAll(".generate-archive__row");
    expect(rows.length).toBe(FIXTURES.length);
    // Each row is a selectable button.
    expect(el.querySelectorAll(".generate-archive__row-btn").length).toBe(FIXTURES.length);
    const caption = el.querySelector(".generate-archive__caption")?.textContent ?? "";
    expect(caption).toContain(`Showing ${String(FIXTURES.length)} of ${String(FIXTURES.length)}`);
  });

  // ─── Behavior 2: search narrows the list (debounced) ────────────────────────
  it("typing a matching term narrows the list to that entry; a non-matching term yields 0-of-Y", async () => {
    const el = mount();
    await settle();
    const search = el.querySelector('input[type="search"]') as HTMLInputElement;

    // A term matching only the Ptolemy entry.
    search.value = "Ptolemy";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    let rows = el.querySelectorAll(".generate-archive__row");
    expect(rows.length).toBe(1);
    expect(rows[0]?.textContent ?? "").toContain("Ptolemy");
    expect(el.querySelector(".generate-archive__caption")?.textContent ?? "").toContain(
      "Showing 1 of 1",
    );

    // A non-matching term → empty list + 0-of-0 caption.
    search.value = "zzz-no-such-scale";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    rows = el.querySelectorAll(".generate-archive__row");
    expect(rows.length).toBe(0);
    expect(el.querySelector(".generate-archive__caption")?.textContent ?? "").toContain(
      "Showing 0 of 0",
    );
  });

  // ─── Behavior 3: select a JI row → Ratio table, isTempered() false ──────────
  it("clicking a JI entry renders a 'Ratio' table (no tempered badge) and sets isTempered() false + getScale() non-null", async () => {
    const el = mount();
    await settle();
    // The Pythagorean fixture is the first row.
    const firstBtn = el.querySelector(".generate-archive__row-btn") as HTMLButtonElement;
    firstBtn.click();

    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent ?? "");
    expect(headers).toContain("Ratio");
    expect(el.querySelector(".scale-table__badge")).toBeNull();
    expect(el.isTempered()).toBe(false);

    const scale = el.getScale();
    expect(scale).not.toBeNull();
    // 7 degrees + the auto-prepended 1/1 unison = 8 rows.
    expect(el.querySelectorAll("tbody tr").length).toBe(8);
    expect(scale?.intervals.length).toBe(8);
    // The selected row carries the affordance marker.
    expect(firstBtn.getAttribute("aria-selected")).toBe("true");
  });

  // ─── Behavior 4: select the tempered row → cents table + badge, isTempered() true ─
  it("clicking the tempered entry renders the tempered (cents-only + badge) table and sets isTempered() true", async () => {
    const el = mount();
    await settle();
    // Find the tempered row by its marker text.
    const buttons = Array.from(
      el.querySelectorAll<HTMLButtonElement>(".generate-archive__row-btn"),
    );
    const temperedBtn = buttons.find((b) => (b.textContent ?? "").includes("tempered"));
    expect(temperedBtn).toBeDefined();
    temperedBtn!.click();

    // Tempered table: a visible "tempered" badge + a Cents header, NO Ratio column.
    expect(el.querySelector(".scale-table__badge")).not.toBeNull();
    const headers = Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent ?? "");
    expect(headers).toContain("Cents");
    expect(headers).not.toContain("Ratio");
    expect(el.isTempered()).toBe(true);
    expect(el.getScale()).not.toBeNull();
    // 12 cents degrees + the auto-prepended 1/1 = 13 rows.
    expect(el.querySelectorAll("tbody tr").length).toBe(13);
  });

  // ─── Audition: ⏵⏵ Play arpeggiates the selected scale ───────────────────────
  it("a ⏵⏵ Play button appears on selection and arpeggiates the selected scale (LIB-02)", async () => {
    const synth = makeStubSynth();
    const el = generateArchive(synth, { loadEntries: () => Promise.resolve(FIXTURES) });
    document.body.appendChild(el);
    await settle();
    (el.querySelector(".generate-archive__row-btn") as HTMLButtonElement).click();
    const playBtn = el.querySelector(".play-btn--scale") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    playBtn.click();
    expect(synth.playArpeggio).toHaveBeenCalledTimes(1);
    const freqs = synth.playArpeggio.mock.calls[0]![0] as number[];
    expect(freqs.length).toBe(8); // 7 + 1/1.
  });

  // ─── Lazy-load default: no loadEntries → empty list, no crash ───────────────
  it("with no loadEntries thunk the widget defaults to an empty list and does not crash", async () => {
    const el = generateArchive(makeStubSynth());
    document.body.appendChild(el);
    await settle();
    expect(el.querySelectorAll(".generate-archive__row").length).toBe(0);
    expect(el.getScale()).toBeNull();
  });
});
