/**
 * Build-time-pure index over the vendored Scala archive snapshot
 * (`src/data/scala-archive/*.scl`). This module owns ALL logic; the Framework
 * data loader `src/data/scala-archive.json.ts` is a thin `fs` shell that calls
 * `buildArchiveIndex` and writes the JSON to stdout (D-A5).
 *
 * WRAP, don't reimplement (Pitfall #5 / INVENTORY discipline): `buildArchiveIndex`
 * delegates ALL .scl parsing to the already-hardened `parseScl` from `scala.ts`
 * (BOM/CRLF normalization, 1 MB UTF-8 cap, pitch-count validation, negative/
 * multi-slash rejection). This module adds only index-shaping logic on top.
 *
 * The LOAD-BEARING flag is `tempered` (D-A4 / SURF-06): computed at BUILD TIME
 * from the source `.scl` text, true iff any non-comment, non-header pitch line
 * contains a `.` (the cents marker, matching `parsePitchToken`'s D-19 rule). A
 * cents-defined scale MUST serialize cents-per-line downstream, never laundered
 * as ratios — so a tempered entry's `degrees` are emitted as cents strings and
 * an exact-JI entry's `degrees` as `n/d` ratio strings. This is the difference
 * between a correct and a silently-wrong Send-to.
 */

import { parseScl } from "./scala.js";

/**
 * D-A3 entry shape. `name` = the parseScl description line (the search field,
 * empty string allowed). `pitchCount` = intervals.length - 1 (excludes the
 * implicit auto-prepended 1/1). `degrees` = the serialized pitch lines AFTER
 * parseScl, leading 1/1 dropped, emitted ready to feed `parseScala` on the
 * client (exact-JI → `${n}/${d}`; tempered → cents `NNN.NNNN`) so the widget
 * never re-parses raw `.scl`. `tempered` is the per-entry SURF-06 flag (D-A4).
 */
export interface ArchiveEntry {
  filename: string;
  name: string;
  pitchCount: number;
  tempered: boolean;
  degrees: string[];
}

/** Default cap for the debounced-search consumer in 09-02. */
export const DEFAULT_SEARCH_CAP = 50;

/**
 * D-A4 / SURF-06: tempered iff ANY non-comment, non-header pitch line contains
 * a `.` (the cents marker, D-19). Mirrors scala.ts line discipline:
 *   - `!`-prefixed lines are comments (anywhere) → excluded
 *   - the first two non-comment lines are the description + pitch-count header
 *     → excluded
 *   - the remaining non-comment lines are pitches → scanned for `.`
 *
 * An all-ratio scale (F01) → false; any cents pitch (F02 all-cents, F03 mixed)
 * → true. The `.` test is intentionally identical to `parsePitchToken`'s cents
 * detection so the build-time flag can never disagree with the runtime parser.
 */
export function isTemperedScl(sclText: string): boolean {
  // Normalize CRLF/CR → LF and strip a leading BOM, matching scala.ts.
  const lines = sclText.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  const nonComment: string[] = [];
  for (const raw of lines) {
    if (raw.startsWith("!")) continue;
    nonComment.push(raw);
  }
  // Skip the description + pitch-count header (the first two non-comment lines).
  const pitchLines = nonComment.slice(2).map((l) => l.trim());
  for (const line of pitchLines) {
    if (line === "" || line.startsWith("!")) continue;
    if (line.includes(".")) return true;
  }
  return false;
}

/**
 * Serialize one parseScl result into the D-A3 `degrees` array. The leading 1/1
 * (auto-prepended by parseScl per D-13) is dropped — the receiver re-prepends
 * it via parseScala. Per the generate.md `ratioPerLine` / `centsPerLine`
 * convention:
 *   - tempered entry → `iv.cents.toFixed(4)` per line (carries a `.` so the
 *     receiver's cents-detection fires; cents is the source of truth here)
 *   - exact-JI entry → `${iv.fraction.n}/${iv.fraction.d}` per line (the
 *     writeScl `formatRatio` precedent — 2/1 serializes as "2/1", not "2")
 */
function serializeDegrees(
  intervals: { fraction: { n: bigint; d: bigint }; cents: number }[],
  tempered: boolean,
): string[] {
  // Drop the implicit leading 1/1 (intervals[0]); emit the rest.
  return intervals
    .slice(1)
    .map((iv) =>
      tempered ? iv.cents.toFixed(4) : `${String(iv.fraction.n)}/${String(iv.fraction.d)}`,
    );
}

/**
 * Build the searchable index from an array of `{ filename, text }`. Each file is
 * parsed via `parseScl` (WRAP — never reimplement). A file that THROWS in
 * parseScl (malformed, oversized, count mismatch) is SKIPPED and `console.warn`ed
 * so one bad vendored file never fails the whole build (T-09-01 mitigation).
 */
export function buildArchiveIndex(files: { filename: string; text: string }[]): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  for (const { filename, text } of files) {
    let parsed;
    try {
      parsed = parseScl(text);
    } catch (err) {
      // T-09-01: skip + warn; never crash the build on one bad file.
      console.warn(
        `buildArchiveIndex: skipping ${filename} — ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      continue;
    }
    const tempered = isTemperedScl(text);
    entries.push({
      filename,
      name: parsed.description,
      pitchCount: parsed.intervals.length - 1, // exclude the implicit 1/1
      tempered,
      degrees: serializeDegrees(parsed.intervals, tempered),
    });
  }
  return entries;
}

/**
 * Case-insensitive substring filter over `name` + `filename`, capped at `cap`.
 * An empty / blank term returns the first `cap` entries. Result order is stable
 * (input order); result length never exceeds `cap`. The debounced-search
 * consumer in 09-02 calls this on every keystroke.
 */
export function searchArchive(entries: ArchiveEntry[], term: string, cap: number): ArchiveEntry[] {
  const needle = term.trim().toLowerCase();
  if (needle === "") return entries.slice(0, cap);
  const out: ArchiveEntry[] = [];
  for (const entry of entries) {
    if (out.length >= cap) break;
    const haystack = `${entry.name}\n${entry.filename}`.toLowerCase();
    if (haystack.includes(needle)) out.push(entry);
  }
  return out;
}
