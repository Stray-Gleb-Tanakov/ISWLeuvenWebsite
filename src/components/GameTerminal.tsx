/* ====================================================
   CYBERPUNK TERMINAL RPG — Game Terminal Component
   ASCII renderer + keyboard input + mobile controls
   ==================================================== */

import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import { gameReducer, createInitialState } from "@/game/engine";
import { CLASS_DATA, FLOOR_NAMES, LOCKED_CLASSES } from "@/game/data";
import { computeScore } from "@/game/score";
import type { ClassName, GameState, DialogueChoice } from "@/game/types";
import ScoreSubmit from "@/components/ScoreSubmit";
import QtePanel from "@/components/QtePanel";
import ShopPanel from "@/components/ShopPanel";
import LockdownPanel from "@/components/LockdownPanel";
import UplinkPanel from "@/components/UplinkPanel";
import PerkPanel from "@/components/PerkPanel";
import TalkPanel from "@/components/TalkPanel";
import CosmeticsPicker from "@/components/CosmeticsPicker";
import IswChanMemoryPanel from "@/components/IswChanMemoryPanel";
import IswChanCam from "@/components/IswChanCam";
import EndingPanel from "@/components/EndingPanel";
import { loadMemory, recordRun, saveMemory, adjustAffection } from "@/game/memory";
import { loadFacts, noteRun, saveFacts } from "@/game/chanfacts";
import type { HiddenFlag } from "@/game/flags";
import { ICONS, DEATH_TEXTS } from "@/game/cosmetics";
import { PERKS, PARANOIA_WARNINGS, hasPerk } from "@/game/perks";
import { ISW_CHAN_TAG } from "@/game/iswchan";
import { useCosmetics } from "@/hooks/UseCosmetics";
import { play, isMuted, setMuted } from "@/lib/sfx";

const VIEWPORT = { wide: { w: 50, h: 22 }, narrow: { w: 34, h: 17 } };
const FOG_RADIUS = 10;
const STATUS_ICONS: Record<string, string> = { poison: "☠", burn: "🔥", stun: "💫", slow: "🐌", bleed: "🩸", exposed: "🎯" };

/* Phones get a smaller map viewport so it fits in portrait */
function useNarrow(): boolean {
  const query = "(max-width: 639px)";
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return narrow;
}

/* ----- Render ASCII map viewport around player ----- */
function renderMap(state: GameState, viewW: number, viewH: number, fake: { x: number; y: number } | null = null): string[] {
  if (!state.player) return [];
  const { player, maps, enemies, npcs, groundItems, doors, puzzles, merchants, uplinks } = state;
  const map = maps[player.floor];
  const lines: string[] = [];

  const startX = Math.max(0, Math.min(player.x - Math.floor(viewW / 2), (map[0]?.length ?? 0) - viewW));
  const startY = Math.max(0, player.y - Math.floor(viewH / 2));

  for (let vy = 0; vy < viewH; vy++) {
    const my = startY + vy;
    let row = "";
    for (let vx = 0; vx < viewW; vx++) {
      const mx = startX + vx;
      if (my >= map.length || mx >= (map[my]?.length ?? 0)) { row += " "; continue; }
      if (fake && fake.x === mx && fake.y === my) { row += "E"; continue; } // Paranoia: it's not really there
      const dist = Math.sqrt((mx - player.x) ** 2 + (my - player.y) ** 2);
      if (dist > FOG_RADIUS) { row += "░"; continue; }
      if (mx === player.x && my === player.y) { row += "@"; continue; }
      const enemy = enemies.find((e) => e.x === mx && e.y === my && e.floor === player.floor && e.alive);
      if (enemy) { row += enemy.isBoss ? "B" : "E"; continue; }
      const npc = npcs.find((n) => n.x === mx && n.y === my && n.floor === player.floor);
      if (npc) { row += "N"; continue; }
      if (merchants.some((m) => m.x === mx && m.y === my && m.floor === player.floor)) { row += "$"; continue; }
      if (uplinks.some((u) => u.x === mx && u.y === my && u.floor === player.floor)) { row += "U"; continue; }
      const puzzle = puzzles.find((p) => p.x === mx && p.y === my && p.floor === player.floor && !p.solved);
      if (puzzle) { row += "T"; continue; }
      const gItem = groundItems.find((i) => i.x === mx && i.y === my && i.floor === player.floor && !i.picked);
      if (gItem) { row += gItem.type === "diary" ? "?" : gItem.type === "keycard" ? "K" : gItem.type === "weapon" ? "W" : gItem.type === "armor" ? "A" : "+"; continue; }
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
function renderHUD(state: GameState): string[] {
  if (!state.player) return [];
  const p = state.player;
  const ac = 10 + Math.floor(p.stats.def / 2) + Math.floor(p.stats.spd / 6);
  const lines = [
    `[${p.className}] LV:${p.level} HP:${p.stats.hp}/${p.stats.maxHp} MP:${p.stats.mp}/${p.stats.maxMp} AC:${ac} 💰${p.credits}`,
    FLOOR_NAMES[p.floor],
    `ATK:${p.stats.atk} DEF:${p.stats.def} XP:${p.xp}/${p.xpToNext} SCORE:${computeScore(state).total}${p.stealthMode ? ` 🕶${p.stealth}` : ""}${p.comboCount > 0 ? ` ⚡x${p.comboCount}` : ""}${p.statusEffects.length > 0 ? " " + p.statusEffects.map(e => STATUS_ICONS[e.type] || "?").join("") : ""}${p.drone ? ` 🤖${p.drone.hp}/${p.drone.maxHp}` : ""}`,
  ];
  if (p.perks.length > 0) lines.push(`PERKS: ${p.perks.map((id) => PERKS[id].name).join(" · ")}`);
  return lines;
}

/* ----- Class selection screen ----- */
function ClassSelect({ onSelect, flagsFound }: { onSelect: (c: ClassName) => void; flagsFound: number }) {
  return (
    <div className="space-y-4">
      <p className="text-primary text-glow text-sm">Select your class:</p>
      <div className="grid gap-3 md:grid-cols-2">
        {(Object.keys(CLASS_DATA) as ClassName[]).map((cls) => {
          const data = CLASS_DATA[cls];
          const s = data.stats;
          const lock = LOCKED_CLASSES[cls];
          const locked = !!lock && !lock.unlocked(flagsFound);
          if (locked) {
            return (
              <div key={cls} className="text-left p-3 border border-border/50 font-mono text-xs opacity-50">
                <span className="text-sm font-bold">🔒 {cls}</span>
                <br />
                <span className="text-muted-foreground">{lock!.hint}</span>
              </div>
            );
          }
          return (
            <button
              key={cls}
              onClick={() => onSelect(cls)}
              className="text-left p-3 border border-border hover:border-primary font-mono text-xs transition-colors group"
            >
              <span className="text-primary group-hover:text-glow text-sm font-bold">{cls}</span>
              <br />
              <span className="text-muted-foreground">{data.desc}</span>
              <br />
              <span className="text-foreground/70">
                HP:{s.maxHp} MP:{s.maxMp} ATK:{s.atk} DEF:{s.def} SPD:{s.spd} INT:{s.int}
              </span>
              <br />
              <span className="text-primary/60">★ {data.special}</span>
              <br />
              <span className="text-muted-foreground/80">
                Skills: {data.skills.map(sk => `${sk.name}(${sk.mpCost}MP)`).join(", ")}
              </span>
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
    <div className="text-[10px] text-muted-foreground font-mono leading-tight mt-2 text-center">
      <span className="text-primary">@</span>=You{" "}
      <span className="text-destructive">E</span>=Enemy{" "}
      <span className="text-yellow-400">N</span>=NPC{" "}
      <span className="text-cyan-400">K</span>=Key{" "}
      <span className="text-green-400">+</span>=Heal{" "}
      <span className="text-orange-400">W</span>=Weapon{" "}
      <span className="text-blue-400">A</span>=Armor{" "}
      <span className="text-red-400">D</span>=Door{" "}
      <span className="text-primary">&gt;</span>=Stairs{" "}
      <span className="text-purple-400">B</span>=Boss{" "}
      <span className="text-amber-300">T</span>=Terminal{" "}
      <span className="text-yellow-400">$</span>=Shop{" "}
      <span className="text-cyan-300">U</span>=Uplink{" "}
      <span className="text-pink-400">?</span>=Diary
    </div>
  );
}

/* ----- Dialogue choices UI ----- */
function DialogueChoicesUI({ choices, dispatch }: { choices: DialogueChoice[]; dispatch: React.Dispatch<any> }) {
  return (
    <div className="space-y-1 mt-1">
      {choices.map((choice, i) => (
        <button
          key={i}
          onClick={() => dispatch({ type: "SELECT_DIALOGUE_CHOICE", choiceIndex: i })}
          className="block w-full text-left font-mono text-xs px-2 py-1.5 border border-border hover:border-primary hover:text-primary transition-colors"
        >
          <span className="text-primary">[{i + 1}]</span> {choice.label}
        </button>
      ))}
    </div>
  );
}

/* ----- Mobile D-pad & action buttons ----- */
function MobileControls({ state, dispatch, onSubmitTyped }: { state: GameState; dispatch: React.Dispatch<any>; onSubmitTyped: () => void }) {
  const btn = "w-12 h-12 flex items-center justify-center border border-border bg-card/80 active:bg-primary/20 active:border-primary font-mono text-sm text-foreground select-none touch-manipulation";
  const actionBtn = "h-10 flex items-center justify-center border border-border bg-card/80 active:bg-primary/20 active:border-primary font-mono text-[10px] text-foreground select-none touch-manipulation px-3";

  const { mode, dialogueChoices } = state;

  if (mode === "CLASS_SELECT") return null;

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {(mode === "EXPLORE" || mode === "INVENTORY") && (
        <div className="flex items-center justify-between">
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
          <div className="flex flex-col gap-2">
            <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "TOGGLE_INVENTORY" }); }}>
              {mode === "INVENTORY" ? "CLOSE" : "INV"}
            </button>
            <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "TOGGLE_STEALTH" }); }}>
              {state.player?.stealthMode ? "🕶 ON" : "SNEAK"}
            </button>
          </div>
        </div>
      )}

      {mode === "COMBAT" && (
        <div className="flex gap-2 flex-wrap">
          <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "ATTACK" }); }}>⚔ ATK</button>
          <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "SPECIAL" }); }}>★ Q</button>
          {state.player?.skills.slice(1).map((sk, i) => (
            <button key={i} className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "SKILL", skillIndex: i + 1 }); }}>
              {sk.name.substring(0, 4)}
            </button>
          ))}
          <button className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "FLEE" }); }}>🏃 FLEE</button>
        </div>
      )}

      {(mode === "COMBAT" || mode === "INVENTORY") && state.player && state.player.inventory.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {state.player.inventory.map((item, i) => (
            <button key={item.id + i} className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "USE_ITEM", itemIndex: i }); }}>
              {item.name.replace("NanoMed Kit", "Med").replace(" Patch", "").replace(" Cell", "")}
            </button>
          ))}
        </div>
      )}

      {mode === "DIALOGUE" && !dialogueChoices && (
        <button className={actionBtn + " w-full"} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "ADVANCE_DIALOGUE" }); }}>
          ▶ CLOSE
        </button>
      )}

      {mode === "DIALOGUE" && dialogueChoices && (
        <div className="flex gap-2 flex-wrap">
          {dialogueChoices.map((_, i) => (
            <button key={i} className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "SELECT_DIALOGUE_CHOICE", choiceIndex: i }); }}>
              [{i + 1}]
            </button>
          ))}
        </div>
      )}

      {(mode === "PUZZLE" || mode === "LOCKDOWN" || mode === "UPLINK" || (mode === "SHOP" && state.haggle)) && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onSubmitTyped(); }}>
          {/* A real input so phones open their keyboard */}
          <input
            value={state.puzzleInput}
            onChange={(e) => dispatch({ type: "PUZZLE_SET", value: e.target.value })}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="answer"
            aria-label="Answer"
            className="flex-1 min-w-0 bg-background border border-border px-2 h-10 font-mono text-sm text-foreground focus:border-primary outline-none"
          />
          <button type="submit" className={actionBtn}>SUBMIT</button>
          {(mode === "PUZZLE" || mode === "UPLINK") && (
            <button type="button" className={actionBtn} onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "PUZZLE_QUIT" }); }}>ESC</button>
          )}
        </form>
      )}

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
  if (ch === "T") return "text-amber-300";
  if (ch === "$") return "text-yellow-400 font-bold";
  if (ch === "U") return "text-cyan-300 font-bold";
  if (ch === "?") return "text-pink-400 font-bold";
  if (ch === ">") return "text-primary";
  if (ch === "█") return "text-border";
  if (ch === "▓") return "text-border"; // ISW-Chan's hollow wall: same colour, different texture
  if (ch === "░") return "text-muted-foreground/20";
  return "text-muted-foreground/40";
}

/* ----- Main component ----- */
interface GameTerminalProps {
  /* hidden site flags found so far (id -> flag), uploaded at U terminals and sent along with the score */
  found: Record<string, string>;
  onSubmitFlag: (input: string) => Promise<HiddenFlag | null>;
  onScoreSubmitted: () => void;
}

const GameTerminal = ({ found, onSubmitFlag, onScoreSubmitted }: GameTerminalProps) => {
  const flags = Object.values(found);
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const narrow = useNarrow();
  const logRef = useRef<HTMLDivElement>(null);
  // A fresh QtePanel for every QTE, even two of the same kind in a row
  const qteKey = useRef<{ qte: GameState["qte"]; n: number }>({ qte: null, n: 0 });
  if (qteKey.current.qte !== state.qte) qteKey.current = { qte: state.qte, n: qteKey.current.n + 1 };
  const containerRef = useRef<HTMLDivElement>(null);
  const { cosmetics, update: updateCosmetics } = useCosmetics(found);
  const [muted, setMutedState] = useState(isMuted);

  // ISW-Chan remembers every finished run (once per run)
  const [memory, setMemory] = useState(loadMemory);
  const over = state.mode === "GAME_OVER" || state.mode === "WIN";
  useEffect(() => {
    if (!over) return;
    setMemory((m) => {
      const next = recordRun(m, { won: state.mode === "WIN", shrine: !!state.shrineFound, diary: state.diaryFound ?? [] });
      saveMemory(next);
      return next;
    });
    // ...and she remembers how it went (chanfacts.ts)
    const p = state.player;
    if (p) saveFacts(noteRun(loadFacts(), { className: p.className, floor: p.floor, won: state.mode === "WIN", killedBy: state.runStats.killedBy, perfects: state.runStats.perfects }));
  }, [over]); // eslint-disable-line react-hooks/exhaustive-deps

  // What you tell her over the intercom, she keeps (how your runs went is recorded above, not here)
  const chanFacts = state.talk?.chan?.facts;
  useEffect(() => {
    if (!chanFacts) return;
    const { deaths, lastRun } = loadFacts();
    saveFacts({ ...chanFacts, deaths, lastRun });
  }, [chanFacts]);

  // Things you say to her change how she feels about you, for good
  useEffect(() => {
    const change = state.chanAffection;
    if (!change || change.delta === 0) return;
    setMemory((m) => { const next = adjustAffection(m, change.delta); saveMemory(next); return next; });
  }, [state.chanAffection?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [state.log]);

  // Screen effects: shake + flash + sound, once per new fx id
  const [fx, setFx] = useState<{ kind: string; id: number } | null>(null);
  useEffect(() => {
    if (!state.fx) return;
    setFx(state.fx);
    play(state.fx.kind);
    const t = setTimeout(() => setFx(null), state.fx.kind === "nuke" ? 1400 : 500);
    return () => clearTimeout(t);
  }, [state.fx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Paranoia: every 8-15 moves something on screen lies to you, cycling through the warnings in a shuffled order
  const [paranoia, setParanoia] = useState<{ id: number; text: string; fake: { x: number; y: number } | null } | null>(null);
  const nextScare = useRef(8 + Math.floor(Math.random() * 8));
  const warnings = useRef<string[]>([]);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const paranoid = hasPerk(state.player, "paranoia");
  useEffect(() => {
    if (!paranoid || !state.player) return;
    if (state.turnCount < nextScare.current - 40) nextScare.current = state.turnCount + 8; // a new run restarted the turn count
    if (state.turnCount < nextScare.current) return;
    nextScare.current = state.turnCount + 8 + Math.floor(Math.random() * 8);
    if (warnings.current.length === 0) warnings.current = [...PARANOIA_WARNINGS].sort(() => Math.random() - 0.5);
    const p = state.player;
    const angle = Math.random() * Math.PI * 2;
    const fake = Math.random() < 0.5 ? { x: Math.round(p.x + Math.cos(angle) * 6), y: Math.round(p.y + Math.sin(angle) * 4) } : null;
    const text = warnings.current.pop()!; // outside the updater: StrictMode may run it twice
    setParanoia((prev) => ({ id: (prev?.id ?? 0) + 1, text, fake }));
    play("warning");
    // not tied to the effect's cleanup: the next step must not cancel the hide
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setParanoia(null), 1600);
  }, [state.turnCount, paranoid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // A clicked button that disappears (class pick, dialogue choice, shop) takes keyboard focus with it.
  // Take it back, but never from something the player clicked on purpose (leaderboard, inputs).
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body || !document.contains(active)) {
      containerRef.current?.focus({ preventScroll: true });
    }
  }, [state.mode, state.dialogueChoices, state.haggle]);

  // Enter in a typed prompt: uplink flags are checked here (async hash), everything else by the reducer
  const submitTyped = useCallback(async () => {
    if (state.mode !== "UPLINK") { dispatch({ type: "PUZZLE_SUBMIT" }); return; }
    const input = state.puzzleInput.trim();
    if (!input) return;
    const flag = await onSubmitFlag(input);
    const count = Object.keys(found).length + (flag && !found[flag.id] ? 1 : 0);
    dispatch({ type: "UPLINK_RESULT", input, title: flag?.title ?? null, flagsFound: count });
  }, [state.mode, state.puzzleInput, onSubmitFlag, found]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return; // text boxes handle themselves
      const key = e.key.toLowerCase();
      e.preventDefault();

      switch (state.mode) {
        case "EXPLORE":
          if (key === "w" || key === "arrowup") dispatch({ type: "MOVE", dx: 0, dy: -1 });
          else if (key === "s" || key === "arrowdown") dispatch({ type: "MOVE", dx: 0, dy: 1 });
          else if (key === "a" || key === "arrowleft") dispatch({ type: "MOVE", dx: -1, dy: 0 });
          else if (key === "d" || key === "arrowright") dispatch({ type: "MOVE", dx: 1, dy: 0 });
          else if (key === "i") dispatch({ type: "TOGGLE_INVENTORY" });
          else if (key === "x") dispatch({ type: "TOGGLE_STEALTH" });
          break;
        case "COMBAT":
          if (key === "a") dispatch({ type: "ATTACK" });
          else if (key === "q") dispatch({ type: "SPECIAL" });
          else if (key === "f") dispatch({ type: "FLEE" });
          else if (key === "1") dispatch({ type: "SKILL", skillIndex: 0 });
          else if (key === "2") dispatch({ type: "SKILL", skillIndex: 1 });
          else if (key === "3") dispatch({ type: "SKILL", skillIndex: 2 });
          else if (key >= "4" && key <= "9") dispatch({ type: "USE_ITEM", itemIndex: parseInt(key) - 4 });
          break;
        case "DIALOGUE":
          if (state.dialogueChoices) {
            if (key >= "1" && key <= "9") {
              const idx = parseInt(key) - 1;
              if (idx < state.dialogueChoices.length) {
                dispatch({ type: "SELECT_DIALOGUE_CHOICE", choiceIndex: idx });
              }
            }
          } else {
            if (key === "enter" || key === " ") dispatch({ type: "ADVANCE_DIALOGUE" });
          }
          break;
        case "INVENTORY":
          if (key === "i") dispatch({ type: "TOGGLE_INVENTORY" });
          else if (key >= "1" && key <= "9") dispatch({ type: "USE_ITEM", itemIndex: parseInt(key) - 1 });
          break;
        case "SHOP":
          if (!state.haggle) {
            if (key === "escape") dispatch({ type: "SHOP_LEAVE" });
            else if (key === "h") dispatch({ type: "SHOP_HAGGLE" });
            else if (key >= "1" && key <= "9") dispatch({ type: "SHOP_BUY", index: parseInt(key) - 1 });
            break;
          }
        // haggling: typed like a puzzle
        // falls through
        case "PUZZLE":
        case "LOCKDOWN":
        case "UPLINK":
          if (key === "escape") dispatch({ type: "PUZZLE_QUIT" });
          else if (key === "backspace") dispatch({ type: "PUZZLE_BACKSPACE" });
          else if (key === "enter") submitTyped();
          else if (key.length === 1 && /^[a-zA-Z0-9 {}_]$/.test(key)) dispatch({ type: "PUZZLE_INPUT", char: key });
          break;
        case "PERK":
          if (key >= "1" && key <= "3") dispatch({ type: "PICK_PERK", index: parseInt(key) - 1 });
          break;
        // QTE: QtePanel listens on window itself · TALK: TalkPanel has its own input
        case "GAME_OVER":
        case "WIN":
          if (key === "r") dispatch({ type: "RESTART" });
          break;
      }
    },
    [state.mode, state.dialogueChoices, state.haggle, submitTyped]
  );

  const view = narrow ? VIEWPORT.narrow : VIEWPORT.wide;
  const mapLines = state.mode === "EXPLORE" || state.mode === "INVENTORY" ? renderMap(state, view.w, view.h, paranoia?.fake ?? null) : [];
  const icon = ICONS.find((i) => i.id === cosmetics.icon)?.char ?? "@";
  const theme = hasPerk(state.player, "vampiric") ? "game-theme-blood" : cosmetics.theme !== "matrix" ? `game-theme-${cosmetics.theme}` : "";
  const fighting = state.currentEnemy && (state.mode === "COMBAT" || state.mode === "QTE" || state.mode === "LOCKDOWN");
  const typing = state.mode === "PUZZLE" || state.mode === "LOCKDOWN" || state.mode === "UPLINK" || (state.mode === "SHOP" && state.haggle);
  const hudLines = renderHUD(state);

  return (
    <div className={`w-full max-w-5xl mx-auto ${theme}`}>
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKey}
      className={`relative w-full font-mono text-xs outline-none focus:outline-none overflow-hidden ${fx ? (fx.kind === "nuke" ? "fx-shake-big" : fx.kind === "perfect" ? "" : "fx-shake") : ""}`}
    >
      {fx && <div key={fx.id} className={`fx-flash fx-flash-${fx.kind}`} />}
      {paranoia && (
        <div key={paranoia.id} className="paranoia-banner absolute left-0 right-0 top-1/3 z-30 text-center text-destructive font-bold text-lg sm:text-2xl pointer-events-none px-4">
          {paranoia.text}
        </div>
      )}
      <div className="border border-border bg-card overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/80">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <span className="text-muted-foreground text-[10px] ml-2">
            mainframe_breach.exe — {state.mode}
          </span>
          <button
            onClick={() => { setMuted(!muted); setMutedState(!muted); }}
            className="ml-auto text-[10px] text-muted-foreground hover:text-primary"
            aria-label={muted ? "Unmute sound" : "Mute sound"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        {/* Game content */}
        <div className="p-4 space-y-2">
          {state.mode === "CLASS_SELECT" && (
            <>
              <ClassSelect flagsFound={flags.length} onSelect={(c) => dispatch({ type: "SELECT_CLASS", className: c, flagsFound: flags.length, affection: memory.affection })} />
              <CosmeticsPicker found={found} choice={cosmetics} onChange={updateCosmetics} />
              <IswChanMemoryPanel memory={memory} onChange={setMemory} />
            </>
          )}

          {state.mode === "TALK" && state.talk && <TalkPanel state={state} dispatch={dispatch} narrow={narrow} />}

          {(state.mode === "ENDING" || (state.mode === "GAME_OVER" && state.ending?.kicked)) && state.ending && <EndingPanel state={state} dispatch={dispatch} />}


          {state.mode === "PERK" && state.perkChoices && (
            <PerkPanel choices={state.perkChoices} onPick={(index) => dispatch({ type: "PICK_PERK", index })} />
          )}

          {mapLines.length > 0 && (
            <div className="flex flex-col items-center">
              <pre className="text-foreground leading-none tracking-widest text-[11px] select-none overflow-hidden max-w-full">
                {mapLines.map((line, i) => (
                  <div key={i}>
                    {[...line].map((ch, j) => (
                      <span key={j} className={charColor(ch)}>{ch === "@" ? icon : ch}</span>
                    ))}
                  </div>
                ))}
              </pre>
              <Legend />
            </div>
          )}

          {state.player && (
            <div className="flex items-start gap-2 border-t border-border pt-1">
              <div className="text-primary text-glow text-[10px] space-y-0.5 min-w-0 flex-1">
                {hudLines.map((line, i) => <div key={i}>{line}</div>)}
              </div>
              {!state.talk && <IswChanCam state={state} />}
            </div>
          )}

          {fighting && state.currentEnemy && (
            <div className="text-destructive text-[10px] font-bold">
              ⚔ {state.currentEnemy.name} — HP: {state.currentEnemy.stats.hp}/{state.currentEnemy.stats.maxHp}
              {" "}AC:{state.currentEnemy.ac}
              {state.currentEnemy.statusEffects.length > 0 && " " + state.currentEnemy.statusEffects.map(e => STATUS_ICONS[e.type] || "?").join("")}
            </div>
          )}

          {state.mode === "QTE" && state.qte && (
            <QtePanel key={qteKey.current.n} qte={state.qte} onResolve={(result, accuracy, text) => dispatch({ type: "QTE_RESOLVE", result, accuracy, text })} />
          )}

          {state.mode === "LOCKDOWN" && <LockdownPanel key={state.currentPuzzle?.id} state={state} dispatch={dispatch} />}

          {state.mode === "SHOP" && <ShopPanel state={state} dispatch={dispatch} />}

          {state.mode === "UPLINK" && <UplinkPanel found={found} />}

          {/* Typed answer display (desktop; phones get a real input in MobileControls) */}
          {typing && (
            <div className="text-amber-300 text-sm font-bold font-mono border border-border p-2 bg-card/60 hidden md:block">
              <div>ANSWER: {state.puzzleInput}<span className="animate-pulse">_</span></div>
              <div className="text-[10px] text-muted-foreground mt-1">Type answer · ENTER to submit{state.mode !== "LOCKDOWN" && " · ESC to quit"}</div>
            </div>
          )}

          {/* Dialogue choices */}
          {state.mode === "DIALOGUE" && state.dialogueChoices && (
            <DialogueChoicesUI choices={state.dialogueChoices} dispatch={dispatch} />
          )}

          {/* Mobile controls: right under the map so a phone never has to scroll between them */}
          <MobileControls state={state} dispatch={dispatch} onSubmitTyped={submitTyped} />

          <div
            ref={logRef}
            className="h-32 md:h-44 overflow-y-auto border-t border-border pt-2 scroll-smooth game-log-scroll"
          >
            {state.log.map((line, i) => (
              <div
                key={i}
                className={`leading-relaxed ${
                  line.startsWith(ISW_CHAN_TAG)
                    ? "isw-chan-line"
                    : line.startsWith(">>>") || line.startsWith("╔") || line.startsWith("║") || line.startsWith("╚")
                    ? "text-primary text-glow"
                    : line.startsWith(">>")
                    ? "text-yellow-400"
                    : line.startsWith("🎲")
                    ? "text-cyan-400"
                    : line.startsWith(">") && !line.startsWith(">>")
                    ? "text-accent-foreground font-bold"
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
            {state.mode === "EXPLORE" && "WASD/Arrows: Move | I: Inventory | X: Stealth | Walk into T for puzzles, $ to shop, U to upload flags"}
            {state.mode === "COMBAT" && "A: Attack | Q/1: Special (QTE) | 2-3: Skills | 4-9: Items | F: Flee"}
            {state.mode === "QTE" && "Quick-time event! Follow the prompt."}
            {state.mode === "SHOP" && !state.haggle && "1-6: Buy | H: Haggle | Esc: Leave"}
            {state.mode === "UPLINK" && "Type a flag | Enter: Upload | Esc: Disconnect"}
            {state.mode === "DIALOGUE" && state.dialogueChoices && "1-" + state.dialogueChoices.length + ": Select response"}
            {state.mode === "DIALOGUE" && !state.dialogueChoices && "Enter/Space: Close"}
            {state.mode === "INVENTORY" && "I: Close | 1-9: Use Item"}
            {state.mode === "PERK" && "1-3: Pick a perk"}
            {state.mode === "TALK" && "Type what you do or say · 'help' for commands"}
            {state.mode === "PUZZLE" && "Type answer | Enter: Submit | Esc: Quit"}
            {(state.mode === "GAME_OVER" || state.mode === "WIN") && "R: Restart"}
          </div>

        </div>
      </div>
    </div>
    {(state.mode === "GAME_OVER" || state.mode === "WIN") && (
      <ScoreSubmit
        state={state}
        flags={flags}
        badge={cosmetics.badge}
        deathText={DEATH_TEXTS.find((d) => d.id === cosmetics.death)?.text ?? "RUN TERMINATED"}
        onSubmitted={onScoreSubmitted}
      />
    )}
    </div>
  );
};

export default GameTerminal;
