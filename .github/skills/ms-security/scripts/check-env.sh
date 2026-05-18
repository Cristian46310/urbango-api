#!/usr/bin/env bash
set -euo pipefail

check_file() {
  local f="$1"
  local label="$2"
  if [[ ! -f "$f" ]]; then
    echo "WARN: no existe $label ($f)"
    return 1
  fi
  local missing=()
  for var in MONGO_URI MONGO_DATABASE JWT_SECRET; do
    grep -q "^${var}=" "$f" 2>/dev/null || missing+=("$var")
  done
  if ((${#missing[@]})); then
    echo "ERROR: faltan en $label:"
    printf '  - %s\n' "${missing[@]}"
    return 1
  fi
  echo "OK: $label tiene MONGO_URI, MONGO_DATABASE, JWT_SECRET"
  return 0
}

ROOT="$(cd "$(dirname "$0")/../../../../" && pwd)"
ok=0
check_file "$HOME/.config/ms-security/.env" "~/.config/ms-security/.env" || ok=1
check_file "$ROOT/ms-security/.env" "ms-security/.env" || true
check_file "$ROOT/.env" "repo .env" || true

if [[ $ok -ne 0 ]]; then
  echo "Crea ~/.config/ms-security/.env siguiendo ms-security/README.md"
  exit 1
fi
