# First run

This tutorial gets the project running locally.

## Before you start

- Install Node.js 22.12.0 or later.
- Install pnpm 10.28.2 or later.

## Steps

1. Install dependencies: `pnpm install`
2. Copy [.env.example](../../.env.example) to `.env` and set `GEMINI_API_KEY`.
3. Start the API server: `pnpm dev:server`
4. Start the web app: `pnpm dev:webview`

The web app proxies `/api/*` to the local server.
