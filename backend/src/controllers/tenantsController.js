const prisma = require('../lib/prisma');

exports.listar = async (req, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, leads: true } } },
    });
    res.json({ tenants });
  } catch (err) { next(err); }
};

exports.buscarPorId = async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: Number(req.params.id) },
      include: { _count: { select: { users: true, leads: true } } },
    });
    if (!tenant) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json({ tenant });
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  try {
    const { nome, slug, corPrimaria, plano, modulos } = req.body;
    const tenant = await prisma.tenant.create({
      data: { nome, slug, corPrimaria: corPrimaria || '#2563eb', plano: plano || 'basico', modulos: modulos || ['leads', 'agendamentos'] },
    });
    res.status(201).json({ tenant });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Slug já em uso' });
    next(err);
  }
};

exports.atualizar = async (req, res, next) => {
  try {
    const { nome, slug, corPrimaria, plano, modulos, ativo } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: Number(req.params.id) },
      data: { nome, slug, corPrimaria, plano, modulos, ativo },
    });
    res.json({ tenant });
  } catch (err) { next(err); }
};

exports.deletar = async (req, res, next) => {
  try {
    await prisma.tenant.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Empresa removida' });
  } catch (err) { next(err); }
};
