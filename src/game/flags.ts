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
];

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
