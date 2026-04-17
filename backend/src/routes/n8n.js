/**
 * Rotas de integração n8n → CRM.
 * Autenticação via header: X-API-Token: <token>
 */
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { getSlots } = require('../services/disponibilidadeService');

// ── Middleware de autenticação por API token ─────────────────────────────────
async function apiTokenAuth(req, res, next) {
  const token = req.headers['x-api-token'];
  if (!token) return res.status(401).json({ error: 'X-API-Token obrigatório' });
  const tenant = await prisma.tenant.findFirst({ where: { apiToken: token, ativo: true } });
  if (!tenant) return res.status(401).json({ error: 'Token inválido ou empresa inativa' });
  req.tenant = tenant;
  next();
}

// ══════════════════════════════════════════════════════════════════════════════
// LEADS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/n8n/leads — listar leads do tenant
router.get('/leads', apiTokenAuth, async (req, res, next) => {
  try {
    const { status, telefone, limite = 50 } = req.query;
    const where = { tenantId: req.tenant.id };
    if (status)   where.status = status;
    if (telefone) where.telefone = telefone.replace(/\D/g, '');
    const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: Number(limite) });
    res.json({ leads });
  } catch (err) { next(err); }
});

// POST /api/n8n/leads — criar lead via n8n
router.post('/leads', apiTokenAuth, async (req, res, next) => {
  try {
    const { nome, telefone, email, origem, status, observacoes, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body;
    if (!nome) return res.status(400).json({ error: 'Campo nome é obrigatório' });
    const lead = await prisma.lead.create({
      data: { tenantId: req.tenant.id, nome, telefone: telefone?.replace(/\D/g,''), email, origem, status: status || 'novo', observacoes, cep, logradouro, numero, complemento, bairro, cidade, estado, fonte: 'api' },
    });
    res.status(201).json({ lead });
  } catch (err) { next(err); }
});

// PATCH /api/n8n/leads/:id — atualizar lead via n8n
router.patch('/leads/:id', apiTokenAuth, async (req, res, next) => {
  try {
    const existe = await prisma.lead.findFirst({ where: { id: Number(req.params.id), tenantId: req.tenant.id } });
    if (!existe) return res.status(404).json({ error: 'Lead não encontrado' });
    const lead = await prisma.lead.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json({ lead });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// AGENDAMENTOS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/n8n/agendamentos — listar agendamentos (filtros: data, status, telefone, proximos)
router.get('/agendamentos', apiTokenAuth, async (req, res, next) => {
  try {
    const { data, status, telefone, proximos, lembrete } = req.query;
    const where = { tenantId: req.tenant.id };

    if (data)   where.data = data;
    if (status) where.status = status;
    if (proximos === 'true') {
      const hoje = new Date().toISOString().split('T')[0];
      where.data = { gte: hoje };
      where.status = { in: ['marcado', 'confirmado'] };
    }
    if (lembrete === 'pendente') {
      const hoje = new Date().toISOString().split('T')[0];
      const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      where.lembreteEnviado = false;
      where.data = { gte: hoje, lte: amanha };
      where.status = { in: ['marcado', 'confirmado'] };
    }

    // Filtro por telefone do lead
    if (telefone) {
      const tel = telefone.replace(/\D/g, '');
      where.lead = { telefone: tel };
    }

    const agendamentos = await prisma.agendamento.findMany({
      where,
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
      take: 50,
      include: { lead: { select: { nome: true, telefone: true, email: true } } },
    });
    res.json({ agendamentos });
  } catch (err) { next(err); }
});

// POST /api/n8n/agendamentos — criar agendamento via WhatsApp bot
router.post('/agendamentos', apiTokenAuth, async (req, res, next) => {
  try {
    const { lead_id, cliente_nome, cliente_telefone, data, hora, tipo, observacoes } = req.body;
    if (!data || !hora) return res.status(400).json({ error: 'Campos "data" e "hora" obrigatórios.' });

    // Verifica disponibilidade
    const slotResult = await getSlots(req.tenant.id, data);
    if (slotResult.erro) return res.status(400).json({ error: slotResult.erro });
    if (!slotResult.slots.includes(hora)) {
      return res.status(409).json({ error: 'Horário indisponível.' });
    }

    // Resolve lead: usa lead_id, ou busca/cria pelo telefone
    let leadId = lead_id ? Number(lead_id) : null;
    if (!leadId && cliente_telefone) {
      const tel = cliente_telefone.replace(/\D/g, '');
      let lead = await prisma.lead.findFirst({ where: { tenantId: req.tenant.id, telefone: tel } });
      if (!lead) {
        lead = await prisma.lead.create({
          data: { tenantId: req.tenant.id, nome: cliente_nome || 'Cliente WhatsApp', telefone: tel, status: 'agendado', fonte: 'api' },
        });
      }
      leadId = lead.id;
    }
    if (!leadId) return res.status(400).json({ error: 'Informe "lead_id" ou "cliente_telefone".' });

    const agendamento = await prisma.$transaction(async (tx) => {
      const conflito = await tx.agendamento.findFirst({
        where: { tenantId: req.tenant.id, data, hora, status: { in: ['marcado', 'confirmado'] } },
      });
      if (conflito) { const e = new Error('SLOT_OCUPADO'); e.status = 409; throw e; }

      return tx.agendamento.create({
        data: {
          tenantId: req.tenant.id, leadId, data, hora,
          tipo: tipo || 'consulta', status: 'marcado', canalOrigem: 'whatsapp',
          clienteNome: cliente_nome || null, clienteTelefone: cliente_telefone?.replace(/\D/g,'') || null,
          observacoes: observacoes || null,
        },
        include: { lead: { select: { nome: true, telefone: true, email: true } } },
      });
    });

    res.status(201).json({ agendamento });
  } catch (err) {
    if (err.message === 'SLOT_OCUPADO' || err.status === 409) {
      return res.status(409).json({ error: 'Horário foi reservado por outra pessoa. Tente outro.' });
    }
    next(err);
  }
});

// PATCH /api/n8n/agendamentos/:id — atualizar status (ex: cancelar)
router.patch('/agendamentos/:id', apiTokenAuth, async (req, res, next) => {
  try {
    const existe = await prisma.agendamento.findFirst({ where: { id: Number(req.params.id), tenantId: req.tenant.id } });
    if (!existe) return res.status(404).json({ error: 'Agendamento não encontrado' });
    const agendamento = await prisma.agendamento.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      include: { lead: { select: { nome: true, telefone: true, email: true } } },
    });
    res.json({ agendamento });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// DISPONIBILIDADE
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/n8n/disponibilidade?data=YYYY-MM-DD
router.get('/disponibilidade', apiTokenAuth, async (req, res, next) => {
  try {
    const { data } = req.query;
    if (!data) return res.status(400).json({ error: 'Parâmetro "data" obrigatório.' });

    const resultado = await getSlots(req.tenant.id, data);
    if (resultado.erro) return res.status(400).json({ error: resultado.erro, slots: [] });

    res.json({ data, slots: resultado.slots, total: resultado.slots.length });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// CONVERSAS WHATSAPP (estado da conversa do bot)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/n8n/conversas/:telefone
router.get('/conversas/:telefone', apiTokenAuth, async (req, res, next) => {
  try {
    const telefone = req.params.telefone.replace(/\D/g, '');
    const conversa = await prisma.conversaWhatsapp.findUnique({
      where: { telefone_tenantId: { telefone, tenantId: req.tenant.id } },
    });

    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada.' });

    // Verifica TTL
    if (new Date() > new Date(conversa.expiresAt)) {
      await prisma.conversaWhatsapp.delete({
        where: { telefone_tenantId: { telefone, tenantId: req.tenant.id } },
      });
      return res.status(404).json({ error: 'Conversa expirada.' });
    }

    res.json({ conversa });
  } catch (err) { next(err); }
});

// PUT /api/n8n/conversas/:telefone — cria ou atualiza conversa
router.put('/conversas/:telefone', apiTokenAuth, async (req, res, next) => {
  try {
    const telefone = req.params.telefone.replace(/\D/g, '');
    const { estado, dadosJson } = req.body;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    const conversa = await prisma.conversaWhatsapp.upsert({
      where: { telefone_tenantId: { telefone, tenantId: req.tenant.id } },
      update: { estado: estado || 'inicio', dadosJson: dadosJson || {}, expiresAt },
      create: { tenantId: req.tenant.id, telefone, estado: estado || 'inicio', dadosJson: dadosJson || {}, expiresAt },
    });

    res.json({ conversa });
  } catch (err) { next(err); }
});

// DELETE /api/n8n/conversas/:telefone — encerra conversa
router.delete('/conversas/:telefone', apiTokenAuth, async (req, res, next) => {
  try {
    const telefone = req.params.telefone.replace(/\D/g, '');
    await prisma.conversaWhatsapp.deleteMany({
      where: { telefone, tenantId: req.tenant.id },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
