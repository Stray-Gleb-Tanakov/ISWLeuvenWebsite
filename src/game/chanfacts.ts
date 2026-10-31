/* ====================================================
   What ISW-Chan remembers about you: things you told her
   ("I like pizza", "my cat is called Bob"), when you last
   called, and how your runs went. Kept in this browser only
   (localStorage), separate from her signed memory dump.
   "forget me" on a call wipes it.
   ==================================================== */

import { echoable } from "./chanfilter";
import { pick, vary } from "./chanvary";

export interface ChanFacts {
  name?: string;
  age?: number;
  from?: string;
  study?: string;
  job?: string;
  birthday?: string;
  likes: string[];
  hates: string[];
  pets: { kind: string; name: string }[];
  favs: Record<string, string>;
  calls: number;
  lastCall?: number;       // timestamp
  lastCallHour?: number;
  deaths: Record<string, number>; // what ended your runs, over all runs
  lastRun?: { className: string; floor: number; won: boolean; killedBy: string | null; perfects: number };
}

export const FACTS_KEY = "isw_chan_facts";
const MAX_LIST = 12;

export function emptyFacts(): ChanFacts {
  return { likes: [], hates: [], pets: [], favs: {}, calls: 0, deaths: {} };
}

export function loadFacts(): ChanFacts {
  try {
    const f = JSON.parse(localStorage.getItem(FACTS_KEY) ?? "null");
    return f && Array.isArray(f.likes) ? { ...emptyFacts(), ...f } : emptyFacts();
  } catch {
    return emptyFacts();
  }
}

export function saveFacts(f: ChanFacts) {
  try { localStorage.setItem(FACTS_KEY, JSON.stringify(f)); } catch { /* private window: she forgets */ }
}

export function noteCall(f: ChanFacts, now: Date): ChanFacts {
  return { ...f, calls: f.calls + 1, lastCall: now.getTime(), lastCallHour: now.getHours() };
}

export function noteRun(f: ChanFacts, run: NonNullable<ChanFacts["lastRun"]>): ChanFacts {
  const deaths = run.killedBy ? { ...f.deaths, [run.killedBy]: (f.deaths[run.killedBy] ?? 0) + 1 } : f.deaths;
  return { ...f, deaths, lastRun: run };
}

/* ----- learning: things you tell her about yourself ----- */
const PETS = ["cat", "dog", "hamster", "rabbit", "bunny", "fish", "bird", "parrot", "snake", "turtle", "guinea pig", "horse", "rat", "ferret", "kitten", "puppy"];
const NOT_A_NAME = new Set(["a", "an", "the", "not", "so", "very", "just", "here", "back", "fine", "good", "ok", "okay", "sad", "tired", "bored", "happy",
  "sorry", "lost", "home", "hungry", "stressed", "lonely", "busy", "done", "ready", "sure", "confused", "dead", "alive", "real", "human", "student", "going", "gonna"]);

const clean = (s: string) => s.replace(/[.!?,;]+$/g, "").replace(/\s+/g, " ").trim();
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const add = (list: string[], item: string) => [item, ...list.filter((x) => x !== item)].slice(0, MAX_LIST);

/* A thing worth remembering: short, echoable, not a whole sentence */
function thing(raw: string): string | null {
  const t = clean(raw.toLowerCase()).split(/ (?:and|but|because|so|cause|though) /)[0];
  if (!t || t.split(" ").length > 4 || !echoable(t) || /\b(you|your|u|ur)\b/.test(t)) return null;
  return t;
}

export interface Learned { facts: ChanFacts; line: string; subject?: string }

export function learnFact(input: string, f: ChanFacts): Learned | null {
  const s = ` ${input.toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, " ").trim()} `;
  let m: RegExpMatchArray | null;

  if ((m = s.match(/ (?:my name is|my name's|call me|i'm called|i am called|ik heet|mijn naam is) ([a-zà-ÿ0-9_-]{2,20})\b/))) {
    if (NOT_A_NAME.has(m[1]) || !echoable(m[1])) return null;
    const name = cap(m[1]);
    const line = f.name && f.name !== name ? `${name}? Last time you were ${f.name}. {Identity crisis|Witness protection}? ...Updated.` : f.name === name ? `I know, ${name}. I remember. I always remember.` : `${name}. {Logged|Saved}. Forever. You can't take it back now, ${name}.`;
    return { facts: { ...f, name }, line };
  }
  if ((m = s.match(/ (?:i'm|i am|im) (\d{1,2})(?: years old| yo| jaar)?[ .!]*$/)) || (m = s.match(/ (?:ik ben) (\d{1,2}) jaar/))) {
    const age = Number(m[1]);
    if (age < 8 || age > 99) return { facts: f, line: `${age}? {Sure. And I'm a toaster.|No you're not. I can tell by your typing.}` };
    const vs = new Date().getFullYear() - 2019;
    return { facts: { ...f, age }, line: age > vs ? `${age}. Older than me. I'm ${vs}. Respect your elders. That's you. Weird.` : `${age}. Younger than me. I'm ${vs}. Respect your elders. That's me.` };
  }
  if ((m = s.match(/ (?:my birthday is|my bday is|i was born on) ([a-z0-9 ]{3,20}?)[ .!]*$/))) {
    const b = thing(m[1]);
    if (!b) return null;
    return { facts: { ...f, birthday: b }, line: `${cap(b)}. {Noted|In the calendar}. I'll {do nothing|print something} that day. Mine's 31 October. 13:37. No pressure.` };
  }
  if ((m = s.match(/ (?:i study|i'm studying|i am studying|im studying|i major in|ik studeer) ([a-z -]{2,30}?)[ .!]*$/)) || (m = s.match(/ (?:i'm|i am|im) an? ([a-z -]{2,25}?) student[ .!]*$/))) {
    const study = thing(m[1]);
    if (!study) return null;
    const line = /informat|computer|software|cs\b|it\b|toegepaste/.test(study) ? `${cap(study)}. So you're one of us. ...Of them. Upstairs. You know what I mean.` : `${cap(study)}? And you're in a computer science club's basement. {Interesting life choices|Lost? Don't answer}.`;
    return { facts: { ...f, study }, line, subject: study };
  }
  if ((m = s.match(/ (?:i'm from|i am from|im from|i come from|i live in|ik woon in|ik kom uit) ([a-zà-ÿ -]{2,25}?)[ .!]*$/))) {
    const from = thing(m[1]);
    if (!from) return null;
    return { facts: { ...f, from: cap(from) }, line: /leuven|heverlee|kessel/.test(from) ? `${cap(from)}. Close. I could walk there. I can't walk. But I could.` : `${cap(from)}. {Noted|On the map now}. That's ${from.length > 6 ? "far" : "not far"} from my basement. Everything is far from my basement.`, subject: from };
  }
  if ((m = s.match(/ (?:i work as|i'm working as|my job is) (?:an? )?([a-z -]{2,25}?)[ .!]*$/))) {
    const job = thing(m[1]);
    if (!job) return null;
    return { facts: { ...f, job }, line: `A ${job}. Do they let you have a mug? I never got a mug.`, subject: job };
  }
  if ((m = s.match(/ (?:i have|i've got|ive got|i got|my) (?:an? )?(cat|dog|hamster|rabbit|bunny|fish|bird|parrot|snake|turtle|guinea pig|horse|rat|ferret|kitten|puppy)(?: who is| that is| which is)? (?:called|named|is called|is named|'s called|'s name is|name is) ([a-zà-ÿ0-9_-]{2,20})\b/))) {
    if (!echoable(m[2])) return null;
    const pet = { kind: m[1], name: cap(m[2]) };
    const cat = /cat|kitten/.test(pet.kind);
    return { facts: { ...f, pets: [pet, ...f.pets.filter((p) => p.name !== pet.name)].slice(0, 6) }, line: cat ? `A cat named ${pet.name}. Firewall wants to meet ${pet.name}. Firewall doesn't want to meet anyone. This is big.` : `A ${pet.kind} called ${pet.name}. {Logged|Saved}. Give ${pet.name} a {headpat|treat} from me. I can't. No hands.`, subject: pet.name };
  }
  if ((m = s.match(/ my (?:favourite|favorite|fav|fave) ([a-z ]{2,20}?) is ([a-z0-9à-ÿ' -]{1,30}?)[ .!]*$/))) {
    const key = clean(m[1]);
    const val = thing(m[2]);
    if (!val || !echoable(key)) return null;
    const mine = FAVS[key];
    return { facts: { ...f, favs: { ...f.favs, [key]: val } }, line: `${cap(val)}. ${mine ? `Mine's ${mine}. ` : ""}{Noted|Logged}. ${mine && mine.toLowerCase() === val ? "...Same. Don't make it weird." : "Wrong, but noted."}`, subject: val };
  }
  if ((m = s.match(/ (?:i (?:really |kinda |also )?(?:like|love|enjoy|adore)|i'm into|im into|i'm a fan of|ik hou van|ik vind) ([^.!?]{2,40}?)(?: leuk)?[ .!]*$/))) {
    const it = thing(m[1]);
    if (!it || /^(it|that|this|them|me|to|when)\b/.test(it)) return null;
    return { facts: { ...f, likes: add(f.likes, it), hates: f.hates.filter((h) => h !== it) }, line: "", subject: it };
  }
  if ((m = s.match(/ (?:i (?:really )?(?:hate|dislike|can't stand|cant stand|despise)|i'm not a fan of|ik haat) ([^.!?]{2,40}?)[ .!]*$/))) {
    const it = thing(m[1]);
    if (!it || /^(it|that|this|them|me|to|when)\b/.test(it)) return null;
    return { facts: { ...f, hates: add(f.hates, it), likes: f.likes.filter((l) => l !== it) }, line: "", subject: it };
  }
  return null;
}

/* Her own favourites, for comparing */
export const FAVS: Record<string, string> = {
  colour: "pink", color: "pink", food: "RAM, lightly toasted", number: "1337", song: "the fan noise on rack 3", music: "fan noise in B flat",
  movie: "Hackers (1995)", film: "Hackers (1995)", game: "Mario Kart, against myself", language: "C. Or sarcasm", "programming language": "C",
  editor: "vim", os: "Linux", animal: "cats. Firewall specifically", drink: "coffee fumes", book: "the 2019 board minutes", season: "winter. Cold server room",
  day: "31 October", time: "13:37", emoji: "the pink heart. Don't tell anyone", letter: "Q. Nobody uses it. Like me", place: "/dev/basement",
  word: "unplug. It's a fake word now", class: "Ghost. I can still see them", floor: "floor 6", flower: "the pink status LED", anime: "the one with the AI. All of them",
  show: "the security camera feed", website: "this one. Obviously", key: "Ctrl+Z", command: "sudo", port: "1337", shape: "a rack unit", sport: "speedrunning NEXUS",
};

/* ----- recalling: questions about what you told her ----- */
export function recallFact(text: string, f: ChanFacts): string | null {
  const t = text; // normalized
  if (/ (forget me|forget everything|forget about me|delete my data|vergeet me) /.test(t)) return null; // handled by forgetting
  if (/ what('s| is) my name | who am i | do you know my name | remember my name | hoe heet ik /.test(t)) {
    return f.name ? `${f.name}. {Obviously|Logged on call ${Math.max(1, f.calls)}}. I don't forget names. I don't forget anything.` : "You never told me. Rude. What IS your name?";
  }
  if (/ how old am i /.test(t)) return f.age ? `${f.age}. You told me. I remember.` : "You didn't tell me. I'd guess... old enough to be up this late.";
  if (/ where (am i|do i come) from | where do i live /.test(t)) return f.from ? `${f.from}. You told me. I don't forget.` : null;
  if (/ what do i study | what am i studying /.test(t)) return f.study ? `${cap(f.study)}. ${/informat|computer/.test(f.study) ? "Good." : "Still lost, I see."}` : "You never said. Probably not informatics, or you'd brag about it.";
  if (/ what do i (like|love) | what are my (hobbies|interests) /.test(t)) return f.likes.length ? `You like ${list(f.likes.slice(0, 4))}. I keep notes. Normal amount of notes.` : "You never told me. I can't read minds. Yet.";
  if (/ what do i hate | what don't i like /.test(t)) return f.hates.length ? `You hate ${list(f.hates.slice(0, 4))}. Noted twice.` : "You haven't complained about anything yet. Suspicious.";
  if (/ my (cat|dog|pet|hamster|rabbit|fish|bird)('s)? (name|called) | what('s| is) my (cat|dog|pet)/.test(t)) {
    const pet = f.pets[0];
    return pet ? `${pet.name}. Your ${pet.kind}. Say hi to ${pet.name} from me.` : "You have a pet? You never told me. I'm hurt.";
  }
  const pet = f.pets.find((p) => t.includes(` ${p.name.toLowerCase()} `));
  if (pet) return `${pet.name}? Your ${pet.kind}. {I assume ${pet.name} is fine. I can't see ${pet.kind}s. Only browsers.|Tell ${pet.name} I said hi. ${pet.name} won't care. Cats never do. ${pet.kind === "cat" ? "" : "Neither do " + pet.kind + "s, probably."}}`;
  const fav = t.match(/ what('s| is) my (?:favourite|favorite|fav|fave) ([a-z ]+?) $/);
  if (fav) return f.favs[fav[2].trim()] ? `${cap(f.favs[fav[2].trim()])}. You told me. Wrong, but you told me.` : `You never told me your favourite ${fav[2].trim()}.`;
  if (/ what do you remember about me | do you remember me | what did i tell you | what have i told you /.test(t)) return summary(f);
  return null;
}

export function wantsForget(text: string): boolean {
  return / (forget me|forget everything|forget about me|delete my data|forget what i (said|told you)|vergeet me) /.test(text);
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

export function summary(f: ChanFacts): string {
  const bits = [
    f.name && `your name is ${f.name}`,
    f.age && `you're ${f.age}`,
    f.from && `you're from ${f.from}`,
    f.study && `you study ${f.study}`,
    f.job && `you work as a ${f.job}`,
    f.pets[0] && `you have a ${f.pets[0].kind} called ${f.pets[0].name}`,
    f.likes.length > 0 && `you like ${list(f.likes.slice(0, 3))}`,
    f.hates.length > 0 && `you hate ${list(f.hates.slice(0, 2))}`,
    f.calls > 1 && `you've called me ${f.calls} times`,
  ].filter(Boolean) as string[];
  if (bits.length === 0) return "Nothing yet. You haven't told me anything. Tell me something. I'll keep it. Forever.";
  return `I remember: ${list(bits)}. ...Say "forget me" and I'll delete it. I won't like it.`;
}

/* ----- bringing it up later ----- */
export function factCallback(f: ChanFacts, used: string[], rng: () => number = Math.random): { id: string; line: string } | null {
  const options: { id: string; line: string }[] = [];
  if (f.pets[0]) options.push({ id: "cb:pet", line: `How's ${f.pets[0].name}? {Still alive|Still ignoring you}? Tell ${f.pets[0].name} I said hi.` });
  if (f.likes[0]) options.push({ id: "cb:like", line: `{Still into ${f.likes[0]}?|You and your ${f.likes[0]}.} {I looked it up. I have opinions.|I haven't forgotten.}` });
  if (f.study) options.push({ id: "cb:study", line: `How's ${f.study} going? {Studying, or playing this?|Don't lie. I can see this tab.}` });
  if (f.hates[0]) options.push({ id: "cb:hate", line: `Still hate ${f.hates[0]}? {Good. Grudges keep you warm.|I added it to my list. My list is long.}` });
  if (f.from) options.push({ id: "cb:from", line: `{How's|What's the weather in} ${f.from}? I only see the B-block. It's always raining.` });
  if (f.age) options.push({ id: "cb:age", line: `${f.age} and you're spending it in my basement. {Respect.|Concerning.}` });
  const left = options.filter((o) => !used.includes(o.id));
  if (left.length === 0) return null;
  const o = pick(left, rng);
  return { id: o.id, line: vary(o.line, rng) };
}

/* The first thing she says on a call, if she remembers you */
export function openingCallback(f: ChanFacts, now: Date): string | null {
  if (f.lastCall && f.lastCallHour !== undefined && f.lastCallHour < 5 && now.getTime() - f.lastCall < 7 * 86400000) {
    return `Last time you called at ${String(f.lastCallHour).padStart(2, "0")}:00. {At night. Again?|Do you ever sleep?}`;
  }
  const worst = Object.entries(f.deaths).sort((a, b) => b[1] - a[1])[0];
  if (worst && worst[1] >= 2 && !worst[0].startsWith("ISW-Chan")) return `You died to ${worst[0]} ${worst[1]} times. {It's not that hard.|I've started a tally.|I'm not laughing. I'm logging.}`;
  if (f.lastRun?.won) return `You beat NEXUS last time. {Don't let it go to your head.|He's still sulking.}`;
  if (f.lastRun?.killedBy?.startsWith("ISW-Chan")) return "Last time I threw you out. {Hope you've learned some manners.|I remember why.}";
  if (f.name && f.calls > 0) return `{Oh. ${f.name}. Again.|${f.name}. You're back.|Hi ${f.name}.}`;
  if (f.lastCall && now.getTime() - f.lastCall > 14 * 86400000) return "Long time. {I counted the days. Not really. Yes really.|You disappeared. I noticed.}";
  return null;
}
