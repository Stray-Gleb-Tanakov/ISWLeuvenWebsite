/* ====================================================
   What ISW-Chan can "see" about you: only what any web page
   can read from the browser. Nothing leaves your machine.
   ==================================================== */

export interface ChanEnv {
  os: string | null;      // "Windows", "macOS", "Linux", "Android", "iPhone", "ChromeOS"
  browser: string | null; // "Firefox", "Chrome", "Edge", "Safari", "Opera"
  mobile: boolean;
  language: string;       // e.g. "nl-BE"
  timezone: string;       // e.g. "Europe/Brussels"
  hour: number;
  minute: number;
  screen: string;         // e.g. "1920x1080"
  cores: number | null;
  darkMode: boolean;
  visits: number;         // page loads on this site, counted in SiteSecrets
}

export const VISITS_KEY = "isw_visits";

export function parseUserAgent(ua: string): { os: string | null; browser: string | null; mobile: boolean } {
  const os = /iPhone|iPad/.test(ua) ? "iPhone"
    : /Android/.test(ua) ? "Android"
    : /CrOS/.test(ua) ? "ChromeOS"
    : /Windows/.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux" : null;
  const browser = /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari" : null;
  return { os, browser, mobile: /Mobi|Android|iPhone/.test(ua) };
}

export function readChanEnv(now = new Date()): ChanEnv {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  let visits = 0;
  try { visits = Number(localStorage.getItem(VISITS_KEY)) || 0; } catch { /* private window */ }
  return {
    ...parseUserAgent(nav?.userAgent ?? ""),
    language: nav?.language ?? "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "somewhere",
    hour: now.getHours(),
    minute: now.getMinutes(),
    screen: typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "?",
    cores: nav?.hardwareConcurrency || null,
    darkMode: typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches,
    visits,
  };
}
