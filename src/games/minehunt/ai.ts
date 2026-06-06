// VSArcade MineHunt — Auto-play planner (constraint deduction + probability guess)

import { COLS, MINE_COUNT, ROWS } from "./constants";
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

function estimateMineProb(engine: MineHuntEngine): Map<string, number> {
  const probs = new Map<string, number>();

  // Count total remaining mines and hidden cells for global fallback
  let totalFlagged = 0;
  const allHidden: Vec[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const c = engine.grid[y][x];
      if (c.flagged) {
        totalFlagged += 1;
      } else if (!c.revealed) {
        allHidden.push({ x, y });
      }
    }
  }
  const globalRemaining = MINE_COUNT - totalFlagged;
  const globalProb = allHidden.length > 0 ? globalRemaining / allHidden.length : 0;

  // Initialize all hidden cells with global probability
  for (const cell of allHidden) {
    probs.set(`${cell.x},${cell.y}`, globalProb);
  }

  // Override with local constraint estimates — accumulate and average.
  const localTotals = new Map<string, number>();
  const counts = new Map<string, number>();
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
      const localProb = Math.max(0, (cell.adjacentMines - flagged) / hidden.length);
      for (const h of hidden) {
        const k = `${h.x},${h.y}`;
        localTotals.set(k, (localTotals.get(k) ?? 0) + localProb);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }
  }

  // Average accumulated probabilities for constrained cells
  for (const [k, total] of localTotals.entries()) {
    const c = counts.get(k)!;
    if (c > 0) {
      probs.set(k, total / c);
    }
  }

  return probs;
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

  // Probability-based guess: pick the cell with the lowest mine probability
  const probs = estimateMineProb(engine);
  let bestCell: Vec | null = null;
  let bestProb = Infinity;

  for (const [key, prob] of probs.entries()) {
    const [cx, cy] = key.split(",").map(Number);
    const c = engine.grid[cy][cx];
    if (!c.revealed && !c.flagged && prob < bestProb) {
      bestProb = prob;
      bestCell = { x: cx, y: cy };
    }
  }

  if (!bestCell) {
    return null;
  }
  return { x: bestCell.x, y: bestCell.y, kind: "reveal" };
}
