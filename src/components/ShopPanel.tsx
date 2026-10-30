import type { GameState } from "@/game/types";
import { SHOP_STOCK, SHOPKEEPERS, shopPrice } from "@/game/merchant";
import { SHOPKEEPER } from "@/game/portraits";

interface ShopPanelProps {
  state: GameState;
  dispatch: React.Dispatch<any>;
}

/* Merchant screen: stock as buttons (works for touch and mouse), keys 1-6 / H / Esc */
const ShopPanel = ({ state, dispatch }: ShopPanelProps) => {
  const merchant = state.merchants.find((m) => m.id === state.currentMerchant);
  if (!merchant || !state.player) return null;
  const keeper = SHOPKEEPERS[merchant.floor % SHOPKEEPERS.length];
  const credits = state.player.credits;

  return (
    <div className="border-2 border-yellow-400/60 bg-card p-3 font-mono text-xs space-y-2">
      <div className="flex justify-between gap-2">
        <span className="text-yellow-400 font-bold">$ {keeper.name}</span>
        <span className="text-primary">💰 {credits} cr</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <pre className="text-lime-300 leading-none text-[4px] sm:text-[6px] select-none shrink-0 self-center" aria-label="The shopkeeper">
          {SHOPKEEPER.join("\n")}
        </pre>
        <p className="text-foreground/90 italic">"{state.shopLine}"</p>
      </div>

      {state.haggle ? (
        <div className="border border-border p-2">
          <p className="text-amber-300">HAGGLE: Caesar cipher, shift 1–3. Crack it for 20% off. One try.</p>
          <p className="text-lg tracking-widest text-center my-1">{state.haggle.cipherText}</p>
        </div>
      ) : (
        <div className="grid gap-1">
          {SHOP_STOCK.map((entry, i) => {
            const price = shopPrice(entry, merchant.floor, merchant, state.player);
            return (
              <button
                key={entry.name}
                onClick={() => dispatch({ type: "SHOP_BUY", index: i })}
                className={`flex justify-between gap-2 text-left px-2 py-2 border border-border hover:border-primary active:bg-primary/20 touch-manipulation ${credits < price ? "opacity-50" : ""}`}
              >
                <span><span className="text-primary">[{i + 1}]</span> {entry.name} <span className="text-muted-foreground">— {entry.description}</span></span>
                <span className="text-yellow-400 shrink-0">{price} cr{merchant.haggle === "won" ? " (-20%)" : ""}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        {!state.haggle && (
          <button onClick={() => dispatch({ type: "SHOP_HAGGLE" })} className="flex-1 border border-border px-2 py-2 hover:border-primary active:bg-primary/20 touch-manipulation">
            [H] Haggle
          </button>
        )}
        <button
          onClick={() => dispatch(state.haggle ? { type: "PUZZLE_QUIT" } : { type: "SHOP_LEAVE" })}
          className="flex-1 border border-border px-2 py-2 hover:border-primary active:bg-primary/20 touch-manipulation"
        >
          [ESC] {state.haggle ? "Cancel" : "Leave"}
        </button>
      </div>
    </div>
  );
};

export default ShopPanel;
