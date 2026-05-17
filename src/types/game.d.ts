// ---------------------------------------------------------------
// VSArcade — Game Engine interface and related types
// ---------------------------------------------------------------

export interface IGameEngine {
  readonly id: string;
  readonly name: string;
  readonly version: string;

  init(canvas: HTMLCanvasElement, options: GameOptions): void;
  dispose(): void;
  update(deltaTime: number): void;
  render(): void;
  handleInput(key: string, isPressed: boolean): void;
  setAutoPlay(enabled: boolean): void;
  setPaused(paused: boolean): void;
  getState(): GameStateSnapshot;
  loadState(state: GameStateSnapshot): void;
}

export interface GameOptions {
  autoPlay: boolean;
  theme: "dark" | "light";
}

export interface GameStateSnapshot {
  score: number;
}