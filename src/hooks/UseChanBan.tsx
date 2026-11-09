/* ====================================================
   ISW-Chan's hardware ban (game/chanban.ts) for components.
   Updates when the ban changes in this tab (BAN_EVENT),
   in another tab (storage event), and when it runs out.
   ==================================================== */
import { useEffect, useState } from "react";
import { BAN_EVENT, bannedFor, isPermanent, loadBan, type Ban } from "@/game/chanban";

export interface ChanBan {
  ban: Ban;
  left: number;       // ms left, Infinity if permanent, 0 if not banned
  banned: boolean;
  permanent: boolean;
}

function read(): ChanBan {
  const ban = loadBan();
  const left = bannedFor();
  return { ban, left, banned: left > 0, permanent: isPermanent(ban) };
}

export function useChanBan(): ChanBan {
  const [state, setState] = useState(read);

  useEffect(() => {
    const update = () => setState(read());
    window.addEventListener(BAN_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(BAN_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  // Tick while a timed ban runs, so countdowns move and the page frees up when it ends.
  useEffect(() => {
    if (!state.banned || state.permanent) return;
    const t = setInterval(() => setState(read()), 1000);
    return () => clearInterval(t);
  }, [state.banned, state.permanent]);

  return state;
}
