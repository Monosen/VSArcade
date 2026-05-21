// VSArcade Pong — Types

export interface PongSnapshot {
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  playerY: number;
  opponentY: number;
  playerScore: number;
  opponentScore: number;
  gameOver: boolean;
}
