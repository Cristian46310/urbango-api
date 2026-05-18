#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-business" && pwd)"
cd "$ROOT"
if [[ ! -f .env ]]; then
  echo "WARN: .env no encontrado en ms-business. Copia .env.example y configura DB_URL."
fi
exec pnpm run start:dev
