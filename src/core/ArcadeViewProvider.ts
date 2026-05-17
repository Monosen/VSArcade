// ---------------------------------------------------------------
// VSArcade — Sidebar Webview View Provider
// ---------------------------------------------------------------

import * as vscode from "vscode";
import { GameManager } from "./GameManager";
import { COMMAND_IDS } from "../constants";

export interface WebviewRuntimeState {
  gameName: string | null;
  paused: boolean;
  autoPlay: boolean;
}

export function createWebviewRuntimeState(
  gameManager: GameManager
): WebviewRuntimeState {
  return {
    gameName: gameManager.getActiveGame()?.name ?? null,
    paused: gameManager.isPaused(),
    autoPlay: gameManager.isAutoPlayEnabled(),
  };
}

/**
 * Generates the HTML for the game webview (shared between sidebar and fullscreen).
 */
export function generateWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  runtimeState: WebviewRuntimeState,
  displayMode: "sidebar" | "fullscreen" = "sidebar"
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
<body class="vsarcade-${displayMode}">
  <div class="game-container game-container-${displayMode}">
    <div class="game-header">
      <span class="game-title" id="gameTitle">${runtimeState.gameName ?? "VSArcade"}</span>
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
      pauseButton.textContent = isPaused ? '▶' : '⏸';
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
      if (autoPlayAccumulator < 180) {
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

        const dropInterval = autoPlayEnabled ? 420 : 500;
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
    webviewView.webview.html = generateWebviewHtml(
      webviewView.webview,
      this._extensionUri,
      createWebviewRuntimeState(this._gameManager)
    );

    this._disposables.push(
      webviewView.webview.onDidReceiveMessage(
        (msg: { type: string; [key: string]: unknown }) => {
          this._handleMessage(msg);
        }
      )
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
      this._view.webview.html = generateWebviewHtml(
        this._view.webview,
        this._extensionUri,
        createWebviewRuntimeState(this._gameManager)
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
          ...createWebviewRuntimeState(this._gameManager),
        });
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
        vscode.commands.executeCommand(COMMAND_IDS.TOGGLE_FULLSCREEN);
        break;
    }
  }

  dispose(): void {
    this._disposables.forEach((d) => d.dispose());
  }
}
