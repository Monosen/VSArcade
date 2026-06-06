# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [0.0.2] - 2026-06-06

### Added
- **Victory screen** — games that can be won now show a distinct "You Win!" overlay with gold text, green accent, and pixel-cross decorations instead of the generic Game Over screen. Applies to Duel, Invaders, Twos, Brickout, DotChase, and MineHunt.
- `isWon(): boolean` method added to the `Game` interface; all ten games implement it.

### Changed
- **README** — redesigned with `for-the-badge` style shields, a directory-tree project structure, and cleaner section layout.
- **AI — Duel** — separated player auto-play AI (`decidePlayerAutoIntent`) from the opponent AI. Player now blocks 82 % of incoming attacks and attacks 22 % of frames in range, with a 75 % attack rate when the opponent is in the `hurt` state.
- **AI — Invaders** — targets the alien in the lowest (most dangerous) row first instead of the nearest column by X distance; also dodges incoming bombs by moving toward the larger side gap.
- **AI — Pong** — replaced simple ball-center tracking with a predictive model that computes the exact landing position of the ball at the player paddle, accounting for wall bounces. Player paddle speed (0.115) exceeds the opponent (0.082), so perfect prediction wins consistently.
- **AI — Skyhop** — replaced the fixed velocity threshold with a 220 ms lookahead that predicts the bird's future position using gravity and current velocity, eliminating premature and late flaps.
- **AI — Twos** — upgraded from a 1-ply snake-weight heuristic to a 2-ply expectimax search that samples random tile placements and evaluates the best follow-up move, significantly improving the rate of reaching the 2048 tile.
- **AI — DotChase** — actively chases frightened ghosts when the frighten timer is above 400 ms; heads straight for the nearest power pellet (ignoring danger) when two or more non-frightened ghosts are within four tiles.
- **AI — MineHunt** — replaced random guessing with a probability model: each hidden cell is assigned a mine probability derived from local constraint averaging and a global mine-density fallback; the cell with the lowest probability is always chosen.
- **AI — Snakey** — full rewrite with BFS path-to-food safety validation and tail-chase fallback:
  - Before eating, simulates the body state after traversing the full path (accounting for tail cells that will have freed up) and verifies the snake can still reach its own tail.
  - When the food path is unsafe or unreachable, chases the snake's own tail, which always recedes at the same speed, creating a safe indefinite loop.
  - Flood-fill survival direction used only as a last resort.

### Fixed
- **Pause sync** — pausing from the fullscreen panel now correctly shows the "Paused" overlay in the sidebar view as well, and vice versa. Both surfaces now receive `pauseChanged` via a shared `syncPause` broadcast callback.
- **Fullscreen buttons disabled** — pause and auto-play buttons in the fullscreen panel were always disabled on open because `ArcadeViewProvider` called `vscode.commands.executeCommand` (async) for the fullscreen toggle, creating a race where `webviewReady` could fire before `activeSurface` was set to `"fullscreen"`. Fixed by replacing the async command dispatch with a direct synchronous `onToggleFullscreen` callback.
- **Fullscreen buttons disabled after game change** — selecting a new game while in the fullscreen panel disabled its pause and auto-play buttons. Root cause was two-fold: `GameManager.selectGame` internally reset `activeSurface` to `"sidebar"`, and the `wasFullscreen` guard was evaluated after that reset so it was always `false`. Fixed by removing the surface side-effect from `selectGame` and moving the guard before the call.

## [0.0.1] - 2026-05-21

### Added
- Initial VS Code extension scaffold for VSArcade.
- Sidebar webview arcade surface inside the Explorer.
- Fullscreen game panel command and shared webview runtime.
- Auto-play toggle and theme-aware UI styling.
- Ten playable games shipped in the initial release:
  - Falling Blocks — falling-block stacking puzzle.
  - Snakey — classic grid snake.
  - Twos — 2048-style sliding number-merge puzzle.
  - MineHunt — Minesweeper-style mine-clearing grid.
  - Pong — two-paddle table-tennis duel.
  - Brickout — Breakout-style brick breaker.
  - Skyhop — flap-through-the-gaps endless flyer.
  - DotChase — maze chase with pellets and ghosts.
  - Invaders — fixed shooter against descending alien waves.
  - Duel — one-on-one fighting match.

### Changed
- Synced runtime state between sidebar and fullscreen surfaces.
- Improved low-resolution HUD text rendering with bitmap text.

### Fixed
- Corrected clipped HUD labels in the sidebar canvas.
- Fixed missing bitmap glyphs and wrapped intro overlay text.
