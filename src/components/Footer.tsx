import { useEffect, useState } from "react";
import { xorReveal } from "@/game/flags";

/* Mini CTF: "Leet O'Clock". At 13:37 local time the status line shows a flag,
   decoded with the time itself as the key. */
const LEET_LOG = "eGBtSHsCAG5sB3J/CnB8TA==";

const clock = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [time, setTime] = useState(() => clock(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(clock(new Date())), 5000);
    return () => clearInterval(id);
  }, []);

  const leet = time === "13:37";

  return (
    <footer className="py-6 px-4 border-t border-border">
      <div className="container-terminal text-center">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary">©</span> {currentYear} ISW Leuven v2.0.3
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          [{time}] System Status:{" "}
          {leet
            ? <span className="text-primary text-glow">L33T · {xorReveal(LEET_LOG, time)}</span>
            : <span className="text-primary text-glow">ONLINE</span>}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
