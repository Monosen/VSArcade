// VSArcade Duel — Fighter AI (used for the opponent and for player auto-play)

import { ATTACKS, FIGHTER_W } from "./constants";
import type { Fighter, FighterIntent } from "./types";

const IDLE_INTENT: FighterIntent = { walk: 0, block: false, attack: null };

function gapBetween(self: Fighter, foe: Fighter): number {
  return self.facing === 1
    ? foe.x - (self.x + FIGHTER_W)
    : self.x - (foe.x + FIGHTER_W);
}

export function decideFighterIntent(self: Fighter, foe: Fighter): FighterIntent {
  if (self.state !== "idle" && self.state !== "walk" && self.state !== "block") {
    return IDLE_INTENT;
  }

  const gap = gapBetween(self, foe);
  const toward = self.facing;

  if (foe.state === "attack" && gap < 34 && Math.random() < 0.55) {
    return { walk: 0, block: true, attack: null };
  }

  if (gap > ATTACKS.high.range - 2) {
    return { walk: toward, block: false, attack: null };
  }

  const roll = Math.random();
  if (roll < 0.045) {
    return {
      walk: 0,
      block: false,
      attack: gap > ATTACKS.high.range - 6 ? "low" : "high",
    };
  }
  if (roll < 0.065) {
    return { walk: 0, block: true, attack: null };
  }
  if (roll < 0.095) {
    return { walk: -toward, block: false, attack: null };
  }
  return IDLE_INTENT;
}
