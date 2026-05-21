// VSArcade Invaders — Types

export interface Vec {
  x: number;
  y: number;
}

export interface InvadersSnapshot {
  shipX: number;
  bullets: Vec[];
  bombs: Vec[];
  aliens: boolean[][];
  formationX: number;
  formationY: number;
  alienDir: number;
  score: number;
  lives: number;
  gameOver: boolean;
  won: boolean;
}
