// VSArcade Snake — Canvas renderer

import {
  CELL_SIZE,
  COLOR_BG,
  COLOR_BODY,
  COLOR_BORDER,
  COLOR_FOOD,
  COLOR_HEAD,
  GRID_HEIGHT,
  GRID_WIDTH,
} from "./constants";
import type { SnakeEngine } from "./engine";

const BOARD_OFFSET_X = 0;
const BOARD_OFFSET_Y = 0;

export class SnakeRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D, private readonly canvas: HTMLCanvasElement) {}

  render(engine: SnakeEngine): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const boardW = GRID_WIDTH * CELL_SIZE;
    const boardH = GRID_HEIGHT * CELL_SIZE;
    const offsetX = Math.floor((this.canvas.width - boardW) / 2);
    const offsetY = Math.floor((this.canvas.height - boardH) / 2);

    ctx.save();
    ctx.translate(offsetX + BOARD_OFFSET_X, offsetY + BOARD_OFFSET_Y);

    ctx.fillStyle = COLOR_FOOD;
    ctx.fillRect(
      engine.food.x * CELL_SIZE,
      engine.food.y * CELL_SIZE,
      CELL_SIZE - 1,
      CELL_SIZE - 1,
    );

    engine.body.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? COLOR_HEAD : COLOR_BODY;
      ctx.fillRect(p.x * CELL_SIZE, p.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    });

    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, boardW, boardH);
    ctx.restore();
  }
}
