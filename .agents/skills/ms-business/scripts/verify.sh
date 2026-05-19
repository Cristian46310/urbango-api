#!/usr/bin/env bash
# Verificación rápida local (agentes): lint + build, sin tests.
# CI completo incluye pnpm test (ver .github/workflows/ms-business.yml).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-business" && pwd)"
cd "$ROOT"
pnpm run lint
pnpm run build
echo "OK: lint y build completados."
