// VSArcade Tetris — Webview entry: registers the Tetris game with the runtime

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { TetrisEngine } from "./engine";
import { TetrisRenderer } from "./renderer";
import { computeAutoPlan, type AutoPlan } from "./ai";
import {
  AUTO_DROP_INTERVAL_MS,
  AUTO_MOVE_INTERVAL_MS,
  DROP_INTERVAL_MS,
} from "./constants";
import type { TetrisSnapshot } from "./types";

class TetrisGame implements Game {
  readonly id = GAME_IDS.TETRIS;

  private api: GameApi | null = null;
  private engine = new TetrisEngine();
  private renderer: TetrisRenderer | null = null;
  private plan: AutoPlan | null = null;
  private dropAccumulator = 0;
  private autoMoveAccumulator = 0;
  private paused = false;
  private autoPlay = false;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new TetrisRenderer(api.ctx, api.canvas);
    this.autoPlay = api.isAutoPlayEnabled();
    this.paused = api.isPaused();
    this.engine.reset();
    this.refreshPlan();
    this.publishScore();
  }

  update(dt: number): void {
    if (this.paused || this.engine.gameOver) {
      return;
    }

    if (this.autoPlay) {
      this.tickAutoPlay(dt);
    }

    this.dropAccumulator += dt;
    const interval = this.autoPlay ? AUTO_DROP_INTERVAL_MS : DROP_INTERVAL_MS;
    if (this.dropAccumulator >= interval) {
      this.dropAccumulator = 0;
      const beforeScore = this.engine.score;
      this.engine.movePiece(0, 1);
      this.refreshPlan();
      if (this.engine.score !== beforeScore) {
        this.publishScore();
      }
      this.syncSnapshot();
    }
  }

  render(): void {
    if (!this.renderer) {
      return;
    }
    this.renderer.render(this.engine, this.autoPlay);
  }

  handleKey(key: string): void {
    if (this.engine.gameOver || this.paused) {
      return;
    }
    if (this.autoPlay) {
      return;
    }

    const beforeScore = this.engine.score;
    let changed = false;
    switch (key) {
      case "ArrowLeft":
        changed = this.engine.movePiece(-1, 0);
        break;
      case "ArrowRight":
        changed = this.engine.movePiece(1, 0);
        break;
      case "ArrowDown":
        changed = this.engine.movePiece(0, 1);
        break;
      case "ArrowUp":
        changed = this.engine.rotatePiece();
        break;
      case " ":
        this.engine.hardDrop();
        changed = true;
        break;
    }

    if (changed) {
      this.refreshPlan();
      if (this.engine.score !== beforeScore) {
        this.publishScore();
      }
      this.syncSnapshot();
    }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setAutoPlay(enabled: boolean): void {
    this.autoPlay = enabled;
    this.autoMoveAccumulator = 0;
    this.refreshPlan();
  }

  buildSnapshot(): Snapshot {
    return this.engine.getSnapshot();
  }

  applySnapshot(snapshot: Snapshot): void {
    if (!snapshot) {
      return;
    }
    this.engine.applySnapshot(snapshot as TetrisSnapshot);
    this.refreshPlan();
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
    this.dropAccumulator = 0;
    this.autoMoveAccumulator = 0;
    this.refreshPlan();
    this.publishScore();
  }

  dispose(): void {
    this.renderer = null;
    this.api = null;
  }

  private tickAutoPlay(dt: number): void {
    if (!this.engine.currentPiece || !this.plan) {
      return;
    }
    this.autoMoveAccumulator += dt;
    if (this.autoMoveAccumulator < AUTO_MOVE_INTERVAL_MS) {
      return;
    }
    this.autoMoveAccumulator = 0;

    const piece = this.engine.currentPiece;
    const plan = this.plan;

    if (piece.rotation !== plan.targetRotation) {
      this.engine.rotatePiece();
      this.syncSnapshot();
      return;
    }
    if (piece.x < plan.targetX) {
      if (this.engine.movePiece(1, 0)) {
        this.syncSnapshot();
      }
      return;
    }
    if (piece.x > plan.targetX) {
      if (this.engine.movePiece(-1, 0)) {
        this.syncSnapshot();
      }
      return;
    }

    const beforeScore = this.engine.score;
    this.engine.hardDrop();
    this.refreshPlan();
    if (this.engine.score !== beforeScore) {
      this.publishScore();
    }
    this.syncSnapshot();
  }

  private refreshPlan(): void {
    this.plan = this.autoPlay && this.engine.currentPiece
      ? computeAutoPlan(this.engine.board, this.engine.currentPiece)
      : null;
  }

  private publishScore(): void {
    this.api?.setScore(this.engine.score);
  }

  private syncSnapshot(): void {
    this.api?.syncSnapshot();
  }
}

window.__vsarcade__?.register(() => new TetrisGame());
