#!/usr/bin/env bash
# Alias retrocompatible: verificación rápida = lint + build (sin jest).
exec "$(dirname "$0")/verify.sh"
