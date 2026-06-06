// VSArcade — Webview runtime: shell, loop, message bus

import type { Game, GameApi, GameFactory, Snapshot } from "./types";
import { drawCenteredLines, wrapPixelText } from "./text";

interface InitialState {
  gameName: string | null;
  paused: boolean;
  autoPlay: boolean;
  controlled: boolean;
  snapshot: Snapshot | null;
}

interface VsCodeApi {
  postMessage(msg: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const FRAME_DELTA_CAP_MS = 50;
const TEXT_COLOR_PRIMARY = "#f5f5f5";
const TEXT_COLOR_SECONDARY = "#d8d2ea";
const OVERLAY_BG = "rgba(10, 10, 18, 0.82)";
const OVERLAY_WIN_BG = "rgba(4, 18, 4, 0.88)";
const TEXT_COLOR_WIN_PRIMARY = "#ffd700";
const TEXT_COLOR_WIN_SECONDARY = "#7eff7e";
const CANVAS_BG = "#17122b";

let pendingFactory: GameFactory | null = null;

window.__vsarcade__ = {
  register(factory: GameFactory): void {
    pendingFactory = factory;
  },
};

function readInitialState(): InitialState {
  const meta = document.getElementById("vsarcade-state");
  if (!meta) {
    return {
      gameName: null,
      paused: false,
      autoPlay: false,
      controlled: false,
      snapshot: null,
    };
  }
  return JSON.parse(meta.getAttribute("content") ?? "{}") as InitialState;
}

class Runtime {
  private readonly vscodeApi = acquireVsCodeApi();
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly titleEl: HTMLElement;
  private readonly scoreEl: HTMLElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly autoPlayButton: HTMLButtonElement;
  private readonly fullscreenButton: HTMLButtonElement;

  private readonly initialState: InitialState;
  private game: Game | null = null;
  private hasSelectedGame: boolean;
  private isController: boolean;
  private isPaused: boolean;
  private autoPlayEnabled: boolean;
  private rafId = 0;
  private lastFrameTime = 0;
  private readonly heldKeys = new Set<string>();

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("VSArcade: canvas 2D context unavailable");
    }
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this.titleEl = document.getElementById("gameTitle") as HTMLElement;
    this.scoreEl = document.getElementById("gameScore") as HTMLElement;
    this.pauseButton = document.getElementById("btnPause") as HTMLButtonElement;
    this.autoPlayButton = document.getElementById("btnAutoPlay") as HTMLButtonElement;
    this.fullscreenButton = document.getElementById("btnFullscreen") as HTMLButtonElement;

    this.initialState = readInitialState();
    this.hasSelectedGame = Boolean(this.initialState.gameName);
    this.isController = this.initialState.controlled;
    this.isPaused = this.initialState.paused;
    this.autoPlayEnabled = this.initialState.autoPlay;
  }

  start(): void {
    this.attachUiHandlers();
    this.attachKeyboard();
    this.attachMessageBus();
    this.setPauseUi(this.isPaused);
    this.setAutoPlayUi(this.autoPlayEnabled);
    this.setControllerUi();

    if (pendingFactory) {
      this.instantiateGame(pendingFactory);
    }

    if (this.initialState.gameName) {
      this.titleEl.textContent = this.initialState.gameName;
    }
    if (this.game && this.initialState.snapshot) {
      this.game.applySnapshot(this.initialState.snapshot);
    }

    this.render();
    this.rafId = window.requestAnimationFrame((t) => this.tick(t));
    window.addEventListener("beforeunload", () => window.cancelAnimationFrame(this.rafId));

    this.vscodeApi.postMessage({ type: "webviewReady" });
  }

  private instantiateGame(factory: GameFactory): void {
    const game = factory();
    const api = this.buildApi();
    game.init(api);
    this.game = game;
  }

  private buildApi(): GameApi {
    return {
      canvas: this.canvas,
      ctx: this.ctx,
      isController: () => this.isController,
      isPaused: () => this.isPaused,
      isAutoPlayEnabled: () => this.autoPlayEnabled,
      isKeyDown: (key: string) => this.heldKeys.has(key),
      setScore: (score: number) => {
        this.scoreEl.textContent = `Score: ${score}`;
      },
      syncSnapshot: () => this.syncSnapshot(),
    };
  }

  private attachUiHandlers(): void {
    this.pauseButton.addEventListener("click", () => {
      if (!this.hasSelectedGame || !this.isController) {
        return;
      }
      this.vscodeApi.postMessage({ type: "togglePause" });
    });

    this.autoPlayButton.addEventListener("click", () => {
      if (!this.hasSelectedGame || !this.isController) {
        return;
      }
      this.vscodeApi.postMessage({ type: "toggleAutoPlay" });
    });

    this.fullscreenButton.addEventListener("click", () => {
      this.vscodeApi.postMessage({ type: "toggleFullscreen" });
    });
  }

  private attachKeyboard(): void {
    const handled = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"];

    document.addEventListener("keydown", (event) => {
      if (!this.hasSelectedGame || !this.isController || !this.game) {
        return;
      }

      if (handled.includes(event.key)) {
        event.preventDefault();
      }
      this.heldKeys.add(event.key);

      if (event.key === "Enter" && this.game.isGameOver()) {
        this.game.restart();
        this.syncSnapshot();
        return;
      }

      if (this.isPaused || this.game.isGameOver()) {
        return;
      }

      this.game.handleKey(event.key);
    });

    document.addEventListener("keyup", (event) => {
      this.heldKeys.delete(event.key);
    });

    window.addEventListener("blur", () => this.heldKeys.clear());
  }

  private attachMessageBus(): void {
    window.addEventListener("message", (event) => {
      const msg = event.data as { type: string; [key: string]: unknown };
      switch (msg.type) {
        case "gameSelected":
          this.handleGameSelected(msg);
          break;
        case "scoreUpdate":
          this.scoreEl.textContent = `Score: ${msg.score ?? 0}`;
          break;
        case "autoPlayChanged":
          this.setAutoPlayUi(Boolean(msg.enabled));
          this.game?.setAutoPlay(this.autoPlayEnabled);
          break;
        case "pauseChanged":
          this.setPauseUi(Boolean(msg.paused));
          this.game?.setPaused(this.isPaused);
          break;
        case "syncState":
          this.handleSyncState(msg);
          break;
        case "applySnapshot":
          this.game?.applySnapshot(msg.snapshot as Snapshot);
          break;
        case "controlChanged":
          this.isController = Boolean(msg.controlled);
          this.setControllerUi();
          break;
      }
    });
  }

  private handleGameSelected(msg: { [key: string]: unknown }): void {
    const name = (msg.name as string | null) ?? null;
    this.setPauseUi(false);
    this.setAutoPlayUi(Boolean(msg.autoPlay));
    this.game?.setPaused(false);
    this.game?.setAutoPlay(this.autoPlayEnabled);
    this.hasSelectedGame = Boolean(name);
    this.titleEl.textContent = name ?? "VSArcade";
    this.setControllerUi();
    if (this.hasSelectedGame && this.game) {
      this.game.restart();
      this.syncSnapshot();
    }
  }

  private handleSyncState(msg: { [key: string]: unknown }): void {
    const name = (msg.gameName as string | null) ?? null;
    this.titleEl.textContent = name ?? "VSArcade";
    this.hasSelectedGame = Boolean(name);
    this.setPauseUi(Boolean(msg.paused));
    this.setAutoPlayUi(Boolean(msg.autoPlay));
    this.isController = Boolean(msg.controlled);
    this.setControllerUi();
    const snapshot = (msg.snapshot ?? null) as Snapshot | null;
    if (this.game && snapshot !== null) {
      this.game.applySnapshot(snapshot);
    } else if (this.game && this.hasSelectedGame) {
      this.game.restart();
    }
  }

  private syncSnapshot(): void {
    if (!this.hasSelectedGame || !this.isController || !this.game) {
      return;
    }
    this.vscodeApi.postMessage({ type: "stateSync", snapshot: this.game.buildSnapshot() });
  }

  private setPauseUi(paused: boolean): void {
    this.isPaused = paused;
    this.pauseButton.textContent = paused ? "▶" : "⏸";
  }

  private setAutoPlayUi(enabled: boolean): void {
    this.autoPlayEnabled = enabled;
    this.autoPlayButton.classList.toggle("active", enabled);
  }

  private setControllerUi(): void {
    const enabled = this.hasSelectedGame && this.isController;
    this.pauseButton.disabled = !enabled;
    this.autoPlayButton.disabled = !enabled;
  }

  private tick(frameTime: number): void {
    if (!this.lastFrameTime) {
      this.lastFrameTime = frameTime;
    }
    const dt = Math.min(frameTime - this.lastFrameTime, FRAME_DELTA_CAP_MS);
    this.lastFrameTime = frameTime;

    if (this.game && this.hasSelectedGame && this.isController && !this.isPaused && !this.game.isGameOver()) {
      this.game.update(dt);
    }

    this.render();
    this.rafId = window.requestAnimationFrame((t) => this.tick(t));
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = CANVAS_BG;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.hasSelectedGame || !this.game) {
      this.drawOverlay("Select a game", "Use Ctrl+Shift+P to start", false);
      return;
    }

    this.game.render();

    if (this.game.isGameOver()) {
      if (this.game.isWon()) {
        this.drawOverlay("You Win!", "Press Enter to play again", true);
      } else {
        this.drawOverlay("Game Over", "Press Enter to restart", false);
      }
      return;
    }
    if (this.isPaused) {
      this.drawOverlay("Paused", "Press pause to continue", false);
    }
  }

  private drawOverlay(message: string, hint: string, won: boolean): void {
    this.ctx.fillStyle = won ? OVERLAY_WIN_BG : OVERLAY_BG;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const primaryColor = won ? TEXT_COLOR_WIN_PRIMARY : TEXT_COLOR_PRIMARY;
    const secondaryColor = won ? TEXT_COLOR_WIN_SECONDARY : TEXT_COLOR_SECONDARY;

    const messageLines = wrapPixelText(message, this.canvas.width - 16, 2);
    const hintLines = wrapPixelText(hint, this.canvas.width - 16, 1);
    const totalHeight = messageLines.length * 14 + hintLines.length * 7 + 6;
    const startY = Math.max(Math.floor((this.canvas.height - totalHeight) / 2), 16);

    if (won) {
      this.drawWinDecorations(startY - 10, totalHeight + 20);
    }

    drawCenteredLines(this.ctx, messageLines, startY, 2, primaryColor, this.canvas.width);
    drawCenteredLines(
      this.ctx,
      hintLines,
      startY + messageLines.length * 14 + 6,
      1,
      secondaryColor,
      this.canvas.width,
    );
  }

  private drawWinDecorations(centerY: number, height: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const midY = centerY + height / 2;

    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;

    for (let i = 0; i < 3; i++) {
      const offset = (i + 1) * 5;
      ctx.strokeRect(offset, midY - height / 2 - offset, w - offset * 2, height + offset * 2);
    }

    ctx.globalAlpha = 0.6;
    const starPositions = [
      { x: 14, y: midY - 14 },
      { x: w - 14, y: midY - 14 },
      { x: 14, y: midY + 14 },
      { x: w - 14, y: midY + 14 },
    ];
    ctx.fillStyle = "#ffd700";
    for (const pos of starPositions) {
      ctx.fillRect(pos.x - 1, pos.y - 3, 2, 6);
      ctx.fillRect(pos.x - 3, pos.y - 1, 6, 2);
    }

    ctx.globalAlpha = 1;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new Runtime().start());
} else {
  new Runtime().start();
}
