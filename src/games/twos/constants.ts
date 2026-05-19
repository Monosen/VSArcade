// VSArcade 2048 — Constants

export const GRID_SIZE = 4;
export const TILE_SIZE = 28;
export const TILE_GAP = 4;
export const WIN_TILE = 2048;

export const AUTO_MOVE_INTERVAL_MS = 180;

export const COLOR_BG = "#17122b";
export const COLOR_BOARD_BG = "#0f0f23";
export const COLOR_EMPTY_TILE = "#1f1a3e";
export const COLOR_TEXT_LIGHT = "#f5f5f5";
export const COLOR_TEXT_DARK = "#1a1230";

export const TILE_PALETTE: Record<number, { bg: string; fg: string }> = {
  2: { bg: "#d8d2ea", fg: COLOR_TEXT_DARK },
  4: { bg: "#aab1d6", fg: COLOR_TEXT_DARK },
  8: { bg: "#f2b179", fg: COLOR_TEXT_DARK },
  16: { bg: "#f59563", fg: COLOR_TEXT_LIGHT },
  32: { bg: "#f67c5f", fg: COLOR_TEXT_LIGHT },
  64: { bg: "#ff3b3b", fg: COLOR_TEXT_LIGHT },
  128: { bg: "#ffd700", fg: COLOR_TEXT_DARK },
  256: { bg: "#ffc100", fg: COLOR_TEXT_DARK },
  512: { bg: "#ffa500", fg: COLOR_TEXT_LIGHT },
  1024: { bg: "#ff8c00", fg: COLOR_TEXT_LIGHT },
  2048: { bg: "#b24bff", fg: COLOR_TEXT_LIGHT },
};

export const TILE_FALLBACK = { bg: "#5a2cc2", fg: COLOR_TEXT_LIGHT };
