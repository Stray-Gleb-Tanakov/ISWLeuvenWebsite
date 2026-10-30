import { describe, it, expect, vi, afterEach } from "vitest";
import { createInitialState, gameReducer, chanMeddles } from "./engine";
import { openEnding, endingReply, qualifiesForEnding, ENDING_AFFECTION, type EndingId } from "./ending";
import { chanReply } from "./chanchat";
import { moodOf } from "./iswchan";
import { HIDDEN_FLAGS, sha256Hex } from "./flags";
import { caughtLine, CATCHES_NEEDED } from "@/components/IswChanPeek";
import { DIARY } from "./diary";
import type { GameState } from "./types";

afterEach(() => vi.restoreAllMocks());

async function expectFlag(text: string, id: string) {
  const flag = text.match(/ISW\{[^}]+\}/)?.[0];
  expect(flag, text).toBeDefined();
  expect(HIDDEN_FLAGS.find((f) => f.id === id)!.hash).toBe(await sha256Hex(flag!.toUpperCase()));
}

const run = (affection?: number) => gameReducer(createInitialState(), { type: "SELECT_CLASS", className: "Cyborg", affection });

function talk(...lines: string[]) {
  let s: GameState = { ...run(60), mode: "ENDING", ending: openEnding() };
  for (const l of lines) s = gameReducer(s, { type: "ENDING_SAY", text: l });
  return s;
}

describe("ISW-Chan's secret ending", () => {
  it("needs her shrine and enough affection", () => {
    const s = run(ENDING_AFFECTION);
    expect(qualifiesForEnding(s)).toBe(false);
    expect(qualifiesForEnding({ ...s, shrineFound: true })).toBe(true);
    expect(qualifiesForEnding({ ...s, shrineFound: true, iswAffection: ENDING_AFFECTION - 1 })).toBe(false);
  });

  it.each<[EndingId, string[]]>([
    ["goodbye", ["I have to go home", "yes, I promise"]],
    ["stay", ["I'll stay with you"]],
    ["stay", ["I want to leave", "no"]],
    ["unplug", ["I'm going to unplug you"]],
    ["unplug", ["sudo rm -rf her"]],
  ])("%s ending from %j", async (id, lines) => {
    const s = talk(...lines);
    expect(s.mode).toBe("WIN");
    expect(s.endingId).toBe(id);
    await expectFlag(s.log.join("\n"), `end_${id}`);
  });

  it("small talk gets answers, and she decides if you never do", () => {
    let s = talk("hi there", "do you like coffee?");
    expect(s.mode).toBe("ENDING");
    expect(s.ending!.said.filter((l) => l.who === "her").length).toBeGreaterThan(4);
    s = talk("hi", "coffee?", "cats", "linux", "what", "hmm");
    expect(s.endingId).toBe("stay");
  });

  it("leaving needs a straight answer", () => {
    const s = talk("goodbye", "purple monkey");
    expect(s.mode).toBe("ENDING");
    expect(s.ending!.said[s.ending!.said.length - 1].text).toMatch(/yes or a no/);
  });
});

describe("ISW-Chan's moods", () => {
  it("maps affection to a mood", () => {
    expect(moodOf(0)).toBe("cold");
    expect(moodOf(30)).toBe("curious");
    expect(moodOf(80)).toBe("attached");
  });

  it("attached: heals you once per floor when a fight goes badly", () => {
    const s = run(80);
    const p = s.player!;
    const hurt: GameState = { ...s, mode: "COMBAT", player: { ...p, stats: { ...p.stats, hp: 5 } } };
    const healed = chanMeddles(s, hurt, { type: "ATTACK" });
    expect(healed.player!.stats.hp).toBeGreaterThan(5);
    expect(healed.log.some((l) => l.includes("don't die on me"))).toBe(true);
    expect(chanMeddles(s, { ...healed, player: hurt.player }, { type: "ATTACK" }).player!.stats.hp).toBe(5); // once per floor
    expect(chanMeddles(s, { ...hurt, iswAffection: 30 }, { type: "ATTACK" }).player!.stats.hp).toBe(5);       // curious: no help
  });

  it("cold: taxes credits or fakes an alarm while you explore", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    let s = run(0);
    s = { ...s, player: { ...s.player!, credits: 50 }, enemies: [] };
    const before = s.log.length;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const t = gameReducer(s, { type: "MOVE", dx, dy });
      if (t.player!.x !== s.player!.x || t.player!.y !== s.player!.y) { s = t; break; }
    }
    expect(s.log.length).toBeGreaterThan(before);
    expect(s.log.join("\n")).toMatch(/Mainframe tax|kidding/);
  });
});

describe("ISW-Chan around the site", () => {
  it("always has something to say", () => {
    for (const text of ["hello", "who are you", "i love coffee", "rm -rf", "asdfgh", "do you like cats?", ""]) {
      expect(chanReply(text).length).toBeGreaterThan(0);
    }
  });

  it("Peekaboo: the tenth catch gives up the flag", async () => {
    expect(caughtLine(3)).not.toMatch(/ISW\{/);
    await expectFlag(caughtLine(CATCHES_NEEDED), "peek");
  });

  it("has a diary page for every floor", () => {
    expect(DIARY).toHaveLength(6);
    const s = run();
    expect(s.groundItems.filter((i) => i.type === "diary").length).toBe(1); // floor 1 is parsed at the start
  });
});
