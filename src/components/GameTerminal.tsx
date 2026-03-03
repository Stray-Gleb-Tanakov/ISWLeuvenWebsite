/* ====================================================
   CYBERPUNK TERMINAL RPG — Game Terminal Component
   ASCII renderer + keyboard input + mobile controls
   ==================================================== */

import { useReducer, useEffect, useRef, useCallback } from "react";
import { gameReducer, createInitialState } from "@/game/engine";
import { CLASS_DATA, FLOOR_NAMES } from "@/game/data";
import type { ClassName, GameState, DialogueChoice } from "@/game/types";
const VIEWPORT_W = 50;
const VIEWPORT_H = 22;
const FOG_RADIUS = 10;

/* ----- Render ASCII map viewport around player ----- */
function renderMap(state: GameState): string[] {
  if (!state.player) return [];
  const { player, maps, enemies, npcs, groundItems, doors } = state;
  const map = maps[player.floor];
  const lines: string[] = [];

  const startX = Math.max(0, player.x - Math.floor(VIEWPORT_W / 2));
  const startY = Math.max(0, player.y - Math.floor(VIEWPORT_H / 2));

  for (let vy = 0; vy < VIEWPORT_H; vy++) {
    const my = startY + vy;
    let row = "";
    for (let vx = 0; vx < VIEWPORT_W; vx++) {
      const mx = startX + vx;
      if (my >= map.length || mx >= (map[my]?.length ?? 0)) { row += " "; continue; }
      const dist = Math.sqrt((mx - player.x) ** 2 + (my - player.y) ** 2);
      if (dist > FOG_RADIUS) { row += "░"; continue; }
      if (mx === player.x && my === player.y) { row += "@"; continue; }
      const enemy = enemies.find((e) => e.x === mx && e.y === my && e.floor === player.floor && e.alive);
      if (enemy) { row += enemy.isBoss ? "B" : "E"; continue; }
      const npc = npcs.find((n) => n.x === mx && n.y === my && n.floor === player.floor);
      if (npc) { row += "N"; continue; }
      const gItem = groundItems.find((i) => i.x === mx && i.y === my && i.floor === player.floor && !i.picked);
      if (gItem) { row += gItem.type === "keycard" ? "K" : gItem.type === "weapon" ? "W" : gItem.type === "armor" ? "A" : "+"; continue; }
      const door = doors.find((d) => d.x === mx && d.y === my && d.floor === player.floor);
      if (door?.locked) { row += "D"; continue; }
      const ch = map[my]?.[mx] ?? " ";
      if (ch === "#") row += "█";
      else if (ch === ">") row += ">";
      else if (ch === ".") row += "·";
      else row += ch;
    }
    lines.push(row);
  }
  return lines;
}

/* ----- HUD status bar ----- */
function renderHUD(state: GameState): string {
  if (!state.player) return "";
  const p = state.player;
  const ac = 10 + Math.floor(p.stats.def / 2) + Math.floor(p.stats.spd / 4);
  return `[${p.className}] LV:${p.level} HP:${p.stats.hp}/${p.stats.maxHp} ATK:${p.stats.atk} DEF:${p.stats.def} AC:${ac} XP:${p.xp}/${p.xpToNext} ${FLOOR_NAMES[p.floor]}`;
}

/* ----- Class selection screen ----- */
function ClassSelect({ onSelect }: { onSelect: (c: ClassName) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-primary text-glow text-sm">Select your class:</p>
      <div className="grid gap-3">
        {(Object.keys(CLASS_DATA) as ClassName[]).map((cls) => {
          const data = CLASS_DATA[cls];
          const s = data.stats;
          return (
            <button
              key={cls}
              onClick={() => onSelect(cls)}
              className="text-left p-3 border border-border hover:border-primary font-mono text-xs transition-colors group"
            >
              <span className="text-primary group-hover:text-glow text-sm font-bold">
                {cls}
              </span>
              <br />
              <span className="text-muted-foreground">{data.desc}</span>
              <br />
              <span className="text-foreground/70">
                HP:{s.maxHp} ATK:{s.atk} DEF:{s.def} SPD:{s.spd} INT:{s.int}
              </span>
              <br />
              <span className="text-primary/60">★ {data.special}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----- Legend ----- */
function Legend() {
  return (
    <div className="text-[10px] text-muted-foreground font-mono leading-tight mt-2">
      <span className="text-primary">@</span>=You{" "}
      <span className="text-destructive">E</span>=Enemy{" "}
      <span className="text-yellow-400">N</span>=NPC{" "}
      <span className="text-cyan-400">K</span>=Key{" "}
      <span className="text-green-400">+</span>=Heal{" "}
      <span className="text-orange-400">W</span>=Weapon{" "}
      <span className="text-blue-400">A</span>=Armor{" "}
      <span className="text-red-400">D</span>=Door{" "}
      <span className="text-primary">&gt;</span>=Stairs{" "}
      <span className="text-purple-400">B</span>=Boss
    </div>
  );
}

/* ----- Mobile D-pad & action buttons ----- */
function MobileControls({ mode, dispatch }: { mode: string; dispatch: React.Dispatch<any> }) {
  const btn = "w-12 h-12 flex items-center justify-center border border-border bg-card/80 active:bg-primary/20 active:border-primary font-mono text-sm text-foreground select-none touch-manipulation";
  const actionBtn = "h-10 flex items-center justify-center border border-border bg-card/80 active:bg-primary/20 active:border-primary font-mono text-[10px] text-foreground select-none touch-manipulation px-3";

  if (mode === "CLASS_SELECT") return null;

  return (
    <div className="mt-3 flex flex-col gap-3 md:hidden">
      {/* Movement + Action Buttons side by side */}
      {(mode === "EXPLORE" || mode === "INVENTORY") && (
        <div className="flex items-center justify-between">
          {/* D-pad */}
          <div className="grid grid-cols-3 gap-1 w-fit">
            <div />
            <button className={btn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "MOVE", dx: 0, dy: -1 }); }}>▲</button>
            <div />
            <button className={btn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "MOVE", dx: -1, dy: 0 }); }}>◄</button>
            <div className="w-12 h-12" />
            <button className={btn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "MOVE", dx: 1, dy: 0 }); }}>►</button>
            <div />
            <button className={btn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "MOVE", dx: 0, dy: 1 }); }}>▼</button>
            <div />
          </div>
          {/* Side buttons */}
          <div className="flex flex-col gap-2">
            <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "TOGGLE_INVENTORY" }); }}>
              {mode === "INVENTORY" ? "CLOSE" : "INV"}
            </button>
          </div>
        </div>
      )}

      {/* Combat buttons */}
      {mode === "COMBAT" && (
        <div className="flex gap-2 flex-wrap">
          <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "ATTACK" }); }}>⚔ ATK</button>
          <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "SPECIAL" }); }}>★ SPL</button>
          <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "FLEE" }); }}>🏃 FLEE</button>
          <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "USE_ITEM", itemIndex: 0 }); }}>1</button>
          <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "USE_ITEM", itemIndex: 1 }); }}>2</button>
          <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "USE_ITEM", itemIndex: 2 }); }}>3</button>
        </div>
      )}

      {/* Dialogue */}
      {mode === "DIALOGUE" && (
        <button className={actionBtn + " w-full"} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "ADVANCE_DIALOGUE" }); }}>
          ▶ CONTINUE
        </button>
      )}

      {/* Game over / Win */}
      {(mode === "GAME_OVER" || mode === "WIN") && (
        <button className={actionBtn + " w-full"} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "RESTART" }); }}>
          ↻ RESTART
        </button>
      )}
    </div>
  );
}

/* ----- Map character coloring ----- */
function charColor(ch: string): string {
  if (ch === "@") return "text-primary text-glow";
  if (ch === "E") return "text-destructive";
  if (ch === "B") return "text-purple-400 font-bold";
  if (ch === "N") return "text-yellow-400";
  if (ch === "K") return "text-cyan-400";
  if (ch === "+") return "text-green-400";
  if (ch === "W") return "text-orange-400";
  if (ch === "A") return "text-blue-400";
  if (ch === "D") return "text-red-400";
  if (ch === ">") return "text-primary";
  if (ch === "█") return "text-border";
  if (ch === "░") return "text-muted-foreground/20";
  return "text-muted-foreground/40";
}

/* ----- Main component ----- */
const GameTerminal = () => {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const logRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [state.log]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key.toLowerCase();
      e.preventDefault();

      switch (state.mode) {
        case "EXPLORE":
          if (key === "w" || key === "arrowup") dispatch({ type: "MOVE", dx: 0, dy: -1 });
          else if (key === "s" || key === "arrowdown") dispatch({ type: "MOVE", dx: 0, dy: 1 });
          else if (key === "a" || key === "arrowleft") dispatch({ type: "MOVE", dx: -1, dy: 0 });
          else if (key === "d" || key === "arrowright") dispatch({ type: "MOVE", dx: 1, dy: 0 });
          else if (key === "i") dispatch({ type: "TOGGLE_INVENTORY" });
          break;
        case "COMBAT":
          if (key === "a") dispatch({ type: "ATTACK" });
          else if (key === "q") dispatch({ type: "SPECIAL" });
          else if (key === "f") dispatch({ type: "FLEE" });
          else if (key >= "1" && key <= "9") dispatch({ type: "USE_ITEM", itemIndex: parseInt(key) - 1 });
          break;
        case "DIALOGUE":
          if (key === "enter" || key === " ") dispatch({ type: "ADVANCE_DIALOGUE" });
          break;
        case "INVENTORY":
          if (key === "i") dispatch({ type: "TOGGLE_INVENTORY" });
          else if (key >= "1" && key <= "9") dispatch({ type: "USE_ITEM", itemIndex: parseInt(key) - 1 });
          break;
        case "GAME_OVER":
        case "WIN":
          if (key === "r") dispatch({ type: "RESTART" });
          break;
      }
    },
    [state.mode]
  );

  const mapLines = state.mode === "EXPLORE" || state.mode === "INVENTORY" ? renderMap(state) : [];
  const hud = renderHUD(state);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKey}
      className="w-full max-w-5xl mx-auto font-mono text-xs outline-none focus:outline-none overflow-hidden"

    >
         <div className="border border-border bg-card overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/80">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="text-muted-foreground text-[10px] ml-2">
            mainframe_breach.exe — {state.mode}
          </span>
        </div>

        {/* Game content */}
        <div className="p-3 space-y-2">
          {state.mode === "CLASS_SELECT" && (
            <ClassSelect onSelect={(c) => dispatch({ type: "SELECT_CLASS", className: c })} />
          )}

          {mapLines.length > 0 && (
            <div>
              <pre className="text-foreground leading-none tracking-widest text-[11px] select-none overflow-x-auto">
                {mapLines.map((line, i) => (
                  <div key={i}>
                    {line.split("").map((ch, j) => (
                      <span key={j} className={charColor(ch)}>{ch}</span>
                    ))}
                  </div>
                ))}
              </pre>
              <Legend />
            </div>
          )}

          {state.player && (
            <div className="text-primary text-glow text-[10px] border-t border-border pt-1 overflow-x-auto">
              {hud}
            </div>
          )}

          {state.mode === "COMBAT" && state.currentEnemy && (
            <div className="text-destructive text-[10px] font-bold">
              ⚔ {state.currentEnemy.name} — HP: {state.currentEnemy.stats.hp}/{state.currentEnemy.stats.maxHp}
              {" "}ATK:{state.currentEnemy.stats.atk} DEF:{state.currentEnemy.stats.def} AC:{state.currentEnemy.ac}
            </div>
          )}

          <div
            ref={logRef}
            className="h-32 overflow-y-auto border-t border-border pt-2 scroll-smooth"
          >
            {state.log.map((line, i) => (
              <div
                key={i}
                className={`leading-relaxed ${
                  line.startsWith(">>>") || line.startsWith("╔") || line.startsWith("║") || line.startsWith("╚")
                    ? "text-primary text-glow"
                    : line.startsWith(">>")
                    ? "text-yellow-400"
                    : line.startsWith("🎲")
                    ? "text-cyan-400"
                    : line.startsWith("═══")
                    ? "text-destructive font-bold"
                    : "text-foreground/80"
                }`}
              >
                {line || "\u00A0"}
              </div>
            ))}
          </div>

          {/* Controls hint (desktop) */}
          <div className="text-muted-foreground text-[9px] border-t border-border pt-1 hidden md:block">
            {state.mode === "EXPLORE" && "WASD/Arrows: Move | I: Inventory | Enemies hunt you!"}
            {state.mode === "COMBAT" && "A: Attack (d20) | Q: Special | F: Flee | 1-9: Use Item"}
            {state.mode === "DIALOGUE" && "Enter/Space: Continue"}
            {state.mode === "INVENTORY" && "I: Close | 1-9: Use Item"}
            {(state.mode === "GAME_OVER" || state.mode === "WIN") && "R: Restart"}
          </div>

          {/* Mobile controls */}
          <MobileControls mode={state.mode} dispatch={dispatch} />
        </div>
      </div>
    </div>
  );
};

export default GameTerminal;
