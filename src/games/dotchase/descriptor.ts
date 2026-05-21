// VSArcade DotChase — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const dotChaseDescriptor: IGameDescriptor = {
  id: GAME_IDS.DOTCHASE,
  name: "DotChase",
  version: "0.1.0",
  webviewEntry: "games/dotchase.js",
};
