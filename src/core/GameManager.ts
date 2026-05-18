// ---------------------------------------------------------------
// VSArcade — Game Manager
// ---------------------------------------------------------------

import type { IGameEngine, GameOptions } from "../types/game";

export interface RuntimeSnapshot {
  board: (string | null)[][];
  currentPiece: { type: string; rotation: number; x: number; y: number } | null;
  nextPieceType: string | null;
  score: number;
  gameOver: boolean;
}

export type RuntimeSurface = "sidebar" | "fullscreen";

export class GameManager {
  private games: Map<string, IGameEngine> = new Map();
  private activeGameId: string | null = null;
  private autoPlay = false;
  private paused = false;
  private theme: "dark" | "light" = "dark";
  private runtimeSnapshot: RuntimeSnapshot | null = null;
  private activeSurface: RuntimeSurface = "sidebar";

  /** Register a game engine so it can be selected. */
  registerGame(engine: IGameEngine): void {
    this.games.set(engine.id, engine);
  }

  /** Get all registered game engines. */
  getRegisteredGames(): IGameEngine[] {
    return Array.from(this.games.values());
  }

  /** Select a game by its id. Returns the engine or undefined. */
  selectGame(id: string): IGameEngine | undefined {
    const engine = this.games.get(id);
    if (engine) {
      this.activeGameId = id;
      this.paused = false;
      this.runtimeSnapshot = null;
      this.activeSurface = "sidebar";
    }
    return engine;
  }

  /** Get the currently active game engine, if any. */
  getActiveGame(): IGameEngine | undefined {
    if (this.activeGameId === null) {
      return undefined;
    }
    return this.games.get(this.activeGameId);
  }

  /** Get the id of the currently active game. */
  getActiveGameId(): string | null {
    return this.activeGameId;
  }

  /** Toggle auto-play on the active game. Returns new state. */
  toggleAutoPlay(): boolean {
    this.autoPlay = !this.autoPlay;
    const engine = this.getActiveGame();
    if (engine) {
      engine.setAutoPlay(this.autoPlay);
    }
    return this.autoPlay;
  }

  /** Toggle pause on the active game. Returns new state. */
  togglePause(): boolean {
    this.paused = !this.paused;
    const engine = this.getActiveGame();
    if (engine) {
      engine.setPaused(this.paused);
    }
    return this.paused;
  }

  /** Set the visual theme. */
  setTheme(theme: "dark" | "light"): void {
    this.theme = theme;
  }

  /** Whether the active game is paused. */
  isPaused(): boolean {
    return this.paused;
  }

  /** Whether auto-play is enabled. */
  isAutoPlayEnabled(): boolean {
    return this.autoPlay;
  }

  getRuntimeSnapshot(): RuntimeSnapshot | null {
    return this.runtimeSnapshot;
  }

  setRuntimeSnapshot(snapshot: RuntimeSnapshot | null): void {
    this.runtimeSnapshot = snapshot;
  }

  getActiveSurface(): RuntimeSurface {
    return this.activeSurface;
  }

  setActiveSurface(surface: RuntimeSurface): void {
    this.activeSurface = surface;
  }

  /** Get current theme. */
  getTheme(): "dark" | "light" {
    return this.theme;
  }

  /** Create GameOptions based on current manager state. */
  createOptions(): GameOptions {
    return {
      autoPlay: this.autoPlay,
      theme: this.theme,
    };
  }

  /** Dispose all game engines. */
  dispose(): void {
    for (const engine of this.games.values()) {
      engine.dispose();
    }
    this.games.clear();
    this.activeGameId = null;
    this.runtimeSnapshot = null;
  }
}
