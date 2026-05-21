// VSArcade Invaders — Pure game logic

import {
  ALIEN_COLS,
  ALIEN_H,
  ALIEN_MOVE_BASE_MS,
  ALIEN_MOVE_MIN_MS,
  ALIEN_ROWS,
  ALIEN_SLOT_H,
  ALIEN_SLOT_W,
  ALIEN_START_X,
  ALIEN_START_Y,
  ALIEN_STEP_DOWN,
  ALIEN_STEP_X,
  ALIEN_W,
  BOMB_CHANCE,
  BOMB_H,
  BOMB_SPEED,
  BOMB_W,
  BULLET_H,
  BULLET_SPEED,
  BULLET_W,
  CANVAS_W,
  FIRE_COOLDOWN_MS,
  SHIP_H,
  SHIP_SPEED,
  SHIP_W,
  SHIP_Y,
  START_LIVES,
} from "./constants";
import type { InvadersSnapshot, Vec } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function alienX(formationX: number, col: number): number {
  return formationX + col * ALIEN_SLOT_W;
}

export function alienY(formationY: number, row: number): number {
  return formationY + row * ALIEN_SLOT_H;
}

const TOTAL_ALIENS = ALIEN_COLS * ALIEN_ROWS;

export class InvadersEngine {
  shipX = 0;
  bullets: Vec[] = [];
  bombs: Vec[] = [];
  aliens: boolean[][] = [];
  formationX = ALIEN_START_X;
  formationY = ALIEN_START_Y;
  alienDir = 1;
  score = 0;
  lives = START_LIVES;
  gameOver = false;
  won = false;

  /** Ship intent: -1 left, 0 idle, 1 right. */
  playerIntent = 0;

  private moveAccumulator = 0;
  private fireCooldown = 0;

  reset(): void {
    this.aliens = Array.from({ length: ALIEN_ROWS }, () =>
      Array.from({ length: ALIEN_COLS }, () => true),
    );
    this.bullets = [];
    this.bombs = [];
    this.formationX = ALIEN_START_X;
    this.formationY = ALIEN_START_Y;
    this.alienDir = 1;
    this.score = 0;
    this.lives = START_LIVES;
    this.gameOver = false;
    this.won = false;
    this.playerIntent = 0;
    this.moveAccumulator = 0;
    this.fireCooldown = 0;
    this.shipX = (CANVAS_W - SHIP_W) / 2;
  }

  fire(): void {
    if (this.gameOver || this.fireCooldown > 0) {
      return;
    }
    this.bullets.push({ x: this.shipX + SHIP_W / 2 - BULLET_W / 2, y: SHIP_Y - BULLET_H });
    this.fireCooldown = FIRE_COOLDOWN_MS;
  }

  update(dt: number): void {
    if (this.gameOver) {
      return;
    }

    this.shipX = clamp(this.shipX + this.playerIntent * SHIP_SPEED * dt, 0, CANVAS_W - SHIP_W);
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }

    for (const bullet of this.bullets) {
      bullet.y -= BULLET_SPEED * dt;
    }
    this.bullets = this.bullets.filter((b) => b.y + BULLET_H > 0);

    for (const bomb of this.bombs) {
      bomb.y += BOMB_SPEED * dt;
    }
    this.bombs = this.bombs.filter((b) => b.y < SHIP_Y + SHIP_H);

    this.moveAccumulator += dt;
    const interval = Math.max(
      ALIEN_MOVE_MIN_MS,
      ALIEN_MOVE_BASE_MS * (this.aliveCount() / TOTAL_ALIENS),
    );
    while (this.moveAccumulator >= interval && !this.gameOver) {
      this.moveAccumulator -= interval;
      this.moveAliens();
    }

    this.resolveBulletHits();
    this.resolveBombHits();

    if (this.aliveCount() === 0) {
      this.won = true;
      this.gameOver = true;
    }
  }

  getSnapshot(): InvadersSnapshot {
    return {
      shipX: this.shipX,
      bullets: this.bullets.map((b) => ({ ...b })),
      bombs: this.bombs.map((b) => ({ ...b })),
      aliens: this.aliens.map((row) => row.slice()),
      formationX: this.formationX,
      formationY: this.formationY,
      alienDir: this.alienDir,
      score: this.score,
      lives: this.lives,
      gameOver: this.gameOver,
      won: this.won,
    };
  }

  applySnapshot(s: InvadersSnapshot): void {
    this.shipX = s.shipX;
    this.bullets = s.bullets.map((b) => ({ ...b }));
    this.bombs = s.bombs.map((b) => ({ ...b }));
    this.aliens = s.aliens.map((row) => row.slice());
    this.formationX = s.formationX;
    this.formationY = s.formationY;
    this.alienDir = s.alienDir;
    this.score = s.score;
    this.lives = s.lives;
    this.gameOver = s.gameOver;
    this.won = s.won;
  }

  aliveCount(): number {
    let count = 0;
    for (const row of this.aliens) {
      for (const alive of row) {
        if (alive) {
          count += 1;
        }
      }
    }
    return count;
  }

  private columnBounds(): { minCol: number; maxCol: number; maxRow: number } {
    let minCol = ALIEN_COLS;
    let maxCol = -1;
    let maxRow = -1;
    for (let row = 0; row < ALIEN_ROWS; row += 1) {
      for (let col = 0; col < ALIEN_COLS; col += 1) {
        if (!this.aliens[row][col]) {
          continue;
        }
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
        maxRow = Math.max(maxRow, row);
      }
    }
    return { minCol, maxCol, maxRow };
  }

  private moveAliens(): void {
    const { minCol, maxCol, maxRow } = this.columnBounds();
    if (maxCol < 0) {
      return;
    }

    const rightEdge = alienX(this.formationX, maxCol) + ALIEN_W;
    const leftEdge = alienX(this.formationX, minCol);

    if (this.alienDir > 0 && rightEdge + ALIEN_STEP_X > CANVAS_W) {
      this.alienDir = -1;
      this.formationY += ALIEN_STEP_DOWN;
    } else if (this.alienDir < 0 && leftEdge - ALIEN_STEP_X < 0) {
      this.alienDir = 1;
      this.formationY += ALIEN_STEP_DOWN;
    } else {
      this.formationX += this.alienDir * ALIEN_STEP_X;
    }

    if (alienY(this.formationY, maxRow) + ALIEN_H >= SHIP_Y) {
      this.gameOver = true;
      return;
    }

    this.maybeDropBomb();
  }

  private maybeDropBomb(): void {
    if (Math.random() > BOMB_CHANCE) {
      return;
    }
    const columns: number[] = [];
    for (let col = 0; col < ALIEN_COLS; col += 1) {
      for (let row = 0; row < ALIEN_ROWS; row += 1) {
        if (this.aliens[row][col]) {
          columns.push(col);
          break;
        }
      }
    }
    if (columns.length === 0) {
      return;
    }
    const col = columns[Math.floor(Math.random() * columns.length)];
    let bottomRow = -1;
    for (let row = 0; row < ALIEN_ROWS; row += 1) {
      if (this.aliens[row][col]) {
        bottomRow = row;
      }
    }
    if (bottomRow < 0) {
      return;
    }
    this.bombs.push({
      x: alienX(this.formationX, col) + ALIEN_W / 2 - BOMB_W / 2,
      y: alienY(this.formationY, bottomRow) + ALIEN_H,
    });
  }

  private resolveBulletHits(): void {
    const survivingBullets: Vec[] = [];
    for (const bullet of this.bullets) {
      let hit = false;
      for (let row = 0; row < ALIEN_ROWS && !hit; row += 1) {
        for (let col = 0; col < ALIEN_COLS && !hit; col += 1) {
          if (!this.aliens[row][col]) {
            continue;
          }
          const ax = alienX(this.formationX, col);
          const ay = alienY(this.formationY, row);
          if (
            bullet.x < ax + ALIEN_W &&
            bullet.x + BULLET_W > ax &&
            bullet.y < ay + ALIEN_H &&
            bullet.y + BULLET_H > ay
          ) {
            this.aliens[row][col] = false;
            this.score += (ALIEN_ROWS - row) * 10;
            hit = true;
          }
        }
      }
      if (!hit) {
        survivingBullets.push(bullet);
      }
    }
    this.bullets = survivingBullets;
  }

  private resolveBombHits(): void {
    const survivingBombs: Vec[] = [];
    for (const bomb of this.bombs) {
      if (
        bomb.x < this.shipX + SHIP_W &&
        bomb.x + BOMB_W > this.shipX &&
        bomb.y + BOMB_H > SHIP_Y &&
        bomb.y < SHIP_Y + SHIP_H
      ) {
        this.lives -= 1;
        if (this.lives <= 0) {
          this.gameOver = true;
        }
        continue;
      }
      survivingBombs.push(bomb);
    }
    this.bombs = survivingBombs;
  }
}
