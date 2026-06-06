// VSArcade Duel — Fighter AI

import { ATTACKS, FIGHTER_W } from "./constants";
import type { Fighter, FighterIntent } from "./types";

const IDLE_INTENT: FighterIntent = { walk: 0, block: false, attack: null };

function gapBetween(self: Fighter, foe: Fighter): number {
  return self.facing === 1
    ? foe.x - (self.x + FIGHTER_W)
    : self.x - (foe.x + FIGHTER_W);
}

/** Used by the engine for the opponent — balanced, beatable. */
export function decideFighterIntent(self: Fighter, foe: Fighter): FighterIntent {
  if (self.state !== "idle" && self.state !== "walk" && self.state !== "block") {
    return IDLE_INTENT;
  }

  const gap = gapBetween(self, foe);
  const toward = self.facing;

  if (foe.state === "attack" && gap < 34 && Math.random() < 0.45) {
    return { walk: 0, block: true, attack: null };
  }

  if (gap > ATTACKS.high.range - 2) {
    return { walk: toward, block: false, attack: null };
  }

  const roll = Math.random();
  if (roll < 0.04) {
    return { walk: 0, block: false, attack: gap > ATTACKS.high.range - 6 ? "low" : "high" };
  }
  if (roll < 0.06) {
    return { walk: 0, block: true, attack: null };
  }
  if (roll < 0.09) {
    return { walk: -toward, block: false, attack: null };
  }
  return IDLE_INTENT;
}

/** Used for auto-play player — aggressive and strategic. */
export function decidePlayerAutoIntent(self: Fighter, foe: Fighter): FighterIntent {
  if (self.state !== "idle" && self.state !== "walk" && self.state !== "block") {
    return IDLE_INTENT;
  }

  const gap = gapBetween(self, foe);
  const toward = self.facing;

  // Block reliably when foe is mid-attack and in range
  if (foe.state === "attack") {
    const foeProfile = ATTACKS[foe.attackKind ?? "high"];
    const foeGap = gapBetween(foe, self);
    if (foeGap <= foeProfile.range + 6 && Math.random() < 0.82) {
      return { walk: 0, block: true, attack: null };
    }
  }

  // Close the gap aggressively
  if (gap > ATTACKS.high.range + 2) {
    return { walk: toward, block: false, attack: null };
  }

  // Foe is hurt → attack immediately (can't block while hurt)
  if (foe.state === "hurt" && Math.random() < 0.75) {
    return { walk: 0, block: false, attack: "high" };
  }

  // In range → attack with high probability
  if (gap >= 0) {
    const roll = Math.random();
    if (roll < 0.22) {
      return { walk: 0, block: false, attack: gap > ATTACKS.high.range - 5 ? "low" : "high" };
    }
    if (roll < 0.26) {
      return { walk: 0, block: true, attack: null };
    }
    // Maintain optimal range
    return { walk: toward, block: false, attack: null };
  }

  // Foe overlapping → step back to optimal attack range
  return { walk: -toward, block: false, attack: null };
}
