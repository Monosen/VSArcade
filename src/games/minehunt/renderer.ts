// VSArcade MineHunt — Canvas renderer

import {
  CELL_SIZE,
  COLOR_BG,
  COLOR_CURSOR,
  COLOR_FLAG,
  COLOR_GRID_LINE,
  COLOR_HIDDEN,
  COLOR_MINE,
  COLOR_REVEALED,
  COLS,
  NUMBER_COLORS,
  ROWS,
} from "./constants";
import type { MineHuntEngine } from "./engine";
import type { Cell } from "./types";
import { drawPixelText, measurePixelText } from "../../webview/text";

const BOARD_WIDTH = COLS * CELL_SIZE;
const BOARD_HEIGHT = ROWS * CELL_SIZE;

export class MineHuntRenderer {
  private readonly offsetX: number;
  private readonly offsetY: number;

  constructor(private readonly ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.offsetX = Math.floor((canvas.width - BOARD_WIDTH) / 2);
    this.offsetY = Math.floor((canvas.height - BOARD_HEIGHT) / 2);
  }

  render(engine: MineHuntEngine): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, this.offsetX * 2 + BOARD_WIDTH, this.offsetY * 2 + BOARD_HEIGHT);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        this.drawCell(x, y, engine.grid[y][x]);
      }
    }

    this.drawCursor(engine.cursor.x, engine.cursor.y);
  }

  private drawCell(gx: number, gy: number, cell: Cell): void {
    const ctx = this.ctx;
    const x = this.offsetX + gx * CELL_SIZE;
    const y = this.offsetY + gy * CELL_SIZE;

    if (cell.revealed) {
      ctx.fillStyle = COLOR_REVEALED;
      ctx.fillRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1);
      if (cell.mine) {
        ctx.fillStyle = COLOR_MINE;
        ctx.fillRect(x + 3, y + 3, CELL_SIZE - 7, CELL_SIZE - 7);
      } else if (cell.adjacentMines > 0) {
        const text = String(cell.adjacentMines);
        const tx = x + Math.floor((CELL_SIZE - measurePixelText(text, 1)) / 2);
        const ty = y + Math.floor((CELL_SIZE - 5) / 2);
        drawPixelText(ctx, text, tx, ty, 1, NUMBER_COLORS[cell.adjacentMines]);
      }
      return;
    }

    ctx.fillStyle = COLOR_HIDDEN;
    ctx.fillRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1);
    ctx.strokeStyle = COLOR_GRID_LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 2, CELL_SIZE - 2);

    if (cell.flagged) {
      ctx.fillStyle = COLOR_FLAG;
      ctx.fillRect(x + 3, y + 3, CELL_SIZE - 7, CELL_SIZE - 7);
    }
  }

  private drawCursor(gx: number, gy: number): void {
    const ctx = this.ctx;
    const x = this.offsetX + gx * CELL_SIZE;
    const y = this.offsetY + gy * CELL_SIZE;
    ctx.strokeStyle = COLOR_CURSOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 2, CELL_SIZE - 2);
  }
}
