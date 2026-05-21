// VSArcade Duel — Canvas renderer

import {
  CANVAS_H,
  CANVAS_W,
  COLOR_BG,
  COLOR_GROUND,
  COLOR_HEALTH_BG,
  COLOR_HEALTH_OPPONENT,
  COLOR_HEALTH_PLAYER,
  COLOR_HURT,
  COLOR_OPPONENT,
  COLOR_PLAYER,
  FIGHTER_H,
  FIGHTER_W,
  GROUND_Y,
  MAX_HEALTH,
} from "./constants";
import type { DuelEngine } from "./engine";
import type { Fighter } from "./types";

const HEALTH_BAR_W = 62;
const HEALTH_BAR_H = 6;

export class DuelRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(engine: DuelEngine): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = COLOR_GROUND;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    this.drawHealth(engine.player.health, 6, COLOR_HEALTH_PLAYER, false);
    this.drawHealth(
      engine.opponent.health,
      CANVAS_W - 6 - HEALTH_BAR_W,
      COLOR_HEALTH_OPPONENT,
      true,
    );

    this.drawFighter(engine.player, COLOR_PLAYER);
    this.drawFighter(engine.opponent, COLOR_OPPONENT);
  }

  private drawHealth(health: number, x: number, color: string, rightAligned: boolean): void {
    const ctx = this.ctx;
    const ratio = Math.max(0, health) / MAX_HEALTH;
    const fillW = Math.round(HEALTH_BAR_W * ratio);
    ctx.fillStyle = COLOR_HEALTH_BG;
    ctx.fillRect(x, 6, HEALTH_BAR_W, HEALTH_BAR_H);
    ctx.fillStyle = color;
    if (rightAligned) {
      ctx.fillRect(x + HEALTH_BAR_W - fillW, 6, fillW, HEALTH_BAR_H);
    } else {
      ctx.fillRect(x, 6, fillW, HEALTH_BAR_H);
    }
  }

  private drawFighter(fighter: Fighter, color: string): void {
    const ctx = this.ctx;
    const bodyColor = fighter.state === "hurt" ? COLOR_HURT : color;

    if (fighter.state === "ko") {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(fighter.x - 8, GROUND_Y - 10, FIGHTER_W + 16, 10);
      return;
    }

    const topY = GROUND_Y - FIGHTER_H;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(fighter.x, topY + 9, FIGHTER_W, FIGHTER_H - 9);
    ctx.fillRect(fighter.x + FIGHTER_W / 2 - 4, topY, 8, 8);

    if (fighter.state === "attack") {
      const high = fighter.attackKind !== "low";
      const armY = high ? topY + 13 : topY + 28;
      const armLen = high ? 14 : 21;
      const armX = fighter.facing === 1 ? fighter.x + FIGHTER_W : fighter.x - armLen;
      ctx.fillRect(armX, armY, armLen, 4);
    } else if (fighter.state === "block") {
      const guardX = fighter.facing === 1
        ? fighter.x + FIGHTER_W - 3
        : fighter.x - 3;
      ctx.fillStyle = COLOR_HURT;
      ctx.fillRect(guardX, topY + 14, 6, 18);
    }
  }
}
