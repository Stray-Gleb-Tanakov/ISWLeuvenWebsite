/* ====================================================
   Hidden site flags — found outside the game, submitted
   on the /mainframe_breach page for leaderboard points.
   Only SHA-256 hashes live here so the flags can't be
   grepped out of the bundle. Keep in sync with
   food-api/src/scores.ts.
   ==================================================== */

export interface HiddenFlag {
  id: string;
  title: string;
  hint: string;
  hash: string; // sha256 of the uppercased flag
}

export const FLAG_POINTS = 2500;

export const HIDDEN_FLAGS: HiddenFlag[] = [
  { id: "source", title: "View Source", hint: "Every page has a source. Some comments were never meant for you.", hash: "8261aadbd667c485bcd8f7ac77fda73ed0397bf109c9cba1887a4190d6169156" },
  { id: "console", title: "Console Cowboy", hint: "Developers keep their tools within reach. F12 is a good start.", hash: "d0670190ae61fa8ed283425980f7f059aeebf8312e82fe882c0121db5a146b22" },
  { id: "robots", title: "House Rules", hint: "Even robots get told where not to look.", hash: "00237443d3f0c90a1d546193e87b9f52ab9ac2a5f2a9350704f02aab4319360c" },
  { id: "header", title: "Small Talk", hint: "Servers say more than the page shows. Read the response, not the body.", hash: "f03090678010dca4f816015ce421c053adfef8ec0b8c68ef3d2e0358dc4055b9" },
  { id: "zerowidth", title: "Invisible Ink", hint: "Some words on /about weigh more than they look. Copy them somewhere honest.", hash: "97ad7c77062e795f768e3ff6471eba07b1f813866046b8784e8847f4e3532f50" },
  { id: "lost", title: "Lost & Found", hint: "Getting lost on this site isn't a dead end. The way back is in the mission.", hash: "b0300ef068febf6c2961a6f6e915e731bd1b4a8644da99fed1541bc87808e9f2" },
  { id: "cookie", title: "Cookie Monster", hint: "The site has an opinion about who you are. On /members, it might be wrong.", hash: "753e951283d9d2f5b6dc61249176e64da3110fd1806edb7f508191f285288ea1" },
  { id: "token", title: "Forged Papers", hint: "The board has a portal nobody is supposed to index. Your pass is just base64 with confidence.", hash: "8ae6c6952091855c1305249dd043fbd171443a15787e11bf323bc8c47e3b79db" },
  { id: "spectro", title: "Voicemail", hint: "ISW-Chan left a voicemail on /catgirls. It sounds awful. Maybe you're listening wrong.", hash: "80be2a7eb0ffe8579a8bfe6f1d66ed77c16e7c1fba9cc81c86b40940f7a4d2b3" },
  { id: "debug", title: "Dev Mode", hint: "The devs left themselves a way in. This uplink still listens for it — the game's own code remembers.", hash: "849a6c1af5df75dd33edae7a67ce3d0f9a2134eb70cdd10d1661e94375560e2b" },
  { id: "timelock", title: "Leet O'Clock", hint: "Elite hackers keep elite hours. The homepage footer knows what time it is.", hash: "c515a3718fd9b0478e46bf8e5a395148c0140d0e70c23c067d26f0e0ba40dc1a" },
  { id: "git", title: "Commit Archaeology", hint: "/old_backup kept more than a note. History is written by the committers, and they never really delete anything.", hash: "9a625f0b4b12739992a07b9452cf41745c7cfa28d9747844ef6a42950295ecc6" },
  { id: "zip", title: "Board Archive", hint: "The 2019 board archive is locked. The board always picks passwords it can't forget. Its history might remember.", hash: "c862755f5159098c417fe55a3ebc04a929da08c230b8fd03abe895d1d5080eb0" },
  { id: "sourcemap", title: "Legacy Code", hint: "Minified code forgets nothing. Ask your devtools for the map of the oldest script on the site.", hash: "3365c80c80534d31c4e707e8ffe190665ff5d0f2fda114c6cfe5f03da4b2cdbb" },
  { id: "print", title: "Paper Trail", hint: "Some documents are only complete on paper. Nobody reads a privacy policy... but who prints one?", hash: "46740c34a5bd5af362f28fe29e86734713a1a1fee59b749d39327093a61821db" },
  { id: "morse", title: "Come Back", hint: "ISW-Chan hates being left alone. Switch to another tab and watch hers. Wrap what she says in ISW{}.", hash: "32bbf3b1fa242a16e9b16224c4cb88e9e331de0d6893097fadc6e5e902980577" },
  { id: "alttext", title: "Director's Cut", hint: "Not everything on /catgirls is meant for your eyes. Screen readers get the director's cut.", hash: "40d22aa950e28d36929930d4339b4149a48ea8777a30821d9b57f6dd9dbdf0c4" },
  { id: "shrine", title: "The Shrine", hint: "ISW-Chan hid something of hers in the mainframe's walls. Not every wall is built the same.", hash: "fb527a04270a43e207cf84d4da9477e504a3d0d489f82e974558176b0cf33e17" },
  { id: "memory", title: "Her Memory", hint: "ISW-Chan remembers you between runs. She'll never like you enough. Unless you help her remember differently.", hash: "3d1c6b6b0406c6eb18daa2802777d85a55bf9f6c4ace2e223452098abb697991" },
];

/* Flags that a page reveals once its challenge is solved are stored XORed with
   the key the challenge produces (and base64'd), so they can't be grepped out. */
export function xorReveal(blob: string, key: string): string {
  const bytes = atob(blob);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function matchFlag(input: string): Promise<HiddenFlag | null> {
  const hash = await sha256Hex(input.trim().toUpperCase());
  return HIDDEN_FLAGS.find((f) => f.hash === hash) ?? null;
}

/* Book cipher over aboutMission (word.letter), shown on the 404 page.
   Regenerate if aboutMission changes — the flags test will fail if it no longer decodes. */
export const LOST_CIPHER = "1.1 11.8 28.4 '{' 45.5 7.4 22.1 24.10 '_' 53.4 7.11 '_' 7.8 29.4 53.7 '_' 10.1 56.2 49.4 37.4 18.3 53.5 50.2 25.1 '}'";

/* Zero-width steganography for /about: 8 bits per character,
   U+200B = 0, U+200C = 1, characters separated by U+200D */
export const ZERO_WIDTH_PAYLOAD = "\u200B\u200C\u200B\u200B\u200C\u200B\u200B\u200C\u200D\u200B\u200C\u200B\u200C\u200B\u200B\u200C\u200C\u200D\u200B\u200C\u200B\u200C\u200B\u200C\u200C\u200C\u200D\u200B\u200C\u200C\u200C\u200C\u200B\u200C\u200C\u200D\u200B\u200B\u200C\u200C\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200B\u200B\u200C\u200C\u200C\u200B\u200D\u200B\u200C\u200B\u200C\u200B\u200C\u200C\u200B\u200D\u200B\u200B\u200C\u200C\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200B\u200C\u200B\u200B\u200C\u200C\u200D\u200B\u200B\u200C\u200C\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200B\u200B\u200B\u200B\u200C\u200B\u200D\u200B\u200C\u200B\u200B\u200C\u200C\u200B\u200B\u200D\u200B\u200B\u200C\u200C\u200B\u200B\u200C\u200C\u200D\u200B\u200C\u200B\u200C\u200C\u200C\u200C\u200C\u200D\u200B\u200B\u200C\u200C\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200B\u200B\u200C\u200C\u200C\u200B\u200D\u200B\u200C\u200B\u200B\u200C\u200B\u200C\u200C\u200D\u200B\u200C\u200C\u200C\u200C\u200C\u200B\u200C";
