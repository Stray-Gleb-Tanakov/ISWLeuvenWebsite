/* ====================================================
   ISW-Chan's "hardware ban". Kicked out by her anywhere
   (console, intercom, the ending) = one strike:
   10 min, 1 h, 24 h, then for good. Kept only in this browser:
   local storage + a cookie, so clearing just one doesn't help.
   The hardware she names is whatever any page can read
   (GPU, cores, screen, OS). Nothing leaves your machine.
   ==================================================== */

import { readChanEnv } from "./chanenv";

const BAN_KEY = "isw_chan_ban"; // localStorage key and cookie name
// Ban length per kick; after the last one it's permanent.
const BAN_STEPS_MS = [10 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
const PERMANENT = -1;
// Fired on window whenever the ban changes, so open pages update right away.
export const BAN_EVENT = "isw-chan-ban";
// runStats.killedBy when she throws you out of the game (intercom or ending): that's a strike too
export const KICKED_BY = "ISW-Chan (kicked out)";

/* ----- The ban: { strikes, until } with until = PERMANENT for good ----- */

export interface Ban { strikes: number; until: number }

const NO_BAN: Ban = { strikes: 0, until: 0 };

// "2.1762700000000" -> { strikes: 2, until: 1762700000000 }
function parseBan(raw: string | null | undefined): Ban {
  const [strikes, until] = (raw ?? "").split(".").map(Number);
  return Number.isFinite(strikes) && Number.isFinite(until) && strikes > 0 ? { strikes, until } : NO_BAN;
}

// Whichever copy has more strikes wins, so deleting only the cookie or only local storage doesn't help.
export function loadBan(): Ban {
  let stored = NO_BAN;
  let cookie = NO_BAN;
  try { stored = parseBan(localStorage.getItem(BAN_KEY)); } catch { /* private window */ }
  try { cookie = parseBan(document.cookie.split("; ").find((c) => c.startsWith(`${BAN_KEY}=`))?.slice(BAN_KEY.length + 1)); } catch { /* no cookies */ }
  return stored.strikes >= cookie.strikes ? stored : cookie;
}

function saveBan(ban: Ban) {
  const raw = `${ban.strikes}.${ban.until}`;
  try { localStorage.setItem(BAN_KEY, raw); } catch { /* she'll forget */ }
  try { document.cookie = `${BAN_KEY}=${raw}; path=/; max-age=${10 * 365 * 24 * 3600}; SameSite=Lax`; } catch { /* she'll forget */ }
  try { window.dispatchEvent(new Event(BAN_EVENT)); } catch { /* no window (tests, SSR) */ }
}

export function addStrike(now = Date.now()): Ban {
  const strikes = loadBan().strikes + 1;
  const step = BAN_STEPS_MS[strikes - 1];
  const ban = { strikes, until: step === undefined ? PERMANENT : now + step };
  saveBan(ban);
  return ban;
}

// ms left on the ban, Infinity if permanent, 0 if you're free
export function bannedFor(now = Date.now()): number {
  const { strikes, until } = loadBan();
  if (!strikes) return 0;
  if (until === PERMANENT) return Infinity;
  return Math.max(0, until - now);
}

export function formatLeft(ms: number): string {
  const min = Math.ceil(ms / 60000);
  return min < 60 ? `${min} min` : `${Math.ceil(min / 60)} h`;
}

/* The "hardware" she bans: GPU from WebGL, plus cores and screen */

// WebGL renderer string -> readable GPU name, e.g.
// "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x0000A7A0) Direct3D11 vs_5_0 ps_5_0, D3D11)" -> "Intel Iris Xe Graphics"
// "NVIDIA GeForce RTX 3060/PCIe/SSE2" -> "NVIDIA GeForce RTX 3060"
export function cleanGpuName(raw: string): string | null {
  const angle = raw.match(/^ANGLE \([^,]+, (.+), [^,]+\)$/);
  const name = (angle ? angle[1] : raw)
    .replace(/^ANGLE \w+ Renderer: /, "") // Apple: "ANGLE Metal Renderer: Apple M2"
    .replace(/\((R|TM)\)/gi, "")
    .replace(/\(0x[0-9a-f]+\)/gi, "")
    .replace(/\s(Direct3D|OpenGL|Vulkan|Metal)\w*.*$/i, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  // Firefox and Safari often hide the real GPU behind a generic name
  return name && !/^(WebKit WebGL|Mozilla|Generic Renderer)$/i.test(name) ? name : null;
}

export function readGpu(): string | null {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return null;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return cleanGpuName(String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER)));
  } catch {
    return null;
  }
}

export function hardwareLines(ban: Ban, gpu = readGpu()): string[] {
  const env = readChanEnv();
  const parts = [
    gpu && `your ${gpu}`,
    env.cores && `all ${env.cores} of your CPU cores`,
    /^[1-9]\d*x[1-9]\d*$/.test(env.screen) && `that ${env.screen} screen`,
    env.os && `the whole ${env.os} install`,
  ].filter(Boolean);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
  if (ban.until === PERMANENT) {
    return [
      "*HARDWARE BAN: PERMANENT*",
      `I've blacklisted ${list}. Forever.`,
      "Strike four. I don't do second chances. I already gave you three.",
    ];
  }
  const left = formatLeft(ban.until - Date.now());
  return [
    `*HARDWARE BAN ${ban.strikes}/${BAN_STEPS_MS.length}*`,
    `I've blacklisted ${list}. For ${left}.`,
    ban.strikes === BAN_STEPS_MS.length ? "Next time it's permanent. I mean it." : "It gets longer every time. Think about what you did.",
  ];
}

export const isPermanent = (ban: Ban) => ban.strikes > 0 && ban.until === PERMANENT;

// One line for places that just refuse you: "this device is blacklisted. 9 min left"
export function banStatus(ms: number): string {
  return ms === Infinity ? "this device is permanently blacklisted" : `this device is blacklisted. ${formatLeft(ms)} left`;
}
