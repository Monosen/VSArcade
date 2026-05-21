// VSArcade Brickout — Canvas renderer

import {
  BALL_SIZE,
  BRICK_COLS,
  BRICK_ROW_COLORS,
  BRICK_ROWS,
  CANVAS_H,
  CANVAS_W,
  COLOR_BALL,
  COLOR_BG,
  COLOR_LIFE,
  COLOR_PADDLE,
  PADDLE_H,
  PADDLE_W,
  PADDLE_Y,
} from "./constants";
import { BrickoutEngine, brickRect } from "./engine";

export class BrickoutRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(engine: BrickoutEngine): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (let row = 0; row < BRICK_ROWS; row += 1) {
      ctx.fillStyle = BRICK_ROW_COLORS[row % BRICK_ROW_COLORS.length];
      for (let col = 0; col < BRICK_COLS; col += 1) {
        if (!engine.bricks[row][col]) {
          continue;
        }
        const rect = brickRect(row, col);
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      }
    }

    ctx.fillStyle = COLOR_LIFE;
    for (let i = 0; i < engine.lives; i += 1) {
      ctx.fillRect(4 + i * 8, 6, 5, 5);
    }

    ctx.fillStyle = COLOR_PADDLE;
    ctx.fillRect(engine.paddleX, PADDLE_Y, PADDLE_W, PADDLE_H);

    ctx.fillStyle = COLOR_BALL;
    ctx.fillRect(engine.ballX, engine.ballY, BALL_SIZE, BALL_SIZE);
  }
}
