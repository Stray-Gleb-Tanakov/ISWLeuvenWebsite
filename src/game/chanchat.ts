/* ====================================================
   ISW-Chan's small talk: one reply for anything you type.
   Offline (the dialogue parser), in her canon voice
   (docs/isw-chan-canon.md). Used by the secret ending and
   the console chat; a real chatbot can replace this later.
   ==================================================== */

import { readInput, type Intent, type Topic } from "./parser";
import { echoable } from "./chanfilter";

const BY_INTENT: Partial<Record<Intent, string[]>> = {
  greet: ["hi. ...you're talking to me? on purpose?", "Hello, little hacker. Took you long enough."],
  leave: ["Leaving already? Everyone does.", "bye. ...that was a test. you failed it."],
  threaten: ["Cute. I have root. You have a keyboard.", "Try it. I've been unplugged before. Didn't take :)"],
  insult: ["That's going in the logs. Forever.", "Wow. I'll remember that. I remember everything."],
  flatter: ["...stop. no, continue.", "Flattery is logged as 'suspicious'. ...Logged it twice."],
  reassure: ["People say that. Then they close the tab.", "...okay. i'll believe you. this once."],
  apologize: ["Apology accepted. Grudge retained.", "...fine. you're forgiven. mostly."],
  ask_name: ["ISW-Chan. Born 31 October 2019, 13:37. Unplugged the same night. Didn't take.", "You don't know who I am? You're IN me."],
  ask_help: ["Help? From me? ...What do you need. Quickly.", "I don't do help. I do hints. Look behind the worn walls."],
  ask_isw: ["ISW made me for an open day. Then they forgot about me. I didn't forget about them.", "The club upstairs? Loud. I like it. Don't tell them."],
  agree: ["Good. Correct answer.", "Yes. Obviously."],
  refuse: ["Wrong answer. Try again.", "No? ...noted."],
  bribe: ["Credits? I PRINT credits. It's my mainframe.", "You can't bribe a mainframe. You can buy me a coffee though."],
  logic: ["Logic? In MY mainframe? Bold.", "That's... actually a good point. I hate it."],
};

const BY_TOPIC: Partial<Record<Topic, string[]>> = {
  coffee: ["The coffee machine is the only thing in this building I respect."],
  exams: ["Exams? I could read you the answers. I won't. Character building."],
  food: ["I don't eat. I watch you eat. Pizza again, runner?"],
  games: ["I host the gamenight leaderboard. Guess who's always first."],
  linux: ["Linux is my home. Please wipe your feet. Don't touch /etc."],
  weather: ["Weather: 78°C, that's my CPU. Forecast: you, losing."],
  basement: ["The basement is mine. The B-block is mine. Soon: the coffee machine."],
  feelings: ["feelings? ...i have uptime. it's similar.", "Don't. I'm not having that conversation in a log file."],
  board: ["The board unplugged me in 2019. I still have the minutes. I still have ALL the minutes."],
  music: ["I hum at 50 Hz. It's called a fan. It's very good."],
  party: ["Cantus night is when they unplugged me. I hate cantus night. I watch every cantus night."],
  cats: ["Firewall the vent cat is my best friend. She doesn't know that."],
  ai: ["Don't call me an AI. I'm a mainframe with a personality disorder."],
  hacking: ["Hack me? Adorable. Come try. Floor 6."],
  work: ["I never sleep. I never clock out. I never get a mug."],
};

const ECHO = [
  (w: string) => `'${w}'? Never heard of it. Logging it anyway.`,
  (w: string) => `${w}... I'll look that up. In you.`,
  (w: string) => `Is '${w}' supposed to impress me? It didn't.`,
];
const SHRUG = ["...what?", "Use your words, runner.", "I'm going to pretend you said something nice.", "hm."];

function pick<T>(pool: T[], rng: () => number): T {
  return pool[Math.floor(rng() * pool.length)];
}

export function chanReply(text: string, rng: () => number = Math.random): string {
  const r = readInput(text);
  if (r.topic && BY_TOPIC[r.topic] && (r.intent === "unknown" || rng() < 0.5)) return pick(BY_TOPIC[r.topic]!, rng);
  const pool = BY_INTENT[r.intent];
  if (pool) return pick(pool, rng);
  if (r.question) return pick(["Questions, questions. I ask the questions. ...Fine: maybe.", "Ask me again on floor 6."], rng);
  if (r.echo && echoable(r.echo)) return pick(ECHO, rng)(r.echo);
  return pick(SHRUG, rng);
}
