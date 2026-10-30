// @vitest-environment jsdom
/* The website flag challenges: each one is solved the way a player would. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import Members from "./Members";
import Board from "./Board";
import Footer from "@/components/Footer";
import { HIDDEN_FLAGS, sha256Hex } from "@/game/flags";
import { createInitialState, gameReducer } from "@/game/engine";
import Catgirls from "./Catgirls";
import PrivacyPolicy from "./PrivacyPolicy";
import { lonelyTitles } from "@/components/SiteSecrets";
import { act } from "react";
import { importMemory, exportMemory, freshMemory, recordRun, signMemory, AFFECTION_CAP } from "@/game/memory";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.cookie = "isw_role=; max-age=0; path=/";
  localStorage.clear();
});

const page = (el: JSX.Element) => render(<MemoryRouter>{el}</MemoryRouter>);

async function expectFlag(text: string, id: string) {
  const flag = text.match(/ISW\{[^}]+\}/)?.[0];
  expect(flag).toBeDefined();
  expect(HIDDEN_FLAGS.find((f) => f.id === id)!.hash).toBe(await sha256Hex(flag!.toUpperCase()));
}

const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");

describe("website flags", () => {
  it("Cookie Monster: members can't read the notes, a forged admin cookie can", async () => {
    document.cookie = `isw_role=${btoa("member")}; path=/`;
    page(<Members />);
    expect(document.body.textContent).not.toMatch(/ISW\{/);
    cleanup();
    document.cookie = `isw_role=${btoa("admin")}; path=/`;
    page(<Members />);
    await expectFlag(document.body.textContent!, "cookie");
  });

  it("Forged Papers: the guest pass is refused, a re-signed one too, alg none gets in", async () => {
    page(<Board />);
    fireEvent.click(screen.getByText(/continue as guest/));
    expect(screen.getByText(/signature valid/)).toBeTruthy();
    expect(screen.getByText(/permission denied/)).toBeTruthy();

    const box = screen.getByLabelText(/your pass/) as HTMLTextAreaElement;
    const [, , sig] = box.value.split(".");
    fireEvent.change(box, { target: { value: `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({ sub: "me", role: "board" })}.${sig}` } });
    expect(screen.getByText(/signature invalid/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/ISW\{/);

    fireEvent.change(box, { target: { value: `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ sub: "me", role: "board" })}.` } });
    await expectFlag(document.body.textContent!, "token");
  });

  it("Leet O'Clock: the footer only talks at 13:37", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 30, 13, 36, 50));
    render(<Footer />);
    expect(document.body.textContent).toContain("ONLINE");
    cleanup();
    vi.setSystemTime(new Date(2026, 9, 30, 13, 37, 5));
    render(<Footer />);
    await expectFlag(document.body.textContent!, "timelock");
  });

  it("Dev Mode: the backdoor command at an uplink prints a flag", async () => {
    // the player digs the command out of the bundle's char codes
    const src = readFileSync("src/game/engine.ts", "utf8");
    const codes = src.match(/cmd: \[([\d, ]+)\]/)![1].split(",").map(Number);
    const cmd = String.fromCharCode(...codes);
    const s = { ...gameReducer(createInitialState(), { type: "SELECT_CLASS", className: "Cyborg" }), mode: "UPLINK" as const };
    const t = gameReducer(s, { type: "UPLINK_RESULT", input: cmd.toUpperCase(), title: null, flagsFound: 0 });
    await expectFlag(t.log.join("\n"), "debug");
  });

  it("Director's Cut: the A-10 catgirl's alt text carries ISW-Chan's caption", async () => {
    page(<Catgirls />);
    await expectFlag(screen.getByRole("img", { name: /A-10/ }).getAttribute("alt")!, "alttext");
  });

  it("Paper Trail: the privacy policy grows a clause only while printing", async () => {
    page(<PrivacyPolicy />);
    expect(document.body.textContent).not.toMatch(/ISW\{/);
    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    await expectFlag(document.body.textContent!, "print");
    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(document.body.textContent).not.toMatch(/ISW\{/);
  });

  it("Come Back: the hidden-tab Morse decodes to a flag", async () => {
    const MORSE: Record<string, string> = { "-.-.": "C", "-----": "0", "--": "M", "...--": "3", "..--.-": "_", "-...": "B", "....-": "4", "-.-": "K" };
    const letters = lonelyTitles().filter((t) => t.startsWith("[")).map((t) => MORSE[t.split("] ")[1]]);
    await expectFlag(`ISW{${letters.join("")}}`, "morse");
  });

  it("Legacy Code: the source map still has the original comments", async () => {
    expect(readFileSync("public/js/legacy-auth.min.js", "utf8")).toContain("sourceMappingURL=legacy-auth.min.js.map");
    const map = JSON.parse(readFileSync("public/js/legacy-auth.min.js.map", "utf8"));
    await expectFlag(map.sourcesContent[0], "sourcemap");
  });

  it("old_backup ships the repo bundle and the locked archive", () => {
    expect(readFileSync("public/old_backup/site_2019.bundle", "utf8").startsWith("# v2 git bundle")).toBe(true);
    const zip = readFileSync("public/old_backup/board_archive_2019.zip");
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    expect(zip.readUInt16LE(6) & 1).toBe(1); // encrypted
    expect(zip.toString("latin1")).not.toMatch(/ISW\{/);
  });

  it("The Shrine: floor 2's worn wall is hollow and hides a flag", async () => {
    let s = gameReducer(createInitialState(), { type: "SELECT_CLASS", className: "Cyborg" });
    const map = s.maps[1];
    const y = map.findIndex((row) => row.includes("▓"));
    const x = map[y].indexOf("▓");
    s = { ...s, player: { ...s.player!, floor: 1, x, y: y - 1 }, enemies: [] };
    s = gameReducer(s, { type: "MOVE", dx: 0, dy: 1 });
    expect(s.player!.y).toBe(y);
    expect(s.shrineFound).toBe(true);
    await expectFlag(s.log.join("\n"), "shrine");
  });

  it("Her Memory: affection caps at 99, a forged and re-signed dump gets the flag", async () => {
    let m = freshMemory();
    for (let i = 0; i < 40; i++) m = recordRun(m, { won: true, shrine: true });
    expect(m.affection).toBe(AFFECTION_CAP);
    const dump = JSON.parse(atob(exportMemory(m)));
    expect(importMemory(btoa(JSON.stringify({ ...dump, affection: 100 }))).line).toMatch(/handwriting/);
    const forged = { ...dump, affection: 100 };
    forged.sig = signMemory(forged);
    const r = importMemory(btoa(JSON.stringify(forged)));
    expect(r.ok).toBe(true);
    await expectFlag(r.line, "memory");
  });

  it("Voicemail: the audio file ships", () => {
    expect(readFileSync("public/audio/voicemail_isw-chan.wav").subarray(0, 4).toString()).toBe("RIFF");
  });

  it("the leaderboard server knows every flag and badge", () => {
    const server = readFileSync("food-api/src/scores.ts", "utf8");
    for (const f of HIDDEN_FLAGS) {
      expect(server).toContain(`["${f.hash}", "${f.id}"]`);
      expect(server).toMatch(new RegExp(`BADGES = new Set\\(\\[[^\\]]*"${f.id}"`));
    }
  });
});
