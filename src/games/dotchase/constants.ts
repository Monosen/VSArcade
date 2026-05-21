// VSArcade DotChase — Constants

import type { GhostKind, Vec } from "./types";

export const COLS = 19;
export const ROWS = 15;
export const CELL = 8;

export const STEP_MS = 150;
export const SCATTER_MS = 5000;
export const CHASE_MS = 18000;
export const FRIGHTENED_MS = 6000;

export const START_LIVES = 3;
export const PELLET_SCORE = 10;
export const POWER_SCORE = 50;
export const GHOST_SCORE = 200;
export const CLYDE_RANGE = 8;

export const PAC_SPAWN: Vec = { x: 9, y: 12 };

export const GHOST_SPAWNS: Record<GhostKind, Vec> = {
  blinky: { x: 9, y: 6 },
  pinky: { x: 8, y: 7 },
  inky: { x: 10, y: 7 },
  clyde: { x: 9, y: 8 },
};

export const SCATTER_CORNERS: Record<GhostKind, Vec> = {
  blinky: { x: COLS - 2, y: 1 },
  pinky: { x: 1, y: 1 },
  inky: { x: COLS - 2, y: ROWS - 2 },
  clyde: { x: 1, y: ROWS - 2 },
};

export const POWER_CELLS: Vec[] = [
  { x: 1, y: 2 },
  { x: 17, y: 2 },
  { x: 1, y: 12 },
  { x: 17, y: 12 },
];

export const GHOST_KINDS: GhostKind[] = ["blinky", "pinky", "inky", "clyde"];

export const COLOR_BG = "#0a0a18";
export const COLOR_WALL = "#3b5dff";
export const COLOR_PELLET = "#f2d9a0";
export const COLOR_POWER = "#ffd700";
export const COLOR_PAC = "#ffd700";
export const COLOR_FRIGHTENED = "#3b5dff";
export const COLOR_LIFE = "#ffd700";

export const GHOST_COLORS: Record<GhostKind, string> = {
  blinky: "#ff3b3b",
  pinky: "#ff8cc8",
  inky: "#00d4ff",
  clyde: "#ff8c00",
};
