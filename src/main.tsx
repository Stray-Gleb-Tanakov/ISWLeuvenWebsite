import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Mini CTF: the "Console Cowboy" flag
console.log(
  "%c ISW %c Poking around in devtools? Good. That's what we like.\n%cISW{C0NS0L3_C0WB0Y}  — submit it on /mainframe_breach",
  "background:#00ff00;color:#000;font-weight:bold;padding:2px 4px",
  "color:#00ff00",
  "color:#888;font-family:monospace",
);
