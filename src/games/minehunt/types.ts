// VSArcade MineHunt — Types

export interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacentMines: number;
}

export type MineGrid = Cell[][];

export interface Vec {
  x: number;
  y: number;
}

export interface MineHuntSnapshot {
  grid: MineGrid;
  cursor: Vec;
  minesPlaced: boolean;
  score: number;
  gameOver: boolean;
  won: boolean;
}
