// VSArcade Duel — Webview entry

import { GAME_IDS } from "../../constants";
import type { Game, GameApi, Snapshot } from "../../webview/types";
import { MAX_HEALTH } from "./constants";
import { DuelEngine } from "./engine";
import { DuelRenderer } from "./renderer";
import { decideFighterIntent } from "./ai";
import type { AttackKind, DuelSnapshot, FighterIntent } from "./types";

class DuelGame implements Game {
  readonly id = GAME_IDS.DUEL;

  private api: GameApi | null = null;
  private engine = new DuelEngine();
  private renderer: DuelRenderer | null = null;
  private paused = false;
  private autoPlay = false;
  private pendingAttack: AttackKind | null = null;

  init(api: GameApi): void {
    this.api = api;
    this.renderer = new DuelRenderer(api.ctx);
    this.autoPlay = api.isAutoPlayEnabled();
    this.paused = api.isPaused();
    this.engine.reset();
    this.publishScore();
  }

  update(dt: number): void {
    if (this.paused || this.engine.gameOver || !this.api) {
      return;
    }

    let intent: FighterIntent;
    if (this.autoPlay) {
      intent = decideFighterIntent(this.engine.player, this.engine.opponent);
    } else {
      const right = this.api.isKeyDown("ArrowRight") ? 1 : 0;
      const left = this.api.isKeyDown("ArrowLeft") ? 1 : 0;
      intent = {
        walk: right - left,
        block: this.api.isKeyDown("ArrowUp"),
        attack: this.pendingAttack,
      };
    }
    this.pendingAttack = null;

    this.engine.update(dt, intent);
    this.publishScore();
    this.syncSnapshot();
  }

  render(): void {
    this.renderer?.render(this.engine);
  }

  handleKey(key: string): void {
    if (this.autoPlay) {
      return;
    }
    if (key === " ") {
      this.pendingAttack = "high";
    } else if (key === "ArrowDown") {
      this.pendingAttack = "low";
    }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setAutoPlay(enabled: boolean): void {
    this.autoPlay = enabled;
    this.pendingAttack = null;
  }

  buildSnapshot(): Snapshot {
    return this.engine.getSnapshot();
  }

  applySnapshot(snapshot: Snapshot): void {
    if (!snapshot) {
      return;
    }
    this.engine.applySnapshot(snapshot as DuelSnapshot);
    this.publishScore();
  }

  isGameOver(): boolean {
    return this.engine.gameOver;
  }

  restart(): void {
    this.engine.reset();
    this.pendingAttack = null;
    this.publishScore();
  }

  dispose(): void {
    this.renderer = null;
    this.api = null;
  }

  private publishScore(): void {
    this.api?.setScore(MAX_HEALTH - this.engine.opponent.health);
  }

  private syncSnapshot(): void {
    this.api?.syncSnapshot();
  }
}

window.__vsarcade__?.register(() => new DuelGame());
