#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-business" && pwd)"
cd "$ROOT"

missing=()
for var in DB_URL; do
  if [[ -f .env ]]; then
    grep -q "^${var}=" .env 2>/dev/null || missing+=("$var")
  else
    missing+=(".env (archivo)")
    break
  fi
done

optional=(MS_SECURITY_URL MS_NOTIFICATION_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY)
warn=()
for var in "${optional[@]}"; do
  if [[ -f .env ]] && ! grep -q "^${var}=" .env 2>/dev/null; then
    warn+=("$var")
  fi
done

if ((${#missing[@]})); then
  echo "ERROR: faltan variables obligatorias en ms-business/.env:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

if ((${#warn[@]})); then
  echo "WARN: opcionales no definidas (pueden ser necesarias según el feature):"
  printf '  - %s\n' "${warn[@]}"
fi

echo "OK: variables obligatorias presentes en ms-business/.env"
