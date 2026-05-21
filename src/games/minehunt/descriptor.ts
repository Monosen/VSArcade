// VSArcade MineHunt — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const mineHuntDescriptor: IGameDescriptor = {
  id: GAME_IDS.MINEHUNT,
  name: "MineHunt",
  version: "0.1.0",
  webviewEntry: "games/minehunt.js",
};
