/* ====================================================
   Seeded random placement.
   Walls, doors, stairs, NPCs, merchants, uplinks and bosses stay
   where the map designer put them. Enemies, items, traps,
   terminals and the keycard get shuffled per run, and a
   layout is only accepted when the floor stays winnable:
   - the stairs are reachable without opening doors
   - the keycard is reachable without opening doors
   - every placed thing is reachable (doors open if the floor has a keycard)
   - terminals never cut off a path, since quitting one leaves it blocking
   ==================================================== */

const MOVABLE = new Set(["E", "+", "W", "A", "X", "T", "K"]);
const SOLID = new Set(["#", "N", "$", "U", "B", "M"]); // things you can't walk through
const ATTEMPTS = 40;

/* mulberry32: small seeded PRNG */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function floorRng(seed: number, floor: number): () => number {
  return seededRng((seed ^ Math.imul(floor + 1, 0x9e3779b1)) >>> 0);
}

type Grid = string[][];
const key = (x: number, y: number) => `${x},${y}`;

function find(grid: Grid, ch: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  grid.forEach((row, y) => row.forEach((c, x) => { if (c === ch) out.push({ x, y }); }));
  return out;
}

/* Tiles reachable from (sx, sy). Terminals count as walls. */
export function reachable(grid: Grid, sx: number, sy: number, doorsOpen: boolean): Set<string> {
  const seen = new Set([key(sx, sy)]);
  const queue = [[sx, sy]];
  while (queue.length) {
    const [x, y] = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, c = grid[ny]?.[nx];
      if (c === undefined || seen.has(key(nx, ny))) continue;
      if (SOLID.has(c) || c === "T" || (c === "D" && !doorsOpen)) continue;
      seen.add(key(nx, ny));
      queue.push([nx, ny]);
    }
  }
  return seen;
}

/* Is every tile in `targets` adjacent to (or inside) the reachable region? Things like
   terminals are interacted with by bumping into them, so adjacency is enough. */
function allTouchable(region: Set<string>, targets: { x: number; y: number }[]): boolean {
  return targets.every(({ x, y }) =>
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => region.has(key(x + dx, y + dy))),
  );
}

export function isWinnable(rows: string[]): boolean {
  const grid = rows.map((r) => [...r]);
  const [start] = find(grid, "@");
  const stairs = find(grid, ">");
  const keycards = find(grid, "K");
  const closed = reachable(grid, start.x, start.y, false);
  const open = reachable(grid, start.x, start.y, keycards.length > 0);
  if (!stairs.every((s) => closed.has(key(s.x, s.y)))) return false;
  if (!keycards.every((k) => closed.has(key(k.x, k.y)))) return false;
  const things = [...MOVABLE].filter((c) => c !== "K").flatMap((c) => find(grid, c));
  return allTouchable(open, things);
}

/* Returns the map with movable things moved; falls back to the original layout */
export function shuffleFloor(rows: string[], rng: () => number): string[] {
  const width = Math.max(...rows.map((r) => r.length));
  const base = rows.map((r) => [...r.padEnd(width, "#")]);
  const [start] = find(base, "@");
  const counts = new Map<string, number>();
  base.forEach((row) => row.forEach((c, x) => {
    if (MOVABLE.has(c)) { counts.set(c, (counts.get(c) ?? 0) + 1); row[x] = "."; }
  }));

  const hasKey = (counts.get("K") ?? 0) > 0;
  const closed = reachable(base, start.x, start.y, false);
  const open = reachable(base, start.x, start.y, hasKey);
  const free = (region: Set<string>, minDist: number) =>
    find(base, ".").filter(({ x, y }) => region.has(key(x, y)) && Math.abs(x - start.x) + Math.abs(y - start.y) >= minDist);

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const grid = base.map((r) => [...r]);
    const take = (pool: { x: number; y: number }[], ch: string) => {
      const options = pool.filter(({ x, y }) => grid[y][x] === ".");
      if (options.length === 0) return false;
      const spot = options[Math.floor(rng() * options.length)];
      grid[spot.y][spot.x] = ch;
      return true;
    };

    let ok = true;
    // Order matters: keycard first (doors-closed area), terminals before the rest so they can't box things in
    const plan: [string, { x: number; y: number }[]][] = [
      ["K", free(closed, 4)],
      ["T", free(open, 3)],
      ["E", free(open, 7)],
      ["+", free(open, 2)],
      ["W", free(open, 2)],
      ["A", free(open, 2)],
      ["X", free(open, 4)],
    ];
    for (const [ch, pool] of plan) {
      for (let i = 0; i < (counts.get(ch) ?? 0) && ok; i++) ok = take(pool, ch);
    }
    const result = grid.map((r) => r.join(""));
    if (ok && isWinnable(result)) return result;
  }
  return rows;
}
