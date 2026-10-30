// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import ScoreSubmit from "./ScoreSubmit";
import { createInitialState, gameReducer } from "@/game/engine";
import { computeScore } from "@/game/score";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function deadRun() {
  const started = gameReducer(createInitialState(), { type: "SELECT_CLASS", className: "Ghost" });
  return { ...started, mode: "GAME_OVER" as const };
}

describe("ScoreSubmit", () => {
  it("posts the run and the found flags, then shows the rank", async () => {
    const state = deadRun();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ score: 2600, flagsFound: 1, rank: 3 }), { status: 201 }),
    );
    const onSubmitted = vi.fn();
    render(<ScoreSubmit state={state} flags={["ISW{C0NS0L3_C0WB0Y}"]} onSubmitted={onSubmitted} />);

    expect(screen.getByText(/RUN TERMINATED/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Name for the leaderboard"), { target: { value: "neo" } });
    fireEvent.click(screen.getByRole("button", { name: "submit score" }));

    await waitFor(() => expect(screen.getByText(/rank #3/)).toBeTruthy());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/scores");
    expect(JSON.parse(init!.body as string)).toEqual({
      version: 1,
      name: "neo", className: "Ghost", floor: 1, won: false,
      gameScore: computeScore(state).total, flags: ["ISW{C0NS0L3_C0WB0Y}"], badge: null,
    });
    expect(onSubmitted).toHaveBeenCalled();
  });

  it("shows the server's error message and allows a retry", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Slow down, runner." }), { status: 429 }),
    );
    render(<ScoreSubmit state={deadRun()} flags={[]} onSubmitted={() => {}} />);
    fireEvent.change(screen.getByLabelText("Name for the leaderboard"), { target: { value: "neo" } });
    fireEvent.click(screen.getByRole("button", { name: "submit score" }));

    await waitFor(() => expect(screen.getByText("ERROR: Slow down, runner.")).toBeTruthy());
    expect(screen.getByRole("button", { name: "submit score" })).toBeTruthy();
  });
});
