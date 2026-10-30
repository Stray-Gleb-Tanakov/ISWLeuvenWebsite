/* Chosen cosmetics, remembered per browser. Locked picks fall back to the defaults. */
import { useCallback, useState } from "react";
import { DEFAULT_COSMETICS, THEMES, ICONS, DEATH_TEXTS, BADGES, isUnlocked, type CosmeticChoice } from "@/game/cosmetics";

const STORAGE_KEY = "isw-cosmetics";

function load(): CosmeticChoice {
  try {
    return { ...DEFAULT_COSMETICS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return DEFAULT_COSMETICS;
  }
}

export function useCosmetics(found: Record<string, string>) {
  const [choice, setChoice] = useState<CosmeticChoice>(load);

  const update = useCallback((patch: Partial<CosmeticChoice>) => {
    setChoice((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // not remembered, still applied
      }
      return next;
    });
  }, []);

  // Only apply what's actually unlocked (flags can be cleared from storage)
  const ok = <T extends { id: string; requires: string | null }>(list: T[], id: string | null) =>
    list.find((x) => x.id === id && isUnlocked(x.requires, found));
  const active: CosmeticChoice = {
    theme: ok(THEMES, choice.theme)?.id ?? DEFAULT_COSMETICS.theme,
    icon: ok(ICONS, choice.icon)?.id ?? DEFAULT_COSMETICS.icon,
    death: ok(DEATH_TEXTS, choice.death)?.id ?? DEFAULT_COSMETICS.death,
    badge: ok(BADGES, choice.badge)?.id ?? null,
  };
  return { cosmetics: active, update };
}
