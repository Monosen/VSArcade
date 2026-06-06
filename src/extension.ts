// VSArcade — Extension entry point

import * as vscode from "vscode";
import { COMMAND_IDS, VIEW_IDS } from "./constants";
import { GameManager, RuntimeSnapshot } from "./core/GameManager";
import { ArcadeViewProvider } from "./core/ArcadeViewProvider";
import { FullscreenPanel } from "./core/FullscreenPanel";
import { tetrisDescriptor } from "./games/tetris/descriptor";
import { snakeDescriptor } from "./games/snake/descriptor";
import { twosDescriptor } from "./games/twos/descriptor";
import { mineHuntDescriptor } from "./games/minehunt/descriptor";
import { pongDescriptor } from "./games/pong/descriptor";
import { brickoutDescriptor } from "./games/brickout/descriptor";
import { skyhopDescriptor } from "./games/skyhop/descriptor";
import { dotChaseDescriptor } from "./games/dotchase/descriptor";
import { invadersDescriptor } from "./games/invaders/descriptor";
import { duelDescriptor } from "./games/duel/descriptor";

let gameManager: GameManager;
let sidebarProvider: ArcadeViewProvider;

export function activate(context: vscode.ExtensionContext): void {
  gameManager = new GameManager();
  gameManager.registerGame(tetrisDescriptor);
  gameManager.registerGame(snakeDescriptor);
  gameManager.registerGame(twosDescriptor);
  gameManager.registerGame(mineHuntDescriptor);
  gameManager.registerGame(pongDescriptor);
  gameManager.registerGame(brickoutDescriptor);
  gameManager.registerGame(skyhopDescriptor);
  gameManager.registerGame(dotChaseDescriptor);
  gameManager.registerGame(invadersDescriptor);
  gameManager.registerGame(duelDescriptor);

  const currentTheme = vscode.window.activeColorTheme;
  gameManager.setTheme(
    currentTheme.kind === vscode.ColorThemeKind.Dark ? "dark" : "light",
  );

  const syncRuntimeSnapshot = (
    source: "sidebar" | "fullscreen",
    snapshot: RuntimeSnapshot,
  ): void => {
    gameManager.setRuntimeSnapshot(snapshot);

    const targetMessage = { type: "applySnapshot", snapshot };
    if (source === "sidebar") {
      FullscreenPanel.currentPanel?.postMessage(targetMessage);
      return;
    }
    sidebarProvider.postMessage(targetMessage);
  };

  const syncPause = (paused: boolean): void => {
    const message = { type: "pauseChanged", paused };
    sidebarProvider.postMessage(message);
    FullscreenPanel.currentPanel?.postMessage(message);
  };

  const syncControlTargets = (): void => {
    sidebarProvider.postMessage({
      type: "controlChanged",
      controlled: gameManager.getActiveSurface() === "sidebar",
    });
    FullscreenPanel.currentPanel?.postMessage({
      type: "controlChanged",
      controlled: gameManager.getActiveSurface() === "fullscreen",
    });
  };

  const openFullscreen = () => {
    const activeGame = gameManager.getActiveGame();
    if (!activeGame) {
      vscode.window.showWarningMessage(
        "VSArcade: No game selected. Use 'Select Game' first.",
      );
      return;
    }
    gameManager.setActiveSurface("fullscreen");
    FullscreenPanel.createOrShow(
      context.extensionUri,
      gameManager,
      syncRuntimeSnapshot,
      syncPause,
      () => {
        gameManager.setActiveSurface("sidebar");
        syncControlTargets();
      },
    );
    syncControlTargets();
  };

  sidebarProvider = new ArcadeViewProvider(
    context.extensionUri,
    gameManager,
    syncRuntimeSnapshot,
    syncPause,
    openFullscreen,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      VIEW_IDS.SIDEBAR,
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

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

      if (!selected) {
        return;
      }

      const wasFullscreen =
        gameManager.getActiveSurface() === "fullscreen" &&
        FullscreenPanel.currentPanel !== undefined;

      const descriptor = gameManager.selectGame(selected.detail);
      if (!descriptor) {
        return;
      }

      gameManager.setActiveSurface("sidebar");
      sidebarProvider.refresh();
      FullscreenPanel.currentPanel?.refresh();

      const runtimeMessage = {
        type: "gameSelected",
        id: descriptor.id,
        name: descriptor.name,
        autoPlay: gameManager.isAutoPlayEnabled(),
      };
      sidebarProvider.postMessage(runtimeMessage);
      FullscreenPanel.currentPanel?.postMessage(runtimeMessage);

      if (wasFullscreen) {
        gameManager.setActiveSurface("fullscreen");
      }
      syncControlTargets();

      if (!wasFullscreen) {
        await vscode.commands.executeCommand("workbench.view.explorer");
        await vscode.commands.executeCommand(`${VIEW_IDS.SIDEBAR}.focus`);
      }
      vscode.window.showInformationMessage(
        `VSArcade: Now playing ${descriptor.name}`,
      );
    },
  );

  const toggleFullscreenCommand = vscode.commands.registerCommand(
    COMMAND_IDS.TOGGLE_FULLSCREEN,
    openFullscreen,
  );

  const toggleAutoPlayCommand = vscode.commands.registerCommand(
    COMMAND_IDS.TOGGLE_AUTO_PLAY,
    () => {
      const activeGame = gameManager.getActiveGame();
      if (!activeGame) {
        vscode.window.showWarningMessage(
          "VSArcade: No game selected. Use 'Select Game' first.",
        );
        return;
      }
      const enabled = gameManager.toggleAutoPlay();
      const message = { type: "autoPlayChanged", enabled };
      sidebarProvider.postMessage(message);
      FullscreenPanel.currentPanel?.postMessage(message);
      vscode.window.showInformationMessage(
        `VSArcade: Auto-play ${enabled ? "enabled" : "disabled"}`,
      );
    },
  );

  const themeChangeListener = vscode.window.onDidChangeActiveColorTheme(
    (theme) => {
      gameManager.setTheme(
        theme.kind === vscode.ColorThemeKind.Dark ? "dark" : "light",
      );
    },
  );

  context.subscriptions.push(
    selectGameCommand,
    toggleFullscreenCommand,
    toggleAutoPlayCommand,
    themeChangeListener,
    sidebarProvider,
  );
}

export function deactivate(): void {
  gameManager.dispose();
}
