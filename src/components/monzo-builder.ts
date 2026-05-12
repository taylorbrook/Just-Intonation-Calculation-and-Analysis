/**
 * monzoBuilder — interactive monzo construction widget for src/pages/monzos.md.
 *
 * Five prime-exponent number inputs (primes 2/3/5/7/11, each in [-12, 12]) plus
 * a free-form ratio-string input. The two surfaces stay in sync:
 *
 *   - typing into an exponent input → ratio input + display row recompute from
 *     `Interval.fromMonzo([...exponents])`. The ratio input is NOT rewritten if
 *     it currently has focus (Pitfall #5 — don't clobber mid-typing).
 *   - typing into the ratio input → `new Interval(value)`, monzo extracted, padded
 *     /truncated to 5 slots, range-checked, then written back into the five
 *     exponent inputs. Programmatic `.value = ...` writes do NOT fire `input`
 *     events, so there is no feedback loop.
 *
 * Surfaces re-rendered on every state change:
 *   - bra-ket: Unicode `[ a  b  c  d  e ⟩` on a `<code>` (textContent only;
 *     KaTeX would re-typeset on every keystroke and flicker — Unicode is fine).
 *   - ratioPill: existing component (no cents — we show cents separately).
 *   - cents: `(~ddd.dd¢)` to 2 decimal places.
 *   - play button: existing playInterval component (▶ glyph only).
 *   - error region: role="status" aria-live="polite" — shows fraction.js parse
 *     errors, primes-above-11, or out-of-range messages. textContent only (XSS).
 *
 * Pattern 2 closure-component (mos-builder.ts is the template). No module-level
 * state. Three-layer discipline: imports types only from src/lib/ and src/audio/.
 *
 * BigInt path preserved: kernel stays on Fraction → Interval. Cents is the only
 * float projection, at the display boundary (Pitfall #1).
 */
import { Interval } from "../lib/interval.js";
import { ratioPill } from "./ratio-pill.js";
import { playInterval } from "./play-interval.js";
import type { SynthHandle } from "../audio/synth.js";

export interface MonzoBuilderOpts {
  /** Initial monzo. Default `[0, 0, 0, 0, 0]` (unison 1/1). Padded/truncated to 5 slots. */
  initialMonzo?: number[];
  /** Reference frequency for the ▶ button. Default 440. */
  baseHz?: number;
}

// Primes 2, 3, 5, 7, 11 — exponent grid is exactly 5 slots wide.
const PRIME_LABELS = ["2", "3", "5", "7", "11"] as const;
const SLOT_COUNT = PRIME_LABELS.length;
const MIN_EXPONENT = -12;
const MAX_EXPONENT = 12;

/** Clamp into [MIN_EXPONENT, MAX_EXPONENT]. Returns null if the parsed value is non-finite. */
function clampExponent(raw: string): number | null {
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < MIN_EXPONENT) return MIN_EXPONENT;
  if (parsed > MAX_EXPONENT) return MAX_EXPONENT;
  return Math.trunc(parsed);
}

/** Pad/truncate a monzo to exactly SLOT_COUNT entries. */
function padMonzo(monzo: number[]): number[] {
  const out = new Array<number>(SLOT_COUNT);
  for (let i = 0; i < SLOT_COUNT; i++) out[i] = monzo[i] ?? 0;
  return out;
}

export function monzoBuilder(synth: SynthHandle, opts: MonzoBuilderOpts = {}): HTMLElement {
  const baseHz = opts.baseHz ?? 440;

  // Closure-local canonical state — primes 2/3/5/7/11 (5 slots).
  let exponents: number[] = padMonzo(opts.initialMonzo ?? []);

  const root = document.createElement("section");
  root.className = "monzo-builder";

  // ─── Exponent row ────────────────────────────────────────────────────────
  const exponentRow = document.createElement("div");
  exponentRow.className = "monzo-builder__exponent-row";

  const exponentRowLabel = document.createElement("span");
  exponentRowLabel.className = "monzo-builder__row-label";
  exponentRowLabel.textContent = "Exponents";
  exponentRow.appendChild(exponentRowLabel);

  const exponentInputs: HTMLInputElement[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const primeName = PRIME_LABELS[i]!; // i in [0, SLOT_COUNT) — index always in bounds.
    const cell = document.createElement("label");
    cell.className = "monzo-builder__exponent-cell";

    const primeLabel = document.createElement("span");
    primeLabel.className = "monzo-builder__prime-label";
    primeLabel.textContent = primeName;
    cell.appendChild(primeLabel);

    const input = document.createElement("input");
    input.type = "number";
    input.name = `exponent-${primeName}`;
    input.min = String(MIN_EXPONENT);
    input.max = String(MAX_EXPONENT);
    input.step = "1";
    input.value = String(exponents[i]);
    input.setAttribute("aria-label", `Exponent of prime ${primeName}`);
    const slot = i;
    input.addEventListener("input", () => {
      const clamped = clampExponent(input.value);
      // Empty/mid-typing → preserve prior state (Pitfall — do NOT coerce to 0).
      if (clamped === null) return;
      exponents[slot] = clamped;
      applyExponents();
    });
    cell.appendChild(input);
    exponentRow.appendChild(cell);
    exponentInputs.push(input);
  }
  root.appendChild(exponentRow);

  // ─── Ratio input row ─────────────────────────────────────────────────────
  const ratioRow = document.createElement("div");
  ratioRow.className = "monzo-builder__ratio-row";

  const ratioLabel = document.createElement("span");
  ratioLabel.className = "monzo-builder__row-label";
  ratioLabel.textContent = "Ratio";
  ratioRow.appendChild(ratioLabel);

  const ratioInput = document.createElement("input");
  ratioInput.type = "text";
  ratioInput.name = "ratio";
  ratioInput.setAttribute("aria-label", "Ratio");
  ratioInput.className = "monzo-builder__ratio-input";
  ratioInput.value = "1";
  ratioInput.addEventListener("input", applyRatio);
  ratioRow.appendChild(ratioInput);

  root.appendChild(ratioRow);

  // ─── Display row: bra-ket | pill | cents | ▶ ────────────────────────────
  const displayRow = document.createElement("div");
  displayRow.className = "monzo-builder__display-row";

  const braketHost = document.createElement("div");
  braketHost.className = "monzo-builder__braket";
  const braketCode = document.createElement("code");
  braketHost.appendChild(braketCode);
  displayRow.appendChild(braketHost);

  const pillHost = document.createElement("div");
  pillHost.className = "monzo-builder__pill-host";
  displayRow.appendChild(pillHost);

  const centsHost = document.createElement("div");
  centsHost.className = "monzo-builder__cents-host";
  const centsSpan = document.createElement("span");
  centsHost.appendChild(centsSpan);
  displayRow.appendChild(centsHost);

  const playHost = document.createElement("div");
  playHost.className = "monzo-builder__play-host";
  displayRow.appendChild(playHost);

  root.appendChild(displayRow);

  // ─── Error region (role=status, aria-live=polite) ────────────────────────
  const errHost = document.createElement("div");
  errHost.className = "monzo-builder__error";
  errHost.setAttribute("role", "status");
  errHost.setAttribute("aria-live", "polite");
  root.appendChild(errHost);

  /**
   * Render the four derived display surfaces from a known-good Interval.
   * Every text path uses textContent (XSS — T-02-22/23).
   */
  function renderDerived(iv: Interval): void {
    // Bra-ket via Unicode; tabular-nums in CSS keeps columns aligned.
    braketCode.textContent = `[ ${exponents.join("  ")} ⟩`;

    // ratioPill returns a fresh <span> — replaceChildren is leak-safe.
    pillHost.replaceChildren(ratioPill(iv, { showCents: false }));

    // 2 d.p. for cents (the prose convention on the surrounding page is 1 d.p.,
    // but a live-updating builder benefits from a tighter readout).
    centsSpan.textContent = `(~${iv.cents.toFixed(2)}¢)`;

    // playInterval returns a fresh <button> per call; the old button's click
    // listener GCs with the discarded node. Synth handle is captured but the
    // AudioContext is owned by the page-level cell — not recreated.
    playHost.replaceChildren(playInterval(iv, synth, { label: false, baseHz }));
  }

  /**
   * Exponent-driven sync: build Interval from current exponent state, refresh
   * the ratio input (unless it has focus — don't fight the user mid-typing),
   * and re-render display surfaces.
   */
  function applyExponents(): void {
    let iv: Interval;
    try {
      iv = Interval.fromMonzo([...exponents]);
    } catch (err) {
      // fromMonzo should not throw for integer arrays in [-12, 12], but be defensive.
      const msg = err instanceof Error ? err.message : String(err);
      errHost.textContent = msg;
      return;
    }
    errHost.textContent = "";
    // Programmatic .value = ... does NOT fire `input` events — no feedback loop.
    if (document.activeElement !== ratioInput) {
      ratioInput.value = iv.toString();
    }
    renderDerived(iv);
  }

  /**
   * Ratio-driven sync: parse the ratio string, surface inline errors for
   * fraction.js failures / primes-above-11 / out-of-range exponents; on success
   * write back into the exponent inputs and re-render display.
   */
  function applyRatio(): void {
    const raw = ratioInput.value.trim();
    let iv: Interval;
    try {
      iv = new Interval(raw);
    } catch (err) {
      // Transient invalid input (e.g. "3/", "", "abc") — preserve prior exponent state.
      const msg = err instanceof Error ? err.message : String(err);
      errHost.textContent = msg;
      return;
    }

    const monzo = iv.monzo;
    // Detect primes above 11: any nonzero entry beyond slot 4 (prime 11) is a 13+.
    if (monzo.slice(SLOT_COUNT).some((x) => x !== 0)) {
      errHost.textContent =
        "Ratio uses primes above 11 — adjust ratio or use only primes 2/3/5/7/11.";
      return;
    }

    const padded = padMonzo(monzo);
    // Range-check before writing — exponents are constrained to [-12, 12].
    for (let i = 0; i < SLOT_COUNT; i++) {
      const v = padded[i]!; // padMonzo guarantees SLOT_COUNT entries.
      if (v < MIN_EXPONENT || v > MAX_EXPONENT) {
        errHost.textContent = `Exponent out of range [${String(MIN_EXPONENT)}, ${String(
          MAX_EXPONENT,
        )}] for prime ${PRIME_LABELS[i]!} (got ${String(v)}).`;
        return;
      }
    }

    errHost.textContent = "";
    exponents = padded;
    for (let i = 0; i < SLOT_COUNT; i++) {
      // Programmatic .value = ... does NOT fire `input` events — no feedback loop.
      exponentInputs[i]!.value = String(exponents[i]);
    }
    renderDerived(iv);
  }

  // Initial render — paint bra-ket, pill, cents, ▶, and the ratio input value.
  applyExponents();

  return root;
}
