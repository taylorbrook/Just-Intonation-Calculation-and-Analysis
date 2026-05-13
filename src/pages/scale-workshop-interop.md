# Scale Workshop interop

Round-trip a just-intonation scale from this notebook to [Scale Workshop](https://scaleworkshop.plainsound.org/) and back via `.scl` — proving the kernel's BigInt-Fraction arithmetic survives the trip.

```ts
import { Interval } from "../lib/interval.js";
import { Scale } from "../lib/scale.js";
import { parseScl, writeScl } from "../lib/scala.js";
import { ratioPill } from "../components/ratio-pill.js";
import { sclIo } from "../components/scl-io.js";
import { furtherReading } from "../components/further-reading.js";
```

```ts
// The worked example — Ptolemy's intense diatonic, the canonical 5-limit JI
// major scale. parseScala auto-prepends 1/1 (D-13); when constructing a Scale
// directly we list the unison too. The last entry is the period (D-14).
// R-01: every Interval flows through the BigInt-Fraction kernel.
const diatonic = new Scale([
  new Interval("1/1"),
  new Interval("9/8"),
  new Interval("5/4"),
  new Interval("4/3"),
  new Interval("3/2"),
  new Interval("5/3"),
  new Interval("15/8"),
  new Interval("2/1"),
]);
```

## 1. Build a scale on the dashboard

The [dashboard](/) is the project's primary surface for designing scales: type one pitch per line, the last line is the period, and `1/1` is added automatically. For this walkthrough, paste the following seven lines into the dashboard's **Scale** textarea:

```text
9/8
5/4
4/3
3/2
5/3
15/8
2/1
```

That yields the seven non-unison degrees of the 5-limit just diatonic:

```ts
const pillRow = (() => {
  const wrap = document.createElement("p");
  wrap.className = "pill-row";
  diatonic.intervals.slice(1).forEach((iv, i) => {
    if (i > 0) wrap.appendChild(document.createTextNode(" · "));
    wrap.appendChild(ratioPill(iv));
  });
  return wrap;
})();
display(pillRow);
```

Every interval is expressible with primes 2, 3, and 5 alone — small numerators and denominators, easy to verify by eye. The major third lands on a pure `5/4` (~14¢ flat of 12-TET), the major sixth on a pure `5/3`.

## 2. Export to `.scl`

The dashboard's Scala-file panel — built from [`sclIo`](https://github.com/) in `src/components/scl-io.ts` — gives you **⤓ Download .scl**. The same component is mounted below, scoped to the diatonic scale defined above:

```ts
display(sclIo(diatonic, { defaultFilename: "diatonic-5-limit-just" }));
```

Clicking **⤓ Download .scl** serializes the scale via `writeScl` in `src/lib/scala.ts`. The exact bytes it writes:

```ts
const sclPreview = (() => {
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = writeScl(diatonic);
  pre.appendChild(code);
  return pre;
})();
display(sclPreview);
```

Format anchors per the [Huygens-Fokker `.scl` spec](http://www.huygens-fokker.org/scala/scl_format.html):

- Lines starting with `!` are comments — ignored anywhere in the file.
- The first non-comment line is the description. `writeScl` emits it blank when no description is supplied (the dashboard does not currently round-trip user descriptions; D-13).
- The next non-comment line is the pitch count, **excluding** the implicit `1/1` (D-13). Seven pitches here.
- Each subsequent non-comment line is one pitch — a ratio (`5/4`) OR a cents value (`408.0`; a `.` in the token triggers the cents path per D-19).
- The **last** pitch line is the period (D-14). Here that's `2/1`, the octave.

The serializer always re-emits ratios. Round-trip equivalence holds by *Fraction-equality*, not file-byte identity: a `.scl` produced by another tool with different whitespace, comment lines, or pitch ordering may still parse to the same `Scale`.

## 3. Import into Scale Workshop

Open [Scale Workshop](https://scaleworkshop.plainsound.org/) in another tab. Two easy paths:

- **File → Open from disk…** then pick the `.scl` you just downloaded, or
- **File → New scale → From scale data…** and paste the seven pitch lines (or the full `.scl` shown above) into the dialog.

You should see seven pitches, the last one `2/1` at ${diatonic.intervals[7].cents.toFixed(3)}¢, with cents matching this notebook. The pure major third `5/4` reads ${diatonic.intervals[2].cents.toFixed(3)}¢, the pure perfect fifth `3/2` reads ${diatonic.intervals[4].cents.toFixed(3)}¢, and the just major seventh `15/8` reads ${diatonic.intervals[6].cents.toFixed(3)}¢. Tune Scale Workshop's reference frequency to whatever you like — the ratios are absolute, the Hz mapping is a separate concern (see `.kbm` files for that).

## 4. Round-trip the file back into the notebook

Drag the same `.scl` you just downloaded onto the **Import .scl or .kbm…** button above (or export from Scale Workshop and re-import that). The status region announces the import.

Because the BigInt-backed Fraction in `src/lib/interval.ts` reads `9/8` as exactly nine over eight — no float conversion, no truncation — the kernel proves the round-trip in-page without a physical file detour:

```ts
const roundTripTable = (() => {
  // Serialize → re-parse → verify Fraction-equality element-by-element.
  // R-01: comparison happens on `iv.fraction`, the canonical BigInt rational,
  // NOT on the float-derived `iv.cents` (Pitfall #1).
  const reparsed = parseScl(writeScl(diatonic)).intervals;

  const rows = diatonic.intervals.map((iv, i) => {
    const back = reparsed[i];
    const equal = back !== undefined && iv.fraction.equals(back.fraction);
    return { i, original: iv, back, equal };
  });

  const allEqual = rows.every((r) => r.equal);

  const table = document.createElement("table");
  table.className = "round-trip-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["#", "Original", "Re-parsed", "Cents", "Fraction-equal?"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const r of rows) {
    const tr = document.createElement("tr");

    const tdI = document.createElement("td");
    tdI.textContent = String(r.i);
    tr.appendChild(tdI);

    const tdO = document.createElement("td");
    tdO.appendChild(ratioPill(r.original, { showCents: false }));
    tr.appendChild(tdO);

    const tdB = document.createElement("td");
    if (r.back) tdB.appendChild(ratioPill(r.back, { showCents: false }));
    tr.appendChild(tdB);

    const tdC = document.createElement("td");
    tdC.textContent = `${r.original.cents.toFixed(3)}¢`;
    tr.appendChild(tdC);

    const tdE = document.createElement("td");
    tdE.textContent = r.equal ? "yes" : "no";
    tr.appendChild(tdE);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const caption = document.createElement("p");
  caption.className = "round-trip-caption";
  caption.textContent = allEqual
    ? `All ${String(rows.length)} intervals round-trip Fraction-exact through writeScl → parseScl.`
    : `Round-trip mismatch in ${String(rows.filter((r) => !r.equal).length)} interval(s).`;

  const wrap = document.createElement("div");
  wrap.appendChild(table);
  wrap.appendChild(caption);
  return wrap;
})();
display(roundTripTable);
```

> **Caveat — cents-source pitches are lossy.** If you export from a tool that emits cents (`701.955`) instead of a ratio for the perfect fifth, the kernel constructs a Fraction by approximating that cents value via `centsToValue` (see `src/lib/scala.ts` header docstring). The resulting Fraction round-trips through itself stably, but it is *not* bit-identical to `3/2` — the original prime structure has been collapsed to a float-derived rational. To preserve prime-limit information, keep ratios as the source of truth on both sides. Scale Workshop's default `.scl` export honors ratios when the underlying scale was specified as ratios — so the round-trip stays exact if you stay in the ratio surface end-to-end.

## See also

- [Dashboard](/) — design, audition, and `.scl`/`.kbm` export for any JI scale.
- [Analysis](/pages/analysis) — EDO comparison, MOS scales, and side-by-side comparison.
- [Monzos](/pages/monzos) — prime-exponent vectors, the kernel-canonical form.

## Further reading

```js
furtherReading([
  {
    title: "Scale Workshop (scaleworkshop.plainsound.org)",
    url: "https://scaleworkshop.plainsound.org/",
    note: "the canonical microtonal scale editor for the xenharmonic-devs ecosystem — same authorship as the math kernel this notebook leans on (xen-dev-utils, sonic-weave, sw-synth). Open-source, browser-based, no install. Reads and writes .scl and .kbm; also exports KontaktScript, Soniccouture, Anamark, Max/MSP coll, MTS-ESP, and several other instrument-tuning formats. The most direct way to take a scale designed here into a DAW or hardware synth."
  },
  {
    title: "Scale Workshop on GitHub (xenharmonic-devs/scale-workshop)",
    url: "https://github.com/xenharmonic-devs/scale-workshop",
    note: "source, issue tracker, and the project wiki — including format documentation for every export target Scale Workshop supports. The `docs/` folder is the closest thing to canonical user documentation; the README links the in-app help and the Discord where the xenharmonic-devs maintainers are reachable."
  },
  {
    title: "Huygens-Fokker — Scala .scl file format",
    url: "http://www.huygens-fokker.org/scala/scl_format.html",
    note: "the canonical format spec from the Huygens-Fokker Foundation (publishers of the Scala microtonal toolkit since 1992). Roughly fifty lines of prose: comment syntax (lines starting with `!`), description line, pitch count, and per-pitch token rules (ratios `n/d` or cents `408.0`, the latter triggered by a literal `.` in the token). The project's `src/lib/scala.ts` parser implements this spec plus Tuning-Systems-specific decisions (D-13 auto-prepend `1/1`, D-14 last-pitch-is-period, D-19 `.`-triggers-cents)."
  }
])
```
