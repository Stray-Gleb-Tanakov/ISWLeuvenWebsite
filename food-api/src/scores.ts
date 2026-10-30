import { createHash } from "node:crypto";
import { Hono } from "hono";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "./db.ts";

// ---- Mainframe Breach leaderboard (/mainframe_breach) ----

// sha256 of the uppercased hidden site flags -> flag id. Keep in sync with src/game/flags.ts.
const FLAG_HASHES = new Map([
  ["8261aadbd667c485bcd8f7ac77fda73ed0397bf109c9cba1887a4190d6169156", "source"],
  ["d0670190ae61fa8ed283425980f7f059aeebf8312e82fe882c0121db5a146b22", "console"],
  ["00237443d3f0c90a1d546193e87b9f52ab9ac2a5f2a9350704f02aab4319360c", "robots"],
  ["f03090678010dca4f816015ce421c053adfef8ec0b8c68ef3d2e0358dc4055b9", "header"],
  ["97ad7c77062e795f768e3ff6471eba07b1f813866046b8784e8847f4e3532f50", "zerowidth"],
  ["b0300ef068febf6c2961a6f6e915e731bd1b4a8644da99fed1541bc87808e9f2", "lost"],
  ["753e951283d9d2f5b6dc61249176e64da3110fd1806edb7f508191f285288ea1", "cookie"],
  ["8ae6c6952091855c1305249dd043fbd171443a15787e11bf323bc8c47e3b79db", "token"],
  ["80be2a7eb0ffe8579a8bfe6f1d66ed77c16e7c1fba9cc81c86b40940f7a4d2b3", "spectro"],
  ["849a6c1af5df75dd33edae7a67ce3d0f9a2134eb70cdd10d1661e94375560e2b", "debug"],
  ["c515a3718fd9b0478e46bf8e5a395148c0140d0e70c23c067d26f0e0ba40dc1a", "timelock"],
  ["9a625f0b4b12739992a07b9452cf41745c7cfa28d9747844ef6a42950295ecc6", "git"],
  ["c862755f5159098c417fe55a3ebc04a929da08c230b8fd03abe895d1d5080eb0", "zip"],
  ["3365c80c80534d31c4e707e8ffe190665ff5d0f2fda114c6cfe5f03da4b2cdbb", "sourcemap"],
  ["46740c34a5bd5af362f28fe29e86734713a1a1fee59b749d39327093a61821db", "print"],
  ["32bbf3b1fa242a16e9b16224c4cb88e9e331de0d6893097fadc6e5e902980577", "morse"],
  ["40d22aa950e28d36929930d4339b4149a48ea8777a30821d9b57f6dd9dbdf0c4", "alttext"],
  ["fb527a04270a43e207cf84d4da9477e504a3d0d489f82e974558176b0cf33e17", "shrine"],
  ["3d1c6b6b0406c6eb18daa2802777d85a55bf9f6c4ace2e223452098abb697991", "memory"],
]);
// Badge id -> flag it needs ("all" = every flag). Keep in sync with src/game/cosmetics.ts.
const BADGES = new Set(["source", "console", "robots", "header", "zerowidth", "lost", "cookie", "token", "spectro", "debug", "timelock", "git", "zip", "sourcemap", "print", "morse", "alttext", "shrine", "memory", "all"]);
const FLAG_POINTS = 2500;
const SCORE_VERSION = 1; // bump together with SCORE_VERSION in src/game/score.ts when scoring changes
const MAX_GAME_SCORE = 80000; // comfortably above a perfect run
const CLASSES = new Set(["Netrunner", "Cyborg", "Ghost", "Sysadmin", "Script Kiddie"]); // talk-mode runs aren't ranked yet
const SUBMIT_COOLDOWN_MS = 20_000;

const lastSubmit = new Map<string, number>();

export const scores = new Hono();

scores.get("/", async (c) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT name, score, game_score AS gameScore, flags_found AS flagsFound, badge, floor,
            class_name AS className, won, created_at AS createdAt
     FROM game_scores WHERE version = ? ORDER BY score DESC, created_at ASC LIMIT 20`,
    [SCORE_VERSION],
  );
  c.header("Cache-Control", "public, max-age=10");
  return c.json(rows.map((r) => ({ ...r, won: Boolean(r.won) })));
});

scores.post("/", async (c) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  if (now - (lastSubmit.get(ip) ?? 0) < SUBMIT_COOLDOWN_MS) {
    return c.json({ error: "Slow down, runner. Try again in a few seconds." }, 429);
  }

  const body = await c.req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const { className, floor, won, gameScore, flags, version, badge } = body ?? {};

  if (version !== SCORE_VERSION) return c.json({ error: "The game was updated. Refresh the page to submit." }, 409);
  if (!/^[\w .-]{1,16}$/.test(name)) return c.json({ error: "Name: 1-16 letters, digits, spaces, . _ -" }, 400);
  if (!CLASSES.has(className)) return c.json({ error: "Unknown class" }, 400);
  if (!Number.isInteger(floor) || floor < 1 || floor > 6) return c.json({ error: "Invalid floor" }, 400);
  if (typeof won !== "boolean" || (won && floor !== 6)) return c.json({ error: "Invalid result" }, 400);
  if (!Number.isInteger(gameScore) || gameScore < 0 || gameScore > MAX_GAME_SCORE) return c.json({ error: "Invalid score" }, 400);
  if (!Array.isArray(flags) || flags.length > 40) return c.json({ error: "Invalid flags" }, 400);

  const found = new Set(
    flags
      .filter((f): f is string => typeof f === "string" && f.length <= 100)
      .map((f) => createHash("sha256").update(f.trim().toUpperCase()).digest("hex"))
      .filter((h) => FLAG_HASHES.has(h))
      .map((h) => FLAG_HASHES.get(h)!),
  );
  // A badge only counts if the flags behind it were submitted with this score
  const earned = badge === "all" ? found.size === FLAG_HASHES.size : found.has(badge);
  if (badge != null && (!BADGES.has(badge) || !earned)) return c.json({ error: "You haven't earned that badge." }, 400);
  const score = gameScore + found.size * FLAG_POINTS;

  lastSubmit.set(ip, now);
  await db.query<ResultSetHeader>(
    `INSERT INTO game_scores (version, name, class_name, floor, won, game_score, flags_found, badge, score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [SCORE_VERSION, name, className, floor, won, gameScore, found.size, badge ?? null, score],
  );
  const [[{ position }]] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) + 1 AS position FROM game_scores WHERE version = ? AND score > ?",
    [SCORE_VERSION, score],
  );
  return c.json({ score, flagsFound: found.size, rank: Number(position) }, 201);
});
