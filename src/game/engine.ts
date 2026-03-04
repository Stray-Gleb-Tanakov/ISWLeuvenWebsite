/* =====================================================
   CYBERPUNK TERMINAL RPG — Game Engine (Reducer)
   Mana, status effects, stealth, combos, puzzles
   ==================================================== */

import type { GameState, GameAction, Player, Enemy, StatusEffect, TrapTile } from "./types";
import { CLASS_DATA, parseFloor, FLOOR_MAPS, FLOOR_NAMES, createRandomEnemy, getAnnoyedLine, TRAP_DATA } from "./data";

/* ----- Dice rolling ----- */
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollDice(sides: number, count: number = 1): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  return total;
}

/* ----- Status effect helpers ----- */
function tickStatusEffects(effects: StatusEffect[]): { effects: StatusEffect[]; damage: number; stunned: boolean; msgs: string[] } {
  let damage = 0;
  let stunned = false;
  const msgs: string[] = [];
  const remaining: StatusEffect[] = [];

  for (const eff of effects) {
    const left = eff.turnsLeft - 1;
    switch (eff.type) {
      case "poison":
        damage += eff.damage || 3;
        msgs.push(`☠ Poison deals ${eff.damage || 3} damage`);
        break;
      case "burn":
        damage += eff.damage || 5;
        msgs.push(`🔥 Burn deals ${eff.damage || 5} damage`);
        break;
      case "bleed":
        damage += eff.damage || 4;
        msgs.push(`🩸 Bleed deals ${eff.damage || 4} damage`);
        break;
      case "stun":
        stunned = true;
        msgs.push(`💫 Stunned! Cannot act.`);
        break;
      case "slow":
        msgs.push(`🐌 Slowed...`);
        break;
    }
    if (left > 0) remaining.push({ ...eff, turnsLeft: left });
  }

  return { effects: remaining, damage, stunned, msgs };
}

function applyStatusDamage(entity: { stats: { hp: number } }, damage: number) {
  entity.stats.hp -= damage;
}

function hasStatus(effects: StatusEffect[], type: string): boolean {
  return effects.some(e => e.type === type);
}

/* ----- Helper: create initial state ----- */
export function createInitialState(): GameState {
  const { cleanMap, enemies, npcs, groundItems, doors, puzzles, traps } = parseFloor(0);
  const allMaps = [cleanMap];
  const allTraps: TrapTile[] = [...traps];

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
      "║   MAINFRAME BREACH — v4.0.0         ║",
      "║   A Cyberpunk Terminal RPG           ║",
      "║   6 Floors · Mini-Bosses · Traps    ║",
      "║   Vigenère Ciphers · D&D Dice       ║",
      "╚══════════════════════════════════════╝",
      "",
      "You wake up inside a corrupted mainframe.",
      "Your memories are fragmented. You must escape.",
      "Six floors stand between you and freedom.",
      "Select your class to begin...",
    ],
    currentEnemy: null,
    currentNPC: null,
    dialogueIndex: 0,
    dialogueChoices: null,
    doors,
    turnCount: 0,
    spawnTimer: 8 + Math.floor(Math.random() * 5),
    puzzles,
    currentPuzzle: null,
    puzzleInput: "",
    traps: allTraps,
  };
}

/* ----- Helper: add log messages ----- */
function addLog(state: GameState, ...msgs: string[]): string[] {
  const newLog = [...state.log, ...msgs];
  return newLog.slice(-60);
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
      maxMp: p.stats.maxMp + 5,
      mp: Math.min(p.stats.mp + 5, p.stats.maxMp + 5),
      atk: p.stats.atk + 2,
      def: p.stats.def + 1,
      spd: p.stats.spd + 1,
      int: p.stats.int + 1,
    };
    newLog.push(`>>> LEVEL UP! You are now level ${p.level} <<<`);
    newLog.push(`HP & MP partially restored. Stats increased.`);
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
    // Combo bonus
    const comboBonus = Math.floor(player.comboCount * 0.15 * damage);
    damage += comboBonus;
    if (crit) {
      damage = damage * 2;
      msgs.push(`CRITICAL HIT! ${damage} damage!`);
    } else {
      if (comboBonus > 0) msgs.push(`Combo x${player.comboCount + 1}! +${comboBonus} bonus damage`);
      msgs.push(`Hit! ${damage} damage.`);
    }
    return { hit: true, roll, total, damage, crit, msgs };
  }

  msgs.push("Miss! Your attack fails to penetrate.");
  return { hit: false, roll, total, damage: 0, crit: false, msgs };
}

function enemyAttackRoll(enemy: Enemy, player: Player): { player: Player; msgs: string[]; statusApplied?: string } {
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
    
    // Apply on-hit status effect
    if (enemy.onHitEffect && !hasStatus(p.statusEffects, enemy.onHitEffect) && Math.random() < 0.4) {
      const eff: StatusEffect = {
        type: enemy.onHitEffect,
        turnsLeft: enemy.onHitEffect === "stun" ? 1 : 3,
        damage: enemy.onHitEffect === "burn" ? 5 : enemy.onHitEffect === "poison" ? 3 : enemy.onHitEffect === "bleed" ? 4 : 0,
      };
      p.statusEffects = [...p.statusEffects, eff];
      const icons: Record<string, string> = { poison: "☠", burn: "🔥", stun: "💫", slow: "🐌", bleed: "🩸" };
      msgs.push(`${icons[enemy.onHitEffect]} ${enemy.onHitEffect.toUpperCase()} applied!`);
    }
    
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

  // If player is stealthed, reduce aggro range
  const effectiveAggro = p.stealthMode ? Math.max(2, AGGRO_RANGE - Math.floor(p.stealth / 20)) : AGGRO_RANGE;

  const movedEnemies = state.enemies.map(e => {
    if (!e.alive || e.floor !== p.floor || combatEnemy) return e;
    const dist = Math.abs(e.x - newPlayer.x) + Math.abs(e.y - newPlayer.y);
    if (dist <= 1) { combatEnemy = { ...e }; return e; }
    if (dist <= effectiveAggro) {
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
    // Backstab bonus if stealthed
    const backstab = p.stealthMode && p.stealth > 50;
    const logMsgs = [
      "",
      backstab ? `═══ BACKSTAB AMBUSH! ═══` : `═══ AMBUSH! ═══`,
      `${combatEnemy.isBoss ? "⚠ BOSS: " : ""}${combatEnemy.name} [HP:${combatEnemy.stats.hp}/${combatEnemy.stats.maxHp} AC:${combatEnemy.ac}]`,
      "[A]ttack  [Q] Special  [F]lee  [1-9] Use item",
      "",
    ];

    if (backstab) {
      // Free backstab damage
      const bsDmg = Math.floor(p.stats.atk * 2);
      combatEnemy = { ...combatEnemy, stats: { ...combatEnemy.stats, hp: combatEnemy.stats.hp - bsDmg } };
      logMsgs.splice(2, 0, `🗡 Backstab! ${bsDmg} sneak damage!`);
    }

    return {
      ...state,
      enemies: movedEnemies,
      player: { ...newPlayer, stealthMode: false, stealth: 0, comboCount: 0 },
      mode: "COMBAT",
      currentEnemy: combatEnemy,
      log: addLog({ ...state, log }, ...logMsgs),
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

/* ----- Tick cooldowns ----- */
function tickCooldowns(player: Player): Player {
  return {
    ...player,
    skills: player.skills.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1),
    })),
  };
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
        statusEffects: [],
        skills: cls.skills.map(s => ({ ...s })),
        stealth: 0,
        stealthMode: false,
        comboCount: 0,
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
          `MP: ${cls.stats.maxMp} | Skills: ${cls.skills.map(s => s.name).join(", ")}`,
          "",
          `--- ${FLOOR_NAMES[0]} ---`,
          "WASD/arrows: Move | I: Inventory | S: Stealth",
          "Combat: A:Attack Q:Special 1-3:Skills F:Flee",
          "Walk into T (terminals) to solve cipher puzzles.",
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

      // Stealth meter increases while moving stealthed
      let stealthUpdate = { ...p };
      if (p.stealthMode) {
        const newStealth = Math.max(0, p.stealth - 3);
        stealthUpdate = { ...stealthUpdate, stealth: newStealth };
        if (newStealth <= 0) {
          stealthUpdate.stealthMode = false;
          return { ...state, player: stealthUpdate, log: addLog(state, "⚠ Stealth depleted! You've been detected!") };
        }
      }

      // Check for puzzle terminal
      const puzzle = state.puzzles.find(pz => pz.x === nx && pz.y === ny && pz.floor === p.floor && !pz.solved);
      if (puzzle) {
        return {
          ...state,
          mode: "PUZZLE",
          currentPuzzle: puzzle,
          puzzleInput: "",
          player: stealthUpdate,
          log: addLog(state, "", "═══ TERMINAL HACK ═══", `Type: ${puzzle.type.toUpperCase()} cipher`, puzzle.hint, "", "Type the decrypted answer. [ESC] to quit."),
        };
      }

      // Check for locked door interaction
      const door = state.doors.find((d) => d.x === nx && d.y === ny && d.floor === p.floor);
      if (door?.locked) {
        if (p.hasKeycard) {
          const newDoors = state.doors.map((d) => d === door ? { ...d, locked: false } : d);
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
            player: { ...stealthUpdate, hasKeycard: false },
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
        const backstab = p.stealthMode && p.stealth > 30;
        let combatEnemy = { ...enemy, stats: { ...enemy.stats }, statusEffects: [...enemy.statusEffects] };
        const logMsgs = [
          "",
          backstab ? `═══ BACKSTAB! ═══` : `═══ COMBAT ═══`,
          `${enemy.isBoss ? "⚠ BOSS: " : ""}${enemy.name} [HP:${enemy.stats.hp}/${enemy.stats.maxHp} AC:${enemy.ac}]`,
          "[A]ttack  [Q] Special  [F]lee  [1-9] Use item",
          "",
        ];

        if (backstab) {
          const bsDmg = Math.floor(p.stats.atk * 2.5);
          combatEnemy.stats.hp -= bsDmg;
          logMsgs.splice(2, 0, `🗡 Backstab strike! ${bsDmg} sneak damage!`);
        }

        return {
          ...state,
          mode: "COMBAT",
          currentEnemy: combatEnemy,
          player: { ...stealthUpdate, stealthMode: false, stealth: 0, comboCount: 0 },
          log: addLog(state, ...logMsgs),
        };
      }

      // Check for NPC at target
      const npc = state.npcs.find((n) => n.x === nx && n.y === ny && n.floor === p.floor);
      if (npc) {
        const talkCount = npc.talkCount;
        const updatedNpcs = state.npcs.map((n) =>
          n.id === npc.id ? { ...n, talkCount: n.talkCount + 1 } : n
        );

        if (talkCount >= 3) {
          const annoyedLine = getAnnoyedLine();
          return { ...state, npcs: updatedNpcs, log: addLog(state, "", `${npc.name}: "${annoyedLine}"`, "") };
        }

        const node = npc.dialogueTree[0];
        if (!node) return state;

        return {
          ...state,
          mode: "DIALOGUE",
          currentNPC: { ...npc, talkCount: talkCount + 1 },
          dialogueIndex: 0,
          dialogueChoices: node.choices || null,
          npcs: updatedNpcs,
          player: stealthUpdate,
          log: addLog(state, "", ...node.npcText, ""),
        };
      }

      // Move player
      const movedPlayer = { ...stealthUpdate, x: nx, y: ny };
      let newLog = state.log;
      let newGroundItems = state.groundItems;

      // Check for ground item pickup
      const gItem = state.groundItems.find(
        (i) => i.x === nx && i.y === ny && i.floor === p.floor && !i.picked
      );
      if (gItem) {
        newGroundItems = state.groundItems.map((i) => i === gItem ? { ...i, picked: true } : i);
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

      // Check for trap
      let newTraps = state.traps;
      const trap = state.traps.find(t => t.x === nx && t.y === ny && t.floor === p.floor && !t.triggered);
      if (trap) {
        const trapInfo = TRAP_DATA[p.floor] || TRAP_DATA[0];
        movedPlayer.stats = { ...movedPlayer.stats, hp: movedPlayer.stats.hp - trapInfo.damage };
        newLog = addLog({ ...state, log: newLog }, trapInfo.message);
        newTraps = state.traps.map(t => t === trap ? { ...t, triggered: true } : t);
        if (trapInfo.statusEffect) {
          const eff = { type: trapInfo.statusEffect, turnsLeft: 3, damage: trapInfo.statusEffect === "burn" ? 5 : trapInfo.statusEffect === "poison" ? 3 : 0 };
          movedPlayer.statusEffects = [...movedPlayer.statusEffects, eff];
        }
        if (movedPlayer.stats.hp <= 0) {
          return { ...state, mode: "GAME_OVER", player: movedPlayer, traps: newTraps, log: addLog({ ...state, log: newLog }, "", ">>> SYSTEM FAILURE — YOU DIED <<<", "Press [R] to restart.") };
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
          puzzles: [...state.puzzles, ...parsed.puzzles],
          traps: [...newTraps, ...parsed.traps],
          log: addLog({ ...state, log: newLog }, "", `>>> Descending to ${FLOOR_NAMES[nextFloor]} <<<`, ""),
          turnCount: state.turnCount + 1,
        };
      }

      // After player moves, move enemies + try spawn
      let newState: GameState = {
        ...state,
        player: movedPlayer,
        groundItems: newGroundItems,
        traps: newTraps,
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
      let p = { ...state.player, stats: { ...state.player.stats }, statusEffects: [...state.player.statusEffects] };
      let enemy = { ...state.currentEnemy, stats: { ...state.currentEnemy.stats }, statusEffects: [...(state.currentEnemy.statusEffects || [])] };
      let log = [...state.log];

      // Tick player status effects
      const playerTick = tickStatusEffects(p.statusEffects);
      p.statusEffects = playerTick.effects;
      applyStatusDamage(p, playerTick.damage);
      log.push(...playerTick.msgs);

      if (p.stats.hp <= 0) {
        return { ...state, mode: "GAME_OVER", player: p, currentEnemy: null, log: [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<", "Press [R] to restart."] };
      }

      if (playerTick.stunned) {
        // Enemy still attacks
        const { player: hitP, msgs } = enemyAttackRoll(enemy, p);
        log.push("You're stunned and can't attack!", ...msgs);
        if (hitP.stats.hp <= 0) {
          return { ...state, mode: "GAME_OVER", player: hitP, currentEnemy: null, log: [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<", "Press [R] to restart."] };
        }
        return { ...state, player: hitP, currentEnemy: enemy, log: log.slice(-60) };
      }

      const atkResult = playerAttackRoll(p, enemy);
      log.push(...atkResult.msgs);

      if (atkResult.hit) {
        enemy.stats.hp -= atkResult.damage;
        p.comboCount += 1;
        log.push(`[Enemy HP: ${Math.max(0, enemy.stats.hp)}/${enemy.stats.maxHp}]`);
      } else {
        p.comboCount = 0; // combo broken
      }

      // Tick enemy status effects
      const enemyTick = tickStatusEffects(enemy.statusEffects);
      enemy.statusEffects = enemyTick.effects;
      applyStatusDamage(enemy, enemyTick.damage);
      log.push(...enemyTick.msgs);

      if (enemy.stats.hp <= 0) {
        enemy.alive = false;
        p.xp += enemy.xpReward;
        log.push(`${enemy.name} destroyed! +${enemy.xpReward} XP`);
        if (enemy.loot) { p.inventory.push(enemy.loot); log.push(`Loot: ${enemy.loot.name}`); }
        p.comboCount = 0;
        p = tickCooldowns(p);
        const { player: lvlP, log: lvlLog } = checkLevelUp(p, log);
        const newEnemies = state.enemies.map((e) => (e.id === enemy.id ? { ...e, alive: false } : e));
        if (enemy.isBoss && enemy.name.includes("NEXUS")) {
          return { ...state, mode: "WIN", player: lvlP, enemies: newEnemies, currentEnemy: null, log: [...lvlLog, "", "╔══════════════════════════════════════╗", "║     NEXUS DESTROYED — YOU WIN!      ║", "║   The mainframe is yours, runner.   ║", "╚══════════════════════════════════════╝"] };
        }
        if (enemy.isBoss) {
          lvlLog.push(`>>> MINI-BOSS ${enemy.name} DEFEATED! <<<`);
          if (enemy.loot) lvlLog.push(`Legendary loot: ${enemy.loot.name}!`);
        }
        return { ...state, mode: "EXPLORE", player: lvlP, enemies: newEnemies, currentEnemy: null, log: lvlLog };
      }

      const { player: hitP, msgs } = enemyAttackRoll(enemy, p);
      log.push(...msgs);
      if (hitP.stats.hp <= 0) {
        return { ...state, mode: "GAME_OVER", player: hitP, currentEnemy: null, log: [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<", "Press [R] to restart."] };
      }
      return { ...state, player: hitP, currentEnemy: enemy, log: log.slice(-60) };
    }

    /* === COMBAT: SPECIAL (Q — skill 0, costs MP) === */
    case "SPECIAL": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      let p = { ...state.player, stats: { ...state.player.stats }, statusEffects: [...state.player.statusEffects], skills: state.player.skills.map(s => ({ ...s })) };
      let enemy = { ...state.currentEnemy, stats: { ...state.currentEnemy.stats }, statusEffects: [...(state.currentEnemy.statusEffects || [])] };
      let log = [...state.log];

      const skill = p.skills[0];
      if (!skill) return state;

      if (skill.currentCooldown > 0) {
        return { ...state, log: addLog(state, `${skill.name} on cooldown (${skill.currentCooldown} turns)`) };
      }
      if (p.stats.mp < skill.mpCost) {
        return { ...state, log: addLog(state, `Not enough MP! Need ${skill.mpCost}, have ${p.stats.mp}`) };
      }

      p.stats.mp -= skill.mpCost;
      p.skills[0] = { ...skill, currentCooldown: skill.cooldown };

      const bonusRoll = rollD20();
      let specialDmg = 0;
      switch (p.className) {
        case "Netrunner":
          specialDmg = p.stats.int * 2 + (bonusRoll >= 15 ? rollDice(8) : 0);
          log.push(`>> ICE Breaker! d20(${bonusRoll}) — ${specialDmg} pure damage ${bonusRoll >= 15 ? "(bonus!)" : ""} [-${skill.mpCost} MP] <<`);
          break;
        case "Cyborg":
          specialDmg = p.stats.atk * 3 - Math.floor(enemy.stats.def / 3) + (bonusRoll >= 15 ? rollDice(10) : 0);
          const recoil = Math.floor(p.stats.atk * 0.6);
          p.stats.hp -= recoil;
          log.push(`>> OVERCLOCK! d20(${bonusRoll}) — ${specialDmg} damage, ${recoil} recoil [-${skill.mpCost} MP] <<`);
          break;
        case "Ghost":
          specialDmg = Math.floor(p.stats.atk * 2.5) + (bonusRoll >= 15 ? rollDice(6, 2) : 0);
          log.push(`>> BACKSTAB! d20(${bonusRoll}) — ${specialDmg} crit damage [-${skill.mpCost} MP] <<`);
          break;
      }

      enemy.stats.hp -= Math.max(1, specialDmg);
      p.comboCount += 1;

      // Tick enemy DoTs
      const enemyTick = tickStatusEffects(enemy.statusEffects);
      enemy.statusEffects = enemyTick.effects;
      applyStatusDamage(enemy, enemyTick.damage);
      log.push(...enemyTick.msgs);

      if (enemy.stats.hp <= 0) {
        enemy.alive = false;
        p.xp += enemy.xpReward;
        log.push(`${enemy.name} destroyed! +${enemy.xpReward} XP`);
        p.comboCount = 0;
        const { player: lvlP, log: lvlLog } = checkLevelUp(p, log);
        const newEnemies = state.enemies.map((e) => (e.id === enemy.id ? { ...e, alive: false } : e));
        if (enemy.isBoss && enemy.name.includes("NEXUS")) {
          return { ...state, mode: "WIN", player: lvlP, enemies: newEnemies, currentEnemy: null, log: [...lvlLog, "", "╔══════════════════════════════════════╗", "║     NEXUS DESTROYED — YOU WIN!      ║", "╚══════════════════════════════════════╝"] };
        }
        return { ...state, mode: "EXPLORE", player: lvlP, enemies: newEnemies, currentEnemy: null, log: lvlLog };
      }

      const { player: hitP, msgs } = enemyAttackRoll(enemy, p);
      log.push(...msgs);
      if (hitP.stats.hp <= 0) {
        return { ...state, mode: "GAME_OVER", player: hitP, currentEnemy: null, log: [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<"] };
      }
      return { ...state, player: hitP, currentEnemy: enemy, log: log.slice(-60) };
    }

    /* === COMBAT: SKILL (1-3 mapped to skills) === */
    case "SKILL": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      let p = { ...state.player, stats: { ...state.player.stats }, statusEffects: [...state.player.statusEffects], skills: state.player.skills.map(s => ({ ...s })) };
      let enemy = { ...state.currentEnemy, stats: { ...state.currentEnemy.stats }, statusEffects: [...(state.currentEnemy.statusEffects || [])] };
      let log = [...state.log];

      const skillIdx = action.skillIndex;
      const skill = p.skills[skillIdx];
      if (!skill) return state;

      if (skill.currentCooldown > 0) {
        return { ...state, log: addLog(state, `${skill.name} on cooldown (${skill.currentCooldown} turns)`) };
      }
      if (p.stats.mp < skill.mpCost) {
        return { ...state, log: addLog(state, `Not enough MP! Need ${skill.mpCost}, have ${p.stats.mp}`) };
      }

      p.stats.mp -= skill.mpCost;
      p.skills[skillIdx] = { ...skill, currentCooldown: skill.cooldown };

      // Execute skill based on name
      switch (skill.name) {
        case "Virus Upload": {
          const eff: StatusEffect = { type: "poison", turnsLeft: 3, damage: 5 };
          enemy.statusEffects = [...enemy.statusEffects, eff];
          log.push(`>> Virus Upload! Enemy poisoned for 3 turns [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Firewall": {
          p.stats.def += 5;
          log.push(`>> Firewall activated! +5 DEF for this fight [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Chrome Slam": {
          const dmg = Math.floor(p.stats.atk * 1.5);
          enemy.stats.hp -= dmg;
          enemy.statusEffects = [...enemy.statusEffects, { type: "stun", turnsLeft: 1 }];
          log.push(`>> Chrome Slam! ${dmg} damage + STUN [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Repair Nanites": {
          const heal = Math.floor(p.stats.maxHp * 0.25);
          p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + heal);
          log.push(`>> Repair Nanites! Healed ${heal} HP [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Smoke Bomb": {
          log.push(`>> Smoke Bomb! Guaranteed escape [-${skill.mpCost} MP] <<`);
          return { ...state, mode: "EXPLORE", player: { ...p, stealthMode: true, stealth: 80 }, currentEnemy: null, log: addLog({ ...state, log }, ...log.slice(-5), "You vanish into the smoke!") };
        }
        case "Poison Blade": {
          const dmg = p.stats.atk + rollDice(6);
          enemy.stats.hp -= dmg;
          enemy.statusEffects = [...enemy.statusEffects, { type: "poison", turnsLeft: 3, damage: 4 }];
          log.push(`>> Poison Blade! ${dmg} damage + POISON [-${skill.mpCost} MP] <<`);
          break;
        }
        // ICE Breaker, Overclock, Backstab handled by SPECIAL action
        default: {
          log.push(`>> ${skill.name} used [-${skill.mpCost} MP] <<`);
          break;
        }
      }

      if (enemy.stats.hp <= 0) {
        enemy.alive = false;
        p.xp += enemy.xpReward;
        log.push(`${enemy.name} destroyed! +${enemy.xpReward} XP`);
        p.comboCount = 0;
        const { player: lvlP, log: lvlLog } = checkLevelUp(p, log);
        const newEnemies = state.enemies.map((e) => (e.id === enemy.id ? { ...e, alive: false } : e));
        return { ...state, mode: "EXPLORE", player: lvlP, enemies: newEnemies, currentEnemy: null, log: lvlLog };
      }

      // Enemy stunned = skip their attack
      if (hasStatus(enemy.statusEffects, "stun")) {
        log.push(`${enemy.name} is stunned!`);
        return { ...state, player: p, currentEnemy: enemy, log: log.slice(-60) };
      }

      const { player: hitP, msgs } = enemyAttackRoll(enemy, p);
      log.push(...msgs);
      if (hitP.stats.hp <= 0) {
        return { ...state, mode: "GAME_OVER", player: hitP, currentEnemy: null, log: [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<"] };
      }
      return { ...state, player: hitP, currentEnemy: enemy, log: log.slice(-60) };
    }

    /* === COMBAT: FLEE === */
    case "FLEE": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      const fleeRoll = rollD20();
      const slowPenalty = hasStatus(state.player.statusEffects, "slow") ? 4 : 0;
      const fleeTarget = 10 - Math.floor(state.player.stats.spd / 3) + Math.floor(state.currentEnemy.stats.spd / 4) + slowPenalty;
      const log = [...state.log];
      log.push(`Flee roll: d20(${fleeRoll}) vs DC ${fleeTarget}${slowPenalty ? " (slowed!)" : ""}`);

      if (fleeRoll >= fleeTarget) {
        return { ...state, mode: "EXPLORE", currentEnemy: null, player: { ...state.player, comboCount: 0 }, log: addLog({ ...state, log }, "You escaped!") };
      }
      const { player: hitP, msgs } = enemyAttackRoll(state.currentEnemy, state.player);
      log.push("Failed to flee!", ...msgs);
      if (hitP.stats.hp <= 0) {
        return { ...state, mode: "GAME_OVER", player: hitP, currentEnemy: null, log: [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<"] };
      }
      return { ...state, player: hitP, log: log.slice(-60) };
    }

    /* === USE ITEM === */
    case "USE_ITEM": {
      if (!state.player) return state;
      const idx = action.itemIndex;
      if (idx < 0 || idx >= state.player.inventory.length) return state;
      const item = state.player.inventory[idx];
      const p = { ...state.player, stats: { ...state.player.stats }, statusEffects: [...state.player.statusEffects] };
      let log = [...state.log];

      switch (item.type) {
        case "heal":
          p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + item.value);
          log.push(`Used ${item.name}. HP: ${p.stats.hp}/${p.stats.maxHp}`);
          break;
        case "mana":
          p.stats.mp = Math.min(p.stats.maxMp, p.stats.mp + item.value);
          log.push(`Used ${item.name}. MP: ${p.stats.mp}/${p.stats.maxMp}`);
          break;
        case "antidote":
          p.statusEffects = [];
          log.push(`Used ${item.name}. All status effects cleared!`);
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
            return { ...state, player: p, currentEnemy: enemy, log: log.slice(-60) };
          }
          log.push("No target for EMP.");
          break;
        default:
          log.push(`Can't use ${item.name} right now.`);
          return { ...state, log: log.slice(-60) };
      }

      p.inventory = p.inventory.filter((_, i) => i !== idx);
      return { ...state, player: p, log: log.slice(-60) };
    }

    /* === STEALTH TOGGLE === */
    case "TOGGLE_STEALTH": {
      if (state.mode !== "EXPLORE" || !state.player) return state;
      const p = state.player;
      if (p.stealthMode) {
        return { ...state, player: { ...p, stealthMode: false }, log: addLog(state, "Stealth mode OFF.") };
      }
      return { ...state, player: { ...p, stealthMode: true, stealth: 100 }, log: addLog(state, "🕶 Stealth mode ON. Detection meter: 100") };
    }

    /* === PUZZLE INPUT === */
    case "PUZZLE_INPUT": {
      if (state.mode !== "PUZZLE") return state;
      const char = action.char.toUpperCase();
      if (char.length === 1 && char >= "A" && char <= "Z") {
        return { ...state, puzzleInput: state.puzzleInput + char };
      }
      return state;
    }

    case "PUZZLE_BACKSPACE": {
      if (state.mode !== "PUZZLE") return state;
      return { ...state, puzzleInput: state.puzzleInput.slice(0, -1) };
    }

    case "PUZZLE_SUBMIT": {
      if (state.mode !== "PUZZLE" || !state.currentPuzzle || !state.player) return state;
      const puzzle = state.currentPuzzle;
      if (state.puzzleInput.toUpperCase() === puzzle.plainText.toUpperCase()) {
        const p = { ...state.player, stats: { ...state.player.stats } };
        p.xp += puzzle.rewardXp;
        let log = addLog(state, "", `>>> DECRYPTED: ${puzzle.plainText} <<<`, `+${puzzle.rewardXp} XP!`);
        if (puzzle.reward) {
          p.inventory = [...p.inventory, puzzle.reward];
          log = [...log, `Reward: ${puzzle.reward.name}`];
        }
        const { player: lvlP, log: lvlLog } = checkLevelUp(p, log);
        const newPuzzles = state.puzzles.map(pz => pz.id === puzzle.id ? { ...pz, solved: true } : pz);
        return { ...state, mode: "EXPLORE", player: lvlP, currentPuzzle: null, puzzleInput: "", puzzles: newPuzzles, log: lvlLog };
      }
      return { ...state, puzzleInput: "", log: addLog(state, `Wrong! "${state.puzzleInput}" is incorrect. Try again.`) };
    }

    case "PUZZLE_QUIT": {
      if (state.mode !== "PUZZLE") return state;
      return { ...state, mode: "EXPLORE", currentPuzzle: null, puzzleInput: "", log: addLog(state, "Terminal hack aborted.") };
    }

    /* === DIALOGUE === */
    case "ADVANCE_DIALOGUE": {
      if (state.mode !== "DIALOGUE") return state;
      return { ...state, mode: "EXPLORE", currentNPC: null, dialogueChoices: null, log: addLog(state, "[End of transmission]") };
    }

    case "SELECT_DIALOGUE_CHOICE": {
      if (state.mode !== "DIALOGUE" || !state.dialogueChoices) return state;
      const choice = state.dialogueChoices[action.choiceIndex];
      if (!choice) return state;
      return { ...state, dialogueChoices: null, log: addLog(state, `> ${choice.label}`, "", ...choice.response, "", "[Press ENTER to close]") };
    }

    /* === INVENTORY === */
    case "TOGGLE_INVENTORY": {
      if (state.mode === "INVENTORY") {
        return { ...state, mode: "EXPLORE" };
      }
      if (state.mode === "EXPLORE" && state.player) {
        const p = state.player;
        const invLines = p.inventory.length === 0
          ? ["Inventory is empty."]
          : p.inventory.map((item, i) => `  [${i + 1}] ${item.name} — ${item.description}`);

        const skillLines = p.skills.map((s, i) => {
          const cdText = s.currentCooldown > 0 ? ` (CD:${s.currentCooldown})` : "";
          return `  [${i + 1}] ${s.name} — ${s.mpCost}MP${cdText} — ${s.description}`;
        });

        const statusLines = p.statusEffects.length > 0
          ? p.statusEffects.map(e => `  ${e.type.toUpperCase()} (${e.turnsLeft} turns)`)
          : ["  None"];

        return {
          ...state,
          mode: "INVENTORY",
          log: addLog(state, "",
            "═══ INVENTORY ═══",
            ...invLines,
            "",
            "═══ SKILLS ═══",
            ...skillLines,
            "",
            "═══ STATUS EFFECTS ═══",
            ...statusLines,
            "",
            `MP: ${p.stats.mp}/${p.stats.maxMp} | Stealth: ${p.stealthMode ? `ON (${p.stealth})` : "OFF"}`,
            "",
            "Press [I] to close. [1-9] to use item.",
          ),
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
