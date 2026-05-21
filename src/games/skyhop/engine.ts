// VSArcade Skyhop — Pure game logic

import {
  BIRD_SIZE,
  BIRD_X,
  CANVAS_H,
  CANVAS_W,
  FLAP_VELOCITY,
  GRAVITY,
  GROUND_H,
  MAX_FALL_SPEED,
  PIPE_GAP,
  PIPE_MARGIN,
  PIPE_SPACING,
  PIPE_SPEED,
  PIPE_W,
} from "./constants";
import type { Pipe, SkyhopSnapshot } from "./types";

const FLOOR_Y = CANVAS_H - GROUND_H;
const MIN_GAP_Y = PIPE_MARGIN;
const MAX_GAP_Y = FLOOR_Y - PIPE_GAP - PIPE_MARGIN;

function randomGapY(): number {
  return MIN_GAP_Y + Math.random() * (MAX_GAP_Y - MIN_GAP_Y);
}

export class SkyhopEngine {
  birdY = 0;
  birdVel = 0;
  pipes: Pipe[] = [];
  score = 0;
  started = false;
  gameOver = false;

  reset(): void {
    this.birdY = (CANVAS_H - BIRD_SIZE) / 2;
    this.birdVel = 0;
    this.score = 0;
    this.started = false;
    this.gameOver = false;
    this.pipes = [
      { x: CANVAS_W + 20, gapY: randomGapY(), passed: false },
      { x: CANVAS_W + 20 + PIPE_SPACING, gapY: randomGapY(), passed: false },
    ];
  }

  flap(): void {
    if (this.gameOver) {
      return;
    }
    this.started = true;
    this.birdVel = FLAP_VELOCITY;
  }

  step(dt: number): void {
    if (!this.started || this.gameOver) {
      return;
    }

    this.birdVel = Math.min(this.birdVel + GRAVITY * dt, MAX_FALL_SPEED);
    this.birdY += this.birdVel * dt;

    if (this.birdY <= 0) {
      this.birdY = 0;
      this.birdVel = 0;
    }

    for (const pipe of this.pipes) {
      pipe.x -= PIPE_SPEED * dt;
      if (!pipe.passed && pipe.x + PIPE_W < BIRD_X) {
        pipe.passed = true;
        this.score += 1;
      }
    }

    this.pipes = this.pipes.filter((p) => p.x + PIPE_W > -2);
    const lastX = this.pipes.length > 0 ? this.pipes[this.pipes.length - 1].x : 0;
    if (lastX < CANVAS_W - PIPE_SPACING) {
      this.pipes.push({ x: lastX + PIPE_SPACING, gapY: randomGapY(), passed: false });
    }

    if (this.birdY + BIRD_SIZE >= FLOOR_Y) {
      this.birdY = FLOOR_Y - BIRD_SIZE;
      this.gameOver = true;
      return;
    }

    for (const pipe of this.pipes) {
      const overlapX = BIRD_X + BIRD_SIZE > pipe.x && BIRD_X < pipe.x + PIPE_W;
      if (!overlapX) {
        continue;
      }
      if (this.birdY < pipe.gapY || this.birdY + BIRD_SIZE > pipe.gapY + PIPE_GAP) {
        this.gameOver = true;
        return;
      }
    }
  }

  getSnapshot(): SkyhopSnapshot {
    return {
      birdY: this.birdY,
      birdVel: this.birdVel,
      pipes: this.pipes.map((p) => ({ ...p })),
      score: this.score,
      started: this.started,
      gameOver: this.gameOver,
    };
  }

  applySnapshot(s: SkyhopSnapshot): void {
    this.birdY = s.birdY;
    this.birdVel = s.birdVel;
    this.pipes = s.pipes.map((p) => ({ ...p }));
    this.score = s.score;
    this.started = s.started;
    this.gameOver = s.gameOver;
  }
}
