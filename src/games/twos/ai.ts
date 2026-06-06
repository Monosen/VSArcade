// VSArcade 2048 — Auto-play planner (2-ply expectimax)

import { GRID_SIZE } from "./constants";
import { cloneBoard, simulateMove } from "./engine";
import { ALL_DIRECTIONS } from "./types";
import type { Board, Direction } from "./types";

const SNAKE_WEIGHTS: number[][] = [
  [16, 15, 14, 13],
  [9, 10, 11, 12],
  [8, 7, 6, 5],
  [1, 2, 3, 4],
];

function evaluate(board: Board): number {
  let empty = 0;
  let snake = 0;
  let smoothness = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const v = board[r][c];
      if (v === 0) {
        empty += 1;
        continue;
      }
      snake += v * SNAKE_WEIGHTS[r][c];
      if (c < GRID_SIZE - 1 && board[r][c + 1] !== 0) {
        smoothness -= Math.abs(Math.log2(v) - Math.log2(board[r][c + 1]));
      }
      if (r < GRID_SIZE - 1 && board[r + 1][c] !== 0) {
        smoothness -= Math.abs(Math.log2(v) - Math.log2(board[r + 1][c]));
      }
    }
  }
  return snake * 2 + empty * 250 + smoothness * 12;
}

interface EmptyCell { r: number; c: number }

function emptyCells(board: Board): EmptyCell[] {
  const cells: EmptyCell[] = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (board[r][c] === 0) {
        cells.push({ r, c });
      }
    }
  }
  return cells;
}

function bestMoveScore(board: Board): number {
  let best = -Infinity;
  for (const dir of ALL_DIRECTIONS) {
    const result = simulateMove(board, dir);
    if (!result.changed) {
      continue;
    }
    const s = evaluate(result.board) + result.gained * 4;
    if (s > best) {
      best = s;
    }
  }
  return best === -Infinity ? evaluate(board) : best;
}

export function planNextDirection(board: Board): Direction | null {
  let best: { dir: Direction; score: number } | null = null;

  for (const dir of ALL_DIRECTIONS) {
    const result = simulateMove(board, dir);
    if (!result.changed) {
      continue;
    }

    const cells = emptyCells(result.board);
    let lookahead = 0;

    if (cells.length === 0) {
      lookahead = bestMoveScore(result.board);
    } else {
      // Sample up to 6 random tile placements (90% chance of 2, 10% chance of 4)
      const samples = Math.min(cells.length, 6);
      const step = Math.max(1, Math.floor(cells.length / samples));
      let count = 0;
      for (let i = 0; i < cells.length; i += step) {
        const cell = cells[i];
        const next = cloneBoard(result.board);
        next[cell.r][cell.c] = 2;
        lookahead += bestMoveScore(next) * 0.9;
        const next4 = cloneBoard(result.board);
        next4[cell.r][cell.c] = 4;
        lookahead += bestMoveScore(next4) * 0.1;
        count += 1;
      }
      if (count > 0) {
        lookahead /= count;
      }
    }

    const totalScore = evaluate(result.board) * 0.4 + result.gained * 4 + lookahead * 0.6;

    if (!best || totalScore > best.score) {
      best = { dir, score: totalScore };
    }
  }

  return best?.dir ?? null;
}
