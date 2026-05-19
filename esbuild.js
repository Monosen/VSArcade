const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const shared = {
  bundle: true,
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  logLevel: "info",
};

async function main() {
  const hostCtx = await esbuild.context({
    ...shared,
    entryPoints: ["src/extension.ts"],
    format: "cjs",
    outdir: "./out",
    external: ["vscode"],
    platform: "node",
    target: "node16",
  });

  const webviewCtx = await esbuild.context({
    ...shared,
    entryPoints: {
      "webview/runtime": "src/webview/runtime.ts",
      "games/tetris": "src/games/tetris/webview.ts",
    },
    format: "iife",
    outdir: "./out",
    platform: "browser",
    target: "es2020",
  });

  if (watch) {
    await Promise.all([hostCtx.watch(), webviewCtx.watch()]);
    console.log("watching for changes...");
  } else {
    await Promise.all([hostCtx.rebuild(), webviewCtx.rebuild()]);
    await Promise.all([hostCtx.dispose(), webviewCtx.dispose()]);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
