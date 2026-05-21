// VSArcade Duel — Constants

import type { AttackKind } from "./types";

export const CANVAS_W = 160;
export const CANVAS_H = 144;
export const GROUND_Y = 122;

export const FIGHTER_W = 18;
export const FIGHTER_H = 44;
export const WALK_SPEED = 0.052;

export const MAX_HEALTH = 100;
export const HURT_DURATION = 280;

export const PLAYER_START_X = 34;
export const OPPONENT_START_X = 108;

export interface AttackProfile {
  range: number;
  damage: number;
  activeAt: number;
  duration: number;
}

export const ATTACKS: Record<AttackKind, AttackProfile> = {
  high: { range: 24, damage: 15, activeAt: 120, duration: 340 },
  low: { range: 32, damage: 9, activeAt: 175, duration: 430 },
};

export const COLOR_BG = "#1b1430";
export const COLOR_GROUND = "#3a2d1a";
export const COLOR_PLAYER = "#00d4ff";
export const COLOR_OPPONENT = "#ff3b3b";
export const COLOR_HURT = "#f5f5f5";
export const COLOR_HEALTH_BG = "#3a3358";
export const COLOR_HEALTH_PLAYER = "#00ff6a";
export const COLOR_HEALTH_OPPONENT = "#ff8c00";
