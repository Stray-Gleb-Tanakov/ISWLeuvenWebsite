import { Hono } from "hono";

// ---- Door status (/lokaal) ----
// The door sensor Pi (ISW_Deursensor) only posts to a Discord webhook. We read that
// channel back with a bot and take the newest open/closed message as the room status.

const botToken = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DOOR_CHANNEL_ID;
// Only trust messages from the sensor's webhook, not people chatting in the channel.
const webhookId = process.env.DOOR_WEBHOOK_ID ?? "1539571754626977792";
const CACHE_MS = 30_000;

type DoorStatus = { status: "open" | "closed" | "unknown"; since: string | null };
type DiscordMessage = { content: string; timestamp: string; webhook_id?: string };

let cached: { at: number; value: DoorStatus } | null = null;

// Matches the Pi's open_bericht / closed_bericht. Closed is checked first because
// "Deursensor is online." and similar messages contain neither word.
const parseStatus = (content: string): DoorStatus["status"] | null => {
  const text = content.toLowerCase();
  if (/\b(closed|gesloten|dicht)\b/.test(text)) return "closed";
  if (/\bopen\b/.test(text)) return "open";
  return null;
};

const fetchDoorStatus = async (): Promise<DoorStatus> => {
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
  return { status: "unknown", since: null };
};

export const door = new Hono();

door.get("/", async (c) => {
  if (!botToken || !channelId) return c.json({ error: "Door status not configured" }, 503);

  if (!cached || Date.now() - cached.at > CACHE_MS) {
    try {
      cached = { at: Date.now(), value: await fetchDoorStatus() };
    } catch (err) {
      console.error(err);
      // Serve the last known status rather than nothing while Discord is unreachable.
      if (!cached) return c.json({ error: "Door status unavailable" }, 502);
    }
  }

  c.header("Cache-Control", "public, max-age=30");
  return c.json(cached.value);
});
