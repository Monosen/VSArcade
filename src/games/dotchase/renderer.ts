// VSArcade DotChase — Canvas renderer

import {
  CELL,
  COLOR_BG,
  COLOR_FRIGHTENED,
  COLOR_LIFE,
  COLOR_PAC,
  COLOR_PELLET,
  COLOR_POWER,
  COLOR_WALL,
  COLS,
  GHOST_COLORS,
  ROWS,
} from "./constants";
import { isWall } from "./maze";
import type { DotChaseEngine } from "./engine";
import type { Dir } from "./types";

const CANVAS_W = 160;
const CANVAS_H = 144;
const OFFSET_X = Math.floor((CANVAS_W - COLS * CELL) / 2);
const OFFSET_Y = Math.floor((CANVAS_H - ROWS * CELL) / 2);

const MOUTH_ANGLE: Record<Dir, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

export class DotChaseRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(engine: DotChaseEngine): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (isWall(x, y)) {
          ctx.fillStyle = COLOR_WALL;
          ctx.fillRect(OFFSET_X + x * CELL, OFFSET_Y + y * CELL, CELL, CELL);
        }
      }
    }

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cx = OFFSET_X + x * CELL + CELL / 2;
        const cy = OFFSET_Y + y * CELL + CELL / 2;
        if (engine.pellets[y][x]) {
          ctx.fillStyle = COLOR_PELLET;
          ctx.fillRect(cx - 1, cy - 1, 2, 2);
        } else if (engine.power[y][x]) {
          ctx.fillStyle = COLOR_POWER;
          ctx.fillRect(cx - 2, cy - 2, 4, 4);
        }
      }
    }

    this.drawPacman(engine);

    for (const ghost of engine.ghosts) {
      const gx = OFFSET_X + ghost.x * CELL;
      const gy = OFFSET_Y + ghost.y * CELL;
      ctx.fillStyle = ghost.frightened ? COLOR_FRIGHTENED : GHOST_COLORS[ghost.kind];
      ctx.fillRect(gx + 1, gy + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(gx + 2, gy + 3, 2, 2);
      ctx.fillRect(gx + CELL - 4, gy + 3, 2, 2);
    }

    ctx.fillStyle = COLOR_LIFE;
    for (let i = 0; i < engine.lives; i += 1) {
      ctx.fillRect(4 + i * 8, CANVAS_H - 8, 5, 5);
    }
  }

  private drawPacman(engine: DotChaseEngine): void {
    const ctx = this.ctx;
    const cx = OFFSET_X + engine.pac.x * CELL + CELL / 2;
    const cy = OFFSET_Y + engine.pac.y * CELL + CELL / 2;
    const radius = CELL / 2 - 0.5;
    const angle = MOUTH_ANGLE[engine.pacDir];
    ctx.fillStyle = COLOR_PAC;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle + 0.4, angle + Math.PI * 2 - 0.4);
    ctx.closePath();
    ctx.fill();
  }
}
