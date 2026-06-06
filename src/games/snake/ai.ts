// VSArcade Snake — Auto-play planner (BFS + safety check + tail chase)

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

// Body cells that block movement — excludes the tail since it will move next step.
function bodyBlocked(body: Vec[]): Set<string> {
  return new Set(body.slice(0, -1).map(key));
}

// BFS from start to target. Returns the first step and path to target, or null.
function bfs(
  start: Vec,
  target: Vec,
  blocked: Set<string>,
  currentDir: Direction,
): { dir: Direction; path: Vec[] } | null {
  if (start.x === target.x && start.y === target.y) {
    return null;
  }
  const visited = new Set<string>([key(start)]);
  const queue: { pos: Vec; dir: Direction | null; path: Vec[] }[] = [
    { pos: start, dir: null, path: [] },
  ];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const dir of ALL_DIRECTIONS) {
      if (cur.dir === null && isOpposite(currentDir, dir)) {
        continue;
      }
      const d = DIRECTION_DELTAS[dir];
      const next: Vec = { x: cur.pos.x + d.x, y: cur.pos.y + d.y };
      if (!inBounds(next)) {
        continue;
      }
      const k = key(next);
      if (visited.has(k) || blocked.has(k)) {
        continue;
      }
      visited.add(k);
      const firstDir = cur.dir ?? dir;
      const path = [...cur.path, next];
      if (next.x === target.x && next.y === target.y) {
        return { dir: firstDir, path };
      }
      queue.push({ pos: next, dir: firstDir, path });
    }
  }
  return null;
}

// BFS reachability check — returns true if target is reachable from start.
function canReach(start: Vec, target: Vec, blocked: Set<string>): boolean {
  if (start.x === target.x && start.y === target.y) {
    return true;
  }
  const visited = new Set<string>([key(start)]);
  const queue: Vec[] = [start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const dir of ALL_DIRECTIONS) {
      const d = DIRECTION_DELTAS[dir];
      const next: Vec = { x: cur.x + d.x, y: cur.y + d.y };
      if (!inBounds(next)) {
        continue;
      }
      const k = key(next);
      if (visited.has(k) || blocked.has(k)) {
        continue;
      }
      visited.add(k);
      if (next.x === target.x && next.y === target.y) {
        return true;
      }
      queue.push(next);
    }
  }
  return false;
}

// Flood fill — counts reachable cells from start.
function floodFill(start: Vec, blocked: Set<string>): number {
  if (!inBounds(start) || blocked.has(key(start))) {
    return 0;
  }
  const visited = new Set<string>([key(start)]);
  const stack: Vec[] = [start];
  while (stack.length > 0) {
    const p = stack.pop()!;
    for (const dir of ALL_DIRECTIONS) {
      const d = DIRECTION_DELTAS[dir];
      const next: Vec = { x: p.x + d.x, y: p.y + d.y };
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

/**
 * Safety check: after following `path` to eat the food,
 * can the snake still reach its own tail?
 */
function isFoodSafe(body: Vec[], path: Vec[]): boolean {
  const dist = path.length;
  const trimCount = Math.max(0, dist - 1);
  const newBody = [...path].reverse().concat(body.slice(0, body.length - trimCount));
  const newHead = newBody[0];
  const newTail = newBody[newBody.length - 1];
  const newBlocked = new Set(newBody.slice(0, -1).map(key));
  return canReach(newHead, newTail, newBlocked);
}

// Best survival direction by flood fill — most open space wins.
function survivalDirection(
  head: Vec,
  blocked: Set<string>,
  currentDir: Direction,
): Direction | null {
  let best: { dir: Direction; space: number } | null = null;
  for (const dir of ALL_DIRECTIONS) {
    if (isOpposite(currentDir, dir)) {
      continue;
    }
    const d = DIRECTION_DELTAS[dir];
    const next: Vec = { x: head.x + d.x, y: head.y + d.y };
    if (!inBounds(next) || blocked.has(key(next))) {
      continue;
    }
    const space = floodFill(next, blocked);
    if (!best || space > best.space) {
      best = { dir, space };
    }
  }
  return best?.dir ?? null;
}

export function planNextDirection(engine: SnakeEngine): Direction | null {
  const head = engine.body[0];
  const blocked = bodyBlocked(engine.body);

  // 1. BFS to food — take the path only if it leaves us able to reach our tail.
  const toFood = bfs(head, engine.food, blocked, engine.direction);
  if (toFood !== null) {
    const safe =
      engine.body.length < 5 || isFoodSafe(engine.body, toFood.path);
    if (safe) {
      return toFood.dir;
    }
  }

  // 2. Tail chase — follow our own tail. The tail always recedes one cell per step,
  //    so chasing it keeps the snake moving in a safe loop without trapping itself.
  const tail = engine.body[engine.body.length - 1];
  const toTail = bfs(head, tail, blocked, engine.direction);
  if (toTail !== null) {
    return toTail.dir;
  }

  // 3. Last resort — pick the direction with the most reachable open cells.
  return survivalDirection(head, blocked, engine.direction);
}
