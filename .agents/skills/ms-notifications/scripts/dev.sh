#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-notifications" && pwd)"
cd "$ROOT"
if [[ ! -f .env ]]; then
  echo "WARN: .env no encontrado. Copia .env.example y configura Gmail OAuth."
fi
exec uv run fastapi dev --host 0.0.0.0 --port 8000
