import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { RowDataPacket } from "mysql2";
import { db, migrate } from "./db.ts";
import { scores } from "./scores.ts";

const app = new Hono().basePath("/api");

const inventoryApiUrl = process.env.INVENTORY_API_URL;
const inventoryApiToken = process.env.INVENTORY_API_TOKEN;

const getInventoryFood = async () => {
  if (!inventoryApiUrl || !inventoryApiToken) {
    return null;
  }

  const response = await fetch(inventoryApiUrl, {
    headers: {
      "X-Integration-Token": inventoryApiToken,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Inventory catalogue request failed: ${response.status}`);
  }

  return response.json();
};

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
  const inventoryFood = await getInventoryFood();

  if (inventoryFood) {
    c.header("Cache-Control", "public, max-age=30");
    return c.json(inventoryFood);
  }

  const [cats] = await db.query<RowDataPacket[]>(
    "SELECT id, title, emoji FROM food_categories ORDER BY sort_order, title",
  );
  const [items] = await db.query<RowDataPacket[]>(
    `SELECT slug AS id, category_id, name,\n            price_non_member_cents AS priceNonMember, price_member_cents AS priceMember,\n            amount, available AND (amount IS NULL OR amount > 0) AS available\n     FROM food_items ORDER BY sort_order, name`,
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
serve({ fetch: app.fetch, port }, () => console.log(`food-api listening on :${port}`));
