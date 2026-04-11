const prisma = require('../lib/prisma');

exports.stats = async (req, res, next) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];

    const [totalLeads, leadsNovos, convertidos, agendamentosHoje, leadsRecentes, agendamentosDodia] =
      await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'novo' } }),
        prisma.lead.count({ where: { status: 'convertido' } }),
        prisma.agendamento.count({ where: { data: hoje } }),
        prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma.agendamento.findMany({
          where: { data: hoje },
          orderBy: { hora: 'asc' },
          include: { lead: { select: { nome: true, telefone: true } } },
        }),
      ]);

    res.json({
      stats: { totalLeads, leadsNovos, convertidos, agendamentosHoje },
      leadsRecentes,
      agendamentosDodia,
    });
  } catch (err) { next(err); }
};
