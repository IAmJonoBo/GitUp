# Run the web app

Use these steps to run the web UI and API server locally.

## Steps

1. Copy [.env.example](../../.env.example) to `.env` and set `GEMINI_API_KEY`.
2. Start the API server: `pnpm dev:server`
3. Start the web app: `pnpm dev:webview`

The web app proxies `/api/*` to the local server.
