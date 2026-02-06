# Security model

The project treats user input as untrusted data and validates model output before export.

## Key principles

- No client-side secrets. Model access is handled by VS Code LM.
- Prompt injection defenses. User content is fenced and treated as data.
- Fail-closed handling. Invalid output blocks export.
- Dangerous-content scanning. High-risk patterns, unsafe paths, and disallowed extensions are blocked with evidence.

## Planned hardening

- Server-backed provider integration with explicit egress controls and audit logging.
- Expanded dependency advisory checks beyond heuristics.
