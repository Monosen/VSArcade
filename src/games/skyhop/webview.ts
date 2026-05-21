// VSArcade Skyhop — Webview entry

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { SkyhopEngine } from "./engine";
import { SkyhopRenderer } from "./renderer";
import { shouldFlap } from "./ai";
import type { SkyhopSnapshot } from "./types";

class SkyhopGame implements Game {
  readonly id = GAME_IDS.SKYHOP;

  private api: GameApi | null = null;
  private engine = new SkyhopEngine();
  private renderer: SkyhopRenderer | null = null;
  private paused = false;
  private autoPlay = false;
  private flapKeyWasDown = false;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new SkyhopRenderer(api.ctx);
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
      if (shouldFlap(this.engine)) {
        this.engine.flap();
      }
    } else {
      const down = this.api.isKeyDown(" ") || this.api.isKeyDown("ArrowUp");
      if (down && !this.flapKeyWasDown) {
        this.engine.flap();
      }
      this.flapKeyWasDown = down;
    }

    this.engine.step(dt);
    this.publishScore();
    this.syncSnapshot();
  }

  render(): void {
    this.renderer?.render(this.engine);
  }

  handleKey(): void {
    // Flap is edge-detected via GameApi.isKeyDown in update().
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setAutoPlay(enabled: boolean): void {
    this.autoPlay = enabled;
    this.flapKeyWasDown = false;
  }

  buildSnapshot(): Snapshot {
    return this.engine.getSnapshot();
  }

  applySnapshot(snapshot: Snapshot): void {
    if (!snapshot) {
      return;
    }
    this.engine.applySnapshot(snapshot as SkyhopSnapshot);
    this.publishScore();
  }

  isGameOver(): boolean {
    return this.engine.gameOver;
  }

  restart(): void {
    this.engine.reset();
    this.flapKeyWasDown = false;
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

window.__vsarcade__?.register(() => new SkyhopGame());
