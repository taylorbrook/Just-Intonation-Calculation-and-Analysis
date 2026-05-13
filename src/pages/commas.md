# Commas (glossary)

Every named comma the kernel knows about — grouped by prime-limit, each row kernel-exact

```ts
import { Interval } from "../lib/interval.js";
import { COMMAS, commaByName } from "../lib/commas.js";
import { createSynth } from "../audio/synth.js";
import { ratioPill } from "../components/ratio-pill.js";
import { playInterval } from "../components/play-interval.js";
```

```ts
// Synth cell — owns this page's AudioContext (ARCHITECTURE Pattern 4 / Pitfall #2).
// Must NOT depend on any other cell. The lazy createSynth() does not allocate the
// AudioContext until the first playNote / playNotes call (i.e. the first user click),
// so simply rendering this page does not create an AudioContext.
const synth = createSynth();
invalidation.then(() => synth.dispose());
```

A **comma** is a small interval that quantifies the gap between two paths to
the "same" pitch in just intonation (Helmholtz 1885, 431–434; Xen Wiki,
"Comma"). Each entry below is constructed via `commaByName(name)!` — the
kernel's hand-verified table in `src/lib/commas.ts` is the source of truth,
so every ratio, monzo, and cents value on this page is exact (BigInt-backed
`Fraction` → display projection; cross-referenced against Huygens-Fokker's
"List of intervals" for canonical naming). Pages with a deeper dedicated
note are linked from the entry; the rest are listed here as the canonical
index.

```ts
// Kernel-exact entries. commaByName is total over COMMAS by construction
// (R-01 / Pitfall #6), so the `!` assertion is safe.
const commaEntries = COMMAS.map((c) => {
  const iv = commaByName(c.name)!;
  // Prime-limit = last nonzero index of the canonical monzo.
  // PRIMES[i] gives the prime at column i (2, 3, 5, 7, 11, …).
  const monzo = iv.monzo;
  let last = -1;
  for (let i = 0; i < monzo.length; i++) if (monzo[i] !== 0) last = i;
  const limit = [2, 3, 5, 7, 11, 13, 17, 19][last];
  return { name: c.name, iv, monzo, limit };
});

const DEDICATED_PAGES = new Map([
  ["syntonic comma", "/pages/syntonic-comma"],
  ["Pythagorean comma", "/pages/pythagorean-comma"],
  ["schisma", "/pages/schisma"],
  ["septimal comma", "/pages/septimal-comma"],
]);
```

```ts
// Build one <table> per prime-limit group. createElement + textContent
// throughout — never innerHTML — per T-02-22/T-02-23 XSS discipline.
// The Monzo cell appends the DOM node returned by the `tex` template tag
// (Observable Framework renders KaTeX to an HTMLElement). The Play cell
// appends the button returned by playInterval(); the page-level synth is
// the only AudioContext owner (Pitfall #2).
const buildCommaTable = (entries) => {
  const table = document.createElement("table");
  table.className = "commas-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const label of ["Name", "Ratio", "Monzo", "Cents", "Limit", "Play"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const { name, iv, monzo, limit } of entries) {
    const tr = document.createElement("tr");

    // Name (linked if a dedicated page exists, plain text otherwise).
    const nameCell = document.createElement("td");
    const href = DEDICATED_PAGES.get(name);
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = name;
      nameCell.appendChild(a);
    } else {
      nameCell.textContent = name;
    }
    tr.appendChild(nameCell);

    // Ratio — BigInt-Fraction → ratioPill (ratio only, no cents pill; cents
    // is in its own column).
    const ratioCell = document.createElement("td");
    ratioCell.appendChild(ratioPill(iv, { showCents: false }));
    tr.appendChild(ratioCell);

    // Monzo — KaTeX-rendered bra-ket of the canonical (minimal-length) monzo.
    const monzoCell = document.createElement("td");
    monzoCell.appendChild(tex`\begin{bmatrix} ${monzo.join(" & ")} \end{bmatrix}\rangle`);
    tr.appendChild(monzoCell);

    // Cents — 3-decimal display projection (Pitfall #1: cents is derived,
    // never a kernel input).
    const centsCell = document.createElement("td");
    centsCell.className = "commas-table__cents";
    centsCell.textContent = `${iv.cents.toFixed(3)}¢`;
    tr.appendChild(centsCell);

    // Prime-limit.
    const limitCell = document.createElement("td");
    limitCell.textContent = String(limit);
    tr.appendChild(limitCell);

    // ▶ — audition the comma against 1/1.
    const playCell = document.createElement("td");
    playCell.appendChild(playInterval(iv, synth));
    tr.appendChild(playCell);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
};

const byLimit = (n) => commaEntries.filter((e) => e.limit === n);
```

## 3-limit

3-limit commas live entirely on the prime-2 and prime-3 axes — the residues of
trying to close Pythagorean cycles. The **Pythagorean comma** is the canonical
gap at 12 fifths; **Mercator's comma** is the residue at 53 fifths, the
defining comma of 53-EDO's near-closure (Xen Wiki, "Mercator's comma").

```ts
display(buildCommaTable(byLimit(3)));
```

## 5-limit

5-limit commas introduce the prime 5 — reconciling the Pythagorean chain with
the natural major third (5/4) (Partch 1974, ch. 6). The **syntonic comma**
(81/80) is the family's ground state; **schisma** (32805/32768) is the residue
between the Pythagorean and syntonic commas; **diaschisma**, **diesis**,
**greater diesis**, and **kleisma** trace different syntonic-arithmetic
remainders that name historically important tuning compromises.

```ts
display(buildCommaTable(byLimit(5)));
```

## 7-limit

7-limit commas reach for the natural seventh harmonic (7/4) and its kin. The
**septimal comma** (64/63, Archytas' comma) is the entry point — the gap
between the harmonic 7th and the Pythagorean minor 7th. **Septimal kleisma**
(225/224, the Marvel comma) and **breedsma** (2401/2400) anchor the
microtempered 7-limit families; **harmonic seventh comma** (49/48),
**jubilisma** (50/49), and **ragisma** (4375/4374) round out the standard
chart.

```ts
display(buildCommaTable(byLimit(7)));
```

## 11-limit

11-limit commas bring in the prime 11, the canonical "neutral" zone. The
**rastma** (243/242) marks the gap between two neutral-third interpretations;
the **undecimal comma** (33/32) is the size of the basic 11/8 displacement
from a Pythagorean fourth — the doorway into 11-limit JI.

```ts
display(buildCommaTable(byLimit(11)));
```

## See also

- [The syntonic comma](/pages/syntonic-comma) — 5-limit closure: 81/64 vs 5/4.
- [The Pythagorean comma](/pages/pythagorean-comma) — 3-limit closure: 12
  fifths vs 7 octaves.
- [The schisma](/pages/schisma) — Pythagorean − syntonic, at the threshold of
  audibility.
- [The septimal comma](/pages/septimal-comma) — entry point to 7-limit JI.
- [Monzos](/pages/monzos) — the bra-ket coordinate system used throughout this
  glossary.
- [Comma pump](/pages/comma-pump) — what happens when a comma is not tempered
  out and the cycle drifts.
- The dashboard at [/](/) lets you build any JI scale containing any of these
  commas and audition it against the drone.

## Further reading

- [Comma on the Xenharmonic Wiki](https://en.xen.wiki/w/Comma) — broader
  community-curated reference covering the full zoo of named commas, the
  temperaments that vanish each one, and the mappings that put commas at the
  edge of audibility while making them musically consequential. Useful as a
  jump-off from this kernel-bound glossary into the wider regular-temperament
  literature.

## Sources

- Helmholtz, Hermann von. 1885. *On the Sensations of Tone as a Physiological Basis for the Theory of Music*. Translated and edited by Alexander J. Ellis. 2nd English ed. London: Longmans, Green, and Co.
- Huygens-Fokker Foundation. n.d. "List of intervals." Accessed 2026-05-13. https://www.huygens-fokker.org/docs/intervals.html.
- Partch, Harry. 1974. *Genesis of a Music: An Account of a Creative Work, Its Roots, and Its Fulfillments*. 2nd ed., enlarged. New York: Da Capo Press. (1st ed. University of Wisconsin Press, 1949.)
- Xenharmonic Wiki. n.d. "Comma." Accessed 2026-05-13. https://en.xen.wiki/w/Comma.
- Xenharmonic Wiki. n.d. "Mercator's comma." Accessed 2026-05-13. https://en.xen.wiki/w/Mercator's_comma.
