<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RepoForge (Secure)

RepoForge is a fail-closed repository generator and “Repo Doctor” auditor with a server-side Gemini proxy. User input is treated as untrusted data, and model output is validated deterministically before download.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a server env file:
   - Copy [.env.example](.env.example) to `.env` and add your Gemini key.
3. Run the API server:
   `npm run dev:server`
4. Run the frontend:
   `npm run dev`

The frontend proxies `/api/*` to the local server at port 8787.

## Security Model (Summary)

- **No client-side secrets:** API keys are server-side only. The browser bundle contains no Gemini keys.
- **Prompt injection resilience:** All user-provided content is treated as untrusted data and fenced in prompts.
- **Fail-closed output handling:** Generated files are validated deterministically. Errors block export. A bounded repair loop runs up to two attempts.
- **Dangerous-content scanning:** High-risk patterns are blocked with file+line evidence. Token-shaped strings are flagged as warnings.

## Tests

`npm test`
# GitUp
