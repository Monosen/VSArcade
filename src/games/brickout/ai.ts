// VSArcade Brickout — Auto-play planner (paddle)

import { BALL_SIZE, PADDLE_W } from "./constants";
import type { BrickoutEngine } from "./engine";

/** Returns paddle intent (-1, 0, 1) to track the ball. */
export function planPaddleIntent(engine: BrickoutEngine): number {
  const paddleCenter = engine.paddleX + PADDLE_W / 2;
  const ballCenter = engine.ballX + BALL_SIZE / 2;
  const diff = ballCenter - paddleCenter;
  if (Math.abs(diff) < 3) {
    return 0;
  }
  return Math.sign(diff);
}
