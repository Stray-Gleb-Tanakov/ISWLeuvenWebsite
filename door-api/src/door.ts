import { timingSafeEqual } from "node:crypto";
import { Hono } from "hono";

// ---- Door status (/lokaal) ----
// The door sensor Pi (ISW_Deursensor) POSTs its status here and sends a heartbeat every minute.
// State lives in memory only: after a restart the next heartbeat (<= 60 s) restores it.
// If the sensor goes quiet we fall back to reading its Discord channel with a bot, when one is configured.

const sensorToken = process.env.DOOR_SENSOR_TOKEN;
const botToken = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DOOR_CHANNEL_ID;
// Only trust messages from the sensor's webhook, not people chatting in the channel.
const webhookId = process.env.DOOR_WEBHOOK_ID ?? "1539571754626977792";
const DISCORD_CACHE_MS = 30_000;
// The Pi heartbeats every 60 s; a few missed ones means it's offline.
const SENSOR_STALE_MS = 180_000;

type Status = "open" | "closed";
type DoorStatus = { status: Status | "unknown"; since: string | null };
type DiscordMessage = { content: string; timestamp: string; webhook_id?: string };

const UNKNOWN: DoorStatus = { status: "unknown", since: null };

let sensor: { status: Status; changedAt: number; seenAt: number } | null = null;
let discordCache: { at: number; value: DoorStatus } | null = null;

// Matches the Pi's open_bericht / closed_bericht. Closed is checked first because
// "Deursensor is online." and similar messages contain neither word.
const parseStatus = (content: string): Status | null => {
  const text = content.toLowerCase();
  if (/\b(closed|gesloten|dicht)\b/.test(text)) return "closed";
  if (/\bopen\b/.test(text)) return "open";
  return null;
};

const fetchDiscordStatus = async (): Promise<DoorStatus> => {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=50`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!res.ok) throw new Error(`Discord messages request failed: ${res.status}`);

  // Discord returns newest first.
  const messages = (await res.json()) as DiscordMessage[];
  for (const msg of messages) {
    if (msg.webhook_id !== webhookId) continue;
    const status = parseStatus(msg.content);
    if (status) return { status, since: msg.timestamp };
  }
  return UNKNOWN;
};

const getDiscordStatus = async (): Promise<DoorStatus> => {
  if (!botToken || !channelId) return UNKNOWN;
  if (!discordCache || Date.now() - discordCache.at > DISCORD_CACHE_MS) {
    try {
      discordCache = { at: Date.now(), value: await fetchDiscordStatus() };
    } catch (err) {
      console.error(err);
      // Serve the last known status rather than nothing while Discord is unreachable.
      if (!discordCache) return UNKNOWN;
    }
  }
  return discordCache.value;
};

const tokenMatches = (given: string | undefined) => {
  if (!sensorToken || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(sensorToken);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const door = new Hono();

door.get("/", async (c) => {
  c.header("Cache-Control", "public, max-age=30");
  if (sensor && Date.now() - sensor.seenAt < SENSOR_STALE_MS) {
    return c.json({ status: sensor.status, since: new Date(sensor.changedAt).toISOString() });
  }
  return c.json(await getDiscordStatus());
});

// Called by the Pi on every confirmed change and as a heartbeat:
// { "status": "open" | "closed", "changedSecondsAgo": 42 }
// The Pi sends an age instead of a timestamp because its clock can be wrong right after boot (no RTC).
door.post("/", async (c) => {
  if (!sensorToken) return c.json({ error: "Door sensor not configured" }, 503);
  if (!tokenMatches(c.req.header("X-Door-Token"))) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => null);
  const status = body?.status;
  if (status !== "open" && status !== "closed") return c.json({ error: "status must be open or closed" }, 400);

  const now = Date.now();
  const age = Number(body?.changedSecondsAgo);
  // Same status as before: keep the original time, so a Pi restart doesn't reset "since".
  const changedAt =
    sensor && sensor.status === status ? sensor.changedAt : now - (Number.isFinite(age) && age > 0 ? age * 1000 : 0);
  sensor = { status, changedAt, seenAt: now };
  return c.json({ ok: true });
});
