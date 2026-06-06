// VSArcade Skyhop — Auto-play planner (lookahead)

import {
  BIRD_SIZE,
  BIRD_X,
  CANVAS_H,
  FLAP_VELOCITY,
  GRAVITY,
  PIPE_GAP,
  PIPE_W,
} from "./constants";
import type { SkyhopEngine } from "./engine";

const LOOKAHEAD_MS = 220;
const TARGET_MARGIN = 6;

/** Returns true when the AI should flap this frame. */
export function shouldFlap(engine: SkyhopEngine): boolean {
  if (engine.gameOver) {
    return false;
  }
  if (!engine.started) {
    return true;
  }

  const nextPipe = engine.pipes.find((p) => p.x + PIPE_W >= BIRD_X - 4);
  const targetCenter = nextPipe ? nextPipe.gapY + PIPE_GAP / 2 : CANVAS_H / 2;

  const birdCenter = engine.birdY + BIRD_SIZE / 2;

  // Predict bird center after LOOKAHEAD_MS
  const predictedCenter =
    birdCenter +
    engine.birdVel * LOOKAHEAD_MS +
    0.5 * GRAVITY * LOOKAHEAD_MS * LOOKAHEAD_MS;

  // Flap if the bird will drift below the gap center and isn't already rising fast
  return predictedCenter > targetCenter + TARGET_MARGIN && engine.birdVel > FLAP_VELOCITY * 0.4;
}
