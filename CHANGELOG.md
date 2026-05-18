# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [0.0.1] - 2026-05-17

### Added
- Initial VS Code extension scaffold for VSArcade.
- Sidebar webview for the arcade surface.
- Fullscreen game panel command and shared webview runtime.
- Falling Blocks as the first playable game.
- Auto-play toggle and theme-aware UI styling.

### Changed
- Synced runtime state between sidebar and fullscreen surfaces.
- Improved low-resolution HUD text rendering with bitmap text.

### Fixed
- Corrected clipped HUD labels in the sidebar canvas.
- Fixed missing bitmap glyphs and wrapped intro overlay text.
