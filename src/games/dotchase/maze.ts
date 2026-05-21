// VSArcade DotChase — Maze layout (pillar maze, guaranteed connected)

import { COLS, ROWS } from "./constants";

/** A cell is a wall on the border or where both coordinates are odd. */
export function isWall(x: number, y: number): boolean {
  if (x <= 0 || x >= COLS - 1 || y <= 0 || y >= ROWS - 1) {
    return true;
  }
  return x % 2 === 1 && y % 2 === 1;
}
