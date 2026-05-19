// VSArcade Tetris — Canvas renderer

import {
  BOARD_HEIGHT,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  BOARD_WIDTH,
  CELL_SIZE,
  PIECES,
} from "./constants";
import { PIECE_COLORS } from "./types";
import type { PieceType } from "./types";
import type { TetrisEngine } from "./engine";
import { shapeOf } from "./engine";
import { drawPixelText, measurePixelText } from "../../webview/text";

const HUD_TEXT_COLOR = "#d8d2ea";

export class TetrisRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D, private readonly canvas: HTMLCanvasElement) {}

  render(engine: TetrisEngine, autoPlayEnabled: boolean): void {
    this.renderBoard(engine);
    this.renderHud(engine, autoPlayEnabled);
  }

  private renderBoard(engine: TetrisEngine): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(BOARD_OFFSET_X, BOARD_OFFSET_Y);

    ctx.fillStyle = "#0f0f23";
    ctx.fillRect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const cell = engine.board[y][x];
        if (cell) {
          this.drawCell(x, y, PIECE_COLORS[cell]);
        }
      }
    }

    if (engine.currentPiece) {
      const piece = engine.currentPiece;
      const shape = shapeOf(piece);
      for (let y = 0; y < shape.length; y += 1) {
        for (let x = 0; x < shape[y].length; x += 1) {
          if (!shape[y][x]) {
            continue;
          }
          const by = piece.y + y;
          if (by >= 0) {
            this.drawCell(piece.x + x, by, PIECE_COLORS[piece.type]);
          }
        }
      }
    }

    ctx.strokeStyle = "#2e2858";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
    ctx.restore();
  }

  private renderHud(engine: TetrisEngine, autoPlayEnabled: boolean): void {
    const ctx = this.ctx;
    const hudLeft = BOARD_OFFSET_X + BOARD_WIDTH * CELL_SIZE + 8;
    const hudRight = this.canvas.width - 8;
    const hudCenterX = hudLeft + Math.floor((hudRight - hudLeft) / 2);

    const nextLabel = "NEXT";
    const modeLine1 = "MOVE";
    const modeLine2 = autoPlayEnabled ? "AUTO" : "MANUAL";

    drawPixelText(
      ctx,
      nextLabel,
      hudCenterX - Math.floor(measurePixelText(nextLabel, 2) / 2),
      18,
      2,
      HUD_TEXT_COLOR,
    );
    drawPixelText(
      ctx,
      modeLine1,
      hudCenterX - Math.floor(measurePixelText(modeLine1, 2) / 2),
      78,
      2,
      HUD_TEXT_COLOR,
    );
    drawPixelText(
      ctx,
      modeLine2,
      hudCenterX - Math.floor(measurePixelText(modeLine2, 2) / 2),
      90,
      2,
      HUD_TEXT_COLOR,
    );

    if (engine.nextPieceType) {
      this.drawNextPreview(engine.nextPieceType, hudCenterX);
    }
  }

  private drawNextPreview(type: PieceType, centerX: number): void {
    const shape = PIECES[type][0];
    const previewWidth = shape[0].length * CELL_SIZE;
    const previewX = centerX - Math.floor(previewWidth / 2);
    const previewY = 38;
    this.ctx.fillStyle = PIECE_COLORS[type];
    for (let y = 0; y < shape.length; y += 1) {
      for (let x = 0; x < shape[y].length; x += 1) {
        if (!shape[y][x]) {
          continue;
        }
        this.ctx.fillRect(
          previewX + x * CELL_SIZE,
          previewY + y * CELL_SIZE,
          CELL_SIZE - 1,
          CELL_SIZE - 1,
        );
      }
    }
  }

  private drawCell(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
  }
}
