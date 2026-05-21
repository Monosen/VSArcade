// ---------------------------------------------------------------
// VSArcade — Command, View, and Game identifiers
// ---------------------------------------------------------------

export const COMMAND_IDS = {
  SELECT_GAME: "vsarcade.selectGame",
  TOGGLE_FULLSCREEN: "vsarcade.toggleFullscreen",
  TOGGLE_AUTO_PLAY: "vsarcade.toggleAutoPlay",
} as const;

export const VIEW_IDS = {
  SIDEBAR: "vsarcade.sidebar",
} as const;

export const GAME_IDS = {
  TETRIS: "tetris",
  SNAKE: "snake",
  TWOS: "twos",
  MINEHUNT: "minehunt",
  PONG: "pong",
  BRICKOUT: "brickout",
  SKYHOP: "skyhop",
  DOTCHASE: "dotchase",
  INVADERS: "invaders",
  DUEL: "duel",
} as const;

/** Fixed classic Game Boy–style colors for game pieces.
 * These are NOT theme-dependent — they must be vivid and recognizable. */
export const COLORS = {
  // Tetris piece colors (classic NES palette approximations)
  I_PIECE: "#00d4ff", // cyan
  O_PIECE: "#ffd700", // yellow
  T_PIECE: "#b24bff", // purple
  S_PIECE: "#00ff6a", // green
  Z_PIECE: "#ff3b3b", // red
  J_PIECE: "#3b5dff", // blue
  L_PIECE: "#ff8c00", // orange

  // Board / UI colors
  BOARD_BG: "#0f0f23",
  GRID_LINE: "#1a1a3a",
  GHOST: "rgba(255, 255, 255, 0.15)",
  TEXT: "#cccccc",
} as const;