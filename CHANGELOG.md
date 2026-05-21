# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

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
