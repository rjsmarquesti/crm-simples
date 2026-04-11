const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

exports.listar = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { busca, status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { tenantId };
    if (status) where.status = status;
    if (busca) where.OR = [
      { nome: { contains: busca } },
      { telefone: { contains: busca } },
      { email: { contains: busca } },
    ];

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      prisma.lead.count({ where }),
    ]);
    res.json({ leads, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

exports.buscarPorId = async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({ where: { id: Number(req.params.id), tenantId: req.user.tenantId } });
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
    res.json({ lead });
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, telefone, email, origem, status, observacoes } = req.body;
    const lead = await prisma.lead.create({
      data: { tenantId: req.user.tenantId, nome, telefone, email, origem, status: status || 'novo', observacoes },
    });
    res.status(201).json({ lead });
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, telefone, email, origem, status, observacoes } = req.body;
    const existe = await prisma.lead.findFirst({ where: { id: Number(req.params.id), tenantId: req.user.tenantId } });
    if (!existe) return res.status(404).json({ error: 'Lead não encontrado' });

    const lead = await prisma.lead.update({ where: { id: Number(req.params.id) }, data: { nome, telefone, email, origem, status, observacoes } });
    res.json({ lead });
  } catch (err) { next(err); }
};

exports.deletar = async (req, res, next) => {
  try {
    const existe = await prisma.lead.findFirst({ where: { id: Number(req.params.id), tenantId: req.user.tenantId } });
    if (!existe) return res.status(404).json({ error: 'Lead não encontrado' });

    await prisma.lead.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Lead removido' });
  } catch (err) { next(err); }
};
