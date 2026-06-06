// VSArcade Pong — Auto-play planner (predictive)

import { BALL_SIZE, CANVAS_H, PADDLE_H, PLAYER_X, PADDLE_W } from "./constants";
import type { PongEngine } from "./engine";

function predictBallLandingY(engine: PongEngine): number {
  if (engine.ballVX >= 0) {
    return CANVAS_H / 2;
  }

  const t = (engine.ballX - (PLAYER_X + PADDLE_W)) / Math.abs(engine.ballVX);
  let y = engine.ballY + engine.ballVY * t;

  // Fold for wall bounces
  const range = CANVAS_H - BALL_SIZE;
  y = ((y % (2 * range)) + 2 * range) % (2 * range);
  if (y > range) {
    y = 2 * range - y;
  }
  return y + BALL_SIZE / 2;
}

/** Returns paddle intent (-1, 0, 1). Predicts ball landing position. */
export function planPlayerIntent(engine: PongEngine): number {
  const targetBallCenter = predictBallLandingY(engine);
  const paddleCenter = engine.playerY + PADDLE_H / 2;
  const diff = targetBallCenter - paddleCenter;
  if (Math.abs(diff) < 2) {
    return 0;
  }
  return Math.sign(diff);
}
