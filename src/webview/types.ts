// VSArcade — Webview runtime contracts

export type Snapshot = unknown;

export interface GameApi {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  isController(): boolean;
  isPaused(): boolean;
  isAutoPlayEnabled(): boolean;
  isKeyDown(key: string): boolean;
  setScore(score: number): void;
  syncSnapshot(): void;
}

export interface Game {
  readonly id: string;
  init(api: GameApi): void;
  update(deltaTimeMs: number): void;
  render(): void;
  handleKey(key: string): void;
  setPaused(paused: boolean): void;
  setAutoPlay(enabled: boolean): void;
  buildSnapshot(): Snapshot;
  applySnapshot(snapshot: Snapshot): void;
  isGameOver(): boolean;
  restart(): void;
  dispose(): void;
}

export type GameFactory = () => Game;

export interface VSArcadeWebviewGlobal {
  register(factory: GameFactory): void;
}

declare global {
  interface Window {
    __vsarcade__?: VSArcadeWebviewGlobal;
  }
}
