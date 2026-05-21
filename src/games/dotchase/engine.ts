// VSArcade DotChase — Pure game logic

import {
  CHASE_MS,
  CLYDE_RANGE,
  COLS,
  FRIGHTENED_MS,
  GHOST_KINDS,
  GHOST_SCORE,
  GHOST_SPAWNS,
  PAC_SPAWN,
  PELLET_SCORE,
  POWER_CELLS,
  POWER_SCORE,
  ROWS,
  SCATTER_CORNERS,
  SCATTER_MS,
  START_LIVES,
  STEP_MS,
} from "./constants";
import { isWall } from "./maze";
import {
  ALL_DIRS,
  DIR_VECTORS,
  REVERSE,
  type Dir,
  type DotChaseSnapshot,
  type Ghost,
  type GhostKind,
  type Mode,
  type Vec,
} from "./types";

function distanceSq(a: Vec, b: Vec): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export class DotChaseEngine {
  pac: Vec = { ...PAC_SPAWN };
  pacDir: Dir = "left";
  ghosts: Ghost[] = [];
  pellets: boolean[][] = [];
  power: boolean[][] = [];
  score = 0;
  lives = START_LIVES;
  mode: Mode = "scatter";
  modeTimer = 0;
  frightenedTimer = 0;
  gameOver = false;
  won = false;

  private desiredDir: Dir = "left";
  private moveAccumulator = 0;
  private pelletsLeft = 0;

  reset(): void {
    this.pellets = [];
    this.power = [];
    this.pelletsLeft = 0;

    const powerSet = new Set(POWER_CELLS.map((c) => `${c.x},${c.y}`));
    const blocked = new Set<string>([`${PAC_SPAWN.x},${PAC_SPAWN.y}`]);
    for (const kind of GHOST_KINDS) {
      blocked.add(`${GHOST_SPAWNS[kind].x},${GHOST_SPAWNS[kind].y}`);
    }

    for (let y = 0; y < ROWS; y += 1) {
      const pelletRow: boolean[] = [];
      const powerRow: boolean[] = [];
      for (let x = 0; x < COLS; x += 1) {
        const key = `${x},${y}`;
        const open = !isWall(x, y) && !blocked.has(key);
        if (open && powerSet.has(key)) {
          pelletRow.push(false);
          powerRow.push(true);
          this.pelletsLeft += 1;
        } else if (open) {
          pelletRow.push(true);
          powerRow.push(false);
          this.pelletsLeft += 1;
        } else {
          pelletRow.push(false);
          powerRow.push(false);
        }
      }
      this.pellets.push(pelletRow);
      this.power.push(powerRow);
    }

    this.score = 0;
    this.lives = START_LIVES;
    this.mode = "scatter";
    this.modeTimer = 0;
    this.frightenedTimer = 0;
    this.gameOver = false;
    this.won = false;
    this.resetActors();
  }

  setDesiredDir(dir: Dir): void {
    this.desiredDir = dir;
  }

  update(dt: number): void {
    if (this.gameOver) {
      return;
    }
    this.advanceTimers(dt);
    this.moveAccumulator += dt;
    while (this.moveAccumulator >= STEP_MS && !this.gameOver) {
      this.moveAccumulator -= STEP_MS;
      this.tick();
    }
  }

  getSnapshot(): DotChaseSnapshot {
    return {
      pac: { ...this.pac },
      pacDir: this.pacDir,
      ghosts: this.ghosts.map((g) => ({ ...g })),
      pellets: this.pellets.map((row) => row.slice()),
      power: this.power.map((row) => row.slice()),
      score: this.score,
      lives: this.lives,
      mode: this.mode,
      modeTimer: this.modeTimer,
      frightenedTimer: this.frightenedTimer,
      gameOver: this.gameOver,
      won: this.won,
    };
  }

  applySnapshot(s: DotChaseSnapshot): void {
    this.pac = { ...s.pac };
    this.pacDir = s.pacDir;
    this.desiredDir = s.pacDir;
    this.ghosts = s.ghosts.map((g) => ({ ...g }));
    this.pellets = s.pellets.map((row) => row.slice());
    this.power = s.power.map((row) => row.slice());
    this.score = s.score;
    this.lives = s.lives;
    this.mode = s.mode;
    this.modeTimer = s.modeTimer;
    this.frightenedTimer = s.frightenedTimer;
    this.gameOver = s.gameOver;
    this.won = s.won;
    this.pelletsLeft = 0;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (this.pellets[y][x] || this.power[y][x]) {
          this.pelletsLeft += 1;
        }
      }
    }
  }

  private advanceTimers(dt: number): void {
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.frightenedTimer = 0;
        for (const ghost of this.ghosts) {
          ghost.frightened = false;
        }
      }
      return;
    }
    this.modeTimer += dt;
    const limit = this.mode === "scatter" ? SCATTER_MS : CHASE_MS;
    if (this.modeTimer >= limit) {
      this.modeTimer = 0;
      this.mode = this.mode === "scatter" ? "chase" : "scatter";
    }
  }

  private tick(): void {
    this.movePacman();
    if (this.resolveCollisions()) {
      return;
    }
    this.eatPellet();
    this.moveGhosts();
    if (this.resolveCollisions()) {
      return;
    }
    if (this.pelletsLeft === 0) {
      this.won = true;
      this.gameOver = true;
    }
  }

  private movePacman(): void {
    const desired = DIR_VECTORS[this.desiredDir];
    if (!isWall(this.pac.x + desired.x, this.pac.y + desired.y)) {
      this.pacDir = this.desiredDir;
    }
    const vec = DIR_VECTORS[this.pacDir];
    if (!isWall(this.pac.x + vec.x, this.pac.y + vec.y)) {
      this.pac = { x: this.pac.x + vec.x, y: this.pac.y + vec.y };
    }
  }

  private eatPellet(): void {
    if (this.pellets[this.pac.y][this.pac.x]) {
      this.pellets[this.pac.y][this.pac.x] = false;
      this.score += PELLET_SCORE;
      this.pelletsLeft -= 1;
    } else if (this.power[this.pac.y][this.pac.x]) {
      this.power[this.pac.y][this.pac.x] = false;
      this.score += POWER_SCORE;
      this.pelletsLeft -= 1;
      this.frightenedTimer = FRIGHTENED_MS;
      this.modeTimer = 0;
      for (const ghost of this.ghosts) {
        ghost.frightened = true;
      }
    }
  }

  private moveGhosts(): void {
    for (const ghost of this.ghosts) {
      const dir = ghost.frightened
        ? this.pickFrightenedDir(ghost)
        : this.pickChaseDir(ghost);
      const vec = DIR_VECTORS[dir];
      ghost.dir = dir;
      ghost.x += vec.x;
      ghost.y += vec.y;
    }
  }

  private candidateDirs(ghost: Ghost): Dir[] {
    const reverse = REVERSE[ghost.dir];
    const open = ALL_DIRS.filter((dir) => {
      if (dir === reverse) {
        return false;
      }
      const vec = DIR_VECTORS[dir];
      return !isWall(ghost.x + vec.x, ghost.y + vec.y);
    });
    if (open.length > 0) {
      return open;
    }
    return [reverse];
  }

  private pickFrightenedDir(ghost: Ghost): Dir {
    const options = this.candidateDirs(ghost);
    return options[Math.floor(Math.random() * options.length)];
  }

  private pickChaseDir(ghost: Ghost): Dir {
    const target = this.targetFor(ghost);
    const options = this.candidateDirs(ghost);
    let best = options[0];
    let bestDist = Infinity;
    for (const dir of options) {
      const vec = DIR_VECTORS[dir];
      const next = { x: ghost.x + vec.x, y: ghost.y + vec.y };
      const dist = distanceSq(next, target);
      if (dist < bestDist) {
        bestDist = dist;
        best = dir;
      }
    }
    return best;
  }

  private targetFor(ghost: Ghost): Vec {
    if (this.mode === "scatter") {
      return SCATTER_CORNERS[ghost.kind];
    }
    const ahead = (steps: number): Vec => {
      const vec = DIR_VECTORS[this.pacDir];
      return { x: this.pac.x + vec.x * steps, y: this.pac.y + vec.y * steps };
    };
    switch (ghost.kind) {
      case "blinky":
        return { ...this.pac };
      case "pinky":
        return ahead(4);
      case "inky": {
        const pivot = ahead(2);
        const blinky = this.ghostOf("blinky");
        return { x: pivot.x * 2 - blinky.x, y: pivot.y * 2 - blinky.y };
      }
      case "clyde":
      default:
        return distanceSq(ghost, this.pac) > CLYDE_RANGE * CLYDE_RANGE
          ? { ...this.pac }
          : SCATTER_CORNERS.clyde;
    }
  }

  private ghostOf(kind: GhostKind): Ghost {
    return this.ghosts.find((g) => g.kind === kind) ?? this.ghosts[0];
  }

  private resolveCollisions(): boolean {
    for (const ghost of this.ghosts) {
      if (ghost.x !== this.pac.x || ghost.y !== this.pac.y) {
        continue;
      }
      if (ghost.frightened) {
        this.score += GHOST_SCORE;
        const spawn = GHOST_SPAWNS[ghost.kind];
        ghost.x = spawn.x;
        ghost.y = spawn.y;
        ghost.frightened = false;
        continue;
      }
      this.lives -= 1;
      if (this.lives <= 0) {
        this.gameOver = true;
      } else {
        this.resetActors();
      }
      return true;
    }
    return false;
  }

  private resetActors(): void {
    this.pac = { ...PAC_SPAWN };
    this.pacDir = "left";
    this.desiredDir = "left";
    this.moveAccumulator = 0;
    this.frightenedTimer = 0;
    this.ghosts = GHOST_KINDS.map((kind) => ({
      kind,
      x: GHOST_SPAWNS[kind].x,
      y: GHOST_SPAWNS[kind].y,
      dir: "left" as Dir,
      frightened: false,
    }));
  }
}
