---
quick_id: 260513-akn
slug: scale-workshop-interop
date: 2026-05-13
description: New tutorial page src/pages/scale-workshop-interop.md walking through a Tuning Systems → Scale Workshop → Tuning Systems round-trip via .scl. Mounts the existing sclIo component, exposes a 5-limit just diatonic as the worked example, and proves kernel round-trip equivalence (parseScl(writeScl(s)) ≡ s by Fraction-equality) in a reactive cell.
---

# Scale Workshop interop tutorial

A hands-on round-trip walkthrough: build a JI scale in this notebook, export to
`.scl`, open it in [Scale Workshop](https://scaleworkshop.plainsound.org/), and
re-import the file back.

## Goal

Give a user a concrete, run-it-in-your-browser tutorial proving that the
project's `.scl` export interoperates with Scale Workshop AND that the kernel's
BigInt-Fraction reader round-trips its own export without precision loss for
ratio-source intervals.

## Scope

1. New file: `src/pages/scale-workshop-interop.md`. Mounts the existing
   `sclIo` component (from `src/components/scl-io.ts`) against a worked example
   scale: a 5-limit just diatonic (`9/8 5/4 4/3 3/2 5/3 15/8 2/1`). Walks
   through the four phases:
   - (a) Build / inspect the scale on the dashboard (`/`)
   - (b) Export via the embedded `sclIo` (Download `.scl` button)
   - (c) Import the downloaded file into Scale Workshop
   - (d) Re-import that `.scl` back via the embedded `sclIo` import button —
     and prove kernel round-trip equivalence in a reactive cell
2. Static code block with the canonical exported `.scl` text (the exact bytes
   `writeScl(diatonic)` produces, for users who want to paste-import into
   Scale Workshop without downloading).
3. Reference `src/lib/scala.ts` as the canonical parser+serializer; cite the
   cents-source-is-lossy caveat from its header docstring (writeScl always
   re-emits ratios — round-trip equivalence holds by Fraction-equality, not
   file-byte identity).
4. `## Further reading`: Scale Workshop app + GitHub repo (canonical docs),
   Huygens-Fokker `.scl` format spec.
5. Wire into `observablehq.config.ts` as a new top-level **Tools** section
   (cleaner than appending to Theory notes — this is a how-to, not a theory
   primer).

## Out of scope

- No kernel changes (`src/lib/*`, `src/audio/*`, existing components all
  untouched).
- No new component files. Reuse `sclIo`, `ratioPill`, `furtherReading`.
- No audio. No synth cell.
- No `.kbm` round-trip walkthrough (the page mentions `.kbm` only in passing
  — the focus is `.scl` interop with Scale Workshop; full `.kbm` semantics
  are an existing dashboard concern).

## Constraints honored

- T-02-22 / T-02-23: any dynamic surface uses `createElement` + `textContent`.
- Pitfall #1: cents derived only at display boundary from `iv.cents`; no
  hardcoded float-cent literals in data rows.
- Framework module-scope rule: single import cell at top of page.
- No `createSynth()` call — keeps Pitfall #2 trivially honored.
- The `## Further reading` H2 stays in Markdown so Framework's TOC picks it up;
  body is rendered via `furtherReading([...])`.

## Files touched

- `src/pages/scale-workshop-interop.md` (new)
- `observablehq.config.ts` (add `Tools` section with one entry)

## Acceptance

- `npm run build` clean; page count = previous + 1.
- `npx tsc --noEmit` baseline unchanged (5 pre-existing `npm:` specifier errors
  in non-markdown files only).
- Page renders the embedded `sclIo` block; clicking "⤓ Download .scl" produces
  the canonical 5-limit-just-diatonic .scl text shown in the page's static code
  block.
- Round-trip reactive cell confirms `parseScl(writeScl(diatonic)).intervals[i]`
  Fraction-equals `diatonic.intervals[i]` for every i ∈ [0, 7].
- New "Tools" section visible in the sidebar.
