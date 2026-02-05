# Architecture

GitUp is a monorepo with three main packages:

- `packages/extension` - VS Code extension that hosts the webview.
- `packages/webview` - React app bundled into the extension webview.
- `packages/shared` - Shared types and validation utilities.

The web app calls a local API server and returns validated artifacts to the UI.
