# Configuration

## Environment variables

GitUp does not require local API keys when used inside VS Code. Model access is handled by VS Code LM.

## VS Code settings

- `gitup.nodeVersion` - Preferred Node.js version for scaffold generation when `nvm current` is not available.
- `gitup.modelProvider` - Model provider for generation (`vscode` or `external`). External requires a server integration.
- `gitup.pathAllowlist` - Extra top-level directories allowed for generated files.
- `gitup.extensionAllowlist` - Per-directory extension allowlist overrides (example: `{ "src": [".graphql"] }`).

## Planned settings

- UI editing for path and extension allowlists.
