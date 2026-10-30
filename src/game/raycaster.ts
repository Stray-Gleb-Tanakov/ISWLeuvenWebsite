/* ====================================================
   First-person ASCII view of a floor map, like the
   ASCII Doom ports.
   - camera-plane raycasting (no fish-eye, no warping)
   - walls drawn with half blocks (▀ ▄ █) for double
     vertical resolution; distance and wall side become
     brightness levels (CSS classes), panel seams and
     corners get darker edges
   - floor with distance shading, faint ceiling
   - billboard sprites (NPCs, terminals, items) with a
     depth buffer, so walls hide them correctly
   ==================================================== */

export interface Sprite {
  x: number;
  y: number;
  art: string[];   // ' ' is transparent
  color: "pink" | "amber" | "cyan" | "red" | "green";
}

/* Beyond this distance a sprite shrinks to a single marker; scaling ASCII art just mangles it */
const SPRITE_ART_RANGE = 7;

export interface Cell {
  ch: string;
  cls: string;     // rc-* class, see game.css
}

const MAX_DIST = 18;
/* A monospace column is ~0.6em wide and a half-block row ~0.5em high */
const CELL_ASPECT = 0.6 / 0.5;

function wallShade(dist: number, side: number, edge: boolean): number {
  const base = dist < 2.5 ? 0 : dist < 5 ? 1 : dist < 9 ? 2 : 3;
  return Math.min(4, base + side + (edge ? 1 : 0));
}

export function raycast(
  map: string[], px: number, py: number, angle: number,
  width: number, height: number, sprites: Sprite[] = [], fov = 1.15,
): Cell[][] {
  const out: Cell[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => ({ ch: " ", cls: "rc-ceil" })));
  const solid = (x: number, y: number) => {
    const c = map[y]?.[x];
    return c === undefined || c === "#" || c === "D";
  };

  const dirX = Math.cos(angle), dirY = Math.sin(angle);
  const planeLen = Math.tan(fov / 2);
  const planeX = -dirY * planeLen, planeY = dirX * planeLen;
  const zBuffer = new Array<number>(width).fill(MAX_DIST);
  const sub = height * 2;            // half-block rows
  const horizon = sub / 2;
  // projection scale in half rows: a wall 1 tile away is as tall as it is wide on screen
  const proj = (width * CELL_ASPECT) / (2 * planeLen);
  const hits: { cellX: number; cellY: number; dist: number }[] = [];

  // ----- walls -----
  for (let col = 0; col < width; col++) {
    const camX = (2 * col) / (width - 1) - 1;
    const rdx = dirX + planeX * camX, rdy = dirY + planeY * camX;
    let mx = Math.floor(px), my = Math.floor(py);
    const ddx = Math.abs(1 / (rdx || 1e-9)), ddy = Math.abs(1 / (rdy || 1e-9));
    const stepX = rdx < 0 ? -1 : 1, stepY = rdy < 0 ? -1 : 1;
    let sdx = (rdx < 0 ? px - mx : mx + 1 - px) * ddx;
    let sdy = (rdy < 0 ? py - my : my + 1 - py) * ddy;
    let side = 0, dist = MAX_DIST, hit = false;
    for (let i = 0; i < 80 && !hit; i++) {
      if (sdx < sdy) { sdx += ddx; mx += stepX; side = 0; } else { sdy += ddy; my += stepY; side = 1; }
      if (solid(mx, my)) hit = true;
    }
    if (hit) dist = side === 0 ? sdx - ddx : sdy - ddy;
    zBuffer[col] = dist;
    hits.push({ cellX: mx, cellY: my, dist });

    // where on the wall face the ray landed: seams at tile borders read as panels
    const wallX = side === 0 ? py + dist * rdy : px + dist * rdx;
    const frac = wallX - Math.floor(wallX);
    const seam = frac < 0.06 || frac > 0.94;
    const door = map[my]?.[mx] === "D";

    // wall span in half rows
    const lineH = hit ? proj / Math.max(dist, 0.2) : 0;
    const top = horizon - lineH / 2, bottom = horizon + lineH / 2;

    for (let r = 0; r < height; r++) {
      const upper = r * 2 + 0.5, lower = r * 2 + 1.5; // centres of the two halves
      const upWall = upper >= top && upper < bottom;
      const lowWall = lower >= top && lower < bottom;
      if (upWall || lowWall) {
        const ch = upWall && lowWall ? "█" : upWall ? "▀" : "▄";
        out[r][col] = { ch, cls: door ? "rc-door" : `rc-wall-${wallShade(dist, side, seam)}` };
      } else if (upper >= bottom) {
        // floor: closer = denser
        const rowDist = proj / (2 * (upper - horizon) + 1e-6);
        const f = rowDist < 2 ? 0 : rowDist < 4 ? 1 : rowDist < 8 ? 2 : 3;
        out[r][col] = { ch: ["=", "-", "·", "."][f], cls: `rc-floor-${f}` };
      } else if ((col * 7 + r * 13) % 23 === 0) {
        out[r][col] = { ch: "˙", cls: "rc-ceil" }; // a few dim ceiling lights
      }
    }
  }

  // ----- corners: where the hit wall jumps, draw a dark edge -----
  for (let col = 1; col < width; col++) {
    const a = hits[col - 1], b = hits[col];
    const jump = Math.abs(a.dist - b.dist) > 0.6 || (a.cellX !== b.cellX && a.cellY !== b.cellY);
    if (!jump) continue;
    const near = a.dist < b.dist ? col - 1 : col;
    for (let r = 0; r < height; r++) {
      if (out[r][near].cls.startsWith("rc-wall")) out[r][near] = { ch: out[r][near].ch, cls: "rc-wall-edge" };
    }
  }

  // ----- sprites, far to near -----
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const sorted = [...sprites].sort((s1, s2) => (s2.x - px) ** 2 + (s2.y - py) ** 2 - ((s1.x - px) ** 2 + (s1.y - py) ** 2));
  for (const s of sorted) {
    const relX = s.x - px, relY = s.y - py;
    const tx = invDet * (dirY * relX - dirX * relY);
    const depth = invDet * (-planeY * relX + planeX * relY);
    if (depth <= 0.2) continue; // behind the camera
    const screenX = Math.round(((width - 1) / 2) * (1 + tx / depth));
    const bottomRow = Math.min(height - 1, Math.floor((horizon + proj / depth / 2) / 2)); // stands on the floor
    const art = depth > SPRITE_ART_RANGE ? ["•"] : s.art;
    const artW = Math.max(...art.map((l) => [...l].length));
    art.forEach((line, dy) => {
      const r = bottomRow - art.length + 1 + dy;
      if (r < 0 || r >= height) return;
      [...line].forEach((ch, dx) => {
        const c = screenX - Math.floor(artW / 2) + dx;
        if (ch === " " || c < 0 || c >= width || depth >= zBuffer[c]) return;
        out[r][c] = { ch, cls: `rc-sprite-${s.color}` };
      });
    });
  }
  return out;
}

/* Plain text version (tests, debugging) */
export function raycastText(...args: Parameters<typeof raycast>): string[] {
  return raycast(...args).map((row) => row.map((c) => c.ch).join(""));
}
