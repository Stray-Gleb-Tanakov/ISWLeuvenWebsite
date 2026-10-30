/* Tiny synthesized sound effects (Web Audio, no files). Muting is remembered per browser. */
import type { FxKind } from "@/game/types";

const MUTE_KEY = "isw-mute";
let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // storage blocked: mute just won't be remembered
  }
}

/* [frequency Hz, duration s, wave] steps per effect */
const SOUNDS: Record<FxKind | "cue" | "warning", [number, number, OscillatorType][]> = {
  hit: [[140, 0.08, "square"], [90, 0.1, "square"]],
  crit: [[660, 0.05, "square"], [990, 0.08, "square"]],
  perfect: [[880, 0.06, "triangle"], [1320, 0.1, "triangle"]],
  backfire: [[220, 0.08, "sawtooth"], [110, 0.2, "sawtooth"]],
  nuke: [[60, 0.4, "sawtooth"], [40, 0.6, "sawtooth"]],
  cue: [[1000, 0.05, "square"]],
  warning: [[440, 0.08, "square"], [0, 0.05, "square"], [440, 0.08, "square"]],
};

export function play(kind: keyof typeof SOUNDS) {
  if (isMuted()) return;
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur, type] of SOUNDS[kind]) {
      if (freq > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
      }
      t += dur;
    }
  } catch {
    // no audio available: stay silent
  }
}
