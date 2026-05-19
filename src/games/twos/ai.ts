// VSArcade 2048 — Auto-play planner (1-ply heuristic)

import { GRID_SIZE } from "./constants";
import { simulateMove } from "./engine";
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
  return snake + empty * 200 + smoothness * 8;
}

export function planNextDirection(board: Board): Direction | null {
  let best: { dir: Direction; score: number } | null = null;
  for (const dir of ALL_DIRECTIONS) {
    const result = simulateMove(board, dir);
    if (!result.changed) {
      continue;
    }
    const score = evaluate(result.board) + result.gained * 4;
    if (!best || score > best.score) {
      best = { dir, score };
    }
  }
  return best?.dir ?? null;
}
