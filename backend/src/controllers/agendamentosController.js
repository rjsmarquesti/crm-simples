const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const incluirLead = { lead: { select: { nome: true, telefone: true, email: true } } };

exports.listar = async (req, res, next) => {
  try {
    const { data, status, lead_id } = req.query;
    const where = {};
    if (data) where.data = data;
    if (status) where.status = status;
    if (lead_id) where.leadId = Number(lead_id);

    const agendamentos = await prisma.agendamento.findMany({
      where,
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
      include: incluirLead,
    });
    res.json({ agendamentos });
  } catch (err) { next(err); }
};

exports.buscarPorId = async (req, res, next) => {
  try {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: Number(req.params.id) },
      include: incluirLead,
    });
    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' });
    res.json({ agendamento });
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { lead_id, data, hora, tipo, status, observacoes } = req.body;
    const agendamento = await prisma.agendamento.create({
      data: { leadId: Number(lead_id), data, hora, tipo: tipo || 'reunião', status: status || 'marcado', observacoes },
      include: incluirLead,
    });
    res.status(201).json({ agendamento });
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { lead_id, data, hora, tipo, status, observacoes } = req.body;
    const agendamento = await prisma.agendamento.update({
      where: { id: Number(req.params.id) },
      data: { leadId: Number(lead_id), data, hora, tipo, status, observacoes },
      include: incluirLead,
    });
    res.json({ agendamento });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Agendamento não encontrado' });
    next(err);
  }
};

exports.deletar = async (req, res, next) => {
  try {
    await prisma.agendamento.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Agendamento removido' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Agendamento não encontrado' });
    next(err);
  }
};
