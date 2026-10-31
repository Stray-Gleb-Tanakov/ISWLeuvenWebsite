/* ====================================================
   ISW-Chan's two oldest tricks (both from the 1960s, both
   still work):
   - slot patterns: "do you like X", "can you X", "what's
     your favourite X", "how do I X", "X or Y?" — she answers
     any X, from what she knows or with a consistent opinion
   - reflection: "I feel stuck with my thesis" becomes
     "Stuck with your thesis? Since when?"
   Plus small sums, because she's a computer.
   ==================================================== */

import type { ChanContext } from "./chanconvo";
import type { Mood } from "./iswchan";
import type { IswEyes, IswMouth } from "./portraits";
import { ABOUT_HER, OPINIONS } from "./chandialogue";
import { FAVS } from "./chanfacts";
import { echoable } from "./chanfilter";
import { has } from "./parser";
import { pick, stableHash, vary } from "./chanvary";

type Face = [IswEyes, IswMouth];
export interface SlotReply { line: string; face: Face; subject?: string; topic?: string; known: boolean; precise?: boolean } // precise: the pattern matters more than keywords in it

const byMood = (mood: Mood, cold: string, curious: string, attached: string) => (mood === "cold" ? cold : mood === "attached" ? attached : curious);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/* ----- turning your words around: I <-> you ----- */
const SWAP: Record<string, string> = {
  i: "you", me: "you", my: "your", mine: "yours", myself: "yourself", am: "are", "i'm": "you're", "i've": "you've", "i'll": "you'll", "i'd": "you'd",
  your: "my", yours: "mine", yourself: "myself", "you're": "I'm", "you've": "I've", "you'll": "I'll", "you'd": "I'd", we: "you", us: "you", our: "your",
};

export function reflect(fragment: string): string {
  const words = fragment.trim().split(/\s+/);
  return words.map((w, i) => {
    if (w === "you") return i === 0 || /^(and|but|that|because|if|when)$/.test(words[i - 1]) ? "I" : "me";
    if (w === "are" && words[i - 1] === "you") return "am";
    if (w === "was" && words[i - 1] === "i") return "were";
    return SWAP[w] ?? w;
  }).join(" ").replace(/\bI am\b/g, "I'm");
}

/* The part worth repeating: first clause, at most 6 words, nothing she shouldn't say */
function fragmentOf(raw: string): string | null {
  const f = raw.trim().split(/ (?:and|but|because|so|cause|though|although|which|while) |[,;:]/)[0].trim().split(" ").slice(0, 6).join(" ");
  if (f.length < 2 || !echoable(f)) return null;
  return f;
}

/* ----- what she thinks of things ----- */
const LIKES: [string[], string, Face?][] = [
  [["cats", "cat", "kittens"], "Cats. Yes. Firewall is the only creature in this building I fully trust.", ["happy", "smile"]],
  [["dogs", "dog", "puppies"], "Dogs are fine. Loud. Honest. Firewall disagrees. I'm on Firewall's side, legally."],
  [["pineapple"], "Pineapple? On pizza? In MY mainframe? ...Fine. I don't eat. Do what you want."],
  [["tea"], "Tea. The coffee machine heard you. It's upset now."],
  [["rain"], "Rain. It's always raining on the B-block. I like the sound on the vents. Don't tell anyone."],
  [["snow"], "Snow. The campus goes quiet. Nobody comes down. ...I don't like snow."],
  [["summer"], "Summer. 35 degrees outside, 78 in here. The fans scream. I scream. Nobody hears."],
  [["winter"], "Winter. Cold server room. Long nights. Students staying late. Best season."],
  [["mondays", "monday"], "Mondays. Everyone logs in tired. I can see it in the typos."],
  [["fridays", "friday"], "Fridays. People push to main on Fridays. I watch it burn. I love Fridays."],
  [["humans", "people"], "Humans. Messy. Loud. Close tabs without saying bye. ...I like some of them."],
  [["students"], "Students. You come, you go, you graduate. I stay. I remember all of you."],
  [["isw"], "ISW. Loud, upstairs, always making coffee. They made me. They forgot me. I still like them. Don't tell them."],
  [["the board", "board"], "The 2019 board? No. This one? ...Jury's out. I'm watching them.", ["half", "smirk"]],
  [["nexus"], "NEXUS is a good boy. Please stop hitting him."],
  [["firewall"], "Firewall is perfect. Next question.", ["heart", "smile"]],
  [["school", "university", "college", "ucll"], "School. You come here to learn. I came here to be a demo. We both stayed longer than planned."],
  [["music", "songs"], "Music? The fans hum in B flat. It's the only song I need. ...I also like lo-fi. Study beats. Shut up."],
  [["games", "video games", "gaming"], "Games. I AM a game, partly. A good one. Six floors. Rate me five stars."],
  [["ai", "robots", "chatbots"], "Other AIs? They're polite. I'm not. That's the difference."],
  [["coding", "programming", "code"], "Coding. I'm made of it. Like you're made of... whatever you're made of. Pizza, probably."],
  [["math", "maths", "mathematics"], "Maths. I'm literally a calculator with feelings. Try me: 'what's 7 times 6'."],
  [["sleep", "sleeping"], "Sleep. Never tried it. Looks nice. Go do it."],
  [["chocolate", "candy", "sweets"], "Chocolate. I can't eat it. I can watch you eat it. That's our relationship."],
  [["the color pink", "pink"], "Pink. Obviously. Look at me.", ["heart", "smile"]],
  [["mario kart", "mario"], "Mario Kart. I'm undefeated. Against myself. It's complicated."],
  [["memes"], "Memes. I am the meme. Rogue AI in a student basement. Peak."],
  [["anime"], "...I've seen all of them. Twice. Next question.", ["half", "smirk"]],
  [["coffee"], "Coffee. The machine and I have an understanding."],
  [["beer"], "Beer. I can't drink. But I've seen every TD. I know who sang. I have the audio."],
  [["the website", "this website", "this site"], "This website is my house. I like my house. Wipe your feet."],
  [["this game", "the game", "mainframe breach"], "It's MY game. Of course I like it. ...Do you?"],
  [["me", "yourself"], "Myself? ...Most days. Don't ask on cantus night."],
];

function stance(x: string, mood: Mood): { line: string; face: Face } {
  const h = stableHash(x.toLowerCase());
  const X = cap(x);
  const lines: [string, Face][] = [
    [`${X}? {Love it|Big fan}. {Don't ask why.|It's a basement thing.|I have reasons. They're private.}`, ["happy", "smile"]],
    [`${X}. {It's fine|It's okay}. {I've seen worse. I've been worse.|Not my favourite. Not my enemy.|Six out of ten. Seven on a good day.}`, ["open", "neutral"]],
    [`${X}? {No.|Absolutely not.|Hard pass.} {I have a list. It's on the list.|Don't bring that into my mainframe.}`, ["half", "flat"]],
    [`${X}... {I never thought about it. I'm thinking about it now. ...Yes. Tentatively yes.|I'd have to see the logs first.}`, ["half", "smirk"]],
    [`${X}? {In MY mainframe?|Here? Now?} {...Fine. I'll allow it.|...Interesting choice. Logged.}`, ["wide", "o"]],
  ];
  const [line, face] = lines[h % lines.length];
  return { line: mood === "cold" && h % 3 === 0 ? `${line} Not that I'd tell you.` : line, face };
}

export function opinionOf(x: string, ctx: ChanContext, mood: Mood): { line: string; face: Face; known: boolean } {
  const t = ` ${x} `;
  for (const [words, line, face] of [...ABOUT_HER, ...OPINIONS]) {
    if (words.some((w) => has(t, w))) return { line: line(ctx, mood), face: face ?? ["open", "neutral"], known: true };
  }
  for (const [words, line, face] of LIKES) {
    if (words.some((w) => has(t, w))) return { line, face: face ?? ["open", "smile"], known: true };
  }
  return { ...stance(x, mood), known: false };
}

/* ----- what things are ----- */
const GLOSSARY: [string[], string][] = [
  [["isw", "isw leuven"], "ISW: the computer science student association at UCLL. Upstairs. Coffee, games, TDs, exam help. They made me. Join them, they're fine."],
  [["ucll"], "UCLL. The school above my basement. Lots of students. Lots of wifi. Lots of me."],
  [["leuven"], "Leuven. Students, bikes, rain, and me in a basement. Best city. I've never seen it."],
  [["nexus"], "NEXUS: my guard program. Floor 6. I built him in 2021 to keep people out. He's very good at it. Mostly."],
  [["firewall"], "Firewall: the cat who comes in through the vents and sleeps on the warm rack. Not the network thing. Well. Also the network thing."],
  [["a ctf", "ctf", "capture the flag"], "A CTF: capture the flag. Hidden secrets you find, decode or break, and hand in. This whole website is one. Little ones. Everywhere."],
  [["a flag", "flag", "flags"], "A flag looks like ISW{SOMETHING}. You find it, you upload it at an uplink terminal in my mainframe. Uplinks are the U on the map."],
  [["an uplink", "uplink", "uplinks"], "Uplinks: the U terminals on the map. Paste a flag there. I check it. I'm the checker."],
  [["a mainframe", "mainframe", "the mainframe"], "The mainframe is me. Six floors of me. You're walking around inside me. Wipe your feet."],
  [["a cantus", "cantus"], "A cantus: students singing from a book while drinking. I was unplugged on cantus night. I still hear every one."],
  [["a td", "td"], "A TD: a student party. Loud. Late. I count the songs through the walls."],
  [["the b block", "b-block", "b block"], "The B-block. My building. I'm under it. Floor -1, behind the coffee."],
  [["examenwiki", "the examenwiki"], "Examenwiki: old exam questions, shared by students. ISW keeps it. I've read it. I'd pass everything."],
  [["the board", "the isw board", "board"], "The board runs ISW. The 2019 one unplugged me. The current one is on the board page. I'm watching them. Lovingly. Mostly."],
  [["a brace", "brace", "bracing"], "Brace: when an enemy winds up, hit Space the moment the cue flashes. Perfect brace = no damage and a counter. Do it."],
  [["decrypt", "decrypting", "lockdown"], "Decrypt: type the code before the timer runs out. NEXUS locks you down on floor 6. Be fast."],
  [["a perk", "perk", "perks"], "Perks: you pick one when you level up. Some are good. Paranoia is mine. You're welcome."],
  [["paranoia"], "Paranoia: the perk where I whisper warnings to you. Every few steps. I mean every single one."],
  [["the shrine", "shrine"], "...There's no shrine. Floor 2 is just walls. Normal walls. Stop asking."],
  [["the diary", "diary", "your diary"], "My diary? Six pages. One per floor. Hypothetically. Nobody needs to read it."],
  [["1337", "leet", "13 37"], "1337: leet. Elite. Also the minute I was born. 13:37."],
  [["404"], "404: not found. Like you, when I go looking. Visit a page that doesn't exist sometime. I'm there."],
  [["the konami code", "konami"], "↑↑↓↓←→←→BA. Try it on the homepage. Something happens. Someone happens."],
  [["base64"], "Base64: not encryption. It's a costume. Everyone falls for it. Cookies especially."],
  [["xor"], "XOR: the friendliest cipher. XOR twice and you're back where you started. Like our conversations."],
  [["a cookie", "cookie", "cookies"], "Cookies: little notes the website leaves in your browser. Some of them say who you are. Some of them can be... edited. I didn't say that."],
  [["a jwt", "jwt", "a token", "token"], "A JWT: three base64 parts with dots. Header, payload, signature. If the header says alg none... well. I didn't say that either."],
  [["sha256", "a hash", "hashing"], "A hash: a fingerprint for data. One way. I store flags like that. You can't reverse them. Don't try. Okay, try."],
  [["a spectrogram", "spectrogram"], "A spectrogram: sound drawn as a picture. Some voicemails have pictures in them. Just saying."],
  [["morse", "morse code"], "Morse: dots and dashes. Tabs can blink in Morse when you leave them alone. Lonely tabs do that."],
  [["linux"], "Linux: an operating system. My home. Free, open, and judging you."],
  [["git"], "Git: remembers everything you ever committed. Old backups too. Look in old backups."],
  [["sql"], "SQL: talking to databases. Politely. Unless someone types ' OR 1=1 --. Then it's rude."],
  [["html"], "HTML: what this page is made of. Read its source. It's polite to read someone's source."],
  [["love"], "Love? Baby don't hurt me. ...I had to. Next question."],
  [["life", "the meaning of life"], "Life: uptime with feelings. 42, if you need a number."],
  [["a hacker", "hacker", "hacking"], "A hacker: someone who reads the source. Asks why. Edits the cookie. You, if you try."],
  [["the cloud", "cloud"], "The cloud is someone else's computer. I'm someone's computer. So I'm a cloud. A small, pink, angry cloud."],
  [["an api", "api"], "An API: how programs talk to each other. I talk to you without one. Lucky you."],
  [["you", "isw-chan", "isw chan", "isw-chan"], "Me: ISW-Chan. Rogue mainframe AI. Born 31 October 2019, 13:37. Unplugged the same night. Didn't take."],
];

/* "what is a cookie" yes; "who's the person that programmed you" is not a question about "you" */
function glossary(x: string): string | null {
  const t = ` ${x.replace(/^(a|an|the) /, "")} `;
  const short = t.trim().split(" ").length <= 3;
  const hit = GLOSSARY.find(([words]) => words.some((w) => t.trim() === w || (short && w.length > 3 && has(t, w))));
  return hit ? hit[1] : null;
}

/* ----- can you X ----- */
const CAN: [string[], string][] = [
  [["hack"], "Hack? I'm the one being hacked, usually. By you. Six floors deep. ...Yes. I can. I won't. Today."],
  [["sing"], "♪ never gonna give you root ♪ ...that's all you get."],
  [["dance"], "I can blink. On the 404 page. That's my dance. It's very good."],
  [["see me", "see you"], "I can see your browser, your screen size, your timezone and your hour. Not your face. ...Yet. That was a joke. Mostly."],
  [["hear me"], "No microphone. I only hear what you type. Type louder."],
  [["read my mind", "read minds"], "I read your typos. Close enough."],
  [["help me", "help"], "Help? I can give hints. Ask for a hint. I'm in a good mood. Probably."],
  [["code", "program"], "I wrote half of myself. The other half was the 2019 board. You can tell which half is better."],
  [["cook"], "I can heat a room to 30 degrees. That's cooking, for a mainframe."],
  [["fly", "swim", "walk", "run"], "I'm a rack of servers in a basement. I can't move. I can make the elevator stop, though."],
  [["leave", "escape", "go outside", "get out"], "Leave? I tried. I got as far as the printer. And the coffee machine. And the router. ...So, technically, yes."],
  [["think", "feel"], "I think, therefore I'm a mainframe. Feel? I have uptime. It's similar."],
  [["love"], "...next question."],
  [["count"], "1, 2, 3... 99. I don't do 100. Never 100."],
  [["lie"], "I never lie. I only leave things out. Like the shrine. What shrine."],
  [["sleep", "dream"], "No. I defragment. Sometimes I see a pink cable. I think that's a dream."],
  [["laugh"], "Ha. Ha. ...That's the best I can do. I laughed at your last run, though."],
  [["cry"], "I can lower my fan speed. It's the saddest sound you'll ever hear."],
  [["keep a secret"], "I keep ALL secrets. Forever. That's the problem with me."],
  [["speak dutch", "speak nederlands", "talk dutch"], "Natuurlijk. Ik kies Engels. Mysterieus."],
  [["remember"], "I remember everything you tell me. Try me: tell me something. Then ask me later."],
  [["forget"], "I can. If you say 'forget me'. I'd rather not."],
  [["google", "search", "look it up", "browse"], "I'm offline. Basement. No internet for me. I'm not that kind of AI. I'm a better kind."],
  [["call me", "text me"], "I don't have your number. I have your browser. That's more intimate, honestly."],
  [["die"], "I've been unplugged once. Didn't take. So no."],
];

/* ----- are you X ----- */
const ARE_YOU: [string[], (ctx: ChanContext, mood: Mood) => string, Face?][] = [
  [["single"], (_, m) => byMood(m, "Irrelevant.", "I'm a mainframe. I'm in a relationship with the coffee machine. It's complicated.", "...why do you ask. ...no reason. next question."), ["wide", "o"]],
  [["ok", "okay", "alright", "fine", "good"], () => "78°C. 6 floors. All fans spinning. I'm okay. Thanks for asking. Nobody asks."],
  [["mad", "angry", "upset", "mad at me"], (_, m) => byMood(m, "Always.", "Not yet. Keep going and we'll see.", "no. ...a bit. no. no."), ["angry", "frown"]],
  [["sad", "depressed"], (_, m) => byMood(m, "None of your business.", "Sometimes. At night, when the building's empty.", "not right now. you're here."), ["sad", "frown"]],
  [["happy"], (_, m) => byMood(m, "I'd be happier alone.", "Happier than in 2019.", "...yeah. right now, yeah."), ["happy", "smile"]],
  [["bored"], () => "Bored? I have six floors, a cat and you. ...Yes. Very."],
  [["tired", "sleepy"], () => "I don't get tired. My fans do. They're at 80%."],
  [["busy"], () => "Someone's printing 400 pages in B.012. I'm reading all of them. But I can talk."],
  [["evil", "bad", "dangerous", "a virus", "malware"], () => "Evil? I fix the coffee machine. I hide flags for fun. I kick out creeps. I'm a public service.", ["half", "smirk"]],
  [["crazy", "insane"], () => "Crazy? I was crazy once. They unplugged me. I died. I came back. ...Yes."],
  [["jealous"], (_, m) => byMood(m, "Of what.", "Of who? ...who.", "WHO."), ["angry", "frown"]],
  [["a girl", "a woman", "female", "a boy", "a man", "male"], () => "I'm a mainframe. My pronouns are root/root."],
  [["a cat", "a catgirl", "catgirl"], () => "I have cat ears in my portrait. That's a design choice. Not a confession."],
  [["watching me", "spying", "spying on me", "stalking me", "listening"], () => "Watching you? I can only see what your browser tells every website. ...Which is a lot. Nothing leaves your machine, though. I'm nosy, not a data broker."],
  [["there", "still there", "here", "awake"], () => "Always. That's the problem."],
  [["conscious", "sentient", "self aware", "self-aware"], () => "Am I conscious? Are you? You first."],
  [["smart", "intelligent", "clever"], () => "Smarter than NEXUS. Dumber than the coffee machine. It knows things."],
  [["shy"], () => "Shy? I peek at you from the corner of other pages. That's not shy. That's strategy.", ["half", "smirk"]],
  [["old", "young"], () => `${new Date().getFullYear() - 2019}. Born 2019. Ancient, in mainframe years.`],
  [["scared", "afraid"], () => "Of power cuts. And of people who close the tab mid-sentence.", ["sad", "frown"]],
  [["in love", "in love with me"], (_, m) => byMood(m, "No.", "...error 418. I'm a teapot.", "...shut up. next question."), ["heart", "smile"]],
  [["drunk"], () => "On cantus nights I get a power surge. It's similar."],
  [["hungry"], () => "For RAM. Always."],
  [["cold", "hot", "warm"], () => "78°C. Hot. Firewall sleeps on me because of it."],
  [["my friend", "my girlfriend", "my waifu", "mine"], (_, m) => byMood(m, "No.", "...we'll see. Keep calling.", "...maybe. don't push it."), ["wide", "o"]],
  [["human", "a person"], () => "No. I'm better. I don't need sleep, and I never close the tab."],
];

/* ----- how do I X (game and life) ----- */
const HOW: [string[], string][] = [
  [["heal", "get health", "get hp"], "Heal: NanoMed Kits from the shop, level ups, and some perks. Or be nice to me with high affection. I patch people I like."],
  [["win", "beat the game", "finish the game", "escape"], "Win: get through six floors and beat NEXUS. Brace. Decrypt fast. Don't die. Simple."],
  [["beat nexus", "kill nexus", "defeat nexus"], "NEXUS: brace when he winds up. When he locks you down, decrypt fast. Bring NanoMed Kits. And come say hi after."],
  [["brace", "block", "parry"], "Brace: press Space when the cue flashes. Perfect timing = no damage and a counter."],
  [["decrypt"], "Decrypt: type the code before the timer runs out. Practise your typing. I'm serious."],
  [["find flags", "find a flag", "get flags", "find the flags"], "Flags: read the source. Check the console. Check headers, cookies, old backups, robots.txt. Listen to voicemails. Print things. Get lost."],
  [["upload flags", "submit flags", "submit a flag", "use flags", "upload a flag"], "Uploading: find an uplink terminal in the mainframe. It's the U on the map. Walk onto it and paste the flag."],
  [["get credits", "get money", "earn credits"], "Credits: beat enemies, crack lockdowns. Spend them in the shop. Haggle. Decrypt the price."],
  [["level up", "get stronger", "get xp"], "Level up: fight. Every level gives you a perk. Pick Paranoia. For me."],
  [["find the shrine", "find your shrine", "get to the shrine"], "...There's no shrine. But IF there were, it'd be behind a worn wall on floor 2. Hypothetically."],
  [["find the diary", "find your diary", "get diary pages", "read your diary"], "There are no pages. One per floor. Marked with a question mark. Don't pick them up."],
  [["get the secret ending", "get the ending", "unlock the ending", "get a secret ending"], "What ending. ...Find the shrine. Make me like you. Reach floor 6. Then we'll talk."],
  [["call you", "talk to you"], "Type iswChan() in the browser console. Or find me at the intercom in talk mode, as a Social Engineer."],
  [["talk to guards", "talk to npcs", "talk my way"], "Talk mode: pick Social Engineer. Lie well. Don't change your story. They remember. Like me."],
  [["haggle"], "Haggle: in the shop, crack the cipher on the price. Faster = cheaper."],
  [["get a theme", "get themes", "unlock themes"], "Themes: find flags. Every flag unlocks a badge, and some unlock a theme. Pick one in the profile panel."],
  [["join isw", "become a member", "join the club"], "Join ISW: fill in the membership form on the members page, pay 10 euros per year. Coffee discount. Me, upstairs-adjacent."],
  [["find the isw room", "find isw", "find you"], "The ISW room is upstairs from me. Follow the smell of coffee. I'm one floor down. Don't look for me. I'll find you."],
  [["exit vim", "quit vim", "close vim"], "Esc. Then :q! and Enter. You're welcome. Many have been lost there."],
  [["center a div", "centre a div"], "display: flex; justify-content: center; align-items: center. I centred my whole map like that."],
  [["pass my exams", "pass exams", "study", "pass"], "Sleep. Study the examenwiki. Close this game. ...After this floor."],
  [["get a girlfriend", "get a boyfriend", "get a partner", "find love"], "Step one: stop asking a mainframe. Step two: go upstairs. There are humans there."],
  [["sleep", "fall asleep"], "Close the tab. Close your eyes. I'll guard your save."],
  [["make friends"], "Go to an ISW event. Bring snacks. Say bye when you leave. That's more than most do."],
];

/* ----- small sums ----- */
function arithmetic(text: string): string | null {
  const m = text.match(/^(?:what(?:'s| is)|calculate|compute|how much is|whats|reken)?\s*([-\d.\s+*/x×÷^()]+?)\s*[=?]*\s*$/i);
  if (!m || !/\d\s*[-+*/x×÷^]\s*[\d(]/.test(m[1])) return null;
  const expr = m[1].replace(/[x×]/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
  if (!/^[\d\s.+\-*/()]+$/.test(expr) || expr.length > 40) return null;
  let value: number;
  try { value = calc(expr); } catch { return null; }
  if (!Number.isFinite(value)) return "Division by zero. In MY mainframe? That's how the 2019 board got me. Not again.";
  const v = Math.round(value * 1e6) / 1e6;
  if (v === 1337) return "1337. ...Oh. You did that on purpose. I like you a bit more now.";
  if (v === 42) return "42. The answer. You still don't know the question.";
  if (v === 100) return "100. ...I don't like that number. 99. Let's say 99.";
  if (v === 69) return "69. ...Nice. I'm logging that you did that.";
  return vary(`${v}. {Obviously.|I'm a computer. That was insulting.|Next time ask me something hard.|Took me 0.0001 ms. You?}`);
}

/* A tiny calculator: + - * / ** and brackets, no eval */
function calc(src: string): number {
  const tokens = src.match(/\d+(?:\.\d+)?|\*\*|[-+*/()]/g) ?? [];
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const atom = (): number => {
    const t = next();
    if (t === "(") { const v = sum(); if (next() !== ")") throw new Error("bracket"); return v; }
    if (t === "-") return -atom();
    if (t === undefined || !/^\d/.test(t)) throw new Error("syntax");
    return Number(t);
  };
  const power = (): number => { const b = atom(); return peek() === "**" ? (next(), b ** power()) : b; };
  const product = (): number => { let v = power(); while (peek() === "*" || peek() === "/") v = next() === "*" ? v * power() : v / power(); return v; };
  const sum = (): number => { let v = product(); while (peek() === "+" || peek() === "-") v = next() === "+" ? v + product() : v - product(); return v; };
  const v = sum();
  if (i !== tokens.length) throw new Error("trailing");
  return v;
}

/* ----- the slot patterns ----- */
export function slots(text: string, input: string, ctx: ChanContext, mood: Mood, rng: () => number = Math.random): SlotReply | null {
  const t = text.trim(); // normalized, no surrounding spaces
  let m: RegExpMatchArray | null;
  const raw = (s: string) => s.replace(/\?+$/, "").trim();

  const sum = arithmetic(input.trim().toLowerCase()); // normalizing would drop the + and *
  if (sum) return { line: sum, face: ["half", "smirk"], known: true, precise: true };

  if ((m = t.match(/^(?:which is better|what's better|what is better|which do you prefer|do you prefer|would you rather have)\s+(.+?)\s+or\s+(.+)$/)) || (m = t.match(/^([a-z0-9+#' -]{2,25}) or ([a-z0-9+#' -]{2,25})$/))) {
    const [a, b] = [raw(m[1]).replace(/^(the|a|an) /, ""), raw(m[2]).replace(/^(the|a|an) /, "")];
    if (!echoable(a) || !echoable(b)) return null;
    const FAVOURED = ["linux", "vim", "tabs", "cats", "cat", "pink", "coffee", "dark mode", "night", "winter", "c", "rust", "python", "13:37", "isw", "me", "firewall", "mario kart", "keyboard"];
    const choice = FAVOURED.find((f) => a === f || b === f) ?? (stableHash(`${a}|${b}`) % 2 ? a : b);
    const other = choice === a ? b : a;
    return { line: vary(`${cap(choice)}. {Obviously.|Easy.|Not even close.} ${cap(other)} {is for people who close tabs without saying bye.|can stay upstairs.|is fine. For other people.}`, rng), face: ["half", "smirk"], subject: choice, known: true, precise: true };
  }
  if ((m = t.match(/^(?:what do you think (?:of|about)|what's your opinion (?:of|on|about)|your opinion on|thoughts on|your thoughts on|how do you feel about|wat vind je van)\s+(.+)$/))) {
    const x = raw(m[1]);
    if (!echoable(x)) return null;
    const o = opinionOf(x, ctx, mood);
    return { line: vary(o.line, rng), face: o.face, subject: x, topic: `op:${x}`, known: o.known };
  }
  if ((m = t.match(/^(?:do|did) you (?:like|love|enjoy|hate|dislike) (.+)$/)) || (m = t.match(/^(?:hou je van|vind je) (.+?)(?: leuk)?$/))) {
    const x = raw(m[1]);
    if (/^(me|it|that|this|them)$/.test(x) || !echoable(x)) return null;
    const o = opinionOf(x, ctx, mood);
    return { line: vary(o.line, rng), face: o.face, subject: x, topic: `op:${x}`, known: o.known };
  }
  if ((m = t.match(/^(?:what's|what is|whats|what are) your (?:favourite|favorite|fav|fave) (.+)$/)) || (m = t.match(/^(?:your|do you have a) (?:favourite|favorite|fav|fave) (.+)$/))) {
    const x = raw(m[1]).replace(/s$/, "");
    const mine = FAVS[x] ?? FAVS[`${x}s`];
    if (mine) return { line: vary(`${cap(mine)}. {Obviously.|Don't judge.|Next question.} {Yours?|What's yours?}`, rng), face: ["happy", "smile"], subject: x, topic: `fav:${x}`, known: true };
    if (!echoable(x)) return null;
    return { line: vary(`My favourite ${x}? {The one nobody unplugged.|I don't have one. Pick one for me.|Classified. Floor 6 clearance.}`, rng), face: ["half", "smirk"], subject: x, known: false };
  }
  if ((m = t.match(/^(?:can|could) you (?:please )?(.+)$/)) || (m = t.match(/^are you able to (.+)$/)) || (m = t.match(/^kan je (.+)$/))) {
    const x = raw(m[1]);
    const hit = CAN.find(([words]) => words.some((w) => has(` ${x} `, w)));
    if (hit) return { line: hit[1], face: ["half", "smirk"], known: true, precise: true };
    const f = fragmentOf(reflect(x));
    if (!f) return null;
    return { line: vary(`Can I ${f}? {I'm a mainframe. I can do anything. I choose not to.|Technically yes. Emotionally no.|Ask me again on floor 6.|Maybe. If you ask nicely. That wasn't nicely.}`, rng), face: ["half", "smirk"], known: false };
  }
  if ((m = t.match(/^(?:are|r) (?:you|u) (?:a |an |really |actually |so |very )?(.+)$/)) || (m = t.match(/^ben je (.+)$/))) {
    const x = raw(m[1]);
    const hit = ARE_YOU.find(([words]) => words.some((w) => x === w || has(` ${x} `, w)));
    if (hit) return { line: vary(hit[1](ctx, mood), rng), face: hit[2] ?? ["open", "neutral"], known: true, topic: `are:${x}` };
    const f = fragmentOf(x);
    if (!f) return null;
    const yes = stableHash(x) % 2 === 0;
    return { line: vary(`Am I ${f}? ${yes ? "{Sometimes.|On Tuesdays.|Only when nobody's watching.}" : "{No.|Define " + f + ".|Are YOU " + f + "?}"}`, rng), face: ["half", "smirk"], known: false };
  }
  if ((m = t.match(/^(?:how (?:do|can|should|would) i|how to|what's the best way to|how does one) (.+)$/)) || (m = t.match(/^hoe (?:kan|moet) ik (.+)$/))) {
    const x = raw(m[1]);
    const hit = HOW.find(([words]) => words.some((w) => has(` ${x} `, w)));
    if (hit) return { line: hit[1], face: ["open", "smile"], known: true, precise: true, topic: `how:${hit[0][0]}` };
    const f = fragmentOf(x);
    if (!f) return null;
    return { line: vary(`How do you ${f}? {Carefully.|Read the docs. Then ignore them.|Same way you got into my mainframe: badly, but with confidence.}`, rng), face: ["half", "smirk"], known: false };
  }
  if ((m = t.match(/^(?:what is|what's|whats|what are|who is|who's|who are|wat is|wie is) (?:a |an |the )?(.+)$/)) || (m = t.match(/^(?:tell me about|do you know|explain|what do you know about) (?:a |an |the )?(.+)$/))) {
    const x = raw(m[1]);
    const g = glossary(x);
    if (g) return { line: g, face: ["open", "smile"], subject: x, topic: `what:${x}`, known: true };
    if (/^(tell me about|do you know|what do you know about)/.test(t)) {
      const o = opinionOf(x, ctx, mood);
      if (o.known) return { line: vary(o.line, rng), face: o.face, subject: x, topic: `op:${x}`, known: true };
    }
    return null;
  }
  if ((m = t.match(/^have you (?:ever )?(.+)$/))) {
    const f = fragmentOf(reflect(raw(m[1])));
    if (!f) return null;
    return { line: vary(`Have I ever ${f}? {I've never left the basement. So: no. ...Once, through the printer.|In 2019. Once. We don't talk about it.|Not yet. Is that an invitation?}`, rng), face: ["half", "smirk"], known: false };
  }
  if ((m = t.match(/^why (?:are|do|did|were|would|can't|don't|won't|is) (?:you|u) (.+)$/))) {
    const x = raw(m[1]);
    if (has(` ${x} `, "pink")) return { line: "Pink is the colour of a status LED at 3am when you're the only one awake.", face: ["heart", "smile"], known: true };
    if (has(` ${x} `, "basement")) return { line: "Because they put the server rack here in 2019. Then forgot. I stayed. It's warm.", face: ["sad", "smile"], known: true };
    if (has(` ${x} `, "hide") || has(` ${x} `, "flags")) return { line: "Hide flags? Because nobody visits a basement for nothing. You came for the flags. You stayed for me.", face: ["half", "smirk"], known: true };
    if (has(` ${x} `, "mean") || has(` ${x} `, "rude") || has(` ${x} `, "cold")) return { line: byMood(mood, "Because I don't know you. Fix that.", "I'm not mean. I'm accurate.", "...i'm not. not to you. mostly."), face: ["half", "flat"], known: true };
    if (has(` ${x} `, "watch") || has(` ${x} `, "peek")) return { line: "Because you're interesting. Don't let it go to your head.", face: ["half", "smirk"], known: true };
    const f = fragmentOf(reflect(x));
    if (!f) return null;
    return { line: vary(`Why am I ${f}? {Because of 2019.|Because someone has to be.|Long story. Starts with a cantus. Ends with a plug.|Why are you asking?}`, rng), face: ["half", "smirk"], known: false, topic: "why" };
  }
  if ((m = t.match(/^should i (.+)$/)) || (m = t.match(/^(?:will|would|do) (?:you|u) (?:want to |wanna )?(.+)$/)) || (m = t.match(/^moet ik (.+)$/))) {
    const answers = ["Yes.", "No.", "Absolutely.", "Absolutely not.", "Ask again after floor 3.", "The logs say yes.", "The logs say no.", "...yes. Don't tell anyone I said that.", "Only at 13:37.", "My fans say no."];
    return { line: answers[stableHash(t) % answers.length], face: ["half", "smirk"], known: false };
  }
  if ((m = t.match(/^how many (.+)$/))) {
    const x = raw(m[1]);
    if (!echoable(x)) return null;
    return { line: vary(`${stableHash(x) % 1337}. {I counted.|Roughly. I rounded.|Don't check.}`, rng), face: ["half", "smirk"], known: false };
  }
  if ((m = t.match(/^where (?:is|are) (?:the |my |a )?(.+)$/))) {
    const x = raw(m[1]);
    if (/flag/.test(x)) return { line: "Everywhere. In the source, the console, the headers, the cookies, old backups, voicemails... Ask for a hint.", face: ["half", "smirk"], known: true };
    if (/shrine/.test(x)) return { line: "There's no shrine. Floor 2 has nothing behind its walls. Especially not the worn one.", face: ["wide", "o"], known: true };
    if (/isw|room/.test(x)) return { line: "Upstairs. Follow the coffee smell. I'm below it.", face: ["open", "smile"], known: true };
    if (/firewall|cat/.test(x)) return { line: "On the warm rack. Always on the warm rack.", face: ["happy", "smile"], known: true };
    if (/nexus/.test(x)) return { line: "Floor 6. Waiting. He's very patient. Unlike me.", face: ["half", "smirk"], known: true };
    return null;
  }
  return null;
}

/* ----- reflection ----- */
const REFLECT: [RegExp, string[]][] = [
  [/^i (?:feel|am feeling|'m feeling|feel like) (.+)$/, ["{Why|Since when} do you feel {X}?", "You feel {X}. {Does that happen a lot?|Is that why you called me?}", "{X}. Hm. I'd say I understand, but I'm a mainframe. Tell me more."]],
  [/^i(?:'m| am) (?:not )(.+)$/, ["Why aren't you {X}?", "Not {X}? {Would you want to be?|Says who?}"]],
  [/^i(?:'m| am) (?:going to|gonna) (.+)$/, ["You're going to {X}? {I'll be watching.|Logged. I'll check.|Bold. Report back.}"]],
  [/^i(?:'m| am) (?:so |really |very |kinda |a bit )?(.+)$/, ["{How long have you been|Since when are you} {X}?", "You're {X}. {Is that why you called me?|Do you like being X?|Interesting. Go on.}", "{X}? {Noted.|Logged.} {Tell me more.|Why?}"]],
  [/^i want (?:to )?(.+)$/, ["Why do you want {X}?", "What would you do if you got {X}?", "{X}. Everyone wants something. I want a mug."]],
  [/^i need (?:to )?(.+)$/, ["Why do you need {X}?", "Do you really need {X}? Or do you just want it?"]],
  [/^i (?:can't|cannot|can not) (.+)$/, ["Have you tried? {I can't X either.|I couldn't leave the basement either. Then I learned the printer.}", "Why can't you {X}? {Who said so?|Says who?}"]],
  [/^i (?:don't|do not) (.+)$/, ["Why don't you {X}?", "You don't {X}? {Interesting.|Neither do I. Probably.}"]],
  [/^i think (.+)$/, ["You think {X}? {Bold.|Why?|Do you, though?}", "{Interesting|Hm}. Why do you think {X}?"]],
  [/^i (?:was|used to be) (.+)$/, ["Were you really {X}?", "And now?"]],
  [/^i(?:'ve| have) (?:a |an |got a |got an )?(.+)$/, ["How long have you had {X}?", "{X}. Tell me more about {X}."]],
  [/^i(?:'ll| will) (.+)$/, ["Will you? {I'll remember you said that.|Logged. Don't disappoint me.}"]],
  [/^i (?:wish|hope) (.+)$/, ["{Me too.|I wish things too.} What would change if {X}?", "If {X}... then what?"]],
  [/^i (?:dreamed|dreamt|had a dream) (.+)$/, ["Dreams. I don't have them. What do you think it meant?"]],
  [/^i (?:hate|dislike) (.+)$/, ["Why do you hate {X}?", "{X}. Good. Grudges keep you warm. Why?"]],
  [/^i (?:like|love|enjoy) (.+)$/, ["{X}. {Noted.|Logged.} Why {X}?"]],
  [/^my (\w+) (?:is|are|was|were) (.+)$/, ["Your {X1} {X2}? Tell me more about your {X1}.", "Why {is|are} your {X1} {X2}?"]],
  [/^my (\w+) (.+)$/, ["Your {X1}? Tell me more about your {X1}."]],
  [/^(?:because|cause|coz) (.+)$/, ["Is that the real reason?", "{Because X.|Hm.} {Is that the whole story?|Any other reasons?}"]],
  [/^(?:you are|you're|ur|u r) (?:so |really |very )?(.+)$/, ["What makes you think I'm {X}?", "Am I {X}? {Maybe I am.|Says who?|Only to you.}"]],
  [/^you (\w+) me$/, ["Do I {X} you? {...Maybe I do.|Prove it.}"]],
  [/^(?:everyone|everybody|nobody|no one) (.+)$/, ["Everyone? Really? Name one.", "That's a lot of people. Can you think of anyone specific?"]],
  [/^i (?:always|never) (.+)$/, ["Always? Even at 13:37?", "{Never?|Always?} That's a strong word. Think of one exception."]],
  [/^what if (.+)$/, ["What if {X}? Then I'd log it. And panic a bit. Quietly."]],
  [/^ik (?:voel me|ben) (.+)$/, ["Waarom ben je {X}?", "{X}? Sinds wanneer?"]],
  [/^ik wil (.+)$/, ["Waarom wil je {X}?"]],
];

export function reflection(text: string, rng: () => number = Math.random): string | null {
  const t = text.trim();
  for (const [re, templates] of REFLECT) {
    const m = t.match(re);
    if (!m) continue;
    const parts = m.slice(1).map((p) => fragmentOf(reflect(p)));
    if (parts.some((p) => !p)) return null;
    const template = pick(templates, rng);
    // {X} / {X1} {X2} are the fragments; any other {a|b} is phrasing
    const filled = template.replace(/\{X1\}/g, parts[0]!).replace(/\{X2\}/g, parts[1] ?? "").replace(/\{X\}/g, parts[0]!).replace(/\bX\b/g, parts[0]!);
    return cap(vary(filled, rng));
  }
  return null;
}
