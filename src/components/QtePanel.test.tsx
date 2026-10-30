// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act, cleanup, screen } from "@testing-library/react";
import QtePanel from "./QtePanel";
import type { Qte } from "@/game/types";

/* Fake clock: performance.now and requestAnimationFrame advance together */
let clock = 0;
let frames: FrameRequestCallback[] = [];
function advance(ms: number, step = 16) {
  for (let t = 0; t < ms; t += step) {
    clock += step;
    const run = frames; frames = [];
    act(() => run.forEach((f) => f(clock)));
  }
}

beforeEach(() => {
  clock = 1000; frames = [];
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => { frames.push(f); return frames.length; });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.useFakeTimers({ toFake: ["setTimeout"] });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function run(qte: Qte) {
  const onResolve = vi.fn();
  render(<QtePanel qte={qte} onResolve={onResolve} />);
  const done = () => { act(() => { vi.advanceTimersByTime(1000); }); return onResolve.mock.calls[0]?.slice(0, 2); };
  const call = () => { act(() => { vi.advanceTimersByTime(1000); }); return onResolve.mock.calls[0]; };
  return { done, call };
}
const press = (key: string) => act(() => { fireEvent.keyDown(window, { key }); });

describe("QtePanel", () => {
  it("grab: mashing enough is a catch, too few lets it escape", () => {
    const grab: Qte = { kind: "grab", context: "grab", prompt: "", windowMs: 2000, presses: 8 };
    let q = run(grab); advance(50);
    for (let i = 0; i < 8; i++) press(" ");
    expect(q.done()[0]).toBe("perfect");
    cleanup(); q = run(grab); advance(50);
    for (let i = 0; i < 3; i++) press(" ");
    advance(2100);
    expect(q.done()[0]).toBe("miss");
  });

  it("shell: the typed command is graded and passed on (sudo optional)", () => {
    const shell: Qte = { kind: "shell", context: "special", prompt: "bash: ./deploy.sh: Permission denied", answers: ["chmod +x deploy.sh"], hint: "", windowMs: 5000 };
    let q = run(shell); advance(100);
    let input = screen.getByLabelText("Shell command");
    fireEvent.change(input, { target: { value: "sudo chmod +x deploy.sh" } });
    fireEvent.submit(input.closest("form")!);
    expect(q.call()).toEqual(["perfect", 1, "sudo chmod +x deploy.sh"]);
    cleanup(); q = run(shell); advance(100);
    input = screen.getByLabelText("Shell command");
    fireEvent.change(input, { target: { value: "rm -rf /*" } });
    fireEvent.submit(input.closest("form")!);
    expect(q.call()).toEqual(["miss", 0, "rm -rf /*"]);
  });

  const gauge: Qte = { kind: "gauge", context: "special", prompt: "", windowMs: 1000, zone: { good: [0.4, 0.6], perfect: [0.48, 0.52] } };

  it("gauge: stopping in the perfect zone is perfect, in the green is good", () => {
    let q = run(gauge); advance(500); press(" ");
    expect(q.done()).toEqual(["perfect", expect.closeTo(0.5, 1)]);
    cleanup();
    q = run(gauge); advance(420); press(" ");
    expect(q.done()[0]).toBe("good");
  });

  it("gauge: never pressing is a miss", () => {
    const q = run(gauge); advance(1100);
    expect(q.done()[0]).toBe("miss");
  });

  it("brace: early = miss, fast reaction = perfect, slow = good, none = miss", () => {
    const brace: Qte = { kind: "brace", context: "brace", prompt: "", windowMs: 600, cueDelayMs: 500 };
    let q = run(brace); advance(200); press(" ");
    expect(q.done()[0]).toBe("miss");
    cleanup(); q = run(brace); advance(560); press(" ");
    expect(q.done()[0]).toBe("perfect");
    cleanup(); q = run(brace); advance(1000); press(" ");
    expect(q.done()[0]).toBe("good");
    cleanup(); q = run(brace); advance(1300);
    expect(q.done()[0]).toBe("miss");
  });

  it("hack: typing the full code is perfect, half of it is good", () => {
    const hack: Qte = { kind: "hack", context: "special", prompt: "A1F3", windowMs: 3000 };
    let q = run(hack); advance(50);
    for (const k of "a1f3") press(k);
    expect(q.done()).toEqual(["perfect", 1]);
    cleanup(); q = run(hack); advance(50);
    press("a"); press("9"); press("1"); advance(3100);
    expect(q.done()).toEqual(["good", 0.5]);
  });

  it("combo: input is ignored while memorising, a wrong arrow breaks it", () => {
    const combo: Qte = { kind: "combo", context: "special", prompt: "UDLR", windowMs: 3000, memorizeMs: 500 };
    let q = run(combo); press("ArrowUp"); advance(520);
    for (const k of ["ArrowUp", "ArrowDown", "a", "d"]) press(k);
    expect(q.done()).toEqual(["perfect", 1]);
    cleanup(); q = run(combo); advance(520);
    press("w"); press("w");
    expect(q.done()).toEqual(["miss", 0.25]);
  });
});
