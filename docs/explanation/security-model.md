# Security model

The project treats user input as untrusted data and validates model output before export.

## Key principles

- No client-side secrets. API keys stay on the server.
- Prompt injection defenses. User content is fenced and treated as data.
- Fail-closed handling. Invalid output blocks export.
- Dangerous-content scanning. High-risk patterns are blocked with evidence.
