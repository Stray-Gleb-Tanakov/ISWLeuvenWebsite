import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Mini CTF: "Cookie Monster" — every visitor is a member until they say otherwise (read on /members)
if (!document.cookie.includes("isw_role=")) {
  document.cookie = `isw_role=${btoa("member")}; path=/; max-age=31536000; SameSite=Lax`;
}

// Mini CTF: the "Console Cowboy" flag
console.log(
  "%c ISW %c Poking around in devtools? Good. That's what we like.\n%cISW{C0NS0L3_C0WB0Y}  — submit it on /mainframe_breach",
  "background:#00ff00;color:#000;font-weight:bold;padding:2px 4px",
  "color:#00ff00",
  "color:#888;font-family:monospace",
);
