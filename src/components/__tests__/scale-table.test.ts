// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { scaleTable } from "../scale-table.js";
import { Scale } from "../../lib/scale.js";
import { Interval } from "../../lib/interval.js";

/**
 * A small JI fixture: 1/1, 5/4, 3/2, 2/1 (octave period). The `tempered` variant
 * is driven by the OPTION FLAG, not the data — any Scale renders cents-only when
 * `{ tempered: true }` is passed (SURF-06).
 */
function jiFixture(): Scale {
  const intervals = [
    new Interval("1/1"),
    new Interval("5/4"),
    new Interval("3/2"),
    new Interval("2/1"),
  ];
  return new Scale(intervals, new Interval("2/1"));
}

describe("scaleTable — default (JI) path, anti-regression", () => {
  it("renders a thead with FOUR <th>: Degree | Ratio | Cents | ¢ from 12-TET", () => {
    const el = scaleTable(jiFixture(), 440);
    const headers = el.querySelectorAll("thead th");
    expect(headers.length).toBe(4);
    const labels = Array.from(headers).map((th) => (th.textContent ?? "").trim());
    expect(labels[0]).toBe("Degree");
    expect(labels[1]).toBe("Ratio");
    expect(labels[2]).toBe("Cents");
    expect(labels[3]).toBe("¢ from 12-TET");
  });

  it("renders no `.scale-table__badge` on the default path", () => {
    const el = scaleTable(jiFixture(), 440);
    expect(el.querySelector(".scale-table__badge")).toBeNull();
  });

  it("tbody rows have exactly FOUR <td>, with the ratio in column 2", () => {
    const el = scaleTable(jiFixture(), 440);
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(4);
    const firstRow = rows[0]!;
    const cells = firstRow.querySelectorAll("td");
    expect(cells.length).toBe(4);
    // Degree 1, ratio 1/1.
    expect(cells[0]!.textContent).toBe("1");
    expect(cells[1]!.textContent).toBe("1");
    const secondRow = rows[1]!;
    expect(secondRow.querySelectorAll("td")[1]!.textContent).toBe("5/4");
  });

  it("`{ tempered: false }` is identical to the default path (4 columns, no badge)", () => {
    const el = scaleTable(jiFixture(), 440, { tempered: false });
    expect(el.querySelectorAll("thead th").length).toBe(4);
    expect(el.querySelector(".scale-table__badge")).toBeNull();
    expect(el.querySelectorAll("tbody tr")[0]!.querySelectorAll("td").length).toBe(4);
  });
});

describe("scaleTable — tempered variant", () => {
  it("renders a thead with exactly THREE <th>: Degree | Cents | ¢ from 12-TET (no Ratio)", () => {
    const el = scaleTable(jiFixture(), 440, { tempered: true });
    const headers = el.querySelectorAll("thead th");
    expect(headers.length).toBe(3);
    const labels = Array.from(headers).map((th) => (th.textContent ?? "").trim());
    expect(labels[0]).toBe("Degree");
    expect(labels[1]).toBe("Cents");
    expect(labels[2]).toBe("¢ from 12-TET");
    // D-01: the Ratio column is structurally absent.
    expect(labels).not.toContain("Ratio");
  });

  it("tbody rows have exactly THREE <td> (ratio cell dropped, D-01)", () => {
    const el = scaleTable(jiFixture(), 440, { tempered: true });
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(4);
    rows.forEach((row) => {
      expect(row.querySelectorAll("td").length).toBe(3);
    });
    // First cell is still the degree.
    expect(rows[0]!.querySelectorAll("td")[0]!.textContent).toBe("1");
  });

  it("renders a `.scale-table__badge` whose textContent is 'tempered' (D-02)", () => {
    const el = scaleTable(jiFixture(), 440, { tempered: true });
    const badge = el.querySelector(".scale-table__badge");
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe("tempered");
    expect(badge!.tagName.toLowerCase()).toBe("span");
  });

  it("the badge is appended BEFORE the table element in the wrapper", () => {
    const el = scaleTable(jiFixture(), 440, { tempered: true });
    const children = Array.from(el.children);
    const badgeIndex = children.findIndex((c) => c.classList.contains("scale-table__badge"));
    const tableIndex = children.findIndex((c) => c.tagName.toLowerCase() === "table");
    expect(badgeIndex).toBeGreaterThanOrEqual(0);
    expect(tableIndex).toBeGreaterThanOrEqual(0);
    expect(badgeIndex).toBeLessThan(tableIndex);
  });

  it("tempered + copyButton still renders the copy button", () => {
    const el = scaleTable(jiFixture(), 440, { tempered: true, copyButton: true });
    const copyBtn = el.querySelector(".scale-table__copy");
    expect(copyBtn).not.toBeNull();
    expect(copyBtn!.textContent).toBe("Copy table");
  });
});
