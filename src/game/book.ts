/* ====================================================
   Book ciphers — the "book" is text that is actually
   rendered somewhere on the website.

   Counting rules (also explained to the player):
   - words are split on whitespace, every token counts
     (even emoji-only ones), starting at 1
   - inside a word only letters and digits count
   ==================================================== */

import { aboutMission, memberIntro, events } from "@/data/site-data";

export interface BookSource {
  page: string;
  /* Sections addressed by the first coordinate; a single section is not numbered */
  sections: string[];
}

export const BOOKS = {
  about: { page: "/about (the ./mission text)", sections: [aboutMission] },
  members: { page: "/members (the ./what_is_a_member text, one section per sentence)", sections: memberIntro.split(/(?<=\.)\s+/) },
  events: { page: "/events (one section per event, top to bottom, ignore the leading #)", sections: events.map((e) => e.description) },
} satisfies Record<string, BookSource>;

function wordsOf(section: string): string[] {
  return section.trim().split(/\s+/).map((w) => w.replace(/[^A-Za-z0-9]/g, "").toUpperCase());
}

/* Every [section?, word, letter?] position of a character, 1-based */
function locate(book: BookSource, ch: string, firstLetterOnly: boolean): number[][] {
  const hits: number[][] = [];
  book.sections.forEach((section, s) => {
    wordsOf(section).forEach((word, w) => {
      if (firstLetterOnly) {
        if (word[0] === ch) hits.push(book.sections.length > 1 ? [s + 1, w + 1] : [w + 1]);
        return;
      }
      for (let l = 0; l < word.length; l++) {
        if (word[l] === ch) hits.push(book.sections.length > 1 ? [s + 1, w + 1, l + 1] : [w + 1, l + 1]);
      }
    });
  });
  return hits;
}

/* True when every letter of `text` can be pointed at in the book */
export function canBookEncode(text: string, book: BookSource, firstLetterOnly = false): boolean {
  return [...text].every((ch) => !/[A-Z]/.test(ch) || locate(book, ch, firstLetterOnly).length > 0);
}

/* Letters become coordinates like "12.3"; anything else stays literal, quoted: '3' '_' */
export function bookEncode(text: string, book: BookSource, firstLetterOnly = false, rng: () => number = Math.random): string {
  return [...text.toUpperCase()].map((ch) => {
    const hits = /[A-Z]/.test(ch) ? locate(book, ch, firstLetterOnly) : [];
    if (hits.length === 0) return `'${ch}'`;
    return hits[Math.floor(rng() * hits.length)].join(".");
  }).join(" ");
}

export function bookDecode(cipher: string, book: BookSource, firstLetterOnly = false): string {
  return cipher.split(" ").map((token) => {
    if (/^'.'$/.test(token)) return token[1];
    const coords = token.split(".").map(Number);
    const [s, w, l] = book.sections.length > 1 ? coords : [1, ...coords];
    const word = wordsOf(book.sections[s - 1] ?? "")[w - 1] ?? "?";
    return firstLetterOnly ? word[0] : word[l - 1] ?? "?";
  }).join("");
}
