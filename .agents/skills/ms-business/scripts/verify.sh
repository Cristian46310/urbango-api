#!/usr/bin/env bash
# Verificación local (agentes): lint + test + build.
# CI: .github/workflows/ms-business.yml
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-business" && pwd)"
cd "$ROOT"
pnpm run lint
pnpm test
pnpm run build
echo "OK: lint, tests y build completados."
