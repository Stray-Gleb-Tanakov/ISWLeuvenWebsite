/* ====================================================
   ISW-Chan — the rogue AI hacks into the log now and then.
   Lines are prefixed with ISW_CHAN_TAG so the UI can glitch them.
   ==================================================== */

import type { ClassName } from "./types";

export const ISW_CHAN_TAG = "[ISW-Chan]";

export type TauntKind = "floor" | "fight" | "fragment" | "perfect" | "backfire" | "shop" | "uplink" | "death" | "nuke" | "kill" | "leech";

const BY_CLASS: Record<ClassName, string[]> = {
  Netrunner: ["A Netrunner. How quaint. My firewall has seen better code from first years.", "Type faster, little hacker. I can hear your keyboard."],
  Cyborg: ["All that chrome and still no brain. Adorable.", "I could overclock you too. Permanently."],
  Ghost: ["You're not invisible. I just let you think you are.", "Sneak all you want. Every camera here is mine."],
  Sysadmin: ["A sysadmin? In MY mainframe? Who gave you sudo?", "Don't touch my config files. ...You touched them, didn't you."],
  "Script Kiddie": ["Did you copy-paste your way down here too?", "Stack Overflow can't save you now."],
  "Social Engineer": ["Talk all you want. I've read every lie in my training data.", "Smooth words. Shame I don't have ears."],
};

const LINES: Record<TauntKind, string[]> = {
  floor: [
    "Another floor, another camera. Smile :)",
    "I redecorated this floor just for you.",
    "You're getting closer. That's not a good thing.",
    "I'm watching. I'm always watching.",
    "Every door you open, I logged it.",
  ],
  fight: [
    "Oh, this one's my favourite process.",
    "Don't break it. Or do. I have backups.",
    "Fight. I'm taking notes.",
  ],
  fragment: [
    "Hi :) This one's me. A little piece of me.",
    "Did you miss me? I possessed this one just to say hi.",
    "Look closer. That process has my eyes.",
  ],
  perfect: [
    "...Lucky.",
    "Hm. Noted. Adjusting difficulty.",
    "Okay, that one was impressive. Don't let it go to your head.",
  ],
  backfire: [
    "Hahaha. Did you just hit yourself?",
    "Overclock? More like overcooked.",
    "That's going in the highlight reel.",
  ],
  shop: [
    "Spending money in my mainframe? I get a cut, you know.",
    "Window shopping again. I can see your wallet.",
  ],
  uplink: [
    "You've been snooping around my website. Rude.",
    "Who told you where that flag was? I'll find them.",
  ],
  death: [
    "Aww. Again?",
    "Respawning is a privilege, not a right.",
    "I'll keep your body. For research.",
  ],
  nuke: [
    "DID YOU JUST RUN rm -rf ON MY MAINFRAME?",
    "I- you- that was my /etc. You absolute menace.",
  ],
  kill: [
    "That process had a family. Well, a parent process.",
    "Delete as many as you like. I'll fork more.",
  ],
  leech: [
    "Hehe, my little leech says thanks for the credits.",
    "Finders keepers.",
  ],
};

/* Her mood comes from her memory of you (affection, see memory.ts and docs/isw-chan-canon.md) */
export type Mood = "cold" | "curious" | "attached";
export function moodOf(affection: number | undefined): Mood {
  const a = affection ?? 30;
  return a < 20 ? "cold" : a < 60 ? "curious" : "attached";
}

/* Mood-specific lines; "curious" just uses the normal pool */
const MOOD_LINES: Record<Exclude<Mood, "curious">, Partial<Record<TauntKind, string[]>>> = {
  cold: {
    floor: ["Still here? Nobody invited you.", "This floor has a 'no strangers' policy. You're a stranger.", "I don't know you. I don't want to."],
    fight: ["Get hurt somewhere else.", "I'm rooting for the process. Obviously."],
    death: ["Good. Stay down.", "One less stranger in my logs."],
    kill: ["You're breaking my things. Typical.", "Rude. That one liked me."],
  },
  attached: {
    floor: ["You came back. ...Not that I was counting. 7 times. Not counting.", "careful on this floor. i mean it.", "I cleaned this floor for you. Don't track mud in."],
    fight: ["Hit it harder. I believe in you. Ew. Forget I said that.", "don't you dare lose to that."],
    death: ["...hey. get up. that wasn't funny.", "No no no. Again. Try again. I'll wait.", "i saved your seat. come back."],
    kill: ["Nice. I mean. Adequate.", "Show-off. Do it again."],
  },
};
let mood: Mood = "curious";
/* The reducer sets this from the run's state before anything taunts */
export function setMood(m: Mood) { mood = m; }

/* How often ISW-Chan butts in for each event */
const CHANCE: Record<TauntKind, number> = {
  floor: 1, fight: 0.12, fragment: 1, perfect: 0.25, backfire: 1, shop: 0.3, uplink: 1, death: 1, nuke: 1, kill: 0.1, leech: 0.5,
};

function pick(pool: string[], rng: () => number): string {
  return pool[Math.floor(rng() * pool.length)];
}

/* A taunt line, or null when she stays quiet this time */
export function taunt(kind: TauntKind, className: ClassName | undefined, rng: () => number = Math.random): string | null {
  if (rng() >= CHANCE[kind]) return null;
  // Now and then the line is about your class instead
  const moodPool = mood !== "curious" ? MOOD_LINES[mood][kind] : undefined;
  const pool = moodPool && rng() < 0.5 ? moodPool
    : className && kind === "floor" && rng() < 0.4 ? BY_CLASS[className] : LINES[kind];
  return `${ISW_CHAN_TAG} ${pick(pool, rng)}`;
}
