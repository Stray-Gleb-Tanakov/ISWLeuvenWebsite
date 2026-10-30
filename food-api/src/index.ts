import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { RowDataPacket } from "mysql2";
import { db, migrate } from "./db.js";
import { scores } from "./scores.js";

const app = new Hono().basePath("/api");

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.get("/livez", (c) => c.text("ok"));
app.get("/health", async (c) => {
  await db.query("SELECT 1");
  return c.text("ok");
});

// ---- Food (/lokaal) ----

app.get("/food", async (c) => {
  const [cats] = await db.query<RowDataPacket[]>(
    "SELECT id, title, emoji FROM food_categories ORDER BY sort_order, title",
  );
  const [items] = await db.query<RowDataPacket[]>(
    `SELECT slug AS id, category_id, name,
            price_non_member_cents AS priceNonMember, price_member_cents AS priceMember,
            amount, available AND (amount IS NULL OR amount > 0) AS available
     FROM food_items ORDER BY sort_order, name`,
  );
  c.header("Cache-Control", "public, max-age=30");
  return c.json(
    cats.map((cat) => ({
      ...cat,
      items: items
        .filter((i) => i.category_id === cat.id)
        .map(({ category_id, ...i }) => ({ ...i, available: Boolean(i.available) })),
    })),
  );
});

app.route("/scores", scores);

await migrate();
const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => console.log(`food-api listening on :${port}`));
