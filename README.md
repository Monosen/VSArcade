# VSArcade

Retro arcade games inside VS Code, built with a Game Boy-inspired visual style and a shared webview runtime.

VSArcade turns the Explorer sidebar into a tiny arcade cabinet: pick a game, play it in-place, switch to fullscreen when you want more room, or let auto-play take over for passive fun while you work.

## Why VSArcade

- Play directly inside the VS Code sidebar
- Keep a shared runtime for multiple games instead of rebuilding the shell for each one
- Open the active game in fullscreen without losing state
- Reuse the same message bus, pixel text helpers, and canvas runtime across games

## Current Games

| Game | In-extension name | Notes |
|------|-------------------|-------|
| Falling Blocks | `Falling Blocks` | Classic falling-block puzzle gameplay |
| Snake | `Snakey` | Arcade snake with the shared runtime model |
| Twos | `Twos` | 2048-style number merging game |

## Quick Start

1. Open the `VSArcade` view from the Explorer sidebar.
2. Run `VSArcade: Select Game` from the Command Palette.
3. Choose a game from the registered list.
4. Use `VSArcade: Toggle Fullscreen` if you want the active game in the editor area.

## Commands

| Command | What it does |
|---------|---------------|
| `VSArcade: Select Game` | Opens the game picker and switches the active game |
| `VSArcade: Toggle Fullscreen` | Moves the current game into a fullscreen webview panel |
| `VSArcade: Toggle Auto Play` | Turns AI or automated play on and off for supported games |

## Feature Overview

| Area | Details |
|------|---------|
| Sidebar play | Runs in a dedicated webview view inside Explorer |
| Fullscreen mode | Uses a centered `WebviewPanel` and keeps runtime state in sync |
| Shared runtime | One browser-side runtime loads the selected game bundle dynamically |
| Theme awareness | Adapts shell styling to VS Code dark and light themes |
| Retro rendering | Pixel-font helpers and canvas-first rendering keep the arcade feel consistent |

## Development

```bash
npm install
npm run watch
npm run compile
```

Press `F5` to open an Extension Development Host and test the extension locally.

## Project Shape

| Path | Responsibility |
|------|----------------|
| `src/extension.ts` | Registers commands, views, and available games |
| `src/core/GameManager.ts` | Tracks active game selection, runtime snapshot, and surface ownership |
| `src/core/ArcadeViewProvider.ts` | Builds the sidebar webview shell |
| `src/core/FullscreenPanel.ts` | Hosts the fullscreen version of the active game |
| `src/webview/runtime.ts` | Shared browser-side runtime and message bus |
| `src/webview/text.ts` | Shared pixel text measurement and drawing helpers |
| `src/games/*` | Individual game descriptors, engines, renderers, and webview entries |

## Architecture Notes

- The extension host does not run game logic directly.
- Each game is registered through an `IGameDescriptor` with its own webview entry bundle.
- The shared runtime handles input wiring, render loop, state sync, and shell controls.
- Sidebar and fullscreen surfaces stay synchronized through host-managed snapshots.

## Status

VSArcade is still early-stage and actively evolving. The runtime model is already structured for adding more games without rewriting the shell.

## License

MIT
