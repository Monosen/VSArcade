// VSArcade Invaders — Webview entry

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { InvadersEngine } from "./engine";
import { InvadersRenderer } from "./renderer";
import { planShipIntent } from "./ai";
import type { InvadersSnapshot } from "./types";

class InvadersGame implements Game {
  readonly id = GAME_IDS.INVADERS;

  private api: GameApi | null = null;
  private engine = new InvadersEngine();
  private renderer: InvadersRenderer | null = null;
  private paused = false;
  private autoPlay = false;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new InvadersRenderer(api.ctx);
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
      this.engine.playerIntent = planShipIntent(this.engine);
      this.engine.fire();
    } else {
      const right = this.api.isKeyDown("ArrowRight") ? 1 : 0;
      const left = this.api.isKeyDown("ArrowLeft") ? 1 : 0;
      this.engine.playerIntent = right - left;
      if (this.api.isKeyDown(" ")) {
        this.engine.fire();
      }
    }
    this.engine.update(dt);
    this.publishScore();
    this.syncSnapshot();
  }

  render(): void {
    this.renderer?.render(this.engine);
  }

  handleKey(): void {
    // Movement and fire are read via GameApi.isKeyDown in update().
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
    this.engine.applySnapshot(snapshot as InvadersSnapshot);
    this.publishScore();
  }

  isGameOver(): boolean {
    return this.engine.gameOver;
  }

  isWon(): boolean {
    return this.engine.won;
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

window.__vsarcade__?.register(() => new InvadersGame());
