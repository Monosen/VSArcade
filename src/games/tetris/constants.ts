// ---------------------------------------------------------------
// VSArcade Tetris — Constants
// ---------------------------------------------------------------

import type { PieceType } from "./types";

/** Board dimensions (standard NES Tetris). */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

/** Logical canvas size (original Game Boy resolution). */
export const LOGICAL_WIDTH = 160;
export const LOGICAL_HEIGHT = 144;

/** Each cell in logical pixels. */
export const CELL_SIZE = 8;

/** Side panel width in logical pixels (for score display). */
export const SIDE_PANEL_WIDTH = 40;

/** Fall speed in rows per second (initial). */
export const INITIAL_FALL_SPEED = 1.0;

/** Speed increase per level. */
export const SPEED_INCREMENT = 0.5;

/** Lines needed to advance one level. */
export const LINES_PER_LEVEL = 10;

/** DAS (Delayed Auto Shift) delay in ms. */
export const DAS_DELAY = 170;

/** DAS repeat interval in ms. */
export const DAS_REPEAT = 50;

/** Lock delay in ms — how long a piece sits on the floor before locking. */
export const LOCK_DELAY = 500;

/**
 * Piece shape definitions.
 * Each piece has 4 rotation states, each defined as a 2D boolean grid.
 * Rotation follows Game Boy original rotation (no wall kicks).
 */
export const PIECES: Record<
  PieceType,
  boolean[][][][]
> = {
  I: [
    // Rotation 0
    [
      [false, false, false, false],
      [true,  true,  true,  true],
      [false, false, false, false],
      [false, false, false, false],
    ],
    // Rotation 1 (R)
    [
      [false, false, true,  false],
      [false, false, true,  false],
      [false, false, true,  false],
      [false, false, true,  false],
    ],
    // Rotation 2
    [
      [false, false, false, false],
      [false, false, false, false],
      [true,  true,  true,  true],
      [false, false, false, false],
    ],
    // Rotation 3 (L)
    [
      [false, true,  false, false],
      [false, true,  false, false],
      [false, true,  false, false],
      [false, true,  false, false],
    ],
  ],
  O: [
    // All rotations are the same for O piece
    [
      [true, true],
      [true, true],
    ],
    [
      [true, true],
      [true, true],
    ],
    [
      [true, true],
      [true, true],
    ],
    [
      [true, true],
      [true, true],
    ],
  ],
  T: [
    [
      [false, true,  false],
      [true,  true,  true],
      [false, false, false],
    ],
    [
      [false, true,  false],
      [false, true,  true],
      [false, true,  false],
    ],
    [
      [false, false, false],
      [true,  true,  true],
      [false, true,  false],
    ],
    [
      [false, true,  false],
      [true,  true,  false],
      [false, true,  false],
    ],
  ],
  S: [
    [
      [false, true,  true],
      [true,  true,  false],
      [false, false, false],
    ],
    [
      [false, true,  false],
      [false, true,  true],
      [false, false, true],
    ],
    [
      [false, false, false],
      [false, true,  true],
      [true,  true,  false],
    ],
    [
      [true,  false, false],
      [true,  true,  false],
      [false, true,  false],
    ],
  ],
  Z: [
    [
      [true,  true,  false],
      [false, true,  true],
      [false, false, false],
    ],
    [
      [false, false, true],
      [false, true,  true],
      [false, true,  false],
    ],
    [
      [false, false, false],
      [true,  true,  false],
      [false, true,  true],
    ],
    [
      [false, true,  false],
      [true,  true,  false],
      [true,  false, false],
    ],
  ],
  J: [
    [
      [true,  false, false],
      [true,  true,  true],
      [false, false, false],
    ],
    [
      [false, true,  true],
      [false, true,  false],
      [false, true,  false],
    ],
    [
      [false, false, false],
      [true,  true,  true],
      [false, false, true],
    ],
    [
      [false, true,  false],
      [false, true,  false],
      [true,  true,  false],
    ],
  ],
  L: [
    [
      [false, false, true],
      [true,  true,  true],
      [false, false, false],
    ],
    [
      [false, true,  false],
      [false, true,  false],
      [false, true,  true],
    ],
    [
      [false, false, false],
      [true,  true,  true],
      [true,  false, false],
    ],
    [
      [true,  true,  false],
      [false, true,  false],
      [false, true,  false],
    ],
  ],
};

/** All piece types in bag randomizer order. */
export const ALL_PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** Score values for line clears (NES Tetris scoring). */
export const SCORE_TABLE: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};