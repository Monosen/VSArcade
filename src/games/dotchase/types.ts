// VSArcade DotChase — Types

export type Dir = "up" | "down" | "left" | "right";
export type GhostKind = "blinky" | "pinky" | "inky" | "clyde";
export type Mode = "scatter" | "chase";

export interface Vec {
  x: number;
  y: number;
}

export interface Ghost {
  kind: GhostKind;
  x: number;
  y: number;
  dir: Dir;
  frightened: boolean;
}

export interface DotChaseSnapshot {
  pac: Vec;
  pacDir: Dir;
  ghosts: Ghost[];
  pellets: boolean[][];
  power: boolean[][];
  score: number;
  lives: number;
  mode: Mode;
  modeTimer: number;
  frightenedTimer: number;
  gameOver: boolean;
  won: boolean;
}

export const DIR_VECTORS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const REVERSE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export const ALL_DIRS: Dir[] = ["up", "down", "left", "right"];
