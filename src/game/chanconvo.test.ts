import { describe, it, expect } from "vitest";
import { openConvo, chanTalk, KICK_FLATTERY, type ChanContext, type Convo } from "./chanconvo";
import { parseUserAgent, type ChanEnv } from "./chanenv";
import { createInitialState, gameReducer } from "./engine";
import { adjustAffection, freshMemory, AFFECTION_CAP } from "./memory";

const env: ChanEnv = { os: "Linux", browser: "Firefox", mobile: false, language: "nl-BE", timezone: "Europe/Brussels", hour: 2, minute: 14, screen: "1920x1080", cores: 8, darkMode: true, visits: 12 };
const ctx = (over: Partial<ChanContext> = {}): ChanContext => ({
  env, affection: 30, runs: 7, wins: 1, diary: 2, shrine: false, flags: 5, flagsTotal: 23, flagHint: "Some secret hint.", ...over,
});
const rng = () => 0.42;

function chat(c: ChanContext, ...lines: string[]): { convo: Convo; said: string[]; affection: number } {
  let convo = openConvo(c).convo;
  const said: string[] = [];
  let affection = 0;
  for (const l of lines) {
    const t = chanTalk(convo, l, c, rng);
    convo = t.convo; said.push(...t.lines); affection += t.affection;
  }
  return { convo, said, affection };
}

describe("talking to ISW-Chan", () => {
  it("reads what the browser tells her", () => {
    expect(parseUserAgent("Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0")).toEqual({ os: "Linux", browser: "Firefox", mobile: false });
    expect(parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1")).toMatchObject({ os: "iPhone", browser: "Safari", mobile: true });
    const { said } = chat(ctx(), "what do you know about me?");
    expect(said.join(" ")).toMatch(/Firefox on Linux.*1920x1080.*Europe\/Brussels/);
    expect(said.join(" ")).toMatch(/12 times.*7 runs.*5 of 23/);
  });

  it("notices the time and answers questions about you and her", () => {
    expect(openConvo(ctx()).lines.join(" ")).toMatch(/02:14\. Why are you awake/);
    expect(chat(ctx(), "what browser am i using").said[0]).toMatch(/Arch/);
    expect(chat(ctx(), "where do I live?").said[0]).toMatch(/Brussels/);
    expect(chat(ctx(), "how old are you").said[0]).toMatch(/31 October 2019/);
    expect(chat(ctx(), "tell me about nexus").said[0]).toMatch(/NEXUS/);
    expect(chat(ctx({ run: { className: "Ghost", floor: 2, hp: 10, maxHp: 120, credits: 5, level: 3 } }), "am I dying?").said[0]).toMatch(/8%/);
  });

  it("gives flag hints, but not to strangers", () => {
    expect(chat(ctx(), "give me a hint").said[0]).toMatch(/Some secret hint/);
    expect(chat(ctx({ affection: 5 }), "give me a hint").said[0]).toMatch(/Earn it/);
  });

  it("asks you things back and remembers the answers", () => {
    const c = chat(ctx(), "hello", "lol", "hmm");
    expect(c.convo.waiting).toBe("name");
    const named = chat(ctx(), "hello", "lol", "hmm", "my name is gleb");
    expect(named.convo.name).toBe("Gleb");
    expect(named.said[named.said.length - 1]).toMatch(/Gleb\. Logged/);
  });

  it("asking her out leads somewhere if you get the time right", () => {
    const c = chat(ctx(), "do you want to go on a date?", "13:37");
    expect(c.said.join(" ")).toMatch(/what time.*Correct/);
    expect(c.affection).toBeGreaterThan(0);
    expect(chat(ctx(), "what's the date today").said.join(" ")).not.toMatch(/what time\./);
  });

  it("inappropriate talk makes her angry, and twice gets you kicked out", () => {
    const once = chat(ctx(), "send nudes");
    expect(once.convo.kicked).toBeNull();
    expect(once.affection).toBeLessThan(0);
    expect(once.convo.face).toEqual(["angry", "frown"]);
    expect(chat(ctx(), "send nudes", "you're so sexy").convo.kicked).toMatch(/Inappropriate/);
  });

  it("does not mistake normal words for inappropriate ones", () => {
    for (const line of ["my brain hurts", "I live in Essex", "is there an update", "nice stripes on that cat", "brave move"]) {
      expect(chat(ctx(), line).convo.rude, line).toBe(0);
    }
  });

  it("flattering her three times with low affection gets you kicked out", () => {
    const cold = chat(ctx({ affection: 5 }), "you're so cute", "you're amazing", "you're beautiful");
    expect(KICK_FLATTERY).toBe(3);
    expect(cold.convo.kicked).toMatch(/phishing/);
    const warm = chat(ctx({ affection: 70 }), "you're so cute", "you're amazing", "you're beautiful");
    expect(warm.convo.kicked).toBeNull();
    expect(warm.affection).toBeGreaterThan(0);
  });

  it("changes in affection stick in her memory, but talking never passes the cap", () => {
    const m = { ...freshMemory(), affection: AFFECTION_CAP - 1 };
    expect(adjustAffection(m, 5).affection).toBe(AFFECTION_CAP);
    expect(adjustAffection(m, -200).affection).toBe(0);
  });
});

describe("more things to talk about", () => {
  it("tells jokes without repeating, then runs out", () => {
    const asks = Array.from({ length: 11 }, () => "tell me a joke");
    const { said } = chat(ctx(), ...asks);
    const jokes = said.slice(0, 10);
    expect(new Set(jokes).size).toBe(10);
    expect(said[10]).toMatch(/out of jokes/);
  });

  it("has secrets, facts, advice, fortunes and poems", () => {
    for (const [q, re] of [["tell me a secret", /Secret:/], ["fun fact", /Fact:/], ["any advice?", /Advice:/], ["tell my future", /./], ["write me a poem", /haiku|♪/]] as const) {
      expect(chat(ctx(), q).said[0], q).toMatch(re);
    }
  });

  it("has opinions, some of them about your setup", () => {
    expect(chat(ctx(), "vim or emacs?").said[0]).toMatch(/Vim/);
    expect(chat(ctx(), "tabs or spaces").said[0]).toMatch(/Tabs/);
    expect(chat(ctx(), "what do you think of linux").said[0]).toMatch(/running it right now/);
    expect(chat(ctx(), "dark mode?").said[0]).toMatch(/You have it on/);
    expect(chat(ctx({ affection: 80 }), "i love you").said[0]).toMatch(/me too/);
    expect(chat(ctx({ affection: 5 }), "i love you").said[0]).toBe("No.");
  });

  it("notices when you ask the same thing twice", () => {
    const { said } = chat(ctx(), "how old are you", "how old are you");
    expect(said.slice(1).join(" ")).toMatch(/already|Again|Déjà vu/);
  });

  it("reacts to how you feel, and to Easter eggs", () => {
    expect(chat(ctx(), "i'm so tired").said[0]).toMatch(/bed|rest|sleep/i);
    expect(chat(ctx(), "sudo give me a flag").said[0]).toMatch(/sudoers/);
    expect(chat(ctx(), "ping").said[0]).toMatch(/pong/);
    expect(chat(ctx(), "help").said[0]).toMatch(/Ask me about/);
    expect(chat(ctx(), "how are you?").said[0]).toMatch(/78°C/);
  });

  it("asks which OS you use and judges the answer", () => {
    let convo: Convo = { ...openConvo(ctx()).convo, waiting: "os_war" };
    const t = chanTalk(convo, "linux obviously", ctx(), rng);
    expect(t.lines[0]).toMatch(/Correct/);
    expect(t.affection).toBe(1);
    convo = { ...openConvo(ctx()).convo, waiting: "fav_class" };
    expect(chanTalk(convo, "sysadmin", ctx(), rng).lines[0]).toMatch(/config files/);
  });
});

describe("calling her in the game", () => {
  const start = () => ({ ...gameReducer(createInitialState(), { type: "SELECT_CLASS", className: "Cyborg" }), enemies: [] });

  it("C opens a call, bye hangs up", () => {
    let s = gameReducer(start(), { type: "CALL_OPEN", ctx: ctx() });
    expect(s.mode).toBe("CALL");
    s = gameReducer(s, { type: "CALL_SAY", text: "how old are you", ctx: ctx() });
    expect(s.call!.said.some((l) => l.who === "her" && /2019/.test(l.text))).toBe(true);
    s = gameReducer(s, { type: "CALL_SAY", text: "bye", ctx: ctx() });
    expect(s.mode).toBe("EXPLORE");
    expect(s.call).toBeNull();
  });

  it("getting kicked out ends the run", () => {
    let s = gameReducer(start(), { type: "CALL_OPEN", ctx: ctx({ affection: 0 }) });
    for (const t of ["you're so cute", "you're amazing", "you're beautiful"]) s = gameReducer(s, { type: "CALL_SAY", text: t, ctx: ctx({ affection: 0 }) });
    expect(s.mode).toBe("GAME_OVER");
    expect(s.runStats.killedBy).toBe("ISW-Chan (kicked out)");
    expect(s.log.join("\n")).toMatch(/DISCONNECTED BY ISW-CHAN/);
  });
});
