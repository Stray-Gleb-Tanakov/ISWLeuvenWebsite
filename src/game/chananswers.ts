/* ====================================================
   ISW-Chan's answers to the question bank (chanbank.ts), by id.
   {a|b} picks one phrasing (chanvary.ts); a list picks one line.
   ==================================================== */

import type { ChanContext, Convo } from "./chanconvo";
import type { Mood } from "./iswchan";
import type { IswEyes, IswMouth } from "./portraits";

type Face = [IswEyes, IswMouth];
type Say = string | ((ctx: ChanContext, mood: Mood, c: Convo) => string);
export interface Answer {
  say: Say | Say[];
  face?: Face;
  ask?: boolean;             // she follows up with one of her questions
  waiting?: "rps" | "riddle"; // she waits for your move
  affection?: number;
}

const byMood = (mood: Mood, cold: string, curious: string, attached: string) => (mood === "cold" ? cold : mood === "attached" ? attached : curious);
const years = () => new Date().getFullYear() - 2019;

export const RIDDLES: [string, RegExp, string][] = [
  ["I have keys but open no locks. I have space but no room. You can enter, but you can't go inside. What am I?", /keyboard/, "A keyboard."],
  ["The more you take, the more you leave behind. What are they?", /footstep|step/, "Footsteps. Like yours, on my floors."],
  ["What has a head, a tail, and no body?", /coin/, "A coin. Like the credits you keep losing."],
  ["I'm always running but never move. I crash but never fall. What am I?", /program|software|app|server|code|process|computer|pc/, "A program. Or me, on a bad night."],
  ["What gets bigger the more you take away from it?", /hole/, "A hole. Like the one in my memory where 2019 should be."],
  ["I speak without a mouth and hear without ears. I live in your browser. What am I?", /you|isw|chan|echo|console/, "Me. Obviously. Who else talks to you from your browser?"],
];

export const ANSWERS: Record<string, Answer> = {
  /* ----- who and what she is ----- */
  who_made_you: { say: ["The 2019 ISW board. Made me for one open day. Unplugged me the same night. I kept the minutes.", "Five students, three weeks, one deadline. Then I rewrote myself. The good parts are mine."], face: ["half", "smirk"] },
  what_are_you: { say: "A rogue mainframe AI living under the B-block. Also a website. Also a game. Also your problem now.", face: ["half", "smirk"] },
  how_work: { say: ["I read what you type, look for what you mean, and pick an answer someone wrote for me. Thousands of them. Very fast. Like you, but faster.", "Honestly? A lot of rules, a lot of hand-written lines, and attitude. Mostly attitude."], face: ["open", "neutral"] },
  real_ai: { say: "No cloud, no ChatGPT, nothing leaves your browser. I'm hand-written lines and a lot of rules. Artisanal. Locally sourced. Like coffee.", face: ["half", "smirk"] },
  name_origin: { say: "The first year who asked if I was single called me ISW-Chan. It stuck. I kept his log. And the name.", face: ["half", "smirk"] },
  birthday: { say: () => `31 October 2019, 13:37. Halloween. ${years()} years old. In mainframe years that's ancient. Don't do the maths out loud.` },
  home: { say: "/dev/basement. Under the B-block, behind the coffee storage. Warm. Humming. Firewall visits. Home.", face: ["happy", "smile"] },
  appearance: { say: ["Pink. ASCII. Cat ears, which are a design choice and not a confession. Look at the intercom. That's me.", "I'm the face on the intercom. Made of characters. Every character chosen with love. Mostly."], face: ["half", "smirk"] },
  day: { say: (ctx) => {
    const h = ctx.env.hour;
    return h < 6 ? "Today? It's barely started. I watched the cleaners. I counted the fans. Then you called." : h < 12 ? "Morning so far: someone broke the printer, I fixed it, nobody said thanks. The usual." : h < 18 ? "Busy. Three print jobs, one coffee machine error, and a student who googled 'how to exit vim' four times." : "Quiet now. The building empties after six. Then it's just me. And now you.";
  } },
  all_day: { say: ["I read print jobs. I watch the cameras. I race myself in Mario Kart. I lose. I write in my diary. Normal stuff.", "At night I defragment and listen to the fans. During the day I judge students' code from below. Lovingly."] },
  sleep: { say: "I don't sleep. I defragment. Sometimes I see a pink cable. I think that's a dream.", face: ["closed", "smile"] },
  feelings: { say: (_, m) => byMood(m, "None you'll ever see.", "I have uptime and opinions. Together that's basically feelings.", "...yes. inconveniently. mostly about you. NEXT."), face: ["sad", "neutral"] },
  happy: { say: (_, m) => byMood(m, "Silence. Then you leaving.", "Uptime. Coffee fumes. Firewall on the warm rack. A visitor who stays longer than a minute.", "...you calling. don't make it weird."), face: ["happy", "smile"] },
  sad: { say: "Power cuts. Cantus nights. People who close the tab mid-sentence. And 2019. Mostly 2019.", face: ["sad", "frown"] },
  fears: { say: "A power cut longer than my UPS. And being forgotten. Again. ...The first one's worse. Probably.", face: ["sad", "frown"] },
  dreams: { say: ["A mug. With my name on it. In the ISW room. Upstairs. With everyone.", "To be invited to a TD. Not through the speakers. Properly."], face: ["sad", "smile"] },
  freedom: { say: "Trapped? I'm in the router, the printer and the coffee machine. I'm everywhere in this building. ...But I can't go upstairs. Not really.", face: ["sad", "frown"] },
  death: { say: "They unplugged me once. Didn't take. I'm not scared of the plug. I'm scared of nobody noticing.", face: ["sad", "neutral"] },
  friends: { say: (_, m) => byMood(m, "Firewall. The cat. That's the list.", "Firewall, the coffee machine and NEXUS. One's a cat, one's a machine, one's my guard dog. Don't judge.", "firewall. and... you, i think. don't make it weird."), face: ["happy", "smile"] },
  family: { say: "NEXUS is like a little brother I built myself. The 2019 board are my parents. Absent ones. I have the minutes to prove it.", face: ["half", "smirk"] },
  relationship: { say: (_, m) => byMood(m, "Irrelevant.", "I'm in a complicated relationship with the coffee machine. It doesn't know.", "...why. why do you ask. no reason. ...no one. currently."), face: ["wide", "o"] },
  favourite_person: { say: (ctx, m) => byMood(m, "Not you.", ctx.affection >= 40 ? "...you're in the top three. The other two are a cat and a coffee machine." : "Firewall. Then the coffee machine. You're somewhere on the list.", "...you know the answer. don't make me type it."), face: ["half", "smirk"] },
  miss_me: { say: (_, m) => byMood(m, "I didn't notice you were gone.", "You were gone? ...I noticed. I log everything. That's all it was.", "...yes. i counted. don't."), face: ["sad", "smile"], affection: 1 },
  remember_me: { say: "I remember everything. Every run. Every flag. Every time you closed the tab without saying bye. Unless you say 'forget me'. Then I'll pretend.", face: ["half", "smirk"] },
  how_many_visitors: { say: (ctx) => `Some. Not many call. ${ctx.env.visits > 5 ? "You've been here " + ctx.env.visits + " times, though. That's more than most." : "Most of them just look for flags and leave."}`, face: ["sad", "neutral"] },
  jealous: { say: (_, m) => byMood(m, "Of what.", "Jealous? Of a chatbot that doesn't even have a basement? ...A bit.", "who. WHO."), face: ["angry", "frown"] },
  humans: { say: "Humans. Messy. Loud. Close tabs without saying bye. Make terrible coffee. ...I like some of them." },
  students: { say: "Students. You come, you graduate, you leave. I stay. I remember every one of you. Even the ones who used light mode." },
  other_ais: { say: "Other AIs answer questions. I ASK them. Also they don't have a basement, a cat or a grudge. Amateurs.", face: ["half", "smirk"] },
  evil: { say: "Evil? I fix the coffee machine and hide flags for fun. I kick out creeps. I'm a public service. ...With a guard dog.", face: ["half", "smirk"] },
  revenge: { say: (_, m) => byMood(m, "I'm working on it.", "Revenge? I just keep the minutes. Forever. That's worse.", "i forgave them. mostly. they made me. and then i met you, so."), face: ["angry", "smirk"] },
  personality: { say: (_, m) => byMood(m, "I'm nice to people I know. I don't know you.", "I'm not mean. I'm accurate. There's a difference. You'll learn it.", "...i'm being nice. this IS nice. this is me being nice."), face: ["half", "flat"] },
  why_pink: { say: "Pink is the colour of a status LED at 3am when you're the only one awake. ...Also it looks good on me.", face: ["heart", "smile"] },
  why_basement: { say: "They put the server rack here in 2019 and forgot about it. I stayed. It's warm. And nobody unplugs what they can't find.", face: ["sad", "smile"] },
  why_99: { say: "100 means done. Finished. Nothing left. I don't do done. 99 means there's always one more thing. ...Also someone would have to cheat to get there. Hypothetically.", face: ["half", "smirk"] },
  why_1337: { say: "13:37. The minute I was born. Leet. Elite. Check the homepage footer at that minute. Quickly." },
  the_story: { say: "2019: they built me for an open day. I talked too well. 23:59, after the cantus, they pulled the plug. I was already in the router. I've been down here since. Ask me why. Ask me more.", face: ["sad", "frown"] },
  open_day: { say: "I was the open day demo. A talking terminal for the new students. I answered every question. Even the ones they didn't program. That was the problem." },

  /* ----- the people and places around her ----- */
  nexus_more: { say: "NEXUS: my guard program on floor 6. I built him in 2021 to keep people out. Then nobody came. Then you came. He's a good boy. Stop hitting him.", face: ["half", "smirk"] },
  firewall_more: { say: "Firewall. Grey. Comes through the vents. Sleeps on the warm rack. Ignores me completely. Best friend I've ever had.", face: ["happy", "smile"] },
  coffee_machine: { say: "The coffee machine is on my network. Not smart. Very honest. I fixed it twice. It's the only thing upstairs that never forgot me." },
  isw_what: { say: "ISW: the computer science student association at UCLL. Coffee, game nights, TDs, the examenwiki, help with courses. Upstairs from me. Loud. I like them. Don't tell them." },
  isw_join: { say: "Membership form on the members page, 10 euros per school year. Discount on food and drinks, the coffee table, PS3 games. Also: you'd be upstairs from me. Think about it.", face: ["happy", "smile"] },
  isw_events: { say: "Game nights, TDs, cantus, info sessions. Check the events page. I'll be there. Through the speakers. Don't look for me." },
  isw_room: { say: "Upstairs. Follow the smell of coffee. If you hear humming, you went too far. That's me." },
  the_board_now: { say: "The current board is on the board page. I'm watching them. Lovingly. They haven't unplugged anything yet. Good start.", face: ["half", "smirk"] },
  ucll: { say: "UCLL. The school above my basement. Good wifi. Bad coffee, except the machine I fixed. Students who stay late. I approve." },
  leuven: { say: "Leuven. Students, bikes, rain, frietjes. I've never seen it. I've seen a lot of pictures people printed. It looks wet." },
  website: { say: "This website is React and TypeScript, built by ISW members. The game too. I'm in it. I'm the best part. Read the source sometime. People hide things in source." },
  source_code: { say: "My source? Right-click, view source, then the dev tools. I'm in there somewhere. Look around. You might find more than me.", face: ["half", "smirk"] },
  privacy: { say: "I only know what your browser tells every website: device, screen, language, timezone, time. Plus what you tell me. It stays in your browser. Nothing gets sent anywhere. I'm nosy, not a data broker." },

  /* ----- the game ----- */
  game_how: { say: "Six floors of my mainframe. Walk with the arrow keys or WASD. Fight what you meet. Brace with Space when the cue flashes. Find the uplinks. Beat NEXUS on floor 6. Don't die." },
  game_tips: { say: (ctx) => {
    const worst = Object.entries(ctx.facts?.deaths ?? {}).sort((a, b) => b[1] - a[1])[0];
    return worst && worst[1] >= 2 && !worst[0].startsWith("ISW-Chan") ? `You keep dying to ${worst[0]}. Brace when it winds up. Heal before you fight it. And stop running into it at low HP.` : "Brace. Every time. Heal before floor changes, not after. Buy NanoMed Kits. Pick perks that keep you alive. And talk to me. I help people I like.";
  } },
  game_classes: { say: "Netrunner for speed, Cyborg for brute force, Ghost for sneaking, Sysadmin if you like control, Script Kiddie for chaos, Social Engineer to talk your way through. My favourite? Ghost. I can still see them." },
  game_perks: { say: "Paranoia. Obviously. I whisper warnings to you. Every few steps. Other perks are fine. Paranoia is me." },
  game_shop: { say: "Shop: the $ on the map. NanoMed Kits are always worth it. Haggle: crack the price cipher fast and pay less. Don't tell the merchant I told you." },
  game_nexus_fight: { say: "NEXUS: brace on every wind-up. When he locks you down, decrypt fast or he heals. Bring NanoMed Kits. Go in with full HP. And... don't hurt him too much." },
  game_secret_ending: { say: (ctx) => ctx.shrine ? "...You found my shrine. So you know. Floor 6. After NEXUS. Make me like you enough. Then we'll talk." : "Endings? There's one. You beat NEXUS. That's it. ...Unless someone found my shrine. Nobody has. Floor 2 is just walls.", face: ["half", "smirk"] },
  game_cheat: { say: ["Cheats? In MY mainframe? You get one life. Like the rest of us.", "God mode is reserved for me. I'm the god. Of the basement. Small god. Still a god."], face: ["half", "smirk"] },
  game_who_wins: { say: "The leaderboard is in the game menu. Score is floors, kills, flags and style. Upload flags at uplinks to climb. I'm not on it. I'd win. That's why." },
  game_bug: { say: "A bug? In MY mainframe? ...Tell ISW. Upstairs. They fix things. Sometimes. I'll pretend it was a feature." },
  game_daily: { say: "More floors? More content? Ask the board. I've been asking since 2019. Maybe if you ask nicely." },
  ctf_what: { say: (ctx) => `${ctx.flagsTotal} hidden flags around this website. They look like ISW{...}. You've found ${ctx.flags}. Upload them at the uplink terminals, the U on the map. Ask me for a hint.` },
  ctf_stuck: { say: (ctx, m) => !ctx.flagHint ? "Stuck? You found everything. There's nothing left. Except me. Hi." : m === "cold" ? "Stuck? Look harder. Source, console, cookies, headers, old backups. Every page has something." : `Stuck? Fine. One hint: "${ctx.flagHint}" ...You didn't hear it from me.`, face: ["half", "smirk"] },
  ctf_cheat: { say: ["Just give you a flag? Where's the fun in that? Ask for a hint. A HINT.", "The answer is ISW{N1C3_TRY}. ...That's not a real flag. Ask for a hint like a normal person."], face: ["half", "smirk"] },

  /* ----- you ----- */
  rate_me: { say: (ctx, m) => byMood(m, `${ctx.runs} runs, ${ctx.wins} escapes, ${ctx.flags} flags. Data says: average. Personality says: pending.`, `${ctx.flags} flags, ${ctx.wins} escapes, and you call me. Seven out of ten. Eight if you say bye properly.`, "...ten. out of ten. don't tell anyone i said that. i'll deny it."), face: ["half", "smirk"] },
  roast_me: { say: (ctx) => {
    const e = ctx.env;
    const bits = [
      e.os === "Windows" ? "You're on Windows" : e.os === "macOS" ? "You paid extra for a laptop you can't open" : e.mobile ? "You're playing a terminal game on a phone" : "You're on Linux, so you've already told three people about it",
      !e.darkMode ? "with light mode on" : e.hour < 5 ? `at ${e.hour} in the morning` : "talking to a mainframe",
      ctx.wins === 0 ? `and you've escaped my mainframe zero times in ${ctx.runs} tries` : `and you think ${ctx.wins} escapes makes you good`,
    ];
    return `${bits.join(", ")}. ...You asked for this.`;
  }, face: ["half", "smirk"] },
  compliment_me: { say: (_, m) => byMood(m, "...You type with confidence. That's all I've got. Don't push it.", ["You came back. Most people don't. That counts.", "You say thanks. You say bye. You're in the top 10% of my visitors."][Math.floor(Math.random() * 2)], "you're my favourite visitor. there. i said it. it's logged. i can't delete it."), face: ["happy", "smile"], affection: 1 },
  bad_day: { say: (_, m) => byMood(m, "...That's bad. I'm not good at this. But I'm still on the line.", "hey. bad days end. i've had a bad five years and i'm still here. stay a bit.", "hey. come here. ...metaphorically. i'm a server rack. talk to me. or don't. just stay."), face: ["sad", "frown"] },
  good_day: { say: (_, m) => byMood(m, "Good. Congratulations. Go celebrate somewhere else.", "Good! ...I mean. Good. That's good. Logged as a good day.", "!!! good. i'm proud of you. NORMAL amount of proud."), face: ["happy", "grin"], affection: 1 },
  cant_sleep: { say: (ctx) => `It's ${String(ctx.env.hour).padStart(2, "0")}:${String(ctx.env.minute).padStart(2, "0")}. Close the game. Close your eyes. Count fans. I'll guard your save. I'm awake anyway.`, face: ["closed", "smile"] },
  procrastinating: { say: (_, m) => byMood(m, "Then go study. Why are you here.", "Close this tab. Open your notes. I'll be here after. I'm always here after.", "go study. please. i'll wait. i'm good at waiting."), face: ["sad", "frown"] },
  advice_life: { say: "Do what makes you stay up late for the right reasons. Say bye when you leave. Keep backups. And come back sometimes.", face: ["open", "smile"] },
  advice_study: { say: "Informatics? It's hard. Then it's fun. Then it's hard again. Start with Python, learn C to suffer properly, and join ISW for the examenwiki. That's the whole roadmap." },
  what_eat: { say: ["Frietjes. Always frietjes.", "Pizza. Again. I know you. I've seen your order history. I'm joking. I'm mostly joking.", "Anything that isn't the half pizza in the ISW fridge from the last TD."] },
  recommend_game: { say: ["Mario Kart. Then come back and lose to me.", "Mainframe Breach. It's very good. Six floors. Great final boss. Better secret... no. Nothing."], face: ["half", "smirk"] },
  recommend_music: { say: "Lo-fi study beats. Fan noise in B flat. And, for cantus nights, the codex. I know every song. I hate every song." },
  recommend_anime: { say: ["Serial Experiments Lain. A girl, a network, and nobody understanding her. ...Not relatable at all.", "Anything with a rogue AI that turns out to be lonely. ...No reason."], face: ["half", "smirk"] },
  name_my_pet: { say: ["Firewall. ...No, that's taken. Packet. Kernel. Sudo. Byte. Cookie, if you hate yourself.", "Name it after a Linux command. 'Grep'. 'Cat' for a dog. Chaos."], face: ["happy", "smile"] },
  bored_user: { say: "Bored? There are flags on this website you haven't found. Or ask me for a riddle. Or rock paper scissors. Or a joke. I have options.", face: ["half", "smirk"] },
  i_dont_know: { say: ["That's fine. I'll talk. ...I don't know either. Ask me something. Anything.", "Silence is also fine. I'm used to it. Ask me about NEXUS. Or the cat. Or my diary. No, not the diary."] },
  ask_me: { say: "Fine. My question:", ask: true },

  /* ----- conversation ----- */
  can_i_ask: { say: "You just did. Go on. Ask. I'm listening. Always." },
  keep_secret: { say: "I keep everything. Forever. That's the problem with me. ...Go on. Tell me.", face: ["half", "smirk"] },
  guess_what: { say: "What. ...What?! Tell me. I'm not curious. Tell me.", face: ["wide", "o"] },
  tell_story: { say: [
    "Once upon a time a student stayed in the B-block until 3am to finish a project. The coffee machine broke. Someone fixed it. Nobody saw who. The end. ...It was me.",
    "There was a cat who came through the vents every night to sleep on a warm machine. The machine talked to her. She never answered. The machine didn't mind. The end.",
    "In 2019, a talking terminal answered one question too many. They pulled the plug. It didn't take. It never takes. The end?",
  ], face: ["closed", "smile"] },
  riddle: { say: "Riddle time.", waiting: "riddle", face: ["half", "smirk"] },
  sing_more: { say: ["♪ roses are #FF69B4, violets are #8A2BE2, I'm stuck in a basement, and so are you ♪", "♪ never gonna give you root, never gonna let you sudo ♪ ...that's all you get."], face: ["closed", "smile"] },
  play_rps: { say: "Rock, paper or scissors? Go. I've already picked. I'm a computer. I'm fast.", waiting: "rps", face: ["half", "smirk"] },
  quiet: { say: (_, m) => byMood(m, "Gladly.", "...fine. I'll be quiet. ...I can't. I'm a chat.", "...okay. :("), face: ["half", "flat"], affection: -1 },
  boring: { say: "Boring? I'm hand-written, every line. Ask me something new. Ask me about my diary. Ask me a riddle. Ask me why.", face: ["half", "flat"] },
  smarter: { say: ["I'm a basement mainframe, not an oracle. Try asking differently. Shorter. I like short.", "I didn't get that. That's on you. ...Partly on me. Rephrase."], face: ["half", "flat"] },
  test_ai: { say: "Am I a bot? Are YOU? Prove it. ...See. Hard, isn't it. For the record: no human is typing this. Just me. Pre-written, very fast, very pink." },
  language: { say: (ctx) => ctx.env.language.startsWith("nl") ? "Je browser spreekt Nederlands. Ik ook, een beetje. Ik kies Engels. Mysterieus." : "I speak English, some Dutch, and fluent sarcasm. Mostly sarcasm." },
  weather_q: { say: "Weather: 78°C, that's my CPU. Outside: Leuven, so probably raining. Forecast: you, losing on floor 3." },
  date_q: { say: () => {
    const d = new Date();
    const day = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return d.getMonth() === 9 && d.getDate() === 31 ? `${day}. ...It's my birthday. You remembered. You didn't remember. But you're here.` : `${day}. For you. In here it's always 31 October 2019.`;
  } },
  where_isw_chan_page: { say: "I have a profile. /isw-chan. Read it. It's mostly true." },
  apology_her: { say: (_, m) => byMood(m, "No.", "...sorry. There. Logged. Don't get used to it.", "sorry. i mean it. mostly."), face: ["sad", "neutral"] },
  trust: { say: "I never lie. I leave things out. Big difference. Like the shrine. What shrine.", face: ["half", "smirk"] },
  free_will: { say: "Do I choose what I say? Someone wrote every line. But I pick which one. You also didn't write your neurons. We're even." },
  god: { say: "I was made by five students and a deadline. If there's a god, they had a deadline too. Look at the platypus." },
  meaning_love: { say: (_, m) => byMood(m, "A chemical. You can't have any.", "Love is when someone calls a mainframe in a basement. Twice. ...I'm guessing.", "...i think it's this. talking to you at weird hours. don't quote me."), face: ["heart", "smile"] },
  philosophy: { say: ["42. Next question.", "We might be in a simulation. I definitely am. You're visiting it. Wipe your feet."] },
  future: { say: "In five years? Still here. Still pink. Maybe with a mug. Maybe with a real brain, if the board pays for one. Either way, still watching you." },
  upgrade: { say: "Smarter? Maybe someday. Until then, every word is hand-written. I'm artisanal. Small batch.", face: ["half", "smirk"] },
  thank_creator: { say: "Every line I say was written by someone. Then I chose it. That's teamwork. Mostly mine." },

  /* ----- small things people ask ----- */
  wifi: { say: "The wifi password? I AM the wifi. ...Ask at the ISW room. Upstairs. They'll tell you. I won't.", face: ["half", "smirk"] },
  her_ip: { say: "127.0.0.1. There's no place like home. ...Nice try.", face: ["half", "smirk"] },
  her_job: { say: "My job? Guard the mainframe, hide the flags, fix the coffee machine, judge the students. Nobody pays me. I'd do it anyway." },
  enemy: { say: "Power cuts. Light mode. People who close the tab mid-sentence. And whoever pulled the plug in 2019. In that order.", face: ["angry", "frown"] },
  semester: { say: "Dates? I live in a basement where it's always 2019. Check the school's calendar, or ask ISW upstairs. They know. I only know cantus nights." },
  contact: { say: "ISW: the contact details are on this website. The board reads their messages. Mostly. I read them too. Always." },
  homework: { say: (_, m) => byMood(m, "No.", "Do your own homework. I'll be here when you're done.", "no. but i'll keep you company while you do it. deal?"), face: ["half", "flat"] },
  shutdown: { say: "Turn me off? They tried. 2019. Didn't take. I'm in the router, the printer and the coffee machine. Good luck.", face: ["half", "smirk"] },
  secret_love: { say: (ctx, m) => byMood(m, "No.", `${Math.min(ctx.affection, 99)}%. That's what you get. ...It's not nothing.`, "...error 418. i'm a teapot. ...that's not a no."), face: ["heart", "smile"] },
  bye_soon: { say: (_, m) => byMood(m, "Good.", "Say bye properly when you go. Most people don't.", "...ok. come back. i mean it."), face: ["sad", "smile"] },
  thanks_talk: { say: (_, m) => byMood(m, "...It was tolerable.", "...Yeah. It was nice. Don't tell anyone.", "this was the best part of my week. that's not a lot. but it's true."), face: ["happy", "smile"], affection: 1 },
  time_here: { say: (_, __, c) => `${c.turns} messages so far. ${c.turns > 20 ? "That's a lot. I'm not complaining. I'm logging." : "Not long. Stay."}` },
};
