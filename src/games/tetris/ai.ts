// VSArcade Tetris — Auto-play planner

import { BOARD_HEIGHT, BOARD_WIDTH, PIECES } from "./constants";
import { cloneBoard, collides } from "./engine";
import type { Board, PlacedPiece } from "./types";

export interface AutoPlan {
  targetX: number;
  targetRotation: number;
  score: number;
}

function dropYFor(board: Board, piece: PlacedPiece): number {
  let testY = piece.y;
  while (!collides(board, { ...piece, y: testY }, 0, 1, piece.rotation)) {
    testY += 1;
  }
  return testY;
}

function evaluateBoard(board: Board, clearedLines: number): number {
  let aggregateHeight = 0;
  let holes = 0;
  let bumpiness = 0;
  let previousHeight = 0;

  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    let height = 0;
    let foundBlock = false;
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      if (board[y][x] && !foundBlock) {
        height = BOARD_HEIGHT - y;
        foundBlock = true;
      }
      if (!board[y][x] && foundBlock) {
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

function simulatePlacement(
  board: Board,
  piece: PlacedPiece,
  rotation: number,
  targetX: number,
): AutoPlan | null {
  const tentative: PlacedPiece = { ...piece, rotation, x: targetX };
  if (collides(board, tentative, 0, 0, rotation)) {
    return null;
  }
  tentative.y = dropYFor(board, tentative);

  const candidate = cloneBoard(board);
  const shape = PIECES[piece.type][rotation];
  for (let py = 0; py < shape.length; py += 1) {
    for (let px = 0; px < shape[py].length; px += 1) {
      if (!shape[py][px]) {
        continue;
      }
      const by = tentative.y + py;
      const bx = tentative.x + px;
      if (by >= 0) {
        candidate[by][bx] = piece.type;
      }
    }
  }

  let cleared = 0;
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    if (candidate[y].every(Boolean)) {
      cleared += 1;
    }
  }

  return {
    targetX,
    targetRotation: rotation,
    score: evaluateBoard(candidate, cleared),
  };
}

export function computeAutoPlan(board: Board, piece: PlacedPiece): AutoPlan | null {
  let best: AutoPlan | null = null;
  for (let rotation = 0; rotation < 4; rotation += 1) {
    const shape = PIECES[piece.type][rotation];
    const pieceWidth = shape[0].length;
    for (let x = -2; x <= BOARD_WIDTH - pieceWidth + 2; x += 1) {
      const candidate = simulatePlacement(board, piece, rotation, x);
      if (!candidate) {
        continue;
      }
      if (!best || candidate.score > best.score) {
        best = candidate;
      }
    }
  }
  return best;
}
