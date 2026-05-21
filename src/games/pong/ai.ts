// VSArcade Pong — Auto-play planner (player paddle)

import { BALL_SIZE, PADDLE_H } from "./constants";
import type { PongEngine } from "./engine";

/** Returns paddle intent (-1, 0, 1) to chase the ball. */
export function planPlayerIntent(engine: PongEngine): number {
  const paddleCenter = engine.playerY + PADDLE_H / 2;
  const ballCenter = engine.ballY + BALL_SIZE / 2;
  const diff = ballCenter - paddleCenter;
  if (Math.abs(diff) < 3) {
    return 0;
  }
  return Math.sign(diff);
}
