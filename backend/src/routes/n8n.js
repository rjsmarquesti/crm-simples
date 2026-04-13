/**
 * Rotas públicas para integração n8n → CRM.
 * Autenticação via header: X-API-Token: <token>
 */
const router = require('express').Router();
const prisma = require('../lib/prisma');

// Middleware de autenticação por API token
async function apiTokenAuth(req, res, next) {
  const token = req.headers['x-api-token'];
  if (!token) return res.status(401).json({ error: 'X-API-Token obrigatório' });
  const tenant = await prisma.tenant.findFirst({ where: { apiToken: token, ativo: true } });
  if (!tenant) return res.status(401).json({ error: 'Token inválido ou empresa inativa' });
  req.tenant = tenant;
  next();
}

// GET /api/n8n/leads — listar leads do tenant
router.get('/leads', apiTokenAuth, async (req, res, next) => {
  try {
    const { status, limite = 50 } = req.query;
    const where = { tenantId: req.tenant.id };
    if (status) where.status = status;
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
      data: { tenantId: req.tenant.id, nome, telefone, email, origem, status: status || 'novo', observacoes, cep, logradouro, numero, complemento, bairro, cidade, estado },
    });
    res.status(201).json({ lead });
  } catch (err) { next(err); }
});

// PATCH /api/n8n/leads/:id — atualizar status de um lead via n8n
router.patch('/leads/:id', apiTokenAuth, async (req, res, next) => {
  try {
    const existe = await prisma.lead.findFirst({ where: { id: Number(req.params.id), tenantId: req.tenant.id } });
    if (!existe) return res.status(404).json({ error: 'Lead não encontrado' });
    const lead = await prisma.lead.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json({ lead });
  } catch (err) { next(err); }
});

// GET /api/n8n/agendamentos — listar agendamentos do tenant
router.get('/agendamentos', apiTokenAuth, async (req, res, next) => {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      where: { tenantId: req.tenant.id },
      orderBy: { data: 'asc' },
      take: 50,
      include: { lead: { select: { nome: true, telefone: true, email: true } } },
    });
    res.json({ agendamentos });
  } catch (err) { next(err); }
});

module.exports = router;
