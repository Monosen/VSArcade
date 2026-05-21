// VSArcade Skyhop — Canvas renderer

import {
  BIRD_SIZE,
  BIRD_X,
  CANVAS_H,
  CANVAS_W,
  COLOR_BIRD,
  COLOR_BIRD_EYE,
  COLOR_GROUND,
  COLOR_GROUND_TOP,
  COLOR_PIPE,
  COLOR_PIPE_EDGE,
  COLOR_SCORE,
  COLOR_SKY,
  GROUND_H,
  PIPE_GAP,
  PIPE_W,
} from "./constants";
import type { SkyhopEngine } from "./engine";
import { drawPixelText, measurePixelText } from "../../webview/text";

const FLOOR_Y = CANVAS_H - GROUND_H;

export class SkyhopRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(engine: SkyhopEngine): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_SKY;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const pipe of engine.pipes) {
      ctx.fillStyle = COLOR_PIPE;
      ctx.fillRect(pipe.x, 0, PIPE_W, pipe.gapY);
      ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_W, FLOOR_Y - pipe.gapY - PIPE_GAP);
      ctx.fillStyle = COLOR_PIPE_EDGE;
      ctx.fillRect(pipe.x, pipe.gapY - 4, PIPE_W, 4);
      ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_W, 4);
    }

    ctx.fillStyle = COLOR_GROUND;
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, GROUND_H);
    ctx.fillStyle = COLOR_GROUND_TOP;
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, 2);

    ctx.fillStyle = COLOR_BIRD;
    ctx.fillRect(BIRD_X, engine.birdY, BIRD_SIZE, BIRD_SIZE);
    ctx.fillStyle = COLOR_BIRD_EYE;
    ctx.fillRect(BIRD_X + BIRD_SIZE - 4, engine.birdY + 2, 2, 2);

    const text = String(engine.score);
    drawPixelText(
      ctx,
      text,
      Math.floor((CANVAS_W - measurePixelText(text, 2)) / 2),
      8,
      2,
      COLOR_SCORE,
    );
  }
}
