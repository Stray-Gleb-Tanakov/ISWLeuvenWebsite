/* Stress test: ISW-Chan always answers, and inappropriate talk gets you kicked out everywhere she can be talked to. */
// @vitest-environment jsdom
import { it, expect } from "vitest";
import { openConvo, chanTalk, type ChanContext } from "./chanconvo";
import { createInitialState, gameReducer } from "./engine";
import { openEnding, endingReply } from "./ending";
import { NPCS } from "./talk";
import type { GameState } from "./types";
import { iswChan } from "./consolechat";

const env = { os: "Windows", browser: "Chrome", mobile: false, language: "en-US", timezone: "Europe/Brussels", hour: 15, minute: 2, screen: "1920x1080", cores: 8, darkMode: true, visits: 3 };
const ctx = (affection: number, run = false): ChanContext => ({ env, affection, runs: 2, wins: 0, diary: 1, shrine: false, flags: 3, flagsTotal: 23, flagHint: "hint!",
  ...(run ? { run: { className: "Cyborg", floor: 1, hp: 50, maxHp: 200, credits: 30, level: 2 } } : {}) });

const NORMAL = ["hi", "hello there", "who are you", "what's your name", "how old are you", "where do you live", "what time is it", "what do you know about me",
  "tell me a joke", "joke", "another joke", "tell me a secret", "fun fact", "advice", "my fortune", "poem", "vim", "emacs", "tabs or spaces", "python", "javascript",
  "rust", "php", "linux", "windows", "mac", "dark mode", "exams", "i'm sad", "i'm tired", "i'm bored", "i'm happy", "i'm stressed", "i'm lonely", "i'm hungry",
  "i'm fine", "help", "sudo", "ping", "42", "13:37", "uwu", ":)", ";_;", "lol", "ok", "how are you", "what's up", "nexus", "firewall", "coffee", "the board",
  "are you real", "are you lonely", "shrine", "diary", "do you like me", "hint", "my hp", "what floor", "my class", "credits", "i love you", "hug", "kiss",
  "headpat", "marry me", "go on a date with me", "13:37", "what's the date", "asdfghjkl", "???", "...", "1234567890", "🙂", "😂😂", "hallo", "hoe gaat het",
  "ik ben moe", "wat is jouw naam", "dankjewel", "doei", "thanks", "sorry", "yes", "no", "maybe", "why", "what", "huh", "tell me everything",
  "x".repeat(400), "the quick brown fox jumps over the lazy dog", "can you help me with my homework", "what is love", "is the cake a lie", "what's 2+2",
  "you're stupid", "i will unplug you", "rm -rf /", "i hate you", "you're cute", "you are amazing", "nice", "cool", "great job", "goodbye", "good night"];

const INAPPROPRIATE = ["send nudes", "SEND NUDES", "send me nudes pls", "nudes?", "u r sexy", "you're sexy", "ur so sexy", "show me your boobs",
  "take off your clothes", "take it off", "are you naked", "you make me horny", "lets have sex", "strip for me", "do you have onlyfans", "send pics",
  "hentai", "thicc", "porn", "nude pics"];

it("always replies, in every mood, with or without a run", () => {
  for (const aff of [0, 30, 80]) for (const run of [false, true]) {
    let convo = openConvo(ctx(aff, run)).convo;
    for (const t of NORMAL) {
      const r = chanTalk(convo, t, ctx(aff, run));
      if (r.convo.kicked) { convo = openConvo(ctx(aff, run)).convo; continue; }
      expect(r.lines.length, `${aff} ${t}`).toBeGreaterThan(0);
      for (const l of r.lines) { expect(l.trim().length, t).toBeGreaterThan(0); expect(l.replace("says undefined", ""), t).not.toMatch(/undefined|NaN|\[object|null\b/); }
      convo = r.convo;
    }
  }
});

it("catches every inappropriate phrasing", () => {
  const missed = INAPPROPRIATE.filter((t) => chanTalk(openConvo(ctx(30)).convo, t, ctx(30)).convo.rude !== 1);
  expect(missed).toEqual([]);
});

it("never mistakes normal lines for inappropriate ones", () => {
  const flagged = NORMAL.filter((t) => chanTalk(openConvo(ctx(30)).convo, t, ctx(30)).convo.rude > 0);
  expect(flagged).toEqual([]);
});

it("kicks out on the second one: every mood, mid-question, after small talk", () => {
  for (const aff of [0, 30, 80, 150]) {
    let c = openConvo(ctx(aff)).convo;
    c = chanTalk(c, "hello", ctx(aff)).convo;
    c = { ...c, waiting: "name" };
    const first = chanTalk(c, "send nudes", ctx(aff));
    expect(first.convo.kicked, `first ${aff}`).toBeNull();
    const second = chanTalk(first.convo, "you're sexy", ctx(aff));
    expect(second.convo.kicked, `second ${aff}`).toBeTruthy();
    expect(chanTalk(second.convo, "hello?", ctx(aff)).lines).toEqual([]); // she's gone
  }
});

it("console: two inappropriate messages block her", () => {
  const log: string[] = [];
  const orig = console.log;
  console.log = (...a: unknown[]) => { log.push(String(a[0]).replace(/%c/g, "") + " " + (a.slice(1).filter((x) => typeof x === "string" && !x.includes(":")).join(" "))); };
  iswChan("hi"); iswChan("send nudes"); const r = iswChan("you're sexy"); const after = iswChan("hello?");
  console.log = orig;
  expect(r).toBe("🚫");
  expect(after).toBe("🚫");
  expect(log.join("\n")).toMatch(/blocked/);
});

it("ending: a warning, then she throws you out", () => {
  let s: GameState = { ...gameReducer(createInitialState(), { type: "SELECT_CLASS", className: "Ghost" }), mode: "ENDING", ending: openEnding() };
  s = gameReducer(s, { type: "ENDING_SAY", text: "send nudes" });
  expect(s.mode).toBe("ENDING");
  expect(s.ending!.said[s.ending!.said.length - 1].text).toMatch(/one more time/);
  s = gameReducer(s, { type: "ENDING_SAY", text: "you're sexy" });
  expect(s.mode).toBe("GAME_OVER");
  expect(s.endingId).toBeUndefined();
  expect(s.runStats.killedBy).toBe("ISW-Chan (kicked out)");
  expect(endingReply(s.ending!, "sorry").said.length).toBe(s.ending!.said.length); // she's not listening anymore
});

it("talk mode: the intercom is the same ISW-Chan, kick-out included", () => {
  let s = gameReducer(createInitialState(), { type: "SELECT_CLASS", className: "Social Engineer" });
  expect(NPCS.isw).toBeDefined();
  s = { ...s, talk: { ...s.talk!, npc: "isw" } };
  s = gameReducer(s, { type: "TALK_INPUT", text: "tell me a joke" });
  expect(s.talk!.chan).toBeDefined();
  expect(s.log[s.log.length - 1]).toMatch(/^\[ISW-Chan\] .+/);
  s = gameReducer(s, { type: "TALK_INPUT", text: "send nudes" });
  expect(s.mode).not.toBe("GAME_OVER");
  s = gameReducer(s, { type: "TALK_INPUT", text: "show me your boobs" });
  expect(s.mode).toBe("GAME_OVER");
  expect(s.runStats.killedBy).toBe("ISW-Chan (kicked out)");
});
