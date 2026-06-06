// VSArcade DotChase — Auto-play planner (BFS to pellet, chase frightened ghosts)

import { isWall } from "./maze";
import { ALL_DIRS, DIR_VECTORS, type Dir } from "./types";
import type { DotChaseEngine } from "./engine";

function manhattanDist(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function buildDangerSet(engine: DotChaseEngine): Set<string> {
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
  return danger;
}

function bfsTo(
  engine: DotChaseEngine,
  targetX: number,
  targetY: number,
  blocked: Set<string>,
): Dir | null {
  const start = engine.pac;
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const queue: { x: number; y: number; first: Dir | null }[] = [
    { x: start.x, y: start.y, first: null },
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.x === targetX && cur.y === targetY && cur.first !== null) {
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
      if (visited.has(key) || blocked.has(key)) {
        continue;
      }
      visited.add(key);
      queue.push({ x: nx, y: ny, first: cur.first ?? dir });
    }
  }
  return null;
}

function bfsToPellet(engine: DotChaseEngine, danger: Set<string>): Dir | null {
  const start = engine.pac;
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const queue: { x: number; y: number; first: Dir | null }[] = [
    { x: start.x, y: start.y, first: null },
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.first !== null && (engine.pellets[cur.y]?.[cur.x] || engine.power[cur.y]?.[cur.x])) {
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
  return null;
}

function safeMove(engine: DotChaseEngine, danger: Set<string>): Dir | null {
  const { x, y } = engine.pac;
  // Try any non-dangerous, non-wall move
  for (const dir of ALL_DIRS) {
    const v = DIR_VECTORS[dir];
    const nx = x + v.x;
    const ny = y + v.y;
    if (!isWall(nx, ny) && !danger.has(`${nx},${ny}`)) {
      return dir;
    }
  }
  // Last resort: any non-wall move
  for (const dir of ALL_DIRS) {
    const v = DIR_VECTORS[dir];
    if (!isWall(x + v.x, y + v.y)) {
      return dir;
    }
  }
  return null;
}

export function planDesiredDir(engine: DotChaseEngine): Dir | null {
  const { x, y } = engine.pac;

  // Chase nearest frightened ghost — they're worth points and clear threats
  if (engine.frightenedTimer > 400) {
    let nearestGhost = null;
    let nearestDist = Infinity;
    for (const ghost of engine.ghosts) {
      if (!ghost.frightened) {
        continue;
      }
      const d = manhattanDist(x, y, ghost.x, ghost.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestGhost = ghost;
      }
    }
    if (nearestGhost) {
      const dir = bfsTo(engine, nearestGhost.x, nearestGhost.y, new Set());
      if (dir) {
        return dir;
      }
    }
  }

  const danger = buildDangerSet(engine);

  // When ghosts are dangerously close, go for a power pellet first
  const nearbyGhostCount = engine.ghosts.filter(
    (g) => !g.frightened && manhattanDist(x, y, g.x, g.y) < 5,
  ).length;

  if (nearbyGhostCount >= 2) {
    for (let py = 0; py < engine.power.length; py += 1) {
      for (let px = 0; px < engine.power[py].length; px += 1) {
        if (engine.power[py][px]) {
          const dir = bfsTo(engine, px, py, new Set()); // Ignore danger to reach power
          if (dir) {
            return dir;
          }
        }
      }
    }
  }

  return bfsToPellet(engine, danger) ?? safeMove(engine, danger);
}
