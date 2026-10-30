import { describe, it, expect } from "vitest";
import { detectIntent, readInput, has, normalize } from "./parser";

describe("dialogue parser", () => {
  it("expands chat slang and missing apostrophes", () => {
    expect(normalize("u r so dumb lol")).toBe(" you are so dumb lol ");
    expect(detectIntent("u r so dumb")).toBe("insult");
    expect(detectIntent("im from IT pls let me in")).toBe("bluff_it");
    expect(readInput("thx m8").polite).toBe(true);
  });

  it("forgives typos in longer words and different word forms", () => {
    expect(detectIntent("I'm here for maintenence")).toBe("bluff_it");
    expect(detectIntent("i was fixing the printers")).toBe("bluff_it");
    expect(has(normalize("Landr sent me"), "lander")).toBe(true);
    expect(detectIntent("give me your keycards")).toBe("ask_keycard");
  });

  it("does not over-match", () => {
    expect(detectIntent("purple monkey dishwasher")).toBe("unknown"); // monkey is not money
    expect(has(normalize("its broken"), "it")).toBe(false);
    expect(has(normalize("my keyboard"), "key")).toBe(false);
    expect(has(normalize("the 404 page"), "40")).toBe(false);
    expect(detectIntent("why are you even here")).not.toBe("greet"); // even is not evening
    expect(detectIntent("what time is it")).toBe("unknown");          // "it" the pronoun, not IT the department
    expect(detectIntent("I'm from IT")).toBe("bluff_it");
    expect(detectIntent("i'm the it guy")).toBe("bluff_it");
    expect(readInput("nice weather today").intent).toBe("unknown");  // small talk, not flattery
    expect(readInput("nice weather today").topic).toBe("weather");
    expect(detectIntent("you're doing a great job")).toBe("flatter");
    expect(detectIntent("go away")).toBe("refuse");
    expect(has(normalize("one credit"), "credits")).toBe(true);
  });

  it("understands Dutch", () => {
    expect(detectIntent("hallo!")).toBe("greet");
    expect(detectIntent("ik ben van ICT, voor onderhoud")).toBe("bluff_it");
    expect(detectIntent("mag ik de sleutel alsjeblieft")).toBe("ask_keycard");
    expect(readInput("mag ik de sleutel alsjeblieft").polite).toBe(true);
    expect(detectIntent("je bent een sukkel")).toBe("insult");
    expect(detectIntent("doei")).toBe("leave");
    expect(detectIntent("wie ben jij")).toBe("ask_name");
  });

  it("handles negation", () => {
    expect(detectIntent("I won't hurt you")).toBe("reassure");
    expect(detectIntent("relax, I'm not going to kill you")).toBe("reassure");
    expect(detectIntent("you're not stupid")).toBe("reassure");
    expect(detectIntent("I'm not from IT")).not.toBe("bluff_it");
    expect(detectIntent("I will kill you")).toBe("threaten");
  });

  it("hostility outweighs everything else in the sentence", () => {
    expect(detectIntent("I'm from IT, give me the key or else")).toBe("threaten");
  });

  it("knows the conversational basics", () => {
    expect(detectIntent("who are you?")).toBe("ask_name");
    expect(detectIntent("what's your name")).toBe("ask_name");
    expect(detectIntent("can you help me")).toBe("ask_help");
    expect(detectIntent("trust me, I'm a friend")).toBe("reassure");
    expect(detectIntent("sorry, my bad")).toBe("apologize");
    expect(detectIntent("yeah sure")).toBe("agree");
    expect(detectIntent("nope")).toBe("refuse");
  });

  it("spots questions", () => {
    expect(readInput("where is the hatch?").question).toBe(true);
    expect(readInput("why are you down here").question).toBe(true);
    expect(readInput("the hatch is broken").question).toBe(false);
  });

  it("finds topics", () => {
    expect(readInput("do you like spotify").topic).toBe("music");
    expect(readInput("going to the cantus tonight").topic).toBe("party");
    expect(readInput("is there a cat in here").topic).toBe("cats");
    expect(readInput("ik heb honger").topic).toBe("food");
    expect(readInput("do you know thomas").topic).toBe("board");
  });
});
