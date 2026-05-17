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
      this.paused = false;
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
  /** Whether the active game is paused. */
  isPaused() {
    return this.paused;
  }
  /** Whether auto-play is enabled. */
  isAutoPlayEnabled() {
    return this.autoPlay;
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
function createWebviewRuntimeState(gameManager2) {
  var _a;
  return {
    gameName: ((_a = gameManager2.getActiveGame()) == null ? void 0 : _a.name) ?? null,
    paused: gameManager2.isPaused(),
    autoPlay: gameManager2.isAutoPlayEnabled()
  };
}
function generateWebviewHtml(webview, extensionUri, runtimeState) {
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
      <span class="game-title" id="gameTitle">${runtimeState.gameName ?? "VSArcade"}</span>
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
    const initialState = ${JSON.stringify(runtimeState)};
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const titleEl = document.getElementById('gameTitle');
    const scoreEl = document.getElementById('gameScore');
    const pauseButton = document.getElementById('btnPause');
    const autoPlayButton = document.getElementById('btnAutoPlay');

    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const CELL_SIZE = 6;
    const BOARD_OFFSET_X = 16;
    const BOARD_OFFSET_Y = 12;
    const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const PIECE_COLORS = {
      I: '#00d4ff',
      O: '#ffd700',
      T: '#b24bff',
      S: '#00ff6a',
      Z: '#ff3b3b',
      J: '#3b5dff',
      L: '#ff8c00'
    };
    const PIECES = {
      I: [
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
        [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
      ],
      O: [
        [[1,1],[1,1]],
        [[1,1],[1,1]],
        [[1,1],[1,1]],
        [[1,1],[1,1]]
      ],
      T: [
        [[0,1,0],[1,1,1],[0,0,0]],
        [[0,1,0],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,1],[0,1,0]],
        [[0,1,0],[1,1,0],[0,1,0]]
      ],
      S: [
        [[0,1,1],[1,1,0],[0,0,0]],
        [[0,1,0],[0,1,1],[0,0,1]],
        [[0,0,0],[0,1,1],[1,1,0]],
        [[1,0,0],[1,1,0],[0,1,0]]
      ],
      Z: [
        [[1,1,0],[0,1,1],[0,0,0]],
        [[0,0,1],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,0],[0,1,1]],
        [[0,1,0],[1,1,0],[1,0,0]]
      ],
      J: [
        [[1,0,0],[1,1,1],[0,0,0]],
        [[0,1,1],[0,1,0],[0,1,0]],
        [[0,0,0],[1,1,1],[0,0,1]],
        [[0,1,0],[0,1,0],[1,1,0]]
      ],
      L: [
        [[0,0,1],[1,1,1],[0,0,0]],
        [[0,1,0],[0,1,0],[0,1,1]],
        [[0,0,0],[1,1,1],[1,0,0]],
        [[1,1,0],[0,1,0],[0,1,0]]
      ]
    };
    const SCORE_TABLE = { 1: 100, 2: 300, 3: 500, 4: 800 };

    let board = [];
    let currentPiece = null;
    let nextPieceType = null;
    let score = 0;
    let dropAccumulator = 0;
    let autoPlayAccumulator = 0;
    let animationFrameId = 0;
    let lastFrameTime = 0;
    let gameOver = false;
    let hasSelectedGame = Boolean(initialState.gameName);
    let isPaused = initialState.paused;
    let autoPlayEnabled = initialState.autoPlay;
    let activePlan = null;

    function createEmptyBoard() {
      return Array.from({ length: BOARD_HEIGHT }, () =>
        Array.from({ length: BOARD_WIDTH }, () => null)
      );
    }

    function updateScore(nextScore) {
      score = nextScore;
      scoreEl.textContent = 'Score: ' + score;
    }

    function setPauseState(paused) {
      isPaused = paused;
      pauseButton.textContent = isPaused ? '\u25B6' : '\u23F8';
    }

    function setAutoPlayState(enabled) {
      autoPlayEnabled = enabled;
      autoPlayButton.classList.toggle('active', enabled);
    }

    function setButtonsEnabled(enabled) {
      pauseButton.disabled = !enabled;
      autoPlayButton.disabled = !enabled;
    }

    function randomPieceType() {
      return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    }

    function createPiece(type) {
      const shape = PIECES[type][0];
      return {
        type,
        rotation: 0,
        x: Math.floor((BOARD_WIDTH - shape[0].length) / 2),
        y: -1
      };
    }

    function getShape(piece) {
      return PIECES[piece.type][piece.rotation];
    }

    function collides(piece, dx, dy, rotation) {
      const nextRotation = rotation ?? piece.rotation;
      const shape = PIECES[piece.type][nextRotation];
      const offsetX = piece.x + dx;
      const offsetY = piece.y + dy;

      for (let y = 0; y < shape.length; y += 1) {
        for (let x = 0; x < shape[y].length; x += 1) {
          if (!shape[y][x]) {
            continue;
          }

          const boardX = offsetX + x;
          const boardY = offsetY + y;

          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return true;
          }

          if (boardY >= 0 && board[boardY][boardX]) {
            return true;
          }
        }
      }

      return false;
    }

    function mergePiece(piece) {
      const shape = getShape(piece);
      for (let y = 0; y < shape.length; y += 1) {
        for (let x = 0; x < shape[y].length; x += 1) {
          if (!shape[y][x]) {
            continue;
          }

          const boardX = piece.x + x;
          const boardY = piece.y + y;
          if (boardY >= 0) {
            board[boardY][boardX] = piece.type;
          }
        }
      }
    }

    function clearLines() {
      let cleared = 0;
      const nextBoard = [];

      for (let y = 0; y < BOARD_HEIGHT; y += 1) {
        if (board[y].every(Boolean)) {
          cleared += 1;
          continue;
        }
        nextBoard.push(board[y]);
      }

      while (nextBoard.length < BOARD_HEIGHT) {
        nextBoard.unshift(Array.from({ length: BOARD_WIDTH }, () => null));
      }

      board = nextBoard;
      if (cleared > 0) {
        updateScore(score + (SCORE_TABLE[cleared] ?? cleared * 100));
      }
    }

    function restartGame() {
      board = createEmptyBoard();
      currentPiece = null;
      nextPieceType = randomPieceType();
      activePlan = null;
      dropAccumulator = 0;
      autoPlayAccumulator = 0;
      gameOver = false;
      updateScore(0);
      spawnPiece();
      render();
    }

    function startSelectedGame(gameName) {
      hasSelectedGame = Boolean(gameName);
      titleEl.textContent = gameName || 'VSArcade';
      setButtonsEnabled(hasSelectedGame);

      if (!hasSelectedGame) {
        board = createEmptyBoard();
        currentPiece = null;
        nextPieceType = null;
        activePlan = null;
        gameOver = false;
        updateScore(0);
        render();
        return;
      }

      restartGame();
    }

    function spawnPiece() {
      const type = nextPieceType || randomPieceType();
      nextPieceType = randomPieceType();
      currentPiece = createPiece(type);
      activePlan = autoPlayEnabled ? computeAutoPlan() : null;

      if (collides(currentPiece, 0, 0)) {
        gameOver = true;
        setPauseState(true);
      }
    }

    function rotatePiece() {
      if (!currentPiece) {
        return;
      }

      const nextRotation = (currentPiece.rotation + 1) % 4;
      if (!collides(currentPiece, 0, 0, nextRotation)) {
        currentPiece.rotation = nextRotation;
      }
    }

    function movePiece(dx, dy) {
      if (!currentPiece) {
        return false;
      }

      if (!collides(currentPiece, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
      }

      if (dy > 0) {
        lockPiece();
      }

      return false;
    }

    function hardDrop() {
      if (!currentPiece) {
        return;
      }

      while (movePiece(0, 1)) {
        // Drop until lock.
      }
    }

    function lockPiece() {
      if (!currentPiece) {
        return;
      }

      mergePiece(currentPiece);
      clearLines();
      spawnPiece();
    }

    function cloneBoard(sourceBoard) {
      return sourceBoard.map((row) => row.slice());
    }

    function dropYFor(piece) {
      let testPiece = { ...piece };
      while (!collides(testPiece, 0, 1, testPiece.rotation)) {
        testPiece.y += 1;
      }
      return testPiece.y;
    }

    function evaluateBoard(candidateBoard, clearedLines) {
      let aggregateHeight = 0;
      let holes = 0;
      let bumpiness = 0;
      let previousHeight = 0;

      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        let height = 0;
        let foundBlock = false;

        for (let y = 0; y < BOARD_HEIGHT; y += 1) {
          if (candidateBoard[y][x] && !foundBlock) {
            height = BOARD_HEIGHT - y;
            foundBlock = true;
          }

          if (!candidateBoard[y][x] && foundBlock) {
            holes += 1;
          }
        }

        aggregateHeight += height;
        if (x > 0) {
          bumpiness += Math.abs(height - previousHeight);
        }
        previousHeight = height;
      }

      return clearedLines * 1200 - holes * 45 - aggregateHeight * 4 - bumpiness * 8;
    }

    function simulatePlacement(piece, rotation, x) {
      const simulationPiece = { ...piece, rotation, x, y: piece.y };
      if (collides(simulationPiece, 0, 0, rotation)) {
        return null;
      }

      simulationPiece.y = dropYFor(simulationPiece);
      const candidateBoard = cloneBoard(board);
      const shape = PIECES[simulationPiece.type][rotation];

      for (let py = 0; py < shape.length; py += 1) {
        for (let px = 0; px < shape[py].length; px += 1) {
          if (!shape[py][px]) {
            continue;
          }

          const boardX = simulationPiece.x + px;
          const boardY = simulationPiece.y + py;
          if (boardY >= 0) {
            candidateBoard[boardY][boardX] = simulationPiece.type;
          }
        }
      }

      let clearedLines = 0;
      for (let y = 0; y < BOARD_HEIGHT; y += 1) {
        if (candidateBoard[y].every(Boolean)) {
          clearedLines += 1;
        }
      }

      return {
        targetX: x,
        targetRotation: rotation,
        score: evaluateBoard(candidateBoard, clearedLines)
      };
    }

    function computeAutoPlan() {
      if (!currentPiece) {
        return null;
      }

      let bestPlan = null;

      for (let rotation = 0; rotation < 4; rotation += 1) {
        const shape = PIECES[currentPiece.type][rotation];
        const pieceWidth = shape[0].length;

        for (let x = -2; x <= BOARD_WIDTH - pieceWidth + 2; x += 1) {
          const candidate = simulatePlacement(currentPiece, rotation, x);
          if (!candidate) {
            continue;
          }

          if (!bestPlan || candidate.score > bestPlan.score) {
            bestPlan = candidate;
          }
        }
      }

      return bestPlan;
    }

    function runAutoPlay(deltaTime) {
      if (!autoPlayEnabled || !currentPiece || !activePlan || isPaused || gameOver) {
        return;
      }

      autoPlayAccumulator += deltaTime;
      if (autoPlayAccumulator < 90) {
        return;
      }
      autoPlayAccumulator = 0;

      if (currentPiece.rotation !== activePlan.targetRotation) {
        rotatePiece();
        return;
      }

      if (currentPiece.x < activePlan.targetX && movePiece(1, 0)) {
        return;
      }

      if (currentPiece.x > activePlan.targetX && movePiece(-1, 0)) {
        return;
      }

      hardDrop();
    }

    function drawCell(x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    }

    function renderBoard() {
      ctx.save();
      ctx.translate(BOARD_OFFSET_X, BOARD_OFFSET_Y);

      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);

      for (let y = 0; y < BOARD_HEIGHT; y += 1) {
        for (let x = 0; x < BOARD_WIDTH; x += 1) {
          const cell = board[y][x];
          if (cell) {
            drawCell(x, y, PIECE_COLORS[cell]);
          }
        }
      }

      if (currentPiece) {
        const shape = getShape(currentPiece);
        for (let y = 0; y < shape.length; y += 1) {
          for (let x = 0; x < shape[y].length; x += 1) {
            if (!shape[y][x]) {
              continue;
            }

            const boardX = currentPiece.x + x;
            const boardY = currentPiece.y + y;
            if (boardY >= 0) {
              drawCell(boardX, boardY, PIECE_COLORS[currentPiece.type]);
            }
          }
        }
      }

      ctx.strokeStyle = '#2e2858';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
      ctx.restore();
    }

    function renderHud() {
      ctx.fillStyle = '#cccccc';
      ctx.font = '8px monospace';
      ctx.fillText('NEXT', 96, 24);
      ctx.fillText('MOVE', 96, 84);
      ctx.fillText(autoPlayEnabled ? 'AUTO' : 'MANUAL', 96, 94);

      if (nextPieceType) {
        const shape = PIECES[nextPieceType][0];
        for (let y = 0; y < shape.length; y += 1) {
          for (let x = 0; x < shape[y].length; x += 1) {
            if (!shape[y][x]) {
              continue;
            }

            ctx.fillStyle = PIECE_COLORS[nextPieceType];
            ctx.fillRect(96 + x * CELL_SIZE, 30 + y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
          }
        }
      }
    }

    function renderOverlay(message, hint) {
      ctx.fillStyle = 'rgba(10, 10, 18, 0.82)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f5f5f5';
      ctx.font = '10px monospace';
      ctx.fillText(message, 24, 64);
      ctx.font = '8px monospace';
      ctx.fillText(hint, 24, 80);
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#17122b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!hasSelectedGame) {
        renderOverlay('Select a game', 'Use Ctrl+Shift+P to start');
        return;
      }

      renderBoard();
      renderHud();

      if (gameOver) {
        renderOverlay('Game Over', 'Press Enter to restart');
        return;
      }

      if (isPaused) {
        renderOverlay('Paused', 'Press pause to continue');
      }
    }

    function tick(frameTime) {
      if (!lastFrameTime) {
        lastFrameTime = frameTime;
      }

      const deltaTime = Math.min(frameTime - lastFrameTime, 50);
      lastFrameTime = frameTime;

      if (hasSelectedGame && !isPaused && !gameOver) {
        dropAccumulator += deltaTime;
        runAutoPlay(deltaTime);

        const dropInterval = autoPlayEnabled ? 220 : 500;
        if (dropAccumulator >= dropInterval) {
          dropAccumulator = 0;
          movePiece(0, 1);
        }
      }

      render();
      animationFrameId = window.requestAnimationFrame(tick);
    }

    document.addEventListener('keydown', (event) => {
      if (!hasSelectedGame) {
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === 'Enter' && gameOver) {
        setPauseState(false);
        restartGame();
        return;
      }

      if (isPaused || gameOver || autoPlayEnabled) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        case ' ': 
          hardDrop();
          break;
      }
    });

    pauseButton.addEventListener('click', () => {
      if (!hasSelectedGame) {
        return;
      }

      vscodeApi.postMessage({ type: 'togglePause' });
    });

    autoPlayButton.addEventListener('click', () => {
      if (!hasSelectedGame) {
        return;
      }

      vscodeApi.postMessage({ type: 'toggleAutoPlay' });
    });

    document.getElementById('btnFullscreen').addEventListener('click', () => {
      vscodeApi.postMessage({ type: 'toggleFullscreen' });
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'gameSelected':
          setPauseState(false);
          setAutoPlayState(Boolean(msg.autoPlay));
          startSelectedGame(msg.name || null);
          break;
        case 'scoreUpdate':
          updateScore(msg.score ?? 0);
          break;
        case 'autoPlayChanged':
          setAutoPlayState(Boolean(msg.enabled));
          if (autoPlayEnabled && currentPiece) {
            activePlan = computeAutoPlan();
          }
          break;
        case 'pauseChanged':
          setPauseState(Boolean(msg.paused));
          break;
        case 'syncState':
          titleEl.textContent = msg.gameName || 'VSArcade';
          if (msg.gameName && !hasSelectedGame) {
            startSelectedGame(msg.gameName);
          }
          setPauseState(Boolean(msg.paused));
          setAutoPlayState(Boolean(msg.autoPlay));
          break;
      }
    });

    setPauseState(isPaused);
    setAutoPlayState(autoPlayEnabled);
    setButtonsEnabled(hasSelectedGame);
    startSelectedGame(initialState.gameName);
    render();
    animationFrameId = window.requestAnimationFrame(tick);
    window.addEventListener('beforeunload', () => window.cancelAnimationFrame(animationFrameId));

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
    this._syncViewState();
    webviewView.webview.html = generateWebviewHtml(
      webviewView.webview,
      this._extensionUri,
      createWebviewRuntimeState(this._gameManager)
    );
    this._disposables.push(
      webviewView.webview.onDidReceiveMessage(
        (msg) => {
          this._handleMessage(msg);
        }
      )
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
      this._syncViewState();
      this._view.webview.html = generateWebviewHtml(
        this._view.webview,
        this._extensionUri,
        createWebviewRuntimeState(this._gameManager)
      );
    }
  }
  _syncViewState() {
    if (!this._view) {
      return;
    }
    const activeGame = this._gameManager.getActiveGame();
    this._view.title = (activeGame == null ? void 0 : activeGame.name) ?? "VSArcade";
    this._view.description = activeGame ? "Ready" : "Select from Command Palette";
  }
  _handleMessage(msg) {
    switch (msg.type) {
      case "webviewReady":
        this.postMessage({
          type: "syncState",
          ...createWebviewRuntimeState(this._gameManager)
        });
        break;
      case "togglePause":
        this.postMessage({
          type: "pauseChanged",
          paused: this._gameManager.togglePause()
        });
        break;
      case "toggleAutoPlay": {
        const autoPlay = this._gameManager.toggleAutoPlay();
        this.postMessage({ type: "autoPlayChanged", enabled: autoPlay });
        break;
      }
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
  refresh() {
    this._update();
  }
  _update() {
    this._panel.webview.html = generateWebviewHtml(
      this._panel.webview,
      this._extensionUri,
      createWebviewRuntimeState(this._gameManager)
    );
  }
  _handleMessage(msg) {
    switch (msg.type) {
      case "webviewReady":
        this.postMessage({
          type: "syncState",
          ...createWebviewRuntimeState(this._gameManager)
        });
        break;
      case "togglePause":
        this.postMessage({
          type: "pauseChanged",
          paused: this._gameManager.togglePause()
        });
        break;
      case "toggleAutoPlay": {
        const autoPlay = this._gameManager.toggleAutoPlay();
        this.postMessage({ type: "autoPlayChanged", enabled: autoPlay });
        break;
      }
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
      var _a, _b;
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
          sidebarProvider.refresh();
          (_a = FullscreenPanel.currentPanel) == null ? void 0 : _a.refresh();
          const runtimeMessage = {
            type: "gameSelected",
            id: engine.id,
            name: engine.name,
            autoPlay: gameManager.isAutoPlayEnabled()
          };
          sidebarProvider.postMessage(runtimeMessage);
          (_b = FullscreenPanel.currentPanel) == null ? void 0 : _b.postMessage(runtimeMessage);
          await vscode4.commands.executeCommand("workbench.view.explorer");
          await vscode4.commands.executeCommand(`${VIEW_IDS.SIDEBAR}.focus`);
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
      var _a;
      const activeGame = gameManager.getActiveGame();
      if (!activeGame) {
        vscode4.window.showWarningMessage(
          "VSArcade: No game selected. Use 'Select Game' first."
        );
        return;
      }
      const enabled = gameManager.toggleAutoPlay();
      const message = {
        type: "autoPlayChanged",
        enabled
      };
      sidebarProvider.postMessage(message);
      (_a = FullscreenPanel.currentPanel) == null ? void 0 : _a.postMessage(message);
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
