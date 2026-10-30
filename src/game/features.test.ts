import { describe, it, expect, vi, afterEach } from "vitest";
import { createInitialState, gameReducer } from "./engine";
import { applyPerk, rollPerkChoices } from "./perks";
import { createQte, rmEgg, shellResult, normalizeCommand, SHELL_PROBLEMS } from "./qte";
import { detectIntent, readInput } from "./talk";
import { raycastText as raycast } from "./raycaster";
import { makeLeech } from "./data";
import type { ClassName, Enemy, GameState, PerkId } from "./types";

afterEach(() => vi.restoreAllMocks());

function run(cls: ClassName = "Cyborg"): GameState {
  return gameReducer(createInitialState(), { type: "SELECT_CLASS", className: cls });
}

function withPerks(s: GameState, ...perks: PerkId[]): GameState {
  return { ...s, player: perks.reduce((p, id) => applyPerk(p, id), s.player!) };
}

function fight(s: GameState, enemy: Partial<Enemy> & { hp: number }): GameState {
  const e: Enemy = {
    id: "e-test", name: "Test Drone", symbol: "E", xpReward: 10, alive: true, x: 2, y: 1, floor: 0, ac: 1,
    statusEffects: [], ...enemy,
    stats: {
      maxMp: 0, mp: 0, atk: 10, def: 0, spd: 1, int: 0, ...(enemy.stats ?? {}),
      hp: enemy.hp, maxHp: Math.max(enemy.hp, enemy.stats?.maxHp ?? 0),
    },
  };
  return { ...s, mode: "COMBAT", currentEnemy: e, enemies: [...s.enemies, e] };
}

/* Math.random: queued values first, then `rest` */
function randomQueue(rest: number, ...values: number[]) {
  vi.spyOn(Math, "random").mockImplementation(() => values.shift() ?? rest);
}

describe("perks", () => {
  it("level-ups open a perk choice of 3 once you're out of combat", () => {
    let s = fight(run(), { hp: 1, xpReward: 1000 } as never);
    s = gameReducer(s, { type: "SPECIAL" });
    s = gameReducer(s, { type: "QTE_RESOLVE", result: "good", accuracy: 1 });
    expect(s.mode).toBe("PERK");
    expect(s.perkChoices).toHaveLength(3);
    const picked = s.perkChoices![1];
    s = gameReducer(s, { type: "PICK_PERK", index: 1 });
    expect(s.player!.perks).toContain(picked);
    // several level-ups at once queue several picks
    expect(["PERK", "EXPLORE"]).toContain(s.mode);
  });

  it("never offers a perk you already have", () => {
    const p = withPerks(run(), "glass_cannon", "paranoia", "vampiric", "overcharge", "black_market").player!;
    for (let i = 0; i < 20; i++) expect(rollPerkChoices(p).some((id) => p.perks.includes(id))).toBe(false);
  });

  it("Glass Cannon: +50% damage, -30% max HP", () => {
    const s = withPerks(run(), "glass_cannon");
    expect(s.player!.stats.maxHp).toBe(140);
    const base = fight(run(), { hp: 999 });
    const boosted = fight(s, { hp: 999 });
    randomQueue(0.99, 0.5); // d20 = 11 hits AC 1; then no brace
    const plain = gameReducer(base, { type: "ATTACK" });
    randomQueue(0.99, 0.5);
    const cannon = gameReducer(boosted, { type: "ATTACK" });
    expect(999 - cannon.currentEnemy!.stats.hp).toBe(Math.floor((999 - plain.currentEnemy!.stats.hp) * 1.5));
  });

  it("Vampiric Code heals 10% of damage dealt", () => {
    let s = withPerks(run(), "vampiric");
    s = { ...s, player: { ...s.player!, stats: { ...s.player!.stats, hp: 50 } } };
    randomQueue(0.99, 0.5); // hit, then the enemy doesn't get a brace prompt...
    const after = gameReducer(fight(s, { hp: 999 }), { type: "ATTACK" });
    expect(after.log.some((l) => l.includes("Vampiric Code drains"))).toBe(true);
  });

  it("Paranoia: more braces, shorter windows, tiny perfect window, perfect brace counters", () => {
    const normal = createQte("brace", 0, () => 0.5);
    const paranoidQte = createQte("brace", 0, () => 0.5, { windowMult: 0.6, perfectFrac: 0.12 });
    expect(paranoidQte.windowMs).toBeLessThan(normal.windowMs * 0.65);
    expect(paranoidQte.perfectFrac).toBe(0.12);

    let braced = 0;
    const s = withPerks(run(), "paranoia");
    for (let i = 0; i < 300; i++) if (gameReducer(fight(s, { hp: 999 }), { type: "ATTACK" }).mode === "QTE") braced++;
    expect(braced).toBeGreaterThan(140); // ~60%

    let t = fight(s, { hp: 999 });
    randomQueue(0.99, 0.99, 0.1); // player d20=20, brace roll succeeds
    t = gameReducer(t, { type: "ATTACK" });
    expect(t.qte?.kind).toBe("brace");
    const before = t.currentEnemy!.stats.hp;
    t = gameReducer(t, { type: "QTE_RESOLVE", result: "perfect", accuracy: 1 });
    expect(t.log.some((l) => l.includes("Paranoia counter-attack"))).toBe(true);
    expect(t.currentEnemy!.stats.hp).toBeLessThan(before);
  });

  it("Overcharge refunds the special's MP on a perfect", () => {
    const s = withPerks(run("Cyborg"), "overcharge");
    const q = gameReducer(fight(s, { hp: 999 }), { type: "SPECIAL" });
    const r = gameReducer(q, { type: "QTE_RESOLVE", result: "perfect", accuracy: 1 });
    expect(r.player!.stats.mp).toBe(s.player!.stats.mp);
  });
});

describe("Leech Bot", () => {
  const leech = (stolen = 0): Partial<Enemy> & { hp: number } => ({ ...makeLeech(0, 2, 1, "leech-test"), hp: 999, stolen });

  it("steals credits instead of HP", () => {
    let s = run();
    s = fight({ ...s, player: { ...s.player!, credits: 100 } }, leech());
    randomQueue(0.5, 0.99, 0.99, 0.99, 0.0); // player hits, no flee (no credits yet), no brace, enemy d20=20, steal 10
    const after = gameReducer(s, { type: "ATTACK" });
    expect(after.player!.stats.hp).toBe(s.player!.stats.hp);
    expect(after.player!.credits).toBeLessThan(100);
    expect(after.currentEnemy!.stolen).toBe(100 - after.player!.credits);
    expect(after.runStats.creditsStolen).toBe(after.currentEnemy!.stolen);
  });

  it("tries to flee with your credits: grab it or it escapes onto the floor", () => {
    const s = fight(run(), leech(40));
    randomQueue(0.99, 0.99, 0.1); // player d20=20, flee roll succeeds
    const fleeing = gameReducer(s, { type: "ATTACK" });
    expect(fleeing.qte?.kind).toBe("grab");

    const caught = gameReducer(fleeing, { type: "QTE_RESOLVE", result: "perfect", accuracy: 1 });
    expect(caught.mode).toBe("COMBAT");
    expect(caught.currentEnemy!.grabbed).toBe(true);

    const gone = gameReducer(fleeing, { type: "QTE_RESOLVE", result: "miss", accuracy: 0 });
    expect(gone.mode).toBe("EXPLORE");
    const onFloor = gone.enemies.find((e) => e.id === "leech-test")!;
    expect(onFloor.alive).toBe(true);
    expect(onFloor.name).toBe("Leech Bot [40 cr]");
  });

  it("killing it returns what it stole plus a bounty", () => {
    const s = fight(run(), { ...leech(40), hp: 1 });
    const q = gameReducer(s, { type: "SPECIAL" });
    const done = gameReducer(q, { type: "QTE_RESOLVE", result: "good", accuracy: 1 });
    expect(done.player!.credits).toBeGreaterThanOrEqual(40 + 15);
  });
});

describe("ISW-Chan", () => {
  it("every floor has a leech, and later floors a possessed fragment", () => {
    const s = createInitialState();
    expect(s.enemies.filter((e) => e.behavior === "leech")).toHaveLength(1);
    expect(s.enemies.some((e) => e.fragment)).toBe(false); // floor 1: no fragment yet
  });

  it("hacks into the log when you go downstairs", () => {
    let s = run();
    const stairsY = s.maps[0].findIndex((r) => r.includes(">"));
    const stairsX = s.maps[0][stairsY].indexOf(">");
    s = { ...s, enemies: [], player: { ...s.player!, x: stairsX - 1, y: stairsY } };
    s = gameReducer(s, { type: "MOVE", dx: 1, dy: 0 });
    expect(s.player!.floor).toBe(1);
    expect(s.log.some((l) => l.startsWith("[ISW-Chan]"))).toBe(true);
    expect(s.enemies.filter((e) => e.floor === 1 && e.fragment)).toHaveLength(1);
  });
});

describe("Sysadmin", () => {
  it("accepts real fixes, with or without sudo", () => {
    const qte = createQte("shell", 0, () => 0);
    expect(qte.prompt).toBe(SHELL_PROBLEMS[0].error);
    expect(shellResult(qte, "chmod +x deploy.sh", 1000)).toBe("perfect");
    expect(shellResult(qte, "sudo   chmod +x ./deploy.sh", 4000)).toBe("good");
    expect(shellResult(qte, "chmod +x deploy.sh", 6000)).toBe("miss"); // too slow
    expect(shellResult(qte, "rm deploy.sh", 1000)).toBe("miss");
    expect(normalizeCommand("SUDO Apt   Update")).toBe("apt update");
  });

  it("timers are 5 / 7 / 12 seconds", () => {
    expect([...new Set(SHELL_PROBLEMS.map((p) => p.seconds))].sort((a, b) => a - b)).toEqual([5, 7, 12]);
  });

  it("fixing deploys a drone that soaks hits", () => {
    let s = gameReducer(fight(run("Sysadmin"), { hp: 999 }), { type: "SPECIAL" });
    expect(s.qte?.kind).toBe("shell");
    s = gameReducer(s, { type: "QTE_RESOLVE", result: "good", accuracy: 1, text: s.qte!.answers![0] });
    expect(s.player!.drone).not.toBeNull();
  });

  it("rm -rf /: refused like real rm · rm -rf /*: deletes the enemy and leaves you at 1 HP", () => {
    expect(rmEgg("sudo rm -rf /")).toBe("refused");
    expect(rmEgg("sudo rm -rf /*")).toBe("nuke");
    expect(rmEgg("rm -rf --no-preserve-root /")).toBe("nuke");
    expect(rmEgg("rm -rf ./build")).toBeNull();

    const start = gameReducer(fight(run("Sysadmin"), { hp: 999 }), { type: "SPECIAL" });
    const refused = gameReducer(start, { type: "QTE_RESOLVE", result: "miss", accuracy: 0, text: "sudo rm -rf /" });
    expect(refused.log.some((l) => l.includes("--no-preserve-root"))).toBe(true);
    const nuked = gameReducer(start, { type: "QTE_RESOLVE", result: "miss", accuracy: 0, text: "sudo rm -rf /*" });
    expect(nuked.mode).toBe("EXPLORE"); // enemy deleted
    expect(nuked.player!.stats.hp).toBe(1);
    expect(nuked.fx?.kind).toBe("nuke");
  });

  it("the nuke only halves the final boss", () => {
    const start = gameReducer(fight(run("Sysadmin"), { id: "boss-5", name: "NEXUS", isBoss: true, hp: 320 } as never), { type: "SPECIAL" });
    const nuked = gameReducer(start, { type: "QTE_RESOLVE", result: "miss", accuracy: 0, text: "sudo rm -rf /*" });
    expect(nuked.currentEnemy!.stats.hp).toBe(160);
  });
});

describe("Script Kiddie", () => {
  it("borrows a random class QTE every special", () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 60; i++) kinds.add(gameReducer(fight(run("Script Kiddie"), { hp: 999 }), { type: "SPECIAL" }).qte!.kind);
    expect([...kinds].sort()).toEqual(["combo", "gauge", "hack", "shell"]);
  });
});

describe("run summary stats", () => {
  it("records the killer", () => {
    let s = fight(run(), { hp: 999, name: "Firewall Daemon", stats: { atk: 999 } as never });
    s = { ...s, player: { ...s.player!, stats: { ...s.player!.stats, hp: 1 } } };
    randomQueue(0.99, 0.0, 0.99, 0.99); // player misses (d20=1), no brace, enemy d20=20
    s = gameReducer(s, { type: "ATTACK" });
    expect(s.mode).toBe("GAME_OVER");
    expect(s.runStats.killedBy).toBe("Firewall Daemon");
    expect(s.runStats.damageTaken).toBeGreaterThan(0);
  });
});

describe("talk mode", () => {
  function talkRun() {
    return gameReducer(createInitialState(), { type: "SELECT_CLASS", className: "Social Engineer" });
  }
  const say = (s: GameState, ...lines: string[]) => lines.reduce((st, text) => gameReducer(st, { type: "TALK_INPUT", text }), s);
  const lastSaid = (s: GameState) => s.log.filter((l) => !l.startsWith("[suspicion")).at(-1);

  it("reads intents from free text", () => {
    expect(detectIntent("hey there")).toBe("greet");
    expect(detectIntent("I'm from IT, here to fix the coffee machine")).toBe("bluff_it");
    expect(detectIntent("give me the keycard or else")).toBe("threaten");
    expect(detectIntent("can I have your keycard please")).toBe("ask_keycard");
    expect(detectIntent("I'll pay you 30 credits")).toBe("bribe");
    expect(detectIntent("you're a zombie process, just exit")).toBe("logic");
    expect(detectIntent("purple monkey dishwasher")).toBe("unknown");
  });

  it("scores mixed sentences: the strongest intent wins", () => {
    expect(detectIntent("I'm from IT, give me the key or else")).toBe("threaten");
    expect(readInput("thanks, I'm from tech support, could you please help").intent).toBe("bluff_it");
    expect(readInput("thanks, I'm from tech support, could you please help").polite).toBe(true);
  });

  it("topics get their own lines, unknown words are echoed back in character", () => {
    let s = say(talkRun(), "south", "security", "talk to guard", "how is the coffee down here");
    expect(lastSaid(s)).toContain("coffee machine");
    s = say(s, "do you like thomas");
    expect(lastSaid(s)).toContain("3 AM");
    s = say(s, "quantum dishwasher");
    expect(lastSaid(s)).toMatch(/dishwasher|Dishwasher/);
  });

  it("remembers your claims: IT and then the boss doesn't add up", () => {
    const s = say(talkRun(), "south", "security", "talk to guard", "I'm from IT", "actually the boss sent me");
    expect(s.log.some((l) => l.includes("Which is it?"))).toBe(true);
  });

  it("notices when you say the same thing three times", () => {
    const s = say(talkRun(), "south", "security", "talk to guard", "nice hat", "nice shoes", "nice coffee");
    expect(lastSaid(s)).toContain("You said that already");
  });

  it("manners lower suspicion", () => {
    const rude = say(talkRun(), "south", "security", "talk to guard", "the boss sent me");
    const polite = say(talkRun(), "south", "security", "talk to guard", "sorry, the boss sent me");
    expect(polite.talk!.suspicion.guard).toBeLessThan(rude.talk!.suspicion.guard);
  });

  it("the whole run is a text adventure", () => {
    const s = talkRun();
    expect(s.mode).toBe("TALK");
    expect(s.talk!.scene).toBe("closet");
  });

  it("bluff the guard, get the keycard, take the hatch: end of pilot", () => {
    let s = say(talkRun(), "go south", "go to the security office");
    expect(s.talk!.scene).toBe("security");
    s = say(s, "talk to the guard", "evening, I'm from IT", "I need the keycard for the hatch", "bye");
    expect(s.talk!.flags).toContain("keycard");
    s = say(s, "back", "go east");
    expect(s.talk!.scene).toBe("east");
    s = say(s, "go down the hatch");
    expect(s.mode).toBe("WIN");
  });

  it("the hatch stays shut without a keycard", () => {
    const s = say(talkRun(), "south", "east", "go down the hatch");
    expect(s.mode).toBe("TALK");
    expect(s.log.at(-1)).toContain("keycard slot blinks red");
  });

  it("pushing the guard too far starts a fight", () => {
    const s = say(talkRun(), "south", "security", "talk to guard", "you idiot", "I will destroy you", "or else", "loser");
    expect(s.mode).toBe("COMBAT");
    expect(s.currentEnemy!.name).toContain("Kowalski");
  });

  it("the process blocks the archive until you convince it to exit", () => {
    let s = say(talkRun(), "south", "server hall", "go to the archive");
    expect(s.talk!.scene).toBe("hall");
    s = say(s, "talk to the process", "your parent process is dead, you should exit");
    expect(s.talk!.flags).toContain("process_gone");
    s = say(s, "go to the archive", "take the medkit", "take the blade");
    expect(s.talk!.scene).toBe("archive");
    expect(s.player!.inventory.some((i) => i.id === "talk-medkit")).toBe(true);
  });

  it("anything typed near one person is said to them", () => {
    const s = say(talkRun(), "south", "security", "nice coffee you've got there");
    expect(s.log.some((l) => l.includes("you say that to KOWALSKI"))).toBe(true);
  });
});

describe("raycaster", () => {
  it("renders a first-person view of the requested size", () => {
    const s = createInitialState();
    const view = raycast(s.maps[0], 4.5, 6.5, 0, 40, 12);
    expect(view).toHaveLength(12);
    view.forEach((row) => expect([...row]).toHaveLength(40));
    expect(view.join("")).toMatch(/[█▓▒░]/);
  });
});
