// VSArcade — Sidebar webview provider (HTML shell, no inline JS)

import * as vscode from "vscode";
import {
  GameManager,
  RuntimeSnapshot,
  RuntimeSurface,
} from "./GameManager";

export interface WebviewRuntimeState {
  gameName: string | null;
  paused: boolean;
  autoPlay: boolean;
  controlled: boolean;
  snapshot: RuntimeSnapshot | null;
}

export type RuntimeSyncHandler = (
  source: RuntimeSurface,
  snapshot: RuntimeSnapshot,
) => void;

export type PauseSyncHandler = (paused: boolean) => void;
export type ToggleFullscreenHandler = () => void;

export function createWebviewRuntimeState(
  gameManager: GameManager,
  surface: RuntimeSurface,
): WebviewRuntimeState {
  return {
    gameName: gameManager.getActiveGame()?.name ?? null,
    paused: gameManager.isPaused(),
    autoPlay: gameManager.isAutoPlayEnabled(),
    controlled: gameManager.getActiveSurface() === surface,
    snapshot: gameManager.getRuntimeSnapshot(),
  };
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function generateWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  gameManager: GameManager,
  surface: RuntimeSurface,
): string {
  const cssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "main.css"),
  );
  const runtimeUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "out", "webview", "runtime.js"),
  );
  const activeGame = gameManager.getActiveGame();
  const gameScriptUri = activeGame
    ? webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, "out", activeGame.webviewEntry),
      )
    : null;

  const state = createWebviewRuntimeState(gameManager, surface);
  const stateAttr = escapeAttribute(JSON.stringify(state));
  const csp = `default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource}; img-src ${webview.cspSource} data:;`;
  const displayMode = surface;

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta id="vsarcade-state" content="${stateAttr}" />
  <link rel="stylesheet" href="${cssUri}" />
  <title>VSArcade</title>
</head>
<body class="vsarcade-${displayMode}">
  <div class="game-container game-container-${displayMode}">
    <div class="game-header">
      <span class="game-title" id="gameTitle">${state.gameName ?? "VSArcade"}</span>
      <span class="game-score" id="gameScore">Score: 0</span>
    </div>
    <canvas id="gameCanvas" width="160" height="144"></canvas>
    <div class="game-controls">
      <button id="btnPause" title="Pause / Resume">⏸</button>
      <button id="btnAutoPlay" title="Toggle Auto Play">🤖</button>
      <button id="btnFullscreen" title="Fullscreen">⛶</button>
    </div>
  </div>
  <script src="${runtimeUri}"></script>
  ${gameScriptUri ? `<script src="${gameScriptUri}"></script>` : ""}
</body>
</html>`;
}

export class ArcadeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vsarcade.sidebar";

  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _gameManager: GameManager,
    private readonly _onRuntimeSync: RuntimeSyncHandler,
    private readonly _onPauseSync: PauseSyncHandler,
    private readonly _onToggleFullscreen: ToggleFullscreenHandler,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    this._syncViewState();
    webviewView.webview.html = generateWebviewHtml(
      webviewView.webview,
      this._extensionUri,
      this._gameManager,
      "sidebar",
    );

    this._disposables.push(
      webviewView.webview.onDidReceiveMessage(
        (msg: { type: string; [key: string]: unknown }) => {
          this._handleMessage(msg);
        },
      ),
    );
  }

  public postMessage(message: unknown): void {
    this._view?.webview.postMessage(message);
  }

  public refresh(): void {
    if (this._view) {
      this._syncViewState();
      this._view.webview.html = generateWebviewHtml(
        this._view.webview,
        this._extensionUri,
        this._gameManager,
        "sidebar",
      );
    }
  }

  private _syncViewState(): void {
    if (!this._view) {
      return;
    }
    const activeGame = this._gameManager.getActiveGame();
    this._view.title = activeGame?.name ?? "VSArcade";
    this._view.description = activeGame ? "Ready" : "Select from Command Palette";
  }

  private _handleMessage(msg: { type: string; [key: string]: unknown }): void {
    switch (msg.type) {
      case "webviewReady":
        this.postMessage({
          type: "syncState",
          ...createWebviewRuntimeState(this._gameManager, "sidebar"),
        });
        break;
      case "stateSync":
        this._onRuntimeSync("sidebar", msg.snapshot as RuntimeSnapshot);
        break;
      case "togglePause":
        this._onPauseSync(this._gameManager.togglePause());
        break;
      case "toggleAutoPlay": {
        const autoPlay = this._gameManager.toggleAutoPlay();
        this.postMessage({ type: "autoPlayChanged", enabled: autoPlay });
        break;
      }
      case "toggleFullscreen":
        this._onToggleFullscreen();
        break;
    }
  }

  dispose(): void {
    this._disposables.forEach((d) => d.dispose());
  }
}
