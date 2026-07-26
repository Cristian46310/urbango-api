#!/usr/bin/env bash
set -euo pipefail

REQUIRED_VARS=(DB_URL JWT_SECRET)

check_file() {
  local f="$1"
  local label="$2"
  if [[ ! -f "$f" ]]; then
    echo "WARN: no existe $label ($f)"
    return 1
  fi
  local missing=()
  for var in "${REQUIRED_VARS[@]}"; do
    grep -qE "^${var}=" "$f" 2>/dev/null || missing+=("$var")
  done
  if ((${#missing[@]})); then
    echo "ERROR: faltan en $label:"
    printf '  - %s\n' "${missing[@]}"
    return 1
  fi
  echo "OK: $label tiene ${REQUIRED_VARS[*]}"
  return 0
}

ROOT="$(cd "$(dirname "$0")/../../../../" && pwd)"
ok=1
check_file "$ROOT/ms-security/.env" "ms-security/.env" && ok=0
check_file "$ROOT/.env" "repo .env" && ok=0

if [[ $ok -ne 0 ]]; then
  echo "Crea ms-security/.env siguiendo ms-security/.env.example y SETUP-LOCAL.md"
  exit 1
fi
