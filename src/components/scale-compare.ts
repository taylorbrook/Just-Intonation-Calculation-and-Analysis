/**
 * scaleCompare — A vs B side-by-side comparison (ANAL-03 / Phase 4 D-21..D-24, D-27, D-30, D-32, D-33).
 *
 * Two scales fixed (D-21). Scale A is provided by the caller (dashboard textarea
 * or analysis-page textarea). Scale B has three input sources (D-22):
 *   - "Preset" dropdown of 6 built-in scales (D-27): 12tet, 19edo, 31edo,
 *     pythagorean-7, 5-limit-7, bohlen-pierce-9.
 *   - "Paste" textarea — flows through parseScala (Phase 2 body parser).
 *   - "Import .scl" file picker — flows through parseScl (Phase 2 inherits
 *     BOM strip + 1MB cap + period-by-`.` cents detection).
 *
 * Alignment (D-23): each A degree matches its NEAREST-cents B degree.
 *   - When sizes differ (A has 7, B has 12), some B degrees match multiple A
 *     degrees; some unmatched. Index-pairing is musically meaningless across
 *     different sizes (Pitfall: comparing degree[i] in 7-tone vs degree[i] in
 *     12-tone is not a comparison) — not offered.
 *
 * Output:
 *   - Table: A.degree | A.ratio | A.cents | B.match.cents | B.match.ratio | |Δ¢|.
 *   - Summary stats: max-deviation, RMS deviation, common-subset count.
 *   - Observable Plot lollipop on shared 0-1200¢ axis (Plot.ruleY for the stem,
 *     Plot.dot for the head; A and B in two colors per D-33).
 *   - Per-row audition button: plays A then B sequentially (D-30 default;
 *     simultaneous available as a toggle if added later).
 *
 * Common-subset (D-32 / Pitfall #1 / Pitfall #6): exact BigInt Fraction equality
 * via Interval.equals. NEVER cents-tolerance — would conflate distinct intervals
 * (e.g. syntonic 21.5¢ vs schisma 1.95¢).
 *
 * Pattern 2 factory: (scaleA, synth, opts?) => HTMLElement.
 * Defense-in-depth: every dynamic cell value via createElement + textContent.
 * Status region announces parse errors and import results in plain text.
 */
import { Interval } from "../lib/interval.js";
import { Scale } from "../lib/scale.js";
import { parseScala, parseScl } from "../lib/scala.js";
import type { SynthHandle } from "../audio/synth.js";
import * as Plot from "npm:@observablehq/plot";

export interface ScaleCompareOpts {
  /** D-08 default 440. */
  baseHz?: number;
  /** Cents decimal places, default 1 (Pitfall #16). */
  precision?: number;
  /** Default preset key on first render. */
  defaultPreset?: keyof typeof BUILTIN_B_SCALES;
  /** D-30: sequential A→B with brief gap (default) vs simultaneous. */
  auditionMode?: "sequential" | "simultaneous";
  /** Gap between A and B notes in sequential mode. Default 600ms. */
  auditionGapMs?: number;
}

/**
 * Build an EDO scale of N steps as Intervals (cents-derived; Pitfall #1 acknowledges
 * the float→Fraction conversion is lossy for EDOs — the underlying Fraction is the
 * "best rational approximation" of the float). Common-subset detection between an
 * EDO and a JI scale will rarely match exactly (and that's musically correct:
 * 12-EDO's "4/3" is 500¢ exactly, not the 498.045¢ of 4/3).
 */
function edoScale(N: number): Scale {
  const intervals: Interval[] = [];
  for (let step = 1; step <= N; step++) {
    const cents = (1200 / N) * step;
    intervals.push(new Interval(2 ** (cents / 1200)));
  }
  return new Scale(intervals, new Interval("2/1"));
}

/**
 * D-27 built-in B-source dropdown contents. Six entries — exact list from
 * 04-CONTEXT.md lines 207-212. Bohlen-Pierce uses the published Lambda mode
 * (Mathews/Pierce/Wilson 1988): step-by-step scale degrees in the [3/1] period
 * are 27/25, 25/21, 9/7, 7/5, 75/49, 5/3, 9/5, 15/7, 3/1.
 */
export const BUILTIN_B_SCALES: Record<string, () => Scale> = {
  "12tet": () => edoScale(12),
  "19edo": () => edoScale(19),
  "31edo": () => edoScale(31),
  "pythagorean-7": () =>
    new Scale(
      [
        new Interval("9/8"),
        new Interval("81/64"),
        new Interval("4/3"),
        new Interval("3/2"),
        new Interval("27/16"),
        new Interval("243/128"),
        new Interval("2/1"),
      ],
      new Interval("2/1"),
    ),
  "5-limit-7": () =>
    new Scale(
      [
        new Interval("9/8"),
        new Interval("5/4"),
        new Interval("4/3"),
        new Interval("3/2"),
        new Interval("5/3"),
        new Interval("15/8"),
        new Interval("2/1"),
      ],
      new Interval("2/1"),
    ),
  "bohlen-pierce-9": () =>
    new Scale(
      [
        new Interval("27/25"),
        new Interval("25/21"),
        new Interval("9/7"),
        new Interval("7/5"),
        new Interval("75/49"),
        new Interval("5/3"),
        new Interval("9/5"),
        new Interval("15/7"),
        new Interval("3/1"),
      ],
      new Interval("3/1"),
    ),
};

interface AlignedRow {
  aDegree: number;
  aInterval: Interval;
  bMatch: Interval | null; // nullable when B is empty
  centsDelta: number | null; // |a.cents - bMatch.cents|; null when bMatch is null
  exactMatch: boolean; // BigInt equality via Interval.equals
}

/**
 * Cents-position alignment (D-23). For each A degree, find the nearest-cents B
 * degree. Some B degrees may be re-used; some may be unmatched. Index-pairing
 * is NOT used (musically meaningless across different sizes).
 */
function align(a: Scale, b: Scale): AlignedRow[] {
  return a.intervals.map((aIv, i) => {
    if (b.intervals.length === 0) {
      return {
        aDegree: i + 1,
        aInterval: aIv,
        bMatch: null,
        centsDelta: null,
        exactMatch: false,
      };
    }
    let best = b.intervals[0]!;
    let bestDist = Math.abs(aIv.cents - best.cents);
    for (let j = 1; j < b.intervals.length; j++) {
      const cur = b.intervals[j]!;
      const d = Math.abs(aIv.cents - cur.cents);
      if (d < bestDist) {
        best = cur;
        bestDist = d;
      }
    }
    return {
      aDegree: i + 1,
      aInterval: aIv,
      bMatch: best,
      centsDelta: bestDist,
      exactMatch: aIv.equals(best), // BigInt — D-32, Pitfall #1
    };
  });
}

/**
 * Per-instance cleanup registry. Page cells call `disposeScaleCompare(el)` in
 * their `invalidation.then(...)` block to drop pending audition setTimeouts and
 * remove the local Esc listener. Phase 3 CR-02 discipline (D-15/D-16/D-34).
 */
const SCALE_COMPARE_CLEANUPS = new WeakMap<HTMLElement, () => void>();

export function disposeScaleCompare(el: HTMLElement): void {
  const fn = SCALE_COMPARE_CLEANUPS.get(el);
  if (fn) {
    fn();
    SCALE_COMPARE_CLEANUPS.delete(el);
  }
}

export function scaleCompare(scaleA: Scale, synth: SynthHandle, opts: ScaleCompareOpts = {}): HTMLElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;
  const auditionMode = opts.auditionMode ?? "sequential";
  const auditionGapMs = opts.auditionGapMs ?? 600;
  const defaultPreset: keyof typeof BUILTIN_B_SCALES = opts.defaultPreset ?? "12tet";

  // ─── Closure-local state ───────────────────────────────────────────────
  // CR-02 discipline (D-15/D-16/D-34): every pending B-note setTimeout lives
  // here so panic-clear (Esc) and component teardown can drop them.
  const auditionTimers = new Set<ReturnType<typeof setTimeout>>();
  let scaleB: Scale = BUILTIN_B_SCALES[defaultPreset]!();

  function clearPendingAuditions(): void {
    for (const t of auditionTimers) clearTimeout(t);
    auditionTimers.clear();
  }

  // ─── Root + heading ───────────────────────────────────────────────────
  const root = document.createElement("section");
  root.className = "scale-compare";

  const heading = document.createElement("h2");
  heading.textContent = "Compare scales";
  root.appendChild(heading);

  // ─── B-source mode switcher ───────────────────────────────────────────
  const sourceRow = document.createElement("div");
  sourceRow.className = "scale-compare__b-source";

  const modeLabel = document.createElement("label");
  modeLabel.textContent = "Scale B source";
  const modeSelect = document.createElement("select");
  modeSelect.className = "scale-compare__b-source-mode";
  for (const m of ["Preset", "Paste", "Import .scl"]) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    modeSelect.appendChild(opt);
  }
  modeLabel.appendChild(modeSelect);
  sourceRow.appendChild(modeLabel);

  // Preset dropdown (D-27 — visible by default).
  const presetSelect = document.createElement("select");
  presetSelect.className = "scale-compare__preset";
  for (const key of Object.keys(BUILTIN_B_SCALES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key;
    if (key === defaultPreset) opt.selected = true;
    presetSelect.appendChild(opt);
  }
  sourceRow.appendChild(presetSelect);

  root.appendChild(sourceRow);

  // ─── Mode-specific inputs (paste textarea + .scl picker) ───────────────
  const inputRow = document.createElement("div");
  inputRow.className = "scale-compare__b-input";

  // Paste textarea
  const pasteWrap = document.createElement("div");
  pasteWrap.className = "scale-compare__paste";
  pasteWrap.style.display = "none";
  const pasteTextarea = document.createElement("textarea");
  pasteTextarea.placeholder =
    "Paste pitch lines: ratios (5/4) or cents (408.0). One per line.";
  pasteWrap.appendChild(pasteTextarea);
  inputRow.appendChild(pasteWrap);

  // .scl import — hidden file input + styled button.
  const importWrap = document.createElement("div");
  importWrap.className = "scale-compare__import";
  importWrap.style.display = "none";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".scl,text/plain";
  fileInput.style.display = "none";
  const importBtn = document.createElement("button");
  importBtn.type = "button";
  importBtn.className = "scale-compare__import-btn";
  importBtn.textContent = "Import .scl…";
  importBtn.addEventListener("click", () => fileInput.click());
  importWrap.appendChild(importBtn);
  importWrap.appendChild(fileInput);
  inputRow.appendChild(importWrap);

  root.appendChild(inputRow);

  // ─── Plot host ────────────────────────────────────────────────────────
  const plotHost = document.createElement("div");
  plotHost.className = "scale-compare__plot";
  root.appendChild(plotHost);

  // ─── Alignment table ─────────────────────────────────────────────────
  const tableWrap = document.createElement("div");
  tableWrap.className = "scale-compare__table-wrap";
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  // Static header — innerHTML safe (no interpolated values).
  thead.innerHTML =
    "<tr><th>A°</th><th>A ratio</th><th>A ¢</th><th>B ¢</th><th>B ratio</th><th>|Δ¢|</th><th>Audition</th></tr>";
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  root.appendChild(tableWrap);

  // ─── Summary + status ─────────────────────────────────────────────────
  const summary = document.createElement("div");
  summary.className = "scale-compare__summary";
  root.appendChild(summary);

  // Status region — matches the sclIo pattern: role="status" aria-live="polite"
  // (T-04-26/27 textContent-only error surface — never innerHTML).
  const status = document.createElement("div");
  status.className = "scale-compare__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Render pipeline ──────────────────────────────────────────────────
  function renderTable(rows: AlignedRow[]): void {
    // Replace tbody children atomically — textContent for every dynamic cell.
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      if (row.exactMatch) tr.classList.add("scale-compare__row--match");

      const cells: string[] = [
        String(row.aDegree),
        row.aInterval.fraction.toFraction(),
        row.aInterval.cents.toFixed(precision),
        row.bMatch ? row.bMatch.cents.toFixed(precision) : "—",
        row.bMatch ? row.bMatch.fraction.toFraction() : "—",
        row.centsDelta === null ? "—" : row.centsDelta.toFixed(precision),
      ];
      for (const value of cells) {
        const td = document.createElement("td");
        td.textContent = value; // T-04-26/27 XSS guard.
        tr.appendChild(td);
      }

      // Audition cell — sequential A then B per D-30; simultaneous when toggled.
      const auditTd = document.createElement("td");
      const auditBtn = document.createElement("button");
      auditBtn.type = "button";
      auditBtn.className = "scale-compare__audition";
      auditBtn.textContent = "▶ A vs B";
      auditBtn.addEventListener("click", () => {
        const aHz = baseHz * Number(row.aInterval.fraction.valueOf());
        const bHz =
          row.bMatch !== null ? baseHz * Number(row.bMatch.fraction.valueOf()) : null;
        if (auditionMode === "simultaneous" && bHz !== null) {
          synth.playNotes([aHz, bHz], 0.6);
          return;
        }
        // Sequential (D-30 default): A immediately, B after auditionGapMs.
        synth.playNote(aHz, 0.6);
        if (bHz !== null) {
          const t = setTimeout(() => {
            auditionTimers.delete(t);
            synth.playNote(bHz, 0.6);
          }, auditionGapMs);
          auditionTimers.add(t);
        }
      });
      auditTd.appendChild(auditBtn);
      tr.appendChild(auditTd);

      tbody.appendChild(tr);
    });
  }

  function renderSummary(rows: AlignedRow[]): void {
    const deltas = rows
      .map((r) => r.centsDelta)
      .filter((d): d is number => d !== null);
    const max = deltas.length === 0 ? 0 : Math.max(...deltas);
    const rms =
      deltas.length === 0
        ? 0
        : Math.sqrt(deltas.reduce((s, d) => s + d * d, 0) / deltas.length);
    const common = rows.filter((r) => r.exactMatch).length;
    summary.textContent = `Max deviation: ${max.toFixed(precision)}¢ · RMS: ${rms.toFixed(precision)}¢ · Common subset: ${String(common)}`;
  }

  function renderPlot(): void {
    const allPoints = [
      ...scaleA.intervals.map((iv) => ({ scale: "A", cents: iv.cents })),
      ...scaleB.intervals.map((iv) => ({ scale: "B", cents: iv.cents })),
    ];
    const periodCents = Math.max(scaleA.period.cents, scaleB.period.cents);
    const plotEl = Plot.plot({
      x: { domain: [0, periodCents], label: "Cents" },
      color: { domain: ["A", "B"], range: ["#4269d0", "#ef8e3a"] }, // D-33: blue/orange, color-blind-safe.
      marks: [
        Plot.ruleX(allPoints, { x: "cents", stroke: "scale", strokeWidth: 2 }),
        Plot.dot(allPoints, { x: "cents", y: "scale", fill: "scale", r: 4 }),
      ],
      height: 120,
      width: 600,
    });
    while (plotHost.firstChild) plotHost.removeChild(plotHost.firstChild);
    plotHost.appendChild(plotEl);
  }

  function rerender(): void {
    const rows = align(scaleA, scaleB);
    renderTable(rows);
    renderSummary(rows);
    renderPlot();
  }

  // ─── Mode switching ───────────────────────────────────────────────────
  function applyMode(mode: string): void {
    presetSelect.style.display = mode === "Preset" ? "" : "none";
    pasteWrap.style.display = mode === "Paste" ? "" : "none";
    importWrap.style.display = mode === "Import .scl" ? "" : "none";
  }
  applyMode("Preset");

  modeSelect.addEventListener("change", () => {
    applyMode(modeSelect.value);
    status.textContent = "";
  });

  // ─── Preset → scaleB ──────────────────────────────────────────────────
  presetSelect.addEventListener("change", () => {
    const factory = BUILTIN_B_SCALES[presetSelect.value];
    if (factory) {
      scaleB = factory();
      status.textContent = "";
      rerender();
    }
  });

  // ─── Paste textarea → parseScala → scaleB ────────────────────────────
  pasteTextarea.addEventListener("input", () => {
    const text = pasteTextarea.value;
    if (text.trim() === "") {
      status.textContent = "";
      return;
    }
    try {
      const intervals = parseScala(text);
      // parseScala auto-prepends 1/1; require at least one user pitch beyond.
      if (intervals.length < 2) {
        throw new Error("paste at least one pitch line");
      }
      // Drop the auto-prepended 1/1 so scaleB matches the same shape as the presets
      // (which start at the first non-unison degree). The constructor's last entry
      // is the period (D-14).
      scaleB = new Scale(intervals.slice(1));
      status.textContent = `Loaded ${String(intervals.length - 1)} pitches.`;
      rerender();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // T-04-26: textContent — never innerHTML.
      status.textContent = `Couldn't parse pasted text: ${msg}`;
    }
  });

  // ─── .scl import → parseScl → scaleB ─────────────────────────────────
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const text = typeof result === "string" ? result : "";
      try {
        const parsed = parseScl(text);
        // parseScl already auto-prepends 1/1 — drop it for the same shape.
        scaleB = new Scale(parsed.intervals.slice(1));
        // T-04-27: textContent — never innerHTML.
        status.textContent = `Imported ${file.name} (${String(parsed.intervals.length - 1)} pitches).`;
        rerender();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        status.textContent = `Couldn't parse ${file.name}: ${msg}`;
      } finally {
        fileInput.value = "";
      }
    };
    reader.onerror = () => {
      status.textContent = `Couldn't read ${file.name}.`;
      fileInput.value = "";
    };
    reader.readAsText(file);
  });

  // ─── Esc panic-clear (CR-02 D-15/D-16/D-34) ──────────────────────────
  // Local keydown listener: clears pending B-note timers when user hits Esc.
  // The page-level synth cell ALREADY binds Esc to synth.panic() (Pitfall #11);
  // this is a SECOND listener, scoped to the component, removed on cleanup.
  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") clearPendingAuditions();
  };
  document.addEventListener("keydown", onKeydown);

  // Register cleanup on the returned element. Page cells call
  // `disposeScaleCompare(el)` in their `invalidation.then(...)` to drop
  // pending audition setTimeouts and remove the keydown listener.
  SCALE_COMPARE_CLEANUPS.set(root, () => {
    clearPendingAuditions();
    document.removeEventListener("keydown", onKeydown);
  });

  // ─── First render ─────────────────────────────────────────────────────
  rerender();

  return root;
}
