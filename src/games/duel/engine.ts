// VSArcade Duel — Pure game logic

import {
  ATTACKS,
  CANVAS_W,
  FIGHTER_W,
  HURT_DURATION,
  MAX_HEALTH,
  OPPONENT_START_X,
  PLAYER_START_X,
  WALK_SPEED,
} from "./constants";
import { decideFighterIntent } from "./ai";
import type { DuelSnapshot, Fighter, FighterIntent } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createFighter(x: number): Fighter {
  return {
    x,
    health: MAX_HEALTH,
    facing: 1,
    state: "idle",
    stateTimer: 0,
    attackKind: null,
    hitDone: false,
  };
}

function isActionable(fighter: Fighter): boolean {
  return fighter.state === "idle" || fighter.state === "walk" || fighter.state === "block";
}

/** Horizontal gap between an attacker's front and the foe's body. */
export function fighterGap(attacker: Fighter, foe: Fighter): number {
  return attacker.facing === 1
    ? foe.x - (attacker.x + FIGHTER_W)
    : attacker.x - (foe.x + FIGHTER_W);
}

export class DuelEngine {
  player: Fighter = createFighter(PLAYER_START_X);
  opponent: Fighter = createFighter(OPPONENT_START_X);
  gameOver = false;
  won = false;

  reset(): void {
    this.player = createFighter(PLAYER_START_X);
    this.opponent = createFighter(OPPONENT_START_X);
    this.gameOver = false;
    this.won = false;
  }

  update(dt: number, playerIntent: FighterIntent): void {
    if (this.gameOver) {
      return;
    }
    const opponentIntent = decideFighterIntent(this.opponent, this.player);
    this.updateFighter(this.player, this.opponent, playerIntent, dt);
    this.updateFighter(this.opponent, this.player, opponentIntent, dt);
  }

  getSnapshot(): DuelSnapshot {
    return {
      player: { ...this.player },
      opponent: { ...this.opponent },
      gameOver: this.gameOver,
      won: this.won,
    };
  }

  applySnapshot(s: DuelSnapshot): void {
    this.player = { ...s.player };
    this.opponent = { ...s.opponent };
    this.gameOver = s.gameOver;
    this.won = s.won;
  }

  private updateFighter(self: Fighter, foe: Fighter, intent: FighterIntent, dt: number): void {
    self.facing = self.x <= foe.x ? 1 : -1;
    if (self.state === "ko") {
      return;
    }
    self.stateTimer += dt;

    if (self.state === "hurt") {
      if (self.stateTimer >= HURT_DURATION) {
        self.state = "idle";
        self.stateTimer = 0;
      }
      return;
    }

    if (self.state === "attack") {
      const profile = ATTACKS[self.attackKind ?? "high"];
      if (!self.hitDone && self.stateTimer >= profile.activeAt) {
        self.hitDone = true;
        this.applyHit(self, foe);
      }
      if (self.stateTimer >= profile.duration) {
        self.state = "idle";
        self.stateTimer = 0;
        self.attackKind = null;
      }
      return;
    }

    if (!isActionable(self)) {
      return;
    }

    if (intent.attack) {
      self.state = "attack";
      self.attackKind = intent.attack;
      self.stateTimer = 0;
      self.hitDone = false;
      return;
    }
    if (intent.block) {
      if (self.state !== "block") {
        self.state = "block";
        self.stateTimer = 0;
      }
      return;
    }
    if (intent.walk !== 0) {
      self.state = "walk";
      let nx = clamp(self.x + intent.walk * WALK_SPEED * dt, 0, CANVAS_W - FIGHTER_W);
      if (self.facing === 1) {
        nx = Math.min(nx, foe.x - FIGHTER_W);
      } else {
        nx = Math.max(nx, foe.x + FIGHTER_W);
      }
      self.x = nx;
      return;
    }
    self.state = "idle";
  }

  private applyHit(attacker: Fighter, defender: Fighter): void {
    const profile = ATTACKS[attacker.attackKind ?? "high"];
    const gap = fighterGap(attacker, defender);
    if (gap > profile.range || gap < -FIGHTER_W || defender.state === "ko") {
      return;
    }
    if (defender.state === "block") {
      return;
    }
    defender.health -= profile.damage;
    defender.state = "hurt";
    defender.stateTimer = 0;
    if (defender.health <= 0) {
      defender.health = 0;
      defender.state = "ko";
      this.gameOver = true;
      this.won = defender === this.opponent;
    }
  }
}
