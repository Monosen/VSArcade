// ---------------------------------------------------------------
// VSArcade Tetris — Types
// ---------------------------------------------------------------

import { COLORS } from "../../constants";

/** Shape grid representation: 0 = empty, piece type letter = filled. */
export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/** Cell value in the board grid. */
export type CellValue = PieceType | null;

/** 2D board of cells. */
export type Board = CellValue[][];

/** Color map from piece type to hex color string. */
export const PIECE_COLORS: Record<PieceType, string> = {
  I: COLORS.I_PIECE,
  O: COLORS.O_PIECE,
  T: COLORS.T_PIECE,
  S: COLORS.S_PIECE,
  Z: COLORS.Z_PIECE,
  J: COLORS.J_PIECE,
  L: COLORS.L_PIECE,
};

/** A positioned piece on the board. */
export interface PlacedPiece {
  type: PieceType;
  x: number;
  y: number;
  rotation: number;
}

/** Input state for the game. */
export interface TetrisInputState {
  left: boolean;
  right: boolean;
  down: boolean;
  rotate: boolean;
  hardDrop: boolean;
}