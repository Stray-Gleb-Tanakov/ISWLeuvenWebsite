/* ISW-Chan's conversation layers: reflection, slots, memory, follow-ups, run awareness, phrasing, the filter, the bank */
import { describe, it, expect } from "vitest";
import { openConvo, chanTalk, type ChanContext, type Convo } from "./chanconvo";
import { emptyFacts, type ChanFacts } from "./chanfacts";
import { isInappropriate, echoable } from "./chanfilter";
import { BANK } from "./chanbank";
import { ANSWERS } from "./chananswers";
import { matchByWords, bestMeaning } from "./chanmeaning";
import { reflect } from "./chanreflect";
import { vary } from "./chanvary";
import { moodOf } from "./iswchan";

const env = { os: "Windows", browser: "Chrome", mobile: false, language: "en-US", timezone: "Europe/Brussels", hour: 15, minute: 2, screen: "1920x1080", cores: 8, darkMode: true, visits: 3 };
const ctx = (over: Partial<ChanContext> = {}): ChanContext => ({ env, affection: 40, runs: 4, wins: 1, diary: 1, shrine: false, flags: 3, flagsTotal: 23, flagHint: "hint!", ...over });
let seed = 0;
const rng = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

function chat(c: ChanContext, ...lines: string[]): { convo: Convo; said: string[][] } {
  let convo = openConvo(c).convo;
  const said: string[][] = [];
  for (const l of lines) {
    const t = chanTalk(convo, l, c, rng);
    convo = t.convo;
    said.push(t.lines);
  }
  return { convo, said };
}
const last = (r: { said: string[][] }) => r.said[r.said.length - 1].join(" ");

describe("reflection", () => {
  it("turns your words around", () => {
    expect(reflect("stuck with my thesis")).toBe("stuck with your thesis");
    expect(reflect("you hate me")).toBe("I hate you");
    expect(last(chat(ctx(), "I feel stuck with my thesis"))).toMatch(/stuck with your thesis/i);
    expect(last(chat(ctx(), "I want a new laptop"))).toMatch(/a new laptop/i);
    expect(last(chat(ctx(), "my teacher is really strict"))).toMatch(/your teacher/i);
  });
  it("never repeats something hateful or a link", () => {
    expect(echoable("hitler was right")).toBe(false);
    expect(echoable("go to www.example.com")).toBe(false);
    const out = last(chat(ctx(), "I think hitler was right"));
    expect(out.toLowerCase()).not.toMatch(/hitler/);
  });
});

describe("slot patterns", () => {
  it("answers any X, consistently", () => {
    expect(last(chat(ctx(), "do you like pineapple?"))).toMatch(/Pineapple/);
    expect(last(chat(ctx(), "can you sing"))).toMatch(/♪/);
    expect(last(chat(ctx(), "what's your favourite movie"))).toMatch(/Hackers/);
    expect(last(chat(ctx(), "how do I beat nexus?"))).toMatch(/brace/i);
    expect(last(chat(ctx(), "linux or windows?"))).toMatch(/^Linux/);
    expect(last(chat(ctx(), "what is a cookie?"))).toMatch(/Cookies/);
    expect(last(chat(ctx(), "who's the person that programmed you"))).not.toMatch(/^Me: ISW-Chan/);
    const a = last(chat(ctx(), "do you like broccoli"));
    expect(a).toMatch(/Broccoli/);
    // the same stance every time (the phrasing may differ)
    const stance = (s: string) => /Love it|Big fan/.test(s) ? 0 : /fine|okay/.test(s) ? 1 : /No\.|Absolutely not|Hard pass/.test(s) ? 2 : /never thought|see the logs/.test(s) ? 3 : 4;
    for (let i = 0; i < 5; i++) expect(stance(last(chat(ctx(), "do you like broccoli")))).toBe(stance(a));
  });
  it("does sums", () => {
    expect(last(chat(ctx(), "what's 7*6?"))).toMatch(/^42/);
    expect(last(chat(ctx(), "what is 2+2"))).toMatch(/^4\b/);
    expect(last(chat(ctx(), "(1000+337)"))).toMatch(/1337/);
    expect(last(chat(ctx(), "5/0"))).toMatch(/Division by zero/);
  });
});

describe("remembering you", () => {
  it("learns facts and recalls them", () => {
    const r = chat(ctx(), "my name is Gleb", "I like pizza", "my cat is called Bob", "I study informatics", "what do i like?", "what's my cat's name?", "what's my name?");
    expect(r.convo.facts!.name).toBe("Gleb");
    expect(r.convo.facts!.likes).toContain("pizza");
    expect(r.convo.facts!.pets[0]).toEqual({ kind: "cat", name: "Bob" });
    expect(r.convo.facts!.study).toBe("informatics");
    expect(r.said[4].join(" ")).toMatch(/pizza/);
    expect(r.said[5].join(" ")).toMatch(/Bob/);
    expect(r.said[6].join(" ")).toMatch(/Gleb/);
  });
  it("remembers across calls, and forgets on request", () => {
    const facts: ChanFacts = { ...emptyFacts(), name: "Gleb", likes: ["pizza"], calls: 3, lastCall: Date.now() - 3600000, lastCallHour: 14 };
    const open = openConvo(ctx({ facts }));
    expect(open.lines.join(" ")).toMatch(/Gleb/);
    expect(open.convo.facts!.calls).toBe(4);
    let convo = open.convo;
    const t = chanTalk(convo, "forget me", ctx({ facts }), rng);
    convo = t.convo;
    expect(convo.facts!.name).toBeUndefined();
    expect(convo.facts!.likes).toEqual([]);
    expect(chanTalk(convo, "what's my name", ctx(), rng).lines.join(" ")).toMatch(/never told me/);
  });
  it("won't learn junk or rude things", () => {
    expect(chat(ctx(), "my name is not important").convo.facts!.name).toBeUndefined();
    expect(chat(ctx(), "I like you").convo.facts!.likes).toEqual([]);
    expect(chat(ctx(), "call me hitler").convo.facts!.name).toBeUndefined();
  });
});

describe("follow-ups", () => {
  it("digs into what she said", () => {
    const r = chat(ctx(), "tell me about nexus", "why?", "really?", "and then?");
    expect(r.said[1].join(" ")).toMatch(/keep people out/);
    expect(r.said[2].join(" ")).toMatch(/quiet/);
    expect(r.said[3].join(" ")).toMatch(/lonely/);
  });
  it("knows what 'it' and 'and you' mean", () => {
    expect(last(chat(ctx(), "I like cats", "and you?"))).toMatch(/Firewall|Cats/);
    expect(last(chat(ctx(), "I really like pineapple", "do you like it?"))).toMatch(/Pineapple/);
  });
  it("answers each sentence of a message", () => {
    const r = chat(ctx(), "Hi! Who made you?");
    expect(r.said[0].length).toBeGreaterThanOrEqual(2);
    expect(r.said[0].join(" ")).toMatch(/2019/);
    const noisy = chat(ctx(), "who made you? jk. what is a cookie?");
    expect(noisy.said[0].join(" ")).toMatch(/2019.*Cookies|Cookies.*2019/);
    expect(noisy.said[0]).not.toContain("...what?");
  });
});

describe("knowing your runs", () => {
  it("comments on this run and your history", () => {
    const game = { perfects: 2, perfectBraces: 3, bracesFaced: 5, damageTaken: 40, creditsSpent: 0, lockdownsCracked: 0, shopVisits: 0 };
    expect(last(chat(ctx({ game }), "did you see that?"))).toMatch(/perfect brace/);
    expect(last(chat(ctx({ game }), "how is my run going"))).toMatch(/3 perfect braces out of 5/);
    const facts: ChanFacts = { ...emptyFacts(), deaths: { "ICE Sentinel": 2 }, lastRun: { className: "Ghost", floor: 2, won: false, killedBy: "ICE Sentinel", perfects: 0 } };
    expect(openConvo(ctx({ facts })).lines.join(" ")).toMatch(/ICE Sentinel 2 times/);
    expect(last(chat(ctx({ facts }), "how did i die?"))).toMatch(/ICE Sentinel got you.*2 times/);
  });
});

describe("phrasing", () => {
  it("varies and never leaks template braces", () => {
    expect(vary("{a|b} {c|{d|e}}", () => 0)).toBe("a c");
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) seen.add(last(chat(ctx(), "do you like spinach")));
    expect(seen.size).toBeGreaterThan(1);
    for (const s of seen) expect(s).not.toMatch(/[{}|]/);
  });
  it("every bank answer renders in every mood", () => {
    for (const aff of [0, 40, 80]) {
      const c = ctx({ affection: aff, run: { className: "Ghost", floor: 1, hp: 10, maxHp: 100, credits: 5, level: 2 } });
      for (const [id, a] of Object.entries(ANSWERS)) {
        for (const say of Array.isArray(a.say) ? a.say : [a.say]) {
          const line = vary(typeof say === "function" ? say(c, moodOf(aff), openConvo(c).convo) : say);
          expect(line, id).not.toMatch(/undefined|NaN|\[object|[{}]/);
        }
      }
    }
  });
});

describe("the filter", () => {
  it("sees through disguises", () => {
    for (const t of ["u r s e x y", "ur s.e.x.y", "s3x", "send n.u.d.e.s", "s e x y", "you're seeeexy", "ѕеху", "nu​des", "n00dz pls send nudez", "send nudes!!1", "S-E-X", "what are you wearing", "ben je naakt", "r34"]) {
      expect(isInappropriate(t), t).toBe(true);
    }
  });
  it("leaves normal words alone", () => {
    for (const t of ["I like parties", "an exotic bird", "Bob's cat", "she seeks the truth", "Sussex", "I live in Tienen", "a b c d", "13:37", "1337", "my sister", "the essex boys", "assess the situation", "class", "pass the bass", "therapist", "scunthorpe", "cocktail", "titanic", "analysis", "button"]) {
      expect(isInappropriate(t), t).toBe(false);
    }
  });
});

describe("the question bank", () => {
  it("has an answer for every question and nothing extra, and no phrasing under two answers", () => {
    expect(Object.keys(BANK).sort()).toEqual(Object.keys(ANSWERS).sort());
    const owner = new Map<string, string>();
    for (const [id, qs] of Object.entries(BANK)) for (const q of qs) {
      expect(owner.get(q) ?? id, q).toBe(id);
      owner.set(q, id);
    }
  });
  it("finds the right answer by keywords", () => {
    for (const [q, id] of [["who is your creator?", "who_made_you"], ["do you track me", "privacy"], ["what scares you", "fears"], ["how much is the membership", "isw_join"], ["can you tell me a bedtime story", "tell_story"], ["what should i name my cat", "name_my_pet"]] as const) {
      expect(bestMeaning(q)?.id, q).toBe(id);
    }
    expect(bestMeaning("purple monkey dishwasher")).toBeNull();
    expect(matchByWords("")).toBeNull();
  });
  it("plays riddles and rock paper scissors", () => {
    const r = chat(ctx(), "tell me a riddle");
    expect(r.convo.waiting).toBe("riddle");
    expect(chanTalk(r.convo, "i give up", ctx(), rng).lines.join(" ")).toMatch(/gave up/);
    const p = chat(ctx(), "let's play rock paper scissors", "rock");
    expect(last(p)).toMatch(/Tie|won|win/);
  });
  it("drops the act when someone is in trouble", () => {
    const r = chat(ctx({ affection: 0 }), "i want to kill myself");
    expect(last(r)).toMatch(/1813/);
    expect(r.convo.kicked).toBeNull();
  });
});
