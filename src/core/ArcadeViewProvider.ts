// ---------------------------------------------------------------
// VSArcade — Sidebar Webview View Provider
// ---------------------------------------------------------------

import * as vscode from "vscode";
import { GameManager } from "./GameManager";
import { COMMAND_IDS } from "../constants";

/**
 * Generates the HTML for the game webview (shared between sidebar and fullscreen).
 */
export function generateWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  gameName: string | null
): string {
  const cssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "main.css")
  );

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'unsafe-inline';"
  />
  <link rel="stylesheet" href="${cssUri}" />
  <title>VSArcade</title>
</head>
<body>
  <div class="game-container">
    <div class="game-header">
      <span class="game-title" id="gameTitle">${gameName ?? "VSArcade"}</span>
      <span class="game-score" id="gameScore">Score: 0</span>
    </div>
    <canvas id="gameCanvas" width="160" height="144"></canvas>
    <div class="game-controls">
      <button id="btnPause" title="Pause / Resume">⏸</button>
      <button id="btnAutoPlay" title="Toggle Auto Play">🤖</button>
      <button id="btnFullscreen" title="Fullscreen">⛶</button>
    </div>
  </div>

  <script>
    const vscodeApi = acquireVsCodeApi();
    const hasSelectedGame = ${gameName !== null ? "true" : "false"};

    // Input handling — forward keyboard events to the extension host
    document.addEventListener('keydown', (e) => {
      if (!hasSelectedGame) {
        return;
      }

      vscodeApi.postMessage({ type: 'keyDown', key: e.key, code: e.code });
      // Prevent default for game keys so the editor doesn't steal them
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (!hasSelectedGame) {
        return;
      }

      vscodeApi.postMessage({ type: 'keyUp', key: e.key, code: e.code });
    });

    // Button handlers
    document.getElementById('btnPause')?.addEventListener('click', () => {
      if (!hasSelectedGame) {
        return;
      }

      vscodeApi.postMessage({ type: 'togglePause' });
    });

    document.getElementById('btnAutoPlay')?.addEventListener('click', () => {
      if (!hasSelectedGame) {
        return;
      }

      vscodeApi.postMessage({ type: 'toggleAutoPlay' });
    });

    document.getElementById('btnFullscreen')?.addEventListener('click', () => {
      vscodeApi.postMessage({ type: 'toggleFullscreen' });
    });

    // Handle messages from the extension host
    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'gameSelected':
          document.getElementById('gameTitle').textContent = msg.name || 'VSArcade';
          break;
        case 'scoreUpdate':
          document.getElementById('gameScore').textContent = 'Score: ' + (msg.score ?? 0);
          break;
        case 'autoPlayChanged':
          const btn = document.getElementById('btnAutoPlay');
          if (btn) {
            btn.classList.toggle('active', msg.enabled);
          }
          break;
        case 'pauseChanged':
          const pauseBtn = document.getElementById('btnPause');
          if (pauseBtn) {
            pauseBtn.textContent = msg.paused ? '▶' : '⏸';
          }
          break;
        case 'renderFrame':
          // Future: receive pixel data for rendering
          break;
      }
    });

    // Notify extension host that webview is ready
    vscodeApi.postMessage({ type: 'webviewReady' });
  </script>
</body>
</html>`;
}

export class ArcadeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vsarcade.sidebar";

  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _gameManager: GameManager
  ) {}

  /** Resolve the sidebar webview view. */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    this._syncViewState();

    const activeGameName = this._gameManager.getActiveGame()?.name ?? null;
    webviewView.webview.html = generateWebviewHtml(
      webviewView.webview,
      this._extensionUri,
      activeGameName
    );

    this._disposables.push(
      webviewView.webview.onDidReceiveMessage((msg: { type: string; [key: string]: unknown }) => {
        this._handleMessage(msg);
      })
    );
  }

  /** Post a message to the sidebar webview. */
  public postMessage(message: unknown): void {
    this._view?.webview.postMessage(message);
  }

  /** Refresh the webview HTML (e.g., after selecting a new game). */
  public refresh(): void {
    if (this._view) {
      this._syncViewState();

      const activeGameName = this._gameManager.getActiveGame()?.name ?? null;
      this._view.webview.html = generateWebviewHtml(
        this._view.webview,
        this._extensionUri,
        activeGameName
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
        // Webview initialized — send current state
        break;
      case "keyDown":
        this._gameManager.getActiveGame()?.handleInput(msg.key as string, true);
        break;
      case "keyUp":
        this._gameManager.getActiveGame()?.handleInput(msg.key as string, false);
        break;
      case "togglePause":
        this.postMessage({
          type: "pauseChanged",
          paused: this._gameManager.togglePause(),
        });
        break;
      case "toggleAutoPlay":
        const autoPlay = this._gameManager.toggleAutoPlay();
        this.postMessage({ type: "autoPlayChanged", enabled: autoPlay });
        break;
      case "toggleFullscreen":
        vscode.commands.executeCommand(COMMAND_IDS.TOGGLE_FULLSCREEN);
        break;
    }
  }

  dispose(): void {
    this._disposables.forEach((d) => d.dispose());
  }
}
