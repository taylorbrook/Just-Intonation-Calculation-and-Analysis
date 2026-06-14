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

const files = readdirSync(archiveDir)
  .filter((name) => name.endsWith(".scl"))
  .sort() // deterministic build order
  .map((filename) => ({
    filename,
    text: readFileSync(join(archiveDir, filename), "utf8"),
  }));

const entries = buildArchiveIndex(files);

process.stdout.write(JSON.stringify(entries));
