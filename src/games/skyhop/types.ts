// VSArcade Skyhop — Types

export interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

export interface SkyhopSnapshot {
  birdY: number;
  birdVel: number;
  pipes: Pipe[];
  score: number;
  started: boolean;
  gameOver: boolean;
}
