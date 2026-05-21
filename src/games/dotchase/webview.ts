// VSArcade DotChase — Webview entry

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { DotChaseEngine } from "./engine";
import { DotChaseRenderer } from "./renderer";
import { planDesiredDir } from "./ai";
import type { DotChaseSnapshot } from "./types";

class DotChaseGame implements Game {
  readonly id = GAME_IDS.DOTCHASE;

  private api: GameApi | null = null;
  private engine = new DotChaseEngine();
  private renderer: DotChaseRenderer | null = null;
  private paused = false;
  private autoPlay = false;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new DotChaseRenderer(api.ctx);
    this.autoPlay = api.isAutoPlayEnabled();
    this.paused = api.isPaused();
    this.engine.reset();
    this.publishScore();
  }

  update(dt: number): void {
    if (this.paused || this.engine.gameOver) {
      return;
    }
    if (this.autoPlay) {
      const dir = planDesiredDir(this.engine);
      if (dir) {
        this.engine.setDesiredDir(dir);
      }
    }
    this.engine.update(dt);
    this.publishScore();
    this.syncSnapshot();
  }

  render(): void {
    this.renderer?.render(this.engine);
  }

  handleKey(key: string): void {
    if (this.autoPlay || this.paused || this.engine.gameOver) {
      return;
    }
    switch (key) {
      case "ArrowUp":
        this.engine.setDesiredDir("up");
        break;
      case "ArrowDown":
        this.engine.setDesiredDir("down");
        break;
      case "ArrowLeft":
        this.engine.setDesiredDir("left");
        break;
      case "ArrowRight":
        this.engine.setDesiredDir("right");
        break;
    }
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
    this.engine.applySnapshot(snapshot as DotChaseSnapshot);
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

window.__vsarcade__?.register(() => new DotChaseGame());
