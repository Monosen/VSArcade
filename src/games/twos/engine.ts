// VSArcade 2048 — Pure game logic

import { GRID_SIZE, WIN_TILE } from "./constants";
import { ALL_DIRECTIONS } from "./types";
import type { Board, Direction, TwosSnapshot } from "./types";

export function emptyBoard(): Board {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => 0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (a[r][c] !== b[r][c]) {
        return false;
      }
    }
  }
  return true;
}

function compressLine(line: number[]): { line: number[]; gained: number } {
  const filtered = line.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < filtered.length - 1; i += 1) {
    if (filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      filtered[i] = merged;
      gained += merged;
      filtered.splice(i + 1, 1);
    }
  }
  while (filtered.length < line.length) {
    filtered.push(0);
  }
  return { line: filtered, gained };
}

export function simulateMove(board: Board, dir: Direction): { board: Board; gained: number; changed: boolean } {
  const next = emptyBoard();
  let gained = 0;

  for (let i = 0; i < GRID_SIZE; i += 1) {
    let line: number[];
    switch (dir) {
      case "left":
        line = board[i].slice();
        break;
      case "right":
        line = board[i].slice().reverse();
        break;
      case "up":
        line = board.map((row) => row[i]);
        break;
      case "down":
        line = board.map((row) => row[i]).reverse();
        break;
    }
    const result = compressLine(line);
    gained += result.gained;
    let written = result.line;
    switch (dir) {
      case "left":
        next[i] = written;
        break;
      case "right":
        next[i] = written.reverse();
        break;
      case "up":
        written.forEach((v, j) => {
          next[j][i] = v;
        });
        break;
      case "down":
        written = written.reverse();
        written.forEach((v, j) => {
          next[j][i] = v;
        });
        break;
    }
  }

  return { board: next, gained, changed: !boardsEqual(board, next) };
}

export function hasAnyMove(board: Board): boolean {
  for (const dir of ALL_DIRECTIONS) {
    if (simulateMove(board, dir).changed) {
      return true;
    }
  }
  return false;
}

function emptyCells(board: Board): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (board[r][c] === 0) {
        cells.push({ r, c });
      }
    }
  }
  return cells;
}

export class TwosEngine {
  board: Board = emptyBoard();
  score = 0;
  gameOver = false;
  won = false;

  reset(): void {
    this.board = emptyBoard();
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.spawnTile();
    this.spawnTile();
  }

  move(dir: Direction): boolean {
    if (this.gameOver) {
      return false;
    }
    const result = simulateMove(this.board, dir);
    if (!result.changed) {
      return false;
    }
    this.board = result.board;
    this.score += result.gained;
    if (!this.won && this.board.some((row) => row.includes(WIN_TILE))) {
      this.won = true;
    }
    this.spawnTile();
    if (!hasAnyMove(this.board)) {
      this.gameOver = true;
    }
    return true;
  }

  getSnapshot(): TwosSnapshot {
    return {
      board: cloneBoard(this.board),
      score: this.score,
      gameOver: this.gameOver,
      won: this.won,
    };
  }

  applySnapshot(s: TwosSnapshot): void {
    this.board = cloneBoard(s.board);
    this.score = s.score;
    this.gameOver = s.gameOver;
    this.won = s.won;
  }

  private spawnTile(): void {
    const cells = emptyCells(this.board);
    if (cells.length === 0) {
      return;
    }
    const target = cells[Math.floor(Math.random() * cells.length)];
    this.board[target.r][target.c] = Math.random() < 0.9 ? 2 : 4;
  }
}
