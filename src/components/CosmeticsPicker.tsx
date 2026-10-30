import { THEMES, ICONS, DEATH_TEXTS, BADGES, isUnlocked, type CosmeticChoice } from "@/game/cosmetics";

interface CosmeticsPickerProps {
  found: Record<string, string>;
  choice: CosmeticChoice;
  onChange: (patch: Partial<CosmeticChoice>) => void;
}

/* Shown on the class screen. Locked items show which flag unlocks them. */
const CosmeticsPicker = ({ found, choice, onChange }: CosmeticsPickerProps) => {
  const row = <T extends { id: string; requires: string | null }>(
    label: string, items: T[], selected: string | null, show: (x: T) => string, key: keyof CosmeticChoice, allowNone = false,
  ) => (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-muted-foreground w-14 shrink-0">{label}</span>
      {allowNone && (
        <button onClick={() => onChange({ [key]: null })} className={`border px-2 py-1 ${selected === null ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>none</button>
      )}
      {items.map((x) => {
        const open = isUnlocked(x.requires, found);
        return (
          <button
            key={x.id}
            disabled={!open}
            title={open ? undefined : x.requires === "all" ? "Upload all hidden flags" : `Upload the "${x.requires}" flag`}
            onClick={() => onChange({ [key]: x.id })}
            className={`border px-2 py-1 ${selected === x.id ? "border-primary text-primary text-glow" : "border-border"} ${open ? "hover:border-primary" : "opacity-30 cursor-not-allowed"}`}
          >
            {open ? show(x) : "🔒"}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="border border-border p-2 space-y-1 text-[10px]">
      <p className="text-muted-foreground">// cosmetics: unlocked by hidden website flags (upload them at a U)</p>
      {row("theme", THEMES, choice.theme, (t) => t.name, "theme")}
      {row("icon", ICONS, choice.icon, (i) => i.char, "icon")}
      {row("death", DEATH_TEXTS, choice.death, (d) => d.text, "death")}
      {row("badge", BADGES, choice.badge, (b) => b.title, "badge", true)}
    </div>
  );
};

export default CosmeticsPicker;
