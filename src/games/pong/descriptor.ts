// VSArcade Pong — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const pongDescriptor: IGameDescriptor = {
  id: GAME_IDS.PONG,
  name: "Pong",
  version: "0.1.0",
  webviewEntry: "games/pong.js",
};
