// Loads the menu from data/food.json into food_categories / food_items.
//   npm run seed:food                 -> only inserts items that don't exist yet
//   npm run seed:food -- --update     -> also overwrites existing items with the JSON
//   kubectl -n iswleuven exec deploy/food-api -- npm run seed:food
// After the first seed, the database is the source of truth: edit prices there.
import { readFile } from "node:fs/promises";
import { db, migrate } from "../src/db.ts";

type FoodItemInput = { slug: string; name: string; nonMember: number | null; member: number | null; available: boolean };
type FoodCategoryInput = { id: string; title: string; emoji: string; items: FoodItemInput[] };

const update = process.argv.includes("--update");
const categories: FoodCategoryInput[] = JSON.parse(
  await readFile(new URL("../data/food.json", import.meta.url), "utf8"),
);
const onDuplicate = (sql: string) => (update ? `ON DUPLICATE KEY UPDATE ${sql}` : "ON DUPLICATE KEY UPDATE id = id");

await migrate();

for (const [ci, cat] of categories.entries()) {
  await db.query(
    `INSERT INTO food_categories (id, title, emoji, sort_order) VALUES (?, ?, ?, ?)
     ${onDuplicate("title = VALUES(title), emoji = VALUES(emoji), sort_order = VALUES(sort_order)")}`,
    [cat.id, cat.title, cat.emoji, ci],
  );
  for (const [ii, item] of cat.items.entries()) {
    await db.query(
      `INSERT INTO food_items
         (slug, category_id, name, price_non_member_cents, price_member_cents, available, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ${onDuplicate(`category_id = VALUES(category_id), name = VALUES(name),
         price_non_member_cents = VALUES(price_non_member_cents),
         price_member_cents = VALUES(price_member_cents),
         available = VALUES(available), sort_order = VALUES(sort_order)`)}`,
      [item.slug, cat.id, item.name, item.nonMember, item.member, item.available, ii],
    );
  }
  console.log(`✓ ${cat.title} (${cat.items.length} items)`);
}

await db.end();
