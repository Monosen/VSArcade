// VSArcade Tetris — Pure game logic

import {
  ALL_PIECE_TYPES,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  PIECES,
  SCORE_TABLE,
} from "./constants";
import type { Board, CellValue, PieceType, PlacedPiece, TetrisSnapshot } from "./types";

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null as CellValue),
  );
}

export function randomPieceType(): PieceType {
  return ALL_PIECE_TYPES[Math.floor(Math.random() * ALL_PIECE_TYPES.length)];
}

export function shapeOf(piece: PlacedPiece): number[][] {
  return PIECES[piece.type][piece.rotation];
}

export function collides(
  board: Board,
  piece: PlacedPiece,
  dx: number,
  dy: number,
  rotation: number = piece.rotation,
): boolean {
  const shape = PIECES[piece.type][rotation];
  const offsetX = piece.x + dx;
  const offsetY = piece.y + dy;

  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) {
        continue;
      }
      const bx = offsetX + x;
      const by = offsetY + y;
      if (bx < 0 || bx >= BOARD_WIDTH || by >= BOARD_HEIGHT) {
        return true;
      }
      if (by >= 0 && board[by][bx]) {
        return true;
      }
    }
  }
  return false;
}

export function mergePiece(board: Board, piece: PlacedPiece): void {
  const shape = shapeOf(piece);
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) {
        continue;
      }
      const by = piece.y + y;
      const bx = piece.x + x;
      if (by >= 0) {
        board[by][bx] = piece.type;
      }
    }
  }
}

export function clearLines(board: Board): { board: Board; cleared: number } {
  const next: Board = [];
  let cleared = 0;
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    if (board[y].every(Boolean)) {
      cleared += 1;
      continue;
    }
    next.push(board[y]);
  }
  while (next.length < BOARD_HEIGHT) {
    next.unshift(Array.from({ length: BOARD_WIDTH }, () => null as CellValue));
  }
  return { board: next, cleared };
}

export function scoreFor(cleared: number): number {
  return SCORE_TABLE[cleared] ?? cleared * 100;
}

export function createPiece(type: PieceType): PlacedPiece {
  const shape = PIECES[type][0];
  return {
    type,
    rotation: 0,
    x: Math.floor((BOARD_WIDTH - shape[0].length) / 2),
    y: -1,
  };
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export class TetrisEngine {
  board: Board = createEmptyBoard();
  currentPiece: PlacedPiece | null = null;
  nextPieceType: PieceType | null = null;
  score = 0;
  gameOver = false;

  reset(): void {
    this.board = createEmptyBoard();
    this.score = 0;
    this.gameOver = false;
    this.nextPieceType = randomPieceType();
    this.currentPiece = null;
    this.spawnPiece();
  }

  spawnPiece(): void {
    const type = this.nextPieceType ?? randomPieceType();
    this.nextPieceType = randomPieceType();
    const piece = createPiece(type);
    if (collides(this.board, piece, 0, 0)) {
      this.gameOver = true;
      this.currentPiece = null;
      return;
    }
    this.currentPiece = piece;
  }

  movePiece(dx: number, dy: number): boolean {
    if (!this.currentPiece || this.gameOver) {
      return false;
    }
    if (!collides(this.board, this.currentPiece, dx, dy)) {
      this.currentPiece.x += dx;
      this.currentPiece.y += dy;
      return true;
    }
    if (dy > 0) {
      this.lockPiece();
    }
    return false;
  }

  rotatePiece(): boolean {
    if (!this.currentPiece || this.gameOver) {
      return false;
    }
    const next = (this.currentPiece.rotation + 1) % 4;
    if (!collides(this.board, this.currentPiece, 0, 0, next)) {
      this.currentPiece.rotation = next;
      return true;
    }
    return false;
  }

  hardDrop(): void {
    while (this.movePiece(0, 1)) {
      // keep dropping
    }
  }

  private lockPiece(): void {
    if (!this.currentPiece) {
      return;
    }
    mergePiece(this.board, this.currentPiece);
    const cleared = clearLines(this.board);
    this.board = cleared.board;
    if (cleared.cleared > 0) {
      this.score += scoreFor(cleared.cleared);
    }
    this.spawnPiece();
  }

  getSnapshot(): TetrisSnapshot {
    return {
      board: this.board.map((row) => row.slice()),
      currentPiece: this.currentPiece ? { ...this.currentPiece } : null,
      nextPieceType: this.nextPieceType,
      score: this.score,
      gameOver: this.gameOver,
    };
  }

  applySnapshot(s: TetrisSnapshot): void {
    this.board = s.board.map((row) => row.slice());
    this.currentPiece = s.currentPiece ? { ...s.currentPiece } : null;
    this.nextPieceType = s.nextPieceType;
    this.score = s.score;
    this.gameOver = s.gameOver;
  }
}
