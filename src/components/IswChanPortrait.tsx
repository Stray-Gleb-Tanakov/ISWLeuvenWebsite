import { useEffect, useState } from "react";
import { iswChanFace, type IswEyes, type IswMouth } from "@/game/portraits";

/* ISW-Chan's portrait with an expression. While her eyes are open she blinks now and then. */
interface Props {
  eyes?: IswEyes;
  mouth?: IswMouth;
  crop?: boolean;     // just the face (for small spaces like the HUD)
  className?: string;
  label?: string;
}

const BLINK_MS = 140;
const BLINK_EVERY = [2500, 6000];

const IswChanPortrait = ({ eyes = "open", mouth = "neutral", crop = false, className = "", label = "ISW-Chan" }: Props) => {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (eyes !== "open" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlinking(true);
        timer = setTimeout(() => { setBlinking(false); schedule(); }, BLINK_MS);
      }, BLINK_EVERY[0] + Math.random() * (BLINK_EVERY[1] - BLINK_EVERY[0]));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [eyes]);

  let rows = iswChanFace(blinking ? "closed" : eyes, mouth);
  if (crop) rows = rows.slice(9, 36).map((r) => r.slice(8, 61));
  return <pre className={`select-none leading-none ${className}`} aria-label={label}>{rows.join("\n")}</pre>;
};

export default IswChanPortrait;
