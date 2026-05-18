#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../ms-notifications" && pwd)"
cd "$ROOT"
uv sync --locked --group dev
uv run ruff check .
uv run ruff format --check .
echo "OK: ruff check y format check completados."
