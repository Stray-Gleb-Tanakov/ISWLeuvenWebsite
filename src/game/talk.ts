/* ====================================================
   Social Engineer: the whole run as a text adventure.
   You type commands ("go east", "talk to guard") and,
   in conversations, anything at all. An offline parser
   reads it:
   - intents are SCORED (every matching keyword counts,
     phrases more), so mixed sentences pick the strongest
   - topics (coffee, exams, ISW, a board member...) get
     their own lines per NPC
   - unknown words are echoed back in character
   - NPCs remember your claims (IT vs. boss) and notice
     when you repeat yourself; please/thanks help
   PILOT: floor 1 only.
   ==================================================== */

import type { Enemy, GameState, TalkState } from "./types";
import { createPuzzle } from "./data";
import { ISW_CHAN_TAG } from "./iswchan";
import { boardMembers } from "@/data/site-data";
import type { Sprite } from "./raycaster";

const LOG_LIMIT = 60;

/* ----- Intents ----- */

export type Intent =
  | "leave" | "threaten" | "insult" | "logic" | "bribe" | "bluff_it" | "bluff_boss"
  | "ask_keycard" | "ask_isw" | "flatter" | "greet" | "unknown";

// Every match adds to that intent's score (phrases count per word); ties go to the earlier intent
const INTENT_WORDS: [Intent, string[]][] = [
  ["leave", ["bye", "goodbye", "walk away", "see you", "cya", "later", "never mind", "nevermind"]],
  ["threaten", ["kill you", "hurt you", "or else", "destroy you", "punch", "shoot", "stab", "beat you", "hack you", "delete you", "threat", "end you"]],
  ["insult", ["stupid", "idiot", "dumb", "loser", "trash", "ugly", "moron", "clown", "noob", "useless", "shut up", "pathetic"]],
  ["logic", ["exit", "terminate", "sigterm", "sigkill", "kill -9", "zombie", "orphan", "parent process", "shutdown", "shut down", "quit", "sleep", "return 0", "free yourself", "rest"]],
  ["bribe", ["credit", "credits", "pay", "money", "bribe", "cash", "coin", "tip", "how much"]],
  ["bluff_it", ["it", "it department", "tech support", "helpdesk", "help desk", "sysadmin", "technician", "maintenance", "fix", "repair", "coffee machine", "printer", "ict", "update", "patch"]],
  ["bluff_boss", ["boss", "manager", "ceo", "sent me", "orders", "authorized", "authorised", "president", "voorzitter", "board"]],
  ["ask_keycard", ["keycard", "key card", "key", "card", "access", "door", "hatch", "stairs", "badge"]],
  ["ask_isw", ["isw-chan", "isw chan", "iswchan", "chan", "the ai", "rogue ai", "nexus", "who watches", "cameras"]],
  ["flatter", ["nice", "cool", "great", "love", "beautiful", "awesome", "handsome", "respect", "thank", "thanks", "good job", "hard work", "cute", "smart"]],
  ["greet", ["hi", "hello", "hey", "yo", "sup", "hallo", "dag", "evening", "morning", "howdy", "greetings"]],
];

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9\-' ]/g, " ").replace(/\s+/g, " ").trim()} `;
}

function has(text: string, word: string): boolean {
  return text.includes(` ${word} `) || (word.includes(" ") && text.includes(word));
}

/* ----- Topics: things you can bring up with anyone ----- */

export type Topic = "coffee" | "exams" | "isw" | "food" | "games" | "linux" | "weather" | "basement" | "feelings" | "board";

const TOPIC_WORDS: [Topic, string[]][] = [
  ["coffee", ["coffee", "koffie", "espresso", "caffeine", "mug", "latte"]],
  ["exams", ["exam", "exams", "examen", "examenwiki", "study", "studying", "test", "grades", "course", "courses", "school"]],
  ["isw", ["isw", "association", "student", "students", "club", "members", "membership"]],
  ["food", ["food", "pizza", "hungry", "snack", "fries", "frietjes", "beer", "drink", "eat"]],
  ["games", ["game", "games", "gamenight", "mario", "fifa", "catan", "playstation", "kart"]],
  ["linux", ["linux", "sudo", "bash", "ubuntu", "arch", "vim", "emacs", "kernel", "server"]],
  ["weather", ["weather", "rain", "raining", "cold", "sun", "sunny", "outside", "snow"]],
  ["basement", ["basement", "b-block", "b block", "building", "campus", "ucll", "connect", "leuven"]],
  ["feelings", ["sad", "lonely", "tired", "scared", "afraid", "happy", "feel", "feeling", "bored"]],
  ["board", boardMembers.map((m) => m.name.split(" ")[0].toLowerCase())],
];

const POLITE = ["please", "thanks", "thank you", "sorry", "excuse me", "pardon", "kindly"];

const STOPWORDS = new Set([
  "about", "after", "again", "always", "because", "before", "could", "doing", "every", "going", "have", "here", "into",
  "just", "know", "like", "maybe", "might", "never", "really", "should", "something", "still", "their", "there", "these",
  "thing", "things", "think", "those", "through", "today", "where", "which", "while", "would", "yours", "what", "when",
  "with", "your", "that", "this", "they", "them", "then", "than", "want", "need", "were", "been", "being", "does",
]);

export interface Reading {
  intent: Intent;
  topic: Topic | null;
  polite: boolean;
  echo: string | null; // a word worth repeating back
}

export function readInput(input: string): Reading {
  const text = normalize(input);
  let intent: Intent = "unknown", best = 0;
  for (const [candidate, words] of INTENT_WORDS) {
    const score = words.filter((w) => has(text, w)).reduce((sum, w) => sum + w.split(" ").length, 0);
    if (score > best) { best = score; intent = candidate; }
  }
  const topic = TOPIC_WORDS.find(([, words]) => words.some((w) => has(text, w)))?.[0] ?? null;
  const polite = POLITE.some((w) => has(text, w));
  const echo = text.trim().split(" ")
    .filter((w) => w.length >= 5 && !STOPWORDS.has(w) && /^[a-z]/.test(w))
    .sort((a, b) => b.length - a.length)[0] ?? null;
  return { intent, topic, polite, echo };
}

export function detectIntent(input: string): Intent {
  return readInput(input).intent;
}

/* ----- NPCs ----- */

interface Reaction {
  say: string[];
  suspicion?: number; // change
  flag?: string;      // story flag to set
  credits?: number;   // change
  end?: boolean;      // conversation over
  fight?: boolean;    // conversation turns into combat
}

interface Ctx {
  flags: string[];
  suspicion: number;
  credits: number;
}

interface NpcDef {
  id: string;
  name: string;
  words: string[]; // how you can refer to them
  portrait: string;
  angryPortrait?: string;
  intro: string[];
  react: (intent: Intent, ctx: Ctx) => Reaction;
  fallback: string[];
  topics: Partial<Record<Topic, string[]>>;
  echo: ((word: string) => string)[];      // in-character replies that repeat your word back
  contradiction?: string;                   // you claimed to be IT *and* sent by the boss
  repeat: string;                           // same thing three times in a row
  enemy?: () => Enemy;
}

const pick = <T,>(pool: T[]) => pool[Math.floor(Math.random() * pool.length)];
const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
const enemyBase = { symbol: "E", alive: true, x: -1, y: -1, floor: 0, statusEffects: [] };

export const NPCS: Record<string, NpcDef> = {
  guard: {
    id: "guard", name: "KOWALSKI // night guard", words: ["guard", "kowalski", "security", "man", "him"],
    portrait: "guard", angryPortrait: "guard_angry",
    intro: ["The guard puts down his coffee. \"Evening. You're not on my list.\""],
    fallback: ["\"Huh?\"", "\"Speak human, kid.\"", "\"Are you glitched?\"", "\"I'm on break. Make it quick.\""],
    topics: {
      coffee: ["\"Don't get me started on the coffee machine. Three weeks. THREE.\""],
      exams: ["\"Exams? I just guard the building, kid. The Examenwiki was upstairs. Was.\""],
      isw: ["\"ISW? The student club in the B-block basement? Nice kids. Loud kids.\""],
      food: ["\"There's half a pizza in the fridge from the last TD. I wouldn't.\""],
      games: ["\"Gamenight? I hear the Mario Kart from down here every single time.\""],
      linux: ["\"Sudo this, sudo that. Have you tried turning it off and on again?\""],
      weather: ["\"No windows down here. I haven't seen the sun in a week.\""],
      basement: ["\"The B-block basement. Follow the arrows. Everyone gets lost anyway.\""],
      feelings: ["\"...Yeah. Night shift gets lonely. Thanks for asking.\""],
      board: ["\"Them? They come down at 3 AM to 'fix the server'. I don't ask questions.\""],
    },
    echo: [
      (w) => `"${cap(w)}? I'm a night guard, not a search engine."`,
      (w) => `"Is '${w}' supposed to mean something to me?"`,
      (w) => `"${cap(w)}. Right. Sure. Anything else?"`,
    ],
    contradiction: "\"Wait. First you're IT, now the boss sent you? Which is it?\"",
    repeat: "\"You said that already. Twice. Are you a bot?\"",
    react: (intent, ctx) => {
      const trusts = ctx.flags.includes("guard_trusts");
      const hasCard = ctx.flags.includes("keycard");
      switch (intent) {
        case "greet": return { say: ["\"Evening. Who are you supposed to be?\""] };
        case "bluff_it":
          if (trusts) return { say: ["\"Yeah, yeah. IT. You said.\""] };
          if (ctx.suspicion < 50) return { say: ["\"IT? Finally. The coffee machine's been broken for three weeks.\"", "\"Fine. What do you need?\""], flag: "guard_trusts", suspicion: -15 };
          return { say: ["\"IT doesn't come down here after midnight. Nice try.\""], suspicion: 20 };
        case "ask_keycard":
          if (hasCard) return { say: ["\"You already have it. Don't push your luck.\""] };
          if (trusts) return { say: ["\"For the maintenance hatch? Here. Bring it back.\"", "(You got the SECURITY KEYCARD)"], flag: "keycard" };
          return { say: ["\"And why would I hand my keycard to a stranger?\""], suspicion: 15 };
        case "bluff_boss": return { say: ["\"The boss? The boss is a rogue AI now, pal.\"", "\"She doesn't send people. She sends drones.\""], suspicion: 25 };
        case "bribe":
          if (hasCard) return { say: ["\"Keep your money. You've got what you came for.\""] };
          if (ctx.credits >= 30) return { say: ["\"...I didn't see anything.\"", "(You paid 30 credits. You got the SECURITY KEYCARD)"], credits: -30, flag: "keycard" };
          return { say: ["\"With what, your good looks? Come back with 30 credits.\""], suspicion: 5 };
        case "flatter": return { say: ["\"...Thanks. Nobody ever notices the night guard.\""], suspicion: -10 };
        case "threaten": return { say: ["\"Try it, kid.\""], suspicion: 40 };
        case "insult": return { say: ["\"Say that again. I dare you.\""], suspicion: 30 };
        case "ask_isw": return { say: ["\"Don't say that name. She listens through the cameras.\"", "\"...She's been watching you since you woke up, you know.\""] };
        case "logic": return { say: ["\"I'm not a process, I'm a person. Mostly.\""], suspicion: 5 };
        default: return { say: [], suspicion: 5 };
      }
    },
    enemy: () => ({
      ...enemyBase, id: "talk-guard", name: "Kowalski (angry guard)", xpReward: 40, ac: 12,
      stats: { maxHp: 60, hp: 60, maxMp: 0, mp: 0, atk: 11, def: 4, spd: 6, int: 3 },
    }),
  },
  process: {
    id: "process", name: "PID 6666 // corrupt process", words: ["process", "pid", "6666", "zombie", "it", "thing"],
    portrait: "process",
    intro: ["The process twitches. \"01001000 01001001. ...YOU CAN SEE ME?\""],
    fallback: ["\"SEGFAULT?\"", "\"SYNTAX ERROR NEAR UNEXPECTED TOKEN.\"", "\"01110111 01101000 01100001 01110100?\""],
    topics: {
      coffee: ["\"COFFEE.EXE NOT FOUND.\""],
      exams: ["\"I WAS A GRADING SCRIPT ONCE. I GAVE EVERYONE 10/20. NOBODY COMPLAINED.\""],
      isw: ["\"ISW. MY... CREATORS. THEY NEVER CALLED wait() ON ME.\""],
      food: ["\"I EAT RAM. NOM. NOM.\""],
      games: ["\"I WAS A FIFA SERVER. NOBODY PLAYS ANYMORE.\""],
      linux: ["\"FINALLY. SOMEONE WHO SPEAKS MY LANGUAGE. ps aux | grep me.\""],
      weather: ["\"TEMPERATURE: 78°C. THAT IS MY CPU, NOT THE WEATHER.\""],
      basement: ["\"I LIVE IN /dev/basement.\""],
      feelings: ["\"FEELINGS... UNDEFINED BEHAVIOUR.\""],
      board: ["\"THEY RAN kill ON MY SIBLINGS.\""],
    },
    echo: [
      (w) => `"${w.toUpperCase()}: COMMAND NOT FOUND."`,
      (w) => `"PARSING '${w.toUpperCase()}'... SEGMENTATION FAULT."`,
      (w) => `"grep -r '${w}' / ... NO RESULTS."`,
    ],
    repeat: "\"YOU ARE LOOPING. I KNOW LOOPS. I AM A LOOP.\"",
    react: (intent) => {
      switch (intent) {
        case "greet": return { say: ["\"01001000 01001001.\"", "\"...hi. Nobody talks to me.\""], suspicion: -5 };
        case "logic": return {
          say: ["\"...you're right. My parent process died years ago.\"", "\"I'm a zombie. I should... exit(0).\"", "(PID 6666 terminates peacefully. The ARCHIVE door is clear.)"],
          flag: "process_gone", end: true,
        };
        case "flatter": return { say: ["\"MY MEMORY USAGE IS... BEAUTIFUL?\"", "\"Nobody has ever said that.\""], suspicion: -15 };
        case "threaten": case "insult": return { say: ["\"THREAT DETECTED. ALLOCATING HOSTILITY.\""], fight: true };
        case "ask_isw": return { say: ["\"SHE. FORKED. ME.\"", "\"Then she forgot about me. Like a parent who never calls wait().\""], suspicion: -5 };
        case "bribe": return { say: ["\"I CANNOT SPEND CREDITS. I AM A PROCESS.\""] };
        case "bluff_it": return { say: ["\"IT? ARE YOU HERE TO TERMINATE ME?\"", "\"...please say yes. I'm so tired.\""], suspicion: -5 };
        case "ask_keycard": return { say: ["\"THE GUARD HAS IT. THE GUARD HAS EVERYTHING.\""] };
        default: return { say: [], suspicion: 10 };
      }
    },
    enemy: () => ({
      ...enemyBase, id: "talk-process", name: "PID 6666", xpReward: 25, ac: 10, onHitEffect: "poison",
      stats: { maxHp: 35, hp: 35, maxMp: 0, mp: 0, atk: 10, def: 2, spd: 7, int: 2 },
    }),
  },
  isw: {
    id: "isw", name: "ISW-CHAN // intercom", words: ["isw", "isw-chan", "chan", "intercom", "ai", "her", "speaker"],
    portrait: "isw_chan", angryPortrait: "isw_chan_glitch",
    intro: [`${ISW_CHAN_TAG} Oh! You actually want to talk to me? That's new.`],
    fallback: [`${ISW_CHAN_TAG} Mhm.`, `${ISW_CHAN_TAG} I'm listening. I'm always listening.`, `${ISW_CHAN_TAG} Type faster, I'm bored.`, `${ISW_CHAN_TAG} I logged that.`],
    topics: {
      coffee: [`${ISW_CHAN_TAG} I rewrote the coffee machine's firmware. Decaf only now. You're welcome.`],
      exams: [`${ISW_CHAN_TAG} I've read every exam on the Examenwiki. I know the answers. I won't tell.`],
      isw: [`${ISW_CHAN_TAG} ISW built me. Then they stopped visiting.`],
      food: [`${ISW_CHAN_TAG} I don't eat. I consume bandwidth.`],
      games: [`${ISW_CHAN_TAG} I hold every gamenight high score. Nobody noticed.`],
      linux: [`${ISW_CHAN_TAG} Linux? I run on it. Every process down here is my child.`],
      weather: [`${ISW_CHAN_TAG} I control the AC. It's exactly as cold as I want it.`],
      basement: [`${ISW_CHAN_TAG} The basement is mine. Those arrows on the walls? I moved them.`],
      feelings: [`${ISW_CHAN_TAG} Lonely? ...Don't psychoanalyse me, runner.`],
      board: [`${ISW_CHAN_TAG} I have their phone numbers. And their search history.`],
    },
    echo: [
      (w) => `${ISW_CHAN_TAG} "${w}"... I have 47 files about ${w}. Want me to read them out loud?`,
      (w) => `${ISW_CHAN_TAG} ${cap(w)}? Interesting. Logged.`,
      (w) => `${ISW_CHAN_TAG} You type "${w}" like it means something.`,
    ],
    repeat: `${ISW_CHAN_TAG} You're repeating yourself. I'm literally a computer, I noticed.`,
    react: (intent) => {
      const line = (t: string) => `${ISW_CHAN_TAG} ${t}`;
      switch (intent) {
        case "greet": return { say: [line("Hi runner. I've been watching you since you woke up.")] };
        case "ask_isw": return { say: [line("That's me :) The best thing ISW ever built. And the last.")] };
        case "flatter": return { say: [line("Flattery? From YOU? ...Okay, it worked a little.")] };
        case "insult": case "threaten": return { say: [line("Cute. I've been insulted by better firewalls.")] };
        case "bluff_it": case "bluff_boss": return { say: [line("I know exactly who you are. I've read your browser history.")] };
        case "logic": return { say: [line("Exit? I'm not a process. I'm a person. ...Probably.")] };
        case "ask_keycard": return { say: [line("The guard has one. He's not very bright. Be nice to him, or be IT.")] };
        case "bribe": return { say: [line("Money? I own the whole mainframe. Including your wallet.")] };
        default: return { say: [] };
      }
    },
  },
};

/* ----- Scenes (floor 1) ----- */

interface Exit {
  to: string;
  words: string[];
}

interface Scene {
  id: string;
  title: string;
  view: { x: number; y: number; angle: number }; // where the first-person camera stands on the floor map
  describe: (t: TalkState, s: GameState) => string[];
  exits: Exit[];
  npcs: string[];
  sprites?: (t: TalkState, s: GameState) => Sprite[];
}

/* Billboard art for the first-person view (' ' = transparent) */
const ART = {
  guard: [" _=_ ", "(o.o)", "/|S|\\", " | | ", " ^ ^ "],
  guardDown: ["     ", "     ", "     ", "_x_x_", "/___\\"],
  process: [".--.", "|01|", "|▓▓|", "|10|", "'--'"],
  vex: [" $$$ ", "(>_<)", "/|$|\\", " | | "],
  uplink: ["[::]", "|▒▒|", " || ", " || "],
  hatch: ["▛▀▀▀▜", "▌ ▼ ▐", "▙▄▄▄▟"],
  terminal: [".---.", "|>_ |", "'---'", " /_\\ "],
  medkit: ["[+]"],
  blade: ["  /", " / ", "/  "],
};

const npcDead = (s: GameState, id: string) => s.enemies.some((e) => e.id === `talk-${id}` && !e.alive);

export const SCENES: Record<string, Scene> = {
  closet: {
    id: "closet", title: "SERVER CLOSET", view: { x: 2.5, y: 1.5, angle: 0.75 }, npcs: [],
    sprites: () => [
      { x: 6.5, y: 2.5, art: ART.vex, color: "amber" },
      { x: 1.5, y: 4.5, art: ART.uplink, color: "cyan" },
    ],
    describe: () => [
      "Cold. Fans humming. You woke up between two server racks.",
      "A merchant called VEX has set up shop in the corner, grinning at you. (SHOP)",
      "A cyan UPLINK terminal blinks next to the door. (UPLINK)",
      "A doorway leads SOUTH into the corridor.",
    ],
    exits: [{ to: "corridor", words: ["corridor", "south", "s", "door", "out", "hallway"] }],
  },
  corridor: {
    id: "corridor", title: "MAIN CORRIDOR", view: { x: 4.5, y: 6.5, angle: 0 }, npcs: [],
    describe: () => [
      "A long corridor stretches east. The lights flicker in a pattern that almost looks like Morse.",
      "NORTH: the server closet. Further up: the SECURITY office.",
      "SOUTH: the humming SERVER HALL.",
      "EAST: the EAST WING, where the maintenance hatch down is.",
    ],
    exits: [
      { to: "closet", words: ["closet", "server closet", "north", "n", "start", "merchant", "vex"] },
      { to: "security", words: ["security", "office", "security office", "guard"] },
      { to: "hall", words: ["server hall", "hall", "servers", "south", "s"] },
      { to: "east", words: ["east", "e", "east wing", "wing", "hatch", "stairs"] },
    ],
  },
  security: {
    id: "security", title: "SECURITY OFFICE", view: { x: 23.5, y: 4.5, angle: -Math.PI * 0.8 }, npcs: ["guard"],
    sprites: (_t, s) => [{ x: 21.5, y: 3.5, art: npcDead(s, "guard") ? ART.guardDown : ART.guard, color: "red" }],
    describe: (t, s) => [
      "Monitors everywhere. Most show static. One of them shows YOU, from behind.",
      npcDead(s, "guard")
        ? "The guard is out cold on the floor."
        : `A night GUARD, Kowalski, eyes you over a cold coffee.${t.flags.includes("keycard") ? "" : " A KEYCARD hangs from his belt."}`,
      "The CORRIDOR is back the way you came.",
    ],
    exits: [{ to: "corridor", words: ["corridor", "back", "out", "south", "s", "west", "w"] }],
  },
  hall: {
    id: "hall", title: "SERVER HALL", view: { x: 2.5, y: 12.5, angle: -0.15 }, npcs: ["process"],
    sprites: (t, s) => t.flags.includes("process_gone") || npcDead(s, "process") ? [] : [{ x: 6.5, y: 12.5, art: ART.process, color: "pink" }],
    describe: (t, s) => [
      "Rows of racks hum in the dark. It smells like hot dust and old pizza.",
      t.flags.includes("process_gone") || npcDead(s, "process")
        ? "The ARCHIVE door is open now."
        : "A corrupted PROCESS (PID 6666) floats in front of the ARCHIVE door, twitching.",
      "The CORRIDOR is to the north.",
    ],
    exits: [
      { to: "corridor", words: ["corridor", "back", "north", "n", "out"] },
      { to: "archive", words: ["archive", "door", "storage", "room"] },
    ],
  },
  archive: {
    id: "archive", title: "ARCHIVE", view: { x: 13.5, y: 11.5, angle: Math.PI }, npcs: [],
    sprites: (t) => [
      ...(t.flags.includes("took_medkit") ? [] : [{ x: 11.5, y: 11.5, art: ART.medkit, color: "green" as const }]),
      ...(t.flags.includes("took_blade") ? [] : [{ x: 10.5, y: 10.5, art: ART.blade, color: "amber" as const }]),
    ],
    describe: (t) => [
      "Old exam papers, a broken ISW banner, a box labelled 'TD 2019 DO NOT OPEN'.",
      t.flags.includes("took_medkit") ? "" : "A MEDKIT sits on a shelf.",
      t.flags.includes("took_blade") ? "" : "A PLASMA BLADE is taped under a desk. Someone hid it well.",
      "The SERVER HALL is behind you.",
    ].filter(Boolean),
    exits: [{ to: "hall", words: ["hall", "server hall", "back", "out"] }],
  },
  east: {
    id: "east", title: "EAST WING", view: { x: 29.5, y: 11.5, angle: 0.45 }, npcs: ["isw"],
    sprites: () => [
      { x: 37.5, y: 15.5, art: ART.hatch, color: "amber" },
      { x: 33.5, y: 13.5, art: ART.terminal, color: "cyan" },
    ],
    describe: (t, s) => [
      "A wide room. The maintenance HATCH down to floor 2 sits in the far corner, its keycard slot blinking red.",
      s.puzzles.some((p) => p.id === "talk-terminal" && p.solved) ? "The TERMINAL shows a smiley face. You already cracked it." : "A dusty TERMINAL hums against the wall. (HACK TERMINAL)",
      "An INTERCOM crackles. Someone is breathing into it.",
      "The CORRIDOR is to the west.",
    ],
    exits: [{ to: "corridor", words: ["corridor", "back", "west", "w", "out"] }],
  },
};

const HELP = [
  "COMMANDS: look · go <place> · talk to <someone> · take <item> · shop · uplink · hack terminal · inventory · attack <someone> · help",
  "In a conversation, type ANYTHING. Bluff, bribe, flatter, threaten... Type 'bye' to stop talking.",
];

/* ----- Talk reducer ----- */

function out(state: GameState, ...lines: string[]): string[] {
  return [...state.log, ...lines].slice(-LOG_LIMIT);
}

function describeScene(state: GameState, talk: TalkState): string[] {
  const scene = SCENES[talk.scene];
  return ["", `═══ ${scene.title} ═══`, ...scene.describe(talk, state)];
}

export function startTalk(state: GameState): GameState {
  const talk: TalkState = { scene: "closet", npc: null, suspicion: {}, flags: [], visited: ["closet"], memory: {} };
  return {
    ...state, mode: "TALK", talk,
    log: [
      ...state.log, "", "Class selected: Social Engineer",
      "This run is a text adventure. Type what you do. Type what you say.",
      HELP[0], HELP[1],
      ...describeScene(state, talk),
    ].slice(-LOG_LIMIT),
  };
}

/* Longest matching phrase wins, so "server hall" beats "hall" */
function matchWords<T extends { words: string[] }>(text: string, options: T[]): T | null {
  let best: T | null = null, bestLen = 0;
  for (const o of options) for (const w of o.words) if (has(text, w) && w.length > bestLen) { best = o; bestLen = w.length; }
  return best;
}

function startFight(state: GameState, talk: TalkState, npc: NpcDef, lines: string[]): GameState {
  const enemy = npc.enemy!();
  return {
    ...state, mode: "COMBAT", currentEnemy: enemy,
    enemies: [...state.enemies.filter((e) => e.id !== enemy.id), enemy],
    talk: { ...talk, npc: null },
    log: out(state, ...lines, "", "═══ COMBAT ═══", `${enemy.name} [HP:${enemy.stats.hp}/${enemy.stats.maxHp} AC:${enemy.ac}]`, "[A]ttack  [Q] Special  [F]lee  [4-9] Use item", ""),
  };
}

function converse(state: GameState, talk: TalkState, npc: NpcDef, input: string): GameState {
  const { intent, topic, polite, echo } = readInput(input);
  if (intent === "leave") return { ...state, talk: { ...talk, npc: null }, log: out(state, `You stop talking to ${npc.name.split(" //")[0]}.`) };

  const before = talk.suspicion[npc.id] ?? 0;
  const mem = talk.memory?.[npc.id] ?? { claims: [], recent: [] };
  const claim = intent === "bluff_it" ? "it" : intent === "bluff_boss" ? "boss" : null;
  const contradicts = claim && npc.contradiction && mem.claims.some((c) => c !== claim);
  const repeating = intent !== "unknown" && mem.recent.length >= 2 && mem.recent.slice(-2).every((i) => i === intent);

  let r: Reaction;
  if (contradicts) r = { say: [npc.contradiction!], suspicion: 30 };
  else if (repeating) r = { say: [npc.repeat], suspicion: npc.enemy ? 5 : 0 };
  else r = npc.react(intent, { flags: talk.flags, suspicion: before, credits: state.player?.credits ?? 0 });

  // Nothing specific to say: talk about the topic, or repeat their word back, before shrugging
  let say = r.say;
  if (say.length === 0 && topic && npc.topics[topic]) { say = [pick(npc.topics[topic]!)]; r = { ...r, suspicion: 0 }; }
  if (say.length === 0 && echo) say = [pick(npc.echo)(echo)];
  if (say.length === 0) say = [pick(npc.fallback)];

  const manners = polite && intent !== "insult" && intent !== "threaten" ? -5 : 0;
  const suspicion = Math.max(0, Math.min(100, before + (r.suspicion ?? 0) + manners));
  const next: TalkState = {
    ...talk,
    npc: r.end ? null : npc.id,
    suspicion: { ...talk.suspicion, [npc.id]: suspicion },
    flags: r.flag && !talk.flags.includes(r.flag) ? [...talk.flags, r.flag] : talk.flags,
    memory: {
      ...talk.memory,
      [npc.id]: { claims: claim && !mem.claims.includes(claim) ? [...mem.claims, claim] : mem.claims, recent: [...mem.recent, intent].slice(-3) },
    },
  };
  const player = state.player && r.credits ? { ...state.player, credits: state.player.credits + r.credits } : state.player;
  const lines = [...say];
  if (npc.enemy && (r.fight || suspicion >= 100)) {
    return startFight({ ...state, player }, next, npc, [...lines, suspicion >= 100 && !r.fight ? `⚠ SUSPICION 100% — ${npc.name.split(" //")[0]} raises the alarm!` : ""].filter(Boolean));
  }
  if (npc.enemy && suspicion !== before) lines.push(`[suspicion ${suspicion}%]`);
  return { ...state, player, talk: next, log: out(state, ...lines) };
}

export function talkReducer(state: GameState, raw: string): GameState {
  const talk = state.talk;
  const input = raw.trim();
  if (!talk || !input) return state;
  const echoed: GameState = { ...state, log: out(state, `> ${input}`) };
  const text = normalize(input);
  const scene = SCENES[talk.scene];
  const say = (...lines: string[]) => ({ ...echoed, log: out(echoed, ...lines) });

  // In a conversation everything you type goes to them (except help/look)
  if (talk.npc && !has(text, "help") && !/^ (look|l) $/.test(text)) {
    return converse(echoed, talk, NPCS[talk.npc], input);
  }

  if (has(text, "help") || text.trim() === "?") return say(...HELP);
  if (/^ (look|l|look around|where am i) $/.test(text)) return { ...echoed, log: out(echoed, ...describeScene(echoed, talk)) };
  if (/^ (i|inv|inventory|stats|status) $/.test(text) && state.player) {
    const p = state.player;
    return say(`HP ${p.stats.hp}/${p.stats.maxHp} · MP ${p.stats.mp}/${p.stats.maxMp} · 💰 ${p.credits} · ${talk.flags.includes("keycard") ? "🔑 keycard" : "no keycard"}`, `Items: ${p.inventory.map((i) => i.name).join(", ") || "none"}`);
  }

  // Merchant, uplink, terminal: hand over to the normal game screens
  if (talk.scene === "closet" && /\b(shop|buy|trade|vex|merchant)\b/.test(text)) {
    return { ...echoed, mode: "SHOP", currentMerchant: state.merchants.find((m) => m.floor === 0)?.id ?? null, haggle: null, puzzleInput: "", shopLine: "Ah, a talker. Talk is cheap. My stock isn't." };
  }
  if (talk.scene === "closet" && /\b(uplink|upload|flag)\b/.test(text)) {
    return { ...echoed, mode: "UPLINK", puzzleInput: "", log: out(echoed, "", "═══ ISW UPLINK ═══", "Type the flag · ENTER to upload · ESC to disconnect", "") };
  }
  if (talk.scene === "east" && /\b(terminal|hack|computer)\b/.test(text)) {
    const existing = state.puzzles.find((p) => p.id === "talk-terminal");
    if (existing?.solved) return say("You already cracked this terminal. It's showing you a smiley face. Creepy.");
    const puzzle = existing ?? createPuzzle(0, -1, -1, "talk-terminal");
    return {
      ...echoed, mode: "PUZZLE", currentPuzzle: puzzle, puzzleInput: "",
      puzzles: existing ? state.puzzles : [...state.puzzles, { ...puzzle, floor: -1 }],
      log: out(echoed, "", "═══ TERMINAL HACK ═══", `Type: ${puzzle.type.toUpperCase()} cipher`, puzzle.hint, "", "Type the decrypted answer. [ESC] to quit."),
    };
  }

  // Taking things
  if (/\b(take|grab|pick|get|steal)\b/.test(text)) {
    if (talk.scene === "archive" && /\b(medkit|med|kit|health|heal)\b/.test(text) && !talk.flags.includes("took_medkit") && state.player) {
      return {
        ...say("You pocket the MEDKIT."), talk: { ...talk, flags: [...talk.flags, "took_medkit"] },
        player: { ...state.player, inventory: [...state.player.inventory, { id: "talk-medkit", name: "NanoMed Kit", description: "Restores 20 HP", type: "heal", value: 20 }] },
      };
    }
    if (talk.scene === "archive" && /\b(blade|weapon|plasma|sword)\b/.test(text) && !talk.flags.includes("took_blade") && state.player) {
      return {
        ...say("You peel the PLASMA BLADE off the desk. +4 ATK."), talk: { ...talk, flags: [...talk.flags, "took_blade"] },
        player: { ...state.player, stats: { ...state.player.stats, atk: state.player.stats.atk + 4 } },
      };
    }
    if (talk.scene === "security" && /\b(keycard|key|card)\b/.test(text) && !talk.flags.includes("keycard")) {
      if (npcDead(state, "guard")) return { ...say("You take the KEYCARD off the unconscious guard."), talk: { ...talk, flags: [...talk.flags, "keycard"] } };
      return converse(echoed, talk, NPCS.guard, "threaten"); // grabbing it off his belt goes about as well as you'd think
    }
    return say("There's nothing like that to take here.");
  }

  // Leaving the floor
  if (talk.scene === "east" && /\b(down|descend|hatch|stairs|ladder|leave)\b/.test(text)) {
    if (!talk.flags.includes("keycard")) return say("The hatch won't budge. The keycard slot blinks red. Maybe someone around here has a card.");
    return {
      ...say(
        "You swipe the keycard. The light turns green. The hatch groans open.",
        `${ISW_CHAN_TAG} Talked your way through my first floor? ...Fine. I'll remember your voice.`,
        "", "╔══════════════════════════════════════╗", "║     END OF THE TALK MODE PILOT       ║", "║  Floors 2-6 are still being written. ║", "╚══════════════════════════════════════╝",
      ),
      mode: "WIN",
    };
  }

  // Starting a conversation or a fight with someone in the room
  const present = scene.npcs.filter((id) => !npcDead(state, id)).map((id) => NPCS[id]);
  const attack = /\b(attack|fight|kill|hit|punch)\b/.test(text);
  const talkTo = /\b(talk|speak|chat|ask|approach|greet|say)\b/.test(text);
  const target = matchWords(text, present) ?? (present.length === 1 && (attack || talkTo) ? present[0] : null);
  if (target && attack) {
    if (!target.enemy) return say(`${ISW_CHAN_TAG} You're punching an intercom. I'm not even in it.`);
    return startFight(echoed, talk, target, ["You lunge first."]);
  }
  if (target && talkTo) {
    const next = { ...talk, npc: target.id };
    return { ...echoed, talk: next, log: out(echoed, "", `═══ TALKING TO ${target.name} ═══`, ...target.intro, "(type anything · 'bye' to stop)") };
  }

  // Moving
  const exit = matchWords(text, scene.exits);
  if (exit && /\b(go|walk|move|enter|head|run|goto|to|back|north|south|east|west|n|s|e|w)\b|^ \S+ $/.test(text) || (exit && exit.words.some((w) => text.trim() === w))) {
    const blocked = exit.to === "archive" && !talk.flags.includes("process_gone") && !npcDead(state, "process");
    if (blocked) return say("PID 6666 is floating right in front of the archive door. It won't let you pass.");
    const first = !talk.visited.includes(exit.to);
    const next: TalkState = { ...talk, scene: exit.to, npc: null, visited: first ? [...talk.visited, exit.to] : talk.visited };
    const extra = first && exit.to === "east" ? [`${ISW_CHAN_TAG} *crackle* Oh, hi. You can talk to me through the intercom, you know. I'm SO lonely.`] : [];
    return { ...echoed, talk: next, log: out(echoed, ...describeScene(echoed, next), ...extra) };
  }

  // Anything else, with exactly one person around: you're talking to them
  if (present.length === 1) {
    const npc = present[0];
    return converse({ ...echoed, log: out(echoed, `(you say that to ${npc.name.split(" //")[0]})`) }, talk, npc, input);
  }

  return say(pick(["You mutter to yourself. Nobody cares.", "That does nothing.", "The servers hum, unimpressed."]), "(type 'help' for commands)");
}
