const crypto = require('crypto');
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
    const { nome, logo, corPrimaria, modulos, n8nWebhookUrl, n8nApiKey } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { nome, logo, corPrimaria, modulos, n8nWebhookUrl: n8nWebhookUrl || null, n8nApiKey: n8nApiKey || null },
    });
    res.json({ tenant });
  } catch (err) { next(err); }
};

// Gera ou regenera o API token do tenant (para n8n chamar o CRM)
exports.gerarApiToken = async (req, res, next) => {
  try {
    const apiToken = crypto.randomBytes(32).toString('hex');
    const tenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { apiToken },
    });
    res.json({ apiToken: tenant.apiToken });
  } catch (err) { next(err); }
};
