/* ====================================================
   First-person ASCII view of a floor map, like the
   ASCII Doom ports: one ray per text column, wall height
   from distance, shading from distance and wall side.
   ==================================================== */

const WALL_SHADES = ["█", "▓", "▒", "░"];   // near → far
const FLOOR_SHADES = ["#", "x", "=", "-", "."]; // near → far
const MAX_DIST = 16;

export function raycast(map: string[], px: number, py: number, angle: number, width: number, height: number, fov = Math.PI / 3): string[] {
  const rows = Array.from({ length: height }, () => Array<string>(width).fill(" "));
  const solid = (x: number, y: number) => {
    const c = map[y]?.[x];
    return c === undefined || c === "#" || c === "D";
  };

  for (let col = 0; col < width; col++) {
    const rayAngle = angle - fov / 2 + (col / (width - 1)) * fov;
    const dx = Math.cos(rayAngle), dy = Math.sin(rayAngle);
    // DDA through the grid
    let mx = Math.floor(px), my = Math.floor(py);
    const stepX = dx < 0 ? -1 : 1, stepY = dy < 0 ? -1 : 1;
    const deltaX = Math.abs(1 / (dx || 1e-9)), deltaY = Math.abs(1 / (dy || 1e-9));
    let sideX = (dx < 0 ? px - mx : mx + 1 - px) * deltaX;
    let sideY = (dy < 0 ? py - my : my + 1 - py) * deltaY;
    let side = 0, dist = MAX_DIST, door = false;
    for (let i = 0; i < 64; i++) {
      if (sideX < sideY) { sideX += deltaX; mx += stepX; side = 0; } else { sideY += deltaY; my += stepY; side = 1; }
      if (solid(mx, my)) {
        dist = (side === 0 ? sideX - deltaX : sideY - deltaY) * Math.cos(rayAngle - angle); // no fish-eye
        door = map[my]?.[mx] === "D";
        break;
      }
    }
    // text cells are ~2x taller than wide, so walls need ~2x the height to look right
    const wallH = Math.min(height, Math.round((height * 2.2) / Math.max(dist, 0.3)));
    const top = Math.floor((height - wallH) / 2);
    const shadeIdx = Math.min(WALL_SHADES.length - 1, Math.floor(dist / 3) + side);
    const wallChar = door ? "▥" : dist >= MAX_DIST ? " " : WALL_SHADES[shadeIdx];
    for (let r = 0; r < height; r++) {
      if (r >= top && r < top + wallH) rows[r][col] = wallChar;
      else if (r >= top + wallH) {
        // floor: closer rows are denser
        const t = (r - height / 2) / (height / 2);
        rows[r][col] = FLOOR_SHADES[Math.min(FLOOR_SHADES.length - 1, Math.floor((1 - t) * FLOOR_SHADES.length))];
      }
    }
  }
  return rows.map((r) => r.join(""));
}
