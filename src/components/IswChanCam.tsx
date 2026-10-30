import { useEffect, useState } from "react";
import type { GameState } from "@/game/types";
import { ISW_CHAN_TAG, moodOf } from "@/game/iswchan";
import type { IswEyes, IswMouth } from "@/game/portraits";
import IswChanPortrait from "@/components/IswChanPortrait";

/* ISW-Chan's camera in the HUD: her portrait, with expressions that react to the run.
   Expressions follow her mood (docs/isw-chan-canon.md). */

const FACES = {
  watch: { eyes: "open", mouth: "neutral", say: "watching." },
  smug: { eyes: "half", mouth: "smirk", say: "hehe." },
  laugh: { eyes: "happy", mouth: "grin", say: "HAHAHA" },
  pout: { eyes: "angry", mouth: "frown", say: "...lucky." },
  shock: { eyes: "wide", mouth: "o", say: "WHAT" },
  worried: { eyes: "sad", mouth: "frown", say: "careful!" },
  bored: { eyes: "closed", mouth: "flat", say: "zzz..." },
  talk: { eyes: "open", mouth: "smile", say: "psst." },
  sad: { eyes: "sad", mouth: "frown", say: "...again?" },
  love: { eyes: "heart", mouth: "smile", say: "!!" },
} satisfies Record<string, { eyes: IswEyes; mouth: IswMouth; say: string }>;
export type Expression = keyof typeof FACES;

const IDLE_MS = 12000;
const REACT_MS = 2200;

/* What she'd make of the current moment */
export function expressionFor(state: GameState, idle: boolean, fxKind: string | null): Expression {
  const mood = moodOf(state.iswAffection);
  if (state.mode === "WIN") return mood === "cold" ? "pout" : "love";
  if (state.mode === "GAME_OVER") return mood === "attached" ? "sad" : "smug";
  if (fxKind === "nuke" || fxKind === "crit") return "shock";
  if (fxKind === "backfire") return "laugh";
  if (fxKind === "perfect") return mood === "attached" ? "love" : "pout";
  if (fxKind === "hit") return mood === "attached" ? "worried" : "smug";
  if (state.log[state.log.length - 1]?.startsWith(ISW_CHAN_TAG)) return "talk";
  const p = state.player;
  if (p && p.stats.hp < p.stats.maxHp * 0.3) return mood === "attached" ? "worried" : "smug";
  if (idle) return "bored";
  return "watch";
}

const IswChanCam = ({ state }: { state: GameState }) => {
  const [idle, setIdle] = useState(false);
  const [fxKind, setFxKind] = useState<string | null>(null);

  useEffect(() => {
    setIdle(false);
    const t = setTimeout(() => setIdle(true), IDLE_MS);
    return () => clearTimeout(t);
  }, [state.log, state.turnCount]);

  useEffect(() => {
    if (!state.fx) return;
    setFxKind(state.fx.kind);
    const t = setTimeout(() => setFxKind(null), REACT_MS);
    return () => clearTimeout(t);
  }, [state.fx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const face = FACES[expressionFor(state, idle, fxKind)];
  return (
    <div className="shrink-0 border border-pink-400/40 px-1 py-0.5 text-pink-300 select-none" aria-label={`ISW-Chan: ${face.say}`}>
      <div className="flex justify-between gap-2 text-[9px] text-pink-400/60"><span className="animate-pulse">● REC</span><span>chan</span></div>
      <IswChanPortrait eyes={face.eyes} mouth={face.mouth} crop className="text-[3px] sm:text-[4px]" label="" />
      <div className="text-center text-[9px] text-pink-400">{face.say}</div>
    </div>
  );
};

export default IswChanCam;
