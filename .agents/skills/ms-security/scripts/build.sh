#!/usr/bin/env bash
# Verificación rápida local (agentes): solo compilar, sin tests.
# CI completo: ./mvnw verify (ver .github/workflows/ms-security.yml).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-security" && pwd)"
cd "$ROOT"
./mvnw -B clean package -DskipTests
echo "OK: build completado (package -DskipTests)."
