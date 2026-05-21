// VSArcade Brickout — Pure game logic

import {
  BALL_SIZE,
  BALL_SPEED,
  BRICK_COLS,
  BRICK_ROWS,
  BRICK_SCORE,
  BRICK_SLOT_H,
  BRICK_SLOT_W,
  BRICK_TOP,
  CANVAS_H,
  CANVAS_W,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_W,
  PADDLE_Y,
  START_LIVES,
} from "./constants";
import type { BrickoutSnapshot } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const BRICK_DRAW_W = BRICK_SLOT_W - 1;
const BRICK_DRAW_H = BRICK_SLOT_H - 1;

export function brickRect(row: number, col: number): { x: number; y: number; w: number; h: number } {
  return {
    x: col * BRICK_SLOT_W,
    y: BRICK_TOP + row * BRICK_SLOT_H,
    w: BRICK_DRAW_W,
    h: BRICK_DRAW_H,
  };
}

export class BrickoutEngine {
  ballX = 0;
  ballY = 0;
  ballVX = 0;
  ballVY = 0;
  paddleX = 0;
  bricks: boolean[][] = [];
  score = 0;
  lives = START_LIVES;
  gameOver = false;
  won = false;

  /** Paddle intent: -1 left, 0 idle, 1 right. */
  playerIntent = 0;

  reset(): void {
    this.bricks = Array.from({ length: BRICK_ROWS }, () =>
      Array.from({ length: BRICK_COLS }, () => true),
    );
    this.score = 0;
    this.lives = START_LIVES;
    this.gameOver = false;
    this.won = false;
    this.playerIntent = 0;
    this.paddleX = (CANVAS_W - PADDLE_W) / 2;
    this.launchBall();
  }

  step(dt: number): void {
    if (this.gameOver) {
      return;
    }

    this.paddleX = clamp(
      this.paddleX + this.playerIntent * PADDLE_SPEED * dt,
      0,
      CANVAS_W - PADDLE_W,
    );

    this.ballX += this.ballVX * dt;
    this.ballY += this.ballVY * dt;

    if (this.ballX <= 0) {
      this.ballX = 0;
      this.ballVX = Math.abs(this.ballVX);
    }
    if (this.ballX + BALL_SIZE >= CANVAS_W) {
      this.ballX = CANVAS_W - BALL_SIZE;
      this.ballVX = -Math.abs(this.ballVX);
    }
    if (this.ballY <= 0) {
      this.ballY = 0;
      this.ballVY = Math.abs(this.ballVY);
    }

    this.checkPaddle();
    this.checkBricks();

    if (this.ballY > CANVAS_H) {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.gameOver = true;
      } else {
        this.launchBall();
      }
    }
  }

  getSnapshot(): BrickoutSnapshot {
    return {
      ballX: this.ballX,
      ballY: this.ballY,
      ballVX: this.ballVX,
      ballVY: this.ballVY,
      paddleX: this.paddleX,
      bricks: this.bricks.map((row) => row.slice()),
      score: this.score,
      lives: this.lives,
      gameOver: this.gameOver,
      won: this.won,
    };
  }

  applySnapshot(s: BrickoutSnapshot): void {
    this.ballX = s.ballX;
    this.ballY = s.ballY;
    this.ballVX = s.ballVX;
    this.ballVY = s.ballVY;
    this.paddleX = s.paddleX;
    this.bricks = s.bricks.map((row) => row.slice());
    this.score = s.score;
    this.lives = s.lives;
    this.gameOver = s.gameOver;
    this.won = s.won;
  }

  private launchBall(): void {
    this.ballX = (CANVAS_W - BALL_SIZE) / 2;
    this.ballY = PADDLE_Y - 16;
    this.ballVX = (Math.random() < 0.5 ? -1 : 1) * BALL_SPEED * 0.6;
    this.ballVY = -BALL_SPEED;
  }

  private checkPaddle(): void {
    if (
      this.ballVY > 0 &&
      this.ballY + BALL_SIZE >= PADDLE_Y &&
      this.ballY <= PADDLE_Y + PADDLE_H &&
      this.ballX + BALL_SIZE >= this.paddleX &&
      this.ballX <= this.paddleX + PADDLE_W
    ) {
      this.ballY = PADDLE_Y - BALL_SIZE;
      const hit = (this.ballX + BALL_SIZE / 2 - (this.paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
      this.ballVX = clamp(hit, -1, 1) * BALL_SPEED * 0.9;
      this.ballVY = -Math.max(
        BALL_SPEED * 0.6,
        BALL_SPEED - Math.abs(this.ballVX) * 0.4,
      );
    }
  }

  private checkBricks(): void {
    for (let row = 0; row < BRICK_ROWS; row += 1) {
      for (let col = 0; col < BRICK_COLS; col += 1) {
        if (!this.bricks[row][col]) {
          continue;
        }
        const rect = brickRect(row, col);
        if (
          this.ballX < rect.x + rect.w &&
          this.ballX + BALL_SIZE > rect.x &&
          this.ballY < rect.y + rect.h &&
          this.ballY + BALL_SIZE > rect.y
        ) {
          this.bricks[row][col] = false;
          this.score += BRICK_SCORE;
          const ballCenterX = this.ballX + BALL_SIZE / 2;
          if (ballCenterX > rect.x && ballCenterX < rect.x + rect.w) {
            this.ballVY = -this.ballVY;
          } else {
            this.ballVX = -this.ballVX;
          }
          if (this.bricks.every((r) => r.every((alive) => !alive))) {
            this.won = true;
            this.gameOver = true;
          }
          return;
        }
      }
    }
  }
}
