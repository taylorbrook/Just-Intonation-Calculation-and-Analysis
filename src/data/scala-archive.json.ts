/**
 * Framework data loader (the FIRST `*.json.ts` in the repo). Executed at BUILD
 * TIME; whatever it writes to stdout becomes the static `scala-archive.json`,
 * read on a page via `FileAttachment("scala-archive.json").json()` (CLAUDE.md
 * "Data loaders").
 *
 * Thin `fs` shell ONLY (D-A5): it reads the vendored `src/data/scala-archive/`
 * directory and delegates ALL index logic to the unit-tested `buildArchiveIndex`
 * in `src/lib/scala-archive.ts`. NO network access at build time — the snapshot
 * is committed (Task 1) so the build stays offline and self-hostable (D-A1 /
 * D-A2, CLAUDE.md static-site constraint). The only I/O here is local `node:fs`.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArchiveIndex } from "../lib/scala-archive.js";

const archiveDir = join(dirname(fileURLToPath(import.meta.url)), "scala-archive");

// WR-04: guard directory access. A missing/renamed/not-yet-vendored snapshot
// dir must NOT abort the whole `observable build` with a raw ENOENT — the
// snapshot is a separately-vendored asset, so an absent dir is a realistic
// state. Emit an empty index (the widget already shows "No archive scales
// available." for an empty list) and keep every other page building.
let names: string[] = [];
try {
  names = readdirSync(archiveDir)
    .filter((name) => name.endsWith(".scl"))
    .sort(); // deterministic build order
} catch (err) {
  console.warn(
    `scala-archive loader: archive dir unavailable — ${
      err instanceof Error ? err.message : String(err)
    }`,
  );
}

// WR-03: guard each per-file read so the "one bad vendored file never crashes
// the build" goal (T-09-01) actually holds at the read layer too — not just in
// buildArchiveIndex's parse try/catch. An unreadable file (EACCES, non-UTF-8
// decode error, or a file deleted between readdirSync and readFileSync) is
// skipped + warned, symmetric with the parse-skip semantics, instead of
// throwing out of the loader and failing the static build.
const files = names.flatMap((filename) => {
  try {
    return [{ filename, text: readFileSync(join(archiveDir, filename), "utf8") }];
  } catch (err) {
    console.warn(
      `scala-archive loader: skipping ${filename} — ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return [];
  }
});

const entries = buildArchiveIndex(files);

process.stdout.write(JSON.stringify(entries));
