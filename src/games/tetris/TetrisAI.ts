// ---------------------------------------------------------------
// VSArcade Tetris — AI Controller (placeholder)
// ---------------------------------------------------------------

import type { Board, PieceType, PlacedPiece } from "./types";

/**
 * AI controller for auto-play mode.
 * Placeholder — actual AI logic will be added later.
 */
export class TetrisAI {
  private enabled = false;

  /** Enable or disable the AI. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Whether the AI is currently active. */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Compute the best move for the given board state and current piece.
   * Returns the target placement for the piece.
   * Placeholder — returns a no-op move centered on the board.
   */
  computeBestMove(
    _board: Board,
    _currentPiece: PlacedPiece,
    _pieceType: PieceType
  ): { targetX: number; targetRotation: number; shouldHardDrop: boolean } {
    // Placeholder: just center the piece
    return {
      targetX: 4,
      targetRotation: 0,
      shouldHardDrop: true,
    };
  }

  dispose(): void {
    this.enabled = false;
  }
}