// VSArcade Skyhop — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const skyhopDescriptor: IGameDescriptor = {
  id: GAME_IDS.SKYHOP,
  name: "Skyhop",
  version: "0.1.0",
  webviewEntry: "games/skyhop.js",
};
