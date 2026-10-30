/* ====================================================
   Hidden CTF flags this browser has found.
   Kept in localStorage; the server re-checks them on
   score submission, so this is only a convenience.
   ==================================================== */
import { useCallback, useState } from "react";
import { matchFlag, type HiddenFlag } from "@/game/flags";

const STORAGE_KEY = "isw-ctf-flags";

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function useFoundFlags() {
  // flag id → the flag text the player typed
  const [found, setFound] = useState<Record<string, string>>(load);

  const submit = useCallback(async (input: string): Promise<HiddenFlag | null> => {
    const flag = await matchFlag(input);
    if (!flag) return null;
    setFound((prev) => {
      const next = { ...prev, [flag.id]: input.trim().toUpperCase() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage blocked: still counts for this visit
      }
      return next;
    });
    return flag;
  }, []);

  return { found, submit };
}
