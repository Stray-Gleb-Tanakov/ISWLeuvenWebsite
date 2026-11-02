import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { db, dbEnabled, migrate } from "./db.ts";
import { members } from "./members.ts";

const app = new Hono().basePath("/api");

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.get("/livez", (c) => c.text("ok"));
app.get("/health", async (c) => {
  if (db) await db.query("SELECT 1");
  return c.text("ok");
});

app.route("/members", members);

await migrate();
const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () =>
  console.log(`members-api listening on :${port} (db ${dbEnabled ? "on" : "off: email only"})`),
);
