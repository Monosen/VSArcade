// VSArcade MineHunt — Webview entry: registers MineHunt with the runtime

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { MineHuntEngine } from "./engine";
import { MineHuntRenderer } from "./renderer";
import { planNextAction } from "./ai";
import { AUTO_MOVE_INTERVAL_MS } from "./constants";
import type { MineHuntSnapshot } from "./types";

class MineHuntGame implements Game {
  readonly id = GAME_IDS.MINEHUNT;

  private api: GameApi | null = null;
  private engine = new MineHuntEngine();
  private renderer: MineHuntRenderer | null = null;
  private autoMoveAccumulator = 0;
  private paused = false;
  private autoPlay = false;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new MineHuntRenderer(api.ctx, api.canvas);
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

    const action = planNextAction(this.engine);
    if (!action) {
      return;
    }
    this.engine.cursor = { x: action.x, y: action.y };
    if (action.kind === "reveal") {
      this.engine.reveal();
    } else {
      this.engine.toggleFlag();
    }
    this.publishScore();
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
        this.engine.moveCursor(0, -1);
        break;
      case "ArrowDown":
        this.engine.moveCursor(0, 1);
        break;
      case "ArrowLeft":
        this.engine.moveCursor(-1, 0);
        break;
      case "ArrowRight":
        this.engine.moveCursor(1, 0);
        break;
      case " ":
        this.engine.reveal();
        this.publishScore();
        this.syncSnapshot();
        return;
      case "f":
      case "F":
        this.engine.toggleFlag();
        this.syncSnapshot();
        return;
      default:
        return;
    }
    this.syncSnapshot();
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
    this.engine.applySnapshot(snapshot as MineHuntSnapshot);
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

window.__vsarcade__?.register(() => new MineHuntGame());
