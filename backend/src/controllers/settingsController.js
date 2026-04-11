const prisma = require('../lib/prisma');

exports.get = async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json({ tenant });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { nome, logo, corPrimaria, modulos } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { nome, logo, corPrimaria, modulos },
    });
    res.json({ tenant });
  } catch (err) { next(err); }
};
