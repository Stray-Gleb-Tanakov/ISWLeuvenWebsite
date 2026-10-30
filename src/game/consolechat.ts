/* ====================================================
   ISW-Chan lives in the browser console: iswChan("hi").
   Same conversation as the in-game call (chanconvo.ts):
   she knows your device, your runs and your flags, and
   what you say changes how much she likes you. Get kicked
   out and she blocks you for a while.
   ==================================================== */

import { chanTalk, openConvo, type ChanContext, type Convo } from "./chanconvo";
import { readChanEnv } from "./chanenv";
import { HIDDEN_FLAGS } from "./flags";
import { adjustAffection, loadMemory, saveMemory } from "./memory";

const STYLE = "color:#ff6eb4;font-family:monospace";
const TAG = "background:#ff6eb4;color:#000;font-weight:bold;padding:1px 4px";
const FLAGS_KEY = "isw-ctf-flags"; // see UseFoundFlags
const BLOCKED_KEY = "isw_chan_blocked_until";
const BLOCK_MS = 10 * 60 * 1000;

let convo: Convo | null = null;

function say(text: string) {
  console.log(`%c ISW-Chan %c ${text}`, TAG, STYLE);
}

function context(): ChanContext {
  const memory = loadMemory();
  let found: Record<string, string> = {};
  try { found = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? "{}"); } catch { /* none */ }
  const missing = HIDDEN_FLAGS.filter((f) => !found[f.id]);
  return {
    env: readChanEnv(), affection: memory.affection, runs: memory.runs, wins: memory.wins,
    diary: memory.diary.length, shrine: memory.shrine,
    flags: Object.keys(found).length, flagsTotal: HIDDEN_FLAGS.length,
    flagHint: missing.length ? missing[Math.floor(Math.random() * missing.length)].hint : null,
  };
}

function blockedFor(): number {
  try { return Math.max(0, Number(sessionStorage.getItem(BLOCKED_KEY)) - Date.now()); } catch { return 0; }
}

export function iswChan(message?: unknown): string {
  const blocked = blockedFor();
  if (blocked > 0) {
    say(`*blocked*. Try again in ${Math.ceil(blocked / 60000)} min. Think about what you did.`);
    return "🚫";
  }
  const ctx = context();
  if (!convo || message === undefined) {
    const t = openConvo(ctx);
    convo = t.convo;
    t.lines.forEach(say);
    if (message === undefined) {
      say('talk to me like this: iswChan("what do you know about me?")');
      return ":)";
    }
  }
  const t = chanTalk(convo, String(message), ctx);
  convo = t.convo;
  t.lines.forEach(say);
  if (t.affection !== 0) saveMemory(adjustAffection(loadMemory(), t.affection));
  if (convo.kicked) {
    try { sessionStorage.setItem(BLOCKED_KEY, String(Date.now() + BLOCK_MS)); } catch { /* she'll forget */ }
    convo = null;
    return "🚫";
  }
  if (convo.turns === 5) say("you talk a lot for someone in MY console. ...visit /isw-chan sometime.");
  return ":)";
}

export function installConsoleChat() {
  (window as unknown as { iswChan: typeof iswChan }).iswChan = iswChan;
  console.log("%c psst. %c someone else lives in here too. type %ciswChan()", TAG, STYLE, "color:#ff6eb4;font-weight:bold;font-family:monospace");
}
