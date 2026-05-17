// ---------------------------------------------------------------
// VSArcade — Extension Entry Point
// ---------------------------------------------------------------

import * as vscode from "vscode";
import { COMMAND_IDS, VIEW_IDS, GAME_IDS } from "./constants";
import { GameManager } from "./core/GameManager";
import { ArcadeViewProvider } from "./core/ArcadeViewProvider";
import { FullscreenPanel } from "./core/FullscreenPanel";
import { InputHandler } from "./input/InputHandler";
import { TetrisGame } from "./games/tetris/TetrisGame";

let gameManager: GameManager;
let sidebarProvider: ArcadeViewProvider;
let inputHandler: InputHandler;

export function activate(context: vscode.ExtensionContext): void {
  // --- Game Manager ---
  gameManager = new GameManager();

  // Register the Tetris game engine
  const tetris = new TetrisGame();
  gameManager.registerGame(tetris);

  // --- Theme detection ---
  const currentTheme = vscode.window.activeColorTheme;
  gameManager.setTheme(
    currentTheme.kind === vscode.ColorThemeKind.Dark ? "dark" : "light"
  );

  // --- Sidebar View Provider ---
  sidebarProvider = new ArcadeViewProvider(context.extensionUri, gameManager);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      VIEW_IDS.SIDEBAR,
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // --- Input Handler ---
  inputHandler = new InputHandler(gameManager);
  inputHandler.registerCommands(context);

  // --- Commands ---
  const selectGameCommand = vscode.commands.registerCommand(
    COMMAND_IDS.SELECT_GAME,
    async () => {
      const games = gameManager.getRegisteredGames();
      const items = games.map((g) => ({
        label: g.name,
        description: `v${g.version}`,
        detail: g.id,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a game to play",
        title: "VSArcade — Select Game",
      });

      if (selected) {
        const engine = gameManager.selectGame(selected.detail);
        if (engine) {
          sidebarProvider.refresh();
          sidebarProvider.postMessage({
            type: "gameSelected",
            id: engine.id,
            name: engine.name,
          });
          await vscode.commands.executeCommand("workbench.view.explorer");
          await vscode.commands.executeCommand(`${VIEW_IDS.SIDEBAR}.focus`);
          vscode.window.showInformationMessage(
            `VSArcade: Now playing ${engine.name}`
          );
        }
      }
    }
  );

  const toggleFullscreenCommand = vscode.commands.registerCommand(
    COMMAND_IDS.TOGGLE_FULLSCREEN,
    () => {
      const activeGame = gameManager.getActiveGame();
      if (!activeGame) {
        vscode.window.showWarningMessage(
          "VSArcade: No game selected. Use 'Select Game' first."
        );
        return;
      }
      FullscreenPanel.createOrShow(context.extensionUri, gameManager);
    }
  );

  const toggleAutoPlayCommand = vscode.commands.registerCommand(
    COMMAND_IDS.TOGGLE_AUTO_PLAY,
    () => {
      const activeGame = gameManager.getActiveGame();
      if (!activeGame) {
        vscode.window.showWarningMessage(
          "VSArcade: No game selected. Use 'Select Game' first."
        );
        return;
      }
      const enabled = gameManager.toggleAutoPlay();
      sidebarProvider.postMessage({
        type: "autoPlayChanged",
        enabled,
      });
      vscode.window.showInformationMessage(
        `VSArcade: Auto-play ${enabled ? "enabled" : "disabled"}`
      );
    }
  );

  // Listen for theme changes
  const themeChangeListener = vscode.window.onDidChangeActiveColorTheme(
    (theme) => {
      gameManager.setTheme(
        theme.kind === vscode.ColorThemeKind.Dark ? "dark" : "light"
      );
    }
  );

  context.subscriptions.push(
    selectGameCommand,
    toggleFullscreenCommand,
    toggleAutoPlayCommand,
    themeChangeListener,
    sidebarProvider,
    inputHandler
  );
}

export function deactivate(): void {
  gameManager.dispose();
}
