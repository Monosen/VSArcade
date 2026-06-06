// VSArcade — Host coordinator (does not execute game logic)

import type { IGameDescriptor } from "../types/game";

export type RuntimeSnapshot = unknown;
export type RuntimeSurface = "sidebar" | "fullscreen";

export class GameManager {
  private games: Map<string, IGameDescriptor> = new Map();
  private activeGameId: string | null = null;
  private autoPlay = false;
  private paused = false;
  private theme: "dark" | "light" = "dark";
  private runtimeSnapshot: RuntimeSnapshot | null = null;
  private activeSurface: RuntimeSurface = "sidebar";

  registerGame(descriptor: IGameDescriptor): void {
    this.games.set(descriptor.id, descriptor);
  }

  getRegisteredGames(): IGameDescriptor[] {
    return Array.from(this.games.values());
  }

  selectGame(id: string): IGameDescriptor | undefined {
    const descriptor = this.games.get(id);
    if (descriptor) {
      this.activeGameId = id;
      this.paused = false;
      this.runtimeSnapshot = null;
    }
    return descriptor;
  }

  getActiveGame(): IGameDescriptor | undefined {
    if (this.activeGameId === null) {
      return undefined;
    }
    return this.games.get(this.activeGameId);
  }

  getActiveGameId(): string | null {
    return this.activeGameId;
  }

  toggleAutoPlay(): boolean {
    this.autoPlay = !this.autoPlay;
    return this.autoPlay;
  }

  togglePause(): boolean {
    this.paused = !this.paused;
    return this.paused;
  }

  setTheme(theme: "dark" | "light"): void {
    this.theme = theme;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isAutoPlayEnabled(): boolean {
    return this.autoPlay;
  }

  getTheme(): "dark" | "light" {
    return this.theme;
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

  dispose(): void {
    this.games.clear();
    this.activeGameId = null;
    this.runtimeSnapshot = null;
  }
}
