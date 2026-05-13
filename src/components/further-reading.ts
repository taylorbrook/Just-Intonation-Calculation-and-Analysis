/**
 * furtherReading — reusable "Further reading" bullet list for theory pages.
 *
 * Renders a <section class="further-reading"> wrapping a <ul> of styled
 * <li> entries. The page's `## Further reading` Markdown heading stays in
 * Markdown so Framework's TOC still picks it up — this helper renders the
 * list body only.
 *
 * `note` accepts either a plain string OR a DOM Node. Use a Node (e.g. the
 * result of an `html\`...\`` tagged template, or `tex\`...\``) when the note
 * contains inline TeX, links, or bold — strings go through `textContent` and
 * never become innerHTML (T-02-22/T-02-23 XSS discipline).
 *
 * ARCHITECTURE Pattern 1 — pure presentational. No state, no kernel deps.
 */
export interface FurtherReadingItem {
  /** Link title (plain text — rendered inside an <a>). */
  title: string;
  /** External URL. */
  url: string;
  /** Optional explanatory note. String → textContent; Node → appended as-is. */
  note?: string | Node;
}

export function furtherReading(items: FurtherReadingItem[]): HTMLElement {
  const section = document.createElement("section");
  section.className = "further-reading";

  const list = document.createElement("ul");
  list.className = "further-reading__list";

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "further-reading__item";

    const link = document.createElement("a");
    link.href = item.url;
    link.textContent = item.title;
    if (/^https?:/i.test(item.url)) {
      link.rel = "noopener noreferrer";
    }
    li.appendChild(link);

    if (item.note !== undefined && item.note !== "") {
      li.appendChild(document.createTextNode(" — "));
      const note = document.createElement("span");
      note.className = "further-reading__note";
      if (typeof item.note === "string") {
        note.textContent = item.note;
      } else {
        note.appendChild(item.note);
      }
      li.appendChild(note);
    }

    list.appendChild(li);
  }

  section.appendChild(list);
  return section;
}
