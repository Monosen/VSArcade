// VSArcade 2048 — Canvas renderer

import {
  COLOR_BG,
  COLOR_BOARD_BG,
  COLOR_EMPTY_TILE,
  GRID_SIZE,
  TILE_FALLBACK,
  TILE_GAP,
  TILE_PALETTE,
  TILE_SIZE,
} from "./constants";
import type { TwosEngine } from "./engine";
import { drawPixelText, measurePixelText } from "../../webview/text";

const BOARD_INNER_WIDTH = GRID_SIZE * TILE_SIZE + (GRID_SIZE + 1) * TILE_GAP;

function tileStyle(value: number): { bg: string; fg: string } {
  return TILE_PALETTE[value] ?? TILE_FALLBACK;
}

function chooseScale(digits: number): number {
  return digits <= 2 ? 2 : 1;
}

export class TwosRenderer {
  private readonly offsetX: number;
  private readonly offsetY: number;

  constructor(private readonly ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.offsetX = Math.floor((canvas.width - BOARD_INNER_WIDTH) / 2);
    this.offsetY = Math.floor((canvas.height - BOARD_INNER_WIDTH) / 2);
  }

  render(engine: TwosEngine): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, BOARD_INNER_WIDTH + this.offsetX * 2, BOARD_INNER_WIDTH + this.offsetY * 2);

    ctx.fillStyle = COLOR_BOARD_BG;
    ctx.fillRect(this.offsetX, this.offsetY, BOARD_INNER_WIDTH, BOARD_INNER_WIDTH);

    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        this.drawTile(r, c, engine.board[r][c]);
      }
    }
  }

  private drawTile(row: number, col: number, value: number): void {
    const x = this.offsetX + TILE_GAP + col * (TILE_SIZE + TILE_GAP);
    const y = this.offsetY + TILE_GAP + row * (TILE_SIZE + TILE_GAP);

    if (value === 0) {
      this.ctx.fillStyle = COLOR_EMPTY_TILE;
      this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      return;
    }

    const style = tileStyle(value);
    this.ctx.fillStyle = style.bg;
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    const text = String(value);
    const scale = chooseScale(text.length);
    const textWidth = measurePixelText(text, scale);
    const textHeight = 5 * scale;
    const tx = x + Math.floor((TILE_SIZE - textWidth) / 2);
    const ty = y + Math.floor((TILE_SIZE - textHeight) / 2);
    drawPixelText(this.ctx, text, tx, ty, scale, style.fg);
  }
}
