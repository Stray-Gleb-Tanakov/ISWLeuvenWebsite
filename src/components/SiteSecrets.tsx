import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { xorReveal } from "@/game/flags";
import { useKonamiCode } from "@/hooks/UseKonamiCode";

/* Site-wide easter eggs, mounted once in App:
   - the Konami code launches Mainframe Breach from any page
   - Mini CTF "Come Back": while the tab is hidden, ISW-Chan blinks Morse in its title */

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
  N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.", _: "..--.-",
};
const LONELY = "Kjw6HmNSLFA0IVsuLl0=";
const BLINK_MS = 1500;

/* What the title says while you're away: a plea, then one Morse letter per blink */
export function lonelyTitles(): string[] {
  const body = xorReveal(LONELY, "come back").replace(/^ISW\{|\}$/g, "");
  const letters = [...body].map((ch, i) => `[${i + 1}/${body.length}] ${MORSE[ch]}`);
  return ["ISW-Chan: come back ;_;", ...letters, "ISW-Chan: ...hello?"];
}

const SiteSecrets = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useKonamiCode(useCallback(() => {
    if (pathname !== "/mainframe_breach") navigate("/mainframe_breach", { state: { konami: true } }); // the game uses the arrows itself
  }, [navigate, pathname]));

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let saved = document.title;
    const onVisibility = () => {
      if (document.hidden) {
        saved = document.title;
        const titles = lonelyTitles();
        let i = 0;
        document.title = titles[0];
        timer = setInterval(() => { i = (i + 1) % titles.length; document.title = titles[i]; }, BLINK_MS);
      } else {
        clearInterval(timer);
        document.title = saved;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  return null;
};

export default SiteSecrets;
