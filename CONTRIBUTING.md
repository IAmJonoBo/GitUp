# Contributing

Thanks for helping improve this project. This guide keeps contributions smooth and consistent.

## Prerequisites

- Node.js 22.12.0 or later
- pnpm 10.28.2 or later

## Set up

1. Install dependencies: `pnpm install`
2. Copy [.env.example](.env.example) to `.env` and set `GEMINI_API_KEY`.
3. Run the web app: `pnpm dev:server` and `pnpm dev:webview`

## Development workflow

- Create a branch from `main`.
- Keep changes focused and well scoped.
- Run tests before opening a pull request: `pnpm test`.

## Commit and PR guidance

- Use clear commit messages.
- Include screenshots or logs if changes are visual or behavioral.
- Link related issues in the PR description.

## Code style

- Use 2 spaces for indentation.
- Follow existing patterns in each package.
