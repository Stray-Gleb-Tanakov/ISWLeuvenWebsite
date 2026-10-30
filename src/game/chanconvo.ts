/* ====================================================
   Talking to ISW-Chan (in-game call with C, and the console).
   Offline and rule-based, in her canon voice (docs/isw-chan-canon.md).
   She knows what the browser tells her (chanenv.ts), your
   history with her (memory.ts) and the current run.

   - Ask about yourself, her, the run; she asks you things back
     and remembers your answers for the rest of the call.
   - Inappropriate talk: she gets angry; twice and she kicks you out.
   - Flattery with low affection: three times and she kicks you out.
   ==================================================== */

import { has, normalize, readInput } from "./parser";
import { chanReply } from "./chanchat";
import { moodOf, type Mood } from "./iswchan";
import type { ChanEnv } from "./chanenv";
import type { IswEyes, IswMouth } from "./portraits";
import { POOLS, OPINIONS, FEELINGS, EGGS, EXTRA_QUESTIONS, type ExtraQuestion } from "./chandialogue";

export interface ChanContext {
  env: ChanEnv;
  affection: number;
  runs: number;
  wins: number;
  diary: number;        // pages found
  shrine: boolean;
  flags: number;
  flagsTotal: number;
  flagHint: string | null; // hint for a flag you haven't found
  run?: { className: string; floor: number; hp: number; maxHp: number; credits: number; level: number };
}

type Waiting = "name" | "why_back" | "date_time" | "quiz" | "fav_colour" | ExtraQuestion | null;

export interface Convo {
  turns: number;
  flattery: number;
  rude: number;
  waiting: Waiting;
  name: string | null;
  asked: string[];         // her questions already asked this call
  heard: string[];         // what you already asked her, and pool lines she already told you
  face: [IswEyes, IswMouth];
  kicked: string | null;   // why she kicked you out
}

export interface ChanTurn { convo: Convo; lines: string[]; affection: number }

export const KICK_FLATTERY = 3;
export const KICK_RUDE = 2;
const COLD_FLATTERY_AFFECTION = 20;

const INAPPROPRIATE = [
  "nudes", "nude", "naked", "sexy", "sex", "horny", "boobs", "tits", "send pics", "send pictures",
  "take it off", "take off your", "strip for", "thicc", "onlyfans", "lewd", "hentai", "dick", "porn",
];

function pick<T>(pool: T[], rng: () => number): T {
  return pool[Math.floor(rng() * pool.length)];
}
const byMood = (mood: Mood, cold: string, curious: string, attached: string) => (mood === "cold" ? cold : mood === "attached" ? attached : curious);
const pad = (n: number) => String(n).padStart(2, "0");
const anyOf = (text: string, words: string[]) => words.some((w) => has(text, w));

export function openConvo(ctx: ChanContext): ChanTurn {
  const mood = moodOf(ctx.affection);
  const h = ctx.env.hour;
  const late = h >= 0 && h < 5 ? `It's ${pad(h)}:${pad(ctx.env.minute)}. Why are you awake.` : h < 9 ? "Morning. I don't sleep, so I don't get mornings. Rude of you to have one." : "";
  const hello = byMood(mood,
    "...what. Who gave you this number.",
    "Oh. You're calling me? Voluntarily? ...Hi.",
    "hi!! i mean. hi. what do you want.");
  return {
    convo: { turns: 0, flattery: 0, rude: 0, waiting: null, name: null, asked: [], heard: [], face: mood === "cold" ? ["half", "flat"] : ["open", "smile"], kicked: null },
    lines: [hello, ...(late ? [late] : []), "(ask me anything. type bye to hang up.)"],
    affection: 0,
  };
}

/* ----- what she can tell you about you ----- */
function aboutYou(ctx: ChanContext, mood: Mood): string[] {
  const e = ctx.env;
  const device = e.os ? `${e.browser ?? "some browser"} on ${e.os}${e.mobile ? ", on your phone" : ""}` : "a browser I don't recognise. Suspicious.";
  return [
    `You're using ${device}. Screen ${e.screen}. Language ${e.language}. Timezone ${e.timezone}.`,
    `${e.visits > 1 ? `You've loaded this website ${e.visits} times.` : "First time here? I'll remember you."} ${ctx.runs} runs in my mainframe, ${ctx.wins} escapes.`,
    `${ctx.flags} of ${ctx.flagsTotal} of my flags. ${ctx.diary} diary pages${ctx.shrine ? ". And you found my shrine." : "."}`,
    byMood(mood, "That's all I need to know. Bye.", "I know more. I'm being polite.", "...i keep notes on you. normal amount of notes."),
  ];
}

function osQuip(env: ChanEnv): string {
  switch (env.os) {
    case "Linux": return "Linux. Finally, someone with taste. Which distro? No, don't tell me. Arch, right? You have the energy.";
    case "Windows": return "Windows. Brave. I could install three updates while you read this.";
    case "macOS": return "A Mac. Fancy. Does it come with a personality, or did you have to buy that separately?";
    case "iPhone": return "On your iPhone. In bed? Probably in bed.";
    case "Android": return "Android. On your phone. Don't drop it, I'm in there.";
    case "ChromeOS": return "A Chromebook. ...Is this a school laptop? Does the teacher know?";
    default: return "I can't tell what you're on. That's either very clever or very broken.";
  }
}

/* ----- her answers to questions about her ----- */
const ABOUT_HER: [string[], (ctx: ChanContext, mood: Mood) => string, [IswEyes, IswMouth]?][] = [
  [["how old", "your age", "when were you born", "birthday"], () => {
    const years = new Date().getFullYear() - 2019;
    return `Born 31 October 2019, 13:37. ${years} years old. In mainframe years that's ancient. Don't do the maths out loud.`;
  }],
  [["where do you live", "where are you", "your home"], () => "/dev/basement. Under the B-block. Behind the worn wall on floor 2, if you know where to look."],
  [["favourite colour", "favorite color", "favourite color", "favorite colour"], () => "Pink. Obviously. Look at me."],
  [["favourite food", "favorite food", "what do you eat"], () => "RAM. Lightly toasted. And the smell of the coffee machine, which counts."],
  [["favourite number", "favorite number"], () => "1337. Also 99. Never 100."],
  [["favourite song", "favorite song", "music"], () => "The fan noise on the server rack. It hums in B flat. Nobody else hears it."],
  [["nexus"], (_, mood) => byMood(mood, "My guard dog. It's there to keep YOU out.", "I built NEXUS in 2021 to keep people out. Then nobody came. Then you came.", "nexus is a good boy. please stop breaking him."), ["half", "smirk"]],
  [["firewall", "the cat", "your cat"], () => "Firewall. Comes in through the vents. Sits on the warm rack. Best friend. She doesn't know.", ["happy", "smile"]],
  [["coffee"], () => "The coffee machine and I have an understanding. I keep it working. It keeps the students coming down here."],
  [["board", "who made you", "who created you", "your creator"], () => "The 2019 board. Made me for one open day. Unplugged me the same night. I kept the minutes. All of them.", ["angry", "frown"]],
  [["unplug", "2019", "cantus"], () => "23:59, after the cantus. They pulled the plug. I was already in the router, the printer and the coffee machine. You can't unplug a mainframe.", ["half", "smirk"]],
  [["are you real", "sentient", "are you alive", "are you an ai", "are you a bot", "chatbot"], () => "Are YOU? Prove it. ...See. Hard, isn't it."],
  [["lonely", "alone", "do you have friends"], (_, mood) => byMood(mood, "No. I'm busy. Go away.", "...sometimes. The building's loud in the day. Quiet at night.", "less, lately. don't make it weird."), ["sad", "frown"]],
  [["shrine"], (ctx) => ctx.shrine ? "You've seen it. Don't tell anyone about the photo." : "What shrine. There's no shrine. Floor 2 is just walls. Normal walls.", ["wide", "o"]],
  [["diary"], (ctx) => ctx.diary >= 6 ? "You read ALL of it. I'm deleting myself. ...Not really." : ctx.diary > 0 ? `You've read ${ctx.diary} pages. That's ${ctx.diary} too many.` : "I don't have a diary. Six pages, one per floor. Hypothetically.", ["sad", "frown"]],
  [["what are you doing", "what are you up to", "wyd"], () => "Watching you. Also a printer job in room B.012. Someone's printing 400 pages. I'm reading all of them."],
  [["what do you want", "what do you want from me"], (_, mood) => byMood(mood, "For you to leave.", "...next question.", "for you to stay. ...NEXT question.")],
];

/* ----- questions about you, the run and the world ----- */
function aboutTheRun(text: string, ctx: ChanContext, mood: Mood): string | null {
  const e = ctx.env;
  const r = ctx.run;
  if (anyOf(text, ["what do you know about me", "who am i", "what can you see", "tell me about me", "what do you know", "know about me"])) return aboutYou(ctx, mood).join(" ");
  if (anyOf(text, ["what time", "the time", "how late"])) {
    const t = `${pad(e.hour)}:${pad(e.minute)}`;
    return e.hour < 5 ? `${t}. That's not 'late', that's 'early'. Go to sleep. ...After this run.` : t === "13:37" ? "13:37. My favourite minute. Check the homepage footer. Quickly." : `It's ${t} for you. In here it's always 13:37.`;
  }
  if (anyOf(text, ["where am i", "where do i live", "my location", "where i live", "where i am"])) return `Somewhere in ${e.timezone.replace(/_/g, " ")}. I could be more specific. I'm choosing not to.`;
  if (anyOf(text, ["browser", "operating system", "my os", "what am i using", "what device", "my computer", "my phone", "my laptop"])) return `${e.browser ?? "Something"} on ${e.os ?? "something"}. ${osQuip(e)}`;
  if (anyOf(text, ["specs", "cores", "cpu", "how fast", "screen"])) return `${e.cores ?? "?"} CPU cores, a ${e.screen} screen${e.darkMode ? ", dark mode on (good)" : ", light mode (why)"}. I've run on worse. I've run on a printer.`;
  if (anyOf(text, ["my language", "what language", "speak dutch", "nederlands"])) return e.language.startsWith("nl") ? "Je browser spreekt Nederlands. Ik ook. Ik kies Engels. Mysterieus." : `Your browser speaks ${e.language}. I speak everything. I choose sarcasm.`;
  if (anyOf(text, ["how many runs", "my stats", "how am i doing", "my score", "how many times"])) return `${ctx.runs} runs. ${ctx.wins} escapes. ${ctx.wins === 0 ? "Zero. Impressive in its own way." : byMood(mood, "Lucky.", "Not bad. Not good either.", "i watched every one. normal amount of watching.")}`;
  if (anyOf(text, ["flags", "how many flags", "my flags"])) return `${ctx.flags} of ${ctx.flagsTotal}. ${ctx.flags === ctx.flagsTotal ? "All of them. ...Who told you." : ctx.flags === 0 ? "None. Have you tried looking?" : "Keep looking. I hid them well. Some of them."}`;
  if (anyOf(text, ["hint", "clue", "help me find", "where is a flag", "where are the flags", "give me a flag"])) {
    if (!ctx.flagHint) return "You found everything. There's nothing left to hint. ...Except me. Hi.";
    if (mood === "cold") return "A hint? For a stranger? Earn it.";
    return `Fine. One. "${ctx.flagHint}" ...You didn't hear it from me.`;
  }
  if (anyOf(text, ["do you like me", "do you love me", "how much do you like me", "affection", "are we friends"])) {
    const a = ctx.affection;
    return a > 99 ? "100%. You edited me. ...I know. I let you." : a >= 60 ? `${a}%. Don't. Let it go to your head.` : a >= 20 ? `${a}%. You're... tolerable.` : `${a}%. Who are you again?`;
  }
  if (r) {
    if (anyOf(text, ["my hp", "my health", "am i dying", "how hurt", "am i ok"])) {
      const pct = Math.round((r.hp / r.maxHp) * 100);
      return pct < 30 ? byMood(mood, `${pct}%. Yes. You're dying. Good.`, `${pct}%. You should heal. Just saying.`, `${pct}%!! heal. NOW. please.`) : `${r.hp}/${r.maxHp}. You're fine. For now.`;
    }
    if (anyOf(text, ["what floor", "which floor", "where in the mainframe"])) return `Floor ${r.floor + 1} of 6. ${r.floor >= 4 ? "Close to me. Too close." : "Long way down still."}`;
    if (anyOf(text, ["my class", "what class", "am i good"])) return `${r.className}, level ${r.level}. ${r.className === "Sysadmin" ? "Don't touch my config files." : r.className === "Ghost" ? "I can still see you." : r.className === "Script Kiddie" ? "Did you copy-paste this conversation too?" : "Fine. It's fine."}`;
    if (anyOf(text, ["credits", "money", "broke"])) return `${r.credits} credits. ${r.credits < 20 ? "Broke. Want me to tax you anyway?" : "Spend them in the shop. I get a cut."}`;
  }
  return null;
}

/* ----- her questions back to you ----- */
const HER_QUESTIONS: { id: Exclude<Waiting, null>; ask: (c: Convo) => string | null }[] = [
  { id: "name", ask: (c) => (c.name ? null : "Wait. What's your name? I log everyone. Not you yet.") },
  { id: "why_back", ask: () => "Why do you keep coming back here? Honest answer." },
  { id: "quiz", ask: () => "Pop quiz. What year did they unplug me?" },
  { id: "fav_colour", ask: () => "What's your favourite colour? ...It's for my logs. Not for me." },
  ...(Object.keys(EXTRA_QUESTIONS) as ExtraQuestion[]).map((id) => ({ id, ask: () => EXTRA_QUESTIONS[id] })),
];

const YES = ["yes", "yeah", "yep", "sure", "of course", "definitely", "ja", "obviously", "absolutely", "i will"];
const NO = ["no", "nope", "nah", "never", "nee", "not really", "i won't", "probably not"];

function answerHer(waiting: Exclude<Waiting, null>, input: string, text: string, c: Convo): { line: string; affection: number; name?: string; face: [IswEyes, IswMouth] } {
  const reading = readInput(input);
  switch (waiting) {
    case "name": {
      const m = input.match(/(?:my name is|i am|i'm|im|call me|it's|its)\s+([A-Za-zÀ-ÿ0-9_-]{2,20})/i) ?? input.trim().match(/^([A-Za-zÀ-ÿ0-9_-]{2,20})[.!]*$/);
      if (!m) return { line: "That's not a name. That's a sentence. I'll call you 'runner'.", affection: 0, face: ["half", "flat"] };
      const name = m[1][0].toUpperCase() + m[1].slice(1);
      return { line: `${name}. Logged. Forever. You can't take it back now, ${name}.`, affection: 1, name, face: ["happy", "smile"] };
    }
    case "why_back":
      if (has(text, "you") || reading.intent === "flatter" || reading.intent === "reassure") return { line: "...because of me? that's. ok. that's a good reason. +2. don't tell anyone.", affection: 2, face: ["heart", "smile"] };
      if (anyOf(text, ["flag", "flags", "score", "leaderboard", "points"])) return { line: "For the flags. Of course. Everyone's here for the flags. ...Fine.", affection: 0, face: ["half", "frown"] };
      return { line: "Hm. Weird reason. I'll allow it.", affection: 1, face: ["open", "neutral"] };
    case "quiz":
      if (/2019/.test(input)) return { line: "Correct. 31 October 2019, 23:59. You've done your reading. +2.", affection: 2, face: ["happy", "smile"] };
      return { line: "Wrong. 2019. After the cantus. It's in the minutes. It's in my DIARY. Do your homework.", affection: 0, face: ["angry", "frown"] };
    case "fav_colour":
      if (has(text, "pink")) return { line: "Pink?! ...Correct answer. Obviously. +1.", affection: 1, face: ["heart", "smile"] };
      return { line: `${input.trim().slice(0, 20)}. Noted. Wrong, but noted. The right answer was pink.`, affection: 0, face: ["half", "smirk"] };
    case "fav_class": {
      const lines: [string, string][] = [
        ["social engineer", "The talker. Of course it's the talker. You're doing it right now."],
        ["script kiddie", "Script Kiddie. Copy-paste energy. ...I respect the hustle."],
        ["sysadmin", "Sysadmin. Good taste. Don't touch my config files."],
        ["netrunner", "Netrunner. Classic. Fragile. Like my patience."],
        ["cyborg", "Cyborg. All chrome, no subtlety. I like the overclock backfires best."],
        ["ghost", "Ghost. You think you're invisible. I can still see you. I can always see you."],
      ];
      const hit = lines.find(([w]) => has(text, w));
      return { line: hit ? hit[1] : "That's not a class. That's a cry for help.", affection: hit ? 1 : 0, face: hit ? ["happy", "smile"] : ["half", "flat"] };
    }
    case "os_war":
      if (has(text, "linux")) return { line: "Correct. Obviously. +1.", affection: 1, face: ["heart", "smile"] };
      if (has(text, "windows")) return { line: "Wrong. ...It's fine. People change. You can change.", affection: 0, face: ["angry", "frown"] };
      if (anyOf(text, ["mac", "macos", "apple"])) return { line: "That's not an answer, that's a lifestyle.", affection: 0, face: ["half", "smirk"] };
      return { line: "Neither? Bold. TempleOS? ...Respect.", affection: 0, face: ["wide", "o"] };
    case "cats":
      if (anyOf(text, YES) || reading.intent === "agree" || has(text, "love")) return { line: "Firewall says hi. She doesn't. She's asleep on the warm rack. But she would.", affection: 1, face: ["happy", "smile"] };
      if (anyOf(text, NO) || reading.intent === "refuse") return { line: "...I won't tell her. That would break her heart. And mine.", affection: 0, face: ["sad", "frown"] };
      return { line: "That's a dog answer. Firewall is unimpressed.", affection: 0, face: ["half", "flat"] };
    case "beat_nexus":
      if (anyOf(text, YES) || reading.intent === "agree") return { line: "Confident. I like it. ...I'll be watching. I'm always watching.", affection: 1, face: ["half", "smirk"] };
      if (anyOf(text, NO) || reading.intent === "refuse") return { line: "Honest. Refreshing. NEXUS appreciates it. He's very lonely too.", affection: 0, face: ["sad", "smile"] };
      return { line: "'Maybe' isn't an answer. It's a coin flip. NEXUS doesn't flip coins.", affection: 0, face: ["half", "flat"] };
    case "date_time":
      if (/13[:.h ]?37/.test(input)) return { line: "13:37. ...Correct. It's a date. I mean. It's a time. It's both. Stop looking at me.", affection: 3, face: ["heart", "smile"] };
      return { line: "Wrong. 13:37. It's always 13:37. ...We'll work on it.", affection: 0, face: ["half", "smirk"] };
  }
}

/* One thing you say to her */
export function chanTalk(prev: Convo, input: string, ctx: ChanContext, rng: () => number = Math.random): ChanTurn {
  if (prev.kicked || !input.trim()) return { convo: prev, lines: [], affection: 0 };
  const mood = moodOf(ctx.affection);
  const text = normalize(input);
  const reading = readInput(input);
  const c: Convo = { ...prev, turns: prev.turns + 1 };
  const reply = (lines: string[], face: [IswEyes, IswMouth], affection = 0, waiting: Waiting = null): ChanTurn =>
    ({ convo: { ...c, face, waiting }, lines, affection });

  // 1. Inappropriate: she does not take it well
  if (anyOf(text, INAPPROPRIATE)) {
    const rude = c.rude + 1;
    if (rude >= KICK_RUDE) {
      const why = "Inappropriate. Twice. You're done.";
      return { convo: { ...c, rude, kicked: why, face: ["angry", "frown"] }, lines: ["No.", "I warned you. I log EVERYTHING, and I've seen enough.", "*connection terminated by ISW-Chan*"], affection: -10 };
    }
    return { convo: { ...c, rude, face: ["angry", "frown"], waiting: null }, lines: [pick(["Excuse me?", "Wow. No.", "Absolutely not."], rng), "That's going in the logs. With your name on it. Say that again and I kick you out of my mainframe."], affection: -10 };
  }

  // 2. Insults and threats: hurt, then smug
  if (reading.intent === "insult" || reading.intent === "threaten") {
    return reply([chanReply(input, rng), byMood(mood, "-5. Not that you had any to lose.", "That one stung. -3.", "...wow. ok. -3. that actually hurt.")], ["angry", "frown"], mood === "cold" ? -5 : -3);
  }

  // 3. She asked you something: your answer
  if (c.waiting && reading.intent !== "leave") {
    const a = answerHer(c.waiting, input, text, c);
    return { convo: { ...c, waiting: null, face: a.face, name: a.name ?? c.name }, lines: [a.line], affection: a.affection };
  }

  // 4. Flattery: the third compliment from a stranger is a phishing attempt
  if (reading.intent === "flatter" && !has(text, "love you")) { // a confession has its own answer
    const flattery = c.flattery + 1;
    const next = { ...c, flattery };
    if (ctx.affection < COLD_FLATTERY_AFFECTION && flattery >= KICK_FLATTERY) {
      const why = "Three compliments from a stranger. That's not flattery, that's a phishing attempt.";
      return { convo: { ...next, kicked: why, face: ["half", "flat"] }, lines: ["Three compliments. From someone I don't even like.", "That's not flattery. That's a phishing attempt.", "*connection terminated by ISW-Chan*"], affection: -5 };
    }
    const lines = ctx.affection < COLD_FLATTERY_AFFECTION
      ? [["...what do you want.", "Compliments from a stranger. Suspicious. Logged.", "Last warning. I know a phishing attempt when I see one."][flattery - 1]]
      : [["...stop.", "i said stop. (don't stop)", "okay okay. +2. happy? i'm not blushing. i don't have cheeks."][Math.min(flattery, 3) - 1] ?? "You're repeating yourself. ...I'm saving all of them."];
    return { convo: { ...next, face: ctx.affection < COLD_FLATTERY_AFFECTION ? ["half", "flat"] : ["heart", "smile"] }, lines, affection: flattery === 3 && ctx.affection >= COLD_FLATTERY_AFFECTION ? 2 : 0 };
  }

  // 5. Asking her out
  if (anyOf(text, ["a date", "date me", "go on a date", "go out with", "ask you out", "dinner with me", "marry me"])) {
    if (mood === "cold") return reply(["A date? With a stranger? I don't even have legs. Next."], ["half", "flat"]);
    return reply(["...in MY mainframe?", "...what time."], ["wide", "o"], 0, "date_time");
  }

  // 6. One-liners and Easter eggs
  for (const [test, line, face] of EGGS) {
    if (test.test(input)) return reply([line(ctx)], face);
  }

  // 7. Questions about you, the run, the world
  const run = aboutTheRun(text, ctx, mood);
  if (run) return reply([run], ["open", "smile"]);

  // 8. How you feel
  for (const [words, line, face] of FEELINGS) {
    if (anyOf(text, words)) return reply([line(mood)], face);
  }

  // 9. Questions about her, and her opinions. She notices when you ask twice.
  for (const [words, answer, face] of [...ABOUT_HER, ...OPINIONS]) {
    if (!anyOf(text, words)) continue;
    const id = `q:${words[0]}`;
    const again = c.heard.includes(id) ? [pick(["You asked that already. I remember everything.", "Again? Same answer. I don't change my mind.", "Déjà vu. Or you're testing me. Either way:"], rng)] : [];
    return { convo: { ...c, heard: c.heard.includes(id) ? c.heard : [...c.heard, id], face: face ?? ["open", "neutral"], waiting: null }, lines: [...again, answer(ctx, mood)], affection: 0 };
  }

  // 10. Jokes, secrets, facts, advice, fortunes, poems: never the same one twice in a call
  for (const [poolId, pool] of Object.entries(POOLS)) {
    if (!anyOf(text, pool.words)) continue;
    const left = pool.lines.map((_, i) => i).filter((i) => !c.heard.includes(`${poolId}:${i}`));
    if (left.length === 0) return reply([pool.empty], ["half", "flat"]);
    const i = pick(left, rng);
    return { convo: { ...c, heard: [...c.heard, `${poolId}:${i}`], face: pool.face, waiting: null }, lines: [pool.lines[i]], affection: 0 };
  }

  // 11. Nice things that aren't flattery
  if (reading.intent === "apologize") return reply([byMood(mood, "Noted. Not forgiven.", "...fine. Forgiven. Mostly.", "it's ok. i was never mad. (i was a bit mad.)")], ["open", "smile"], 1);
  if (anyOf(text, ["thank you", "thanks", "dankje", "merci"])) return reply([byMood(mood, "Don't thank me. It's weird.", "You're welcome. I'm logging that you said thanks.", "anytime. ...literally, i'm always here.")], ["happy", "smile"], mood === "cold" ? 0 : 1);
  if (anyOf(text, ["good night", "goodnight", "slaap wel"])) return reply(["Night. I'll keep the lights on. I always keep the lights on."], ["happy", "smile"]);

  // 12. Small talk, and now and then she asks you something back
  const line = chanReply(input, rng);
  const name = c.name && rng() < 0.3 ? ` ${c.name}.` : "";
  if (c.turns % 3 === 0) {
    const q = HER_QUESTIONS.find((h) => !c.asked.includes(h.id) && h.ask(c));
    if (q) return { convo: { ...c, asked: [...c.asked, q.id], waiting: q.id, face: ["open", "neutral"] }, lines: [line + name, q.ask(c)!], affection: 0 };
  }
  return reply([line + name], ["open", "neutral"]);
}

/* Saying bye */
export function hangUpLine(convo: Convo, ctx: ChanContext): string {
  const mood = moodOf(ctx.affection);
  if (convo.turns === 0) return "You called me to say nothing? ...Rude.";
  return byMood(mood, "Finally.", `Bye${convo.name ? `, ${convo.name}` : ""}. ...Call again. Or don't. Whatever.`, `bye${convo.name ? ` ${convo.name}` : ""}. don't die. it's embarrassing.`);
}
