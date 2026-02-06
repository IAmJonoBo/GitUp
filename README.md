# GitUp

![GHBanner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

GitUp is a fail-closed repository generator and “Repo Doctor” auditor that runs inside VS Code and uses the VS Code LM (Copilot) for generation. User input is treated as untrusted data, and model output is validated deterministically before download.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `pnpm install`
2. Run the web UI (standalone):
   `pnpm --filter gitup-webview dev`
3. Run inside VS Code:
   - Open the workspace in VS Code and launch the extension (F5).
   - Run the `GitUp: Open` command to start the webview.

## Security Model (Summary)

- **No client-side secrets:** Model access is handled by VS Code LM. The browser bundle contains no API keys.
- **Prompt injection resilience:** All user-provided content is treated as untrusted data and fenced in prompts.
- **Fail-closed output handling:** Generated files are validated deterministically. Errors block export. A bounded repair loop runs up to two attempts.
- **Dangerous-content scanning:** High-risk patterns are blocked with file+line evidence. Token-shaped strings are flagged as warnings.

## Tests

`npm test`
