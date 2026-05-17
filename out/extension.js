"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode4 = __toESM(require("vscode"));

// src/constants.ts
var COMMAND_IDS = {
  SELECT_GAME: "vsarcade.selectGame",
  TOGGLE_FULLSCREEN: "vsarcade.toggleFullscreen",
  TOGGLE_AUTO_PLAY: "vsarcade.toggleAutoPlay"
};
var VIEW_IDS = {
  SIDEBAR: "vsarcade.sidebar"
};
var GAME_IDS = {
  TETRIS: "tetris"
};

// src/core/GameManager.ts
var GameManager = class {
  constructor() {
    this.games = /* @__PURE__ */ new Map();
    this.activeGameId = null;
    this.autoPlay = false;
    this.paused = false;
    this.theme = "dark";
  }
  /** Register a game engine so it can be selected. */
  registerGame(engine) {
    this.games.set(engine.id, engine);
  }
  /** Get all registered game engines. */
  getRegisteredGames() {
    return Array.from(this.games.values());
  }
  /** Select a game by its id. Returns the engine or undefined. */
  selectGame(id) {
    const engine = this.games.get(id);
    if (engine) {
      this.activeGameId = id;
    }
    return engine;
  }
  /** Get the currently active game engine, if any. */
  getActiveGame() {
    if (this.activeGameId === null) {
      return void 0;
    }
    return this.games.get(this.activeGameId);
  }
  /** Get the id of the currently active game. */
  getActiveGameId() {
    return this.activeGameId;
  }
  /** Toggle auto-play on the active game. Returns new state. */
  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;
    const engine = this.getActiveGame();
    if (engine) {
      engine.setAutoPlay(this.autoPlay);
    }
    return this.autoPlay;
  }
  /** Toggle pause on the active game. Returns new state. */
  togglePause() {
    this.paused = !this.paused;
    const engine = this.getActiveGame();
    if (engine) {
      engine.setPaused(this.paused);
    }
    return this.paused;
  }
  /** Set the visual theme. */
  setTheme(theme) {
    this.theme = theme;
  }
  /** Get current theme. */
  getTheme() {
    return this.theme;
  }
  /** Create GameOptions based on current manager state. */
  createOptions() {
    return {
      autoPlay: this.autoPlay,
      theme: this.theme
    };
  }
  /** Dispose all game engines. */
  dispose() {
    for (const engine of this.games.values()) {
      engine.dispose();
    }
    this.games.clear();
    this.activeGameId = null;
  }
};

// src/core/ArcadeViewProvider.ts
var vscode = __toESM(require("vscode"));
function generateWebviewHtml(webview, extensionUri, _gameId) {
  const cssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "main.css")
  );
  return (
    /*html*/
    `<!DOCTYPE html>
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
      <span class="game-title" id="gameTitle">${_gameId ? _gameId.toUpperCase() : "VSArcade"}</span>
      <span class="game-score" id="gameScore">Score: 0</span>
    </div>
    <canvas id="gameCanvas" width="160" height="144"></canvas>
    <div class="game-controls">
      <button id="btnPause" title="Pause / Resume">\u23F8</button>
      <button id="btnAutoPlay" title="Toggle Auto Play">\u{1F916}</button>
      <button id="btnFullscreen" title="Fullscreen">\u26F6</button>
    </div>
  </div>

  <script>
    const vscodeApi = acquireVsCodeApi();
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Theme detection
    function getCurrentTheme() {
      return document.body.classList.contains('vscode-dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    // Input handling \u2014 forward keyboard events to the extension host
    document.addEventListener('keydown', (e) => {
      vscodeApi.postMessage({ type: 'keyDown', key: e.key, code: e.code });
      // Prevent default for game keys so the editor doesn't steal them
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      vscodeApi.postMessage({ type: 'keyUp', key: e.key, code: e.code });
    });

    // Button handlers
    document.getElementById('btnPause')?.addEventListener('click', () => {
      vscodeApi.postMessage({ type: 'togglePause' });
    });

    document.getElementById('btnAutoPlay')?.addEventListener('click', () => {
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
            pauseBtn.textContent = msg.paused ? '\u25B6' : '\u23F8';
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
</html>`
  );
}
var ArcadeViewProvider = class {
  constructor(_extensionUri, _gameManager) {
    this._extensionUri = _extensionUri;
    this._gameManager = _gameManager;
    this._disposables = [];
  }
  /** Resolve the sidebar webview view. */
  resolveWebviewView(webviewView, _context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    const activeGameId = this._gameManager.getActiveGameId();
    webviewView.webview.html = generateWebviewHtml(
      webviewView.webview,
      this._extensionUri,
      activeGameId
    );
    this._disposables.push(
      webviewView.webview.onDidReceiveMessage((msg) => {
        this._handleMessage(msg);
      })
    );
  }
  /** Post a message to the sidebar webview. */
  postMessage(message) {
    var _a;
    (_a = this._view) == null ? void 0 : _a.webview.postMessage(message);
  }
  /** Refresh the webview HTML (e.g., after selecting a new game). */
  refresh() {
    if (this._view) {
      const activeGameId = this._gameManager.getActiveGameId();
      this._view.webview.html = generateWebviewHtml(
        this._view.webview,
        this._extensionUri,
        activeGameId
      );
    }
  }
  _handleMessage(msg) {
    var _a, _b;
    switch (msg.type) {
      case "webviewReady":
        break;
      case "keyDown":
        (_a = this._gameManager.getActiveGame()) == null ? void 0 : _a.handleInput(msg.key, true);
        break;
      case "keyUp":
        (_b = this._gameManager.getActiveGame()) == null ? void 0 : _b.handleInput(msg.key, false);
        break;
      case "togglePause":
        this._gameManager.togglePause();
        this.postMessage({
          type: "pauseChanged",
          paused: true
          // GameManager toggles internally; reflect new state
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
  dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
};
ArcadeViewProvider.viewType = "vsarcade.sidebar";

// src/core/FullscreenPanel.ts
var vscode2 = __toESM(require("vscode"));
var _FullscreenPanel = class _FullscreenPanel {
  constructor(panel, extensionUri, gameManager2) {
    this._disposables = [];
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._gameManager = gameManager2;
    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      (msg) => {
        this._handleMessage(msg);
      },
      null,
      this._disposables
    );
  }
  /** Create or reveal the fullscreen panel. */
  static createOrShow(extensionUri, gameManager2) {
    if (_FullscreenPanel.currentPanel) {
      _FullscreenPanel.currentPanel._panel.reveal(vscode2.ViewColumn.One);
      return _FullscreenPanel.currentPanel;
    }
    const panel = vscode2.window.createWebviewPanel(
      _FullscreenPanel.viewType,
      "VSArcade \u2014 Game",
      vscode2.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );
    _FullscreenPanel.currentPanel = new _FullscreenPanel(
      panel,
      extensionUri,
      gameManager2
    );
    return _FullscreenPanel.currentPanel;
  }
  /** Post a message to the fullscreen webview. */
  postMessage(message) {
    this._panel.webview.postMessage(message);
  }
  _update() {
    const activeGameId = this._gameManager.getActiveGameId();
    this._panel.webview.html = generateWebviewHtml(
      this._panel.webview,
      this._extensionUri,
      activeGameId
    );
  }
  _handleMessage(msg) {
    var _a, _b;
    switch (msg.type) {
      case "webviewReady":
        break;
      case "keyDown":
        (_a = this._gameManager.getActiveGame()) == null ? void 0 : _a.handleInput(msg.key, true);
        break;
      case "keyUp":
        (_b = this._gameManager.getActiveGame()) == null ? void 0 : _b.handleInput(msg.key, false);
        break;
      case "togglePause":
        this._gameManager.togglePause();
        break;
      case "toggleAutoPlay":
        this._gameManager.toggleAutoPlay();
        break;
      case "toggleFullscreen":
        this._panel.dispose();
        break;
    }
  }
  dispose() {
    _FullscreenPanel.currentPanel = void 0;
    this._panel.dispose();
    this._disposables.forEach((d) => d.dispose());
  }
};
_FullscreenPanel.viewType = "vsarcade.fullscreen";
var FullscreenPanel = _FullscreenPanel;

// src/input/InputHandler.ts
var vscode3 = __toESM(require("vscode"));
var InputHandler = class {
  constructor(_gameManager) {
    this._gameManager = _gameManager;
    this._disposables = [];
  }
  /** Register command-based input forwarding. */
  registerCommands(context) {
    const moveLeft = vscode3.commands.registerCommand(
      "vsarcade.input.left",
      () => {
        var _a;
        return (_a = this._gameManager.getActiveGame()) == null ? void 0 : _a.handleInput("ArrowLeft", true);
      }
    );
    const moveRight = vscode3.commands.registerCommand(
      "vsarcade.input.right",
      () => {
        var _a;
        return (_a = this._gameManager.getActiveGame()) == null ? void 0 : _a.handleInput("ArrowRight", true);
      }
    );
    const moveDown = vscode3.commands.registerCommand(
      "vsarcade.input.down",
      () => {
        var _a;
        return (_a = this._gameManager.getActiveGame()) == null ? void 0 : _a.handleInput("ArrowDown", true);
      }
    );
    const rotate = vscode3.commands.registerCommand(
      "vsarcade.input.rotate",
      () => {
        var _a;
        return (_a = this._gameManager.getActiveGame()) == null ? void 0 : _a.handleInput("ArrowUp", true);
      }
    );
    const dropHard = vscode3.commands.registerCommand(
      "vsarcade.input.drop",
      () => {
        var _a;
        return (_a = this._gameManager.getActiveGame()) == null ? void 0 : _a.handleInput(" ", true);
      }
    );
    this._disposables.push(moveLeft, moveRight, moveDown, rotate, dropHard);
    context.subscriptions.push(...this._disposables);
  }
  dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
};

// src/games/tetris/constants.ts
var BOARD_WIDTH = 10;
var BOARD_HEIGHT = 20;

// src/games/tetris/TetrisGame.ts
var TetrisGame = class {
  constructor() {
    this.id = GAME_IDS.TETRIS;
    this.name = "Falling Blocks";
    this.version = "0.1.0";
    this.canvas = null;
    this.ctx = null;
    this.board = [];
    this.score = 0;
    this.autoPlay = false;
    this.paused = false;
    this.options = null;
  }
  init(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = options;
    this.autoPlay = options.autoPlay;
    this.board = this.createEmptyBoard();
    this.score = 0;
  }
  dispose() {
    this.canvas = null;
    this.ctx = null;
  }
  update(deltaTime) {
  }
  render() {
    if (!this.ctx || !this.canvas) {
      return;
    }
    const ctx = this.ctx;
    ctx.fillStyle = "#0f0f23";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const cellW = this.canvas.width / BOARD_WIDTH;
    const cellH = this.canvas.height / BOARD_HEIGHT;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = this.board[y][x];
        if (cell) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(
            x * cellW + 1,
            y * cellH + 1,
            cellW - 2,
            cellH - 2
          );
        }
      }
    }
    ctx.fillStyle = "#00d4ff";
    ctx.fillRect(4 * cellW, 8 * cellH, cellW, cellH);
  }
  handleInput(key, isPressed) {
  }
  setAutoPlay(enabled) {
    this.autoPlay = enabled;
  }
  setPaused(paused) {
    this.paused = paused;
  }
  getState() {
    return { score: this.score };
  }
  loadState(state) {
    this.score = state.score;
  }
  // ---- Internal helpers ----
  createEmptyBoard() {
    const board = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        row.push(null);
      }
      board.push(row);
    }
    return board;
  }
};

// src/extension.ts
var gameManager;
var sidebarProvider;
var inputHandler;
function activate(context) {
  gameManager = new GameManager();
  const tetris = new TetrisGame();
  gameManager.registerGame(tetris);
  const currentTheme = vscode4.window.activeColorTheme;
  gameManager.setTheme(
    currentTheme.kind === vscode4.ColorThemeKind.Dark ? "dark" : "light"
  );
  sidebarProvider = new ArcadeViewProvider(context.extensionUri, gameManager);
  context.subscriptions.push(
    vscode4.window.registerWebviewViewProvider(
      VIEW_IDS.SIDEBAR,
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  inputHandler = new InputHandler(gameManager);
  inputHandler.registerCommands(context);
  const selectGameCommand = vscode4.commands.registerCommand(
    COMMAND_IDS.SELECT_GAME,
    async () => {
      const games = gameManager.getRegisteredGames();
      const items = games.map((g) => ({
        label: g.name,
        description: `v${g.version}`,
        detail: g.id
      }));
      const selected = await vscode4.window.showQuickPick(items, {
        placeHolder: "Select a game to play",
        title: "VSArcade \u2014 Select Game"
      });
      if (selected) {
        const engine = gameManager.selectGame(selected.detail);
        if (engine) {
          sidebarProvider.postMessage({
            type: "gameSelected",
            id: engine.id,
            name: engine.name
          });
          vscode4.window.showInformationMessage(
            `VSArcade: Now playing ${engine.name}`
          );
        }
      }
    }
  );
  const toggleFullscreenCommand = vscode4.commands.registerCommand(
    COMMAND_IDS.TOGGLE_FULLSCREEN,
    () => {
      const activeGame = gameManager.getActiveGame();
      if (!activeGame) {
        vscode4.window.showWarningMessage(
          "VSArcade: No game selected. Use 'Select Game' first."
        );
        return;
      }
      FullscreenPanel.createOrShow(context.extensionUri, gameManager);
    }
  );
  const toggleAutoPlayCommand = vscode4.commands.registerCommand(
    COMMAND_IDS.TOGGLE_AUTO_PLAY,
    () => {
      const activeGame = gameManager.getActiveGame();
      if (!activeGame) {
        vscode4.window.showWarningMessage(
          "VSArcade: No game selected. Use 'Select Game' first."
        );
        return;
      }
      const enabled = gameManager.toggleAutoPlay();
      sidebarProvider.postMessage({
        type: "autoPlayChanged",
        enabled
      });
      vscode4.window.showInformationMessage(
        `VSArcade: Auto-play ${enabled ? "enabled" : "disabled"}`
      );
    }
  );
  const themeChangeListener = vscode4.window.onDidChangeActiveColorTheme(
    (theme) => {
      gameManager.setTheme(
        theme.kind === vscode4.ColorThemeKind.Dark ? "dark" : "light"
      );
    }
  );
  context.subscriptions.push(
    selectGameCommand,
    toggleFullscreenCommand,
    toggleAutoPlayCommand,
    themeChangeListener,
    sidebarProvider,
    inputHandler
  );
}
function deactivate() {
  gameManager.dispose();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
