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
 * D-A4 / SURF-06: tempered iff ANY pitch line's FIRST whitespace-bounded token
 * contains a `.` (the cents marker, D-19). The line discipline AND the cents
 * test are byte-for-byte identical to `parseScl`/`parsePitchToken` in scala.ts
 * so the build-time flag can never disagree with the runtime parser:
 *   - `!`-prefixed lines are comments (anywhere) → excluded (WR-02)
 *   - the first two NON-COMMENT lines are the description + pitch-count header,
 *     then pitch lines are the remaining non-comment lines with blanks/`!`
 *     filtered — matching `parseScl`'s `slice(2).filter(...)` exactly (WR-02)
 *   - only the FIRST whitespace-bounded token of each pitch line is scanned for
 *     `.`, so a Scala-legal trailing dotted note (`9/8  M2 (cf. v1.5)`, an F09
 *     form parseScl supports) is NOT mis-flagged as tempered (WR-01)
 *
 * An all-ratio scale (F01) → false; any cents pitch (F02 all-cents, F03 mixed)
 * → true.
 */
export function isTemperedScl(sclText: string): boolean {
  // Normalize CRLF/CR → LF and strip a leading BOM, matching scala.ts.
  const lines = sclText.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  const nonComment: string[] = [];
  for (const raw of lines) {
    if (raw.startsWith("!")) continue;
    nonComment.push(raw);
  }
  // Mirror parseScl's pitch-line extraction EXACTLY (scala.ts:113-116): after
  // the description + count header, trim, then drop blanks and any embedded
  // comment lines. This keeps the header offset aligned with the runtime parser
  // even when blank lines appear among the leading non-comment lines (WR-02).
  const pitchLines = nonComment
    .slice(2)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("!"));
  for (const line of pitchLines) {
    // Monzo bra-ket lines (`[...>`) are exact by construction — never tempered.
    if (line.startsWith("[")) continue;
    // Take only the first whitespace-bounded token, matching parsePitchToken
    // (scala.ts:255-260). Trailing F09 text (e.g. `9/8  M2 (cf. v1.5)`) is
    // ignored, so an exact-JI line is never laundered as cents (WR-01).
    const firstWs = line.search(/\s/);
    const tok = firstWs === -1 ? line : line.slice(0, firstWs);
    if (tok.includes(".")) return true;
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
 * IN-01: the SINGLE source of truth for "does this entry match this search
 * needle?". Both `searchArchive` (capped filter) and `countArchiveMatches`
 * (uncapped count for the "showing X of Y" caption) derive from this one
 * predicate, so the rendered list and the total can never silently drift if the
 * haystack ever gains a field. `needle` is expected pre-normalized (trimmed +
 * lowercased) by the caller; an empty needle is treated as "matches everything"
 * by the callers, not here.
 */
function entryMatchesNeedle(entry: ArchiveEntry, needle: string): boolean {
  const haystack = `${entry.name}\n${entry.filename}`.toLowerCase();
  return haystack.includes(needle);
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
    if (entryMatchesNeedle(entry, needle)) out.push(entry);
  }
  return out;
}

/**
 * IN-01: uncapped count of entries matching `term`, using the SAME predicate as
 * `searchArchive` (via `entryMatchesNeedle`). The widget's "showing X of Y"
 * caption uses this for Y (the total before the cap) so X-vs-Y truncation is
 * visible and the caption can never lie about the match total. An empty / blank
 * term counts everything (mirrors `searchArchive`'s empty-needle short-circuit).
 */
export function countArchiveMatches(entries: ArchiveEntry[], term: string): number {
  const needle = term.trim().toLowerCase();
  if (needle === "") return entries.length;
  let count = 0;
  for (const entry of entries) {
    if (entryMatchesNeedle(entry, needle)) count++;
  }
  return count;
}
