#!/bin/bash
# session-end.sh — Atualiza memória ao final de cada sessão

PROJECT_DIR="/c/Users/Rogério/crm-simples"
MEMORY_DIR="$PROJECT_DIR/MEMORY"
DATETIME=$(date '+%Y-%m-%d %H:%M')

mkdir -p "$MEMORY_DIR"

# Atualiza timestamp no wake-up.md
if [ -f "$MEMORY_DIR/wake-up.md" ]; then
  sed -i "s/\*\*Última sessão:\*\*.*/\*\*Última sessão:\*\* $DATETIME/" "$MEMORY_DIR/wake-up.md" 2>/dev/null || true
fi

echo "Memória atualizada em $DATETIME" >&2
exit 0
