// ---------------------------------------------------------------
// VSArcade Tetris — Renderer (placeholder)
// ---------------------------------------------------------------

import type { Board, PieceType } from "./types";
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, SIDE_PANEL_WIDTH } from "./constants";
import { PIECE_COLORS } from "./types";
import { COLORS } from "../../constants";

/**
 * Renders Tetris game state onto a logical 160×144 canvas context.
 * This is a placeholder — actual rendering logic will be added later.
 */
export class TetrisRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 0;
  private height = 0;

  /** Initialize the renderer with a canvas context. */
  init(canvas: HTMLCanvasElement): void {
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
  }

  /** Render the full game frame. */
  render(board: Board, score: number): void {
    if (!this.ctx) {
      return;
    }

    this.clearFrame();
    this.drawBoard(board);
    this.drawSidePanel(score);
  }

  /** Clear the entire canvas. */
  private clearFrame(): void {
    if (!this.ctx) { return; }
    this.ctx.fillStyle = COLORS.BOARD_BG;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Draw the board grid and placed pieces. */
  private drawBoard(board: Board): void {
    if (!this.ctx) { return; }

    const offsetX = 0;
    const offsetY = 0;

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board[y][x];
        if (cell) {
          const color = PIECE_COLORS[cell as PieceType] ?? "#ffffff";
          this.ctx.fillStyle = color;
          this.ctx.fillRect(
            offsetX + x * CELL_SIZE,
            offsetY + y * CELL_SIZE,
            CELL_SIZE - 1,
            CELL_SIZE - 1
          );
        }
      }
    }

    // Draw grid lines
    this.ctx.strokeStyle = COLORS.GRID_LINE;
    this.ctx.lineWidth = 0.5;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX + x * CELL_SIZE, offsetY);
      this.ctx.lineTo(offsetX + x * CELL_SIZE, offsetY + BOARD_HEIGHT * CELL_SIZE);
      this.ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX, offsetY + y * CELL_SIZE);
      this.ctx.lineTo(offsetX + BOARD_WIDTH * CELL_SIZE, offsetY + y * CELL_SIZE);
      this.ctx.stroke();
    }
  }

  /** Draw the side panel with score. */
  private drawSidePanel(score: number): void {
    if (!this.ctx) { return; }

    const panelX = BOARD_WIDTH * CELL_SIZE + 4;
    this.ctx.fillStyle = COLORS.TEXT;
    this.ctx.font = "7px monospace";
    this.ctx.fillText("SCORE", panelX, 12);
    this.ctx.fillText(String(score), panelX, 22);
  }

  dispose(): void {
    this.ctx = null;
  }
}