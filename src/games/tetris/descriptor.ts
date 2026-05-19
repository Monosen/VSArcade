// VSArcade Tetris — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const tetrisDescriptor: IGameDescriptor = {
  id: GAME_IDS.TETRIS,
  name: "Falling Blocks",
  version: "0.1.0",
  webviewEntry: "games/tetris.js",
};
