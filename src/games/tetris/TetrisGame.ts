// ---------------------------------------------------------------
// VSArcade Tetris — Game Engine (placeholder)
// ---------------------------------------------------------------

import type { IGameEngine, GameOptions, GameStateSnapshot } from "../../types/game";
import { GAME_IDS } from "../../constants";
import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants";
import type { Board, CellValue } from "./types";

/** Tetris game engine implementing IGameEngine. */
export class TetrisGame implements IGameEngine {
  readonly id = GAME_IDS.TETRIS;
  readonly name = "Falling Blocks";
  readonly version = "0.1.0";

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private board: Board = [];
  private score = 0;
  private autoPlay = false;
  private paused = false;
  private options: GameOptions | null = null;

  init(canvas: HTMLCanvasElement, options: GameOptions): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = options;
    this.autoPlay = options.autoPlay;
    this.board = this.createEmptyBoard();
    this.score = 0;
  }

  dispose(): void {
    this.canvas = null;
    this.ctx = null;
  }

  update(deltaTime: number): void {
    // Placeholder — does nothing yet.
    void deltaTime;
  }

  render(): void {
    if (!this.ctx || !this.canvas) {
      return;
    }

    const ctx = this.ctx;

    // Clear canvas with board background
    ctx.fillStyle = "#0f0f23";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw board grid
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

    // Placeholder: draw a small indicator in the center
    ctx.fillStyle = "#00d4ff";
    ctx.fillRect(4 * cellW, 8 * cellH, cellW, cellH);
  }

  handleInput(key: string, isPressed: boolean): void {
    // Placeholder — no input logic yet.
    void key;
    void isPressed;
  }

  setAutoPlay(enabled: boolean): void {
    this.autoPlay = enabled;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  getState(): GameStateSnapshot {
    return { score: this.score };
  }

  loadState(state: GameStateSnapshot): void {
    this.score = state.score;
  }

  // ---- Internal helpers ----

  private createEmptyBoard(): Board {
    const board: Board = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const row: CellValue[] = [];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        row.push(null);
      }
      board.push(row);
    }
    return board;
  }
}