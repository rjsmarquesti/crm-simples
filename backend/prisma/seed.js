const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Super admin (sem tenant)
  const superAdmin = await prisma.user.findFirst({ where: { role: 'super_admin' } });
  if (!superAdmin) {
    const senha = await bcrypt.hash('superadmin123', 10);
    await prisma.user.create({
      data: { nome: 'Super Admin', email: 'super@crm.com', senha, role: 'super_admin', tenantId: null },
    });
    console.log('✅ Super Admin criado: super@crm.com / superadmin123');
  }

  // Tenant demo
  let tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        nome: 'Empresa Demo',
        slug: 'demo',
        corPrimaria: '#2563eb',
        plano: 'pro',
        modulos: ['leads', 'agendamentos'],
      },
    });
    console.log('✅ Tenant "demo" criado');
  }

  // Admin do tenant demo
  const adminExiste = await prisma.user.findFirst({ where: { email: 'admin@crm.com', tenantId: tenant.id } });
  if (!adminExiste) {
    const senha = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: { nome: 'Administrador', email: 'admin@crm.com', senha, role: 'admin', tenantId: tenant.id },
    });
    console.log('✅ Admin demo criado: admin@crm.com / admin123');
  }

  // Leads de exemplo
  const totalLeads = await prisma.lead.count({ where: { tenantId: tenant.id } });
  if (totalLeads === 0) {
    const leads = await prisma.lead.createMany({
      data: [
        { tenantId: tenant.id, nome: 'Maria Silva',    telefone: '(11) 98765-4321', email: 'maria@email.com',    origem: 'Instagram', status: 'novo',       observacoes: 'Interessada no plano básico' },
        { tenantId: tenant.id, nome: 'João Santos',    telefone: '(11) 91234-5678', email: 'joao@email.com',     origem: 'Indicação', status: 'contato',    observacoes: 'Preferir contato pela manhã' },
        { tenantId: tenant.id, nome: 'Ana Costa',      telefone: '(21) 99999-1111', email: 'ana@email.com',      origem: 'Site',      status: 'agendado',   observacoes: 'Agendou consulta para segunda' },
        { tenantId: tenant.id, nome: 'Carlos Lima',    telefone: '(31) 98888-2222', email: null,                 origem: 'WhatsApp',  status: 'convertido', observacoes: 'Fechou contrato em março' },
        { tenantId: tenant.id, nome: 'Fernanda Rocha', telefone: '(41) 97777-3333', email: 'fernanda@email.com', origem: 'Google',    status: 'perdido',    observacoes: 'Desistiu após proposta' },
      ],
    });
    console.log(`✅ ${leads.count} leads criados`);

    const hoje = new Date().toISOString().split('T')[0];
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const lead1 = await prisma.lead.findFirst({ where: { tenantId: tenant.id, nome: 'Ana Costa' } });
    const lead2 = await prisma.lead.findFirst({ where: { tenantId: tenant.id, nome: 'Maria Silva' } });
    const lead3 = await prisma.lead.findFirst({ where: { tenantId: tenant.id, nome: 'João Santos' } });

    await prisma.agendamento.createMany({
      data: [
        { tenantId: tenant.id, leadId: lead1.id, data: hoje,   hora: '09:00', tipo: 'Consulta', status: 'confirmado', observacoes: 'Primeira consulta presencial' },
        { tenantId: tenant.id, leadId: lead2.id, data: hoje,   hora: '14:30', tipo: 'Reunião',  status: 'marcado',    observacoes: 'Apresentar proposta' },
        { tenantId: tenant.id, leadId: lead3.id, data: amanha, hora: '10:00', tipo: 'Ligação',  status: 'marcado',    observacoes: 'Follow-up' },
      ],
    });
    console.log('✅ Agendamentos criados');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
