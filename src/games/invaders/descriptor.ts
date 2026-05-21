// VSArcade Invaders — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const invadersDescriptor: IGameDescriptor = {
  id: GAME_IDS.INVADERS,
  name: "Invaders",
  version: "0.1.0",
  webviewEntry: "games/invaders.js",
};
