/**
 * generate-archive — the Scala-archive browser/search/audition widget
 * (LIB-01 surface + LIB-02 audition, Phase 9 D-B1..D-B4).
 *
 * A Pattern-2 DOM factory `generateArchive(synth, opts?) => HTMLElement` that
 * browses + debounced-searches the bundled archive index (built in 09-01) and,
 * on selection, loads the chosen scale into a tempered-aware `scaleTable` + a
 * ⏵⏵ Play button for audition. It exposes `getScale()` / `isTempered()` exactly
 * like every other generator widget (`generateCs`), so the 09-03 Send-to wiring
 * is pure plumbing.
 *
 * Decisions:
 *   - D-B1 (lazy load): the archive entries arrive via an `opts.loadEntries`
 *     async thunk kicked off in the constructor (a "Loading archive…" status
 *     shows until it resolves). The page passes
 *     `() => FileAttachment("scala-archive.json").json()`; tests pass an
 *     in-memory array. The component stays unit-testable WITHOUT FileAttachment.
 *   - D-B2 (capped debounced search): never render more than DEFAULT_SEARCH_CAP
 *     rows; the search input is debounced (~150 ms) before re-filtering via
 *     `searchArchive`; a "showing X of Y" caption reports rendered-vs-total
 *     (Y = full match count BEFORE the cap, so truncation is visible).
 *   - D-B3 (tempered-aware preview): on select, parse `entry.degrees` via
 *     `parseScala`, build a `Scale`, render
 *     `scaleTable(scale, baseHz, { tempered: entry.tempered })` +
 *     `playScale(scale, synth, { baseHz })`. The per-entry build-time `tempered`
 *     flag (09-01 D-A4) drives the cents-only display AND is returned by
 *     `isTempered()` so Send-to serializes cents-per-line for tempered scales
 *     (SURF-06) — never laundered as ratios.
 *   - D-B4 (XSS — T-09-03 / T-02-14 precedent): archive `name`/`filename` are
 *     attacker-influenced third-party `.scl` description text; EVERY dynamic
 *     value renders via `createElement` + `textContent` (the unsafe-HTML sink is
 *     never used with dynamic content — the grep gate keeps the count at 0).
 *
 * Three-layer purity: imports the searchArchive index API + ArchiveEntry type
 * (src/lib/scala-archive.js), the parseScala kernel + Scale type, the scaleTable
 * / playScale output components, and the SynthHandle type. NO module-level state
 * (Pattern 2) — all state is closure-local. NO AudioContext at construction
 * (the synth is passed in; ⏵⏵ Play comes from playScale).
 */
import type { ArchiveEntry } from "../lib/scala-archive.js";
import { searchArchive, DEFAULT_SEARCH_CAP } from "../lib/scala-archive.js";
import { parseScala } from "../lib/scala.js";
import { Scale } from "../lib/scale.js";
import { scaleTable } from "./scale-table.js";
import { playScale } from "./play-scale.js";
import type { SynthHandle } from "../audio/synth.js";

export interface GenerateArchiveOpts {
  /** Reference frequency for Hz projection inside scaleTable / playScale. Default 440 (D-08). */
  baseHz?: number;
  /** Cents decimal places. Default 1 (0.1¢ — Pitfall #16). */
  precision?: number;
  /**
   * D-B1 lazy-load thunk. The page passes
   * `() => FileAttachment("scala-archive.json").json()`; tests pass an in-memory
   * array. Default: a no-op resolving to `[]` so the component is testable
   * WITHOUT FileAttachment.
   */
  loadEntries?: () => Promise<ArchiveEntry[]>;
}

/**
 * A root element that also exposes the widget's current Scale + tempered marker,
 * exactly like GenerateCsElement — so the 09-03 Send-to wiring treats every
 * generator widget uniformly.
 */
export interface GenerateArchiveElement extends HTMLElement {
  /** The widget's current archive Scale, or null before any selection. */
  getScale(): Scale | null;
  /** The selected entry's build-time tempered flag (false before any selection). */
  isTempered(): boolean;
}

/** D-B2 debounce window for the search input (ms). */
const SEARCH_DEBOUNCE_MS = 150;

export function generateArchive(
  synth: SynthHandle,
  opts: GenerateArchiveOpts = {},
): GenerateArchiveElement {
  const baseHz = opts.baseHz ?? 440;
  const precision = opts.precision ?? 1;
  // D-B1: default to a no-op thunk so the component is testable without FileAttachment.
  const loadEntries = opts.loadEntries ?? (() => Promise.resolve<ArchiveEntry[]>([]));

  // ─── Closure-local state — no module-level state (Pattern 2). ──────────────
  let entries: ArchiveEntry[] = [];
  let currentScale: Scale | null = null;
  let currentTempered = false;
  // WR-05: the filename of the currently-selected entry (null before any
  // selection). `filename` is the unique per-entry key, so it survives a
  // list re-render and lets renderList re-apply the highlight to the new row.
  let selectedFilename: string | null = null;

  const root = document.createElement("section") as GenerateArchiveElement;
  root.className = "generate-archive";

  const heading = document.createElement("h2");
  heading.textContent = "Scala archive"; // UI copy.
  root.appendChild(heading);

  // ─── Search box (D-B2 — debounced) ─────────────────────────────────────────
  const searchWrap = document.createElement("div");
  searchWrap.className = "generate-archive__search";

  const searchLabel = document.createElement("span");
  searchLabel.className = "generate-archive__field-label";
  searchLabel.textContent = "Search";
  searchWrap.appendChild(searchLabel);

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.name = "archive-search";
  searchInput.placeholder = "Filter by name or filename…";
  searchInput.setAttribute("aria-label", "Search the Scala archive");
  searchWrap.appendChild(searchInput);
  root.appendChild(searchWrap);

  // ─── "showing X of Y" caption (aria-live polite) ───────────────────────────
  const caption = document.createElement("p");
  caption.className = "generate-archive__caption";
  caption.setAttribute("aria-live", "polite");
  root.appendChild(caption);

  // ─── Results list region ───────────────────────────────────────────────────
  const list = document.createElement("ul");
  list.className = "generate-archive__list";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Archive scales");
  root.appendChild(list);

  // ─── Status region (load errors + parse errors + empty states) ─────────────
  const status = document.createElement("div");
  status.className = "generate-archive__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  // ─── Output hosts: scaleTable + ⏵⏵ Play (like generateCs) ──────────────────
  const tableHost = document.createElement("div");
  tableHost.className = "generate-archive__table-host";
  root.appendChild(tableHost);

  const playHost = document.createElement("div");
  playHost.className = "generate-archive__play-host";
  root.appendChild(playHost);

  // Initial empty-preview caption — replaced on first selection. textContent
  // (literal copy, but the D-B4 discipline applies everywhere).
  const emptyPreview = document.createElement("p");
  emptyPreview.className = "generate-archive__empty-preview";
  emptyPreview.textContent = "Pick a scale to load it.";
  tableHost.appendChild(emptyPreview);

  /**
   * Full (uncapped) match count for the "showing X of Y" caption. searchArchive
   * itself caps at DEFAULT_SEARCH_CAP, so Y (total matches BEFORE the cap) is
   * computed here with the SAME case-insensitive name+filename predicate, so the
   * user can tell when results are truncated (D-B2).
   */
  function fullMatchCount(term: string): number {
    const needle = term.trim().toLowerCase();
    if (needle === "") return entries.length;
    let count = 0;
    for (const entry of entries) {
      const haystack = `${entry.name}\n${entry.filename}`.toLowerCase();
      if (haystack.includes(needle)) count++;
    }
    return count;
  }

  /** Build one selectable list row for an archive entry (all via textContent). */
  function makeRow(entry: ArchiveEntry): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "generate-archive__row";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "generate-archive__row-btn";
    btn.setAttribute("role", "option");
    // WR-05: reflect the live selection on (re-)render. If this row's entry is
    // the currently-selected one, re-apply the aria-selected + --selected
    // affordance so the highlight tracks `currentScale` across search re-renders.
    const isSelected = selectedFilename !== null && entry.filename === selectedFilename;
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    if (isSelected) btn.classList.add("generate-archive__row-btn--selected");

    // name → fallback to filename when the description line is empty.
    const nameSpan = document.createElement("span");
    nameSpan.className = "generate-archive__row-name";
    nameSpan.textContent = entry.name.trim() !== "" ? entry.name : entry.filename; // D-B4 / T-09-03.
    btn.appendChild(nameSpan);

    const metaSpan = document.createElement("span");
    metaSpan.className = "generate-archive__row-meta";
    metaSpan.textContent = `${String(entry.pitchCount)} notes`;
    btn.appendChild(metaSpan);

    const tagSpan = document.createElement("span");
    tagSpan.className = entry.tempered
      ? "generate-archive__row-tag generate-archive__row-tag--tempered"
      : "generate-archive__row-tag generate-archive__row-tag--ji";
    tagSpan.textContent = entry.tempered ? "tempered" : "JI"; // D-B3 marker.
    btn.appendChild(tagSpan);

    btn.addEventListener("click", () => {
      selectEntry(entry, li);
    });

    li.appendChild(btn);
    return li;
  }

  /**
   * Render the capped result list + update the "showing X of Y" caption (D-B2).
   * X = rendered rows (≤ DEFAULT_SEARCH_CAP); Y = full match count before the cap.
   */
  function renderList(term: string): void {
    const matches = searchArchive(entries, term, DEFAULT_SEARCH_CAP);
    const total = fullMatchCount(term);

    // WR-05: reconcile the persisted selection BEFORE building rows (makeRow
    // reads `selectedFilename` to decide the highlight). If the current search
    // term excludes the selected entry from the filter, the loaded table + ⏵⏵
    // Play would dangle for a scale the list no longer offers — clear the
    // selection AND the preview so affordance and state stay in agreement. A
    // selection that still matches the term but is merely pushed past the cap
    // keeps its preview (it remains a valid result, just not visibly listed).
    if (selectedFilename !== null && !entryMatchesTerm(selectedFilename, term)) {
      clearSelection();
    }

    list.replaceChildren(...matches.map((entry) => makeRow(entry)));
    caption.textContent = `Showing ${String(matches.length)} of ${String(total)}`;
    if (total === 0) {
      status.textContent =
        entries.length === 0 ? "No archive scales available." : "No scales match your search.";
    } else {
      status.textContent = "";
    }
  }

  /**
   * WR-05: does the entry with this filename still satisfy the search term?
   * Uses the SAME case-insensitive name+filename predicate as searchArchive /
   * fullMatchCount, so the reconcile agrees with what the list shows.
   */
  function entryMatchesTerm(filename: string, term: string): boolean {
    const needle = term.trim().toLowerCase();
    const entry = entries.find((e) => e.filename === filename);
    if (entry === undefined) return false; // entry gone (e.g. reload) → drop it.
    if (needle === "") return true;
    return `${entry.name}\n${entry.filename}`.toLowerCase().includes(needle);
  }

  /**
   * WR-05: drop the current selection and reset the preview to the empty state,
   * so a search that filters out the selected scale leaves no stale table / ⏵⏵
   * Play and getScale()/isTempered() no longer report a now-invisible scale.
   */
  function clearSelection(): void {
    selectedFilename = null;
    currentScale = null;
    currentTempered = false;
    const empty = document.createElement("p");
    empty.className = "generate-archive__empty-preview";
    empty.textContent = "Pick a scale to load it.";
    tableHost.replaceChildren(empty);
    playHost.replaceChildren();
  }

  /**
   * D-B3 / LIB-02: parse the selected entry's degrees → Scale, render the
   * tempered-aware scaleTable + ⏵⏵ Play, store the current scale + tempered flag.
   * On a parse error (defensive — degrees are pre-validated at build time, T-09-05)
   * surface the message in the status region and PRESERVE the prior preview
   * (the generateCs / D-16 discipline).
   */
  function selectEntry(entry: ArchiveEntry, row: HTMLLIElement): void {
    let scale: Scale;
    try {
      // degrees feed parseScala (it re-prepends the implicit 1/1).
      scale = new Scale(parseScala(entry.degrees.join("\n")));
    } catch (err) {
      // T-09-05: never crash the widget; preserve the prior preview (D-16).
      status.textContent = `Couldn't load ${
        entry.name.trim() !== "" ? entry.name : entry.filename
      }: ${err instanceof Error ? err.message : String(err)}`;
      return;
    }

    currentScale = scale;
    currentTempered = entry.tempered;
    selectedFilename = entry.filename; // WR-05: remember the live selection key.
    status.textContent = "";

    // Mark the selected row for affordance; clear the others (aria-selected).
    for (const otherBtn of list.querySelectorAll(".generate-archive__row-btn")) {
      otherBtn.setAttribute("aria-selected", "false");
      otherBtn.classList.remove("generate-archive__row-btn--selected");
    }
    const selBtn = row.querySelector(".generate-archive__row-btn");
    if (selBtn) {
      selBtn.setAttribute("aria-selected", "true");
      selBtn.classList.add("generate-archive__row-btn--selected");
    }

    // D-B3: tempered flag drives both the cents-only table AND isTempered() (SURF-06).
    tableHost.replaceChildren(scaleTable(scale, baseHz, { precision, tempered: entry.tempered }));
    playHost.replaceChildren(playScale(scale, synth, { baseHz }));
  }

  // ─── Debounced search wiring (D-B2) ────────────────────────────────────────
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  searchInput.addEventListener("input", () => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      renderList(searchInput.value);
    }, SEARCH_DEBOUNCE_MS);
  });

  // Expose the current Scale + tempered marker (the per-entry build-time flag).
  root.getScale = () => currentScale;
  root.isTempered = () => currentTempered;

  // ─── D-B1 lazy load: kick off the thunk; show a loading status until it settles. ─
  status.textContent = "Loading archive…";
  void loadEntries().then(
    (loaded) => {
      entries = Array.isArray(loaded) ? loaded : [];
      status.textContent = "";
      // Initial capped list (empty term → the first DEFAULT_SEARCH_CAP entries).
      renderList("");
    },
    (err) => {
      // T-09-03 / D-B4: surface the load error as literal text; leave the list empty.
      status.textContent = `Couldn't load the archive: ${
        err instanceof Error ? err.message : String(err)
      }`;
      caption.textContent = "Showing 0 of 0";
    },
  );

  return root;
}
