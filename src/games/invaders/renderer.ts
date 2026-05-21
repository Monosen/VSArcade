// VSArcade Invaders — Canvas renderer

import {
  ALIEN_COLS,
  ALIEN_H,
  ALIEN_ROW_COLORS,
  ALIEN_ROWS,
  ALIEN_W,
  BOMB_H,
  BOMB_W,
  BULLET_H,
  BULLET_W,
  CANVAS_H,
  CANVAS_W,
  COLOR_BG,
  COLOR_BOMB,
  COLOR_BULLET,
  COLOR_LIFE,
  COLOR_SHIP,
  SHIP_H,
  SHIP_W,
  SHIP_Y,
} from "./constants";
import { alienX, alienY, type InvadersEngine } from "./engine";

export class InvadersRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(engine: InvadersEngine): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (let row = 0; row < ALIEN_ROWS; row += 1) {
      ctx.fillStyle = ALIEN_ROW_COLORS[row % ALIEN_ROW_COLORS.length];
      for (let col = 0; col < ALIEN_COLS; col += 1) {
        if (!engine.aliens[row][col]) {
          continue;
        }
        const ax = alienX(engine.formationX, col);
        const ay = alienY(engine.formationY, row);
        ctx.fillRect(ax, ay, ALIEN_W, ALIEN_H);
        ctx.fillStyle = COLOR_BG;
        ctx.fillRect(ax + 2, ay + 2, 2, 2);
        ctx.fillRect(ax + ALIEN_W - 4, ay + 2, 2, 2);
        ctx.fillStyle = ALIEN_ROW_COLORS[row % ALIEN_ROW_COLORS.length];
      }
    }

    ctx.fillStyle = COLOR_BULLET;
    for (const bullet of engine.bullets) {
      ctx.fillRect(bullet.x, bullet.y, BULLET_W, BULLET_H);
    }

    ctx.fillStyle = COLOR_BOMB;
    for (const bomb of engine.bombs) {
      ctx.fillRect(bomb.x, bomb.y, BOMB_W, BOMB_H);
    }

    ctx.fillStyle = COLOR_SHIP;
    ctx.fillRect(engine.shipX, SHIP_Y + 3, SHIP_W, SHIP_H - 3);
    ctx.fillRect(engine.shipX + SHIP_W / 2 - 2, SHIP_Y, 4, 4);

    for (let i = 0; i < engine.lives; i += 1) {
      ctx.fillStyle = COLOR_LIFE;
      ctx.fillRect(4 + i * 8, CANVAS_H - 8, 5, 4);
    }
  }
}
