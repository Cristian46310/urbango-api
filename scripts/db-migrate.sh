#!/usr/bin/env bash
# Orquestador único de migraciones (ver docs/DATABASE.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "$ROOT/scripts/db-migrate.cjs" "$@"
