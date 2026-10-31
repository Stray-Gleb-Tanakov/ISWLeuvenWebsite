/* ====================================================
   ISW-Chan's varied phrasing: lines can hold {a|b|c} choices,
   so the same answer rarely sounds the same twice, and she
   notices when she's about to repeat herself.
   ==================================================== */

/* "{Fine|Okay}. {One|A single} hint." -> one of the combinations. Nested braces work. */
export function vary(line: string, rng: () => number = Math.random): string {
  let out = line;
  for (let guard = 0; guard < 20; guard++) {
    const m = out.match(/\{([^{}]*)\}/);
    if (!m) break;
    const options = m[1].split("|");
    out = out.slice(0, m.index) + options[Math.floor(rng() * options.length)] + out.slice(m.index! + m[0].length);
  }
  return out;
}

const AGAIN = ["{Like|As} I said: ", "Again: ", "I'm repeating myself. ", "Same answer as before: "];

/* Lines she said recently get a nod instead of a straight repeat */
export function avoidRepeats(lines: string[], recent: string[], rng: () => number = Math.random): string[] {
  return lines.map((l) => (recent.includes(l) && l.length > 12 ? vary(AGAIN[Math.floor(rng() * AGAIN.length)], rng) + l : l));
}

export function pick<T>(pool: readonly T[], rng: () => number = Math.random): T {
  return pool[Math.floor(rng() * pool.length)];
}

/* The same input always gets the same coin flip: her opinions don't change between calls */
export function stableHash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}
