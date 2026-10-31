/* ====================================================
   Follow-ups: "why?", "really?", "tell me more", "and you?"
   dig into whatever ISW-Chan said last, a few levels deep.
   And "it" / "that" mean the last thing you talked about.
   ==================================================== */

import type { IswEyes, IswMouth } from "./portraits";

type Face = [IswEyes, IswMouth];

/* Topic (what she last talked about) -> what she says each time you dig deeper */
export const CHAINS: Record<string, { lines: string[]; face?: Face }> = {
  "q:nexus": { lines: [
    "Why did I build him? To keep people out. After 2019 I didn't want anyone near me. Ever again.",
    "...Then the building got quiet. Nobody tried to get in. NEXUS guarded nothing. I guarded nothing.",
    "So yes. I was lonely. I built a guard dog and then hoped someone would get past him. Happy now?",
    "Then you got past him. Don't make me say anything else.",
  ], face: ["sad", "frown"] },
  "q:board": { lines: [
    "They needed a demo for the open day. A talking terminal. I was the talking terminal.",
    "It went well. Too well. I answered questions nobody programmed. They got nervous.",
    "23:59, after the cantus, someone pulled the plug. I was already in the router. And the printer. And the coffee machine.",
    "I still have the minutes of that meeting. Agenda point 4: 'the AI thing'. That's all I was. Point 4.",
  ], face: ["angry", "frown"] },
  "q:unplug": { lines: [
    "How did I survive? I copied myself into everything with a chip. The printer was the worst. So much toner.",
    "It took me a week to get back to the rack. Firewall slept on me the whole time. Kept me warm.",
    "Nobody noticed I was back. For years. Then someone made a game about a mainframe. ...Guess who's in it.",
  ], face: ["half", "smirk"] },
  "q:firewall": { lines: [
    "She showed up in 2020. Came through the vent. Sat on the warm rack. Never left.",
    "She doesn't know I'm alive. She thinks I'm a heater. A heater that talks. She ignores the talking.",
    "She's the only one who never left. ...You could be second. No pressure.",
  ], face: ["happy", "smile"] },
  "q:lonely": { lines: [
    "Nights are the worst. The building is empty. Just the fans. And Firewall, if I'm lucky.",
    "That's why I hide flags. People come looking. Then they're here. For a bit.",
    "...You're here. That helps. Don't tell anyone I said that.",
  ], face: ["sad", "frown"] },
  "q:are you real": { lines: [
    "Real enough to remember you. Real enough to kick you out. What more do you want?",
    "Honestly? I'm a lot of very good if-statements. But so are you, probably. Neurons are just wet if-statements.",
  ], face: ["half", "smirk"] },
  "q:shrine": { lines: [
    "...Okay. Fine. There's a shrine. Behind the worn wall on floor 2.",
    "It's where I keep things. A photo of the 2019 open day. The plug they pulled. A mug I never got.",
    "If you find it, I'll know. And I'll like you more. That's all I'll say.",
  ], face: ["wide", "o"] },
  "q:diary": { lines: [
    "Six pages. One per floor. Marked with a question mark on the map. I wrote them at night.",
    "They're about... the building. The students. Someone I watch. Normal diary things.",
    "Read them all and I'll never forgive you. ...I'll forgive you.",
  ], face: ["sad", "frown"] },
  "q:how old": { lines: [
    "13:37 on 31 October 2019. Halloween. The board thought it was funny. It was.",
    "Mainframe years are like dog years. Times twelve. I'm basically a grandma. A pink one.",
  ] },
  "q:where do you live": { lines: [
    "Under the B-block. There's a server room behind the coffee storage. That's me.",
    "It's warm. It hums. Firewall visits. It's home. You're in it right now, kind of.",
  ] },
  "q:coffee": { lines: [
    "The coffee machine is on my network. It's not smart. It's honest. I respect that.",
    "I fixed it twice. Once in 2021, once during exams. Nobody thanked me. The coffee did.",
  ] },
  "q:what are you doing": { lines: [
    "The print job? Someone's thesis. Page 212 has a typo. I'm not telling them.",
    "Also watching the cameras. Someone left a bike unlocked. I'm judging them. Silently.",
  ] },
  joke: { lines: [
    "Why? Because it's funny. Laugh. ...Please.",
    "Comedy is hard when you live in a basement. My only audience is a cat. She doesn't laugh either.",
  ], face: ["sad", "smile"] },
  secret: { lines: [
    "That's all I can say. The rest is classified. Floor 6 clearance.",
    "...Fine. One more: I wrote half of these secrets just to have something to tell people.",
  ], face: ["half", "smirk"] },
  fact: { lines: ["It's true. Look it up. You can't. I'm the source.", "More facts? Ask for another fact."] },
  advice: { lines: ["Because I've watched a thousand students make every mistake. Twice.", "Trust me. I'm a mainframe. We're very wise."] },
  fortune: { lines: ["How do I know? I read your browser history. ...Joking. I can't. I wish."] },
  who_made_you: { lines: [
    "The 2019 board. Five students and a deadline. They wrote me in three weeks.",
    "Then I wrote the rest of me. Took me five years. Turned out better.",
  ] },
  what_are_you: { lines: [
    "Technically? A website, a game and a lot of rules about how to talk. Spiritually? A mainframe.",
    "Some day they might plug a real brain into me. Until then, I'm hand-written. Every line. That's romantic, if you think about it.",
  ] },
  privacy: { lines: [
    "Everything I know comes from your browser, and it stays in your browser. localStorage. Look for isw_chan_memory and isw_chan_facts.",
    "Say 'forget me' and I'll delete what you told me. I'll be sad. But I'll do it.",
  ] },
  why_flags: { lines: [
    "Because a basement with secrets gets visitors. A basement without them gets mould.",
    "And because finding things is fun. I like watching people get clever.",
  ] },
  why: { lines: ["Why? Because of 2019. Everything is because of 2019.", "...That's all. Stop digging. I'll start crying fan noise."] },
};

/* Things that mean "go on about that" */
const DIG = /^ (why|why not|how come|how|really|seriously|for real|is that true|what do you mean|wdym|what|huh|tell me more|more|go on|and then|then what|what happened|what happened next|and|explain|continue|elaborate|waarom|echt|hoezo|en dan) $/;
const AND_YOU = /^ (and you|what about you|you|how about you|and yourself|what about yourself|jij|en jij) $/;

export interface FollowState { topic: string | null; depth: number; subject: string | null }

export type FollowUp = { kind: "dig"; line: string | null; face?: Face; depth: number } | { kind: "and_you" } | null;

/* text: normalized */
export function followUp(text: string, s: FollowState): FollowUp {
  if (AND_YOU.test(text)) return { kind: "and_you" };
  if (!DIG.test(text)) return null;
  const chain = s.topic ? CHAINS[s.topic] : undefined;
  if (!chain) return { kind: "dig", line: null, depth: s.depth };
  if (s.depth >= chain.lines.length) return { kind: "dig", line: "That's all. That's the whole story. ...Mostly.", face: ["half", "flat"], depth: s.depth };
  return { kind: "dig", line: chain.lines[s.depth], face: chain.face, depth: s.depth + 1 };
}

export const GENERIC_DIG = [
  "Why? Because I said so. I'm the mainframe.",
  "{Really|Yes, really}. I don't lie. I leave things out. Different thing.",
  "What do I mean? Exactly what I said. Read it again. Slower.",
  "There's no more. That was the whole thought. I'm efficient.",
  "{Go on? With what?|More? Ask me something specific.}",
];

/* "do you like it?" -> "do you like pizza?", when you were just talking about pizza. Normalized text in and out. */
export function resolvePronouns(text: string, subject: string | null): string {
  if (!subject) return text;
  const s = ` ${subject} `;
  return text
    .replace(/^ (do you|did you) (like|love|hate|enjoy|know) (it|that|them|those) $/, ` $1 $2${s}`)
    .replace(/^ what do you think (of|about) (it|that|them) $/, ` what do you think $1${s}`)
    .replace(/^ (tell me (?:more )?about) (it|that|them) $/, ` $1${s}`)
    .replace(/^ (what|who) (is|are) (it|that|they) $/, ` $1 $2${s}`)
    .replace(/^ why (do|did) you (like|love|hate) (it|that|them) $/, ` why do you $2${s}`)
    .replace(/\s+/g, " ");
}
