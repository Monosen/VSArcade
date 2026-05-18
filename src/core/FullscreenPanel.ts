// ---------------------------------------------------------------
// VSArcade — Fullscreen Game Panel
// ---------------------------------------------------------------

import * as vscode from "vscode";
import { GameManager, RuntimeSnapshot } from "./GameManager";
import {
  createWebviewRuntimeState,
  generateWebviewHtml,
  RuntimeSyncHandler,
} from "./ArcadeViewProvider";

export class FullscreenPanel {
  public static currentPanel: FullscreenPanel | undefined;
  private static readonly viewType = "vsarcade.fullscreen";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _gameManager: GameManager;
  private readonly _onRuntimeSync: RuntimeSyncHandler;
  private readonly _onPanelClosed: () => void;
  private _disposables: vscode.Disposable[] = [];
  private _isDisposing = false;

  /** Create or reveal the fullscreen panel. */
  public static createOrShow(
    extensionUri: vscode.Uri,
    gameManager: GameManager,
    onRuntimeSync: RuntimeSyncHandler,
    onPanelClosed: () => void
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
      gameManager,
      onRuntimeSync,
      onPanelClosed
    );
    return FullscreenPanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    gameManager: GameManager,
    onRuntimeSync: RuntimeSyncHandler,
    onPanelClosed: () => void
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._gameManager = gameManager;
    this._onRuntimeSync = onRuntimeSync;
    this._onPanelClosed = onPanelClosed;

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

  public refresh(): void {
    this._update();
  }

  private _update(): void {
    this._panel.webview.html = generateWebviewHtml(
      this._panel.webview,
      this._extensionUri,
      createWebviewRuntimeState(this._gameManager, "fullscreen"),
      "fullscreen"
    );
  }

  private _handleMessage(msg: { type: string; [key: string]: unknown }): void {
    switch (msg.type) {
      case "webviewReady":
        this.postMessage({
          type: "syncState",
          ...createWebviewRuntimeState(this._gameManager, "fullscreen"),
        });
        break;
      case "stateSync":
        this._onRuntimeSync("fullscreen", msg.snapshot as RuntimeSnapshot);
        break;
      case "togglePause":
        this.postMessage({
          type: "pauseChanged",
          paused: this._gameManager.togglePause(),
        });
        break;
      case "toggleAutoPlay": {
        const autoPlay = this._gameManager.toggleAutoPlay();
        this.postMessage({ type: "autoPlayChanged", enabled: autoPlay });
        break;
      }
      case "toggleFullscreen":
        // Close fullscreen panel
        this._panel.dispose();
        break;
    }
  }

  public dispose(): void {
    if (this._isDisposing) {
      return;
    }

    this._isDisposing = true;
    FullscreenPanel.currentPanel = undefined;
    this._onPanelClosed();
    this._disposables.forEach((d) => d.dispose());
    this._panel.dispose();
  }
}
