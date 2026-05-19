// VSArcade Snake — Webview entry: registers the Snake game with the runtime

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { SnakeEngine } from "./engine";
import { SnakeRenderer } from "./renderer";
import { planNextDirection } from "./ai";
import { AUTO_STEP_INTERVAL_MS, STEP_INTERVAL_MS } from "./constants";
import type { SnakeSnapshot } from "./types";

class SnakeGame implements Game {
  readonly id = GAME_IDS.SNAKE;

  private api: GameApi | null = null;
  private engine = new SnakeEngine();
  private renderer: SnakeRenderer | null = null;
  private stepAccumulator = 0;
  private paused = false;
  private autoPlay = false;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new SnakeRenderer(api.ctx, api.canvas);
    this.autoPlay = api.isAutoPlayEnabled();
    this.paused = api.isPaused();
    this.engine.reset();
    this.publishScore();
  }

  update(dt: number): void {
    if (this.paused || this.engine.gameOver) {
      return;
    }
    this.stepAccumulator += dt;
    const interval = this.autoPlay ? AUTO_STEP_INTERVAL_MS : STEP_INTERVAL_MS;
    if (this.stepAccumulator < interval) {
      return;
    }
    this.stepAccumulator = 0;

    if (this.autoPlay) {
      const dir = planNextDirection(this.engine);
      if (dir) {
        this.engine.setDirection(dir);
      }
    }

    const beforeScore = this.engine.score;
    this.engine.step();
    if (this.engine.score !== beforeScore) {
      this.publishScore();
    }
    this.syncSnapshot();
  }

  render(): void {
    this.renderer?.render(this.engine);
  }

  handleKey(key: string): void {
    if (this.engine.gameOver || this.paused || this.autoPlay) {
      return;
    }
    switch (key) {
      case "ArrowUp":
        this.engine.setDirection("up");
        break;
      case "ArrowDown":
        this.engine.setDirection("down");
        break;
      case "ArrowLeft":
        this.engine.setDirection("left");
        break;
      case "ArrowRight":
        this.engine.setDirection("right");
        break;
    }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setAutoPlay(enabled: boolean): void {
    this.autoPlay = enabled;
    this.stepAccumulator = 0;
  }

  buildSnapshot(): Snapshot {
    return this.engine.getSnapshot();
  }

  applySnapshot(snapshot: Snapshot): void {
    if (!snapshot) {
      return;
    }
    this.engine.applySnapshot(snapshot as SnakeSnapshot);
    this.publishScore();
  }

  isGameOver(): boolean {
    return this.engine.gameOver;
  }

  restart(): void {
    this.engine.reset();
    this.stepAccumulator = 0;
    this.publishScore();
  }

  dispose(): void {
    this.renderer = null;
    this.api = null;
  }

  private publishScore(): void {
    this.api?.setScore(this.engine.score);
  }

  private syncSnapshot(): void {
    this.api?.syncSnapshot();
  }
}

window.__vsarcade__?.register(() => new SnakeGame());
