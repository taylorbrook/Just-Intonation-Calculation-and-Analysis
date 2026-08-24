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
  it("renders a thead with FIVE <th>: Degree | Ratio | Cents | ¢ from 12-TET | Hz", () => {
    const el = scaleTable(jiFixture(), 440);
    const headers = el.querySelectorAll("thead th");
    expect(headers.length).toBe(5);
    const labels = Array.from(headers).map((th) => (th.textContent ?? "").trim());
    expect(labels[0]).toBe("Degree");
    expect(labels[1]).toBe("Ratio");
    expect(labels[2]).toBe("Cents");
    expect(labels[3]).toBe("¢ from 12-TET");
    expect(labels[4]).toBe("Hz");
  });

  it("renders no `.scale-table__badge` on the default path", () => {
    const el = scaleTable(jiFixture(), 440);
    expect(el.querySelector(".scale-table__badge")).toBeNull();
  });

  it("tbody rows have exactly FIVE <td>, with the ratio still in column 2", () => {
    const el = scaleTable(jiFixture(), 440);
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(4);
    const firstRow = rows[0]!;
    const cells = firstRow.querySelectorAll("td");
    expect(cells.length).toBe(5);
    // Degree 1, ratio 1/1.
    expect(cells[0]!.textContent).toBe("1");
    expect(cells[1]!.textContent).toBe("1");
    const secondRow = rows[1]!;
    expect(secondRow.querySelectorAll("td")[1]!.textContent).toBe("5/4");
  });

  it("the Hz column carries baseHz * the degree's ratio at 2 decimals", () => {
    const el = scaleTable(jiFixture(), 440);
    const rows = el.querySelectorAll("tbody tr");
    const hz = (row: number) => rows[row]!.querySelectorAll("td")[4]!.textContent;
    expect(hz(0)).toBe("440.00"); // 1/1
    expect(hz(1)).toBe("550.00"); // 5/4
    expect(hz(2)).toBe("660.00"); // 3/2
    expect(hz(3)).toBe("880.00"); // 2/1
  });

  it("`{ tempered: false }` is identical to the default path (5 columns, no badge)", () => {
    const el = scaleTable(jiFixture(), 440, { tempered: false });
    expect(el.querySelectorAll("thead th").length).toBe(5);
    expect(el.querySelector(".scale-table__badge")).toBeNull();
    expect(el.querySelectorAll("tbody tr")[0]!.querySelectorAll("td").length).toBe(5);
  });
});

describe("scaleTable — tempered variant", () => {
  it("renders a thead with exactly FOUR <th>: Degree | Cents | ¢ from 12-TET | Hz (no Ratio)", () => {
    const el = scaleTable(jiFixture(), 440, { tempered: true });
    const headers = el.querySelectorAll("thead th");
    expect(headers.length).toBe(4);
    const labels = Array.from(headers).map((th) => (th.textContent ?? "").trim());
    expect(labels[0]).toBe("Degree");
    expect(labels[1]).toBe("Cents");
    expect(labels[2]).toBe("¢ from 12-TET");
    expect(labels[3]).toBe("Hz");
    // D-01: the Ratio column is structurally absent.
    expect(labels).not.toContain("Ratio");
  });

  it("tbody rows have exactly FOUR <td> (ratio cell dropped, D-01) with Hz last", () => {
    const el = scaleTable(jiFixture(), 440, { tempered: true });
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(4);
    rows.forEach((row) => {
      expect(row.querySelectorAll("td").length).toBe(4);
    });
    // First cell is still the degree.
    expect(rows[0]!.querySelectorAll("td")[0]!.textContent).toBe("1");
    // Dropping the ratio COLUMN never drops the Hz VALUE.
    expect(rows[0]!.querySelectorAll("td")[3]!.textContent).toBe("440.00");
    expect(rows[1]!.querySelectorAll("td")[3]!.textContent).toBe("550.00");
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

describe("scaleTable — Hz column options + guards", () => {
  it("`{ hzPrecision: 0 }` renders whole Hz values", () => {
    const el = scaleTable(jiFixture(), 440, { hzPrecision: 0 });
    const rows = el.querySelectorAll("tbody tr");
    expect(rows[0]!.querySelectorAll("td")[4]!.textContent).toBe("440");
    expect(rows[1]!.querySelectorAll("td")[4]!.textContent).toBe("550");
  });

  it.each([0, -1, NaN])(
    "a non-finite or non-positive baseHz (%s) renders the dash placeholder, not a fake pitch",
    (badHz) => {
      const el = scaleTable(jiFixture(), badHz);
      expect(el.querySelectorAll("thead th").length).toBe(5);
      const rows = el.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        expect(cells.length).toBe(5);
        expect(cells[4]!.textContent).toBe("—");
      });
      // Every other cell is unchanged.
      expect(rows[1]!.querySelectorAll("td")[1]!.textContent).toBe("5/4");
    },
  );

  it.each([0, -1, NaN])(
    "the tempered variant also renders the dash placeholder for baseHz %s",
    (badHz) => {
      const el = scaleTable(jiFixture(), badHz, { tempered: true });
      expect(el.querySelectorAll("thead th").length).toBe(4);
      const rows = el.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        expect(cells.length).toBe(4);
        expect(cells[3]!.textContent).toBe("—");
      });
      expect(rows[0]!.querySelectorAll("td")[0]!.textContent).toBe("1");
    },
  );
});
