const prisma = require('../lib/prisma');

/**
 * Dispara um evento para o webhook n8n do tenant (fire-and-forget).
 * @param {number} tenantId
 * @param {string} evento  ex: 'lead.criado', 'lead.atualizado', 'agendamento.criado'
 * @param {object} payload dados do evento
 */
async function dispararWebhook(tenantId, evento, payload) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { n8nWebhookUrl: true, n8nApiKey: true, slug: true },
    });

    if (!tenant?.n8nWebhookUrl) return;

    const headers = { 'Content-Type': 'application/json' };
    if (tenant.n8nApiKey) headers['Authorization'] = `Bearer ${tenant.n8nApiKey}`;

    await fetch(tenant.n8nWebhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ evento, tenant: tenant.slug, dados: payload, timestamp: new Date().toISOString() }),
    });
  } catch (_) {
    // falha silenciosa — não quebra o fluxo principal
  }
}

module.exports = { dispararWebhook };
