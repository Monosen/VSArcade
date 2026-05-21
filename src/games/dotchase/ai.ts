// VSArcade DotChase — Auto-play planner (BFS to nearest pellet, avoid ghosts)

import { isWall } from "./maze";
import { ALL_DIRS, DIR_VECTORS, type Dir } from "./types";
import type { DotChaseEngine } from "./engine";

export function planDesiredDir(engine: DotChaseEngine): Dir | null {
  const danger = new Set<string>();
  for (const ghost of engine.ghosts) {
    if (ghost.frightened) {
      continue;
    }
    danger.add(`${ghost.x},${ghost.y}`);
    for (const dir of ALL_DIRS) {
      const v = DIR_VECTORS[dir];
      danger.add(`${ghost.x + v.x},${ghost.y + v.y}`);
    }
  }

  const start = engine.pac;
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const queue: { x: number; y: number; first: Dir | null }[] = [
    { x: start.x, y: start.y, first: null },
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.first !== null && (engine.pellets[cur.y][cur.x] || engine.power[cur.y][cur.x])) {
      return cur.first;
    }
    for (const dir of ALL_DIRS) {
      const v = DIR_VECTORS[dir];
      const nx = cur.x + v.x;
      const ny = cur.y + v.y;
      if (isWall(nx, ny)) {
        continue;
      }
      const key = `${nx},${ny}`;
      if (visited.has(key) || danger.has(key)) {
        continue;
      }
      visited.add(key);
      queue.push({ x: nx, y: ny, first: cur.first ?? dir });
    }
  }

  for (const dir of ALL_DIRS) {
    const v = DIR_VECTORS[dir];
    const nx = start.x + v.x;
    const ny = start.y + v.y;
    if (!isWall(nx, ny) && !danger.has(`${nx},${ny}`)) {
      return dir;
    }
  }
  for (const dir of ALL_DIRS) {
    const v = DIR_VECTORS[dir];
    if (!isWall(start.x + v.x, start.y + v.y)) {
      return dir;
    }
  }
  return null;
}
