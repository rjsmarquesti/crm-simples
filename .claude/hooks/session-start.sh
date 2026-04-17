#!/bin/bash
# session-start.sh — Injeta status do ambiente no início de cada sessão

PROJECT_DIR="/c/Users/Rogério/crm-simples"

echo "=== CRM Simples — Início de Sessão ==="
echo ""

# node_modules backend
if [ -d "$PROJECT_DIR/backend/node_modules" ]; then
    echo "✅ backend/node_modules: presente"
else
    echo "⚠️  backend/node_modules: ausente — rode npm install em backend/"
fi

# node_modules frontend
if [ -d "$PROJECT_DIR/frontend/node_modules" ]; then
    echo "✅ frontend/node_modules: presente"
else
    echo "⚠️  frontend/node_modules: ausente — rode npm install em frontend/"
fi

# .env
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "✅ .env: presente"
else
    echo "⚠️  .env: ausente — copiar de .env.example"
fi

# Docker
if command -v docker &>/dev/null; then
    RUNNING=$(docker ps --filter "name=crm" --format "{{.Names}}" 2>/dev/null | wc -l | tr -d ' ')
    echo "🐳 Containers crm rodando: $RUNNING"
fi

# Git status
if command -v git &>/dev/null && [ -d "$PROJECT_DIR/.git" ]; then
    BRANCH=$(cd "$PROJECT_DIR" && git rev-parse --abbrev-ref HEAD 2>/dev/null)
    UNCOMMITTED=$(cd "$PROJECT_DIR" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    echo "🔀 Branch: ${BRANCH:-desconhecido} | Arquivos modificados: $UNCOMMITTED"
fi

echo ""
echo "📋 Leia MEMORY/wake-up.md antes de qualquer ação."
echo "📌 Plano de agendamento: ~/.claude/plans/crm-simples-agenda-dual-canal.md"
echo ""

exit 0
