// VSArcade MineHunt — Pure game logic

import { COLS, MINE_COUNT, ROWS } from "./constants";
import type { Cell, MineGrid, MineHuntSnapshot, Vec } from "./types";

export function neighbors(x: number, y: number): Vec[] {
  const result: Vec[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
        result.push({ x: nx, y: ny });
      }
    }
  }
  return result;
}

function createGrid(): MineGrid {
  return Array.from({ length: ROWS }, () =>
    Array.from(
      { length: COLS },
      (): Cell => ({ mine: false, revealed: false, flagged: false, adjacentMines: 0 }),
    ),
  );
}

function cloneGrid(grid: MineGrid): MineGrid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

export class MineHuntEngine {
  grid: MineGrid = createGrid();
  cursor: Vec = { x: 0, y: 0 };
  minesPlaced = false;
  score = 0;
  gameOver = false;
  won = false;

  reset(): void {
    this.grid = createGrid();
    this.cursor = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
    this.minesPlaced = false;
    this.score = 0;
    this.gameOver = false;
    this.won = false;
  }

  moveCursor(dx: number, dy: number): void {
    if (this.gameOver) {
      return;
    }
    this.cursor = {
      x: Math.min(Math.max(this.cursor.x + dx, 0), COLS - 1),
      y: Math.min(Math.max(this.cursor.y + dy, 0), ROWS - 1),
    };
  }

  reveal(): void {
    if (this.gameOver) {
      return;
    }
    const { x, y } = this.cursor;
    const cell = this.grid[y][x];
    if (cell.revealed || cell.flagged) {
      return;
    }
    if (!this.minesPlaced) {
      this.placeMines(x, y);
      this.minesPlaced = true;
    }
    if (cell.mine) {
      cell.revealed = true;
      this.gameOver = true;
      this.revealAllMines();
      return;
    }
    this.floodReveal(x, y);
    this.checkWin();
  }

  toggleFlag(): void {
    if (this.gameOver) {
      return;
    }
    const cell = this.grid[this.cursor.y][this.cursor.x];
    if (cell.revealed) {
      return;
    }
    cell.flagged = !cell.flagged;
  }

  getSnapshot(): MineHuntSnapshot {
    return {
      grid: cloneGrid(this.grid),
      cursor: { ...this.cursor },
      minesPlaced: this.minesPlaced,
      score: this.score,
      gameOver: this.gameOver,
      won: this.won,
    };
  }

  applySnapshot(s: MineHuntSnapshot): void {
    this.grid = cloneGrid(s.grid);
    this.cursor = { ...s.cursor };
    this.minesPlaced = s.minesPlaced;
    this.score = s.score;
    this.gameOver = s.gameOver;
    this.won = s.won;
  }

  private placeMines(safeX: number, safeY: number): void {
    const forbidden = new Set<string>([`${safeX},${safeY}`]);
    for (const n of neighbors(safeX, safeY)) {
      forbidden.add(`${n.x},${n.y}`);
    }

    const candidates: Vec[] = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!forbidden.has(`${x},${y}`)) {
          candidates.push({ x, y });
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const mineCount = Math.min(MINE_COUNT, candidates.length);
    for (let i = 0; i < mineCount; i += 1) {
      const { x, y } = candidates[i];
      this.grid[y][x].mine = true;
    }

    this.computeAdjacency();
  }

  private computeAdjacency(): void {
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (this.grid[y][x].mine) {
          continue;
        }
        let count = 0;
        for (const n of neighbors(x, y)) {
          if (this.grid[n.y][n.x].mine) {
            count += 1;
          }
        }
        this.grid[y][x].adjacentMines = count;
      }
    }
  }

  private floodReveal(startX: number, startY: number): void {
    const stack: Vec[] = [{ x: startX, y: startY }];
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const cell = this.grid[y][x];
      if (cell.revealed || cell.flagged || cell.mine) {
        continue;
      }
      cell.revealed = true;
      this.score += 1;
      if (cell.adjacentMines === 0) {
        for (const n of neighbors(x, y)) {
          const nc = this.grid[n.y][n.x];
          if (!nc.revealed && !nc.flagged && !nc.mine) {
            stack.push(n);
          }
        }
      }
    }
  }

  private revealAllMines(): void {
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.mine) {
          cell.revealed = true;
        }
      }
    }
  }

  private checkWin(): void {
    for (const row of this.grid) {
      for (const cell of row) {
        if (!cell.mine && !cell.revealed) {
          return;
        }
      }
    }
    this.won = true;
    this.gameOver = true;
  }
}
