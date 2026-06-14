# Vendored Scala Archive Snapshot

This directory contains a **curated subset** of the canonical free Scala scale archive,
vendored (committed) into the repository so the build stays **fully offline and
self-hostable** — there is **no network fetch at build time** (per CLAUDE.md's static-site
constraint and plan decisions D-A1 / D-A2).

## Provenance

| Field | Value |
|-------|-------|
| **Source archive** | <https://www.huygens-fokker.org/docs/scales.zip> |
| **Maintainer / author** | Manuel Op de Coul — Scala scale archive, hosted by the Huygens-Fokker Foundation |
| **License / distribution** | Freely distributable. The Scala scale archive is a public, freely-redistributable collection of tuning files maintained by Manuel Op de Coul and published by the Huygens-Fokker Foundation for the use of the microtonal community. |
| **Upstream zip SHA-256** | `d2218f2fa6acd3b11c116e0626bd178af927636e2ed26d0ab7a4c27741b97b9a` |
| **Upstream `Last-Modified`** | Thu, 26 Mar 2026 16:06:33 GMT |
| **Upstream file count** | 5401 `.scl` files |
| **Curation date** | 2026-06-14 |
| **Vendored file count** | **195** `.scl` files |

## Curation Rationale

The full upstream archive (~5,400 files, multi-MB) is too large to render responsively in a
browse list and would bloat the single JSON index (decision D-A1). This snapshot is a
**representative spread** — selected deterministically by filename pattern across the
following categories, with pathological files excluded (any scale declaring **< 1** or
**> 100** pitches is skipped, keeping the index sub-MB and the browse list useful):

| Category | Files |
|----------|------:|
| Historical temperaments (Werckmeister, Kirnberger, Vallotti, Neidhardt, Silbermann, Kellner, …) | 32 |
| Meantone variants | 32 |
| Classic JI scales (Partch, Ptolemy, Archytas, Ellis duodene, Euler, Fokker, …) | 32 |
| World / maqam / raga / gamelan (slendro, pelog, al-Farabi, …) | 32 |
| CPS / diamond / Wilson (hexany, dekany, eikosany, tonality diamonds) | 32 |
| EDO / equal divisions | 3 |
| Harmonic / subharmonic | 32 |
| **Total** | **195** |

Original upstream filenames are preserved verbatim (one `.scl` per file).

## Sample of vendored filenames (10)

```
aron-neidhardt.scl
kirnberger24.scl
mean14_7.scl
mean2nine_15.scl
duodene_t.scl
al-farabi_19.scl
al-farabi_g6.scl
dekany3.scl
dekanymarvwoo.scl
harm12s.scl
```

## How this snapshot is consumed

At build time, `src/data/scala-archive.json.ts` (a Framework data loader) reads every `.scl`
in this directory with Node `fs`, parses it via the project's hardened `parseScl`, and emits
a single searchable JSON index (`scala-archive.json`). No file in this pipeline performs a
network request.
