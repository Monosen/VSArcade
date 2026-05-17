// ---------------------------------------------------------------
// VSArcade — Fullscreen Game Panel
// ---------------------------------------------------------------

import * as vscode from "vscode";
import { GameManager } from "./GameManager";
import { generateWebviewHtml } from "./ArcadeViewProvider";

export class FullscreenPanel {
  public static currentPanel: FullscreenPanel | undefined;
  private static readonly viewType = "vsarcade.fullscreen";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _gameManager: GameManager;
  private _disposables: vscode.Disposable[] = [];

  /** Create or reveal the fullscreen panel. */
  public static createOrShow(
    extensionUri: vscode.Uri,
    gameManager: GameManager
  ): FullscreenPanel {
    if (FullscreenPanel.currentPanel) {
      FullscreenPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
      return FullscreenPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      FullscreenPanel.viewType,
      "VSArcade — Game",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      }
    );

    FullscreenPanel.currentPanel = new FullscreenPanel(
      panel,
      extensionUri,
      gameManager
    );
    return FullscreenPanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    gameManager: GameManager
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._gameManager = gameManager;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (msg: { type: string; [key: string]: unknown }) => {
        this._handleMessage(msg);
      },
      null,
      this._disposables
    );
  }

  /** Post a message to the fullscreen webview. */
  public postMessage(message: unknown): void {
    this._panel.webview.postMessage(message);
  }

  private _update(): void {
    const activeGameId = this._gameManager.getActiveGameId();
    this._panel.webview.html = generateWebviewHtml(
      this._panel.webview,
      this._extensionUri,
      activeGameId
    );
  }

  private _handleMessage(msg: { type: string; [key: string]: unknown }): void {
    switch (msg.type) {
      case "webviewReady":
        break;
      case "keyDown":
        this._gameManager.getActiveGame()?.handleInput(msg.key as string, true);
        break;
      case "keyUp":
        this._gameManager.getActiveGame()?.handleInput(msg.key as string, false);
        break;
      case "togglePause":
        this._gameManager.togglePause();
        break;
      case "toggleAutoPlay":
        this._gameManager.toggleAutoPlay();
        break;
      case "toggleFullscreen":
        // Close fullscreen panel
        this._panel.dispose();
        break;
    }
  }

  public dispose(): void {
    FullscreenPanel.currentPanel = undefined;
    this._panel.dispose();
    this._disposables.forEach((d) => d.dispose());
  }
}