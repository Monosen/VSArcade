// ---------------------------------------------------------------
// VSArcade — Input Handler
// ---------------------------------------------------------------

import * as vscode from "vscode";
import { COMMAND_IDS } from "../constants";
import { GameManager } from "../core/GameManager";

/**
 * Manages keyboard input forwarding from VS Code to the active game engine.
 * Since webview focus can be tricky, this provides a command-based fallback
 * and ensures key events reach the game.
 */
export class InputHandler {
  private _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _gameManager: GameManager
  ) {}

  /** Register command-based input forwarding. */
  registerCommands(context: vscode.ExtensionContext): void {
    // We rely on the webview's own keydown/keyup listeners for direct input.
    // These commands serve as fallback / programmatic entry points.
    const moveLeft = vscode.commands.registerCommand(
      "vsarcade.input.left",
      () => this._gameManager.getActiveGame()?.handleInput("ArrowLeft", true)
    );
    const moveRight = vscode.commands.registerCommand(
      "vsarcade.input.right",
      () => this._gameManager.getActiveGame()?.handleInput("ArrowRight", true)
    );
    const moveDown = vscode.commands.registerCommand(
      "vsarcade.input.down",
      () => this._gameManager.getActiveGame()?.handleInput("ArrowDown", true)
    );
    const rotate = vscode.commands.registerCommand(
      "vsarcade.input.rotate",
      () => this._gameManager.getActiveGame()?.handleInput("ArrowUp", true)
    );
    const dropHard = vscode.commands.registerCommand(
      "vsarcade.input.drop",
      () => this._gameManager.getActiveGame()?.handleInput(" ", true)
    );

    this._disposables.push(moveLeft, moveRight, moveDown, rotate, dropHard);
    context.subscriptions.push(...this._disposables);
  }

  dispose(): void {
    this._disposables.forEach((d) => d.dispose());
  }
}