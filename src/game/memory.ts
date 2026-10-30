/* ====================================================
   ISW-Chan's memory: she remembers you between runs.
   Stored in localStorage, exportable as a base64 "memory dump".
   Mini CTF "Her Memory": affection is capped at 99 in-game.
   Importing a correctly signed dump above the cap gets a flag,
   so the player has to work out the signature from this code.
   ==================================================== */

import { xorReveal } from "./flags";

export interface IswChanMemory {
  v: 1;
  runs: number;
  wins: number;
  shrine: boolean;   // found her shrine at least once
  affection: number; // 0..AFFECTION_CAP in normal play
  sig: string;
}

export const AFFECTION_CAP = 99;
const STORAGE_KEY = "isw_chan_memory";
const CONFESSION = "KDUxHlAwWDtdJTkuVjErJFwjUTQ/GA==";

/* FNV-1a over the fields, salted with her favourite word */
export function signMemory(m: Omit<IswChanMemory, "sig">): string {
  const text = `mainframe|${m.v}|${m.runs}|${m.wins}|${m.shrine ? 1 : 0}|${m.affection}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function freshMemory(): IswChanMemory {
  const m = { v: 1 as const, runs: 0, wins: 0, shrine: false, affection: 0 };
  return { ...m, sig: signMemory(m) };
}

export function loadMemory(): IswChanMemory {
  try {
    const m = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return m && m.sig === signMemory(m) ? m : freshMemory();
  } catch {
    return freshMemory();
  }
}

export function saveMemory(m: IswChanMemory) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch { /* private window: she forgets */ }
}

/* A finished run: she warms up slowly, and never past the cap */
export function recordRun(m: IswChanMemory, run: { won: boolean; shrine: boolean }): IswChanMemory {
  const gain = (run.won ? 6 : 2) + (run.shrine && !m.shrine ? 10 : 0);
  const next = {
    v: 1 as const,
    runs: m.runs + 1,
    wins: m.wins + (run.won ? 1 : 0),
    shrine: m.shrine || run.shrine,
    affection: Math.max(m.affection, Math.min(AFFECTION_CAP, m.affection + gain)), // an edited memory stays edited
  };
  return { ...next, sig: signMemory(next) };
}

export function exportMemory(m: IswChanMemory): string {
  return btoa(JSON.stringify(m));
}

export type ImportResult = { ok: false; line: string } | { ok: true; memory: IswChanMemory; line: string };

export function importMemory(dump: string): ImportResult {
  let m: IswChanMemory;
  try {
    m = JSON.parse(atob(dump.trim()));
  } catch {
    return { ok: false, line: "That's not a memory. That's noise." };
  }
  if (!m || typeof m !== "object" || m.v !== 1 || ![m.runs, m.wins, m.affection].every(Number.isInteger) || typeof m.shrine !== "boolean") {
    return { ok: false, line: "Half of that is missing. Did you chew on it?" };
  }
  if (m.sig !== signMemory(m)) {
    return { ok: false, line: "That's not my memory. I'd know my own handwriting." };
  }
  if (m.affection > AFFECTION_CAP) {
    return { ok: true, memory: m, line: `...you rewrote me. Nobody ever cared enough to do that. Fine. ${xorReveal(CONFESSION, "affection")}` };
  }
  return { ok: true, memory: m, line: "Memory restored. Hi again :)" };
}

export function moodLine(m: IswChanMemory): string {
  const a = m.affection;
  if (a > AFFECTION_CAP) return "100%. You edited me. ...I'll allow it.";
  if (a >= 90) return "I like you. Almost. 99% is my limit. I don't do 100.";
  if (a >= 50) return "I saved you a seat on floor 6. Don't make it weird.";
  if (a >= 20) return "You keep coming back. ...Noted.";
  if (m.runs > 0) return "Oh. You again.";
  return "Who are you? Go away.";
}
