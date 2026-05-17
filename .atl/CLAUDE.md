# VSArcade — Claude Code Configuration

@AGENTS.md

---

## Claude-Specific Notes

- Use `pnpm` exclusively. Never `npm` or `bun`.
- When editing webview HTML/CSS/JS inline in TypeScript files, preserve the `/*html*/` and `/*css*/` template literal comments for syntax highlighting.
- Claude Code sub-agents should respect the `IGameEngine` contract when working on game implementations.
- For webview debugging: open Developer Tools in the Extension Development Host (`Ctrl+Shift+P` → "Open Webview Developer Tools").
- Auto-memory path: `.claude/projects/vsarcade/memory/` (if using Claude Code's memory feature).
