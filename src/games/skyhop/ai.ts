// VSArcade Skyhop — Auto-play planner

import { BIRD_SIZE, BIRD_X, CANVAS_H, PIPE_GAP, PIPE_W } from "./constants";
import type { SkyhopEngine } from "./engine";

/** Returns true when the AI should flap this frame. */
export function shouldFlap(engine: SkyhopEngine): boolean {
  if (engine.gameOver) {
    return false;
  }
  if (!engine.started) {
    return true;
  }

  const nextPipe = engine.pipes.find((p) => p.x + PIPE_W >= BIRD_X - 4);
  const targetCenter = nextPipe
    ? nextPipe.gapY + PIPE_GAP / 2
    : CANVAS_H / 2;
  const birdCenter = engine.birdY + BIRD_SIZE / 2;

  return birdCenter > targetCenter + 2 && engine.birdVel > -0.06;
}
