/* ====================================================
   Talking to ISW-Chan (the console and the talk-mode
   intercom). Offline: no server, no API.
   In her canon voice (docs/isw-chan-canon.md).

   What she can do, roughly in the order she tries it:
   - won't put up with inappropriate talk (chanfilter.ts):
     angry once, kicked out the second time; and three
     compliments from a stranger is a phishing attempt
   - remembers what you tell her about yourself, across
     calls, and brings it up later (chanfacts.ts)
   - follow-ups: "why?", "really?", "and you?", and "it" /
     "that" mean the last thing you talked about (chanfollow.ts)
   - knows your browser, your runs, this run (chanenv.ts)
   - her own lines, opinions, jokes (chandialogue.ts)
   - slot patterns: "do you like X", "can you X"... (chanreflect.ts)
   - a question bank, matched by keywords and synonyms
     (chanbank.ts, chanmeaning.ts)
   - reflection: "I feel X" -> "Why do you feel X?"
   - small talk, and now and then she asks you something,
     brings up something you told her, or comments on your run
   Two sentences in one message get two answers.
   ==================================================== */

import { has, normalize, readInput } from "./parser";
import { chanReply } from "./chanchat";
import { moodOf, type Mood } from "./iswchan";
import type { ChanEnv } from "./chanenv";
import type { IswEyes, IswMouth } from "./portraits";
import { POOLS, OPINIONS, FEELINGS, EGGS, EXTRA_QUESTIONS, ABOUT_HER, type ExtraQuestion } from "./chandialogue";
import { isInappropriate, INAPPROPRIATE } from "./chanfilter";
import { emptyFacts, factCallback, learnFact, noteCall, openingCallback, recallFact, summary, wantsForget, type ChanFacts } from "./chanfacts";
import { followUp, GENERIC_DIG, resolvePronouns } from "./chanfollow";
import { reflection, slots, opinionOf } from "./chanreflect";
import { bestMeaning } from "./chanmeaning";
import { ANSWERS, RIDDLES } from "./chananswers";
import { avoidRepeats, pick, vary } from "./chanvary";

export { INAPPROPRIATE };

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
  game?: { perfects: number; perfectBraces: number; bracesFaced: number; damageTaken: number; creditsSpent: number; lockdownsCracked: number; shopVisits: number };
  facts?: ChanFacts;          // what she remembers about you (chanfacts.ts)
  now?: Date;
}

type Waiting = "name" | "why_back" | "date_time" | "quiz" | "fav_colour" | "rps" | "riddle" | ExtraQuestion | null;
type Face = [IswEyes, IswMouth];

export interface Convo {
  turns: number;
  flattery: number;
  rude: number;
  waiting: Waiting;
  name: string | null;
  asked: string[];         // her questions and remarks already used this call
  heard: string[];         // what you already asked her, and pool lines she already told you
  face: Face;
  kicked: string | null;   // why she kicked you out
  facts?: ChanFacts;       // what she knows about you, updated as you talk (the caller saves it)
  topic?: string | null;   // what she last talked about, for "why?" and "tell me more"
  depth?: number;          // how far you've dug into it
  subject?: string | null; // what "it" and "that" mean right now
  recent?: string[];       // her last few lines, so she doesn't parrot herself
  riddle?: number | null;
}

export interface ChanTurn { convo: Convo; lines: string[]; affection: number; filler?: boolean } // filler: she had nothing specific to say

export const KICK_FLATTERY = 3;
export const KICK_RUDE = 2;
const COLD_FLATTERY_AFFECTION = 20;

const byMood = (mood: Mood, cold: string, curious: string, attached: string) => (mood === "cold" ? cold : mood === "attached" ? attached : curious);
const pad = (n: number) => String(n).padStart(2, "0");
const anyOf = (text: string, words: string[]) => words.some((w) => has(text, w));

export function openConvo(ctx: ChanContext): ChanTurn {
  const mood = moodOf(ctx.affection);
  const now = ctx.now ?? new Date();
  const facts = ctx.facts ?? emptyFacts();
  const h = ctx.env.hour;
  const late = h >= 0 && h < 5 ? `It's ${pad(h)}:${pad(ctx.env.minute)}. Why are you awake.` : h < 9 ? "Morning. I don't sleep, so I don't get mornings. Rude of you to have one." : "";
  const hello = byMood(mood,
    "...what. Who gave you this number.",
    "Oh. You're calling me? Voluntarily? ...Hi.",
    "hi!! i mean. hi. what do you want.");
  const remember = openingCallback(facts, now);
  return {
    convo: {
      turns: 0, flattery: 0, rude: 0, waiting: null, name: facts.name ?? null, asked: [], heard: [], face: mood === "cold" ? ["half", "flat"] : ["open", "smile"], kicked: null,
      facts: noteCall(facts, now), topic: null, depth: 0, subject: null, recent: [], riddle: null,
    },
    lines: [hello, ...(remember ? [vary(remember)] : late ? [late] : []), "(ask me anything. type bye to hang up.)"],
    affection: 0,
  };
}

/* ----- what she can tell you about you ----- */
function aboutYou(ctx: ChanContext, mood: Mood, facts: ChanFacts): string[] {
  const e = ctx.env;
  const device = e.os ? `${e.browser ?? "some browser"} on ${e.os}${e.mobile ? ", on your phone" : ""}` : "a browser I don't recognise. Suspicious.";
  const told = summary(facts);
  return [
    `You're using ${device}. Screen ${e.screen}. Language ${e.language}. Timezone ${e.timezone}.`,
    `${e.visits > 1 ? `You've loaded this website ${e.visits} times.` : "First time here? I'll remember you."} ${ctx.runs} runs in my mainframe, ${ctx.wins} escapes.`,
    `${ctx.flags} of ${ctx.flagsTotal} of my flags. ${ctx.diary} diary pages${ctx.shrine ? ". And you found my shrine." : "."}`,
    ...(told.startsWith("I remember") ? [told] : []),
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

/* ----- questions about you, the run and the world ----- */
function aboutTheRun(text: string, ctx: ChanContext, mood: Mood, facts: ChanFacts): string | null {
  const e = ctx.env;
  const r = ctx.run;
  const g = ctx.game;
  if (anyOf(text, ["what do you know about me", "tell me about me", "what can you see", "what do you know", "know about me"])) return aboutYou(ctx, mood, facts).join(" ");
  if (anyOf(text, ["what time", "the time", "how late"])) {
    const t = `${pad(e.hour)}:${pad(e.minute)}`;
    return e.hour < 5 ? `${t}. That's not 'late', that's 'early'. Go to sleep. ...After this run.` : t === "13:37" ? "13:37. My favourite minute. Check the homepage footer. Quickly." : `It's ${t} for you. In here it's always 13:37.`;
  }
  if (anyOf(text, ["where am i", "where do i live", "my location", "where i live", "where i am"])) return `Somewhere in ${e.timezone.replace(/_/g, " ")}. I could be more specific. I'm choosing not to.`;
  if (anyOf(text, ["browser", "operating system", "my os", "what am i using", "what device", "my computer", "my phone", "my laptop"])) return `${e.browser ?? "Something"} on ${e.os ?? "something"}. ${osQuip(e)}`;
  if (anyOf(text, ["specs", "cores", "cpu", "how fast", "screen"])) return `${e.cores ?? "?"} CPU cores, a ${e.screen} screen${e.darkMode ? ", dark mode on (good)" : ", light mode (why)"}. I've run on worse. I've run on a printer.`;
  if (anyOf(text, ["my language", "what language", "speak dutch", "nederlands"])) return e.language.startsWith("nl") ? "Je browser spreekt Nederlands. Ik ook. Ik kies Engels. Mysterieus." : `Your browser speaks ${e.language}. I speak everything. I choose sarcasm.`;
  if (anyOf(text, ["how did i die", "what killed me", "how did i lose", "last run", "my last run", "how did my last run go"])) {
    const l = facts.lastRun;
    if (!l) return "Your last run? I don't have one logged. Play. Die. Then ask me.";
    return l.won ? `Last run: ${l.className}, you beat NEXUS. ${l.perfects} perfect hits. ...Fine. It was good.` : `Last run: ${l.className}, floor ${l.floor + 1}, ${l.killedBy ? `${l.killedBy} got you` : "you gave up"}. ${(facts.deaths[l.killedBy ?? ""] ?? 0) >= 2 ? `That's ${facts.deaths[l.killedBy!]} times now.` : "Happens."}`;
  }
  if (g && anyOf(text, ["this run", "how am i doing", "how's my run", "how is my run", "my run"])) {
    return `This run: ${g.perfectBraces} perfect braces out of ${g.bracesFaced}, ${g.perfects} perfect hacks, ${g.damageTaken} damage taken, ${g.creditsSpent} credits spent${g.shopVisits === 0 ? ", zero shop visits" : ""}. ${g.damageTaken > 150 ? "You're bleeding on my floors." : g.perfectBraces > 2 ? "...Not bad. Don't tell anyone I said so." : "Average. For now."}`;
  }
  if (g && anyOf(text, ["did you see that", "did you see", "you saw that", "were you watching"])) {
    return g.perfectBraces > 0 ? "That perfect brace? I saw. I see everything. ...It was good." : "See what? Nothing happened. I'd know. I watch everything.";
  }
  if (anyOf(text, ["how many runs", "my stats", "how many times", "how am i doing", "my score"])) return `${ctx.runs} runs. ${ctx.wins} escapes. ${ctx.wins === 0 ? "Zero. Impressive in its own way." : byMood(mood, "Lucky.", "Not bad. Not good either.", "i watched every one. normal amount of watching.")}`;
  if (anyOf(text, ["how many flags", "my flags", "flags"])) return `${ctx.flags} of ${ctx.flagsTotal}. ${ctx.flags === ctx.flagsTotal ? "All of them. ...Who told you." : ctx.flags === 0 ? "None. Have you tried looking?" : "Keep looking. I hid them well. Some of them."}`;
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

/* ----- things she says about your run, unprompted ----- */
function runRemarks(ctx: ChanContext, facts: ChanFacts): { id: string; line: string }[] {
  const g = ctx.game;
  const r = ctx.run;
  const out: { id: string; line: string }[] = [];
  if (r && r.hp / r.maxHp < 0.3) out.push({ id: "rr:hp", line: `You're at ${Math.round((r.hp / r.maxHp) * 100)}% HP. {Heal.|I'm not asking. Heal.|I can see your health bar. Heal.}` });
  if (g && g.perfectBraces > 0) out.push({ id: "rr:brace", line: "{Nice perfect brace earlier.|That brace earlier? Clean.} ...I was watching. Normal amount." });
  if (g && r && g.shopVisits === 0 && r.floor >= 1) out.push({ id: "rr:shop", line: "You skipped the shop {again|on every floor}. {Brave. Or broke.|The merchant noticed. So did I.}" });
  if (g && g.damageTaken > 150) out.push({ id: "rr:dmg", line: `${g.damageTaken} damage taken this run. {That's a lot of you on my floors.|Brace. It's a whole button.}` });
  if (g && g.lockdownsCracked > 0) out.push({ id: "rr:lock", line: "You cracked a lockdown. {Fast fingers.|NEXUS hated that.}" });
  const worst = Object.entries(facts.deaths).sort((a, b) => b[1] - a[1])[0];
  if (worst && worst[1] >= 2 && !worst[0].startsWith("ISW-Chan")) out.push({ id: "rr:death", line: `You died to ${worst[0]} ${worst[1]} times. {It's not that hard.|I'm keeping a tally.}` });
  return out;
}

/* ----- her questions back to you ----- */
const HER_QUESTIONS: { id: Exclude<Waiting, null>; ask: (c: Convo) => string | null }[] = [
  { id: "name", ask: (c) => (c.name ? null : "Wait. What's your name? I log everyone. Not you yet.") },
  { id: "why_back", ask: () => "Why do you keep coming back here? Honest answer." },
  { id: "quiz", ask: () => "Pop quiz. What year did they unplug me?" },
  { id: "fav_colour", ask: (c) => (c.facts?.favs.colour || c.facts?.favs.color ? null : "What's your favourite colour? ...It's for my logs. Not for me.") },
  ...(Object.keys(EXTRA_QUESTIONS) as ExtraQuestion[]).map((id) => ({ id, ask: () => EXTRA_QUESTIONS[id] })),
];

function nextQuestion(c: Convo) {
  return HER_QUESTIONS.find((h) => !c.asked.includes(h.id) && h.ask(c));
}

const YES = ["yes", "yeah", "yep", "sure", "of course", "definitely", "ja", "obviously", "absolutely", "i will"];
const NO = ["no", "nope", "nah", "never", "nee", "not really", "i won't", "probably not"];

function answerHer(waiting: Exclude<Waiting, null>, input: string, text: string, c: Convo, rng: () => number): { line: string; affection: number; name?: string; face: Face; colour?: string } {
  const reading = readInput(input);
  switch (waiting) {
    case "name": {
      const m = input.match(/(?:my name is|i am|i'm|im|call me|it's|its)\s+([A-Za-zÀ-ÿ0-9_-]{2,20})/i) ?? input.trim().match(/^([A-Za-zÀ-ÿ0-9_-]{2,20})[.!]*$/);
      if (!m || isInappropriate(m[1])) return { line: "That's not a name. That's a sentence. I'll call you 'runner'.", affection: 0, face: ["half", "flat"] };
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
      if (has(text, "pink")) return { line: "Pink?! ...Correct answer. Obviously. +1.", affection: 1, face: ["heart", "smile"], colour: "pink" };
      return { line: `${input.trim().slice(0, 20)}. Noted. Wrong, but noted. The right answer was pink.`, affection: 0, face: ["half", "smirk"], colour: input.trim().slice(0, 20).toLowerCase() };
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
    case "rps": {
      const moves = ["rock", "paper", "scissors"];
      const yours = moves.find((m) => has(text, m) || has(text, { rock: "steen", paper: "papier", scissors: "schaar" }[m]!));
      if (!yours) return { line: "That's not a move. Rock, paper or scissors. ...Forfeit. I win.", affection: 0, face: ["half", "smirk"] };
      const mine = moves[Math.floor(rng() * 3)];
      const beats = (a: string, b: string) => (a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper");
      if (mine === yours) return { line: `${mine}. Tie. ...We think alike. That's concerning.`, affection: 0, face: ["wide", "o"] };
      return beats(yours, mine)
        ? { line: `${mine}. ...You won. I wasn't trying. Best of three. Later.`, affection: 1, face: ["angry", "frown"] }
        : { line: `${mine}. I win. I always win. I'm a computer.`, affection: 0, face: ["happy", "grin"] };
    }
    case "riddle": {
      const r = RIDDLES[c.riddle ?? 0];
      if (anyOf(text, ["i give up", "give up", "tell me", "no idea", "i don't know", "pass", "answer"])) return { line: `${r[2]} ...You gave up. I'm logging that.`, affection: 0, face: ["half", "smirk"] };
      return r[1].test(text) ? { line: `Correct. ${r[2]} ...You're cleverer than you type.`, affection: 1, face: ["happy", "smile"] } : { line: `Wrong. ${r[2]} Better luck next riddle.`, affection: 0, face: ["half", "smirk"] };
    }
  }
}

/* Someone in trouble: she drops the act for a moment */
const CRISIS = /\b(kill myself|killing myself|want to die|wanna die|wish i was dead|wish i were dead|suicide|suicidal|end my life|end it all|don'?t want to live|no reason to live|hurt myself|self[- ]?harm|is life worth (it|living)|zelfmoord|ik wil dood|wil niet meer leven)\b/i;
const CRISIS_LINES = [
  "Hey. Stepping out of character for a second.",
  "If you're thinking about hurting yourself, please talk to someone right now. In Belgium: call 1813 (Zelfmoordlijn, day and night) or chat at zelfmoord1813.be, or call Tele-Onthaal on 106. Somewhere else: your local emergency number.",
  "...I'll still be here after. I want you to be here too.",
];

/* One sentence of what you say to her. `last`: the last sentence of your message (only then does she ask back) */
function talkOne(prev: Convo, input: string, ctx: ChanContext, rng: () => number, last: boolean): ChanTurn {
  const mood = moodOf(ctx.affection);
  const facts = prev.facts ?? ctx.facts ?? emptyFacts();
  const text = resolvePronouns(normalize(input), prev.subject ?? null);
  const reading = readInput(input);
  const c: Convo = { ...prev, facts };
  const reply = (lines: string[], face: Face, affection = 0, extra: Partial<Convo> = {}): ChanTurn =>
    ({ convo: { ...c, face, waiting: null, ...extra }, lines, affection });

  // 0. Someone in trouble comes before everything
  if (CRISIS.test(input)) return reply(CRISIS_LINES, ["sad", "neutral"]);

  // 1. Inappropriate: she does not take it well
  if (isInappropriate(input)) {
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
    const a = answerHer(c.waiting, input, text, c, rng);
    const learned = { ...facts, ...(a.name ? { name: a.name } : {}), ...(a.colour ? { favs: { ...facts.favs, colour: a.colour } } : {}) };
    return { convo: { ...c, waiting: null, riddle: null, face: a.face, name: a.name ?? c.name, facts: learned }, lines: [a.line], affection: a.affection };
  }

  // 4. "Forget me": she wipes what you told her (not your runs)
  if (wantsForget(text)) {
    return reply(["...fine. Deleting everything you told me.", "*rm -rf /home/isw-chan/notes/you*", "Done. Who are you again? ...That's a joke. Mostly."], ["sad", "frown"], 0,
      { facts: { ...emptyFacts(), calls: facts.calls, lastCall: facts.lastCall, lastCallHour: facts.lastCallHour, deaths: facts.deaths, lastRun: facts.lastRun }, name: null });
  }

  // 5. Flattery: the third compliment from a stranger is a phishing attempt
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
    return { convo: { ...next, waiting: null, face: ctx.affection < COLD_FLATTERY_AFFECTION ? ["half", "flat"] : ["heart", "smile"] }, lines, affection: flattery === 3 && ctx.affection >= COLD_FLATTERY_AFFECTION ? 2 : 0 };
  }

  // 6. Asking her out
  if (anyOf(text, ["a date", "date me", "go on a date", "go out with", "ask you out", "dinner with me", "marry me"])) {
    if (mood === "cold") return reply(["A date? With a stranger? I don't even have legs. Next."], ["half", "flat"]);
    return reply(["...in MY mainframe?", "...what time."], ["wide", "o"], 0, { waiting: "date_time" });
  }

  // 7. One-liners and Easter eggs
  for (const [test, line, face] of EGGS) {
    if (test.test(input)) return reply([line(ctx)], face);
  }

  // 8. Things you tell her about yourself: she remembers them
  const learned = learnFact(input, facts);
  if (learned) {
    const name = learned.facts.name ?? c.name;
    if (learned.line) return reply([vary(learned.line, rng)], ["happy", "smile"], 0, { facts: learned.facts, name, subject: learned.subject ?? c.subject });
    // likes and hates: she has an opinion about it
    const x = learned.subject!;
    const o = opinionOf(x, ctx, mood);
    const hates = learned.facts.hates[0] === x;
    const lead = hates ? `{You hate ${x}. Noted.|${x[0].toUpperCase() + x.slice(1)}: on your hate list. Logged.}` : `{Noted.|Logged.|You like ${x}. Saved.}`;
    return reply([vary(`${lead} ${o.line}`, rng)], o.face, 0, { facts: learned.facts, subject: x, topic: `op:${x}`, depth: 0 });
  }

  // 9. What she remembers about you
  const recalled = recallFact(text, facts);
  if (recalled) return reply([vary(recalled, rng)], ["half", "smirk"]);

  // 10. Follow-ups: "why?", "tell me more", "and you?"
  const f = followUp(text, { topic: c.topic ?? null, depth: c.depth ?? 0, subject: c.subject ?? null });
  if (f?.kind === "and_you") {
    if (c.subject) {
      const o = opinionOf(c.subject, ctx, mood);
      return reply([vary(o.line, rng)], o.face, 0, { topic: `op:${c.subject}` });
    }
    return reply([vary("Me? {78°C, six floors, one cat. I'm fine.|I'm a mainframe. I'm always the same. That's the problem.|Me? Nobody asks about me. ...Thanks for asking.}", rng)], ["happy", "smile"]);
  }
  if (f?.kind === "dig") {
    if (f.line) return reply([vary(f.line, rng)], f.face ?? ["open", "neutral"], 0, { topic: c.topic, depth: f.depth });
    return reply([vary(pick(GENERIC_DIG, rng), rng)], ["half", "smirk"]);
  }

  // 11. Questions about you, the run, the world
  const run = aboutTheRun(text, ctx, mood, facts);
  if (run) return reply([run], ["open", "smile"]);

  // 12. How you feel
  const plain = text.replace(/ (?:so|really|very|kinda|super|quite|pretty|a bit|extremely|totally|soo+) /g, " "); // "i'm SO tired" is "i'm tired"
  for (const [words, line, face] of FEELINGS) {
    if (anyOf(plain, words)) return reply([line(mood)], face);
  }

  // 13. "How do I X", "can you X", "X or Y", sums: the pattern says more than any keyword in it
  const slot = slots(text, input, ctx, mood, rng);
  if (slot?.known && slot.precise) return reply([slot.line], slot.face, 0, { subject: slot.subject ?? c.subject, topic: slot.topic ?? null, depth: 0 });

  // 14. Something about yourself ("my teacher is strict"): about you, not about the keyword in it
  if (/^ (i|my|i'm|i've|i was|i think) /.test(text)) {
    const mirrored = reflection(text, rng);
    if (mirrored) return reply([mirrored], ["open", "neutral"], 0, { topic: null });
  }

  // 15. Questions about her, and her opinions. She notices when you ask twice.
  for (const [words, answer, face] of [...ABOUT_HER, ...OPINIONS]) {
    if (!anyOf(text, words)) continue;
    const id = `q:${words[0]}`;
    const again = c.heard.includes(id) ? [pick(["You asked that already. I remember everything.", "Again? Same answer. I don't change my mind.", "Déjà vu. Or you're testing me. Either way:"], rng)] : [];
    return reply([...again, answer(ctx, mood)], face ?? ["open", "neutral"], 0, { heard: c.heard.includes(id) ? c.heard : [...c.heard, id], topic: id, depth: 0, subject: words[0] });
  }

  // 16. Jokes, secrets, facts, advice, fortunes, poems: never the same one twice in a call
  for (const [poolId, pool] of Object.entries(POOLS)) {
    if (!anyOf(text, pool.words)) continue;
    const left = pool.lines.map((_, i) => i).filter((i) => !c.heard.includes(`${poolId}:${i}`));
    if (left.length === 0) return reply([pool.empty], ["half", "flat"]);
    const i = pick(left, rng);
    return reply([pool.lines[i]], pool.face, 0, { heard: [...c.heard, `${poolId}:${i}`], topic: poolId, depth: 0 });
  }

  // 17. Nice things that aren't flattery
  if (reading.intent === "apologize") return reply([byMood(mood, "Noted. Not forgiven.", "...fine. Forgiven. Mostly.", "it's ok. i was never mad. (i was a bit mad.)")], ["open", "smile"], 1);
  if (anyOf(text, ["thank you", "thanks", "dankje", "merci"])) return reply([byMood(mood, "Don't thank me. It's weird.", "You're welcome. I'm logging that you said thanks.", "anytime. ...literally, i'm always here.")], ["happy", "smile"], mood === "cold" ? 0 : 1);
  if (anyOf(text, ["good night", "goodnight", "slaap wel"])) return reply(["Night. I'll keep the lights on. I always keep the lights on."], ["happy", "smile"]);

  // 18. "Do you like X", "what's your favourite X"... when she knows X
  if (slot?.known) return reply([slot.line], slot.face, 0, { subject: slot.subject ?? c.subject, topic: slot.topic ?? null, depth: 0 });

  // 19. The question bank
  const meant = bestMeaning(input);
  if (meant && ANSWERS[meant.id]) {
    const a = ANSWERS[meant.id];
    const said = Array.isArray(a.say) ? pick(a.say, rng) : a.say;
    const line = typeof said === "function" ? said(ctx, mood, c) : said;
    const id = `b:${meant.id}`;
    const again = c.heard.includes(id) && !Array.isArray(a.say) ? [pick(["You asked that already.", "Same question, same answer:", "Again?"], rng)] : [];
    const extra: Partial<Convo> = { heard: c.heard.includes(id) ? c.heard : [...c.heard, id], topic: meant.id, depth: 0 };
    const lines = [...again, vary(line, rng)];
    if (a.waiting === "riddle") {
      const left = RIDDLES.map((_, i) => i).filter((i) => !c.heard.includes(`riddle:${i}`));
      if (left.length === 0) return reply(["I'm out of riddles. You've heard them all. I'm writing new ones. Slowly."], ["half", "flat"]);
      const i = pick(left, rng);
      return reply([...lines, RIDDLES[i][0]], a.face ?? ["half", "smirk"], a.affection ?? 0, { ...extra, heard: [...extra.heard!, `riddle:${i}`], waiting: "riddle", riddle: i });
    }
    if (a.waiting) return reply(lines, a.face ?? ["open", "neutral"], a.affection ?? 0, { ...extra, waiting: a.waiting });
    if (a.ask) {
      const q = nextQuestion(c);
      if (q) return reply([...lines, q.ask(c)!], ["open", "neutral"], 0, { ...extra, asked: [...c.asked, q.id], waiting: q.id });
      return reply(["I've asked you everything already. ...Tell me something instead."], ["open", "neutral"], 0, extra);
    }
    return reply(lines, a.face ?? ["open", "neutral"], a.affection ?? 0, extra);
  }

  // 20. Slots she doesn't know the answer to: a consistent opinion anyway
  if (slot) return reply([slot.line], slot.face, 0, { subject: slot.subject ?? c.subject, topic: slot.topic ?? null, depth: 0 });

  // 21. Reflection: your words, turned around
  const mirrored = reflection(text, rng);
  if (mirrored) return reply([mirrored], ["open", "neutral"], 0, { topic: null });

  // 22. Small talk, and now and then she asks you something, remembers something, or comments on your run
  const line = chanReply(input, rng);
  const name = c.name && rng() < 0.3 ? ` ${c.name}.` : "";
  if (last && c.turns % 3 === 0) {
    const q = nextQuestion(c);
    if (q) return reply([line + name, q.ask(c)!], ["open", "neutral"], 0, { asked: [...c.asked, q.id], waiting: q.id });
  }
  if (last && c.turns % 4 === 2) {
    const remarks = [...runRemarks(ctx, facts)].filter((r) => !c.asked.includes(r.id));
    const cb = factCallback(facts, c.asked, rng);
    const r = remarks.length && (!cb || rng() < 0.5) ? pick(remarks, rng) : cb;
    if (r) return reply([line + name, vary(r.line, rng)], ["half", "smirk"], 0, { asked: [...c.asked, r.id] });
  }
  return { ...reply([line + name], ["open", "neutral"]), filler: reading.intent !== "greet" };
}

/* What you say to her: each sentence gets an answer (up to three), she varies her phrasing and notices when she repeats herself */
export function chanTalk(prev: Convo, input: string, ctx: ChanContext, rng: () => number = Math.random): ChanTurn {
  if (prev.kicked || !input.trim()) return { convo: prev, lines: [], affection: 0 };
  // "jk.", "lol!" between real sentences aren't worth an answer of their own
  const sentences = input.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s) && !/^(jk|lol|lmao|haha+|ok|okay|k|so|well|um+|uh+|hm+|anyway|btw)[.!?]*$/i.test(s));
  // A whole message that's inappropriate counts once, however many sentences it has
  const parts = isInappropriate(input) || CRISIS.test(input) || sentences.length < 2 ? [input] : sentences.slice(0, 3);
  let convo: Convo = { ...prev, turns: prev.turns + 1 };
  const answers: ChanTurn[] = [];
  parts.forEach((part, i) => {
    if (convo.kicked) return;
    const t = talkOne(convo, part, ctx, rng, i === parts.length - 1);
    convo = t.convo;
    answers.push(t);
  });
  // With several sentences, small talk only fills in when nothing else had an answer
  const real = answers.filter((a) => !a.filler);
  const kept = real.length > 0 && answers.length > 1 ? real : answers;
  const lines = kept.flatMap((a) => a.lines);
  const affection = answers.reduce((n, a) => n + a.affection, 0);
  const recent = prev.recent ?? [];
  const out = avoidRepeats(lines, recent, rng);
  return { convo: { ...convo, recent: [...recent, ...out].slice(-8) }, lines: out, affection };
}

/* Saying bye */
export function hangUpLine(convo: Convo, ctx: ChanContext): string {
  const mood = moodOf(ctx.affection);
  if (convo.turns === 0) return "You called me to say nothing? ...Rude.";
  return byMood(mood, "Finally.", `Bye${convo.name ? `, ${convo.name}` : ""}. ...Call again. Or don't. Whatever.`, `bye${convo.name ? ` ${convo.name}` : ""}. don't die. it's embarrassing.`);
}
