#!/bin/bash
# promise-checker.sh — Verifica integridade após cada tool use

PROJECT_DIR="/c/Users/Rogério/crm-simples"

# Verifica arquivos críticos
check_critical_files() {
  CRITICAL=(
    "$PROJECT_DIR/backend/package.json"
    "$PROJECT_DIR/docker-compose.yml"
    "$PROJECT_DIR/backend/prisma/schema.prisma"
  )
  for f in "${CRITICAL[@]}"; do
    if [ ! -f "$f" ]; then
      echo "AVISO: Arquivo crítico ausente: $f" >&2
    fi
  done
}

check_critical_files

# Verifica sintaxe de arquivos JS recentemente modificados
LAST_MODIFIED=$(find "$PROJECT_DIR/backend/src" -name "*.js" 2>/dev/null | \
  grep -v node_modules | xargs ls -t 2>/dev/null | head -1)

if [ -n "$LAST_MODIFIED" ]; then
  MODIFIED_SECS=$(( $(date +%s) - $(date -r "$LAST_MODIFIED" +%s 2>/dev/null || echo 999) ))
  if [ "$MODIFIED_SECS" -lt 300 ] 2>/dev/null; then
    result=$(node --check "$LAST_MODIFIED" 2>&1)
    if [ $? -ne 0 ]; then
      echo "AVISO: Erro de sintaxe em $LAST_MODIFIED:" >&2
      echo "$result" >&2
    fi
  fi
fi

exit 0
