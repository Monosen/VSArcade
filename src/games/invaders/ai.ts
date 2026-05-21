// VSArcade Invaders — Auto-play planner

import { ALIEN_COLS, ALIEN_ROWS, ALIEN_W, SHIP_W } from "./constants";
import { alienX, type InvadersEngine } from "./engine";

/** Returns ship intent (-1, 0, 1) to line up under the nearest alien column. */
export function planShipIntent(engine: InvadersEngine): number {
  const shipCenter = engine.shipX + SHIP_W / 2;
  let targetX = shipCenter;
  let bestDist = Infinity;

  for (let col = 0; col < ALIEN_COLS; col += 1) {
    let columnAlive = false;
    for (let row = 0; row < ALIEN_ROWS; row += 1) {
      if (engine.aliens[row][col]) {
        columnAlive = true;
        break;
      }
    }
    if (!columnAlive) {
      continue;
    }
    const center = alienX(engine.formationX, col) + ALIEN_W / 2;
    const dist = Math.abs(center - shipCenter);
    if (dist < bestDist) {
      bestDist = dist;
      targetX = center;
    }
  }

  const diff = targetX - shipCenter;
  if (Math.abs(diff) < 3) {
    return 0;
  }
  return Math.sign(diff);
}
