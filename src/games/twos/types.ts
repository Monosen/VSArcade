// VSArcade 2048 — Types

export type Direction = "up" | "down" | "left" | "right";
export type Board = number[][];

export interface TwosSnapshot {
  board: Board;
  score: number;
  gameOver: boolean;
  won: boolean;
}

export const ALL_DIRECTIONS: Direction[] = ["up", "down", "left", "right"];
