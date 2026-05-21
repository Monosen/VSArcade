// VSArcade Brickout — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const brickoutDescriptor: IGameDescriptor = {
  id: GAME_IDS.BRICKOUT,
  name: "Brickout",
  version: "0.1.0",
  webviewEntry: "games/brickout.js",
};
