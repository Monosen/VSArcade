// VSArcade Brickout — Types

export interface BrickoutSnapshot {
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  paddleX: number;
  bricks: boolean[][];
  score: number;
  lives: number;
  gameOver: boolean;
  won: boolean;
}
