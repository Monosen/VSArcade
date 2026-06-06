// VSArcade Pong — Webview entry

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { PongEngine } from "./engine";
import { PongRenderer } from "./renderer";
import { planPlayerIntent } from "./ai";
import type { PongSnapshot } from "./types";

class PongGame implements Game {
  readonly id = GAME_IDS.PONG;

  private api: GameApi | null = null;
  private engine = new PongEngine();
  private renderer: PongRenderer | null = null;
  private paused = false;
  private autoPlay = false;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new PongRenderer(api.ctx);
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
      this.engine.playerIntent = planPlayerIntent(this.engine);
    } else {
      const down = this.api.isKeyDown("ArrowDown") ? 1 : 0;
      const up = this.api.isKeyDown("ArrowUp") ? 1 : 0;
      this.engine.playerIntent = down - up;
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
    this.engine.applySnapshot(snapshot as PongSnapshot);
    this.publishScore();
  }

  isGameOver(): boolean {
    return this.engine.gameOver;
  }

  isWon(): boolean {
    return false;
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
    this.api?.setScore(this.engine.playerScore);
  }

  private syncSnapshot(): void {
    this.api?.syncSnapshot();
  }
}

window.__vsarcade__?.register(() => new PongGame());
