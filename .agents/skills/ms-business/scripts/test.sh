#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-business" && pwd)"
cd "$ROOT"
pnpm run lint
pnpm test
pnpm run build
echo "OK: lint, test y build completados."
