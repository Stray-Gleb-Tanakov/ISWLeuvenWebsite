/* ====================================================
   What did you mean? Finds the question in ISW-Chan's bank
   (chanbank.ts) closest to what you typed: shared keywords
   and synonyms, weighted so rare words count more.
   ==================================================== */

import { BANK } from "./chanbank";
import { normalize } from "./parser";

export interface MeaningHit { id: string; score: number }

/* Below this, it's not a match: she'd rather say something generic than answer the wrong question */
export const WORDS_MIN = 0.6;

const STOP = new Set([
  "a", "an", "the", "is", "are", "am", "was", "were", "be", "do", "does", "did", "to", "of", "in", "on", "at", "it", "that", "this", "me",
  "my", "i", "i'm", "you", "your", "you're", "u", "can", "could", "would", "should", "will", "what", "what's", "please", "tell", "so",
  "just", "really", "and", "or", "for", "with", "have", "has", "there", "any", "some", "much", "very", "get", "got", "about", "ok", "oh",
  "hey", "like", "please", "pls", "um", "uh", "well", "then", "now", "yes", "no", "hmm", "isw-chan", "chan",
]);
const SYNONYMS: Record<string, string> = {
  made: "make", built: "make", build: "make", create: "make", created: "make", creator: "make", maker: "make", programmed: "make", coded: "make",
  wrote: "make", write: "make", parents: "make", favorite: "fav", favourite: "fav", fave: "fav", afraid: "fear", scared: "fear", scare: "fear",
  scary: "fear", home: "live", house: "live", located: "live", location: "live", rest: "sleep", tired: "sleep", buddy: "friend", pal: "friend",
  boyfriend: "date", girlfriend: "date", dating: "date", crush: "date", single: "date", partner: "date", eat: "food", dinner: "food",
  lunch: "food", hungry: "food", song: "music", sing: "music", songs: "music", listen: "music", kitty: "cat", firewall: "cat", sad: "sad",
  unhappy: "sad", depressed: "sad", cry: "sad", happy: "happy", joy: "happy", glad: "happy", old: "age", born: "age", birthday: "age",
  age: "age", member: "join", membership: "join", signup: "join", club: "isw", association: "isw", watching: "spy", track: "spy",
  tracking: "spy", spying: "spy", data: "spy", privacy: "spy", code: "source", github: "source", flag: "flag", flags: "flag", hint: "flag",
  stuck: "stuck", impossible: "stuck", boss: "nexus", final: "nexus", die: "death", dying: "death", unplug: "death", unplugged: "death",
  dead: "death", tips: "tip", advice: "tip", strategy: "tip", recommend: "recommend", suggestion: "recommend", movie: "watch", series: "watch",
  show: "watch", look: "appearance", face: "appearance", wearing: "appearance", ai: "ai", chatgpt: "ai", gpt: "ai", llm: "ai", bot: "ai",
  robot: "ai", human: "ai", person: "ai",
};

function wordsOf(text: string): string[] {
  return normalize(text).trim().split(" ").filter((w) => w && !STOP.has(w))
    .map((w) => SYNONYMS[w] ?? (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .map((w) => SYNONYMS[w] ?? w);
}

const PHRASES: { id: string; words: string[] }[] = Object.entries(BANK).flatMap(([id, qs]) => qs.map((q) => ({ id, words: [...new Set(wordsOf(q))] })));
const IDF = (() => {
  const df = new Map<string, number>();
  for (const p of PHRASES) for (const w of p.words) df.set(w, (df.get(w) ?? 0) + 1);
  const n = PHRASES.length;
  return (w: string) => Math.log(1 + n / (df.get(w) ?? 0.5));
})();
const NORM = PHRASES.map((p) => Math.sqrt(p.words.reduce((s, w) => s + IDF(w) ** 2, 0)));

export function matchByWords(input: string): MeaningHit | null {
  const words = [...new Set(wordsOf(input))];
  if (words.length === 0) return null;
  const inNorm = Math.sqrt(words.reduce((s, w) => s + IDF(w) ** 2, 0));
  let best: MeaningHit | null = null;
  PHRASES.forEach((p, i) => {
    if (NORM[i] === 0) return;
    const shared = words.filter((w) => p.words.includes(w));
    if (shared.length === 0) return;
    const score = shared.reduce((s, w) => s + IDF(w) ** 2, 0) / (inNorm * NORM[i]);
    if (!best || score > best.score) best = { id: p.id, score };
  });
  return best;
}

/* The answer to use, if the words are sure enough */
export function bestMeaning(input: string): MeaningHit | null {
  const w = matchByWords(input);
  return w && w.score >= WORDS_MIN ? w : null;
}
