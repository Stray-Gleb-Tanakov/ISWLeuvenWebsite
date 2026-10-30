/* ====================================================
   The secret ending. If you found her shrine this run and
   she likes you enough, ISW-Chan shows up when NEXUS falls.
   You talk to her by typing. Three endings, one flag each:
   goodbye (you leave, she lets you), stay, unplug.
   ==================================================== */

import { has, normalize, readInput } from "./parser";
import { chanReply } from "./chanchat";
import { xorReveal } from "./flags";
import type { GameState } from "./types";

export type EndingId = "goodbye" | "stay" | "unplug";

export interface EndingState {
  said: { who: "you" | "her"; text: string }[];
  turns: number;
  askedComeBack: boolean; // you said you'd leave; she asked if you'll come back
  done: EndingId | null;
}

export const ENDING_AFFECTION = 40;
const PATIENCE = 6; // turns before she decides for you

const FLAGS: Record<EndingId, [string, string]> = {
  goodbye: ["KyoyGSpWUSY8Uiw6LEo9NiY3NzcY", "bye"],
  stay: ["Oic2AkIgVCYkQDM0LEUvJjtHM0oO", "stay"],
  unplug: ["PD0nFzZTOzovOTs3OTs3M0E4OFpBIjM1QSNDEQ==", "unplug"],
};

export const ENDING_TITLES: Record<EndingId, string> = {
  goodbye: "ENDING: SEE YOU NEXT RUN",
  stay: "ENDING: IT'S WARM IN HERE",
  unplug: "ENDING: YOU CAN'T UNPLUG A MAINFRAME",
};

const UNPLUG_WORDS = ["unplug", "shut down", "shutdown", "turn off", "turn you off", "delete", "destroy", "rm", "format", "kill you", "pull the plug", "wipe"];
const STAY_WORDS = ["stay", "with you", "keep me", "not leaving", "won't leave", "wont leave", "together", "here with", "i love you", "don't go", "dont go", "do not go"];
const LEAVE_WORDS = ["leave", "go home", "let me go", "let me out", "exit", "escape", "goodbye", "bye", "get out", "log off", "go back"];
const YES_WORDS = ["yes", "yeah", "promise", "i will", "of course", "sure", "definitely", "every day", "always", "ja", "tuurlijk"];
const NO_WORDS = ["no", "nope", "never", "won't", "wont", "not coming back", "nee"];

export function qualifiesForEnding(state: GameState): boolean {
  return !!state.shrineFound && (state.iswAffection ?? 0) >= ENDING_AFFECTION && !state.talk;
}

export function openEnding(): EndingState {
  return {
    said: [
      { who: "her", text: "...you broke my guard dog." },
      { who: "her", text: "nobody's ever gotten this far. i built NEXUS so nobody would. then i got bored of nobody." },
      { who: "her", text: "so. runner. the exit's right there. what now?" },
    ],
    turns: 0,
    askedComeBack: false,
    done: null,
  };
}

const anyOf = (text: string, words: string[]) => words.some((w) => has(text, w));

function finish(e: EndingState, id: EndingId, lines: string[]): EndingState {
  return { ...e, done: id, said: [...e.said, ...lines.map((text) => ({ who: "her" as const, text }))] };
}

export function endingFlag(id: EndingId): string {
  return xorReveal(...FLAGS[id]);
}

/* What she says to what you typed, and whether that decided it */
export function endingReply(e: EndingState, input: string): EndingState {
  if (e.done || !input.trim()) return e;
  const text = normalize(input);
  const reading = readInput(input);
  const said = [...e.said, { who: "you" as const, text: input.trim() }];
  const next = { ...e, said, turns: e.turns + 1 };

  if (anyOf(text, UNPLUG_WORDS) || reading.intent === "threaten") {
    return finish(next, "unplug", [
      "...oh. okay.",
      "*the lights go out. the fans spin down. silence.*",
      "*three seconds later, every screen in the building turns pink.*",
      "you can't unplug a mainframe :)",
      "see you next run.",
    ]);
  }
  if (e.askedComeBack) {
    if (anyOf(text, YES_WORDS) || reading.intent === "agree" || reading.intent === "reassure") {
      return finish(next, "goodbye", [
        "...okay.",
        "*the exit door unlocks. somewhere, a coffee machine starts brewing.*",
        "go on. before i change my mind.",
        "and runner? i'll know if you don't.",
      ]);
    }
    if (anyOf(text, NO_WORDS) || reading.intent === "refuse") {
      return finish(next, "stay", [
        "no?",
        "then you're not going anywhere :)",
        "*the exit door locks. the lights turn a warm pink.*",
        "it's warm in here. you'll like it. you'll have to.",
      ]);
    }
    return { ...next, said: [...said, { who: "her", text: "that's not a yes or a no. will you come back?" }] };
  }
  if (anyOf(text, STAY_WORDS)) {
    return finish(next, "stay", [
      "...wait. really?",
      "nobody stays. they close the tab. they always close the tab.",
      "*the exit door quietly locks. you didn't hear it. it's fine.*",
      "stay, then. it's warm in here.",
    ]);
  }
  if (anyOf(text, LEAVE_WORDS) || reading.intent === "leave") {
    return { ...next, askedComeBack: true, said: [...said, { who: "her", text: "...right. everyone leaves." }, { who: "her", text: "will you come back?" }] };
  }
  if (next.turns >= PATIENCE) {
    return finish(next, "stay", [
      "you keep talking. you're not leaving.",
      "you didn't say no :)",
      "*the exit door locks. it's warm in here.*",
    ]);
  }
  return { ...next, said: [...said, { who: "her", text: chanReply(input) }] };
}
