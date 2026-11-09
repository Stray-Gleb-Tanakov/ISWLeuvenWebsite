/* ISW-Chan's "hardware ban": 10 min, 1 h, 24 h, then permanent, kept in local storage + a cookie. */
// @vitest-environment jsdom
import { it, expect, beforeEach, afterEach, vi } from "vitest";
import { iswChan } from "./consolechat";
import { addStrike, BAN_EVENT, banStatus, bannedFor, cleanGpuName, hardwareLines, loadBan } from "./chanban";
import { createInitialState, gameReducer } from "./engine";

const MIN = 60 * 1000;

const clearCookie = () => { document.cookie = "isw_chan_ban=; path=/; max-age=0"; };

beforeEach(() => {
  localStorage.clear();
  clearCookie();
});

afterEach(() => vi.restoreAllMocks());

const kick = () => { iswChan("hi"); iswChan("send nudes"); return iswChan("you're sexy"); };

it("escalates 10 min, 1 h, 24 h, then permanent", () => {
  const now = 1_000_000;
  expect(addStrike(now)).toEqual({ strikes: 1, until: now + 10 * MIN });
  expect(addStrike(now)).toEqual({ strikes: 2, until: now + 60 * MIN });
  expect(addStrike(now)).toEqual({ strikes: 3, until: now + 24 * 60 * MIN });
  expect(addStrike(now)).toEqual({ strikes: 4, until: -1 });
  expect(bannedFor(now + 365 * 24 * 60 * MIN)).toBe(Infinity);
});

it("a ban runs out, but the strike count stays", () => {
  addStrike(0);
  expect(bannedFor(5 * MIN)).toBe(5 * MIN);
  expect(bannedFor(11 * MIN)).toBe(0);
  expect(loadBan().strikes).toBe(1);
});

it("clearing only local storage or only the cookie doesn't lift the ban", () => {
  addStrike(); addStrike();
  localStorage.clear();
  expect(loadBan().strikes).toBe(2);
  addStrike(); // back in both
  clearCookie();
  expect(loadBan().strikes).toBe(3);
  expect(bannedFor()).toBeGreaterThan(0);
});

it("kicking her out in the console bans you, and she names your hardware", () => {
  const log: string[] = [];
  vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => { log.push(String(a[0]).replace(/%c/g, "")); });
  expect(kick()).toBe("🚫");
  expect(iswChan("hello?")).toBe("🚫");
  const text = log.join("\n");
  expect(text).toMatch(/HARDWARE BAN 1\/3/);
  expect(text).toMatch(/For 10 min/);
  expect(text).toMatch(/hardware banned\*\. Try again in 10 min/);
});

it("the message lists the hardware and warns before going permanent", () => {
  const lines = hardwareLines({ strikes: 3, until: Date.now() + 24 * 60 * MIN }, "NVIDIA GeForce RTX 3060").join("\n");
  expect(lines).toMatch(/your NVIDIA GeForce RTX 3060/);
  expect(lines).toMatch(/For 24 h/);
  expect(lines).toMatch(/Next time it's permanent/);
  expect(hardwareLines({ strikes: 4, until: -1 }, null).join("\n")).toMatch(/PERMANENT[\s\S]*Forever/);
});

it("turns WebGL renderer strings into readable GPU names", () => {
  expect(cleanGpuName("ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x0000A7A0) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toBe("Intel Iris Xe Graphics");
  expect(cleanGpuName("ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002504) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toBe("NVIDIA GeForce RTX 3060");
  expect(cleanGpuName("ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)")).toBe("Apple M2");
  expect(cleanGpuName("NVIDIA GeForce RTX 3060/PCIe/SSE2")).toBe("NVIDIA GeForce RTX 3060");
  expect(cleanGpuName("Mali-G78")).toBe("Mali-G78");
  expect(cleanGpuName("WebKit WebGL")).toBeNull();
});

it("tells open pages when the ban changes", () => {
  const seen = vi.fn();
  window.addEventListener(BAN_EVENT, seen);
  addStrike();
  window.removeEventListener(BAN_EVENT, seen);
  expect(seen).toHaveBeenCalledTimes(1);
});

it("banStatus reads as a countdown, or permanent", () => {
  expect(banStatus(9 * MIN)).toBe("this device is blacklisted. 9 min left");
  expect(banStatus(90 * MIN)).toBe("this device is blacklisted. 2 h left");
  expect(banStatus(Infinity)).toBe("this device is permanently blacklisted");
});

it("game: while banned she won't pick up the intercom, and nothing gets you kicked", () => {
  addStrike();
  let s = gameReducer(createInitialState(), { type: "SELECT_CLASS", className: "Social Engineer" });
  s = { ...s, talk: { ...s.talk!, npc: "isw" } };
  s = gameReducer(s, { type: "TALK_INPUT", text: "send nudes" });
  s = gameReducer(s, { type: "TALK_INPUT", text: "show me your boobs" });
  expect(s.mode).not.toBe("GAME_OVER");
  expect(s.talk!.chan).toBeUndefined();
  expect(s.log.slice(-2).join("\n")).toMatch(/call rejected[\s\S]*blacklisted\. 10 min left/);
});
