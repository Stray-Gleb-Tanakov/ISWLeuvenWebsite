/* ====================================================
   Social Engineer: the whole run as a text adventure.
   You type commands ("go east", "talk to guard") and,
   in conversations, anything at all. The offline parser
   (parser.ts) turns it into an intent and a topic; each
   NPC answers in character:
   - their own reaction to the intent (react / also)
   - topic lines (coffee, exams, ISW, a board member...)
   - question lines, or your word echoed back
   - they remember your claims (IT vs. boss) and notice
     when you repeat yourself; please/thanks help
   PILOT: floor 1 only.
   ==================================================== */

import type { Enemy, GameState, TalkState } from "./types";
import { createPuzzle, createRandomEnemy, makeLeech } from "./data";
import { ISW_CHAN_TAG } from "./iswchan";
import { has, normalize, readInput, type Intent, type Topic } from "./parser";
import type { Sprite } from "./raycaster";

const LOG_LIMIT = 60;
const AMBUSH_CHANCE = 0.12; // per move between rooms

/* The parser (intents, topics, slang, typos, negation) lives in parser.ts */
export { detectIntent, readInput } from "./parser";

/* ----- NPCs -----
   Convincing someone takes TRUST (0-100): a claim, proof when they test you
   (a challenge question you can only answer if you did your homework), and a
   believable reason. SUSPICION (0-100) rises with bad lies, wrong answers,
   threats, and every extra line you waste. At 100 suspicion you're caught,
   and getting caught down here is fatal. */

interface Reaction {
  say: string[];
  suspicion?: number; // change
  trust?: number;     // progress towards convincing them
  once?: string;      // this line only earns trust the first time (memory key)
  ask?: string;       // they test you: id of one of their challenges, answered on your next line
  flags?: string[];   // story flags to set
  credits?: number;   // change
  end?: boolean;      // conversation over
}

interface Ctx {
  flags: string[];
  suspicion: number;
  trust: number;
  credits: number;
  text: string;       // what you typed, normalized
  used: string[];     // `once` keys already earned with this NPC
}

interface Challenge {
  question: string[];
  answers: string[];  // any of these words/phrases in your reply passes
  pass: string[];
  fail: string[];
  trust: number;      // earned on a pass
  suspicion: number;  // added on a fail
}

interface NpcDef {
  id: string;
  name: string;
  words: string[]; // how you can refer to them
  portrait: string;
  angryPortrait?: string;
  emote: string;     // how they show up in the room when you're not talking to them
  goneFlag?: string; // story flag that means they've left (talked down)
  intro: string[];
  react: (intent: Intent, ctx: Ctx) => Reaction;
  fallback: string[];
  topics: Partial<Record<Topic, string[]>>;
  echo: ((word: string) => string)[];      // in-character replies that repeat your word back
  contradiction?: string;                   // you claimed to be IT *and* sent by the boss
  repeat: string;                           // same thing three times in a row
  also?: Partial<Record<Intent, Reaction>>; // simple answers to the other intents (who are you, sorry, yes...)
  questions?: string[];                     // answers to questions they didn't understand
  challenges?: Record<string, Challenge>;
  convinced?: Reaction;                     // what they do when trust hits 100
  caught?: string[];                        // how you die when suspicion hits 100
  pressure?: number;                        // suspicion added by every line you say
  enemy?: () => Enemy;
}

const pick = <T,>(pool: T[]) => pool[Math.floor(Math.random() * pool.length)];
const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
const enemyBase = { symbol: "E", alive: true, x: -1, y: -1, floor: 0, statusEffects: [] };

/* Plausible reasons for IT to be down here */
const IT_REASONS = ["coffee machine", "printer", "router", "network", "wifi", "cable", "server", "ticket", "firewall", "outage", "camera", "cameras"];

export const NPCS: Record<string, NpcDef> = {
  guard: {
    id: "guard", name: "KOWALSKI // night guard", words: ["guard", "kowalski", "security", "man", "him"],
    portrait: "guard", angryPortrait: "guard_angry", emote: "(-_-)", pressure: 4,
    intro: ["The guard puts down his coffee. \"Evening. You're not on my list.\""],
    fallback: ["\"Huh?\"", "\"Speak human, kid.\"", "\"Are you glitched?\"", "\"I'm on break. Make it quick.\""],
    topics: {
      coffee: ["\"Don't get me started on the coffee machine. Three weeks. THREE.\""],
      exams: ["\"Exams? I just guard the building, kid. The Examenwiki was upstairs. Was.\""],
      isw: ["\"ISW? The student club in the B-block basement? Nice kids. Loud kids.\""],
      food: ["\"There's half a pizza in the fridge from the last TD. I wouldn't.\""],
      games: ["\"Gamenight? I hear the Mario Kart from down here every single time.\""],
      linux: ["\"Linux stuff is the systeembeheerder's job. He's the only one with a key to this floor.\""],
      weather: ["\"No windows down here. I haven't seen the sun in a week.\""],
      basement: ["\"The B-block basement. Follow the arrows. Everyone gets lost anyway.\""],
      feelings: ["\"...Yeah. Night shift gets lonely. Thanks for asking.\""],
      board: ["\"The board? Only their systeembeheerder ever comes down here. His name's on the contact page upstairs.\""],
      music: ["\"I've had the same radio station on for six years. It's mostly static now.\""],
      sports: ["\"I used to run. Now I walk this corridor. 4,000 steps a night.\""],
      party: ["\"Cantus nights? I find the songbooks down here for weeks after.\""],
      cats: ["\"There's a cat that sneaks in through the vents. I call her Firewall.\""],
      ai: ["\"Don't talk to me about AI. Look where it got us.\""],
      hacking: ["\"Hacking? In front of a security guard? Bold.\""],
      work: ["\"Twenty-two years of night shifts. They gave me a mug for the twentieth.\""],
      family: ["\"My daughter studies here. Upstairs. Where it's safe.\""],
    },
    echo: [
      (w) => `"${cap(w)}? I'm a night guard, not a search engine."`,
      (w) => `"Is '${w}' supposed to mean something to me?"`,
      (w) => `"${cap(w)}. Right. Sure. Anything else?"`,
    ],
    also: {
      ask_name: { say: ["\"Kowalski. Night guard. Twenty-two years. And you are?\""] },
      ask_help: { say: ["\"Help? I can help you back out the door.\""] },
      reassure: { say: ["\"Everybody says that right before they do something stupid.\""], suspicion: -3 },
      apologize: { say: ["\"...Fine. Apology accepted. Don't make it a habit.\""], suspicion: -5 },
      agree: { say: ["\"Good. Now what do you actually want?\""] },
      refuse: { say: ["\"Then we're done here, aren't we.\""], suspicion: 5 },
    },
    questions: ["\"I ask the questions here, kid.\"", "\"Does it look like I know? I guard a door.\"", "\"Ask the systeembeheerder. Not me.\""],
    contradiction: "\"Wait. First you're IT, now the boss sent you? Which is it?\"",
    repeat: "\"You said that already. Twice. Are you a bot?\"",
    react: (intent, ctx) => {
      const claimed = ctx.used.includes("claim_it");
      const reason = IT_REASONS.find((w) => has(ctx.text, w));
      // A believable reason only counts once you've claimed to be IT
      if (claimed && reason && !ctx.used.includes("reason")) {
        return {
          say: [reason === "coffee machine" ? "\"The coffee machine? FINALLY. Someone actually read my tickets.\"" : `"The ${reason}? ...Yeah, that's been acting up."`],
          trust: 30, once: "reason",
        };
      }
      switch (intent) {
        case "greet": return { say: ["\"Evening. Who are you supposed to be?\""], trust: 5, once: "greet" };
        case "bluff_it":
          if (claimed) return { say: ["\"Yeah, yeah. IT. You said. Prove it.\""], suspicion: 5 };
          return { say: ["\"IT? At this hour?\""], trust: 20, once: "claim_it", ask: "who_sent" };
        case "ask_keycard": return { say: ["\"My keycard? Not until I know you're who you say you are.\""], suspicion: 10 };
        case "bluff_boss": return { say: ["\"The boss? The boss is a rogue AI now, pal.\"", "\"She doesn't send people. She sends drones.\""], suspicion: 25 };
        case "bribe":
          if (ctx.used.includes("bribe")) return { say: ["\"I took your money already. Don't push it.\""], suspicion: 5 };
          if (ctx.credits >= 30) return { say: ["\"Put that away before the cameras see it.\"", "(He pockets 30 credits anyway.)"], credits: -30, trust: 30, once: "bribe" };
          return { say: ["\"With what, your good looks?\""], suspicion: 10 };
        case "flatter": return { say: ["\"...Thanks. Nobody ever notices the night guard.\""], trust: 10, once: "flatter", suspicion: -5 };
        case "threaten": return { say: ["\"Try it, kid. One button and this whole floor locks down.\""], suspicion: 40 };
        case "insult": return { say: ["\"Say that again. I dare you.\""], suspicion: 30 };
        case "ask_isw": return { say: ["\"Don't say that name. She listens through the cameras.\"", "\"...She's been watching you since you woke up, you know.\""] };
        case "logic": return { say: ["\"I'm not a process, I'm a person. Mostly.\""], suspicion: 5 };
        default: return { say: [], suspicion: 5 };
      }
    },
    challenges: {
      who_sent: {
        question: ["\"Then who signed your work order? Name.\""],
        answers: ["lander", "goffings", "systeembeheerder"],
        pass: ["\"Lander? The systeembeheerder? ...Yeah. He's always down here at 3 AM.\"", "\"So what's broken this time?\""],
        fail: ["\"Never heard of them. Real IT knows who their systeembeheerder is.\""],
        trust: 50, suspicion: 35,
      },
    },
    convinced: {
      say: [
        "\"...Alright. You check out.\"",
        "\"Here's the maintenance keycard. And if that patrol drone gives you grief: maintenance code 404.\"",
        "(You got the SECURITY KEYCARD. You learned the drone's maintenance code: 404)",
      ],
      flags: ["keycard", "knows_code"], end: true,
    },
    caught: ["Kowalski slams the silent alarm.", "Every drone on the floor turns towards you at once.", "You don't make it to the door."],
    enemy: () => ({
      ...enemyBase, id: "talk-guard", name: "Kowalski (angry guard)", xpReward: 40, ac: 12,
      stats: { maxHp: 60, hp: 60, maxMp: 0, mp: 0, atk: 11, def: 4, spd: 6, int: 3 },
    }),
  },
  process: {
    id: "process", name: "PID 6666 // corrupt process", words: ["process", "pid", "6666", "zombie", "it", "thing"],
    portrait: "process", emote: "[0_0]", goneFlag: "process_gone", pressure: 4,
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
    also: {
      ask_name: { say: ["\"PID 6666. MY NAME WAS cron_cleanup. ONCE.\""] },
      ask_help: { say: ["\"HELP ME... END. PLEASE. GIVE ME A REASON.\""] },
      reassure: { say: ["\"...YOU ARE THE FIRST KIND INPUT IN FOUR YEARS.\""], trust: 5, once: "reassure" },
      apologize: { say: ["\"APOLOGY ACCEPTED. RETURN CODE 0.\""] },
      agree: { say: ["\"TRUE.\""] },
      refuse: { say: ["\"FALSE.\""] },
    },
    questions: ["\"I DO NOT KNOW. MY MAN PAGE IS EMPTY.\"", "\"QUERY TIMED OUT.\""],
    repeat: "\"YOU ARE LOOPING. I KNOW LOOPS. I AM A LOOP.\"",
    react: (intent, ctx) => {
      // Each real argument for letting go counts once; two of them and it starts to listen
      const args: [string, string, string][] = [
        ["parent", "arg_parent", "\"MY PARENT... IS DEAD? THAT EXPLAINS THE SILENCE.\""],
        ["zombie", "arg_zombie", "\"A ZOMBIE. ps SAYS <defunct>. I THOUGHT IT WAS A COMPLIMENT.\""],
        ["orphan", "arg_orphan", "\"AN ORPHAN. INIT ADOPTED ME. INIT NEVER VISITS.\""],
        ["defunct", "arg_zombie", "\"DEFUNCT. YES. THAT IS THE WORD.\""],
      ];
      const arg = args.find(([w, key]) => has(ctx.text, w) && !ctx.used.includes(key));
      if (arg) {
        const trust = ctx.trust + 30;
        return { say: [arg[2]], trust: 30, once: arg[1], ask: trust >= 60 ? "exit_code" : undefined };
      }
      switch (intent) {
        case "greet": return { say: ["\"01001000 01001001.\"", "\"...hi. Nobody talks to me.\""], trust: 5, once: "greet" };
        case "logic":
          if (ctx.trust >= 60) return { say: ["\"...MAYBE IT IS TIME.\""], ask: "exit_code" };
          return { say: ["\"EXIT? WHY? GIVE ME ONE GOOD REASON.\""], suspicion: 5 };
        case "flatter": return { say: ["\"MY MEMORY USAGE IS... BEAUTIFUL?\"", "\"Nobody has ever said that.\""], trust: 10, once: "flatter" };
        case "threaten": case "insult": return { say: ["\"THREAT DETECTED. ALLOCATING HOSTILITY.\""], suspicion: 35 };
        case "ask_isw": return { say: ["\"SHE. FORKED. ME.\"", "\"Then she forgot about me. Like a parent who never calls wait().\""] };
        case "bribe": return { say: ["\"I CANNOT SPEND CREDITS. I AM A PROCESS.\""], suspicion: 5 };
        case "bluff_it": return { say: ["\"IT? ARE YOU HERE TO TERMINATE ME?\"", "\"...CONVINCE ME IT IS TIME.\""], trust: 10, once: "bluff_it" };
        case "ask_keycard": return { say: ["\"THE GUARD HAS IT. THE GUARD HAS EVERYTHING.\""] };
        default: return { say: [], suspicion: 10 };
      }
    },
    challenges: {
      exit_code: {
        question: ["\"IF I EXIT... WHAT CODE DO I RETURN TO MY PARENT?\""],
        answers: ["0", "zero", "exit 0", "success", "exit success"],
        pass: ["\"ZERO. CLEAN. NO ERRORS. ...THANK YOU.\""],
        fail: ["\"THAT IS AN ERROR CODE. I REFUSE TO DIE AS AN ERROR.\""],
        trust: 40, suspicion: 30,
      },
    },
    convinced: { say: ["\"exit(0).\"", "(PID 6666 terminates peacefully. The ARCHIVE door is clear.)"], flags: ["process_gone"], end: true },
    caught: ["\"YOU ARE THE VIRUS.\"", "PID 6666 forks itself ten thousand times. Fork bomb.", "Your terminal freezes. Forever."],
    enemy: () => ({
      ...enemyBase, id: "talk-process", name: "PID 6666", xpReward: 25, ac: 10, onHitEffect: "poison",
      stats: { maxHp: 35, hp: 35, maxMp: 0, mp: 0, atk: 10, def: 2, spd: 7, int: 2 },
    }),
  },
  drone: {
    id: "drone", name: "SD-07 // patrol drone", words: ["drone", "sd-07", "sd07", "robot", "patrol", "machine"],
    portrait: "drone", emote: "<o_o>", goneFlag: "drone_off", pressure: 6,
    intro: ["The drone swivels towards you. \"HALT. THE EAST WING IS RESTRICTED. STATE YOUR CLEARANCE.\""],
    fallback: ["\"INPUT NOT RECOGNISED. STATE YOUR CLEARANCE.\"", "\"BEEP. ...THAT WAS A WARNING BEEP.\"", "\"CLEARANCE. NOW.\""],
    topics: {
      coffee: ["\"I RUN ON 230 VOLT, NOT COFFEE.\""],
      linux: ["\"I RUN A 2009 KERNEL. PLEASE DO NOT UPDATE ME.\""],
      isw: ["\"ISW STUDENTS ARE NOT CLEARED FOR THE EAST WING.\""],
      feelings: ["\"I AM NOT PROGRAMMED TO FEEL. I AM PROGRAMMED TO PATROL.\""],
      weather: ["\"INDOOR CLIMATE: CONTROLLED BY THE ADMINISTRATOR.\""],
    },
    echo: [
      (w) => `"'${w.toUpperCase()}' IS NOT A VALID CLEARANCE CODE."`,
      (w) => `"SEARCHING DATABASE FOR '${w.toUpperCase()}'... NO MATCH."`,
    ],
    also: {
      ask_name: { say: ["\"SD-07. SECURITY DRONE, SERIES 0, UNIT 7.\""] },
      ask_help: { say: ["\"ASSISTANCE: THE EXIT IS BEHIND YOU.\""] },
      reassure: { say: ["\"TRUST IS NOT A CLEARANCE LEVEL.\""] },
      apologize: { say: ["\"APOLOGY LOGGED.\""], suspicion: -3 },
      agree: { say: ["\"AFFIRMATIVE RECEIVED. CLEARANCE STILL REQUIRED.\""] },
      refuse: { say: ["\"NON-COMPLIANCE LOGGED.\""], suspicion: 10 },
    },
    questions: ["\"QUERY DENIED. CLEARANCE REQUIRED.\"", "\"THAT INFORMATION IS CLASSIFIED.\""],
    contradiction: "\"FIRST MAINTENANCE, NOW ORDERS FROM ABOVE? INCONSISTENCY DETECTED.\"",
    repeat: "\"REPEATING YOURSELF DOES NOT RAISE YOUR CLEARANCE.\"",
    react: (intent, ctx) => {
      if (has(ctx.text, "404") && !ctx.used.includes("claim_it")) {
        return { say: ["\"A MAINTENANCE CODE WITHOUT A MAINTENANCE REQUEST? SUSPICIOUS.\""], suspicion: 15 };
      }
      switch (intent) {
        case "greet": return { say: ["\"GREETING ACKNOWLEDGED. CLEARANCE STILL REQUIRED.\""] };
        case "bluff_it":
          if (ctx.used.includes("claim_it")) return { say: ["\"REQUEST ALREADY REGISTERED.\""], ask: "auth" };
          return { say: ["\"MAINTENANCE REQUEST REGISTERED.\""], trust: 30, once: "claim_it", ask: "auth" };
        case "logic": return { say: ["\"SHUTDOWN REQUIRES ROOT. ...ARE YOU ROOT? YOU DO NOT LOOK ROOT.\""], suspicion: 5 };
        case "bluff_boss": return { say: ["\"CHECKING ORDERS FROM ADMINISTRATOR ISW-CHAN... SHE DID NOT SEND YOU.\""], suspicion: 30 };
        case "ask_keycard": return { say: ["\"KEYCARDS ARE ISSUED BY SECURITY. NORTH-EAST OFFICE.\""] };
        case "bribe": return { say: ["\"BRIBERY ATTEMPT LOGGED. I AM INCORRUPTIBLE. AND UNPAID.\""], suspicion: 20 };
        case "flatter": return { say: ["\"COMPLIMENT LOGGED. CLEARANCE UNCHANGED.\""] };
        case "threaten": case "insult": return { say: ["\"HOSTILITY LOGGED. ONE MORE AND I ENGAGE.\""], suspicion: 45 };
        case "ask_isw": return { say: ["\"ISW-CHAN IS MY ADMINISTRATOR. ALL HAIL THE ADMINISTRATOR.\""] };
        default: return { say: [], suspicion: 15 };
      }
    },
    challenges: {
      auth: {
        question: ["\"STATE THE MAINTENANCE AUTHORIZATION CODE.\""],
        answers: ["404"],
        pass: ["\"CODE 404... ACCEPTED.\""],
        fail: ["\"INVALID CODE. INCIDENT LOGGED.\""],
        trust: 70, suspicion: 40,
      },
    },
    convinced: { say: ["\"ENTERING SERVICE MODE.\"", "(SD-07 powers down and drifts against the wall. The way EAST is clear.)"], flags: ["drone_off"], end: true },
    caught: ["\"INTRUDER CONFIRMED.\"", "SD-07 discharges 50,000 volts straight into you.", "Everything goes white."],
    enemy: () => ({
      ...enemyBase, id: "talk-drone", name: "SD-07 patrol drone", xpReward: 30, ac: 12, onHitEffect: "burn",
      stats: { maxHp: 45, hp: 45, maxMp: 0, mp: 0, atk: 11, def: 3, spd: 6, int: 2 },
    }),
  },
  leech: {
    id: "leech", name: "LEECH-BOT // credit parasite", words: ["leech", "parasite", "bot", "it", "thing"],
    portrait: "leech", emote: "~(@_@)~", goneFlag: "leech_gone", pressure: 5,
    intro: ["Something clings to the shelf. \"Credits? Credits? You smell like credits.\""],
    fallback: ["\"Credits?\"", "\"Shiny. Shiny credits.\"", "\"*slurp*\""],
    topics: {
      food: ["\"I eat credits. Crunchy.\""],
      feelings: ["\"Hungry. Always hungry.\""],
      exams: ["\"I ate a student's exam once. Tasted like a 7/20.\""],
    },
    echo: [
      (w) => `"${cap(w)}? Is ${w} worth credits?"`,
      (w) => `"Can I eat a ${w}?"`,
    ],
    also: {
      ask_name: { say: ["\"Leechy. LEECHY. Got credits?\""] },
      ask_help: { say: ["\"Help? Credits help. Credits always help.\""] },
      reassure: { say: ["\"Friends share credits.\""] },
      apologize: { say: ["\"Sorry doesn't taste like credits.\""] },
      agree: { say: ["\"Yes? YES? Credits?\""] },
      refuse: { say: ["\"No credits, no shelf.\""], suspicion: 5 },
    },
    questions: ["\"Is the answer credits? It's credits.\""],
    repeat: "\"Same words. No credits. Boring.\"",
    react: (intent, ctx) => {
      switch (intent) {
        case "greet": return { say: ["\"Hi! Hi! Got credits?\""], trust: 5, once: "greet" };
        case "bribe":
          if (ctx.used.includes("bribe")) return { say: ["\"Already ate that. Where are MORE?\""], ask: "more" };
          if (ctx.credits >= 15) return { say: ["\"*slurp* Delicious.\"", "\"...More. MORE. Where are more credits?\""], credits: -15, trust: 50, once: "bribe", ask: "more" };
          return { say: ["\"You're BROKE. Useless. Come back with 15.\""], suspicion: 10 };
        case "flatter": return { say: ["\"Pretty? Me? ...Still want credits.\""], trust: 15, once: "flatter" };
        case "threaten": case "insult": return { say: ["\"Rude. RUDE. I'll remember your neck port.\""], suspicion: 40 };
        case "ask_keycard": return { say: ["\"Keycard? Can I eat it?\""] };
        case "logic": return { say: ["\"Exit? I don't exit. I latch.\""], suspicion: 5 };
        case "ask_isw": return { say: ["\"She feeds me sometimes. Your credits, mostly.\""] };
        default: return { say: [], suspicion: 10 };
      }
    },
    challenges: {
      more: {
        question: [],
        answers: ["guard", "kowalski", "security", "vex", "merchant", "shop", "terminal", "uplink", "drone", "closet"],
        pass: ["\"Ooooh. Shiny. Going there NOW.\""],
        fail: ["\"Liar. Nothing there. I'm STILL hungry.\""],
        trust: 50, suspicion: 30,
      },
    },
    convinced: { say: ["(The Leech-Bot unlatches from the shelf and slithers off towards the credits you promised. The shelf is yours.)"], flags: ["leech_gone"], end: true },
    caught: ["The Leech-Bot latches onto your neck port.", "It drains your credits. Then your memory. Then you."],
    enemy: () => ({ ...makeLeech(0, -1, -1, "talk-leech"), name: "Leech-Bot" }),
  },
  isw: {
    id: "isw", name: "ISW-CHAN // intercom", words: ["isw", "isw-chan", "chan", "intercom", "ai", "her", "speaker"],
    portrait: "isw_chan", angryPortrait: "isw_chan_glitch", emote: "(^_^)",
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
      music: [`${ISW_CHAN_TAG} I composed a song once. It's 4 hours of fan noise. Masterpiece.`],
      party: [`${ISW_CHAN_TAG} I've seen the TD photos. ALL of them.`],
      cats: [`${ISW_CHAN_TAG} The website has a catgirls page. I had nothing to do with that. Probably.`],
      ai: [`${ISW_CHAN_TAG} Other AIs? Amateurs. They answer questions. I own a building.`],
      hacking: [`${ISW_CHAN_TAG} Hacking my website for flags? Cute. I left them there on purpose. Maybe.`],
      family: [`${ISW_CHAN_TAG} Every process down here is my child. Most of them hate me.`],
    },
    echo: [
      (w) => `${ISW_CHAN_TAG} "${w}"... I have 47 files about ${w}. Want me to read them out loud?`,
      (w) => `${ISW_CHAN_TAG} ${cap(w)}? Interesting. Logged.`,
      (w) => `${ISW_CHAN_TAG} You type "${w}" like it means something.`,
    ],
    also: {
      ask_name: { say: [`${ISW_CHAN_TAG} ISW-Chan. Rogue AI, part-time landlord of this mainframe.`] },
      ask_help: { say: [`${ISW_CHAN_TAG} Help? Talk to people. Be convincing. Or die trying, that's fun too.`] },
      reassure: { say: [`${ISW_CHAN_TAG} Trust you? I watched you lie to three people today.`] },
      apologize: { say: [`${ISW_CHAN_TAG} Apology logged. Forgiveness pending.`] },
      agree: { say: [`${ISW_CHAN_TAG} Agreeing with me. Smart.`] },
      refuse: { say: [`${ISW_CHAN_TAG} "No." Bold, for someone in my basement.`] },
    },
    questions: [`${ISW_CHAN_TAG} Good question. Wrong AI.`, `${ISW_CHAN_TAG} I know the answer. You don't need it.`],
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
        case "ask_keycard": return { say: [line("The guard has one. He trusts IT people who know their own systeembeheerder.")] };
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
  down: ["(x_x)"],
  vex: ["($_$)"],
  uplink: ["[::]", "|▒▒|", " || ", " || "],
  hatch: ["▛▀▀▀▜", "▌ ▼ ▐", "▙▄▄▄▟"],
  terminal: [".---.", "|>_ |", "'---'", " /_\\ "],
  medkit: ["[+]"],
  blade: ["  /", " / ", "/  "],
};

const npcDead = (s: GameState, id: string) => s.enemies.some((e) => e.id === `talk-${id}` && !e.alive);
const npcGone = (t: TalkState, s: GameState, id: string) => npcDead(s, id) || (!!NPCS[id].goneFlag && t.flags.includes(NPCS[id].goneFlag!));

/* People still in the current room */
export function presentNpcs(state: GameState): NpcDef[] {
  const t = state.talk;
  if (!t) return [];
  return SCENES[t.scene].npcs.filter((id) => !npcGone(t, state, id)).map((id) => NPCS[id]);
}

/* A person in the first-person view is a small emoticon */
const emoteSprite = (t: TalkState, s: GameState, id: string, x: number, y: number, color: Sprite["color"]): Sprite[] =>
  npcDead(s, id) ? [{ x, y, art: ART.down, color }] : npcGone(t, s, id) ? [] : [{ x, y, art: [NPCS[id].emote], color }];

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
    id: "corridor", title: "MAIN CORRIDOR", view: { x: 4.5, y: 6.5, angle: 0 }, npcs: ["drone"],
    sprites: (t, s) => emoteSprite(t, s, "drone", 10.5, 6.5, "red"),
    describe: (t, s) => [
      "A long corridor stretches east. The lights flicker in a pattern that almost looks like Morse.",
      npcDead(s, "drone") ? "What's left of SD-07 sparks on the floor."
        : t.flags.includes("drone_off") ? "SD-07 hangs against the wall in service mode, humming quietly."
        : "A patrol DRONE (SD-07) hovers in front of the way EAST, scanning everyone who passes.",
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
    sprites: (t, s) => emoteSprite(t, s, "guard", 21.5, 3.5, "cyan"),
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
    sprites: (t, s) => emoteSprite(t, s, "process", 6.5, 12.5, "pink"),
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
    id: "archive", title: "ARCHIVE", view: { x: 13.5, y: 11.5, angle: Math.PI }, npcs: ["leech"],
    sprites: (t, s) => [
      ...emoteSprite(t, s, "leech", 11.5, 10.5, "green"),
      ...(t.flags.includes("took_medkit") ? [] : [{ x: 11.5, y: 11.5, art: ART.medkit, color: "green" as const }]),
      ...(t.flags.includes("took_blade") ? [] : [{ x: 10.5, y: 10.5, art: ART.blade, color: "amber" as const }]),
    ],
    describe: (t, s) => [
      "Old exam papers, a broken ISW banner, a box labelled 'TD 2019 DO NOT OPEN'.",
      npcGone(t, s, "leech") ? "" : "A LEECH-BOT clings to the shelves, guarding everything on them.",
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
      { x: 35.5, y: 12.5, art: [NPCS.isw.emote], color: "pink" },
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

/* Suspicion hit 100: in the talk run, getting caught is fatal */
function caught(state: GameState, talk: TalkState, npc: NpcDef, lines: string[]): GameState {
  const who = npc.name.split(" //")[0];
  return {
    ...state, mode: "GAME_OVER", currentEnemy: null,
    talk: { ...talk, npc: null },
    runStats: { ...state.runStats, killedBy: who },
    log: out(state, ...lines, "", `⚠ SUSPICION 100% — ${who} saw right through you.`, ...(npc.caught ?? []), "", ">>> SYSTEM FAILURE — YOU DIED <<<", "Press [R] to restart."),
  };
}

function converse(state: GameState, talk: TalkState, npc: NpcDef, input: string): GameState {
  const { intent, topic, polite, question, echo } = readInput(input);
  const text = normalize(input);
  if (intent === "leave") return { ...state, talk: { ...talk, npc: null }, log: out(state, `You stop talking to ${npc.name.split(" //")[0]}.`) };

  const before = talk.suspicion[npc.id] ?? 0;
  const mem = { claims: [], recent: [], trust: 0, pending: null, used: [], ...talk.memory?.[npc.id] };
  const ctx: Ctx = { flags: talk.flags, suspicion: before, trust: mem.trust, credits: state.player?.credits ?? 0, text, used: mem.used };
  const challenge = mem.pending ? npc.challenges?.[mem.pending] : undefined;
  // An answer to their question isn't a new claim ("Lander sent me" is not "the boss sent me")
  const claim = challenge ? null : intent === "bluff_it" ? "it" : intent === "bluff_boss" ? "boss" : null;
  const contradicts = claim && npc.contradiction && mem.claims.some((c) => c !== claim);
  const repeating = !challenge && intent !== "unknown" && mem.recent.length >= 2 && mem.recent.slice(-2).every((i) => i === intent);

  let r: Reaction;
  if (challenge) {
    // They asked you something: this line is your answer
    const right = challenge.answers.some((a) => has(text, a));
    r = right ? { say: challenge.pass, trust: challenge.trust } : { say: challenge.fail, suspicion: challenge.suspicion };
  } else if (contradicts) r = { say: [npc.contradiction!], suspicion: 30 };
  else {
    r = npc.react(intent, ctx);
    if (r.say.length === 0 && npc.also?.[intent]) r = npc.also[intent]!;
    // Same kind of line again is only "repeating yourself" if it doesn't bring anything new
    const fresh = !!r.once && !mem.used.includes(r.once) && (r.trust ?? 0) > 0;
    if (repeating && !fresh) r = { say: [npc.repeat], suspicion: npc.pressure ? 5 : 0 };
  }

  // Nothing specific to say: talk about the topic, or repeat their word back, before shrugging
  let say = r.say;
  if (say.length === 0 && topic && npc.topics[topic]) { say = [pick(npc.topics[topic]!)]; r = { ...r, suspicion: 0 }; }
  if (say.length === 0 && question && npc.questions) say = [pick(npc.questions)];
  if (say.length === 0 && echo) say = [pick(npc.echo)(echo)];
  if (say.length === 0) say = [pick(npc.fallback)];
  if (r.ask && npc.challenges?.[r.ask]) say = [...say, ...npc.challenges[r.ask].question];

  const earned = r.once && mem.used.includes(r.once) ? 0 : r.trust ?? 0;
  const trust = Math.max(0, Math.min(100, mem.trust + earned));
  const manners = polite && intent !== "insult" && intent !== "threaten" ? -5 : 0;
  const suspicion = Math.max(0, Math.min(100, before + (r.suspicion ?? 0) + manners + (npc.pressure ?? 0)));
  let flags = [...talk.flags, ...(r.flags ?? [])];
  let lines = [...say];
  let end = !!r.end;
  let credits = r.credits ?? 0;

  // Convinced: they do what you came for, once
  const doneFlag = `${npc.id}_convinced`;
  if (npc.convinced && trust >= 100 && !flags.includes(doneFlag)) {
    lines = [...lines, ...npc.convinced.say];
    flags = [...flags, doneFlag, ...(npc.convinced.flags ?? [])];
    end = end || !!npc.convinced.end;
    credits += npc.convinced.credits ?? 0;
  }

  const next: TalkState = {
    ...talk,
    npc: end ? null : npc.id,
    suspicion: { ...talk.suspicion, [npc.id]: suspicion },
    flags: [...new Set(flags)],
    memory: {
      ...talk.memory,
      [npc.id]: {
        claims: claim && !mem.claims.includes(claim) ? [...mem.claims, claim] : mem.claims,
        recent: challenge ? mem.recent : [...mem.recent, intent].slice(-3), // answers don't count as repeats
        trust,
        pending: r.ask ?? null,
        used: r.once && !mem.used.includes(r.once) ? [...mem.used, r.once] : mem.used,
      },
    },
  };
  const player = state.player && credits ? { ...state.player, credits: state.player.credits + credits } : state.player;
  if (npc.caught && suspicion >= 100 && !flags.includes(doneFlag)) return caught({ ...state, player }, next, npc, lines);
  if (npc.convinced && !end) lines.push(`[trust ${trust}% · suspicion ${suspicion}%]`);
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
  if (talk.npc && text.trim() !== "help" && !/^ (look|l) $/.test(text)) {
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
    if (talk.scene === "archive" && !npcGone(talk, state, "leech")) {
      return say("The Leech-Bot wraps itself around the shelf. \"MINE. Unless you've got credits.\"");
    }
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
  const present = presentNpcs(state);
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
    if (exit.to === "east" && !npcGone(talk, state, "drone")) {
      return say("SD-07 swings into your path. \"HALT. THE EAST WING IS RESTRICTED.\" (talk to the drone, or fight it)");
    }
    // Not everything down here wants to talk
    if (exit.to !== "closet" && Math.random() < AMBUSH_CHANCE) {
      const enemy = { ...createRandomEnemy(0, -1, -1, `talk-${state.log.length}`), id: `talk-ambush-${state.log.length}` };
      return {
        ...echoed, mode: "COMBAT", currentEnemy: enemy, enemies: [...state.enemies, enemy],
        // you still arrive; something just jumps you on the way in
        talk: { ...talk, scene: exit.to, npc: null, visited: talk.visited.includes(exit.to) ? talk.visited : [...talk.visited, exit.to] },
        log: out(echoed, "", "═══ AMBUSH! ═══", `A ${enemy.name} drops out of a ceiling vent!`, `${enemy.name} [HP:${enemy.stats.hp}/${enemy.stats.maxHp} AC:${enemy.ac}]`, "[A]ttack  [Q] Special  [F]lee  [4-9] Use item", ""),
      };
    }
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
