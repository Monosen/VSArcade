# Publishing VSArcade

VSArcade can be published to two independent registries:

| Registry | Tool | Used by |
|----------|------|---------|
| **Visual Studio Marketplace** | `vsce` | VS Code |
| **Open VSX Registry** | `ovsx` | VSCodium, Cursor, Gitpod, Eclipse Theia, code-server |

They are separate stores with separate accounts and tokens. To reach every
VS Code-compatible editor, publish to both.

---

## 1. Prerequisites

Before publishing any version, make sure:

- The extension builds cleanly: `npm run compile`.
- `package.json` has the required fields. VSArcade already has them:
  - `name`, `displayName`, `version`, `description`
  - `publisher` — currently `monosen` (must match the registry publisher ID)
  - `engines.vscode` — the minimum supported VS Code version
  - `repository`, `icon`, `license`
- `CHANGELOG.md` is updated for the new version.
- `.vscodeignore` excludes source files and dev artifacts you do not want
  inside the `.vsix` package.

The `vscode:prepublish` script in `package.json` runs the production build
automatically before packaging — you do not need to compile manually.

---

## 2. Publishing to the Visual Studio Marketplace (`vsce`)

### 2.1 Install the CLI

```bash
npm install -g @vscode/vsce
```

You can also run it without installing via `npx @vscode/vsce <command>`.

### 2.2 Create a publisher

1. Sign in to the [Marketplace publisher management page](https://marketplace.visualstudio.com/manage)
   with a Microsoft account.
2. Create a publisher. Its **ID must match** the `publisher` field in
   `package.json` (`monosen`).

### 2.3 Create an Azure DevOps Personal Access Token (PAT)

The Marketplace authenticates through Azure DevOps.

1. Go to [https://dev.azure.com](https://dev.azure.com) and sign in with the
   same Microsoft account.
2. Open **User settings → Personal Access Tokens → New Token**.
3. Configure the token:
   - **Organization:** *All accessible organizations*
   - **Expiration:** as you prefer
   - **Scopes:** *Custom defined* → **Marketplace → Manage**
4. Copy the token now — it is shown only once.

### 2.4 Log in

```bash
vsce login monosen
```

Paste the PAT when prompted. The credential is cached locally for future
`publish` calls.

### 2.5 Package locally (optional but recommended)

```bash
vsce package
```

This produces `vsarcade-0.0.1.vsix`. Install it locally to smoke-test before
publishing:

```bash
code --install-extension vsarcade-0.0.1.vsix
```

### 2.6 Publish

```bash
# Publish the current version in package.json
vsce publish

# Or bump the version, commit, tag, and publish in one step
vsce publish patch   # 0.0.1 -> 0.0.2
vsce publish minor   # 0.0.1 -> 0.1.0
vsce publish major   # 0.0.1 -> 1.0.0

# Or publish a pre-built package
vsce publish --packagePath vsarcade-0.0.1.vsix
```

The extension appears on the Marketplace within a few minutes after the
validation pipeline finishes.

---

## 3. Publishing to Open VSX (`ovsx`)

### 3.1 Install the CLI

```bash
npm install -g ovsx
```

Or run via `npx ovsx <command>`.

### 3.2 Create an account and sign the agreement

1. Sign in to [https://open-vsx.org](https://open-vsx.org) with GitHub.
2. Open your user settings and **sign the Eclipse Publisher Agreement** —
   publishing is rejected until this is signed.

### 3.3 Create an access token

In your Open VSX user settings, go to **Access Tokens** and generate one.
Copy it immediately.

### 3.4 Create the namespace

The namespace must match the `publisher` field (`monosen`). Create it once:

```bash
npx ovsx create-namespace monosen -p <token>
```

### 3.5 Publish

```bash
# Publish from the project directory
npx ovsx publish -p <token>

# Or publish a pre-built .vsix (recommended: reuse the same package
# you already verified for the Marketplace)
npx ovsx publish vsarcade-0.0.1.vsix -p <token>
```

---

## 4. Release checklist

Run this sequence for every release:

1. Bump `version` in `package.json` following Semantic Versioning.
2. Update `CHANGELOG.md` with the new version entry.
3. `npm run compile` — confirm a clean build.
4. `vsce package` — generate the `.vsix`.
5. Install the `.vsix` locally and smoke-test the extension.
6. `vsce publish` — publish to the Visual Studio Marketplace.
7. `npx ovsx publish vsarcade-<version>.vsix -p <token>` — publish to Open VSX.
8. Commit and tag the release: `git tag v<version> && git push --tags`.

---

## 5. Notes and gotchas

- **`README.md` is the store page.** Whatever is in `README.md` renders as the
  extension's marketplace description — keep it presentable.
- **`.vscodeignore` controls package contents.** Verify the `.vsix` does not
  ship `src/`, tests, or other dev-only files. Inspect with `vsce ls`.
- **Icon.** `media/icon.png` should be at least 128×128 px.
- **Never commit tokens.** Pass PAT/Open VSX tokens via environment variables
  or CI secrets, never in files tracked by git.
- **Version must be unique.** A registry rejects a version that already exists;
  always bump before republishing.
- **CI option.** Both `vsce` and `ovsx` accept a token via the `-p` flag or
  environment variables (`VSCE_PAT`, `OVSX_PAT`), which makes them easy to wire
  into a GitHub Actions release workflow.
