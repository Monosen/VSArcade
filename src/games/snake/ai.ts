// VSArcade Snake — Auto-play planner (BFS to food, survival fallback)

import { GRID_HEIGHT, GRID_WIDTH } from "./constants";
import { DIRECTION_DELTAS, isOpposite } from "./types";
import type { Direction, Vec } from "./types";
import type { SnakeEngine } from "./engine";

const ALL_DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

function key(p: Vec): string {
  return `${p.x},${p.y}`;
}

function inBounds(p: Vec): boolean {
  return p.x >= 0 && p.x < GRID_WIDTH && p.y >= 0 && p.y < GRID_HEIGHT;
}

function blockedSet(engine: SnakeEngine): Set<string> {
  // Skip the tail — it will move out of the way on the next step.
  return new Set(engine.body.slice(0, -1).map(key));
}

function bfsDirection(engine: SnakeEngine): Direction | null {
  const head = engine.body[0];
  const target = engine.food;
  const blocked = blockedSet(engine);
  const visited = new Set<string>([key(head)]);
  const queue: { pos: Vec; firstDir: Direction | null }[] = [
    { pos: head, firstDir: null },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.pos.x === target.x && current.pos.y === target.y) {
      return current.firstDir;
    }
    for (const dir of ALL_DIRECTIONS) {
      if (current.firstDir === null && isOpposite(engine.direction, dir)) {
        continue;
      }
      const delta = DIRECTION_DELTAS[dir];
      const next: Vec = { x: current.pos.x + delta.x, y: current.pos.y + delta.y };
      if (!inBounds(next)) {
        continue;
      }
      const k = key(next);
      if (visited.has(k) || blocked.has(k)) {
        continue;
      }
      visited.add(k);
      queue.push({ pos: next, firstDir: current.firstDir ?? dir });
    }
  }
  return null;
}

function floodFillCount(start: Vec, blocked: Set<string>): number {
  if (!inBounds(start) || blocked.has(key(start))) {
    return 0;
  }
  const visited = new Set<string>([key(start)]);
  const stack: Vec[] = [start];
  while (stack.length > 0) {
    const p = stack.pop()!;
    for (const dir of ALL_DIRECTIONS) {
      const delta = DIRECTION_DELTAS[dir];
      const next: Vec = { x: p.x + delta.x, y: p.y + delta.y };
      if (!inBounds(next)) {
        continue;
      }
      const k = key(next);
      if (visited.has(k) || blocked.has(k)) {
        continue;
      }
      visited.add(k);
      stack.push(next);
    }
  }
  return visited.size;
}

function survivalDirection(engine: SnakeEngine): Direction | null {
  const head = engine.body[0];
  const blocked = blockedSet(engine);
  let best: { dir: Direction; space: number } | null = null;
  for (const dir of ALL_DIRECTIONS) {
    if (isOpposite(engine.direction, dir)) {
      continue;
    }
    const delta = DIRECTION_DELTAS[dir];
    const next: Vec = { x: head.x + delta.x, y: head.y + delta.y };
    if (!inBounds(next) || blocked.has(key(next))) {
      continue;
    }
    const space = floodFillCount(next, blocked);
    if (!best || space > best.space) {
      best = { dir, space };
    }
  }
  return best?.dir ?? null;
}

export function planNextDirection(engine: SnakeEngine): Direction | null {
  return bfsDirection(engine) ?? survivalDirection(engine);
}
