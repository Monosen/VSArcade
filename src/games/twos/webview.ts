// VSArcade 2048 — Webview entry: registers Twos with the runtime

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { TwosEngine } from "./engine";
import { TwosRenderer } from "./renderer";
import { planNextDirection } from "./ai";
import { AUTO_MOVE_INTERVAL_MS } from "./constants";
import type { Direction, TwosSnapshot } from "./types";

class TwosGame implements Game {
  readonly id = GAME_IDS.TWOS;

  private api: GameApi | null = null;
  private engine = new TwosEngine();
  private renderer: TwosRenderer | null = null;
  private autoMoveAccumulator = 0;
  private paused = false;
  private autoPlay = false;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new TwosRenderer(api.ctx, api.canvas);
    this.autoPlay = api.isAutoPlayEnabled();
    this.paused = api.isPaused();
    this.engine.reset();
    this.publishScore();
  }

  update(dt: number): void {
    if (!this.autoPlay || this.paused || this.engine.gameOver) {
      return;
    }
    this.autoMoveAccumulator += dt;
    if (this.autoMoveAccumulator < AUTO_MOVE_INTERVAL_MS) {
      return;
    }
    this.autoMoveAccumulator = 0;
    const dir = planNextDirection(this.engine.board);
    if (!dir) {
      return;
    }
    const moved = this.engine.move(dir);
    if (moved) {
      this.publishScore();
      this.syncSnapshot();
    }
  }

  render(): void {
    this.renderer?.render(this.engine);
  }

  handleKey(key: string): void {
    if (this.engine.gameOver || this.paused || this.autoPlay) {
      return;
    }
    const dir = keyToDirection(key);
    if (!dir) {
      return;
    }
    if (this.engine.move(dir)) {
      this.publishScore();
      this.syncSnapshot();
    }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setAutoPlay(enabled: boolean): void {
    this.autoPlay = enabled;
    this.autoMoveAccumulator = 0;
  }

  buildSnapshot(): Snapshot {
    return this.engine.getSnapshot();
  }

  applySnapshot(snapshot: Snapshot): void {
    if (!snapshot) {
      return;
    }
    this.engine.applySnapshot(snapshot as TwosSnapshot);
    this.publishScore();
  }

  isGameOver(): boolean {
    return this.engine.gameOver;
  }

  restart(): void {
    this.engine.reset();
    this.autoMoveAccumulator = 0;
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

function keyToDirection(key: string): Direction | null {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    default:
      return null;
  }
}

window.__vsarcade__?.register(() => new TwosGame());
