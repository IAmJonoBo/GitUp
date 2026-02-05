#!/usr/bin/env bash
set -euo pipefail

pnpm install --frozen-lockfile
pnpm build
pnpm --filter gitup package
