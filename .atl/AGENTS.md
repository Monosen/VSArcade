# VSArcade — Agent Instructions

> **Package manager:** pnpm (never npm or bun)
> **Language:** TypeScript (strict mode)
> **Build:** esbuild via `node esbuild.js`
> **Target:** VS Code Extension API (WebviewViewProvider + WebviewPanel + Canvas 2D)

---

## 1. Project Overview

VSArcade is a VS Code extension that embeds Game Boy-style arcade games inside the editor. Games run in a sidebar webview (Activity Bar) or fullscreen panel. The first game is a Tetris clone ("Falling Blocks") with classic Game Boy rules.

No sound. No levels. Colored pieces. Global high scores.

---

## 2. Technology Stack

| Layer | Tool |
|-------|------|
| Language | TypeScript 5.3+ (strict) |
| Bundler | esbuild |
| API | VS Code Extension API |
| Rendering | HTML5 Canvas 2D (160x144 logical, scaled) |
| Game loop | `requestAnimationFrame` with fixed timestep |
| Package manager | **pnpm** |
| Testing | VS Code Test CLI + Mocha (to be added) |

---

## 3. File Structure

```
VSArcade/
├── .vscode/              # Debug configs
├── .atl/                 # Agent instructions (this dir)
├── media/
│   ├── arcade-icon.svg   # Activity bar icon (monochrome)
│   └── main.css          # Webview theme styles
├── src/
│   ├── extension.ts      # Entry point
│   ├── constants.ts      # IDs, colors
│   ├── types/
│   │   └── game.d.ts     # IGameEngine contract
│   ├── core/
│   │   ├── GameManager.ts         # Game registry & state
│   │   ├── ArcadeViewProvider.ts  # Sidebar webview
│   │   └── FullscreenPanel.ts     # Center panel webview
│   ├── input/
│   │   └── InputHandler.ts        # Keyboard input forwarding
│   ├── games/
│   │   └── tetris/
│   │       ├── TetrisGame.ts      # Game logic
│   │       ├── TetrisRenderer.ts  # Canvas rendering
│   │       ├── TetrisAI.ts        # Auto-play mode
│   │       ├── constants.ts       # Board dims, pieces, colors
│   │       └── types.ts           # Tetris-specific types
│   └── utils/
│       └── canvas.ts      # Canvas scaling helpers
├── package.json
├── tsconfig.json
├── esbuild.js
└── README.md
```

---

## 4. Commands

```bash
# Install dependencies
pnpm install

# Development build (watch mode)
pnpm run watch

# Production build
pnpm run compile

# Launch Extension Development Host
# Press F5 in VS Code (uses .vscode/launch.json)
```

**Do NOT use `npm` or `bun` for any of these.**

---

## 5. Coding Standards

### TypeScript
- Strict mode enabled. Zero `any` without explicit `@ts-ignore` + comment.
- Use `readonly` for immutable properties.
- Prefer interfaces over types for contracts.
- Naming: `PascalCase` classes/interfaces, `camelCase` functions/variables, `UPPER_SNAKE_CASE` constants.

### Game Engine Contract
Any new game MUST implement `IGameEngine` (see `src/types/game.d.ts`):

```typescript
interface IGameEngine {
  readonly id: string;      // kebab-case unique ID
  readonly name: string;    // Display name
  readonly version: string;
  init(canvas: HTMLCanvasElement, options: GameOptions): void;
  dispose(): void;
  update(deltaTime: number): void;
  render(): void;
  handleInput(key: string, isPressed: boolean): void;
  setAutoPlay(enabled: boolean): void;
  setPaused(paused: boolean): void;
  getState(): GameStateSnapshot;
  loadState(state: GameStateSnapshot): void;
}
```

### Webview
- Canvas logical size: 160x144 (Game Boy aspect ratio).
- Scale proportionally to container using `utils/canvas.ts` helpers.
- Background adapts to VS Code theme via CSS variables (`--vscode-editor-background`).
- Game pieces use FIXED classic colors (cyan, yellow, purple, green, red, blue, orange).

### Input
- Arrow keys: move piece.
- Space / ArrowUp: rotate.
- ArrowDown: soft drop.
- P: pause.
- Prevent default for game keys so editor doesn't steal focus.

---

## 6. Architecture Rules

1. **Game logic is separate from rendering.** `TetrisGame.ts` handles state; `TetrisRenderer.ts` draws it.
2. **GameManager is the single source of truth** for active game, auto-play state, and pause state.
3. **ArcadeViewProvider and FullscreenPanel share HTML generation** via exported `generateWebviewHtml()`.
4. **Input flows webview → extension host → game engine** via `postMessage`.
5. **Canvas sizing is dynamic** but logical resolution is fixed at 160x144.

---

## 7. Prohibitions (NEVER)

- **Never import from `vscode` package.** It's externalized by esbuild. Use `@types/vscode` only.
- **Never edit `node_modules/` or `out/` directly.** Both are generated.
- **Never use `npm` or `bun`.** Always `pnpm`.
- **Never add sound.** The project is explicitly soundless.
- **Never use Game Boy original sprites or assets.** All graphics must be original code-drawn.
- **Never use the trademark "Tetris" in user-facing strings.** Use "Falling Blocks" internally.
- **Never store secrets or API keys in source.** This is a local extension with no network calls.
- **Never commit `.vscode-test/` or `out/` to git.**

---

## 8. Common Pitfalls

1. **Webview CSP:** The Content-Security-Policy must allow `unsafe-inline` for scripts since we inline the game bundle. If adding external scripts, update CSP in `ArcadeViewProvider.ts`.
2. **Canvas context loss:** On theme change or panel switch, canvas context may be lost. Always re-query `getContext('2d')` after major DOM changes.
3. **VS Code API version:** `@types/vscode` must match `engines.vscode` in `package.json`. Mismatches cause runtime errors.
4. **esbuild external:** `vscode` must be in `external` array. Forgetting this causes bundle errors.
5. **Theme detection:** Use `document.body.classList.contains('vscode-dark')` in webview, not just media queries. VS Code themes don't always match OS preference.
6. **Game loop on hidden:** When webview is hidden (sidebar collapsed), `requestAnimationFrame` pauses. Use `retainContextWhenHidden: true` but be aware state may desync if game logic depends on delta time accumulation.

---

## 9. Adding a New Game

1. Create folder `src/games/{gameId}/`.
2. Implement `IGameEngine` in `{GameName}Game.ts`.
3. Create `{GameName}Renderer.ts` for canvas drawing.
4. Add constants and types files.
5. Register in `extension.ts`: `gameManager.registerGame(new NewGame())`.

Reference implementation: `src/games/tetris/`.

---

## 10. Tetris Specific Rules

- Board: 10 columns × 20 rows.
- 7 pieces (I, J, L, O, S, T, Z) with their classic shapes.
- Rotation: Game Boy original (no wall kicks). If rotation collides, do nothing.
- Scoring: 40/100/300/1200 points for 1/2/3/4 lines.
- No level progression. Fall speed is constant (~800ms per cell).
- Next piece preview visible at all times.
- Game Over when new piece cannot spawn.
- Auto-play mode: simple random moves with automatic restart on game over.

---

## 11. Verification Checklist

Before claiming a task is complete:

- [ ] `pnpm run compile` succeeds with zero errors.
- [ ] `tsc --noEmit` passes (type check).
- [ ] Extension launches with F5 and sidebar view appears.
- [ ] Game canvas renders at correct aspect ratio.
- [ ] Keyboard input works without editor interference.
- [ ] No `any` types introduced.

---

## 12. References

- [VS Code Extension API Docs](https://code.visualstudio.com/api)
- [Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [Game Boy Programming Manual](https://archive.org/download/GameBoyProgManVer1.1/GameBoyProgManVer1.1.pdf) — for authentic feel
- Tetris mechanics reference: [Hard Drop Wiki](https://harddrop.com/wiki/Tetris_(Game_Boy))
