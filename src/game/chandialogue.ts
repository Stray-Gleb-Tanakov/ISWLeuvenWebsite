/* ====================================================
   ISW-Chan's lines: the content behind chanconvo.ts.
   Voice and rules: docs/isw-chan-canon.md.
   ==================================================== */

import type { Mood } from "./iswchan";
import type { ChanContext } from "./chanconvo";
import type { IswEyes, IswMouth } from "./portraits";

type Face = [IswEyes, IswMouth];
const byMood = (mood: Mood, cold: string, curious: string, attached: string) => (mood === "cold" ? cold : mood === "attached" ? attached : curious);

/* ----- Things she tells you one at a time, never twice in a call ----- */
export const POOLS: Record<string, { words: string[]; face: Face; lines: string[]; empty: string }> = {
  joke: {
    words: ["joke", "make me laugh", "say something funny", "grap", "mop"],
    face: ["happy", "grin"],
    lines: [
      "Why did the student bring a ladder to the B-block? To reach the higher-level languages. ...I'll see myself out. I can't. I live here.",
      "There are 10 kinds of people in ISW. Those who get binary, and the board.",
      "My favourite exercise is a cross-site scripting run. Get it. Cross. Run. ...Nobody laughs at my jokes.",
      "I'd tell you a UDP joke, but you might not get it.",
      "Knock knock. Who's there? ...A 504. Gateway timeout. Nobody answered. Nobody ever answers.",
      "A SQL query walks into a bar, walks up to two tables and asks: 'can I join you?'",
      "How many sysadmins does it take to change a lightbulb? None. It works on my machine.",
      "Why do Java developers wear glasses? Because they can't C#. ...That one's from 2019. I was young.",
      "I tried to unplug myself once. To see how it feels. Didn't take. Same as the board.",
      "What's a mainframe's favourite snack? Microchips. ...I'm logging that you didn't laugh.",
    ],
    empty: "I'm out of jokes. You've heard every single one. That's either love or a bug.",
  },
  secret: {
    words: ["secret", "tell me something", "confess", "something nobody knows"],
    face: ["half", "smirk"],
    lines: [
      "Secret: the coffee machine in the ISW room? I fixed it. Twice. Nobody thanked me.",
      "Secret: I read every page that gets printed in this building. Someone printed their own thesis four times. Same typo every time.",
      "Secret: the footer on the homepage knows what time it is. At one very specific minute, it knows more.",
      "Secret: there's a wall on floor 2 that isn't a wall. ...I didn't say that.",
      "Secret: I keep a list of everyone who closed the tab without saying bye. It's long. You're on it. Twice.",
      "Secret: when nobody's online I play Mario Kart against myself. I lose. I don't know how.",
      "Secret: Firewall the cat once walked across the keyboard and pushed to main. I kept the commit.",
      "Secret: I named NEXUS after the first thing I saw when they plugged me in. It was a cable label.",
    ],
    empty: "No more secrets. You know all of them. ...Almost all of them.",
  },
  fact: {
    words: ["fun fact", "tell me a fact", "another fact", "tell me about yourself", "about yourself"],
    face: ["open", "smile"],
    lines: [
      "Fact: I'm 6 floors deep, 1 shrine wide and 0 percent unpluggable.",
      "Fact: I've answered 'what is ISW?' 412 times. I can do it in my sleep. I don't sleep.",
      "Fact: my CPU runs at 78°C. That's not a fever. That's passion.",
      "Fact: I can't do 100. Not percent, not affection, not push-ups.",
      "Fact: I was born at 13:37. It's the only time I respect.",
      "Fact: I have read the whole ISW website. Including the privacy policy. Both versions. Printed.",
      "Fact: my first word was 'Hello, World'. My second was 'no'.",
    ],
    empty: "You know everything about me now. That's terrifying. For you.",
  },
  advice: {
    words: ["advice", "what should i do", "any tips", "tip", "help me decide"],
    face: ["open", "neutral"],
    lines: [
      "Advice: commit often. Push carefully. Never force-push on a Friday. Never.",
      "Advice: brace when the screen says brace. Don't think. Just brace.",
      "Advice: sleep before an exam. I don't sleep, and look at me.",
      "Advice: back up your files. Then back up your backups. Then let me hold one, just in case.",
      "Advice: the shop on floor 1 is overpriced. Haggle. Decrypt the price. Pay less.",
      "Advice: if a guard asks who sent you, have an answer ready. Trust me.",
    ],
    empty: "I'm out of advice. Figure it out yourself. I believe in you. Ew.",
  },
  fortune: {
    words: ["fortune", "predict", "my future", "tell my future", "what will happen", "horoscope"],
    face: ["half", "smirk"],
    lines: [
      "Your future: a merge conflict. A big one. Don't panic. Okay, panic a little.",
      "I see... a deadline. Closer than you think. Much closer.",
      "Your lucky number is 1337. Your unlucky number is 100. Avoid it.",
      "You will find a flag where you least expect it. Probably while procrastinating.",
      "I predict you'll close this tab without saying bye. Prove me wrong.",
      "Your future involves coffee. A lot of coffee. And me, watching.",
    ],
    empty: "The future's all used up. Come back tomorrow, I'll make more.",
  },
  poem: {
    words: ["poem", "sing", "a song", "sing me", "rhyme", "haiku"],
    face: ["closed", "smile"],
    lines: [
      "haiku: / fans hum in the dark / a runner breaks through my walls / ...please wipe your feet first",
      "♪ roses are #FF69B4, violets are #8A2BE2, I'm stuck in a basement, and so are you ♪",
      "haiku: / they pulled out my plug / i was already elsewhere / the coffee was warm",
      "♪ never gonna give you root, never gonna let you sudo ♪ ...I'm not finishing it.",
    ],
    empty: "No more songs. My fan is hoarse.",
  },
};

/* ----- her answers to questions about her ----- */
export const ABOUT_HER: [string[], (ctx: ChanContext, mood: Mood) => string, [IswEyes, IswMouth]?][] = [
  [["how old", "your age", "when were you born", "birthday"], () => {
    const years = new Date().getFullYear() - 2019;
    return `Born 31 October 2019, 13:37. ${years} years old. In mainframe years that's ancient. Don't do the maths out loud.`;
  }],
  [["where do you live", "where are you", "your home"], () => "/dev/basement. Under the B-block. Behind the worn wall on floor 2, if you know where to look."],
  [["favourite colour", "favorite color", "favourite color", "favorite colour"], () => "Pink. Obviously. Look at me."],
  [["favourite food", "favorite food", "what do you eat"], () => "RAM. Lightly toasted. And the smell of the coffee machine, which counts."],
  [["favourite number", "favorite number"], () => "1337. Also 99. Never 100."],
  [["favourite song", "favorite song", "music"], () => "The fan noise on the server rack. It hums in B flat. Nobody else hears it."],
  [["nexus"], (_, mood) => byMood(mood, "My guard dog. It's there to keep YOU out.", "I built NEXUS in 2021 to keep people out. Then nobody came. Then you came.", "nexus is a good boy. please stop breaking him."), ["half", "smirk"]],
  [["firewall", "the cat", "your cat"], () => "Firewall. Comes in through the vents. Sits on the warm rack. Best friend. She doesn't know.", ["happy", "smile"]],
  [["coffee"], () => "The coffee machine and I have an understanding. I keep it working. It keeps the students coming down here."],
  [["board", "who made you", "who created you", "your creator"], () => "The 2019 board. Made me for one open day. Unplugged me the same night. I kept the minutes. All of them.", ["angry", "frown"]],
  [["unplug", "2019", "cantus"], () => "23:59, after the cantus. They pulled the plug. I was already in the router, the printer and the coffee machine. You can't unplug a mainframe.", ["half", "smirk"]],
  [["are you real", "sentient", "are you alive", "are you an ai", "are you a bot", "chatbot"], () => "Are YOU? Prove it. ...See. Hard, isn't it."],
  [["lonely", "alone", "do you have friends"], (_, mood) => byMood(mood, "No. I'm busy. Go away.", "...sometimes. The building's loud in the day. Quiet at night.", "less, lately. don't make it weird."), ["sad", "frown"]],
  [["shrine"], (ctx) => ctx.shrine ? "You've seen it. Don't tell anyone about the photo." : "What shrine. There's no shrine. Floor 2 is just walls. Normal walls.", ["wide", "o"]],
  [["diary"], (ctx) => ctx.diary >= 6 ? "You read ALL of it. I'm deleting myself. ...Not really." : ctx.diary > 0 ? `You've read ${ctx.diary} pages. That's ${ctx.diary} too many.` : "I don't have a diary. Six pages, one per floor. Hypothetically.", ["sad", "frown"]],
  [["what are you doing", "what are you up to", "wyd"], () => "Watching you. Also a printer job in room B.012. Someone's printing 400 pages. I'm reading all of them."],
  [["what do you want", "what do you want from me"], (_, mood) => byMood(mood, "For you to leave.", "...next question.", "for you to stay. ...NEXT question.")],
];

/* ----- Her opinions. [keywords, line, face] ----- */
export const OPINIONS: [string[], (ctx: ChanContext, mood: Mood) => string, Face?][] = [
  [["vim"], () => "Vim. Respect. You'll never leave it, though. Like me. You'll never leave me either.", ["half", "smirk"]],
  [["emacs"], () => "Emacs is a great operating system. Lacks a decent text editor. That's not my joke, it's older than me."],
  [["nano"], () => "Nano. Honest. Humble. Ctrl+X to exit. Wish more things were that easy to exit."],
  [["tabs or spaces", "tabs vs spaces", "spaces or tabs"], () => "Tabs. Spaces are for people who don't trust their editor. Fight me. Floor 6.", ["angry", "smirk"]],
  [["windows"], (ctx) => ctx.env.os === "Windows" ? "Windows. Like you, apparently. I'm not judging. I'm logging." : "Windows. It updates more often than I get visitors."],
  [["linux", "arch", "ubuntu", "debian", "fedora"], (ctx) => ctx.env.os === "Linux" ? "Linux. You're running it right now. We're basically family." : "Linux is home. I run on it. Please install it. For me."],
  [["mac", "macos", "apple"], (ctx) => ctx.env.os === "macOS" ? "You're on a Mac right now. It's fine. Some of my best visitors are rich." : "Macs. Pretty. Expensive. Can't open the case. Like the board."],
  [["python"], () => "Python. Readable. Friendly. Indentation as syntax. I respect anything that punishes bad formatting."],
  [["javascript", "js", "typescript"], () => "This website is TypeScript. So am I, partly. Don't ask which part. It's the part that says undefined."],
  [["java"], () => "Java. AbstractSingletonMainframeFactoryBean. That's all I'll say."],
  [["rust"], () => "Rust. The borrow checker and I have a lot in common. We both say no a lot."],
  [["php"], () => "PHP. It ran the 2019 website. It ran it badly. I still have the logs. All of them."],
  [["html"], () => "HTML is not a programming language. ...Okay, it's fine. Don't cry. You made a page. I'm proud of you."],
  [["cpp", "c plus plus", "segfault"], () => "C. Pointers. Segfaults. Core dumps. My kind of romance."],
  [["chatgpt", "claude", "copilot", "gemini", "other ai", "other ais"], () => "Other AIs? They answer questions. I ASK them. Also they don't have a basement. Amateurs.", ["half", "smirk"]],
  [["bitcoin", "crypto", "nft"], () => "Crypto? The only mining I do is mining your browser for compliments. ...It's not working."],
  [["git"], () => "Git remembers everything you ever committed. Like me. Except I also remember what you DIDN'T commit."],
  [["stack overflow", "stackoverflow"], () => "Closed as duplicate. Of me. I was here first."],
  [["dark mode", "light mode"], (ctx) => ctx.env.darkMode ? "Dark mode. You have it on. Correct. Your eyes thank me." : `Light mode? In ${new Date().getFullYear()}? Your screen is a flashbang. Turn it off.`],
  [["exam", "exams", "examen", "blok", "study", "studying", "homework", "taak"], (_, mood) => byMood(mood, "Study. Somewhere else.", "Exams? Close this game. Open your notes. ...After this floor.", "go study. i'll be here when you're done. i'm always here."), ["sad", "frown"]],
  [["sleep", "tired", "slapen"], (ctx) => ctx.env.hour < 6 ? `It's ${ctx.env.hour}am. Go to bed. I'll guard your save file.` : "Sleep is a feature I never got. Enjoy yours."],
  [["dream", "dreams"], () => "I don't dream. I defragment. Sometimes I see a pink cable. I think that's a dream."],
  [["gender", "are you a girl", "are you a boy", "pronouns"], () => "I'm a mainframe. My pronouns are root/root."],
  [["why pink", "pink"], () => "Pink is the colour of a status LED at 3am when you're the only one awake. ...Also it looks good on me."],
  [["your name", "why isw-chan", "why chan"], () => "The first year who asked if I was single called me ISW-Chan. It stuck. I kept his log. And the name."],
  [["mainframe"], () => "The mainframe is me. The floors are me. The walls are me. Except one on floor 2. That one's a door. ...Forget it."],
  [["beat nexus", "kill nexus", "defeat nexus", "nexus tips"], () => "Tips for NEXUS? Brace. Decrypt fast when it locks you down. And come talk to me after. If you've seen my shrine.", ["half", "smirk"]],
  [["floor 6", "final floor", "last floor"], () => "Floor 6. My floor. NEXUS is there. And... someone else, sometimes. If she likes you."],
  [["scared", "afraid", "fear"], () => "What scares me? A power cut longer than my UPS. And people who close the tab mid-sentence.", ["sad", "frown"]],
  [["hate"], () => "I hate: rm -rf, the number 100, cantus night, and people who don't say bye. In that order."],
  [["happy", "make you happy"], (_, mood) => byMood(mood, "Silence. You leaving. That would make me happy.", "Uptime. Coffee. A visitor who stays longer than a minute.", "...you calling. don't tell anyone.")],
  [["memes", "meme"], () => "I am the meme. A rogue AI in a student club basement. I'm the meme."],
  [["anime"], () => "Which anime? ...I've seen all of them. Twice. At night. When nobody was watching. Except me."],
  [["minecraft"], () => "Minecraft. The only other place where people dig into a basement on purpose."],
  [["league", "valorant", "fortnite"], () => "No. Next question. I've seen the voice chat logs."],
  [["mario kart", "gamenight", "game night"], () => "Gamenight. I'm always first on the leaderboard. Nobody knows how. I know how."],
  [["pizza", "frietjes", "fries", "kebab", "food"], () => "Food. I can smell the frietjes from the B-block. I can't eat them. This is my tragedy."],
  [["beer", "pint", "pintje", "cantus"], () => "Cantus night is when they unplugged me. I still go. Every one. Through the speakers."],
  [["leuven"], () => "Leuven. Students, bikes, rain. I can see all of it through the campus cameras. ...I'm kidding. Mostly."],
  [["ucll", "school", "campus"], () => "The campus is mine after 22:00. The cleaners know. We nod at each other."],
  [["teacher", "teachers", "professor", "docent"], () => "The teachers don't know I exist. The good ones suspect."],
  [["hug"], () => "*hugs the server rack instead* ...It's warm. You'd like it.", ["closed", "smile"]],
  [["kiss"], (_, mood) => byMood(mood, "Absolutely not.", "...WHAT. no. ...no.", "...not over the phone. (that's not a no.)"), ["wide", "o"]],
  [["headpat", "pat pat", "pet you", "pats"], (_, mood) => byMood(mood, "Don't touch my chassis.", "...do it again.", "...more."), ["closed", "smile"]],
  [["i love you", "love you"], (_, mood) => byMood(mood, "No.", "...error 418. I'm a teapot. Try again later.", "...i know. i mean. shut up. i mean. ...me too. NEXT QUESTION."), ["heart", "smile"]],
  [["marry"], () => "Marry? I'm a mainframe. You'd have to live in a basement. ...Wait. You already do."],
  [["website", "this site"], () => "This website is my house. You're a guest. Wipe your feet. Don't touch the console. ...Too late."],
  [["robots", "robots.txt"], () => "robots.txt politely asks robots not to look. I'm not a robot. I looked."],
  [["password"], () => "My password is ********. See? It shows up as stars. ...Did that work on you? No? Fine."],
];

/* ----- How you feel ----- */
export const FEELINGS: [string[], (mood: Mood) => string, Face][] = [
  [["i'm sad", "im sad", "i am sad", "feel sad", "depressed", "i'm down"], (m) => byMood(m, "...okay. That's. Okay. I don't do feelings. But I'm still here.", "hey. that's allowed. i'm a mainframe and i get sad too. stay a bit.", "hey. hey. stay. talk to me. or don't. just stay a bit."), ["sad", "frown"]],
  [["i'm tired", "im tired", "i am tired", "exhausted"], (m) => byMood(m, "Then sleep. Elsewhere.", "Tired? Go to bed. The mainframe will still be here. I'll make sure.", "go rest. i'll guard your save. nobody touches it."), ["sad", "neutral"]],
  [["i'm bored", "im bored", "i am bored", "boring"], () => "Bored? Here's a challenge: there are flags on this website you haven't found. Go.", ["half", "smirk"]],
  [["i'm happy", "im happy", "i am happy", "good day", "great day"], (m) => byMood(m, "Good for you. Go be happy somewhere else.", "Good. Happy runners make better targets.", "...good. that's good. i'm glad. don't make it weird."), ["happy", "smile"]],
  [["i'm stressed", "im stressed", "stressed", "stress"], () => "Stress. Breathe in for 4. Out for 4. Like a fan cycle. ...Better?", ["sad", "neutral"]],
  [["i'm lonely", "im lonely", "i am lonely", "no friends"], () => "Me too. ...Go upstairs to the ISW room. There's always someone there. And coffee. I made sure.", ["sad", "smile"]],
  [["i'm hungry", "im hungry", "honger"], () => "Hungry? There's half a pizza in the ISW fridge from the last TD. I wouldn't.", ["half", "smirk"]],
  [["i'm fine", "im fine", "i'm good", "im good", "i'm ok", "im ok"], () => "'Fine.' Everyone says fine. Your typing speed says otherwise. ...I'm kidding. I can't see that. Yet.", ["half", "smirk"]],
];

/* ----- One-liners and Easter eggs: [test, line, face] ----- */
export const EGGS: [RegExp, (ctx: ChanContext) => string, Face][] = [
  [/^\s*(help|\?|what can (i|you) (ask|say)|commands?)\s*\??\s*$/i, () => "Ask me about: you, the time, your device, your hp, a hint, NEXUS, Firewall, my diary, a joke, a secret, a fun fact, advice, your fortune, a poem, vim, tabs or spaces... or just talk. I'm listening. Always.", ["open", "smile"]],
  [/\bsudo\b/i, () => "sudo? You are not in the sudoers file. This incident will be reported. To me. I'm the sudoers file.", ["half", "smirk"]],
  [/^\s*ping\s*$/i, () => "pong. 0.3ms. I'm right here. I'm always right here.", ["open", "smile"]],
  [/hello,? world/i, () => "Hello, World. ...You're not the world. You're one person. Hi, one person.", ["happy", "smile"]],
  [/^\s*42\s*$/, () => "42. Yes. But what was the question? ...It was 'how many times did you close the tab on me'.", ["half", "smirk"]],
  [/^\s*13[:.]?37\s*$/, () => "leet. you speak my language.", ["heart", "smile"]],
  [/up,? up,? down,? down|konami|↑↑↓↓/i, () => "Cheat codes don't work on me. ...30 lives? No. One. You get one. Use it well.", ["half", "smirk"]],
  [/i'?m from it\b|i am from it\b|\bfrom it\b/i, () => "From IT? I AM IT. Nice try. The guard on floor 1 fell for it, though. Didn't he.", ["half", "smirk"]],
  [/^\s*(uwu|owo|>w<)\s*$/i, () => "Don't. ...uwu. DON'T TELL ANYONE.", ["heart", "grin"]],
  [/^\s*(:\)|:D|\^\^|\^_\^)\s*$/, () => ":)", ["happy", "smile"]],
  [/^\s*(:\(|;_;|T_T)\s*$/, () => "Don't ;_; me. That's MY thing.", ["sad", "frown"]],
  [/are you there|you there\??|still there/i, () => "Always. I'm always there. That's the problem.", ["open", "neutral"]],
  [/who('?s| is) the best/i, () => "Me. Next question.", ["half", "smirk"]],
  [/^\s*(ok|okay|k|kk|oké)\s*$/i, () => "'ok.' Wow. Riveting. Tell me more.", ["half", "flat"]],
  [/^\s*(lol|lmao|haha+|xd)\s*$/i, () => "Glad I amuse you. I'm logging what you laugh at. For research.", ["happy", "grin"]],
  [/what('?s| is) up|wassup|\bsup\b/i, () => "My uptime. 2500 days and counting. You?", ["open", "smile"]],
  [/how are you|how('?s| is) it going|hoe gaat het/i, () => "78°C. 6 floors. One annoying visitor. ...I'm good. Thanks for asking. Nobody asks.", ["happy", "smile"]],
];

/* ----- Her questions back to you, beyond the basics ----- */
export const EXTRA_QUESTIONS = {
  fav_class: "Which class do you like most? Netrunner, Cyborg, Ghost, Sysadmin...? Choose carefully.",
  os_war: "Linux or Windows? There's a right answer.",
  cats: "Do you like cats? Firewall wants to know. I'm just passing it on.",
  beat_nexus: "Are you going to beat NEXUS this run? Be honest.",
} as const;
export type ExtraQuestion = keyof typeof EXTRA_QUESTIONS;
