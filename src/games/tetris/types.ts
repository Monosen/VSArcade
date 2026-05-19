// VSArcade Tetris — Types

import { COLORS } from "../../constants";

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type CellValue = PieceType | null;
export type Board = CellValue[][];

export interface PlacedPiece {
  type: PieceType;
  x: number;
  y: number;
  rotation: number;
}

export interface TetrisSnapshot {
  board: CellValue[][];
  currentPiece: PlacedPiece | null;
  nextPieceType: PieceType | null;
  score: number;
  gameOver: boolean;
}

export const PIECE_COLORS: Record<PieceType, string> = {
  I: COLORS.I_PIECE,
  O: COLORS.O_PIECE,
  T: COLORS.T_PIECE,
  S: COLORS.S_PIECE,
  Z: COLORS.Z_PIECE,
  J: COLORS.J_PIECE,
  L: COLORS.L_PIECE,
};
