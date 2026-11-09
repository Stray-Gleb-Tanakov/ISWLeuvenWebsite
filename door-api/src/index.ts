import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { door } from "./door.ts";

// Ingress sends /api/door to this service; everything else under /api goes to food-api.
const app = new Hono().basePath("/api/door");

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.get("/livez", (c) => c.text("ok"));

app.route("/", door);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => console.log(`door-api listening on :${port}`));
