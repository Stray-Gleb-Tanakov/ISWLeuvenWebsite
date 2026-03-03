/* =====================================================
   CYBERPUNK TERMINAL RPG — Game Engine (Reducer)
   D&D-style dice rolls, enemy AI movement, random spawns
   ==================================================== */

import type { GameState, GameAction, Player, Enemy } from "./types";
import { CLASS_DATA, parseFloor, FLOOR_MAPS, FLOOR_NAMES, createRandomEnemy, getAnnoyedLine } from "./data";

/* ----- Dice rolling ----- */
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollDice(sides: number, count: number = 1): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  return total;
}

/* ----- Helper: create initial state ----- */
export function createInitialState(): GameState {
  const { cleanMap, enemies, npcs, groundItems, doors } = parseFloor(0);
  const allMaps = [cleanMap];

  for (let f = 1; f < FLOOR_MAPS.length; f++) {
    const parsed = parseFloor(f);
    allMaps.push(parsed.cleanMap);
  }

  return {
    mode: "CLASS_SELECT",
    player: null,
    enemies,
    npcs,
    groundItems,
    maps: allMaps,
    log: [
      "╔══════════════════════════════════════╗",
      "║   MAINFRAME BREACH — v2.0.0         ║",
      "║   A Cyberpunk Terminal RPG           ║",
      "║   Now with D&D-style dice rolls!     ║",
      "╚══════════════════════════════════════╝",
      "",
      "You wake up inside a corrupted mainframe.",
      "Your memories are fragmented. You must escape.",
      "Select your class to begin...",
    ],
    currentEnemy: null,
    currentNPC: null,
    dialogueIndex: 0,
    dialogueChoices: null,
    doors,
    turnCount: 0,
    spawnTimer: 8 + Math.floor(Math.random() * 5),
  };
}

/* ----- Helper: add log messages ----- */
function addLog(state: GameState, ...msgs: string[]): string[] {
  const newLog = [...state.log, ...msgs];
  return newLog.slice(-50);
}

/* ----- Helper: check level up ----- */
function checkLevelUp(player: Player, log: string[]): { player: Player; log: string[] } {
  let p = { ...player };
  const newLog = [...log];

  while (p.xp >= p.xpToNext) {
    p.xp -= p.xpToNext;
    p.level++;
    p.xpToNext = Math.floor(p.xpToNext * 1.6);
    p.stats = {
      ...p.stats,
      maxHp: p.stats.maxHp + 8,
      hp: Math.min(p.stats.hp + 8, p.stats.maxHp + 8),
      atk: p.stats.atk + 2,
      def: p.stats.def + 1,
      spd: p.stats.spd + 1,
      int: p.stats.int + 1,
    };
    newLog.push(`>>> LEVEL UP! You are now level ${p.level} <<<`);
    newLog.push(`HP partially restored. Stats increased.`);
  }

  return { player: p, log: newLog };
}

function getHitMod(atk: number): number {
  return Math.floor(atk / 3);
}

function playerAttackRoll(player: Player, enemy: Enemy): { hit: boolean; roll: number; total: number; damage: number; crit: boolean; msgs: string[] } {
  const roll = rollD20();
  const mod = getHitMod(player.stats.atk);
  const total = roll + mod;
  const crit = roll === 20;
  const msgs: string[] = [];

  msgs.push(`🎲 Roll: d20(${roll}) + ${mod} = ${total} vs AC ${enemy.ac}`);

  if (roll === 1) {
    msgs.push("CRITICAL MISS! You stumble and miss entirely.");
    return { hit: false, roll, total, damage: 0, crit: false, msgs };
  }

  if (crit || total >= enemy.ac) {
    let damage = Math.max(1, player.stats.atk - Math.floor(enemy.stats.def / 3));
    if (crit) {
      damage = damage * 2;
      msgs.push(`CRITICAL HIT! ${damage} damage!`);
    } else {
      msgs.push(`Hit! ${damage} damage.`);
    }
    return { hit: true, roll, total, damage, crit, msgs };
  }

  msgs.push("Miss! Your attack fails to penetrate.");
  return { hit: false, roll, total, damage: 0, crit: false, msgs };
}

function enemyAttackRoll(enemy: Enemy, player: Player): { player: Player; msgs: string[] } {
  const roll = rollD20();
  const mod = getHitMod(enemy.stats.atk);
  const total = roll + mod;
  const playerAC = 10 + Math.floor(player.stats.def / 2) + Math.floor(player.stats.spd / 4);
  const msgs: string[] = [];

  msgs.push(`${enemy.name} rolls: d20(${roll}) + ${mod} = ${total} vs your AC ${playerAC}`);

  if (roll === 1) {
    msgs.push(`${enemy.name} fumbles!`);
    return { player, msgs };
  }

  const crit = roll === 20;
  if (crit || total >= playerAC) {
    let damage = Math.max(1, enemy.stats.atk - Math.floor(player.stats.def / 3));
    if (crit) {
      damage = damage * 2;
      msgs.push(`CRITICAL HIT! ${enemy.name} deals ${damage} damage!`);
    } else {
      msgs.push(`${enemy.name} hits for ${damage} damage.`);
    }
    const p = { ...player, stats: { ...player.stats, hp: player.stats.hp - damage } };
    return { player: p, msgs };
  }

  msgs.push(`${enemy.name} misses!`);
  return { player, msgs };
}

function isWalkable(state: GameState, x: number, y: number, floor: number): boolean {
  const map = state.maps[floor];
  if (y < 0 || y >= map.length) return false;
  const row = map[y];
  if (x < 0 || x >= row.length) return false;
  const ch = row[x];
  if (ch === "#") return false;
  if (ch === "D") {
    const door = state.doors.find((d) => d.x === x && d.y === y && d.floor === floor);
    if (door?.locked) return false;
  }
  return true;
}

function isTileFree(state: GameState, x: number, y: number, floor: number): boolean {
  if (!isWalkable(state, x, y, floor)) return false;
  if (state.player && state.player.x === x && state.player.y === y && state.player.floor === floor) return false;
  if (state.enemies.some(e => e.x === x && e.y === y && e.floor === floor && e.alive)) return false;
  if (state.npcs.some(n => n.x === x && n.y === y && n.floor === floor)) return false;
  return true;
}

const AGGRO_RANGE = 7;

function moveEnemies(state: GameState): GameState {
  if (!state.player || state.mode !== "EXPLORE") return state;
  const p = state.player;
  let newPlayer = { ...p, stats: { ...p.stats } };
  let log = [...state.log];
  let combatEnemy: Enemy | null = null;

  const movedEnemies = state.enemies.map(e => {
    if (!e.alive || e.floor !== p.floor || combatEnemy) return e;
    const dist = Math.abs(e.x - newPlayer.x) + Math.abs(e.y - newPlayer.y);
    if (dist <= 1) { combatEnemy = { ...e }; return e; }
    if (dist <= AGGRO_RANGE) {
      const dx = Math.sign(newPlayer.x - e.x);
      const dy = Math.sign(newPlayer.y - e.y);
      const moves = [
        { x: e.x + dx, y: e.y },
        { x: e.x, y: e.y + dy },
        { x: e.x + dx, y: e.y + dy },
      ].filter(m => dx !== 0 || m.x !== e.x || dy !== 0 || m.y !== e.y);
      for (const m of moves) {
        if (isTileFree({ ...state, player: newPlayer }, m.x, m.y, e.floor)) {
          return { ...e, x: m.x, y: m.y };
        }
      }
    }
    return e;
  });

  if (combatEnemy) {
    return {
      ...state,
      enemies: movedEnemies,
      player: newPlayer,
      mode: "COMBAT",
      currentEnemy: combatEnemy,
      log: addLog(
        { ...state, log },
        "",
        `═══ AMBUSH! ═══`,
        `${combatEnemy.isBoss ? "⚠ BOSS: " : ""}${combatEnemy.name} attacks you! [HP:${combatEnemy.stats.hp}/${combatEnemy.stats.maxHp} AC:${combatEnemy.ac}]`,
        "[A]ttack  [Q] Special  [F]lee  [1-9] Use item",
        ""
      ),
    };
  }

  return { ...state, enemies: movedEnemies, player: newPlayer, log };
}

function trySpawnEnemy(state: GameState): GameState {
  if (!state.player) return state;
  const newTimer = state.spawnTimer - 1;
  if (newTimer > 0) return { ...state, spawnTimer: newTimer };

  const map = state.maps[state.player.floor];
  const attempts = 30;
  for (let i = 0; i < attempts; i++) {
    const ry = Math.floor(Math.random() * map.length);
    const rx = Math.floor(Math.random() * (map[ry]?.length ?? 0));
    const dist = Math.abs(rx - state.player.x) + Math.abs(ry - state.player.y);
    if (dist > 10 && dist < 20 && isTileFree(state, rx, ry, state.player.floor)) {
      const newEnemy = createRandomEnemy(state.player.floor, rx, ry, `${state.turnCount}`);
      return {
        ...state,
        enemies: [...state.enemies, newEnemy],
        spawnTimer: 10 + Math.floor(Math.random() * 8),
        log: addLog(state, ">> Warning: new hostile process detected <<"),
      };
    }
  }
  return { ...state, spawnTimer: 3 };
}

/* ----- Main reducer ----- */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    /* === CLASS SELECTION === */
    case "SELECT_CLASS": {
      const cls = CLASS_DATA[action.className];
      const { playerStart } = parseFloor(0);
      const player: Player = {
        className: action.className,
        stats: { ...cls.stats },
        level: 1,
        xp: 0,
        xpToNext: 35,
        inventory: [],
        x: playerStart.x,
        y: playerStart.y,
        floor: 0,
        hasKeycard: false,
      };
      return {
        ...state,
        mode: "EXPLORE",
        player,
        log: addLog(
          state,
          "",
          `Class selected: ${action.className}`,
          cls.desc,
          `Special ability: ${cls.special}`,
          "",
          `--- ${FLOOR_NAMES[0]} ---`,
          "Use WASD/arrows to move. Enemies HUNT you.",
          "Combat uses D&D-style d20 hit rolls vs Armor Class.",
          "Press [I] for inventory, [Q] for special in combat.",
          ""
        ),
      };
    }

    /* === MOVEMENT === */
    case "MOVE": {
      if (state.mode !== "EXPLORE" || !state.player) return state;
      const p = state.player;
      const nx = p.x + action.dx;
      const ny = p.y + action.dy;

      // Check for locked door interaction
      const door = state.doors.find((d) => d.x === nx && d.y === ny && d.floor === p.floor);
      if (door?.locked) {
        if (p.hasKeycard) {
          const newDoors = state.doors.map((d) =>
            d === door ? { ...d, locked: false } : d
          );
          const newMaps = state.maps.map((m, i) => {
            if (i !== p.floor) return m;
            return m.map((row, ry) => {
              if (ry !== ny) return row;
              return row.substring(0, nx) + "." + row.substring(nx + 1);
            });
          });
          return {
            ...state,
            doors: newDoors,
            maps: newMaps,
            player: { ...p, hasKeycard: false },
            log: addLog(state, ">> KEYCARD used. Door unlocked. <<"),
          };
        }
        return { ...state, log: addLog(state, "Door is locked. Find a KEYCARD.") };
      }

      if (!isWalkable(state, nx, ny, p.floor)) return state;

      // Check for enemy at target
      const enemy = state.enemies.find(
        (e) => e.x === nx && e.y === ny && e.floor === p.floor && e.alive
      );
      if (enemy) {
        return {
          ...state,
          mode: "COMBAT",
          currentEnemy: { ...enemy },
          log: addLog(
            state,
            "",
            `═══ COMBAT ═══`,
            `${enemy.isBoss ? "⚠ BOSS: " : ""}${enemy.name} [HP:${enemy.stats.hp}/${enemy.stats.maxHp} AC:${enemy.ac}]`,
            "[A]ttack  [Q] Special  [F]lee  [1-9] Use item",
            ""
          ),
        };
      }

      // Check for NPC at target — interactive dialogue
      const npc = state.npcs.find((n) => n.x === nx && n.y === ny && n.floor === p.floor);
      if (npc) {
        const talkCount = npc.talkCount;
        const updatedNpcs = state.npcs.map((n) =>
          n.id === npc.id ? { ...n, talkCount: n.talkCount + 1 } : n
        );

        // After 3 conversations, NPC gets annoyed
        if (talkCount >= 3) {
          const annoyedLine = getAnnoyedLine();
          return {
            ...state,
            npcs: updatedNpcs,
            log: addLog(state, "", `${npc.name}: "${annoyedLine}"`, ""),
          };
        }

        // Show first dialogue node with choices
        const node = npc.dialogueTree[0];
        if (!node) return state;

        return {
          ...state,
          mode: "DIALOGUE",
          currentNPC: { ...npc, talkCount: talkCount + 1 },
          dialogueIndex: 0,
          dialogueChoices: node.choices || null,
          npcs: updatedNpcs,
          log: addLog(state, "", ...node.npcText, ""),
        };
      }

      // Move player
      const movedPlayer = { ...p, x: nx, y: ny };
      let newLog = state.log;
      let newGroundItems = state.groundItems;

      // Check for ground item pickup
      const gItem = state.groundItems.find(
        (i) => i.x === nx && i.y === ny && i.floor === p.floor && !i.picked
      );
      if (gItem) {
        newGroundItems = state.groundItems.map((i) =>
          i === gItem ? { ...i, picked: true } : i
        );
        if (gItem.type === "keycard") {
          movedPlayer.hasKeycard = true;
          newLog = addLog({ ...state, log: newLog }, `Picked up: ${gItem.name}`);
        } else if (gItem.type === "weapon") {
          movedPlayer.stats = { ...movedPlayer.stats, atk: movedPlayer.stats.atk + gItem.value };
          newLog = addLog({ ...state, log: newLog }, `Equipped: ${gItem.name} (+${gItem.value} ATK)`);
        } else if (gItem.type === "armor") {
          movedPlayer.stats = { ...movedPlayer.stats, def: movedPlayer.stats.def + gItem.value };
          newLog = addLog({ ...state, log: newLog }, `Equipped: ${gItem.name} (+${gItem.value} DEF)`);
        } else {
          movedPlayer.inventory = [...movedPlayer.inventory, { ...gItem }];
          newLog = addLog({ ...state, log: newLog }, `Picked up: ${gItem.name}`);
        }
      }

      // Check for stairs
      const map = state.maps[p.floor];
      if (map[ny]?.[nx] === ">") {
        const nextFloor = p.floor + 1;
        if (nextFloor >= FLOOR_MAPS.length) {
          return { ...state, mode: "WIN", log: addLog(state, "You escaped the mainframe!") };
        }
        const parsed = parseFloor(nextFloor);
        return {
          ...state,
          player: {
            ...movedPlayer,
            floor: nextFloor,
            x: parsed.playerStart.x,
            y: parsed.playerStart.y,
            hasKeycard: false,
          },
          enemies: [...state.enemies, ...parsed.enemies],
          npcs: [...state.npcs, ...parsed.npcs],
          groundItems: [...newGroundItems, ...parsed.groundItems],
          doors: [...state.doors, ...parsed.doors],
          log: addLog(
            { ...state, log: newLog },
            "",
            `>>> Descending to ${FLOOR_NAMES[nextFloor]} <<<`,
            ""
          ),
          turnCount: state.turnCount + 1,
        };
      }

      // After player moves, move enemies + try spawn
      let newState: GameState = {
        ...state,
        player: movedPlayer,
        groundItems: newGroundItems,
        log: newLog,
        turnCount: state.turnCount + 1,
      };

      newState = moveEnemies(newState);
      if (newState.mode === "EXPLORE") {
        newState = trySpawnEnemy(newState);
      }

      return newState;
    }

    /* === COMBAT: ATTACK === */
    case "ATTACK": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      const p = { ...state.player, stats: { ...state.player.stats } };
      let enemy = { ...state.currentEnemy, stats: { ...state.currentEnemy.stats } };
      let log = [...state.log];

      const atkResult = playerAttackRoll(p, enemy);
      log.push(...atkResult.msgs);

      if (atkResult.hit) {
        enemy.stats.hp -= atkResult.damage;
        log.push(`[Enemy HP: ${Math.max(0, enemy.stats.hp)}/${enemy.stats.maxHp}]`);
      }

      if (enemy.stats.hp <= 0) {
        enemy.alive = false;
        p.xp += enemy.xpReward;
        log.push(`${enemy.name} destroyed! +${enemy.xpReward} XP`);
        if (enemy.loot) { p.inventory.push(enemy.loot); log.push(`Loot: ${enemy.loot.name}`); }
        const { player: lvlP, log: lvlLog } = checkLevelUp(p, log);
        const newEnemies = state.enemies.map((e) => (e.id === enemy.id ? { ...e, alive: false } : e));
        if (enemy.isBoss) {
          return { ...state, mode: "WIN", player: lvlP, enemies: newEnemies, currentEnemy: null, log: [...lvlLog, "", "╔══════════════════════════════════════╗", "║     NEXUS DESTROYED — YOU WIN!      ║", "║   The mainframe is yours, runner.   ║", "╚══════════════════════════════════════╝"] };
        }
        return { ...state, mode: "EXPLORE", player: lvlP, enemies: newEnemies, currentEnemy: null, log: lvlLog };
      }

      const { player: hitP, msgs } = enemyAttackRoll(enemy, p);
      log.push(...msgs);
      if (hitP.stats.hp <= 0) {
        return { ...state, mode: "GAME_OVER", player: hitP, currentEnemy: null, log: [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<", "Press [R] to restart."] };
      }
      return { ...state, player: hitP, currentEnemy: enemy, log: log.slice(-50) };
    }

    /* === COMBAT: SPECIAL === */
    case "SPECIAL": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      const p = { ...state.player, stats: { ...state.player.stats } };
      let enemy = { ...state.currentEnemy, stats: { ...state.currentEnemy.stats } };
      let log = [...state.log];

      const bonusRoll = rollD20();
      let specialDmg = 0;
      switch (p.className) {
        case "Netrunner":
          specialDmg = p.stats.int * 2 + (bonusRoll >= 15 ? rollDice(8) : 0);
          log.push(`>> ICE Breaker! d20(${bonusRoll}) — ${specialDmg} pure damage ${bonusRoll >= 15 ? "(bonus!)" : ""} <<`);
          break;
        case "Cyborg":
          specialDmg = p.stats.atk * 3 - Math.floor(enemy.stats.def / 3) + (bonusRoll >= 15 ? rollDice(10) : 0);
          const recoil = Math.floor(p.stats.atk * 0.6);
          p.stats.hp -= recoil;
          log.push(`>> OVERCLOCK! d20(${bonusRoll}) — ${specialDmg} damage, ${recoil} recoil ${bonusRoll >= 15 ? "(bonus!)" : ""} <<`);
          break;
        case "Ghost":
          specialDmg = Math.floor(p.stats.atk * 2.5) + (bonusRoll >= 15 ? rollDice(6, 2) : 0);
          log.push(`>> BACKSTAB! d20(${bonusRoll}) — ${specialDmg} crit damage ${bonusRoll >= 15 ? "(bonus!)" : ""} <<`);
          break;
      }

      enemy.stats.hp -= Math.max(1, specialDmg);

      if (enemy.stats.hp <= 0) {
        enemy.alive = false;
        p.xp += enemy.xpReward;
        log.push(`${enemy.name} destroyed! +${enemy.xpReward} XP`);
        const { player: lvlP, log: lvlLog } = checkLevelUp(p, log);
        const newEnemies = state.enemies.map((e) => (e.id === enemy.id ? { ...e, alive: false } : e));
        if (enemy.isBoss) {
          return { ...state, mode: "WIN", player: lvlP, enemies: newEnemies, currentEnemy: null, log: [...lvlLog, "", "╔══════════════════════════════════════╗", "║     NEXUS DESTROYED — YOU WIN!      ║", "║   The mainframe is yours, runner.   ║", "╚══════════════════════════════════════╝"] };
        }
        return { ...state, mode: "EXPLORE", player: lvlP, enemies: newEnemies, currentEnemy: null, log: lvlLog };
      }

      const { player: hitP, msgs } = enemyAttackRoll(enemy, p);
      log.push(...msgs);
      if (hitP.stats.hp <= 0) {
        return { ...state, mode: "GAME_OVER", player: hitP, currentEnemy: null, log: [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<", "Press [R] to restart."] };
      }
      return { ...state, player: hitP, currentEnemy: enemy, log: log.slice(-50) };
    }

    /* === COMBAT: FLEE === */
    case "FLEE": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      const fleeRoll = rollD20();
      const fleeTarget = 10 - Math.floor(state.player.stats.spd / 3) + Math.floor(state.currentEnemy.stats.spd / 4);
      const log = [...state.log];
      log.push(`Flee roll: d20(${fleeRoll}) vs DC ${fleeTarget}`);

      if (fleeRoll >= fleeTarget) {
        return { ...state, mode: "EXPLORE", currentEnemy: null, log: addLog({ ...state, log }, "You escaped!") };
      }
      const { player: hitP, msgs } = enemyAttackRoll(state.currentEnemy, state.player);
      log.push("Failed to flee!", ...msgs);
      if (hitP.stats.hp <= 0) {
        return { ...state, mode: "GAME_OVER", player: hitP, currentEnemy: null, log: [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<", "Press [R] to restart."] };
      }
      return { ...state, player: hitP, log: log.slice(-50) };
    }

    /* === USE ITEM === */
    case "USE_ITEM": {
      if (!state.player) return state;
      const idx = action.itemIndex;
      if (idx < 0 || idx >= state.player.inventory.length) return state;
      const item = state.player.inventory[idx];
      const p = { ...state.player, stats: { ...state.player.stats } };
      let log = [...state.log];

      switch (item.type) {
        case "heal":
          p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + item.value);
          log.push(`Used ${item.name}. HP: ${p.stats.hp}/${p.stats.maxHp}`);
          break;
        case "emp":
          if (state.currentEnemy) {
            const enemy = { ...state.currentEnemy, stats: { ...state.currentEnemy.stats } };
            const empDmg = 25;
            enemy.stats.hp -= empDmg;
            enemy.stats.def = Math.max(0, enemy.stats.def - 3);
            log.push(`EMP blast! ${empDmg} damage, enemy DEF reduced.`);
            if (enemy.stats.hp <= 0) {
              enemy.alive = false;
              p.xp += enemy.xpReward;
              log.push(`${enemy.name} destroyed! +${enemy.xpReward} XP`);
              const { player: lvlP, log: lvlLog } = checkLevelUp(p, log);
              const newEnemies = state.enemies.map((e) => (e.id === enemy.id ? { ...e, alive: false } : e));
              p.inventory = p.inventory.filter((_, i) => i !== idx);
              return { ...state, mode: "EXPLORE", player: { ...lvlP, inventory: p.inventory }, enemies: newEnemies, currentEnemy: null, log: lvlLog };
            }
            p.inventory = p.inventory.filter((_, i) => i !== idx);
            return { ...state, player: p, currentEnemy: enemy, log: log.slice(-50) };
          }
          log.push("No target for EMP.");
          break;
        default:
          log.push(`Can't use ${item.name} right now.`);
          return { ...state, log: log.slice(-50) };
      }

      p.inventory = p.inventory.filter((_, i) => i !== idx);
      return { ...state, player: p, log: log.slice(-50) };
    }

    /* === DIALOGUE: advance (no choices, just close) === */
    case "ADVANCE_DIALOGUE": {
      if (state.mode !== "DIALOGUE") return state;
      return {
        ...state,
        mode: "EXPLORE",
        currentNPC: null,
        dialogueChoices: null,
        log: addLog(state, "[End of transmission]"),
      };
    }

    /* === DIALOGUE: select a choice === */
    case "SELECT_DIALOGUE_CHOICE": {
      if (state.mode !== "DIALOGUE" || !state.dialogueChoices) return state;
      const choice = state.dialogueChoices[action.choiceIndex];
      if (!choice) return state;

      return {
        ...state,
        dialogueChoices: null, // choices consumed, now show response
        log: addLog(state, `> ${choice.label}`, "", ...choice.response, "", "[Press ENTER to close]"),
      };
    }

    /* === INVENTORY === */
    case "TOGGLE_INVENTORY": {
      if (state.mode === "INVENTORY") {
        return { ...state, mode: "EXPLORE" };
      }
      if (state.mode === "EXPLORE" && state.player) {
        const invLines = state.player.inventory.length === 0
          ? ["Inventory is empty."]
          : state.player.inventory.map((item, i) => `  [${i + 1}] ${item.name} — ${item.description}`);
        return {
          ...state,
          mode: "INVENTORY",
          log: addLog(state, "", "═══ INVENTORY ═══", ...invLines, "", "Press [I] to close. [1-9] to use item."),
        };
      }
      return state;
    }

    /* === RESTART === */
    case "RESTART": {
      return createInitialState();
    }

    default:
      return state;
  }
}
