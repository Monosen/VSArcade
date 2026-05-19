// VSArcade 2048 — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const twosDescriptor: IGameDescriptor = {
  id: GAME_IDS.TWOS,
  name: "Twos",
  version: "0.1.0",
  webviewEntry: "games/twos.js",
};
