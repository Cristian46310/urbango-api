#!/usr/bin/env bash
# Verificación local (agentes): lint + build.
# CI puede añadir pnpm test.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-messages" && pwd)"
cd "$ROOT"
pnpm run lint
pnpm run build
echo "OK: lint y build completados."
