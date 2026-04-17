const prisma = require('../lib/prisma');

/**
 * Retorna os slots disponíveis para uma data em um tenant.
 * @param {number} tenantId
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {{ slots: string[], erro?: string }}
 */
async function getSlots(tenantId, dateStr) {
  // Validação básica do formato
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { slots: [], erro: 'Formato de data inválido. Use YYYY-MM-DD.' };
  }

  // Busca configuração do tenant (cria padrão se não existir)
  let config = await prisma.configuracaoAgenda.findUnique({ where: { tenantId } });
  if (!config) {
    config = await prisma.configuracaoAgenda.create({
      data: { tenantId },
    });
  }

  if (!config.ativo) return { slots: [], erro: 'Agendamentos desativados para esta empresa.' };

  const [year, month, day] = dateStr.split('-').map(Number);
  const dataSolicitada = new Date(year, month - 1, day);

  // Verifica dia da semana
  const dow = dataSolicitada.getDay(); // 0=Dom .. 6=Sab
  const diasUteis = config.diasUteis.split(',').map(Number);
  if (!diasUteis.includes(dow)) {
    return { slots: [], erro: 'Data fora dos dias de atendimento.' };
  }

  // Verifica antecedência mínima (em horas)
  const agora = new Date();
  const minDate = new Date(agora.getTime() + config.antecedenciaMin * 60 * 60 * 1000);
  minDate.setHours(0, 0, 0, 0);
  if (dataSolicitada < minDate) {
    return { slots: [], erro: 'Data abaixo da antecedência mínima exigida.' };
  }

  // Verifica antecedência máxima (em dias)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const maxDate = new Date(hoje.getTime() + config.antecedenciaMax * 24 * 60 * 60 * 1000);
  if (dataSolicitada > maxDate) {
    return { slots: [], erro: 'Data além do limite máximo de agendamento.' };
  }

  // Gera todos os slots do dia baseado no horário e duração
  const todosSlots = gerarSlots(config.horarioInicio, config.horarioFim, config.duracaoSlot);

  // Busca horários já ocupados (marcado ou confirmado)
  const ocupados = await prisma.agendamento.findMany({
    where: {
      tenantId,
      data: dateStr,
      status: { in: ['marcado', 'confirmado'] },
    },
    select: { hora: true },
  });
  const horariosOcupados = new Set(ocupados.map(a => a.hora.substring(0, 5)));

  // Se a data é hoje, filtra slots que já passaram (considerando antecedência mínima em horas)
  const isHoje = dataSolicitada.getTime() === hoje.getTime();
  const horaLimite = isHoje
    ? agora.getTime() + config.antecedenciaMin * 60 * 60 * 1000
    : null;

  const slotsDisponiveis = todosSlots.filter(slot => {
    if (horariosOcupados.has(slot)) return false;
    if (horaLimite) {
      const [h, m] = slot.split(':').map(Number);
      const slotDate = new Date(year, month - 1, day, h, m);
      if (slotDate.getTime() < horaLimite) return false;
    }
    return true;
  });

  return { slots: slotsDisponiveis };
}

/**
 * Gera array de horários HH:MM entre início e fim com intervalos de duracaoMin.
 */
function gerarSlots(inicio, fim, duracaoMin) {
  const slots = [];
  const [hIni, mIni] = inicio.split(':').map(Number);
  const [hFim, mFim] = fim.split(':').map(Number);
  let atual = hIni * 60 + mIni;
  const fimMin = hFim * 60 + mFim;

  while (atual < fimMin) {
    const h = Math.floor(atual / 60);
    const m = atual % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    atual += duracaoMin;
  }
  return slots;
}

module.exports = { getSlots };
