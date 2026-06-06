// VSArcade Invaders — Auto-play planner

import { ALIEN_COLS, ALIEN_ROWS, ALIEN_W, SHIP_W } from "./constants";
import { alienX, type InvadersEngine } from "./engine";

/** Returns ship intent (-1, 0, 1). Targets the lowest alien and dodges bombs. */
export function planShipIntent(engine: InvadersEngine): number {
  const shipLeft = engine.shipX;
  const shipRight = engine.shipX + SHIP_W;
  const shipCenter = engine.shipX + SHIP_W / 2;

  // Dodge any bomb that is directly above the ship and close
  for (const bomb of engine.bombs) {
    const bx = bomb.x;
    if (bx >= shipLeft - 4 && bx <= shipRight + 4) {
      const leftSpace = engine.shipX;
      const rightSpace = 160 - shipRight;
      return leftSpace > rightSpace ? -1 : 1;
    }
  }

  // Target the alien in the lowest row (highest row index = most dangerous)
  let targetX = shipCenter;
  let bestPriority = -Infinity;

  for (let col = 0; col < ALIEN_COLS; col += 1) {
    let lowestRow = -1;
    for (let row = ALIEN_ROWS - 1; row >= 0; row -= 1) {
      if (engine.aliens[row][col]) {
        lowestRow = row;
        break;
      }
    }
    if (lowestRow === -1) {
      continue;
    }
    const center = alienX(engine.formationX, col) + ALIEN_W / 2;
    const dist = Math.abs(center - shipCenter);
    // Prioritize lowest row (most dangerous), break ties by proximity
    const priority = lowestRow * 10000 - dist;
    if (priority > bestPriority) {
      bestPriority = priority;
      targetX = center;
    }
  }

  const diff = targetX - shipCenter;
  if (Math.abs(diff) < 3) {
    return 0;
  }
  return Math.sign(diff);
}
