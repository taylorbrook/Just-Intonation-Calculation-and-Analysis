/**
 * ratioPill — inline ratio + cents pill for prose, e.g. `81/80 (~21.5¢)`.
 *
 * Renders Unicode text (NOT KaTeX). Per RESEARCH O-01 / D-10: KaTeX is reserved
 * for true math — fractions in prose use `<code>n/d</code>` for monospace
 * alignment with the table. The cents annotation uses the typographic `¢`
 * character (U+00A2) and a leading `~` to signal "approximate" (cents are a
 * float-derived display projection per Pitfall #1).
 *
 * Cents at 0.1¢ default precision (Pitfall #16) via `iv.cents.toFixed(1)`.
 *
 * ARCHITECTURE Pattern 2 factory. Three-layer discipline: type-only import.
 */
import type { Interval } from "../lib/interval.js";
import "./ratio-pill.css";

export interface RatioPillOpts {
  /** Default true. Set false to render just the ratio. */
  showCents?: boolean;
}

export function ratioPill(interval: Interval, opts: RatioPillOpts = {}): HTMLSpanElement {
  const showCents = opts.showCents ?? true;
  const span = document.createElement("span");
  span.className = "ratio-pill";

  const ratio = document.createElement("code");
  ratio.className = "ratio-pill__ratio";
  ratio.textContent = interval.fraction.toFraction();
  span.appendChild(ratio);

  if (showCents) {
    const cents = document.createElement("small");
    cents.className = "ratio-pill__cents";
    cents.textContent = ` (~${interval.cents.toFixed(1)}¢)`; // 0.1¢ — Pitfall #16.
    span.appendChild(cents);
  }
  return span;
}
