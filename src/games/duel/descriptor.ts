// VSArcade Duel — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const duelDescriptor: IGameDescriptor = {
  id: GAME_IDS.DUEL,
  name: "Duel",
  version: "0.1.0",
  webviewEntry: "games/duel.js",
};
