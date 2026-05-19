#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-security" && pwd)"
cd "$ROOT"
./mvnw -B clean verify
echo "OK: verify completado."
