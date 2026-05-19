// VSArcade Snake — Pure game logic

import { GRID_HEIGHT, GRID_WIDTH } from "./constants";
import { DIRECTION_DELTAS, isOpposite } from "./types";
import type { Direction, SnakeSnapshot, Vec } from "./types";

function inBounds(p: Vec): boolean {
  return p.x >= 0 && p.x < GRID_WIDTH && p.y >= 0 && p.y < GRID_HEIGHT;
}

export class SnakeEngine {
  body: Vec[] = [];
  direction: Direction = "right";
  food: Vec = { x: 0, y: 0 };
  score = 0;
  gameOver = false;
  private pendingDirection: Direction | null = null;

  reset(): void {
    const cx = Math.floor(GRID_WIDTH / 2);
    const cy = Math.floor(GRID_HEIGHT / 2);
    this.body = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    this.direction = "right";
    this.pendingDirection = null;
    this.score = 0;
    this.gameOver = false;
    this.placeFood();
  }

  setDirection(dir: Direction): void {
    if (this.gameOver) {
      return;
    }
    if (isOpposite(this.direction, dir)) {
      return;
    }
    this.pendingDirection = dir;
  }

  step(): void {
    if (this.gameOver) {
      return;
    }

    if (this.pendingDirection && !isOpposite(this.direction, this.pendingDirection)) {
      this.direction = this.pendingDirection;
    }
    this.pendingDirection = null;

    const delta = DIRECTION_DELTAS[this.direction];
    const head = this.body[0];
    const next: Vec = { x: head.x + delta.x, y: head.y + delta.y };

    if (!inBounds(next)) {
      this.gameOver = true;
      return;
    }

    const willEatFood = next.x === this.food.x && next.y === this.food.y;
    const checkLength = willEatFood ? this.body.length : this.body.length - 1;
    for (let i = 0; i < checkLength; i += 1) {
      if (this.body[i].x === next.x && this.body[i].y === next.y) {
        this.gameOver = true;
        return;
      }
    }

    this.body.unshift(next);
    if (willEatFood) {
      this.score += 1;
      this.placeFood();
    } else {
      this.body.pop();
    }
  }

  getSnapshot(): SnakeSnapshot {
    return {
      body: this.body.map((p) => ({ ...p })),
      direction: this.direction,
      food: { ...this.food },
      score: this.score,
      gameOver: this.gameOver,
    };
  }

  applySnapshot(s: SnakeSnapshot): void {
    this.body = s.body.map((p) => ({ ...p }));
    this.direction = s.direction;
    this.food = { ...s.food };
    this.score = s.score;
    this.gameOver = s.gameOver;
    this.pendingDirection = null;
  }

  private placeFood(): void {
    const occupied = new Set(this.body.map((p) => `${p.x},${p.y}`));
    const candidates: Vec[] = [];
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        if (!occupied.has(`${x},${y}`)) {
          candidates.push({ x, y });
        }
      }
    }
    if (candidates.length === 0) {
      this.gameOver = true;
      return;
    }
    this.food = candidates[Math.floor(Math.random() * candidates.length)];
  }
}
