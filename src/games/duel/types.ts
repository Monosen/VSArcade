// VSArcade Duel — Types

export type FighterState = "idle" | "walk" | "attack" | "block" | "hurt" | "ko";
export type AttackKind = "high" | "low";

export interface Fighter {
  x: number;
  health: number;
  facing: number;
  state: FighterState;
  stateTimer: number;
  attackKind: AttackKind | null;
  hitDone: boolean;
}

export interface FighterIntent {
  walk: number;
  block: boolean;
  attack: AttackKind | null;
}

export interface DuelSnapshot {
  player: Fighter;
  opponent: Fighter;
  gameOver: boolean;
  won: boolean;
}
