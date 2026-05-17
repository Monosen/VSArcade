# VSArcade

Game Boy style arcade games inside VS Code.

## Features

- 🎮 Sidebar game panel with Game Boy–style 160×144 canvas
- 🧱 Falling Blocks (Tetris) — the first supported game
- ⛶ Fullscreen mode for immersive play
- 🤖 Auto-play toggle for AI-assisted gameplay
- 🎨 Adapts to VS Code theme (dark/light)

## Getting Started

1. Open the VSArcade sidebar from the Activity Bar
2. Run "VSArcade: Select Game" from the Command Palette
3. Pick **Falling Blocks** to start playing

## Commands

| Command | Description |
|---------|-------------|
| `VSArcade: Select Game` | Pick a game from the registered list |
| `VSArcade: Toggle Fullscreen` | Open or close the fullscreen game panel |
| `VSArcade: Toggle Auto Play` | Enable or disable AI auto-play |

## Development

```bash
pnpm install
pnpm run watch     # Build and watch for changes
pnpm run compile   # One-time build
```

Press F5 to launch the Extension Development Host.

## Architecture

- **GameManager** — tracks registered games and active state
- **ArcadeViewProvider** — sidebar WebviewViewProvider
- **FullscreenPanel** — center column WebviewPanel
- **IGameEngine** — interface all games implement
- **TetrisGame** — Tetris engine (placeholder)
- **TetrisRenderer** — canvas renderer (placeholder)
- **TetrisAI** — auto-play controller (placeholder)

## License

MIT