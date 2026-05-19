// VSArcade Snake — Host descriptor

import { GAME_IDS } from "../../constants";
import type { IGameDescriptor } from "../../types/game";

export const snakeDescriptor: IGameDescriptor = {
  id: GAME_IDS.SNAKE,
  name: "Snakey",
  version: "0.1.0",
  webviewEntry: "games/snake.js",
};
