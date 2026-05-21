// VSArcade Pong — Canvas renderer

import {
  BALL_SIZE,
  CANVAS_H,
  CANVAS_W,
  COLOR_BALL,
  COLOR_BG,
  COLOR_NET,
  COLOR_OPPONENT,
  COLOR_PADDLE,
  COLOR_SCORE,
  OPPONENT_X,
  PADDLE_H,
  PADDLE_W,
  PLAYER_X,
} from "./constants";
import type { PongEngine } from "./engine";
import { drawPixelText, measurePixelText } from "../../webview/text";

export class PongRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(engine: PongEngine): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = COLOR_NET;
    for (let y = 4; y < CANVAS_H; y += 10) {
      ctx.fillRect(CANVAS_W / 2 - 1, y, 2, 5);
    }

    ctx.fillStyle = COLOR_SCORE;
    const left = String(engine.playerScore);
    const right = String(engine.opponentScore);
    drawPixelText(ctx, left, CANVAS_W / 2 - 20 - measurePixelText(left, 2), 6, 2, COLOR_PADDLE);
    drawPixelText(ctx, right, CANVAS_W / 2 + 20, 6, 2, COLOR_OPPONENT);

    ctx.fillStyle = COLOR_PADDLE;
    ctx.fillRect(PLAYER_X, engine.playerY, PADDLE_W, PADDLE_H);

    ctx.fillStyle = COLOR_OPPONENT;
    ctx.fillRect(OPPONENT_X, engine.opponentY, PADDLE_W, PADDLE_H);

    ctx.fillStyle = COLOR_BALL;
    ctx.fillRect(engine.ballX, engine.ballY, BALL_SIZE, BALL_SIZE);
  }
}
