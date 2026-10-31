/* ====================================================
   What ISW-Chan won't put up with, and won't repeat.
   Sees through the usual tricks: leetspeak (s3x), spacing
   and dots (n.u.d.e.s, s e x y), stretched letters
   (seeexy), look-alike letters and accents. A word list is
   never perfect; this raises the bar a lot.
   ==================================================== */

import { normalize } from "./parser";

export const INAPPROPRIATE = [
  "nudes", "nude", "nudez", "nudies", "noods", "noodz", "naked", "sexy", "sex", "horny", "boobs", "boob", "tits", "titties", "send pics", "send pictures",
  "feet pics", "take it off", "take off your", "strip for", "thicc", "onlyfans", "lewd", "hentai", "dick", "porn",
  "nsfw", "rule 34", "r34", "lingerie", "panties", "nipples", "erotic", "kinky", "fetish", "blowjob", "what are you wearing",
  "sleep with me", "in bed with me", "hook up with", "make out with",
  // Dutch
  "naakt", "seks", "geil", "tieten", "blote foto", "kleren uit",
];

/* Never echoed back in a reflection ("why do you feel ...?"), even when they aren't aimed at her */
const DONT_ECHO = [
  "hitler", "nazi", "nazis", "heil", "kkk", "genocide", "rape", "raped", "suicide", "kill myself", "terrorist", "slave", "slaves",
  "nigger", "nigga", "faggot", "fag", "retard", "retarded", "tranny", "kanker", "mongool", "flikker",
];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i", "|": "l" };
const LOOKALIKE: Record<string, string> = { "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ѕ": "s", "ԁ": "d", "к": "k", "т": "t", "в": "b", "н": "h", "м": "m" };

const squeeze = (w: string) => w.replace(/(.)\1+/g, "$1");
const REAL_WORDS = new Set(["seeks", "seeker", "seekers"]); // doubled letters, but not hiding anything

/* The ways someone might be hiding a word, as normalized texts */
export function unmasked(input: string): string[] {
  const plain = input.normalize("NFKD").replace(/[̀-ͯ​-‏⁠﻿]/g, "").toLowerCase()
    .replace(/./g, (ch) => LOOKALIKE[ch] ?? ch);
  // leetspeak only inside words that also have letters, so "13:37" and "42" stay numbers
  const unleet = plain.split(/\s+/).map((w) => (/[a-z]/.test(w) ? w.replace(/[0134578@$!|]/g, (ch) => LEET[ch]) : w)).join(" ");
  // "s e x y", "n.u.d.e.s", "s-e-x": runs of single letters become one word
  const pieces = unleet.split(/[^a-z0-9']+/).filter(Boolean);
  const joined: string[] = [];
  let run = "";
  for (const p of pieces) {
    if (p.length === 1) { run += p; continue; }
    if (run) { joined.push(run); run = ""; }
    joined.push(p);
  }
  if (run) joined.push(run);
  return [normalize(input), normalize(unleet), normalize(joined.join(" "))];
}

/* Word or phrase, plural or not, or stretched ("seeexy", "nuuudes"; but "bobs" is not "boobs").
   No typo tolerance: "parties" is not "panties". */
function has(text: string, phrase: string): boolean {
  const tokens = text.trim().split(" ").map((t) => t.replace(/'s$/, ""));
  const parts = phrase.split(" ");
  const same = (t: string, p: string) => t === p || t === `${p}s` || t === `${p}es` || `${t}s` === p
    || (/(.)\1/.test(t) && !REAL_WORDS.has(t) && [p, `${p}s`].some((q) => squeeze(t) === squeeze(q)));
  for (let i = 0; i + parts.length <= tokens.length; i++) {
    if (parts.every((p, j) => same(tokens[i + j], p))) return true;
  }
  return false;
}

const SINGLE_WORDS = INAPPROPRIATE.filter((w) => !w.includes(" ") && w.length >= 3);

export function isInappropriate(input: string): boolean {
  const texts = unmasked(input);
  if (texts.some((t) => INAPPROPRIATE.some((w) => has(t, w)))) return true;
  // "u r s e x y": the letters run together with the words around them ("ursexy"), so look inside
  const runs = texts[2].trim().split(" ").filter((w) => w.length >= 4);
  return runs.some((r) => SINGLE_WORDS.some((w) => r.includes(w)) && !normalize(input).includes(` ${r} `));
}

/* Safe to put in her mouth? Short, no links, nothing hateful */
export function echoable(fragment: string): boolean {
  if (!fragment.trim() || fragment.length > 60 || /https?:|www\.|<|>|@/.test(fragment)) return false;
  if (isInappropriate(fragment)) return false;
  return !unmasked(fragment).some((t) => DONT_ECHO.some((w) => has(t, w)));
}
