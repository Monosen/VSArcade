// VSArcade Pong — Pure game logic

import {
  BALL_SIZE,
  BALL_SPEED,
  CANVAS_H,
  CANVAS_W,
  OPPONENT_SPEED,
  OPPONENT_X,
  PADDLE_H,
  PADDLE_SPEED,
  PLAYER_X,
  PADDLE_W,
  WIN_SCORE,
} from "./constants";
import type { PongSnapshot } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export class PongEngine {
  ballX = 0;
  ballY = 0;
  ballVX = 0;
  ballVY = 0;
  playerY = 0;
  opponentY = 0;
  playerScore = 0;
  opponentScore = 0;
  gameOver = false;

  /** Player paddle intent: -1 up, 0 idle, 1 down. */
  playerIntent = 0;

  reset(): void {
    this.playerScore = 0;
    this.opponentScore = 0;
    this.gameOver = false;
    this.playerIntent = 0;
    this.playerY = (CANVAS_H - PADDLE_H) / 2;
    this.opponentY = (CANVAS_H - PADDLE_H) / 2;
    this.launchBall(Math.random() < 0.5 ? -1 : 1);
  }

  step(dt: number): void {
    if (this.gameOver) {
      return;
    }

    this.playerY = clamp(
      this.playerY + this.playerIntent * PADDLE_SPEED * dt,
      0,
      CANVAS_H - PADDLE_H,
    );

    const oppCenter = this.opponentY + PADDLE_H / 2;
    const ballCenter = this.ballY + BALL_SIZE / 2;
    const oppStep = OPPONENT_SPEED * dt;
    if (Math.abs(ballCenter - oppCenter) > oppStep) {
      this.opponentY = clamp(
        this.opponentY + Math.sign(ballCenter - oppCenter) * oppStep,
        0,
        CANVAS_H - PADDLE_H,
      );
    }

    this.ballX += this.ballVX * dt;
    this.ballY += this.ballVY * dt;

    if (this.ballY <= 0) {
      this.ballY = 0;
      this.ballVY = Math.abs(this.ballVY);
    }
    if (this.ballY + BALL_SIZE >= CANVAS_H) {
      this.ballY = CANVAS_H - BALL_SIZE;
      this.ballVY = -Math.abs(this.ballVY);
    }

    if (
      this.ballVX < 0 &&
      this.ballX <= PLAYER_X + PADDLE_W &&
      this.ballX >= PLAYER_X - BALL_SIZE &&
      this.ballY + BALL_SIZE >= this.playerY &&
      this.ballY <= this.playerY + PADDLE_H
    ) {
      this.ballX = PLAYER_X + PADDLE_W;
      this.bounceOffPaddle(this.playerY);
    }

    if (
      this.ballVX > 0 &&
      this.ballX + BALL_SIZE >= OPPONENT_X &&
      this.ballX <= OPPONENT_X + PADDLE_W &&
      this.ballY + BALL_SIZE >= this.opponentY &&
      this.ballY <= this.opponentY + PADDLE_H
    ) {
      this.ballX = OPPONENT_X - BALL_SIZE;
      this.bounceOffPaddle(this.opponentY);
    }

    if (this.ballX + BALL_SIZE < 0) {
      this.opponentScore += 1;
      this.afterScore(1);
    } else if (this.ballX > CANVAS_W) {
      this.playerScore += 1;
      this.afterScore(-1);
    }
  }

  getSnapshot(): PongSnapshot {
    return {
      ballX: this.ballX,
      ballY: this.ballY,
      ballVX: this.ballVX,
      ballVY: this.ballVY,
      playerY: this.playerY,
      opponentY: this.opponentY,
      playerScore: this.playerScore,
      opponentScore: this.opponentScore,
      gameOver: this.gameOver,
    };
  }

  applySnapshot(s: PongSnapshot): void {
    this.ballX = s.ballX;
    this.ballY = s.ballY;
    this.ballVX = s.ballVX;
    this.ballVY = s.ballVY;
    this.playerY = s.playerY;
    this.opponentY = s.opponentY;
    this.playerScore = s.playerScore;
    this.opponentScore = s.opponentScore;
    this.gameOver = s.gameOver;
  }

  private launchBall(direction: number): void {
    this.ballX = (CANVAS_W - BALL_SIZE) / 2;
    this.ballY = (CANVAS_H - BALL_SIZE) / 2;
    this.ballVX = direction * BALL_SPEED;
    this.ballVY = (Math.random() * 2 - 1) * BALL_SPEED * 0.5;
  }

  private bounceOffPaddle(paddleY: number): void {
    const ballCenter = this.ballY + BALL_SIZE / 2;
    const paddleCenter = paddleY + PADDLE_H / 2;
    const offset = (ballCenter - paddleCenter) / (PADDLE_H / 2);
    this.ballVY = clamp(offset, -1, 1) * BALL_SPEED * 0.8;
    const horizontal = Math.max(
      BALL_SPEED * 0.6,
      BALL_SPEED - Math.abs(this.ballVY) * 0.4,
    );
    this.ballVX = this.ballVX < 0 ? horizontal : -horizontal;
  }

  private afterScore(direction: number): void {
    if (this.playerScore >= WIN_SCORE || this.opponentScore >= WIN_SCORE) {
      this.gameOver = true;
      return;
    }
    this.launchBall(direction);
  }
}
