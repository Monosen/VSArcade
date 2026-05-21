// VSArcade MineHunt — Auto-play planner (constraint deduction + guess)

import { COLS, ROWS } from "./constants";
import { MineHuntEngine, neighbors } from "./engine";
import type { Vec } from "./types";

export interface MineAction {
  x: number;
  y: number;
  kind: "reveal" | "flag";
}

function deduce(engine: MineHuntEngine): { safe: Vec[]; mines: Vec[] } {
  const safe: Vec[] = [];
  const mines: Vec[] = [];

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = engine.grid[y][x];
      if (!cell.revealed || cell.adjacentMines === 0) {
        continue;
      }
      const hidden: Vec[] = [];
      let flagged = 0;
      for (const n of neighbors(x, y)) {
        const nc = engine.grid[n.y][n.x];
        if (nc.flagged) {
          flagged += 1;
        } else if (!nc.revealed) {
          hidden.push(n);
        }
      }
      if (hidden.length === 0) {
        continue;
      }
      if (cell.adjacentMines === flagged) {
        safe.push(...hidden);
      } else if (cell.adjacentMines === flagged + hidden.length) {
        mines.push(...hidden);
      }
    }
  }

  return { safe, mines };
}

export function planNextAction(engine: MineHuntEngine): MineAction | null {
  if (!engine.minesPlaced) {
    return { x: engine.cursor.x, y: engine.cursor.y, kind: "reveal" };
  }

  const { safe, mines } = deduce(engine);

  for (const cell of safe) {
    const c = engine.grid[cell.y][cell.x];
    if (!c.revealed && !c.flagged) {
      return { x: cell.x, y: cell.y, kind: "reveal" };
    }
  }

  for (const cell of mines) {
    const c = engine.grid[cell.y][cell.x];
    if (!c.revealed && !c.flagged) {
      return { x: cell.x, y: cell.y, kind: "flag" };
    }
  }

  const candidates: Vec[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const c = engine.grid[y][x];
      if (!c.revealed && !c.flagged) {
        candidates.push({ x, y });
      }
    }
  }
  if (candidates.length === 0) {
    return null;
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { x: pick.x, y: pick.y, kind: "reveal" };
}
