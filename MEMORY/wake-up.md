# Wake-Up — Estado Atual do CRM Simples

> Claude: leia este arquivo no início de cada sessão antes de qualquer ação.

**Última sessão:** —  
**Último deploy:** —

---

## Estado Atual

### O que está funcionando em produção/local
- Auth: login JWT, roles (super_admin, admin, atendente)
- Dashboard com métricas básicas
- CRUD Leads com funil de vendas e dados Google Maps
- CRUD Agendamentos (marcado | confirmado | cancelado | realizado)
- Multi-tenant (Tenant com slug único, n8nWebhookUrl, apiToken)
- Docker Compose: MariaDB 10.11 + Backend porta 3000 + Frontend Nginx porta 80

### Adições planejadas (ainda não implementadas)
- Campo `canalOrigem` (manual | web | whatsapp) no Agendamento
- Campo `lembreteEnviado` no Agendamento
- Modelo `ConfiguracaoAgenda` (horários por tenant, slot duration)
- Modelo `ConversaWhatsapp` (estado da conversa WA, TTL 30min)
- Rotas públicas `/api/public/:slug/*` (sem auth, CORS aberto)
- Rotas n8n: POST /api/n8n/agendamentos, disponibilidade, conversas
- Formulário `backend/public/agendar.html` (vanilla JS, 4 etapas)
- n8n workflows: `agendamento-whatsapp` + `agendamento-notificacoes`

### Issues abertas
— (atualizar manualmente)

---

## Contexto Crítico

### Multi-tenant
Toda operação de dados filtra por `tenantId` do usuário autenticado.
Super admin vê todos os tenants; admin e atendente veem apenas o próprio.

### Docker
```bash
docker-compose up -d --build   # sobe tudo
docker-compose logs -f backend # logs do backend
```

### Prisma
```bash
cd backend && npx prisma migrate dev   # nova migration
cd backend && npx prisma studio        # GUI do banco
```

---

## Próximos Passos
Ver plano completo: `C:\Users\Rogério\.claude\plans\crm-simples-agenda-dual-canal.md`
