// VSArcade Brickout — Webview entry

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { BrickoutEngine } from "./engine";
import { BrickoutRenderer } from "./renderer";
import { planPaddleIntent } from "./ai";
import type { BrickoutSnapshot } from "./types";

class BrickoutGame implements Game {
  readonly id = GAME_IDS.BRICKOUT;

  private api: GameApi | null = null;
  private engine = new BrickoutEngine();
  private renderer: BrickoutRenderer | null = null;
  private paused = false;
  private autoPlay = false;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new BrickoutRenderer(api.ctx);
    this.autoPlay = api.isAutoPlayEnabled();
    this.paused = api.isPaused();
    this.engine.reset();
    this.publishScore();
  }

  update(dt: number): void {
    if (this.paused || this.engine.gameOver || !this.api) {
      return;
    }
    if (this.autoPlay) {
      this.engine.playerIntent = planPaddleIntent(this.engine);
    } else {
      const right = this.api.isKeyDown("ArrowRight") ? 1 : 0;
      const left = this.api.isKeyDown("ArrowLeft") ? 1 : 0;
      this.engine.playerIntent = right - left;
    }
    this.engine.step(dt);
    this.publishScore();
    this.syncSnapshot();
  }

  render(): void {
    this.renderer?.render(this.engine);
  }

  handleKey(): void {
    // Continuous paddle input is read via GameApi.isKeyDown in update().
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setAutoPlay(enabled: boolean): void {
    this.autoPlay = enabled;
  }

  buildSnapshot(): Snapshot {
    return this.engine.getSnapshot();
  }

  applySnapshot(snapshot: Snapshot): void {
    if (!snapshot) {
      return;
    }
    this.engine.applySnapshot(snapshot as BrickoutSnapshot);
    this.publishScore();
  }

  isGameOver(): boolean {
    return this.engine.gameOver;
  }

  restart(): void {
    this.engine.reset();
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

window.__vsarcade__?.register(() => new BrickoutGame());
