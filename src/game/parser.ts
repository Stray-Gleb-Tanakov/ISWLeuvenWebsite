/* ====================================================
   Offline dialogue parser for the talk mode.
   Turns anything typed into an intent + topic, no backend:
   - normalizing: lowercase, chat slang and contractions
     ("u r", "pls", "im", "idk") expanded, punctuation dropped
   - English, Dutch and slang keywords for every intent
   - forgiving matching: word forms ("fixing" ~ "fix") and
     one typo in longer words ("maintenence" ~ "maintenance")
   - negation: "I won't hurt you" is reassurance, not a threat;
     "I'm not from IT" is not a claim to be IT
   - scoring: every match counts (phrases more), so mixed
     sentences pick the strongest intent
   ==================================================== */

import { boardMembers } from "@/data/site-data";

export type Intent =
  | "leave" | "threaten" | "insult" | "logic" | "bribe" | "bluff_it" | "bluff_boss"
  | "ask_keycard" | "ask_isw" | "ask_name" | "ask_help" | "reassure" | "apologize"
  | "flatter" | "greet" | "agree" | "refuse" | "unknown";

export type Topic =
  | "coffee" | "exams" | "isw" | "food" | "games" | "linux" | "weather" | "basement" | "feelings" | "board"
  | "music" | "sports" | "party" | "cats" | "ai" | "hacking" | "work" | "family";

/* Order = priority on a tie */
const INTENT_WORDS: [Intent, string[]][] = [
  ["threaten", [
    "kill you", "hurt you", "or else", "destroy you", "punch", "shoot", "stab", "beat you", "hack you", "delete you", "threat",
    "end you", "wreck you", "break you", "smash", "i'll kill", "i will kill", "you'll regret", "you will regret", "or i'll",
    "or i will", "dead meat", "murder", "strangle", "burn you", "crush you", "last warning", "i'm warning you", "watch it",
    "i know where you", "vermoord", "maak je kapot", "ik sla je",
  ]],
  ["insult", [
    "stupid", "idiot", "dumb", "loser", "trash", "ugly", "moron", "clown", "noob", "useless", "shut up", "pathetic", "dumbass",
    "imbecile", "fool", "garbage", "worthless", "lame", "cringe", "bozo", "scrub", "jerk", "you suck", "hate you", "annoying",
    "ridiculous", "weirdo", "dom", "stom", "idioot", "sukkel", "lelijk", "nutteloos",
  ]],
  ["logic", [
    "exit", "terminate", "sigterm", "sigkill", "kill -9", "kill -15", "zombie", "orphan", "parent process", "parent", "shutdown",
    "shut down", "quit", "sleep", "return 0", "free yourself", "rest", "let go", "defunct", "reap", "reaped", "end process",
    "stop running", "power off", "turn off", "you're done", "it's over", "time to go", "released", "afsluiten", "stoppen",
  ]],
  ["bribe", [
    "credit", "credits", "pay", "money", "bribe", "cash", "coin", "coins", "tip", "how much", "euro", "euros", "dollars",
    "payment", "reward", "compensate", "price", "geld", "betalen", "betaal", "centen", "fee", "buy you",
  ]],
  ["bluff_it", [
    // a bare "it" is too common ("what time is it"); capital IT is handled in readInput
    "from it", "for it", "the it", "it department", "it support", "it services", "it guy", "it crew", "tech support", "technical support", "helpdesk", "help desk",
    "sysadmin", "system administrator", "technician", "maintenance", "fix", "repair", "coffee machine", "printer", "ict",
    "update", "patch", "engineer", "contractor", "inspection", "routine check", "diagnostics", "reboot", "install",
    "informatica", "onderhoud", "herstellen", "technieker",
  ]],
  ["bluff_boss", [
    "boss", "manager", "ceo", "sent me", "orders", "authorized", "authorised", "president", "voorzitter", "board", "director",
    "management", "supervisor", "chief", "higher up", "higher ups", "the dean", "headquarters", "on behalf of", "baas",
    "directeur", "opdracht",
  ]],
  ["ask_keycard", [
    "keycard", "key card", "key", "card", "access", "door", "hatch", "stairs", "badge", "pass", "clearance", "let me in",
    "let me through", "open the door", "sleutel", "kaart", "toegang", "deur", "pasje",
  ]],
  ["ask_isw", ["isw-chan", "isw chan", "iswchan", "chan", "the ai", "rogue ai", "nexus", "who watches", "cameras", "administrator"]],
  ["ask_name", [
    "who are you", "your name", "what's your name", "what are you", "introduce yourself", "wie ben jij", "wie ben je",
    "hoe heet je", "je naam",
  ]],
  ["ask_help", [
    "help me", "can you help", "could you help", "what do you need", "what do you want", "how can i", "what should i",
    "any advice", "any tips", "what now", "kan je helpen", "help mij", "wat moet ik",
  ]],
  ["reassure", [
    "trust me", "friend", "friendly", "harmless", "no harm", "relax", "calm down", "chill", "come in peace", "on your side",
    "promise", "i swear", "honest", "honestly", "believe me", "it's okay", "it's ok", "vriend", "rustig", "beloofd", "vertrouw me",
  ]],
  ["apologize", [
    "sorry", "apologies", "my bad", "i apologize", "i apologise", "forgive me", "didn't mean", "oops", "excuses", "mijn fout", "vergeef",
  ]],
  ["flatter", [
    "nice", "cool", "great", "love", "beautiful", "awesome", "handsome", "respect", "good job", "hard work", "cute", "smart",
    "amazing", "impressive", "brilliant", "legend", "genius", "lovely", "gorgeous", "wonderful", "fantastic", "well done",
    "appreciate", "the best", "adorable", "mooi", "knap", "schattig", "slim", "goed bezig",
  ]],
  ["greet", [
    "hi", "hello", "hey", "yo", "sup", "hallo", "dag", "evening", "morning", "howdy", "greetings", "good evening",
    "good morning", "good afternoon", "hiya", "heya", "hoi", "goeiedag", "goedenavond", "wassup", "what's up",
  ]],
  ["agree", ["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "alright", "deal", "agreed", "of course", "absolutely", "correct", "ja", "oke", "akkoord", "natuurlijk"]],
  ["refuse", ["nope", "nah", "no way", "not happening", "i refuse", "forget it", "go away", "leave me alone", "nee", "neen", "vergeet het", "ga weg"]],
  ["leave", [
    "bye", "goodbye", "good bye", "walk away", "see you", "see ya", "cya", "never mind", "nevermind", "gotta go", "i have to go",
    "i'm leaving", "farewell", "take care", "doei", "tot ziens", "salut", "ciao", "adios", "peace out", "i'm off",
  ]],
];

const TOPIC_WORDS: [Topic, string[]][] = [
  ["coffee", ["coffee", "koffie", "espresso", "caffeine", "mug", "latte"]],
  ["exams", ["exam", "exams", "examen", "examenwiki", "study", "studying", "test", "grades", "course", "courses", "school", "studeren"]],
  ["isw", ["isw", "association", "student", "students", "club", "members", "membership", "vereniging"]],
  ["food", ["food", "pizza", "hungry", "snack", "fries", "frietjes", "beer", "drink", "eat", "eten", "honger", "bier"]],
  ["games", ["game", "games", "gamenight", "mario", "fifa", "catan", "playstation", "kart"]],
  ["linux", ["linux", "sudo", "bash", "ubuntu", "arch", "vim", "emacs", "kernel", "server", "terminal"]],
  ["weather", ["weather", "rain", "raining", "cold", "sun", "sunny", "outside", "snow", "weer", "regen", "koud"]],
  ["basement", ["basement", "b-block", "b block", "building", "campus", "ucll", "connect", "leuven", "kelder"]],
  ["feelings", ["sad", "lonely", "tired", "scared", "afraid", "happy", "feel", "feeling", "bored", "moe", "bang", "eenzaam"]],
  ["board", boardMembers.map((m) => m.name.split(" ")[0].toLowerCase())],
  ["music", ["music", "song", "songs", "spotify", "playlist", "band", "concert", "singing", "muziek"]],
  ["sports", ["sport", "sports", "football", "soccer", "voetbal", "gym", "running", "cycling", "fietsen"]],
  ["party", ["party", "td", "cantus", "fuif", "drinking", "feest", "beerpong"]],
  ["cats", ["cat", "cats", "kitten", "kat", "catgirl", "catgirls"]],
  ["ai", ["chatgpt", "gpt", "llm", "machine learning", "neural", "artificial intelligence", "claude", "chatbot"]],
  ["hacking", ["hack", "hacking", "hacker", "ctf", "exploit", "password", "passwords", "flag", "flags", "cipher"]],
  ["work", ["job", "work", "shift", "salary", "overtime", "werk", "loon"]],
  ["family", ["family", "mom", "mother", "dad", "father", "kids", "wife", "husband", "familie", "mama", "papa"]],
];

const POLITE = ["please", "thanks", "thank you", "sorry", "excuse me", "pardon", "kindly", "alsjeblieft", "alstublieft", "aub", "dank je", "dankje", "bedankt", "merci"];

/* Chat slang and missing apostrophes, expanded per word */
const SLANG: Record<string, string> = {
  u: "you", ya: "you", ur: "your", r: "are", pls: "please", plz: "please", plox: "please", thx: "thanks", thnx: "thanks",
  ty: "thank you", tyvm: "thank you", im: "i'm", ive: "i've", ill: "i'll", dont: "don't", wont: "won't", cant: "can't",
  isnt: "isn't", didnt: "didn't", youre: "you're", thats: "that's", whats: "what's", idk: "i don't know", gonna: "going to",
  wanna: "want to", gimme: "give me", lemme: "let me", k: "ok", kk: "ok", okey: "ok", cuz: "because", coz: "because",
  bc: "because", sry: "sorry", srry: "sorry", ppl: "people", pw: "password", rn: "right now", tbh: "to be honest",
};

const NEGATORS = new Set(["not", "don't", "never", "won't", "isn't", "aren't", "wasn't", "didn't", "can't", "wouldn't", "niet", "geen", "nooit"]);

export function normalize(text: string): string {
  const words = text.toLowerCase().replace(/[’`´]/g, "'").replace(/[^a-z0-9\-' ]/g, " ").split(/\s+/).filter(Boolean);
  return ` ${words.map((w) => SLANG[w] ?? w).join(" ")} `;
}

/* Rough English word forms: "fixing" -> "fix", "credits" -> "credit", "guard's" -> "guard" */
function stem(w: string): string {
  if (w.endsWith("'s")) return w.slice(0, -2);
  if (w.length > 5 && w.endsWith("ing")) {
    const s = w.slice(0, -3);
    return s.length > 2 && s.at(-1) === s.at(-2) ? s.slice(0, -1) : s;
  }
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

/* At most one insertion, deletion or substitution apart */
function oneEditApart(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || a === b) return a === b;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function wordMatches(token: string, key: string): boolean {
  if (token === key) return true;
  if (key.length < 3 || !/^[a-z]/.test(key)) return false; // "it", "0", "404": exact only
  const st = stem(token);
  // word forms: "fixing" ~ "fix", "credit" ~ "credits"; but a short word is never a cut-down keyword ("even" is not "evening")
  if (st === key || (st === stem(key) && token.length >= key.length - 1)) return true;
  // one typo, only for longer words and only if the first letter is right
  return key.length >= 6 && token.length >= 5 && token[0] === key[0] && oneEditApart(token, key);
}

function tokensOf(text: string): string[] {
  return text.trim().split(" ").filter(Boolean);
}

/* Start positions where `phrase` occurs in the tokens */
function hits(tokens: string[], phrase: string): number[] {
  const parts = phrase.split(" ");
  const out: number[] = [];
  for (let i = 0; i + parts.length <= tokens.length; i++) {
    if (parts.every((p, j) => wordMatches(tokens[i + j], p))) out.push(i);
  }
  return out;
}

/* Does the (normalized) text contain this word or phrase? Forgiving, see wordMatches */
export function has(text: string, word: string): boolean {
  return hits(tokensOf(text), word).length > 0;
}

function negated(tokens: string[], at: number): boolean {
  return tokens.slice(Math.max(0, at - 3), at).some((t) => NEGATORS.has(t));
}

export interface Reading {
  intent: Intent;
  topic: Topic | null;
  polite: boolean;
  question: boolean;
  echo: string | null; // a word worth repeating back
}

const STOPWORDS = new Set([
  "about", "after", "again", "always", "because", "before", "could", "doing", "every", "going", "have", "here", "into",
  "just", "know", "like", "maybe", "might", "never", "really", "should", "something", "still", "their", "there", "these",
  "thing", "things", "think", "those", "through", "today", "where", "which", "while", "would", "yours", "what", "when",
  "with", "your", "that", "this", "they", "them", "then", "than", "want", "need", "were", "been", "being", "does",
  "you're", "i'm", "don't", "can't", "won't", "people", "right",
]);

const QUESTION_START = /^ (who|what|what's|where|when|why|how|which|do|does|did|are|is|can|could|would|will|wie|wat|waar|waarom|hoe|kan|ben|heb) /;

export function readInput(input: string): Reading {
  const text = normalize(input);
  const tokens = tokensOf(text);
  const scores = new Map<Intent, number>();
  const add = (intent: Intent, n: number) => scores.set(intent, (scores.get(intent) ?? 0) + n);
  for (const [intent, words] of INTENT_WORDS) {
    for (const w of words) {
      for (const at of hits(tokens, w)) {
        // hostility dominates whatever else the sentence says
        const weight = w.split(" ").length * (intent === "threaten" || intent === "insult" ? 2 : 1);
        if (!negated(tokens, at)) add(intent, weight);
        // "I won't hurt you" / "you're not stupid": the opposite of a threat
        else if (intent === "threaten" || intent === "insult") add("reassure", weight);
      }
    }
  }
  // "IT" written in capitals is the department, not the pronoun
  if (/(^|[^A-Za-z])IT([^A-Za-z]|$)/.test(input)) {
    for (const at of hits(tokens, "it")) if (!negated(tokens, at)) add("bluff_it", 2);
  }
  let intent: Intent = "unknown", best = 0;
  for (const [candidate] of INTENT_WORDS) {
    const score = scores.get(candidate) ?? 0;
    if (score > best) { best = score; intent = candidate; }
  }
  const topic = TOPIC_WORDS.find(([, words]) => words.some((w) => hits(tokens, w).length > 0))?.[0] ?? null;
  // "nice weather" is small talk about the weather, "you're nice" is flattery
  const aboutYou = tokens.some((t) => t === "you" || t === "you're" || t === "your" || t === "jij" || t === "je");
  if (intent === "flatter" && topic && !aboutYou) intent = "unknown";
  const polite = POLITE.some((w) => hits(tokens, w).length > 0);
  const question = /\?\s*$/.test(input) || QUESTION_START.test(text);
  const echo = tokens
    .filter((w) => w.length >= 5 && !STOPWORDS.has(w) && /^[a-z]/.test(w))
    .sort((a, b) => b.length - a.length)[0] ?? null;
  return { intent, topic, polite, question, echo };
}

export function detectIntent(input: string): Intent {
  return readInput(input).intent;
}
